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
    <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
      <Dragger
        name="file"
        multiple
        maxCount={5}
        accept=".pdf,.doc,.docx,.txt,.md"
        showUploadList={false}
        style={{ 
          borderRadius: 'var(--radius-md)', 
          background: 'var(--bg-subtle)',
          border: '1px dashed var(--border-default)',
          transition: 'all var(--transition-base)'
        }}
        {...props}
      >
        <Flex vertical align="center" gap={12} style={{ padding: 'var(--spacing-lg) 0' }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 'var(--radius-lg)',
              background: 'var(--brand-primary-light)',
              display: 'grid',
              placeItems: 'center',
              marginBottom: 'var(--spacing-xs)',
              transition: 'transform var(--transition-base)'
            }}
            className="upload-icon-wrapper"
          >
            <Icon icon="mdi:cloud-upload-outline" width={36} color="var(--brand-primary)" />
          </div>
          <Paragraph style={{ margin: 'var(--spacing-xs) 0 0', fontSize: 'var(--font-size-lg)' }}>
            拖拽文件到此处，或 <Text strong style={{ color: 'var(--brand-primary)' }}>点击选择</Text>
          </Paragraph>
          <Text type="secondary" style={{ fontSize: 'var(--font-size-sm)' }}>{hint}</Text>
          {loading && progress !== undefined ? (
            <Progress
              percent={Math.round(progress)}
              status={status}
              style={{ width: '320px', maxWidth: '90%', marginTop: 'var(--spacing-md)' }}
              strokeColor="var(--brand-primary)"
            />
          ) : null}
        </Flex>
      </Dragger>
      <Alert
        style={{ marginTop: 'var(--spacing-md)', borderRadius: 'var(--radius-sm)' }}
        type="info"
        showIcon
        message={<Text type="secondary">文件上传后将自动解析并进入向量化流程</Text>}
      />
    </div>
  )
}

export default UploadCard
