import { ListFilter } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FilterTogglePanelProps {
  children: ReactNode
  className?: string
}

export function FilterTogglePanel({ children, className }: FilterTogglePanelProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className={cn('mb-4', className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <ListFilter className="h-4 w-4" />
        Filter
      </Button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  )
}
