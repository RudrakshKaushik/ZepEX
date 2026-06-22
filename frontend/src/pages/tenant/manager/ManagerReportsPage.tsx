import { Check, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  getManagerPendingReports,
  managerApproveReport,
  managerRejectReport,
} from '@/api'
import { getApiErrorMessage } from '@/api/client'
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState'
import { DashboardPanel } from '@/components/dashboard/DashboardPanel'
import { ReportDetail } from '@/components/ReportDetail'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { PageLoader } from '@/components/ui/spinner'
import { useAuth } from '@/context/AuthContext'
import { buildManagerNav } from '@/lib/rolePermissions'
import type { ExpenseReport } from '@/types'

export function ManagerReportsPage() {
  const { user } = useAuth()
  const navItems = buildManagerNav(user)
  const [reports, setReports] = useState<ExpenseReport[]>([])
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [actionId, setActionId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getManagerPendingReports()
      setReports(data.results)
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
    const reason = notes[reportId]?.trim()
    if (!reason) {
      setError('Rejection reason is required.')
      return
    }
    setActionId(reportId)
    setError('')
    try {
      await managerRejectReport(reportId, reason)
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
      breadcrumb="Pending Reports"
      navItems={navItems}
    >
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {reports.length === 0 ? (
        <DashboardPanel title="Pending Employee Reports">
          <DashboardEmptyState
            image="folder"
            title="No Pending Reports"
            description="When employees submit expense reports, they will appear here for your review."
            onRefresh={load}
          />
        </DashboardPanel>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardContent className="space-y-4 p-5 sm:p-6">
                <p className="font-semibold text-gray-900">{report.employee_email}</p>
                <ReportDetail report={report} />
                <Textarea
                  placeholder="Notes (required for rejection)"
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
