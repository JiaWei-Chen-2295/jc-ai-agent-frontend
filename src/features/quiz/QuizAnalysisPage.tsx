import { useState, useEffect } from 'react';
import type { UserCognitiveStateVO } from '@/api/models/UserCognitiveStateVO';
import type { KnowledgeGapVO } from '@/api/models/KnowledgeGapVO';
import { NeonCard } from '@/components/quiz/NeonCard';
import { QuizNav } from '@/components/quiz/QuizNav';
import { Icon } from '@iconify/react';
import { message } from 'antd';
import * as quizApi from './quizApi';

export const QuizAnalysisPage = () => {
    const [cognitiveState, setCognitiveState] = useState<UserCognitiveStateVO | null>(null);
    const [knowledgeGaps, setKnowledgeGaps] = useState<KnowledgeGapVO[]>([]);
    const [loading, setLoading] = useState(true);

    // 获取当前用户ID（从认证上下文或localStorage）
    const getUserId = () => {
        // TODO: 从实际认证系统获取
        return localStorage.getItem('userId') || '1';
    };

    // 加载分析数据
    useEffect(() => {
        loadAnalysisData();
    }, []);

    const loadAnalysisData = async () => {
        setLoading(true);
        const userId = getUserId();
        try {
            // 加载认知状态
            const stateResponse = await quizApi.getUserCognitiveState(Number(userId));
            if (stateResponse.code === 0 && stateResponse.data) {
                setCognitiveState(stateResponse.data);
            }

            // 加载知识缺口
            const gapsResponse = await quizApi.getUserKnowledgeGaps(Number(userId), {});
            if (gapsResponse.code === 0 && gapsResponse.data) {
                setKnowledgeGaps(gapsResponse.data.list || []);
            }
        } catch (error) {
            console.error('加载分析数据失败', error);
            message.error('加载分析数据失败');
        } finally {
            setLoading(false);
        }
    };

    // 标记知识缺口已解决
    const handleResolveGap = async (gapId: string) => {
        try {
            await quizApi.markGapAsResolved(gapId);
            message.success('已标记为已解决');
            loadAnalysisData(); // 重新加载数据
        } catch (error) {
            console.error('标记失败', error);
            message.error('标记失败');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-transparent">
                <Icon icon="svg-spinners:ring-resize" width={40} className="text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent p-4 md:p-8 max-w-6xl mx-auto">
            {/* 统一导航 */}
            <QuizNav
                title="学习分析"
                subtitle="基于三维认知模型的个性化学习分析"
            />

            {/* 三维认知模型 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
                <MetricCard
                    icon="lucide:brain"
                    label="理解深度"
                    value={cognitiveState?.avgUnderstandingDepth || 0}
                    color="primary"
                    threshold={70}
                    description="概念理解和应用能力"
                />
                <MetricCard
                    icon="lucide:zap"
                    label="认知负荷"
                    value={cognitiveState?.avgCognitiveLoad || 0}
                    color="yellow"
                    threshold={40}
                    isReversed
                    description="答题难度和思考负担"
                />
                <MetricCard
                    icon="lucide:target"
                    label="稳定性"
                    value={cognitiveState?.avgStability || 0}
                    color="blue"
                    threshold={70}
                    description="知识掌握的稳定性"
                />
            </div>

            {/* 知识缺口列表 */}
            <NeonCard className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Icon icon="lucide:alert-triangle" width={24} className="text-yellow-400" />
                    <h2 className="text-2xl font-bold text-white">知识缺口分析</h2>
                </div>

                {knowledgeGaps.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Icon icon="lucide:check-circle" width={32} className="text-primary" />
                        </div>
                        <p className="text-text-muted text-lg">太棒了！目前没有发现明显的知识缺口</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {knowledgeGaps.map((gap, index) => (
                            <GapCard key={index} gap={gap} onResolve={handleResolveGap} />
                        ))}
                    </div>
                )}
            </NeonCard>
        </div>
    );
};

// 指标卡片
const MetricCard = ({
    icon,
    label,
    value,
    color,
    threshold,
    isReversed = false,
    description
}: {
    icon: string;
    label: string;
    value: number;
    color: 'primary' | 'yellow' | 'blue';
    threshold: number;
    isReversed?: boolean;
    description: string;
}) => {
    const isGood = isReversed ? value <= threshold : value >= threshold;
    const colorClass = {
        primary: 'text-primary border-primary bg-primary/5',
        yellow: 'text-yellow-400 border-yellow-400 bg-yellow-400/5',
        blue: 'text-blue-400 border-blue-400 bg-blue-400/5'
    }[color];

    const progressColor = {
        primary: 'bg-primary',
        yellow: 'bg-yellow-400',
        blue: 'bg-blue-400'
    }[color];

    return (
        <NeonCard className={`p-6 border-2 ${isGood ? colorClass : 'border-surface-border'} transition-all`}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <Icon icon={icon} width={28} className={isGood ? colorClass.split(' ')[0] : 'text-text-muted'} />
                    <div>
                        <h3 className="text-lg font-bold text-white">{label}</h3>
                        <p className="text-xs text-text-muted mt-1">{description}</p>
                    </div>
                </div>
            </div>

            <div className="mb-3">
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-display font-bold text-white">{value}</span>
                    <span className="text-text-muted">/100</span>
                </div>
            </div>

            {/* 进度条 */}
            <div className="w-full h-2 bg-surface-dark rounded-full overflow-hidden">
                <div
                    className={`h-full ${progressColor} transition-all duration-500`}
                    style={{ width: `${value}%` }}
                />
            </div>
        </NeonCard>
    );
};

// 知识缺口卡片
const GapCard = ({ gap, onResolve }: { gap: KnowledgeGapVO; onResolve: (_gapId: string) => void }) => {
    const severityConfig = {
        HIGH: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/50', label: '严重' },
        MEDIUM: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/50', label: '中等' },
        LOW: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/50', label: '轻微' }
    }[gap.severity || 'MEDIUM'];

    return (
        <div className={`p-4 rounded-xl border ${severityConfig.border} ${severityConfig.bg}`}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-bold text-white">{gap.conceptName}</h4>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${severityConfig.color}`}>
                            {severityConfig.label}
                        </span>
                    </div>
                    <p className="text-text-muted text-sm">{gap.gapDescription}</p>
                </div>
                {gap.id && (
                    <button
                        onClick={() => onResolve(gap.id!)}
                        className="ml-3 px-3 py-1.5 rounded-lg border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 transition-all text-xs font-medium flex items-center gap-1"
                    >
                        <Icon icon="lucide:check" width={14} />
                        已解决
                    </button>
                )}
            </div>

            {gap.rootCause && (
                <div className="mt-3 pt-3 border-t border-surface-border/50">
                    <p className="text-sm text-text-muted flex items-start gap-2">
                        <Icon icon="lucide:lightbulb" width={16} className="text-primary mt-0.5 flex-shrink-0" />
                        <span>{gap.rootCause}</span>
                    </p>
                </div>
            )}
        </div>
    );
};
