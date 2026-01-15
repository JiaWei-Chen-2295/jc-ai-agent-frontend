import { Icon } from '@iconify/react'
import { Button, Card, Divider, Form, Input, InputNumber, Space, Switch, Typography } from 'antd'

import PageHeader from '@/components/PageHeader'
import { apiBaseUrl } from '@/services/http'

const { Text } = Typography

const SettingsPage = () => {
  return (
    <div>
      <PageHeader
        title="设置"
        description="配置 API、Swagger 地址以及模型参数。"
        extra={
          <Button type="primary" icon={<Icon icon="mdi:content-save" width={16} />} htmlType="submit">
            保存
          </Button>
        }
      />

      <Card className="card" title="连接配置" style={{ marginBottom: 16 }}>
        <Form layout="vertical">
          <Form.Item label="API Base URL" initialValue={apiBaseUrl}>
            <Input placeholder="例如 http://localhost:8525/api" />
          </Form.Item>
          <Form.Item
            label="Swagger 文档 URL"
            initialValue="http://localhost:8525/api/v3/api-docs"
          >
            <Input placeholder="http://localhost:8525/api/v3/api-docs" />
          </Form.Item>
          <Form.Item label="鉴权 Token">
            <Input.Password placeholder="可选，Bearer Token" />
          </Form.Item>
        </Form>
      </Card>

      <Card className="card" title="模型与推理">
        <Form layout="vertical">
          <Space size={12} wrap>
            <Form.Item label="Temperature" style={{ minWidth: 200 }}>
              <InputNumber min={0} max={1} step={0.1} defaultValue={0.2} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Top K" style={{ minWidth: 200 }}>
              <InputNumber min={1} max={10} defaultValue={5} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Max Tokens" style={{ minWidth: 200 }}>
              <InputNumber min={256} max={4096} step={256} defaultValue={1024} style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Divider />
          <Space align="center">
            <Switch defaultChecked />
            <Text>启用日志与埋点</Text>
          </Space>
        </Form>
      </Card>
    </div>
  )
}

export default SettingsPage
