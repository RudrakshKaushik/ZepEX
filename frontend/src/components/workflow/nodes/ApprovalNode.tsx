import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { UserCheck } from 'lucide-react'
import type { ApprovalNodeData } from '@/components/workflow/types'
import { routingLabel } from '@/components/workflow/types'
import { WireframeHandle, Position } from '@/components/workflow/nodes/WireframeHandle'

function ApprovalNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as ApprovalNodeData

  return (
    <div
      className={`min-w-[200px] border border-neutral-900 bg-white shadow-none ${
        selected ? 'ring-2 ring-neutral-900 ring-offset-2' : ''
      }`}
    >
      <WireframeHandle type="target" position={Position.Left} id="in" />
      <div className="flex items-center gap-2 border-b border-neutral-900 px-3 py-2">
        <UserCheck className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-900">
          Approval
        </span>
      </div>
      <div className="space-y-1 px-3 py-2.5 text-xs text-neutral-700">
        <p className="text-sm font-semibold text-neutral-900">{nodeData.label}</p>
        <p>
          Role: <span className="font-medium">{nodeData.roleName || '—'}</span>
        </p>
        <p>Routing: {routingLabel(nodeData.routingType)}</p>
        {nodeData.routingType === 'DEPARTMENT' && (
          <p>
            Dept: <span className="font-medium">{nodeData.departmentName || '—'}</span>
          </p>
        )}
        {nodeData.stepOrder != null && (
          <p className="text-[10px] uppercase tracking-wide text-neutral-500">
            Step {nodeData.stepOrder}
          </p>
        )}
      </div>
      <WireframeHandle type="source" position={Position.Right} id="out" />
    </div>
  )
}

export const ApprovalNode = memo(ApprovalNodeComponent)
