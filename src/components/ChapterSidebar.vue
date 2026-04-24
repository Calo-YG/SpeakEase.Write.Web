<template>
  <div :class="['chapter-sidebar', { collapsed }]">
    <!-- 头部 -->
    <div class="sidebar-header">
      <!-- 折叠按钮 -->
      <button class="sidebar-collapse-btn" :title="collapsed ? '展开章节列表' : '收起章节列表'" @click="collapsed = !collapsed">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline :points="collapsed ? '9 18 15 12 9 6' : '15 18 9 12 15 6'"/>
        </svg>
      </button>

      <template v-if="!collapsed">
        <span class="sidebar-title">章节列表</span>
        <button class="sidebar-add-doc" title="添加章节文档" @click="$emit('new-chapter')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="13" x2="12" y2="17"/>
            <line x1="10" y1="15" x2="14" y2="15"/>
          </svg>
        </button>
      </template>

      <!-- 折叠状态：显示章节数量徽标 -->
      <div v-else class="sidebar-collapsed-badge" :title="`共 ${chapters.length} 章`">
        {{ chapters.length }}
      </div>
    </div>

    <!-- 折叠时：竖排章节序号 -->
    <div v-if="collapsed" class="sidebar-collapsed-list">
      <div
        v-for="(ch, idx) in chapters"
        :key="ch.id"
        :class="['sidebar-collapsed-item', { active: ch.id === activeChapterId }]"
        :title="ch.title"
        @click="$emit('select', ch)"
      >
        {{ idx + 1 }}
      </div>
    </div>

    <!-- 展开时：章节列表 -->
    <template v-else>
      <div class="chapter-list">
        <div
          v-for="ch in chapters"
          :key="ch.id"
          :class="['chapter-item', { active: ch.id === activeChapterId }]"
          @click="$emit('select', ch)"
        >
          <div class="ch-header">
            <span class="ch-title">{{ ch.title }}</span>
            <span v-if="ch.badge" :class="['ch-badge', `ch-badge-${ch.badge}`]">
              {{ badgeLabel(ch.badge) }}
            </span>
          </div>
          <div class="ch-meta">
            <span v-if="ch.wordCount" class="ch-words">{{ ch.wordCount.toLocaleString() }}字</span>
            <span v-if="ch.note" class="ch-note">{{ ch.note }}</span>
          </div>
        </div>
      </div>

      <!-- 底部新建 -->
      <div class="sidebar-footer">
        <button class="new-chapter-btn" @click="$emit('new-chapter')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          新建章节
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import '../styles/ChapterSidebar.css'

export interface ChapterItem {
  id: string
  title: string
  wordCount?: number
  badge?: 'draft' | 'published' | 'review'
  note?: string
}

defineProps<{
  chapters: ChapterItem[]
  activeChapterId: string
}>()

defineEmits<{
  select: [ch: ChapterItem]
  'new-chapter': []
}>()

const collapsed = ref(false)

function badgeLabel(badge: string): string {
  const map: Record<string, string> = { draft: '草稿', published: '已发布', review: '审核中' }
  return map[badge] ?? badge
}
</script>
