// ============================================================
// 此文件为兼容性转发层，保持旧导入路径 `@/lib/api` 可用
// 实现已拆分至 src/lib/api/ 目录下各模块文件
// ============================================================
//
// 模块索引：
//   types.ts     — ApiResult, PageResult
//   client.ts    — Token 管理, apiClient, refreshAccessToken
//   auth.ts      — authApi
//   user.ts      — userApi
//   llm.ts       — LLM 类型, streamChat, llmApi
//   agent.ts     — Agent 类型, agentStreamChat, agentApi
//   model.ts     — modelApi
//   llmlog.ts    — llmLogApi
//   work.ts      — workApi
//   chapter.ts   — chapterApi
//   character.ts — characterApi
//   outline.ts   — outlineApi
//   reference.ts — referenceApi
//   tag.ts       — tagApi
//   dashboard.ts — dashboardApi
// ============================================================

export * from './api/index'
