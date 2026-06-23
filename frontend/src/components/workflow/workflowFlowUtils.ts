import type { Edge } from '@xyflow/react'
import type { ApprovalWorkflowStep } from '@/types'
import type {
  ApprovalNodeData,
  WorkflowNode,
  WorkflowNodeData,
} from '@/components/workflow/types'

const HORIZONTAL_GAP = 280
const ROW_Y = 120

let nodeIdCounter = 0

export function createNodeId(prefix: string) {
  nodeIdCounter += 1
  return `${prefix}-${Date.now()}-${nodeIdCounter}`
}

export function resetNodeIdCounter() {
  nodeIdCounter = 0
}

export function createTriggerNode(position = { x: 40, y: ROW_Y }): WorkflowNode {
  return {
    id: 'trigger-root',
    type: 'trigger',
    position,
    data: {
      kind: 'trigger',
      label: 'Expense submitted',
      condition: 'Expense > $0',
    },
    deletable: false,
  }
}

export function createApprovalNode(
  position: { x: number; y: number },
  partial?: Partial<ApprovalNodeData>,
): WorkflowNode {
  return {
    id: createNodeId('approval'),
    type: 'approval',
    position,
    data: {
      kind: 'approval',
      label: partial?.label ?? 'Approval step',
      roleId: partial?.roleId ?? null,
      roleName: partial?.roleName ?? '',
      routingType: partial?.routingType ?? 'COMPANY',
      departmentId: partial?.departmentId ?? null,
      departmentName: partial?.departmentName ?? null,
      backendStepId: partial?.backendStepId,
      stepOrder: partial?.stepOrder,
    },
  }
}

export function createConditionNode(position: { x: number; y: number }): WorkflowNode {
  return {
    id: createNodeId('condition'),
    type: 'condition',
    position,
    data: {
      kind: 'condition',
      label: 'Amount check',
      field: 'total_amount',
      operator: 'gt',
      value: '500',
    },
  }
}

export function stepToApprovalNode(step: ApprovalWorkflowStep, index: number): WorkflowNode {
  return createApprovalNode(
    { x: 40 + (index + 1) * HORIZONTAL_GAP, y: ROW_Y },
    {
      label: step.approver_role_name,
      roleId: step.approver_role,
      roleName: step.approver_role_name,
      routingType: step.routing_type,
      departmentId: step.department,
      departmentName: step.department_name,
      backendStepId: step.id,
      stepOrder: step.step_order,
    },
  )
}

export function stepsToFlow(steps: ApprovalWorkflowStep[]): {
  nodes: WorkflowNode[]
  edges: Edge[]
} {
  resetNodeIdCounter()
  const sorted = [...steps].filter((s) => s.is_active).sort((a, b) => a.step_order - b.step_order)
  const nodes: WorkflowNode[] = [createTriggerNode()]
  const edges: Edge[] = []

  let previousId = nodes[0].id

  sorted.forEach((step, index) => {
    const node = stepToApprovalNode(step, index)
    nodes.push(node)
    edges.push({
      id: `e-${previousId}-${node.id}`,
      source: previousId,
      target: node.id,
      sourceHandle: previousId === 'trigger-root' ? 'out' : 'out',
      targetHandle: 'in',
      style: { stroke: '#171717', strokeWidth: 1.5 },
      type: 'smoothstep',
    })
    previousId = node.id
  })

  return { nodes, edges }
}

export function createDefaultFlow(): { nodes: WorkflowNode[]; edges: Edge[] } {
  resetNodeIdCounter()
  return { nodes: [createTriggerNode()], edges: [] }
}

export function getViewportCenter(flowInstance: {
  screenToFlowPosition: (pos: { x: number; y: number }) => { x: number; y: number }
}): { x: number; y: number } {
  const isDesktop = window.innerWidth >= 1024
  const cx = window.innerWidth * (isDesktop ? 0.375 : 0.5)
  const cy = window.innerHeight * (isDesktop ? 0.45 : 0.32)
  return flowInstance.screenToFlowPosition({ x: cx, y: cy })
}

export function patchNodeData<T extends WorkflowNodeData>(
  nodes: WorkflowNode[],
  nodeId: string,
  patch: Partial<T>,
): WorkflowNode[] {
  return nodes.map((node) =>
    node.id === nodeId ? { ...node, data: { ...node.data, ...patch } as WorkflowNodeData } : node,
  )
}

export function sortApprovalNodesByFlow(nodes: WorkflowNode[], edges: Edge[]): WorkflowNode[] {
  const approvalNodes = nodes.filter((n) => n.type === 'approval')
  if (approvalNodes.length === 0) return []

  const adjacency = new Map<string, string[]>()
  edges.forEach((edge) => {
    const list = adjacency.get(edge.source) ?? []
    list.push(edge.target)
    adjacency.set(edge.source, list)
  })

  const ordered: WorkflowNode[] = []
  const visited = new Set<string>()
  const queue = ['trigger-root']

  while (queue.length > 0) {
    const current = queue.shift()!
    if (visited.has(current)) continue
    visited.add(current)

    const node = nodes.find((n) => n.id === current)
    if (node?.type === 'approval') ordered.push(node)

    const next = adjacency.get(current) ?? []
    queue.push(...next)
  }

  const remaining = approvalNodes.filter((n) => !ordered.some((o) => o.id === n.id))
  remaining.sort((a, b) => a.position.x - b.position.x)

  return [...ordered, ...remaining]
}

export function canvasMatchesBackendSteps(
  orderedNodes: WorkflowNode[],
  activeSteps: { id: string; approver_role: number; routing_type: string; department: string | null }[],
): boolean {
  if (orderedNodes.length !== activeSteps.length) return false
  if (orderedNodes.some((node) => !(node.data as ApprovalNodeData).backendStepId)) {
    return false
  }

  return activeSteps.every((step, index) => {
    const data = orderedNodes[index].data as ApprovalNodeData
    return (
      data.backendStepId === step.id &&
      data.roleId === step.approver_role &&
      data.routingType === step.routing_type &&
      (data.departmentId || null) === (step.department || null)
    )
  })
}
