import { useCallback, useEffect, useState } from 'react'
import { ScrollText } from 'lucide-react'
import { getCompanyAuditLogs, listEmployees } from '@/api'
import { getApiErrorMessage } from '@/api/client'
import { AdminListPanel } from '@/components/admin/AdminListPanel'
import { AuditLogCards } from '@/components/audit/AuditLogCards'
import { AuditLogFiltersBar } from '@/components/audit/AuditLogFiltersBar'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { AdminListPanelShimmer, AuditCardsShimmer } from '@/components/ui/shimmer'
import { PaginationControls } from '@/components/ui/pagination-controls'
import { useAdminNav } from '@/hooks/useAdminNav'
import { toAuditLogApiParams, type AuditLogFilters } from '@/lib/auditFilters'
import { fetchAllPages } from '@/lib/pagination'
import { toast } from '@/lib/toast'
import type { AuditLogEntry, EmployeeRecord } from '@/types'

export function AuditLogsPage() {
  const { navItems, ready } = useAdminNav()
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [employees, setEmployees] = useState<EmployeeRecord[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [draftFilters, setDraftFilters] = useState<AuditLogFilters>({})
  const [appliedFilters, setAppliedFilters] = useState<AuditLogFilters>({})

  useEffect(() => {
    fetchAllPages((p) => listEmployees({ page: p }))
      .then(setEmployees)
      .catch(() => setEmployees([]))
  }, [])

  const load = useCallback(async () => {
    if (!ready) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const { data } = await getCompanyAuditLogs(toAuditLogApiParams(appliedFilters, page))
      setLogs(data.results)
      setTotalPages(data.total_pages)
      setTotalCount(data.count)
    } catch (err) {
      toast.error(getApiErrorMessage(err))
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [appliedFilters, page, ready])

  useEffect(() => {
    load()
  }, [load])

  if (!ready) {
    return (
      <DashboardLayout
        title="Audit Logs"
        subtitle="Company activity trail"
        breadcrumb="Audit Logs"
        icon={ScrollText}
        navItems={navItems}
      >
        <AdminListPanelShimmer rows={5} />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Audit Logs"
      subtitle="Company activity trail"
      breadcrumb="Audit Logs"
      icon={ScrollText}
      navItems={navItems}
    >
      <AuditLogFiltersBar
        values={draftFilters}
        onChange={setDraftFilters}
        employees={employees}
        onApply={() => {
          setAppliedFilters(draftFilters)
          setPage(1)
        }}
        onClear={() => {
          setDraftFilters({})
          setAppliedFilters({})
          setPage(1)
        }}
      />

      <AdminListPanel
        title="Recent Activity"
        description="Track uploads, approvals, and system events across your company."
        count={loading ? undefined : totalCount}
      >
        <div className="border-0 bg-transparent p-4 sm:p-6">
          {loading ? <AuditCardsShimmer count={5} /> : <AuditLogCards logs={logs} />}
        </div>
        {!loading && (
          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={setPage}
          />
        )}
      </AdminListPanel>
    </DashboardLayout>
  )
}
