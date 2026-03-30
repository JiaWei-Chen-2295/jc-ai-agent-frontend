import { Icon } from '@iconify/react'
import { Alert, Button, Card, Space, Table, Tooltip, Typography, message as antdMessage } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo, useState } from 'react'

import { mapDocumentStatus, normalizeDocuments, useDocumentActions, useDocuments, useUpload } from './api'
import DocumentDetailDrawer from './DocumentDetailDrawer'

import PageHeader from '@/components/PageHeader'
import StatusTag from '@/components/StatusTag'
import UploadCard from '@/components/UploadCard'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import { useTenantContext } from '@/features/tenants/tenantContext'

const { Text } = Typography

// eslint-disable-next-line no-unused-vars
type RowAction = (..._: [number]) => void

type TableRow = {
  key: string
  id?: number
  name?: string
  type?: string
  status: 'ready' | 'processing' | 'error' | 'waiting'
  updatedAt?: string
}

const columns = (
  isAdmin: boolean,
  onView: RowAction,
  onDelete: RowAction,
  onReindex: RowAction,
): ColumnsType<TableRow> => [
  { title: '文件名', dataIndex: 'name', key: 'name' },
  { title: '类型', dataIndex: 'type', key: 'type', width: 100 },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    render: (value) => <StatusTag status={value} />,
  },
  { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 170 },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    render: (_, record) => (
      <Space size={4}>
        <Button size="small" type="link" disabled={!record.id} onClick={() => record.id && onView(record.id)}>
          查看
        </Button>
        <Tooltip title={isAdmin ? '重新索引文档' : '仅管理员可重索引'}>
          <Button
            size="small"
            type="link"
            disabled={!isAdmin || !record.id}
            onClick={() => record.id && onReindex(record.id)}
          >
            重索引
          </Button>
        </Tooltip>
        <Tooltip title={isAdmin ? '删除文档' : '仅管理员可删除'}>
          <Button
            size="small"
            type="link"
            danger
            disabled={!isAdmin || !record.id}
            onClick={() => record.id && onDelete(record.id)}
          >
            删除
          </Button>
        </Tooltip>
      </Space>
    ),
  },
]

const PIPELINE_STEPS = [
  { icon: 'mdi:upload', label: '上传' },
  { icon: 'mdi:file-cog', label: '解析' },
  { icon: 'mdi:vector-combine', label: '向量化' },
  { icon: 'mdi:check-circle', label: '就绪' },
]

const UploadPage = () => {
  const [progress, setProgress] = useState<number | undefined>()
  const [activeDocumentId, setActiveDocumentId] = useState<number>()
  const { activeTenant, isActiveReady, isActivating, activeTenantError } = useTenantContext()
  const { data: currentUser, isError: userError } = useCurrentUser()
  const canManageDocs = Boolean(!userError && activeTenant?.id && isActiveReady)
  const { data, isLoading, refetch } = useDocuments(canManageDocs)
  const { customRequest, uploadMutation } = useUpload()
  const { deleteDocument, reindexDocument } = useDocumentActions()
  const isAdmin = activeTenant?.role === 'admin' || currentUser?.userRole === 'admin'

  const docs = useMemo(() => normalizeDocuments(data), [data])
  const stats = useMemo(
    () => ({
      total: docs.length,
      ready: docs.filter((d) => mapDocumentStatus(d.status) === 'ready').length,
      processing: docs.filter((d) => ['processing', 'waiting'].includes(mapDocumentStatus(d.status))).length,
      error: docs.filter((d) => mapDocumentStatus(d.status) === 'error').length,
    }),
    [docs],
  )

  return (
    <div className="flex flex-col h-full w-full gap-3 overflow-hidden">
      <PageHeader
        title="上传与数据集"
        description={`${activeTenant?.tenantName || '未选择团队'} · 上传后自动解析并进入 RAG 知识库`}
      />

      <div className="flex-1 flex flex-col rounded-lg overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
          {userError && (
            <Alert type="warning" showIcon message="请先登录" description="登录后可以上传与管理文档。" />
          )}
          {!userError && !activeTenant?.id && (
            <Alert type="warning" showIcon message="未选择团队" description="请先选择团队后再上传或查看文档。" />
          )}
          {activeTenantError && (
            <Alert type="error" showIcon message="团队同步失败" description={activeTenantError} />
          )}

          {/* Upload area + info panel */}
          <div className="flex gap-3 items-stretch flex-col lg:flex-row">
            <div className="flex-1 min-w-0">
              <UploadCard
                loading={uploadMutation.isPending || Boolean(progress)}
                progress={progress}
                disabled={!canManageDocs || isActivating}
                customRequest={async (opts) => {
                  setProgress(10)
                  await customRequest(opts)
                  setProgress(undefined)
                  refetch()
                }}
                onChange={(info) => {
                  if (info.file.status === 'uploading' && info.event?.percent) {
                    setProgress(info.event.percent)
                  }
                }}
              />
            </div>
            <div className="w-full lg:w-52 flex flex-row lg:flex-col gap-3 shrink-0">
              {/* Document stats */}
              <div className="flex-1 rounded-lg" style={{ padding: 'var(--spacing-md)', background: 'var(--bg-muted)', border: '1px solid var(--border-default)' }}>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">文档概览</div>
                <div className="grid grid-cols-2 gap-y-2.5 gap-x-3">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                    <Text style={{ fontSize: 12 }}>{stats.ready} 就绪</Text>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                    <Text style={{ fontSize: 12 }}>{stats.processing} 处理中</Text>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                    <Text style={{ fontSize: 12 }}>{stats.error} 失败</Text>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-slate-400" />
                    <Text style={{ fontSize: 12 }}>{stats.total} 总计</Text>
                  </div>
                </div>
              </div>
              {/* Processing pipeline */}
              <div className="flex-1 rounded-lg" style={{ padding: 'var(--spacing-md)', background: 'var(--bg-muted)', border: '1px solid var(--border-default)' }}>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">处理流程</div>
                <div className="flex items-center gap-1 flex-wrap">
                  {PIPELINE_STEPS.map((step, i) => (
                    <span key={step.label} className="flex items-center gap-0.5">
                      {i > 0 && <Icon icon="mdi:chevron-right" width={12} style={{ color: 'var(--text-tertiary, #64748b)' }} />}
                      <Icon
                        icon={step.icon}
                        width={13}
                        style={{ color: i === PIPELINE_STEPS.length - 1 ? 'var(--brand-primary)' : 'var(--text-tertiary, #94a3b8)' }}
                      />
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: i === PIPELINE_STEPS.length - 1 ? 600 : 400,
                          color: i === PIPELINE_STEPS.length - 1 ? 'var(--brand-primary)' : undefined,
                        }}
                      >
                        {step.label}
                      </Text>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* File list */}
          <Card
            className="card"
            title="文件列表"
            extra={
              <Button size="small" icon={<Icon icon="mdi:refresh" width={14} />} onClick={() => refetch()}>
                刷新
              </Button>
            }
          >
            <Table
              size="small"
              loading={isLoading}
              dataSource={docs.map((doc) => ({
                key: String(doc.id ?? doc.fileName ?? crypto.randomUUID()),
                id: doc.id,
                name: doc.fileName || '未命名文件',
                type: doc.fileType || '--',
                status: mapDocumentStatus(doc.status),
                updatedAt: doc.updatedAt,
              }))}
              columns={columns(
                Boolean(isAdmin),
                (id) => setActiveDocumentId(id),
                (id) => {
                  deleteDocument
                    .mutateAsync(id)
                    .then(() => antdMessage.success('已删除文档'))
                    .catch(() => antdMessage.error('删除失败'))
                },
                (id) => {
                  reindexDocument
                    .mutateAsync(id)
                    .then(() => antdMessage.success('已提交重索引'))
                    .catch(() => antdMessage.error('重索引失败'))
                },
              )}
              pagination={{ pageSize: 10, size: 'small' }}
              rowKey="key"
            />
          </Card>
        </div>
      </div>

      <DocumentDetailDrawer
        documentId={activeDocumentId}
        open={Boolean(activeDocumentId)}
        isAdmin={Boolean(isAdmin)}
        onClose={() => setActiveDocumentId(undefined)}
      />
    </div>
  )
}

export default UploadPage
