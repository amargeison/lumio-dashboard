'use client'

// Coach Send Message — mirrors the tennis portal's multi-step Send Message
// flow (Who → How → Message → Preview → Sent) with an AI draft step and an
// URGENT all-channels option. Recipients are the coach's contacts.

import { useState } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { COACH_ORG } from '../_lib/coach-data'

const clean = (s: string) => s.replace(/[*_#`>]/g, '').replace(/^\s*[-•]\s*/gm, '').replace(/\n{3,}/g, '\n\n').trim()

const TEAM = [
  { name: 'Junior Squad parents', role: 'Group · 6 families', icon: '👨‍👩‍👧' },
  { name: 'Grace Okafor', role: 'Parent · Tom', icon: '📋' },
  { name: 'Lily Chen', role: 'Parent · Mia', icon: '📋' },
  { name: 'Riverside Desk', role: 'Venue', icon: '🏟️' },
  { name: 'Dan Pearce', role: 'Assistant Coach', icon: '🎾' },
  { name: 'All players', role: 'Broadcast', icon: '📣' },
]
const CHANNELS = [
  { id: 'sms', label: 'Text / SMS', icon: '💬' },
  { id: 'whatsapp', label: 'WhatsApp', icon: '🟢' },
  { id: 'email', label: 'Email', icon: '📧' },
  { id: 'internal', label: 'In-app message', icon: '🔔' },
]

export function CoachSendMessage({ T, accent, onClose }: { T: ThemeTokens; accent: AccentTokens; onClose: () => void }) {
  const [step, setStep] = useState<'who' | 'how' | 'message' | 'preview' | 'sent'>('who')
  const [selectedPeople, setSelectedPeople] = useState<string[]>([])
  const [customPerson, setCustomPerson] = useState('')
  const [channels, setChannels] = useState<string[]>(['email'])
  const [messageText, setMessageText] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)
  const [aiDraft, setAiDraft] = useState('')
  const [loading, setLoading] = useState(false)

  const togglePerson = (name: string) => setSelectedPeople(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name])
  const toggleChannel = (id: string) => setChannels(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  const allRecipients = [...selectedPeople, ...(customPerson.trim() ? [customPerson.trim()] : [])]

  const handleSend = async (urgent: boolean) => {
    setIsUrgent(urgent)
    setLoading(true)
    try {
      const usedChannels = urgent ? CHANNELS.map(c => c.label) : channels.map(id => CHANNELS.find(c => c.id === id)?.label || id)
      const res = await fetch('/api/ai/tennis', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 400, messages: [{ role: 'user',
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
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Send Message</div>
            <div style={{ fontSize: 11.5, color: T.text3 }}>{subtitle}</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${T.border}`, background: 'transparent', color: T.text3, cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>

        {/* step indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderBottom: `1px solid ${T.border}` }}>
          {['Who', 'How', 'Message', 'Preview'].map((s, i) => (
            <div key={s} style={{ display: 'contents' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, background: i < stepIdx ? T.good : i === stepIdx ? accent.hex : T.hover, color: i <= stepIdx ? '#fff' : T.text3 }}>{i < stepIdx ? '✓' : i + 1}</div>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: i === stepIdx ? accent.hex : i < stepIdx ? T.good : T.text3 }}>{s}</span>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {CHANNELS.map(ch => (
                  <button key={ch.id} onClick={() => toggleChannel(ch.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, borderRadius: 12, padding: 16, textAlign: 'left', cursor: 'pointer', ...card(channels.includes(ch.id)) }}>
                    <span style={{ fontSize: 22 }}>{ch.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{ch.label}</span>
                    {channels.includes(ch.id) && <span style={{ marginLeft: 'auto', color: accent.hex }}>✓</span>}
                  </button>
                ))}
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
                To: {allRecipients.map(n => <span key={n} style={{ padding: '2px 8px', borderRadius: 20, background: accent.dim, color: accent.hex }}>{n}</span>)}
                <span>via</span>
                {channels.map(id => <span key={id} style={{ padding: '2px 8px', borderRadius: 20, background: T.hover, color: T.text2 }}>{CHANNELS.find(c => c.id === id)?.label}</span>)}
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
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setStep('message'); setAiDraft('') }} style={{ flex: 1, appearance: 'none', border: 0, borderRadius: 11, padding: '11px', fontSize: 13, background: T.hover, color: T.text2, cursor: 'pointer' }}>← Edit</button>
                <button onClick={() => setStep('sent')} style={{ flex: 1, ...primaryBtn(true, isUrgent ? T.bad : accent.hex) }}>✓ Confirm send</button>
              </div>
            </div>
          )}

          {/* SENT */}
          {step === 'sent' && (
            <div style={{ textAlign: 'center', padding: '28px 0' }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>✅</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 6 }}>Message sent!</div>
              <div style={{ fontSize: 12.5, color: T.text3, marginBottom: 16, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
                Sent via {isUrgent ? 'all channels' : channels.map(id => CHANNELS.find(c => c.id === id)?.label).join(', ')} to {allRecipients.join(', ')}.
              </div>
              <button onClick={onClose} style={primaryBtn(true)}>Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
