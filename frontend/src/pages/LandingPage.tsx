import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import CreditCard from '@/assets/CreditCard.png'
import Layers from '@/assets/Layers.png'
import FileSearch from '@/assets/FileSearch2.png'
import { LandingComparison } from '@/components/landing/LandingComparison'
import { LandingCapabilities } from '@/components/landing/LandingCapabilities'
import { LandingHowItWorks } from '@/components/landing/LandingHowItWorks'
import { LandingPreview } from '@/components/landing/LandingPreview'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { LandingWorkspaces } from '@/components/landing/LandingWorkspaces'
import {
  dotGridStyle,
  LandingMarquee,
  PrimaryButton,
  SecondaryButton,
  SectionBadge,
  ZepLogo,
} from '@/components/landing/landing-ui'
import { cn } from '@/lib/utils'
import heroImg from '@/assets/heroImg.png'

const stats = [
  { value: '90%', label: 'Less manual data entry' },
  { value: '<30s', label: 'Average receipt processing' },
  { value: '4 roles', label: 'Unified approval workflow' },
  { value: '100%', label: 'Audit trail coverage' },
]

const heroHighlights = [
  { icon: CreditCard, text: 'No credit card required' },
  { icon: Layers, text: 'Multi tenant isolation' },
  { icon: FileSearch, text: 'SOC ready audit logs' },
]

function StatItem({
  stat,
  showDivider,
}: {
  stat: (typeof stats)[number]
  showDivider?: boolean
}) {
  return (
    <div className="flex items-center">
      {showDivider && (
        <div className="relative mx-4 hidden h-12 w-px bg-gray-200 md:block">
          <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[#FD882C]" />
        </div>
      )}
      <div className="min-w-[9rem] shrink-0 px-2 py-2 text-center md:min-w-[10rem] md:px-4">
        <p className="text-3xl font-bold text-[#0066FF] md:text-4xl">{stat.value}</p>
        <p className="mt-1 text-sm text-gray-600">{stat.label}</p>
      </div>
    </div>
  )
}

function HighlightItem({ icon, text }: { icon: string; text: string }) {
  return (
    <span className="flex w-[10.5rem] shrink-0 flex-col gap-2 text-sm text-gray-600 sm:w-auto sm:text-base">
      <img src={icon} alt="" className="h-10 w-10 sm:h-12 sm:w-12" />
      <span className="leading-snug">{text}</span>
    </span>
  )
}

export function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Banner — scrolls away */}
      <div className="bg-[#0066FF] px-4 py-2.5">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-3">
          <Link
            to="/register"
            className="rounded-full bg-white px-3.5 py-1 text-sm md:text-base font-semibold text-gray-900"
          >
            Try Now
          </Link>
          <span className="text-xs md:text-base text-white">Managing your Expenses now gets easier</span>
        </div>
      </div>

      {/* Sticky nav — dotted at top, transparent once scrolled */}
      <div
        className={cn(
          'sticky top-0 z-50 px-4 pb-2 pt-4 transition-[background] duration-200 sm:px-6',
          scrolled ? 'bg-transparent' : '',
        )}
        style={scrolled ? undefined : dotGridStyle}
      >
        <header className="mx-auto max-w-7xl rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-[0_4px_24px_rgba(0,0,0,0.08)] sm:px-6">
          <div className="flex items-center justify-between gap-4 md:grid md:grid-cols-[1fr_auto_1fr]">
            <ZepLogo />
            <nav className="hidden items-center justify-center gap-8 text-base font-medium text-gray-700 md:flex">
              <a href="#features" className="hover:text-[#0066FF]">
                Features
              </a>
              <a href="#how-it-works" className="hover:text-[#0066FF]">
                How It Works
              </a>
              <a href="#workflow" className="hover:text-[#0066FF]">
                Workflow
              </a>
            </nav>
            <div className="flex justify-end md:justify-end">
              <div className="flex items-center gap-4">
                <Link to="/login" className="w-full text-sm font-semibold text-gray-900 hover:text-[#0066FF] justify-center sm:w-auto hidden md:flex items-center gap-2">
                  Sign In
                </Link>
                <PrimaryButton to="/register" icon="arrow">
                  Get Started
                </PrimaryButton>
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* Hero */}
      <div className="overflow-x-clip" style={dotGridStyle}>
        <section className="relative">
          <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-2 lg:gap-12 lg:py-16">
            <div className="min-w-0">
              <SectionBadge endIcon="▣">Manage Expenses</SectionBadge>
              <h1 className="mt-4 text-[1.75rem] font-bold leading-[1.15] tracking-tight text-gray-900 sm:mt-5 sm:text-4xl">
              From Receipt to Reimbursement Effortlessly with automated intelligence.
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-gray-600 sm:mt-5 sm:text-base">
              Automate receipt processing, policy validation, approval workflows, multi-currency reimbursements, and payments with AI built for modern enterprises.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center">
                <PrimaryButton
                  to="/register"
                  icon="arrow"
                  className="w-full justify-center sm:w-auto"
                >
                  Get Started Free
                </PrimaryButton>
                <SecondaryButton to="/login" className="w-full justify-center sm:w-auto">
                  Access Workspace
                </SecondaryButton>
              </div>

              <LandingMarquee
                className="mt-6 sm:mt-8"
                desktopClassName="mt-12 flex-wrap items-start gap-8"
              >
                {heroHighlights.map((item) => (
                  <HighlightItem key={item.text} icon={item.icon} text={item.text} />
                ))}
              </LandingMarquee>
            </div>
            <div className="mx-auto w-full max-w-sm min-w-0 sm:max-w-md lg:max-w-none">
              <div
                className={cn(
                  'aspect-square w-full max-h-[min(80vw,20rem)] overflow-hidden rounded-3xl shadow-xl sm:max-h-none',
                  'bg-gradient-to-br from-[#0066FF] via-[#3b82f6] to-[#67e8f9]',
                )}
              >
                <img
                  src={heroImg}
                  alt="ZepEX expense management dashboard"
                  className="h-full w-full"
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Stats */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-center text-xl font-bold text-gray-900 sm:text-2xl">
            Transforming Expense Management With Smarter Automation
          </h2>

          <LandingMarquee
            className="mt-10"
            desktopClassName="mt-10 flex-wrap items-center justify-between"
          >
            {stats.map((stat, i) => (
              <StatItem key={stat.label} stat={stat} showDivider={i > 0} />
            ))}
          </LandingMarquee>
        </div>
      </section>

      <LandingHowItWorks />
      <LandingPreview />
      <LandingComparison />
      <LandingCapabilities />
      <LandingWorkspaces />
      <LandingFooter />
    </div>
  )
}
