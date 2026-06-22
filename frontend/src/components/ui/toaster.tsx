import * as Toast from '@radix-ui/react-toast'
import { X } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import { getToasts, subscribe, toast, type ToastVariant } from '@/lib/toast'
import { cn } from '@/lib/utils'

const variantStyles: Record<ToastVariant, string> = {
  default: 'border-border bg-card text-foreground',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-red-200 bg-red-50 text-red-900',
}

export function Toaster() {
  const items = useSyncExternalStore(subscribe, getToasts, getToasts)

  return (
    <Toast.Provider swipeDirection="right" duration={4000}>
      {items.map((item) => (
        <Toast.Root
          key={item.id}
          open
          onOpenChange={(open) => {
            if (!open) toast.dismiss(item.id)
          }}
          className={cn(
            'pointer-events-auto flex w-full items-start justify-between gap-3 rounded-lg border px-4 py-3 shadow-lg',
            variantStyles[item.variant],
          )}
        >
          <Toast.Description className="text-sm leading-snug">{item.message}</Toast.Description>
          <Toast.Close
            className="shrink-0 rounded-md p-0.5 opacity-70 transition-opacity hover:opacity-100"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </Toast.Close>
        </Toast.Root>
      ))}
      <Toast.Viewport className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 outline-none" />
    </Toast.Provider>
  )
}
