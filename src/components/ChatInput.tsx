import { Icon } from '@iconify/react'
import type { CSSProperties, ReactNode } from 'react'
import { Button, Flex, Input, Space, Tooltip, Typography } from 'antd'
import { useMemo, useState } from 'react'

type ChatInputProps = {
  onSend?: (message: string) => void
  loading?: boolean
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  hint?: string
  footerLeft?: ReactNode
  footerRight?: ReactNode
  className?: string
  style?: CSSProperties
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
}: ChatInputProps) => {
  const [innerValue, setInnerValue] = useState('')
  const currentValue = useMemo(() => value ?? innerValue, [innerValue, value])
  const setValue = onChange ?? setInnerValue

  const handleSend = () => {
    if (!currentValue.trim()) return
    onSend?.(currentValue.trim())
    setValue('')
  }

  return (
    <div className={className ?? 'card'} style={{ padding: 16, ...style }}>
      <Flex vertical gap={10}>
        <Input.TextArea
          placeholder={placeholder}
          autoSize={{ minRows: 3, maxRows: 6 }}
          value={currentValue}
          onChange={(e) => setValue(e.target.value)}
          onPressEnter={(e) => {
            if (e.metaKey || e.ctrlKey) {
              e.preventDefault()
              handleSend()
            }
          }}
        />
        <Flex justify="space-between" align="center">
          <Space>
            {footerLeft ?? (
              <>
                <Tooltip title="附加文件（即将支持）">
                  <Button icon={<Icon icon="mdi:paperclip" width={16} />} />
                </Tooltip>
                <Tooltip title="重置上下文">
                  <Button icon={<Icon icon="mdi:refresh" width={16} />} />
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
              disabled={!currentValue.trim()}
            >
              发送
            </Button>
          </Space>
        </Flex>
        {hint ? (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {hint}
          </Text>
        ) : null}
      </Flex>
    </div>
  )
}

export default ChatInput
