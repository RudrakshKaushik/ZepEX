import '@xyflow/react/dist/style.css'

import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type NodeChange,
} from '@xyflow/react'
import { Save, UserCheck } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { workflowNodeTypes } from '@/components/workflow/nodes'
import type { WorkflowNode } from '@/components/workflow/types'
import type { ApprovalNodeData } from '@/components/workflow/types'
import { WorkflowNodeSidebar } from '@/components/workflow/WorkflowNodeSidebar'
import { WorkflowEdgeSidebar } from '@/components/workflow/WorkflowEdgeSidebar'
import {
  createApprovalNode,
  createDefaultFlow,
  getViewportCenter,
  patchNodeData,
  sortApprovalNodesByFlow,
  stepsToFlow,
} from '@/components/workflow/workflowFlowUtils'
import { Button } from '@/components/ui/button'
import type { ApprovalWorkflowStep, CompanyRole, DepartmentRecord } from '@/types'

const edgeDefaults = {
  style: { stroke: '#171717', strokeWidth: 1.5 },
  type: 'smoothstep' as const,
  deletable: true,
  selectable: true,
}

interface WorkflowBuilderProps {
  steps: ApprovalWorkflowStep[]
  roles: CompanyRole[]
  departments: DepartmentRecord[]
  saving?: boolean
  onSaveSteps: (nodes: WorkflowNode[]) => Promise<void>
  onDeleteStep?: (stepId: string) => Promise<void>
}

function CanvasToolbar({
  onAddApproval,
  onSave,
  saving,
}: {
  onAddApproval: () => void
  onSave: () => void
  saving?: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border border-neutral-900 bg-white p-2 shadow-none sm:flex-nowrap">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={onAddApproval}
        className="h-8 rounded-none border-neutral-900 bg-white text-neutral-900 hover:bg-neutral-100"
      >
        <UserCheck className="h-3.5 w-3.5" />
        Add Step
      </Button>
      <Button
        type="button"
        size="sm"
        onClick={onSave}
        disabled={saving}
        className="h-8 rounded-none bg-neutral-900 text-white hover:bg-neutral-800"
      >
        <Save className="h-3.5 w-3.5" />
        {saving ? 'Saving...' : 'Save Flow'}
      </Button>
    </div>
  )
}

function WorkflowBuilderInner({
  steps,
  roles,
  departments,
  saving,
  onSaveSteps,
  onDeleteStep,
}: WorkflowBuilderProps) {
  const initial = useMemo(
    () => (steps.length > 0 ? stepsToFlow(steps) : createDefaultFlow()),
    [steps],
  )

  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowNode>(initial.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initial.edges)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const { screenToFlowPosition } = useReactFlow()

  useEffect(() => {
    const flow = steps.length > 0 ? stepsToFlow(steps) : createDefaultFlow()
    setNodes(flow.nodes)
    setEdges(flow.edges)
    setSelectedId(null)
    setSelectedEdgeId(null)
  }, [steps, setNodes, setEdges])

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedId) ?? null,
    [nodes, selectedId],
  )

  const selectedEdge = useMemo(
    () => edges.find((e) => e.id === selectedEdgeId) ?? null,
    [edges, selectedEdgeId],
  )

  const disconnectEdge = useCallback(
    (edgeId: string) => {
      setEdges((eds) => eds.filter((e) => e.id !== edgeId))
      setSelectedEdgeId(null)
    },
    [setEdges],
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge({ ...connection, ...edgeDefaults }, eds))
    },
    [setEdges],
  )

  const handleNodesChange = useCallback(
    (changes: NodeChange<WorkflowNode>[]) => {
      onNodesChange(changes)
      const removed = changes.find((c) => c.type === 'remove')
      if (removed && removed.type === 'remove' && removed.id === selectedId) {
        setSelectedId(null)
      }
    },
    [onNodesChange, selectedId],
  )

  const handleEdgesChange = useCallback(
    (changes: Parameters<typeof onEdgesChange>[0]) => {
      onEdgesChange(changes)
      const removed = changes.find((c) => c.type === 'remove')
      if (removed && removed.type === 'remove' && removed.id === selectedEdgeId) {
        setSelectedEdgeId(null)
      }
    },
    [onEdgesChange, selectedEdgeId],
  )

  const updateNode = useCallback(
    (nodeId: string, patch: Record<string, unknown>) => {
      setNodes((nds) => patchNodeData(nds, nodeId, patch))
    },
    [setNodes],
  )

  const addApprovalAtCenter = useCallback(() => {
    const position = getViewportCenter({ screenToFlowPosition })
    const defaultRole = roles[0]
    const node = createApprovalNode(position, {
      roleId: defaultRole?.id ?? null,
      roleName: defaultRole?.name ?? '',
      label: defaultRole?.name ?? 'Approval step',
    })
    setNodes((nds) => [...nds, node])
    setSelectedId(node.id)
  }, [roles, screenToFlowPosition, setNodes])

  const deleteNode = useCallback(
    async (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId)
      if (!node || node.type === 'trigger') return

      if (node.type === 'approval' && onDeleteStep) {
        const stepId = (node.data as ApprovalNodeData).backendStepId
        if (stepId) await onDeleteStep(stepId)
      }

      setNodes((nds) => nds.filter((n) => n.id !== nodeId))
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId))
      setSelectedId(null)
    },
    [nodes, onDeleteStep, setEdges, setNodes],
  )

  const handleSave = useCallback(async () => {
    const ordered = sortApprovalNodesByFlow(nodes, edges)
    await onSaveSteps(ordered)
  }, [nodes, edges, onSaveSteps])

  return (
    <div className="flex w-full flex-col border border-neutral-900 bg-white lg:h-[min(72vh,720px)] lg:min-h-[480px] lg:flex-row">
      <div className="relative h-[min(50vh,440px)] min-h-[300px] w-full lg:h-auto lg:min-h-0 lg:w-3/4 lg:min-w-0">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={workflowNodeTypes}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, node) => {
            setSelectedId(node.id)
            setSelectedEdgeId(null)
          }}
          onEdgeClick={(_, edge) => {
            setSelectedEdgeId(edge.id)
            setSelectedId(null)
          }}
          onPaneClick={() => {
            setSelectedId(null)
            setSelectedEdgeId(null)
          }}
          onEdgesDelete={(deleted) => {
            if (deleted.some((e) => e.id === selectedEdgeId)) {
              setSelectedEdgeId(null)
            }
          }}
          deleteKeyCode={['Backspace', 'Delete']}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.25}
          maxZoom={2}
          defaultEdgeOptions={edgeDefaults}
          proOptions={{ hideAttribution: true }}
          className="workflow-canvas bg-neutral-50"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={18}
            size={1}
            color="#a3a3a3"
          />
          <Controls
            showInteractive={false}
            className="!rounded-none !border-neutral-900 !shadow-none [&>button]:!rounded-none [&>button]:!border-neutral-900 [&>button]:!bg-white [&>button]:hover:!bg-neutral-100"
          />
          <div className="absolute left-2 right-2 top-2 z-10 sm:left-3 sm:right-auto">
            <CanvasToolbar
              onAddApproval={addApprovalAtCenter}
              onSave={handleSave}
              saving={saving}
            />
          </div>
        </ReactFlow>
      </div>

      <div
        className={`w-full shrink-0 border-neutral-900 lg:w-1/4 lg:min-w-[240px] lg:border-l ${
          selectedNode || selectedEdge ? 'border-t' : 'hidden lg:block'
        }`}
      >
        {selectedEdge ? (
          <WorkflowEdgeSidebar
            edge={selectedEdge}
            nodes={nodes}
            onDisconnect={disconnectEdge}
          />
        ) : (
          <WorkflowNodeSidebar
            selectedNode={selectedNode}
            roles={roles}
            departments={departments}
            onUpdate={updateNode}
            onDelete={deleteNode}
            deleting={saving}
          />
        )}
      </div>
    </div>
  )
}

export function WorkflowBuilder(props: WorkflowBuilderProps) {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderInner {...props} />
    </ReactFlowProvider>
  )
}
