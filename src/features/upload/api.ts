import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UploadRequestOption as RcUploadRequestOption } from 'rc-upload/lib/interface'

import { AgentService, Service } from '@/api'
import type {
  BaseResponseListRagRetrievalTrace,
  BaseResponseRagRetrievalTrace,
  RagRetrievalTrace,
  StudyFriendDocument,
} from '@/api'

const statusMap: Record<Exclude<StudyFriendDocument['status'], undefined>, 'ready' | 'processing' | 'error' | 'waiting'> = {
  INDEXED: 'ready',
  INDEXING: 'processing',
  FAILED: 'error',
  UPLOADED: 'waiting',
}

export const mapDocumentStatus = (status?: StudyFriendDocument['status']) =>
  status ? statusMap[status] ?? 'waiting' : 'waiting'

export const normalizeDocuments = (payload: unknown): StudyFriendDocument[] => {
  if (Array.isArray(payload)) return payload
  if (payload && typeof payload === 'object' && Array.isArray((payload as any).data)) {
    return (payload as any).data
  }
  return []
}

const uploadFile = (file: Blob) =>
  Service.uploadDocument({
    formData: { file },
  })

const unwrapDocument = (response: StudyFriendDocument) => response

const unwrapRagTraceList = (response: BaseResponseListRagRetrievalTrace) => {
  if (response?.code && response.code !== 0) {
    throw new Error(response.message || '获取 RAG 检索轨迹失败')
  }
  return response?.data ?? []
}

const unwrapRagTrace = (response: BaseResponseRagRetrievalTrace) => {
  if (response?.code && response.code !== 0) {
    throw new Error(response.message || '获取 RAG 检索详情失败')
  }
  if (!response?.data) {
    throw new Error('轨迹不存在或已过期')
  }
  return response.data
}

export const useDocumentActions = () => {
  const queryClient = useQueryClient()

  const deleteDocument = useMutation({
    mutationFn: (documentId: number) => Service.deleteDocument({ documentId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  })

  const reindexDocument = useMutation({
    mutationFn: (documentId: number) => Service.reindexDocument({ documentId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  })

  return { deleteDocument, reindexDocument }
}

export const useDocuments = (enabled = true) =>
  useQuery({
    queryKey: ['documents'],
    queryFn: () => Service.listDocuments(),
    enabled,
    retry: false,
  })

export const useDocumentDetail = (documentId?: number, enabled = true) =>
  useQuery({
    queryKey: ['document-detail', documentId],
    queryFn: () => Service.getDocument({ documentId: documentId || 0 }).then(unwrapDocument),
    enabled: enabled && Boolean(documentId),
    retry: false,
  })

export const useLatestRagTraces = (enabled = true, limit = 100) =>
  useQuery({
    queryKey: ['rag-traces', limit],
    queryFn: () => AgentService.getLatestRagTraces({ limit }).then(unwrapRagTraceList),
    enabled,
    retry: false,
  })

export const useRagTraceDetail = (traceId?: string, enabled = true) =>
  useQuery({
    queryKey: ['rag-trace-detail', traceId],
    queryFn: () => AgentService.getRagTraceById({ traceId: traceId || '' }).then(unwrapRagTrace),
    enabled: enabled && Boolean(traceId),
    retry: false,
  })

export const documentMatchesTrace = (trace: RagRetrievalTrace, documentId?: number) => {
  if (!documentId) return false
  const target = String(documentId)
  return [trace.vectorDocs ?? [], trace.esDocs ?? [], trace.mergedDocs ?? []].some((docs) =>
    docs.some((doc) => doc.documentId === target),
  )
}

export const useUpload = () => {
  const queryClient = useQueryClient()

  const uploadMutation = useMutation({
    mutationFn: (file: Blob) => uploadFile(file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  })

  const customRequest = async (options: RcUploadRequestOption) => {
    const { file, onProgress, onError, onSuccess } = options
    try {
      const result = await uploadMutation.mutateAsync(file as Blob, {
        onSuccess: () => onProgress?.({ percent: 100 }),
      })
      onSuccess?.(result, new Blob([JSON.stringify(result)]))
    } catch (err) {
      onError?.(err as Error)
    }
  }

  return { customRequest, uploadMutation, statusMap }
}
