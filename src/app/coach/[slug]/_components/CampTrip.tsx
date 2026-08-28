'use client'

// The trip hub, from the coach's side.
//
// One shared link with the hotel, the transfers, what time to be in the lobby
// and who to ring. The thing a coach currently sends as a PDF in February and
// then re-answers on WhatsApp until August.
//
// Three ways to fill it in, in the order a real coach would reach for them:
//   1. Drop in the joining instructions they already wrote. Transcribed.
//   2. Let Lumio Coach start it from the camp record, then correct it.
//   3. Type it.
//
// Everything factual stays editable, because the page tells somebody where to
// drive with a child in the car.

import { useMemo, useRef, useState, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { UPLOAD_ACCEPT } from '@/lib/coach/file-to-content'
import { makeTripSlug, tripHasContent, cleanTrip, type Trip, type TripContact, type TripPlace } from '@/lib/coach/trip'

type Camp = {
  id: string; name: string; region?: string | null; location?: string | null
  trip?: Trip | null; trip_slug?: string | null; trip_open?: boolean | null
  itinerary?: unknown[] | null
}

// Field labels live here rather than in the markup so the coach's form and the
// player's page cannot drift apart in what they call things.
const GROUPS: { key: keyof Trip; title: string; hint: string; fields: [string, string, string][] }[] = [
  { key: 'stay', title: 'Where they’re staying', hint: 'The hotel or residence.', fields: [
    ['name', 'Hotel', 'Vale do Lobo Resort'],
    ['address', 'Address', 'Full address — it becomes a map on the page'],
    ['url', 'Website', 'valedolobo.com'],
    ['checkIn', 'Check-in', 'From 3pm on the Sunday'],
    ['rooms', 'Rooms', 'Twin rooms, shared between two players'],
    ['meals', 'Meals', 'Breakfast and dinner at the hotel, lunch at the club'],
    ['wifi', 'Wi-Fi', 'Network name and password'],
    ['notes', 'Anything else', ''],
  ] },
  { key: 'venue', title: 'Where they’re playing', hint: 'The club or academy.', fields: [
    ['name', 'Venue', 'Algarve Tennis and Fitness Club'],
    ['address', 'Address', 'Full address — it becomes a map on the page'],
    ['url', 'Website', 'algarvetennis.com'],
    ['courts', 'Courts', '4 clay'],
    ['facilities', 'Facilities', 'Gym, pool, café'],
    ['notes', 'Anything else', ''],
  ] },
  { key: 'travel', title: 'Getting there', hint: 'The part that generates the most messages.', fields: [
    ['airport', 'Airport', 'Faro (FAO), 25 minutes from the resort'],
    ['flights', 'Flights', 'Booked separately by each family / included'],
    ['transfers', 'Transfers', 'Minibus meets the 14:05 arrival'],
    ['arrival', 'Arriving', 'Any time on the Sunday'],
    ['departure', 'Leaving', 'Check out 10am, transfer at 11'],
    ['notes', 'Anything else', ''],
  ] },
  { key: 'practical', title: 'Good to know', hint: 'The small things people ask.', fields: [
    ['currency', 'Money', 'Euros. Cards everywhere, some cash for the beach café'],
    ['weather', 'Weather', 'Typically 24–30°C in September'],
    ['timeDifference', 'Time difference', 'Same as the UK'],
    ['plugs', 'Plugs', 'Two-pin European'],
    ['health', 'Health', 'GHIC card, and the nearest clinic is 10 minutes away'],
    ['notes', 'Anything else', ''],
  ] },
]

export function CampTrip({ T, accent, camp, onSave }: {
  T: ThemeTokens; accent: AccentTokens; camp: Camp
  onSave: (v: Record<string, any>) => Promise<void>
}) {
  // Local working copy. A trip is a long form and saving on every keystroke
  // would be both slow and a good way to lose a half-typed address.
  const [t, setT] = useState<Trip>(() => camp.trip || {})
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const [note, setNote] = useState('')
  const [copied, setCopied] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const origin = typeof window === 'undefined' ? '' : window.location.origin
  const url = camp.trip_slug ? `${origin}/trip/${camp.trip_slug}` : ''
  const live = !!camp.trip_open && !!camp.trip_slug
  const hasContent = useMemo(() => tripHasContent(t), [t])

  const set = (group: keyof Trip, field: string, v: string) => {
    setDirty(true)
    setT(p => ({ ...p, [group]: { ...((p[group] as Record<string, string>) || {}), [field]: v } }))
  }

  const save = async (extra: Record<string, any> = {}) => {
    setSaving(true); setErr('')
    try {
      await onSave({ trip: cleanTrip(t), ...extra })
      setDirty(false)
    } catch (e) { setErr(e instanceof Error ? e.message : 'Could not save.') }
    finally { setSaving(false) }
  }

  const draft = async (file?: File) => {
    setBusy(file ? 'Reading your document…' : 'Lumio Coach is drafting it…')
    setErr(''); setNote('')
    try {
      let res: Response
      if (file) {
        const fd = new FormData()
        fd.append('file', file); fd.append('campId', camp.id)
        res = await fetch('/api/coach/trip-draft', { method: 'POST', body: fd })
      } else {
        res = await fetch('/api/coach/trip-draft', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ campId: camp.id }),
        })
      }
      // Text first: a 413 from nginx is an HTML page, and "Unexpected token <"
      // helps nobody.
      const raw = await res.text()
      let d: any = {}
      try { d = raw ? JSON.parse(raw) : {} } catch { /* not JSON */ }
      if (!res.ok) {
        throw new Error(d.error || (res.status === 413
          ? 'That file is too large for the server to accept.'
          : `Could not draft the trip (HTTP ${res.status})`))
      }

      // Merge rather than replace. Anything the coach has already typed is the
      // most reliable information on the page and must survive a redraft.
      setT(prev => mergeTrip(prev, d.trip || {}))
      setDirty(true)
      setNote(d.from === 'file'
        ? 'Read from your document. Check every address and time before you share it.'
        : 'Started from the camp details. The hotel, transfers and phone numbers are deliberately blank — Lumio Coach will not invent those.')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not draft the trip.')
    } finally {
      setBusy('')
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const publish = async () => {
    const slug = camp.trip_slug || makeTripSlug(camp.name)
    await save({ trip_slug: slug, trip_open: true })
  }

  return (
    <div style={{ fontFamily: FONT, display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── What this is ── */}
      <div style={card(T)}>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>The trip hub</span>
              {live
                ? <span style={{ fontSize: 9, fontWeight: 700, color: T.good, background: `${T.good}22`, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase' }}>Live</span>
                : <span style={{ fontSize: 9, fontWeight: 700, color: T.text3, background: T.hover, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase' }}>Not shared</span>}
            </div>
            <p style={{ margin: '5px 0 0', fontSize: 12.5, color: T.text3, lineHeight: 1.6, maxWidth: 620 }}>
              One link with the hotel, the transfers, what time to be in the lobby and who to ring. Everything
              on it is shared with everyone on the trip, so nobody&rsquo;s balance or targets appear here.
            </p>
          </div>
          {live && (
            <button onClick={() => save({ trip_open: false })} style={ghost(T)}>Stop sharing</button>
          )}
        </div>

        {live && (
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <input readOnly value={url} onFocus={e => e.currentTarget.select()}
              style={{ flex: 1, minWidth: 220, fontFamily: FONT, fontSize: 12, color: T.text2, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 11px' }} />
            <button onClick={() => { navigator.clipboard?.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800) }} style={ghost(T)}>
              {copied ? 'Copied' : 'Copy link'}
            </button>
            <a href={url} target="_blank" rel="noopener noreferrer" style={{ ...ghost(T), textDecoration: 'none', display: 'inline-block' }}>Open ↗</a>
          </div>
        )}
      </div>

      {/* ── Fill it in ── */}
      <div style={card(T)}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 3 }}>Start from what you already have</div>
        <div style={{ fontSize: 11.5, color: T.text3, marginBottom: 12, lineHeight: 1.55 }}>
          Most coaches have already written this once. Drop it in rather than typing it again.
        </div>
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) void draft(f) }}
          onClick={() => !busy && fileRef.current?.click()}
          style={{ border: `1px dashed ${T.border}`, borderRadius: 10, padding: '15px 14px', textAlign: 'center', cursor: busy ? 'wait' : 'pointer', background: T.panel2 }}>
          <input ref={fileRef} type="file" accept={UPLOAD_ACCEPT} style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) void draft(f) }} />
          <div style={{ fontSize: 12.5, fontWeight: 600, color: T.text }}>
            {busy || 'Drop in your joining instructions'}
          </div>
          <div style={{ fontSize: 11.5, color: T.text3, marginTop: 3, lineHeight: 1.5 }}>
            PDF, Word, spreadsheet, or a photo of it. Anything you already send families.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={() => void draft()} disabled={!!busy} style={ghost(T)}>
            ✦ Or start it from the camp details
          </button>
          {note && <span style={{ fontSize: 11.5, color: T.text3, flex: 1, minWidth: 200, lineHeight: 1.5 }}>{note}</span>}
        </div>
        {err && <div style={{ fontSize: 12, color: T.bad, marginTop: 10 }}>{err}</div>}
      </div>

      {/* ── Intro ── */}
      <div style={card(T)}>
        <Label T={T}>The opening line</Label>
        <Hint T={T}>What this week is, in your words. It sits at the top of the page.</Hint>
        <textarea value={t.intro || ''} rows={3}
          onChange={e => { setDirty(true); setT(p => ({ ...p, intro: e.target.value })) }}
          placeholder="Everything you need for the week is on this page — keep it to hand."
          style={{ ...input(T), resize: 'vertical', lineHeight: 1.6 }} />
      </div>

      {/* ── Who to call ── */}
      <div style={card(T)}>
        <Label T={T}>Who to call</Label>
        <Hint T={T}>The most-used part of the page. Put yourself first, then anyone on the ground.</Hint>
        {(t.contacts || []).map((c, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <input value={c.name || ''} placeholder="Name" style={input(T)}
              onChange={e => { setDirty(true); setT(p => ({ ...p, contacts: patch(p.contacts, i, { name: e.target.value }) })) }} />
            <input value={c.role || ''} placeholder="Head coach" style={input(T)}
              onChange={e => { setDirty(true); setT(p => ({ ...p, contacts: patch(p.contacts, i, { role: e.target.value }) })) }} />
            <input value={c.phone || ''} placeholder="+44 7700 900000" style={input(T)}
              onChange={e => { setDirty(true); setT(p => ({ ...p, contacts: patch(p.contacts, i, { phone: e.target.value }) })) }} />
            <button onClick={() => { setDirty(true); setT(p => ({ ...p, contacts: (p.contacts || []).filter((_, j) => j !== i) })) }}
              style={{ ...ghost(T), color: T.bad, padding: '7px 10px' }}>Remove</button>
          </div>
        ))}
        <button onClick={() => { setDirty(true); setT(p => ({ ...p, contacts: [...(p.contacts || []), { name: '' }] })) }} style={ghost(T)}>
          + Add someone
        </button>
      </div>

      {/* ── The fact groups ── */}
      {GROUPS.map(g => (
        <div key={String(g.key)} style={card(T)}>
          <Label T={T}>{g.title}</Label>
          <Hint T={T}>{g.hint}</Hint>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {g.fields.map(([f, label, placeholder]) => (
              <div key={f} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: T.text3 }}>{label}</span>
                <input
                  value={((t[g.key] as Record<string, string>) || {})[f] || ''}
                  placeholder={placeholder}
                  onChange={e => set(g.key, f, e.target.value)}
                  style={input(T)} />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* ── Getting around, and eating ── */}
      <Places
        T={T} accent={accent}
        title="Getting around" hint="Once they are there. The taxi firm you actually use, car hire, the local bus."
        addLabel="+ Add a taxi firm or service"
        kindPlaceholder="Taxi firm"
        notePlaceholder="Ask for Paulo. He knows the resort and takes card."
        items={t.transport || []}
        onChange={v => { setDirty(true); setT(p => ({ ...p, transport: v })) }} />

      <Places
        T={T} accent={accent}
        title="Eating" hint="Where you actually eat. The note is the valuable part — anyone can find a restaurant."
        addLabel="+ Add a place"
        kindPlaceholder="Seafood"
        notePlaceholder="Where we go on the last night. Book ahead and ask for the terrace."
        items={t.eating || []}
        onChange={v => { setDirty(true); setT(p => ({ ...p, eating: v })) }} />

      {/* ── What to bring ── */}
      <div style={card(T)}>
        <Label T={T}>What to bring</Label>
        <Hint T={T}>Kit and paperwork, one per line. Separate from your coaching equipment list.</Hint>
        <textarea rows={6} value={(t.bring || []).join('\n')}
          onChange={e => { setDirty(true); setT(p => ({ ...p, bring: e.target.value.split('\n') })) }}
          placeholder={'Passport, in date\nTravel insurance that covers sport\nClay court shoes\nRefillable water bottle'}
          style={{ ...input(T), resize: 'vertical', lineHeight: 1.7 }} />
      </div>

      {/* ── Save / publish ── */}
      <div style={{ ...card(T), position: 'sticky', bottom: 12, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => void save()} disabled={saving || !dirty}
          style={{ appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 9, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: saving || !dirty ? 'default' : 'pointer', opacity: saving || !dirty ? 0.5 : 1, fontFamily: FONT }}>
          {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
        </button>

        {!live && (
          <button onClick={() => void publish()} disabled={saving || !hasContent}
            style={{ ...ghost(T), opacity: hasContent ? 1 : 0.5, cursor: hasContent ? 'pointer' : 'default' }}>
            Save and share it
          </button>
        )}

        <span style={{ fontSize: 11.5, color: dirty ? T.warn : T.text3, flex: 1, minWidth: 200, lineHeight: 1.5 }}>
          {!hasContent
            ? 'Add something before you share it — an empty page is worse than no page.'
            : dirty
              ? 'Unsaved changes. Anyone with the link sees the last saved version.'
              : live ? 'Live. Changes appear as soon as you save.' : 'Saved, but not shared yet.'}
        </span>
      </div>
    </div>
  )
}

/**
 * A list of somewhere-the-coach-recommends: restaurants, taxi firms, shops.
 *
 * The note field is given a full-width row rather than a narrow column because
 * it is the thing worth having. Anyone can search for a restaurant in the
 * Algarve; "the one we book for the last night, ask for the terrace" is what a
 * family is paying for.
 */
function Places({ T, accent, title, hint, addLabel, kindPlaceholder, notePlaceholder, items, onChange }: {
  T: ThemeTokens; accent: AccentTokens
  title: string; hint: string; addLabel: string
  kindPlaceholder: string; notePlaceholder: string
  items: TripPlace[]
  onChange: (v: TripPlace[]) => void
}) {
  const set = (i: number, v: Partial<TripPlace>) => {
    const out = [...items]
    out[i] = { ...(out[i] || { name: '' }), ...v }
    onChange(out)
  }
  return (
    <div style={card(T)}>
      <Label T={T}>{title}</Label>
      <Hint T={T}>{hint}</Hint>

      {items.map((p, i) => (
        <div key={i} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 12, marginBottom: 10, background: T.panel2 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr auto', gap: 8, marginBottom: 8 }}>
            <input value={p.name || ''} placeholder="Name" style={input(T)}
              onChange={e => set(i, { name: e.target.value })} />
            <input value={p.kind || ''} placeholder={kindPlaceholder} style={input(T)}
              onChange={e => set(i, { kind: e.target.value })} />
            <button onClick={() => onChange(items.filter((_, j) => j !== i))}
              style={{ ...ghost(T), color: T.bad, padding: '7px 10px' }}>Remove</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
            <input value={p.phone || ''} placeholder="Phone" style={input(T)}
              onChange={e => set(i, { phone: e.target.value })} />
            <input value={p.url || ''} placeholder="Website" style={input(T)}
              onChange={e => set(i, { url: e.target.value })} />
            <input value={p.address || ''} placeholder="Address" style={input(T)}
              onChange={e => set(i, { address: e.target.value })} />
          </div>
          <textarea value={p.note || ''} rows={2} placeholder={notePlaceholder}
            onChange={e => set(i, { note: e.target.value })}
            style={{ ...input(T), resize: 'vertical', lineHeight: 1.55 }} />
        </div>
      ))}

      <button onClick={() => onChange([...items, { name: '' }])}
        style={{ ...ghost(T), borderColor: accent.border, color: accent.hex }}>{addLabel}</button>
    </div>
  )
}

/** Merge a draft over what the coach already typed — their words always win. */
function mergeTrip(mine: Trip, draft: Trip): Trip {
  const pick = <T extends Record<string, string | undefined>>(a?: T, b?: T): T | undefined => {
    if (!a && !b) return undefined
    const out: Record<string, string | undefined> = { ...(b || {}) }
    for (const [k, v] of Object.entries(a || {})) if ((v || '').trim()) out[k] = v
    return out as T
  }
  return {
    intro: (mine.intro || '').trim() || draft.intro,
    stay: pick(mine.stay, draft.stay),
    venue: pick(mine.venue, draft.venue),
    travel: pick(mine.travel, draft.travel),
    practical: pick(mine.practical, draft.practical),
    contacts: (mine.contacts || []).some(c => (c?.name || '').trim()) ? mine.contacts : draft.contacts,
    transport: (mine.transport || []).some(p => (p?.name || '').trim()) ? mine.transport : draft.transport,
    eating: (mine.eating || []).some(p => (p?.name || '').trim()) ? mine.eating : draft.eating,
    bring: (mine.bring || []).some(x => (x || '').trim()) ? mine.bring : draft.bring,
    sections: (mine.sections || []).length ? mine.sections : draft.sections,
  }
}

function patch(list: TripContact[] | undefined, i: number, v: Partial<TripContact>): TripContact[] {
  const out = [...(list || [])]
  out[i] = { ...(out[i] || { name: '' }), ...v }
  return out
}

function Label({ T, children }: { T: ThemeTokens; children: React.ReactNode }) {
  return <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{children}</div>
}
function Hint({ T, children }: { T: ThemeTokens; children: React.ReactNode }) {
  return <div style={{ fontSize: 11.5, color: T.text3, margin: '3px 0 11px', lineHeight: 1.5 }}>{children}</div>
}
function card(T: ThemeTokens): CSSProperties {
  return { background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }
}
function input(T: ThemeTokens): CSSProperties {
  return {
    width: '100%', boxSizing: 'border-box', fontFamily: FONT, fontSize: 12.5, color: T.text,
    background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 11px', outline: 'none',
  }
}
function ghost(T: ThemeTokens): CSSProperties {
  return {
    appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2,
    borderRadius: 8, padding: '8px 13px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
  }
}
