import type { Receipt } from '@/types'

const RETRYABLE_AI_STATUSES = new Set(['AI_FAILED', 'AI_RETRY_REQUIRED'])

export function canRetryReceiptAi(receipt: Receipt): boolean {
  if (!receipt.ai_status) return false
  return RETRYABLE_AI_STATUSES.has(receipt.ai_status)
}

export function receiptAiStatusLabel(status: string | null | undefined): string | null {
  if (!status) return null
  return status.replace(/_/g, ' ').toLowerCase()
}
