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
      <button class="etool-btn" @click="$emit('polish')" title="润色文字">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 20h9"/>
          <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
        润色
      </button>
      <!-- 灵感 -->
      <button class="etool-btn" @click="$emit('inspire')" title="获取灵感">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import '../styles/EditorToolbar.css'

const props = defineProps<{
  showCharacters: boolean
  showOutline: boolean
  showAiChat: boolean
}>()

const emit = defineEmits<{
  'ai-continue': [text: string]
  'ai-write': [text: string]
  polish: []
  inspire: []
  'toggle-characters': []
  'toggle-outline': []
  'toggle-ai-chat': []
}>()

// ── 模式 ──
type EditorMode = 'assist' | 'focus' | 'chat'
const currentMode = ref<EditorMode>('assist')
const showModeMenu = ref(false)

const modeLabel = computed(() => {
  const map: Record<EditorMode, string> = { assist: '辅助模式', focus: '专注模式', chat: '对话模式' }
  return map[currentMode.value]
})

// ── AI 续写 ──
const aiContinueLoading = ref(false)
async function handleAiContinue() {
  aiContinueLoading.value = true
  await new Promise(r => setTimeout(r, 1200))
  const mockText = '\n\n觉醒石表面泛起一层淡淡的白光，随即迅速扩散，将林凡的手掌完全笼罩。台下的窃窃私语骤然停止，所有人都屏住了呼吸。'
  emit('ai-continue', mockText)
  aiContinueLoading.value = false
}

// ── AI 写本章 ──
const aiWriteLoading = ref(false)
async function handleAiWrite() {
  aiWriteLoading.value = true
  await new Promise(r => setTimeout(r, 1800))
  const mockText = '\n\n白光越来越盛，光柱直冲云霄。林凡感到一股磅礴的力量从掌心涌入，顺着经脉蔓延至全身每一个角落。\n\n"这……这是什么武魂？"\n\n林家族长站了起来，声音颤抖，眼中写满了不可置信。'
  emit('ai-write', mockText)
  aiWriteLoading.value = false
}
</script>
