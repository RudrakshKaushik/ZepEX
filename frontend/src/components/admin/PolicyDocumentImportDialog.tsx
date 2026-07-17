import { AlertTriangle, FileUp, RefreshCcw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  PolicyDocumentConfirmImportResponse,
  PolicyDocumentImportStatus,
} from '@/types'
import {
  confirmPolicyDocumentImport,
  getPolicyDocumentPreview,
  revalidatePolicyDocumentPreview,
  updatePolicyDocumentPreview,
  uploadPolicyDocument,
} from '@/api'
import { getApiErrorMessage } from '@/api/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/lib/toast'
import { cn, formatCurrency } from '@/lib/utils'

type Stage = 'upload' | 'preview' | 'complete' | 'error'

const defaultConfirmState = {
  overwrite_existing: false,
  allow_review_required: false,
}

function formatStatusChip(status: PolicyDocumentImportStatus) {
  const normalized = status.trim().toUpperCase() as PolicyDocumentImportStatus
  if (normalized === 'FAILED') return { label: 'Failed', variant: 'bg-red-50 text-red-800' }
  if (normalized === 'REVIEW_REQUIRED') {
    return { label: 'Review required', variant: 'bg-amber-50 text-amber-900' }
  }
  if (normalized === 'IMPORTED') return { label: 'Imported', variant: 'bg-green-50 text-green-800' }
  if (normalized === 'PROCESSING') return { label: 'Processing', variant: 'bg-blue-50 text-blue-800' }
  return { label: 'Uploaded', variant: 'bg-gray-50 text-gray-800' }
}

export function PolicyDocumentImportDialog({
  open,
  onOpenChange,
  reviewImportId,
  onUploadQueued,
  onImported,
  disabled,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  reviewImportId?: string | null
  onUploadQueued?: (importId: string, filename: string) => void
  onImported?: () => void
  disabled?: boolean
}) {
  const [stage, setStage] = useState<Stage>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [loadingPreview, setLoadingPreview] = useState(false)

  const [importId, setImportId] = useState<string>('')
  const [importStatus, setImportStatus] = useState<PolicyDocumentImportStatus>('UPLOADED')
  const [errorMessage, setErrorMessage] = useState('')

  const [policyName, setPolicyName] = useState('')
  const [policyVersion, setPolicyVersion] = useState('')
  const [policyCurrency, setPolicyCurrency] = useState('USD')
  const [documentSummary, setDocumentSummary] = useState('')

  const [rules, setRules] = useState<unknown[]>([])
  const [syncRuleCurrency, setSyncRuleCurrency] = useState(true)

  const [isValidForImport, setIsValidForImport] = useState(false)
  const [validationErrorCount, setValidationErrorCount] = useState(0)
  const [warningCount, setWarningCount] = useState(0)
  const [conflictCount, setConflictCount] = useState(0)
  const [revalidating, setRevalidating] = useState(false)
  const [updatingPreview, setUpdatingPreview] = useState(false)
  const [importing, setImporting] = useState(false)

  const [confirmOptions, setConfirmOptions] = useState(defaultConfirmState)
  const [confirmResult, setConfirmResult] = useState<PolicyDocumentConfirmImportResponse | null>(null)

  const statusChip = useMemo(() => formatStatusChip(importStatus), [importStatus])

  const reset = useCallback(() => {
    setStage('upload')
    setFile(null)
    setUploadProgress(0)
    setUploading(false)
    setLoadingPreview(false)
    setImportId('')
    setImportStatus('UPLOADED')
    setErrorMessage('')
    setPolicyName('')
    setPolicyVersion('')
    setPolicyCurrency('USD')
    setDocumentSummary('')
    setRules([])
    setSyncRuleCurrency(true)
    setIsValidForImport(false)
    setValidationErrorCount(0)
    setWarningCount(0)
    setConflictCount(0)
    setRevalidating(false)
    setUpdatingPreview(false)
    setImporting(false)
    setConfirmOptions(defaultConfirmState)
    setConfirmResult(null)
  }, [])

  const applyPreviewData = useCallback(
    (record: { id: string; status: PolicyDocumentImportStatus; error_message?: string | null }, preview: Record<string, unknown>, warnings: unknown[], conflicts: unknown[]) => {
      setImportId(record.id)
      setImportStatus(record.status)

      if (record.status === 'FAILED') {
        setErrorMessage(record.error_message || 'Policy extraction failed.')
        setStage('error')
        return
      }

      const data: any = preview
      setPolicyName(String(data.policy_name ?? ''))
      setPolicyVersion(String(data.policy_version ?? ''))
      setPolicyCurrency(String(data.policy_currency ?? 'USD') || 'USD')
      setDocumentSummary(String(data.document_summary ?? ''))
      setRules((data.rules as unknown[]) ?? [])
      setIsValidForImport(Boolean(data.is_valid_for_import))
      setValidationErrorCount(Number(data.validation_error_count ?? 0))
      setWarningCount(Number(data.warning_count ?? warnings.length ?? 0))
      setConflictCount(Number(data.conflict_count ?? conflicts.length ?? 0))
      setStage('preview')
    },
    [],
  )

  const loadPreview = useCallback(
    async (id: string) => {
      setLoadingPreview(true)
      setErrorMessage('')
      try {
        const res = await getPolicyDocumentPreview(id)
        applyPreviewData(res.data.import, res.data.preview, res.data.warnings, res.data.conflicts)
      } catch (err) {
        const message = getApiErrorMessage(err)
        setErrorMessage(message)
        setStage('error')
        toast.error(message)
      } finally {
        setLoadingPreview(false)
      }
    },
    [applyPreviewData],
  )

  const handleOpenChange = (next: boolean) => {
    if (!next && uploading) return
    if (!next) reset()
    onOpenChange(next)
  }

  useEffect(() => {
    if (!open) return
    if (reviewImportId) {
      loadPreview(reviewImportId)
      return
    }
    reset()
  }, [open, reviewImportId, loadPreview, reset])

  useEffect(() => {
    if (!uploading) return
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [uploading])

  const startUpload = async () => {
    if (!file) {
      toast.error('Select a policy document file to upload.')
      return
    }

    setErrorMessage('')
    setUploading(true)
    setUploadProgress(0)
    setStage('upload')

    try {
      const res = await uploadPolicyDocument(file, (percent) => setUploadProgress(percent))
      onUploadQueued?.(res.data.import_id, file.name)
      onOpenChange(false)
      reset()
    } catch (err) {
      const message = getApiErrorMessage(err)
      setErrorMessage(message)
      setStage('error')
      toast.error(message)
    } finally {
      setUploading(false)
    }
  }

  const rulesToDisplay = useMemo(() => {
    if (!Array.isArray(rules)) return []
    return rules.slice(0, 20)
  }, [rules])

  const doRevalidate = async () => {
    if (!importId) return
    setRevalidating(true)
    setErrorMessage('')
    try {
      const re = await revalidatePolicyDocumentPreview(importId)
      setIsValidForImport(Boolean(re.data.is_valid_for_import))
      setValidationErrorCount(re.data.validation_error_count)
      setWarningCount(re.data.warning_count)
      setConflictCount(re.data.conflict_count)
      const rePreview: any = re.data.preview || {}
      setRules((rePreview.rules as unknown[]) ?? [])
      setPolicyName(String(rePreview.policy_name ?? policyName))
      setPolicyVersion(String(rePreview.policy_version ?? policyVersion))
      setPolicyCurrency(String(rePreview.policy_currency ?? policyCurrency))
      setDocumentSummary(String(rePreview.document_summary ?? documentSummary))
      toast.success('Preview revalidated.')
    } catch (err) {
      const message = getApiErrorMessage(err)
      setErrorMessage(message)
      toast.error(message)
    } finally {
      setRevalidating(false)
    }
  }

  const doUpdatePreviewAndRevalidate = async () => {
    if (!importId) return
    setUpdatingPreview(true)
    setErrorMessage('')
    try {
      const normalizedCurrency = policyCurrency.trim().toUpperCase() || 'USD'
      const rulesPayload = syncRuleCurrency
        ? (rules as unknown[]).map((r: any) => ({ ...r, currency: normalizedCurrency }))
        : rules

      const upd = await updatePolicyDocumentPreview(importId, {
        policy_name: policyName.trim() || undefined,
        policy_version: policyVersion.trim() || undefined,
        policy_currency: normalizedCurrency,
        document_summary: documentSummary.trim() || undefined,
        rules: rulesPayload,
      })

      const updPreview: any = upd.data.preview || {}
      setRules((updPreview.rules as unknown[]) ?? rulesPayload)
      setPolicyName(String(updPreview.policy_name ?? policyName))
      setPolicyVersion(String(updPreview.policy_version ?? policyVersion))
      setPolicyCurrency(String(updPreview.policy_currency ?? normalizedCurrency))
      setDocumentSummary(String(updPreview.document_summary ?? documentSummary))
      await doRevalidate()
    } catch (err) {
      const message = getApiErrorMessage(err)
      setErrorMessage(message)
      toast.error(message)
    } finally {
      setUpdatingPreview(false)
    }
  }

  const doImport = async () => {
    if (!importId) return
    if (!isValidForImport && !confirmOptions.allow_review_required) {
      toast.error('Preview is not valid for import. Enable "Allow review-required rules".')
      return
    }

    setImporting(true)
    setErrorMessage('')
    try {
      const res = await confirmPolicyDocumentImport(importId, confirmOptions)
      setConfirmResult(res.data)
      setStage('complete')
      toast.success(res.data.message)
      onImported?.()
      window.setTimeout(() => handleOpenChange(false), 1200)
    } catch (err) {
      const message = getApiErrorMessage(err)
      setErrorMessage(message)
      toast.error(message)
    } finally {
      setImporting(false)
    }
  }

  const canReviewActions = importStatus === 'REVIEW_REQUIRED'
  const disableAll = Boolean(disabled) || uploading || loadingPreview || updatingPreview || revalidating || importing
  const rulesCount = Array.isArray(rules) ? rules.length : 0
  const showToolbar = stage !== 'complete' && !loadingPreview

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] w-[calc(100%-1.5rem)] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:w-full"
        onInteractOutside={(event) => uploading && event.preventDefault()}
        onEscapeKeyDown={(event) => uploading && event.preventDefault()}
      >
        <div className="shrink-0 border-b border-[#e2e8f0] px-6 py-4 pr-14">
          <DialogHeader>
            <DialogTitle>Import Policy Document</DialogTitle>
            <DialogDescription>
              Upload a policy PDF/DOCX to extract rules, review them, and import as a new active policy version.
            </DialogDescription>
          </DialogHeader>

          {showToolbar && (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  {stage === 'preview' && (
                    <>
                      <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', statusChip.variant)}>
                        {statusChip.label}
                      </span>
                      <span className="text-sm text-gray-500">{rulesCount} rules extracted</span>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  {stage === 'upload' && !uploading && (
                    <Button type="button" onClick={startUpload} disabled={disableAll || !file}>
                      <FileUp className="h-4 w-4" />
                      Upload
                    </Button>
                  )}

                  {stage === 'preview' && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!canReviewActions || revalidating || updatingPreview || importing}
                        onClick={doRevalidate}
                      >
                        <RefreshCcw className={cn('h-4 w-4', revalidating && 'animate-spin')} />
                        Revalidate
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={!canReviewActions || updatingPreview || revalidating || importing}
                        onClick={doUpdatePreviewAndRevalidate}
                      >
                        {updatingPreview ? 'Saving…' : 'Save & Revalidate'}
                      </Button>
                      <Button
                        type="button"
                        disabled={!canReviewActions || importing}
                        onClick={doImport}
                      >
                        {importing ? 'Importing…' : 'Import Policy'}
                      </Button>
                    </>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenChange(false)}
                    disabled={uploading || importing}
                  >
                    Close
                  </Button>
                </div>
              </div>

              {stage === 'preview' && (
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={confirmOptions.overwrite_existing}
                      onChange={(e) =>
                        setConfirmOptions((s) => ({ ...s, overwrite_existing: e.target.checked }))
                      }
                      disabled={!canReviewActions || importing}
                    />
                    Overwrite existing rules
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={confirmOptions.allow_review_required}
                      onChange={(e) =>
                        setConfirmOptions((s) => ({ ...s, allow_review_required: e.target.checked }))
                      }
                      disabled={!canReviewActions || importing}
                    />
                    Allow review-required rules
                  </label>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {uploading && (
            <div className="space-y-4 rounded-lg border border-blue-100 bg-blue-50/70 p-4">
              <div className="flex items-center gap-3">
                <Spinner className="h-5 w-5" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-blue-950">Uploading document…</p>
                  <p className="text-xs text-blue-800/90">Sending your file to the server.</p>
                </div>
                <p className="text-sm font-medium text-blue-950">{uploadProgress}%</p>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-blue-100">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {loadingPreview && (
            <div className="flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50/70 p-4">
              <Spinner className="h-5 w-5" />
              <p className="text-sm text-blue-950">Loading extracted policy preview…</p>
            </div>
          )}

          {!uploading && !loadingPreview && stage === 'upload' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="policy-doc">Policy document</Label>
                <Input
                  id="policy-doc"
                  type="file"
                  accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  disabled={disableAll}
                />
                <p className="text-xs text-gray-500">
                  Supported: PDF, DOCX, TXT, JPG, PNG, WEBP. Extraction runs in the background after upload.
                </p>
              </div>
              {errorMessage && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{errorMessage}</p>
                </div>
              )}
            </div>
          )}

          {!uploading && !loadingPreview && stage === 'preview' && (
            <div className="space-y-5">
              {errorMessage && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{errorMessage}</p>
                </div>
              )}

              <div
                className={cn(
                  'rounded-lg border p-4',
                  isValidForImport
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-amber-200 bg-amber-50',
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900">Validation status</p>
                    <p className={cn('mt-1 text-sm', isValidForImport ? 'text-emerald-800' : 'text-amber-800')}>
                      {isValidForImport
                        ? 'Ready for import.'
                        : 'Not valid for import yet. Enable "Allow review-required rules" to proceed.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-white/80 px-2 py-1 font-medium text-red-700">
                      {validationErrorCount} errors
                    </span>
                    <span className="rounded-full bg-white/80 px-2 py-1 font-medium text-amber-800">
                      {warningCount} warnings
                    </span>
                    <span className="rounded-full bg-white/80 px-2 py-1 font-medium text-orange-800">
                      {conflictCount} conflicts
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-lg border border-[#e2e8f0] p-4">
                <p className="text-sm font-medium text-gray-900">Policy details</p>
                <div className="space-y-2">
                  <Label htmlFor="policy-name">Policy name</Label>
                  <Input
                    id="policy-name"
                    value={policyName}
                    onChange={(e) => setPolicyName(e.target.value)}
                    disabled={!canReviewActions || disableAll}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="policy-version">Policy version</Label>
                    <Input
                      id="policy-version"
                      value={policyVersion}
                      onChange={(e) => setPolicyVersion(e.target.value)}
                      placeholder="e.g. 1.0"
                      disabled={!canReviewActions || disableAll}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="policy-currency">Policy currency</Label>
                    <Input
                      id="policy-currency"
                      value={policyCurrency}
                      onChange={(e) => setPolicyCurrency(e.target.value.toUpperCase())}
                      placeholder="USD"
                      disabled={!canReviewActions || disableAll}
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={syncRuleCurrency}
                    onChange={(e) => setSyncRuleCurrency(e.target.checked)}
                    disabled={!canReviewActions || disableAll}
                  />
                  Sync all rule currencies to policy currency
                </label>
                <div className="space-y-2">
                  <Label htmlFor="document-summary">Document summary</Label>
                  <Textarea
                    id="document-summary"
                    value={documentSummary}
                    onChange={(e) => setDocumentSummary(e.target.value)}
                    rows={3}
                    disabled={!canReviewActions || disableAll}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900">Extracted rules</p>
                  {rulesCount > rulesToDisplay.length && (
                    <p className="text-xs text-gray-400">
                      Showing {rulesToDisplay.length} of {rulesCount}
                    </p>
                  )}
                </div>
                <div className="overflow-hidden rounded-lg border border-[#e2e8f0]">
                  <div className="hidden border-b border-[#e2e8f0] bg-gray-50 px-3 py-2 text-xs font-medium uppercase tracking-wide text-gray-400 sm:grid sm:grid-cols-[minmax(0,1fr)_8rem_7rem] sm:gap-3">
                    <span>Rule</span>
                    <span>Role</span>
                    <span className="text-right">Limit</span>
                  </div>
                  <div className="max-h-72 divide-y divide-[#e2e8f0] overflow-y-auto">
                    {rulesToDisplay.length === 0 ? (
                      <p className="px-3 py-6 text-sm text-gray-400">No rules extracted.</p>
                    ) : (
                      rulesToDisplay.map((rule: any, idx) => {
                        const ruleCategory = String(rule.category ?? rule.original_category ?? 'misc').replace(/_/g, ' ')
                        const ruleRole =
                          rule.resolved_role_name ||
                          rule.role ||
                          (rule.scope === 'ALL' ? 'All Employees' : 'Employee')
                        const ruleCurrency = rule.currency ?? policyCurrency
                        const isUnlimited = Boolean(rule.is_unlimited)
                        const isAllowed = rule.is_allowed !== false
                        const amountText = !isAllowed
                          ? 'Not allowed'
                          : isUnlimited
                            ? 'Unlimited'
                            : rule.max_amount
                              ? formatCurrency(rule.max_amount, ruleCurrency)
                              : '—'

                        return (
                          <div
                            key={`${ruleCategory}-${idx}`}
                            className="px-3 py-3 text-sm sm:grid sm:grid-cols-[minmax(0,1fr)_8rem_7rem] sm:items-start sm:gap-3"
                          >
                            <div className="min-w-0">
                              <p className="font-medium capitalize text-gray-900">{ruleCategory}</p>
                              {rule.description && (
                                <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{rule.description}</p>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-gray-600 sm:mt-0 sm:text-sm">{ruleRole}</p>
                            <p className="mt-1 font-semibold text-gray-900 sm:mt-0 sm:text-right">{amountText}</p>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {stage === 'complete' && confirmResult && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-sm font-medium text-green-900">Policy import complete</p>
              <p className="mt-1 text-sm text-green-800">
                {confirmResult.policy_version.title} (v{confirmResult.policy_version.version_number})
              </p>
            </div>
          )}

          {stage === 'error' && errorMessage && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{errorMessage}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
