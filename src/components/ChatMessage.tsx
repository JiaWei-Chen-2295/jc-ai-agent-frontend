import { useState } from 'react'

import { XMarkdown } from '@ant-design/x-markdown'
import Latex from '@ant-design/x-markdown/plugins/Latex'

import '@ant-design/x-markdown/dist/x-markdown.css'

import type { StudyFriendSource } from '@/features/chat/chatApi'

type ChatMessageProps = {
  role: 'user' | 'agent'
  content: string
  sources?: StudyFriendSource[]
  webSearchUsed?: boolean
  timestamp?: string
  isStreaming?: boolean
}

const markdownConfig = { extensions: Latex() }

const renderTextBlock = (text: string) => <pre className="m-0 whitespace-pre-wrap break-words font-inherit">{text}</pre>

const renderMarkdown = (text: string) => (
  <XMarkdown
    style={{ background: 'transparent', padding: 0, whiteSpace: 'pre-wrap' }}
    className="chat-markdown"
    config={markdownConfig}
    openLinksInNewTab
  >
    {text}
  </XMarkdown>
)

const messageActions = ['content_copy', 'thumb_up', 'thumb_down', 'share', 'autorenew', 'more_horiz']

export const ChatMessage = ({ role, content, sources, webSearchUsed, timestamp, isStreaming }: ChatMessageProps) => {
  const isAgent = role === 'agent'
  const [sourcesExpanded, setSourcesExpanded] = useState(Boolean(isStreaming))
  const renderedBody = (() => {
    if (isAgent && isStreaming) {
      return content ? renderMarkdown(content) : renderTextBlock('...')
    }
    return renderMarkdown(content)
  })()

  if (isAgent) {
    return (
      <div className="max-w-[min(100%,52rem)] min-w-0">
        <div className="space-y-1 pt-0 min-w-0">
          {webSearchUsed ? (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
              <span className="material-symbols-outlined text-[14px]">travel_explore</span>
              已联网搜索
            </div>
          ) : null}

          <div className="py-0.5 max-w-[min(100%,52rem)]">
            <div className="text-slate-100 leading-[1.5] text-[14px] sm:text-[15px] font-normal break-words">{renderedBody}</div>
          </div>

          {sources && sources.length ? (
            <div className="rounded-2xl border border-white/8 bg-slate-950/35 px-3 py-3">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 text-left"
                onClick={() => setSourcesExpanded((value) => !value)}
              >
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  <span className="material-symbols-outlined text-[15px]">link</span>
                  查看来源
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] tracking-normal text-slate-300">
                    {sources.length}
                  </span>
                </div>
                <span className="material-symbols-outlined text-[18px] text-slate-500">
                  {sourcesExpanded ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {sourcesExpanded ? (
                <div className="mt-3 space-y-2">
                  {sources.map((source, index) => {
                    const sourceUrl = source.url ?? source.href
                    return (
                      <article
                        key={`${source.title}-${sourceUrl ?? index}`}
                        className="rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-2.5"
                      >
                        <div className="space-y-1.5">
                          <div className="text-[13px] font-semibold text-slate-100">{source.title}</div>
                          {sourceUrl ? (
                            <a
                              href={sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="block break-all text-[11px] text-primary hover:text-primary/80"
                            >
                              {sourceUrl}
                            </a>
                          ) : null}
                          {source.snippet ? (
                            <p className="text-[12px] leading-5 text-slate-400">{source.snippet}</p>
                          ) : null}
                        </div>
                      </article>
                    )
                  })}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-2 pt-0">
            <div className="flex items-center gap-1">
              {messageActions.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
                  aria-label={icon}
                >
                  <span className="material-symbols-outlined text-[17px]">{icon}</span>
                </button>
              ))}
            </div>
            {timestamp ? <div className="text-[10px] font-medium text-slate-600 tracking-[0.08em]">{timestamp}</div> : null}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[min(100%,52rem)] ml-auto flex flex-col items-end gap-0.5">
      {timestamp ? <div className="pr-0.5 text-[10px] font-medium text-slate-600 tracking-[0.04em]">{timestamp}</div> : null}
      <div className="bg-[linear-gradient(180deg,rgba(24,38,58,0.96),rgba(17,24,39,0.96))] px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-[1.1rem] border border-[#243244] shadow-[0_6px_14px_rgba(0,0,0,0.14)] max-w-[min(64%,30rem)] min-w-0 inline-flex items-center">
        <div className="text-slate-100 leading-[1.3] text-[14px] sm:text-[15px] break-words">{renderedBody}</div>
      </div>
    </div>
  )
}

export default ChatMessage
