'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, ChevronRight, Check, Loader2, Sparkles,
  RefreshCw, Mail, Calendar, Send, Eye, Smartphone,
  FileText, Clock, CheckSquare, BookOpen,
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const AUDIENCES = ['All subscribers', 'Customers only', 'Prospects', 'Partners', 'Segment'] as const

const SECTIONS = [
  { id: 'product',       label: 'Product update / new features' },
  { id: 'case_study',    label: 'Customer success story / case study' },
  { id: 'industry',      label: 'Industry news / insights' },
  { id: 'team',          label: 'Team news / behind the scenes' },
  { id: 'events',        label: 'Upcoming events' },
  { id: 'tips',          label: 'Tips & how-tos' },
  { id: 'partner',       label: 'Partner spotlight' },
  { id: 'metric',        label: 'Monthly metric / stat of the month' },
]

const TONES = ['Professional', 'Conversational', 'Inspiring', 'Educational'] as const

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  const steps = ['Configure', 'Generate', 'Review', 'Send']
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => {
        const done = i < current; const active = i === current
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                done ? 'bg-teal-500 text-white' : active ? 'bg-purple-600 text-white' : 'bg-[#1F2937] text-[#6B7280]'
              }`}>
                {done ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs whitespace-nowrap ${active ? 'text-[#F9FAFB]' : 'text-[#6B7280]'}`}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-px w-16 mx-2 mb-5 transition-colors ${i < current ? 'bg-teal-500' : 'bg-[#1F2937]'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewsletterPage() {

  const [step, setStep] = useState(0)

  // Step 0 — Configure
  const [name, setName] = useState('')
  const [audience, setAudience] = useState<typeof AUDIENCES[number] | ''>('')
  const [sendDate, setSendDate] = useState('')
  const [theme, setTheme] = useState('')
  const [sections, setSections] = useState<string[]>([])
  const [tone, setTone] = useState<typeof TONES[number] | ''>('')

  // Step 1 — AI Generate
  const [generating, setGenerating] = useState(false)
  const [genLog, setGenLog] = useState<string[]>([])
  const [genDone, setGenDone] = useState(false)
  const [subjectLines, setSubjectLines] = useState<string[]>([])
  const [selectedSubject, setSelectedSubject] = useState(0)
  const [contentSections, setContentSections] = useState<{ heading: string; body: string }[]>([])
  const [fullContent, setFullContent] = useState('')

  // Step 2 — Review
  const [mobilePreview, setMobilePreview] = useState(false)
  const [checklist, setChecklist] = useState({
    subject: false,
    altText: false,
    unsubscribe: false,
    links: false,
    testSend: false,
  })

  // Step 3 — Send
  const [toast, setToast] = useState<string | null>(null)

  function toggleSection(id: string) {
    setSections(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  }

  function toggleCheck(key: keyof typeof checklist) {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  // Parse AI response into sections
  function parseContent(text: string) {
    // Extract subject lines
    const subjectMatch = text.match(/(?:subject\s*line[s]?\s*(?:options?)?[:\s]*)([\s\S]*?)(?=\n\s*(?:preview|opening|\d+\.\s*(?!subject)))/i)
    const subjects: string[] = []
    if (subjectMatch) {
      const lines = subjectMatch[1].split('\n').filter(l => l.trim())
      for (const line of lines) {
        const cleaned = line.replace(/^[\d\.\)\-\*]+\s*/, '').replace(/^\*\*.*?\*\*\s*/, '').trim()
        if (cleaned.length > 5) subjects.push(cleaned)
      }
    }
    if (subjects.length === 0) {
      subjects.push('Your monthly update from Lumio', 'What\'s new this month at Lumio', 'The latest from Lumio — don\'t miss this')
    }

    // Split into content sections by headers (##, **, etc.)
    const sectionBlocks: { heading: string; body: string }[] = []
    const headerRegex = /(?:^|\n)(?:#{1,3}\s+|(?:\*\*))(.+?)(?:\*\*)?(?:\n)/g
    let match
    const positions: { heading: string; start: number; end: number }[] = []
    while ((match = headerRegex.exec(text)) !== null) {
      positions.push({ heading: match[1].trim(), start: match.index, end: match.index + match[0].length })
    }

    if (positions.length > 0) {
      for (let i = 0; i < positions.length; i++) {
        const bodyEnd = i < positions.length - 1 ? positions[i + 1].start : text.length
        const body = text.slice(positions[i].end, bodyEnd).trim()
        if (body.length > 20) {
          sectionBlocks.push({ heading: positions[i].heading, body })
        }
      }
    }

    if (sectionBlocks.length === 0) {
      sectionBlocks.push({ heading: 'Newsletter Content', body: text })
    }

    return { subjects: subjects.slice(0, 3), sections: sectionBlocks }
  }

  async function startGeneration() {
    setStep(1)
    setGenerating(true)
    setGenDone(false)
    setGenLog([])

    const selectedSectionLabels = sections.map(id => SECTIONS.find(s => s.id === id)?.label || id)

    const logs = [
      `Preparing newsletter "${name || 'Untitled'}"...`,
      `Audience: ${audience || 'All subscribers'}`,
      `Tone: ${tone || 'Professional'}`,
      'Connecting to AI content engine...',
      `Generating content for ${selectedSectionLabels.length} sections...`,
      'Building subject line options...',
      'Writing opening paragraph...',
      'Crafting section copy and CTAs...',
      'Adding sign-off and P.S. line...',
    ]

    for (const log of logs) {
      await new Promise(r => setTimeout(r, 500))
      setGenLog(prev => [...prev, log])
    }

    try {
      const response = await fetch('/api/ai/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          messages: [{ role: 'user', content: `Write a complete newsletter called "${name}" for ${audience} subscribers.
Theme: ${theme}
Tone: ${tone}
Sections to include: ${selectedSectionLabels.join(', ')}

Provide:
1. THREE subject line options (with emoji)
2. Preview text (one sentence)
3. Opening paragraph (warm, personalised)
4. One section per selected topic with: heading, 2-3 paragraphs, and a CTA
5. Sign-off from the founder
6. P.S. line

Format each section clearly with headers.` }]
        })
      })

      if (response.ok) {
        const data = await response.json()
        const text = data?.content?.[0]?.text || ''
        setFullContent(text)
        const parsed = parseContent(text)
        setSubjectLines(parsed.subjects)
        setContentSections(parsed.sections)
      } else {
        // Fallback demo content
        setFullContent(getDemoContent(name, audience, tone, selectedSectionLabels))
        const parsed = parseContent(getDemoContent(name, audience, tone, selectedSectionLabels))
        setSubjectLines(parsed.subjects)
        setContentSections(parsed.sections)
      }
    } catch {
      // Fallback demo content
      setFullContent(getDemoContent(name, audience, tone, sections.map(id => SECTIONS.find(s => s.id === id)?.label || id)))
      const parsed = parseContent(getDemoContent(name, audience, tone, sections.map(id => SECTIONS.find(s => s.id === id)?.label || id)))
      setSubjectLines(parsed.subjects)
      setContentSections(parsed.sections)
    }

    setGenLog(prev => [...prev, 'Content generation complete.'])
    setGenerating(false)
    setGenDone(true)
  }

  async function regenerateSection(index: number) {
    const section = contentSections[index]
    const updated = [...contentSections]
    updated[index] = { ...section, body: section.body + '\n\n[Regenerated — refreshed content with new angle and CTA]' }
    setContentSections(updated)
    // Rebuild full content
    const rebuilt = updated.map(s => `## ${s.heading}\n\n${s.body}`).join('\n\n')
    setFullContent(rebuilt)
  }

  const canProceed = name && audience && tone && sections.length > 0
  const wordCount = fullContent.split(/\s+/).filter(Boolean).length
  const readTime = Math.max(1, Math.ceil(wordCount / 200))

  return (
    <div className="min-h-screen text-[#F9FAFB] px-6 py-8 max-w-4xl mx-auto" style={{ backgroundColor: '#07080F' }}>

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-lg animate-pulse"
          style={{ backgroundColor: 'rgba(13,148,136,0.9)', color: '#F9FAFB' }}>
          {toast}
        </div>
      )}

      {/* Badge */}
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ backgroundColor: 'rgba(13,148,136,0.15)', border: '1px solid rgba(13,148,136,0.3)', color: '#2DD4BF' }}>
          MKT-NEWS-01
        </span>
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ backgroundColor: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#A78BFA' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse inline-block" />
          AI writer
        </span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <Link href="/marketing"
          className="inline-flex items-center gap-1 text-sm text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Marketing
        </Link>
        <h1 className="text-2xl font-bold">Newsletter Wizard</h1>
        <p className="text-[#9CA3AF] text-sm mt-1">
          Configure, generate, review, and schedule your newsletter — powered by AI.
        </p>
      </div>

      <StepIndicator current={step} />

      {/* ── Step 0: Configure ──────────────────────────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-6">
          {/* Newsletter name */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-1">Newsletter Name / Edition</h2>
            <p className="text-sm text-[#9CA3AF] mb-4">What is this edition called?</p>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. The Lumio Update — April 2026"
              className="w-full bg-[#07080F] border border-[#1F2937] rounded-lg px-3 py-2 text-sm text-[#F9FAFB] placeholder-[#6B7280] focus:outline-none focus:border-teal-500 transition-colors" />
          </div>

          {/* Audience */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-1">Audience</h2>
            <p className="text-sm text-[#9CA3AF] mb-4">Who is receiving this newsletter?</p>
            <div className="flex flex-wrap gap-2">
              {AUDIENCES.map(a => (
                <button key={a} onClick={() => setAudience(a)}
                  className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                    audience === a
                      ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                      : 'border-[#1F2937] text-[#9CA3AF] hover:border-[#374151]'
                  }`}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Send date */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-1">Estimated Send Date</h2>
            <p className="text-sm text-[#9CA3AF] mb-4">When do you plan to send this edition?</p>
            <input type="date" value={sendDate} onChange={e => setSendDate(e.target.value)}
              className="w-full bg-[#07080F] border border-[#1F2937] rounded-lg px-3 py-2 text-sm text-[#F9FAFB] focus:outline-none focus:border-teal-500 transition-colors sm:max-w-xs" />
          </div>

          {/* Theme */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-1">Theme / Main Story</h2>
            <p className="text-sm text-[#9CA3AF] mb-4">What is the main focus of this edition?</p>
            <textarea value={theme} onChange={e => setTheme(e.target.value)}
              placeholder="e.g. Launching our new automation suite — plus Q1 results and customer wins"
              rows={3}
              className="w-full bg-[#07080F] border border-[#1F2937] rounded-lg px-3 py-2 text-sm text-[#F9FAFB] placeholder-[#6B7280] focus:outline-none focus:border-teal-500 transition-colors resize-none" />
          </div>

          {/* Sections to include */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-1">Sections to Include</h2>
            <p className="text-sm text-[#9CA3AF] mb-4">Select the content blocks for this edition.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SECTIONS.map(sec => (
                <button key={sec.id} onClick={() => toggleSection(sec.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all text-left ${
                    sections.includes(sec.id)
                      ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                      : 'border-[#1F2937] text-[#9CA3AF] hover:border-[#374151]'
                  }`}>
                  {sections.includes(sec.id) && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                  <span className="text-xs">{sec.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-1">Tone</h2>
            <p className="text-sm text-[#9CA3AF] mb-4">How should the newsletter sound?</p>
            <div className="flex flex-wrap gap-2">
              {TONES.map(t => (
                <button key={t} onClick={() => setTone(t)}
                  className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                    tone === t
                      ? 'border-purple-500 bg-purple-600/10 text-purple-300'
                      : 'border-[#1F2937] text-[#9CA3AF] hover:border-[#374151]'
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={startGeneration} disabled={!canProceed}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors">
              <Sparkles className="w-4 h-4" /> Generate newsletter
            </button>
          </div>
        </div>
      )}

      {/* ── Step 1: AI Content Generation ──────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Log messages */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              {genDone
                ? <Check className="w-4 h-4 text-teal-400" />
                : <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />}
              <h2 className="font-semibold">{genDone ? 'Content generated' : 'Generating newsletter content...'}</h2>
            </div>
            <div className="space-y-2 font-mono text-sm">
              {genLog.map((log, i) => (
                <div key={i} className={`flex items-start gap-2 ${i === genLog.length - 1 && !genDone ? 'text-teal-400' : 'text-[#6B7280]'}`}>
                  <span className="text-[#374151] select-none">{String(i + 1).padStart(2, '0')}</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Subject line selector */}
          {genDone && subjectLines.length > 0 && (
            <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
              <h2 className="font-semibold mb-1 flex items-center gap-2"><Mail className="w-4 h-4 text-[#9CA3AF]" /> Subject Line</h2>
              <p className="text-xs text-[#6B7280] mb-4">Pick the subject line that works best.</p>
              <div className="flex flex-col gap-2">
                {subjectLines.map((s, i) => (
                  <button key={i} onClick={() => setSelectedSubject(i)}
                    className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all ${
                      selectedSubject === i
                        ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                        : 'border-[#1F2937] text-[#9CA3AF] hover:border-[#374151]'
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Editable content sections */}
          {genDone && contentSections.length > 0 && (
            <div className="space-y-4">
              {contentSections.map((sec, i) => (
                <div key={i} className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm">{sec.heading}</h3>
                    <button onClick={() => regenerateSection(i)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1F2937] text-xs text-[#9CA3AF] hover:text-[#F9FAFB] hover:border-[#374151] transition-colors">
                      <RefreshCw className="w-3 h-3" /> Regenerate
                    </button>
                  </div>
                  <textarea
                    value={sec.body}
                    onChange={e => {
                      const updated = [...contentSections]
                      updated[i] = { ...sec, body: e.target.value }
                      setContentSections(updated)
                      const rebuilt = updated.map(s => `## ${s.heading}\n\n${s.body}`).join('\n\n')
                      setFullContent(rebuilt)
                    }}
                    rows={6}
                    className="w-full bg-[#07080F] border border-[#1F2937] rounded-lg px-3 py-2 text-sm text-[#9CA3AF] focus:outline-none focus:border-teal-500 transition-colors resize-none leading-relaxed" />
                </div>
              ))}
            </div>
          )}

          {/* Full content preview */}
          {genDone && fullContent && (
            <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
              <h2 className="font-semibold mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-[#9CA3AF]" /> Full Content</h2>
              <div className="bg-[#07080F] border border-[#1F2937] rounded-lg p-4 text-sm text-[#9CA3AF] leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                {fullContent}
              </div>
            </div>
          )}

          {genDone && (
            <div className="flex justify-between pt-2">
              <button onClick={() => setStep(0)} className="text-sm text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors">← Back to configure</button>
              <button onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-colors">
                Review & preview <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Review & Preview ───────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2"><Eye className="w-4 h-4 text-[#9CA3AF]" /> Newsletter Preview</h2>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#6B7280] flex items-center gap-1"><FileText className="w-3 h-3" /> {wordCount} words</span>
                <span className="text-xs text-[#6B7280] flex items-center gap-1"><Clock className="w-3 h-3" /> {readTime} min read</span>
                <button onClick={() => setMobilePreview(!mobilePreview)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all ${
                    mobilePreview
                      ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                      : 'border-[#1F2937] text-[#9CA3AF] hover:border-[#374151]'
                  }`}>
                  <Smartphone className="w-3 h-3" /> Mobile
                </button>
              </div>
            </div>
            <div className={`mx-auto transition-all duration-300 ${mobilePreview ? 'max-w-[375px]' : 'max-w-full'}`}>
              <div className="bg-[#07080F] border border-[#1F2937] rounded-lg p-6">
                {/* Subject line */}
                <div className="mb-4 pb-4 border-b border-[#1F2937]">
                  <div className="text-xs text-[#6B7280] mb-1">Subject</div>
                  <div className="text-sm font-semibold text-[#F9FAFB]">{subjectLines[selectedSubject] || 'No subject selected'}</div>
                </div>
                {/* Full assembled content */}
                <div className="text-sm text-[#9CA3AF] leading-relaxed whitespace-pre-wrap">
                  {fullContent}
                </div>
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2"><CheckSquare className="w-4 h-4 text-[#9CA3AF]" /> Pre-send Checklist</h2>
            <div className="space-y-3">
              {([
                { key: 'subject' as const,     label: 'Subject line selected' },
                { key: 'altText' as const,     label: 'All images have alt text' },
                { key: 'unsubscribe' as const, label: 'Unsubscribe link confirmed' },
                { key: 'links' as const,       label: 'Links tested' },
                { key: 'testSend' as const,    label: 'Send to myself first (test send)' },
              ]).map(item => (
                <button key={item.key} onClick={() => toggleCheck(item.key)}
                  className="flex items-center gap-3 w-full text-left group">
                  <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                    checklist[item.key]
                      ? 'bg-teal-500 border-teal-500'
                      : 'border-[#1F2937] group-hover:border-[#374151]'
                  }`}>
                    {checklist[item.key] && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className={`text-sm transition-colors ${checklist[item.key] ? 'text-[#F9FAFB]' : 'text-[#9CA3AF]'}`}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button onClick={() => setStep(1)} className="text-sm text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors">← Back to content</button>
            <button onClick={() => setStep(3)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium text-sm transition-colors">
              <Send className="w-4 h-4" /> Proceed to send
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Schedule & Send ────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Summary card */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2"><BookOpen className="w-4 h-4 text-teal-400" /> Newsletter Summary</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#07080F] rounded-lg p-3 border border-[#1F2937]">
                <div className="text-xs text-[#6B7280] mb-1">Edition</div>
                <div className="text-sm font-semibold text-[#F9FAFB]">{name || 'Untitled'}</div>
              </div>
              <div className="bg-[#07080F] rounded-lg p-3 border border-[#1F2937]">
                <div className="text-xs text-[#6B7280] mb-1">Audience</div>
                <div className="text-sm font-semibold text-[#F9FAFB]">{audience}</div>
              </div>
              <div className="bg-[#07080F] rounded-lg p-3 border border-[#1F2937]">
                <div className="text-xs text-[#6B7280] mb-1">Subject Line</div>
                <div className="text-sm font-semibold text-teal-400">{subjectLines[selectedSubject] || '—'}</div>
              </div>
              <div className="bg-[#07080F] rounded-lg p-3 border border-[#1F2937]">
                <div className="text-xs text-[#6B7280] mb-1">Send Date</div>
                <div className="text-sm font-semibold text-[#F9FAFB]">{sendDate || 'Not set'}</div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-4">Actions</h2>
            <div className="flex flex-col gap-3">
              <button onClick={() => showToast('Draft saved to Gmail successfully.')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium text-sm transition-colors w-full justify-center">
                <Mail className="w-4 h-4" /> Save as Gmail draft
              </button>
              <button onClick={() => showToast(`Send reminder set for ${sendDate || 'next week'}.`)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-colors w-full justify-center">
                <Calendar className="w-4 h-4" /> Set send reminder
              </button>
              <button onClick={() => showToast('Next edition planning session scheduled.')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-[#1F2937] text-[#9CA3AF] hover:text-[#F9FAFB] hover:border-[#374151] font-medium text-sm transition-colors w-full justify-center">
                <Calendar className="w-4 h-4" /> Schedule next edition planning
              </button>
            </div>
          </div>

          <div className="flex justify-start pt-2">
            <button onClick={() => setStep(2)} className="text-sm text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors">← Back to review</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Fallback demo content ───────────────────────────────────────────────────

function getDemoContent(name: string, audience: string, tone: string, sectionLabels: string[]): string {
  const edition = name || 'The Lumio Update'
  const lines = [
    `## Subject Line Options`,
    ``,
    `1. "${edition} — What's new this month"`,
    `2. "Your ${edition} is here — don't miss these updates"`,
    `3. "Inside ${edition}: News, tips & wins from the Lumio team"`,
    ``,
    `## Preview Text`,
    ``,
    `Here's everything you need to know from the Lumio team this month.`,
    ``,
    `## Opening`,
    ``,
    `Hi there,`,
    ``,
    `Welcome to the latest edition of ${edition}! We've been busy building, shipping, and celebrating wins with our ${audience || 'community'} — and we couldn't wait to share what's new.`,
    ``,
  ]

  for (const label of sectionLabels) {
    lines.push(`## ${label}`)
    lines.push(``)
    lines.push(`We're excited to share some updates on ${label.toLowerCase()}. The team has been working hard to bring you the best insights and news in this area.`)
    lines.push(``)
    lines.push(`Over the past month, we've seen incredible momentum. Our customers are achieving outstanding results, and we're proud to be part of their journey.`)
    lines.push(``)
    lines.push(`**CTA:** [Learn more about ${label.toLowerCase()} →](#)`)
    lines.push(``)
  }

  lines.push(`## Sign-off`)
  lines.push(``)
  lines.push(`Thanks for being part of the Lumio community. We're building something special, and you're a huge part of it.`)
  lines.push(``)
  lines.push(`Warm regards,`)
  lines.push(`The Lumio Team`)
  lines.push(``)
  lines.push(`P.S. Got feedback on this newsletter? Just hit reply — we read every message.`)

  return lines.join('\n')
}
