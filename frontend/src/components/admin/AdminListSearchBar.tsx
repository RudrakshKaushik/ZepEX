import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface AdminListSearchBarProps {
  value: string
  onChange: (value: string) => void
  onApply: () => void
  onClear: () => void
  placeholder?: string
  disabled?: boolean
}

export function AdminListSearchBar({
  value,
  onChange,
  onApply,
  onClear,
  placeholder = 'Search…',
  disabled,
}: AdminListSearchBarProps) {
  return (
    <div className="flex w-full flex-wrap items-center gap-2">
      <div className="relative min-w-0 w-full flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onApply()}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-9"
        />
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onApply} disabled={disabled}>
        Search
      </Button>
      {value.trim() && (
        <Button type="button" variant="ghost" size="sm" onClick={onClear} disabled={disabled}>
          <X className="h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  )
}
