import { GitBranch, UserCog } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { isAxiosError } from 'axios'
import {
  addWorkflowStep,
  deactivateWorkflowStep,
  getApprovalWorkflow,
  listCompanyRoles,
  listDepartments,
  saveApprovalWorkflow,
  updateWorkflowStep,
} from '@/api'
import { getApiErrorMessage } from '@/api/client'
import { AdminListPanel } from '@/components/admin/AdminListPanel'
import { WorkflowBuilder } from '@/components/workflow/WorkflowBuilder'
import type { ApprovalNodeData } from '@/components/workflow/types'
import type { WorkflowNode } from '@/components/workflow/types'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { invalidateAdminSetupCache, useAdminNav } from '@/hooks/useAdminNav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { WorkflowPageShimmer } from '@/components/ui/shimmer'
import { fetchAllPages } from '@/lib/pagination'
import { toast } from '@/lib/toast'
import type { ApprovalWorkflow, ApprovalWorkflowStep, CompanyRole, DepartmentRecord } from '@/types'
import UploadIcon from '@/assets/upload.png'

function getActiveSteps(workflow: ApprovalWorkflow | null): ApprovalWorkflowStep[] {
  return (workflow?.steps ?? [])
    .filter((step) => step.is_active)
    .sort((a, b) => a.step_order - b.step_order)
}

function resolveCanvasStepIds(
  orderedNodes: WorkflowNode[],
  activeSteps: ApprovalWorkflowStep[],
): Array<string | undefined> {
  const usedStepIds = new Set<string>()

  return orderedNodes.map((node) => {
    const data = node.data as ApprovalNodeData

    if (data.backendStepId) {
      usedStepIds.add(data.backendStepId)
      return data.backendStepId
    }

    const match = activeSteps.find(
      (step) =>
        !usedStepIds.has(step.id) &&
        step.approver_role === data.roleId &&
        step.routing_type === data.routingType &&
        (step.department || null) === (data.departmentId || null),
    )

    if (match) {
      usedStepIds.add(match.id)
      return match.id
    }

    return undefined
  })
}

async function loadWorkflowState(): Promise<ApprovalWorkflow | null> {
  try {
    const { data } = await getApprovalWorkflow()
    return data
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 404) {
      return null
    }
    throw err
  }
}

export function WorkflowPage() {
  const { navItems } = useAdminNav()
  const [workflow, setWorkflow] = useState<ApprovalWorkflow | null>(null)
  const [roles, setRoles] = useState<CompanyRole[]>([])
  const [departments, setDepartments] = useState<DepartmentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [workflowName, setWorkflowName] = useState('Default Approval Workflow')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [rolesRes, allDepartments, workflowData] = await Promise.all([
        listCompanyRoles(),
        fetchAllPages((page) => listDepartments({ page })),
        loadWorkflowState(),
      ])
      setRoles(rolesRes.data.results.filter((r) => r.is_active))
      setDepartments(allDepartments.filter((d) => d.is_active !== false))
      setWorkflow(workflowData)
      if (workflowData?.name) {
        setWorkflowName(workflowData.name)
      }
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const refreshWorkflow = useCallback(async () => {
    const workflowData = await loadWorkflowState()
    setWorkflow(workflowData)
    return workflowData
  }, [])

  const activeSteps = (workflow?.steps ?? [])
    .filter((s) => s.is_active)
    .sort((a, b) => a.step_order - b.step_order)

  const approverRoles = roles.filter(
    (r) => r.can_approve_expense || r.can_mark_paid,
  )

  const handleCreateWorkflow = async () => {
    if (approverRoles.length === 0) return

    setSaving(true)
    setError('')
    try {
      await saveApprovalWorkflow(workflowName)
      const workflowData = await refreshWorkflow()
      if (!workflowData) {
        throw new Error('Workflow was saved but could not be loaded.')
      }
      toast.success('Approval workflow created. Build your flow on the canvas below.')
      invalidateAdminSetupCache()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleCreateDefault = async () => {
    setSaving(true)
    setError('')
    try {
      const managerRole = roles.find((r) => r.can_approve_expense)
      const accountsRole = roles.find((r) => r.can_mark_paid)

      if (!managerRole) {
        toast.error('Create a company role with approve expense permission first.')
        return
      }

      await saveApprovalWorkflow('Default Approval Workflow')

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

      await refreshWorkflow()
      toast.success(
        accountsRole
          ? 'Default workflow created on canvas: Manager → Accounts.'
          : 'Workflow created with manager approval step.',
      )
      invalidateAdminSetupCache()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteStep = async (stepId: string) => {
    setSaving(true)
    setError('')
    try {
      await deactivateWorkflowStep(stepId)
      await refreshWorkflow()
      toast.success('Step removed from workflow.')
      invalidateAdminSetupCache()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
      throw err
    } finally {
      setSaving(false)
    }
  }

  const handleSaveStepsFromCanvas = async (approvalNodes: WorkflowNode[]) => {
    setSaving(true)
    setError('')
    try {
      for (const node of approvalNodes) {
        const data = node.data as ApprovalNodeData
        if (!data.roleId) {
          toast.error(`Approval node "${data.label}" needs a company role before saving.`)
          return
        }
      }

      const canvasStepIds = new Set(
        approvalNodes
          .map((node) => (node.data as ApprovalNodeData).backendStepId)
          .filter((id): id is string => Boolean(id)),
      )

      for (const step of activeSteps) {
        if (!canvasStepIds.has(step.id)) {
          await deactivateWorkflowStep(step.id)
        }
      }

      let workflowData = await refreshWorkflow()
      let currentActive = getActiveSteps(workflowData)

      const newNodes = approvalNodes.filter(
        (node) => !(node.data as ApprovalNodeData).backendStepId,
      )

      if (newNodes.length > 0) {
        let nextOrder =
          currentActive.length > 0
            ? Math.max(...currentActive.map((step) => step.step_order)) + 1
            : 1

        for (const node of newNodes) {
          const data = node.data as ApprovalNodeData
          await addWorkflowStep({
            step_order: nextOrder,
            approver_role: data.roleId!,
            routing_type: data.routingType,
            department: data.routingType === 'DEPARTMENT' ? data.departmentId || null : null,
          })
          nextOrder += 1
        }

        workflowData = await refreshWorkflow()
        currentActive = getActiveSteps(workflowData)
      }

      let stepIds = resolveCanvasStepIds(approvalNodes, currentActive)

      for (let index = 0; index < approvalNodes.length; index += 1) {
        const stepId = stepIds[index]
        if (!stepId) continue

        const data = approvalNodes[index].data as ApprovalNodeData
        const step = currentActive.find((item) => item.id === stepId)
        if (!step) continue

        const targetOrder = index + 1
        const targetDepartment =
          data.routingType === 'DEPARTMENT' ? data.departmentId || null : null
        const orderChanged = step.step_order !== targetOrder
        const fieldsChanged =
          step.approver_role !== data.roleId ||
          step.routing_type !== data.routingType ||
          (step.department || null) !== (targetDepartment || null)

        if (!orderChanged && !fieldsChanged) continue

        await updateWorkflowStep(stepId, {
          step_order: targetOrder,
          approver_role: data.roleId!,
          routing_type: data.routingType,
          department: targetDepartment,
        })

        if (orderChanged) {
          workflowData = await refreshWorkflow()
          currentActive = getActiveSteps(workflowData)
          stepIds = resolveCanvasStepIds(approvalNodes, currentActive)
        }
      }

      workflowData = await refreshWorkflow()
      if (!workflowData) {
        throw new Error('Workflow was saved but could not be loaded.')
      }
      toast.success('Workflow saved.')
      invalidateAdminSetupCache()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout
        title="Approval Workflow"
        subtitle="Define who approves expense reports and in what order"
        breadcrumb="Approval Workflow"
        icon={GitBranch}
        navItems={navItems}
      >
        <WorkflowPageShimmer />
      </DashboardLayout>
    )
  }

  const needsRolesFirst = approverRoles.length === 0

  return (
    <DashboardLayout
      title="Approval Workflow"
      subtitle="Define who approves expense reports and in what order"
      breadcrumb="Approval Workflow"
      icon={GitBranch}
      navItems={navItems}
    >
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {!workflow && needsRolesFirst ? (
        <AdminListPanel
          title="Roles required"
          description="Workflow steps need at least one company role that can approve expenses or mark reports as paid."
        >
          <div className="flex flex-col items-center px-5 py-12 text-center sm:px-6">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
              <UserCog className="h-7 w-7 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Please create a role first to create a workflow
            </h3>
            <p className="mt-2 max-w-md text-sm text-gray-500">
              Go to Roles and add permission profiles with approve or payment access, then return
              here to build your approval flow.
            </p>
            <Button asChild className="mt-6">
              <Link to="/admin/roles">Go to Roles</Link>
            </Button>
          </div>
        </AdminListPanel>
      ) : !workflow ? (
        <AdminListPanel
          title="Configure Workflow"
          description="Expense reports route through these steps after employees submit. You need at least one step with a role that can approve expenses."
        >
          <div className="space-y-4 px-5 py-6 sm:px-6">
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
                <img src={UploadIcon} alt="Assign" className="w-6 h-6" />
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
        <WorkflowBuilder
          steps={activeSteps}
          roles={roles}
          departments={departments}
          saving={saving}
          onSaveSteps={handleSaveStepsFromCanvas}
          onDeleteStep={handleDeleteStep}
        />
      )}
    </DashboardLayout>
  )
}
