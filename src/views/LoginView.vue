<template>
  <div class="login-page">
    <!-- 左侧品牌区 -->
    <div class="brand-side">
      <!-- 飘浮故事碎片 -->
      <div class="floating-fragments" aria-hidden="true">
        <span class="frag frag-1">月光洒在古堡的窗台上…</span>
        <span class="frag frag-2">她回头望了一眼，走进了雾中</span>
        <span class="frag frag-3">剑锋划破夜空</span>
        <span class="frag frag-4">那封信，他始终没有拆开</span>
      </div>

      <!-- 飘浮光点 -->
      <div class="floating-particles" aria-hidden="true">
        <span class="dot dot-1"></span>
        <span class="dot dot-2"></span>
        <span class="dot dot-3"></span>
        <span class="dot dot-4"></span>
        <span class="dot dot-5"></span>
        <span class="dot dot-6"></span>
      </div>

      <div class="brand-content">
        <div class="brand-logo">
          <div class="logo-glow"></div>
          <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="logo-quill">
            <path d="M4 28c4-2 8-6 12-14C18 6 22 2 28 2c0 6-2 14-8 20-4 4-10 6-16 6z"/>
            <path d="M4 28c2-4 6-8 14-12"/>
            <path d="M16 16l4 4"/>
          </svg>
        </div>
        <h1 class="brand-title">SpeakEase.Write</h1>
        <div class="brand-typewriter">
          <span class="typewriter-text">{{ displayedTagline }}</span>
          <span class="typewriter-cursor">|</span>
        </div>
        <div class="brand-divider"></div>
        <p class="brand-desc">不是一键生成，是你在创作<br/>AI 只是你手中的笔</p>
        <div class="brand-features">
          <div class="feature-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            <span>你来执笔</span>
          </div>
          <div class="feature-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
            <span>AI 辅佐</span>
          </div>
          <div class="feature-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
            <span>故事生长</span>
          </div>
        </div>

        <!-- 底部语录 -->
        <div class="brand-quote">
          <span class="quote-mark">“</span>
          <span class="quote-text">每一个伟大的故事，都始于一个不肯放手的念头</span>
          <span class="quote-mark">”</span>
        </div>
      </div>
    </div>

    <!-- 右侧表单区 -->
    <div class="form-side">
      <div class="login-card">
        <div class="card-header">
          <h2>{{ tab === 'login' ? '欢迎回来' : '开始创作' }}</h2>
          <p>{{ tab === 'login' ? '继续你的故事' : '开启你的创作之旅' }}</p>
        </div>

        <div class="tabs">
          <button :class="{ active: tab === 'login' }" @click="switchTab('login')">登录</button>
          <button :class="{ active: tab === 'register' }" @click="switchTab('register')">注册</button>
        </div>

        <!-- 登录表单 -->
        <form v-if="tab === 'login'" @submit.prevent="handleLogin">
          <div class="field">
            <label>账号</label>
            <input v-model="loginAccount" type="text" placeholder="请输入账号" required />
          </div>
          <div class="field">
            <label>密码</label>
            <input v-model="loginPassword" type="password" placeholder="请输入密码" required />
          </div>
          <button type="submit" class="btn-primary" :disabled="auth.isLoading.value">
            {{ auth.isLoading.value ? '登录中...' : '登录' }}
          </button>
        </form>

        <!-- 注册表单 -->
        <form v-else @submit.prevent="handleRegister">
          <div class="field">
            <label>账号</label>
            <input v-model="regAccount" type="text" placeholder="请输入账号" required />
          </div>
          <div class="field">
            <label>邮箱</label>
            <input v-model="regEmail" type="email" placeholder="请输入邮箱" required />
          </div>
          <div class="field">
            <label>昵称</label>
            <input v-model="regNickName" type="text" placeholder="请输入昵称" required />
          </div>
          <div class="field">
            <label>密码</label>
            <input v-model="regPassword" type="password" placeholder="至少6位" required minlength="6" />
          </div>
          <button type="submit" class="btn-primary" :disabled="auth.isLoading.value">
            {{ auth.isLoading.value ? '注册中...' : '注册' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useNotification } from '@/composables/useNotification'
import type { LoginRequest, RegisterRequest } from '@/lib/api'
import '../styles/LoginView.css'

const auth = useAuth()
const notify = useNotification()
const tab = ref<'login' | 'register'>('login')

// ---- 打字机动画 ----
const taglines = [
  '你的构思，你的灵魂',
  '笔下世界，由你定义',
  '灵感为墨，创作成书',
  '故事因你而不同',
]
const displayedTagline = ref('')
let taglineIdx = 0
let charIdx = 0
let isDeleting = false
let typewriterTimer: ReturnType<typeof setTimeout> | null = null

function tickTypewriter() {
  const current = taglines[taglineIdx]
  if (!isDeleting) {
    charIdx++
    displayedTagline.value = current.slice(0, charIdx)
    if (charIdx === current.length) {
      typewriterTimer = setTimeout(() => { isDeleting = true; tickTypewriter() }, 2200)
      return
    }
    typewriterTimer = setTimeout(tickTypewriter, 90)
  } else {
    charIdx--
    displayedTagline.value = current.slice(0, charIdx)
    if (charIdx === 0) {
      isDeleting = false
      taglineIdx = (taglineIdx + 1) % taglines.length
      typewriterTimer = setTimeout(tickTypewriter, 400)
      return
    }
    typewriterTimer = setTimeout(tickTypewriter, 45)
  }
}

onMounted(() => { tickTypewriter() })
onUnmounted(() => { if (typewriterTimer) clearTimeout(typewriterTimer) })

// ---- 监听 auth.error 弹出通知 ----
watch(() => auth.error.value, (msg) => {
  if (msg) notify.error(msg)
})

// ---- 表单逻辑 ----

const loginAccount = ref('')
const loginPassword = ref('')
const regAccount = ref('')
const regEmail = ref('')
const regNickName = ref('')
const regPassword = ref('')

function switchTab(t: 'login' | 'register') {
  tab.value = t
  auth.clearError()
}

async function handleLogin() {
  await auth.login({ account: loginAccount.value, password: loginPassword.value } satisfies LoginRequest)
}

async function handleRegister() {
  const ok = await auth.register({
    account: regAccount.value,
    email: regEmail.value,
    nickName: regNickName.value,
    password: regPassword.value,
  } satisfies RegisterRequest)
  if (ok) tab.value = 'login'
}
</script>


