'use client'

import { useState, useEffect, useRef, useCallback, DragEvent, ChangeEvent } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import {
  TrendingUp, Users, BookOpen, Mail, ExternalLink, Building2,
  Calendar, User, Plus, X, Upload, FileText, Loader2,
  Sparkles, ChevronDown, ChevronUp, Star,
} from 'lucide-react'
import { StatCard, Badge, SectionCard, PageShell, QuickActions } from '@/components/page-ui'
import { ChartSection, parseNum } from '@/components/chart-ui'
import DeptAISummary from '@/components/DeptAISummary'
import AIInsightsReport from '@/components/AIInsightsReport'
import { DashboardEmptyState, useHasDashboardData } from '@/components/dashboard/EmptyState'
import DeptStaffHeader from '@/components/dashboard/DeptStaffHeader'
import { getDeptStaff, getDeptLead, getStaffName } from '@/lib/staff/deptMatch'

// ─── Supabase ─────────────────────────────────────────────────────────────────

function useSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface AddedPartner {
  id: string
  name: string
  type: string
  website: string
  contact_name: string
  contact_email: string
  notes: string
  file_name: string | null
  file_url: string | null
  created_at: string
}

const PARTNER_TYPES = [
  'Technology', 'Distribution', 'Reseller', 'Integration',
  'Strategic Alliance', 'Government', 'Academic', 'Other',
]

// ─── DfE AI Highlights ────────────────────────────────────────────────────────

const dfePartnerHighlights: string[] = [
  'Strong registration growth: 124 new MoUs signed in January — highest monthly total this academic year',
  'Pupil assessments milestone: 50,052 pupils assessed, crossing 50,000 for the first time this year',
  'Engagement surge: targeted outreach jumped 189% month-on-month to 24,377 emails sent',
  'Follow-up assessments accelerating: 1,226 recorded, up 203% from December',
  'Zero complaints maintained across all 5 reported months — exceptional record at this delivery scale',
  'Digital footprint growing: 2,111 schools showing active delivery signals, up 9.2% on December',
]

function DfEAIPanel() {
  const [open, setOpen] = useState(true)
  return (
    <div className="overflow-hidden rounded-xl" style={{ border: '1px solid #6C3FC5' }}>
      <button
        className="flex w-full items-center justify-between px-5 py-4"
        style={{ backgroundColor: 'rgba(108,63,197,0.08)', borderBottom: open ? '1px solid rgba(108,63,197,0.3)' : undefined }}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={14} style={{ color: '#6C3FC5' }} />
          <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>AI Key Highlights</span>
          <span className="rounded-md px-2 py-0.5 text-xs font-semibold"
            style={{ backgroundColor: 'rgba(108,63,197,0.2)', color: '#A78BFA' }}>Jan</span>
        </div>
        {open
          ? <ChevronUp size={14} style={{ color: '#6C3FC5' }} />
          : <ChevronDown size={14} style={{ color: '#6C3FC5' }} />}
      </button>
      {open && (
        <div className="flex flex-col gap-3 p-5" style={{ backgroundColor: '#0f0e17' }}>
          {dfePartnerHighlights.map((item, i) => (
            <div key={i} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{ backgroundColor: 'rgba(108,63,197,0.2)', color: '#A78BFA' }}>{i + 1}</span>
              <p className="text-xs leading-relaxed" style={{ color: '#C4B5FD' }}>{item}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Hardcoded Partner Views ──────────────────────────────────────────────────

function DfEView() {
  const stats = [
    { label: 'Schools Registered',  value: '10,973', trend: '+847',   trendDir: 'up' as const, trendGood: true, icon: Building2, sub: 'vs September baseline' },
    { label: 'Pupils Assessed',     value: '50,052', trend: '+6,210', trendDir: 'up' as const, trendGood: true, icon: Users,     sub: 'cumulative AY 2025/26' },
    { label: 'Course Completions',  value: '76,567', trend: '+8,942', trendDir: 'up' as const, trendGood: true, icon: BookOpen,  sub: 'cumulative AY 2025/26' },
    { label: 'Engagement Emails',   value: '221,209',trend: '+34,122',trendDir: 'up' as const, trendGood: true, icon: Mail,      sub: 'cumulative AY 2025/26' },
  ]
  const highlights = [
    { label: 'Programme',           value: 'NELI — Nuffield Early Language Intervention' },
    { label: 'Academic Year',       value: '2025 / 2026' },
    { label: 'Engagement Rate',     value: '87.3%' },
    { label: 'Avg NELI Score Gain', value: '+8.2 pts' },
    { label: 'EAL Pupils Screened', value: '12,441' },
    { label: 'Data Source',         value: 'Snowflake · HubSpot · FutureLearn' },
  ]
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between rounded-xl px-6 py-5"
        style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg text-lg font-bold"
              style={{ backgroundColor: '#003078', color: '#FFFFFF' }}>DfE</div>
            <div>
              <p className="text-base font-semibold" style={{ color: '#F9FAFB' }}>Department for Education</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>NELI Programme Partner · UK Government</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge status="Active" />
          <div className="flex items-center gap-4 text-xs" style={{ color: '#9CA3AF' }}>
            <span className="flex items-center gap-1"><Calendar size={12} /> Next review: Jun 2026</span>
            <span className="flex items-center gap-1"><User size={12} /> Contact: Sarah Mitchell</span>
          </div>
        </div>
      </div>
      <ChartSection points={stats.map(s => ({ label: s.label, value: parseNum(s.value) }))}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </ChartSection>
      <SectionCard title="Quick Links">
        <div className="flex flex-col gap-1 p-3">
          <Link href="/dfe"
            className="flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors"
            style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
            <span>View Full NELI Dashboard</span>
            <ExternalLink size={14} />
          </Link>
          <p className="px-1 pt-3 text-xs" style={{ color: '#9CA3AF' }}>
            The full DfE NELI dashboard shows month-by-month data across all 7 metric groups, AI insights, and engagement snapshots for AY 2025/26.
          </p>
        </div>
      </SectionCard>
      <DfEAIPanel />
      <SectionCard title="Programme Highlights">
        <div className="flex flex-col">
          {highlights.map((h, i) => (
            <div key={h.label} className="flex items-center justify-between px-5 py-3"
              style={{ borderBottom: i < highlights.length - 1 ? '1px solid #1F2937' : undefined }}>
              <span className="text-sm" style={{ color: '#9CA3AF' }}>{h.label}</span>
              <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{h.value}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

function RGRView() {
  const stats = [
    { label: 'Schools Using RGR',    value: '—', trend: 'Coming soon', trendDir: 'up' as const, trendGood: true, icon: Building2, sub: 'integration pending' },
    { label: 'Active Licences',      value: '—', trend: 'Coming soon', trendDir: 'up' as const, trendGood: true, icon: BookOpen,  sub: 'integration pending' },
    { label: 'Training Completions', value: '—', trend: 'Coming soon', trendDir: 'up' as const, trendGood: true, icon: TrendingUp,sub: 'integration pending' },
    { label: 'Support Tickets',      value: '—', trend: 'Coming soon', trendDir: 'up' as const, trendGood: true, icon: Users,     sub: 'integration pending' },
  ]
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between rounded-xl px-6 py-5"
        style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg text-xs font-bold text-center"
            style={{ backgroundColor: '#1F2937', color: '#F9FAFB' }}>RGR</div>
          <div>
            <p className="text-base font-semibold" style={{ color: '#F9FAFB' }}>Really Great Reading</p>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>Reading Intervention Partner</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge status="Pending" />
          <div className="flex items-center gap-4 text-xs" style={{ color: '#9CA3AF' }}>
            <span className="flex items-center gap-1"><Calendar size={12} /> Next review: Sep 2026</span>
            <span className="flex items-center gap-1"><User size={12} /> Contact: James Halford</span>
          </div>
        </div>
      </div>
      <ChartSection points={stats.map(s => ({ label: s.label, value: parseNum(s.value) }))}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </ChartSection>
      <SectionCard title="Integration Status">
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: '#1F2937' }}>
            <BookOpen size={28} style={{ color: '#9CA3AF' }} />
          </div>
          <p className="text-base font-semibold" style={{ color: '#F9FAFB' }}>Dashboard Coming Soon</p>
          <p className="max-w-sm text-center text-sm" style={{ color: '#9CA3AF' }}>
            The Really Great Reading partner integration is currently in progress.
          </p>
          <span className="mt-2 rounded-md px-3 py-1 text-xs font-semibold"
            style={{ backgroundColor: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>
            Integration in progress · Est. Q3 2026
          </span>
        </div>
      </SectionCard>
    </div>
  )
}

function PearsonView() {
  const stats = [
    { label: 'Schools',            value: '—', trend: 'Coming soon', trendDir: 'up' as const, trendGood: true, icon: Building2, sub: 'integration pending' },
    { label: 'Active Users',       value: '—', trend: 'Coming soon', trendDir: 'up' as const, trendGood: true, icon: Users,     sub: 'integration pending' },
    { label: 'Resources Accessed', value: '—', trend: 'Coming soon', trendDir: 'up' as const, trendGood: true, icon: BookOpen,  sub: 'integration pending' },
    { label: 'Renewal Date',       value: '—', trend: 'Coming soon', trendDir: 'up' as const, trendGood: true, icon: Calendar,  sub: 'integration pending' },
  ]
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between rounded-xl px-6 py-5"
        style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg text-xs font-bold"
            style={{ backgroundColor: '#1F2937', color: '#F9FAFB' }}>PRS</div>
          <div>
            <p className="text-base font-semibold" style={{ color: '#F9FAFB' }}>Pearson</p>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>Educational Publishing Partner</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge status="Pending" />
          <div className="flex items-center gap-4 text-xs" style={{ color: '#9CA3AF' }}>
            <span className="flex items-center gap-1"><Calendar size={12} /> Next review: Oct 2026</span>
            <span className="flex items-center gap-1"><User size={12} /> Contact: Clare Nguyen</span>
          </div>
        </div>
      </div>
      <ChartSection points={stats.map(s => ({ label: s.label, value: parseNum(s.value) }))}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </ChartSection>
      <SectionCard title="Integration Status">
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: '#1F2937' }}>
            <BookOpen size={28} style={{ color: '#9CA3AF' }} />
          </div>
          <p className="text-base font-semibold" style={{ color: '#F9FAFB' }}>Dashboard Coming Soon</p>
          <p className="max-w-sm text-center text-sm" style={{ color: '#9CA3AF' }}>
            The Pearson partner integration is under scoping.
          </p>
          <span className="mt-2 rounded-md px-3 py-1 text-xs font-semibold"
            style={{ backgroundColor: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>
            Scoping · Est. Q4 2026
          </span>
        </div>
      </SectionCard>
    </div>
  )
}

// ─── User-added Partner View ──────────────────────────────────────────────────

function AddedPartnerView({ partner }: { partner: AddedPartner }) {
  const initials = partner.name.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between rounded-xl px-6 py-5"
        style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg text-sm font-bold"
            style={{ backgroundColor: 'rgba(108,63,197,0.25)', color: '#A78BFA' }}>
            {initials}
          </div>
          <div>
            <p className="text-base font-semibold" style={{ color: '#F9FAFB' }}>{partner.name}</p>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>{partner.type}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge status="Active" />
          <div className="flex items-center gap-4 text-xs" style={{ color: '#9CA3AF' }}>
            {partner.contact_name && (
              <span className="flex items-center gap-1"><User size={12} /> {partner.contact_name}</span>
            )}
            {partner.website && (
              <a href={partner.website} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 transition-colors hover:text-white">
                <ExternalLink size={12} /> Website
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Contact Details">
          <div className="flex flex-col">
            {[
              { label: 'Name',    value: partner.contact_name  || '—' },
              { label: 'Email',   value: partner.contact_email || '—' },
              { label: 'Website', value: partner.website       || '—' },
              { label: 'Type',    value: partner.type          || '—' },
            ].map((row, i, arr) => (
              <div key={row.label} className="flex items-center justify-between px-5 py-3"
                style={{ borderBottom: i < arr.length - 1 ? '1px solid #1F2937' : undefined }}>
                <span className="text-sm" style={{ color: '#9CA3AF' }}>{row.label}</span>
                <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{row.value}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        {(partner.notes || partner.file_name) && (
          <SectionCard title="Notes & Files">
            <div className="flex flex-col gap-3 p-4">
              {partner.notes && (
                <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>{partner.notes}</p>
              )}
              {partner.file_name && (
                <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
                  style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>
                  <FileText size={14} />
                  {partner.file_url
                    ? <a href={partner.file_url} target="_blank" rel="noreferrer"
                        className="hover:text-white transition-colors">{partner.file_name}</a>
                    : <span>{partner.file_name}</span>
                  }
                </div>
              )}
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  )
}

// ─── Add Partner Modal ────────────────────────────────────────────────────────

interface AddPartnerModalProps {
  onClose: () => void
  onSaved: (partner: AddedPartner) => void
}

function AddPartnerModal({ onClose, onSaved }: AddPartnerModalProps) {
  const supabase = useSupabase()
  const [name, setName]               = useState('')
  const [type, setType]               = useState(PARTNER_TYPES[0])
  const [website, setWebsite]         = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [notes, setNotes]             = useState('')
  const [file, setFile]               = useState<File | null>(null)
  const [dragging, setDragging]       = useState(false)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const acceptFile = useCallback((f: File) => {
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/csv']
    if (!allowed.includes(f.type) && !f.name.match(/\.(pdf|xlsx|xls|docx|csv)$/i)) {
      setError('Only PDF, XLSX, DOCX, or CSV files are accepted.')
      return
    }
    setFile(f)
    setError(null)
  }, [])

  const onDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) acceptFile(f)
  }, [acceptFile])

  async function handleSubmit() {
    if (!name.trim()) { setError('Partner name is required.'); return }
    setSaving(true)
    setError(null)
    try {
      let file_name: string | null = null
      let file_url: string | null = null

      if (file) {
        const ext = file.name.split('.').pop()
        const path = `partners/${Date.now()}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('partner-files')
          .upload(path, file, { upsert: true })
        if (uploadErr) {
          // Storage bucket may not exist — store name only
          file_name = file.name
        } else {
          file_name = file.name
          const { data: urlData } = supabase.storage.from('partner-files').getPublicUrl(path)
          file_url = urlData.publicUrl
        }
      }

      const payload = {
        name: name.trim(),
        type,
        website: website.trim(),
        contact_name: contactName.trim(),
        contact_email: contactEmail.trim(),
        notes: notes.trim(),
        file_name,
        file_url,
      }

      const { data, error: dbErr } = await supabase
        .from('partners')
        .insert(payload)
        .select()
        .single()

      if (dbErr) throw dbErr
      onSaved(data as AddedPartner)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save partner.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-lg rounded-2xl flex flex-col max-h-[90vh]"
        style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-base font-semibold" style={{ color: '#F9FAFB' }}>Add Partner</p>
          <button onClick={onClose} className="rounded-lg p-1.5 transition-colors hover:bg-white/5"
            style={{ color: '#9CA3AF' }}><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-4 overflow-y-auto px-6 py-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>
              Partner Name <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="Acme Ltd"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB' }} />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>Type</label>
            <select value={type} onChange={e => setType(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB' }}>
              {PARTNER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Website */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>Website URL</label>
            <input value={website} onChange={e => setWebsite(e.target.value)}
              placeholder="https://example.com"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB' }} />
          </div>

          {/* Contact name + email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>Contact Name</label>
              <input value={contactName} onChange={e => setContactName(e.target.value)}
                placeholder="Jane Smith"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB' }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>Contact Email</label>
              <input value={contactEmail} onChange={e => setContactEmail(e.target.value)}
                type="email" placeholder="jane@example.com"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB' }} />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              rows={3} placeholder="Partnership details, contract dates, scope..."
              className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
              style={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB' }} />
          </div>

          {/* File upload */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>
              Attachment <span className="font-normal">(PDF, XLSX, DOCX, CSV)</span>
            </label>
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 rounded-xl py-6 cursor-pointer transition-colors"
              style={{
                border: `2px dashed ${dragging ? '#6C3FC5' : '#374151'}`,
                backgroundColor: dragging ? 'rgba(108,63,197,0.08)' : '#1F2937',
              }}>
              {file ? (
                <div className="flex items-center gap-2 text-sm" style={{ color: '#A78BFA' }}>
                  <FileText size={16} />
                  <span>{file.name}</span>
                  <button onClick={e => { e.stopPropagation(); setFile(null) }}
                    className="ml-1 rounded p-0.5 hover:bg-white/10" style={{ color: '#9CA3AF' }}>
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <>
                  <Upload size={20} style={{ color: '#6B7280' }} />
                  <p className="text-sm" style={{ color: '#6B7280' }}>
                    Drag & drop or <span style={{ color: '#A78BFA' }}>browse</span>
                  </p>
                </>
              )}
            </div>
            <input ref={fileInputRef} type="file" className="hidden"
              accept=".pdf,.xlsx,.xls,.docx,.csv"
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const f = e.target.files?.[0]
                if (f) acceptFile(f)
              }} />
          </div>

          {error && (
            <p className="text-sm rounded-lg px-3 py-2"
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
            style={{ color: '#9CA3AF', border: '1px solid #1F2937' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{ backgroundColor: '#0D9488', color: '#F9FAFB', opacity: saving ? 0.7 : 1 }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            {saving ? 'Saving…' : 'Add Partner'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type HardcodedPartner = 'DfE' | 'Really Great Reading' | 'Pearson'
const HARDCODED_PARTNERS: HardcodedPartner[] = ['DfE', 'Really Great Reading', 'Pearson']
const MAX_ADDED = 3

export default function PartnersPage() {
  const supabase = useSupabase()
  const [hardcoded, setHardcoded]   = useState<HardcodedPartner>('DfE')
  const [added, setAdded]           = useState<AddedPartner[]>([])
  const [activeAdded, setActiveAdded] = useState<string | null>(null)
  const [showModal, setShowModal]   = useState(false)
  const [showAIInsights, setShowAIInsights] = useState(false)
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase.from('partners').select('*').order('created_at', { ascending: true })
        if (data) setAdded(data as AddedPartner[])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [supabase])

  const hasData = useHasDashboardData('partners')

  const deptStaff = getDeptStaff('partners')
  const deptLead = getDeptLead(deptStaff)

  if (hasData === null) return null
  if (!hasData) return (
    <>
      {deptStaff.length > 0 && <DeptStaffHeader staff={deptStaff} lead={deptLead} dept="partners" />}
      <DashboardEmptyState pageKey="partners"
        title={deptLead ? `${getStaffName(deptLead).split(' ')[0]} is ready — add your partners data` : 'No partner data yet'}
        description={deptLead ? `${getStaffName(deptLead)} is set up as ${deptLead.job_title || 'Partners Lead'}. Add your agency, reseller and referral partners to activate the Partners module. Track deals, commissions and co-marketing activity.` : 'Add your agency, reseller and referral partners to activate the Partners module. Track deals, commissions and co-marketing activity.'}
        uploads={[
          { key: 'partners', label: 'Upload Partner List (CSV)' },
          { key: 'deals', label: 'Upload Partner Deals (CSV)' },
        ]}
      />
    </>
  )

  async function removePartner(id: string) {
    await supabase.from('partners').delete().eq('id', id)
    setAdded(prev => {
      const next = prev.filter(p => p.id !== id)
      if (activeAdded === id) setActiveAdded(next[0]?.id ?? null)
      return next
    })
  }

  function handleSaved(partner: AddedPartner) {
    setAdded(prev => [...prev, partner])
    setActiveAdded(partner.id)
    setShowModal(false)
  }

  const isHardcodedActive = activeAdded === null

  return (
    <PageShell title="Partners" subtitle="Partner relationships, referrals and co-selling">
      <QuickActions items={[{ label: 'Dept Insights', icon: Star, onClick: () => setShowAIInsights(true) }]} />
      {/* Tab bar */}
      <div className="flex items-center gap-1.5 flex-wrap rounded-xl p-3"
        style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <span className="text-xs font-semibold uppercase tracking-widest mr-1" style={{ color: '#9CA3AF' }}>
          Partner
        </span>

        {/* Hardcoded partner tabs */}
        {HARDCODED_PARTNERS.map((p) => (
          <button key={p}
            onClick={() => { setHardcoded(p); setActiveAdded(null) }}
            className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
            style={{
              backgroundColor: isHardcodedActive && hardcoded === p ? '#0D9488' : 'transparent',
              color: isHardcodedActive && hardcoded === p ? '#F9FAFB' : '#9CA3AF',
              border: `1px solid ${isHardcodedActive && hardcoded === p ? '#0D9488' : '#1F2937'}`,
            }}>
            {p}
          </button>
        ))}

        {/* User-added partner tabs */}
        {added.map((p) => (
          <div key={p.id} className="flex items-center rounded-lg overflow-hidden"
            style={{ border: `1px solid ${activeAdded === p.id ? '#6C3FC5' : '#1F2937'}` }}>
            <button
              onClick={() => setActiveAdded(p.id)}
              className="px-3 py-1.5 text-sm font-medium transition-colors"
              style={{
                backgroundColor: activeAdded === p.id ? 'rgba(108,63,197,0.25)' : 'transparent',
                color: activeAdded === p.id ? '#A78BFA' : '#9CA3AF',
              }}>
              {p.name}
            </button>
            <button
              onClick={() => removePartner(p.id)}
              className="flex items-center justify-center px-1.5 py-1.5 transition-colors"
              style={{ color: '#4B5563', borderLeft: '1px solid #1F2937' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#EF4444' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#4B5563' }}>
              <X size={12} />
            </button>
          </div>
        ))}

        {/* Add Partner button — hidden at max */}
        {!loading && added.length < MAX_ADDED && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ml-1"
            style={{ color: '#6B7280', border: '1px dashed #374151' }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.color = '#F9FAFB'
              el.style.borderColor = '#6C3FC5'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.color = '#6B7280'
              el.style.borderColor = '#374151'
            }}>
            <Plus size={13} />
            Add Partner
          </button>
        )}
      </div>

      <DeptAISummary dept="partners" portal="business" />
      {/* Partner views */}
      {isHardcodedActive && hardcoded === 'DfE'                  && <DfEView />}
      {isHardcodedActive && hardcoded === 'Really Great Reading'  && <RGRView />}
      {isHardcodedActive && hardcoded === 'Pearson'               && <PearsonView />}
      {!isHardcodedActive && (() => {
        const p = added.find(a => a.id === activeAdded)
        return p ? <AddedPartnerView partner={p} /> : null
      })()}

      {showModal && (
        <AddPartnerModal onClose={() => setShowModal(false)} onSaved={handleSaved} />
      )}
      <AIInsightsReport dept="partners" portal="business" isOpen={showAIInsights} onClose={() => setShowAIInsights(false)} />
    </PageShell>
  )
}
