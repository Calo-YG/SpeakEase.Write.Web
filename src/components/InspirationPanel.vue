<template>
  <div class="inspiration-panel">
    <div class="ip-header">
      <span class="ip-title">灵感笔记</span>
      <span class="ip-count">{{ activeItems.length }} 条</span>
      <button v-if="archivedItems.length > 0" class="ip-archive-toggle" @click="showArchived = !showArchived">
        {{ showArchived ? '隐藏归档' : `归档(${archivedItems.length})` }}
      </button>
      <button class="ip-add-btn" @click="startCreate" title="记录灵感">+</button>
    </div>

    <div class="ip-list">
      <div v-if="displayItems.length === 0 && !loading" class="ip-empty">
        <p>{{ showArchived ? '暂无归档灵感' : '暂无灵感，点击 + 记录' }}</p>
      </div>
      <div v-if="loading" class="ip-loading">
        <span class="ip-dot"></span><span class="ip-dot"></span><span class="ip-dot"></span>
      </div>
      <div
        v-for="item in displayItems"
        :key="item.id"
        :class="['ip-item', { archived: item.isArchived, active: editingId === item.id }]"
        @click="selectItem(item)"
      >
        <div class="ip-item-head">
          <span class="ip-item-title">{{ item.title }}</span>
          <div class="ip-item-actions">
            <span v-if="item.inspirationType" class="ip-type-tag">{{ typeLabel(item.inspirationType) }}</span>
            <button class="ip-archive-btn" @click.stop="handleArchive(item)" :title="item.isArchived ? '取消归档' : '归档'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
              </svg>
            </button>
            <button class="ip-item-del" @click.stop="handleDelete(item)" title="删除">&times;</button>
          </div>
        </div>
        <p v-if="item.content" class="ip-item-content">{{ item.content }}</p>
        <span v-if="item.source" class="ip-item-source">来源: {{ item.source }}</span>
      </div>
    </div>

    <Transition name="slide-up">
      <div v-if="editingId !== null" class="ip-form">
        <div class="ip-form-head">
          <span class="ip-form-title">{{ isCreating ? '记录灵感' : '编辑灵感' }}</span>
          <button class="ip-form-close" @click="closeForm">&times;</button>
        </div>
        <div class="ip-form-body">
          <div class="ip-field">
            <label>标题 <span class="required">*</span></label>
            <input v-model="form.title" class="ip-input" placeholder="灵感标题" maxlength="50" />
          </div>
          <div class="ip-field">
            <label>内容</label>
            <textarea v-model="form.content" class="ip-textarea" rows="3" placeholder="灵感详情..." maxlength="2000" />
          </div>
          <div class="ip-field">
            <label>类型</label>
            <select v-model="form.inspirationType" class="ip-input">
              <option value="idea">灵感</option>
              <option value="reference">参考</option>
              <option value="scene">场景</option>
              <option value="dialogue">对话</option>
              <option value="other">其他</option>
            </select>
          </div>
          <div class="ip-field">
            <label>来源</label>
            <input v-model="form.source" class="ip-input" placeholder="灵感来源" maxlength="100" />
          </div>
        </div>
        <div class="ip-form-actions">
          <button class="ip-btn ip-btn-cancel" @click="closeForm">取消</button>
          <button class="ip-btn ip-btn-save" :disabled="!form.title.trim()" @click="handleSave">
            {{ isCreating ? '记录' : '保存' }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { inspirationApi, type InspirationItem, type SaveInspirationRequest } from '@/lib/api'
import { useNotification } from '@/composables/useNotification'

const props = defineProps<{ workId: string }>()
const notify = useNotification()

const items = ref<InspirationItem[]>([])
const loading = ref(false)
const editingId = ref<string | null>(null)
const isCreating = ref(false)
const showArchived = ref(false)

const form = ref<SaveInspirationRequest & { id?: string }>({
  title: '',
  content: '',
  inspirationType: 'idea',
  source: '',
})

const defaultForm: SaveInspirationRequest = { title: '', content: '', inspirationType: 'idea', source: '' }

const activeItems = computed(() => items.value.filter(i => !i.isArchived))
const archivedItems = computed(() => items.value.filter(i => i.isArchived))
const displayItems = computed(() => showArchived.value ? items.value : activeItems.value)

function typeLabel(t: string) {
  const map: Record<string, string> = { idea: '灵感', reference: '参考', scene: '场景', dialogue: '对话', other: '其他' }
  return map[t] ?? t
}

async function loadItems() {
  if (!props.workId) return
  loading.value = true
  try {
    const res = await inspirationApi.list(props.workId)
    if ((res.succeeded ?? res.successed) && res.data) items.value = res.data
  } catch { /* ignored */ }
  loading.value = false
}

function startCreate() {
  isCreating.value = true
  editingId.value = 'new'
  form.value = { ...defaultForm }
}

function selectItem(item: InspirationItem) {
  isCreating.value = false
  editingId.value = item.id
  form.value = {
    id: item.id,
    title: item.title,
    content: item.content,
    inspirationType: item.inspirationType || 'idea',
    source: item.source || '',
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
      const res = await inspirationApi.create(props.workId, { title: form.value.title, content: form.value.content, inspirationType: form.value.inspirationType, source: form.value.source })
      if ((res.succeeded ?? res.successed) && res.data) {
        items.value.unshift(res.data)
        notify.success('灵感已记录')
      }
    } else if (form.value.id) {
      const res = await inspirationApi.update(props.workId, form.value.id, { title: form.value.title, content: form.value.content, inspirationType: form.value.inspirationType, source: form.value.source })
      if ((res.succeeded ?? res.successed) && res.data) {
        const idx = items.value.findIndex(i => i.id === form.value.id)
        if (idx !== -1) items.value[idx] = res.data
        notify.success('灵感已更新')
      }
    }
    closeForm()
    loadItems()
  } catch (e: any) {
    notify.error(e.message ?? '操作失败')
  }
}

async function handleArchive(item: InspirationItem) {
  try {
    const newArchived = !item.isArchived
    const res = await inspirationApi.archive(props.workId, item.id, newArchived)
    if ((res.succeeded ?? res.successed)) {
      const idx = items.value.findIndex(i => i.id === item.id)
      if (idx !== -1) items.value[idx] = { ...items.value[idx], isArchived: newArchived }
      notify.success(newArchived ? '已归档' : '已取消归档')
    }
  } catch (e: any) {
    notify.error(e.message ?? '操作失败')
  }
}

async function handleDelete(item: InspirationItem) {
  if (!confirm(`确认删除灵感「${item.title}」？`)) return
  try {
    await inspirationApi.delete(props.workId, item.id)
    items.value = items.value.filter(i => i.id !== item.id)
    notify.success('灵感已删除')
  } catch (e: any) {
    notify.error(e.message ?? '删除失败')
  }
}

watch(() => props.workId, () => { if (props.workId) loadItems() })
onMounted(() => { if (props.workId) loadItems() })
</script>

<style scoped>
.inspiration-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-left: 1px solid #e5e7eb;
  overflow: hidden;
}

.ip-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0.875rem;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.ip-title { font-size: 0.9rem; font-weight: 600; color: #111827; }
.ip-count { font-size: 0.75rem; color: #9ca3af; }

.ip-archive-toggle {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 4px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  color: #6b7280;
  cursor: pointer;
  margin-left: auto;
  transition: all 0.15s;
}
.ip-archive-toggle:hover { background: #e5e7eb; }

.ip-add-btn {
  width: 26px; height: 26px;
  border: 1px solid #e5e7eb; border-radius: 6px;
  background: #fff; font-size: 1rem; color: #6b7280;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.ip-add-btn:hover { background: #f3f4f6; border-color: #d1d5db; color: #111827; }

.ip-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.ip-empty { padding: 2rem 1rem; text-align: center; color: #9ca3af; font-size: 0.8rem; }

.ip-loading { display: flex; justify-content: center; gap: 4px; padding: 2rem; }
.ip-dot { width: 6px; height: 6px; background: #c7d2fe; border-radius: 50%; animation: ip-bounce 1.2s infinite ease-in-out; }
.ip-dot:nth-child(2) { animation-delay: 0.15s; }
.ip-dot:nth-child(3) { animation-delay: 0.3s; }
@keyframes ip-bounce { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }

.ip-item {
  padding: 0.6rem 0.75rem;
  border: 1px solid transparent;
  border-radius: 8px;
  margin-bottom: 0.35rem;
  cursor: pointer;
  transition: all 0.15s;
}
.ip-item:hover { background: #f9fafb; border-color: #e5e7eb; }
.ip-item.active { background: #eef2ff; border-color: #c7d2fe; }
.ip-item.archived { opacity: 0.55; }

.ip-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.ip-item-title {
  font-size: 0.825rem;
  font-weight: 500;
  color: #1f2937;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ip-item-actions { display: flex; align-items: center; gap: 0.35rem; flex-shrink: 0; }

.ip-type-tag {
  font-size: 0.6rem;
  padding: 1px 6px;
  border-radius: 4px;
  background: #fef3c7;
  color: #d97706;
  font-weight: 500;
}

.ip-archive-btn, .ip-item-del {
  background: none; border: none; color: #d1d5db;
  cursor: pointer; padding: 0; line-height: 1;
  transition: color 0.15s;
  display: flex; align-items: center;
}
.ip-archive-btn:hover { color: #6366f1; }
.ip-item-del { font-size: 1.1rem; }
.ip-item-del:hover { color: #ef4444; }

.ip-item-content {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0.25rem 0 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}

.ip-item-source {
  font-size: 0.65rem;
  color: #9ca3af;
  font-style: italic;
  margin-top: 0.2rem;
  display: block;
}

/* ---- Form ---- */
.ip-form {
  border-top: 1px solid #e5e7eb;
  background: #fafbfc;
  flex-shrink: 0;
  max-height: 55%;
  overflow-y: auto;
}

.ip-form-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.6rem 0.875rem; border-bottom: 1px solid #f0f0f0;
}
.ip-form-title { font-size: 0.8rem; font-weight: 600; color: #374151; }
.ip-form-close { background: none; border: none; font-size: 1.2rem; color: #9ca3af; cursor: pointer; padding: 0; line-height: 1; }
.ip-form-close:hover { color: #6b7280; }

.ip-form-body { padding: 0.6rem 0.875rem; }

.ip-field { margin-bottom: 0.6rem; }
.ip-field label { display: block; font-size: 0.725rem; color: #6b7280; margin-bottom: 0.25rem; font-weight: 500; }
.required { color: #ef4444; }

.ip-input, .ip-textarea {
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
.ip-input:focus, .ip-textarea:focus { border-color: #818cf8; }

.ip-textarea { resize: vertical; min-height: 60px; font-family: inherit; }

.ip-form-actions {
  display: flex; justify-content: flex-end; gap: 0.5rem;
  padding: 0.5rem 0.875rem 0.75rem;
}

.ip-btn { padding: 0.35rem 0.85rem; border-radius: 6px; font-size: 0.775rem; cursor: pointer; border: none; transition: all 0.15s; }
.ip-btn-cancel { background: #f3f4f6; color: #6b7280; }
.ip-btn-cancel:hover { background: #e5e7eb; }
.ip-btn-save { background: #4f46e5; color: #fff; }
.ip-btn-save:hover:not(:disabled) { background: #4338ca; }
.ip-btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

.slide-up-enter-active, .slide-up-leave-active { transition: all 0.2s ease; }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translateY(8px); }
</style>
