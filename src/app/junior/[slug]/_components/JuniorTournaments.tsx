'use client'

// Junior Football — Tournaments.
//
// Two halves: FIND & ENTER (upcoming regional youth tournaments) and
// RUN YOUR OWN (light setup view for a club hosting). New-build, no
// sibling. Demo data is canned.

import { useState } from 'react'
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

interface Tournament {
  id: string
  name: string
  host: string
  date: string
  format: '5-a-side' | '7-a-side' | '9-a-side' | '11-a-side'
  ageGroups: string
  entryFee: number
  distanceMiles: number
  faAffiliated: boolean
  spots: 'open' | 'filling' | 'waitlist' | 'closed'
  blurb: string
}

const TOURNAMENTS: Tournament[] = [
  {
    id: 't-001',
    name: 'Surrey Summer Sixes',
    host: 'Kingsmere City Juniors',
    date: 'Sat 14 Jun · 09:00–17:00',
    format: '5-a-side', ageGroups: 'U7 · U8 · U9 · U10',
    entryFee: 35, distanceMiles: 8,
    faAffiliated: true, spots: 'open',
    blurb: 'Long-running June fixture. 6 teams per age group, mini-pitches on a 3G complex. Refs provided. Medals for every player.',
  },
  {
    id: 't-002',
    name: 'Hartwell Junior Festival',
    host: 'Hartwell Athletic',
    date: 'Sun 22 Jun · 10:00–16:00',
    format: '7-a-side', ageGroups: 'U9 · U10 · U11',
    entryFee: 45, distanceMiles: 14,
    faAffiliated: true, spots: 'filling',
    blurb: 'FA-affiliated festival — group stage then knockout. 8 teams per age group. Hot food + tuck shop on site.',
  },
  {
    id: 't-003',
    name: 'Thornvale Girls Football Week',
    host: 'Thornvale FC',
    date: 'Sat 28 Jun · 10:00–15:00',
    format: '7-a-side', ageGroups: 'U10 · U12 girls only',
    entryFee: 25, distanceMiles: 11,
    faAffiliated: true, spots: 'open',
    blurb: 'Part of County FA Girls Football Week. No knockouts — every team plays five games. Ideal for newer squads.',
  },
  {
    id: 't-004',
    name: 'Glenmoor Mid-Season Cup',
    host: 'Glenmoor Wanderers',
    date: 'Sat 05 Jul · 09:00–18:00',
    format: '9-a-side', ageGroups: 'U11 · U12',
    entryFee: 55, distanceMiles: 22,
    faAffiliated: true, spots: 'filling',
    blurb: 'Full-day knockout. Two pitches running in parallel. Last year\'s U12 cup retained by Oakridge — defending champions.',
  },
  {
    id: 't-005',
    name: 'Ridgefield Charter Festival',
    host: 'Ridgefield Athletic',
    date: 'Sun 06 Jul · 10:00–16:00',
    format: '7-a-side', ageGroups: 'U7 · U8 · U9 · U10 · U11',
    entryFee: 40, distanceMiles: 9,
    faAffiliated: true, spots: 'waitlist',
    blurb: 'Charter Standard showcase. Skills competitions between games. Waitlist only at this stage — early-bird entries closed Apr.',
  },
  {
    id: 't-006',
    name: 'Northbridge Summer Slam',
    host: 'Northbridge Youth FC',
    date: 'Sat 12 Jul · 09:30–17:30',
    format: '11-a-side', ageGroups: 'U13 · U14 · U15 · U16',
    entryFee: 75, distanceMiles: 28,
    faAffiliated: true, spots: 'open',
    blurb: '11-a-side for the older age groups. Larger entry fee but trophies, professional refereeing, sponsor stalls. Worth the trip.',
  },
]

const SPOT_LABEL: Record<Tournament['spots'], { label: string; tone: { bg: string; fg: string } }> = {
  open:     { label: 'Open',     tone: { bg: 'rgba(34,197,94,0.18)',  fg: T.good } },
  filling:  { label: 'Filling',  tone: { bg: 'rgba(245,158,11,0.18)', fg: T.warn } },
  waitlist: { label: 'Waitlist', tone: { bg: 'rgba(59,130,246,0.18)', fg: T.blue } },
  closed:   { label: 'Closed',   tone: { bg: 'rgba(107,114,128,0.18)',fg: T.text4 } },
}

interface Props {
  session: SportsDemoSession
  demoChild?: { name: string; ageBand: string; team: string }
}

export default function JuniorTournaments({ session }: Props) {
  const [tab, setTab] = useState<'find' | 'host'>('find')
  const [formatFilter, setFormatFilter] = useState<'all' | Tournament['format']>('all')

  const filtered = formatFilter === 'all'
    ? TOURNAMENTS
    : TOURNAMENTS.filter(t => t.format === formatFilter)

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
          Tournaments
        </p>
        <h2 className="text-lg font-bold" style={{ color: T.text }}>
          Find one to enter · or run your own
        </h2>
        <p className="text-sm mt-1 leading-relaxed" style={{ color: T.text2 }}>
          Regional youth tournaments your teams can enter for a summer-day
          out, plus a simple host-your-own setup if you&rsquo;re running one.
          Signed in as{' '}
          <span style={{ color: T.text }}>{session.userName || session.role}</span>.
        </p>
      </div>

      <div className="flex gap-1 border-b" style={{ borderColor: T.border }}>
        {([
          { id: 'find' as const, label: 'Find & enter',  icon: '🔍', sub: `${TOURNAMENTS.length} listed` },
          { id: 'host' as const, label: 'Run your own', icon: '🏆', sub: 'Setup wizard' },
        ]).map(t => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="px-4 py-2.5 text-xs font-semibold"
              style={{
                color: active ? T.good : T.text4,
                borderBottom: active ? `2px solid ${T.good}` : '2px solid transparent',
              }}
            >
              <span className="mr-1.5">{t.icon}</span>{t.label}
              <span className="ml-2 text-[10px]" style={{ color: T.text4 }}>· {t.sub}</span>
            </button>
          )
        })}
      </div>

      {tab === 'find' && (
        <>
          <div className="flex flex-wrap gap-2">
            {(['all', '5-a-side', '7-a-side', '9-a-side', '11-a-side'] as const).map(f => {
              const active = formatFilter === f
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormatFilter(f)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                  style={{
                    backgroundColor: active ? T.accentDim : 'transparent',
                    border: `1px solid ${active ? T.accent : T.border}`,
                    color: active ? T.good : T.text3,
                  }}
                >
                  {f === 'all' ? 'All formats' : f}
                </button>
              )
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map(t => {
              const s = SPOT_LABEL[t.spots]
              return (
                <div key={t.id} className="rounded-lg p-4" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
                  <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                    <p className="text-sm font-bold" style={{ color: T.text }}>{t.name}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: s.tone.bg, color: s.tone.fg }}>
                      {s.label}
                    </span>
                  </div>
                  <p className="text-[11px] mb-2" style={{ color: T.text4 }}>Hosted by {t.host} · {t.distanceMiles} miles</p>
                  <div className="grid grid-cols-2 gap-2 mb-2 text-[11px]">
                    <div><span style={{ color: T.text4 }}>Date:</span> <span style={{ color: T.text2 }}>{t.date}</span></div>
                    <div><span style={{ color: T.text4 }}>Format:</span> <span style={{ color: T.text2 }}>{t.format}</span></div>
                    <div><span style={{ color: T.text4 }}>Age groups:</span> <span style={{ color: T.text2 }}>{t.ageGroups}</span></div>
                    <div><span style={{ color: T.text4 }}>Entry fee:</span> <span style={{ color: T.text2 }}>£{t.entryFee} per team</span></div>
                  </div>
                  <p className="text-[11px] leading-relaxed mb-2" style={{ color: T.text2 }}>{t.blurb}</p>
                  <div className="flex items-center justify-between gap-2">
                    {t.faAffiliated && (
                      <span className="text-[10px]" style={{ color: T.good }}>✓ FA-affiliated event</span>
                    )}
                    <button
                      type="button"
                      disabled={t.spots === 'closed'}
                      className="text-[10px] font-semibold px-2.5 py-1 rounded transition-colors disabled:opacity-40"
                      style={{
                        backgroundColor: T.accentDim,
                        color: T.good,
                        border: `1px solid ${T.accent}55`,
                      }}
                    >
                      {t.spots === 'waitlist' ? 'Join waitlist' : 'Enter a team'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {tab === 'host' && (
        <div className="rounded-xl p-5" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
          <p className="text-sm font-bold mb-1" style={{ color: T.text }}>Run your own tournament</p>
          <p className="text-xs mb-4 leading-relaxed" style={{ color: T.text2 }}>
            Hosting a summer festival is a great fundraiser and reputation-builder.
            Use this setup to get the basics in place; the full ops checklist
            slots into Matchday Ops on the day.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <SetupRow label="Tournament name"            placeholder="e.g. Oakridge Summer Festival" />
            <SetupRow label="Date"                       placeholder="Sat 19 Jul · 09:30–17:00" />
            <SetupRow label="Format"                     placeholder="7-a-side" />
            <SetupRow label="Age groups"                 placeholder="U9 · U10 · U11" />
            <SetupRow label="Teams per age group"        placeholder="6" />
            <SetupRow label="Entry fee per team"         placeholder="£45" />
            <SetupRow label="Pitches"                    placeholder="3 (mini-pitch on Pitch 2)" />
            <SetupRow label="Referees needed"            placeholder="6 qualified + 3 standby" />
            <SetupRow label="Catering / tuck shop lead"  placeholder="Lou Carter" />
            <SetupRow label="First-aid cover"            placeholder="2 first-aiders + St John on call" />
          </div>
          <p className="text-[11px] mt-4 leading-relaxed" style={{ color: T.text3 }}>
            Once the basics are saved here, the Matchday Operations module
            picks up kit, equipment and pitch checklists for the day itself.
          </p>
        </div>
      )}
    </div>
  )
}

function SetupRow({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: T.text4 }}>{label}</p>
      <input
        type="text"
        readOnly
        defaultValue={placeholder}
        className="w-full text-xs px-3 py-2 rounded"
        style={{ backgroundColor: T.panelAlt, color: T.text2, border: `1px solid ${T.borderSoft}` }}
      />
    </div>
  )
}
