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
//   • Phone   → not in founders access; shown as "Coming in V2" and never sent.
//   • WhatsApp → coming soon.
//
// People are chosen, sent to and filed BY ID. A name is only what is shown: two
// players called "Sam Twin" are two cards, two messages and two conversations.

import { useEffect, useState } from 'react'
import { useAskBeforeClose } from '../_lib/ask-before-close'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { getSettings } from '../_lib/settings-store'
import { useCoachTable, currentIdentity } from '../_lib/coach-db'
import { V2_LABEL, V2_NOTES } from '@/lib/coach/v2'
import { campSpans, campsBetween } from '@/lib/coach/camp-dates'

// Take markdown DECORATION off a draft and nothing else. This used to delete
// every * _ # ` > wherever it stood, which turned jo_smith@example.com into
// josmith@example.com, broke links, and made "Court #3" and ">£10" say something
// different from what was drafted. Only the marks that wrap or lead a line go.
const clean = (s: string) => s
  .replace(/\*\*([^*\n]+)\*\*/g, '$1')                                  // **bold**
  .replace(/(^|[\s(])\*([^*\s][^*\n]*)\*(?=[\s).,;:!?]|$)/gm, '$1$2')   // *italic*
  .replace(/(^|[\s(])__([^_\n]+)__(?=[\s).,;:!?]|$)/gm, '$1$2')          // __bold__
  .replace(/(^|[\s(])_([^_\s][^_\n]*)_(?=[\s).,;:!?]|$)/gm, '$1$2')     // _italic_
  .replace(/`([^`\n]+)`/g, '$1')                                         // `code`
  .replace(/^[ \t]{0,3}#{1,6}[ \t]+/gm, '')                              // # heading
  .replace(/^[ \t]{0,3}>[ \t]+/gm, '')                                   // > quote
  .replace(/^[ \t]*[-•*][ \t]+/gm, '')                                   // - bullet
  .replace(/\n{3,}/g, '\n\n').trim()

type Player = { id?: string; name: string; age?: number | string | null; parent_name?: string | null; email?: string | null; contact_email?: string | null; parent_email?: string | null; phone?: string | null; contact_phone?: string | null; parent_phone?: string | null; group?: string | null }
// `key` is who this is — a player, coach or camp place by id — and is what
// selection and sending use. `name` is only what is shown.
type Recipient = { key: string; name: string; role: string; email: string; phone: string; playerId?: string; staffId?: string; attendeeId?: string; contact?: boolean }
// What the server says happened, per person per channel.
type SendResult = { i?: number; name: string; channel: string; ok: boolean; detail: string }

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
const keyOf = (p: Player) => p.id ? `player:${p.id}` : `name:${p.name}`
const lower = (s?: string | null) => (s || '').trim().toLowerCase()
const looksLikeEmail = (s: string) => /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(s.trim())
// The send endpoint's channel names, as a coach would say them.
const SENT_LABEL: Record<string, string> = { inapp: 'In-app message', email: 'Email', sms: 'Phone / Text' }

export function LiveCoachSendMessage({ T, accent, players, coachName, clubName, init, onClose, onSent }: {
  T: ThemeTokens; accent: AccentTokens; players: Player[]; coachName: string; clubName: string
  init?: { recipient?: string; playerId?: string; body?: string; campId?: string; channel?: string; email?: string; replyTo?: string }; onClose: () => void; onSent: () => void
}) {
  const [step, setStep] = useState<'who' | 'how' | 'message' | 'preview' | 'sent'>('who')
  // Who a Reply opens addressed to. By player id when the caller has one. A bare
  // name is honoured only when exactly one player has it — with two "Sam Twin"s
  // nobody is ticked and the coach chooses, rather than both being written to.
  // A name nobody on the roster has is a contact, and goes in "Someone else".
  const initNamed = init?.recipient ? players.filter(p => lower(p.name) === lower(init.recipient)) : []
  const initPlayer = (init?.playerId ? players.find(p => p.id === init.playerId) : undefined) ?? (initNamed.length === 1 ? initNamed[0] : undefined)
  const [selectedKeys, setSelectedKeys] = useState<string[]>(initPlayer ? [keyOf(initPlayer)] : [])
  const [broadcast, setBroadcast] = useState(false)
  // The camp audience. A camp is not a subset of the roster — it is the players
  // booked on it PLUS the coaches travelling with it, and those coaches are not
  // players at all. So it is its own audience rather than a filter over the list.
  const [campId, setCampId] = useState<string | null>(init?.campId ?? null)
  // Who on the camp this is going to. null = everyone, which is the common case
  // and stays one tap. A named subset exists because "ten of the forty fancy
  // going out tonight" is a real message, and sending it to all forty is how
  // people learn to ignore the camp thread.
  const [campOnly, setCampOnly] = useState<string[] | null>(null)
  const [customPerson, setCustomPerson] = useState(!initPlayer && !init?.playerId && init?.recipient && initNamed.length === 0 && !init?.campId && !/^camp\s*·/i.test(init.recipient) ? init.recipient : '')
  // Somebody who is not on the roster has no app inbox and no address on file,
  // so the only way to reach them is an email address typed here.
  // A reply to somebody already written to opens with the address on file
  // (`init.email`), so it does not have to be typed a second time.
  const [customEmail, setCustomEmail] = useState(init?.email && looksLikeEmail(init.email) ? init.email : '')
  // Settings → Messaging switches. A channel the coach has switched off is not
  // offered here. (Text is off for everyone until V2, whatever the switch says.)
  const allowed = getSettings().messaging || { email: true, inapp: true }
  const inappOn = allowed.inapp !== false
  const emailOn = allowed.email !== false
  const [channels, setChannels] = useState<string[]>(inappOn ? ['internal'] : emailOn ? ['email'] : [])
  // A body handed in is a message being passed on (Forward) — Reply opens empty.
  const [messageText, setMessageText] = useState(init?.body ? `Forwarded message:\n${init.body}` : '')
  const [isUrgent, setIsUrgent] = useState(false)
  // "Someone else" is the head coach's. A message to somebody who is not a
  // player is kept with the academy, so an invited coach could send one and
  // never see the conversation again — they are not offered it (and the server
  // refuses it).
  const [canTypeContact, setCanTypeContact] = useState(true)
  useEffect(() => { let on = true; currentIdentity().then(me => { if (on) setCanTypeContact(me?.isHead ?? true) }).catch(() => {}); return () => { on = false } }, [])
  const [aiDraft, setAiDraft] = useState('')
  // Did Lumio Coach write what is on the preview screen, or did the coach?
  // The preview must never imply the AI tidied something it never saw.
  const [aiWrote, setAiWrote] = useState(true)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  // Set when Lumio Coach could not draft: the coach is offered their own words
  // instead, keeping Urgent if that is what they pressed.
  const [draftFailed, setDraftFailed] = useState<null | { urgent: boolean }>(null)
  const [sendResults, setSendResults] = useState<SendResult[]>([])

  const campRows = useCoachTable<{ id: string; name: string; start_date?: string | null; end_date?: string | null; location?: string | null; region?: string | null; confirmed?: boolean | null; coach_ids?: string[] | null }>('coach_camps')
  const attendeeRows = useCoachTable<{ id: string; camp_id: string; player_name?: string | null; player_id?: string | null; parent_email?: string | null; status?: string | null }>('coach_camp_attendees')
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

  const togglePerson = (key: string) => setSelectedKeys(prev => prev.includes(key) ? prev.filter(n => n !== key) : [...prev, key])
  const toggleChannel = (id: string) => setChannels(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])

  // Names more than one player has. For those — and only those — the card and
  // the chips say something that tells them apart.
  const nameCount = new Map<string, number>()
  for (const p of players) nameCount.set(lower(p.name), (nameCount.get(lower(p.name)) || 0) + 1)
  const hasNamesake = (p: Player) => (nameCount.get(lower(p.name)) || 0) > 1
  const tellApart = (p: Player) => [p.age ? `age ${p.age}` : '', p.parent_name ? `parent ${p.parent_name}` : ''].filter(Boolean).join(', ') || emailOf(p) || 'no age or parent on file'
  const shownName = (p: Player) => hasNamesake(p) ? `${p.name} (${tellApart(p)})` : p.name
  const asRecipient = (p: Player, role: string): Recipient => ({ key: keyOf(p), name: shownName(p), role, email: emailOf(p), phone: phoneOf(p), playerId: p.id })

  // Resolve selected players (+ broadcast = whole roster) into recipients.
  const picked = broadcast ? players : players.filter(p => selectedKeys.includes(keyOf(p)))

  // Everyone on the camp: the players booked on (matched back to the roster so
  // they keep their own contact details) and the coaches working it. Cancelled
  // places are not on the camp and are not written to.
  const campRecipients: Recipient[] = (() => {
    if (!camp) return []
    const booked = attendeeRows.rows.filter(a => a.camp_id === camp.id && (a.status || 'confirmed') !== 'cancelled')
    const fams: Recipient[] = booked.map(a => {
      const nm = String(a.player_name || '').trim()
      // The roster player this place belongs to: by id, and by name only when
      // one player has that name.
      const named = players.filter(x => lower(x.name) === lower(nm))
      const p = (a.player_id ? players.find(x => x.id === a.player_id) : undefined) || (named.length === 1 ? named[0] : undefined)
      return p
        ? asRecipient(p, 'Camp · player')
        : { key: `attendee:${a.id}`, name: nm || 'Attendee', role: 'Camp · player', email: String(a.parent_email || ''), phone: '', attendeeId: a.id }
    }).filter(r => r.name && r.name !== 'Attendee')
    const ids = Array.isArray(camp.coach_ids) ? camp.coach_ids.map(String) : []
    const coaches: Recipient[] = staffRows.rows.filter(c => ids.includes(c.id))
      .map(c => ({ key: `staff:${c.id}`, name: c.name, role: 'Camp · coach', email: String(c.email || ''), phone: String(c.phone || ''), staffId: c.id }))
    // One message per person: a player booked twice is one player. Two people
    // who merely share a name are two people, so this is by id, not by name.
    const seen = new Set<string>()
    return [...coaches, ...fams].filter(r => {
      if (seen.has(r.key)) return false
      seen.add(r.key); return true
    })
  })()

  // A subset means individual messages. The camp THREAD is deliberately left
  // out of it (see the send call below): posting "who's coming for dinner" into
  // the group chat is exactly the spam this avoids.
  const campChosen: Recipient[] = campOnly
    ? campRecipients.filter(r => campOnly.includes(r.key))
    : campRecipients
  const wholeCamp = !campOnly || campChosen.length === campRecipients.length

  const recipients: Recipient[] = campId ? campChosen : [
    ...picked.map(p => asRecipient(p, p.group || 'Player')),
    ...(customPerson.trim() ? [{ key: 'contact', name: customPerson.trim(), role: 'Contact', email: customEmail.trim(), phone: '', contact: true }] : []),
  ]
  const allRecipients = recipients.map(r => r.name)
  const custom = recipients.find(r => r.contact) || null
  // "Someone else" needs an address before anything can reach them.
  const customNeedsEmail = !!custom && !looksLikeEmail(custom.email)

  const channelNote = (id: ChannelId): { note: string; tag: 'Live' | 'Setup' | 'Soon' | 'Off' | typeof V2_LABEL; live: boolean } => {
    const off = { note: 'Switched off in Settings → Messaging. Switch it on there to use it.', tag: 'Off' as const, live: false }
    switch (id) {
      case 'internal': return inappOn ? { note: 'Live — lands in the inbox instantly', tag: 'Live', live: true } : off
      case 'email':    return !emailOn ? off : mailbox
        ? { note: `Live — arrives from ${mailbox.from || mailbox.label}, no app opens`, tag: 'Live', live: true }
        : { note: 'Live — sent from the Lumio address. Connect your mailbox in Settings to send as you.', tag: 'Live', live: true }
      // Texting is not part of founders access — see lib/coach/v2.ts. It is
      // shown rather than hidden, because a coach who wants it should be able to
      // see it is coming and tell us they want it.
      case 'sms':      return { note: V2_NOTES.sms, tag: V2_LABEL, live: false }
      case 'whatsapp': return { note: 'Arrives after texting — it needs WhatsApp Business verification.', tag: V2_LABEL, live: false }
    }
  }

  // Exactly what the coach ticked, and only what can really be sent. Urgent used
  // to mean "all four channels": it emailed when Email was not ticked, and asked
  // the server for texts while this screen said texting was not available.
  // Urgent now marks the message urgent; where it goes is still the coach's choice.
  const usedChannelIds = (channels as ChannelId[]).filter(id => channelNote(id).live)

  const outcomeFor = (id: ChannelId): string => {
    switch (id) {
      case 'internal': return 'Goes to their app inbox'
      case 'email':    return mailbox ? `Sent from ${mailbox.from || mailbox.label}` : 'Sent from the Lumio address'
      case 'sms':      return 'Not sent — texting arrives in V2'
      case 'whatsapp': return 'Not sent — arrives after texting'
    }
  }

  // People the chosen channels cannot reach — said BEFORE sending, not found
  // out afterwards. Email needs an address; the app inbox needs a player.
  const emailing = usedChannelIds.includes('email')
  const noEmail = emailing ? recipients.filter(r => !looksLikeEmail(r.email)) : []
  const noInbox = usedChannelIds.includes('internal') && !emailing ? recipients.filter(r => !r.playerId && !(campId && wholeCamp)) : []

  // Two ways out of the message box, and the difference is the whole point:
  // `draft` runs the coach's note through Lumio Coach; without it the message
  // goes exactly as typed. A coach who has already worded something carefully
  // — a price, a cancellation, a sentence they've thought about — should not
  // have to fight an AI rewrite to send their own words.
  const handleSend = async (urgent: boolean, draft = true) => {
    setIsUrgent(urgent)
    setErr('')
    setDraftFailed(null)
    if (!draft) {
      setAiWrote(false)
      setAiDraft(messageText.trim())
      setStep('preview')
      return
    }
    setAiWrote(true)
    setLoading(true)
    try {
      const usedChannels = usedChannelIds.map(id => CHANNEL_META[id]?.label || id)
      // Authenticated Lumio Coach route. This used to post the persona from the
      // browser to an unauthenticated passthrough — so the voice writing to a
      // parent was whatever the client claimed it was.
      const res = await fetch('/api/coach/message-draft', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: messageText, recipients: allRecipients, channels: usedChannels, urgent }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Lumio Coach could not draft that just now.')
      const text = clean(data.text || '')
      if (!text) throw new Error('Lumio Coach could not draft that just now.')
      setAiDraft(text)
    } catch (e) {
      // No silent fallback to the coach's raw text. It used to look identical to
      // a successful draft, so a failed call sent an untidied note to a parent
      // while the coach believed Lumio Coach had written it.
      //
      // But it must SAY so, here, on the screen the coach is looking at — the
      // message used to be shown only on the preview step, which a failed draft
      // never reaches, so the button just went quiet. And the coach is offered
      // their own words, urgent included: an outage must not block an urgent one.
      setErr(e instanceof Error && e.message && !/fetch|network|JSON/i.test(e.message) ? e.message : 'Lumio Coach could not draft that just now.')
      setDraftFailed({ urgent })
      setLoading(false)
      return
    }
    setLoading(false)
    setStep('preview')
  }

  // Final send through the real coach messaging endpoint.
  const handleConfirm = async () => {
    const sendChannels = usedChannelIds.map(id => SEND_CHANNEL[id]).filter(Boolean) as string[]
    if (!sendChannels.length) { setErr('Choose In-app or Email first — go back to step 2.'); return }
    if (!aiDraft.trim()) { setErr('The message is empty. Write something to send.'); return }
    setLoading(true); setErr('')
    try {
      const r = await fetch('/api/coach/message/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // By id. The server looks the address up in the academy's own records;
          // only "Someone else" carries one, because the coach typed it.
          recipients: recipients.map(r => ({ playerId: r.playerId, staffId: r.staffId, attendeeId: r.attendeeId, contact: r.contact || undefined, name: r.name, email: r.email || undefined, phone: r.phone || undefined })),
          channels: sendChannels,
          urgent: isUrgent,
          // The message this answers, when the wizard was opened by Reply.
          replyTo: init?.replyTo || undefined,
          // A camp message also lands in the camp's shared thread, which is what
          // the players and the coaches on the trip actually read.
          campId: campId && wholeCamp ? campId : undefined,
          // The Discord channel the coach was reading when they hit Reply. A
          // reply typed under #travel-info belongs in #travel-info, not in
          // whichever channels happen to be the camp's defaults.
          channel: campId && wholeCamp && init?.channel ? init.channel : undefined,
          subject: `${isUrgent ? '[URGENT] ' : ''}Message from ${coachName}`,
          body: aiDraft,
          ccCoach: getSettings().ccCoachOnEmail,
        }),
      })
      const d = await r.json().catch(() => ({}))
      const res: SendResult[] = Array.isArray(d.results) ? d.results : []
      if (r.ok && d.status !== 'failed') { setSendResults(res); setStep('sent') }
      // Nothing went: say why, in the server's own words per person, instead of
      // sending the coach to look for a setting that was never the problem.
      else if (r.ok) { setErr(`Nothing was sent. ${whyNot(res).join(' ') || 'Check who it is for and how it is being sent, then try again.'}`) }
      else { setErr(d.error || 'That did not send. Try again in a moment.') }
    } catch { setErr('That did not send — the connection dropped. Try again.') } finally { setLoading(false) }
  }

  // The results belong to the request's recipients by position; the name is the
  // fallback for a reply that carries no position.
  const personOf = (x: SendResult) => (x.i != null && recipients[x.i]?.name) || x.name
  const whyNot = (res: SendResult[]) => Array.from(new Set(res.filter(x => !x.ok).map(x => `${personOf(x)}: ${x.detail}.`))).slice(0, 8)
  const reached = Array.from(new Set(sendResults.filter(x => x.ok).map(personOf)))
  const missed = sendResults.filter(x => !x.ok)

  const subtitle = step === 'who' ? 'Step 1 — Who are you messaging?' : step === 'how' ? 'Step 2 — How do you want to send it?' : step === 'message' ? 'Step 3 — Write your message' : step === 'preview' ? 'Preview — confirm & send' : 'Sent!'
  const card = (on: boolean): React.CSSProperties => ({ background: on ? accent.dim : T.panel2, border: `1px solid ${on ? accent.border : T.border}` })
  const primaryBtn = (enabled: boolean, bg = accent.hex): React.CSSProperties => ({ appearance: 'none', border: 0, borderRadius: 11, padding: '12px 14px', fontSize: 13, fontWeight: 700, fontFamily: FONT, color: enabled ? T.btnText : T.text3, background: enabled ? bg : T.hover, cursor: enabled ? 'pointer' : 'not-allowed' })

  const stepIdx = ['who', 'how', 'message', 'preview'].indexOf(step)

  // Escape closes the wizard, like every other pop-up in the portal — asking
  // first if a message has been written, so a stray key press cannot lose it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const written = (messageText + aiDraft).trim()
      if (step === 'sent' || !written || window.confirm('Close without sending? What you have written will be lost.')) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step, messageText, aiDraft, onClose])

  // A tap on the dark margin asks first once anything has been chosen or
  // written (on a phone that margin is a thumb's width from the Send button).
  // After sending there is nothing left to lose.
  const closeOutside = useAskBeforeClose(JSON.stringify([selectedKeys, broadcast, campId, campOnly, customPerson, customEmail, messageText, aiDraft]), onClose)

  return (
    <div onClick={e => { if (e.target === e.currentTarget) { if (step === 'sent') onClose(); else closeOutside() } }}
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
              <button onClick={() => { setBroadcast(b => !b); setSelectedKeys([]); setCampId(null) }} style={{ display: 'flex', alignItems: 'center', gap: 12, borderRadius: 12, padding: 12, textAlign: 'left', cursor: 'pointer', ...card(broadcast) }}>
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
                  <button key={c.id} onClick={() => { setCampId(on ? null : c.id); setCampOnly(null); setBroadcast(false); setSelectedKeys([]); setCustomPerson('') }}
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
                        { label: 'Coaches', pick: campRecipients.filter(r => r.role === 'Camp · coach').map(r => r.key) },
                        { label: 'Players', pick: campRecipients.filter(r => r.role !== 'Camp · coach').map(r => r.key) },
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

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 190px), 1fr))', gap: 6, marginTop: 10, maxHeight: 220, overflowY: 'auto' }}>
                    {campRecipients.map(r => {
                      const inSend = !campOnly || campOnly.includes(r.key)
                      return (
                        <button key={r.key}
                          onClick={() => {
                            const base = campOnly ?? campRecipients.map(x => x.key)
                            const next = inSend ? base.filter(n => n !== r.key) : [...base, r.key]
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
                // One column on a phone, two when there is room. The fixed
                // two columns were each as wide as their longest address, so
                // the rows ran past the edge of the dialog and were cut off.
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 230px), 1fr))', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                  {players.map(m => {
                    const on = selectedKeys.includes(keyOf(m))
                    const contact = emailOf(m) || phoneOf(m) || (m.group || 'Player')
                    return (
                      <button key={keyOf(m)} onClick={() => togglePerson(keyOf(m))} style={{ display: 'flex', alignItems: 'center', gap: 12, borderRadius: 12, padding: 12, textAlign: 'left', cursor: 'pointer', minWidth: 0, ...card(on) }}>
                        <span style={{ fontSize: 18 }}>🎾</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                          {/* Two players with one name: say which is which — age and
                              parent first, because that is how a coach knows them. */}
                          {hasNamesake(m) && <div style={{ fontSize: 10.5, fontWeight: 600, color: T.text2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tellApart(m)}</div>}
                          <div style={{ fontSize: 10, color: T.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{contact}</div>
                        </div>
                        {on && <span style={{ color: accent.hex }}>✓</span>}
                      </button>
                    )
                  })}
                  {players.length === 0 && <div style={{ gridColumn: '1 / -1', fontSize: 12, color: T.text3 }}>No players on your roster yet — add one{canTypeContact ? ', or type a name below' : ' first'}.</div>}
                </div>
              )}
              {!campId && canTypeContact && <input value={customPerson} onChange={e => setCustomPerson(e.target.value)} placeholder="Someone else — type name…"
                style={{ width: '100%', padding: '11px 13px', borderRadius: 12, fontSize: 13, color: T.text, background: T.panel2, border: `1px solid ${T.borderHi}`, outline: 'none', fontFamily: FONT }} />}
              {/* Somebody who is not on the roster has no app inbox and no address
                  on file. There used to be nowhere to give one, so this could
                  never be sent and the failure blamed "channel setup". */}
              {!campId && !!customPerson.trim() && (
                <div>
                  <input value={customEmail} onChange={e => setCustomEmail(e.target.value)} type="email" inputMode="email" autoComplete="off" placeholder={`Email address for ${customPerson.trim()}`}
                    style={{ width: '100%', padding: '11px 13px', borderRadius: 12, fontSize: 13, color: T.text, background: T.panel2, border: `1px solid ${customNeedsEmail ? T.warn : T.borderHi}`, outline: 'none', fontFamily: FONT }} />
                  <div style={{ fontSize: 10.5, color: T.text3, marginTop: 5, lineHeight: 1.45 }}>
                    {customPerson.trim()} is not on your roster, so they can only be reached by email. Add their address to carry on.
                  </div>
                </div>
              )}
              {recipients.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {recipients.slice(0, 12).map(r => <span key={r.key} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600, background: accent.dim, color: accent.hex }}>{r.name}</span>)}
                  {recipients.length > 12 && <span style={{ fontSize: 11, color: T.text3, alignSelf: 'center' }}>+{recipients.length - 12} more</span>}
                </div>
              )}
              <button onClick={() => { if (custom && emailOn && !channels.includes('email')) toggleChannel('email'); setStep('how') }} disabled={recipients.length === 0 || customNeedsEmail} style={primaryBtn(recipients.length > 0 && !customNeedsEmail)}>Next — choose channels →</button>
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
                  // Not available to tick: coming in V2, or switched off in Settings.
                  const v2 = tag === V2_LABEL || tag === 'Off'
                  const tagColor = tag === V2_LABEL ? accent.hex : tag === 'Soon' || tag === 'Off' ? T.text3 : live ? T.good : T.warn
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
              {custom && !usedChannelIds.includes('email') && (
                <div style={{ fontSize: 11.5, color: T.warn, lineHeight: 1.45 }}>
                  {emailOn
                    ? `${custom.name} is not on your roster, so they can only be reached by email. Tick Email to carry on.`
                    : `${custom.name} is not on your roster, so they can only be reached by email — and Email is switched off in Settings → Messaging.`}
                </div>
              )}
              {usedChannelIds.length === 0 && !inappOn && !emailOn && (
                <div style={{ fontSize: 11.5, color: T.warn, lineHeight: 1.45 }}>In-app and Email are both switched off in Settings → Messaging. Switch one on to send a message.</div>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep('who')} style={{ flex: 1, appearance: 'none', border: 0, borderRadius: 11, padding: '11px', fontSize: 13, background: T.hover, color: T.text2, cursor: 'pointer' }}>← Back</button>
                <button onClick={() => setStep('message')} disabled={usedChannelIds.length === 0 || (!!custom && !usedChannelIds.includes('email'))} style={{ flex: 1, ...primaryBtn(usedChannelIds.length > 0 && !(custom && !usedChannelIds.includes('email'))) }}>Next — write message →</button>
              </div>
            </div>
          )}

          {/* STEP 3 — Message */}
          {step === 'message' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', fontSize: 11, color: T.text3 }}>
                To: {recipients.slice(0, 8).map(r => <span key={r.key} style={{ padding: '2px 8px', borderRadius: 20, background: accent.dim, color: accent.hex }}>{r.name}</span>)}
                {recipients.length > 8 && <span>+{recipients.length - 8}</span>}
                <span>via</span>
                {usedChannelIds.map(id => <span key={id} style={{ padding: '2px 8px', borderRadius: 20, background: T.hover, color: T.text2 }}>{CHANNEL_META[id]?.label}</span>)}
              </div>
              <textarea value={messageText} onChange={e => setMessageText(e.target.value)} rows={5} placeholder="Type your message… Send it as written, or let Lumio Coach tidy it first."
                style={{ width: '100%', boxSizing: 'border-box', padding: '13px', borderRadius: 12, fontSize: 13, color: T.text, background: T.panel2, border: `1px solid ${T.borderHi}`, resize: 'none', outline: 'none', fontFamily: FONT, lineHeight: 1.5 }} autoFocus />
              {/* Wraps onto a second row on a phone: four buttons in one row
                  broke their labels onto three and four lines. */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button onClick={() => setStep('how')} style={{ appearance: 'none', border: 0, borderRadius: 11, padding: '11px 16px', fontSize: 13, background: T.hover, color: T.text2, cursor: 'pointer' }}>← Back</button>
                <button onClick={() => handleSend(false, false)} disabled={!messageText.trim() || loading}
                  style={{ appearance: 'none', borderRadius: 11, padding: '11px 18px', fontSize: 13, fontWeight: 700, fontFamily: FONT, whiteSpace: 'nowrap', background: 'transparent', border: `1px solid ${T.borderHi}`, color: messageText.trim() && !loading ? T.text : T.text3, cursor: messageText.trim() && !loading ? 'pointer' : 'not-allowed' }}>
                  Send as written
                </button>
                <button onClick={() => handleSend(false, true)} disabled={!messageText.trim() || loading} style={{ flex: '1 1 150px', whiteSpace: 'nowrap', ...primaryBtn(!!messageText.trim() && !loading) }}>{loading ? '⏳ Drafting…' : '✨ Draft & send →'}</button>
                <button onClick={() => handleSend(true, true)} disabled={!messageText.trim() || loading} style={{ ...primaryBtn(!!messageText.trim() && !loading, T.bad), padding: '11px 16px' }}>🚨 Urgent</button>
              </div>
              {err && (
                <div role="alert" style={{ borderRadius: 12, padding: '11px 13px', background: 'rgba(199,90,90,0.10)', border: `1px solid ${T.bad}55`, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200, fontSize: 12, color: T.text, lineHeight: 1.45 }}>
                    {err}{draftFailed ? ' Your words are still here — you can send them as they are.' : ''}
                  </div>
                  {draftFailed && (
                    <button onClick={() => handleSend(draftFailed.urgent, false)} disabled={!messageText.trim()}
                      style={{ appearance: 'none', borderRadius: 10, padding: '8px 13px', fontSize: 12, fontWeight: 700, fontFamily: FONT, cursor: 'pointer', border: `1px solid ${draftFailed.urgent ? T.bad : T.borderHi}`, background: 'transparent', color: draftFailed.urgent ? T.bad : T.text }}>
                      {draftFailed.urgent ? 'Send as written, marked urgent' : 'Send as written'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 4 — Preview */}
          {step === 'preview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {isUrgent && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, background: 'rgba(199,90,90,0.12)', border: `1px solid ${T.bad}55` }}>
                  <span>🚨</span>
                  <span style={{ flex: 1, fontSize: 11.5, fontWeight: 700, color: T.bad }}>URGENT — marked urgent. Goes by {usedChannelIds.map(id => CHANNEL_META[id].label).join(' and ') || 'nothing yet'}.</span>
                  {emailOn && !usedChannelIds.includes('email') && (
                    <button onClick={() => toggleChannel('email')} style={{ appearance: 'none', borderRadius: 8, padding: '5px 10px', fontSize: 11, fontWeight: 700, fontFamily: FONT, cursor: 'pointer', border: `1px solid ${T.bad}`, background: 'transparent', color: T.bad }}>Also send by email</button>
                  )}
                </div>
              )}
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: aiWrote ? accent.hex : T.text3 }}>
                {aiWrote ? '✨ Lumio Coach\u2019s draft — change anything before it goes' : 'Your message, word for word'}
              </div>
              {/* Editable. A draft that got a time or a price wrong used to leave
                  one choice: "← Edit", which threw the whole draft away. */}
              <textarea value={aiDraft} onChange={e => setAiDraft(e.target.value)} rows={Math.min(14, Math.max(5, aiDraft.split('\n').length + 2))} aria-label="Message to send"
                style={{ width: '100%', borderRadius: 12, padding: 16, fontSize: 13, lineHeight: 1.6, background: T.panel2, border: `1px solid ${T.border}`, color: T.text2, resize: 'vertical', outline: 'none', fontFamily: FONT }} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 10.5 }}>
                {usedChannelIds.map(id => {
                  const { live } = channelNote(id)
                  const col = live ? T.good : T.warn
                  return <span key={id} style={{ padding: '3px 9px', borderRadius: 20, background: `${col}1a`, color: col, fontWeight: 600 }}>{CHANNEL_META[id].label} · {outcomeFor(id)}</span>
                })}
              </div>
              {(noEmail.length > 0 || noInbox.length > 0) && (
                <div style={{ fontSize: 11.5, color: T.warn, lineHeight: 1.5 }}>
                  {noEmail.length > 0 && <div>No usable email address on file for {noEmail.slice(0, 6).map(r => r.name).join(', ')}{noEmail.length > 6 ? ` and ${noEmail.length - 6} more` : ''} — {usedChannelIds.includes('internal') ? 'they will get the in-app message only' : 'nothing will reach them'}.</div>}
                  {noInbox.length > 0 && <div>{noInbox.slice(0, 6).map(r => r.name).join(', ')}{noInbox.length > 6 ? ` and ${noInbox.length - 6} more` : ''} {noInbox.length === 1 ? 'is' : 'are'} not on your roster, so there is no app inbox to send to. Tick Email to reach them.</div>}
                </div>
              )}
              {err && <div role="alert" style={{ fontSize: 12, color: T.bad, lineHeight: 1.5 }}>{err}</div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setStep('message'); setAiDraft(''); setErr('') }} style={{ flex: 1, appearance: 'none', border: 0, borderRadius: 11, padding: '11px', fontSize: 13, background: T.hover, color: T.text2, cursor: 'pointer' }}>← Edit</button>
                <button onClick={handleConfirm} disabled={loading} style={{ flex: 1, ...primaryBtn(!loading, isUrgent ? T.bad : accent.hex) }}>{loading ? 'Sending…' : '✓ Confirm send'}</button>
              </div>
            </div>
          )}

          {/* SENT */}
          {step === 'sent' && (
            <div style={{ textAlign: 'center', padding: '28px 0' }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>✅</div>
              {/* What the server says happened — not what was asked for. This
                  used to print "Message sent!" and "Email: Sent" for people who
                  had no address and got nothing. */}
              <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 6 }}>{missed.length ? 'Sent, but not to everyone' : 'Message sent'}</div>
              <div style={{ fontSize: 12.5, color: T.text3, marginBottom: 14, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
                To {reached.slice(0, 6).join(', ')}{reached.length > 6 ? ` +${reached.length - 6} more` : ''}.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxWidth: 420, margin: '0 auto 16px', textAlign: 'left' }}>
                {Array.from(new Set(sendResults.map(x => x.channel))).map(ch => {
                  const mine = sendResults.filter(x => x.channel === ch)
                  const ok = mine.filter(x => x.ok)
                  const how = ch === 'email' ? (ok.find(x => /^Sent from /.test(x.detail))?.detail.replace(/^Sent /, '') || (mailbox ? `from ${mailbox.from || mailbox.label}` : 'from the Lumio address')) : ''
                  return (
                    <div key={ch} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: ok.length === mine.length ? T.good : T.warn, flexShrink: 0 }} />
                      <span style={{ color: T.text2 }}><span style={{ fontWeight: 600, color: T.text }}>{SENT_LABEL[ch] || ch}:</span> {ok.length === mine.length ? `sent to ${mine.length === 1 ? personOf(mine[0]) : `all ${mine.length}`}` : `sent to ${ok.length} of ${mine.length}`}{ok.length && how ? `, ${how}` : ''}.</span>
                    </div>
                  )
                })}
              </div>
              {missed.length > 0 && (
                <div style={{ maxWidth: 420, margin: '0 auto 16px', textAlign: 'left', borderRadius: 10, padding: '10px 12px', background: `${T.warn}14`, border: `1px solid ${T.warn}55` }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: T.text, marginBottom: 4 }}>Not sent</div>
                  {missed.slice(0, 12).map((x, n) => (
                    <div key={n} style={{ fontSize: 11.5, color: T.text2, lineHeight: 1.5 }}>{personOf(x)} — {SENT_LABEL[x.channel] || x.channel}: {x.detail}</div>
                  ))}
                  {missed.length > 12 && <div style={{ fontSize: 11.5, color: T.text3 }}>…and {missed.length - 12} more.</div>}
                </div>
              )}
              <button onClick={() => { onSent() }} style={primaryBtn(true)}>Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
