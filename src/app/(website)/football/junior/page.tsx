'use client'

import Link from 'next/link'
import SportRoleTabs from '../../components/SportRoleTabs'
import { JUNIOR_ROLES } from '../../components/sportRoles'
import { CrossDiscoveryStrip } from '../components/CrossDiscoveryStrip'

// Theme constants — Junior green palette, gold accent.
const GREEN = '#16A34A'
const GREEN_DARK = '#166534'
const GREEN_LIGHT = '#22C55E'
const GREEN_DIM = 'rgba(22,163,74,0.15)'
const GOLD = '#F1C40F'
const BG = '#07080F'
const ALT_BG = '#0A0C14'
const CARD = '#0D1117'
const CARD_ALT = '#111827'
const BORDER = '#1E293B'
const BORDER_ALT = '#1F2937'
const TEXT = '#F9FAFB'
const MUTED = '#9CA3AF'

const PILLS = [
  'Parent-funded',
  'FA-safeguarding native',
  'Per-child highlights',
  'Video + GPS + development',
  'U7–U16',
]

interface FeatureTile { icon: string; title: string; desc: string }
interface FeatureCluster { eyebrow: string; title: string; intro: string; tiles: FeatureTile[] }

const FEATURE_CLUSTERS: FeatureCluster[] = [
  {
    eyebrow: 'COACHING',
    title: 'Develop every player.',
    intro: 'The FA four-corner model, drill libraries, age-appropriate formations and a coaching toolkit a volunteer can actually use on a Tuesday evening.',
    tiles: [
      { icon: '🎯', title: 'Tactics, Training & Set Pieces', desc: 'Age-appropriate formats — 5v5 through 11v11 — with a drill library organised by phase and a small library of set-piece routines that suit U10+.' },
      { icon: '📈', title: 'Player Development Tracker', desc: 'FA four-corner: technical, physical, social, psychological. Termly reviews authored by coaches, signed off by the Academy Lead, surfaced to parents in plain English.' },
      { icon: '🎽', title: 'Coach Toolkit', desc: 'FIFA-style player cards reading the same four-corner data, drag-and-drop selection, drill library by phase, age-band-aware session brief.' },
      { icon: '📹', title: 'Video & Analysis', desc: 'Coach-side tool: training footage, opposition scouting, tactical-moment clips with annotations. Separate from the parent-facing Match Video.' },
      { icon: '📊', title: 'GPS, Performance & Heatmaps', desc: 'Junior-conservative load tracking — distance, sprints, top speed, time in high-intensity zones. Growth-spurt monitor flags before adult-style thresholds even come up.' },
      { icon: '🤖', title: 'AI Performance Brief', desc: 'Half-time, full-time and training briefs in plain English. Built for a volunteer touchline coach, not a sports scientist.' },
    ],
  },
  {
    eyebrow: 'MATCHDAY',
    title: 'Run your match day.',
    intro: 'The Saturday-morning machinery — kit, equipment, ref bookings, lifts to the away pitch — visible at a glance so nobody is the only person who knows what is happening.',
    tiles: [
      { icon: '🎟️', title: 'Matchday Operations', desc: 'Per-fixture kit / equipment / ops checklist with the responsible parent named on every line. Saturday-morning machine that nobody forgets.' },
      { icon: '🟨', title: 'Referees · the whole problem', desc: 'Booking, regional pool, develop your own, protect the referee. Under-18 ref duty-of-care built in. Built for the actual referee shortage, not around it.' },
      { icon: '🚗', title: 'Travel & Car-Share', desc: 'Per away fixture — drivers, seats, pickup point, who needs a lift. The five-minute version of the group chat that takes thirty.' },
      { icon: '📅', title: 'Fixtures & Results', desc: 'Pluggable feed — FA Full-Time, the league website, or coach manual entry. League table, results, the U11 division position. All without leaving Lumio.' },
    ],
  },
  {
    eyebrow: 'CLUB',
    title: 'Hold the club together.',
    intro: 'The volunteer web is the club. Make every job visible, run the committee on a single screen, see the money in plain English, and never lose track of the people doing the unpaid work.',
    tiles: [
      { icon: '🤝', title: 'Volunteer Roles', desc: 'A real U11 team runs on twelve volunteer jobs. We make the web visible — who holds each role, which are gaps, and a per-fixture rota for this weekend.' },
      { icon: '📜', title: 'Committee Suite', desc: 'The chair\'s monthly meeting view — club health, open actions, light club-level finance, the role map, a safeguarding line. Not a boardroom, a parents\' committee.' },
      { icon: '💰', title: 'Fundraising, Tournaments & Tours', desc: 'Active campaigns with progress bars, a six-fundraiser playbook other junior clubs have made work, regional summer tournaments, end-of-season tour bookings.' },
      { icon: '📇', title: 'Club Profile & Facilities', desc: 'Badge + identity + history + honours + sponsors. Plus the pitch-access picture — council bookings, the 3G slot, the equipment-store inventory.' },
      { icon: '📊', title: 'Insights', desc: 'A 60-second weekend health-check. Squad sizes, attendance, consent coverage, volunteer gaps. Chair-scoped — the screen a committee opens before its monthly meeting.' },
      { icon: '🛡️', title: 'Safeguarding & Consent Hub', desc: 'FA Charter Standard compliance flagship. Per-child consent, DBS register, incident log, restricted-child imagery exclusion enforced from the database upward.' },
    ],
  },
  {
    eyebrow: 'PARENTS',
    title: 'Keep parents close.',
    intro: 'The parent is the customer. Lumio Junior is built so a parent\'s relationship with the club deepens every Sunday afternoon — without the club doing any extra work.',
    tiles: [
      { icon: '👨‍👧', title: 'Parent App', desc: 'Sunday afternoon, kettle on, your child\'s morning is waiting. Highlights, GPS headline, coach note, minutes played and position — in plain English. The flagship.' },
      { icon: '🎬', title: 'Match Video & Highlights', desc: 'Full-match library for coaches; per-child auto-clipped highlight reel for parents. Clips filtered by player and consent — your child\'s reel, never the rest of the squad\'s.' },
      { icon: '🤖', title: 'AI Match Recap', desc: 'A 60-second plain-English brief for the school run. Half-time / full-time / training variants for coaches, parent-view variant for the family.' },
      { icon: '📨', title: 'In-app messaging', desc: 'Send Message composer — who, how, the message itself, preview. In-app push the primary channel, optional email/SMS fallback. Safeguarding-aware by design.' },
    ],
  },
]

interface RoleCard { name: string; desc: string }

const TIERS: RoleCard[] = [
  {
    name: 'Volunteer Chair / Committee',
    desc: 'The club picture in one place — health, money, volunteers, safeguarding. Insights, Committee Suite, Revenue & Funding, and Club Profile. Built for the parents\' committee that actually runs the club.',
  },
  {
    name: 'Lead Coach / Team Manager',
    desc: 'Sessions, selection, matchday, ref bookings, travel. Coach Toolkit, Tactics, Player Development Tracker, Matchday Operations, Referees, Travel & Car-Share. Everything Saturday needs in one place.',
  },
  {
    name: 'Parent / Guardian',
    desc: 'A front-row seat for your child\'s Sunday morning. Highlights, GPS, coach note, four-corner development view — and per-child consent management you control. Lumio Junior\'s paying customer.',
  },
]

interface PricingTier { name: string; price: string; priceSub?: string; features: string[]; highlight?: boolean }

const CLUB_PRICING: PricingTier[] = [
  {
    name: 'Junior Club — Starter',
    price: 'Free',
    priceSub: 'up to 3 teams',
    features: [
      'Safeguarding & Consent Hub',
      'Fixtures & Results — pluggable FA Full-Time / league / manual',
      'Squad lists & registration',
      'Volunteer Roles — the web of jobs that runs your team',
      'Matchday Operations checklist',
      'Club Profile',
      'FA Charter Standard evidence pack',
    ],
  },
  {
    name: 'Junior Club — Pro',
    price: '£49',
    priceSub: '/month',
    highlight: true,
    features: [
      'Everything in Starter',
      'Unlimited teams across all age bands',
      'Coach Toolkit — sessions, drills, FIFA-style player cards',
      'Tactics, Training & Set Pieces — age-appropriate formations + drills',
      'Match Video library — auto-clipped per-child highlights',
      'Video & Analysis — coach-side tactical breakdowns',
      'Player Development Tracker (FA four-corner)',
      'GPS, Performance & Heatmaps — junior-conservative',
      'Referees — booking, regional pool, develop, protect',
      'Tournaments, Travel & Car-Share, Tours & Camps, Fundraising',
    ],
  },
  {
    name: 'Junior Academy',
    price: '£149',
    priceSub: '/month',
    features: [
      'Everything in Pro',
      'Academy Lead role with termly review sign-off',
      'Cross-age-band development pathway view',
      'AI Match Recap + AI Performance Brief',
      'Committee Suite + Insights — chair\'s club-health view',
      'Revenue & Funding dashboard with parent-app revenue share',
      'Dedicated onboarding + priority support',
    ],
  },
]

const PARENT_TIER = {
  name: 'Parent App',
  price: '£8.99',
  priceSub: '/month per child',
  features: [
    'Per-child match recap, every Sunday',
    'Your own child\'s highlight reel + GPS',
    'Season timeline and keepsake archive',
    'Fixtures, RSVPs, fees in one place',
  ],
}

// ── Shared mockup chrome ────────────────────────────────────────────────────

function MockupFrame({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: CARD_ALT, border: `1px solid ${BORDER_ALT}`, borderRadius: 12, overflow: 'hidden', boxShadow: `0 30px 80px rgba(22,163,74,0.25)` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: `1px solid ${BORDER_ALT}`, backgroundColor: '#0B130C' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#EF4444' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#F59E0B' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#10B981' }} />
        </div>
        <div style={{ flex: 1, height: 18, borderRadius: 5, backgroundColor: '#0A0B10', border: `1px solid ${BORDER_ALT}` }} />
      </div>
      <div style={{ padding: 18 }}>{children}</div>
    </div>
  )
}

function MiniKPI({ value, label, sub, color }: { value: string; label: string; sub?: string; color: string }) {
  return (
    <div style={{ backgroundColor: '#0A0B10', border: `1px solid ${color}55`, borderRadius: 10, padding: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 900, color }}>{value}</div>
      <div style={{ fontSize: 9, fontWeight: 700, color: TEXT, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      {sub && <div style={{ fontSize: 9, color: MUTED, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

// ── Parent App flagship mockup ──────────────────────────────────────────────
// The richest visual on the page — child match-recap card + stat row + small
// heatmap SVG + AI recap snippet. This is the flagship the Parent App
// flagship section displays.

function JuniorParentAppMockup() {
  return (
    <MockupFrame>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: TEXT }}>👨‍👧 Jack&rsquo;s Sunday recap</div>
        <span style={{ fontSize: 8, fontWeight: 900, padding: '2px 7px', borderRadius: 999, backgroundColor: 'rgba(34,197,94,0.18)', color: GREEN_LIGHT, border: `1px solid ${GREEN}55`, letterSpacing: '0.06em' }}>WIN 3 – 1</span>
      </div>
      <div style={{ fontSize: 9, color: MUTED, marginBottom: 12 }}>U11 Lions vs Harfield Juniors · Sat 24 May · Pitch 2</div>

      {/* Stat row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 12 }}>
        <MiniKPI value="68 min" label="Played" sub="of 70" color={GREEN_LIGHT} />
        <MiniKPI value="1" label="Goal" sub="+ 1 assist" color={GOLD} />
        <MiniKPI value="3.2 km" label="Distance" sub="GPS" color="#3B82F6" />
        <MiniKPI value="19.4 km/h" label="Top speed" color={GREEN_LIGHT} />
      </div>

      {/* Heatmap — child-sized junior pitch with movement blobs */}
      <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Position heatmap</div>
      <svg viewBox="0 0 320 170" style={{ width: '100%', borderRadius: 8, marginBottom: 12, border: `1px solid ${BORDER_ALT}` }}>
        <rect x={0} y={0} width={320} height={170} fill="#1a3d1a" />
        <rect x={6} y={6} width={308} height={158} fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" />
        <line x1={160} y1={6} x2={160} y2={164} stroke="rgba(255,255,255,0.55)" strokeWidth="1" />
        <circle cx={160} cy={85} r={22} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1" />
        <circle cx={160} cy={85} r={2} fill="rgba(255,255,255,0.6)" />
        <rect x={6} y={45} width={38} height={80} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1" />
        <rect x={276} y={45} width={38} height={80} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1" />
        {/* CM heatmap pattern — Jack covering the centre of the pitch */}
        <circle cx={130} cy={75} r={14} fill={GREEN_LIGHT} opacity="0.45" style={{ filter: 'blur(7px)' }} />
        <circle cx={155} cy={85} r={20} fill={GREEN_LIGHT} opacity="0.6" style={{ filter: 'blur(7px)' }} />
        <circle cx={175} cy={95} r={16} fill={GREEN_LIGHT} opacity="0.5" style={{ filter: 'blur(7px)' }} />
        <circle cx={195} cy={70} r={12} fill={GREEN_LIGHT} opacity="0.4" style={{ filter: 'blur(7px)' }} />
        <circle cx={210} cy={110} r={10} fill={GREEN_LIGHT} opacity="0.35" style={{ filter: 'blur(7px)' }} />
        <circle cx={100} cy={95} r={10} fill={GREEN_LIGHT} opacity="0.3" style={{ filter: 'blur(7px)' }} />
        {/* Goal-scoring spot — gold blob in the box */}
        <circle cx={240} cy={85} r={11} fill={GOLD} opacity="0.55" style={{ filter: 'blur(5px)' }} />
        <circle cx={240} cy={85} r={3} fill={GOLD} />
        <text x={246} y={75} fontSize="8" fontWeight="700" fill={GOLD}>⚽ goal</text>
      </svg>

      {/* AI Match Recap snippet */}
      <div style={{ backgroundColor: 'rgba(241,196,15,0.08)', border: `1px solid ${GOLD}55`, borderLeft: `3px solid ${GOLD}`, borderRadius: 8, padding: 10, marginBottom: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: GOLD, marginBottom: 4, letterSpacing: '0.05em' }}>🤖 AI MATCH RECAP · 60-SECOND LISTEN</div>
        <div style={{ fontSize: 10, color: TEXT, lineHeight: 1.55 }}>
          Big morning for Jack. He scored from a cut-back in the 32nd minute, set up the third with a switch to the wing, and played 68 of 70. Coach noted scanning was consistent — &ldquo;Jack&rsquo;s looking over both shoulders before every pass.&rdquo; Growth-aware load: under cap.
        </div>
      </div>

      {/* Coach note row */}
      <div style={{ fontSize: 9, color: MUTED, marginBottom: 10 }}>
        <span style={{ color: TEXT, fontWeight: 700 }}>Coach&rsquo;s note:</span>{' '}
        &ldquo;Captain-for-a-week next Saturday. Player-voted MOTM today.&rdquo; — M. Hutchings
      </div>

      <button style={{ width: '100%', fontSize: 10, fontWeight: 800, padding: '8px 12px', borderRadius: 8, backgroundColor: GREEN_DARK, color: GOLD, border: 'none' }}>🎬 Open the highlight reel</button>
    </MockupFrame>
  )
}

// ── Spotlight mockups ───────────────────────────────────────────────────────

function JuniorRefereeMockup() {
  return (
    <MockupFrame>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: TEXT }}>🟨 Saturday refs · 24 May</div>
        <span style={{ fontSize: 8, fontWeight: 900, padding: '2px 7px', borderRadius: 999, backgroundColor: 'rgba(245,158,11,0.18)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.5)', letterSpacing: '0.06em' }}>1 GAP</span>
      </div>
      <div style={{ fontSize: 9, color: MUTED, marginBottom: 12 }}>3 fixtures · 1 unbooked · 2 with cash sorted</div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: TEXT }}>U11 Lions vs Harfield Juniors</div>
            <div style={{ fontSize: 9, color: MUTED }}>09:30 H · Graham Foster · Level 6</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end' }}>
            <span style={{ fontSize: 8, fontWeight: 800, padding: '2px 7px', borderRadius: 999, backgroundColor: 'rgba(34,197,94,0.18)', color: GREEN_LIGHT }}>Confirmed</span>
            <span style={{ fontSize: 8, fontWeight: 800, padding: '2px 7px', borderRadius: 999, backgroundColor: 'rgba(34,197,94,0.18)', color: GREEN_LIGHT }}>Cash ✓ · M. Hutchings</span>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 10, paddingTop: 8, borderTop: `1px solid ${BORDER_ALT}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: TEXT }}>U14 Eagles vs Ridgefield Athletic</div>
            <div style={{ fontSize: 9, color: '#EF4444', fontWeight: 700 }}>13:00 H · No referee assigned</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end' }}>
            <span style={{ fontSize: 8, fontWeight: 800, padding: '2px 7px', borderRadius: 999, backgroundColor: 'rgba(239,68,68,0.18)', color: '#EF4444' }}>Unbooked</span>
            <span style={{ fontSize: 8, fontWeight: 800, padding: '2px 7px', borderRadius: 999, backgroundColor: 'rgba(239,68,68,0.18)', color: '#EF4444' }}>Cash ✗ — who&rsquo;s bringing it?</span>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 12, paddingTop: 8, borderTop: `1px solid ${BORDER_ALT}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: TEXT }}>U9 Tigers · 5-team festival</div>
            <div style={{ fontSize: 9, color: MUTED }}>Sun 10:00 A · Toby L. · Trainee Youth</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end' }}>
            <span style={{ fontSize: 8, fontWeight: 800, padding: '2px 7px', borderRadius: 999, backgroundColor: 'rgba(245,158,11,0.18)', color: '#F59E0B' }}>Pending</span>
            <span style={{ fontSize: 8, fontWeight: 800, padding: '2px 7px', borderRadius: 999, backgroundColor: 'rgba(239,68,68,0.18)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.5)' }}>⚠️ Under-18 · duty of care</span>
          </div>
        </div>
      </div>

      <button style={{ width: '100%', fontSize: 10, fontWeight: 800, padding: '8px 12px', borderRadius: 8, backgroundColor: GREEN_DARK, color: GOLD, border: 'none' }}>🌍 Open the regional pool</button>
    </MockupFrame>
  )
}

function JuniorVolunteerMockup() {
  return (
    <MockupFrame>
      <div style={{ fontSize: 11, fontWeight: 800, color: TEXT, marginBottom: 2 }}>🤝 U11 Lions · volunteer roles</div>
      <div style={{ fontSize: 9, color: MUTED, marginBottom: 12 }}>11 of 12 roles filled · 1 open</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[
          { role: 'Lead Coach',           name: 'Mark Hutchings',     open: false },
          { role: 'Team Manager',         name: 'Greta Yardley',      open: false },
          { role: 'Welfare Officer',      name: 'Jenna Holroyd',      open: false },
          { role: 'Treasurer',            name: 'Jo Sefer',           open: false },
          { role: 'Statistician',         name: null,                  open: true },
          { role: 'Kit Organiser',        name: 'Lou Carter',         open: false },
          { role: 'Net / Pitch team',     name: 'Rotation (3 dads)',  open: false },
          { role: 'Tournament Organiser', name: 'Greta Yardley',      open: false },
        ].map(r => (
          <div key={r.role} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', borderRadius: 6, backgroundColor: r.open ? 'rgba(239,68,68,0.08)' : '#0A0B10', border: `1px solid ${r.open ? 'rgba(239,68,68,0.5)' : BORDER_ALT}` }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: TEXT }}>{r.role}</div>
              <div style={{ fontSize: 9, color: r.open ? '#EF4444' : MUTED, fontStyle: r.open ? 'italic' : 'normal' }}>{r.name ?? 'Open — message the parent group'}</div>
            </div>
            {r.open ? (
              <span style={{ fontSize: 8, fontWeight: 800, padding: '2px 7px', borderRadius: 999, backgroundColor: 'rgba(239,68,68,0.18)', color: '#EF4444' }}>Gap</span>
            ) : (
              <span style={{ fontSize: 8, color: GREEN_LIGHT }}>✓</span>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12, padding: 8, borderRadius: 8, backgroundColor: 'rgba(241,196,15,0.08)', border: `1px solid ${GOLD}55` }}>
        <div style={{ fontSize: 9, color: TEXT, lineHeight: 1.5 }}>
          <span style={{ color: GOLD, fontWeight: 800 }}>This Saturday rota</span> · Refs: P. Connolly · Nets: Sefer + Brindle + Pereira · First aid: M. Hutchings (FA L1).
        </div>
      </div>

      <button style={{ width: '100%', fontSize: 10, fontWeight: 800, padding: '8px 12px', borderRadius: 8, backgroundColor: GREEN_DARK, color: GOLD, border: 'none', marginTop: 10 }}>📣 Post the open role to parents</button>
    </MockupFrame>
  )
}

function JuniorSafeguardingMockup() {
  return (
    <MockupFrame>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: TEXT }}>🛡️ Safeguarding · Oakridge Juniors</div>
        <span style={{ fontSize: 8, fontWeight: 900, padding: '2px 7px', borderRadius: 999, backgroundColor: 'rgba(34,197,94,0.18)', color: GREEN_LIGHT, border: `1px solid ${GREEN}55`, letterSpacing: '0.06em' }}>✓ COMPLIANT</span>
      </div>
      <div style={{ fontSize: 9, color: MUTED, marginBottom: 12 }}>128 players · welfare officer Jenna Holroyd in post</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 12 }}>
        <MiniKPI value="18 / 18" label="DBS register" sub="All current" color={GREEN_LIGHT} />
        <MiniKPI value="127 / 128" label="Photo consent" sub="1 opt-out" color={GREEN_LIGHT} />
        <MiniKPI value="125 / 128" label="Filming consent" sub="3 opt-out" color="#F59E0B" />
        <MiniKPI value="128 / 128" label="Medical consent" color={GREEN_LIGHT} />
      </div>

      <div style={{ padding: 10, borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.5)', marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: '#EF4444', marginBottom: 2 }}>⚠ 1 restricted child on register</div>
        <div style={{ fontSize: 9, color: TEXT, lineHeight: 1.5 }}>
          Court-order liaison in place · imagery exclusion enforced across all surfaces (Match Video, Highlights, team photos, livestream). Welfare-only notes in sidecar table.
        </div>
      </div>

      <div style={{ padding: 10, borderRadius: 8, backgroundColor: 'rgba(34,197,94,0.08)', border: `1px solid ${GREEN}55`, marginBottom: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: GREEN_LIGHT, marginBottom: 4, letterSpacing: '0.05em' }}>🟨 UNDER-18 REFEREES IN SCOPE</div>
        <div style={{ fontSize: 9, color: TEXT, lineHeight: 1.5 }}>
          Trainee youth referees treated under the same duty of care. No phone numbers exposed. First name + initial only across the portal. Abuse reports route to the welfare officer.
        </div>
      </div>

      <button style={{ width: '100%', fontSize: 10, fontWeight: 800, padding: '8px 12px', borderRadius: 8, backgroundColor: GREEN_DARK, color: GOLD, border: 'none' }}>Open consent records →</button>
    </MockupFrame>
  )
}

// ── Spotlight section component ─────────────────────────────────────────────

function Spotlight({ eyebrow, title, body, bullets, mockup, reverse, altBg }: {
  eyebrow: string; title: string; body: string; bullets: string[]; mockup: React.ReactNode; reverse?: boolean; altBg?: boolean
}) {
  return (
    <section style={{ padding: '96px 24px', backgroundColor: altBg ? ALT_BG : BG }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
        <div style={{ order: reverse ? 2 : 1 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: GOLD, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>{eyebrow}</div>
          <h2 style={{ fontSize: 40, fontWeight: 900, color: TEXT, marginBottom: 16, lineHeight: 1.1 }}>{title}</h2>
          <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.6, marginBottom: 24 }}>{body}</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {bullets.map(b => (
              <li key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 15, color: TEXT }}>
                <span style={{ color: GOLD, fontWeight: 900, flexShrink: 0 }}>✓</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
        <div style={{ order: reverse ? 1 : 2 }}>{mockup}</div>
      </div>
    </section>
  )
}

// ── PARENT APP — flagship section (bigger than a Spotlight) ─────────────────

function ParentAppFlagshipSection() {
  return (
    <section style={{ padding: '128px 24px', position: 'relative', overflow: 'hidden', backgroundColor: BG }}>
      <div
        style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(circle at 75% 30%, ${GREEN}33, transparent 55%), radial-gradient(circle at 15% 80%, ${GREEN_DARK}55, transparent 55%)`,
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative', maxWidth: 1300, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 72, alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: GOLD, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>
            FLAGSHIP · PARENT APP
          </div>
          <h2 style={{ fontSize: 'clamp(40px, 5vw, 60px)', fontWeight: 900, color: TEXT, marginBottom: 24, lineHeight: 1.05 }}>
            See your child&rsquo;s Sunday morning.
          </h2>
          <p style={{ fontSize: 18, color: MUTED, lineHeight: 1.65, marginBottom: 28 }}>
            Sunday afternoon, kettle on. Your child played at 09:30 — their highlights, their stats, their heatmap, their coach&rsquo;s note. A 60-second AI brief you can listen to on the school run. The relationship a parent wants with their child&rsquo;s club, in one screen.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              'Per-child auto-clipped highlight reel — consent-gated, your child only',
              'GPS headline + heatmap — distance, sprints, top speed, where they played',
              'AI Match Recap in plain English — 60-second listen, kettle-on length',
              'Coach\'s note, minutes played, position, and any milestone awarded',
              'Termly four-corner development view + milestone badges over the season',
            ].map(b => (
              <li key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 16, color: TEXT }}>
                <span style={{ color: GOLD, fontWeight: 900, flexShrink: 0 }}>✓</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <Link
              href="/junior/oakridge-juniors"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '16px 28px', borderRadius: 12, backgroundColor: GREEN,
                color: '#000', fontSize: 15, fontWeight: 800, textDecoration: 'none',
                boxShadow: `0 20px 50px ${GREEN}55`,
              }}
            >
              Try the parent view →
            </Link>
            <div style={{ display: 'inline-flex', alignItems: 'center', padding: '16px 18px', borderRadius: 12, backgroundColor: 'rgba(241,196,15,0.10)', border: `1px solid ${GOLD}55`, color: GOLD, fontSize: 13, fontWeight: 700 }}>
              £8.99 / month · per child
            </div>
          </div>
        </div>
        <div>
          <JuniorParentAppMockup />
        </div>
      </div>
    </section>
  )
}

// ── PAGE EXPORT ─────────────────────────────────────────────────────────────

export default function FootballJuniorPage() {
  return (
    <div style={{ backgroundColor: BG, color: TEXT, minHeight: '100vh' }}>
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{ padding: '128px 24px 64px', position: 'relative', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at 20% 10%, ${GREEN}33, transparent 50%), radial-gradient(circle at 80% 60%, ${GREEN_DARK}55, transparent 55%)`,
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative', maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: '0.2em',
              color: GOLD,
              textTransform: 'uppercase',
              marginBottom: 24,
            }}
          >
            LUMIO FOOTBALL · JUNIOR
          </div>
          <h1
            style={{
              fontSize: 'clamp(44px, 7vw, 76px)',
              fontWeight: 900,
              lineHeight: 1.05,
              color: TEXT,
              marginBottom: 24,
              maxWidth: 980,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Give every parent a front-row seat.
          </h1>
          <p
            style={{
              fontSize: 19,
              color: MUTED,
              lineHeight: 1.6,
              maxWidth: 820,
              margin: '0 auto 40px',
            }}
          >
            Log in on a Sunday afternoon and watch your child&apos;s highlights from that morning&apos;s match — their stats, their heatmap, their season. Junior football&apos;s first platform built for the club, the coach and the parent.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
            <Link
              href="/sports-signup?sport=junior"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '18px 32px',
                borderRadius: 12,
                backgroundColor: GREEN,
                color: '#000',
                fontSize: 16,
                fontWeight: 800,
                textDecoration: 'none',
                boxShadow: `0 20px 50px ${GREEN}55`,
              }}
            >
              Apply for founding access →
            </Link>
            <Link
              href="/junior/oakridge-juniors"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '18px 32px',
                borderRadius: 12,
                backgroundColor: 'transparent',
                color: TEXT,
                fontSize: 16,
                fontWeight: 800,
                textDecoration: 'none',
                border: `1px solid ${BORDER}`,
              }}
            >
              Try the demo
            </Link>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {PILLS.map(p => (
              <span
                key={p}
                style={{
                  padding: '10px 18px',
                  borderRadius: 999,
                  backgroundColor: 'rgba(22,163,74,0.18)',
                  border: `1px solid ${GREEN}55`,
                  color: GOLD,
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Parent App flagship ──────────────────────────────────────────── */}
      <ParentAppFlagshipSection />

      {/* ─── Spotlight · Referees ─────────────────────────────────────────── */}
      <Spotlight
        altBg
        eyebrow="SPOTLIGHT · REFEREES"
        title="Getting a referee shouldn't take twenty phone calls."
        body="Grassroots is losing referees fast — abuse drives it, and the youngest (14–17, who are minors) quit first. The Referees module addresses the whole problem: booking + the regional pool + developing your own + protecting the referee on Saturday. One module, four tabs, the actual referee picture."
        bullets={[
          'Per-fixture booking with cash-sorted indicator and a Saturday-not-yet-covered alert',
          'Regional referee pool — discoverable across clubs, not limited to your phonebook',
          'Develop your own — FA Referee Course pathway for club teenagers (age 14+)',
          'Protect the Referee — abuse-reporting, post-match experience log, under-18 duty of care',
        ]}
        mockup={<JuniorRefereeMockup />}
      />

      {/* ─── Spotlight · Volunteer Roles ──────────────────────────────────── */}
      <Spotlight
        reverse
        eyebrow="SPOTLIGHT · VOLUNTEER ROLES"
        title="A junior team runs on eleven volunteers."
        body="Lead coach, assistant, team manager, welfare officer, fixtures secretary, treasurer, statistician, kit organiser, net team, tournament organiser, presentation organiser. Twelve jobs to run one U11 team. Volunteer Roles makes the web visible — who holds each, which are gaps — and a per-fixture rota for this weekend so nobody is left wondering."
        bullets={[
          'Per-team list of every volunteer role with the parent who holds it',
          'Visible gaps highlighted in red — recruit before Saturday, not after',
          'Per-fixture rota — refs, nets, first aid, photography opt-outs',
          'Club-wide gap list rolling up across every age band',
        ]}
        mockup={<JuniorVolunteerMockup />}
      />

      {/* ─── Grouped features ─────────────────────────────────────────────── */}
      <section style={{ padding: '96px 24px', backgroundColor: ALT_BG }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 44, fontWeight: 900, color: TEXT, textAlign: 'center', marginBottom: 16, lineHeight: 1.1 }}>
            Built for the volunteers who run junior football.
          </h2>
          <p style={{ fontSize: 16, color: MUTED, textAlign: 'center', marginBottom: 56, maxWidth: 760, marginLeft: 'auto', marginRight: 'auto' }}>
            Thirty-plus modules grouped four ways — coaching, matchday, the club itself, and keeping parents close. Every one demo-visible at <span style={{ color: TEXT }}>/junior/oakridge-juniors</span>.
          </p>

          {FEATURE_CLUSTERS.map((cluster, i) => (
            <div key={cluster.title} style={{ marginBottom: i === FEATURE_CLUSTERS.length - 1 ? 0 : 56 }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: GOLD, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
                  {cluster.eyebrow}
                </div>
                <h3 style={{ fontSize: 28, fontWeight: 900, color: TEXT, marginBottom: 8, lineHeight: 1.15 }}>{cluster.title}</h3>
                <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.55, maxWidth: 800 }}>{cluster.intro}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                {cluster.tiles.map(f => (
                  <div key={f.title} style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
                    <h4 style={{ fontSize: 18, fontWeight: 800, color: TEXT, marginBottom: 8 }}>{f.title}</h4>
                    <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6 }}>{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Spotlight · Safeguarding ─────────────────────────────────────── */}
      <Spotlight
        eyebrow="SPOTLIGHT · SAFEGUARDING & CONSENT"
        title="Built first, not bolted on."
        body="Lumio Junior is a children's product. Safeguarding sits below every feature, not next to one. Per-child consent records, a DBS register, an incident log, restricted-child imagery exclusion enforced from the database upward — and the duty of care extends to under-18 referees too. FA Charter Standard compliance falls out of the design."
        bullets={[
          'Per-child photography / filming / data-sharing consent — with renewal alerts',
          'DBS register with expiry tracking; coaches without current DBS blocked from coaching',
          'Restricted-child handling: imagery auto-excluded across Match Video, Highlights, photos',
          'Incident log with welfare-officer audit trail and committee-meeting summary',
          'Under-18 referee duty-of-care enforced uniformly across the portal',
        ]}
        mockup={<JuniorSafeguardingMockup />}
      />

      {/* ─── Who it's for ─────────────────────────────────────────────────── */}
      <section style={{ padding: '96px 24px', backgroundColor: ALT_BG }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 40, fontWeight: 900, color: TEXT, textAlign: 'center', marginBottom: 16, lineHeight: 1.1 }}>
            Who it&rsquo;s for.
          </h2>
          <p style={{ fontSize: 16, color: MUTED, textAlign: 'center', marginBottom: 56, maxWidth: 760, marginLeft: 'auto', marginRight: 'auto' }}>
            Junior football has a wider role spectrum than the senior game. A volunteer chair, a lead coach, and a parent each need a different view of the same club — Lumio Junior gives them all three.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {TIERS.map(t => (
              <div key={t.name} style={{ backgroundColor: CARD, border: `1px solid ${GREEN}`, borderRadius: 16, padding: 32 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: GOLD, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>ROLE</div>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: TEXT, marginBottom: 12 }}>{t.name}</h3>
                <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6 }}>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Role tabs (shared SportRoleTabs) ──────────────────────────────── */}
      <SportRoleTabs
        sport="junior"
        demoHref="/junior/oakridge-juniors"
        accentColor={GREEN}
        accentColorDim={GREEN_DIM}
        roles={JUNIOR_ROLES}
      />

      {/* ─── Pricing ──────────────────────────────────────────────────────── */}
      {/* Junior has FOUR tiers: three club tiers + a parent-funded tier. The
          parent strip below the three club cards is the commercial
          differentiator — the platform is funded by parents, not billed to
          the club. */}
      <section style={{ padding: '96px 24px', backgroundColor: BG }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontSize: 40, fontWeight: 900, color: TEXT, textAlign: 'center', marginBottom: 16, lineHeight: 1.1 }}>
            Free for the club. Funded by the parents.
          </h2>
          <p style={{ fontSize: 16, color: MUTED, textAlign: 'center', marginBottom: 48 }}>
            Junior club tiers are optional upgrades for clubs that want the full toolkit. The flagship Parent App is billed per child to the parent — not to the club — so volunteer-run clubs pay nothing and parents get the experience they care about.
          </p>

          {/* Three club tiers — standard 3-column grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, marginBottom: 32 }}>
            {CLUB_PRICING.map(p => (
              <div
                key={p.name}
                style={{
                  backgroundColor: CARD,
                  border: p.highlight ? `2px solid ${GREEN}` : `1px solid ${BORDER}`,
                  borderRadius: 16,
                  padding: 26,
                  position: 'relative',
                }}
              >
                {p.highlight && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      padding: '4px 12px',
                      borderRadius: 999,
                      backgroundColor: GREEN,
                      color: '#000',
                      fontSize: 10,
                      fontWeight: 900,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Most popular
                  </div>
                )}
                <h3 style={{ fontSize: 18, fontWeight: 900, color: TEXT, marginBottom: 6 }}>{p.name}</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 18 }}>
                  <span style={{ fontSize: 26, fontWeight: 900, color: GOLD }}>{p.price}</span>
                  {p.priceSub && <span style={{ fontSize: 13, color: MUTED, fontWeight: 600 }}>{p.priceSub}</span>}
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {p.features.map(f => (
                    <li key={f} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#D1D5DB' }}>
                      <span style={{ color: GOLD, fontWeight: 900, flexShrink: 0 }}>✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Parent App strip — visually distinct, full-width, parent-funded tier */}
          <div
            style={{
              position: 'relative',
              borderRadius: 18,
              padding: 28,
              background: `linear-gradient(135deg, rgba(22,101,52,0.22) 0%, rgba(22,163,74,0.10) 60%, transparent 100%)`,
              border: `2px solid ${GREEN_LIGHT}`,
              boxShadow: `0 20px 50px rgba(22,163,74,0.18)`,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -12,
                left: 24,
                padding: '4px 12px',
                borderRadius: 999,
                backgroundColor: GREEN_LIGHT,
                color: '#0A0C14',
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Parent-funded · the commercial model
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)',
                gap: 28,
                alignItems: 'center',
              }}
            >
              <div>
                <h3 style={{ fontSize: 22, fontWeight: 900, color: TEXT, marginBottom: 6 }}>{PARENT_TIER.name}</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
                  <span style={{ fontSize: 30, fontWeight: 900, color: GOLD }}>{PARENT_TIER.price}</span>
                  <span style={{ fontSize: 14, color: MUTED, fontWeight: 600 }}>{PARENT_TIER.priceSub}</span>
                </div>
                <p style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.5, marginBottom: 0 }}>
                  The platform is funded by parents, not billed to the club. Volunteer-run clubs on the Starter tier give every parent the Parent App without paying a penny themselves — Lumio bills the parents who opt in, the club gets the toolkit at no cost.
                </p>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {PARENT_TIER.features.map(f => (
                  <li key={f} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#D1D5DB' }}>
                    <span style={{ color: GREEN_LIGHT, fontWeight: 900, flexShrink: 0 }}>✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Big CTA ──────────────────────────────────────────────────────── */}
      <section style={{ padding: '120px 24px', backgroundColor: ALT_BG, borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 44, fontWeight: 900, color: TEXT, marginBottom: 20, lineHeight: 1.1 }}>
            The platform youth football has been waiting for.
          </h2>
          <p style={{ fontSize: 17, color: MUTED, lineHeight: 1.6, marginBottom: 32 }}>
            Try the Oakridge Juniors FC live demo — a Charter Standard development club running a full season on Lumio Junior, including the U11 Lions and the canonical Parent App view. Or apply for founding access to bring your own club on.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/sports-signup?sport=junior"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '18px 32px',
                borderRadius: 12,
                backgroundColor: GREEN,
                color: '#000',
                fontSize: 16,
                fontWeight: 800,
                textDecoration: 'none',
                boxShadow: `0 20px 50px ${GREEN}55`,
              }}
            >
              Apply for founding access →
            </Link>
            <Link
              href="/junior/oakridge-juniors"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '18px 32px',
                borderRadius: 12,
                backgroundColor: 'transparent',
                color: TEXT,
                fontSize: 16,
                fontWeight: 800,
                textDecoration: 'none',
                border: `1px solid ${BORDER}`,
              }}
            >
              Try the demo →
            </Link>
          </div>
        </div>
      </section>

      <CrossDiscoveryStrip tier="junior" />
    </div>
  )
}
