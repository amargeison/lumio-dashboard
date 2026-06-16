'use client'

// Shared week calendar grid — the single rendering of the booking/session week
// used by BOTH the Booking Calendar page (CoachModules → CalendarView) and the
// Session Planner (This week + the Overview embed). Feed it a unified, dated
// CalItem[] so the two views are genuinely the same data, not a copy.

import { type ReactNode, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'
import { WEEK_DAYS, DAY_DATES, CAL_HOURS, dateForDay, TODAY } from '../_lib/coach-data'
import { dayIndexForDate, type CalItem } from '../_lib/schedule'

// Colour by activity type — identical mapping to the original Booking Calendar.
export function bookingTypeColour(T: ThemeTokens, accent: AccentTokens, t: string) {
  return t === 'Private' ? accent.hex : t === 'Group' ? '#3A8EE0' : t === 'Cardio' ? T.warn : t === 'Match play' ? T.good : T.text3
}

// Readable day label for an agenda row. In-week dates use the demo week's
// "Mon 8" form (consistent with the grid header); dates beyond the week format
// to "Fri 20 Jun" so the 30-day Month view reads cleanly.
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export function agendaDayLabel(date: string): string {
  const i = dayIndexForDate(date)
  if (i >= 0) return `${WEEK_DAYS[i]} ${DAY_DATES[i]}`
  const d = new Date(date + 'T00:00:00')
  if (isNaN(d.getTime())) return date
  return `${WD[d.getDay()]} ${d.getDate()} ${MO[d.getMonth()]}`
}

// Agenda (grouped-by-day list) — the SINGLE month-view rendering, shared by the
// Booking Calendar's Month tab and the Session Planner's "This month" tab so the
// two stay consistent. Each caller passes pre-grouped, pre-labelled days; the
// optional itemBadge lets the planner add its "Build" tag without this component
// knowing about sessions. Lighter than a full month grid and naturally
// mobile-friendly (vertical cards), which the dense week grid is not.
export function MonthAgenda({ T, accent, groups, onItemClick, itemBadge, empty }: {
  T: ThemeTokens; accent: AccentTokens
  groups: { date: string; label: string; items: CalItem[] }[]
  onItemClick?: (it: CalItem) => void
  itemBadge?: (it: CalItem) => ReactNode
  empty?: string
}) {
  if (!groups.length) return <div style={{ fontSize: 12.5, color: T.text3, fontStyle: 'italic', padding: '18px 4px' }}>{empty ?? 'No bookings in this range.'}</div>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {groups.map(g => (
        <div key={g.date} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 10, gap: 8 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{g.label}</div>
            <div style={{ marginLeft: 'auto', fontSize: 11, color: T.text3, fontFamily: FONT_MONO }}>{g.items.length}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {g.items.map(it => {
              const base: CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 11px', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, textAlign: 'left', width: '100%' }
              const row = (
                <>
                  <span className="tnum" style={{ fontSize: 11.5, color: T.text2, fontFamily: FONT_MONO, width: 92, flexShrink: 0 }}>{it.start}–{it.end}</span>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: bookingTypeColour(T, accent, it.type), flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: T.text, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.player}</span>
                  <span style={{ fontSize: 11, color: T.text3 }}>{it.type} · {it.court}</span>
                  {itemBadge?.(it)}
                </>
              )
              return onItemClick
                ? <button key={it.key} onClick={() => onItemClick(it)} style={{ appearance: 'none', cursor: 'pointer', ...base }}>{row}</button>
                : <div key={it.key} style={base}>{row}</div>
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// The inner grid (header + hour rows). Callers wrap it in a Card. When
// onItemClick is provided, blocks become clickable (cursor + handler); when it
// is omitted the render is byte-identical to the static Booking Calendar.
export function WeekCalendarGrid({ T, accent, items, onItemClick }: {
  T: ThemeTokens; accent: AccentTokens; density?: Density
  items: CalItem[]; onItemClick?: (it: CalItem) => void
}) {
  const hourIdx = (hhmm: string) => CAL_HOURS.indexOf(hhmm.slice(0, 2) + ':00')
  const rowH = 46
  return (
    <div style={{ minWidth: 680 }}>
      {/* header */}
      <div style={{ display: 'grid', gridTemplateColumns: `60px repeat(7, 1fr)`, borderBottom: `1px solid ${T.border}` }}>
        <div />
        {WEEK_DAYS.map((d, i) => (
          <div key={d} style={{ padding: '10px 6px', textAlign: 'center', borderLeft: `1px solid ${T.border}`, background: dateForDay(i) === TODAY ? accent.dim : 'transparent' }}>
            <div style={{ fontSize: 11, color: dateForDay(i) === TODAY ? accent.hex : T.text2, fontWeight: 600 }}>{d}</div>
            <div className="tnum" style={{ fontSize: 16, color: dateForDay(i) === TODAY ? accent.hex : T.text, fontWeight: 600 }}>{DAY_DATES[i]}</div>
          </div>
        ))}
      </div>
      {/* grid */}
      <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: `60px repeat(7, 1fr)` }}>
        {/* hour rows */}
        <div>
          {CAL_HOURS.map(h => <div key={h} style={{ height: rowH, fontSize: 10, color: T.text3, fontFamily: FONT_MONO, padding: '2px 6px', textAlign: 'right' }}>{h}</div>)}
        </div>
        {WEEK_DAYS.map((_d, di) => (
          <div key={di} style={{ position: 'relative', borderLeft: `1px solid ${T.border}` }}>
            {CAL_HOURS.map(h => <div key={h} style={{ height: rowH, borderTop: `1px solid ${T.border}` }} />)}
            {items.filter(it => dayIndexForDate(it.date) === di).map(it => {
              const top = hourIdx(it.start) * rowH + (parseInt(it.start.slice(3)) / 60) * rowH
              const endTop = hourIdx(it.end) * rowH + (parseInt(it.end.slice(3)) / 60) * rowH
              const c = bookingTypeColour(T, accent, it.type)
              return (
                <div key={it.key} onClick={onItemClick ? () => onItemClick(it) : undefined}
                  style={{ position: 'absolute', left: 3, right: 3, top: top + 1, height: Math.max(endTop - top - 2, 22), background: it.status === 'pending' ? `${c}14` : `${c}26`, border: `1px solid ${c}`, borderLeft: `3px solid ${c}`, borderRadius: 6, padding: '3px 6px', overflow: 'hidden', opacity: it.status === 'cancelled' ? 0.4 : 1, cursor: onItemClick ? 'pointer' : 'default' }}>
                  <div style={{ fontSize: 10.5, color: T.text, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.player}</div>
                  <div style={{ fontSize: 9, color: T.text2, fontFamily: FONT_MONO }}>{it.start}–{it.end} · {it.court}</div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
