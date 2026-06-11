import { type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  accent?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky'
}

const accentStyles = {
  indigo: 'bg-indigo-50 text-indigo-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
  sky: 'bg-sky-50 text-sky-600',
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  description,
  accent = 'indigo',
}: MetricCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className={cn('rounded-xl p-3', accentStyles[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  )
}
