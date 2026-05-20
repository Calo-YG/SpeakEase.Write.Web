// ============================================================
// LLM 模块（类型 + 流式 + llmApi）
// ============================================================

import { apiClient, getAccessToken, refreshAccessToken, clearTokens } from './client'

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
  contentType: string | null
  extraData: Record<string, string> | null
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

// ==================== llmApi ====================

export const llmApi = {
  chat: (req: LLMChatRequest) =>
    apiClient<LLMChatResponse>('/ai/chat', { method: 'POST', body: JSON.stringify(req) }),
  streamChat,
  getSkills: () => apiClient<LLMSkillDefinition[]>('/ai/skills'),
}
