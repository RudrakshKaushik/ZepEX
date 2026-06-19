import { Link } from 'react-router-dom'
import type { AuditLogEntry } from '@/types'
import { formatAuditMessage, formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface AdminAuditFeedProps {
  logs: AuditLogEntry[]
  showViewAll?: boolean
}

function formatAuditLine(log: AuditLogEntry) {
  const message = formatAuditMessage(log.message)
  if (message) return message
  return log.action.replace(/_/g, ' ')
}

function isErrorLog(log: AuditLogEntry) {
  const text = `${log.action} ${log.message}`.toUpperCase()
  return (
    text.includes('FAILED') ||
    text.includes('ERROR') ||
    text.includes('REJECTED') ||
    text.includes('DEACTIVATE')
  )
}

export function AdminAuditFeed({ logs, showViewAll = true }: AdminAuditFeedProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e2e8f0] px-5 py-4 sm:px-6">
        <h2 className="text-base font-semibold text-gray-900">Audit Logs</h2>
        {showViewAll && (
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/audit-logs">View all</Link>
          </Button>
        )}
      </div>
      <div className="px-5 py-4 sm:px-6">
        {logs.length === 0 ? (
          <p className="text-sm text-gray-400">No audit activity yet.</p>
        ) : (
          <ul className="space-y-4">
            {logs.map((log) => {
              const error = isErrorLog(log)
              return (
                <li key={log.id} className="text-sm">
                  <p
                    className={`font-medium ${error ? 'text-red-600' : 'text-[#16a34a]'}`}
                  >
                    {formatAuditLine(log)}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {log.action_by_email} · {formatDateTime(log.created_at)}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
