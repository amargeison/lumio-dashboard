'use client'

// Promote a camp.
//
// Deliberately NOT auto-posting. Real publishing to Instagram, Facebook, X and
// WhatsApp means Meta app review, a paid X tier and a WhatsApp Business number —
// platform paperwork measured in months, and it fails silently the moment a
// token expires. What a coach is actually short of is the words. So Boris writes
// them per channel, the coach edits them, and the only thing Lumio SENDS is the
// email — to the coach's own roster, which is the one channel we genuinely own.

import { useState, useMemo, type CSSProperties } from 'react'
import { isAdult } from '@/lib/coach/camp-audience'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { dbUpdate } from '../_lib/coach-db'

type Promo = {
  email?: { subject?: string; preheader?: string; paragraphs?: string[]; cta?: string }
  whatsapp?: string
  social?: { caption?: string; hashtags?: string[] }
  poster?: { headline?: string; sub?: string }
}
export type PromoPlayer = {
  id: string; name: string; age?: number | null
  email?: string | null; parent_email?: string | null; parent_name?: string | null
  category?: string | null
  /** The family asked not to be sent camp announcements (migration 201). */
  no_camp_emails?: boolean | null
}
type Contact = { email: string; label: string; via: string }
const norm = (s?: string | null) => String(s ?? '').trim().toLowerCase()
// The same test the send route uses, so the list never offers an address the
// server will then drop.
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(s)
/** Every address that belongs to a player who has asked not to hear about camps. */
function optedOutAddresses(players: PromoPlayer[]): Set<string> {
  const out = new Set<string>()
  for (const p of players) if (p.no_camp_emails) for (const a of [p.email, p.parent_email]) if (norm(a)) out.add(norm(a))
  return out
}

// Same safeguarding rule as booking confirmations: an under-16 is reached
// through the parent, and an unknown age is treated as a minor.
// `booked` — players already on this camp. They are left out: "places are open"
// is not news to a family whose child is on the list. (A brother or sister who
// is not booked still puts the family on the list, under their name.)
function contactsFrom(players: PromoPlayer[], which: 'on' | 'off' = 'on', booked?: { ids: Set<string>; emails: Set<string> }): Contact[] {
  const seen = new Map<string, Contact>()
  const off = optedOutAddresses(players)
  for (const p of players) {
    if (which === 'on' && booked?.ids.has(p.id)) continue
    // One shared rule, from camp-audience.ts. This used to be a third private
    // copy of `age < 16`, so a fix in the cron left the Promote tab wrong.
    // With no age on file, the roster's own "Adult" label decides — an adult
    // who booked online is filed that way, and was being listed as a parent
    // (or not at all).
    const adult = isAdult(null, p.age) || (p.age == null && norm(p.category) === 'adult')
    const email = norm(adult ? (p.email || p.parent_email) : p.parent_email)
    if (!isEmail(email)) continue
    if (off.has(email) !== (which === 'off')) continue
    // A place held under this address with no roster record (an online sign-up not yet matched).
    if (which === 'on' && booked?.emails.has(email)) continue
    if (!seen.has(email)) {
      seen.set(email, { email, label: p.name, via: adult ? 'player' : (p.parent_name || 'parent') })
    }
  }
  return [...seen.values()].sort((a, b) => a.label.localeCompare(b.label))
}

export function CampPromote({ T, accent, campId, campName, players, attendees = [], onPlayersChanged }: {
  T: ThemeTokens; accent: AccentTokens; campId: string; campName: string; players: PromoPlayer[]
  /** Who is on this camp already (cancelled places do not count). */
  attendees?: { player_id?: string | null; parent_email?: string | null; status?: string | null }[]
  /** Re-read the roster after somebody is taken off (or put back on) the list. */
  onPlayersChanged?: () => Promise<void> | void
}) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [promo, setPromo] = useState<Promo | null>(null)
  const [signupUrl, setSignupUrl] = useState<string | null>(null)
  const [subject, setSubject] = useState('')
  const [bodyText, setBodyText] = useState('')
  const [cta, setCta] = useState('')
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState('')
  const [sending, setSending] = useState(false)

  const booked = useMemo(() => {
    const live = attendees.filter(a => (a.status || '') !== 'cancelled')
    return {
      ids: new Set(live.map(a => a.player_id).filter(Boolean) as string[]),
      emails: new Set(live.filter(a => !a.player_id).map(a => norm(a.parent_email)).filter(Boolean)),
    }
  }, [attendees])
  const contacts = useMemo(() => contactsFrom(players, 'on', booked), [players, booked])
  const leftOut = useMemo(() => contactsFrom(players).length - contacts.length, [players, contacts])
  const stopped = useMemo(() => contactsFrom(players, 'off'), [players])
  const [listBusy, setListBusy] = useState('')

  // "Reply and you'll be taken off the list" is in the footer of every
  // announcement. This is the list: one tick per family, kept on the player,
  // and the send route leaves them out from then on whatever is ticked here.
  const setStopped = async (email: string, stop: boolean) => {
    if (listBusy) return
    const who = players.filter(p => [norm(p.email), norm(p.parent_email)].includes(email) && !!p.no_camp_emails !== stop)
    if (stop && !confirm(`Stop sending camp announcements to ${email}?\n\nThey will be left out of every announcement from now on. Emails about a camp they are booked on still go.`)) return
    setListBusy(email); setErr(''); setMsg('')
    try {
      for (const p of who) await dbUpdate('coach_players', p.id, { no_camp_emails: stop })
      setPicked(prev => { const n = new Set(prev); n.delete(email); return n })
      await onPlayersChanged?.()
      setMsg(stop ? `${email} will not be sent camp announcements.` : `${email} is back on the list.`)
    } catch (e) { setErr(e instanceof Error ? e.message : 'That was not saved. Try again.') }
    finally { setListBusy('') }
  }

  const copy = (key: string, text: string) => {
    navigator.clipboard?.writeText(text)
    setCopied(key); setTimeout(() => setCopied(''), 1800)
  }

  const generate = async () => {
    setBusy(true); setErr(''); setMsg('')
    try {
      const res = await fetch('/api/coach/camp-promo', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campId }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Could not write the copy')
      const p: Promo = d.promo || {}
      setPromo(p); setSignupUrl(d.signupUrl || null)
      setSubject(p.email?.subject || `${campName} — places open`)
      setBodyText((p.email?.paragraphs || []).join('\n\n'))
      setCta(p.email?.cta || '')
      // Nobody is ticked until the coach ticks them. Pre-selecting the whole
      // roster meant one press of Send mailed everybody, every time — including
      // the families nobody had stopped to think about. "All" is one click.
      setPicked(new Set())
    } catch (e) { setErr(e instanceof Error ? e.message : 'Could not write the copy') }
    finally { setBusy(false) }
  }

  const paragraphs = bodyText.split(/\n{2,}/).map(s => s.trim()).filter(Boolean)

  const send = async (testOnly: boolean) => {
    if (sending) return
    if (!testOnly) {
      const n = picked.size
      if (!n) { setErr('Nobody is selected.'); return }
      if (!confirm(`Send this to ${n} ${n === 1 ? 'person' : 'people'}? It goes out immediately and cannot be recalled.`)) return
    }
    setSending(true); setErr(''); setMsg('')
    try {
      const res = await fetch('/api/coach/camp-blast', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campId, subject, paragraphs, cta, testOnly, recipients: testOnly ? [] : [...picked] }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Could not send')
      setMsg(testOnly
        ? `Test sent to ${d.to}. Check it looks right before you send it to anyone else.`
        : `Sent to ${d.sent} ${d.sent === 1 ? 'person' : 'people'}${d.failed ? ` · ${d.failed} failed` : ''}${d.dropped ? ` · ${d.dropped} skipped (not on your roster)` : ''}.`)
    } catch (e) { setErr(e instanceof Error ? e.message : 'Could not send') }
    finally { setSending(false) }
  }

  const card: CSSProperties = { background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }
  const inp: CSSProperties = { width: '100%', background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 11px', fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }
  const lbl: CSSProperties = { fontSize: 9.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }
  const ghost: CSSProperties = { appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 8, padding: '6px 11px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }

  if (!promo) {
    return (
      <div style={{ ...card, textAlign: 'center', padding: '36px 20px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Tell people the camp is on</div>
        <p style={{ fontSize: 12.5, color: T.text3, lineHeight: 1.6, margin: '6px auto 0', maxWidth: 460 }}>
          Lumio Coach writes the announcement four ways — an email for your roster, a message people can forward,
          a caption for Instagram or Facebook, and a headline for a poster. You edit anything you don&apos;t like before it goes anywhere.
        </p>
        {err && <div style={{ fontSize: 12, color: T.bad, marginTop: 12 }}>{err}</div>}
        <button onClick={generate} disabled={busy} style={{ marginTop: 16, appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: busy ? 'wait' : 'pointer', fontFamily: FONT }}>
          {busy ? 'Writing…' : '✦ Write the announcement'}
        </button>
      </div>
    )
  }

  const social = promo.social || {}
  const tags = (social.hashtags || []).map(h => '#' + String(h).replace(/^#/, '')).join(' ')
  const socialFull = [social.caption, tags].filter(Boolean).join('\n\n') + (signupUrl ? `\n\n${signupUrl}` : '')
  const waFull = (promo.whatsapp || '') + (signupUrl ? `\n\n${signupUrl}` : '')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {!signupUrl && (
        <div style={{ ...card, borderColor: `${T.warn}66`, background: `${T.warn}12`, fontSize: 12.5, color: T.text2, lineHeight: 1.6 }}>
          Your sign-up page is closed, so the copy asks parents to reply to you rather than pointing at a link.
          Open it in the &ldquo;Public sign-up page&rdquo; box above, then re-write the copy to include the link.
        </div>
      )}

      {/* ── Email to the roster ── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Email your roster</div>
          <span style={{ fontSize: 11, color: T.text3 }}>{contacts.length} contactable · {picked.size} selected{leftOut > 0 ? ` · ${leftOut} already booked on this camp, left out` : ''}</span>
          <button onClick={generate} disabled={busy} style={{ ...ghost, marginLeft: 'auto' }}>{busy ? 'Writing…' : '✦ Re-write'}</button>
        </div>

        <div style={lbl}>Subject</div>
        <input value={subject} onChange={e => setSubject(e.target.value)} style={{ ...inp, marginTop: 4 }} />
        {promo.email?.preheader && <div style={{ fontSize: 11, color: T.text3, marginTop: 5 }}>Inbox preview: {promo.email.preheader}</div>}

        <div style={{ ...lbl, marginTop: 12 }}>Message · blank line between paragraphs</div>
        <textarea value={bodyText} onChange={e => setBodyText(e.target.value)} rows={9}
          style={{ ...inp, marginTop: 4, resize: 'vertical', lineHeight: 1.6 }} />
        <div style={{ fontSize: 11, color: T.text3, marginTop: 4 }}>
          Everyone gets their own copy, addressed to them by name — never a group email. Your logo, the greeting and your sign-off are added automatically.
        </div>

        <div style={{ ...lbl, marginTop: 12 }}>The line that carries the link</div>
        <input value={cta} onChange={e => setCta(e.target.value)} style={{ ...inp, marginTop: 4 }} />

        {contacts.length === 0 ? (
          <div style={{ fontSize: 12.5, color: T.warn, marginTop: 14 }}>
            Nobody on your roster has an email address yet. Add email addresses on the Players page and they&apos;ll appear here.
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '14px 0 6px', flexWrap: 'wrap' }}>
              <div style={lbl}>Who it goes to</div>
              <button onClick={() => setPicked(new Set(contacts.map(c => c.email)))} style={{ ...ghost, padding: '3px 9px', fontSize: 11 }}>All</button>
              <button onClick={() => setPicked(new Set())} style={{ ...ghost, padding: '3px 9px', fontSize: 11 }}>None</button>
            </div>
            <div style={{ maxHeight: 210, overflowY: 'auto', border: `1px solid ${T.border}`, borderRadius: 9, padding: '4px 10px' }}>
              {contacts.map(c => (
                <label key={c.email} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 0', cursor: 'pointer' }}>
                  <input type="checkbox" checked={picked.has(c.email)} onChange={e => {
                    setPicked(prev => { const n = new Set(prev); if (e.target.checked) n.add(c.email); else n.delete(c.email); return n })
                  }} />
                  <span style={{ fontSize: 12.5, color: T.text, flex: 1, minWidth: 0 }}>{c.label}</span>
                  <span style={{ fontSize: 11, color: T.text3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{c.email}</span>
                  <span style={{ fontSize: 9, color: T.text3, textTransform: 'uppercase', letterSpacing: 0.4 }}>{c.via === 'player' ? 'player' : 'parent'}</span>
                  <button onClick={e => { e.preventDefault(); void setStopped(c.email, true) }} disabled={!!listBusy} title="They asked not to hear about camps"
                    style={{ ...ghost, padding: '2px 8px', fontSize: 10.5, whiteSpace: 'nowrap' }}>{listBusy === c.email ? 'Saving…' : 'Stop camp emails'}</button>
                </label>
              ))}
            </div>
            <div style={{ fontSize: 11, color: T.text3, marginTop: 6, lineHeight: 1.55 }}>
              Nobody is ticked until you tick them. Every announcement tells people they can reply to be taken off the list — when somebody does,
              press &ldquo;Stop camp emails&rdquo; beside their name and they are left out from then on.
            </div>
          </>
        )}
        {stopped.length > 0 && (
          <div style={{ marginTop: 10, border: `1px solid ${T.border}`, borderRadius: 9, padding: '8px 10px' }}>
            <div style={lbl}>Asked not to hear about camps · {stopped.length}</div>
            {stopped.map(c => (
              <div key={c.email} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '5px 0', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12.5, color: T.text2, flex: 1, minWidth: 0 }}>{c.label}</span>
                <span style={{ fontSize: 11, color: T.text3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{c.email}</span>
                <button onClick={() => void setStopped(c.email, false)} disabled={!!listBusy} style={{ ...ghost, padding: '2px 8px', fontSize: 10.5 }}>{listBusy === c.email ? 'Saving…' : 'Put back on the list'}</button>
              </div>
            ))}
          </div>
        )}

        {err && <div style={{ fontSize: 12, color: T.bad, marginTop: 10 }}>{err}</div>}
        {!err && msg && <div style={{ fontSize: 12, color: T.good, marginTop: 10 }}>{msg}</div>}

        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <button onClick={() => send(true)} disabled={sending} style={ghost}>Send a test to me</button>
          <button onClick={() => send(false)} disabled={sending || picked.size === 0}
            style={{ appearance: 'none', border: 0, background: picked.size ? accent.hex : T.hover, color: picked.size ? T.btnText : T.text3, borderRadius: 9, padding: '8px 16px', fontSize: 12.5, fontWeight: 700, cursor: sending || !picked.size ? 'default' : 'pointer', fontFamily: FONT }}>
            {sending ? 'Sending…' : `Send to ${picked.size} ${picked.size === 1 ? 'person' : 'people'}`}
          </button>
        </div>
      </div>

      {/* ── Paste-anywhere copy ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        <Channel T={T} accent={accent} title="WhatsApp / text" hint="What one person forwards to another."
          text={waFull} copied={copied === 'wa'} onCopy={() => copy('wa', waFull)} />
        <Channel T={T} accent={accent} title="Instagram / Facebook" hint="First line is the hook — the rest gets truncated."
          text={socialFull} copied={copied === 'social'} onCopy={() => copy('social', socialFull)} />
      </div>

      {promo.poster?.headline && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Poster line</div>
            <button onClick={() => copy('poster', `${promo.poster?.headline}\n${promo.poster?.sub || ''}`.trim())}
              style={{ ...ghost, marginLeft: 'auto' }}>{copied === 'poster' ? '✓ Copied' : 'Copy'}</button>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.text, marginTop: 10, lineHeight: 1.2 }}>{promo.poster.headline}</div>
          {promo.poster.sub && <div style={{ fontSize: 13.5, color: T.text2, marginTop: 5 }}>{promo.poster.sub}</div>}
        </div>
      )}

      <div style={{ fontSize: 11.5, color: T.text3, lineHeight: 1.6 }}>
        Lumio doesn&apos;t post to Instagram, Facebook or X for you. Doing that properly means Meta app review and a paid X tier,
        and the tokens break quietly when they expire — so you&apos;d find out from a parent, not from us. Copy, paste, post. It takes twenty seconds and it always works.
      </div>
    </div>
  )
}

function Channel({ T, accent, title, hint, text, copied, onCopy }: {
  T: ThemeTokens; accent: AccentTokens; title: string; hint: string; text: string; copied: boolean; onCopy: () => void
}) {
  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{title}</div>
        <button onClick={onCopy} style={{ marginLeft: 'auto', appearance: 'none', border: 0, background: copied ? `${T.good}22` : accent.dim, color: copied ? T.good : accent.hex, borderRadius: 8, padding: '5px 11px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <div style={{ fontSize: 11, color: T.text3, marginTop: 3 }}>{hint}</div>
      <div style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 9, padding: '11px 12px', marginTop: 10, fontSize: 12.5, color: T.text2, lineHeight: 1.6, whiteSpace: 'pre-wrap', flex: 1 }}>{text}</div>
    </div>
  )
}
