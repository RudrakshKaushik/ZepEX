import * as Toast from '@radix-ui/react-toast'
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getToasts, subscribe, toast, type ToastItem, type ToastVariant } from '@/lib/toast'
import { cn } from '@/lib/utils'

const variantStyles: Record<ToastVariant, string> = {
  default: 'border-border bg-card text-foreground',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-red-200 bg-red-50 text-red-900',
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>(getToasts)

  useEffect(() => {
    return subscribe(() => {
      setItems([...getToasts()])
    })
  }, [])

  return (
    <Toast.Provider swipeDirection="right" duration={5000}>
      {items.map((item) => (
        <Toast.Root
          key={item.id}
          open
          onOpenChange={(open) => {
            if (!open) toast.dismiss(item.id)
          }}
          className={cn(
            'pointer-events-auto flex w-full items-start justify-between gap-3 rounded-lg border px-4 py-3 shadow-lg transition-all',
            'data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-4 data-[state=open]:fade-in-0',
            'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-4 data-[state=closed]:fade-out-0',
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
      <Toast.Viewport className="fixed bottom-4 right-4 z-[200] flex w-[min(100vw-2rem,24rem)] flex-col gap-2 outline-none" />
    </Toast.Provider>
  )
}
