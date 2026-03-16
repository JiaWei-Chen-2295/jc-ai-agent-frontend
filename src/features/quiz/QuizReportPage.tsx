import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { Icon } from '@iconify/react';
import { NeonCard } from '@/components/quiz/NeonCard';
import { QuizNav } from '@/components/quiz/QuizNav';
import type { SessionReportVO } from '@/api/models/SessionReportVO';
import * as quizApi from './quizApi';

export const QuizReportPage = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const [report, setReport] = useState<SessionReportVO | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!sessionId) {
            message.error('会话ID不存在');
            navigate('/quiz/history');
            return;
        }
        loadReport();
    }, [sessionId]);

    const loadReport = async () => {
        if (!sessionId) return;

        setLoading(true);
        try {
            const response = await quizApi.getSessionReport(sessionId);
            if (response.code === 0 && response.data) {
                setReport(response.data);
            } else {
                message.error('加载报告失败');
                navigate('/quiz/history');
            }
        } catch (error) {
            console.error('加载报告失败', error);
            message.error('加载报告失败');
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

    if (!report) {
        return null;
    }

    return (
        <div className="min-h-screen bg-transparent p-4 md:p-8 max-w-5xl mx-auto">
            {/* 统一导航（带返回按钮） */}
            <QuizNav
                title="测验报告"
                subtitle={`Session ID: ${sessionId}`}
                showBackButton
                backPath="/quiz/history"
            />

            {/* 成绩概览 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <NeonCard className="p-6 text-center">
                    <Icon icon="lucide:target" width={32} className="text-primary mx-auto mb-2" />
                    <div className="text-3xl font-bold text-white mb-1">
                        {report.accuracy?.toFixed(1) || 0}%
                    </div>
                    <div className="text-sm text-text-muted">正确率</div>
                </NeonCard>
                <NeonCard className="p-6 text-center">
                    <Icon icon="lucide:check-circle" width={32} className="text-green-400 mx-auto mb-2" />
                    <div className="text-3xl font-bold text-white mb-1">
                        {report.correctCount || 0}/{report.totalQuestions || 0}
                    </div>
                    <div className="text-sm text-text-muted">答对题数</div>
                </NeonCard>
                <NeonCard className="p-6 text-center">
                    <Icon icon="lucide:clock" width={32} className="text-blue-400 mx-auto mb-2" />
                    <div className="text-3xl font-bold text-white mb-1">
                        {report.durationSeconds ? Math.floor(report.durationSeconds / 60) : 0}
                    </div>
                    <div className="text-sm text-text-muted">用时(分钟)</div>
                </NeonCard>
                <NeonCard className="p-6 text-center">
                    <Icon icon="lucide:star" width={32} className="text-yellow-400 mx-auto mb-2" />
                    <div className="text-3xl font-bold text-white mb-1">
                        {report.totalScore || 0}
                    </div>
                    <div className="text-sm text-text-muted">总分</div>
                </NeonCard>
            </div>

            {/* 三维认知模型 */}
            <NeonCard className="p-6 mb-8">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Icon icon="lucide:brain" width={24} className="text-primary" />
                    三维认知分析
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <CognitiveMetric
                        icon="lucide:brain"
                        label="理解深度"
                        value={report.understandingDepth || 0}
                        color="primary"
                        description="概念理解程度"
                    />
                    <CognitiveMetric
                        icon="lucide:zap"
                        label="认知负荷"
                        value={report.cognitiveLoad || 0}
                        color="yellow"
                        description="答题难度感知"
                    />
                    <CognitiveMetric
                        icon="lucide:target"
                        label="稳定性"
                        value={report.stability || 0}
                        color="blue"
                        description="知识掌握稳定度"
                    />
                </div>
            </NeonCard>

            {/* 知识点分析 */}
            {report.conceptAnalyses && report.conceptAnalyses.length > 0 && (
                <NeonCard className="p-6 mb-8">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Icon icon="lucide:book-open" width={24} className="text-primary" />
                        知识点分析
                    </h2>
                    <div className="space-y-4">
                        {report.conceptAnalyses.map((conceptItem, index) => (
                            <div
                                key={index}
                                className="bg-surface-dark/30 rounded-lg p-4 border border-surface-border"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="text-white font-medium">{conceptItem.concept}</h3>
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${conceptItem.mastery === 'MASTERED' ? 'bg-green-500/20 text-green-400' :
                                        conceptItem.mastery === 'FAMILIAR' ? 'bg-blue-500/20 text-blue-400' :
                                            conceptItem.mastery === 'LEARNING' ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-red-500/20 text-red-400'
                                        }`}>
                                        {conceptItem.mastery === 'MASTERED' && '已掌握'}
                                        {conceptItem.mastery === 'FAMILIAR' && '熟悉'}
                                        {conceptItem.mastery === 'LEARNING' && '学习中'}
                                        {conceptItem.mastery === 'UNFAMILIAR' && '不熟悉'}
                                        {!conceptItem.mastery && '未知'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-text-muted">
                                    <span>题目数: {conceptItem.questionCount || 0}</span>
                                    <span>正确数: {conceptItem.correctCount || 0}</span>
                                    <span>正确率: {conceptItem.accuracy?.toFixed(1) || 0}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </NeonCard>
            )}

            {/* 改进建议 */}
            {report.suggestions && report.suggestions.length > 0 && (
                <NeonCard className="p-6">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Icon icon="lucide:lightbulb" width={24} className="text-primary" />
                        改进建议
                    </h2>
                    <div className="space-y-3">
                        {report.suggestions.map((suggestion, index) => (
                            <div
                                key={index}
                                className="flex items-start gap-3 bg-primary/5 rounded-lg p-4 border border-primary/20"
                            >
                                <Icon icon="lucide:arrow-right" width={18} className="text-primary mt-0.5 flex-shrink-0" />
                                <p className="text-white text-sm">{suggestion}</p>
                            </div>
                        ))}
                    </div>
                </NeonCard>
            )}
        </div>
    );
};

// 认知指标组件
const CognitiveMetric = ({
    icon,
    label,
    value,
    color,
    description
}: {
    icon: string;
    label: string;
    value: number;
    color: 'primary' | 'yellow' | 'blue';
    description: string;
}) => {
    const colorClass = {
        primary: 'text-primary',
        yellow: 'text-yellow-400',
        blue: 'text-blue-400'
    }[color];

    const bgColor = {
        primary: 'bg-primary',
        yellow: 'bg-yellow-400',
        blue: 'bg-blue-400'
    }[color];

    return (
        <div className="text-center">
            <Icon icon={icon} width={32} className={`${colorClass} mx-auto mb-3`} />
            <div className="text-2xl font-bold text-white mb-1">{value}</div>
            <div className="text-sm font-medium text-white mb-2">{label}</div>
            <div className="text-xs text-text-muted mb-3">{description}</div>
            <div className="w-full h-2 bg-surface-dark rounded-full overflow-hidden">
                <div
                    className={`h-full ${bgColor} transition-all duration-500`}
                    style={{ width: `${value}%` }}
                />
            </div>
        </div>
    );
};
