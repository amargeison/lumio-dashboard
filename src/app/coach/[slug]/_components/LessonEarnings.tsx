'use client'

// Payments → Lessons & courts. What a month's lessons are worth, what the
// courts cost, and what is left — with the court hours at each venue, so a
// venue's monthly invoice ("14 court hours at £10") can be checked against
// what was actually booked.
//
// Every booking is priced the same way the calendar prices it
// (src/lib/coach/pricing.ts). Cancelled bookings and blocks are left out; a
// lesson still to come this month is counted, and said to be.

import { useMemo, useState, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { useCoachTable } from '../_lib/coach-db'
import { useCoachSettings } from '../_lib/use-settings'
import { priceFor, courtCostFor, BILLING_LABEL, type CourtBilling } from '@/lib/coach/pricing'
import { formatPennies } from '@/lib/coach/money'
import { ukDate, ukMonth } from '@/lib/coach/uk-date'

type Bk = { id: string; player_id?: string | null; booking_date?: string | null; type?: string | null; status?: string | null; venue_id?: string | null; duration_min?: number | null; price_pennies?: number | null; headcount?: number | null }
type Venue = { id: string; name: string; court_cost_pennies?: number | null; court_billing?: string | null }
type Player = { id: string; rate_pennies?: number | null; rate_reason?: string | null }

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const shift = (ym: string, by: number) => {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + by, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}
const label = (ym: string) => { const [y, m] = ym.split('-').map(Number); return `${MONTHS[m - 1]} ${y}` }
const hrs = (mins: number) => { const h = mins / 60; return `${Number.isInteger(h) ? h : h.toFixed(1)} hr${h === 1 ? '' : 's'}` }

export function LessonEarnings({ T, accent }: { T: ThemeTokens; accent: AccentTokens }) {
  const s = useCoachSettings()
  const bookings = useCoachTable<Bk>('coach_bookings')
  const { rows: venues } = useCoachTable<Venue>('coach_venues')
  const { rows: players } = useCoachTable<Player>('coach_players')
  const thisMonth = ukMonth()
  const [month, setMonth] = useState(thisMonth)

  const sum = useMemo(() => {
    const today = ukDate()
    const venueOf = (id?: string | null) => venues.find(v => v.id === id) || null
    const rows = bookings.rows.filter(b => (b.booking_date || '').slice(0, 7) === month && b.status !== 'cancelled' && b.type !== 'Block')
    let value = 0, court = 0, unpriced = 0, upcoming = 0
    const per = new Map<string, { name: string; lessons: number; mins: number; court: number; value: number; billing: string }>()
    for (const b of rows) {
      const p = priceFor(b, { rules: s.priceList || [], client: players.find(x => x.id === b.player_id) || null, defaultHourly: s.privateRate })
      const v = venueOf(b.venue_id)
      const c = courtCostFor(b, v)
      value += p.total; court += c
      if (!p.total && p.source !== 'booking') unpriced++
      if ((b.booking_date || '') > today) upcoming++
      const key = v?.id || ''
      const row = per.get(key) || { name: v?.name || 'No venue set', lessons: 0, mins: 0, court: 0, value: 0, billing: v?.court_billing || '' }
      row.lessons++; row.mins += Math.max(5, Math.min(600, Number(b.duration_min) || 60)); row.court += c; row.value += p.total
      per.set(key, row)
    }
    return { count: rows.length, value, court, unpriced, upcoming, venues: Array.from(per.values()).sort((a, b) => b.lessons - a.lessons) }
  }, [bookings.rows, venues, players, s.priceList, s.privateRate, month])

  const tile: CSSProperties = { background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 14px', minWidth: 0 }
  const tl: CSSProperties = { fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }
  const tv: CSSProperties = { fontSize: 22, fontWeight: 700, marginTop: 4, fontVariantNumeric: 'tabular-nums' }
  const arrow: CSSProperties = { appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 8, minWidth: 36, minHeight: 36, cursor: 'pointer', fontSize: 14, fontFamily: FONT }
  const th: CSSProperties = { textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '6px 8px', whiteSpace: 'nowrap' }
  const td: CSSProperties = { fontSize: 12, color: T.text2, padding: '8px', borderTop: `1px solid ${T.border}`, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }
  const margin = sum.value - sum.court

  return (
    <div data-testid="lesson-earnings" style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, marginBottom: 16, fontFamily: FONT }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>Lessons &amp; courts</div>
        <span style={{ fontSize: 11.5, color: T.text3 }}>What your booked lessons are worth, less what the courts cost.</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <button aria-label="Previous month" onClick={() => setMonth(m => shift(m, -1))} style={arrow}>‹</button>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: T.text, minWidth: 116, textAlign: 'center' }}>{label(month)}</span>
          <button aria-label="Next month" onClick={() => setMonth(m => shift(m, 1))} style={arrow}>›</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
        <div style={tile}><div style={tl}>Lessons</div><div style={{ ...tv, color: T.text }}>{sum.count}</div></div>
        <div style={tile}><div style={tl}>Lesson value</div><div style={{ ...tv, color: T.text }}>{formatPennies(sum.value)}</div></div>
        <div style={tile}><div style={tl}>Court costs</div><div style={{ ...tv, color: T.text }}>{formatPennies(sum.court)}</div></div>
        <div style={tile}><div style={tl}>You make</div><div style={{ ...tv, color: margin >= 0 ? T.good : T.bad }}>{formatPennies(margin)}</div></div>
      </div>
      <div style={{ fontSize: 11.5, color: T.text3, lineHeight: 1.55, marginTop: 8 }}>
        {sum.count === 0 ? `No lessons booked in ${label(month)}.` : <>
          {month === thisMonth && sum.upcoming > 0 && <span>Includes {sum.upcoming} lesson{sum.upcoming === 1 ? '' : 's'} still to come. </span>}
          {sum.unpriced > 0 && <span style={{ color: T.warn }}>{sum.unpriced} lesson{sum.unpriced === 1 ? ' has' : 's have'} no price, so {sum.unpriced === 1 ? 'it is' : 'they are'} counted as £0. Set your prices in Settings → Pricing &amp; packages. </span>}
          This is what the lessons are worth, not what has been paid.
        </>}
      </div>

      {sum.venues.length > 0 && (
        <div style={{ overflowX: 'auto', marginTop: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
            <thead><tr><th style={th}>Venue</th><th style={th}>Lessons</th><th style={th}>Court hours</th><th style={th}>Court cost</th><th style={th}>Paid how</th><th style={th}>Lesson value</th><th style={th}>You make</th></tr></thead>
            <tbody>
              {sum.venues.map(v => (
                <tr key={v.name}>
                  <td style={{ ...td, color: T.text, fontWeight: 600 }}>{v.name}</td>
                  <td style={td}>{v.lessons}</td>
                  <td style={td}>{hrs(v.mins)}</td>
                  <td style={td}>{v.billing === 'free' ? 'Free' : v.court ? formatPennies(v.court) : '—'}</td>
                  <td style={{ ...td, color: T.text3 }}>{v.billing && v.billing in BILLING_LABEL ? BILLING_LABEL[v.billing as CourtBilling] : 'Not set'}</td>
                  <td style={td}>{formatPennies(v.value)}</td>
                  <td style={{ ...td, color: v.value - v.court >= 0 ? T.good : T.bad, fontWeight: 600 }}>{formatPennies(v.value - v.court)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize: 11, color: T.text3, marginTop: 6 }}>Court hours count one court for each booking&rsquo;s length. Set what a court costs at each venue in Venues &amp; courts.</div>
        </div>
      )}
    </div>
  )
}
