import { Navigate, createBrowserRouter } from 'react-router-dom'

import { AppLayout } from '@/layouts/AppLayout'
import ChatPage from '@/features/chat/ChatPage'
import DatasetsPage from '@/features/datasets/DatasetsPage'
import SettingsPage from '@/features/settings/SettingsPage'
import UploadPage from '@/features/upload/UploadPage'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/upload" replace /> },
      { path: '/upload', element: <UploadPage /> },
      { path: '/chat', element: <ChatPage /> },
      { path: '/datasets', element: <DatasetsPage /> },
      { path: '/settings', element: <SettingsPage /> },
    ],
  },
])
