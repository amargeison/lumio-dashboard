import Link from 'next/link'

export const metadata = { title: 'Lumio Schools — Integrations' }

const CATEGORIES = [
  {
    icon: '🏫',
    title: 'Management Information Systems',
    desc: 'Two-way sync with your MIS — pupil data, attendance, and timetables always in step.',
    integrations: [
      { name: 'SIMS',       desc: 'Pupil, attendance, and behaviour data sync' },
      { name: 'Arbor',      desc: 'Live API connection for registers and profiles' },
      { name: 'iSAMS',      desc: 'Timetable, assessment, and contact data' },
      { name: 'Bromcom',    desc: 'Behaviour logs and SEN data pipeline' },
      { name: 'ScholarPack', desc: 'Attendance and staff data sync' },
      { name: 'Pupil Asset', desc: 'Assessment and progress data feed' },
    ],
  },
  {
    icon: '📧',
    title: 'Communication & Productivity',
    desc: 'Send parent messages, staff alerts, and reports directly from tools your team already uses.',
    integrations: [
      { name: 'Google Workspace', desc: 'Gmail, Calendar, Drive, and Classroom' },
      { name: 'Microsoft 365',    desc: 'Outlook, Teams, and SharePoint' },
      { name: 'Slack',            desc: 'Staff channel alerts and digest messages' },
      { name: 'ParentMail',       desc: 'Trigger messages via your existing parent comms platform' },
      { name: 'Weduc',            desc: 'Parent notifications and news feed' },
      { name: 'Edulink One',      desc: 'App-based parent and pupil messaging' },
    ],
  },
  {
    icon: '🛡',
    title: 'Safeguarding & SEND',
    desc: 'Keep concern logs, referrals, and EHCP records connected across every system.',
    integrations: [
      { name: 'MyConcern',     desc: 'Push concern logs directly from Lumio' },
      { name: 'CPOMS',         desc: 'Bi-directional safeguarding record sync' },
      { name: 'Provision Map', desc: 'SEND and graduated approach data' },
      { name: 'Edukey',        desc: 'Welfare and intervention records' },
      { name: 'EHM / LCS',     desc: 'Local authority early help and EHCP systems' },
    ],
  },
  {
    icon: '📊',
    title: 'Assessment & Data',
    desc: 'Pull attainment and progress data into Lumio reports without manual exports.',
    integrations: [
      { name: 'FFT Aspire',       desc: 'Contextual progress and attainment data' },
      { name: 'SISRA Analytics',  desc: 'Secondary attainment and progress' },
      { name: 'Target Tracker',   desc: 'Primary assessment and tracking' },
      { name: 'Insight Tracking', desc: 'Pupil progress and gap analysis' },
      { name: 'SIMS Assessment',  desc: 'In-built assessment module sync' },
    ],
  },
  {
    icon: '💳',
    title: 'Finance & HR',
    desc: 'Connect payroll, supply costs, and budget data to your operational workflows.',
    integrations: [
      { name: 'PS Financials',  desc: 'Budget and expenditure data' },
      { name: 'Sage',           desc: 'Finance ledger and cost-centre sync' },
      { name: 'IRIS',           desc: 'Payroll and HR records' },
      { name: 'Supply Desk',    desc: 'Supply booking and spend tracking' },
      { name: 'Every',          desc: 'HR and absence management sync' },
    ],
  },
  {
    icon: '🔌',
    title: 'Open API & Custom',
    desc: 'Not on the list? Connect any system with our REST API or no-code webhook builder.',
    integrations: [
      { name: 'REST API',          desc: 'Full read/write access to all Lumio data' },
      { name: 'Webhooks',          desc: 'Push events to any endpoint in real time' },
      { name: 'Zapier',            desc: '5,000+ app connections, no code needed' },
      { name: 'CSV / SFTP import', desc: 'Scheduled bulk imports for legacy systems' },
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
          <p className="text-xl leading-relaxed mb-10" style={{ color: '#9CA3AF', maxWidth: '2xl' }}>
            Lumio sits alongside your MIS, safeguarding tools, and parent comms platforms — reading and writing data so your team never has to re-enter it.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/schools/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
              style={{ background: 'linear-gradient(135deg,#0D9488,#0F766E)', color: '#F9FAFB' }}
            >
              Start Free Trial
            </Link>
            <Link
              href="https://calendly.com/lumiocms"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
              style={{ border: '1px solid #374151', color: '#9CA3AF' }}
            >
              Book a Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Integration categories */}
      <section className="pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {CATEGORIES.map(cat => (
              <div
                key={cat.title}
                className="rounded-2xl p-8"
                style={{ backgroundColor: '#0D0E17', border: '1px solid #1F2937' }}
              >
                <div className="flex items-start gap-4 mb-6">
                  <span className="text-3xl">{cat.icon}</span>
                  <div>
                    <h2 className="text-lg font-bold mb-1" style={{ color: '#F9FAFB' }}>{cat.title}</h2>
                    <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{cat.desc}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {cat.integrations.map(intg => (
                    <div
                      key={intg.name}
                      className="flex items-start gap-3 rounded-xl px-4 py-3"
                      style={{ backgroundColor: '#111318' }}
                    >
                      <span className="mt-0.5 h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: '#0D9488' }} />
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{intg.name}</p>
                        <p className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>{intg.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
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
            href="https://calendly.com/lumiocms"
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
