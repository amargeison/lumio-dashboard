'use client'

// Coach Send Message — mirrors the tennis portal's multi-step Send Message
// flow (Who → How → Message → Preview → Sent) with an AI draft step and an
// URGENT all-channels option. Recipients are the coach's contacts.
//
// Channels are honest about what they do on send:
//   • In-app  → writes a real item to the inbox store.
//   • Email   → if the coach's mailbox is SYNCED (Settings → Contact & calendar),
//               Lumio sends it directly — no app opens. If not synced, it falls
//               back to opening the mail client pre-filled (mailto).
//   • Phone   → if a Twilio sender number is configured (Settings → Messaging),
//               Lumio sends the text. If not, it falls back to the device's
//               Messages app (sms:) pre-filled.
//   • WhatsApp → coming soon.
// Demo note: recipients here are sample contacts, so nothing is delivered to a
// real person — the Sent screen says so.

import { useState } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { COACH_ORG } from '../_lib/coach-data'
import { sendMessage } from '../_lib/messages-store'
import { getSettings } from '../_lib/settings-store'

const clean = (s: string) => s.replace(/[*_#`>]/g, '').replace(/^\s*[-•]\s*/gm, '').replace(/\n{3,}/g, '\n\n').trim()

// A pre-targeted recipient (e.g. the head coach hitting "Contact" on a coach card).
export type PresetRecipient = { name: string; role?: string; email?: string; phone?: string }

// Demo contacts. Emails are intentionally fictional (example.com / .example) and
// phones use the Ofcom drama range (07700 900xxx) so nothing reaches a real
// person while the mailto / sms channels still open the device apps.
const TEAM = [
  { name: 'Junior Squad parents', role: 'Group · 6 families', icon: '👨‍👩‍👧', email: '', phone: '' },
  { name: 'Grace Okafor', role: 'Parent · Tom', icon: '📋', email: 'grace.okafor@example.com', phone: '+44 7700 900812' },
  { name: 'Lily Chen', role: 'Parent · Mia', icon: '📋', email: 'lily.chen@example.com', phone: '+44 7700 900145' },
  { name: 'Riverside Desk', role: 'Venue', icon: '🏟️', email: 'desk@riversidetennis.example', phone: '+44 7700 900400' },
  { name: 'Dan Pearce', role: 'Assistant Coach', icon: '🎾', email: 'dan.pearce@example.com', phone: '+44 7700 900233' },
  { name: 'All players', role: 'Broadcast', icon: '📣', email: '', phone: '' },
]

type Recipient = { name: string; role: string; email: string; phone: string }

const CHANNEL_IDS = ['internal', 'email', 'sms', 'whatsapp'] as const
type ChannelId = typeof CHANNEL_IDS[number]
const CHANNEL_META: Record<ChannelId, { label: string; icon: string }> = {
  internal: { label: 'In-app message', icon: '🔔' },
  email:    { label: 'Email',          icon: '📧' },
  sms:      { label: 'Phone / Text',   icon: '📱' },
  whatsapp: { label: 'WhatsApp',       icon: '🟢' },
}

const providerLabel = (p: string) =>
  p === 'google' ? 'Gmail' : p === 'outlook' || p === 'microsoft' ? 'Outlook' : p ? 'your mailbox' : ''

export function CoachSendMessage({ T, accent, onClose, preset }: { T: ThemeTokens; accent: AccentTokens; onClose: () => void; preset?: PresetRecipient }) {
  const [step, setStep] = useState<'who' | 'how' | 'message' | 'preview' | 'sent'>(preset ? 'how' : 'who')
  const [selectedPeople, setSelectedPeople] = useState<string[]>([])
  const [customPerson, setCustomPerson] = useState('')
  const [channels, setChannels] = useState<string[]>(['email'])
  const [messageText, setMessageText] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)
  const [aiDraft, setAiDraft] = useState('')
  const [loading, setLoading] = useState(false)

  // Connection state drives whether email/phone send directly or fall back to
  // the device app. Read fresh so it reflects whatever the coach has in Settings.
  const s = getSettings()
  const emailSynced = !!s.conn?.emailProvider
  const provider = providerLabel(s.conn?.emailProvider || '')
  const phoneConfigured = !!s.messaging?.senderPhone && s.messaging?.text !== false
  const senderPhone = s.messaging?.senderPhone || ''

  const togglePerson = (name: string) => setSelectedPeople(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name])
  const toggleChannel = (id: string) => setChannels(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])

  // Resolved recipients (name/role/email/phone). A preset locks the wizard to one
  // contact (the coach you tapped Contact on); otherwise it's the picked team.
  const recipients: Recipient[] = preset
    ? [{ name: preset.name, role: preset.role ?? 'Coach', email: preset.email ?? '', phone: preset.phone ?? '' }]
    : [
        ...TEAM.filter(t => selectedPeople.includes(t.name)).map(t => ({ name: t.name, role: t.role, email: t.email, phone: t.phone })),
        ...(customPerson.trim() ? [{ name: customPerson.trim(), role: 'Contact', email: '', phone: '' }] : []),
      ]
  const allRecipients = recipients.map(r => r.name)

  // Honest one-line note per channel for the current connection state.
  const channelNote = (id: ChannelId): { note: string; tag: 'Live' | 'Demo' | 'Soon'; live: boolean } => {
    switch (id) {
      case 'internal': return { note: 'Live — lands in the inbox instantly', tag: 'Live', live: true }
      case 'email':    return emailSynced
        ? { note: `Live — sent through ${provider}, no app opens`, tag: 'Live', live: true }
        : { note: 'Opens your mail app pre-filled', tag: 'Live', live: true }
      case 'sms':      return phoneConfigured
        ? { note: `Live — sends from your Lumio number (${senderPhone})`, tag: 'Live', live: true }
        : { note: 'Opens your Messages app — add a Twilio number to send automatically', tag: 'Demo', live: false }
      case 'whatsapp': return { note: 'Coming soon — needs WhatsApp Business verification', tag: 'Soon', live: false }
    }
  }

  // Channel ids actually used on this send (urgent fans out to everything).
  const usedChannelIds = (isUrgent ? [...CHANNEL_IDS] : channels) as ChannelId[]

  // What actually happened, per channel, for the preview/sent screens.
  const outcomeFor = (id: ChannelId): string => {
    switch (id) {
      case 'internal': return 'Added to the inbox'
      case 'email':    return emailSynced ? `Sent through ${provider}` : 'Opens your mail app'
      case 'sms':      return phoneConfigured ? `Texted from ${senderPhone}` : 'Opens your Messages app'
      case 'whatsapp': return 'Coming soon'
    }
  }

  // Final send. In-app + a synced email/phone are "sent" by Lumio (logged to the
  // inbox); a non-synced email/phone falls back to the device app pre-filled.
  const handleConfirm = () => {
    const ids = usedChannelIds
    const liveLabels = ids
      .filter(id => id === 'internal' || id === 'email' || id === 'sms')
      .map(id => CHANNEL_META[id].label)
    if (liveLabels.length) {
      recipients.forEach(r => sendMessage({ to: r.name, role: r.role, channel: liveLabels.join(' · '), text: aiDraft }))
    }
    // Non-synced email → open the mail client pre-filled.
    if (ids.includes('email') && !emailSynced) {
      const to = recipients.map(r => r.email).filter(Boolean).join(',')
      if (to) {
        const subject = `${isUrgent ? '[URGENT] ' : ''}Message from ${COACH_ORG.coach}`
        window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(aiDraft)}`
      }
    }
    // Phone with no Twilio number → open the device Messages app pre-filled
    // (first recipient with a number; mirrors the mailto fallback).
    if (ids.includes('sms') && !phoneConfigured && !(ids.includes('email') && !emailSynced)) {
      const phone = recipients.map(r => r.phone).filter(Boolean)[0]
      if (phone) window.location.href = `sms:${phone.replace(/\s+/g, '')}?&body=${encodeURIComponent(aiDraft)}`
    }
    setStep('sent')
  }

  const handleSend = async (urgent: boolean) => {
    setIsUrgent(urgent)
    setLoading(true)
    try {
      const usedChannels = (urgent ? [...CHANNEL_IDS] : channels as ChannelId[]).map(id => CHANNEL_META[id]?.label || id)
      const res = await fetch('/api/ai/tennis', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 400, messages: [{ role: 'user',
          content: `Draft a warm, professional but concise message on behalf of ${COACH_ORG.coach}, a tennis coach at ${COACH_ORG.academy}. Recipients: ${allRecipients.join(', ')}. Channel: ${usedChannels.join(', ')}. Message intent: ${messageText}. ${urgent ? 'This is URGENT — prepend [URGENT] and keep the tone immediate.' : ''} Return only the final message text, no preamble. Plain prose only — no bullet points, dashes, numbered lists, emoji at line starts, bold, headers or markdown.`
        }] })
      })
      const data = await res.json()
      setAiDraft(clean(data?.content?.[0]?.text || messageText))
    } catch { setAiDraft(urgent ? `[URGENT] ${messageText}` : messageText) }
    setLoading(false)
    setStep('preview')
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
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Send Message{preset ? ` · ${preset.name}` : ''}</div>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {TEAM.map(m => (
                  <button key={m.name} onClick={() => togglePerson(m.name)} style={{ display: 'flex', alignItems: 'center', gap: 12, borderRadius: 12, padding: 12, textAlign: 'left', cursor: 'pointer', ...card(selectedPeople.includes(m.name)) }}>
                    <span style={{ fontSize: 18 }}>{m.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                      <div style={{ fontSize: 10, color: T.text3 }}>{m.role}</div>
                    </div>
                    {selectedPeople.includes(m.name) && <span style={{ color: accent.hex }}>✓</span>}
                  </button>
                ))}
              </div>
              <input value={customPerson} onChange={e => setCustomPerson(e.target.value)} placeholder="Someone else — type name…"
                style={{ width: '100%', padding: '11px 13px', borderRadius: 12, fontSize: 13, color: T.text, background: T.panel2, border: `1px solid ${T.borderHi}`, outline: 'none', fontFamily: FONT }} />
              {allRecipients.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {allRecipients.map(n => <span key={n} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600, background: accent.dim, color: accent.hex }}>{n}</span>)}
                </div>
              )}
              <button onClick={() => setStep('how')} disabled={allRecipients.length === 0} style={primaryBtn(allRecipients.length > 0)}>Next — choose channels →</button>
            </div>
          )}

          {/* STEP 2 — How */}
          {step === 'how' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {preset && (
                <div style={{ fontSize: 11.5, color: T.text3 }}>To: <span style={{ padding: '2px 8px', borderRadius: 20, background: accent.dim, color: accent.hex, fontWeight: 600 }}>{preset.name}</span>{preset.role ? ` · ${preset.role}` : ''}</div>
              )}
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
              {preset?.phone && (
                <button onClick={() => { window.location.href = `tel:${preset.phone!.replace(/\s+/g, '')}` }}
                  style={{ appearance: 'none', border: `1px solid ${T.border}`, background: T.panel2, color: T.text2, borderRadius: 10, padding: '9px 12px', fontSize: 12, fontWeight: 600, fontFamily: FONT, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                  📞 Or call {preset.name} now — {preset.phone}
                </button>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { preset ? onClose() : setStep('who') }} style={{ flex: 1, appearance: 'none', border: 0, borderRadius: 11, padding: '11px', fontSize: 13, background: T.hover, color: T.text2, cursor: 'pointer' }}>{preset ? 'Cancel' : '← Back'}</button>
                <button onClick={() => setStep('message')} disabled={channels.length === 0} style={{ flex: 1, ...primaryBtn(channels.length > 0) }}>Next — write message →</button>
              </div>
            </div>
          )}

          {/* STEP 3 — Message */}
          {step === 'message' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', fontSize: 11, color: T.text3 }}>
                To: {allRecipients.map(n => <span key={n} style={{ padding: '2px 8px', borderRadius: 20, background: accent.dim, color: accent.hex }}>{n}</span>)}
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
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setStep('message'); setAiDraft('') }} style={{ flex: 1, appearance: 'none', border: 0, borderRadius: 11, padding: '11px', fontSize: 13, background: T.hover, color: T.text2, cursor: 'pointer' }}>← Edit</button>
                <button onClick={handleConfirm} style={{ flex: 1, ...primaryBtn(true, isUrgent ? T.bad : accent.hex) }}>✓ Confirm send</button>
              </div>
            </div>
          )}

          {/* SENT */}
          {step === 'sent' && (
            <div style={{ textAlign: 'center', padding: '28px 0' }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>✅</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 6 }}>Message sent!</div>
              <div style={{ fontSize: 12.5, color: T.text3, marginBottom: 14, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
                To {allRecipients.join(', ')}.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxWidth: 420, margin: '0 auto 14px', textAlign: 'left' }}>
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
              <div style={{ fontSize: 10.5, color: T.text3, maxWidth: 420, margin: '0 auto 16px', lineHeight: 1.45 }}>
                Demo uses sample contacts, so nothing is delivered to a real person. In your live portal, Lumio sends through your connected {provider || 'mailbox'} and Twilio number.
              </div>
              <button onClick={onClose} style={primaryBtn(true)}>Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
