import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface AdminDataTableProps {
  columns: string[]
  children: ReactNode
  className?: string
}

export function AdminDataTable({ columns, children, className }: AdminDataTableProps) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full min-w-[32rem] text-sm">
        <thead>
          <tr className="bg-[#edf2f7] text-left text-sm font-semibold text-gray-700">
            {columns.map((col, i) => (
              <th
                key={col}
                className={cn(
                  'px-4 py-3 font-semibold',
                  i === 0 && 'rounded-tl-lg',
                  i === columns.length - 1 && 'rounded-tr-lg',
                )}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e2e8f0] bg-white">{children}</tbody>
      </table>
    </div>
  )
}

export function AdminTableRow({ children }: { children: ReactNode }) {
  return <tr className="text-gray-700 transition-colors hover:bg-gray-50/50">{children}</tr>
}

export function AdminTableCell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <td className={cn('px-4 py-4 align-middle', className)}>{children}</td>
}

export function RolePill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize text-gray-700">
      {children}
    </span>
  )
}
