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

  const navItems = useMemo<NavItem[]>(() => {
    const items: NavItem[] = [
      { key: 'chat', label: '对话', path: '/chat', icon: 'chat_bubble' },
      { key: 'upload', label: '知识库', path: '/upload', icon: 'description' },
      { key: 'teams', label: '团队', path: '/teams', icon: 'groups' },
      { key: 'settings', label: '系统', path: '/settings', icon: 'settings_input_component' },
      { key: 'datasets', label: '数据集', path: '/datasets', icon: 'grid_view' },
      { key: 'profile', label: '资料', path: '/profile', icon: 'account_circle' },
    ]
    if (currentUser?.userRole === 'admin') {
      items.splice(5, 0, { key: 'admin-users', label: '用户', path: '/admin/users', icon: 'admin_panel_settings' })
    }
    return items
  }, [currentUser?.userRole])

  const userAvatar = currentUser?.userAvatar
  const userLabel = currentUser?.userName || currentUser?.userAccount || '用户'

  return (
    <div className="app-layout flex h-full w-full gap-4 p-4">
      <div aria-hidden="true" className="app-ambient" />
      <nav className="app-sider relative z-10 w-20 flex flex-col items-center py-8 rounded-2xl shrink-0 h-full">
        <div className="mb-10">
          <div className="w-10 h-10 bg-primary/15 border border-primary/25 rounded-xl flex items-center justify-center text-primary glow-mint">
            <span className="material-symbols-outlined font-bold">bolt</span>
          </div>
        </div>

        <div className="flex flex-col gap-8 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.key}
              to={item.path}
              className={({ isActive }) =>
                `group flex flex-col items-center gap-1 transition-colors ${
                  isActive ? 'text-primary' : 'text-primary/70 hover:text-primary'
                }`
              }
            >
              <span className="material-symbols-outlined text-2xl">{item.icon}</span>
              <span className="text-[10px] font-bold tracking-wider">{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div ref={userMenuRef} className="mt-auto flex flex-col items-center gap-6 relative">
          <button
            type="button"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-primary/80 hover:text-primary bg-white/5 hover:bg-primary/10 border border-white/10 hover:border-primary/40 transition-all"
            onClick={() => navigate(`/chat?new=${Date.now()}`)}
            title="新对话"
          >
            <span className="material-symbols-outlined">add</span>
          </button>

          <button
            type="button"
            className="w-10 h-10 rounded-full border-2 border-primary/20 p-0.5 overflow-hidden ring-4 ring-white/5 bg-slate-800/40"
            onClick={() => setUserMenuOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
            title={userError ? '未登录' : userLabel}
          >
            {userAvatar ? (
              <img alt="用户头像" className="w-full h-full rounded-full object-cover" src={userAvatar} />
            ) : (
              <div className="w-full h-full rounded-full grid place-items-center text-xs font-black text-slate-300">
                {userLabel.slice(0, 1)}
              </div>
            )}
          </button>

          {userMenuOpen ? (
            <div className="absolute bottom-0 left-full ml-4 w-56 glass-panel rounded-2xl overflow-hidden z-50">
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
      </nav>

      <div className="relative z-10 flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  )
}

export default AppLayout
