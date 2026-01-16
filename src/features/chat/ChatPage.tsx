import { Icon } from '@iconify/react'
import { Button, Space, Tag, Typography, message as antdMessage } from 'antd'
import { type UIEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import ChatInput from '@/components/ChatInput'
import ChatMessage from '@/components/ChatMessage'
import StatusTag from '@/components/StatusTag'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import { useTenantContext } from '@/features/tenants/tenantContext'
import { normalizeDocuments, useDocuments } from '../upload/api'
import type { DisplayEvent } from './displayEvent'
import {
  createChatSession,
  fetchChatOnce,
  listChatMessages,
  listChatSessions,
  streamChat,
  type ChatMessageRecord,
  type ChatSessionRecord,
} from './chatApi'
import { createInitialDisplayState, displayReducer, type DisplayState } from './displayState'

const { Text } = Typography

type Source = { title: string; href?: string }

type ConversationMessage = {
  id?: string | number
  role: 'agent' | 'user'
  content: string
  timestamp?: string
  sources?: Source[]
  isStreaming?: boolean
  display?: DisplayState
}

const SESSION_PAGE_SIZE = 10
const MESSAGE_PAGE_SIZE = 10
const NEW_SESSION_TITLE = '新对话'

const formatClockTime = (value?: string | number) => {
  if (value === undefined || value === null) return undefined
  const date = typeof value === 'number' ? new Date(value) : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleTimeString()
}

const formatSessionTime = (value?: string | number) => {
  if (value === undefined || value === null) return undefined
  const date = typeof value === 'number' ? new Date(value) : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString()
}

const normalizeSources = (value: unknown): Source[] | undefined => {
  if (!Array.isArray(value)) return undefined
  const mapped = value
    .map((item) => {
      if (!item) return null
      if (typeof item === 'string') {
        return { title: item }
      }
      if (typeof item === 'object') {
        const record = item as Record<string, unknown>
        const title = record.title ?? record.name ?? record.sourceName ?? record.fileName
        if (!title) return null
        const href = record.href ?? record.url
        return { title: String(title), href: typeof href === 'string' ? href : undefined }
      }
      return null
    })
    .filter(Boolean) as Source[]
  return mapped.length ? mapped : undefined
}

const resolveRole = (record: ChatMessageRecord): ConversationMessage['role'] => {
  const rawRole = [
    record.role,
    record.messageRole as string | undefined,
    record.senderRole as string | undefined,
    record.type as string | undefined,
  ].find((value) => typeof value === 'string') as string | undefined

  if (rawRole) {
    const normalized = rawRole.toLowerCase()
    if (['user', 'human', 'client'].includes(normalized)) return 'user'
    if (['assistant', 'agent', 'ai', 'bot', 'system'].includes(normalized)) return 'agent'
  }

  const isUser = (record as Record<string, unknown>).isUser
  if (isUser === true) return 'user'
  return 'agent'
}

const resolveContent = (record: ChatMessageRecord) => {
  const raw =
    record.content ??
    record.message ??
    (record.text as string | undefined) ??
    (record.answer as string | undefined) ??
    (record.reply as string | undefined)
  if (typeof raw === 'string') return raw
  if (raw === undefined || raw === null) return ''
  try {
    return JSON.stringify(raw)
  } catch {
    return String(raw)
  }
}

const resolveTimestamp = (record: ChatMessageRecord) => {
  const raw =
    record.messageAt ??
    record.createdAt ??
    record.createTime ??
    (record.timestamp as string | number | undefined)
  return formatClockTime(raw)
}

const resolveMessageId = (record: ChatMessageRecord) =>
  record.id ??
  (record.messageId as string | number | undefined) ??
  (record.chatMessageId as string | number | undefined) ??
  (record.msgId as string | number | undefined)

const mapMessageRecord = (record: ChatMessageRecord): ConversationMessage => ({
  id: resolveMessageId(record),
  role: resolveRole(record),
  content: resolveContent(record),
  timestamp: resolveTimestamp(record),
  sources: normalizeSources(
    record.sources ?? (record.sourceList as unknown) ?? (record.refs as unknown),
  ),
})

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
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const newSessionToken = searchParams.get('new')
  const adminFlag = searchParams.get('admin')
  const adminTenantId = searchParams.get('tenantId') ?? undefined
  const adminUserId = searchParams.get('userId') ?? undefined
  const { data: currentUser } = useCurrentUser()
  const isAdmin = currentUser?.userRole === 'admin'
  const adminView = isAdmin && adminFlag === '1'

  const [draft, setDraft] = useState('')
  const [sessions, setSessions] = useState<ChatSessionRecord[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [hasMoreSessions, setHasMoreSessions] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(false)
  const [isCreatingSession, setIsCreatingSession] = useState(false)

  const streamRef = useRef<{ close: () => void } | null>(null)
  const receivedDisplayEventRef = useRef(false)
  const hydrationInFlightRef = useRef(false)
  const isStreamingRef = useRef(false)
  const activeChatIdRef = useRef<string | null>(null)
  const isLoadingSessionsRef = useRef(false)
  const hasMoreSessionsRef = useRef(false)
  const isLoadingMessagesRef = useRef(false)
  const hasMoreMessagesRef = useRef(false)
  const sessionScopeRef = useRef<string | null>(null)
  const sessionCursorRef = useRef<{ nextChatId?: string; nextLastMessageAt?: string } | null>(null)
  const messageCursorRef = useRef<string | number | undefined>(undefined)
  const pendingNewSessionRef = useRef(false)
  const messageSurfaceRef = useRef<HTMLDivElement | null>(null)
  const stickToBottomRef = useRef(true)
  const preserveScrollRef = useRef<{ top: number; height: number } | null>(null)
  const pendingDisplayEventsRef = useRef<DisplayEvent[]>([])
  const flushRafIdRef = useRef<number | null>(null)

  const { activeTenant, isActiveReady, isActivating, activeTenantError, setActiveTenant } = useTenantContext()
  const canFetchDocuments = Boolean(activeTenant?.id && isActiveReady)
  const { data: documents } = useDocuments(canFetchDocuments)
  const canChat = Boolean(activeTenant?.id && isActiveReady && !isActivating)
  const canListSessions = adminView || canChat
  const sessionScopeKey = useMemo(() => {
    if (adminView) {
      return `admin:${adminTenantId ?? ''}:${adminUserId ?? ''}`
    }
    return `user:${activeTenant?.id ?? ''}`
  }, [adminTenantId, adminUserId, adminView, activeTenant?.id])

  const syncTenant = async () => {
    if (!activeTenant?.id) {
      throw new Error('未选择团队')
    }
    await setActiveTenant(activeTenant.id)
  }

  const closeStream = useCallback(() => {
    streamRef.current?.close()
    streamRef.current = null
    pendingDisplayEventsRef.current = []
    if (flushRafIdRef.current !== null) {
      cancelAnimationFrame(flushRafIdRef.current)
      flushRafIdRef.current = null
    }
    setIsStreaming(false)
  }, [])

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    const surface = messageSurfaceRef.current
    if (!surface) return
    if (behavior === 'smooth') {
      surface.scrollTo({ top: surface.scrollHeight, behavior: 'smooth' })
      return
    }
    surface.scrollTop = surface.scrollHeight
  }, [])

  const bumpSession = useCallback((chatId: string) => {
    setSessions((prev) => {
      const next = [...prev]
      const index = next.findIndex((session) => session.chatId === chatId)
      if (index === -1) return next
      const updated = {
        ...next[index],
        lastMessageAt: new Date().toISOString(),
      }
      next.splice(index, 1)
      next.unshift(updated)
      return next
    })
  }, [])

  const flushPendingDisplayEvents = useCallback(
    ({ chatId, finalize }: { chatId: string; finalize?: boolean }) => {
      if (activeChatIdRef.current !== chatId) {
        pendingDisplayEventsRef.current = []
        return
      }
      const events = pendingDisplayEventsRef.current
      pendingDisplayEventsRef.current = []
      if (events.length === 0 && !finalize) return

      setMessages((prev) => {
        if (prev.length === 0) return prev
        const next = [...prev]
        const lastIndex = next.length - 1
        const lastMessage = next[lastIndex]
        if (lastMessage.role !== 'agent') return prev

        const now = new Date().toLocaleTimeString()
        let display = lastMessage.display ?? createInitialDisplayState()
        for (const event of events) {
          display = displayReducer(display, { type: 'event', event })
        }
        const activePanel = display.panels[display.stage]
        next[lastIndex] = {
          ...lastMessage,
          content: activePanel.content,
          display,
          timestamp: finalize ? now : lastMessage.timestamp,
          isStreaming: finalize ? false : true,
        }
        return next
      })

      if (isStreamingRef.current || finalize) {
        requestAnimationFrame(() => scrollToBottom())
      }
    },
    [scrollToBottom],
  )

  const hydrateLatestMessageFromServer = useCallback(
    async (chatId: string) => {
      if (hydrationInFlightRef.current) return
      hydrationInFlightRef.current = true
      try {
        const response = await listChatMessages({
          chatId,
          limit: MESSAGE_PAGE_SIZE,
          admin: adminView,
        })
        const records = response?.records ?? []
        const mapped = records.map(mapMessageRecord)
        const serverAgentMessage = [...mapped].reverse().find((msg) => msg.role === 'agent')
        if (!serverAgentMessage) return

        setMessages((prev) => {
          if (activeChatIdRef.current !== chatId) return prev
          if (prev.length === 0) return mapped
          const lastAgentIndex = (() => {
            for (let i = prev.length - 1; i >= 0; i -= 1) {
              if (prev[i].role === 'agent') return i
            }
            return -1
          })()
          if (lastAgentIndex === -1) return mapped

          const next = [...prev]
          const existing = next[lastAgentIndex]

          next[lastAgentIndex] = {
            ...existing,
            ...serverAgentMessage,
            content: serverAgentMessage.content,
            display: undefined,
            isStreaming: false,
          }
          return next
        })
      } catch {
        // ignore hydration failure (streamed content is still visible)
      } finally {
        hydrationInFlightRef.current = false
      }
    },
    [adminView],
  )

  useEffect(() => {
    isLoadingSessionsRef.current = isLoadingSessions
  }, [isLoadingSessions])

  useEffect(() => {
    isStreamingRef.current = isStreaming
  }, [isStreaming])

  useEffect(() => {
    hasMoreSessionsRef.current = hasMoreSessions
  }, [hasMoreSessions])

  useEffect(() => {
    isLoadingMessagesRef.current = isLoadingMessages
  }, [isLoadingMessages])

  useEffect(() => {
    hasMoreMessagesRef.current = hasMoreMessages
  }, [hasMoreMessages])

  const loadSessions = useCallback(
    async ({ mode }: { mode: 'reset' | 'append' }) => {
      if (!canListSessions) return
      if (isLoadingSessionsRef.current) return
      if (mode === 'append' && !hasMoreSessionsRef.current) return
      const cursor = mode === 'append' ? sessionCursorRef.current : null
      isLoadingSessionsRef.current = true
      setIsLoadingSessions(true)
      try {
        const response = await listChatSessions({
          beforeLastMessageAt: cursor?.nextLastMessageAt,
          beforeChatId: cursor?.nextChatId,
          limit: SESSION_PAGE_SIZE,
          admin: adminView,
          tenantId: adminView ? adminTenantId : undefined,
          userId: adminView ? adminUserId : undefined,
        })
        const records = response?.records ?? []
        sessionCursorRef.current = {
          nextChatId: response?.nextChatId,
          nextLastMessageAt: response?.nextLastMessageAt,
        }
        const more = Boolean(response?.hasMore)
        hasMoreSessionsRef.current = more
        setHasMoreSessions(more)
        setSessions((prev) => (mode === 'append' ? [...prev, ...records] : records))
      } catch (err) {
        antdMessage.error((err as Error)?.message || '获取会话列表失败')
      } finally {
        isLoadingSessionsRef.current = false
        setIsLoadingSessions(false)
      }
    },
    [adminTenantId, adminUserId, adminView, canListSessions],
  )

  const loadMessages = useCallback(
    async ({ chatId, mode }: { chatId: string; mode: 'reset' | 'prepend' }) => {
      if (!chatId) return
      if (isLoadingMessagesRef.current) return
      if (mode === 'prepend' && !hasMoreMessagesRef.current) return
      const beforeId = mode === 'prepend' ? messageCursorRef.current : undefined
      if (mode === 'prepend' && beforeId === undefined) return
      isLoadingMessagesRef.current = true
      setIsLoadingMessages(true)
      if (mode === 'prepend' && messageSurfaceRef.current) {
        preserveScrollRef.current = {
          top: messageSurfaceRef.current.scrollTop,
          height: messageSurfaceRef.current.scrollHeight,
        }
      }
      try {
        const response = await listChatMessages({
          chatId,
          beforeId,
          limit: MESSAGE_PAGE_SIZE,
          admin: adminView,
        })
        const records = response?.records ?? []
        const mapped = records.map(mapMessageRecord)
        messageCursorRef.current = response?.nextBeforeId
        const more = Boolean(response?.hasMore)
        hasMoreMessagesRef.current = more
        setHasMoreMessages(more)
        setMessages((prev) => (mode === 'prepend' ? [...mapped, ...prev] : mapped))
      } catch (err) {
        antdMessage.error((err as Error)?.message || '获取消息记录失败')
      } finally {
        isLoadingMessagesRef.current = false
        setIsLoadingMessages(false)
      }
    },
    [adminView],
  )

  const createNewSession = useCallback(
    async (
      title?: string,
      { shouldSyncTenant = true, skipGuard = false }: { shouldSyncTenant?: boolean; skipGuard?: boolean } = {},
    ) => {
      if (!skipGuard && !canChat) {
        antdMessage.warning(isActivating ? '正在同步团队，请稍后重试' : '请先选择团队再开始对话')
        return null
      }
      if (isCreatingSession) return null
      closeStream()
      setIsCreatingSession(true)
      try {
        if (shouldSyncTenant) {
          await syncTenant()
        }
      } catch (err) {
        antdMessage.error((err as Error)?.message || '团队同步失败')
        setIsCreatingSession(false)
        return null
      }

      try {
        const session = await createChatSession(title)
        if (!session?.chatId) {
          throw new Error('创建会话失败')
        }
        setSessions((prev) => [session, ...prev.filter((item) => item.chatId !== session.chatId)])
        activeChatIdRef.current = session.chatId
        setActiveChatId(session.chatId)
        setMessages([])
        setHasMoreMessages(false)
        messageCursorRef.current = undefined
        return session.chatId
      } catch (err) {
        antdMessage.error((err as Error)?.message || '创建会话失败')
        return null
      } finally {
        setIsCreatingSession(false)
      }
    },
    [canChat, closeStream, isActivating, isCreatingSession, syncTenant],
  )

  const ensureSession = useCallback(
    async (title?: string) => {
      await syncTenant()
      if (activeChatIdRef.current) return activeChatIdRef.current
      if (sessions.length > 0) {
        const fallbackId = sessions[0].chatId
        activeChatIdRef.current = fallbackId
        setActiveChatId(fallbackId)
        return fallbackId
      }
      return createNewSession(title, { shouldSyncTenant: false, skipGuard: true })
    },
    [createNewSession, sessions, syncTenant],
  )

  const handleSelectSession = useCallback(
    (chatId: string) => {
      if (!chatId || chatId === activeChatIdRef.current) return
      closeStream()
      activeChatIdRef.current = chatId
      setActiveChatId(chatId)
      setMessages([])
      setHasMoreMessages(false)
      messageCursorRef.current = undefined
    },
    [closeStream],
  )

  const fallbackOnce = async (chatId: string, msg: string) => {
    fetchChatOnce(chatId, msg)
      .then((resp) => {
        const content =
          typeof resp === 'string'
            ? resp
            : (() => {
                try {
                  return JSON.stringify(resp, null, 2)
                } catch {
                  return String(resp)
                }
              })()
        setMessages((prev) => {
          if (prev.length === 0) return prev
          const next = [...prev]
          const lastIndex = next.length - 1
          const lastMessage = next[lastIndex]
          if (lastMessage.role !== 'agent') return prev
          next[lastIndex] = {
            ...lastMessage,
            content,
            display: undefined,
            timestamp: new Date().toLocaleTimeString(),
            isStreaming: false,
          }
          return next
        })
        bumpSession(chatId)
      })
      .catch(() => antdMessage.error('聊天接口调用失败'))
  }

  const handleSend = async (msg: string) => {
    if (!canChat) {
      antdMessage.warning(isActivating ? '正在同步团队，请稍后重试' : '请先选择团队再开始对话')
      return
    }
    if (!msg.trim()) return
    if (isStreaming && streamRef.current) {
      closeStream()
    }
    let chatId: string | null = null
    try {
      chatId = await ensureSession(msg.slice(0, 20))
    } catch (err) {
      setDraft(msg)
      antdMessage.error((err as Error)?.message || '团队同步失败')
      return
    }
    if (!chatId) return

    const now = new Date().toLocaleTimeString()
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: msg, timestamp: now },
      { role: 'agent', content: '', timestamp: '生成中', isStreaming: true, display: createInitialDisplayState() },
    ])
    setDraft('')
    receivedDisplayEventRef.current = false
    pendingDisplayEventsRef.current = []
    if (flushRafIdRef.current !== null) {
      cancelAnimationFrame(flushRafIdRef.current)
      flushRafIdRef.current = null
    }
    bumpSession(chatId)
    requestAnimationFrame(() => scrollToBottom())

    setIsStreaming(true)
    streamRef.current = streamChat({
      chatId,
      message: msg,
      onEvent: (event) => {
        if (activeChatIdRef.current !== chatId) return
        receivedDisplayEventRef.current = true
        pendingDisplayEventsRef.current.push(event)
        const isOutputComplete =
          event.type === 'display' &&
          event.stage === 'output' &&
          event.format === 'status' &&
          event.delta === false &&
          event.content === 'Output complete.'
        if (isOutputComplete) {
          if (flushRafIdRef.current !== null) {
            cancelAnimationFrame(flushRafIdRef.current)
            flushRafIdRef.current = null
          }
          flushPendingDisplayEvents({ chatId, finalize: true })
          closeStream()
          void hydrateLatestMessageFromServer(chatId)
          return
        }
        if (flushRafIdRef.current !== null) return
        flushRafIdRef.current = requestAnimationFrame(() => {
          flushRafIdRef.current = null
          flushPendingDisplayEvents({ chatId })
        })
      },
      onComplete: () => {
        setIsStreaming(false)
        if (flushRafIdRef.current !== null) {
          cancelAnimationFrame(flushRafIdRef.current)
          flushRafIdRef.current = null
        }
        flushPendingDisplayEvents({ chatId, finalize: true })
        streamRef.current = null
        if (!receivedDisplayEventRef.current) {
          antdMessage.warning('未收到流式响应，尝试改用非流式接口')
          fallbackOnce(chatId, msg)
        }
      },
      onError: () => {
        setIsStreaming(false)
        if (flushRafIdRef.current !== null) {
          cancelAnimationFrame(flushRafIdRef.current)
          flushRafIdRef.current = null
        }
        flushPendingDisplayEvents({ chatId, finalize: true })
        streamRef.current = null
        antdMessage.error('SSE 连接中断，尝试使用一次性接口')
        fallbackOnce(chatId, msg)
      },
    })
  }

  useEffect(() => {
    activeChatIdRef.current = activeChatId
  }, [activeChatId])

  useEffect(() => {
    if (!canListSessions) return
    if (sessionScopeRef.current !== sessionScopeKey) {
      sessionScopeRef.current = sessionScopeKey
      sessionCursorRef.current = null
      messageCursorRef.current = undefined
      setSessions([])
      setMessages([])
      activeChatIdRef.current = null
      setActiveChatId(null)
      hasMoreSessionsRef.current = false
      hasMoreMessagesRef.current = false
      setHasMoreSessions(false)
      setHasMoreMessages(false)
      loadSessions({ mode: 'reset' })
    } else if (sessions.length === 0 && !isLoadingSessionsRef.current) {
      loadSessions({ mode: 'reset' })
    }
  }, [canListSessions, loadSessions, sessionScopeKey, sessions.length])

  useEffect(() => {
    if (!activeChatId) return
    loadMessages({ chatId: activeChatId, mode: 'reset' }).then(() => {
      requestAnimationFrame(() => scrollToBottom())
    })
  }, [activeChatId, loadMessages, scrollToBottom])

  useEffect(() => {
    if (activeChatId || pendingNewSessionRef.current) return
    if (sessions.length > 0) {
      handleSelectSession(sessions[0].chatId)
    }
  }, [activeChatId, handleSelectSession, sessions])

  useEffect(() => {
    if (!newSessionToken) return
    pendingNewSessionRef.current = true
    createNewSession(NEW_SESSION_TITLE).finally(() => {
      pendingNewSessionRef.current = false
      navigate('/chat', { replace: true })
    })
  }, [createNewSession, navigate, newSessionToken])

  useEffect(() => {
    return () => {
      closeStream()
    }
  }, [closeStream])

  useEffect(() => {
    if (!preserveScrollRef.current || !messageSurfaceRef.current) return
    const surface = messageSurfaceRef.current
    const { top, height } = preserveScrollRef.current
    const nextHeight = surface.scrollHeight
    surface.scrollTop = nextHeight - height + top
    preserveScrollRef.current = null
  }, [messages])

  const handleSessionScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      const target = event.currentTarget
      if (isLoadingSessions || !hasMoreSessions) return
      if (target.scrollTop + target.clientHeight >= target.scrollHeight - 40) {
        loadSessions({ mode: 'append' })
      }
    },
    [hasMoreSessions, isLoadingSessions, loadSessions],
  )

  const handleMessageScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      const target = event.currentTarget
      stickToBottomRef.current = target.scrollHeight - target.scrollTop - target.clientHeight < 40
      if (target.scrollTop <= 40 && hasMoreMessages && !isLoadingMessages && activeChatIdRef.current) {
        loadMessages({ chatId: activeChatIdRef.current, mode: 'prepend' })
      }
    },
    [hasMoreMessages, isLoadingMessages, loadMessages],
  )

  const contextList = useMemo(
    () =>
      normalizeDocuments(documents).map((doc) => ({
        title: doc.fileName,
        status: doc.status,
      })),
    [documents],
  )

  const hasMessages = useMemo(() => messages.length > 0, [messages])
  const activeSession = useMemo(
    () => sessions.find((session) => session.chatId === activeChatId),
    [activeChatId, sessions],
  )

  return (
    <div className="ima-chat-page">
      <div className="ima-chat-layout">
        <div className="ima-session-panel">
          <div className="ima-session-header">
            <Space size={8}>
              <Icon icon="mdi:message-outline" width={18} />
              <Text strong>会话</Text>
              {adminView ? <Tag color="gold">管理员视角</Tag> : null}
            </Space>
            <Button
              size="small"
              type="primary"
              shape="round"
              icon={<Icon icon="mdi:chat-plus" width={14} />}
              loading={isCreatingSession}
              disabled={!canChat}
              onClick={() => createNewSession(NEW_SESSION_TITLE)}
            >
              新对话
            </Button>
          </div>
          <div className="ima-session-list" onScroll={handleSessionScroll}>
            {sessions.map((session) => {
              const isActive = session.chatId === activeChatId
              const label = session.title || '未命名会话'
              const timeLabel = formatSessionTime(session.lastMessageAt ?? session.createdAt)
              return (
                <button
                  key={session.chatId}
                  type="button"
                  className={`ima-session-item ${isActive ? 'ima-session-item--active' : ''}`}
                  onClick={() => handleSelectSession(session.chatId)}
                >
                  <div className="ima-session-title">{label}</div>
                  <div className="ima-session-meta">
                    <span>{timeLabel || '暂无记录'}</span>
                    {isActive ? <span>当前</span> : null}
                  </div>
                </button>
              )
            })}
            {isLoadingSessions ? <div className="ima-session-empty">加载中...</div> : null}
            {!isLoadingSessions && sessions.length === 0 ? (
              <div className="ima-session-empty">
                {canListSessions ? '暂无会话记录' : '请选择团队后加载会话'}
              </div>
            ) : null}
            {!isLoadingSessions && sessions.length > 0 ? (
              <div className="ima-session-empty">{hasMoreSessions ? '下拉加载更多会话' : '没有更多会话'}</div>
            ) : null}
          </div>
        </div>

        <div className="ima-chat-surface" ref={messageSurfaceRef} onScroll={handleMessageScroll}>
          {!hasMessages ? (
            <div className="ima-hero">
              <div className="ima-hero__icon">
                <Icon icon="mdi:panda" width={36} color="var(--brand-primary)" />
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
                <StatusTag status={isStreaming ? 'processing' : 'ready'} />
                <Tag color="green">角色：文档分析助手</Tag>
                {activeSession?.title ? <Tag color="blue">会话：{activeSession.title}</Tag> : null}
                {activeTenant ? (
                  <Tag color="blue">当前团队：{activeTenant.tenantName}</Tag>
                ) : (
                  <Tag>未选择团队</Tag>
                )}
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
                {hasMoreMessages ? (
                  <div className="ima-messages__loader">
                    {isLoadingMessages ? '加载更早消息中...' : '上拉加载更早消息'}
                  </div>
                ) : null}
                {messages.map((message, index) => (
                  <ChatMessage key={message.id ?? `msg-${index}`} {...message} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="ima-input-bar">
        <ChatInput
          onSend={handleSend}
          value={draft}
          onChange={setDraft}
          loading={isStreaming}
          className="ima-input"
          hint={
            activeTenantError
              ? `团队同步失败：${activeTenantError}`
              : canChat
                ? '回答将尽量附带来源 · 支持 Markdown'
                : isActivating
                  ? '正在同步团队...'
                  : '未选择团队，无法请求 AI'
          }
          placeholder={canChat ? '有问题尽管问' : isActivating ? '正在同步团队...' : '请先在右上角选择团队'}
          disabled={!canChat}
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
