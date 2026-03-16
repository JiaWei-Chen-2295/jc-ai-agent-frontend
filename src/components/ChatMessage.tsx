import { XMarkdown } from '@ant-design/x-markdown'
import Latex from '@ant-design/x-markdown/plugins/Latex'

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

const markdownConfig = { extensions: Latex() }

const renderTextBlock = (text: string) => <pre className="m-0 whitespace-pre-wrap break-words font-inherit">{text}</pre>

const renderCodeBlock = (code: string) => (
  <pre className="m-0 whitespace-pre overflow-x-auto rounded-2xl border border-white/10 bg-[#0d1117]/90 px-5 py-4 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
    <code className="font-mono text-[13px] leading-relaxed text-[#c9d1d9]">{code}</code>
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

const messageActions = ['content_copy', 'thumb_up', 'thumb_down', 'share', 'autorenew', 'more_horiz']

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
  const stageText = displayStage ? stageLabel[displayStage] : undefined
  const renderedBody = (() => {
    if (isAgent && displayStage && displayPanel) {
      return displayPanel.content ? renderByFormat(displayPanel.format, displayPanel.content) : renderTextBlock('...')
    }
    if (isAgent && isStreaming) {
      return content ? renderByFormat('markdown', content) : renderTextBlock('...')
    }
    return (
      <XMarkdown
        style={{ background: 'transparent', padding: 0, whiteSpace: 'pre-wrap' }}
        className="chat-markdown"
        config={markdownConfig}
        openLinksInNewTab
      >
        {content}
      </XMarkdown>
    )
  })()

  if (isAgent) {
    return (
      <div className="max-w-[min(100%,52rem)] min-w-0">
        <div className="space-y-1 pt-0 min-w-0">
          {stageText && (displayStage === 'searching' || displayStage === 'thinking') ? (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.22em]">
                {displayStage === 'thinking' ? '正在思考...' : `${stageText}...`}
              </span>
            </div>
          ) : null}

          <div className="py-0.5 max-w-[min(100%,52rem)]">
            <div
              className={
                stageText && (displayStage === 'searching' || displayStage === 'thinking')
                  ? 'text-slate-300 leading-[1.5] text-[14px] sm:text-[15px] font-light border-l-2 border-white/10 pl-2.5 italic break-words'
                  : 'text-slate-100 leading-[1.5] text-[14px] sm:text-[15px] font-normal break-words'
              }
            >
              {renderedBody}
            </div>
          </div>

          {sources && sources.length ? (
            <div className="flex gap-1.5 flex-wrap">
              {sources.map((source, index) => (
                <button
                  key={`${source.title}-${index}`}
                  type="button"
                  className="inline-flex items-center gap-1 bg-slate-900/55 text-slate-300 px-2 py-1 rounded-full text-[10px] font-bold border border-white/6 hover:bg-slate-900/70 transition-all"
                  onClick={() => {
                    if (source.href) window.open(source.href, '_blank', 'noopener,noreferrer')
                  }}
                  title={source.href ? '打开来源' : source.title}
                >
                  <span className="material-symbols-outlined text-sm">link</span>
                  {source.title}
                </button>
              ))}
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
