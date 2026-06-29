'use client'

// Staff / Coaches — the head coach's team view (Staff Phase B). A directory of
// all coaches with booking-derived stats, drilling into a per-coach detail with
// that coach's own week (reusing the shared WeekCalendarGrid) and assigned
// players. Built entirely on Phase A's multi-coach data model; reads ALL_BOOKINGS
// / ALL_PLAYERS so it never disturbs Pete's own single-coach views.

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT, FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { BELTS, demoAvatarUrl, type TodaySession } from '../_lib/coach-data'
import {
  COACHES, coachStats, playersForCoach, ALL_PLAYERS, ALL_BOOKINGS,
  type Coach, type CoachRole, type CoachStats,
} from '../_lib/coaches-data'
import { getCalendarItems } from '../_lib/schedule'
import { WeekCalendarGrid } from './WeekCalendar'
import { getAddedSessions, subscribe as subscribeSessions } from '../_lib/sessions-store'
import { getAddedCoaches, subscribe as subscribeCoaches } from '../_lib/coaches-store'
import { assignPlayer, subscribe as subscribeAssign } from '../_lib/player-assign-store'
import { AddCoachModal } from './AddCoachModal'
import { CoachSendMessage, type PresetRecipient } from './SendMessage'

// Build a Send-Message preset for a coach. Static demo coaches carry no contact
// details, so synthesise fictional ones (example mailbox + Ofcom drama number)
// that the head coach can "message" without reaching a real person.
function contactPreset(c: Coach): PresetRecipient {
  const first = c.name.split(' ')[0].toLowerCase()
  const n = (c.id.split('').reduce((a, ch) => a + ch.charCodeAt(0), 0) % 900) + 100
  return {
    name: c.name,
    role: `${c.role} Coach`,
    email: c.email || `${first}@riversidetennis.example`,
    phone: c.phone || `+44 7700 900${n}`,
  }
}

type Common = { T: ThemeTokens; accent: AccentTokens; density: Density }

// ─── primitives (match RosterView's card conventions) ────────────────────────
function Card({ T, density, children, style, hover, onClick }: { T: ThemeTokens; density: Density; children: ReactNode; style?: CSSProperties; hover?: boolean; onClick?: () => void }) {
  return (
    <div onClick={onClick}
      style={{ position: 'relative', background: T.panel, border: `1px solid ${T.border}`, borderRadius: density.radius, padding: density.pad, boxShadow: T.cardShadow, cursor: onClick ? 'pointer' : 'default', transition: hover ? 'border-color .15s, transform .15s' : undefined, ...style }}>
      {children}
    </div>
  )
}
function Avatar({ accent, initials, size = 40, seed }: { accent: AccentTokens; initials: string; size?: number; seed?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  if (seed) return <img src={demoAvatarUrl(seed)} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  return <div style={{ width: size, height: size, borderRadius: '50%', display: 'grid', placeItems: 'center', background: accent.dim, color: accent.hex, fontSize: size * 0.36, fontWeight: 700, fontFamily: FONT_MONO, flexShrink: 0 }}>{initials}</div>
}
function SectionHead({ T, title, right }: { T: ThemeTokens; title: ReactNode; right?: ReactNode }) {
  return <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 10, gap: 8 }}><div style={{ fontSize: 12.5, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</div><div style={{ marginLeft: 'auto', fontSize: 11, color: T.text3, fontFamily: FONT_MONO }}>{right}</div></div>
}
const statusColour = (T: ThemeTokens, s: Coach['status']) => s === 'active' ? T.good : T.warn

function RoleBadge({ T, accent, role }: { T: ThemeTokens; accent: AccentTokens; role: CoachRole }) {
  const c = role === 'Head' ? accent.hex : role === 'Senior' ? T.good : role === 'Coach' ? '#3A8EE0' : T.text3
  return <span style={{ fontSize: 8.5, fontWeight: 700, color: c, background: `${c}22`, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{role}</span>
}
function Chip({ T, children }: { T: ThemeTokens; children: ReactNode }) {
  return <span style={{ fontSize: 10.5, color: T.text2, padding: '3px 8px', borderRadius: 6, background: T.hover, border: `1px solid ${T.border}` }}>{children}</span>
}
function MiniStat({ T, label, value, c }: { T: ThemeTokens; label: string; value: string | number; c?: string }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div className="tnum" style={{ fontSize: 17, fontWeight: 600, color: c ?? T.text }}>{value}</div>
      <div style={{ fontSize: 9, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{label}</div>
    </div>
  )
}

// ─── DBS / safeguarding register (demo) ──────────────────────────────────────
// Sample DBS + safeguarding records per coach so the demo shows the same
// register the live portal captures. A couple are deliberately expired / due /
// missing so the "attention needed" warning has something to flag.
type DbsRecord = { number: string | null; issued: string | null; expiry: string | null; safeTrained: boolean; safeDate: string | null }
const DEMO_DBS: Record<string, DbsRecord> = {
  pete:   { number: '0012 3456 7890', issued: '2024-09-02', expiry: '2027-09-02', safeTrained: true,  safeDate: '2025-10-14' },
  rachel: { number: '0023 4567 8901', issued: '2024-06-18', expiry: '2027-06-18', safeTrained: true,  safeDate: '2025-09-03' },
  marcus: { number: '0034 5678 9012', issued: '2023-08-20', expiry: '2026-08-20', safeTrained: true,  safeDate: '2025-04-22' }, // expiring soon
  sofia:  { number: '0045 6789 0123', issued: '2024-11-05', expiry: '2027-11-05', safeTrained: true,  safeDate: '2025-11-19' },
  david:  { number: '0056 7890 1234', issued: '2024-02-12', expiry: '2027-02-12', safeTrained: true,  safeDate: '2025-06-30' },
  elena:  { number: '0067 8901 2345', issued: '2023-04-12', expiry: '2026-04-12', safeTrained: true,  safeDate: '2024-12-01' }, // expired
  jamie:  { number: '0078 9012 3456', issued: '2024-07-30', expiry: '2027-07-30', safeTrained: true,  safeDate: '2025-08-15' },
  aisha:  { number: '0089 0123 4567', issued: '2024-05-09', expiry: '2027-05-09', safeTrained: false, safeDate: null },        // safeguarding gap
  theo:   { number: '0090 1234 5678', issued: '2024-10-01', expiry: '2027-10-01', safeTrained: true,  safeDate: '2025-10-01' },
  grace:  { number: '0101 2345 6789', issued: '2023-09-08', expiry: '2026-09-08', safeTrained: true,  safeDate: '2025-03-12' }, // expiring soon
  ben:    { number: '0112 3456 7890', issued: '2025-01-15', expiry: '2028-01-15', safeTrained: true,  safeDate: '2025-02-04' },
  nadia:  { number: '0123 4567 8901', issued: '2024-12-03', expiry: '2027-12-03', safeTrained: true,  safeDate: '2025-01-20' },
  luca:   { number: '0134 5678 9012', issued: '2024-08-22', expiry: '2027-08-22', safeTrained: true,  safeDate: '2025-07-09' },
  chloe:  { number: null,             issued: null,         expiry: null,         safeTrained: false, safeDate: null },        // no DBS on file
  ollie:  { number: '0156 7890 1234', issued: '2025-02-18', expiry: '2028-02-18', safeTrained: false, safeDate: null },        // safeguarding gap
}
const DAY = 86400000
function dbsState(rec: DbsRecord | undefined): { label: string; colour: string; short: string } {
  if (!rec || !rec.expiry) return { label: 'No DBS on file', colour: '#EF4444', short: 'Missing' }
  const days = Math.floor((new Date(rec.expiry).getTime() - Date.now()) / DAY)
  if (days < 0) return { label: 'Expired', colour: '#EF4444', short: 'Expired' }
  if (days <= 90) return { label: `Expires in ${days}d`, colour: '#F59E0B', short: 'Due soon' }
  return { label: 'Valid', colour: '#22C55E', short: 'Valid' }
}
function dbsFor(c: Coach): DbsRecord | undefined {
  // A coach added with their own DBS details carries them on the record; static
  // demo coaches fall back to the sample DEMO_DBS map.
  if (c.dbsNumber || c.dbsExpiry || c.safeguardingTrained || c.safeguardingDate) {
    return { number: c.dbsNumber ?? null, issued: c.dbsIssued ?? null, expiry: c.dbsExpiry ?? null, safeTrained: !!c.safeguardingTrained, safeDate: c.safeguardingDate ?? null }
  }
  return DEMO_DBS[c.id]
}
function DbsBadge({ rec }: { rec: DbsRecord | undefined }) {
  const st = dbsState(rec)
  return <span style={{ fontSize: 9, fontWeight: 700, color: st.colour, background: `${st.colour}1a`, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>DBS {st.short}</span>
}

// ════════════════════════════════════════════════════════════════════════════
export function StaffView({ T, accent, density, onNavigate }: Common & { onNavigate?: (s: string) => void }) {
  const [added, setAdded] = useState<TodaySession[]>([])
  useEffect(() => { const r = () => setAdded(getAddedSessions()); r(); return subscribeSessions(r) }, [])
  const [addedCoaches, setAddedCoaches] = useState<Coach[]>([])
  const [addOpen, setAddOpen] = useState(false)
  const [contact, setContact] = useState<PresetRecipient | null>(null)
  useEffect(() => { const r = () => setAddedCoaches(getAddedCoaches()); r(); return subscribeCoaches(r) }, [])
  const [, setAssignTick] = useState(0)
  useEffect(() => subscribeAssign(() => setAssignTick(t => t + 1)), [])

  const [selId, setSelId] = useState<string | null>(null)
  const [role, setRole] = useState<'All' | CoachRole>('All')

  // Static team + any coaches added via "Add coach". Stats are booking-derived, so
  // an added coach (no bookings/players yet) gets sane zeros — coachStats already
  // guards the coachById miss, so no crash.
  const coaches = [...COACHES, ...addedCoaches]
  const stats: Record<string, CoachStats> = Object.fromEntries(coaches.map(c => [c.id, coachStats(c.id)]))
  const sel = selId ? coaches.find(c => c.id === selId) : null

  // ─── COACH DETAIL ──────────────────────────────────────────────────────────
  if (sel) {
    const s = stats[sel.id]
    const calItems = getCalendarItems(added, sel.id)
    const players = playersForCoach(sel.id)
    return (
      <div>
        <button onClick={() => setSelId(null)} style={{ appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 9, padding: '6px 12px', fontSize: 12, fontWeight: 600, fontFamily: FONT, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
          <Icon name="arrow-up-right" size={13} stroke={1.9} style={{ transform: 'rotate(180deg)' }} /> All coaches
        </button>

        {/* header */}
        <Card T={T} density={density} style={{ marginBottom: density.gap }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <Avatar accent={accent} initials={sel.initials} size={50} seed={sel.name} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 19, fontWeight: 600, color: T.text }}>{sel.name}</span>
                <RoleBadge T={T} accent={accent} role={sel.role} />
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: T.text3 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColour(T, sel.status) }} />{sel.status === 'active' ? 'Active' : 'On leave'}
                </span>
              </div>
              <div style={{ fontSize: 12, color: T.text3, marginTop: 2 }}>{sel.accreditation} · {sel.availability} · {sel.hoursPerWeek}h/wk · {sel.homeVenue}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 4, fontSize: 11.5, color: T.text2 }}>
                <span>📞 {contactPreset(sel).phone}</span>
                <span>✉ {contactPreset(sel).email}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                {sel.specialisms.map(sp => <Chip key={sp} T={T}>{sp}</Chip>)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-start', flexShrink: 0 }}>
              <button onClick={() => { window.location.href = `tel:${contactPreset(sel).phone?.replace(/\s+/g, '')}` }} title={`Call ${sel.name}`}
                style={{ appearance: 'none', border: `1px solid ${T.border}`, background: T.panel2, color: T.text, borderRadius: 9, padding: '8px 13px', fontSize: 12.5, fontWeight: 700, fontFamily: FONT, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 13 }}>📞</span> Call
              </button>
              <button onClick={() => setContact(contactPreset(sel))} title={`Message ${sel.name}`}
                style={{ appearance: 'none', border: `1px solid ${accent.border}`, background: accent.dim, color: accent.hex, borderRadius: 9, padding: '8px 13px', fontSize: 12.5, fontWeight: 700, fontFamily: FONT, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 13 }}>✉</span> Contact
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
            <MiniStat T={T} label="Today" value={s.today} c={accent.hex} />
            <MiniStat T={T} label="This week" value={s.week} />
            <MiniStat T={T} label="Players" value={s.players} />
            <MiniStat T={T} label="Hours booked" value={`${s.hoursBooked}h`} />
            <MiniStat T={T} label="Utilisation" value={`${s.utilisation}%`} c={s.utilisation >= 75 ? T.good : s.utilisation >= 40 ? T.warn : T.text2} />
          </div>
        </Card>

        {/* DBS & safeguarding */}
        {(() => {
          const rec = dbsFor(sel)
          const st = dbsState(rec)
          return (
            <>
              <SectionHead T={T} title="DBS & safeguarding" right={<span style={{ color: st.colour, fontWeight: 700, fontFamily: FONT_MONO }}>{st.label}</span>} />
              <Card T={T} density={density} style={{ marginBottom: density.gap }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
                  <div style={{ minWidth: 130 }}>
                    <div style={{ fontSize: 9.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>DBS status</div>
                    <div style={{ marginTop: 4 }}><span style={{ fontSize: 12, fontWeight: 700, color: st.colour, background: `${st.colour}1a`, padding: '3px 9px', borderRadius: 5 }}>{st.label}</span></div>
                  </div>
                  <div style={{ minWidth: 130 }}>
                    <div style={{ fontSize: 9.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>DBS number</div>
                    <div className="tnum" style={{ fontSize: 13, color: T.text, marginTop: 5, fontFamily: FONT_MONO }}>{rec?.number ?? '—'}</div>
                  </div>
                  <div style={{ minWidth: 110 }}>
                    <div style={{ fontSize: 9.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Issued</div>
                    <div style={{ fontSize: 13, color: T.text, marginTop: 5 }}>{rec?.issued ? new Date(rec.issued).toLocaleDateString('en-GB') : '—'}</div>
                  </div>
                  <div style={{ minWidth: 110 }}>
                    <div style={{ fontSize: 9.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expiry</div>
                    <div style={{ fontSize: 13, color: T.text, marginTop: 5 }}>{rec?.expiry ? new Date(rec.expiry).toLocaleDateString('en-GB') : '—'}</div>
                  </div>
                  <div style={{ minWidth: 150 }}>
                    <div style={{ fontSize: 9.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Safeguarding training</div>
                    <div style={{ fontSize: 13, marginTop: 5, color: rec?.safeTrained ? T.good : T.warn, fontWeight: 600 }}>
                      {rec?.safeTrained ? `✓ ${rec.safeDate ? new Date(rec.safeDate).toLocaleDateString('en-GB') : 'Trained'}` : 'Not recorded'}
                    </div>
                  </div>
                </div>
                {(st.short !== 'Valid' || !rec?.safeTrained) && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11.5, color: T.warn }}>
                      {st.short === 'Missing' ? 'No DBS on file — request a check before this coach works unsupervised.'
                        : st.short === 'Expired' ? 'DBS has expired — renew before this coach works unsupervised.'
                        : st.short === 'Due soon' ? 'DBS expires soon — start the renewal now.'
                        : 'Safeguarding training not recorded.'}
                    </span>
                    <button style={{ marginLeft: 'auto', appearance: 'none', border: `1px solid ${accent.hex}`, background: accent.dim, color: accent.hex, borderRadius: 8, padding: '6px 12px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>Record update</button>
                  </div>
                )}
              </Card>
            </>
          )
        })()}

        {/* their week */}
        <SectionHead T={T} title="This week" right="Mon 8 – Sun 14 Jun" />
        <Card T={T} density={density} style={{ padding: 0, overflowX: 'auto', marginBottom: density.gap }}>
          <WeekCalendarGrid T={T} accent={accent} density={density} items={calItems} />
        </Card>

        {/* assigned players */}
        <SectionHead T={T} title="Assigned players" right={`${players.length}`} />
        {players.length ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: density.gap }}>
            {players.map(p => (
              <Card key={p.id} T={T} density={density}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar accent={accent} initials={p.initials} size={36} seed={p.name} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    <div style={{ fontSize: 10.5, color: T.text3 }}>{p.group} · Age {p.age}</div>
                  </div>
                  <span style={{ width: 16, height: 10, borderRadius: 2, background: BELTS[p.beltIndex]?.colour ?? T.border, border: '1px solid rgba(128,128,128,0.4)', flexShrink: 0 }} />
                </div>
                <div style={{ fontSize: 11, color: T.text3, marginTop: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>🎯 {p.goal}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>Reassign</span>
                  <select value="" onChange={e => { if (e.target.value) assignPlayer(p.id, e.target.value) }}
                    style={{ flex: 1, minWidth: 0, appearance: 'none', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 7, color: T.text2, fontSize: 11.5, padding: '5px 8px', cursor: 'pointer' }}>
                    <option value="">Move to coach…</option>
                    {coaches.filter(c => c.id !== sel.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </Card>
            ))}
          </div>
        ) : <div style={{ fontSize: 12, color: T.text3 }}>No players currently assigned.</div>}
        {contact && <CoachSendMessage T={T} accent={accent} preset={contact} onClose={() => setContact(null)} />}
      </div>
    )
  }

  // ─── DIRECTORY ─────────────────────────────────────────────────────────────
  const list = role === 'All' ? coaches : coaches.filter(c => c.role === role)
  const roles: ('All' | CoachRole)[] = ['All', 'Head', 'Senior', 'Coach', 'Assistant', 'Apprentice']

  const sumHours = coaches.reduce((a, c) => a + stats[c.id].hoursBooked, 0)
  const sumCap = coaches.reduce((a, c) => a + c.hoursPerWeek, 0)
  const dbsValid = coaches.filter(c => dbsState(dbsFor(c)).short === 'Valid').length
  const dbsFlagged = coaches.filter(c => { const s = dbsState(dbsFor(c)).short; return s !== 'Valid' })
  const summary = [
    { l: 'Coaches', v: coaches.length, c: T.text },
    { l: 'On leave', v: coaches.filter(c => c.status === 'leave').length, c: T.warn },
    { l: 'Players', v: ALL_PLAYERS.length, c: accent.hex },
    { l: 'Sessions this week', v: ALL_BOOKINGS.filter(b => b.status !== 'cancelled').length, c: T.text },
    { l: 'DBS valid', v: `${dbsValid}/${coaches.length}`, c: dbsValid === coaches.length ? T.good : T.warn },
    { l: 'Club utilisation', v: `${sumCap ? Math.round((sumHours / sumCap) * 100) : 0}%`, c: T.good },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: FONT, fontSize: 24, fontWeight: 600, color: T.text, letterSpacing: '-0.02em' }}>Coaches</h1>
          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: T.text3 }}>Your coaching team at a glance — calendars, accreditations and workload across the club.</p>
        </div>
        <button onClick={() => setAddOpen(true)} style={{ marginLeft: 'auto', appearance: 'none', border: 0, padding: '8px 14px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 12.5, fontWeight: 600, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <Icon name="plus" size={14} stroke={2} /> Add coach
        </button>
      </div>

      {/* summary strip */}
      <div style={{ display: 'flex', gap: density.gap, marginBottom: density.gap, flexWrap: 'wrap' }}>
        {summary.map((m, i) => (
          <Card key={i} T={T} density={density} style={{ flex: '1 1 130px' }}>
            <div style={{ fontSize: 10.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.l}</div>
            <div className="tnum" style={{ fontSize: 24, fontWeight: 500, color: m.c, marginTop: 4 }}>{m.v}</div>
          </Card>
        ))}
      </div>

      {/* DBS / safeguarding attention */}
      {dbsFlagged.length > 0 && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 12, padding: '12px 16px', marginBottom: density.gap }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#F59E0B', marginBottom: 4 }}>⚠ DBS &amp; safeguarding attention needed</div>
          <div style={{ fontSize: 12, color: T.text2, lineHeight: 1.5 }}>
            {dbsFlagged.map(c => `${c.name} (${dbsState(dbsFor(c)).label})`).join(', ')}
          </div>
        </div>
      )}

      {/* role filter tabs */}
      <div style={{ display: 'flex', gap: 0, padding: 2, background: T.hover, borderRadius: 8, marginBottom: density.gap, width: 'fit-content', flexWrap: 'wrap' }}>
        {roles.map(r => (
          <button key={r} onClick={() => setRole(r)} style={{ appearance: 'none', border: 0, padding: '5px 12px', borderRadius: 6, fontSize: 11.5, cursor: 'pointer', background: role === r ? T.panel : 'transparent', color: role === r ? T.text : T.text2, fontWeight: role === r ? 600 : 400, boxShadow: role === r ? `0 0 0 1px ${T.border}` : 'none' }}>{r}</button>
        ))}
      </div>

      {/* directory grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: density.gap }}>
        {list.map(c => {
          const s = stats[c.id]
          return (
            <Card key={c.id} T={T} density={density} hover onClick={() => setSelId(c.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar accent={accent} initials={c.initials} size={40} seed={c.name} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                  <div style={{ marginTop: 3 }}><RoleBadge T={T} accent={accent} role={c.role} /></div>
                </div>
                <button onClick={e => { e.stopPropagation(); window.location.href = `tel:${contactPreset(c).phone?.replace(/\s+/g, '')}` }} title={`Call ${c.name} · ${contactPreset(c).phone}`}
                  style={{ appearance: 'none', border: `1px solid ${T.border}`, background: T.panel2, color: T.text2, borderRadius: 8, padding: '5px 8px', fontSize: 12, fontWeight: 700, fontFamily: FONT, cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}>📞</button>
                <button onClick={e => { e.stopPropagation(); setContact(contactPreset(c)) }} title={`Message ${c.name}`}
                  style={{ appearance: 'none', border: `1px solid ${accent.border}`, background: accent.dim, color: accent.hex, borderRadius: 8, padding: '5px 9px', fontSize: 11, fontWeight: 700, fontFamily: FONT, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                  <span style={{ fontSize: 12 }}>✉</span> Contact
                </button>
                <div title={c.status === 'active' ? 'Active' : 'On leave'} style={{ width: 9, height: 9, borderRadius: '50%', background: statusColour(T, c.status), flexShrink: 0 }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <span style={{ fontSize: 10.5, color: T.text3, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.accreditation}</span>
                <DbsBadge rec={dbsFor(c)} />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                {c.specialisms.map(sp => <Chip key={sp} T={T}>{sp}</Chip>)}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
                <MiniStat T={T} label="Today" value={s.today} c={accent.hex} />
                <MiniStat T={T} label="Week" value={s.week} />
                <MiniStat T={T} label="Players" value={s.players} />
                <MiniStat T={T} label="Util" value={`${s.utilisation}%`} c={s.utilisation >= 75 ? T.good : s.utilisation >= 40 ? T.warn : T.text2} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 10.5, color: T.text3 }}>{s.hoursBooked}h booked · {c.hoursPerWeek}h contracted</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: accent.hex, fontWeight: 600 }}>View →</span>
              </div>
            </Card>
          )
        })}
      </div>

      {addOpen && <AddCoachModal T={T} accent={accent} density={density} onClose={() => setAddOpen(false)} />}
      {contact && <CoachSendMessage T={T} accent={accent} preset={contact} onClose={() => setContact(null)} />}
    </div>
  )
}
