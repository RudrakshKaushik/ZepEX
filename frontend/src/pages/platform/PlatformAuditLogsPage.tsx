import { ScrollText } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getPlatformAuditLogs } from '@/api'
import { AuditLogList } from '@/components/AuditLogList'
import { DashboardLayout, platformNav } from '@/components/layout/DashboardLayout'
import { PageLoader } from '@/components/ui/spinner'
import type { AuditLogEntry } from '@/types'

export function PlatformAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPlatformAuditLogs()
      .then((res) => setLogs(res.data.results))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  return (
    <DashboardLayout
      portal="platform"
      title="Platform Audit Logs"
      subtitle="Cross-tenant activity trail"
      navItems={[
        ...platformNav,
        { label: 'Audit Logs', to: '/platform/audit-logs', icon: ScrollText },
      ]}
    >
      <AuditLogList logs={logs} badgeClassName="bg-slate-100 text-slate-700" />
    </DashboardLayout>
  )
}
