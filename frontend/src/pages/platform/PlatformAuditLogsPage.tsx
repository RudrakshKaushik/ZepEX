import { ScrollText } from 'lucide-react'
import { DashboardLayout, platformNavWithAudit } from '@/components/layout/DashboardLayout'
import { AdminListPanel } from '@/components/admin/AdminListPanel'

export function PlatformAuditLogsPage() {
  return (
    <DashboardLayout
      portal="platform"
      title="Audit Logs"
      subtitle="Platform activity monitoring"
      breadcrumb="Audit Logs"
      icon={ScrollText}
      navItems={platformNavWithAudit}
    >
      <AdminListPanel
        title="Platform Audit Trail"
        description="Detailed audit trails are recorded per company and viewed by company administrators."
      >
        <div className="px-5 py-8 sm:px-6">
          <p className="text-sm text-gray-600">
            Platform owners can monitor company onboarding and expense metrics from the dashboard.
            Company-specific audit logs become available to each company admin once their setup
            checklist is fully complete.
          </p>
        </div>
      </AdminListPanel>
    </DashboardLayout>
  )
}
