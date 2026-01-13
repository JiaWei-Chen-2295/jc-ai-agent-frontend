import { Icon } from '@iconify/react'
import { Button, Card, Col, Input, Row, Space, Table, Timeline, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo, useState } from 'react'

import PageHeader from '@/components/PageHeader'
import StatusTag from '@/components/StatusTag'
import UploadCard from '@/components/UploadCard'
import { mapDocumentStatus, normalizeDocuments, useDocuments, useUpload } from './api'

const { Paragraph } = Typography

type TableRow = {
  key: string
  name?: string
  type?: string
  status: 'ready' | 'processing' | 'error' | 'waiting'
  updatedAt?: string
}

const columns: ColumnsType<TableRow> = [
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
    render: () => (
      <Space>
        <Button size="small" type="link">
          查看
        </Button>
        <Button size="small" type="link" danger>
          删除
        </Button>
      </Space>
    ),
  },
]

const UploadPage = () => {
  const [progress, setProgress] = useState<number | undefined>()
  const { data, isLoading, refetch } = useDocuments()
  const { customRequest, uploadMutation } = useUpload()

  const timelineItems = useMemo(
    () => [
      { dot: <Icon icon="mdi:upload" />, children: '上传' },
      { dot: <Icon icon="mdi:file-cog" />, children: '解析' },
      { dot: <Icon icon="mdi:vector-combine" />, children: '向量化' },
      { dot: <Icon icon="mdi:check-circle" color="#2fbd6a" />, children: '就绪' },
    ],
    [],
  )

  return (
    <div>
      <PageHeader
        title="上传与数据集"
        description="上传文件后自动解析并进入 RAG 知识库，可随时查看进度与状态。"
        extra={
          <Space>
            <Input.Search placeholder="搜索文件" allowClear style={{ width: 220 }} />
            <Button type="primary" icon={<Icon icon="mdi:upload" width={16} />}>
              上传文件
            </Button>
          </Space>
        }
      />

      <Row gutter={16}>
        <Col xs={24} lg={14}>
          <UploadCard
            loading={uploadMutation.isPending || Boolean(progress)}
            progress={progress}
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
          <Card title="处理流程" className="card" styles={{ body: { paddingTop: 4 } }}>
            <Paragraph type="secondary" style={{ marginBottom: 8 }}>
              文件上传后将依次经过解析、向量化、索引等步骤。完成后可在对话中引用。
            </Paragraph>
            <Timeline
              items={timelineItems.map((item, index) => ({
                color: index === timelineItems.length - 1 ? 'green' : 'blue',
                dot: item.dot,
                children: item.children,
              }))}
            />
          </Card>
        </Col>
      </Row>

      <Card
        className="card"
        style={{ marginTop: 16 }}
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
              name: doc.fileName || '未命名文件',
              type: doc.fileType || '--',
              status: mapDocumentStatus(doc.status),
              updatedAt: doc.updatedAt,
            }))
          }
          columns={columns}
          pagination={{ pageSize: 8, size: 'small' }}
          rowKey="key"
        />
      </Card>
    </div>
  )
}

export default UploadPage
