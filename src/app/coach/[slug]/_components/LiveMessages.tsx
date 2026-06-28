'use client'

// Live Messages — a demo-style inbox over the coach's message log
// (coach_messages). Conversations are grouped by recipient; open one to see the
// thread, react (👍 ❤️ 😄 ✅), Reply, Forward or Delete, and compose new
// messages. Sending goes through /api/coach/message/send (Email live, Text live
// once Twilio is set, in-app always on). Inbound replies arrive at the coach's
// own email / phone — true two-way threading is a later add.

import { useState, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { useCoachTable, useCoachProfile, dbUpdate, dbRemove } from '../_lib/coach-db'

type Msg = { id: string; recipients?: string | null; channels?: string | null; subject?: string | null; body?: string | null; status?: string | null; reaction?: string | null; created_at?: string }
type Player = { id: string; name: string; email?: string | null; phone?: string | null; parent_name?: string | null }
const REACTIONS = ['👍', '❤️', '😄', '✅']
const initials = (n: string) => n.split(/[\s,]+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?'
const fmtTime = (d?: string) => { const t = d ? new Date(d) : null; if (!t || isNaN(t.getTime())) return ''; const today = new Date(); return t.toDateString() === today.toDateString() ? t.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : t.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) }

export function LiveMessages({ T, accent, onConfigure }: { T: ThemeTokens; accent: AccentTokens; onConfigure?: () => void }) {
  const history = useCoachTable<Msg>('coach_messages')
  const { rows: players } = useCoachTable<Player>('coach_players')
  const profile = useCoachProfile()
  const [selKey, setSelKey] = useState<string | null>(null)
  const [compose, setCompose] = useState<false | { recipients: string[]; body: string }>(false)

  // Group the log into conversations keyed by recipient string.
  const convMap = new Map<string, Msg[]>()
  for (const m of history.rows) { const k = (m.recipients || 'Unknown').trim(); if (!convMap.has(k)) convMap.set(k, []); convMap.get(k)!.push(m) }
  const conversations = Array.from(convMap.entries()).map(([key, msgs]) => ({ key, msgs: msgs.slice().sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')) }))
    .sort((a, b) => (b.msgs[0]?.created_at || '').localeCompare(a.msgs[0]?.created_at || ''))
  const sel = conversations.find(c => c.key === selKey) ?? conversations[0]

  const channelsAvailable = ['inapp', ...(profile.contact_email ? ['email'] : []), ...(profile.contact_phone ? ['sms'] : [])]
  const startCompose = (recipients: string[] = [], body = '') => setCompose({ recipients, body })

  return (
    <div style={{ fontFamily: FONT }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.text }}>Messages</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: T.text3 }}>Parents, players, groups and the venue — one inbox. Open a message to read, reply, forward or react.</p>
        </div>
        <button onClick={() => startCompose()} style={{ appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 10, padding: '9px 15px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>✎ New message</button>
      </div>

      {conversations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', background: T.panel, border: `1px dashed ${T.border}`, borderRadius: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>No messages yet</div>
          <div style={{ fontSize: 12.5, color: T.text3, marginTop: 4 }}>Send your first message — it’ll appear here as a conversation.</div>
          <button onClick={() => startCompose()} style={{ marginTop: 14, appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>✎ New message</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 14, alignItems: 'start' }}>
          {/* Inbox list */}
          <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 8, alignSelf: 'start' }}>
            {conversations.map(c => {
              const last = c.msgs[0]; const active = c.key === sel?.key
              return (
                <div key={c.key} onClick={() => setSelKey(c.key)} style={{ display: 'flex', gap: 10, padding: '10px', borderRadius: 8, cursor: 'pointer', background: active ? accent.dim : 'transparent', border: `1px solid ${active ? accent.border : 'transparent'}`, marginBottom: 3 }}>
                  <span style={{ width: 30, height: 30, borderRadius: '50%', background: accent.dim, color: accent.hex, display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{initials(c.key)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.key}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 10, color: T.text3, flexShrink: 0 }}>{fmtTime(last?.created_at)}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: T.text3, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{last?.subject ? `${last.subject} — ` : ''}{last?.body}</div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Thread */}
          {sel && (
            <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, borderBottom: `1px solid ${T.border}`, marginBottom: 12, flexWrap: 'wrap' }}>
                <span style={{ width: 34, height: 34, borderRadius: '50%', background: accent.dim, color: accent.hex, display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700 }}>{initials(sel.key)}</span>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{sel.key}</div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                  <button onClick={() => startCompose(sel.key.split(',').map(s => s.trim()).filter(Boolean))} style={btn(T, accent, 'solid')}>↩ Reply</button>
                  <button onClick={() => startCompose([], sel.msgs[0]?.body || '')} style={btn(T, accent, 'ghost')}>↪ Forward</button>
                </div>
              </div>
              {sel.msgs.map(m => (
                <div key={m.id} style={{ marginBottom: 14 }}>
                  <div style={{ background: accent.dim, border: `1px solid ${accent.border}`, borderRadius: 10, padding: '10px 12px' }}>
                    {m.subject && <div style={{ fontSize: 12.5, fontWeight: 700, color: T.text, marginBottom: 4 }}>{m.subject}</div>}
                    <div style={{ fontSize: 12.5, color: T.text, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{m.body}</div>
                    <div style={{ fontSize: 10, color: T.text3, marginTop: 6 }}>{[m.channels, m.status, fmtTime(m.created_at)].filter(Boolean).join(' · ')}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                    {REACTIONS.map(r => (
                      <button key={r} onClick={() => { dbUpdate('coach_messages', m.id, { reaction: m.reaction === r ? null : r }).then(() => history.reload()) }} title="React"
                        style={{ appearance: 'none', border: m.reaction === r ? `1px solid ${accent.hex}` : `1px solid transparent`, background: m.reaction === r ? accent.dim : 'transparent', borderRadius: 6, padding: '2px 5px', fontSize: 13, cursor: 'pointer', opacity: m.reaction && m.reaction !== r ? 0.4 : 1 }}>{r}</button>
                    ))}
                    <button onClick={() => { if (confirm('Delete this message?')) dbRemove('coach_messages', m.id).then(() => history.reload()) }} style={{ marginLeft: 'auto', appearance: 'none', border: 0, background: 'transparent', color: T.text3, fontSize: 11, cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {compose && <ComposeModal T={T} accent={accent} players={players} profile={profile} channelsAvailable={channelsAvailable}
        prefillRecipients={compose.recipients} prefillBody={compose.body} onConfigure={onConfigure}
        onClose={() => setCompose(false)} onSent={() => { setCompose(false); history.reload() }} />}
    </div>
  )
}

function btn(T: ThemeTokens, accent: AccentTokens, kind: 'solid' | 'ghost'): CSSProperties {
  return kind === 'solid'
    ? { appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }
    : { appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }
}

function ComposeModal({ T, accent, players, profile, channelsAvailable, prefillRecipients, prefillBody, onConfigure, onClose, onSent }: {
  T: ThemeTokens; accent: AccentTokens; players: Player[]; profile: any; channelsAvailable: string[]
  prefillRecipients: string[]; prefillBody: string; onConfigure?: () => void; onClose: () => void; onSent: () => void
}) {
  // Pre-select players whose names match the prefill recipients (reply).
  const initSel = players.filter(p => prefillRecipients.some(r => r.toLowerCase() === p.name.toLowerCase())).map(p => p.id)
  const [selected, setSelected] = useState<string[]>(initSel)
  const [channels, setChannels] = useState<string[]>(['inapp'])
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState(prefillBody ? `Forwarded:\n${prefillBody}` : '')
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState('')
  const toggle = (id: string, list: string[], set: (v: string[]) => void) => set(list.includes(id) ? list.filter(x => x !== id) : [...list, id])
  const CH: { id: string; label: string }[] = [{ id: 'inapp', label: 'Lumio message' }, { id: 'email', label: 'Email' }, { id: 'sms', label: 'Text' }]

  const recipients = players.filter(p => selected.includes(p.id))
  const field: CSSProperties = { width: '100%', background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 9, padding: '9px 11px', fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }

  const send = async () => {
    setErr('')
    if (!recipients.length) { setErr('Choose at least one recipient'); return }
    if (!body.trim()) { setErr('Write a message'); return }
    setSending(true)
    try {
      const res = await fetch('/api/coach/message/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipients: recipients.map(r => ({ name: r.name, email: r.email, phone: r.phone })), channels, subject, body }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Send failed')
      onSent()
    } catch (e) { setErr(e instanceof Error ? e.message : 'Send failed'); setSending(false) }
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, fontFamily: FONT, padding: '4vh 16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 480, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 14 }}>New message</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: T.text3, marginBottom: 6 }}>To</div>
            {players.length === 0 ? <div style={{ fontSize: 12, color: T.text3 }}>No players yet — add players first.</div> : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {players.map(p => { const on = selected.includes(p.id); return <button key={p.id} onClick={() => toggle(p.id, selected, setSelected)} style={{ appearance: 'none', border: `1px solid ${on ? accent.hex : T.border}`, background: on ? accent.dim : 'transparent', color: on ? accent.hex : T.text2, borderRadius: 999, padding: '5px 11px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>{p.name}</button> })}
              </div>
            )}
          </div>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: T.text3, marginBottom: 6 }}>Channels</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {CH.map(c => { const avail = channelsAvailable.includes(c.id); const on = channels.includes(c.id); return (
                <button key={c.id} onClick={() => avail ? toggle(c.id, channels, setChannels) : onConfigure?.()} style={{ appearance: 'none', border: `1px solid ${on ? accent.hex : T.border}`, background: on ? accent.dim : 'transparent', color: avail ? (on ? accent.hex : T.text2) : T.text3, borderRadius: 8, padding: '5px 11px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>{on ? '✓ ' : ''}{c.label}{!avail ? ' · set up' : ''}</button>
              ) })}
            </div>
          </div>
          <div><input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject (optional)" style={field} /></div>
          <div><textarea value={body} onChange={e => setBody(e.target.value)} rows={5} placeholder="Write your message…" style={{ ...field, resize: 'vertical' }} /></div>
          {err && <div style={{ fontSize: 12, color: T.bad }}>{err}</div>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button onClick={onClose} style={{ appearance: 'none', padding: '8px 14px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
          <button onClick={send} disabled={sending} style={{ appearance: 'none', border: 0, padding: '8px 16px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: sending ? 0.6 : 1, fontFamily: FONT }}>{sending ? 'Sending…' : 'Send'}</button>
        </div>
      </div>
    </div>
  )
}
