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
        <span v-if="userMessageCount > 0" class="acp-header-count">{{ userMessageCount }}轮</span>
      </div>
      <div class="acp-header-right">
        <button class="acp-history-btn" :class="{ active: showHistory }" @click="toggleHistory" title="历史会话">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </button>
        <button v-if="!showHistory && messages.length > 0" class="acp-new-chat" @click="startNewChat" title="新对话">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
        <button class="acp-close" @click="$emit('close')" title="关闭">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 快捷指令 -->
    <div v-if="!showHistory" class="acp-quick">
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

    <!-- 历史会话列表 -->
    <div v-if="showHistory" class="acp-history">
      <div v-if="historyLoading" class="acp-history-loading">
        <div class="acp-typing-dots"><span></span><span></span><span></span></div>
      </div>
      <div v-else-if="historySessions.length === 0" class="acp-history-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>暂无历史会话</span>
      </div>
      <template v-else>
        <div
          v-for="s in historySessions"
          :key="s.sessionId"
          :class="['acp-history-item', { active: s.sessionId === currentSessionId, viewing: s.sessionId === viewingSessionId }]"
          @click="viewSession(s.sessionId)"
        >
          <div class="acp-history-item-main">
            <span class="acp-history-item-status" :class="s.status">{{ statusLabel(s.status) }}</span>
            <span class="acp-history-item-time">{{ formatSessionTime(s.startedAt) }}</span>
          </div>
          <div class="acp-history-item-sub">
            <span>{{ s.turnCount }}轮对话</span>
            <span v-if="s.closeReason" class="acp-history-item-reason">{{ closeReasonLabel(s.closeReason) }}</span>
          </div>
        </div>
      </template>
    </div>

    <!-- 消息列表 / 空态 -->
    <div v-show="!showHistory" ref="messagesRef" class="acp-messages">
      <!-- 压缩通知横幅 -->
      <div v-if="compressNotice" class="acp-compress-notice">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>对话已压缩：{{ compressNotice.originalCount }}条 → {{ compressNotice.compressedCount }}条，旧消息已摘要保留</span>
        <button class="acp-compress-dismiss" @click="compressNotice = null">×</button>
      </div>

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
          <!-- Tool Call 消息 -->
          <template v-if="msg.role === 'tool'">
            <div class="acp-tool-card">
              <div class="acp-tool-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
                </svg>
                <span class="acp-tool-name">{{ msg.toolName || '工具调用' }}</span>
                <span :class="['acp-tool-status', msg.toolSuccess ? 'success' : 'fail']">
                  {{ msg.toolSuccess ? '✓' : '✗' }}
                </span>
              </div>
              <div class="acp-tool-body">{{ msg.content }}</div>
            </div>
          </template>

          <!-- 普通消息 -->
          <template v-else>
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
              <!-- AI 消息：Markdown 渲染 -->
              <div v-else-if="msg.role === 'ai'" class="acp-bubble acp-bubble-md">
                <details v-if="msg.reasoningContent" class="acp-reasoning">
                  <summary class="acp-reasoning-summary">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="acp-reasoning-icon">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="16" x2="12" y2="12"/>
                      <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    <span>思考过程</span>
                    <span class="acp-reasoning-count">{{ msg.reasoningContent.length }}字</span>
                  </summary>
                  <div class="acp-reasoning-body">{{ msg.reasoningContent }}</div>
                </details>
                <MarkdownRenderer :content="msg.content" />
              </div>
              <!-- 用户消息：纯文本 -->
              <div v-else class="acp-bubble">{{ msg.content }}</div>
            </div>
          </template>
          <span class="acp-bubble-time">{{ msg.time }}</span>
        </div>
      </template>
    </div>

    <!-- 查看历史中横幅 -->
    <div v-if="viewingSessionId && viewingSessionId !== currentSessionId" class="acp-history-banner">
      <span>正在查看历史会话</span>
      <button class="acp-history-back-btn" @click="backToCurrent">返回当前</button>
    </div>

    <!-- 输入区 -->
    <div class="acp-input-area" :class="{ disabled: !!viewingSessionId && viewingSessionId !== currentSessionId }">
      <div class="acp-input-row">
        <textarea
          ref="textareaRef"
          v-model="inputText"
          class="acp-textarea"
          placeholder="输入你的想法，按 Enter 发送…"
          rows="1"
          :disabled="!!viewingSessionId && viewingSessionId !== currentSessionId"
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
import { ref, nextTick, onUnmounted, watch, computed } from 'vue'
import type { WorkItem } from '@/lib/api'
import { agentStreamChat, type LLMChatMessage, type ContextCompressedMeta } from '@/lib/api'
import type { ChapterItem } from '@/components/ChapterSidebar.vue'
import { sessionApi } from '@/lib/api/session'
import type { SessionInfo } from '@/lib/api/session'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
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
  role: 'user' | 'ai' | 'tool'
  content: string
  reasoningContent: string
  time: string
  typing?: boolean
  toolName?: string
  toolSuccess?: boolean
}

const messages = ref<ChatMessage[]>([])
const inputText = ref('')
const isTyping = ref(false)
const messagesRef = ref<HTMLElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const currentSessionId = ref('')
const compressNotice = ref<ContextCompressedMeta | null>(null)
let abortController: AbortController | null = null

// ── 历史会话 ──
const showHistory = ref(false)
const historySessions = ref<SessionInfo[]>([])
const historyLoading = ref(false)
const viewingSessionId = ref('')
let cachedCurrentMessages: ChatMessage[] = []

const userMessageCount = computed(() =>
  messages.value.filter(m => m.role === 'user').length
)

async function loadSessionHistory(workId: string) {
  if (!workId) return
  try {
    const sessionResult = await sessionApi.getActive(workId)
    const session = sessionResult.data
    if (!session?.sessionId) {
      currentSessionId.value = ''
      return
    }
    currentSessionId.value = session.sessionId
    const msgResult = await sessionApi.getMessages(session.sessionId, 200)
    const historyMessages = msgResult.data ?? []
    if (historyMessages.length === 0) return

    const mapped: ChatMessage[] = historyMessages.map(m => ({
      id: m.id,
      role: m.role === 'assistant' ? 'ai' as const
           : m.role === 'tool' ? 'tool' as const
           : 'user' as const,
      content: m.content,
      reasoningContent: '',
      time: new Date(m.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      toolName: m.toolName || undefined,
      toolSuccess: m.toolSuccess ?? undefined,
    }))
    messages.value = mapped
    nextTick(scrollToBottom)
  } catch { /* no active session, start fresh */ }
}

async function startNewChat() {
  if (currentSessionId.value) {
    try {
      await sessionApi.cancel(currentSessionId.value)
    } catch { /* ignore */ }
  }
  messages.value = []
  currentSessionId.value = ''
  compressNotice.value = null
  viewingSessionId.value = ''
  showHistory.value = false
}

async function toggleHistory() {
  if (showHistory.value) {
    showHistory.value = false
    return
  }
  showHistory.value = true
  historyLoading.value = true
  try {
    const workId = props.work?.id
    if (!workId) return
    const result = await sessionApi.list(workId)
    historySessions.value = result.data ?? []
  } catch { historySessions.value = [] }
  finally { historyLoading.value = false }
}

async function viewSession(sessionId: string) {
  if (sessionId === currentSessionId.value) {
    showHistory.value = false
    viewingSessionId.value = ''
    messages.value = cachedCurrentMessages
    return
  }
  if (!viewingSessionId.value || viewingSessionId.value === currentSessionId.value) {
    cachedCurrentMessages = [...messages.value]
  }
  viewingSessionId.value = sessionId
  showHistory.value = false
  try {
    const msgResult = await sessionApi.getMessages(sessionId, 200)
    const historyMessages = msgResult.data ?? []
    const mapped: ChatMessage[] = historyMessages.map(m => ({
      id: m.id,
      role: m.role === 'assistant' ? 'ai' as const
           : m.role === 'tool' ? 'tool' as const
           : 'user' as const,
      content: m.content,
      reasoningContent: '',
      time: new Date(m.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      toolName: m.toolName || undefined,
      toolSuccess: m.toolSuccess ?? undefined,
    }))
    messages.value = mapped
    nextTick(scrollToBottom)
  } catch { /* ignored */ }
}

function backToCurrent() {
  viewingSessionId.value = ''
  messages.value = cachedCurrentMessages
}

function formatSessionTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin}分钟前`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}小时前`
  return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function statusLabel(status: string): string {
  const map: Record<string, string> = { active: '进行中', paused: '已暂停', closed: '已结束', cancelled: '已取消', expired: '已过期' }
  return map[status] ?? status
}

function closeReasonLabel(reason: string): string {
  const map: Record<string, string> = { archive_turns_limit: '自动归档', timeout: '超时', error: '错误', user_cancel: '用户取消' }
  return map[reason] ?? reason
}

watch(() => props.work?.id, (workId) => {
  messages.value = []
  currentSessionId.value = ''
  if (workId) loadSessionHistory(workId)
}, { immediate: true })

// ── 拖拽调宽 ──
const MIN_WIDTH = 300
const MAX_WIDTH = 640
const panelWidth = ref(420)

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

// ── 构建对话历史供 Agent 使用 ──
function buildConversationHistory(): LLMChatMessage[] {
  return messages.value
    .filter(m => !m.typing && m.content && m.role !== 'tool')
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
  compressNotice.value = null

  // 添加用户消息
  messages.value.push({
    id: `u-${Date.now()}`,
    role: 'user',
    content: text.trim(),
    reasoningContent: '',
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
    reasoningContent: '',
    time: nowTime(),
    typing: true,
  })

  await nextTick()
  scrollToBottom()

  let accumulatedText = ''
  let streamDone = false

  const history = buildConversationHistory()
  const contextMessages = history.slice(0, -1)

  try {
    await agentStreamChat(
      {
        workId: props.work?.id ?? '',
        messages: [
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
        onReasoning(text) {
          const idx = messages.value.findIndex(m => m.id === typingId)
          if (idx !== -1) {
            messages.value[idx] = {
              ...messages.value[idx],
              reasoningContent: messages.value[idx].reasoningContent + text,
              typing: false,
            }
          }
          scrollToBottom()
        },
        onToolResult(info) {
          const toolMsg: ChatMessage = {
            id: `tool-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            role: 'tool',
            content: info.content.slice(0, 300),
            reasoningContent: '',
            time: nowTime(),
            toolName: info.toolName,
            toolSuccess: info.success,
          }
          const typingIdx = messages.value.findIndex(m => m.id === typingId)
          if (typingIdx >= 0) {
            messages.value.splice(typingIdx, 0, toolMsg)
          } else {
            messages.value.push(toolMsg)
          }
          scrollToBottom()
        },
        onMeta(data) {
          if (data.stage === 'context_compressed') {
            compressNotice.value = data as unknown as ContextCompressedMeta
          }
        },
        onDone(finalResponse) {
          streamDone = true
          isTyping.value = false
          const idx = messages.value.findIndex(m => m.id === typingId)
          if (idx !== -1) {
            const msg = messages.value[idx]
            if (msg.typing || (!msg.content && finalResponse?.content)) {
              messages.value[idx] = {
                ...msg,
                content: finalResponse?.content || msg.content,
                reasoningContent: finalResponse?.reasoningContent || msg.reasoningContent,
                typing: false,
              }
            }
          }
        },
        onError(code, message) {
          streamDone = true
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
  } finally {
    isTyping.value = false
    if (!streamDone) {
      const idx = messages.value.findIndex(m => m.id === typingId)
      if (idx !== -1) {
        const bubble = messages.value[idx]
        if (bubble.typing) {
          messages.value.splice(idx, 1)
        } else if (!bubble.content) {
          messages.value[idx] = {
            ...bubble,
            content: accumulatedText || '连接中断，请重试。',
            typing: false,
          }
        }
      }
    }
  }
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
