import { Trash2 } from 'lucide-react'
import type { WorkflowNode } from '@/components/workflow/types'
import {
  CONDITION_OPERATORS,
  type ApprovalNodeData,
  type ConditionNodeData,
  type TriggerNodeData,
} from '@/components/workflow/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CompanyRole, DepartmentRecord } from '@/types'

const selectClassName =
  'flex h-9 w-full border border-neutral-900 bg-white px-2 text-sm text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900'

interface WorkflowNodeSidebarProps {
  selectedNode: WorkflowNode | null
  roles: CompanyRole[]
  departments: DepartmentRecord[]
  onUpdate: (nodeId: string, patch: Record<string, unknown>) => void
  onDelete: (nodeId: string) => void
  deleting?: boolean
}

export function WorkflowNodeSidebar({
  selectedNode,
  roles,
  departments,
  onUpdate,
  onDelete,
  deleting,
}: WorkflowNodeSidebarProps) {
  if (!selectedNode) {
    return (
      <aside className="flex max-h-[min(45vh,400px)] w-full flex-col bg-white lg:h-full lg:max-h-none">
        <div className="border-b border-neutral-900 px-4 py-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-900">
            Node config
          </h3>
        </div>
        <div className="flex flex-1 items-center justify-center p-6 text-center">
          <p className="text-sm text-neutral-500">
            Select a node on the canvas to edit its properties.
          </p>
        </div>
      </aside>
    )
  }

  const { id, type, data } = selectedNode
  const canDelete = type !== 'trigger'

  return (
    <aside className="flex max-h-[min(45vh,400px)] w-full flex-col bg-white lg:h-full lg:max-h-none">
      <div className="flex items-center justify-between border-b border-neutral-900 px-4 py-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-900">
            Node config
          </h3>
          <p className="mt-0.5 text-[10px] uppercase tracking-wide text-neutral-500">{type}</p>
        </div>
        {canDelete && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={deleting}
            onClick={() => onDelete(id)}
            className="h-8 rounded-none border-neutral-900 text-neutral-900 hover:bg-neutral-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        )}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {type === 'trigger' && (
          <TriggerFields
            data={data as TriggerNodeData}
            onChange={(patch) => onUpdate(id, patch)}
          />
        )}
        {type === 'approval' && (
          <ApprovalFields
            data={data as ApprovalNodeData}
            roles={roles}
            departments={departments}
            onChange={(patch) => onUpdate(id, patch)}
          />
        )}
        {type === 'condition' && (
          <ConditionFields
            data={data as ConditionNodeData}
            onChange={(patch) => onUpdate(id, patch)}
          />
        )}
      </div>
    </aside>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700">
      {children}
    </Label>
  )
}

function TriggerFields({
  data,
  onChange,
}: {
  data: TriggerNodeData
  onChange: (patch: Partial<TriggerNodeData>) => void
}) {
  return (
    <>
      <div className="space-y-1.5">
        <FieldLabel>Title</FieldLabel>
        <Input
          value={data.label}
          onChange={(e) => onChange({ label: e.target.value })}
          className="rounded-none border-neutral-900 focus-visible:ring-neutral-900"
        />
      </div>
      <div className="space-y-1.5">
        <FieldLabel>Trigger condition</FieldLabel>
        <Input
          value={data.condition}
          onChange={(e) => onChange({ condition: e.target.value })}
          className="rounded-none border-neutral-900 font-mono text-sm focus-visible:ring-neutral-900"
          placeholder="Expense > $0"
        />
      </div>
    </>
  )
}

function ApprovalFields({
  data,
  roles,
  departments,
  onChange,
}: {
  data: ApprovalNodeData
  roles: CompanyRole[]
  departments: DepartmentRecord[]
  onChange: (patch: Partial<ApprovalNodeData>) => void
}) {
  return (
    <>
      <div className="space-y-1.5">
        <FieldLabel>Step title</FieldLabel>
        <Input
          value={data.label}
          onChange={(e) => onChange({ label: e.target.value })}
          className="rounded-none border-neutral-900 focus-visible:ring-neutral-900"
        />
      </div>
      <div className="space-y-1.5">
        <FieldLabel>Role</FieldLabel>
        <select
          className={selectClassName}
          value={data.roleId ?? ''}
          onChange={(e) => {
            const roleId = e.target.value ? parseInt(e.target.value, 10) : null
            const role = roles.find((r) => r.id === roleId)
            onChange({
              roleId,
              roleName: role?.name ?? '',
            })
          }}
          required
        >
          <option value="">Select role</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <FieldLabel>Routing</FieldLabel>
        <select
          className={selectClassName}
          value={data.routingType}
          onChange={(e) => {
            const routingType = e.target.value as ApprovalNodeData['routingType']
            onChange({
              routingType,
              ...(routingType === 'COMPANY'
                ? { departmentId: null, departmentName: null }
                : {}),
            })
          }}
        >
          <option value="COMPANY">Company wide</option>
          <option value="DEPARTMENT">Department based</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <FieldLabel>Department</FieldLabel>
        <select
          className={selectClassName}
          value={data.departmentId ?? ''}
          disabled={data.routingType !== 'DEPARTMENT'}
          onChange={(e) => {
            const departmentId = e.target.value || null
            const department = departments.find((d) => d.id === departmentId)
            onChange({
              departmentId,
              departmentName: department?.name ?? null,
            })
          }}
        >
          <option value="">Select department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>
    </>
  )
}

function ConditionFields({
  data,
  onChange,
}: {
  data: ConditionNodeData
  onChange: (patch: Partial<ConditionNodeData>) => void
}) {
  return (
    <>
      <div className="space-y-1.5">
        <FieldLabel>Label</FieldLabel>
        <Input
          value={data.label}
          onChange={(e) => onChange({ label: e.target.value })}
          className="rounded-none border-neutral-900 focus-visible:ring-neutral-900"
        />
      </div>
      <div className="space-y-1.5">
        <FieldLabel>Field</FieldLabel>
        <Input
          value={data.field}
          onChange={(e) => onChange({ field: e.target.value })}
          className="rounded-none border-neutral-900 font-mono text-sm focus-visible:ring-neutral-900"
        />
      </div>
      <div className="space-y-1.5">
        <FieldLabel>Operator</FieldLabel>
        <select
          className={selectClassName}
          value={data.operator}
          onChange={(e) =>
            onChange({ operator: e.target.value as ConditionNodeData['operator'] })
          }
        >
          {CONDITION_OPERATORS.map((op) => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <FieldLabel>Value</FieldLabel>
        <Input
          value={data.value}
          onChange={(e) => onChange({ value: e.target.value })}
          className="rounded-none border-neutral-900 font-mono focus-visible:ring-neutral-900"
        />
      </div>
    </>
  )
}
