'use client'

// Live Messages — a demo-style inbox over the coach's message log
// (coach_messages). Conversations are grouped by recipient; open one to see the
// thread, react (👍 ❤️ 😄 ✅), Reply, Forward or Delete, and compose new
// messages. Sending goes through /api/coach/message/send (Email live, Text live
// once Twilio is set, in-app always on). Inbound replies (direction='in') thread
// into the same conversation — SMS via the Twilio webhook now; email once an
// inbound-email source is wired (Gmail read needs Google verification).

import { useState, useEffect, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { useCoachTable, useCoachProfile, dbUpdate, dbRemove } from '../_lib/coach-db'
import { LiveCoachSendMessage } from './LiveCoachSendMessage'
import { avatarSrc } from '@/lib/avatar'

type Msg = { id: string; recipients?: string | null; channels?: string | null; subject?: string | null; body?: string | null; status?: string | null; reaction?: string | null; created_at?: string; direction?: string | null; from_name?: string | null; thread_key?: string | null; external_id?: string | null; read?: boolean | null }
type Player = { id: string; name: string; email?: string | null; phone?: string | null; parent_name?: string | null; avatar_url?: string | null }
const REACTIONS = ['👍', '❤️', '😄', '✅']
const initials = (n: string) => n.split(/[\s,]+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?'
const fmtTime = (d?: string) => { const t = d ? new Date(d) : null; if (!t || isNaN(t.getTime())) return ''; const today = new Date(); return t.toDateString() === today.toDateString() ? t.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : t.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) }

export function LiveMessages({ T, accent }: { T: ThemeTokens; accent: AccentTokens; onConfigure?: () => void }) {
  const history = useCoachTable<Msg>('coach_messages')
  const { rows: players } = useCoachTable<Player>('coach_players')
  const { rows: staff } = useCoachTable<{ id: string; name: string }>('coach_staff')
  const { rows: venues } = useCoachTable<{ id: string; name: string }>('coach_venues')
  const profile = useCoachProfile()
  // Tag a conversation by matching the recipient name against roster / staff / venues.
  const tagFor = (raw?: string | null): string => {
    const n = (raw || '').split(',')[0].trim().toLowerCase()
    if (!n) return 'Contact'
    if (venues.some(v => (v.name || '').trim().toLowerCase() === n)) return 'Venue'
    if (staff.some(s => (s.name || '').trim().toLowerCase() === n)) return 'Coach'
    if (players.some(p => (p.name || '').trim().toLowerCase() === n)) return 'Player'
    return 'Parent'
  }
  const tagColour = (t: string) => t === 'Venue' ? '#3A8EE0' : t === 'Coach' ? accent.hex : t === 'Player' ? T.good : T.text3
  const avatarFor = (key?: string | null) => { const n = (key || '').split(',')[0].trim().toLowerCase(); return players.find(p => (p.name || '').trim().toLowerCase() === n)?.avatar_url as string | undefined }
  const Av = ({ keyName, size }: { keyName: string; size: number }) => {
    const url = avatarFor(keyName)
    // eslint-disable-next-line @next/next/no-img-element
    if (url) return <img src={avatarSrc(url)} alt={keyName} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
    return <span style={{ width: size, height: size, borderRadius: '50%', background: accent.dim, color: accent.hex, display: 'grid', placeItems: 'center', fontSize: size * 0.37, fontWeight: 700, flexShrink: 0 }}>{initials(keyName)}</span>
  }
  const [selKey, setSelKey] = useState<string | null>(null)
  const [compose, setCompose] = useState<false | { recipients: string[]; body: string }>(false)

  // Group the log into conversations keyed by recipient string.
  const convMap = new Map<string, Msg[]>()
  for (const m of history.rows) { const k = (m.recipients || 'Unknown').trim(); if (!convMap.has(k)) convMap.set(k, []); convMap.get(k)!.push(m) }
  const conversations = Array.from(convMap.entries()).map(([key, msgs]) => ({ key, msgs: msgs.slice().sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')) }))
    .sort((a, b) => (b.msgs[0]?.created_at || '').localeCompare(a.msgs[0]?.created_at || ''))
  const sel = conversations.find(c => c.key === selKey) ?? conversations[0]

  const startCompose = (recipients: string[] = [], body = '') => setCompose({ recipients, body })

  // Inbound replies arrive via the inbound-email / SMS webhooks; refresh the log
  // every ~2 min while the inbox is open so they surface without a manual reload.
  useEffect(() => {
    const id = setInterval(() => history.reload(), 120000); return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // Mark a conversation's inbound messages read when it's opened.
  useEffect(() => {
    if (!sel) return
    const unread = sel.msgs.filter((m: any) => m.direction === 'in' && !m.read)
    if (!unread.length) return
    Promise.all(unread.map((m: any) => dbUpdate('coach_messages', m.id, { read: true }))).then(() => history.reload()).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel?.key])

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
                  <Av keyName={c.key} size={30} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.key}</span>
                      {(() => { const t = tagFor(c.key); return <span style={{ fontSize: 8, fontWeight: 700, color: tagColour(t), background: `${tagColour(t)}22`, padding: '1px 5px', borderRadius: 4, textTransform: 'uppercase', flexShrink: 0 }}>{t}</span> })()}
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
                <Av keyName={sel.key} size={34} />
                <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{sel.key}</div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                  <button onClick={() => startCompose(sel.key.split(',').map(s => s.trim()).filter(Boolean))} style={btn(T, accent, 'solid')}>↩ Reply</button>
                  <button onClick={() => startCompose([], sel.msgs[0]?.body || '')} style={btn(T, accent, 'ghost')}>↪ Forward</button>
                </div>
              </div>
              {[...sel.msgs].sort((a, b) => (a.created_at || '').localeCompare(b.created_at || '')).map(m => (
                <div key={m.id} style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', alignItems: m.direction === 'in' ? 'flex-start' : 'stretch' }}>
                  <div style={{ maxWidth: m.direction === 'in' ? '88%' : '100%', background: m.direction === 'in' ? T.panel2 : accent.dim, border: `1px solid ${m.direction === 'in' ? T.border : accent.border}`, borderRadius: 10, padding: '10px 12px' }}>
                    {m.direction === 'in' && <div style={{ fontSize: 10.5, fontWeight: 700, color: T.text2, marginBottom: 3 }}>{m.from_name || sel.key}</div>}
                    {m.subject && <div style={{ fontSize: 12.5, fontWeight: 700, color: T.text, marginBottom: 4 }}>{m.subject}</div>}
                    <div style={{ fontSize: 12.5, color: T.text, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{m.body}</div>
                    <div style={{ fontSize: 10, color: T.text3, marginTop: 6 }}>{[m.direction === 'in' ? 'Received' : m.channels, m.status, fmtTime(m.created_at)].filter(Boolean).join(' · ')}</div>
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

      {compose && <LiveCoachSendMessage T={T} accent={accent} players={players}
        coachName={profile.display_name || 'your coach'} clubName={(profile as any).club_name || (profile as any).academy_name || profile.display_name || 'your academy'}
        init={{ recipient: compose.recipients[0], body: compose.body }}
        onClose={() => setCompose(false)} onSent={() => { setCompose(false); history.reload() }} />}
    </div>
  )
}

function btn(T: ThemeTokens, accent: AccentTokens, kind: 'solid' | 'ghost'): CSSProperties {
  return kind === 'solid'
    ? { appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }
    : { appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }
}
