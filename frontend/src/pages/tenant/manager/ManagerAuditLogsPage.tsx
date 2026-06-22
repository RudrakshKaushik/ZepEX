import { useEffect, useState } from 'react'
import { ScrollText } from 'lucide-react'
import { getCompanyAuditLogs } from '@/api'
import { getApiErrorMessage } from '@/api/client'
import { AdminListPanel } from '@/components/admin/AdminListPanel'
import { AuditLogCards } from '@/components/audit/AuditLogCards'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { PageLoader } from '@/components/ui/spinner'
import { useAuth } from '@/context/AuthContext'
import { buildManagerNav } from '@/lib/rolePermissions'
import type { AuditLogEntry } from '@/types'

export function ManagerAuditLogsPage() {
  const { user } = useAuth()
  const navItems = buildManagerNav(user)
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getCompanyAuditLogs()
      .then((res) => setLogs(res.data.results))
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  return (
    <DashboardLayout
      title="Audit Logs"
      subtitle="Company activity trail"
      breadcrumb="Audit Logs"
      icon={ScrollText}
      navItems={navItems}
    >
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <AdminListPanel
        title="Recent Activity"
        description="Track uploads, approvals, and system events across your company."
        count={logs.length}
      >
        <div className="border-0 bg-transparent p-4 sm:p-6">
          <AuditLogCards logs={logs} />
        </div>
      </AdminListPanel>
    </DashboardLayout>
  )
}
