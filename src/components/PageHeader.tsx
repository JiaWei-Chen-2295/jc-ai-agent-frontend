import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: string
  description?: ReactNode
  extra?: ReactNode
}

export const PageHeader = ({ title, description, extra }: PageHeaderProps) => {
  return (
    <header className="glass-panel h-20 rounded-2xl flex items-center justify-between px-8 shrink-0">
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Workspace</span>
        <h2 className="text-xl font-bold text-slate-100 truncate">{title}</h2>
        {description ? (
          <div className="text-xs text-slate-500 font-medium truncate">{description}</div>
        ) : null}
      </div>
      {extra ? <div className="shrink-0">{extra}</div> : null}
    </header>
  )
}

export default PageHeader
