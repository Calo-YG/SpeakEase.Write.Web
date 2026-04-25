// ============================================================
// LLM 调用日志模块
// ============================================================

import { apiClient } from './client'
import type { ApiResult } from './types'

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

export const llmLogApi = {
  query: (req: LLMCallLogQueryRequest) =>
    apiClient<ApiResult<LLMCallLogRecord[]>>('/api/llmlog/query', { method: 'POST', body: JSON.stringify(req) }),
  getById: (id: string) =>
    apiClient<ApiResult<LLMCallLogRecord>>(`/api/llmlog/${id}`),
}
