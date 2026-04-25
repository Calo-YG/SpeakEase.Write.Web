// ============================================================
// 共用基础类型
// ============================================================

export interface ApiResult<T> {
  data: T
  succeeded: boolean
  successed?: boolean // 后端旧字段兼容
  message: string | null
  status: number
}

export interface PageResult<T> {
  items: T[]
  totalCount: number
  pageIndex: number
  pageSize: number
}
