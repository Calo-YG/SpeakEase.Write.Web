// ============================================================
// 大纲模块
// ============================================================

import { apiClient } from './client'
import type { ApiResult } from './types'

export interface OutlineNodeItem {
  id: string
  workId: string
  parentId: string | null
  title: string
  description: string
  sequence: number
  chapterId: string | null
}

export interface SaveOutlineNodeRequest {
  parentId?: string | null
  title: string
  description?: string
  sequence?: number
  chapterId?: string | null
}

export const outlineApi = {
  getTree: (workId: string) =>
    apiClient<ApiResult<OutlineNodeItem[]>>(`/api/works/${workId}/outline`),
  createNode: (workId: string, req: SaveOutlineNodeRequest) =>
    apiClient<ApiResult<OutlineNodeItem>>(`/api/works/${workId}/outline`, { method: 'POST', body: JSON.stringify(req) }),
  updateNode: (workId: string, nodeId: string, req: SaveOutlineNodeRequest) =>
    apiClient<ApiResult<OutlineNodeItem>>(`/api/works/${workId}/outline/${nodeId}`, { method: 'PUT', body: JSON.stringify(req) }),
  deleteNode: (workId: string, nodeId: string) =>
    apiClient<ApiResult<null>>(`/api/works/${workId}/outline/${nodeId}`, { method: 'DELETE' }),
}
