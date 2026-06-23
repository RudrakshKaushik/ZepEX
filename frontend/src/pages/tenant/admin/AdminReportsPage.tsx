import { Banknote, Check, ClipboardList, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  accountsMarkPaid,
  approveReport,
  getAdminReports,
  rejectReport,
} from '@/api'
import { getApiErrorMessage } from '@/api/client'
import { AdminListPanel } from '@/components/admin/AdminListPanel'
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState'
import { ReportDetail } from '@/components/ReportDetail'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PaginationControls } from '@/components/ui/pagination-controls'
import { Textarea } from '@/components/ui/textarea'
import { PageLoader } from '@/components/ui/spinner'
import { useAdminNav } from '@/hooks/useAdminNav'
import { showReportActionToast } from '@/lib/reportActions'
import { toast } from '@/lib/toast'
import type { ExpenseReport } from '@/types'

const STATUS_TABS = [
  { label: 'Pending', value: 'SUBMITTED' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Paid', value: 'PAID' },
] as const

export function AdminReportsPage() {
  const { navItems } = useAdminNav()
  const [reports, setReports] = useState<ExpenseReport[]>([])
  const [status, setStatus] = useState<string>('SUBMITTED')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [actionId, setActionId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await getAdminReports({ status, page })
      setReports(data.results)
      setTotalPages(data.total_pages)
      setTotalCount(data.count)
    } catch (err) {
      setError(getApiErrorMessage(err))
      setReports([])
    } finally {
      setLoading(false)
    }
  }, [page, status])

  useEffect(() => {
    load()
  }, [load])

  const handleApprove = async (reportId: string) => {
    setActionId(reportId)
    setError('')
    try {
      const { data } = await approveReport(reportId, notes[reportId] || 'Approved by company admin.')
      showReportActionToast(data)
      await load()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setActionId(null)
    }
  }

  const handleReject = async (reportId: string) => {
    const reason = notes[reportId]?.trim()
    if (!reason) {
      toast.error('Rejection reason is required.')
      return
    }
    setActionId(reportId)
    setError('')
    try {
      const { data } = await rejectReport(reportId, reason)
      showReportActionToast(data)
      await load()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setActionId(null)
    }
  }

  const handleMarkPaid = async (reportId: string) => {
    setActionId(reportId)
    setError('')
    try {
      const { data } = await accountsMarkPaid(
        reportId,
        notes[reportId] || 'Paid by company admin.',
      )
      showReportActionToast(data)
      await load()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setActionId(null)
    }
  }

  if (loading && reports.length === 0) return <PageLoader />

  return (
    <DashboardLayout
      title="Company Reports"
      subtitle="Monitor and act on expense reports across your company"
      breadcrumb="Reports"
      icon={ClipboardList}
      navItems={navItems}
    >
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <Button
            key={tab.value}
            size="sm"
            variant={status === tab.value ? 'default' : 'outline'}
            onClick={() => {
              setStatus(tab.value)
              setPage(1)
            }}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <AdminListPanel
        title={`${STATUS_TABS.find((tab) => tab.value === status)?.label ?? 'Reports'}`}
        count={totalCount}
        description="Company admins can approve, reject, or mark reports as paid on any workflow step."
      >
        {reports.length === 0 ? (
          <DashboardEmptyState
            image="folder"
            title="No reports in this view"
            description="Try another status filter or check back when employees submit expenses."
            onRefresh={load}
          />
        ) : (
          <div className="space-y-4 p-4 sm:p-6">
            {reports.map((report) => (
              <Card key={report.id}>
                <CardContent className="space-y-4 p-5 sm:p-6">
                  <p className="font-semibold text-gray-900">
                    {report.employee_name || report.employee_email}
                  </p>
                  <ReportDetail report={report} showEmployee={false} />
                  {(status === 'SUBMITTED' || status === 'APPROVED') && (
                    <>
                      <Textarea
                        placeholder={
                          status === 'SUBMITTED'
                            ? 'Notes (required for rejection)'
                            : 'Payment notes (optional)'
                        }
                        value={notes[report.id] || ''}
                        onChange={(e) =>
                          setNotes({ ...notes, [report.id]: e.target.value })
                        }
                      />
                      <div className="flex flex-wrap gap-2">
                        {status === 'SUBMITTED' && (
                          <>
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
                          </>
                        )}
                        {status === 'APPROVED' && (
                          <Button
                            disabled={actionId === report.id}
                            onClick={() => handleMarkPaid(report.id)}
                          >
                            <Banknote className="h-4 w-4" />
                            Mark as paid
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={setPage}
          disabled={actionId !== null}
        />
      </AdminListPanel>
    </DashboardLayout>
  )
}
