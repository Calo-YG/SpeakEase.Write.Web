<template>
  <div class="editor-toolbar">
    <!-- 组 1：模式选择 -->
    <div class="etool-group">
      <!-- 锁定 -->
      <button class="etool-btn etool-lock" title="锁定章节">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0110 0v4"/>
        </svg>
      </button>
      <!-- 辅助模式下拉 -->
      <button class="etool-mode" @click="showModeMenu = !showModeMenu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        {{ modeLabel }}
        <svg class="mode-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
    </div>

    <div class="etool-divider"></div>

    <!-- 组 2：AI 功能 -->
    <div class="etool-group">
      <!-- AI 续写 -->
      <button :class="['etool-btn', 'ai', { loading: aiContinueLoading }]" @click="handleAiContinue" title="AI 续写">
        <div v-if="aiContinueLoading" class="etool-spinner"></div>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2l1.5 3 3.5.5-2.5 2.5.5 3.5L12 10l-3 1.5.5-3.5L7 5.5l3.5-.5L12 2z"/>
          <path d="M5 17l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" stroke-width="1.4"/>
        </svg>
        AI续写
      </button>
      <!-- 润色 -->
      <button :class="['etool-btn', { loading: polishLoading }]" @click="handlePolish" title="润色文字">
        <div v-if="polishLoading" class="etool-spinner"></div>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 20h9"/>
          <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
        润色
      </button>
      <!-- 灵感 -->
      <button :class="['etool-btn', { loading: inspireLoading }]" @click="handleInspire" title="获取灵感">
        <div v-if="inspireLoading" class="etool-spinner"></div>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
        灵感
      </button>
      <!-- AI 写本章 -->
      <button :class="['etool-btn', 'ai-write', { loading: aiWriteLoading }]" @click="handleAiWrite" title="AI 写本章">
        <div v-if="aiWriteLoading" class="etool-spinner"></div>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
          <line x1="12" y1="7" x2="16" y2="7"/>
          <line x1="10" y1="11" x2="16" y2="11"/>
          <line x1="10" y1="15" x2="14" y2="15"/>
        </svg>
        AI写本章
      </button>
    </div>

    <!-- 右侧：AI对话 + 角色 + 大纲 -->
    <div class="etool-group etool-group-right">
      <div class="etool-divider"></div>
      <!-- AI 对话 -->
      <button :class="['etool-btn', 'side', 'ai-chat-btn', { active: showAiChat }]" @click="$emit('toggle-ai-chat')" title="AI 对话">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
        AI对话
      </button>
      <div class="etool-divider"></div>
      <button :class="['etool-btn', 'side', { active: showCharacters }]" @click="$emit('toggle-characters')" title="角色管理">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 00-3-3.87"/>
          <path d="M16 3.13a4 4 0 010 7.75"/>
        </svg>
        角色
      </button>
      <button :class="['etool-btn', 'side', { active: showOutline }]" @click="$emit('toggle-outline')" title="大纲">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"/>
          <line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/>
          <line x1="3" y1="6" x2="3.01" y2="6"/>
          <line x1="3" y1="12" x2="3.01" y2="12"/>
          <line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
        大纲
      </button>
      <button :class="['etool-btn', 'side', { active: showVolumes }]" @click="$emit('toggle-volumes')" title="分卷管理">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
        </svg>
        分卷
      </button>
      <button :class="['etool-btn', 'side', { active: showForeshadowing }]" @click="$emit('toggle-foreshadowing')" title="伏笔管理">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          <line x1="11" y1="8" x2="11" y2="14"/>
          <line x1="8" y1="11" x2="14" y2="11"/>
        </svg>
        伏笔
      </button>
      <button :class="['etool-btn', 'side', { active: showTimeline }]" @click="$emit('toggle-timeline')" title="时间线">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        时间线
      </button>
      <button :class="['etool-btn', 'side', { active: showInspiration }]" @click="$emit('toggle-inspiration')" title="灵感记录">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
        灵感
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { streamChat } from '@/lib/api'
import '../styles/EditorToolbar.css'

const props = defineProps<{
  showCharacters: boolean
  showOutline: boolean
  showVolumes: boolean
  showAiChat: boolean
  showForeshadowing: boolean
  showTimeline: boolean
  showInspiration: boolean
  // 由 WorkEditorView 传入的当前章节上下文
  chapterTitle?: string
  chapterContent?: string
  workTitle?: string
  workGenre?: string
}>()

const emit = defineEmits<{
  'ai-continue': [text: string]
  'ai-write': [text: string]
  'polish': [text: string]
  'inspire': [text: string]
  'toggle-characters': []
  'toggle-outline': []
  'toggle-volumes': []
  'toggle-ai-chat': []
  'toggle-foreshadowing': []
  'toggle-timeline': []
  'toggle-inspiration': []
}>()

// ── 模式 ──
type EditorMode = 'assist' | 'focus' | 'chat'
const currentMode = ref<EditorMode>('assist')
const showModeMenu = ref(false)

const modeLabel = computed(() => {
  const map: Record<EditorMode, string> = { assist: '辅助模式', focus: '专注模式', chat: '对话模式' }
  return map[currentMode.value]
})

// ── 工具函数：将 HTML 转为纯文本用于 AI Prompt ──
function htmlToText(html: string): string {
  if (!html) return ''
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}

// ── AI 续写 ──
const aiContinueLoading = ref(false)
let continueAbort: AbortController | null = null

async function handleAiContinue() {
  if (aiContinueLoading.value) {
    // 再次点击取消
    continueAbort?.abort()
    aiContinueLoading.value = false
    return
  }

  const plainContent = htmlToText(props.chapterContent ?? '').slice(-800) // 取最后800字作为上下文
  if (!plainContent) {
    // 章节为空时，给一个基于标题的提示
    const titleHint = props.chapterTitle ? `章节：${props.chapterTitle}` : '新章节'
    emit('ai-continue', `\n\n（AI 续写：请先输入一些内容，AI 将基于你的文字风格进行续写）`)
    return
  }

  aiContinueLoading.value = true
  continueAbort = new AbortController()

  const workInfo = props.workTitle
    ? `作品《${props.workTitle}》${props.workGenre ? `，题材：${props.workGenre}` : ''}`
    : ''
  const chapterInfo = props.chapterTitle ? `，章节：${props.chapterTitle}` : ''

  const systemPrompt = `你是一位专业的中文小说写手${workInfo ? `，正在创作${workInfo}${chapterInfo}` : ''}。请保持原文的写作风格、人物性格和叙事节奏，用第三人称继续写作，不要重复上文内容，不要加标题或说明，直接输出续写正文。续写长度约200-400字。`

  let result = ''

  await streamChat(
    {
      systemPrompt,
      messages: [
        {
          role: 'user',
          content: `请根据以下已有内容，续写下一段：\n\n${plainContent}`,
        },
      ],
      temperature: 0.85,
      skillName: 'writer',
    },
    {
      onChunk(chunk) {
        result += chunk
      },
      onDone() {
        aiContinueLoading.value = false
        if (result.trim()) {
          emit('ai-continue', result)
        }
      },
      onError(_code, message) {
        aiContinueLoading.value = false
        emit('ai-continue', `\n\n（AI 续写失败：${message || '请检查模型配置'}）`)
      },
    },
    continueAbort.signal,
  )
}

// ── AI 写本章 ──
const aiWriteLoading = ref(false)
let writeAbort: AbortController | null = null

async function handleAiWrite() {
  if (aiWriteLoading.value) {
    writeAbort?.abort()
    aiWriteLoading.value = false
    return
  }

  aiWriteLoading.value = true
  writeAbort = new AbortController()

  const workInfo = props.workTitle
    ? `作品《${props.workTitle}》${props.workGenre ? `，题材：${props.workGenre}` : ''}`
    : '网络小说'
  const chapterName = props.chapterTitle || '本章'

  const systemPrompt = `你是一位专业的中文小说写手，正在创作${workInfo}。请直接输出章节正文，不要加章节标题，不要加说明或解释，段落之间用空行分隔。写作风格应符合该题材特点，人物形象鲜明，情节紧凑，约500-800字。`

  let result = ''

  await streamChat(
    {
      systemPrompt,
      messages: [
        {
          role: 'user',
          content: `请帮我写「${chapterName}」的内容。${props.chapterContent ? `\n\n本章目前已有内容供参考：\n${htmlToText(props.chapterContent).slice(0, 300)}` : ''}`,
        },
      ],
      temperature: 0.9,
      skillName: 'writer',
    },
    {
      onChunk(chunk) {
        result += chunk
      },
      onDone() {
        aiWriteLoading.value = false
        if (result.trim()) {
          emit('ai-write', result)
        }
      },
      onError(_code, message) {
        aiWriteLoading.value = false
        emit('ai-write', `（AI 写本章失败：${message || '请检查模型配置'}）`)
      },
    },
    writeAbort.signal,
  )
}

// ── 润色 ──
const polishLoading = ref(false)
let polishAbort: AbortController | null = null

async function handlePolish() {
  if (polishLoading.value) {
    polishAbort?.abort()
    polishLoading.value = false
    return
  }

  const plainContent = htmlToText(props.chapterContent ?? '')
  if (!plainContent) {
    emit('polish', '（请先输入一些内容再进行润色）')
    return
  }

  polishLoading.value = true
  polishAbort = new AbortController()

  const workInfo = props.workTitle
    ? `作品《${props.workTitle}》${props.workGenre ? `，题材：${props.workGenre}` : ''}`
    : ''

  const systemPrompt = `你是一位资深的文字编辑，擅长${workInfo ? `${workInfo}这类作品的` : ''}文字润色。
请对以下文字进行润色，要求：
1. 保持原文的情节和人物意图不变
2. 提升文笔质感，让表达更优美、更生动
3. 修正语病和不通顺的表达
4. 保持原文的叙事风格和节奏
5. 直接输出润色后的文字，不要加任何说明或解释
6. 段落之间用空行分隔`

  let result = ''

  await streamChat(
    {
      systemPrompt,
      messages: [{ role: 'user', content: `请润色以下段落：\n\n${plainContent}` }],
      temperature: 0.7,
      skillName: 'writer',
    },
    {
      onChunk(chunk) { result += chunk },
      onDone() {
        polishLoading.value = false
        if (result.trim()) emit('polish', result)
      },
      onError(_code, message) {
        polishLoading.value = false
        emit('polish', `（润色失败：${message || '请检查模型配置'}）`)
      },
    },
    polishAbort.signal,
  )
}

// ── 灵感 ──
const inspireLoading = ref(false)
let inspireAbort: AbortController | null = null

async function handleInspire() {
  if (inspireLoading.value) {
    inspireAbort?.abort()
    inspireLoading.value = false
    return
  }

  inspireLoading.value = true
  inspireAbort = new AbortController()

  const workInfo = props.workTitle
    ? `作品《${props.workTitle}》${props.workGenre ? `，题材：${props.workGenre}` : ''}`
    : '小说'
  const chapterInfo = props.chapterTitle ? `当前章节：${props.chapterTitle}` : ''
  const plainContent = htmlToText(props.chapterContent ?? '').slice(-600)

  const systemPrompt = `你是一位创意无限的小说灵感助手，正在为${workInfo}提供创作灵感。
请提供 3-5 个具体的创作灵感或建议，包括：
1. 情节发展方向或转折点
2. 角色互动的创意场景
3. 伏笔或悬念的创意设计
4. 环境描写或氛围营造的建议
每个灵感要具体、可操作、有画面感，适合直接用于小说创作。`

  const userParts = [chapterInfo, plainContent ? `\n已有内容（参考）：\n${plainContent}` : ''].filter(Boolean)

  let result = ''

  await streamChat(
    {
      systemPrompt,
      messages: [{ role: 'user', content: `请给我一些创作灵感。${userParts.join('\n')}` }],
      temperature: 0.9,
      skillName: 'writer',
    },
    {
      onChunk(chunk) { result += chunk },
      onDone() {
        inspireLoading.value = false
        if (result.trim()) emit('inspire', result)
      },
      onError(_code, message) {
        inspireLoading.value = false
        emit('inspire', `（获取灵感失败：${message || '请检查模型配置'}）`)
      },
    },
    inspireAbort.signal,
  )
}
</script>
