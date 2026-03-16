import { message as antdMessage } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

import { useAuthActions } from '@/features/auth/api'
import { useCurrentUser } from '@/features/auth/useCurrentUser'

type NavItem = { key: string; label: string; path: string; icon: string }

export const AppLayout = () => {
  const navigate = useNavigate()
  const { data: currentUser, isLoading: userLoading, isError: userError } = useCurrentUser()
  const { logout } = useAuthActions()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [navCollapsed, setNavCollapsed] = useState(false)
  const userMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!userMenuOpen) return
    const handlePointerDown = (event: MouseEvent) => {
      const container = userMenuRef.current
      const target = event.target as Node | null
      if (!container || !target) return
      if (!container.contains(target)) setUserMenuOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [userMenuOpen])

  useEffect(() => {
    const syncNavCollapsed = () => {
      if (typeof window === 'undefined') return
      setNavCollapsed(window.innerHeight < 860 || window.innerWidth < 1200)
    }

    syncNavCollapsed()
    window.addEventListener('resize', syncNavCollapsed)
    return () => window.removeEventListener('resize', syncNavCollapsed)
  }, [])

  const navItems = useMemo<NavItem[]>(() => {
    const items: NavItem[] = [
      { key: 'chat', label: '对话', path: '/chat', icon: 'chat_bubble' },
      { key: 'upload', label: '知识库', path: '/upload', icon: 'description' },
      { key: 'teams', label: '团队', path: '/teams', icon: 'groups' },
      { key: 'settings', label: '系统', path: '/settings', icon: 'settings_input_component' },
      { key: 'datasets', label: '数据集', path: '/datasets', icon: 'grid_view' },
      { key: 'quiz', label: '测验', path: '/quiz', icon: 'school' },
    ]
    if (currentUser?.userRole === 'admin') {
      items.splice(5, 0, { key: 'admin-users', label: '用户', path: '/admin/users', icon: 'admin_panel_settings' })
      items.splice(6, 0, { key: 'observability', label: '观测', path: '/observability', icon: 'monitoring' })
    }
    return items
  }, [currentUser?.userRole])

  const userAvatar = currentUser?.userAvatar
  const userLabel = currentUser?.userName || currentUser?.userAccount || '用户'

  return (
    <div className="app-layout flex h-full w-full min-h-0 gap-4 p-4">
      <div aria-hidden="true" className="app-ambient" />
      <nav
        className={`app-sider relative z-30 flex h-full shrink-0 flex-col overflow-hidden rounded-2xl py-5 min-h-0 transition-[width,padding] duration-300 ${
          navCollapsed ? 'w-20 px-3 overflow-visible' : 'w-56 px-4 overflow-visible'
        }`}
      >
        <div className={`mb-6 flex shrink-0 items-center ${navCollapsed ? 'justify-center' : 'justify-between gap-3'}`}>
          <div className={`flex items-center ${navCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/25 bg-primary/15 text-primary glow-mint">
              <span className="material-symbols-outlined font-bold">bolt</span>
            </div>
            {!navCollapsed ? (
              <div className="min-w-0">
                <div className="text-sm font-black tracking-[0.24em] text-primary/90 uppercase">JC</div>
                <div className="text-[11px] text-slate-400">Agent Console</div>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            className={`flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-primary/70 transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-primary ${
              navCollapsed ? 'absolute top-5 left-1/2 -translate-x-1/2 opacity-0 pointer-events-none' : ''
            }`}
            onClick={() => setNavCollapsed((prev) => !prev)}
            title={navCollapsed ? '展开导航' : '折叠导航'}
            aria-label={navCollapsed ? '展开导航' : '折叠导航'}
          >
            <span className="material-symbols-outlined text-[20px]">left_panel_close</span>
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.key}
              to={item.path}
              title={navCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                `group flex h-11 items-center rounded-2xl border px-3 transition-all ${
                  navCollapsed ? 'justify-center' : 'justify-start gap-3'
                } ${
                  isActive
                    ? 'border-primary/30 bg-primary/12 text-primary shadow-[0_0_0_1px_rgba(68,237,38,0.08)]'
                    : 'border-transparent text-primary/70 hover:border-white/10 hover:bg-white/5 hover:text-primary'
                }`
              }
            >
              <span className="material-symbols-outlined shrink-0 text-[22px]">{item.icon}</span>
              {!navCollapsed ? <span className="truncate text-sm font-semibold tracking-wide">{item.label}</span> : null}
            </NavLink>
          ))}
        </div>

        <div
          ref={userMenuRef}
          className={`relative mt-4 flex shrink-0 border-t border-white/8 pt-4 ${navCollapsed ? 'flex-col items-center gap-4' : 'flex-col gap-3'}`}
          onMouseEnter={() => setUserMenuOpen(true)}
          onMouseLeave={() => setUserMenuOpen(false)}
        >
          <button
            type="button"
            className={`flex h-11 items-center rounded-2xl border border-white/10 bg-white/5 text-primary/80 transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-primary ${
              navCollapsed ? 'w-11 justify-center' : 'w-full justify-start gap-3 px-3'
            }`}
            onClick={() => navigate(`/chat?new=${Date.now()}`)}
            title="新对话"
          >
            <span className="material-symbols-outlined">add</span>
            {!navCollapsed ? <span className="text-sm font-semibold">新对话</span> : null}
          </button>

          <button
            type="button"
            className={`flex items-center overflow-hidden border border-primary/20 bg-slate-800/40 p-0.5 ring-4 ring-white/5 transition-all ${
              navCollapsed ? 'h-11 w-11 justify-center rounded-full self-center' : 'h-11 w-full justify-start gap-3 rounded-2xl'
            }`}
            onClick={() => {
              setUserMenuOpen(false)
              navigate(userError ? '/login' : '/profile')
            }}
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
            title={userError ? '未登录' : userLabel}
          >
            {userAvatar ? (
              <img
                alt="用户头像"
                className={`${navCollapsed ? 'h-full w-full' : 'h-full w-10'} rounded-full object-cover`}
                src={userAvatar}
              />
            ) : (
              <div className={`${navCollapsed ? 'h-full w-full' : 'h-full w-10'} rounded-full grid place-items-center text-xs font-black text-slate-300`}>
                {userLabel.slice(0, 1)}
              </div>
            )}
            {!navCollapsed ? (
              <div className="min-w-0 flex-1 px-1 text-left">
                <div className="truncate text-sm font-semibold text-slate-200">{userError ? '未登录' : userLabel}</div>
                <div className="truncate text-[11px] text-slate-500">{userError ? '点击登录或注册' : '账户中心'}</div>
              </div>
            ) : null}
          </button>

          {userMenuOpen ? (
            <div
              className={`glass-panel absolute z-[70] w-56 overflow-hidden rounded-2xl ${
                navCollapsed ? 'bottom-0 left-full ml-4' : 'bottom-0 left-0 translate-x-full ml-3'
              }`}
            >
              <div className="px-4 py-3 border-b border-white/5">
                <div className="text-xs font-black text-slate-500 uppercase tracking-widest">Account</div>
                <div className="text-sm font-bold text-slate-200 truncate">
                  {userLoading ? '加载中...' : userError ? '未登录' : userLabel}
                </div>
              </div>
              <div className="p-2">
                {userError ? (
                  <button
                    type="button"
                    className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors rounded-xl text-sm font-bold text-slate-200"
                    onClick={() => {
                      setUserMenuOpen(false)
                      navigate('/login')
                    }}
                  >
                    登录 / 注册
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors rounded-xl text-sm font-bold text-slate-200"
                      onClick={() => {
                        setUserMenuOpen(false)
                        navigate('/profile')
                      }}
                    >
                      个人资料
                    </button>
                    <button
                      type="button"
                      className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors rounded-xl text-sm font-bold text-slate-200"
                      onClick={() => {
                        logout
                          .mutateAsync()
                          .then(() => {
                            antdMessage.success('已退出登录')
                            setUserMenuOpen(false)
                            navigate('/login')
                          })
                          .catch(() => antdMessage.error('退出失败'))
                      }}
                    >
                      退出登录
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {navCollapsed ? (
          <button
            type="button"
            className="mt-4 flex h-11 w-11 shrink-0 items-center justify-center self-center rounded-2xl border border-white/10 bg-white/5 text-primary/70 transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
            onClick={() => setNavCollapsed(false)}
            title="展开导航"
            aria-label="展开导航"
          >
            <span className="material-symbols-outlined text-[20px]">right_panel_open</span>
          </button>
        ) : null}
      </nav>

      <div className="relative z-10 flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  )
}

export default AppLayout
