'use client'

// Junior Football — Insights (club-health overview, chairman-scoped).
//
// Simplified from the Women's Insights module. A volunteer chair wants a
// Saturday-morning quick-check, not a 10-tab analytics suite — KPI tiles,
// a short "watch this week" list, and a per-team health table.
//
// Demo data is canned.

import type { SportsDemoSession } from '@/components/sports-demo/SportsDemoGate'

const T = {
  panel:      '#0D1117',
  panelAlt:   '#111318',
  border:     '#1F2937',
  borderSoft: '#1A2030',
  text:       '#F9FAFB',
  text2:      '#D1D5DB',
  text3:      '#9CA3AF',
  text4:      '#6B7280',
  accent:     '#16A34A',
  accentDim:  'rgba(22,163,74,0.12)',
  good:       '#22C55E',
  warn:       '#F59E0B',
  bad:        '#EF4444',
  blue:       '#3B82F6',
} as const

interface TeamHealth {
  team: string
  ageBand: string
  squadSize: number
  capacity: number
  attendancePct: number
  consentPct: number
  registrationPct: number
  volunteerGaps: number
}

const TEAMS: TeamHealth[] = [
  { team: 'U7 Cubs',     ageBand: 'U7',  squadSize: 12, capacity: 12, attendancePct: 94, consentPct: 100, registrationPct: 100, volunteerGaps: 0 },
  { team: 'U8 Pumas',    ageBand: 'U8',  squadSize: 14, capacity: 14, attendancePct: 91, consentPct: 100, registrationPct: 100, volunteerGaps: 1 },
  { team: 'U9 Tigers',   ageBand: 'U9',  squadSize: 14, capacity: 14, attendancePct: 90, consentPct: 96,  registrationPct: 100, volunteerGaps: 0 },
  { team: 'U10 Hawks',   ageBand: 'U10', squadSize: 13, capacity: 14, attendancePct: 92, consentPct: 100, registrationPct: 100, volunteerGaps: 1 },
  { team: 'U11 Lions',   ageBand: 'U11', squadSize: 12, capacity: 14, attendancePct: 95, consentPct: 100, registrationPct: 92,  volunteerGaps: 0 },
  { team: 'U12 Wolves',  ageBand: 'U12', squadSize: 15, capacity: 16, attendancePct: 88, consentPct: 100, registrationPct: 100, volunteerGaps: 2 },
  { team: 'U13 Falcons', ageBand: 'U13', squadSize: 14, capacity: 16, attendancePct: 93, consentPct: 100, registrationPct: 100, volunteerGaps: 1 },
  { team: 'U14 Eagles',  ageBand: 'U14', squadSize: 13, capacity: 16, attendancePct: 87, consentPct: 92,  registrationPct: 100, volunteerGaps: 0 },
  { team: 'U16 Saints',  ageBand: 'U16', squadSize: 16, capacity: 16, attendancePct: 89, consentPct: 100, registrationPct: 100, volunteerGaps: 2 },
]

interface WatchItem { tone: 'good' | 'warn' | 'bad'; text: string }

const WATCH_THIS_WEEK: WatchItem[] = [
  { tone: 'warn', text: 'U14 Eagles consent coverage 92% — one filming consent expired (Amira). Chase due Tuesday.' },
  { tone: 'warn', text: 'U12 Wolves carrying 2 unfilled volunteer roles — Treasurer + Net team. Post on the parents WhatsApp before the weekend.' },
  { tone: 'good', text: 'New U7 Cubs intake holding 94% attendance — strongest foundation cohort we\'ve had.' },
  { tone: 'warn', text: 'U11 Lions FA registration at 92% — one new player (Joel Tate) paperwork still with County FA. Follow up Friday.' },
  { tone: 'good', text: 'U16 Saints squad now at capacity 16/16. Waiting list opens for September.' },
]

interface Props {
  session: SportsDemoSession
  demoChild?: { name: string; ageBand: string; team: string }
}

export default function JuniorInsights({ session }: Props) {
  const totals = TEAMS.reduce(
    (acc, t) => {
      acc.players += t.squadSize
      acc.capacity += t.capacity
      acc.gaps += t.volunteerGaps
      return acc
    },
    { players: 0, capacity: 0, gaps: 0 },
  )
  const avgAttendance = Math.round(TEAMS.reduce((s, t) => s + t.attendancePct, 0) / TEAMS.length)
  const avgConsent = Math.round(TEAMS.reduce((s, t) => s + t.consentPct, 0) / TEAMS.length)
  const avgRegistration = Math.round(TEAMS.reduce((s, t) => s + t.registrationPct, 0) / TEAMS.length)

  return (
    <div className="space-y-4">
      <div
        className="rounded-xl p-5"
        style={{
          background: `linear-gradient(135deg, ${T.accentDim} 0%, rgba(22,101,52,0.04) 60%, transparent 100%)`,
          border: `1px solid ${T.accent}55`,
        }}
      >
        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: T.accent }}>
          Insights · Chair&rsquo;s overview
        </p>
        <h2 className="text-lg font-bold" style={{ color: T.text }}>
          {TEAMS.length} teams · {totals.players} players · {totals.gaps} volunteer gaps
        </h2>
        <p className="text-sm mt-1 leading-relaxed" style={{ color: T.text2 }}>
          A 60-second weekend health-check. The numbers volunteers need before
          they walk onto the pitch — not a 10-tab analytics suite. Signed in
          as <span style={{ color: T.text }}>{session.userName || session.role}</span>.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi label="Registered players" value={totals.players} sub={`${totals.players}/${totals.capacity} of capacity`} tone="good" />
        <Kpi label="Attendance" value={`${avgAttendance}%`} sub="Across all teams · 4-week" tone={avgAttendance >= 90 ? 'good' : 'warn'} />
        <Kpi label="Consents current" value={`${avgConsent}%`} sub="Photo / filming / medical" tone={avgConsent >= 98 ? 'good' : 'warn'} />
        <Kpi label="FA registered" value={`${avgRegistration}%`} sub="Squad-wide" tone={avgRegistration >= 98 ? 'good' : 'warn'} />
        <Kpi label="Volunteer gaps" value={totals.gaps} sub={totals.gaps === 0 ? 'All roles covered' : 'Open roles across teams'} tone={totals.gaps === 0 ? 'good' : 'warn'} />
      </div>

      <div className="rounded-xl p-5" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
        <p className="text-sm font-bold mb-3" style={{ color: T.text }}>Watch this week</p>
        <ul className="space-y-2">
          {WATCH_THIS_WEEK.map((w, i) => {
            const c = w.tone === 'good' ? T.good : w.tone === 'warn' ? T.warn : T.bad
            return (
              <li key={i} className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: T.text2 }}>
                <span className="mt-0.5" style={{ color: c }}>•</span>
                <span>{w.text}</span>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
        <div className="px-4 py-3" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
          <p className="text-sm font-bold" style={{ color: T.text }}>Per-team health</p>
        </div>
        <table className="w-full text-xs">
          <thead style={{ backgroundColor: T.panelAlt, color: T.text3 }}>
            <tr className="text-left">
              <th className="px-3 py-2 font-semibold">Team</th>
              <th className="px-3 py-2 font-semibold">Squad</th>
              <th className="px-3 py-2 font-semibold">Attend.</th>
              <th className="px-3 py-2 font-semibold">Consents</th>
              <th className="px-3 py-2 font-semibold">FA reg.</th>
              <th className="px-3 py-2 font-semibold">Vol. gaps</th>
            </tr>
          </thead>
          <tbody>
            {TEAMS.map(t => (
              <tr key={t.team} style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                <td className="px-3 py-2" style={{ color: T.text }}>{t.team}</td>
                <td className="px-3 py-2 font-mono" style={{ color: T.text2 }}>{t.squadSize}/{t.capacity}</td>
                <td className="px-3 py-2 font-mono" style={{ color: t.attendancePct >= 90 ? T.good : t.attendancePct >= 85 ? T.warn : T.bad }}>{t.attendancePct}%</td>
                <td className="px-3 py-2 font-mono" style={{ color: t.consentPct >= 98 ? T.good : t.consentPct >= 90 ? T.warn : T.bad }}>{t.consentPct}%</td>
                <td className="px-3 py-2 font-mono" style={{ color: t.registrationPct >= 98 ? T.good : t.registrationPct >= 90 ? T.warn : T.bad }}>{t.registrationPct}%</td>
                <td className="px-3 py-2 font-mono" style={{ color: t.volunteerGaps === 0 ? T.good : t.volunteerGaps <= 1 ? T.warn : T.bad }}>{t.volunteerGaps}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Kpi({ label, value, sub, tone }: { label: string; value: string | number; sub: string; tone: 'good' | 'warn' | 'bad' | 'neutral' }) {
  const colorMap: Record<typeof tone, string> = { good: T.good, warn: T.warn, bad: T.bad, neutral: T.text }
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
      <div className="text-2xl font-bold" style={{ color: colorMap[tone] }}>{value}</div>
      <div className="text-xs mt-0.5" style={{ color: T.text3 }}>{label}</div>
      <div className="text-[10px] mt-1" style={{ color: T.text4 }}>{sub}</div>
    </div>
  )
}
