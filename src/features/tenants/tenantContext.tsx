import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { Service } from '@/api'
import type { BaseResponseBoolean, BaseResponseListTenantVO, TenantVO } from '@/api'
import { useCurrentUser } from '@/features/auth/useCurrentUser'

const STORAGE_KEY = 'jc-active-tenant-id'

const readActiveTenantId = () => {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : null
}

const writeActiveTenantId = (tenantId: number) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, String(tenantId))
}

const unwrapTenants = (response: BaseResponseListTenantVO) => {
  if (response?.code && response.code !== 0) {
    throw new Error(response.message || '获取团队列表失败')
  }
  return response?.data ?? []
}

const unwrapBoolean = (response: BaseResponseBoolean) => {
  if (response?.code && response.code !== 0) {
    throw new Error(response.message || '操作失败')
  }
  return response?.data ?? false
}

type TenantContextValue = {
  tenants: TenantVO[]
  activeTenantId: number | null
  activeTenant?: TenantVO
  isLoading: boolean
  error?: Error | null
  isActivating: boolean
  isActiveReady: boolean
  activeTenantError?: string | null
  setActiveTenant: (tenantId: number) => Promise<void>
  refresh: () => void
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined)

export const TenantProvider = ({ children }: PropsWithChildren) => {
  const queryClient = useQueryClient()
  const { data: currentUser } = useCurrentUser()
  const [activeTenantId, setActiveTenantId] = useState<number | null>(() => readActiveTenantId())
  const [isActivating, setIsActivating] = useState(false)
  const [isActiveReady, setIsActiveReady] = useState(false)
  const [activeTenantError, setActiveTenantError] = useState<string | null>(null)
  const [lastSyncedTenantId, setLastSyncedTenantId] = useState<number | null>(null)
  const autoSyncAttemptedRef = useRef(new Set<number>())

  const {
    data: tenants,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => Service.listMyTenants().then(unwrapTenants),
    retry: false,
    enabled: Boolean(currentUser),
  })

  const setActiveMutation = useMutation({
    mutationFn: (tenantId: number) =>
      Service.setActiveTenant({ requestBody: { tenantId } }).then(unwrapBoolean),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })

  const activeTenant = useMemo(
    () => tenants?.find((tenant) => tenant.id === activeTenantId),
    [activeTenantId, tenants],
  )

  const setActiveTenant = useCallback(
    async (tenantId: number) => {
      const previous = activeTenantId
      const canRevert =
        previous !== null &&
        previous !== tenantId &&
        (tenants?.some((tenant) => tenant.id === previous) ?? false)
      setIsActivating(true)
      setActiveTenantError(null)
      setActiveTenantId(tenantId)
      try {
        await setActiveMutation.mutateAsync(tenantId)
        writeActiveTenantId(tenantId)
        setIsActiveReady(true)
        setLastSyncedTenantId(tenantId)
      } catch (err) {
        setIsActiveReady(false)
        setLastSyncedTenantId(null)
        if (canRevert) {
          setActiveTenantId(previous)
          writeActiveTenantId(previous)
        } else {
          setActiveTenantId(null)
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem(STORAGE_KEY)
          }
        }
        setActiveTenantError((err as Error)?.message || '切换团队失败')
        throw err
      } finally {
        setIsActivating(false)
      }
    },
    [activeTenantId, setActiveMutation, tenants],
  )

  useEffect(() => {
    autoSyncAttemptedRef.current.clear()
  }, [tenants])

  useEffect(() => {
    if (!currentUser) return
    if (!tenants || tenants.length === 0) return
    if (isActivating) return
    const personal = tenants.find((tenant) => tenant.tenantType === 'personal')
    const activeIdValid = activeTenantId !== null && tenants.some((tenant) => tenant.id === activeTenantId)
    const desiredId = activeIdValid ? activeTenantId : personal?.id ?? tenants[0].id
    if (desiredId === null || desiredId === undefined) return
    if (isActiveReady && lastSyncedTenantId === desiredId) return
    if (autoSyncAttemptedRef.current.has(desiredId)) return
    autoSyncAttemptedRef.current.add(desiredId)
    setActiveTenant(desiredId).catch(() => undefined)
  }, [activeTenantId, currentUser, isActivating, isActiveReady, lastSyncedTenantId, setActiveTenant, tenants])

  const value = useMemo(
    () => ({
      tenants: tenants ?? [],
      activeTenantId,
      activeTenant,
      isLoading,
      error: error as Error | null,
      isActivating,
      isActiveReady,
      activeTenantError,
      setActiveTenant,
      refresh: () => refetch(),
    }),
    [
      activeTenant,
      activeTenantError,
      activeTenantId,
      error,
      isActiveReady,
      isActivating,
      isLoading,
      refetch,
      setActiveTenant,
      tenants,
    ],
  )

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
}

export const useTenantContext = () => {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error('useTenantContext must be used within TenantProvider')
  }
  return context
}
