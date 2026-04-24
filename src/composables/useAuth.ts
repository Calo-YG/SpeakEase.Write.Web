import { ref, computed } from 'vue'
import {
  authApi,
  setTokens,
  clearTokens,
  getAccessToken,
  type LoginRequest,
  type RegisterRequest,
  type TokenResponse,
  type ApiResult,
} from '@/lib/api'

// ApiResult 中 succeeded/successed 兼容
type AuthResult = ApiResult<TokenResponse> & { successed?: boolean }

const isAuthenticated = ref(!!getAccessToken())
const isLoading = ref(false)
const error = ref<string | null>(null)

function handleTokenResponse(data: TokenResponse) {
  setTokens(data.accessToken, data.refreshToken)
  isAuthenticated.value = true
  error.value = null
}

async function login(req: LoginRequest): Promise<boolean> {
  isLoading.value = true
  error.value = null
  try {
    const result: AuthResult = await authApi.login(req)
    if ((result.succeeded ?? result.successed) && result.data) {
      handleTokenResponse(result.data)
      return true
    }
    error.value = result.message || '登录失败'
    return false
  } catch (err) {
    error.value = err instanceof Error ? err.message : '登录失败'
    return false
  } finally {
    isLoading.value = false
  }
}

async function register(req: RegisterRequest): Promise<boolean> {
  isLoading.value = true
  error.value = null
  try {
    const result: AuthResult = await authApi.register(req)
    if ((result.succeeded ?? result.successed) && result.data) {
      handleTokenResponse(result.data)
      return true
    }
    error.value = result.message || '注册失败'
    return false
  } catch (err) {
    error.value = err instanceof Error ? err.message : '注册失败'
    return false
  } finally {
    isLoading.value = false
  }
}

function logout() {
  clearTokens()
  isAuthenticated.value = false
}

function clearError() {
  error.value = null
}

/** 全局单例 composable */
export function useAuth() {
  return {
    isAuthenticated: computed(() => isAuthenticated.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    login,
    register,
    logout,
    clearError,
  }
}
