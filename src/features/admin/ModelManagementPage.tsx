import { Icon } from '@iconify/react'
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Result,
  Select,
  Space,
  Switch,
  Table,
  Tooltip,
  message as antdMessage,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAdminModelActions, useAdminModels, type AiModelAdminVO, type AiModelConfigRequest } from './modelApi'

import PageHeader from '@/components/PageHeader'
import { useCurrentUser } from '@/features/auth/useCurrentUser'

const providerOptions = [
  { label: 'DashScope（通义）', value: 'dashscope' },
  { label: 'OpenAI', value: 'openai' },
  { label: 'DeepSeek', value: 'deepseek' },
  { label: 'Moonshot（月之暗面）', value: 'moonshot' },
  { label: '智谱 AI', value: 'zhipu' },
]

type ModelFormValues = AiModelConfigRequest & { id?: number }

const ModelManagementPage = () => {
  const { data: currentUser } = useCurrentUser()
  const isAdmin = currentUser?.userRole === 'admin'
  const navigate = useNavigate()

  const { data: models = [], isLoading } = useAdminModels()
  const { createModel, updateModel, toggleModel, deleteModel } = useAdminModelActions()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingModel, setEditingModel] = useState<AiModelAdminVO | null>(null)

  const columns: ColumnsType<AiModelAdminVO> = useMemo(
    () => [
      { title: 'ID', dataIndex: 'id', key: 'id', width: 64 },
      {
        title: '排序',
        dataIndex: 'sortOrder',
        key: 'sortOrder',
        width: 72,
        sorter: (a, b) => a.sortOrder - b.sortOrder,
      },
      {
        title: '展示名称',
        dataIndex: 'displayName',
        key: 'displayName',
        render: (value, record) => (
          <Space size={8}>
            {record.iconUrl ? (
              <img src={record.iconUrl} alt="" className="w-5 h-5 rounded object-cover" />
            ) : null}
            <span>{value}</span>
          </Space>
        ),
      },
      { title: '提供商', dataIndex: 'provider', key: 'provider', width: 120 },
      { title: 'modelId', dataIndex: 'modelId', key: 'modelId' },
      { title: 'modelName', dataIndex: 'modelName', key: 'modelName' },
      {
        title: 'API Key',
        dataIndex: 'apiKeyMasked',
        key: 'apiKeyMasked',
        render: (value) => <span className="font-mono text-xs text-slate-400">{value || '—'}</span>,
      },
      {
        title: '状态',
        dataIndex: 'enabled',
        key: 'enabled',
        width: 100,
        render: (value, record) => (
          <Tooltip title={value ? '点击禁用' : '点击启用'}>
            <Switch
              size="small"
              checked={value}
              loading={toggleModel.isPending}
              onChange={() => {
                toggleModel
                  .mutateAsync(record.id)
                  .then(() => antdMessage.success(value ? '已禁用' : '已启用'))
                  .catch((err) => antdMessage.error(err.message || '操作失败'))
              }}
            />
          </Tooltip>
        ),
      },
      {
        title: '操作',
        key: 'actions',
        width: 160,
        render: (_, record) => (
          <Space>
            <Button size="small" type="link" onClick={() => setEditingModel(record)}>
              编辑
            </Button>
            <Button
              size="small"
              type="link"
              danger
              onClick={() => {
                Modal.confirm({
                  title: '确认删除？',
                  content: `删除后已使用该模型的会话将无法继续聊天，确定要删除「${record.displayName}」吗？`,
                  okText: '删除',
                  okButtonProps: { danger: true },
                  onOk: () =>
                    deleteModel
                      .mutateAsync(record.id)
                      .then(() => antdMessage.success('已删除'))
                      .catch((err) => antdMessage.error(err.message || '删除失败')),
                })
              }}
            >
              删除
            </Button>
          </Space>
        ),
      },
    ],
    [deleteModel, toggleModel],
  )

  if (!isAdmin) {
    return (
      <Result
        status="403"
        title="无权限访问"
        subTitle="该页面仅管理员可访问。"
        extra={
          <Button type="primary" onClick={() => navigate('/chat')}>
            返回
          </Button>
        }
      />
    )
  }

  return (
    <div className="flex h-full w-full flex-col gap-4 overflow-hidden">
      <PageHeader
        title="模型管理"
        description="管理可用 AI 模型：新增、编辑、启用/禁用或删除模型配置。"
        extra={
          <Button
            type="primary"
            icon={<Icon icon="mdi:robot-outline" width={16} />}
            onClick={() => setIsCreateOpen(true)}
          >
            新增模型
          </Button>
        }
      />

      <div className="glass-panel flex-1 rounded-2xl overflow-hidden polished-ice">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <Card className="card" title="模型列表">
            <Table
              rowKey="id"
              columns={columns}
              dataSource={models}
              loading={isLoading}
              pagination={false}
              scroll={{ x: 900 }}
            />
          </Card>
        </div>
      </div>

      {/* ── Create modal ─────────────────────────────────────────────── */}
      <Modal
        title="新增模型"
        open={isCreateOpen}
        onCancel={() => setIsCreateOpen(false)}
        okButtonProps={{ style: { display: 'none' } }}
        cancelText="关闭"
        width={560}
      >
        <ModelForm
          onFinish={(values) =>
            createModel
              .mutateAsync(values)
              .then(() => {
                antdMessage.success('创建成功')
                setIsCreateOpen(false)
              })
              .catch((err) => antdMessage.error(err.message || '创建失败'))
          }
          isPending={createModel.isPending}
        />
      </Modal>

      {/* ── Edit modal ───────────────────────────────────────────────── */}
      <Modal
        title="编辑模型"
        open={Boolean(editingModel)}
        onCancel={() => setEditingModel(null)}
        okButtonProps={{ style: { display: 'none' } }}
        cancelText="关闭"
        width={560}
      >
        {editingModel ? (
          <ModelForm
            initialValues={editingModel}
            isEdit
            onFinish={(values) => {
              if (!editingModel.id) return
              updateModel
                .mutateAsync({ id: editingModel.id, ...values })
                .then(() => {
                  antdMessage.success('已更新')
                  setEditingModel(null)
                })
                .catch((err) => antdMessage.error(err.message || '更新失败'))
            }}
            isPending={updateModel.isPending}
          />
        ) : null}
      </Modal>
    </div>
  )
}

// ── Sub-component: ModelForm ──────────────────────────────────────────────────

interface ModelFormProps {
  initialValues?: Partial<ModelFormValues>
  isEdit?: boolean
  onFinish: (arg: AiModelConfigRequest) => void
  isPending: boolean
}

const ModelForm = ({ initialValues, isEdit = false, onFinish, isPending }: ModelFormProps) => (
  <Form layout="vertical" initialValues={initialValues ?? {}} onFinish={(v) => onFinish(v as AiModelConfigRequest)}>
    <div className="grid grid-cols-2 gap-x-4">
      <Form.Item label="提供商" name="provider" rules={[{ required: true, message: '请选择提供商' }]}>
        <Select placeholder="请选择" options={providerOptions} />
      </Form.Item>

      <Form.Item label="modelId（业务唯一键）" name="modelId" rules={[{ required: true, message: '请输入 modelId' }]}>
        <Input placeholder="例：qwen3-max" disabled={isEdit} />
      </Form.Item>

      <Form.Item label="modelName（传给 API）" name="modelName" rules={[{ required: true, message: '请输入 modelName' }]}>
        <Input placeholder="例：qwen-max" />
      </Form.Item>

      <Form.Item label="displayName（展示名称）" name="displayName" rules={[{ required: true, message: '请输入展示名称' }]}>
        <Input placeholder="例：通义千问3 Max" />
      </Form.Item>
    </div>

    <Form.Item label="baseUrl（非 DashScope 必填）" name="baseUrl">
      <Input placeholder="https://api.deepseek.com/v1" />
    </Form.Item>

    <Form.Item
      label={isEdit ? 'API Key（留空表示不修改）' : 'API Key（DashScope 可留空）'}
      name="apiKeyPlain"
      rules={isEdit ? [] : []}
    >
      <Input.Password placeholder={isEdit ? '留空则不修改' : '请输入 API Key'} />
    </Form.Item>

    <div className="grid grid-cols-3 gap-x-4">
      <Form.Item label="最大 Token" name="maxTokens">
        <InputNumber min={1} max={1000000} className="w-full" placeholder="默认" />
      </Form.Item>

      <Form.Item label="温度" name="temperature">
        <InputNumber min={0} max={2} step={0.1} className="w-full" placeholder="默认" />
      </Form.Item>

      <Form.Item label="排序（越小越靠前）" name="sortOrder">
        <InputNumber min={0} className="w-full" placeholder="0" />
      </Form.Item>
    </div>

    <Form.Item label="描述" name="description">
      <Input.TextArea rows={2} placeholder="可选，展示给用户的简短描述" />
    </Form.Item>

    <Form.Item label="图标 URL" name="iconUrl">
      <Input placeholder="https://..." />
    </Form.Item>

    <Button type="primary" htmlType="submit" loading={isPending}>
      {isEdit ? '保存' : '创建'}
    </Button>
  </Form>
)

export default ModelManagementPage
