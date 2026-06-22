import { Eye, EyeOff } from 'lucide-react'
import { forwardRef, useState, type ComponentPropsWithoutRef } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const PasswordInput = forwardRef<HTMLInputElement, ComponentPropsWithoutRef<typeof Input>>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = useState(false)

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={cn('pr-10', className)}
          {...props}
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    )
  },
)
PasswordInput.displayName = 'PasswordInput'

export { PasswordInput }
