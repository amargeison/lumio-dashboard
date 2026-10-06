'use client'

// Live Messages — a demo-style inbox over the coach's message log
// (coach_messages). A conversation is one PLAYER (by id), one camp, or one named
// contact — never "everyone with this name"; open one to see the
// thread, react (👍 ❤️ 😄 ✅), Reply, Forward or Delete, and compose new
// messages. Sending goes through /api/coach/message/send (Email live, Text live
// once Twilio is set, in-app always on). Inbound replies (direction='in') thread
// into the same conversation — SMS via the Twilio webhook now; email once an
// inbound-email source is wired (Gmail read needs Google verification).

import { useState, useEffect, type CSSProperties, type ReactNode } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { useCoachTable, useCoachProfile, dbUpdate, dbRemove, currentIdentity } from '../_lib/coach-db'
import { LiveCoachSendMessage } from './LiveCoachSendMessage'
import { avatarSrc } from '@/lib/avatar'

type Attachment = { name: string; path: string }
type Msg = { id: string; player_id?: string | null; to_name?: string | null; camp_id?: string | null; recipients?: string | null; channels?: string | null; subject?: string | null; body?: string | null; status?: string | null; reaction?: string | null; created_at?: string; direction?: string | null; from_name?: string | null; thread_key?: string | null; external_id?: string | null; read?: boolean | null; discord_channel_name?: string | null; results?: { discord?: { attachments?: Attachment[] } } | null }

// Photos that came in from Discord. The file itself is in Lumio's private
// bucket (Discord's own links expire within a day), so the <img> points at the
// signing proxy rather than at storage.
const attachmentsOf = (m: Msg): Attachment[] => m.results?.discord?.attachments ?? []

// The sync writes "📎 filename" into the body so a message with nothing but a
// photo is not blank. Once the photo itself is on screen that line is noise, so
// the ones we can render are dropped from the text.
const textOf = (m: Msg): string => {
  const shown = new Set(attachmentsOf(m).map(a => a.name))
  return String(m.body || '').split('\n')
    .filter(line => !(line.startsWith('\u{1F4CE} ') && shown.has(line.slice(2).trim())))
    .join('\n').trim()
}
// Lumio's own notices carry their links as "[Google Calendar](https://…)". The
// family's page and the dashboard inbox show the label; this thread printed the
// whole thing, four lines of encoded web address per notice.
const LABELLED_LINK = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g
/** For a one-line preview: the label only. */
const plainText = (t?: string | null) => String(t ?? '').replace(LABELLED_LINK, '$1')
/** For the thread: the label as a link. */
function linked(text: string, colour: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = new RegExp(LABELLED_LINK.source, 'g')
  let last = 0, i = 0, m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    out.push(<a key={`l${i++}`} href={m[2]} target="_blank" rel="noopener noreferrer" style={{ color: colour, fontWeight: 600 }}>{m[1]} ↗</a>)
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}
const mediaUrl = (path: string) => `/api/coach/discord-media?p=${encodeURIComponent(path)}`
type Player = { id: string; name: string; age?: number | string | null; email?: string | null; phone?: string | null; parent_name?: string | null; avatar_url?: string | null }
const REACTIONS = ['👍', '❤️', '😄', '✅']
// Initials from the words that start with a letter or digit, one whole character
// each. Taking w[0] cut an emoji in half ("Ivy 🎾" showed as "I" and a broken box).
const initials = (n: string) => n.split(/[\s,]+/).filter(w => /^[\p{L}\p{N}]/u.test(w)).slice(0, 2).map(w => Array.from(w)[0].toUpperCase()).join('') || '?'
const fmtTime = (d?: string) => { const t = d ? new Date(d) : null; if (!t || isNaN(t.getTime())) return ''; const today = new Date(); return t.toDateString() === today.toDateString() ? t.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : t.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) }

export function LiveMessages({ T, accent }: { T: ThemeTokens; accent: AccentTokens; onConfigure?: () => void }) {
  const history = useCoachTable<Msg>('coach_messages')
  const { rows: players } = useCoachTable<Player>('coach_players')
  const { rows: staff } = useCoachTable<{ id: string; name: string }>('coach_staff')
  const { rows: venues } = useCoachTable<{ id: string; name: string }>('coach_venues')
  // Every channel linked to each camp — so a camp conversation shows a tab for
  // each one from the moment it is linked, not only once somebody has spoken
  // in it. A tab that appears halfway through a trip looks like a bug.
  const { rows: campChannels } = useCoachTable<{ camp_id: string; channel_name: string | null; created_at?: string }>('coach_camp_channels')
  const profile = useCoachProfile()
  // Tag a conversation by matching the recipient name against roster / staff / venues.
  //
  // "Parent" has to be earned — a name that matches a guardian on the roster.
  // It used to be the fallback for anything unrecognised, which labelled a whole
  // adult camp's group chat PARENT: nobody in it is anybody's parent. A camp is
  // a camp, and a name we cannot place is just a contact.
  const tagFor = (raw?: string | null): string => {
    const key = (raw || '').trim()
    if (key.startsWith('camp:') || /^camp\s*·/i.test(key)) return 'Camp'
    const n = key.split(',')[0].trim().toLowerCase()
    if (!n) return 'Contact'
    if (venues.some(v => (v.name || '').trim().toLowerCase() === n)) return 'Venue'
    if (staff.some(s => (s.name || '').trim().toLowerCase() === n)) return 'Coach'
    if (players.some(p => (p.name || '').trim().toLowerCase() === n)) return 'Player'
    if (players.some(p => (p.parent_name || '').trim().toLowerCase() === n)) return 'Parent'
    return 'Contact'
  }
  const tagColour = (t: string) => t === 'Venue' ? '#3A8EE0' : t === 'Coach' ? accent.hex : t === 'Player' ? T.good : t === 'Camp' ? '#E0A23A' : T.text3
  const Av = ({ keyName, size, playerId }: { keyName: string; size: number; playerId?: string | null }) => {
    // The photo of the player the conversation belongs to — by id. Looking it up
    // by name put one twin's face on the other's conversation.
    const url = playerId ? players.find(p => p.id === playerId)?.avatar_url as string | undefined : undefined
    // eslint-disable-next-line @next/next/no-img-element
    if (url) return <img src={avatarSrc(url)} alt={keyName} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
    return <span style={{ width: size, height: size, borderRadius: '50%', background: accent.dim, color: accent.hex, display: 'grid', placeItems: 'center', fontSize: size * 0.37, fontWeight: 700, flexShrink: 0 }}>{initials(keyName)}</span>
  }
  const [selKey, setSelKey] = useState<string | null>(null)
  // Which Discord channel is showing, inside a camp conversation. null = all of
  // them: a camp with #general, #faqs and #important-info is three rooms, and
  // running them together reads like a crossed line.
  const [chan, setChan] = useState<string | null>(null)
  const [compose, setCompose] = useState<false | { recipients: string[]; playerId?: string; body: string; campId?: string; channel?: string; email?: string; replyTo?: string }>(false)

  // Group the log into conversations.
  //
  // A camp is ONE conversation, whatever each row's recipients string says. It
  // used to split in two — Discord rows said "Camp", Lumio rows said
  // "Camp · Chiclana" — so the coach saw the parents in one chat and their own
  // replies in another. Camp rows are grouped by their thread key instead, and
  // labelled with the fullest name any of them carries.
  //
  // A PLAYER is one conversation, found by the player's id. It used to be found
  // by name, so two children called "Sam Twin" were one conversation: both
  // families' private messages ran together and a reply went to both.
  //
  // An older row carries a name and no id. It joins a player's conversation
  // only when exactly one player has that name; when two do, there is no
  // telling whose it was, so those rows sit in a conversation of their own.
  const lc = (v?: string | null) => (v || '').trim().toLowerCase()
  const byName = new Map<string, Player[]>()
  for (const p of players) { const k = lc(p.name); if (k) byName.set(k, [...(byName.get(k) || []), p]) }
  const playerById = new Map(players.map(p => [p.id, p]))
  // What tells two players with one name apart: age, then parent.
  const tellApart = (p: Player) => [p.age ? `age ${p.age}` : '', p.parent_name ? `parent ${p.parent_name}` : ''].filter(Boolean).join(', ') || p.email || ''

  const convMap = new Map<string, Msg[]>()
  const labelOf = new Map<string, string>()
  for (const m of history.rows) {
    const r = (m.recipients || '').trim()
    // The name an older row was filed under: its thread key unless that is one
    // of the keys that are never a name (camp:, contact:, staff:, attendee:).
    const tk = (m.thread_key || '').trim()
    const legacyName = tk && !/^(camp|contact|staff|attendee):/.test(tk) ? tk : r
    const namesakes = byName.get(lc(legacyName)) || []
    const k = m.thread_key?.startsWith('camp:') ? m.thread_key
      : m.player_id ? `player:${m.player_id}`
      : legacyName === tk || !tk ? (namesakes.length === 1 ? `player:${namesakes[0].id}` : `name:${r || 'Unknown'}`)
      : `name:${r || 'Unknown'}`
    if (!convMap.has(k)) convMap.set(k, [])
    convMap.get(k)!.push(m)
    if (k.startsWith('camp:') && r.startsWith('Camp ·')) labelOf.set(k, r)
    // A player who has since left the roster: keep the name the rows carry.
    if (k.startsWith('player:') && !labelOf.has(k) && r) labelOf.set(k, r)
  }
  const conversations = Array.from(convMap.entries()).map(([id, msgs]) => {
    const player = id.startsWith('player:') ? playerById.get(id.slice(7)) || null : null
    const name = id.startsWith('name:') ? id.slice(5) : ''
    const shared = player ? (byName.get(lc(player.name)) || []).length > 1 : (byName.get(lc(name)) || []).length > 1
    return {
      id,
      key: player?.name || labelOf.get(id) || (id.startsWith('camp:') ? 'Camp' : name || 'Unknown'),
      // Shown under the name when the name alone does not say who this is.
      detail: player && shared ? tellApart(player)
        : !player && shared ? 'Older messages — more than one player has this name'
        : '',
      playerId: player?.id || null,
      // Somebody written to by a typed address, or a coach on a camp list, is
      // not a player even when a player happens to share their name.
      tag: player ? 'Player' : msgs.some(m => m.thread_key?.startsWith('contact:')) ? 'Contact' : msgs.some(m => m.thread_key?.startsWith('staff:')) ? 'Coach' : null,
      campId: id.startsWith('camp:') ? id.slice(5) : null,
      msgs: msgs.slice().sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')),
    }
  })
    .sort((a, b) => (b.msgs[0]?.created_at || '').localeCompare(a.msgs[0]?.created_at || ''))
  // Messages that came in and have not been opened.
  const unreadIn = (c: { msgs: Msg[] }) => c.msgs.filter(m => m.direction === 'in' && !m.read).length
  // The newest conversation is shown without a click — unless it has something
  // unread. Showing it marked it read, so a reply the coach had not looked at
  // lost its "unread" the moment the page opened. An unread one waits to be
  // chosen.
  const sel = conversations.find(c => c.id === selKey) ?? (conversations[0] && !unreadIn(conversations[0]) ? conversations[0] : undefined)

  const startCompose = (recipients: string[] = [], body = '', campId?: string, channel?: string, playerId?: string, email?: string, replyTo?: string) => setCompose({ recipients, playerId, body, campId, channel, email, replyTo })

  // Inbound replies arrive via the inbound-email / SMS webhooks; refresh the log
  // every ~2 min while the inbox is open so they surface without a manual reload.
  useEffect(() => {
    const id = setInterval(() => history.reload(), 120000); return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // The record of a conversation with a family is the academy's. An invited
  // coach reads it, replies, reacts and marks it read; removing a message is the
  // head coach's (the database refuses it for anyone else — migration 204).
  const [canDelete, setCanDelete] = useState(false)
  useEffect(() => { let on = true; currentIdentity().then(me => { if (on) setCanDelete(me ? me.isHead : true) }).catch(() => {}); return () => { on = false } }, [])
  // Mark a conversation's inbound messages read when it's opened.
  useEffect(() => {
    if (!sel) return
    const unread = sel.msgs.filter((m: any) => m.direction === 'in' && !m.read)
    if (!unread.length) return
    Promise.all(unread.map((m: any) => dbUpdate('coach_messages', m.id, { read: true }))).then(() => history.reload()).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel?.id])

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
        <div className="cm-2" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 14, alignItems: 'start' }}>
          {/* Inbox list — cm-2 stacks the two panes on a phone (list, then the open message) */}
          <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 8, alignSelf: 'start' }}>
            {conversations.map(c => {
              const last = c.msgs[0]; const active = c.id === sel?.id
              const unread = unreadIn(c)
              return (
                <div key={c.id} onClick={() => { setSelKey(c.id); setChan(null) }} style={{ display: 'flex', gap: 10, padding: '10px', borderRadius: 8, cursor: 'pointer', background: active ? accent.dim : 'transparent', border: `1px solid ${active ? accent.border : 'transparent'}`, marginBottom: 3 }}>
                  <Av keyName={c.key} size={30} playerId={c.playerId} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      {unread > 0 && <span aria-hidden style={{ width: 7, height: 7, borderRadius: '50%', background: accent.hex, flexShrink: 0, alignSelf: 'center' }} />}
                      <span style={{ fontSize: 12.5, fontWeight: unread ? 800 : 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.key}</span>
                      {(() => { const t = c.tag || tagFor(c.key); return <span style={{ fontSize: 8, fontWeight: 700, color: tagColour(t), background: `${tagColour(t)}22`, padding: '1px 5px', borderRadius: 4, textTransform: 'uppercase', flexShrink: 0 }}>{t}</span> })()}
                      <span style={{ marginLeft: 'auto', fontSize: 10, color: unread ? accent.hex : T.text3, fontWeight: unread ? 700 : 400, flexShrink: 0 }}>{fmtTime(last?.created_at)}</span>
                      {unread > 0 && <span aria-label={`${unread} unread`} style={{ fontSize: 9.5, fontWeight: 700, color: T.btnText, background: accent.hex, borderRadius: 999, padding: '1px 6px', flexShrink: 0 }}>{unread}</span>}
                    </div>
                    {c.detail && <div style={{ fontSize: 10.5, fontWeight: 600, color: T.text2, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.detail}</div>}
                    <div style={{ fontSize: 11.5, color: unread ? T.text : T.text3, fontWeight: unread ? 600 : 400, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{last?.subject ? `${last.subject} — ` : ''}{plainText(last?.body)}</div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Thread */}
          {!sel && (
            <div style={{ background: T.panel, border: `1px dashed ${T.border}`, borderRadius: 12, padding: '36px 20px', textAlign: 'center', fontSize: 12.5, color: T.text3 }}>
              Choose a conversation to read it. Ones with something new are marked with a dot.
            </div>
          )}
          {sel && (
            // minWidth 0: without it one long web address in a message (a calendar
            // link) makes this column wider than the page and pushes Reply and
            // Forward underneath the right-hand rail.
            <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, borderBottom: `1px solid ${T.border}`, marginBottom: 12, flexWrap: 'wrap' }}>
                <Av keyName={sel.key} size={34} playerId={sel.playerId} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{sel.key}</div>
                  {sel.detail && <div style={{ fontSize: 11.5, color: T.text3, marginTop: 1 }}>{sel.detail}</div>}
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                  <button onClick={() => sel.campId
                    // A camp reply goes back to the camp — not to a person called
                    // "Camp", which is how it used to open a brand-new chat — and
                    // into the channel on screen.
                    ? startCompose([], '', sel.campId, chan || undefined)
                    // A player's conversation replies to THAT player, by id.
                    // A contact's address is the one they were written to at,
                    // kept on the conversation — the reply opens with it filled in.
                    : startCompose(sel.key.split(',').map(s => s.trim()).filter(Boolean), '', undefined, undefined, sel.playerId || undefined,
                        sel.msgs.map(m => m.thread_key || '').find(k => /^contact:[^\s@]+@[^\s@]+$/.test(k))?.slice(8),
                        // What is being answered: the newest message they sent.
                        sel.msgs.find(m => m.direction === 'in')?.id)} style={btn(T, accent, 'solid')}>
                    ↩ {sel.campId && chan ? `Reply in #${chan}` : 'Reply'}
                  </button>
                  <button onClick={() => startCompose([], sel.msgs[0]?.body || '')} style={btn(T, accent, 'ghost')}>↪ Forward</button>
                </div>
              </div>
              {(() => {
                const linked = sel.campId
                  ? campChannels.filter(c => c.camp_id === sel.campId).map(c => c.channel_name).filter(Boolean) as string[]
                  : []
                const channels = Array.from(new Set([...linked, ...(sel.msgs.map(m => m.discord_channel_name).filter(Boolean) as string[])])).sort()
                if (channels.length < 2) return null
                const tab = (id: string | null, label: string) => (
                  <button key={label} onClick={() => setChan(id)}
                    style={{ appearance: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 11.5, fontWeight: chan === id ? 700 : 500,
                      borderRadius: 999, padding: '5px 12px', border: `1px solid ${chan === id ? accent.border : T.border}`,
                      background: chan === id ? accent.dim : 'transparent', color: chan === id ? accent.hex : T.text2 }}>{label}</button>
                )
                return (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    {tab(null, 'All')}
                    {channels.map(c => tab(c, `#${c}`))}
                  </div>
                )
              })()}
              {chan && !sel.msgs.some(m => m.discord_channel_name === chan) && (
                <div style={{ fontSize: 12, color: T.text3, padding: '8px 0 14px' }}>
                  Nothing in #{chan} yet. Anything posted there in Discord appears here within a minute.
                </div>
              )}
              {[...sel.msgs]
                .filter(m => !chan || m.discord_channel_name === chan)
                .sort((a, b) => (a.created_at || '').localeCompare(b.created_at || '')).map(m => (
                <div key={m.id} style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', alignItems: m.direction === 'in' ? 'flex-start' : 'stretch' }}>
                  <div style={{ maxWidth: m.direction === 'in' ? '88%' : '100%', background: m.direction === 'in' ? T.panel2 : accent.dim, border: `1px solid ${m.direction === 'in' ? T.border : accent.border}`, borderRadius: 10, padding: '10px 12px' }}>
                    {/* Who wrote it, and — when a family picked a coach by name in
                        their app — who it was for. Without that the head coach
                        read a message meant for a colleague as if it were theirs. */}
                    {m.direction === 'in' && <div style={{ fontSize: 10.5, fontWeight: 700, color: T.text2, marginBottom: 3 }}>{m.from_name || sel.key}{m.to_name ? <span style={{ fontWeight: 600, color: accent.hex }}> · for {m.to_name}</span> : null}</div>}
                    {m.direction !== 'in' && m.from_name && m.from_name !== profile.display_name && <div style={{ fontSize: 10.5, fontWeight: 700, color: T.text2, marginBottom: 3 }}>From {m.from_name}</div>}
                    {m.subject && <div style={{ fontSize: 12.5, fontWeight: 700, color: T.text, marginBottom: 4 }}>{m.subject}</div>}
                    <div style={{ fontSize: 12.5, color: T.text, lineHeight: 1.5, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{linked(textOf(m), accent.hex)}</div>
                    {attachmentsOf(m).length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                        {attachmentsOf(m).map(a => (
                          <a key={a.path} href={mediaUrl(a.path)} target="_blank" rel="noopener noreferrer" title={a.name}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={mediaUrl(a.path)} alt={a.name}
                              style={{ maxWidth: 260, maxHeight: 220, borderRadius: 9, border: `1px solid ${T.border}`, display: 'block', objectFit: 'cover' }} />
                          </a>
                        ))}
                      </div>
                    )}
                    <div style={{ fontSize: 10, color: T.text3, marginTop: 6 }}>{[m.direction === 'in' ? (m.channels === 'discord' ? `From Discord${m.discord_channel_name ? ` · #${m.discord_channel_name}` : ''}` : 'Received') : (m.channels?.startsWith('inapp:') ? 'inapp' : m.channels), m.direction === 'in' && m.status === 'received' ? null : m.status, fmtTime(m.created_at)].filter(Boolean).join(' · ')}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                    {REACTIONS.map(r => (
                      <button key={r} className="cm-tap" onClick={() => { dbUpdate('coach_messages', m.id, { reaction: m.reaction === r ? null : r }).then(() => history.reload()) }} title="React"
                        style={{ appearance: 'none', border: m.reaction === r ? `1px solid ${accent.hex}` : `1px solid transparent`, background: m.reaction === r ? accent.dim : 'transparent', borderRadius: 6, padding: '2px 5px', fontSize: 13, cursor: 'pointer', opacity: m.reaction && m.reaction !== r ? 0.4 : 1 }}>{r}</button>
                    ))}
                    {canDelete && <button className="cm-tap" onClick={() => { if (confirm('Delete this message?')) dbRemove('coach_messages', m.id).then(() => history.reload()) }} style={{ marginLeft: 'auto', appearance: 'none', border: 0, background: 'transparent', color: T.text3, fontSize: 11, cursor: 'pointer' }}>Delete</button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {compose && <LiveCoachSendMessage T={T} accent={accent} players={players}
        coachName={profile.display_name || 'your coach'} clubName={(profile as any).club_name || (profile as any).academy_name || profile.display_name || 'your academy'}
        init={{ recipient: compose.recipients[0], playerId: compose.playerId, body: compose.body, campId: compose.campId, channel: compose.channel, email: compose.email, replyTo: compose.replyTo }}
        onClose={() => setCompose(false)} onSent={() => { setCompose(false); history.reload() }} />}
    </div>
  )
}

function btn(T: ThemeTokens, accent: AccentTokens, kind: 'solid' | 'ghost'): CSSProperties {
  return kind === 'solid'
    ? { appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }
    : { appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }
}
