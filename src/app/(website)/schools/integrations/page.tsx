import Link from 'next/link'

export const metadata = { title: 'Lumio Schools — Integration Roadmap' }

// Pre-launch posture: none of these are shipped today. The first wave is the
// set Lumio plans to scope and build with the first founding schools.
// "Considering" is the next-tier list — open to building any of these if a
// founding school depends on it. Everything else has been pulled.

const FIRST_WAVE = [
  {
    icon: '🔑',
    title: 'SSO',
    desc: 'Single sign-on with the providers most UK schools already use.',
    tools: [
      { name: 'Google Workspace', desc: 'Staff sign in with their existing Google for Education accounts.' },
      { name: 'Microsoft 365',    desc: 'Staff sign in with their existing Microsoft 365 / Entra accounts.' },
    ],
  },
  {
    icon: '🏫',
    title: 'MIS sync',
    desc: 'Pupil rolls, class lists, year groups and staff records flowing from the school MIS to Lumio.',
    tools: [
      { name: 'Arbor',   desc: 'Rostering and pupil-data sync. Priority for the first cohort.' },
      { name: 'SIMS',    desc: 'Rostering and pupil-data sync. Priority for the first cohort.' },
      { name: 'Bromcom', desc: 'Rostering and pupil-data sync. Priority for the first cohort.' },
    ],
  },
  {
    icon: '🛡',
    title: 'Safeguarding',
    desc: 'Push concern logs and keep the safeguarding audit trail complete without re-entry.',
    tools: [
      { name: 'MyConcern', desc: 'Push concern logs into MyConcern with structured timestamps and audit trail.' },
      { name: 'CPOMS',     desc: 'Bi-directional safeguarding record sync with full audit trail.' },
    ],
  },
]

const CONSIDERING = [
  // Anything below is something Lumio is open to building if a founding
  // school depends on it. They are NOT on the immediate roadmap.
  'iSAMS', 'ScholarPack', 'Edulink One',
  'ParentMail', 'Weduc',
  'Edukey', 'Provision Map', 'EHM / LCS',
  'IRIS', 'Every', 'Supply Desk', 'iHASCO',
  'PS Financials', 'Sage', 'Xero',
  'FFT Aspire', 'SISRA', 'Target Tracker', 'SchoolDash',
  'Governor Hub',
]

export default function SchoolsIntegrationsPage() {
  return (
    <div style={{ backgroundColor: '#07080F', minHeight: '100vh' }}>

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-semibold"
            style={{ backgroundColor: 'rgba(13,148,136,0.12)', color: '#0D9488' }}
          >
            🔗 Integration Roadmap
          </div>
          <h1
            className="font-black leading-tight mb-5"
            style={{ color: '#F9FAFB', fontSize: 'clamp(1.875rem, 4vw, 3rem)' }}
          >
            What we plan to build, in this order.
          </h1>
          <p className="text-xl leading-relaxed mb-10" style={{ color: '#9CA3AF' }}>
            Lumio Schools is pre-launch — none of the integrations below are live today. The first wave is the set we plan to scope and ship with the first founding schools. The rest is the list we are open to building if a founding school depends on it.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/signup?portal=schools"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
              style={{ background: 'linear-gradient(135deg,#0D9488,#0F766E)', color: '#F9FAFB' }}
            >
              Talk to us about your priorities
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

      {/* First wave */}
      <section className="pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-6 text-center" style={{ color: '#0D9488' }}>First wave — in development</p>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {FIRST_WAVE.map(group => (
              <div
                key={group.title}
                className="rounded-2xl p-8"
                style={{ backgroundColor: '#0D0E17', border: '1px solid rgba(13,148,136,0.35)' }}
              >
                <div className="flex items-start gap-4 mb-6">
                  <span className="text-3xl">{group.icon}</span>
                  <div>
                    <h2 className="text-lg font-bold mb-1" style={{ color: '#F9FAFB' }}>{group.title}</h2>
                    <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{group.desc}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {group.tools.map(tool => (
                    <div
                      key={tool.name}
                      className="flex items-start gap-3 rounded-xl px-4 py-3"
                      style={{ backgroundColor: '#111318' }}
                    >
                      <span className="mt-0.5 h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: '#0D9488' }} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{tool.name}</p>
                          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>Coming soon</span>
                        </div>
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

      {/* Considering */}
      <section className="pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div
            className="rounded-2xl p-8"
            style={{ backgroundColor: '#0D0E17', border: '1px solid #1F2937' }}
          >
            <div className="flex items-start gap-4 mb-6">
              <span className="text-3xl">🧭</span>
              <div>
                <h2 className="text-lg font-bold mb-1" style={{ color: '#F9FAFB' }}>Considering</h2>
                <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>
                  Names below are not on the immediate roadmap, but Lumio is open to building any of them if a founding school depends on it. If yours is here — or somewhere else — get in touch and we will scope it.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {CONSIDERING.map(name => (
                <span
                  key={name}
                  className="rounded-full px-3 py-1.5 text-xs font-medium"
                  style={{ backgroundColor: '#111318', color: '#9CA3AF', border: '1px solid #1F2937' }}
                >
                  {name}
                </span>
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
            The roadmap is shaped by the schools who join us first. If your MIS, safeguarding tool or finance system is not listed, tell us — we will scope it together.
          </p>
          <Link
            href="https://calendly.com/lumiocms/lumio-schools"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
            style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}
          >
            Talk to us
          </Link>
        </div>
      </section>

    </div>
  )
}
