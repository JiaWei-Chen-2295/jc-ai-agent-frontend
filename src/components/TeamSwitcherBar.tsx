import { useEffect, useRef, useState } from 'react'

import type { TenantVO } from '@/api'

type TeamSwitcherBarProps = {
  tenants: TenantVO[]
  activeTenant?: TenantVO
  activeSessionTitle?: string
  isActivating: boolean
  canChat: boolean
  onSelectTenant: (tenantId: number, tenantName: string) => Promise<void>
  variant?: 'header' | 'sidebar'
}

const getTenantMeta = (tenant?: TenantVO) => {
  if (!tenant) {
    return { badge: '未选择团队', helper: '请选择团队后开始对话' }
  }
  if (tenant.tenantType === 'personal') {
    return { badge: '个人空间', helper: '仅你可见的知识与会话' }
  }
  return { badge: '团队空间', helper: '与团队共享知识与会话' }
}

const TeamSwitcherBar = ({
  tenants,
  activeTenant,
  activeSessionTitle,
  isActivating,
  canChat,
  onSelectTenant,
  variant = 'header',
}: TeamSwitcherBarProps) => {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const tenantMeta = getTenantMeta(activeTenant)

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: MouseEvent) => {
      const container = containerRef.current
      if (!container) return
      const target = event.target as Node | null
      if (!target) return
      if (!container.contains(target)) setOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  if (variant === 'sidebar') {
    return (
      <section className="chat-glass-subtle relative z-40 shrink-0 rounded-2xl p-3">
        <div ref={containerRef} className="relative">
          <div className="mb-2 flex items-center justify-between gap-3 px-1">
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                {tenantMeta.badge}
              </div>
              <div className="truncate text-[12px] text-slate-400">{tenantMeta.helper}</div>
            </div>
            <div className={`h-2 w-2 shrink-0 rounded-full ${canChat ? 'bg-emerald-400' : 'bg-slate-600'}`}></div>
          </div>

          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-slate-950/35 px-3.5 py-3 text-left shadow-[0_8px_20px_rgba(0,0,0,0.16)] transition-colors hover:border-white/12 hover:bg-slate-950/45 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isActivating || tenants.length === 0}
            onClick={() => setOpen((value) => !value)}
            aria-haspopup="listbox"
            aria-expanded={open}
          >
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                当前团队
              </span>
              <span className="truncate text-[14px] font-semibold text-slate-100">
                {activeTenant?.tenantName || '选择团队'}
              </span>
            </div>
            <span
              className={`material-symbols-outlined text-[20px] text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
              aria-hidden="true"
            >
              expand_more
            </span>
          </button>

          {open ? (
            <div className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-2xl border border-white/8 bg-[#0f1726]/98 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <div className="border-b border-white/6 px-4 py-3">
                <div className="text-[11px] font-bold text-slate-500">切换团队</div>
              </div>
              <div className="max-h-72 overflow-y-auto p-2 custom-scrollbar" role="listbox">
                {tenants.length === 0 ? (
                  <div className="px-3 py-3 text-sm text-slate-500">暂无团队</div>
                ) : (
                  tenants.map((tenant) => {
                    const isActive = Boolean(activeTenant?.id && tenant.id === activeTenant.id)
                    return (
                      <button
                        key={tenant.id}
                        type="button"
                        className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition-colors last:mb-0 ${
                          isActive ? 'bg-white/8' : 'hover:bg-white/5'
                        }`}
                        onClick={() => {
                          if (!tenant.id) return
                          onSelectTenant(tenant.id, tenant.tenantName || '当前团队')
                            .then(() => setOpen(false))
                            .catch(() => undefined)
                        }}
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-100">{tenant.tenantName}</div>
                          <div className="text-[11px] text-slate-500">
                            {tenant.tenantType === 'personal' ? '个人空间' : '团队空间'}
                          </div>
                        </div>
                        {isActive ? <span className="material-symbols-outlined text-[18px] text-slate-300">check</span> : null}
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-3 rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-2.5">
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">当前会话</div>
          <div className="mt-1 truncate text-[13px] font-medium text-slate-200">
            {activeSessionTitle || '新对话'}
          </div>
        </div>
      </section>
    )
  }

  return (
    <header className="chat-glass-subtle relative z-40 shrink-0 rounded-2xl px-4 py-3 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div ref={containerRef} className="relative min-w-0">
          <button
            type="button"
            className="flex min-w-[220px] max-w-[280px] items-center gap-3 rounded-2xl border border-white/8 bg-slate-950/35 px-3.5 py-3 text-left shadow-[0_8px_20px_rgba(0,0,0,0.16)] transition-colors hover:border-white/12 hover:bg-slate-950/45 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isActivating || tenants.length === 0}
            onClick={() => setOpen((value) => !value)}
            aria-haspopup="listbox"
            aria-expanded={open}
          >
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                {tenantMeta.badge}
              </span>
              <span className="truncate text-[15px] font-semibold text-slate-100">
                {activeTenant?.tenantName || '选择团队'}
              </span>
            </div>
            <span
              className={`material-symbols-outlined text-[20px] text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
              aria-hidden="true"
            >
              expand_more
            </span>
          </button>

          {open ? (
            <div className="absolute left-0 top-full z-50 mt-2 w-[280px] overflow-hidden rounded-2xl border border-white/8 bg-[#0f1726]/98 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <div className="border-b border-white/6 px-4 py-3">
                <div className="text-[11px] font-bold text-slate-500">切换团队</div>
              </div>
              <div className="max-h-72 overflow-y-auto p-2 custom-scrollbar" role="listbox">
                {tenants.length === 0 ? (
                  <div className="px-3 py-3 text-sm text-slate-500">暂无团队</div>
                ) : (
                  tenants.map((tenant) => {
                    const isActive = Boolean(activeTenant?.id && tenant.id === activeTenant.id)
                    return (
                      <button
                        key={tenant.id}
                        type="button"
                        className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition-colors last:mb-0 ${
                          isActive ? 'bg-white/8' : 'hover:bg-white/5'
                        }`}
                        onClick={() => {
                          if (!tenant.id) return
                          onSelectTenant(tenant.id, tenant.tenantName || '当前团队')
                            .then(() => setOpen(false))
                            .catch(() => undefined)
                        }}
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-100">{tenant.tenantName}</div>
                          <div className="text-[11px] text-slate-500">
                            {tenant.tenantType === 'personal' ? '个人空间' : '团队空间'}
                          </div>
                        </div>
                        {isActive ? <span className="material-symbols-outlined text-[18px] text-slate-300">check</span> : null}
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
          <div className={`h-2 w-2 shrink-0 rounded-full ${canChat ? 'bg-emerald-400' : 'bg-slate-600'}`}></div>
          <div className="min-w-0 text-right">
            <div className="truncate text-sm font-medium text-slate-200">{activeSessionTitle || '新对话'}</div>
            <div className="truncate text-[11px] text-slate-500">{tenantMeta.helper}</div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default TeamSwitcherBar
