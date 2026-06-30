import { ChevronRight, Mail, Settings, Wallet } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  getFinanceSettings,
  getReimbursementEmailConfig,
  getSmtpConfig,
  saveReimbursementEmailConfig,
  saveSmtpConfig,
  triggerEmailFetch,
  updateFinanceSettings,
} from '@/api'
import { getApiErrorMessage } from '@/api/client'
import { AdminListPanel } from '@/components/admin/AdminListPanel'
import { AdminModalFooter } from '@/components/admin/AdminModalFooter'
import { CurrencySelect } from '@/components/admin/CurrencySelect'
import { StatusBadge } from '@/components/StatusBadge'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAdminNav, invalidateAdminSetupCache } from '@/hooks/useAdminNav'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { AdminListPanelShimmer } from '@/components/ui/shimmer'
import { toast } from '@/lib/toast'
import { financeCurrencyLabel as formatFinanceCurrencyLabel } from '@/lib/financeSettings'
import type { FinanceSettings } from '@/types'

type SettingsSection = 'imap' | 'smtp' | 'finance'

const DATE_FORMAT_OPTIONS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] as const

const selectClassName =
  'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm'

export function SettingsPage() {
  const { navItems } = useAdminNav()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [activeSection, setActiveSection] = useState<SettingsSection | null>(null)
  const [emailForm, setEmailForm] = useState({
    email_address: '',
    imap_host: 'imap.gmail.com',
    imap_port: '993',
    imap_username: '',
    imap_password: '',
    is_active: true,
  })
  const [smtpForm, setSmtpForm] = useState({
    smtp_host: '',
    smtp_port: '587',
    smtp_email: '',
    smtp_password: '',
    from_email_name: 'ZepEx Notifications',
    use_tls: true,
    is_active: true,
  })
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
    if (settings.base_currency_code) {
      setFinanceSelectedCurrency({
        id: settings.base_currency,
        code: settings.base_currency_code,
        name: settings.base_currency_name || settings.base_currency_code,
        flag: settings.base_currency_flag || '',
      })
    }
    setFinanceLoaded(true)
  }

  useEffect(() => {
    async function loadSettings() {
      setLoading(true)
      try {
        const [emailResult, smtpResult, financeResult] = await Promise.allSettled([
          getReimbursementEmailConfig(),
          getSmtpConfig(),
          getFinanceSettings(),
        ])

        if (emailResult.status === 'fulfilled') {
          const emailData = emailResult.value.data
          if ('email_address' in emailData) {
            setEmailForm((f) => ({
              ...f,
              email_address: emailData.email_address,
              imap_host: emailData.imap_host,
              imap_port: String(emailData.imap_port),
              imap_username: emailData.imap_username,
            }))
          }
        }

        if (smtpResult.status === 'fulfilled') {
          const smtpData = smtpResult.value.data
          if ('smtp_host' in smtpData) {
            setSmtpForm((f) => ({
              ...f,
              smtp_host: smtpData.smtp_host,
              smtp_port: String(smtpData.smtp_port),
              smtp_email: smtpData.smtp_email,
              from_email_name: smtpData.from_email_name,
              use_tls: smtpData.use_tls,
              is_active: smtpData.is_active,
            }))
          }
        }

        if (financeResult.status === 'fulfilled' && financeResult.value.data.settings) {
          applyFinanceSettings(financeResult.value.data.settings)
        }
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  const imapConfigured = Boolean(emailForm.email_address.trim())
  const smtpConfigured = Boolean(smtpForm.smtp_host.trim() && smtpForm.smtp_email.trim())

  const settingsRows = useMemo(
    () => [
      {
        id: 'imap' as const,
        title: 'Reimbursement email (IMAP)',
        description: 'Fetch expense receipts from a shared inbox.',
        summary: emailForm.email_address || 'Not configured',
        configured: imapConfigured,
        icon: Mail,
      },
      {
        id: 'smtp' as const,
        title: 'SMTP notifications',
        description: 'Outgoing email for status updates and invites.',
        summary: smtpForm.smtp_email || 'Not configured',
        configured: smtpConfigured,
        icon: Mail,
      },
      {
        id: 'finance' as const,
        title: 'Finance settings',
        description: 'Base currency, conversion, and display preferences.',
        summary: financeCurrencyLabel || 'Not configured',
        configured: financeLoaded,
        icon: Wallet,
      },
    ],
    [
      emailForm.email_address,
      smtpForm.smtp_email,
      financeCurrencyLabel,
      imapConfigured,
      smtpConfigured,
      financeLoaded,
    ],
  )

  const closeModal = () => {
    setActiveSection(null)
    setError('')
  }

  const saveEmail = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await saveReimbursementEmailConfig({
        ...emailForm,
        imap_port: parseInt(emailForm.imap_port, 10),
      })
      toast.success('Reimbursement email config saved.')
      invalidateAdminSetupCache()
      closeModal()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const saveSmtp = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await saveSmtpConfig({
        ...smtpForm,
        smtp_port: parseInt(smtpForm.smtp_port, 10),
      })
      toast.success('SMTP config saved.')
      invalidateAdminSetupCache()
      closeModal()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
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
      closeModal()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const fetchEmails = async () => {
    setSaving(true)
    setError('')
    try {
      const { data } = await triggerEmailFetch()
      toast.success(
        `Processed ${data.processed_count} emails (${data.skipped_count} skipped).`,
      )
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
        subtitle="Email, finance & notifications"
        breadcrumb="Settings"
        icon={Settings}
        navItems={navItems}
      >
        <AdminListPanelShimmer rows={3} />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Settings"
      subtitle="Email, finance & notifications"
      breadcrumb="Settings"
      icon={Settings}
      navItems={navItems}
    >
      {error && !activeSection && (
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
                  setActiveSection(row.id)
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

      <Dialog open={activeSection === 'imap'} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Reimbursement email (IMAP)</DialogTitle>
            <DialogDescription>Fetch expense receipts from a shared inbox.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveEmail} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="imap-email">Email address</Label>
              <Input
                id="imap-email"
                type="email"
                value={emailForm.email_address}
                onChange={(e) => setEmailForm({ ...emailForm, email_address: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
              <div className="space-y-2">
                <Label htmlFor="imap-host">IMAP host</Label>
                <Input
                  id="imap-host"
                  value={emailForm.imap_host}
                  onChange={(e) => setEmailForm({ ...emailForm, imap_host: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imap-port">Port</Label>
                <Input
                  id="imap-port"
                  inputMode="numeric"
                  value={emailForm.imap_port}
                  onChange={(e) => setEmailForm({ ...emailForm, imap_port: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="imap-username">Username</Label>
              <Input
                id="imap-username"
                value={emailForm.imap_username}
                onChange={(e) => setEmailForm({ ...emailForm, imap_username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imap-password">Password / app password</Label>
              <PasswordInput
                id="imap-password"
                value={emailForm.imap_password}
                onChange={(e) => setEmailForm({ ...emailForm, imap_password: e.target.value })}
                placeholder="Enter app password"
              />
            </div>
            {error && activeSection === 'imap' && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <AdminModalFooter
              onCancel={closeModal}
              submitLabel="Save email config"
              submitting={saving}
              extra={
                <Button type="button" variant="outline" onClick={fetchEmails} disabled={saving}>
                  Trigger email fetch
                </Button>
              }
            />
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={activeSection === 'smtp'} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>SMTP notifications</DialogTitle>
            <DialogDescription>Outgoing email for status updates and invites.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveSmtp} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
              <div className="space-y-2">
                <Label htmlFor="smtp-host">SMTP host</Label>
                <Input
                  id="smtp-host"
                  value={smtpForm.smtp_host}
                  onChange={(e) => setSmtpForm({ ...smtpForm, smtp_host: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-port">Port</Label>
                <Input
                  id="smtp-port"
                  inputMode="numeric"
                  value={smtpForm.smtp_port}
                  onChange={(e) => setSmtpForm({ ...smtpForm, smtp_port: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-email">SMTP email</Label>
              <Input
                id="smtp-email"
                type="email"
                value={smtpForm.smtp_email}
                onChange={(e) => setSmtpForm({ ...smtpForm, smtp_email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-password">Password</Label>
              <PasswordInput
                id="smtp-password"
                value={smtpForm.smtp_password}
                onChange={(e) => setSmtpForm({ ...smtpForm, smtp_password: e.target.value })}
                placeholder="Enter SMTP password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-from-name">From name</Label>
              <Input
                id="smtp-from-name"
                value={smtpForm.from_email_name}
                onChange={(e) => setSmtpForm({ ...smtpForm, from_email_name: e.target.value })}
              />
            </div>
            {error && activeSection === 'smtp' && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <AdminModalFooter
              onCancel={closeModal}
              submitLabel="Save SMTP config"
              submitting={saving}
            />
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={activeSection === 'finance'} onOpenChange={(open) => !open && closeModal()}>
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
            {error && activeSection === 'finance' && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <AdminModalFooter
              onCancel={closeModal}
              submitLabel={financeLoaded ? 'Save finance settings' : 'Initialize finance settings'}
              submitDisabled={!financeForm.base_currency}
              submitting={saving}
            />
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
