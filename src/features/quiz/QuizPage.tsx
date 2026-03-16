import { useState, useEffect } from 'react';
import { useQuizStore } from '@/store/quizStore';
import { QuestionRenderer } from '@/components/quiz/QuestionRenderer';
import { NeonButton } from '@/components/quiz/NeonButton';
import { QuizSetup } from '@/components/quiz/QuizSetup';
import { QuizNav } from '@/components/quiz/QuizNav';
import { KnowledgeCoverageBar } from '@/components/quiz/KnowledgeCoverageBar';
import { Icon } from '@iconify/react';
import { message } from 'antd';

export const QuizPage = () => {
    const {
        currentQuestion,
        sessionStatus,
        sessionId,
        answers,
        submitAnswer,
        resetQuiz,
        pauseQuiz,
        resumeQuiz,
        abandonQuiz,
        checkAndResumeSession,
        knowledgeCoverage,
        fetchKnowledgeCoverage
    } = useQuizStore();

    // 页面加载时检查并恢复未完成的会话
    useEffect(() => {
        // 仅当有 sessionId 且状态为 IDLE 时尝试恢复（说明是页面刷新）
        if (sessionId && sessionStatus === 'IDLE') {
            checkAndResumeSession();
        }
    }, []);

    // 当 sessionId 变化且状态为 IN_PROGRESS 时，获取知识覆盖度
    useEffect(() => {
        if (sessionId && sessionStatus === 'IN_PROGRESS') {
            setCoverageLoading(true);
            fetchKnowledgeCoverage().finally(() => setCoverageLoading(false));
        }
    }, [sessionId, sessionStatus]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [coverageLoading, setCoverageLoading] = useState(false);
    // const [startTime, setStartTime] = useState(Date.now()); // 预留给未来的响应时间统计

    // 重置计时器（预留功能）
    // useEffect(() => {
    //     if (currentQuestion?.id) {
    //         setStartTime(Date.now());
    //     }
    // }, [currentQuestion?.id]);

    const handleNext = async () => {
        if (!currentQuestion?.id || !answers[currentQuestion.id]) {
            message.warning('请先作答');
            return;
        }

        setIsSubmitting(true);
        try {
            await submitAnswer(answers[currentQuestion.id]);
            // 提交答案后刷新知识覆盖度
            fetchKnowledgeCoverage();
        } catch (error) {
            message.error('提交失败，请重试');
            console.error('Submit error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePause = async () => {
        await pauseQuiz();
        message.success('测验已暂停');
    };

    const handleResume = async () => {
        await resumeQuiz();
        message.success('测验已恢复');
    };

    const handleAbandon = async () => {
        await abandonQuiz();
        message.info('已退出测验');
    };

    const hasAnswer = currentQuestion?.id ? !!answers[currentQuestion.id] : false;

    // Render Logic
    if (sessionStatus === 'IDLE' || sessionStatus === 'ERROR' || sessionStatus === null) {
        return (
            <div className="min-h-screen bg-transparent p-4 md:p-8 flex flex-col max-w-5xl mx-auto">
                <QuizNav />
                <main className="flex-1 flex flex-col justify-center">
                    {sessionStatus === 'ERROR' && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/50 text-red-400 text-center">
                            <Icon icon="lucide:alert-circle" width={24} className="inline mb-1" />
                            <span className="ml-2">加载失败，请重试</span>
                        </div>
                    )}
                    <QuizSetup />
                </main>
            </div>
        );
    }

    if (sessionStatus === 'COMPLETED') {
        return (
            <div className="min-h-screen bg-transparent p-4 md:p-8 flex flex-col max-w-4xl mx-auto items-center justify-center space-y-8">
                <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center text-primary animate-bounce">
                    <Icon icon="lucide:trophy" width={48} />
                </div>

                <div className="text-center space-y-3">
                    <h2 className="text-5xl font-display font-bold text-white drop-shadow-neon">
                        测验完成！
                    </h2>
                    <p className="text-text-muted text-lg max-w-md mx-auto">
                        恭喜你完成了本次测验。你的表现数据已经记录，可以在学习分析页面查看详细报告。
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
                    <div className="bg-surface-dark/50 border border-surface-border rounded-xl p-6 text-center">
                        <Icon icon="lucide:target" width={32} className="text-primary mx-auto mb-2" />
                        <div className="text-3xl font-bold text-white mb-1">完成</div>
                        <div className="text-sm text-text-muted">状态</div>
                    </div>
                    <div className="bg-surface-dark/50 border border-surface-border rounded-xl p-6 text-center">
                        <Icon icon="lucide:brain" width={32} className="text-blue-400 mx-auto mb-2" />
                        <div className="text-3xl font-bold text-white mb-1">查看</div>
                        <div className="text-sm text-text-muted">学习分析</div>
                    </div>
                    <div className="bg-surface-dark/50 border border-surface-border rounded-xl p-6 text-center">
                        <Icon icon="lucide:history" width={32} className="text-yellow-400 mx-auto mb-2" />
                        <div className="text-3xl font-bold text-white mb-1">历史</div>
                        <div className="text-sm text-text-muted">测验记录</div>
                    </div>
                </div>

                <div className="flex gap-4 flex-wrap justify-center">
                    <NeonButton
                        onClick={resetQuiz}
                        className="w-48 flex items-center justify-center gap-2"
                    >
                        <Icon icon="lucide:refresh-cw" width={18} />
                        开始新测验
                    </NeonButton>
                    <NeonButton
                        variant="ghost"
                        onClick={() => window.location.href = '/quiz/analysis'}
                        className="w-48 flex items-center justify-center gap-2"
                    >
                        <Icon icon="lucide:bar-chart" width={18} />
                        查看分析
                    </NeonButton>
                </div>
            </div>
        );
    }

    if (!currentQuestion && sessionStatus !== 'PAUSED') {
        return (
            <div className="min-h-screen flex items-center justify-center text-text-muted bg-transparent">
                <div className="flex flex-col items-center gap-4">
                    <Icon icon="svg-spinners:ring-resize" width={40} className="text-primary" />
                    <p>Loading Question...</p>
                </div>
            </div>
        );
    }

    // 处理 PAUSED 状态且无题目的情况
    if (!currentQuestion) {
        return (
            <div className="min-h-screen flex items-center justify-center text-text-muted bg-transparent">
                <div className="flex flex-col items-center gap-4">
                    <Icon icon="lucide:pause-circle" width={40} className="text-orange-400" />
                    <p>测验已暂停</p>
                    <NeonButton onClick={resumeQuiz}>继续测验</NeonButton>
                </div>
            </div>
        );
    }

    // IN_PROGRESS
    return (
        <div className="min-h-screen bg-transparent p-4 md:p-8 flex flex-col max-w-6xl mx-auto" key={currentQuestion.id}>
            {/* Header / Nav */}
            <header className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
                        <Icon icon="lucide:zap" width={24} />
                    </div>
                    <span className="font-display font-bold text-xl tracking-tight text-white">NeonQuiz</span>
                </div>
                <NeonButton variant="ghost" className="text-sm" onClick={resetQuiz}>
                    Exit Quiz
                </NeonButton>
            </header>

            {/* Main Content with Sidebar */}
            <div className="flex-1 flex gap-6">
                {/* Question Area */}
                <main className="flex-1 flex flex-col justify-center min-w-0">
                    <QuestionRenderer question={currentQuestion} />
                </main>

                {/* Knowledge Coverage Sidebar */}
                <aside className="hidden lg:block w-64 flex-shrink-0">
                    <div className="sticky top-8">
                        <KnowledgeCoverageBar
                            coverage={knowledgeCoverage}
                            loading={coverageLoading}
                            compact
                        />
                    </div>
                </aside>
            </div>

            {/* Mobile Knowledge Coverage (below question on smaller screens) */}
            <div className="lg:hidden mt-4">
                <KnowledgeCoverageBar
                    coverage={knowledgeCoverage}
                    loading={coverageLoading}
                    compact
                />
            </div>

            {/* Footer / Controls */}
            <footer className="mt-8 py-6 border-t border-surface-border flex justify-between items-center backdrop-blur-sm bg-background-dark/80 sticky bottom-0 z-10 rounded-xl px-4">
                <div className="flex-1">
                    {/* 答题进度提示 */}
                    {currentQuestion && (
                        <div className="text-text-muted text-sm flex items-center gap-2">
                            <Icon icon="lucide:clock" width={16} />
                            <span>第 {currentQuestion.questionNo || '?'} 题</span>
                        </div>
                    )}
                </div>

                <div className="text-text-muted text-sm hidden md:block">
                    {hasAnswer ? '✓ 已作答' : '请选择答案'}
                </div>

                <div className="flex-1 flex justify-end gap-3">
                    {sessionStatus === 'PAUSED' ? (
                        <NeonButton
                            onClick={handleResume}
                            className="w-24"
                        >
                            恢复
                        </NeonButton>
                    ) : (
                        <NeonButton
                            variant="ghost"
                            onClick={handlePause}
                            className="w-24"
                            disabled={isSubmitting}
                        >
                            暂停
                        </NeonButton>
                    )}
                    <NeonButton
                        variant="ghost"
                        onClick={handleAbandon}
                        className="w-24"
                        disabled={isSubmitting}
                    >
                        退出
                    </NeonButton>
                    <NeonButton
                        onClick={handleNext}
                        className="w-32"
                        disabled={!hasAnswer || sessionStatus === 'LOADING' || sessionStatus === 'PAUSED' || isSubmitting}
                    >
                        {isSubmitting || sessionStatus === 'LOADING' ? (
                            <span className="flex items-center gap-2">
                                <Icon icon="svg-spinners:ring-resize" width={18} />
                                提交中
                            </span>
                        ) : '下一题'}
                    </NeonButton>
                </div>
            </footer>
        </div>
    );
};
