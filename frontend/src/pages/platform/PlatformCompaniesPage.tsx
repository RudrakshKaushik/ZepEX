import { Building2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listPlatformCompanies } from '@/api'
import { getApiErrorMessage } from '@/api/client'
import { AdminDataTable, AdminTableCell, AdminTableRow } from '@/components/admin/AdminDataTable'
import { AdminListPanel } from '@/components/admin/AdminListPanel'
import { AdminListSearchBar } from '@/components/admin/AdminListSearchBar'
import { StatusBadge } from '@/components/StatusBadge'
import { DashboardLayout, platformNavWithAudit } from '@/components/layout/DashboardLayout'
import { AdminListPanelShimmer } from '@/components/ui/shimmer'
import { formatDate } from '@/lib/utils'

interface PlatformCompany {
  id: string
  name: string
  domain: string
  is_verified: boolean
  created_at?: string
}

export function PlatformCompaniesPage() {
  const [companies, setCompanies] = useState<PlatformCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchDraft, setSearchDraft] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    listPlatformCompanies()
      .then((res) => setCompanies(res.data.results))
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return companies
    return companies.filter(
      (company) =>
        company.name.toLowerCase().includes(query) ||
        company.domain.toLowerCase().includes(query),
    )
  }, [companies, search])

  if (loading) {
    return (
      <DashboardLayout
        portal="platform"
        title="Companies"
        subtitle="Browse verified companies on the platform"
        breadcrumb="Companies"
        icon={Building2}
        navItems={platformNavWithAudit}
      >
        <AdminListPanelShimmer />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      portal="platform"
      title="Companies"
      subtitle="View departments, employees, roles, policy, and workflow for each company"
      breadcrumb="Companies"
      icon={Building2}
      navItems={platformNavWithAudit}
    >
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <AdminListPanel
        title="All Companies"
        count={filtered.length}
        description="Select a company to view its configuration and structure."
        toolbar={
          <AdminListSearchBar
            value={searchDraft}
            onChange={setSearchDraft}
            onApply={() => setSearch(searchDraft.trim())}
            onClear={() => {
              setSearchDraft('')
              setSearch('')
            }}
            placeholder="Search companies…"
          />
        }
      >
        {filtered.length === 0 ? (
          <p className="px-5 py-8 text-sm text-gray-400 sm:px-6">No companies found.</p>
        ) : (
          <AdminDataTable columns={['Company', 'Domain', 'Status', 'Created', '']}>
            {filtered.map((company) => (
              <AdminTableRow key={company.id}>
                <AdminTableCell className="font-medium text-gray-900">{company.name}</AdminTableCell>
                <AdminTableCell>{company.domain}</AdminTableCell>
                <AdminTableCell>
                  <StatusBadge status={company.is_verified ? 'APPROVED' : 'PENDING'} />
                </AdminTableCell>
                <AdminTableCell className="text-gray-500">
                  {company.created_at ? formatDate(company.created_at) : '—'}
                </AdminTableCell>
                <AdminTableCell className="text-right">
                  <Link
                    to={`/platform/companies/${company.id}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    View details
                  </Link>
                </AdminTableCell>
              </AdminTableRow>
            ))}
          </AdminDataTable>
        )}
      </AdminListPanel>
    </DashboardLayout>
  )
}
