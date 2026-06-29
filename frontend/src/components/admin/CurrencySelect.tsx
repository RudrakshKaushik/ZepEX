import { useEffect, useState } from 'react'
import { listCurrencies } from '@/api'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Currency } from '@/types'

const selectClassName =
  'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm'

interface CurrencySelectProps {
  value: number | ''
  onChange: (currencyId: number) => void
  disabled?: boolean
  label?: string
}

export function CurrencySelect({
  value,
  onChange,
  disabled,
  label = 'Base currency',
}: CurrencySelectProps) {
  const [search, setSearch] = useState('')
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(true)
      listCurrencies({ search: search || undefined, page_size: 50, is_active: 'true' })
        .then((res) => setCurrencies(res.data.results))
        .catch(() => setCurrencies([]))
        .finally(() => setLoading(false))
    }, 250)

    return () => window.clearTimeout(timer)
  }, [search])

  const selected = currencies.find((c) => c.id === value)

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search currencies…"
        disabled={disabled}
      />
      <select
        className={selectClassName}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        disabled={disabled || loading}
      >
        <option value="">{loading ? 'Loading…' : 'Select currency'}</option>
        {selected && !currencies.some((c) => c.id === selected.id) && (
          <option value={selected.id}>
            {selected.flag} {selected.code} — {selected.name}
          </option>
        )}
        {currencies.map((currency) => (
          <option key={currency.id} value={currency.id}>
            {currency.flag} {currency.code} — {currency.name}
          </option>
        ))}
      </select>
    </div>
  )
}
