'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  CalendarDays, Plus, X, Loader2, CheckCircle2, AlertTriangle,
  Users, User, Building2, Clock, ChevronRight, BookOpen,
  Banknote, BadgeCheck, ChevronLeft,
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

interface CoverBooking {
  id: string
  absent_staff: string
  cover_start_date: string
  cover_end_date: string
  classes: string[]
  cover_type: string
  agency_name: string | null
  assigned_to: string | null
  special_reqs: string | null
  estimated_cost: number | null
  status: string
  created_at: string
}

interface CoverResult {
  status: string
  id: string | null
  internal_cover_found: boolean
  assigned_to: string | null
  supply_agency_contacted: boolean
  estimated_cost: number
  days: number
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const YEAR_GROUPS = [
  'Reception', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6',
  'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11',
]

const COVER_TYPES = ['Internal', 'Supply Agency', 'Cover Supervisor', 'HLTA']

const AGENCIES = ['Protocol Education', 'Timeplan', 'Randstad', 'Academics', 'EduStaff', 'Other']

const SAMPLE_STAFF = [
  'Mrs A. Johnson', 'Mr B. Patel', 'Miss C. Williams', 'Mr D. Evans', 'Mrs E. Thompson',
  'Mr F. Clarke', 'Miss G. Roberts', 'Mr H. Wilson', 'Mrs I. Davies', 'Mr J. Stephens',
]

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatDisplayDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatCurrency(n: number): string {
  return `£${n.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

// ─── New Booking Modal ─────────────────────────────────────────────────────────

interface ModalProps {
  onClose: () => void
  onBooked: (booking: CoverBooking, result: CoverResult) => void
}

function NewCoverModal({ onClose, onBooked }: ModalProps) {
  const [absentStaff, setAbsentStaff]     = useState('')
  const [staffSuggestions, setStaffSuggestions] = useState<string[]>([])
  const [startDate, setStartDate]         = useState(todayISO())
  const [endDate, setEndDate]             = useState(todayISO())
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [coverType, setCoverType]         = useState('Internal')
  const [agencyName, setAgencyName]       = useState('')
  const [specialReqs, setSpecialReqs]     = useState('')
  const [submitting, setSubmitting]       = useState(false)
  const [error, setError]                 = useState('')
  const [result, setResult]               = useState<CoverResult | null>(null)

  function handleStaffInput(val: string) {
    setAbsentStaff(val)
    if (val.length < 2) { setStaffSuggestions([]); return }
    setStaffSuggestions(SAMPLE_STAFF.filter(s => s.toLowerCase().includes(val.toLowerCase())))
  }

  function toggleClass(cls: string) {
    setSelectedClasses(prev =>
      prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!absentStaff.trim()) { setError('Please enter the absent staff member.'); return }
    if (selectedClasses.length === 0) { setError('Please select at least one class/year group.'); return }
    if (endDate < startDate) { setError('End date must be on or after start date.'); return }

    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/workflows/school/cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          absent_staff: absentStaff.trim(),
          cover_start_date: startDate,
          cover_end_date: endDate,
          classes: selectedClasses,
          cover_type: coverType,
          agency_name: agencyName || undefined,
          special_reqs: specialReqs || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong.'); return }

      setResult(data as CoverResult)
      onBooked({
        id: data.id ?? crypto.randomUUID(),
        absent_staff: absentStaff.trim(),
        cover_start_date: startDate,
        cover_end_date: endDate,
        classes: selectedClasses,
        cover_type: data.internal_cover_found ? 'Internal' : coverType,
        agency_name: agencyName || null,
        assigned_to: data.assigned_to,
        special_reqs: specialReqs || null,
        estimated_cost: data.estimated_cost,
        status: 'Pending',
        created_at: new Date().toISOString(),
      }, data as CoverResult)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Success screen
  if (result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <div className="w-full max-w-md rounded-2xl p-7" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(13,148,136,0.15)' }}>
              <CheckCircle2 size={28} style={{ color: '#0D9488' }} />
            </div>
            <div>
              <h3 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Cover Booked</h3>
              <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>
                {result.days} day{result.days !== 1 ? 's' : ''} · {formatCurrency(result.estimated_cost)} estimated
              </p>
            </div>

            <div className="w-full rounded-xl p-4 text-left" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#6B7280' }}>Actions triggered</p>
              <div className="flex flex-col gap-2">
                {result.internal_cover_found ? (
                  <div className="flex items-center gap-2">
                    <BadgeCheck size={14} style={{ color: '#0D9488' }} />
                    <span className="text-sm" style={{ color: '#F9FAFB' }}>
                      Internal cover assigned — {result.assigned_to}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Building2 size={14} style={{ color: '#F59E0B' }} />
                    <span className="text-sm" style={{ color: '#F9FAFB' }}>Supply agency request sent via n8n</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <BookOpen size={14} style={{ color: '#6B7280' }} />
                  <span className="text-sm" style={{ color: '#D1D5DB' }}>Booking saved to cover register</span>
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
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: '#1F2937' }}>
          <div className="flex items-center gap-2">
            <CalendarDays size={18} style={{ color: '#0D9488' }} />
            <h2 className="text-base font-semibold" style={{ color: '#F9FAFB' }}>New Cover Booking</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 transition-colors hover:bg-gray-800">
            <X size={16} style={{ color: '#9CA3AF' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 py-5 max-h-[75vh] overflow-y-auto">
          {/* Absent staff */}
          <div className="relative">
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>Absent Staff Member *</label>
            <input
              value={absentStaff}
              onChange={e => handleStaffInput(e.target.value)}
              placeholder="Type name…"
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
              style={{ backgroundColor: '#07080F', border: '1px solid #374151', color: '#F9FAFB' }}
            />
            {staffSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 rounded-lg overflow-hidden shadow-lg" style={{ backgroundColor: '#1C1F26', border: '1px solid #374151' }}>
                {staffSuggestions.map(s => (
                  <button key={s} type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-700 transition-colors"
                    style={{ color: '#F9FAFB' }}
                    onClick={() => { setAbsentStaff(s); setStaffSuggestions([]) }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>Cover From *</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{ backgroundColor: '#07080F', border: '1px solid #374151', color: '#F9FAFB', colorScheme: 'dark' }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>Cover To *</label>
              <input type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{ backgroundColor: '#07080F', border: '1px solid #374151', color: '#F9FAFB', colorScheme: 'dark' }} />
            </div>
          </div>

          {/* Classes */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: '#9CA3AF' }}>
              Classes / Year Groups to Cover *
            </label>
            <div className="flex flex-wrap gap-2">
              {YEAR_GROUPS.map(cls => {
                const sel = selectedClasses.includes(cls)
                return (
                  <button key={cls} type="button"
                    onClick={() => toggleClass(cls)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: sel ? 'rgba(13,148,136,0.2)' : 'rgba(55,65,81,0.4)',
                      color: sel ? '#0D9488' : '#9CA3AF',
                      border: `1px solid ${sel ? '#0D9488' : '#374151'}`,
                    }}>
                    {cls}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Cover type */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: '#9CA3AF' }}>Cover Type *</label>
            <div className="flex flex-wrap gap-2">
              {COVER_TYPES.map(type => {
                const sel = coverType === type
                return (
                  <button key={type} type="button"
                    onClick={() => setCoverType(type)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: sel ? 'rgba(59,130,246,0.2)' : 'rgba(55,65,81,0.4)',
                      color: sel ? '#60A5FA' : '#9CA3AF',
                      border: `1px solid ${sel ? '#3B82F6' : '#374151'}`,
                    }}>
                    {type}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Agency (if supply) */}
          {(coverType === 'Supply Agency') && (
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>Agency Name</label>
              <select value={agencyName} onChange={e => setAgencyName(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{ backgroundColor: '#07080F', border: '1px solid #374151', color: '#F9FAFB' }}>
                <option value="">Select agency…</option>
                {AGENCIES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          )}

          {/* Special requirements */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>Special Requirements</label>
            <textarea value={specialReqs} onChange={e => setSpecialReqs(e.target.value)}
              rows={2} placeholder="SEN experience required, DBS needed, lesson plans available…"
              className="w-full resize-none rounded-lg px-3 py-2.5 text-sm outline-none"
              style={{ backgroundColor: '#07080F', border: '1px solid #374151', color: '#F9FAFB' }} />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg px-3 py-2.5"
              style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <AlertTriangle size={14} style={{ color: '#EF4444' }} />
              <p className="text-xs" style={{ color: '#FCA5A5' }}>{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1 pb-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-lg py-2.5 text-sm font-medium"
              style={{ backgroundColor: 'rgba(55,65,81,0.4)', color: '#9CA3AF', border: '1px solid #374151' }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold"
              style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
              {submitting ? <><Loader2 size={14} className="animate-spin" /> Booking…</> : 'Book Cover'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const colours: Record<string, { bg: string; color: string }> = {
    'Pending':   { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B' },
    'Confirmed': { bg: 'rgba(13,148,136,0.12)', color: '#0D9488' },
    'Cancelled': { bg: 'rgba(107,114,128,0.12)', color: '#9CA3AF' },
  }
  const c = colours[status] ?? colours['Pending']
  return (
    <span className="rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: c.bg, color: c.color }}>
      {status}
    </span>
  )
}

function CoverTypeBadge({ type, assignedTo }: { type: string; assignedTo: string | null }) {
  const isInternal = type === 'Internal'
  return (
    <div className="flex flex-col gap-0.5">
      <span className="rounded-full px-2 py-0.5 text-xs font-medium w-fit"
        style={{
          backgroundColor: isInternal ? 'rgba(13,148,136,0.12)' : 'rgba(245,158,11,0.12)',
          color: isInternal ? '#0D9488' : '#F59E0B',
        }}>
        {isInternal ? 'Internal' : type}
      </span>
      {isInternal && assignedTo && (
        <span className="text-xs" style={{ color: '#6B7280' }}>{assignedTo}</span>
      )}
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CoverPage() {
  const supabase = useSupabase()
  const [showModal, setShowModal]       = useState(false)
  const [bookings, setBookings]         = useState<CoverBooking[]>([])
  const [loading, setLoading]           = useState(true)
  const [totalToday, setTotalToday]     = useState(0)
  const [internalCount, setInternalCount] = useState(0)
  const [supplyCount, setSupplyCount]   = useState(0)
  const [totalCost, setTotalCost]       = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase
          .from('school_cover_bookings')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)

        if (data) {
          const records = data as CoverBooking[]
          const today = todayISO()
          setBookings(records)
          setTotalToday(records.filter(b => b.cover_start_date <= today && b.cover_end_date >= today).length)
          setInternalCount(records.filter(b => b.cover_type === 'Internal').length)
          setSupplyCount(records.filter(b => b.cover_type !== 'Internal').length)
          setTotalCost(records.reduce((sum, b) => sum + (b.estimated_cost ?? 0), 0))
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [supabase])

  function handleBooked(booking: CoverBooking, result: CoverResult) {
    setBookings(prev => [booking, ...prev])
    const today = todayISO()
    if (booking.cover_start_date <= today && booking.cover_end_date >= today) setTotalToday(c => c + 1)
    if (booking.cover_type === 'Internal') setInternalCount(c => c + 1)
    else setSupplyCount(c => c + 1)
    setTotalCost(c => c + (result.estimated_cost ?? 0))
  }

  const stats = [
    {
      label: 'Active Cover Today',
      value: String(totalToday),
      trend: 'live',
      trendDir: 'up' as const,
      trendGood: false,
      icon: CalendarDays,
      sub: new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }),
    },
    {
      label: 'Internal Cover',
      value: String(internalCount),
      trend: 'from cover pool',
      trendDir: 'down' as const,
      trendGood: true,
      icon: User,
      sub: 'no agency cost',
    },
    {
      label: 'Supply Agency',
      value: String(supplyCount),
      trend: supplyCount > 0 ? 'agency contacted' : 'none needed',
      trendDir: supplyCount > 0 ? 'up' as const : 'down' as const,
      trendGood: supplyCount === 0,
      icon: Building2,
      sub: 'external bookings',
    },
    {
      label: 'Estimated Cost',
      value: formatCurrency(totalCost),
      trend: 'this period',
      trendDir: 'up' as const,
      trendGood: false,
      icon: Banknote,
      sub: 'all bookings',
    },
  ]

  const todayBookings   = bookings.filter(b => {
    const today = todayISO()
    return b.cover_start_date <= today && b.cover_end_date >= today
  })
  const upcomingBookings = bookings.filter(b => b.cover_start_date > todayISO()).slice(0, 10)
  const pastBookings     = bookings.filter(b => b.cover_end_date < todayISO()).slice(0, 15)

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
          <CalendarDays size={12} /> Supply Cover
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Supply Cover Bookings</h2>
          <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
            Manage internal and agency supply cover — pool checked automatically before contacting agencies
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
          style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0F766E' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0D9488' }}>
          <Plus size={15} />
          New Booking
        </button>
      </div>

      {/* Stats */}
      <ChartSection points={stats.map(s => ({ label: s.label, value: parseNum(s.value.replace('£', '').replace(',', '')) }))}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(s => <StatCard key={s.label} {...s} />)}
        </div>
      </ChartSection>

      {/* How it works */}
      <div className="rounded-xl px-5 py-4" style={{ backgroundColor: 'rgba(13,148,136,0.06)', border: '1px solid rgba(13,148,136,0.15)' }}>
        <div className="flex items-start gap-3">
          <Clock size={16} className="shrink-0 mt-0.5" style={{ color: '#0D9488' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Smart Cover Allocation</p>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
              When you book cover, the system checks available staff in your internal cover pool first (PPA / free periods). If no internal cover is available, the n8n workflow automatically contacts your supply agency.
            </p>
          </div>
        </div>
      </div>

      {/* Today's cover */}
      <SectionCard title={`Active Today (${todayBookings.length})`}>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={20} className="animate-spin" style={{ color: '#9CA3AF' }} />
          </div>
        ) : todayBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10">
            <CalendarDays size={28} style={{ color: '#374151' }} />
            <p className="text-sm" style={{ color: '#9CA3AF' }}>No active cover today</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: '#1F2937' }}>
            {todayBookings.map(b => (
              <div key={b.id} className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{b.absent_staff}</span>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {b.classes.map(cls => (
                      <span key={cls} className="rounded px-1.5 py-0.5 text-xs"
                        style={{ backgroundColor: 'rgba(55,65,81,0.5)', color: '#9CA3AF' }}>
                        {cls}
                      </span>
                    ))}
                  </div>
                  {b.special_reqs && (
                    <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Note: {b.special_reqs}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <CoverTypeBadge type={b.cover_type} assignedTo={b.assigned_to} />
                  {b.estimated_cost != null && (
                    <span className="text-xs font-medium" style={{ color: '#6B7280' }}>
                      {formatCurrency(b.estimated_cost)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Upcoming */}
      {upcomingBookings.length > 0 && (
        <SectionCard title={`Upcoming (${upcomingBookings.length})`}>
          <div className="divide-y" style={{ borderColor: '#1F2937' }}>
            {upcomingBookings.map(b => (
              <div key={b.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{b.absent_staff}</span>
                  <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                    {formatDisplayDate(b.cover_start_date)}
                    {b.cover_end_date !== b.cover_start_date ? ` → ${formatDisplayDate(b.cover_end_date)}` : ''}
                    {' · '}{b.classes.join(', ')}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <CoverTypeBadge type={b.cover_type} assignedTo={b.assigned_to} />
                  <StatusBadge status={b.status} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Past bookings */}
      {pastBookings.length > 0 && (
        <SectionCard title="Past Bookings">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #1F2937' }}>
                  {['Staff', 'Dates', 'Classes', 'Cover', 'Cost', 'Status'].map(h => (
                    <th key={h} className="pb-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: '#6B7280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#1F2937' }}>
                {pastBookings.map(b => (
                  <tr key={b.id}>
                    <td className="py-3 pr-4 text-sm font-medium" style={{ color: '#F9FAFB' }}>{b.absent_staff}</td>
                    <td className="py-3 pr-4 text-xs whitespace-nowrap" style={{ color: '#9CA3AF' }}>
                      {formatDisplayDate(b.cover_start_date)}
                      {b.cover_end_date !== b.cover_start_date ? <><br />{formatDisplayDate(b.cover_end_date)}</> : ''}
                    </td>
                    <td className="py-3 pr-4 text-xs" style={{ color: '#9CA3AF' }}>{b.classes.join(', ')}</td>
                    <td className="py-3 pr-4"><CoverTypeBadge type={b.cover_type} assignedTo={b.assigned_to} /></td>
                    <td className="py-3 pr-4 text-xs font-medium" style={{ color: '#6B7280' }}>
                      {b.estimated_cost != null ? formatCurrency(b.estimated_cost) : '—'}
                    </td>
                    <td className="py-3"><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* Workflow guide */}
      <SectionCard title="How Cover Booking Works">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { step: '1', title: 'Book Cover', desc: 'Enter absent staff member, dates, and which classes need covering.', icon: Plus },
            { step: '2', title: 'Auto-Assign', desc: 'System checks internal cover pool. Available HLTA/Cover Supervisors assigned first.', icon: Users },
            { step: '3', title: 'Agency Fallback', desc: 'If no internal cover, n8n triggers supply agency request automatically.', icon: Building2 },
          ].map(({ step, title, desc, icon: Icon }) => (
            <div key={step} className="rounded-xl p-4" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
                  style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488' }}>{step}</span>
                <Icon size={14} style={{ color: '#0D9488' }} />
                <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{title}</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>{desc}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {showModal && <NewCoverModal onClose={() => setShowModal(false)} onBooked={handleBooked} />}
    </PageShell>
  )
}
