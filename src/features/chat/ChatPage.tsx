import { Icon } from '@iconify/react'
import { Button, Space, Tag, Typography, message as antdMessage } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'

import ChatInput from '@/components/ChatInput'
import ChatMessage from '@/components/ChatMessage'
import StatusTag from '@/components/StatusTag'
import { normalizeDocuments, useDocuments } from '../upload/api'
import { fetchChatOnce, streamChat } from './chatApi'

const { Text } = Typography

type ConversationMessage = {
  role: 'agent' | 'user'
  content: string
  timestamp: string
  sources?: { title: string; href?: string }[]
}

const intentPresets = [
  {
    label: '文档总结',
    prompt: '请总结已上传文档的关键要点，并列出 3 条核心结论。',
  },
  {
    label: '对比差异',
    prompt: '请对比两份文档的差异，并给出影响结论。',
  },
  {
    label: '问题解答',
    prompt: '请根据文档回答：XXX',
  },
  {
    label: '生成提纲',
    prompt: '请基于文档内容生成一份结构化提纲。',
  },
]

const ChatPage = () => {
  const [chatId] = useState(() => crypto.randomUUID())
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<ConversationMessage[]>([
    {
      role: 'agent',
      content: '你好，我是你的 RAG 助手。上传文档后即可提问，我会引用相关来源回答。',
      sources: [{ title: '系统提示' }],
      timestamp: new Date().toLocaleTimeString(),
    },
  ])
  const [isStreaming, setIsStreaming] = useState(false)
  const streamRef = useRef<EventSource | null>(null)
  const { data: documents } = useDocuments()

  const handleSend = (msg: string) => {
    if (!msg.trim()) return
    if (isStreaming && streamRef.current) {
      streamRef.current.close()
    }

    const now = new Date().toLocaleTimeString()
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: msg, timestamp: now },
      { role: 'agent', content: '', timestamp: '生成中' },
    ])
    setDraft('')

    setIsStreaming(true)
    streamRef.current = streamChat({
      chatId,
      message: msg,
      onData: (delta) => {
        setMessages((prev) => {
          const next = [...prev]
          const lastIndex = next.length - 1
          next[lastIndex] = {
            ...next[lastIndex],
            content: `${next[lastIndex].content}${delta}`,
            timestamp: new Date().toLocaleTimeString(),
          }
          return next
        })
      },
      onComplete: () => setIsStreaming(false),
      onError: () => {
        setIsStreaming(false)
        antdMessage.error('SSE 连接中断，尝试使用一次性接口')
        fetchChatOnce(chatId, msg)
          .then((resp) => {
            setMessages((prev) => {
              const next = [...prev]
              next[next.length - 1] = {
                ...next[next.length - 1],
                content: typeof resp === 'string' ? resp : JSON.stringify(resp),
                timestamp: new Date().toLocaleTimeString(),
              }
              return next
            })
          })
          .catch(() => antdMessage.error('聊天接口调用失败'))
      },
    })
  }

  useEffect(() => {
    return () => {
      streamRef.current?.close()
    }
  }, [])

  const contextList = useMemo(
    () =>
      normalizeDocuments(documents).map((doc) => ({
        title: doc.fileName,
        status: doc.status,
      })),
    [documents],
  )

  const hasUserMessage = useMemo(() => messages.some((message) => message.role === 'user'), [messages])

  return (
    <div className="ima-chat-page">
      <div className="ima-chat-surface">
        {!hasUserMessage ? (
          <div className="ima-hero">
            <div className="ima-hero__icon">
              <Icon icon="mdi:panda" width={36} color="#2fbd6a" />
            </div>
            <h2 className="ima-hero__title">问问 JCAgent</h2>
            <Text className="ima-hero__subtitle">
              我可以基于你的知识库回答问题、总结文档，并生成结构化内容。
            </Text>
            <Space wrap>
              {intentPresets.map((preset) => (
                <Button
                  key={preset.label}
                  shape="round"
                  onClick={() => {
                    setDraft(preset.prompt)
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </Space>
          </div>
        ) : (
          <div className="ima-chat-feed">
            <div className="ima-context-bar">
              <StatusTag status="ready" />
              <Tag color="green">角色：文档分析助手</Tag>
              {contextList.length ? (
                <>
                  <Text>已加载：</Text>
                  <Space size={6} wrap>
                    {contextList.slice(0, 3).map((item, index) => (
                      <Tag key={`${item.title}-${index}`} color="default">
                        {item.title || '未命名文档'}
                      </Tag>
                    ))}
                    {contextList.length > 3 ? <Tag>+{contextList.length - 3}</Tag> : null}
                  </Space>
                </>
              ) : (
                <Text type="secondary">尚未加载文档</Text>
              )}
            </div>
            <div className="ima-messages">
              {messages.map((message, index) => (
                <ChatMessage key={index} {...message} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="ima-input-bar">
        <ChatInput
          onSend={handleSend}
          value={draft}
          onChange={setDraft}
          loading={isStreaming}
          className="ima-input"
          hint="回答将尽量附带来源 · 支持 Markdown"
          footerLeft={
            <Space size={8}>
              <Button size="small" shape="round" icon={<Icon icon="mdi:chat-processing" width={14} />}>
                对话模式
              </Button>
              <Button size="small" shape="round" icon={<Icon icon="mdi:atom" width={14} />}>
                DS V3.2
              </Button>
            </Space>
          }
          footerRight={
            <Button
              size="small"
              shape="circle"
              icon={<Icon icon="mdi:paperclip" width={14} />}
              aria-label="附加文件"
            />
          }
        />
      </div>
    </div>
  )
}

export default ChatPage
