// ============================================================
// 参考文库模块
// ============================================================

import { apiClient } from './client'
import type { ApiResult, PageResult } from './types'

export interface ReferenceWorkItem {
  id: string
  title: string
  author: string
  genre: string
  styleTags: string[]
  score: number
  summary: string
}

export interface ReferencePassageItem {
  id: string
  referenceWorkId: string
  referenceWorkTitle: string
  referenceWorkAuthor: string
  referenceWorkGenre: string
  passageType: string
  content: string
  highlightTags: string[]
  techniqueAnalysis: string
  favoriteCount: number
  recommendationCount: number
  favoritedByMe: boolean
}

export interface ReferencePassageQueryRequest {
  keyword?: string
  passageType?: string
  tag?: string
  pageIndex?: number
  pageSize?: number
}

export interface SaveReferencePassageRequest {
  referenceWorkId?: string
  bookTitle?: string
  author?: string
  genre?: string
  passageType: string
  content: string
  highlightTags?: string[]
  techniqueAnalysis?: string
}

export const referenceApi = {
  getWorks: (req?: { keyword?: string }) =>
    apiClient<ApiResult<ReferenceWorkItem[]>>('/api/references/works', { method: 'POST', body: JSON.stringify(req) }),
  queryPassages: (req: ReferencePassageQueryRequest) =>
    apiClient<ApiResult<PageResult<ReferencePassageItem>>>('/api/references/passages/query', { method: 'POST', body: JSON.stringify(req) }),
  getPassage: (id: string) =>
    apiClient<ApiResult<ReferencePassageItem>>(`/api/references/passages/${id}`),
  addPassage: (req: SaveReferencePassageRequest) =>
    apiClient<ApiResult<ReferencePassageItem>>('/api/references/passages', { method: 'POST', body: JSON.stringify(req) }),
  deletePassage: (id: string) =>
    apiClient<ApiResult<null>>(`/api/references/passages/${id}`, { method: 'DELETE' }),
  toggleFavorite: (id: string) =>
    apiClient<ApiResult<boolean>>(`/api/references/passages/${id}/favorite`, { method: 'PUT' }),
}
