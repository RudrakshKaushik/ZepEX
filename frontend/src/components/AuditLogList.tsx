import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AuditLogEntry } from '@/types'
import { AuditLogCards } from '@/components/audit/AuditLogCards'

interface AuditLogListProps {
  logs: AuditLogEntry[]
  title?: string
}

export function AuditLogList({ logs, title }: AuditLogListProps) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="p-4 sm:p-6 sm:pb-4">
        <CardTitle className="text-base sm:text-lg">
          {title ?? `Recent activity (${logs.length})`}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
        <AuditLogCards logs={logs} />
      </CardContent>
    </Card>
  )
}
