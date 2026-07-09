import { useState } from 'react'
import { simulateWorkflow } from '@/api'
import { getApiErrorMessage } from '@/api/client'
import { AdminListPanel } from '@/components/admin/AdminListPanel'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import type { EmployeeRecord, WorkflowSimulateResponse } from '@/types'

const selectClassName =
  'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm'

interface WorkflowSimulationPanelProps {
  employees: EmployeeRecord[]
  disabled?: boolean
}

function employeeLabel(employee: EmployeeRecord): string {
  const name = `${employee.first_name} ${employee.last_name}`.trim()
  const role = employee.company_role_name ? ` · ${employee.company_role_name}` : ''
  return `${name || employee.email}${role}`
}

export function WorkflowSimulationPanel({
  employees,
  disabled,
}: WorkflowSimulationPanelProps) {
  const [employeeId, setEmployeeId] = useState<number | ''>('')
  const [result, setResult] = useState<WorkflowSimulateResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const activeEmployees = employees.filter((employee) => employee.is_active !== false)

  const handleSimulate = async () => {
    if (!employeeId) {
      toast.error('Select an employee to simulate.')
      return
    }

    setLoading(true)
    try {
      const { data } = await simulateWorkflow(employeeId)
      if (!data.success) {
        toast.error(data.error || 'Workflow simulation failed.')
        setResult(data)
        return
      }
      setResult(data)
    } catch (err) {
      toast.error(getApiErrorMessage(err))
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminListPanel
      title="Simulate workflow"
      description="Preview the approval path for an employee without creating a report."
    >
      <div className="space-y-4 px-5 py-4 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="simulate-employee">Employee</Label>
            <select
              id="simulate-employee"
              className={selectClassName}
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value ? Number(e.target.value) : '')}
              disabled={disabled || loading}
            >
              <option value="">Select employee</option>
              {activeEmployees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employeeLabel(employee)}
                </option>
              ))}
            </select>
          </div>
          <Button
            type="button"
            disabled={disabled || loading || !employeeId}
            onClick={handleSimulate}
          >
            {loading ? 'Simulating…' : 'Simulate'}
          </Button>
        </div>

        {result?.employee && (
          <div className="rounded-md border border-[#e2e8f0] bg-gray-50/60 px-4 py-3 text-sm">
            <p className="font-medium text-gray-900">{result.employee.name}</p>
            <p className="text-gray-600">{result.employee.email}</p>
            <p className="mt-1 text-gray-600">
              {result.employee.company_role ?? 'No role'}
              {result.employee.department ? ` · ${result.employee.department}` : ''}
              {result.employee.reporting_manager
                ? ` · Manager: ${result.employee.reporting_manager}`
                : ''}
            </p>
          </div>
        )}

        {result?.simulation && (
          <div className="space-y-3">
            <div className="text-sm">
              <p className="font-medium text-gray-900">{result.simulation.workflow_name}</p>
              <p className="text-gray-600">
                Start role: {result.simulation.start_role} · {result.simulation.total_steps} step
                {result.simulation.total_steps === 1 ? '' : 's'}
                {result.simulation.steps_skipped > 0
                  ? ` · ${result.simulation.steps_skipped} skipped`
                  : ''}
              </p>
            </div>

            <ol className="space-y-2">
              {result.simulation.flow.map((step) => {
                const skipped = step.status === 'SKIPPED'
                return (
                  <li
                    key={step.step_order}
                    className={cn(
                      'rounded-md border px-4 py-3 text-sm',
                      skipped
                        ? 'border-amber-200 bg-amber-50'
                        : 'border-[#e2e8f0] bg-white',
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-gray-900">
                        Step {step.step_order}
                      </span>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          skipped
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-50 text-blue-700',
                        )}
                      >
                        {step.status}
                      </span>
                    </div>
                    {skipped ? (
                      <p className="mt-1 text-gray-600">{step.reason ?? 'Skipped'}</p>
                    ) : (
                      <div className="mt-1 text-gray-600">
                        {step.approver_type && (
                          <p>
                            {step.approver_type}
                            {step.approver ? `: ${step.approver}` : ''}
                          </p>
                        )}
                        {step.email && <p className="text-xs text-gray-500">{step.email}</p>}
                      </div>
                    )}
                  </li>
                )
              })}
            </ol>
          </div>
        )}

        {result && !result.success && result.error && !result.simulation && (
          <p className="text-sm text-red-600">{result.error}</p>
        )}
      </div>
    </AdminListPanel>
  )
}
