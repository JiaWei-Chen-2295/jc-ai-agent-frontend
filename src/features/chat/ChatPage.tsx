import { message as antdMessage } from 'antd'
import { type UIEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import ChatMessage from '@/components/ChatMessage'
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
  const [chatMode, setChatMode] = useState<'standard' | 'research'>('standard')
  const [useWebSearch, setUseWebSearch] = useState(false)
  const [useInternalRag, setUseInternalRag] = useState(true)
  const [tenantMenuOpen, setTenantMenuOpen] = useState(false)

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
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const tenantMenuContainerRef = useRef<HTMLDivElement | null>(null)

  const { tenants, activeTenant, isActiveReady, isActivating, activeTenantError, setActiveTenant } =
    useTenantContext()
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

  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`
  }, [draft])

  useEffect(() => {
    if (!tenantMenuOpen) return
    const handlePointerDown = (event: MouseEvent) => {
      const container = tenantMenuContainerRef.current
      if (!container) return
      const target = event.target as Node | null
      if (!target) return
      if (!container.contains(target)) {
        setTenantMenuOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setTenantMenuOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [tenantMenuOpen])

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
  const recentSessions = useMemo(() => sessions.slice(0, 3), [sessions])
  const archivedSessions = useMemo(() => sessions.slice(3), [sessions])
  const chatHint = activeTenantError
    ? `团队同步失败：${activeTenantError}`
    : canChat
      ? '回答将尽量附带来源 · 支持 Markdown'
      : isActivating
        ? '正在同步团队...'
        : '未选择团队，无法请求 AI'

  return (
    <div className="flex h-full w-full gap-4 lg:gap-6 overflow-hidden">
      <aside className="glass-panel w-80 rounded-2xl flex flex-col overflow-hidden transition-all duration-300">
          <div className="p-6">
              <button
                type="button"
                className="w-full bg-white/5 hover:bg-primary/10 border border-white/10 hover:border-primary/40 text-primary py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all disabled:opacity-50 disabled:text-slate-500 disabled:hover:bg-white/5"
                disabled={!canChat || isCreatingSession}
                onClick={() => createNewSession(NEW_SESSION_TITLE)}
              >
                <span className="material-symbols-outlined">add</span>
                新建对话
            </button>
            {adminView ? (
              <div className="mt-3 text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                管理员视角：tenantId={adminTenantId || '-'} userId={adminUserId || '-'}
              </div>
            ) : null}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-3 space-y-6" onScroll={handleSessionScroll}>
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] px-4 mb-3">
                最近记录
              </h3>
              <div className="space-y-1">
                {recentSessions.map((session) => {
                  const isActive = session.chatId === activeChatId
                  const label = session.title || '未命名会话'
                  const timeLabel = formatSessionTime(session.lastMessageAt ?? session.createdAt)
                  return (
                    <button
                      key={session.chatId}
                      type="button"
                      className={
                        isActive
                          ? 'bg-primary/10 border-l-4 border-primary px-4 py-3 rounded-r-lg cursor-pointer w-full text-left'
                          : 'hover:bg-white/5 px-4 py-3 rounded-lg cursor-pointer transition-colors group w-full text-left'
                      }
                      onClick={() => handleSelectSession(session.chatId)}
                    >
                      <p
                        className={
                          isActive
                            ? 'text-sm font-bold text-slate-200 truncate'
                            : 'text-sm font-medium text-slate-400 group-hover:text-slate-200 truncate'
                        }
                      >
                        {label}
                      </p>
                      <p
                        className={
                          isActive
                            ? 'text-[11px] text-primary font-medium mt-0.5'
                            : 'text-[11px] text-slate-500 mt-0.5'
                        }
                      >
                        {timeLabel || '暂无记录'}
                      </p>
                    </button>
                  )
                })}
                {isLoadingSessions ? (
                  <div className="text-xs font-bold text-slate-500 px-4 py-2">加载中...</div>
                ) : null}
                {!isLoadingSessions && sessions.length === 0 ? (
                  <div className="text-xs font-bold text-slate-500 px-4 py-2">
                    {canListSessions ? '暂无会话记录' : '请选择团队后加载会话'}
                  </div>
                ) : null}
              </div>
            </div>

            {archivedSessions.length ? (
              <div>
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-[0.2em] px-4 mb-3">
                  历史存档
                </h3>
                <div className="space-y-1">
                  {archivedSessions.map((session) => {
                    const isActive = session.chatId === activeChatId
                    const label = session.title || '未命名会话'
                    return (
                     <button
                      key={session.chatId}
                      type="button"
                      className={
                        isActive
                          ? 'bg-primary/10 border-l-4 border-primary px-4 py-3 rounded-r-lg cursor-pointer w-full text-left'
                          : 'hover:bg-white/5 px-4 py-3 rounded-lg cursor-pointer transition-colors group w-full text-left'
                      }
                      onClick={() => handleSelectSession(session.chatId)}
                    >
                        <p
                          className={
                            isActive
                              ? 'text-sm font-bold text-slate-200 truncate'
                              : 'text-sm font-medium text-slate-500 group-hover:text-slate-300 truncate'
                          }
                        >
                          {label}
                        </p>
                      </button>
                    )
                  })}
                  {!isLoadingSessions && sessions.length > 0 ? (
                    <div className="text-[11px] font-bold text-slate-600 px-4 py-2">
                      {hasMoreSessions ? '下拉加载更多会话' : '没有更多会话'}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <div className="p-4 border-t border-white/5 bg-white/5">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-sm">cloud_done</span>
              <span className="text-xs font-bold text-slate-500">
                {contextList.length ? `知识库已同步（${contextList.length}）` : '知识库未加载'}
              </span>
            </div>
          </div>
      </aside>

      <main className="flex-1 flex flex-col gap-4 lg:gap-6 overflow-hidden">
        <header className="chat-glass-subtle relative z-40 h-20 rounded-2xl flex items-center justify-between px-5 sm:px-8 shrink-0">
          <div className="flex items-center gap-6 min-w-0">
              <div ref={tenantMenuContainerRef} className="relative flex flex-col min-w-0">
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                  当前团队
                </span>
                <button
                  type="button"
                  className="mt-1 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/40 px-4 py-2 backdrop-blur-md shadow-sm hover:bg-slate-800/50 hover:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/40 transition-colors group select-none disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={isActivating || tenants.length === 0}
                  onClick={() => setTenantMenuOpen((prev) => !prev)}
                  aria-haspopup="menu"
                  aria-expanded={tenantMenuOpen}
                >
                  <h2 className="text-lg font-bold text-slate-100 truncate max-w-[240px]">
                    {activeTenant?.tenantName || '选择团队'}
                  </h2>
                  <span
                    className={`material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors ${tenantMenuOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  >
                    expand_more
                  </span>
                </button>

                {tenantMenuOpen ? (
                  <div className="absolute left-0 top-full mt-3 w-80 chat-glass-subtle rounded-2xl overflow-hidden z-50">
                    <div className="p-2 max-h-72 overflow-y-auto custom-scrollbar">
                      {tenants.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-slate-500">暂无团队</div>
                      ) : (
                        tenants.map((tenant) => {
                          const isActive = Boolean(activeTenant?.id && tenant.id === activeTenant.id)
                          return (
                            <button
                              key={tenant.id}
                              type="button"
                              className={`w-full text-left px-4 py-3 transition-colors flex items-center justify-between rounded-xl ${
                                isActive ? 'bg-primary/10' : 'hover:bg-white/5'
                              }`}
                              onClick={() => {
                                if (!tenant.id) return
                                setActiveTenant(tenant.id)
                                  .then(() => {
                                    setTenantMenuOpen(false)
                                    antdMessage.success(`已切换至 ${tenant.tenantName}`)
                                  })
                                  .catch((err) => {
                                    antdMessage.error((err as Error)?.message || '切换团队失败')
                                  })
                              }}
                            >
                              <span className={`text-sm font-bold ${isActive ? 'text-primary' : 'text-slate-200'}`}>
                                {tenant.tenantName}
                              </span>
                              <span className={`text-[11px] font-bold ${isActive ? 'text-primary' : 'text-slate-500'}`}>
                                {tenant.tenantType === 'personal' ? '个人' : '团队'}
                              </span>
                            </button>
                          )
                        })
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="h-8 w-[1px] bg-white/10"></div>

              <div className="flex items-center gap-4 min-w-0">
                <div className="flex items-center gap-2 bg-primary/5 border border-primary/10 px-3 py-1.5 rounded-full">
                  <div className={`w-2 h-2 rounded-full ${canChat ? 'bg-primary animate-pulse' : 'bg-slate-600'}`}></div>
                  <span className="text-xs font-bold text-primary uppercase">
                    {canChat ? '已就绪' : isActivating ? '同步中' : '未就绪'}
                  </span>
                </div>
                {activeSession?.title ? (
                  <div className="text-xs font-bold text-slate-500 truncate">
                    会话：<span className="text-slate-300">{activeSession.title}</span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="flex items-center gap-2 bg-slate-900/40 p-1.5 rounded-2xl border border-white/10 backdrop-blur-xl">
                <button
                  type="button"
                  className={
                    chatMode === 'standard'
                      ? 'px-4 py-1.5 text-xs font-bold rounded-lg bg-slate-800/80 text-primary shadow-sm border border-white/10'
                      : 'px-4 py-1.5 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-200 transition-colors'
                  }
                  onClick={() => setChatMode('standard')}
                >
                  标准模式
                </button>
                <button
                  type="button"
                  className={
                    chatMode === 'research'
                      ? 'px-4 py-1.5 text-xs font-bold rounded-lg bg-slate-800/80 text-primary shadow-sm border border-white/10'
                      : 'px-4 py-1.5 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-200 transition-colors'
                  }
                  onClick={() => setChatMode('research')}
                >
                  深度研究
                </button>
              </div>
              <button
                type="button"
                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-900/50 border border-white/10 text-slate-300 hover:text-primary hover:border-primary/30 transition-all shadow-md backdrop-blur-xl"
                onClick={() => antdMessage.info('分享功能暂未实现')}
                title="分享"
              >
                <span className="material-symbols-outlined">share</span>
              </button>
            </div>
          </header>

          <div className="chat-glass flex-1 rounded-2xl flex flex-col overflow-hidden relative z-10">
            <div
              ref={messageSurfaceRef}
              onScroll={handleMessageScroll}
              className="flex-1 overflow-y-auto custom-scrollbar px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12 space-y-6 sm:space-y-8 lg:space-y-10"
            >
              {!hasMessages ? (
                <div className="max-w-5xl">
                  <div className="flex gap-6 max-w-5xl">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-slate-950 shrink-0 shadow-lg glow-mint ring-1 ring-white/10">
                      <span className="material-symbols-outlined font-bold">smart_toy</span>
                    </div>
                    <div className="space-y-4 pt-1">
                      <p className="text-slate-200 leading-[1.75] text-[15px] sm:text-base font-normal">
                        你好！我可以基于你的知识库回答问题、总结文档，并生成结构化内容。
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {intentPresets.map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            className="px-3 py-1.5 bg-slate-900/50 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-white/10 hover:border-primary/50 hover:text-primary transition-colors backdrop-blur-md"
                            onClick={() => setDraft(preset.prompt)}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                      {chatHint ? <div className="text-[11px] font-bold text-slate-500">{chatHint}</div> : null}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {hasMoreMessages ? (
                    <div className="text-center text-xs font-bold text-slate-500">
                      {isLoadingMessages ? '加载更早消息中...' : '上拉加载更早消息'}
                    </div>
                  ) : null}
                  {messages.map((message, index) => (
                    <ChatMessage key={message.id ?? `msg-${index}`} {...message} />
                  ))}
                </>
              )}
            </div>

            <div className="px-6 pb-6 pt-0 sm:px-8 sm:pb-8 lg:px-10 lg:pb-10">
              <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-3 backdrop-blur-2xl focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all shadow-[0_24px_70px_rgba(0,0,0,0.5)]">
                <div className="flex items-end gap-2">
                  <div className="flex flex-col gap-1 p-2">
                    <button
                      type="button"
                      className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-primary transition-all shadow-sm"
                      title="上传附件"
                      onClick={() => antdMessage.info('附件上传暂未实现')}
                    >
                      <span className="material-symbols-outlined">attach_file</span>
                    </button>
                    <button
                      type="button"
                      className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-primary transition-all shadow-sm"
                      title="网页抓取工具"
                      onClick={() => antdMessage.info('网页抓取暂未实现')}
                    >
                      <span className="material-symbols-outlined">language</span>
                    </button>
                  </div>
                  <div className="flex-1 pb-2">
                    <textarea
                      ref={inputRef}
                      className="w-full bg-transparent border-none focus:ring-0 text-slate-100 placeholder:text-slate-500 resize-none py-3 text-[15px] sm:text-base leading-[1.6] disabled:opacity-60"
                      placeholder={canChat ? '输入问题，或使用 / 触发工具...' : isActivating ? '正在同步团队...' : '请先选择团队'}
                      rows={1}
                      value={draft}
                      disabled={!canChat}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key !== 'Enter') return
                        if (e.shiftKey) return
                        e.preventDefault()
                        void handleSend(draft)
                      }}
                      onInput={(e) => {
                        const el = e.currentTarget
                        el.style.height = 'auto'
                        el.style.height = `${Math.min(el.scrollHeight, 240)}px`
                      }}
                    />
                  </div>
                  <div className="p-2">
                    <button
                      type="button"
                      className="w-12 h-12 bg-primary hover:bg-primary/90 rounded-2xl flex items-center justify-center text-slate-950 font-bold glow-mint hover:scale-105 transition-transform active:scale-95 shadow-xl disabled:opacity-50 disabled:hover:scale-100"
                      disabled={!canChat || !draft.trim()}
                      onClick={() => void handleSend(draft)}
                      title="发送"
                    >
                      <span className="material-symbols-outlined font-black">send</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/10">
                  <div className="flex gap-4">
                    <button
                      type="button"
                      className="flex items-center gap-2 group"
                      onClick={() => setUseWebSearch((prev) => !prev)}
                    >
                      <div
                        className={`w-4 h-4 rounded border-2 ${
                          useWebSearch ? 'border-primary bg-primary' : 'border-slate-600 bg-transparent'
                        } flex items-center justify-center transition-all group-hover:border-primary/50`}
                      >
                        {useWebSearch ? (
                          <span className="material-symbols-outlined text-[10px] text-slate-950 font-black">
                            check
                          </span>
                        ) : null}
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          useWebSearch ? 'text-primary' : 'text-slate-500 group-hover:text-slate-300'
                        }`}
                      >
                        联网搜索
                      </span>
                    </button>

                    <button
                      type="button"
                      className="flex items-center gap-2 group"
                      onClick={() => setUseInternalRag((prev) => !prev)}
                    >
                      <div
                        className={`w-4 h-4 rounded border-2 ${
                          useInternalRag ? 'border-primary bg-primary' : 'border-slate-600 bg-transparent'
                        } flex items-center justify-center transition-all group-hover:border-primary/50`}
                      >
                        {useInternalRag ? (
                          <span className="material-symbols-outlined text-[10px] text-slate-950 font-black">
                            check
                          </span>
                        ) : null}
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          useInternalRag ? 'text-primary' : 'text-slate-500 group-hover:text-slate-300'
                        }`}
                      >
                        内部 RAG
                      </span>
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                    GPT-4o-CO-Specialist
                  </div>
                </div>
              </div>

              {chatHint ? <div className="mt-3 text-[11px] font-bold text-slate-500">{chatHint}</div> : null}

              <div className="mt-4 flex justify-center">
                <p className="text-[10px] text-slate-600 font-bold tracking-widest uppercase">
                  JC-AI-AGENT 界面 V1.0.4-BETA • 安全协作驱动
                </p>
              </div>
            </div>
          </div>
      </main>
    </div>
  )
}

export default ChatPage
