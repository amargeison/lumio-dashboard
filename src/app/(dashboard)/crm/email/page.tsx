'use client'

import { useState, useEffect } from 'react'
import { Mail, Send, RotateCcw, Copy, X, Search, Check } from 'lucide-react'

const CARD = '#121320'
const BORDER = '#1E2035'
const PURPLE = '#8B5CF6'

interface Contact { first_name?: string; last_name?: string; email?: string; company?: string; job_title?: string }

const GOALS = [
  'Follow up on proposal', 'Chase invoice', 'Introduction / first contact',
  'Share update or news', 'Book a meeting', 'Respond to enquiry',
]

const MOCK_THREADS = [
  { from: 'Charlotte Davies', subject: 'Re: Q2 Proposal — Apex Consulting', preview: 'Thanks for sending this over. I\'ve shared it with our board...', time: '2h ago' },
  { from: 'Marcus Chen', subject: 'Intro call follow-up', preview: 'Great speaking with you today. As discussed, I\'ll send over the...', time: '5h ago' },
  { from: 'Sophie Williams', subject: 'Contract renewal — Sterling & Co', preview: 'Hi, just checking in on the renewal. Our finance team needs...', time: 'Yesterday' },
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#F1F3FA' }}>Email</h1>
          <p className="text-sm mt-1" style={{ color: '#6B7299' }}>AI-powered email composer</p>
        </div>
        <button onClick={() => { resetCompose(); setShowCompose(true) }} className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold" style={{ backgroundColor: PURPLE, color: '#F9FAFB' }}>
          <Mail size={16} /> Compose Email
        </button>
      </div>

      {/* Inbox */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
        <div className="px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <p className="text-sm font-semibold" style={{ color: '#F1F3FA' }}>Inbox</p>
        </div>
        {!emailConnected ? (
          <div className="relative">
            <div style={{ filter: 'blur(4px)', pointerEvents: 'none' }}>
              {MOCK_THREADS.map((t, i) => (
                <div key={i} className="flex items-start gap-3 px-5 py-4" style={{ borderBottom: i < 2 ? `1px solid ${BORDER}` : undefined }}>
                  <div className="flex items-center justify-center rounded-full shrink-0" style={{ width: 36, height: 36, backgroundColor: 'rgba(139,92,246,0.15)', color: PURPLE, fontSize: 12, fontWeight: 700 }}>{t.from.split(' ').map(w => w[0]).join('')}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between"><p className="text-sm font-semibold truncate" style={{ color: '#F1F3FA' }}>{t.from}</p><span className="text-xs shrink-0" style={{ color: '#6B7299' }}>{t.time}</span></div>
                    <p className="text-xs font-medium truncate" style={{ color: '#9CA3AF' }}>{t.subject}</p>
                    <p className="text-xs truncate" style={{ color: '#6B7299' }}>{t.preview}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(15,16,25,0.8)' }}>
              <div className="text-center px-6">
                <Mail size={32} style={{ color: PURPLE, margin: '0 auto 12px' }} />
                <p className="text-sm font-semibold mb-1" style={{ color: '#F1F3FA' }}>Connect your email</p>
                <p className="text-xs" style={{ color: '#6B7299' }}>Connect Gmail or Outlook in Settings to see your inbox here</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-5 py-8 text-center">
            <p className="text-sm" style={{ color: '#6B7299' }}>Email connected — inbox sync coming soon</p>
          </div>
        )}
      </div>

      {/* Compose modal */}
      {showCompose && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowCompose(false)}>
          <div className="rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" style={{ backgroundColor: '#0F1019', border: `1px solid ${BORDER}` }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <p className="text-sm font-bold" style={{ color: '#F1F3FA' }}>Compose Email — Step {step}/3</p>
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
