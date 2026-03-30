import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { http } from '@/services/http'

type BaseResponse<T> = {
  code?: number
  data?: T
  message?: string
}

const unwrap = <T>(response: BaseResponse<T>, fallback: string): T => {
  if (response?.code && response.code !== 0) {
    throw new Error(response.message || fallback)
  }
  return response?.data as T
}

export type AiModelAdminVO = {
  id: number
  provider: string
  modelId: string
  modelName: string
  displayName: string
  baseUrl?: string
  apiKeyMasked?: string
  maxTokens?: number
  temperature?: number
  description?: string
  iconUrl?: string
  enabled: boolean
  sortOrder: number
}

export type AiModelConfigRequest = {
  provider: string
  modelId: string
  modelName: string
  displayName: string
  baseUrl?: string
  apiKeyPlain?: string
  maxTokens?: number
  temperature?: number
  description?: string
  iconUrl?: string
  enabled?: boolean
  sortOrder?: number
}

// ── queries ──────────────────────────────────────────────────────────────────

export const useAdminModels = () =>
  useQuery({
    queryKey: ['admin-models'],
    queryFn: () =>
      http.get('/ai/admin/models').then((res) => {
        const data = res.data
        if (Array.isArray(data)) return data as AiModelAdminVO[]
        return unwrap<AiModelAdminVO[]>(data, '获取模型列表失败') ?? []
      }),
    placeholderData: (prev) => prev,
  })

// ── mutations ─────────────────────────────────────────────────────────────────

export const useAdminModelActions = () => {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-models'] })

  const createModel = useMutation({
    mutationFn: (payload: AiModelConfigRequest) =>
      http.post('/ai/admin/models', payload).then((res) => {
        const d = res.data
        if (Array.isArray(d)) return d
        return unwrap(d, '创建模型失败')
      }),
    onSuccess: invalidate,
  })

  const updateModel = useMutation({
    mutationFn: ({ id, ...payload }: AiModelConfigRequest & { id: number }) =>
      http.put(`/ai/admin/models/${id}`, payload).then((res) => {
        const d = res.data
        if (Array.isArray(d)) return d
        return unwrap(d, '更新模型失败')
      }),
    onSuccess: invalidate,
  })

  const toggleModel = useMutation({
    mutationFn: (id: number) =>
      http.patch(`/ai/admin/models/${id}/toggle`).then((res) => {
        const d = res.data
        if (typeof d === 'object' && d !== null && !Array.isArray(d) && 'code' in d) {
          return unwrap<boolean>(d, '切换状态失败')
        }
        return d as boolean
      }),
    onSuccess: invalidate,
  })

  const deleteModel = useMutation({
    mutationFn: (id: number) =>
      http.delete(`/ai/admin/models/${id}`).then((res) => {
        const d = res.data
        if (typeof d === 'object' && d !== null && !Array.isArray(d) && 'code' in d) {
          return unwrap<boolean>(d, '删除模型失败')
        }
        return d as boolean
      }),
    onSuccess: invalidate,
  })

  return { createModel, updateModel, toggleModel, deleteModel }
}
