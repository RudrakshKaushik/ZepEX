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
  // dotGridStyle,
  LandingMarquee,
  PrimaryButton,
  SecondaryButton,
  SectionBadge,
  ZepLogo,
} from '@/components/landing/landing-ui'
import { cn } from '@/lib/utils'
import heroImg from '@/assets/heroImg.png'
import herobg from '@/assets/herobg.png'

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
    <div className="relative flex flex-1 items-center justify-center px-4 py-2">
      {showDivider && (
        <div className="absolute left-0 top-1/2 hidden h-18 w-px -translate-y-1/2 bg-gray-200 md:block">
          <div className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[#3600FC]" />
        </div>
      )}
      <div className="text-center">
        <p className="text-3xl font-bold text-[#0066FF] md:text-4xl">{stat.value}</p>
        <p className="mt-1 text-sm text-gray-600">{stat.label}</p>
      </div>
    </div>
  )
}

function HighlightItem({ icon, text }: { icon: string; text: string }) {
  return (
    <span className="flex w-[10.5rem] shrink-0 flex-col gap-2 text-sm text-white sm:w-auto sm:text-base">
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
    <div className="bg-white text-gray-900">
      {/* Banner — scrolls away */}
      <div className="bg-white px-4 py-2.5">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-3">
          <Link
            to="/register"
            className="rounded-full bg-[#15007E] px-3.5 py-1 text-sm md:text-base font-semibold text-white"
          >
            Try Now
          </Link>
          <span className="text-xs md:text-base text-black font-semibold">Managing your Expenses now gets easier</span>
        </div>
      </div>

      {/* Sticky nav — semi-transparent over hero; hero pulled up behind it */}
      <div
        className={cn(
          'sticky top-0 z-50 px-4 pb-2 pt-4 transition-[background-color] duration-200 sm:px-6',
          scrolled ? 'bg-transparent' : 'bg-[#040419]/40',
        )}
      >
        <header className="mx-auto max-w-7xl rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-[0_4px_24px_rgba(0,0,0,0.08)] sm:px-6">
          <div className="grid grid-cols-[1fr_auto] items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
            <ZepLogo className="justify-self-start" />
            <nav className="col-span-2 hidden items-center justify-center gap-8 text-base font-semibold text-gray-700 md:col-span-1 md:flex">
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
            <div className="flex items-center justify-end gap-4 justify-self-end">
              <Link
                to="/login"
                className="hidden text-sm font-semibold text-gray-900 hover:text-[#0066FF] md:inline"
              >
                Sign In
              </Link>
              <PrimaryButton to="/register" icon="arrow">
                Get Started
              </PrimaryButton>
            </div>
          </div>
        </header>
      </div>

      {/* Hero — herobg extends behind nav via negative margin */}
      <div className="relative -mt-24 overflow-x-clip bg-[#040419] pt-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${herobg})` }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[#040419]/50"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#040419]/40 via-transparent to-[#040419]/10"
        />

        <section className="relative z-10 pb-12 pt-6 sm:pb-14 sm:pt-8 lg:pb-16 lg:pt-10 ">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-10 xl:gap-12">
              <div className="flex min-w-0 flex-col items-start">
                <SectionBadge
                  endIcon="▣"
                  bgColor="bg-white/30"
                  borderColor="border-[#FFFFFF]"
                  textColor="text-white"
                  iconColor="bg-[#FFFFFF]"
                >
                  Manage Expenses
                </SectionBadge>
                <h1 className="mt-4 text-[1.75rem] font-bold leading-[1.15] tracking-tight text-white sm:mt-5 sm:text-4xl lg:text-[2.5rem] lg:leading-[1.12]">
                  From Receipt to Reimbursement Effortlessly with automated intelligence.
                </h1>
                <p className="mt-4 max-w-lg text-sm leading-relaxed text-gray-200 sm:mt-5 sm:text-base">
                  Automate receipt processing, policy validation, approval workflows, multi-currency
                  reimbursements, and payments with AI built for modern enterprises.
                </p>
                <div className="mt-6 flex w-full flex-col gap-3 sm:mt-8 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
                  <PrimaryButton to="/register" icon="arrow">
                    Get Started Free
                  </PrimaryButton>
                  <SecondaryButton to="/login">Access Workspace</SecondaryButton>
                </div>

                <LandingMarquee
                  className="mt-8 w-full sm:mt-10"
                  desktopClassName="mt-10 flex-wrap items-start gap-8 lg:mt-12"
                >
                  {heroHighlights.map((item) => (
                    <HighlightItem key={item.text} icon={item.icon} text={item.text} />
                  ))}
                </LandingMarquee>
              </div>

              <div className="mx-auto w-full max-w-sm min-w-0 sm:max-w-md lg:mx-0 lg:max-w-none">
                <div
                  className={cn(
                    'flex w-full items-center justify-center overflow-hidden rounded-3xl shadow-xl',
                    'min-h-[24rem] lg:min-h-[30rem]',
                    'bg-gradient-to-br from-[#0066FF] via-[#3b82f6] to-[#67e8f9]',
                  )}
                >
                  <img
                    src={heroImg}
                    alt="ZepEX expense management"
                    className="h-full w-full object-contain"
                  />
                </div>
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
            desktopClassName="mt-10 flex w-full items-stretch"
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
