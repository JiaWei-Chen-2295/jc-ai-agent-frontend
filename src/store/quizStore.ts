import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { QuestionVO } from '@/api/models/QuestionVO';
import type { KnowledgeCoverageVO } from '@/api/models/KnowledgeCoverageVO';
import * as quizApi from '@/features/quiz/quizApi';

export interface QuizState {
    sessionId: string | null;
    sessionStatus: 'IDLE' | 'LOADING' | 'IN_PROGRESS' | 'COMPLETED' | 'ERROR' | 'PAUSED';
    currentQuestion: QuestionVO | null;
    questions: QuestionVO[]; // May just keep track of history or current
    // In dynamic quiz, we might only have "current" and "next". 
    // But let's keep array for history review if needed, or simplfy to current.
    // Design says "Response -> feedback -> Next".

    answers: Record<string, any>; // local cache of answers if needed

    // 知识覆盖度状态
    knowledgeCoverage: KnowledgeCoverageVO | null;

    // Actions
    startNewSession: (_documentIds: number[]) => Promise<void>;
    submitAnswer: (_answer: any) => Promise<void>; // Submit current question answer
    fetchNextQuestion: () => Promise<void>;
    setAnswer: (_questionId: string, _answer: any) => void;
    resetQuiz: () => void;
    pauseQuiz: () => Promise<void>;
    resumeQuiz: () => Promise<void>;
    abandonQuiz: () => Promise<void>;

    // 知识覆盖度
    fetchKnowledgeCoverage: () => Promise<void>;

    // 继续测验相关
    continueSession: (_sessionId: string) => Promise<void>;
    checkAndResumeSession: () => Promise<void>;

    // Computed helpers could be selectors but simple getters work
}

export const useQuizStore = create<QuizState>()(
    persist(
        (set, get) => ({
            sessionId: null,
            sessionStatus: 'IDLE',
            currentQuestion: null,
            questions: [],
            answers: {},
            knowledgeCoverage: null,

            startNewSession: async (documentIds) => {
                console.log('[quizStore] startNewSession called with documentIds:', documentIds);
                set({ sessionStatus: 'LOADING' });
                try {
                    console.log('[quizStore] Calling quizApi.startAdaptiveQuiz...');
                    const response = await quizApi.startAdaptiveQuiz(documentIds);
                    console.log('[quizStore] API response:', response);

                    if (response.code === 0 && response.data && response.data.sessionId) {
                        set({
                            sessionId: response.data.sessionId,
                            sessionStatus: 'IN_PROGRESS',
                            currentQuestion: response.data.firstQuestion || null,
                            questions: response.data.firstQuestion ? [response.data.firstQuestion] : []
                        });
                    } else {
                        set({ sessionStatus: 'ERROR' }); // or handle specific code
                    }
                } catch (error) {
                    console.error('Failed to start session:', error);
                    set({ sessionStatus: 'ERROR' });
                }
            },

            submitAnswer: async (answer) => {
                const { sessionId, currentQuestion } = get();
                if (!sessionId || !currentQuestion?.id) return;

                set({ sessionStatus: 'LOADING' });
                try {
                    const finalAnswer = typeof answer === 'string' ? answer : JSON.stringify(answer);

                    // 1. 提交答案
                    const response = await quizApi.submitQuizAnswer(sessionId, {
                        questionId: currentQuestion.id,
                        answer: finalAnswer,
                        responseTimeMs: 0 // Optional, tracked in future
                    });

                    // 2. 根据响应处理下一步
                    if (response.code === 0 && response.data) {
                        const { hasNextQuestion, nextQuestion, quizCompleted } = response.data;

                        // 测验已完成
                        if (quizCompleted) {
                            set({
                                sessionStatus: 'COMPLETED',
                                currentQuestion: null
                            });
                            return;
                        }

                        // 如果响应中直接包含下一题，直接使用
                        if (nextQuestion?.id) {
                            set((state) => ({
                                currentQuestion: nextQuestion,
                                questions: [...state.questions, nextQuestion],
                                sessionStatus: 'IN_PROGRESS'
                            }));
                            return;
                        }

                        // 如果有下一题但响应中没有包含，调用 /next 接口获取
                        if (hasNextQuestion) {
                            await get().fetchNextQuestion();
                            return;
                        }

                        // 没有下一题，测验完成
                        set({
                            sessionStatus: 'COMPLETED',
                            currentQuestion: null
                        });
                    } else {
                        // 响应异常，回退到获取下一题
                        await get().fetchNextQuestion();
                    }

                } catch (error) {
                    console.error('Failed to submit answer:', error);
                    set({ sessionStatus: 'ERROR' });
                }
            },

            fetchNextQuestion: async () => {
                const { sessionId } = get();
                if (!sessionId) return;

                set({ sessionStatus: 'LOADING' });
                try {
                    const nextQResponse = await quizApi.getNextQuestion(sessionId);

                    if (nextQResponse.code === 0 && nextQResponse.data && nextQResponse.data.id) {
                        const nextQ = nextQResponse.data;
                        set((state) => ({
                            currentQuestion: nextQ,
                            questions: [...state.questions, nextQ],
                            sessionStatus: 'IN_PROGRESS'
                        }));
                    } else {
                        // Check if session completed
                        const statusResponse = await quizApi.getQuizSessionStatus(sessionId);
                        if (statusResponse.code === 0 && statusResponse.data?.status === 'COMPLETED') {
                            set({ sessionStatus: 'COMPLETED', currentQuestion: null });
                        } else {
                            // Maybe just no more questions temporarily or error?
                            // For now assume completed if no next question
                            set({ sessionStatus: 'COMPLETED', currentQuestion: null });
                        }
                    }
                } catch (error) {
                    // If error is 404 or specific, maybe session ended.
                    console.error('Failed to get next question', error);
                    set({ sessionStatus: 'ERROR' });
                }
            },

            setAnswer: (questionId, answer) => set((state) => ({
                answers: { ...state.answers, [questionId]: answer }
            })),

            resetQuiz: () => set({
                sessionId: null,
                sessionStatus: 'IDLE',
                currentQuestion: null,
                questions: [],
                answers: {},
                knowledgeCoverage: null
            }),

            pauseQuiz: async () => {
                const { sessionId } = get();
                if (!sessionId) return;

                try {
                    await quizApi.pauseQuiz(sessionId);
                    set({ sessionStatus: 'PAUSED' });
                } catch (error) {
                    console.error('Failed to pause quiz:', error);
                }
            },

            resumeQuiz: async () => {
                const { sessionId } = get();
                if (!sessionId) return;

                try {
                    await quizApi.resumeQuiz(sessionId);
                    set({ sessionStatus: 'IN_PROGRESS' });
                } catch (error) {
                    console.error('Failed to resume quiz:', error);
                }
            },

            abandonQuiz: async () => {
                const { sessionId } = get();
                if (!sessionId) return;

                try {
                    await quizApi.abandonQuiz(sessionId);
                    set({
                        sessionId: null,
                        sessionStatus: 'IDLE',
                        currentQuestion: null,
                        questions: [],
                        answers: {},
                        knowledgeCoverage: null
                    });
                } catch (error) {
                    console.error('Failed to abandon quiz:', error);
                }
            },

            /**
             * 获取知识覆盖度
             */
            fetchKnowledgeCoverage: async () => {
                const { sessionId } = get();
                if (!sessionId) return;

                try {
                    const response = await quizApi.getKnowledgeCoverage(sessionId);
                    if (response.code === 0 && response.data) {
                        set({ knowledgeCoverage: response.data });
                    }
                } catch (error) {
                    console.error('Failed to fetch knowledge coverage:', error);
                }
            },

            /**
             * 从历史记录继续一个进行中的测验
             * 加载会话详情，恢复到答题界面
             */
            continueSession: async (sessionId: string) => {
                set({ sessionStatus: 'LOADING' });
                try {
                    // 1. 获取会话详情（包含所有题目和答题记录）
                    const detailResponse = await quizApi.getQuizSessionDetail(sessionId);

                    if (detailResponse.code !== 0 || !detailResponse.data) {
                        console.error('Failed to get session detail:', detailResponse);
                        set({ sessionStatus: 'ERROR' });
                        return;
                    }

                    const { session, questions, responses } = detailResponse.data;

                    // 2. 如果会话是暂停状态，先恢复它
                    if (session?.status === 'PAUSED') {
                        await quizApi.resumeQuiz(sessionId);
                    }

                    // 3. 检查会话是否已完成
                    if (session?.status === 'COMPLETED') {
                        set({
                            sessionId,
                            sessionStatus: 'COMPLETED',
                            currentQuestion: null,
                            questions: questions || []
                        });
                        return;
                    }

                    // 4. 找到当前应该作答的题目
                    // 方案：根据答题记录找出未回答的第一道题
                    const answeredIds = new Set(
                        (responses || []).map(r => r.questionId).filter(Boolean)
                    );

                    // 从题目列表中找第一道未答题目
                    const sortedQuestions = [...(questions || [])].sort(
                        (a, b) => (a.questionNo || 0) - (b.questionNo || 0)
                    );

                    let currentQuestion = sortedQuestions.find(
                        q => q.id && !answeredIds.has(q.id)
                    ) || null;

                    // 5. 如果找不到未答题目，尝试获取下一题（可能是动态生成的）
                    if (!currentQuestion) {
                        const nextQResponse = await quizApi.getNextQuestion(sessionId);
                        if (nextQResponse.code === 0 && nextQResponse.data?.id) {
                            currentQuestion = nextQResponse.data;
                        }
                    }

                    // 6. 设置状态
                    if (currentQuestion) {
                        set({
                            sessionId,
                            sessionStatus: 'IN_PROGRESS',
                            currentQuestion,
                            questions: questions || [],
                            answers: {} // 重置本地答案缓存
                        });
                    } else {
                        // 没有更多题目，会话完成
                        set({
                            sessionId,
                            sessionStatus: 'COMPLETED',
                            currentQuestion: null,
                            questions: questions || []
                        });
                    }
                } catch (error) {
                    console.error('Failed to continue session:', error);
                    set({ sessionStatus: 'ERROR' });
                }
            },

            /**
             * 页面刷新后检查并恢复会话
             * 如果 localStorage 中有 sessionId 且状态是 IDLE，尝试恢复
             */
            checkAndResumeSession: async () => {
                const { sessionId, sessionStatus } = get();

                // 仅当有 sessionId 且当前状态是 IDLE/PAUSED 时才恢复
                if (sessionId && (sessionStatus === 'IDLE' || sessionStatus === 'PAUSED')) {
                    await get().continueSession(sessionId);
                }
            },
        }),
        {
            name: 'quiz-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
