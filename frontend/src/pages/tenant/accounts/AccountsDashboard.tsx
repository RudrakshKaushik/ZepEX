import { CheckCircle2, Clock, DollarSign, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAccountsDashboard } from '@/api'
import { MetricCard } from '@/components/MetricCard'
import { DashboardLayout, accountsNav } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoader } from '@/components/ui/spinner'
import type { ExpenseReport } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface AccountsDashboardData {
  accounts_user: { name: string; email: string; company: string }
  metrics: Record<string, number | string>
  pending_reports: ExpenseReport[]
  paid_reports: ExpenseReport[]
}

export function AccountsDashboard() {
  const [data, setData] = useState<AccountsDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAccountsDashboard()
      .then((res) => setData(res.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  const metrics = data?.metrics ?? {}

  return (
    <DashboardLayout
      title="Accounts Dashboard"
      subtitle={data?.accounts_user.company}
      navItems={accountsNav}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Pending"
          value={metrics.pending_reports ?? 0}
          icon={Clock}
          accent="amber"
        />
        <MetricCard
          title="Approved"
          value={metrics.approved_reports ?? 0}
          icon={CheckCircle2}
          accent="sky"
        />
        <MetricCard
          title="Paid"
          value={metrics.paid_reports ?? 0}
          icon={FileText}
          accent="emerald"
        />
        <MetricCard
          title="Paid amount"
          value={formatCurrency(String(metrics.paid_amount ?? 0))}
          icon={DollarSign}
          accent="indigo"
        />
      </div>

      <div className="mt-4">
        <Link to="/accounts/reports">
          <Button>Process pending reports</Button>
        </Link>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recently paid</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.paid_reports?.length ? (
            <div className="space-y-2">
              {data.paid_reports.slice(0, 5).map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm"
                >
                  <span>{r.employee_email}</span>
                  <span className="text-muted-foreground">{r.department_name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No paid reports yet.</p>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
