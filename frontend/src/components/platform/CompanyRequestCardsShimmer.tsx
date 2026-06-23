import { Shimmer } from '@/components/ui/shimmer'

export function CompanyRequestCardsShimmer({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Shimmer className="h-6 w-52" />
        <Shimmer className="h-4 w-64 max-w-full" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-sm"
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:justify-between">
              <div className="flex-1 space-y-3">
                <Shimmer className="h-6 w-24 rounded-full" />
                <Shimmer className="h-7 w-40" />
                <Shimmer className="h-4 w-56 max-w-full" />
                <Shimmer className="h-4 w-44 max-w-full" />
              </div>
              <div className="space-y-3 lg:min-w-[15rem] lg:items-end">
                <Shimmer className="h-4 w-48 lg:ml-auto" />
                <Shimmer className="h-4 w-36 lg:ml-auto" />
                <div className="flex gap-3 pt-1">
                  <Shimmer className="h-10 w-28 rounded-lg" />
                  <Shimmer className="h-10 w-28 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
