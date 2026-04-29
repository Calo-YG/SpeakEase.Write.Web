<template>
  <div class="user-settings-view">
    <div class="us-header">
      <h2 class="us-title">个人设置</h2>
    </div>

    <div class="us-card">
      <h3 class="us-card-title">基本资料</h3>
      <div class="us-field">
        <label>昵称</label>
        <input v-model="profile.nickname" class="us-input" placeholder="设置昵称" maxlength="30" />
      </div>
      <div class="us-field">
        <label>邮箱</label>
        <input v-model="profile.email" class="us-input" type="email" placeholder="your@email.com" />
      </div>
      <div class="us-actions">
        <button class="us-btn us-btn-primary" :disabled="saving" @click="handleSaveProfile">{{ saving ? '保存中...' : '保存资料' }}</button>
      </div>
    </div>

    <div class="us-card">
      <h3 class="us-card-title">修改密码</h3>
      <div class="us-field">
        <label>当前密码</label>
        <input v-model="pwd.old" class="us-input" type="password" placeholder="输入当前密码" />
      </div>
      <div class="us-field">
        <label>新密码</label>
        <input v-model="pwd.new1" class="us-input" type="password" placeholder="至少6位" minlength="6" />
      </div>
      <div class="us-field">
        <label>确认新密码</label>
        <input v-model="pwd.new2" class="us-input" type="password" placeholder="再次输入新密码" />
      </div>
      <div class="us-actions">
        <button class="us-btn us-btn-secondary" :disabled="!pwdChangeValid || changingPwd" @click="handleChangePassword">
          {{ changingPwd ? '修改中...' : '修改密码' }}
        </button>
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
.user-settings-view { max-width:640px; margin:0 auto; padding:32px 24px; }
.us-header { margin-bottom:24px; }
.us-title { font-size:20px; font-weight:700; color:var(--editor-text,#111827); }
.us-card { background:#fff; border:1px solid var(--editor-border,#e5e7eb); border-radius:12px; padding:20px 24px; margin-bottom:20px; }
.us-card-title { font-size:15px; font-weight:600; margin-bottom:16px; color:var(--editor-text,#111827); }
.us-field { margin-bottom:14px; }
.us-field label { display:block; font-size:13px; color:var(--editor-muted,#6b7280); margin-bottom:4px; }
.us-input { width:100%; padding:8px 12px; border:1px solid var(--editor-border,#d1d5db); border-radius:8px; font-size:14px; outline:none; background:#fff; color:var(--editor-text,#111827); }
.us-input:focus { border-color:var(--editor-accent,#4f46e5); }
.us-actions { margin-top:16px; }
.us-btn { padding:8px 24px; border-radius:8px; font-size:14px; cursor:pointer; border:none; }
.us-btn-primary { background:var(--editor-accent,#4f46e5); color:#fff; }
.us-btn-primary:disabled { opacity:.6; cursor:not-allowed; }
.us-btn-secondary { background:#f3f4f6; color:var(--editor-text,#374151); }
.us-btn-secondary:disabled { opacity:.5; cursor:not-allowed; }
</style>
