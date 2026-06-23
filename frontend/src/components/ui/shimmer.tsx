import { cn } from '@/lib/utils'

export function Shimmer({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted/80', className)} />
}

export function MetricCardsShimmer({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-xl border bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-3">
              <Shimmer className="h-3 w-24" />
              <Shimmer className="h-8 w-16" />
            </div>
            <Shimmer className="h-10 w-10 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function TableShimmer({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-white">
      <div className="border-b bg-[#edf2f7] px-4 py-3">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, index) => (
            <Shimmer key={index} className="h-4 flex-1" />
          ))}
        </div>
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-4 px-4 py-4">
            <Shimmer className="h-4 w-4 shrink-0" />
            {Array.from({ length: columns - 1 }).map((_, colIndex) => (
              <Shimmer
                key={colIndex}
                className={cn('h-4 flex-1', colIndex === columns - 2 && 'max-w-32')}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function AdminListPanelShimmer({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Shimmer className="h-6 w-40" />
        <Shimmer className="h-4 w-72 max-w-full" />
      </div>
      <TableShimmer rows={rows} />
    </div>
  )
}

export function AuditCardsShimmer({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-xl border bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Shimmer className="h-5 w-28 rounded-full" />
            <Shimmer className="h-4 w-32" />
          </div>
          <Shimmer className="mt-3 h-4 w-full max-w-xl" />
          <Shimmer className="mt-2 h-3 w-40" />
        </div>
      ))}
    </div>
  )
}

export function DashboardPanelsShimmer() {
  return (
    <div className="mt-6 space-y-6">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <Shimmer className="h-5 w-36" />
            <Shimmer className="h-9 w-24 rounded-lg" />
          </div>
          <div className="space-y-3 p-5">
            {Array.from({ length: 3 }).map((__, rowIndex) => (
              <div key={rowIndex} className="flex items-center gap-4">
                <Shimmer className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Shimmer className="h-4 w-48" />
                  <Shimmer className="h-3 w-32" />
                </div>
                <Shimmer className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function DashboardPageShimmer() {
  return (
    <>
      <MetricCardsShimmer />
      <DashboardPanelsShimmer />
    </>
  )
}

export function FormPageShimmer({ fields = 5 }: { fields?: number }) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <Shimmer className="mb-6 h-6 w-40" />
      <div className="space-y-5">
        {Array.from({ length: fields }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Shimmer className="h-4 w-24" />
            <Shimmer className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
      <div className="mt-6 flex gap-3">
        <Shimmer className="h-10 w-28 rounded-lg" />
        <Shimmer className="h-10 w-24 rounded-lg" />
      </div>
    </div>
  )
}

export function TabbedTablePageShimmer() {
  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Shimmer key={index} className="h-9 w-24 rounded-lg" />
        ))}
      </div>
      <Shimmer className="mb-4 h-9 w-20 rounded-lg" />
      <AdminListPanelShimmer />
    </>
  )
}

export function WorkflowPageShimmer() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="min-h-[480px] rounded-xl border bg-card p-4">
        <div className="flex flex-wrap gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="w-48 space-y-3 rounded-xl border p-4">
              <Shimmer className="h-4 w-20" />
              <Shimmer className="h-10 w-full rounded-lg" />
              <Shimmer className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-4 rounded-xl border bg-card p-4">
        <Shimmer className="h-5 w-32" />
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Shimmer className="h-4 w-24" />
            <Shimmer className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function CardsGridShimmer({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-xl border bg-card p-5">
          <Shimmer className="h-5 w-32" />
          <Shimmer className="mt-3 h-4 w-full" />
          <Shimmer className="mt-2 h-4 w-3/4" />
          <div className="mt-4 flex gap-2">
            <Shimmer className="h-8 w-16 rounded-lg" />
            <Shimmer className="h-8 w-16 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center p-8">
      <div className="w-full max-w-md space-y-4">
        <Shimmer className="mx-auto h-10 w-10 rounded-full" />
        <Shimmer className="mx-auto h-4 w-40" />
        <Shimmer className="h-3 w-full" />
        <Shimmer className="h-3 w-4/5" />
      </div>
    </div>
  )
}
