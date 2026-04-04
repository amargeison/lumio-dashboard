'use client'

import React, { useState } from 'react'
import { FileText, Calendar, Share2, Download, HelpCircle, Sparkles } from 'lucide-react'

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg"
      style={{ backgroundColor: '#0D9488', color: '#F9FAFB', maxWidth: 320 }}>
      <span className="text-sm font-medium flex-1">{message}</span>
      <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, lineHeight: 1 }}>×</button>
    </div>
  )
}

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

function QuickActions({ actions, onAction }: { actions: { label: string; icon: React.ReactNode }[]; onAction?: (label: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(a => (
        <button key={a.label}
          onClick={() => onAction?.(a.label)}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#0F766E')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#0D9488')}>
          {a.icon}{a.label}
        </button>
      ))}
    </div>
  )
}

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return <span className="rounded-md px-2 py-0.5 text-xs font-semibold" style={{ color, backgroundColor: bg }}>{label}</span>
}

interface Report {
  title: string
  description: string
  lastGenerated: string
  aiGenerated: boolean
}

const reports: Report[] = [
  {
    title: 'Governor Report',
    description: 'Comprehensive summary for governors including attendance, finance, safeguarding and curriculum updates',
    lastGenerated: 'Today, 9:14am',
    aiGenerated: true,
  },
  {
    title: 'Attendance Report',
    description: 'Whole-school and year group attendance breakdown, persistent absence flagging, weekly trends',
    lastGenerated: '21 Mar 2026',
    aiGenerated: false,
  },
  {
    title: 'SEND Report',
    description: 'SEND register summary, EHCP status, intervention impact, training compliance',
    lastGenerated: '15 Mar 2026',
    aiGenerated: false,
  },
  {
    title: 'Finance Summary',
    description: 'Budget vs spend by cost centre, grant tracking, invoice status, projected year-end position',
    lastGenerated: '1 Mar 2026',
    aiGenerated: false,
  },
  {
    title: 'Ofsted Readiness Pack',
    description: 'Self-evaluation summary across all Ofsted inspection areas, evidence links, action plan',
    lastGenerated: '22 Mar 2026',
    aiGenerated: true,
  },
  {
    title: 'Safeguarding Annual Report',
    description: 'Case summary (anonymised), training compliance, SCR status, policy review dates',
    lastGenerated: 'Sep 2025',
    aiGenerated: false,
  },
  {
    title: 'Pupil Progress Report',
    description: 'Attainment and progress data by year group, intervention impact, predicted outcomes',
    lastGenerated: 'Feb 2026',
    aiGenerated: false,
  },
  {
    title: 'HR & Compliance Report',
    description: 'Staff attendance, DBS status, performance reviews, CPD completion, safer recruitment',
    lastGenerated: 'Mar 2026',
    aiGenerated: false,
  },
]

const scheduledReports = [
  { name: 'Governor Report', frequency: 'Monthly (1st of month)', next: '1 Apr 2026', status: 'Active' },
  { name: 'Attendance Weekly', frequency: 'Every Monday', next: '28 Mar 2026', status: 'Active' },
  { name: 'Finance Monthly', frequency: '1st of month', next: '1 Apr 2026', status: 'Active' },
]

const aiHighlights = [
  'Governor report for March 2026 is ready — last generated today, click to download',
  'Ofsted readiness pack updated with latest inspection data — review before 28 March',
  'Attendance report shows whole-school average of 94.3% — above national average',
  'SEND annual report due to be sent to LA by 30 April — not yet generated',
]

function ReportCard({ report, generating, onGenerate }: { report: Report; generating: boolean; onGenerate: () => void }) {
  return (
    <div className="rounded-xl p-5 flex flex-col gap-3" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{report.title}</p>
          {report.aiGenerated && (
            <span className="rounded-md px-1.5 py-0.5 text-xs font-bold flex items-center gap-1"
              style={{ backgroundColor: 'rgba(13,148,136,0.12)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.2)' }}>
              <Sparkles size={9} /> AI
            </span>
          )}
        </div>
        <FileText size={14} style={{ color: '#1F2937', flexShrink: 0 }} />
      </div>
      <p className="text-xs leading-relaxed flex-1" style={{ color: '#9CA3AF' }}>{report.description}</p>
      <p className="text-xs" style={{ color: '#6B7280' }}>
        Last generated: <span style={{ color: '#D1D5DB' }}>{report.lastGenerated}</span>
      </p>
      <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid #1F2937' }}>
        <button
          onClick={onGenerate}
          disabled={generating}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium flex-1 justify-center"
          style={{
            backgroundColor: generating ? 'rgba(13,148,136,0.5)' : '#0D9488',
            color: '#F9FAFB',
            cursor: generating ? 'not-allowed' : 'pointer',
          }}>
          {generating ? (
            <>
              <span className="inline-block h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Generating...
            </>
          ) : (
            <><FileText size={10} /> Generate</>
          )}
        </button>
        <button
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
          style={{ backgroundColor: 'transparent', color: '#9CA3AF', border: '1px solid #1F2937' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1F2937'; e.currentTarget.style.color = '#F9FAFB' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9CA3AF' }}>
          <Download size={10} /> Download PDF
        </button>
      </div>
    </div>
  )
}

export default function DemoReportsPage() {
  const [generatingReport, setGeneratingReport] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  function fireToast(action: string) {
    setToast(`${action} — demo data only, no changes saved`)
    setTimeout(() => setToast(''), 3000)
  }

  const handleGenerate = (title: string) => {
    setGeneratingReport(title)
    fireToast('Generating ' + title + ' — demo mode')
    setTimeout(() => setGeneratingReport(null), 2000)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black" style={{ color: '#F9FAFB' }}>Reports</h1>
        <p className="text-sm mt-1" style={{ color: '#6B7280' }}>Generate, schedule and export school reports — AI-powered summaries included</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Reports Available" value="8" sub="In library" />
        <StatCard label="Generated This Term" value="12" sub="Downloaded" />
        <StatCard label="AI Generated" value="6" sub="Smart reports" />
        <StatCard label="Last Export" value="PDF" sub="Today 9:14am" />
      </div>

      {/* Quick Actions */}
      <QuickActions
        onAction={fireToast}
        actions={[
          { label: 'Generate Report', icon: <FileText size={14} /> },
          { label: 'Schedule Report', icon: <Calendar size={14} /> },
          { label: 'Share Report', icon: <Share2 size={14} /> },
          { label: 'Export All', icon: <Download size={14} /> },
          { label: 'Help', icon: <HelpCircle size={14} /> },
        ]}
      />

      {/* AI Highlights */}
      <AIHighlights items={aiHighlights} />

      {/* Report Cards Grid */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#2DD4BF' }}>Report Library</h2>
          <div className="flex-1 h-px" style={{ backgroundColor: '#1F2937' }} />
          <div className="flex items-center gap-2">
            <Badge label="2 AI reports" color="#0D9488" bg="rgba(13,148,136,0.12)" />
            <Badge label="8 total" color="#9CA3AF" bg="rgba(156,163,175,0.12)" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {reports.map(report => (
            <ReportCard
              key={report.title}
              report={report}
              generating={generatingReport === report.title}
              onGenerate={() => handleGenerate(report.title)}
            />
          ))}
        </div>
      </div>

      {/* Scheduled Reports */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-2">
            <Calendar size={14} style={{ color: '#0D9488' }} />
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Scheduled Reports</p>
          </div>
          <button
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
            style={{ backgroundColor: 'rgba(13,148,136,0.1)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.2)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(13,148,136,0.2)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(13,148,136,0.1)')}>
            <Calendar size={10} /> Add Schedule
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid #1F2937' }}>
                {['Report', 'Frequency', 'Next Run', 'Status'].map(h => (
                  <th key={h} className="px-5 py-3 text-left font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: '#1F2937' }}>
              {scheduledReports.map((sr, i) => (
                <tr key={i} className="hover:bg-white/[0.02]">
                  <td className="px-5 py-3 font-medium" style={{ color: '#F9FAFB' }}>{sr.name}</td>
                  <td className="px-5 py-3" style={{ color: '#9CA3AF' }}>{sr.frequency}</td>
                  <td className="px-5 py-3 font-medium" style={{ color: '#2DD4BF' }}>{sr.next}</td>
                  <td className="px-5 py-3">
                    <Badge label={sr.status} color="#22C55E" bg="rgba(34,197,94,0.12)" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report health summary */}
      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <p className="text-sm font-semibold mb-4" style={{ color: '#F9FAFB' }}>Report Currency Overview</p>
        <div className="space-y-3">
          {reports.map(report => {
            const isFresh = report.lastGenerated.includes('Today') || report.lastGenerated.includes('Mar 2026')
            const pct = isFresh ? 90 : 40
            return (
              <div key={report.title} className="flex items-center gap-3">
                <p className="text-xs w-48 shrink-0" style={{ color: '#D1D5DB' }}>{report.title}</p>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#1F2937' }}>
                  <div className="h-full rounded-full" style={{
                    width: `${pct}%`,
                    backgroundColor: pct > 80 ? '#22C55E' : pct > 50 ? '#0D9488' : '#F59E0B'
                  }} />
                </div>
                <p className="text-xs w-28 text-right shrink-0" style={{ color: '#6B7280' }}>{report.lastGenerated}</p>
              </div>
            )
          })}
        </div>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
