import { useCallback, useEffect, useState } from 'react'
import { ScrollText } from 'lucide-react'
import { getPlatformAuditLogs, listPlatformCompanies } from '@/api'
import { getApiErrorMessage } from '@/api/client'
import { AdminListPanel } from '@/components/admin/AdminListPanel'
import { AuditLogCards } from '@/components/audit/AuditLogCards'
import { AuditLogFiltersBar } from '@/components/audit/AuditLogFiltersBar'
import { DashboardLayout, platformNavWithAudit } from '@/components/layout/DashboardLayout'
import { AdminListPanelShimmer, AuditCardsShimmer } from '@/components/ui/shimmer'
import { PaginationControls } from '@/components/ui/pagination-controls'
import { toAuditLogApiParams, type AuditLogFilters } from '@/lib/auditFilters'
import { toast } from '@/lib/toast'
import type { AuditLogEntry } from '@/types'

export function PlatformAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [draftFilters, setDraftFilters] = useState<AuditLogFilters>({})
  const [appliedFilters, setAppliedFilters] = useState<AuditLogFilters>({})

  useEffect(() => {
    listPlatformCompanies()
      .then((res) =>
        setCompanies(res.data.results.map((company) => ({ id: company.id, name: company.name }))),
      )
      .catch(() => setCompanies([]))
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getPlatformAuditLogs(toAuditLogApiParams(appliedFilters, page))
      setLogs(data.results)
      setTotalPages(data.total_pages)
      setTotalCount(data.count)
    } catch (err) {
      toast.error(getApiErrorMessage(err))
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [appliedFilters, page])

  useEffect(() => {
    load()
  }, [load])

  if (loading && logs.length === 0) {
    return (
      <DashboardLayout
        portal="platform"
        title="Platform Audit Logs"
        subtitle="Cross-tenant activity trail"
        breadcrumb="Audit Logs"
        icon={ScrollText}
        navItems={platformNavWithAudit}
      >
        <AdminListPanelShimmer rows={5} />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      portal="platform"
      title="Platform Audit Logs"
      subtitle="Cross-tenant activity trail"
      breadcrumb="Audit Logs"
      icon={ScrollText}
      navItems={platformNavWithAudit}
    >
      <AuditLogFiltersBar
        values={draftFilters}
        onChange={setDraftFilters}
        companies={companies}
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
        description="Track activity across all companies on the platform."
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
