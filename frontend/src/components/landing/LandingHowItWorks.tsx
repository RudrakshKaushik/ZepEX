import UploadorForward from '@/assets/UploadorForward.png'
import AIextractsValidates from '@/assets/AIextractsValidates.png'
import ApproveReimburse from '@/assets/ApproveReimburse.png'

function StepBadge({ children }: { children: string }) {
  return (
    <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-[#0066FF]">
      {children}
    </span>
  )
}


export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className=" py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-base font-medium text-[#0066FF]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0066FF]" />
            How It Works
            <span className="text-[10px]">◳</span>
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            From receipt photo to approved report
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-gray-600">
            ZepEX handles the tedious parts — your team just uploads, reviews and approves.
          </p>
        </div>

        <div className="mt-12 space-y-6">
          {/* Step 01 — full width */}
          <div className="rounded-3xl bg-[#f9fafb] p-8 lg:p-10">
            <div className="grid items-center gap-8 lg:grid-cols-2">
              <div>
                <StepBadge>Step 01</StepBadge>
                <h3 className="mt-4 text-xl font-bold text-gray-900">Upload or Forward</h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-600">
                  Employees snap a photo, upload a PDF, or email receipts to your company inbox.
                </p>
              </div>
              <img src={UploadorForward} alt="Upload or Forward" className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Steps 02 & 03 — side by side */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl  bg-[#f9fafb] p-8 lg:p-10">
              <StepBadge>Step 02</StepBadge>
              <h3 className="mt-4 text-xl font-bold text-gray-900">AI extracts & Validates</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Our AI engine parses the document, applies your policy rules, and flags anything out
                of bounds.
              </p>
              <img src={AIextractsValidates} alt="AI extracts & Validates" className="w-full h-full object-contain" />
            </div>

            <div className="rounded-3xl bg-[#f9fafb] p-8 lg:p-10">
              <StepBadge>Step 03</StepBadge>
              <h3 className="mt-4 text-xl font-bold text-gray-900">Approve & Reimburse</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Managers and accounts review in one flow — then mark reports paid with a full audit
                trail.
              </p>
              <img src={ApproveReimburse} alt="Approve & Reimburse" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
