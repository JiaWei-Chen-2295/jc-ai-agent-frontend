import { Icon } from '@iconify/react'
import { Button, Card, List, Space, Statistic, Typography } from 'antd'

import PageHeader from '@/components/PageHeader'
import StatusTag from '@/components/StatusTag'

const { Text } = Typography

const datasets = [
  { name: '产品手册', docs: 12, tokens: '120k', status: 'ready' as const },
  { name: 'FAQ 集合', docs: 4, tokens: '18k', status: 'processing' as const },
]

const DatasetsPage = () => {
  return (
    <div className="flex h-full w-full flex-col gap-4 overflow-hidden">
      <PageHeader
        title="数据集"
        description="查看已解析的数据集，管理向量化状态与统计。"
        extra={
          <Button type="primary" icon={<Icon icon="mdi:plus" width={16} />}>
            新建数据集
          </Button>
        }
      />

      <div className="glass-panel flex-1 rounded-2xl overflow-hidden polished-ice">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          <Space size={16} wrap>
            <Card className="card" style={{ width: 240 }}>
              <Statistic title="已上传" value={16} suffix="个文件" />
            </Card>
            <Card className="card" style={{ width: 240 }}>
              <Statistic title="可用数据集" value={6} suffix="个" />
            </Card>
            <Card className="card" style={{ width: 240 }}>
              <Statistic title="索引占用" value={42} suffix="MB" />
            </Card>
          </Space>

          <Card className="card" title="数据集列表">
            <List
              dataSource={datasets}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button key="open" type="link" icon={<Icon icon="mdi:open-in-new" width={16} />}>
                      查看
                    </Button>,
                    <Button key="delete" type="link" danger icon={<Icon icon="mdi:delete" width={16} />}>
                      删除
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={item.name}
                    description={
                      <Space>
                        <Text type="secondary">文档 {item.docs} 个</Text>
                        <Text type="secondary">Tokens {item.tokens}</Text>
                        <StatusTag status={item.status} />
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </div>
      </div>
    </div>
  )
}

export default DatasetsPage
