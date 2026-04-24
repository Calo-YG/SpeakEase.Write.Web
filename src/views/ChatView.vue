<template>
  <div class="chat-page">
    <!-- 消息区 -->
    <main class="chat-main" ref="chatMainRef">
      <div class="messages">
        <div v-if="messages.length === 0" class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          </div>
          <div class="empty-title">开始对话</div>
          <div class="empty-sub">输入消息，或选择技能后开始</div>
        </div>
        <div
          v-for="(msg, idx) in messages"
          :key="idx"
          :class="['msg-row', msg.role]"
        >
          <div v-if="msg.role === 'ai'" class="msg-avatar ai-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <div class="msg-bubble-wrap">
            <div v-if="msg.role === 'ai'" class="msg-md" v-html="renderMd(msg.content)" @click="handleMdClick"></div>
            <div v-else class="msg-user-text">{{ msg.content }}</div>
            <div v-if="msg.streaming" class="streaming-cursor">▍</div>
          </div>
          <div v-if="msg.role === 'user'" class="msg-avatar user-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
        </div>
      </div>
    </main>

    <!-- 底栏 -->
    <footer class="chat-footer">
      <div v-if="showOptions" class="options-panel">
        <label class="opt-item">
          <span>Temperature</span>
          <input v-model.number="temperature" type="number" min="0" max="2" step="0.1" class="opt-input" />
        </label>
        <label class="opt-item">
          <span>MaxTokens</span>
          <input v-model.number="maxTokens" type="number" min="50" max="16000" step="100" class="opt-input" />
        </label>
        <label class="opt-item opt-check">
          <input v-model="useStream" type="checkbox" />
          <span>流式输出</span>
        </label>
      </div>
      <div class="input-wrap">
        <select v-model="skillName" class="skill-select">
          <option value="">无技能</option>
          <option v-for="skill in availableSkills" :key="skill.name" :value="skill.name">
            {{ skill.name }}
          </option>
        </select>
        <textarea
          ref="inputRef"
          v-model="inputText"
          placeholder="输入消息…"
          :disabled="isSending"
          @keydown.enter.exact="sendMessage"
          class="chat-textarea"
          rows="1"
        ></textarea>
        <button v-if="isSending" class="btn-stop" @click="stopGeneration">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
        </button>
        <button v-else class="btn-send" :disabled="!inputText.trim()" @click="sendMessage" aria-label="发送">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
        </button>
      </div>
      <div class="footer-actions">
        <button class="btn-ghost" @click="showOptions = !showOptions" title="参数设置">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
          参数
        </button>
        <button class="btn-ghost" @click="clearChat" title="清空对话">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          清空
        </button>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, onMounted } from 'vue'
import { agentApi, type LLMChatMessage, type AgentSkillSummary } from '@/lib/api'
import { useAuth } from '@/composables/useAuth'
import { Marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'

const marked = new Marked({
  gfm: true,
  breaks: true,
  renderer: {
    code({ text, lang }: { text: string; lang?: string }) {
      const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext'
      const highlighted = hljs.highlight(text, { language }).value
      const langLabel = lang || ''
      return `<div class="code-block"><div class="code-header"><span class="code-lang">${langLabel}</span></div><div class="code-body"><button class="code-copy" data-code=\"${encodeURIComponent(text)}\">复制</button><pre class="hljs"><code>${highlighted}</code></pre></div></div>`
    }
  }
})

function renderMd(content: string): string {
  if (!content) return ''
  try {
    return marked.parse(content) as string
  } catch {
    return content
  }
}

// 事件委托：复制代码块
function handleMdClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.classList.contains('code-copy')) return
  const encoded = target.getAttribute('data-code') || ''
  try {
    navigator.clipboard.writeText(decodeURIComponent(encoded))
    target.textContent = '已复制'
    setTimeout(() => { target.textContent = '复制' }, 1500)
  } catch {
    target.textContent = '失败'
    setTimeout(() => { target.textContent = '复制' }, 1500)
  }
}

const auth = useAuth()

interface DisplayMessage {
  role: 'user' | 'ai'
  content: string
  streaming?: boolean
}

const messages = ref<DisplayMessage[]>([])
const inputText = ref('')
const isSending = ref(false)
const skillName = ref('')
const temperature = ref(0.7)
const maxTokens = ref(1024)
const useStream = ref(true)
const chatMainRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLTextAreaElement | null>(null)
const availableSkills = ref<AgentSkillSummary[]>([])
const showOptions = ref(false)
let abortController: AbortController | null = null

// 动态加载可用技能列表
onMounted(async () => {
  try {
    availableSkills.value = await agentApi.getSkills()
    // 默认选中第一个技能
    if (availableSkills.value.length > 0 && !skillName.value) {
      skillName.value = availableSkills.value[0].name
    }
  } catch { /* 加载失败时使用空列表 */ }
})

function scrollToBottom() {
  nextTick(() => {
    if (chatMainRef.value) {
      chatMainRef.value.scrollTop = chatMainRef.value.scrollHeight
    }
  })
}

watch(messages, scrollToBottom, { deep: true })

function clearChat() {
  if (isSending.value) {
    abortController?.abort()
    abortController = null
    isSending.value = false
  }
  messages.value = []
}

function stopGeneration() {
  abortController?.abort()
  abortController = null
  // 将所有 streaming 状态的消息标记为结束
  for (const msg of messages.value) {
    if (msg.streaming) {
      msg.streaming = false
      if (!msg.content) msg.content = '（已停止生成）'
    }
  }
  isSending.value = false
}

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || isSending.value) return

  messages.value.push({ role: 'user', content: text })
  inputText.value = ''
  isSending.value = true

  // 构建发送给后端的消息历史
  const history: LLMChatMessage[] = messages.value
    .filter(m => !m.streaming)
    .map(m => ({
      role: (m.role === 'ai' ? 'assistant' : m.role) as 'user' | 'assistant',
      content: m.content,
    }))

  // 添加当前用户消息（刚push的可能还没被filter包含，保险起见）
  if (history.length === 0 || history[history.length - 1].content !== text) {
    history.push({ role: 'user', content: text })
  }

  // 添加空的AI消息占位
  const aiIdx = messages.value.length
  messages.value.push({ role: 'ai', content: '', streaming: true })
  scrollToBottom()

  const request = {
    messages: history,
    skillName: skillName.value || undefined,
    temperature: temperature.value,
    maxTokens: maxTokens.value,
    maxIterations: 5,
    enableAutoToolDispatch: true,
  }

  try {
    if (useStream.value) {
      // 流式 SSE（通过 Agent API）
      abortController = new AbortController()
      await agentApi.streamChat(request, {
        onChunk: (chunkText) => {
          if (!messages.value[aiIdx]) return
          messages.value[aiIdx].content += chunkText
        },
        onToolResult: (result) => {
          if (!messages.value[aiIdx]) return
          const summary = `[${result.toolName}] ${result.success ? 'ok' : 'fail'}`
          messages.value[aiIdx].content += `\n🔧 工具调用: ${summary}\n`
        },
        onDone: (finalResponse) => {
          if (!messages.value[aiIdx]) return
          messages.value[aiIdx].streaming = false
          isSending.value = false
          abortController = null
        },
        onError: (code, msg) => {
          if (!messages.value[aiIdx]) return
          messages.value[aiIdx].content += `\n❌ 错误: ${msg}`
          messages.value[aiIdx].streaming = false
          isSending.value = false
          abortController = null
        },
      }, abortController.signal)
    } else {
      // 非流式（通过 Agent API）
      const res = await agentApi.chat(request)
      messages.value[aiIdx].content = (res as any)?.content || JSON.stringify(res)
      messages.value[aiIdx].streaming = false
      isSending.value = false
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      // 用户主动停止，不报错
    } else if (messages.value[aiIdx]) {
      messages.value[aiIdx].content = `请求失败: ${err instanceof Error ? err.message : '未知错误'}`
      messages.value[aiIdx].streaming = false
      isSending.value = false
    }
    abortController = null
  }
}
</script>

<style scoped>
/* ====== Design Tokens ====== */
/* Palette: Slate + Indigo — professional AI assistant feel */
/* Bg: #fafafa | Surface: #fff | Border: #e8e8ed | Primary: #4f46e5 | Text: #111827 | Muted: #6b7280 */

/* ====== Page ====== */
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fafafa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
  color: #111827;
}

/* ====== Messages ====== */
.chat-main {
  flex: 1;
  overflow-y: auto;
  scroll-behavior: smooth;
  background: #f5f5f7;
}
.messages {
  max-width: 720px;
  margin: 0 auto;
  padding: 1.5rem 1.25rem;
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 8rem 0 4rem;
}
.empty-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 1rem;
  color: #c7d2fe;
}
.empty-icon svg { width: 100%; height: 100%; }
.empty-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.35rem;
}
.empty-sub {
  font-size: 0.875rem;
  color: #9ca3af;
}

/* Message rows */
.msg-row {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  margin-bottom: 1.5rem;
}
.msg-row.ai {
  justify-content: flex-start;
}
.msg-row.user {
  justify-content: flex-end;
}

/* Avatars */
.msg-avatar {
  width: 30px;
  height: 30px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}
.ai-avatar {
  background: linear-gradient(135deg, #eef2ff, #e0e7ff);
  color: #4f46e5;
}
.user-avatar {
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  color: #fff;
}

/* Bubble wrapper */
.msg-bubble-wrap {
  max-width: 80%;
  min-width: 0;
}

.msg-row.ai .msg-bubble-wrap {
  background: #fff;
  padding: 0.85rem 1.1rem;
  border-radius: 4px 16px 16px 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  border: 1px solid #f0f0f5;
}

.msg-user-text {
  display: inline-block;
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  color: #fff;
  padding: 0.6rem 1.1rem;
  border-radius: 16px 4px 16px 16px;
  font-size: 0.875rem;
  line-height: 1.65;
  word-break: break-word;
  box-shadow: 0 1px 3px rgba(79,70,229,0.2);
}

/* ====== Markdown ====== */
.msg-md {
  font-size: 0.9rem;
  line-height: 1.75;
  word-break: break-word;
  color: #1f2937;
  overflow-wrap: break-word;
}
.msg-md h1, .msg-md h2, .msg-md h3, .msg-md h4 {
  margin: 1em 0 0.4em;
  font-weight: 650;
  line-height: 1.3;
  color: #111827;
}
.msg-md h1:first-child, .msg-md h2:first-child, .msg-md h3:first-child { margin-top: 0; }
.msg-md h1 { font-size: 1.25em; }
.msg-md h2 { font-size: 1.1em; }
.msg-md h3 { font-size: 1em; }
.msg-md p { margin: 0.6em 0; }
.msg-md p:first-child { margin-top: 0; }
.msg-md p:last-child { margin-bottom: 0; }
.msg-md ul, .msg-md ol { padding-left: 1.5em; margin: 0.5em 0; }
.msg-md li { margin: 0.2em 0; }
.msg-md li::marker { color: #4f46e5; }
.msg-md blockquote {
  border-left: 3px solid #4f46e5;
  margin: 0.8em 0;
  padding: 0.3em 1em;
  color: #6b7280;
  background: #f5f3ff;
  border-radius: 0 6px 6px 0;
}
.msg-md code:not(pre code) {
  background: #f3f4f6;
  padding: 0.15em 0.4em;
  border-radius: 4px;
  font-size: 0.85em;
  color: #be123c;
}

/* Code blocks */
.msg-md .code-block {
  margin: 1em 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #2d333b;
}
.msg-md .code-header {
  display: flex;
  align-items: center;
  padding: 0.4em 1em;
  background: #161b22;
  border-bottom: 1px solid #2d333b;
  font-size: 0.75rem;
}
.msg-md .code-lang {
  color: #8b949e;
  font-weight: 600;
  text-transform: lowercase;
  letter-spacing: 0.05em;
}
.msg-md .code-body { position: relative; }
.msg-md .code-copy {
  position: absolute;
  top: 0.6em;
  right: 0.8em;
  border: none;
  background: rgba(110,118,129,0.4);
  color: #c9d1d9;
  cursor: pointer;
  font-size: 0.7rem;
  padding: 0.25em 0.65em;
  border-radius: 6px;
  font-weight: 500;
  transition: background-color 0.2s, color 0.2s;
  backdrop-filter: blur(4px);
  z-index: 1;
}
.msg-md .code-copy:hover { background: rgba(110,118,129,0.7); color: #fff; }
.msg-md pre { margin: 0; overflow-x: auto; }
.msg-md .code-block pre.hljs {
  padding: 1em 1.2em;
  background: #0d1117;
  border: none;
  border-radius: 0;
  color: #c9d1d9;
}
.msg-md table { border-collapse: collapse; margin: 0.8em 0; font-size: 0.85em; }
.msg-md th, .msg-md td { border: 1px solid #e5e7eb; padding: 0.4em 0.8em; text-align: left; }
.msg-md th { background: #f9fafb; font-weight: 600; }
.msg-md hr { border: none; border-top: 1px solid #e5e7eb; margin: 1em 0; }
.msg-md strong { font-weight: 650; }
.msg-md a { color: #4f46e5; text-decoration: none; }
.msg-md a:hover { text-decoration: underline; }
.msg-md img { max-width: 100%; border-radius: 8px; }

.streaming-cursor {
  display: inline;
  animation: blink 0.8s infinite;
  color: #4f46e5;
  font-weight: 700;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* ====== Footer ====== */
.chat-footer {
  background: #fafafa;
  padding: 0.75rem 1.5rem 1.25rem;
  flex-shrink: 0;
}

.skill-select {
  padding: 0.3rem 1.5rem 0.3rem 0.5rem;
  border: 1px solid #e8e8ed;
  border-radius: 8px;
  font-size: 0.8rem;
  background: #fafafa;
  color: #374151;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s;
  flex-shrink: 0;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.4rem center;
}
.skill-select:focus { border-color: #4f46e5; }

.options-panel {
  max-width: 720px;
  margin: 0 auto 0.75rem;
  display: flex;
  gap: 1.5rem;
  padding: 0.65rem 1rem;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e8e8ed;
}
.opt-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: #6b7280;
}
.opt-input {
  width: 60px;
  padding: 0.2rem 0.4rem;
  border: 1px solid #e8e8ed;
  border-radius: 6px;
  font-size: 0.75rem;
  outline: none;
  transition: border-color 0.2s;
}
.opt-input:focus { border-color: #4f46e5; }
.opt-check { cursor: pointer; }
.opt-check input { accent-color: #4f46e5; }

.input-wrap {
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  align-items: flex-end;
  gap: 0.4rem;
  background: #fff;
  border: 1px solid #e8e8ed;
  border-radius: 16px;
  padding: 0.5rem 0.5rem 0.5rem 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.input-wrap:focus-within {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79,70,229,0.08);
}

.chat-textarea {
  flex: 1;
  border: none;
  outline: none;
  font-size: 0.9rem;
  line-height: 1.5;
  resize: none;
  background: transparent;
  font-family: inherit;
  max-height: 120px;
  padding: 0.15rem 0;
  color: #111827;
}
.chat-textarea::placeholder { color: #9ca3af; }

.btn-send {
  width: 36px;
  height: 36px;
  background: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background-color 0.2s;
}
.btn-send:hover:not(:disabled) { background: #4338ca; }
.btn-send:disabled { opacity: 0.3; cursor: not-allowed; }

.btn-stop {
  width: 36px;
  height: 36px;
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background-color 0.2s;
}
.btn-stop:hover { background: #dc2626; }

.footer-actions {
  max-width: 720px;
  margin: 0.35rem auto 0;
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}
.btn-ghost {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.72rem;
  color: #9ca3af;
  transition: color 0.2s, background 0.2s;
}
.btn-ghost:hover { color: #6b7280; background: #f3f4f6; }
</style>
