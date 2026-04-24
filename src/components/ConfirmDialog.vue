<template>
  <Teleport to="body">
    <Transition name="confirm">
      <div v-if="state.visible" class="confirm-overlay" @click.self="cancel">
        <Transition name="confirm-panel">
          <div v-if="state.visible" class="confirm-panel" role="dialog" aria-modal="true">
            <!-- 图标 -->
            <div :class="['confirm-icon-wrap', `confirm-icon-${state.type}`]">
              <!-- danger: 垃圾桶 -->
              <svg v-if="state.type === 'danger'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14H6L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/>
                <path d="M9 6V4h6v2"/>
              </svg>
              <!-- warning: 感叹号三角 -->
              <svg v-else-if="state.type === 'warning'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <!-- info: 圆圈 i -->
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            </div>

            <!-- 文字区 -->
            <div class="confirm-content">
              <h3 class="confirm-title">{{ state.title }}</h3>
              <p class="confirm-message">{{ state.message }}</p>
              <p v-if="state.detail" class="confirm-detail">{{ state.detail }}</p>
            </div>

            <!-- 按钮区 -->
            <div class="confirm-actions">
              <button class="confirm-btn confirm-cancel" @click="cancel">
                {{ state.cancelText }}
              </button>
              <button :class="['confirm-btn', `confirm-ok-${state.type}`]" @click="ok">
                {{ state.confirmText }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useConfirm } from '@/composables/useConfirm'
import '../styles/ConfirmDialog.css'

const { state, ok, cancel } = useConfirm()
</script>
