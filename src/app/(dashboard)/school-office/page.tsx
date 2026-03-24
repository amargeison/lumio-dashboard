'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  UserMinus, AlertTriangle, CheckCircle2, Loader2,
  X, Plus, Phone, Mail, MessageSquare, ShieldAlert,
  CalendarDays, Users, BookOpen, Bell, ChevronRight, UserPlus,
} from 'lucide-react'
import { StatCard, PageShell, SectionCard } from '@/components/page-ui'
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

interface AbsenceRecord {
  id: string
  pupil_name: string
  year_group: string
  absence_date: string
  absence_type: string
  reported_by: string
  notes: string | null
  no_contact: boolean
  persistent_concern: boolean
  created_at: string
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const YEAR_GROUPS = [
  'Reception', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6',
  'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11',
]

const ABSENCE_TYPES = [
  'Illness',
  'Family Holiday',
  'Medical Appointment',
  'Unauthorised',
  'Other',
]

const REPORTED_BY_OPTIONS = [
  { value: 'Parent Call',   icon: Phone },
  { value: 'Parent Text',   icon: MessageSquare },
  { value: 'Parent Email',  icon: Mail },
  { value: 'No Contact',    icon: Bell },
]

// Sample pupil names for autocomplete (in a real app, fetched from MIS)
const SAMPLE_PUPILS = [
  'Aisha Patel', 'Ben Clarke', 'Chloe Thompson', 'Daniel Wright', 'Emily Foster',
  'Finn O\'Brien', 'Grace Kim', 'Harry Stephens', 'Isla Morrison', 'Jack Davis',
  'Katie Hughes', 'Liam Nguyen', 'Mia Robinson', 'Noah Williams', 'Olivia Scott',
  'Poppy Evans', 'Quinn Baker', 'Ryan Taylor', 'Sofia Martinez', 'Tom Harrison',
  'Uma Singh', 'Victor Chen', 'Willow Adams', 'Xander Brooks', 'Yasmin Khan',
  'Zara Ahmed', 'Alex Jordan', 'Bella Moore', 'Caleb White', 'Daisy Green',
]

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatDisplayDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

// ─── Log Absence Modal ─────────────────────────────────────────────────────────

interface ModalProps {
  onClose: () => void
  onLogged: (record: AbsenceRecord) => void
}

function LogAbsenceModal({ onClose, onLogged }: ModalProps) {
  const [pupilName, setPupilName]     = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggest, setShowSuggest] = useState(false)
  const [yearGroup, setYearGroup]     = useState('')
  const [absenceDate, setAbsenceDate] = useState(todayISO())
  const [absenceType, setAbsenceType] = useState('')
  const [reportedBy, setReportedBy]   = useState('')
  const [notes, setNotes]             = useState('')
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [result, setResult]           = useState<{ no_contact: boolean; persistent_concern: boolean } | null>(null)
  const suggestRef = useRef<HTMLDivElement>(null)

  const handlePupilInput = useCallback((val: string) => {
    setPupilName(val)
    if (val.length >= 2) {
      const matches = SAMPLE_PUPILS.filter(p =>
        p.toLowerCase().includes(val.toLowerCase())
      ).slice(0, 6)
      setSuggestions(matches)
      setShowSuggest(matches.length > 0)
    } else {
      setShowSuggest(false)
    }
  }, [])

  async function handleSubmit() {
    if (!pupilName.trim())  { setError('Pupil name is required.'); return }
    if (!yearGroup)         { setError('Please select a year group.'); return }
    if (!absenceType)       { setError('Please select an absence type.'); return }
    if (!reportedBy)        { setError('Please select how this was reported.'); return }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/workflows/school/absence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pupil_name: pupilName.trim(),
          year_group: yearGroup,
          absence_date: absenceDate,
          absence_type: absenceType,
          reported_by: reportedBy,
          notes: notes.trim() || null,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error || `Error ${res.status}`)
      }

      const data = await res.json()
      setResult({ no_contact: data.no_contact, persistent_concern: data.persistent_concern })

      // Build a local record for the UI (may not have real id if Supabase not configured)
      const localRecord: AbsenceRecord = {
        id: data.id ?? crypto.randomUUID(),
        pupil_name: pupilName.trim(),
        year_group: yearGroup,
        absence_date: absenceDate,
        absence_type: absenceType,
        reported_by: reportedBy,
        notes: notes.trim() || null,
        no_contact: data.no_contact,
        persistent_concern: data.persistent_concern,
        created_at: new Date().toISOString(),
      }
      onLogged(localRecord)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to log absence.')
    } finally {
      setSaving(false)
    }
  }

  // Success view
  if (result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
        <div className="w-full max-w-md rounded-2xl p-8 flex flex-col items-center gap-4 text-center"
          style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <CheckCircle2 size={40} style={{ color: '#0D9488' }} />
          <p className="text-base font-semibold" style={{ color: '#F9FAFB' }}>Absence Logged</p>
          {result.no_contact && (
            <div className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm"
              style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.25)' }}>
              <Bell size={14} /> Parent chase triggered — SMS & email sent via n8n
            </div>
          )}
          {result.persistent_concern && (
            <div className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm"
              style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.25)' }}>
              <ShieldAlert size={14} /> Persistent absence concern flagged (3+ this term)
            </div>
          )}
          {!result.no_contact && !result.persistent_concern && (
            <p className="text-sm" style={{ color: '#9CA3AF' }}>Absence recorded. No automated actions triggered.</p>
          )}
          <button onClick={onClose}
            className="mt-2 px-6 py-2 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-lg rounded-2xl flex flex-col max-h-[92vh]"
        style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid #1F2937' }}>
          <div>
            <p className="text-base font-semibold" style={{ color: '#F9FAFB' }}>Log Absence</p>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
              {formatDisplayDate(absenceDate)}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-white/5 transition-colors"
            style={{ color: '#9CA3AF' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-4 overflow-y-auto px-6 py-5">

          {/* Pupil name */}
          <div ref={suggestRef} className="relative">
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>
              Pupil Name <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              value={pupilName}
              onChange={e => handlePupilInput(e.target.value)}
              onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
              onFocus={() => pupilName.length >= 2 && setShowSuggest(suggestions.length > 0)}
              placeholder="Start typing a name..."
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB' }}
            />
            {showSuggest && (
              <div className="absolute left-0 right-0 z-10 mt-1 rounded-lg overflow-hidden shadow-xl"
                style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
                {suggestions.map(s => (
                  <button key={s} className="w-full text-left px-3 py-2 text-sm transition-colors"
                    style={{ color: '#F9FAFB' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#374151' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
                    onMouseDown={() => { setPupilName(s); setShowSuggest(false) }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Year group + date row */}
          <div className="grid grid-cols-2 gap-3">
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
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>Date</label>
              <input type="date" value={absenceDate} onChange={e => setAbsenceDate(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB' }} />
            </div>
          </div>

          {/* Absence type */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>
              Absence Type <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {ABSENCE_TYPES.map(t => (
                <button key={t} onClick={() => setAbsenceType(t)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: absenceType === t ? '#0D9488' : '#1F2937',
                    color: absenceType === t ? '#F9FAFB' : '#9CA3AF',
                    border: `1px solid ${absenceType === t ? '#0D9488' : '#374151'}`,
                  }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Reported by */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: '#9CA3AF' }}>
              Reported By <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {REPORTED_BY_OPTIONS.map(({ value, icon: Icon }) => {
                const isNoContact = value === 'No Contact'
                const isSelected  = reportedBy === value
                return (
                  <button key={value} onClick={() => setReportedBy(value)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: isSelected
                        ? isNoContact ? 'rgba(245,158,11,0.15)' : 'rgba(13,148,136,0.15)'
                        : '#1F2937',
                      border: `1px solid ${isSelected ? (isNoContact ? 'rgba(245,158,11,0.4)' : 'rgba(13,148,136,0.4)') : '#374151'}`,
                      color: isSelected ? (isNoContact ? '#F59E0B' : '#2DD4BF') : '#9CA3AF',
                    }}>
                    <Icon size={14} />
                    {value}
                  </button>
                )
              })}
            </div>
            {reportedBy === 'No Contact' && (
              <p className="mt-2 flex items-center gap-1.5 text-xs"
                style={{ color: '#F59E0B' }}>
                <AlertTriangle size={12} /> Automated parent chase will be triggered via n8n
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>
              Notes <span className="font-normal">(optional)</span>
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              rows={3} placeholder="Any additional context..."
              className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
              style={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB' }} />
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
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ color: '#9CA3AF', border: '1px solid #1F2937' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{ backgroundColor: '#0D9488', color: '#F9FAFB', opacity: saving ? 0.7 : 1 }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            {saving ? 'Logging…' : 'Log & Notify →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Absence row ───────────────────────────────────────────────────────────────

function AbsenceTypeBadge({ type }: { type: string }) {
  const cfg: Record<string, { bg: string; color: string }> = {
    'Illness':              { bg: 'rgba(239,68,68,0.1)',    color: '#FCA5A5' },
    'Family Holiday':       { bg: 'rgba(245,158,11,0.1)',   color: '#FCD34D' },
    'Medical Appointment':  { bg: 'rgba(13,148,136,0.1)',   color: '#5EEAD4' },
    'Unauthorised':         { bg: 'rgba(239,68,68,0.15)',   color: '#EF4444' },
    'Other':                { bg: 'rgba(107,114,128,0.1)',  color: '#9CA3AF' },
  }
  const c = cfg[type] ?? cfg['Other']
  return (
    <span className="rounded-md px-2 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: c.bg, color: c.color }}>
      {type}
    </span>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function SchoolOfficePage() {
  const supabase = useSupabase()
  const [showModal, setShowModal]     = useState(false)
  const [absences, setAbsences]       = useState<AbsenceRecord[]>([])
  const [loading, setLoading]         = useState(true)
  const [todayCount, setTodayCount]   = useState(0)
  const [noContactCount, setNoContactCount] = useState(0)
  const [persistentCount, setPersistentCount] = useState(0)

  // Load absences (today + recent)
  useEffect(() => {
    async function load() {
      try {
        const today = todayISO()
        const { data } = await supabase
          .from('school_absences')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)

        if (data) {
          setAbsences(data as AbsenceRecord[])
          setTodayCount((data as AbsenceRecord[]).filter(a => a.absence_date === today).length)
          setNoContactCount((data as AbsenceRecord[]).filter(a => a.no_contact).length)
          setPersistentCount((data as AbsenceRecord[]).filter(a => a.persistent_concern).length)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [supabase])

  function handleLogged(record: AbsenceRecord) {
    setAbsences(prev => [record, ...prev])
    if (record.absence_date === todayISO()) setTodayCount(c => c + 1)
    if (record.no_contact) setNoContactCount(c => c + 1)
    if (record.persistent_concern) setPersistentCount(c => c + 1)
  }

  const stats = [
    {
      label: 'Absences Today',
      value: String(todayCount),
      trend: 'live',
      trendDir: 'up' as const,
      trendGood: false,
      icon: UserMinus,
      sub: new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }),
    },
    {
      label: 'No Contact Cases',
      value: String(noContactCount),
      trend: noContactCount > 0 ? 'Action needed' : 'All clear',
      trendDir: noContactCount > 0 ? 'up' as const : 'down' as const,
      trendGood: noContactCount === 0,
      icon: Bell,
      sub: 'parent chase pending',
    },
    {
      label: 'Persistent Concerns',
      value: String(persistentCount),
      trend: persistentCount > 0 ? 'Review needed' : 'None flagged',
      trendDir: persistentCount > 0 ? 'up' as const : 'down' as const,
      trendGood: persistentCount === 0,
      icon: ShieldAlert,
      sub: '3+ absences this term',
    },
    {
      label: 'Total Logged',
      value: String(loading ? '…' : absences.length),
      trend: 'this term',
      trendDir: 'up' as const,
      trendGood: true,
      icon: BookOpen,
      sub: 'all records',
    },
  ]

  const todayAbsences   = absences.filter(a => a.absence_date === todayISO())
  const recentAbsences  = absences.filter(a => a.absence_date !== todayISO()).slice(0, 20)

  return (
    <PageShell>
      {/* Sub-navigation */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6B7280' }}>School Office</span>
        <Link href="/school-office/safeguarding"
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
          style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
          <ShieldAlert size={12} /> Safeguarding & SEND <ChevronRight size={11} />
        </Link>
        <Link href="/school-office/cover"
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
          style={{ backgroundColor: 'rgba(13,148,136,0.08)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.2)' }}>
          <CalendarDays size={12} /> Supply Cover <ChevronRight size={11} />
        </Link>
        <Link href="/school-office/admission"
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
          style={{ backgroundColor: 'rgba(59,130,246,0.08)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.2)' }}>
          <UserPlus size={12} /> Admissions <ChevronRight size={11} />
        </Link>
      </div>

      {/* Quick action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>School Office</h2>
          <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
            Daily attendance — log absences and trigger parent notifications
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
          style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0F766E' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0D9488' }}>
          <Plus size={15} />
          Log Absence
        </button>
      </div>

      {/* Stats */}
      <ChartSection points={stats.map(s => ({ label: s.label, value: parseNum(s.value) }))}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(s => <StatCard key={s.label} {...s} />)}
        </div>
      </ChartSection>

      {/* No-contact alert banner */}
      {noContactCount > 0 && (
        <div className="flex items-start gap-3 rounded-xl px-5 py-4"
          style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <AlertTriangle size={16} className="shrink-0 mt-0.5" style={{ color: '#F59E0B' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>
              {noContactCount} no-contact absence{noContactCount !== 1 ? 's' : ''} — parent chase triggered
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
              Automated SMS and email sent via n8n workflow. Follow up if no response by end of day.
            </p>
          </div>
        </div>
      )}

      {/* Persistent absence alert banner */}
      {persistentCount > 0 && (
        <div className="flex items-start gap-3 rounded-xl px-5 py-4"
          style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <ShieldAlert size={16} className="shrink-0 mt-0.5" style={{ color: '#EF4444' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>
              {persistentCount} pupil{persistentCount !== 1 ? 's' : ''} flagged for persistent absence (3+ this term)
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
              These pupils may require a welfare check or formal attendance letter under the DfE attendance guidance.
            </p>
          </div>
        </div>
      )}

      {/* Today's absences */}
      <SectionCard title={`Today's Absences (${todayAbsences.length})`}>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={20} className="animate-spin" style={{ color: '#9CA3AF' }} />
          </div>
        ) : todayAbsences.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10">
            <Users size={28} style={{ color: '#374151' }} />
            <p className="text-sm" style={{ color: '#9CA3AF' }}>No absences logged today</p>
            <button onClick={() => setShowModal(true)}
              className="mt-1 flex items-center gap-1.5 text-xs font-medium"
              style={{ color: '#0D9488' }}>
              <Plus size={12} /> Log first absence
            </button>
          </div>
        ) : (
          <div className="flex flex-col">
            {todayAbsences.map((a, i) => (
              <div key={a.id}
                className="flex items-center gap-4 px-5 py-3"
                style={{ borderBottom: i < todayAbsences.length - 1 ? '1px solid #1F2937' : undefined }}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                  style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>
                  {a.pupil_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{a.pupil_name}</p>
                    <span className="text-xs" style={{ color: '#6B7280' }}>{a.year_group}</span>
                    {a.persistent_concern && (
                      <span className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold"
                        style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
                        <ShieldAlert size={10} /> Persistent
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <AbsenceTypeBadge type={a.absence_type} />
                    <span className="text-xs" style={{ color: '#6B7280' }}>via {a.reported_by}</span>
                    {a.notes && <span className="text-xs truncate max-w-xs" style={{ color: '#6B7280' }}>{a.notes}</span>}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {a.no_contact && (
                    <span className="flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold"
                      style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>
                      <Bell size={10} /> Chase sent
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Recent absences */}
      {recentAbsences.length > 0 && (
        <SectionCard title="Recent Absences">
          <div className="flex flex-col">
            {recentAbsences.map((a, i) => (
              <div key={a.id}
                className="flex items-center gap-4 px-5 py-3"
                style={{ borderBottom: i < recentAbsences.length - 1 ? '1px solid #1F2937' : undefined }}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>
                  {a.pupil_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{a.pupil_name}</p>
                    <span className="text-xs" style={{ color: '#6B7280' }}>{a.year_group}</span>
                    <AbsenceTypeBadge type={a.absence_type} />
                    {a.persistent_concern && (
                      <span className="text-xs" style={{ color: '#EF4444' }}>⚠ Persistent</span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                    {formatDisplayDate(a.absence_date)} · {a.reported_by}
                    {a.no_contact && ' · Parent chase sent'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* How it works */}
      <SectionCard title="Workflow Guide">
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: CalendarDays, title: 'Log Absence',       desc: 'Record pupil name, year group, type and who reported it.', color: '#0D9488' },
            { icon: Bell,         title: 'No Contact Check',  desc: 'If no parent contact — automated chase SMS & email fires via n8n.', color: '#F59E0B' },
            { icon: ShieldAlert,  title: 'Persistent Flag',   desc: '3rd absence this term triggers a persistent concern flag for safeguarding review.', color: '#EF4444' },
            { icon: BookOpen,     title: 'Full Audit Trail',  desc: 'Every absence is logged to Supabase for DfE compliance reporting.', color: '#6C3FC5' },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="flex flex-col gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${color}20` }}>
                <Icon size={16} style={{ color }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{title}</p>
              <p className="text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>{desc}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {showModal && (
        <LogAbsenceModal
          onClose={() => setShowModal(false)}
          onLogged={(r) => { handleLogged(r); setShowModal(false) }}
        />
      )}
    </PageShell>
  )
}
