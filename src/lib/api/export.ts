import { getAccessToken } from './client'

function getApiBase(): string {
  return import.meta.env.VITE_API_BASE_URL || '/api'
}

function getAuthHeaders(): Record<string, string> {
  const token = getAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const exportApi = {
  async exportTxt(workId: string): Promise<Blob> {
    const res = await fetch(`${getApiBase()}/novel/export/${workId}/txt`, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error(`导出失败: ${res.status}`)
    return res.blob()
  },

  async exportEpub(workId: string): Promise<Blob> {
    const res = await fetch(`${getApiBase()}/novel/export/${workId}/epub`, {
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
