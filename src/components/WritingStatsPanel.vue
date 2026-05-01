<script setup lang="ts">
import { computed } from 'vue'
import '../styles/WritingStatsPanel.css'

interface ChapterStat {
  id: string
  title: string
  wordCount: number
  status: string
  sequence: number
}

const props = defineProps<{
  chapters: ChapterStat[]
  totalWordCount: number
  dailyWordCount: number
}>()

const stats = computed(() => {
  const chs = props.chapters
  if (chs.length === 0) return null

  const wordCounts = chs.map(c => c.wordCount || 0)
  const totalWords = props.totalWordCount || wordCounts.reduce((a, b) => a + b, 0)
  const avgWords = Math.round(totalWords / chs.length)
  const maxChapter = chs.reduce((max, c) => (c.wordCount || 0) > (max.wordCount || 0) ? c : max, chs[0])
  const minChapter = chs.reduce((min, c) => (c.wordCount || 0) < (min.wordCount || 0) ? c : min, chs[0])
  const publishedCount = chs.filter(c => c.status === 'published').length
  const draftCount = chs.filter(c => c.status === 'draft').length
  const writingChapters = chs.filter(c => c.status === 'writing').length

  return {
    totalChapters: chs.length,
    totalWords,
    avgWords,
    maxChapter,
    minChapter,
    publishedCount,
    draftCount,
    writingChapters,
    todayWords: props.dailyWordCount || 0,
  }
})

const barMaxHeight = 60

const barData = computed(() => {
  if (!stats.value) return []
  const max = Math.max(...props.chapters.map(c => c.wordCount || 0), 1)
  return props.chapters.map(c => ({
    id: c.id,
    title: c.title,
    wordCount: c.wordCount || 0,
    height: Math.max(4, Math.round(((c.wordCount || 0) / max) * barMaxHeight)),
    status: c.status,
    sequence: c.sequence,
  }))
})
</script>

<template>
  <div class="stats-panel">
    <div class="stats-header">
      <h3>写作统计</h3>
    </div>

    <div v-if="!stats" class="stats-empty">
      <p>暂无统计数据</p>
    </div>

    <div v-else class="stats-body">
      <!-- 概览卡片 -->
      <div class="stats-cards">
        <div class="stats-card">
          <div class="stats-card-value">{{ stats.totalWords.toLocaleString() }}</div>
          <div class="stats-card-label">总字数</div>
        </div>
        <div class="stats-card">
          <div class="stats-card-value">{{ stats.totalChapters }}</div>
          <div class="stats-card-label">总章节</div>
        </div>
        <div class="stats-card accent">
          <div class="stats-card-value">{{ stats.todayWords.toLocaleString() }}</div>
          <div class="stats-card-label">今日新增</div>
        </div>
        <div class="stats-card">
          <div class="stats-card-value">{{ stats.avgWords.toLocaleString() }}</div>
          <div class="stats-card-label">章节均字数</div>
        </div>
      </div>

      <!-- 状态分布 -->
      <div class="stats-section">
        <div class="stats-section-title">章节状态</div>
        <div class="stats-status-bar">
          <div v-if="stats.publishedCount" class="stats-status-segment published" :style="{ flex: stats.publishedCount }">
            <span>{{ stats.publishedCount }} 已定稿</span>
          </div>
          <div v-if="stats.writingChapters" class="stats-status-segment writing" :style="{ flex: stats.writingChapters }">
            <span>{{ stats.writingChapters }} 写作中</span>
          </div>
          <div v-if="stats.draftCount" class="stats-status-segment draft" :style="{ flex: stats.draftCount }">
            <span>{{ stats.draftCount }} 草稿</span>
          </div>
        </div>
      </div>

      <!-- 各章字数柱状图 -->
      <div class="stats-section">
        <div class="stats-section-title">各章字数</div>
        <div class="stats-chart">
          <div
            v-for="bar in barData"
            :key="bar.id"
            class="stats-bar-wrapper"
            :title="`${bar.title}: ${bar.wordCount} 字`"
          >
            <div
              class="stats-bar"
              :class="bar.status"
              :style="{ height: bar.height + 'px' }"
            ></div>
            <span class="stats-bar-label">{{ bar.sequence }}</span>
          </div>
        </div>
      </div>

      <!-- 极值统计 -->
      <div class="stats-section">
        <div class="stats-section-title">极值章节</div>
        <div class="stats-extremes">
          <div class="stats-extreme">
            <span class="stats-extreme-label">最长</span>
            <span class="stats-extreme-name">{{ stats.maxChapter.title }}</span>
            <span class="stats-extreme-count">{{ (stats.maxChapter.wordCount || 0).toLocaleString() }} 字</span>
          </div>
          <div class="stats-extreme">
            <span class="stats-extreme-label">最短</span>
            <span class="stats-extreme-name">{{ stats.minChapter.title }}</span>
            <span class="stats-extreme-count">{{ (stats.minChapter.wordCount || 0).toLocaleString() }} 字</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
