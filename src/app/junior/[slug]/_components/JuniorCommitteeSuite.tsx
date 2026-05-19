'use client'

// Junior Football — Committee Suite.
//
// The grassroots analogue of the Women's Board Suite, rebuilt for a
// volunteer junior-club committee (chair, secretary, treasurer,
// welfare officer, fixtures secretary, et al.) — NOT a professional
// boardroom. The view a committee of parents would look at together
// at a monthly meeting: club-health summary, open committee actions,
// a light club-level finance overview, the committee/role map, and a
// safeguarding status line.
//
// Demo data is canned. No elite-club governance / FSR / compliance
// machinery — deliberately.

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

interface CommitteeMember {
  role: string
  name: string
  scope: string
}

const COMMITTEE: CommitteeMember[] = [
  { role: 'Chair',                  name: 'Pete Connolly',  scope: 'Overall club leadership, FA + County FA liaison, committee agenda.' },
  { role: 'Vice Chair',             name: 'Helena Mahan',   scope: 'Deputises for the Chair, leads sub-committees, parent-comms tone.' },
  { role: 'Secretary',              name: 'Saoirse Lynch',  scope: 'Minutes, AGM, constitution, GDPR + data, official correspondence.' },
  { role: 'Treasurer',              name: 'Jo Sefer',       scope: 'Bank, subs collection, payroll for any paid roles, year-end accounts.' },
  { role: 'Welfare Officer',        name: 'Jenna Holroyd',  scope: 'Safeguarding lead, DBS register, incident log, welfare reviews.' },
  { role: 'Fixtures Secretary',     name: 'Pete Connolly',  scope: 'League liaison, pitch bookings, referee confirmations. (Chair doubles.)' },
  { role: 'Volunteer Coordinator',  name: 'Kim Atherton',   scope: 'Recruits + onboards volunteers, manages the role rota.' },
  { role: 'Fundraising Lead',       name: null as unknown as string, scope: 'OPEN ROLE — currently shared across the committee. Active gap.' },
]

interface CommitteeAction {
  id: string
  date: string
  title: string
  detail: string
  owner: string
  status: 'open' | 'in_progress' | 'closed'
  dueBy: string
}

const ACTIONS: CommitteeAction[] = [
  { id: 'a-001', date: 'Mon 05 May', title: 'Replace bowed 9v9 goalpost',         detail: 'Kit fund campaign has £320 raised toward £1,400 goal; treasurer to circulate a draft order list with prices for committee approval.', owner: 'Jo Sefer',     status: 'in_progress', dueBy: 'Fri 30 May' },
  { id: 'a-002', date: 'Mon 05 May', title: 'Recruit a Fundraising Lead',          detail: 'Sub-committee currently absorbing the load. Vice-chair to draft a parent-WhatsApp ask and a 90-min-a-month role description.',                                owner: 'Helena Mahan', status: 'open',        dueBy: 'Mon 02 Jun' },
  { id: 'a-003', date: 'Mon 05 May', title: 'Renew County FA affiliation',          detail: 'Annual affiliation renewal window opens June. Secretary to gather DBS evidence pack + insurance docs ahead of the deadline.',                                    owner: 'Saoirse Lynch',status: 'open',        dueBy: 'Mon 30 Jun' },
  { id: 'a-004', date: 'Tue 06 May', title: 'AGM 2026 venue + date',                detail: 'Last year held at the social club function room. Need venue confirmed, agenda drafted, and parent-rep notice 28 days in advance.',                              owner: 'Pete Connolly',status: 'open',        dueBy: 'Mon 14 Jul' },
  { id: 'a-005', date: 'Mon 21 Apr', title: 'Refresh welfare incident log',         detail: 'Confirmed quarterly review pattern; welfare-officer drives, Chair countersigns. Closed for now — re-opens at the next quarterly cycle.',                         owner: 'Jenna Holroyd',status: 'closed',      dueBy: 'Mon 21 Apr' },
]

const STATUS_TONE: Record<CommitteeAction['status'], { label: string; bg: string; fg: string }> = {
  open:        { label: 'Open',        bg: 'rgba(245,158,11,0.18)', fg: T.warn },
  in_progress: { label: 'In progress', bg: 'rgba(59,130,246,0.18)', fg: T.blue },
  closed:      { label: 'Closed',      bg: 'rgba(34,197,94,0.18)',  fg: T.good },
}

interface FinanceLine {
  label: string
  category: 'income' | 'outgoing'
  amountThisQtr: number
  ytd: number
  note: string
}

const FINANCE: FinanceLine[] = [
  // Income.
  { label: 'Player subs',                category: 'income',  amountThisQtr: 5640, ytd: 17220, note: '128 players · £15/month · 92% collection rate this quarter.' },
  { label: 'Camps + tours income',       category: 'income',  amountThisQtr: 2070, ytd:  6390, note: 'Feb half-term + Cornwall tour bookings to date.' },
  { label: 'Fundraising (active)',       category: 'income',  amountThisQtr:  920, ytd:  3260, note: 'Kit fund + goalpost replacement + closed tournament travel pot.' },
  { label: 'Sponsorship',                category: 'income',  amountThisQtr:  500, ytd:  1500, note: 'Local hardware merchant — 3-year banner deal.' },
  // Outgoings.
  { label: 'Pitch hire',                 category: 'outgoing',amountThisQtr: 2840, ytd:  8460, note: 'Council pitches + 3G slot at Hartwell College.' },
  { label: 'Match-day fees',             category: 'outgoing',amountThisQtr:  680, ytd:  2120, note: 'Referee fees + league subs.' },
  { label: 'Kit + equipment',            category: 'outgoing',amountThisQtr:  920, ytd:  2880, note: 'Replacement socks, balls, training cones, first-aid restock.' },
  { label: 'Tournament + festival fees', category: 'outgoing',amountThisQtr:  410, ytd:  1240, note: 'Entry fees for U10/U11/U13/U14 over the year.' },
  { label: 'Insurance + affiliation',    category: 'outgoing',amountThisQtr:    0, ytd:   620, note: 'Annual County FA affiliation + public liability.' },
  { label: 'Coach courses + DBS',        category: 'outgoing',amountThisQtr:  140, ytd:   470, note: 'FA Level 1/2 part-funding + DBS renewals.' },
]

interface HealthLine {
  label: string
  value: string
  tone: 'good' | 'warn' | 'bad' | 'neutral'
  note: string
}

const HEALTH: HealthLine[] = [
  { label: 'Registered players',  value: '128', tone: 'good',    note: 'Up from 112 a year ago. U7 intake the strongest in three years.' },
  { label: 'Active teams',        value: '9',   tone: 'good',    note: 'U7 → U16. U16 at capacity 16/16 with a waitlist forming.' },
  { label: 'Volunteer gaps',      value: '8',   tone: 'warn',    note: '8 unfilled roles across 9 teams (Statisticians, Net team, Presentation, Fundraising Lead).' },
  { label: 'Charter Standard',    value: 'Achieved', tone: 'good', note: 'Re-accreditation evidence pack on track for the September window.' },
  { label: 'Cash reserve',        value: '£11,860', tone: 'good', note: 'Three months operating cover comfortably maintained — committee policy.' },
]

interface Props {
  session: SportsDemoSession
  demoChild?: { name: string; ageBand: string; team: string }
}

export default function JuniorCommitteeSuite({ session }: Props) {
  const incomeQtr   = FINANCE.filter(f => f.category === 'income').reduce((s, f) => s + f.amountThisQtr, 0)
  const outgoingQtr = FINANCE.filter(f => f.category === 'outgoing').reduce((s, f) => s + f.amountThisQtr, 0)
  const netQtr      = incomeQtr - outgoingQtr

  const openActions = ACTIONS.filter(a => a.status !== 'closed').length

  const filledRoles = COMMITTEE.filter(m => m.name).length
  const totalRoles  = COMMITTEE.length

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
          Committee Suite
        </p>
        <h2 className="text-lg font-bold" style={{ color: T.text }}>
          Oakridge Juniors FC · monthly committee view
        </h2>
        <p className="text-sm mt-1 leading-relaxed" style={{ color: T.text2 }}>
          The screen a parents&rsquo; committee actually reviews together: club
          health, open actions, the money in plain English, the role map, and
          safeguarding. Built for a volunteer committee, not a boardroom.
          Signed in as <span style={{ color: T.text }}>{session.userName || session.role}</span>.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {HEALTH.map(h => {
          const colorMap = { good: T.good, warn: T.warn, bad: T.bad, neutral: T.text }
          return (
            <div key={h.label} className="rounded-xl p-4" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
              <div className="text-xl font-bold" style={{ color: colorMap[h.tone] }}>{h.value}</div>
              <div className="text-xs mt-0.5" style={{ color: T.text3 }}>{h.label}</div>
              <div className="text-[10px] mt-1.5 leading-relaxed" style={{ color: T.text4 }}>{h.note}</div>
            </div>
          )
        })}
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
          <p className="text-sm font-bold" style={{ color: T.text }}>Committee actions · {openActions} open</p>
          <p className="text-[10px]" style={{ color: T.text4 }}>Reviewed monthly · last meeting Mon 05 May</p>
        </div>
        <ul>
          {ACTIONS.map((a, i) => {
            const s = STATUS_TONE[a.status]
            return (
              <li key={a.id} className="px-4 py-3" style={{ borderTop: i === 0 ? 'none' : `1px solid ${T.borderSoft}` }}>
                <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                  <p className="text-xs font-bold" style={{ color: T.text }}>{a.title}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: s.bg, color: s.fg }}>{s.label}</span>
                </div>
                <p className="text-[11px] leading-relaxed mb-1" style={{ color: T.text2 }}>{a.detail}</p>
                <p className="text-[10px]" style={{ color: T.text4 }}>
                  Owner: <span style={{ color: T.text2 }}>{a.owner}</span>
                  {' '}· Raised <span style={{ color: T.text2 }}>{a.date}</span>
                  {' '}· Due <span style={{ color: a.status === 'closed' ? T.good : T.warn }}>{a.dueBy}</span>
                </p>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
          <p className="text-sm font-bold" style={{ color: T.text }}>Money this quarter · in plain English</p>
          <p className="text-[10px] font-mono" style={{ color: netQtr >= 0 ? T.good : T.bad }}>
            Net £{netQtr.toLocaleString()} · YTD income £{FINANCE.filter(f => f.category === 'income').reduce((s, f) => s + f.ytd, 0).toLocaleString()}
          </p>
        </div>
        <table className="w-full text-xs">
          <thead style={{ backgroundColor: T.panelAlt, color: T.text3 }}>
            <tr className="text-left">
              <th className="px-3 py-2 font-semibold">Line</th>
              <th className="px-3 py-2 font-semibold text-right">This quarter</th>
              <th className="px-3 py-2 font-semibold text-right">YTD</th>
              <th className="px-3 py-2 font-semibold">Notes</th>
            </tr>
          </thead>
          <tbody>
            {FINANCE.map((f, i) => {
              const sign = f.category === 'income' ? '+' : '−'
              const color = f.category === 'income' ? T.good : T.text2
              return (
                <tr key={i} style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                  <td className="px-3 py-2" style={{ color: T.text }}>
                    {f.label}
                    <span className="ml-2 text-[10px] uppercase tracking-wider" style={{ color: T.text4 }}>{f.category}</span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono" style={{ color }}>{sign} £{f.amountThisQtr.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right font-mono" style={{ color: T.text3 }}>{sign} £{f.ytd.toLocaleString()}</td>
                  <td className="px-3 py-2 text-[11px]" style={{ color: T.text3 }}>{f.note}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: `2px solid ${T.borderSoft}`, backgroundColor: T.panelAlt }}>
              <td className="px-3 py-2 font-bold" style={{ color: T.text }}>Net this quarter</td>
              <td className="px-3 py-2 text-right font-mono font-bold" style={{ color: netQtr >= 0 ? T.good : T.bad }}>
                £{netQtr.toLocaleString()}
              </td>
              <td colSpan={2} className="px-3 py-2 text-[11px]" style={{ color: T.text4 }}>
                Income £{incomeQtr.toLocaleString()} · Outgoings £{outgoingQtr.toLocaleString()}. Light view — the Treasurer holds the full ledger.
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
          <p className="text-sm font-bold" style={{ color: T.text }}>Committee roles · {filledRoles}/{totalRoles} filled</p>
          <p className="text-[10px]" style={{ color: T.text4 }}>Per-team volunteer roles live in the Volunteer Roles module.</p>
        </div>
        <ul>
          {COMMITTEE.map((m, i) => (
            <li key={i} className="px-4 py-2.5" style={{ borderTop: i === 0 ? 'none' : `1px solid ${T.borderSoft}` }}>
              <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                <p className="text-xs font-bold" style={{ color: T.text }}>{m.role}</p>
                {m.name ? (
                  <span className="text-[11px]" style={{ color: T.text2 }}>{m.name}</span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded font-semibold" style={{ backgroundColor: 'rgba(239,68,68,0.18)', color: T.bad }}>Open</span>
                )}
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: T.text3 }}>{m.scope}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl p-4" style={{ backgroundColor: T.panel, border: `1px solid ${T.accent}55` }}>
        <p className="text-sm font-bold mb-2" style={{ color: T.text }}>Safeguarding status · committee line</p>
        <p className="text-[11px] leading-relaxed" style={{ color: T.text2 }}>
          Welfare Officer in post · DBS register 18/18 current · safeguarding training
          renewals on track · 1 restricted child on the register (handled per the imagery-
          exclusion protocol). No outstanding incidents at last quarterly review. Full
          detail in the Safeguarding module; this line is the committee&rsquo;s standing
          confirmation that the boundary is held.
        </p>
      </div>
    </div>
  )
}
