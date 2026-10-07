import { NextRequest, NextResponse } from 'next/server'
import { isAcademyUser, notAnAcademy } from '@/lib/coach/academy-guard'
import { createServerClient } from '@supabase/ssr'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { inboundReplyTo } from '@/lib/coach/inbound'
import { rateLimit } from '@/lib/rate-limit'

// Sends a coach message over the chosen channels and logs it to coach_messages.
//   • In-app → a row in coach_messages, which the family's app reads.
//   • Email  → live now: the sender's connected mailbox, else Resend.
//   • Text   → NOT in founders access (see lib/coach/v2.ts). The Twilio code is
//              kept for V2 but nothing is sent while TEXTING_LIVE is false, and
//              the result says so per person rather than pretending.
//   • WhatsApp → not handled here yet (UI marks it coming soon).
//
// Auth is the coach's own Supabase session cookie. Three rules the route keeps,
// each of which used to be the browser's word:
//
//   WHO IT GOES TO is looked up here, by id, in the academy's own records. The
//   request used to carry the addresses, so any signed-up account could post
//   three hundred made-up ones and have Lumio email them — an open mail relay.
//
//   WHOSE IT IS: every row is filed under the ACADEMY (the head coach's id),
//   also when an assistant coach sends. It used to be filed under the sender's
//   own user id, where neither the family's app nor the head coach looks.
//
//   WHO IT IS ABOUT is a player id, never a name. Two children called "Sam Twin"
//   are two conversations.

// A recipient as the wizard sends it: an id into the academy's own records, or —
// for "Someone else" — a name with an address the coach typed.
type Recipient = { playerId?: string; staffId?: string; attendeeId?: string; contact?: boolean; name?: string; email?: string; phone?: string }
type Result = { i: number; name: string; channel: string; ok: boolean; detail: string }
// A recipient after it has been checked against the academy's records.
type Target = {
  i: number                 // position in the request, so the screen can match results to people
  label: string
  kind: 'player' | 'staff' | 'attendee' | 'contact'
  playerId: string | null
  threadKey: string
  email: string
  phone: string
  about: string | null      // the child's name, when the address is a parent's
  refused?: string          // why nothing may be sent to this one
}
type Sender = { academyId: string; staffId: string | null; isHead: boolean; name: string; academy: string }

// Texting is deliberately off until V2 (lib/coach/v2.ts): it costs money per
// message and no founding coach has asked for it. The wizard says "Coming in V2"
// — so the server must not send one whatever the request asks for.
const TEXTING_LIVE = false

const CHANNELS = ['inapp', 'email', 'sms'] as const
const MAX_RECIPIENTS = 300      // one message; a whole roster fits, a mailing list does not
const MAX_TYPED = 5             // addresses typed by hand ("Someone else") per message
const MAX_BODY = 10_000
// A tennis academy's families should hear from the sports address, not the
// business product's.
const EMAIL_ADDRESS = 'hello@lumiosports.com'
const looksLikeEmail = (s: string) => /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(s)
const isUuid = (s: unknown): s is string => typeof s === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
const oneLine = (s: unknown, max: number) => String(s ?? '').replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim().slice(0, max)
const sameName = (a: unknown, b: unknown) => String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase()

// Whose academy is the caller working in? The head coach IS the academy; an
// invited coach belongs to somebody else's. Same answer as /api/coach/whoami,
// and just as strict: an invite that is not active, or not linked to a coach
// record, is nobody.
async function resolveSender(admin: SupabaseClient, userId: string, email?: string | null): Promise<Sender | null> {
  // A coach at more than one academy sends from the one whose portal they are
  // in (see coachSeat) — a message must never go out in another club's name.
  const { coachSeat } = await import('@/lib/coach/membership')
  const m = await coachSeat(userId, email)
  if (!m) return null
  if (m.isHead) {
    const { data: own } = await admin.from('sports_profiles').select('display_name').eq('id', m.academyId).maybeSingle()
    return { academyId: m.academyId, staffId: null, isHead: true, name: (own?.display_name || '').trim() || 'your coach', academy: (m.brandName || '').trim() }
  }
  const { data: staff } = await admin.from('coach_staff').select('name').eq('id', m.staffId as string).eq('coach_id', m.academyId).maybeSingle()
  return { academyId: m.academyId, staffId: m.staffId as string, isHead: false, name: (staff?.name || '').trim() || 'your coach', academy: (m.brandName || '').trim() }
}

// `.in()` puts every id in the address of the request, so a whole roster in one
// call can be too long for it. A hundred at a time is comfortably inside.
async function byIds<T>(ids: string[], fetchChunk: (chunk: string[]) => PromiseLike<{ data: unknown }>): Promise<T[]> {
  const out: T[] = []
  for (let n = 0; n < ids.length; n += 100) {
    const { data } = await fetchChunk(ids.slice(n, n + 100))
    out.push(...((data as T[] | null) ?? []))
  }
  return out
}

type PlayerRow = { id: string; name: string | null; email: string | null; contact_email: string | null; parent_email: string | null; phone: string | null; staff_id: string | null }

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  // A demo account is signed in too. Only a real academy may use this.
  if (!await isAcademyUser(user.id)) return notAnAcademy()

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
  const me = await resolveSender(admin, user.id, user.email)
  if (!me) return notAnAcademy()

  const raw = (await req.json().catch(() => ({}))) as { recipients?: unknown; channels?: unknown; body?: unknown; urgent?: unknown; ccCoach?: unknown; campId?: unknown; channel?: unknown; replyTo?: unknown }
  const recipients = (Array.isArray(raw.recipients) ? raw.recipients : []).filter(r => r && typeof r === 'object') as Recipient[]
  // Only the channels that exist. An unknown name used to be stored as given.
  const channels = CHANNELS.filter(c => Array.isArray(raw.channels) && (raw.channels as unknown[]).includes(c))
  const body = typeof raw.body === 'string' ? raw.body : ''
  const urgent = raw.urgent === true
  const ccCoach = raw.ccCoach
  const campId = isUuid(raw.campId) ? raw.campId : undefined
  const discordChannel = typeof raw.channel === 'string' ? raw.channel : undefined
  // BCC the coach's own inbox on outbound email when enabled (Settings toggle) —
  // a silent copy that doesn't expose their address or invite reply-all.
  const bccAddress = ccCoach !== false && user.email ? user.email : undefined

  if (!body.trim()) return NextResponse.json({ error: 'Write a message first.' }, { status: 400 })
  if (body.length > MAX_BODY) return NextResponse.json({ error: `That message is too long to send (${MAX_BODY.toLocaleString('en-GB')} characters at most). Shorten it and try again.` }, { status: 400 })
  if (!recipients.length) return NextResponse.json({ error: 'Choose who this is for first.' }, { status: 400 })
  if (recipients.length > MAX_RECIPIENTS) return NextResponse.json({ error: `One message can go to ${MAX_RECIPIENTS} people at most. Send it to smaller groups.` }, { status: 400 })
  if (!channels.length) return NextResponse.json({ error: 'Choose how to send it first.' }, { status: 400 })

  // A stuck button or a script, not a coach: thirty sends in ten minutes is far
  // more than anyone types. Counted per academy, so signing in twice does not
  // double it.
  const gate = rateLimit(`message-send:${me.academyId}`, 30, 10 * 60_000)
  if (!gate.ok) {
    return NextResponse.json(
      { error: 'That is a lot of messages in a few minutes. Wait a few minutes, then send again.' },
      { status: 429, headers: { 'Retry-After': String(gate.retryAfterSeconds) } },
    )
  }

  // ── Who, checked against the academy's own records ─────────────────────────
  // The address is read from the roster here. Whatever address the request
  // carries for a player, coach or camp place is ignored.
  const want = (k: 'playerId' | 'staffId' | 'attendeeId') => Array.from(new Set(recipients.map(r => r[k]).filter(isUuid)))
  const PLAYER_COLS = 'id, name, email, contact_email, parent_email, phone, staff_id'
  const attendees = me.isHead ? await byIds<{ id: string; player_id: string | null; player_name: string | null; parent_email: string | null }>(want('attendeeId'),
    ids => admin.from('coach_camp_attendees').select('id, player_id, player_name, parent_email').eq('coach_id', me.academyId).in('id', ids)) : []
  const staff = me.isHead ? await byIds<{ id: string; name: string | null; email: string | null; phone: string | null }>(want('staffId'),
    ids => admin.from('coach_staff').select('id, name, email, phone').eq('coach_id', me.academyId).in('id', ids)) : []
  const playerIds = Array.from(new Set([...want('playerId'), ...attendees.map(a => a.player_id).filter(isUuid)]))
  const players = await byIds<PlayerRow>(playerIds,
    ids => admin.from('coach_players').select(PLAYER_COLS).eq('coach_id', me.academyId).in('id', ids))
  // An assistant coach writes to their own players and nobody else's — the same
  // line their portal draws, restated here because the service key is in play.
  const mayWrite = (p: PlayerRow) => me.isHead || (!!me.staffId && p.staff_id === me.staffId)

  const playerTarget = (i: number, p: PlayerRow): Target => {
    const own = (p.email || p.contact_email || '').trim()
    const email = own || (p.parent_email || '').trim()
    return {
      i, label: (p.name || '').trim() || 'Player', kind: 'player', playerId: p.id,
      // Named after the person for display. Never used on its own to decide who
      // may read the message — player_id is.
      threadKey: (p.name || '').trim(), email, phone: (p.phone || '').trim(),
      about: !own && email ? (p.name || '').trim() : null,
      ...(mayWrite(p) ? {} : { refused: 'Not one of your players' }),
    }
  }
  const nobody = (i: number, r: Recipient, why: string): Target =>
    ({ i, label: oneLine(r.name, 80) || 'Unknown', kind: 'contact', playerId: null, threadKey: '', email: '', phone: '', about: null, refused: why })

  let typed = 0
  const targets: Target[] = []
  for (let i = 0; i < recipients.length; i++) {
    const r = recipients[i]
    if (r.playerId) {
      const p = players.find(x => x.id === r.playerId)
      targets.push(p ? playerTarget(i, p) : nobody(i, r, 'Not on your roster'))
    } else if (r.attendeeId) {
      const a = attendees.find(x => x.id === r.attendeeId)
      const p = a?.player_id ? players.find(x => x.id === a.player_id) : undefined
      if (p) targets.push(playerTarget(i, p))
      else if (a) targets.push({ i, label: (a.player_name || '').trim() || 'Camp place', kind: 'attendee', playerId: null, threadKey: `attendee:${a.id}`, email: (a.parent_email || '').trim(), phone: '', about: (a.player_name || '').trim() || null })
      else targets.push(nobody(i, r, me.isHead ? 'Not on this camp' : 'Only the head coach can message a camp list'))
    } else if (r.staffId) {
      const c = staff.find(x => x.id === r.staffId)
      targets.push(c
        ? { i, label: (c.name || '').trim() || 'Coach', kind: 'staff', playerId: null, threadKey: `staff:${c.id}`, email: (c.email || '').trim(), phone: (c.phone || '').trim(), about: null }
        : nobody(i, r, me.isHead ? 'Not one of your coaches' : 'Only the head coach can message the coaching team'))
    } else if (r.contact === true) {
      // "Someone else": a named person and an address the coach typed. Not on
      // any list, so they can only be emailed, and only a handful per message.
      const name = oneLine(r.name, 80)
      const email = oneLine(r.email, 200).toLowerCase()
      // Head coach only, like the camp list and the coaching team above. A
      // message to somebody who is not a player is kept with the academy, where
      // an invited coach cannot read it — they would send it and never see the
      // conversation again.
      if (!me.isHead) targets.push(nobody(i, r, 'Only the head coach can email someone who is not on the roster'))
      else if (!name) targets.push(nobody(i, r, 'No name given'))
      else if (++typed > MAX_TYPED) targets.push(nobody(i, r, `Only ${MAX_TYPED} people who are not on your roster per message`))
      else targets.push({ i, label: name, kind: 'contact', playerId: null, threadKey: `contact:${email || name.toLowerCase()}`, email, phone: '', about: null })
    } else {
      // A name and nothing else — how the wizard used to send. Honoured only
      // when exactly one player the sender may write to has that name.
      const name = oneLine(r.name, 80)
      const { data: named } = name
        ? await admin.from('coach_players').select(PLAYER_COLS).eq('coach_id', me.academyId).ilike('name', name.replace(/[\\%_]/g, m => `\\${m}`)).limit(20)
        : { data: null }
      const hits = ((named as PlayerRow[] | null) ?? []).filter(p => sameName(p.name, name) && mayWrite(p))
      targets.push(hits.length === 1 ? playerTarget(i, hits[0])
        : nobody(i, r, hits.length > 1 ? 'More than one player has this name — choose the player from the list' : 'Not on your roster'))
    }
  }
  // One message per person. The same player listed twice (ticked on the roster
  // and again on a camp list, or simply sent twice in one request) was emailed
  // twice and filed twice. The first mention is kept.
  {
    const seen = new Set<string>()
    for (let n = 0; n < targets.length; n++) {
      const t = targets[n]
      if (t.refused) continue
      const who = t.playerId ? `player:${t.playerId}` : `${t.kind}:${t.threadKey}`
      if (seen.has(who)) { targets.splice(n, 1); n-- } else seen.add(who)
    }
  }

  // Hand-typed addresses are the part of this that could be turned on strangers,
  // so they have their own, much smaller allowance.
  if (typed > 0 && channels.includes('email')) {
    const typedGate = rateLimit(`message-send-typed:${me.academyId}`, 20, 60 * 60_000)
    if (!typedGate.ok) {
      return NextResponse.json(
        { error: 'You have emailed a lot of people who are not on your roster in the last hour. Try again later, or add them to your roster.' },
        { status: 429, headers: { 'Retry-After': String(typedGate.retryAfterSeconds) } },
      )
    }
  }

  // The subject is built here from who is really signed in. The browser used to
  // send it, so it said whatever the browser said (line breaks included).
  const subj = `${urgent ? '[URGENT] ' : ''}Message from ${oneLine(me.name, 80)}`

  // A camp-wide message also goes into the camp's own conversation. The camp
  // has to be this academy's — and, for an assistant coach, one they run.
  const { data: campRow } = campId
    ? await admin.from('coach_camps').select('id, name, staff_id').eq('id', campId).eq('coach_id', me.academyId).maybeSingle()
    : { data: null }
  const camp = campRow && (me.isHead || (!!me.staffId && campRow.staff_id === me.staffId)) ? campRow : null

  const results: Result[] = []
  const push = (t: Target, channel: string, ok: boolean, detail: string) => results.push({ i: t.i, name: t.label, channel, ok, detail })
  const open = targets.filter(t => !t.refused)
  for (const t of targets) if (t.refused) for (const c of channels) push(t, c, false, t.refused)

  // Replies route to the Lumio inbound address (carrying an academy+conversation
  // token) so they thread back into the in-app inbox. The token names the player
  // by id, so a reply cannot land in a namesake's conversation.
  // undefined when no reply address can be made for this conversation: the
  // email still goes, without one.
  const replyToFor = (t: Target) => inboundReplyTo(me.academyId, t.playerId ? `player:${t.playerId}` : t.threadKey) ?? undefined

  // ── In-app (Lumio message) ───────────────────────────────────────────────
  // A row in the message log, which a player's or parent's app reads. Somebody
  // who is not a player has no app inbox, and the result says so.
  if (channels.includes('inapp')) {
    for (const t of open) {
      if (t.kind === 'player') push(t, 'inapp', true, 'Sent in-app')
      else if (t.kind === 'contact') push(t, 'inapp', false, 'Not on your roster, so there is no app inbox to send to')
      else if (camp) push(t, 'inapp', true, 'In the camp conversation')
      else push(t, 'inapp', false, 'Not a player on your roster, so there is no app inbox to send to')
    }
  }

  // ── Email ──────────────────────────────────────────────────────────────────
  // Send as the coach's own address via their connected Gmail/Outlook mailbox when
  // available; otherwise fall back to Resend (Lumio's transactional sender).
  if (channels.includes('email')) {
    const { sendAsCoach, hasConnectedMailbox } = await import('@/lib/coach/mail')
    // The academy's name on the From line, so a parent sees who it is from
    // before they open it. The address stays Lumio's own.
    const fromName = oneLine(me.academy, 60).replace(/["<>\\]/g, '')
    const from = `${fromName ? `${fromName} via Lumio` : 'Lumio Sports'} <${EMAIL_ADDRESS}>`
    const signOff = [me.name, me.academy].filter(Boolean).join(', ')
    const htmlFor = (t: Target) =>
      `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#111;white-space:pre-wrap;">${escapeHtml(body)}</div>`
      + `<div style="font-family:Arial,sans-serif;font-size:12px;line-height:1.5;color:#6b7280;margin-top:18px;padding-top:10px;border-top:1px solid #e5e7eb;">`
      + `Sent by ${escapeHtml(signOff)}.${t.about ? ` This message is about ${escapeHtml(t.about)}.` : ''}</div>`
    const mailboxConnected = await hasConnectedMailbox(user.id)
    const resend = process.env.RESEND_API_KEY ? new (await import('resend')).Resend(process.env.RESEND_API_KEY) : null

    if (!mailboxConnected && !resend) {
      open.forEach(t => push(t, 'email', false, 'Email is not set up on this server'))
    } else {
      for (const t of open) {
        if (!t.email) { push(t, 'email', false, 'No email address on file'); continue }
        if (!looksLikeEmail(t.email)) { push(t, 'email', false, `The address on file (${t.email.slice(0, 60)}) is not an email address`); continue }
        // An hourly allowance per academy, counted per email rather than per
        // send: a roster-wide message is one send and two hundred emails.
        if (!rateLimit(`message-email:${me.academyId}`, 600, 60 * 60_000).ok) { push(t, 'email', false, 'Hourly email limit reached — send this one again later'); continue }
        const html = htmlFor(t)
        // 1) Connected mailbox (send-as the coach)
        if (mailboxConnected) {
          try {
            const sent = await sendAsCoach(user.id, { to: t.email, subject: subj, html, replyTo: replyToFor(t), bcc: bccAddress })
            if (sent.ok) { push(t, 'email', true, `Sent from ${sent.from || sent.provider}`); continue }
          } catch { /* fall through to Resend */ }
        }
        // 2) Resend fallback
        if (resend) {
          try {
            let { error } = await resend.emails.send({ from, to: t.email, subject: subj, html, replyTo: replyToFor(t), bcc: bccAddress })
            // A message must never be lost over its reply address. If the
            // sending service will not take that address, send without it.
            if (error && /reply_to|reply-to/i.test(error.message || '')) {
              console.error('[coach/message/send] reply address refused, sending without it:', error.message)
              ;({ error } = await resend.emails.send({ from, to: t.email, subject: subj, html, bcc: bccAddress }))
            }
            push(t, 'email', !error, error ? error.message : 'Sent')
          } catch (e) {
            push(t, 'email', false, e instanceof Error ? e.message : 'Send failed')
          }
        } else {
          push(t, 'email', false, 'Mailbox send failed and no fallback configured')
        }
      }
    }
  }

  // ── Text / SMS (Twilio REST) ───────────────────────────────────────────────
  if (channels.includes('sms')) {
    const sid = process.env.TWILIO_ACCOUNT_SID
    const token = process.env.TWILIO_AUTH_TOKEN
    const from = process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_PHONE_NUMBER
    if (!TEXTING_LIVE) {
      open.forEach(t => push(t, 'sms', false, 'Texting is not available yet — it arrives in V2'))
    } else if (!sid || !token || !from) {
      open.forEach(t => push(t, 'sms', false, 'Text not configured (add Twilio credentials)'))
    } else {
      const auth = Buffer.from(`${sid}:${token}`).toString('base64')
      for (const t of open) {
        if (!t.phone) { push(t, 'sms', false, 'No phone on file'); continue }
        try {
          const form = new URLSearchParams({ To: t.phone, From: from, Body: body })
          const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
            method: 'POST',
            headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
            body: form,
          })
          if (res.ok) push(t, 'sms', true, 'Sent')
          else { const j = await res.json().catch(() => ({})); push(t, 'sms', false, j?.message || `Twilio error ${res.status}`) }
        } catch (e) {
          push(t, 'sms', false, e instanceof Error ? e.message : 'Send failed')
        }
      }
    }
  }

  const okCount = results.filter(r => r.ok).length
  const status = okCount === 0 ? 'failed' : okCount === results.length ? 'sent' : 'partial'

  // Log to coach_messages — ONE ROW PER RECIPIENT.
  //
  // This used to write a single row whose `recipients` was every addressee
  // joined with commas. That string is a summary, not an address, and two
  // places read it as one: the coach's inbox groups conversations by it, and
  // the family's portal fetches their thread with recipients = <their name>.
  // So a message to two people produced "Sven, Sophia Jones", matched neither,
  // and was visible on the coach's dashboard and in their inbox while both
  // families saw nothing. A row each fixes both readers at once, and matches
  // what every inbound path (portal reply, email, SMS) already does.
  //
  // Each row carries the PLAYER'S ID. The name stays for display, but a name is
  // not an identity: two players called "Sam Twin" used to share one thread.
  //
  // Somebody nothing reached gets no row. A failed attempt used to be filed as
  // a conversation, so the inbox showed a message that had gone nowhere — and
  // another one each time the coach pressed Confirm.
  try {
    // A reply records which message it answers (the family's app shows the
    // two together). Only a message of this academy, and only on the row for
    // the conversation that message is in — never on anybody else's.
    const { data: answered } = isUuid(raw.replyTo)
      ? await admin.from('coach_messages').select('id, player_id, thread_key').eq('id', raw.replyTo as string).eq('coach_id', me.academyId).maybeSingle()
      : { data: null }
    const answersFor = (t: Target): string | null => !answered ? null
      : answered.player_id ? (answered.player_id === t.playerId ? answered.id : null)
      : (!t.playerId && !!t.threadKey && answered.thread_key === t.threadKey ? answered.id : null)
    const rows = open.map(t => {
      const mine = results.filter(x => x.i === t.i)
      const okMine = mine.filter(x => x.ok).length
      if (!okMine) return null
      return {
        coach_id: me.academyId,
        player_id: t.playerId,
        recipients: t.label,
        // For a player this is their name, as it always was, so older readers
        // still find it. For anybody else it is a key that can never equal a
        // player's name — otherwise a note to a venue manager who happens to
        // share a child's name would turn up in that family's app.
        thread_key: t.threadKey,
        direction: 'out',
        // Who actually sent it. The row belongs to the academy; this says which
        // coach wrote it.
        from_name: me.name,
        channels: channels.filter(c => mine.some(x => x.channel === c && x.ok)).join(', '),
        subject: subj,
        body,
        reply_to: answersFor(t),
        status: okMine === mine.length ? 'sent' : 'partial',
        // The request position is for the screen, not for the record.
        results: mine.map(({ name, channel, ok, detail }) => ({ name, channel, ok, detail })),
      }
    }).filter(Boolean)
    if (rows.length) {
      const { error } = await admin.from('coach_messages').insert(rows)
      if (error) console.error('[coach/message/send] log failed', error.message)
    }

    // A message TO A CAMP is also a message in the camp's own conversation —
    // the one every family on the trip and every coach travelling can see in
    // their app. Without this row the coach's "message the camp" reaches sixteen
    // private threads and the group chat they are all looking at stays empty.
    if (camp && status !== 'failed') {
      {
        // Where this is going in Discord, decided before the row is written so
        // the message can be filed under the channel it actually went to.
        //
        // An explicitly chosen channel wins over the camp's defaults, ticked or
        // not: the coach picked it by reading it. Without one, the defaults are
        // the channels marked "Post Lumio messages here".
        const { data: chans } = await admin.from('coach_camp_channels')
          .select('channel_id, channel_name, mirror').eq('coach_id', me.academyId).eq('camp_id', camp.id)
        const all = (chans as { channel_id: string; channel_name: string | null; mirror: boolean }[] | null) ?? []
        const picked = discordChannel ? all.find(c => c.channel_name === discordChannel) : null
        const rooms = picked ? [picked] : all.filter(c => c.mirror)
        // One destination → file it there. Several → it belongs to no single
        // channel and sits under "All".
        const stamp = rooms.length === 1 ? rooms[0].channel_name : null

        await admin.from('coach_messages').insert({
          coach_id: me.academyId,
          recipients: `Camp · ${camp.name}`,
          thread_key: `camp:${camp.id}`,
          camp_id: camp.id,
          direction: 'out',
          from_name: me.name,
          channels: channels.filter(c => results.some(x => x.channel === c && x.ok)).join(', '),
          subject: subj,
          body,
          status,
          ...(stamp ? { discord_channel_name: stamp } : {}),
        })

        // …and out to Discord, where most of the camp is actually reading.
        //
        // The mirror is what makes the integration worth having: a coach who
        // has to send the same message twice — once in Lumio for the record,
        // once in Discord so anyone sees it — will stop using one of them, and
        // it will not be the one their parents are already in.
        //
        try {
          if (rooms.length) {
            const { postMessage } = await import('@/lib/coach/discord')
            for (const t of rooms) {
              await postMessage(t.channel_id, [subj, body].filter(Boolean).join('\n\n'), me.name || undefined)
            }
          }
        } catch (e) { console.error('[coach/message/send] discord mirror', e) }
      }
    }
  } catch (e) { console.error('[coach/message/send] log failed', e) }

  return NextResponse.json({ status, results })
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
