// ============================================================
// 标签模块
// ============================================================

import { apiClient } from './client'
import type { ApiResult } from './types'

export interface TagItem {
  id: string
  name: string
  category: 'scene' | 'content'
  color: string
  description: string
  usageCount: number
}

export interface SaveTagRequest {
  name: string
  category: 'scene' | 'content'
  color?: string
  description?: string
}

export const tagApi = {
  list: (req?: { keyword?: string; category?: string }) => {
    const params = new URLSearchParams()
    if (req?.category) params.set('category', req.category)
    if (req?.keyword) params.set('keyword', req.keyword)
    const qs = params.toString()
    return apiClient<ApiResult<TagItem[]>>(`/api/tags/query${qs ? `?${qs}` : ''}`)
  },
  create: (req: SaveTagRequest) =>
    apiClient<ApiResult<TagItem>>('/api/tags', { method: 'POST', body: JSON.stringify(req) }),
  update: (id: string, req: SaveTagRequest) =>
    apiClient<ApiResult<TagItem>>(`/api/tags/${id}`, { method: 'PUT', body: JSON.stringify(req) }),
  delete: (id: string) =>
    apiClient<ApiResult<null>>(`/api/tags/${id}`, { method: 'DELETE' }),
  getHotTags: (limit?: number) =>
    apiClient<ApiResult<TagItem[]>>(`/api/tags/hot?limit=${limit ?? 15}`),
}
