import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { GitBranch } from 'lucide-react'
import type { ConditionNodeData } from '@/components/workflow/types'
import { CONDITION_OPERATORS } from '@/components/workflow/types'
import { WireframeHandle, Position } from '@/components/workflow/nodes/WireframeHandle'

function operatorLabel(op: ConditionNodeData['operator']) {
  return CONDITION_OPERATORS.find((o) => o.value === op)?.label ?? op
}

function ConditionNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as ConditionNodeData

  return (
    <div className="relative flex flex-col items-center">
      <WireframeHandle type="target" position={Position.Top} id="in" />
      <div
        className={`flex h-28 w-28 rotate-45 items-center justify-center border border-neutral-900 bg-white ${
          selected ? 'ring-2 ring-neutral-900 ring-offset-2' : ''
        }`}
      >
        <div className="-rotate-45 space-y-0.5 px-1 text-center">
          <GitBranch className="mx-auto h-3.5 w-3.5" strokeWidth={2} />
          <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-900">
            If
          </p>
          <p className="max-w-[72px] truncate text-[10px] font-medium text-neutral-700">
            {nodeData.label}
          </p>
        </div>
      </div>
      <p className="mt-2 max-w-[140px] text-center font-mono text-[10px] text-neutral-600">
        {nodeData.field} {operatorLabel(nodeData.operator)} {nodeData.value}
      </p>
      <WireframeHandle
        type="source"
        position={Position.Right}
        id="true"
        style={{ top: '50%' }}
        className="!-right-3"
      />
      <WireframeHandle
        type="source"
        position={Position.Bottom}
        id="false"
        className="!-bottom-3"
      />
      <span className="pointer-events-none absolute -right-8 top-1/2 -translate-y-1/2 text-[9px] font-bold uppercase text-neutral-500">
        T
      </span>
      <span className="pointer-events-none absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase text-neutral-500">
        F
      </span>
    </div>
  )
}

export const ConditionNode = memo(ConditionNodeComponent)
