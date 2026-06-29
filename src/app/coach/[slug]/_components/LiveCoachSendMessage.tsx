'use client'

// LIVE Send Message — the same 4-step wizard the demo uses (Who → How →
// Message → Preview → Sent) but wired to the coach's REAL roster and the real
// send endpoint (/api/coach/message/send). Mirrors CoachSendMessage.tsx visually
// so the live portal matches the demo exactly.
//
// Channels are honest about what they do on send:
//   • In-app  → writes a real item to the coach inbox.
//   • Email   → if the coach's mailbox is synced (Settings), Lumio sends it
//               directly; otherwise the send endpoint reports it can't.
//   • Phone   → if a Twilio sender number is configured (Settings), Lumio texts.
//   • WhatsApp → coming soon.

import { useState } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { getSettings } from '../_lib/settings-store'
import { COACH_AGENT_PERSONA } from '@/lib/coach/agent-persona'

const clean = (s: string) => s.replace(/[*_#`>]/g, '').replace(/^\s*[-•]\s*/gm, '').replace(/\n{3,}/g, '\n\n').trim()

type Player = { id?: string; name: string; email?: string | null; contact_email?: string | null; parent_email?: string | null; phone?: string | null; contact_phone?: string | null; parent_phone?: string | null; group?: string | null }
type Recipient = { name: string; role: string; email: string; phone: string }

const CHANNEL_IDS = ['internal', 'email', 'sms', 'whatsapp'] as const
type ChannelId = typeof CHANNEL_IDS[number]
const CHANNEL_META: Record<ChannelId, { label: string; icon: string }> = {
  internal: { label: 'In-app message', icon: '🔔' },
  email:    { label: 'Email',          icon: '📧' },
  sms:      { label: 'Phone / Text',   icon: '📱' },
  whatsapp: { label: 'WhatsApp',       icon: '🟢' },
}
// The live send endpoint speaks 'inapp' | 'email' | 'sms'.
const SEND_CHANNEL: Partial<Record<ChannelId, string>> = { internal: 'inapp', email: 'email', sms: 'sms' }

const providerLabel = (p: string) =>
  p === 'google' ? 'Gmail' : p === 'outlook' || p === 'microsoft' ? 'Outlook' : p ? 'your mailbox' : ''

const emailOf = (p: Player) => p.email || p.contact_email || p.parent_email || ''
const phoneOf = (p: Player) => p.phone || p.contact_phone || p.parent_phone || ''

export function LiveCoachSendMessage({ T, accent, players, coachName, clubName, init, onClose, onSent }: {
  T: ThemeTokens; accent: AccentTokens; players: Player[]; coachName: string; clubName: string
  init?: { recipient?: string; body?: string }; onClose: () => void; onSent: () => void
}) {
  const [step, setStep] = useState<'who' | 'how' | 'message' | 'preview' | 'sent'>('who')
  const [selectedNames, setSelectedNames] = useState<string[]>(init?.recipient ? [init.recipient] : [])
  const [broadcast, setBroadcast] = useState(false)
  const [customPerson, setCustomPerson] = useState('')
  const [channels, setChannels] = useState<string[]>(['internal'])
  const [messageText, setMessageText] = useState(init?.body ? `Re your message:\n${init.body}` : '')
  const [isUrgent, setIsUrgent] = useState(false)
  const [aiDraft, setAiDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const s = getSettings()
  const emailSynced = !!s.conn?.emailProvider
  const provider = providerLabel(s.conn?.emailProvider || '')
  const phoneConfigured = !!s.messaging?.senderPhone && s.messaging?.text !== false
  const senderPhone = s.messaging?.senderPhone || ''

  const togglePerson = (name: string) => setSelectedNames(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name])
  const toggleChannel = (id: string) => setChannels(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])

  // Resolve selected players (+ broadcast = whole roster) into recipients.
  const picked = broadcast ? players : players.filter(p => selectedNames.includes(p.name))
  const recipients: Recipient[] = [
    ...picked.map(p => ({ name: p.name, role: p.group || 'Player', email: emailOf(p), phone: phoneOf(p) })),
    ...(customPerson.trim() ? [{ name: customPerson.trim(), role: 'Contact', email: '', phone: '' }] : []),
  ]
  const allRecipients = recipients.map(r => r.name)

  const channelNote = (id: ChannelId): { note: string; tag: 'Live' | 'Setup' | 'Soon'; live: boolean } => {
    switch (id) {
      case 'internal': return { note: 'Live — lands in the inbox instantly', tag: 'Live', live: true }
      case 'email':    return emailSynced
        ? { note: `Live — sent through ${provider}, no app opens`, tag: 'Live', live: true }
        : { note: 'Connect your mailbox in Settings to send email', tag: 'Setup', live: false }
      case 'sms':      return phoneConfigured
        ? { note: `Live — sends from your Lumio number (${senderPhone})`, tag: 'Live', live: true }
        : { note: 'Add a Lumio number in Settings to text automatically', tag: 'Setup', live: false }
      case 'whatsapp': return { note: 'Coming soon — needs WhatsApp Business verification', tag: 'Soon', live: false }
    }
  }

  const usedChannelIds = (isUrgent ? [...CHANNEL_IDS] : channels) as ChannelId[]

  const outcomeFor = (id: ChannelId): string => {
    switch (id) {
      case 'internal': return 'Added to the inbox'
      case 'email':    return emailSynced ? `Sent through ${provider}` : 'Needs mailbox setup'
      case 'sms':      return phoneConfigured ? `Texted from ${senderPhone}` : 'Needs a Lumio number'
      case 'whatsapp': return 'Coming soon'
    }
  }

  const handleSend = async (urgent: boolean) => {
    setIsUrgent(urgent)
    setLoading(true); setErr('')
    try {
      const usedChannels = (urgent ? [...CHANNEL_IDS] : channels as ChannelId[]).map(id => CHANNEL_META[id]?.label || id)
      const res = await fetch('/api/ai/tennis', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 400, system: COACH_AGENT_PERSONA, messages: [{ role: 'user',
          content: `Draft a warm, professional but concise message on behalf of ${coachName}, a tennis coach at ${clubName}. Recipients: ${allRecipients.join(', ')}. Channel: ${usedChannels.join(', ')}. Message intent: ${messageText}. ${urgent ? 'This is URGENT — prepend [URGENT] and keep the tone immediate.' : ''} Return only the final message text, no preamble. Plain prose only — no bullet points, dashes, numbered lists, emoji at line starts, bold, headers or markdown.`
        }] })
      })
      const data = await res.json()
      setAiDraft(clean(data?.content?.[0]?.text || messageText))
    } catch { setAiDraft(urgent ? `[URGENT] ${messageText}` : messageText) }
    setLoading(false)
    setStep('preview')
  }

  // Final send through the real coach messaging endpoint.
  const handleConfirm = async () => {
    const sendChannels = usedChannelIds.map(id => SEND_CHANNEL[id]).filter(Boolean) as string[]
    if (!sendChannels.length) { setErr('No deliverable channel selected.'); return }
    setLoading(true); setErr('')
    try {
      const r = await fetch('/api/coach/message/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: recipients.map(r => ({ name: r.name, email: r.email || undefined, phone: r.phone || undefined })),
          channels: sendChannels,
          subject: `${isUrgent ? '[URGENT] ' : ''}Message from ${coachName}`,
          body: aiDraft,
          ccCoach: s.ccCoachOnEmail,
        }),
      })
      const d = await r.json()
      if (r.ok && d.status !== 'failed') { setStep('sent') }
      else { setErr('Couldn’t send — check channel setup in Settings.') }
    } catch { setErr('Couldn’t send — try again.') } finally { setLoading(false) }
  }

  const subtitle = step === 'who' ? 'Step 1 — Who are you messaging?' : step === 'how' ? 'Step 2 — How do you want to send it?' : step === 'message' ? 'Step 3 — Write your message' : step === 'preview' ? 'Preview — confirm & send' : 'Sent!'
  const card = (on: boolean): React.CSSProperties => ({ background: on ? accent.dim : T.panel2, border: `1px solid ${on ? accent.border : T.border}` })
  const primaryBtn = (enabled: boolean, bg = accent.hex): React.CSSProperties => ({ appearance: 'none', border: 0, borderRadius: 11, padding: '12px 14px', fontSize: 13, fontWeight: 700, fontFamily: FONT, color: enabled ? T.btnText : T.text3, background: enabled ? bg : T.hover, cursor: enabled ? 'pointer' : 'not-allowed' })

  const stepIdx = ['who', 'how', 'message', 'preview'].indexOf(step)

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.84)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '6vh 16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 640, background: T.panel, border: `1px solid ${T.borderHi}`, borderRadius: 16, boxShadow: '0 30px 80px -20px rgba(0,0,0,0.7)' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 22px', borderBottom: `1px solid ${T.border}` }}>
          <span style={{ fontSize: 22 }}>📨</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Send Message</div>
            <div style={{ fontSize: 11.5, color: T.text3 }}>{subtitle}</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${T.border}`, background: 'transparent', color: T.text3, cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>

        {/* step indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderBottom: `1px solid ${T.border}` }}>
          {['Who', 'How', 'Message', 'Preview'].map((st, i) => (
            <div key={st} style={{ display: 'contents' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, background: i < stepIdx ? T.good : i === stepIdx ? accent.hex : T.hover, color: i <= stepIdx ? '#fff' : T.text3 }}>{i < stepIdx ? '✓' : i + 1}</div>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: i === stepIdx ? accent.hex : i < stepIdx ? T.good : T.text3 }}>{st}</span>
              </div>
              {i < 3 && <div style={{ flex: 1, height: 1, background: i < stepIdx ? T.good : T.border }} />}
            </div>
          ))}
        </div>

        <div style={{ padding: 22 }}>
          {/* STEP 1 — Who */}
          {step === 'who' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <button onClick={() => { setBroadcast(b => !b); setSelectedNames([]) }} style={{ display: 'flex', alignItems: 'center', gap: 12, borderRadius: 12, padding: 12, textAlign: 'left', cursor: 'pointer', ...card(broadcast) }}>
                <span style={{ fontSize: 18 }}>📣</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>All players</div>
                  <div style={{ fontSize: 10, color: T.text3 }}>Broadcast · {players.length} on your roster</div>
                </div>
                {broadcast && <span style={{ color: accent.hex }}>✓</span>}
              </button>
              {!broadcast && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                  {players.map(m => (
                    <button key={m.id || m.name} onClick={() => togglePerson(m.name)} style={{ display: 'flex', alignItems: 'center', gap: 12, borderRadius: 12, padding: 12, textAlign: 'left', cursor: 'pointer', ...card(selectedNames.includes(m.name)) }}>
                      <span style={{ fontSize: 18 }}>🎾</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                        <div style={{ fontSize: 10, color: T.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emailOf(m) || phoneOf(m) || (m.group || 'Player')}</div>
                      </div>
                      {selectedNames.includes(m.name) && <span style={{ color: accent.hex }}>✓</span>}
                    </button>
                  ))}
                  {players.length === 0 && <div style={{ gridColumn: '1 / -1', fontSize: 12, color: T.text3 }}>No players on your roster yet — add one, or type a name below.</div>}
                </div>
              )}
              <input value={customPerson} onChange={e => setCustomPerson(e.target.value)} placeholder="Someone else — type name…"
                style={{ width: '100%', padding: '11px 13px', borderRadius: 12, fontSize: 13, color: T.text, background: T.panel2, border: `1px solid ${T.borderHi}`, outline: 'none', fontFamily: FONT }} />
              {allRecipients.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {allRecipients.slice(0, 12).map(n => <span key={n} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600, background: accent.dim, color: accent.hex }}>{n}</span>)}
                  {allRecipients.length > 12 && <span style={{ fontSize: 11, color: T.text3, alignSelf: 'center' }}>+{allRecipients.length - 12} more</span>}
                </div>
              )}
              <button onClick={() => setStep('how')} disabled={allRecipients.length === 0} style={primaryBtn(allRecipients.length > 0)}>Next — choose channels →</button>
            </div>
          )}

          {/* STEP 2 — How */}
          {step === 'how' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {CHANNEL_IDS.map(id => {
                  const on = channels.includes(id)
                  const meta = CHANNEL_META[id]
                  const { note, tag, live } = channelNote(id)
                  const tagColor = tag === 'Soon' ? T.text3 : live ? T.good : T.warn
                  return (
                    <button key={id} onClick={() => toggleChannel(id)} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, borderRadius: 12, padding: 14, textAlign: 'left', cursor: 'pointer', ...card(on) }}>
                      <span style={{ fontSize: 22, lineHeight: 1 }}>{meta.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{meta.label}</span>
                          <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '1px 5px', borderRadius: 4, color: tagColor, background: `${tagColor}1f` }}>{tag}</span>
                          {on && <span style={{ marginLeft: 'auto', color: accent.hex }}>✓</span>}
                        </div>
                        <div style={{ fontSize: 10.5, color: T.text3, marginTop: 3, lineHeight: 1.35 }}>{note}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep('who')} style={{ flex: 1, appearance: 'none', border: 0, borderRadius: 11, padding: '11px', fontSize: 13, background: T.hover, color: T.text2, cursor: 'pointer' }}>← Back</button>
                <button onClick={() => setStep('message')} disabled={channels.length === 0} style={{ flex: 1, ...primaryBtn(channels.length > 0) }}>Next — write message →</button>
              </div>
            </div>
          )}

          {/* STEP 3 — Message */}
          {step === 'message' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', fontSize: 11, color: T.text3 }}>
                To: {allRecipients.slice(0, 8).map(n => <span key={n} style={{ padding: '2px 8px', borderRadius: 20, background: accent.dim, color: accent.hex }}>{n}</span>)}
                {allRecipients.length > 8 && <span>+{allRecipients.length - 8}</span>}
                <span>via</span>
                {channels.map(id => <span key={id} style={{ padding: '2px 8px', borderRadius: 20, background: T.hover, color: T.text2 }}>{CHANNEL_META[id as ChannelId]?.label}</span>)}
              </div>
              <textarea value={messageText} onChange={e => setMessageText(e.target.value)} rows={5} placeholder="Type your message… (AI will tidy it into a polished draft)"
                style={{ width: '100%', padding: '13px', borderRadius: 12, fontSize: 13, color: T.text, background: T.panel2, border: `1px solid ${T.borderHi}`, resize: 'none', outline: 'none', fontFamily: FONT, lineHeight: 1.5 }} autoFocus />
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep('how')} style={{ appearance: 'none', border: 0, borderRadius: 11, padding: '11px 16px', fontSize: 13, background: T.hover, color: T.text2, cursor: 'pointer' }}>← Back</button>
                <button onClick={() => handleSend(false)} disabled={!messageText.trim() || loading} style={{ flex: 1, ...primaryBtn(!!messageText.trim() && !loading) }}>{loading ? '⏳ Drafting…' : 'Draft & send →'}</button>
                <button onClick={() => handleSend(true)} disabled={!messageText.trim() || loading} style={{ ...primaryBtn(!!messageText.trim() && !loading, T.bad), padding: '11px 16px' }}>🚨 Urgent</button>
              </div>
            </div>
          )}

          {/* STEP 4 — Preview */}
          {step === 'preview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {isUrgent && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, background: 'rgba(199,90,90,0.12)', border: `1px solid ${T.bad}55` }}>
                  <span>🚨</span><span style={{ fontSize: 11.5, fontWeight: 700, color: T.bad }}>URGENT — sending to all channels at once</span>
                </div>
              )}
              <div style={{ borderRadius: 12, padding: 16, fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', background: T.panel2, border: `1px solid ${T.border}`, color: T.text2 }}>{aiDraft}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 10.5 }}>
                {usedChannelIds.map(id => {
                  const { live } = channelNote(id)
                  const col = live ? T.good : T.warn
                  return <span key={id} style={{ padding: '3px 9px', borderRadius: 20, background: `${col}1a`, color: col, fontWeight: 600 }}>{CHANNEL_META[id].label} · {outcomeFor(id)}</span>
                })}
              </div>
              {err && <div style={{ fontSize: 12, color: T.bad }}>{err}</div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setStep('message'); setAiDraft('') }} style={{ flex: 1, appearance: 'none', border: 0, borderRadius: 11, padding: '11px', fontSize: 13, background: T.hover, color: T.text2, cursor: 'pointer' }}>← Edit</button>
                <button onClick={handleConfirm} disabled={loading} style={{ flex: 1, ...primaryBtn(!loading, isUrgent ? T.bad : accent.hex) }}>{loading ? 'Sending…' : '✓ Confirm send'}</button>
              </div>
            </div>
          )}

          {/* SENT */}
          {step === 'sent' && (
            <div style={{ textAlign: 'center', padding: '28px 0' }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>✅</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 6 }}>Message sent!</div>
              <div style={{ fontSize: 12.5, color: T.text3, marginBottom: 14, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
                To {allRecipients.slice(0, 6).join(', ')}{allRecipients.length > 6 ? ` +${allRecipients.length - 6} more` : ''}.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxWidth: 420, margin: '0 auto 16px', textAlign: 'left' }}>
                {usedChannelIds.map(id => {
                  const { live } = channelNote(id)
                  return (
                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: live ? T.good : T.warn, flexShrink: 0 }} />
                      <span style={{ color: T.text2 }}><span style={{ fontWeight: 600, color: T.text }}>{CHANNEL_META[id].label}:</span> {outcomeFor(id)}.</span>
                    </div>
                  )
                })}
              </div>
              <button onClick={() => { onSent() }} style={primaryBtn(true)}>Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
