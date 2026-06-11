import { CheckCircle2, Clock, FileText, Users, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getManagerDashboard } from '@/api'
import { MetricCard } from '@/components/MetricCard'
import { DashboardLayout, managerNav } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoader } from '@/components/ui/spinner'
import type { ExpenseReport } from '@/types'

interface ManagerDashboardData {
  manager: { name: string; email: string; company: string; department: string }
  metrics: {
    team_members: number
    pending_reports: number
    approved_reports: number
    rejected_reports: number
    violation_reports: number
  }
  pending_employee_reports: ExpenseReport[]
}

export function ManagerDashboard() {
  const [data, setData] = useState<ManagerDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getManagerDashboard()
      .then((res) => setData(res.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  const metrics = data?.metrics

  return (
    <DashboardLayout
      title="Manager Dashboard"
      subtitle={`${data?.manager.department} · ${data?.manager.company}`}
      navItems={managerNav}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Team members" value={metrics?.team_members ?? 0} icon={Users} />
        <MetricCard
          title="Pending reports"
          value={metrics?.pending_reports ?? 0}
          icon={Clock}
          accent="amber"
        />
        <MetricCard
          title="Approved"
          value={metrics?.approved_reports ?? 0}
          icon={CheckCircle2}
          accent="emerald"
        />
        <MetricCard
          title="Rejected"
          value={metrics?.rejected_reports ?? 0}
          icon={XCircle}
          accent="rose"
        />
      </div>

      <div className="mt-4">
        <Link to="/manager/reports">
          <Button>
            <FileText className="h-4 w-4" />
            Review pending reports
          </Button>
        </Link>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Pending employee reports</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.pending_employee_reports?.length ? (
            <div className="space-y-2">
              {data.pending_employee_reports.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm"
                >
                  <span>{r.employee_email}</span>
                  <span className="text-muted-foreground">{r.receipts.length} receipts</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No pending reports.</p>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
