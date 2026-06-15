'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { FOOTBALL_STAFF, FB_DEPT_COLOR, type FBStaffDept } from '@/app/(football)/football/[slug]/_lib/football-staff-data'

// Men's Pro — Staff dashboard (3 sub-tabs), mirrors the Women's flagship.
//
// Today      → filter pills + status cards, derived from the canonical roster.
// Org Chart  → data-driven from reportsTo edges (measured SVG connectors).
// Directory  → attribute-card grid (rating, dept badge, 6-stat grid, profile).
//
// Club Info has MOVED to Club Operations (exported as FootballClubInfoTab,
// wired into the Club Ops PlayerWelfareHub clubInfoSlot). Blue-themed throughout.

// CC0 DiceBear "notionists" avatars (hand-illustrated, deterministic per seed).
function avatarUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=transparent`
}

const C = {
  panel:      '#0D1117',
  panelAlt:   '#111318',
  panelDeep:  '#0A0B10',
  border:     '#1F2937',
  text:       '#F9FAFB',
  text2:      '#D1D5DB',
  text3:      '#9CA3AF',
  text4:      '#6B7280',
  text5:      '#4B5563',
  blue:       '#003DA5',
  blueLt:     '#2563EB',
  good:       '#22C55E',
}

type Dept = FBStaffDept

// ─── Today ──────────────────────────────────────────────────────────────────

const STAFF_FILTERS = ['All', 'In Today', 'Away', 'Coaching', 'Medical', 'Performance', 'Recruitment', 'Academy'] as const
type StaffFilter = typeof STAFF_FILTERS[number]

function TodayTab() {
  const [filter, setFilter] = useState<StaffFilter>('All')
  const filtered = FOOTBALL_STAFF.filter(s =>
    filter === 'All' ? true :
    filter === 'In Today' ? s.status === 'In today' :
    filter === 'Away'     ? s.status === 'Away' :
    s.dept === filter
  )
  const inCount   = FOOTBALL_STAFF.filter(s => s.status === 'In today').length
  const awayCount = FOOTBALL_STAFF.length - inCount

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-black" style={{ color: C.text }}>Staff Today</h2>
        <p className="text-xs" style={{ color: C.text4 }}>{FOOTBALL_STAFF.length} staff · {inCount} in · {awayCount} away · 0 alerts</p>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {STAFF_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 text-xs font-bold rounded-xl transition-colors"
            style={{
              backgroundColor: filter === f ? C.blue : 'rgba(255,255,255,0.05)',
              color: filter === f ? C.text : C.text4,
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {filtered.map(m => {
          const colour = FB_DEPT_COLOR[m.dept]
          const rel = m.reportsTo === 'Board' ? 'Reports to Board' : `Reports to ${m.reportsTo.split(' ').slice(-1)[0]}`
          return (
            <div key={m.name} className="rounded-2xl p-4" style={{ backgroundColor: C.panelAlt, border: `1px solid ${C.border}` }}>
              <div className="flex items-start gap-3">
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ backgroundColor: `${colour}20`, color: colour }}>
                    {m.initials}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full" style={{ backgroundColor: m.status === 'In today' ? C.good : '#F59E0B', border: `2px solid ${C.panelAlt}` }} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-sm truncate block" style={{ color: C.text }}>{m.name}</span>
                  <p className="text-xs truncate" style={{ color: C.text4 }}>{m.role} · {m.dept}</p>
                  <div className="flex gap-1.5 mt-1 items-center">
                    <span className="text-xs font-medium" style={{ color: m.status === 'In today' ? '#4ADE80' : '#FBBF24' }}>{m.status}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: C.border, color: C.text4 }}>{rel}</span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: C.text4 }}>{m.location}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-xl p-5" style={{ backgroundColor: C.panelAlt, border: `1px solid ${C.border}` }}>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Upcoming Staff Events</p>
        {[
          'Board meeting Thursday 2pm',
          'Recruitment review — Dave Thompson, Fri',
          'New S&C intern onboarding Monday',
        ].map(e => (
          <p key={e} className="text-xs py-1" style={{ color: C.text2 }}>📅 {e}</p>
        ))}
      </div>
    </div>
  )
}

// ─── Org Chart (data-driven from reportsTo) ─────────────────────────────────

type StaffNode = { name: string; role: string; dept: Dept | 'Board'; avatar: string; reportsTo: string | null }

function staffRoster(): StaffNode[] {
  const board = 'Oakridge FC Board'
  const nodes: StaffNode[] = FOOTBALL_STAFF.map(s => ({
    name: s.name, role: s.role, dept: s.dept, avatar: s.name,
    reportsTo: s.reportsTo === 'Board' ? board : s.reportsTo,
  }))
  return [
    { name: board, role: 'Owner / Board', dept: 'Board', avatar: board, reportsTo: null },
    ...nodes,
  ]
}

function OrgChartTab() {
  const staff = staffRoster()
  const root = staff.find(s => s.reportsTo === null)
  const directReports = (boss: string) => staff.filter(s => s.reportsTo === boss)

  const containerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [paths, setPaths] = useState<string[]>([])
  const [box, setBox] = useState({ w: 0, h: 0 })

  const compute = useCallback(() => {
    const cont = containerRef.current
    if (!cont) return
    const cb = cont.getBoundingClientRect()
    const scale = cont.offsetWidth ? cb.width / cont.offsetWidth : 1
    const lx = (clientX: number) => Math.round((clientX - cb.left) / scale)
    const ly = (clientY: number) => Math.round((clientY - cb.top) / scale)
    const segs: string[] = []
    for (const person of staff) {
      const reports = staff.filter(s => s.reportsTo === person.name)
      if (!reports.length) continue
      const pe = cardRefs.current[person.name]
      if (!pe) continue
      const pr = pe.getBoundingClientRect()
      const px = lx(pr.left + pr.width / 2)
      const py = ly(pr.bottom)
      const midY = py + 20
      for (const rep of reports) {
        const ce = cardRefs.current[rep.name]
        if (!ce) continue
        const cr = ce.getBoundingClientRect()
        const cx = lx(cr.left + cr.width / 2)
        const cy = ly(cr.top)
        segs.push(`M ${px} ${py} L ${px} ${midY} L ${cx} ${midY} L ${cx} ${cy}`)
      }
    }
    setBox({ w: cont.scrollWidth, h: cont.scrollHeight })
    setPaths(segs)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    compute()
    const r1 = requestAnimationFrame(() => requestAnimationFrame(compute))
    const t = window.setTimeout(compute, 450)
    const fonts = (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts
    fonts?.ready?.then(() => compute()).catch(() => {})
    const ro = new ResizeObserver(compute)
    if (containerRef.current) ro.observe(containerRef.current)
    window.addEventListener('resize', compute)
    return () => {
      cancelAnimationFrame(r1); window.clearTimeout(t)
      ro.disconnect(); window.removeEventListener('resize', compute)
    }
  }, [compute])

  if (!root) return null

  const Box = ({ node, depth }: { node: StaffNode; depth: number }) => {
    const colour = node.dept === 'Board' ? C.text5 : FB_DEPT_COLOR[node.dept]
    const isRoot = depth === 0
    const emphasised = depth <= 1
    const w = isRoot ? 184 : emphasised ? 168 : 150
    const avatarPx = emphasised ? 38 : 30
    const deptLabel = node.dept === 'Board' ? '' : node.dept
    return (
      <div
        ref={el => { cardRefs.current[node.name] = el }}
        style={{
          width: w, position: 'relative', zIndex: 1, borderRadius: 12, textAlign: 'center',
          padding: isRoot ? 12 : emphasised ? 11 : 9,
          background: emphasised ? C.panelAlt : C.panelDeep,
          border: `${emphasised ? 2 : 1}px solid ${colour}${isRoot ? '' : emphasised ? 'aa' : '55'}`,
        }}
      >
        {isRoot
          ? <div style={{ width: 46, height: 46, borderRadius: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, margin: '0 auto 8px', background: 'rgba(75,85,99,0.2)', color: C.text5 }}>{node.name.split(' ').map(x => x[0]).join('').slice(0, 3)}</div>
          : <img src={avatarUrl(node.avatar)} alt="" onLoad={compute} style={{ width: avatarPx, height: avatarPx, borderRadius: 9999, objectFit: 'cover', margin: '0 auto 6px', display: 'block', background: `${colour}20`, border: `1px solid ${colour}55` }} />}
        <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{node.name}</div>
        <div style={{ fontSize: 10.5, lineHeight: 1.2, marginTop: 2, color: isRoot ? C.text5 : colour }}>{node.role}{deptLabel ? ` · ${deptLabel}` : ''}</div>
      </div>
    )
  }

  const Node = ({ node, depth }: { node: StaffNode; depth: number }) => {
    const reports = directReports(node.name)
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '0 0 auto' }}>
        <Box node={node} depth={depth} />
        {reports.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, marginTop: 40 }}>
            {reports.map(rep => <Node key={rep.name} node={rep} depth={depth + 1} />)}
          </div>
        )}
      </div>
    )
  }

  const depts = Array.from(new Set(staff.filter(s => s.dept !== 'Board').map(s => s.dept)))

  return (
    <div>
      <h2 className="text-xl font-black mb-6" style={{ color: C.text }}>Club Organisation</h2>
      <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
        <div ref={containerRef} style={{ position: 'relative', display: 'inline-block', padding: '4px 10px 10px' }}>
          <svg width={box.w} height={box.h} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 0, overflow: 'visible' }}>
            {paths.map((d, i) => <path key={i} d={d} fill="none" stroke="#3A4254" strokeWidth={1.5} shapeRendering="crispEdges" />)}
          </svg>
          <Node node={root} depth={0} />
        </div>
      </div>
      <div className="flex gap-3 justify-center mt-6 flex-wrap">
        {depts.map(dept => (
          <div key={dept} className="flex items-center gap-1.5 text-xs" style={{ color: C.text4 }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: FB_DEPT_COLOR[dept as Dept] }} />
            {dept}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Directory — table (mirrors the women's Staff Directory) ─────────────────

function DirectoryTab() {
  const [selected, setSelected] = useState<string | null>(null)
  const staff = FOOTBALL_STAFF
  const sel = staff.find(s => s.name === selected) ?? null
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">📋</span>
        <h2 className="text-xl font-black" style={{ color: C.text }}>Staff Directory</h2>
      </div>
      <p className="text-xs mb-4" style={{ color: C.text4 }}>Club personnel and contacts · {staff.length} staff</p>
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
        <table className="w-full text-sm">
          <thead><tr className="text-xs" style={{ color: C.text4, borderBottom: `1px solid ${C.border}`, background: 'rgba(17,24,39,0.3)' }}>
            <th className="text-left p-3 font-semibold">Name</th><th className="text-left p-3 font-semibold">Role</th><th className="text-left p-3 font-semibold">Dept</th><th className="text-left p-3 font-semibold">Email</th><th className="text-left p-3 font-semibold">Phone</th><th className="text-left p-3 font-semibold">Start</th>
          </tr></thead>
          <tbody>
            {staff.map(s => {
              const color = FB_DEPT_COLOR[s.dept]
              return (
                <tr key={s.name} onClick={() => setSelected(s.name)} className="cursor-pointer transition-colors hover:bg-blue-600/5" style={{ borderBottom: `1px solid ${C.border}80` }}>
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ backgroundColor: `${color}22`, color }}>{s.initials}</span>
                      <span className="font-medium" style={{ color: C.text2 }}>{s.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-xs" style={{ color: C.text3 }}>{s.role}</td>
                  <td className="p-3"><span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: `${color}1f`, color }}>{s.dept}</span></td>
                  <td className="p-3 text-xs" style={{ color: C.text4 }}>{s.email}</td>
                  <td className="p-3 text-xs" style={{ color: C.text4 }}>{s.phone}</td>
                  <td className="p-3 text-xs" style={{ color: C.text4 }}>{s.start}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] mt-2" style={{ color: C.text5 }}>Click a staff member for full contact details.</p>
      {sel && <FootballStaffCardModal s={sel} onClose={() => setSelected(null)} />}
    </div>
  )
}

function FootballStaffCardModal({ s, onClose }: { s: typeof FOOTBALL_STAFF[number]; onClose: () => void }) {
  const color = FB_DEPT_COLOR[s.dept]
  const firstName = s.name.replace('Dr ', '').split(' ')[0]
  const rows: Array<[string, string]> = [
    ['Email', s.email],
    ['Phone', s.phone],
    ['Department', s.dept],
    ['Reports to', s.reportsTo === 'Board' ? 'Club Board' : s.reportsTo],
    ['Qualifications', s.quals],
    ['Based', s.location],
    ['At club since', s.start],
    ['Speciality', s.speciality],
  ]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${color}55` }} onClick={(e) => e.stopPropagation()}>
        <div className="p-5 flex items-start gap-4" style={{ background: `linear-gradient(135deg, ${color}22, transparent)` }}>
          <span className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold shrink-0" style={{ backgroundColor: `${color}26`, color, border: `1px solid ${color}55` }}>{s.initials}</span>
          <div className="min-w-0 flex-1">
            <div className="text-lg font-bold" style={{ color: C.text }}>{s.name}</div>
            <div className="text-sm" style={{ color }}>{s.role}</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color}1f`, color }}>{s.dept}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: s.status === 'In today' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)', color: s.status === 'In today' ? '#4ADE80' : '#FBBF24' }}>{s.status}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-lg leading-none" style={{ color: C.text4 }}>✕</button>
        </div>
        <div className="px-5 py-4 space-y-2">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-start justify-between gap-3 text-xs">
              <span className="shrink-0" style={{ color: C.text4 }}>{k}</span>
              <span className="text-right" style={{ color: C.text2 }}>{v}</span>
            </div>
          ))}
          <p className="pt-2 text-xs leading-relaxed mt-2" style={{ color: C.text3, borderTop: `1px solid ${C.border}` }}>{s.bio}</p>
        </div>
        <div className="px-5 py-3 flex items-center justify-end gap-2" style={{ borderTop: `1px solid ${C.border}` }}>
          <a href={`mailto:${s.email}`} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: color }}>Email {firstName}</a>
          <button onClick={onClose} className="rounded-lg px-3 py-1.5 text-xs" style={{ color: C.text4 }}>Close</button>
        </div>
      </div>
    </div>
  )
}

// ─── Club Info (exported — wired into Club Operations) ──────────────────────

type ClubDoc = { icon: string; title: string; desc: string; body: string[] }
const CLUB_DOCS: ClubDoc[] = [
  {
    icon: '📋', title: 'Staff Code of Conduct',
    desc: 'Professional standards and disciplinary procedures',
    body: [
      'Sets the professional standards expected of every member of staff — coaching, medical, performance, recruitment, academy, operations and commercial.',
      'Covers conflicts of interest, gifts and hospitality, social-media use, anti-discrimination and inclusion, safeguarding obligations, and confidentiality of player data.',
      'The disciplinary process is graduated (informal → formal → review), with PFA liaison available at every stage.',
      'Reviewed annually by the Chief Executive and Club Secretary. Last reviewed: March 2026.',
    ],
  },
  {
    icon: '🏥', title: 'Medical & Welfare Policy',
    desc: 'Confidentiality, treatment protocols and player welfare',
    body: [
      'Defines player medical confidentiality, the treatment-room protocols and the club’s duty of care to players and staff.',
      'Covers concussion management (graduated return-to-play), mental-health pathway, and the independent welfare reporting line.',
      'Clinical detail is held by the Club Doctor; coaching staff see availability flags only — never the underlying clinical data.',
      'Owned by the Club Doctor with sign-off from the Director of Football. Last reviewed: February 2026.',
    ],
  },
  {
    icon: '📊', title: 'PSR / Profit & Sustainability',
    desc: 'EFL P&S submission template + supporting evidence',
    body: [
      'Template for the EFL Profitability & Sustainability submission, filed by the Chief Executive with the board’s finance committee.',
      'Includes the rolling three-year loss calculation, allowable-deductions schedule (academy, community, infrastructure, women’s football), and the squad-cost ratio.',
      'Supporting evidence: signed sponsorship contracts (redacted), broadcast and central-distribution confirmation, matchday receipts and the wage-bill snapshot.',
      'Latest assessment within permitted limits. Next submission window: see Club Finance.',
    ],
  },
  {
    icon: '🔒', title: 'Data & GDPR Policy',
    desc: 'Player data handling, scouting database, media consent',
    body: [
      'Governs how player data, the scouting database and medical records are held, each under a separate lawful basis.',
      'Lawful basis: legitimate interest for performance and scouting data; explicit consent for media and image use; occupational-health basis for medical records during employment.',
      'Retention: scouting records reviewed annually; medical records retained for the statutory period after employment ends, then purged.',
      'Subject Access Requests handled by the Club Secretary within 30 days.',
    ],
  },
  {
    icon: '💰', title: 'Expenses & Travel Policy',
    desc: 'Away trips, scouting travel, meal allowances, booking',
    body: [
      'Sets out the booking process, approval limits and allowances for away trips, scouting travel and academy fixtures.',
      'All travel is booked through the Operations team; scouting trips require Chief Scout sign-off and are reconciled against the recruitment budget.',
      'Meal and subsistence allowances follow the published per-diem schedule; receipts are required for all reimbursable spend.',
      'Owned by the Club Secretary. Last reviewed: January 2026.',
    ],
  },
  {
    icon: '🎓', title: 'Coaching & CPD Policy',
    desc: 'UEFA licence requirements, CPD, development budget',
    body: [
      'Licence requirements: Head Coach UEFA Pro; Assistant Manager UEFA A; goalkeeping coach UEFA GK A; academy coaches UEFA B minimum.',
      'Each coach completes a minimum of 20 hours of recognised CPD per season, logged in the coaches’ CPD record. Course-fee reimbursement is available via Operations.',
      'A mentor scheme pairs newer staff with senior coaches for a structured 12-month exchange.',
      'Equality, diversity and inclusion training is mandatory annually and counts toward the CPD total.',
    ],
  },
  {
    icon: '🤝', title: 'Agent & Intermediary Policy',
    desc: 'FA regulations on agent contacts and disclosure',
    body: [
      'Governs all contact with agents and intermediaries in line with FA Football Agent Regulations.',
      'All approaches are logged; only the Director of Football and Chief Executive may negotiate, and every engagement is disclosed on the transaction record.',
      'Intermediary fees are recorded against the relevant transfer and reported in the club’s published intermediary-spend return.',
      'Owned by the Director of Football. Last reviewed: January 2026.',
    ],
  },
  {
    icon: '🎓', title: 'Academy / EPPP Policy',
    desc: 'EPPP category status, contact hours, safeguarding',
    body: [
      'Sets out the academy’s operating standards under the Elite Player Performance Plan, including category status, contact hours and the games programme.',
      'Covers the youth-to-first-team pathway, dual-registration and loan management, and the academy safeguarding framework.',
      'Evidence for the annual EPPP audit is curated by the Academy Director with operations and welfare sign-off.',
      'Current status: Category 2. Next audit: see Academy module.',
    ],
  },
]

const DOC_META: Record<string, { file: string; ref: string; version: string; effective: string; owner: string }> = {
  'Staff Code of Conduct':       { file: 'staff-code-of-conduct.pdf',        ref: 'OFC-HR-001',   version: 'v3.1', effective: '01 Mar 2026', owner: 'Chief Executive' },
  'Medical & Welfare Policy':    { file: 'medical-welfare-policy.pdf',       ref: 'OFC-MED-004',  version: 'v2.0', effective: '01 Feb 2026', owner: 'Club Doctor' },
  'PSR / Profit & Sustainability': { file: 'psr-profit-sustainability.pdf',  ref: 'OFC-FIN-012',  version: 'v1.4', effective: '01 Apr 2026', owner: 'Chief Executive' },
  'Data & GDPR Policy':          { file: 'data-protection-gdpr.pdf',         ref: 'OFC-LEG-003',  version: 'v2.1', effective: '01 Jan 2026', owner: 'Club Secretary' },
  'Expenses & Travel Policy':    { file: 'expenses-travel-policy.pdf',       ref: 'OFC-OPS-008',  version: 'v1.2', effective: '01 Jan 2026', owner: 'Club Secretary' },
  'Coaching & CPD Policy':       { file: 'coaching-cpd-policy.pdf',          ref: 'OFC-COA-006',  version: 'v1.2', effective: '01 Aug 2025', owner: 'Head Coach' },
  'Agent & Intermediary Policy': { file: 'agent-intermediary-policy.pdf',    ref: 'OFC-DOF-005',  version: 'v1.1', effective: '01 Jan 2026', owner: 'Director of Football' },
  'Academy / EPPP Policy':       { file: 'academy-eppp-policy.pdf',          ref: 'OFC-ACA-009',  version: 'v1.3', effective: '01 Aug 2025', owner: 'Academy Director' },
}

export function FootballClubInfoTab() {
  const [openDoc, setOpenDoc] = useState<string | null>(null)
  const openedDoc = openDoc ? CLUB_DOCS.find(d => d.title === openDoc) : null
  const meta = openDoc ? DOC_META[openDoc] : null

  const details: Array<[string, string]> = [
    ['Club',            'Oakridge FC'],
    ['Founded',         '1887'],
    ['Nickname',        'The Oaks'],
    ['Colours',         'Blue and yellow'],
    ['Stadium',         'Oakridge Park (24,000)'],
    ['Training Ground', 'Oakridge Training Complex'],
    ['League',          'EFL Championship'],
    ['EPPP Category',   'Category 2'],
  ]
  const contacts: Array<[string, string]> = [
    ['Chairman',             'Robert Blackwell'],
    ['Chief Executive',      'Margaret Foss'],
    ['Director of Football', 'Dave Thompson'],
    ['Head Coach',           'Marcus Reid'],
    ['Club Doctor',          'Dr Sarah Phillips'],
    ['Club Secretary',       'James Morton'],
  ]
  const upcoming: Array<[string, string, string]> = [
    ['📋', 'Pre-match briefing', 'Meridian City — Fri'],
    ['⚽', 'Matchday',            'vs Meridian City (H) — Sat 12 Apr'],
    ['📋', 'Post-match debrief',  'Mon'],
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-black" style={{ color: C.text }}>Club Info</h2>

      {/* Documents */}
      <div>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Club Documents</p>
        <p className="text-[10px] mb-3" style={{ color: C.text5 }}>Downloadable sample policies &amp; club artefacts — demo content for Oakridge FC.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CLUB_DOCS.map(p => (
            <button
              key={p.title}
              onClick={() => setOpenDoc(p.title)}
              className="rounded-xl p-4 text-left transition-colors"
              style={{ backgroundColor: C.panelAlt, border: `1px solid ${C.border}`, cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.blue }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border }}
            >
              <span className="text-2xl block mb-2">{p.icon}</span>
              <p className="text-xs font-bold" style={{ color: C.text }}>{p.title}</p>
              <p className="text-[10px] mt-0.5" style={{ color: C.text4 }}>{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Doc viewer */}
      {openedDoc && (
        <>
          <div className="fixed inset-0 z-[100]" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={() => setOpenDoc(null)} />
          <div
            className="fixed left-1/2 top-1/2 z-[101] -translate-x-1/2 -translate-y-1/2 rounded-2xl overflow-hidden flex flex-col"
            style={{ width: 'min(640px, 92vw)', maxHeight: '85vh', backgroundColor: C.panel, border: `1px solid ${C.border}`, boxShadow: '0 24px 60px rgba(0,0,0,0.55)' }}
          >
            <div className="flex items-start justify-between gap-3 px-6 py-4 shrink-0" style={{ borderBottom: `1px solid ${C.border}` }}>
              <div className="flex items-start gap-3 min-w-0">
                <span className="text-2xl shrink-0">{openedDoc.icon}</span>
                <div className="min-w-0">
                  <div className="text-base font-bold truncate" style={{ color: C.text }}>{openedDoc.title}</div>
                  <div className="text-[11px]" style={{ color: C.text4 }}>{openedDoc.desc}</div>
                </div>
              </div>
              <button onClick={() => setOpenDoc(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-base" style={{ color: C.text4 }} aria-label="Close">✕</button>
            </div>

            <div className="px-6 py-2.5 shrink-0 flex flex-wrap items-center gap-x-4 gap-y-1" style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: 'rgba(0,61,165,0.18)' }}>
              {meta && (
                <>
                  <span className="text-[10px]" style={{ color: '#93C5FD' }}><b style={{ color: '#60A5FA' }}>Ref</b> {meta.ref}</span>
                  <span className="text-[10px]" style={{ color: '#93C5FD' }}><b style={{ color: '#60A5FA' }}>Version</b> {meta.version}</span>
                  <span className="text-[10px]" style={{ color: '#93C5FD' }}><b style={{ color: '#60A5FA' }}>Effective</b> {meta.effective}</span>
                  <span className="text-[10px]" style={{ color: '#93C5FD' }}><b style={{ color: '#60A5FA' }}>Owner</b> {meta.owner}</span>
                  <a href={`/docs/football/${meta.file}`} target="_blank" rel="noreferrer" className="ml-auto text-[11px] font-bold px-2.5 py-1 rounded-lg" style={{ backgroundColor: C.blue, color: '#fff' }}>⬇ Download PDF</a>
                </>
              )}
            </div>

            <div className="px-6 py-5 overflow-y-auto flex-1 space-y-3">
              {openedDoc.body.map((para, i) => (
                <p key={i} className="text-sm leading-relaxed" style={{ color: C.text2 }}>{para}</p>
              ))}
            </div>

            <div className="px-6 py-3 shrink-0 flex items-center justify-between" style={{ borderTop: `1px solid ${C.border}` }}>
              <span className="text-[10px]" style={{ color: C.text5 }}>Sample document · Oakridge FC · demo content</span>
              <div className="flex items-center gap-2">
                {meta && <a href={`/docs/football/${meta.file}`} target="_blank" rel="noreferrer" className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ backgroundColor: C.blue, color: '#fff' }}>⬇ Download PDF</a>}
                <button onClick={() => setOpenDoc(null)} className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(0,61,165,0.18)', color: '#60A5FA', border: `1px solid ${C.blue}` }}>Close</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Club Details + Key Contacts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ backgroundColor: C.panelAlt, border: `1px solid ${C.border}` }}>
          <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Club Details</p>
          {details.map(([l, v]) => (
            <div key={l} className="flex justify-between py-1">
              <span className="text-xs" style={{ color: C.text4 }}>{l}</span>
              <span className="text-xs font-medium text-right" style={{ color: C.text }}>{v}</span>
            </div>
          ))}
        </div>
        <div className="rounded-xl p-5" style={{ backgroundColor: C.panelAlt, border: `1px solid ${C.border}` }}>
          <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Key Contacts</p>
          {contacts.map(([r, n]) => (
            <div key={r} className="flex justify-between py-1">
              <span className="text-xs" style={{ color: C.text4 }}>{r}</span>
              <span className="text-xs font-medium" style={{ color: C.text }}>{n}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming */}
      <div className="rounded-xl p-5" style={{ backgroundColor: C.panelAlt, border: `1px solid ${C.border}` }}>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Upcoming This Month</p>
        {upcoming.map(([icon, label, when], i) => (
          <p key={i} className="text-xs py-1" style={{ color: C.text2 }}>{icon} {label} — {when}</p>
        ))}
      </div>

      {/* Useful Links */}
      <div className="rounded-xl p-5" style={{ backgroundColor: C.panelAlt, border: `1px solid ${C.border}` }}>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Useful Links</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {['FA Club Portal', 'EFL Management System', 'Lumio Scout', 'Lumio GPS', 'Club Payroll', 'EPPP Portal', 'TransferRoom', 'Club Website'].map((l, i) => (
            <a key={i} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}`, color: C.text2 }}>🔗 {l}</a>
          ))}
        </div>
      </div>

      {/* Birthdays & Anniversaries */}
      <div className="rounded-xl p-5" style={{ backgroundColor: C.panelAlt, border: `1px solid ${C.border}` }}>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Birthdays &amp; Anniversaries This Month</p>
        {([['🎂', 'Pete Morrison — Birthday 3 Apr'], ['🎉', 'David Hughes — 3-year anniversary at the club 8 Apr'], ['🎂', 'Emma Clark — Birthday 22 Apr'], ['🎉', 'Ian Brooks — 6-year anniversary 28 Apr']] as [string, string][]).map(([icon, label], i) => (
          <p key={i} className="text-xs py-1" style={{ color: C.text2 }}>{icon} {label}</p>
        ))}
      </div>
    </div>
  )
}

// ─── Main export ────────────────────────────────────────────────────────────

type SubTab = 'today' | 'org' | 'info'

export default function FootballStaffView() {
  const [tab, setTab] = useState<SubTab>('today')
  const tabs: Array<{ id: SubTab; label: string }> = [
    { id: 'today', label: 'Today' },
    { id: 'org',   label: 'Org Chart' },
    { id: 'info',  label: 'Directory' },
  ]
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold" style={{ color: C.text }}>Staff Management</h2>
        <p className="text-sm mt-1" style={{ color: C.text3 }}>Coaching, medical, performance, recruitment, academy and administrative staff.</p>
      </div>

      <div className="flex gap-1 border-b border-gray-800 mb-4">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-2 text-xs font-semibold transition-all"
            style={{
              color: tab === t.id ? C.blueLt : C.text4,
              borderBottom: tab === t.id ? `2px solid ${C.blue}` : '2px solid transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'today' && <TodayTab />}
      {tab === 'org'   && <OrgChartTab />}
      {tab === 'info'  && <DirectoryTab />}
    </div>
  )
}
