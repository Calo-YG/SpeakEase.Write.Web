// ============================================================
// 认证模块
// ============================================================

import { apiClient } from './client'
import type { ApiResult } from './types'
import type { TokenResponse } from './client'

export interface LoginRequest {
  account: string
  password: string
}

export interface RegisterRequest {
  account: string
  email: string
  nickName: string
  password: string
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export const authApi = {
  login: (req: LoginRequest) =>
    apiClient<ApiResult<TokenResponse>>('/api/auth/login', { method: 'POST', body: JSON.stringify(req) }),
  register: (req: RegisterRequest) =>
    apiClient<ApiResult<TokenResponse>>('/api/auth/register', { method: 'POST', body: JSON.stringify(req) }),
  refreshToken: (req: RefreshTokenRequest) =>
    apiClient<ApiResult<TokenResponse>>('/api/auth/refresh-token', { method: 'POST', body: JSON.stringify(req) }),
}
