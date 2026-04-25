<template>
  <div class="model-settings">
    <!-- ====== Providers ====== -->
    <div v-if="activeTab === 'providers'" class="tab-content">
      <div class="section-header">
        <h2>提供商管理</h2>
        <button class="btn-primary" @click="openProviderForm()"><span>+</span><span>新增提供商</span></button>
      </div>

      <div v-if="loadingProviders" class="loading-hint">加载中...</div>
      <div v-else-if="providers.length === 0" class="empty-hint">暂无提供商，点击「新增提供商」添加</div>
      <div v-else class="card-grid">
        <div v-for="p in providers" :key="p.id" class="card">
          <div class="card-top">
            <span class="card-title">{{ p.label }}</span>
            <span :class="['badge', p.isActive ? 'badge-on' : 'badge-off']">{{ p.isActive ? '启用' : '禁用' }}</span>
          </div>
          <div class="card-body">
            <div class="info-row"><span class="info-label">提供商</span><span>{{ p.provider }}</span></div>
            <div class="info-row"><span class="info-label">API 地址</span><span class="mono">{{ p.apiBaseUrl }}</span></div>
            <div class="info-row"><span class="info-label">API Key</span><span class="mono">{{ maskKey(p.apiKey) }}</span></div>
            <div v-if="p.description" class="info-row"><span class="info-label">描述</span><span>{{ p.description }}</span></div>
          </div>
          <div class="card-actions">
            <button :class="['btn-outline', 'btn-toggle', { 'btn-toggle-on': p.isActive }]" @click="handleToggleProvider(p)" :disabled="togglingProviderId === p.id">
              {{ togglingProviderId === p.id ? '...' : p.isActive ? '禁用' : '启用' }}
            </button>
            <button class="btn-outline" @click="openProviderForm(p)">编辑</button>
            <button class="btn-danger-outline" @click="handleDeleteProvider(p.id)">删除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ====== Configs Tab ====== -->
    <div v-if="activeTab === 'configs'" class="tab-content">
      <!-- Active config summary bar -->
      <div v-if="activeConfig" class="active-config-bar">
        <div class="active-config-info">
          <span class="active-config-dot"></span>
          <span class="active-config-label">当前使用</span>
          <span class="active-config-name">{{ activeConfig.configName }}</span>
          <span class="active-config-detail">{{ activeConfig.providerLabel }} / {{ activeConfig.modelName }}</span>
        </div>
      </div>
      <div v-else class="active-config-bar active-config-bar-empty">
        <span class="active-config-label">尚未激活任何模型配置，请选择一个配置激活</span>
      </div>

      <div class="section-header">
        <h2>模型配置</h2>
        <button class="btn-primary" @click="openConfigForm()"><span>+</span><span>新增配置</span></button>
      </div>

      <div v-if="loadingConfigs" class="loading-hint">加载中...</div>
      <div v-else-if="configs.length === 0" class="empty-hint">暂无模型配置，点击「新增配置」添加</div>
      <div v-else class="card-grid">
        <div v-for="c in configs" :key="c.id" :class="['card', { 'card-highlight': c.isActive }]">
          <div class="card-top">
            <span class="card-title">{{ c.configName }}</span>
            <span :class="['badge', c.isActive ? 'badge-on' : 'badge-off']">{{ c.isActive ? '使用中' : '未激活' }}</span>
          </div>
          <div class="card-body">
            <div class="info-row"><span class="info-label">提供商</span><span>{{ c.providerLabel }}</span></div>
            <div class="info-row"><span class="info-label">模型</span><span class="mono">{{ c.modelName }}</span></div>
            <div class="info-row"><span class="info-label">偏好</span><span>{{ preferenceLabel(c.preference) }}</span></div>
            <div v-if="c.useFallback" class="info-row"><span class="info-label">回退</span><span>{{ c.fallbackProviderLabel }} / {{ c.fallbackModelName }}</span></div>
            <div v-if="c.description" class="info-row desc-row"><span class="info-label">描述</span><span>{{ c.description }}</span></div>
            <div class="tag-row">
              <span v-if="c.supportsStreaming" class="tag">Streaming</span>
              <span v-if="c.supportsToolCall" class="tag">ToolCall</span>
            </div>
            <div v-if="c.createAt" class="info-row info-row-subtle"><span class="info-label">创建</span><span>{{ formatDate(c.createAt) }}</span></div>
          </div>
          <div class="card-actions">
            <button v-if="!c.isActive" class="btn-primary btn-sm" :disabled="activatingConfigId === c.id" @click="handleActivateConfig(c.id)">
              {{ activatingConfigId === c.id ? '激活中...' : '激活' }}
            </button>
            <button class="btn-outline" @click="openConfigForm(c)">编辑</button>
            <button class="btn-danger-outline" @click="handleDeleteConfig(c.id)">删除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ====== Provider Modal ====== -->
    <div v-if="showProviderModal" class="modal-overlay" @click.self="closeProviderModal">
      <div class="modal">
        <div class="modal-head">
          <h3>{{ editingProvider ? '编辑提供商' : '新增提供商' }}</h3>
          <button class="btn-close" @click="closeProviderModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="field">
            <label>标签 <span class="req">*</span></label>
            <input v-model="providerForm.label" type="text" placeholder="例如：我的 OpenAI" />
          </div>
          <div class="field">
            <label>提供商类型 <span class="req">*</span></label>
            <select v-model="providerForm.provider">
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="deepseek">DeepSeek</option>
              <option value="custom">自定义</option>
            </select>
          </div>
          <div class="field">
            <label>API 地址 <span class="req">*</span></label>
            <input v-model="providerForm.apiBaseUrl" type="text" placeholder="https://api.openai.com/v1" />
          </div>
          <div class="field">
            <label>API Key <span class="req">*</span></label>
            <input v-model="providerForm.apiKey" type="password" :placeholder="editingProvider ? '留空则不修改' : 'sk-...'" />
          </div>
          <div class="field field-switch">
            <label>启用状态</label>
            <label class="switch"><input type="checkbox" v-model="providerForm.isActive" /><span class="slider"></span></label>
          </div>
          <div class="field">
            <label>描述</label>
            <textarea v-model="providerForm.description" rows="2" placeholder="可选描述"></textarea>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn-outline" @click="closeProviderModal">取消</button>
          <button class="btn-primary" :disabled="savingProvider" @click="handleSaveProvider">
            {{ savingProvider ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ====== Config Modal ====== -->
    <div v-if="showConfigModal" class="modal-overlay" @click.self="closeConfigModal">
      <div class="modal modal-wide">
        <div class="modal-head">
          <h3>{{ editingConfig ? '编辑模型配置' : '新增模型配置' }}</h3>
          <button class="btn-close" @click="closeConfigModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="field">
            <label>配置名称 <span class="req">*</span></label>
            <input v-model="configForm.configName" type="text" placeholder="例如：日常对话" />
          </div>
          <div class="field-row">
            <div class="field">
              <label>提供商 <span class="req">*</span></label>
              <select v-model="configForm.providerId">
                <option value="">请选择</option>
                <option v-for="p in providers" :key="p.id" :value="p.id">{{ p.label }}</option>
              </select>
            </div>
            <div class="field">
              <label>模型名称 <span class="req">*</span></label>
              <input v-model="configForm.modelName" type="text" placeholder="gpt-4o" />
            </div>
          </div>
          <div class="field-row">
            <div class="field">
              <label>偏好</label>
              <select v-model="configForm.preference">
                <option value="">默认</option>
                <option value="speed">速度优先</option>
                <option value="quality">质量优先</option>
                <option value="balanced">均衡</option>
              </select>
            </div>
            <div class="field field-switch">
              <label>启用回退</label>
              <label class="switch"><input type="checkbox" v-model="configForm.useFallback" /><span class="slider"></span></label>
            </div>
          </div>
          <div v-if="configForm.useFallback" class="field-row">
            <div class="field">
              <label>回退提供商</label>
              <select v-model="configForm.fallbackProviderId">
                <option value="">请选择</option>
                <option v-for="p in providers" :key="p.id" :value="p.id">{{ p.label }}</option>
              </select>
            </div>
            <div class="field">
              <label>回退模型</label>
              <input v-model="configForm.fallbackModelName" type="text" placeholder="gpt-3.5-turbo" />
            </div>
          </div>
          <div class="field">
            <label>描述</label>
            <textarea v-model="configForm.description" rows="2" placeholder="可选描述"></textarea>
          </div>
          <div class="adv-toggle" @click="showAdvanced = !showAdvanced">
            {{ showAdvanced ? '收起高级设置 ▲' : '展开高级设置 ▼' }}
          </div>
          <div v-if="showAdvanced" class="adv-section">
            <div class="field-row">
              <div class="field">
                <label>预估成本</label>
                <input v-model.number="configForm.estimateCost" type="number" step="0.01" min="0" placeholder="0.00" />
              </div>
              <div class="field">
                <label>上下文窗口</label>
                <input v-model.number="configForm.contextWindow" type="number" min="0" placeholder="8192" />
              </div>
            </div>
            <div class="field-row">
              <div class="field">
                <label>最大输出 Token</label>
                <input v-model.number="configForm.maxOutputTokens" type="number" min="0" placeholder="4096" />
              </div>
              <div class="field field-switch">
                <label>支持流式</label>
                <label class="switch"><input type="checkbox" v-model="configForm.supportsStreaming" /><span class="slider"></span></label>
              </div>
            </div>
            <div class="field-row">
              <div class="field field-switch">
                <label>支持工具调用</label>
                <label class="switch"><input type="checkbox" v-model="configForm.supportsToolCall" /><span class="slider"></span></label>
              </div>
            </div>
            <div class="field">
              <label>能力标签（逗号分隔）</label>
              <input v-model="capabilityTagsInput" type="text" placeholder="chat, code, vision" />
            </div>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn-outline" @click="closeConfigModal">取消</button>
          <button class="btn-primary" :disabled="savingConfig" @click="handleSaveConfig">
            {{ savingConfig ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  modelApi,
  type AIModelProvider,
  type UserModelConfig,
  type SaveProviderRequest,
  type SaveUserModelConfigRequest,
  type ApiResult,
} from '@/lib/api'
import { useNotification } from '@/composables/useNotification'
import { useConfirm } from '@/composables/useConfirm'
import '../styles/ModelSettingsView.css'

const notify = useNotification()
const { confirm } = useConfirm()

// ==================== Helpers ====================

function isOk<T>(result: ApiResult<T>): boolean {
  return !!(result.succeeded ?? result.successed)
}

function toNum(v: number | undefined): number | undefined {
  return typeof v === 'number' && !isNaN(v) ? v : undefined
}

function maskKey(key: string): string {
  if (!key) return '***'
  if (key.length <= 8) return '***'
  return key.slice(0, 4) + '***' + key.slice(-4)
}

function preferenceLabel(p: string): string {
  const map: Record<string, string> = { speed: '速度优先', quality: '质量优先', balanced: '均衡' }
  return map[p] || p || '-'
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch {
    return dateStr
  }
}

// ==================== Tab state ====================

const props = withDefaults(defineProps<{ activeTab?: 'providers' | 'configs' }>(), {
  activeTab: 'providers',
})

const activeTab = computed(() => props.activeTab)

// ==================== Providers ====================

const providers = ref<AIModelProvider[]>([])
const loadingProviders = ref(false)

async function loadProviders() {
  loadingProviders.value = true
  try {
    const result = await modelApi.getProviders()
    providers.value = isOk(result) ? (result.data || []) : []
    if (!isOk(result)) notify.error(result.message || '加载提供商失败')
  } catch (err) {
    notify.error(err instanceof Error ? err.message : '加载提供商失败')
  } finally {
    loadingProviders.value = false
  }
}

// Provider modal
const showProviderModal = ref(false)
const editingProvider = ref<AIModelProvider | null>(null)
const savingProvider = ref(false)

const emptyProviderForm = (): { label: string; provider: string; apiBaseUrl: string; apiKey: string; description: string; isActive: boolean } => ({
  label: '', provider: 'openai', apiBaseUrl: '', apiKey: '', description: '', isActive: true,
})

const providerForm = ref(emptyProviderForm())

function openProviderForm(p?: AIModelProvider) {
  if (p) {
    editingProvider.value = p
    providerForm.value = {
      label: p.label,
      provider: p.provider,
      apiBaseUrl: p.apiBaseUrl,
      apiKey: '',
      description: p.description,
      isActive: p.isActive,
    }
  } else {
    editingProvider.value = null
    providerForm.value = emptyProviderForm()
  }
  showProviderModal.value = true
}

function closeProviderModal() {
  showProviderModal.value = false
  editingProvider.value = null
}

async function handleSaveProvider() {
  const f = providerForm.value
  if (!f.label || !f.provider || !f.apiBaseUrl) {
    notify.error('请填写所有必填项')
    return
  }
  // When creating, apiKey is required; when editing, it can be left empty
  if (!editingProvider.value && !f.apiKey) {
    notify.error('请填写 API Key')
    return
  }

  savingProvider.value = true
  try {
    const req: SaveProviderRequest = {
      label: f.label,
      provider: f.provider,
      apiBaseUrl: f.apiBaseUrl,
      apiKey: f.apiKey,
      description: f.description,
      isActive: f.isActive,
    }
    const result = editingProvider.value
      ? await modelApi.updateProvider(editingProvider.value.id, req)
      : await modelApi.createProvider(req)

    if (isOk(result)) {
      closeProviderModal()
      await loadProviders()
    } else {
      notify.error(result.message || '保存失败')
    }
  } catch (err) {
    notify.error(err instanceof Error ? err.message : '保存失败')
  } finally {
    savingProvider.value = false
  }
}

const togglingProviderId = ref<string | null>(null)

async function handleToggleProvider(p: AIModelProvider) {
  togglingProviderId.value = p.id
  try {
    const req: SaveProviderRequest = {
      label: p.label,
      provider: p.provider,
      apiBaseUrl: p.apiBaseUrl,
      apiKey: '',
      description: p.description,
      isActive: !p.isActive,
    }
    const result = await modelApi.updateProvider(p.id, req)
    if (isOk(result)) {
      await loadProviders()
    } else {
      notify.error(result.message || '切换状态失败')
    }
  } catch (err) {
    notify.error(err instanceof Error ? err.message : '切换状态失败')
  } finally {
    togglingProviderId.value = null
  }
}

async function handleDeleteProvider(id: string) {
  const ok = await confirm({
    title: '删除提供商',
    message: '确定要删除此提供商吗？',
    detail: '删除后，关联该提供商的模型配置可能无法正常使用。',
    confirmText: '删除',
    type: 'danger',
  })
  if (!ok) return
  try {
    const result = await modelApi.deleteProvider(id)
    if (isOk(result)) {
      await loadProviders()
    } else {
      notify.error(result.message || '删除失败')
    }
  } catch (err) {
    notify.error(err instanceof Error ? err.message : '删除失败')
  }
}

// ==================== Configs ====================

const configs = ref<UserModelConfig[]>([])
const loadingConfigs = ref(false)
const activatingConfigId = ref<string | null>(null)
const activeConfig = ref<UserModelConfig | null>(null)

async function loadActiveConfig() {
  try {
    const result = await modelApi.getActiveConfig()
    activeConfig.value = isOk(result) ? result.data : null
  } catch {
    activeConfig.value = null
  }
}

async function loadConfigs() {
  loadingConfigs.value = true
  try {
    const result = await modelApi.getConfigs()
    configs.value = isOk(result) ? (result.data || []) : []
    if (!isOk(result)) notify.error(result.message || '加载配置失败')
  } catch (err) {
    notify.error(err instanceof Error ? err.message : '加载配置失败')
  } finally {
    loadingConfigs.value = false
  }
  await loadActiveConfig()
}

// Config modal
const showConfigModal = ref(false)
const editingConfig = ref<UserModelConfig | null>(null)
const savingConfig = ref(false)
const showAdvanced = ref(false)
const capabilityTagsInput = ref('')

interface ConfigFormState {
  configName: string
  providerId: string
  modelName: string
  fallbackProviderId: string
  fallbackModelName: string
  useFallback: boolean
  preference: string
  description: string
  estimateCost: number | undefined
  contextWindow: number | undefined
  maxOutputTokens: number | undefined
  supportsStreaming: boolean
  supportsToolCall: boolean
}

const emptyConfigForm = (): ConfigFormState => ({
  configName: '', providerId: '', modelName: '',
  fallbackProviderId: '', fallbackModelName: '',
  useFallback: false, preference: '', description: '',
  estimateCost: undefined, contextWindow: undefined,
  maxOutputTokens: undefined, supportsStreaming: true, supportsToolCall: false,
})

const configForm = ref<ConfigFormState>(emptyConfigForm())

function openConfigForm(c?: UserModelConfig) {
  if (c) {
    editingConfig.value = c
    configForm.value = {
      configName: c.configName,
      providerId: c.providerId,
      modelName: c.modelName,
      fallbackProviderId: c.fallbackProviderId || '',
      fallbackModelName: c.fallbackModelName || '',
      useFallback: c.useFallback,
      preference: c.preference || '',
      description: c.description || '',
      estimateCost: c.estimateCost || undefined,
      contextWindow: c.contextWindow || undefined,
      maxOutputTokens: c.maxOutputTokens || undefined,
      supportsStreaming: c.supportsStreaming,
      supportsToolCall: c.supportsToolCall,
    }
    capabilityTagsInput.value = (c.capabilityTags || []).join(', ')
  } else {
    editingConfig.value = null
    configForm.value = emptyConfigForm()
    capabilityTagsInput.value = ''
  }
  showAdvanced.value = false
  showConfigModal.value = true
}

function closeConfigModal() {
  showConfigModal.value = false
  editingConfig.value = null
}

async function handleSaveConfig() {
  const f = configForm.value
  if (!f.configName || !f.providerId || !f.modelName) {
    notify.error('请填写配置名称、提供商和模型名称')
    return
  }
  savingConfig.value = true
  try {
    const tags = capabilityTagsInput.value.split(',').map(t => t.trim()).filter(Boolean)

    const req: SaveUserModelConfigRequest = {
      configName: f.configName,
      providerId: f.providerId,
      modelName: f.modelName,
      fallbackProviderId: f.fallbackProviderId || undefined,
      fallbackModelName: f.fallbackModelName || undefined,
      useFallback: f.useFallback,
      preference: f.preference || undefined,
      description: f.description || undefined,
      estimateCost: toNum(f.estimateCost),
      contextWindow: toNum(f.contextWindow),
      maxOutputTokens: toNum(f.maxOutputTokens),
      supportsStreaming: f.supportsStreaming,
      supportsToolCall: f.supportsToolCall,
      capabilityTags: tags.length > 0 ? tags : undefined,
    }
    if (editingConfig.value) {
      req.id = editingConfig.value.id
    }

    const result = await modelApi.saveConfig(req)
    if (isOk(result)) {
      closeConfigModal()
      await loadConfigs()
    } else {
      notify.error(result.message || '保存失败')
    }
  } catch (err) {
    notify.error(err instanceof Error ? err.message : '保存失败')
  } finally {
    savingConfig.value = false
  }
}

async function handleActivateConfig(id: string) {
  activatingConfigId.value = id
  try {
    const result = await modelApi.activateConfig(id)
    if (isOk(result)) {
      await loadConfigs()
    } else {
      notify.error(result.message || '激活失败')
    }
  } catch (err) {
    notify.error(err instanceof Error ? err.message : '激活失败')
  } finally {
    activatingConfigId.value = null
  }
}

async function handleDeleteConfig(id: string) {
  const ok = await confirm({
    title: '删除模型配置',
    message: '确定要删除此模型配置吗？',
    detail: '若该配置正在使用中，删除后 AI 功能将无法正常调用。',
    confirmText: '删除',
    type: 'danger',
  })
  if (!ok) return
  try {
    const result = await modelApi.deleteConfig(id)
    if (isOk(result)) {
      await loadConfigs()
    } else {
      notify.error(result.message || '删除失败')
    }
  } catch (err) {
    notify.error(err instanceof Error ? err.message : '删除失败')
  }
}

// ==================== Lifecycle ====================

onMounted(() => {
  loadProviders()
  loadConfigs()
})

watch(activeTab, (tab) => {
  if (tab === 'configs' && providers.value.length === 0) {
    loadProviders()
  }
})
</script>


