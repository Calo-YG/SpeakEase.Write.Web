<template>
  <div class="user-settings">
    <div class="us-hero">
      <div class="us-hero-content">
        <div class="us-avatar">
          <span class="us-avatar-text">{{ avatarInitial }}</span>
        </div>
        <div class="us-hero-info">
          <h2 class="us-hero-name">{{ profile.nickname || '未设置昵称' }}</h2>
          <p class="us-hero-email">{{ profile.email || '未绑定邮箱' }}</p>
        </div>
      </div>
      <div class="us-hero-deco">
        <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="40" cy="28" r="14" opacity="0.15"/>
          <path d="M12 68c0-15.464 12.536-28 28-28s28 12.536 28 28" opacity="0.12"/>
          <circle cx="40" cy="28" r="6" opacity="0.08"/>
        </svg>
      </div>
    </div>

    <div class="us-body">
      <div class="us-section">
        <div class="us-section-head">
          <div class="us-section-icon us-section-icon-blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <h3>基本资料</h3>
        </div>
        <div class="us-card">
          <div class="us-field">
            <label>昵称</label>
            <div class="us-input-wrap">
              <input
                v-model="profile.nickname"
                class="us-input"
                placeholder="设置昵称"
                maxlength="30"
              />
              <span class="us-char-count">{{ profile.nickname.length }}/30</span>
            </div>
          </div>
          <div class="us-field">
            <label>邮箱</label>
            <input
              v-model="profile.email"
              class="us-input"
              type="email"
              placeholder="your@email.com"
            />
          </div>
          <div class="us-divider"></div>
          <div class="us-actions">
            <button
              class="us-btn us-btn-primary"
              :disabled="saving"
              @click="handleSaveProfile"
            >
              <svg v-if="!saving" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              <span v-if="saving" class="us-spinner"></span>
              {{ saving ? '保存中...' : '保存资料' }}
            </button>
          </div>
        </div>
      </div>

      <div class="us-section">
        <div class="us-section-head">
          <div class="us-section-icon us-section-icon-amber">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          </div>
          <h3>修改密码</h3>
        </div>
        <div class="us-card">
          <div class="us-field">
            <label>当前密码</label>
            <input
              v-model="pwd.old"
              class="us-input"
              type="password"
              placeholder="输入当前密码"
            />
          </div>
          <div class="us-pwd-row">
            <div class="us-field">
              <label>新密码</label>
              <input
                v-model="pwd.new1"
                class="us-input"
                type="password"
                placeholder="至少6位"
                minlength="6"
              />
            </div>
            <div class="us-field">
              <label>确认新密码</label>
              <input
                v-model="pwd.new2"
                class="us-input"
                type="password"
                placeholder="再次输入新密码"
              />
            </div>
          </div>
          <div v-if="pwd.new1 && pwd.new2 && pwd.new1 !== pwd.new2" class="us-hint us-hint-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            两次输入的新密码不一致
          </div>
          <div v-else-if="pwd.new1 && pwd.new1.length < 6" class="us-hint us-hint-warn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            密码至少需要6位字符
          </div>
          <div class="us-divider"></div>
          <div class="us-actions">
            <button
              class="us-btn us-btn-secondary"
              :disabled="!pwdChangeValid || changingPwd"
              @click="handleChangePassword"
            >
              <svg v-if="!changingPwd" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span v-if="changingPwd" class="us-spinner"></span>
              {{ changingPwd ? '修改中...' : '修改密码' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { userApi } from '@/lib/api'
import { useNotification } from '@/composables/useNotification'

const notify = useNotification()
const saving = ref(false)
const changingPwd = ref(false)

const profile = ref({ nickname: '', email: '' })
const pwd = ref({ old: '', new1: '', new2: '' })

const avatarInitial = computed(() => {
  const n = profile.value.nickname.trim()
  if (n) return n[0].toUpperCase()
  const e = profile.value.email.trim()
  if (e) return e[0].toUpperCase()
  return '?'
})

const pwdChangeValid = computed(() =>
  pwd.value.old.trim().length > 0 &&
  pwd.value.new1.trim().length >= 6 &&
  pwd.value.new1 === pwd.value.new2
)

async function loadProfile() {
  try {
    const result = await userApi.getProfile()
    if ((result.succeeded ?? result.successed) && result.data) {
      profile.value.nickname = result.data.nickName ?? ''
      profile.value.email = result.data.email ?? ''
    }
  } catch { /* ignored */ }
}

async function handleSaveProfile() {
  saving.value = true
  try {
    await userApi.updateProfile({ nickName: profile.value.nickname, email: profile.value.email })
    notify.success('资料已保存')
  } catch (e: any) {
    notify.error(e.message ?? '保存失败')
  } finally { saving.value = false }
}

async function handleChangePassword() {
  if (pwd.value.new1 !== pwd.value.new2) {
    notify.error('两次密码不一致')
    return
  }
  changingPwd.value = true
  try {
    await userApi.changePassword({ oldPassword: pwd.value.old, newPassword: pwd.value.new1 })
    notify.success('密码已修改')
    pwd.value = { old: '', new1: '', new2: '' }
  } catch (e: any) {
    notify.error(e.message ?? '密码修改失败')
  } finally { changingPwd.value = false }
}

onMounted(loadProfile)
</script>

<style scoped>
.user-settings {
  min-height: 100%;
  background: #f9fafb;
  display: flex;
  flex-direction: column;
}

/* ---- Hero ---- */
.us-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2rem 3rem 1.75rem;
  background: linear-gradient(135deg, #fafbff 0%, #f3f4ff 60%, #ede9ff 100%);
  border-bottom: 1px solid #ede9ff;
  position: relative;
  overflow: hidden;
}

.us-hero::before {
  content: '';
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 260px;
  background: radial-gradient(ellipse at 80% 50%, rgba(139, 92, 246, 0.08) 0%, transparent 70%);
  pointer-events: none;
}

.us-hero-content {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  position: relative;
  z-index: 1;
}

.us-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #818cf8 0%, #6366f1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
}

.us-avatar-text {
  font-size: 1.4rem;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}

.us-hero-name {
  font-size: 1.35rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.15rem;
  letter-spacing: -0.01em;
}

.us-hero-email {
  font-size: 0.85rem;
  color: #6b7280;
}

.us-hero-deco {
  width: 80px;
  height: 80px;
  color: #a5b4fc;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  opacity: 0.6;
  animation: us-float 6s ease-in-out infinite;
}

@keyframes us-float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-8px); }
}

/* ---- Body ---- */
.us-body {
  flex: 1;
  padding: 1.75rem 3rem 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  max-width: 720px;
  width: 100%;
  margin: 0 auto;
}

/* ---- Section ---- */
.us-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.us-section-head {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.us-section-head h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.us-section-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.us-section-icon svg {
  width: 16px;
  height: 16px;
}

.us-section-icon-blue {
  background: #eef2ff;
  color: #6366f1;
}

.us-section-icon-amber {
  background: #fffbeb;
  color: #d97706;
}

/* ---- Card ---- */
.us-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  transition: box-shadow 0.2s ease;
}

.us-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}

/* ---- Fields ---- */
.us-field {
  margin-bottom: 1.1rem;
}

.us-field:last-of-type {
  margin-bottom: 0;
}

.us-field label {
  display: block;
  font-size: 0.8rem;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 0.4rem;
  letter-spacing: 0.01em;
}

.us-input-wrap {
  position: relative;
}

.us-input {
  width: 100%;
  padding: 0.55rem 0.85rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  outline: none;
  background: #fff;
  color: #111827;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.us-input::placeholder {
  color: #c0c4cc;
}

.us-input:focus {
  border-color: #818cf8;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.us-char-count {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.7rem;
  color: #c0c4cc;
  pointer-events: none;
}

/* ---- Password row ---- */
.us-pwd-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

/* ---- Hints ---- */
.us-hint {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.775rem;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  margin-top: 0.75rem;
}

.us-hint-error {
  background: #fef2f2;
  color: #dc2626;
}

.us-hint-warn {
  background: #fffbeb;
  color: #d97706;
}

/* ---- Divider ---- */
.us-divider {
  height: 1px;
  background: #f3f4f6;
  margin: 1.25rem 0;
}

/* ---- Actions ---- */
.us-actions {
  display: flex;
  justify-content: flex-end;
}

.us-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1.4rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.15s ease;
}

.us-btn svg {
  flex-shrink: 0;
}

.us-btn-primary {
  background: #4f46e5;
  color: #fff;
}

.us-btn-primary:hover:not(:disabled) {
  background: #4338ca;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
}

.us-btn-primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.us-btn-secondary {
  background: #fff;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.us-btn-secondary:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #d1d5db;
}

.us-btn-secondary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* ---- Spinner ---- */
.us-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: us-spin 0.6s linear infinite;
}

.us-btn-secondary .us-spinner {
  border-color: rgba(0, 0, 0, 0.1);
  border-top-color: #6b7280;
}

@keyframes us-spin {
  to { transform: rotate(360deg); }
}

/* ---- Responsive ---- */
@media (max-width: 640px) {
  .us-hero {
    padding: 1.5rem 1.25rem;
  }
  .us-hero-deco {
    display: none;
  }
  .us-body {
    padding: 1.25rem 1.25rem 2rem;
  }
  .us-pwd-row {
    grid-template-columns: 1fr;
  }
  .us-avatar {
    width: 44px;
    height: 44px;
  }
  .us-avatar-text {
    font-size: 1.1rem;
  }
  .us-hero-name {
    font-size: 1.15rem;
  }
}
</style>
