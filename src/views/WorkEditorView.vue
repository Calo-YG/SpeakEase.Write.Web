<template>
  <div class="work-editor-view" :style="editorCssVars">
    <!-- 顶部导航栏 -->
    <EditorTopBar
      :work-title="work?.title ?? '未命名作品'"
      :genre="work?.genre ?? ''"
      :chapter-title="activeChapter?.title ?? ''"
      :word-count="currentWordCount"
      :daily-count="dailyWordCount"
      :is-fullscreen="isFullscreen"
      :show-settings="showSettings"
      @back="$emit('back')"
      @save="handleSave"
      @toggle-fullscreen="handleToggleFullscreen"
      @settings="showSettings = !showSettings"
    />

    <!-- 主体布局：侧边栏 + 编辑区 + AI对话面板 -->
    <div class="editor-layout">
      <!-- 章节侧边栏 -->
      <ChapterSidebar
        :chapters="chapters"
        :active-chapter-id="activeChapterId"
        @select="handleSelectChapter"
        @new-chapter="openNewChapterModal"
      />

      <!-- 右侧编辑区 -->
      <div class="editor-main">
        <!-- AI 工具栏 -->
        <EditorToolbar
          :show-characters="rightPanel === 'characters'"
          :show-outline="rightPanel === 'outline'"
          :show-ai-chat="rightPanel === 'ai'"
          :work-title="work?.title"
          :work-genre="work?.genre"
          :chapter-title="activeChapter?.title"
          :chapter-content="chapterContents[activeChapterId] ?? ''"
          @ai-continue="handleAiContinue"
          @ai-write="handleAiWrite"
          @polish="handlePolish"
          @inspire="handleInspire"
          @toggle-characters="rightPanel = rightPanel === 'characters' ? '' : 'characters'"
          @toggle-outline="rightPanel = rightPanel === 'outline' ? '' : 'outline'"
          @toggle-ai-chat="rightPanel = rightPanel === 'ai' ? '' : 'ai'"
        />

        <!-- 内容区 -->
        <div class="editor-content-area" @click="focusEditor">
          <!-- 空章节提示 -->
          <div v-if="isChapterEmpty && !hasContent" class="chapter-empty">
            <div class="chapter-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="13" x2="12" y2="17"/>
                <line x1="10" y1="15" x2="14" y2="15"/>
              </svg>
            </div>
            <p class="chapter-empty-title">本章节还没有内容</p>
            <p class="chapter-empty-sub">开始写作，或使用 AI 写本章快速生成内容</p>
            <button class="chapter-empty-btn" @click="focusEditor">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              开始写作
            </button>
          </div>

          <!-- 文档容器 -->
          <div class="editor-doc-wrapper">
            <!-- 可编辑章节标题 -->
            <div
              ref="titleRef"
              class="editor-doc-title"
              contenteditable="true"
              spellcheck="false"
              data-placeholder="章节标题…"
              @input="onTitleInput"
              @keydown.enter.prevent="focusEditor"
            ></div>

            <!-- 正文编辑区 -->
            <div
              ref="editorRef"
              class="editor-doc"
              contenteditable="true"
              spellcheck="false"
              :data-placeholder="'在这里开始你的故事…'"
              @input="onDocInput"
              @keydown="onDocKeydown"
            ></div>
          </div>
        </div>
      </div>

      <!-- 右侧面板 Tab 切换 -->
      <div v-if="rightPanel" class="editor-right-panels">
        <!-- <div class="right-tab-bar">
          <button :class="['right-tab', { active: rightPanel === 'ai' }]" @click="rightPanel = rightPanel === 'ai' ? '' : 'ai'" title="AI 助手">AI</button>
          <button :class="['right-tab', { active: rightPanel === 'characters' }]" @click="rightPanel = rightPanel === 'characters' ? '' : 'characters'" title="角色">角色</button>
          <button :class="['right-tab', { active: rightPanel === 'outline' }]" @click="rightPanel = rightPanel === 'outline' ? '' : 'outline'" title="大纲">大纲</button>
        </div> -->

        <Transition name="panel-slide">
          <AiChatPanel
            v-if="rightPanel === 'ai'"
            :work="work"
            :chapter="activeChapter"
            :chapter-content="chapterContents[activeChapterId] ?? ''"
            @close="rightPanel = ''"
          />
          <CharacterPanel
            v-else-if="rightPanel === 'characters'"
            :work-id="work?.id ?? ''"
            :work-title="work?.title ?? ''"
            :work-genre="work?.genre ?? ''"
          />
          <OutlinePanel
            v-else-if="rightPanel === 'outline'"
            :work-id="work?.id ?? ''"
            :work-title="work?.title ?? ''"
            :work-genre="work?.genre ?? ''"
            :chapter-title="activeChapter?.title ?? ''"
            :chapter-content="chapterContents[activeChapterId] ?? ''"
          />
        </Transition>
      </div>
    </div>

    <!-- 编辑器设置面板 -->
    <EditorSettingsPanel
      :show="showSettings"
      :model-value="editorSettings"
      @close="showSettings = false"
      @reset="resetSettings"
      @update:model-value="editorSettings = $event"
    />

    <!-- 新建章节弹窗 -->
    <Teleport to="body">
      <Transition name="confirm">
        <div v-if="showNewChapterModal" class="new-chapter-modal-overlay" @click.self="showNewChapterModal = false">
          <Transition name="confirm-panel">
            <div v-if="showNewChapterModal" class="new-chapter-modal">
              <p class="ncm-title">新建章节</p>
              <div class="form-group">
                <label class="form-label">章节名称 <span class="required">*</span></label>
                <input
                  ref="newChapterInputRef"
                  v-model="newChapterTitle"
                  type="text"
                  class="form-input"
                  placeholder="如：第五章：试炼"
                  maxlength="50"
                  @keydown.enter="confirmNewChapter"
                />
              </div>
              <div class="ncm-actions">
                <button class="modal-btn modal-btn-cancel" @click="showNewChapterModal = false">取消</button>
                <button
                  class="modal-btn modal-btn-submit"
                  :disabled="!newChapterTitle.trim()"
                  @click="confirmNewChapter"
                >创建</button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import type { WorkItem } from '@/lib/api'
import { chapterApi, autoSaveApi, type ChapterItem as ApiChapterItem, type ChapterDetail } from '@/lib/api'
import { useNotification } from '@/composables/useNotification'
import EditorTopBar from '@/components/EditorTopBar.vue'
import ChapterSidebar from '@/components/ChapterSidebar.vue'
import type { ChapterItem } from '@/components/ChapterSidebar.vue'
import EditorToolbar from '@/components/EditorToolbar.vue'
import AiChatPanel from '@/components/AiChatPanel.vue'
import CharacterPanel from '@/components/CharacterPanel.vue'
import OutlinePanel from '@/components/OutlinePanel.vue'
import EditorSettingsPanel from '@/components/EditorSettingsPanel.vue'
import type { EditorSettings } from '@/components/EditorSettingsPanel.vue'
import '../styles/WorkEditorView.css'
import '../styles/WorksView.css'

// ==================== Props / Emits ====================
const props = defineProps<{ work: WorkItem | null }>()
defineEmits<{ back: [] }>()

const notify = useNotification()

// ==================== 章节数据 ====================
const MOCK_CHAPTERS: ChapterItem[] = [
  { id: 'ch1', title: '第一章：觉醒', wordCount: 3200, badge: 'published' },
  { id: 'ch2', title: '第二章：测试', wordCount: 2800, badge: 'published' },
  { id: 'ch3', title: '第三章：冲突', wordCount: 3500, badge: 'published' },
  { id: 'ch4', title: '第四章：突破', wordCount: 0, badge: 'draft', note: '未开始' },
]

const MOCK_CHAPTER_CONTENTS: Record<string, string> = {
  ch1: `<p>清晨的薄雾还未散去，林凡便已站在了宗门武场的中央。</p><p>今日是一年一度的武魂觉醒大典，对于每一名年满十八的弟子来说，这一天将决定他们未来数十年乃至一生的命运。</p><p>宗门长老高坐于台上，目光扫过台下密密麻麻的年轻面孔，最终落在了角落里那个略显孤单的少年身上。<span class="ai-text">那是林凡——林家旁系中最不起眼的一个。</span></p>`,
  ch2: `<p>觉醒仪式结束后的第三天，林凡被通知前往试炼塔接受初级测试。</p><p>试炼塔共有十二层，每一层都封印着对应等级的凶兽残影。对于刚刚觉醒的新生弟子而言，能够通过前三层，便已算得上中等资质。</p><p><span class="ai-text">然而林凡在第五层停下了脚步——不是因为力竭，而是因为他感受到了某种异样。</span></p>`,
  ch3: `<p>消息传开的速度比林凡预想的要快得多。</p><p>不到半天，整个宗门便已人尽皆知：那个一直被视为废物的林家旁系子弟，在试炼塔中打破了近二十年来的最高记录。</p><p>有人嫉妒，有人不信，也有人开始悄悄改变对他的看法。<span class="ai-text">而那些曾经嘲笑过他的人，此刻的神情却是格外的精彩。</span></p>`,
  ch4: `<p>林凡站在测试台前，深吸一口气。今天是他<span class="ai-text">十八岁</span>的生日，<span class="ai-text">也是觉醒武魂的日子</span>。</p><p>"下一个，林凡！"</p><p>听到自己的名字，林凡迈步走上前去。周围传来窃窃私语声，大多是嘲笑和不屑。作为林家旁系子弟，他的地位本就低下，更何况父母早逝，<span class="ai-text">更是无依无常</span>。</p><p>但林凡并不在意<span class="ai-text">这些。他伸出手，按在觉醒石上</span>。</p>`,
}

const chapters = ref<ChapterItem[]>([])
const chapterContents: Record<string, string> = {}
const activeChapterId = ref('')
const activeChapter = computed(() => chapters.value.find(c => c.id === activeChapterId.value) ?? null)

function apiToChapterItem(api: ApiChapterItem): ChapterItem {
  const badgeMap: Record<string, 'draft' | 'published' | 'review'> = { draft: 'draft', published: 'published', review: 'review' }
  return {
    id: api.id,
    title: api.title,
    wordCount: api.wordCount,
    badge: badgeMap[api.status] ?? 'draft',
    note: api.authorNotes || undefined,
  }
}

async function loadChapters() {
  const workId = props.work?.id
  if (!workId) {
    chapters.value = MOCK_CHAPTERS
    Object.assign(chapterContents, MOCK_CHAPTER_CONTENTS)
    activeChapterId.value = 'ch4'
    nextTick(() => loadChapterContent(activeChapterId.value))
    return
  }
  try {
    const result = await chapterApi.list(workId)
    if (result.succeeded ?? result.successed) {
      chapters.value = (result.data ?? []).map(apiToChapterItem)
      if (chapters.value.length > 0) {
        activeChapterId.value = chapters.value[chapters.value.length - 1].id
        nextTick(() => {
          loadChapterContent(activeChapterId.value)
          // 记录今日字数基准（第一次加载时存入 localStorage）
          const today = new Date().toISOString().slice(0, 10)
          const key = `daily_wc_${workId}_${today}`
          if (!localStorage.getItem(key)) {
            const totalWords = (result.data ?? []).reduce((sum, c) => sum + c.wordCount, 0)
            localStorage.setItem(key, String(totalWords))
          }
        })
      }
      return
    }
  } catch { /* fallback */ }
  chapters.value = MOCK_CHAPTERS
  Object.assign(chapterContents, MOCK_CHAPTER_CONTENTS)
  activeChapterId.value = 'ch4'
  nextTick(() => loadChapterContent(activeChapterId.value))
}

// ==================== 编辑器 ====================
const editorRef = ref<HTMLElement | null>(null)
const titleRef = ref<HTMLElement | null>(null)
const dailyWordCount = computed(() => {
  const workId = props.work?.id ?? 'mock'
  const today = new Date().toISOString().slice(0, 10)
  const key = `daily_wc_${workId}_${today}`
  const baseline = parseInt(localStorage.getItem(key) ?? '0', 10)
  // baseline = 今天开始时的字数，current - baseline = 今日增量
  const current = currentWordCount.value
  return Math.max(0, current - baseline)
})

const currentWordCount = computed(() => {
  const text = editorRef.value?.innerText ?? ''
  return text.replace(/\s/g, '').length
})

const hasContent = computed(() => {
  const ch = activeChapterId.value
  return !!(chapterContents[ch]?.trim())
})

const isChapterEmpty = computed(() => !hasContent.value)

function loadChapterContent(chId: string) {
  if (!editorRef.value) return
  editorRef.value.innerHTML = chapterContents[chId] ?? ''
  // 同步章节标题
  if (titleRef.value) {
    const ch = chapters.value.find(c => c.id === chId)
    titleRef.value.innerText = ch?.title ?? ''
  }
}

function onTitleInput() {
  const newTitle = titleRef.value?.innerText?.trim() ?? ''
  const ch = chapters.value.find(c => c.id === activeChapterId.value)
  if (ch && newTitle) ch.title = newTitle
}

function onDocInput() {
  const chId = activeChapterId.value
  chapterContents[chId] = editorRef.value?.innerHTML ?? ''
  const ch = chapters.value.find(c => c.id === chId)
  if (ch) ch.wordCount = currentWordCount.value
  markDirty()
}

function onDocKeydown(e: KeyboardEvent) {
  // 保存快捷键
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    handleSave()
  }
}

function focusEditor() {
  editorRef.value?.focus()
}

// ==================== 章节切换 ====================
async function handleSelectChapter(ch: ChapterItem) {
  // 保存当前章节
  chapterContents[activeChapterId.value] = editorRef.value?.innerHTML ?? ''
  activeChapterId.value = ch.id

  // 如果本地缓存有内容则直接用，否则尝试从 API 加载
  if (chapterContents[ch.id]) {
    nextTick(() => loadChapterContent(ch.id))
    return
  }
  const workId = props.work?.id
  if (workId) {
    try {
      const result = await chapterApi.getDetail(workId, ch.id)
      if (result.succeeded ?? result.successed) {
        chapterContents[ch.id] = result.data?.content ?? ''
        nextTick(() => loadChapterContent(ch.id))
        return
      }
    } catch { /* fallback to empty */ }
  }
  nextTick(() => loadChapterContent(ch.id))
}

// ==================== 新建章节 ====================
const showNewChapterModal = ref(false)
const newChapterTitle = ref('')
const newChapterInputRef = ref<HTMLInputElement | null>(null)

function openNewChapterModal() {
  const nextNum = chapters.value.length + 1
  newChapterTitle.value = `第${['一','二','三','四','五','六','七','八','九','十'][nextNum - 1] ?? nextNum}章：`
  showNewChapterModal.value = true
  nextTick(() => newChapterInputRef.value?.focus())
}

async function confirmNewChapter() {
  const title = newChapterTitle.value.trim()
  if (!title) return
  const workId = props.work?.id
  let newId = `ch${Date.now()}`

  if (workId) {
    try {
      const result = await chapterApi.create(workId, { title, sequence: chapters.value.length + 1 })
      if (result.succeeded ?? result.successed) {
        newId = result.data?.id ?? newId
      }
    } catch { /* fallback to local id */ }
  }

  chapters.value.push({ id: newId, title, wordCount: 0, badge: 'draft', note: '未开始' })
  chapterContents[newId] = ''
  showNewChapterModal.value = false
  handleSelectChapter({ id: newId, title })
  notify.success(`章节「${title}」已创建`)
}

// ==================== AI 功能 ====================
function handleAiContinue(text: string) {
  if (!editorRef.value) return
  const p = document.createElement('p')
  p.innerHTML = `<span class="ai-text">${text.replace(/\n\n/g, '</p><p class="ai-text">').trim()}</span>`
  editorRef.value.appendChild(p)
  onDocInput()
  // 滚动到底部
  const area = editorRef.value.parentElement
  if (area) area.scrollTop = area.scrollHeight
  notify.success('AI 续写已插入')
}

function handleAiWrite(text: string) {
  if (!editorRef.value) return
  const fragment = text.split('\n\n').filter(Boolean)
  fragment.forEach(t => {
    const p = document.createElement('p')
    p.className = 'ai-block'
    p.textContent = t.trim()
    editorRef.value!.appendChild(p)
  })
  onDocInput()
  const area = editorRef.value.parentElement
  if (area) area.scrollTop = area.scrollHeight
  notify.success('AI 写本章内容已插入')
}

function handlePolish() {
  notify.info('润色功能即将上线')
}

function handleInspire() {
  notify.info('灵感功能即将上线')
}

// ==================== 保存 ====================
async function handleSave() {
  chapterContents[activeChapterId.value] = editorRef.value?.innerHTML ?? ''
  const workId = props.work?.id
  if (workId) {
    try {
      await chapterApi.update(workId, activeChapterId.value, {
        title: chapters.value.find(c => c.id === activeChapterId.value)?.title,
        content: chapterContents[activeChapterId.value],
      })
    } catch { /* fallback local-only */ }
  }
  notify.success('已保存')
}

// ==================== 侧边板 ====================
const rightPanel = ref('')
const showSettings = ref(false)

// ==================== 编辑器设置 ====================
const DEFAULT_SETTINGS: EditorSettings = {
  fontSize: 15.5,
  lineHeight: 1.9,
  docWidth: 700,
  theme: 'light',
  autoSave: true,
}

const editorSettings = ref<EditorSettings>({ ...DEFAULT_SETTINGS })

const editorCssVars = computed(() => {
  const dark  = editorSettings.value.theme === 'dark'
  const warm  = editorSettings.value.theme === 'warm'
  return {
    '--editor-font-size':  editorSettings.value.fontSize + 'px',
    '--editor-line-height': String(editorSettings.value.lineHeight),
    '--editor-doc-width':  editorSettings.value.docWidth + 'px',
    // ── 背景 / 文字 / 边框 / 次级色 ──────────────────────
    '--editor-bg':     dark ? '#1a1a2e'  : warm ? '#f5f0e8'  : '#fff',
    '--editor-text':   dark ? '#c9d1d9'  : warm ? '#3d2b1f'  : '#111827',
    '--editor-border': dark ? '#2d2d4e'  : warm ? '#d4c4a8'  : '#e5e7eb',
    '--editor-muted':  dark ? '#8b949e'  : warm ? '#8a7060'  : '#6b7280',
    // ── 主题感知强调色 ──────────────────────────────────
    '--editor-accent':        dark ? '#818cf8'              : warm ? '#b45309'  : '#4f46e5',
    '--editor-accent-light':  dark ? '#a5b4fc'              : warm ? '#d97706'  : '#6366f1',
    '--editor-accent-bg':     dark ? 'rgba(99,102,241,.2)'  : warm ? '#fef3c7'  : '#eef2ff',
    '--editor-accent-border': dark ? 'rgba(99,102,241,.4)'  : warm ? '#fcd34d'  : '#c7d2fe',
  }
})

function resetSettings() {
  editorSettings.value = { ...DEFAULT_SETTINGS }
}

// ==================== 全屏 ====================
const isFullscreen = ref(false)

function handleToggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {})
  } else {
    document.exitFullscreen().catch(() => {})
  }
}

function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

// ==================== 自动保存 ====================
let autoSaveTimer: ReturnType<typeof setInterval> | null = null
let autoSaveDirty = false

function markDirty() { autoSaveDirty = true }

async function doAutoSave() {
  const workId = props.work?.id
  const chId = activeChapterId.value
  if (!workId || !chId || !autoSaveDirty) return
  chapterContents[chId] = editorRef.value?.innerHTML ?? ''

  try {
    await autoSaveApi.save({
      entityType: 'chapter',
      entityId: chId,
      content: chapterContents[chId],
      title: chapters.value.find(c => c.id === chId)?.title,
      summary: chapters.value.find(c => c.id === chId)?.note,
    })
    autoSaveDirty = false
  } catch { /* silent fail for auto-save */ }
}

watch(() => editorSettings.value.autoSave, (val) => {
  if (autoSaveTimer) clearInterval(autoSaveTimer)
  if (val) {
    autoSaveTimer = setInterval(doAutoSave, 15000)
  }
})

onMounted(() => {
  loadChapters()
  document.addEventListener('fullscreenchange', onFullscreenChange)
  if (editorSettings.value.autoSave) {
    autoSaveTimer = setInterval(doAutoSave, 15000)
  }
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  if (autoSaveTimer) clearInterval(autoSaveTimer)
  // 离开前最后保存一次
  doAutoSave()
})

watch(() => props.work, () => {
  loadChapters()
})
</script>
