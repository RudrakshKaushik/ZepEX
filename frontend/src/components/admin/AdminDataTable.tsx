import type { ReactNode } from 'react'
import {
  tableBodyCellClass,
  tableBodyRowClass,
  tableGridClass,
  tableHeadCellClass,
  tableHeadRowClass,
} from '@/lib/tableStyles'
import { cn } from '@/lib/utils'

interface AdminDataTableProps {
  columns: string[]
  children: ReactNode
  className?: string
}

export function AdminDataTable({ columns, children, className }: AdminDataTableProps) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className={cn(tableGridClass, 'min-w-[32rem]')}>
        <thead>
          <tr className={tableHeadRowClass}>
            {columns.map((col, i) => (
              <th
                key={col}
                className={cn(
                  tableHeadCellClass,
                  i === 0 && 'rounded-tl-lg',
                  i === columns.length - 1 && 'rounded-tr-lg',
                )}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white">{children}</tbody>
      </table>
    </div>
  )
}

export function AdminTableRow({ children }: { children: ReactNode }) {
  return <tr className={tableBodyRowClass}>{children}</tr>
}

export function AdminTableCell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <td className={cn(tableBodyCellClass, className)}>{children}</td>
}

export function RolePill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize text-gray-700">
      {children}
    </span>
  )
}
