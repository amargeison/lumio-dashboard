'use client'

import { useState } from 'react'
import { WOMENS_STAFF, DEPT_COLOR, type StaffDept } from '@/app/womens/[slug]/_lib/womens-staff-data'

// ─── Avatar helper ──────────────────────────────────────────────────────────
// CC0-licensed avatars via DiceBear "notionists" style by Bohdan Trotsenko
// (https://www.dicebear.com/styles/notionists/ — explicitly CC0 1.0 per
// dicebear.com/licenses). Hand-illustrated humanoid portraits, not GAN
// faces, not photographs. Deterministic per seed: same name → same SVG
// every render, every reload, every device. Served from DiceBear's CDN.
//
// Each staff record carries an `avatar` field (string seed, typically the
// staff member's full name). The helper produces a stable URL from that
// seed. Initials are kept on each record as a graceful fallback if the
// SVG fails to load.
function avatarUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=transparent`
}

// Women's portal — Staff dashboard tab (4 sub-tabs).
//
// Today      → ported from the Pro portal Staff Today layout (filter pills,
//              avatar+dot cards with name/role/dept/status/location, plus
//              an Upcoming Staff Events card).
// Org Chart  → ported from the Pro portal Org Chart layout (3 levels:
//              owner/board → CE+HC+DoF → dept heads, with a dept-colour
//              legend). Dept palette pulled from WOMENS_ROLE_CONFIG accents.
// Team Info  → ported from the TENNIS portal Team Info layout (richer
//              attribute-card grid with rating block, dept badge, 6-stat
//              grid, speciality / location / availability rows, ref +
//              profile button). Stats are role-specific per the approved
//              axes (incl. women's-specific WMN/CYC/RTP/SAF/LOA/ACL).
// Club Info  → ported from the Pro portal Club Info layout (Club Documents
//              grid + Club Details + Key Contacts + Upcoming This Month).
//              Docs taxonomy adapted to Women's modules.
//
// Pink-themed throughout. Demo data only — no Pro / Tennis names carried.

const C = {
  panel:      '#0D1117',
  panelAlt:   '#111318',
  panelDeep:  '#0A0B10',
  border:     '#1F2937',
  borderSoft: '#1A2030',
  text:       '#F9FAFB',
  text2:      '#D1D5DB',
  text3:      '#9CA3AF',
  text4:      '#6B7280',
  text5:      '#4B5563',
  pink:       '#EC4899',
  pinkDeep:   '#BE185D',
  pinkDim:    'rgba(190,24,93,0.18)',
  good:       '#22C55E',
}

// Dept colours + dept type come from the canonical staff roster
// (womens-staff-data.ts) so the Staff Directory and these tabs match.
type Dept = StaffDept

interface ClubProps {
  name: string
  league: string
  stadium: string
  capacity: number
  manager: string
  director: string
  founded: number
  kitSponsor: string | null
}

interface Props {
  club: ClubProps
}

type SubTab = 'today' | 'org' | 'info' | 'club'

// ─── Today: staff status ────────────────────────────────────────────────────

type StaffToday = {
  name: string
  role: string
  dept: Dept
  status: 'In today' | 'Away'
  location: string
  rel: string
}

// Derived from the canonical roster so Today always matches the Directory.
const STAFF_TODAY: StaffToday[] = WOMENS_STAFF.map(s => ({
  name: s.name, role: s.role, dept: s.dept, status: s.status, location: s.location,
  rel: s.reportsTo === 'Board' ? 'Reports to Board' : `Reports to ${s.reportsTo.split(' ').slice(-1)[0]}`,
}))

const STAFF_FILTERS = ['All', 'In Today', 'Away', 'Coaching', 'Medical', 'Welfare', 'Performance', 'Commercial'] as const
type StaffFilter = typeof STAFF_FILTERS[number]

function TodayTab() {
  const [filter, setFilter] = useState<StaffFilter>('All')
  const filtered = STAFF_TODAY.filter(s =>
    filter === 'All' ? true :
    filter === 'In Today' ? s.status === 'In today' :
    filter === 'Away'     ? s.status === 'Away' :
    s.dept === filter
  )
  const inCount   = STAFF_TODAY.filter(s => s.status === 'In today').length
  const awayCount = STAFF_TODAY.length - inCount

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-black" style={{ color: C.text }}>Staff Today</h2>
        <p className="text-xs" style={{ color: C.text4 }}>{STAFF_TODAY.length} staff · {inCount} in · {awayCount} away · 0 alerts</p>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {STAFF_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 text-xs font-bold rounded-xl transition-colors"
            style={{
              backgroundColor: filter === f ? C.pinkDeep : 'rgba(255,255,255,0.05)',
              color: filter === f ? C.text : C.text4,
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {filtered.map(m => {
          const colour = DEPT_COLOR[m.dept]
          return (
            <div key={m.name} className="rounded-2xl p-4" style={{ backgroundColor: C.panelAlt, border: `1px solid ${C.border}` }}>
              <div className="flex items-start gap-3">
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ backgroundColor: `${colour}20`, color: colour }}>
                    {m.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full" style={{ backgroundColor: m.status === 'In today' ? C.good : '#F59E0B', border: `2px solid ${C.panelAlt}` }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm truncate" style={{ color: C.text }}>{m.name}</span>
                  </div>
                  <p className="text-xs truncate" style={{ color: C.text4 }}>{m.role} · {m.dept === 'DoF' ? 'Football' : m.dept}</p>
                  <div className="flex gap-1.5 mt-1 items-center">
                    <span className="text-xs font-medium" style={{ color: m.status === 'In today' ? '#4ADE80' : '#FBBF24' }}>{m.status}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: C.border, color: C.text4 }}>{m.rel}</span>
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
          'Welfare cadence review — Nina Walsh, Fri',
          'New ACL screening lead onboarding Monday',
        ].map(e => (
          <p key={e} className="text-xs py-1" style={{ color: C.text2 }}>📅 {e}</p>
        ))}
      </div>
    </div>
  )
}

// ─── Org Chart ──────────────────────────────────────────────────────────────

// Org chart — data-driven from reportsTo relationships.
// Each entry names the person they report to (by name); the chart layout
// is derived from those edges, not hardcoded. Top of chart has
// reportsTo: null. Change a `reportsTo` value here and the rendered
// hierarchy + connector lines update automatically — no layout edits.
type StaffNode = {
  name: string
  role: string
  dept: Dept | 'Board'
  avatar: string
  reportsTo: string | null
}

// Reporting structure rationale:
// - Director Kate Brennan oversees the business side (Operations,
//   Commercial, Community).
// - Director of Football Helen Voss oversees the football+performance
//   side (Performance, Medical, Welfare). Putting Medical and Welfare
//   under DoF reflects a common WSL/WSL 2 setup; some clubs use
//   independent reporting lines (especially Carney-standards welfare)
//   but for a single-line org chart, DoF stewardship is the cleanest
//   single representation.
// - Head Coach Sarah Frost reports directly to the Board and runs the
//   first-team coaching staff (not modelled at this level of detail).
function staffRoster(club: ClubProps): StaffNode[] {
  const board = `${club.name} Board`
  // Derived from the canonical roster; reportsTo 'Board' maps to the board node.
  const nodes: StaffNode[] = WOMENS_STAFF.map(s => ({
    name: s.name, role: s.role, dept: s.dept, avatar: s.name,
    reportsTo: s.reportsTo === 'Board' ? board : s.reportsTo,
  }))
  return [
    { name: board, role: 'Owner / Board', dept: 'Board', avatar: board, reportsTo: null },
    ...nodes,
  ]
}

function OrgChartTab({ club }: { club: ClubProps }) {
  const staff = staffRoster(club)
  const root = staff.find(s => s.reportsTo === null)
  if (!root) return null
  const directReports = (boss: string) => staff.filter(s => s.reportsTo === boss)
  const level1 = directReports(root.name)

  const PersonCard = ({ node, size }: { node: StaffNode; size: 'mid' | 'leaf' }) => {
    const colour = node.dept === 'Board' ? C.text5 : DEPT_COLOR[node.dept]
    const isMid = size === 'mid'
    const avatarPx = isMid ? 40 : 32
    return (
      <div
        className="rounded-xl text-center"
        style={{
          backgroundColor: isMid ? C.panelAlt : C.panelDeep,
          border: `1px solid ${colour}${isMid ? '' : '40'}`,
          padding: isMid ? 12 : 10,
          width: isMid ? 168 : 132,
        }}
      >
        <img
          src={avatarUrl(node.avatar)}
          alt=""
          className="rounded-full mx-auto mb-1 object-cover"
          style={{ width: avatarPx, height: avatarPx, backgroundColor: `${colour}20`, border: `1px solid ${colour}40` }}
        />
        <p className={isMid ? 'text-xs font-bold truncate' : 'text-xs font-medium truncate'} style={{ color: isMid ? C.text : C.text2 }}>{node.name}</p>
        <p className="text-[10px] truncate" style={{ color: colour }}>{node.role}</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-black mb-6" style={{ color: C.text }}>Club Organisation</h2>

      {/* Root — Owner / Board */}
      <div className="flex justify-center mb-2">
        <div className="rounded-xl p-4 text-center w-56" style={{ backgroundColor: C.panelAlt, border: `2px solid ${C.text5}` }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm mx-auto mb-2" style={{ backgroundColor: 'rgba(75,85,99,0.2)', color: C.text5 }}>
            {root.name.split(' ').map(w => w[0]).join('').slice(0, 3)}
          </div>
          <p className="text-sm font-bold" style={{ color: C.text }}>{root.name}</p>
          <p className="text-[10px]" style={{ color: C.text5 }}>{root.role}</p>
        </div>
      </div>

      {/* Connector from root down */}
      <div className="flex justify-center mb-1"><div className="w-px h-6" style={{ backgroundColor: '#374151' }} /></div>

      {/* Level 1 columns — each top-of-tree person gets their own column
          containing their card + their direct reports below. Reports are
          derived from the staff[].reportsTo edges, so changing a
          reportsTo here re-routes the lines automatically. */}
      <div className="flex justify-center gap-6 items-start flex-wrap">
        {level1.map(person => {
          const myReports = directReports(person.name)
          return (
            <div key={person.name} className="flex flex-col items-center gap-3">
              {/* Vertical connector from the root's horizontal bus down to this person */}
              <div className="w-px h-4" style={{ backgroundColor: '#374151' }} />
              <PersonCard node={person} size="mid" />
              {myReports.length > 0 && (
                <>
                  <div className="w-px h-4" style={{ backgroundColor: '#374151' }} />
                  {myReports.length > 1 && (
                    <div className="h-px" style={{ backgroundColor: '#374151', width: `${Math.min(100, myReports.length * 60)}%` }} />
                  )}
                  <div className="flex gap-3 justify-center flex-wrap">
                    {myReports.map(rep => (
                      <div key={rep.name} className="flex flex-col items-center gap-1">
                        <div className="w-px h-3" style={{ backgroundColor: '#374151' }} />
                        <PersonCard node={rep} size="leaf" />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend — dept colours present in the rendered roster */}
      <div className="flex gap-3 justify-center mt-8 flex-wrap">
        {Array.from(new Set(staff.filter(s => s.dept !== 'Board').map(s => s.dept))).map(dept => (
          <div key={dept} className="flex items-center gap-1.5 text-xs" style={{ color: C.text4 }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DEPT_COLOR[dept as Dept] }} />
            {dept === 'DoF' ? 'Football' : dept}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Team Info — attribute-card grid (Tennis pattern) ───────────────────────

type StaffCard = {
  initials: string
  avatar: string  // seed for avatarUrl() — defaults to staff name; deterministic per person
  name: string
  role: string
  dept: Dept
  rating: number
  ref: string
  stats: Record<string, number>
  speciality: string
  location: string
  available: boolean
}

const TEAM_INFO_CARDS: StaffCard[] = WOMENS_STAFF.map(s => ({
  initials: s.initials, avatar: s.name, name: s.name, role: s.role, dept: s.dept,
  rating: s.rating, ref: s.ref, stats: s.stats, speciality: s.speciality,
  location: s.location, available: s.available,
}))

function TeamInfoTab() {
  return (
    <div>
      <h2 className="text-xl font-black mb-3" style={{ color: C.text }}>Team Info</h2>
      <p className="text-xs mb-4" style={{ color: C.text4 }}>
        Staff attribute cards — ratings and stats are demo only, role-specific axes (incl. women&apos;s-football-specific WMN / CYC / RTP / SAF / LOA / ACL).
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {TEAM_INFO_CARDS.map(m => {
          const colour = DEPT_COLOR[m.dept]
          const roleShort = m.role.split(/\s+/)[0].toUpperCase().slice(0, 4)
          const statEntries = Object.entries(m.stats)
          return (
            <div
              key={m.name}
              className="rounded-xl overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${colour}18 0%, rgba(0,0,0,0.6) 100%)`,
                border: `1px solid ${colour}40`,
              }}
            >
              <div className="flex items-start justify-between px-3 pt-3 pb-1">
                <div>
                  <div className="text-2xl font-black leading-none" style={{ color: C.text }}>{m.rating}</div>
                  <div className="text-[9px] font-bold uppercase tracking-widest mt-0.5" style={{ color: colour }}>{roleShort}</div>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: `${colour}25`, color: colour }}>{m.dept === 'DoF' ? 'Football' : m.dept}</span>
              </div>

              <div className="flex justify-center pb-1">
                <img
                  src={avatarUrl(m.avatar)}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                  style={{ backgroundColor: `${colour}20`, border: `1px solid ${colour}60` }}
                />
              </div>

              <div className="text-center px-3 pb-2">
                <div className="text-sm font-black" style={{ color: C.text }}>{m.name}</div>
                <div className="text-[10px] mt-0.5" style={{ color: colour }}>{m.role}</div>
              </div>

              <div className="grid grid-cols-3" style={{ borderTop: `1px solid ${colour}20`, borderBottom: `1px solid ${colour}20` }}>
                {statEntries.map(([k, v], i) => (
                  <div
                    key={k}
                    className="flex items-center justify-center gap-1 py-1 text-[10px]"
                    style={{
                      borderRight: (i + 1) % 3 !== 0 ? `1px solid ${colour}15` : 'none',
                      borderBottom: i < 3 ? `1px solid ${colour}15` : 'none',
                    }}
                  >
                    <span className="font-black" style={{ color: C.text }}>{v}</span>
                    <span style={{ color: colour }}>{k}</span>
                  </div>
                ))}
              </div>

              <div className="px-3 py-2 space-y-0.5 text-[10px]">
                <div className="flex justify-between gap-2"><span style={{ color: C.text4 }}>Speciality</span><span className="text-right truncate" style={{ color: C.text }}>{m.speciality}</span></div>
                <div className="flex justify-between gap-2"><span style={{ color: C.text4 }}>Location</span><span className="text-right truncate" style={{ color: C.text }}>{m.location}</span></div>
                <div className="flex justify-between"><span style={{ color: C.text4 }}>Available</span><span className="font-bold" style={{ color: m.available ? C.good : '#EF4444' }}>{m.available ? 'Yes' : 'No'}</span></div>
              </div>

              <div className="px-3 pb-3 pt-0.5 flex items-center justify-between">
                <span className="text-[9px]" style={{ color: C.text5 }}>{m.ref}</span>
                <button className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ backgroundColor: `${colour}20`, color: colour, border: `1px solid ${colour}30` }}>👤 Profile</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Club Info ──────────────────────────────────────────────────────────────

// Each doc card opens an illustrative demo modal — see the modal disclaimer
// inside ClubInfoTab. Bodies are intentionally short placeholders, not real
// regulatory artefacts. Cycle-Tracking + Pregnancy & RTP entries use the
// wellbeing-led, player-controlled framing the dedicated modules ship.
type ClubDoc = { icon: string; title: string; desc: string; body: string[] }
const CLUB_DOCS: ClubDoc[] = [
  {
    icon: '📋', title: 'Staff Code of Conduct',
    desc: 'Professional standards and disciplinary procedures',
    body: [
      'Sets the professional standards expected of every member of staff at the club — coaches, medical, welfare, performance, operations, commercial and community.',
      'Covers: conflicts of interest, gifts and hospitality, social media use, anti-discrimination and inclusion, safeguarding obligations, confidentiality of player data.',
      'Disciplinary process is graduated (informal → formal → review) with PFA liaison available at every stage. Welfare Lead has independent reporting line for any concerns raised about staff conduct.',
      'Reviewed annually by the Club Director and Welfare Lead. Last reviewed: March 2026.',
    ],
  },
  {
    icon: '🛡️', title: 'Karen Carney Compliance',
    desc: 'Annual Carney-standards self-assessment (demo template)',
    body: [
      'Self-assessment template aligned to the Karen Carney Review recommendations for professional women’s football — welfare, mental-health provision, parental rights, environmental standards, transition support.',
      'Sections cover: independent Welfare Lead in post, mandatory cycle-aware training adaptation, postpartum return-to-play pathway, mental-health pathway, player transition / retirement support, equality monitoring.',
      'Annual return is signed by the Club Director and Welfare Lead. Outstanding items flagged on the FSR Dashboard so the board sees them every meeting.',
      'Next return due: September 2026.',
    ],
  },
  {
    icon: '📊', title: 'FSR Submission Pack',
    desc: 'Quarterly FSR submission template + supporting evidence',
    body: [
      'Template for the quarterly Financial Sustainability Regulation submission. Filed by the Club Director with the Finance & Welfare oversight committee.',
      'Submission includes: relevant-revenue calculation (broadcast + matchday + commercial + sponsorship + central distributions), squad-cost calculation, wage-to-revenue ratio, headroom against the 80% cap, projections for the next four quarters.',
      'Supporting evidence: signed sponsorship contracts (redacted), broadcast revenue confirmation, matchday receipts summary, wage bill snapshot, transfer-window forecast.',
      'Q1 2026 submission accepted. Next submission window: Q2, due July 2026.',
    ],
  },
  {
    icon: '🌸', title: 'Cycle-Tracking Privacy Policy',
    desc: 'Opt-in policy + consent/revoke workflow — player-controlled',
    body: [
      'Cycle tracking at this club is opt-in only. No player is ever required, encouraged in performance reviews, or chased on the matter. Choice and timing are entirely the player’s.',
      'Consent is recorded in writing in the Lumio Cycle app at the moment the player opts in. Players can revoke consent at any time, from the same app, with no notice required and no questions asked.',
      'Access is role-gated to the Club Doctor and the Welfare Lead only. Coaching staff see availability flags only (e.g. modified-load recommendation) — never the underlying phase data.',
      'On revocation, data is purged from the active view immediately and from backup snapshots within the standard 30-day backup window. Welfare Lead is the data steward.',
    ],
  },
  {
    icon: '🤰', title: 'Pregnancy & Return-to-Play Pathway',
    desc: '10-stage pathway + WSL 26-week + FIFA Art. 18quater notes',
    body: [
      'Pregnancy is treated as a phase of a player’s career the club has a duty to support, not a risk to monitor. The pathway is player-led at every stage.',
      'Ten stages: notification & confirmation → clinical handover → adapted training (T1, T2) → cessation of contact → maternity leave → postpartum medical clearance → pelvic floor & MSK screening → graduated RTP (non-contact → contact) → match selection cleared.',
      'Policy backstop: WSL 26 weeks full pay (UK domestic minimum); FIFA Regulations Art. 18quater 14 weeks paid maternity globally (8 weeks post-birth minimum, anti-termination, mandatory reintegration). Whichever is more favourable applies.',
      'Visibility scope: clinical detail stays with the player and Club Doctor; the Welfare Lead sees pathway stage and contract obligations; the Director and Coach see availability status only. PFA support is offered and accessible at every stage.',
    ],
  },
  {
    icon: '🏛️', title: 'Club Licensing Evidence Vault',
    desc: 'Index to the licensing evidence library (demo)',
    body: [
      'Index to evidence files maintained against the six licensing categories: facilities, staffing, academy, contact hours, welfare, medical.',
      'Each criterion has its own evidence record: threshold, current status, evidence-on-file reference, last-reviewed date, next-review date, and (where applicable) the action-plan workstream addressing it.',
      'Vault is the working document; the Club Licensing module surfaces a live read of the same data. Evidence is curated by the Operations Manager with sign-off from the Welfare Lead and Club Doctor for their sections.',
      'Brand-safety reminder: figures and document numbers in the licensing module are illustrative demo values. The club does not issue its own licences.',
    ],
  },
  {
    icon: '🔒', title: 'Data & GDPR',
    desc: 'Welfare, cycle and medical data handling scope',
    body: [
      'Player welfare data, cycle-tracking data and medical records are each held under separate consent. Players grant or revoke each consent independently.',
      'Lawful basis: explicit consent for cycle and welfare data; legitimate interest with overriding consent for occupational medical records during employment.',
      'Retention: cycle data purged on revocation (immediate from active view, 30 days from backups). Medical records retained for the statutory period after employment ends, then purged.',
      'Subject Access Requests: handled by the Welfare Lead within 30 days. Right to erasure honoured for cycle and welfare data while contractual obligations allow.',
    ],
  },
  {
    icon: '🎓', title: 'Coaching & CPD',
    desc: 'UEFA licence requirements and CPD policy',
    body: [
      'Coaching staff licence requirements: Head Coach UEFA Pro or recognised equivalent; Assistant Head Coach UEFA A; goalkeeper coach UEFA GK B; academy coaches UEFA B minimum.',
      'CPD: each coach completes a minimum of 20 hours of recognised CPD per season, recorded in the coaches’ CPD log. Reimbursement for course fees is available — see Operations.',
      'Mentor scheme: pairs newer coaching staff with senior coaches for a 12-month structured exchange. Optional but encouraged for academy and assistant coaches.',
      'Equality, diversity and inclusion training is mandatory for all coaching staff annually and is included in the CPD hours total.',
    ],
  },
]

// Downloadable PDF artefacts (generated demo documents) keyed by doc title.
// Files live in /public/docs/womens and are served at /docs/womens/<file>.
const DOC_META: Record<string, { file: string; ref: string; version: string; effective: string; owner: string }> = {
  'Staff Code of Conduct':              { file: 'staff-code-of-conduct.pdf',            ref: 'OWFC-HR-001',   version: 'v3.1', effective: '01 Mar 2026', owner: 'Club Director' },
  'Karen Carney Compliance':            { file: 'karen-carney-compliance.pdf',          ref: 'OWFC-COMP-004', version: 'v2.0', effective: '01 Sep 2025', owner: 'Welfare Lead' },
  'FSR Submission Pack':                { file: 'fsr-submission-pack.pdf',               ref: 'OWFC-FIN-012',  version: 'v1.4', effective: '01 Apr 2026', owner: 'Club Director' },
  'Cycle-Tracking Privacy Policy':      { file: 'cycle-tracking-privacy-policy.pdf',     ref: 'OWFC-WEL-007',  version: 'v2.2', effective: '15 Jan 2026', owner: 'Welfare Lead' },
  'Pregnancy & Return-to-Play Pathway': { file: 'pregnancy-return-to-play-pathway.pdf',  ref: 'OWFC-MED-009',  version: 'v1.3', effective: '01 Feb 2026', owner: 'Club Doctor' },
  'Club Licensing Evidence Vault':      { file: 'club-licensing-evidence-index.pdf',     ref: 'OWFC-OPS-015',  version: 'v1.1', effective: '01 Mar 2026', owner: 'Head of Operations' },
  'Data & GDPR':                        { file: 'data-protection-gdpr.pdf',              ref: 'OWFC-LEG-003',  version: 'v2.1', effective: '01 Jan 2026', owner: 'Welfare Lead' },
  'Coaching & CPD':                     { file: 'coaching-cpd-policy.pdf',               ref: 'OWFC-COA-006',  version: 'v1.2', effective: '01 Aug 2025', owner: 'Head Coach' },
}

function ClubInfoTab({ club }: { club: ClubProps }) {
  const [openDoc, setOpenDoc] = useState<string | null>(null)
  const openedDoc = openDoc ? CLUB_DOCS.find(d => d.title === openDoc) : null
  const meta = openDoc ? DOC_META[openDoc] : null

  const details: Array<[string, string]> = [
    ['Club',           club.name],
    ['Founded',        String(club.founded)],
    ['Nickname',       'The Oaks'],
    ['Colours',        'Pink and navy'],
    ['Stadium',        `${club.stadium} (${club.capacity.toLocaleString()})`],
    ['Training Ground','Oakridge Training Centre'],
    ['League',         club.league === 'WSL2' ? 'WSL 2' : club.league],
    ['FA Charter Tier','Tier 2 — Professional Women’s Club'],
  ]
  const contacts: Array<[string, string]> = [
    ['Director',              club.director],
    ['Head Coach',            club.manager],
    ['Director of Football',  'Helen Voss'],
    ['Club Doctor',           'Dr Anna Reid'],
    ['Welfare Lead',          'Nina Walsh'],
    ['Commercial Director',   'Jordan Clarke'],
  ]
  const upcoming: Array<[string, string, string]> = [
    ['📋', 'Pre-match briefing',    'Hartwell Women — Fri'],
    ['⚽', 'Matchday',                'vs Hartwell Women (H) — Sat 12 Apr'],
    ['📋', 'Post-match debrief',    'Mon'],
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-black" style={{ color: C.text }}>Club Info</h2>

      {/* Documents */}
      <div>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Club Documents</p>
        <p className="text-[10px] mb-3" style={{ color: C.text5 }}>Downloadable sample policies &amp; club artefacts — demo content for Oakridge Women FC.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CLUB_DOCS.map(p => (
            <button
              key={p.title}
              onClick={() => setOpenDoc(p.title)}
              className="rounded-xl p-4 text-left transition-colors"
              style={{ backgroundColor: C.panelAlt, border: `1px solid ${C.border}`, cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.pinkDeep }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border }}
            >
              <span className="text-2xl block mb-2">{p.icon}</span>
              <p className="text-xs font-bold" style={{ color: C.text }}>{p.title}</p>
              <p className="text-[10px] mt-0.5" style={{ color: C.text4 }}>{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Doc viewer — illustrative demo content, opens on card click.
          Backdrop + centred panel. Visible "demo placeholder" banner at top
          honours the existing disclaimer immediately above the doc grid. */}
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

            <div className="px-6 py-2.5 shrink-0 flex flex-wrap items-center gap-x-4 gap-y-1" style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: C.pinkDim }}>
              {meta && (
                <>
                  <span className="text-[10px]" style={{ color: '#F9A8D4' }}><b style={{ color: '#F472B6' }}>Ref</b> {meta.ref}</span>
                  <span className="text-[10px]" style={{ color: '#F9A8D4' }}><b style={{ color: '#F472B6' }}>Version</b> {meta.version}</span>
                  <span className="text-[10px]" style={{ color: '#F9A8D4' }}><b style={{ color: '#F472B6' }}>Effective</b> {meta.effective}</span>
                  <span className="text-[10px]" style={{ color: '#F9A8D4' }}><b style={{ color: '#F472B6' }}>Owner</b> {meta.owner}</span>
                  <a href={`/docs/womens/${meta.file}`} target="_blank" rel="noreferrer" className="ml-auto text-[11px] font-bold px-2.5 py-1 rounded-lg" style={{ backgroundColor: C.pinkDeep, color: '#fff' }}>⬇ Download PDF</a>
                </>
              )}
            </div>

            <div className="px-6 py-5 overflow-y-auto flex-1 space-y-3">
              {openedDoc.body.map((para, i) => (
                <p key={i} className="text-sm leading-relaxed" style={{ color: C.text2 }}>{para}</p>
              ))}
            </div>

            <div className="px-6 py-3 shrink-0 flex items-center justify-between" style={{ borderTop: `1px solid ${C.border}` }}>
              <span className="text-[10px]" style={{ color: C.text5 }}>Sample document · Oakridge Women FC · demo content</span>
              <div className="flex items-center gap-2">
                {meta && <a href={`/docs/womens/${meta.file}`} target="_blank" rel="noreferrer" className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ backgroundColor: C.pinkDeep, color: '#fff' }}>⬇ Download PDF</a>}
                <button onClick={() => setOpenDoc(null)} className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ backgroundColor: C.pinkDim, color: '#F472B6', border: `1px solid ${C.pinkDeep}` }}>Close</button>
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
    </div>
  )
}

// ─── Main export ────────────────────────────────────────────────────────────

export default function WomensStaffTabs({ club }: Props) {
  const [tab, setTab] = useState<SubTab>('today')
  const tabs: Array<{ id: SubTab; label: string }> = [
    { id: 'today', label: 'Today' },
    { id: 'org',   label: 'Org Chart' },
    { id: 'info',  label: 'Team Info' },
    { id: 'club',  label: 'Club Info' },
  ]
  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-gray-800 mb-4">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-2 text-xs font-semibold transition-all"
            style={{
              color: tab === t.id ? C.pinkDeep : C.text4,
              borderBottom: tab === t.id ? `2px solid ${C.pinkDeep}` : '2px solid transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'today' && <TodayTab />}
      {tab === 'org'   && <OrgChartTab club={club} />}
      {tab === 'info'  && <TeamInfoTab />}
      {tab === 'club'  && <ClubInfoTab club={club} />}
    </div>
  )
}



