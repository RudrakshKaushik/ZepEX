import { Handle, Position, type HandleProps } from '@xyflow/react'
import { cn } from '@/lib/utils'

interface WireframeHandleProps extends Omit<HandleProps, 'className'> {
  className?: string
}

export function WireframeHandle({ className, ...props }: WireframeHandleProps) {
  return (
    <Handle
      {...props}
      className={cn(
        '!h-2.5 !w-2.5 !rounded-none !border !border-neutral-900 !bg-white',
        className,
      )}
    />
  )
}

export { Position }
