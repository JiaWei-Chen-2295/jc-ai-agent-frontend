import { OpenAPI, Service } from '@/api'

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
  onError?: (err: Event) => void
}) => {
  const url = `${OpenAPI.BASE}/ai_friend/do_chat/sse/emitter?chatMessage=${encodeURIComponent(message)}&chatId=${encodeURIComponent(chatId)}`
  const source = new EventSource(url)

  source.onmessage = (event) => {
    onData(event.data)
  }

  source.onerror = (event) => {
    onError?.(event)
    source.close()
  }

  source.onopen = () => {
    // no-op
  }

  source.addEventListener('end', () => {
    onComplete?.()
    source.close()
  })

  return source
}

export const fetchChatOnce = (chatId: string, message: string) =>
  Service.doChatWithRag({ chatId, chatMessage: message })
