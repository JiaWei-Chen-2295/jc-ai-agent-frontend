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
      }}
    >
      <Flex gap={12} align="flex-start">
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            background: isAgent ? '#2fbd6a' : '#3f8cff',
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
          }}
        >
          <Icon icon={isAgent ? 'mdi:robot' : 'mdi:account'} width={20} />
        </div>
        <div style={{ flex: 1 }}>
          <Space size={6}>
            <Text strong>{isAgent ? 'Agent' : '我'}</Text>
            {timestamp ? (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {timestamp}
              </Text>
            ) : null}
          </Space>
          <div style={{ marginTop: 6, marginBottom: 6 }}>
            <XMarkdown
              style={{ background: 'transparent', padding: 0 }}
              className="chat-markdown"
              openLinksInNewTab
            >
              {content}
            </XMarkdown>
          </div>
          {sources && sources.length ? (
            <Space wrap>
              {sources.map((source, index) => (
                <Tag
                  key={`${source.title}-${index}`}
                  icon={<Icon icon="mdi:link-variant" width={14} />}
                  color="default"
                  style={{ borderRadius: 6 }}
                  {...(source.href ? { onClick: () => window.open(source.href, '_blank') } : {})}
                >
                  {source.title}
                </Tag>
              ))}
            </Space>
          ) : null}
        </div>
      </Flex>
    </Card>
  )
}

export default ChatMessage
