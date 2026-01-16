import { OpenAPI } from '@/api'
import { http } from '@/services/http'

import { parseDisplayEvent, type DisplayEvent } from './displayEvent'

type BaseResponse<T> = {
  code?: number
  data?: T
  message?: string
}

type Source = { title: string; href?: string }

export type ChatSessionRecord = {
  chatId: string
  title?: string
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
  sources?: Source[]
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

const clampLimit = (limit = 10) => Math.min(Math.max(limit, 1), 50)

const unwrapResponse = <T>(response: BaseResponse<T>, fallbackMessage: string) => {
  if (response?.code && response.code !== 0) {
    throw new Error(response.message || fallbackMessage)
  }
  return response?.data
}

export const createChatSession = (title?: string) =>
  http
    .post('/ai_friend/session', null, {
      params: title ? { title } : undefined,
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
  onEvent,
  onComplete,
  onError,
}: {
  chatId: string
  message: string
  onEvent: (event: DisplayEvent) => void
  onComplete?: () => void
  onError?: (err: Error) => void
}): StreamHandle => {
  const url = `${OpenAPI.BASE}/ai_friend/do_chat/sse/agent/emitter?chatMessage=${encodeURIComponent(message)}&chatId=${encodeURIComponent(chatId)}`
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
        const eventType = (currentEventType ?? '').toLowerCase()
        const data = currentDataLines.join('\n')
        currentEventType = undefined
        currentDataLines = []

        if (!eventType && !data) return

        if (eventType && eventType !== 'display') {
          if (eventType === 'end' || eventType === 'done') {
            completeAndAbort()
          }
          return
        }

        if (data === '[DONE]') {
          completeAndAbort()
          return
        }

        const parsed = parseDisplayEvent(data)
        if (parsed) {
          onEvent(parsed)
        }
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

export const fetchChatOnce = (chatId: string, message: string) =>
  http
    .get('/ai_friend/do_chat/async', {
      params: { chatMessage: message, chatId },
      headers: { Accept: 'text/plain,application/json;q=0.9' },
      responseType: 'text',
    })
    .then((response) => response.data)
