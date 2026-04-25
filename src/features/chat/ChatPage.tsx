import { Select, message as antdMessage } from 'antd'
import { type UIEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { StreamingVoiceManager, type VisibleVoiceStatus } from '@javierchen/streaming-voice-sdk'

import ChatMessage from '@/components/ChatMessage'
import TeamSwitcherBar from '@/components/TeamSwitcherBar'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import { useTenantContext } from '@/features/tenants/tenantContext'
import { apiBaseUrl } from '@/services/http'
import { normalizeDocuments, useDocuments } from '../upload/api'
import {
  createChatSession,
  fetchChatOnce,
  listAvailableModels,
  listChatMessages,
  listChatSessions,
  streamChat,
  type AiModelVO,
  type ChatMessageRecord,
  type ChatSessionRecord,
  type StudyFriendSource,
} from './chatApi'

type WebSearchMode = 'default' | 'enabled' | 'disabled'

type ConversationMessage = {
  id?: string | number
  role: 'agent' | 'user'
  content: string
  timestamp?: string
  sources?: StudyFriendSource[]
  webSearchUsed?: boolean
  isStreaming?: boolean
}

const SESSION_PAGE_SIZE = 10
const MESSAGE_PAGE_SIZE = 10
const NEW_SESSION_TITLE = '新对话'
const WEB_SEARCH_OPTIONS: Array<{ value: WebSearchMode; label: string }> = [
  { value: 'default', label: '跟随配置' },
  { value: 'enabled', label: '联网搜索' },
  { value: 'disabled', label: '仅知识库' },
]

const createClientMessageId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

const resolveAbsoluteApiBase = () => {
  const normalized = apiBaseUrl.replace(/\/$/, '')
  if (/^https?:\/\//i.test(normalized)) return normalized
  const origin = window.location.origin
  if (normalized.startsWith('/')) return `${origin}${normalized}`
  return `${origin}/${normalized}`
}

const voiceWsUrlOverride = import.meta.env.VITE_VOICE_WS_URL?.trim()

const buildVoiceWsUrl = (absoluteApiBase: string) => {
  if (voiceWsUrlOverride) return voiceWsUrlOverride
  const httpUrl = new URL(absoluteApiBase)
  const wsProtocol = httpUrl.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${wsProtocol}//${httpUrl.host}${httpUrl.pathname.replace(/\/$/, '')}/ws/voice`
}

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

const formatRelativeSessionDay = (value?: string | number) => {
  if (value === undefined || value === null) return undefined
  const date = typeof value === 'number' ? new Date(value) : new Date(value)
  if (Number.isNaN(date.getTime())) return undefined

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diff = Math.round((today.getTime() - target.getTime()) / 86400000)

  if (diff === 0) return '今天'
  if (diff === 1) return '昨天'
  if (diff > 1 && diff < 7) return `${diff} 天前`
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const normalizeSources = (value: unknown): StudyFriendSource[] | undefined => {
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
        const url = record.url ?? record.href
        const snippet = record.snippet ?? record.description ?? record.summary
        return {
          title: String(title),
          url: typeof url === 'string' ? url : undefined,
          snippet: typeof snippet === 'string' ? snippet : undefined,
        }
      }
      return null
    })
    .filter(Boolean) as StudyFriendSource[]
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

const mapMessageRecord = (record: ChatMessageRecord): ConversationMessage => {
  const sources = normalizeSources(record.sources ?? (record.sourceList as unknown) ?? (record.refs as unknown))
  return {
    id: resolveMessageId(record),
    role: resolveRole(record),
    content: resolveContent(record),
    timestamp: resolveTimestamp(record),
    sources,
    webSearchUsed: typeof record.webSearchUsed === 'boolean' ? record.webSearchUsed : Boolean(sources?.length),
  }
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
  const [availableModels, setAvailableModels] = useState<AiModelVO[]>([])
  const [selectedModelId, setSelectedModelId] = useState<string | undefined>(undefined)
  const [sessions, setSessions] = useState<ChatSessionRecord[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [hasMoreSessions, setHasMoreSessions] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(false)
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [webSearchMode, setWebSearchMode] = useState<WebSearchMode>('default')
  const [voiceStatus, setVoiceStatus] = useState<VisibleVoiceStatus>('idle')
  const [voiceConnected, setVoiceConnected] = useState(false)
  const [voicePlaybackState, setVoicePlaybackState] = useState<{
    playing: boolean
    bufferedAheadSeconds: number
    skipped: boolean
    mimeType: string
  } | null>(null)

  const streamRef = useRef<{ close: () => void } | null>(null)
  const voiceManagerRef = useRef<StreamingVoiceManager | null>(null)
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null)
  const voiceTurnRef = useRef<{
    chatId: string
    userMessageId: string
    agentMessageId: string
    receivedAgentText: boolean
  } | null>(null)
  const voiceAudioReceivedRef = useRef(false)
  const receivedStreamTextRef = useRef(false)
  const hydrationInFlightRef = useRef(false)
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
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

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
  const resolvedWebSearchEnabled =
    webSearchMode === 'enabled' ? true : webSearchMode === 'disabled' ? false : undefined
  const webSearchHint =
    webSearchMode === 'enabled'
      ? '本次提问会显式开启联网搜索'
      : webSearchMode === 'disabled'
        ? '本次提问会显式关闭联网搜索'
        : '本次提问跟随后端默认配置'

  const syncTenant = async () => {
    if (!activeTenant?.id) {
      throw new Error('未选择团队')
    }
    await setActiveTenant(activeTenant.id)
  }

  const closeStream = useCallback(() => {
    streamRef.current?.close()
    streamRef.current = null
    setIsStreaming(false)
  }, [])

  const stopVoiceTurn = useCallback(async () => {
    const manager = voiceManagerRef.current
    if (!manager) return
    try {
      await manager.stopTurn()
    } catch {
      // keep UI responsive even if stop fails
    }
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

  const updateLastAgentMessage = useCallback(
    (chatId: string, updater: (message: ConversationMessage) => ConversationMessage) => {
      setMessages((prev) => {
        if (activeChatIdRef.current !== chatId || prev.length === 0) return prev
        const next = [...prev]
        for (let i = next.length - 1; i >= 0; i -= 1) {
          if (next[i].role !== 'agent') continue
          next[i] = updater(next[i])
          return next
        }
        return prev
      })
    },
    [],
  )

  const updateMessageById = useCallback((messageId: string, updater: (message: ConversationMessage) => ConversationMessage) => {
    setMessages((prev) => {
      const index = prev.findIndex((item) => item.id === messageId)
      if (index === -1) return prev
      const next = [...prev]
      next[index] = updater(next[index])
      return next
    })
  }, [])

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
      {
        shouldSyncTenant = true,
        skipGuard = false,
        modelId,
      }: { shouldSyncTenant?: boolean; skipGuard?: boolean; modelId?: string } = {},
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
        const resolvedModelId = modelId ?? selectedModelId
        const session = await createChatSession(title, resolvedModelId)
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
        const errMsg = (err as Error)?.message || '创建会话失败'
        if (errMsg.includes('不可用') || errMsg.includes('不存在') || errMsg.includes('disabled')) {
          antdMessage.error('当前模型不可用，请选择其他模型')
          setSelectedModelId(undefined)
          listAvailableModels()
            .then((models) => {
              setAvailableModels(models)
              if (models.length > 0) setSelectedModelId(models[0].modelId)
            })
            .catch(() => {})
        } else {
          antdMessage.error(errMsg)
        }
        return null
      } finally {
        setIsCreatingSession(false)
      }
    },
    [canChat, closeStream, isActivating, isCreatingSession, selectedModelId, syncTenant],
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

  const fallbackOnce = async (
    chatId: string,
    msg: string,
    messageId: string,
    webSearchEnabled?: boolean,
  ) => {
    fetchChatOnce({
      chatId,
      message: msg,
      messageId,
      webSearchEnabled,
    })
      .then((resp) => {
        updateLastAgentMessage(chatId, (lastMessage) => {
          const normalizedSources = normalizeSources(resp?.sources)
          return {
            ...lastMessage,
            content: resp?.content ?? lastMessage.content,
            sources: normalizedSources,
            webSearchUsed:
              typeof resp?.webSearchUsed === 'boolean'
                ? resp.webSearchUsed
                : lastMessage.webSearchUsed,
            timestamp: new Date().toLocaleTimeString(),
            isStreaming: false,
          }
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

    const messageId = createClientMessageId()

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
      { role: 'agent', content: '', timestamp: '生成中', isStreaming: true },
    ])
    setDraft('')
    receivedStreamTextRef.current = false
    bumpSession(chatId)
    requestAnimationFrame(() => scrollToBottom())

    setIsStreaming(true)
    streamRef.current = streamChat({
      chatId,
      message: msg,
      messageId,
      webSearchEnabled: resolvedWebSearchEnabled,
      onSources: (payload) => {
        if (activeChatIdRef.current !== chatId) return
        updateLastAgentMessage(chatId, (lastMessage) => ({
          ...lastMessage,
          sources: normalizeSources(payload.sources),
          webSearchUsed:
            typeof payload.webSearchUsed === 'boolean'
              ? payload.webSearchUsed
              : lastMessage.webSearchUsed,
        }))
      },
      onTextDelta: (chunk) => {
        if (activeChatIdRef.current !== chatId) return
        receivedStreamTextRef.current = true
        updateLastAgentMessage(chatId, (lastMessage) => ({
          ...lastMessage,
          content: `${lastMessage.content}${chunk}`,
          isStreaming: true,
        }))
        requestAnimationFrame(() => scrollToBottom())
      },
      onComplete: () => {
        setIsStreaming(false)
        streamRef.current = null
        updateLastAgentMessage(chatId, (lastMessage) => ({
          ...lastMessage,
          timestamp: new Date().toLocaleTimeString(),
          isStreaming: false,
        }))
        if (!receivedStreamTextRef.current) {
          antdMessage.warning('未收到流式响应，尝试改用非流式接口')
          fallbackOnce(chatId, msg, messageId, resolvedWebSearchEnabled)
          return
        }
        void hydrateLatestMessageFromServer(chatId)
      },
      onError: () => {
        setIsStreaming(false)
        streamRef.current = null
        updateLastAgentMessage(chatId, (lastMessage) => ({
          ...lastMessage,
          timestamp: new Date().toLocaleTimeString(),
          isStreaming: false,
        }))
        antdMessage.error('SSE 连接中断，尝试使用一次性接口')
        fallbackOnce(chatId, msg, messageId, resolvedWebSearchEnabled)
      },
    })
  }

  useEffect(() => {
    activeChatIdRef.current = activeChatId
  }, [activeChatId])

  useEffect(() => {
    const mediaElement = voiceAudioRef.current
    if (!mediaElement || voiceManagerRef.current) return

    const absoluteApiBase = resolveAbsoluteApiBase()
    const wsUrl = buildVoiceWsUrl(absoluteApiBase)

    const manager = new StreamingVoiceManager({
      wsUrl,
      sseUrlBuilder: (turnId) => `${absoluteApiBase}/voice/turn/${encodeURIComponent(turnId)}/text/stream`,
      mediaElement,
      eventSourceWithCredentials: true,
      autoPlay: true,
    })

    if (typeof MediaSource !== 'undefined' && !MediaSource.isTypeSupported('audio/mpeg')) {
      antdMessage.warning('当前浏览器不支持 audio/mpeg 的 MSE 流播放，语音输出可能无法播放')
    }

    const unsubscribeState = manager.onStateChange(({ visibleStatus }) => {
      setVoiceStatus(visibleStatus)
      const currentTurn = voiceTurnRef.current
      if (!currentTurn) return

      if (visibleStatus === 'completed' || visibleStatus === 'interrupted' || visibleStatus === 'failed') {
        if (visibleStatus === 'completed' && currentTurn.receivedAgentText && !voiceAudioReceivedRef.current) {
          antdMessage.warning('本轮仅收到文本增量，未检测到语音音频流，请检查 /ws/voice 是否返回二进制帧')
        }
        updateMessageById(currentTurn.agentMessageId, (message) => ({
          ...message,
          isStreaming: false,
          timestamp: new Date().toLocaleTimeString(),
        }))
        bumpSession(currentTurn.chatId)
        if (visibleStatus === 'completed') {
          void hydrateLatestMessageFromServer(currentTurn.chatId)
        }
        voiceTurnRef.current = null
        voiceAudioReceivedRef.current = false
      }
    })

    const unsubscribeAudioState = manager.onAudioState(({ playing, bufferedAheadSeconds, skipped, mimeType }) => {
      setVoicePlaybackState({ playing, bufferedAheadSeconds, skipped, mimeType })
      if (playing || bufferedAheadSeconds > 0) {
        voiceAudioReceivedRef.current = true
      }
    })

    const unsubscribeText = manager.onText(({ text }) => {
      const currentTurn = voiceTurnRef.current
      if (!currentTurn) return
      currentTurn.receivedAgentText = true
      updateMessageById(currentTurn.agentMessageId, (message) => ({
        ...message,
        content: `${message.content}${text}`,
        isStreaming: true,
      }))
      requestAnimationFrame(() => scrollToBottom())
    })

    const unsubscribeAsrFinal = manager.onAsrFinal(({ text }) => {
      const currentTurn = voiceTurnRef.current
      if (!currentTurn) return
      updateMessageById(currentTurn.userMessageId, (message) => ({
        ...message,
        content: text || '（未识别到语音）',
        timestamp: new Date().toLocaleTimeString(),
      }))
      setDraft(text)
    })

    const unsubscribeError = manager.onError(({ code, message }) => {
      antdMessage.error(code ? `[${code}] ${message || '语音通道异常'}` : message || '语音通道异常')
      const currentTurn = voiceTurnRef.current
      if (!currentTurn) return
      updateMessageById(currentTurn.agentMessageId, (msg) => ({
        ...msg,
        isStreaming: false,
        timestamp: new Date().toLocaleTimeString(),
      }))
      voiceTurnRef.current = null
      voiceAudioReceivedRef.current = false
    })

    manager
      .start()
      .then(() => setVoiceConnected(true))
      .catch((err) => {
        setVoiceConnected(false)
        antdMessage.error((err as Error)?.message || '语音服务连接失败')
      })

    voiceManagerRef.current = manager

    return () => {
      unsubscribeState()
      unsubscribeAudioState()
      unsubscribeText()
      unsubscribeAsrFinal()
      unsubscribeError()
      setVoiceConnected(false)
      setVoicePlaybackState(null)
      voiceTurnRef.current = null
      voiceAudioReceivedRef.current = false
      manager.destroy()
      voiceManagerRef.current = null
    }
  }, [bumpSession, hydrateLatestMessageFromServer, scrollToBottom, updateMessageById])

  // Fetch available models once on mount (not admin-view-specific)
  useEffect(() => {
    listAvailableModels()
      .then((models) => {
        setAvailableModels(models)
        if (models.length > 0) {
          setSelectedModelId((prev) => prev ?? models[0].modelId)
        }
      })
      .catch(() => {
        // silently ignore; user can still chat with default model
      })
  }, [])

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
      void stopVoiceTurn()
    }
  }, [closeStream, stopVoiceTurn])

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

  const handleVoiceStart = useCallback(async () => {
    const manager = voiceManagerRef.current
    if (!manager) {
      antdMessage.warning('语音服务未就绪，请稍后重试')
      return
    }
    if (!canChat) {
      antdMessage.warning(isActivating ? '正在同步团队，请稍后重试' : '请先选择团队再开始对话')
      return
    }

    let chatId: string | null = null
    try {
      chatId = await ensureSession('语音对话')
    } catch (err) {
      antdMessage.error((err as Error)?.message || '团队同步失败')
      return
    }
    if (!chatId) return

    if (isStreaming && streamRef.current) {
      closeStream()
    }

    const now = new Date().toLocaleTimeString()
    const userMessageId = createClientMessageId()
    const agentMessageId = createClientMessageId()

    setMessages((prev) => [
      ...prev,
      { id: userMessageId, role: 'user', content: '正在聆听...', timestamp: now },
      { id: agentMessageId, role: 'agent', content: '', timestamp: '生成中', isStreaming: true },
    ])
    requestAnimationFrame(() => scrollToBottom())

    voiceTurnRef.current = {
      chatId,
      userMessageId,
      agentMessageId,
      receivedAgentText: false,
    }
    voiceAudioReceivedRef.current = false

    try {
      await manager.startTurn({
        chatId,
        captureMicrophone: true,
        webSearchEnabled: resolvedWebSearchEnabled ?? false,
      })
    } catch (err) {
      antdMessage.error((err as Error)?.message || '启动语音输入失败')
      updateMessageById(agentMessageId, (message) => ({
        ...message,
        content: message.content || '语音输入失败，请重试。',
        isStreaming: false,
        timestamp: new Date().toLocaleTimeString(),
      }))
      voiceTurnRef.current = null
      voiceAudioReceivedRef.current = false
    }
  }, [canChat, closeStream, ensureSession, isActivating, isStreaming, resolvedWebSearchEnabled, scrollToBottom, updateMessageById])

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
  const handleSelectTenantFromHeader = useCallback(
    async (tenantId: number, tenantName: string) => {
      await setActiveTenant(tenantId)
      antdMessage.success(`已切换至 ${tenantName}`)
    },
    [setActiveTenant],
  )
  const recentSessions = useMemo(() => sessions.slice(0, 3), [sessions])
  const archivedSessions = useMemo(() => sessions.slice(3), [sessions])
  const isVoiceTurnActive = ['listening', 'recognizing', 'thinking', 'speaking'].includes(voiceStatus)
  const voiceButtonLabel =
    voiceStatus === 'listening'
      ? '点击结束'
      : voiceStatus === 'recognizing'
        ? '识别中'
        : voiceStatus === 'thinking'
          ? '思考中'
          : voiceStatus === 'speaking'
            ? '播放中'
            : '点击说话'
  const chatHint = activeTenantError
    ? `团队同步失败：${activeTenantError}`
    : !canChat
      ? isActivating
        ? '正在同步团队...'
        : '未选择团队，无法请求 AI'
      : null
  const renderSessionItem = useCallback(
    (session: ChatSessionRecord, { showAbsoluteTime = true }: { showAbsoluteTime?: boolean } = {}) => {
      const isActive = session.chatId === activeChatId
      const label = session.title || '未命名会话'
      const sessionTime = session.lastMessageAt ?? session.createdAt
      const clockLabel = formatClockTime(sessionTime)
      const dayLabel = formatRelativeSessionDay(sessionTime)
      const absoluteTimeLabel = formatSessionTime(sessionTime)
      const sessionTail = session.chatId.slice(-4).toUpperCase()

      return (
        <button
          key={session.chatId}
          type="button"
          className={`w-full rounded-2xl border px-3 py-2.5 text-left transition-all ${
            isActive
              ? 'border-primary/30 bg-primary/[0.09] shadow-[inset_0_0_0_1px_rgba(68,237,38,0.08)]'
              : 'border-transparent bg-white/[0.02] hover:border-white/8 hover:bg-white/[0.05]'
          }`}
          onClick={() => handleSelectSession(session.chatId)}
        >
          <div className="flex items-start justify-between gap-3">
            <p
              className={`min-w-0 flex-1 truncate text-[13px] ${
                isActive ? 'font-semibold text-slate-100' : 'font-medium text-slate-300'
              }`}
            >
              {label}
            </p>
            <span className={`shrink-0 text-[10px] font-medium ${isActive ? 'text-primary' : 'text-slate-500'}`}>
              {clockLabel || '--:--'}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between gap-2 text-[10px]">
            <span className={isActive ? 'text-slate-300' : 'text-slate-500'}>{dayLabel || '暂无记录'}</span>
            <span className={isActive ? 'text-slate-400' : 'text-slate-600'}>#{sessionTail}</span>
          </div>
          {session.modelDisplayName ? (
            <div className="mt-1 flex items-center gap-1 text-[10px]">
              <span className="material-symbols-outlined text-[11px] text-slate-500">model_training</span>
              <span className={`truncate ${isActive ? 'text-slate-400' : 'text-slate-600'}`}>
                {session.modelDisplayName}
              </span>
            </div>
          ) : null}
          {showAbsoluteTime && absoluteTimeLabel ? (
            <div className={`mt-1 truncate text-[10px] ${isActive ? 'text-slate-400' : 'text-slate-600'}`}>
              {absoluteTimeLabel}
            </div>
          ) : null}
        </button>
      )
    },
    [activeChatId, handleSelectSession],
  )

  return (
    <div className="flex h-full w-full gap-4 lg:gap-6 overflow-hidden">
      <aside className="glass-panel w-72 rounded-2xl flex flex-col overflow-hidden transition-all duration-300">
          <div className="p-4 pb-3 space-y-3">
            <TeamSwitcherBar
              tenants={tenants}
              activeTenant={activeTenant}
              activeSessionTitle={activeSession?.title}
              isActivating={isActivating}
              canChat={canChat}
              onSelectTenant={handleSelectTenantFromHeader}
              variant="sidebar"
            />
            {/* Model selector — only show when models are available and not in admin view */}
            {!adminView && availableModels.length > 0 ? (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.18em] px-1">
                  选择模型
                </label>
                <Select
                  className="w-full"
                  variant="filled"
                  size="middle"
                  value={selectedModelId}
                  disabled={!canChat}
                  onChange={(value) => setSelectedModelId(value || undefined)}
                  options={availableModels.map((model) => ({
                    label: model.displayName,
                    value: model.modelId,
                  }))}
                  popupMatchSelectWidth={false}
                />
              </div>
            ) : null}
            <button
              type="button"
              className="w-full bg-white/5 hover:bg-primary/10 border border-white/10 hover:border-primary/40 text-primary py-3 px-4 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold transition-all disabled:opacity-50 disabled:text-slate-500 disabled:hover:bg-white/5"
              disabled={!canChat || isCreatingSession}
              onClick={() => createNewSession(NEW_SESSION_TITLE)}
            >
              <span className="material-symbols-outlined">add</span>
              新建对话
            </button>
            {adminView ? (
              <div className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                管理员视角：tenantId={adminTenantId || '-'} userId={adminUserId || '-'}
              </div>
            ) : null}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-3 space-y-4" onScroll={handleSessionScroll}>
            <div>
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.18em] px-2 mb-2">
                最近记录
              </h3>
              <div className="space-y-2">
                {recentSessions.map((session) => renderSessionItem(session))}
                {isLoadingSessions ? (
                  <div className="text-xs font-bold text-slate-500 px-2 py-2">加载中...</div>
                ) : null}
                {!isLoadingSessions && sessions.length === 0 ? (
                  <div className="text-xs font-bold text-slate-500 px-2 py-2">
                    {canListSessions ? '暂无会话记录' : '请选择团队后加载会话'}
                  </div>
                ) : null}
              </div>
            </div>

            {archivedSessions.length ? (
              <div>
                <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-[0.18em] px-2 mb-2">
                  历史存档
                </h3>
                <div className="space-y-2">
                  {archivedSessions.map((session) =>
                    renderSessionItem(session, { showAbsoluteTime: false }),
                  )}
                  {!isLoadingSessions && sessions.length > 0 ? (
                    <div className="text-[11px] font-bold text-slate-600 px-2 py-2">
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
          <audio ref={voiceAudioRef} hidden />
          <div className="chat-glass flex-1 rounded-2xl flex flex-col overflow-hidden relative z-10">
            <div
              ref={messageSurfaceRef}
              onScroll={handleMessageScroll}
              className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3 sm:px-6 sm:py-4 lg:px-7 lg:py-4 space-y-2.5 sm:space-y-3"
            >
              {!hasMessages ? (
                <div className="max-w-[min(100%,72rem)]">
                  <div className="flex gap-3 sm:gap-4 max-w-[min(100%,72rem)] items-start">
                    <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-slate-950 shrink-0 shadow-lg glow-mint ring-1 ring-white/10">
                      <span className="material-symbols-outlined font-bold">smart_toy</span>
                    </div>
                    <div className="space-y-3 pt-0.5">
                      <p className="text-slate-200 leading-[1.6] text-[14px] sm:text-[15px] font-normal max-w-3xl">
                        你好！我可以基于你的知识库回答问题、总结文档，并生成结构化内容。
                      </p>
                      {activeSession?.modelDisplayName ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 border border-primary/20 rounded-full text-[11px] font-semibold text-primary">
                          <span className="material-symbols-outlined text-[13px]">model_training</span>
                          {activeSession.modelDisplayName}
                        </div>
                      ) : null}
                      <div className="flex gap-1.5 flex-wrap">
                        {intentPresets.map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            className="px-2.5 py-1 bg-slate-900/50 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-[0.18em] border border-white/10 hover:border-primary/50 hover:text-primary transition-colors backdrop-blur-md"
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

            <div className="px-4 pb-4 pt-0 sm:px-6 sm:pb-6 lg:px-7 lg:pb-7">
              <div className="bg-[#111827]/88 border border-white/6 rounded-[1.4rem] px-3 py-2 sm:px-3.5 sm:py-2.5 backdrop-blur-xl focus-within:border-white/10 transition-colors shadow-[0_14px_36px_rgba(0,0,0,0.28)]">
                <div className="flex items-end gap-2">
                  <div className="flex-1 pb-0.5">
                    <textarea
                      ref={inputRef}
                      className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-slate-100 placeholder:text-slate-500/80 resize-none py-1.5 text-[14px] sm:text-[15px] leading-[1.5] disabled:opacity-60"
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
                  <div className="shrink-0">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className={`h-10 rounded-2xl border px-3 text-[11px] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          isVoiceTurnActive
                            ? 'border-primary/60 bg-primary/15 text-primary'
                            : 'border-white/8 bg-[#0b1220] text-slate-300 hover:bg-[#111a2b] hover:border-white/15'
                        }`}
                        disabled={!canChat || !voiceConnected}
                        onClick={() => {
                          if (isVoiceTurnActive) {
                            void stopVoiceTurn()
                            return
                          }
                          void handleVoiceStart()
                        }}
                        title={
                          voiceConnected
                            ? isVoiceTurnActive
                              ? '点击结束本次语音输入'
                              : '点击开始语音输入，再次点击结束并发送'
                            : '语音服务连接中'
                        }
                      >
                        {voiceButtonLabel}
                      </button>
                      <button
                        type="button"
                        className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[#0b1220] text-slate-500 border border-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed enabled:text-slate-200 enabled:hover:bg-[#111a2b] enabled:hover:border-white/10"
                        disabled={!canChat || !draft.trim()}
                        onClick={() => void handleSend(draft)}
                        title="发送"
                      >
                        <span className="material-symbols-outlined font-black">send</span>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-2">
                  <div className="inline-flex items-center gap-1 rounded-full border border-white/6 bg-[#0b1220] p-1">
                    {WEB_SEARCH_OPTIONS.map((option) => {
                      const active = webSearchMode === option.value
                      return (
                        <button
                          key={option.value}
                          type="button"
                          className={`rounded-full px-3 py-1 text-[11px] font-bold transition-colors ${
                            active
                              ? 'bg-primary text-slate-950'
                              : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                          }`}
                          onClick={() => setWebSearchMode(option.value)}
                        >
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                    <span className="material-symbols-outlined text-[13px]">travel_explore</span>
                    {webSearchHint}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                    <span className="material-symbols-outlined text-[13px]">mic</span>
                    {voiceConnected ? `语音状态：${voiceStatus}` : '语音服务连接中'}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                    <span className="material-symbols-outlined text-[13px]">volume_up</span>
                    {voicePlaybackState
                      ? `播放: ${voicePlaybackState.playing ? '进行中' : '待播'} | 缓冲 ${voicePlaybackState.bufferedAheadSeconds.toFixed(2)}s | ${voicePlaybackState.mimeType}`
                      : '播放状态：未收到音频'}
                  </div>
                </div>
              </div>

              {chatHint ? <div className="mt-3 text-[11px] font-bold text-slate-500">{chatHint}</div> : null}
            </div>
          </div>
      </main>
    </div>
  )
}

export default ChatPage
