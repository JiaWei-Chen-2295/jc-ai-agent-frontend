import { Navigate, createBrowserRouter } from 'react-router-dom'

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
      { path: '/datasets', element: <DatasetsPage /> },
      { path: '/settings', element: <SettingsPage /> },
    ],
  },
  { path: '/login', element: <LoginPage /> },
])
