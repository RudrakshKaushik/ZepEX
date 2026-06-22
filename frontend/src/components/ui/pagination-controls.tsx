import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  totalCount: number
  onPageChange: (page: number) => void
  disabled?: boolean
}

export function PaginationControls({
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
  disabled,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e2e8f0] px-5 py-3 sm:px-6">
      <p className="text-sm text-gray-500">
        Page {currentPage} of {totalPages} · {totalCount} total
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
