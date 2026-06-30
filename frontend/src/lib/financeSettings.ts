import type { FinanceSettings } from '@/types'

export function financeCurrencyLabel(
  settings: Pick<FinanceSettings, 'base_currency_code' | 'base_currency_flag'>,
): string {
  if (!settings.base_currency_code) return ''
  return `${settings.base_currency_flag || ''} ${settings.base_currency_code}`.trim()
}
