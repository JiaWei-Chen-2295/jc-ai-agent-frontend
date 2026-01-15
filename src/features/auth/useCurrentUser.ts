import { useQuery } from '@tanstack/react-query'

import { Service } from '@/api'
import type { BaseResponseUserVO } from '@/api'

const unwrapUser = (response: BaseResponseUserVO) => {
  if (response?.code && response.code !== 0) {
    throw new Error(response.message || '获取用户信息失败')
  }
  return response?.data
}

export const useCurrentUser = () =>
  useQuery({
    queryKey: ['current-user'],
    queryFn: () => Service.getCurrentUser().then(unwrapUser),
    retry: false,
  })
