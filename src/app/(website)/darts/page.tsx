'use client'

import Link from 'next/link'
import SportRoleTabs from '../components/SportRoleTabs'
import { DARTS_ROLES } from '../components/sportRoles'

const RED = '#C41E3A'
const RED_LIGHT = '#EF4455'
const BG = '#07080F'
const CARD = '#0D1117'
const CARD_ALT = '#111827'
const BORDER = '#1E293B'
const BORDER_ALT = '#1F2937'
const TEXT = '#F9FAFB'
const MUTED = '#9CA3AF'

const STAT_PILLS = ['51 features', 'PDC & WDF', 'AI powered', 'ElevenLabs voice', 'DartConnect ready']

const FEATURES: Array<{ icon: string; title: string; desc: string }> = [
  { icon: '📊', title: 'Order of Merit & Race', desc: 'Live PDC ranking, rolling 2-year OoM tracker, weekly drop-off table, Merit Forecaster by round. Know exactly where you stand.' },
  { icon: '🎯', title: 'Match Prep & Opponent Intel', desc: 'H2H records, opponent tendency cards, 3-phase game plan, checkout routes, AI briefing generator. Walk to the oche prepared.' },
  { icon: '🌅', title: 'AI Morning Briefing', desc: 'Role-specific daily briefings for player, coach, agent and physio. Voice-delivered via ElevenLabs before first session.' },
  { icon: '💰', title: 'Financial Dashboard', desc: 'Prize money ledger, PDPA levy tracker, agent commission, net income forecast. Exportable for your accountant.' },
  { icon: '💛', title: 'Sponsorship Manager', desc: 'Every deal, every obligation, every deadline. Vanta Sports, Crown Wagers — all tracked automatically.' },
  { icon: '✈️', title: 'Travel & Logistics', desc: 'Event-by-event flight planning, hotel contacts, practice board booking across Euro Tour venues. 40+ events a year, organised.' },
  { icon: '⭐', title: 'Performance Rating & Stats', desc: 'First 9 average, checkout %, 180s per match, bust rate. A composite Performance Rating updated after every match.' },
  { icon: '🔥', title: 'Dartboard Heatmap', desc: 'Interactive SVG board with heat overlay per segment. See exactly where your darts land — by scenario and by double.' },
  { icon: '🤝', title: 'Team Hub & Comms', desc: 'Coach, physio, agent, mental coach. Role-specific feeds, threaded messaging, one shared platform.' },
  { icon: '📅', title: 'Entry Manager', desc: 'Entry deadlines, withdrawal windows, PDPA auto-entries, World Series invitations. Never miss a deadline again.' },
  { icon: '🚀', title: 'Career Planning', desc: 'Premier League pathway, World Cup national team tracker, Academy & Dev monitoring. Your roadmap, always visible.' },
  { icon: '🛡️', title: 'Tour Card Monitor', desc: 'Two-year tour card security dashboard. Drop-off table, buffer above #64, scenario calculator. The most important number in professional darts.' },
]

const INTEGRATIONS = [
  { icon: '🎯', name: 'DartConnect', desc: 'Live scoring and session data' },
  { icon: '📡', name: 'PDC Live Data', desc: 'Rankings and match feed' },
  { icon: '📸', name: 'Scolia', desc: 'Automatic scoring camera' },
  { icon: '🎵', name: 'ElevenLabs', desc: 'Voice briefing delivery' },
  { icon: '💰', name: 'Xero', desc: 'Financial management' },
  { icon: '📧', name: 'Microsoft 365', desc: 'Email and calendar' },
  { icon: '🤖', name: 'Claude AI', desc: 'Intelligence and briefings' },
  { icon: '🔔', name: 'Slack', desc: 'Team notifications' },
  { icon: '📊', name: 'iDarts', desc: 'Match stats and analysis' },
  { icon: '🎬', name: 'YouTube', desc: 'Content and highlights' },
  { icon: '📱', name: 'Instagram', desc: 'Fan engagement' },
  { icon: '🔌', name: 'PDPA Portal', desc: 'Membership and entries' },
]

const TIERS = [
  { name: 'Challenge / Development Tour', desc: 'Rankings intelligence, entry management, match prep, practice game tracking. Everything you need to earn a tour card.' },
  { name: 'PDC Tour Card Holder', desc: 'Full team hub, AI briefings, sponsorship management, travel logistics. The complete professional toolkit.' },
  { name: 'Top 32 / Premier League', desc: 'Advanced analytics, equipment tracking, pressure analysis, Tour Card Monitor. Trusted by players at the highest level.' },
]

// ── Mockup chrome ───────────────────────────────────────────────────────────
function MockupFrame({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: CARD_ALT, border: `1px solid ${BORDER_ALT}`, borderRadius: 12, overflow: 'hidden', boxShadow: `0 30px 80px ${RED}22` }}>
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
  const formats = [
    { label: '501', pct: 68, color: RED },
    { label: 'Doubles', pct: 41, color: '#F59E0B' },
    { label: 'Pressure', pct: 62, color: RED_LIGHT },
    { label: 'TV avg', pct: 72, color: '#3B82F6' },
  ]
  return (
    <MockupFrame>
      <div style={{ background: `linear-gradient(135deg, ${RED}, ${RED_LIGHT})`, borderRadius: 10, padding: 10, marginBottom: 10, color: '#fff' }}>
        <div style={{ fontSize: 10, fontWeight: 900 }}>Tonight&apos;s match — vs Gerwyn Price · 20:00 · Board 4</div>
        <div style={{ display: 'flex', gap: 10, fontSize: 8, marginTop: 4, opacity: 0.9 }}>
          <span>London 12:00</span><span>Dortmund 13:00</span><span>Melbourne 21:00</span><span>Las Vegas 04:00</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
        {['Log Practice', 'Match Prep', 'Log Injury', 'Sponsor Post', 'View Draw', 'Walk-on'].map(a => (
          <span key={a} style={{ fontSize: 8, padding: '4px 8px', borderRadius: 999, backgroundColor: 'rgba(196,30,58,0.15)', color: RED_LIGHT, border: `1px solid ${RED}55` }}>{a}</span>
        ))}
      </div>
      <div style={{ fontSize: 11, fontWeight: 800, color: TEXT, marginBottom: 8 }}>Good morning, Jake.</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
        <KPI value="#19" label="PDC" color={RED} />
        <KPI value="#19" label="OoM" color={RED_LIGHT} />
        <KPI value="£687k" label="Career" color="#3B82F6" />
        <KPI value="97.8" label="3-dart avg" color="#10B981" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 8 }}>
        <div style={{ backgroundColor: '#0A0B10', border: `1px solid ${BORDER_ALT}`, borderRadius: 10, padding: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: TEXT, marginBottom: 6 }}>Tonight&apos;s Match</div>
          <div style={{ fontSize: 10, color: TEXT }}>Jake Morrison <span style={{ color: MUTED }}>vs</span> G. Price</div>
          <div style={{ fontSize: 9, color: MUTED, marginTop: 2 }}>#19 PDC vs #7 PDC · European Ch. R1 · Dortmund</div>
          <div style={{ fontSize: 9, color: '#10B981', marginTop: 6, fontWeight: 800 }}>H2H: 8-3 in your favour</div>
        </div>
        <div style={{ backgroundColor: '#0A0B10', border: `1px solid ${BORDER_ALT}`, borderRadius: 10, padding: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 12 }}>🏴󠁧󠁢󠁥󠁮󠁧󠁿</span>
            <span style={{ fontSize: 9, fontWeight: 800, color: TEXT }}>Jake Morrison</span>
          </div>
          {formats.map(s => (
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
            {['W', 'W', 'L', 'W', 'W'].map((r, i) => (
              <span key={i} style={{ fontSize: 8, fontWeight: 900, width: 14, height: 14, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: r === 'W' ? '#10B98122' : '#EF444422', color: r === 'W' ? '#10B981' : '#EF4444' }}>{r}</span>
            ))}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Badge color="#EF4444" bg="rgba(239,68,68,0.15)">LIVE · vs G. Price</Badge>
        <Badge color="#F59E0B" bg="rgba(245,158,11,0.15)">£12.4k drops off week</Badge>
        <Badge color={RED_LIGHT} bg="rgba(239,68,85,0.15)">Vanta Sports content 16:00</Badge>
      </div>
    </MockupFrame>
  )
}

function BriefingMockup() {
  const roles = [
    { icon: '🎯', label: 'Player', time: '7:30am', active: true },
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
          <div key={r.label} style={{ backgroundColor: r.active ? 'rgba(196,30,58,0.2)' : '#0A0B10', border: `1px solid ${r.active ? RED : BORDER_ALT}`, borderRadius: 8, padding: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 14 }}>{r.icon}</div>
            <div style={{ fontSize: 9, fontWeight: 800, color: r.active ? RED_LIGHT : TEXT, marginTop: 2 }}>{r.label}</div>
            <div style={{ fontSize: 8, color: MUTED }}>{r.time}</div>
          </div>
        ))}
      </div>
      <div style={{ backgroundColor: '#0A0B10', border: `1px solid ${RED}55`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: TEXT }}>Today&apos;s briefing — Player</span>
          <button style={{ fontSize: 9, fontWeight: 800, padding: '5px 10px', borderRadius: 6, backgroundColor: RED, color: '#fff', border: 'none' }}>▶ Play Briefing</button>
        </div>
        <p style={{ fontSize: 9, color: MUTED, lineHeight: 1.6, margin: 0 }}>
          &ldquo;Good morning, Jake. You&apos;re ranked 19th on the PDC Order of Merit. Tonight you play Gerwyn Price in the European Championship first round — your H2H is 8–3 in your favour. £12,400 drops off your OoM this week from Players Championship 8 last year. Vanta Sports content shoot at 16:00 before you travel to Dortmund...&rdquo;
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
        <KPI value="2m 04s" label="Briefing Time" color={RED} />
        <KPI value="Daniel" label="Voice" sub="ElevenLabs TTS" color={RED_LIGHT} />
        <KPI value="07:30" label="Delivery" sub="Auto-send daily" color="#3B82F6" />
      </div>
    </MockupFrame>
  )
}

function MeritForecasterMockup() {
  const defendCal = [
    ['Apr', 12400, true], ['May', 0, false], ['Jun', 8500, false], ['Jul', 24000, true],
    ['Aug', 0, false], ['Sep', 16000, false], ['Oct', 0, false], ['Nov', 8500, false],
    ['Dec', 0, false], ['Jan', 32000, true], ['Feb', 6000, false], ['Mar', 4500, false],
  ] as const
  return (
    <MockupFrame>
      <div style={{ fontSize: 11, fontWeight: 800, color: TEXT, marginBottom: 2 }}>Merit Forecaster</div>
      <div style={{ fontSize: 9, color: MUTED, marginBottom: 10 }}>European Championship — Major · Prize fund £500,000</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 10 }}>
        <KPI value="#19" label="Current OoM" color={RED} />
        <KPI value="£687k" label="Rolling 2yr" color={RED_LIGHT} />
        <KPI value="£12.4k" label="Defending" sub="Players Ch. 8 (Apr 2023)" color="#F59E0B" />
      </div>
      <div style={{ fontSize: 10, fontWeight: 800, color: TEXT, marginBottom: 6 }}>If Jake reaches...</div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
        {['R1 L', 'R1 W', 'QF', 'SF', 'Final', 'Winner'].map(r => {
          const active = r === 'QF'
          return (
            <span key={r} style={{ fontSize: 9, fontWeight: 800, padding: '5px 10px', borderRadius: 999, backgroundColor: active ? RED : '#0A0B10', color: active ? '#fff' : MUTED, border: `1px solid ${active ? RED : BORDER_ALT}` }}>{r}</span>
          )
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 }}>
        <div style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.45)', borderRadius: 10, padding: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#10B981' }}>£50,000</div>
          <div style={{ fontSize: 8, color: MUTED }}>earned (QF)</div>
        </div>
        <div style={{ backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.35)', borderRadius: 10, padding: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#10B981' }}>#14</div>
          <div style={{ fontSize: 8, color: MUTED }}>↑5 places</div>
        </div>
        <div style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.45)', borderRadius: 10, padding: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#10B981' }}>+£37.6k</div>
          <div style={{ fontSize: 8, color: MUTED }}>Net (12.4k expiring)</div>
        </div>
      </div>
      <div style={{ fontSize: 10, fontWeight: 800, color: TEXT, marginBottom: 6 }}>Money to Defend — next 12 months (£)</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3 }}>
        {defendCal.map(([m, p, hot]) => (
          <div key={m as string} style={{ backgroundColor: hot ? 'rgba(239,68,68,0.18)' : '#0A0B10', border: `1px solid ${hot ? '#EF444466' : BORDER_ALT}`, borderRadius: 5, padding: '5px 2px', textAlign: 'center' }}>
            <div style={{ fontSize: 7, color: MUTED }}>{m}</div>
            <div style={{ fontSize: 8, fontWeight: 900, color: hot ? '#EF4444' : TEXT }}>{p === 0 ? '—' : `${((p as number) / 1000).toFixed(0)}k`}</div>
          </div>
        ))}
      </div>
    </MockupFrame>
  )
}

function EquipmentMockup() {
  return (
    <MockupFrame>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: TEXT }}>Tournament — The Hammer SE</div>
          <div style={{ fontSize: 9, color: MUTED }}>Active setup · Sponsored by Vanta Sports</div>
        </div>
        <Badge color="#10B981" bg="rgba(16,185,129,0.2)">Active</Badge>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 12 }}>
        <KPI value="97.8" label="Avg with setup" sub="Since Mar 2024" color={RED} />
        <KPI value="42.3%" label="Checkout %" color={RED_LIGHT} />
        <KPI value="47" label="Matches" color="#3B82F6" />
        <KPI value="9/10" label="Player Rating" color="#10B981" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        <div style={{ backgroundColor: '#0A0B10', border: `1px solid ${BORDER_ALT}`, borderRadius: 10, padding: 10 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: RED_LIGHT, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>🎯 Barrel</div>
          <div style={{ fontSize: 9, color: TEXT, lineHeight: 1.6 }}>
            Vanta Sports &ldquo;The Hammer&rdquo; SE<br />
            <span style={{ color: MUTED }}>24.0g · 97% Tungsten · Torpedo</span><br />
            <span style={{ color: MUTED }}>Micro grip · 52mm</span>
          </div>
        </div>
        <div style={{ backgroundColor: '#0A0B10', border: `1px solid ${BORDER_ALT}`, borderRadius: 10, padding: 10 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>🎯 Shaft</div>
          <div style={{ fontSize: 9, color: TEXT, lineHeight: 1.6 }}>
            Nitrotech Titanium<br />
            <span style={{ color: MUTED }}>Medium (41mm)</span><br />
            <span style={{ color: MUTED }}>Gunmetal finish</span>
          </div>
        </div>
        <div style={{ backgroundColor: '#0A0B10', border: `1px solid ${BORDER_ALT}`, borderRadius: 10, padding: 10 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>🎯 Flight</div>
          <div style={{ fontSize: 9, color: TEXT, lineHeight: 1.6 }}>
            Standard Heavy Duty<br />
            <span style={{ color: MUTED }}>150 micron · Black/Red</span><br />
            <span style={{ color: MUTED }}>The Hammer signature</span>
          </div>
        </div>
        <div style={{ backgroundColor: '#0A0B10', border: `1px solid ${BORDER_ALT}`, borderRadius: 10, padding: 10 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>🎯 Point</div>
          <div style={{ fontSize: 9, color: TEXT, lineHeight: 1.6 }}>
            Steel tip · 36mm<br />
            <span style={{ color: MUTED }}>Smooth finish</span><br />
            <span style={{ color: MUTED }}>Standard</span>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 10, padding: 8, borderRadius: 8, backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
        <div style={{ fontSize: 9, color: '#10B981', fontWeight: 800 }}>Last change: Mar 2024 — v1 → SE barrel</div>
        <div style={{ fontSize: 8, color: MUTED, marginTop: 2 }}>96.1 avg → 97.8 avg (+1.7) · Micro grip reduced T20 pull-left</div>
      </div>
    </MockupFrame>
  )
}

function SponsorshipMockup() {
  const deals = [
    { name: 'Vanta Sports — Equipment & Content', status: 'Active', statusColor: '#10B981', value: '£85,000/yr + bonuses', expires: 'Expires Dec 2025 (23d)',
      obligations: ['Use RD barrels in all matches', 'Wear RD logo on shirt', 'Content posts 4/month'],
      bonuses: ['Top 16 +£15k', 'Major QF +£7.5k', 'TV final +£10k'] },
    { name: 'Crown Wagers — Ambassador', status: 'Active', statusColor: '#10B981', value: '£60,000/yr', expires: 'Expires Jun 2026' },
    { name: 'Ladbrokes — Odds partner', status: 'Renewal due', statusColor: '#F59E0B', value: '£32,000/yr', expires: 'Expires May 2025 (18d)' },
  ]
  return (
    <MockupFrame>
      <div style={{ fontSize: 11, fontWeight: 800, color: TEXT, marginBottom: 10 }}>💛 Sponsorship Manager</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 12 }}>
        <KPI value="£177k" label="Total Value" color={RED} />
        <KPI value="4" label="Active Deals" color="#10B981" />
        <KPI value="23 days" label="RD Renewal" color="#F59E0B" />
        <KPI value="Today 16:00" label="Next Obligation" sub="RD content shoot" color={RED_LIGHT} />
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
            <div style={{ fontSize: 9, color: RED_LIGHT, marginTop: 4 }}>
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
    { name: 'Marco Rossi', role: 'Lead Coach', status: 'On-site Dortmund', statusColor: '#10B981', note: 'Match prep uploaded · 07:45 today' },
    { name: 'Dr. Anita Singh', role: 'Physio', status: 'Cleared for play', statusColor: '#10B981', note: 'Shoulder treatment complete · 08:30' },
    { name: 'James Whitfield', role: 'Agent', status: 'Vanta Sports call Thu', statusColor: '#F59E0B', note: 'Renewal terms drafted · Wed evening' },
    { name: 'Sarah Keane', role: 'Mental Coach', status: 'Pre-match call 18:00', statusColor: RED_LIGHT, note: 'Breathing anchor routine updated' },
    { name: 'Mike Lawrence', role: 'Massage Therapist', status: 'Confirmed 13:00', statusColor: '#10B981', note: 'Deep tissue session booked' },
    { name: 'Rachel Keane', role: 'Nutritionist', status: 'Match-day menu sent', statusColor: '#3B82F6', note: 'Pre-match meal at 15:00 confirmed' },
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
                <div style={{ fontSize: 9, color: RED_LIGHT }}>{t.role}</div>
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

// ── Spotlight wrapper ────────────────────────────────────────────────────────
function Spotlight({ eyebrow, title, body, bullets, mockup, reverse, altBg }: {
  eyebrow: string; title: string; body: string; bullets: string[]; mockup: React.ReactNode; reverse?: boolean; altBg?: boolean
}) {
  return (
    <section style={{ padding: '96px 24px', backgroundColor: altBg ? '#0A0C14' : BG }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
        <div style={{ order: reverse ? 2 : 1 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: RED_LIGHT, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>{eyebrow}</div>
          <h2 style={{ fontSize: 40, fontWeight: 900, color: TEXT, marginBottom: 16, lineHeight: 1.1 }}>{title}</h2>
          <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.6, marginBottom: 24 }}>{body}</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {bullets.map(b => (
              <li key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 15, color: TEXT }}>
                <span style={{ color: RED_LIGHT, fontWeight: 900, flexShrink: 0 }}>✓</span>
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
export default function DartsLandingPage() {
  return (
    <div style={{ backgroundColor: BG, color: TEXT, minHeight: '100vh' }}>
      {/* ── HERO ── */}
      <section style={{ minHeight: '100vh', padding: '120px 24px 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 20% 10%, ${RED}33, transparent 50%), radial-gradient(circle at 80% 60%, ${RED_LIGHT}22, transparent 55%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Sports/darts_logo.png" alt="Lumio Darts" style={{ height: 80, margin: '0 auto 32px', display: 'block' }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.2em', color: RED_LIGHT, textTransform: 'uppercase', marginBottom: 24 }}>
            LUMIO TOUR · DARTS
          </div>
          <h1 style={{ fontSize: 'clamp(44px, 7vw, 80px)', fontWeight: 900, lineHeight: 1.05, color: TEXT, marginBottom: 24, maxWidth: 1000, marginLeft: 'auto', marginRight: 'auto' }}>
            The operating system for professional darts players.
          </h1>
          <p style={{ fontSize: 20, color: MUTED, lineHeight: 1.6, maxWidth: 820, margin: '0 auto 40px' }}>
            Order of Merit, match prep, travel, finance, sponsorship, team briefings — everything your team needs, in one place. Built for PDC Tour Card holders.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
            <Link href="/sports-signup?sport=darts" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '18px 32px', borderRadius: 12, backgroundColor: RED, color: '#fff', fontSize: 16, fontWeight: 800, textDecoration: 'none', boxShadow: `0 20px 50px ${RED}66` }}>
              Apply for founding access →
            </Link>
            <Link href="/darts/darts-demo" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '18px 32px', borderRadius: 12, backgroundColor: 'transparent', color: TEXT, fontSize: 16, fontWeight: 800, textDecoration: 'none', border: `1px solid ${BORDER}` }}>
              Try the demo
            </Link>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {STAT_PILLS.map(p => (
              <span key={p} style={{ padding: '10px 18px', borderRadius: 999, backgroundColor: 'rgba(196,30,58,0.1)', border: `1px solid ${RED}66`, color: RED_LIGHT, fontSize: 13, fontWeight: 700 }}>{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURE GRID ── */}
      <section id="features" style={{ padding: '96px 24px', backgroundColor: '#0A0C14' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 44, fontWeight: 900, color: TEXT, textAlign: 'center', marginBottom: 16, lineHeight: 1.1 }}>
            Everything your team needs.<br />
            <span style={{ color: RED_LIGHT }}>In one place.</span>
          </h2>
          <p style={{ fontSize: 16, color: MUTED, textAlign: 'center', marginBottom: 56 }}>
            Built with PDC professionals. Not adapted from a general sports app.
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

      <SportRoleTabs sport="darts" demoHref="/darts/demo" accentColor="#EF4444" accentColorDim="rgba(239,68,68,0.15)" roles={DARTS_ROLES} />

      {/* ── SPOTLIGHTS ── */}
      <Spotlight
        eyebrow="SPOTLIGHT · DASHBOARD"
        title="Your entire tour life. One screen."
        body="The Lumio Tour dashboard gives you tonight's match, world clock across four cities, your OoM position, and team alerts — all before you leave your hotel room."
        bullets={["Tonight's match banner with opponent and board number", 'World clock: London, Dortmund, Melbourne, Las Vegas', 'Live PDC ranking with weekly movement', 'Alerts: sponsor deadlines, entry windows, expiring OoM money']}
        mockup={<DashboardMockup />}
      />

      <Spotlight
        altBg reverse
        eyebrow="SPOTLIGHT · AI MORNING BRIEFING"
        title="Before your first session. Every morning."
        body="Lumio reads your OoM position, match schedule, opponent report, equipment notes and sponsor obligations — then delivers a personalised briefing to your player, coach, agent and physio. Voice-powered by ElevenLabs."
        bullets={['Separate briefing per team role', 'Voice delivery via ElevenLabs TTS (Daniel voice)', 'Auto-sent daily at configured times', "Tonight's match, this week's entries, OoM drop-offs"]}
        mockup={<BriefingMockup />}
      />

      <Spotlight
        eyebrow="SPOTLIGHT · MERIT FORECASTER"
        title="Know your ranking before the match is over."
        body="The Lumio Merit Forecaster models your OoM in real time. Pick your expected round and see exactly how many places you gain or lose — with your full prize money defence calendar laid out."
        bullets={['Live PDC OoM with weekly movement', 'Players Championship and Euro Tour prize splits', 'Round-by-round ranking projection', '12-week money defence calendar']}
        mockup={<MeritForecasterMockup />}
      />

      <Spotlight
        altBg reverse
        eyebrow="SPOTLIGHT · EQUIPMENT SETUP"
        title="Your kit. Tracked. Correlated to your performance."
        body="Lumio tracks your full equipment specification — barrel weight, grip, shaft material, flight shape, point length — across multiple setups. Every spec change is logged against your before and after average."
        bullets={['Barrel, shaft, flight and point specs per setup', 'Average and checkout % tracked per setup', 'Change log with before/after performance delta', 'Tournament vs practice setup side-by-side compare']}
        mockup={<EquipmentMockup />}
      />

      <Spotlight
        eyebrow="SPOTLIGHT · SPONSORSHIP MANAGER"
        title="Every obligation. Every deadline. Tracked."
        body="Professional darts is a business. Lumio tracks every sponsorship deal — content obligations, appearance clauses, renewal dates and performance bonuses. Your agent sees the same data you do."
        bullets={['All sponsor deals in one place', 'Content and wear obligations tracked', "Renewal alerts before it's too late", 'Agent access to same data']}
        mockup={<SponsorshipMockup />}
      />

      <Spotlight
        altBg reverse
        eyebrow="SPOTLIGHT · TEAM HUB"
        title="Your team. In sync. Wherever they are."
        body="A professional darts team travels across Europe week in, week out. Lumio gives every member — coach, physio, agent, mental coach, massage therapist and nutritionist — their own role-specific feed, with threaded messaging and shared match prep."
        bullets={['6 team roles, each with their own dashboard view', 'Status: on-site, remote, cleared for play', 'Threaded messaging across the team', 'Morning briefing routed to each role separately']}
        mockup={<TeamHubMockup />}
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
              <div key={t.name} style={{ backgroundColor: CARD, border: `1px solid ${RED}55`, borderRadius: 16, padding: 32 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: RED_LIGHT, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>TIER</div>
                <h3 style={{ fontSize: 26, fontWeight: 900, color: TEXT, marginBottom: 12 }}>{t.name}</h3>
                <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6 }}>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EARLY ACCESS CTA ── */}
      <section style={{ padding: '120px 24px', backgroundColor: '#0A0C14', borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 48, fontWeight: 900, color: TEXT, marginBottom: 20, lineHeight: 1.1 }}>
            Be one of the first players on Lumio Tour Darts.
          </h2>
          <p style={{ fontSize: 17, color: MUTED, lineHeight: 1.6, marginBottom: 32 }}>
            We&apos;re working with a small number of PDC professionals and their teams to shape the product. 6 months free. No commitment. All we ask for at the end is an honest case study.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
            {['6 months free', 'We build what you ask for', 'No lock-in'].map(p => (
              <span key={p} style={{ padding: '10px 18px', borderRadius: 999, backgroundColor: 'rgba(196,30,58,0.1)', border: `1px solid ${RED}66`, color: RED_LIGHT, fontSize: 13, fontWeight: 700 }}>{p}</span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="mailto:hello@lumiosports.com?subject=Darts%20Early%20Access" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '18px 32px', borderRadius: 12, backgroundColor: RED, color: '#fff', fontSize: 16, fontWeight: 800, textDecoration: 'none', boxShadow: `0 20px 50px ${RED}66` }}>
              Apply for early access →
            </a>
            <Link href="/darts/darts-demo" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '18px 32px', borderRadius: 12, backgroundColor: 'transparent', color: TEXT, fontSize: 16, fontWeight: 800, textDecoration: 'none', border: `1px solid ${BORDER}` }}>
              Or try the demo →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
