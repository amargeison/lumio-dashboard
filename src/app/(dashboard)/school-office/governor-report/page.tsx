'use client'

import { useState, useEffect, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  FileText, Sparkles, X, Loader2, CheckCircle2, AlertTriangle,
  ChevronRight, ChevronLeft, Edit3, Send, Download, Archive,
  Eye, EyeOff, Clock, BadgeCheck, Mail,
} from 'lucide-react'
import { PageShell, SectionCard, StatCard } from '@/components/page-ui'
import { ChartSection, parseNum } from '@/components/chart-ui'
import Link from 'next/link'

// ─── Supabase ──────────────────────────────────────────────────────────────────

function useSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ReportRecord {
  id: string
  report_type: string
  reporting_period: string
  period_label: string
  headteacher_name: string
  word_count: number | null
  status: string
  emailed_to: string | null
  created_at: string
}

interface GeneratedReport {
  status: string
  id: string | null
  report_type: string
  period_label: string
  headteacher_name: string
  report_text: string
  word_count: number
  tokens_used: number
  data_snapshot: Record<string, unknown>
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const REPORT_TYPES = [
  'Full Governors Report',
  'Finance Summary',
  'Attendance Report',
  'Safeguarding Report',
  'Pupil Progress Update',
]

const REPORTING_PERIODS = ['Half term', 'Term', 'Full year']

const SECTIONS_BY_TYPE: Record<string, string[]> = {
  'Full Governors Report': [
    'Executive Summary',
    'Attendance & Absence',
    'Safeguarding & Welfare',
    'Teaching & Learning',
    'Pupil Progress & Attainment',
    'SEND & Inclusion',
    'Staffing & Workforce',
    'Finance Overview',
    'Premises & Health & Safety',
    'Parental Engagement',
    'Priorities & Next Steps',
  ],
  'Finance Summary': [
    'Budget Overview',
    'Expenditure to Date',
    'Supply Cover Costs',
    'Staffing Costs',
    'Premises & Facilities',
    'Forecast & Variances',
    'Risks & Mitigations',
  ],
  'Attendance Report': [
    'Overall Attendance Summary',
    'Persistent Absence Analysis',
    'Cohort Breakdown',
    'Intervention Activity',
    'EWO Referrals',
    'Trends & Comparison',
    'Actions & Next Steps',
  ],
  'Safeguarding Report': [
    'DSL Report',
    'Concerns Summary',
    'Looked After Children',
    'SEND & Vulnerability',
    'Staff Training & DBS',
    'KCSIE Compliance',
    'Actions & Referrals',
  ],
  'Pupil Progress Update': [
    'Overall Progress Summary',
    'Cohort Headlines',
    'SEND Progress',
    'Pupil Premium Impact',
    'Interventions in Place',
    'Assessment Data',
    'Actions & Support Plans',
  ],
}

// ─── Simple markdown renderer ──────────────────────────────────────────────────

function renderMarkdown(text: string): string {
  return text
    .replace(/^## (.+)$/gm, '<h2 style="font-size:1.1rem;font-weight:700;color:#F9FAFB;margin:1.5rem 0 0.5rem">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 style="font-size:0.95rem;font-weight:600;color:#E5E7EB;margin:1.25rem 0 0.4rem">$1</h3>')
    .replace(/^#### (.+)$/gm, '<h4 style="font-size:0.875rem;font-weight:600;color:#D1D5DB;margin:1rem 0 0.3rem">$1</h4>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#F9FAFB">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li style="margin:0.25rem 0;padding-left:1rem;list-style:disc;display:list-item">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li style="margin:0.25rem 0;padding-left:1rem;list-style:decimal;display:list-item">$2</li>')
    .replace(/\n{2,}/g, '</p><p style="margin:0.5rem 0">')
    .replace(/^(?!<[h|l])(.+)$/gm, '<p style="margin:0.5rem 0;color:#D1D5DB;line-height:1.7">$1</p>')
    .replace(/<p[^>]*>\s*<\/p>/g, '')
}

// ─── Generator Modal ──────────────────────────────────────────────────────────

interface GeneratorModalProps {
  onClose: () => void
  onGenerated: (report: GeneratedReport) => void
}

function GeneratorModal({ onClose, onGenerated }: GeneratorModalProps) {
  const [reportType, setReportType]         = useState('Full Governors Report')
  const [period, setPeriod]                 = useState('Term')
  const [headteacher, setHeadteacher]       = useState('Mrs S. Okafor')
  const [sections, setSections]             = useState<string[]>(() => SECTIONS_BY_TYPE['Full Governors Report'])
  const [generating, setGenerating]         = useState(false)
  const [error, setError]                   = useState('')

  // Update sections when report type changes
  function handleTypeChange(type: string) {
    setReportType(type)
    setSections(SECTIONS_BY_TYPE[type] ?? [])
  }

  function toggleSection(s: string) {
    setSections(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!headteacher.trim()) { setError('Headteacher name required.'); return }
    if (sections.length === 0) { setError('Select at least one section.'); return }

    setGenerating(true)
    setError('')
    try {
      const res = await fetch('/api/workflows/school/governor-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_type: reportType,
          reporting_period: period,
          sections_included: sections,
          headteacher_name: headteacher.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Generation failed.'); return }
      onGenerated(data as GeneratedReport)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const availableSections = SECTIONS_BY_TYPE[reportType] ?? []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}>
      <div className="w-full max-w-lg rounded-2xl" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: '#1F2937' }}>
          <div className="flex items-center gap-2">
            <Sparkles size={18} style={{ color: '#A855F7' }} />
            <h2 className="text-base font-semibold" style={{ color: '#F9FAFB' }}>AI Governor Report Generator</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-800">
            <X size={16} style={{ color: '#9CA3AF' }} />
          </button>
        </div>

        <form onSubmit={handleGenerate} className="flex flex-col gap-5 px-6 py-5 max-h-[78vh] overflow-y-auto">
          {/* Report type */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>Report Type *</label>
            <select value={reportType} onChange={e => handleTypeChange(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
              style={{ backgroundColor: '#07080F', border: '1px solid #374151', color: '#F9FAFB' }}>
              {REPORT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Reporting period */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: '#9CA3AF' }}>Reporting Period *</label>
            <div className="flex gap-2">
              {REPORTING_PERIODS.map(p => (
                <button key={p} type="button" onClick={() => setPeriod(p)}
                  className="flex-1 rounded-lg py-2 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: period === p ? 'rgba(168,85,247,0.2)' : 'rgba(55,65,81,0.4)',
                    color: period === p ? '#A855F7' : '#9CA3AF',
                    border: `1px solid ${period === p ? '#8B5CF6' : '#374151'}`,
                  }}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Headteacher */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>Headteacher Name *</label>
            <input value={headteacher} onChange={e => setHeadteacher(e.target.value)}
              placeholder="Full name…"
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
              style={{ backgroundColor: '#07080F', border: '1px solid #374151', color: '#F9FAFB' }} />
          </div>

          {/* Sections */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>Include Sections</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setSections(availableSections)}
                  className="text-xs" style={{ color: '#6B7280' }}>All</button>
                <span style={{ color: '#374151' }}>·</span>
                <button type="button" onClick={() => setSections([])}
                  className="text-xs" style={{ color: '#6B7280' }}>None</button>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              {availableSections.map(s => {
                const checked = sections.includes(s)
                return (
                  <label key={s}
                    className="flex items-center gap-2.5 cursor-pointer rounded-lg px-3 py-2 transition-colors"
                    style={{ backgroundColor: checked ? 'rgba(168,85,247,0.08)' : 'rgba(55,65,81,0.15)' }}>
                    <div className="flex h-4 w-4 items-center justify-center rounded shrink-0"
                      style={{ backgroundColor: checked ? '#7C3AED' : 'transparent', border: `1.5px solid ${checked ? '#7C3AED' : '#374151'}` }}>
                      {checked && <CheckCircle2 size={10} style={{ color: '#fff' }} />}
                    </div>
                    <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleSection(s)} />
                    <span className="text-xs font-medium" style={{ color: checked ? '#D1D5DB' : '#9CA3AF' }}>{s}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Info box */}
          <div className="rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.15)' }}>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>
              <Sparkles size={11} className="inline mr-1" style={{ color: '#A855F7' }} />
              Claude will pull live attendance, safeguarding, admissions, DBS, and cover data from your Supabase instance to populate the report with real figures.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg px-3 py-2.5"
              style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <AlertTriangle size={14} style={{ color: '#EF4444' }} />
              <p className="text-xs" style={{ color: '#FCA5A5' }}>{error}</p>
            </div>
          )}

          <div className="flex gap-3 pb-1">
            <button type="button" onClick={onClose}
              className="rounded-lg px-4 py-2.5 text-sm font-medium"
              style={{ backgroundColor: 'rgba(55,65,81,0.4)', color: '#9CA3AF', border: '1px solid #374151' }}>
              Cancel
            </button>
            <button type="submit" disabled={generating}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold"
              style={{ backgroundColor: generating ? '#4B5563' : '#7C3AED', color: '#F9FAFB' }}>
              {generating
                ? <><Loader2 size={14} className="animate-spin" /> Generating with Claude AI…</>
                : <><Sparkles size={14} /> Generate Report →</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Report Viewer ────────────────────────────────────────────────────────────

interface ReportViewerProps {
  report: GeneratedReport
  onClose: () => void
  onSaved: (record: ReportRecord) => void
}

function ReportViewer({ report, onClose, onSaved }: ReportViewerProps) {
  const [editing, setEditing]       = useState(false)
  const [text, setText]             = useState(report.report_text)
  const [preview, setPreview]       = useState(true)
  const [emailTo, setEmailTo]       = useState('')
  const [sending, setSending]       = useState(false)
  const [sent, setSent]             = useState(false)
  const [finalised, setFinalised]   = useState(false)
  const [saving, setSaving]         = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  async function handleFinalise() {
    setSaving(true)
    if (report.id) {
      await fetch('/api/workflows/school/governor-report', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: report.id, report_text: text, status: 'Finalised' }),
      })
    }
    setFinalised(true)
    setSaving(false)
    onSaved({
      id: report.id ?? crypto.randomUUID(),
      report_type: report.report_type,
      reporting_period: '',
      period_label: report.period_label,
      headteacher_name: report.headteacher_name,
      word_count: text.split(/\s+/).length,
      status: 'Finalised',
      emailed_to: null,
      created_at: new Date().toISOString(),
    })
  }

  async function handleEmail() {
    if (!emailTo) return
    setSending(true)
    if (report.id) {
      await fetch('/api/workflows/school/governor-report', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: report.id, report_text: text, emailed_to: emailTo }),
      })
    }
    setSent(true)
    setSending(false)
    onSaved({
      id: report.id ?? crypto.randomUUID(),
      report_type: report.report_type,
      reporting_period: '',
      period_label: report.period_label,
      headteacher_name: report.headteacher_name,
      word_count: text.split(/\s+/).length,
      status: 'Sent',
      emailed_to: emailTo,
      created_at: new Date().toISOString(),
    })
  }

  function handlePrint() {
    const w = window.open('', '_blank')
    if (w) {
      w.document.write(`
        <!DOCTYPE html><html><head>
        <title>${report.report_type} — ${report.period_label}</title>
        <style>
          body { font-family: Georgia, serif; font-size: 13px; line-height: 1.8; max-width: 750px; margin: 40px auto; color: #111; }
          h1 { font-size: 1.4rem; border-bottom: 2px solid #333; padding-bottom: 8px; }
          h2 { font-size: 1.15rem; margin-top: 2rem; }
          h3 { font-size: 1rem; }
          li { margin: 4px 0; }
          p { margin: 8px 0; }
          .meta { color: #666; font-size: 0.9rem; margin-bottom: 1.5rem; }
        </style>
        </head><body>
        <h1>${report.report_type}</h1>
        <div class="meta">Period: ${report.period_label} &nbsp;|&nbsp; Headteacher: ${report.headteacher_name} &nbsp;|&nbsp; Generated: ${new Date().toLocaleDateString('en-GB')}</div>
        <div>${text.replace(/\n/g, '<br>')}</div>
        </body></html>
      `)
      w.document.close()
      w.print()
    }
  }

  const wordCount = text.split(/\s+/).filter(Boolean).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}>
      <div className="w-full max-w-4xl rounded-2xl flex flex-col" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', maxHeight: '92vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 shrink-0" style={{ borderColor: '#1F2937' }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full px-3 py-1"
              style={{ backgroundColor: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.2)' }}>
              <Sparkles size={12} style={{ color: '#A855F7' }} />
              <span className="text-xs font-semibold" style={{ color: '#A855F7' }}>AI Generated</span>
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{report.report_type}</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>
                {report.period_label} · {wordCount.toLocaleString()} words · {report.tokens_used.toLocaleString()} tokens
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => { setEditing(v => !v); setPreview(false) }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                backgroundColor: editing ? 'rgba(245,158,11,0.15)' : 'rgba(55,65,81,0.4)',
                color: editing ? '#F59E0B' : '#9CA3AF',
                border: `1px solid ${editing ? '#F59E0B' : '#374151'}`,
              }}>
              <Edit3 size={11} /> {editing ? 'Editing' : 'Edit'}
            </button>
            {!editing && (
              <button type="button" onClick={() => setPreview(v => !v)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                style={{ backgroundColor: 'rgba(55,65,81,0.4)', color: '#9CA3AF', border: '1px solid #374151' }}>
                {preview ? <EyeOff size={11} /> : <Eye size={11} />}
                {preview ? 'Raw' : 'Formatted'}
              </button>
            )}
            <button type="button" onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              style={{ backgroundColor: 'rgba(55,65,81,0.4)', color: '#9CA3AF', border: '1px solid #374151' }}>
              <Download size={11} /> Print / PDF
            </button>
            {!finalised && (
              <button type="button" onClick={handleFinalise} disabled={saving}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
                style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.3)' }}>
                {saving ? <Loader2 size={11} className="animate-spin" /> : <BadgeCheck size={11} />}
                Finalise
              </button>
            )}
            {finalised && (
              <span className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
                style={{ backgroundColor: 'rgba(13,148,136,0.12)', color: '#0D9488' }}>
                <CheckCircle2 size={11} /> Finalised
              </span>
            )}
            <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-800">
              <X size={16} style={{ color: '#9CA3AF' }} />
            </button>
          </div>
        </div>

        {/* Report body */}
        <div ref={printRef} className="flex-1 overflow-y-auto px-8 py-6">
          {editing ? (
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              className="w-full h-full min-h-[500px] resize-none rounded-lg px-4 py-3 text-sm outline-none font-mono leading-relaxed"
              style={{ backgroundColor: '#07080F', border: '1px solid #374151', color: '#F9FAFB' }}
            />
          ) : preview ? (
            <div className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }}
              style={{ color: '#D1D5DB', fontSize: '0.875rem' }}
            />
          ) : (
            <pre className="whitespace-pre-wrap text-sm leading-relaxed"
              style={{ color: '#D1D5DB', fontFamily: 'inherit' }}>
              {text}
            </pre>
          )}
        </div>

        {/* Footer: email to clerk */}
        <div className="border-t px-6 py-4 shrink-0" style={{ borderColor: '#1F2937' }}>
          {sent ? (
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} style={{ color: '#0D9488' }} />
              <span className="text-sm" style={{ color: '#0D9488' }}>Report emailed to governor clerk at {emailTo}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Mail size={13} className="shrink-0" style={{ color: '#6B7280' }} />
              <input
                value={emailTo}
                onChange={e => setEmailTo(e.target.value)}
                type="email"
                placeholder="clerk@governors.example"
                className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: '#07080F', border: '1px solid #374151', color: '#F9FAFB' }}
              />
              <button type="button" onClick={handleEmail} disabled={!emailTo || sending}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shrink-0"
                style={{
                  backgroundColor: emailTo ? '#7C3AED' : 'rgba(55,65,81,0.4)',
                  color: emailTo ? '#F9FAFB' : '#6B7280',
                }}>
                {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                Email to clerk
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    'Draft':     { bg: 'rgba(107,114,128,0.12)', color: '#9CA3AF' },
    'Finalised': { bg: 'rgba(13,148,136,0.12)',  color: '#0D9488' },
    'Sent':      { bg: 'rgba(168,85,247,0.12)',  color: '#A855F7' },
  }
  const c = map[status] ?? map['Draft']
  return (
    <span className="rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: c.bg, color: c.color }}>{status}</span>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function GovernorReportPage() {
  const supabase = useSupabase()
  const [showModal, setShowModal]           = useState(false)
  const [activeReport, setActiveReport]     = useState<GeneratedReport | null>(null)
  const [reports, setReports]               = useState<ReportRecord[]>([])
  const [loading, setLoading]               = useState(true)
  const [draftCount, setDraftCount]         = useState(0)
  const [finalisedCount, setFinalisedCount] = useState(0)
  const [sentCount, setSentCount]           = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase
          .from('school_governor_reports')
          .select('id, report_type, reporting_period, period_label, headteacher_name, word_count, status, emailed_to, created_at')
          .order('created_at', { ascending: false })
          .limit(30)

        if (data) {
          const records = data as ReportRecord[]
          setReports(records)
          setDraftCount(records.filter(r => r.status === 'Draft').length)
          setFinalisedCount(records.filter(r => r.status === 'Finalised').length)
          setSentCount(records.filter(r => r.status === 'Sent').length)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [supabase])

  function handleGenerated(report: GeneratedReport) {
    setShowModal(false)
    setActiveReport(report)
  }

  function handleSaved(record: ReportRecord) {
    setReports(prev => {
      const existing = prev.find(r => r.id === record.id)
      if (existing) return prev.map(r => r.id === record.id ? record : r)
      return [record, ...prev]
    })
    setDraftCount(reports.filter(r => r.status === 'Draft').length)
    setFinalisedCount(reports.filter(r => r.status === 'Finalised').length)
    setSentCount(reports.filter(r => r.status === 'Sent').length)
  }

  const stats = [
    {
      label: 'Reports Generated',
      value: String(loading ? '…' : reports.length),
      trend: 'total archive',
      trendDir: 'up' as const,
      trendGood: true,
      icon: FileText,
      sub: 'all time',
    },
    {
      label: 'Draft',
      value: String(draftCount),
      trend: draftCount > 0 ? 'awaiting review' : 'none',
      trendDir: 'up' as const,
      trendGood: draftCount === 0,
      icon: Edit3,
      sub: 'not yet finalised',
    },
    {
      label: 'Finalised',
      value: String(finalisedCount),
      trend: 'approved',
      trendDir: 'up' as const,
      trendGood: true,
      icon: BadgeCheck,
      sub: 'ready to share',
    },
    {
      label: 'Sent to Clerk',
      value: String(sentCount),
      trend: 'distributed',
      trendDir: 'up' as const,
      trendGood: true,
      icon: Send,
      sub: 'emailed directly',
    },
  ]

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
          style={{ backgroundColor: 'rgba(168,85,247,0.08)', color: '#A855F7', border: '1px solid rgba(168,85,247,0.2)' }}>
          <Sparkles size={12} /> Governor Reports
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>AI Governor Report Generator</h2>
          <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
            Generate professional governor reports from live school data — attendance, safeguarding, admissions, DBS, and more
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
          style={{ backgroundColor: '#7C3AED', color: '#F9FAFB' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#6D28D9' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#7C3AED' }}>
          <Sparkles size={15} />
          Generate Report
        </button>
      </div>

      {/* Stats */}
      <ChartSection points={stats.map(s => ({ label: s.label, value: parseNum(s.value) }))}>
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {stats.map(s => <StatCard key={s.label} {...s} />)}
        </div>
      </ChartSection>

      {/* What's included info panel */}
      <div className="rounded-xl px-5 py-4" style={{ backgroundColor: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.15)' }}>
        <div className="flex items-start gap-3">
          <Sparkles size={16} className="shrink-0 mt-0.5" style={{ color: '#A855F7' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Live Data, Professional Output</p>
            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#9CA3AF' }}>
              Claude reads your Supabase data in real time — attendance figures, safeguarding case counts, DBS compliance status, new admissions, supply cover costs, and parent communications — and writes a fully structured, DfE-aligned governor report ready to present at FGB.
            </p>
          </div>
        </div>
      </div>

      {/* Report archive */}
      <SectionCard title="Report Archive">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={20} className="animate-spin" style={{ color: '#9CA3AF' }} />
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <FileText size={32} style={{ color: '#374151' }} />
            <p className="text-sm" style={{ color: '#9CA3AF' }}>No reports generated yet</p>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold"
              style={{ backgroundColor: 'rgba(168,85,247,0.15)', color: '#A855F7', border: '1px solid rgba(168,85,247,0.3)' }}>
              <Sparkles size={13} /> Generate your first governor report
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #1F2937' }}>
                  {['Report Type', 'Period', 'Headteacher', 'Words', 'Status', 'Sent To', 'Date'].map(h => (
                    <th key={h} className="pb-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: '#6B7280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#1F2937' }}>
                {reports.map(r => (
                  <tr key={r.id}>
                    <td className="py-3 pr-4 text-sm font-medium" style={{ color: '#F9FAFB' }}>{r.report_type}</td>
                    <td className="py-3 pr-4 text-xs" style={{ color: '#9CA3AF' }}>{r.period_label}</td>
                    <td className="py-3 pr-4 text-xs" style={{ color: '#9CA3AF' }}>{r.headteacher_name}</td>
                    <td className="py-3 pr-4 text-xs" style={{ color: '#6B7280' }}>
                      {r.word_count != null ? r.word_count.toLocaleString() : '—'}
                    </td>
                    <td className="py-3 pr-4"><StatusBadge status={r.status} /></td>
                    <td className="py-3 pr-4 text-xs max-w-[140px] truncate" style={{ color: '#6B7280' }}>
                      {r.emailed_to ?? '—'}
                    </td>
                    <td className="py-3 text-xs whitespace-nowrap" style={{ color: '#6B7280' }}>
                      {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Report types guide */}
      <SectionCard title="Available Report Types">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[
            { type: 'Full Governors Report', desc: 'Comprehensive overview of all school areas — ideal for termly FGB meetings.', sections: 11 },
            { type: 'Finance Summary', desc: 'Budget performance, supply costs, staffing expenditure and forecast.', sections: 7 },
            { type: 'Attendance Report', desc: 'Attendance analysis, persistent absence data, and intervention summary.', sections: 7 },
            { type: 'Safeguarding Report', desc: 'DSL overview, concern log, DBS compliance, and KCSIE status.', sections: 7 },
            { type: 'Pupil Progress Update', desc: 'Progress headlines, SEND overview, pupil premium impact, interventions.', sections: 7 },
          ].map(({ type, desc, sections }) => (
            <div key={type} className="rounded-xl p-4" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{type}</p>
                <span className="text-xs" style={{ color: '#4B5563' }}>{sections} sections</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>{desc}</p>
              <button type="button"
                onClick={() => setShowModal(true)}
                className="mt-3 text-xs font-medium" style={{ color: '#A855F7' }}>
                Generate →
              </button>
            </div>
          ))}
        </div>
      </SectionCard>

      {showModal && (
        <GeneratorModal onClose={() => setShowModal(false)} onGenerated={handleGenerated} />
      )}
      {activeReport && (
        <ReportViewer
          report={activeReport}
          onClose={() => setActiveReport(null)}
          onSaved={handleSaved}
        />
      )}
    </PageShell>
  )
}
