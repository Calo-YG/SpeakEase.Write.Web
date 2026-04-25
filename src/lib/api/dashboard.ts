// ============================================================
// 仪表盘模块
// ============================================================

import { apiClient } from './client'
import type { ApiResult } from './types'

export interface DashboardStats {
  totalWords: number
  workCount: number
  creationDays: number
  aiCallCount: number
}

export interface RecentWorkItem {
  id: string
  title: string
  genre: string
  totalWordCount: number
  status: string
  updatedAt: string
}

export const dashboardApi = {
  getStats: () =>
    apiClient<ApiResult<DashboardStats>>('/api/dashboard/stats'),
  getRecentWorks: (limit?: number) =>
    apiClient<ApiResult<RecentWorkItem[]>>(`/api/dashboard/recent-works?limit=${limit ?? 5}`),
}
