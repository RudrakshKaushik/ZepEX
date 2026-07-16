import { useState } from 'react'
import {
  copyRolePolicy,
  previewRolePolicy,
  simulatePolicyRule,
} from '@/api'
import { getApiErrorMessage } from '@/api/client'
import { AdminModalFooter } from '@/components/admin/AdminModalFooter'
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
import { toast } from '@/lib/toast'
import { formatCurrency } from '@/lib/utils'
import type { CompanyRole, EffectivePolicyRule, PolicySimulateResponse } from '@/types'

const selectClassName =
  'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm'

type PolicyToolModal = 'preview' | 'simulate' | 'copy' | null

interface PolicyToolsPanelProps {
  roles: CompanyRole[]
  currency: string
  disabled?: boolean
  onCopied?: () => void
}

export function PolicyToolsPanel({
  roles,
  currency,
  disabled,
  onCopied,
}: PolicyToolsPanelProps) {
  const [activeModal, setActiveModal] = useState<PolicyToolModal>(null)

  const [previewRoleId, setPreviewRoleId] = useState<number | ''>('')
  const [previewRules, setPreviewRules] = useState<EffectivePolicyRule[]>([])
  const [previewRoleName, setPreviewRoleName] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)

  const [simulateRoleId, setSimulateRoleId] = useState<number | ''>('')
  const [simulateCategory, setSimulateCategory] = useState('food')
  const [simulateAmount, setSimulateAmount] = useState('')
  const [simulateResult, setSimulateResult] = useState<PolicySimulateResponse | null>(null)
  const [simulateLoading, setSimulateLoading] = useState(false)

  const [copyFromRoleId, setCopyFromRoleId] = useState<number | ''>('')
  const [copyToRoleId, setCopyToRoleId] = useState<number | ''>('')
  const [overwriteExisting, setOverwriteExisting] = useState(false)
  const [copyLoading, setCopyLoading] = useState(false)

  const activeRoles = roles.filter((role) => role.is_active !== false)

  const openModal = (modal: PolicyToolModal) => {
    setActiveModal(modal)
    if (modal === 'preview') {
      setPreviewRules([])
      setPreviewRoleName('')
    }
    if (modal === 'simulate') {
      setSimulateResult(null)
    }
  }

  const handlePreview = async () => {
    if (!previewRoleId) {
      toast.error('Select a role to preview.')
      return
    }

    setPreviewLoading(true)
    try {
      const { data } = await previewRolePolicy(previewRoleId)
      setPreviewRules(data.rules)
      setPreviewRoleName(data.company_role.name)
    } catch (err) {
      toast.error(getApiErrorMessage(err))
      setPreviewRules([])
      setPreviewRoleName('')
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleSimulate = async () => {
    if (!simulateRoleId || !simulateCategory.trim() || !simulateAmount.trim()) {
      toast.error('Role, category, and amount are required.')
      return
    }

    setSimulateLoading(true)
    try {
      const { data } = await simulatePolicyRule({
        company_role_id: simulateRoleId,
        category: simulateCategory.trim(),
        amount: simulateAmount.trim(),
      })
      setSimulateResult(data)
    } catch (err) {
      toast.error(getApiErrorMessage(err))
      setSimulateResult(null)
    } finally {
      setSimulateLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!copyFromRoleId || !copyToRoleId) {
      toast.error('Select both source and destination roles.')
      return
    }

    if (copyFromRoleId === copyToRoleId) {
      toast.error('Source and destination roles must be different.')
      return
    }

    setCopyLoading(true)
    try {
      const { data } = await copyRolePolicy({
        from_role: copyFromRoleId,
        to_role: copyToRoleId,
        overwrite_existing: overwriteExisting,
      })
      toast.success(
        `${data.message} Copied ${data.copied}, updated ${data.updated}, skipped ${data.skipped}.`,
      )
      setActiveModal(null)
      onCopied?.()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setCopyLoading(false)
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => openModal('preview')}
        >
          Preview policy
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => openModal('simulate')}
        >
          Simulate policy
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => openModal('copy')}
        >
          Copy policy
        </Button>
      </div>

      <Dialog open={activeModal === 'preview'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Effective policy preview</DialogTitle>
            <DialogDescription>
              Shows role rules plus inherited Employee rules.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="preview-role">Role</Label>
              <select
                id="preview-role"
                className={selectClassName}
                value={previewRoleId}
                onChange={(e) => setPreviewRoleId(e.target.value ? Number(e.target.value) : '')}
                disabled={disabled || previewLoading}
              >
                <option value="">Select role</option>
                {activeRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            {previewRules.length > 0 && (
              <div className="max-h-56 space-y-2 overflow-y-auto text-sm">
                <p className="font-medium text-gray-900">{previewRoleName}</p>
                {previewRules.map((rule) => (
                  <div
                    key={`${rule.category}-${rule.source_role}`}
                    className="rounded-md border border-[#e2e8f0] px-3 py-2"
                  >
                    <p className="font-medium capitalize text-gray-900">{rule.category}</p>
                    <p className="text-gray-600">
                      {formatCurrency(rule.limit, currency)} · {rule.source_role}
                      {rule.inherited ? ' (inherited)' : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <AdminModalFooter
              onCancel={() => setActiveModal(null)}
              submitLabel={previewLoading ? 'Loading…' : 'Preview'}
              submitting={previewLoading}
              submitDisabled={disabled || !previewRoleId}
              submitType="button"
              onSubmit={handlePreview}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeModal === 'simulate'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Simulate policy</DialogTitle>
            <DialogDescription>
              Test whether an amount would violate policy.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="simulate-role">Role</Label>
              <select
                id="simulate-role"
                className={selectClassName}
                value={simulateRoleId}
                onChange={(e) => setSimulateRoleId(e.target.value ? Number(e.target.value) : '')}
                disabled={disabled || simulateLoading}
              >
                <option value="">Select role</option>
                {activeRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="simulate-category">Category</Label>
              <Input
                id="simulate-category"
                value={simulateCategory}
                onChange={(e) => setSimulateCategory(e.target.value)}
                placeholder="food"
                disabled={disabled || simulateLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="simulate-amount">Amount ({currency})</Label>
              <Input
                id="simulate-amount"
                type="number"
                value={simulateAmount}
                onChange={(e) => setSimulateAmount(e.target.value)}
                disabled={disabled || simulateLoading}
              />
            </div>
            {simulateResult && (
              <div
                className={`rounded-md px-3 py-2 text-sm ${
                  simulateResult.violation || simulateResult.allowed === false
                    ? 'bg-red-50 text-red-800'
                    : 'bg-emerald-50 text-emerald-800'
                }`}
              >
                <p className="font-medium">
                  {simulateResult.violation || simulateResult.allowed === false
                    ? 'Policy violation'
                    : 'Within policy'}
                </p>
                {simulateResult.reason && <p className="mt-1">{simulateResult.reason}</p>}
                {simulateResult.limit && (
                  <p className="mt-1">
                    Limit: {formatCurrency(simulateResult.limit, currency)}
                    {simulateResult.source_role
                      ? ` (${simulateResult.source_role}${simulateResult.inherited ? ', inherited' : ''})`
                      : ''}
                  </p>
                )}
              </div>
            )}
            <AdminModalFooter
              onCancel={() => setActiveModal(null)}
              submitLabel={simulateLoading ? 'Simulating…' : 'Simulate'}
              submitting={simulateLoading}
              submitDisabled={disabled}
              submitType="button"
              onSubmit={handleSimulate}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeModal === 'copy'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Copy policy</DialogTitle>
            <DialogDescription>
              Copy all rules from one role to another.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="copy-from">From role</Label>
              <select
                id="copy-from"
                className={selectClassName}
                value={copyFromRoleId}
                onChange={(e) => setCopyFromRoleId(e.target.value ? Number(e.target.value) : '')}
                disabled={disabled || copyLoading}
              >
                <option value="">Select role</option>
                {activeRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="copy-to">To role</Label>
              <select
                id="copy-to"
                className={selectClassName}
                value={copyToRoleId}
                onChange={(e) => setCopyToRoleId(e.target.value ? Number(e.target.value) : '')}
                disabled={disabled || copyLoading}
              >
                <option value="">Select role</option>
                {activeRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={overwriteExisting}
                onChange={(e) => setOverwriteExisting(e.target.checked)}
                disabled={disabled || copyLoading}
              />
              Overwrite existing rules
            </label>
            <AdminModalFooter
              onCancel={() => setActiveModal(null)}
              submitLabel={copyLoading ? 'Copying…' : 'Copy policy'}
              submitting={copyLoading}
              submitDisabled={disabled}
              submitType="button"
              onSubmit={handleCopy}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
