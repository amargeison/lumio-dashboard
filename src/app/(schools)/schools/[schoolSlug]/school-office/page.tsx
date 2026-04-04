'use client'
import React, { useState, useEffect } from 'react'
import { EmptyState } from '@/app/(schools)/components/EmptyState'
import { Sparkles, UserMinus, UserPlus, MessageSquare, LogOut, Map, AlertTriangle, Wrench, BarChart3, Phone, Check, ClipboardList, UserCheck, Heart, FileText, Database, Pill, Bell, Shield } from 'lucide-react'
import { LogAbsenceModal, ParentContactModal, SchoolReportModal, NewAdmissionModal, BookCoverModal, RegisterSessionModal } from '@/components/modals/SchoolModals'
import SchoolTripsModal from '@/components/modals/SchoolTripsModal'
import { LogIncidentModal, LogMaintenanceModal } from '@/components/modals/SchoolOfficeModals'
import { SchoolLockdownModal } from '@/components/modals/SchoolLockdownModal'
import DeptAISummary from '@/components/DeptAISummary'
import AIInsightsReport from '@/components/AIInsightsReport'
import { VisitorSignInModal, FirstAidLogModal, LetterGeneratorModal, DataRequestModal, MedicationLogModal, SendAnnouncementModal } from '@/components/modals/SchoolOfficeExtraModals'

const HIGHLIGHTS = [
  '14 pupils marked absent today — 3 with no parent contact yet',
  'New admission form received for Jamie Hassan — starts 7 April, Year 3',
  'Trip permission deadline for Year 5 London trip is Friday — 12 of 28 still outstanding',
  'FSM review due for 6 pupils — eligibility check needed before end of term',
]

const ACTIONS_BASE = [
  { label: 'Parent Contact', icon: <Phone size={14} /> },
  { label: 'Mark Register', icon: <Check size={14} /> },
  { label: 'Log Absence', icon: <ClipboardList size={14} /> },
  { label: 'Visitor Sign-in', icon: <UserCheck size={14} /> },
  { label: 'First Aid Log', icon: <Heart size={14} /> },
  { label: 'Letter Generator', icon: <FileText size={14} /> },
  { label: 'Data Request', icon: <Database size={14} /> },
  { label: 'Medication Log', icon: <Pill size={14} /> },
  { label: 'Send Announcement', icon: <Bell size={14} /> },
]

const STATS = [
  { label: 'Total Pupils', value: '423', sub: 'Oakridge Primary' },
  { label: 'New Admissions', value: '3', sub: 'This term' },
  { label: 'Leavers', value: '2', sub: 'End of term' },
  { label: 'Messages Today', value: '12', sub: 'Sent today' },
]

const ABSENCES = [
  { id: 1, name: 'Aisha Patel', year: 'Year 2', reason: 'Illness', contact: true },
  { id: 2, name: 'Liam Chen', year: 'Year 4', reason: 'Illness', contact: false },
  { id: 3, name: 'Priya Williams', year: 'Year 1', reason: 'Dental', contact: true },
  { id: 4, name: 'Marcus Brown', year: 'Year 5', reason: 'Illness', contact: false },
  { id: 5, name: 'Sophie Clarke', year: 'Year 3', reason: 'Holiday', contact: true },
  { id: 6, name: 'James Ford', year: 'Year 3', reason: 'Unknown', contact: false },
  { id: 7, name: 'Chloe Osei', year: 'Year 6', reason: 'Illness', contact: true },
]

const ADMISSIONS = [
  { id: 1, name: 'Jamie Hassan', year: 'Year 3', start: '7 Apr 2026', status: 'Confirmed', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  { id: 2, name: 'Ella Wright', year: 'Year 1', start: '14 Apr 2026', status: 'Paperwork pending', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  { id: 3, name: 'Noah Garcia', year: 'Reception', start: '19 Apr 2026', status: 'Awaiting DFE ref', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
]

const COMMUNICATIONS = [
  { id: 1, subject: 'Year 5 London Trip reminder', audience: '28 families', scheduled: 'Scheduled Thu 9am', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  { id: 2, subject: 'FSM eligibility letters', audience: '6 families', scheduled: 'Draft', color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)' },
  { id: 3, subject: 'End of term newsletter', audience: 'All', scheduled: 'Awaiting sign-off', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
]

const TRIPS = [
  { id: 1, name: 'Year 5 London (Science Museum)', date: '2 May', pupils: 28, returned: 16, total: 28 },
  { id: 2, name: 'Reception Farm Trip', date: '28 Mar', pupils: 22, returned: 22, total: 22 },
]

function StatCard({ label, value, sub, color = '#0D9488' }: { label: string; value: string; sub: string; color?: string }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{label}</p>
      <p className="text-2xl font-black mt-1" style={{ color }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{sub}</p>
    </div>
  )
}

function AIHighlights({ items }: { items: string[] }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(13,148,136,0.4)' }}>
      <div className="flex items-center gap-2 px-4 py-3" style={{ backgroundColor: 'rgba(13,148,136,0.08)', borderBottom: '1px solid rgba(13,148,136,0.2)' }}>
        <Sparkles size={14} style={{ color: '#0D9488' }} />
        <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>AI Key Highlights</span>
        <span className="text-xs ml-auto" style={{ color: '#6B7280' }}>Updated just now</span>
      </div>
      <div className="flex flex-col gap-3 p-4" style={{ backgroundColor: '#07080F' }}>
        {items.map((item, i) => (
          <div key={i} className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488' }}>{i + 1}</span>
            <p className="text-xs leading-relaxed" style={{ color: '#D1D5DB' }}>{item}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function QuickActions({ actions }: { actions: { label: string; icon: React.ReactNode; onClick?: () => void; urgent?: boolean }[] }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <p className="text-xs font-semibold mb-2.5 uppercase tracking-widest" style={{ color: '#9CA3AF' }}>Quick actions</p>
      <div className="flex flex-wrap gap-2">
        {actions.map(a => (
          <button key={a.label} onClick={a.onClick} className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            style={{ backgroundColor: a.urgent ? '#DC2626' : '#0D9488', color: '#F9FAFB', animation: a.urgent ? 'pulse 2s infinite' : 'none' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = a.urgent ? '#B91C1C' : '#0F766E')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = a.urgent ? '#DC2626' : '#0D9488')}>
            {a.icon}{a.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold" style={{ color, backgroundColor: bg }}>{label}</span>
  )
}

export default function SchoolOfficePage() {
  const [hasData, setHasData] = useState<boolean | null>(null)
  const [showLogAbsence, setShowLogAbsence] = useState(false)
  const [showParentContact, setShowParentContact] = useState(false)
  const [showSchoolReport, setShowSchoolReport] = useState(false)
  const [showNewAdmission, setShowNewAdmission] = useState(false)
  const [showBookCover, setShowBookCover] = useState(false)
  const [showTrips, setShowTrips] = useState(false)
  const [showAIInsights, setShowAIInsights] = useState(false)
  const [showIncident, setShowIncident] = useState(false)
  const [showMaintenance, setShowMaintenance] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [showLockdown, setShowLockdown] = useState(false)
  const [showVisitor, setShowVisitor] = useState(false)
  const [showFirstAid, setShowFirstAid] = useState(false)
  const [showLetter, setShowLetter] = useState(false)
  const [showDataRequest, setShowDataRequest] = useState(false)
  const [showMedication, setShowMedication] = useState(false)
  const [showAnnouncement, setShowAnnouncement] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  useEffect(() => {
    const pathname = window.location.pathname
    const slugMatch = pathname.match(/\/schools\/([^/]+)/)
    const slug = slugMatch?.[1] ?? 'school'
    setHasData(
      localStorage.getItem(`lumio_${slug}_school-office_hasData`) === 'true' ||
      localStorage.getItem('lumio_schools_demo_loaded') === 'true'
    )
  }, [])

  if (hasData === null) return null
  if (!hasData) return (
    <EmptyState
      pageName="school-office"
      title="No school office data yet"
      description="Upload your pupil roll, absence records and admissions data to activate the School Office dashboard."
      uploads={[
        { key: 'pupils', label: 'Upload Pupil Roll (CSV)' },
        { key: 'absences', label: 'Upload Absence Records (CSV)' },
        { key: 'admissions', label: 'Upload Admissions Data (CSV)' },
        { key: 'mis', label: 'Connect MIS (Arbor / SIMS / Bromcom)' },
      ]}
    />
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Page title */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>School Office</h1>
        <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>Absences, admissions, communications and trips — Oakridge Primary</p>
      </div>

      {/* Quick actions */}
      <QuickActions actions={[
        { label: '🚨 School Lockdown', icon: <Shield size={14} />, onClick: () => setShowLockdown(true), urgent: true },
        ...ACTIONS_BASE.map(a => ({
          ...a,
          onClick: a.label === 'Parent Contact' ? () => setShowParentContact(true)
            : a.label === 'Log Absence' ? () => setShowLogAbsence(true)
            : a.label === 'Mark Register' ? () => setShowRegister(true)
            : a.label === 'Visitor Sign-in' ? () => setShowVisitor(true)
            : a.label === 'First Aid Log' ? () => setShowFirstAid(true)
            : a.label === 'Letter Generator' ? () => setShowLetter(true)
            : a.label === 'Data Request' ? () => setShowDataRequest(true)
            : a.label === 'Medication Log' ? () => setShowMedication(true)
            : a.label === 'Send Announcement' ? () => setShowAnnouncement(true)
            : () => showToast('Feature coming soon'),
        })),
        { label: 'Dept Insights', icon: <BarChart3 size={14} />, onClick: () => setShowAIInsights(true) },
      ]} />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STATS.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Absences today */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Absences Today</p>
            <Badge label="14 absent" color="#EF4444" bg="rgba(239,68,68,0.12)" />
          </div>
          <span className="text-xs cursor-pointer" style={{ color: '#0D9488' }}>View all 14 →</span>
        </div>
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          {/* Header row */}
          <div className="grid grid-cols-4 gap-4 px-5 py-2">
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Pupil</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Year Group</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Reason</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Contact Made</p>
          </div>
          {ABSENCES.map(row => (
            <div key={row.id} className="grid grid-cols-4 gap-4 px-5 py-3 items-center">
              <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{row.name}</p>
              <p className="text-sm" style={{ color: '#D1D5DB' }}>{row.year}</p>
              <p className="text-sm" style={{ color: '#D1D5DB' }}>{row.reason}</p>
              <div>
                {row.contact ? (
                  <Badge label="Yes" color="#22C55E" bg="rgba(34,197,94,0.12)" />
                ) : row.reason === 'Unknown' ? (
                  <Badge label="No contact" color="#EF4444" bg="rgba(239,68,68,0.12)" />
                ) : (
                  <Badge label="No" color="#EF4444" bg="rgba(239,68,68,0.12)" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent admissions */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Recent Admissions</p>
          <span className="text-xs cursor-pointer" style={{ color: '#0D9488' }}>Manage all →</span>
        </div>
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          <div className="grid grid-cols-4 gap-4 px-5 py-2">
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Pupil</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Year Group</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Start Date</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Status</p>
          </div>
          {ADMISSIONS.map(row => (
            <div key={row.id} className="grid grid-cols-4 gap-4 px-5 py-3 items-center">
              <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{row.name}</p>
              <p className="text-sm" style={{ color: '#D1D5DB' }}>{row.year}</p>
              <p className="text-sm" style={{ color: '#D1D5DB' }}>{row.start}</p>
              <Badge label={row.status} color={row.color} bg={row.bg} />
            </div>
          ))}
        </div>
      </div>

      {/* Pending communications */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Pending Communications</p>
          <span className="text-xs cursor-pointer" style={{ color: '#0D9488' }}>View all →</span>
        </div>
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          <div className="grid grid-cols-3 gap-4 px-5 py-2">
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Subject</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Audience</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Status</p>
          </div>
          {COMMUNICATIONS.map(row => (
            <div key={row.id} className="grid grid-cols-3 gap-4 px-5 py-3 items-center">
              <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{row.subject}</p>
              <p className="text-sm" style={{ color: '#D1D5DB' }}>{row.audience}</p>
              <Badge label={row.scheduled} color={row.color} bg={row.bg} />
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming trips */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Upcoming Trips</p>
          <span className="text-xs cursor-pointer" style={{ color: '#0D9488' }}>Manage trips →</span>
        </div>
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          {TRIPS.map(trip => {
            const pct = Math.round((trip.returned / trip.total) * 100)
            const complete = trip.returned === trip.total
            return (
              <div key={trip.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{trip.name}</p>
                    <Badge
                      label={complete ? 'All forms returned' : `${trip.returned}/${trip.total} forms returned`}
                      color={complete ? '#22C55E' : '#F59E0B'}
                      bg={complete ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)'}
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-xs" style={{ color: '#6B7280' }}>{trip.date} · {trip.pupils} pupils</p>
                  </div>
                  <div className="mt-2" style={{ backgroundColor: '#1F2937' }}>
                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#1F2937' }}>
                      <div style={{ width: `${pct}%`, backgroundColor: complete ? '#22C55E' : '#0D9488' }} className="h-full rounded-full" />
                    </div>
                  </div>
                </div>
                <p className="text-sm font-bold shrink-0" style={{ color: complete ? '#22C55E' : '#F59E0B' }}>{pct}%</p>
              </div>
            )
          })}
        </div>
      </div>

      {showLogAbsence && <LogAbsenceModal onClose={() => setShowLogAbsence(false)} onToast={showToast} />}
      {showParentContact && <ParentContactModal onClose={() => setShowParentContact(false)} onToast={showToast} />}
      {showSchoolReport && <SchoolReportModal onClose={() => setShowSchoolReport(false)} onToast={showToast} />}
      {showNewAdmission && <NewAdmissionModal onClose={() => setShowNewAdmission(false)} onToast={showToast} />}
      {showBookCover && <BookCoverModal onClose={() => setShowBookCover(false)} onToast={showToast} />}
      {showTrips && <SchoolTripsModal onClose={() => setShowTrips(false)} onToast={showToast} />}
      {showIncident && <LogIncidentModal onClose={() => setShowIncident(false)} />}
      {showMaintenance && <LogMaintenanceModal onClose={() => setShowMaintenance(false)} />}
      {showRegister && <RegisterSessionModal onClose={() => setShowRegister(false)} onToast={showToast} />}
      {showLockdown && <SchoolLockdownModal onClose={() => setShowLockdown(false)} isDemoMode={localStorage.getItem('lumio_schools_demo_loaded') === 'true'} />}
      {showVisitor && <VisitorSignInModal onClose={() => setShowVisitor(false)} />}
      {showFirstAid && <FirstAidLogModal onClose={() => setShowFirstAid(false)} />}
      {showLetter && <LetterGeneratorModal onClose={() => setShowLetter(false)} />}
      {showDataRequest && <DataRequestModal onClose={() => setShowDataRequest(false)} />}
      {showMedication && <MedicationLogModal onClose={() => setShowMedication(false)} />}
      {showAnnouncement && <SendAnnouncementModal onClose={() => setShowAnnouncement(false)} />}
      <AIInsightsReport dept="school-office" portal="schools" isOpen={showAIInsights} onClose={() => setShowAIInsights(false)} />
      {toast && <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 100, backgroundColor: '#0D9488', color: '#F9FAFB', padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600 }}>{toast}</div>}

      {/* AI Intelligence — bottom of page */}
      <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #1F2937' }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
          <DeptAISummary dept="school-office" portal="schools" />
          <AIHighlights items={HIGHLIGHTS} />
        </div>
  
      </div>

    </div>
  )
}
