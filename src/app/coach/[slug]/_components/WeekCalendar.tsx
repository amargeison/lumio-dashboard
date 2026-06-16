'use client'

// Shared week calendar grid — the single rendering of the booking/session week
// used by BOTH the Booking Calendar page (CoachModules → CalendarView) and the
// Session Planner (This week + the Overview embed). Feed it a unified, dated
// CalItem[] so the two views are genuinely the same data, not a copy.

import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'
import { WEEK_DAYS, DAY_DATES, CAL_HOURS, dateForDay, TODAY } from '../_lib/coach-data'
import { dayIndexForDate, type CalItem } from '../_lib/schedule'

// Colour by activity type — identical mapping to the original Booking Calendar.
export function bookingTypeColour(T: ThemeTokens, accent: AccentTokens, t: string) {
  return t === 'Private' ? accent.hex : t === 'Group' ? '#3A8EE0' : t === 'Cardio' ? T.warn : t === 'Match play' ? T.good : T.text3
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
