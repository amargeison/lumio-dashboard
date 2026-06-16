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
import { BELTS, type TodaySession } from '../_lib/coach-data'
import {
  COACHES, coachStats, playersForCoach, ALL_PLAYERS, ALL_BOOKINGS,
  type Coach, type CoachRole, type CoachStats,
} from '../_lib/coaches-data'
import { getCalendarItems } from '../_lib/schedule'
import { WeekCalendarGrid } from './WeekCalendar'
import { getAddedSessions, subscribe as subscribeSessions } from '../_lib/sessions-store'
import { getAddedCoaches, subscribe as subscribeCoaches } from '../_lib/coaches-store'
import { AddCoachModal } from './AddCoachModal'

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
function Avatar({ accent, initials, size = 40 }: { accent: AccentTokens; initials: string; size?: number }) {
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

// ════════════════════════════════════════════════════════════════════════════
export function StaffView({ T, accent, density, onNavigate }: Common & { onNavigate?: (s: string) => void }) {
  const [added, setAdded] = useState<TodaySession[]>([])
  useEffect(() => { const r = () => setAdded(getAddedSessions()); r(); return subscribeSessions(r) }, [])
  const [addedCoaches, setAddedCoaches] = useState<Coach[]>([])
  const [addOpen, setAddOpen] = useState(false)
  useEffect(() => { const r = () => setAddedCoaches(getAddedCoaches()); r(); return subscribeCoaches(r) }, [])

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
            <Avatar accent={accent} initials={sel.initials} size={50} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 19, fontWeight: 600, color: T.text }}>{sel.name}</span>
                <RoleBadge T={T} accent={accent} role={sel.role} />
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: T.text3 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColour(T, sel.status) }} />{sel.status === 'active' ? 'Active' : 'On leave'}
                </span>
              </div>
              <div style={{ fontSize: 12, color: T.text3, marginTop: 2 }}>{sel.accreditation} · {sel.availability} · {sel.hoursPerWeek}h/wk · {sel.homeVenue}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                {sel.specialisms.map(sp => <Chip key={sp} T={T}>{sp}</Chip>)}
              </div>
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
                  <Avatar accent={accent} initials={p.initials} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    <div style={{ fontSize: 10.5, color: T.text3 }}>{p.group} · Age {p.age}</div>
                  </div>
                  <span style={{ width: 16, height: 10, borderRadius: 2, background: BELTS[p.beltIndex]?.colour ?? T.border, border: '1px solid rgba(128,128,128,0.4)', flexShrink: 0 }} />
                </div>
                <div style={{ fontSize: 11, color: T.text3, marginTop: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>🎯 {p.goal}</div>
              </Card>
            ))}
          </div>
        ) : <div style={{ fontSize: 12, color: T.text3 }}>No players currently assigned.</div>}
      </div>
    )
  }

  // ─── DIRECTORY ─────────────────────────────────────────────────────────────
  const list = role === 'All' ? coaches : coaches.filter(c => c.role === role)
  const roles: ('All' | CoachRole)[] = ['All', 'Head', 'Senior', 'Coach', 'Assistant', 'Apprentice']

  const sumHours = coaches.reduce((a, c) => a + stats[c.id].hoursBooked, 0)
  const sumCap = coaches.reduce((a, c) => a + c.hoursPerWeek, 0)
  const summary = [
    { l: 'Coaches', v: coaches.length, c: T.text },
    { l: 'On leave', v: coaches.filter(c => c.status === 'leave').length, c: T.warn },
    { l: 'Players', v: ALL_PLAYERS.length, c: accent.hex },
    { l: 'Sessions this week', v: ALL_BOOKINGS.filter(b => b.status !== 'cancelled').length, c: T.text },
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
                <Avatar accent={accent} initials={c.initials} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                  <div style={{ marginTop: 3 }}><RoleBadge T={T} accent={accent} role={c.role} /></div>
                </div>
                <div title={c.status === 'active' ? 'Active' : 'On leave'} style={{ width: 9, height: 9, borderRadius: '50%', background: statusColour(T, c.status), flexShrink: 0 }} />
              </div>
              <div style={{ fontSize: 10.5, color: T.text3, marginTop: 10 }}>{c.accreditation}</div>
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
    </div>
  )
}
