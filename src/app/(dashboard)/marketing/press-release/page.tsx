'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, ChevronRight, Check, Loader2, Sparkles,
  FileText, Send, Calendar, Bell, Mail, X,
  Linkedin, Twitter, Facebook, Instagram,
  ClipboardCheck, Eye
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const ANNOUNCEMENT_TYPES = [
  { id: 'product_launch', label: 'Product launch',    emoji: '🚀' },
  { id: 'partnership',    label: 'Partnership',        emoji: '🤝' },
  { id: 'funding',        label: 'Funding',            emoji: '💰' },
  { id: 'award',          label: 'Award',              emoji: '🏆' },
  { id: 'expansion',      label: 'Expansion',          emoji: '🌍' },
  { id: 'research',       label: 'Research/report',    emoji: '📊' },
  { id: 'executive_hire', label: 'Executive hire',     emoji: '👤' },
  { id: 'milestone',      label: 'Milestone',          emoji: '🎯' },
]

const GEO_OPTIONS = [
  { id: 'uk',     label: 'UK' },
  { id: 'usa',    label: 'USA' },
  { id: 'global', label: 'Global' },
  { id: 'europe', label: 'Europe' },
  { id: 'other',  label: 'Other' },
]

const WRITING_LOGS = [
  'Crafting your press release headline…',
  'Structuring inverted pyramid narrative…',
  'Generating executive quotes…',
  'Writing boilerplate and notes to editors…',
  'Creating social media derivatives…',
  'Drafting journalist pitch email…',
  'Press release ready.',
]

const REVIEW_CHECKLIST_ITEMS = [
  'Headline is newsworthy (not just promotional)',
  'All facts verified',
  'Quotes approved by named individuals',
  'Legal review completed (if funding/partnership)',
  'Embargo date confirmed with all parties',
]

const RESULT_TABS = [
  { id: 'press_release',    label: 'Press Release' },
  { id: 'headlines',        label: 'Headlines' },
  { id: 'social_posts',     label: 'Social Posts' },
  { id: 'journalist_pitch', label: 'Journalist Pitch' },
]

// ─── Step Indicator ──────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  const steps = ['Story', 'Write', 'Review', 'Distribute']
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                done   ? 'bg-teal-500 text-white' :
                active ? 'bg-purple-600 text-white' :
                         'bg-[#1F2937] text-[#6B7280]'
              }`}>
                {done ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs whitespace-nowrap ${active ? 'text-[#F9FAFB]' : 'text-[#6B7280]'}`}>
                {label}
              </span>
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

// ─── Toast ───────────────────────────────────────────────────────────────────

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 bg-teal-600 text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-4">
      <Check className="w-4 h-4" />
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PressReleasePage() {
  const [step, setStep] = useState(0)

  // Step 0 — Story Details
  const [announcementType, setAnnouncementType] = useState('')
  const [headline, setHeadline]                 = useState('')
  const [facts, setFacts]                       = useState('')
  const [whyMatters, setWhyMatters]             = useState('')
  const [quoteName, setQuoteName]               = useState('')
  const [quoteTitle, setQuoteTitle]             = useState('')
  const [partnerName, setPartnerName]           = useState('')
  const [partnerTitle, setPartnerTitle]         = useState('')
  const [stats, setStats]                       = useState('')
  const [noEmbargo, setNoEmbargo]               = useState(false)
  const [embargoDate, setEmbargoDate]           = useState('')
  const [targetPubs, setTargetPubs]             = useState('')
  const [geography, setGeography]               = useState('')

  // Step 1 — AI Writing
  const [writingLog, setWritingLog]             = useState<string[]>([])
  const [writingDone, setWritingDone]           = useState(false)
  const [activeResultTab, setActiveResultTab]   = useState('press_release')
  const [pressReleaseText, setPressReleaseText] = useState('')
  const [altHeadlines, setAltHeadlines]         = useState<string[]>([])
  const [socialPosts, setSocialPosts]           = useState<Record<string, string>>({
    linkedin: '', twitter1: '', twitter2: '', facebook: '', instagram: ''
  })
  const [journalistPitch, setJournalistPitch]   = useState('')

  // Step 2 — Review
  const [checklist, setChecklist] = useState<boolean[]>(new Array(REVIEW_CHECKLIST_ITEMS.length).fill(false))

  // Toast
  const [toast, setToast] = useState<string | null>(null)

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  function toggleCheck(idx: number) {
    setChecklist(prev => {
      const next = [...prev]
      next[idx] = !next[idx]
      return next
    })
  }

  const selectedType = ANNOUNCEMENT_TYPES.find(t => t.id === announcementType)
  const resolvedEmbargo = noEmbargo ? '' : embargoDate
  const canProceedStep0 = announcementType && headline && facts && whyMatters && quoteName && quoteTitle && geography

  // ── Parse API response into sections ────────────────────────────────────────

  function parseResponse(text: string) {
    const sections: Record<string, string> = {
      press_release: '',
      headlines: '',
      social_posts: '',
      journalist_pitch: '',
    }

    const markers = [
      { key: 'press_release',    start: 'PRESS RELEASE',      end: 'ALTERNATIVE HEADLINES' },
      { key: 'headlines',        start: 'ALTERNATIVE HEADLINES', end: 'SOCIAL POSTS' },
      { key: 'social_posts',    start: 'SOCIAL POSTS',        end: 'JOURNALIST PITCH' },
      { key: 'journalist_pitch', start: 'JOURNALIST PITCH',   end: null },
    ]

    for (const m of markers) {
      const startIdx = text.indexOf(m.start)
      if (startIdx === -1) continue
      const contentStart = startIdx + m.start.length
      const endIdx = m.end ? text.indexOf(m.end, contentStart) : text.length
      sections[m.key] = text.substring(contentStart, endIdx === -1 ? text.length : endIdx).trim()
    }

    // If parsing didn't find sections, put everything in press_release
    if (!sections.press_release && text) {
      sections.press_release = text
    }

    return sections
  }

  function parseHeadlines(text: string): string[] {
    const lines = text.split('\n').filter(l => l.trim())
    return lines
      .map(l => l.replace(/^\d+[\.\)]\s*/, '').replace(/^\*\*/, '').replace(/\*\*$/, '').replace(/^[""]|[""]$/g, '').trim())
      .filter(l => l.length > 10)
      .slice(0, 3)
  }

  function parseSocialPosts(text: string): Record<string, string> {
    const result: Record<string, string> = { linkedin: '', twitter1: '', twitter2: '', facebook: '', instagram: '' }
    const lower = text.toLowerCase()

    const extractBlock = (label: string, nextLabels: string[]): string => {
      const idx = lower.indexOf(label)
      if (idx === -1) return ''
      const start = idx + label.length
      let end = text.length
      for (const nl of nextLabels) {
        const ni = lower.indexOf(nl, start)
        if (ni !== -1 && ni < end) end = ni
      }
      return text.substring(start, end).replace(/^[\s:—\-\n]+/, '').trim()
    }

    result.linkedin = extractBlock('linkedin', ['twitter', 'facebook', 'instagram'])
    const twitterBlock = extractBlock('twitter', ['facebook', 'instagram'])
    // Split twitter into two posts if possible
    const twitterParts = twitterBlock.split(/\n\n+/).filter(p => p.trim())
    result.twitter1 = twitterParts[0] || twitterBlock
    result.twitter2 = twitterParts[1] || ''
    result.facebook = extractBlock('facebook', ['instagram'])
    result.instagram = extractBlock('instagram', [])

    return result
  }

  // ── AI Writing ──────────────────────────────────────────────────────────────

  async function startWriting() {
    setStep(1)
    setWritingLog([])
    setWritingDone(false)
    setPressReleaseText('')
    setAltHeadlines([])
    setJournalistPitch('')
    setSocialPosts({ linkedin: '', twitter1: '', twitter2: '', facebook: '', instagram: '' })

    for (const log of WRITING_LOGS) {
      await new Promise(r => setTimeout(r, 700))
      setWritingLog(prev => [...prev, log])
    }

    const typeLabel = selectedType?.label ?? announcementType

    try {
      const response = await fetch('/api/ai/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          messages: [{ role: 'user', content: `Write a professional press release for a ${typeLabel}.

Headline: ${headline}
Key facts: ${facts}
Why it matters: ${whyMatters}
Stats: ${stats}
Quote from ${quoteName}, ${quoteTitle}: [Generate a compelling quote]
${partnerName ? `Also include a quote from ${partnerName}, ${partnerTitle}` : ''}
Geographic focus: ${geography}
${resolvedEmbargo ? `EMBARGOED UNTIL ${resolvedEmbargo}` : 'FOR IMMEDIATE RELEASE'}

Format as a proper press release with:
- ${resolvedEmbargo ? `EMBARGOED UNTIL ${resolvedEmbargo}` : 'FOR IMMEDIATE RELEASE'}
- Headline (bold, compelling, punchy)
- Sub-headline
- Dateline
- 5-6 paragraphs following inverted pyramid
- Both quotes integrated naturally
- Boilerplate about Lumio Ltd
- ### (end marker)
- Notes to editors
- Contact information placeholder

Also provide:
- THREE alternative headline options
- Five social media posts (1 LinkedIn, 2 Twitter, 1 Facebook, 1 Instagram)
- Email pitch template for journalists

Separate each section with clear headers: PRESS RELEASE, ALTERNATIVE HEADLINES, SOCIAL POSTS, JOURNALIST PITCH` }]
        })
      })

      if (response.ok) {
        const data = await response.json()
        const text = data.content?.[0]?.text ?? data.content ?? ''
        const raw = typeof text === 'string' ? text : JSON.stringify(text)
        const sections = parseResponse(raw)

        setPressReleaseText(sections.press_release)
        setAltHeadlines(parseHeadlines(sections.headlines))
        setSocialPosts(parseSocialPosts(sections.social_posts))
        setJournalistPitch(sections.journalist_pitch)
      } else {
        applyFallback()
      }
    } catch {
      applyFallback()
    }

    setWritingDone(true)
  }

  function applyFallback() {
    const typeLabel = selectedType?.label ?? announcementType
    const release = resolvedEmbargo ? `EMBARGOED UNTIL ${resolvedEmbargo}` : 'FOR IMMEDIATE RELEASE'

    setPressReleaseText(`${release}

${headline.toUpperCase()}

${typeLabel} signals new chapter for Lumio Ltd

LONDON, ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} — ${facts}

${whyMatters}

"${headline} represents a significant milestone for our organisation," said ${quoteName}, ${quoteTitle}. "We are excited about the opportunities this creates for our team, our customers, and the broader market."

${partnerName ? `"We are delighted to be part of this announcement," said ${partnerName}, ${partnerTitle}. "The collaboration with Lumio Ltd aligns perfectly with our strategic vision."` : ''}

Key figures underscore the significance of this announcement: ${stats || 'Details to be confirmed.'}

About Lumio Ltd
Lumio Ltd is a technology company focused on delivering innovative solutions. For more information, visit lumio.co.uk.

###

Notes to Editors:
1. For further information, interviews, or images, please contact the Lumio press office.
2. High-resolution images and logos are available on request.

Media Contact:
Press Office, Lumio Ltd
Email: press@lumio.co.uk
Phone: +44 (0)20 XXXX XXXX`)

    setAltHeadlines([
      `${selectedType?.emoji ?? ''} ${headline} — A new era for Lumio`,
      `Lumio announces ${typeLabel.toLowerCase()}: "${headline}"`,
      `Breaking: ${headline} — what it means for the industry`,
    ])

    setSocialPosts({
      linkedin: `We are thrilled to announce: ${headline}\n\n${whyMatters}\n\nRead the full press release on our website.\n\n#Lumio #PressRelease #${typeLabel.replace(/[\s/]+/g, '')}`,
      twitter1: `${selectedType?.emoji ?? '📢'} Big news: ${headline}\n\nMore details: [link]\n\n#Lumio`,
      twitter2: `"${headline}" — exciting times at Lumio.\n\n${stats ? `Key stat: ${stats.split('\n')[0]}` : ''}\n\n#${typeLabel.replace(/[\s/]+/g, '')}`,
      facebook: `${selectedType?.emoji ?? '📢'} Exciting announcement!\n\n${headline}\n\n${whyMatters}\n\nRead more on our website.`,
      instagram: `${selectedType?.emoji ?? '✨'} ${headline}\n\n${whyMatters}\n\n#Lumio #News #${typeLabel.replace(/[\s/]+/g, '')} #Announcement`,
    })

    setJournalistPitch(`Subject: ${release === 'FOR IMMEDIATE RELEASE' ? '' : `[EMBARGOED] `}Story Pitch: ${headline}

Hi [Journalist Name],

I hope this finds you well. I am reaching out because I believe the following story would be of interest to your readers.

${headline}

${whyMatters}

Key facts:
${facts}

${stats ? `Notable statistics:\n${stats}` : ''}

I have attached the full press release for your reference and would be happy to arrange an interview with ${quoteName}, ${quoteTitle}${partnerName ? `, or ${partnerName}, ${partnerTitle}` : ''}.

Would you be interested in covering this? I am available to discuss further at your convenience.

Best regards,
Press Office
Lumio Ltd
press@lumio.co.uk`)
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#07080F] text-[#F9FAFB] py-10 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Back link & header */}
        <Link href="/marketing" className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#F9FAFB] transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Marketing
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">Press Release Wizard</h1>
          <span className="text-xs font-mono bg-[#1F2937] text-[#9CA3AF] px-2 py-0.5 rounded">MKT-PR-01</span>
          <span className="text-xs bg-purple-600/20 text-purple-400 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> AI writer
          </span>
        </div>

        <p className="text-sm text-[#6B7280] mb-8">Create, refine, and distribute professional press releases.</p>

        <StepIndicator current={step} />

        {/* ═══════════════════════════════════════════════════════════════════════
            STEP 0 — Story Details
        ═══════════════════════════════════════════════════════════════════════ */}
        {step === 0 && (
          <div className="space-y-6">
            <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6 space-y-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-400" />
                Story Details
              </h2>

              {/* Announcement type */}
              <div>
                <label className="block text-sm font-medium text-[#9CA3AF] mb-2">Announcement type</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ANNOUNCEMENT_TYPES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setAnnouncementType(t.id)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all text-left ${
                        announcementType === t.id
                          ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                          : 'border-[#1F2937] bg-[#07080F] text-[#9CA3AF] hover:border-[#374151]'
                      }`}
                    >
                      {t.emoji} {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Headline */}
              <div>
                <label className="block text-sm font-medium text-[#9CA3AF] mb-1">Headline / working title</label>
                <input
                  type="text"
                  value={headline}
                  onChange={e => setHeadline(e.target.value)}
                  placeholder="e.g. Lumio launches AI-powered analytics platform"
                  className="w-full bg-[#07080F] border border-[#1F2937] rounded-lg px-4 py-2.5 text-sm text-[#F9FAFB] placeholder:text-[#4B5563] focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
                />
              </div>

              {/* What happened */}
              <div>
                <label className="block text-sm font-medium text-[#9CA3AF] mb-1">What happened</label>
                <textarea
                  value={facts}
                  onChange={e => setFacts(e.target.value)}
                  rows={3}
                  placeholder="Key facts and details of the announcement…"
                  className="w-full bg-[#07080F] border border-[#1F2937] rounded-lg px-4 py-2.5 text-sm text-[#F9FAFB] placeholder:text-[#4B5563] focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors resize-none"
                />
              </div>

              {/* Why it matters */}
              <div>
                <label className="block text-sm font-medium text-[#9CA3AF] mb-1">Why it matters</label>
                <textarea
                  value={whyMatters}
                  onChange={e => setWhyMatters(e.target.value)}
                  rows={3}
                  placeholder="Significance, impact, what this means for the industry…"
                  className="w-full bg-[#07080F] border border-[#1F2937] rounded-lg px-4 py-2.5 text-sm text-[#F9FAFB] placeholder:text-[#4B5563] focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors resize-none"
                />
              </div>

              {/* Quote from */}
              <div>
                <label className="block text-sm font-medium text-[#9CA3AF] mb-1">Quote from</label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={quoteName}
                    onChange={e => setQuoteName(e.target.value)}
                    placeholder="Name, e.g. Arron Margeison"
                    className="w-full bg-[#07080F] border border-[#1F2937] rounded-lg px-4 py-2.5 text-sm text-[#F9FAFB] placeholder:text-[#4B5563] focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
                  />
                  <input
                    type="text"
                    value={quoteTitle}
                    onChange={e => setQuoteTitle(e.target.value)}
                    placeholder="Title, e.g. Founder of Lumio"
                    className="w-full bg-[#07080F] border border-[#1F2937] rounded-lg px-4 py-2.5 text-sm text-[#F9FAFB] placeholder:text-[#4B5563] focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Quote from partner (optional) */}
              <div>
                <label className="block text-sm font-medium text-[#9CA3AF] mb-1">Quote from partner/customer <span className="text-[#4B5563]">(optional)</span></label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={partnerName}
                    onChange={e => setPartnerName(e.target.value)}
                    placeholder="Name"
                    className="w-full bg-[#07080F] border border-[#1F2937] rounded-lg px-4 py-2.5 text-sm text-[#F9FAFB] placeholder:text-[#4B5563] focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
                  />
                  <input
                    type="text"
                    value={partnerTitle}
                    onChange={e => setPartnerTitle(e.target.value)}
                    placeholder="Title"
                    className="w-full bg-[#07080F] border border-[#1F2937] rounded-lg px-4 py-2.5 text-sm text-[#F9FAFB] placeholder:text-[#4B5563] focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Key stats */}
              <div>
                <label className="block text-sm font-medium text-[#9CA3AF] mb-1">Key stats / numbers to include</label>
                <textarea
                  value={stats}
                  onChange={e => setStats(e.target.value)}
                  rows={2}
                  placeholder="e.g. 300% revenue growth, 50,000 users, Series A of £5M…"
                  className="w-full bg-[#07080F] border border-[#1F2937] rounded-lg px-4 py-2.5 text-sm text-[#F9FAFB] placeholder:text-[#4B5563] focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors resize-none"
                />
              </div>

              {/* Embargo date */}
              <div>
                <label className="block text-sm font-medium text-[#9CA3AF] mb-1">Embargo date</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-[#9CA3AF] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={noEmbargo}
                      onChange={e => setNoEmbargo(e.target.checked)}
                      className="w-4 h-4 rounded border-[#1F2937] bg-[#07080F] text-teal-500 focus:ring-teal-500 accent-teal-500"
                    />
                    No embargo — immediate release
                  </label>
                  {!noEmbargo && (
                    <input
                      type="date"
                      value={embargoDate}
                      onChange={e => setEmbargoDate(e.target.value)}
                      className="bg-[#07080F] border border-[#1F2937] rounded-lg px-4 py-2.5 text-sm text-[#F9FAFB] focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
                    />
                  )}
                </div>
              </div>

              {/* Target publications */}
              <div>
                <label className="block text-sm font-medium text-[#9CA3AF] mb-1">Target publications</label>
                <input
                  type="text"
                  value={targetPubs}
                  onChange={e => setTargetPubs(e.target.value)}
                  placeholder="e.g. TechCrunch, BBC News, SaaS Weekly"
                  className="w-full bg-[#07080F] border border-[#1F2937] rounded-lg px-4 py-2.5 text-sm text-[#F9FAFB] placeholder:text-[#4B5563] focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
                />
              </div>

              {/* Geographic focus */}
              <div>
                <label className="block text-sm font-medium text-[#9CA3AF] mb-2">Geographic focus</label>
                <div className="flex flex-wrap gap-2">
                  {GEO_OPTIONS.map(g => (
                    <button
                      key={g.id}
                      onClick={() => setGeography(g.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                        geography === g.id
                          ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                          : 'border-[#1F2937] bg-[#07080F] text-[#9CA3AF] hover:border-[#374151]'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Next button */}
            <div className="flex justify-end">
              <button
                disabled={!canProceedStep0}
                onClick={startWriting}
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  canProceedStep0
                    ? 'bg-teal-500 hover:bg-teal-400 text-white'
                    : 'bg-[#1F2937] text-[#4B5563] cursor-not-allowed'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Generate Press Release
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            STEP 1 — AI Writing
        ═══════════════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Writing log */}
            {!writingDone && (
              <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <Loader2 className="w-5 h-5 text-teal-400 animate-spin" />
                  Writing your press release…
                </h2>
                <div className="space-y-2 font-mono text-sm">
                  {writingLog.map((log, i) => (
                    <div key={i} className="flex items-center gap-2 text-[#9CA3AF]">
                      {i < writingLog.length - 1 ? (
                        <Check className="w-4 h-4 text-teal-400 shrink-0" />
                      ) : (
                        <Loader2 className="w-4 h-4 text-purple-400 animate-spin shrink-0" />
                      )}
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Results tabs */}
            {writingDone && (
              <>
                <div className="bg-[#111318] border border-[#1F2937] rounded-xl overflow-hidden">
                  {/* Tab bar */}
                  <div className="flex border-b border-[#1F2937]">
                    {RESULT_TABS.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveResultTab(tab.id)}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                          activeResultTab === tab.id
                            ? 'text-teal-400 border-b-2 border-teal-400 bg-[#111318]'
                            : 'text-[#6B7280] hover:text-[#9CA3AF]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="p-6">
                    {/* Press Release tab */}
                    {activeResultTab === 'press_release' && (
                      <div>
                        <label className="block text-sm font-medium text-[#9CA3AF] mb-2">Full press release — edit as needed</label>
                        <textarea
                          value={pressReleaseText}
                          onChange={e => setPressReleaseText(e.target.value)}
                          rows={24}
                          className="w-full bg-[#07080F] border border-[#1F2937] rounded-lg px-4 py-3 text-sm text-[#F9FAFB] font-mono leading-relaxed focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors resize-y"
                        />
                      </div>
                    )}

                    {/* Headlines tab */}
                    {activeResultTab === 'headlines' && (
                      <div>
                        <label className="block text-sm font-medium text-[#9CA3AF] mb-3">Click a headline to swap it into your press release</label>
                        <div className="space-y-3">
                          {altHeadlines.map((h, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                // Replace the first line that looks like a headline in the press release
                                const lines = pressReleaseText.split('\n')
                                // Find the headline line (usually ALL CAPS or the second non-empty line)
                                const headlineIdx = lines.findIndex((l, idx) => idx > 0 && l.trim() && l.trim() === l.trim().toUpperCase() && l.trim().length > 10)
                                if (headlineIdx !== -1) {
                                  lines[headlineIdx] = h.toUpperCase()
                                  setPressReleaseText(lines.join('\n'))
                                }
                                showToast(`Headline ${i + 1} applied`)
                              }}
                              className="w-full text-left bg-[#07080F] border border-[#1F2937] hover:border-teal-500/50 rounded-lg px-5 py-4 text-sm text-[#F9FAFB] transition-all hover:bg-teal-500/5 group"
                            >
                              <span className="text-xs text-[#4B5563] group-hover:text-teal-400 block mb-1">Option {i + 1}</span>
                              <span className="font-semibold">{h}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Social Posts tab */}
                    {activeResultTab === 'social_posts' && (
                      <div className="space-y-4">
                        {[
                          { key: 'linkedin',  label: 'LinkedIn',    icon: Linkedin,  color: 'text-blue-400' },
                          { key: 'twitter1',  label: 'Twitter #1',  icon: Twitter,   color: 'text-sky-400' },
                          { key: 'twitter2',  label: 'Twitter #2',  icon: Twitter,   color: 'text-sky-400' },
                          { key: 'facebook',  label: 'Facebook',    icon: Facebook,  color: 'text-blue-500' },
                          { key: 'instagram', label: 'Instagram',   icon: Instagram, color: 'text-pink-400' },
                        ].map(platform => {
                          const Icon = platform.icon
                          return (
                            <div key={platform.key} className="bg-[#07080F] border border-[#1F2937] rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Icon className={`w-4 h-4 ${platform.color}`} />
                                <span className="text-sm font-medium text-[#9CA3AF]">{platform.label}</span>
                              </div>
                              <textarea
                                value={socialPosts[platform.key]}
                                onChange={e => setSocialPosts(prev => ({ ...prev, [platform.key]: e.target.value }))}
                                rows={4}
                                className="w-full bg-[#111318] border border-[#1F2937] rounded-lg px-3 py-2 text-sm text-[#F9FAFB] focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors resize-none"
                              />
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Journalist Pitch tab */}
                    {activeResultTab === 'journalist_pitch' && (
                      <div>
                        <label className="block text-sm font-medium text-[#9CA3AF] mb-2">Email pitch template — edit as needed</label>
                        <textarea
                          value={journalistPitch}
                          onChange={e => setJournalistPitch(e.target.value)}
                          rows={20}
                          className="w-full bg-[#07080F] border border-[#1F2937] rounded-lg px-4 py-3 text-sm text-[#F9FAFB] font-mono leading-relaxed focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors resize-y"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between">
                  <button
                    onClick={() => setStep(0)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border border-[#1F2937] text-[#9CA3AF] hover:text-[#F9FAFB] hover:border-[#374151] transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold bg-teal-500 hover:bg-teal-400 text-white transition-all"
                  >
                    Review &amp; Refine
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            STEP 2 — Review & Refine
        ═══════════════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Preview */}
            <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Eye className="w-5 h-5 text-teal-400" />
                Press Release Preview
              </h2>
              <div className="bg-[#07080F] border border-[#1F2937] rounded-lg p-6 text-sm text-[#D1D5DB] font-mono leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>
                {pressReleaseText}
              </div>
            </div>

            {/* Checklist */}
            <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <ClipboardCheck className="w-5 h-5 text-teal-400" />
                Pre-distribution Checklist
              </h2>
              <div className="space-y-3">
                {REVIEW_CHECKLIST_ITEMS.map((item, i) => (
                  <label key={i} className="flex items-center gap-3 cursor-pointer select-none group">
                    <button
                      onClick={() => toggleCheck(i)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0 ${
                        checklist[i]
                          ? 'bg-teal-500 border-teal-500'
                          : 'border-[#374151] hover:border-teal-500/50'
                      }`}
                    >
                      {checklist[i] && <Check className="w-3 h-3 text-white" />}
                    </button>
                    <span className={`text-sm transition-colors ${checklist[i] ? 'text-[#F9FAFB]' : 'text-[#9CA3AF] group-hover:text-[#D1D5DB]'}`}>
                      {item}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border border-[#1F2937] text-[#9CA3AF] hover:text-[#F9FAFB] hover:border-[#374151] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold bg-teal-500 hover:bg-teal-400 text-white transition-all"
              >
                Distribute
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            STEP 3 — Distribute
        ═══════════════════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Action buttons */}
            <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-2">
                <Send className="w-5 h-5 text-teal-400" />
                Distribution Actions
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => showToast('Journalist pitch draft created')}
                  className="flex items-center gap-3 bg-[#07080F] border border-[#1F2937] hover:border-teal-500/50 rounded-lg px-5 py-4 text-sm text-[#F9FAFB] transition-all hover:bg-teal-500/5 text-left"
                >
                  <Mail className="w-5 h-5 text-teal-400 shrink-0" />
                  <div>
                    <div className="font-medium">Draft pitch email to journalists</div>
                    <div className="text-xs text-[#6B7280] mt-0.5">Create personalised outreach drafts</div>
                  </div>
                </button>

                <button
                  onClick={() => showToast('PR distribution draft created')}
                  className="flex items-center gap-3 bg-[#07080F] border border-[#1F2937] hover:border-teal-500/50 rounded-lg px-5 py-4 text-sm text-[#F9FAFB] transition-all hover:bg-teal-500/5 text-left"
                >
                  <Send className="w-5 h-5 text-purple-400 shrink-0" />
                  <div>
                    <div className="font-medium">Send to PR distribution list</div>
                    <div className="text-xs text-[#6B7280] mt-0.5">Broadcast to all media contacts</div>
                  </div>
                </button>

                <button
                  onClick={() => showToast('Follow-up reminder set for 3 days after release')}
                  className="flex items-center gap-3 bg-[#07080F] border border-[#1F2937] hover:border-teal-500/50 rounded-lg px-5 py-4 text-sm text-[#F9FAFB] transition-all hover:bg-teal-500/5 text-left"
                >
                  <Bell className="w-5 h-5 text-teal-400 shrink-0" />
                  <div>
                    <div className="font-medium">Set follow-up reminder</div>
                    <div className="text-xs text-[#6B7280] mt-0.5">Remind 3 days after release date</div>
                  </div>
                </button>

                <button
                  onClick={() => showToast('Live date alert created')}
                  className="flex items-center gap-3 bg-[#07080F] border border-[#1F2937] hover:border-teal-500/50 rounded-lg px-5 py-4 text-sm text-[#F9FAFB] transition-all hover:bg-teal-500/5 text-left"
                >
                  <Calendar className="w-5 h-5 text-purple-400 shrink-0" />
                  <div>
                    <div className="font-medium">Set live date alert</div>
                    <div className="text-xs text-[#6B7280] mt-0.5">Calendar notification for go-live</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Summary card */}
            <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Release Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-start">
                  <span className="text-[#6B7280]">Title</span>
                  <span className="text-right font-medium max-w-[60%]">{headline}</span>
                </div>
                <div className="border-t border-[#1F2937]" />
                <div className="flex justify-between items-center">
                  <span className="text-[#6B7280]">Type</span>
                  <span>{selectedType?.emoji} {selectedType?.label}</span>
                </div>
                <div className="border-t border-[#1F2937]" />
                <div className="flex justify-between items-center">
                  <span className="text-[#6B7280]">Embargo</span>
                  <span>{resolvedEmbargo ? new Date(resolvedEmbargo).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Immediate'}</span>
                </div>
                <div className="border-t border-[#1F2937]" />
                <div className="flex justify-between items-start">
                  <span className="text-[#6B7280]">Target publications</span>
                  <span className="text-right max-w-[60%]">{targetPubs || 'Not specified'}</span>
                </div>
                <div className="border-t border-[#1F2937]" />
                <div className="flex justify-between items-center">
                  <span className="text-[#6B7280]">Geographic focus</span>
                  <span>{GEO_OPTIONS.find(g => g.id === geography)?.label ?? geography}</span>
                </div>
              </div>
            </div>

            {/* Back button */}
            <div className="flex justify-start">
              <button
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border border-[#1F2937] text-[#9CA3AF] hover:text-[#F9FAFB] hover:border-[#374151] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}
