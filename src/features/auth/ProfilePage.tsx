import { Avatar, Form, Input, Modal, Progress, message as antdMessage } from 'antd'
import { animate, createSpring } from 'animejs'
import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { useAuthActions } from '@/features/auth/api'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import type { AvatarUploadTokenResponse } from '@/api'
import { apiBaseUrl } from '@/services/http'

const MAX_AVATAR_BYTES = 2 * 1024 * 1024

type RequestError = {
  status?: number
  message: string
  code?: number
}

type BaseResponse<T> = {
  code?: number
  data?: T
  message?: string
}

const getApiErrorMessage = (
  error: unknown,
  fallback: string,
  options?: { forbidden?: string; unauthenticated?: string },
) => {
  if (error && typeof error === 'object') {
    const status = 'status' in error ? (error as RequestError).status : undefined
    const message = 'message' in error ? (error as RequestError).message : undefined
    if (status === 401) {
      return options?.unauthenticated || '未登录，请先登录'
    }
    if (status === 403) {
      return options?.forbidden || '无权限执行当前操作'
    }
    if (message) {
      return message
    }
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}

const isCorsError = (error: unknown) =>
  error instanceof TypeError && /fetch|network/i.test(error.message)

const formatDate = (value?: string) => {
  if (!value) return '--'
  return value.split('T')[0]
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-4 border-b border-white/6 py-3 last:border-b-0 last:pb-0">
    <span className="text-xs text-slate-500">{label}</span>
    <span className="text-sm font-medium text-slate-200">{value}</span>
  </div>
)

const ProfilePage = () => {
  const [form] = Form.useForm()
  const { data: currentUser } = useCurrentUser()
  const { updateMyProfile } = useAuthActions()
  const queryClient = useQueryClient()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const progressTimerRef = useRef<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [avatarModalOpen, setAvatarModalOpen] = useState(false)
  const avatarModalCardRef = useRef<HTMLDivElement | null>(null)
  const avatarModalAnimatingRef = useRef(false)

  const avatarUrl = useMemo(() => currentUser?.userAvatar || undefined, [currentUser?.userAvatar])
  const userLabel = useMemo(
    () => currentUser?.userName || currentUser?.userAccount || '用户',
    [currentUser?.userAccount, currentUser?.userName],
  )
  const roleLabel = useMemo(() => {
    if (!currentUser?.userRole) return '用户'
    if (currentUser.userRole === 'admin') return 'Administrator'
    if (currentUser.userRole === 'ban') return 'Suspended'
    return currentUser.userRole
  }, [currentUser?.userRole])
  const profileStrength = useMemo(() => {
    const points = [
      currentUser?.userName,
      currentUser?.userProfile,
      currentUser?.userAvatar,
      currentUser?.userAccount,
    ].filter(Boolean).length
    return Math.min(100, Math.round((points / 4) * 100))
  }, [currentUser?.userAccount, currentUser?.userAvatar, currentUser?.userName, currentUser?.userProfile])

  const startProgress = useCallback(() => {
    setUploadProgress(12)
    progressTimerRef.current = window.setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null) return prev
        if (prev >= 90) return prev
        return Math.min(prev + Math.floor(Math.random() * 8 + 4), 90)
      })
    }, 400)
  }, [])

  const stopProgress = useCallback(() => {
    if (progressTimerRef.current !== null) {
      window.clearInterval(progressTimerRef.current)
      progressTimerRef.current = null
    }
    setUploadProgress(100)
    window.setTimeout(() => setUploadProgress(null), 600)
  }, [])

  const resetSelection = useCallback(() => {
    setSelectedFile(null)
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const openAvatarModal = useCallback(() => {
    setAvatarModalOpen(true)
  }, [])

  const closeAvatarModal = useCallback(async () => {
    if (avatarModalAnimatingRef.current) return
    const modalCard = avatarModalCardRef.current
    if (!avatarModalOpen || !modalCard) {
      setAvatarModalOpen(false)
      return
    }

    avatarModalAnimatingRef.current = true
    try {
      await animate(modalCard, {
        opacity: [1, 0],
        y: [0, 20],
        scale: [1, 0.96],
        duration: 180,
        ease: 'outQuad',
      })
    } finally {
      avatarModalAnimatingRef.current = false
      setAvatarModalOpen(false)
    }
  }, [avatarModalOpen])

  const requestJson = useCallback(
    async <T,>(path: string, body: unknown) => {
      const response = await fetch(`${apiBaseUrl}${path}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body ?? {}),
      })
      let payload: BaseResponse<T> | undefined
      try {
        payload = (await response.json()) as BaseResponse<T>
      } catch {
        payload = undefined
      }

      if (!response.ok) {
        throw {
          status: response.status,
          message: payload?.message || response.statusText || '请求失败',
          code: payload?.code,
        } as RequestError
      }

      if (payload?.code && payload.code !== 0) {
        throw {
          status: response.status,
          message: payload.message || '请求失败',
          code: payload.code,
        } as RequestError
      }

      return payload?.data as T
    },
    [apiBaseUrl],
  )

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return
      if (file.size > MAX_AVATAR_BYTES) {
        antdMessage.error('头像文件不能超过 2MB')
        event.target.value = ''
        return
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    },
    [previewUrl],
  )

  const handleUpload = useCallback(async () => {
    if (!selectedFile) {
      antdMessage.warning('请先选择头像图片')
      return
    }
    if (selectedFile.size > MAX_AVATAR_BYTES) {
      antdMessage.error('头像文件不能超过 2MB')
      return
    }
    setIsUploading(true)
    startProgress()
    try {
      const token = await requestJson<AvatarUploadTokenResponse>('/user/avatar/upload-token', {
        fileName: selectedFile.name,
      })

      if (!token?.uploadUrl || !token?.objectKey || !token?.formFields) {
        throw new Error('上传凭证不完整，请稍后重试')
      }

      const formData = new FormData()
      Object.entries(token.formFields).forEach(([key, value]) => {
        formData.append(key, value)
      })
      formData.append('file', selectedFile)

      let uploadHadCorsIssue = false
      try {
        const uploadResponse = await fetch(token.uploadUrl, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        })

        if (!uploadResponse.ok) {
          throw new Error(`OSS 上传失败 (${uploadResponse.status})`)
        }
      } catch (error) {
        if (isCorsError(error)) {
          uploadHadCorsIssue = true
        } else {
          throw error
        }
      }

      if (uploadHadCorsIssue) {
        antdMessage.error('跨域失败，请检查 OSS 配置 CORS 允许当前域名')
      }

      await requestJson('/user/avatar', {
        avatarKey: token.objectKey,
      })

      await queryClient.refetchQueries({ queryKey: ['current-user'] })
      antdMessage.success('头像已更新')
      await closeAvatarModal()
      resetSelection()
    } catch (error) {
      const message = getApiErrorMessage(error, '头像上传失败', {
        unauthenticated: '未登录，请先登录后再上传头像',
        forbidden: '更新越权，当前账号无权限更新头像',
      })
      antdMessage.error(message)
    } finally {
      stopProgress()
      setIsUploading(false)
    }
  }, [closeAvatarModal, queryClient, requestJson, resetSelection, selectedFile, startProgress, stopProgress])

  useEffect(() => {
    if (!currentUser) return
    form.setFieldsValue({
      userName: currentUser.userName,
      userProfile: currentUser.userProfile,
    })
  }, [currentUser, form])

  useEffect(() => {
    return () => {
      if (progressTimerRef.current !== null) {
        window.clearInterval(progressTimerRef.current)
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  useEffect(() => {
    if (!avatarModalOpen) return
    const rafId = window.requestAnimationFrame(() => {
      const modalCard = avatarModalCardRef.current
      if (!modalCard) return
      animate(modalCard, {
        opacity: [0, 1],
        y: [28, 0],
        scale: [0.94, 1],
        duration: 420,
        ease: createSpring({ stiffness: 280, damping: 22 }),
      })
    })
    return () => window.cancelAnimationFrame(rafId)
  }, [avatarModalOpen])

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(68,237,38,0.18),transparent_70%)] blur-3xl" />
        <div className="absolute top-1/2 -right-48 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(68,237,38,0.12),transparent_70%)] blur-[140px]" />
        <div className="absolute -bottom-48 left-1/4 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(68,237,38,0.16),transparent_70%)] blur-[120px]" />
      </div>

      <header className="relative z-10 px-6 pt-6 lg:px-10 lg:pt-8">
        <div className="profile-hero-card">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.28em] text-primary/80">
                Profile Command Center
              </p>
              <h1 className="text-4xl font-black tracking-tight text-slate-50 lg:text-6xl">个人中心</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400 lg:text-base">
                这里集中管理头像、昵称与个人简介。页面视觉和信息层级已经重新梳理，重要状态更清晰，编辑动作也更聚焦。
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[360px]">
              <div className="profile-stat-card profile-stat-card-accent">
                <span>Profile</span>
                <strong>{profileStrength}%</strong>
                <small>资料完整度</small>
              </div>
              <div className="profile-stat-card">
                <span>Updated</span>
                <strong>{formatDate(currentUser?.updateTime)}</strong>
                <small>最近更新时间</small>
              </div>
              <div className="profile-stat-card">
                <span>Status</span>
                <strong className="text-primary">Online</strong>
                <small>当前账户状态</small>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar px-6 py-8 lg:px-10 lg:pb-10">
        <Form
          layout="vertical"
          form={form}
          onFinish={(values) => {
            updateMyProfile
              .mutateAsync(values)
              .then(() => antdMessage.success('资料已更新'))
              .catch((err) => antdMessage.error(err.message || '更新失败'))
          }}
        >
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 xl:grid-cols-[360px_minmax(0,1fr)]">
            <div className="space-y-6">
              <section className="profile-panel overflow-hidden">
                <div className="profile-avatar-stage">
                  <div className="profile-avatar-halo" />
                  <button
                    type="button"
                    className="profile-avatar-button group"
                    onClick={openAvatarModal}
                    aria-haspopup="dialog"
                    aria-expanded={avatarModalOpen}
                  >
                    {previewUrl ?? avatarUrl ? (
                      <img
                        alt="用户头像"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        src={previewUrl ?? avatarUrl}
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-4xl font-black text-slate-200">
                        {userLabel.slice(0, 1)}
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/25 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <span className="material-symbols-outlined text-4xl text-primary">photo_camera</span>
                    </div>
                  </button>
                  <div className="profile-avatar-badge">
                    <span className="material-symbols-outlined text-sm">verified_user</span>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <div className="text-2xl font-black tracking-tight text-slate-50">{userLabel}</div>
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary/80">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {roleLabel}
                  </div>
                  <p className="mx-auto mt-4 max-w-[280px] text-sm leading-7 text-slate-400">
                    {currentUser?.userProfile || '还没有填写个人简介，可以补充你的专长、偏好或当前职责。'}
                  </p>
                </div>

                <div className="mt-6 grid gap-3">
                  <button type="button" className="profile-primary-button" onClick={openAvatarModal}>
                    更换头像
                  </button>
                  <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      <span>资料完成度</span>
                      <span className="text-primary">{profileStrength}%</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/8">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,rgba(68,237,38,0.95),rgba(190,242,100,0.75))] transition-all duration-500"
                        style={{ width: `${profileStrength}%` }}
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="profile-panel">
                <div className="profile-section-kicker">Account Snapshot</div>
                <h3 className="mt-3 text-lg font-bold text-slate-100">账户快照</h3>
                <div className="mt-4">
                  <InfoRow label="创建时间" value={formatDate(currentUser?.createTime)} />
                  <InfoRow label="更新时间" value={formatDate(currentUser?.updateTime)} />
                  <InfoRow label="登录账号" value={currentUser?.userAccount || '--'} />
                  <InfoRow label="用户编号" value={currentUser?.id ? `UID-${currentUser.id}` : '--'} />
                </div>
              </section>

              {previewUrl ? (
                <section className="profile-panel">
                  <div className="flex items-center gap-4">
                    <Avatar size={58} src={previewUrl} />
                    <div>
                      <div className="text-sm font-bold text-slate-100">本地预览已准备好</div>
                      <p className="mt-1 text-xs leading-6 text-slate-400">上传后将替换当前头像，你可以先打开弹窗再次确认。</p>
                    </div>
                  </div>
                </section>
              ) : null}

              {uploadProgress !== null ? (
                <section className="profile-panel">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-100">头像上传中</span>
                    <span className="text-xs font-mono text-primary">{uploadProgress}%</span>
                  </div>
                  <Progress percent={uploadProgress} status="active" showInfo={false} strokeColor="#44ed26" />
                </section>
              ) : null}
            </div>

            <div className="space-y-6">
              <section className="profile-panel">
                <div className="flex flex-col gap-4 border-b border-white/6 pb-5 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <div className="profile-section-kicker">Identity Layer</div>
                    <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-50">基础信息</h2>
                    <p className="mt-2 text-sm leading-7 text-slate-400">管理系统识别信息与个人展示信息，重点字段做了更清晰的分组。</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => form.submit()}
                    disabled={updateMyProfile.isPending}
                    className="profile-primary-button lg:min-w-[168px]"
                  >
                    {updateMyProfile.isPending ? '保存中...' : '保存修改'}
                  </button>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="profile-inline-card">
                    <span className="profile-field-label">用户 ID</span>
                    <div className="mt-3 font-mono text-sm text-slate-200">{currentUser?.id ? `UID-${currentUser.id}` : '--'}</div>
                  </div>
                  <div className="profile-inline-card">
                    <span className="profile-field-label">账号</span>
                    <div className="mt-3 text-sm font-semibold text-slate-200">{currentUser?.userAccount || '--'}</div>
                  </div>
                </div>

                <div className="mt-4 profile-inline-card">
                  <span className="profile-field-label">角色权限</span>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="material-symbols-outlined text-base text-primary">shield_person</span>
                    <span className="text-sm font-bold uppercase tracking-[0.16em] text-slate-100">{roleLabel}</span>
                  </div>
                </div>
              </section>

              <section className="profile-panel">
                <div className="profile-section-kicker">Editable Layer</div>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-50">展示信息</h2>
                <p className="mt-2 text-sm leading-7 text-slate-400">这里是别人最容易感知到的部分，建议昵称简洁清晰，简介表达你的身份与方向。</p>

                <div className="mt-8 space-y-6">
                  <Form.Item label={<span className="profile-field-label">昵称</span>} name="userName" className="mb-0">
                    <Input placeholder="你的显示名称" className="profile-input" />
                  </Form.Item>
                  <Form.Item label={<span className="profile-field-label">个人简介</span>} name="userProfile" className="mb-0">
                    <Input.TextArea
                      rows={6}
                      placeholder="介绍一下自己，比如你的职责、擅长方向和想让别人快速了解的内容"
                      className="profile-input profile-textarea"
                    />
                  </Form.Item>
                </div>

                <div className="mt-6 rounded-[24px] border border-primary/10 bg-primary/[0.05] p-4 text-sm leading-7 text-slate-400">
                  资料修改不会影响登录态。头像、昵称和简介保存后会同步到当前会话以及后续展示页面。
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-3">
                <div className="profile-subtle-tile">
                  <span>Secure</span>
                  <strong>已启用</strong>
                  <small>安全连接保护中</small>
                </div>
                <div className="profile-subtle-tile">
                  <span>Sync</span>
                  <strong>即时同步</strong>
                  <small>修改会快速反映到会话</small>
                </div>
                <div className="profile-subtle-tile">
                  <span>Session</span>
                  <strong>Active</strong>
                  <small>当前账户在线</small>
                </div>
              </section>
            </div>
          </div>
          <button type="submit" className="hidden" aria-hidden="true" />
        </Form>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <Modal
        open={avatarModalOpen}
        onCancel={closeAvatarModal}
        footer={null}
        centered
        destroyOnHidden
        maskClosable={!isUploading}
        className="profile-modal"
        styles={{
          mask: {
            backdropFilter: 'blur(14px)',
            background: 'rgba(2, 6, 23, 0.72)',
          },
          content: {
            background: 'transparent',
            boxShadow: 'none',
            padding: 0,
          },
          header: {
            display: 'none',
          },
          body: {
            background: 'transparent',
            padding: 0,
          },
        }}
        modalRender={(node) => (
          <div ref={avatarModalCardRef} className="profile-modal-shell">
            {node}
          </div>
        )}
      >
        <div className="profile-modal-content text-slate-100">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="profile-section-kicker">Avatar Studio</div>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-50">头像管理</h3>
              <p className="mt-2 text-sm leading-7 text-slate-400">支持 JPG、PNG、GIF，上传后会立即更新到你的个人资料和导航头像。</p>
            </div>
            <button
              type="button"
              onClick={() => void closeAvatarModal()}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
              aria-label="关闭头像弹窗"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[188px_minmax(0,1fr)]">
            <div className="profile-modal-preview">
              <div className="profile-modal-preview-ring">
                <Avatar size={136} src={previewUrl ?? avatarUrl} className="!h-[136px] !w-[136px]" />
              </div>
              <div className="mt-4 text-center">
                <div className="text-base font-bold text-slate-100">{userLabel}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">{roleLabel}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="profile-mini-chip">建议使用正方形图片</div>
                  <div className="profile-mini-chip">文件大小不超过 2MB</div>
                  <div className="profile-mini-chip">上传后立即同步</div>
                </div>

                {previewUrl ? (
                  <div className="mt-4 rounded-[22px] border border-primary/14 bg-primary/[0.06] p-4">
                    <p className="text-sm text-slate-200">本地预览已准备完成，确认上传后将替换当前头像。</p>
                  </div>
                ) : null}

                {uploadProgress !== null ? (
                  <div className="mt-4 rounded-[22px] border border-white/8 bg-slate-950/40 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-100">上传进度</span>
                      <span className="text-xs font-mono text-primary">{uploadProgress}%</span>
                    </div>
                    <Progress percent={uploadProgress} status="active" showInfo={false} strokeColor="#44ed26" />
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                className="profile-select-button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                选择图片
              </button>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className="profile-primary-button"
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                >
                  {isUploading ? '上传中...' : '上传头像'}
                </button>
                <button
                  type="button"
                  className="profile-secondary-button"
                  onClick={selectedFile ? resetSelection : () => void closeAvatarModal()}
                  disabled={isUploading}
                >
                  {selectedFile ? '清除选择' : '稍后再说'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <div className="relative z-10 mt-auto border-t border-white/6 bg-slate-950/20 px-6 py-4 text-[10px] font-mono uppercase tracking-[0.3em] text-primary/40">
        <div className="flex flex-wrap justify-center gap-8">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" /> Secure Connection
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" /> End-to-end Encrypted
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" /> Session: Active
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
