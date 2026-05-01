<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { versionApi, type ChapterVersionItem, type ChapterVersionDetail } from '@/lib/api/version'

const props = defineProps<{
  workId: string
  chapterId: string
  currentContent?: string
}>()

const emit = defineEmits<{
  close: []
  restore: [content: string]
}>()

const versions = ref<ChapterVersionItem[]>([])
const loading = ref(false)
const selectedVersion = ref<ChapterVersionDetail | null>(null)
const diffMode = ref<'side' | 'unified'>('side')

const sourceLabels: Record<string, string> = {
  manual: '手动保存',
  autosave: '自动保存',
  'ai-generate': 'AI 生成',
  'ai-polish': 'AI 润色',
  rollback: '版本回退',
}

const sourceColors: Record<string, string> = {
  manual: '#6366f1',
  autosave: '#10b981',
  'ai-generate': '#f59e0b',
  'ai-polish': '#8b5cf6',
  rollback: '#ef4444',
}

async function loadVersions() {
  if (!props.workId || !props.chapterId) return
  loading.value = true
  try {
    const res = await versionApi.list(props.workId, props.chapterId)
    if (res.succeeded && res.data) {
      versions.value = res.data.sort((a, b) => b.versionNumber - a.versionNumber)
    }
  } finally {
    loading.value = false
  }
}

async function selectVersion(versionId: string) {
  loading.value = true
  try {
    const res = await versionApi.get(props.workId, props.chapterId, versionId)
    if (res.succeeded && res.data) {
      selectedVersion.value = res.data
    }
  } finally {
    loading.value = false
  }
}

function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = (oldText || '').split('\n')
  const newLines = (newText || '').split('\n')
  const result: DiffLine[] = []

  const maxLen = Math.max(oldLines.length, newLines.length)
  const lcs = lcsLines(oldLines, newLines)
  let oi = 0, ni = 0, li = 0

  while (oi < oldLines.length || ni < newLines.length) {
    if (li < lcs.length && oi < oldLines.length && ni < newLines.length
      && oldLines[oi] === lcs[li] && newLines[ni] === lcs[li]) {
      result.push({ type: 'equal', oldNum: oi + 1, newNum: ni + 1, text: oldLines[oi] })
      oi++; ni++; li++
    } else if (oi < oldLines.length && (li >= lcs.length || oldLines[oi] !== lcs[li])) {
      result.push({ type: 'removed', oldNum: oi + 1, newNum: null, text: oldLines[oi] })
      oi++
    } else if (ni < newLines.length) {
      result.push({ type: 'added', oldNum: null, newNum: ni + 1, text: newLines[ni] })
      ni++
    }
  }

  return result
}

function lcsLines(a: string[], b: string[]): string[] {
  const m = a.length, n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }
  const result: string[] = []
  let i = m, j = n
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) { result.unshift(a[i - 1]); i--; j-- }
    else if (dp[i - 1][j] >= dp[i][j - 1]) i--
    else j--
  }
  return result
}

interface DiffLine {
  type: 'equal' | 'added' | 'removed'
  oldNum: number | null
  newNum: number | null
  text: string
}

const diffLines = ref<DiffLine[]>([])

function computeSelectedDiff() {
  if (!selectedVersion.value) return
  const current = props.currentContent || ''
  const versionContent = selectedVersion.value.content || ''
  diffLines.value = computeDiff(versionContent, current)
}

async function handleRollback(versionId: string) {
  loading.value = true
  try {
    const res = await versionApi.rollback(props.workId, props.chapterId, versionId)
    if (res.succeeded && res.data) {
      const detailRes = await versionApi.get(props.workId, props.chapterId, res.data.versionId)
      if (detailRes.succeeded && detailRes.data) {
        emit('restore', detailRes.data.content)
      }
    }
  } finally {
    loading.value = false
  }
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

watch(selectedVersion, () => computeSelectedDiff())

onMounted(loadVersions)
</script>

<template>
  <div class="version-panel">
    <div class="version-header">
      <h3>版本历史</h3>
      <div class="version-header-actions">
        <div class="version-diff-toggle">
          <button :class="{ active: diffMode === 'side' }" @click="diffMode = 'side'">并排</button>
          <button :class="{ active: diffMode === 'unified' }" @click="diffMode = 'unified'">统一</button>
        </div>
        <button class="version-close" @click="$emit('close')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>

    <div class="version-body">
      <div class="version-list">
        <div v-if="loading && versions.length === 0" class="version-loading">加载中...</div>
        <div v-else-if="versions.length === 0" class="version-empty">暂无版本记录</div>
        <div
          v-for="v in versions"
          :key="v.versionId"
          :class="['version-item', { active: selectedVersion?.versionId === v.versionId }]"
          @click="selectVersion(v.versionId)"
        >
          <div class="version-item-top">
            <span class="version-number">v{{ v.versionNumber }}</span>
            <span :class="['version-source', `source-${v.source}`]" :style="{ color: sourceColors[v.source] || '#6b7280' }">
              {{ sourceLabels[v.source] || v.source }}
            </span>
          </div>
          <div class="version-item-bottom">
            <span class="version-time">{{ formatTime(v.createdAt) }}</span>
            <button class="version-rollback-btn" @click.stop="handleRollback(v.versionId)" title="回退到此版本">
              回退
            </button>
          </div>
          <div v-if="v.summary" class="version-summary">{{ v.summary }}</div>
        </div>
      </div>

      <div class="version-diff">
        <div v-if="!selectedVersion" class="version-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
          <p>选择一个版本查看差异</p>
        </div>
        <div v-else class="diff-container" :class="diffMode">
          <div class="diff-title">
            <span class="diff-label">v{{ selectedVersion.versionNumber }} vs 当前版本</span>
            <button class="diff-restore-btn" @click="emit('restore', selectedVersion!.content)">恢复此版本</button>
          </div>
          <div class="diff-content">
            <template v-if="diffMode === 'side'">
              <div class="diff-side diff-old">
                <div class="diff-side-header">v{{ selectedVersion.versionNumber }} (历史)</div>
                <div v-for="(line, idx) in diffLines.filter(l => l.type !== 'added')" :key="'o-' + idx"
                  :class="['diff-line', line.type]">
                  <span class="diff-num">{{ line.oldNum ?? '' }}</span>
                  <span class="diff-text">{{ line.text }}</span>
                </div>
              </div>
              <div class="diff-side diff-new">
                <div class="diff-side-header">当前版本</div>
                <div v-for="(line, idx) in diffLines.filter(l => l.type !== 'removed')" :key="'n-' + idx"
                  :class="['diff-line', line.type]">
                  <span class="diff-num">{{ line.newNum ?? '' }}</span>
                  <span class="diff-text">{{ line.text }}</span>
                </div>
              </div>
            </template>
            <template v-else>
              <div v-for="(line, idx) in diffLines" :key="idx" :class="['diff-line', line.type]">
                <span class="diff-num-old">{{ line.oldNum ?? '' }}</span>
                <span class="diff-num-new">{{ line.newNum ?? '' }}</span>
                <span class="diff-prefix">{{ line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' ' }}</span>
                <span class="diff-text">{{ line.text }}</span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.version-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--editor-bg, #fff);
  border-left: 1px solid var(--editor-border, #e5e7eb);
}

.version-header {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.875rem;
  border-bottom: 1px solid var(--editor-border, #e5e7eb);
  flex-shrink: 0;
}
.version-header h3 {
  font-size: 0.85rem;
  font-weight: 700;
  margin: 0;
  color: var(--editor-text, #111827);
}
.version-header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.version-diff-toggle {
  display: flex;
  border: 1px solid var(--editor-border, #e5e7eb);
  border-radius: 6px;
  overflow: hidden;
}
.version-diff-toggle button {
  padding: 0.2rem 0.5rem;
  font-size: 0.7rem;
  border: none;
  background: transparent;
  color: var(--editor-muted, #6b7280);
  cursor: pointer;
  font-family: inherit;
}
.version-diff-toggle button.active {
  background: var(--editor-accent, #4f46e5);
  color: #fff;
}
.version-close {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--editor-muted, #9ca3af);
  cursor: pointer;
  border-radius: 4px;
}
.version-close:hover { background: rgba(0,0,0,0.06); }
.version-close svg { width: 14px; height: 14px; }

.version-body {
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;
}

.version-list {
  width: 220px;
  flex-shrink: 0;
  overflow-y: auto;
  border-right: 1px solid var(--editor-border, #e5e7eb);
  padding: 0.5rem;
}
.version-list::-webkit-scrollbar { width: 3px; }
.version-list::-webkit-scrollbar-thumb { background: var(--editor-border, #e5e7eb); border-radius: 2px; }

.version-item {
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 0.25rem;
  transition: background 0.15s;
  border: 1px solid transparent;
}
.version-item:hover { background: rgba(0,0,0,0.03); }
.version-item.active {
  background: var(--editor-accent-bg, #eef2ff);
  border-color: var(--editor-accent-border, #c7d2fe);
}
.version-item-top {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}
.version-number {
  font-weight: 700;
  font-size: 0.78rem;
  color: var(--editor-text, #111827);
}
.version-source {
  font-size: 0.65rem;
  font-weight: 500;
}
.version-item-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.2rem;
}
.version-time {
  font-size: 0.68rem;
  color: var(--editor-muted, #9ca3af);
}
.version-rollback-btn {
  font-size: 0.65rem;
  padding: 0.15rem 0.4rem;
  border: 1px solid var(--editor-border, #d1d5db);
  border-radius: 4px;
  background: var(--editor-bg, #fff);
  color: var(--editor-text, #374151);
  cursor: pointer;
  font-family: inherit;
  opacity: 0;
  transition: opacity 0.15s;
}
.version-item:hover .version-rollback-btn { opacity: 1; }
.version-rollback-btn:hover { background: #fef2f2; color: #ef4444; border-color: #fca5a5; }
.version-summary {
  font-size: 0.65rem;
  color: var(--editor-muted, #6b7280);
  margin-top: 0.25rem;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.version-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--editor-muted, #9ca3af);
  font-size: 0.8rem;
  gap: 0.5rem;
}
.version-empty svg { width: 32px; height: 32px; opacity: 0.4; }
.version-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100px;
  color: var(--editor-muted, #9ca3af);
  font-size: 0.8rem;
}

.version-diff {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.diff-container {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.diff-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--editor-border, #e5e7eb);
  flex-shrink: 0;
}
.diff-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--editor-text, #374151);
}
.diff-restore-btn {
  font-size: 0.7rem;
  padding: 0.25rem 0.6rem;
  border: 1px solid var(--editor-accent, #4f46e5);
  border-radius: 5px;
  background: transparent;
  color: var(--editor-accent, #4f46e5);
  cursor: pointer;
  font-family: inherit;
  font-weight: 500;
  transition: all 0.15s;
}
.diff-restore-btn:hover {
  background: var(--editor-accent, #4f46e5);
  color: #fff;
}

.diff-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
  font-size: 0.72rem;
  line-height: 1.6;
}

.diff-container.side .diff-content {
  display: flex;
}
.diff-side {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
}
.diff-side + .diff-side {
  border-left: 1px solid var(--editor-border, #e5e7eb);
}
.diff-side-header {
  padding: 0.375rem 0.625rem;
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--editor-muted, #6b7280);
  background: rgba(0,0,0,0.02);
  border-bottom: 1px solid var(--editor-border, #f3f4f6);
  position: sticky;
  top: 0;
  z-index: 1;
}

.diff-line {
  display: flex;
  padding: 0 0.5rem;
  min-height: 20px;
  align-items: flex-start;
}
.diff-line.added {
  background: #dcfce7;
  color: #166534;
}
.diff-line.removed {
  background: #fee2e2;
  color: #991b1b;
}
.diff-line.equal {
  color: var(--editor-text, #374151);
}
.diff-num, .diff-num-old, .diff-num-new {
  width: 2.5rem;
  flex-shrink: 0;
  text-align: right;
  padding-right: 0.5rem;
  color: var(--editor-muted, #9ca3af);
  user-select: none;
  font-size: 0.65rem;
}
.diff-prefix {
  width: 1rem;
  flex-shrink: 0;
  user-select: none;
  font-weight: 600;
}
.diff-text {
  flex: 1;
  min-width: 0;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
