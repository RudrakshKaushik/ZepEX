import { SectionIntro } from '@/components/landing/landing-ui'
import ai_receipt_icon from '@/assets/ai_receipt_icon.png'
import ai_receipt_img from '@/assets/ai_receipt_img.png'
import real_time_icon from '@/assets/real_time_icon.png'
import real_time_img from '@/assets/real_time_img.png'
import role_based_icon from '@/assets/role_based_icon.png'
import role_based_img from '@/assets/role_based_img.png'
import end_to_end_icon from '@/assets/end_to_end_icon.png'
import end_to_end_img from '@/assets/end_to_end_img.png'
import email_ing_icon from '@/assets/email_ing_icon.png'
import email_ing_img from '@/assets/email_ing_img.png'
import compilance_icon from '@/assets/compilance_icon.png'
import compilance_img from '@/assets/compilance_img.png'

const sectionDescription =
  'Preview your complete workspace, manage expenses, track approvals, and access everything in one organized place.'

const capabilities = [
  {
    icon: ai_receipt_icon,
    img: ai_receipt_img,
    title: 'AI Receipt Extraction',
    description:
      'Gemini reads invoices and receipts — vendor, date, amount, and line items — so employees stop typing expenses by hand.',
  },
  {
    icon: real_time_icon,
    img: real_time_img,
    title: 'Real-Time Policy Checks',
    description:
      'Category limits, duplicate detection, and violation flags run automatically before reports reach managers.',
  },
  {
    icon: role_based_icon,
    img: role_based_img,
    title: 'Role Based Workspaces',
    description:
      'Dedicated dashboards for admins, managers, employees, and accounts — each sees only what they need.',
  },
  {
    icon: end_to_end_icon,
    img: end_to_end_img,
    title: 'End-To-End Visibility',
    description:
      'Track every report from draft upload through manager approval, accounts review, and payout.',
  },
  {
    icon: email_ing_icon,
    img: email_ing_img,
    title: 'Email Ingestion',
    description:
      'Forward receipts to your company inbox and ZepEX picks them up, extracts data, and queues them for review.',
  },
  {
    icon: compilance_icon,
    img: compilance_img,
    title: 'Compliance Ready Logs',
    description:
      'Immutable audit logs capture who uploaded, approved, or changed every expense for finance teams.',
  },
]

export function LandingCapabilities() {
  return (
    <section id="features" className="bg-[#f9fafb] py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionIntro
          badge="Platform Capabilities"
          badgeEndIcon="⊞"
          title="Everything Finance Teams Need, Powered by AI"
          description={sectionDescription}
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((item) => (
            <div
              key={item.title}
              className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex h-15 w-20 items-center justify-center">
                <img src={item.icon} alt={item.title} className="h-full w-full text-[#0066FF]" />
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">{item.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600">{item.description}</p>
              <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
