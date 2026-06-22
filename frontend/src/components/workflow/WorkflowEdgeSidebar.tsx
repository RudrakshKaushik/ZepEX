import { Unlink } from 'lucide-react'
import type { Edge } from '@xyflow/react'
import type { WorkflowNode } from '@/components/workflow/types'
import { Button } from '@/components/ui/button'

interface WorkflowEdgeSidebarProps {
  edge: Edge
  nodes: WorkflowNode[]
  onDisconnect: (edgeId: string) => void
}

function nodeLabel(nodes: WorkflowNode[], id: string) {
  const node = nodes.find((n) => n.id === id)
  if (!node) return id
  if (node.type === 'trigger') return 'Trigger'
  return (node.data as { label?: string }).label ?? 'Step'
}

export function WorkflowEdgeSidebar({ edge, nodes, onDisconnect }: WorkflowEdgeSidebarProps) {
  return (
    <aside className="flex max-h-[min(45vh,400px)] w-full flex-col bg-white lg:h-full lg:max-h-none">
      <div className="flex items-center justify-between border-b border-neutral-900 px-4 py-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-900">
            Connection
          </h3>
          <p className="mt-0.5 text-[10px] uppercase tracking-wide text-neutral-500">
            Edge selected
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onDisconnect(edge.id)}
          className="h-8 rounded-none border-neutral-900 text-neutral-900 hover:bg-neutral-100"
        >
          <Unlink className="h-3.5 w-3.5" />
          Disconnect
        </Button>
      </div>
      <div className="space-y-3 p-4 text-sm text-neutral-700">
        <p>
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
            From
          </span>
          <br />
          <span className="font-medium">{nodeLabel(nodes, edge.source)}</span>
        </p>
        <p>
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
            To
          </span>
          <br />
          <span className="font-medium">{nodeLabel(nodes, edge.target)}</span>
        </p>
        <p className="text-xs text-neutral-500">
          Press <kbd className="border border-neutral-400 px-1">Delete</kbd> or tap Disconnect
          to remove this link.
        </p>
      </div>
    </aside>
  )
}
