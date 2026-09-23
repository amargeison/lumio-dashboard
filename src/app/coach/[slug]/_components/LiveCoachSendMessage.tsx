'use client'

// LIVE Send Message — the same 4-step wizard the demo uses (Who → How →
// Message → Preview → Sent) but wired to the coach's REAL roster and the real
// send endpoint (/api/coach/message/send). Mirrors CoachSendMessage.tsx visually
// so the live portal matches the demo exactly.
//
// Channels are honest about what they do on send:
//   • In-app  → writes a real item to the coach inbox.
//   • Email   → if the coach's mailbox is synced (Settings), Lumio sends it
//               directly; otherwise the send endpoint reports it can't.
//   • Phone   → if a Twilio sender number is configured (Settings), Lumio texts.
//   • WhatsApp → coming soon.

import { useEffect, useState } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { getSettings } from '../_lib/settings-store'
import { useCoachTable } from '../_lib/coach-db'
import { V2_LABEL, V2_NOTES } from '@/lib/coach/v2'
import { campSpans, campsBetween } from '@/lib/coach/camp-dates'

const clean = (s: string) => s.replace(/[*_#`>]/g, '').replace(/^\s*[-•]\s*/gm, '').replace(/\n{3,}/g, '\n\n').trim()

type Player = { id?: string; name: string; email?: string | null; contact_email?: string | null; parent_email?: string | null; phone?: string | null; contact_phone?: string | null; parent_phone?: string | null; group?: string | null }
type Recipient = { name: string; role: string; email: string; phone: string }

const CHANNEL_IDS = ['internal', 'email', 'sms', 'whatsapp'] as const
type ChannelId = typeof CHANNEL_IDS[number]
const CHANNEL_META: Record<ChannelId, { label: string; icon: string }> = {
  internal: { label: 'In-app message', icon: '🔔' },
  email:    { label: 'Email',          icon: '📧' },
  sms:      { label: 'Phone / Text',   icon: '📱' },
  whatsapp: { label: 'WhatsApp',       icon: '🟢' },
}
// The live send endpoint speaks 'inapp' | 'email' | 'sms'.
const SEND_CHANNEL: Partial<Record<ChannelId, string>> = { internal: 'inapp', email: 'email', sms: 'sms' }

const providerLabel = (p: string) =>
  p === 'google' ? 'Gmail' : p === 'outlook' || p === 'microsoft' ? 'Outlook' : p ? 'your mailbox' : ''

const emailOf = (p: Player) => p.email || p.contact_email || p.parent_email || ''
const phoneOf = (p: Player) => p.phone || p.contact_phone || p.parent_phone || ''

export function LiveCoachSendMessage({ T, accent, players, coachName, clubName, init, onClose, onSent }: {
  T: ThemeTokens; accent: AccentTokens; players: Player[]; coachName: string; clubName: string
  init?: { recipient?: string; body?: string }; onClose: () => void; onSent: () => void
}) {
  const [step, setStep] = useState<'who' | 'how' | 'message' | 'preview' | 'sent'>('who')
  const [selectedNames, setSelectedNames] = useState<string[]>(init?.recipient ? [init.recipient] : [])
  const [broadcast, setBroadcast] = useState(false)
  // The camp audience. A camp is not a subset of the roster — it is the players
  // booked on it PLUS the coaches travelling with it, and those coaches are not
  // players at all. So it is its own audience rather than a filter over the list.
  const [campId, setCampId] = useState<string | null>(null)
  // Who on the camp this is going to. null = everyone, which is the common case
  // and stays one tap. A named subset exists because "ten of the forty fancy
  // going out tonight" is a real message, and sending it to all forty is how
  // people learn to ignore the camp thread.
  const [campOnly, setCampOnly] = useState<string[] | null>(null)
  const [customPerson, setCustomPerson] = useState('')
  const [channels, setChannels] = useState<string[]>(['internal'])
  const [messageText, setMessageText] = useState(init?.body ? `Re your message:\n${init.body}` : '')
  const [isUrgent, setIsUrgent] = useState(false)
  const [aiDraft, setAiDraft] = useState('')
  // Did Lumio Coach write what is on the preview screen, or did the coach?
  // The preview must never imply the AI tidied something it never saw.
  const [aiWrote, setAiWrote] = useState(true)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const campRows = useCoachTable<{ id: string; name: string; start_date?: string | null; end_date?: string | null; location?: string | null; region?: string | null; confirmed?: boolean | null; coach_ids?: string[] | null }>('coach_camps')
  const attendeeRows = useCoachTable<{ camp_id: string; player_name?: string | null; player_id?: string | null; parent_email?: string | null; status?: string | null }>('coach_camp_attendees')
  const staffRows = useCoachTable<{ id: string; name: string; email?: string | null; phone?: string | null; role?: string | null }>('coach_staff')

  // "Active" = running now or still to come. A camp that finished last August is
  // not something a coach wants at the top of their message list forever.
  const todayISO = new Date().toLocaleDateString('en-CA')
  const activeCampSpans = campsBetween(campSpans(campRows.rows), todayISO, '9999-12-31')
  const activeCamps = activeCampSpans
    .map(sp => campRows.rows.find(c => c.id === sp.id))
    .filter(Boolean) as typeof campRows.rows
  const camp = campId ? activeCamps.find(c => c.id === campId) || null : null

  // Where email actually leaves from — read from the connected mailbox, not from
  // the provider ticked during onboarding. A coach who chose "Google" in the
  // wizard and never finished Google's consent screen was told "Sent through
  // Gmail" on every send while the email really went out from the Lumio address.
  //
  // Email is live either way: with no mailbox connected the send route falls
  // back to Lumio's own sender, so the channel is never switched off here — only
  // the promise about the From line changes.
  const [mailbox, setMailbox] = useState<{ label: string; from: string } | null>(null)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/coach/integrations')
        if (!res.ok) return
        const j = await res.json()
        const live = (j.connections || []).find((c: { status?: string; capabilities?: string[] }) =>
          c.status !== 'reauth' && (c.capabilities || []).includes('send_email'))
        if (!cancelled && live) setMailbox({ label: providerLabel(live.provider), from: live.email_address || '' })
      } catch { /* offline — fall through to the Lumio-sender wording */ }
    })()
    return () => { cancelled = true }
  }, [])
  // Texts are sent server-side from Lumio's own messaging number (Twilio) — there
  // is no per-coach sending number, so we never name one here. The only thing the
  // coach controls is whether the Text channel is on at all; if texting isn't
  // enabled on the account, the send route says so per recipient in the results.

  const togglePerson = (name: string) => setSelectedNames(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name])
  const toggleChannel = (id: string) => setChannels(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])

  // Resolve selected players (+ broadcast = whole roster) into recipients.
  const picked = broadcast ? players : players.filter(p => selectedNames.includes(p.name))

  // Everyone on the camp: the players booked on (matched back to the roster so
  // they keep their own contact details) and the coaches working it. Cancelled
  // places are not on the camp and are not written to.
  const campRecipients: Recipient[] = (() => {
    if (!camp) return []
    const booked = attendeeRows.rows.filter(a => a.camp_id === camp.id && (a.status || 'confirmed') !== 'cancelled')
    const fams: Recipient[] = booked.map(a => {
      const nm = String(a.player_name || '').trim()
      const p = players.find(x => x.name === nm) || (a.player_id ? players.find(x => (x as { id?: string }).id === a.player_id) : undefined)
      return p
        ? { name: p.name, role: 'Camp · player', email: emailOf(p), phone: phoneOf(p) }
        : { name: nm || 'Attendee', role: 'Camp · player', email: String(a.parent_email || ''), phone: '' }
    }).filter(r => r.name && r.name !== 'Attendee')
    const ids = Array.isArray(camp.coach_ids) ? camp.coach_ids.map(String) : []
    const coaches: Recipient[] = staffRows.rows.filter(c => ids.includes(c.id))
      .map(c => ({ name: c.name, role: 'Camp · coach', email: String(c.email || ''), phone: String(c.phone || '') }))
    // One message per person, even if a coach is also on the roster as a player.
    const seen = new Set<string>()
    return [...coaches, ...fams].filter(r => {
      const k = r.name.trim().toLowerCase()
      if (!k || seen.has(k)) return false
      seen.add(k); return true
    })
  })()

  // A subset means individual messages. The camp THREAD is deliberately left
  // out of it (see the send call below): posting "who's coming for dinner" into
  // the group chat is exactly the spam this avoids.
  const campChosen: Recipient[] = campOnly
    ? campRecipients.filter(r => campOnly.includes(r.name))
    : campRecipients
  const wholeCamp = !campOnly || campChosen.length === campRecipients.length

  const recipients: Recipient[] = campId ? campChosen : [
    ...picked.map(p => ({ name: p.name, role: p.group || 'Player', email: emailOf(p), phone: phoneOf(p) })),
    ...(customPerson.trim() ? [{ name: customPerson.trim(), role: 'Contact', email: '', phone: '' }] : []),
  ]
  const allRecipients = recipients.map(r => r.name)

  const channelNote = (id: ChannelId): { note: string; tag: 'Live' | 'Setup' | 'Soon' | typeof V2_LABEL; live: boolean } => {
    switch (id) {
      case 'internal': return { note: 'Live — lands in the inbox instantly', tag: 'Live', live: true }
      case 'email':    return mailbox
        ? { note: `Live — arrives from ${mailbox.from || mailbox.label}, no app opens`, tag: 'Live', live: true }
        : { note: 'Live — sent from the Lumio address. Connect your mailbox in Settings to send as you.', tag: 'Live', live: true }
      // Texting is not part of founders access — see lib/coach/v2.ts. It is
      // shown rather than hidden, because a coach who wants it should be able to
      // see it is coming and tell us they want it.
      case 'sms':      return { note: V2_NOTES.sms, tag: V2_LABEL, live: false }
      case 'whatsapp': return { note: 'Arrives after texting — it needs WhatsApp Business verification.', tag: V2_LABEL, live: false }
    }
  }

  const usedChannelIds = (isUrgent ? [...CHANNEL_IDS] : channels) as ChannelId[]

  const outcomeFor = (id: ChannelId): string => {
    switch (id) {
      case 'internal': return 'Added to the inbox'
      case 'email':    return mailbox ? `Sent from ${mailbox.from || mailbox.label}` : 'Sent from the Lumio address'
      case 'sms':      return 'Not sent — texting arrives in V2'
      case 'whatsapp': return 'Not sent — arrives after texting'
    }
  }

  // Two ways out of the message box, and the difference is the whole point:
  // `draft` runs the coach's note through Lumio Coach; without it the message
  // goes exactly as typed. A coach who has already worded something carefully
  // — a price, a cancellation, a sentence they've thought about — should not
  // have to fight an AI rewrite to send their own words.
  const handleSend = async (urgent: boolean, draft = true) => {
    setIsUrgent(urgent)
    setErr('')
    if (!draft) {
      setAiWrote(false)
      setAiDraft(messageText.trim())
      setStep('preview')
      return
    }
    setAiWrote(true)
    setLoading(true)
    try {
      const usedChannels = (urgent ? [...CHANNEL_IDS] : channels as ChannelId[]).map(id => CHANNEL_META[id]?.label || id)
      // Authenticated Lumio Coach route. This used to post the persona from the
      // browser to an unauthenticated passthrough — so the voice writing to a
      // parent was whatever the client claimed it was.
      const res = await fetch('/api/coach/message-draft', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: messageText, recipients: allRecipients, channels: usedChannels, urgent }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Lumio Coach could not draft that')
      setAiDraft(clean(data.text || ''))
    } catch (e) {
      // No silent fallback to the coach's raw text. It used to look identical to
      // a successful draft, so a failed call sent an untidied note to a parent
      // while the coach believed Lumio Coach had written it.
      setErr(e instanceof Error ? e.message : 'Lumio Coach could not draft that')
      setLoading(false)
      return
    }
    setLoading(false)
    setStep('preview')
  }

  // Final send through the real coach messaging endpoint.
  const handleConfirm = async () => {
    const sendChannels = usedChannelIds.map(id => SEND_CHANNEL[id]).filter(Boolean) as string[]
    if (!sendChannels.length) { setErr('No deliverable channel selected.'); return }
    setLoading(true); setErr('')
    try {
      const r = await fetch('/api/coach/message/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: recipients.map(r => ({ name: r.name, email: r.email || undefined, phone: r.phone || undefined })),
          channels: sendChannels,
          // A camp message also lands in the camp's shared thread, which is what
          // the players and the coaches on the trip actually read.
          campId: campId && wholeCamp ? campId : undefined,
          subject: `${isUrgent ? '[URGENT] ' : ''}Message from ${coachName}`,
          body: aiDraft,
          ccCoach: getSettings().ccCoachOnEmail,
        }),
      })
      const d = await r.json()
      if (r.ok && d.status !== 'failed') { setStep('sent') }
      else { setErr('Couldn’t send — check channel setup in Settings.') }
    } catch { setErr('Couldn’t send — try again.') } finally { setLoading(false) }
  }

  const subtitle = step === 'who' ? 'Step 1 — Who are you messaging?' : step === 'how' ? 'Step 2 — How do you want to send it?' : step === 'message' ? 'Step 3 — Write your message' : step === 'preview' ? 'Preview — confirm & send' : 'Sent!'
  const card = (on: boolean): React.CSSProperties => ({ background: on ? accent.dim : T.panel2, border: `1px solid ${on ? accent.border : T.border}` })
  const primaryBtn = (enabled: boolean, bg = accent.hex): React.CSSProperties => ({ appearance: 'none', border: 0, borderRadius: 11, padding: '12px 14px', fontSize: 13, fontWeight: 700, fontFamily: FONT, color: enabled ? T.btnText : T.text3, background: enabled ? bg : T.hover, cursor: enabled ? 'pointer' : 'not-allowed' })

  const stepIdx = ['who', 'how', 'message', 'preview'].indexOf(step)

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.84)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '6vh 16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 640, background: T.panel, border: `1px solid ${T.borderHi}`, borderRadius: 16, boxShadow: '0 30px 80px -20px rgba(0,0,0,0.7)' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 22px', borderBottom: `1px solid ${T.border}` }}>
          <span style={{ fontSize: 22 }}>📨</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Send Message</div>
            <div style={{ fontSize: 11.5, color: T.text3 }}>{subtitle}</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${T.border}`, background: 'transparent', color: T.text3, cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>

        {/* step indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderBottom: `1px solid ${T.border}` }}>
          {['Who', 'How', 'Message', 'Preview'].map((st, i) => (
            <div key={st} style={{ display: 'contents' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, background: i < stepIdx ? T.good : i === stepIdx ? accent.hex : T.hover, color: i <= stepIdx ? '#fff' : T.text3 }}>{i < stepIdx ? '✓' : i + 1}</div>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: i === stepIdx ? accent.hex : i < stepIdx ? T.good : T.text3 }}>{st}</span>
              </div>
              {i < 3 && <div style={{ flex: 1, height: 1, background: i < stepIdx ? T.good : T.border }} />}
            </div>
          ))}
        </div>

        <div style={{ padding: 22 }}>
          {/* STEP 1 — Who */}
          {step === 'who' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <button onClick={() => { setBroadcast(b => !b); setSelectedNames([]); setCampId(null) }} style={{ display: 'flex', alignItems: 'center', gap: 12, borderRadius: 12, padding: 12, textAlign: 'left', cursor: 'pointer', ...card(broadcast) }}>
                <span style={{ fontSize: 18 }}>📣</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>All players</div>
                  <div style={{ fontSize: 10, color: T.text3 }}>Broadcast · {players.length} on your roster</div>
                </div>
                {broadcast && <span style={{ color: accent.hex }}>✓</span>}
              </button>

              {/* A camp is its own audience: everyone booked on it AND the
                  coaches travelling with it. Those coaches are not on the player
                  roster, so this is the only way to reach the trip in one go. */}
              {activeCamps.map(c => {
                const on = campId === c.id
                const booked = attendeeRows.rows.filter(a => a.camp_id === c.id && (a.status || 'confirmed') !== 'cancelled').length
                const nCoaches = Array.isArray(c.coach_ids) ? c.coach_ids.length : 0
                const where = [c.location, c.region].filter(Boolean).join(', ')
                return (
                  <button key={c.id} onClick={() => { setCampId(on ? null : c.id); setCampOnly(null); setBroadcast(false); setSelectedNames([]) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, borderRadius: 12, padding: 12, textAlign: 'left', cursor: 'pointer', ...card(on) }}>
                    <span style={{ fontSize: 18 }}>🏕</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Camp · {c.name}</div>
                      <div style={{ fontSize: 10, color: T.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {booked} booked{nCoaches ? ` · ${nCoaches} coach${nCoaches === 1 ? '' : 'es'}` : ' · no coaches added yet'}{where ? ` · ${where}` : ''}
                      </div>
                    </div>
                    {on && <span style={{ color: accent.hex }}>✓</span>}
                  </button>
                )
              })}

              {/* ── Who on the camp ──────────────────────────────────────────
                  Everyone by default — that is what "message the camp" means.
                  Open it up and you can send to the three coaches, or to the
                  ten players who wanted to go out, without the other thirty
                  getting a message that is nothing to do with them. */}
              {!!campId && campRecipients.length > 0 && (
                <div style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 12, padding: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: T.text }}>
                      {wholeCamp ? `Everyone on the camp · ${campRecipients.length}` : `${campChosen.length} of ${campRecipients.length} people`}
                    </span>
                    <span style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {[
                        { label: 'Everyone', pick: null as string[] | null },
                        { label: 'Coaches', pick: campRecipients.filter(r => r.role === 'Camp · coach').map(r => r.name) },
                        { label: 'Players', pick: campRecipients.filter(r => r.role !== 'Camp · coach').map(r => r.name) },
                      ].map(o => {
                        const active = o.pick === null ? wholeCamp
                          : !!campOnly && campOnly.length === o.pick.length && o.pick.every(n => campOnly.includes(n))
                        return (
                          <button key={o.label} onClick={() => setCampOnly(o.pick)}
                            style={{ appearance: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 11, fontWeight: active ? 700 : 500, padding: '4px 10px', borderRadius: 999, border: `1px solid ${active ? accent.hex : T.border}`, background: active ? accent.dim : 'transparent', color: active ? accent.hex : T.text2 }}>
                            {o.label}
                          </button>
                        )
                      })}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 6, marginTop: 10, maxHeight: 220, overflowY: 'auto' }}>
                    {campRecipients.map(r => {
                      const inSend = !campOnly || campOnly.includes(r.name)
                      return (
                        <button key={r.name}
                          onClick={() => {
                            const base = campOnly ?? campRecipients.map(x => x.name)
                            const next = inSend ? base.filter(n => n !== r.name) : [...base, r.name]
                            // Back to everyone rather than a list that happens to
                            // hold everyone — so the camp thread gets it again.
                            setCampOnly(next.length === campRecipients.length ? null : next)
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', appearance: 'none', cursor: 'pointer', fontFamily: FONT, background: inSend ? accent.dim : 'transparent', border: `1px solid ${inSend ? accent.border : T.border}`, borderRadius: 9, padding: '7px 9px' }}>
                          <span style={{ width: 15, height: 15, borderRadius: 4, flexShrink: 0, display: 'grid', placeItems: 'center', fontSize: 9.5, fontWeight: 800, background: inSend ? accent.hex : 'transparent', border: `1px solid ${inSend ? accent.hex : T.border}`, color: T.btnText }}>{inSend ? '✓' : ''}</span>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ display: 'block', fontSize: 12, color: T.text, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</span>
                            <span style={{ display: 'block', fontSize: 9.5, color: T.text3 }}>{r.role === 'Camp · coach' ? 'Coach' : 'Player'}{r.email ? '' : ' · no email'}</span>
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  <div style={{ fontSize: 10.5, color: T.text3, marginTop: 9, lineHeight: 1.5 }}>
                    {wholeCamp
                      ? 'Goes to everyone individually and into the camp conversation in their app.'
                      : 'Goes only to the people ticked — it does not appear in the camp conversation.'}
                  </div>
                </div>
              )}

              {!broadcast && !campId && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                  {players.map(m => (
                    <button key={m.id || m.name} onClick={() => togglePerson(m.name)} style={{ display: 'flex', alignItems: 'center', gap: 12, borderRadius: 12, padding: 12, textAlign: 'left', cursor: 'pointer', ...card(selectedNames.includes(m.name)) }}>
                      <span style={{ fontSize: 18 }}>🎾</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                        <div style={{ fontSize: 10, color: T.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emailOf(m) || phoneOf(m) || (m.group || 'Player')}</div>
                      </div>
                      {selectedNames.includes(m.name) && <span style={{ color: accent.hex }}>✓</span>}
                    </button>
                  ))}
                  {players.length === 0 && <div style={{ gridColumn: '1 / -1', fontSize: 12, color: T.text3 }}>No players on your roster yet — add one, or type a name below.</div>}
                </div>
              )}
              {!campId && <input value={customPerson} onChange={e => setCustomPerson(e.target.value)} placeholder="Someone else — type name…"
                style={{ width: '100%', padding: '11px 13px', borderRadius: 12, fontSize: 13, color: T.text, background: T.panel2, border: `1px solid ${T.borderHi}`, outline: 'none', fontFamily: FONT }} />}
              {allRecipients.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {allRecipients.slice(0, 12).map(n => <span key={n} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600, background: accent.dim, color: accent.hex }}>{n}</span>)}
                  {allRecipients.length > 12 && <span style={{ fontSize: 11, color: T.text3, alignSelf: 'center' }}>+{allRecipients.length - 12} more</span>}
                </div>
              )}
              <button onClick={() => setStep('how')} disabled={allRecipients.length === 0} style={primaryBtn(allRecipients.length > 0)}>Next — choose channels →</button>
            </div>
          )}

          {/* STEP 2 — How */}
          {step === 'how' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {CHANNEL_IDS.map(id => {
                  const on = channels.includes(id)
                  const meta = CHANNEL_META[id]
                  const { note, tag, live } = channelNote(id)
                  const v2 = tag === V2_LABEL
                  const tagColor = v2 ? accent.hex : tag === 'Soon' ? T.text3 : live ? T.good : T.warn
                  return (
                    <button key={id} onClick={() => { if (!v2) toggleChannel(id) }} disabled={v2}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: 12, borderRadius: 12, padding: 14, textAlign: 'left', cursor: v2 ? 'not-allowed' : 'pointer', opacity: v2 ? 0.65 : 1, ...card(on && !v2) }}>
                      <span style={{ fontSize: 22, lineHeight: 1 }}>{meta.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{meta.label}</span>
                          <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '1px 5px', borderRadius: 4, color: tagColor, background: `${tagColor}1f` }}>{tag}</span>
                          {on && <span style={{ marginLeft: 'auto', color: accent.hex }}>✓</span>}
                        </div>
                        <div style={{ fontSize: 10.5, color: T.text3, marginTop: 3, lineHeight: 1.35 }}>{note}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep('who')} style={{ flex: 1, appearance: 'none', border: 0, borderRadius: 11, padding: '11px', fontSize: 13, background: T.hover, color: T.text2, cursor: 'pointer' }}>← Back</button>
                <button onClick={() => setStep('message')} disabled={channels.length === 0} style={{ flex: 1, ...primaryBtn(channels.length > 0) }}>Next — write message →</button>
              </div>
            </div>
          )}

          {/* STEP 3 — Message */}
          {step === 'message' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', fontSize: 11, color: T.text3 }}>
                To: {allRecipients.slice(0, 8).map(n => <span key={n} style={{ padding: '2px 8px', borderRadius: 20, background: accent.dim, color: accent.hex }}>{n}</span>)}
                {allRecipients.length > 8 && <span>+{allRecipients.length - 8}</span>}
                <span>via</span>
                {channels.map(id => <span key={id} style={{ padding: '2px 8px', borderRadius: 20, background: T.hover, color: T.text2 }}>{CHANNEL_META[id as ChannelId]?.label}</span>)}
              </div>
              <textarea value={messageText} onChange={e => setMessageText(e.target.value)} rows={5} placeholder="Type your message… Send it as written, or let Lumio Coach tidy it first."
                style={{ width: '100%', padding: '13px', borderRadius: 12, fontSize: 13, color: T.text, background: T.panel2, border: `1px solid ${T.borderHi}`, resize: 'none', outline: 'none', fontFamily: FONT, lineHeight: 1.5 }} autoFocus />
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep('how')} style={{ appearance: 'none', border: 0, borderRadius: 11, padding: '11px 16px', fontSize: 13, background: T.hover, color: T.text2, cursor: 'pointer' }}>← Back</button>
                <button onClick={() => handleSend(false, false)} disabled={!messageText.trim() || loading}
                  style={{ appearance: 'none', borderRadius: 11, padding: '11px 18px', fontSize: 13, fontWeight: 700, fontFamily: FONT, background: 'transparent', border: `1px solid ${T.borderHi}`, color: messageText.trim() && !loading ? T.text : T.text3, cursor: messageText.trim() && !loading ? 'pointer' : 'not-allowed' }}>
                  Send as written
                </button>
                <button onClick={() => handleSend(false, true)} disabled={!messageText.trim() || loading} style={{ flex: 1, ...primaryBtn(!!messageText.trim() && !loading) }}>{loading ? '⏳ Drafting…' : '✨ Draft & send →'}</button>
                <button onClick={() => handleSend(true, true)} disabled={!messageText.trim() || loading} style={{ ...primaryBtn(!!messageText.trim() && !loading, T.bad), padding: '11px 16px' }}>🚨 Urgent</button>
              </div>
            </div>
          )}

          {/* STEP 4 — Preview */}
          {step === 'preview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {isUrgent && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, background: 'rgba(199,90,90,0.12)', border: `1px solid ${T.bad}55` }}>
                  <span>🚨</span><span style={{ fontSize: 11.5, fontWeight: 700, color: T.bad }}>URGENT — sending to all channels at once</span>
                </div>
              )}
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: aiWrote ? accent.hex : T.text3 }}>
                {aiWrote ? '✨ Lumio Coach\u2019s draft' : 'Your message, word for word'}
              </div>
              <div style={{ borderRadius: 12, padding: 16, fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', background: T.panel2, border: `1px solid ${T.border}`, color: T.text2 }}>{aiDraft}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 10.5 }}>
                {usedChannelIds.map(id => {
                  const { live } = channelNote(id)
                  const col = live ? T.good : T.warn
                  return <span key={id} style={{ padding: '3px 9px', borderRadius: 20, background: `${col}1a`, color: col, fontWeight: 600 }}>{CHANNEL_META[id].label} · {outcomeFor(id)}</span>
                })}
              </div>
              {err && <div style={{ fontSize: 12, color: T.bad }}>{err}</div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setStep('message'); setAiDraft('') }} style={{ flex: 1, appearance: 'none', border: 0, borderRadius: 11, padding: '11px', fontSize: 13, background: T.hover, color: T.text2, cursor: 'pointer' }}>← Edit</button>
                <button onClick={handleConfirm} disabled={loading} style={{ flex: 1, ...primaryBtn(!loading, isUrgent ? T.bad : accent.hex) }}>{loading ? 'Sending…' : '✓ Confirm send'}</button>
              </div>
            </div>
          )}

          {/* SENT */}
          {step === 'sent' && (
            <div style={{ textAlign: 'center', padding: '28px 0' }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>✅</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 6 }}>Message sent!</div>
              <div style={{ fontSize: 12.5, color: T.text3, marginBottom: 14, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
                To {allRecipients.slice(0, 6).join(', ')}{allRecipients.length > 6 ? ` +${allRecipients.length - 6} more` : ''}.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxWidth: 420, margin: '0 auto 16px', textAlign: 'left' }}>
                {usedChannelIds.map(id => {
                  const { live } = channelNote(id)
                  return (
                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: live ? T.good : T.warn, flexShrink: 0 }} />
                      <span style={{ color: T.text2 }}><span style={{ fontWeight: 600, color: T.text }}>{CHANNEL_META[id].label}:</span> {outcomeFor(id)}.</span>
                    </div>
                  )
                })}
              </div>
              <button onClick={() => { onSent() }} style={primaryBtn(true)}>Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
