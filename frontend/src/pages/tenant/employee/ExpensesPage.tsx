import { AlertTriangle, FileText, Plus, Send, Trash2, Upload, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import {
  deleteLineItem,
  getCurrentMonthReport,
  submitMonthlyReport,
  uploadReceipt,
} from '@/api'
import { getApiErrorMessage } from '@/api/client'
import { StatusBadge } from '@/components/StatusBadge'
import { DashboardLayout, employeeNav, managerNav } from '@/components/layout/DashboardLayout'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PageLoader } from '@/components/ui/spinner'
import type { ExpenseReport } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

function formatUploadError(message: string) {
  if (message.includes('generativelanguage.googleapis.com') || message.includes('Gemini API')) {
    return 'Gemini API is not enabled for your API key. Create a key at Google AI Studio or enable the Generative Language API in Cloud Console, then try again.'
  }
  return message
}

export function ExpensesPage() {
  const { user } = useAuth()
  const location = useLocation()
  const isManager = user?.role === 'MANAGER'
  const navItems = isManager ? managerNav : employeeNav

  const [report, setReport] = useState<ExpenseReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const resetUploadModal = () => {
    setSelectedFiles([])
    setUploadError('')
    setDragOver(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files?.length) return
    setUploadError('')
    setSelectedFiles(Array.from(files))
  }

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
    if (fileRef.current) fileRef.current.value = ''
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getCurrentMonthReport()
      setReport(data)
    } catch {
      setReport(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleConfirmUpload = async () => {
    if (!selectedFiles.length) return
    setUploading(true)
    setUploadError('')
    setMessage('')
    try {
      const errors: string[] = []
      let successCount = 0
      for (const file of selectedFiles) {
        const { data } = await uploadReceipt(file)
        if (data.ai_result?.success) {
          successCount += 1
        } else if (data.ai_result?.pending) {
          successCount += 1
        } else if (data.ai_result?.success === false) {
          errors.push(data.ai_result.error || data.message)
        }
      }
      if (errors.length) {
        setUploadError(errors[0])
      }
      if (successCount && !errors.length) {
        setMessage('Receipt(s) uploaded and processed by AI.')
        setUploadOpen(false)
        resetUploadModal()
      } else if (successCount && errors.length) {
        setMessage(`${successCount} receipt(s) uploaded. Some AI extractions failed.`)
        resetUploadModal()
      }
      await load()
    } catch (err) {
      setUploadError(getApiErrorMessage(err))
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    setMessage('')
    try {
      await submitMonthlyReport()
      setMessage('Monthly report submitted to your manager.')
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteLineItem = async (lineItemId: string) => {
    try {
      await deleteLineItem(lineItemId)
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  const canSubmit = report && !['SUBMITTED', 'PENDING_ACCOUNTS', 'PAID'].includes(report.status)

  if (isManager && location.pathname.startsWith('/employee')) {
    return <Navigate to="/manager/expenses" replace />
  }

  if (loading) return <PageLoader />

  return (
    <DashboardLayout title="My Expenses" subtitle="Upload receipts for this month" navItems={navItems}>
      {message && (
        <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle>Receipts this month ({report?.receipts?.length ?? 0})</CardTitle>
            {report && <StatusBadge status={report.status} />}
          </div>
          <div className="flex flex-wrap gap-2">
            {canSubmit && (
              <Button
                variant="success"
                disabled={submitting || !report?.receipts?.length}
                onClick={handleSubmit}
              >
                <Send className="h-4 w-4" />
                {submitting ? 'Submitting...' : 'Submit report'}
              </Button>
            )}
            <Button
              onClick={() => {
                resetUploadModal()
                setUploadOpen(true)
              }}
            >
              <Plus className="h-4 w-4" />
              Upload receipt
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!report?.receipts?.length ? (
            <p className="text-sm text-muted-foreground">No receipts uploaded yet.</p>
          ) : (
            <div className="space-y-4">
              {report.receipts.map((receipt) => (
                <div key={receipt.id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{receipt.vendor_name || 'Processing...'}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(receipt.total_amount, receipt.currency)} ·{' '}
                        {formatDate(receipt.invoice_date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {receipt.has_any_violation && (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      )}
                      <StatusBadge status={receipt.status} />
                    </div>
                  </div>
                  {receipt.line_items.map((item) => (
                    <div
                      key={item.id}
                      className="mt-3 flex items-start justify-between gap-2 rounded-lg bg-muted/40 p-3 text-sm"
                    >
                      <div>
                        <p className="font-medium capitalize">
                          {item.category.replace(/_/g, ' ')}
                        </p>
                        <p className="text-muted-foreground line-clamp-2">{item.description}</p>
                        <p className="mt-1">
                          {formatCurrency(item.amount, receipt.currency)}
                        </p>
                      </div>
                      {canSubmit && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteLineItem(item.id)}
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
        </CardContent>
      </Card>

      <Dialog
        open={uploadOpen}
        onOpenChange={(open) => {
          setUploadOpen(open)
          if (!open) resetUploadModal()
        }}
      >
        <DialogContent className="flex max-h-[min(90vh,640px)] w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden p-6">
          <DialogHeader className="shrink-0">
            <DialogTitle>Upload receipt</DialogTitle>
            <DialogDescription>
              Choose an image or PDF, then click Upload. AI will extract vendor, amount, and line
              items.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 min-w-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden pr-1">
            <div
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                dragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-accent/30'
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
              <ul className="space-y-2 rounded-lg border bg-muted/20 p-3">
                {selectedFiles.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="flex items-center gap-2 text-sm"
                  >
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate" title={file.name}>
                      {file.name}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(0)} KB
                    </span>
                    <button
                      type="button"
                      className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      onClick={() => removeSelectedFile(index)}
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {uploadError && (
              <div className="min-w-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <p className="font-medium">Upload failed</p>
                <p className="mt-1 text-xs leading-relaxed break-words">
                  {formatUploadError(uploadError)}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="mt-2 shrink-0 flex-col gap-2 border-t border-border pt-4 sm:flex-col">
            <div className="flex w-full gap-2 justify-end">
              <Button
                type="button"
                className="w-full"
                variant="outline"
                onClick={() => setUploadOpen(false)}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="w-full"
                variant="outline"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                Choose files
              </Button>
              {selectedFiles.length > 0 && (
              <Button
                className="w-full"
                disabled={uploading || selectedFiles.length === 0}
                onClick={handleConfirmUpload}
              >
              {uploading
                ? 'Uploading...'
                : `Upload${selectedFiles.length > 1 ? ` (${selectedFiles.length})` : ''}`}
            </Button>
            )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
