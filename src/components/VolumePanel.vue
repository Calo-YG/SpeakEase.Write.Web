<template>
  <div class="volume-panel">
    <div class="vp-header">
      <span class="vp-title">分卷管理</span>
      <span class="vp-count">{{ volumes.length }} 卷</span>
      <button class="vp-add-btn" @click="startCreate" title="新建分卷">+</button>
    </div>

    <div class="vp-list">
      <div v-if="loading" class="vp-loading">
        <span class="vp-dot"></span><span class="vp-dot"></span><span class="vp-dot"></span>
      </div>
      <div v-else-if="volumes.length === 0" class="vp-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="32" height="32">
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
          <line x1="8" y1="7" x2="16" y2="7"/>
          <line x1="8" y1="11" x2="16" y2="11"/>
        </svg>
        <p>暂无分卷</p>
        <p class="vp-empty-sub">点击 + 创建分卷来组织章节</p>
      </div>

      <div v-for="vol in volumes" :key="vol.id" :class="['vp-volume', { active: expandedVolId === vol.id }]">
        <div class="vp-vol-header" @click="toggleExpand(vol.id)">
          <svg class="vp-vol-caret" :class="{ expanded: expandedVolId === vol.id }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          <span class="vp-vol-title">{{ vol.title }}</span>
          <span class="vp-vol-badge">{{ vol.chapterCount }} 章</span>
          <div class="vp-vol-actions">
            <button class="vp-vol-btn" @click.stop="startEdit(vol)" title="编辑">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </button>
            <button class="vp-vol-btn vp-vol-del" @click.stop="handleDelete(vol)" title="删除">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- 展开：显示该卷下章节 -->
        <Transition name="vp-expand">
          <div v-if="expandedVolId === vol.id" class="vp-chapter-list">
            <div
              v-for="ch in chaptersInVolume(vol.id)"
              :key="ch.id"
              class="vp-chapter-item"
            >
              <span class="vp-ch-title">{{ ch.title }}</span>
              <span class="vp-ch-words">{{ (ch.wordCount || 0).toLocaleString() }}字</span>
              <select
                class="vp-ch-move-select"
                :value="vol.id"
                @change="handleMoveChapter(ch.id, ($event.target as HTMLSelectElement).value, vol.id)"
                title="移动到其他卷"
              >
                <option :value="vol.id">{{ vol.title }}</option>
                <option
                  v-for="other in volumes.filter(v => v.id !== vol.id)"
                  :key="other.id"
                  :value="other.id"
                >{{ other.title }}</option>
                <option value="">移出分卷</option>
              </select>
            </div>
            <div v-if="chaptersInVolume(vol.id).length === 0" class="vp-chapter-empty">
              该卷暂无章节
            </div>
          </div>
        </Transition>
      </div>

      <!-- 未分组章节 -->
      <div v-if="unassignedChapters.length > 0" class="vp-volume vp-volume-unassigned">
        <div class="vp-vol-header" @click="toggleExpand('__unassigned__')">
          <svg class="vp-vol-caret" :class="{ expanded: expandedVolId === '__unassigned__' }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          <span class="vp-vol-title">未分组章节</span>
          <span class="vp-vol-badge">{{ unassignedChapters.length }} 章</span>
        </div>

        <Transition name="vp-expand">
          <div v-if="expandedVolId === '__unassigned__'" class="vp-chapter-list">
            <div
              v-for="ch in unassignedChapters"
              :key="ch.id"
              class="vp-chapter-item"
            >
              <span class="vp-ch-title">{{ ch.title }}</span>
              <span class="vp-ch-words">{{ (ch.wordCount || 0).toLocaleString() }}字</span>
              <select
                class="vp-ch-move-select"
                value=""
                @change="handleMoveChapter(ch.id, ($event.target as HTMLSelectElement).value, '')"
                title="移动到分卷"
              >
                <option value="" disabled selected>移入…</option>
                <option
                  v-for="vol in volumes"
                  :key="vol.id"
                  :value="vol.id"
                >{{ vol.title }}</option>
              </select>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- 合并区域 -->
    <div v-if="mergeMode" class="vp-merge-bar">
      <span class="vp-merge-label">选择目标卷合并到：</span>
      <select v-model="mergeTargetId" class="vp-merge-select">
        <option value="" disabled>选择目标卷</option>
        <option
          v-for="vol in volumes.filter(v => v.id !== mergeSourceId)"
          :key="vol.id"
          :value="vol.id"
        >{{ vol.title }}</option>
      </select>
      <button class="vp-merge-confirm" :disabled="!mergeTargetId" @click="confirmMerge">合并</button>
      <button class="vp-merge-cancel" @click="cancelMerge">取消</button>
    </div>

    <!-- 编辑/创建表单 -->
    <Transition name="slide-up">
      <div v-if="editingId !== null" class="vp-form">
        <div class="vp-form-head">
          <span class="vp-form-title">{{ isCreating ? '新建分卷' : '编辑分卷' }}</span>
          <button class="vp-form-close" @click="closeForm">&times;</button>
        </div>
        <div class="vp-form-body">
          <div class="vp-field">
            <label>卷名称 <span class="required">*</span></label>
            <input
              ref="formTitleInput"
              v-model="form.title"
              class="vp-input"
              placeholder="如：第一卷：觉醒"
              maxlength="200"
              @keydown.enter="handleSave"
            />
          </div>
          <div class="vp-field">
            <label>卷序号</label>
            <input
              v-model.number="form.sequence"
              class="vp-input"
              type="number"
              min="1"
              placeholder="自动递增"
            />
          </div>
          <div class="vp-field">
            <label>卷摘要</label>
            <textarea
              v-model="form.summary"
              class="vp-textarea"
              rows="3"
              placeholder="本卷的主要剧情概要"
              maxlength="2000"
            />
          </div>
        </div>
        <div class="vp-form-actions">
          <button class="vp-btn vp-btn-cancel" @click="closeForm">取消</button>
          <button class="vp-btn vp-btn-save" :disabled="!form.title?.trim()" @click="handleSave">
            {{ isCreating ? '创建' : '保存' }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { volumeApi, type VolumeItem } from '@/lib/api/volume'
import type { ChapterItem } from '@/lib/api/chapter'
import { useNotification } from '@/composables/useNotification'

const props = defineProps<{
  workId: string
  chapters: ChapterItem[]
}>()

const emit = defineEmits<{
  'chapter-moved': [chapterId: string, newVolumeId: string]
}>()

const notify = useNotification()

const volumes = ref<VolumeItem[]>([])
const loading = ref(false)
const expandedVolId = ref('')

// ── 编辑/创建 ──
const editingId = ref<string | null>(null)
const isCreating = ref(false)
const formTitleInput = ref<HTMLInputElement | null>(null)
const form = ref<{ title: string; summary: string; sequence: number | null }>({
  title: '', summary: '', sequence: null,
})

// ── 合并 ──
const mergeMode = ref(false)
const mergeSourceId = ref('')
const mergeTargetId = ref('')

// ── 计算属性 ──
const unassignedChapters = computed(() =>
  props.chapters.filter(c => !c.volumeId)
)

function chaptersInVolume(volumeId: string) {
  return props.chapters.filter(c => c.volumeId === volumeId)
}

// ── 加载卷列表 ──
async function loadVolumes() {
  if (!props.workId) return
  loading.value = true
  try {
    const result = await volumeApi.list(props.workId)
    if (result.succeeded ?? result.successed) {
      volumes.value = result.data ?? []
    }
  } catch { /* ignored */ }
  loading.value = false
}

// ── 展开/折叠 ──
function toggleExpand(volId: string) {
  expandedVolId.value = expandedVolId.value === volId ? '' : volId
}

// ── 新建 ──
function startCreate() {
  editingId.value = '__new__'
  isCreating.value = true
  form.value = { title: '', summary: '', sequence: null }
  nextTick(() => formTitleInput.value?.focus())
}

// ── 编辑 ──
function startEdit(vol: VolumeItem) {
  editingId.value = vol.id
  isCreating.value = false
  form.value = { title: vol.title, summary: vol.summary, sequence: vol.sequence }
  nextTick(() => formTitleInput.value?.focus())
}

function closeForm() {
  editingId.value = null
  isCreating.value = false
}

// ── 保存 ──
async function handleSave() {
  const title = form.value.title?.trim()
  if (!title) return

  try {
    if (isCreating.value) {
      const req = {
        title,
        summary: form.value.summary || '',
        ...(form.value.sequence ? { sequence: form.value.sequence } : {}),
      }
      const result = await volumeApi.create(props.workId, req)
      if (result.succeeded ?? result.successed) {
        notify.success(`分卷「${title}」已创建`)
        await loadVolumes()
      }
    } else if (editingId.value) {
      const req = {
        title,
        summary: form.value.summary ?? undefined,
        ...(form.value.sequence ? { sequence: form.value.sequence } : {}),
      }
      const result = await volumeApi.update(props.workId, editingId.value, req)
      if (result.succeeded ?? result.successed) {
        notify.success(`分卷「${title}」已更新`)
        await loadVolumes()
      }
    }
    closeForm()
  } catch (e: any) {
    notify.error(e.message ?? '保存失败')
  }
}

// ── 删除 ──
async function handleDelete(vol: VolumeItem) {
  const chapterCount = chaptersInVolume(vol.id).length
  const confirmMsg = chapterCount > 0
    ? `确定删除分卷「${vol.title}」？其中 ${chapterCount} 个章节将变为未分组。`
    : `确定删除分卷「${vol.title}」？`
  if (!confirm(confirmMsg)) return

  try {
    const result = await volumeApi.delete(props.workId, vol.id)
    if (result.succeeded ?? result.successed) {
      notify.success(`分卷「${vol.title}」已删除`)
      emit('chapter-moved', '', '')
      await loadVolumes()
    }
  } catch (e: any) {
    notify.error(e.message ?? '删除失败')
  }
}

// ── 移动章节 ──
async function handleMoveChapter(chapterId: string, targetVolumeId: string, currentVolumeId: string) {
  if (targetVolumeId === currentVolumeId) return

  try {
    if (!targetVolumeId) {
      const result = await volumeApi.removeChapter(props.workId, chapterId)
      if (result.succeeded ?? result.successed) {
        notify.success('章节已移出分卷')
        emit('chapter-moved', chapterId, '')
      }
    } else {
      const result = await volumeApi.moveChapter(props.workId, chapterId, targetVolumeId)
      if (result.succeeded ?? result.successed) {
        const volName = volumes.value.find(v => v.id === targetVolumeId)?.title ?? targetVolumeId
        notify.success(`章节已移入「${volName}」`)
        emit('chapter-moved', chapterId, targetVolumeId)
      }
    }
  } catch (e: any) {
    notify.error(e.message ?? '移动失败')
  }
}

// ── 合并 ──
function startMerge(sourceId: string) {
  mergeMode.value = true
  mergeSourceId.value = sourceId
  mergeTargetId.value = ''
}

function cancelMerge() {
  mergeMode.value = false
  mergeSourceId.value = ''
  mergeTargetId.value = ''
}

async function confirmMerge() {
  if (!mergeSourceId.value || !mergeTargetId.value) return
  const sourceName = volumes.value.find(v => v.id === mergeSourceId.value)?.title ?? ''
  const targetName = volumes.value.find(v => v.id === mergeTargetId.value)?.title ?? ''

  if (!confirm(`将「${sourceName}」合并到「${targetName}」？合并后源卷将被删除。`)) return

  try {
    const result = await volumeApi.merge(props.workId, mergeSourceId.value, { targetVolumeId: mergeTargetId.value })
    if (result.succeeded ?? result.successed) {
      notify.success(`已将「${sourceName}」合并到「${targetName}」`)
      cancelMerge()
      emit('chapter-moved', '', '')
      await loadVolumes()
    }
  } catch (e: any) {
    notify.error(e.message ?? '合并失败')
  }
}

onMounted(loadVolumes)
watch(() => props.workId, loadVolumes)
</script>

<style scoped>
.volume-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  background: var(--editor-bg, #fff);
}

.vp-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--editor-border, #e5e7eb);
}

.vp-title {
  font-weight: 600;
  font-size: 14px;
}

.vp-count {
  font-size: 12px;
  color: var(--editor-muted, #6b7280);
  flex: 1;
}

.vp-add-btn {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: 1px dashed var(--editor-border, #d1d5db);
  background: transparent;
  color: var(--editor-accent, #4f46e5);
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
}

.vp-add-btn:hover {
  background: var(--editor-accent-bg, #eef2ff);
}

.vp-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.vp-empty {
  text-align: center;
  padding: 40px 16px;
  color: var(--editor-muted, #9ca3af);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.vp-empty svg {
  color: var(--editor-border, #d1d5db);
}

.vp-empty p {
  margin: 0;
  font-size: 13px;
}

.vp-empty-sub {
  font-size: 12px;
  color: var(--editor-muted, #9ca3af);
}

.vp-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 20px;
}

.vp-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--editor-accent, #4f46e5);
  animation: vp-dot-bounce 1.2s ease-in-out infinite;
}

.vp-dot:nth-child(2) { animation-delay: .2s; }
.vp-dot:nth-child(3) { animation-delay: .4s; }

@keyframes vp-dot-bounce {
  0%, 80%, 100% { opacity: .3; transform: scale(.8); }
  40% { opacity: 1; transform: scale(1); }
}

/* ── 卷卡片 ── */
.vp-volume {
  border-radius: 8px;
  margin-bottom: 4px;
  border: 1px solid transparent;
}

.vp-volume.active {
  border-color: var(--editor-accent-border, #c7d2fe);
}

.vp-volume-unassigned {
  opacity: 0.8;
  margin-top: 8px;
  border-top: 1px dashed var(--editor-border, #e5e7eb);
  padding-top: 8px;
}

.vp-vol-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
}

.vp-vol-header:hover {
  background: var(--editor-accent-bg, #f9fafb);
}

.vp-vol-caret {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  transition: transform .2s ease;
  color: var(--editor-muted, #9ca3af);
}

.vp-vol-caret.expanded {
  transform: rotate(90deg);
}

.vp-vol-title {
  font-weight: 600;
  font-size: 13px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vp-vol-badge {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--editor-accent-bg, #eef2ff);
  color: var(--editor-accent, #4f46e5);
  flex-shrink: 0;
}

.vp-vol-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity .15s;
}

.vp-vol-header:hover .vp-vol-actions {
  opacity: 1;
}

.vp-vol-btn {
  width: 22px;
  height: 22px;
  border: none;
  background: transparent;
  color: var(--editor-muted, #6b7280);
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.vp-vol-btn:hover {
  background: var(--editor-accent-bg, #eef2ff);
  color: var(--editor-accent, #4f46e5);
}

.vp-vol-del:hover {
  background: #fee2e2;
  color: #ef4444;
}

/* ── 章节列表 ── */
.vp-chapter-list {
  padding: 0 8px 6px 28px;
  overflow: hidden;
}

.vp-chapter-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
}

.vp-chapter-item:hover {
  background: var(--editor-accent-bg, #f9fafb);
}

.vp-ch-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--editor-text, #374151);
}

.vp-ch-words {
  font-size: 11px;
  color: var(--editor-muted, #9ca3af);
  flex-shrink: 0;
}

.vp-ch-move-select {
  font-size: 11px;
  padding: 1px 4px;
  border: 1px solid var(--editor-border, #e5e7eb);
  border-radius: 4px;
  background: var(--editor-bg, #fff);
  color: var(--editor-muted, #6b7280);
  cursor: pointer;
  outline: none;
  max-width: 90px;
  font-family: inherit;
}

.vp-ch-move-select:focus {
  border-color: var(--editor-accent, #4f46e5);
}

.vp-chapter-empty {
  font-size: 12px;
  color: var(--editor-muted, #9ca3af);
  padding: 8px;
  text-align: center;
  font-style: italic;
}

/* ── 合并栏 ── */
.vp-merge-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-top: 1px solid var(--editor-border, #e5e7eb);
  background: var(--editor-accent-bg, #eef2ff);
  flex-wrap: wrap;
}

.vp-merge-label {
  font-size: 12px;
  color: var(--editor-text, #374151);
}

.vp-merge-select {
  flex: 1;
  min-width: 80px;
  font-size: 12px;
  padding: 3px 6px;
  border: 1px solid var(--editor-border, #d1d5db);
  border-radius: 4px;
  background: var(--editor-bg, #fff);
  font-family: inherit;
}

.vp-merge-confirm,
.vp-merge-cancel {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 4px;
  cursor: pointer;
  border: none;
  font-family: inherit;
}

.vp-merge-confirm {
  background: var(--editor-accent, #4f46e5);
  color: #fff;
}

.vp-merge-confirm:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.vp-merge-cancel {
  background: #f3f4f6;
  color: var(--editor-text, #374151);
}

/* ── 表单 ── */
.vp-form {
  border-top: 1px solid var(--editor-border, #e5e7eb);
  max-height: 50%;
  overflow-y: auto;
}

.vp-form-head {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid var(--editor-border, #e5e7eb);
}

.vp-form-title {
  font-weight: 600;
  font-size: 13px;
  flex: 1;
}

.vp-form-close {
  border: none;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
  color: var(--editor-muted, #6b7280);
  font-family: inherit;
}

.vp-form-body {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.vp-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vp-field label {
  font-size: 12px;
  color: var(--editor-muted, #6b7280);
  font-weight: 500;
}

.vp-field .required {
  color: #ef4444;
}

.vp-input {
  padding: 6px 10px;
  border: 1px solid var(--editor-border, #d1d5db);
  border-radius: 6px;
  font-size: 13px;
  background: var(--editor-bg, #fff);
  color: var(--editor-text, #111827);
  outline: none;
  font-family: inherit;
}

.vp-input:focus {
  border-color: var(--editor-accent, #4f46e5);
}

.vp-textarea {
  padding: 6px 10px;
  border: 1px solid var(--editor-border, #d1d5db);
  border-radius: 6px;
  font-size: 13px;
  resize: vertical;
  background: var(--editor-bg, #fff);
  color: var(--editor-text, #111827);
  outline: none;
  font-family: inherit;
}

.vp-textarea:focus {
  border-color: var(--editor-accent, #4f46e5);
}

.vp-form-actions {
  display: flex;
  gap: 8px;
  padding: 10px 16px;
  border-top: 1px solid var(--editor-border, #e5e7eb);
}

.vp-btn {
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  border: none;
  font-family: inherit;
}

.vp-btn-cancel {
  background: #f3f4f6;
  color: var(--editor-text, #374151);
}

.vp-btn-save {
  background: var(--editor-accent, #4f46e5);
  color: #fff;
}

.vp-btn-save:disabled {
  opacity: .5;
  cursor: not-allowed;
}

/* ── 动画 ── */
.vp-expand-enter-active,
.vp-expand-leave-active {
  transition: max-height .25s ease, opacity .25s ease;
  overflow: hidden;
}

.vp-expand-enter-from,
.vp-expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.vp-expand-enter-to,
.vp-expand-leave-from {
  max-height: 600px;
  opacity: 1;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: max-height .25s ease, opacity .25s ease;
  overflow: hidden;
}

.slide-up-enter-from,
.slide-up-leave-to {
  max-height: 0;
  opacity: 0;
}

.slide-up-enter-to,
.slide-up-leave-from {
  max-height: 500px;
  opacity: 1;
}
</style>
