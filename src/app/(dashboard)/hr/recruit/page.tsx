'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, ChevronRight, Check, Loader2, Sparkles,
  Copy, Mail, Briefcase, Users, TrendingUp, AlertTriangle,
  Clock, Target, Shield, BookOpen,
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_TYPES = [
  { id: 'sales',       label: 'Sales & BD',            emoji: '👨‍💼' },
  { id: 'engineering', label: 'Engineering',            emoji: '💻' },
  { id: 'design',     label: 'Design & Product',       emoji: '🎨' },
  { id: 'data',       label: 'Data & Analytics',       emoji: '📊' },
  { id: 'marketing',  label: 'Marketing',              emoji: '📣' },
  { id: 'cs',         label: 'Customer Success',       emoji: '🤝' },
  { id: 'ops',        label: 'Operations',             emoji: '⚙️' },
  { id: 'finance',    label: 'Finance',                emoji: '💰' },
  { id: 'hr',         label: 'HR & People',            emoji: '👥' },
  { id: 'csuite',     label: 'C-Suite / Leadership',   emoji: '🏢' },
  { id: 'graduate',   label: 'Graduate / Entry Level', emoji: '🎓' },
  { id: 'contract',   label: 'Contract / Freelance',   emoji: '🔄' },
]

const LEVELS = ['Junior', 'Mid-Level', 'Senior', 'Lead/Principal'] as const

const LOCATIONS = ['London', 'Manchester', 'Birmingham', 'Remote', 'Hybrid', 'Multiple locations']

const MUST_HAVES = [
  { id: 'tech_skills',    label: 'Specific technical skills required' },
  { id: 'industry_exp',   label: 'Industry experience required' },
  { id: 'management',     label: 'Management experience required' },
  { id: 'security',       label: 'Security clearance required' },
  { id: 'language',       label: 'Language skills required' },
  { id: 'degree',         label: 'Degree qualified' },
  { id: 'portfolio',      label: 'Portfolio/work samples required' },
  { id: 'immediate',      label: 'Immediate availability required' },
]

const SOURCING_OPTIONS = ['LinkedIn Search', 'Job Boards', 'Executive Search', 'Internal First'] as const

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  const steps = ['Configure', 'Research', 'Candidates', 'Outreach']
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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1F2937] text-xs text-[#9CA3AF] hover:text-[#F9FAFB] hover:border-[#374151] transition-colors">
      {copied ? <><Check className="w-3 h-3 text-teal-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RecruitPage() {

  const [step, setStep] = useState(0)

  // Step 0 — Configure
  const [roleType, setRoleType] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [department, setDepartment] = useState('')
  const [reportsTo, setReportsTo] = useState('')
  const [hireCount, setHireCount] = useState(1)
  const [startDate, setStartDate] = useState('')
  const [location, setLocation] = useState('')
  const [level, setLevel] = useState<typeof LEVELS[number] | ''>('')
  const [salaryMin, setSalaryMin] = useState('')
  const [salaryMax, setSalaryMax] = useState('')
  const [mustHaves, setMustHaves] = useState<string[]>([])
  const [sourcing, setSourcing] = useState('')

  // Step 1 — Research
  const [researchLog, setResearchLog] = useState<string[]>([])
  const [researchDone, setResearchDone] = useState(false)
  const [marketData, setMarketData] = useState<any>(null)

  // Step 2 — Candidates
  const [jobDesc, setJobDesc] = useState<any>(null)
  const [candidates, setCandidates] = useState<any[]>([])
  const [questions, setQuestions] = useState<string[]>([])
  const [loadingJD, setLoadingJD] = useState(false)
  const [loadingCandidates, setLoadingCandidates] = useState(false)
  const [loadingQuestions, setLoadingQuestions] = useState(false)

  // Step 3 — Outreach
  const [outreach, setOutreach] = useState<any>(null)
  const [loadingOutreach, setLoadingOutreach] = useState(false)

  // Toast
  const [toast, setToast] = useState<string | null>(null)

  function toggleMustHave(id: string) {
    setMustHaves(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id])
  }

  async function callAI(action: string) {
    const res = await fetch('/api/ai/recruit-research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, jobTitle, level, location, salaryMin, salaryMax, sourcingPreference: sourcing, mustHaves }),
    })
    if (!res.ok) throw new Error('API call failed')
    return res.json()
  }

  async function startResearch() {
    setStep(1); setResearchLog([]); setResearchDone(false)
    const logs = [
      `Analysing role requirements for ${jobTitle || 'this role'}...`,
      `Benchmarking salary against market data in ${location || 'the UK'}...`,
      'Identifying candidate pools...',
      'Scanning competitor hiring activity...',
      'Building candidate profiles...',
      'Compiling market intelligence report...',
    ]
    for (const log of logs) {
      await new Promise(r => setTimeout(r, 600))
      setResearchLog(prev => [...prev, log])
    }

    try {
      const data = await callAI('market-research')
      setMarketData(data)
    } catch { setMarketData(null) }

    setResearchDone(true)
  }

  async function loadCandidatesStep() {
    setStep(2)
    // Fire all 3 in parallel
    setLoadingJD(true); setLoadingCandidates(true); setLoadingQuestions(true)
    try { const d = await callAI('job-description'); setJobDesc(d) } catch {} finally { setLoadingJD(false) }
    try { const c = await callAI('candidate-personas'); setCandidates(Array.isArray(c) ? c : []) } catch {} finally { setLoadingCandidates(false) }
    try { const q = await callAI('interview-questions'); setQuestions(Array.isArray(q) ? q : []) } catch {} finally { setLoadingQuestions(false) }
  }

  async function loadOutreach() {
    setStep(3); setLoadingOutreach(true)
    try { const o = await callAI('outreach'); setOutreach(o) } catch {} finally { setLoadingOutreach(false) }
  }

  const canProceed = roleType && jobTitle && location && level

  return (
    <div className="min-h-screen text-[#F9FAFB] px-6 py-8 max-w-5xl mx-auto" style={{ backgroundColor: '#07080F' }}>

      {/* Demo badge */}
      <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
        style={{ backgroundColor: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#A78BFA' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse inline-block" />
        AI-powered recruitment workflow
      </div>

      {/* Header */}
      <div className="mb-6">
        <Link href={"/hr"}
          className="inline-flex items-center gap-1 text-sm text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Recruitment
        </Link>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(13,148,136,0.15)', border: '1px solid rgba(13,148,136,0.3)', color: '#2DD4BF' }}>HR-REC-01</span>
            <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#A78BFA' }}>AI Research Agent</span>
          </div>
          <h1 className="text-2xl font-bold">Recruitment — Talent Finder & Hiring Researcher</h1>
          <p className="text-[#9CA3AF] text-sm mt-1">
            Describe the role — get candidate profiles, salary benchmarks, job description, interview questions, and outreach messages ready to send.
          </p>
        </div>
      </div>

      <StepIndicator current={step} />

      {/* ── Step 0: Configure ──────────────────────────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-6">
          {/* Role type */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-1">What are you hiring for?</h2>
            <p className="text-sm text-[#9CA3AF] mb-4">Pick the closest department match.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {ROLE_TYPES.map(rt => (
                <button key={rt.id} onClick={() => setRoleType(rt.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                    roleType === rt.id
                      ? 'border-purple-500 bg-purple-600/10 text-purple-300'
                      : 'border-[#1F2937] text-[#9CA3AF] hover:border-[#374151]'
                  }`}>
                  <span>{rt.emoji}</span> {rt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Role details */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-4">Role Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#6B7280] block mb-1.5">Job title *</label>
                <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Senior Product Manager"
                  className="w-full bg-[#07080F] border border-[#1F2937] rounded-lg px-3 py-2 text-sm text-[#F9FAFB] placeholder-[#6B7280] focus:outline-none focus:border-teal-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-[#6B7280] block mb-1.5">Department</label>
                <input type="text" value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. Product"
                  className="w-full bg-[#07080F] border border-[#1F2937] rounded-lg px-3 py-2 text-sm text-[#F9FAFB] placeholder-[#6B7280] focus:outline-none focus:border-teal-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-[#6B7280] block mb-1.5">Reports to</label>
                <input type="text" value={reportsTo} onChange={e => setReportsTo(e.target.value)} placeholder="e.g. VP of Product"
                  className="w-full bg-[#07080F] border border-[#1F2937] rounded-lg px-3 py-2 text-sm text-[#F9FAFB] placeholder-[#6B7280] focus:outline-none focus:border-teal-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-[#6B7280] block mb-1.5">Number of hires</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setHireCount(h => Math.max(1, h - 1))}
                    className="w-9 h-9 rounded-lg border border-[#1F2937] flex items-center justify-center text-[#9CA3AF] hover:text-[#F9FAFB] hover:border-[#374151] transition-colors text-lg">−</button>
                  <div className="flex-1 bg-[#07080F] border border-[#1F2937] rounded-lg px-3 py-2 text-sm text-center text-[#F9FAFB]">{hireCount}</div>
                  <button onClick={() => setHireCount(h => Math.min(20, h + 1))}
                    className="w-9 h-9 rounded-lg border border-[#1F2937] flex items-center justify-center text-[#9CA3AF] hover:text-[#F9FAFB] hover:border-[#374151] transition-colors text-lg">+</button>
                </div>
              </div>
              <div>
                <label className="text-xs text-[#6B7280] block mb-1.5">Target start date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="w-full bg-[#07080F] border border-[#1F2937] rounded-lg px-3 py-2 text-sm text-[#F9FAFB] focus:outline-none focus:border-teal-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-[#6B7280] block mb-1.5">Location *</label>
                <select value={location} onChange={e => setLocation(e.target.value)}
                  className="w-full bg-[#07080F] border border-[#1F2937] rounded-lg px-3 py-2 text-sm text-[#F9FAFB] focus:outline-none focus:border-teal-500 transition-colors">
                  <option value="">Select location…</option>
                  {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Salary & Level */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-4">Salary & Level</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {LEVELS.map(l => (
                <button key={l} onClick={() => setLevel(l)}
                  className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                    level === l
                      ? 'border-purple-500 bg-purple-600/10 text-purple-300'
                      : 'border-[#1F2937] text-[#9CA3AF] hover:border-[#374151]'
                  }`}>
                  {l}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#6B7280] block mb-1.5">Salary min (£)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] text-sm">£</span>
                  <input type="number" value={salaryMin} onChange={e => setSalaryMin(e.target.value)} placeholder="e.g. 45000"
                    className="w-full bg-[#07080F] border border-[#1F2937] rounded-lg pl-7 pr-3 py-2 text-sm text-[#F9FAFB] placeholder-[#6B7280] focus:outline-none focus:border-teal-500 transition-colors" />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#6B7280] block mb-1.5">Salary max (£)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] text-sm">£</span>
                  <input type="number" value={salaryMax} onChange={e => setSalaryMax(e.target.value)} placeholder="e.g. 65000"
                    className="w-full bg-[#07080F] border border-[#1F2937] rounded-lg pl-7 pr-3 py-2 text-sm text-[#F9FAFB] placeholder-[#6B7280] focus:outline-none focus:border-teal-500 transition-colors" />
                </div>
              </div>
            </div>
            <p className="text-xs text-[#6B7280] mt-2">Leave blank to get market rate recommendation</p>
          </div>

          {/* Must-haves */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-1">Must-haves</h2>
            <p className="text-sm text-[#9CA3AF] mb-4">Select any hard requirements for this role.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {MUST_HAVES.map(mh => (
                <button key={mh.id} onClick={() => toggleMustHave(mh.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all text-left ${
                    mustHaves.includes(mh.id)
                      ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                      : 'border-[#1F2937] text-[#9CA3AF] hover:border-[#374151]'
                  }`}>
                  {mustHaves.includes(mh.id) && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                  <span className="text-xs">{mh.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sourcing */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-4">Sourcing preference</h2>
            <div className="flex flex-wrap gap-2">
              {SOURCING_OPTIONS.map(s => (
                <button key={s} onClick={() => setSourcing(s)}
                  className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                    sourcing === s
                      ? 'border-purple-500 bg-purple-600/10 text-purple-300'
                      : 'border-[#1F2937] text-[#9CA3AF] hover:border-[#374151]'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={startResearch} disabled={!canProceed}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors">
              <Sparkles className="w-4 h-4" /> Start research
            </button>
          </div>
        </div>
      )}

      {/* ── Step 1: Research ────────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              {researchDone
                ? <Check className="w-4 h-4 text-teal-400" />
                : <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />}
              <h2 className="font-semibold">{researchDone ? 'Research complete' : 'Researching hiring market…'}</h2>
            </div>
            <div className="space-y-2 font-mono text-sm">
              {researchLog.map((log, i) => (
                <div key={i} className={`flex items-start gap-2 ${i === researchLog.length - 1 && !researchDone ? 'text-teal-400' : 'text-[#6B7280]'}`}>
                  <span className="text-[#374151] select-none">{String(i + 1).padStart(2, '0')}</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Market intelligence preview */}
          {marketData && researchDone && (
            <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-teal-400" /> Market Intelligence</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#07080F] rounded-lg p-3 border border-[#1F2937]">
                  <div className="text-xs text-[#6B7280] mb-1">Market Salary</div>
                  <div className="text-sm font-semibold text-emerald-400">{marketData.marketSalary || '—'}</div>
                </div>
                <div className="bg-[#07080F] rounded-lg p-3 border border-[#1F2937]">
                  <div className="text-xs text-[#6B7280] mb-1">Time to Hire</div>
                  <div className="text-sm font-semibold">{marketData.timeToHire || '—'}</div>
                </div>
                <div className="bg-[#07080F] rounded-lg p-3 border border-[#1F2937]">
                  <div className="text-xs text-[#6B7280] mb-1">Candidate Pool</div>
                  <div className="text-sm font-semibold">{marketData.candidatePool || '—'}</div>
                </div>
                <div className="bg-[#07080F] rounded-lg p-3 border border-[#1F2937]">
                  <div className="text-xs text-[#6B7280] mb-1">Hiring Risk</div>
                  <div className={`text-sm font-semibold ${marketData.hiringRisk?.toLowerCase().includes('low') ? 'text-emerald-400' : marketData.hiringRisk?.toLowerCase().includes('high') ? 'text-red-400' : 'text-amber-400'}`}>{marketData.hiringRisk || '—'}</div>
                </div>
              </div>
            </div>
          )}

          {researchDone && (
            <div className="flex justify-between">
              <button onClick={() => setStep(0)} className="text-sm text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors">← Adjust search</button>
              <button onClick={loadCandidatesStep}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-colors">
                View candidates <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Candidates ─────────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Market intelligence sidebar */}
          {marketData && (
            <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-teal-400" /> Market Intelligence</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div><span className="text-xs text-[#6B7280]">Market Salary:</span> <span className="text-sm text-emerald-400 font-medium">{marketData.marketSalary}</span></div>
                  <div><span className="text-xs text-[#6B7280]">Insight:</span> <span className="text-sm text-[#9CA3AF]">{marketData.salaryInsight}</span></div>
                  <div><span className="text-xs text-[#6B7280]">Sourcing Tip:</span> <span className="text-sm text-[#9CA3AF]">{marketData.sourcingTip}</span></div>
                  <div><span className="text-xs text-[#6B7280]">Interview Process:</span> <span className="text-sm text-[#9CA3AF]">{marketData.interviewProcess}</span></div>
                  <div><span className="text-xs text-[#6B7280]">Competitor Activity:</span> <span className="text-sm text-[#9CA3AF]">{marketData.competitorActivity}</span></div>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-[#6B7280] block mb-1">Top Skills to Look For:</span>
                    <div className="flex flex-wrap gap-1">{(marketData.topSkills || []).map((s: string, i: number) => <span key={i} className="text-xs bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded">{s}</span>)}</div>
                  </div>
                  <div>
                    <span className="text-xs text-[#6B7280] block mb-1">Red Flags:</span>
                    <div className="flex flex-wrap gap-1">{(marketData.redFlags || []).map((f: string, i: number) => <span key={i} className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded">{f}</span>)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Job Description */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2"><BookOpen className="w-4 h-4 text-[#9CA3AF]" /> Auto-Generated Job Description</h2>
              {jobDesc && <CopyButton text={`${jobDesc.headline}\n\n${jobDesc.aboutRole}\n\nWhat you'll do:\n${(jobDesc.whatYoullDo||[]).map((r:string)=>`• ${r}`).join('\n')}\n\nWhat we need:\n${(jobDesc.whatWeNeed||[]).map((r:string)=>`• ${r}`).join('\n')}\n\nWhat we offer:\n${(jobDesc.whatWeOffer||[]).map((r:string)=>`• ${r}`).join('\n')}\n\n${jobDesc.closingLine}`} />}
            </div>
            {loadingJD ? (
              <div className="flex items-center gap-2 py-6 justify-center text-sm text-[#6B7280]"><Loader2 className="w-4 h-4 animate-spin text-teal-400" /> Generating job description...</div>
            ) : jobDesc ? (
              <div className="space-y-4 text-sm">
                <div className="text-lg font-bold text-[#F9FAFB]">{jobDesc.headline}</div>
                <p className="text-[#9CA3AF] leading-relaxed whitespace-pre-line">{jobDesc.aboutRole}</p>
                <div><h3 className="font-semibold text-[#F9FAFB] mb-2">What you'll do</h3><ul className="space-y-1">{(jobDesc.whatYoullDo||[]).map((r:string,i:number)=><li key={i} className="text-[#9CA3AF] flex items-start gap-2"><span className="text-teal-400 mt-0.5">•</span>{r}</li>)}</ul></div>
                <div><h3 className="font-semibold text-[#F9FAFB] mb-2">What we need</h3><ul className="space-y-1">{(jobDesc.whatWeNeed||[]).map((r:string,i:number)=><li key={i} className="text-[#9CA3AF] flex items-start gap-2"><span className="text-teal-400 mt-0.5">•</span>{r}</li>)}</ul></div>
                <div><h3 className="font-semibold text-[#F9FAFB] mb-2">What we offer</h3><ul className="space-y-1">{(jobDesc.whatWeOffer||[]).map((r:string,i:number)=><li key={i} className="text-[#9CA3AF] flex items-start gap-2"><span className="text-teal-400 mt-0.5">•</span>{r}</li>)}</ul></div>
                <p className="text-[#9CA3AF] italic">{jobDesc.closingLine}</p>
              </div>
            ) : (
              <div className="text-sm text-[#6B7280] py-4 text-center">No job description data available</div>
            )}
          </div>

          {/* Candidate Personas */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-1 flex items-center gap-2"><Users className="w-4 h-4 text-[#9CA3AF]" /> Example Candidate Profiles</h2>
            <p className="text-xs text-[#6B7280] mb-4">Illustrative personas — not real people</p>
            {loadingCandidates ? (
              <div className="flex items-center gap-2 py-6 justify-center text-sm text-[#6B7280]"><Loader2 className="w-4 h-4 animate-spin text-teal-400" /> Generating candidate profiles...</div>
            ) : candidates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {candidates.map((c, i) => (
                  <div key={i} className="bg-[#07080F] border border-[#1F2937] rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold text-sm">{c.name}</div>
                        <div className="text-xs text-[#6B7280]">{c.currentRole} · {c.currentCompany}</div>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        (c.fitScore || 0) >= 8 ? 'bg-emerald-500/10 text-emerald-400' :
                        (c.fitScore || 0) >= 6 ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                      }`}>{c.fitScore}/10</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">{(c.keySkills||[]).map((s:string,j:number)=><span key={j} className="text-xs bg-[#1F2937] text-[#9CA3AF] px-1.5 py-0.5 rounded">{s}</span>)}</div>
                    <div className="text-xs text-[#9CA3AF] mb-1">{c.standout}</div>
                    <div className="flex items-center gap-3 text-xs text-[#6B7280] mt-2">
                      <span>{c.yearsExp} exp</span>
                      <span>·</span>
                      <span>{c.salaryExpectation}</span>
                      <span>·</span>
                      <span>{c.availability}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-[#6B7280] py-4 text-center">No candidate data available</div>
            )}
          </div>

          {/* Interview Questions */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2"><Target className="w-4 h-4 text-[#9CA3AF]" /> Interview Questions</h2>
              {questions.length > 0 && <CopyButton text={questions.map((q,i)=>`${i+1}. ${q}`).join('\n')} />}
            </div>
            {loadingQuestions ? (
              <div className="flex items-center gap-2 py-6 justify-center text-sm text-[#6B7280]"><Loader2 className="w-4 h-4 animate-spin text-teal-400" /> Generating interview questions...</div>
            ) : questions.length > 0 ? (
              <ol className="space-y-2">
                {questions.map((q, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="text-xs font-mono text-[#374151] mt-0.5 w-5 text-right flex-shrink-0">{i+1}.</span>
                    <span className="text-[#9CA3AF]">{q}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="text-sm text-[#6B7280] py-4 text-center">No questions generated</div>
            )}
          </div>

          <div className="flex justify-between pt-2">
            <button onClick={() => setStep(1)} className="text-sm text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors">← Back to research</button>
            <button onClick={loadOutreach}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-colors">
              Generate outreach <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Outreach ───────────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-6">
          {loadingOutreach ? (
            <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-10 flex items-center justify-center gap-3">
              <Loader2 className="w-5 h-5 text-teal-400 animate-spin" />
              <span className="text-[#9CA3AF]">Generating outreach messages...</span>
            </div>
          ) : outreach ? (
            <>
              {/* LinkedIn Connect */}
              <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2"><Briefcase className="w-4 h-4 text-blue-400" /> LinkedIn Connection Request</h3>
                  <CopyButton text={outreach.linkedinConnect || ''} />
                </div>
                <div className="bg-[#07080F] border border-[#1F2937] rounded-lg p-4 text-sm text-[#9CA3AF] leading-relaxed">{outreach.linkedinConnect}</div>
                <div className="text-xs text-[#6B7280] mt-2">{(outreach.linkedinConnect || '').length}/300 characters</div>
              </div>

              {/* LinkedIn InMail */}
              <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2"><Mail className="w-4 h-4 text-blue-400" /> LinkedIn InMail</h3>
                  <CopyButton text={outreach.linkedinInmail || ''} />
                </div>
                <div className="bg-[#07080F] border border-[#1F2937] rounded-lg p-4 text-sm text-[#9CA3AF] leading-relaxed whitespace-pre-line">{outreach.linkedinInmail}</div>
              </div>

              {/* Email */}
              <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2"><Mail className="w-4 h-4 text-teal-400" /> Email Outreach</h3>
                  <div className="flex items-center gap-2">
                    <CopyButton text={`Subject: ${outreach.emailSubject || ''}\n\n${outreach.emailBody || ''}`} />
                  </div>
                </div>
                <div className="bg-[#07080F] border border-[#1F2937] rounded-lg p-4 space-y-2">
                  <div className="text-xs text-[#6B7280]">Subject: <span className="text-[#F9FAFB]">{outreach.emailSubject}</span></div>
                  <div className="text-sm text-[#9CA3AF] leading-relaxed whitespace-pre-line">{outreach.emailBody}</div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <button onClick={() => { setToast('JD copied — ready to post'); setTimeout(() => setToast(null), 3000) }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium text-sm transition-colors">
                  📋 Post Job Description
                </button>
                <button onClick={() => { setToast('Role saved to pipeline'); setTimeout(() => setToast(null), 3000) }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#1F2937] text-[#9CA3AF] hover:text-[#F9FAFB] hover:border-[#374151] text-sm transition-colors">
                  💾 Save to Recruitment Pipeline
                </button>
                <button onClick={() => { setToast('Outreach templates saved'); setTimeout(() => setToast(null), 3000) }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#1F2937] text-[#9CA3AF] hover:text-[#F9FAFB] hover:border-[#374151] text-sm transition-colors">
                  📧 Start Outreach Campaign
                </button>
              </div>

              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(2)} className="text-sm text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors">← Back to candidates</button>
                <Link href={"/hr"}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-colors">
                  Back to dashboard
                </Link>
              </div>
            </>
          ) : (
            <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-10 text-center text-[#6B7280]">No outreach data available</div>
          )}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 px-5 py-3 rounded-xl text-sm font-medium shadow-2xl"
          style={{ backgroundColor: '#1A1D27', border: '1px solid #374151', color: '#F9FAFB', whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
