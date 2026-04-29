<template>
  <div class="outline-panel">
    <div class="op-header">
      <span class="op-title">大纲</span>
      <span class="op-count">{{ flatNodes.length }} 个节点</span>
      <button class="op-add-btn" @click="startCreate(null)" title="添加根节点">+</button>
    </div>

    <div class="op-tree">
      <div v-if="flatNodes.length === 0" class="op-empty">暂未创建大纲节点</div>

      <div v-for="node in flatNodes" :key="node.id" :class="['op-node', { active: editingId === node.id }]">
        <div class="op-node-main" @click="selectNode(node)">
          <span class="op-node-seq">{{ node.sequence }}.</span>
          <span class="op-node-title">{{ node.title }}</span>
          <button class="op-node-add-child" @click.stop="startCreate(node.id)" title="添加子节点">+</button>
          <button class="op-node-del" @click.stop="handleDelete(node)" title="删除">×</button>
        </div>
        <div v-if="node.description" class="op-node-desc">{{ node.description }}</div>
        <div v-if="node.chapterId" class="op-node-chapter">📎 已关联章节</div>
      </div>
    </div>

    <!-- 编辑表单 -->
    <Transition name="slide-up">
      <div v-if="editingId !== null" class="op-form">
        <div class="op-form-head">
          <span class="op-form-title">{{ isCreating ? '新建节点' : '编辑节点' }}</span>
          <button class="op-form-close" @click="closeEditor">×</button>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { outlineApi, type OutlineNodeItem, type SaveOutlineNodeRequest } from '@/lib/api'
import { useNotification } from '@/composables/useNotification'

const { workId } = defineProps<{ workId: string }>()
const notify = useNotification()

const nodes = ref<OutlineNodeItem[]>([])
const editingId = ref<string | null>(null)
const isCreating = ref(false)
const parentId = ref<string | null>(null)

const form = ref<SaveOutlineNodeRequest>({ parentId: null, title: '', description: '' })

const flatNodes = computed(() => nodes.value.sort((a, b) => a.sequence - b.sequence))

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
.outline-panel { display:flex; flex-direction:column; height:100%; background:var(--editor-bg,#fff); border-left:1px solid var(--editor-border,#e5e7eb); }
.op-header { display:flex; align-items:center; gap:8px; padding:12px 16px; border-bottom:1px solid var(--editor-border,#e5e7eb); }
.op-title { font-weight:600; font-size:14px; }
.op-count { font-size:12px; color:var(--editor-muted,#6b7280); flex:1; }
.op-add-btn { width:26px;height:26px;border-radius:6px;border:1px dashed var(--editor-border,#d1d5db);background:transparent;color:var(--editor-accent,#4f46e5);font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center; }
.op-add-btn:hover { background:var(--editor-accent-bg,#eef2ff); }
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
.op-form { border-top:1px solid var(--editor-border,#e5e7eb); }
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
