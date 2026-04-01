'use client'

import { useState, useEffect } from 'react'
import { GraduationCap, FileText, Calendar, Target, Users, Plus, Save, X, Shield } from 'lucide-react'
import { getSchoolClientRole } from '@/lib/detect-school-role'

const TEAL = '#0D9488'
const TEAL_BG = 'rgba(13,148,136,0.08)'
const TEAL_BORDER = 'rgba(13,148,136,0.2)'
const CARD = '#111318'
const BORDER = '#1F2937'

type Tab = 'overview' | 'notes' | 'meetings' | 'improvement' | 'performance'

interface Note { id: string; title: string; content: string; date: string; author: string }

export default function SLTSuite() {
  const [tab, setTab] = useState<Tab>('overview')
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [isHead, setIsHead] = useState(false)

  useEffect(() => {
    const { role_level, isOwner } = getSchoolClientRole()
    setHasAccess(role_level <= 1 || isOwner)
    setIsHead(role_level === 1 || isOwner)
  }, [])

  if (hasAccess === null) return null
  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <GraduationCap size={48} style={{ color: TEAL, marginBottom: 16 }} />
        <h2 className="text-xl font-bold mb-2" style={{ color: '#F9FAFB' }}>SLT Suite</h2>
        <p className="text-sm" style={{ color: '#6B7280' }}>This section is only available to the Senior Leadership Team.</p>
      </div>
    )
  }

  const TABS: { id: Tab; label: string; icon: React.ElementType; sltOnly?: boolean }[] = [
    { id: 'overview', label: 'School Overview', icon: GraduationCap },
    { id: 'notes', label: 'Confidential Notes', icon: FileText },
    { id: 'meetings', label: 'SLT Meetings', icon: Calendar },
    { id: 'improvement', label: 'School Improvement', icon: Target },
    { id: 'performance', label: 'Staff Performance', icon: Shield, sltOnly: true },
  ]

  const visibleTabs = TABS.filter(t => !t.sltOnly || isHead)

  return (
    <div className="space-y-6">
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
        {visibleTabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap" style={{
            backgroundColor: tab === t.id ? TEAL_BG : 'transparent',
            color: tab === t.id ? TEAL : '#6B7280',
            border: tab === t.id ? `1px solid ${TEAL_BORDER}` : '1px solid #1F2937',
          }}>
            <t.icon size={12} />{t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <SchoolOverview />}
      {tab === 'notes' && <SLTNotes />}
      {tab === 'meetings' && <SLTMeetings />}
      {tab === 'improvement' && <SchoolImprovement />}
      {tab === 'performance' && isHead && <StaffPerformance />}
    </div>
  )
}

function SchoolOverview() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[
        { label: 'Attendance Today', value: '--', sub: 'Connect MIS', color: '#22C55E', icon: '📊' },
        { label: 'Safeguarding Alerts', value: '0', sub: 'No open concerns', color: '#EF4444', icon: '🛡️' },
        { label: 'SEND Pupils', value: '--', sub: 'Import SEND register', color: '#3B82F6', icon: '📋' },
        { label: 'Staff Absent Today', value: '0', sub: 'All staff present', color: '#F59E0B', icon: '👥' },
        { label: 'Ofsted Readiness', value: '--', sub: 'Complete checklist', color: '#8B5CF6', icon: '⭐' },
        { label: 'Budget Remaining', value: '--', sub: 'Connect finance', color: '#0D9488', icon: '💰' },
      ].map(s => (
        <div key={s.label} className="rounded-xl p-5" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{s.icon}</span>
            <p className="text-xs" style={{ color: '#6B7280' }}>{s.label}</p>
          </div>
          <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
          <p className="text-[10px] mt-1" style={{ color: '#4B5563' }}>{s.sub}</p>
        </div>
      ))}
    </div>
  )
}

function SLTNotes() {
  const [notes, setNotes] = useState<Note[]>(() => {
    try { return JSON.parse(localStorage.getItem('lumio_slt_notes') || '[]') } catch { return [] }
  })
  const [showNew, setShowNew] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')

  function saveNote() {
    if (!newTitle.trim()) return
    const note: Note = { id: crypto.randomUUID(), title: newTitle, content: newContent, date: new Date().toISOString(), author: localStorage.getItem('lumio_user_name') || 'SLT Member' }
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

function SLTMeetings() {
  return (
    <div className="rounded-xl p-8 text-center" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
      <Calendar size={32} style={{ color: TEAL, margin: '0 auto 12px', opacity: 0.5 }} />
      <p className="text-sm font-semibold mb-1" style={{ color: '#F9FAFB' }}>SLT Meetings</p>
      <p className="text-xs" style={{ color: '#6B7280' }}>Schedule and manage SLT meetings with agenda, minutes and action items.</p>
      <p className="text-xs mt-3" style={{ color: TEAL }}>Coming soon</p>
    </div>
  )
}

function SchoolImprovement() {
  return (
    <div className="rounded-xl p-8 text-center" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
      <Target size={32} style={{ color: TEAL, margin: '0 auto 12px', opacity: 0.5 }} />
      <p className="text-sm font-semibold mb-1" style={{ color: '#F9FAFB' }}>School Improvement Plan</p>
      <p className="text-xs" style={{ color: '#6B7280' }}>Track SIP items, Ofsted preparation and governor reporting.</p>
      <p className="text-xs mt-3" style={{ color: TEAL }}>Coming soon</p>
    </div>
  )
}

function StaffPerformance() {
  return (
    <div className="rounded-xl p-8 text-center" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
      <Shield size={32} style={{ color: TEAL, margin: '0 auto 12px', opacity: 0.5 }} />
      <p className="text-sm font-semibold mb-1" style={{ color: '#F9FAFB' }}>Staff Performance</p>
      <p className="text-xs" style={{ color: '#6B7280' }}>Confidential performance notes, CPD tracking and capability concerns. Headteacher only.</p>
      <p className="text-xs mt-3" style={{ color: TEAL }}>Coming soon</p>
    </div>
  )
}
