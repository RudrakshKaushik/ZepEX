import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { ScrollText } from 'lucide-react'
import { getCompanyAuditLogs } from '@/api'
import { AdminListPanel } from '@/components/admin/AdminListPanel'
import { AuditLogCards } from '@/components/audit/AuditLogCards'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { PageLoader } from '@/components/ui/spinner'
import { PaginationControls } from '@/components/ui/pagination-controls'
import { useAdminNav } from '@/hooks/useAdminNav'
import type { AuditLogEntry } from '@/types'

export function AuditLogsPage() {
  const { navItems, setupComplete, ready } = useAdminNav()
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ready) return
    if (!setupComplete) {
      setLoading(false)
      return
    }
    setLoading(true)
    getCompanyAuditLogs({ page })
      .then((res) => {
        setLogs(res.data.results)
        setTotalPages(res.data.total_pages)
        setTotalCount(res.data.count)
      })
      .finally(() => setLoading(false))
  }, [ready, setupComplete, page])

  if (!ready || loading) return <PageLoader />

  if (!setupComplete) {
    return <Navigate to="/admin" replace />
  }

  return (
    <DashboardLayout
      title="Audit Logs"
      subtitle="Company activity trail"
      breadcrumb="Audit Logs"
      icon={ScrollText}
      navItems={navItems}
    >
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
