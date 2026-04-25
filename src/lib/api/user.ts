// ============================================================
// 用户模块
// ============================================================

import { apiClient } from './client'
import type { ApiResult } from './types'

export interface UserProfile {
  id: string
  account: string
  nickName: string
  email: string
  role: string
  isActive: boolean
}

export interface UpdateProfileRequest {
  nickName?: string
  email?: string
}

export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

export const userApi = {
  getProfile: () =>
    apiClient<ApiResult<UserProfile>>('/api/user/profile'),
  updateProfile: (req: UpdateProfileRequest) =>
    apiClient<ApiResult<UserProfile>>('/api/user/profile', { method: 'PUT', body: JSON.stringify(req) }),
  changePassword: (req: ChangePasswordRequest) =>
    apiClient<ApiResult<null>>('/api/user/password', { method: 'PUT', body: JSON.stringify(req) }),
}
