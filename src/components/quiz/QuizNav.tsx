/**
 * 测验模块公共导航组件
 * 提供测验页面之间的统一导航
 */
import { NavLink, useLocation } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';

interface QuizNavItem {
    key: string;
    label: string;
    path: string;
    icon: string;
}

const navItems: QuizNavItem[] = [
    { key: 'quiz', label: '开始测验', path: '/quiz', icon: 'lucide:play-circle' },
    { key: 'history', label: '测验历史', path: '/quiz/history', icon: 'lucide:history' },
    { key: 'analysis', label: '学习分析', path: '/quiz/analysis', icon: 'lucide:bar-chart-2' },
];

interface QuizNavProps {
    title?: string;
    subtitle?: string;
    showBackButton?: boolean;
    backPath?: string;
    rightContent?: React.ReactNode;
}

export const QuizNav = ({
    title = '智能测验',
    subtitle = '基于 AI 的自适应学习系统',
    showBackButton = false,
    backPath = '/quiz',
    rightContent
}: QuizNavProps) => {
    const location = useLocation();

    // 判断当前路径是否匹配（精确匹配或子路径匹配）
    const isActive = (path: string) => {
        if (path === '/quiz') {
            // /quiz 只有精确匹配才激活，避免和子页面冲突
            return location.pathname === '/quiz';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <header className="mb-6">
            {/* 顶部标题栏 */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    {showBackButton && (
                        <NavLink
                            to={backPath}
                            className="w-10 h-10 rounded-lg border border-surface-border bg-surface-dark/50 flex items-center justify-center text-text-muted hover:text-white hover:border-primary/50 transition-all"
                        >
                            <Icon icon="lucide:arrow-left" width={20} />
                        </NavLink>
                    )}
                    <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center text-primary shadow-[0_0_20px_rgba(68,237,38,0.2)]">
                        <Icon icon="lucide:zap" width={28} />
                    </div>
                    <div>
                        <h1 className="font-display font-bold text-2xl tracking-tight text-white">{title}</h1>
                        <p className="text-xs text-text-muted">{subtitle}</p>
                    </div>
                </div>

                {/* 右侧内容区域 */}
                {rightContent && (
                    <div className="flex items-center gap-3">
                        {rightContent}
                    </div>
                )}
            </div>

            {/* 导航标签栏 */}
            <nav className="flex gap-2 border-b border-surface-border pb-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.key}
                        to={item.path}
                        className={cn(
                            'px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all',
                            isActive(item.path)
                                ? 'bg-primary/10 text-primary border border-primary/30 shadow-[0_0_10px_rgba(68,237,38,0.15)]'
                                : 'text-text-muted hover:text-white hover:bg-surface-dark/50 border border-transparent'
                        )}
                    >
                        <Icon icon={item.icon} width={18} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </header>
    );
};

export default QuizNav;
