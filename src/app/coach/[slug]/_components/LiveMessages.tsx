'use client'

// Live Messages for the Tennis Coach portal. Compose to your players over
// Email (live) and Text (live once Twilio is configured). WhatsApp is shown as
// coming soon. Every send is logged to coach_messages and shown in history.

import { useState } from 'react'
import { useCoachTable } from '../_lib/coach-db'

type ThemeTokens = {
  text: string; text2: string; text3: string; panel: string; panel2: string
  border: string; btnText: string; isDark: boolean
}
type AccentTokens = { hex: string; dim: string }

const CHANNELS = [
  { id: 'email', label: 'Email', tag: 'Live', enabled: true },
  { id: 'sms', label: 'Text', tag: 'Live', enabled: true },
  { id: 'whatsapp', label: 'WhatsApp', tag: 'Soon', enabled: false },
]

export function LiveMessages({ T, accent }: { T: ThemeTokens; accent: AccentTokens }) {
  const players = useCoachTable<any>('coach_players')
  const history = useCoachTable<any>('coach_messages')

  const [selected, setSelected] = useState<string[]>([])   // player ids
  const [channels, setChannels] = useState<string[]>(['email'])
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ status: string; results: any[] } | null>(null)
  const [err, setErr] = useState('')

  const toggle = (id: string, list: string[], set: (v: string[]) => void) =>
    set(list.includes(id) ? list.filter(x => x !== id) : [...list, id])

  const recipients = players.rows.filter(p => selected.includes(p.id))

  const send = async () => {
    setErr(''); setResult(null)
    if (!recipients.length) { setErr('Select at least one player'); return }
    if (!channels.length) { setErr('Choose at least one channel'); return }
    if (!body.trim()) { setErr('Write a message'); return }
    setSending(true)
    try {
      const res = await fetch('/api/coach/message/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: recipients.map(r => ({ name: r.name, email: r.email, phone: r.phone })),
          channels, subject, body,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Send failed')
      setResult(data)
      setBody(''); setSubject(''); setSelected([])
      history.reload()
    } catch (e) { setErr(e instanceof Error ? e.message : 'Send failed') }
    setSending(false)
  }

  const inputStyle: React.CSSProperties = { width: '100%', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 12px', color: T.text, fontSize: 13, boxSizing: 'border-box', outline: 'none' }
  const chip = (on: boolean): React.CSSProperties => ({ background: on ? accent.dim : T.panel2, border: `1px solid ${on ? accent.hex : T.border}`, color: on ? accent.hex : T.text2 })

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: 0 }}>Messages</h2>
        <p style={{ color: T.text3, fontSize: 13, margin: '4px 0 0' }}>Message your players by email and text.</p>
      </div>

      <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18, marginBottom: 20 }}>
        {/* Recipients */}
        <label style={lbl(T)}>Players</label>
        {players.loading ? (
          <p style={{ color: T.text3, fontSize: 13 }}>Loading players…</p>
        ) : players.rows.length === 0 ? (
          <p style={{ color: T.text3, fontSize: 13, margin: '0 0 12px' }}>No players yet — add players first, then message them here.</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
            {players.rows.map(p => {
              const on = selected.includes(p.id)
              const has = [p.email && 'email', p.phone && 'text'].filter(Boolean).join(' · ')
              return (
                <button key={p.id} onClick={() => toggle(p.id, selected, setSelected)} title={has || 'no contact details'}
                  style={{ ...chip(on), borderRadius: 999, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  {p.name}{has ? '' : ' ⚠'}
                </button>
              )
            })}
          </div>
        )}

        {/* Channels */}
        <label style={lbl(T)}>Send via</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          {CHANNELS.map(c => {
            const on = channels.includes(c.id)
            return (
              <button key={c.id} disabled={!c.enabled} onClick={() => c.enabled && toggle(c.id, channels, setChannels)}
                style={{ ...chip(on && c.enabled), borderRadius: 10, padding: '8px 13px', fontSize: 13, fontWeight: 600, cursor: c.enabled ? 'pointer' : 'not-allowed', opacity: c.enabled ? 1 : 0.5, display: 'flex', alignItems: 'center', gap: 7 }}>
                {c.label}
                <span style={{ fontSize: 8.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '1px 5px', borderRadius: 4, color: c.enabled ? '#22C55E' : T.text3, background: c.enabled ? 'rgba(34,197,94,0.15)' : T.panel2 }}>{c.tag}</span>
              </button>
            )
          })}
        </div>

        {/* Subject (email only) */}
        {channels.includes('email') && (
          <>
            <label style={lbl(T)}>Subject (email)</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="A message from your coach" style={{ ...inputStyle, marginBottom: 14 }} />
          </>
        )}

        {/* Body */}
        <label style={lbl(T)}>Message</label>
        <textarea value={body} onChange={e => setBody(e.target.value)} rows={5} placeholder="Type your message…" style={{ ...inputStyle, resize: 'vertical', marginBottom: 14 }} />

        {err && <p style={{ color: '#EF4444', fontSize: 12, margin: '0 0 10px' }}>{err}</p>}

        <button onClick={send} disabled={sending} style={{ padding: '11px 20px', borderRadius: 10, border: 'none', background: accent.hex, color: T.btnText, fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: sending ? 0.6 : 1 }}>
          {sending ? 'Sending…' : 'Send message'}
        </button>

        {result && (
          <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: T.panel2, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: result.status === 'sent' ? '#22C55E' : result.status === 'partial' ? '#F59E0B' : '#EF4444', marginBottom: 6 }}>
              {result.status === 'sent' ? 'Sent ✓' : result.status === 'partial' ? 'Partially sent' : 'Failed'}
            </div>
            {result.results.map((r, i) => (
              <div key={i} style={{ fontSize: 12, color: T.text2, display: 'flex', gap: 8, padding: '2px 0' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.ok ? '#22C55E' : '#EF4444', marginTop: 6, flexShrink: 0 }} />
                <span><b style={{ color: T.text }}>{r.name}</b> · {r.channel}: {r.detail}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History */}
      <p style={lbl(T)}>Recent messages</p>
      {history.loading ? null : history.rows.length === 0 ? (
        <p style={{ color: T.text3, fontSize: 13 }}>No messages sent yet.</p>
      ) : (
        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
          {history.rows.map((m: any) => (
            <div key={m.id} style={{ padding: '11px 16px', borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ color: T.text, fontSize: 13, fontWeight: 600 }}>{m.recipients || '—'}</span>
                <span style={{ color: T.text3, fontSize: 11 }}>{new Date(m.created_at).toLocaleString('en-GB')}</span>
              </div>
              <div style={{ color: T.text3, fontSize: 12, marginTop: 2 }}>{m.channels} · {m.status}</div>
              {m.body && <div style={{ color: T.text2, fontSize: 12, marginTop: 4, whiteSpace: 'pre-wrap' }}>{m.body.length > 160 ? m.body.slice(0, 160) + '…' : m.body}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function lbl(T: ThemeTokens): React.CSSProperties {
  return { display: 'block', color: T.text3, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }
}
