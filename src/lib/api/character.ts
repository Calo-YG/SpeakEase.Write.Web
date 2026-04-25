// ============================================================
// 角色模块
// ============================================================

import { apiClient } from './client'
import type { ApiResult } from './types'

export interface CharacterItem {
  id: string
  workId: string
  name: string
  alias: string
  gender: string
  ageDescription: string
  identity: string
  appearance: string
  personality: string
  backgroundStory: string
  motivation: string
  abilityDescription: string
  tags: string[]
}

export interface SaveCharacterRequest {
  name: string
  alias?: string
  gender?: string
  ageDescription?: string
  identity?: string
  appearance?: string
  personality?: string
  backgroundStory?: string
  motivation?: string
  abilityDescription?: string
  tags?: string[]
}

export const characterApi = {
  list: (workId: string) =>
    apiClient<ApiResult<CharacterItem[]>>(`/api/works/${workId}/characters`),
  getById: (workId: string, id: string) =>
    apiClient<ApiResult<CharacterItem>>(`/api/works/${workId}/characters/${id}`),
  create: (workId: string, req: SaveCharacterRequest) =>
    apiClient<ApiResult<CharacterItem>>(`/api/works/${workId}/characters`, { method: 'POST', body: JSON.stringify(req) }),
  update: (workId: string, id: string, req: SaveCharacterRequest) =>
    apiClient<ApiResult<CharacterItem>>(`/api/works/${workId}/characters/${id}`, { method: 'PUT', body: JSON.stringify(req) }),
  delete: (workId: string, id: string) =>
    apiClient<ApiResult<null>>(`/api/works/${workId}/characters/${id}`, { method: 'DELETE' }),
}
