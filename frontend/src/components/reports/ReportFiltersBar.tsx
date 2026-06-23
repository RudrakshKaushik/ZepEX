import { Search, X } from 'lucide-react'
import type {
  AdminReportFilters,
  ApprovalReportFilters,
  EmployeeExpenseFilters,
} from '@/lib/reportFilters'
import { REPORT_STATUS_OPTIONS } from '@/lib/reportFilters'
import type { DepartmentRecord, EmployeeRecord } from '@/types'
import { FilterTogglePanel } from '@/components/ui/FilterTogglePanel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const selectClassName =
  'flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

type ReportFiltersBarProps =
  | {
      mode: 'approval'
      values: ApprovalReportFilters
      onChange: (values: ApprovalReportFilters) => void
      departments?: DepartmentRecord[]
      employees?: EmployeeRecord[]
      onApply: () => void
      onClear: () => void
      disabled?: boolean
    }
  | {
      mode: 'admin'
      values: AdminReportFilters
      onChange: (values: AdminReportFilters) => void
      departments?: DepartmentRecord[]
      employees?: EmployeeRecord[]
      onApply: () => void
      onClear: () => void
      disabled?: boolean
    }
  | {
      mode: 'employee'
      values: EmployeeExpenseFilters
      onChange: (values: EmployeeExpenseFilters) => void
      onApply: () => void
      onClear: () => void
      disabled?: boolean
    }

export function ReportFiltersBar(props: ReportFiltersBarProps) {
  const { mode, onApply, onClear, disabled } = props

  return (
    <FilterTogglePanel>
      <div className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
          <Search className="h-4 w-4" />
          Search &amp; filters
        </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {mode === 'employee' && (
          <div className="space-y-1.5">
            <Label htmlFor="filter-status">Status</Label>
            <select
              id="filter-status"
              className={selectClassName}
              value={props.values.status ?? ''}
              onChange={(e) => props.onChange({ ...props.values, status: e.target.value })}
              disabled={disabled}
            >
              <option value="">All statuses</option>
              {REPORT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {(mode === 'approval' || mode === 'admin') && props.employees && (
          <div className="space-y-1.5">
            <Label htmlFor="filter-employee">Employee</Label>
            <select
              id="filter-employee"
              className={selectClassName}
              value={props.values.employee_id ?? ''}
              onChange={(e) => props.onChange({ ...props.values, employee_id: e.target.value })}
              disabled={disabled}
            >
              <option value="">All employees</option>
              {props.employees.map((employee) => (
                <option key={employee.id} value={String(employee.id)}>
                  {employee.first_name} {employee.last_name} ({employee.email})
                </option>
              ))}
            </select>
          </div>
        )}

        {(mode === 'approval' || mode === 'admin') && (
          <div className="space-y-1.5">
            <Label htmlFor="filter-email">Employee email</Label>
            <Input
              id="filter-email"
              type="search"
              placeholder="Search by email"
              value={props.values.employee_email ?? ''}
              onChange={(e) =>
                props.onChange({ ...props.values, employee_email: e.target.value })
              }
              disabled={disabled}
            />
          </div>
        )}

        {(mode === 'approval' || mode === 'admin') && props.departments && (
          <div className="space-y-1.5">
            <Label htmlFor="filter-department">Department</Label>
            <select
              id="filter-department"
              className={selectClassName}
              value={props.values.department_id ?? ''}
              onChange={(e) => props.onChange({ ...props.values, department_id: e.target.value })}
              disabled={disabled}
            >
              <option value="">All departments</option>
              {props.departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="filter-start-date">From date</Label>
          <Input
            id="filter-start-date"
            type="date"
            value={props.values.start_date ?? ''}
            onChange={(e) => props.onChange({ ...props.values, start_date: e.target.value })}
            disabled={disabled}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-end-date">To date</Label>
          <Input
            id="filter-end-date"
            type="date"
            value={props.values.end_date ?? ''}
            onChange={(e) => props.onChange({ ...props.values, end_date: e.target.value })}
            disabled={disabled}
          />
        </div>

        {(mode === 'approval' || mode === 'employee') && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="filter-min-amount">Min amount</Label>
              <Input
                id="filter-min-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={props.values.min_amount ?? ''}
                onChange={(e) => props.onChange({ ...props.values, min_amount: e.target.value })}
                disabled={disabled}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="filter-max-amount">Max amount</Label>
              <Input
                id="filter-max-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={props.values.max_amount ?? ''}
                onChange={(e) => props.onChange({ ...props.values, max_amount: e.target.value })}
                disabled={disabled}
              />
            </div>
          </>
        )}
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
