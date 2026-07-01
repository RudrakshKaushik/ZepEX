import UploadorForward from '@/assets/UploadorForward.png'
import AIextractsValidates from '@/assets/AIextractsValidates.png'
import ApproveReimburse from '@/assets/ApproveReimburse.png'
import { SectionBadge } from './landing-ui'

function StepBadge({ children }: { children: string }) {
  return (
    <SectionBadge>
      {children}
    </SectionBadge>
  )
}


export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className=" py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center">
          <SectionBadge endIcon="◳">How It Works</SectionBadge>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            From receipt photo to approved report
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-gray-600">
            ZepEX handles the tedious parts your team just uploads, reviews and approves.
          </p>
        </div>

        <div className="mt-12 space-y-6">
          {/* Step 01 — full width */}
          <div className="rounded-3xl bg-[#F5F5F7] p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="flex flex-col items-start justify-start gap-6">
                <StepBadge>Step 01</StepBadge>
                <div>
                  <h3 className="mt-4 text-5xl font-bold text-gray-900">Upload or Forward</h3>
                  <p className="mt-2 max-w-md text-lg leading-relaxed text-gray-600">
                    Employees snap a photo, upload a PDF, or email receipts to your company inbox.
                  </p>
                </div>
              </div>
              <img src={UploadorForward} alt="Upload or Forward" className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Steps 02 & 03 — side by side */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl  bg-[#F5F5F7] p-8 lg:p-10">
              <StepBadge>Step 02</StepBadge>
              <div className='mb-6'>
                <h3 className="mt-4 text-4xl font-bold text-gray-900">AI extracts & Validates</h3>
                <p className="mt-2 text-base leading-relaxed text-gray-600">
                  Our AI engine parses the document, applies your policy rules, and flags anything out
                  of bounds.
                </p>
              </div>
              <img src={AIextractsValidates} alt="AI extracts & Validates" className="w-full object-contain" />
            </div>

            <div className="rounded-3xl bg-[#F5F5F7] p-8 lg:p-10">
              <StepBadge>Step 03</StepBadge>
              <div className='mb-6'>
                <h3 className="mt-4 text-4xl font-bold text-gray-900">Approve & Reimburse</h3>
                <p className="mt-2 text-base leading-relaxed text-gray-600">
                  Managers and accounts review in one flow then mark reports paid with a full audit
                  trail.
                </p>
              </div>
              <img src={ApproveReimburse} alt="Approve & Reimburse" className="w-full object-contain" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
