import { useQuery } from '@tanstack/react-query'

import { http } from '@/services/http'

type BaseResponse<T> = {
  code?: number
  data?: T
  message?: string
}

export type ExecutionLogRecord = {
  id?: number | string
  sessionId: string
  iteration?: number
  phase?: string
  toolName?: string
  executionTimeMs?: number
  status?: string
  createdAt?: string
  inputData?: unknown
  outputData?: unknown
  raw: Record<string, unknown>
}

export type ExecutionLogPage = {
  content: ExecutionLogRecord[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export type ExecutionOverview = {
  maxIteration: number
  totalTimeMs: number
  avgTimeMs: number
  timeoutCount: number
  phaseCount: Record<string, number>
}

export type TimelineStep = {
  id: string
  phase: string
  toolName?: string
  executionTimeMs?: number
  inputData?: unknown
  outputData?: unknown
  createdAt?: string
  status?: string
  raw: Record<string, unknown>
}

export type TimelineIteration = {
  iteration: number
  steps: TimelineStep[]
}

export type ExecutionTimeline = {
  iterations: TimelineIteration[]
}

export type ToolStat = {
  toolName: string
  count: number
  avgTimeMs: number
}

export type ToolStats = {
  tools: ToolStat[]
}

const unwrap = <T,>(response: BaseResponse<T>, fallbackMessage: string) => {
  if (response?.code && response.code !== 0) {
    throw new Error(response.message || fallbackMessage)
  }
  return response?.data as T
}

const asRecord = (value: unknown) => (value && typeof value === 'object' ? value as Record<string, unknown> : {})

const asNumber = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return undefined
}

const asString = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value
    if (typeof value === 'number') return String(value)
  }
  return undefined
}

const normalizeLogRecord = (item: unknown): ExecutionLogRecord => {
  const record = asRecord(item)
  return {
    id: asString(record.id, record.logId),
    sessionId: asString(record.sessionId, record.chatId, record.executionSessionId, record.session) || 'unknown-session',
    iteration: asNumber(record.iteration, record.iterationNo, record.iterationIndex),
    phase: asString(record.phase, record.stage, record.stepType),
    toolName: asString(record.toolName, record.tool, record.actionName),
    executionTimeMs: asNumber(record.executionTimeMs, record.durationMs, record.costMs, record.elapsedMs),
    status: asString(record.status),
    createdAt: asString(record.createdAt, record.createTime, record.gmtCreate, record.timestamp),
    inputData: record.inputData ?? record.input ?? record.requestData,
    outputData: record.outputData ?? record.output ?? record.responseData,
    raw: record,
  }
}

const pickArray = (...values: unknown[]) => {
  for (const value of values) {
    if (Array.isArray(value)) return value
  }
  return []
}

const normalizePage = (payload: unknown): ExecutionLogPage => {
  if (Array.isArray(payload)) {
    return {
      content: payload.map(normalizeLogRecord),
      totalElements: payload.length,
      totalPages: 1,
      number: 0,
      size: payload.length,
    }
  }

  const record = asRecord(payload)
  const nestedPage = asRecord(
    record.page ?? record.pageData ?? record.result ?? record.data ?? record.rows ?? record.listData,
  )
  const rawContent = pickArray(
    record.content,
    record.records,
    record.rows,
    record.list,
    record.items,
    nestedPage.content,
    nestedPage.records,
    nestedPage.rows,
    nestedPage.list,
    nestedPage.items,
  )

  return {
    content: rawContent.map(normalizeLogRecord),
    totalElements:
      asNumber(
        record.totalElements,
        record.total,
        record.count,
        nestedPage.totalElements,
        nestedPage.total,
        nestedPage.count,
        rawContent.length,
      ) ?? rawContent.length,
    totalPages: asNumber(record.totalPages, record.pages, nestedPage.totalPages, nestedPage.pages, 1) ?? 1,
    number: asNumber(record.number, record.page, record.current, nestedPage.number, nestedPage.page, nestedPage.current, 0) ?? 0,
    size: asNumber(record.size, record.pageSize, nestedPage.size, nestedPage.pageSize, rawContent.length) ?? rawContent.length,
  }
}

const normalizeOverview = (payload: unknown): ExecutionOverview => {
  const record = asRecord(payload)
  const phaseCountRaw = asRecord(record.phaseCount ?? record.phaseCounts)
  const phaseCount = Object.fromEntries(
    Object.entries(phaseCountRaw).map(([key, value]) => [key, asNumber(value, 0) ?? 0]),
  )

  return {
    maxIteration: asNumber(record.maxIteration, record.totalIterations, 0) ?? 0,
    totalTimeMs: asNumber(record.totalTimeMs, record.totalExecutionTimeMs, 0) ?? 0,
    avgTimeMs: asNumber(record.avgTimeMs, record.averageTimeMs, 0) ?? 0,
    timeoutCount: asNumber(record.timeoutCount, record.timeoutLogs, 0) ?? 0,
    phaseCount,
  }
}

const normalizeTimeline = (payload: unknown): ExecutionTimeline => {
  const record = asRecord(payload)
  const iterationsRaw = Array.isArray(record.iterations) ? record.iterations : []
  const iterations = iterationsRaw.map((item, index) => {
    const iterationRecord = asRecord(item)
    const stepsRaw = Array.isArray(iterationRecord.steps) ? iterationRecord.steps : []
    return {
      iteration: asNumber(iterationRecord.iteration, index + 1) ?? index + 1,
      steps: stepsRaw.map((step, stepIndex) => {
        const stepRecord = asRecord(step)
        const phase = asString(stepRecord.phase, stepRecord.stage, stepRecord.stepType) || `STEP_${stepIndex + 1}`
        return {
          id: `${index + 1}-${stepIndex + 1}-${phase}`,
          phase,
          toolName: asString(stepRecord.toolName, stepRecord.tool, stepRecord.actionName),
          executionTimeMs: asNumber(stepRecord.executionTimeMs, stepRecord.durationMs, stepRecord.elapsedMs),
          inputData: stepRecord.inputData ?? stepRecord.input ?? stepRecord.requestData,
          outputData: stepRecord.outputData ?? stepRecord.output ?? stepRecord.responseData,
          createdAt: asString(stepRecord.createdAt, stepRecord.createTime, stepRecord.timestamp),
          status: asString(stepRecord.status),
          raw: stepRecord,
        }
      }),
    }
  })
  return { iterations }
}

const normalizeTools = (payload: unknown): ToolStats => {
  const record = asRecord(payload)
  const toolsRaw = Array.isArray(record.tools) ? record.tools : Array.isArray(record.records) ? record.records : []
  const tools = toolsRaw
    .map((item) => {
      const toolRecord = asRecord(item)
      const toolName = asString(toolRecord.toolName, toolRecord.tool, toolRecord.name)
      if (!toolName) return null
      return {
        toolName,
        count: asNumber(toolRecord.count, toolRecord.callCount, 0) ?? 0,
        avgTimeMs: asNumber(toolRecord.avgTimeMs, toolRecord.averageTimeMs, 0) ?? 0,
      }
    })
    .filter(Boolean) as ToolStat[]

  tools.sort((a, b) => b.avgTimeMs - a.avgTimeMs || b.count - a.count)
  return { tools }
}

export const listObservabilityLogs = async ({ page, size }: { page: number; size: number }) => {
  const response = await http.get<BaseResponse<unknown>>('/v1/agent/observability/tenant/logs', {
    params: { page, size },
  })
  return normalizePage(unwrap(response.data, '获取执行日志失败'))
}

export const getObservabilityOverview = async (sessionId: string) => {
  const response = await http.get<BaseResponse<unknown>>(`/v1/agent/observability/session/${sessionId}/overview`)
  return normalizeOverview(unwrap(response.data, '获取执行概览失败'))
}

export const getObservabilityTimeline = async (sessionId: string) => {
  const response = await http.get<BaseResponse<unknown>>(`/v1/agent/observability/session/${sessionId}/timeline`)
  return normalizeTimeline(unwrap(response.data, '获取执行时间线失败'))
}

export const getObservabilityTools = async (sessionId: string) => {
  const response = await http.get<BaseResponse<unknown>>(`/v1/agent/observability/session/${sessionId}/tools`)
  return normalizeTools(unwrap(response.data, '获取工具统计失败'))
}

export const useObservabilityLogs = (page: number, size: number) =>
  useQuery({
    queryKey: ['observability-logs', page, size],
    queryFn: () => listObservabilityLogs({ page, size }),
    placeholderData: (previous) => previous,
  })

export const useObservabilityOverview = (sessionId?: string) =>
  useQuery({
    queryKey: ['observability-overview', sessionId],
    queryFn: () => getObservabilityOverview(sessionId || ''),
    enabled: Boolean(sessionId),
  })

export const useObservabilityTimeline = (sessionId?: string) =>
  useQuery({
    queryKey: ['observability-timeline', sessionId],
    queryFn: () => getObservabilityTimeline(sessionId || ''),
    enabled: Boolean(sessionId),
  })

export const useObservabilityTools = (sessionId?: string) =>
  useQuery({
    queryKey: ['observability-tools', sessionId],
    queryFn: () => getObservabilityTools(sessionId || ''),
    enabled: Boolean(sessionId),
  })
