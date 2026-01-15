import { Icon } from '@iconify/react'
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Result,
  Select,
  Space,
  Table,
  Tag,
  message as antdMessage,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import PageHeader from '@/components/PageHeader'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import { useAdminUserActions, useAdminUsers } from '@/features/admin/api'
import type { UserVO } from '@/api'

const roleOptions = [
  { label: '普通用户', value: 'user' },
  { label: '管理员', value: 'admin' },
  { label: '封禁', value: 'ban' },
]

const UserManagementPage = () => {
  const { data: currentUser } = useCurrentUser()
  const isAdmin = currentUser?.userRole === 'admin'
  const navigate = useNavigate()
  const [filters, setFilters] = useState({
    userAccount: '',
    userName: '',
    userRole: '',
  })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [editingUser, setEditingUser] = useState<UserVO | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const query = useMemo(
    () => ({
      current: page,
      pageSize,
      userAccount: filters.userAccount || undefined,
      userName: filters.userName || undefined,
      userRole: filters.userRole || undefined,
    }),
    [filters.userAccount, filters.userName, filters.userRole, page, pageSize],
  )
  const { data, isLoading } = useAdminUsers(query)
  const { addUser, updateUser, deleteUser } = useAdminUserActions()

  const columns: ColumnsType<UserVO> = useMemo(
    () => [
      { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
      { title: '账号', dataIndex: 'userAccount', key: 'userAccount' },
      { title: '昵称', dataIndex: 'userName', key: 'userName' },
      {
        title: '角色',
        dataIndex: 'userRole',
        key: 'userRole',
        width: 120,
        render: (value) => {
          const color = value === 'admin' ? 'green' : value === 'ban' ? 'red' : 'default'
          return <Tag color={color}>{value || 'user'}</Tag>
        },
      },
      {
        title: '操作',
        key: 'actions',
        width: 180,
        render: (_, record) => (
          <Space>
            <Button size="small" type="link" onClick={() => setEditingUser(record)}>
              编辑
            </Button>
            <Button
              size="small"
              type="link"
              danger
              onClick={() => {
                if (!record.id) return
                deleteUser
                  .mutateAsync({ id: record.id })
                  .then(() => antdMessage.success('已删除用户'))
                  .catch((err) => antdMessage.error(err.message || '删除失败'))
              }}
            >
              删除
            </Button>
          </Space>
        ),
      },
    ],
    [deleteUser],
  )

  if (!isAdmin) {
    return (
      <Result
        status="403"
        title="无权限访问"
        subTitle="该页面仅管理员可访问。"
        extra={<Button type="primary" onClick={() => navigate('/chat')}>返回</Button>}
      />
    )
  }

  return (
    <div>
      <PageHeader
        title="用户管理"
        description="管理员可新增、编辑与删除用户账号。"
        extra={
          <Button type="primary" icon={<Icon icon="mdi:account-plus" width={16} />} onClick={() => setIsCreateOpen(true)}>
            新增用户
          </Button>
        }
      />

      <Card className="card" style={{ marginBottom: 16 }} title="筛选">
        <Space size={12} wrap>
          <Input
            placeholder="账号"
            value={filters.userAccount}
            onChange={(e) => setFilters((prev) => ({ ...prev, userAccount: e.target.value }))}
            style={{ width: 200 }}
          />
          <Input
            placeholder="昵称"
            value={filters.userName}
            onChange={(e) => setFilters((prev) => ({ ...prev, userName: e.target.value }))}
            style={{ width: 200 }}
          />
          <Select
            placeholder="角色"
            allowClear
            value={filters.userRole || undefined}
            onChange={(value) => setFilters((prev) => ({ ...prev, userRole: value || '' }))}
            options={roleOptions}
            style={{ width: 160 }}
          />
          <Button onClick={() => setPage(1)}>搜索</Button>
          <Button
            onClick={() => {
              setFilters({ userAccount: '', userName: '', userRole: '' })
              setPage(1)
            }}
          >
            重置
          </Button>
        </Space>
      </Card>

      <Card className="card" title="用户列表">
        <Table
          rowKey={(record) => String(record.id)}
          columns={columns}
          dataSource={data?.content ?? []}
          loading={isLoading}
          pagination={{
            current: page,
            pageSize,
            total: data?.totalElements ?? 0,
            onChange: (nextPage, nextSize) => {
              setPage(nextPage)
              setPageSize(nextSize)
            },
          }}
        />
      </Card>

      <Modal
        title="新增用户"
        open={isCreateOpen}
        onCancel={() => setIsCreateOpen(false)}
        okButtonProps={{ style: { display: 'none' } }}
        cancelText="关闭"
      >
        <Form
          layout="vertical"
          onFinish={(values) => {
            addUser
              .mutateAsync(values)
              .then(() => {
                antdMessage.success('创建成功')
                setIsCreateOpen(false)
              })
              .catch((err) => antdMessage.error(err.message || '创建失败'))
          }}
        >
          <Form.Item label="账号" name="userAccount" rules={[{ required: true, message: '请输入账号' }]}>
            <Input placeholder="账号" />
          </Form.Item>
          <Form.Item label="密码" name="userPassword" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password placeholder="密码" />
          </Form.Item>
          <Form.Item label="昵称" name="userName">
            <Input placeholder="昵称" />
          </Form.Item>
          <Form.Item label="角色" name="userRole" initialValue="user">
            <Select options={roleOptions} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={addUser.isPending}>
            创建
          </Button>
        </Form>
      </Modal>

      <Modal
        title="编辑用户"
        open={Boolean(editingUser)}
        onCancel={() => setEditingUser(null)}
        okButtonProps={{ style: { display: 'none' } }}
        cancelText="关闭"
      >
        <Form
          layout="vertical"
          initialValues={editingUser ?? {}}
          onFinish={(values) => {
            if (!editingUser?.id) return
            updateUser
              .mutateAsync({ id: editingUser.id, ...values })
              .then(() => {
                antdMessage.success('已更新用户')
                setEditingUser(null)
              })
              .catch((err) => antdMessage.error(err.message || '更新失败'))
          }}
        >
          <Form.Item label="账号" name="userAccount">
            <Input placeholder="账号" />
          </Form.Item>
          <Form.Item label="密码" name="userPassword">
            <Input.Password placeholder="不修改请留空" />
          </Form.Item>
          <Form.Item label="昵称" name="userName">
            <Input placeholder="昵称" />
          </Form.Item>
          <Form.Item label="角色" name="userRole">
            <Select options={roleOptions} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={updateUser.isPending}>
            保存
          </Button>
        </Form>
      </Modal>
    </div>
  )
}

export default UserManagementPage
