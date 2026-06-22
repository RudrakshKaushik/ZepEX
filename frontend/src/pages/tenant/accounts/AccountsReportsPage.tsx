import { Banknote } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { accountsMarkPaid } from '@/api'
import { getApiErrorMessage } from '@/api/client'
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState'
import { DashboardPanel } from '@/components/dashboard/DashboardPanel'
import { ReportDetail } from '@/components/ReportDetail'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { PageLoader } from '@/components/ui/spinner'
import { useAuth } from '@/context/AuthContext'
import { buildAccountsNav } from '@/lib/rolePermissions'
import { loadApprovedReportsForPayment } from '@/lib/accountsReports'
import type { ExpenseReport } from '@/types'

export function AccountsReportsPage() {
  const { user } = useAuth()
  const navItems = buildAccountsNav(user)
  const [reports, setReports] = useState<ExpenseReport[]>([])
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [actionId, setActionId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { approvedReports } = await loadApprovedReportsForPayment()
      setReports(approvedReports)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleMarkPaid = async (reportId: string) => {
    setActionId(reportId)
    setError('')
    const note = notes[reportId] || ''
    try {
      await accountsMarkPaid(reportId, note || 'Payment completed successfully')
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setActionId(null)
    }
  }

  if (loading) return <PageLoader />

  return (
    <DashboardLayout
      title="Approved Reports"
      subtitle="Mark manager-approved reimbursements as paid"
      breadcrumb="Approved Reports"
      navItems={navItems}
    >
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {reports.length === 0 ? (
        <DashboardPanel title="Approved Reports">
          <DashboardEmptyState
            image="folder"
            title="No approved reports awaiting payment"
            description="Reports appear here after a manager approves them. For Manager → Accounts flow, keep only the manager as the workflow approval step so reports reach approved status before payment."
            onRefresh={load}
          />
        </DashboardPanel>
      ) : (
        <div className="space-y-6">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <CardTitle>
                  {report.employee_email} · {report.department_name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ReportDetail report={report} />
                <Textarea
                  placeholder="Payment notes (optional)"
                  value={notes[report.id] || ''}
                  onChange={(e) =>
                    setNotes({ ...notes, [report.id]: e.target.value })
                  }
                />
                <Button
                  disabled={actionId === report.id}
                  onClick={() => handleMarkPaid(report.id)}
                >
                  <Banknote className="h-4 w-4" />
                  Mark as paid
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
