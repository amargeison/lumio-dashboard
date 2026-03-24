'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  ShieldAlert, Plus, X, Loader2, CheckCircle2, AlertTriangle,
  Clock, Lock, FileText, Users, Eye, EyeOff,
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

interface SafeguardingRecord {
  id: string
  ref_number: string
  pupil_name: string
  year_group: string
  incident_at: string
  concern_type: string
  description: string
  reported_by: string
  witnessed: boolean
  action_taken: string | null
  is_urgent: boolean
  status: string
  created_at: string
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const YEAR_GROUPS = [
  'Reception', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6',
  'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11',
]

const CONCERN_TYPES = [
  'Physical', 'Emotional', 'Sexual', 'Neglect',
  'Peer-on-Peer', 'Online Safety', 'Radicalisation', 'Other',
]

const CONCERN_COLOURS: Record<string, { bg: string; color: string }> = {
  'Physical':       { bg: 'rgba(239,68,68,0.12)',  color: '#EF4444' },
  'Emotional':      { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B' },
  'Sexual':         { bg: 'rgba(239,68,68,0.18)',  color: '#DC2626' },
  'Neglect':        { bg: 'rgba(245,158,11,0.18)', color: '#D97706' },
  'Peer-on-Peer':   { bg: 'rgba(168,85,247,0.12)', color: '#A855F7' },
  'Online Safety':  { bg: 'rgba(59,130,246,0.12)', color: '#3B82F6' },
  'Radicalisation': { bg: 'rgba(239,68,68,0.2)',   color: '#B91C1C' },
  'Other':          { bg: 'rgba(107,114,128,0.12)',color: '#9CA3AF' },
}

function nowLocalISO(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ─── New Concern Modal ─────────────────────────────────────────────────────────

interface ModalProps {
  onClose: () => void
  onLogged: (record: SafeguardingRecord) => void
}

function NewConcernModal({ onClose, onLogged }: ModalProps) {
  const [pupilName, setPupilName]     = useState('')
  const [yearGroup, setYearGroup]     = useState('')
  const [incidentAt, setIncidentAt]   = useState(nowLocalISO())
  const [concernType, setConcernType] = useState('')
  const [description, setDescription] = useState('')
  const [reportedBy, setReportedBy]   = useState('')
  const [witnessed, setWitnessed]     = useState(false)
  const [actionTaken, setActionTaken] = useState('')
  const [isUrgent, setIsUrgent]       = useState(false)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [result, setResult]           = useState<{ ref_number: string; is_urgent: boolean } | null>(null)

  async function handleSubmit() {
    if (!pupilName.trim())    { setError('Pupil name is required.'); return }
    if (!yearGroup)           { setError('Please select a year group.'); return }
    if (!concernType)         { setError('Please select a concern type.'); return }
    if (!description.trim())  { setError('Description is required.'); return }
    if (!reportedBy.trim())   { setError('Reported by is required.'); return }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/workflows/school/safeguarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pupil_name: pupilName.trim(),
          year_group: yearGroup,
          incident_at: new Date(incidentAt).toISOString(),
          concern_type: concernType,
          description: description.trim(),
          reported_by: reportedBy.trim(),
          witnessed,
          action_taken: actionTaken.trim() || null,
          is_urgent: isUrgent,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error || `Error ${res.status}`)
      }

      const data = await res.json()
      setResult({ ref_number: data.ref_number, is_urgent: data.is_urgent })

      const local: SafeguardingRecord = {
        id: data.id ?? crypto.randomUUID(),
        ref_number: data.ref_number,
        pupil_name: pupilName.trim(),
        year_group: yearGroup,
        incident_at: new Date(incidentAt).toISOString(),
        concern_type: concernType,
        description: description.trim(),
        reported_by: reportedBy.trim(),
        witnessed,
        action_taken: actionTaken.trim() || null,
        is_urgent: isUrgent,
        status: 'Open',
        created_at: new Date().toISOString(),
      }
      onLogged(local)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to log concern.')
    } finally {
      setSaving(false)
    }
  }

  // Success screen
  if (result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
        <div className="w-full max-w-md rounded-2xl p-8 flex flex-col items-center gap-4 text-center"
          style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: result.is_urgent ? 'rgba(239,68,68,0.15)' : 'rgba(13,148,136,0.15)' }}>
            {result.is_urgent
              ? <AlertTriangle size={26} style={{ color: '#EF4444' }} />
              : <Lock size={26} style={{ color: '#0D9488' }} />}
          </div>
          <div>
            <p className="text-base font-bold" style={{ color: '#F9FAFB' }}>Concern Logged & Locked</p>
            <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>
              Reference: <span className="font-mono font-semibold" style={{ color: '#A78BFA' }}>{result.ref_number}</span>
            </p>
          </div>
          <div className="w-full rounded-lg px-4 py-3 text-sm text-left"
            style={{ backgroundColor: '#07080F', border: '1px solid #1F2937' }}>
            <p className="flex items-center gap-2" style={{ color: '#9CA3AF' }}>
              <CheckCircle2 size={13} style={{ color: '#0D9488' }} /> DSL notified by email and SMS
            </p>
            <p className="flex items-center gap-2 mt-1.5" style={{ color: '#9CA3AF' }}>
              <Lock size={13} style={{ color: '#6C3FC5' }} /> Record is locked — immutable audit trail
            </p>
            {result.is_urgent && (
              <p className="flex items-center gap-2 mt-1.5" style={{ color: '#EF4444' }}>
                <AlertTriangle size={13} /> Urgent flag — red banner active on SLT logins
              </p>
            )}
          </div>
          <button onClick={onClose}
            className="mt-2 px-6 py-2 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-lg rounded-2xl flex flex-col max-h-[94vh]"
        style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.06)' }}>
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} style={{ color: '#EF4444' }} />
            <p className="text-base font-semibold" style={{ color: '#F9FAFB' }}>New Safeguarding Concern</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-white/5 transition-colors"
            style={{ color: '#9CA3AF' }}>
            <X size={18} />
          </button>
        </div>

        {/* Urgent toggle banner */}
        <button
          onClick={() => setIsUrgent(v => !v)}
          className="flex items-center justify-between px-6 py-3 shrink-0 transition-colors"
          style={{
            backgroundColor: isUrgent ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.02)',
            borderBottom: `1px solid ${isUrgent ? 'rgba(239,68,68,0.3)' : '#1F2937'}`,
          }}>
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} style={{ color: isUrgent ? '#EF4444' : '#6B7280' }} />
            <span className="text-sm font-medium" style={{ color: isUrgent ? '#EF4444' : '#9CA3AF' }}>
              {isUrgent ? 'URGENT — immediate DSL action required' : 'Mark as urgent'}
            </span>
          </div>
          <div className="relative h-5 w-9 rounded-full transition-colors flex items-center"
            style={{ backgroundColor: isUrgent ? '#EF4444' : '#374151' }}>
            <div className="absolute h-3.5 w-3.5 rounded-full bg-white transition-all"
              style={{ left: isUrgent ? '18px' : '3px' }} />
          </div>
        </button>

        {/* Body */}
        <div className="flex flex-col gap-4 overflow-y-auto px-6 py-5">

          {/* Pupil + year group */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>
                Pupil Name <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input value={pupilName} onChange={e => setPupilName(e.target.value)}
                placeholder="Full name"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB' }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>
                Year Group <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select value={yearGroup} onChange={e => setYearGroup(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: yearGroup ? '#F9FAFB' : '#6B7280' }}>
                <option value="" disabled>Select...</option>
                {YEAR_GROUPS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {/* Date/time + reported by */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>Date & Time of Incident</label>
              <input type="datetime-local" value={incidentAt} onChange={e => setIncidentAt(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB' }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>
                Reported By <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input value={reportedBy} onChange={e => setReportedBy(e.target.value)}
                placeholder="Staff member name"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB' }} />
            </div>
          </div>

          {/* Concern type */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: '#9CA3AF' }}>
              Concern Type <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {CONCERN_TYPES.map(t => {
                const c = CONCERN_COLOURS[t]
                const isSelected = concernType === t
                return (
                  <button key={t} onClick={() => setConcernType(t)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: isSelected ? c.bg : '#1F2937',
                      color: isSelected ? c.color : '#9CA3AF',
                      border: `1px solid ${isSelected ? c.color + '60' : '#374151'}`,
                    }}>
                    {t}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>
              Description <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={4} placeholder="Describe the concern in detail — include what was seen, heard, or disclosed, and by whom..."
              className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
              style={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB' }} />
          </div>

          {/* Witnessed toggle */}
          <button
            onClick={() => setWitnessed(v => !v)}
            className="flex items-center justify-between rounded-lg px-4 py-3 transition-colors"
            style={{
              backgroundColor: witnessed ? 'rgba(108,63,197,0.1)' : '#1F2937',
              border: `1px solid ${witnessed ? 'rgba(108,63,197,0.4)' : '#374151'}`,
            }}>
            <div className="flex items-center gap-2">
              {witnessed ? <Eye size={14} style={{ color: '#A78BFA' }} /> : <EyeOff size={14} style={{ color: '#6B7280' }} />}
              <span className="text-sm font-medium" style={{ color: witnessed ? '#A78BFA' : '#9CA3AF' }}>
                {witnessed ? 'Directly witnessed by reporter' : 'Not directly witnessed (disclosed/reported)'}
              </span>
            </div>
            <div className="relative h-5 w-9 rounded-full flex items-center transition-colors"
              style={{ backgroundColor: witnessed ? '#6C3FC5' : '#374151' }}>
              <div className="absolute h-3.5 w-3.5 rounded-full bg-white transition-all"
                style={{ left: witnessed ? '18px' : '3px' }} />
            </div>
          </button>

          {/* Action taken */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>
              Action Taken So Far <span className="font-normal">(optional)</span>
            </label>
            <textarea value={actionTaken} onChange={e => setActionTaken(e.target.value)}
              rows={3} placeholder="e.g. Pupil spoken to, parents contacted, referred to DSL..."
              className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
              style={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB' }} />
          </div>

          {/* Locked record notice */}
          <div className="flex items-start gap-2 rounded-lg px-4 py-3"
            style={{ backgroundColor: 'rgba(108,63,197,0.06)', border: '1px solid rgba(108,63,197,0.2)' }}>
            <Lock size={13} className="shrink-0 mt-0.5" style={{ color: '#A78BFA' }} />
            <p className="text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>
              Once submitted, this record <strong style={{ color: '#F9FAFB' }}>cannot be edited or deleted</strong>. It forms part of the school's safeguarding audit trail in line with DfE guidance (Keeping Children Safe in Education).
            </p>
          </div>

          {error && (
            <p className="rounded-lg px-3 py-2 text-sm"
              style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#FCA5A5' }}>
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 shrink-0"
          style={{ borderTop: '1px solid #1F2937' }}>
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ color: '#9CA3AF', border: '1px solid #1F2937' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold"
            style={{
              backgroundColor: isUrgent ? '#EF4444' : '#0D9488',
              color: '#F9FAFB', opacity: saving ? 0.7 : 1,
            }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <ShieldAlert size={14} />}
            {saving ? 'Logging…' : 'Log Concern →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string }> = {
    'Open':          { bg: 'rgba(239,68,68,0.1)',   color: '#EF4444' },
    'Under Review':  { bg: 'rgba(245,158,11,0.1)',  color: '#F59E0B' },
    'Closed':        { bg: 'rgba(34,197,94,0.1)',   color: '#22C55E' },
  }
  const c = cfg[status] ?? cfg['Open']
  return (
    <span className="rounded-md px-2 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: c.bg, color: c.color }}>
      {status}
    </span>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function SafeguardingPage() {
  const supabase = useSupabase()
  const [showModal, setShowModal]   = useState(false)
  const [records, setRecords]       = useState<SafeguardingRecord[]>([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase
          .from('school_safeguarding')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)
        if (data) setRecords(data as SafeguardingRecord[])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [supabase])

  function handleLogged(record: SafeguardingRecord) {
    setRecords(prev => [record, ...prev])
  }

  const openCount    = records.filter(r => r.status === 'Open').length
  const urgentCount  = records.filter(r => r.is_urgent && r.status === 'Open').length
  const reviewCount  = records.filter(r => r.status === 'Under Review').length
  const totalCount   = records.length

  const stats = [
    { label: 'Open Concerns',    value: String(openCount),   trend: openCount > 0 ? 'Requires action' : 'All clear', trendDir: openCount > 0 ? 'up' as const : 'down' as const, trendGood: openCount === 0, icon: ShieldAlert, sub: 'needs review' },
    { label: 'Urgent',           value: String(urgentCount), trend: urgentCount > 0 ? 'DSL notified' : 'None',        trendDir: 'up' as const, trendGood: urgentCount === 0,  icon: AlertTriangle, sub: 'immediate action' },
    { label: 'Under Review',     value: String(reviewCount), trend: 'In progress',  trendDir: 'up' as const, trendGood: true, icon: Clock, sub: 'being investigated' },
    { label: 'Total Logged',     value: String(loading ? '…' : totalCount), trend: 'this year', trendDir: 'up' as const, trendGood: true, icon: FileText, sub: 'immutable records' },
  ]

  return (
    <PageShell>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs" style={{ color: '#6B7280' }}>
        <Link href="/school-office" className="hover:text-white transition-colors">School Office</Link>
        <span>/</span>
        <span style={{ color: '#9CA3AF' }}>Safeguarding & SEND</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
            <ShieldAlert size={18} style={{ color: '#EF4444' }} />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Safeguarding & SEND</h2>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
              Concern logging — DSL dashboard — immutable audit trail
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
          style={{ backgroundColor: '#EF4444', color: '#F9FAFB' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#DC2626' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#EF4444' }}>
          <Plus size={15} />
          New Concern
        </button>
      </div>

      {/* Urgent SLT banner */}
      {urgentCount > 0 && (
        <div className="flex items-start gap-3 rounded-xl px-5 py-4 animate-pulse"
          style={{ backgroundColor: 'rgba(239,68,68,0.12)', border: '2px solid rgba(239,68,68,0.4)' }}>
          <AlertTriangle size={18} className="shrink-0 mt-0.5" style={{ color: '#EF4444' }} />
          <div>
            <p className="text-sm font-bold" style={{ color: '#EF4444' }}>
              URGENT — {urgentCount} open concern{urgentCount !== 1 ? 's' : ''} requiring immediate DSL action
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#FCA5A5' }}>
              DSL has been notified by email and SMS. Review the open concerns below immediately.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <ChartSection points={stats.map(s => ({ label: s.label, value: parseNum(s.value) }))}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(s => <StatCard key={s.label} {...s} />)}
        </div>
      </ChartSection>

      {/* Concerns list */}
      <SectionCard title="Concerns Register">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={20} className="animate-spin" style={{ color: '#9CA3AF' }} />
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10">
            <ShieldAlert size={28} style={{ color: '#374151' }} />
            <p className="text-sm" style={{ color: '#9CA3AF' }}>No concerns logged yet</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {records.map((r, i) => {
              const cc = CONCERN_COLOURS[r.concern_type] ?? CONCERN_COLOURS['Other']
              return (
                <div key={r.id}
                  className="px-5 py-4"
                  style={{ borderBottom: i < records.length - 1 ? '1px solid #1F2937' : undefined }}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded"
                          style={{ backgroundColor: 'rgba(108,63,197,0.15)', color: '#A78BFA' }}>
                          {r.ref_number}
                        </span>
                        <span className="rounded-md px-2 py-0.5 text-xs font-semibold"
                          style={{ backgroundColor: cc.bg, color: cc.color }}>
                          {r.concern_type}
                        </span>
                        <StatusBadge status={r.status} />
                        {r.is_urgent && (
                          <span className="flex items-center gap-1 text-xs font-bold"
                            style={{ color: '#EF4444' }}>
                            <AlertTriangle size={11} /> URGENT
                          </span>
                        )}
                        {r.witnessed && (
                          <span className="flex items-center gap-1 text-xs"
                            style={{ color: '#6B7280' }}>
                            <Eye size={11} /> Witnessed
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>
                        {r.pupil_name} — {r.year_group}
                      </p>
                      <p className="text-xs mt-0.5 line-clamp-2 leading-relaxed" style={{ color: '#9CA3AF' }}>
                        {r.description}
                      </p>
                      {r.action_taken && (
                        <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
                          <span style={{ color: '#4B5563' }}>Action taken: </span>{r.action_taken}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 text-right shrink-0">
                      <p className="text-xs" style={{ color: '#6B7280' }}>{formatDateTime(r.incident_at)}</p>
                      <p className="text-xs" style={{ color: '#4B5563' }}>Reported by {r.reported_by}</p>
                      <div className="flex items-center gap-1 mt-1" style={{ color: '#4B5563' }}>
                        <Lock size={10} />
                        <span className="text-[10px]">Locked</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </SectionCard>

      {/* Guidance */}
      <SectionCard title="KCSIE Guidance">
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: 'Immediate disclosure', desc: 'Do not promise confidentiality. Listen, do not investigate. Record verbatim where possible.' },
            { title: 'Refer to DSL',         desc: 'All concerns must be passed to the Designated Safeguarding Lead the same day. Do not delay.' },
            { title: 'Record keeping',       desc: 'Records must be factual, dated, and signed. This system logs them as immutable audit entries.' },
          ].map(({ title, desc }) => (
            <div key={title} className="flex flex-col gap-2">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#EF4444' }}>{title}</p>
              <p className="text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>{desc}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {showModal && (
        <NewConcernModal
          onClose={() => setShowModal(false)}
          onLogged={r => { handleLogged(r); setShowModal(false) }}
        />
      )}
    </PageShell>
  )
}
