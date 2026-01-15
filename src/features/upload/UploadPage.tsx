import { Icon } from '@iconify/react'
import { Alert, Button, Card, Col, Input, Row, Space, Table, Timeline, Tooltip, Typography, message as antdMessage } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo, useState } from 'react'

import PageHeader from '@/components/PageHeader'
import StatusTag from '@/components/StatusTag'
import UploadCard from '@/components/UploadCard'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import { useTenantContext } from '@/features/tenants/tenantContext'
import { mapDocumentStatus, normalizeDocuments, useDocumentActions, useDocuments, useUpload } from './api'

const { Paragraph, Text } = Typography

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
  onDelete: (id: number) => void,
  onReindex: (id: number) => void,
): ColumnsType<TableRow> => [
  { title: '文件名', dataIndex: 'name', key: 'name' },
  { title: '类型', dataIndex: 'type', key: 'type', width: 120 },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 140,
    render: (value) => <StatusTag status={value} />,
  },
  { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 180 },
  {
    title: '操作',
    key: 'actions',
    width: 160,
    render: (_, record) => (
      <Space>
        <Button size="small" type="link">
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

const UploadPage = () => {
  const [progress, setProgress] = useState<number | undefined>()
  const { activeTenant, isActiveReady, isActivating, activeTenantError } = useTenantContext()
  const { data: currentUser, isError: userError } = useCurrentUser()
  const canManageDocs = Boolean(!userError && activeTenant?.id && isActiveReady)
  const { data, isLoading, refetch } = useDocuments(canManageDocs)
  const { customRequest, uploadMutation } = useUpload()
  const { deleteDocument, reindexDocument } = useDocumentActions()
  const isAdmin = activeTenant?.role === 'admin' || currentUser?.userRole === 'admin'

  const timelineItems = useMemo(
    () => [
      { dot: <Icon icon="mdi:upload" />, children: '上传' },
      { dot: <Icon icon="mdi:file-cog" />, children: '解析' },
      { dot: <Icon icon="mdi:vector-combine" />, children: '向量化' },
      { dot: <Icon icon="mdi:check-circle" color="var(--brand-primary)" />, children: '就绪' },
    ],
    [],
  )

  return (
    <div>
      <PageHeader
        title="上传与数据集"
        description={`当前团队：${activeTenant?.tenantName || '未选择'} · 上传文件后自动解析并进入 RAG 知识库`}
        extra={
          <Space>
            <Input.Search placeholder="搜索文件" allowClear style={{ width: 220 }} />
            <Button type="primary" icon={<Icon icon="mdi:upload" width={16} />}>
              上传文件
            </Button>
          </Space>
        }
      />

      <Row gutter={[16, 16]}>
        {userError ? (
          <Col span={24}>
            <Alert
              type="warning"
              showIcon
              message="请先登录"
              description="登录后可以上传与管理文档。"
              style={{ marginBottom: 16 }}
            />
          </Col>
        ) : null}
        {!userError && !activeTenant?.id ? (
          <Col span={24}>
            <Alert
              type="warning"
              showIcon
              message="未选择团队"
              description="请先在右上角选择团队后再上传或查看文档。"
              style={{ marginBottom: 16 }}
            />
          </Col>
        ) : null}
        {activeTenantError ? (
          <Col span={24}>
            <Alert
              type="error"
              showIcon
              message="团队同步失败"
              description={activeTenantError}
              style={{ marginBottom: 16 }}
            />
          </Col>
        ) : null}
        <Col xs={24} lg={14}>
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
        </Col>
        <Col xs={24} lg={10}>
          <Card 
            title="处理流程" 
            className="card" 
            styles={{ body: { paddingTop: 'var(--spacing-lg)' } }}
          >
            <Paragraph type="secondary" style={{ marginBottom: 'var(--spacing-lg)' }}>
              文件上传后将依次经过解析、向量化、索引等步骤。完成后可在对话中引用。
            </Paragraph>
            <Timeline
              items={timelineItems.map((item, index) => ({
                color: index === timelineItems.length - 1 ? 'green' : 'gray',
                dot: item.dot,
                children: (
                  <Text style={{ 
                    fontWeight: index === timelineItems.length - 1 ? 600 : 400,
                    color: index === timelineItems.length - 1 ? 'var(--brand-primary)' : 'inherit'
                  }}>
                    {item.children}
                  </Text>
                ),
              }))}
            />
          </Card>
        </Col>
      </Row>

      <Card
        className="card"
        style={{ marginTop: 'var(--spacing-lg)' }}
        title="文件列表"
        extra={
          <Space>
            <Button icon={<Icon icon="mdi:refresh" width={16} />} onClick={() => refetch()}>
              刷新
            </Button>
            <Button icon={<Icon icon="mdi:filter" width={16} />}>筛选</Button>
          </Space>
        }
      >
        <Table
          loading={isLoading}
          dataSource={
            normalizeDocuments(data).map((doc) => ({
              key: String(doc.id ?? doc.fileName ?? crypto.randomUUID()),
              id: doc.id,
              name: doc.fileName || '未命名文件',
              type: doc.fileType || '--',
              status: mapDocumentStatus(doc.status),
              updatedAt: doc.updatedAt,
            }))
          }
          columns={columns(
            Boolean(isAdmin),
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
          pagination={{ pageSize: 8, size: 'small' }}
          rowKey="key"
        />
      </Card>
    </div>
  )
}

export default UploadPage
