'use client'

import { useState, useEffect } from 'react'
import { ClipboardList, AlertTriangle, Clock, FolderKanban, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface PMData {
  provider: string
  connected: boolean
  open_tasks?: number
  overdue_tasks?: number
  overdue?: number
  overdue_cards?: number
  due_today?: number
  active_projects?: number
  active_boards?: number
  open_boards?: number
  my_cards?: number
  total_items?: number
  in_progress?: number
  spaces?: number
  recent_pages?: number
  databases_count?: number
}

const PM_PROVIDERS = [
  { key: 'asana', label: 'Asana', color: '#F06A6A', route: '/api/integrations/asana/snapshot' },
  { key: 'monday', label: 'Monday', color: '#6161FF', route: '/api/integrations/monday/snapshot' },
  { key: 'trello', label: 'Trello', color: '#0079BF', route: '/api/integrations/trello/snapshot' },
  { key: 'notion', label: 'Notion', color: '#FFFFFF', route: '/api/integrations/notion/snapshot' },
  { key: 'clickup', label: 'ClickUp', color: '#7B68EE', route: '/api/integrations/clickup/snapshot' },
]

export default function ProjectsSnapshot() {
  const [data, setData] = useState<PMData[]>([])
  const [loading, setLoading] = useState(true)
  const [connectedProviders, setConnectedProviders] = useState<string[]>([])

  useEffect(() => {
    const connected = PM_PROVIDERS.filter(p => typeof window !== 'undefined' && localStorage.getItem(`lumio_integration_${p.key}`) === 'true')
    setConnectedProviders(connected.map(p => p.key))

    if (!connected.length) { setLoading(false); return }

    const token = localStorage.getItem('workspace_session_token') || ''
    Promise.all(
      connected.map(p =>
        fetch(p.route, { headers: { 'x-workspace-token': token } })
          .then(r => r.ok ? r.json() : null)
          .catch(() => null)
      )
    ).then(results => {
      setData(results.filter(Boolean) as PMData[])
      setLoading(false)
    })
  }, [])

  if (!connectedProviders.length) {
    return (
      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList size={16} style={{ color: '#7B68EE' }} />
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Projects Snapshot</p>
        </div>
        <p className="text-xs" style={{ color: '#6B7280' }}>Connect Asana, Monday, Trello, Notion or ClickUp in Settings to see your project snapshot.</p>
      </div>
    )
  }

  const totals = data.reduce((acc, d) => ({
    openTasks: acc.openTasks + (d.open_tasks || d.my_cards || d.total_items || d.recent_pages || 0),
    overdue: acc.overdue + (d.overdue_tasks || d.overdue || d.overdue_cards || 0),
    dueToday: acc.dueToday + (d.due_today || 0),
    activeProjects: acc.activeProjects + (d.active_projects || d.active_boards || d.open_boards || d.spaces || d.databases_count || 0),
  }), { openTasks: 0, overdue: 0, dueToday: 0, activeProjects: 0 })

  const sources = data.map(d => PM_PROVIDERS.find(p => p.key === d.provider)).filter(Boolean)

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
        <div className="flex items-center gap-2">
          <ClipboardList size={16} style={{ color: '#7B68EE' }} />
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Projects Snapshot</p>
        </div>
        <div className="flex items-center gap-1.5">
          {sources.map(s => s && (
            <span key={s.key} className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${s.color}20`, color: s.color, border: `1px solid ${s.color}40` }}>
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="animate-pulse rounded-lg" style={{ backgroundColor: '#1F2937', height: 60 }} />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4">
            <StatTile icon={<ClipboardList size={14} />} label="Open Tasks" value={String(totals.openTasks)} color="#3B82F6" />
            <StatTile icon={<AlertTriangle size={14} />} label="Overdue" value={String(totals.overdue)} color={totals.overdue > 0 ? '#EF4444' : '#6B7280'} highlight={totals.overdue > 0} />
            <StatTile icon={<Clock size={14} />} label="Due Today" value={String(totals.dueToday)} color={totals.dueToday > 0 ? '#F59E0B' : '#6B7280'} highlight={totals.dueToday > 0} />
            <StatTile icon={<FolderKanban size={14} />} label="Active Projects" value={String(totals.activeProjects)} color="#22C55E" />
          </div>
          <div className="flex gap-2 px-4 pb-4">
            <Link href="/projects" className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(123,104,238,0.12)', color: '#7B68EE', border: '1px solid rgba(123,104,238,0.25)', textDecoration: 'none' }}>
              View Tasks <ArrowRight size={10} />
            </Link>
            <Link href="/projects" className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.25)', textDecoration: 'none' }}>
              View Overdue <ArrowRight size={10} />
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

function StatTile({ icon, label, value, color, highlight }: { icon: React.ReactNode; label: string; value: string; color: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: highlight ? `${color}08` : '#0A0B10', border: highlight ? `1px solid ${color}30` : '1px solid #1F2937' }}>
      <div className="flex items-center gap-1.5 mb-1" style={{ color }}>{icon}<span className="text-[11px]">{label}</span></div>
      <p className="text-lg font-black" style={{ color: '#F9FAFB' }}>{value}</p>
    </div>
  )
}
