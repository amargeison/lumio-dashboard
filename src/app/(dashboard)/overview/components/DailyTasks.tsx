'use client'

import { useState, useEffect } from 'react'

interface Task {
  id: string
  title: string
  description?: string
  due: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  category: string
  source: 'notion' | 'lumio' | 'manual' | 'workflow'
  assignee?: string
  done: boolean
  overdue: boolean
  linkedWorkflow?: string
}

const PRIORITY_STYLES = {
  critical: { dot: '#EF4444', bg: 'rgba(239,68,68,0.12)',   color: '#F87171', label: 'Critical' },
  high:     { dot: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  color: '#FBBF24', label: 'High'     },
  medium:   { dot: '#3B82F6', bg: 'rgba(59,130,246,0.12)',  color: '#60A5FA', label: 'Medium'   },
  low:      { dot: '#6B7280', bg: 'rgba(107,114,128,0.12)', color: '#9CA3AF', label: 'Low'      },
}

const SOURCE_ICON = { notion: '📋', lumio: '⚡', manual: '✏️', workflow: '🔄' }

const MOCK_TASKS: Task[] = [
  { id: '1', title: 'Follow up with Oakridge Academy', description: 'Demo was 3 days ago. No response. Deal worth £8,400 at risk.', due: '10:00', priority: 'critical', category: 'Sales', source: 'lumio', done: false, overdue: false },
  { id: '2', title: 'Sign off Q4 budget proposal', description: 'CFO submitted Friday. Board meeting Thursday requires approval.', due: '12:00', priority: 'high', category: 'Leadership', source: 'lumio', done: false, overdue: false },
  { id: '3', title: 'Approve 2 holiday requests', description: 'Both staff flagged as awaiting manager approval for over 48hrs.', due: '14:00', priority: 'medium', category: 'HR', source: 'workflow', linkedWorkflow: 'HR-07', done: false, overdue: false },
  { id: '4', title: 'Review campaign performance report', description: 'October campaign ended. Results ready to review and share with board.', due: '16:00', priority: 'medium', category: 'Marketing', source: 'lumio', done: false, overdue: false },
  { id: '5', title: '5 support tickets unassigned', description: 'Sitting in queue over 4 hours. SLA breach risk.', due: '11:00', priority: 'high', category: 'Support', source: 'lumio', done: false, overdue: true },
]

type Filter = 'all' | 'critical' | 'high' | 'medium' | 'low'

export default function DailyTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('business_tasks_checked')
      return saved ? JSON.parse(saved) : {}
    } catch { return {} }
  })

  useEffect(() => {
    try {
      localStorage.setItem('business_tasks_checked', JSON.stringify(checked))
    } catch { /* */ }
  }, [checked])

  useEffect(() => {
    const token = localStorage.getItem('workspace_session_token')
    fetch('/api/home/tasks', {
      headers: token ? { 'x-workspace-token': token } : {},
    })
      .then(r => r.json())
      .then(d => {
        const loaded = d.tasks || MOCK_TASKS
        setTasks(loaded.map((t: Task) => ({ ...t, done: !!checked[t.id] })))
      })
      .catch(() => setTasks(MOCK_TASKS.map(t => ({ ...t, done: !!checked[t.id] }))))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggle = (id: string) => {
    setChecked(prev => ({ ...prev, [id]: !prev[id] }))
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }
  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.priority === filter)
  const counts = {
    all: tasks.length,
    critical: tasks.filter(t => t.priority === 'critical').length,
    high: tasks.filter(t => t.priority === 'high').length,
    medium: tasks.filter(t => t.priority === 'medium').length,
    low: tasks.filter(t => t.priority === 'low').length,
  }
  const doneCount = tasks.filter(t => t.done).length

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2" style={{ color: '#F9FAFB' }}>✅ Daily Tasks</h2>
          <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>
            {doneCount}/{tasks.length} done · pulled from Notion, Lumio workflows, and manual entries
          </p>
        </div>
        <button className="px-4 py-2 text-sm font-bold rounded-xl transition-colors"
          style={{ backgroundColor: 'rgba(124,58,237,0.15)', color: '#A78BFA' }}>
          + Add task
        </button>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {(['all', 'critical', 'high', 'medium', 'low'] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
            style={{
              backgroundColor: filter === f ? '#7C3AED' : 'rgba(255,255,255,0.05)',
              color: filter === f ? '#fff' : '#6B7280',
            }}>
            {f === 'all' ? `All (${counts.all})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${counts[f]})`}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(task => {
          const p = PRIORITY_STYLES[task.priority]
          return (
            <div key={task.id} className="rounded-xl p-4 flex items-start gap-4 transition-all"
              style={{
                backgroundColor: '#111318',
                border: `1px solid ${task.done ? '#1F2937' : task.overdue ? 'rgba(239,68,68,0.3)' : '#1F2937'}`,
                opacity: task.done ? 0.5 : 1,
              }}>
              <button onClick={() => toggle(task.id)}
                className="w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all"
                style={{
                  backgroundColor: task.done ? '#16A34A' : 'transparent',
                  borderColor: task.done ? '#16A34A' : '#4B5563',
                }}>
                {task.done && <span className="text-white text-xs">✓</span>}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.dot }} />
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: p.bg, color: p.color }}>{p.label}</span>
                  <span className="text-xs" style={{ color: '#6B7280' }}>{task.category}</span>
                  <span className="text-xs" style={{ color: '#374151' }}>{SOURCE_ICON[task.source]} {task.source}</span>
                </div>
                <h4 className="font-semibold text-sm" style={{
                  color: task.done ? '#4B5563' : '#E5E7EB',
                  textDecoration: task.done ? 'line-through' : 'none',
                }}>{task.title}</h4>
                {task.description && !task.done && (
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: '#6B7280' }}>{task.description}</p>
                )}
                {task.linkedWorkflow && (
                  <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded"
                    style={{ backgroundColor: 'rgba(124,58,237,0.1)', color: '#A78BFA' }}>
                    🔄 {task.linkedWorkflow}
                  </span>
                )}
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-xs font-bold" style={{ color: task.overdue ? '#F87171' : '#6B7280' }}>
                  {task.overdue ? '⚠️ Overdue' : task.due}
                </div>
                {task.assignee && <div className="text-xs mt-0.5" style={{ color: '#374151' }}>{task.assignee}</div>}
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12" style={{ color: '#6B7280' }}>
          <div className="text-4xl mb-2">✅</div>
          <p>No {filter === 'all' ? '' : filter} tasks today</p>
        </div>
      )}
    </div>
  )
}
