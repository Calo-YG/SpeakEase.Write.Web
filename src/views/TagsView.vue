<template>
  <div class="tags-page">
    <!-- 顶栏：搜索 + 分类 + 新增 -->
    <div class="tags-toolbar">
      <div class="toolbar-left">
        <div class="search-input-wrap">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input v-model="keyword" type="text" placeholder="搜索标签名称..." class="search-input" />
          <button v-if="keyword" class="search-clear" @click="keyword = ''">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="category-tabs">
          <button :class="['cat-tab', { active: category === '' }]" @click="category = ''">全部</button>
          <button :class="['cat-tab', { active: category === 'scene' }]" @click="category = 'scene'">场景标签</button>
          <button :class="['cat-tab', { active: category === 'content' }]" @click="category = 'content'">内容标签</button>
        </div>
      </div>
      <button class="add-tag-btn" @click="openModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        新增标签
      </button>
    </div>

    <!-- 统计摘要 -->
    <div class="tags-summary">
      <div class="summary-item">
        <span class="summary-num">{{ tags.length }}</span>
        <span class="summary-label">标签总数</span>
      </div>
      <div class="summary-item">
        <span class="summary-num">{{ sceneCount }}</span>
        <span class="summary-label">场景标签</span>
      </div>
      <div class="summary-item">
        <span class="summary-num">{{ contentCount }}</span>
        <span class="summary-label">内容标签</span>
      </div>
    </div>

    <!-- 标签网格 -->
    <div v-if="filteredTags.length === 0" class="empty-state">
      <svg viewBox="0 0 64 64" fill="none" stroke="#d1d5db" stroke-width="2">
        <path d="M20 44V20h24v24H20z"/><path d="M28 32h8M32 28v8"/>
      </svg>
      <p>暂无标签</p>
    </div>

    <div class="tags-grid">
      <div v-for="tag in filteredTags" :key="tag.id" class="tag-card">
        <div class="tag-card-head">
          <div class="tag-identity">
            <span class="tag-color-dot" :style="{ background: tag.color }"></span>
            <span class="tag-name">{{ tag.name }}</span>
          </div>
          <span :class="['tag-cat-badge', `cat-${tag.category}`]">
            {{ tag.category === 'scene' ? '场景' : '内容' }}
          </span>
        </div>
        <p v-if="tag.description" class="tag-desc">{{ tag.description }}</p>
        <div class="tag-card-footer">
          <span class="tag-usage">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            引用 {{ tag.usageCount }} 次
          </span>
          <div class="tag-actions">
            <button class="tag-action-btn" title="编辑" @click="openModal(tag)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="tag-action-btn tag-action-danger" title="删除" @click="handleDelete(tag)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14H6L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/>
                <path d="M9 6V4h6v2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增 / 编辑弹窗 -->
    <Teleport to="body">
      <Transition name="confirm">
        <div v-if="showModal" class="tag-modal-overlay" @click.self="closeModal">
          <Transition name="confirm-panel">
            <div v-if="showModal" class="tag-modal-panel">
              <div class="tag-modal-header">
                <h3 class="tag-modal-title">{{ editingId ? '编辑标签' : '新增标签' }}</h3>
                <button class="tag-modal-close" @click="closeModal">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>

              <div class="tag-modal-body">
                <div class="form-group">
                  <label class="form-label">标签名称 <span class="required">*</span></label>
                  <input v-model="form.name" type="text" class="form-input" placeholder="如：开篇、热血" />
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">分类 <span class="required">*</span></label>
                    <div class="cat-picker">
                      <button :class="['cat-pick-btn', { active: form.category === 'scene' }]" @click="form.category = 'scene'">场景标签</button>
                      <button :class="['cat-pick-btn', { active: form.category === 'content' }]" @click="form.category = 'content'">内容标签</button>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">颜色</label>
                    <div class="color-picker">
                      <button
                        v-for="c in colorOptions"
                        :key="c"
                        :class="['color-dot', { active: form.color === c }]"
                        :style="{ background: c }"
                        @click="form.color = c"
                      ></button>
                    </div>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">描述</label>
                  <textarea v-model="form.description" class="form-textarea" rows="2" placeholder="标签用途说明（可选）"></textarea>
                </div>
              </div>

              <div class="tag-modal-footer">
                <button class="modal-btn modal-btn-cancel" @click="closeModal">取消</button>
                <button class="modal-btn modal-btn-submit" :disabled="!isFormValid" @click="submitForm">
                  {{ editingId ? '保存修改' : '添加标签' }}
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { tagApi, type TagItem as ApiTagItem } from '@/lib/api'
import { useNotification } from '@/composables/useNotification'
import { useConfirm } from '@/composables/useConfirm'
import '../styles/TagsView.css'

const notify = useNotification()
const { confirm } = useConfirm()

// ==================== 数据类型 ====================
interface TagItem {
  id: string
  name: string
  category: 'scene' | 'content'
  color: string
  description: string
  usageCount: number
}

function apiToTagItem(api: ApiTagItem): TagItem {
  return { id: api.id, name: api.name, category: api.category, color: api.color, description: api.description, usageCount: api.usageCount }
}

// ==================== 颜色选项 ====================
const colorOptions = [
  '#6366f1', '#8b5cf6', '#a855f7', '#ec4899',
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#3b82f6', '#0ea5e9', '#64748b',
]

// ==================== Mock 数据 ====================
let nextId = 100

const MOCK_TAGS: TagItem[] = [
  { id: '1', name: '开篇', category: 'scene', color: '#6366f1', description: '故事开局、引入背景的段落', usageCount: 128 },
  { id: '2', name: '转折', category: 'scene', color: '#3b82f6', description: '剧情走向发生重大变化的段落', usageCount: 86 },
  { id: '3', name: '高潮', category: 'scene', color: '#f97316', description: '情节最紧张激烈的段落', usageCount: 94 },
  { id: '4', name: '战斗', category: 'scene', color: '#ef4444', description: '打斗、对战场面的段落', usageCount: 112 },
  { id: '5', name: '感情戏', category: 'scene', color: '#ec4899', description: '情感互动、感情描写的段落', usageCount: 67 },
  { id: '6', name: '氛围描写', category: 'scene', color: '#14b8a6', description: '环境气氛渲染的段落', usageCount: 73 },
  { id: '7', name: '智斗对话', category: 'scene', color: '#22c55e', description: '人物间策略性对话的段落', usageCount: 45 },
  { id: '8', name: '热血', category: 'content', color: '#ef4444', description: '充满激情和斗志的内容标签', usageCount: 203 },
  { id: '9', name: '金句', category: 'content', color: '#eab308', description: '经典语句、名言金句', usageCount: 156 },
  { id: '10', name: '世界观', category: 'content', color: '#6366f1', description: '世界设定相关内容', usageCount: 89 },
  { id: '11', name: '励志', category: 'content', color: '#f97316', description: '激励人心的内容标签', usageCount: 76 },
  { id: '12', name: '悬疑', category: 'content', color: '#8b5cf6', description: '悬疑、谜团相关内容', usageCount: 62 },
  { id: '13', name: '甜宠', category: 'content', color: '#ec4899', description: '甜蜜宠溺的内容标签', usageCount: 54 },
  { id: '14', name: '虐心', category: 'content', color: '#64748b', description: '令人心痛伤感的内容', usageCount: 41 },
  { id: '15', name: '搞笑', category: 'content', color: '#22c55e', description: '幽默有趣的内容标签', usageCount: 37 },
  { id: '16', name: '权谋', category: 'content', color: '#0ea5e9', description: '政治斗争、权术谋略相关', usageCount: 29 },
]

const tags = ref<TagItem[]>([])

async function loadTags() {
  try {
    const result = await tagApi.list({
      keyword: keyword.value.trim() || undefined,
      category: category.value || undefined,
    })
    if (result.succeeded ?? result.successed) {
      tags.value = (result.data ?? []).map(apiToTagItem)
      return
    }
  } catch { /* fallback */ }
  tags.value = MOCK_TAGS
}

// ==================== 状态 ====================
const keyword = ref('')
const category = ref<'' | 'scene' | 'content'>('')

const showModal = ref(false)
const editingId = ref<string | null>(null)

const form = reactive({
  name: '',
  category: 'scene' as 'scene' | 'content',
  color: '#6366f1',
  description: '',
})

// ==================== 计算属性 ====================
const filteredTags = computed(() => {
  let list = tags.value
  if (category.value) {
    list = list.filter(t => t.category === category.value)
  }
  if (keyword.value.trim()) {
    const kw = keyword.value.trim().toLowerCase()
    list = list.filter(t => t.name.toLowerCase().includes(kw))
  }
  return list
})

const sceneCount = computed(() => tags.value.filter(t => t.category === 'scene').length)
const contentCount = computed(() => tags.value.filter(t => t.category === 'content').length)

const isFormValid = computed(() => form.name.trim() !== '')

// ==================== 方法 ====================
function openModal(tag?: TagItem) {
  if (tag) {
    editingId.value = tag.id
    form.name = tag.name
    form.category = tag.category
    form.color = tag.color
    form.description = tag.description
  } else {
    editingId.value = null
    form.name = ''
    form.category = 'scene'
    form.color = '#6366f1'
    form.description = ''
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingId.value = null
}

async function submitForm() {
  if (!isFormValid.value) return

  if (editingId.value) {
    // 更新
    try {
      const result = await tagApi.update(editingId.value, {
        name: form.name.trim(),
        category: form.category,
        color: form.color,
        description: form.description.trim(),
      })
      if (result.succeeded ?? result.successed) {
        notify.success(`标签「${form.name.trim()}」已更新`)
        loadTags()
      } else {
        notify.error(result.message || '更新失败')
        fallbackUpdateTag()
      }
    } catch {
      fallbackUpdateTag()
    }
  } else {
    // 新增
    try {
      const result = await tagApi.create({
        name: form.name.trim(),
        category: form.category,
        color: form.color,
        description: form.description.trim(),
      })
      if (result.succeeded ?? result.successed) {
        notify.success(`标签「${form.name.trim()}」已添加`)
        loadTags()
      } else {
        notify.error(result.message || '创建失败')
        fallbackAddTag()
      }
    } catch {
      fallbackAddTag()
    }
  }
  closeModal()
}

function fallbackUpdateTag() {
  const idx = tags.value.findIndex(t => t.id === editingId.value)
  if (idx !== -1) {
    tags.value[idx] = {
      ...tags.value[idx],
      name: form.name.trim(),
      category: form.category,
      color: form.color,
      description: form.description.trim(),
    }
  }
}

function fallbackAddTag() {
  tags.value.unshift({
    id: String(nextId++),
    name: form.name.trim(),
    category: form.category,
    color: form.color,
    description: form.description.trim(),
    usageCount: 0,
  })
}

async function handleDelete(tag: TagItem) {
  const ok = await confirm({
    title: '删除标签',
    message: `确定要删除标签「${tag.name}」吗？`,
    detail: `该标签当前被引用 ${tag.usageCount} 次，删除后将不再可用。`,
    confirmText: '删除',
    type: 'danger',
  })
  if (!ok) return
  try {
    const result = await tagApi.delete(tag.id)
    if (result.succeeded ?? result.successed) {
      notify.success(`标签「${tag.name}」已删除`)
      loadTags()
      return
    }
  } catch { /* fallback */ }
  const idx = tags.value.findIndex(t => t.id === tag.id)
  if (idx !== -1) {
    tags.value.splice(idx, 1)
    notify.success(`标签「${tag.name}」已删除`)
  }
}

// ==================== 生命周期 ====================
onMounted(() => { loadTags() })
</script>
