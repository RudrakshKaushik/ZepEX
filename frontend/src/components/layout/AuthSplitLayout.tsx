import { ArrowLeft, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

type AuthSplitLayoutProps = {
  headline: string
  description: string
  children: ReactNode
}

export function AuthSplitLayout({ headline, description, children }: AuthSplitLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <Zap className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold">ZepEX</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold leading-tight">{headline}</h2>
          <p className="mt-4 max-w-md text-indigo-100">{description}</p>
        </div>
        <p className="text-sm text-indigo-200">© ZepEX Expense Platform</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          {children}
        </div>
      </div>
    </div>
  )
}
