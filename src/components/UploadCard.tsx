import { Icon } from '@iconify/react'
import { Flex, Progress, Typography, Upload } from 'antd'
import type { UploadProps } from 'antd'

const { Dragger } = Upload
const { Text } = Typography

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
    <div style={{ padding: 'var(--spacing-md)', background: 'var(--bg-muted)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
      <Dragger
        name="file"
        multiple
        maxCount={5}
        accept=".pdf,.doc,.docx,.txt,.md"
        showUploadList={false}
        style={{
          borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-subtle)',
          border: '1px dashed var(--border-default)',
          transition: 'all var(--transition-base)',
        }}
        {...props}
      >
        <Flex vertical align="center" gap={8} style={{ padding: 'var(--spacing-md) 0' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-md)',
              background: 'var(--brand-primary-light)',
              display: 'grid',
              placeItems: 'center',
              transition: 'transform var(--transition-base)',
            }}
            className="upload-icon-wrapper"
          >
            <Icon icon="mdi:cloud-upload-outline" width={24} color="var(--brand-primary)" />
          </div>
          <Text style={{ fontSize: 'var(--font-size-sm)' }}>
            拖拽文件到此处，或 <Text strong style={{ color: 'var(--brand-primary)' }}>点击选择</Text>
          </Text>
          <Text type="secondary" style={{ fontSize: 'var(--font-size-xs)' }}>{hint}</Text>
          {loading && progress !== undefined ? (
            <Progress
              percent={Math.round(progress)}
              status={status}
              style={{ width: '280px', maxWidth: '90%', marginTop: 'var(--spacing-xs)' }}
              strokeColor="var(--brand-primary)"
              size="small"
            />
          ) : null}
        </Flex>
      </Dragger>
    </div>
  )
}

export default UploadCard
