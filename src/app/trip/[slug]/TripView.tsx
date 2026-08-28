'use client'

// The trip hub, as a player or parent sees it.
//
// Designed for a phone in an airport, not a laptop at a desk. That drives every
// decision here: the countdown and the contacts are near the top because they
// are what somebody opens this for on the day; sections collapse so the page is
// scannable rather than a wall; the coach's number is a tap-to-call link.
//
// It renders only what exists. An empty "Travel" heading reads as information
// withheld, which is worse than no heading at all.

import { useEffect, useState } from 'react'
import type { Trip, TripContact, TripSection, TripPlace } from '@/lib/coach/trip'
import { mapEmbedUrl, mapLinkUrl, safeUrl } from '@/lib/coach/trip'

export type TripDay = {
  day: number; theme: string; rest: boolean
  sessions: { slot: string; time: string; title: string }[]
}

export type TripPublic = {
  campName: string
  academy: string
  logoUrl: string | null
  coachName: string | null
  startDate: string | null
  endDate: string | null
  location: string | null
  flag: string
  overseas: boolean
  adult: boolean
  trip: Trip
  days: TripDay[]
}

const ACCENT = '#3A8EE0'
const fmt = (d: string | null) =>
  d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
const telHref = (p: string) => `tel:${p.replace(/[^\d+]/g, '')}`

export default function TripView({ trip: t }: { trip: TripPublic }) {
  const d = t.trip || {}

  // Rendered after mount only. Days-to-go computed on the server would be the
  // server's timezone and could show "tomorrow" to somebody for whom it is
  // today — and it would mismatch on hydration.
  const [countdown, setCountdown] = useState<string | null>(null)
  useEffect(() => {
    if (!t.startDate) return
    const start = new Date(`${t.startDate}T00:00:00`).getTime()
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const days = Math.round((start - today.getTime()) / 86_400_000)
    setCountdown(
      days > 1 ? `${days} days to go`
        : days === 1 ? 'Tomorrow'
        : days === 0 ? 'Today'
        : t.endDate && new Date(`${t.endDate}T00:00:00`).getTime() >= today.getTime() ? 'On now'
        : null,
    )
  }, [t.startDate, t.endDate])

  const when = [fmt(t.startDate), t.endDate && t.endDate !== t.startDate ? fmt(t.endDate) : ''].filter(Boolean).join(' – ')
  const contacts = (d.contacts || []).filter(c => c?.name)

  return (
    <div style={{ minHeight: '100vh', background: '#eef0f5', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif', color: '#1a1d29' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 14px 56px' }}>

        {/* ── Hero ── */}
        <header style={{ background: `linear-gradient(150deg, ${ACCENT}, ${ACCENT}bb)`, color: '#fff', borderRadius: '0 0 20px 20px', padding: '26px 22px 24px', margin: '0 -14px 16px' }}>
          {t.logoUrl && (
            <img src={t.logoUrl} alt="" style={{ height: 40, maxWidth: 140, background: '#fff', borderRadius: 9, padding: 6, marginBottom: 12 }} />
          )}
          <div style={{ fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', opacity: .85 }}>{t.academy}</div>
          <h1 style={{ margin: '6px 0 0', fontSize: 26, lineHeight: 1.2, fontWeight: 700, textWrap: 'balance' }}>
            {t.flag && <span aria-hidden style={{ marginRight: 9 }}>{t.flag}</span>}{t.campName}
          </h1>
          <div style={{ fontSize: 14.5, opacity: .92, marginTop: 8, lineHeight: 1.5 }}>
            {when}
            {t.location && <><br />{t.location}</>}
          </div>
          {countdown && (
            <div style={{ display: 'inline-block', marginTop: 14, background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.3)', borderRadius: 999, padding: '6px 14px', fontSize: 13, fontWeight: 700 }}>
              {countdown}
            </div>
          )}
        </header>

        {d.intro && (
          <Card>
            <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.65, color: '#374151' }}>{d.intro}</p>
          </Card>
        )}

        {/* Contacts sit high on purpose — it is what this page gets opened for
            when something has gone wrong. */}
        {contacts.length > 0 && (
          <Card title="Who to call">
            {contacts.map((c, i) => <Contact key={i} c={c} />)}
          </Card>
        )}

        <Facts title="Where you're staying" o={d.stay} labels={{
          name: 'Hotel', address: 'Address', checkIn: 'Check-in', rooms: 'Rooms', meals: 'Meals', wifi: 'Wi-Fi', notes: '',
        }} mapField="address" />

        <Facts title="Where you're playing" o={d.venue} labels={{
          name: 'Venue', address: 'Address', courts: 'Courts', facilities: 'Facilities', notes: '',
        }} mapField="address" />

        <Facts title="Getting there" o={d.travel} labels={{
          airport: 'Airport', flights: 'Flights', transfers: 'Transfers', arrival: 'Arriving', departure: 'Leaving', notes: '',
        }} />

        {(d.transport || []).length > 0 && (
          <Card title="Getting around">
            {(d.transport || []).map((p, i) => <Place key={i} p={p} />)}
          </Card>
        )}

        {(d.eating || []).length > 0 && (
          <Card title="Eating">
            {(d.eating || []).map((p, i) => <Place key={i} p={p} />)}
          </Card>
        )}

        {(d.bring || []).length > 0 && (
          <Card title="What to bring">
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {(d.bring || []).map((x, i) => (
                <li key={i} style={{ fontSize: 15, lineHeight: 1.65, color: '#374151', marginBottom: 5 }}>{x}</li>
              ))}
            </ul>
            {t.overseas && (
              <p style={{ margin: '12px 0 0', fontSize: 13.5, lineHeight: 1.6, color: '#7c4a03', background: '#fff7ed', border: '1px solid #fcd9a8', borderRadius: 9, padding: '10px 12px' }}>
                {t.adult
                  ? 'You are travelling abroad — check your passport is in date and that your travel insurance covers sport.'
                  : 'This trip is abroad — check passports are in date and that travel insurance covers sport.'}
              </p>
            )}
          </Card>
        )}

        {t.days.length > 0 && (
          <Card title="The week">
            {t.days.map(day => (
              <div key={day.day} style={{ display: 'flex', gap: 13, padding: '11px 0', borderTop: day.day > 1 ? '1px solid #eef0f5' : 'none' }}>
                <div style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 9, background: day.rest ? '#f1faf4' : '#eef4fb', color: day.rest ? '#31543f' : ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
                  {day.day}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1d29' }}>
                    {day.theme || (day.rest ? 'Rest day' : `Day ${day.day}`)}
                  </div>
                  {day.sessions.length > 0 && (
                    <div style={{ fontSize: 13.5, color: '#6b7280', marginTop: 3, lineHeight: 1.6 }}>
                      {day.sessions.map((s, i) => (
                        <span key={i}>{i > 0 && ' · '}{s.time ? `${s.time} ` : ''}{s.title}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </Card>
        )}

        <Facts title="Good to know" o={d.practical} labels={{
          currency: 'Money', weather: 'Weather', timeDifference: 'Time difference', plugs: 'Plugs', health: 'Health', notes: '',
        }} />

        {(d.sections || []).map((s: TripSection, i: number) => (
          <Card key={i} title={s.title}>
            {s.body && <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: '#374151' }}>{s.body}</p>}
            {(s.items || []).length > 0 && (
              <ul style={{ margin: s.body ? '10px 0 0' : 0, paddingLeft: 20 }}>
                {(s.items || []).map((x, j) => (
                  <li key={j} style={{ fontSize: 15, lineHeight: 1.65, color: '#374151', marginBottom: 5 }}>{x}</li>
                ))}
              </ul>
            )}
          </Card>
        ))}

        <p style={{ textAlign: 'center', fontSize: 12.5, color: '#9aa1b1', marginTop: 26, lineHeight: 1.6 }}>
          Anything missing or not right? {t.coachName ? `Ask ${t.coachName}.` : 'Ask your coach.'}
          <br />Powered by Lumio
        </p>
      </div>
    </div>
  )
}

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section style={{ background: '#fff', borderRadius: 14, padding: '18px 18px', marginBottom: 12, boxShadow: '0 1px 3px rgba(20,25,40,.06)' }}>
      {title && <h2 style={{ margin: '0 0 12px', fontSize: 12, letterSpacing: '.12em', textTransform: 'uppercase', color: '#8b93a7', fontWeight: 700 }}>{title}</h2>}
      {children}
    </section>
  )
}

function Contact({ c }: { c: TripContact }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderTop: '1px solid #f4f6fa' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{c.name}</div>
        {(c.role || c.note) && (
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 1, lineHeight: 1.5 }}>{[c.role, c.note].filter(Boolean).join(' · ')}</div>
        )}
      </div>
      {c.phone && (
        // Tap to call. On the day, this is the only interaction that matters.
        <a href={telHref(c.phone)} style={{ flexShrink: 0, textDecoration: 'none', background: '#eef4fb', color: ACCENT, borderRadius: 9, padding: '9px 14px', fontSize: 14, fontWeight: 700 }}>
          Call
        </a>
      )}
    </div>
  )
}

/** A block of label/value facts, rendering only the keys that have a value. */
function Facts({ title, o, labels, mapField }: {
  title: string
  o?: Record<string, string | undefined>
  labels: Record<string, string>
  mapField?: string
}) {
  if (!o) return null
  const rows = Object.entries(labels)
    .map(([k, label]) => [k, label, (o[k] || '').trim()] as const)
    // `url` is rendered as a link below rather than as a row of text, so it is
    // excluded here even though it is not in `labels` — belt and braces.
    .filter(([k, , v]) => v && k !== 'url')
  const site = safeUrl(o.url)
  const address = mapField ? (o[mapField] || '').trim() : ''
  if (!rows.length && !site && !address) return null

  return (
    <Card title={title}>
      {rows.map(([k, label, v]) => (
        <div key={k} style={{ display: 'flex', gap: 12, padding: '7px 0', borderTop: '1px solid #f4f6fa', flexWrap: 'wrap' }}>
          {label && <div style={{ width: 120, flexShrink: 0, fontSize: 13, color: '#6b7280' }}>{label}</div>}
          <div style={{ flex: 1, minWidth: 180, fontSize: 15, lineHeight: 1.6, color: '#374151' }}>{v}</div>
        </div>
      ))}

      {(site || address) && (
        <div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap' }}>
          {site && <a href={site} target="_blank" rel="noopener noreferrer" style={linkStyle}>Website ↗</a>}
          {address && <a href={mapLinkUrl(address)} target="_blank" rel="noopener noreferrer" style={linkStyle}>Open in Maps ↗</a>}
        </div>
      )}

      {/* The map is the thing somebody actually wants at 1am in a taxi. The
          link above stays regardless, so a blocked iframe is an inconvenience
          rather than a dead end. */}
      {address && (
        <div style={{ marginTop: 12, borderRadius: 11, overflow: 'hidden', border: '1px solid #eef0f5', lineHeight: 0 }}>
          <iframe
            title={`${title} map`}
            src={mapEmbedUrl(address)}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            style={{ width: '100%', height: 220, border: 0 }}
          />
        </div>
      )}
    </Card>
  )
}

const linkStyle: React.CSSProperties = { fontSize: 13.5, color: ACCENT, textDecoration: 'none', fontWeight: 600 }

/**
 * Somewhere the coach recommends — a restaurant, a taxi firm, a supermarket.
 *
 * The note is given the most room on purpose. Anyone can find a restaurant in
 * the Algarve; "the one we book for the last night, ask for the terrace" is the
 * part that is worth having.
 */
function Place({ p }: { p: TripPlace }) {
  const site = safeUrl(p.url)
  return (
    <div style={{ padding: '11px 0', borderTop: '1px solid #f4f6fa' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 15.5, fontWeight: 600 }}>{p.name}</span>
        {p.kind && (
          <span style={{ fontSize: 11, color: '#6b7280', background: '#f4f6fa', borderRadius: 4, padding: '2px 7px' }}>{p.kind}</span>
        )}
      </div>
      {p.note && <p style={{ margin: '5px 0 0', fontSize: 14.5, lineHeight: 1.6, color: '#374151' }}>{p.note}</p>}
      {p.address && <div style={{ fontSize: 13.5, color: '#6b7280', marginTop: 4 }}>{p.address}</div>}
      <div style={{ display: 'flex', gap: 14, marginTop: 7, flexWrap: 'wrap' }}>
        {p.phone && <a href={telHref(p.phone)} style={linkStyle}>Call {p.phone}</a>}
        {p.address && <a href={mapLinkUrl(p.address)} target="_blank" rel="noopener noreferrer" style={linkStyle}>Maps ↗</a>}
        {site && <a href={site} target="_blank" rel="noopener noreferrer" style={linkStyle}>Website ↗</a>}
      </div>
    </div>
  )
}
