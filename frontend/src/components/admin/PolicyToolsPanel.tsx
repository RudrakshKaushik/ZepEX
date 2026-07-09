import { useState } from 'react'
import {
  copyRolePolicy,
  previewRolePolicy,
  simulatePolicyRule,
} from '@/api'
import { getApiErrorMessage } from '@/api/client'
import { AdminListPanel } from '@/components/admin/AdminListPanel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/lib/toast'
import { formatCurrency } from '@/lib/utils'
import type { CompanyRole, EffectivePolicyRule, PolicySimulateResponse } from '@/types'

const selectClassName =
  'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm'

interface PolicyToolsPanelProps {
  roles: CompanyRole[]
  currency: string
  disabled?: boolean
}

export function PolicyToolsPanel({ roles, currency, disabled }: PolicyToolsPanelProps) {
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
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setCopyLoading(false)
    }
  }

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-3">
      <AdminListPanel
        title="Effective policy preview"
        description="Shows role rules plus inherited Employee rules."
      >
        <div className="space-y-3 px-5 py-4 sm:px-6">
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
          <Button
            type="button"
            size="sm"
            disabled={disabled || previewLoading || !previewRoleId}
            onClick={handlePreview}
          >
            {previewLoading ? 'Loading…' : 'Preview'}
          </Button>
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
        </div>
      </AdminListPanel>

      <AdminListPanel
        title="Simulate policy"
        description="Test whether an amount would violate policy."
      >
        <div className="space-y-3 px-5 py-4 sm:px-6">
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
          <Button
            type="button"
            size="sm"
            disabled={disabled || simulateLoading}
            onClick={handleSimulate}
          >
            {simulateLoading ? 'Simulating…' : 'Simulate'}
          </Button>
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
        </div>
      </AdminListPanel>

      <AdminListPanel
        title="Copy policy"
        description="Copy all rules from one role to another."
      >
        <div className="space-y-3 px-5 py-4 sm:px-6">
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
          <Button
            type="button"
            size="sm"
            disabled={disabled || copyLoading}
            onClick={handleCopy}
          >
            {copyLoading ? 'Copying…' : 'Copy policy'}
          </Button>
        </div>
      </AdminListPanel>
    </div>
  )
}
