// ============================================================
// 章节版本管理
// ============================================================

import { apiClient } from './client'
import type { ApiResult } from './types'

export interface ChapterVersionItem {
  versionId: string
  chapterId: string
  versionNumber: number
  summary: string
  source: string
  modelId: string
  createdAt: string
}

export interface ChapterVersionDetail extends ChapterVersionItem {
  content: string
}

export interface CreateVersionRequest {
  chapterId: string
  content?: string
  summary?: string
  source: string
  modelId?: string
}

export interface SaveAsNewChapterRequest {
  chapterId: string
  sourceVersionId: string
  newTitle: string
}

export const versionApi = {
  list: (workId: string, chapterId: string) =>
    apiClient<ApiResult<ChapterVersionItem[]>>(`/api/works/${workId}/chapters/${chapterId}/versions`),
  get: (workId: string, chapterId: string, versionId: string) =>
    apiClient<ApiResult<ChapterVersionDetail>>(`/api/works/${workId}/chapters/${chapterId}/versions/${versionId}`),
  create: (workId: string, chapterId: string, req: CreateVersionRequest) =>
    apiClient<ApiResult<ChapterVersionItem>>(`/api/works/${workId}/chapters/${chapterId}/versions`, { method: 'POST', body: JSON.stringify(req) }),
  rollback: (workId: string, chapterId: string, versionId: string) =>
    apiClient<ApiResult<ChapterVersionItem>>(`/api/works/${workId}/chapters/${chapterId}/versions/${versionId}/rollback`, { method: 'POST' }),
  merge: (workId: string, chapterId: string, versionId: string) =>
    apiClient<ApiResult<ChapterVersionItem>>(`/api/works/${workId}/chapters/${chapterId}/versions/${versionId}/merge`, { method: 'POST' }),
  delete: (workId: string, chapterId: string, versionId: string) =>
    apiClient<ApiResult<null>>(`/api/works/${workId}/chapters/${chapterId}/versions/${versionId}`, { method: 'DELETE' }),
  saveAsNewChapter: (workId: string, chapterId: string, versionId: string, req: SaveAsNewChapterRequest) =>
    apiClient<ApiResult<null>>(`/api/works/${workId}/chapters/${chapterId}/versions/${versionId}/save-as-chapter`, { method: 'POST', body: JSON.stringify(req) }),
}
