<template>
  <Teleport to="body">
    <Transition name="confirm">
      <div v-if="visible" class="wizard-overlay" @click.self="handleClose">
        <Transition name="confirm-panel">
          <div v-if="visible" class="wizard-panel">
            <!-- 顶部标题 -->
            <div class="wizard-header">
              <div class="wh-left">
                <svg class="wh-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M12 2l2.4 4.87L20 8.18l-4 3.9.94 5.49L12 15l-4.94 2.57.94-5.49-4-3.9 5.6-.81L12 2z"/>
                  <path d="M5 3l.5 1.5L7 5l-1.5.5L5 7l-.5-1.5L3 5l1.5-.5L5 3z" stroke-width="1.2"/>
                  <path d="M19 14l.4 1.2 1.2.4-1.2.4-.4 1.2-.4-1.2-1.2-.4 1.2-.4L19 14z" stroke-width="1.2"/>
                </svg>
                <div>
                  <h2 class="wh-title">AI 辅助创建作品</h2>
                  <p class="wh-sub">让 AI 帮你从零开始构建完整的故事世界</p>
                </div>
              </div>
              <button class="wizard-close" @click="handleClose">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <!-- 步骤指示器 -->
            <div class="wizard-steps">
              <template v-for="(step, i) in STEPS" :key="i">
                <div class="step-node">
                  <div :class="['step-circle', i < currentStep ? 'done' : i === currentStep ? 'active' : 'pending']">
                    <svg v-if="i < currentStep" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span v-else>{{ i + 1 }}</span>
                  </div>
                </div>
                <div v-if="i < STEPS.length - 1" :class="['step-line', { done: i < currentStep }]" />
              </template>
            </div>

            <!-- 主体内容（滚动区域） -->
            <div class="wizard-body">

              <!-- ── STEP 1: 基础信息 ── -->
              <div v-show="currentStep === 0" class="step-content">
                <div class="form-group">
                  <label class="form-label">作品名称 <span class="required">*</span></label>
                  <input v-model="form.title" type="text" class="form-input" placeholder="输入你的作品名称" maxlength="50" />
                  <span class="form-hint right">{{ form.title.length }} / 50</span>
                </div>
                <div class="form-group">
                  <label class="form-label">叙述视角</label>
                  <div class="status-row">
                    <button
                      v-for="p in PERSPECTIVE_OPTIONS"
                      :key="p.value"
                      :class="['pill-btn', { active: form.perspective === p.value }]"
                      @click="form.perspective = p.value"
                    >{{ p.label }}</button>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">题材分类 <span class="required">*</span> <span class="multi-hint">（可多选）</span></label>
                  <div class="pill-grid">
                    <button
                      v-for="g in GENRES"
                      :key="g"
                      :class="['pill-btn', { active: form.genres.includes(g) }]"
                      @click="toggleGenre(g)"
                    >{{ g }}</button>
                    <button
                      v-for="g in customGenreList"
                      :key="'c-' + g"
                      class="pill-btn active pill-custom"
                      @click="removeGenre(g)"
                    >{{ g }}<span class="pill-remove">×</span></button>
                  </div>
                  <div class="genre-custom-row">
                    <input
                      v-model="customGenreInput"
                      class="genre-custom-input"
                      placeholder="输入自定义题材..."
                      maxlength="10"
                      @keydown.enter.prevent="addCustomGenre"
                    />
                    <button class="genre-add-btn" :disabled="!customGenreInput.trim()" @click="addCustomGenre">＋ 添加</button>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">一句话简介</label>
                  <textarea v-model="form.tagline" class="form-textarea" rows="3" placeholder="用一句话吸引读者，例如：废柴少年逆天改命" maxlength="360"></textarea>
                </div>
                <div class="form-group">
                  <label class="form-label">初始状态</label>
                  <div class="status-row">
                    <button
                      v-for="s in STATUS_OPTIONS"
                      :key="s.value"
                      :class="['status-btn', { active: form.status === s.value }]"
                      @click="form.status = s.value"
                    >
                      <span :class="['sdot', `sdot-${s.value}`]"></span>{{ s.label }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- ── STEP 2: 创作风格 ── -->
              <div v-show="currentStep === 1" class="step-content">
                <div class="section-block">
                  <h4 class="section-title">叙事风格 <span class="multi-hint">（可多选）</span></h4>
                  <div class="style-grid">
                    <div
                      v-for="s in NARRATIVE_STYLES"
                      :key="s.id"
                      :class="['style-card', { selected: form.narrativeStyles.includes(s.id) }]"
                      @click="toggleStyle('narrativeStyles', s.id)"
                    >
                      <div :class="['style-check', { checked: form.narrativeStyles.includes(s.id) }]">
                        <svg v-if="form.narrativeStyles.includes(s.id)" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </div>
                      <div>
                        <p class="style-name">{{ s.name }}</p>
                        <p class="style-desc">{{ s.desc }}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="section-block">
                  <h4 class="section-title">情感基调 <span class="multi-hint">（可多选）</span></h4>
                  <div class="style-grid">
                    <div
                      v-for="s in EMOTIONAL_TONES"
                      :key="s.id"
                      :class="['style-card', { selected: form.emotionalTones.includes(s.id) }]"
                      @click="toggleStyle('emotionalTones', s.id)"
                    >
                      <div :class="['style-check', { checked: form.emotionalTones.includes(s.id) }]">
                        <svg v-if="form.emotionalTones.includes(s.id)" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </div>
                      <div>
                        <p class="style-name">{{ s.name }}</p>
                        <p class="style-desc">{{ s.desc }}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="section-block">
                  <h4 class="section-title">节奏偏好 <span class="multi-hint">（可多选）</span></h4>
                  <div class="style-grid">
                    <div
                      v-for="s in PACING_PREFERENCES"
                      :key="s.id"
                      :class="['style-card', { selected: form.pacingPreferences.includes(s.id) }]"
                      @click="toggleStyle('pacingPreferences', s.id)"
                    >
                      <div :class="['style-check', { checked: form.pacingPreferences.includes(s.id) }]">
                        <svg v-if="form.pacingPreferences.includes(s.id)" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </div>
                      <div>
                        <p class="style-name">{{ s.name }}</p>
                        <p class="style-desc">{{ s.desc }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <!-- 底部操作栏 -->
            <div class="wizard-footer">
              <button v-if="currentStep > 0" class="wf-prev" @click="prevStep">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="14" height="14"><polyline points="15 18 9 12 15 6"/></svg>
                上一步
              </button>
              <div class="wf-spacer"></div>
              <button
                v-if="currentStep < STEPS.length - 1"
                :class="['wf-next', { disabled: !canProceed }]"
                :disabled="!canProceed"
                @click="nextStep"
              >
                下一步
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="14" height="14"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
              <button
                v-else
                class="wf-next wf-finish"
                @click="finishCreate"
              >
                完成创建
              </button>
            </div>

          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useNotification } from '@/composables/useNotification'
import type { WorkItem } from '@/lib/api'
import '../styles/CreateWorkWizard.css'

// ==================== Props / Emits ====================
const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{
  close: []
  created: [data: Partial<WorkItem>]
}>()

const notify = useNotification()

// ==================== 常量 ====================
const STEPS = ['基础信息', '创作风格']

const GENRES = ['科幻', '玄幻', '仙侠', '古风', '悬疑', '末世', '都市', '历史', '军事', '游戏', '无限流']

const STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'writing', label: '连载中' },
  { value: 'hiatus', label: '暂停' },
]

const PERSPECTIVE_OPTIONS = [
  { value: 'first', label: '第一人称' },
  { value: 'third', label: '第三人称' },
]

const NARRATIVE_STYLES = [
  { id: '热血爽文', name: '热血爽文', desc: '升级打怪，一路碾压' },
  { id: '轻松搞笑', name: '轻松搞笑', desc: '幽默诙谐，轻松愉快' },
  { id: '暗黑压抑', name: '暗黑压抑', desc: '残酷现实，深度思考' },
  { id: '温馨治愈', name: '温馨治愈', desc: '温暖人心，正能量' },
  { id: '悬疑推理', name: '悬疑推理', desc: '烧脑悬疑，层层反转' },
  { id: '权谋斗争', name: '权谋斗争', desc: '智谋博弈，步步为营' },
  { id: '浪漫唯美', name: '浪漫唯美', desc: '细腻情感，唯美画风' },
  { id: '成长蜕变', name: '成长蜕变', desc: '逆袭人生，自我超越' },
]

const EMOTIONAL_TONES = [
  { id: '甜宠无虐', name: '甜宠无虐', desc: '全程高甜，没有误会' },
  { id: '虐恋情深', name: '虐恋情深', desc: '爱恨交织，虐心催泪' },
  { id: '欢喜冤家', name: '欢喜冤家', desc: '斗嘴互怼，日久生情' },
  { id: '励志成长', name: '励志成长', desc: '送逆崛起，自我实现' },
  { id: '热血激昂', name: '热血激昂', desc: '燃情岁月，热血沸腾' },
  { id: '温馨日常', name: '温馨日常', desc: '生活气息，治愈心灵' },
]

const PACING_PREFERENCES = [
  { id: '快节奏打脸', name: '快节奏打脸', desc: '不拖泥带水，爽点密集' },
  { id: '慢热铺垫', name: '慢热铺垫', desc: '循序渐进，伏笔深远' },
  { id: '跌宕起伏', name: '跌宕起伏', desc: '高潮迭起，扣人心弦' },
  { id: '日常温馨', name: '日常温馨', desc: '平淡生活，细水长流' },
]

// ==================== 状态 ====================
const currentStep = ref(0)

const form = reactive({
  title: '',
  genres: [] as string[],
  tagline: '',
  status: 'draft',
  narrativeStyles: [] as string[],
  emotionalTones: [] as string[],
  pacingPreferences: [] as string[],
  perspective: 'third' as string,
})

// ==================== 计算属性 ====================
const canProceed = computed(() => {
  if (currentStep.value === 0) return form.title.trim() !== '' && form.genres.length > 0
  return true
})

// ==================== 监听 visible 重置 ====================
watch(() => props.visible, (val) => {
  if (val) {
    currentStep.value = 0
    Object.assign(form, {
      title: '', genres: [], tagline: '', status: 'draft', perspective: 'third',
      narrativeStyles: [], emotionalTones: [], pacingPreferences: [],
    })
    customGenreInput.value = ''
  }
})

// ==================== 方法 ====================
function handleClose() {
  emit('close')
}

// 题材自定义
const customGenreInput = ref('')
const customGenreList = computed(() => form.genres.filter(g => !GENRES.includes(g)))

function toggleGenre(g: string) {
  const idx = form.genres.indexOf(g)
  if (idx === -1) form.genres.push(g)
  else form.genres.splice(idx, 1)
}

function addCustomGenre() {
  const g = customGenreInput.value.trim()
  if (!g) return
  if (!form.genres.includes(g)) form.genres.push(g)
  customGenreInput.value = ''
}

function removeGenre(g: string) {
  const idx = form.genres.indexOf(g)
  if (idx !== -1) form.genres.splice(idx, 1)
}

function toggleStyle(field: 'narrativeStyles' | 'emotionalTones' | 'pacingPreferences', id: string) {
  const arr = form[field] as string[]
  const idx = arr.indexOf(id)
  if (idx === -1) arr.push(id)
  else arr.splice(idx, 1)
}

function getStyleName(id: string): string {
  return [...NARRATIVE_STYLES, ...EMOTIONAL_TONES, ...PACING_PREFERENCES].find(s => s.id === id)?.name ?? id
}

function prevStep() {
  if (currentStep.value > 0) currentStep.value--
}

async function nextStep() {
  if (!canProceed.value) return
  currentStep.value++
}

function finishCreate() {
  const styleTags = [
    ...form.narrativeStyles,
    ...form.emotionalTones,
    ...form.pacingPreferences,
  ]
  const work: Partial<WorkItem> = {
    title: form.title,
    genre: form.genres.join('、'),
    styleTags,
    description: form.tagline,
    status: form.status,
    perspective: form.perspective,
  }
  emit('created', work)
  notify.success(`作品「${form.title}」创建成功`)
}
</script>
