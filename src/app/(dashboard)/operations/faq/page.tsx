'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, ChevronRight, Check, Upload, X,
  BookOpen, MessageSquare, HelpCircle, Users, Search,
  Layers, FileText, Loader2, Sparkles, ExternalLink,
  Download, Globe, Database, Mail
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Source {
  id: string
  label: string
  icon: string
  category: 'support' | 'knowledge' | 'standard'
}

interface Category {
  id: string
  label: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SOURCES: Source[] = [
  // Support-specific
  { id: 'zendesk',   label: 'Zendesk',         icon: '🎫', category: 'support' },
  { id: 'intercom',  label: 'Intercom',         icon: '💬', category: 'support' },
  { id: 'hubspot_kb',label: 'HubSpot KB',       icon: '🧡', category: 'support' },
  { id: 'freshdesk', label: 'Freshdesk',        icon: '🌿', category: 'support' },
  // Standard knowledge
  { id: 'notion',    label: 'Notion',           icon: '◻️', category: 'knowledge' },
  { id: 'sharepoint',label: 'SharePoint',       icon: '🔷', category: 'knowledge' },
  { id: 'gdrive',    label: 'Google Drive',     icon: '📁', category: 'knowledge' },
  { id: 'confluence',label: 'Confluence',       icon: '🔵', category: 'knowledge' },
  { id: 'slack',     label: 'Slack (threads)',  icon: '💜', category: 'standard' },
  { id: 'github',    label: 'GitHub (issues)',  icon: '⚫', category: 'standard' },
]

const PRESET_CATEGORIES: Category[] = [
  { id: 'getting_started',  label: 'Getting Started' },
  { id: 'billing',          label: 'Billing & Payments' },
  { id: 'account',          label: 'Account & Settings' },
  { id: 'troubleshooting',  label: 'Troubleshooting' },
  { id: 'integrations',     label: 'Integrations' },
  { id: 'security',         label: 'Security & Privacy' },
  { id: 'features',         label: 'Features & How-To' },
  { id: 'onboarding',       label: 'Onboarding' },
  { id: 'api',              label: 'API & Developer' },
  { id: 'returns',          label: 'Returns & Refunds' },
]

const AUDIENCE_OPTIONS = [
  { id: 'customers',  label: 'Customers',        icon: '🛍️' },
  { id: 'employees',  label: 'Internal Staff',   icon: '🏢' },
  { id: 'both',       label: 'Both',             icon: '🤝' },
]

const DESTINATIONS = [
  { id: 'notion',      label: 'Notion',         icon: '◻️' },
  { id: 'confluence',  label: 'Confluence',     icon: '🔵' },
  { id: 'zendesk',     label: 'Zendesk Guide',  icon: '🎫' },
  { id: 'hubspot',     label: 'HubSpot KB',     icon: '🧡' },
  { id: 'html',        label: 'HTML export',    icon: '🌐' },
  { id: 'markdown',    label: 'Markdown',       icon: '📝' },
]

const MOCK_OUTPUT = `# FAQ: LumioCMS

## Getting Started

**Q: How do I create my first automation?**
Navigate to the Workflows tab and click "New Workflow". Choose from 150 pre-built templates or start from scratch. Most users have their first automation running within 15 minutes.

**Q: What data sources can I connect?**
LumioCMS connects to 40+ tools out of the box — including Salesforce, HubSpot, Slack, Notion, Google Workspace, and Microsoft 365. New integrations are added monthly.

**Q: Is there a free trial?**
Yes — all plans include a 14-day free trial with full access to your tier's workflow library. No credit card required to start.

---

## Billing & Payments

**Q: What payment methods do you accept?**
We accept all major credit cards (Visa, Mastercard, Amex), bank transfers for annual plans, and PayPal. Enterprise customers can pay by invoice.

**Q: Can I change my plan mid-cycle?**
Yes. Upgrades take effect immediately and are prorated. Downgrades apply from your next renewal date.

**Q: Do you offer discounts for annual billing?**
Annual billing saves 20% compared to monthly. Nonprofit and startup discounts are also available — contact our team.

---

## Troubleshooting

**Q: My workflow isn't triggering — what should I check?**
1. Confirm the trigger condition is met (check event logs)
2. Verify your connected account hasn't expired under Integrations → Connections
3. Check the workflow is set to "Active" status
4. Review the Execution Log for specific error messages

**Q: Why is my data sync delayed?**
Syncs run on a schedule based on your plan (Starter: hourly, Growth: 15 min, Enterprise: real-time). For immediate sync, click "Sync Now" in the connection settings.

---

## Security & Privacy

**Q: Where is my data stored?**
All data is stored in EU data centres (AWS eu-west-1) by default. US and APAC regions are available on Enterprise plans. We are SOC 2 Type II certified.

**Q: Can I export my data?**
Yes — full data export is available under Settings → Data → Export. Exports include all workflows, logs, and connected data in JSON or CSV format.`

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  const steps = ['Sources', 'Configure', 'Build', 'Review & Publish']
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FAQBuilderPage() {
  const [step, setStep] = useState(0)

  // Step 0 — sources
  const [selectedSources, setSelectedSources] = useState<string[]>([])
  const [uploadedFiles, setUploadedFiles]     = useState<string[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  // Step 1 — configure
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [customCategory, setCustomCategory]         = useState('')
  const [extraCategories, setExtraCategories]       = useState<string[]>([])
  const [audience, setAudience]                     = useState('customers')
  const [enableSearch, setEnableSearch]             = useState(true)
  const [groupByCategory, setGroupByCategory]       = useState(true)
  const [includeAnswerLength, setIncludeAnswerLength] = useState<'short' | 'medium' | 'detailed'>('medium')

  // Step 2 — build
  const [building, setBuilding]   = useState(false)
  const [buildDone, setBuildDone] = useState(false)
  const [buildLog, setBuildLog]   = useState<string[]>([])

  // Step 3 — publish
  const [destination, setDestination] = useState('')
  const [published, setPublished]     = useState(false)

  // ── helpers ──────────────────────────────────────────────────────────────────

  function toggleSource(id: string) {
    setSelectedSources(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  function toggleCategory(id: string) {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  function addCustomCategory() {
    const trimmed = customCategory.trim()
    if (!trimmed) return
    setExtraCategories(prev => [...prev, trimmed])
    setCustomCategory('')
  }

  function removeExtra(label: string) {
    setExtraCategories(prev => prev.filter(c => c !== label))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).map(f => f.name)
    setUploadedFiles(prev => [...prev, ...files])
  }

  async function startBuild() {
    setBuilding(true)
    setBuildLog([])
    const logs = [
      'Connecting to selected sources…',
      'Reading support tickets and chat history…',
      'Clustering questions by topic…',
      'Generating answers from source material…',
      'Grouping into categories…',
      'Formatting FAQ document…',
      'Done — FAQ ready to review.',
    ]
    for (const log of logs) {
      await new Promise(r => setTimeout(r, 460))
      setBuildLog(prev => [...prev, log])
    }

    // Try real webhook — graceful degradation
    try {
      const res = await fetch('/api/workflows/faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sources: selectedSources, categories: [...selectedCategories, ...extraCategories], audience }),
      })
      if (!res.ok) throw new Error('non-ok')
    } catch {
      // silent — mock data shown below
    }

    setBuilding(false)
    setBuildDone(true)
  }

  const allCategories = [
    ...PRESET_CATEGORIES.filter(c => selectedCategories.includes(c.id)).map(c => c.label),
    ...extraCategories,
  ]

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#07080F] text-[#F9FAFB] px-6 py-8 max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <Link href="/operations" className="inline-flex items-center gap-1 text-sm text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Operations
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono bg-[#1F2937] text-[#9CA3AF] px-2 py-0.5 rounded">OP-FAQ-01</span>
              <span className="text-xs bg-purple-600/20 text-purple-400 px-2 py-0.5 rounded">AI-powered</span>
            </div>
            <h1 className="text-2xl font-bold">FAQ Builder</h1>
            <p className="text-[#9CA3AF] text-sm mt-1">
              Pull from your support tools and knowledge bases — generate a structured FAQ in minutes.
            </p>
          </div>
        </div>
      </div>

      <StepIndicator current={step} />

      {/* ── Step 0: Sources ───────────────────────────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-6">
          {/* Support tools */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-1">Support tools</h2>
            <p className="text-sm text-[#9CA3AF] mb-4">Pull real questions from your support history.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SOURCES.filter(s => s.category === 'support').map(src => (
                <button
                  key={src.id}
                  onClick={() => toggleSource(src.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    selectedSources.includes(src.id)
                      ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                      : 'border-[#1F2937] bg-[#07080F] text-[#9CA3AF] hover:border-[#374151]'
                  }`}
                >
                  <span>{src.icon}</span>
                  <span>{src.label}</span>
                  {selectedSources.includes(src.id) && <Check className="w-3.5 h-3.5 ml-auto" />}
                </button>
              ))}
            </div>
          </div>

          {/* Knowledge bases */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-1">Knowledge bases</h2>
            <p className="text-sm text-[#9CA3AF] mb-4">Pull existing docs and articles as source material.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SOURCES.filter(s => s.category !== 'support').map(src => (
                <button
                  key={src.id}
                  onClick={() => toggleSource(src.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    selectedSources.includes(src.id)
                      ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                      : 'border-[#1F2937] bg-[#07080F] text-[#9CA3AF] hover:border-[#374151]'
                  }`}
                >
                  <span>{src.icon}</span>
                  <span>{src.label}</span>
                  {selectedSources.includes(src.id) && <Check className="w-3.5 h-3.5 ml-auto" />}
                </button>
              ))}
            </div>
          </div>

          {/* File upload */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-1">Upload files</h2>
            <p className="text-sm text-[#9CA3AF] mb-4">Word, Excel, PDF, CSV — existing FAQs, spreadsheets, policy docs.</p>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-[#374151] text-sm text-[#9CA3AF] hover:border-teal-500 hover:text-teal-400 transition-all"
            >
              <Upload className="w-4 h-4" /> Upload files
            </button>
            <input ref={fileRef} type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.csv" className="hidden" onChange={handleFileChange} />
            {uploadedFiles.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {uploadedFiles.map((f, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-xs bg-[#1F2937] text-[#9CA3AF] px-2.5 py-1 rounded-full">
                    <FileText className="w-3 h-3" /> {f}
                    <button onClick={() => setUploadedFiles(prev => prev.filter((_, j) => j !== i))}>
                      <X className="w-3 h-3 hover:text-red-400" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setStep(1)}
              disabled={selectedSources.length === 0 && uploadedFiles.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
            >
              Configure <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 1: Configure ─────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Audience */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-1">Who is this FAQ for?</h2>
            <p className="text-sm text-[#9CA3AF] mb-4">Shapes the tone and terminology of generated answers.</p>
            <div className="flex gap-3 flex-wrap">
              {AUDIENCE_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setAudience(opt.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    audience === opt.id
                      ? 'border-purple-500 bg-purple-600/10 text-purple-300'
                      : 'border-[#1F2937] text-[#9CA3AF] hover:border-[#374151]'
                  }`}
                >
                  <span>{opt.icon}</span> {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-1">FAQ categories</h2>
            <p className="text-sm text-[#9CA3AF] mb-4">Select which sections to include. Questions will be grouped under these headings.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {PRESET_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all text-left ${
                    selectedCategories.includes(cat.id)
                      ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                      : 'border-[#1F2937] text-[#9CA3AF] hover:border-[#374151]'
                  }`}
                >
                  {selectedCategories.includes(cat.id) && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Custom category */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customCategory}
                onChange={e => setCustomCategory(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustomCategory()}
                placeholder="Add custom category…"
                className="flex-1 bg-[#07080F] border border-[#1F2937] rounded-lg px-3 py-2 text-sm text-[#F9FAFB] placeholder-[#6B7280] focus:outline-none focus:border-teal-500 transition-colors"
              />
              <button
                onClick={addCustomCategory}
                disabled={!customCategory.trim()}
                className="px-3 py-2 rounded-lg bg-[#1F2937] hover:bg-[#374151] disabled:opacity-40 text-sm text-[#9CA3AF] transition-colors"
              >
                Add
              </button>
            </div>
            {extraCategories.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {extraCategories.map((c, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-xs bg-teal-500/10 text-teal-400 border border-teal-500/30 px-2.5 py-1 rounded-full">
                    {c}
                    <button onClick={() => removeExtra(c)}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Options */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-4">Options</h2>
            <div className="space-y-4">
              {/* Answer length */}
              <div>
                <label className="text-sm text-[#9CA3AF] block mb-2">Answer length</label>
                <div className="flex gap-2">
                  {(['short', 'medium', 'detailed'] as const).map(len => (
                    <button
                      key={len}
                      onClick={() => setIncludeAnswerLength(len)}
                      className={`px-4 py-2 rounded-lg border text-sm capitalize transition-all ${
                        includeAnswerLength === len
                          ? 'border-purple-500 bg-purple-600/10 text-purple-300'
                          : 'border-[#1F2937] text-[#9CA3AF] hover:border-[#374151]'
                      }`}
                    >
                      {len}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2">
                {[
                  { label: 'Enable search index metadata', sub: 'Adds keywords for search engines and internal search tools', val: enableSearch, set: setEnableSearch },
                  { label: 'Group questions by category', sub: 'Organise output into labelled sections', val: groupByCategory, set: setGroupByCategory },
                ].map(({ label, sub, val, set }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-[#F9FAFB]">{label}</div>
                      <div className="text-xs text-[#6B7280]">{sub}</div>
                    </div>
                    <button
                      onClick={() => set(!val)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${val ? 'bg-teal-500' : 'bg-[#374151]'}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${val ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(0)} className="text-sm text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors">← Back</button>
            <button
              onClick={() => setStep(2)}
              disabled={selectedCategories.length === 0 && extraCategories.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
            >
              Build FAQ <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Build ─────────────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Summary */}
          {!building && !buildDone && (
            <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6 space-y-4">
              <h2 className="font-semibold">Build summary</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#07080F] rounded-lg p-4">
                  <div className="text-xs text-[#6B7280] mb-1">Sources</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSources.map(id => {
                      const src = SOURCES.find(s => s.id === id)
                      return src ? (
                        <span key={id} className="text-xs bg-[#1F2937] text-[#9CA3AF] px-2 py-0.5 rounded">{src.icon} {src.label}</span>
                      ) : null
                    })}
                    {uploadedFiles.map((f, i) => (
                      <span key={i} className="text-xs bg-[#1F2937] text-[#9CA3AF] px-2 py-0.5 rounded">📄 {f}</span>
                    ))}
                  </div>
                </div>
                <div className="bg-[#07080F] rounded-lg p-4">
                  <div className="text-xs text-[#6B7280] mb-1">Audience</div>
                  <div className="text-sm text-[#F9FAFB] capitalize">{audience}</div>
                  <div className="text-xs text-[#6B7280] mt-2 mb-1">Answer length</div>
                  <div className="text-sm text-[#F9FAFB] capitalize">{includeAnswerLength}</div>
                </div>
                <div className="bg-[#07080F] rounded-lg p-4 col-span-2">
                  <div className="text-xs text-[#6B7280] mb-2">Categories ({allCategories.length})</div>
                  <div className="flex flex-wrap gap-1.5">
                    {allCategories.map(c => (
                      <span key={c} className="text-xs bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded">{c}</span>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={startBuild}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium text-sm transition-colors"
              >
                <Sparkles className="w-4 h-4" /> Generate FAQ
              </button>
            </div>
          )}

          {/* Build log */}
          {(building || buildDone) && (
            <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                {building
                  ? <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />
                  : <Check className="w-4 h-4 text-teal-400" />
                }
                <h2 className="font-semibold">{building ? 'Building FAQ…' : 'FAQ ready'}</h2>
              </div>
              <div className="space-y-2 font-mono text-sm">
                {buildLog.map((log, i) => (
                  <div key={i} className={`flex items-start gap-2 ${i === buildLog.length - 1 && building ? 'text-teal-400' : 'text-[#6B7280]'}`}>
                    <span className="text-[#374151] select-none">{String(i + 1).padStart(2, '0')}</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {buildDone && (
            <div className="flex justify-end">
              <button
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-colors"
              >
                Review & publish <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {!building && !buildDone && (
            <div className="flex justify-start">
              <button onClick={() => setStep(1)} className="text-sm text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors">← Back</button>
            </div>
          )}
        </div>
      )}

      {/* ── Step 3: Review & Publish ──────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-6">
          {!published ? (
            <>
              {/* Preview */}
              <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">Preview</h2>
                  <span className="text-xs text-[#6B7280]">{allCategories.length} categories · {audience}</span>
                </div>
                <div className="bg-[#07080F] rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="text-xs text-[#9CA3AF] whitespace-pre-wrap font-mono leading-relaxed">
                    {MOCK_OUTPUT}
                  </pre>
                </div>
              </div>

              {/* Destination */}
              <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
                <h2 className="font-semibold mb-1">Publish to</h2>
                <p className="text-sm text-[#9CA3AF] mb-4">Choose where to send the generated FAQ.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {DESTINATIONS.map(dest => (
                    <button
                      key={dest.id}
                      onClick={() => setDestination(dest.id)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                        destination === dest.id
                          ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                          : 'border-[#1F2937] text-[#9CA3AF] hover:border-[#374151]'
                      }`}
                    >
                      <span>{dest.icon}</span> {dest.label}
                      {destination === dest.id && <Check className="w-3.5 h-3.5 ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <button onClick={() => setStep(2)} className="text-sm text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors">← Back</button>
                <button
                  onClick={() => setPublished(true)}
                  disabled={!destination}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> Publish FAQ
                </button>
              </div>
            </>
          ) : (
            /* Published confirmation */
            <div className="bg-[#111318] border border-teal-500/30 rounded-xl p-10 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-teal-500/10 flex items-center justify-center mx-auto">
                <Check className="w-7 h-7 text-teal-400" />
              </div>
              <h2 className="text-xl font-semibold">FAQ published</h2>
              <p className="text-[#9CA3AF] text-sm max-w-sm mx-auto">
                Your FAQ has been sent to{' '}
                <span className="text-[#F9FAFB]">
                  {DESTINATIONS.find(d => d.id === destination)?.label}
                </span>
                . It will be live within a few seconds.
              </p>
              <div className="flex gap-3 justify-center pt-2">
                <button
                  onClick={() => {
                    setStep(0)
                    setSelectedSources([])
                    setSelectedCategories([])
                    setExtraCategories([])
                    setAudience('customers')
                    setUploadedFiles([])
                    setBuildLog([])
                    setBuildDone(false)
                    setDestination('')
                    setPublished(false)
                  }}
                  className="px-4 py-2 rounded-lg border border-[#1F2937] text-sm text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors"
                >
                  Build another FAQ
                </button>
                <Link href="/operations" className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors">
                  Back to Operations
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
