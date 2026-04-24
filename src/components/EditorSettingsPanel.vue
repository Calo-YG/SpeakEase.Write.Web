<template>
  <Teleport to="body">
    <Transition name="settings-panel">
      <div v-if="show" class="esp-overlay" @click.self="$emit('close')">
        <div class="esp-panel" @click.stop>
          <!-- 头部 -->
          <div class="esp-header">
            <span class="esp-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
              </svg>
              编辑器设置
            </span>
            <button class="esp-close" @click="$emit('close')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <!-- 字体大小 -->
          <div class="esp-section">
            <div class="esp-label">字体大小</div>
            <div class="esp-btn-group">
              <button
                v-for="opt in fontSizeOptions"
                :key="opt.value"
                :class="['esp-opt-btn', { active: modelValue.fontSize === opt.value }]"
                @click="update('fontSize', opt.value)"
              >
                <span :style="{ fontSize: opt.previewSize }">A</span>
                <span class="esp-opt-sub">{{ opt.label }}</span>
              </button>
            </div>
          </div>

          <!-- 行间距 -->
          <div class="esp-section">
            <div class="esp-label">行间距</div>
            <div class="esp-btn-group">
              <button
                v-for="opt in lineHeightOptions"
                :key="opt.value"
                :class="['esp-opt-btn', { active: modelValue.lineHeight === opt.value }]"
                @click="update('lineHeight', opt.value)"
              >
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
                  <line x1="4" :y1="opt.lines[0]" x2="16" :y2="opt.lines[0]"/>
                  <line x1="4" :y1="opt.lines[1]" x2="16" :y2="opt.lines[1]"/>
                  <line x1="4" :y1="opt.lines[2]" x2="14" :y2="opt.lines[2]"/>
                </svg>
                <span class="esp-opt-sub">{{ opt.label }}</span>
              </button>
            </div>
          </div>

          <!-- 正文宽度 -->
          <div class="esp-section">
            <div class="esp-label">正文宽度</div>
            <div class="esp-btn-group">
              <button
                v-for="opt in docWidthOptions"
                :key="opt.value"
                :class="['esp-opt-btn', { active: modelValue.docWidth === opt.value }]"
                @click="update('docWidth', opt.value)"
              >
                <div class="esp-width-preview" :style="{ width: opt.previewWidth }"></div>
                <span class="esp-opt-sub">{{ opt.label }}</span>
              </button>
            </div>
          </div>

          <!-- 编辑器主题 -->
          <div class="esp-section">
            <div class="esp-label">编辑器主题</div>
            <div class="esp-theme-group">
              <button
                v-for="opt in themeOptions"
                :key="opt.value"
                :class="['esp-theme-btn', { active: modelValue.theme === opt.value }]"
                :style="{ background: opt.bg, color: opt.color, borderColor: modelValue.theme === opt.value ? '#4f46e5' : opt.border }"
                @click="update('theme', opt.value)"
              >
                <span class="esp-theme-dot" :style="{ background: opt.dot }"></span>
                {{ opt.label }}
              </button>
            </div>
          </div>

          <!-- 分隔线 -->
          <div class="esp-divider"></div>

          <!-- 自动保存 -->
          <div class="esp-section esp-section-row">
            <div>
              <div class="esp-label">自动保存</div>
              <div class="esp-hint">每 30 秒自动保存一次</div>
            </div>
            <button
              :class="['esp-toggle', { on: modelValue.autoSave }]"
              @click="update('autoSave', !modelValue.autoSave)"
            >
              <span class="esp-toggle-thumb"></span>
            </button>
          </div>

          <!-- 重置 -->
          <button class="esp-reset" @click="$emit('reset')">恢复默认设置</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import '../styles/EditorSettingsPanel.css'

export interface EditorSettings {
  fontSize: number
  lineHeight: number
  docWidth: number
  theme: 'light' | 'warm' | 'dark'
  autoSave: boolean
}

const props = defineProps<{
  show: boolean
  modelValue: EditorSettings
}>()

const emit = defineEmits<{
  close: []
  reset: []
  'update:modelValue': [settings: EditorSettings]
}>()

function update<K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) {
  emit('update:modelValue', { ...props.modelValue, [key]: value } as EditorSettings)
}

const fontSizeOptions = [
  { value: 14, label: '小', previewSize: '12px' },
  { value: 15.5, label: '中', previewSize: '15px' },
  { value: 17, label: '大', previewSize: '18px' },
  { value: 19, label: '超大', previewSize: '21px' },
]

const lineHeightOptions = [
  { value: 1.6, label: '紧凑', lines: [5, 10, 15] },
  { value: 1.9, label: '标准', lines: [4, 10, 16] },
  { value: 2.3, label: '宽松', lines: [3, 10, 17] },
]

const docWidthOptions = [
  { value: 580, label: '窄', previewWidth: '36%' },
  { value: 700, label: '标准', previewWidth: '52%' },
  { value: 900, label: '宽', previewWidth: '68%' },
]

const themeOptions: { value: EditorSettings['theme']; label: string; bg: string; color: string; border: string; dot: string }[] = [
  { value: 'light', label: '白纸', bg: '#fff', color: '#111', border: '#e5e7eb', dot: '#e5e7eb' },
  { value: 'warm',  label: '护眼', bg: '#f5f0e8', color: '#3d2b1f', border: '#d4c4a8', dot: '#c8b18a' },
  { value: 'dark',  label: '夜间', bg: '#1a1a2e', color: '#c9d1d9', border: '#30363d', dot: '#30363d' },
]
</script>
