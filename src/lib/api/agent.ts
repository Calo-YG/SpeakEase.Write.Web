// ============================================================
// Agent 模块（类型 + 流式 + agentApi）
// ============================================================

import { apiClient, getAccessToken, refreshAccessToken, clearTokens } from './client'
import type { LLMChatMessage, LLMToolCallDelta, LLMToolExecutionResult } from './llm'

// ==================== Agent 类型 ====================

export interface AgentChatRequest {
  messages: LLMChatMessage[]
  workId?: string
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

// ==================== SSE 流式请求 ====================

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

// ==================== agentApi ====================

export const agentApi = {
  chat: (req: AgentChatRequest) =>
    apiClient<unknown>('/ai/agent/chat', { method: 'POST', body: JSON.stringify(req) }),
  streamChat: agentStreamChat,
  getSkills: () => apiClient<AgentSkillSummary[]>('/ai/agent/skills'),
}
