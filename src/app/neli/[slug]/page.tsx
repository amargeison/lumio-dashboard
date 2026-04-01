'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import {
  LayoutDashboard, Search, TrendingUp, FileText, Users,
  GraduationCap, BookOpen, FolderOpen, CalendarCheck, UserCheck,
  Shield, Database, Bell, ChevronRight, Settings, LogOut,
  Download, Loader2, Printer,
} from 'lucide-react'
import { T, PUPILS, ALERTS, neliPupils, neliAvgGain, classAvgI, classAvgE, getLight, lc, lb, ll } from '@/components/neli/neliData'
import {
  Dashboard, NELITracker, LanguageScreenPage, ClassesPage, ClassDetail, PupilDetail,
  Insights, TrustView, Training, TrainingCourses, TELTedTraining, Resources,
} from '@/components/neli/NELIComponents'

const LanguageScreenApp = dynamic(() => import('@/components/neli/LanguageScreenApp'), { ssr: false })

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, Cell,
} from 'recharts'

// ─── Navigation ─────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'overview',       icon: LayoutDashboard, label: 'Overview' },
  { id: 'languagescreen', icon: Search,          label: 'LanguageScreen & NELI' },
  { id: 'insights',       icon: TrendingUp,      label: 'Insights' },
  { id: 'reports',        icon: FileText,         label: 'Reports' },
  { id: 'classes',        icon: Users,            label: 'Classes' },
  { id: 'training',       icon: GraduationCap,   label: 'Training' },
  { id: 'telted',         icon: BookOpen,         label: 'TEL TED Training' },
  { id: 'resources',      icon: FolderOpen,       label: 'Resources' },
  { id: 'attendance',     icon: CalendarCheck,    label: 'Attendance' },
  { id: 'staff',          icon: UserCheck,        label: 'Staff Management' },
  { id: 'safeguarding',   icon: Shield,           label: 'Safeguarding' },
  { id: 'missync',        icon: Database,         label: 'MIS Sync' },
]

// ─── Coming Soon ────────────────────────────────────────────────────────────

function ComingSoonPage({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, padding: 40 }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: T.goldLight, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 28 }}>🚧</span>
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: T.navy, margin: '0 0 8px', fontFamily: 'Georgia, serif' }}>{title}</h2>
      <p style={{ fontSize: 14, color: T.muted, margin: 0, textAlign: 'center', maxWidth: 400 }}>
        This section is coming soon as part of the Lumio Schools platform.
      </p>
    </div>
  )
}

// ─── Reports Tab ────────────────────────────────────────────────────────────

const REPORT_TYPES = [
  { id: 'term-summary', name: 'End of Term NELI Summary', desc: 'Full cohort overview with band distribution and progress since September.', lastGen: '18 Mar 2026' },
  { id: 'pupil-progress', name: 'Pupil Progress Report', desc: 'Individual pupil language journey with score trajectory and next steps.', lastGen: '14 Mar 2026' },
  { id: 'at-risk', name: 'Cohort At-Risk Report', desc: 'All pupils below threshold with recommended actions and intervention status.', lastGen: '20 Mar 2026' },
  { id: 'subtest', name: 'Subtest Analysis Report', desc: 'School-wide breakdown across all 4 LanguageScreen subtests with comparisons.', lastGen: '12 Mar 2026' },
  { id: 'ofsted', name: 'Ofsted Evidence Pack', desc: 'Structured evidence of language intervention impact for inspection readiness.', lastGen: '10 Mar 2026' },
  { id: 'parent', name: 'Parent Communication Report', desc: 'Plain-English progress summaries for parent meetings and updates.', lastGen: '22 Mar 2026' },
]

const NARRATIVES: Record<string, string> = {
  'term-summary': `The Reception cohort at Parkside Primary has made strong progress in language development. The average LanguageScreen score has risen from ${classAvgI} to ${classAvgE}, representing a gain of +${Math.round((classAvgE - classAvgI) * 10) / 10} points — significantly above the national average gain of +4.2. Five pupils are enrolled on the NELI programme. NELI pupils have made accelerated progress with an average gain of +${neliAvgGain} points.`,
  'pupil-progress': 'Individual pupil tracking shows that all pupils have made measurable progress since their initial assessment in September. Five NELI pupils have shown the most significant gains, with Amara Johnson progressing from 62 to 80 (+18 points) — the highest individual gain in the cohort.',
  'at-risk': 'Two pupils are currently identified as at-risk with LanguageScreen scores below 85. Both are enrolled on the NELI programme and receiving additional speech and language support. Recommended actions include continuation of NELI sessions and increased 1:1 reading time.',
  'subtest': 'Subtest analysis reveals that Receptive Vocabulary is the weakest area across the cohort, whilst Listening Comprehension is the strongest. NELI pupils show a larger gap in Expressive Vocabulary.',
  'ofsted': "This evidence pack demonstrates the school's systematic approach to early language intervention. Impact data shows the programme is closing the gap between disadvantaged and non-disadvantaged pupils. This aligns with the EIF inspection framework's focus on cultural capital and curriculum intent.",
  'parent': "Your child has been assessed using LanguageScreen, a tool developed by Oxford University researchers. The assessment looks at four areas: understanding words, using words, grammar, and listening. Your child's teacher will share their individual results at the next parent meeting.",
}

function ReportsPanel() {
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [generating, setGenerating] = useState(false)
  const [preview, setPreview] = useState<any>(null)
  const [filterTerm, setFilterTerm] = useState('full')
  const [filterClass, setFilterClass] = useState('all')

  function handleGenerate(report: any) {
    setSelectedReport(report); setGenerating(true); setPreview(null)
    setTimeout(() => { setGenerating(false); setPreview(report) }, 2000)
  }
  function handlePrint() {
    const s = document.createElement('style'); s.id = 'neli-print'
    s.textContent = '@media print{.neli-sidebar,.neli-report-left,.neli-header{display:none!important}.neli-report-preview{position:absolute!important;inset:0!important}}'
    document.head.appendChild(s); window.print()
    setTimeout(() => document.getElementById('neli-print')?.remove(), 1000)
  }

  const kpis: Record<string, { l: string; v: string | number; c: string }[]> = {
    'term-summary': [{ l: 'Cohort Size', v: PUPILS.length, c: T.navy }, { l: 'Avg Score', v: classAvgE, c: T.green }, { l: 'NELI Pupils', v: neliPupils.length, c: T.gold }, { l: 'On Track', v: `${Math.round(PUPILS.filter((p: any) => p.es >= 85).length / PUPILS.length * 100)}%`, c: T.green }],
    'at-risk': [{ l: 'At Risk', v: PUPILS.filter((p: any) => p.es < 85).length, c: T.red }, { l: 'Monitor', v: PUPILS.filter((p: any) => p.es >= 85 && p.es < 96).length, c: T.amber }, { l: 'On NELI', v: PUPILS.filter((p: any) => p.es < 85 && p.neli).length, c: T.navy }, { l: 'Not on NELI', v: PUPILS.filter((p: any) => p.es < 85 && !p.neli).length, c: T.red }],
    'subtest': [{ l: 'Rec. Vocab', v: Math.round(PUPILS.reduce((s: number, p: any) => s + p.subscores.recVocab, 0) / PUPILS.length), c: T.navy }, { l: 'Exp. Vocab', v: Math.round(PUPILS.reduce((s: number, p: any) => s + p.subscores.expVocab, 0) / PUPILS.length), c: '#1D4ED8' }, { l: 'Grammar', v: Math.round(PUPILS.reduce((s: number, p: any) => s + p.subscores.grammar, 0) / PUPILS.length), c: T.green }, { l: 'Listening', v: Math.round(PUPILS.reduce((s: number, p: any) => s + p.subscores.listening, 0) / PUPILS.length), c: T.gold }],
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
      <div className="neli-report-left" style={{ width: 400, flexShrink: 0, borderRight: `1px solid ${T.border}`, overflowY: 'auto', padding: 20, background: '#FAFAF8' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: '0 0 4px', fontFamily: 'Georgia, serif' }}>Report Library</h2>
        <p style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>Generate and download professional reports</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <select value={filterTerm} onChange={e => setFilterTerm(e.target.value)} style={{ fontSize: 11, padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, background: 'white', color: T.text }}><option value="full">Full Year</option><option value="t1">Term 1</option><option value="t2">Term 2</option></select>
          <select value={filterClass} onChange={e => setFilterClass(e.target.value)} style={{ fontSize: 11, padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, background: 'white', color: T.text }}><option value="all">All Classes</option><option value="A">Class A</option><option value="B">Class B</option></select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {REPORT_TYPES.map(r => (
            <div key={r.id} style={{ background: 'white', borderRadius: 10, padding: 16, border: `1px solid ${selectedReport?.id === r.id ? T.navy : T.border}` }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: '0 0 4px' }}>{r.name}</h4>
              <p style={{ fontSize: 11, color: T.muted, margin: '0 0 8px', lineHeight: 1.5 }}>{r.desc}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, color: T.muted }}>Last: {r.lastGen}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => handleGenerate(r)} style={{ fontSize: 11, fontWeight: 600, padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', background: T.navy, color: 'white' }}>Generate</button>
                  <button onClick={handlePrint} style={{ fontSize: 11, fontWeight: 600, padding: '6px 14px', borderRadius: 6, border: `1px solid ${T.border}`, cursor: 'pointer', background: 'white', color: T.text, display: 'flex', alignItems: 'center', gap: 4 }}><Download size={11} /> PDF</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="neli-report-preview" style={{ flex: 1, overflowY: 'auto', padding: 32, background: 'white' }}>
        {!preview && !generating && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: T.muted }}>
            <FileText size={48} style={{ color: T.border, marginBottom: 16 }} />
            <p style={{ fontSize: 15, fontWeight: 600 }}>Select a report to generate</p>
          </div>
        )}
        {generating && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Loader2 size={36} style={{ color: T.navy, animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <p style={{ fontSize: 15, fontWeight: 600, color: T.navy, marginTop: 16 }}>Generating report with AI...</p>
          </div>
        )}
        {preview && !generating && (
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <div style={{ borderBottom: `3px solid ${T.navy}`, paddingBottom: 20, marginBottom: 24, display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: T.goldLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: T.gold }}>PP</div>
                  <div>
                    <h1 style={{ fontSize: 20, fontWeight: 800, color: T.navy, margin: 0, fontFamily: 'Georgia, serif' }}>Parkside Primary</h1>
                    <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>Oak Valley MAT</p>
                  </div>
                </div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: '12px 0 4px', fontFamily: 'Georgia, serif' }}>{preview.name}</h2>
                <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>Generated {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: `1px solid ${T.border}`, background: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: T.text, height: 'fit-content' }}><Printer size={14} /> Print</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
              {(kpis[preview.id] || kpis['term-summary']).map((k: any) => (
                <div key={k.l} style={{ background: '#FAFAF8', borderRadius: 10, padding: 14, textAlign: 'center', borderTop: `3px solid ${k.c}` }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: T.muted, textTransform: 'uppercase', margin: '0 0 4px' }}>{k.l}</p>
                  <p style={{ fontSize: 24, fontWeight: 800, color: k.c, margin: 0, fontFamily: 'Georgia, serif' }}>{k.v}</p>
                </div>
              ))}
            </div>
            <div style={{ background: '#FAFAF8', borderRadius: 12, padding: 20, marginBottom: 24 }}>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={['Sep','Oct','Nov','Dec','Jan','Feb','Mar'].map((m, i) => ({ month: m, school: Math.round((classAvgI + (classAvgE - classAvgI) * (i / 6)) * 10) / 10, national: Math.round((88 + i * 0.5) * 10) / 10 }))} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2DDD4" /><XAxis dataKey="month" tick={{ fontSize: 10, fill: T.muted }} /><YAxis domain={[78, 100]} tick={{ fontSize: 10, fill: T.muted }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                  <Line type="monotone" dataKey="school" stroke={T.navy} strokeWidth={2.5} dot={{ r: 3 }} name="Parkside" />
                  <Line type="monotone" dataKey="national" stroke={T.muted} strokeWidth={1.5} strokeDasharray="5 3" dot={false} name="National" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: '#FAFAF8', borderRadius: 12, padding: 24, marginBottom: 24, borderLeft: `4px solid ${T.navy}` }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: T.navy, margin: '0 0 8px', textTransform: 'uppercase' }}>Analysis</h4>
              <p style={{ fontSize: 13, color: T.text, margin: 0, lineHeight: 1.8, fontFamily: 'Georgia, serif' }}>{NARRATIVES[preview.id] || NARRATIVES['term-summary']}</p>
            </div>
            <div style={{ borderTop: `2px solid ${T.border}`, paddingTop: 16 }}>
              <p style={{ fontSize: 10, color: T.muted, margin: 0 }}>Generated by <strong>Lumio Schools</strong> · Powered by <strong>OxEd & Assessment</strong> · NELI Programme · DfE Funded 2024–2029</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Portal ────────────────────────────────────────────────────────────

export default function NELIPortalPage() {
  const [page, setPage] = useState('overview')
  const [selectedPupil, setSelectedPupil] = useState<any>(null)
  const [selectedClass, setSelectedClass] = useState<any>(null)
  const [notifOpen, setNotifOpen] = useState(false)
  const [showWelcome, setShowWelcome] = useState(() => typeof window !== 'undefined' ? !sessionStorage.getItem('neli-welcomed') : false)
  const [assessingPupil, setAssessingPupil] = useState<any>(null)
  const [neliSubTab, setNeliSubTab] = useState<'dashboard' | 'languagescreen' | 'tracker'>('dashboard')
  const [insightsSubTab, setInsightsSubTab] = useState<'school' | 'network'>('school')
  const notifRef = useRef<HTMLDivElement>(null)

  // CSS animations are injected by the IIFE in NELIComponents on import
  useEffect(() => {
    if (showWelcome) {
      const t = setTimeout(() => { setShowWelcome(false); sessionStorage.setItem('neli-welcomed', '1') }, 6000)
      return () => clearTimeout(t)
    }
  }, [showWelcome])
  useEffect(() => {
    function handleClick(e: MouseEvent) { if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleNav(id: string) { setPage(id); setSelectedClass(null); setSelectedPupil(null); setNotifOpen(false) }
  const handleSelectPupil = (p: any) => { setSelectedPupil(p); setPage('pupil') }
  const handleSelectClass = (c: any) => { setSelectedClass(c); setPage('classdetail') }
  const pageLabel = NAV_ITEMS.find(n => n.id === page)?.label || 'Overview'

  function renderPage() {
    if (page === 'pupil' && selectedPupil) return <PupilDetail pupil={selectedPupil} onBack={() => { setPage(selectedClass ? 'classdetail' : 'languagescreen'); setSelectedPupil(null) }} />
    if (page === 'classdetail' && selectedClass) return <ClassDetail cls={selectedClass} onBack={() => { setPage('classes'); setSelectedClass(null) }} onSelectPupil={handleSelectPupil} />
    if (page === 'trainingcourses') return <TrainingCourses onBack={() => setPage('training')} staffName="Sarah Mitchell" />
    switch (page) {
      case 'overview': return <Dashboard onSelectPupil={handleSelectPupil} />
      case 'languagescreen': return (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, padding: '0 24px' }}>
            {([['dashboard', 'Dashboard'], ['languagescreen', 'LanguageScreen'], ['tracker', 'NELI Tracker']] as const).map(([id, label]) => (
              <button key={id} onClick={() => setNeliSubTab(id)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: neliSubTab === id ? T.navy : '#F3F0EA', color: neliSubTab === id ? 'white' : T.muted }}>{label}</button>
            ))}
          </div>
          {neliSubTab === 'dashboard' && <Dashboard onSelectPupil={handleSelectPupil} />}
          {neliSubTab === 'languagescreen' && <LanguageScreenPage onSelectPupil={handleSelectPupil} />}
          {neliSubTab === 'tracker' && <NELITracker />}
        </div>
      )
      case 'insights': return (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, padding: '0 24px' }}>
            {([['school', 'School View'], ['network', 'Network View']] as const).map(([id, label]) => (
              <button key={id} onClick={() => setInsightsSubTab(id)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: insightsSubTab === id ? T.navy : '#F3F0EA', color: insightsSubTab === id ? 'white' : T.muted }}>{label}</button>
            ))}
          </div>
          {insightsSubTab === 'school' ? <Insights /> : <TrustView />}
        </div>
      )
      case 'reports': return <ReportsPanel />
      case 'classes': return <ClassesPage onSelectClass={handleSelectClass} onSelectPupil={handleSelectPupil} />
      case 'training': return <Training onStartTraining={() => setPage('trainingcourses')} />
      case 'telted': return <TELTedTraining onBack={() => setPage('training')} />
      case 'resources': return <Resources />
      case 'attendance': return <ComingSoonPage title="Attendance" />
      case 'staff': return <ComingSoonPage title="Staff Management" />
      case 'safeguarding': return <ComingSoonPage title="Safeguarding" />
      case 'missync': return <ComingSoonPage title="MIS Sync" />
      default: return <Dashboard onSelectPupil={handleSelectPupil} />
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', background: T.bg, overflow: 'hidden' }}>
      {/* Welcome Overlay */}
      {showWelcome && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'linear-gradient(135deg, #0C1A2E 0%, #1B3060 50%, #0C1A2E 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 40, maxWidth: 700, padding: '0 24px' }}>
            <div className="neli-owlSlideIn" style={{ flexShrink: 0 }}>
              <svg width="140" height="140" viewBox="0 0 200 200">
                <ellipse cx="100" cy="130" rx="60" ry="50" fill="#8B5E3C" stroke="#4A3220" strokeWidth="2.5"/>
                <ellipse cx="100" cy="135" rx="45" ry="36" fill="#D4A574"/>
                <circle cx="100" cy="75" r="44" fill="#A0714F" stroke="#4A3220" strokeWidth="2.5"/>
                <ellipse cx="100" cy="80" rx="35" ry="32" fill="#F5DEB3"/>
                <circle cx="84" cy="72" r="14" fill="white" stroke="#4A3220" strokeWidth="1.5"/>
                <circle cx="116" cy="72" r="14" fill="white" stroke="#4A3220" strokeWidth="1.5"/>
                <circle cx="86" cy="72" r="7" fill="#2D1B0E"/><circle cx="118" cy="72" r="7" fill="#2D1B0E"/>
                <circle cx="88" cy="69" r="2.5" fill="white"/><circle cx="120" cy="69" r="2.5" fill="white"/>
                <path d="M93 86 L100 96 L107 86 Z" fill="#E8960C" stroke="#B87608" strokeWidth="1"/>
                <rect x="70" y="30" width="60" height="7" rx="2" fill="#1B3060"/>
                <polygon points="100,20 128,33 100,38 72,33" fill="#1B3060"/>
                <line x1="128" y1="33" x2="135" y2="46" stroke="#C8960C" strokeWidth="2"/>
                <circle cx="135" cy="48" r="3.5" fill="#C8960C"/>
                <circle cx="84" cy="72" r="17" fill="none" stroke="#333" strokeWidth="1.5"/>
                <circle cx="116" cy="72" r="17" fill="none" stroke="#333" strokeWidth="1.5"/>
                <line x1="101" y1="72" x2="99" y2="72" stroke="#333" strokeWidth="1.5"/>
                <rect x="60" y="115" width="28" height="35" rx="3" fill="#D4A574" stroke="#8B5E3C" strokeWidth="1.5"/>
                <rect x="64" y="122" width="20" height="2" rx="1" fill="#8B5E3C" opacity="0.5"/>
                <rect x="64" y="127" width="16" height="2" rx="1" fill="#8B5E3C" opacity="0.5"/>
                <rect x="64" y="132" width="18" height="2" rx="1" fill="#8B5E3C" opacity="0.5"/>
                <path d="M90 95 Q100 103 110 95" fill="none" stroke="#4A3220" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="neli-fadeIn" style={{ animationDelay: '0.3s' }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white', margin: '0 0 12px', fontFamily: 'Georgia, serif' }}>Welcome back, Sarah! 👋</h1>
              <p style={{ fontSize: 15, color: '#8BA4C7', margin: '0 0 8px', lineHeight: 1.6 }}>You have <strong style={{ color: '#C8960C' }}>{PUPILS.filter((p: any) => p.attendance < 90 || p.es < 85).length} pupils</strong> who need attention today.</p>
              <p style={{ fontSize: 15, color: '#8BA4C7', margin: '0 0 24px', lineHeight: 1.6 }}>Amara Johnson is due for her LanguageScreen assessment.</p>
              <button onClick={() => { setShowWelcome(false); sessionStorage.setItem('neli-welcomed', '1') }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${T.gold}, #D4A020)`, color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 24px rgba(200,150,12,0.4)' }}>
                Go to Dashboard <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LanguageScreen overlay */}
      {assessingPupil && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'white' }}>
          <LanguageScreenApp studentName={assessingPupil.name} studentDob={assessingPupil.dob?.split('/').reverse().join('-') || '2020-01-01'} schoolName="Parkside Primary" assessorName="Sarah Mitchell" onClose={() => setAssessingPupil(null)} />
        </div>
      )}

      {/* Sidebar */}
      <aside className="neli-sidebar" style={{ width: 220, background: 'linear-gradient(180deg, #0C1A2E 0%, #0A1628 100%)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #1E2E45', background: '#0A1628' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <img src="/NELI_logo.png" alt="NELI" style={{ width: '100%', maxWidth: 172, height: 'auto', objectFit: 'contain' }} onError={(e: any) => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex' }} />
            <div style={{ display: 'none', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: T.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14, color: 'white' }}>N</div>
              <div><p style={{ fontSize: 14, fontWeight: 800, color: 'white', margin: 0 }}>NELI Portal</p><p style={{ fontSize: 10, color: '#8BA4C7', margin: 0 }}>OxEd & Assessment</p></div>
            </div>
            <p style={{ fontSize: 10, color: '#8BA4C7', margin: 0, letterSpacing: '0.04em' }}>School Portal</p>
          </div>
        </div>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #1E2E45' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#8BA4C7', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>Current School</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'white', margin: '0 0 2px' }}>🏫 Parkside Primary</p>
          <p style={{ fontSize: 11, color: '#8BA4C7', margin: 0 }}>Oak Valley MAT · Reception</p>
        </div>
        <div style={{ margin: '0 16px', height: 1, background: 'linear-gradient(90deg, transparent, #C8960C40, transparent)' }} />
        <nav style={{ flex: 1, padding: 10, overflowY: 'auto' }}>
          {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
            const active = page === id || (page === 'classdetail' && id === 'classes') || (page === 'pupil' && id === 'languagescreen') || (page === 'trainingcourses' && id === 'training')
            return (
              <button key={id} onClick={() => handleNav(id)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left', marginBottom: 2, background: active ? '#1E3561' : 'transparent', color: active ? T.gold : '#8BA4C7', borderLeft: active ? `4px solid ${T.gold}` : '4px solid transparent', transition: 'all 0.15s ease' }}>
                <Icon size={16} style={{ flexShrink: 0 }} /><span style={{ fontSize: 13, fontWeight: active ? 700 : 500 }}>{label}</span>
              </button>
            )
          })}
        </nav>
        <div style={{ margin: '0 16px', height: 1, background: 'linear-gradient(90deg, transparent, #C8960C40, transparent)' }} />
        <div style={{ padding: '12px 10px' }}>
          {[{ icon: Settings, label: 'Settings' }, { icon: LogOut, label: 'Sign Out' }].map(({ icon: Icon, label }) => (
            <button key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#8BA4C7', marginBottom: 2, fontSize: 12 }}><Icon size={15} /><span>{label}</span></button>
          ))}
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header className="neli-header" style={{ height: 56, background: 'linear-gradient(180deg, white 0%, #FAFAF8 100%)', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, flexShrink: 0 }}>
          <div style={{ flex: 1 }}><h1 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: 0 }}>{page === 'pupil' && selectedPupil ? selectedPupil.name : page === 'classdetail' && selectedClass ? selectedClass.name : page === 'trainingcourses' ? 'FutureLearn Courses' : pageLabel}</h1></div>
          <div className="neli-pulseGlow" style={{ fontSize: 12, color: T.green, fontWeight: 700, background: T.greenBg, padding: '4px 12px', borderRadius: 20 }}>● DfE Funded 2024–2029</div>
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button onClick={() => setNotifOpen(o => !o)} style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${T.border}`, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
              <Bell size={16} color={T.muted} className="neli-bellBounce" />
              <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: T.red, border: '2px solid white' }} />
            </button>
            {notifOpen && (
              <div style={{ position: 'absolute', top: 42, right: 0, width: 300, background: 'white', border: `1px solid ${T.border}`, borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Alerts</span>
                  <span style={{ fontSize: 11, color: T.muted }}>{ALERTS.length} active</span>
                </div>
                {ALERTS.map((a: any, i: number) => (
                  <div key={i} style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}`, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 4, background: a.type === 'red' ? T.red : T.amber }} />
                    <span style={{ fontSize: 12, color: T.text, lineHeight: 1.5 }}>{a.msg}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: T.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white' }}>SM</div>
            <div><p style={{ fontSize: 12, fontWeight: 600, color: T.text, margin: 0 }}>Sarah Mitchell</p><p style={{ fontSize: 10, color: T.muted, margin: 0 }}>NELI Lead</p></div>
          </div>
        </header>
        <main style={{ flex: 1, overflowY: 'auto' }}>{renderPage()}</main>
      </div>
    </div>
  )
}
