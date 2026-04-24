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
                  <label class="form-label">题材分类 <span class="required">*</span></label>
                  <div class="pill-grid">
                    <button
                      v-for="g in GENRES"
                      :key="g"
                      :class="['pill-btn', { active: form.genre === g }]"
                      @click="form.genre = g"
                    >{{ g }}</button>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">一句话简介</label>
                  <input v-model="form.tagline" type="text" class="form-input" placeholder="用一句话吸引读者，例如：废柴少年逆天改命" maxlength="80" />
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
              </div>

              <!-- ── STEP 3: 核心设定 ── -->
              <div v-show="currentStep === 2" class="step-content">
                <div class="form-group">
                  <label class="form-label">核心卖点关键词 <span class="form-hint-inline">（最多 3 个，用逗号分隔）</span></label>
                  <input v-model="form.coreKeywords" type="text" class="form-input" placeholder="例如：废柴逆袭、退婚流、系统流" />
                  <span class="form-hint">这些关键词将帮助 AI 更准确地生成内容</span>
                </div>
                <div class="form-group">
                  <label class="form-label">主角人设关键词</label>
                  <textarea v-model="form.protagonistKeywords" class="form-textarea" rows="3" placeholder="描述一下你心目中的主角：性格、身份、目标等"></textarea>
                </div>
                <div class="form-group">
                  <label class="form-label">世界背景补充</label>
                  <textarea v-model="form.worldSetting" class="form-textarea" rows="2" placeholder="例如：修真世界、星际联邦、现代都市暗流等"></textarea>
                </div>

                <!-- 已选风格摘要 -->
                <div v-if="form.narrativeStyles.length || form.emotionalTones.length" class="summary-block">
                  <div class="summary-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 2l2.4 4.87L20 8.18l-4 3.9.94 5.49L12 15l-4.94 2.57.94-5.49-4-3.9 5.6-.81L12 2z"/>
                    </svg>
                  </div>
                  <div class="summary-body">
                    <p class="summary-label">已选择的风格</p>
                    <div class="summary-tags">
                      <span v-for="id in [...form.narrativeStyles, ...form.emotionalTones]" :key="id" class="summary-tag">
                        {{ getStyleName(id) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ── STEP 4: AI 生成 ── -->
              <div v-show="currentStep === 3" class="step-content">
                <!-- 生成中 loading -->
                <div v-if="generating" class="gen-loading">
                  <div class="gen-spinner"></div>
                  <p class="gen-loading-text">AI 正在构建你的故事世界…</p>
                  <p class="gen-loading-sub">正在分析题材、风格与关键词组合</p>
                </div>

                <!-- 生成结果 -->
                <div v-else class="gen-result">
                  <div class="gen-tip">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                      <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
                    </svg>
                    AI 生成内容仅供参考，可在此基础上自由修改
                  </div>
                  <div class="form-group">
                    <label class="form-label">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      作品概要
                    </label>
                    <textarea v-model="generated.synopsis" class="form-textarea" rows="5"></textarea>
                  </div>
                  <div class="form-group">
                    <label class="form-label">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      主角设定
                    </label>
                    <textarea v-model="generated.character" class="form-textarea" rows="3"></textarea>
                  </div>
                  <div class="form-group">
                    <label class="form-label">推荐标签</label>
                    <div class="gen-tags">
                      <span
                        v-for="tag in generated.suggestedTags"
                        :key="tag"
                        :class="['gen-tag', { selected: selectedGeneratedTags.includes(tag) }]"
                        @click="toggleGeneratedTag(tag)"
                      >{{ tag }}</span>
                    </div>
                    <span class="form-hint">点击选中的标签将加入作品</span>
                  </div>
                </div>
              </div>

            </div>

            <!-- 底部操作栏 -->
            <div class="wizard-footer">
              <button v-if="currentStep > 0 && !generating" class="wf-prev" @click="prevStep">
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
                :class="['wf-next wf-finish', { disabled: generating }]"
                :disabled="generating"
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
const STEPS = ['基础信息', '创作风格', '核心设定', 'AI 生成']

const GENRES = ['科幻', '玄幻', '仙侠', '古风', '悬疑', '末世', '都市', '历史', '军事', '游戏', '无限流']

const STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'writing', label: '连载中' },
  { value: 'hiatus', label: '暂停' },
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

// ==================== 状态 ====================
const currentStep = ref(0)
const generating = ref(false)

const form = reactive({
  title: '',
  genre: '',
  tagline: '',
  status: 'draft',
  narrativeStyles: [] as string[],
  emotionalTones: [] as string[],
  coreKeywords: '',
  protagonistKeywords: '',
  worldSetting: '',
})

const generated = reactive({
  synopsis: '',
  character: '',
  suggestedTags: [] as string[],
})

const selectedGeneratedTags = ref<string[]>([])

// ==================== 计算属性 ====================
const canProceed = computed(() => {
  if (currentStep.value === 0) return form.title.trim() !== '' && form.genre !== ''
  return true
})

// ==================== 监听 visible 重置 ====================
watch(() => props.visible, (val) => {
  if (val) {
    currentStep.value = 0
    Object.assign(form, {
      title: '', genre: '', tagline: '', status: 'draft',
      narrativeStyles: [], emotionalTones: [],
      coreKeywords: '', protagonistKeywords: '', worldSetting: '',
    })
    Object.assign(generated, { synopsis: '', character: '', suggestedTags: [] })
    selectedGeneratedTags.value = []
    generating.value = false
  }
})

// ==================== 方法 ====================
function handleClose() {
  emit('close')
}

function toggleStyle(field: 'narrativeStyles' | 'emotionalTones', id: string) {
  const arr = form[field] as string[]
  const idx = arr.indexOf(id)
  if (idx === -1) arr.push(id)
  else arr.splice(idx, 1)
}

function getStyleName(id: string): string {
  return [...NARRATIVE_STYLES, ...EMOTIONAL_TONES].find(s => s.id === id)?.name ?? id
}

function toggleGeneratedTag(tag: string) {
  const idx = selectedGeneratedTags.value.indexOf(tag)
  if (idx === -1) selectedGeneratedTags.value.push(tag)
  else selectedGeneratedTags.value.splice(idx, 1)
}

function prevStep() {
  if (currentStep.value > 0) currentStep.value--
}

async function nextStep() {
  if (!canProceed.value) return
  if (currentStep.value === STEPS.length - 2) {
    currentStep.value++
    await runGeneration()
  } else {
    currentStep.value++
  }
}

async function runGeneration() {
  generating.value = true
  await new Promise(r => setTimeout(r, 1800))
  buildGeneratedContent()
  generating.value = false
}

function buildGeneratedContent() {
  const genreSettings: Record<string, string> = {
    '玄幻': '玄幻大陆', '科幻': '科技与神秘并存的未来世纪',
    '仙侠': '仙道争鸣的武侠世界', '古风': '风云变幻的古代王朝',
    '悬疑': '迷雾笼罩的现代城市', '末世': '文明坍塌的末日废土',
    '都市': '繁华都市的光与影', '历史': '波澜壮阔的历史长河',
    '军事': '铁血征战的疆场', '游戏': '虚实交织的游戏世界',
    '无限流': '危机四伏的无限副本',
  }
  const setting = genreSettings[form.genre] || '充满奇幻色彩的世界'
  const keywords = form.coreKeywords.split(/[,，\s]+/).filter(Boolean).slice(0, 3)
  const styles = [...form.narrativeStyles, ...form.emotionalTones].slice(0, 3)

  generated.synopsis = `《${form.title || '本作品'}》是一部发生在${setting}中的${form.genre}故事。${
    keywords.length > 0 ? `围绕「${keywords.join('」「')}」等核心元素，` : ''
  }作品以${styles.length > 0 ? styles.join('、') : '独特'}的风格，讲述了一段跌宕起伏的传奇历程。${
    form.tagline ? `\n\n${form.tagline}` : ''
  }`

  generated.character = form.protagonistKeywords
    ? `${form.protagonistKeywords}——在${setting}中，他/她经历了重重考验，最终成就了属于自己的传奇。`
    : `主角出身平凡，却心怀大志。凭借过人的天赋与坚韧的意志，在${setting}中一步步突破自我的局限，踏上了通往巅峰的征途。`

  generated.suggestedTags = [
    ...form.narrativeStyles.slice(0, 2),
    form.genre,
    ...keywords.slice(0, 2),
    ...form.emotionalTones.slice(0, 1),
  ].filter(Boolean)

  selectedGeneratedTags.value = generated.suggestedTags.slice(0, 3)
}

function finishCreate() {
  if (generating.value) return
  const styleTags = [
    ...selectedGeneratedTags.value,
  ]
  const work: Partial<WorkItem> = {
    title: form.title,
    genre: form.genre,
    styleTags,
    description: generated.synopsis || form.tagline,
    status: form.status,
  }
  emit('created', work)
  notify.success(`作品「${form.title}」创建成功`)
}
</script>
