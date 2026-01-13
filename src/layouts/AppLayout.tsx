import { Icon } from '@iconify/react'
import { Button, Layout, Menu, Space, Typography } from 'antd'
import type { PropsWithChildren } from 'react'
import { useMemo } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

const { Header, Sider, Content } = Layout
const { Title, Text } = Typography

const navItems = [
  { key: 'upload', label: '我的知识库', path: '/upload', icon: 'mdi:database' },
  { key: 'datasets', label: '知识库广场', path: '/datasets', icon: 'mdi:view-grid' },
  { key: 'chat', label: '问答历史', path: '/chat', icon: 'mdi:history' },
  { key: 'settings', label: '设置', path: '/settings', icon: 'mdi:cog-outline' },
]

export const AppLayout = ({ children }: PropsWithChildren) => {
  const navigate = useNavigate()
  const location = useLocation()
  const selectedKey = useMemo(() => {
    const found = navItems.find((item) => location.pathname.startsWith(item.path))
    return found?.key ? [found.key] : []
  }, [location.pathname])

  return (
    <Layout hasSider className="ima-layout" style={{ minHeight: '100vh' }}>
      <Sider
        width={220}
        className="ima-sider"
        breakpoint="lg"
      >
        <div className="ima-sider__brand">
          <div className="ima-sider__logo">JC</div>
          <div>
            <Title level={5} style={{ margin: 0 }}>
              JCAgent
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
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
            style={{ borderRadius: 12, height: 42 }}
          >
            新对话
          </Button>
        </div>

        <Menu
          mode="inline"
          selectedKeys={selectedKey}
          style={{ border: 'none', padding: '12px 8px' }}
          items={navItems.map((item) => ({
            key: item.key,
            icon: <Icon icon={item.icon} width={20} />,
            label: item.label,
            onClick: () => navigate(item.path),
          }))}
        />

        <div className="ima-sider__footer">
          <Icon icon="mdi:information-outline" width={16} />
          <span>关于 JCAgent</span>
        </div>
      </Sider>

      <Layout>
        <Header
          className="ima-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 12,
          }}
        >
          <Space size={12}>
            <Button shape="round">登录</Button>
            <Button shape="round" icon={<Icon icon="mdi:laptop" width={16} />}>
              打开电脑版本
            </Button>
          </Space>
        </Header>
        <Content className="ima-content" style={{ minHeight: 'calc(100vh - 64px)' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', width: '100%' }}>{children ?? <Outlet />}</div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default AppLayout
