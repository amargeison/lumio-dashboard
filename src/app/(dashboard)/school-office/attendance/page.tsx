'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  AlertTriangle, Plus, X, Loader2, CheckCircle2,
  ChevronRight, ChevronLeft, Users, Phone, Mail,
  MessageSquare, TrendingDown, Clock, FileText, Shield,
  ChevronDown, ChevronUp,
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

interface ContactEntry {
  at: string
  method: string
  outcome: string
}

interface Concern {
  id: string
  pupil_name: string
  year_group: string
  class_name: string | null
  attendance_pct: number
  absences_count: number
  term: string
  escalation_stage: number
  stage_triggered_at: string
  contact_log: ContactEntry[]
  status: string
  generated_letter: string | null
  ewo_referred: boolean
  created_at: string
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const YEAR_GROUPS = [
  'Reception', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6',
  'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11',
]

const STAGE_INFO: Record<number, { label: string; desc: string; colour: string; bg: string }> = {
  1: { label: 'Stage 1', desc: 'Informal letter', colour: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  2: { label: 'Stage 2', desc: 'Formal warning + meeting', colour: '#F97316', bg: 'rgba(249,115,22,0.12)' },
  3: { label: 'Stage 3', desc: 'EWO referral', colour: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
}

const CONTACT_METHODS = ['Phone Call', 'Home Visit', 'Letter Sent', 'Email', 'Text/SMS', 'Meeting', 'Other']
const CONTACT_OUTCOMES = ['No answer', 'Left voicemail', 'Spoke to parent', 'No one home', 'Referred to EWO', 'Issue resolved', 'Meeting arranged']

function currentTermDisplay(): string {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  if (month >= 9) return `Autumn ${year}`
  if (month <= 1) return `Autumn ${year - 1}`
  if (month <= 3) return `Spring ${year}`
  return `Summer ${year}`
}

// ─── New Concern Modal ─────────────────────────────────────────────────────────

interface NewConcernModalProps {
  onClose: () => void
  onCreated: (concern: Concern) => void
}

function NewConcernModal({ onClose, onCreated }: NewConcernModalProps) {
  const [pupilName, setPupilName]     = useState('')
  const [yearGroup, setYearGroup]     = useState('')
  const [attendancePct, setAttendancePct] = useState('88')
  const [absencesCount, setAbsencesCount] = useState('')
  const [totalSessions, setTotalSessions] = useState('')
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState('')

  const pct = parseFloat(attendancePct) || 0
  const stage = pct <= 80 ? 3 : pct <= 85 ? 2 : 1

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!pupilName.trim()) { setError('Pupil name required.'); return }
    if (!yearGroup) { setError('Year group required.'); return }
    if (isNaN(pct) || pct < 0 || pct > 100) { setError('Enter a valid attendance percentage.'); return }

    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/workflows/school/attendance-concerns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_concern',
          pupil_name: pupilName.trim(),
          year_group: yearGroup,
          attendance_pct: pct,
          absences_count: parseInt(absencesCount) || 0,
          total_sessions: parseInt(totalSessions) || 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong.'); return }

      onCreated({
        id: data.id ?? crypto.randomUUID(),
        pupil_name: pupilName.trim(),
        year_group: yearGroup,
        class_name: null,
        attendance_pct: pct,
        absences_count: parseInt(absencesCount) || 0,
        term: currentTermDisplay(),
        escalation_stage: stage,
        stage_triggered_at: new Date().toISOString(),
        contact_log: [],
        status: 'Open',
        generated_letter: null,
        ewo_referred: stage === 3,
        created_at: new Date().toISOString(),
      })
      onClose()
    } catch {
      setError('Network error.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full max-w-md rounded-2xl" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: '#1F2937' }}>
          <div className="flex items-center gap-2">
            <TrendingDown size={18} style={{ color: '#F59E0B' }} />
            <h2 className="text-base font-semibold" style={{ color: '#F9FAFB' }}>Raise Attendance Concern</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-800"><X size={16} style={{ color: '#9CA3AF' }} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-5">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>Pupil Name *</label>
            <input value={pupilName} onChange={e => setPupilName(e.target.value)}
              placeholder="Full name…"
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
              style={{ backgroundColor: '#07080F', border: '1px solid #374151', color: '#F9FAFB' }} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>Year Group *</label>
              <select value={yearGroup} onChange={e => setYearGroup(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{ backgroundColor: '#07080F', border: '1px solid #374151', color: '#F9FAFB' }}>
                <option value="">Select…</option>
                {YEAR_GROUPS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>Attendance % *</label>
              <input type="number" min="0" max="100" step="0.1"
                value={attendancePct} onChange={e => setAttendancePct(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{ backgroundColor: '#07080F', border: '1px solid #374151', color: '#F9FAFB' }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>Absences (sessions)</label>
              <input type="number" min="0" value={absencesCount} onChange={e => setAbsencesCount(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{ backgroundColor: '#07080F', border: '1px solid #374151', color: '#F9FAFB' }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>Total Sessions</label>
              <input type="number" min="0" value={totalSessions} onChange={e => setTotalSessions(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{ backgroundColor: '#07080F', border: '1px solid #374151', color: '#F9FAFB' }} />
            </div>
          </div>

          {/* Stage preview */}
          {attendancePct && (
            <div className="rounded-lg px-3 py-2.5" style={{ backgroundColor: STAGE_INFO[stage].bg, border: `1px solid ${STAGE_INFO[stage].colour}40` }}>
              <p className="text-xs font-semibold" style={{ color: STAGE_INFO[stage].colour }}>
                {STAGE_INFO[stage].label}: {STAGE_INFO[stage].desc}
                {stage === 3 && ' — EWO referral will be triggered'}
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-lg px-3 py-2.5"
              style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <AlertTriangle size={14} style={{ color: '#EF4444' }} />
              <p className="text-xs" style={{ color: '#FCA5A5' }}>{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="rounded-lg px-4 py-2.5 text-sm font-medium"
              style={{ backgroundColor: 'rgba(55,65,81,0.4)', color: '#9CA3AF', border: '1px solid #374151' }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold"
              style={{ backgroundColor: '#F59E0B', color: '#07080F' }}>
              {submitting ? <><Loader2 size={14} className="animate-spin" /> Raising…</> : 'Raise Concern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Log Contact Modal ─────────────────────────────────────────────────────────

interface LogContactModalProps {
  concern: Concern
  onClose: () => void
  onLogged: (concernId: string, entry: ContactEntry) => void
}

function LogContactModal({ concern, onClose, onLogged }: LogContactModalProps) {
  const [method, setMethod]   = useState('')
  const [outcome, setOutcome] = useState('')
  const [saving, setSaving]   = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!method || !outcome) return
    setSaving(true)
    try {
      await fetch('/api/workflows/school/attendance-concerns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'log_contact', concern_id: concern.id, contact_entry: { method, outcome } }),
      })
      onLogged(concern.id, { at: new Date().toISOString(), method, outcome })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full max-w-sm rounded-2xl" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: '#1F2937' }}>
          <h2 className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Log Contact — {concern.pupil_name}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-800"><X size={14} style={{ color: '#9CA3AF' }} /></button>
        </div>
        <form onSubmit={handleSave} className="flex flex-col gap-3 px-5 py-4">
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: '#9CA3AF' }}>Contact Method</label>
            <div className="flex flex-wrap gap-1.5">
              {CONTACT_METHODS.map(m => (
                <button key={m} type="button" onClick={() => setMethod(m)}
                  className="rounded-lg px-2.5 py-1 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: method === m ? 'rgba(245,158,11,0.2)' : 'rgba(55,65,81,0.4)',
                    color: method === m ? '#F59E0B' : '#9CA3AF',
                    border: `1px solid ${method === m ? '#F59E0B' : '#374151'}`,
                  }}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: '#9CA3AF' }}>Outcome</label>
            <div className="flex flex-wrap gap-1.5">
              {CONTACT_OUTCOMES.map(o => (
                <button key={o} type="button" onClick={() => setOutcome(o)}
                  className="rounded-lg px-2.5 py-1 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: outcome === o ? 'rgba(13,148,136,0.2)' : 'rgba(55,65,81,0.4)',
                    color: outcome === o ? '#0D9488' : '#9CA3AF',
                    border: `1px solid ${outcome === o ? '#0D9488' : '#374151'}`,
                  }}>
                  {o}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-medium"
              style={{ backgroundColor: 'rgba(55,65,81,0.4)', color: '#9CA3AF', border: '1px solid #374151' }}>
              Cancel
            </button>
            <button type="submit" disabled={!method || !outcome || saving}
              className="flex-1 rounded-lg py-2 text-xs font-semibold"
              style={{ backgroundColor: method && outcome ? '#0D9488' : 'rgba(55,65,81,0.4)', color: method && outcome ? '#F9FAFB' : '#6B7280' }}>
              {saving ? 'Saving…' : 'Log Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Concern Row ──────────────────────────────────────────────────────────────

function ConcernRow({
  concern,
  onLogContact,
  onResolve,
}: {
  concern: Concern
  onLogContact: (c: Concern) => void
  onResolve: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const s = STAGE_INFO[concern.escalation_stage]

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1F2937' }}>
      <div
        className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-gray-800/30 transition-colors"
        onClick={() => setExpanded(v => !v)}>
        {/* Stage badge */}
        <span className="rounded-full px-2 py-0.5 text-xs font-semibold shrink-0"
          style={{ backgroundColor: s.bg, color: s.colour }}>{s.label}</span>

        {/* Pupil info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{concern.pupil_name}</span>
            <span className="text-xs" style={{ color: '#6B7280' }}>{concern.year_group}</span>
            {concern.ewo_referred && (
              <span className="rounded-full px-2 py-0.5 text-xs" style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>EWO Referred</span>
            )}
          </div>
          <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
            {concern.attendance_pct.toFixed(1)}% attendance · {concern.absences_count} sessions absent · {concern.term}
          </p>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs" style={{ color: '#6B7280' }}>{concern.contact_log.length} contact{concern.contact_log.length !== 1 ? 's' : ''}</span>
          {expanded ? <ChevronUp size={14} style={{ color: '#6B7280' }} /> : <ChevronDown size={14} style={{ color: '#6B7280' }} />}
        </div>
      </div>

      {expanded && (
        <div className="border-t px-4 py-4" style={{ borderColor: '#1F2937', backgroundColor: 'rgba(7,8,15,0.5)' }}>
          {/* Contact log */}
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#6B7280' }}>Contact Log</p>
          {concern.contact_log.length === 0 ? (
            <p className="text-xs mb-3" style={{ color: '#4B5563' }}>No contact attempts recorded</p>
          ) : (
            <div className="flex flex-col gap-1.5 mb-3">
              {concern.contact_log.map((entry, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span style={{ color: '#6B7280' }}>
                    {new Date(entry.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                  <span className="rounded px-1.5 py-0.5" style={{ backgroundColor: 'rgba(55,65,81,0.4)', color: '#D1D5DB' }}>{entry.method}</span>
                  <span style={{ color: '#9CA3AF' }}>→</span>
                  <span style={{ color: '#D1D5DB' }}>{entry.outcome}</span>
                </div>
              ))}
            </div>
          )}

          {/* Escalation info */}
          <div className="rounded-lg px-3 py-2.5 mb-3" style={{ backgroundColor: s.bg, border: `1px solid ${s.colour}30` }}>
            <p className="text-xs font-semibold" style={{ color: s.colour }}>{s.label}: {s.desc}</p>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
              {concern.escalation_stage === 1 && 'Informal parent letter sent or to be sent. Monitor closely.'}
              {concern.escalation_stage === 2 && 'Formal attendance warning issued. Meeting requested with parents.'}
              {concern.escalation_stage === 3 && 'Education Welfare Officer referral triggered. Legal action may follow.'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            <button type="button" onClick={() => onLogContact(concern)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
              style={{ backgroundColor: 'rgba(55,65,81,0.4)', color: '#9CA3AF', border: '1px solid #374151' }}>
              <Phone size={11} /> Log Contact
            </button>
            <button type="button" onClick={() => onResolve(concern.id)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
              style={{ backgroundColor: 'rgba(13,148,136,0.12)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.25)' }}>
              <CheckCircle2 size={11} /> Mark Resolved
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AttendanceConcernsPage() {
  const supabase = useSupabase()
  const [showModal, setShowModal]           = useState(false)
  const [logContactFor, setLogContactFor]   = useState<Concern | null>(null)
  const [concerns, setConcerns]             = useState<Concern[]>([])
  const [loading, setLoading]               = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase
          .from('school_attendance_concerns')
          .select('*')
          .order('attendance_pct', { ascending: true })
          .limit(100)

        if (data) setConcerns(data as Concern[])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [supabase])

  function handleCreated(concern: Concern) {
    setConcerns(prev => [concern, ...prev].sort((a, b) => a.attendance_pct - b.attendance_pct))
    setShowModal(false)
  }

  function handleContactLogged(concernId: string, entry: ContactEntry) {
    setConcerns(prev => prev.map(c =>
      c.id === concernId ? { ...c, contact_log: [...c.contact_log, entry] } : c
    ))
  }

  async function handleResolve(id: string) {
    await fetch('/api/workflows/school/attendance-concerns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resolve', concern_id: id }),
    })
    setConcerns(prev => prev.map(c => c.id === id ? { ...c, status: 'Resolved' } : c))
  }

  const openConcerns     = concerns.filter(c => c.status === 'Open')
  const resolvedConcerns = concerns.filter(c => c.status !== 'Open')

  const below90 = openConcerns.filter(c => c.attendance_pct <= 90).length
  const below85 = openConcerns.filter(c => c.attendance_pct <= 85).length
  const below80 = openConcerns.filter(c => c.attendance_pct <= 80).length
  const ewoCount = openConcerns.filter(c => c.ewo_referred).length

  const stats = [
    {
      label: 'Below 90%',
      value: String(below90),
      trend: 'persistent absence',
      trendDir: 'up' as const,
      trendGood: false,
      icon: TrendingDown,
      sub: 'stage 1+ cases',
    },
    {
      label: 'Below 85%',
      value: String(below85),
      trend: 'formal warning',
      trendDir: 'up' as const,
      trendGood: false,
      icon: AlertTriangle,
      sub: 'stage 2 cases',
    },
    {
      label: 'Below 80%',
      value: String(below80),
      trend: below80 > 0 ? 'EWO referral' : 'none',
      trendDir: 'up' as const,
      trendGood: below80 === 0,
      icon: Shield,
      sub: 'stage 3 cases',
    },
    {
      label: 'Open Cases',
      value: String(loading ? '…' : openConcerns.length),
      trend: ewoCount > 0 ? `${ewoCount} EWO referred` : 'active',
      trendDir: 'up' as const,
      trendGood: openConcerns.length === 0,
      icon: FileText,
      sub: 'this term',
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
          style={{ backgroundColor: 'rgba(245,158,11,0.08)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)' }}>
          <TrendingDown size={12} /> Persistent Absence
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Persistent Absence Escalation</h2>
          <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
            3-stage escalation ladder — informal letter → formal warning → EWO referral. Full audit trail per pupil.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
          style={{ backgroundColor: '#F59E0B', color: '#07080F' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#D97706' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F59E0B' }}>
          <Plus size={15} />
          Raise Concern
        </button>
      </div>

      {/* Stats */}
      <ChartSection points={stats.map(s => ({ label: s.label, value: parseNum(s.value) }))}>
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {stats.map(s => <StatCard key={s.label} {...s} />)}
        </div>
      </ChartSection>

      {/* EWO alert */}
      {below80 > 0 && (
        <div className="flex items-start gap-3 rounded-xl px-5 py-4"
          style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <Shield size={16} className="shrink-0 mt-0.5" style={{ color: '#EF4444' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>
              {below80} pupil{below80 !== 1 ? 's' : ''} below 80% — EWO referral required
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
              Education Welfare Officer has been notified via n8n. Legal action process may be initiated if attendance does not improve.
            </p>
          </div>
        </div>
      )}

      {/* Open concerns */}
      <SectionCard title={`Open Concerns (${openConcerns.length})`}>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={20} className="animate-spin" style={{ color: '#9CA3AF' }} />
          </div>
        ) : openConcerns.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10">
            <CheckCircle2 size={28} style={{ color: '#374151' }} />
            <p className="text-sm" style={{ color: '#9CA3AF' }}>No open attendance concerns</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {openConcerns.map(c => (
              <ConcernRow key={c.id} concern={c}
                onLogContact={setLogContactFor}
                onResolve={handleResolve} />
            ))}
          </div>
        )}
      </SectionCard>

      {/* Resolved */}
      {resolvedConcerns.length > 0 && (
        <SectionCard title={`Resolved (${resolvedConcerns.length})`}>
          <div className="divide-y" style={{ borderColor: '#1F2937' }}>
            {resolvedConcerns.map(c => (
              <div key={c.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium" style={{ color: '#9CA3AF' }}>{c.pupil_name}</p>
                  <p className="text-xs" style={{ color: '#4B5563' }}>{c.year_group} · {c.attendance_pct.toFixed(1)}% · {c.term}</p>
                </div>
                <span className="rounded-full px-2 py-0.5 text-xs" style={{ backgroundColor: 'rgba(13,148,136,0.12)', color: '#0D9488' }}>Resolved</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Escalation ladder guide */}
      <SectionCard title="Escalation Ladder">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { stage: 1, threshold: '≤90%', title: 'Informal Letter', desc: 'Personalised AI-generated letter to parents noting concern. Class teacher and attendance officer notified. Monitored weekly.', colour: '#F59E0B' },
            { stage: 2, threshold: '≤85%', title: 'Formal Warning', desc: 'Formal attendance warning letter issued. Parents invited to meeting. n8n triggers meeting request email automatically.', colour: '#F97316' },
            { stage: 3, threshold: '≤80%', title: 'EWO Referral', desc: 'Education Welfare Officer notified. Full contact log exported. Legal action process may begin.', colour: '#EF4444' },
          ].map(({ stage, threshold, title, desc, colour }) => (
            <div key={stage} className="rounded-xl p-4" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="rounded-full px-2.5 py-1 text-xs font-bold"
                  style={{ backgroundColor: `${colour}20`, color: colour }}>{threshold}</span>
                <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{title}</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>{desc}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {showModal && <NewConcernModal onClose={() => setShowModal(false)} onCreated={handleCreated} />}
      {logContactFor && (
        <LogContactModal
          concern={logContactFor}
          onClose={() => setLogContactFor(null)}
          onLogged={handleContactLogged}
        />
      )}
    </PageShell>
  )
}
