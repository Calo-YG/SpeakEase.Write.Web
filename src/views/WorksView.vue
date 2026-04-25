<template>
  <div class="works-page">
    <!-- 页头 -->
    <div class="works-header">
      <div class="header-left">
        <h1 class="page-title">作品管理</h1>
        <span class="total-badge">共 {{ totalCount }} 部作品</span>
      </div>
      <div class="header-right">
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            v-model="keyword"
            type="text"
            placeholder="搜索作品名称或简介…"
            @input="onSearchInput"
          />
          <button v-if="keyword" class="clear-search" @click="clearSearch">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <button class="btn-new-work" @click="handleNewWork">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>新建作品</span>
        </button>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="state-center">
      <div class="spinner"></div>
      <span>加载中…</span>
    </div>

    <!-- 空状态 -->
    <div v-else-if="works.length === 0" class="state-center empty-state">
      <svg viewBox="0 0 80 80" fill="none" stroke="#d1d5db" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M16 64c16-8 32-24 48-48"/>
        <path d="M64 16C64 40 56 56 40 64 28 70 16 72 16 64z"/>
        <path d="M32 40c8 0 16-4 20-12"/>
      </svg>
      <p class="empty-title">{{ keyword ? '没有找到相关作品' : '还没有作品' }}</p>
      <p class="empty-sub">{{ keyword ? '换个关键词试试' : '点击「新建作品」开始你的创作之旅' }}</p>
      <button v-if="!keyword" class="btn-new-work" @click="handleNewWork">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span>新建作品</span>
      </button>
    </div>

    <!-- 作品卡片网格 -->
    <div v-else class="works-grid">
      <div v-for="w in works" :key="w.id" class="work-card">
        <!-- 封面 -->
        <div class="card-cover" :style="{ background: genreGradient(w.genre) }">
          <img v-if="w.coverUrl" :src="w.coverUrl" :alt="w.title" class="cover-img" />
          <div v-else class="cover-placeholder">
            <span class="cover-char">{{ w.title.slice(0, 1) }}</span>
          </div>
          <div class="cover-overlay">
            <span :class="['status-badge', statusClass(w.status)]">{{ statusLabel(w.status) }}</span>
          </div>
        </div>

        <!-- 卡片信息 -->
        <div class="card-body">
          <div class="card-genre-row">
            <span class="genre-tag">{{ w.genre }}</span>
            <span v-for="tag in w.styleTags.slice(0, 2)" :key="tag" class="style-tag">{{ tag }}</span>
          </div>
          <h3 class="card-title" :title="w.title">{{ w.title }}</h3>
          <p class="card-desc">{{ w.description || '暂无简介' }}</p>

          <!-- 统计 -->
          <div class="card-stats">
            <div class="stat-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              <span>{{ formatWords(w.totalWordCount) }}</span>
            </div>
            <div class="stat-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
              <span>{{ w.chapterCount }} 章</span>
            </div>
            <div class="stat-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              <span>{{ w.volumeCount }} 卷</span>
            </div>
          </div>

          <div class="card-updated">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>{{ formatTime(w.updatedAt) }}</span>
          </div>
        </div>

        <!-- 操作 -->
        <div class="card-actions">
          <button class="action-btn action-write" @click="handleWrite(w)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            继续创作
          </button>
          <button class="action-btn action-edit action-icon-btn" title="设置" @click="handleEdit(w)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
          </button>
          <button class="action-btn action-delete action-icon-btn" title="删除" @click="handleDelete(w)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="totalPages > 1" class="pagination">
      <button class="page-btn" :disabled="pageIndex === 1" @click="goPage(pageIndex - 1)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <button
        v-for="p in pageList"
        :key="p"
        :class="['page-btn', { active: p === pageIndex, ellipsis: p === -1 }]"
        :disabled="p === -1"
        @click="p !== -1 && goPage(p)"
      >{{ p === -1 ? '…' : p }}</button>
      <button class="page-btn" :disabled="pageIndex === totalPages" @click="goPage(pageIndex + 1)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
      <span class="page-info">{{ pageIndex }} / {{ totalPages }} 页，共 {{ totalCount }} 部</span>
    </div>

    <!-- AI 向导式创建作品 -->
    <CreateWorkWizard
      :visible="showCreateModal"
      @close="showCreateModal = false"
      @created="handleWorkCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { workApi, type WorkItem } from '@/lib/api'
import { useNotification } from '@/composables/useNotification'
import { useConfirm } from '@/composables/useConfirm'
import CreateWorkWizard from '@/components/CreateWorkWizard.vue'
import '../styles/WorksView.css'

const notify = useNotification()
const { confirm } = useConfirm()
const openEditor = inject<(work: WorkItem) => void>('openEditor')

// ==================== 状态 ====================
const works = ref<WorkItem[]>([])
const loading = ref(false)
const keyword = ref('')
const pageIndex = ref(1)
const pageSize = 12
const totalCount = ref(0)

let searchTimer: ReturnType<typeof setTimeout> | null = null

// ==================== 计算属性 ====================
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize) || 1)

const pageList = computed(() => {
  const total = totalPages.value
  const cur = pageIndex.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: number[] = [1]
  if (cur > 3) pages.push(-1)
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i)
  if (cur < total - 2) pages.push(-1)
  pages.push(total)
  return pages
})

// ==================== 数据加载 ====================
async function loadWorks() {
  loading.value = true
  try {
    const result = await workApi.query({
      keyword: keyword.value || undefined,
      pageIndex: pageIndex.value,
      pageSize,
    })
    if (result.succeeded ?? result.successed) {
      works.value = result.data?.items ?? []
      totalCount.value = result.data?.totalCount ?? 0
    } else {
      notify.error(result.message || '加载作品失败')
      // 后端未实现时展示 mock 数据
      useMockData()
    }
  } catch {
    // 后端未实现时展示 mock 数据
    useMockData()
  } finally {
    loading.value = false
  }
}

function useMockData() {
  const mock: WorkItem[] = [
    { id: '1', title: '星尘编年史', genre: '科幻', styleTags: ['硬科幻', '太空歌剧'], description: '人类文明扩张至整个银河系，却在边疆星域发现了一种能改写宇宙法则的古老遗迹……', totalWordCount: 28600, chapterCount: 24, volumeCount: 2, status: 'writing', createdAt: '2025-02-01', updatedAt: new Date(Date.now() - 7200000).toISOString() },
    { id: '2', title: '雾都迷踪', genre: '悬疑', styleTags: ['推理', '犯罪'], description: '一座被浓雾笼罩的孤岛上，连续发生了五起离奇命案，侦探叶书白独身前往，却发现这座岛隐藏着更深的秘密……', totalWordCount: 9200, chapterCount: 8, volumeCount: 1, status: 'writing', createdAt: '2025-03-10', updatedAt: new Date(Date.now() - 86400000).toISOString() },
    { id: '3', title: '花间辞', genre: '古风', styleTags: ['仙侠', '言情'], description: '她是化形千年的白狐，他是执掌生死的阎王，一段跨越三生三世的虐恋，终于在花开之时画下句点……', totalWordCount: 5000, chapterCount: 6, volumeCount: 1, status: 'writing', createdAt: '2025-04-01', updatedAt: new Date(Date.now() - 259200000).toISOString() },
    { id: '4', title: '钢铁玫瑰', genre: '都市', styleTags: ['商战', '女强'], description: '从一无所有的小镇女孩，到统御三大商业帝国的女王，她用十年时间证明——命运从不等人，只有自己才能书写传奇。', totalWordCount: 145000, chapterCount: 112, volumeCount: 4, status: 'completed', createdAt: '2024-06-15', updatedAt: new Date(Date.now() - 604800000).toISOString() },
    { id: '5', title: '末日方舟', genre: '末世', styleTags: ['丧尸', '生存'], description: '病毒爆发后的第三年，幸存者们建立了最后的堡垒，但内忧外患之下，人性的裂缝开始显现……', totalWordCount: 67000, chapterCount: 55, volumeCount: 3, status: 'hiatus', createdAt: '2024-10-20', updatedAt: new Date(Date.now() - 1296000000).toISOString() },
    { id: '6', title: '剑道至尊', genre: '玄幻', styleTags: ['修真', '爽文'], description: '废柴少年得天机传承，从此踏上剑道巅峰，俯瞰苍生！', totalWordCount: 320000, chapterCount: 280, volumeCount: 6, status: 'writing', createdAt: '2024-01-08', updatedAt: new Date(Date.now() - 43200000).toISOString() },
  ]
  const filtered = keyword.value
    ? mock.filter(w => w.title.includes(keyword.value) || w.description.includes(keyword.value))
    : mock
  const start = (pageIndex.value - 1) * pageSize
  works.value = filtered.slice(start, start + pageSize)
  totalCount.value = filtered.length
}

// ==================== 搜索 ====================
function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    pageIndex.value = 1
    loadWorks()
  }, 400)
}

function clearSearch() {
  keyword.value = ''
  pageIndex.value = 1
  loadWorks()
}

// ==================== 分页 ====================
function goPage(p: number) {
  pageIndex.value = p
  loadWorks()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ==================== 操作 ====================
// ==================== 新建作品 ====================
const showCreateModal = ref(false)
function handleNewWork() {
  showCreateModal.value = true
}

async function handleWorkCreated(data: Partial<WorkItem>) {
  try {
    const result = await workApi.create({
      title: data.title ?? '',
      genre: data.genre ?? '',
      styleTags: data.styleTags ?? [],
      description: data.description ?? '',
      coverUrl: data.coverUrl,
    })
    if (result.succeeded ?? result.successed) {
      notify.success('作品创建成功')
      loadWorks()
    } else {
      notify.error(result.message || '创建失败')
      fallbackCreateWork(data)
    }
  } catch {
    fallbackCreateWork(data)
  }
  showCreateModal.value = false
}

function fallbackCreateWork(data: Partial<WorkItem>) {
  const newWork: WorkItem = {
    id: `mock-${Date.now()}`,
    title: data.title ?? '',
    genre: data.genre ?? '',
    styleTags: data.styleTags ?? [],
    description: data.description ?? '',
    totalWordCount: 0,
    chapterCount: 0,
    volumeCount: 0,
    status: data.status ?? 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  works.value.unshift(newWork)
  totalCount.value += 1
}

function handleWrite(w: WorkItem) {
  openEditor?.(w)
}

function handleEdit(w: WorkItem) {
  // TODO: 打开作品设置弹窗，目前先调用 update 接口占位
  notify.info(`编辑「${w.title}」设置`)
}

async function handleDelete(w: WorkItem) {
  const ok = await confirm({
    title: '删除作品',
    message: `确定要删除「${w.title}」吗？`,
    detail: '此操作不可恢复，作品下所有章节、角色、大纲等内容将被永久删除。',
    confirmText: '删除',
    cancelText: '取消',
    type: 'danger',
  })
  if (!ok) return
  try {
    const result = await workApi.delete(w.id)
    if (result.succeeded ?? result.successed) {
      notify.success('删除成功')
      loadWorks()
    } else {
      notify.error(result.message || '删除失败')
    }
  } catch {
    notify.error('删除失败')
  }
}

// ==================== 工具函数 ====================
const genreColorMap: Record<string, string> = {
  '科幻': 'linear-gradient(135deg, #1e3a5f 0%, #0f2942 100%)',
  '玄幻': 'linear-gradient(135deg, #3b1f6b 0%, #1e0f45 100%)',
  '仙侠': 'linear-gradient(135deg, #4a1942 0%, #2d0f38 100%)',
  '古风': 'linear-gradient(135deg, #5c3317 0%, #3b1f0a 100%)',
  '悬疑': 'linear-gradient(135deg, #1a1a2e 0%, #0d0d1a 100%)',
  '末世': 'linear-gradient(135deg, #2d1b1b 0%, #1a0f0f 100%)',
  '都市': 'linear-gradient(135deg, #1a2f4a 0%, #0f1e30 100%)',
  '历史': 'linear-gradient(135deg, #3d2b1a 0%, #261a0e 100%)',
  '军事': 'linear-gradient(135deg, #1a2e1a 0%, #0f1e0f 100%)',
}

function genreGradient(genre: string): string {
  return genreColorMap[genre] || 'linear-gradient(135deg, #2d2d3a 0%, #1a1a26 100%)'
}

function statusLabel(s: string): string {
  const map: Record<string, string> = { writing: '连载中', completed: '已完结', hiatus: '暂停更新', draft: '草稿' }
  return map[s] || s
}

function statusClass(s: string): string {
  const map: Record<string, string> = { writing: 'status-writing', completed: 'status-completed', hiatus: 'status-hiatus', draft: 'status-draft' }
  return map[s] || ''
}

function formatWords(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万字'
  return n.toLocaleString() + '字'
}

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} 分钟前`
  const hours = Math.floor(diff / 3600000)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(diff / 86400000)
  if (days < 30) return `${days} 天前`
  return new Date(iso).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}

// ==================== 生命周期 ====================
onMounted(() => { loadWorks() })
</script>
