import { useEffect, useState } from 'react'
import { getCompanyAuditLogs } from '@/api'
import { DashboardLayout, adminNav } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoader } from '@/components/ui/spinner'
import type { AuditLogEntry } from '@/types'
import { formatDateTime } from '@/lib/utils'

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCompanyAuditLogs()
      .then((res) => setLogs(res.data.results))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  return (
    <DashboardLayout title="Audit Logs" subtitle="Company activity trail" navItems={adminNav}>
      <Card>
        <CardHeader>
          <CardTitle>Recent activity ({logs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No audit logs yet.</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(log.created_at)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm">{log.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">By {log.action_by_email}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
