import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UploadRequestOption as RcUploadRequestOption } from 'rc-upload/lib/interface'

import { Service } from '@/api'
import type { StudyFriendDocument } from '@/api'

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
