'use client'

import { useState } from 'react'
import { GraduationCap, FileText, Calendar, Target, Users, Plus, Save, X, Shield } from 'lucide-react'

const TEAL = '#0D9488'
const TEAL_BG = 'rgba(13,148,136,0.08)'
const TEAL_BORDER = 'rgba(13,148,136,0.2)'
const CARD = '#111318'
const BORDER = '#1F2937'

type Tab = 'overview' | 'notes' | 'meetings' | 'improvement' | 'performance'

interface Note { id: string; title: string; content: string; date: string; author: string }

const DEMO_SLT = [
  { name: 'Mrs. E. Whitmore', role: 'Headteacher', responsibilities: 'Strategic leadership, Ofsted, safeguarding lead, standards', photo: null },
  { name: 'Mr. J. Kaur', role: 'Deputy Head', responsibilities: 'Curriculum, assessment, teaching & learning, NQT induction', photo: null },
  { name: 'Mrs. S. Adebayo', role: 'Assistant Head (Pastoral)', responsibilities: 'Behaviour, attendance, student welfare, parent engagement', photo: null },
  { name: 'Mr. D. Roberts', role: 'Assistant Head (SEND)', responsibilities: 'SENCO, EHCPs, inclusion, pupil premium strategy', photo: null },
  { name: 'Mrs. L. Chen', role: 'Business Manager', responsibilities: 'Finance, premises, HR, procurement, compliance', photo: null },
]

const DEMO_MEETINGS = [
  { date: '28 Mar 2026', title: 'Weekly SLT Briefing', agenda: ['Attendance review', 'SATs prep update', 'Staffing for Summer term'], actions: ['JK to finalise Year 6 booster timetable', 'SA to follow up PA families', 'DR to present EHCP audit at next meeting'] },
  { date: '21 Mar 2026', title: 'SLT Strategy Session', agenda: ['SIP progress review', 'Budget sign-off', 'Ofsted readiness checklist'], actions: ['EW to submit budget to governors', 'LC to arrange fire risk assessment', 'All to complete SEF sections by 4 Apr'] },
  { date: '14 Mar 2026', title: 'Weekly SLT Briefing', agenda: ['World Book Day debrief', 'Year 4 behaviour concerns', 'Staff wellbeing survey results'], actions: ['SA to implement new break-time rota for Y4', 'EW to draft staff wellbeing action plan', 'JK to organise parent reading workshop'] },
]

export default function DemoSLTSuite() {
  const [tab, setTab] = useState<Tab>('overview')

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'School Overview', icon: GraduationCap },
    { id: 'notes', label: 'Confidential Notes', icon: FileText },
    { id: 'meetings', label: 'SLT Meetings', icon: Calendar },
    { id: 'improvement', label: 'School Improvement', icon: Target },
    { id: 'performance', label: 'Staff Performance', icon: Shield },
  ]

  return (
    <div className="space-y-6 p-6" style={{ backgroundColor: '#07080F', minHeight: '100vh' }}>
      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${TEAL_BG}, rgba(13,148,136,0.02))`, border: `1px solid ${TEAL_BORDER}` }}>
        <div className="relative px-6 py-5">
          <div className="flex items-center gap-3">
            <GraduationCap size={24} style={{ color: TEAL }} />
            <div>
              <h1 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>SLT Suite</h1>
              <p className="text-xs" style={{ color: TEAL }}>Confidential — Senior Leadership Team only</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap" style={{
            backgroundColor: tab === t.id ? TEAL_BG : 'transparent',
            color: tab === t.id ? TEAL : '#6B7280',
            border: tab === t.id ? `1px solid ${TEAL_BORDER}` : '1px solid #1F2937',
          }}>
            <t.icon size={12} />{t.label}
          </button>
        ))}
      </div>

      {/* Overview — SLT members + KPIs */}
      {tab === 'overview' && (
        <div className="space-y-4">
          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Attendance Today', value: '94.8%', color: '#22C55E', icon: '📊' },
              { label: 'Safeguarding Alerts', value: '2', color: '#EF4444', icon: '🛡️' },
              { label: 'SEND Pupils', value: '47', color: '#3B82F6', icon: '📋' },
              { label: 'Staff Absent Today', value: '3', color: '#F59E0B', icon: '👥' },
              { label: 'Ofsted Readiness', value: '72%', color: '#8B5CF6', icon: '⭐' },
              { label: 'Budget Remaining', value: '£142k', color: '#0D9488', icon: '💰' },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-4" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-sm">{s.icon}</span>
                  <p className="text-[10px]" style={{ color: '#6B7280' }}>{s.label}</p>
                </div>
                <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* SLT Profiles */}
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <div className="px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Senior Leadership Team</p>
            </div>
            <div className="divide-y" style={{ borderColor: BORDER }}>
              {DEMO_SLT.map((m, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: TEAL_BG, color: TEAL, border: `1px solid ${TEAL_BORDER}` }}>
                    {m.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{m.name}</p>
                    <p className="text-xs" style={{ color: TEAL }}>{m.role}</p>
                  </div>
                  <p className="text-xs hidden sm:block" style={{ color: '#6B7280' }}>{m.responsibilities}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Confidential Notes */}
      {tab === 'notes' && <DemoSLTNotes />}

      {/* SLT Meetings */}
      {tab === 'meetings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>SLT Meeting Log</p>
            <button className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: TEAL_BG, color: TEAL, border: `1px solid ${TEAL_BORDER}` }}>
              <Plus size={12} /> Schedule Meeting
            </button>
          </div>
          {DEMO_MEETINGS.map((m, i) => (
            <div key={i} className="rounded-xl p-5" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{m.title}</p>
                <span className="text-xs" style={{ color: '#6B7280' }}>{m.date}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase mb-1.5" style={{ color: '#6B7280' }}>Agenda</p>
                  <ul className="space-y-1">
                    {m.agenda.map((a, j) => (
                      <li key={j} className="text-xs flex items-start gap-1.5" style={{ color: '#9CA3AF' }}>
                        <span style={{ color: TEAL }}>•</span>{a}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase mb-1.5" style={{ color: '#6B7280' }}>Actions</p>
                  <ul className="space-y-1">
                    {m.actions.map((a, j) => (
                      <li key={j} className="text-xs flex items-start gap-1.5" style={{ color: '#9CA3AF' }}>
                        <span style={{ color: '#F59E0B' }}>→</span>{a}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* School Improvement */}
      {tab === 'improvement' && (
        <div className="space-y-4">
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>School Improvement Plan — 2025/26</p>
          {[
            { priority: 'Raise KS2 attainment in Writing', lead: 'Mr. J. Kaur', rag: 'amber', progress: 58 },
            { priority: 'Reduce persistent absence to <10%', lead: 'Mrs. S. Adebayo', rag: 'red', progress: 34 },
            { priority: 'Develop SEND provision and EHCP quality', lead: 'Mr. D. Roberts', rag: 'green', progress: 76 },
            { priority: 'Embed new behaviour policy across all year groups', lead: 'Mrs. S. Adebayo', rag: 'green', progress: 82 },
            { priority: 'Ofsted readiness — complete SEF and update evidence files', lead: 'Mrs. E. Whitmore', rag: 'amber', progress: 62 },
          ].map((item, i) => {
            const ragColor = item.rag === 'green' ? '#22C55E' : item.rag === 'amber' ? '#F59E0B' : '#EF4444'
            return (
              <div key={i} className="rounded-xl p-4" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{item.priority}</p>
                    <p className="text-xs" style={{ color: '#6B7280' }}>Lead: {item.lead}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase" style={{ backgroundColor: `${ragColor}1a`, color: ragColor }}>{item.rag}</span>
                </div>
                <div className="rounded-full h-2 overflow-hidden" style={{ backgroundColor: '#1F2937' }}>
                  <div className="h-full rounded-full" style={{ width: `${item.progress}%`, backgroundColor: ragColor }} />
                </div>
                <p className="text-[10px] mt-1 text-right" style={{ color: '#4B5563' }}>{item.progress}% complete</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Staff Performance */}
      {tab === 'performance' && (
        <div className="space-y-4">
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Staff Performance — Confidential</p>
          {[
            { name: 'Mr. A. Patel (Y6 Teacher)', status: 'On Track', note: 'Strong SATs results. CPD target: subject leadership by Sept.', color: '#22C55E' },
            { name: 'Ms. R. Jones (Y3 Teacher)', status: 'Support Plan', note: 'Lesson observations inconsistent. Support plan agreed — 6 week review.', color: '#EF4444' },
            { name: 'Mrs. K. Williams (EYFS Lead)', status: 'Exceeding', note: 'Outstanding EYFS outcomes. Ready for internal promotion to AHT.', color: '#0D9488' },
            { name: 'Mr. T. Green (Y5 Teacher)', status: 'On Track', note: 'Good progress this term. NQT induction meeting scheduled 14 Apr.', color: '#22C55E' },
          ].map((s, i) => (
            <div key={i} className="rounded-xl p-4" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{s.name}</p>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: `${s.color}1a`, color: s.color }}>{s.status}</span>
              </div>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>{s.note}</p>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: TEAL_BG, color: TEAL, border: `1px solid ${TEAL_BORDER}` }}>🔒 Headteacher only</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DemoSLTNotes() {
  const [notes, setNotes] = useState<Note[]>(() => {
    try { return JSON.parse(localStorage.getItem('lumio_slt_notes') || '[]') } catch { return [] }
  })
  const [showNew, setShowNew] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')

  function saveNote() {
    if (!newTitle.trim()) return
    const note: Note = { id: crypto.randomUUID(), title: newTitle, content: newContent, date: new Date().toISOString(), author: 'Mrs. E. Whitmore' }
    const updated = [note, ...notes]
    setNotes(updated)
    localStorage.setItem('lumio_slt_notes', JSON.stringify(updated))
    setShowNew(false); setNewTitle(''); setNewContent('')
  }

  function deleteNote(id: string) {
    const updated = notes.filter(n => n.id !== id)
    setNotes(updated)
    localStorage.setItem('lumio_slt_notes', JSON.stringify(updated))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Confidential Notes</p>
        <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: TEAL_BG, color: TEAL, border: `1px solid ${TEAL_BORDER}` }}>
          <Plus size={12} /> New Note
        </button>
      </div>
      {showNew && (
        <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: CARD, border: `1px solid ${TEAL_BORDER}` }}>
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Note title" className="w-full text-sm rounded-lg px-3 py-2 outline-none" style={{ backgroundColor: '#0A0B10', border: `1px solid ${BORDER}`, color: '#F9FAFB' }} autoFocus />
          <textarea value={newContent} onChange={e => setNewContent(e.target.value)} rows={4} placeholder="Write your confidential note..." className="w-full text-sm rounded-lg px-3 py-2 outline-none resize-none" style={{ backgroundColor: '#0A0B10', border: `1px solid ${BORDER}`, color: '#F9FAFB' }} />
          <div className="flex gap-2">
            <button onClick={saveNote} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: TEAL, color: '#fff' }}><Save size={12} /> Save</button>
            <button onClick={() => setShowNew(false)} className="px-3 py-2 rounded-lg text-xs" style={{ color: '#6B7280' }}>Cancel</button>
          </div>
        </div>
      )}
      {notes.length === 0 && !showNew && (
        <div className="rounded-xl p-8 text-center" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
          <FileText size={32} style={{ color: TEAL, margin: '0 auto 12px', opacity: 0.5 }} />
          <p className="text-sm" style={{ color: '#6B7280' }}>No notes yet. Create your first confidential note.</p>
        </div>
      )}
      {notes.map(n => (
        <div key={n.id} className="rounded-xl p-4" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{n.title}</p>
              <p className="text-[10px]" style={{ color: '#4B5563' }}>{n.author} · {new Date(n.date).toLocaleDateString('en-GB')}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: TEAL_BG, color: TEAL, border: `1px solid ${TEAL_BORDER}` }}>🔒 Confidential</span>
              <button onClick={() => deleteNote(n.id)} style={{ color: '#4B5563' }}><X size={14} /></button>
            </div>
          </div>
          <p className="text-xs whitespace-pre-wrap" style={{ color: '#9CA3AF' }}>{n.content}</p>
        </div>
      ))}
    </div>
  )
}
