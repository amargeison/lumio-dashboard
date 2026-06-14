'use client'

import React, { useState } from 'react'

// Grassroots portal — Send Message composer (mirrors the Women's composer).
//
// Same 4-step flow as the Women's / Non-League composers:
//   Step 1: Who    — multi-select staff + custom recipient
//   Step 2: How    — multi-select channels (WhatsApp-led for grassroots)
//   Step 3: Message — write text + Send / URGENT
//   Step 4: Preview — AI draft → confirm
//   Sent           — confirmation screen
//
// Green-themed (Grassroots accent #16A34A). DEMO-SAFE: no real messages
// sent. "Confirm Send" lands on the Sent screen but fires no actual API
// call, no clipboard write, no external service. AI draft uses canned
// content (standard + urgent variants) consistent with the standing
// demo-AI canned-response rule — no /api/ai/* call on demo clicks.

const C = {
  panel:      '#0D1117',
  panelAlt:   '#111318',
  panelDeep:  '#0A0B10',
  border:     '#1F2937',
  borderHi:   '#374151',
  text:       '#F9FAFB',
  text2:      '#D1D5DB',
  text3:      '#9CA3AF',
  text4:      '#6B7280',
  text5:      '#4B5563',
  green:      '#16A34A',
  greenDeep:  '#15803D',
  greenLight: '#4ADE80',
  greenDim:   'rgba(22,163,74,0.18)',
  greenBorder:'rgba(22,163,74,0.5)',
  good:       '#22C55E',
  danger:     '#EF4444',
}

const TEAM = [
  { name: 'Squad chat',    role: 'WhatsApp group',     icon: '🟢' },
  { name: 'Dave Nolan',    role: 'Manager',            icon: '🎽' },
  { name: 'Bob Turner',    role: 'Treasurer',          icon: '💰' },
  { name: 'Phil Rees',     role: 'Coach',              icon: '🧢' },
  { name: 'Sarah Nolan',   role: 'Welfare Officer',    icon: '🛡️' },
  { name: 'Terry Walsh',   role: 'Groundsman',         icon: '🌱' },
  { name: 'Mike Jenkins',  role: 'Referee (Sunday)',   icon: '👁️' },
  { name: 'Subs chasers',  role: 'Parents / players',  icon: '👥' },
]

const CHANNELS = [
  { id: 'whatsapp',  label: 'WhatsApp',         icon: '🟢' },
  { id: 'sms',       label: 'Text / SMS',       icon: '💬' },
  { id: 'email',     label: 'Email',            icon: '📧' },
  { id: 'group',     label: 'Squad group',      icon: '🔔' },
]

const CANNED_STANDARD = `Morning all — quick one ahead of Sunday vs Red Lion FC.

KO 10:30 at Oakridge Rec Pitch 3. Reply YES/NO on the squad chat by Thursday 8pm so I can name the 11 — only 13 confirmed so far. Subs are £5, bring it cash on the day (a few still owe). Meet 09:30 for warm-up. Pub lunch after as usual.

Cheers — Dave`

const CANNED_URGENT = `[URGENT] Pitch check failed — Oakridge Rec waterlogged. Switching to the 3G at Glenmoor for 10:30.

Need everyone to confirm on the squad chat you've seen this. Same KO time, new venue. Lift-share from the clubhouse if you need one.

Dave`

type Step = 'who' | 'how' | 'message' | 'preview' | 'sent'

export default function GrassrootsSendMessageModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>('who')
  const [selectedPeople, setSelectedPeople] = useState<string[]>([])
  const [customPerson, setCustomPerson] = useState('')
  const [channels, setChannels] = useState<string[]>(['whatsapp'])
  const [messageText, setMessageText] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)
  const [aiDraft, setAiDraft] = useState('')
  const [loading, setLoading] = useState(false)

  const togglePerson  = (name: string) => setSelectedPeople(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name])
  const toggleChannel = (id: string)   => setChannels(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  const allRecipients = [...selectedPeople, ...(customPerson.trim() ? [customPerson.trim()] : [])]

  // Demo-safe: canned draft with 800ms artificial latency. No API call.
  const handleSend = async (urgent: boolean) => {
    setIsUrgent(urgent)
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setAiDraft(urgent ? CANNED_URGENT : (messageText.trim() ? `${messageText.trim()}\n\n— Sent via Lumio` : CANNED_STANDARD))
    setLoading(false)
    setStep('preview')
  }

  const stepIdx = (['who','how','message','preview'] as const).indexOf(step as 'who'|'how'|'message'|'preview')

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[100]" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={onClose} />
      {/* Modal */}
      <div
        className="fixed left-1/2 top-1/2 z-[101] -translate-x-1/2 -translate-y-1/2 rounded-2xl overflow-hidden flex flex-col"
        style={{ width: 'min(620px, 92vw)', maxHeight: '90vh', backgroundColor: C.panel, border: `1px solid ${C.border}`, boxShadow: '0 24px 60px rgba(0,0,0,0.55)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 shrink-0" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">📨</span>
            <div>
              <div className="text-base font-bold" style={{ color: C.text }}>Send Message</div>
              <div className="text-xs" style={{ color: C.text4 }}>
                {step === 'who'     ? 'Step 1 — Who are you messaging?'
                 : step === 'how'    ? 'Step 2 — How do you want to send it?'
                 : step === 'message'? 'Step 3 — Write your message'
                 : step === 'preview'? 'Preview — Confirm & send (demo)'
                 :                     'Sent! (demo)'}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{ color: C.text4 }} aria-label="Close">✕</button>
        </div>

        {/* Step bar */}
        <div className="flex items-center gap-2 px-6 py-3 shrink-0" style={{ borderBottom: `1px solid ${C.border}` }}>
          {(['Who', 'How', 'Message', 'Preview'] as const).map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ backgroundColor: i < stepIdx ? C.good : i === stepIdx ? C.greenDeep : 'rgba(255,255,255,0.05)', color: i <= stepIdx ? '#fff' : C.text5 }}
                >
                  {i < stepIdx ? '✓' : i + 1}
                </div>
                <span className="text-xs font-semibold" style={{ color: i === stepIdx ? C.greenLight : i < stepIdx ? C.good : C.text5 }}>{s}</span>
              </div>
              {i < 3 && <div className="flex-1 h-px" style={{ backgroundColor: i < stepIdx ? C.good : C.border }} />}
            </React.Fragment>
          ))}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* STEP 1: Who */}
          {step === 'who' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {TEAM.map(m => {
                  const selected = selectedPeople.includes(m.name)
                  return (
                    <button
                      key={m.name}
                      onClick={() => togglePerson(m.name)}
                      className="flex items-center gap-3 rounded-xl p-3 text-left transition-all"
                      style={{ backgroundColor: selected ? C.greenDim : C.panelAlt, border: `1px solid ${selected ? C.greenBorder : C.border}` }}
                    >
                      <span className="text-lg">{m.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate" style={{ color: C.text }}>{m.name}</div>
                        <div className="text-[10px]" style={{ color: C.text4 }}>{m.role}</div>
                      </div>
                      {selected && <span style={{ color: C.greenLight }}>✓</span>}
                    </button>
                  )
                })}
              </div>
              <input
                value={customPerson}
                onChange={e => setCustomPerson(e.target.value)}
                placeholder="Someone else — type a name…"
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{ backgroundColor: C.panelAlt, border: `1px solid ${C.borderHi}`, color: C.text }}
              />
              {allRecipients.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {allRecipients.map(n => (
                    <span key={n} className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ backgroundColor: C.greenDim, color: C.greenLight }}>{n}</span>
                  ))}
                </div>
              )}
              <button
                onClick={() => setStep('how')}
                disabled={allRecipients.length === 0}
                className="w-full py-3 rounded-xl text-sm font-bold transition-all"
                style={{ backgroundColor: allRecipients.length > 0 ? C.greenDeep : C.borderHi, color: '#fff', opacity: allRecipients.length > 0 ? 1 : 0.6 }}
              >
                Next — choose channels →
              </button>
            </div>
          )}

          {/* STEP 2: How */}
          {step === 'how' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {CHANNELS.map(ch => {
                  const selected = channels.includes(ch.id)
                  return (
                    <button
                      key={ch.id}
                      onClick={() => toggleChannel(ch.id)}
                      className="flex items-center gap-3 rounded-xl p-4 text-left transition-all"
                      style={{ backgroundColor: selected ? C.greenDim : C.panelAlt, border: `1px solid ${selected ? C.greenBorder : C.border}` }}
                    >
                      <span className="text-2xl">{ch.icon}</span>
                      <span className="text-sm font-semibold" style={{ color: C.text }}>{ch.label}</span>
                      {selected && <span className="ml-auto" style={{ color: C.greenLight }}>✓</span>}
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep('who')} className="flex-1 py-2.5 rounded-xl text-sm" style={{ backgroundColor: C.border, color: C.text3 }}>← Back</button>
                <button
                  onClick={() => setStep('message')}
                  disabled={channels.length === 0}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                  style={{ backgroundColor: channels.length > 0 ? C.greenDeep : C.borderHi, color: '#fff', opacity: channels.length > 0 ? 1 : 0.6 }}
                >
                  Next — write message →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Message */}
          {step === 'message' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs" style={{ color: C.text4 }}>To:</span>
                {allRecipients.map(n => <span key={n} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: C.greenDim, color: C.greenLight }}>{n}</span>)}
                <span className="text-xs" style={{ color: C.text4 }}>via</span>
                {channels.map(id => <span key={id} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: C.border, color: C.text3 }}>{CHANNELS.find(c => c.id === id)?.label}</span>)}
              </div>
              <textarea
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                rows={5}
                placeholder="Type your message…"
                className="w-full px-4 py-3 rounded-xl text-sm resize-none"
                style={{ backgroundColor: C.panelAlt, border: `1px solid ${C.borderHi}`, color: C.text }}
                autoFocus
              />
              <div className="flex gap-3">
                <button onClick={() => setStep('how')} className="py-2.5 px-4 rounded-xl text-sm" style={{ backgroundColor: C.border, color: C.text3 }}>← Back</button>
                <button
                  onClick={() => handleSend(false)}
                  disabled={!messageText.trim() || loading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                  style={{ backgroundColor: messageText.trim() ? C.greenDeep : C.borderHi, color: '#fff', opacity: messageText.trim() && !loading ? 1 : 0.6 }}
                >
                  {loading ? '⏳ Drafting…' : 'Preview →'}
                </button>
                <button
                  onClick={() => handleSend(true)}
                  disabled={!messageText.trim() || loading}
                  className="py-2.5 px-4 rounded-xl text-sm font-bold"
                  style={{ backgroundColor: messageText.trim() ? C.danger : C.borderHi, color: '#fff', opacity: messageText.trim() && !loading ? 1 : 0.6 }}
                >
                  🚨 URGENT
                </button>
              </div>
              <p className="text-[10px]" style={{ color: C.text5 }}>Demo: AI draft is canned (no Claude API call). Standard preview uses your text + sign-off; URGENT preview uses a demo pitch-off scenario.</p>
            </div>
          )}

          {/* STEP 4: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              {isUrgent && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <span>🚨</span>
                  <span className="text-xs font-bold" style={{ color: C.danger }}>URGENT — would send to ALL channels simultaneously (demo: no real send)</span>
                </div>
              )}
              <div className="rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap" style={{ backgroundColor: C.panelAlt, border: `1px solid ${C.border}`, color: C.text2 }}>
                {aiDraft}
              </div>
              <p className="text-[10px]" style={{ color: C.text5 }}>This is a preview only. Confirming does not send a real message in the demo.</p>
              <div className="flex gap-3">
                <button onClick={() => { setStep('message'); setAiDraft('') }} className="flex-1 py-2.5 rounded-xl text-sm" style={{ backgroundColor: C.border, color: C.text3 }}>← Edit</button>
                <button
                  onClick={() => setStep('sent')}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                  style={{ backgroundColor: isUrgent ? C.danger : C.greenDeep, color: '#fff' }}
                >
                  ✓ Confirm (demo)
                </button>
              </div>
            </div>
          )}

          {/* SENT */}
          {step === 'sent' && (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">✅</div>
              <div className="text-base font-bold mb-2" style={{ color: C.text }}>Message confirmed in demo</div>
              <div className="text-sm mb-1" style={{ color: C.text3 }}>
                Would send via {isUrgent ? 'all channels' : channels.map(id => CHANNELS.find(c => c.id === id)?.label).join(', ')}
              </div>
              <div className="text-sm mb-4" style={{ color: C.text3 }}>
                Recipients: {allRecipients.join(', ')}
              </div>
              <div className="text-[10px] mb-4" style={{ color: C.text5 }}>No real message has been sent — this is a demo of the composer flow.</div>
              <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-bold" style={{ backgroundColor: C.greenDeep, color: '#fff' }}>Done</button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
