import { Building2, CheckCircle2, FileText, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getCompanyAdminDashboard } from '@/api'
import { MetricCard } from '@/components/MetricCard'
import { DashboardLayout, adminNav } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoader } from '@/components/ui/spinner'

interface AdminDashboardData {
  company_admin: { name: string; email: string; company: string }
  setup_status: Record<string, boolean>
  metrics: Record<string, number>
}

export function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCompanyAdminDashboard()
      .then((res) => setData(res.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  const metrics = data?.metrics ?? {}
  const setup = data?.setup_status ?? {}

  return (
    <DashboardLayout
      title="Company Admin"
      subtitle={data?.company_admin.company}
      navItems={adminNav}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Departments" value={metrics.total_departments ?? 0} icon={Building2} />
        <MetricCard title="Total users" value={metrics.total_users ?? 0} icon={Users} accent="sky" />
        <MetricCard
          title="Pending (manager)"
          value={metrics.pending_manager_reports ?? 0}
          icon={FileText}
          accent="amber"
        />
        <MetricCard
          title="Paid reports"
          value={metrics.paid_reports ?? 0}
          icon={FileText}
          accent="emerald"
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Setup checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(setup).map(([key, done]) => (
              <div
                key={key}
                className="flex items-center gap-3 rounded-lg border px-4 py-3 text-sm"
              >
                <CheckCircle2
                  className={`h-5 w-5 ${done ? 'text-emerald-500' : 'text-slate-300'}`}
                />
                <span className="capitalize">{key.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
