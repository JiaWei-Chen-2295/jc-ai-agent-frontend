import { Button, Card, Empty, Result, Space, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import PageHeader from '@/components/PageHeader'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import { type ExecutionLogRecord, useObservabilityLogs } from '@/features/observability/api'

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

const phaseTone = (phase?: string) => {
  if (!phase) return 'default'
  const normalized = phase.toUpperCase()
  if (normalized.includes('THOUGHT')) return 'processing'
  if (normalized.includes('ACTION')) return 'warning'
  if (normalized.includes('OBSERVATION')) return 'success'
  if (normalized.includes('ERROR') || normalized.includes('TIMEOUT')) return 'error'
  return 'default'
}

const ObservabilityListPage = () => {
  const navigate = useNavigate()
  const { data: currentUser } = useCurrentUser()
  const isAdmin = currentUser?.userRole === 'admin'
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const { data, isLoading, isError, error, refetch } = useObservabilityLogs(page - 1, pageSize)

  const rows = data?.content ?? []

  const summary = useMemo(() => {
    const sessionIds = new Set(rows.map((item) => item.sessionId))
    const durations = rows.map((item) => item.executionTimeMs ?? 0)
    const totalDuration = durations.reduce((sum, item) => sum + item, 0)
    const avgDuration = rows.length ? totalDuration / rows.length : 0
    const timeoutCount = rows.filter((item) => {
      const status = item.status?.toUpperCase()
      const phase = item.phase?.toUpperCase()
      return status?.includes('TIMEOUT') || phase?.includes('TIMEOUT')
    }).length

    const grouped = rows.reduce((map, item) => {
      const current = map.get(item.sessionId) ?? { sessionId: item.sessionId, count: 0, totalTimeMs: 0 }
      current.count += 1
      current.totalTimeMs += item.executionTimeMs ?? 0
      map.set(item.sessionId, current)
      return map
    }, new Map<string, { sessionId: string; count: number; totalTimeMs: number }>())

    const hotSessions = [...grouped.values()]
      .sort((a, b) => b.count - a.count || b.totalTimeMs - a.totalTimeMs)
      .slice(0, 4)

    return {
      sessionCount: sessionIds.size,
      avgDuration,
      timeoutCount,
      hotSessions,
    }
  }, [rows])

  const columns: ColumnsType<ExecutionLogRecord> = [
    {
      title: '会话 ID',
      dataIndex: 'sessionId',
      key: 'sessionId',
      width: 220,
      render: (value: string) => (
        <button
          type="button"
          className="obs-link-button"
          onClick={() => navigate(`/observability/session/${value}`)}
        >
          {value}
        </button>
      ),
    },
    {
      title: '迭代',
      dataIndex: 'iteration',
      key: 'iteration',
      width: 80,
      render: (value?: number) => value ?? '--',
    },
    {
      title: '阶段',
      dataIndex: 'phase',
      key: 'phase',
      width: 130,
      render: (value?: string) => <Tag color={phaseTone(value)}>{value || 'UNKNOWN'}</Tag>,
    },
    {
      title: '工具',
      dataIndex: 'toolName',
      key: 'toolName',
      width: 180,
      render: (value?: string) => value ? <Tag>{value}</Tag> : <span className="text-slate-500">--</span>,
    },
    {
      title: '耗时',
      dataIndex: 'executionTimeMs',
      key: 'executionTimeMs',
      width: 120,
      render: (value?: number) => (
        <span className={value && value >= 5000 ? 'text-rose-300 font-bold' : 'text-slate-200'}>
          {formatDuration(value)}
        </span>
      ),
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value?: string) => <span className="text-slate-400">{formatTime(value)}</span>,
    },
  ]

  if (!isAdmin) {
    return (
      <Result
        status="403"
        title="无权限访问"
        subTitle="Agent 可观测性面板仅管理员可访问。"
        extra={<Button type="primary" onClick={() => navigate('/chat')}>返回对话</Button>}
      />
    )
  }

  return (
    <div className="flex h-full w-full flex-col gap-4 overflow-hidden xl:flex-row">
      <aside className="obs-side-panel w-full shrink-0 overflow-hidden rounded-[28px] xl:w-80">
        <div className="obs-side-hero">
          <div className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-200/75">Observability</div>
          <h2 className="mt-3 text-2xl font-black text-white">Agent 执行雷达</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            从租户级日志里快速找到高频会话、慢工具和超时热点，再进入单会话细看 ReAct 时间线。
          </p>
        </div>

        <div className="space-y-3 p-4">
          <div className="obs-stat-tile">
            <span>当前页日志</span>
            <strong>{rows.length}</strong>
          </div>
          <div className="obs-stat-tile">
            <span>涉及会话</span>
            <strong>{summary.sessionCount}</strong>
          </div>
          <div className="obs-stat-tile">
            <span>平均耗时</span>
            <strong>{formatDuration(summary.avgDuration)}</strong>
          </div>
          <div className={`obs-stat-tile ${summary.timeoutCount > 0 ? 'obs-stat-tile-danger' : ''}`}>
            <span>超时记录</span>
            <strong>{summary.timeoutCount}</strong>
          </div>
        </div>

        <div className="border-t border-white/10 px-4 py-4">
          <div className="mb-3 text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">热度会话</div>
          {summary.hotSessions.length ? (
            <div className="space-y-3">
              {summary.hotSessions.map((item, index) => (
                <button
                  key={item.sessionId}
                  type="button"
                  className="obs-session-spotlight"
                  onClick={() => navigate(`/observability/session/${item.sessionId}`)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200/60">
                      #{index + 1}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">{item.count} steps</span>
                  </div>
                  <div className="mt-2 truncate text-sm font-bold text-white">{item.sessionId}</div>
                  <div className="mt-1 text-xs text-slate-400">累计耗时 {formatDuration(item.totalTimeMs)}</div>
                </button>
              ))}
            </div>
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无日志" />
          )}
        </div>
      </aside>

      <main className="flex flex-1 flex-col gap-4 overflow-hidden">
        <PageHeader
          title="Agent 可观测性"
          description="列表页用于快速筛选会话，详情页提供总览、工具分布与完整执行时间线。"
          extra={
            <Space>
              <Button onClick={() => refetch()}>刷新</Button>
            </Space>
          }
        />

        <div className="glass-panel polished-ice flex-1 overflow-hidden rounded-2xl">
          <div className="flex h-full flex-col gap-6 overflow-y-auto p-6 custom-scrollbar">
            {isError ? (
              <Result
                status="error"
                title="执行日志加载失败"
                subTitle={(error as Error)?.message || '请检查接口返回结构或登录状态'}
                extra={<Button onClick={() => refetch()}>重试</Button>}
              />
            ) : null}

            <Card className="card" title="执行日志列表">
              <Table
                rowKey={(record) => `${record.sessionId}-${record.id ?? record.iteration ?? record.createdAt ?? 'row'}`}
                columns={columns}
                dataSource={rows}
                loading={isLoading}
                locale={{ emptyText: <Empty description="暂无可观测日志" /> }}
                pagination={{
                  current: page,
                  pageSize,
                  total: data?.totalElements ?? 0,
                  onChange: (nextPage, nextPageSize) => {
                    setPage(nextPage)
                    setPageSize(nextPageSize)
                  },
                }}
                onRow={(record) => ({
                  onDoubleClick: () => navigate(`/observability/session/${record.sessionId}`),
                })}
              />
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ObservabilityListPage
