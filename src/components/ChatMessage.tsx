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
      <div className="flex gap-6 max-w-5xl">
        <div className="w-10 h-10 rounded-xl bg-primary/90 ring-1 ring-white/10 flex items-center justify-center text-white shrink-0 shadow-lg glow-mint">
          <span className="material-symbols-outlined font-bold">smart_toy</span>
        </div>
        <div className="space-y-5 pt-1 min-w-0">
          {stageText && (displayStage === 'searching' || displayStage === 'thinking') ? (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">
                {displayStage === 'thinking' ? '正在思考...' : `${stageText}...`}
              </span>
            </div>
          ) : null}

          <div className="rounded-3xl rounded-tl-md bg-slate-900/55 border border-white/10 backdrop-blur-xl px-6 py-5 shadow-[0_18px_45px_rgba(0,0,0,0.4)]">
            <div
              className={
                stageText && (displayStage === 'searching' || displayStage === 'thinking')
                  ? 'text-slate-300 leading-[1.75] text-[15px] sm:text-base font-light border-l-2 border-primary/30 pl-4 italic break-words'
                  : 'text-slate-100 leading-[1.75] text-[15px] sm:text-base font-normal break-words'
              }
            >
              {renderedBody}
            </div>
          </div>

          {sources && sources.length ? (
            <div className="flex gap-2 flex-wrap">
              {sources.map((source, index) => (
                <button
                  key={`${source.title}-${index}`}
                  type="button"
                  className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-1 rounded-full text-[11px] font-bold border border-primary/30 hover:bg-primary/20 transition-all backdrop-blur"
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

          {timestamp ? <div className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">{timestamp}</div> : null}
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-6 max-w-5xl ml-auto flex-row-reverse">
      <div className="w-10 h-10 rounded-xl bg-slate-900/70 border border-white/10 flex items-center justify-center text-slate-300 shrink-0 backdrop-blur">
        <span className="material-symbols-outlined">person</span>
      </div>
      <div className="bg-gradient-to-br from-emerald-600/90 via-primary/80 to-green-500/80 p-6 rounded-3xl rounded-tr-md border border-white/10 shadow-[0_18px_40px_rgba(0,0,0,0.35)] max-w-lg min-w-0 backdrop-blur-xl">
        <div className="text-white leading-[1.65] text-[15px] sm:text-base break-words">{renderedBody}</div>
        {timestamp ? <div className="mt-3 text-[10px] font-bold text-white/70 tracking-widest uppercase">{timestamp}</div> : null}
      </div>
    </div>
  )
}

export default ChatMessage
