import { Icon } from '@iconify/react'
import { Button, Dropdown, Layout, Menu, Space, Tag, Typography, message as antdMessage } from 'antd'
import type { PropsWithChildren } from 'react'
import { useMemo } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import { useAuthActions } from '@/features/auth/api'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import { useTenantContext } from '@/features/tenants/tenantContext'

const { Header, Sider, Content } = Layout
const { Title, Text } = Typography

export const AppLayout = ({ children }: PropsWithChildren) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: currentUser, isLoading: userLoading, isError: userError } = useCurrentUser()
  const { logout } = useAuthActions()
  const { tenants, activeTenant, isLoading: tenantLoading, isActivating, setActiveTenant } = useTenantContext()

  const navItems = useMemo(() => {
    const items = [
      { key: 'upload', label: '我的知识库', path: '/upload', icon: 'mdi:database' },
      { key: 'teams', label: '团队管理', path: '/teams', icon: 'mdi:account-group-outline' },
      { key: 'chat', label: '问答历史', path: '/chat', icon: 'mdi:history' },
      { key: 'datasets', label: '知识库广场', path: '/datasets', icon: 'mdi:view-grid' },
      { key: 'profile', label: '个人资料', path: '/profile', icon: 'mdi:account-circle-outline' },
      { key: 'settings', label: '设置', path: '/settings', icon: 'mdi:cog-outline' },
    ]
    if (currentUser?.userRole === 'admin') {
      items.splice(4, 0, { key: 'admin-users', label: '用户管理', path: '/admin/users', icon: 'mdi:shield-account-outline' })
    }
    return items
  }, [currentUser?.userRole])

  const selectedKey = useMemo(() => {
    const found = navItems.find((item) => location.pathname.startsWith(item.path))
    return found?.key ? [found.key] : []
  }, [location.pathname, navItems])

  const tenantMenuItems = useMemo(
    () =>
      tenants.map((tenant) => ({
        key: String(tenant.id),
        label: (
          <Space>
            <span>{tenant.tenantName}</span>
            <Tag color={tenant.tenantType === 'personal' ? 'blue' : 'default'}>
              {tenant.tenantType === 'personal' ? '个人' : '团队'}
            </Tag>
          </Space>
        ),
        onClick: async () => {
          if (!tenant.id) return
          try {
            await setActiveTenant(tenant.id)
            antdMessage.success(`已切换至 ${tenant.tenantName}`)
          } catch (err) {
            antdMessage.error('切换团队失败')
          }
        },
      })),
    [setActiveTenant, tenants],
  )

  return (
    <Layout hasSider className="ima-layout" style={{ minHeight: '100vh' }}>
      <Sider
        width={240}
        className="ima-sider"
        breakpoint="lg"
        collapsedWidth="0"
        zeroWidthTriggerStyle={{ top: 12, right: -40, background: 'var(--brand-primary)', borderRadius: '0 8px 8px 0' }}
        theme="light"
      >
        <div className="ima-sider__brand">
          <div className="ima-sider__logo">JC</div>
          <div>
            <Title level={5} style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
              JCAgent
            </Title>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              智能 RAG 对话
            </Text>
          </div>
        </div>

        <div className="ima-sider__action">
          <Button
            block
            type="primary"
            icon={<Icon icon="mdi:chat-plus" width={18} />}
            onClick={() => navigate('/chat')}
            style={{ 
              borderRadius: 'var(--radius-md)', 
              height: 48,
              boxShadow: 'var(--shadow-md)',
              fontWeight: 600
            }}
          >
            新对话
          </Button>
        </div>

        <Menu
          mode="inline"
          selectedKeys={selectedKey}
          style={{ border: 'none', padding: '12px var(--spacing-sm)' }}
          items={navItems.map((item) => ({
            key: item.key,
            icon: <Icon icon={item.icon} width={20} />,
            label: item.label,
            onClick: () => navigate(item.path),
          }))}
        />

        <div className="ima-sider__footer">
          <Icon icon="mdi:information-outline" width={16} />
          <span>关于 JCAgent v0.1.0</span>
        </div>
      </Sider>

      <Layout style={{ background: 'transparent' }}>
        <Header
          className="ima-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 'var(--spacing-md)',
            height: 72,
          }}
        >
          <Space size={16}>
            <Dropdown
              menu={{ items: tenantMenuItems }}
              placement="bottomRight"
              trigger={['click']}
              disabled={tenantLoading || isActivating || tenants.length === 0}
            >
              <Button shape="round" icon={<Icon icon="mdi:account-group" width={16} />}>
                {activeTenant?.tenantName || '选择团队'}
              </Button>
            </Dropdown>
            {userLoading ? (
              <Text type="secondary">登录中...</Text>
            ) : userError ? (
              <>
                <Text type="secondary">未登录</Text>
                <Button type="primary" shape="round" onClick={() => navigate('/login')}>
                  登录
                </Button>
              </>
            ) : (
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'profile',
                      label: '个人资料',
                      onClick: () => navigate('/profile'),
                    },
                    {
                      key: 'logout',
                      label: '退出登录',
                      onClick: () => {
                        logout
                          .mutateAsync()
                          .then(() => antdMessage.success('已退出登录'))
                          .catch(() => antdMessage.error('退出失败'))
                      },
                    },
                  ],
                }}
              >
                <Tag color="green" style={{ cursor: 'pointer' }}>
                  {currentUser?.userName || currentUser?.userAccount || '已登录'}
                </Tag>
              </Dropdown>
            )}
            <Button shape="round" icon={<Icon icon="mdi:laptop" width={16} />}>
              打开电脑版本
            </Button>
          </Space>
        </Header>
        <Content className="ima-content" style={{ minHeight: 'calc(100vh - 72px)' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', width: '100%', animation: 'fadeIn 0.4s ease-out' }}>
            {children ?? <Outlet />}
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default AppLayout
