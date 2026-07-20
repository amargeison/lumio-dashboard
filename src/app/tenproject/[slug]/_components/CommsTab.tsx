'use client'

// HQ Communications centre + the shared Send Message wizard (mapped from the
// tennis coach Send Message flow: Who → Channels → Message → Preview/send).
// Inbox threads, the newsletter builder and automations are all live.

import React, { useState } from 'react'
import { Mail, MessageSquare, Smartphone, Send, X, School, Users, Megaphone, CheckCircle, Sparkles, Newspaper, Inbox as InboxIcon, Heart, Reply, Forward, Eye, Zap } from 'lucide-react'
import { Card, SectionTitle, Pill } from './ui'
import { TP_RED, TP_DARK, COMMS_INBOX, COMMS_RECIPIENTS, NEWSLETTERS } from '@/data/tenproject/demo-data'
import { openNewsletter, NEWSLETTER_SEPTEMBER, NEWSLETTER_WEEK4 } from '../_lib/newsletter-docs'

const CHANNEL_META: Record<string, { label: string; icon: React.ComponentType<{ size?: number | string; style?: React.CSSProperties }> }> = {
  email: { label: 'EMAIL', icon: Mail },
  sms: { label: 'SMS', icon: Smartphone },
  app: { label: 'APP', icon: MessageSquare },
  whatsapp: { label: 'WHATSAPP', icon: MessageSquare },
}

// ─── Send Message wizard (shared) ───────────────────────────────────────────
export function SendMessageWizard({ onClose, defaultRecipient, defaultMessage }: { onClose: () => void; defaultRecipient?: string; defaultMessage?: string }) {
  const [step, setStep] = useState(1)
  const [who, setWho] = useState<string | null>(defaultRecipient ?? null)
  const [channels, setChannels] = useState<string[]>(['app', 'email'])
  const [message, setMessage] = useState(defaultMessage ?? '')
  const [sent, setSent] = useState(false)

  const toggleChannel = (c: string) => setChannels(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
  const recipient = COMMS_RECIPIENTS.find(r => r.label === who)

  const stepChip = (n: number, label: string) => (
    <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 20, height: 20, borderRadius: '50%', background: step >= n ? TP_RED : '#EFEBE6', color: step >= n ? '#fff' : '#8A847E', fontSize: 10.5, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n}</div>
      <span style={{ fontSize: 11, fontWeight: 800, color: step >= n ? TP_DARK : '#8A847E' }}>{label}</span>
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#00000066', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70, padding: 16 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 22, maxWidth: 560, width: '100%', maxHeight: '86vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: TP_DARK }}>
            <Send size={15} style={{ verticalAlign: '-2px', marginRight: 7, color: TP_RED }} />Send Message
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B6560' }}><X size={18} /></button>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '30px 0 20px' }}>
            <CheckCircle size={38} style={{ color: '#187A3C' }} />
            <div style={{ fontSize: 16, fontWeight: 900, color: TP_DARK, marginTop: 10 }}>Sent to {who}</div>
            <div style={{ fontSize: 12.5, color: '#6B6560', marginTop: 5 }}>
              Delivered via {channels.map(c => CHANNEL_META[c].label.toLowerCase()).join(' + ')} — replies land back in the inbox, whichever channel they use.
            </div>
            <button onClick={onClose} style={{ marginTop: 16, background: TP_DARK, color: '#fff', border: 'none', borderRadius: 9, padding: '10px 18px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>Done</button>
          </div>
        ) : (<>
          <div style={{ display: 'flex', gap: 14, margin: '10px 0 16px', flexWrap: 'wrap' }}>
            {stepChip(1, 'Who')}{stepChip(2, 'How')}{stepChip(3, 'Message')}{stepChip(4, 'Preview')}
          </div>

          {step === 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {COMMS_RECIPIENTS.map(r => {
                const Icon = r.icon === 'school' ? School : r.icon === 'broadcast' ? Megaphone : Users
                const active = who === r.label
                return (
                  <button key={r.id} onClick={() => setWho(r.label)}
                    style={{ display: 'flex', gap: 10, alignItems: 'center', background: active ? '#FDE8E8' : '#F7F5F2', border: active ? `1.5px solid ${TP_RED}` : '1.5px solid transparent', borderRadius: 10, padding: '11px 12px', cursor: 'pointer', textAlign: 'left' }}>
                    <Icon size={17} style={{ color: TP_RED, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 800, color: TP_DARK }}>{r.label}</div>
                      <div style={{ fontSize: 10.5, color: '#8A847E' }}>{r.desc}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'grid', gap: 8 }}>
              <div style={{ fontSize: 12, color: '#6B6560', marginBottom: 2 }}>One message, every channel they use — pick as many as you like:</div>
              {Object.entries(CHANNEL_META).map(([id, meta]) => {
                const Icon = meta.icon
                const active = channels.includes(id)
                return (
                  <button key={id} onClick={() => toggleChannel(id)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: active ? '#FDE8E8' : '#F7F5F2', border: active ? `1.5px solid ${TP_RED}` : '1.5px solid transparent', borderRadius: 10, padding: '11px 13px', cursor: 'pointer' }}>
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: TP_DARK }}><Icon size={14} style={{ verticalAlign: '-2px', marginRight: 8, color: TP_RED }} />{meta.label}</span>
                    {active && <CheckCircle size={15} style={{ color: '#187A3C' }} />}
                  </button>
                )
              })}
            </div>
          )}

          {step === 3 && (
            <div>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5}
                placeholder={`Message to ${who ?? '…'}`}
                style={{ width: '100%', border: '1px solid #E7E2DC', borderRadius: 10, padding: '11px 13px', fontSize: 13, outline: 'none', background: '#F7F5F2', resize: 'vertical', fontFamily: 'inherit' }} />
              <button onClick={() => setMessage('Quick update: this Saturday’s family session is at Kingsmead Rec Ground, 1.30–2.30pm — backhand week! All equipment provided, scan in at the gate. See you there. LEARN. PLAY. TOGETHER.')}
                style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', color: TP_RED, border: `1px solid ${TP_RED}44`, borderRadius: 8, padding: '7px 12px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer' }}>
                <Sparkles size={13} /> Draft it for me (AI)
              </button>
            </div>
          )}

          {step === 4 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 900, color: '#8A847E', letterSpacing: 0.6, marginBottom: 6 }}>PREVIEW</div>
              <div style={{ background: '#F7F5F2', borderRadius: 12, padding: '13px 15px' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: TP_DARK }}>To: {who} <span style={{ color: '#8A847E', fontWeight: 600 }}>({recipient?.desc})</span></div>
                <div style={{ display: 'flex', gap: 5, margin: '7px 0' }}>{channels.map(c => <Pill key={c} tone="red">{CHANNEL_META[c].label}</Pill>)}</div>
                <div style={{ fontSize: 12.5, color: '#33302C', lineHeight: 1.55, whiteSpace: 'pre-line' }}>{message || '(no message)'}</div>
              </div>
              <div style={{ fontSize: 11, color: '#8A847E', marginTop: 8 }}>
                Consent-checked automatically — anyone opted out of a channel gets it via their preferred one instead.
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            <button onClick={() => step > 1 ? setStep(step - 1) : onClose()} style={{ background: '#fff', color: TP_DARK, border: '1px solid #E7E2DC', borderRadius: 9, padding: '10px 16px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>
              {step > 1 ? '← Back' : 'Cancel'}
            </button>
            <button
              onClick={() => step < 4 ? setStep(step + 1) : setSent(true)}
              disabled={(step === 1 && !who) || (step === 2 && channels.length === 0) || (step === 3 && !message.trim())}
              style={{ background: ((step === 1 && !who) || (step === 2 && channels.length === 0) || (step === 3 && !message.trim())) ? '#D9D3CC' : TP_RED, color: '#fff', border: 'none', borderRadius: 9, padding: '10px 18px', fontSize: 12.5, fontWeight: 900, cursor: 'pointer' }}>
              {step < 4 ? 'Next →' : 'Send message'}
            </button>
          </div>
        </>)}
      </div>
    </div>
  )
}

// ─── HQ Communications tab ──────────────────────────────────────────────────
type InboxMsg = typeof COMMS_INBOX[number]

const AI_NEWSLETTER_ANGLES = [
  'September restart — venues, dates and the big year ahead (welcome Meridian Park, summer results, #tenproject competition, St Clement’s fundraising push)',
  'Half-term special — holiday practice ideas, sticker league table, and the Sponsored Ball Hit countdown',
]

export default function CommsTab() {
  const [wizard, setWizard] = useState<{ open: boolean; message?: string }>({ open: false })
  const [filter, setFilter] = useState<'all' | 'email' | 'sms' | 'app' | 'whatsapp'>('all')
  const [readIds, setReadIds] = useState<string[]>([])
  const [liked, setLiked] = useState<string[]>([])
  const [replies, setReplies] = useState<Record<string, string[]>>({})
  const [thread, setThread] = useState<InboxMsg | null>(null)
  const [replyText, setReplyText] = useState('')
  const [newsletters, setNewsletters] = useState(NEWSLETTERS)
  const [builder, setBuilder] = useState(false)
  const [angle, setAngle] = useState(0)
  const [autos, setAutos] = useState<Record<string, boolean>>({ weekly: true, sticker: true, cancel: true, register: true, fund: true })

  const inbox = filter === 'all' ? COMMS_INBOX : COMMS_INBOX.filter(m => m.channel === filter)
  const isUnread = (m: InboxMsg) => m.unread && !readIds.includes(m.id)
  const unread = COMMS_INBOX.filter(isUnread).length

  function openThread(m: InboxMsg) {
    setThread(m)
    setReplyText('')
    if (m.unread && !readIds.includes(m.id)) setReadIds(prev => [...prev, m.id])
  }
  function sendReply() {
    if (!thread || !replyText.trim()) return
    setReplies(prev => ({ ...prev, [thread.id]: [...(prev[thread.id] ?? []), replyText.trim()] }))
    setReplyText('')
  }

  function saveNewsletterDraft() {
    setNewsletters(prev => [{ id: `new-${Date.now()}`, title: angle === 0 ? 'September restart — venues & the year ahead (AI draft)' : 'Half-term special — practice + Ball Hit countdown (AI draft)', status: 'draft', when: 'ready to schedule', opens: null }, ...prev.filter(n => n.id !== 'n1' || angle !== 0)])
    setBuilder(false)
  }

  const AUTOMATIONS: { id: string; label: string; desc: string; meta: string }[] = [
    { id: 'weekly', label: 'Weekly session confirmations', desc: 'Mon + Thu in term time — each family gets THEIR venue only', meta: 'Last run Mon 09:00 · 121 sent · 74% opened' },
    { id: 'sticker', label: 'Sticker notifications', desc: 'Parent notified the evening a Success Sticker is awarded', meta: '34 sent this week' },
    { id: 'cancel', label: 'Session change alerts', desc: 'Cancelled/moved → instant push + SMS fallback + calendar update', meta: 'Last fired 14 Jun (rain, Bramley)' },
    { id: 'register', label: 'Register chasing', desc: 'Missing register at 6pm → TENOR lead + HQ nudged', meta: 'Fired Sat (Bramley Green) — resolved' },
    { id: 'fund', label: 'Fundraising milestones', desc: 'Match-funding thresholds + campaign completion celebrated to supporters', meta: 'Next trigger: St Clement’s at £2,560' },
  ]

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
        <SectionTitle sub="Every conversation — email, SMS, app messages and WhatsApp — in one inbox, with one send button">Communications</SectionTitle>
        <button onClick={() => setWizard({ open: true })} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: TP_RED, color: '#fff', border: 'none', borderRadius: 9, padding: '9px 14px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>
          <Send size={14} /> Send message
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {([
          [`${unread}`, 'UNREAD'],
          ['3', 'AWAITING REPLY'],
          ['121', 'FAMILIES REACHABLE IN-APP'],
          ['2/wk', 'SCHEDULED TERM COMMS'],
          ['74%', 'LAST SEND OPENED'],
        ] as [string, string][]).map(([v, l]) => (
          <Card key={l} style={{ padding: '13px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#8A847E', letterSpacing: 0.8 }}>{l}</div>
            <div style={{ fontSize: 23, fontWeight: 900, color: TP_DARK, marginTop: 3 }}>{v}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        {/* Inbox */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
            <SectionTitle><InboxIcon size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Inbox</SectionTitle>
            <div style={{ display: 'flex', gap: 5 }}>
              {(['all', 'email', 'sms', 'app', 'whatsapp'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{ background: filter === f ? TP_DARK : '#F7F5F2', color: filter === f ? '#fff' : '#5B554F', border: 'none', borderRadius: 999, padding: '5px 11px', fontSize: 10.5, fontWeight: 800, cursor: 'pointer' }}>
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gap: 7 }}>
            {inbox.map(m => {
              const Icon = CHANNEL_META[m.channel].icon
              const replied = (replies[m.id] ?? []).length > 0
              return (
                <button key={m.id} onClick={() => openThread(m)} style={{ background: isUnread(m) ? '#FDF3F3' : '#F7F5F2', border: 'none', borderRadius: 10, padding: '11px 13px', cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'inherit' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 900, color: TP_DARK }}>
                      {isUnread(m) && <span style={{ color: TP_RED }}>● </span>}{m.from} <span style={{ fontWeight: 600, color: '#8A847E', fontSize: 11 }}>— {m.who}</span>
                      {liked.includes(m.id) && <Heart size={11} style={{ color: TP_RED, marginLeft: 6, verticalAlign: '-1px', fill: TP_RED }} />}
                      {replied && <Pill tone="green">REPLIED</Pill>}
                    </div>
                    <div style={{ fontSize: 10.5, color: '#8A847E', fontWeight: 700 }}>
                      <Icon size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />{CHANNEL_META[m.channel].label} · {m.when}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#5B554F', marginTop: 4, lineHeight: 1.5 }}>{m.text}</div>
                </button>
              )
            })}
          </div>
        </Card>

        {/* Newsletters + automations */}
        <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
          <Card>
            <SectionTitle sub="Replaces the Mailchimp sends — scoped per venue, tracked per family. Tap one to preview.">
              <Newspaper size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Newsletters
            </SectionTitle>
            <div style={{ display: 'grid', gap: 7 }}>
              {newsletters.map(n => (
                <button key={n.id} onClick={() => openNewsletter(n.status === 'sent' && n.id === 'n3' ? NEWSLETTER_WEEK4 : NEWSLETTER_SEPTEMBER)}
                  style={{ background: '#F7F5F2', border: 'none', borderRadius: 10, padding: '10px 12px', cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'inherit' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: TP_DARK }}>{n.title}</div>
                    <Pill tone={n.status === 'sent' ? 'green' : 'amber'}>{n.status.toUpperCase()}</Pill>
                  </div>
                  <div style={{ fontSize: 11, color: '#8A847E', marginTop: 3 }}>
                    {n.when}{n.opens ? ` · ${n.opens}` : ''} · <span style={{ color: TP_RED, fontWeight: 800 }}><Eye size={10} style={{ verticalAlign: '-1px' }} /> preview</span>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setBuilder(true)} style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, background: TP_DARK, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 13px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer' }}>
              <Sparkles size={13} /> Draft next newsletter (AI)
            </button>
          </Card>
          <Card>
            <SectionTitle sub="The comms that send themselves — toggle any rule on or off">
              <Zap size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Automations
            </SectionTitle>
            <div style={{ display: 'grid', gap: 7 }}>
              {AUTOMATIONS.map(a => (
                <div key={a.id} style={{ background: '#F7F5F2', borderRadius: 10, padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <button onClick={() => setAutos(prev => ({ ...prev, [a.id]: !prev[a.id] }))} aria-pressed={autos[a.id]}
                    style={{ width: 36, height: 20, borderRadius: 999, border: 'none', cursor: 'pointer', background: autos[a.id] ? TP_RED : '#D9D3CC', position: 'relative', flexShrink: 0, marginTop: 2 }}>
                    <span style={{ position: 'absolute', top: 2.5, left: autos[a.id] ? 18 : 3, width: 15, height: 15, borderRadius: '50%', background: '#fff', transition: 'left .15s' }} />
                  </button>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: autos[a.id] ? TP_DARK : '#8A847E' }}>{a.label}</div>
                    <div style={{ fontSize: 10.5, color: '#8A847E', marginTop: 2 }}>{a.desc}</div>
                    <div style={{ fontSize: 10, color: autos[a.id] ? '#187A3C' : '#B0A9A2', marginTop: 3, fontWeight: 700 }}>{autos[a.id] ? `⚡ ${a.meta}` : 'Paused'}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Thread modal */}
      {thread && (
        <div style={{ position: 'fixed', inset: 0, background: '#00000066', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70, padding: 16 }} onClick={() => setThread(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 22, maxWidth: 540, width: '100%', maxHeight: '86vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 900, color: TP_DARK }}>{thread.from}</div>
                <div style={{ fontSize: 11.5, color: '#8A847E' }}>{thread.who} · via {CHANNEL_META[thread.channel].label.toLowerCase()} · {thread.when}</div>
              </div>
              <button onClick={() => setThread(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B6560' }}><X size={18} /></button>
            </div>
            <div style={{ background: '#F7F5F2', borderRadius: '12px 12px 12px 4px', padding: '12px 14px', fontSize: 13, color: '#33302C', lineHeight: 1.6 }}>{thread.text}</div>
            {(replies[thread.id] ?? []).map((r, i) => (
              <div key={i} style={{ background: '#FDE8E8', borderRadius: '12px 12px 4px 12px', padding: '12px 14px', fontSize: 13, color: TP_DARK, lineHeight: 1.6, marginTop: 8, marginLeft: 40 }}>
                {r}
                <div style={{ fontSize: 10, color: TP_RED, fontWeight: 800, marginTop: 4 }}>You · just now · via {CHANNEL_META[thread.channel].label.toLowerCase()}</div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
              <button onClick={() => setLiked(prev => prev.includes(thread.id) ? prev.filter(x => x !== thread.id) : [...prev, thread.id])}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: liked.includes(thread.id) ? '#FDE8E8' : '#F7F5F2', color: liked.includes(thread.id) ? TP_RED : TP_DARK, border: 'none', borderRadius: 8, padding: '8px 13px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer' }}>
                <Heart size={13} style={liked.includes(thread.id) ? { fill: TP_RED } : undefined} /> {liked.includes(thread.id) ? 'Liked' : 'Like'}
              </button>
              <button onClick={() => { setWizard({ open: true, message: `FW — from ${thread.from} (${thread.who}) via ${CHANNEL_META[thread.channel].label.toLowerCase()}:\n\n"${thread.text}"` }); setThread(null) }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F7F5F2', color: TP_DARK, border: 'none', borderRadius: 8, padding: '8px 13px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer' }}>
                <Forward size={13} /> Forward
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendReply() }} placeholder={`Reply to ${thread.from.split(' ')[0]} — sends back via ${CHANNEL_META[thread.channel].label.toLowerCase()}`}
                style={{ flex: 1, border: '1px solid #E7E2DC', borderRadius: 10, padding: '11px 13px', fontSize: 12.5, outline: 'none', background: '#F7F5F2', fontFamily: 'inherit' }} />
              <button onClick={sendReply} disabled={!replyText.trim()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: replyText.trim() ? TP_RED : '#D9D3CC', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 16px', fontSize: 12.5, fontWeight: 900, cursor: replyText.trim() ? 'pointer' : 'not-allowed' }}>
                <Reply size={13} /> Reply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Newsletter builder */}
      {builder && (
        <div style={{ position: 'fixed', inset: 0, background: '#00000066', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70, padding: 16 }} onClick={() => setBuilder(false)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 22, maxWidth: 540, width: '100%', maxHeight: '86vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: TP_DARK }}>
                <Sparkles size={15} style={{ verticalAlign: '-2px', marginRight: 7, color: TP_RED }} />Draft next newsletter
              </div>
              <button onClick={() => setBuilder(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B6560' }}><X size={18} /></button>
            </div>
            <div style={{ fontSize: 12, color: '#6B6560', marginBottom: 10 }}>
              The AI reads the term calendar, registers and campaigns, then drafts the whole thing — sections, subject line, per-venue session cards. Pick the angle:
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {AI_NEWSLETTER_ANGLES.map((a, i) => (
                <button key={i} onClick={() => setAngle(i)}
                  style={{ background: angle === i ? '#FDE8E8' : '#F7F5F2', border: angle === i ? `1.5px solid ${TP_RED}` : '1.5px solid transparent', borderRadius: 10, padding: '11px 13px', cursor: 'pointer', textAlign: 'left', fontSize: 12.5, color: TP_DARK, fontWeight: 600, lineHeight: 1.5 }}>
                  {a}
                </button>
              ))}
            </div>
            <div style={{ background: '#F7F5F2', borderRadius: 10, padding: '11px 13px', marginTop: 10, fontSize: 11.5, color: '#5B554F', lineHeight: 1.6 }}>
              <strong>Draft includes:</strong> subject + preheader · hero · personalised session card (each family sees their venue) · new-schools welcome · summer results · #tenproject Wimbledon competition · St Clement’s fundraising bar · footer with preferences/unsubscribe.
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button onClick={() => openNewsletter(NEWSLETTER_SEPTEMBER)} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: TP_DARK, color: '#fff', border: 'none', borderRadius: 10, padding: '12px 14px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>
                <Eye size={14} /> Preview the draft
              </button>
              <button onClick={saveNewsletterDraft} style={{ flex: 1, background: TP_RED, color: '#fff', border: 'none', borderRadius: 10, padding: '12px 14px', fontSize: 12.5, fontWeight: 900, cursor: 'pointer' }}>
                Save as draft
              </button>
            </div>
          </div>
        </div>
      )}

      {wizard.open && <SendMessageWizard onClose={() => setWizard({ open: false })} defaultMessage={wizard.message} />}
    </div>
  )
}
