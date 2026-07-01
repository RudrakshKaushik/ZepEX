import { Link } from 'react-router-dom'
import footerLogo from '@/assets/footer_logo.png'

const pageLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Workflow', href: '#workflow' },
]

function FooterLinkColumn() {
  return (
    <div className="min-w-[7rem]">
      <p className="text-sm font-bold text-gray-900">Our Pages</p>
      <ul className="mt-4 space-y-3">
        {pageLinks.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              className="text-sm text-gray-800 transition hover:text-[#0066FF]"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function LandingFooter() {
  return (
    <footer className="bg-white pt-20">
      <div className="mx-auto max-w-7xl overflow-hidden border-t border-gray-200 px-4 sm:px-6">
        {/* Content */}
        <div className="pt-12 sm:pt-14">
          <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
            <Link to="/" className="inline-flex shrink-0">
              <img
                src={footerLogo}
                alt="ZepEX x Bitloom"
                className="h-11 w-auto sm:h-12"
              />
            </Link>

            <div className="flex gap-16 sm:gap-20 md:gap-28">
              {/* <FooterLinkColumn /> */}
              <FooterLinkColumn />
            </div>
          </div>
        </div>

        {/* Big brand text below the content */}
        <div
          aria-hidden
          className="pointer-events-none mt-10 flex w-full justify-center overflow-hidden select-none [mask-image:linear-gradient(to_bottom,#000_55%,transparent_100%)]"
        >
          <p className="whitespace-nowrap text-[clamp(9rem,38vw,24rem)] font-bold leading-[0.9] tracking-[-0.04em] text-[#E9E9E9]">
            Zep EX
          </p>
        </div>
      </div>

      <div className="h-3 bg-black sm:h-4" aria-hidden />
    </footer>
  )
}
