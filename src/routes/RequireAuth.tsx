import { Spin } from 'antd'
import type { PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useCurrentUser } from '@/features/auth/useCurrentUser'

export const RequireAuth = ({ children }: PropsWithChildren) => {
  const location = useLocation()
  const { isLoading, isError } = useCurrentUser()

  if (isLoading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (isError) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}

export default RequireAuth
