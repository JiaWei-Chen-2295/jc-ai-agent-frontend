import { useMutation, useQueryClient } from '@tanstack/react-query'

import { Service } from '@/api'
import type {
  BaseResponseBoolean,
  BaseResponseTenantVO,
  TenantCreateRequest,
  TenantJoinRequest,
  TenantLeaveRequest,
  TenantTransferAdminRequest,
} from '@/api'

const unwrapBoolean = (response: BaseResponseBoolean) => {
  if (response?.code && response.code !== 0) {
    throw new Error(response.message || '操作失败')
  }
  return response?.data ?? false
}

const unwrapTenant = (response: BaseResponseTenantVO) => {
  if (response?.code && response.code !== 0) {
    throw new Error(response.message || '操作失败')
  }
  return response?.data
}

export const useTenantActions = () => {
  const queryClient = useQueryClient()

  const createTeam = useMutation({
    mutationFn: (payload: TenantCreateRequest) => Service.createTeam({ requestBody: payload }).then(unwrapTenant),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenants'] }),
  })

  const joinTeam = useMutation({
    mutationFn: (payload: TenantJoinRequest) => Service.joinTenant({ requestBody: payload }).then(unwrapBoolean),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenants'] }),
  })

  const leaveTeam = useMutation({
    mutationFn: (payload: TenantLeaveRequest) => Service.leaveTenant({ requestBody: payload }).then(unwrapBoolean),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenants'] }),
  })

  const transferAdmin = useMutation({
    mutationFn: (payload: TenantTransferAdminRequest) => Service.transferAdmin({ requestBody: payload }).then(unwrapBoolean),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenants'] }),
  })

  return { createTeam, joinTeam, leaveTeam, transferAdmin }
}
