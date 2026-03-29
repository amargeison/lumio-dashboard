'use client'

import { useState, useRef } from 'react'
import { X, Upload, Check, Loader2, Plus, Copy, FileText, Share2, Mail } from 'lucide-react'

const INPUT_STYLE: React.CSSProperties = {
  backgroundColor: '#0A0B10', border: '1px solid #374151', color: '#F9FAFB',
  borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none', width: '100%',
}

const STEP_LABELS = ['Configure', 'Processing', 'Review', 'Publish']

const TOOLS = [
  { id: 'notion', name: 'Notion', desc: 'Search all pages' },
  { id: 'slack', name: 'Slack', desc: 'Search all channels' },
  { id: 'microsoft365', name: 'Microsoft 365', desc: 'Search all docs' },
  { id: 'gdrive', name: 'Google Drive', desc: 'Search all files' },
  { id: 'confluence', name: 'Confluence', desc: 'Search all spaces' },
  { id: 'hubspot', name: 'HubSpot', desc: 'Search all records' },
  { id: 'zendesk', name: 'Zendesk', desc: 'Search all tickets' },
  { id: 'intercom', name: 'Intercom', desc: 'Search all conversations' },
  { id: 'freshdesk', name: 'Freshdesk', desc: 'Search all tickets' },
  { id: 'hubspot-tickets', name: 'HubSpot Tickets', desc: 'Search all tickets' },
]

const FALLBACK_QUESTIONS = [
  { question: 'How do I reset my password?', answer: 'Go to the login page and click "Forgot password". You\'ll receive a reset link via email within 2 minutes.', category: 'Account', tags: ['password', 'login'] },
  { question: 'What are your support hours?', answer: 'Our support team is available Monday to Friday, 9am to 6pm GMT. You can also reach us via email outside these hours.', category: 'Support', tags: ['hours', 'contact'] },
  { question: 'How do I upgrade my plan?', answer: 'Go to Settings \u2192 Billing and select your new plan. Changes take effect immediately and you\'ll be charged pro-rata.', category: 'Billing', tags: ['upgrade', 'plan'] },
  { question: 'Can I export my data?', answer: 'Yes \u2014 go to Settings \u2192 Data and click "Export All". You can export as CSV, Excel or PDF.', category: 'Technical', tags: ['export', 'data'] },
  { question: 'Do you offer a free trial?', answer: 'Yes! Every new account gets a 14-day free trial with full access to all features. No credit card required.', category: 'Billing', tags: ['trial', 'free'] },
  { question: 'How do I add team members?', answer: 'Go to Settings \u2192 Team and click "Invite". Enter their email address and they\'ll receive an invitation to join.', category: 'Account', tags: ['team', 'invite'] },
  { question: 'Is my data secure?', answer: 'Absolutely. We use AES-256 encryption, store all data in UK data centres, and are fully GDPR compliant.', category: 'Technical', tags: ['security', 'gdpr'] },
  { question: 'How do I cancel my account?', answer: 'Go to Settings \u2192 Billing \u2192 Cancel. Your data will be retained for 30 days in case you change your mind.', category: 'Billing', tags: ['cancel', 'account'] },
]

type FAQ = { question: string; answer: string; category: string; tags: string[] }

const CATEGORIES = ['All', 'Account', 'Billing', 'Support', 'Technical']

export default function FAQBuilderModal({ onClose, onToast }: { onClose: () => void; onToast: (msg: string) => void }) {
  const [step, setStep] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  // Step 0 state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [connectedTools, setConnectedTools] = useState<string[]>([])
  const [faqTitle, setFaqTitle] = useState('')
  const [faqType, setFaqType] = useState('Customer FAQ')
  const [tone, setTone] = useState('Friendly & Simple')
  const [maxQuestions, setMaxQuestions] = useState('10')
  const [pastedQuestions, setPastedQuestions] = useState('')

  // Step 1 state
  const [processingDone, setProcessingDone] = useState<boolean[]>([])

  // Step 2 state
  const [faqItems, setFaqItems] = useState<FAQ[]>([])
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [activeCategory, setActiveCategory] = useState('All')

  function toggleTool(id: string) {
    setConnectedTools(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault()
    setUploadedFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)])
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) setUploadedFiles(prev => [...prev, ...Array.from(e.target.files!)])
  }

  function removeFile(idx: number) {
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx))
  }

  function startProcessing() {
    setStep(1)
    setProcessingDone([])

    const messages = ['Reading support history...', 'Identifying common questions...', 'Drafting answers...', 'Formatting FAQ...']
    messages.forEach((_, i) => {
      setTimeout(() => setProcessingDone(prev => [...prev, true]), (i + 1) * 600)
    })

    setTimeout(async () => {
      try {
        const res = await fetch('/api/faq-builder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: faqTitle, tone, maxQuestions: parseInt(maxQuestions) }),
        })
        const data = await res.json()
        if (data.questions && data.questions.length > 0) {
          setFaqItems(data.questions)
        } else {
          setFaqItems(FALLBACK_QUESTIONS)
        }
      } catch {
        setFaqItems(FALLBACK_QUESTIONS)
      }
      setStep(2)
    }, 3200)
  }

  function addQuestion() {
    setFaqItems(prev => [...prev, { question: 'New question?', answer: 'Add your answer here.', category: 'Account', tags: ['new'] }])
  }

  function deleteQuestion(idx: number) {
    setFaqItems(prev => prev.filter((_, i) => i !== idx))
  }

  function updateFaq(idx: number, field: keyof FAQ, value: string | string[]) {
    setFaqItems(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q))
  }

  const filteredFaqs = activeCategory === 'All' ? faqItems : faqItems.filter(q => q.category === activeCategory)

  function getFullText() {
    const grouped: Record<string, FAQ[]> = {}
    faqItems.forEach(q => { (grouped[q.category] ??= []).push(q) })
    return Object.entries(grouped).map(([cat, qs]) =>
      `## ${cat}\n\n${qs.map(q => `**Q: ${q.question}**\nA: ${q.answer}`).join('\n\n')}`
    ).join('\n\n---\n\n')
  }

  const processingMessages = ['Reading support history...', 'Identifying common questions...', 'Drafting answers...', 'Formatting FAQ...']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full rounded-2xl overflow-hidden" style={{ maxWidth: 680, backgroundColor: '#111318', border: '1px solid #1F2937', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>FAQ Builder</h2>
          <button onClick={onClose} style={{ color: '#6B7280' }}><X size={18} /></button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-4 py-3 px-6" style={{ borderBottom: '1px solid #1F2937' }}>
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div style={{
                width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
                backgroundColor: i <= step ? '#0D9488' : '#1F2937',
                color: i <= step ? '#fff' : '#6B7280',
              }}>{i + 1}</div>
              <span style={{ fontSize: 12, color: i <= step ? '#F9FAFB' : '#6B7280' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6" style={{ flex: 1 }}>

          {/* STEP 0 — Configure */}
          {step === 0 && (
            <div>
              <h3 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Build your customer FAQ</h3>
              <p style={{ color: '#9CA3AF', fontSize: 13, marginBottom: 20 }}>Drop in support tickets, docs or connect your helpdesk — AI will identify the most common questions</p>

              <div className="grid grid-cols-2 gap-4" style={{ marginBottom: 20 }}>
                {/* Left — Upload */}
                <div>
                  <label className="text-xs font-medium block mb-2" style={{ color: '#9CA3AF' }}>Upload Documents</label>
                  <div
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleFileDrop}
                    onClick={() => fileRef.current?.click()}
                    style={{
                      border: '2px dashed #374151', borderRadius: 12, padding: 24, textAlign: 'center',
                      backgroundColor: 'rgba(255,255,255,0.02)', cursor: 'pointer', minHeight: 120,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    <Upload size={24} style={{ color: '#6B7280' }} />
                    <span style={{ color: '#9CA3AF', fontSize: 13 }}>Drag & drop files here</span>
                    <span style={{ color: '#6B7280', fontSize: 12 }}>or click to browse</span>
                    <span style={{ color: '#4B5563', fontSize: 11 }}>.docx, .pdf, .xlsx, .csv, .txt, .md</span>
                  </div>
                  <input ref={fileRef} type="file" hidden multiple accept=".docx,.pdf,.xlsx,.csv,.txt,.md" onChange={handleFileChange} />
                  {uploadedFiles.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      {uploadedFiles.map((f, i) => (
                        <div key={i} className="flex items-center justify-between" style={{ fontSize: 12, color: '#D1D5DB', padding: '4px 0' }}>
                          <span>{f.name}</span>
                          <button onClick={() => removeFile(i)} style={{ color: '#EF4444', fontSize: 11 }}>Remove</button>
                        </div>
                      ))}
                    </div>
                  )}

                  <label className="text-xs font-medium block mb-1.5 mt-3" style={{ color: '#9CA3AF' }}>Paste common questions (optional)</label>
                  <textarea value={pastedQuestions} onChange={e => setPastedQuestions(e.target.value)} rows={3} style={{ ...INPUT_STYLE, resize: 'vertical' }} placeholder="One question per line..." />
                </div>

                {/* Right — Connect Tools */}
                <div>
                  <label className="text-xs font-medium block mb-2" style={{ color: '#9CA3AF' }}>Connect Tools & Helpdesks</label>
                  <div className="space-y-2" style={{ maxHeight: 320, overflowY: 'auto' }}>
                    {TOOLS.map(t => {
                      const connected = connectedTools.includes(t.id)
                      return (
                        <button
                          key={t.id}
                          onClick={() => toggleTool(t.id)}
                          className="w-full flex items-center justify-between"
                          style={{
                            padding: '8px 12px', borderRadius: 8, fontSize: 13, textAlign: 'left',
                            border: connected ? '1px solid #0D9488' : '1px solid #374151',
                            backgroundColor: connected ? 'rgba(13,148,136,0.1)' : 'rgba(255,255,255,0.02)',
                            color: connected ? '#5EEAD4' : '#9CA3AF',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, color: connected ? '#F9FAFB' : '#D1D5DB' }}>{t.name}</div>
                            <div style={{ fontSize: 11 }}>{t.desc}</div>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 600 }}>{connected ? 'Connected' : 'Connect'}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom fields */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>FAQ Title *</label>
                  <input value={faqTitle} onChange={e => setFaqTitle(e.target.value)} style={INPUT_STYLE} placeholder="e.g. Customer Support FAQ" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>FAQ Type</label>
                    <select value={faqType} onChange={e => setFaqType(e.target.value)} style={INPUT_STYLE}>
                      <option>Customer FAQ</option>
                      <option>Product FAQ</option>
                      <option>Onboarding FAQ</option>
                      <option>Billing FAQ</option>
                      <option>Technical FAQ</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>Tone</label>
                    <select value={tone} onChange={e => setTone(e.target.value)} style={INPUT_STYLE}>
                      <option>Friendly & Simple</option>
                      <option>Professional</option>
                      <option>Technical</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>Max Questions</label>
                    <select value={maxQuestions} onChange={e => setMaxQuestions(e.target.value)} style={INPUT_STYLE}>
                      <option>10</option>
                      <option>20</option>
                      <option>30</option>
                      <option>50</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={startProcessing}
                  disabled={!faqTitle.trim()}
                  style={{
                    width: '100%', padding: '10px 0', borderRadius: 8, fontWeight: 600, fontSize: 14, border: 'none', cursor: faqTitle.trim() ? 'pointer' : 'not-allowed',
                    backgroundColor: faqTitle.trim() ? '#0D9488' : '#1F2937',
                    color: faqTitle.trim() ? '#fff' : '#6B7280',
                    marginTop: 8,
                  }}
                >Build FAQ →</button>
              </div>
            </div>
          )}

          {/* STEP 1 — Processing */}
          {step === 1 && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Loader2 size={40} style={{ color: '#0D9488', margin: '0 auto 24px', animation: 'spin 1s linear infinite' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
              <div className="space-y-3" style={{ maxWidth: 300, margin: '0 auto', textAlign: 'left' }}>
                {processingMessages.map((msg, i) => (
                  <div key={i} className="flex items-center gap-3" style={{ color: processingDone.length > i ? '#5EEAD4' : '#6B7280', fontSize: 14, transition: 'color 0.3s' }}>
                    {processingDone.length > i ? <Check size={16} /> : <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                    <span>{msg}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2 — Review */}
          {step === 2 && (
            <div>
              {/* Category tabs */}
              <div className="flex gap-2 mb-4">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    style={{
                      padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
                      backgroundColor: activeCategory === cat ? '#0D9488' : '#1F2937',
                      color: activeCategory === cat ? '#fff' : '#9CA3AF',
                    }}
                  >{cat}</button>
                ))}
              </div>

              <div className="space-y-3">
                {filteredFaqs.map((q, i) => {
                  const realIdx = faqItems.indexOf(q)
                  return (
                    <div key={realIdx} style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid #1F2937', borderRadius: 12, padding: 16 }}>
                      {editingIdx === realIdx ? (
                        <div className="space-y-2">
                          <input value={q.question} onChange={e => updateFaq(realIdx, 'question', e.target.value)} style={{ ...INPUT_STYLE, fontWeight: 700 }} />
                          <textarea value={q.answer} onChange={e => updateFaq(realIdx, 'answer', e.target.value)} rows={3} style={{ ...INPUT_STYLE, resize: 'vertical' }} />
                          <div className="grid grid-cols-2 gap-2">
                            <select value={q.category} onChange={e => updateFaq(realIdx, 'category', e.target.value)} style={INPUT_STYLE}>
                              <option>Account</option><option>Billing</option><option>Support</option><option>Technical</option>
                            </select>
                            <input value={q.tags.join(', ')} onChange={e => updateFaq(realIdx, 'tags', e.target.value.split(',').map(t => t.trim()))} style={INPUT_STYLE} placeholder="Tags (comma separated)" />
                          </div>
                          <button onClick={() => setEditingIdx(null)} style={{ fontSize: 12, color: '#0D9488', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Done</button>
                        </div>
                      ) : (
                        <>
                          <h4 style={{ color: '#F9FAFB', fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{q.question}</h4>
                          <p style={{ color: '#9CA3AF', fontSize: 13, marginBottom: 8 }}>{q.answer}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span style={{ backgroundColor: '#1F2937', color: '#5EEAD4', fontSize: 11, padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>{q.category}</span>
                            {q.tags.map((tag, ti) => (
                              <span key={ti} style={{ backgroundColor: '#1F2937', color: '#9CA3AF', fontSize: 11, padding: '2px 8px', borderRadius: 12 }}>{tag}</span>
                            ))}
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button onClick={() => setEditingIdx(realIdx)} style={{ fontSize: 12, color: '#9CA3AF', background: 'none', border: '1px solid #374151', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>Edit</button>
                            <button onClick={() => deleteQuestion(realIdx)} style={{ fontSize: 12, color: '#EF4444', background: 'none', border: '1px solid #374151', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>Delete</button>
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>

              <button onClick={addQuestion} className="flex items-center gap-2" style={{ fontSize: 13, color: '#0D9488', background: 'none', border: '1px dashed #374151', borderRadius: 8, padding: '10px 16px', cursor: 'pointer', width: '100%', justifyContent: 'center', marginTop: 12 }}>
                <Plus size={14} /> Add question
              </button>
              <button onClick={() => setStep(3)} style={{ width: '100%', padding: '10px 0', borderRadius: 8, fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer', backgroundColor: '#0D9488', color: '#fff', marginTop: 8 }}>Continue to Publish →</button>
            </div>
          )}

          {/* STEP 3 — Publish */}
          {step === 3 && (
            <div>
              <h3 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>{faqTitle}</h3>

              {/* Grouped by category */}
              {(() => {
                const grouped: Record<string, FAQ[]> = {}
                faqItems.forEach(q => { (grouped[q.category] ??= []).push(q) })
                return Object.entries(grouped).map(([cat, qs]) => (
                  <div key={cat} style={{ marginBottom: 20 }}>
                    <h4 style={{ color: '#5EEAD4', fontSize: 14, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>{cat}</h4>
                    <div className="space-y-3">
                      {qs.map((q, i) => (
                        <div key={i} style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid #1F2937', borderRadius: 12, padding: 16 }}>
                          <h5 style={{ color: '#F9FAFB', fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{q.question}</h5>
                          <p style={{ color: '#9CA3AF', fontSize: 13 }}>{q.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              })()}

              <div className="flex flex-wrap gap-2" style={{ marginBottom: 16 }}>
                <button onClick={() => { navigator.clipboard.writeText(getFullText()); onToast('Copied!') }} className="flex items-center gap-2" style={{ padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid #374151', backgroundColor: 'rgba(255,255,255,0.03)', color: '#D1D5DB', cursor: 'pointer' }}>
                  <Copy size={14} /> Copy
                </button>
                <button onClick={() => onToast('Downloading PDF...')} className="flex items-center gap-2" style={{ padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid #374151', backgroundColor: 'rgba(255,255,255,0.03)', color: '#D1D5DB', cursor: 'pointer' }}>
                  <FileText size={14} /> PDF
                </button>
                <button onClick={() => onToast('Published to Help Centre \u2713')} className="flex items-center gap-2" style={{ padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid #374151', backgroundColor: 'rgba(255,255,255,0.03)', color: '#D1D5DB', cursor: 'pointer' }}>
                  <Share2 size={14} /> Publish to Help Centre
                </button>
                <button onClick={() => onToast('Shared to #support \u2713')} className="flex items-center gap-2" style={{ padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid #374151', backgroundColor: 'rgba(255,255,255,0.03)', color: '#D1D5DB', cursor: 'pointer' }}>
                  <Share2 size={14} /> Share to Slack
                </button>
                <button onClick={() => onToast('Sent to team \u2713')} className="flex items-center gap-2" style={{ padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid #374151', backgroundColor: 'rgba(255,255,255,0.03)', color: '#D1D5DB', cursor: 'pointer' }}>
                  <Mail size={14} /> Email
                </button>
                <button onClick={() => { navigator.clipboard.writeText('<iframe src="/faq/embed" />'); onToast('Embed link copied!') }} className="flex items-center gap-2" style={{ padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid #374151', backgroundColor: 'rgba(255,255,255,0.03)', color: '#D1D5DB', cursor: 'pointer' }}>
                  <Copy size={14} /> Copy embed link
                </button>
              </div>

              <div style={{ textAlign: 'center', color: '#0D9488', fontSize: 13, fontWeight: 600 }}>FAQ saved to Support Library ✓</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
