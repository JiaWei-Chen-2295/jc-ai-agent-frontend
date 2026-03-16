import {
  Alert,
  Button,
  Card,
  Descriptions,
  Drawer,
  Empty,
  List,
  Segmented,
  Skeleton,
  Space,
  Tag,
  Typography,
} from 'antd'
import { useEffect, useMemo, useState } from 'react'

import {
  documentMatchesTrace,
  mapDocumentStatus,
  useDocumentDetail,
  useLatestRagTraces,
  useRagTraceDetail,
} from './api'

import type { RagRetrievalTrace, RagTraceDocView, StudyFriendDocument } from '@/api'

const { Paragraph, Text } = Typography

type DocumentDetailDrawerProps = {
  documentId?: number
  open: boolean
  isAdmin: boolean
  onClose: () => void
}

type TraceStage = 'vector' | 'es' | 'rrf'

const formatTime = (value?: string) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

const formatDuration = (value?: number | null) => {
  if (value === undefined || value === null) return '--'
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}s`
  return `${Math.round(value)}ms`
}

const normalizeScore = (value?: number | null) => {
  if (value === undefined || value === null) return '--'
  if (Math.abs(value) >= 100) return value.toFixed(0)
  if (Math.abs(value) >= 10) return value.toFixed(2)
  return value.toFixed(4)
}

const isTraceDegraded = (trace?: RagRetrievalTrace) => {
  if (!trace) return false
  if (trace.degradedToVectorOnly) return true
  return Boolean(trace.hybridEnabled && !trace.esDocs?.length && trace.vectorDocs?.length)
}

const getStageDocs = (trace: RagRetrievalTrace | undefined, stage: TraceStage) => {
  if (!trace) return []
  if (stage === 'vector') return trace.vectorDocs ?? []
  if (stage === 'es') return trace.esDocs ?? []
  return trace.mergedDocs ?? []
}

const getStageTone = (stage: TraceStage) => {
  if (stage === 'vector') return 'from-cyan-400/25 to-sky-500/10 border-cyan-400/20'
  if (stage === 'es') return 'from-amber-300/20 to-orange-400/10 border-amber-300/18'
  return 'from-emerald-300/20 to-green-400/10 border-emerald-300/18'
}

const MetricCard = ({
  label,
  value,
  hint,
  accent,
}: {
  label: string
  value: string
  hint: string
  accent?: boolean
}) => (
  <div
    className={`rounded-[24px] border p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)] ${
      accent
        ? 'border-cyan-300/25 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_38%),linear-gradient(135deg,rgba(10,23,38,0.96),rgba(8,15,29,0.86))]'
        : 'border-white/8 bg-[linear-gradient(135deg,rgba(15,23,42,0.84),rgba(8,14,28,0.7))]'
    }`}
  >
    <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">{label}</div>
    <div className="mt-3 text-[28px] font-black leading-none text-slate-50">{value}</div>
    <div className="mt-2 text-xs text-slate-400">{hint}</div>
  </div>
)

const SectionKicker = ({ children }: { children: string }) => (
  <div className="text-[11px] font-black uppercase tracking-[0.24em] text-primary/75">{children}</div>
)

const DocCard = ({ doc, stage, index }: { doc: RagTraceDocView; stage: TraceStage; index: number }) => (
  <article
    className={`rounded-[24px] border bg-[linear-gradient(180deg,rgba(4,10,20,0.95),rgba(11,18,33,0.84))] p-4 shadow-[0_16px_38px_rgba(0,0,0,0.28)] ${getStageTone(stage)}`}
  >
    <div className="flex flex-wrap items-center gap-2">
      <Tag color={stage === 'vector' ? 'cyan' : stage === 'es' ? 'gold' : 'green'}>
        {stage === 'vector' ? 'Vector' : stage === 'es' ? 'ES' : 'RRF'}
      </Tag>
      <Tag bordered={false} className="!rounded-full !bg-white/6 !text-slate-200">
        #{index + 1}
      </Tag>
      <Tag bordered={false} className="!rounded-full !bg-white/6 !text-slate-200">
        score {normalizeScore(doc.score)}
      </Tag>
    </div>

    <div className="mt-4 grid gap-3 text-xs text-slate-400 sm:grid-cols-2">
      <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2">
        <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Chunk ID</div>
        <div className="mt-1 break-all font-medium text-slate-200">{doc.id || '--'}</div>
      </div>
      <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2">
        <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Document ID</div>
        <div className="mt-1 break-all font-medium text-slate-200">{doc.documentId || '--'}</div>
      </div>
    </div>

    <div className="mt-4 rounded-[20px] border border-white/8 bg-slate-950/45 px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Snippet</div>
      <Paragraph className="!mb-0 !mt-3 whitespace-pre-wrap text-[15px] leading-7 text-slate-100">
        {doc.snippet || '无片段内容'}
      </Paragraph>
    </div>
  </article>
)

const DocumentOverview = ({ document }: { document?: StudyFriendDocument }) => (
  <Descriptions
    size="small"
    column={2}
    labelStyle={{ color: 'rgb(100 116 139)' }}
    contentStyle={{ color: 'rgb(226 232 240)' }}
  >
    <Descriptions.Item label="文档 ID">{document?.id ?? '--'}</Descriptions.Item>
    <Descriptions.Item label="状态">
      <Tag>{mapDocumentStatus(document?.status)}</Tag>
      <span className="ml-2 text-slate-300">{document?.status || '--'}</span>
    </Descriptions.Item>
    <Descriptions.Item label="文件名">{document?.fileName || '--'}</Descriptions.Item>
    <Descriptions.Item label="文件类型">{document?.fileType || '--'}</Descriptions.Item>
    <Descriptions.Item label="租户 ID">{document?.tenantId ?? '--'}</Descriptions.Item>
    <Descriptions.Item label="归属用户">{document?.ownerUserId ?? '--'}</Descriptions.Item>
    <Descriptions.Item label="创建时间">{formatTime(document?.createdAt)}</Descriptions.Item>
    <Descriptions.Item label="更新时间">{formatTime(document?.updatedAt)}</Descriptions.Item>
    <Descriptions.Item label="存储路径" span={2}>
      <span className="break-all">{document?.filePath || '--'}</span>
    </Descriptions.Item>
    {document?.errorMessage ? (
      <Descriptions.Item label="失败原因" span={2}>
        <span className="text-rose-300">{document.errorMessage}</span>
      </Descriptions.Item>
    ) : null}
  </Descriptions>
)

export const DocumentDetailDrawer = ({ documentId, open, isAdmin, onClose }: DocumentDetailDrawerProps) => {
  const {
    data: document,
    isLoading: isDocumentLoading,
    error: documentError,
    refetch: refetchDocument,
  } = useDocumentDetail(documentId, open)
  const {
    data: traces = [],
    isLoading: isTraceListLoading,
    error: traceListError,
    refetch: refetchTraces,
  } = useLatestRagTraces(open && isAdmin, 100)

  const matchedTraces = useMemo(
    () => traces.filter((trace) => documentMatchesTrace(trace, documentId)),
    [documentId, traces],
  )

  const [selectedTraceId, setSelectedTraceId] = useState<string>()
  const [selectedStage, setSelectedStage] = useState<TraceStage>('rrf')

  useEffect(() => {
    if (!matchedTraces.length) {
      setSelectedTraceId(undefined)
      return
    }
    setSelectedTraceId((current) =>
      current && matchedTraces.some((trace) => trace.traceId === current) ? current : matchedTraces[0].traceId,
    )
  }, [matchedTraces])

  const {
    data: selectedTrace,
    isLoading: isTraceDetailLoading,
    error: traceDetailError,
    refetch: refetchTraceDetail,
  } = useRagTraceDetail(selectedTraceId, open && isAdmin && Boolean(selectedTraceId))

  const degraded = isTraceDegraded(selectedTrace)
  const stageDocs = getStageDocs(selectedTrace, selectedStage)
  const stageOptions = [
    {
      label: `Vector · ${selectedTrace?.vectorDocs?.length ?? 0}`,
      value: 'vector',
    },
    {
      label: `ES · ${selectedTrace?.esDocs?.length ?? 0}`,
      value: 'es',
    },
    {
      label: `RRF · ${selectedTrace?.mergedDocs?.length ?? 0}`,
      value: 'rrf',
    },
  ]

  return (
    <Drawer
      title={document?.fileName || (documentId ? `文档 #${documentId}` : '文档详情')}
      open={open}
      onClose={onClose}
      width={1280}
      destroyOnHidden={false}
      extra={
        <Space>
          <Button onClick={() => refetchDocument()}>刷新文档</Button>
          {isAdmin ? (
            <Button
              onClick={() => {
                refetchTraces()
                if (selectedTraceId) refetchTraceDetail()
              }}
            >
              刷新观测
            </Button>
          ) : null}
        </Space>
      }
    >
      <div className="space-y-6">
        <Card className="card" title="文档信息">
          {isDocumentLoading ? <Skeleton active paragraph={{ rows: 4 }} /> : <DocumentOverview document={document} />}
          {documentError ? (
            <Alert
              className="mt-4"
              type="error"
              showIcon
              message="文档详情加载失败"
              description={(documentError as Error).message}
            />
          ) : null}
        </Card>

        {isAdmin ? (
          <Card
            className="card"
            title="RAG 检索观测"
            extra={<Text className="text-slate-400">基于最近 100 条轨迹过滤当前文档命中结果</Text>}
          >
            {traceListError ? (
              <Alert
                type="error"
                showIcon
                message="RAG 轨迹列表加载失败"
                description={(traceListError as Error).message}
              />
            ) : null}

            {!traceListError && isTraceListLoading ? <Skeleton active paragraph={{ rows: 8 }} /> : null}

            {!traceListError && !isTraceListLoading && !matchedTraces.length ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="最近轨迹中还没有命中当前文档的检索记录" />
            ) : null}

            {!traceListError && !isTraceListLoading && matchedTraces.length ? (
              <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[360px_minmax(0,1fr)]">
                <section className="rounded-[28px] border border-cyan-300/12 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_38%),linear-gradient(180deg,rgba(8,15,30,0.95),rgba(7,12,24,0.88))] p-4 shadow-[0_24px_50px_rgba(0,0,0,0.3)]">
                  <SectionKicker>Trace Stream</SectionKicker>
                  <div className="mt-2 text-xl font-black text-white">相关轨迹</div>
                  <div className="mt-1 text-sm text-slate-400">选中一条轨迹后，在右侧查看本次召回的完整结构。</div>

                  <div className="mt-4 max-h-[860px] overflow-y-auto pr-1 custom-scrollbar">
                    <List
                      dataSource={matchedTraces}
                      split={false}
                      renderItem={(trace, index) => {
                        const active = trace.traceId === selectedTraceId
                        const hitCount =
                          (trace.vectorDocs?.filter((doc) => doc.documentId === String(documentId)).length ?? 0) +
                          (trace.esDocs?.filter((doc) => doc.documentId === String(documentId)).length ?? 0) +
                          (trace.mergedDocs?.filter((doc) => doc.documentId === String(documentId)).length ?? 0)

                        return (
                          <List.Item className="!px-0 !py-2">
                            <button
                              type="button"
                              className={`w-full rounded-[24px] border px-4 py-4 text-left transition-all ${
                                active
                                  ? 'border-cyan-300/35 bg-cyan-300/[0.10] shadow-[0_18px_36px_rgba(8,145,178,0.18)]'
                                  : 'border-white/8 bg-white/[0.03] hover:-translate-y-0.5 hover:border-white/16 hover:bg-white/[0.06]'
                              }`}
                              onClick={() => setSelectedTraceId(trace.traceId)}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <div className="grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-white/5 text-[11px] font-black text-slate-300">
                                    {index + 1}
                                  </div>
                                  <Tag color={isTraceDegraded(trace) ? 'orange' : 'cyan'}>
                                    {isTraceDegraded(trace) ? '已降级' : 'Hybrid'}
                                  </Tag>
                                </div>
                                <div className="text-sm font-black text-slate-100">{formatDuration(trace.totalLatencyMs)}</div>
                              </div>

                              <div className="mt-3 line-clamp-3 text-[16px] font-bold leading-7 text-slate-100">
                                {trace.query || '未记录 query'}
                              </div>

                              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-400">
                                <div className="rounded-2xl border border-white/8 bg-slate-950/35 px-3 py-2">
                                  <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Hits</div>
                                  <div className="mt-1 text-sm font-semibold text-slate-200">{hitCount} 次命中</div>
                                </div>
                                <div className="rounded-2xl border border-white/8 bg-slate-950/35 px-3 py-2">
                                  <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Time</div>
                                  <div className="mt-1 text-sm font-semibold text-slate-200">{formatTime(trace.createdAt)}</div>
                                </div>
                              </div>
                            </button>
                          </List.Item>
                        )
                      }}
                    />
                  </div>
                </section>

                <div className="space-y-5">
                  {traceDetailError ? (
                    <Alert
                      type="error"
                      showIcon
                      message="RAG 轨迹详情加载失败"
                      description={(traceDetailError as Error).message}
                    />
                  ) : null}

                  {isTraceDetailLoading ? <Skeleton active paragraph={{ rows: 10 }} /> : null}

                  {!isTraceDetailLoading && selectedTrace ? (
                    <>
                      <section className="overflow-hidden rounded-[32px] border border-cyan-300/14 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_28%),linear-gradient(135deg,rgba(9,18,34,0.98),rgba(6,10,20,0.94))] shadow-[0_28px_60px_rgba(0,0,0,0.34)]">
                        <div className="border-b border-white/8 px-6 py-5">
                          <SectionKicker>Selected Trace</SectionKicker>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Tag color="cyan">TopK {selectedTrace.topK ?? '--'}</Tag>
                            <Tag color={selectedTrace.hybridEnabled ? 'geekblue' : 'default'}>
                              {selectedTrace.hybridEnabled ? 'Hybrid Search' : 'Vector Only'}
                            </Tag>
                            <Tag color={degraded ? 'orange' : 'green'}>{degraded ? '已降级' : '检索正常'}</Tag>
                            <Tag color="purple">RRF {selectedTrace.rrfK ?? '--'}</Tag>
                          </div>
                          <div className="mt-4 max-w-5xl text-[23px] font-black leading-10 text-white">
                            {selectedTrace.query || '--'}
                          </div>
                          <div className="mt-3 flex flex-wrap gap-5 text-sm text-slate-400">
                            <span>Trace ID: {selectedTrace.traceId || '--'}</span>
                            <span>检索时间: {formatTime(selectedTrace.createdAt)}</span>
                          </div>
                        </div>

                        {degraded ? (
                          <div className="border-b border-amber-300/14 bg-amber-300/[0.08] px-6 py-4 text-sm text-amber-100">
                            <span className="font-bold">降级原因：</span>
                            {selectedTrace.degradeReason || 'ES 未返回结果，或后端主动降级'}
                          </div>
                        ) : null}

                        <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
                          <MetricCard label="总耗时" value={formatDuration(selectedTrace.totalLatencyMs)} hint="完整检索耗时" accent />
                          <MetricCard label="Vector" value={formatDuration(selectedTrace.vectorLatencyMs)} hint="向量召回阶段" />
                          <MetricCard label="ES" value={formatDuration(selectedTrace.esLatencyMs)} hint="关键词召回阶段" />
                          <MetricCard label="Merge" value={formatDuration(selectedTrace.mergeLatencyMs)} hint="RRF 融合阶段" />
                        </div>
                      </section>

                      <section className="rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(9,16,30,0.96),rgba(7,12,24,0.88))] p-5 shadow-[0_22px_48px_rgba(0,0,0,0.26)]">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                          <div>
                            <SectionKicker>Recall Explorer</SectionKicker>
                            <div className="mt-2 text-xl font-black text-white">召回结果查看器</div>
                            <div className="mt-1 text-sm text-slate-400">
                              切换不同阶段，按更宽的阅读布局查看命中片段，不再把长文本挤成三列。
                            </div>
                          </div>
                          <Segmented
                            size="large"
                            value={selectedStage}
                            options={stageOptions}
                            onChange={(value) => setSelectedStage(value as TraceStage)}
                          />
                        </div>

                        <div className="mt-5 grid gap-4 md:grid-cols-3">
                          <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-3">
                            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">当前阶段</div>
                            <div className="mt-2 text-lg font-bold text-white">
                              {selectedStage === 'vector' ? 'Vector 召回' : selectedStage === 'es' ? 'ES 召回' : 'RRF 融合结果'}
                            </div>
                          </div>
                          <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-3">
                            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">片段数量</div>
                            <div className="mt-2 text-lg font-bold text-white">{stageDocs.length}</div>
                          </div>
                          <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-3">
                            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">当前文档命中</div>
                            <div className="mt-2 text-lg font-bold text-white">
                              {stageDocs.filter((doc) => doc.documentId === String(documentId)).length}
                            </div>
                          </div>
                        </div>

                        <div className="mt-5">
                          {stageDocs.length ? (
                            <div className="grid gap-4 xl:grid-cols-2">
                              {stageDocs.map((doc, index) => (
                                <DocCard key={`${selectedStage}-${doc.id ?? doc.documentId ?? index}`} doc={doc} stage={selectedStage} index={index} />
                              ))}
                            </div>
                          ) : (
                            <div className="rounded-[24px] border border-dashed border-white/12 bg-white/[0.02] py-14">
                              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="该阶段没有命中文档" />
                            </div>
                          )}
                        </div>
                      </section>
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}
          </Card>
        ) : (
          <Card className="card" title="管理员附加能力">
            <Paragraph className="!mb-0 text-slate-400">
              当前账号不是管理员，仅展示文档基础信息。管理员打开同一文档时可看到 RAG 检索可观测面板。
            </Paragraph>
          </Card>
        )}
      </div>
    </Drawer>
  )
}

export default DocumentDetailDrawer
