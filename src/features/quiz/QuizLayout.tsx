import { Outlet, useLocation } from 'react-router-dom';
import { QuizNav } from '@/components/quiz/QuizNav';
import { useQuizStore } from '@/store/quizStore';

const titleMap: Record<string, { title: string; subtitle: string }> = {
    '/quiz': { title: '智能测验', subtitle: '基于 AI 的自适应学习系统' },
    '/quiz/history': { title: '测验历史', subtitle: '查看你的所有测验记录和进度' },
    '/quiz/analysis': { title: '学习分析', subtitle: '基于三维认知模型的个性化学习分析' },
};

export const QuizLayout = () => {
    const { pathname } = useLocation();
    const { sessionStatus } = useQuizStore();

    // 当测验进行中/已完成/暂停时，隐藏公共导航，由 QuizPage 自行管理布局
    const isActiveSession =
        pathname === '/quiz' &&
        sessionStatus !== 'IDLE' &&
        sessionStatus !== 'ERROR' &&
        sessionStatus !== null;

    const meta = titleMap[pathname] ?? titleMap['/quiz']!;

    if (isActiveSession) {
        return (
            <div className="h-full overflow-y-auto custom-scrollbar">
                <Outlet />
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto custom-scrollbar bg-transparent p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <QuizNav title={meta.title} subtitle={meta.subtitle} />
                <Outlet />
            </div>
        </div>
    );
};
