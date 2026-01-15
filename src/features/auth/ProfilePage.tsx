import { Button, Card, Form, Input, Typography, message as antdMessage } from 'antd'
import { useEffect } from 'react'

import PageHeader from '@/components/PageHeader'
import { useAuthActions } from '@/features/auth/api'
import { useCurrentUser } from '@/features/auth/useCurrentUser'

const { Text } = Typography

const ProfilePage = () => {
  const [form] = Form.useForm()
  const { data: currentUser } = useCurrentUser()
  const { updateMyProfile } = useAuthActions()

  useEffect(() => {
    if (!currentUser) return
    form.setFieldsValue({
      userName: currentUser.userName,
      userAvatar: currentUser.userAvatar,
      userProfile: currentUser.userProfile,
    })
  }, [currentUser, form])

  return (
    <div>
      <PageHeader
        title="个人资料"
        description="更新昵称、头像与简介，修改后会同步到当前会话。"
      />
      <Card className="card" style={{ maxWidth: 520 }}>
        <Form
          layout="vertical"
          form={form}
          onFinish={(values) => {
            updateMyProfile
              .mutateAsync(values)
              .then(() => antdMessage.success('资料已更新'))
              .catch((err) => antdMessage.error(err.message || '更新失败'))
          }}
        >
          <Form.Item label="昵称" name="userName">
            <Input placeholder="你的显示名称" />
          </Form.Item>
          <Form.Item label="头像 URL" name="userAvatar">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item label="个人简介" name="userProfile">
            <Input.TextArea rows={4} placeholder="介绍一下自己" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={updateMyProfile.isPending}>
            保存
          </Button>
        </Form>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 12 }}>
          资料修改不影响登录凭证，退出登录不会清空修改内容。
        </Text>
      </Card>
    </div>
  )
}

export default ProfilePage
