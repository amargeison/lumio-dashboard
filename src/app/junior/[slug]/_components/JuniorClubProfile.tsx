'use client'

// Junior Football — Club Profile.
//
// Tabbed club-identity page. Ported from the Grassroots portal
// (src/app/grassroots/[slug]/page.tsx ClubProfileView, tabs ~line 2025+)
// — same tab structure (Info / History / Ground / Honours / Committee /
// Kit / Sponsors), re-themed Junior green, re-content'd for a junior
// football club. Committee names are kept consistent with the
// Committee Suite module so the two views agree.
//
// Demo data is canned.

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
  accentDeep: '#166534',
  accentLight:'#22C55E',
  accentDim:  'rgba(22,163,74,0.12)',
  good:       '#22C55E',
  warn:       '#F59E0B',
  bad:        '#EF4444',
  gold:       '#F1C40F',
  goldText:   '#FDE68A',
} as const

type Tab = 'info' | 'history' | 'ground' | 'honours' | 'committee' | 'kit' | 'sponsors'

interface Props {
  session: SportsDemoSession
  demoChild?: { name: string; ageBand: string; team: string }
}

export default function JuniorClubProfile({ session }: Props) {
  const [tab, setTab] = useState<Tab>('info')
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'info',      label: 'Club Info',  icon: 'ℹ️' },
    { id: 'history',   label: 'History',    icon: '📖' },
    { id: 'ground',    label: 'Ground',     icon: '🌱' },
    { id: 'honours',   label: 'Honours',    icon: '🏆' },
    { id: 'committee', label: 'Committee',  icon: '👥' },
    { id: 'kit',       label: 'Kit',        icon: '👕' },
    { id: 'sponsors',  label: 'Sponsors',   icon: '🤝' },
  ]

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
          Club Profile
        </p>
        <h2 className="text-lg font-bold" style={{ color: T.text }}>
          Oakridge Juniors FC · who we are
        </h2>
        <p className="text-sm mt-1 leading-relaxed" style={{ color: T.text2 }}>
          The club&rsquo;s identity in one place — for new parents, prospective
          coaches, opposition managers and the County FA. Signed in as{' '}
          <span style={{ color: T.text }}>{session.userName || session.role}</span>.
        </p>
      </div>

      <div className="flex gap-1 border-b overflow-x-auto" style={{ borderColor: T.border }}>
        {tabs.map(t => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-all"
              style={{
                color: active ? T.good : T.text4,
                borderBottom: active ? `2px solid ${T.good}` : '2px solid transparent',
              }}
            >
              <span className="mr-1.5">{t.icon}</span>{t.label}
            </button>
          )
        })}
      </div>

      {tab === 'info' && <InfoTab />}
      {tab === 'history' && <HistoryTab />}
      {tab === 'ground' && <GroundTab />}
      {tab === 'honours' && <HonoursTab />}
      {tab === 'committee' && <CommitteeTab />}
      {tab === 'kit' && <KitTab />}
      {tab === 'sponsors' && <SponsorsTab />}
    </div>
  )
}

// ─── Tab 1: Info ────────────────────────────────────────────────────────────

function InfoTab() {
  const details: { label: string; value: string }[] = [
    { label: 'Full Name',              value: 'Oakridge Juniors FC' },
    { label: 'Nickname',               value: 'The Cubs (U7s) / The Juniors (everyone else)' },
    { label: 'Founded',                value: '1997 — split off the men’s club to focus on the youth pathway' },
    { label: 'Home Ground',            value: 'Oakridge Community Pitches, Surrey' },
    { label: 'Training (mid-week)',    value: 'Hartwell College 3G (older age bands) + Oakridge Pitches' },
    { label: 'League',                 value: 'Surrey Youth League · multiple age-band divisions' },
    { label: 'County FA',              value: 'Surrey FA' },
    { label: 'FA Charter Standard',    value: 'Achieved · re-accreditation due Sep' },
    { label: 'WGS Club ID',            value: 'WGS-OJC-901 (demo)' },
    { label: 'FA Affiliation ID',      value: 'FA-OJC-2025 (demo)' },
    { label: 'Teams',                  value: '9 age-band teams · U7 → U16' },
    { label: 'Coaching model',         value: 'Paid head coach + volunteer assistants' },
    { label: 'Club Colours',           value: 'Green and black' },
    { label: 'Parent WhatsApp',        value: 'Per age-band group · admin Greta Yardley' },
    { label: 'Primary contact',        value: 'Pete Connolly (Chair) · 07712 884 901' },
  ]
  return (
    <div className="space-y-4">
      <SectionCard title="Club badge & identity">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
            <circle cx="60" cy="60" r="56" fill={T.accentDeep} stroke={T.accentLight} strokeWidth="3" />
            <circle cx="60" cy="60" r="46" fill="none" stroke={T.accentLight} strokeWidth="1.5" />
            <text x="60" y="52" textAnchor="middle" fill="#fff" fontWeight="700" fontSize="14" fontFamily="sans-serif">OAKRIDGE</text>
            <text x="60" y="68" textAnchor="middle" fill="#fff" fontWeight="700" fontSize="12" fontFamily="sans-serif">JUNIORS</text>
            <text x="60" y="84" textAnchor="middle" fill={T.accentLight} fontWeight="500" fontSize="10" fontFamily="sans-serif">Est. 1997</text>
          </svg>
          <div>
            <p className="text-lg font-bold" style={{ color: T.text }}>Oakridge Juniors FC</p>
            <p className="text-xs mt-1" style={{ color: T.text3 }}>Surrey Youth League · FA Charter Standard</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <Badge>FA Charter</Badge>
              <Badge>Est. 1997</Badge>
              <Badge>9 teams</Badge>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Club details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {details.map(d => (
            <DetailTile key={d.label} label={d.label} value={d.value} />
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

// ─── Tab 2: History ─────────────────────────────────────────────────────────

function HistoryTab() {
  const timeline = [
    { year: '1997', text: 'Split off the men’s club to focus on youth football. U10 and U12 teams the first to register.' },
    { year: '2001', text: 'First U16 team graduated — three players went on to senior football locally.' },
    { year: '2008', text: 'FA Charter Standard achieved for the first time.' },
    { year: '2014', text: 'Girls’ section launched — initial U10 and U12 teams.' },
    { year: '2018', text: 'Charter Standard renewed; welfare officer post made permanent committee role.' },
    { year: '2021', text: 'COVID return-to-play handled cleanly; no committee resignations across the period.' },
    { year: '2024', text: 'Surrey Youth League U11 finalists (Cubs lost the final 2-1 to Kingsmere).' },
    { year: '2025', text: 'Junior membership at all-time high — waitlists open in three age bands.' },
    { year: '2026', text: 'Current season — re-accreditation cycle, kit fund running.' },
  ]
  return (
    <SectionCard title="Club timeline">
      <div className="relative pl-6">
        <div className="absolute left-[7px] top-2 bottom-2 w-0.5" style={{ backgroundColor: T.borderSoft }} />
        <div className="space-y-5">
          {timeline.map((e, i) => (
            <div key={i} className="relative">
              <div
                className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2"
                style={{ backgroundColor: i === timeline.length - 1 ? T.accent : T.panel, borderColor: T.accent }}
              />
              <p className="text-xs font-bold" style={{ color: T.accent }}>{e.year}</p>
              <p className="text-sm mt-0.5 leading-relaxed" style={{ color: T.text2 }}>{e.text}</p>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  )
}

// ─── Tab 3: Ground ──────────────────────────────────────────────────────────

function GroundTab() {
  const facilities: { name: string; available: boolean; note: string }[] = [
    { name: 'Grass pitches',         available: true,  note: 'Three pitches on site — 5v5, 7v7, 9v9/11v11. Council maintained.' },
    { name: '3G access (mid-week)',  available: true,  note: 'Hartwell College — quarter-pitch slots for U11+ training.' },
    { name: 'Changing rooms',         available: true,  note: 'Two team rooms + officials room in the pavilion.' },
    { name: 'Car park',               available: true,  note: '~40 spaces · please don’t block the gate.' },
    { name: 'Floodlights',            available: false, note: 'Not on site — all matchday before dark; mid-week training uses Hartwell’s 3G floodlights.' },
    { name: 'Spectator rail',         available: true,  note: 'FA Respect rope around Pitch 1 + Pitch 2 — installed Jan 2025.' },
    { name: 'Toilets',                available: true,  note: 'Pavilion · accessible cubicle on the home side.' },
    { name: 'First-aid room',         available: true,  note: 'Equipped + signed-off · welfare officer holds the key.' },
    { name: 'Tuck shop / hot drinks', available: true,  note: 'Pavilion · run by the parents rota — proceeds to club fundraising.' },
  ]
  return (
    <div className="space-y-4">
      <SectionCard title="Oakridge Community Pitches">
        <div className="space-y-3">
          <DetailTile label="Address" value="Oakridge Community Pitches, Foxhill Lane, Oakridge, Surrey GU8 4PT (demo)" />
          <div className="space-y-2">
            {facilities.map(f => (
              <div key={f.name} className="flex items-start gap-2.5 p-2.5 rounded-lg" style={{ backgroundColor: T.panelAlt }}>
                <span className="mt-0.5 text-sm">{f.available ? '✅' : '❌'}</span>
                <div>
                  <p className="text-sm font-medium" style={{ color: T.text }}>{f.name}</p>
                  {f.note && <p className="text-xs mt-0.5" style={{ color: T.text3 }}>{f.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Pitch hire &amp; booking">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <DetailTile label="Council pitch hire"     value="£18 (5v5) → £45 (11v11) per match" />
          <DetailTile label="Booking"                 value="Surrey Borough Council — 01483 ••• 522" />
          <DetailTile label="Hartwell 3G (training)"  value="£65 quarter-pitch / £110 half · Hartwell College" />
        </div>
      </SectionCard>

      <div className="flex items-start gap-3 p-4 rounded-xl" style={{ backgroundColor: 'rgba(245,158,11,0.10)', border: `1px solid ${T.warn}44` }}>
        <span className="text-sm" style={{ color: T.warn }}>⚠️</span>
        <div>
          <p className="text-sm font-semibold" style={{ color: T.warn }}>Weather note</p>
          <p className="text-xs mt-1" style={{ color: T.text2 }}>
            Pitch 2 gets waterlogged after Friday rain — Saturday inspections via the FA PitchPower
            app. Council confirms playability by 08:00 on matchdays.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Tab 4: Honours ─────────────────────────────────────────────────────────

function HonoursTab() {
  const honours: { category: string; items: string[] }[] = [
    {
      category: 'Age-group league',
      items: [
        'Surrey Youth League U11 — Finalists 2024',
        'Surrey Youth League U13 — Division Winners 2022',
        'Surrey Youth League U10 — Division Winners 2019',
      ],
    },
    {
      category: 'Age-group cups',
      items: [
        'Surrey Cup U14 — Semi-final 2023',
        'County Charter Cup U12 — Runners-up 2020',
      ],
    },
    {
      category: 'Awards',
      items: [
        'FA Charter Standard — first achieved 2008, renewed continuously',
        'County FA Respect Award — Oakridge Juniors 2022',
        'Volunteer of the Year (County FA) — Jenna Holroyd 2024',
      ],
    },
    {
      category: 'Festivals + tournaments',
      items: [
        'Cornwall Coast Festival U13 — Tour winners 2024',
        'Hartwell Junior Festival U10 — Plate winners 2023',
        'Thornvale Girls Football Week — Most Improved Team 2025',
      ],
    },
  ]
  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#1A1208', border: '1px solid #5C3A1E' }}>
      <div className="px-4 py-3" style={{ borderBottom: '1px solid #5C3A1E' }}>
        <p className="text-sm font-bold tracking-wide" style={{ color: T.gold }}>
          🏆 Honours Board
        </p>
      </div>
      <div className="p-4 space-y-5">
        {honours.map(h => (
          <div key={h.category}>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: T.gold }}>{h.category}</p>
            <div className="space-y-1.5">
              {h.items.map((item, i) => (
                <div key={i} className="flex items-center gap-2 pl-2">
                  <span style={{ color: T.gold }}>★</span>
                  <p className="text-sm" style={{ color: T.goldText }}>{item}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Tab 5: Committee ───────────────────────────────────────────────────────

function CommitteeTab() {
  // Committee names align with JuniorCommitteeSuite.tsx so both views agree.
  const committee: { name: string; role: string; desc: string; phone: string }[] = [
    { name: 'Pete Connolly',  role: 'Chair',                desc: 'Overall club leadership · County FA liaison · committee agenda.',          phone: '07712 884 901' },
    { name: 'Helena Mahan',   role: 'Vice Chair',           desc: 'Deputises for Chair · sub-committee leads · parent-comms tone.',           phone: '07849 221 057' },
    { name: 'Saoirse Lynch',  role: 'Secretary',            desc: 'Minutes · AGM · constitution · GDPR + data · correspondence.',             phone: '07795 410 663' },
    { name: 'Jo Sefer',       role: 'Treasurer',            desc: 'Bank · subs collection · year-end accounts · grant applications.',         phone: '' },
    { name: 'Jenna Holroyd',  role: 'Welfare Officer',      desc: 'Safeguarding lead · DBS register · incident log · welfare reviews.',       phone: '07803 552 188' },
    { name: 'Pete Connolly',  role: 'Fixtures Secretary',   desc: 'League liaison · pitch bookings · referee confirmations. (Chair doubles.)', phone: '' },
    { name: 'Kim Atherton',   role: 'Volunteer Coordinator',desc: 'Recruits + onboards volunteers · per-team role rota.',                     phone: '' },
  ]
  const openRoles: { role: string; note: string; urgent: boolean }[] = [
    { role: 'Fundraising Lead', note: 'Currently shared across the committee. Looking for one volunteer · ~90 min/month commitment.', urgent: false },
  ]
  return (
    <div className="space-y-4">
      <SectionCard title="Who runs the club">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ color: T.text }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                <th className="text-left py-2 px-2 text-[10px] uppercase tracking-wider font-semibold" style={{ color: T.text3 }}>Name</th>
                <th className="text-left py-2 px-2 text-[10px] uppercase tracking-wider font-semibold" style={{ color: T.text3 }}>Role</th>
                <th className="text-left py-2 px-2 text-[10px] uppercase tracking-wider font-semibold hidden sm:table-cell" style={{ color: T.text3 }}>Scope</th>
                <th className="text-left py-2 px-2 text-[10px] uppercase tracking-wider font-semibold" style={{ color: T.text3 }}>Phone</th>
              </tr>
            </thead>
            <tbody>
              {committee.map((c, i) => (
                <tr key={`${c.name}-${c.role}-${i}`} style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                  <td className="py-2.5 px-2 font-medium">{c.name}</td>
                  <td className="py-2.5 px-2"><Badge>{c.role}</Badge></td>
                  <td className="py-2.5 px-2 hidden sm:table-cell text-[12px]" style={{ color: T.text3 }}>{c.desc}</td>
                  <td className="py-2.5 px-2 font-mono" style={{ color: T.text3 }}>{c.phone || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Open roles">
        <div className="space-y-2">
          {openRoles.map(r => (
            <div
              key={r.role}
              className="flex items-start gap-2.5 p-3 rounded-lg"
              style={{
                backgroundColor: r.urgent ? 'rgba(239,68,68,0.10)' : T.panelAlt,
                border: r.urgent ? `1px solid ${T.bad}44` : `1px solid ${T.borderSoft}`,
              }}
            >
              {r.urgent && <span className="mt-0.5 text-sm" style={{ color: T.bad }}>⚠️</span>}
              <div>
                <p className="text-sm font-medium" style={{ color: T.text }}>{r.role}</p>
                <p className="text-xs mt-0.5" style={{ color: T.text3 }}>{r.note}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="p-3 rounded-lg" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
        <p className="text-xs" style={{ color: T.text3 }}>
          🗓️ Next committee meeting: <span style={{ color: T.text, fontWeight: 600 }}>First Monday of the month, 19:30 at the pavilion</span>
        </p>
      </div>
    </div>
  )
}

// ─── Tab 6: Kit ─────────────────────────────────────────────────────────────

function KitTab() {
  const kitInfo = [
    { label: 'Kit supplier',  value: 'County FA approved supplier · bulk order across age bands' },
    { label: 'Shirt sponsor', value: 'Foxhill Hardware — local merchant, 3-year banner deal' },
    { label: 'Last order',    value: 'Aug 2025 · part-funded by the kit fund campaign' },
    { label: 'Condition',     value: 'Mostly fine. 9v9 keeper shirt + a couple of socks sets due for replacement.' },
    { label: 'Sizes stocked', value: 'YS / YM / YL / YXL — held by Lou Carter (kit organiser)' },
    { label: 'Spare kit',     value: 'Two full sets in the container at Pitch 3' },
  ]
  return (
    <div className="space-y-4">
      <SectionCard title="Kit design">
        <div className="flex flex-wrap gap-8 justify-center py-2">
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs font-semibold" style={{ color: T.text }}>Home</p>
            <svg width="120" height="140" viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg">
              <path d="M30 30 L10 50 L10 60 L25 55 L25 130 L95 130 L95 55 L110 60 L110 50 L90 30 L75 25 L60 32 L45 25 Z" fill={T.accent} stroke={T.accentLight} strokeWidth="1.5" />
              <path d="M45 25 L60 32 L75 25" fill="none" stroke="#fff" strokeWidth="2.5" />
              <text x="60" y="72" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="600" fontFamily="sans-serif">Foxhill</text>
              <text x="60" y="82" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="600" fontFamily="sans-serif">Hardware</text>
              <text x="60" y="110" textAnchor="middle" fill={T.accentLight} fontSize="22" fontWeight="700" fontFamily="sans-serif" opacity="0.45">10</text>
            </svg>
            <p className="text-[10px]" style={{ color: T.text3 }}>Green body · black shorts · green socks</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs font-semibold" style={{ color: T.text }}>Away</p>
            <svg width="120" height="140" viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg">
              <path d="M30 30 L10 50 L10 60 L25 55 L25 130 L95 130 L95 55 L110 60 L110 50 L90 30 L75 25 L60 32 L45 25 Z" fill="#fff" stroke={T.accent} strokeWidth="1.5" />
              <path d="M45 25 L60 32 L75 25" fill="none" stroke={T.accent} strokeWidth="2.5" />
              <line x1="25" y1="55" x2="25" y2="130" stroke={T.accent} strokeWidth="1" opacity="0.5" />
              <line x1="95" y1="55" x2="95" y2="130" stroke={T.accent} strokeWidth="1" opacity="0.5" />
              <text x="60" y="72" textAnchor="middle" fill="#000" fontSize="7" fontWeight="600" fontFamily="sans-serif">Foxhill</text>
              <text x="60" y="82" textAnchor="middle" fill="#000" fontSize="7" fontWeight="600" fontFamily="sans-serif">Hardware</text>
              <text x="60" y="110" textAnchor="middle" fill={T.accent} fontSize="22" fontWeight="700" fontFamily="sans-serif" opacity="0.55">10</text>
            </svg>
            <p className="text-[10px]" style={{ color: T.text3 }}>White body · white shorts · white socks</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs font-semibold" style={{ color: T.text }}>Goalkeeper</p>
            <svg width="120" height="140" viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg">
              <path d="M30 30 L10 50 L10 60 L25 55 L25 130 L95 130 L95 55 L110 60 L110 50 L90 30 L75 25 L60 32 L45 25 Z" fill={T.warn} stroke="#fff" strokeWidth="1.5" />
              <path d="M45 25 L60 32 L75 25" fill="none" stroke="#fff" strokeWidth="2.5" />
              <text x="60" y="72" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="600" fontFamily="sans-serif">Foxhill</text>
              <text x="60" y="82" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="600" fontFamily="sans-serif">Hardware</text>
              <text x="60" y="110" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="700" fontFamily="sans-serif" opacity="0.55">1</text>
            </svg>
            <p className="text-[10px]" style={{ color: T.text3 }}>Amber body + alternative for clashes</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Kit information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {kitInfo.map(k => (
            <DetailTile key={k.label} label={k.label} value={k.value} />
          ))}
        </div>
      </SectionCard>

      <div className="p-3 rounded-lg" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
        <p className="text-xs" style={{ color: T.text3 }}>
          👕 Sub-fitting: <span style={{ color: T.text, fontWeight: 600 }}>Lou Carter checks new players at the first session — sizes ordered with the next bulk run.</span>
        </p>
      </div>
    </div>
  )
}

// ─── Tab 7: Sponsors ────────────────────────────────────────────────────────

function SponsorsTab() {
  const sponsors = [
    { name: 'Foxhill Hardware',          type: 'Kit Sponsor (3-year)',  value: '£500/yr · banner + shirt' },
    { name: 'Oakridge Garden Centre',    type: 'Pitch-side banner',     value: '£250/yr' },
    { name: 'Hartwell Family Dentistry', type: 'Match-ball sponsor',    value: '£25 per matchday × 8' },
    { name: 'The Old Stag · pub',         type: 'Tournament-day food',   value: 'In kind · summer festival' },
    { name: 'Surrey Family Law',          type: 'Cornwall tour backing', value: '£300 one-off (2026)' },
  ]
  return (
    <div className="space-y-4">
      <SectionCard title="Club sponsors · local businesses keep this club running">
        <div className="space-y-3">
          {sponsors.map(s => (
            <div key={s.name} className="flex items-center justify-between p-3 rounded-lg flex-wrap gap-2" style={{ backgroundColor: T.panelAlt }}>
              <div>
                <p className="text-sm font-medium" style={{ color: T.text }}>{s.name}</p>
                <p className="text-xs" style={{ color: T.text3 }}>{s.type}</p>
              </div>
              <Badge>{s.value}</Badge>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 flex items-center justify-between" style={{ borderTop: `1px solid ${T.border}` }}>
          <p className="text-xs font-semibold" style={{ color: T.text3 }}>Total sponsorship this season</p>
          <p className="text-sm font-bold" style={{ color: T.accentLight }}>£1,250 + in-kind</p>
        </div>
        <p className="text-xs mt-2 italic" style={{ color: T.text3 }}>
          &ldquo;Every bit helps — covers ref fees, the goalkeeper shirts, and the trophy-day BBQ.&rdquo;
        </p>
      </SectionCard>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: `${T.accent}15`, border: `1px solid ${T.accent}55` }}>
        <div className="p-4 space-y-4">
          <p className="text-sm font-bold" style={{ color: T.accentLight }}>Want to support Oakridge Juniors?</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 p-3 rounded-lg" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
              <p className="text-sm font-semibold" style={{ color: T.text }}>Sponsor a match ball — £25</p>
              <p className="text-xs mt-1" style={{ color: T.text3 }}>Talk to Jo Sefer (Treasurer).</p>
            </div>
            <div className="flex-1 p-3 rounded-lg" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
              <p className="text-sm font-semibold" style={{ color: T.text }}>Sponsor next season&rsquo;s kit</p>
              <p className="text-xs mt-1" style={{ color: T.text3 }}>3-year deals available — banner + shirt placement, every age band.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Shared bits ────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
      <div className="px-4 py-3" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
        <p className="text-sm font-bold" style={{ color: T.text }}>{title}</p>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function DetailTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg" style={{ backgroundColor: T.panelAlt }}>
      <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: T.text3 }}>{label}</p>
      <p className="text-sm font-medium" style={{ color: T.text }}>{value}</p>
    </div>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[10px] px-2 py-0.5 rounded font-semibold"
      style={{ backgroundColor: T.accentDim, color: T.accentLight, border: `1px solid ${T.accent}55` }}
    >
      {children}
    </span>
  )
}
