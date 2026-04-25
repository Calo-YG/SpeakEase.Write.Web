<template>
  <div class="ref-lib">
    <!-- 搜索 + 筛选区 -->
    <div class="ref-search-area">
      <div class="search-row">
        <!-- 搜索框 -->
        <div class="search-input-wrap">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            v-model="keyword"
            type="text"
            placeholder="搜索作品、作者或段落内容..."
            class="search-input"
            @input="onSearchInput"
          />
          <button v-if="keyword" class="search-clear" @click="keyword = ''">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- 场景筛选下拉 -->
        <div class="filter-wrap" ref="filterRef">
          <button class="filter-btn" @click.stop="showFilter = !showFilter">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            <span>{{ selectedScene || '全部' }}</span>
            <svg class="chevron" :class="{ open: showFilter }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>
          <Transition name="dropdown">
            <div v-if="showFilter" class="filter-dropdown">
              <button
                v-for="scene in sceneTypes"
                :key="scene"
                :class="['filter-option', { active: selectedScene === scene }]"
                @click="selectScene(scene)"
              >
                <span>{{ scene }}</span>
                <svg v-if="selectedScene === scene" class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </button>
            </div>
          </Transition>
        </div>

        <!-- 新增段落按钮 -->
        <button class="add-para-btn" @click="openAddModal">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          新增段落
        </button>
      </div>

      <!-- 热门标签 -->
      <div class="hot-tags">
        <span class="hot-tags-label">热门标签：</span>
        <button
          v-for="tag in hotTags"
          :key="tag"
          :class="['hot-tag', { active: activeHotTag === tag }]"
          @click="toggleHotTag(tag)"
        >{{ tag }}</button>
      </div>
    </div>

    <!-- 主体两栏 -->
    <div class="ref-body">
      <!-- 左侧段落列表 -->
      <div class="ref-main">
        <div class="section-header">
          <h2 class="section-title">热门段落</h2>
          <span class="section-count">共 {{ filteredParas.length }} 条</span>
        </div>

        <div v-if="filteredParas.length === 0" class="empty-state">
          <svg viewBox="0 0 64 64" fill="none" stroke="#d1d5db" stroke-width="2">
            <path d="M32 8c-13.25 0-24 10.75-24 24s10.75 24 24 24 24-10.75 24-24S45.25 8 32 8z"/>
            <path d="M20 32h24M28 24l-8 8 8 8"/>
          </svg>
          <p>暂无符合条件的段落</p>
        </div>

        <div class="para-list">
          <div v-for="p in filteredParas" :key="p.id" class="para-card">
            <!-- 卡片头部 -->
            <div class="para-card-head">
              <div class="para-meta">
                <span class="book-title">《{{ p.bookTitle }}》</span>
                <span class="book-author">{{ p.author }}</span>
                <span class="book-genre">{{ p.genre }}</span>
                <span :class="['scene-badge', `scene-${p.sceneType}`]">{{ p.sceneType }}</span>
              </div>
              <div class="para-actions">
                <button
                  :class="['action-btn', { favorited: p.favorited }]"
                  :title="p.favorited ? '取消收藏' : '收藏'"
                  @click="toggleFavorite(p)"
                >
                  <svg viewBox="0 0 24 24" :fill="p.favorited ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.8">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                  </svg>
                </button>
                <button class="action-btn" title="复制" @click="handleCopy(p)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                </button>
                <button class="action-btn action-btn-danger" title="删除" @click="handleDelete(p)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14H6L5 6"/>
                    <path d="M10 11v6"/><path d="M14 11v6"/>
                    <path d="M9 6V4h6v2"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- 段落引用内容 -->
            <blockquote class="para-content">{{ p.content }}</blockquote>

            <!-- 标签 + 统计 -->
            <div class="para-footer">
              <div class="para-tags">
                <span v-for="tag in p.tags" :key="tag" class="content-tag">{{ tag }}</span>
              </div>
              <div class="para-stats">
                <span class="stat-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                  {{ formatCount(p.reads) }}
                </span>
                <span class="stat-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  {{ formatCount(p.stars) }}
                </span>
                <span class="stat-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                  {{ formatCount(p.comments) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧边栏 -->
      <aside class="ref-sidebar">
        <!-- 数据统计 -->
        <div class="sidebar-card">
          <h3 class="sidebar-card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
            </svg>
            数据统计
          </h3>
          <div class="stat-row">
            <span class="stat-label">收录段落</span>
            <span class="stat-value">3,420</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">覆盖作品</span>
            <span class="stat-value">{{ coverCount }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">我的收藏</span>
            <span class="stat-value highlight">{{ favoritedCount }}</span>
          </div>
        </div>

        <!-- 使用技巧 -->
        <div class="sidebar-card">
          <h3 class="sidebar-card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            使用技巧
          </h3>
          <ol class="tips-list">
            <li>卡文时可以搜索相似场景的高分段落参考</li>
            <li>学习技巧解析，理解为什么写得好</li>
            <li>收藏喜欢的段落，建立自己的素材库</li>
            <li>不要直接复制，学习思路后自己创作</li>
          </ol>
        </div>

        <!-- AI 写作建议 -->
        <div class="sidebar-card sidebar-ai">
          <h3 class="sidebar-card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            AI 写作建议
          </h3>
          <p class="ai-desc">根据你当前的作品风格，AI 可以推荐适合学习的段落</p>
          <button class="ai-recommend-btn" @click="handleAiRecommend">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            获取个性化推荐
          </button>
        </div>
      </aside>
    </div>

    <!-- 新增段落弹窗 -->
    <Teleport to="body">
      <Transition name="confirm">
        <div v-if="showAddModal" class="add-modal-overlay" @click.self="closeAddModal">
          <Transition name="confirm-panel">
            <div v-if="showAddModal" class="add-modal-panel">
              <div class="add-modal-header">
                <h3 class="add-modal-title">新增参考段落</h3>
                <button class="add-modal-close" @click="closeAddModal">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <div class="add-modal-body">
                <div class="form-group">
                  <label class="form-label">作品名称 <span class="required">*</span></label>
                  <input v-model="form.bookTitle" type="text" class="form-input" placeholder="如：斗破苍穹" />
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">作者 <span class="required">*</span></label>
                    <input v-model="form.author" type="text" class="form-input" placeholder="如：天蚕土豆" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">题材</label>
                    <input v-model="form.genre" type="text" class="form-input" placeholder="如：玄幻" />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">场景类型 <span class="required">*</span></label>
                  <div class="scene-picker">
                    <button
                      v-for="scene in editableSceneTypes"
                      :key="scene"
                      :class="['scene-pick-btn', { active: form.sceneType === scene }]"
                      @click="form.sceneType = scene"
                    >{{ scene }}</button>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">段落内容 <span class="required">*</span></label>
                  <textarea v-model="form.content" class="form-textarea" rows="4" placeholder="输入参考段落内容..."></textarea>
                </div>
                <div class="form-group">
                  <label class="form-label">标签</label>
                  <input v-model="form.tagsStr" type="text" class="form-input" placeholder="用逗号分隔，如：热血, 金句, 世界观" />
                </div>
              </div>

              <div class="add-modal-footer">
                <button class="modal-btn modal-btn-cancel" @click="closeAddModal">取消</button>
                <button class="modal-btn modal-btn-submit" :disabled="!isFormValid" @click="submitAdd">添加段落</button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { referenceApi, type ReferencePassageItem as ApiPassageItem } from '@/lib/api'
import { useNotification } from '@/composables/useNotification'
import { useConfirm } from '@/composables/useConfirm'
import '../styles/ReferenceLibraryView.css'

const notify = useNotification()
const { confirm } = useConfirm()

// ==================== 数据类型 ====================
interface Paragraph {
  id: string
  bookTitle: string
  author: string
  genre: string
  sceneType: string
  content: string
  tags: string[]
  reads: number
  stars: number
  comments: number
  favorited: boolean
}

function apiToParagraph(api: ApiPassageItem): Paragraph {
  return {
    id: api.id,
    bookTitle: api.referenceWorkTitle,
    author: api.referenceWorkAuthor,
    genre: api.referenceWorkGenre,
    sceneType: api.passageType,
    content: api.content,
    tags: api.highlightTags,
    reads: api.recommendationCount,
    stars: api.favoriteCount,
    comments: 0,
    favorited: api.favoritedByMe,
  }
}

// ==================== 静态数据 ====================
const sceneTypes = ['全部', '开篇', '转折', '高潮', '战斗', '感情戏', '氛围描写', '智斗对话']
const editableSceneTypes = sceneTypes.filter(s => s !== '全部')
const hotTags = ['热血', '金句', '世界观', '励志', '悬疑', '甜宠', '虐心', '搞笑', '权谋']

let nextId = 100

const MOCK_PARAGRAPHS: Paragraph[] = [
  {
    id: '1',
    bookTitle: '斗破苍穹',
    author: '天蚕土豆',
    genre: '玄幻',
    sceneType: '开篇',
    content: '这里是属于斗气的世界，没有花俏艳丽的魔法，有的，仅仅是繁衍到巅峰的斗气！',
    tags: ['开篇', '世界观', '金句', '热血'],
    reads: 1200000, stars: 850000, comments: 45000, favorited: false,
  },
  {
    id: '2',
    bookTitle: '凡人修仙传',
    author: '忘语',
    genre: '仙侠',
    sceneType: '开篇',
    content: '一个普通的山村穷小子，偶然之下，跨入到一个江湖小门派，成了一名记名弟子。他以这样身份，如何在门派中立足，如何以平庸的资质进入到修仙者的行列？',
    tags: ['开篇', '凡人', '修仙', '励志'],
    reads: 980000, stars: 720000, comments: 38000, favorited: false,
  },
  {
    id: '3',
    bookTitle: '诡秘之主',
    author: '爱潜水的乌贼',
    genre: '玄幻',
    sceneType: '氛围描写',
    content: '灰蒙蒙的天空下，蒸汽与雾气交织，煤气路灯散发着昏黄的光芒。街道两旁的建筑高耸而阴森，仿佛一只只沉默的巨兽，注视着来来往往的行人。',
    tags: ['氛围描写', '悬疑', '蒸汽朋克'],
    reads: 870000, stars: 640000, comments: 29000, favorited: false,
  },
  {
    id: '4',
    bookTitle: '庆余年',
    author: '猫腻',
    genre: '历史',
    sceneType: '智斗对话',
    content: '范闲微微一笑，看着对面那双深邃的眼睛，心中已然将整个棋局算清。他缓缓开口道："陛下所虑，无非三点。臣已一一料定，请陛下明鉴。"',
    tags: ['权谋', '智斗', '金句'],
    reads: 760000, stars: 580000, comments: 22000, favorited: false,
  },
  {
    id: '5',
    bookTitle: '斗罗大陆',
    author: '唐家三少',
    genre: '玄幻',
    sceneType: '战斗',
    content: '唐三双眼赤红，体内神力如同决堤的洪流汹涌而出。昊天锤绽放出耀眼的金光，每一次挥动都带着山崩地裂之势，对手已无力招架，节节败退。',
    tags: ['战斗', '热血', '爽文'],
    reads: 1100000, stars: 790000, comments: 41000, favorited: false,
  },
  {
    id: '6',
    bookTitle: '择天记',
    author: '猫腻',
    genre: '玄幻',
    sceneType: '高潮',
    content: '陈长生站在星辰大道的尽头，仰望那道从未有人攀过的天门。他知道，那里有他的命运，有他来到这个世界的答案。哪怕前方是深渊，他也要走下去。',
    tags: ['高潮', '热血', '励志', '感人'],
    reads: 690000, stars: 510000, comments: 19000, favorited: false,
  },
  {
    id: '7',
    bookTitle: '遮天',
    author: '辰东',
    genre: '玄幻',
    sceneType: '感情戏',
    content: '她站在落日的余晖中，笑容如同春日里最温柔的风，让他恍惚觉得，走过漫长的岁月与黑暗，不过是为了此刻，站在她的身旁。',
    tags: ['感情戏', '甜宠', '虐心'],
    reads: 830000, stars: 620000, comments: 34000, favorited: false,
  },
  {
    id: '8',
    bookTitle: '三体',
    author: '刘慈欣',
    genre: '科幻',
    sceneType: '开篇',
    content: '宇宙很大，生命很小。但渺小的生命，却在这苍茫宇宙中燃起了文明的火光。黑暗森林里，每个文明都是带枪的猎人，悄悄跋涉，小心拨开挡路的树枝，因为与他同行的任何人都可能是猎物。',
    tags: ['世界观', '悬疑', '科幻', '金句'],
    reads: 940000, stars: 710000, comments: 36000, favorited: false,
  },
]

const paragraphs = ref<Paragraph[]>([])

async function loadPassages() {
  try {
    const result = await referenceApi.queryPassages({
      keyword: keyword.value.trim() || undefined,
      passageType: (selectedScene.value && selectedScene.value !== '全部') ? selectedScene.value : undefined,
      tag: activeHotTag.value || undefined,
    })
    if (result.succeeded ?? result.successed) {
      paragraphs.value = (result.data?.items ?? []).map(apiToParagraph)
      return
    }
  } catch { /* fallback */ }
  paragraphs.value = MOCK_PARAGRAPHS
}

// ==================== 状态 ====================
const keyword = ref('')
const selectedScene = ref('')
const activeHotTag = ref('')
const showFilter = ref(false)
const filterRef = ref<HTMLElement | null>(null)
let searchTimer: ReturnType<typeof setTimeout> | null = null

// ==================== 计算属性 ====================
const filteredParas = computed(() => {
  let list = paragraphs.value
  if (selectedScene.value && selectedScene.value !== '全部') {
    list = list.filter(p => p.sceneType === selectedScene.value)
  }
  if (activeHotTag.value) {
    list = list.filter(p => p.tags.includes(activeHotTag.value))
  }
  if (keyword.value.trim()) {
    const kw = keyword.value.trim().toLowerCase()
    list = list.filter(p =>
      p.bookTitle.toLowerCase().includes(kw) ||
      p.author.toLowerCase().includes(kw) ||
      p.content.toLowerCase().includes(kw)
    )
  }
  return list
})

const favoritedCount = computed(() => paragraphs.value.filter(p => p.favorited).length)

const coverCount = computed(() => {
  const books = new Set(paragraphs.value.map(p => p.bookTitle))
  return books.size
})

// ==================== 方法 ====================
function formatCount(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  return n.toLocaleString()
}

function selectScene(scene: string) {
  selectedScene.value = scene === '全部' ? '' : scene
  showFilter.value = false
  loadPassages()
}

function toggleHotTag(tag: string) {
  activeHotTag.value = activeHotTag.value === tag ? '' : tag
  loadPassages()
}

async function toggleFavorite(p: Paragraph) {
  try {
    const result = await referenceApi.toggleFavorite(p.id)
    if (result.succeeded ?? result.successed) {
      p.favorited = result.data ?? !p.favorited
      notify.success(p.favorited ? `已收藏「${p.bookTitle}」片段` : '已取消收藏')
      return
    }
  } catch { /* fallback */ }
  p.favorited = !p.favorited
  notify.success(p.favorited ? `已收藏「${p.bookTitle}」片段` : '已取消收藏')
}

async function handleCopy(p: Paragraph) {
  try {
    await navigator.clipboard.writeText(p.content)
    notify.success('段落已复制到剪贴板')
  } catch {
    notify.error('复制失败，请手动复制')
  }
}

function handleAiRecommend() {
  notify.info('AI 推荐功能即将上线')
}

// ==================== 新增段落弹窗 ====================
const showAddModal = ref(false)

const form = reactive({
  bookTitle: '',
  author: '',
  genre: '',
  sceneType: '',
  content: '',
  tagsStr: '',
})

const isFormValid = computed(() =>
  form.bookTitle.trim() !== '' &&
  form.author.trim() !== '' &&
  form.sceneType !== '' &&
  form.content.trim() !== ''
)

function openAddModal() {
  showAddModal.value = true
}

function closeAddModal() {
  showAddModal.value = false
  form.bookTitle = ''
  form.author = ''
  form.genre = ''
  form.sceneType = ''
  form.content = ''
  form.tagsStr = ''
}

async function submitAdd() {
  if (!isFormValid.value) return
  const tags = form.tagsStr
    .split(/[,，]/)
    .map(t => t.trim())
    .filter(Boolean)
  if (form.sceneType && !tags.includes(form.sceneType)) {
    tags.unshift(form.sceneType)
  }
  try {
    const result = await referenceApi.addPassage({
      bookTitle: form.bookTitle.trim(),
      author: form.author.trim(),
      genre: form.genre.trim() || undefined,
      passageType: form.sceneType,
      content: form.content.trim(),
      highlightTags: tags,
    })
    if (result.succeeded ?? result.successed) {
      notify.success(`已添加「${form.bookTitle.trim()}」参考段落`)
      closeAddModal()
      loadPassages()
      return
    }
  } catch { /* fallback */ }
  const newPara: Paragraph = {
    id: String(nextId++),
    bookTitle: form.bookTitle.trim(),
    author: form.author.trim(),
    genre: form.genre.trim() || '未分类',
    sceneType: form.sceneType,
    content: form.content.trim(),
    tags,
    reads: 0,
    stars: 0,
    comments: 0,
    favorited: false,
  }
  paragraphs.value.unshift(newPara)
  closeAddModal()
  notify.success(`已添加「${newPara.bookTitle}」参考段落`)
}

// ==================== 删除段落 ====================
async function handleDelete(p: Paragraph) {
  const ok = await confirm({
    title: '删除参考段落',
    message: `确定要删除「${p.bookTitle}」的参考段落吗？`,
    detail: '删除后将无法恢复，该段落将从参考库中移除。',
    confirmText: '删除',
    type: 'danger',
  })
  if (!ok) return
  try {
    const result = await referenceApi.deletePassage(p.id)
    if (result.succeeded ?? result.successed) {
      notify.success('已删除参考段落')
      loadPassages()
      return
    }
  } catch { /* fallback */ }
  const idx = paragraphs.value.findIndex(x => x.id === p.id)
  if (idx !== -1) {
    paragraphs.value.splice(idx, 1)
    notify.success('已删除参考段落')
  }
}

function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    loadPassages()
  }, 400)
}

function handleClickOutside(e: MouseEvent) {
  if (filterRef.value && !filterRef.value.contains(e.target as Node)) {
    showFilter.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  loadPassages()
})
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>
