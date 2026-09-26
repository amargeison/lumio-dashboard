'use client'

// Camp → Discord. Links a camp to the channels its people already use.
//
// The camps that need this most are the ones that never adopted Lumio's own
// thread, because the parents were already in a server asking what time the bus
// leaves. Moving them is a losing argument; joining them is not. So: the bot
// reads those channels into the camp thread, and messages sent from Lumio go
// back out to whichever ones the coach nominates.
//
// Several channels, because a server is not one room — #general, #faqs and
// #important-info are different conversations and stay that way in the inbox.
//
// Nothing here is automatic. The coach picks each channel and can unlink any of
// them in one click: reading a community's conversation into another product
// should never be something that happened to them.

import { useCallback, useEffect, useState } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'

type Guild = { id: string; name: string }
type Channel = { id: string; name: string; parentName?: string }
type Linked = { id: string; guildId: string | null; channelId: string; channelName: string | null; syncedAt: string | null; mirror: boolean }
type Status = { configured: boolean; invite: string | null; guilds: Guild[]; channels: Channel[]; linked: Linked[] }

export function CampDiscord({ T, accent, campId, campName }: { T: ThemeTokens; accent: AccentTokens; campId: string; campName: string }) {
  const [s, setS] = useState<Status | null>(null)
  const [guildId, setGuildId] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const [err, setErr] = useState('')

  const load = useCallback(async (g?: string) => {
    try {
      const q = new URLSearchParams({ campId })
      if (g) q.set('guildId', g)
      const res = await fetch(`/api/coach/discord?${q.toString()}`)
      if (!res.ok) return
      const j: Status = await res.json()
      setS(j)
      // Default the server picker to whatever is already linked, so adding a
      // second channel from the same server is one click rather than three.
      if (!g && !guildId) {
        const first = j.linked.find(l => l.guildId)?.guildId || (j.guilds.length === 1 ? j.guilds[0].id : '')
        if (first) { setGuildId(first); load(first) }
      }
    } catch { /* offline */ }
  }, [campId, guildId])
  useEffect(() => { load() }, [load])

  const post = async (body: Record<string, unknown>) => {
    setBusy(true); setErr(''); setNote('')
    try {
      const res = await fetch('/api/coach/discord', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campId, ...body }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || 'That did not work')
      if (j.error) setErr(j.error)
      else setNote(j.added ? `Pulled in ${j.added} message${j.added === 1 ? '' : 's'}.` : 'Up to date — nothing new.')
      load(guildId)
    } catch (e) { setErr(e instanceof Error ? e.message : 'Failed') }
    setBusy(false)
  }

  const unlink = async (channelId: string) => {
    setBusy(true); setErr('')
    try {
      await fetch(`/api/coach/discord?campId=${campId}&channelId=${channelId}`, { method: 'DELETE' })
      setNote('Unlinked. Messages already pulled in are still on the camp thread.')
      load(guildId)
    } catch { setErr('Could not unlink') }
    setBusy(false)
  }

  const card: React.CSSProperties = { background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }
  const btn = (primary: boolean): React.CSSProperties => ({
    appearance: 'none', cursor: busy ? 'default' : 'pointer', fontFamily: FONT, fontSize: 12.5, fontWeight: 700,
    borderRadius: 9, padding: '8px 14px', opacity: busy ? 0.6 : 1,
    border: primary ? 0 : `1px solid ${T.border}`, background: primary ? accent.hex : 'transparent', color: primary ? T.btnText : T.text2,
  })
  const select: React.CSSProperties = { background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 9, padding: '9px 11px', fontSize: 13, fontFamily: FONT, minWidth: 210 }

  if (!s) return <div style={{ ...card, fontSize: 12.5, color: T.text3 }}>Checking Discord…</div>

  if (!s.configured) return (
    <div style={{ ...card, fontSize: 12.5, color: T.text2, lineHeight: 1.6 }}>
      Discord isn’t set up on this server yet. It needs Lumio’s bot credentials in the environment —
      once they’re there, this page lets you link {campName} to one or more channels.
    </div>
  )

  const linkedIds = new Set(s.linked.map(l => l.channelId))
  const available = s.channels.filter(c => !linkedIds.has(c.id))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Linked channels */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: s.linked.length ? 12 : 0 }}>
          <span style={{ fontSize: 20 }}>💬</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>
              {s.linked.length ? `${s.linked.length} channel${s.linked.length === 1 ? '' : 's'} linked` : 'Bring this camp’s Discord in'}
            </div>
            <div style={{ fontSize: 11.5, color: T.text3, marginTop: 2, lineHeight: 1.5 }}>
              Messages land in the {campName} thread — in your inbox and in every player’s app, kept separate by channel.
            </div>
          </div>
          {s.linked.length > 0 && (
            <button onClick={() => post({ sync: true })} disabled={busy} style={btn(true)}>{busy ? 'Checking…' : 'Sync now'}</button>
          )}
        </div>

        {s.linked.map(l => (
          <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: `1px solid ${T.border}`, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>#{l.channelName || 'channel'}</span>
            <span style={{ fontSize: 10.5, color: T.text3 }}>
              {l.syncedAt ? `checked ${new Date(l.syncedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : 'not synced yet'}
            </span>
            <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: T.text2, cursor: 'pointer' }}>
              <input type="checkbox" checked={l.mirror} onChange={e => post({ channelId: l.channelId, mirror: e.target.checked })} />
              Post Lumio messages here
            </label>
            <button onClick={() => unlink(l.channelId)} disabled={busy} style={{ ...btn(false), padding: '6px 11px', fontSize: 11.5 }}>Unlink</button>
          </div>
        ))}
      </div>

      {/* Add a channel */}
      <div style={card}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Add a channel</div>
        {s.guilds.length === 0 ? (
          <div style={{ fontSize: 12.5, color: T.text2, lineHeight: 1.6 }}>
            Lumio’s bot isn’t in your Discord server yet.{' '}
            {s.invite && <a href={s.invite} target="_blank" rel="noopener noreferrer" style={{ color: accent.hex, fontWeight: 700 }}>Add it to your server →</a>}
            <div style={{ fontSize: 11, color: T.text3, marginTop: 8, lineHeight: 1.6 }}>
              You need to be an admin of the server. The bot asks for three permissions only: see channels, read message
              history and send messages. Come back here afterwards and your server will be in the list.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={guildId} onChange={e => { setGuildId(e.target.value); load(e.target.value) }} style={select}>
              <option value="">Select a server…</option>
              {s.guilds.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <select value="" disabled={!guildId || available.length === 0}
              onChange={e => {
                const ch = s.channels.find(c => c.id === e.target.value)
                if (ch) post({ guildId, channelId: ch.id, channelName: ch.name })
              }} style={{ ...select, opacity: guildId ? 1 : 0.5 }}>
              <option value="">
                {!guildId ? 'Pick a server first' : available.length ? 'Add a channel…' : 'Every channel is linked'}
              </option>
              {available.map(c => <option key={c.id} value={c.id}>{c.parentName ? `${c.parentName} / ` : ''}#{c.name}</option>)}
            </select>
            {s.invite && <a href={s.invite} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11.5, color: T.text3 }}>Add to another server →</a>}
          </div>
        )}
        <div style={{ fontSize: 11, color: T.text3, marginTop: 10, lineHeight: 1.6 }}>
          Linking starts from now — a channel’s back catalogue isn’t imported. Photos posted in Discord are copied into
          Lumio, because Discord’s own image links expire after about a day. Tell your group the channels are mirrored
          into the app; people should know where what they write ends up.
        </div>
      </div>

      {note && <div style={{ fontSize: 12, color: T.good, fontWeight: 600 }}>{note}</div>}
      {err && <div style={{ fontSize: 12, color: T.warn, fontWeight: 600, lineHeight: 1.5 }}>{err}</div>}
    </div>
  )
}
