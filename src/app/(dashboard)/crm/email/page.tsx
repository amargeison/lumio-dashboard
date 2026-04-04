'use client'

import { useState, useEffect } from 'react'
import { Mail, Send, RotateCcw, Copy, X, Search, Check, Star, Sparkles, PenLine } from 'lucide-react'

const CARD = '#121320'
const BORDER = '#1E2035'
const PURPLE = '#8B5CF6'

interface Contact { first_name?: string; last_name?: string; email?: string; company?: string; job_title?: string }

const GOALS = [
  'Follow up on proposal', 'Chase invoice', 'Introduction / first contact',
  'Share update or news', 'Book a meeting', 'Respond to enquiry',
]

const DEMO_EMAILS = [
  { id: 'e1', from: 'Sarah Mitchell', email: 's.mitchell@oakridgetrust.co.uk', subject: 'Re: Lumio demo follow-up', preview: 'Thanks for the demo yesterday, the team were really impressed with the AI features. We have a few questions about the implementation timeline and whether...', body: 'Hi there,\n\nThanks for the demo yesterday \u2014 the team were really impressed with the AI features, especially the automated briefings and the attendance tracking dashboard.\n\nWe have a few questions before our next board meeting:\n\n1. What does the typical implementation timeline look like for a trust our size (6 schools)?\n2. Can you confirm the MIS integration works with Arbor?\n3. Is there a pilot programme we could trial with one school first?\n\nWould be great to schedule a follow-up call this week if you\u2019re free.\n\nBest regards,\nSarah Mitchell\nHeadteacher, Oakridge Academy Trust', time: '2 hours ago', unread: true, starred: false, color: '#0D9488' },
  { id: 'e2', from: 'James Clarke', email: 'j.clarke@riversidelp.org', subject: 'Pricing query \u2014 Pro plan', preview: 'Could you send over the pricing breakdown for the Pro plan? We have a board meeting next Thursday and I need to include it in the agenda pack...', body: 'Hello,\n\nCould you send over the pricing breakdown for the Pro plan? We have a board meeting next Thursday and I need to include it in the agenda pack for approval.\n\nSpecifically, I need:\n\u2022 Per-school pricing vs trust-wide licensing\n\u2022 Any setup/onboarding fees\n\u2022 Annual vs monthly payment options\n\u2022 What\u2019s included in the support package\n\nIf there\u2019s a formal quote template you can generate, that would save me a lot of time.\n\nThanks,\nJames Clarke\nBusiness Manager, Riverside Learning Partnership', time: 'Yesterday', unread: true, starred: false, color: '#3B82F6' },
  { id: 'e3', from: 'Tom Bradley', email: 't.bradley@hillsidetrust.ac.uk', subject: 'MIS integration question', preview: "We're currently using Arbor \u2014 does Lumio integrate directly or would we need to export data manually? Our IT team is concerned about...", body: "Hi,\n\nWe're currently using Arbor as our MIS \u2014 does Lumio integrate directly or would we need to export data manually?\n\nOur IT team is concerned about:\n\u2022 Real-time data sync vs batch imports\n\u2022 Student data protection (GDPR compliance)\n\u2022 Whether the integration requires any server-side setup\n\nWe\u2019ve had bad experiences with integrations in the past so want to make sure this is seamless.\n\nCheers,\nTom Bradley\nIT Manager, Hillside MAT", time: '2 days ago', unread: false, starred: false, color: '#F59E0B' },
  { id: 'e4', from: 'Dr Rachel Kim', email: 'r.kim@northerneducation.org', subject: 'Contract ready to sign', preview: "We've reviewed the proposal and the board has approved. Ready to proceed when you can send over the final contract documentation...", body: "Dear Team,\n\nI\u2019m pleased to confirm that we\u2019ve reviewed the proposal and the board has approved the procurement of Lumio for our trust.\n\nWe\u2019re ready to proceed \u2014 please send over:\n1. The final contract documentation\n2. Data processing agreement (DPA)\n3. Implementation timeline and onboarding schedule\n\nWe\u2019d like to target a September 2026 rollout across all 12 schools if possible.\n\nLooking forward to getting started.\n\nBest wishes,\nDr Rachel Kim\nCEO, Northern Education Trust", time: '3 days ago', unread: false, starred: true, color: '#EC4899' },
  { id: 'e5', from: 'Mark Davies', email: 'm.davies@maplegrove.sch.uk', subject: 'Data migration support', preview: "We're looking to migrate from our current system. What support do you offer during the transition period and how long does it typically...", body: "Hello,\n\nWe\u2019re looking to migrate from our current system (a mix of spreadsheets and SIMS) to Lumio.\n\nCould you outline:\n\u2022 What data migration support you offer\n\u2022 How long the transition typically takes for a single school\n\u2022 Whether there\u2019s any downtime during the switchover\n\u2022 Training provided for staff\n\nWe\u2019re a small school (420 pupils) so hoping it\u2019s relatively straightforward.\n\nThanks,\nMark Davies\nBusiness Manager, Maple Grove Schools", time: '1 week ago', unread: false, starred: false, color: '#22C55E' },
]

export default function EmailPage() {
  const [showCompose, setShowCompose] = useState(false)
  const [step, setStep] = useState(1)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [manualEmail, setManualEmail] = useState('')
  const [contactSearch, setContactSearch] = useState('')
  const [selectedGoal, setSelectedGoal] = useState('')
  const [customGoal, setCustomGoal] = useState('')
  const [draft, setDraft] = useState({ subject: '', body: '', suggestedFollowUpDate: '' })
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sent, setSent] = useState(false)
  const [selectedEmail, setSelectedEmail] = useState<typeof DEMO_EMAILS[0] | null>(null)

  const isDemoActive = typeof window !== 'undefined' && localStorage.getItem('lumio_demo_active') === 'true'
  const emailConnected = typeof window !== 'undefined' && (localStorage.getItem('lumio_integration_gmail') === 'true' || localStorage.getItem('lumio_integration_outlook') === 'true')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('lumio_crm_contacts') || '[]'
      setContacts(JSON.parse(raw))
    } catch { /* ignore */ }
  }, [])

  async function generateDraft() {
    setGenerating(true)
    const to = selectedContact || { email: manualEmail }
    const goal = selectedGoal === 'Custom' ? customGoal : selectedGoal
    const userName = localStorage.getItem('lumio_user_name') || 'User'
    const company = localStorage.getItem('lumio_company_name') || 'My Company'

    try {
      const res = await fetch('/api/ai/email-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, goal, context: { userName, company, previousInteractions: null } }),
      })
      if (res.ok) {
        const data = await res.json()
        setDraft({ subject: data.subject || '', body: data.body || '', suggestedFollowUpDate: data.suggestedFollowUpDate || '' })
        setStep(3)
      }
    } catch { /* ignore */ }
    setGenerating(false)
  }

  function resetCompose() {
    setStep(1); setSelectedContact(null); setManualEmail(''); setSelectedGoal(''); setCustomGoal(''); setDraft({ subject: '', body: '', suggestedFollowUpDate: '' }); setSent(false)
  }

  const filteredContacts = contacts.filter(c => {
    const s = contactSearch.toLowerCase()
    return !s || (c.first_name || '').toLowerCase().includes(s) || (c.last_name || '').toLowerCase().includes(s) || (c.email || '').toLowerCase().includes(s) || (c.company || '').toLowerCase().includes(s)
  })

  const showInbox = isDemoActive || emailConnected

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#F1F3FA' }}>Email</h1>
          <p className="text-sm mt-1" style={{ color: '#6B7299' }}>AI-powered email composer</p>
        </div>
        <button onClick={() => { resetCompose(); setShowCompose(true) }} className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold" style={{ backgroundColor: PURPLE, color: '#F9FAFB' }}>
          <PenLine size={16} /> AI Compose
        </button>
      </div>

      {/* Inbox */}
      {showInbox ? (
        <div className="grid gap-0" style={{ gridTemplateColumns: selectedEmail ? '380px 1fr' : '1fr' }}>
          {/* Email list */}
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRight: selectedEmail ? 'none' : undefined, borderTopRightRadius: selectedEmail ? 0 : undefined, borderBottomRightRadius: selectedEmail ? 0 : undefined }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <p className="text-sm font-semibold" style={{ color: '#F1F3FA' }}>Inbox</p>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(139,92,246,0.15)', color: '#A78BFA' }}>{DEMO_EMAILS.filter(e => e.unread).length} unread</span>
            </div>
            {DEMO_EMAILS.map(email => (
              <div key={email.id} onClick={() => setSelectedEmail(email)} className="flex items-start gap-3 px-5 py-4 cursor-pointer transition-colors"
                style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: selectedEmail?.id === email.id ? 'rgba(139,92,246,0.06)' : 'transparent' }}
                onMouseEnter={e => { if (selectedEmail?.id !== email.id) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)' }}
                onMouseLeave={e => { if (selectedEmail?.id !== email.id) e.currentTarget.style.backgroundColor = 'transparent' }}>
                <div className="flex items-center justify-center rounded-full shrink-0" style={{ width: 36, height: 36, backgroundColor: `${email.color}20`, color: email.color, fontSize: 12, fontWeight: 700 }}>
                  {email.from.split(' ').map(w => w[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm truncate" style={{ color: '#F1F3FA', fontWeight: email.unread ? 700 : 400 }}>{email.from}</p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {email.starred && <Star size={12} style={{ color: '#F59E0B', fill: '#F59E0B' }} />}
                      {email.unread && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: '#3B82F6' }} />}
                    </div>
                  </div>
                  <p className="text-xs truncate" style={{ color: email.unread ? '#D1D5DB' : '#6B7299', fontWeight: email.unread ? 600 : 400 }}>{email.subject}</p>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className="text-xs truncate" style={{ color: '#4B5563' }}>{email.preview.slice(0, 60)}...</p>
                    <span className="text-xs shrink-0" style={{ color: '#4B5563' }}>{email.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Reading panel */}
          {selectedEmail && (
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderLeft: 'none', borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center justify-center rounded-full shrink-0" style={{ width: 40, height: 40, backgroundColor: `${selectedEmail.color}20`, color: selectedEmail.color, fontSize: 13, fontWeight: 700 }}>
                    {selectedEmail.from.split(' ').map(w => w[0]).join('')}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: '#F1F3FA' }}>{selectedEmail.from}</p>
                    <p className="text-xs truncate" style={{ color: '#6B7299' }}>{selectedEmail.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedEmail(null)} style={{ color: '#6B7299' }}><X size={16} /></button>
              </div>
              <div className="px-6 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <h2 className="text-base font-bold" style={{ color: '#F1F3FA' }}>{selectedEmail.subject}</h2>
                <p className="text-xs mt-1" style={{ color: '#4B5563' }}>{selectedEmail.time}</p>
              </div>
              <div className="px-6 py-5">
                <div className="text-sm whitespace-pre-line leading-relaxed" style={{ color: '#D1D5DB' }}>{selectedEmail.body}</div>
              </div>
              <div className="flex gap-2 px-6 pb-5">
                <button onClick={() => { resetCompose(); setManualEmail(selectedEmail.email); setShowCompose(true) }} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold" style={{ backgroundColor: PURPLE, color: '#F9FAFB' }}>
                  <Send size={12} /> Reply
                </button>
                <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#9CA3AF', border: `1px solid ${BORDER}` }}>
                  <Sparkles size={12} /> AI Draft Reply
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
          <div className="px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <p className="text-sm font-semibold" style={{ color: '#F1F3FA' }}>Inbox</p>
          </div>
          <div className="flex items-center justify-center py-16">
            <div className="text-center px-6">
              <Mail size={32} style={{ color: PURPLE, margin: '0 auto 12px' }} />
              <p className="text-sm font-semibold mb-1" style={{ color: '#F1F3FA' }}>Connect your email</p>
              <p className="text-xs mb-4" style={{ color: '#6B7299' }}>Connect Gmail or Outlook in Settings to see your inbox here</p>
              <button onClick={() => { localStorage.setItem('lumio_demo_active', 'true'); window.location.reload() }} className="px-5 py-2.5 rounded-xl text-xs font-bold" style={{ backgroundColor: PURPLE, color: '#F9FAFB' }}>
                ✨ Explore with Demo Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compose modal */}
      {showCompose && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowCompose(false)}>
          <div className="rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" style={{ backgroundColor: '#0F1019', border: `1px solid ${BORDER}` }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-2">
                <Sparkles size={14} style={{ color: '#A78BFA' }} />
                <p className="text-sm font-bold" style={{ color: '#F1F3FA' }}>AI Compose — Step {step}/3</p>
              </div>
              <button onClick={() => setShowCompose(false)} style={{ color: '#6B7299' }}><X size={18} /></button>
            </div>
            <div className="p-6">
              {step === 1 && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold" style={{ color: '#F1F3FA' }}>Who are you emailing?</p>
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
                    <Search size={14} style={{ color: '#6B7299' }} />
                    <input value={contactSearch} onChange={e => setContactSearch(e.target.value)} placeholder="Search contacts or type email..." className="bg-transparent outline-none flex-1 text-sm" style={{ color: '#F1F3FA' }} />
                  </div>
                  {filteredContacts.length > 0 && (
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {filteredContacts.slice(0, 6).map((c, i) => (
                        <button key={i} onClick={() => { setSelectedContact(c); setStep(2) }} className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-left" style={{ backgroundColor: selectedContact === c ? 'rgba(139,92,246,0.12)' : CARD, border: `1px solid ${BORDER}` }}>
                          <div className="flex items-center justify-center rounded-full shrink-0" style={{ width: 32, height: 32, backgroundColor: 'rgba(139,92,246,0.15)', color: PURPLE, fontSize: 10, fontWeight: 700 }}>{(c.first_name || '?')[0]}{(c.last_name || '')[0]}</div>
                          <div className="min-w-0"><p className="text-xs font-semibold truncate" style={{ color: '#F1F3FA' }}>{c.first_name} {c.last_name}</p><p className="text-xs truncate" style={{ color: '#6B7299' }}>{c.email}{c.company ? ` · ${c.company}` : ''}</p></div>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
                    <input value={manualEmail} onChange={e => setManualEmail(e.target.value)} placeholder="Or type email address..." className="w-full bg-transparent outline-none text-sm rounded-lg px-3 py-2.5" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, color: '#F1F3FA' }} />
                  </div>
                  <button onClick={() => setStep(2)} disabled={!selectedContact && !manualEmail.includes('@')} className="w-full py-2.5 rounded-xl text-sm font-semibold" style={{ backgroundColor: PURPLE, color: '#F9FAFB', opacity: !selectedContact && !manualEmail.includes('@') ? 0.4 : 1 }}>Next</button>
                </div>
              )}
              {step === 2 && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold" style={{ color: '#F1F3FA' }}>What&apos;s the goal?</p>
                  <div className="flex flex-wrap gap-2">
                    {[...GOALS, 'Custom'].map(g => (
                      <button key={g} onClick={() => setSelectedGoal(g)} className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: selectedGoal === g ? PURPLE : CARD, color: selectedGoal === g ? '#F9FAFB' : '#9CA3AF', border: `1px solid ${selectedGoal === g ? PURPLE : BORDER}` }}>{g}</button>
                    ))}
                  </div>
                  {selectedGoal === 'Custom' && (
                    <input value={customGoal} onChange={e => setCustomGoal(e.target.value)} placeholder="Describe the email goal..." className="w-full text-sm rounded-lg px-3 py-2.5 outline-none" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, color: '#F1F3FA' }} />
                  )}
                  <button onClick={generateDraft} disabled={generating || (!selectedGoal || (selectedGoal === 'Custom' && !customGoal))} className="w-full py-2.5 rounded-xl text-sm font-semibold" style={{ backgroundColor: PURPLE, color: '#F9FAFB', opacity: generating ? 0.5 : 1 }}>
                    {generating ? 'AI is drafting...' : 'Generate Draft'}
                  </button>
                </div>
              )}
              {step === 3 && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold" style={{ color: '#F1F3FA' }}>Your draft</p>
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: '#6B7299' }}>Subject</label>
                    <input value={draft.subject} onChange={e => setDraft(d => ({ ...d, subject: e.target.value }))} className="w-full text-sm rounded-lg px-3 py-2.5 outline-none" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, color: '#F1F3FA' }} />
                  </div>
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: '#6B7299' }}>Body</label>
                    <textarea value={draft.body} onChange={e => setDraft(d => ({ ...d, body: e.target.value }))} rows={8} className="w-full text-sm rounded-lg px-3 py-2.5 outline-none resize-none" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, color: '#F1F3FA' }} />
                  </div>
                  {draft.suggestedFollowUpDate && <p className="text-xs" style={{ color: '#6B7299' }}>Suggested follow-up: {draft.suggestedFollowUpDate}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => { setSent(true); setTimeout(() => setShowCompose(false), 1500) }} className="flex-1 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2" style={{ backgroundColor: sent ? '#22C55E' : PURPLE, color: '#F9FAFB' }}>
                      {sent ? <><Check size={14} /> Sent!</> : <><Send size={14} /> Send</>}
                    </button>
                    <button onClick={() => { setStep(2); generateDraft() }} className="px-4 py-2.5 rounded-xl text-sm" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, color: '#9CA3AF' }}><RotateCcw size={14} /></button>
                    <button onClick={() => { navigator.clipboard.writeText(`Subject: ${draft.subject}\n\n${draft.body}`); setCopied(true); setTimeout(() => setCopied(false), 2000) }} className="px-4 py-2.5 rounded-xl text-sm" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, color: copied ? '#22C55E' : '#9CA3AF' }}><Copy size={14} /></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
