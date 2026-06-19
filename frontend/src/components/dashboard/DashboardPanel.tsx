import type { ReactNode } from 'react'

interface DashboardPanelProps {
  title: string
  action?: ReactNode
  children: ReactNode
}

export function DashboardPanel({ title, action, children }: DashboardPanelProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 sm:px-6">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {action}
      </div>
      <div className="px-5 py-6 sm:px-6">{children}</div>
    </div>
  )
}
