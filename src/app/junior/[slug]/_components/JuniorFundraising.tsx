'use client'

// Junior Football — Fundraising.
//
// Active campaigns + a per-team contribution split + a playbook of
// proven grassroots fundraisers. New-build, no sibling. Demo data is
// canned — Oakridge running a "new kit fund" campaign part-funded.

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

interface Campaign {
  id: string
  name: string
  blurb: string
  goal: number
  raised: number
  donors: number
  status: 'active' | 'paused' | 'complete'
  closes: string
}

const CAMPAIGNS: Campaign[] = [
  {
    id: 'kit-fund',
    name: 'New kit fund · 2026/27 season',
    blurb: 'Replacement home + away kits for all 9 age-band teams. Sized to U16. Sponsor name still up for grabs.',
    goal: 4800, raised: 2940, donors: 41,
    status: 'active', closes: 'Fri 25 Jul',
  },
  {
    id: 'goalposts',
    name: 'Replacement 9-a-side goalposts',
    blurb: 'Two sets of FA-spec 9v9 goalposts. Current frames are 8 years old, one is bowed beyond safe use.',
    goal: 1400, raised: 320, donors: 12,
    status: 'active', closes: 'Sat 30 Aug',
  },
  {
    id: 'tournament-pot',
    name: 'Summer tournament travel pot',
    blurb: 'Covers tournament entry fees for any squad that wants to enter but can\'t cover £35–£75 from subs.',
    goal: 600, raised: 600, donors: 28,
    status: 'complete', closes: 'Closed Sat 17 May',
  },
]

interface TeamContribution {
  team: string
  raised: number
  parents: number
}

const PER_TEAM: TeamContribution[] = [
  { team: 'U7 Cubs',     raised: 240, parents: 12 },
  { team: 'U8 Pumas',    raised: 280, parents: 14 },
  { team: 'U9 Tigers',   raised: 320, parents: 14 },
  { team: 'U10 Hawks',   raised: 360, parents: 13 },
  { team: 'U11 Lions',   raised: 480, parents: 12 },
  { team: 'U12 Wolves',  raised: 380, parents: 15 },
  { team: 'U13 Falcons', raised: 410, parents: 14 },
  { team: 'U14 Eagles',  raised: 290, parents: 13 },
  { team: 'U16 Saints',  raised: 180, parents: 16 },
]

interface PlaybookItem {
  name: string
  effort: 'low' | 'medium' | 'high'
  raise: string
  blurb: string
}

const PLAYBOOK: PlaybookItem[] = [
  { name: 'Five-a-side parents-vs-coaches', effort: 'low',    raise: '£200–£500',  blurb: 'Half-day at the club pitches. £5 entry per family + tuck shop. Most parents come anyway — turn the Saturday into the fundraiser.' },
  { name: 'Race night',                     effort: 'medium', raise: '£500–£2,000', blurb: 'Hire the local social club for the evening. Eight races on screen, parents bet £1 a horse. High-energy, family-friendly, the income compounds with a tuck shop.' },
  { name: 'Sponsored kick-a-thon',          effort: 'low',    raise: '£300–£1,500', blurb: 'Each player gets 30 minutes of shooting practice and sponsors per goal. Works best for the older age bands; ties into a normal training session.' },
  { name: 'Club lottery (50/50)',           effort: 'high',   raise: '£1,000–£5,000/yr', blurb: 'Monthly draw, parents subscribe £5/month, half the pot pays a winner, half stays with the club. Needs Treasurer + a small lottery licence.' },
  { name: 'Christmas hamper raffle',        effort: 'medium', raise: '£400–£1,200', blurb: 'Approach 8–10 local businesses for prizes. Tickets sell through the parents WhatsApp + Saturday matches. Draw at the December training session.' },
  { name: 'Quiz night',                     effort: 'medium', raise: '£300–£900',  blurb: 'Friday evening at a parent\'s pub or the local social club. £5 per head, teams of six. Raffle in the interval.' },
]

const EFFORT_TONE: Record<PlaybookItem['effort'], { label: string; tone: { bg: string; fg: string } }> = {
  low:    { label: 'Low effort',    tone: { bg: 'rgba(34,197,94,0.18)',  fg: T.good } },
  medium: { label: 'Medium effort', tone: { bg: 'rgba(245,158,11,0.18)', fg: T.warn } },
  high:   { label: 'Higher effort', tone: { bg: 'rgba(59,130,246,0.18)', fg: T.blue } },
}

interface Props {
  session: SportsDemoSession
  demoChild?: { name: string; ageBand: string; team: string }
}

export default function JuniorFundraising({ session }: Props) {
  const totalRaised = CAMPAIGNS.reduce((s, c) => s + c.raised, 0)
  const totalGoal = CAMPAIGNS.reduce((s, c) => s + c.goal, 0)
  const totalDonors = CAMPAIGNS.reduce((s, c) => s + c.donors, 0)
  const perTeamTotal = PER_TEAM.reduce((s, t) => s + t.raised, 0)

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
          Fundraising
        </p>
        <h2 className="text-lg font-bold" style={{ color: T.text }}>
          £{totalRaised.toLocaleString()} raised of £{totalGoal.toLocaleString()} · {totalDonors} donors · 3 campaigns
        </h2>
        <p className="text-sm mt-1 leading-relaxed" style={{ color: T.text2 }}>
          What&rsquo;s running, what each team has chipped in, and a playbook of
          fundraisers other junior clubs have made work. Signed in as{' '}
          <span style={{ color: T.text }}>{session.userName || session.role}</span>.
        </p>
      </div>

      <div className="space-y-3">
        {CAMPAIGNS.map(c => {
          const pct = c.goal === 0 ? 0 : Math.min(100, Math.round((c.raised / c.goal) * 100))
          const tone = c.status === 'complete' ? T.good : c.status === 'active' ? T.accent : T.warn
          return (
            <div key={c.id} className="rounded-xl p-4" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
              <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                <p className="text-sm font-bold" style={{ color: T.text }}>{c.name}</p>
                <span
                  className="text-[10px] px-2 py-0.5 rounded capitalize"
                  style={{
                    backgroundColor: c.status === 'complete' ? 'rgba(34,197,94,0.18)' : c.status === 'active' ? T.accentDim : 'rgba(245,158,11,0.18)',
                    color: tone,
                  }}
                >
                  {c.status}
                </span>
              </div>
              <p className="text-[11px] mb-3 leading-relaxed" style={{ color: T.text2 }}>{c.blurb}</p>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span style={{ color: T.text3 }}>£{c.raised.toLocaleString()} of £{c.goal.toLocaleString()}</span>
                <span style={{ color: T.good }}>{pct}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: T.borderSoft }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: T.good }} />
              </div>
              <p className="text-[10px] mt-2" style={{ color: T.text4 }}>
                {c.donors} donors · {c.closes}
              </p>
            </div>
          )
        })}
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
        <div className="px-4 py-3" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
          <p className="text-sm font-bold" style={{ color: T.text }}>Per-team contributions · £{perTeamTotal.toLocaleString()}</p>
          <p className="text-[10px] mt-0.5" style={{ color: T.text4 }}>Toward the kit fund campaign. Not a leaderboard — every contribution moves the dial.</p>
        </div>
        <ul>
          {PER_TEAM.map((t, i) => {
            const max = Math.max(...PER_TEAM.map(p => p.raised))
            const pct = max === 0 ? 0 : Math.round((t.raised / max) * 100)
            return (
              <li key={t.team} className="px-4 py-2.5" style={{ borderTop: i === 0 ? 'none' : `1px solid ${T.borderSoft}` }}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span style={{ color: T.text }}>{t.team}</span>
                  <span className="font-mono" style={{ color: T.text2 }}>£{t.raised} · {t.parents} families</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: T.borderSoft }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: T.accent }} />
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      <div>
        <p className="text-sm font-bold mb-3" style={{ color: T.text }}>Playbook · what works for grassroots clubs</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PLAYBOOK.map((p, i) => {
            const e = EFFORT_TONE[p.effort]
            return (
              <div key={i} className="rounded-lg p-3" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
                <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                  <p className="text-sm font-bold" style={{ color: T.text }}>{p.name}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: e.tone.bg, color: e.tone.fg }}>
                    {e.label}
                  </span>
                </div>
                <p className="text-[11px] font-mono mb-2" style={{ color: T.good }}>{p.raise}</p>
                <p className="text-[11px] leading-relaxed" style={{ color: T.text2 }}>{p.blurb}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
