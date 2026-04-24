'use client'

import { useEffect, useMemo, useState } from 'react'
import { Briefcase, Download, Printer, FileSpreadsheet, HardDriveDownload, Loader2 } from 'lucide-react'
import * as XLSX from 'xlsx'
import { T } from './tokens'
import { Badge } from './ui'
import { OverviewTab } from './tabs/OverviewTab'
import { InsightsTab } from './tabs/InsightsTab'
import { SchoolsTab } from './tabs/SchoolsTab'
import { AccountInfoTab } from './tabs/AccountInfoTab'
import { AssessmentsTab } from './tabs/AssessmentsTab'
import { TrainingTab } from './tabs/TrainingTab'
import { DRLAccessTab } from './tabs/DRLAccessTab'
import type { Payload } from './types'

type TabId = 'overview' | 'insights' | 'schools' | 'account' | 'assessments' | 'training' | 'drl'

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview',    label: 'Overview' },
  { id: 'insights',    label: 'Insights' },
  { id: 'schools',     label: 'Schools' },
  { id: 'account',     label: 'Account Info' },
  { id: 'assessments', label: 'Assessments' },
  { id: 'training',    label: 'Training' },
  { id: 'drl',         label: 'DRL Access' },
]

export function RGRDashboard() {
  const [data, setData] = useState<Payload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<TabId>('overview')
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch('/api/partners/rgr/dashboard')
      .then(r => (r.ok ? r.json() as Promise<Payload> : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(p => { if (!cancelled) { setData(p); setLoading(false) } })
      .catch(e => { if (!cancelled) { setError(String(e)); setLoading(false) } })
    return () => { cancelled = true }
  }, [])

  const generatedLabel = useMemo(() => (data?.generatedAt ? `Generated ${data.generatedAt}` : ''), [data])

  if (loading) return <LoadingState />
  if (error || !data) return <ErrorState message={error ?? 'No data'} />

  function exportExcel(p: Payload) {
    const wb = XLSX.utils.book_new()

    // 1. Summary
    const summaryRows: (string | number)[][] = [
      ['Partner',               p.partner.name],
      ['Schools under management', p.partner.schoolsUnderManagement],
      ['Generated',             p.generatedAt],
      [],
      ['Metric',                'Value'],
      ['Schools',               p.kpi.totalSchools],
      ['Students',              p.kpi.studentsTotal],
      ['Classes',               p.kpi.classesTotal],
      ['Assessments (all time)', p.kpi.assessmentsTotal],
      ['Assessments (CY)',      p.kpi.assessmentsCY],
      ['Teachers invited',      p.kpi.teachersTotal],
      ['Teachers fully trained', p.kpi.teachersTrained],
      ['DRL-active schools',    p.kpi.drlSchools],
      ['Red engagement',        p.kpi.red],
      ['Amber engagement',      p.kpi.amber],
      ['Green engagement',      p.kpi.green],
      ['Student RAG — red',     p.kpi.ragR],
      ['Student RAG — amber',   p.kpi.ragA],
      ['Student RAG — green',   p.kpi.ragG],
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryRows), 'Summary')

    // 2. Schools
    const schools = p.schools.map(s => ({
      School:     s.name,
      Code:       s.code,
      State:      s.state,
      Engagement: s.engagement,
      Phase:      s.phase,
      Students:   s.students,
      Classes:    s.classes,
      'Assessments CY':    s.assessmentsCY,
      'Assessments total': s.totalAssessments,
      'Teachers invited':  s.teachersInvited,
      'Teachers trained':  s.teachersFullyTrained,
      'Red':     s.red,
      'Amber':   s.amber,
      'Green':   s.green,
      'Has DRL': s.hasDRL ? 'Yes' : 'No',
      'Last portal': s.portalAccess,
      'Last assessment': s.lastAssessmentDate,
      'Next action': s.nextAction,
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(schools), 'Schools')

    // 3. Account Info (same columns but ordered by engagement then phase)
    const sortedSchools = [...schools].sort((a, b) => String(a.Engagement).localeCompare(String(b.Engagement)))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sortedSchools), 'Account Info')

    // 4. Assessments (pupil-level, codenames only)
    const assessmentRows = p.assessments.map(a => ({
      Year:      a.year,
      Codename:  a.codename,
      School:    a.schoolName,
      Grade:     a.grade,
      'Age (months)': a.ageMonths,
      'Assessment date': a.assessmentDate,
      'Assessment index': a.assessmentIndex,
      RAG:       a.rag,
      Total:     a.total,
      EV:        a.ev,
      RV:        a.rv,
      LC:        a.lc,
      SR:        a.sr,
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(assessmentRows), 'Assessments')

    // 5. Training (teacher × course)
    const teacherRows = p.teachers.map(t => ({
      Teacher: t.name,
      School:  t.school,
      Email:   t.email,
      'Fully trained': t.fullyTrained ? 'Yes' : 'No',
      Invited:     t.invitedDate,
      'Last visit': t.lastVisit,
      C1: t.c1,
      C2: t.c2,
      C3: t.c3,
      C4: t.c4,
      'Support hub': t.supportHub,
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(teacherRows), 'Training')

    // 6. DRL
    const drlRows = p.schools.map(s => ({
      School: s.name,
      State:  s.state,
      'Has DRL': s.hasDRL ? 'Yes' : 'No',
      'Last DRL visit': s.lastDRL,
      'Whole-class milestone': s.wcMilestone,
      'Phonics milestone':     s.psMilestone,
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(drlRows), 'DRL')

    // 7. Progress (paired)
    const progressRows = p.pairedAssessments.map(pr => ({
      Codename: pr.codename,
      School:   pr.schoolName,
      Year:     pr.year,
      First:    pr.first,
      Last:     pr.last,
      Delta:    pr.delta,
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(progressRows), 'Progress')

    const ymd = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(wb, `RGR_Portfolio_${ymd}.xlsx`)
  }

  async function downloadStandalone(p: Payload) {
    setDownloading(true)
    try {
      const template = await fetch(`/partners/rgr/template.html?v=${Date.now()}`, { cache: 'no-store' }).then(r => r.text())
      const html = template.replace(
        /<script id="app-data"[^>]*>[\s\S]*?<\/script>/,
        `<script id="app-data" type="application/json">${JSON.stringify(p)}</script>`,
      )
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `RGR_Portfolio_${new Date().toISOString().slice(0, 10)}.html`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('[rgr] downloadStandalone', err)
      alert('Could not download standalone file — check console.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div id="rgr-dashboard" style={{ color: T.ink, display: 'grid', gap: 16, padding: 4 }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, backgroundColor: 'rgba(20,184,166,0.14)', border: `1px solid ${T.border}`, borderRadius: 10, display: 'grid', placeItems: 'center' }}>
            <Briefcase size={20} color={T.teal} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.inkMute, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Partner · {data.partner.shortName}</div>
            <h1 style={{ margin: '2px 0 0', fontSize: 22, color: T.ink }}>{data.partner.name}</h1>
            <div style={{ fontSize: 12, color: T.inkDim }}>
              {data.partner.schoolsUnderManagement} schools under management · {generatedLabel}
              {data.partner.accountManager && <> · AM: {data.partner.accountManager}</>}
            </div>
          </div>
        </div>

        <div className="rgr-export-bar" style={{ display: 'flex', gap: 8 }}>
          <ExportBtn icon={<FileSpreadsheet size={14} />} label="Export Excel"        onClick={() => exportExcel(data)} />
          <ExportBtn icon={<Download size={14} />}        label="Export PDF"          onClick={() => window.print()} />
          <ExportBtn icon={<Printer size={14} />}         label="Print"               onClick={() => window.print()} />
          <ExportBtn icon={downloading ? <Loader2 size={14} className="rgr-spin" /> : <HardDriveDownload size={14} />} label="Download Standalone" onClick={() => downloadStandalone(data)} />
        </div>
      </header>

      {/* Tabs */}
      <nav className="rgr-tab-bar" style={{ display: 'flex', gap: 4, flexWrap: 'wrap', borderBottom: `1px solid ${T.border}` }}>
        {TABS.map(t => {
          const active = t.id === tab
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '8px 14px',
                fontSize: 13,
                fontWeight: 600,
                backgroundColor: 'transparent',
                color: active ? T.ink : T.inkMute,
                border: 'none',
                borderBottom: active ? `2px solid ${T.teal}` : '2px solid transparent',
                cursor: 'pointer',
                marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          )
        })}

        {data.kpi.red > 0 && (
          <span style={{ marginLeft: 'auto', alignSelf: 'center', paddingRight: 4 }}>
            <Badge tone="red">{data.kpi.red} red-engagement schools</Badge>
          </span>
        )}
      </nav>

      {/* Tab body */}
      <div>
        {tab === 'overview'    && <OverviewTab    data={data} />}
        {tab === 'insights'    && <InsightsTab    data={data} />}
        {tab === 'schools'     && <SchoolsTab     data={data} />}
        {tab === 'account'     && <AccountInfoTab data={data} />}
        {tab === 'assessments' && <AssessmentsTab data={data} />}
        {tab === 'training'    && <TrainingTab    data={data} />}
        {tab === 'drl'         && <DRLAccessTab   data={data} />}
      </div>

      {/* Print CSS — hide nav/export bar on print, expand all tabs */}
      <style>{`
        @media print {
          .rgr-export-bar, .rgr-tab-bar { display: none !important; }
          #rgr-dashboard { color: #111 !important; }
          #rgr-dashboard * { color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
        @keyframes rgrspin { to { transform: rotate(360deg); } }
        .rgr-spin { animation: rgrspin 0.9s linear infinite; }
      `}</style>
    </div>
  )
}

function ExportBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 12px',
        fontSize: 12,
        fontWeight: 600,
        color: T.inkDim,
        backgroundColor: T.panel,
        border: `1px solid ${T.border}`,
        borderRadius: 8,
        cursor: 'pointer',
      }}
    >
      {icon}
      {label}
    </button>
  )
}

function LoadingState() {
  return (
    <div style={{ padding: 40, textAlign: 'center', color: T.inkDim, fontSize: 13 }}>
      Loading RGR portfolio…
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div style={{ padding: 20, border: `1px solid ${T.border}`, backgroundColor: 'rgba(239,68,68,0.08)', color: T.red, borderRadius: 12 }}>
      Failed to load RGR dashboard: {message}
    </div>
  )
}

export default RGRDashboard
