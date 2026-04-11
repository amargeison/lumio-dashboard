'use client'

import Link from 'next/link'
import SportRoleTabs from '../components/SportRoleTabs'
import { TENNIS_ROLES } from '../components/sportRoles'

const PURPLE = '#7C3AED'
const PURPLE_LIGHT = '#A855F7'
const BG = '#07080F'
const CARD = '#0D1117'
const CARD_ALT = '#111827'
const BORDER = '#1E293B'
const BORDER_ALT = '#1F2937'
const TEXT = '#F9FAFB'
const MUTED = '#9CA3AF'

const STAT_PILLS = ['200+ features', 'ATP & WTA', 'AI powered', 'ElevenLabs voice', 'StatsBomb ready']

const FEATURES: Array<{ icon: string; title: string; desc: string }> = [
  { icon: '🏆', title: 'Rankings & Race Intelligence', desc: 'Live ATP/WTA ranking, Race to Turin standings, 24-month trajectory chart. Know exactly where you stand.' },
  { icon: '🎯', title: 'Match Prep & Opponent Scout', desc: 'H2H records, surface breakdowns, opponent weakness cards, tactical coach notes. Walk on court prepared.' },
  { icon: '🌅', title: 'AI Morning Briefing', desc: 'Role-specific daily briefings for player, coach, agent and physio. Voice-delivered via ElevenLabs before first session.' },
  { icon: '💰', title: 'Financial Dashboard', desc: 'Prize money ledger, endorsement tracker, expense log, multi-currency. Exportable for your accountant.' },
  { icon: '💛', title: 'Sponsorship Manager', desc: 'Every deal, every obligation, every deadline. Wilson, Rolex, Lululemon — all tracked automatically.' },
  { icon: '✈️', title: 'Travel & Logistics', desc: 'Event-by-event flight planning, hotel contacts, court access, team movement. 30+ weeks on tour, organised.' },
  { icon: '📊', title: 'Performance Stats & Rating', desc: 'Serve %, break point conversion, win rate trend. A composite performance rating updated after every match.' },
  { icon: '🔥', title: 'Court Shot Heatmaps', desc: 'Visual serve placement, return zones, groundstroke patterns. See exactly where you\u2019re winning and losing points.' },
  { icon: '🤝', title: 'Team Hub', desc: 'Coach, physio, agent, fitness trainer, stringer, mental performance coach. Role-specific feeds, one shared platform.' },
  { icon: '📅', title: 'Tournament Entry Manager', desc: 'Entry deadlines, withdrawal windows, late withdrawal fines. Never miss a deadline again.' },
  { icon: '🚀', title: 'Career Planning', desc: '1, 3, 5 and 10-year goal tracking with progress bars. Break Top 50. Win a Slam. Your roadmap, always visible.' },
  { icon: '🏛️', title: 'Accreditations & Licences', desc: 'ATP Tour Card, ITF registration, Grand Slam accreditations, LTA licence. All expiry dates in one place.' },
]

const INTEGRATIONS = [
  { icon: '🎾', name: 'ATP/WTA', desc: 'Ranking and points feed' },
  { icon: '📹', name: 'Swing Vision', desc: 'Shot tracking and video analysis' },
  { icon: '⚡', name: 'StatsBomb', desc: 'Match data and analytics' },
  { icon: '🎥', name: 'Wyscout', desc: 'Video and opponent database' },
  { icon: '✈️', name: 'Google Flights', desc: 'Travel search integration' },
  { icon: '🏨', name: 'Booking.com', desc: 'Hotel management' },
  { icon: '📊', name: 'Opta', desc: 'Live statistics feed' },
  { icon: '🎵', name: 'ElevenLabs', desc: 'Voice briefing delivery' },
  { icon: '💰', name: 'Xero', desc: 'Financial management' },
  { icon: '📧', name: 'Microsoft 365', desc: 'Email and calendar' },
  { icon: '🏛️', name: 'ITF', desc: 'Registration and accreditations' },
  { icon: '🤖', name: 'Claude AI', desc: 'Intelligence and briefings' },
  { icon: '🔔', name: 'Slack', desc: 'Team notifications' },
]

const TIERS = [
  { name: 'Challenger / Next Gen', desc: 'Rankings intelligence, match prep, entry management, financial tracking. Everything you need to crack the top 100.' },
  { name: 'ATP/WTA Tour', desc: 'Full team hub, AI briefings, sponsorship management, travel logistics. The complete professional toolkit.' },
  { name: 'Top 50', desc: 'Advanced analytics, career planning, federation management, tax-ready financials. Trusted by players at the highest level.' },
]

// ── Mockup chrome ───────────────────────────────────────────────────────────
function MockupFrame({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: CARD_ALT, border: `1px solid ${BORDER_ALT}`, borderRadius: 12, overflow: 'hidden', boxShadow: `0 30px 80px ${PURPLE}22` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: `1px solid ${BORDER_ALT}`, backgroundColor: '#0B1020' }}>
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

function Badge({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
  return (
    <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 999, color, backgroundColor: bg, border: `1px solid ${color}55`, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
      {children}
    </span>
  )
}

function KPI({ value, label, sub, color }: { value: string; label: string; sub?: string; color: string }) {
  return (
    <div style={{ backgroundColor: '#0A0B10', border: `1px solid ${color}55`, borderRadius: 10, padding: 12 }}>
      <div style={{ fontSize: 18, fontWeight: 900, color }}>{value}</div>
      <div style={{ fontSize: 9, fontWeight: 700, color: TEXT, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      {sub && <div style={{ fontSize: 9, color: MUTED, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

// ── Mockups ─────────────────────────────────────────────────────────────────
function DashboardMockup() {
  const surfaces = [
    { label: 'Clay', pct: 65, color: '#F97316' },
    { label: 'Hard', pct: 65, color: '#3B82F6' },
    { label: 'Grass', pct: 72, color: '#10B981' },
    { label: 'Indoor', pct: 60, color: PURPLE },
  ]
  return (
    <MockupFrame>
      <div style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_LIGHT})`, borderRadius: 10, padding: 10, marginBottom: 10, color: '#fff' }}>
        <div style={{ fontSize: 10, fontWeight: 900 }}>Today&apos;s match — vs Martinez, 13:00, Court 4</div>
        <div style={{ display: 'flex', gap: 10, fontSize: 8, marginTop: 4, opacity: 0.9 }}>
          <span>London 12:00</span><span>New York 07:00</span><span>Melbourne 21:00</span><span>Dubai 15:00</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
        {['Log Practice', 'Book Stringing', 'Log Injury', 'Add Sponsor Post', 'View Draw', 'Match Notes'].map(a => (
          <span key={a} style={{ fontSize: 8, padding: '4px 8px', borderRadius: 999, backgroundColor: 'rgba(124,58,237,0.15)', color: PURPLE_LIGHT, border: `1px solid ${PURPLE}55` }}>{a}</span>
        ))}
      </div>
      <div style={{ fontSize: 11, fontWeight: 800, color: TEXT, marginBottom: 8 }}>Good morning, Alex.</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
        <KPI value="#67" label="ATP" color={PURPLE} />
        <KPI value="#54" label="Race" color={PURPLE_LIGHT} />
        <KPI value="1,847" label="Points" color="#3B82F6" />
        <KPI value="#44" label="CH" color="#10B981" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 8 }}>
        <div style={{ backgroundColor: '#0A0B10', border: `1px solid ${BORDER_ALT}`, borderRadius: 10, padding: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: TEXT, marginBottom: 6 }}>Today&apos;s Match</div>
          <div style={{ fontSize: 10, color: TEXT }}>Alex Rivera <span style={{ color: MUTED }}>vs</span> C. Martinez</div>
          <div style={{ fontSize: 9, color: MUTED, marginTop: 2 }}>#67 ATP vs #34 ATP · Clay · 13:00 Court 4</div>
          <div style={{ fontSize: 9, color: '#10B981', marginTop: 6, fontWeight: 800 }}>H2H: 3-1 in your favour</div>
        </div>
        <div style={{ backgroundColor: '#0A0B10', border: `1px solid ${BORDER_ALT}`, borderRadius: 10, padding: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 12 }}>🇬🇧</span>
            <span style={{ fontSize: 9, fontWeight: 800, color: TEXT }}>Alex Rivera</span>
          </div>
          {surfaces.map(s => (
            <div key={s.label} style={{ marginTop: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: MUTED }}>
                <span>{s.label}</span><span style={{ color: s.color, fontWeight: 800 }}>{s.pct}%</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, backgroundColor: '#1F2937', marginTop: 2 }}>
                <div style={{ width: `${s.pct}%`, height: '100%', borderRadius: 2, backgroundColor: s.color }} />
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 3, marginTop: 8 }}>
            {['W', 'W', 'L', 'W', 'L'].map((r, i) => (
              <span key={i} style={{ fontSize: 8, fontWeight: 900, width: 14, height: 14, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: r === 'W' ? '#10B98122' : '#EF444422', color: r === 'W' ? '#10B981' : '#EF4444' }}>{r}</span>
            ))}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Badge color="#EF4444" bg="rgba(239,68,68,0.15)">LIVE · vs C. Martinez</Badge>
        <Badge color="#F59E0B" bg="rgba(245,158,11,0.15)">Rolex renewal 47d</Badge>
        <Badge color={PURPLE_LIGHT} bg="rgba(168,85,247,0.15)">Lululemon post due</Badge>
      </div>
    </MockupFrame>
  )
}

function BriefingMockup() {
  const roles = [
    { icon: '🎾', label: 'Player', time: '7:30am', active: true },
    { icon: '📋', label: 'Coach', time: '8:00am' },
    { icon: '💛', label: 'Agent', time: '8:30am' },
    { icon: '🏥', label: 'Physio', time: '8:00am' },
  ]
  return (
    <MockupFrame>
      <div style={{ fontSize: 11, fontWeight: 800, color: TEXT, marginBottom: 2 }}>🌅 AI Morning Briefing</div>
      <div style={{ fontSize: 9, color: MUTED, marginBottom: 10 }}>Voice-powered daily briefings — delivered before first session</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
        {roles.map(r => (
          <div key={r.label} style={{ backgroundColor: r.active ? 'rgba(124,58,237,0.2)' : '#0A0B10', border: `1px solid ${r.active ? PURPLE : BORDER_ALT}`, borderRadius: 8, padding: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 14 }}>{r.icon}</div>
            <div style={{ fontSize: 9, fontWeight: 800, color: r.active ? PURPLE_LIGHT : TEXT, marginTop: 2 }}>{r.label}</div>
            <div style={{ fontSize: 8, color: MUTED }}>{r.time}</div>
          </div>
        ))}
      </div>
      <div style={{ backgroundColor: '#0A0B10', border: `1px solid ${PURPLE}55`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: TEXT }}>Today&apos;s briefing — Player</span>
          <button style={{ fontSize: 9, fontWeight: 800, padding: '5px 10px', borderRadius: 6, backgroundColor: PURPLE, color: '#fff', border: 'none' }}>▶ Play Briefing</button>
        </div>
        <p style={{ fontSize: 9, color: MUTED, lineHeight: 1.6, margin: 0 }}>
          &ldquo;Good morning, Alex. You&apos;re ranked 67th in the ATP rankings, up two places this week. Your serve percentage on clay is 61% over the last 10 matches — 4 points below your season average. Martinez has a strong backhand return but struggles against kick serves out wide...&rdquo;
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
        <KPI value="2m 14s" label="Briefing Time" color={PURPLE} />
        <KPI value="Rachel" label="Voice" sub="ElevenLabs TTS" color={PURPLE_LIGHT} />
        <KPI value="07:30" label="Delivery" sub="Auto-send daily" color="#3B82F6" />
      </div>
    </MockupFrame>
  )
}

function RankingsMockup() {
  const defendCal = [
    ['Apr', 90, false], ['May', 0, false], ['Jun', 45, false], ['Jul', 180, true],
    ['Aug', 0, false], ['Sep', 45, false], ['Oct', 250, true], ['Nov', 0, false],
    ['Dec', 0, false], ['Jan', 0, false], ['Feb', 90, false], ['Mar', 45, false],
  ] as const
  return (
    <MockupFrame>
      <div style={{ fontSize: 11, fontWeight: 800, color: TEXT, marginBottom: 2 }}>Ranking Points Forecaster</div>
      <div style={{ fontSize: 9, color: MUTED, marginBottom: 10 }}>Madrid Open — Masters 1000 · Clay</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 10 }}>
        <KPI value="#67" label="Current" color={PURPLE} />
        <KPI value="#18" label="Race to Turin" color={PURPLE_LIGHT} />
        <KPI value="90 pts" label="Defending" sub="Madrid QF last year" color="#F59E0B" />
      </div>
      <div style={{ fontSize: 10, fontWeight: 800, color: TEXT, marginBottom: 6 }}>If Alex reaches...</div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
        {['R32', 'R16', 'QF', 'SF', 'Final', 'Winner'].map(r => {
          const active = r === 'R16'
          return (
            <span key={r} style={{ fontSize: 9, fontWeight: 800, padding: '5px 10px', borderRadius: 999, backgroundColor: active ? PURPLE : '#0A0B10', color: active ? '#fff' : MUTED, border: `1px solid ${active ? PURPLE : BORDER_ALT}` }}>{r}</span>
          )
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 }}>
        <div style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.45)', borderRadius: 10, padding: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#10B981' }}>45 pts</div>
          <div style={{ fontSize: 8, color: MUTED }}>earned</div>
        </div>
        <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.45)', borderRadius: 10, padding: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#EF4444' }}>#112</div>
          <div style={{ fontSize: 8, color: MUTED }}>↓45 places</div>
        </div>
        <div style={{ backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.45)', borderRadius: 10, padding: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#F59E0B' }}>-45</div>
          <div style={{ fontSize: 8, color: MUTED }}>Net (90 expiring)</div>
        </div>
      </div>
      <div style={{ fontSize: 10, fontWeight: 800, color: TEXT, marginBottom: 6 }}>Points to Defend — next 12 months</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3 }}>
        {defendCal.map(([m, p, hot]) => (
          <div key={m as string} style={{ backgroundColor: hot ? 'rgba(239,68,68,0.18)' : '#0A0B10', border: `1px solid ${hot ? '#EF444466' : BORDER_ALT}`, borderRadius: 5, padding: '5px 2px', textAlign: 'center' }}>
            <div style={{ fontSize: 7, color: MUTED }}>{m}</div>
            <div style={{ fontSize: 9, fontWeight: 900, color: hot ? '#EF4444' : TEXT }}>{p}</div>
          </div>
        ))}
      </div>
    </MockupFrame>
  )
}

function SponsorshipMockup() {
  const deals = [
    { name: 'Wilson — Racket & Equipment', status: 'Active', statusColor: '#10B981', value: 'GBP 45,000/yr + bonuses', expires: 'Expires Dec 2027',
      obligations: ['Use Wilson frames in all matches', 'Wear Wilson bag', 'Social mentions 2/month'],
      bonuses: ['Top 50 +£10k', 'GS QF +£5k'] },
    { name: 'Lululemon — Apparel', status: 'Active', statusColor: '#10B981', value: 'GBP 65,000/yr', expires: 'Expires Jun 2027' },
    { name: 'Rolex — Watch/Luxury', status: 'Renewal due', statusColor: '#F59E0B', value: 'GBP 120,000/yr', expires: 'Expires May 2026 (47d)' },
  ]
  return (
    <MockupFrame>
      <div style={{ fontSize: 11, fontWeight: 800, color: TEXT, marginBottom: 10 }}>💛 Sponsorship Manager</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 12 }}>
        <KPI value="GBP 285k+" label="Total Value" color={PURPLE} />
        <KPI value="6" label="Active Deals" color="#10B981" />
        <KPI value="47 days" label="Rolex Renewal" color="#F59E0B" />
        <KPI value="1 today" label="Obligations Due" sub="Lululemon post" color={PURPLE_LIGHT} />
      </div>
      {deals.map(d => (
        <div key={d.name} style={{ backgroundColor: '#0A0B10', border: `1px solid ${d.statusColor}55`, borderRadius: 10, padding: 12, marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: TEXT }}>{d.name}</div>
            <Badge color={d.statusColor} bg={`${d.statusColor}22`}>{d.status}</Badge>
          </div>
          <div style={{ fontSize: 9, color: MUTED }}>{d.value} · {d.expires}</div>
          {d.obligations && (
            <div style={{ fontSize: 9, color: MUTED, marginTop: 6 }}>
              <span style={{ color: TEXT, fontWeight: 700 }}>Obligations:</span> {d.obligations.join(' · ')}
            </div>
          )}
          {d.bonuses && (
            <div style={{ fontSize: 9, color: PURPLE_LIGHT, marginTop: 4 }}>
              <span style={{ color: TEXT, fontWeight: 700 }}>Performance bonuses:</span> {d.bonuses.join(' | ')}
            </div>
          )}
        </div>
      ))}
    </MockupFrame>
  )
}

function TeamHubMockup() {
  const team = [
    { name: 'Marco Bianchi', role: 'Lead Coach', status: 'On-site Monte-Carlo', statusColor: '#10B981', note: 'Match prep uploaded · 08:15 today' },
    { name: 'Sarah Okafor', role: 'Physio', status: 'Cleared for play', statusColor: '#10B981', note: 'Shoulder treatment complete · 08:30' },
    { name: 'Luis Santos', role: 'Fitness Trainer', status: 'Remote', statusColor: '#3B82F6', note: 'Weekly conditioning plan uploaded' },
    { name: 'James Whitfield', role: 'Agent', status: 'Lululemon post pending', statusColor: '#F59E0B', note: 'Caption drafted for Lululemon post' },
    { name: 'Carlos Mendez', role: 'Stringer', status: 'Confirmed 11:45', statusColor: '#10B981', note: 'Clay setup sheet received' },
    { name: 'Dr. Aisha Patel', role: 'Mental Performance Coach', status: 'Session tonight', statusColor: PURPLE_LIGHT, note: 'Post-match session booked' },
  ]
  return (
    <MockupFrame>
      <div style={{ fontSize: 11, fontWeight: 800, color: TEXT, marginBottom: 10 }}>🤝 Team Hub</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        {team.map(t => (
          <div key={t.name} style={{ backgroundColor: '#0A0B10', border: `1px solid ${BORDER_ALT}`, borderRadius: 10, padding: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: TEXT }}>{t.name}</div>
                <div style={{ fontSize: 9, color: PURPLE_LIGHT }}>{t.role}</div>
              </div>
              <Badge color={t.statusColor} bg={`${t.statusColor}22`}>{t.status}</Badge>
            </div>
            <div style={{ fontSize: 9, color: MUTED, marginTop: 4 }}>{t.note}</div>
          </div>
        ))}
      </div>
    </MockupFrame>
  )
}

function PerformanceMockup() {
  const surfaces = [
    { label: 'Clay', pct: 61, color: '#F97316' },
    { label: 'Hard', pct: 68, color: '#3B82F6' },
    { label: 'Grass', pct: 72, color: '#10B981' },
    { label: 'Indoor', pct: 65, color: PURPLE },
  ]
  return (
    <MockupFrame>
      <div style={{ fontSize: 11, fontWeight: 800, color: TEXT, marginBottom: 2 }}>📊 Performance & Shot Heatmap</div>
      <div style={{ fontSize: 9, color: MUTED, marginBottom: 10 }}>Composite rating 68.4/100 · Last 12 months</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {/* Left — stats */}
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 5, marginBottom: 10 }}>
            <KPI value="50" label="Matches" color={PURPLE} />
            <KPI value="68%" label="Win Rate" color="#10B981" />
            <KPI value="6.1" label="Aces/match" color="#3B82F6" />
            <KPI value="63%" label="1st Serve %" color={PURPLE_LIGHT} />
          </div>
          <KPI value="41%" label="Break Point Conv." color="#F59E0B" />
          <div style={{ fontSize: 9, fontWeight: 800, color: TEXT, margin: '10px 0 6px' }}>1st Serve % by Surface</div>
          {surfaces.map(s => (
            <div key={s.label} style={{ marginTop: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: MUTED }}>
                <span>{s.label}</span><span style={{ color: s.color, fontWeight: 800 }}>{s.pct}%</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, backgroundColor: '#1F2937', marginTop: 2 }}>
                <div style={{ width: `${s.pct}%`, height: '100%', borderRadius: 2, backgroundColor: s.color }} />
              </div>
            </div>
          ))}
        </div>
        {/* Right — heatmap court */}
        <div>
          <div style={{ fontSize: 9, fontWeight: 800, color: TEXT, marginBottom: 6 }}>Serve Placement</div>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1.6', background: 'linear-gradient(180deg, #065F46, #047857)', borderRadius: 8, border: '2px solid #fff', overflow: 'hidden' }}>
            {/* court lines */}
            <div style={{ position: 'absolute', left: '10%', right: '10%', top: 0, bottom: 0, border: '1px solid rgba(255,255,255,0.4)' }} />
            <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', borderTop: '1px solid rgba(255,255,255,0.6)' }} />
            <div style={{ position: 'absolute', left: '50%', top: '50%', bottom: '25%', borderLeft: '1px solid rgba(255,255,255,0.4)' }} />
            <div style={{ position: 'absolute', left: '10%', right: '10%', top: '25%', borderBottom: '1px solid rgba(255,255,255,0.4)' }} />
            {/* heat blobs */}
            <div style={{ position: 'absolute', left: '38%', top: '8%', width: '24%', height: '12%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.85), rgba(245,158,11,0))' }} />
            <div style={{ position: 'absolute', left: '18%', top: '10%', width: '18%', height: '10%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,184,166,0.7), rgba(20,184,166,0))' }} />
            <div style={{ position: 'absolute', left: '62%', top: '12%', width: '14%', height: '8%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,184,166,0.55), rgba(20,184,166,0))' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: MUTED, marginTop: 6 }}>
            <span>T <span style={{ color: '#F59E0B', fontWeight: 800 }}>42%</span></span>
            <span>Wide <span style={{ color: '#14B8A6', fontWeight: 800 }}>38%</span></span>
            <span>Body <span style={{ color: PURPLE_LIGHT, fontWeight: 800 }}>20%</span></span>
          </div>
        </div>
      </div>
    </MockupFrame>
  )
}

function GPSCourtMockup() {
  return (
    <MockupFrame>
      <div style={{ fontSize: 11, fontWeight: 800, color: TEXT, marginBottom: 2 }}>📡 GPS &amp; Court Heatmap</div>
      <div style={{ fontSize: 9, color: MUTED, marginBottom: 12 }}>Monte-Carlo 2026 · Lumio GPS Vest · Clay</div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
        <svg width="220" height="150" viewBox="0 0 220 150">
          <rect x="0" y="0" width="220" height="150" fill="#1a0a00" />
          <rect x="18" y="8" width="184" height="134" fill="#8B4513" opacity="0.3" />
          {/* outer & net */}
          <rect x="18" y="8" width="184" height="134" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
          <line x1="18" y1="75" x2="202" y2="75" stroke="white" strokeWidth="2" opacity="0.75" />
          <line x1="110" y1="8" x2="110" y2="142" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          {/* service box */}
          <line x1="60" y1="50" x2="160" y2="50" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          <line x1="60" y1="100" x2="160" y2="100" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          <line x1="60" y1="50" x2="60" y2="100" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          <line x1="160" y1="50" x2="160" y2="100" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          {/* heat zones - baseline heavy */}
          <circle cx="110" cy="135" r="26" fill={PURPLE} opacity="0.72" style={{ filter: 'blur(7px)' }} />
          <circle cx="100" cy="133" r="18" fill={PURPLE_LIGHT} opacity="0.6" style={{ filter: 'blur(5px)' }} />
          <circle cx="78" cy="128" r="14" fill={PURPLE} opacity="0.5" style={{ filter: 'blur(6px)' }} />
          <circle cx="142" cy="130" r="13" fill={PURPLE} opacity="0.48" style={{ filter: 'blur(6px)' }} />
          <circle cx="110" cy="85" r="12" fill="#F59E0B" opacity="0.35" style={{ filter: 'blur(5px)' }} />
          <circle cx="110" cy="22" r="9" fill="#10B981" opacity="0.3" style={{ filter: 'blur(5px)' }} />
          <text x="110" y="146" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="7">BASELINE (68%)</text>
        </svg>
      </div>
      <div style={{ marginBottom: 10 }}>
        {[{ l: 'Baseline', v: 68, c: PURPLE }, { l: 'Mid-court', v: 22, c: '#F59E0B' }, { l: 'Net', v: 10, c: '#10B981' }].map(z => (
          <div key={z.l} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ fontSize: 9, color: MUTED, width: 60 }}>{z.l}</div>
            <div style={{ flex: 1, height: 5, backgroundColor: '#1F2937', borderRadius: 3 }}>
              <div style={{ width: `${z.v}%`, height: '100%', backgroundColor: z.c, borderRadius: 3 }} />
            </div>
            <div style={{ fontSize: 9, color: TEXT, width: 30, textAlign: 'right', fontWeight: 700 }}>{z.v}%</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 10 }}>
        <KPI value="1.17" label="ACWR" color="#F59E0B" />
        <KPI value="8.8km" label="Distance" color={PURPLE} />
        <KPI value="394" label="Load AU" color={PURPLE_LIGHT} />
      </div>
      <div style={{ backgroundColor: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.45)', borderRadius: 8, padding: 8 }}>
        <div style={{ fontSize: 9, color: '#F59E0B', fontWeight: 800 }}>● Sarah Okafor alert threshold: 1.15 — monitor tomorrow</div>
      </div>
    </MockupFrame>
  )
}

// ── Spotlight wrapper ────────────────────────────────────────────────────────
function Spotlight({ eyebrow, title, body, bullets, mockup, reverse, altBg }: {
  eyebrow: string; title: string; body: string; bullets: string[]; mockup: React.ReactNode; reverse?: boolean; altBg?: boolean
}) {
  return (
    <section style={{ padding: '96px 24px', backgroundColor: altBg ? '#0A0C14' : BG }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
        <div style={{ order: reverse ? 2 : 1 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: PURPLE_LIGHT, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>{eyebrow}</div>
          <h2 style={{ fontSize: 40, fontWeight: 900, color: TEXT, marginBottom: 16, lineHeight: 1.1 }}>{title}</h2>
          <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.6, marginBottom: 24 }}>{body}</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {bullets.map(b => (
              <li key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 15, color: TEXT }}>
                <span style={{ color: PURPLE_LIGHT, fontWeight: 900, flexShrink: 0 }}>✓</span>
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

// ── Page ─────────────────────────────────────────────────────────────────────
export default function TennisLandingPage() {
  return (
    <div style={{ backgroundColor: BG, color: TEXT, minHeight: '100vh' }}>
      {/* ── HERO ── */}
      <section style={{ minHeight: '100vh', padding: '120px 24px 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 20% 10%, ${PURPLE}33, transparent 50%), radial-gradient(circle at 80% 60%, ${PURPLE_LIGHT}22, transparent 55%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/tennis_transparent_logo.png" alt="Lumio Tennis" style={{ height: 80, margin: '0 auto 32px', display: 'block' }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.2em', color: PURPLE_LIGHT, textTransform: 'uppercase', marginBottom: 24 }}>
            LUMIO TOUR
          </div>
          <h1 style={{ fontSize: 'clamp(44px, 7vw, 80px)', fontWeight: 900, lineHeight: 1.05, color: TEXT, marginBottom: 24, maxWidth: 1000, marginLeft: 'auto', marginRight: 'auto' }}>
            Run your tennis career<br />
            <span style={{ color: '#06b6d4' }}>like a business.</span>
          </h1>
          <p style={{ fontSize: 20, color: MUTED, lineHeight: 1.6, maxWidth: 780, margin: '0 auto 20px' }}>
            The world&apos;s first tennis management platform with built-in GPS tracking, SwingVision integration and AI coaching briefs — all in one portal.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', margin: '16px 0 32px' }}>
            <span style={{ background: '#06b6d418', border: '1px solid #06b6d4', color: '#06b6d4', padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600 }}>🛰️ World First — Lumio GPS Tracker</span>
            <span style={{ background: '#a855f718', border: '1px solid #a855f7', color: '#a855f7', padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600 }}>🎾 SwingVision Integration</span>
            <span style={{ background: '#10b98118', border: '1px solid #10b981', color: '#10b981', padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600 }}>🤖 AI Coaching Briefs</span>
          </div>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
            <Link href="/tennis/demo" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '18px 32px', borderRadius: 12, backgroundColor: PURPLE, color: '#fff', fontSize: 16, fontWeight: 800, textDecoration: 'none', boxShadow: `0 20px 50px ${PURPLE}66` }}>
              Try the demo →
            </Link>
            <Link href="/sports-signup?sport=tennis" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '18px 32px', borderRadius: 12, backgroundColor: 'transparent', color: TEXT, fontSize: 16, fontWeight: 800, textDecoration: 'none', border: `1px solid ${BORDER}` }}>
              Apply for free access →
            </Link>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {STAT_PILLS.map(p => (
              <span key={p} style={{ padding: '10px 18px', borderRadius: 999, backgroundColor: 'rgba(124,58,237,0.1)', border: `1px solid ${PURPLE}66`, color: PURPLE_LIGHT, fontSize: 13, fontWeight: 700 }}>{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── WORLD FIRST — GPS INTELLIGENCE ── */}
      <section style={{ padding: '0 24px 48px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ background: 'linear-gradient(135deg, #0c1a2e 0%, #0a1628 50%, #061020 100%)', border: '1px solid #06b6d430', borderRadius: 24, padding: '64px 48px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, background: 'radial-gradient(circle, #06b6d420 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ marginBottom: 24 }}>
                <span style={{ background: '#06b6d4', color: '#000', padding: '6px 16px', borderRadius: 999, fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>⚡ World First in Tennis</span>
              </div>
              <h2 style={{ fontSize: 42, fontWeight: 800, color: '#fff', marginBottom: 16, maxWidth: 700, lineHeight: 1.2 }}>GPS Intelligence built<br /><span style={{ color: '#06b6d4' }}>specifically for tennis players.</span></h2>
              <p style={{ color: '#94a3b8', fontSize: 18, maxWidth: 600, lineHeight: 1.7, marginBottom: 48 }}>Every other GPS tracker is built for team sports. Lumio GPS Tracker is the first wearable built for the individual tennis player — tracking court coverage, sprint load and recovery between points, feeding directly into your portal and combining with SwingVision for an AI coaching brief after every session and set.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 48 }}>
                {[
                  { icon: '🛰️', title: 'Lumio GPS Tracker', color: '#06b6d4', desc: 'Lightweight clip-on device. Auto-syncs to your portal after every session. Court heatmaps, sprint zones and load scores — all in real time.', price: '£299 one-off · Included in Pro plan' },
                  { icon: '🎾', title: 'SwingVision Integration', color: '#a855f7', desc: 'Connect SwingVision for shot tracking, AI video clips and serve analytics — all combined with your GPS movement data in one unified dashboard.', price: 'One-click connect · Auto session sync' },
                  { icon: '🤖', title: 'AI Coaching Briefs', color: '#10b981', desc: 'At the end of every set or session, Lumio AI combines your GPS and SwingVision data to generate a coaching brief — observations, focus points and a recovery recommendation.', price: 'Auto-generated · ATP coaching tone' },
                ].map((f, i) => (
                  <div key={i} style={{ background: `${f.color}10`, border: `1px solid ${f.color}30`, borderRadius: 16, padding: 28 }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
                    <h3 style={{ color: f.color, fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{f.title}</h3>
                    <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
                    <div style={{ marginTop: 16, color: f.color, fontSize: 13, fontWeight: 600 }}>{f.price}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 48, padding: '24px 32px', background: '#ffffff08', borderRadius: 12, flexWrap: 'wrap', marginBottom: 40 }}>
                {[{ stat: '4.2km', label: 'Avg court coverage tracked per session' }, { stat: '127', label: 'Shots logged per match via SwingVision' }, { stat: '<2min', label: 'AI brief generated after final point' }, { stat: '0', label: 'Other platforms doing this for tennis' }].map(s => (
                  <div key={s.stat}><div style={{ color: '#06b6d4', fontSize: 28, fontWeight: 800 }}>{s.stat}</div><div style={{ color: '#64748b', fontSize: 13, maxWidth: 160 }}>{s.label}</div></div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <a href="mailto:hello@lumiosports.com?subject=Lumio%20GPS%20Tracker%20Order" style={{ background: '#06b6d4', color: '#000', padding: '14px 32px', borderRadius: 999, fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', textDecoration: 'none' }}>Order Lumio GPS Tracker →</a>
                <Link href="/tennis/demo" style={{ background: 'transparent', color: '#06b6d4', padding: '14px 32px', borderRadius: 999, fontWeight: 700, fontSize: 15, border: '1px solid #06b6d4', cursor: 'pointer', textDecoration: 'none' }}>See it in the portal</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURE GRID ── */}
      <section id="features" style={{ padding: '96px 24px', backgroundColor: '#0A0C14' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 44, fontWeight: 900, color: TEXT, textAlign: 'center', marginBottom: 16, lineHeight: 1.1 }}>
            Everything your team needs.<br />
            <span style={{ color: PURPLE_LIGHT }}>In one place.</span>
          </h2>
          <p style={{ fontSize: 16, color: MUTED, textAlign: 'center', marginBottom: 56 }}>
            Built with ATP and WTA professionals. Not adapted from a general sports app.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: TEXT, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SportRoleTabs sport="tennis" demoHref="/tennis/demo" accentColor="#8B5CF6" accentColorDim="rgba(139,92,246,0.15)" roles={TENNIS_ROLES} />

      {/* ── SPOTLIGHTS ── */}
      <Spotlight
        eyebrow="SPOTLIGHT · DASHBOARD"
        title="Your entire tour life. One screen."
        body="The Lumio Tour dashboard gives you today's match, world clock across four cities, your schedule, live rankings, and team alerts — all before you leave your room."
        bullets={["Today's match banner with opponent and court", 'World clock: London, New York, Melbourne, Dubai', 'Live ATP ranking with weekly movement', 'Alerts: sponsor deadlines, expiring points']}
        mockup={<DashboardMockup />}
      />

      <Spotlight
        altBg reverse
        eyebrow="SPOTLIGHT · AI MORNING BRIEFING"
        title="Before your first session. Every morning."
        body="Lumio reads your ranking data, match schedule, opponent report, stringing notes and sponsor obligations — then delivers a personalised briefing to your player, coach, agent and physio. Voice-powered by ElevenLabs."
        bullets={['Separate briefing per team role', 'Voice delivery via ElevenLabs TTS (Rachel voice)', 'Auto-sent daily at configured times', '2m 14s average briefing — faster than a coffee']}
        mockup={<BriefingMockup />}
      />

      <Spotlight
        eyebrow="SPOTLIGHT · GPS & COURT HEATMAP"
        title="Every step. Quantified."
        body="Lumio GPS Vest + UWB court beacons track your movement at 10Hz. Court heatmaps show where you spend time during matches — baseline vs mid-court vs net. ACWR load monitoring flags fatigue risk before it becomes injury."
        bullets={["Court heatmap: baseline / mid-court / net zone breakdown per session", 'ACWR 28-day rolling load vs 7-day acute — green/amber/red risk zones', 'Sarah Okafor receives automated alert when ACWR enters amber zone', 'Double fault heatmap: where you miss serves under pressure (30-40)']}
        mockup={<GPSCourtMockup />}
      />

      <Spotlight
        eyebrow="SPOTLIGHT · RANKINGS FORECASTER"
        title="Know your ranking before the match is over."
        body="The Lumio Points Forecaster models your ranking in real time. Pick your expected round and see exactly how many places you gain or lose — with your full 12-month points defence calendar laid out."
        bullets={['Live ATP/WTA ranking with weekly movement', 'Race to Turin / Race to Guadalajara standing', 'Round-by-round ranking projection', '12-month points defence calendar']}
        mockup={<RankingsMockup />}
      />

      <Spotlight
        altBg reverse
        eyebrow="SPOTLIGHT · SPONSORSHIP MANAGER"
        title="Every obligation. Every deadline. Tracked."
        body="Professional tennis is a business. Lumio tracks every sponsorship deal — wear obligations, social media requirements, appearance clauses, renewal dates and performance bonuses. Your agent sees the same data you do."
        bullets={['GBP 285k+ total annual value tracked', 'Wear and social obligations per deal', 'Performance bonus triggers', "Renewal alerts before it's too late"]}
        mockup={<SponsorshipMockup />}
      />

      <Spotlight
        eyebrow="SPOTLIGHT · TEAM HUB"
        title="Your team. In sync. Wherever they are."
        body="A professional tennis team travels across continents, working remotely and on-site. Lumio gives every member — coach, physio, agent, fitness trainer, stringer and mental performance coach — their own role-specific feed."
        bullets={['6 team roles, each with their own dashboard view', 'Status: on-site, remote, cleared for play', 'Latest actions and uploads visible to all', 'Morning briefing routed to each role separately']}
        mockup={<TeamHubMockup />}
      />

      <Spotlight
        altBg reverse
        eyebrow="SPOTLIGHT · PERFORMANCE & HEATMAPS"
        title="See every shot. Understand every pattern."
        body="Lumio's performance layer combines serve stats, return data, break point conversion and a composite Performance Rating — all sitting alongside visual court heatmaps for serve placement, return zones and groundstroke patterns."
        bullets={['68.4/100 composite Performance Rating', '1st serve % by surface: Clay 61% | Grass 72%', 'Court shot heatmaps: serve, return, groundstrokes', 'Win rate trend over 12 months']}
        mockup={<PerformanceMockup />}
      />

      {/* ── INTEGRATIONS ── */}
      <section style={{ padding: '96px 24px', backgroundColor: '#0A0C14' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 40, fontWeight: 900, color: TEXT, textAlign: 'center', marginBottom: 16, lineHeight: 1.1 }}>
            Lumio Tour connects to the tools you already use.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 48 }}>
            {INTEGRATIONS.map(i => (
              <div key={i.name} style={{ display: 'flex', alignItems: 'center', gap: 14, backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 26 }}>{i.icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: TEXT }}>{i.name}</div>
                  <div style={{ fontSize: 12, color: MUTED }}>{i.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TIERS ── */}
      <section style={{ padding: '96px 24px', backgroundColor: BG }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 40, fontWeight: 900, color: TEXT, textAlign: 'center', marginBottom: 16, lineHeight: 1.1 }}>
            Built for every professional player.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 56 }}>
            {TIERS.map(t => (
              <div key={t.name} style={{ backgroundColor: CARD, border: `1px solid ${PURPLE}55`, borderRadius: 16, padding: 32 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: PURPLE_LIGHT, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>TIER</div>
                <h3 style={{ fontSize: 26, fontWeight: 900, color: TEXT, marginBottom: 12 }}>{t.name}</h3>
                <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6 }}>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GPS INTELLIGENCE — WORLD FIRST ── */}
      <section style={{ padding: '96px 24px', backgroundColor: BG }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.2em', color: PURPLE_LIGHT, textTransform: 'uppercase', display: 'inline-block', padding: '6px 16px', borderRadius: 999, backgroundColor: `${PURPLE}22`, border: `1px solid ${PURPLE}44`, marginBottom: 16 }}>WORLD FIRST</span>
            <h2 style={{ fontSize: 42, fontWeight: 900, color: TEXT, lineHeight: 1.15, marginBottom: 16 }}>
              GPS Intelligence built for tennis — and powered by Lumio
            </h2>
            <p style={{ fontSize: 17, color: MUTED, lineHeight: 1.7, maxWidth: 700, margin: '0 auto' }}>
              Most GPS trackers are built for team sports. Lumio GPS Tracker is the first wearable built specifically for tennis players — tracking court coverage, sprint load, and recovery between points, all feeding directly into your Lumio portal.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 40 }}>
            {[
              { icon: '📡', title: 'Lumio GPS Tracker', desc: 'Lightweight clip-on device. Automatic sync. Court heatmaps after every session.' },
              { icon: '🎾', title: 'SwingVision Integration', desc: 'Connect SwingVision for shot tracking and AI video clips combined with your GPS data.' },
              { icon: '🤖', title: 'AI Coaching Briefs', desc: 'At the end of every set or session, get an AI-generated coaching brief combining movement, shot and load data.' },
            ].map((f, i) => (
              <div key={i} style={{ backgroundColor: CARD, border: `1px solid ${BORDER_ALT}`, borderRadius: 16, padding: 28 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: TEXT, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
            {['🛰️ Lumio Hardware', '🎾 SwingVision Partner', '🤖 AI Powered'].map(badge => (
              <span key={badge} style={{ padding: '8px 16px', borderRadius: 999, backgroundColor: `${PURPLE}15`, border: `1px solid ${PURPLE}40`, color: PURPLE_LIGHT, fontSize: 12, fontWeight: 700 }}>{badge}</span>
            ))}
          </div>
          <div style={{ textAlign: 'center' }}>
            <a href="mailto:hello@lumiosports.com?subject=Lumio%20GPS%20Tracker%20Order" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 28px', borderRadius: 12, backgroundColor: PURPLE, color: '#fff', fontSize: 15, fontWeight: 800, textDecoration: 'none', boxShadow: `0 16px 40px ${PURPLE}55` }}>
              Order Your Lumio GPS Tracker →
            </a>
          </div>
        </div>
      </section>

      {/* ── PLAYER DIRECTORY + COACH FINDER ── */}
      <section style={{ padding: '48px 24px', backgroundColor: BG }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <section style={{
            background: 'linear-gradient(135deg, #0c1a2e 0%, #0a1628 100%)',
            border: '1px solid #a855f730',
            borderRadius: '24px',
            padding: '56px 48px',
            margin: '32px 0',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute', top: '-80px', left: '-80px',
              width: '300px', height: '300px',
              background: 'radial-gradient(circle, #a855f720 0%, transparent 70%)',
              pointerEvents: 'none'
            }} />

            <div style={{ marginBottom: '20px' }}>
              <span style={{
                background: '#a855f7', color: '#fff',
                padding: '5px 14px', borderRadius: '999px',
                fontSize: '11px', fontWeight: 800, letterSpacing: '0.1em',
                textTransform: 'uppercase'
              }}>
                👥 Player & Coach Network
              </span>
            </div>

            <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#fff', marginBottom: '16px', lineHeight: 1.2 }}>
              Scout opponents. Find hitting partners.<br/>
              <span style={{ color: '#a855f7' }}>Hire your next coach.</span>
            </h2>

            <p style={{ color: '#94a3b8', fontSize: '17px', maxWidth: '620px', lineHeight: 1.7, marginBottom: '40px' }}>
              Everything you need to build your network — directly inside your portal.
              Search live ATP/WTA player profiles, find hitting partners near you,
              and use our AI Coach Finder to get a personalised shortlist of coaches
              matched to your game, your goals and your budget.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '40px' }}>

              <div style={{ background: '#a855f710', border: '1px solid #a855f730', borderRadius: '16px', padding: '28px' }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>👥</div>
                <h3 style={{ color: '#a855f7', fontWeight: 700, fontSize: '17px', marginBottom: '10px' }}>
                  Player Directory
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6, marginBottom: '16px' }}>
                  Search live ATP/WTA rankings and player profiles. Scout upcoming opponents —
                  playing style, serve patterns, surface preferences, recent form.
                  Add players to your contacts and find hitting partners available for hire.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    '🏆 Live ATP/WTA rankings',
                    '🎾 Opponent scouting profiles',
                    '🤝 Hitting partner search',
                    '📋 Personal contact list'
                  ].map(f => (
                    <div key={f} style={{ color: '#a855f7', fontSize: '13px', fontWeight: 500 }}>{f}</div>
                  ))}
                </div>
              </div>

              <div style={{ background: '#06b6d410', border: '1px solid #06b6d430', borderRadius: '16px', padding: '28px' }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>🎓</div>
                <h3 style={{ color: '#06b6d4', fontWeight: 700, fontSize: '17px', marginBottom: '10px' }}>
                  AI Coach Finder
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6, marginBottom: '16px' }}>
                  Tell us what you want to work on, your preferred working style and your budget.
                  Our AI searches live coaching data and returns a personalised shortlist —
                  with a draft approach email ready to send in one click.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    '🧠 Goal-based matching',
                    '📍 Location & travel preferences',
                    '💰 Budget-aware recommendations',
                    '📧 AI draft approach email'
                  ].map(f => (
                    <div key={f} style={{ color: '#06b6d4', fontSize: '13px', fontWeight: 500 }}>{f}</div>
                  ))}
                </div>
              </div>

            </div>

            <div style={{
              display: 'flex', gap: '40px',
              padding: '20px 28px',
              background: '#ffffff08',
              borderRadius: '12px',
              flexWrap: 'wrap',
              marginBottom: '32px'
            }}>
              {[
                { stat: '2,000+', label: 'ATP & WTA players searchable' },
                { stat: '4',      label: 'Personalised coach matches per search' },
                { stat: 'Live',   label: 'Rankings updated in real time' },
                { stat: '1-click', label: 'Draft approach email to any coach' },
              ].map(({ stat, label }) => (
                <div key={stat}>
                  <div style={{ color: '#a855f7', fontSize: '26px', fontWeight: 800 }}>{stat}</div>
                  <div style={{ color: '#64748b', fontSize: '13px', maxWidth: '160px' }}>{label}</div>
                </div>
              ))}
            </div>

            <button style={{
              background: '#a855f7', color: '#fff',
              padding: '14px 32px', borderRadius: '999px',
              fontWeight: 700, fontSize: '15px', border: 'none', cursor: 'pointer'
            }}>
              Explore the Player Network →
            </button>

          </section>
        </div>
      </section>

      {/* ── EARLY ACCESS CTA ── */}
      <section style={{ padding: '120px 24px', backgroundColor: '#0A0C14', borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 48, fontWeight: 900, color: TEXT, marginBottom: 20, lineHeight: 1.1 }}>
            Be one of the first players on Lumio Tour.
          </h2>
          <p style={{ fontSize: 17, color: MUTED, lineHeight: 1.6, marginBottom: 32 }}>
            We&apos;re working with a small number of professional players and their teams to shape the product. 3 months free. No commitment. All we ask for at the end is an honest case study.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
            {['3 months free', 'We build what you ask for', 'No lock-in'].map(p => (
              <span key={p} style={{ padding: '10px 18px', borderRadius: 999, backgroundColor: 'rgba(124,58,237,0.1)', border: `1px solid ${PURPLE}66`, color: PURPLE_LIGHT, fontSize: 13, fontWeight: 700 }}>{p}</span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/sports-signup?sport=tennis" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '18px 32px', borderRadius: 12, backgroundColor: PURPLE, color: '#fff', fontSize: 16, fontWeight: 800, textDecoration: 'none', boxShadow: `0 20px 50px ${PURPLE}66` }}>
              Apply for free founding access →
            </Link>
            <Link href="/tennis/demo" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '18px 32px', borderRadius: 12, backgroundColor: 'transparent', color: TEXT, fontSize: 16, fontWeight: 800, textDecoration: 'none', border: `1px solid ${BORDER}` }}>
              Or try the demo →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
