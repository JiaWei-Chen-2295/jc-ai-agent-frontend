import { Navigate, createBrowserRouter } from 'react-router-dom'

import ModelManagementPage from '@/features/admin/ModelManagementPage'
import UserManagementPage from '@/features/admin/UserManagementPage'
import LoginPage from '@/features/auth/LoginPage'
import ProfilePage from '@/features/auth/ProfilePage'
import ChatPage from '@/features/chat/ChatPage'
import ObservabilityListPage from '@/features/observability/ObservabilityListPage'
import ObservabilitySessionPage from '@/features/observability/ObservabilitySessionPage'
import { QuizAnalysisPage } from '@/features/quiz/QuizAnalysisPage'
import { QuizHistoryPage } from '@/features/quiz/QuizHistoryPage'
import { QuizLayout } from '@/features/quiz/QuizLayout'
import { QuizPage } from '@/features/quiz/QuizPage'
import { QuizReportPage } from '@/features/quiz/QuizReportPage'
import { QuizSessionDetailPage } from '@/features/quiz/QuizSessionDetailPage'
import TeamsPage from '@/features/tenants/TeamsPage'
import UploadPage from '@/features/upload/UploadPage'
import { AppLayout } from '@/layouts/AppLayout'
import RequireAuth from '@/routes/RequireAuth'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/upload" replace /> },
      { path: '/upload', element: <RequireAuth><UploadPage /></RequireAuth> },
      { path: '/chat', element: <RequireAuth><ChatPage /></RequireAuth> },
      { path: '/teams', element: <RequireAuth><TeamsPage /></RequireAuth> },
      { path: '/profile', element: <RequireAuth><ProfilePage /></RequireAuth> },
      { path: '/admin/users', element: <RequireAuth><UserManagementPage /></RequireAuth> },
      { path: '/admin/models', element: <RequireAuth><ModelManagementPage /></RequireAuth> },
      { path: '/observability', element: <RequireAuth><ObservabilityListPage /></RequireAuth> },
      { path: '/observability/session/:sessionId', element: <RequireAuth><ObservabilitySessionPage /></RequireAuth> },

      {
        path: '/quiz',
        element: <RequireAuth><QuizLayout /></RequireAuth>,
        children: [
          { index: true, element: <QuizPage /> },
          { path: 'history', element: <QuizHistoryPage /> },
          { path: 'analysis', element: <QuizAnalysisPage /> },
        ],
      },
      { path: '/quiz/session/:sessionId', element: <RequireAuth><QuizSessionDetailPage /></RequireAuth> },
      { path: '/quiz/report/:sessionId', element: <RequireAuth><QuizReportPage /></RequireAuth> },
    ],
  },
  { path: '/login', element: <LoginPage /> },
])
