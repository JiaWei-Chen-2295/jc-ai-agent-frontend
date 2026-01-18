import { Avatar, Form, Input, Modal, Progress, message as antdMessage } from 'antd'
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
      setAvatarModalOpen(false)
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
  }, [queryClient, requestJson, resetSelection, selectedFile, startProgress, stopProgress])

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

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(68,237,38,0.18),transparent_70%)] blur-3xl" />
        <div className="absolute top-1/2 -right-48 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(68,237,38,0.12),transparent_70%)] blur-[140px]" />
        <div className="absolute -bottom-48 left-1/4 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(68,237,38,0.16),transparent_70%)] blur-[120px]" />
      </div>

      <header className="relative z-10 border-b border-white/5 bg-slate-950/20 px-6 py-8 lg:px-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase mb-3">
              User Profile &amp; Settings
            </p>
            <h1 className="text-4xl lg:text-6xl font-black tracking-tight text-slate-100">个人中心</h1>
            <p className="text-sm text-slate-500 mt-3">更新昵称、头像与简介，修改后会同步到当前会话。</p>
          </div>
          <button
            type="button"
            onClick={() => form.submit()}
            disabled={updateMyProfile.isPending}
            className="px-8 py-3 rounded-full text-sm font-bold bg-gradient-to-r from-emerald-300 via-lime-300 to-green-400 text-slate-950 hover:scale-105 active:scale-95 transition-all shadow-[0_0_32px_rgba(163,230,53,0.35)] ring-1 ring-emerald-300/40 uppercase tracking-widest disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {updateMyProfile.isPending ? '保存中...' : '保存修改'}
          </button>
        </div>
      </header>

      <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar px-6 py-8 lg:px-12">
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
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4 flex flex-col items-center gap-8">
              <div className="relative">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20 shadow-[0_0_50px_rgba(74,222,128,0.2)]" />
                <div className="relative w-56 h-56 lg:w-64 lg:h-64 rounded-full border-4 border-primary/30 p-2">
                  <div className="relative w-full h-full">
                    <button
                      type="button"
                      className="group relative w-full h-full rounded-full border border-primary/40 overflow-hidden bg-slate-900/60"
                      onClick={() => setAvatarModalOpen(true)}
                      aria-haspopup="dialog"
                      aria-expanded={avatarModalOpen}
                    >
                      {previewUrl ?? avatarUrl ? (
                        <img
                          alt="用户头像"
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                          src={previewUrl ?? avatarUrl}
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-3xl font-black text-slate-300">
                          {userLabel.slice(0, 1)}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-primary">add_a_photo</span>
                      </div>
                    </button>

                  </div>
                </div>
                <div className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-primary text-black flex items-center justify-center border-4 border-slate-950">
                  <span className="material-symbols-outlined text-sm">verified_user</span>
                </div>
              </div>

              <div className="w-full space-y-4">
                <div className="glass-panel p-5 rounded-3xl border border-white/10">
                  <h3 className="text-[10px] font-black text-primary tracking-widest uppercase mb-4">
                    Account Statistics
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-xs text-slate-500">创建时间</span>
                      <span className="text-sm font-mono text-slate-200">
                        {formatDate(currentUser?.createTime)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-xs text-slate-500">更新时间</span>
                      <span className="text-sm font-mono text-slate-200">
                        {formatDate(currentUser?.updateTime)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">活跃状态</span>
                      <span className="flex items-center gap-2 text-[10px] text-primary/80 uppercase tracking-wider font-bold">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" /> Online
                      </span>
                    </div>
                  </div>
                </div>

                {previewUrl ? (
                  <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-3">
                    <Avatar size={52} src={previewUrl} />
                    <p className="text-xs text-slate-400">本地预览：上传后将替换当前头像</p>
                  </div>
                ) : null}

                {uploadProgress !== null ? (
                  <div className="glass-panel p-4 rounded-2xl border border-white/10">
                    <Progress percent={uploadProgress} status="active" showInfo={false} />
                  </div>
                ) : null}
              </div>
            </div>

            <div className="lg:col-span-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-primary tracking-widest uppercase ml-2">
                    用户 ID
                  </label>
                  <div className="glass-panel px-6 py-4 rounded-2xl border border-white/5 opacity-80 cursor-not-allowed">
                    <span className="font-mono text-sm text-slate-500 select-all">
                      {currentUser?.id ? `UID-${currentUser.id}` : '--'}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-primary tracking-widest uppercase ml-2">
                    账号 (Account)
                  </label>
                  <div className="glass-panel px-6 py-4 rounded-2xl border border-white/5 opacity-80 cursor-not-allowed">
                    <span className="font-display font-bold text-sm text-slate-400">
                      {currentUser?.userAccount || '--'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-primary tracking-widest uppercase ml-2">
                  角色 (Role)
                </label>
                <div className="glass-panel px-6 py-4 rounded-2xl border border-white/5 flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-sm">shield_person</span>
                  <span className="text-sm font-bold text-slate-100 uppercase tracking-widest">{roleLabel}</span>
                </div>
              </div>

              <div className="space-y-6 pt-4 border-t border-white/5">
                <Form.Item
                  label={
                    <span className="text-[10px] font-black text-primary tracking-widest uppercase ml-2">
                      昵称 (Nickname)
                    </span>
                  }
                  name="userName"
                  className="mb-0"
                >
                  <Input
                    placeholder="你的显示名称"
                    className="!rounded-2xl !border !border-primary/20 !bg-slate-900/60 !px-6 !py-3 text-slate-100 placeholder:text-slate-500 focus:!border-primary focus:!ring-1 focus:!ring-primary/30"
                  />
                </Form.Item>
                <Form.Item
                  label={
                    <span className="text-[10px] font-black text-primary tracking-widest uppercase ml-2">
                      用户简介 (Biography)
                    </span>
                  }
                  name="userProfile"
                  className="mb-0"
                >
                  <Input.TextArea
                    rows={5}
                    placeholder="介绍一下自己"
                    className="!rounded-2xl !border !border-primary/20 !bg-slate-900/60 !px-6 !py-3 text-slate-100 placeholder:text-slate-500 focus:!border-primary focus:!ring-1 focus:!ring-primary/30"
                  />
                </Form.Item>
                <p className="text-xs text-slate-500">
                  资料修改不影响登录凭证，退出登录不会清空修改内容。
                </p>
              </div>
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
        onCancel={() => setAvatarModalOpen(false)}
        footer={null}
        centered
        styles={{
          content: {
            background: 'rgba(2, 6, 23, 0.92)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 24px 70px rgba(0,0,0,0.55)',
          },
          header: {
            background: 'transparent',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: 12,
          },
          body: {
            background: 'transparent',
          },
        }}
        title={
          <span className="text-[11px] font-black text-primary tracking-[0.3em] uppercase">
            头像管理
          </span>
        }
      >
        <div className="space-y-4 text-slate-100">
          <div className="flex items-center gap-4">
            <Avatar size={72} src={previewUrl ?? avatarUrl} />
            <div className="flex flex-col">
              <p className="text-sm font-bold">{userLabel}</p>
              <p className="text-xs text-slate-400">支持 JPG/PNG/GIF，大小不超过 2MB</p>
            </div>
          </div>

          {previewUrl ? (
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3">
              <p className="text-xs text-slate-400">本地预览已就绪，上传后将替换当前头像。</p>
            </div>
          ) : null}

          {uploadProgress !== null ? (
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3">
              <Progress percent={uploadProgress} status="active" showInfo={false} />
            </div>
          ) : null}

          <div className="grid gap-2">
            <button
              type="button"
              className="w-full rounded-2xl border border-primary/40 bg-primary/15 px-4 py-3 text-sm font-bold text-primary transition hover:bg-primary/25 disabled:opacity-60"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              选择图片
            </button>
            <button
              type="button"
              className="w-full rounded-2xl bg-gradient-to-r from-emerald-300 via-lime-300 to-green-400 px-4 py-3 text-sm font-bold text-slate-950 shadow-[0_0_24px_rgba(163,230,53,0.35)] ring-1 ring-emerald-300/40 transition hover:scale-[1.01] disabled:opacity-60 disabled:hover:scale-100"
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? '上传中...' : '上传头像'}
            </button>
            {selectedFile ? (
              <button
                type="button"
                className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/5 disabled:opacity-60"
                onClick={resetSelection}
                disabled={isUploading}
              >
                清除选择
              </button>
            ) : null}
          </div>
        </div>
      </Modal>

      <div className="relative z-10 border-t border-white/5 px-6 py-4 text-[10px] font-mono text-primary/40 uppercase tracking-[0.3em] bg-slate-950/20">
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
