import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp, ConfigProvider } from 'antd'
import type { PropsWithChildren } from 'react'
import { useState } from 'react'

import { TenantProvider } from '@/features/tenants/tenantContext'
import { themeConfig } from '@/styles/theme'

export const AppProviders = ({ children }: PropsWithChildren) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={themeConfig}>
        <AntdApp className="app-shell">
          <TenantProvider>{children}</TenantProvider>
        </AntdApp>
      </ConfigProvider>
    </QueryClientProvider>
  )
}

export default AppProviders
