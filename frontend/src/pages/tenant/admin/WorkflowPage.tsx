import { GitBranch, Plus, PowerOff } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { isAxiosError } from 'axios'
import {
  addWorkflowStep,
  deactivateWorkflowStep,
  getApprovalWorkflow,
  listCompanyRoles,
  listDepartments,
  saveApprovalWorkflow,
} from '@/api'
import { getApiErrorMessage } from '@/api/client'
import { AdminDataTable, AdminTableCell, AdminTableRow } from '@/components/admin/AdminDataTable'
import { AdminListPanel } from '@/components/admin/AdminListPanel'
import { AdminModalFooter } from '@/components/admin/AdminModalFooter'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { invalidateAdminSetupCache, useAdminNav } from '@/hooks/useAdminNav'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageLoader } from '@/components/ui/spinner'
import type { ApprovalWorkflow, CompanyRole, DepartmentRecord } from '@/types'

const selectClassName =
  'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm'

export function WorkflowPage() {
  const { navItems } = useAdminNav()
  const [workflow, setWorkflow] = useState<ApprovalWorkflow | null>(null)
  const [roles, setRoles] = useState<CompanyRole[]>([])
  const [departments, setDepartments] = useState<DepartmentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [workflowName, setWorkflowName] = useState('Default Approval Workflow')
  const [stepForm, setStepForm] = useState({
    step_order: '1',
    approver_role_id: '',
    routing_type: 'COMPANY' as 'COMPANY' | 'DEPARTMENT',
    department_id: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [rolesRes, deptRes] = await Promise.all([listCompanyRoles(), listDepartments()])
      setRoles(rolesRes.data.results.filter((r) => r.is_active))
      setDepartments(deptRes.data.filter((d) => d.is_active !== false))

      try {
        const { data } = await getApprovalWorkflow()
        setWorkflow(data)
      } catch (err) {
        if (isAxiosError(err) && err.response?.status === 404) {
          setWorkflow(null)
        } else {
          throw err
        }
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const activeSteps = (workflow?.steps ?? [])
    .filter((s) => s.is_active)
    .sort((a, b) => a.step_order - b.step_order)

  const approverRoles = roles.filter(
    (r) => r.can_approve_expense || r.can_mark_paid,
  )

  const nextStepOrder = activeSteps.length
    ? Math.max(...activeSteps.map((s) => s.step_order)) + 1
    : 1

  const handleCreateWorkflow = async () => {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const { data } = await saveApprovalWorkflow(workflowName)
      setWorkflow(data.workflow)
      setMessage('Approval workflow created. Add at least one step below.')
      invalidateAdminSetupCache()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleCreateDefault = async () => {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const managerRole = roles.find((r) => r.can_approve_expense)
      const accountsRole = roles.find((r) => r.can_mark_paid)

      if (!managerRole) {
        setError('Create a company role with "approve expense" permission first (Admin → Roles).')
        return
      }

      const { data } = await saveApprovalWorkflow('Default Approval Workflow')
      let wf = data.workflow

      await addWorkflowStep({
        step_order: 1,
        approver_role: managerRole.id,
        routing_type: 'COMPANY',
      })

      if (accountsRole) {
        await addWorkflowStep({
          step_order: 2,
          approver_role: accountsRole.id,
          routing_type: 'COMPANY',
        })
      }

      const refreshed = await getApprovalWorkflow()
      wf = refreshed.data
      setWorkflow(wf)
      setMessage(
        accountsRole
          ? 'Default workflow created: Manager approves (step 1), Accounts pays (step 2).'
          : 'Workflow created with manager approval step. Add an Accounts step when ready.',
      )
      invalidateAdminSetupCache()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const openAddStep = () => {
    setStepForm({
      step_order: String(nextStepOrder),
      approver_role_id: approverRoles[0] ? String(approverRoles[0].id) : '',
      routing_type: 'COMPANY',
      department_id: '',
    })
    setError('')
    setAddOpen(true)
  }

  const handleAddStep = async (e: FormEvent) => {
    e.preventDefault()
    if (!workflow) return
    setSaving(true)
    setError('')
    try {
      await addWorkflowStep({
        step_order: parseInt(stepForm.step_order, 10),
        approver_role: parseInt(stepForm.approver_role_id, 10),
        routing_type: stepForm.routing_type,
        department:
          stepForm.routing_type === 'DEPARTMENT' ? stepForm.department_id || null : null,
      })
      const { data } = await getApprovalWorkflow()
      setWorkflow(data)
      setAddOpen(false)
      setMessage('Workflow step added.')
      invalidateAdminSetupCache()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivateStep = async (stepId: string) => {
    setSaving(true)
    setError('')
    try {
      await deactivateWorkflowStep(stepId)
      const { data } = await getApprovalWorkflow()
      setWorkflow(data)
      setMessage('Step deactivated.')
      invalidateAdminSetupCache()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoader />

  return (
    <DashboardLayout
      title="Approval Workflow"
      subtitle="Define who approves expense reports and in what order"
      breadcrumb="Approval Workflow"
      icon={GitBranch}
      navItems={navItems}
      headerAction={
        workflow ? (
          <Button onClick={openAddStep} disabled={saving || approverRoles.length === 0}>
            <Plus className="h-4 w-4" />
            Add Step
          </Button>
        ) : undefined
      }
    >
      {message && (
        <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          {message}
        </div>
      )}
      {error && !addOpen && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {!workflow ? (
        <AdminListPanel
          title="Configure Workflow"
          description="Expense reports route through these steps after employees submit. You need at least one step with a role that can approve expenses."
        >
          <div className="space-y-4 px-5 py-6 sm:px-6">
            {approverRoles.length === 0 && (
              <p className="text-sm text-orange-700">
                No approver roles found. Go to Admin → Roles and create roles with approve or
                payment permissions first.
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="workflow-name">Workflow name</Label>
              <Input
                id="workflow-name"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button disabled={saving} onClick={handleCreateWorkflow}>
                Create Workflow
              </Button>
              <Button
                variant="outline"
                disabled={saving || !roles.some((r) => r.can_approve_expense)}
                onClick={handleCreateDefault}
              >
                Create Default (Manager → Accounts)
              </Button>
            </div>
          </div>
        </AdminListPanel>
      ) : (
        <>
          <div className="mb-4 rounded-lg border border-[#e2e8f0] bg-white px-5 py-4 sm:px-6">
            <p className="text-sm text-gray-500">Active workflow</p>
            <p className="text-lg font-semibold text-gray-900">{workflow.name}</p>
          </div>

          <AdminListPanel
            title="Workflow Steps"
            count={activeSteps.length}
            description="Reports move through each step in order. Step 1 is first approver, step 2 is next, and so on."
          >
            {activeSteps.length === 0 ? (
              <p className="px-5 py-8 text-sm text-gray-400 sm:px-6">
                No active steps. Add a step to complete workflow setup.
              </p>
            ) : (
              <AdminDataTable columns={['Order', 'Approver Role', 'Routing', 'Department', '']}>
                {activeSteps.map((step) => (
                  <AdminTableRow key={step.id}>
                    <AdminTableCell className="font-semibold text-gray-900">
                      {step.step_order}
                    </AdminTableCell>
                    <AdminTableCell>{step.approver_role_name}</AdminTableCell>
                    <AdminTableCell className="text-gray-600">
                      {step.routing_type === 'COMPANY' ? 'Company wide' : 'Department based'}
                    </AdminTableCell>
                    <AdminTableCell className="text-gray-500">
                      {step.department_name || '—'}
                    </AdminTableCell>
                    <AdminTableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={saving}
                        onClick={() => handleDeactivateStep(step.id)}
                      >
                        <PowerOff className="h-3.5 w-3.5" />
                      </Button>
                    </AdminTableCell>
                  </AdminTableRow>
                ))}
              </AdminDataTable>
            )}
          </AdminListPanel>
        </>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Workflow Step</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddStep} className="space-y-3">
            <div className="space-y-2">
              <Label>Step order</Label>
              <Input
                type="number"
                min={1}
                value={stepForm.step_order}
                onChange={(e) => setStepForm({ ...stepForm, step_order: e.target.value })}
                required
              />
              <p className="text-xs text-gray-500">
                Lower numbers run first (e.g. 1 = manager, 2 = accounts).
              </p>
            </div>
            <div className="space-y-2">
              <Label>Approver role</Label>
              <select
                className={selectClassName}
                value={stepForm.approver_role_id}
                onChange={(e) =>
                  setStepForm({ ...stepForm, approver_role_id: e.target.value })
                }
                required
              >
                <option value="">Select role</option>
                {approverRoles.map((r) => (
                  <option key={r.id} value={String(r.id)}>
                    {r.name}
                    {r.can_approve_expense ? ' · can approve' : ''}
                    {r.can_mark_paid ? ' · can mark paid' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Routing</Label>
              <select
                className={selectClassName}
                value={stepForm.routing_type}
                onChange={(e) =>
                  setStepForm({
                    ...stepForm,
                    routing_type: e.target.value as 'COMPANY' | 'DEPARTMENT',
                  })
                }
              >
                <option value="COMPANY">Company wide</option>
                <option value="DEPARTMENT">Department based</option>
              </select>
            </div>
            {stepForm.routing_type === 'DEPARTMENT' && (
              <div className="space-y-2">
                <Label>Department</Label>
                <select
                  className={selectClassName}
                  value={stepForm.department_id}
                  onChange={(e) =>
                    setStepForm({ ...stepForm, department_id: e.target.value })
                  }
                  required
                >
                  <option value="">Select department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {error && addOpen && <p className="text-sm text-red-600">{error}</p>}
            <AdminModalFooter
              onCancel={() => setAddOpen(false)}
              submitLabel="Add Step"
              submitting={saving}
            />
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
