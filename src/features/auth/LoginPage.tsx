import { Icon } from '@iconify/react'
import { Button, Card, Form, Input, Space, Tabs, Typography, message as antdMessage } from 'antd'
import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import PageHeader from '@/components/PageHeader'
import { useAuthActions } from '@/features/auth/api'

const { Text } = Typography

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, register } = useAuthActions()
  const [activeKey, setActiveKey] = useState('login')
  const [form] = Form.useForm()

  const handleLogin = (values: { userAccount: string; userPassword: string }) => {
    const redirectTo = (location.state as { from?: string } | null)?.from || '/chat'
    login
      .mutateAsync(values)
      .then(() => {
        antdMessage.success('登录成功')
        navigate(redirectTo, { replace: true })
      })
      .catch((err) => antdMessage.error(err.message || '登录失败'))
  }

  const handleRegister = (values: {
    userAccount: string
    userPassword: string
    checkPassword: string
    userName?: string
  }) => {
    register
      .mutateAsync(values)
      .then(() => {
        antdMessage.success('注册成功，请登录')
        setActiveKey('login')
        form.setFieldsValue({
          userAccount: values.userAccount,
          userPassword: '',
          checkPassword: '',
        })
      })
      .catch((err) => antdMessage.error(err.message || '注册失败'))
  }

  const tabs = useMemo(
    () => [
      {
        key: 'login',
        label: '登录',
        children: (
          <Form layout="vertical" onFinish={handleLogin}>
            <Form.Item
              label="账号"
              name="userAccount"
              rules={[{ required: true, message: '请输入账号' }]}
            >
              <Input placeholder="账号/邮箱/手机号" />
            </Form.Item>
            <Form.Item
              label="密码"
              name="userPassword"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password placeholder="密码" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={login.isPending}>
              登录
            </Button>
          </Form>
        ),
      },
      {
        key: 'register',
        label: '注册',
        children: (
          <Form layout="vertical" onFinish={handleRegister} form={form}>
            <Form.Item label="昵称" name="userName">
              <Input placeholder="可选" />
            </Form.Item>
            <Form.Item
              label="账号"
              name="userAccount"
              rules={[{ required: true, message: '请输入账号' }]}
            >
              <Input placeholder="账号/邮箱/手机号" />
            </Form.Item>
            <Form.Item
              label="密码"
              name="userPassword"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password placeholder="密码" />
            </Form.Item>
            <Form.Item
              label="确认密码"
              name="checkPassword"
              dependencies={['userPassword']}
              rules={[
                { required: true, message: '请再次输入密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('userPassword') === value) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error('两次输入密码不一致'))
                  },
                }),
              ]}
            >
              <Input.Password placeholder="确认密码" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={register.isPending}>
              注册
            </Button>
          </Form>
        ),
      },
    ],
    [form, handleLogin, handleRegister, login.isPending, register.isPending],
  )

  return (
    <div>
      <PageHeader
        title="登录 / 注册"
        description="登录后自动创建个人团队，并将当前团队写入 session。"
        extra={
          <Button type="text" icon={<Icon icon="mdi:arrow-left" width={16} />} onClick={() => navigate(-1)}>
            返回
          </Button>
        }
      />
      <div style={{ maxWidth: 420, margin: '0 auto' }}>
        <Card className="card">
          <Tabs items={tabs} activeKey={activeKey} onChange={setActiveKey} centered />
          <Space direction="vertical" size={8} style={{ marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              使用 session cookie 保持登录状态
            </Text>
          </Space>
        </Card>
      </div>
    </div>
  )
}

export default LoginPage
