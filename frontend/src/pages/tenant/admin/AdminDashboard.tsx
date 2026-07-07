import { Building2, CheckCircle2, Clock, Mail, Users, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCompanyAdminDashboard, getCompanyAuditLogs } from '@/api'
import { AdminAuditFeed } from '@/components/admin/AdminAuditFeed'
import { AdminSetupChecklist } from '@/components/admin/AdminSetupChecklist'
import { DashboardPanel } from '@/components/dashboard/DashboardPanel'
import { MetricCard } from '@/components/MetricCard'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { DashboardPageShimmer } from '@/components/ui/shimmer'
import { useAdminNav, invalidateAdminSetupCache } from '@/hooks/useAdminNav'
import { formatMetricDisplay } from '@/lib/format'
import type { AuditLogEntry, CompanyAdminDashboardData } from '@/types'

export function AdminDashboard() {
  const { navItems } = useAdminNav()
  const [data, setData] = useState<CompanyAdminDashboardData | null>(null)
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
  const emailForwarding = data?.email_forwarding

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
          value={formatMetricDisplay(Number(metrics.total_users ?? 0))}
          icon={Users}
          accent="purple"
        />
        <MetricCard
          title="Pending Reports"
          value={formatMetricDisplay(Number(metrics.submitted_reports ?? 0))}
          icon={Clock}
          accent="blue"
        />
        <MetricCard
          title="Approved"
          value={formatMetricDisplay(Number(metrics.approved_reports ?? 0))}
          icon={CheckCircle2}
          accent="green"
        />
        <MetricCard
          title="Rejected"
          value={formatMetricDisplay(Number(metrics.rejected_reports ?? 0))}
          icon={XCircle}
          accent="red"
        />
      </div>

      <div className="mt-6">
        <AdminSetupChecklist setup={setup} />
      </div>

      {emailForwarding && (
        <div className="mt-6">
          <DashboardPanel
            title="Email forwarding"
            action={
              <Button asChild variant="outline" size="sm">
                <Link to="/admin/settings">Configure</Link>
              </Button>
            }
          >
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="font-medium text-gray-900">Company reimbursement email</p>
                  <p>{emailForwarding.company_reimbursement_email || 'Not configured'}</p>
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-900">Forward all emails to</p>
                <p>{emailForwarding.platform_receipt_email}</p>
              </div>
              <p className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-blue-900">
                {emailForwarding.forwarding_instruction}
              </p>
            </div>
          </DashboardPanel>
        </div>
      )}

      <div className="mt-6">
        <AdminAuditFeed logs={auditLogs} />
      </div>
    </DashboardLayout>
  )
}
