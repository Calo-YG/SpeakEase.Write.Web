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
import { ref, nextTick } from 'vue'
import type { WorkItem } from '@/lib/api'
import type { ChapterItem } from '@/components/ChapterSidebar.vue'
import '../styles/AiChatPanel.css'

defineProps<{
  work?: WorkItem | null
  chapter?: ChapterItem | null
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

// ── 拖拽调宽 ──
const MIN_WIDTH = 240
const MAX_WIDTH = 640
const panelWidth = ref(320)

function onResizeStart(e: MouseEvent) {
  const startX = e.clientX
  const startWidth = panelWidth.value

  function onMove(ev: MouseEvent) {
    // 向左拖拽（delta 为负）→ 变宽；向右拖拽 → 变窄
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

// Mock AI 回复库
const mockReplies: Record<string, string> = {
  续写: '根据当前章节的走向，我建议可以从以下几个角度续写：\n\n1. **冲突升级**：将觉醒石的反应描写得更加震撼，引发宗门长老的高度重视\n2. **内心独白**：通过林凡的视角展示他内心的惊喜与不安，增加人物深度\n3. **悬念设置**：可以暗示觉醒武魂的稀有性，为后续剧情埋下伏笔',
  人物: '本章人物分析：\n\n• **林凡**（主角）：性格坚韧，承受他人偏见而未放弃，是典型的"逆袭型"主角设定\n• **宗门长老**：代表权威与评判，通过其反应侧面烘托林凡觉醒的非凡\n• **周围弟子**：以集体形象呈现，构成对林凡的"反衬"，增强戏剧效果',
  情节: '从结构角度来看，本章情节较为流畅，但有以下优化空间：\n\n1. 觉醒前可以增加更多的铺垫细节，如林凡的心理活动或具体的修炼挫折\n2. "下一个，林凡！"这句话的出现节奏可以再缓一缓，增加期待感\n3. 建议在章末留下更明确的钩子，驱动读者阅读下一章',
  冲突: '关于下一章冲突设计，这里有几个思路：\n\n**外部冲突**：觉醒结果引发同门嫉妒，可能遭遇暗算或挑战\n**内部冲突**：武魂觉醒后，林凡发现自己的能力远比想象中复杂，需要抉择\n**信息冲突**：某位长老知晓林凡武魂的真实价值却选择隐瞒，制造张力',
  开头: '以下是几个改写方向：\n\n**原版感觉**：平铺直叙，适合建立基调\n\n**建议改写**：\n"觉醒石的裂纹，在林凡的掌心蔓延。"\n\n以结果开头，制造悬念，让读者立即想知道发生了什么——这是倒叙切入的经典技法。',
}

function getMockReply(input: string): string {
  if (input.includes('续写') || input.includes('建议')) return mockReplies['续写']
  if (input.includes('人物') || input.includes('人') || input.includes('角色')) return mockReplies['人物']
  if (input.includes('情节') || input.includes('优化')) return mockReplies['情节']
  if (input.includes('冲突')) return mockReplies['冲突']
  if (input.includes('开头') || input.includes('改写')) return mockReplies['开头']
  return `好的，关于你的问题「${input.slice(0, 20)}${input.length > 20 ? '…' : ''}」，作为 AI 写作助手，我来帮你分析：\n\n当前章节的节奏整体流畅，情感张力足够。你可以考虑在关键转折点加入更多感官描写，让读者更有代入感。如果需要具体建议，可以把章节内容粘贴到这里，我来帮你逐段优化。`
}

function nowTime(): string {
  return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

async function sendMessage(text: string) {
  if (!text.trim() || isTyping.value) return

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

  // 模拟 AI 思考延迟（800ms ～ 1400ms）
  const delay = 800 + Math.random() * 600
  await new Promise(r => setTimeout(r, delay))

  // 替换打字占位为真实内容
  const idx = messages.value.findIndex(m => m.id === typingId)
  if (idx !== -1) {
    messages.value[idx] = {
      id: typingId,
      role: 'ai',
      content: getMockReply(text),
      time: nowTime(),
      typing: false,
    }
  }
  isTyping.value = false

  await nextTick()
  scrollToBottom()
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
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
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
</script>
