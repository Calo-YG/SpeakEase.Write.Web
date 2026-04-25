// ============================================================
// Token 管理 + 通用 fetch 客户端
// ============================================================

import type { ApiResult } from './types'

// ==================== Token 管理 ====================

const TOKEN_KEY = 'speakease_access_token'
const REFRESH_KEY = 'speakease_refresh_token'

export interface TokenResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
}

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem(TOKEN_KEY, access)
  localStorage.setItem(REFRESH_KEY, refresh)
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

// ==================== fetch 客户端 ====================

let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null

export async function refreshAccessToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise
  const token = getRefreshToken()
  if (!token) return false

  isRefreshing = true
  refreshPromise = (async () => {
    try {
      const res = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: token }),
      })
      if (!res.ok) return false
      const json: ApiResult<TokenResponse> = await res.json()
      if ((json.succeeded ?? json.successed) && json.data) {
        setTokens(json.data.accessToken, json.data.refreshToken)
        return true
      }
      return false
    } catch {
      return false
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })()
  return refreshPromise
}

/** 通用 fetch 封装，自动注入 Bearer Token + 401 刷新 */
export async function apiClient<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAccessToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  let res = await fetch(url, { ...options, headers })

  if (res.status === 401) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      headers['Authorization'] = `Bearer ${getAccessToken()}`
      res = await fetch(url, { ...options, headers })
    } else {
      clearTokens()
      window.location.reload()
      throw new Error('认证已过期，请重新登录')
    }
  }

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API 错误 (${res.status}): ${text}`)
  }

  return res.json() as Promise<T>
}
