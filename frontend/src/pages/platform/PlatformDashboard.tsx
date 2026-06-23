import { Building2, ClipboardList, FileText, LayoutDashboard } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPlatformDashboard } from '@/api'
import { AdminDataTable, AdminTableCell, AdminTableRow } from '@/components/admin/AdminDataTable'
import { AdminListPanel } from '@/components/admin/AdminListPanel'
import { MetricCard } from '@/components/MetricCard'
import { StatusBadge } from '@/components/StatusBadge'
import { DashboardLayout, platformNavWithAudit } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { DashboardPageShimmer } from '@/components/ui/shimmer'
import { formatMetricDisplay } from '@/lib/format'
import { formatDate } from '@/lib/utils'
import uploadSubmit from '@/assets/uploadSubmit.png'

interface PlatformDashboardData {
  platform_owner: { name: string; email: string }
  metrics: Record<string, number | string>
  recent_companies: Array<{
    id: string
    name: string
    domain: string
    is_verified: boolean
    created_at: string
  }>
}

export function PlatformDashboard() {
  const [data, setData] = useState<PlatformDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPlatformDashboard()
      .then((res) => setData(res.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <DashboardLayout
        portal="platform"
        title="Platform Dashboard"
        breadcrumb="Platform Dashboard"
        icon={LayoutDashboard}
        navItems={platformNavWithAudit}
      >
        <DashboardPageShimmer />
      </DashboardLayout>
    )
  }

  const metrics = data?.metrics ?? {}
  const companies = data?.recent_companies ?? []

  return (
    <DashboardLayout
      portal="platform"
      title="Platform Dashboard"
      subtitle={data?.platform_owner.email}
      breadcrumb="Platform Dashboard"
      icon={LayoutDashboard}
      navItems={platformNavWithAudit}
      headerAction={
        <Button asChild>
          <Link to="/platform/requests" className="inline-flex items-center gap-2">
            <img src={uploadSubmit} alt="" className="h-6 w-6" />
            Review Company Requests
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Companies"
          value={formatMetricDisplay(Number(metrics.total_companies ?? 0))}
          icon={Building2}
          accent="blue"
        />
        <MetricCard
          title="Pending Requests"
          value={formatMetricDisplay(Number(metrics.pending_company_requests ?? 0))}
          icon={ClipboardList}
          accent="orange"
        />
        <MetricCard
          title="Total Reports"
          value={formatMetricDisplay(Number(metrics.total_reports ?? 0))}
          icon={FileText}
          accent="purple"
        />
        <MetricCard
          title="Paid Reports"
          value={formatMetricDisplay(Number(metrics.paid_reports ?? 0))}
          icon={FileText}
          accent="green"
        />
      </div>

      <div className="mt-6">
        <AdminListPanel
          title="Recent Companies"
          count={companies.length}
          description="Latest companies registered on the platform."
        >
          {companies.length === 0 ? (
            <p className="px-5 py-8 text-sm text-gray-400 sm:px-6">No companies yet.</p>
          ) : (
            <AdminDataTable columns={['Company', 'Domain', 'Status', 'Created']}>
              {companies.map((company) => (
                <AdminTableRow key={company.id}>
                  <AdminTableCell className="font-medium text-gray-900">
                    {company.name}
                  </AdminTableCell>
                  <AdminTableCell>{company.domain}</AdminTableCell>
                  <AdminTableCell>
                    <StatusBadge status={company.is_verified ? 'APPROVED' : 'PENDING'} />
                  </AdminTableCell>
                  <AdminTableCell className="text-gray-500">
                    {formatDate(company.created_at)}
                  </AdminTableCell>
                </AdminTableRow>
              ))}
            </AdminDataTable>
          )}
        </AdminListPanel>
      </div>
    </DashboardLayout>
  )
}
