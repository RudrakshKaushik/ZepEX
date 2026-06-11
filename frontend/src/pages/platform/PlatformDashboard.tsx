import { Building2, ClipboardList, FileText, ScrollText } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPlatformDashboard } from '@/api'
import { MetricCard } from '@/components/MetricCard'
import { StatusBadge } from '@/components/StatusBadge'
import { DashboardLayout, platformNav } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoader } from '@/components/ui/spinner'
import { formatDate } from '@/lib/utils'

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

  if (loading) return <PageLoader />

  const metrics = data?.metrics ?? {}

  return (
    <DashboardLayout
      portal="platform"
      title="Platform Dashboard"
      subtitle={`Welcome, ${data?.platform_owner.email}`}
      navItems={[
        ...platformNav,
        { label: 'Audit Logs', to: '/platform/audit-logs', icon: ScrollText },
      ]}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total companies"
          value={metrics.total_companies ?? 0}
          icon={Building2}
          accent="indigo"
        />
        <MetricCard
          title="Pending requests"
          value={metrics.pending_company_requests ?? 0}
          icon={ClipboardList}
          accent="amber"
        />
        <MetricCard
          title="Total reports"
          value={metrics.total_reports ?? 0}
          icon={FileText}
          accent="sky"
        />
        <MetricCard
          title="Paid reports"
          value={metrics.paid_reports ?? 0}
          icon={FileText}
          accent="emerald"
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/platform/requests">
          <Button>Review company requests</Button>
        </Link>
        <Link to="/platform/audit-logs">
          <Button variant="outline">View audit logs</Button>
        </Link>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent companies</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.recent_companies?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="pb-3 font-medium">Company</th>
                    <th className="pb-3 font-medium">Domain</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_companies.map((company) => (
                    <tr key={company.id} className="border-t">
                      <td className="py-3 font-medium">{company.name}</td>
                      <td className="py-3">{company.domain}</td>
                      <td className="py-3">
                        <StatusBadge status={company.is_verified ? 'APPROVED' : 'PENDING'} />
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {formatDate(company.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No companies yet.</p>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
