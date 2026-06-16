'use client'

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT, FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { VENUES, type CourtStatus, type Venue } from '../_lib/coach-data'
import { getAddedVenues, subscribe as subscribeVenues } from '../_lib/venues-store'
import { AddVenueModal } from './AddVenueModal'

type Common = { T: ThemeTokens; accent: AccentTokens; density: Density }

function Card({ T, density, children, style }: { T: ThemeTokens; density: Density; children: ReactNode; style?: CSSProperties }) {
  return <div style={{ position: 'relative', background: T.panel, border: `1px solid ${T.border}`, borderRadius: density.radius, padding: density.pad, boxShadow: T.cardShadow, ...style }}>{children}</div>
}

export function CourtPlannerView({ T, accent, density }: Common) {
  const statusColour = (s: CourtStatus) => s === 'free' ? T.good : s === 'lesson' ? accent.hex : s === 'booked' ? T.warn : T.bad
  const statusLabel = (s: CourtStatus) => s === 'free' ? 'Free' : s === 'lesson' ? 'Your lesson' : s === 'booked' ? 'Booked' : 'Maintenance'

  const [addedVenues, setAddedVenues] = useState<Venue[]>([])
  const [addOpen, setAddOpen] = useState(false)
  useEffect(() => { const r = () => setAddedVenues(getAddedVenues()); r(); return subscribeVenues(r) }, [])

  const venues = [...VENUES, ...addedVenues]
  const allCourts = venues.flatMap(v => v.courts)
  const freeNow = allCourts.filter(c => c.status === 'free').length
  const yours = allCourts.filter(c => c.status === 'lesson').length

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: FONT, fontSize: 24, fontWeight: 600, color: T.text, letterSpacing: '-0.02em' }}>Court Planner</h1>
          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: T.text3 }}>The sites you coach across — contacts, facilities and live court availability. (Customer bookings live in the Booking Calendar.)</p>
        </div>
        <button onClick={() => setAddOpen(true)} style={{ marginLeft: 'auto', appearance: 'none', border: 0, padding: '8px 14px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 12.5, fontWeight: 600, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <Icon name="plus" size={14} stroke={2} /> Add venue
        </button>
      </div>

      {/* summary */}
      <div style={{ display: 'flex', gap: density.gap, marginBottom: density.gap, flexWrap: 'wrap' }}>
        {[
          { l: 'Sites', v: venues.length, c: T.text },
          { l: 'Courts total', v: allCourts.length, c: T.text },
          { l: 'Free right now', v: freeNow, c: T.good },
          { l: 'Your lessons on', v: yours, c: accent.hex },
        ].map((m, i) => (
          <Card key={i} T={T} density={density} style={{ flex: '1 1 140px' }}>
            <div style={{ fontSize: 10.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.l}</div>
            <div className="tnum" style={{ fontSize: 24, fontWeight: 500, color: m.c, marginTop: 4 }}>{m.v}</div>
          </Card>
        ))}
      </div>

      {/* venues */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: density.gap }} className="cm-venues">
        {venues.map(v => (
          <Card key={v.id} T={T} density={density}>
            {/* header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 9, display: 'grid', placeItems: 'center', background: accent.dim, flexShrink: 0 }}>
                <Icon name="pin" size={18} stroke={1.7} style={{ color: accent.hex }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14.5, fontWeight: 600, color: T.text }}>{v.name}</span>
                  {v.primary && <span style={{ fontSize: 8.5, fontWeight: 700, color: accent.hex, background: accent.dim, padding: '1px 6px', borderRadius: 4, letterSpacing: '0.05em' }}>HOME BASE</span>}
                </div>
                <div style={{ fontSize: 11, color: T.text3 }}>{v.type} · {v.distance}</div>
                <div style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>{v.address}</div>
              </div>
            </div>

            {/* contact */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              <div style={{ flex: '1 1 180px', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 11px' }}>
                <div style={{ fontSize: 9.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Site contact</div>
                <div style={{ fontSize: 12.5, color: T.text, fontWeight: 600, marginTop: 2 }}>{v.manager}</div>
                <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                  <a href={`tel:${v.managerPhone.replace(/\s/g, '')}`} style={{ fontSize: 11.5, color: accent.hex, textDecoration: 'none' }}>{v.managerPhone}</a>
                  <a href={`mailto:${v.managerEmail}`} style={{ fontSize: 11.5, color: accent.hex, textDecoration: 'none', wordBreak: 'break-all' }}>{v.managerEmail}</a>
                </div>
              </div>
            </div>

            {/* facilities */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
              {v.facilities.map((f, i) => <span key={i} style={{ fontSize: 10.5, color: T.text2, padding: '3px 8px', borderRadius: 6, background: T.hover, border: `1px solid ${T.border}` }}>{f}</span>)}
            </div>

            {/* access */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 11, color: T.text3, marginBottom: 12 }}>
              <Icon name="shield" size={12} stroke={1.7} style={{ color: T.text3, flexShrink: 0, marginTop: 1 }} />
              <span>{v.access}</span>
            </div>

            {/* court status */}
            <div style={{ fontSize: 10.5, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              Courts today · {v.courts.filter(c => c.status === 'free').length} free
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 7 }}>
              {v.courts.map((c, i) => {
                const col = statusColour(c.status)
                return (
                  <div key={i} style={{ background: `${col}14`, border: `1px solid ${col}55`, borderLeft: `3px solid ${col}`, borderRadius: 7, padding: '7px 9px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{c.name}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 8.5, fontWeight: 700, color: col, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{statusLabel(c.status)}</span>
                    </div>
                    <div style={{ fontSize: 9.5, color: T.text3, marginTop: 2 }}>
                      {c.surface}{c.indoor ? ' · indoor' : ''}{c.lights ? ' · lights' : ''}
                    </div>
                    {(c.until || c.who) && <div style={{ fontSize: 9.5, color: T.text3, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.who}{c.until ? ` · til ${c.until}` : ''}</div>}
                  </div>
                )
              })}
            </div>
          </Card>
        ))}
      </div>

      {/* legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 14, flexWrap: 'wrap', fontSize: 10.5, color: T.text3 }}>
        {(['free', 'lesson', 'booked', 'maintenance'] as CourtStatus[]).map(s => (
          <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: statusColour(s) }} />{statusLabel(s)}</span>
        ))}
      </div>

      {addOpen && <AddVenueModal T={T} accent={accent} density={density} onClose={() => setAddOpen(false)} />}
    </div>
  )
}
