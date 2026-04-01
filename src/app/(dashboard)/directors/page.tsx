'use client'

import { useState, useEffect } from 'react'
import { Crown, FileText, Calendar, Target, PartyPopper, Plus, Save, X, Loader2 } from 'lucide-react'
import { getClientRole } from '@/lib/check-role'

const GOLD = '#F1C40F'
const GOLD_BG = 'rgba(241,196,15,0.08)'
const GOLD_BORDER = 'rgba(241,196,15,0.2)'
const CARD = '#111318'
const BORDER = '#1F2937'

type Tab = 'overview' | 'notes' | 'meetings' | 'strategy' | 'events'

interface Note { id: string; title: string; content: string; date: string; author: string }

export default function DirectorsSuite() {
  const [tab, setTab] = useState<Tab>('overview')
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)

  useEffect(() => {
    const { role_level, isOwner } = getClientRole()
    setHasAccess(role_level <= 1 || isOwner)
  }, [])

  if (hasAccess === null) return null
  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Crown size={48} style={{ color: GOLD, marginBottom: 16 }} />
        <h2 className="text-xl font-bold mb-2" style={{ color: '#F9FAFB' }}>Directors Suite</h2>
        <p className="text-sm" style={{ color: '#6B7280' }}>This section is only available to Directors and the workspace owner.</p>
      </div>
    )
  }

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Board Overview', icon: Crown },
    { id: 'notes', label: 'Confidential Notes', icon: FileText },
    { id: 'meetings', label: 'Board Meetings', icon: Calendar },
    { id: 'strategy', label: 'Strategy', icon: Target },
    { id: 'events', label: 'Away Days & Events', icon: PartyPopper },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden" style={{ background: `linear-gradient(135deg, rgba(241,196,15,0.12), rgba(241,196,15,0.03))`, border: `1px solid ${GOLD_BORDER}` }}>
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 24 24' fill='none' stroke='%23F1C40F' stroke-width='0.5'%3E%3Cpath d='M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z'/%3E%3C/svg%3E")` }} />
        <div className="relative px-6 py-5">
          <div className="flex items-center gap-3">
            <Crown size={24} style={{ color: GOLD }} />
            <div>
              <h1 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Directors Suite</h1>
              <p className="text-xs" style={{ color: GOLD }}>Confidential — visible to directors only</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap" style={{
            backgroundColor: tab === t.id ? GOLD_BG : 'transparent',
            color: tab === t.id ? GOLD : '#6B7280',
            border: tab === t.id ? `1px solid ${GOLD_BORDER}` : '1px solid #1F2937',
          }}>
            <t.icon size={12} />{t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'overview' && <BoardOverview />}
      {tab === 'notes' && <ConfidentialNotes />}
      {tab === 'meetings' && <BoardMeetings />}
      {tab === 'strategy' && <StrategyTab />}
      {tab === 'events' && <AwayDays />}
    </div>
  )
}

function BoardOverview() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: 'Company Health', value: '--', sub: 'Connect integrations', color: '#22C55E' },
        { label: 'Pipeline Value', value: '--', sub: 'Connect CRM', color: '#8B5CF6' },
        { label: 'Headcount', value: '--', sub: 'Import staff', color: '#3B82F6' },
        { label: 'Revenue MTD', value: '--', sub: 'Connect finance', color: '#F59E0B' },
      ].map(s => (
        <div key={s.label} className="rounded-xl p-5" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
          <p className="text-xs mb-1" style={{ color: '#6B7280' }}>{s.label}</p>
          <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
          <p className="text-[10px] mt-1" style={{ color: '#4B5563' }}>{s.sub}</p>
        </div>
      ))}
    </div>
  )
}

function ConfidentialNotes() {
  const [notes, setNotes] = useState<Note[]>(() => {
    try { return JSON.parse(localStorage.getItem('lumio_director_notes') || '[]') } catch { return [] }
  })
  const [showNew, setShowNew] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')

  function saveNote() {
    if (!newTitle.trim()) return
    const note: Note = { id: crypto.randomUUID(), title: newTitle, content: newContent, date: new Date().toISOString(), author: localStorage.getItem('lumio_user_name') || 'Director' }
    const updated = [note, ...notes]
    setNotes(updated)
    localStorage.setItem('lumio_director_notes', JSON.stringify(updated))
    setShowNew(false); setNewTitle(''); setNewContent('')
  }

  function deleteNote(id: string) {
    const updated = notes.filter(n => n.id !== id)
    setNotes(updated)
    localStorage.setItem('lumio_director_notes', JSON.stringify(updated))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Confidential Notes</p>
        <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: GOLD_BG, color: GOLD, border: `1px solid ${GOLD_BORDER}` }}>
          <Plus size={12} /> New Note
        </button>
      </div>

      {showNew && (
        <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: CARD, border: `1px solid ${GOLD_BORDER}` }}>
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Note title" className="w-full text-sm rounded-lg px-3 py-2 outline-none" style={{ backgroundColor: '#0A0B10', border: `1px solid ${BORDER}`, color: '#F9FAFB' }} autoFocus />
          <textarea value={newContent} onChange={e => setNewContent(e.target.value)} rows={4} placeholder="Write your confidential note..." className="w-full text-sm rounded-lg px-3 py-2 outline-none resize-none" style={{ backgroundColor: '#0A0B10', border: `1px solid ${BORDER}`, color: '#F9FAFB' }} />
          <div className="flex gap-2">
            <button onClick={saveNote} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: GOLD, color: '#0A0B10' }}><Save size={12} /> Save</button>
            <button onClick={() => setShowNew(false)} className="px-3 py-2 rounded-lg text-xs" style={{ color: '#6B7280' }}>Cancel</button>
          </div>
        </div>
      )}

      {notes.length === 0 && !showNew && (
        <div className="rounded-xl p-8 text-center" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
          <FileText size={32} style={{ color: GOLD, margin: '0 auto 12px', opacity: 0.5 }} />
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
              <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: GOLD_BG, color: GOLD, border: `1px solid ${GOLD_BORDER}` }}>🔒 Confidential</span>
              <button onClick={() => deleteNote(n.id)} style={{ color: '#4B5563' }}><X size={14} /></button>
            </div>
          </div>
          <p className="text-xs whitespace-pre-wrap" style={{ color: '#9CA3AF' }}>{n.content}</p>
        </div>
      ))}
    </div>
  )
}

function BoardMeetings() {
  return (
    <div className="rounded-xl p-8 text-center" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
      <Calendar size={32} style={{ color: GOLD, margin: '0 auto 12px', opacity: 0.5 }} />
      <p className="text-sm font-semibold mb-1" style={{ color: '#F9FAFB' }}>Board Meetings</p>
      <p className="text-xs" style={{ color: '#6B7280' }}>Schedule and manage board meetings with agenda, minutes and action items.</p>
      <p className="text-xs mt-3" style={{ color: GOLD }}>Coming soon</p>
    </div>
  )
}

function StrategyTab() {
  return (
    <div className="rounded-xl p-8 text-center" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
      <Target size={32} style={{ color: GOLD, margin: '0 auto 12px', opacity: 0.5 }} />
      <p className="text-sm font-semibold mb-1" style={{ color: '#F9FAFB' }}>Strategy & OKRs</p>
      <p className="text-xs" style={{ color: '#6B7280' }}>Set strategic goals, track OKRs and manage confidential strategic documents.</p>
      <p className="text-xs mt-3" style={{ color: GOLD }}>Coming soon</p>
    </div>
  )
}

function AwayDays() {
  return (
    <div className="rounded-xl p-8 text-center" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
      <PartyPopper size={32} style={{ color: GOLD, margin: '0 auto 12px', opacity: 0.5 }} />
      <p className="text-sm font-semibold mb-1" style={{ color: '#F9FAFB' }}>Away Days & Events</p>
      <p className="text-xs" style={{ color: '#6B7280' }}>Plan company away days, off-sites and team events.</p>
      <p className="text-xs mt-3" style={{ color: GOLD }}>Coming soon</p>
    </div>
  )
}
