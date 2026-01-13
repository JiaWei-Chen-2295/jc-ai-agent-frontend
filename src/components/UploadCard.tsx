import { Icon } from '@iconify/react'
import { Alert, Flex, Progress, Typography, Upload } from 'antd'
import type { UploadProps } from 'antd'

const { Dragger } = Upload
const { Paragraph, Text } = Typography

type UploadCardProps = {
  loading?: boolean
  progress?: number
  status?: 'exception' | 'active' | 'success' | 'normal'
  hint?: string
} & UploadProps

export const UploadCard = ({
  loading = false,
  progress,
  status = 'normal',
  hint = '支持 pdf、docx、txt 等常见格式，单文件不超过 20MB',
  ...props
}: UploadCardProps) => {
  return (
    <div className="card" style={{ padding: 20 }}>
      <Dragger
        name="file"
        multiple
        maxCount={5}
        accept=".pdf,.doc,.docx,.txt,.md"
        showUploadList={false}
        style={{ borderRadius: 12 }}
        {...props}
      >
        <Flex vertical align="center" gap={8} style={{ padding: '12px 0' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: 'rgba(47, 189, 106, 0.08)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Icon icon="mdi:cloud-upload-outline" width={30} color="#2fbd6a" />
          </div>
          <Paragraph style={{ margin: '8px 0 0', fontSize: 16 }}>
            拖拽文件到此处，或 <Text strong>点击选择</Text>
          </Paragraph>
          <Text type="secondary">{hint}</Text>
          {loading && progress !== undefined ? (
            <Progress
              percent={Math.round(progress)}
              status={status}
              style={{ width: '320px', maxWidth: '90%' }}
            />
          ) : null}
        </Flex>
      </Dragger>
      <Alert
        style={{ marginTop: 16 }}
        type="info"
        showIcon
        message="文件上传后将自动解析并进入向量化流程"
      />
    </div>
  )
}

export default UploadCard
