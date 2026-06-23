import { Search, X } from 'lucide-react'
import {
  AUDIT_ACTION_OPTIONS,
  type AuditLogFilters,
} from '@/lib/auditFilters'
import type { EmployeeRecord } from '@/types'
import { FilterTogglePanel } from '@/components/ui/FilterTogglePanel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const selectClassName =
  'flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

interface AuditLogFiltersBarProps {
  values: AuditLogFilters
  onChange: (values: AuditLogFilters) => void
  employees?: EmployeeRecord[]
  companies?: Array<{ id: string; name: string }>
  onApply: () => void
  onClear: () => void
  disabled?: boolean
}

export function AuditLogFiltersBar({
  values,
  onChange,
  employees,
  companies,
  onApply,
  onClear,
  disabled,
}: AuditLogFiltersBarProps) {
  return (
    <FilterTogglePanel>
      <div className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
          <Search className="h-4 w-4" />
          Search &amp; filters
        </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="audit-filter-action">Action</Label>
          <select
            id="audit-filter-action"
            className={selectClassName}
            value={values.action ?? ''}
            onChange={(e) => onChange({ ...values, action: e.target.value })}
            disabled={disabled}
          >
            <option value="">All actions</option>
            {AUDIT_ACTION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {companies && (
          <div className="space-y-1.5">
            <Label htmlFor="audit-filter-company">Company</Label>
            <select
              id="audit-filter-company"
              className={selectClassName}
              value={values.company_id ?? ''}
              onChange={(e) => onChange({ ...values, company_id: e.target.value })}
              disabled={disabled}
            >
              <option value="">All companies</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {employees && (
          <div className="space-y-1.5">
            <Label htmlFor="audit-filter-user">User</Label>
            <select
              id="audit-filter-user"
              className={selectClassName}
              value={values.user_id ?? ''}
              onChange={(e) => onChange({ ...values, user_id: e.target.value })}
              disabled={disabled}
            >
              <option value="">All users</option>
              {employees.map((employee) => (
                <option key={employee.id} value={String(employee.id)}>
                  {employee.first_name} {employee.last_name} ({employee.email})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="audit-filter-start-date">From date</Label>
          <Input
            id="audit-filter-start-date"
            type="date"
            value={values.start_date ?? ''}
            onChange={(e) => onChange({ ...values, start_date: e.target.value })}
            disabled={disabled}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="audit-filter-end-date">To date</Label>
          <Input
            id="audit-filter-end-date"
            type="date"
            value={values.end_date ?? ''}
            onChange={(e) => onChange({ ...values, end_date: e.target.value })}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={onApply} disabled={disabled}>
          <Search className="h-4 w-4" />
          Apply filters
        </Button>
        <Button size="sm" variant="outline" onClick={onClear} disabled={disabled}>
          <X className="h-4 w-4" />
          Clear
        </Button>
      </div>
      </div>
    </FilterTogglePanel>
  )
}
