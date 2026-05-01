<template>
  <div class="editor-topbar">
    <!-- 左侧：返回 + 作品信息 + 章节 -->
    <div class="etb-left">
      <button class="etb-back" title="返回作品列表" @click="$emit('back')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <span class="etb-work-title">{{ workTitle }}</span>
      <span class="etb-genre">{{ genre }}</span>
      <span class="etb-sep">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </span>
      <span class="etb-chapter">{{ chapterTitle }}</span>
    </div>

    <!-- 右侧：统计 + 工具 + 保存 -->
    <div class="etb-right">
      <!-- 字数统计 -->
      <div class="etb-stat" title="当前章节字数">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13">
          <polyline points="4 7 4 4 20 4 20 7"/>
          <line x1="9" y1="20" x2="15" y2="20"/>
          <line x1="12" y1="4" x2="12" y2="20"/>
        </svg>
        <span>{{ wordCount.toLocaleString() }} 字</span>
      </div>
      <div class="etb-vdivider"></div>
      <!-- 今日字数 -->
      <div class="etb-stat" title="今日新增字数">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        <span>今日 {{ dailyCount.toLocaleString() }}</span>
      </div>
      <div class="etb-vdivider"></div>
      <!-- 全屏 -->
      <button
        class="etb-icon-btn"
        :class="{ active: isFullscreen }"
        :title="isFullscreen ? '退出全屏' : '专注全屏'"
        @click="$emit('toggle-fullscreen')"
      >
        <!-- 进入全屏图标 -->
        <svg v-if="!isFullscreen" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/>
        </svg>
        <!-- 退出全屏图标 -->
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3"/>
        </svg>
      </button>
      <!-- 设置 -->
      <button
        class="etb-icon-btn"
        :class="{ active: showSettings }"
        title="编辑器设置"
        @click="$emit('settings')"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
        </svg>
      </button>
      <!-- 保存 -->
      <button class="etb-save" @click="$emit('save')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
          <polyline points="17 21 17 13 7 13 7 21"/>
          <polyline points="7 3 7 8 15 8"/>
        </svg>
        保存
      </button>
      <!-- 导出 -->
      <div class="etb-export-wrapper">
        <button class="etb-icon-btn" title="导出作品" @click="toggleExport">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </button>
        <div v-if="showExport" class="etb-export-dropdown">
          <button class="etb-export-item" @click="$emit('export-txt'); closeExport()">
            <span class="etb-export-icon">TXT</span>
            <span>导出为纯文本</span>
          </button>
          <button class="etb-export-item" @click="$emit('export-epub'); closeExport()">
            <span class="etb-export-icon">EPUB</span>
            <span>导出为电子书</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import '../styles/EditorTopBar.css'

defineProps<{
  workTitle: string
  genre: string
  chapterTitle: string
  wordCount: number
  dailyCount: number
  isFullscreen: boolean
  showSettings: boolean
}>()

const showExport = ref(false)

function toggleExport() {
  showExport.value = !showExport.value
}

function closeExport() {
  showExport.value = false
}

defineEmits<{
  back: []
  save: []
  settings: []
  'toggle-fullscreen': []
  'export-txt': []
  'export-epub': []
}>()
</script>
