import { reactive } from 'vue'

export type ConfirmType = 'danger' | 'warning' | 'info'

export interface ConfirmOptions {
  title?: string
  message: string
  detail?: string
  confirmText?: string
  cancelText?: string
  type?: ConfirmType
}

interface ConfirmState extends Required<Omit<ConfirmOptions, 'detail'>> {
  detail: string
  visible: boolean
  resolve: ((value: boolean) => void) | null
}

const state = reactive<ConfirmState>({
  visible: false,
  title: '确认操作',
  message: '',
  detail: '',
  confirmText: '确认',
  cancelText: '取消',
  type: 'danger',
  resolve: null,
})

export function useConfirm() {
  function confirm(options: ConfirmOptions): Promise<boolean> {
    state.visible = true
    state.title = options.title ?? '确认操作'
    state.message = options.message
    state.detail = options.detail ?? ''
    state.confirmText = options.confirmText ?? '确认'
    state.cancelText = options.cancelText ?? '取消'
    state.type = options.type ?? 'danger'
    state.resolve = null

    return new Promise<boolean>((resolve) => {
      state.resolve = resolve
    })
  }

  function ok() {
    state.visible = false
    state.resolve?.(true)
    state.resolve = null
  }

  function cancel() {
    state.visible = false
    state.resolve?.(false)
    state.resolve = null
  }

  return { state, confirm, ok, cancel }
}
