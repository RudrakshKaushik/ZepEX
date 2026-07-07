import { ChevronRight, Settings, Wallet } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { getFinanceSettings, updateFinanceSettings } from '@/api'
import { getApiErrorMessage } from '@/api/client'
import { AdminListPanel } from '@/components/admin/AdminListPanel'
import { AdminModalFooter } from '@/components/admin/AdminModalFooter'
import { CurrencySelect } from '@/components/admin/CurrencySelect'
import { StatusBadge } from '@/components/StatusBadge'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAdminNav } from '@/hooks/useAdminNav'
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
import type { FinanceSettings } from '@/types'

const DATE_FORMAT_OPTIONS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] as const

const selectClassName =
  'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm'

export function SettingsPage() {
  const { navItems } = useAdminNav()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [financeOpen, setFinanceOpen] = useState(false)
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

  useEffect(() => {
    async function loadSettings() {
      setLoading(true)
      try {
        const { data } = await getFinanceSettings()
        if (data.settings) {
          applyFinanceSettings(data.settings)
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
    ],
    [financeCurrencyLabel, financeLoaded],
  )

  const closeModal = () => {
    setFinanceOpen(false)
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
      closeModal()
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
        subtitle="Finance & display preferences"
        breadcrumb="Settings"
        icon={Settings}
        navItems={navItems}
      >
        <AdminListPanelShimmer rows={1} />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Settings"
      subtitle="Finance & display preferences"
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
                  setFinanceOpen(true)
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

      <Dialog open={financeOpen} onOpenChange={(open) => !open && closeModal()}>
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
