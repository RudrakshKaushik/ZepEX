import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import logo from '@/assets/logo.png'
import arrow from '@/assets/white_arrow.png'
import star from '@/assets/star.png'
import star2 from '@/assets/star2.png'

export const landingBlue = '#0066FF'

export const dotGridStyle = {
  backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
  backgroundSize: '22px 22px',
  backgroundColor: '#f9fafb',
} as const

export function ZepLogo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn('flex items-center gap-2.5', className)}>
      <img src={logo} alt="ZepEX" className="h-full w-25" />
    </Link>
  )
}

export function PrimaryButton({
  to,
  children,
  icon,
  className,
}: {
  to: string
  children: string
  icon?: 'arrow'
  className?: string
}) {
  return (
    <Link
      to={to}
      className={cn(
        'inline-flex items-stretch overflow-hidden rounded-lg bg-[#0066FF] text-base font-semibold text-white shadow-sm transition hover:bg-[#0052cc]',
        className,
      )}
    >
      <span className="flex items-center px-4 py-2">{children}</span>
      {icon === 'arrow' && (
        <div className="flex items-center justify-center p-2">
          <img src={arrow} alt="" className="h-8 w-8" />
        </div>
      )}
    </Link>
  )
}

export function SecondaryButton({
  to,
  children,
  className,
}: {
  to: string
  children: string
  className?: string
}) {
  return (
    <Link
      to={to}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-200',
        className,
      )}
    >
      {children}
      <div className="flex items-center justify-center">
        <img src={star} alt="" className="h-8 w-8" />
      </div>
    </Link>
  )
}

export function SectionBadge({
  children,
  endIcon,
}: {
  children: string
  endIcon?: string
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-sm border border-[#FD882C] bg-[#FD882C1A] px-3 py-1 text-xs font-medium text-black">
      {endIcon && <span className="h-1.5 w-1.5 rounded-full bg-[#FD882C]" />}
      {children}
      {endIcon && <img src={star2} alt="star2" className="h-4 w-4" />}
    </span>
  )
}

export function SectionIntro({
  badge,
  badgeEndIcon,
  title,
  description,
}: {
  badge: string
  badgeEndIcon?: string
  title: string
  description: string
}) {
  return (
    <div className="text-center">
      <SectionBadge endIcon={badgeEndIcon}>{badge}</SectionBadge>
      <h2 className="mt-4 text-2xl font-bold text-gray-900 sm:text-3xl">{title}</h2>
      <p className="mx-auto mt-3 max-w-4xl text-sm text-gray-600 sm:text-base">{description}</p>
    </div>
  )
}

export function IllustrationPlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'mt-5 aspect-[16/10] w-full rounded-xl bg-gradient-to-br from-blue-50 to-cyan-100',
        className,
      )}
    >
      <img src="" alt="" className="h-full w-full object-cover opacity-0" aria-hidden />
    </div>
  )
}

/** Horizontal swipe row on mobile; pass `desktopClassName` for md+ layout. */
export function LandingMobileScroll({
  children,
  className,
  desktopClassName,
}: {
  children: ReactNode
  className?: string
  desktopClassName?: string
}) {
  return (
    <>
      <div className={cn('landing-scroll-x -mx-4 overflow-x-auto px-4 pb-1 md:hidden', className)}>
        <div className="flex w-max min-w-full gap-6 pr-4">{children}</div>
      </div>
      <div className={cn('hidden md:flex', desktopClassName)}>{children}</div>
    </>
  )
}

/** Auto-scrolling row on mobile; static layout from `md` up. */
export function LandingMarquee({
  children,
  className,
  desktopClassName,
}: {
  children: ReactNode
  className?: string
  desktopClassName?: string
}) {
  return (
    <>
      <div className={cn('overflow-hidden md:hidden', className)}>
        <div className="stats-marquee-track">
          <div className="flex shrink-0 items-stretch gap-8 pr-8">{children}</div>
          <div className="flex shrink-0 items-stretch gap-8 pr-8" aria-hidden>
            {children}
          </div>
        </div>
      </div>
      <div className={cn('hidden md:flex', desktopClassName)}>{children}</div>
    </>
  )
}
