import { Icon } from '@iconify/react'
import type { CSSProperties, ReactNode } from 'react'
import { Button, Flex, Input, Space, Tooltip, Typography } from 'antd'
import { useMemo, useState } from 'react'

type ChatInputProps = {
  onSend?: (message: string) => void | Promise<void>
  loading?: boolean
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  hint?: string
  footerLeft?: ReactNode
  footerRight?: ReactNode
  className?: string
  style?: CSSProperties
  disabled?: boolean
}

const { Text } = Typography

export const ChatInput = ({
  onSend,
  loading = false,
  value,
  onChange,
  placeholder = '有问题尽管问',
  hint,
  footerLeft,
  footerRight,
  className,
  style,
  disabled = false,
}: ChatInputProps) => {
  const [innerValue, setInnerValue] = useState('')
  const currentValue = useMemo(() => value ?? innerValue, [innerValue, value])
  const setValue = onChange ?? setInnerValue

  const handleSend = () => {
    if (disabled) return
    if (!currentValue.trim()) return
    onSend?.(currentValue.trim())
    setValue('')
  }

  return (
    <div className={className ?? 'card'} style={{ padding: 'var(--spacing-md)', ...style }}>
      <Flex vertical gap={12}>
        <Input.TextArea
          variant="borderless"
          placeholder={placeholder}
          autoSize={{ minRows: 3, maxRows: 6 }}
          value={currentValue}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          onPressEnter={(e) => {
            if (e.metaKey || e.ctrlKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          style={{ padding: 0, fontSize: 'var(--font-size-base)' }}
        />
        <Flex justify="space-between" align="center">
          <Space size="small">
            {footerLeft ?? (
              <>
                <Tooltip title="附加文件（即将支持）">
                  <Button type="text" shape="circle" icon={<Icon icon="mdi:paperclip" width={18} />} />
                </Tooltip>
                <Tooltip title="重置上下文">
                  <Button type="text" shape="circle" icon={<Icon icon="mdi:refresh" width={18} />} />
                </Tooltip>
              </>
            )}
          </Space>
          <Space>
            {footerRight}
            <Button
              type="primary"
              icon={<Icon icon="mdi:send" width={16} />}
              loading={loading}
              onClick={handleSend}
              disabled={!currentValue.trim() || disabled}
              shape="round"
              style={{ padding: '0 20px' }}
            >
              发送
            </Button>
          </Space>
        </Flex>
        {hint ? (
          <Text type="secondary" style={{ fontSize: 'var(--font-size-xs)' }}>
            {hint}
          </Text>
        ) : null}
      </Flex>
    </div>
  )
}

export default ChatInput
