import { Typography } from 'antd'
import type { ReactNode } from 'react'

const { Title, Paragraph } = Typography

type PageHeaderProps = {
  title: string
  description?: ReactNode
  extra?: ReactNode
}

export const PageHeader = ({ title, description, extra }: PageHeaderProps) => {
  return (
    <div
      style={{
        marginBottom: 'var(--spacing-lg)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-md)',
        justifyContent: 'space-between',
        flexWrap: 'wrap'
      }}
    >
      <div>
        <Title level={3} style={{ marginBottom: 'var(--spacing-xs)', fontSize: '24px' }}>
          {title}
        </Title>
        {description ? (
          <Paragraph type="secondary" style={{ margin: 0, fontSize: 'var(--font-size-base)' }}>
            {description}
          </Paragraph>
        ) : null}
      </div>
      {extra}
    </div>
  )
}

export default PageHeader
