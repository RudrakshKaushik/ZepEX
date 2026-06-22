import { Calendar } from 'lucide-react'
import type { AuditLogEntry } from '@/types'
import {
  formatAuditActionLabel,
  getAuditLogBadgeClass,
  getAuditLogMessage,
} from '@/lib/auditLogs'
import { formatDateTime } from '@/lib/utils'

interface AuditLogCardsProps {
  logs: AuditLogEntry[]
  emptyMessage?: string
}

export function AuditLogCards({
  logs,
  emptyMessage = 'No audit logs yet.',
}: AuditLogCardsProps) {
  if (logs.length === 0) {
    return <p className="text-sm text-gray-400">{emptyMessage}</p>
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <article
          key={log.id}
          className="rounded-xl border border-[#e2e8f0] bg-white p-4 sm:p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <span
                className={`inline-block max-w-full rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${getAuditLogBadgeClass(log.action)}`}
              >
                {formatAuditActionLabel(log.action)}
              </span>
              <p className="text-xs text-gray-500">By {log.action_by_email}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-[#2563eb]">
              <Calendar className="h-4 w-4" aria-hidden />
              <time dateTime={log.created_at}>{formatDateTime(log.created_at)}</time>
            </div>
          </div>
          <p className="mt-3 break-words text-sm leading-relaxed text-gray-700">
            {getAuditLogMessage(log)}
          </p>
        </article>
      ))}
    </div>
  )
}
