import { CheckCircle2, Clock, FileText, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { getEmployeeDashboard } from '@/api'
import { MetricCard } from '@/components/MetricCard'
import { ReportDetail } from '@/components/ReportDetail'
import { StatusBadge } from '@/components/StatusBadge'
import { DashboardLayout, employeeNav } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoader } from '@/components/ui/spinner'
import type { ExpenseReport } from '@/types'

interface EmployeeDashboardData {
  user: { name: string; email: string; role: string; company: string; department: string }
  metrics: {
    total_reports: number
    pending_reports: number
    paid_reports: number
    rejected_reports: number
  }
  current_month_report: { report: ExpenseReport; summary: Record<string, string | number> } | null
  submitted_reports: ExpenseReport[]
}

export function EmployeeDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState<EmployeeDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role === 'MANAGER') return
    getEmployeeDashboard()
      .then((res) => setData(res.data))
      .finally(() => setLoading(false))
  }, [user?.role])

  if (user?.role === 'MANAGER') {
    return <Navigate to="/manager" replace />
  }

  if (loading) return <PageLoader />

  const metrics = data?.metrics

  return (
    <DashboardLayout
      title="My Dashboard"
      subtitle={`${data?.user.company} · ${data?.user.department}`}
      navItems={employeeNav}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total reports" value={metrics?.total_reports ?? 0} icon={FileText} />
        <MetricCard
          title="Pending"
          value={metrics?.pending_reports ?? 0}
          icon={Clock}
          accent="amber"
        />
        <MetricCard
          title="Paid"
          value={metrics?.paid_reports ?? 0}
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
        <Link to="/employee/expenses">
          <Button>Upload receipts & submit report</Button>
        </Link>
      </div>

      {data?.current_month_report?.report && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Current month report</CardTitle>
              <StatusBadge status={data.current_month_report.report.status} />
            </div>
          </CardHeader>
          <CardContent>
            <ReportDetail report={data.current_month_report.report} showEmployee={false} />
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  )
}
