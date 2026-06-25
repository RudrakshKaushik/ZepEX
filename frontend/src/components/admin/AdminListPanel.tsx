import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface AdminListPanelProps {
  title: string
  count?: number
  description?: string
  action?: ReactNode
  toolbar?: ReactNode
  children: ReactNode
  className?: string
}

export function AdminListPanel({
  title,
  count,
  description,
  action,
  toolbar,
  children,
  className,
}: AdminListPanelProps) {
  const heading = count !== undefined ? `${title} (${count})` : title

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{heading}</h2>
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>
        {action}
      </div>
      <div className="space-y-4">
        {toolbar && (
          <div className="rounded-lg border border-[#e2e8f0] bg-white px-5 py-4 sm:px-6">
            {toolbar}
          </div>
        )}
        <div className="overflow-hidden rounded-lg border border-[#e2e8f0] bg-white">
          {children}
        </div>
      </div>
    </div>
  )
}
