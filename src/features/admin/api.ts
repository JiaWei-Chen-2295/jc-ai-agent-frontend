import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { Service } from '@/api'
import type {
  BaseResponseBoolean,
  BaseResponseLong,
  BaseResponsePageUserVO,
  DeleteRequest,
  UserCreateRequest,
  UserQueryRequest,
  UserUpdateRequest,
} from '@/api'

const unwrapBoolean = (response: BaseResponseBoolean) => {
  if (response?.code && response.code !== 0) {
    throw new Error(response.message || '操作失败')
  }
  return response?.data ?? false
}

const unwrapLong = (response: BaseResponseLong) => {
  if (response?.code && response.code !== 0) {
    throw new Error(response.message || '操作失败')
  }
  return response?.data
}

const unwrapPage = (response: BaseResponsePageUserVO) => {
  if (response?.code && response.code !== 0) {
    throw new Error(response.message || '获取用户列表失败')
  }
  return response?.data
}

export const useAdminUsers = (query: UserQueryRequest) =>
  useQuery({
    queryKey: ['admin-users', query],
    queryFn: () => Service.listUserByPage({ requestBody: query }).then(unwrapPage),
    placeholderData: (prev) => prev,
  })

export const useAdminUserActions = () => {
  const queryClient = useQueryClient()

  const addUser = useMutation({
    mutationFn: (payload: UserCreateRequest) => Service.addUser({ requestBody: payload }).then(unwrapLong),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const updateUser = useMutation({
    mutationFn: (payload: UserUpdateRequest) => Service.updateUser({ requestBody: payload }).then(unwrapBoolean),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const deleteUser = useMutation({
    mutationFn: (payload: DeleteRequest) => Service.deleteUser({ requestBody: payload }).then(unwrapBoolean),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  return { addUser, updateUser, deleteUser }
}
