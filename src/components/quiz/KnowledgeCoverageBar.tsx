import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import type { KnowledgeCoverageVO } from '@/api/models/KnowledgeCoverageVO';
import type { ConceptDetail } from '@/api/models/ConceptDetail';

interface KnowledgeCoverageBarProps {
    coverage: KnowledgeCoverageVO | null;
    loading?: boolean;
    compact?: boolean; // 紧凑模式，用于侧边栏
}

/**
 * 知识覆盖度展示组件
 * 在测验页面展示当前的知识覆盖情况
 */
export const KnowledgeCoverageBar = ({ coverage, loading, compact = false }: KnowledgeCoverageBarProps) => {
    if (loading) {
        return (
            <div className={cn(
                "bg-surface-dark/50 border border-surface-border rounded-lg animate-pulse",
                compact ? "p-3" : "p-4"
            )}>
                <div className="h-4 bg-surface-border rounded w-24 mb-2"></div>
                <div className="h-2 bg-surface-border rounded w-full"></div>
            </div>
        );
    }

    if (!coverage) {
        return null;
    }

    const {
        totalConcepts = 0,
        testedConcepts = 0,
        masteredConcepts = 0,
        coveragePercent = 0,
        masteryPercent = 0,
        answeredQuestions = 0,
        concepts = []
    } = coverage;

    if (compact) {
        return (
            <div className="bg-surface-dark/50 border border-surface-border rounded-lg p-3 space-y-3">
                {/* 标题 */}
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white flex items-center gap-2">
                        <Icon icon="lucide:target" width={16} className="text-primary" />
                        知识覆盖
                    </span>
                    <span className="text-primary font-bold">{Math.round(coveragePercent)}%</span>
                </div>

                {/* 进度条 */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-text-muted">
                        <span>已测 {testedConcepts}/{totalConcepts}</span>
                        <span>掌握 {masteredConcepts}</span>
                    </div>
                    <div className="flex gap-1 h-2">
                        {/* 已掌握 - 绿色 */}
                        <div
                            className="bg-primary rounded-l transition-all duration-500"
                            style={{ width: `${masteryPercent}%` }}
                        />
                        {/* 已测但未掌握 - 黄色 */}
                        <div
                            className="bg-yellow-400 transition-all duration-500"
                            style={{ width: `${coveragePercent - masteryPercent}%` }}
                        />
                        {/* 未测 - 灰色 */}
                        <div
                            className="bg-surface-border flex-1 rounded-r"
                        />
                    </div>
                </div>

                {/* 概念状态快速查看 */}
                {concepts.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {concepts.slice(0, 6).map((concept, index) => (
                            <ConceptChip key={index} concept={concept} />
                        ))}
                        {concepts.length > 6 && (
                            <span className="text-xs text-text-muted">+{concepts.length - 6}</span>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // 完整模式
    return (
        <div className="bg-surface-dark/50 border border-surface-border rounded-lg p-4 space-y-4">
            {/* 标题行 */}
            <div className="flex items-center justify-between">
                <h3 className="text-white font-medium flex items-center gap-2">
                    <Icon icon="lucide:brain" width={20} className="text-primary" />
                    知识覆盖度
                </h3>
                <span className="text-xs text-text-muted">
                    已答 {answeredQuestions} 题
                </span>
            </div>

            {/* 主要指标 */}
            <div className="grid grid-cols-2 gap-4">
                <MetricCard
                    icon="lucide:target"
                    label="覆盖率"
                    value={Math.round(coveragePercent)}
                    color="primary"
                    subLabel={`${testedConcepts}/${totalConcepts} 概念已测`}
                />
                <MetricCard
                    icon="lucide:award"
                    label="掌握率"
                    value={Math.round(masteryPercent)}
                    color="green"
                    subLabel={`${masteredConcepts} 概念已掌握`}
                />
            </div>

            {/* 进度条 */}
            <div className="space-y-2">
                <div className="flex h-3 rounded-full overflow-hidden bg-surface-border">
                    <div
                        className="bg-primary transition-all duration-500"
                        style={{ width: `${masteryPercent}%` }}
                        title="已掌握"
                    />
                    <div
                        className="bg-yellow-400 transition-all duration-500"
                        style={{ width: `${coveragePercent - masteryPercent}%` }}
                        title="学习中"
                    />
                </div>
                <div className="flex justify-between text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-primary rounded-full"></span>
                        已掌握
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                        学习中
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-surface-border rounded-full"></span>
                        未测试
                    </span>
                </div>
            </div>

            {/* 概念列表 */}
            {concepts.length > 0 && (
                <div className="space-y-2">
                    <span className="text-sm text-text-muted">概念详情</span>
                    <div className="flex flex-wrap gap-2">
                        {concepts.map((concept, index) => (
                            <ConceptTag key={index} concept={concept} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * 指标卡片
 */
const MetricCard = ({
    icon,
    label,
    value,
    color,
    subLabel
}: {
    icon: string;
    label: string;
    value: number;
    color: 'primary' | 'green';
    subLabel: string;
}) => {
    return (
        <div className="bg-surface-dark/50 rounded-lg p-3 text-center">
            <Icon
                icon={icon}
                width={20}
                className={cn(
                    "mx-auto mb-1",
                    color === 'primary' ? "text-primary" : "text-green-400"
                )}
            />
            <div className={cn(
                "text-xl font-bold",
                color === 'primary' ? "text-primary" : "text-green-400"
            )}>
                {value}%
            </div>
            <div className="text-sm text-white">{label}</div>
            <div className="text-xs text-text-muted">{subLabel}</div>
        </div>
    );
};

/**
 * 概念标签（完整版）
 */
const ConceptTag = ({ concept }: { concept: ConceptDetail }) => {
    const statusColors = {
        MASTERED: 'bg-primary/20 text-primary border-primary/30',
        TESTING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        UNTESTED: 'bg-surface-border/50 text-text-muted border-surface-border'
    };

    const colorClass = statusColors[concept.status as keyof typeof statusColors] || statusColors.UNTESTED;

    return (
        <div className={cn(
            "px-2 py-1 rounded-md text-xs border flex items-center gap-1",
            colorClass
        )}>
            <span>{concept.name}</span>
            {concept.understandingDepth !== undefined && concept.understandingDepth !== null && (
                <span className="opacity-70">({concept.understandingDepth}%)</span>
            )}
        </div>
    );
};

/**
 * 概念芯片（紧凑版）
 */
const ConceptChip = ({ concept }: { concept: ConceptDetail }) => {
    const statusColors = {
        MASTERED: 'bg-primary',
        TESTING: 'bg-yellow-400',
        UNTESTED: 'bg-surface-border'
    };

    const bgColor = statusColors[concept.status as keyof typeof statusColors] || statusColors.UNTESTED;

    return (
        <div
            className={cn("w-4 h-4 rounded-sm", bgColor)}
            title={`${concept.name}: ${concept.status === 'MASTERED' ? '已掌握' : concept.status === 'TESTING' ? '学习中' : '未测试'}`}
        />
    );
};

export default KnowledgeCoverageBar;
