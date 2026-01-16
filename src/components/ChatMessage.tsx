import { Icon } from '@iconify/react'
import { XMarkdown } from '@ant-design/x-markdown'
import Latex from '@ant-design/x-markdown/plugins/Latex'
import { Card, Flex, Space, Tag, Typography } from 'antd'

import '@ant-design/x-markdown/dist/x-markdown.css'

import type { DisplayFormat, DisplayStage } from '@/features/chat/displayEvent'
import type { DisplayState } from '@/features/chat/displayState'

type Source = { title: string; href?: string }

type ChatMessageProps = {
  role: 'user' | 'agent'
  content: string
  sources?: Source[]
  timestamp?: string
  isStreaming?: boolean
  display?: DisplayState
}

const { Text } = Typography
const markdownConfig = { extensions: Latex() }

const renderTextBlock = (text: string) => (
  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit' }}>{text}</pre>
)

const renderCodeBlock = (code: string) => (
  <pre
    style={{
      margin: 0,
      whiteSpace: 'pre',
      overflowX: 'auto',
      padding: 'var(--spacing-xs)',
      borderRadius: 'var(--radius-sm)',
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
    }}
  >
    <code style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace' }}>
      {code}
    </code>
  </pre>
)

const renderByFormat = (format: DisplayFormat, text: string) => {
  switch (format) {
    case 'markdown':
      return (
        <XMarkdown style={{ background: 'transparent', padding: 0, whiteSpace: 'pre-wrap' }} className="chat-markdown" config={markdownConfig} openLinksInNewTab>
          {text}
        </XMarkdown>
      )
    case 'code':
      return renderCodeBlock(text)
    case 'text':
    case 'status':
      return renderTextBlock(text)
  }
}

const stageLabel: Record<DisplayStage, string> = {
  searching: '检索中',
  thinking: '思考中',
  output: '回答中',
  status: '状态',
}

export const ChatMessage = ({ role, content, sources, timestamp, isStreaming, display }: ChatMessageProps) => {
  const isAgent = role === 'agent'
  const displayStage = display?.stage
  const displayPanel = (() => {
    if (!displayStage || !display?.panels) return undefined
    if (displayStage === 'output') {
      const outputPanel = display.panels.output
      if (outputPanel.content) return outputPanel
      const statusPanel = display.panels.status
      if (statusPanel.content) return statusPanel
      return outputPanel
    }
    return display.panels[displayStage]
  })()
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
            boxShadow: 'var(--shadow-sm)',
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
            {isAgent && displayStage && displayPanel ? (
              <div>
                {displayStage === 'searching' || displayStage === 'thinking' ? (
                  <Text type="secondary">{stageLabel[displayStage]}</Text>
                ) : null}
                {displayPanel.content ? renderByFormat(displayPanel.format, displayPanel.content) : <Text type="secondary">...</Text>}
              </div>
            ) : isAgent && isStreaming ? (
              content ? (
                renderTextBlock(content)
              ) : (
                <Text type="secondary">...</Text>
              )
            ) : (
              <XMarkdown style={{ background: 'transparent', padding: 0, whiteSpace: 'pre-wrap' }} className="chat-markdown" config={markdownConfig} openLinksInNewTab>
                {content}
              </XMarkdown>
            )}
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
