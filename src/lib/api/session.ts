import { apiClient } from './client'
import type { ApiResult } from './types'

export interface SessionInfo {
  sessionId: string
  workId: string
  status: string
  turnCount: number
  startedAt: string
  lastActivityAt: string
  expiresAt: string | null
  closeReason: string
}

export interface SessionMessage {
  id: string
  role: string
  content: string
  turnNumber: number
  toolName: string
  toolSuccess: boolean | null
  createdAt: string
}

export const sessionApi = {
  getActive: (workId: string) =>
    apiClient<ApiResult<SessionInfo>>(`/api/creation/sessions/active/${workId}`),

  list: (workId: string) =>
    apiClient<ApiResult<SessionInfo[]>>(`/api/creation/sessions/list/${workId}`),

  getMessages: (sessionId: string, limit?: number) => {
    const qs = limit ? `?limit=${limit}` : ''
    return apiClient<ApiResult<SessionMessage[]>>(
      `/api/creation/sessions/${sessionId}/messages${qs}`,
    )
  },

  cancel: (sessionId: string) =>
    apiClient<ApiResult<null>>(`/api/creation/sessions/${sessionId}/cancel`, { method: 'POST' }),

  rollback: (sessionId: string, targetTurn: number) =>
    apiClient<ApiResult<null>>(`/api/creation/sessions/${sessionId}/rollback/${targetTurn}`, { method: 'POST' }),
}
