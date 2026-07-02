import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import logo from '@/assets/logo.png'
import arrow from '@/assets/white_arrow.png'
import star from '@/assets/star.png'
// import star2 from '@/assets/star2.png'
import star3 from '@/assets/star3.png'

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
        'inline-flex w-fit max-w-full items-center overflow-hidden rounded-lg bg-[#3600FC] text-base font-semibold text-white shadow-sm transition hover:cursor-pointer',
        className,
      )}
    >
      <span className="px-4 py-2">{children}</span>
      {icon === 'arrow' && (
        <span className="flex shrink-0 items-center justify-center border-l border-white/20 px-2 py-2">
          <img src={arrow} alt="" className="h-6 w-6" />
        </span>
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
        'inline-flex w-fit max-w-full items-center gap-1.5 rounded-lg border border-gray-200 bg-[#E8EAE9] py-2.5 pl-5 pr-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-200',
        className,
      )}
    >
      {children}
      <img src={star} alt="" className="h-6 w-6 shrink-0" />
    </Link>
  )
}

export function SectionBadge({
  children,
  endIcon,
  bgColor = 'bg-[#7147FB1A]',
  borderColor = 'border-[#9E48F9]',
  textColor = 'text-black',
  iconColor = 'bg-[#9E48F9]',
}: {
  children: string
  endIcon?: string
  bgColor?: string
  borderColor?: string
  textColor?: string
  iconColor?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex w-fit shrink-0 items-center gap-1.5 rounded-sm border px-3 py-1 text-xs font-medium',
        bgColor,
        borderColor,
        textColor,
      )}
    >
      {endIcon && <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', iconColor)} />}
      {children}
      {endIcon && <img src={star3} alt="" className="h-4 w-4 shrink-0" />}
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
