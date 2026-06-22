import { useEffect, useState } from 'react'
import { ScrollText } from 'lucide-react'
import { getCompanyAuditLogs } from '@/api'
import { getApiErrorMessage } from '@/api/client'
import { AdminListPanel } from '@/components/admin/AdminListPanel'
import { AuditLogCards } from '@/components/audit/AuditLogCards'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { PageLoader } from '@/components/ui/spinner'
import { PaginationControls } from '@/components/ui/pagination-controls'
import { useAuth } from '@/context/AuthContext'
import { buildManagerNav } from '@/lib/rolePermissions'
import type { AuditLogEntry } from '@/types'

export function ManagerAuditLogsPage() {
  const { user } = useAuth()
  const navItems = buildManagerNav(user)
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    getCompanyAuditLogs({ page })
      .then((res) => {
        setLogs(res.data.results)
        setTotalPages(res.data.total_pages)
        setTotalCount(res.data.count)
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [page])

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
        count={totalCount}
      >
        <div className="border-0 bg-transparent p-4 sm:p-6">
          <AuditLogCards logs={logs} />
        </div>
        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={setPage}
        />
      </AdminListPanel>
    </DashboardLayout>
  )
}
