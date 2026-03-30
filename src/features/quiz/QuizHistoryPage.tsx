import { useState, useEffect } from 'react';
import type { QuizSessionVO } from '@/api/models/QuizSessionVO';
import { NeonCard } from '@/components/quiz/NeonCard';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import * as quizApi from './quizApi';
import { useQuizStore } from '@/store/quizStore';

type FilterType = 'ALL' | 'IN_PROGRESS' | 'COMPLETED';

export const QuizHistoryPage = () => {
    const navigate = useNavigate();
    const { continueSession } = useQuizStore();
    const [sessions, setSessions] = useState<QuizSessionVO[]>([]);
    const [filter, setFilter] = useState<FilterType>('ALL');
    const [loading, setLoading] = useState(true);
    const [continuingSessionId, setContinuingSessionId] = useState<string | null>(null);

    // 加载会话列表
    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        setLoading(true);
        try {
            const response = await quizApi.getQuizSessionList({
                status: filter === 'ALL' ? undefined : filter,
                pageNum: 1,
                pageSize: 100
            });
            if (response.code === 0 && response.data) {
                setSessions(response.data.list || []);
            }
        } catch (error) {
            console.error('加载历史失败', error);
            message.error('加载历史失败');
        } finally {
            setLoading(false);
        }
    };

    // 查看会话详情
    const handleViewDetail = async (sessionId: string) => {
        try {
            const response = await quizApi.getQuizSessionDetail(sessionId);
            if (response.code === 0 && response.data) {
                // TODO: 跳转到详情页或显示详情弹窗
                console.log('Session detail:', response.data);
                navigate(`/quiz/session/${sessionId}`);
            }
        } catch (error) {
            console.error('查看详情失败', error);
            message.error('查看详情失败');
        }
    };

    // 继续测验
    const handleContinue = async (sessionId: string) => {
        setContinuingSessionId(sessionId);
        try {
            await continueSession(sessionId);
            navigate('/quiz');
        } catch (error) {
            console.error('继续测验失败', error);
            message.error('继续测验失败');
        } finally {
            setContinuingSessionId(null);
        }
    };

    // 查看会话报告
    const handleViewReport = async (sessionId: string) => {
        try {
            const response = await quizApi.getSessionReport(sessionId);
            if (response.code === 0 && response.data) {
                // TODO: 跳转到报告页或显示报告弹窗
                console.log('Session report:', response.data);
                navigate(`/quiz/report/${sessionId}`);
            }
        } catch (error) {
            console.error('查看报告失败', error);
            message.error('查看报告失败');
        }
    };

    // 删除会话
    const handleDelete = async (id: string) => {
        try {
            await quizApi.deleteQuizSession(id);
            message.success('已删除');
            loadSessions();
        } catch (error) {
            console.error('删除失败', error);
            message.error('删除失败');
        }
    };

    // 筛选会话
    const filteredSessions = sessions.filter(session => {
        if (filter === 'ALL') return true;
        return session.status === filter;
    });

    return (
        <>
            {/* 筛选按钮 */}
            <div className="flex gap-3 mb-6">
                {(['ALL', 'IN_PROGRESS', 'COMPLETED'] as FilterType[]).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={cn(
                            'px-4 py-2 rounded-lg border-2 transition-all font-medium',
                            filter === f
                                ? 'border-primary bg-primary/10 text-white shadow-[0_0_15px_rgba(68,237,38,0.2)]'
                                : 'border-surface-border bg-surface-dark/50 text-text-muted hover:border-gray-600'
                        )}
                    >
                        {f === 'ALL' ? '全部' : f === 'IN_PROGRESS' ? '进行中' : '已完成'}
                    </button>
                ))}
            </div>

            {/* 内容区 */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Icon icon="svg-spinners:ring-resize" width={40} className="text-primary" />
                </div>
            ) : filteredSessions.length === 0 ? (
                <div className="text-center py-20">
                    <div className="w-20 h-20 bg-surface-dark/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon icon="lucide:inbox" width={40} className="text-text-muted" />
                    </div>
                    <p className="text-text-muted text-lg">暂无{filter === 'ALL' ? '' : filter === 'IN_PROGRESS' ? '进行中的' : '已完成的'}测验</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredSessions.map((session) => (
                        <SessionCard
                            key={session.sessionId}
                            session={session}
                            onDelete={handleDelete}
                            onViewDetail={handleViewDetail}
                            onViewReport={handleViewReport}
                            onContinue={handleContinue}
                            isContinuing={continuingSessionId === session.sessionId}
                        />
                    ))}
                </div>
            )}
        </>
    );
};

// 会话卡片组件
const SessionCard = ({
    session,
    onDelete,
    onViewDetail,
    onViewReport,
    onContinue,
    isContinuing
}: {
    session: QuizSessionVO;
    onDelete: (_id: string) => void;
    onViewDetail: (_id: string) => void;
    onViewReport: (_id: string) => void;
    onContinue: (_id: string) => void;
    isContinuing: boolean;
}) => {
    // 判断是否可以继续测验 (进行中或暂停状态)
    const canContinue = session.status === 'IN_PROGRESS' || session.status === 'PAUSED';
    return (
        <NeonCard className="p-5 flex flex-col gap-3 hover:shadow-[0_0_25px_rgba(68,237,38,0.15)] transition-all">
            {/* 状态标签 */}
            <div className="flex items-center justify-between mb-2">
                <span className={cn(
                    'px-3 py-1 rounded-full text-xs font-bold',
                    session.status === 'COMPLETED'
                        ? 'bg-primary/20 text-primary'
                        : session.status === 'PAUSED'
                            ? 'bg-orange-500/20 text-orange-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                )}>
                    {session.status === 'COMPLETED' ? '已完成' : session.status === 'PAUSED' ? '已暂停' : '进行中'}
                </span>
                <span className="text-xs text-text-muted">{session.quizMode || 'ADAPTIVE'}</span>
            </div>

            {/* 时间信息 */}
            <div className="text-sm text-text-muted space-y-1">
                <div className="flex items-center gap-2">
                    <Icon icon="lucide:calendar" width={14} />
                    <span>{session.startedAt ? new Date(session.startedAt).toLocaleDateString('zh-CN') : '未知'}</span>
                </div>
                {session.completedAt && (
                    <div className="flex items-center gap-2">
                        <Icon icon="lucide:check-circle" width={14} />
                        <span>完成于 {new Date(session.completedAt).toLocaleDateString('zh-CN')}</span>
                    </div>
                )}
            </div>

            {/* 统计信息 */}
            <div className="bg-surface-dark/30 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-text-muted">总题数</span>
                    <span className="text-white font-bold">{session.totalQuestions || 0}</span>
                </div>
                {session.score !== undefined && session.totalQuestions && session.totalQuestions > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-text-muted">得分</span>
                        <span className="text-primary font-bold">
                            {session.score}
                        </span>
                    </div>
                )}
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2 mt-2">
                <button
                    onClick={() => onDelete(session.sessionId!)}
                    className="flex-1 py-2 rounded-lg border border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-sm font-medium"
                    disabled={isContinuing}
                >
                    删除
                </button>
                {session.status === 'COMPLETED' ? (
                    <button
                        onClick={() => onViewReport(session.sessionId!)}
                        className="flex-1 py-2 rounded-lg border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 transition-all text-sm font-medium"
                    >
                        查看报告
                    </button>
                ) : canContinue ? (
                    <button
                        onClick={() => onContinue(session.sessionId!)}
                        disabled={isContinuing}
                        className="flex-1 py-2 rounded-lg border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 transition-all text-sm font-medium flex items-center justify-center gap-2"
                    >
                        {isContinuing ? (
                            <>
                                <Icon icon="svg-spinners:ring-resize" width={16} />
                                加载中
                            </>
                        ) : (
                            <>
                                <Icon icon="lucide:play" width={14} />
                                继续测验
                            </>
                        )}
                    </button>
                ) : (
                    <button
                        onClick={() => onViewDetail(session.sessionId!)}
                        className="flex-1 py-2 rounded-lg border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 transition-all text-sm font-medium"
                    >
                        详情
                    </button>
                )}
            </div>
        </NeonCard>
    );
};
