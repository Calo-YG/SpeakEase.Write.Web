// ============================================================
// 伏笔追踪 + 时间线 + 角色关系 + 世界观 + 灵感 + 自动保存
// ============================================================

import { apiClient } from './client'
import type { ApiResult } from './types'

// ── 伏笔 ──
export interface ForeshadowingItem {
  id: string; workId: string; title: string; description: string
  setupChapterId: string; payoffChapterId: string
  status: string; importance: number; createdAt: string
}
export interface SaveForeshadowingRequest {
  title: string; description?: string; setupChapterId?: string
  payoffChapterId?: string; status?: string; importance?: number
}
export const foreshadowingApi = {
  list: (workId: string) => apiClient<ApiResult<ForeshadowingItem[]>>(`/api/works/${workId}/foreshadowings`),
  get: (workId: string, id: string) => apiClient<ApiResult<ForeshadowingItem>>(`/api/works/${workId}/foreshadowings/${id}`),
  create: (workId: string, req: SaveForeshadowingRequest) =>
    apiClient<ApiResult<ForeshadowingItem>>(`/api/works/${workId}/foreshadowings`, { method: 'POST', body: JSON.stringify(req) }),
  update: (workId: string, id: string, req: SaveForeshadowingRequest) =>
    apiClient<ApiResult<ForeshadowingItem>>(`/api/works/${workId}/foreshadowings/${id}`, { method: 'PUT', body: JSON.stringify(req) }),
  delete: (workId: string, id: string) => apiClient<ApiResult<null>>(`/api/works/${workId}/foreshadowings/${id}`, { method: 'DELETE' }),
  pendingResolutions: (workId: string) => apiClient<ApiResult<ForeshadowingItem[]>>(`/api/works/${workId}/foreshadowings/pending-resolutions`),
}

// ── 时间线 ──
export interface TimelineEventItem {
  id: string; workId: string; chapterId: string; title: string
  description: string; eventTime: string; eventType: string
  relatedCharacterIds: string[]; createdAt: string
}
export interface SaveTimelineEventRequest {
  chapterId?: string; title: string; description?: string
  eventTime?: string; eventType?: string; relatedCharacterIds?: string[]
}
export const timelineApi = {
  list: (workId: string) => apiClient<ApiResult<TimelineEventItem[]>>(`/api/works/${workId}/timeline`),
  get: (workId: string, id: string) => apiClient<ApiResult<TimelineEventItem>>(`/api/works/${workId}/timeline/${id}`),
  create: (workId: string, req: SaveTimelineEventRequest) =>
    apiClient<ApiResult<TimelineEventItem>>(`/api/works/${workId}/timeline`, { method: 'POST', body: JSON.stringify(req) }),
  update: (workId: string, id: string, req: SaveTimelineEventRequest) =>
    apiClient<ApiResult<TimelineEventItem>>(`/api/works/${workId}/timeline/${id}`, { method: 'PUT', body: JSON.stringify(req) }),
  delete: (workId: string, id: string) => apiClient<ApiResult<null>>(`/api/works/${workId}/timeline/${id}`, { method: 'DELETE' }),
  dependents: (workId: string, eventId: string) => apiClient<ApiResult<TimelineEventItem[]>>(`/api/works/${workId}/timeline/${eventId}/dependents`),
}

// ── 角色关系 ──
export interface CharacterRelationshipItem {
  id: string; workId: string; sourceCharacterId: string; targetCharacterId: string
  relationshipType: string; description: string; intensity: number; createdAt: string
}
export interface SaveCharacterRelationshipRequest {
  sourceCharacterId: string; targetCharacterId: string
  relationshipType: string; description?: string; intensity?: number
}
export const relationshipApi = {
  list: (workId: string) => apiClient<ApiResult<CharacterRelationshipItem[]>>(`/api/works/${workId}/relationships`),
  create: (workId: string, req: SaveCharacterRelationshipRequest) =>
    apiClient<ApiResult<CharacterRelationshipItem>>(`/api/works/${workId}/relationships`, { method: 'POST', body: JSON.stringify(req) }),
  update: (workId: string, id: string, req: SaveCharacterRelationshipRequest) =>
    apiClient<ApiResult<CharacterRelationshipItem>>(`/api/works/${workId}/relationships/${id}`, { method: 'PUT', body: JSON.stringify(req) }),
  delete: (workId: string, id: string) => apiClient<ApiResult<null>>(`/api/works/${workId}/relationships/${id}`, { method: 'DELETE' }),
  detectCircles: (workId: string) => apiClient<ApiResult<Record<string, string[]>>>(`/api/works/${workId}/relationships/circles`),
}

// ── 世界观 ──
export interface WorldSettingItem { id: string; workId: string; worldName: string; eraBackground: string; overallStyle: string; summary: string; createdAt: string }
export interface SaveWorldSettingRequest { worldName?: string; eraBackground?: string; overallStyle?: string; summary?: string; jsonContent?: string }
export const worldApi = {
  getOrCreate: (workId: string) => apiClient<ApiResult<WorldSettingItem>>(`/api/works/${workId}/world-setting`),
  update: (workId: string, req: SaveWorldSettingRequest) =>
    apiClient<ApiResult<WorldSettingItem>>(`/api/works/${workId}/world-setting`, { method: 'PUT', body: JSON.stringify(req) }),
  subEntityCounts: (workId: string) => apiClient<ApiResult<Record<string, number>>>(`/api/works/${workId}/world-setting/sub-entity-counts`),
}

// ── 灵感 ──
export interface InspirationItem { id: string; workId: string; inspirationType: string; title: string; content: string; source: string; isArchived: boolean; createdAt: string }
export interface SaveInspirationRequest { inspirationType?: string; title: string; content?: string; source?: string }
export const inspirationApi = {
  list: (workId: string) => apiClient<ApiResult<InspirationItem[]>>(`/api/works/${workId}/inspirations`),
  create: (workId: string, req: SaveInspirationRequest) =>
    apiClient<ApiResult<InspirationItem>>(`/api/works/${workId}/inspirations`, { method: 'POST', body: JSON.stringify(req) }),
  update: (workId: string, id: string, req: SaveInspirationRequest) =>
    apiClient<ApiResult<InspirationItem>>(`/api/works/${workId}/inspirations/${id}`, { method: 'PUT', body: JSON.stringify(req) }),
  delete: (workId: string, id: string) => apiClient<ApiResult<null>>(`/api/works/${workId}/inspirations/${id}`, { method: 'DELETE' }),
  archive: (workId: string, id: string, isArchived: boolean) =>
    apiClient<ApiResult<null>>(`/api/works/${workId}/inspirations/${id}/archive`, { method: 'POST', body: JSON.stringify({ isArchived }) }),
}

// ── 自动保存 ──
export interface AutoSaveRequest { entityType: string; entityId: string; content?: string; title?: string; summary?: string }
export const autoSaveApi = {
  save: (req: AutoSaveRequest) =>
    apiClient<ApiResult<null>>('/api/autosave', { method: 'POST', body: JSON.stringify(req) }),
}

// ── 快照（undo/redo） ──
export const snapshotApi = {
  list: (workId: string) => apiClient<ApiResult<unknown[]>>(`/api/creation/snapshots/list/${workId}`),
  restore: (snapshotId: string) => apiClient<ApiResult<boolean>>(`/api/creation/snapshots/${snapshotId}/restore`, { method: 'POST' }),
  undo: (workId: string) => apiClient<ApiResult<boolean>>(`/api/creation/snapshots/undo/${workId}`, { method: 'POST' }),
  restoreLast: (workId: string) => apiClient<ApiResult<boolean>>(`/api/creation/snapshots/restore-last/${workId}`, { method: 'POST' }),
}

// ── 采纳（AI内容确认） ──
export interface AdoptChapterRequest { workId: string; chapterId: string; sessionId: string; content: string; summary?: string; adoptType?: string }
export const adoptionApi = {
  adoptFull: (req: AdoptChapterRequest) =>
    apiClient<ApiResult<unknown>>('/api/creation/adopt/full', { method: 'POST', body: JSON.stringify(req) }),
  discard: (sessionId: string) =>
    apiClient<ApiResult<null>>(`/api/creation/adopt/${sessionId}/discard`, { method: 'POST' }),
}

// ── 角色关系图谱 ──
export interface CharacterGraphItem {
  id: string; workId: string; name: string; description: string
  version: number; status: string; layoutJson: string
  nodes: CharacterGraphNode[]; edges: CharacterGraphEdge[]; createdAt: string
}
export interface CharacterGraphNode {
  id: string; characterId: string; displayName: string
  nodeType: string; importance: number; x: number; y: number; styleJson: string
}
export interface CharacterGraphEdge {
  id: string; sourceNodeId: string; targetNodeId: string
  relationType: string; label: string; weight: number; direction: string
}
export interface SaveCharacterGraphRequest { name: string; description?: string; layoutJson?: string }
export interface UpdateGraphLayoutRequest { layoutJson: string }
export const graphApi = {
  list: (workId: string) => apiClient<ApiResult<CharacterGraphItem[]>>(`/api/works/${workId}/graphs`),
  getDetail: (workId: string, graphId: string) => apiClient<ApiResult<CharacterGraphItem>>(`/api/works/${workId}/graphs/${graphId}`),
  create: (workId: string, req: SaveCharacterGraphRequest) =>
    apiClient<ApiResult<CharacterGraphItem>>(`/api/works/${workId}/graphs`, { method: 'POST', body: JSON.stringify(req) }),
  delete: (workId: string, graphId: string) =>
    apiClient<ApiResult<null>>(`/api/works/${workId}/graphs/${graphId}`, { method: 'DELETE' }),
  updateLayout: (workId: string, graphId: string, req: UpdateGraphLayoutRequest) =>
    apiClient<ApiResult<CharacterGraphItem>>(`/api/works/${workId}/graphs/${graphId}/layout`, { method: 'PUT', body: JSON.stringify(req) }),
}

// ── 角色成长弧线 ──
export interface CharacterArcItem {
  id: string; workId: string; characterId: string
  stageOrder: number; stageTitle: string
  initialState: string; changedState: string; triggerEvent: string
}
export interface SaveCharacterArcRequest {
  stageOrder: number; stageTitle: string
  initialState: string; changedState: string; triggerEvent: string
}
export const arcApi = {
  listByCharacter: (workId: string, characterId: string) =>
    apiClient<ApiResult<CharacterArcItem[]>>(`/api/works/${workId}/characters/${characterId}/arcs`),
  listAll: (workId: string) =>
    apiClient<ApiResult<CharacterArcItem[]>>(`/api/works/${workId}/arcs`),
  create: (workId: string, characterId: string, req: SaveCharacterArcRequest) =>
    apiClient<ApiResult<CharacterArcItem>>(`/api/works/${workId}/characters/${characterId}/arcs`, { method: 'POST', body: JSON.stringify(req) }),
  update: (workId: string, characterId: string, arcId: string, req: SaveCharacterArcRequest) =>
    apiClient<ApiResult<CharacterArcItem>>(`/api/works/${workId}/characters/${characterId}/arcs/${arcId}`, { method: 'PUT', body: JSON.stringify(req) }),
  delete: (workId: string, characterId: string, arcId: string) =>
    apiClient<ApiResult<null>>(`/api/works/${workId}/characters/${characterId}/arcs/${arcId}`, { method: 'DELETE' }),
}
