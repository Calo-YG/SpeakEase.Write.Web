// ============================================================
// 模型配置模块
// ============================================================

import { apiClient } from './client'
import type { ApiResult } from './types'

export interface AIModelProvider {
  id: string
  label: string
  provider: string
  apiBaseUrl: string
  apiKey: string
  description: string
  isActive: boolean
}

export interface SaveProviderRequest {
  label: string
  provider: string
  apiBaseUrl: string
  apiKey: string
  description: string
  isActive?: boolean
}

export interface UserModelConfig {
  id: string
  configName: string
  providerId: string
  providerLabel: string
  modelName: string
  fallbackProviderId: string
  fallbackProviderLabel: string
  fallbackModelName: string
  isActive: boolean
  useFallback: boolean
  preference: string
  description: string
  estimateCost: number
  contextWindow: number
  maxOutputTokens: number
  supportsStreaming: boolean
  supportsToolCall: boolean
  capabilityTags: string[]
  lastSyncedAt: string
  createAt: string
}

export interface SaveUserModelConfigRequest {
  id?: string
  configName: string
  providerId: string
  modelName: string
  fallbackProviderId?: string
  fallbackModelName?: string
  useFallback?: boolean
  preference?: string
  description?: string
  estimateCost?: number
  contextWindow?: number
  maxOutputTokens?: number
  supportsStreaming?: boolean
  supportsToolCall?: boolean
  capabilityTags?: string[]
}

export const modelApi = {
  getProviders: () =>
    apiClient<ApiResult<AIModelProvider[]>>('/api/model/providers'),
  getProvider: (id: string) =>
    apiClient<ApiResult<AIModelProvider>>(`/api/model/providers/${id}`),
  createProvider: (req: SaveProviderRequest) =>
    apiClient<ApiResult<AIModelProvider>>('/api/model/providers', { method: 'POST', body: JSON.stringify(req) }),
  updateProvider: (id: string, req: SaveProviderRequest) =>
    apiClient<ApiResult<AIModelProvider>>(`/api/model/providers/${id}`, { method: 'PUT', body: JSON.stringify(req) }),
  deleteProvider: (id: string) =>
    apiClient<ApiResult<null>>(`/api/model/providers/${id}`, { method: 'DELETE' }),
  getConfigs: () =>
    apiClient<ApiResult<UserModelConfig[]>>('/api/model/configs'),
  getActiveConfig: () =>
    apiClient<ApiResult<UserModelConfig>>('/api/model/configs/active'),
  saveConfig: (req: SaveUserModelConfigRequest) =>
    apiClient<ApiResult<UserModelConfig>>('/api/model/configs', { method: 'POST', body: JSON.stringify(req) }),
  activateConfig: (id: string) =>
    apiClient<ApiResult<null>>(`/api/model/configs/${id}/activate`, { method: 'PUT' }),
  deleteConfig: (id: string) =>
    apiClient<ApiResult<null>>(`/api/model/configs/${id}`, { method: 'DELETE' }),
}
