import { WorkflowProgress } from '@/components/reports/WorkflowTimeline'
import type { WorkflowTimelineEntry } from '@/types'

export function WorkflowStepper({ timeline }: { timeline: WorkflowTimelineEntry[] }) {
  return <WorkflowProgress timeline={timeline} variant="compact" />
}
