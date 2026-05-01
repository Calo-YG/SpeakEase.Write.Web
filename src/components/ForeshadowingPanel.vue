<template>
  <div class="foreshadow-panel">
    <div class="fp-header">
      <span class="fp-title">伏笔追踪</span>
      <span class="fp-count">{{ items.length }} 条伏笔</span>
      <button class="fp-add-btn" @click="startCreate" title="新建伏笔">+</button>
    </div>

    <div v-if="pendingCount > 0" class="fp-pending-hint">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      {{ pendingCount }} 条伏笔待收
    </div>

    <div class="fp-list">
      <div v-if="items.length === 0 && !loading" class="fp-empty">
        <p>暂无伏笔，点击 + 创建</p>
      </div>
      <div v-if="loading" class="fp-loading">
        <span class="fp-dot"></span><span class="fp-dot"></span><span class="fp-dot"></span>
      </div>
      <div
        v-for="item in items"
        :key="item.id"
        :class="['fp-item', `fp-status-${item.status}`, { active: editingId === item.id }]"
        @click="selectItem(item)"
      >
        <div class="fp-item-head">
          <span class="fp-item-title">{{ item.title }}</span>
          <div class="fp-item-actions">
            <span :class="['fp-status-tag', `st-${item.status}`]">{{ statusLabel(item.status) }}</span>
            <button class="fp-item-del" @click.stop="handleDelete(item)" title="删除">&times;</button>
          </div>
        </div>
        <p v-if="item.description" class="fp-item-desc">{{ item.description }}</p>
        <div class="fp-item-meta">
          <span v-if="item.importance" class="fp-importance">
            <span v-for="n in item.importance" :key="n" class="fp-star">★</span>
          </span>
          <span v-if="item.setupChapterId" class="fp-chapter-tag">埋设</span>
          <span v-if="item.payoffChapterId" class="fp-chapter-tag fp-chapter-tag-payoff">收束</span>
        </div>
      </div>
    </div>

    <Transition name="slide-up">
      <div v-if="editingId !== null" class="fp-form">
        <div class="fp-form-head">
          <span class="fp-form-title">{{ isCreating ? '新建伏笔' : '编辑伏笔' }}</span>
          <button class="fp-form-close" @click="closeForm">&times;</button>
        </div>
        <div class="fp-form-body">
          <div class="fp-field">
            <label>标题 <span class="required">*</span></label>
            <input v-model="form.title" class="fp-input" placeholder="伏笔名称" maxlength="50" />
          </div>
          <div class="fp-field">
            <label>描述</label>
            <textarea v-model="form.description" class="fp-textarea" rows="2" placeholder="伏笔的具体内容" maxlength="500" />
          </div>
          <div class="fp-field">
            <label>状态</label>
            <select v-model="form.status" class="fp-input">
              <option value="planted">已埋设</option>
              <option value="hinted">已暗示</option>
              <option value="resolved">已收束</option>
              <option value="abandoned">已放弃</option>
            </select>
          </div>
          <div class="fp-field">
            <label>重要程度</label>
            <div class="fp-stars">
              <button
                v-for="n in 5"
                :key="n"
                :class="['fp-star-btn', { active: (form.importance ?? 0) >= n }]"
                @click="form.importance = (form.importance ?? 0) === n ? 0 : n"
              >★</button>
            </div>
          </div>
        </div>
        <div class="fp-form-actions">
          <button class="fp-btn fp-btn-cancel" @click="closeForm">取消</button>
          <button class="fp-btn fp-btn-save" :disabled="!form.title.trim()" @click="handleSave">
            {{ isCreating ? '创建' : '保存' }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { foreshadowingApi, type ForeshadowingItem, type SaveForeshadowingRequest } from '@/lib/api'
import { useNotification } from '@/composables/useNotification'

const props = defineProps<{ workId: string }>()
const notify = useNotification()

const items = ref<ForeshadowingItem[]>([])
const loading = ref(false)
const pendingCount = ref(0)
const editingId = ref<string | null>(null)
const isCreating = ref(false)

const form = ref<SaveForeshadowingRequest & { id?: string }>({
  title: '',
  description: '',
  status: 'planted',
  importance: 3,
})

const defaultForm: SaveForeshadowingRequest = { title: '', description: '', status: 'planted', importance: 3 }

function statusLabel(s: string) {
  const map: Record<string, string> = { planted: '已埋设', hinted: '已暗示', resolved: '已收束', abandoned: '已放弃' }
  return map[s] ?? s
}

async function loadItems() {
  if (!props.workId) return
  loading.value = true
  try {
    const [listRes, pendingRes] = await Promise.all([
      foreshadowingApi.list(props.workId),
      foreshadowingApi.pendingResolutions(props.workId),
    ])
    if ((listRes.succeeded ?? listRes.successed) && listRes.data) items.value = listRes.data
    if ((pendingRes.succeeded ?? pendingRes.successed) && pendingRes.data) pendingCount.value = pendingRes.data.length
  } catch { /* ignored */ }
  loading.value = false
}

function startCreate() {
  isCreating.value = true
  editingId.value = 'new'
  form.value = { ...defaultForm }
}

function selectItem(item: ForeshadowingItem) {
  isCreating.value = false
  editingId.value = item.id
  form.value = {
    id: item.id,
    title: item.title,
    description: item.description,
    setupChapterId: item.setupChapterId,
    payoffChapterId: item.payoffChapterId,
    status: item.status || 'planted',
    importance: item.importance || 3,
  }
}

function closeForm() {
  editingId.value = null
  form.value = { ...defaultForm }
}

async function handleSave() {
  if (!form.value.title.trim()) return
  try {
    if (isCreating.value) {
      const res = await foreshadowingApi.create(props.workId, { title: form.value.title, description: form.value.description, status: form.value.status, importance: form.value.importance })
      if ((res.succeeded ?? res.successed) && res.data) {
        items.value.unshift(res.data)
        notify.success('伏笔已创建')
      }
    } else if (form.value.id) {
      const res = await foreshadowingApi.update(props.workId, form.value.id, { title: form.value.title, description: form.value.description, status: form.value.status, importance: form.value.importance })
      if ((res.succeeded ?? res.successed) && res.data) {
        const idx = items.value.findIndex(i => i.id === form.value.id)
        if (idx !== -1) items.value[idx] = res.data
        notify.success('伏笔已更新')
      }
    }
    closeForm()
    loadItems()
  } catch (e: any) {
    notify.error(e.message ?? '操作失败')
  }
}

async function handleDelete(item: ForeshadowingItem) {
  if (!confirm(`确认删除伏笔「${item.title}」？`)) return
  try {
    await foreshadowingApi.delete(props.workId, item.id)
    items.value = items.value.filter(i => i.id !== item.id)
    notify.success('伏笔已删除')
  } catch (e: any) {
    notify.error(e.message ?? '删除失败')
  }
}

watch(() => props.workId, () => { if (props.workId) loadItems() })
onMounted(() => { if (props.workId) loadItems() })
</script>

<style scoped>
.foreshadow-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-left: 1px solid #e5e7eb;
  overflow: hidden;
}

.fp-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0.875rem;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.fp-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #111827;
}

.fp-count {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-left: auto;
}

.fp-add-btn {
  width: 26px;
  height: 26px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  font-size: 1rem;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.fp-add-btn:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
  color: #111827;
}

.fp-pending-hint {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.875rem;
  background: #fffbeb;
  color: #d97706;
  font-size: 0.775rem;
  border-bottom: 1px solid #fef3c7;
}

.fp-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.fp-empty {
  padding: 2rem 1rem;
  text-align: center;
  color: #9ca3af;
  font-size: 0.8rem;
}

.fp-loading {
  display: flex;
  justify-content: center;
  gap: 4px;
  padding: 2rem;
}

.fp-dot {
  width: 6px;
  height: 6px;
  background: #c7d2fe;
  border-radius: 50%;
  animation: fp-bounce 1.2s infinite ease-in-out;
}

.fp-dot:nth-child(2) { animation-delay: 0.15s; }
.fp-dot:nth-child(3) { animation-delay: 0.3s; }

@keyframes fp-bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

.fp-item {
  padding: 0.6rem 0.75rem;
  border: 1px solid transparent;
  border-radius: 8px;
  margin-bottom: 0.35rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.fp-item:hover {
  background: #f9fafb;
  border-color: #e5e7eb;
}

.fp-item.active {
  background: #eef2ff;
  border-color: #c7d2fe;
}

.fp-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.fp-item-title {
  font-size: 0.825rem;
  font-weight: 500;
  color: #1f2937;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fp-item-actions {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
}

.fp-status-tag {
  font-size: 0.65rem;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.st-planted { background: #dbeafe; color: #1d4ed8; }
.st-hinted { background: #fef3c7; color: #d97706; }
.st-resolved { background: #d1fae5; color: #059669; }
.st-abandoned { background: #f3f4f6; color: #6b7280; }

.fp-item-del {
  background: none;
  border: none;
  color: #d1d5db;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: color 0.15s;
}

.fp-item-del:hover { color: #ef4444; }

.fp-item-desc {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0.25rem 0 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.fp-item-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.3rem;
}

.fp-importance { font-size: 0.7rem; }

.fp-star { color: #fbbf24; }

.fp-chapter-tag {
  font-size: 0.6rem;
  padding: 1px 5px;
  border-radius: 3px;
  background: #f3f4f6;
  color: #6b7280;
}

.fp-chapter-tag-payoff { background: #ede9fe; color: #7c3aed; }

/* ---- Form ---- */
.fp-form {
  border-top: 1px solid #e5e7eb;
  background: #fafbfc;
  flex-shrink: 0;
  max-height: 50%;
  overflow-y: auto;
}

.fp-form-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.875rem;
  border-bottom: 1px solid #f0f0f0;
}

.fp-form-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: #374151;
}

.fp-form-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #9ca3af;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.fp-form-close:hover { color: #6b7280; }

.fp-form-body {
  padding: 0.6rem 0.875rem;
}

.fp-field {
  margin-bottom: 0.6rem;
}

.fp-field label {
  display: block;
  font-size: 0.725rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
  font-weight: 500;
}

.required { color: #ef4444; }

.fp-input, .fp-textarea {
  width: 100%;
  padding: 0.4rem 0.6rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.8rem;
  outline: none;
  background: #fff;
  color: #111827;
  transition: border-color 0.15s;
}

.fp-input:focus, .fp-textarea:focus {
  border-color: #818cf8;
}

.fp-textarea {
  resize: vertical;
  min-height: 50px;
  font-family: inherit;
}

.fp-stars {
  display: flex;
  gap: 0.25rem;
}

.fp-star-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #e5e7eb;
  cursor: pointer;
  padding: 0;
  transition: color 0.15s;
}

.fp-star-btn.active { color: #fbbf24; }
.fp-star-btn:hover { color: #fcd34d; }

.fp-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem 0.75rem;
}

.fp-btn {
  padding: 0.35rem 0.85rem;
  border-radius: 6px;
  font-size: 0.775rem;
  cursor: pointer;
  border: none;
  transition: all 0.15s;
}

.fp-btn-cancel {
  background: #f3f4f6;
  color: #6b7280;
}

.fp-btn-cancel:hover { background: #e5e7eb; }

.fp-btn-save {
  background: #4f46e5;
  color: #fff;
}

.fp-btn-save:hover:not(:disabled) { background: #4338ca; }
.fp-btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.2s ease;
}

.slide-up-enter-from, .slide-up-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
