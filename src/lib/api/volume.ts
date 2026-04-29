// ============================================================
// 卷管理
// ============================================================

import { apiClient } from './client'
import type { ApiResult } from './types'

export interface VolumeItem {
  id: string
  workId: string
  title: string
  sequence: number
  summary: string
  chapterCount: number
}

export interface CreateVolumeRequest { title: string; summary?: string; sequence?: number }
export interface UpdateVolumeRequest { title?: string; summary?: string; sequence?: number }
export interface MergeVolumeRequest { targetVolumeId: string }

export const volumeApi = {
  list: (workId: string) =>
    apiClient<ApiResult<VolumeItem[]>>(`/api/works/${workId}/volumes`),
  create: (workId: string, req: CreateVolumeRequest) =>
    apiClient<ApiResult<VolumeItem>>(`/api/works/${workId}/volumes`, { method: 'POST', body: JSON.stringify(req) }),
  update: (workId: string, volumeId: string, req: UpdateVolumeRequest) =>
    apiClient<ApiResult<VolumeItem>>(`/api/works/${workId}/volumes/${volumeId}`, { method: 'PUT', body: JSON.stringify(req) }),
  delete: (workId: string, volumeId: string) =>
    apiClient<ApiResult<null>>(`/api/works/${workId}/volumes/${volumeId}`, { method: 'DELETE' }),
  merge: (workId: string, volumeId: string, req: MergeVolumeRequest) =>
    apiClient<ApiResult<null>>(`/api/works/${workId}/volumes/${volumeId}/merge`, { method: 'POST', body: JSON.stringify(req) }),
  moveChapter: (workId: string, chapterId: string, targetVolumeId: string) =>
    apiClient<ApiResult<null>>(`/api/works/${workId}/volumes/move-chapter/${chapterId}/to/${targetVolumeId}`, { method: 'POST' }),
  removeChapter: (workId: string, chapterId: string) =>
    apiClient<ApiResult<null>>(`/api/works/${workId}/volumes/remove-chapter/${chapterId}`, { method: 'POST' }),
}
