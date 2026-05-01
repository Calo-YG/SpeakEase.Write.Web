<template>
  <div class="timeline-panel">
    <div class="tp-header">
      <span class="tp-title">时间线</span>
      <span class="tp-count">{{ items.length }} 个事件</span>
      <button class="tp-add-btn" @click="startCreate" title="新建事件">+</button>
    </div>

    <div class="tp-list">
      <div v-if="items.length === 0 && !loading" class="tp-empty">
        <p>暂无时间线事件，点击 + 创建</p>
      </div>
      <div v-if="loading" class="tp-loading">
        <span class="tp-dot"></span><span class="tp-dot"></span><span class="tp-dot"></span>
      </div>
      <div
        v-for="(item, idx) in sortedItems"
        :key="item.id"
        :class="['tp-item', { active: editingId === item.id }]"
        @click="selectItem(item)"
      >
        <div class="tp-connector">
          <span class="tp-dot-line"></span>
          <span class="tp-dot-circle"></span>
        </div>
        <div class="tp-item-body">
          <div class="tp-item-head">
            <span class="tp-item-title">{{ item.title }}</span>
            <div class="tp-item-actions">
              <span v-if="item.eventType" class="tp-type-tag">{{ typeLabel(item.eventType) }}</span>
              <button class="tp-item-del" @click.stop="handleDelete(item)" title="删除">&times;</button>
            </div>
          </div>
          <span v-if="item.eventTime" class="tp-item-time">{{ item.eventTime }}</span>
          <p v-if="item.description" class="tp-item-desc">{{ item.description }}</p>
        </div>
      </div>
    </div>

    <Transition name="slide-up">
      <div v-if="editingId !== null" class="tp-form">
        <div class="tp-form-head">
          <span class="tp-form-title">{{ isCreating ? '新建事件' : '编辑事件' }}</span>
          <button class="tp-form-close" @click="closeForm">&times;</button>
        </div>
        <div class="tp-form-body">
          <div class="tp-field">
            <label>标题 <span class="required">*</span></label>
            <input v-model="form.title" class="tp-input" placeholder="事件名称" maxlength="50" />
          </div>
          <div class="tp-field">
            <label>时间</label>
            <input v-model="form.eventTime" class="tp-input" placeholder="如：第三天傍晚 / 历元203年" maxlength="50" />
          </div>
          <div class="tp-field">
            <label>类型</label>
            <select v-model="form.eventType" class="tp-input">
              <option value="plot">剧情</option>
              <option value="character">角色</option>
              <option value="world">世界</option>
              <option value="backstory">背景</option>
            </select>
          </div>
          <div class="tp-field">
            <label>描述</label>
            <textarea v-model="form.description" class="tp-textarea" rows="2" placeholder="事件详情" maxlength="500" />
          </div>
        </div>
        <div class="tp-form-actions">
          <button class="tp-btn tp-btn-cancel" @click="closeForm">取消</button>
          <button class="tp-btn tp-btn-save" :disabled="!form.title.trim()" @click="handleSave">
            {{ isCreating ? '创建' : '保存' }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { timelineApi, type TimelineEventItem, type SaveTimelineEventRequest } from '@/lib/api'
import { useNotification } from '@/composables/useNotification'

const props = defineProps<{ workId: string }>()
const notify = useNotification()

const items = ref<TimelineEventItem[]>([])
const loading = ref(false)
const editingId = ref<string | null>(null)
const isCreating = ref(false)

const form = ref<SaveTimelineEventRequest & { id?: string }>({
  title: '',
  description: '',
  eventTime: '',
  eventType: 'plot',
})

const defaultForm: SaveTimelineEventRequest = { title: '', description: '', eventTime: '', eventType: 'plot' }

const sortedItems = computed(() =>
  [...items.value].sort((a, b) => (a.eventTime || '').localeCompare(b.eventTime || ''))
)

function typeLabel(t: string) {
  const map: Record<string, string> = { plot: '剧情', character: '角色', world: '世界', backstory: '背景' }
  return map[t] ?? t
}

async function loadItems() {
  if (!props.workId) return
  loading.value = true
  try {
    const res = await timelineApi.list(props.workId)
    if ((res.succeeded ?? res.successed) && res.data) items.value = res.data
  } catch { /* ignored */ }
  loading.value = false
}

function startCreate() {
  isCreating.value = true
  editingId.value = 'new'
  form.value = { ...defaultForm }
}

function selectItem(item: TimelineEventItem) {
  isCreating.value = false
  editingId.value = item.id
  form.value = {
    id: item.id,
    title: item.title,
    description: item.description,
    eventTime: item.eventTime || '',
    eventType: item.eventType || 'plot',
    relatedCharacterIds: item.relatedCharacterIds,
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
      const res = await timelineApi.create(props.workId, { title: form.value.title, description: form.value.description, eventTime: form.value.eventTime, eventType: form.value.eventType })
      if ((res.succeeded ?? res.successed) && res.data) {
        items.value.unshift(res.data)
        notify.success('事件已创建')
      }
    } else if (form.value.id) {
      const res = await timelineApi.update(props.workId, form.value.id, { title: form.value.title, description: form.value.description, eventTime: form.value.eventTime, eventType: form.value.eventType })
      if ((res.succeeded ?? res.successed) && res.data) {
        const idx = items.value.findIndex(i => i.id === form.value.id)
        if (idx !== -1) items.value[idx] = res.data
        notify.success('事件已更新')
      }
    }
    closeForm()
    loadItems()
  } catch (e: any) {
    notify.error(e.message ?? '操作失败')
  }
}

async function handleDelete(item: TimelineEventItem) {
  if (!confirm(`确认删除事件「${item.title}」？`)) return
  try {
    await timelineApi.delete(props.workId, item.id)
    items.value = items.value.filter(i => i.id !== item.id)
    notify.success('事件已删除')
  } catch (e: any) {
    notify.error(e.message ?? '删除失败')
  }
}

watch(() => props.workId, () => { if (props.workId) loadItems() })
onMounted(() => { if (props.workId) loadItems() })
</script>

<style scoped>
.timeline-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-left: 1px solid #e5e7eb;
  overflow: hidden;
}

.tp-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0.875rem;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.tp-title { font-size: 0.9rem; font-weight: 600; color: #111827; }
.tp-count { font-size: 0.75rem; color: #9ca3af; margin-left: auto; }

.tp-add-btn {
  width: 26px; height: 26px;
  border: 1px solid #e5e7eb; border-radius: 6px;
  background: #fff; font-size: 1rem; color: #6b7280;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.tp-add-btn:hover { background: #f3f4f6; border-color: #d1d5db; color: #111827; }

.tp-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem;
}

.tp-empty { padding: 2rem 1rem; text-align: center; color: #9ca3af; font-size: 0.8rem; }

.tp-loading { display: flex; justify-content: center; gap: 4px; padding: 2rem; }
.tp-dot { width: 6px; height: 6px; background: #c7d2fe; border-radius: 50%; animation: tp-bounce 1.2s infinite ease-in-out; }
.tp-dot:nth-child(2) { animation-delay: 0.15s; }
.tp-dot:nth-child(3) { animation-delay: 0.3s; }
@keyframes tp-bounce { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }

.tp-item {
  display: flex;
  gap: 0.65rem;
  padding: 0.4rem 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
  margin-bottom: 0.15rem;
}
.tp-item:hover { background: #f9fafb; }
.tp-item.active { background: #eef2ff; }

.tp-connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 12px;
  flex-shrink: 0;
  padding-top: 0.35rem;
}

.tp-dot-line {
  width: 2px;
  flex: 1;
  background: #e5e7eb;
}

.tp-dot-circle {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #818cf8;
  flex-shrink: 0;
}

.tp-item:first-child .tp-dot-line { background: transparent; }

.tp-item-body { flex: 1; min-width: 0; }

.tp-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.tp-item-title {
  font-size: 0.825rem;
  font-weight: 500;
  color: #1f2937;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tp-item-actions { display: flex; align-items: center; gap: 0.35rem; flex-shrink: 0; }

.tp-type-tag {
  font-size: 0.6rem;
  padding: 1px 6px;
  border-radius: 4px;
  background: #ede9fe;
  color: #7c3aed;
  font-weight: 500;
}

.tp-item-del {
  background: none; border: none; color: #d1d5db;
  font-size: 1.1rem; cursor: pointer; padding: 0; line-height: 1;
  transition: color 0.15s;
}
.tp-item-del:hover { color: #ef4444; }

.tp-item-time { font-size: 0.7rem; color: #9ca3af; }

.tp-item-desc {
  font-size: 0.725rem;
  color: #6b7280;
  margin: 0.2rem 0 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ---- Form ---- */
.tp-form {
  border-top: 1px solid #e5e7eb;
  background: #fafbfc;
  flex-shrink: 0;
  max-height: 50%;
  overflow-y: auto;
}

.tp-form-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.6rem 0.875rem; border-bottom: 1px solid #f0f0f0;
}
.tp-form-title { font-size: 0.8rem; font-weight: 600; color: #374151; }
.tp-form-close { background: none; border: none; font-size: 1.2rem; color: #9ca3af; cursor: pointer; padding: 0; line-height: 1; }
.tp-form-close:hover { color: #6b7280; }

.tp-form-body { padding: 0.6rem 0.875rem; }

.tp-field { margin-bottom: 0.6rem; }
.tp-field label { display: block; font-size: 0.725rem; color: #6b7280; margin-bottom: 0.25rem; font-weight: 500; }
.required { color: #ef4444; }

.tp-input, .tp-textarea {
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
.tp-input:focus, .tp-textarea:focus { border-color: #818cf8; }

.tp-textarea { resize: vertical; min-height: 50px; font-family: inherit; }

.tp-form-actions {
  display: flex; justify-content: flex-end; gap: 0.5rem;
  padding: 0.5rem 0.875rem 0.75rem;
}

.tp-btn { padding: 0.35rem 0.85rem; border-radius: 6px; font-size: 0.775rem; cursor: pointer; border: none; transition: all 0.15s; }
.tp-btn-cancel { background: #f3f4f6; color: #6b7280; }
.tp-btn-cancel:hover { background: #e5e7eb; }
.tp-btn-save { background: #4f46e5; color: #fff; }
.tp-btn-save:hover:not(:disabled) { background: #4338ca; }
.tp-btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

.slide-up-enter-active, .slide-up-leave-active { transition: all 0.2s ease; }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translateY(8px); }
</style>
