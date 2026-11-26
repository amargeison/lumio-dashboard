'use client'

// HQ → Community (/impact/<slug>, sidebar NETWORK, module 'community'). Families at the
// weekend community sessions, whether they came from a school or signed up at /join:
//   tiles · the sign-up link · venue cards (capacity, last session, next date, QR poster)
//   · the families list (filters, search, a family's visits, QR and venue) · actions
//   (message this list, invite those with no login, mark lapsed with a preview)
//   · the waiting list (offer a place).
// Live data comes from people.community (hq-load + buildPeople); the demo is the
// hand-written Rally Ten set in src/data/impact/demo-community.ts and writes nothing.

import React, { useMemo, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { HeartHandshake, MapPin, Printer, Search, Send, UserPlus, Moon, Copy, ExternalLink, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { Card, SectionTitle, Stat, Pill, Modal, formField, formLabel, buttonPrimary, buttonSecondary } from './ui'
import { TP_DARK, TP_RED } from '@/data/tenproject/demo-data'
import { useImpact, type CommunityVenue } from './ImpactDataContext'
import { SendMessageWizard } from './CommsTab'
import QrCode from './QrCode'
import { currentHq, impactFetch } from '@/lib/impact/org-scope'
import { communityTiles, inCommunity, lapsePreview, sourceOf, statusOf, visitsBy, type CommunityFamily, type CommunityStatus, type CommunitySource, type Visit } from '@/lib/impact/community'
import { joinUrl, markLapsed, moveVenue, nextDateFor, offerPlace, setCapacity } from '@/lib/impact/community-actions'
import { termOf } from '@/lib/impact/term'
import { privacyUrlOf } from '@/lib/impact/org'
import { VENUES as DEMO_VENUES } from '@/data/impact/demo-data'
import { DEMO_COMMUNITY, DEMO_COMMUNITY_CAPACITY } from '@/data/impact/demo-community'

const sb = () => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const todayIso = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' })
const daysAgo = (n: number, today: string) => { const d = new Date(`${today}T12:00:00Z`); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0, 10) }
const nice = (d: string | null | undefined) => (d ? new Date(`${d.slice(0, 10)}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—')
const n = (x: number) => x.toLocaleString('en-GB')

interface Row extends CommunityFamily {
  guardian: string; email: string | null; children: { name: string; age: number | null }[]; hasLogin: boolean
  consentData: boolean | null; consentPhoto: boolean | null; unsubscribed: boolean; checkinCode: string | null
}
interface Model { rows: Row[]; visits: Visit[]; venues: CommunityVenue[] }

function demoModel(today: string): Model {
  return {
    venues: DEMO_VENUES.map(v => ({ id: v.id, name: v.name, day: v.day, time: v.time, address: null, postcode: null, capacity: DEMO_COMMUNITY_CAPACITY[v.id] ?? null })),
    visits: DEMO_COMMUNITY.flatMap(f => f.visitsDaysAgo.map(d => ({ familyId: f.id, date: daysAgo(d, today), venueId: f.venueId }))),
    rows: DEMO_COMMUNITY.map(f => ({
      id: f.id, guardian: f.guardian, email: f.email, children: f.children, hasLogin: f.hasLogin, consentData: f.consentData, consentPhoto: f.consentPhoto, unsubscribed: false,
      checkinCode: f.checkinCode, source: f.source, community_venue_id: f.venueId, signed_up_at: f.signedUpDaysAgo === null ? null : daysAgo(f.signedUpDaysAgo, today),
      lapsed_at: f.lapsed ? daysAgo(20, today) : null, waitlisted_at: f.waitlisted ? daysAgo(2, today) : null, created_at: null, hasSchoolChild: f.source !== 'community',
    })),
  }
}

const STATUS_TONE: Record<CommunityStatus, 'green' | 'amber' | 'grey'> = { new: 'amber', active: 'green', lapsed: 'grey' }
const SOURCE_WORD: Record<CommunitySource, string> = { school: 'School', community: 'Direct', both: 'School → weekend' }

export default function CommunityTab() {
  const ctx = useImpact()
  const live = ctx.mode === 'live' && !!ctx.people
  const today = todayIso()
  const model = useMemo<Model>(() => live
    ? {
        venues: ctx.people!.community?.venues ?? [],
        visits: ctx.people!.community?.visits ?? [],
        rows: ctx.people!.families.map(f => ({
          id: f.id, guardian: f.guardian, email: f.email, children: f.children.map(c => ({ name: c.name, age: c.age })), hasLogin: !!f.hasLogin,
          consentData: f.consentData, consentPhoto: f.consentPhoto, unsubscribed: f.unsubscribed, checkinCode: f.community?.checkinCode ?? null,
          source: f.community?.source ?? null, community_venue_id: f.community?.venueId ?? null, signed_up_at: f.community?.signedUpAt ?? null,
          lapsed_at: f.community?.lapsedAt ?? null, waitlisted_at: f.community?.waitlistedAt ?? null, created_at: f.community?.createdAt ?? null,
          hasSchoolChild: !!f.community?.hasSchoolChild,
        })),
      }
    : demoModel(today), [live, ctx.people, today])

  const by = useMemo(() => visitsBy(model.visits), [model.visits])
  const term = termOf(today)
  const tiles = useMemo(() => communityTiles(model.rows, model.visits, term, today), [model, term, today])
  const all = useMemo(() => model.rows.filter(f => inCommunity(f, by.get(f.id))), [model.rows, by])
  const placed = all.filter(f => !f.waitlisted_at)
  const waiting = all.filter(f => f.waitlisted_at).sort((a, b) => String(a.waitlisted_at).localeCompare(String(b.waitlisted_at)))
  const venueName = (id: string | null) => model.venues.find(v => v.id === id)?.name ?? '—'

  const [q, setQ] = useState('')
  const [venue, setVenue] = useState('')
  const [status, setStatus] = useState<'' | CommunityStatus>('')
  const [source, setSource] = useState<'' | CommunitySource>('')
  const [open, setOpen] = useState<Row | null>(null)
  const [wizard, setWizard] = useState<string[] | null>(null)
  const [lapse, setLapse] = useState(false)
  const [offer, setOffer] = useState<Row | null>(null)
  const [poster, setPoster] = useState<CommunityVenue | null>(null)
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const shown = placed.filter(f => {
    const d = by.get(f.id)
    if (venue && f.community_venue_id !== venue && !model.visits.some(v => v.familyId === f.id && v.venueId === venue)) return false
    if (status && statusOf(f, d, today) !== status) return false
    if (source && sourceOf(f, d) !== source) return false
    const s = q.trim().toLowerCase()
    return !s || f.guardian.toLowerCase().includes(s) || (f.email ?? '').toLowerCase().includes(s) || f.children.some(c => c.name.toLowerCase().includes(s))
  })
  const lapsing = lapsePreview(all, by, today)
  const noLogin = shown.filter(f => !f.hasLogin && f.email && !f.unsubscribed)

  const act = async (fn: (hq: string) => Promise<{ ok: boolean; error?: string }>, okText: string) => {
    if (!live) { setNote({ ok: false, text: 'This is the demo — nothing is saved.' }); return false }
    setBusy(true); setNote(null)
    try {
      const hq = await currentHq(sb())
      const r = await fn(hq)
      setNote(r.ok ? { ok: true, text: okText } : { ok: false, text: r.error ?? 'That didn’t work. Please try again.' })
      if (r.ok) ctx.reload?.()
      return r.ok
    } catch (e) { setNote({ ok: false, text: e instanceof Error ? e.message : 'Please sign in again.' }); return false }
    finally { setBusy(false) }
  }
  async function inviteNoLogin() {
    if (!live) { setNote({ ok: false, text: 'This is the demo — nothing is sent.' }); return }
    setBusy(true); setNote(null)
    try {
      const res = await impactFetch('/api/impact/invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bulk: true, familyIds: noLogin.map(f => f.id) }) })
      const d = await res.json().catch(() => ({}))
      setNote(res.ok ? { ok: true, text: `${n(d.sent ?? 0)} invite${d.sent === 1 ? '' : 's'} sent${d.failed ? `, ${d.failed} failed` : ''}${d.left ? ` — ${n(d.left)} more after the hourly limit resets` : ''}.` } : { ok: false, text: d.error ?? `Invites couldn’t be sent (error ${res.status}).` })
      if (res.ok) ctx.reload?.()
    } catch { setNote({ ok: false, text: 'Lumio couldn’t be reached. Please try again.' }) }
    finally { setBusy(false) }
  }

  const slug = ctx.org?.slug ?? 'demo'
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.lumiosports.com'
  const joinLink = `${origin}/impact/${slug}/join`
  const privacy = privacyUrlOf(ctx.org?.settings)

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Stat label="Families signed up" value={n(tiles.signedUp)} />
        <Stat label="Active this term" value={n(tiles.activeThisTerm)} sub="1+ weekend visit" />
        <Stat label="New this month" value={n(tiles.newThisMonth)} />
        <Stat label="Visits this term" value={n(tiles.visitsThisTerm)} sub="a family at a session" />
        <Stat label="Lapsed" value={n(tiles.lapsed)} sub="no visit in 6 weeks" />
        <Stat label="School → community" value={n(tiles.conversionsThisTerm)} sub="first weekend visit this term" accent />
      </div>

      <Card>
        <SectionTitle sub="Share this link, or print a venue’s poster — families sign themselves up"><HeartHandshake size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Sign-up page</SectionTitle>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <code style={{ fontSize: 12, background: '#F7F5F2', borderRadius: 8, padding: '7px 10px', color: TP_DARK }}>{joinLink}</code>
          <button style={buttonSecondary} onClick={() => navigator.clipboard?.writeText(joinLink).then(() => setNote({ ok: true, text: 'Link copied.' }))}><Copy size={13} /> Copy</button>
          <a style={buttonSecondary} href={joinLink} target="_blank" rel="noopener noreferrer"><ExternalLink size={13} /> Open</a>
        </div>
        {live && !privacy && (
          <div style={{ marginTop: 10, fontSize: 12, color: '#9A6A0B', background: '#FCF8EE', border: '1px solid #E8CD9A', borderRadius: 9, padding: '8px 10px' }}>
            <AlertTriangle size={13} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 5 }} />
            The sign-up page is closed until you add your privacy policy link in Settings → Organisation.
          </div>
        )}
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 10 }}>
        {model.venues.map(v => {
          const fams = placed.filter(f => f.community_venue_id === v.id).length
          const dates = [...new Set(model.visits.filter(x => x.venueId === v.id).map(x => x.date))].sort()
          const last = dates[dates.length - 1]
          const lastCount = last ? new Set(model.visits.filter(x => x.venueId === v.id && x.date === last).map(x => x.familyId)).size : 0
          const next = nextDateFor(v.day, today)
          return (
            <Card key={v.id} style={{ padding: '13px 14px' }}>
              <div style={{ fontSize: 13.5, fontWeight: 900, color: TP_DARK }}><MapPin size={13} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 4 }} />{v.name}</div>
              <div style={{ fontSize: 11.5, color: '#6B6560', marginTop: 2 }}>{[v.day, v.time].filter(Boolean).join(' ') || 'No day set'}</div>
              <div style={{ fontSize: 11.5, color: TP_DARK, marginTop: 8, display: 'grid', gap: 2 }}>
                <span><b>{n(fams)}</b> famil{fams === 1 ? 'y' : 'ies'}{v.capacity ? ` of ${n(v.capacity)}` : ''}{v.capacity && fams >= v.capacity ? ' — full' : ''}</span>
                <span>Last session: {last ? `${nice(last)}, ${n(lastCount)} famil${lastCount === 1 ? 'y' : 'ies'}` : 'none yet'}</span>
                <span>Next: {next ? nice(next) : '—'}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                <button style={{ ...buttonSecondary, padding: '6px 10px', fontSize: 11.5 }} onClick={() => setPoster(v)}><Printer size={12} /> Print QR poster</button>
                {live && <CapacityEdit venue={v} onSave={cap => act(hq => setCapacity(sb(), hq, v.id, cap), 'Capacity saved.')} />}
              </div>
            </Card>
          )
        })}
        {!model.venues.length && <Card><div style={{ fontSize: 12, color: '#8A847E' }}>No venues yet — add your weekend venues under Venues.</div></Card>}
      </div>

      {note && <div role={note.ok ? 'status' : 'alert'} style={{ fontSize: 12, fontWeight: 700, color: note.ok ? '#187A3C' : TP_RED }}>{note.ok ? <CheckCircle size={13} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 5 }} /> : <AlertTriangle size={13} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 5 }} />}{note.text}</div>}

      <Card>
        <SectionTitle sub={`${n(shown.length)} of ${n(placed.length)} families`}>Families</SectionTitle>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search size={13} style={{ position: 'absolute', left: 9, top: 10, color: '#8A847E' }} />
            <input aria-label="Search families" placeholder="Search name, email or child" value={q} onChange={e => setQ(e.target.value)} style={{ ...formField, paddingLeft: 28 }} />
          </div>
          <select aria-label="Venue" style={{ ...formField, width: 'auto' }} value={venue} onChange={e => setVenue(e.target.value)}><option value="">All venues</option>{model.venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select>
          <select aria-label="Status" style={{ ...formField, width: 'auto' }} value={status} onChange={e => setStatus(e.target.value as CommunityStatus | '')}><option value="">Any status</option><option value="new">New</option><option value="active">Active</option><option value="lapsed">Lapsed</option></select>
          <select aria-label="Source" style={{ ...formField, width: 'auto' }} value={source} onChange={e => setSource(e.target.value as CommunitySource | '')}><option value="">Any source</option><option value="community">Direct</option><option value="both">School → weekend</option><option value="school">School only</option></select>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          <button style={buttonPrimary} disabled={!shown.length} onClick={() => setWizard(shown.map(f => f.id))}><Send size={13} /> Message this list ({n(shown.length)})</button>
          <button style={buttonSecondary} disabled={busy || !noLogin.length} onClick={inviteNoLogin}><UserPlus size={13} /> Invite all with no login ({n(noLogin.length)})</button>
          <button style={buttonSecondary} disabled={busy} onClick={() => setLapse(true)}><Moon size={13} /> Mark lapsed families…</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, color: TP_DARK }}>
            <thead><tr style={{ textAlign: 'left', color: '#8A847E', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.3 }}>
              {['Guardian', 'Children', 'Venue', 'Source', 'First visit', 'Last visit', 'Visits', 'Status', 'Login', 'Consents'].map(h => <th key={h} style={{ padding: '6px 8px', borderBottom: '1px solid #EEE9E3' }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {shown.map(f => {
                const d = by.get(f.id) ?? []
                const st = statusOf(f, d, today)
                return (
                  <tr key={f.id} onClick={() => setOpen(f)} style={{ cursor: 'pointer', borderBottom: '1px solid #F3EFEA' }}>
                    <td style={{ padding: '7px 8px', fontWeight: 800, color: TP_DARK }}>{f.guardian}</td>
                    <td style={{ padding: '7px 8px' }}>{f.children.map(c => `${c.name.split(' ')[0]}${c.age !== null ? ` (${c.age})` : ''}`).join(', ') || '—'}</td>
                    <td style={{ padding: '7px 8px' }}>{venueName(f.community_venue_id)}</td>
                    <td style={{ padding: '7px 8px' }}>{SOURCE_WORD[sourceOf(f, d)]}</td>
                    <td style={{ padding: '7px 8px' }}>{nice(d[0])}</td>
                    <td style={{ padding: '7px 8px' }}>{nice(d[d.length - 1])}</td>
                    <td style={{ padding: '7px 8px' }}>{n(d.length)}</td>
                    <td style={{ padding: '7px 8px' }}><Pill tone={STATUS_TONE[st]}>{st}</Pill></td>
                    <td style={{ padding: '7px 8px' }}>{f.hasLogin ? 'Yes' : 'No'}</td>
                    <td style={{ padding: '7px 8px' }}>{f.consentData ? 'Data' : <span style={{ color: TP_RED }}>No data consent</span>}{f.consentPhoto ? ' · Photos' : ''}{f.unsubscribed ? ' · Unsubscribed' : ''}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!shown.length && <div style={{ fontSize: 12, color: '#8A847E', padding: '10px 8px' }}>{placed.length ? 'No families match.' : 'No community families yet. Share the sign-up link, or import a Community tab.'}</div>}
        </div>
      </Card>

      <Card>
        <SectionTitle sub="Families whose chosen venue was full when they signed up — oldest first"><Clock size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Waiting list ({n(waiting.length)})</SectionTitle>
        {!waiting.length && <div style={{ fontSize: 12, color: '#8A847E' }}>Nobody is waiting.</div>}
        <div style={{ display: 'grid', gap: 6 }}>
          {waiting.map(f => (
            <div key={f.id} style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#F7F5F2', borderRadius: 9, padding: '8px 10px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200, fontSize: 12, color: TP_DARK }}><b>{f.guardian}</b> · {f.children.map(c => c.name.split(' ')[0]).join(', ')} · {venueName(f.community_venue_id)} · waiting since {nice(f.waitlisted_at)}</div>
              <button style={{ ...buttonPrimary, padding: '6px 10px', fontSize: 11.5 }} onClick={() => setOffer(f)}>Offer a place</button>
            </div>
          ))}
        </div>
      </Card>

      {open && (
        <Modal title={open.guardian} onClose={() => setOpen(null)}>
          <FamilyPanel row={open} dates={by.get(open.id) ?? []} venues={model.venues} today={today} live={live}
            onMove={async id => { if (await act(hq => moveVenue(sb(), hq, open.id, id || null), 'Venue changed.')) setOpen(null) }} />
        </Modal>
      )}
      {wizard && <SendMessageWizard onClose={() => setWizard(null)} defaultFamilyIds={wizard} defaultRecipient="All weekend families" />}
      {lapse && (
        <Modal title="Mark lapsed families" onClose={() => setLapse(false)}>
          <div style={{ fontSize: 12.5, color: TP_DARK, display: 'grid', gap: 8 }}>
            <div>{lapsing.length ? <>These <b>{n(lapsing.length)}</b> families have been at least once but not in the last 6 weeks. They’ll show as lapsed until they next check in.</> : 'No family needs marking: everyone who has been has visited in the last 6 weeks.'}</div>
            {lapsing.slice(0, 30).map(f => { const d = by.get(f.id) ?? []; return <div key={f.id} style={{ fontSize: 12 }}>• {f.guardian} — last visit {nice(d[d.length - 1])}</div> })}
            {lapsing.length > 30 && <div style={{ fontSize: 11.5, color: '#8A847E' }}>…and {n(lapsing.length - 30)} more</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <button style={buttonPrimary} disabled={busy || !lapsing.length} onClick={async () => { if (await act(hq => markLapsed(sb(), hq, lapsing.map(f => f.id)), `${n(lapsing.length)} families marked lapsed.`)) setLapse(false) }}>Mark {n(lapsing.length)} lapsed</button>
              <button style={buttonSecondary} onClick={() => setLapse(false)}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}
      {offer && <OfferPlace row={offer} venue={venueName(offer.community_venue_id)} org={ctx.brand.org} busy={busy} onClose={() => setOffer(null)}
        onSend={async body => { if (await act(hq => offerPlace(sb(), hq, offer.id, body), `Place offered to ${offer.guardian} — they’re off the waiting list.`)) setOffer(null) }} />}
      {poster && <PosterModal venue={poster} org={ctx.brand.org} url={joinUrl(origin, slug, poster.id)} onClose={() => setPoster(null)} />}
    </div>
  )
}

function CapacityEdit({ venue, onSave }: { venue: CommunityVenue; onSave: (cap: number | null) => void }) {
  const [v, setV] = useState(venue.capacity ? String(venue.capacity) : '')
  return (
    <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
      <input aria-label={`Capacity at ${venue.name}`} placeholder="Capacity" inputMode="numeric" value={v} onChange={e => setV(e.target.value.replace(/\D/g, ''))} style={{ ...formField, width: 78, padding: '5px 7px', fontSize: 11.5 }} />
      <button style={{ ...buttonSecondary, padding: '6px 8px', fontSize: 11.5 }} onClick={() => onSave(v ? Number(v) : null)}>Save</button>
    </span>
  )
}

function FamilyPanel({ row, dates, venues, today, live, onMove }: { row: Row; dates: string[]; venues: CommunityVenue[]; today: string; live: boolean; onMove: (venueId: string) => void }) {
  const [to, setTo] = useState(row.community_venue_id ?? '')
  return (
    <div style={{ display: 'grid', gap: 12, fontSize: 12.5, color: TP_DARK }}>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, display: 'grid', gap: 3 }}>
          <div>{row.email ?? 'No email'}</div>
          <div>{row.children.map(c => `${c.name}${c.age !== null ? ` (${c.age})` : ''}`).join(', ') || 'No children recorded'}</div>
          <div>Status: <Pill tone={STATUS_TONE[statusOf(row, dates, today)]}>{statusOf(row, dates, today)}</Pill> · {SOURCE_WORD[sourceOf(row, dates)]}</div>
          <div style={{ color: '#6B6560' }}>Signed up {nice(row.signed_up_at)} · Login: {row.hasLogin ? 'yes' : 'no'}</div>
        </div>
        {row.checkinCode && <div style={{ textAlign: 'center' }}><QrCode value={row.checkinCode} size={120} label={`${row.guardian}’s check-in code`} /><div style={{ fontSize: 10.5, color: '#8A847E', marginTop: 3, letterSpacing: 1 }}>{row.checkinCode}</div></div>}
      </div>
      <div>
        <div style={formLabel}>Visit history ({dates.length})</div>
        {dates.length ? <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>{[...dates].reverse().map(d => <Pill key={d}>{nice(d)}</Pill>)}</div> : <div style={{ color: '#8A847E' }}>No weekend visits yet.</div>}
      </div>
      <div>
        <div style={formLabel}>Weekend venue</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <select aria-label="Move to venue" style={{ ...formField, flex: 1 }} value={to} onChange={e => setTo(e.target.value)}>
            <option value="">No venue</option>{venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <button style={buttonPrimary} disabled={!live || to === (row.community_venue_id ?? '')} onClick={() => onMove(to)}>Move</button>
        </div>
        {!live && <div style={{ fontSize: 11, color: '#8A847E', marginTop: 4 }}>Demo — nothing is saved.</div>}
      </div>
    </div>
  )
}

function OfferPlace({ row, venue, org, busy, onClose, onSend }: { row: Row; venue: string; org: string; busy: boolean; onClose: () => void; onSend: (body: string) => void }) {
  const [body, setBody] = useState(`Good news — a place has come up for ${row.children.map(c => c.name.split(' ')[0]).join(' and ') || 'your family'} at ${venue}. We’d love to see you at the next session. Your family QR code is in your welcome email and the family app. — ${org}`)
  return (
    <Modal title={`Offer ${row.guardian} a place`} onClose={onClose}>
      <div style={{ display: 'grid', gap: 8, fontSize: 12.5, color: TP_DARK }}>
        <div>This sends the message by email and in the app, then takes them off the waiting list. If it can’t reach them, they stay on the list.</div>
        <textarea aria-label="Message" value={body} onChange={e => setBody(e.target.value)} rows={5} style={{ ...formField, resize: 'vertical' }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={buttonPrimary} disabled={busy || body.trim().length < 10} onClick={() => onSend(body.trim())}>{busy ? 'Sending…' : 'Send and offer the place'}</button>
          <button style={buttonSecondary} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </Modal>
  )
}

function PosterModal({ venue, org, url, onClose }: { venue: CommunityVenue; org: string; url: string; onClose: () => void }) {
  async function print() {
    const svg = await (await import('qrcode')).default.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' })
    const w = window.open('', '_blank', 'noopener=no')
    if (!w) return
    const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))
    w.document.write(`<!doctype html><html><head><title>${esc(venue.name)} — join</title><style>body{font-family:Arial,sans-serif;text-align:center;padding:40px;color:#111}h1{font-size:40px;margin:0 0 8px}p{font-size:22px;margin:6px 0}svg{width:360px;height:360px;margin:24px auto;display:block}</style></head><body>`
      + `<h1>${esc(org)} weekend sessions</h1><p><b>${esc(venue.name)}</b>${venue.day || venue.time ? ` · ${esc([venue.day, venue.time].filter(Boolean).join(' '))}` : ''}</p>`
      + `${svg}<p>Scan to sign your family up — free, and it takes a minute.</p><p style="font-size:14px;color:#555">${esc(url)}</p>`
      + `<script>setTimeout(function(){window.print()},300)</script></body></html>`)
    w.document.close()
  }
  return (
    <Modal title={`QR poster — ${venue.name}`} onClose={onClose}>
      <div style={{ display: 'grid', gap: 10, justifyItems: 'center', fontSize: 12.5, color: TP_DARK }}>
        <QrCode value={url} size={200} label={`Sign-up code for ${venue.name}`} />
        <div style={{ fontSize: 11, color: '#8A847E', wordBreak: 'break-all', textAlign: 'center' }}>{url}</div>
        <div>Scanning opens the sign-up page with {venue.name} already chosen.</div>
        <button style={buttonPrimary} onClick={print}><Printer size={13} /> Print poster</button>
      </div>
    </Modal>
  )
}
