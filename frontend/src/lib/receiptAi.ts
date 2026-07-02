import type { Receipt } from '@/types'

const RETRYABLE_AI_STATUSES = new Set(['AI_FAILED', 'AI_RETRY_REQUIRED'])

export function isAiExtractionFailed(receipt: Receipt): boolean {
  if (receipt.ai_status && RETRYABLE_AI_STATUSES.has(receipt.ai_status)) {
    return true
  }

  if (
    !receipt.line_items?.length &&
    receipt.policy_violation_reason?.toLowerCase().includes('ai extraction failed')
  ) {
    return true
  }

  return false
}

export function isAiExtractionPending(receipt: Receipt): boolean {
  return receipt.ai_status === 'AI_PENDING' || receipt.ai_status === 'AI_PROCESSING'
}

export function canRetryReceiptAi(receipt: Receipt): boolean {
  if (receipt.ai_status === 'AI_RETRY_REQUIRED') return true

  if (isAiExtractionFailed(receipt) && receipt.ai_status !== 'AI_FAILED') return true

  return false
}

export function receiptDisplayTitle(receipt: Receipt): string {
  if (isAiExtractionFailed(receipt)) return 'Extraction failed'
  if (isAiExtractionPending(receipt)) return 'Processing receipt…'
  return receipt.vendor_name || 'Unknown vendor'
}

export function receiptAiStatusLabel(status: string | null | undefined): string | null {
  if (!status) return null
  return status.replace(/_/g, ' ').toLowerCase()
}
