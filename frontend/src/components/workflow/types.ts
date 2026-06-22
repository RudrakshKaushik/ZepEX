import type { Node } from '@xyflow/react'

export type WorkflowNodeKind = 'trigger' | 'approval' | 'condition'

export interface TriggerNodeData {
  kind: 'trigger'
  label: string
  condition: string
  [key: string]: unknown
}

export interface ApprovalNodeData {
  kind: 'approval'
  label: string
  roleId: number | null
  roleName: string
  routingType: 'COMPANY' | 'DEPARTMENT'
  departmentId: string | null
  departmentName: string | null
  backendStepId?: string
  stepOrder?: number
  [key: string]: unknown
}

export interface ConditionNodeData {
  kind: 'condition'
  label: string
  field: string
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq'
  value: string
  [key: string]: unknown
}

export type WorkflowNodeData = TriggerNodeData | ApprovalNodeData | ConditionNodeData

export type WorkflowNode = Node<WorkflowNodeData, WorkflowNodeKind>

export const CONDITION_OPERATORS = [
  { value: 'gt', label: '>' },
  { value: 'gte', label: '>=' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '<=' },
  { value: 'eq', label: '=' },
] as const

export function routingLabel(routingType: ApprovalNodeData['routingType']) {
  return routingType === 'COMPANY' ? 'Company wide' : 'Department based'
}
