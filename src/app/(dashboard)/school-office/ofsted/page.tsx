'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ShieldCheck, AlertTriangle, CheckCircle2, Loader2,
  ChevronRight, ChevronLeft, RefreshCw, FileText,
  Sparkles, Clock, ChevronDown, ChevronUp, X,
  Eye, Download,
} from 'lucide-react'
import { PageShell, SectionCard } from '@/components/page-ui'
import Link from 'next/link'

// ─── Types ─────────────────────────────────────────────────────────────────────

type RAG = 'Green' | 'Amber' | 'Red'

interface CheckItem {
  label: string
  value: string
  rag: RAG
}

interface Category {
  id: string
  title: string
  rag: RAG
  items: CheckItem[]
  actions: string[]
  icon: string
}

interface ActionItem {
  category: string
  action: string
  rag: RAG
}

interface ReadinessResult {
  overall_rag: RAG
  score: number
  checked_at: string
  categories: Category[]
  action_items: ActionItem[]
  totals: { green: number; amber: number; red: number }
}

// ─── RAG helpers ───────────────────────────────────────────────────────────────

const RAG_STYLE: Record<RAG, { bg: string; color: string; dot: string; label: string }> = {
  Green: { bg: 'rgba(13,148,136,0.12)', color: '#0D9488', dot: '#0D9488', label: 'Green' },
  Amber: { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B', dot: '#F59E0B', label: 'Amber' },
  Red:   { bg: 'rgba(239,68,68,0.15)',  color: '#EF4444', dot: '#EF4444', label: 'Red'   },
}

function RagBadge({ rag, size = 'sm' }: { rag: RAG; size?: 'sm' | 'lg' }) {
  const s = RAG_STYLE[rag]
  return (
    <div className="flex items-center gap-1.5">
      <span className={`rounded-full shrink-0 ${size === 'lg' ? 'h-3 w-3' : 'h-2 w-2'}`}
        style={{ backgroundColor: s.dot }} />
      <span className={`font-semibold ${size === 'lg' ? 'text-sm' : 'text-xs'}`}
        style={{ color: s.color }}>{s.label}</span>
    </div>
  )
}

// ─── Ofsted Pack Viewer ────────────────────────────────────────────────────────

function PackViewer({ text, onClose }: { text: string; onClose: () => void }) {
  function handlePrint() {
    const w = window.open('', '_blank')
    if (w) {
      w.document.write(`<!DOCTYPE html><html><head>
        <title>Ofsted Inspection Preparation Pack</title>
        <style>body{font-family:Georgia,serif;font-size:13px;line-height:1.8;max-width:750px;margin:40px auto;color:#111}h1,h2,h3{margin-top:1.5rem}li{margin:4px 0}</style>
        </head><body><h1>Ofsted Inspection Preparation Pack</h1>
        <pre style="white-space:pre-wrap;font-family:inherit">${text}</pre>
        </body></html>`)
      w.document.close()
      w.print()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}>
      <div className="w-full max-w-3xl rounded-2xl flex flex-col" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', maxHeight: '90vh' }}>
        <div className="flex items-center justify-between border-b px-6 py-4 shrink-0" style={{ borderColor: '#1F2937' }}>
          <div className="flex items-center gap-2">
            <Sparkles size={16} style={{ color: '#A855F7' }} />
            <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Ofsted Inspection Preparation Pack</span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
              style={{ backgroundColor: 'rgba(55,65,81,0.4)', color: '#9CA3AF', border: '1px solid #374151' }}>
              <Download size={11} /> Print / PDF
            </button>
            <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-800">
              <X size={16} style={{ color: '#9CA3AF' }} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <pre className="whitespace-pre-wrap text-sm leading-relaxed"
            style={{ color: '#D1D5DB', fontFamily: 'inherit' }}>
            {text}
          </pre>
        </div>
      </div>
    </div>
  )
}

// ─── Category Card ─────────────────────────────────────────────────────────────

function CategoryCard({ category }: { category: Category }) {
  const [expanded, setExpanded] = useState(false)
  const s = RAG_STYLE[category.rag]

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${s.color}30` }}>
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-gray-800/20"
        style={{ backgroundColor: `${s.bg}` }}>
        <div className="flex items-center gap-3">
          <RagBadge rag={category.rag} size="lg" />
          <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{category.title}</span>
          {category.actions.length > 0 && (
            <span className="rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
              {category.actions.length} action{category.actions.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {expanded ? <ChevronUp size={14} style={{ color: '#6B7280' }} /> : <ChevronDown size={14} style={{ color: '#6B7280' }} />}
      </button>

      {expanded && (
        <div className="border-t px-5 py-4" style={{ borderColor: '#1F2937', backgroundColor: 'rgba(7,8,15,0.5)' }}>
          {/* Check items */}
          <div className="flex flex-col gap-2 mb-4">
            {category.items.map((item, i) => {
              const rs = RAG_STYLE[item.rag]
              return (
                <div key={i} className="flex items-center justify-between gap-4">
                  <span className="text-xs" style={{ color: '#9CA3AF' }}>{item.label}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs" style={{ color: '#6B7280' }}>{item.value}</span>
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: rs.dot }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Action items */}
          {category.actions.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#6B7280' }}>Actions Required</p>
              <div className="flex flex-col gap-1.5">
                {category.actions.map((action, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <AlertTriangle size={11} className="shrink-0 mt-0.5" style={{ color: '#EF4444' }} />
                    <span className="text-xs" style={{ color: '#FCA5A5' }}>{action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {category.actions.length === 0 && (
            <div className="flex items-center gap-2">
              <CheckCircle2 size={12} style={{ color: '#0D9488' }} />
              <span className="text-xs" style={{ color: '#0D9488' }}>No actions required — this area is inspection ready</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Score Dial ────────────────────────────────────────────────────────────────

function ScoreDial({ score, rag }: { score: number; rag: RAG }) {
  const s = RAG_STYLE[rag]
  const circumference = 2 * Math.PI * 40
  const strokeDash = (score / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: 100, height: 100 }}>
        <svg width="100" height="100" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle cx="50" cy="50" r="40" fill="none" stroke="#1F2937" strokeWidth="8" />
          {/* Progress */}
          <circle cx="50" cy="50" r="40" fill="none"
            stroke={s.dot} strokeWidth="8"
            strokeDasharray={`${strokeDash} ${circumference}`}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            style={{ transition: 'stroke-dasharray 1s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color: s.color }}>{score}</span>
          <span className="text-xs" style={{ color: '#6B7280' }}>/ 100</span>
        </div>
      </div>
      <RagBadge rag={rag} size="lg" />
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function OfstedPage() {
  const [result, setResult]             = useState<ReadinessResult | null>(null)
  const [loading, setLoading]           = useState(true)
  const [running, setRunning]           = useState(false)
  const [generating, setGenerating]     = useState(false)
  const [packText, setPackText]         = useState<string | null>(null)
  const [htName, setHtName]             = useState('Mrs S. Okafor')
  const [error, setError]               = useState('')

  const runCheck = useCallback(async () => {
    setRunning(true)
    setError('')
    try {
      const res = await fetch('/api/workflows/school/ofsted')
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Check failed'); return }
      setResult(data as ReadinessResult)
    } catch {
      setError('Failed to run check.')
    } finally {
      setRunning(false)
      setLoading(false)
    }
  }, [])

  useEffect(() => { runCheck() }, [runCheck])

  async function handleGeneratePack() {
    setGenerating(true)
    setError('')
    try {
      const res = await fetch('/api/workflows/school/ofsted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headteacher_name: htName }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Generation failed'); return }
      setPackText(data.pack_text)
    } catch {
      setError('Failed to generate pack.')
    } finally {
      setGenerating(false)
    }
  }

  const redCount = result?.totals.red ?? 0

  return (
    <PageShell>
      {/* Sub-navigation */}
      <div className="flex items-center gap-2 flex-wrap">
        <Link href="/school-office"
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
          style={{ backgroundColor: 'rgba(107,114,128,0.1)', color: '#9CA3AF', border: '1px solid #374151' }}>
          <ChevronLeft size={11} /> School Office
        </Link>
        <ChevronRight size={12} style={{ color: '#374151' }} />
        <span className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
          style={{ backgroundColor: 'rgba(13,148,136,0.08)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.2)' }}>
          <ShieldCheck size={12} /> Ofsted Readiness
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Ofsted Readiness Checker</h2>
          <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
            Live RAG assessment across 6 inspection areas — pulled from your Supabase data in real time
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            value={htName}
            onChange={e => setHtName(e.target.value)}
            placeholder="Headteacher name…"
            className="rounded-lg px-3 py-2 text-sm outline-none w-44"
            style={{ backgroundColor: '#07080F', border: '1px solid #374151', color: '#F9FAFB' }} />
          <button type="button" onClick={handleGeneratePack} disabled={generating}
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors"
            style={{ backgroundColor: 'rgba(168,85,247,0.15)', color: '#A855F7', border: '1px solid rgba(168,85,247,0.3)' }}>
            {generating ? <><Loader2 size={13} className="animate-spin" /> Generating…</> : <><Sparkles size={13} /> Mock Ofsted Pack</>}
          </button>
          <button type="button" onClick={runCheck} disabled={running}
            className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
            style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0F766E' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0D9488' }}>
            {running ? <><Loader2 size={14} className="animate-spin" /> Checking…</> : <><RefreshCw size={14} /> Run Full Check</>}
          </button>
        </div>
      </div>

      {/* Red alert banner */}
      {redCount > 0 && result && (
        <div className="flex items-start gap-3 rounded-xl px-5 py-4"
          style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <AlertTriangle size={16} className="shrink-0 mt-0.5" style={{ color: '#EF4444' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>
              {redCount} area{redCount !== 1 ? 's' : ''} rated Red — immediate action required before inspection
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
              {result.action_items.filter(a => a.rag === 'Red').length} urgent action{result.action_items.filter(a => a.rag === 'Red').length !== 1 ? 's' : ''} outstanding. HT notified via n8n if webhook is configured.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={24} className="animate-spin" style={{ color: '#0D9488' }} />
            <p className="text-sm" style={{ color: '#9CA3AF' }}>Running readiness check…</p>
          </div>
        </div>
      ) : result ? (
        <>
          {/* Overall score + breakdown */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {/* Score dial */}
            <div className="rounded-xl p-6 flex items-center justify-center sm:col-span-1"
              style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <ScoreDial score={result.score} rag={result.overall_rag} />
            </div>

            {/* Counts */}
            <div className="rounded-xl p-5 flex flex-col justify-between"
              style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#6B7280' }}>Category Summary</p>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'Green', count: result.totals.green, color: '#0D9488' },
                  { label: 'Amber', count: result.totals.amber, color: '#F59E0B' },
                  { label: 'Red',   count: result.totals.red,   color: '#EF4444' },
                ].map(({ label, count, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{label}</span>
                    </div>
                    <span className="text-sm font-bold" style={{ color }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions outstanding */}
            <div className="rounded-xl p-5 sm:col-span-2"
              style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6B7280' }}>
                  Actions Outstanding ({result.action_items.length})
                </p>
                {result.checked_at && (
                  <div className="flex items-center gap-1 text-xs" style={{ color: '#4B5563' }}>
                    <Clock size={10} />
                    {new Date(result.checked_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
              {result.action_items.length === 0 ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} style={{ color: '#0D9488' }} />
                  <span className="text-sm" style={{ color: '#0D9488' }}>No actions outstanding — inspection ready!</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-32 overflow-y-auto">
                  {result.action_items.map((item, i) => {
                    const rs = RAG_STYLE[item.rag]
                    return (
                      <div key={i} className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: rs.dot }} />
                        <div>
                          <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{item.category}</p>
                          <p className="text-xs" style={{ color: '#D1D5DB' }}>{item.action}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Category cards */}
          <SectionCard title="Category Breakdown">
            <div className="flex flex-col gap-3">
              {result.categories.map(cat => (
                <CategoryCard key={cat.id} category={cat} />
              ))}
            </div>
          </SectionCard>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <AlertTriangle size={28} style={{ color: '#374151' }} />
          <p className="text-sm" style={{ color: '#9CA3AF' }}>{error || 'Could not run check'}</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg px-3 py-2.5"
          style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <AlertTriangle size={14} style={{ color: '#EF4444' }} />
          <p className="text-xs" style={{ color: '#FCA5A5' }}>{error}</p>
        </div>
      )}

      {/* Ofsted framework guide */}
      <SectionCard title="Ofsted Inspection Framework">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[
            { area: 'Quality of Education', desc: 'Intent, implementation, and impact of the curriculum.' },
            { area: 'Behaviour & Attitudes', desc: 'Attendance, punctuality, conduct, and school culture.' },
            { area: 'Personal Development', desc: 'PSHE, enrichment, spiritual, moral, social, and cultural development.' },
            { area: 'Leadership & Management', desc: 'Vision, governance, staff wellbeing, safeguarding culture.' },
            { area: 'Safeguarding', desc: 'Section 175 / 157 duties, DBS checks, training records.' },
            { area: 'Early Years (EYFS)', desc: 'If applicable — EYFS statutory framework compliance.' },
          ].map(({ area, desc }) => (
            <div key={area} className="rounded-xl p-4" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937' }}>
              <p className="text-sm font-semibold mb-1" style={{ color: '#F9FAFB' }}>{area}</p>
              <p className="text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>{desc}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {packText && <PackViewer text={packText} onClose={() => setPackText(null)} />}
    </PageShell>
  )
}
