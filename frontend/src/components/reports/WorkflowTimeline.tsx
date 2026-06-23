import { CheckCircle2, Circle, Clock, XCircle } from 'lucide-react'
import type { WorkflowTimelineEntry } from '@/types'
import { formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

const statusStyles: Record<string, string> = {
  COMPLETED: 'text-emerald-600',
  APPROVED: 'text-emerald-600',
  PENDING: 'text-blue-600',
  WAITING: 'text-gray-400',
  REJECTED: 'text-red-600',
  CANCELLED: 'text-gray-400',
  DRAFT: 'text-gray-500',
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'REJECTED') return <XCircle className="h-4 w-4 text-red-500" />
  if (status === 'PENDING') return <Clock className="h-4 w-4 text-blue-500" />
  if (status === 'COMPLETED' || status === 'APPROVED') {
    return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
  }
  return <Circle className="h-4 w-4 text-gray-300" />
}

export function WorkflowTimeline({ timeline }: { timeline: WorkflowTimelineEntry[] }) {
  if (!timeline.length) return null

  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <p className="mb-3 text-sm font-semibold text-foreground">Workflow progress</p>
      <ol className="space-y-3">
        {timeline.map((entry) => (
          <li key={`${entry.step_order}-${entry.step_name}`} className="flex gap-3">
            <div className="mt-0.5 shrink-0">
              <StatusIcon status={entry.status} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-foreground">{entry.step_name}</p>
                <span className={cn('text-xs font-medium uppercase', statusStyles[entry.status])}>
                  {entry.status}
                </span>
              </div>
              {entry.action_by && (
                <p className="text-xs text-muted-foreground">
                  {entry.action_by} · {entry.action_role}
                </p>
              )}
              {!entry.action_by && entry.action_role && (
                <p className="text-xs text-muted-foreground">{entry.action_role}</p>
              )}
              {entry.comments && (
                <p className="mt-1 text-xs text-muted-foreground">“{entry.comments}”</p>
              )}
              {entry.action_at && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDateTime(entry.action_at)}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
