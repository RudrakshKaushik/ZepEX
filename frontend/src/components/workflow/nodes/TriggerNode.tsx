import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { Zap } from 'lucide-react'
import type { TriggerNodeData } from '@/components/workflow/types'
import { WireframeHandle, Position } from '@/components/workflow/nodes/WireframeHandle'

function TriggerNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as TriggerNodeData

  return (
    <div
      className={`min-w-[200px] border border-neutral-900 bg-white shadow-none ${
        selected ? 'ring-2 ring-neutral-900 ring-offset-2' : ''
      }`}
    >
      <WireframeHandle type="target" position={Position.Left} id="in" isConnectable={false} />
      <div className="flex items-center gap-2 border-b border-neutral-900 px-3 py-2">
        <Zap className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-900">
          Trigger
        </span>
      </div>
      <div className="space-y-1 px-3 py-2.5">
        <p className="text-sm font-semibold text-neutral-900">{nodeData.label}</p>
        <p className="font-mono text-xs text-neutral-600">{nodeData.condition}</p>
      </div>
      <WireframeHandle type="source" position={Position.Right} id="out" />
    </div>
  )
}

export const TriggerNode = memo(TriggerNodeComponent)
