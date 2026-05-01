<template>
  <div class="outline-panel">
    <div class="op-header">
      <span class="op-title">大纲</span>
      <span class="op-count">{{ flatNodes.length }} 个节点</span>
      <button class="op-ai-btn" :disabled="isGenerating" @click="toggleAiPanel('generate')" title="AI 生成大纲">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
          <path d="M12 2l1.5 3 3.5.5-2.5 2.5.5 3.5L12 10l-3 1.5.5-3.5L7 5.5l3.5-.5L12 2z"/>
        </svg>
        AI
      </button>
      <button v-if="chapterTitle" class="op-ai-continue-btn" :disabled="isGenerating" @click="toggleAiPanel('continue')" title="AI 续写大纲">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
        续写
      </button>
      <button class="op-add-btn" @click="startCreate(null)" title="添加根节点">+</button>
    </div>

    <!-- AI 生成/续写面板 -->
    <Transition name="slide-up">
      <div v-if="showAiPanel" class="op-ai-panel">
        <div class="op-ai-panel-head">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
            <path d="M12 2l1.5 3 3.5.5-2.5 2.5.5 3.5L12 10l-3 1.5.5-3.5L7 5.5l3.5-.5L12 2z"/>
          </svg>
          <span>{{ aiMode === 'continue' ? 'AI 续写大纲' : 'AI 生成大纲' }}</span>
        </div>
        <div class="op-ai-panel-body">
          <div v-if="aiMode === 'continue' && flatNodes.length > 0" class="op-ai-exist-hint">
            已有 {{ flatNodes.length }} 个大纲节点，续写将补充新的节点
          </div>
          <div v-if="aiMode === 'continue' && chapterTitle" class="op-ai-chapter-hint">
            基于章节「{{ chapterTitle }}」的内容推断后续大纲
          </div>
          <textarea
            v-model="aiDesc"
            class="op-ai-textarea"
            :placeholder="aiPlaceholder"
            rows="2"
            :disabled="isGenerating"
          ></textarea>
          <div v-if="isGenerating" class="op-ai-loading">
            <span class="op-ai-dot"></span>
            <span class="op-ai-dot"></span>
            <span class="op-ai-dot"></span>
          </div>
          <div v-else class="op-ai-actions">
            <button class="op-ai-cancel" @click="showAiPanel = false">取消</button>
            <button class="op-ai-gen" @click="handleAiGenerate">{{ aiMode === 'continue' ? '续写大纲' : '生成大纲' }}</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 编辑表单 -->
    <Transition name="slide-up">
      <div v-if="editingId !== null" class="op-form">
        <div class="op-form-head">
          <span class="op-form-title">{{ isCreating ? '新建节点' : '编辑节点' }}</span>
          <button class="op-form-close" @click="closeEditor">&times;</button>
        </div>
        <div class="op-form-body">
          <div class="op-field">
            <label>标题 <span class="required">*</span></label>
            <input v-model="form.title" class="op-input" placeholder="如：第三章高潮" maxlength="50" />
          </div>
          <div class="op-field">
            <label>描述</label>
            <textarea v-model="form.description" class="op-textarea" rows="2" placeholder="本章的情节要点" maxlength="200" />
          </div>
        </div>
        <div class="op-form-actions">
          <button class="op-btn op-btn-cancel" @click="closeEditor">取消</button>
          <button class="op-btn op-btn-save" :disabled="!form.title.trim()" @click="handleSave">
            {{ isCreating ? '创建' : '保存' }}
          </button>
        </div>
      </div>
    </Transition>

    <div class="op-tree">
      <div v-if="flatNodes.length === 0" class="op-empty">暂未创建大纲节点</div>

      <div v-for="node in flatNodes" :key="node.id" :class="['op-node', { active: editingId === node.id }]">
        <div class="op-node-main" @click="selectNode(node)">
          <span class="op-node-seq">{{ node.sequence }}.</span>
          <span class="op-node-title">{{ node.title }}</span>
          <button class="op-node-add-child" @click.stop="startCreate(node.id)" title="添加子节点">+</button>
          <button class="op-node-del" @click.stop="handleDelete(node)" title="删除">&times;</button>
        </div>
        <div v-if="node.description" class="op-node-desc">{{ node.description }}</div>
        <div v-if="node.chapterId" class="op-node-chapter">&#x1F4CE; 已关联章节</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { outlineApi, streamChat, type OutlineNodeItem, type SaveOutlineNodeRequest } from '@/lib/api'
import { useNotification } from '@/composables/useNotification'

const { workId, workTitle, workGenre, chapterTitle, chapterContent } = defineProps<{
  workId: string
  workTitle?: string
  workGenre?: string
  chapterTitle?: string
  chapterContent?: string
}>()
const notify = useNotification()

const nodes = ref<OutlineNodeItem[]>([])
const editingId = ref<string | null>(null)
const isCreating = ref(false)
const parentId = ref<string | null>(null)

const form = ref<SaveOutlineNodeRequest>({ parentId: null, title: '', description: '' })

const flatNodes = computed(() => nodes.value.sort((a, b) => a.sequence - b.sequence))

// ── AI 生成/续写 ──
const showAiPanel = ref(false)
const isGenerating = ref(false)
const aiDesc = ref('')
const aiMode = ref<'generate' | 'continue'>('generate')
let aiAbort: AbortController | null = null

const aiPlaceholder = computed(() => {
  if (aiMode.value === 'continue') {
    return `描述你希望续写的方向，留空则 AI 自动推断`
  }
  const parts = ['描述大纲结构...']
  if (workTitle) parts.push(`作品：《${workTitle}》`)
  if (workGenre) parts.push(`题材：${workGenre}`)
  if (parts.length > 1) parts.push('\n留空则 AI 自动设计')
  return parts.join('')
})

function toggleAiPanel(mode: 'generate' | 'continue') {
  if (showAiPanel.value && aiMode.value === mode) {
    showAiPanel.value = false
    return
  }
  aiMode.value = mode
  showAiPanel.value = true
  aiDesc.value = ''
  aiAbort?.abort()
  isGenerating.value = false
}

async function handleAiGenerate() {
  if (isGenerating.value) return
  isGenerating.value = true
  aiAbort = new AbortController()

  const systemParts: string[] = ['你是一位资深中文网络小说大纲设计师。请生成大纲节点，严格返回 JSON 数组。']
  systemParts.push('每个元素包含：title(必填，15字内), description(50字内). 不要 markdown 代码块标记。')

  let userPrompt = ''
  if (aiMode.value === 'continue') {
    userPrompt = '请续写后续大纲节点（5-8个），基于当前章节内容推断合理的后续情节发展。'
    if (chapterContent) {
      const plain = chapterContent.replace(/<[^>]+>/g, '').slice(0, 1000)
      userPrompt += `\n\n当前章节内容：\n${plain}`
    }
  } else {
    userPrompt = aiDesc.value.trim()
      ? `大纲需求：${aiDesc.value.trim()}`
      : '请为作品设计 8-12 个大纲节点，覆盖完整故事弧线。'
  }

  if (workTitle) userPrompt = `作品：《${workTitle}》${workGenre ? `，题材：${workGenre}` : ''}\n\n${userPrompt}`

  let result = ''

  try {
    await streamChat(
      {
        systemPrompt: systemParts.join('\n'),
        messages: [{ role: 'user', content: userPrompt }],
        temperature: 0.85,
        skillName: 'writer',
      },
      {
        onChunk(chunk) { result += chunk },
        onDone() { parseAndCreate(result) },
        onError(_code, msg) {
          notify.error(msg || 'AI 生成失败，请检查模型配置')
          isGenerating.value = false
        },
      },
      aiAbort.signal,
    )
  } catch {
    isGenerating.value = false
  }
}

async function parseAndCreate(raw: string) {
  try {
    const json = extractJson(raw)
    const items = Array.isArray(json) ? json : [json]
    if (!items.length) throw new Error('empty')

    let created = 0
    for (const item of items) {
      if (!item.title) continue
      const req: SaveOutlineNodeRequest = {
        title: String(item.title).slice(0, 50),
        description: String(item.description || '').slice(0, 200),
      }
      const res = await outlineApi.createNode(workId, req)
      if (res.succeeded ?? res.successed) created++
    }

    if (created > 0) {
      notify.success(`已创建 ${created} 个大纲节点`)
      await loadOutline()
    } else {
      notify.error('AI 未生成有效节点，请重新尝试')
    }
  } catch {
    notify.error('AI 返回格式异常，请重新尝试')
  } finally {
    isGenerating.value = false
    showAiPanel.value = false
    aiDesc.value = ''
  }
}

function extractJson(text: string): unknown {
  const trimmed = text.trim()
  const arrayMatch = trimmed.match(/\[[\s\S]*\]/)
  if (arrayMatch) return JSON.parse(arrayMatch[0])
  const objMatch = trimmed.match(/\{[\s\S]*\}/)
  if (objMatch) return JSON.parse(objMatch[0])
  return JSON.parse(trimmed)
}

// ── CRUD ──
async function loadOutline() {
  try {
    const result = await outlineApi.getTree(workId)
    if (result.succeeded ?? result.successed) {
      nodes.value = result.data ?? []
    }
  } catch { /* ignored */ }
}

function selectNode(node: OutlineNodeItem) {
  editingId.value = node.id
  isCreating.value = false
  form.value = { parentId: node.parentId, title: node.title, description: node.description }
}

function startCreate(parent: string | null) {
  editingId.value = '__new__'
  isCreating.value = true
  parentId.value = parent
  form.value = { parentId: parent, title: '', description: '' }
}

function closeEditor() {
  editingId.value = null
  isCreating.value = false
}

async function handleSave() {
  try {
    if (isCreating.value) {
      const result = await outlineApi.createNode(workId, { ...form.value })
      if (result.succeeded ?? result.successed) {
        notify.success(`大纲节点「${form.value.title}」已创建`)
        await loadOutline()
      }
    } else if (editingId.value) {
      const result = await outlineApi.updateNode(workId, editingId.value, { ...form.value })
      if (result.succeeded ?? result.successed) {
        notify.success(`大纲节点「${form.value.title}」已更新`)
        await loadOutline()
      }
    }
    closeEditor()
  } catch (e: any) {
    notify.error(e.message ?? '保存失败')
  }
}

async function handleDelete(node: OutlineNodeItem) {
  if (!confirm(`确定删除「${node.title}」？`)) return
  try {
    await outlineApi.deleteNode(workId, node.id)
    notify.success(`大纲节点「${node.title}」已删除`)
    if (editingId.value === node.id) closeEditor()
    await loadOutline()
  } catch (e: any) {
    notify.error(e.message ?? '删除失败')
  }
}

onMounted(loadOutline)
watch(() => workId, loadOutline)
</script>

<style scoped>
.outline-panel { display:flex; flex-direction:column; width:100%; height:100%; min-height:0; background:var(--editor-bg,#fff); }
.op-header { display:flex; align-items:center; gap:8px; padding:12px 16px; border-bottom:1px solid var(--editor-border,#e5e7eb); }
.op-title { font-weight:600; font-size:14px; }
.op-count { font-size:12px; color:var(--editor-muted,#6b7280); flex:1; }
.op-ai-btn { display:inline-flex; align-items:center; gap:4px; padding:3px 8px; border-radius:6px; border:1px solid var(--editor-accent-light,#a5b4fc); background:var(--editor-accent-bg,#eef2ff); color:var(--editor-accent,#4f46e5); font-size:12px; font-weight:600; cursor:pointer; font-family:inherit; }
.op-ai-btn:hover { background:var(--editor-accent,#4f46e5); color:#fff; border-color:var(--editor-accent,#4f46e5); }
.op-ai-btn:hover svg { color:#fff; }
.op-ai-btn:disabled { opacity:.5; cursor:not-allowed; }
.op-ai-continue-btn { display:inline-flex; align-items:center; gap:3px; padding:3px 7px; border-radius:6px; border:1px solid #fbbf24; background:#fef3c7; color:#92400e; font-size:12px; font-weight:600; cursor:pointer; font-family:inherit; }
.op-ai-continue-btn:hover { background:#fbbf24; color:#78350f; border-color:#f59e0b; }
.op-ai-continue-btn:disabled { opacity:.5; cursor:not-allowed; }
.op-add-btn { width:26px;height:26px;border-radius:6px;border:1px dashed var(--editor-border,#d1d5db);background:transparent;color:var(--editor-accent,#4f46e5);font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center; }
.op-add-btn:hover { background:var(--editor-accent-bg,#eef2ff); }

.op-ai-panel { border-bottom:1px solid var(--editor-border,#e5e7eb); background:linear-gradient(135deg,var(--editor-accent-bg,#eef2ff) 0%,color-mix(in srgb,var(--editor-accent,#4f46e5) 8%,var(--editor-bg,#fff)) 100%); }
.op-ai-panel-head { display:flex; align-items:center; gap:6px; padding:10px 16px 0; font-size:13px; font-weight:600; color:var(--editor-accent,#4f46e5); }
.op-ai-panel-body { padding:10px 16px 12px; display:flex; flex-direction:column; gap:8px; }
.op-ai-exist-hint { font-size:11px; color:var(--editor-muted,#6b7280); }
.op-ai-chapter-hint { font-size:11px; color:var(--editor-accent,#4f46e5); }
.op-ai-textarea { width:100%; padding:8px 10px; border:1px solid var(--editor-border,#d1d5db); border-radius:8px; font-size:12px; resize:vertical; background:var(--editor-bg,#fff); color:var(--editor-text,#111827); outline:none; font-family:inherit; min-height:48px; }
.op-ai-textarea:focus { border-color:var(--editor-accent,#4f46e5); }
.op-ai-actions { display:flex; gap:8px; justify-content:flex-end; }
.op-ai-cancel { padding:5px 14px; border-radius:6px; border:1px solid var(--editor-border,#d1d5db); background:var(--editor-bg,#fff); font-size:12px; color:var(--editor-muted,#6b7280); cursor:pointer; }
.op-ai-cancel:hover { background:#f3f4f6; }
.op-ai-gen { display:inline-flex; align-items:center; gap:4px; padding:5px 14px; border-radius:6px; border:none; background:var(--editor-accent,#4f46e5); color:#fff; font-size:12px; font-weight:600; cursor:pointer; }
.op-ai-gen:hover { background:color-mix(in srgb,var(--editor-accent,#4f46e5) 85%,#000); }
.op-ai-loading { display:flex; align-items:center; justify-content:center; gap:6px; padding:4px 0; }
.op-ai-dot { width:6px; height:6px; border-radius:50%; background:var(--editor-accent,#4f46e5); animation:op-dot-bounce 1.2s ease-in-out infinite; }
.op-ai-dot:nth-child(2) { animation-delay:.2s; }
.op-ai-dot:nth-child(3) { animation-delay:.4s; }
@keyframes op-dot-bounce { 0%,80%,100%{opacity:.3;transform:scale(.8)} 40%{opacity:1;transform:scale(1)} }

.op-tree { flex:1; overflow-y:auto; padding:8px; }
.op-empty { text-align:center; padding:40px 16px; color:var(--editor-muted,#9ca3af); font-size:13px; }
.op-node { padding:6px 12px; border-radius:6px; cursor:pointer; margin-bottom:2px; border:1px solid transparent; }
.op-node:hover { background:var(--editor-accent-bg,#f9fafb); }
.op-node.active { background:var(--editor-accent-bg,#eef2ff); border-color:var(--editor-accent-border,#c7d2fe); }
.op-node-main { display:flex; align-items:center; gap:6px; }
.op-node-seq { font-size:12px; color:var(--editor-accent,#6366f1); min-width:24px; }
.op-node-title { font-size:13px; font-weight:500; flex:1; }
.op-node-add-child,.op-node-del { width:20px;height:20px;border:none;background:transparent;cursor:pointer;font-size:14px;border-radius:4px;opacity:0; }
.op-node:hover .op-node-add-child,.op-node:hover .op-node-del { opacity:1; }
.op-node-add-child { color:var(--editor-accent,#4f46e5); }
.op-node-add-child:hover { background:var(--editor-accent-bg,#eef2ff); }
.op-node-del { color:var(--editor-muted,#9ca3af); font-size:16px; }
.op-node-del:hover { background:#fee2e2; color:#ef4444; }
.op-node-desc { font-size:12px; color:var(--editor-muted,#6b7280); margin-left:30px; }
.op-node-chapter { font-size:11px; color:var(--editor-accent,#4f46e5); margin-left:30px; }
.op-form { border-top:1px solid var(--editor-border,#e5e7eb); border-bottom:1px solid var(--editor-border,#e5e7eb); background:var(--editor-accent-bg,#f9fafb); }
.op-form-head { display:flex; align-items:center; padding:10px 16px; border-bottom:1px solid var(--editor-border,#e5e7eb); }
.op-form-title { font-weight:600; font-size:13px; flex:1; }
.op-form-close { border:none;background:transparent;font-size:18px;cursor:pointer;color:var(--editor-muted,#6b7280); }
.op-form-body { padding:12px 16px; display:flex; flex-direction:column; gap:10px; }
.op-field { display:flex; flex-direction:column; gap:4px; }
.op-field label { font-size:12px; color:var(--editor-muted,#6b7280); font-weight:500; }
.op-field .required { color:#ef4444; }
.op-input { padding:6px 10px; border:1px solid var(--editor-border,#d1d5db); border-radius:6px; font-size:13px; background:var(--editor-bg,#fff); color:var(--editor-text,#111827); outline:none; }
.op-input:focus { border-color:var(--editor-accent,#4f46e5); }
.op-textarea { padding:6px 10px; border:1px solid var(--editor-border,#d1d5db); border-radius:6px; font-size:13px; resize:vertical; background:var(--editor-bg,#fff); color:var(--editor-text,#111827); outline:none; font-family:inherit; }
.op-textarea:focus { border-color:var(--editor-accent,#4f46e5); }
.op-form-actions { display:flex; gap:8px; padding:10px 16px; border-top:1px solid var(--editor-border,#e5e7eb); }
.op-btn { padding:6px 16px; border-radius:6px; font-size:13px; cursor:pointer; border:none; }
.op-btn-cancel { background:#f3f4f6; color:var(--editor-text,#374151); }
.op-btn-save { background:var(--editor-accent,#4f46e5); color:#fff; }
.op-btn-save:disabled { opacity:.5; cursor:not-allowed; }
.slide-up-enter-active,.slide-up-leave-active { transition:max-height .25s ease,opacity .25s ease; overflow:hidden; }
.slide-up-enter-from,.slide-up-leave-to { max-height:0; opacity:0; }
.slide-up-enter-to,.slide-up-leave-from { max-height:400px; opacity:1; }
</style>
