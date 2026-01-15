import { Icon } from '@iconify/react'
import { Tag } from 'antd'

type StatusType = 'ready' | 'processing' | 'error' | 'waiting'

const statusMap: Record<
  StatusType,
  { color: string; text: string; icon: string; className?: string }
> = {
  ready: { color: 'success', text: '已就绪', icon: 'mdi:check-circle' },
  processing: { color: 'processing', text: '处理中', icon: 'mdi:progress-clock' },
  error: { color: 'error', text: '失败', icon: 'mdi:alert-circle' },
  waiting: { color: 'default', text: '等待', icon: 'mdi:cloud-upload' },
}

export const StatusTag = ({ status }: { status: StatusType }) => {
  const current = statusMap[status]
  return (
    <Tag 
      color={current.color} 
      icon={<Icon icon={current.icon} width={14} />}
      style={{ 
        borderRadius: 'var(--radius-sm)',
        padding: '0 var(--spacing-sm)',
        border: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4
      }}
    >
      {current.text}
    </Tag>
  )
}

export default StatusTag
