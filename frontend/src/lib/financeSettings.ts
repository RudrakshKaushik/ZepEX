import type { FinanceSettings } from '@/types'

export function financeCurrencyLabel(
  settings: Pick<
    FinanceSettings,
    'base_currency_code' | 'base_currency_flag' | 'base_currency_details'
  >,
): string {
  const code = settings.base_currency_details?.code ?? settings.base_currency_code
  const flag = settings.base_currency_details?.flag ?? settings.base_currency_flag
  if (!code) return ''
  return `${flag || ''} ${code}`.trim()
}

export function financeCurrencyCode(
  settings: Pick<FinanceSettings, 'base_currency_code' | 'base_currency_details'> | null | undefined,
): string {
  return settings?.base_currency_details?.code ?? settings?.base_currency_code ?? 'INR'
}

