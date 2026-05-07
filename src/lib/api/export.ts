import { getAccessToken } from './client'

function getApiBase(): string {
  return import.meta.env.VITE_API_BASE_URL || '/api'
}

function getAuthHeaders(): Record<string, string> {
  const token = getAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export interface ExportOptions {
  start?: number
  end?: number
}

function buildExportUrl(workId: string, format: 'txt' | 'epub', options?: ExportOptions): string {
  const base = `${getApiBase()}/novel/export/${workId}/${format}`
  const params = new URLSearchParams()
  if (options?.start != null) params.set('start', String(options.start))
  if (options?.end != null) params.set('end', String(options.end))
  const qs = params.toString()
  return qs ? `${base}?${qs}` : base
}

export const exportApi = {
  async exportTxt(workId: string, options?: ExportOptions): Promise<Blob> {
    const res = await fetch(buildExportUrl(workId, 'txt', options), {
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error(`导出失败: ${res.status}`)
    return res.blob()
  },

  async exportEpub(workId: string, options?: ExportOptions): Promise<Blob> {
    const res = await fetch(buildExportUrl(workId, 'epub', options), {
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error(`导出失败: ${res.status}`)
    return res.blob()
  },
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
