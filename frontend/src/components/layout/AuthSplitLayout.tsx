import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import logo from '@/assets/logo.png'

type AuthSplitLayoutProps = {
  headline?: string
  description?: string
  children: ReactNode
  heroImage?: string
  heroOverlay?: ReactNode
}

export function AuthSplitLayout({
  headline,
  description,
  children,
  heroImage,
  heroOverlay,
}: AuthSplitLayoutProps) {
  return (
    <div className="flex min-h-screen bg-white">
      <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-10 lg:px-14 xl:px-20">
        <div className="mx-auto w-full max-w-md">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          {children}
        </div>
      </div>

      <div className="hidden min-h-screen flex-col p-4 sm:p-5 lg:flex lg:w-[45%] xl:p-6">
        {heroImage ? (
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl lg:rounded-3xl">
            <img
              src={heroImage}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            {heroOverlay ? (
              <div className="relative flex h-full min-h-[420px] flex-col justify-between p-8 text-white sm:p-10 lg:min-h-0 lg:p-12">
                {heroOverlay}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-12 text-white lg:rounded-3xl">
            <div className="flex items-center gap-2">
              <img src={logo} alt="ZepEX" className="h-full w-25" />
            </div>
            {headline && (
              <div>
                <h2 className="text-4xl font-bold leading-tight">{headline}</h2>
                {description && (
                  <p className="mt-4 max-w-md text-indigo-100">{description}</p>
                )}
              </div>
            )}
            <p className="text-sm text-indigo-200">© ZepEX Expense Platform</p>
          </div>
        )}
      </div>
    </div>
  )
}
