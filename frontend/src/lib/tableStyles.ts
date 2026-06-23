import { cn } from '@/lib/utils'

const tableBorder = 'border-[#e2e8f0]'

export const tableGridClass = 'w-full border-collapse text-sm'

export const tableHeadCellClass = cn(
  'border-b border-r px-4 py-3 font-semibold last:border-r-0',
  tableBorder,
)

export const tableBodyCellClass = cn(
  'border-b border-r px-4 py-1.5 align-middle last:border-r-0',
  tableBorder,
)

export const tableHeadRowClass = 'bg-[#edf2f7] text-left text-sm font-semibold text-gray-700'

export const tableBodyRowClass = 'text-gray-700 transition-colors hover:bg-gray-50/50'
