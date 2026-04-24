// ============================================================
// AINW 后端 API 完整类型与 fetch 客户端
// 对接: AuthRoute / UserRoute / LLMRoute / ModelRoute / LLMLogRoute
// ============================================================

// ==================== 通用类型 ====================

export interface ApiResult<T> {
  data: T
  succeeded: boolean
  successed?: boolean // 后端旧字段兼容
  message: string | null
  status: number
}

// ==================== Auth 类型 ====================

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

export interface TokenResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
}

// ==================== User 类型 ====================

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

// ==================== LLM 类型 ====================

export interface LLMChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  name?: string | null
  toolCallId?: string | null
  toolCalls?: LLMToolCall[] | null
}

export interface LLMToolCall {
  id: string
  type: string
  function: { name: string; arguments: string }
}

export interface LLMToolCallDelta {
  index: number
  id?: string | null
  type?: string | null
  name?: string | null
  arguments?: string | null
}

export interface LLMToolExecutionResult {
  toolCallId: string
  toolName: string
  success: boolean
  content: string
  errorCode: string | null
}

export interface LLMToolDefinition {
  type: string
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

export interface LLMChatRequest {
  systemPrompt?: string
  messages: LLMChatMessage[]
  temperature?: number
  maxTokens?: number | null
  useJsonMode?: boolean
  tools?: LLMToolDefinition[]
  toolChoice?: unknown
  enableAutoToolDispatch?: boolean
  maxIterations?: number
  skillName?: string
  skillOverridePrompt?: string
}

export interface LLMChatResponse {
  primaryModel: string
  finalModel: string
  model: string
  usedFallback: boolean
  fallbackModel: string | null
  content: string
  rawResponse: string
  requestId: string
  promptTokens: number | null
  completionTokens: number | null
  totalTokens: number | null
  finishReason: string
  toolCalls: LLMToolCall[]
  toolResults: LLMToolExecutionResult[]
  stopReason: string
  iterations: number
  conversationHistory: LLMChatMessage[]
}

export interface LLMStreamEvent {
  type: string
  requestId: string | null
  model: string | null
  fromModel: string | null
  toModel: string | null
  content: string | null
  usedFallback: boolean
  errorCode: string | null
  errorMessage: string | null
  toolCallDelta: LLMToolCallDelta | null
  toolCalls: LLMToolCall[]
  finishReason: string | null
  toolResults: LLMToolExecutionResult[]
  iteration: number
  stopReason: string | null
}

export interface LLMSkillDefinition {
  name: string
  description: string
  systemPrompt: string
}

// ==================== Model 类型 ====================

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
  capabilityTags?: string[]
}

// ==================== LLMLog 类型 ====================

export interface LLMCallLogQueryRequest {
  pageIndex?: number
  pageSize?: number
  skillName?: string
  startDate?: string
  endDate?: string
}

export interface LLMCallLogRecord {
  id: string
  callType: string
  requestId: string
  primaryModel: string
  finalModel: string
  usedFallback: boolean
  fallbackModel: string
  skillName: string
  success: boolean
  errorMessage: string
  finishReason: string
  stopReason: string
  iterations: number
  promptTokens: number
  completionTokens: number
  totalTokens: number
  toolCallsSummary: string
  toolResultsSummary: string
  requestSummary: string
  responseSummary: string
  createAt: string
}

// ==================== Token 管理 ====================

const TOKEN_KEY = 'speakease_access_token'
const REFRESH_KEY = 'speakease_refresh_token'

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

async function refreshAccessToken(): Promise<boolean> {
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

// ==================== SSE 流式请求 ====================

export interface StreamCallbacks {
  onChunk?: (text: string, event: LLMStreamEvent) => void
  onToolCallDelta?: (delta: LLMToolCallDelta, event: LLMStreamEvent) => void
  onToolResults?: (results: LLMToolExecutionResult[], event: LLMStreamEvent) => void
  onFinish?: (event: LLMStreamEvent) => void
  onDone?: (event: LLMStreamEvent) => void
  onIterationEnd?: (event: LLMStreamEvent) => void
  onError?: (code: string, message: string) => void
}

export async function streamChat(
  request: LLMChatRequest,
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const token = getAccessToken()
  const res = await fetch('/ai/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(request),
    signal,
  })

  if (!res.ok) {
    if (res.status === 401) {
      const refreshed = await refreshAccessToken()
      if (refreshed) return streamChat(request, callbacks)
      clearTokens()
      callbacks.onError?.('auth_expired', '认证已过期')
      return
    }
    const text = await res.text()
    callbacks.onError?.('request_failed', `请求失败 (${res.status}): ${text}`)
    return
  }

  const reader = res.body?.getReader()
  if (!reader) { callbacks.onError?.('no_stream', '无法获取响应流'); return }

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    let eventType = ''
    for (const line of lines) {
      if (line.startsWith('event: ')) {
        eventType = line.slice(7).trim()
      } else if (line.startsWith('data: ')) {
        const json = line.slice(6)
        if (!json.trim()) continue
        try {
          const event: LLMStreamEvent = JSON.parse(json)
          const type = eventType || event.type
          switch (type) {
            case 'chunk':
              if (event.content) callbacks.onChunk?.(event.content, event)
              break
            case 'tool_call_delta':
              if (event.toolCallDelta) callbacks.onToolCallDelta?.(event.toolCallDelta, event)
              break
            case 'tool_results':
              if (event.toolResults?.length) callbacks.onToolResults?.(event.toolResults, event)
              break
            case 'finish': callbacks.onFinish?.(event); break
            case 'done': callbacks.onDone?.(event); break
            case 'iteration_end': callbacks.onIterationEnd?.(event); break
            case 'error': callbacks.onError?.(event.errorCode || 'unknown', event.errorMessage || ''); break
          }
        } catch { /* skip */ }
        eventType = ''
      }
    }
  }
}

// ==================== Agent 类型 ====================

export interface AgentChatRequest {
  messages: LLMChatMessage[]
  skillName?: string
  temperature?: number
  maxTokens?: number | null
  maxIterations?: number
  enableAutoToolDispatch?: boolean
}

export interface AgentStreamEvent {
  type: 'content' | 'tool_call' | 'tool_result' | 'done' | 'error'
  content?: string | null
  toolCallDelta?: LLMToolCallDelta | null
  toolResult?: LLMToolExecutionResult | null
  finalResponse?: {
    content: string
    model: string
    iterations: number
    stopReason: string
    toolResults: LLMToolExecutionResult[]
  } | null
}

export interface AgentSkillSummary {
  name: string
  description: string
}

export interface AgentStreamCallbacks {
  onChunk?: (text: string) => void
  onToolResult?: (result: LLMToolExecutionResult) => void
  onDone?: (finalResponse: AgentStreamEvent['finalResponse']) => void
  onError?: (code: string, message: string) => void
}

export async function agentStreamChat(
  request: AgentChatRequest,
  callbacks: AgentStreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const token = getAccessToken()
  const res = await fetch('/ai/agent/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(request),
    signal,
  })

  if (!res.ok) {
    if (res.status === 401) {
      const refreshed = await refreshAccessToken()
      if (refreshed) return agentStreamChat(request, callbacks, signal)
      clearTokens()
      callbacks.onError?.('auth_expired', '认证已过期')
      return
    }
    const text = await res.text()
    callbacks.onError?.('request_failed', `请求失败 (${res.status}): ${text}`)
    return
  }

  const reader = res.body?.getReader()
  if (!reader) { callbacks.onError?.('no_stream', '无法获取响应流'); return }

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    let eventType = ''
    for (const line of lines) {
      if (line.startsWith('event: ')) {
        eventType = line.slice(7).trim()
      } else if (line.startsWith('data: ')) {
        const json = line.slice(6)
        if (!json.trim()) continue
        try {
          const event: AgentStreamEvent = JSON.parse(json)
          const type = eventType || event.type
          switch (type) {
            case 'content':
              if (event.content) callbacks.onChunk?.(event.content)
              break
            case 'tool_result':
              if (event.toolResult) callbacks.onToolResult?.(event.toolResult)
              break
            case 'done':
              callbacks.onDone?.(event.finalResponse)
              break
            case 'error':
              callbacks.onError?.('agent_error', 'Agent 执行错误')
              break
          }
        } catch { /* skip */ }
        eventType = ''
      }
    }
  }
}

// ==================== 具名 API 方法 ====================

export const authApi = {
  login: (req: LoginRequest) =>
    apiClient<ApiResult<TokenResponse>>('/api/auth/login', { method: 'POST', body: JSON.stringify(req) }),
  register: (req: RegisterRequest) =>
    apiClient<ApiResult<TokenResponse>>('/api/auth/register', { method: 'POST', body: JSON.stringify(req) }),
  refreshToken: (req: RefreshTokenRequest) =>
    apiClient<ApiResult<TokenResponse>>('/api/auth/refresh-token', { method: 'POST', body: JSON.stringify(req) }),
}

export const userApi = {
  getProfile: () => apiClient<ApiResult<UserProfile>>('/api/user/profile'),
  updateProfile: (req: UpdateProfileRequest) =>
    apiClient<ApiResult<UserProfile>>('/api/user/profile', { method: 'PUT', body: JSON.stringify(req) }),
  changePassword: (req: ChangePasswordRequest) =>
    apiClient<ApiResult<null>>('/api/user/password', { method: 'PUT', body: JSON.stringify(req) }),
}

export const llmApi = {
  chat: (req: LLMChatRequest) =>
    apiClient<LLMChatResponse>('/ai/chat', { method: 'POST', body: JSON.stringify(req) }),
  streamChat,
  getSkills: () => apiClient<LLMSkillDefinition[]>('/ai/skills'),
}

export const modelApi = {
  getProviders: () => apiClient<ApiResult<AIModelProvider[]>>('/api/model/providers'),
  getProvider: (id: string) => apiClient<ApiResult<AIModelProvider>>(`/api/model/providers/${id}`),
  createProvider: (req: SaveProviderRequest) =>
    apiClient<ApiResult<AIModelProvider>>('/api/model/providers', { method: 'POST', body: JSON.stringify(req) }),
  updateProvider: (id: string, req: SaveProviderRequest) =>
    apiClient<ApiResult<AIModelProvider>>(`/api/model/providers/${id}`, { method: 'PUT', body: JSON.stringify(req) }),
  deleteProvider: (id: string) =>
    apiClient<ApiResult<null>>(`/api/model/providers/${id}`, { method: 'DELETE' }),
  getConfigs: () => apiClient<ApiResult<UserModelConfig[]>>('/api/model/configs'),
  getActiveConfig: () => apiClient<ApiResult<UserModelConfig>>('/api/model/configs/active'),
  saveConfig: (req: SaveUserModelConfigRequest) =>
    apiClient<ApiResult<UserModelConfig>>('/api/model/configs', { method: 'POST', body: JSON.stringify(req) }),
  activateConfig: (id: string) =>
    apiClient<ApiResult<null>>(`/api/model/configs/${id}/activate`, { method: 'PUT' }),
  deleteConfig: (id: string) =>
    apiClient<ApiResult<null>>(`/api/model/configs/${id}`, { method: 'DELETE' }),
}

export const agentApi = {
  chat: (req: AgentChatRequest) =>
    apiClient<unknown>('/ai/agent/chat', { method: 'POST', body: JSON.stringify(req) }),
  streamChat: agentStreamChat,
  getSkills: () => apiClient<AgentSkillSummary[]>('/ai/agent/skills'),
}

export const llmLogApi = {
  query: (req: LLMCallLogQueryRequest) =>
    apiClient<ApiResult<LLMCallLogRecord[]>>('/api/llmlog/query', { method: 'POST', body: JSON.stringify(req) }),
  getById: (id: string) =>
    apiClient<ApiResult<LLMCallLogRecord>>(`/api/llmlog/${id}`),
}

// ==================== Work 类型 ====================

export interface WorkItem {
  id: string
  title: string
  genre: string
  styleTags: string[]
  description: string
  coverUrl?: string
  totalWordCount: number
  chapterCount: number
  volumeCount: number
  status: string
  createdAt: string
  updatedAt: string
}

export interface WorkQueryRequest {
  keyword?: string
  pageIndex?: number
  pageSize?: number
}

export interface PageResult<T> {
  items: T[]
  totalCount: number
  pageIndex: number
  pageSize: number
}

export interface WorkCreateRequest {
  title: string
  genre: string
  styleTags: string[]
  description: string
  coverUrl?: string
}

export const workApi = {
  query: (req: WorkQueryRequest) =>
    apiClient<ApiResult<PageResult<WorkItem>>>('/api/work/query', { method: 'POST', body: JSON.stringify(req) }),
  getById: (id: string) =>
    apiClient<ApiResult<WorkItem>>(`/api/work/${id}`),
  create: (req: WorkCreateRequest) =>
    apiClient<ApiResult<WorkItem>>('/api/work', { method: 'POST', body: JSON.stringify(req) }),
  delete: (id: string) =>
    apiClient<ApiResult<null>>(`/api/work/${id}`, { method: 'DELETE' }),
}
