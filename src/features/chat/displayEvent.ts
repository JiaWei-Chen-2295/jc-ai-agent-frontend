export type DisplayStage = 'searching' | 'thinking' | 'output' | 'status'

export type DisplayFormat = 'text' | 'markdown' | 'code' | 'status'

export type DisplayEvent = {
  type: 'display'
  stage: DisplayStage
  format: DisplayFormat
  content: string
  delta: boolean
}

const displayStages: ReadonlySet<DisplayStage> = new Set(['searching', 'thinking', 'output', 'status'])
const displayFormats: ReadonlySet<DisplayFormat> = new Set(['text', 'markdown', 'code', 'status'])

export const isDisplayEvent = (value: unknown): value is DisplayEvent => {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  if (record.type !== 'display') return false
  if (typeof record.stage !== 'string' || !displayStages.has(record.stage as DisplayStage)) return false
  if (typeof record.format !== 'string' || !displayFormats.has(record.format as DisplayFormat)) return false
  if (typeof record.content !== 'string') return false
  if (typeof record.delta !== 'boolean') return false
  return true
}

export const parseDisplayEvent = (payload: string | unknown): DisplayEvent | null => {
  const parsed =
    typeof payload === 'string'
      ? (() => {
          try {
            return JSON.parse(payload) as unknown
          } catch {
            return null
          }
        })()
      : payload

  if (!isDisplayEvent(parsed)) return null
  return parsed
}

export type DisplayEventDispatchHandlers = {
  any?: (event: DisplayEvent) => void
  stage?: Partial<Record<DisplayStage, (event: DisplayEvent) => void>>
  format?: Partial<Record<DisplayFormat, (event: DisplayEvent) => void>>
  stageFormat?: Partial<Record<DisplayStage, Partial<Record<DisplayFormat, (event: DisplayEvent) => void>>>>
}

export const dispatchDisplayEvent = (event: DisplayEvent, handlers: DisplayEventDispatchHandlers) => {
  handlers.any?.(event)

  const stageFormatHandler = handlers.stageFormat?.[event.stage]?.[event.format]
  if (stageFormatHandler) {
    stageFormatHandler(event)
    return
  }

  const stageHandler = handlers.stage?.[event.stage]
  if (stageHandler) {
    stageHandler(event)
    return
  }

  handlers.format?.[event.format]?.(event)
}

