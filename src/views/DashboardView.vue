<template>
  <div class="dashboard">
    <!-- Hero welcome -->
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-greeting">{{ greeting }}</h1>
        <p class="hero-sub">
          <span class="typewriter">{{ typewriterText }}<span class="cursor">|</span></span>
        </p>
      </div>
      <div class="hero-quill">
        <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 56c8-4 16-12 24-28C36 12 44 4 56 4c0 12-4 28-16 40-8 8-20 12-32 12z"/>
          <path d="M8 56c4-8 12-16 28-24"/>
          <path d="M32 32l8 8"/>
        </svg>
      </div>
    </section>

    <div class="dashboard-body">
      <!-- Stats row -->
      <section class="stats-row">
        <div class="stat-card">
          <div class="stat-icon stat-icon-purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.words.toLocaleString() }}</span>
            <span class="stat-label">累计字数</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon-blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.works }}</span>
            <span class="stat-label">创作作品</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon-amber">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.days }}</span>
            <span class="stat-label">创作天数</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon-green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.aiCalls }}</span>
            <span class="stat-label">AI 协作次数</span>
          </div>
        </div>
      </section>

      <!-- Two-column: Recent works + Daily prompt -->
      <section class="two-col">
        <!-- 左侧：最近创作 + 标签云 -->
        <div class="col-stack">
          <div class="panel">
            <div class="panel-head">
              <h2>最近创作</h2>
              <button class="btn-ghost">查看全部</button>
            </div>
            <div class="panel-body">
              <div v-if="recentWorks.length === 0" class="empty-state">
                <svg viewBox="0 0 48 48" fill="none" stroke="#d1d5db" stroke-width="1.5" stroke-linecap="round"><path d="M8 40c8-4 16-12 24-24C32 8 40 4 44 4c0 8-4 20-12 28-6 6-14 8-24 8z"/><path d="M8 40c4-8 12-16 24-24"/></svg>
                <p>还没有作品，开始你的第一段故事吧</p>
              </div>
              <div v-else class="works-list">
                <div v-for="w in recentWorks" :key="w.id" class="work-item">
                  <div class="work-color" :style="{ background: w.color }"></div>
                  <div class="work-info">
                    <span class="work-title">{{ w.title }}</span>
                    <span class="work-meta">{{ w.genre }} · {{ w.words.toLocaleString() }} 字 · {{ w.updatedAt }}</span>
                  </div>
                  <div class="work-progress">
                    <div class="progress-track"><div class="progress-fill" :style="{ width: w.progress + '%' }"></div></div>
                    <span class="progress-label">{{ w.progress }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 标签云 -->
          <div class="panel tag-cloud-panel">
            <div class="panel-head">
              <h2>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                热门标签
              </h2>
              <button class="btn-ghost">标签管理</button>
            </div>
            <div class="tag-cloud-body">
              <button
                v-for="tag in featuredTags"
                :key="tag.id"
                class="tag-chip"
                :style="{ '--tag-color': tag.color }"
              >
                <span class="tag-chip-dot"></span>
                <span class="tag-chip-name">{{ tag.name }}</span>
                <span class="tag-chip-count">{{ tag.usageCount }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 右侧：今日灵感 + 参考库精选 -->
        <div class="col-stack">
          <div class="panel prompt-panel">
            <div class="panel-head">
              <h2>今日灵感</h2>
              <button class="btn-icon" @click="refreshPrompt" title="换一个">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
              </button>
            </div>
            <div class="prompt-body">
              <p class="prompt-text">{{ currentPrompt }}</p>
            </div>
          </div>

          <div class="panel ref-preview-panel">
            <div class="panel-head">
              <h2>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
                参考库精选
              </h2>
              <button class="btn-ghost">查看全部</button>
            </div>
            <div class="ref-preview-list">
              <div v-for="item in featuredRefs" :key="item.id" class="ref-preview-item">
                <div class="ref-preview-head">
                  <span class="ref-book">《{{ item.bookTitle }}》</span>
                  <span :class="['ref-scene-badge', `scene-${item.sceneType}`]">{{ item.sceneType }}</span>
                  <button class="ref-copy-btn" title="复制" @click="copyRef(item.content)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="13" height="13">
                      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                    </svg>
                  </button>
                </div>
                <p class="ref-preview-text">{{ item.content }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Writing tip -->
      <section class="tip-bar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <span>{{ writingTip }}</span>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { dashboardApi, tagApi, referenceApi, type TagItem as ApiTagItem, type ReferencePassageItem as ApiPassageItem } from '@/lib/api'
import { useNotification } from '@/composables/useNotification'
import '../styles/DashboardView.css'

const notify = useNotification()

// ==================== Greeting ====================
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了，创作者'
  if (h < 12) return '早安，创作者'
  if (h < 14) return '午安，创作者'
  if (h < 18) return '下午好，创作者'
  return '晚上好，创作者'
})

// ==================== Typewriter ====================
const phrases = [
  '每一笔，都是你灵魂的印记',
  '故事因你而生动，世界因你而鲜活',
  '介入其中，赋予巧妙构思',
  '你的笔，定义下一个世界',
]
const typewriterText = ref('')
let phraseIdx = 0
let charIdx = 0
let deleting = false
let twTimer: ReturnType<typeof setTimeout> | null = null

function tickTypewriter() {
  const phrase = phrases[phraseIdx]
  if (!deleting) {
    charIdx++
    typewriterText.value = phrase.slice(0, charIdx)
    if (charIdx >= phrase.length) {
      deleting = true
      twTimer = setTimeout(tickTypewriter, 2400)
      return
    }
    twTimer = setTimeout(tickTypewriter, 80)
  } else {
    charIdx--
    typewriterText.value = phrase.slice(0, charIdx)
    if (charIdx <= 0) {
      deleting = false
      phraseIdx = (phraseIdx + 1) % phrases.length
      twTimer = setTimeout(tickTypewriter, 400)
      return
    }
    twTimer = setTimeout(tickTypewriter, 35)
  }
}

// ==================== Stats ====================
const stats = ref({ words: 42800, works: 3, days: 17, aiCalls: 56 })

async function loadStats() {
  try {
    const result = await dashboardApi.getStats()
    if (result.succeeded ?? result.successed) {
      const d = result.data
      stats.value = { words: d.totalWords, works: d.workCount, days: d.creationDays, aiCalls: d.aiCallCount }
    }
  } catch { /* fallback mock */ }
}

// ==================== Recent works ====================
const MOCK_RECENT = [
  { id: '1', title: '星尘编年史', genre: '科幻', words: 28600, progress: 62, updatedAt: '2小时前', color: '#8b5cf6' },
  { id: '2', title: '雾都迷踪', genre: '悬疑', words: 9200, progress: 28, updatedAt: '昨天', color: '#3b82f6' },
  { id: '3', title: '花间辞', genre: '古风', words: 5000, progress: 15, updatedAt: '3天前', color: '#f59e0b' },
]
const recentWorks = ref([...MOCK_RECENT])

async function loadRecentWorks() {
  try {
    const result = await dashboardApi.getRecentWorks(5)
    if (result.succeeded ?? result.successed) {
      const genreColors: Record<string, string> = { '科幻': '#8b5cf6', '悬疑': '#3b82f6', '古风': '#f59e0b', '玄幻': '#6366f1', '都市': '#3b82f6', '末世': '#ef4444' }
      recentWorks.value = (result.data ?? []).map(w => ({
        id: w.id,
        title: w.title,
        genre: w.genre,
        words: w.totalWordCount,
        progress: Math.min(100, Math.round(w.totalWordCount / 500)),
        updatedAt: formatRelativeTime(w.updatedAt),
        color: genreColors[w.genre] ?? '#64748b',
      }))
    }
  } catch { /* fallback mock */ }
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} 分钟前`
  const hours = Math.floor(diff / 3600000)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(diff / 86400000)
  if (days < 30) return `${days} 天前`
  return new Date(iso).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}

// ==================== Daily prompts ====================
const prompts = [
  '一位失忆的天文学家在望远镜中看到了自己的名字，刻在一颗尚未被发现的星球上。',
  '每天午夜，图书馆的第七排书架会自动多出一本没有署名的书，而书的下一章，总是写着你昨天的生活。',
  '她发现咖啡杯里的拉花图案，是某个平行世界的地图，而那个世界的她正在寻找出路。',
  '雨夜，旧书店的店主翻开一本从未进货的书，扉页上写着他的名字和明天的日期。',
  '城市突然沉入地下，居民们发现地表之下有着比天空更广阔的世界。',
  '一封来自200年后的信出现在你的信箱里，信中只有一句话：请不要打开第七扇门。',
  '画家的每一幅画都会在第二天变成现实，直到他画了一幅空白的画布。',
  '音乐家谱写的旋律能让时间倒流，但每次使用，他都会失去一段记忆。',
]
const currentPrompt = ref(prompts[0])

function refreshPrompt() {
  const next = prompts[Math.floor(Math.random() * prompts.length)]
  currentPrompt.value = next
}

// ==================== Writing tips ====================
const tips = [
  '好的角色不是完美的，而是让人愿意陪伴的。',
  '冲突是故事的引擎，没有冲突就没有叙事的张力。',
  '把读者放进场景，而不是告诉他们场景长什么样。',
  '结尾不必解答所有问题，但应让读者觉得值得这段旅程。',
  '对话是角色性格的镜子，每个人都有自己的说话方式。',
  '伏笔是承诺，读者期待你在后面兑现它。',
]
const writingTip = ref(tips[Math.floor(Math.random() * tips.length)])

// ==================== Featured tags (热门标签) ====================
const MOCK_TAGS = [
  { id: '1', name: '开篇',   color: '#6366f1', usageCount: 128 },
  { id: '2', name: '热血',   color: '#ef4444', usageCount: 203 },
  { id: '3', name: '金句',   color: '#eab308', usageCount: 156 },
  { id: '4', name: '高潮',   color: '#f97316', usageCount: 94  },
  { id: '5', name: '战斗',   color: '#ef4444', usageCount: 112 },
  { id: '6', name: '世界观', color: '#6366f1', usageCount: 89  },
  { id: '7', name: '感情戏', color: '#ec4899', usageCount: 67  },
  { id: '8', name: '悬疑',   color: '#8b5cf6', usageCount: 62  },
  { id: '9', name: '氛围描写',color: '#14b8a6', usageCount: 73 },
  { id: '10', name: '励志',  color: '#f97316', usageCount: 76  },
  { id: '11', name: '甜宠',  color: '#ec4899', usageCount: 54  },
  { id: '12', name: '权谋',  color: '#0ea5e9', usageCount: 29  },
  { id: '13', name: '智斗',  color: '#22c55e', usageCount: 45  },
  { id: '14', name: '搞笑',  color: '#22c55e', usageCount: 37  },
  { id: '15', name: '虐心',  color: '#64748b', usageCount: 41  },
]
const featuredTags = ref([...MOCK_TAGS])

async function loadHotTags() {
  try {
    const result = await tagApi.getHotTags(15)
    if (result.succeeded ?? result.successed) {
      featuredTags.value = (result.data ?? []).map(t => ({ id: t.id, name: t.name, color: t.color, usageCount: t.usageCount }))
    }
  } catch { /* fallback mock */ }
}

// ==================== Featured refs (参考库精选) ====================
const MOCK_REFS = [
  { id: 'r1', bookTitle: '诡秘之主', sceneType: '氛围描写', content: '灰蒙蒙的天空下，蒸汽与雾气交织，煤气路灯散发着昏黄的光芒。街道两旁的建筑高耸而阴森，仿佛一只只沉默的巨兽，注视着来来往往的行人。' },
  { id: 'r2', bookTitle: '庆余年', sceneType: '智斗对话', content: '范闲微微一笑，看着对面那双深邃的眼睛，心中已然将整个棋局算清。他缓缓开口道："陛下所虑，无非三点。臣已一一料定，请陛下明鉴。"' },
  { id: 'r3', bookTitle: '遮天', sceneType: '感情戏', content: '她站在落日的余晖中，笑容如同春日里最温柔的风，让他恍惚觉得，走过漫长的岁月与黑暗，不过是为了此刻，站在她的身旁。' },
]
const featuredRefs = ref([...MOCK_REFS])

async function loadFeaturedRefs() {
  try {
    const result = await referenceApi.queryPassages({ pageSize: 3 })
    if (result.succeeded ?? result.successed) {
      featuredRefs.value = (result.data?.items ?? []).map(p => ({
        id: p.id,
        bookTitle: p.referenceWorkTitle,
        sceneType: p.passageType,
        content: p.content,
      }))
    }
  } catch { /* fallback mock */ }
}

async function copyRef(content: string) {
  try {
    await navigator.clipboard.writeText(content)
    notify.success('段落已复制到剪贴板')
  } catch {
    notify.error('复制失败，请手动复制')
  }
}

// ==================== Lifecycle ====================
onMounted(() => {
  tickTypewriter()
  loadStats()
  loadRecentWorks()
  loadHotTags()
  loadFeaturedRefs()
})
onUnmounted(() => { if (twTimer) clearTimeout(twTimer) })
</script>


