<template>
  <div class="ai-chat-panel" :style="{ width: panelWidth + 'px' }">
    <!-- 拖拽调宽把手 -->
    <div
      class="acp-resize-handle"
      title="拖拽调整宽度"
      @mousedown.prevent="onResizeStart"
    ></div>

    <!-- 头部 -->
    <div class="acp-header">
      <div class="acp-header-left">
        <svg class="acp-header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2l1.5 3 3.5.5-2.5 2.5.5 3.5L12 10l-3 1.5.5-3.5L7 5.5l3.5-.5L12 2z"/>
          <path d="M5 17l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" stroke-width="1.4"/>
        </svg>
        <span class="acp-header-title">AI 对话</span>
        <span class="acp-header-badge">Beta</span>
      </div>
      <button class="acp-close" @click="$emit('close')" title="关闭">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <!-- 快捷指令 -->
    <div class="acp-quick">
      <button
        v-for="q in quickPrompts"
        :key="q.text"
        class="acp-quick-chip"
        @click="sendQuick(q.text)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
        {{ q.label }}
      </button>
    </div>

    <!-- 消息列表 / 空态 -->
    <div ref="messagesRef" class="acp-messages">
      <!-- 空态 -->
      <div v-if="messages.length === 0" class="acp-empty">
        <div class="acp-empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
        </div>
        <p class="acp-empty-title">和 AI 一起创作</p>
        <p class="acp-empty-sub">你可以询问情节建议、人物分析、续写灵感，或者直接发送你的想法</p>
      </div>

      <!-- 消息气泡 -->
      <template v-else>
        <div
          v-for="msg in messages"
          :key="msg.id"
          :class="['acp-msg', msg.role]"
        >
          <div class="acp-msg-row">
            <!-- AI 头像 -->
            <div v-if="msg.role === 'ai'" class="acp-msg-avatar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2l1.5 3 3.5.5-2.5 2.5.5 3.5L12 10l-3 1.5.5-3.5L7 5.5l3.5-.5L12 2z"/>
              </svg>
            </div>

            <!-- 打字动画 -->
            <div v-if="msg.typing" class="acp-typing-dots">
              <span></span><span></span><span></span>
            </div>
            <!-- 消息内容 -->
            <div v-else class="acp-bubble">{{ msg.content }}</div>
          </div>
          <span class="acp-bubble-time">{{ msg.time }}</span>
        </div>
      </template>
    </div>

    <!-- 输入区 -->
    <div class="acp-input-area">
      <div class="acp-input-row">
        <textarea
          ref="textareaRef"
          v-model="inputText"
          class="acp-textarea"
          placeholder="输入你的想法，按 Enter 发送…"
          rows="1"
          @keydown.enter.exact.prevent="handleSend"
          @input="autoResize"
        ></textarea>
        <button
          class="acp-send"
          :disabled="!inputText.trim() || isTyping"
          @click="handleSend"
          title="发送"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onUnmounted } from 'vue'
import type { WorkItem } from '@/lib/api'
import { agentStreamChat, type LLMChatMessage } from '@/lib/api'
import type { ChapterItem } from '@/components/ChapterSidebar.vue'
import '../styles/AiChatPanel.css'

const props = defineProps<{
  work?: WorkItem | null
  chapter?: ChapterItem | null
  chapterContent?: string
}>()

defineEmits<{ close: [] }>()

// ── 快捷指令 ──
const quickPrompts = [
  { label: '续写建议', text: '请根据当前章节内容，给我一些续写建议' },
  { label: '分析人物', text: '帮我分析一下本章中出现的人物性格和关系' },
  { label: '情节优化', text: '我的情节有哪些可以优化的地方？' },
  { label: '冲突设计', text: '如何在下一章设计更有张力的冲突？' },
  { label: '开头改写', text: '帮我把本章的开头改写得更有吸引力' },
]

// ── 消息 ──
interface ChatMessage {
  id: string
  role: 'user' | 'ai'
  content: string
  time: string
  typing?: boolean
}

const messages = ref<ChatMessage[]>([])
const inputText = ref('')
const isTyping = ref(false)
const messagesRef = ref<HTMLElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
let abortController: AbortController | null = null

// ── 拖拽调宽 ──
const MIN_WIDTH = 240
const MAX_WIDTH = 640
const panelWidth = ref(320)

function onResizeStart(e: MouseEvent) {
  const startX = e.clientX
  const startWidth = panelWidth.value

  function onMove(ev: MouseEvent) {
    const delta = startX - ev.clientX
    panelWidth.value = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + delta))
  }

  function onUp() {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  document.body.style.cursor = 'ew-resize'
  document.body.style.userSelect = 'none'
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

// ── 构建系统提示（携带作品/章节上下文）──
function buildSystemPrompt(): string {
  const parts: string[] = [
    '你是一位专业的AI写作助手，擅长中文网络小说创作，包括玄幻、仙侠、都市、科幻等多种题材。',
  ]
  if (props.work) {
    parts.push(`\n当前用户正在创作的作品：《${props.work.title}》，题材：${props.work.genre || '未设定'}。`)
  }
  if (props.chapter) {
    parts.push(`当前章节：${props.chapter.title}`)
  }
  if (props.chapterContent) {
    // 只取前1500字，避免超出上下文限制
    const plainText = props.chapterContent.replace(/<[^>]+>/g, '').slice(0, 1500)
    if (plainText.trim()) {
      parts.push(`\n当前章节内容（节选）：\n${plainText}`)
    }
  }
  parts.push('\n请基于以上创作背景，用简洁、专业的方式帮助用户。给出具体的写作建议时，风格需与作品保持一致。')
  return parts.join('')
}

// ── 构建对话历史供 Agent 使用 ──
function buildConversationHistory(): LLMChatMessage[] {
  return messages.value
    .filter(m => !m.typing && m.content)
    .map(m => ({
      role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
      content: m.content,
    }))
}

function nowTime(): string {
  return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

async function sendMessage(text: string) {
  if (!text.trim() || isTyping.value) return

  // 中断上一次请求
  abortController?.abort()
  abortController = new AbortController()

  // 添加用户消息
  messages.value.push({
    id: `u-${Date.now()}`,
    role: 'user',
    content: text.trim(),
    time: nowTime(),
  })

  await nextTick()
  scrollToBottom()

  // 添加 AI 打字占位
  const typingId = `ai-${Date.now()}`
  isTyping.value = true
  messages.value.push({
    id: typingId,
    role: 'ai',
    content: '',
    time: nowTime(),
    typing: true,
  })

  await nextTick()
  scrollToBottom()

  let accumulatedText = ''

  const history = buildConversationHistory()
  // 去掉最后一条（刚加的 user 消息，因为当前输入已单独传入）
  const contextMessages = history.slice(0, -1)

  const systemPrompt = buildSystemPrompt()

  await agentStreamChat(
    {
      messages: [
        { role: 'system', content: systemPrompt },
        ...contextMessages,
        { role: 'user', content: text.trim() },
      ],
      skillName: 'writer',
      temperature: 0.8,
    },
    {
      onChunk(chunk) {
        accumulatedText += chunk
        const idx = messages.value.findIndex(m => m.id === typingId)
        if (idx !== -1) {
          messages.value[idx] = {
            ...messages.value[idx],
            content: accumulatedText,
            typing: false,
          }
        }
        scrollToBottom()
      },
      onDone() {
        isTyping.value = false
        // 确保最终 typing 状态已清除
        const idx = messages.value.findIndex(m => m.id === typingId)
        if (idx !== -1 && messages.value[idx].typing) {
          messages.value[idx] = { ...messages.value[idx], typing: false }
        }
      },
      onError(code, message) {
        isTyping.value = false
        const idx = messages.value.findIndex(m => m.id === typingId)
        if (idx !== -1) {
          messages.value[idx] = {
            ...messages.value[idx],
            content: code === 'auth_expired'
              ? '认证已过期，请重新登录。'
              : `AI 回复失败：${message || '请检查模型配置'}`,
            typing: false,
          }
        }
      },
    },
    abortController.signal,
  )
}

async function handleSend() {
  const text = inputText.value.trim()
  if (!text) return
  inputText.value = ''
  resetTextareaHeight()
  await sendMessage(text)
}

function sendQuick(text: string) {
  sendMessage(text)
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

function autoResize(e: Event) {
  const el = e.target as HTMLTextAreaElement
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 90) + 'px'
}

function resetTextareaHeight() {
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
  }
}

onUnmounted(() => {
  abortController?.abort()
})
</script>
