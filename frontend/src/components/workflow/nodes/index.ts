import type { NodeTypes } from '@xyflow/react'
import { ApprovalNode } from '@/components/workflow/nodes/ApprovalNode'
import { ConditionNode } from '@/components/workflow/nodes/ConditionNode'
import { TriggerNode } from '@/components/workflow/nodes/TriggerNode'

export const workflowNodeTypes: NodeTypes = {
  trigger: TriggerNode,
  approval: ApprovalNode,
  condition: ConditionNode,
}
