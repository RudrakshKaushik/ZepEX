import { Building2, CheckCircle2, Clock, Users, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getCompanyAdminDashboard, getCompanyAuditLogs } from '@/api'
import { AdminAuditFeed } from '@/components/admin/AdminAuditFeed'
import { AdminSetupChecklist } from '@/components/admin/AdminSetupChecklist'
import { MetricCard } from '@/components/MetricCard'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { DashboardPageShimmer } from '@/components/ui/shimmer'
import { useAdminNav, invalidateAdminSetupCache } from '@/hooks/useAdminNav'
import { formatMetricDisplay } from '@/lib/format'
import type { AuditLogEntry } from '@/types'

interface AdminDashboardData {
  company_admin: { name: string; email: string; company: string }
  setup_status: Record<string, boolean>
  metrics: Record<string, number>
}

export function AdminDashboard() {
  const { navItems } = useAdminNav()
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    invalidateAdminSetupCache()
    getCompanyAdminDashboard()
      .then(async (res) => {
        setData(res.data)
        const logsRes = await getCompanyAuditLogs().catch(() => null)
        if (logsRes) {
          setAuditLogs(logsRes.data.results.slice(0, 6))
        }
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <DashboardLayout
        title="Company Admin"
        breadcrumb="Company Admin"
        navItems={navItems}
      >
        <DashboardPageShimmer />
      </DashboardLayout>
    )
  }

  const metrics = data?.metrics ?? {}
  const setup = data?.setup_status ?? {}

  return (
    <DashboardLayout
      title="Company Admin"
      subtitle={data?.company_admin.company}
      breadcrumb="Company Admin"
      icon={Building2}
      navItems={navItems}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Team Members"
          value={formatMetricDisplay(metrics.total_users ?? 0)}
          icon={Users}
          accent="purple"
        />
        <MetricCard
          title="Pending Reports"
          value={formatMetricDisplay(metrics.submitted_reports ?? 0)}
          icon={Clock}
          accent="blue"
        />
        <MetricCard
          title="Approved"
          value={formatMetricDisplay(metrics.approved_reports ?? 0)}
          icon={CheckCircle2}
          accent="green"
        />
        <MetricCard
          title="Rejected"
          value={formatMetricDisplay(metrics.rejected_reports ?? 0)}
          icon={XCircle}
          accent="red"
        />
      </div>

      <div className="mt-6">
        <AdminSetupChecklist setup={setup} />
      </div>

      <div className="mt-6">
        <AdminAuditFeed logs={auditLogs} />
      </div>
    </DashboardLayout>
  )
}
