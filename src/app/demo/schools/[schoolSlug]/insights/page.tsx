'use client'
import React, { useState } from 'react'
import {
  Sparkles, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  Activity, Users, Shield, BookOpen, DollarSign, Zap, X,
  BarChart2, Brain, Clock, ArrowRight, Lightbulb,
} from 'lucide-react'

// ─── Demo seed data ───────────────────────────────────────────────────────────

const AI_SUMMARY = "Oakridge Primary is performing well overall. Attendance is recovering after a dip in Week 7, Year 6 SATs readiness is on track, and safeguarding compliance is the one area requiring immediate attention. Two staff training deadlines fall within the next 30 days."

const INSIGHTS = [
  {
    id: 1,
    category: 'Attendance',
    title: 'Year 4 persistent absence trend worsening',
    detail: '4 pupils in Year 4 have missed more than 15% of sessions this half-term. If the trend continues, 2 are at risk of crossing the persistent absence threshold before end of term.',
    impact: 'high',
    icon: Activity,
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.3)',
    action: 'View Year 4 absence report',
  },
  {
    id: 2,
    category: 'Safeguarding',
    title: '1 open concern unreviewed for 2+ days',
    detail: 'A safeguarding log entry from 22 March has not received DSL sign-off. Statutory guidance recommends review within 24 hours.',
    impact: 'high',
    icon: Shield,
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.3)',
    action: 'Open concern log',
  },
  {
    id: 3,
    category: 'Staff',
    title: 'DBS renewal overdue — 1 staff member',
    detail: 'M. Taylor\'s DBS check expired on 10 March 2026. Under Keeping Children Safe in Education, the school must either initiate a new DBS or implement a supervision protocol until renewal is complete.',
    impact: 'high',
    icon: Users,
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.3)',
    action: 'Initiate DBS renewal',
  },
  {
    id: 4,
    category: 'Curriculum',
    title: 'Year 6 SATs readiness on track',
    detail: 'Based on the most recent assessment data, 82% of Year 6 pupils are meeting expected standard in Reading, 78% in Maths. Both figures are above national average benchmarks for this point in the year.',
    impact: 'positive',
    icon: BookOpen,
    color: '#22C55E',
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.2)',
    action: 'View SATs tracker',
  },
  {
    id: 5,
    category: 'Finance',
    title: 'Budget on track — slight underspend in Premises',
    detail: 'Current spend is 61% of annual budget with 58% of the year elapsed. Premises budget is running 8% under forecast — consider whether deferred maintenance tasks should be brought forward.',
    impact: 'positive',
    icon: DollarSign,
    color: '#22C55E',
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.2)',
    action: 'View budget report',
  },
  {
    id: 6,
    category: 'Admissions',
    title: 'Reception applications 12% above last year',
    detail: '47 applications received for September 2026 intake versus 42 at the same point last year. If the trend holds, a waiting list may be needed. Admissions policy review recommended.',
    impact: 'medium',
    icon: Users,
    color: '#6C3FC5',
    bg: 'rgba(108,63,197,0.08)',
    border: 'rgba(108,63,197,0.25)',
    action: 'View admissions pipeline',
  },
]

const TREND_DATA = [
  { week: 'Wk 4', attendance: 95.2, workflows: 18 },
  { week: 'Wk 5', attendance: 94.8, workflows: 21 },
  { week: 'Wk 6', attendance: 93.1, workflows: 19 },
  { week: 'Wk 7', attendance: 91.4, workflows: 23 },
  { week: 'Wk 8', attendance: 92.7, workflows: 22 },
  { week: 'Wk 9', attendance: 93.9, workflows: 25 },
]

const PREDICTIONS = [
  { label: 'Attendance end of term', value: '93.4%', direction: 'up',   note: 'Based on current recovery trend',       color: '#22C55E' },
  { label: 'Workflows this week',    value: '27',    direction: 'up',   note: 'Up from 25 last week',                  color: '#0D9488' },
  { label: 'Staff training overdue', value: '2',     direction: 'same', note: 'Due before 30 April — action required', color: '#F59E0B' },
  { label: 'Open concerns (30d)',    value: '1',     direction: 'down', note: 'Down from 3 last month',                color: '#22C55E' },
]

const RECOMMENDATIONS = [
  { priority: 1, text: 'Schedule DSL review of open safeguarding concern before end of day.',        tag: 'Safeguarding', urgent: true  },
  { priority: 2, text: 'Initiate M. Taylor DBS renewal — contact Disclosure Scotland or DBS online.', tag: 'HR & Staff',   urgent: true  },
  { priority: 3, text: 'Run persistent absence letters for the 4 Year 4 pupils flagged this week.',   tag: 'School Office', urgent: false },
  { priority: 4, text: 'Book two remaining staff onto safeguarding refresher training before April.',  tag: 'HR & Staff',   urgent: false },
  { priority: 5, text: 'Review admissions policy ahead of potential waiting list for September.',      tag: 'Admissions',   urgent: false },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg"
      style={{ backgroundColor: '#0D9488', color: '#F9FAFB', maxWidth: 340 }}>
      <Zap size={14} style={{ flexShrink: 0 }} />
      <span className="text-sm font-medium flex-1">{message}</span>
      <button onClick={onClose}><X size={14} style={{ color: 'rgba(255,255,255,0.7)' }} /></button>
    </div>
  )
}

function ImpactBadge({ impact }: { impact: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    high:     { label: 'High impact',   color: '#EF4444', bg: 'rgba(239,68,68,0.12)'  },
    medium:   { label: 'Medium impact', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
    positive: { label: 'Positive',      color: '#22C55E', bg: 'rgba(34,197,94,0.12)'  },
  }
  const s = map[impact] ?? map.medium
  return <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: s.color, backgroundColor: s.bg }}>{s.label}</span>
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1F2937' }}>
      <div className="h-full rounded-full" style={{ width: `${(value / max) * 100}%`, backgroundColor: color }} />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DemoInsightsPage() {
  const [toast, setToast] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)

  function fireToast(action: string) {
    setToast(`${action} — demo data only, no changes saved`)
    setTimeout(() => setToast(''), 3500)
  }

  const highCount = INSIGHTS.filter(i => i.impact === 'high').length
  const positiveCount = INSIGHTS.filter(i => i.impact === 'positive').length

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>Insights</h1>
          <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>AI-powered analysis across all departments — Oakridge Primary</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shrink-0"
          style={{ backgroundColor: 'rgba(13,148,136,0.12)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.25)' }}>
          <Sparkles size={11} /> Updated just now
        </div>
      </div>

      {/* AI Summary */}
      <div className="rounded-xl p-5" style={{ background: 'linear-gradient(135deg,rgba(13,148,136,0.12),rgba(108,63,197,0.08))', border: '1px solid rgba(13,148,136,0.25)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Brain size={16} style={{ color: '#0D9488' }} />
          <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>AI Summary</p>
          <span className="text-xs ml-auto" style={{ color: '#6B7280' }}>24 Mar 2026, 8:30am</span>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: '#D1D5DB' }}>{AI_SUMMARY}</p>
        <div className="flex gap-3 mt-4">
          <div className="flex items-center gap-1.5 text-xs" style={{ color: '#EF4444' }}>
            <AlertTriangle size={12} /> {highCount} items need attention
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: '#22C55E' }}>
            <CheckCircle2 size={12} /> {positiveCount} performing well
          </div>
        </div>
      </div>

      {/* Insight cards */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#4B5563' }}>All Insights ({INSIGHTS.length})</p>
        {INSIGHTS.map(ins => {
          const Icon = ins.icon
          const isOpen = expanded === ins.id
          return (
            <div key={ins.id} className="rounded-xl overflow-hidden" style={{ backgroundColor: ins.bg, border: `1px solid ${ins.border}` }}>
              <button
                className="w-full flex items-center gap-4 px-5 py-4 text-left"
                onClick={() => setExpanded(isOpen ? null : ins.id)}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
                  <Icon size={16} style={{ color: ins.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-xs font-semibold" style={{ color: ins.color }}>{ins.category}</span>
                    <ImpactBadge impact={ins.impact} />
                  </div>
                  <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{ins.title}</p>
                </div>
                <ArrowRight size={14} style={{ color: '#6B7280', flexShrink: 0, transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              {isOpen && (
                <div className="px-5 pb-4 pt-0">
                  <div className="h-px mb-4" style={{ backgroundColor: ins.border }} />
                  <p className="text-sm leading-relaxed mb-4" style={{ color: '#D1D5DB' }}>{ins.detail}</p>
                  <button
                    onClick={() => fireToast(ins.action)}
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold"
                    style={{ backgroundColor: ins.color, color: '#F9FAFB' }}>
                    {ins.action} →
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Trends + Predictions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Attendance trend */}
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Attendance Trend</p>
            <span className="text-xs" style={{ color: '#9CA3AF' }}>Last 6 weeks</span>
          </div>
          <div className="px-5 py-4 space-y-3">
            {TREND_DATA.map(row => {
              const color = row.attendance >= 95 ? '#22C55E' : row.attendance >= 92 ? '#0D9488' : '#F59E0B'
              return (
                <div key={row.week} className="flex items-center gap-3">
                  <p className="text-xs w-10 shrink-0" style={{ color: '#9CA3AF' }}>{row.week}</p>
                  <div className="flex-1">
                    <MiniBar value={row.attendance} max={100} color={color} />
                  </div>
                  <p className="text-xs font-medium w-12 text-right shrink-0" style={{ color }}>{row.attendance}%</p>
                  {row.week === 'Wk 7' && (
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#EF4444', fontSize: 10, flexShrink: 0 }}>low</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Predictions */}
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
            <BarChart2 size={14} style={{ color: '#6C3FC5' }} />
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>AI Predictions</p>
          </div>
          <div className="divide-y" style={{ borderColor: '#1F2937' }}>
            {PREDICTIONS.map((p, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{p.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{p.note}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {p.direction === 'up'   && <TrendingUp   size={13} style={{ color: '#22C55E' }} />}
                  {p.direction === 'down' && <TrendingDown  size={13} style={{ color: '#EF4444' }} />}
                  {p.direction === 'same' && <Clock         size={13} style={{ color: '#F59E0B' }} />}
                  <span className="text-sm font-bold" style={{ color: p.color }}>{p.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <Lightbulb size={14} style={{ color: '#F59E0B' }} />
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Recommended Actions</p>
        </div>
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          {RECOMMENDATIONS.map(rec => (
            <div key={rec.priority} className="flex items-start gap-4 px-5 py-3.5">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold mt-0.5"
                style={{ backgroundColor: rec.urgent ? 'rgba(239,68,68,0.15)' : '#1F2937', color: rec.urgent ? '#EF4444' : '#6B7280' }}>
                {rec.priority}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm" style={{ color: '#D1D5DB' }}>{rec.text}</p>
                <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>{rec.tag}</span>
              </div>
              {rec.urgent && (
                <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5"
                  style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>Urgent</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: '#111318', border: '1px solid rgba(13,148,136,0.3)' }}>
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-4"
          style={{ backgroundColor: 'rgba(13,148,136,0.12)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.25)' }}>
          <Sparkles size={12} /> Live insights, real data
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: '#F9FAFB' }}>These insights update automatically in your live workspace.</h2>
        <p className="text-sm mb-6 mx-auto max-w-md" style={{ color: '#9CA3AF' }}>Connect Oakridge Primary to Lumio and your AI briefing populates every morning from your real school data.</p>
        <button
          onClick={() => fireToast('redirect to live workspace setup')}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm"
          style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
          Set up your live workspace →
        </button>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
