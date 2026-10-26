'use client'

// Calendar → "Offer a free slot".
//
// The coach has an hour free (a cancellation, a gap) and offers it to the
// clients who asked to hear about free slots. Each gets their own email and
// link; the first to say yes gets it and it lands in the diary. Recent offers
// are listed underneath with how they went, and an open one can be taken back.

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { slotWords } from '@/lib/coach/slot-offer'

type Player = { id: string; name: string; free_slot_pings?: boolean | null; email?: string | null; parent_email?: string | null; contact_email?: string | null }
type Venue = { id: string; name: string; is_home?: boolean | null }
type Court = { id: string; name: string; venue_id?: string | null }
type Offer = { id: string; date: string; time: string; durMin: number; type: string; status: 'open' | 'taken' | 'withdrawn' | 'expired'; takenBy: string | null; sent: number; opened: number; declined: number }
export type SlotPrefill = { date?: string; time?: string; durMin?: number; type?: string; venueId?: string | null; courtId?: string | null }

const TYPES = ['Private', 'Group', 'Cardio', 'Match play']

export function OfferSlotModal({ T, accent, players, venues, courts, prefill, onClose }: {
  T: ThemeTokens; accent: AccentTokens; players: Player[]; venues: Venue[]; courts: Court[]
  prefill?: SlotPrefill; onClose: () => void
}) {
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)
  const [date, setDate] = useState(prefill?.date || tomorrow)
  const [time, setTime] = useState(prefill?.time || '14:00')
  const [dur, setDur] = useState(String(prefill?.durMin || 60))
  const [type, setType] = useState(prefill?.type && TYPES.includes(prefill.type) ? prefill.type : 'Private')
  const [venueId, setVenueId] = useState(prefill?.venueId || venues.find(v => v.is_home)?.id || venues[0]?.id || '')
  const [courtId, setCourtId] = useState(prefill?.courtId || '')
  const [note, setNote] = useState('')
  const willing = useMemo(() => players.filter(p => p.free_slot_pings).sort((a, b) => a.name.localeCompare(b.name)), [players])
  const [picked, setPicked] = useState<Set<string>>(() => new Set(willing.map(p => p.id)))
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null)
  const [offers, setOffers] = useState<Offer[] | null>(null)

  const loadOffers = () => fetch('/api/coach/slot-offers', { cache: 'no-store' }).then(r => (r.ok ? r.json() : { offers: [] })).then(d => setOffers(d.offers || [])).catch(() => setOffers([]))
  useEffect(() => { void loadOffers() }, [])
  useEffect(() => { setPicked(new Set(willing.map(p => p.id))) }, [willing])

  const send = async () => {
    if (busy) return
    setBusy(true); setMsg(null)
    try {
      const r = await fetch('/api/coach/slot-offers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date, time, durMin: Number(dur), type, venueId: venueId || null, courtId: courtId || null, note, playerIds: Array.from(picked) }) })
      const d = await r.json()
      if (!r.ok || !d.ok) setMsg({ text: d.error || 'The offer could not be sent.', bad: true })
      else setMsg({ text: `✓ Offered to ${d.sent} ${d.sent === 1 ? 'client' : 'clients'}.${d.noEmail?.length ? ` Not sent to ${d.noEmail.join(', ')}: no email address.` : ''} The first to say yes gets it, and you’ll get an email when they do.` })
      void loadOffers()
    } catch { setMsg({ text: 'You appear to be offline. Nothing was sent.', bad: true }) }
    finally { setBusy(false) }
  }
  const withdraw = async (id: string) => {
    if (!confirm('Take this offer back? Anyone who opens their link will be told it has closed.')) return
    await fetch(`/api/coach/slot-offers?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => null)
    void loadOffers()
  }

  const field: CSSProperties = { width: '100%', minWidth: 0, boxSizing: 'border-box', background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 9px', fontSize: 12.5, fontFamily: FONT, outline: 'none' }
  const lbl: CSSProperties = { display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: T.text3, marginBottom: 4 }
  const chip = (s: Offer['status']) => ({ open: [accent.hex, 'Open'], taken: [T.good, 'Taken'], withdrawn: [T.text3, 'Taken back'], expired: [T.text3, 'Closed'] } as const)[s]
  const venueCourts = courts.filter(c => (c.venue_id || '') === venueId)

  return (
    <div onClick={e => { if (e.target === e.currentTarget && !busy) onClose() }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '5vh 16px', overflowY: 'auto', fontFamily: FONT }}>
      <div role="dialog" aria-label="Offer a free slot" style={{ width: '100%', maxWidth: 560, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Offer a free slot</div>
        <div style={{ fontSize: 12, color: T.text3, marginTop: 4, lineHeight: 1.5 }}>Emailed to the clients who asked to hear about free slots. The first to say yes gets it, and it goes straight into your diary.</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8, marginTop: 14 }}>
          <label><span style={lbl}>Day</span><input type="date" value={date} onChange={e => setDate(e.target.value)} style={field} /></label>
          <label><span style={lbl}>Start</span><input type="time" value={time} onChange={e => setTime(e.target.value)} style={field} /></label>
          <label><span style={lbl}>Minutes</span><input type="number" min={15} max={240} step={15} value={dur} onChange={e => setDur(e.target.value)} style={field} /></label>
          <label><span style={lbl}>Type</span><select value={type} onChange={e => setType(e.target.value)} style={field}>{TYPES.map(t => <option key={t}>{t}</option>)}</select></label>
        </div>
        {venues.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginTop: 8 }}>
            <label><span style={lbl}>Venue</span><select value={venueId} onChange={e => { setVenueId(e.target.value); setCourtId('') }} style={field}><option value="">— (not set)</option>{venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></label>
            <label><span style={lbl}>Court</span><select value={courtId} onChange={e => setCourtId(e.target.value)} style={field}><option value="">— (not set)</option>{venueCourts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          </div>
        )}
        <div style={{ fontSize: 12, color: T.text2, marginTop: 8 }}>{/^\d{4}-\d{2}-\d{2}$/.test(date) && /^\d{2}:\d{2}$/.test(time) ? `They’ll read: “a free slot on ${slotWords(date, time)}”` : ''}</div>

        <div style={{ ...lbl, marginTop: 14 }}>Send it to · {picked.size} of {willing.length}</div>
        {willing.length === 0 ? (
          <div style={{ fontSize: 12.5, color: T.text3, lineHeight: 1.5, border: `1px dashed ${T.border}`, borderRadius: 9, padding: '10px 12px' }}>
            Nobody has asked to hear about free slots yet. Edit a client in Player Roster and tick “Happy to hear about free slots”, with their agreement.
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 160, overflowY: 'auto' }}>
            {willing.map(p => {
              const on = picked.has(p.id)
              return (
                <button key={p.id} onClick={() => setPicked(s => { const n = new Set(s); if (n.has(p.id)) n.delete(p.id); else n.add(p.id); return n })} aria-pressed={on}
                  style={{ appearance: 'none', border: `1px solid ${on ? accent.border : T.border}`, background: on ? accent.dim : 'transparent', color: on ? accent.hex : T.text2, borderRadius: 999, padding: '5px 11px', fontSize: 12, cursor: 'pointer', fontFamily: FONT }}>{on ? '✓ ' : ''}{p.name}</button>
              )
            })}
          </div>
        )}
        {players.length > willing.length && willing.length > 0 && <div style={{ fontSize: 11, color: T.text3, marginTop: 6 }}>{players.length - willing.length} other clients have not asked for free-slot emails, so they are not listed.</div>}

        <textarea value={note} maxLength={500} rows={2} placeholder="A line to add (optional), e.g. Great for match practice before the weekend" onChange={e => setNote(e.target.value)}
          style={{ ...field, marginTop: 12, resize: 'vertical' }} />
        {msg && <div role="status" style={{ fontSize: 12.5, color: msg.bad ? T.bad : T.good, marginTop: 10, lineHeight: 1.5 }}>{msg.text}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <button onClick={onClose} style={{ appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 9, padding: '0 14px', minHeight: 38, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>Close</button>
          <button onClick={send} disabled={busy || !picked.size} style={{ appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 9, padding: '0 16px', minHeight: 38, fontSize: 13, fontWeight: 700, cursor: busy || !picked.size ? 'not-allowed' : 'pointer', opacity: busy || !picked.size ? 0.5 : 1, fontFamily: FONT }}>{busy ? 'Sending…' : `Offer it to ${picked.size}`}</button>
        </div>

        {offers && offers.length > 0 && (
          <div style={{ marginTop: 18, borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
            <div style={lbl}>Recent offers</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {offers.slice(0, 8).map(o => {
                const [c, l] = chip(o.status)
                return (
                  <div key={o.id} data-testid="slot-offer-row" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 12, color: T.text2 }}>
                    <span style={{ color: T.text, fontWeight: 600 }}>{slotWords(o.date, o.time)}</span>
                    <span style={{ color: c, fontWeight: 700 }}>{l}{o.status === 'taken' && o.takenBy ? ` by ${o.takenBy}` : ''}</span>
                    <span style={{ color: T.text3 }}>sent to {o.sent} · opened {o.opened}{o.declined ? ` · ${o.declined} said no` : ''}</span>
                    {o.status === 'open' && <button onClick={() => withdraw(o.id)} style={{ marginLeft: 'auto', appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 7, padding: '0 10px', minHeight: 30, fontSize: 11.5, cursor: 'pointer', fontFamily: FONT }}>Take it back</button>}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
