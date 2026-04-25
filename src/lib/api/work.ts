// ============================================================
// 作品模块
// ============================================================

import { apiClient } from './client'
import type { ApiResult, PageResult } from './types'

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

export interface WorkCreateRequest {
  title: string
  genre: string
  styleTags: string[]
  description: string
  coverUrl?: string
}

export interface WorkUpdateRequest {
  title?: string
  genre?: string
  styleTags?: string[]
  description?: string
  coverUrl?: string
  status?: string
}

export const workApi = {
  query: (req: WorkQueryRequest) =>
    apiClient<ApiResult<PageResult<WorkItem>>>('/api/work/query', { method: 'POST', body: JSON.stringify(req) }),
  getById: (id: string) =>
    apiClient<ApiResult<WorkItem>>(`/api/work/${id}`),
  create: (req: WorkCreateRequest) =>
    apiClient<ApiResult<WorkItem>>('/api/work', { method: 'POST', body: JSON.stringify(req) }),
  update: (id: string, req: WorkUpdateRequest) =>
    apiClient<ApiResult<WorkItem>>(`/api/work/${id}`, { method: 'PUT', body: JSON.stringify(req) }),
  delete: (id: string) =>
    apiClient<ApiResult<null>>(`/api/work/${id}`, { method: 'DELETE' }),
}
