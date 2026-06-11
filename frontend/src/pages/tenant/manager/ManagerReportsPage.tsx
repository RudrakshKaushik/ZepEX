import { Check, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  getManagerPendingReports,
  managerApproveReport,
  managerRejectReport,
} from '@/api'
import { getApiErrorMessage } from '@/api/client'
import { ReportDetail } from '@/components/ReportDetail'
import { DashboardLayout, managerNav } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { PageLoader } from '@/components/ui/spinner'
import type { ExpenseReport } from '@/types'

export function ManagerReportsPage() {
  const [reports, setReports] = useState<ExpenseReport[]>([])
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [actionId, setActionId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getManagerPendingReports()
      setReports(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleApprove = async (reportId: string) => {
    setActionId(reportId)
    setError('')
    try {
      await managerApproveReport(reportId, notes[reportId] || 'Approved by manager')
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setActionId(null)
    }
  }

  const handleReject = async (reportId: string) => {
    setActionId(reportId)
    setError('')
    try {
      await managerRejectReport(
        reportId,
        notes[reportId] || 'Receipt amount exceeds limit',
      )
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
      subtitle="Review and approve employee expense reports"
      navItems={managerNav}
    >
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No reports awaiting your approval.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <CardTitle>{report.employee_email}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ReportDetail report={report} />
                <Textarea
                  placeholder="Notes (optional)"
                  value={notes[report.id] || ''}
                  onChange={(e) =>
                    setNotes({ ...notes, [report.id]: e.target.value })
                  }
                />
                <div className="flex gap-2">
                  <Button
                    variant="success"
                    disabled={actionId === report.id}
                    onClick={() => handleApprove(report.id)}
                  >
                    <Check className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={actionId === report.id}
                    onClick={() => handleReject(report.id)}
                  >
                    <X className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
