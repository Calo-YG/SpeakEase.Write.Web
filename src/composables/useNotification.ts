import { ref } from 'vue'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface NotificationItem {
  id: number
  type: NotificationType
  message: string
  duration: number
  /** 内部字段：剩余毫秒 */
  remaining: number
  /** 内部字段：上次 tick 时间戳 */
  lastTick: number
  /** 内部字段：是否暂停（hover） */
  paused: boolean
  /** 内部字段：进度 0~1 */
  progress: number
  /** 内部字段：是否正在关闭（播放 leave 动画） */
  closing: boolean
}

const notifications = ref<NotificationItem[]>([])
let nextId = 0
let rafId: number | null = null

function startLoop() {
  if (rafId !== null) return
  const tick = () => {
    const now = Date.now()
    let dirty = false
    for (const n of notifications.value) {
      if (n.closing || n.paused || n.duration <= 0) continue
      const elapsed = now - n.lastTick
      n.lastTick = now
      n.remaining = Math.max(0, n.remaining - elapsed)
      n.progress = n.remaining / n.duration
      if (n.remaining <= 0) {
        n.closing = true
        dirty = true
      }
    }
    // 真正移除已关闭的（给动画时间）
    const closingIds = notifications.value
      .filter(n => n.closing && n.remaining <= 0)
      .map(n => n.id)
    if (closingIds.length) {
      setTimeout(() => {
        notifications.value = notifications.value.filter(
          n => !closingIds.includes(n.id) || n.closing
        )
        // 再给 leave 动画 320ms 后真正移除
        setTimeout(() => {
          notifications.value = notifications.value.filter(n => !closingIds.includes(n.id))
        }, 320)
      }, 0)
    }
    if (notifications.value.length > 0) {
      rafId = requestAnimationFrame(tick)
    } else {
      rafId = null
    }
  }
  rafId = requestAnimationFrame(tick)
}

function add(type: NotificationType, message: string, duration = 4000) {
  const id = nextId++
  const now = Date.now()
  const item: NotificationItem = {
    id,
    type,
    message,
    duration,
    remaining: duration,
    lastTick: now,
    paused: false,
    progress: 1,
    closing: false,
  }
  notifications.value.push(item)
  startLoop()
  return id
}

function remove(id: number) {
  const n = notifications.value.find(n => n.id === id)
  if (n) n.closing = true
  setTimeout(() => {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }, 320)
}

function pause(id: number) {
  const n = notifications.value.find(n => n.id === id)
  if (n && !n.closing) n.paused = true
}

function resume(id: number) {
  const n = notifications.value.find(n => n.id === id)
  if (n && !n.closing) {
    n.paused = false
    n.lastTick = Date.now()
  }
}

function clear() {
  notifications.value.splice(0)
}

/** 全局通知 composable */
export function useNotification() {
  return {
    notifications,
    notify: add,
    remove,
    pause,
    resume,
    clear,
    success: (msg: string, duration?: number) => add('success', msg, duration),
    error: (msg: string, duration?: number) => add('error', msg, duration ?? 3000),
    warning: (msg: string, duration?: number) => add('warning', msg, duration),
    info: (msg: string, duration?: number) => add('info', msg, duration),
  }
}
