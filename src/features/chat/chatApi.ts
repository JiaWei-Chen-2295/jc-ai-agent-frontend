import { OpenAPI } from '@/api'
import { http } from '@/services/http'

type BaseResponse<T> = {
  code?: number
  data?: T
  message?: string
}

export type StudyFriendSource = {
  title: string
  url?: string
  href?: string
  snippet?: string
}

export type StudyFriendSourcePayload = {
  webSearchUsed?: boolean
  sources?: StudyFriendSource[]
}

export type StudyFriendChatResult = {
  content?: string
  webSearchUsed?: boolean
  sources?: StudyFriendSource[]
}

export type AiModelVO = {
  id: number
  provider: string
  modelId: string
  displayName: string
  description?: string
  iconUrl?: string
  sortOrder: number
  enabled: boolean
}

export type ChatSessionRecord = {
  chatId: string
  title?: string
  modelId?: string
  modelDisplayName?: string
  lastMessageAt?: string
  createdAt?: string
}

export type ChatSessionListResponse = {
  records?: ChatSessionRecord[]
  hasMore?: boolean
  nextChatId?: string
  nextLastMessageAt?: string
}

export type ChatMessageRecord = {
  id?: string | number
  role?: string
  content?: string
  message?: string
  createdAt?: string
  createTime?: string
  messageAt?: string
  sources?: StudyFriendSource[]
  webSearchUsed?: boolean
  [key: string]: unknown
}

export type ChatMessageListResponse = {
  records?: ChatMessageRecord[]
  hasMore?: boolean
  nextBeforeId?: string | number
}

type StreamHandle = {
  close: () => void
}

const parseSourcesPayload = (payload: string): StudyFriendSourcePayload | null => {
  try {
    const parsed = JSON.parse(payload) as StudyFriendSourcePayload | null
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

const clampLimit = (limit = 10) => Math.min(Math.max(limit, 1), 50)

const unwrapResponse = <T>(response: BaseResponse<T>, fallbackMessage: string) => {
  if (response?.code && response.code !== 0) {
    throw new Error(response.message || fallbackMessage)
  }
  return response?.data
}

export const listAvailableModels = () =>
  http
    .get('/ai/models')
    .then((response) => {
      // endpoint returns a plain array (not wrapped)
      const data = response.data
      if (Array.isArray(data)) return data as AiModelVO[]
      return unwrapResponse<AiModelVO[]>(data, '获取模型列表失败') ?? []
    })

export const createChatSession = (title?: string, modelId?: string) =>
  http
    .post('/ai_friend/session', null, {
      params: {
        ...(title ? { title } : {}),
        ...(modelId ? { modelId } : {}),
      },
    })
    .then((response) => unwrapResponse<ChatSessionRecord>(response.data, '创建会话失败'))

export const listChatSessions = ({
  beforeLastMessageAt,
  beforeChatId,
  limit = 10,
  admin = false,
  tenantId,
  userId,
}: {
  beforeLastMessageAt?: string
  beforeChatId?: string
  limit?: number
  admin?: boolean
  tenantId?: string
  userId?: string
} = {}) =>
  http
    .get(admin ? '/ai_friend/admin/session/list' : '/ai_friend/session/list', {
      params: {
        beforeLastMessageAt,
        beforeChatId,
        limit: clampLimit(limit),
        ...(admin
          ? {
              tenantId,
              userId,
            }
          : {}),
      },
    })
    .then((response) => unwrapResponse<ChatSessionListResponse>(response.data, '获取会话列表失败'))

export const listChatMessages = ({
  chatId,
  beforeId,
  limit = 10,
  admin = false,
}: {
  chatId: string
  beforeId?: string | number
  limit?: number
  admin?: boolean
}) =>
  http
    .get(admin ? `/ai_friend/admin/session/${chatId}/messages` : `/ai_friend/session/${chatId}/messages`, {
      params: {
        beforeId,
        limit: clampLimit(limit),
      },
    })
    .then((response) => unwrapResponse<ChatMessageListResponse>(response.data, '获取消息记录失败'))

export const streamChat = ({
  chatId,
  message,
  messageId,
  webSearchEnabled,
  useToolEndpoint = true,
  onTextDelta,
  onSources,
  onComplete,
  onError,
}: {
  chatId: string
  message: string
  messageId?: string
  webSearchEnabled?: boolean
  useToolEndpoint?: boolean
  onTextDelta: (chunk: string) => void
  onSources?: (payload: StudyFriendSourcePayload) => void
  onComplete?: () => void
  onError?: (err: Error) => void
}): StreamHandle => {
  const params = new URLSearchParams({
    chatMessage: message,
    chatId,
  })
  if (messageId) params.set('messageId', messageId)
  if (webSearchEnabled !== undefined) {
    params.set('webSearchEnabled', String(webSearchEnabled))
  }

  const endpoint = useToolEndpoint
    ? '/ai_friend/do_chat/sse_with_tool/emitter'
    : '/ai_friend/do_chat/sse/emitter'
  const url = `${OpenAPI.BASE}${endpoint}?${params.toString()}`
  const controller = new AbortController()

  const start = async () => {
    const completeAndAbort = () => {
      onComplete?.()
      controller.abort()
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'text/event-stream', 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
        credentials: 'include',
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`SSE request failed: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('SSE response has no body')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      let currentEventType: string | undefined
      let currentDataLines: string[] = []

      const dispatchCurrentEvent = () => {
        const eventType = (currentEventType ?? 'message').toLowerCase()
        const data = currentDataLines.join('\n')
        currentEventType = undefined
        currentDataLines = []

        if (!eventType && !data) return

        if (eventType === 'end' || eventType === 'done') {
          completeAndAbort()
          return
        }

        if (data === '[DONE]') {
          completeAndAbort()
          return
        }

        if (eventType === 'sources') {
          const payload = parseSourcesPayload(data)
          if (payload) {
            onSources?.(payload)
          }
          return
        }

        if (eventType !== 'message') return
        onTextDelta(data)
      }

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        const decoded = decoder.decode(value, { stream: true })

        buffer += decoded
        buffer = buffer.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

        while (true) {
          const newlineIndex = buffer.indexOf('\n')
          if (newlineIndex === -1) break
          const rawLine = buffer.slice(0, newlineIndex)
          buffer = buffer.slice(newlineIndex + 1)

          if (rawLine === '') {
            dispatchCurrentEvent()
            continue
          }

          if (rawLine.startsWith(':')) continue
          if (rawLine.startsWith('event:')) {
            currentEventType = rawLine.slice('event:'.length).trim()
            continue
          }
          if (!rawLine.startsWith('data:')) continue

          let dataPart = rawLine.slice('data:'.length)
          if (dataPart.startsWith(' ')) dataPart = dataPart.slice(1)
          currentDataLines.push(dataPart)
        }
      }

      if (buffer.length > 0) {
        buffer += '\n'
        while (true) {
          const newlineIndex = buffer.indexOf('\n')
          if (newlineIndex === -1) break
          const rawLine = buffer.slice(0, newlineIndex)
          buffer = buffer.slice(newlineIndex + 1)
          if (rawLine === '') {
            dispatchCurrentEvent()
            continue
          }
          if (rawLine.startsWith(':')) continue
          if (rawLine.startsWith('event:')) {
            currentEventType = rawLine.slice('event:'.length).trim()
            continue
          }
          if (!rawLine.startsWith('data:')) continue
          let dataPart = rawLine.slice('data:'.length)
          if (dataPart.startsWith(' ')) dataPart = dataPart.slice(1)
          currentDataLines.push(dataPart)
        }
      }

      dispatchCurrentEvent()
      onComplete?.()
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      onError?.(err as Error)
    }
  }

  start()

  return {
    close: () => controller.abort(),
  }
}

export const fetchChatOnce = ({
  chatId,
  message,
  messageId,
  webSearchEnabled,
}: {
  chatId: string
  message: string
  messageId?: string
  webSearchEnabled?: boolean
}) =>
  http
    .get('/ai_friend/do_chat/async', {
      params: {
        chatMessage: message,
        chatId,
        ...(messageId ? { messageId } : {}),
        ...(webSearchEnabled !== undefined ? { webSearchEnabled } : {}),
      },
    })
    .then((response) => unwrapResponse<StudyFriendChatResult>(response.data, '聊天接口调用失败'))
