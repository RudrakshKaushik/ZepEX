import { formatAuditMessage } from '@/lib/utils'

export function formatAuditActionLabel(action: string) {
  return action.replace(/_/g, ' ')
}

export function getAuditLogBadgeClass(action: string) {
  const upper = action.toUpperCase()

  if (
    upper.includes('FAILED') ||
    upper.includes('REJECTED') ||
    upper.includes('ERROR') ||
    upper.includes('DEACTIVATE')
  ) {
    return 'bg-red-50 text-red-700'
  }

  if (
    (upper.includes('STARTED') || upper.includes('PROCESSING')) &&
    !upper.includes('FAILED')
  ) {
    return 'bg-amber-50 text-amber-800'
  }

  if (
    upper.includes('APPROVED') ||
    upper.includes('UPLOADED') ||
    upper.includes('COMPLETED') ||
    upper.includes('SUBMITTED') ||
    upper.includes('PAID') ||
    upper.includes('ACTIVATED') ||
    upper.includes('CREATED') ||
    upper.includes('CONFIGURED')
  ) {
    return 'bg-green-50 text-green-700'
  }

  return 'bg-slate-100 text-slate-700'
}

export function getAuditLogMessage(log: { action: string; message: string }) {
  const formatted = formatAuditMessage(log.message, log.action)
  if (formatted) return formatted
  return formatAuditActionLabel(log.action)
}
