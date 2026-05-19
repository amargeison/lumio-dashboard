'use client'

import React, { useState } from 'react'

// Junior Football — Send Message composer.
//
// UI ONLY — Tranche 3 of the Junior portal feature build. Ported from
// WomensSendMessageModal (src/components/womens/WomensSendMessageModal.tsx),
// re-themed Junior green, and re-content'd for a grassroots junior club
// rather than a WSL first-team squad. The Women's source is NEVER
// modified — this is a per-portal sibling.
//
// DEMO-SAFE: no real messages sent. "Confirm Send" lands on the Sent
// screen but fires no actual API call, no clipboard write, no external
// service. AI draft uses canned content (standard + urgent variants)
// consistent with the standing demo-AI canned-response rule — no
// /api/ai/* call on demo clicks.
//
// COMMS BACKEND IS A FUTURE WORKSTREAM — out of scope here. This file
// is the composer UI only. The real delivery pipeline (push notifications,
// WhatsApp template-nudge with Twilio + Meta-approved templates, email
// fallback, opt-in handling, message persistence, real-time threads)
// belongs to the comms backend workstream — see docs/follow-ups.md
// "WhatsApp template-nudge → in-app confirmation flow". The
// safeguarding controls a children's product needs (no unsupervised
// adult-to-child DMs, message logging, welfare-officer visibility on
// flagged threads) are also that workstream's responsibility, not this
// composer's.

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
  accent:      '#16A34A',
  accentDeep:  '#15803D',
  accentLight: '#22C55E',
  accentDim:   'rgba(22,163,74,0.15)',
  accentBorder:'rgba(22,163,74,0.5)',
  good:       '#22C55E',
  danger:     '#EF4444',
}

// Junior club recipient list — staff + age-group parent groups. Not a
// WSL first-team roster; this is what a grassroots chairman or team
// manager actually messages on a normal week.
const TEAM = [
  { name: 'Mark Hutchings',  role: 'Lead Coach · U11 Lions',     icon: '🎽' },
  { name: 'Greta Yardley',   role: 'Team Manager · U11 Lions',   icon: '📋' },
  { name: 'Dev Patel',       role: 'Lead Coach · U14 Eagles',    icon: '🎽' },
  { name: 'Jenna Holroyd',   role: 'Welfare Officer · club',     icon: '🛡️' },
  { name: 'Pete Connolly',   role: 'Volunteer Chair · club',     icon: '🏛️' },
  { name: 'All parents — U11 Lions',   role: 'Group · 12 families', icon: '👨‍👧' },
  { name: 'All parents — U13 Falcons', role: 'Group · 14 families', icon: '👨‍👧' },
  { name: 'All parents — U14 Eagles',  role: 'Group · 13 families', icon: '👨‍👧' },
]

// Channel options. In-App is the default and primary channel for a
// children's product — see docs/follow-ups.md WhatsApp entry for the
// recommended layering (push → WhatsApp → email).
const CHANNELS = [
  { id: 'in_app',   label: 'In-App Message',  icon: '🔔', primary: true },
  { id: 'email',    label: 'Email',           icon: '📧', primary: false },
  { id: 'sms',      label: 'Text / SMS',      icon: '💬', primary: false },
  { id: 'whatsapp', label: 'WhatsApp',        icon: '🟢', primary: false },
]

const CANNED_STANDARD = `Hi all — quick one ahead of Saturday vs Harfield Juniors (home, Pitch 2, 09:30 KO).

Home kit please — green shirt, black shorts, green socks. Shin pads on, named water bottle. Squad arrives at the pitches from 09:00. Parking on the back field — please don't block the gate for the next age-band coming on.

Forecast looks decent — light cloud and dry. Bring a tracksuit for the warm-up.

Thanks — Mark`

const CANNED_URGENT = `[URGENT] U11 Lions vs Harfield · Saturday fixture POSTPONED.

Council confirmed Pitch 2 is waterlogged after Friday rain — pitch declared unplayable for Saturday morning. No fixture, no training session.

Tuesday evening training as normal (17:30 Pitch 3).

Please reply 👍 so we know this has reached everyone.

— Mark`

type Step = 'who' | 'how' | 'message' | 'preview' | 'sent'

export default function JuniorSendMessageModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>('who')
  const [selectedPeople, setSelectedPeople] = useState<string[]>([])
  const [customPerson, setCustomPerson] = useState('')
  const [channels, setChannels] = useState<string[]>(['in_app'])
  const [messageText, setMessageText] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)
  const [aiDraft, setAiDraft] = useState('')
  const [loading, setLoading] = useState(false)

  const togglePerson  = (name: string) => setSelectedPeople(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name])
  const toggleChannel = (id: string)   => setChannels(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  const allRecipients = [...selectedPeople, ...(customPerson.trim() ? [customPerson.trim()] : [])]

  // Demo-safe: canned draft with 800ms artificial latency. No API call.
  // Same demo-AI canned-response pattern used elsewhere in the Junior
  // portal (AI Performance Brief).
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
                  style={{ backgroundColor: i < stepIdx ? C.good : i === stepIdx ? C.accentDeep : 'rgba(255,255,255,0.05)', color: i <= stepIdx ? '#fff' : C.text5 }}
                >
                  {i < stepIdx ? '✓' : i + 1}
                </div>
                <span className="text-xs font-semibold" style={{ color: i === stepIdx ? C.accentLight : i < stepIdx ? C.good : C.text5 }}>{s}</span>
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
                      style={{ backgroundColor: selected ? C.accentDim : C.panelAlt, border: `1px solid ${selected ? C.accentBorder : C.border}` }}
                    >
                      <span className="text-lg">{m.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate" style={{ color: C.text }}>{m.name}</div>
                        <div className="text-[10px]" style={{ color: C.text4 }}>{m.role}</div>
                      </div>
                      {selected && <span style={{ color: C.accentLight }}>✓</span>}
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
                    <span key={n} className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ backgroundColor: C.accentDim, color: C.accentLight }}>{n}</span>
                  ))}
                </div>
              )}
              <button
                onClick={() => setStep('how')}
                disabled={allRecipients.length === 0}
                className="w-full py-3 rounded-xl text-sm font-bold transition-all"
                style={{ backgroundColor: allRecipients.length > 0 ? C.accentDeep : C.borderHi, color: '#fff', opacity: allRecipients.length > 0 ? 1 : 0.6 }}
              >
                Next — choose channels →
              </button>
            </div>
          )}

          {/* STEP 2: How */}
          {step === 'how' && (
            <div className="space-y-4">
              <p className="text-[11px] leading-relaxed" style={{ color: C.text3 }}>
                <span style={{ color: C.accentLight, fontWeight: 600 }}>In-App Message</span> is the
                default / primary channel — push notification, no per-message cost, full UI
                control. Other channels are for parents who haven&rsquo;t installed the app yet.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {CHANNELS.map(ch => {
                  const selected = channels.includes(ch.id)
                  return (
                    <button
                      key={ch.id}
                      onClick={() => toggleChannel(ch.id)}
                      className="flex items-center gap-3 rounded-xl p-4 text-left transition-all relative"
                      style={{ backgroundColor: selected ? C.accentDim : C.panelAlt, border: `1px solid ${selected ? C.accentBorder : C.border}` }}
                    >
                      <span className="text-2xl">{ch.icon}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold" style={{ color: C.text }}>{ch.label}</span>
                        {ch.primary && (
                          <div className="text-[10px] mt-0.5" style={{ color: C.accentLight }}>Default · primary</div>
                        )}
                      </div>
                      {selected && <span style={{ color: C.accentLight }}>✓</span>}
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
                  style={{ backgroundColor: channels.length > 0 ? C.accentDeep : C.borderHi, color: '#fff', opacity: channels.length > 0 ? 1 : 0.6 }}
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
                {allRecipients.map(n => <span key={n} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: C.accentDim, color: C.accentLight }}>{n}</span>)}
                <span className="text-xs" style={{ color: C.text4 }}>via</span>
                {channels.map(id => <span key={id} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: C.border, color: C.text3 }}>{CHANNELS.find(c => c.id === id)?.label}</span>)}
              </div>
              <textarea
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                rows={6}
                placeholder="Type your message…  e.g. kit reminder, fixture-change notice, training-pitch swap, parents WhatsApp announcement"
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
                  style={{ backgroundColor: messageText.trim() ? C.accentDeep : C.borderHi, color: '#fff', opacity: messageText.trim() && !loading ? 1 : 0.6 }}
                >
                  {loading ? '⏳ Drafting…' : 'Preview →'}
                </button>
                <button
                  onClick={() => handleSend(true)}
                  disabled={loading}
                  className="py-2.5 px-4 rounded-xl text-sm font-bold"
                  style={{ backgroundColor: C.danger, color: '#fff', opacity: loading ? 0.6 : 1 }}
                >
                  🚨 URGENT
                </button>
              </div>
              <p className="text-[10px]" style={{ color: C.text5 }}>
                Demo: drafts are canned (no Claude API call). Standard preview uses your text +
                a sign-off; URGENT preview uses a demo weather-cancellation scenario. Real
                comms-backend delivery (push / WhatsApp / email) is a future workstream.
              </p>
            </div>
          )}

          {/* STEP 4: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              {isUrgent && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <span>🚨</span>
                  <span className="text-xs font-bold" style={{ color: C.danger }}>URGENT — would push to every channel above simultaneously (demo: no real send)</span>
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
                  style={{ backgroundColor: isUrgent ? C.danger : C.accentDeep, color: '#fff' }}
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
              <div className="text-[10px] mb-4" style={{ color: C.text5 }}>
                No real message has been sent — this is a demo of the composer flow.
                Real delivery (push / WhatsApp / email) is part of the comms backend
                workstream.
              </div>
              <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-bold" style={{ backgroundColor: C.accentDeep, color: '#fff' }}>Done</button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
