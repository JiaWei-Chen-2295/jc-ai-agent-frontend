import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { Icon } from '@iconify/react';
import { NeonCard } from '@/components/quiz/NeonCard';
import { NeonButton } from '@/components/quiz/NeonButton';
import { QuizNav } from '@/components/quiz/QuizNav';
import type { QuizSessionDetailVO } from '@/api/models/QuizSessionDetailVO';
import * as quizApi from './quizApi';

export const QuizSessionDetailPage = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const [sessionDetail, setSessionDetail] = useState<QuizSessionDetailVO | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!sessionId) {
            message.error('会话ID不存在');
            navigate('/quiz/history');
            return;
        }
        loadSessionDetail();
    }, [sessionId]);

    const loadSessionDetail = async () => {
        if (!sessionId) return;

        setLoading(true);
        try {
            const response = await quizApi.getQuizSessionDetail(sessionId);
            if (response.code === 0 && response.data) {
                setSessionDetail(response.data);
            } else {
                message.error('加载失败');
                navigate('/quiz/history');
            }
        } catch (error) {
            console.error('加载会话详情失败', error);
            message.error('加载失败');
            navigate('/quiz/history');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-transparent">
                <Icon icon="svg-spinners:ring-resize" width={40} className="text-primary" />
            </div>
        );
    }

    if (!sessionDetail) {
        return null;
    }

    return (
        <div className="min-h-screen bg-transparent p-4 md:p-8 max-w-5xl mx-auto">
            {/* 统一导航（带返回按钮） */}
            <QuizNav
                title="会话详情"
                subtitle={`Session ID: ${sessionId}`}
                showBackButton
                backPath="/quiz/history"
                rightContent={
                    sessionDetail.session?.status === 'COMPLETED' && (
                        <NeonButton
                            onClick={() => navigate(`/quiz/report/${sessionId}`)}
                            className="flex items-center gap-2"
                        >
                            <Icon icon="lucide:bar-chart" width={18} />
                            查看报告
                        </NeonButton>
                    )
                }
            />

            {/* 会话概览 */}
            <NeonCard className="p-6 mb-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Icon icon="lucide:info" width={24} className="text-primary" />
                    会话概览
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-surface-dark/30 rounded-lg p-4">
                        <div className="text-text-muted text-sm mb-1">状态</div>
                        <div className="text-white text-lg font-bold">
                            {sessionDetail.session?.status === 'COMPLETED' && '已完成'}
                            {sessionDetail.session?.status === 'IN_PROGRESS' && '进行中'}
                            {sessionDetail.session?.status === 'PAUSED' && '已暂停'}
                            {sessionDetail.session?.status === 'ABANDONED' && '已放弃'}
                            {sessionDetail.session?.status === 'TIMEOUT' && '超时'}
                        </div>
                    </div>
                    <div className="bg-surface-dark/30 rounded-lg p-4">
                        <div className="text-text-muted text-sm mb-1">测验模式</div>
                        <div className="text-white text-lg font-bold">
                            {sessionDetail.session?.quizMode || 'ADAPTIVE'}
                        </div>
                    </div>
                    <div className="bg-surface-dark/30 rounded-lg p-4">
                        <div className="text-text-muted text-sm mb-1">总题数</div>
                        <div className="text-white text-lg font-bold">
                            {sessionDetail.session?.totalQuestions || 0}
                        </div>
                    </div>
                </div>

                {sessionDetail.session?.score !== undefined && (
                    <div className="mt-4 bg-primary/10 border border-primary/30 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-white font-medium">得分</span>
                            <span className="text-primary text-2xl font-bold">
                                {sessionDetail.session?.score}
                            </span>
                        </div>
                    </div>
                )}

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sessionDetail.session?.startedAt && (
                        <div>
                            <div className="text-text-muted text-sm">开始时间</div>
                            <div className="text-white">
                                {new Date(sessionDetail.session.startedAt).toLocaleString('zh-CN')}
                            </div>
                        </div>
                    )}
                    {sessionDetail.session?.completedAt && (
                        <div>
                            <div className="text-text-muted text-sm">完成时间</div>
                            <div className="text-white">
                                {new Date(sessionDetail.session.completedAt).toLocaleString('zh-CN')}
                            </div>
                        </div>
                    )}
                </div>
            </NeonCard>

            {/* 问题列表 */}
            {sessionDetail.questions && sessionDetail.questions.length > 0 && (
                <NeonCard className="p-6">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Icon icon="lucide:list" width={24} className="text-primary" />
                        题目列表 ({sessionDetail.questions.length})
                    </h2>
                    <div className="space-y-3">
                        {sessionDetail.questions.map((question, index) => (
                            <div
                                key={question.id || index}
                                className="bg-surface-dark/30 rounded-lg p-4 border border-surface-border"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-white font-medium mb-2">
                                            {question.questionText}
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <span className="text-text-muted">
                                                类型: {question.questionType}
                                            </span>
                                            <span className="text-text-muted">
                                                难度: {question.difficulty}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </NeonCard>
            )}
        </div>
    );
};
