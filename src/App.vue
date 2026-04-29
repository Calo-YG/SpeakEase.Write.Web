<template>
  <LoginView v-if="!auth.isAuthenticated.value" />
  <!-- 编辑器全屏覆盖，不显示顶部导航 -->
  <WorkEditorView
    v-else-if="currentPage === 'editor'"
    :work="editorWork"
    @back="navigate('works')"
  />
  <div v-else class="app-shell">
    <header class="top-bar">
      <div class="bar-left">
        <svg class="bar-logo-icon" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 28c4-2 8-6 12-14C18 6 22 2 28 2c0 6-2 14-8 20-4 4-10 6-16 6z"/><path d="M4 28c2-4 6-8 14-12"/><path d="M16 16l4 4"/></svg>
        <span class="bar-brand">SpeakEase.Write</span>
      </div>
      <div class="bar-tabs">
        <button :class="['bar-tab', { active: currentPage === 'dashboard' }]" @click="navigate('dashboard')">工作台</button>
        <button :class="['bar-tab', { active: currentPage === 'works' }]" @click="navigate('works')">作品管理</button>
        <button :class="['bar-tab', { active: currentPage === 'references' }]" @click="navigate('references')">参考库</button>
        <button :class="['bar-tab', { active: currentPage === 'tags' }]" @click="navigate('tags')">标签管理</button>
        <button :class="['bar-tab', { active: currentPage === 'providers' }]" @click="navigate('providers')">提供商管理</button>
        <button :class="['bar-tab', { active: currentPage === 'configs' }]" @click="navigate('configs')">模型配置</button>
      </div>
      <div class="bar-right">
        <span class="bar-user-name" v-if="userName">{{ userName }}</span>
        <button class="bar-settings" @click="navigate('settings')" title="个人设置">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
        </button>
        <button class="bar-logout" @click="auth.logout()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          <span>退出</span>
        </button>
      </div>
    </header>
    <main class="app-main">
      <Transition :name="transitionName" mode="out-in">
        <DashboardView v-if="currentPage === 'dashboard'" key="dashboard" />
        <WorksView v-else-if="currentPage === 'works'" key="works" />
        <ReferenceLibraryView v-else-if="currentPage === 'references'" key="references" />
        <TagsView v-else-if="currentPage === 'tags'" key="tags" />
        <ModelSettingsView v-else-if="currentPage === 'providers' || currentPage === 'configs'" :active-tab="currentPage === 'configs' ? 'configs' : 'providers'" />
        <UserSettingsView v-else-if="currentPage === 'settings'" key="settings" />
      </Transition>
    </main>
  </div>
  <NotificationToast />
  <ConfirmDialog />
</template>

<script setup lang="ts">
import { ref, provide, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { userApi } from '@/lib/api'
import type { WorkItem } from '@/lib/api'
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import WorksView from '@/views/WorksView.vue'
import ReferenceLibraryView from '@/views/ReferenceLibraryView.vue'
import TagsView from '@/views/TagsView.vue'
import ModelSettingsView from '@/views/ModelSettingsView.vue'
import UserSettingsView from '@/views/UserSettingsView.vue'
import WorkEditorView from '@/views/WorkEditorView.vue'
import NotificationToast from '@/components/NotificationToast.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import './styles/App.global.css'
import './styles/App.css'

const auth = useAuth()

type PageKey = 'dashboard' | 'works' | 'references' | 'tags' | 'providers' | 'configs' | 'settings' | 'editor'
const PAGE_ORDER: PageKey[] = ['dashboard', 'works', 'references', 'tags', 'providers', 'configs', 'settings', 'editor']

const currentPage = ref<PageKey>('dashboard')
const transitionName = ref<'page-right' | 'page-left'>('page-right')
const editorWork = ref<WorkItem | null>(null)
const userName = ref('')

async function loadUserProfile() {
  try {
    const result = await userApi.getProfile()
    if ((result.succeeded ?? result.successed) && result.data) {
      userName.value = (result.data as any).nickName ?? result.data.account ?? ''
    }
  } catch { /* ignore */ }
}

onMounted(loadUserProfile)

function navigate(page: PageKey, work?: WorkItem) {
  const oldIdx = PAGE_ORDER.indexOf(currentPage.value)
  const newIdx = PAGE_ORDER.indexOf(page)
  transitionName.value = newIdx >= oldIdx ? 'page-right' : 'page-left'
  if (page === 'editor' && work) editorWork.value = work
  currentPage.value = page
}

// 提供给子组件（WorksView）的导航函数
provide('openEditor', (work: WorkItem) => navigate('editor', work))
</script>
