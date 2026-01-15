import { Icon } from '@iconify/react'
import { XMarkdown } from '@ant-design/x-markdown'
import { Card, Flex, Space, Tag, Typography } from 'antd'

import '@ant-design/x-markdown/dist/x-markdown.css'

type Source = { title: string; href?: string }

type ChatMessageProps = {
  role: 'user' | 'agent'
  content: string
  sources?: Source[]
  timestamp?: string
}

const { Text } = Typography

export const ChatMessage = ({ role, content, sources, timestamp }: ChatMessageProps) => {
  const isAgent = role === 'agent'
  return (
    <Card
      className={`chat-message ${isAgent ? 'chat-message--agent' : 'chat-message--user'}`}
      size="small"
      style={{
        maxWidth: '85%',
        border: '1px solid var(--border-subtle)',
      }}
      styles={{ body: { padding: 'var(--spacing-md)' } }}
    >
      <Flex gap={16} align="flex-start">
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-md)',
            background: isAgent ? 'var(--brand-primary)' : 'var(--brand-secondary)',
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
            flexShrink: 0,
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <Icon icon={isAgent ? 'mdi:robot' : 'mdi:account'} width={24} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Space size={8} align="center" style={{ marginBottom: 'var(--spacing-xs)' }}>
            <Text strong style={{ fontSize: 'var(--font-size-sm)' }}>{isAgent ? 'Agent' : '我'}</Text>
            {timestamp ? (
              <Text type="secondary" style={{ fontSize: 'var(--font-size-xs)' }}>
                {timestamp}
              </Text>
            ) : null}
          </Space>
          <div style={{ marginBottom: 'var(--spacing-sm)', lineHeight: 'var(--line-height-relaxed)' }}>
            <XMarkdown
              style={{ background: 'transparent', padding: 0 }}
              className="chat-markdown"
              openLinksInNewTab
            >
              {content}
            </XMarkdown>
          </div>
          {sources && sources.length ? (
            <Space wrap size={6}>
              {sources.map((source, index) => {
                const tagStyle = {
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface)',
                  cursor: source.href ? 'pointer' : 'default',
                }
                return (
                  <Tag
                    key={`${source.title}-${index}`}
                    icon={<Icon icon="mdi:link-variant" width={12} />}
                    color="default"
                    style={tagStyle}
                    {...(source.href ? { onClick: () => window.open(source.href, '_blank') } : {})}
                  >
                    {source.title}
                  </Tag>
                )
              })}
            </Space>
          ) : null}
        </div>
      </Flex>
    </Card>
  )
}

export default ChatMessage
