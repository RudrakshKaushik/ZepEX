import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AuditLogEntry } from '@/types'
import { formatAuditMessage, formatDateTime } from '@/lib/utils'

interface AuditLogListProps {
  logs: AuditLogEntry[]
  title?: string
  badgeClassName?: string
}

export function AuditLogList({
  logs,
  title,
  badgeClassName = 'bg-indigo-50 text-indigo-700',
}: AuditLogListProps) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="p-4 sm:p-6 sm:pb-4">
        <CardTitle className="text-base sm:text-lg">
          {title ?? `Recent activity (${logs.length})`}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No audit logs yet.</p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="min-w-0 rounded-lg border p-3 sm:p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <span
                    className={`w-fit max-w-full rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClassName}`}
                  >
                    {log.action.replace(/_/g, ' ')}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDateTime(log.created_at)}
                  </span>
                </div>
                <p className="mt-2 break-words text-sm leading-relaxed">
                  {formatAuditMessage(log.message)}
                </p>
                <p className="mt-1 break-all text-xs text-muted-foreground">
                  By {log.action_by_email}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
