export const metadata = { title: 'Lumio Schools — 150 Workflows' }

const CATEGORIES = [
  {
    icon: '📵',
    title: 'Attendance & Absence',
    count: 28,
    workflows: [
      { name: 'Morning register trigger',     desc: 'Fires the moment a pupil is marked absent' },
      { name: 'Automated parent SMS',          desc: 'Sent within 60 seconds of absence' },
      { name: 'Automated parent email',        desc: 'Full HTML email with school branding' },
      { name: 'No-response escalation',        desc: "DSL alerted if parent doesn't reply by 9:30am" },
      { name: 'Persistent absence flag',       desc: 'Auto-flags when pupil hits 90% threshold' },
      { name: 'Attendance weekly report',      desc: 'Auto-generated every Monday at 7am' },
      { name: 'Class-level attendance alert',  desc: 'Notifies HoY when a class drops below target' },
      { name: 'Year group trend report',       desc: 'Monthly breakdown by year group' },
      { name: 'Governor attendance digest',    desc: 'Termly summary formatted for governors' },
    ],
  },
  {
    icon: '🛡',
    title: 'Safeguarding',
    count: 34,
    workflows: [
      { name: 'Concern log submission',       desc: '45-second logging from any device' },
      { name: 'DSL instant notification',     desc: 'Push, email and in-app alert on every concern' },
      { name: 'Multi-agency referral tracker',desc: 'Log and track all external referrals' },
      { name: 'EHCP review reminder',         desc: 'Automated reminder 6 weeks before review date' },
      { name: 'Ofsted export generator',      desc: 'Filtered audit trail in 30 seconds' },
      { name: 'Pattern detection alert',      desc: 'Flags repeated concern patterns for a pupil' },
      { name: 'KCSiE compliance check',       desc: 'Annual checklist aligned to statutory update' },
      { name: 'Staff training tracker',       desc: 'Logs and reminds on safeguarding CPD' },
      { name: 'Case closure workflow',        desc: 'Structured sign-off with audit trail' },
    ],
  },
  {
    icon: '📋',
    title: 'Supply Cover',
    count: 22,
    workflows: [
      { name: 'Staff absence trigger',       desc: 'Cover process starts the moment absence is logged' },
      { name: 'Agency contact sequence',     desc: 'Contacts preferred agencies in order' },
      { name: 'Confirmation receipt',        desc: 'Logs cover confirmation automatically' },
      { name: 'Uncovered lesson alert',      desc: "Headteacher notified if cover isn't confirmed by 8am" },
      { name: 'Cover spend tracker',         desc: 'Running cost per agency, per term' },
      { name: 'Agency reliability report',   desc: 'Rates agencies by response time and fill rate' },
    ],
  },
  {
    icon: '📊',
    title: 'Reporting & Insights',
    count: 26,
    workflows: [
      { name: 'AI Morning Briefing',          desc: 'Daily school summary at 7:00am' },
      { name: 'Weekly headteacher digest',    desc: 'Key metrics every Monday' },
      { name: 'Governor termly report',       desc: 'Auto-formatted, ready to share' },
      { name: 'LA submission pack',           desc: 'Generates required local authority reports' },
      { name: 'Ofsted self-evaluation data',  desc: 'Pulls key data for SEF completion' },
      { name: 'Pupil premium tracker',        desc: 'Monitors outcomes for PP cohort' },
      { name: 'Exclusion log & trend',        desc: 'Logs all exclusions with pattern analysis' },
      { name: 'SEN register summary',         desc: 'Live count and category breakdown' },
      { name: 'Cross-school MAT report',      desc: 'Trust-wide benchmarking dashboard' },
    ],
  },
  {
    icon: '🎓',
    title: 'SEND & Pupil Support',
    count: 24,
    workflows: [
      { name: 'SEND pupil profile',           desc: 'Centralised record for each SEND pupil' },
      { name: 'Graduated approach tracker',   desc: 'Assess, Plan, Do, Review cycle' },
      { name: 'EHCP milestone tracker',       desc: 'Tracks actions and deadlines' },
      { name: 'External agency log',          desc: 'Records all CAMHS, SALT, EP contacts' },
      { name: 'Intervention tracking',        desc: 'Logs and measures intervention impact' },
      { name: 'Annual review scheduler',      desc: 'Auto-schedules and sends invites' },
    ],
  },
  {
    icon: '🏫',
    title: 'School Operations',
    count: 16,
    workflows: [
      { name: 'Staff CPD tracker',            desc: 'Logs all training with expiry reminders' },
      { name: 'Policy review reminder',       desc: 'Alerts when a school policy is due for review' },
      { name: 'DBS renewal tracker',          desc: 'Flags staff DBS renewals 3 months ahead' },
      { name: 'Premises maintenance log',     desc: 'Log and track facilities issues' },
      { name: 'Budget alert',                 desc: 'Notifies SBM when spend exceeds threshold' },
      { name: 'Term dates calendar sync',     desc: 'Auto-syncs key dates across staff systems' },
    ],
  },
]

export default function SchoolsWorkflowsPage() {
  return (
    <div style={{ backgroundColor: '#07080F', color: '#E8EDF4', minHeight: '100vh' }}>
      <div className="max-w-6xl mx-auto px-6 pt-36 pb-24">

        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#C8960C', letterSpacing: '0.22em' }}>
            Platform Workflows
          </p>
          <h1 className="font-black mb-5" style={{ color: '#F9FAFB', fontSize: 'clamp(2rem, 4vw, 3.25rem)', lineHeight: 1.05 }}>
            150 workflows.<br /><em style={{ color: '#C8960C' }}>One platform.</em>
          </h1>
          <p className="text-lg mx-auto max-w-2xl leading-relaxed" style={{ color: '#9CA3AF' }}>
            Every school process, automated. From attendance to safeguarding, supply cover to governor reports — Lumio Schools runs the workflows that used to eat your day.
          </p>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-16 mb-16">
          {[
            { num: '150+', label: 'Pre-built workflows' },
            { num: '6',    label: 'Core modules' },
            { num: '∞',   label: 'Custom workflows' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <span className="block font-black leading-none mb-1" style={{ color: '#C8960C', fontSize: 48 }}>{s.num}</span>
              <span className="text-xs uppercase tracking-widest" style={{ color: '#6B7280' }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Categories */}
        <div className="flex flex-col gap-8">
          {CATEGORIES.map(cat => (
            <div key={cat.title} className="rounded-xl p-8" style={{ background: '#111E35', border: '1px solid #1F3460' }}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: '#1B2E52' }}>
                  {cat.icon}
                </div>
                <h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>{cat.title}</h2>
                <span className="ml-auto text-xs font-bold px-3 py-1 rounded-full"
                  style={{ background: '#1B2E52', border: '1px solid #1F3460', color: '#C8960C', letterSpacing: '0.08em' }}>
                  {cat.count} workflows
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {cat.workflows.map(w => (
                  <div key={w.name} className="flex items-start gap-2.5 rounded-lg p-3.5"
                    style={{ background: '#0C1A2E', border: '1px solid #1F3460' }}>
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#C8960C' }} />
                    <div>
                      <p className="text-xs font-semibold mb-0.5" style={{ color: '#C8D8F0' }}>{w.name}</p>
                      <p className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>{w.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
