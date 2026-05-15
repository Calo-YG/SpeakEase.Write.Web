<template>
  <div class="graph-view">
    <div class="graph-toolbar">
      <h3 class="graph-title">角色关系图谱</h3>
      <div class="graph-actions">
        <select v-model="selectedGraphId" class="graph-select" @change="handleSelectGraph">
          <option :value="null">-- 选择图谱 --</option>
          <option v-for="g in graphList" :key="g.id" :value="g.id">{{ g.name }}</option>
        </select>
        <button class="btn-sm" @click="fetchGraphs" :disabled="loading" title="刷新">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
          </svg>
        </button>
      </div>
    </div>

    <div v-if="loading" class="graph-loading">
      <div class="graph-spinner"></div>
    </div>

    <div v-else-if="!graphData || graphData.nodes.length === 0" class="graph-empty">
      <p>暂无图谱数据</p>
      <p class="hint">通过 AI 对话让 CreationAgent 或 WriteAgent 自动构建关系图谱</p>
    </div>

    <div v-else class="graph-canvas-container">
      <svg
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid meet"
        class="graph-svg"
        @wheel.prevent="onWheel"
      >
        <g :transform="`translate(${panX},${panY}) scale(${scale})`">
          <line
            v-for="edge in graphData.edges"
            :key="edge.id"
            :x1="lineX(edge.sourceNodeId, edge.targetNodeId)"
            :y1="lineY(edge.sourceNodeId, edge.targetNodeId)"
            :x2="lineX(edge.targetNodeId, edge.sourceNodeId)"
            :y2="lineY(edge.targetNodeId, edge.sourceNodeId)"
            :stroke="RELATION_COLORS[edge.relationType] ?? '#748ffc'"
            :stroke-width="Math.max(0.8, edge.weight / 3)"
            :stroke-dasharray="edge.direction === 'undirected' ? '6,3' : 'none'"
            :opacity="0.35 + edge.weight * 0.06"
          />

          <g
            v-for="node in graphData.nodes"
            :key="node.id"
            :transform="`translate(${posMap[node.id]?.x ?? 0},${posMap[node.id]?.y ?? 0})`"
            @click.stop="handleNodeClick(node)"
            class="graph-node-card"
            :class="{ selected: selectedNodeId === node.id }"
          >
            <title>{{ node.displayName }} · {{ NODE_TYPE_LABELS[node.nodeType] ?? node.nodeType }} · 重要度 {{ node.importance }}/10</title>
            <rect
              :width="CARD_W" :height="CARD_H" rx="6"
              :fill="NODE_CARD_FILLS[node.nodeType] ?? NODE_CARD_FILLS.minor"
              :stroke="selectedNodeId === node.id ? '#fff' : 'transparent'"
              :stroke-width="selectedNodeId === node.id ? 2 : 0"
            />
            <rect :width="CARD_W" :height="CARD_H" rx="6" fill="none"
              stroke="#ffffff11" stroke-width="1"/>
            <text
              :x="CARD_W / 2" :y="14" text-anchor="middle"
              :font-size="11" :font-weight="700"
              :fill="NODE_TEXT_COLORS[node.nodeType] ?? '#c0c0d0'"
            >{{ node.displayName }}</text>
            <rect
              :x="4" :y="22" :width="CARD_W - 8" height="14" rx="3"
              :fill="`${NODE_COLORS[node.nodeType] ?? NODE_COLORS.minor}22`"
            />
            <text
              :x="CARD_W / 2" :y="32.5" text-anchor="middle"
              :font-size="8" :font-weight="600"
              :fill="NODE_COLORS[node.nodeType] ?? NODE_COLORS.minor"
            >{{ NODE_TYPE_LABELS[node.nodeType] ?? node.nodeType }}</text>
          </g>
        </g>
      </svg>

      <div class="graph-legend">
        <span v-for="item in legendItems" :key="item[0]" class="legend-item">
          <span class="legend-dot" :style="{ background: item[1] }"></span> {{ item[2] }}
        </span>
      </div>

      <div class="zoom-controls">
        <button @click="zoomIn" title="放大">+</button>
        <button @click="zoomOut" title="缩小">−</button>
        <button @click="resetView" title="重置">⌂</button>
      </div>
    </div>

    <div v-if="selectedNodeId" class="character-detail-overlay" @click.self="closeDetail">
      <div class="character-detail-card">
        <button class="close-btn" @click="closeDetail">&times;</button>
        <h3>{{ charDetail?.name ?? selectedNodeName }}</h3>
        <div v-if="selectedNode" class="detail-tags">
          <span class="tag" :class="selectedNode.nodeType">{{ NODE_TYPE_LABELS[selectedNode.nodeType] ?? selectedNode.nodeType }}</span>
        </div>

        <div v-if="charDetail" class="detail-info">
          <div v-for="row in detailRows" :key="row.label" class="info-row">
            <span class="label">{{ row.label }}</span>
            <span :class="{ 'bg-story': row.isLong }">{{ row.value }}</span>
          </div>
        </div>

        <div v-if="characterArcs.length > 0" class="arc-section">
          <h4>成长弧线</h4>
          <div class="arc-timeline">
            <div v-for="arc in characterArcs" :key="arc.id" class="arc-step">
              <div class="arc-marker">S{{ arc.stageOrder }}</div>
              <div class="arc-content">
                <div class="arc-title">{{ arc.stageTitle }}</div>
                <div class="arc-states" v-if="arc.initialState || arc.changedState">
                  <span v-if="arc.initialState" class="initial">「{{ arc.initialState }}」</span>
                  <span v-if="arc.initialState && arc.changedState" class="arrow">→</span>
                  <span v-if="arc.changedState" class="changed">「{{ arc.changedState }}」</span>
                </div>
                <div class="arc-trigger" v-if="arc.triggerEvent">触发：{{ arc.triggerEvent }}</div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="selectedNodeRelationships.length > 0" class="rel-section">
          <h4>角色关系</h4>
          <div v-for="rel in selectedNodeRelationships" :key="rel.id" class="rel-item">
            <span class="rel-badge" :class="rel.relationshipType">{{ rel.relationshipType }}</span>
            {{ getOtherCharName(rel.id) }}
            <span v-if="rel.description" class="rel-desc">{{ rel.description }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { characterApi, type CharacterItem } from '@/lib/api/character'
import { graphApi, type CharacterGraphItem, type CharacterGraphNode } from '@/lib/api/extras'
import { arcApi, type CharacterArcItem } from '@/lib/api/extras'
import { relationshipApi, type CharacterRelationshipItem } from '@/lib/api/extras'

const props = defineProps<{ workId: string }>()

const loading = ref(false)
const graphList = ref<CharacterGraphItem[]>([])
const selectedGraphId = ref<string | null>(null)
const graphData = ref<CharacterGraphItem | null>(null)
const selectedNodeId = ref<string | null>(null)
const selectedNode = computed(() => graphData.value?.nodes.find(n => n.id === selectedNodeId.value) ?? null)
const selectedNodeName = computed(() => selectedNode.value?.displayName ?? '')
const charDetail = ref<CharacterItem | null>(null)
const characterArcs = ref<CharacterArcItem[]>([])
const selectedNodeRelationships = ref<CharacterRelationshipItem[]>([])
const characters = ref<CharacterItem[]>([])
const allRelationships = ref<CharacterRelationshipItem[]>([])

const panX = ref(0)
const panY = ref(0)
const scale = ref(1)

const NODE_COLORS: Record<string, string> = {
  protagonist: '#a78bfa',
  antagonist: '#f87171',
  supporting: '#4ade80',
  minor: '#9ca3af',
}

const NODE_CARD_FILLS: Record<string, string> = {
  protagonist: '#1e1b4b',
  antagonist: '#2d1018',
  supporting: '#0a1f14',
  minor: '#121428',
}

const NODE_TEXT_COLORS: Record<string, string> = {
  protagonist: '#c4b5fd',
  antagonist: '#fca5a5',
  supporting: '#86efac',
  minor: '#c0c0d0',
}

const NODE_TYPE_LABELS: Record<string, string> = {
  protagonist: '主角',
  antagonist: '反派',
  supporting: '配角',
  minor: '次要',
}

const RELATION_COLORS: Record<string, string> = {
  '父子': '#b794f4', '师徒': '#b794f4',
  '夫妻': '#f06595', '恋人': '#f06595',
  '宿敌': '#ff6b6b', '仇人': '#ff6b6b',
  '挚友': '#51cf66', '同门': '#51cf66',
}

const legendItems: [string, string, string][] = [
  ['protagonist', NODE_COLORS.protagonist, '主角'],
  ['antagonist', NODE_COLORS.antagonist, '反派'],
  ['supporting', NODE_COLORS.supporting, '配角'],
  ['minor', NODE_COLORS.minor, '次要'],
]

const detailRows = computed(() => {
  if (!charDetail.value) return []
  const rows: { label: string; value: string; isLong?: boolean }[] = []
  const c = charDetail.value
  if (c.identity) rows.push({ label: '身份', value: c.identity })
  if (c.alias) rows.push({ label: '别名', value: c.alias })
  if (c.gender) rows.push({ label: '性别', value: c.gender })
  if (c.ageDescription) rows.push({ label: '年龄', value: c.ageDescription })
  if (c.personality) rows.push({ label: '性格', value: c.personality })
  if (c.appearance) rows.push({ label: '外貌', value: c.appearance })
  if (c.motivation) rows.push({ label: '动机', value: c.motivation })
  if (c.abilityDescription) rows.push({ label: '能力', value: c.abilityDescription })
  if (c.backgroundStory) rows.push({ label: '背景', value: c.backgroundStory, isLong: true })
  if (c.tags?.length) rows.push({ label: '标签', value: c.tags.join('、') })
  return rows
})

const CARD_W = 72
const CARD_H = 40

const posMap = computed(() => {
  const nodes = graphData.value?.nodes ?? []
  const n = nodes.length
  const cx = 600, cy = 400, r = Math.min(n * 42, 280)

  const map: Record<string, { x: number; y: number }> = {}
  nodes.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2
    map[node.id] = {
      x: cx + Math.cos(angle) * r - CARD_W / 2,
      y: cy + Math.sin(angle) * r - CARD_H / 2,
    }
  })
  return map
})

function lineX(fromId: string, toId: string) {
  const f = posMap.value[fromId], t = posMap.value[toId]
  if (!f || !t) return 0
  const cx = f.x + CARD_W / 2, cy = f.y + CARD_H / 2
  const dx = t.x + CARD_W / 2 - cx
  const dy = t.y + CARD_H / 2 - cy
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  return cx + (dx / len) * (CARD_W / 2 + 4)
}
function lineY(fromId: string, toId: string) {
  const f = posMap.value[fromId], t = posMap.value[toId]
  if (!f || !t) return 0
  const cx = f.x + CARD_W / 2, cy = f.y + CARD_H / 2
  const dx = t.x + CARD_W / 2 - cx
  const dy = t.y + CARD_H / 2 - cy
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  return cy + (dy / len) * (CARD_W / 2 + 4)
}

function zoomIn() { scale.value = Math.min(3, scale.value + 0.15) }
function zoomOut() { scale.value = Math.max(0.3, scale.value - 0.15) }
function resetView() { panX.value = 0; panY.value = 0; scale.value = 1 }
function onWheel(e: WheelEvent) {
  const delta = e.deltaY > 0 ? -0.08 : 0.08
  scale.value = Math.max(0.3, Math.min(3, scale.value + delta))
}

const charNameMap = computed(() => {
  const map = new Map<string, string>()
  for (const c of characters.value) map.set(c.id, c.name)
  return map
})

function getOtherCharName(relId: string) {
  const rel = allRelationships.value.find(r => r.id === relId)
  if (!rel) return ''
  const node = graphData.value?.nodes.find(n =>
    n.id === selectedNodeId.value || n.characterId === selectedNode.value?.characterId
  )
  if (!node) return ''
  const otherId = rel.sourceCharacterId === node.characterId
    ? rel.targetCharacterId
    : rel.sourceCharacterId
  return charNameMap.value.get(otherId) ?? otherId
}

function closeDetail() {
  selectedNodeId.value = null
  charDetail.value = null
  characterArcs.value = []
  selectedNodeRelationships.value = []
}

async function handleNodeClick(node: CharacterGraphNode) {
  if (selectedNodeId.value === node.id) {
    closeDetail()
    return
  }
  selectedNodeId.value = node.id
  charDetail.value = null
  characterArcs.value = []
  selectedNodeRelationships.value = []

  const char = characters.value.find(c => c.id === node.characterId)
  if (char) {
    charDetail.value = char
  } else if (node.characterId) {
    try {
      const res = await characterApi.getById(props.workId, node.characterId)
      charDetail.value = res.data ?? null
    } catch { /* ignore */ }
  }

  if (node.characterId) {
    try {
      const arcsRes = await arcApi.listByCharacter(props.workId, node.characterId)
      characterArcs.value = arcsRes.data ?? []
    } catch { /* ignore */ }
    selectedNodeRelationships.value = allRelationships.value.filter(r =>
      r.sourceCharacterId === node.characterId || r.targetCharacterId === node.characterId
    )
  }
}

async function fetchGraphs() {
  loading.value = true
  try {
    const res = await graphApi.list(props.workId)
    graphList.value = res.data ?? []
    if (graphList.value.length > 0 && !selectedGraphId.value) {
      selectedGraphId.value = graphList.value[0].id
      await loadGraphDetail(graphList.value[0].id)
    }
    await loadCharacters()
    await loadAllRelationships()
  } finally {
    loading.value = false
  }
}

async function handleSelectGraph() {
  closeDetail()
  if (selectedGraphId.value) {
    await loadGraphDetail(selectedGraphId.value)
  }
}

async function loadGraphDetail(graphId: string) {
  loading.value = true
  try {
    const res = await graphApi.getDetail(props.workId, graphId)
    graphData.value = res.data ?? null
  } finally {
    loading.value = false
  }
}

async function loadCharacters() {
  try {
    const res = await characterApi.list(props.workId)
    characters.value = res.data ?? []
  } catch { /* ignore */ }
}

async function loadAllRelationships() {
  try {
    const res = await relationshipApi.list(props.workId)
    allRelationships.value = res.data ?? []
  } catch { /* ignore */ }
}

onMounted(() => {
  if (props.workId) fetchGraphs()
})

defineExpose({ fetchGraphs })
</script>

<style scoped>
.graph-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #1a1a2e;
  overflow: hidden;
}
.graph-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid #2a2a4a;
  flex-shrink: 0;
}
.graph-title { font-size: 13px; font-weight: 600; color: #e0e0f0; margin: 0; }
.graph-actions { display: flex; gap: 6px; align-items: center; }
.graph-select {
  background: #16213e; color: #c0c0d0; border: 1px solid #2a2a4a;
  border-radius: 4px; padding: 4px 8px; font-size: 12px; max-width: 180px;
}
.graph-select option { background: #1a1a2e; color: #c0c0d0; }

.graph-loading, .graph-empty {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: #888; font-size: 13px;
}
.graph-empty .hint { margin-top: 8px; font-size: 11px; color: #666; }
.graph-spinner {
  width: 28px; height: 28px; border: 3px solid #2a2a4a; border-top-color: #667eea;
  border-radius: 50%; animation: spin .8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.graph-canvas-container { flex: 1; position: relative; overflow: hidden; background: #12122a; }
.graph-svg { width: 100%; height: 100%; display: block; }

.graph-node-card { cursor: pointer; transition: opacity .15s; }
.graph-node-card:hover { opacity: 0.85; }
.graph-node-card text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; user-select: none; pointer-events: none; }

.graph-legend {
  position: absolute; bottom: 10px; left: 10px; display: flex; gap: 10px;
  background: #16213ecc; padding: 6px 10px; border-radius: 6px; font-size: 11px; color: #a0a0c0;
}
.legend-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 3px; }
.legend-item { display: flex; align-items: center; white-space: nowrap; }

.zoom-controls {
  position: absolute; bottom: 10px; right: 10px; display: flex; gap: 4px;
}
.zoom-controls button {
  width: 28px; height: 28px; border-radius: 4px; background: #16213e; color: #ccc;
  border: 1px solid #2a2a4a; font-size: 16px; cursor: pointer; display: flex;
  align-items: center; justify-content: center;
}
.zoom-controls button:hover { background: #2a2a5a; }

.character-detail-overlay {
  position: absolute; inset: 0; background: #000000aa; display: flex;
  align-items: flex-start; justify-content: flex-end; z-index: 10; padding: 10px;
}
.character-detail-card {
  width: 340px; max-height: calc(100vh - 180px); overflow-y: auto;
  background: #1e1e3a; border: 1px solid #3a3a6a; border-radius: 8px; padding: 18px;
  color: #d0d0e0; box-shadow: 0 8px 32px #00000055;
}
.character-detail-card h3 { margin: 0 0 10px; font-size: 18px; color: #fff; }
.close-btn {
  float: right; background: none; border: none; color: #888; font-size: 20px;
  cursor: pointer; padding: 0; line-height: 1;
}
.close-btn:hover { color: #fff; }

.detail-tags { display: flex; gap: 6px; margin-bottom: 14px; flex-wrap: wrap; }
.tag {
  padding: 3px 8px; border-radius: 4px; font-size: 11px; background: #2a2a5a;
}
.tag.protagonist { background: #667eea44; color: #667eea; }
.tag.antagonist { background: #e74c3c44; color: #e74c3c; }
.tag.supporting { background: #27ae6044; color: #27ae60; }

.detail-info { margin-bottom: 14px; }
.info-row { display: flex; margin-bottom: 6px; font-size: 12px; line-height: 1.6; }
.info-row .label { color: #888; min-width: 36px; margin-right: 8px; flex-shrink: 0; }
.bg-story { color: #aaa; white-space: pre-wrap; }

.arc-section, .rel-section { border-top: 1px solid #2a2a4a; padding-top: 12px; margin-top: 12px; }
.arc-section h4, .rel-section h4 { margin: 0 0 10px; font-size: 14px; color: #aaa; }

.arc-timeline { display: flex; flex-direction: column; gap: 10px; }
.arc-step { display: flex; gap: 10px; }
.arc-marker {
  width: 26px; height: 26px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff; display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; flex-shrink: 0;
}
.arc-content { flex: 1; min-width: 0; }
.arc-title { font-size: 13px; font-weight: 600; color: #e0e0f0; margin-bottom: 4px; }
.arc-states { font-size: 12px; color: #b0b0d0; margin-bottom: 3px; }
.arc-states .initial { color: #888; }
.arc-states .arrow { color: #667eea; margin: 0 4px; }
.arc-states .changed { color: #27ae60; }
.arc-trigger { font-size: 11px; color: #666; }

.rel-section { margin-top: 14px; }
.rel-item { font-size: 12px; margin-bottom: 6px; display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; }
.rel-badge {
  padding: 1px 6px; border-radius: 3px; font-size: 10px; font-weight: 600; white-space: nowrap;
  background: #3a3a6a; color: #c0c0ff;
}
.rel-badge.父子, .rel-badge.师徒 { background: #b794f444; }
.rel-badge.夫妻, .rel-badge.恋人 { background: #f0659544; }
.rel-badge.宿敌, .rel-badge.仇人 { background: #ff6b6b44; }
.rel-badge.挚友, .rel-badge.同门 { background: #51cf6644; }
.rel-desc { color: #666; font-size: 11px; }
</style>
