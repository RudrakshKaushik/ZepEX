export type ToastVariant = 'default' | 'success' | 'error'

export type ToastItem = {
  id: string
  message: string
  variant: ToastVariant
}

type Listener = () => void

const listeners = new Set<Listener>()
let toasts: ToastItem[] = []

function notify() {
  listeners.forEach((listener) => listener())
}

function dismiss(id: string) {
  toasts = toasts.filter((item) => item.id !== id)
  notify()
}

function push(message: string, variant: ToastVariant = 'default') {
  const id = crypto.randomUUID()
  toasts = [...toasts, { id, message, variant }]
  notify()
  window.setTimeout(() => dismiss(id), 5000)
  return id
}

export function subscribe(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getToasts() {
  return toasts
}

function toast(message: string) {
  return push(message, 'default')
}

toast.success = (message: string) => push(message, 'success')
toast.error = (message: string) => push(message, 'error')
toast.dismiss = dismiss

export { toast }
