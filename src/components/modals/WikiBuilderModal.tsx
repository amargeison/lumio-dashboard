'use client'

import { useState, useRef, useEffect } from 'react'
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
]

const FALLBACK_SECTIONS = [
  { heading: 'Getting Started', content: 'Welcome to the team! This section covers everything you need to know in your first week.', bullets: ['Set up your workstation', 'Meet your team lead', 'Complete HR onboarding checklist'] },
  { heading: 'Company Policies', content: 'Our key policies and procedures that all staff should be familiar with.', bullets: ['Holiday and absence policy', 'Remote working guidelines', 'Expense claims process'] },
  { heading: 'Tools & Systems', content: 'A guide to the tools we use daily and how to access them.', bullets: ['Slack for team communication', 'Notion for documentation', 'HubSpot for CRM'] },
  { heading: 'Support Processes', content: 'How we handle customer support requests from initial contact to resolution.', bullets: ['Ticket triage process', 'SLA response times', 'Escalation procedures'] },
  { heading: 'FAQ', content: 'Frequently asked questions from the team.', bullets: ['How do I request time off?', 'Where do I find the brand guidelines?', 'Who handles IT issues?'] },
]

type Section = { heading: string; content: string; bullets: string[] }

export default function WikiBuilderModal({ onClose, onToast }: { onClose: () => void; onToast: (msg: string) => void }) {
  const [step, setStep] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  // Step 0 state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [connectedTools, setConnectedTools] = useState<string[]>([])
  const [wikiTitle, setWikiTitle] = useState('')
  const [wikiType, setWikiType] = useState('Internal Staff Wiki')
  const [audience, setAudience] = useState('All Staff')

  // Step 1 state
  const [processingDone, setProcessingDone] = useState<boolean[]>([])

  // Step 2 state
  const [wikiSections, setWikiSections] = useState<Section[]>([])
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [regeneratingIdx, setRegeneratingIdx] = useState<number | null>(null)

  function toggleTool(id: string) {
    setConnectedTools(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    setUploadedFiles(prev => [...prev, ...files])
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

    const messages = ['Reading your documents...', 'Connecting to your tools...', 'Analysing content...', 'Structuring wiki sections...', 'Building your wiki...']
    messages.forEach((_, i) => {
      setTimeout(() => setProcessingDone(prev => [...prev, true]), (i + 1) * 600)
    })

    setTimeout(async () => {
      try {
        const res = await fetch('/api/wiki-builder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: wikiTitle, type: wikiType, fileCount: uploadedFiles.length }),
        })
        const data = await res.json()
        if (data.sections && data.sections.length > 0) {
          setWikiSections(data.sections)
        } else {
          setWikiSections(FALLBACK_SECTIONS)
        }
      } catch {
        setWikiSections(FALLBACK_SECTIONS)
      }
      setStep(2)
    }, 3200)
  }

  function addSection() {
    setWikiSections(prev => [...prev, { heading: 'New Section', content: 'Add your content here.', bullets: ['Point 1', 'Point 2', 'Point 3'] }])
  }

  function updateSection(idx: number, field: keyof Section, value: string | string[]) {
    setWikiSections(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s))
  }

  function regenerateSection(idx: number) {
    setRegeneratingIdx(idx)
    setTimeout(() => {
      setRegeneratingIdx(null)
    }, 1500)
  }

  function getFullText() {
    return wikiSections.map(s => `## ${s.heading}\n\n${s.content}\n\n${s.bullets.map(b => `- ${b}`).join('\n')}`).join('\n\n---\n\n')
  }

  const processingMessages = ['Reading your documents...', 'Connecting to your tools...', 'Analysing content...', 'Structuring wiki sections...', 'Building your wiki...']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full rounded-2xl overflow-hidden" style={{ maxWidth: 680, backgroundColor: '#111318', border: '1px solid #1F2937', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Wiki Builder</h2>
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
              <h3 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Build your internal Wiki</h3>
              <p style={{ color: '#9CA3AF', fontSize: 13, marginBottom: 20 }}>Drop in your docs or connect your tools — Lumio will do the rest</p>

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
                      backgroundColor: 'rgba(255,255,255,0.02)', cursor: 'pointer', minHeight: 140,
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
                </div>

                {/* Right — Connect Tools */}
                <div>
                  <label className="text-xs font-medium block mb-2" style={{ color: '#9CA3AF' }}>Connect Tools</label>
                  <div className="space-y-2">
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
                  <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>Wiki Title *</label>
                  <input value={wikiTitle} onChange={e => setWikiTitle(e.target.value)} style={INPUT_STYLE} placeholder="e.g. Staff Onboarding Wiki" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>Wiki Type</label>
                    <select value={wikiType} onChange={e => setWikiType(e.target.value)} style={INPUT_STYLE}>
                      <option>Internal Staff Wiki</option>
                      <option>Product Wiki</option>
                      <option>Process Wiki</option>
                      <option>Onboarding Wiki</option>
                      <option>Technical Docs</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>Audience</label>
                    <select value={audience} onChange={e => setAudience(e.target.value)} style={INPUT_STYLE}>
                      <option>All Staff</option>
                      <option>Support Team</option>
                      <option>Sales Team</option>
                      <option>Leadership</option>
                      <option>Custom</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={startProcessing}
                  disabled={!wikiTitle.trim()}
                  style={{
                    width: '100%', padding: '10px 0', borderRadius: 8, fontWeight: 600, fontSize: 14, border: 'none', cursor: wikiTitle.trim() ? 'pointer' : 'not-allowed',
                    backgroundColor: wikiTitle.trim() ? '#0D9488' : '#1F2937',
                    color: wikiTitle.trim() ? '#fff' : '#6B7280',
                    marginTop: 8,
                  }}
                >Build Wiki →</button>
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
            <div className="flex gap-4">
              {/* Sidebar */}
              <div style={{ minWidth: 160 }}>
                <label className="text-xs font-medium block mb-2" style={{ color: '#9CA3AF' }}>Sections</label>
                <div className="space-y-1">
                  {wikiSections.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => document.getElementById(`wiki-section-${i}`)?.scrollIntoView({ behavior: 'smooth' })}
                      style={{ display: 'block', width: '100%', textAlign: 'left', fontSize: 12, color: '#D1D5DB', padding: '6px 10px', borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.03)', border: 'none', cursor: 'pointer' }}
                    >{s.heading}</button>
                  ))}
                </div>
              </div>

              {/* Main */}
              <div style={{ flex: 1 }} className="space-y-4">
                {wikiSections.map((s, i) => (
                  <div key={i} id={`wiki-section-${i}`} style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid #1F2937', borderRadius: 12, padding: 16 }}>
                    {editingIdx === i ? (
                      <div className="space-y-2">
                        <input value={s.heading} onChange={e => updateSection(i, 'heading', e.target.value)} style={{ ...INPUT_STYLE, fontWeight: 700 }} />
                        <textarea value={s.content} onChange={e => updateSection(i, 'content', e.target.value)} rows={3} style={{ ...INPUT_STYLE, resize: 'vertical' }} />
                        <textarea value={s.bullets.join('\n')} onChange={e => updateSection(i, 'bullets', e.target.value.split('\n'))} rows={3} style={{ ...INPUT_STYLE, resize: 'vertical' }} />
                        <button onClick={() => setEditingIdx(null)} style={{ fontSize: 12, color: '#0D9488', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Done</button>
                      </div>
                    ) : (
                      <>
                        <h3 style={{ color: '#F9FAFB', fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{s.heading}</h3>
                        <p style={{ color: '#9CA3AF', fontSize: 13, marginBottom: 8 }}>{s.content}</p>
                        <ul style={{ margin: 0, paddingLeft: 16 }}>
                          {s.bullets.map((b, j) => (
                            <li key={j} style={{ color: '#D1D5DB', fontSize: 13, marginBottom: 2, listStyleType: 'disc' }}>
                              <span style={{ color: '#5EEAD4' }}></span>{b}
                            </li>
                          ))}
                        </ul>
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => setEditingIdx(i)} style={{ fontSize: 12, color: '#9CA3AF', background: 'none', border: '1px solid #374151', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>Edit</button>
                          <button onClick={() => regenerateSection(i)} style={{ fontSize: 12, color: '#9CA3AF', background: 'none', border: '1px solid #374151', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                            {regeneratingIdx === i ? 'Regenerating...' : 'Regenerate'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                <button onClick={addSection} className="flex items-center gap-2" style={{ fontSize: 13, color: '#0D9488', background: 'none', border: '1px dashed #374151', borderRadius: 8, padding: '10px 16px', cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
                  <Plus size={14} /> Add section
                </button>
                <button onClick={() => setStep(3)} style={{ width: '100%', padding: '10px 0', borderRadius: 8, fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer', backgroundColor: '#0D9488', color: '#fff', marginTop: 8 }}>Continue to Publish →</button>
              </div>
            </div>
          )}

          {/* STEP 3 — Publish */}
          {step === 3 && (
            <div>
              <h3 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>{wikiTitle}</h3>
              <div className="space-y-4" style={{ marginBottom: 24 }}>
                {wikiSections.map((s, i) => (
                  <div key={i} style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid #1F2937', borderRadius: 12, padding: 16 }}>
                    <h4 style={{ color: '#F9FAFB', fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{s.heading}</h4>
                    <p style={{ color: '#9CA3AF', fontSize: 13, marginBottom: 8 }}>{s.content}</p>
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                      {s.bullets.map((b, j) => (
                        <li key={j} style={{ color: '#D1D5DB', fontSize: 13, marginBottom: 2 }}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2" style={{ marginBottom: 16 }}>
                <button onClick={() => { navigator.clipboard.writeText(getFullText()); onToast('Copied!') }} className="flex items-center gap-2" style={{ padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid #374151', backgroundColor: 'rgba(255,255,255,0.03)', color: '#D1D5DB', cursor: 'pointer' }}>
                  <Copy size={14} /> Copy to Clipboard
                </button>
                <button onClick={() => onToast('Downloading PDF...')} className="flex items-center gap-2" style={{ padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid #374151', backgroundColor: 'rgba(255,255,255,0.03)', color: '#D1D5DB', cursor: 'pointer' }}>
                  <FileText size={14} /> Export as PDF
                </button>
                <button onClick={() => onToast('Published to internal portal \u2713')} className="flex items-center gap-2" style={{ padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid #374151', backgroundColor: 'rgba(255,255,255,0.03)', color: '#D1D5DB', cursor: 'pointer' }}>
                  <Share2 size={14} /> Publish to Portal
                </button>
                <button onClick={() => onToast('Shared to #support \u2713')} className="flex items-center gap-2" style={{ padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid #374151', backgroundColor: 'rgba(255,255,255,0.03)', color: '#D1D5DB', cursor: 'pointer' }}>
                  <Share2 size={14} /> Share to Slack
                </button>
                <button onClick={() => onToast('Sent to team \u2713')} className="flex items-center gap-2" style={{ padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid #374151', backgroundColor: 'rgba(255,255,255,0.03)', color: '#D1D5DB', cursor: 'pointer' }}>
                  <Mail size={14} /> Email to Team
                </button>
              </div>

              <div style={{ textAlign: 'center', color: '#0D9488', fontSize: 13, fontWeight: 600 }}>Wiki saved to Support Library ✓</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
