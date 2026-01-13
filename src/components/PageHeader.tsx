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
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        justifyContent: 'space-between',
      }}
    >
      <div>
        <Title level={3} style={{ marginBottom: 4 }}>
          {title}
        </Title>
        {description ? (
          <Paragraph type="secondary" style={{ margin: 0 }}>
            {description}
          </Paragraph>
        ) : null}
      </div>
      {extra}
    </div>
  )
}

export default PageHeader
