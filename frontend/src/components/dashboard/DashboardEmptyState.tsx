import type { ReactNode } from 'react'
import folderImg from '@/assets/folder.png'
import calendarImg from '@/assets/calendar.png'
import { Button } from '@/components/ui/button'

type Illustration = 'folder' | 'calendar'

interface DashboardEmptyStateProps {
  image?: Illustration
  title: string
  description?: string
  action?: ReactNode
  onRefresh?: () => void
}

export function DashboardEmptyState({
  image = 'folder',
  title,
  description,
  action,
  onRefresh,
}: DashboardEmptyStateProps) {
  const src = image === 'calendar' ? calendarImg : folderImg

  return (
    <div className="flex flex-col items-center justify-center py-10 text-center sm:py-14">
      <img
        src={src}
        alt=""
        className="mb-6 h-44 w-auto max-w-full object-contain sm:h-52"
      />
      <h3 className="text-base font-medium text-gray-600">{title}</h3>
      {description && (
        <p className="mt-1 max-w-md text-sm text-gray-400">{description}</p>
      )}
      {(action || onRefresh) && (
        <div className="mt-5">
          {action}
          {!action && onRefresh && (
            <Button variant="outline" onClick={onRefresh}>
              Refresh
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
