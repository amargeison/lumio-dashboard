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

type Promo = {
  email?: { subject?: string; preheader?: string; paragraphs?: string[]; cta?: string }
  whatsapp?: string
  social?: { caption?: string; hashtags?: string[] }
  poster?: { headline?: string; sub?: string }
}
export type PromoPlayer = {
  id: string; name: string; age?: number | null
  email?: string | null; parent_email?: string | null; parent_name?: string | null
}
type Contact = { email: string; label: string; via: string }

// Same safeguarding rule as booking confirmations: an under-16 is reached
// through the parent, and an unknown age is treated as a minor.
function contactsFrom(players: PromoPlayer[]): Contact[] {
  const seen = new Map<string, Contact>()
  for (const p of players) {
    // One shared rule, from camp-audience.ts. This used to be a third private
    // copy of `age < 16`, so a fix in the cron left the Promote tab wrong.
    const adult = isAdult(null, p.age)
    const raw = (adult ? (p.email || p.parent_email) : p.parent_email) || ''
    const email = raw.trim().toLowerCase()
    if (!email.includes('@')) continue
    if (!seen.has(email)) {
      seen.set(email, { email, label: p.name, via: adult ? 'player' : (p.parent_name || 'parent') })
    }
  }
  return [...seen.values()].sort((a, b) => a.label.localeCompare(b.label))
}

export function CampPromote({ T, accent, campId, campName, players }: {
  T: ThemeTokens; accent: AccentTokens; campId: string; campName: string; players: PromoPlayer[]
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

  const contacts = useMemo(() => contactsFrom(players), [players])

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
      // Everybody is selected by default: a coach announcing a camp means the
      // whole roster, and unticking a family is easier than ticking forty.
      setPicked(new Set(contacts.map(c => c.email)))
    } catch (e) { setErr(e instanceof Error ? e.message : 'Could not write the copy') }
    finally { setBusy(false) }
  }

  const paragraphs = bodyText.split(/\n{2,}/).map(s => s.trim()).filter(Boolean)

  const send = async (testOnly: boolean) => {
    if (sending) return
    if (!testOnly) {
      const n = picked.size
      if (!n) { setErr('Nobody is selected.'); return }
      if (!confirm(`Send this to ${n} ${n === 1 ? 'family' : 'families'}? It goes out immediately and cannot be recalled.`)) return
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
        : `Sent to ${d.sent} ${d.sent === 1 ? 'family' : 'families'}${d.failed ? ` · ${d.failed} failed` : ''}${d.dropped ? ` · ${d.dropped} skipped (not on your roster)` : ''}.`)
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
          Open it on the Overview tab and re-write the copy to include the link.
        </div>
      )}

      {/* ── Email to the roster ── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Email your roster</div>
          <span style={{ fontSize: 11, color: T.text3 }}>{contacts.length} contactable · {picked.size} selected</span>
          <button onClick={generate} disabled={busy} style={{ ...ghost, marginLeft: 'auto' }}>{busy ? 'Writing…' : '✦ Re-write'}</button>
        </div>

        <div style={lbl}>Subject</div>
        <input value={subject} onChange={e => setSubject(e.target.value)} style={{ ...inp, marginTop: 4 }} />
        {promo.email?.preheader && <div style={{ fontSize: 11, color: T.text3, marginTop: 5 }}>Inbox preview: {promo.email.preheader}</div>}

        <div style={{ ...lbl, marginTop: 12 }}>Message · blank line between paragraphs</div>
        <textarea value={bodyText} onChange={e => setBodyText(e.target.value)} rows={9}
          style={{ ...inp, marginTop: 4, resize: 'vertical', lineHeight: 1.6 }} />
        <div style={{ fontSize: 11, color: T.text3, marginTop: 4 }}>
          Each family gets their own copy, addressed to them by name — never a group email. Your logo, the greeting and your sign-off are added automatically.
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
                </label>
              ))}
            </div>
          </>
        )}

        {err && <div style={{ fontSize: 12, color: T.bad, marginTop: 10 }}>{err}</div>}
        {!err && msg && <div style={{ fontSize: 12, color: T.good, marginTop: 10 }}>{msg}</div>}

        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <button onClick={() => send(true)} disabled={sending} style={ghost}>Send a test to me</button>
          <button onClick={() => send(false)} disabled={sending || picked.size === 0}
            style={{ appearance: 'none', border: 0, background: picked.size ? accent.hex : T.hover, color: picked.size ? T.btnText : T.text3, borderRadius: 9, padding: '8px 16px', fontSize: 12.5, fontWeight: 700, cursor: sending || !picked.size ? 'default' : 'pointer', fontFamily: FONT }}>
            {sending ? 'Sending…' : `Send to ${picked.size} ${picked.size === 1 ? 'family' : 'families'}`}
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
