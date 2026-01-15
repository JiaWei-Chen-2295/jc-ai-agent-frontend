import { useMutation, useQueryClient } from '@tanstack/react-query'

import { Service } from '@/api'
import type {
  BaseResponseBoolean,
  BaseResponseLong,
  BaseResponseUserVO,
  UserLoginRequest,
  UserRegisterRequest,
  UserUpdateMyRequest,
} from '@/api'

const unwrapUser = (response: BaseResponseUserVO) => {
  if (response?.code && response.code !== 0) {
    throw new Error(response.message || '登录失败')
  }
  return response?.data
}

const unwrapBoolean = (response: BaseResponseBoolean) => {
  if (response?.code && response.code !== 0) {
    throw new Error(response.message || '操作失败')
  }
  return response?.data ?? false
}

const unwrapLong = (response: BaseResponseLong) => {
  if (response?.code && response.code !== 0) {
    throw new Error(response.message || '注册失败')
  }
  return response?.data
}

export const useAuthActions = () => {
  const queryClient = useQueryClient()

  const login = useMutation({
    mutationFn: (payload: UserLoginRequest) => Service.userLogin({ requestBody: payload }).then(unwrapUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
    },
  })

  const register = useMutation({
    mutationFn: (payload: UserRegisterRequest) => Service.userRegister({ requestBody: payload }).then(unwrapLong),
  })

  const logout = useMutation({
    mutationFn: () => Service.userLogout().then(unwrapBoolean),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('jc-active-tenant-id')
      }
    },
  })

  const updateMyProfile = useMutation({
    mutationFn: (payload: UserUpdateMyRequest) => Service.updateMyUser({ requestBody: payload }).then(unwrapUser),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['current-user'] }),
  })

  return { login, register, logout, updateMyProfile }
}
