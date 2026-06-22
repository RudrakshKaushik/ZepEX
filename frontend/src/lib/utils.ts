import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: string | number, currency = 'INR') {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (Number.isNaN(num)) return `${currency} 0.00`
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(num)
}

export function formatDate(date: string | null | undefined) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(date: string | null | undefined) {
  if (!date) return '—'
  return new Date(date).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatAuditMessage(message: string, action?: string) {
  const actionUpper = (action ?? '').toUpperCase()
  const isAiFailure =
    actionUpper.includes('FAILED') ||
    actionUpper.includes('AI_PROCESSING_FAILED')

  if (
    isAiFailure &&
    (message.includes('generativelanguage.googleapis.com') ||
      message.includes('Gemini API') ||
      message.toLowerCase().includes('not enabled'))
  ) {
    return 'AI extraction failed. Gemini API is not enabled or blocked for your API key.'
  }

  if (message.length > 280) {
    return `${message.slice(0, 280)}…`
  }
  return message
}
