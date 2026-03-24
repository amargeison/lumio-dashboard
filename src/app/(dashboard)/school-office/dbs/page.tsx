'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  ShieldCheck, Plus, X, Loader2, CheckCircle2, AlertTriangle,
  ChevronRight, ChevronLeft, Clock, Download, Filter,
  Bell, BadgeCheck, FileText, Users, Lock,
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

interface DBSRecord {
  id: string
  staff_name: string
  staff_email: string | null
  staff_role: string | null
  certificate_number: string | null
  check_type: string
  issue_date: string
  renewal_due_date: string
  status: string
  reminder_60_sent: boolean
  reminder_30_sent: boolean
  reminder_14_sent: boolean
  notes: string | null
  created_at: string
}

interface DBSResult {
  status: string
  id: string | null
  staff_name: string
  renewal_due_date: string
  dbs_status: string
  reminders_scheduled: boolean
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function computeStatus(renewalDueDate: string): string {
  const now = new Date()
  const due = new Date(renewalDueDate)
  const days = Math.ceil((due.getTime() - now.getTime()) / 86400000)
  if (days < 0)   return 'Overdue'
  if (days <= 14) return 'Urgent'
  if (days <= 60) return 'Due Soon'
  return 'Current'
}

function daysUntil(renewalDueDate: string): number {
  const now = new Date()
  const due = new Date(renewalDueDate)
  return Math.ceil((due.getTime() - now.getTime()) / 86400000)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function addYears(date: string, years: number): string {
  const d = new Date(date)
  d.setFullYear(d.getFullYear() + years)
  return d.toISOString().slice(0, 10)
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const CHECK_TYPES = ['Standard', 'Enhanced', 'Enhanced + Barred']

const STATUS_COLOURS: Record<string, { bg: string; color: string; dot: string }> = {
  'Current':  { bg: 'rgba(13,148,136,0.12)',  color: '#0D9488', dot: '#0D9488' },
  'Due Soon': { bg: 'rgba(245,158,11,0.12)',  color: '#F59E0B', dot: '#F59E0B' },
  'Urgent':   { bg: 'rgba(239,68,68,0.15)',   color: '#EF4444', dot: '#EF4444' },
  'Overdue':  { bg: 'rgba(220,38,38,0.15)',   color: '#DC2626', dot: '#DC2626' },
}

type FilterStatus = 'All' | 'Current' | 'Due Soon' | 'Urgent' | 'Overdue'

// ─── New DBS Modal ─────────────────────────────────────────────────────────────

interface ModalProps {
  onClose: () => void
  onSaved: (record: DBSRecord, result: DBSResult) => void
}

function NewDBSModal({ onClose, onSaved }: ModalProps) {
  const [staffName, setStaffName]         = useState('')
  const [staffEmail, setStaffEmail]       = useState('')
  const [staffRole, setStaffRole]         = useState('')
  const [certNumber, setCertNumber]       = useState('')
  const [checkType, setCheckType]         = useState('Enhanced')
  const [issueDate, setIssueDate]         = useState('')
  const [renewalDate, setRenewalDate]     = useState('')
  const [notes, setNotes]                 = useState('')
  const [submitting, setSubmitting]       = useState(false)
  const [error, setError]                 = useState('')
  const [result, setResult]               = useState<DBSResult | null>(null)

  // Auto-calculate renewal date when issue date changes
  useEffect(() => {
    if (issueDate) {
      setRenewalDate(addYears(issueDate, 3))
    }
  }, [issueDate])

  const previewStatus = renewalDate ? computeStatus(renewalDate) : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!staffName.trim()) { setError('Staff name is required.'); return }
    if (!issueDate) { setError('Issue date is required.'); return }

    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/workflows/school/dbs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_name: staffName.trim(),
          staff_email: staffEmail || undefined,
          staff_role: staffRole || undefined,
          certificate_number: certNumber || undefined,
          check_type: checkType,
          issue_date: issueDate,
          renewal_due_date: renewalDate || undefined,
          notes: notes || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong.'); return }

      const r = data as DBSResult
      setResult(r)
      onSaved({
        id: r.id ?? crypto.randomUUID(),
        staff_name: staffName.trim(),
        staff_email: staffEmail || null,
        staff_role: staffRole || null,
        certificate_number: certNumber || null,
        check_type: checkType,
        issue_date: issueDate,
        renewal_due_date: renewalDate || addYears(issueDate, 3),
        status: r.dbs_status,
        reminder_60_sent: false,
        reminder_30_sent: false,
        reminder_14_sent: false,
        notes: notes || null,
        created_at: new Date().toISOString(),
      }, r)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    const sc = STATUS_COLOURS[result.dbs_status] ?? STATUS_COLOURS['Current']
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <div className="w-full max-w-md rounded-2xl p-7" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{ backgroundColor: 'rgba(13,148,136,0.15)' }}>
              <CheckCircle2 size={28} style={{ color: '#0D9488' }} />
            </div>
            <div>
              <h3 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>DBS Record Saved</h3>
              <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>{result.staff_name}</p>
              <span className="mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold"
                style={{ backgroundColor: sc.bg, color: sc.color }}>
                {result.dbs_status}
              </span>
            </div>
            <div className="w-full rounded-xl p-4 text-left" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#6B7280' }}>Actions triggered</p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <BadgeCheck size={13} style={{ color: '#0D9488' }} />
                  <span className="text-sm" style={{ color: '#D1D5DB' }}>
                    Renewal due {formatDate(result.renewal_due_date)}
                  </span>
                </div>
                {result.reminders_scheduled ? (
                  <div className="flex items-center gap-2">
                    <Bell size={13} style={{ color: '#0D9488' }} />
                    <span className="text-sm" style={{ color: '#D1D5DB' }}>
                      Reminder emails scheduled (60, 30, 14 days before)
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Bell size={13} style={{ color: '#6B7280' }} />
                    <span className="text-sm" style={{ color: '#9CA3AF' }}>
                      Set N8N_SCHOOL_DBS_WEBHOOK_URL to enable reminders
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Lock size={13} style={{ color: '#0D9488' }} />
                  <span className="text-sm" style={{ color: '#D1D5DB' }}>Added to Single Central Record</span>
                </div>
              </div>
            </div>
            <button onClick={onClose}
              className="w-full rounded-lg py-2.5 text-sm font-semibold"
              style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
              Done
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full max-w-lg rounded-2xl" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: '#1F2937' }}>
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} style={{ color: '#0D9488' }} />
            <h2 className="text-base font-semibold" style={{ color: '#F9FAFB' }}>New DBS Record</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 transition-colors hover:bg-gray-800">
            <X size={16} style={{ color: '#9CA3AF' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-5 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>Staff Name *</label>
              <input value={staffName} onChange={e => setStaffName(e.target.value)}
                placeholder="Full name…"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{ backgroundColor: '#07080F', border: '1px solid #374151', color: '#F9FAFB' }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>Email</label>
              <input type="email" value={staffEmail} onChange={e => setStaffEmail(e.target.value)}
                placeholder="staff@school.example"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{ backgroundColor: '#07080F', border: '1px solid #374151', color: '#F9FAFB' }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>Role</label>
              <input value={staffRole} onChange={e => setStaffRole(e.target.value)}
                placeholder="Class Teacher, HLTA…"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{ backgroundColor: '#07080F', border: '1px solid #374151', color: '#F9FAFB' }} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>DBS Certificate Number</label>
            <input value={certNumber} onChange={e => setCertNumber(e.target.value)}
              placeholder="e.g. 001234567890"
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none font-mono"
              style={{ backgroundColor: '#07080F', border: '1px solid #374151', color: '#F9FAFB' }} />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: '#9CA3AF' }}>Check Type *</label>
            <div className="flex flex-wrap gap-2">
              {CHECK_TYPES.map(type => {
                const sel = checkType === type
                return (
                  <button key={type} type="button" onClick={() => setCheckType(type)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: sel ? 'rgba(13,148,136,0.2)' : 'rgba(55,65,81,0.4)',
                      color: sel ? '#0D9488' : '#9CA3AF',
                      border: `1px solid ${sel ? '#0D9488' : '#374151'}`,
                    }}>
                    {type}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>Issue Date *</label>
              <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{ backgroundColor: '#07080F', border: '1px solid #374151', color: '#F9FAFB', colorScheme: 'dark' }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>
                Renewal Due
                <span className="ml-1 font-normal" style={{ color: '#4B5563' }}>(auto: +3 years)</span>
              </label>
              <input type="date" value={renewalDate} onChange={e => setRenewalDate(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{ backgroundColor: '#07080F', border: '1px solid #374151', color: '#F9FAFB', colorScheme: 'dark' }} />
            </div>
          </div>

          {/* Live status preview */}
          {previewStatus && (
            <div className="flex items-center gap-2 rounded-lg px-3 py-2"
              style={{
                backgroundColor: STATUS_COLOURS[previewStatus]?.bg ?? 'transparent',
                border: `1px solid ${STATUS_COLOURS[previewStatus]?.color ?? '#374151'}40`,
              }}>
              <span className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: STATUS_COLOURS[previewStatus]?.dot }} />
              <span className="text-xs font-medium" style={{ color: STATUS_COLOURS[previewStatus]?.color }}>
                Status: {previewStatus}
                {previewStatus !== 'Overdue' && renewalDate && ` · ${daysUntil(renewalDate)} days remaining`}
                {previewStatus === 'Overdue' && renewalDate && ` · expired ${Math.abs(daysUntil(renewalDate))} days ago`}
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              rows={2} placeholder="Any notes about this check…"
              className="w-full resize-none rounded-lg px-3 py-2.5 text-sm outline-none"
              style={{ backgroundColor: '#07080F', border: '1px solid #374151', color: '#F9FAFB' }} />
          </div>

          <div className="rounded-lg px-3 py-2.5" style={{ backgroundColor: 'rgba(13,148,136,0.06)', border: '1px solid rgba(13,148,136,0.15)' }}>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>
              <Bell size={11} className="inline mr-1" style={{ color: '#0D9488' }} />
              Automated reminders sent at 60, 30, and 14 days before renewal via n8n.
            </p>
          </div>

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
              style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
              {submitting ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Save Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLOURS[status] ?? STATUS_COLOURS['Current']
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: c.dot }} />
      <span className="rounded-full px-2 py-0.5 text-xs font-medium"
        style={{ backgroundColor: c.bg, color: c.color }}>{status}</span>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function DBSPage() {
  const supabase = useSupabase()
  const [showModal, setShowModal]       = useState(false)
  const [records, setRecords]           = useState<DBSRecord[]>([])
  const [loading, setLoading]           = useState(true)
  const [filter, setFilter]             = useState<FilterStatus>('All')
  const [currentCount, setCurrentCount] = useState(0)
  const [dueSoonCount, setDueSoonCount] = useState(0)
  const [urgentCount, setUrgentCount]   = useState(0)
  const [overdueCount, setOverdueCount] = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase
          .from('school_dbs_records')
          .select('*')
          .order('renewal_due_date', { ascending: true })
          .limit(100)

        if (data) {
          // Recompute status client-side (seed data may have stale status)
          const records = (data as DBSRecord[]).map(r => ({
            ...r,
            status: computeStatus(r.renewal_due_date),
          }))
          setRecords(records)
          setCurrentCount(records.filter(r => r.status === 'Current').length)
          setDueSoonCount(records.filter(r => r.status === 'Due Soon').length)
          setUrgentCount(records.filter(r => r.status === 'Urgent').length)
          setOverdueCount(records.filter(r => r.status === 'Overdue').length)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [supabase])

  function handleSaved(record: DBSRecord) {
    setRecords(prev => {
      const updated = [record, ...prev].sort((a, b) =>
        new Date(a.renewal_due_date).getTime() - new Date(b.renewal_due_date).getTime()
      )
      return updated
    })
    if (record.status === 'Current') setCurrentCount(c => c + 1)
    if (record.status === 'Due Soon') setDueSoonCount(c => c + 1)
    if (record.status === 'Urgent') setUrgentCount(c => c + 1)
    if (record.status === 'Overdue') setOverdueCount(c => c + 1)
  }

  const stats = [
    {
      label: 'Current',
      value: String(currentCount),
      trend: 'compliant',
      trendDir: 'up' as const,
      trendGood: true,
      icon: BadgeCheck,
      sub: 'up to date',
    },
    {
      label: 'Due Soon',
      value: String(dueSoonCount),
      trend: dueSoonCount > 0 ? '≤60 days' : 'none',
      trendDir: dueSoonCount > 0 ? 'up' as const : 'down' as const,
      trendGood: dueSoonCount === 0,
      icon: Clock,
      sub: 'renewal approaching',
    },
    {
      label: 'Urgent',
      value: String(urgentCount),
      trend: urgentCount > 0 ? '≤14 days' : 'none',
      trendDir: urgentCount > 0 ? 'up' as const : 'down' as const,
      trendGood: urgentCount === 0,
      icon: Bell,
      sub: 'action required',
    },
    {
      label: 'Overdue',
      value: String(overdueCount),
      trend: overdueCount > 0 ? 'compliance risk' : 'all clear',
      trendDir: overdueCount > 0 ? 'up' as const : 'down' as const,
      trendGood: overdueCount === 0,
      icon: AlertTriangle,
      sub: 'expired checks',
    },
  ]

  const filtered = filter === 'All' ? records : records.filter(r => r.status === filter)

  const hasIssues = overdueCount > 0 || urgentCount > 0

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
          <ShieldCheck size={12} /> DBS Tracker
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>DBS Renewal Tracker</h2>
          <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
            Single Central Record — automated reminders at 60, 30 and 14 days before expiry
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const rows = records.map(r =>
                `"${r.staff_name}","${r.staff_role ?? ''}","${r.certificate_number ?? ''}","${r.check_type}","${r.issue_date}","${r.renewal_due_date}","${r.status}"`
              ).join('\n')
              const csv = `Staff Name,Role,Certificate Number,Check Type,Issue Date,Renewal Due,Status\n${rows}`
              const blob = new Blob([csv], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a'); a.href = url; a.download = 'dbs-single-central-record.csv'; a.click()
            }}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
            style={{ backgroundColor: 'rgba(55,65,81,0.4)', color: '#9CA3AF', border: '1px solid #374151' }}>
            <Download size={13} /> Export SCR
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
            style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0F766E' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0D9488' }}>
            <Plus size={15} />
            Add DBS Check
          </button>
        </div>
      </div>

      {/* Stats */}
      <ChartSection points={stats.map(s => ({ label: s.label, value: parseNum(s.value) }))}>
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {stats.map(s => <StatCard key={s.label} {...s} />)}
        </div>
      </ChartSection>

      {/* Compliance alert banner */}
      {hasIssues && (
        <div className="flex items-start gap-3 rounded-xl px-5 py-4"
          style={{ backgroundColor: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)' }}>
          <AlertTriangle size={16} className="shrink-0 mt-0.5" style={{ color: '#DC2626' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>
              {overdueCount > 0 && `${overdueCount} overdue DBS check${overdueCount !== 1 ? 's' : ''} — `}
              {urgentCount > 0 && `${urgentCount} expiring within 14 days`}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
              Compliance sign-off is blocked until all overdue checks are renewed. Contact affected staff immediately.
            </p>
          </div>
        </div>
      )}

      {/* Single Central Record table */}
      <SectionCard
        title={`Single Central Record (${filtered.length})`}
        action={
          <div className="flex items-center gap-1.5">
            <Filter size={12} style={{ color: '#6B7280' }} />
            {(['All', 'Current', 'Due Soon', 'Urgent', 'Overdue'] as FilterStatus[]).map(f => (
              <button key={f} type="button" onClick={() => setFilter(f)}
                className="rounded-lg px-2.5 py-1 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: filter === f ? 'rgba(13,148,136,0.15)' : 'transparent',
                  color: filter === f ? '#0D9488' : '#9CA3AF',
                }}>
                {f}
              </button>
            ))}
          </div>
        }>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={20} className="animate-spin" style={{ color: '#9CA3AF' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10">
            <ShieldCheck size={28} style={{ color: '#374151' }} />
            <p className="text-sm" style={{ color: '#9CA3AF' }}>No records found</p>
            <button onClick={() => setShowModal(true)} className="text-xs font-medium" style={{ color: '#0D9488' }}>
              Add first DBS check →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #1F2937' }}>
                  {['Staff', 'Role', 'Check Type', 'Issue Date', 'Renewal Due', 'Days Left', 'Reminders', 'Status'].map(h => (
                    <th key={h} className="pb-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: '#6B7280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#1F2937' }}>
                {filtered.map(r => {
                  const days = daysUntil(r.renewal_due_date)
                  return (
                    <tr key={r.id}>
                      <td className="py-3 pr-4">
                        <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{r.staff_name}</p>
                        {r.staff_email && <p className="text-xs" style={{ color: '#6B7280' }}>{r.staff_email}</p>}
                      </td>
                      <td className="py-3 pr-4 text-xs" style={{ color: '#9CA3AF' }}>{r.staff_role ?? '—'}</td>
                      <td className="py-3 pr-4">
                        <span className="rounded-full px-2 py-0.5 text-xs"
                          style={{ backgroundColor: 'rgba(55,65,81,0.4)', color: '#D1D5DB' }}>
                          {r.check_type}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-xs whitespace-nowrap" style={{ color: '#9CA3AF' }}>
                        {formatDate(r.issue_date)}
                      </td>
                      <td className="py-3 pr-4 text-xs whitespace-nowrap" style={{ color: '#9CA3AF' }}>
                        {formatDate(r.renewal_due_date)}
                      </td>
                      <td className="py-3 pr-4 text-xs font-medium whitespace-nowrap"
                        style={{ color: days < 0 ? '#DC2626' : days <= 14 ? '#EF4444' : days <= 60 ? '#F59E0B' : '#0D9488' }}>
                        {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex gap-1">
                          {[60, 30, 14].map(d => (
                            <span key={d}
                              className="rounded px-1 py-0.5 text-xs"
                              style={{
                                backgroundColor: (d === 60 ? r.reminder_60_sent : d === 30 ? r.reminder_30_sent : r.reminder_14_sent)
                                  ? 'rgba(13,148,136,0.12)' : 'rgba(55,65,81,0.3)',
                                color: (d === 60 ? r.reminder_60_sent : d === 30 ? r.reminder_30_sent : r.reminder_14_sent)
                                  ? '#0D9488' : '#6B7280',
                              }}>
                              {d}d
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3"><StatusBadge status={r.status} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Reminder schedule info */}
      <SectionCard title="Automated Reminder Schedule">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { days: '60 days', title: 'First Reminder', desc: 'Email sent to staff member and head teacher. Certificate renewal recommended.', colour: '#F59E0B' },
            { days: '30 days', title: 'Second Reminder', desc: 'Follow-up email sent. Renewal should be in progress. HT notified again.', colour: '#F97316' },
            { days: '14 days', title: 'Urgent Alert', desc: 'Red badge on dashboard. Urgent email + SMS (if configured). Compliance sign-off blocked if overdue.', colour: '#EF4444' },
          ].map(({ days, title, desc, colour }) => (
            <div key={days} className="rounded-xl p-4" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="rounded-full px-2.5 py-1 text-xs font-bold"
                  style={{ backgroundColor: `${colour}20`, color: colour }}>{days}</span>
                <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{title}</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>{desc}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Ofsted guide */}
      <div className="rounded-xl px-5 py-4" style={{ backgroundColor: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
        <div className="flex items-start gap-3">
          <FileText size={16} className="shrink-0 mt-0.5" style={{ color: '#60A5FA' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Ofsted Inspection Ready</p>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
              Use the <span style={{ color: '#60A5FA' }}>Export SCR</span> button to download the Single Central Record as a CSV. Inspectors require evidence that all staff have valid DBS checks. Overdue records are flagged in red for immediate action.
            </p>
          </div>
        </div>
      </div>

      {showModal && <NewDBSModal onClose={() => setShowModal(false)} onSaved={handleSaved} />}
    </PageShell>
  )
}
