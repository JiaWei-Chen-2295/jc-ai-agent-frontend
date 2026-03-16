import { Navigate, createBrowserRouter } from 'react-router-dom'
import { QuizPage } from '@/features/quiz/QuizPage'
import { QuizHistoryPage } from '@/features/quiz/QuizHistoryPage'
import { QuizAnalysisPage } from '@/features/quiz/QuizAnalysisPage'
import { QuizSessionDetailPage } from '@/features/quiz/QuizSessionDetailPage'
import { QuizReportPage } from '@/features/quiz/QuizReportPage'

import { AppLayout } from '@/layouts/AppLayout'
import RequireAuth from '@/routes/RequireAuth'
import ChatPage from '@/features/chat/ChatPage'
import DatasetsPage from '@/features/datasets/DatasetsPage'
import LoginPage from '@/features/auth/LoginPage'
import ProfilePage from '@/features/auth/ProfilePage'
import SettingsPage from '@/features/settings/SettingsPage'
import UploadPage from '@/features/upload/UploadPage'
import TeamsPage from '@/features/tenants/TeamsPage'
import UserManagementPage from '@/features/admin/UserManagementPage'
import ObservabilityListPage from '@/features/observability/ObservabilityListPage'
import ObservabilitySessionPage from '@/features/observability/ObservabilitySessionPage'

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
      { path: '/observability', element: <RequireAuth><ObservabilityListPage /></RequireAuth> },
      { path: '/observability/session/:sessionId', element: <RequireAuth><ObservabilitySessionPage /></RequireAuth> },
      { path: '/datasets', element: <DatasetsPage /> },
      { path: '/settings', element: <SettingsPage /> },
      { path: '/quiz', element: <RequireAuth><QuizPage /></RequireAuth> },
      { path: '/quiz/history', element: <RequireAuth><QuizHistoryPage /></RequireAuth> },
      { path: '/quiz/analysis', element: <RequireAuth><QuizAnalysisPage /></RequireAuth> },
      { path: '/quiz/session/:sessionId', element: <RequireAuth><QuizSessionDetailPage /></RequireAuth> },
      { path: '/quiz/report/:sessionId', element: <RequireAuth><QuizReportPage /></RequireAuth> },
    ],
  },
  { path: '/login', element: <LoginPage /> },
])
