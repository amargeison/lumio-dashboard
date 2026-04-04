import Link from 'next/link'

export const metadata = { title: 'Lumio Schools — Integrations' }

const DEPARTMENTS = [
  {
    icon: '📵',
    title: 'Attendance & Registers',
    color: '#0D9488',
    desc: 'Connect your MIS to automate absence alerts, parent notifications, and attendance reporting across every class.',
    tools: [
      { name: 'SIMS',          desc: 'Live register data, pupil profiles, and absence records' },
      { name: 'Arbor',         desc: 'Real-time register sync and parent messaging triggers' },
      { name: 'Bromcom',       desc: 'Attendance data pipeline with behaviour integration' },
      { name: 'iSAMS',         desc: 'Timetable-aware absence triggers and parent alerts' },
      { name: 'ScholarPack',   desc: 'Attendance and pupil data sync' },
      { name: 'ParentMail',    desc: 'Trigger absence messages via your existing parent comms platform' },
      { name: 'Weduc',         desc: 'App-based parent notifications for absences and updates' },
      { name: 'Edulink One',   desc: 'Absence alerts and register summaries via the Edulink app' },
    ],
  },
  {
    icon: '🛡',
    title: 'Safeguarding',
    color: '#6C3FC5',
    desc: 'Push concern logs, sync referral records, and keep your safeguarding audit trail complete — without manual re-entry.',
    tools: [
      { name: 'MyConcern',         desc: 'Push concern logs directly from Lumio in 45 seconds' },
      { name: 'CPOMS',             desc: 'Bi-directional safeguarding record sync with full audit trail' },
      { name: 'Edukey',            desc: 'Welfare and intervention records linked to pupil profiles' },
      { name: 'EHM / LCS',         desc: 'Local authority early help and EHCP case management' },
      { name: 'Safeguard Network', desc: 'Multi-agency referral tracking and case coordination' },
    ],
  },
  {
    icon: '🎓',
    title: 'SEND & Inclusion',
    color: '#3B82F6',
    desc: 'Keep EHCP records, graduated approach cycles, and intervention tracking in sync across your SEND systems.',
    tools: [
      { name: 'Provision Map', desc: 'SEND and graduated approach data — Assess, Plan, Do, Review' },
      { name: 'SIMS SEN',      desc: 'SEN register, EHCP records, and support plan sync' },
      { name: 'Arbor SEND',    desc: 'SEND pupil profiles and intervention tracking' },
      { name: 'Edukey SEND',   desc: 'SEND case notes and external agency contact log' },
      { name: 'EHM / LCS',     desc: 'EHCP annual review workflows and LA submission' },
      { name: 'Bromcom SEND',  desc: 'SEN register and provision data pipeline' },
    ],
  },
  {
    icon: '👩‍🏫',
    title: 'HR & Staff',
    color: '#22C55E',
    desc: 'Connect payroll, DBS, supply, and HR systems so staff data flows without manual re-entry or missed renewals.',
    tools: [
      { name: 'IRIS',        desc: 'Payroll and HR records — new starters, leavers, pay changes' },
      { name: 'Every',       desc: 'Absence management, leave tracking, and HR record sync' },
      { name: 'Supply Desk', desc: 'Supply booking confirmation and spend tracking per agency' },
      { name: 'DBS Online',  desc: 'DBS status and renewal date sync for all staff and volunteers' },
      { name: 'iHASCO',      desc: 'Safeguarding CPD completion tracking and expiry alerts' },
      { name: 'SIMS Staff',  desc: 'Staff profiles, contracts, and timetable data' },
    ],
  },
  {
    icon: '💳',
    title: 'Finance & Budget',
    color: '#F59E0B',
    desc: 'Connect your finance system to Lumio so budget alerts, spend tracking, and financial reports run automatically.',
    tools: [
      { name: 'PS Financials',   desc: 'Budget and expenditure data — cost centres, POs, and forecasts' },
      { name: 'Sage',            desc: 'Finance ledger, cost-centre sync, and payment reconciliation' },
      { name: 'SIMS Finance',    desc: 'Integrated school finance with pupil and HR data' },
      { name: 'Supply Desk',     desc: 'Supply spend per agency, per term — automatically logged' },
      { name: 'Xero',            desc: 'Cloud accounting for smaller schools and MAT entities' },
      { name: 'CFO for Schools', desc: 'School financial health metrics and benchmarking' },
    ],
  },
  {
    icon: '📊',
    title: 'Governance & Reporting',
    color: '#EC4899',
    desc: 'Pull assessment data, generate governor reports, and feed LA returns — without anyone compiling a spreadsheet.',
    tools: [
      { name: 'Governor Hub',      desc: 'Governor meeting packs, actions, and board document management' },
      { name: 'Microsoft 365',     desc: 'Outlook, Teams, SharePoint — governor communications and file sharing' },
      { name: 'Google Workspace',  desc: 'Gmail, Drive, Classroom — reports and document distribution' },
      { name: 'FFT Aspire',        desc: 'Contextual progress and attainment data for governor reports' },
      { name: 'SchoolDash',        desc: 'Cross-school analytics and Ofsted preparation data' },
      { name: 'SISRA Analytics',   desc: 'Secondary attainment and progress for reporting and SEF' },
    ],
  },
]

export default function SchoolsIntegrationsPage() {
  return (
    <div style={{ backgroundColor: '#07080F', minHeight: '100vh' }}>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-semibold"
            style={{ backgroundColor: 'rgba(13,148,136,0.12)', color: '#0D9488' }}
          >
            🔗 Lumio Schools Integrations
          </div>
          <h1
            className="font-black leading-tight mb-5"
            style={{ color: '#F9FAFB', fontSize: 'clamp(1.875rem, 4vw, 3rem)' }}
          >
            Connects to Every System Your School Already Uses
          </h1>
          <p className="text-xl leading-relaxed mb-10" style={{ color: '#9CA3AF' }}>
            Lumio sits alongside your MIS, safeguarding tools, and parent comms platforms — reading and writing data across every team, so your staff never re-enter it.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/signup?portal=schools"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
              style={{ background: 'linear-gradient(135deg,#0D9488,#0F766E)', color: '#F9FAFB' }}
            >
              Start Free Trial
            </Link>
            <Link
              href="https://calendly.com/lumiocms/lumio-schools"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
              style={{ border: '1px solid #374151', color: '#9CA3AF' }}
            >
              Book a Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Department integration categories */}
      <section className="pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {DEPARTMENTS.map(dept => (
              <div
                key={dept.title}
                className="rounded-2xl p-8"
                style={{ backgroundColor: '#0D0E17', border: `1px solid ${dept.color}33` }}
              >
                <div className="flex items-start gap-4 mb-6">
                  <span className="text-3xl">{dept.icon}</span>
                  <div>
                    <h2 className="text-lg font-bold mb-1" style={{ color: '#F9FAFB' }}>{dept.title}</h2>
                    <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{dept.desc}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {dept.tools.map(tool => (
                    <div
                      key={tool.name}
                      className="flex items-start gap-3 rounded-xl px-4 py-3"
                      style={{ backgroundColor: '#111318' }}
                    >
                      <span className="mt-0.5 h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: dept.color }} />
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{tool.name}</p>
                        <p className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>{tool.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open API */}
      <section className="pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div
            className="rounded-2xl p-8"
            style={{ backgroundColor: '#0D0E17', border: '1px solid #1F2937' }}
          >
            <div className="flex items-start gap-4 mb-6">
              <span className="text-3xl">🔌</span>
              <div>
                <h2 className="text-lg font-bold mb-1" style={{ color: '#F9FAFB' }}>Open API &amp; Custom Connections</h2>
                <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>Not on the list? Connect any system with our REST API or no-code webhook builder.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
              {[
                { name: 'REST API',           desc: 'Full read/write access to all Lumio school data' },
                { name: 'Webhooks',           desc: 'Push events to any endpoint in real time' },
                { name: 'Zapier',             desc: '5,000+ app connections, no code needed' },
                { name: 'CSV / SFTP import',  desc: 'Scheduled bulk imports for legacy MIS systems' },
              ].map(tool => (
                <div
                  key={tool.name}
                  className="flex items-start gap-3 rounded-xl px-4 py-3"
                  style={{ backgroundColor: '#111318' }}
                >
                  <span className="mt-0.5 h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: '#0D9488' }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{tool.name}</p>
                    <p className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>{tool.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="pb-24 px-6">
        <div
          className="max-w-4xl mx-auto rounded-2xl px-8 py-14 text-center"
          style={{ background: 'linear-gradient(135deg,rgba(13,148,136,0.15),rgba(108,63,197,0.15))', border: '1px solid rgba(13,148,136,0.25)' }}
        >
          <h2 className="text-2xl font-black mb-3" style={{ color: '#F9FAFB' }}>
            Don&apos;t see your system?
          </h2>
          <p className="mb-8 text-base" style={{ color: '#9CA3AF' }}>
            We add new integrations every month. If your MIS or tool isn&apos;t listed, get in touch — most custom connections are live within two weeks.
          </p>
          <Link
            href="https://calendly.com/lumiocms/lumio-schools"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
            style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}
          >
            Request an Integration
          </Link>
        </div>
      </section>

    </div>
  )
}
