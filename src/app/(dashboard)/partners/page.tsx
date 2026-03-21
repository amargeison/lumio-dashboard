'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TrendingUp, Users, BookOpen, Mail, ExternalLink, Building2, Calendar, User } from 'lucide-react'
import { StatCard, Badge, SectionCard, PageShell } from '@/components/page-ui'
import { ChartSection, parseNum } from '@/components/chart-ui'

type Partner = 'DfE' | 'Really Great Reading' | 'Pearson'
const PARTNERS: Partner[] = ['DfE', 'Really Great Reading', 'Pearson']

// ─── DfE Partner View ─────────────────────────────────────────────────────────

function DfEView() {
  const stats = [
    { label: 'Schools Registered',  value: '10,973', trend: '+847',  trendDir: 'up' as const, trendGood: true, icon: Building2,  sub: 'vs September baseline' },
    { label: 'Pupils Assessed',     value: '50,052', trend: '+6,210',trendDir: 'up' as const, trendGood: true, icon: Users,      sub: 'cumulative AY 2025/26' },
    { label: 'Course Completions',  value: '76,567', trend: '+8,942',trendDir: 'up' as const, trendGood: true, icon: BookOpen,   sub: 'cumulative AY 2025/26' },
    { label: 'Engagement Emails',   value: '221,209',trend: '+34,122',trendDir: 'up' as const, trendGood: true, icon: Mail,       sub: 'cumulative AY 2025/26' },
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
      {/* Partner info banner */}
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
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
        <div>
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
        </div>
      </div>
    </div>
  )
}

// ─── Really Great Reading View ─────────────────────────────────────────────────

function RGRView() {
  const stats = [
    { label: 'Schools Using RGR',    value: '—',  trend: 'Coming soon', trendDir: 'up' as const, trendGood: true, icon: Building2, sub: 'integration pending' },
    { label: 'Active Licences',      value: '—',  trend: 'Coming soon', trendDir: 'up' as const, trendGood: true, icon: BookOpen,  sub: 'integration pending' },
    { label: 'Training Completions', value: '—',  trend: 'Coming soon', trendDir: 'up' as const, trendGood: true, icon: TrendingUp,sub: 'integration pending' },
    { label: 'Support Tickets',      value: '—',  trend: 'Coming soon', trendDir: 'up' as const, trendGood: true, icon: Users,     sub: 'integration pending' },
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
          <div className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: '#1F2937' }}>
            <BookOpen size={28} style={{ color: '#9CA3AF' }} />
          </div>
          <p className="text-base font-semibold" style={{ color: '#F9FAFB' }}>Dashboard Coming Soon</p>
          <p className="max-w-sm text-center text-sm" style={{ color: '#9CA3AF' }}>
            The Really Great Reading partner integration is currently in progress. Live data will appear here once the data pipeline is connected.
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

// ─── Pearson View ─────────────────────────────────────────────────────────────

function PearsonView() {
  const stats = [
    { label: 'Schools',            value: '—',  trend: 'Coming soon', trendDir: 'up' as const, trendGood: true, icon: Building2,  sub: 'integration pending' },
    { label: 'Active Users',       value: '—',  trend: 'Coming soon', trendDir: 'up' as const, trendGood: true, icon: Users,      sub: 'integration pending' },
    { label: 'Resources Accessed', value: '—',  trend: 'Coming soon', trendDir: 'up' as const, trendGood: true, icon: BookOpen,   sub: 'integration pending' },
    { label: 'Renewal Date',       value: '—',  trend: 'Coming soon', trendDir: 'up' as const, trendGood: true, icon: Calendar,   sub: 'integration pending' },
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
          <div className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: '#1F2937' }}>
            <BookOpen size={28} style={{ color: '#9CA3AF' }} />
          </div>
          <p className="text-base font-semibold" style={{ color: '#F9FAFB' }}>Dashboard Coming Soon</p>
          <p className="max-w-sm text-center text-sm" style={{ color: '#9CA3AF' }}>
            The Pearson partner integration is under scoping. Live data will appear here once the partnership agreement and data pipeline are finalised.
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PartnersPage() {
  const [partner, setPartner] = useState<Partner>('DfE')

  return (
    <PageShell>
      {/* Partner selector */}
      <div className="flex items-center gap-3 rounded-xl p-4"
        style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <span className="text-xs font-semibold uppercase tracking-widest mr-2" style={{ color: '#9CA3AF' }}>
          Partner
        </span>
        {PARTNERS.map((p) => (
          <button
            key={p}
            onClick={() => setPartner(p)}
            className="rounded-lg px-4 py-1.5 text-sm font-medium transition-colors"
            style={{
              backgroundColor: partner === p ? '#0D9488' : 'transparent',
              color: partner === p ? '#F9FAFB' : '#9CA3AF',
              border: `1px solid ${partner === p ? '#0D9488' : '#1F2937'}`,
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {partner === 'DfE'                 && <DfEView />}
      {partner === 'Really Great Reading' && <RGRView />}
      {partner === 'Pearson'             && <PearsonView />}
    </PageShell>
  )
}
