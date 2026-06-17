import { useEffect, useState } from 'react'
import { getCompanyAuditLogs } from '@/api'
import { AuditLogList } from '@/components/AuditLogList'
import { DashboardLayout, adminNav } from '@/components/layout/DashboardLayout'
import { PageLoader } from '@/components/ui/spinner'
import type { AuditLogEntry } from '@/types'

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
      <AuditLogList logs={logs} />
    </DashboardLayout>
  )
}
