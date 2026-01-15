import { OpenAPI } from '@/api'
import { http } from '@/services/http'

type StreamHandle = {
  close: () => void
}

export const streamChat = ({
  chatId,
  message,
  onData,
  onComplete,
  onError,
}: {
  chatId: string
  message: string
  onData: (delta: string) => void
  onComplete?: () => void
  onError?: (err: Error) => void
}): StreamHandle => {
  const url = `${OpenAPI.BASE}/ai_friend/do_chat/sse/emitter?chatMessage=${encodeURIComponent(message)}&chatId=${encodeURIComponent(chatId)}`
  const controller = new AbortController()

  const parseEventChunk = (chunk: string) => {
    const lines = chunk.split('\n')
    const dataLines: string[] = []
    let eventType = ''
    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventType = line.replace('event:', '').trim()
      }
      if (line.startsWith('data:')) {
        dataLines.push(line.replace('data:', '').trimStart())
      }
    }

    if (eventType === 'end' || eventType === 'done') {
      onComplete?.()
      controller.abort()
      return
    }

    if (dataLines.length === 0) return
    const payload = dataLines.join('\n')
    if (payload === '[DONE]') {
      onComplete?.()
      controller.abort()
      return
    }
    onData(payload)
  }

  const start = async () => {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'text/event-stream' },
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

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? ''
        for (const part of parts) {
          if (part.trim()) parseEventChunk(part.trim())
        }
      }

      if (buffer.trim()) {
        parseEventChunk(buffer.trim())
      }

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
