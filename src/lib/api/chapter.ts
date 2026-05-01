// ============================================================
// 章节模块
// ============================================================

import { apiClient } from './client'
import type { ApiResult } from './types'

export interface ChapterItem {
  id: string
  workId: string
  volumeId: string
  title: string
  sequence: number
  wordCount: number
  status: string       // draft | published | review
  summary: string
  authorNotes: string
  lastContentSavedAt: string | null
}

export interface ChapterDetail extends ChapterItem {
  content: string
}

export interface CreateChapterRequest {
  title: string
  sequence?: number
}

export interface UpdateChapterRequest {
  title?: string
  content?: string
  status?: string
  authorNotes?: string
}

export const chapterApi = {
  list: (workId: string) =>
    apiClient<ApiResult<ChapterItem[]>>(`/api/works/${workId}/chapters`),
  getDetail: (workId: string, chapterId: string) =>
    apiClient<ApiResult<ChapterDetail>>(`/api/works/${workId}/chapters/${chapterId}`),
  create: (workId: string, req: CreateChapterRequest) =>
    apiClient<ApiResult<ChapterDetail>>(`/api/works/${workId}/chapters`, { method: 'POST', body: JSON.stringify(req) }),
  update: (workId: string, chapterId: string, req: UpdateChapterRequest) =>
    apiClient<ApiResult<ChapterDetail>>(`/api/works/${workId}/chapters/${chapterId}`, { method: 'PUT', body: JSON.stringify(req) }),
  delete: (workId: string, chapterId: string) =>
    apiClient<ApiResult<null>>(`/api/works/${workId}/chapters/${chapterId}`, { method: 'DELETE' }),
}
