import { Banknote } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { accountsMarkPaid, getPaymentDashboard } from '@/api'
import { getApiErrorMessage } from '@/api/client'
import { ReportDetail } from '@/components/ReportDetail'
import { DashboardLayout, accountsNav } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { PageLoader } from '@/components/ui/spinner'
import type { ExpenseReport } from '@/types'

export function AccountsReportsPage() {
  const [reports, setReports] = useState<ExpenseReport[]>([])
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [actionId, setActionId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getPaymentDashboard()
      const approved = (data.approved_reports ?? []).filter(
        (report: ExpenseReport) => report.status === 'APPROVED',
      )
      setReports(approved)
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
      subtitle="Mark approved reimbursements as paid"
      navItems={accountsNav}
    >
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No approved reports awaiting payment.
          </CardContent>
        </Card>
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
