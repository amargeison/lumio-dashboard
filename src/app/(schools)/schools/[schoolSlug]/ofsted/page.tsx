'use client'

import { useState, useEffect } from 'react'
import { Shield, FileText, Users, BookOpen, AlertTriangle, Check, X, Clock, Download, Sparkles, Search, Plus, ChevronRight, ChevronDown, Activity } from 'lucide-react'
import DeptAISummary from '@/components/DeptAISummary'
import AIInsightsReport from '@/components/AIInsightsReport'

// ─── Data ────────────────────────────────────────────────────────────────────

const READINESS = [
  { area: 'Quality of Education', score: 87, icon: '📚' },
  { area: 'Behaviour & Attitudes', score: 91, icon: '🎯' },
  { area: 'Personal Development', score: 79, icon: '🌱' },
  { area: 'Leadership & Management', score: 88, icon: '👔' },
  { area: 'Early Years', score: 82, icon: '🧒' },
  { area: 'Safeguarding', score: 76, icon: '🔒' },
]

const EVIDENCE: { item: string; status: 'ready' | 'warning' | 'missing'; note?: string }[] = [
  { item: 'School Development Plan', status: 'ready' },
  { item: 'Curriculum Intent document', status: 'ready' },
  { item: 'Attendance data (last 12 months)', status: 'ready' },
  { item: 'Safeguarding policy (dated this year)', status: 'warning', note: 'Needs updating — last reviewed Sep 2025' },
  { item: 'Child Protection register', status: 'ready' },
  { item: 'Staff training records', status: 'ready' },
  { item: 'DBS check register', status: 'warning', note: '2 expired — M. Taylor, J. Andrews' },
  { item: 'SEND register', status: 'ready' },
  { item: 'Behaviour policy', status: 'ready' },
  { item: 'Exclusions log', status: 'ready' },
  { item: 'Pupil Premium strategy', status: 'warning', note: 'Impact not documented for spring term' },
  { item: 'Phonics screening results', status: 'ready' },
  { item: 'Governor meeting minutes', status: 'ready' },
]

const QUICK_REPORTS = [
  { label: 'Pull Attendance Report', icon: '📊', color: '#0D9488' },
  { label: 'Safeguarding Summary', icon: '🔒', color: '#EF4444' },
  { label: 'Curriculum Overview', icon: '📚', color: '#8B5CF6' },
  { label: 'SEND Report', icon: '👥', color: '#22D3EE' },
  { label: 'Outcomes Data', icon: '🏆', color: '#F59E0B' },
  { label: 'Behaviour Log', icon: '📋', color: '#6B7280' },
]

const DEEP_DIVES = [
  { label: 'Quality of Education', icon: '📚' },
  { label: 'Safeguarding', icon: '🔒' },
  { label: 'SEND provision', icon: '♿' },
  { label: 'Leadership & Management', icon: '👔' },
  { label: 'Pupil Premium impact', icon: '💷' },
]

const SCHEDULE = [
  { time: '09:00', event: 'Initial meeting with Headteacher', status: 'done' },
  { time: '09:30', event: 'Learning walk (Year 3, 5, 6)', status: 'now' },
  { time: '11:00', event: 'Pupil voice sessions', status: 'upcoming' },
  { time: '12:00', event: 'Book scrutiny', status: 'upcoming' },
  { time: '13:30', event: 'Staff meetings', status: 'upcoming' },
  { time: '14:30', event: 'Data review', status: 'upcoming' },
  { time: '15:30', event: 'Feedback to leadership', status: 'upcoming' },
]

const DEEP_DIVE_CONTENT: Record<string, { points: string[]; questions: string[] }> = {
  'Quality of Education': {
    points: [
      'Curriculum is sequenced logically across all year groups with clear progression maps',
      'Subject leaders can articulate intent — what pupils should learn and why in that order',
      'Phonics programme (Little Wandle) shows 89% pass rate at Year 1 screening',
      'Disadvantaged pupils make progress in line with peers in reading and maths',
      'Assessment is used formatively — teachers adjust teaching based on gap analysis',
    ],
    questions: ['How do you ensure curriculum coverage for pupils who join mid-year?', 'What does your homework policy contribute to learning?', 'How do you know your curriculum is working for SEND pupils?'],
  },
  'Safeguarding': {
    points: [
      'DSL and deputy DSL both Level 3 trained (updated Jan 2026)',
      'Single Central Record is up to date — 2 DBS renewals flagged for this month',
      'CPOMS logging system shows 47 concerns this term, all triaged within 24 hours',
      'Staff safer recruitment training completed by 100% of interview panel members',
      'Online safety curriculum delivered through PSHE and computing — evidenced in planning',
    ],
    questions: ['Walk me through your process when a concern is raised', 'How do you handle low-level concerns about staff?', 'What happens when a pupil discloses on a Friday afternoon?'],
  },
  'SEND provision': {
    points: [
      'SEND register: 42 pupils (10%) — 8 EHCPs, 34 SEN Support',
      'Graduated approach documented for all SEN Support pupils with termly reviews',
      'SENCO is qualified (NASENCo) with dedicated 3 days per week',
      'Provision mapping shows interventions matched to identified needs',
      'Annual reviews for EHCP pupils completed on time — 100% compliance this year',
    ],
    questions: ['How do you identify pupils with SEND early?', 'What training have class teachers had on adaptive teaching?', 'How do you evaluate the impact of interventions?'],
  },
  'Leadership & Management': {
    points: [
      'SDP priorities are clear and monitored through governor committee structure',
      'Staff wellbeing survey shows 87% satisfaction — actions taken from concerns',
      'Subject leaders conduct termly monitoring: learning walks, book looks, planning scrutiny',
      'Performance management linked to SDP priorities with mid-year review process',
      'Governance is effective — skills audit completed, training plan in place',
    ],
    questions: ['How do you know your development plan is having impact?', 'What is your approach to staff workload?', 'How do governors hold you to account?'],
  },
  'Pupil Premium impact': {
    points: [
      '23% of pupils eligible for PP (97 pupils) — strategy published on website',
      'PP pupils make expected progress in reading (78%) and maths (72%)',
      'Attendance for PP pupils is 93.1% vs 95.2% whole school — gap narrowing',
      'Targeted interventions: 1:1 reading recovery, maths catch-up, ELSA support',
      'Cultural capital programme: all PP pupils accessed at least 3 enrichment trips this year',
    ],
    questions: ['How do you track the impact of your PP spending?', 'What are the biggest barriers for your disadvantaged pupils?', 'How do you ensure PP pupils access the full curriculum?'],
  },
}

// ─── Components ──────────────────────────────────────────────────────────────

function scoreColor(s: number) {
  if (s >= 85) return '#22C55E'
  if (s >= 70) return '#F59E0B'
  return '#EF4444'
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'ready') return <span style={{ color: '#22C55E', fontSize: 14 }}>✅</span>
  if (status === 'warning') return <span style={{ color: '#F59E0B', fontSize: 14 }}>⚠️</span>
  return <span style={{ color: '#EF4444', fontSize: 14 }}>❌</span>
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function OfstedModePage() {
  const [activated, setActivated] = useState(false)
  const [showActivateModal, setShowActivateModal] = useState(false)
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split('T')[0])
  const [leadInspector, setLeadInspector] = useState('')
  const [activeDeepDive, setActiveDeepDive] = useState<string | null>(null)
  const [observations, setObservations] = useState<{ text: string; time: string }[]>([
    { text: 'Year 6 maths lesson — inspector observed — went well, strong questioning', time: '09:42' },
    { text: 'Inspector asked about phonics — pointed to display data wall', time: '10:15' },
  ])
  const [newObs, setNewObs] = useState('')
  const [toast, setToast] = useState('')
  const [showAIInsights, setShowAIInsights] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('lumio_ofsted_mode')
    if (stored === 'true') setActivated(true)
  }, [])

  function activate() {
    setActivated(true)
    localStorage.setItem('lumio_ofsted_mode', 'true')
    setShowActivateModal(false)
  }

  function deactivate() {
    setActivated(false)
    localStorage.removeItem('lumio_ofsted_mode')
    setToast('Ofsted Mode deactivated — inspection log saved')
    setTimeout(() => setToast(''), 3000)
  }

  function addObservation() {
    if (!newObs.trim()) return
    setObservations(prev => [{ text: newObs, time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) }, ...prev])
    setNewObs('')
  }

  function showReportToast(label: string) {
    setToast(`Generating ${label}...`)
    setTimeout(() => setToast(`${label} ready — download started`), 1500)
    setTimeout(() => setToast(''), 4000)
  }

  const overallScore = Math.round(READINESS.reduce((s, r) => s + r.score, 0) / READINESS.length)
  const readyCount = EVIDENCE.filter(e => e.status === 'ready').length
  const warningCount = EVIDENCE.filter(e => e.status === 'warning').length

  // ─── Activation Modal ──────────────────────────────────────────────────────
  if (!activated && !showActivateModal) {
    return (
      <div className="space-y-6">
        <DeptAISummary dept="ofsted" portal="schools" />
        <button onClick={() => setShowAIInsights(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-opacity hover:opacity-90" style={{ backgroundColor: '#1a1a2e', border: '1px solid #F1C40F', color: '#F1C40F' }}>
          📊 Insights
        </button>
        <div className="text-center py-16">
          <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
          <h1 className="text-2xl font-black mb-2" style={{ color: '#F9FAFB' }}>Ofsted Inspection Mode</h1>
          <p className="text-sm mb-8 mx-auto" style={{ color: '#9CA3AF', maxWidth: 480 }}>
            When an inspector visits, Lumio will surface everything they need — evidence packs, talking points, data summaries, and a live observation log.
          </p>
          <button onClick={() => setShowActivateModal(true)}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold"
            style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
            <Search size={18} /> Activate Ofsted Mode
          </button>
          <div className="mt-8 grid grid-cols-3 gap-4 max-w-lg mx-auto">
            <div className="rounded-xl p-4 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <p className="text-2xl font-black" style={{ color: scoreColor(overallScore) }}>{overallScore}</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>Readiness Score</p>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <p className="text-2xl font-black" style={{ color: '#22C55E' }}>{readyCount}/{EVIDENCE.length}</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>Evidence Ready</p>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <p className="text-2xl font-black" style={{ color: '#F59E0B' }}>{warningCount}</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>Need Attention</p>
            </div>
          </div>
        </div>
        <AIInsightsReport dept="ofsted" portal="schools" isOpen={showAIInsights} onClose={() => setShowAIInsights(false)} />
      </div>
    )
  }

  if (showActivateModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}>
        <div className="w-full max-w-md rounded-2xl p-8 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <h2 className="text-xl font-black mb-2" style={{ color: '#F9FAFB' }}>Ofsted Inspection Mode</h2>
          <p className="text-sm mb-6" style={{ color: '#9CA3AF' }}>An inspector is visiting. Lumio will now surface everything they'll need.</p>
          <div className="space-y-4 text-left mb-6">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>Date of inspection</label>
              <input type="date" value={inspectionDate} onChange={e => setInspectionDate(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB' }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>Lead inspector name (optional)</label>
              <input value={leadInspector} onChange={e => setLeadInspector(e.target.value)} placeholder="e.g. Ms J. Williams"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB' }} />
            </div>
          </div>
          <button onClick={activate} className="w-full py-3 rounded-xl text-sm font-bold" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
            Activate Ofsted Mode
          </button>
          <button onClick={() => setShowActivateModal(false)} className="block mx-auto mt-3 text-xs" style={{ color: '#6B7280' }}>Cancel</button>
        </div>
      </div>
    )
  }

  // ─── Active Ofsted Dashboard ───────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Orange inspection banner */}
      <div className="flex items-center justify-between rounded-xl px-5 py-3" style={{ backgroundColor: '#F59E0B', color: '#0A0B10' }}>
        <div className="flex items-center gap-3">
          <Search size={16} />
          <span className="text-sm font-bold">Ofsted Inspection Mode — Active</span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}>Day 1 of 2</span>
          {leadInspector && <span className="text-xs">· {leadInspector}</span>}
        </div>
        <button onClick={deactivate} className="text-xs font-semibold px-3 py-1 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}>Deactivate</button>
      </div>

      {/* SECTION 1 — Readiness Score */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="rounded-xl p-6 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: '#6B7280' }}>OVERALL READINESS</p>
          <p className="text-5xl font-black" style={{ color: scoreColor(overallScore) }}>{overallScore}</p>
          <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>out of 100</p>
        </div>
        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-3">
          {READINESS.map(r => (
            <div key={r.area} className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg">{r.icon}</span>
                <span className="text-xl font-black" style={{ color: scoreColor(r.score) }}>{r.score}</span>
              </div>
              <p className="text-xs font-medium" style={{ color: '#D1D5DB' }}>{r.area}</p>
              {r.score < 80 && <span className="text-[10px] mt-1 inline-block" style={{ color: '#F59E0B' }}>⚠️ Needs attention</span>}
              <div className="mt-2 h-1.5 rounded-full" style={{ backgroundColor: '#1F2937' }}>
                <div className="h-full rounded-full" style={{ width: `${r.score}%`, backgroundColor: scoreColor(r.score) }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2 — Evidence Pack */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-2">
            <FileText size={15} style={{ color: '#0D9488' }} />
            <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Evidence Pack</span>
          </div>
          <span className="text-xs" style={{ color: '#22C55E' }}>{readyCount} ready · <span style={{ color: '#F59E0B' }}>{warningCount} need attention</span></span>
        </div>
        <div>
          {EVIDENCE.map((e, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: i < EVIDENCE.length - 1 ? '1px solid #1F2937' : undefined }}>
              <StatusIcon status={e.status} />
              <div className="flex-1 min-w-0">
                <span className="text-sm" style={{ color: '#D1D5DB' }}>{e.item}</span>
                {e.note && <p className="text-xs" style={{ color: e.status === 'warning' ? '#F59E0B' : '#EF4444' }}>{e.note}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3 — Quick Evidence Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {QUICK_REPORTS.map(r => (
          <button key={r.label} onClick={() => showReportToast(r.label)}
            className="rounded-xl p-4 text-center transition-colors hover:opacity-90"
            style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <span className="text-2xl block mb-2">{r.icon}</span>
            <span className="text-xs font-semibold" style={{ color: '#D1D5DB' }}>{r.label}</span>
          </button>
        ))}
      </div>

      {/* SECTION 4 — Talking Points + SECTION 5 — Schedule (side by side) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Talking Points */}
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid #1F2937' }}>
            <Sparkles size={15} style={{ color: '#8B5CF6' }} />
            <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Talking Points Generator</span>
          </div>
          <div className="p-5 space-y-2">
            <p className="text-xs mb-3" style={{ color: '#9CA3AF' }}>Select a deep dive area:</p>
            {DEEP_DIVES.map(d => (
              <div key={d.label}>
                <button onClick={() => setActiveDeepDive(activeDeepDive === d.label ? null : d.label)}
                  className="w-full flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors"
                  style={{ backgroundColor: activeDeepDive === d.label ? 'rgba(139,92,246,0.1)' : '#0A0B10', border: `1px solid ${activeDeepDive === d.label ? '#8B5CF6' : '#1F2937'}`, color: '#F9FAFB' }}>
                  <span>{d.icon} {d.label}</span>
                  {activeDeepDive === d.label ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                {activeDeepDive === d.label && DEEP_DIVE_CONTENT[d.label] && (
                  <div className="mt-2 rounded-lg p-4 space-y-3" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
                    <p className="text-xs font-bold" style={{ color: '#8B5CF6' }}>KEY EVIDENCE POINTS</p>
                    {DEEP_DIVE_CONTENT[d.label].points.map((p, i) => (
                      <div key={i} className="flex gap-2 text-xs" style={{ color: '#D1D5DB' }}>
                        <Check size={12} className="mt-0.5 shrink-0" style={{ color: '#0D9488' }} />
                        <span>{p}</span>
                      </div>
                    ))}
                    <p className="text-xs font-bold mt-4" style={{ color: '#F59E0B' }}>LIKELY INSPECTOR QUESTIONS</p>
                    {DEEP_DIVE_CONTENT[d.label].questions.map((q, i) => (
                      <div key={i} className="flex gap-2 text-xs" style={{ color: '#F59E0B' }}>
                        <span className="shrink-0">❓</span>
                        <span>{q}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Schedule */}
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid #1F2937' }}>
            <Clock size={15} style={{ color: '#0D9488' }} />
            <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Inspector Schedule — Today</span>
          </div>
          <div className="p-5 space-y-1">
            {SCHEDULE.map(s => (
              <div key={s.time} className="flex items-center gap-3 py-2.5" style={{ opacity: s.status === 'done' ? 0.4 : 1 }}>
                <span className="text-xs font-bold w-12 shrink-0" style={{ color: '#6B7280' }}>{s.time}</span>
                <span className="text-sm" style={{ color: s.status === 'done' ? '#6B7280' : '#F9FAFB', textDecoration: s.status === 'done' ? 'line-through' : 'none', fontWeight: s.status === 'now' ? 700 : 400 }}>{s.event}</span>
                {s.status === 'now' && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 6 — Live Observation Log */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-2">
            <Activity size={15} style={{ color: '#22D3EE' }} />
            <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Live Observation Log</span>
          </div>
          <span className="text-xs" style={{ color: '#6B7280' }}>{observations.length} entries</span>
        </div>
        <div className="p-5">
          <div className="flex gap-2 mb-4">
            <input value={newObs} onChange={e => setNewObs(e.target.value)} placeholder="Log an observation..."
              className="flex-1 rounded-lg px-3 py-2 text-sm outline-none" style={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB' }}
              onKeyDown={e => { if (e.key === 'Enter') addObservation() }} />
            <button onClick={addObservation} className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
              <Plus size={14} />
            </button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {observations.map((o, i) => (
              <div key={i} className="flex gap-3 rounded-lg px-3 py-2" style={{ backgroundColor: '#0A0B10' }}>
                <span className="text-xs font-bold shrink-0 mt-0.5" style={{ color: '#6B7280' }}>{o.time}</span>
                <span className="text-sm" style={{ color: '#D1D5DB' }}>{o.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 7 — Post-Inspection Actions */}
      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Post-Inspection</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => showReportToast('Full Inspection Log PDF')} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: 'rgba(13,148,136,0.1)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.3)' }}>
            <Download size={13} /> Export Inspection Log (PDF)
          </button>
          <button onClick={() => showReportToast('Actions Summary')} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.3)' }}>
            <FileText size={13} /> Actions Summary
          </button>
          <button onClick={deactivate} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}>
            <X size={13} /> End Inspection Mode
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] rounded-xl px-4 py-3 text-sm font-medium shadow-xl" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
