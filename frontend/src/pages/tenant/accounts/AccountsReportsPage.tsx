import { Banknote, Check, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  accountsApproveReport,
  accountsMarkPaid,
  accountsRejectReport,
  getAccountsPendingReports,
} from '@/api'
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
      const { data } = await getAccountsPendingReports()
      setReports(data.reports)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const runAction = async (
    reportId: string,
    action: 'approve' | 'reject' | 'paid',
  ) => {
    setActionId(reportId)
    setError('')
    const note = notes[reportId] || ''
    try {
      if (action === 'approve') {
        await accountsApproveReport(reportId, note || 'Verified by accounts department')
      } else if (action === 'reject') {
        await accountsRejectReport(reportId, note || 'Receipt verification failed.')
      } else {
        await accountsMarkPaid(reportId, note || 'Payment completed successfully')
      }
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
      title="Pending Reports"
      subtitle="Verify, approve, and mark reimbursements as paid"
      navItems={accountsNav}
    >
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No reports pending accounts review.
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
                {report.manager_notes && (
                  <p className="rounded-lg bg-muted/60 p-3 text-sm">
                    <strong>Manager notes:</strong> {report.manager_notes}
                  </p>
                )}
                <Textarea
                  placeholder="Accounts notes"
                  value={notes[report.id] || ''}
                  onChange={(e) =>
                    setNotes({ ...notes, [report.id]: e.target.value })
                  }
                />
                <div className="flex flex-wrap gap-2">
                  {report.status === 'PENDING_ACCOUNTS' && (
                    <>
                      <Button
                        variant="success"
                        disabled={actionId === report.id}
                        onClick={() => runAction(report.id, 'approve')}
                      >
                        <Check className="h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        disabled={actionId === report.id}
                        onClick={() => runAction(report.id, 'reject')}
                      >
                        <X className="h-4 w-4" />
                        Reject
                      </Button>
                    </>
                  )}
                  {report.status === 'ACCOUNTS_APPROVED' && (
                    <Button
                      disabled={actionId === report.id}
                      onClick={() => runAction(report.id, 'paid')}
                    >
                      <Banknote className="h-4 w-4" />
                      Mark as paid
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
