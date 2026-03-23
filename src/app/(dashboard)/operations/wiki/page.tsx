'use client'

import { useState, useRef } from 'react'
import { Check, ChevronRight, Upload, X, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const SOURCES = [
  { id: 'notion',     label: 'Notion',       emoji: '📝' },
  { id: 'sharepoint', label: 'SharePoint',   emoji: '🏢' },
  { id: 'gdrive',     label: 'Google Drive', emoji: '📁' },
  { id: 'confluence', label: 'Confluence',   emoji: '🔗' },
  { id: 'slack',      label: 'Slack',        emoji: '💬' },
  { id: 'github',     label: 'GitHub Wiki',  emoji: '🐙' },
  { id: 'jira',       label: 'Jira',         emoji: '🎯' },
  { id: 'airtable',   label: 'Airtable',     emoji: '📊' },
]

const PRESET_SECTIONS = [
  'Company Overview',
  'Mission & Values',
  'New Starter Guide',
  'HR Policies',
  'SOPs',
  'Tech Stack',
  'Product & Roadmap',
  'Team Directory',
  'Security Guidelines',
  'Benefits & Perks',
]

const TONES = ['Professional', 'Friendly', 'Technical', 'Concise']

const DESTINATIONS = [
  { id: 'notion',     label: 'Notion' },
  { id: 'confluence', label: 'Confluence' },
  { id: 'sharepoint', label: 'SharePoint' },
  { id: 'word',       label: 'Word (.docx)' },
  { id: 'markdown',   label: 'Markdown (.md)' },
]

const STEPS = ['Sources', 'Configure', 'Build', 'Review & Publish']

const MOCK_OUTPUT = `# Company Wiki

## Company Overview
Lumio is a business automation platform designed for growing SMBs. Founded in 2024, it provides pre-built workflows across 14 departments, connecting tools like HubSpot, Xero, Microsoft 365, and Slack to automate the admin that slows teams down.

## New Starter Guide
Welcome to Lumio. On your first day, your M365 account, Teams access, and training modules will already be set up. Your manager will meet you at 9:30am. Your onboarding checklist will appear in your email before you arrive.

## SOPs

### Invoice Processing
1. Invoices are automatically raised in Xero when a deal is marked Won in HubSpot.
2. Chase emails are sent at Day 1, Day 10, and Day 20 automatically.
3. Finance reviews outstanding invoices every Monday from the Slack summary.

### New Joiner Onboarding
1. HR enters the new hire in the HR system.
2. Lumio provisions M365, Teams, SharePoint, payroll, and training automatically.
3. Manager is notified in Slack with a checklist of everything completed.

## HR Policies

### Annual Leave
All employees receive 25 days plus UK bank holidays. Leave must be requested via the HR system. Approvals are notified via Slack.

### Remote Working
Lumio operates a hybrid model — minimum 2 days in-office per week. Fully remote arrangements require line manager and HR approval.`

export default function WikiBuilderPage() {
  const [step, setStep]           = useState(0)
  const [sources, setSources]     = useState<string[]>([])
  const [files, setFiles]         = useState<string[]>([])
  const [sections, setSections]   = useState<string[]>(['Company Overview', 'New Starter Guide', 'SOPs'])
  const [customSection, setCustomSection] = useState('')
  const [tone, setTone]           = useState('Professional')
  const [wikiName, setWikiName]   = useState('')
  const [destination, setDestination] = useState('notion')
  const [building, setBuilding]   = useState(false)
  const [built, setBuilt]         = useState(false)
  const [published, setPublished] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function toggleSource(id: string) {
    setSources(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }
  function toggleSection(s: string) {
    setSections(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])
  }
  function addCustom() {
    const t = customSection.trim()
    if (t && !sections.includes(t)) setSections(p => [...p, t])
    setCustomSection('')
  }
  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) setFiles(p => [...p, ...Array.from(e.target.files!).map(f => f.name)])
  }

  async function handleBuild() {
    setBuilding(true)
    try {
      await fetch('/api/workflows/wiki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sources, sections, tone, wikiName }),
      })
    } catch { /* graceful — mock data shown */ }
    await new Promise(r => setTimeout(r, 3200))
    setBuilding(false)
    setBuilt(true)
    setStep(3)
  }

  const canNext0 = sources.length > 0 || files.length > 0
  const canNext1 = sections.length > 0

  function StepBubble({ i }: { i: number }) {
    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
        style={{ backgroundColor: i <= step ? '#0D9488' : '#1F2937', color: i <= step ? '#F9FAFB' : '#6B7280' }}>
        {i < step ? <Check size={12} /> : i + 1}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: 680 }}>
      <Link href="/operations" className="flex items-center gap-1.5 text-xs font-medium w-fit"
        style={{ color: '#9CA3AF' }}>
        <ArrowLeft size={13} /> Back to Operations
      </Link>

      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#4B5563' }}>OP-WIKI-01</p>
        <h1 className="text-2xl font-bold" style={{ color: '#F9FAFB' }}>Create a Wiki</h1>
        <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
          Pull content from your tools, structure it, and publish a living company wiki in minutes.
        </p>
      </div>

      {/* Step bar */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <StepBubble i={i} />
              <span className="text-xs font-medium hidden sm:block"
                style={{ color: i === step ? '#F9FAFB' : '#6B7280' }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <ChevronRight size={14} style={{ color: '#374151' }} />}
          </div>
        ))}
      </div>

      {/* ── Step 0: Sources ── */}
      {step === 0 && (
        <div className="rounded-xl p-6 flex flex-col gap-5"
          style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div>
            <p className="text-sm font-semibold mb-2" style={{ color: '#F9FAFB' }}>Wiki name</p>
            <input type="text" placeholder="e.g. Lumio Company Wiki 2026" value={wikiName}
              onChange={e => setWikiName(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
              style={{ backgroundColor: '#07080F', border: '1px solid #1F2937', color: '#F9FAFB' }}
              onFocus={e => e.currentTarget.style.borderColor = '#0D9488'}
              onBlur={e => e.currentTarget.style.borderColor = '#1F2937'}
            />
          </div>

          <div>
            <p className="text-sm font-semibold mb-3" style={{ color: '#F9FAFB' }}>Select sources</p>
            <div className="grid grid-cols-4 gap-2">
              {SOURCES.map(s => {
                const on = sources.includes(s.id)
                return (
                  <button key={s.id} onClick={() => toggleSource(s.id)}
                    className="flex flex-col items-center gap-1.5 rounded-xl p-3 text-center transition-all"
                    style={{ backgroundColor: on ? 'rgba(13,148,136,0.12)' : '#07080F', border: `1px solid ${on ? '#0D9488' : '#1F2937'}` }}>
                    <span className="text-xl">{s.emoji}</span>
                    <span className="text-xs font-medium" style={{ color: on ? '#0D9488' : '#9CA3AF' }}>{s.label}</span>
                    {on && <Check size={10} style={{ color: '#0D9488' }} />}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold mb-2" style={{ color: '#F9FAFB' }}>
              Or upload files{' '}
              <span style={{ color: '#6B7280', fontWeight: 400 }}>(Word, PDF, CSV, Markdown)</span>
            </p>
            <input ref={fileRef} type="file" multiple accept=".pdf,.docx,.doc,.csv,.md,.txt" className="hidden" onChange={handleFiles} />
            <button onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium w-full justify-center transition-colors"
              style={{ border: '2px dashed #1F2937', color: '#6B7280', backgroundColor: '#07080F' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#0D9488'; e.currentTarget.style.color = '#0D9488' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#1F2937'; e.currentTarget.style.color = '#6B7280' }}>
              <Upload size={14} /> Click to upload files
            </button>
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {files.map(f => (
                  <span key={f} className="flex items-center gap-1 text-xs px-2 py-1 rounded-md"
                    style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>
                    {f}
                    <button onClick={() => setFiles(p => p.filter(x => x !== f))}><X size={10} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => setStep(1)} disabled={!canNext0}
            className="self-end rounded-lg px-5 py-2.5 text-sm font-semibold"
            style={{ backgroundColor: canNext0 ? '#0D9488' : '#1F2937', color: canNext0 ? '#F9FAFB' : '#4B5563' }}>
            Next: Configure →
          </button>
        </div>
      )}

      {/* ── Step 1: Configure ── */}
      {step === 1 && (
        <div className="rounded-xl p-6 flex flex-col gap-5"
          style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div>
            <p className="text-sm font-semibold mb-3" style={{ color: '#F9FAFB' }}>Sections to include</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESET_SECTIONS.map(s => {
                const on = sections.includes(s)
                return (
                  <button key={s} onClick={() => toggleSection(s)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                    style={{ backgroundColor: on ? 'rgba(13,148,136,0.15)' : '#07080F', border: `1px solid ${on ? '#0D9488' : '#1F2937'}`, color: on ? '#0D9488' : '#9CA3AF' }}>
                    {on && '✓ '}{s}
                  </button>
                )
              })}
              {sections.filter(s => !PRESET_SECTIONS.includes(s)).map(s => (
                <button key={s} onClick={() => toggleSection(s)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium"
                  style={{ backgroundColor: 'rgba(13,148,136,0.15)', border: '1px solid #0D9488', color: '#0D9488' }}>
                  ✓ {s} <X size={9} className="inline ml-0.5" />
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" placeholder="Add custom section..." value={customSection}
                onChange={e => setCustomSection(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustom()}
                className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: '#07080F', border: '1px solid #1F2937', color: '#F9FAFB' }}
                onFocus={e => e.currentTarget.style.borderColor = '#0D9488'}
                onBlur={e => e.currentTarget.style.borderColor = '#1F2937'}
              />
              <button onClick={addCustom} className="rounded-lg px-4 py-2 text-sm font-medium"
                style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>Add</button>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold mb-2" style={{ color: '#F9FAFB' }}>Tone</p>
            <div className="flex flex-wrap gap-2">
              {TONES.map(t => (
                <button key={t} onClick={() => setTone(t)}
                  className="rounded-lg px-4 py-2 text-sm font-medium transition-all"
                  style={{ backgroundColor: tone === t ? 'rgba(13,148,136,0.15)' : '#07080F', border: `1px solid ${tone === t ? '#0D9488' : '#1F2937'}`, color: tone === t ? '#0D9488' : '#9CA3AF' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(0)} className="rounded-lg px-5 py-2.5 text-sm font-medium"
              style={{ border: '1px solid #1F2937', color: '#9CA3AF' }}>← Back</button>
            <button onClick={() => setStep(2)} disabled={!canNext1}
              className="rounded-lg px-5 py-2.5 text-sm font-semibold"
              style={{ backgroundColor: canNext1 ? '#0D9488' : '#1F2937', color: canNext1 ? '#F9FAFB' : '#4B5563' }}>
              Next: Build →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Build ── */}
      {step === 2 && (
        <div className="rounded-xl p-8 flex flex-col items-center gap-6 text-center"
          style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="rounded-xl p-5 w-full text-left"
            style={{ backgroundColor: '#07080F', border: '1px solid #1F2937' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>Summary</p>
            <div className="text-sm space-y-1.5" style={{ color: '#9CA3AF' }}>
              <p><span style={{ color: '#F9FAFB' }}>Sources:</span>{' '}
                {[...sources.map(id => SOURCES.find(s => s.id === id)?.label ?? id), ...files].join(', ') || '—'}</p>
              <p><span style={{ color: '#F9FAFB' }}>Sections:</span> {sections.join(', ')}</p>
              <p><span style={{ color: '#F9FAFB' }}>Tone:</span> {tone}</p>
              {wikiName && <p><span style={{ color: '#F9FAFB' }}>Name:</span> {wikiName}</p>}
            </div>
          </div>

          {!building ? (
            <>
              <p className="text-sm" style={{ color: '#6B7280' }}>
                Lumio reads your sources, extracts content, and structures it into a complete wiki using Claude.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="rounded-lg px-5 py-2.5 text-sm font-medium"
                  style={{ border: '1px solid #1F2937', color: '#9CA3AF' }}>← Back</button>
                <button onClick={handleBuild} className="rounded-lg px-6 py-2.5 text-sm font-semibold"
                  style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>Build Wiki →</button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={32} style={{ color: '#0D9488' }} className="animate-spin" />
              <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>Building your wiki...</p>
              <div className="space-y-1 text-xs text-left" style={{ color: '#6B7280' }}>
                <p>✓ Reading sources</p>
                <p>✓ Extracting content</p>
                <p>↻ Structuring with Claude...</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Step 3: Review & Publish ── */}
      {step === 3 && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl p-6 flex flex-col gap-4"
            style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{wikiName || 'Company Wiki'} — Preview</p>
              <span className="text-xs px-2 py-0.5 rounded-md font-semibold"
                style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488' }}>Built ✓</span>
            </div>
            <pre className="rounded-lg p-5 text-xs leading-relaxed overflow-auto max-h-80"
              style={{ backgroundColor: '#07080F', border: '1px solid #1F2937', color: '#D1D5DB', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
              {MOCK_OUTPUT}
            </pre>
          </div>

          <div className="rounded-xl p-6 flex flex-col gap-4"
            style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Publish to</p>
            <div className="flex flex-wrap gap-2">
              {DESTINATIONS.map(d => (
                <button key={d.id} onClick={() => setDestination(d.id)}
                  className="rounded-lg px-4 py-2 text-sm font-medium transition-all"
                  style={{ backgroundColor: destination === d.id ? 'rgba(13,148,136,0.15)' : '#07080F', border: `1px solid ${destination === d.id ? '#0D9488' : '#1F2937'}`, color: destination === d.id ? '#0D9488' : '#9CA3AF' }}>
                  {d.label}
                </button>
              ))}
            </div>
            {!published ? (
              <button onClick={() => setPublished(true)}
                className="self-end rounded-lg px-6 py-2.5 text-sm font-semibold"
                style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
                Publish → {DESTINATIONS.find(d => d.id === destination)?.label}
              </button>
            ) : (
              <div className="flex items-center gap-2 self-end text-sm font-semibold" style={{ color: '#22C55E' }}>
                <Check size={16} /> Published to {DESTINATIONS.find(d => d.id === destination)?.label}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
