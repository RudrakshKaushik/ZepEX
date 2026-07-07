import { ChevronRight, Mail, Settings, Wallet } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  getEmailServiceStatus,
  getFinanceSettings,
  getReimbursementEmailConfig,
  saveReimbursementEmailConfig,
  updateFinanceSettings,
} from '@/api'
import { getApiErrorMessage } from '@/api/client'
import { AdminListPanel } from '@/components/admin/AdminListPanel'
import { AdminModalFooter } from '@/components/admin/AdminModalFooter'
import { CurrencySelect } from '@/components/admin/CurrencySelect'
import { StatusBadge } from '@/components/StatusBadge'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAdminNav, invalidateAdminSetupCache } from '@/hooks/useAdminNav'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AdminListPanelShimmer } from '@/components/ui/shimmer'
import { formatDateTime } from '@/lib/utils'
import { toast } from '@/lib/toast'
import { financeCurrencyLabel as formatFinanceCurrencyLabel } from '@/lib/financeSettings'
import { unwrapEmailServiceStatus, unwrapReimbursementEmailConfig } from '@/lib/emailSettings'
import type { FinanceSettings, PlatformEmailServiceStatus } from '@/types'

const DATE_FORMAT_OPTIONS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] as const

const selectClassName =
  'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm'

export function SettingsPage() {
  const { navItems } = useAdminNav()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [financeOpen, setFinanceOpen] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)
  const [emailForm, setEmailForm] = useState({ reimbursement_email: '' })
  const [emailLoaded, setEmailLoaded] = useState(false)
  const [emailSummary, setEmailSummary] = useState('Not configured')
  const [platformReceiptEmail, setPlatformReceiptEmail] = useState('receipts@zepex.ai')
  const [forwardingInstruction, setForwardingInstruction] = useState('')
  const [emailServiceStatus, setEmailServiceStatus] = useState<PlatformEmailServiceStatus | null>(
    null,
  )
  const [financeForm, setFinanceForm] = useState({
    base_currency: '' as number | '',
    auto_currency_conversion: true,
    exchange_rate_provider: 'ExchangeRate API',
    allow_manual_exchange_rate: false,
    decimal_places: '2',
    rounding_enabled: true,
    timezone: 'Asia/Kolkata',
    date_format: 'DD/MM/YYYY',
  })
  const [financeLoaded, setFinanceLoaded] = useState(false)
  const [financeCurrencyLabel, setFinanceCurrencyLabel] = useState('')
  const [lastExchangeSync, setLastExchangeSync] = useState<string | null>(null)
  const [financeSelectedCurrency, setFinanceSelectedCurrency] = useState<{
    id: number
    code: string
    name: string
    flag: string
  } | null>(null)

  const applyFinanceSettings = (settings: FinanceSettings) => {
    setFinanceForm({
      base_currency: settings.base_currency,
      auto_currency_conversion: settings.auto_currency_conversion,
      exchange_rate_provider: settings.exchange_rate_provider,
      allow_manual_exchange_rate: settings.allow_manual_exchange_rate,
      decimal_places: String(settings.decimal_places),
      rounding_enabled: settings.rounding_enabled,
      timezone: settings.timezone,
      date_format: settings.date_format,
    })
    setFinanceCurrencyLabel(formatFinanceCurrencyLabel(settings))
    setLastExchangeSync(settings.last_exchange_sync)
    if (settings.base_currency_details) {
      setFinanceSelectedCurrency({
        id: settings.base_currency_details.id,
        code: settings.base_currency_details.code,
        name: settings.base_currency_details.name,
        flag: settings.base_currency_details.flag || '',
      })
    } else if (settings.base_currency_code) {
      setFinanceSelectedCurrency({
        id: settings.base_currency,
        code: settings.base_currency_code,
        name: settings.base_currency_name || settings.base_currency_code,
        flag: settings.base_currency_flag || '',
      })
    }
    setFinanceLoaded(true)
  }

  const applyReimbursementEmail = (data: {
    reimbursement_email: string | null
    platform_receipt_email: string
    forwarding_instruction: string
  }) => {
    setEmailForm({
      reimbursement_email: data.reimbursement_email ?? '',
    })
    setEmailSummary(data.reimbursement_email || 'Not configured')
    setPlatformReceiptEmail(data.platform_receipt_email)
    setForwardingInstruction(data.forwarding_instruction)
    setEmailLoaded(Boolean(data.reimbursement_email))
  }

  useEffect(() => {
    async function loadSettings() {
      setLoading(true)
      try {
        const [financeRes, emailRes, emailStatusRes] = await Promise.all([
          getFinanceSettings(),
          getReimbursementEmailConfig().catch(() => null),
          getEmailServiceStatus().catch(() => null),
        ])

        if (financeRes.data.settings) {
          applyFinanceSettings(financeRes.data.settings)
        }

        if (emailRes?.data) {
          applyReimbursementEmail(unwrapReimbursementEmailConfig(emailRes.data))
        }

        if (emailStatusRes?.data) {
          setEmailServiceStatus(unwrapEmailServiceStatus(emailStatusRes.data))
        }
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  const settingsRows = useMemo(
    () => [
      {
        id: 'finance' as const,
        title: 'Finance settings',
        description: 'Base currency, conversion, and display preferences.',
        summary: financeCurrencyLabel || 'Not configured',
        configured: financeLoaded,
        icon: Wallet,
      },
      {
        id: 'email' as const,
        title: 'Reimbursement email',
        description: 'Company inbox for forwarded expense receipts.',
        summary: emailSummary,
        configured: emailLoaded,
        icon: Mail,
      },
    ],
    [financeCurrencyLabel, financeLoaded, emailSummary, emailLoaded],
  )

  const closeFinanceModal = () => {
    setFinanceOpen(false)
    setError('')
  }

  const closeEmailModal = () => {
    setEmailOpen(false)
    setError('')
  }

  const saveFinance = async (e: FormEvent) => {
    e.preventDefault()
    if (!financeForm.base_currency) {
      setError('Select a base currency.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const { data } = await updateFinanceSettings({
        base_currency: financeForm.base_currency,
        auto_currency_conversion: financeForm.auto_currency_conversion,
        exchange_rate_provider: financeForm.exchange_rate_provider,
        allow_manual_exchange_rate: financeForm.allow_manual_exchange_rate,
        decimal_places: parseInt(financeForm.decimal_places, 10),
        rounding_enabled: financeForm.rounding_enabled,
        timezone: financeForm.timezone,
        date_format: financeForm.date_format,
      })
      applyFinanceSettings(data.settings)
      if (financeSelectedCurrency) {
        setFinanceCurrencyLabel(
          `${financeSelectedCurrency.flag} ${financeSelectedCurrency.code}`.trim(),
        )
      }
      toast.success(data.message || 'Finance settings saved.')
      closeFinanceModal()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const saveReimbursementEmail = async (e: FormEvent) => {
    e.preventDefault()
    if (!emailForm.reimbursement_email.trim()) {
      setError('Enter your company reimbursement email.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const { data } = await saveReimbursementEmailConfig({
        reimbursement_email: emailForm.reimbursement_email.trim().toLowerCase(),
      })
      applyReimbursementEmail(unwrapReimbursementEmailConfig(data))
      invalidateAdminSetupCache()
      toast.success(data.message || 'Reimbursement email saved.')
      closeEmailModal()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout
        title="Settings"
        subtitle="Finance, reimbursement email, and display preferences"
        breadcrumb="Settings"
        icon={Settings}
        navItems={navItems}
      >
        <AdminListPanelShimmer rows={2} />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Settings"
      subtitle="Finance, reimbursement email, and display preferences"
      breadcrumb="Settings"
      icon={Settings}
      navItems={navItems}
    >
      {error && !financeOpen && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <AdminListPanel
        title="Company settings"
        count={settingsRows.length}
        description="Click a row to view and edit configuration."
      >
        <div className="divide-y divide-[#e2e8f0]">
          {settingsRows.map((row) => {
            const Icon = row.icon
            return (
              <button
                key={row.id}
                type="button"
                onClick={() => {
                  setError('')
                  if (row.id === 'finance') {
                    setFinanceOpen(true)
                  } else {
                    setEmailOpen(true)
                  }
                }}
                className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50 sm:px-6"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-gray-900">{row.title}</p>
                    <StatusBadge status={row.configured ? 'ACTIVE' : 'PENDING'} />
                  </div>
                  <p className="mt-0.5 text-sm text-gray-500">{row.description}</p>
                  <p className="mt-1 truncate text-sm text-gray-700">{row.summary}</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
              </button>
            )
          })}
        </div>
      </AdminListPanel>

      <Dialog open={financeOpen} onOpenChange={(open) => !open && closeFinanceModal()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Finance settings</DialogTitle>
            <DialogDescription>Base currency, conversion, and display preferences.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveFinance} className="space-y-4">
            <CurrencySelect
              value={financeForm.base_currency}
              selectedOption={financeSelectedCurrency}
              onChange={(currencyId, currency) => {
                setFinanceForm({ ...financeForm, base_currency: currencyId })
                if (currency) setFinanceSelectedCurrency(currency)
              }}
              disabled={saving}
            />
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={financeForm.timezone}
                onChange={(e) => setFinanceForm({ ...financeForm, timezone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-format">Date format</Label>
              <select
                id="date-format"
                className={selectClassName}
                value={financeForm.date_format}
                onChange={(e) => setFinanceForm({ ...financeForm, date_format: e.target.value })}
              >
                {DATE_FORMAT_OPTIONS.map((format) => (
                  <option key={format} value={format}>
                    {format}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="decimal-places">Decimal places</Label>
              <Input
                id="decimal-places"
                type="number"
                min={0}
                max={4}
                value={financeForm.decimal_places}
                onChange={(e) =>
                  setFinanceForm({ ...financeForm, decimal_places: e.target.value })
                }
              />
            </div>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={financeForm.auto_currency_conversion}
                  onChange={(e) =>
                    setFinanceForm({
                      ...financeForm,
                      auto_currency_conversion: e.target.checked,
                    })
                  }
                />
                Auto currency conversion
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={financeForm.allow_manual_exchange_rate}
                  onChange={(e) =>
                    setFinanceForm({
                      ...financeForm,
                      allow_manual_exchange_rate: e.target.checked,
                    })
                  }
                />
                Allow manual exchange rate
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={financeForm.rounding_enabled}
                  onChange={(e) =>
                    setFinanceForm({ ...financeForm, rounding_enabled: e.target.checked })
                  }
                />
                Enable rounding
              </label>
            </div>
            {lastExchangeSync && (
              <p className="text-xs text-gray-500">
                Last exchange rate sync: {formatDateTime(lastExchangeSync)}
              </p>
            )}
            {error && financeOpen && <p className="text-sm text-red-600">{error}</p>}
            <AdminModalFooter
              onCancel={closeFinanceModal}
              submitLabel={financeLoaded ? 'Save finance settings' : 'Initialize finance settings'}
              submitDisabled={!financeForm.base_currency}
              submitting={saving}
            />
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={emailOpen} onOpenChange={(open) => !open && closeEmailModal()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Reimbursement email</DialogTitle>
            <DialogDescription>
              Set the company inbox employees forward receipts to. ZepEx ingests mail sent to the
              platform receipt address below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveReimbursementEmail} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reimbursement-email">Company reimbursement email</Label>
              <Input
                id="reimbursement-email"
                type="email"
                placeholder="expenses@company.com"
                value={emailForm.reimbursement_email}
                onChange={(e) =>
                  setEmailForm({ reimbursement_email: e.target.value })
                }
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="platform-receipt-email">Forward all emails to</Label>
              <Input
                id="platform-receipt-email"
                value={platformReceiptEmail}
                readOnly
                className="bg-muted/40"
              />
            </div>

            {forwardingInstruction && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                {forwardingInstruction}
              </div>
            )}

            {emailServiceStatus && (
              <div className="rounded-lg border border-[#e2e8f0] bg-gray-50 px-4 py-3 text-sm text-gray-700">
                <p className="font-medium text-gray-900">Platform email delivery</p>
                <p className="mt-1">
                  Provider: {emailServiceStatus.provider ?? 'Platform SMTP (.env)'}
                </p>
                {emailServiceStatus.outgoing_email && (
                  <p className="mt-1">Outgoing: {emailServiceStatus.outgoing_email}</p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  SMTP is configured once by the platform via environment variables. Companies do not
                  enter SMTP or IMAP credentials here.
                </p>
              </div>
            )}

            {error && emailOpen && <p className="text-sm text-red-600">{error}</p>}
            <AdminModalFooter
              onCancel={closeEmailModal}
              submitLabel={emailLoaded ? 'Save reimbursement email' : 'Set reimbursement email'}
              submitDisabled={!emailForm.reimbursement_email.trim()}
              submitting={saving}
            />
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
