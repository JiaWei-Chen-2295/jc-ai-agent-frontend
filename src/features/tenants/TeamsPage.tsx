import { Icon } from '@iconify/react'
import { Alert, Button, Card, Form, Input, Modal, Space, Table, Tag, Typography, message as antdMessage } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo, useState } from 'react'

import PageHeader from '@/components/PageHeader'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import { useTenantActions } from '@/features/tenants/api'
import { useTenantContext } from '@/features/tenants/tenantContext'
import type { TenantVO } from '@/api'

const { Text } = Typography

type TransferState = {
  tenantId: number
  tenantName?: string
}

const TeamsPage = () => {
  const { tenants, activeTenantId, setActiveTenant, isLoading, error, refresh } = useTenantContext()
  const { data: currentUser, isError: userError } = useCurrentUser()
  const { createTeam, joinTeam, leaveTeam, transferAdmin } = useTenantActions()

  const [createName, setCreateName] = useState('')
  const [joinId, setJoinId] = useState('')
  const [transferTarget, setTransferTarget] = useState<TransferState | null>(null)
  const [newAdminId, setNewAdminId] = useState('')

  const isSystemAdmin = currentUser?.userRole === 'admin'

  const columns: ColumnsType<TenantVO> = useMemo(
    () => [
      {
        title: '团队',
        dataIndex: 'tenantName',
        key: 'tenantName',
        render: (value, record) => (
          <Space>
            <Text strong>{value || '未命名团队'}</Text>
            {record.tenantType === 'personal' ? <Tag color="blue">个人</Tag> : <Tag>团队</Tag>}
            {record.id === activeTenantId ? <Tag color="green">当前</Tag> : null}
          </Space>
        ),
      },
      {
        title: '角色',
        dataIndex: 'role',
        key: 'role',
        width: 120,
        render: (value) => (value === 'admin' ? <Tag color="green">管理员</Tag> : <Tag>成员</Tag>),
      },
      {
        title: '操作',
        key: 'actions',
        width: 240,
        render: (_, record) => {
          const isAdmin = record.role === 'admin' || isSystemAdmin
          const isPersonal = record.tenantType === 'personal'
          return (
            <Space>
              <Button
                size="small"
                type="link"
                disabled={!record.id || record.id === activeTenantId}
                onClick={async () => {
                  if (!record.id) return
                  try {
                    await setActiveTenant(record.id)
                    antdMessage.success(`已切换至 ${record.tenantName}`)
                  } catch (err) {
                    antdMessage.error('切换失败')
                  }
                }}
              >
                切换
              </Button>
              <Button
                size="small"
                type="link"
                danger
                disabled={!record.id || isPersonal}
                onClick={() => {
                  if (!record.id) return
                  leaveTeam
                    .mutateAsync({ tenantId: record.id })
                    .then(() => antdMessage.success('已退出团队'))
                    .catch(() => antdMessage.error('退出失败'))
                }}
              >
                退出
              </Button>
              {record.tenantType === 'team' && isAdmin ? (
                <Button
                  size="small"
                  type="link"
                  onClick={() =>
                    setTransferTarget({ tenantId: record.id as number, tenantName: record.tenantName })
                  }
                >
                  转让管理员
                </Button>
              ) : null}
            </Space>
          )
        },
      },
    ],
    [activeTenantId, isSystemAdmin, leaveTeam, setActiveTenant],
  )

  return (
    <div className="flex h-full w-full gap-4 overflow-hidden">
      <aside className="glass-panel w-96 rounded-2xl flex flex-col overflow-hidden transition-all duration-300 polished-ice">
        <div className="p-6 space-y-6">
          <div>
            <div className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">团队操作</div>
            <div className="mt-4 space-y-4">
              <Form layout="vertical" onFinish={() => undefined}>
                <Form.Item label="创建团队">
                  <Input
                    placeholder="输入团队名称"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                  />
                </Form.Item>
                <Button
                  type="primary"
                  block
                  disabled={!createName.trim() || createTeam.isPending}
                  onClick={() =>
                    createTeam
                      .mutateAsync({ tenantName: createName.trim() })
                      .then(() => {
                        antdMessage.success('团队创建成功')
                        setCreateName('')
                      })
                      .catch((err) => antdMessage.error(err.message || '创建失败'))
                  }
                >
                  创建
                </Button>
              </Form>

              <Form layout="vertical" onFinish={() => undefined}>
                <Form.Item label="加入团队">
                  <Input
                    placeholder="输入团队 ID"
                    value={joinId}
                    onChange={(e) => setJoinId(e.target.value)}
                  />
                </Form.Item>
                <Button
                  block
                  disabled={!joinId.trim() || joinTeam.isPending}
                  onClick={() =>
                    (() => {
                      const tenantId = Number(joinId)
                      if (!Number.isFinite(tenantId)) {
                        antdMessage.warning('请输入有效的团队 ID')
                        return
                      }
                      joinTeam
                        .mutateAsync({ tenantId })
                        .then(() => {
                          antdMessage.success('加入成功')
                          setJoinId('')
                        })
                        .catch((err) => antdMessage.error(err.message || '加入失败'))
                    })()
                  }
                >
                  加入
                </Button>
              </Form>
            </div>
          </div>

          {userError ? (
            <Alert
              type="warning"
              showIcon
              message="当前未登录"
              description="请先登录后再进行团队管理操作。"
            />
          ) : null}

          {error ? (
            <Alert
              type="error"
              showIcon
              message="无法获取团队列表"
              description={error.message}
            />
          ) : null}
        </div>

        <div className="mt-auto p-4 border-t border-white/5 bg-white/5">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-sm">groups</span>
            <span className="text-xs font-bold text-slate-500">共 {tenants.length} 个团队</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col gap-4 overflow-hidden">
        <PageHeader
          title="团队管理"
          description="创建、加入或管理团队。当前团队由服务端 session 维护，切换后将影响文档与聊天范围。"
          extra={
            <Button icon={<Icon icon="mdi:refresh" width={16} />} onClick={refresh}>
              刷新
            </Button>
          }
        />

        <div className="glass-panel flex-1 rounded-2xl overflow-hidden polished-ice">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            <Card className="card" title="我加入的团队">
              <Table
                rowKey={(record) => String(record.id ?? record.tenantName)}
                loading={isLoading}
                columns={columns}
                dataSource={tenants}
                pagination={{ pageSize: 8, size: 'small' }}
              />
            </Card>
          </div>
        </div>
      </main>

      <Modal
        title={`转让管理员${transferTarget?.tenantName ? ` · ${transferTarget.tenantName}` : ''}`}
        open={Boolean(transferTarget)}
        onCancel={() => setTransferTarget(null)}
        onOk={() => {
          if (!transferTarget?.tenantId) return
          const newAdminUserId = Number(newAdminId)
          if (!Number.isFinite(newAdminUserId)) {
            antdMessage.warning('请输入有效的用户 ID')
            return
          }
          transferAdmin
            .mutateAsync({
              tenantId: transferTarget.tenantId,
              newAdminUserId,
            })
            .then(() => {
              antdMessage.success('已转让管理员')
              setTransferTarget(null)
              setNewAdminId('')
            })
            .catch((err) => antdMessage.error(err.message || '转让失败'))
        }}
        okButtonProps={{ disabled: !newAdminId.trim() }}
      >
        <Text type="secondary">请输入新的管理员用户 ID</Text>
        <Input
          style={{ marginTop: 12 }}
          placeholder="用户 ID"
          value={newAdminId}
          onChange={(e) => setNewAdminId(e.target.value)}
        />
      </Modal>
    </div>
  )
}

export default TeamsPage
