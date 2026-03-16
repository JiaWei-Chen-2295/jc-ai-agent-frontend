import type { ReactNode } from 'react'
import {
  Button,
  Card,
  Collapse,
  Empty,
  Result,
  Segmented,
  Space,
  Spin,
  Tag,
} from 'antd'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import PageHeader from '@/components/PageHeader'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import {
  type TimelineIteration,
  type TimelineStep,
  useObservabilityOverview,
  useObservabilityTimeline,
  useObservabilityTools,
} from '@/features/observability/api'

const formatDuration = (value?: number) => {
  if (value === undefined || value === null) return '--'
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}s`
  return `${Math.round(value)}ms`
}

const formatTime = (value?: string) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

const prettyJson = (value: unknown) => {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2)
    } catch {
      return value
    }
  }
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

const phaseTheme = (phase: string) => {
  const normalized = phase.toUpperCase()
  if (normalized.includes('THOUGHT')) return { tag: 'processing', className: 'obs-step-thought' }
  if (normalized.includes('ACTION')) return { tag: 'warning', className: 'obs-step-action' }
  if (normalized.includes('OBSERVATION')) return { tag: 'success', className: 'obs-step-observation' }
  if (normalized.includes('ERROR') || normalized.includes('TIMEOUT')) {
    return { tag: 'error', className: 'obs-step-timeout' }
  }
  return { tag: 'default', className: 'obs-step-generic' }
}

const getIterationDuration = (iteration: TimelineIteration) =>
  iteration.steps.reduce((sum, step) => sum + (step.executionTimeMs ?? 0), 0)

const hasToolMatch = (iteration: TimelineIteration, selectedTool: string) =>
  iteration.steps.some((step) => step.toolName === selectedTool)

const renderPayloadPanel = (label: string, payload: unknown, key: string) => {
  if (payload === undefined || payload === null || payload === '') return null
  return {
    key,
    label,
    children: <pre className="obs-json-view">{prettyJson(payload)}</pre>,
  }
}

const StepCard = ({ step }: { step: TimelineStep }) => {
  const theme = phaseTheme(step.phase)
  const panels = [
    renderPayloadPanel('输入数据', step.inputData, 'input'),
    renderPayloadPanel('输出数据', step.outputData, 'output'),
  ].filter(Boolean) as { key: string; label: string; children: ReactNode }[]

  return (
    <div className={`obs-step-card ${theme.className}`}>
      <div className="flex flex-wrap items-center gap-3">
        <Tag color={theme.tag}>{step.phase}</Tag>
        {step.toolName ? <Tag>{step.toolName}</Tag> : null}
        <span className="text-xs font-semibold text-slate-400">{formatDuration(step.executionTimeMs)}</span>
        {step.status ? <span className="text-xs text-slate-500">状态：{step.status}</span> : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-6 text-xs text-slate-400">
        <span>发生时间：{formatTime(step.createdAt)}</span>
      </div>
      {panels.length ? (
        <div className="mt-4">
          <Collapse ghost size="small" items={panels} className="obs-json-collapse" />
        </div>
      ) : null}
    </div>
  )
}

const ObservabilitySessionPage = () => {
  const navigate = useNavigate()
  const { sessionId } = useParams()
  const { data: currentUser } = useCurrentUser()
  const isAdmin = currentUser?.userRole === 'admin'
  const { data: overview, isLoading: overviewLoading, error: overviewError, refetch: refetchOverview } = useObservabilityOverview(sessionId)
  const { data: timeline, isLoading: timelineLoading, error: timelineError, refetch: refetchTimeline } = useObservabilityTimeline(sessionId)
  const { data: tools, isLoading: toolsLoading, error: toolsError, refetch: refetchTools } = useObservabilityTools(sessionId)
  const [selectedTool, setSelectedTool] = useState<string>('ALL')
  const [density, setDensity] = useState<'compact' | 'expanded'>('expanded')

  const phaseEntries = useMemo(
    () => Object.entries(overview?.phaseCount ?? {}).sort((a, b) => b[1] - a[1]),
    [overview?.phaseCount],
  )

  const filteredIterations = useMemo(() => {
    const items = timeline?.iterations ?? []
    if (selectedTool === 'ALL') return items
    return items.filter((iteration) => hasToolMatch(iteration, selectedTool))
  }, [selectedTool, timeline?.iterations])

  const maxToolCount = Math.max(...(tools?.tools.map((item) => item.count) ?? [1]))
  const maxToolTime = Math.max(...(tools?.tools.map((item) => item.avgTimeMs) ?? [1]))
  const loading = overviewLoading || timelineLoading || toolsLoading
  const error = overviewError || timelineError || toolsError

  if (!isAdmin) {
    return (
      <Result
        status="403"
        title="无权限访问"
        subTitle="Agent 可观测性详情页仅管理员可访问。"
        extra={<Button type="primary" onClick={() => navigate('/chat')}>返回对话</Button>}
      />
    )
  }

  if (!sessionId) {
    return (
      <Result
        status="404"
        title="缺少会话 ID"
        subTitle="请从可观测性列表页重新进入。"
        extra={<Button type="primary" onClick={() => navigate('/observability')}>返回列表</Button>}
      />
    )
  }

  return (
    <div className="flex h-full w-full flex-col gap-4 overflow-hidden">
      <PageHeader
        title="会话执行详情"
        description={`Session: ${sessionId}`}
        extra={
          <Space>
            <Button onClick={() => navigate('/observability')}>返回列表</Button>
            <Button
              onClick={() => {
                refetchOverview()
                refetchTimeline()
                refetchTools()
              }}
            >
              刷新
            </Button>
          </Space>
        }
      />

      <div className="glass-panel polished-ice flex-1 overflow-hidden rounded-2xl">
        <div className="flex h-full flex-col gap-6 overflow-y-auto p-6 custom-scrollbar">
          {loading ? (
            <div className="obs-loading-wrap">
              <Spin size="large" />
            </div>
          ) : null}

          {error ? (
            <Result
              status="error"
              title="加载执行详情失败"
              subTitle={(error as Error).message}
              extra={
                <Button
                  onClick={() => {
                    refetchOverview()
                    refetchTimeline()
                    refetchTools()
                  }}
                >
                  重试
                </Button>
              }
            />
          ) : null}

          {!loading && !error ? (
            <>
              <section className="obs-overview-grid">
                <div className="obs-overview-card obs-overview-card-accent">
                  <span>总迭代</span>
                  <strong>{overview?.maxIteration ?? 0}</strong>
                  <small>ReAct 链路深度</small>
                </div>
                <div className="obs-overview-card">
                  <span>总耗时</span>
                  <strong>{formatDuration(overview?.totalTimeMs)}</strong>
                  <small>会话完整运行时间</small>
                </div>
                <div className="obs-overview-card">
                  <span>平均耗时</span>
                  <strong>{formatDuration(overview?.avgTimeMs)}</strong>
                  <small>单次迭代平均成本</small>
                </div>
                <div className={`obs-overview-card ${overview?.timeoutCount ? 'obs-overview-card-danger' : ''}`}>
                  <span>超时次数</span>
                  <strong>{overview?.timeoutCount ?? 0}</strong>
                  <small>{overview?.timeoutCount ? '需要重点排查' : '本次会话无超时'}</small>
                </div>
              </section>

              <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.95fr]">
                <Card className="card" title="阶段占比">
                  {phaseEntries.length ? (
                    <div className="space-y-4">
                      {phaseEntries.map(([phase, count]) => {
                        const total = Math.max(1, phaseEntries.reduce((sum, [, value]) => sum + value, 0))
                        const width = `${(count / total) * 100}%`
                        return (
                          <div key={phase}>
                            <div className="mb-2 flex items-center justify-between text-sm">
                              <span className="font-bold text-slate-200">{phase}</span>
                              <span className="text-slate-400">{count}</span>
                            </div>
                            <div className="obs-phase-track">
                              <div className="obs-phase-fill" style={{ width }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无阶段分布" />
                  )}
                </Card>

                <Card
                  className="card"
                  title="工具热力图"
                  extra={
                    <Segmented
                      value={selectedTool}
                      size="small"
                      options={[
                        { label: '全部', value: 'ALL' },
                        ...(tools?.tools.slice(0, 4).map((tool) => ({
                          label: tool.toolName,
                          value: tool.toolName,
                        })) ?? []),
                      ]}
                      onChange={(value) => setSelectedTool(String(value))}
                    />
                  }
                >
                  {tools?.tools.length ? (
                    <div className="space-y-3">
                      {tools.tools.map((tool) => {
                        const active = selectedTool === tool.toolName
                        return (
                          <button
                            key={tool.toolName}
                            type="button"
                            className={`obs-tool-bar ${active ? 'obs-tool-bar-active' : ''}`}
                            onClick={() => setSelectedTool((current) => current === tool.toolName ? 'ALL' : tool.toolName)}
                          >
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <span className="truncate text-sm font-bold text-white">{tool.toolName}</span>
                              <span className={`text-xs font-bold ${tool.avgTimeMs >= 5000 ? 'text-rose-300' : 'text-cyan-200'}`}>
                                {formatDuration(tool.avgTimeMs)}
                              </span>
                            </div>
                            <div className="obs-tool-track">
                              <div
                                className="obs-tool-fill obs-tool-fill-count"
                                style={{ width: `${(tool.count / maxToolCount) * 100}%` }}
                              />
                              <div
                                className="obs-tool-fill obs-tool-fill-time"
                                style={{ width: `${(tool.avgTimeMs / maxToolTime) * 100}%` }}
                              />
                            </div>
                            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                              <span>{tool.count} 次调用</span>
                              <span>{tool.avgTimeMs >= 5000 ? '慢工具' : '响应稳定'}</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无工具统计" />
                  )}
                </Card>
              </section>

              <Card
                className="card"
                title="执行时间线"
                extra={
                  <Space>
                    <Segmented
                      size="small"
                      value={density}
                      options={[
                        { label: '展开', value: 'expanded' },
                        { label: '紧凑', value: 'compact' },
                      ]}
                      onChange={(value) => setDensity(value as 'compact' | 'expanded')}
                    />
                    {selectedTool !== 'ALL' ? <Tag color="cyan">已筛选：{selectedTool}</Tag> : null}
                  </Space>
                }
              >
                {filteredIterations.length ? (
                  <div className="space-y-4">
                    {filteredIterations.map((iteration) => {
                      const stepTools = [...new Set(iteration.steps.map((step) => step.toolName).filter(Boolean))]
                      const collapseItems = [
                        {
                          key: String(iteration.iteration),
                          label: (
                            <div className="flex flex-wrap items-center gap-3 pr-4">
                              <span className="text-sm font-black text-white">Iteration {iteration.iteration}</span>
                              <Tag color="blue">{iteration.steps.length} steps</Tag>
                              <span className="text-xs text-slate-400">{formatDuration(getIterationDuration(iteration))}</span>
                              {stepTools.map((tool) => (
                                <Tag key={tool} color={selectedTool === tool ? 'cyan' : 'default'}>
                                  {tool}
                                </Tag>
                              ))}
                            </div>
                          ),
                          children: (
                            <div className={density === 'compact' ? 'space-y-3' : 'space-y-4'}>
                              {iteration.steps.map((step) => <StepCard key={step.id} step={step} />)}
                            </div>
                          ),
                        },
                      ]

                      return (
                        <Collapse
                          key={iteration.iteration}
                          defaultActiveKey={density === 'expanded' ? [String(iteration.iteration)] : []}
                          items={collapseItems}
                          className="obs-iteration-collapse"
                        />
                      )
                    })}
                  </div>
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={selectedTool === 'ALL' ? '暂无时间线数据' : '当前工具筛选下没有相关迭代'}
                  />
                )}
              </Card>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default ObservabilitySessionPage
