<template>
  <div class="character-panel">
    <div class="cp-header">
      <span class="cp-title">角色管理</span>
      <span class="cp-count">{{ characters.length }} 个角色</span>
      <button class="cp-ai-btn" :disabled="isGenerating" @click="toggleAiPanel" title="AI 生成角色">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
          <path d="M12 2l1.5 3 3.5.5-2.5 2.5.5 3.5L12 10l-3 1.5.5-3.5L7 5.5l3.5-.5L12 2z"/>
        </svg>
        AI
      </button>
      <button class="cp-add-btn" @click="startCreate" title="新建角色">+</button>
    </div>

    <!-- AI 生成面板 -->
    <Transition name="slide-up">
      <div v-if="showAiPanel" class="cp-ai-panel">
        <div class="cp-ai-panel-head">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
            <path d="M12 2l1.5 3 3.5.5-2.5 2.5.5 3.5L12 10l-3 1.5.5-3.5L7 5.5l3.5-.5L12 2z"/>
          </svg>
          <span>AI 生成角色</span>
        </div>
        <div class="cp-ai-panel-body">
          <textarea
            v-model="aiDesc"
            class="cp-ai-textarea"
            :placeholder="aiPlaceholder"
            rows="3"
            :disabled="isGenerating"
          ></textarea>
          <div v-if="isGenerating" class="cp-ai-loading">
            <span class="cp-ai-dot"></span>
            <span class="cp-ai-dot"></span>
            <span class="cp-ai-dot"></span>
          </div>
          <div v-else class="cp-ai-actions">
            <button class="cp-ai-cancel" @click="showAiPanel = false">取消</button>
            <button class="cp-ai-gen" @click="handleAiGenerate">生成角色</button>
          </div>
        </div>
      </div>
    </Transition>

    <div class="cp-list">
      <div v-if="characters.length === 0" class="cp-empty">
        <p>暂无角色，点击 + 或 AI 创建</p>
      </div>
      <div
        v-for="c in characters"
        :key="c.id"
        :class="['cp-item', { active: editingId === c.id }]"
        @click="selectCharacter(c)"
      >
        <div class="cp-item-head">
          <span class="cp-item-name">{{ c.name }}</span>
          <span class="cp-item-identity">{{ c.identity || '未设定身份' }}</span>
          <button class="cp-item-del" @click.stop="handleDelete(c)" title="删除">&times;</button>
        </div>
        <div class="cp-item-meta">
          <span v-if="c.gender" class="cp-tag">{{ c.gender }}</span>
          <span v-if="c.ageDescription" class="cp-tag">{{ c.ageDescription }}</span>
          <span v-if="c.personality" class="cp-tag cp-tag-personality">{{ c.personality.slice(0, 20) }}</span>
        </div>
      </div>
    </div>

    <!-- 编辑/创建表单 -->
    <Transition name="slide-up">
      <div v-if="editingId !== null" class="cp-form">
        <div class="cp-form-head">
          <span class="cp-form-title">{{ isCreating ? '新建角色' : '编辑角色' }}</span>
          <button class="cp-form-close" @click="closeEditor">&times;</button>
        </div>
        <div class="cp-form-body">
          <div class="cp-field">
            <label>姓名 <span class="required">*</span></label>
            <input v-model="form.name" class="cp-input" placeholder="角色姓名" maxlength="30" />
          </div>
          <div class="cp-field">
            <label>身份</label>
            <input v-model="form.identity" class="cp-input" placeholder="如：宗门弟子、流浪剑客" maxlength="50" />
          </div>
          <div class="cp-row">
            <div class="cp-field">
              <label>性别</label>
              <select v-model="form.gender" class="cp-input">
                <option value="">未设定</option>
                <option value="男">男</option>
                <option value="女">女</option>
                <option value="未知">未知</option>
              </select>
            </div>
            <div class="cp-field">
              <label>年龄</label>
              <input v-model="form.ageDescription" class="cp-input" placeholder="如：18岁" maxlength="20" />
            </div>
          </div>
          <div class="cp-field">
            <label>性格</label>
            <textarea v-model="form.personality" class="cp-textarea" rows="2" placeholder="性格特征，用关键词描述" maxlength="200" />
          </div>
          <div class="cp-field">
            <label>背景故事</label>
            <textarea v-model="form.backgroundStory" class="cp-textarea" rows="3" placeholder="角色的背景经历" maxlength="500" />
          </div>
          <div class="cp-field">
            <label>动机/目标</label>
            <input v-model="form.motivation" class="cp-input" placeholder="角色的核心驱动力" maxlength="100" />
          </div>
        </div>
        <div class="cp-form-actions">
          <button class="cp-btn cp-btn-cancel" @click="closeEditor">取消</button>
          <button class="cp-btn cp-btn-save" :disabled="!form.name.trim()" @click="handleSave">
            {{ isCreating ? '创建' : '保存' }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { characterApi, streamChat, type CharacterItem, type SaveCharacterRequest } from '@/lib/api'
import { useNotification } from '@/composables/useNotification'

const { workId, workTitle, workGenre } = defineProps<{
  workId: string
  workTitle?: string
  workGenre?: string
}>()
const notify = useNotification()

const characters = ref<CharacterItem[]>([])
const editingId = ref<string | null>(null)
const isCreating = ref(false)

const form = ref<SaveCharacterRequest>({
  name: '', identity: '', gender: '', ageDescription: '',
  personality: '', backgroundStory: '', motivation: '',
})

// ── AI 生成 ──
const showAiPanel = ref(false)
const isGenerating = ref(false)
const aiDesc = ref('')
let aiAbort: AbortController | null = null

const aiPlaceholder = computed(() => {
  const parts = ['描述你想要的角色特征...']
  if (workTitle) parts.push(`作品：《${workTitle}》`)
  if (workGenre) parts.push(`题材：${workGenre}`)
  if (parts.length > 1) parts.push('\n留空则 AI 自动根据作品背景生成')
  return parts.join('')
})

function toggleAiPanel() {
  showAiPanel.value = !showAiPanel.value
  if (!showAiPanel.value) {
    aiAbort?.abort()
    isGenerating.value = false
  }
}

async function handleAiGenerate() {
  if (isGenerating.value) return
  isGenerating.value = true
  aiAbort = new AbortController()

  const contextParts: string[] = ['你是一位资深中文网络小说角色设计师，擅长玄幻、仙侠、都市、科幻等题材。']
  if (workTitle) contextParts.push(`作品：《${workTitle}》`)
  if (workGenre) contextParts.push(`题材：${workGenre}`)
  contextParts.push('请根据描述生成 2-3 个角色，严格返回 JSON 数组，每个元素包含：name,identity,gender,ageDescription,personality,backgroundStory,motivation。不要嵌套多余字段，不要 markdown 代码块标记。')

  const userPrompt = aiDesc.value.trim()
    ? `角色需求：${aiDesc.value.trim()}`
    : '请根据作品背景自动设计 2-3 个有深度的重要角色，每个角色需要有独特的人物弧光。'

  let result = ''

  try {
    await streamChat(
      {
        systemPrompt: contextParts.join('\n'),
        messages: [{ role: 'user', content: userPrompt }],
        temperature: 0.9,
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
      if (!item.name) continue
      const req: SaveCharacterRequest = {
        name: String(item.name).slice(0, 30),
        identity: String(item.identity || '').slice(0, 50),
        gender: ['男', '女', '未知'].includes(item.gender) ? item.gender : '',
        ageDescription: String(item.ageDescription || '').slice(0, 20),
        personality: String(item.personality || '').slice(0, 200),
        backgroundStory: String(item.backgroundStory || '').slice(0, 500),
        motivation: String(item.motivation || '').slice(0, 100),
      }
      const res = await characterApi.create(workId, req)
      if (res.succeeded ?? res.successed) created++
    }

    if (created > 0) {
      notify.success(`已创建 ${created} 个角色`)
      await loadCharacters()
    } else {
      notify.error('AI 未生成有效角色，请重新尝试')
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
async function loadCharacters() {
  try {
    const result = await characterApi.list(workId)
    if (result.succeeded ?? result.successed) {
      characters.value = result.data ?? []
    }
  } catch { /* ignored */ }
}

function selectCharacter(c: CharacterItem) {
  editingId.value = c.id
  isCreating.value = false
  form.value = {
    name: c.name, identity: c.identity, gender: c.gender,
    ageDescription: c.ageDescription, personality: c.personality,
    backgroundStory: c.backgroundStory, motivation: c.motivation,
  }
}

function startCreate() {
  editingId.value = '__new__'
  isCreating.value = true
  form.value = { name: '', identity: '', gender: '', ageDescription: '', personality: '', backgroundStory: '', motivation: '' }
}

function closeEditor() {
  editingId.value = null
  isCreating.value = false
}

async function handleSave() {
  const req = { ...form.value }
  try {
    if (isCreating.value) {
      const result = await characterApi.create(workId, req)
      if (result.succeeded ?? result.successed) {
        notify.success(`角色「${req.name}」已创建`)
        await loadCharacters()
      }
    } else if (editingId.value) {
      const result = await characterApi.update(workId, editingId.value, req)
      if (result.succeeded ?? result.successed) {
        notify.success(`角色「${req.name}」已更新`)
        await loadCharacters()
      }
    }
    closeEditor()
  } catch (e: any) {
    notify.error(e.message ?? '保存失败')
  }
}

async function handleDelete(c: CharacterItem) {
  if (!confirm(`确定删除角色「${c.name}」？`)) return
  try {
    await characterApi.delete(workId, c.id)
    notify.success(`角色「${c.name}」已删除`)
    if (editingId.value === c.id) closeEditor()
    await loadCharacters()
  } catch (e: any) {
    notify.error(e.message ?? '删除失败')
  }
}

onMounted(loadCharacters)
watch(() => workId, loadCharacters)
</script>

<style scoped>
.character-panel { display:flex; flex-direction:column; width:100%; height:100%; min-height:0; background:var(--editor-bg,#fff); }
.cp-header { display:flex; align-items:center; gap:8px; padding:12px 16px; border-bottom:1px solid var(--editor-border,#e5e7eb); }
.cp-title { font-weight:600; font-size:14px; }
.cp-count { font-size:12px; color:var(--editor-muted,#6b7280); flex:1; }
.cp-ai-btn { display:inline-flex; align-items:center; gap:4px; padding:3px 8px; border-radius:6px; border:1px solid var(--editor-accent-light,#a5b4fc); background:var(--editor-accent-bg,#eef2ff); color:var(--editor-accent,#4f46e5); font-size:12px; font-weight:600; cursor:pointer; font-family:inherit; }
.cp-ai-btn:hover { background:var(--editor-accent,#4f46e5); color:#fff; border-color:var(--editor-accent,#4f46e5); }
.cp-ai-btn:hover svg { color:#fff; }
.cp-ai-btn:disabled { opacity:.5; cursor:not-allowed; }
.cp-add-btn { width:26px; height:26px; border-radius:6px; border:1px dashed var(--editor-border,#d1d5db); background:transparent; color:var(--editor-accent,#4f46e5); font-size:18px; cursor:pointer; display:flex; align-items:center; justify-content:center; }
.cp-add-btn:hover { background:var(--editor-accent-bg,#eef2ff); }

.cp-ai-panel { border-bottom:1px solid var(--editor-border,#e5e7eb); background:linear-gradient(135deg,var(--editor-accent-bg,#eef2ff) 0%,color-mix(in srgb,var(--editor-accent,#4f46e5) 8%,var(--editor-bg,#fff)) 100%); }
.cp-ai-panel-head { display:flex; align-items:center; gap:6px; padding:10px 16px 0; font-size:13px; font-weight:600; color:var(--editor-accent,#4f46e5); }
.cp-ai-panel-body { padding:10px 16px 12px; display:flex; flex-direction:column; gap:10px; }
.cp-ai-textarea { width:100%; padding:8px 10px; border:1px solid var(--editor-border,#d1d5db); border-radius:8px; font-size:12px; resize:vertical; background:var(--editor-bg,#fff); color:var(--editor-text,#111827); outline:none; font-family:inherit; min-height:56px; }
.cp-ai-textarea:focus { border-color:var(--editor-accent,#4f46e5); }
.cp-ai-actions { display:flex; gap:8px; justify-content:flex-end; }
.cp-ai-cancel { padding:5px 14px; border-radius:6px; border:1px solid var(--editor-border,#d1d5db); background:var(--editor-bg,#fff); font-size:12px; color:var(--editor-muted,#6b7280); cursor:pointer; }
.cp-ai-cancel:hover { background:#f3f4f6; }
.cp-ai-gen { display:inline-flex; align-items:center; gap:4px; padding:5px 14px; border-radius:6px; border:none; background:var(--editor-accent,#4f46e5); color:#fff; font-size:12px; font-weight:600; cursor:pointer; }
.cp-ai-gen:hover { background:color-mix(in srgb,var(--editor-accent,#4f46e5) 85%,#000); }
.cp-ai-loading { display:flex; align-items:center; justify-content:center; gap:6px; padding:4px 0; }
.cp-ai-dot { width:6px; height:6px; border-radius:50%; background:var(--editor-accent,#4f46e5); animation:cp-dot-bounce 1.2s ease-in-out infinite; }
.cp-ai-dot:nth-child(2) { animation-delay:.2s; }
.cp-ai-dot:nth-child(3) { animation-delay:.4s; }
@keyframes cp-dot-bounce { 0%,80%,100%{opacity:.3;transform:scale(.8)} 40%{opacity:1;transform:scale(1)} }

.cp-list { flex:1; overflow-y:auto; padding:8px; }
.cp-empty { text-align:center; padding:40px 16px; color:var(--editor-muted,#9ca3af); font-size:13px; }
.cp-item { padding:8px 12px; border-radius:8px; cursor:pointer; margin-bottom:4px; border:1px solid transparent; }
.cp-item:hover { background:var(--editor-accent-bg,#f9fafb); }
.cp-item.active { background:var(--editor-accent-bg,#eef2ff); border-color:var(--editor-accent-border,#c7d2fe); }
.cp-item-head { display:flex; align-items:center; gap:6px; }
.cp-item-name { font-weight:600; font-size:13px; }
.cp-item-identity { font-size:12px; color:var(--editor-muted,#6b7280); flex:1; }
.cp-item-del { width:20px;height:20px;border:none;background:transparent;color:var(--editor-muted,#9ca3af);cursor:pointer;font-size:16px;border-radius:4px;opacity:0; }
.cp-item:hover .cp-item-del { opacity:1; }
.cp-item-del:hover { background:#fee2e2;color:#ef4444; }
.cp-item-meta { display:flex; gap:4px; margin-top:4px; flex-wrap:wrap; }
.cp-tag { font-size:11px; padding:1px 6px; border-radius:4px; background:#f3f4f6; color:var(--editor-muted,#6b7280); }
.cp-tag-personality { background:#fef3c7; color:#92400e; }
.cp-form { border-top:1px solid var(--editor-border,#e5e7eb); max-height:50%; overflow-y:auto; }
.cp-form-head { display:flex; align-items:center; padding:10px 16px; border-bottom:1px solid var(--editor-border,#e5e7eb); }
.cp-form-title { font-weight:600; font-size:13px; flex:1; }
.cp-form-close { border:none; background:transparent; font-size:18px; cursor:pointer; color:var(--editor-muted,#6b7280); }
.cp-form-body { padding:12px 16px; display:flex; flex-direction:column; gap:10px; }
.cp-field { display:flex; flex-direction:column; gap:4px; }
.cp-field label { font-size:12px; color:var(--editor-muted,#6b7280); font-weight:500; }
.cp-field .required { color:#ef4444; }
.cp-row { display:flex; gap:10px; }
.cp-row .cp-field { flex:1; }
.cp-input { padding:6px 10px; border:1px solid var(--editor-border,#d1d5db); border-radius:6px; font-size:13px; background:var(--editor-bg,#fff); color:var(--editor-text,#111827); outline:none; }
.cp-input:focus { border-color:var(--editor-accent,#4f46e5); }
.cp-textarea { padding:6px 10px; border:1px solid var(--editor-border,#d1d5db); border-radius:6px; font-size:13px; resize:vertical; background:var(--editor-bg,#fff); color:var(--editor-text,#111827); outline:none; font-family:inherit; }
.cp-textarea:focus { border-color:var(--editor-accent,#4f46e5); }
select.cp-input { cursor:pointer; }
.cp-form-actions { display:flex; gap:8px; padding:10px 16px; border-top:1px solid var(--editor-border,#e5e7eb); }
.cp-btn { padding:6px 16px; border-radius:6px; font-size:13px; cursor:pointer; border:none; }
.cp-btn-cancel { background:#f3f4f6; color:var(--editor-text,#374151); }
.cp-btn-save { background:var(--editor-accent,#4f46e5); color:#fff; }
.cp-btn-save:disabled { opacity:.5; cursor:not-allowed; }
.slide-up-enter-active,.slide-up-leave-active { transition:max-height .25s ease,opacity .25s ease; overflow:hidden; }
.slide-up-enter-from,.slide-up-leave-to { max-height:0; opacity:0; }
.slide-up-enter-to,.slide-up-leave-from { max-height:500px; opacity:1; }
</style>
