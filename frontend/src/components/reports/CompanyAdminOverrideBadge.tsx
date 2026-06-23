import { Shield } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function CompanyAdminOverrideBadge() {
  return (
    <Badge variant="outline" className="gap-1 border-amber-300 bg-amber-50 text-amber-900">
      <Shield className="h-3 w-3" />
      Company Admin Override
    </Badge>
  )
}
