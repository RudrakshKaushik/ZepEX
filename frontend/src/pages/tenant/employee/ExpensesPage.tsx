import { AlertTriangle, FileText, Send, Trash2, Upload, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import {
  deleteLineItem,
  getCurrentMonthReport,
  getMyUploadedExpenses,
  submitMonthlyReport,
  uploadReceipt,
} from '@/api'
import { getApiErrorMessage } from '@/api/client'
import { StatusBadge } from '@/components/StatusBadge'
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState'
import { DashboardPanel } from '@/components/dashboard/DashboardPanel'
import { ExpenseReportTable } from '@/components/reports/ExpenseReportTable'
import { ReportFiltersBar } from '@/components/reports/ReportFiltersBar'
import { ReportDetail } from '@/components/ReportDetail'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuth } from '@/context/AuthContext'
import { defaultHomeForUser } from '@/lib/auth'
import {
  canManageOwnExpenses,
  canSubmitExpense,
  canUploadReceipt,
  expensePathForUser,
  navItemsForUser,
} from '@/lib/rolePermissions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TableShimmer } from '@/components/ui/shimmer'
import type { ExpenseReport } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { formatReceiptAmountDisplay, receiptExchangeRateHint } from '@/lib/receiptDisplay'
import { fireImportConfetti } from '@/lib/confetti'
import { normalizeCurrentMonthReport } from '@/lib/expenseReport'
import {
  hasEmployeeExpenseFilters,
  toEmployeeExpenseApiParams,
  type EmployeeExpenseFilters,
} from '@/lib/reportFilters'
import { toast } from '@/lib/toast'
import UploadIcon from '@/assets/Upload.png'

function formatUploadError(message: string) {
  if (message.includes('company role is not assigned')) {
    return 'Your account has no company role assigned. Ask your company admin to open Employees → Assign default roles, or edit your user and set a company role.'
  }
  if (message.includes('not allowed to upload receipts')) {
    return 'Your company role does not allow receipt uploads. Ask your admin to assign a role with upload permission (e.g. Employee).'
  }
  if (message.includes('generativelanguage.googleapis.com') || message.includes('Gemini API')) {
    return 'Gemini API is not enabled for your API key. Create a key at Google AI Studio or enable the Generative Language API in Cloud Console, then try again.'
  }
  return message
}

function MyExpenseExpandedPanel({
  report,
  canEditReceipts,
  onDeleteLineItem,
}: {
  report: ExpenseReport
  canEditReceipts: boolean
  onDeleteLineItem: (lineItemId: string) => void
}) {
  return (
    <div className="space-y-4">
      <ReportDetail report={report} showEmployee={false} />
      {!report.receipts.length ? (
        <p className="text-sm text-muted-foreground">No receipts uploaded yet.</p>
      ) : (
        <div className="space-y-4">
          {report.receipts.map((receipt) => (
            <div key={receipt.id} className="rounded-xl border bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{receipt.vendor_name || 'Processing...'}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatReceiptAmountDisplay(receipt)} · {formatDate(receipt.invoice_date)}
                  </p>
                  {receiptExchangeRateHint(receipt) && (
                    <p className="text-xs text-muted-foreground">
                      {receiptExchangeRateHint(receipt)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {receipt.has_any_violation && (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                  <StatusBadge status={receipt.status} />
                </div>
              </div>
              {receipt.has_any_violation && receipt.policy_violation_reason && (
                <p className="mt-2 text-sm text-amber-700">{receipt.policy_violation_reason}</p>
              )}
              {receipt.line_items.map((item) => (
                <div
                  key={item.id}
                  className="mt-3 flex items-start justify-between gap-2 rounded-lg bg-muted/40 p-3 text-sm"
                >
                  <div>
                    <p className="font-medium capitalize">
                      {item.category.replace(/_/g, ' ')}
                    </p>
                    <p className="line-clamp-2 text-muted-foreground">{item.description}</p>
                    {item.is_violating && item.violation_reason && (
                      <p className="mt-1 text-xs text-amber-700">{item.violation_reason}</p>
                    )}
                    <p className="mt-1">{formatCurrency(item.amount, receipt.currency)}</p>
                  </div>
                  {canEditReceipts && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDeleteLineItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function ExpensesPage() {
  const { user } = useAuth()
  const location = useLocation()
  const navItems = navItemsForUser(user)
  const allowUpload = canUploadReceipt(user)
  const allowSubmit = canSubmitExpense(user)
  const expensePath = expensePathForUser(user)

  const [reports, setReports] = useState<ExpenseReport[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [draftFilters, setDraftFilters] = useState<EmployeeExpenseFilters>({})
  const [appliedFilters, setAppliedFilters] = useState<EmployeeExpenseFilters>({})
  const fileRef = useRef<HTMLInputElement>(null)

  const filtersActive = hasEmployeeExpenseFilters(appliedFilters)

  const resetUploadModal = () => {
    setSelectedFiles([])
    setDragOver(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files?.length) return
    setSelectedFiles(Array.from(files))
  }

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
    if (fileRef.current) fileRef.current.value = ''
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (filtersActive) {
        const { data } = await getMyUploadedExpenses(toEmployeeExpenseApiParams(appliedFilters))
        setReports(
          data.results.map((report) => ({
            ...report,
            employee_email: report.employee_email || user?.email || '',
          })),
        )
        return
      }

      const { data } = await getCurrentMonthReport()
      const current = normalizeCurrentMonthReport(data)
      setReports(
        current?.id
          ? [
              {
                ...current,
                employee_email: current.employee_email || user?.email || '',
              },
            ]
          : [],
      )
    } catch {
      setReports([])
    } finally {
      setLoading(false)
    }
  }, [appliedFilters, filtersActive, user?.email])

  useEffect(() => {
    load()
  }, [load])

  const handleConfirmUpload = async () => {
    if (!selectedFiles.length) return
    setUploading(true)
    try {
      const errors: string[] = []
      const violationMessages: string[] = []
      let successCount = 0
      const conversionMessages: string[] = []
      for (const file of selectedFiles) {
        const { data } = await uploadReceipt(file)
        const aiFailed = data.ai_result?.success === false && !data.ai_result?.pending
        if (aiFailed) {
          errors.push(data.ai_result?.error || data.message)
        } else {
          successCount += 1
        }
        const conversion = data.ai_result?.currency_conversion
        if (conversion?.success && conversion.company_amount != null && conversion.company_currency) {
          const original = data.receipt.original_amount ?? data.receipt.total_amount
          const originalCurrency =
            data.receipt.original_currency ?? data.receipt.currency
          conversionMessages.push(
            `${formatCurrency(original, originalCurrency)} → ${formatCurrency(String(conversion.company_amount), conversion.company_currency)}`,
          )
        }
        const violationReason =
          data.ai_result?.violation_reason ||
          data.receipt?.policy_violation_reason ||
          data.ai_result?.policy?.violations?.join('; ')
        if (data.receipt?.has_any_violation || data.ai_result?.has_any_violation) {
          violationMessages.push(violationReason || 'Policy violation detected on uploaded receipt.')
        }
      }
      if (errors.length) {
        toast.error(formatUploadError(errors[0]))
      }
      if (violationMessages.length) {
        toast(violationMessages[0])
      }
      if (conversionMessages.length) {
        toast(`Converted: ${conversionMessages[0]}`)
      }
      if (successCount && !errors.length) {
        toast.success(
          violationMessages.length
            ? 'Receipt(s) uploaded with policy violations flagged.'
            : 'Receipt(s) uploaded and processed by AI.',
        )
        setUploadOpen(false)
        resetUploadModal()
      } else if (successCount && errors.length) {
        toast.success(`${successCount} receipt(s) uploaded. Some AI extractions failed.`)
        setUploadOpen(false)
        resetUploadModal()
      }
      await load()
    } catch (err) {
      toast.error(formatUploadError(getApiErrorMessage(err)))
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const { data } = await submitMonthlyReport()
      if (data.auto_approved) {
        fireImportConfetti()
        toast.success(data.message || 'Monthly report approved automatically.')
        if (data.next_action) {
          toast(data.next_action)
        }
      } else {
        toast.success(data.message || 'Monthly report submitted for approval.')
      }
      await load()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteLineItem = async (lineItemId: string) => {
    try {
      await deleteLineItem(lineItemId)
      await load()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  if (!canManageOwnExpenses(user)) {
    return <Navigate to={defaultHomeForUser(user!)} replace />
  }

  if (location.pathname !== expensePath) {
    return <Navigate to={expensePath} replace />
  }

  if (loading) {
    return (
      <DashboardLayout title="My Expenses" subtitle="Upload receipts for this month" navItems={navItems}>
        <TableShimmer rows={3} />
      </DashboardLayout>
    )
  }

  const displayReports = reports
  const draftReport = displayReports.find((report) => report.status === 'DRAFT')
  const canSubmitDraft =
    allowSubmit &&
    !!draftReport &&
    (draftReport.receipts?.length ?? 0) > 0 &&
    !filtersActive

  return (
    <DashboardLayout title="My Expenses" subtitle="Upload receipts for this month" navItems={navItems}>
      <ReportFiltersBar
        mode="employee"
        values={draftFilters}
        onChange={setDraftFilters}
        onApply={() => setAppliedFilters(draftFilters)}
        onClear={() => {
          setDraftFilters({})
          setAppliedFilters({})
        }}
        disabled={uploading || submitting}
      />

      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
        {canSubmitDraft && (
          <Button variant="success" disabled={submitting} onClick={handleSubmit}>
            <Send className="h-4 w-4" />
            {submitting ? 'Submitting...' : 'Submit report'}
          </Button>
        )}
        {allowUpload && (
          <Button
            onClick={() => {
              resetUploadModal()
              setUploadOpen(true)
            }}
          >
            Upload receipt
            <img src={UploadIcon} alt="Upload" className="w-6 h-6" />
          </Button>
        )}
      </div>

      {!displayReports.length ? (
        <DashboardPanel title="My expenses">
          <DashboardEmptyState
            image="folder"
            title={filtersActive ? 'No matching reports' : 'No expense report yet'}
            description={
              filtersActive
                ? 'Try adjusting your filters or clear them to view the current month report.'
                : 'Upload a receipt to start your monthly expense report.'
            }
            action={
              !filtersActive && allowUpload ? (
                <Button
                  onClick={() => {
                    resetUploadModal()
                    setUploadOpen(true)
                  }}
                >
                  Upload receipt
                  <img src={UploadIcon} alt="Upload" className="w-6 h-6" />
                </Button>
              ) : undefined
            }
          />
        </DashboardPanel>
      ) : (
        <ExpenseReportTable
          reports={displayReports}
          renderExpanded={(expandedReport) => {
            const isDraftReport = expandedReport.status === 'DRAFT'
            const canEditReceipts = allowSubmit && isDraftReport

            return (
              <MyExpenseExpandedPanel
                report={expandedReport}
                canEditReceipts={canEditReceipts}
                onDeleteLineItem={handleDeleteLineItem}
              />
            )
          }}
        />
      )}

      <Dialog
        open={uploadOpen}
        onOpenChange={(open) => {
          setUploadOpen(open)
          if (!open) resetUploadModal()
        }}
      >
        <DialogContent className="flex max-h-[min(90vh,640px)] w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden p-6 sm:max-w-lg">
          <DialogHeader className="shrink-0">
            <DialogTitle>Upload Receipt</DialogTitle>
          </DialogHeader>

          <div className="min-h-0 min-w-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden pr-1">
            <div
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                dragOver
                  ? 'border-primary bg-blue-50'
                  : 'border-gray-300 bg-gray-50 hover:border-primary/50'
              }`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(false)
                handleFileSelect(e.dataTransfer.files)
              }}
              onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
              role="button"
              tabIndex={0}
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">Click or drag files here</p>
              <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, or PDF</p>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf"
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />

            {selectedFiles.length > 0 && (
              <ul className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <li key={`${file.name}-${index}`} className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 shrink-0 text-red-500" />
                    <span className="min-w-0 flex-1 truncate text-gray-700" title={file.name}>
                      {file.name}
                    </span>
                    <button
                      type="button"
                      className="shrink-0 rounded p-0.5 text-red-500 hover:bg-red-50"
                      onClick={() => removeSelectedFile(index)}
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <DialogFooter className="mt-2 shrink-0 gap-2 border-t border-gray-100 pt-4 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setUploadOpen(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={uploading || selectedFiles.length === 0}
              onClick={handleConfirmUpload}
            >
              {uploading
                ? 'Uploading...'
                : `Upload${selectedFiles.length > 1 ? ` (${selectedFiles.length})` : ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
