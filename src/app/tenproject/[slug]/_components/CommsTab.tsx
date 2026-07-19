'use client'

// HQ Communications centre + the shared Send Message wizard (mapped from the
// tennis coach Send Message flow: Who → Channels → Message → Preview/send).
// The wizard is exported for reuse in the Coach and TENOR views.

import React, { useState } from 'react'
import { Mail, MessageSquare, Smartphone, Send, X, School, Users, Megaphone, CheckCircle, Sparkles, Newspaper, Inbox as InboxIcon } from 'lucide-react'
import { Card, SectionTitle, Pill } from './ui'
import { TP_RED, TP_DARK, COMMS_INBOX, COMMS_RECIPIENTS, NEWSLETTERS } from '@/data/tenproject/demo-data'

const CHANNEL_META: Record<string, { label: string; icon: React.ComponentType<{ size?: number | string; style?: React.CSSProperties }> }> = {
  email: { label: 'EMAIL', icon: Mail },
  sms: { label: 'SMS', icon: Smartphone },
  app: { label: 'APP', icon: MessageSquare },
  whatsapp: { label: 'WHATSAPP', icon: MessageSquare },
}

// ─── Send Message wizard (shared) ───────────────────────────────────────────
export function SendMessageWizard({ onClose, defaultRecipient }: { onClose: () => void; defaultRecipient?: string }) {
  const [step, setStep] = useState(1)
  const [who, setWho] = useState<string | null>(defaultRecipient ?? null)
  const [channels, setChannels] = useState<string[]>(['app', 'email'])
  const [message, setMessage] = useState('')
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

// ─── HQ Comms tab ───────────────────────────────────────────────────────────
export default function CommsTab() {
  const [wizard, setWizard] = useState(false)
  const [filter, setFilter] = useState<'all' | 'email' | 'sms' | 'app' | 'whatsapp'>('all')
  const inbox = filter === 'all' ? COMMS_INBOX : COMMS_INBOX.filter(m => m.channel === filter)
  const unread = COMMS_INBOX.filter(m => m.unread).length

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
        <SectionTitle sub="Every conversation — email, SMS, app messages and WhatsApp — in one inbox, with one send button">Communications</SectionTitle>
        <button onClick={() => setWizard(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: TP_RED, color: '#fff', border: 'none', borderRadius: 9, padding: '9px 14px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>
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
              return (
                <div key={m.id} style={{ background: m.unread ? '#FDF3F3' : '#F7F5F2', borderRadius: 10, padding: '11px 13px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 900, color: TP_DARK }}>
                      {m.unread && <span style={{ color: TP_RED }}>● </span>}{m.from} <span style={{ fontWeight: 600, color: '#8A847E', fontSize: 11 }}>— {m.who}</span>
                    </div>
                    <div style={{ fontSize: 10.5, color: '#8A847E', fontWeight: 700 }}>
                      <Icon size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />{CHANNEL_META[m.channel].label} · {m.when}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#5B554F', marginTop: 4, lineHeight: 1.5 }}>{m.text}</div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Newsletters + automations */}
        <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
          <Card>
            <SectionTitle sub="Replaces the Mailchimp sends — scoped per venue, tracked per family">
              <Newspaper size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Newsletters
            </SectionTitle>
            <div style={{ display: 'grid', gap: 7 }}>
              {NEWSLETTERS.map(n => (
                <div key={n.id} style={{ background: '#F7F5F2', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: TP_DARK }}>{n.title}</div>
                    <Pill tone={n.status === 'sent' ? 'green' : 'amber'}>{n.status.toUpperCase()}</Pill>
                  </div>
                  <div style={{ fontSize: 11, color: '#8A847E', marginTop: 3 }}>{n.when}{n.opens ? ` · ${n.opens}` : ''}</div>
                </div>
              ))}
            </div>
            <button style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, background: TP_DARK, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 13px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer' }}>
              <Sparkles size={13} /> Draft next newsletter (AI)
            </button>
          </Card>
          <Card>
            <SectionTitle sub="The comms that send themselves">Automations</SectionTitle>
            <div style={{ display: 'grid', gap: 6, fontSize: 12 }}>
              {[
                'Mon + Thu: weekly session confirmation — each family gets THEIR venue only',
                'Sticker awarded → parent notified that evening',
                'Session cancelled/moved → instant push + SMS fallback',
                'Register missing at 6pm → TENOR lead + HQ nudged',
                'Fundraising milestone hit → school + supporters celebrated',
              ].map(t => (
                <div key={t} style={{ background: '#F7F5F2', borderRadius: 9, padding: '8px 11px', color: '#5B554F' }}>⚡ {t}</div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {wizard && <SendMessageWizard onClose={() => setWizard(false)} />}
    </div>
  )
}
