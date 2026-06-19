import { type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  accent?: 'blue' | 'green' | 'orange' | 'red' | 'purple'
}

const accentStyles = {
  blue: 'bg-[#2563eb]',
  green: 'bg-[#22c55e]',
  orange: 'bg-[#f59e0b]',
  red: 'bg-[#ef4444]',
  purple: 'bg-violet-500',
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  description,
  accent = 'blue',
}: MetricCardProps) {
  return (
    <Card className="border-gray-200">
      <CardContent className="p-5 sm:p-6">
        <div
          className={cn(
            'mb-4 flex h-10 w-10 items-center justify-center rounded-full',
            accentStyles[accent],
          )}
        >
          <Icon className="h-5 w-5 text-white" strokeWidth={2.25} />
        </div>
        <p className="text-3xl font-bold tracking-tight text-gray-900">{value}</p>
        <p className="mt-1 text-sm text-gray-500">{title}</p>
        {description && <p className="mt-0.5 text-xs text-gray-400">{description}</p>}
      </CardContent>
    </Card>
  )
}
