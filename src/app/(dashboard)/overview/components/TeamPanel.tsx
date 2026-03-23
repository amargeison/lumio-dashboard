'use client'

import { useState, useEffect } from 'react'

interface TeamMember {
  id: string
  name: string
  role: string
  department: string
  avatar: string
  status: 'active' | 'away' | 'holiday' | 'wfh' | 'sick'
  todayFocus?: string
  openTasks: number
  alerts: number
  recentActivity?: string
}

const STATUS_CONFIG = {
  active:  { dot: '#22C55E', label: 'Active',  color: '#4ADE80' },
  away:    { dot: '#F59E0B', label: 'Away',    color: '#FBBF24' },
  holiday: { dot: '#3B82F6', label: 'Holiday', color: '#60A5FA' },
  wfh:     { dot: '#A855F7', label: 'WFH',     color: '#C084FC' },
  sick:    { dot: '#EF4444', label: 'Sick',    color: '#F87171' },
}

const MOCK_TEAM: TeamMember[] = [
  { id: '1', name: 'Sarah Mitchell',   role: 'Head of HR',        department: 'HR',       avatar: 'SM', status: 'active',  todayFocus: 'New joiner onboarding × 2',          openTasks: 3, alerts: 0, recentActivity: 'HR-01 ran 9 min ago'      },
  { id: '2', name: 'Oliver Bennett',   role: 'Head of Sales',     department: 'Sales',    avatar: 'OB', status: 'active',  todayFocus: 'Demo calls × 2',                     openTasks: 5, alerts: 1, recentActivity: 'SA-02 scored 4 leads'     },
  { id: '3', name: 'Charlotte Davies', role: 'Senior AE',         department: 'Sales',    avatar: 'CD', status: 'wfh',     todayFocus: 'Oakridge Schools demo',              openTasks: 4, alerts: 0, recentActivity: 'Proposal sent via SA-06'  },
  { id: '4', name: 'George Harrison',  role: 'Head of Finance',   department: 'Finance',  avatar: 'GH', status: 'active',  todayFocus: 'Invoice review + payroll sign-off',  openTasks: 6, alerts: 2, recentActivity: 'AC-03 chased 3 invoices'  },
  { id: '5', name: 'Alexander Jones',  role: 'Head of IT',        department: 'IT',       avatar: 'AJ', status: 'active',  todayFocus: 'IT provisioning backlog',            openTasks: 2, alerts: 0, recentActivity: 'IT-01 provisioning complete' },
  { id: '6', name: 'Sophia Brown',     role: 'Head of Marketing', department: 'Marketing',avatar: 'SB', status: 'holiday', openTasks: 0, alerts: 0, recentActivity: 'Back Thursday' },
]

export default function TeamPanel() {
  const [team, setTeam] = useState<TeamMember[]>([])
  const [filter, setFilter] = useState<'all' | 'alerts' | 'away'>('all')

  useEffect(() => {
    fetch('/api/home/team')
      .then(r => r.json())
      .then(d => setTeam(d.team || MOCK_TEAM))
      .catch(() => setTeam(MOCK_TEAM))
  }, [])

  const filtered = team.filter(m =>
    filter === 'all' ? true :
    filter === 'alerts' ? m.alerts > 0 :
    m.status !== 'active'
  )
  const onHoliday  = team.filter(m => m.status === 'holiday' || m.status === 'sick').length
  const withAlerts = team.filter(m => m.alerts > 0).length

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2" style={{ color: '#F9FAFB' }}>👥 Team Today</h2>
          <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>
            {team.length} people · {onHoliday} out · {withAlerts} with alerts
          </p>
        </div>
        <div className="flex gap-2">
          {(['all', 'alerts', 'away'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 text-xs font-bold rounded-xl transition-colors"
              style={{
                backgroundColor: filter === f ? '#7C3AED' : 'rgba(255,255,255,0.05)',
                color: filter === f ? '#fff' : '#6B7280',
              }}>
              {f === 'all' ? 'All' : f === 'alerts' ? `Alerts (${withAlerts})` : `Out (${onHoliday})`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {filtered.map(member => {
          const sc = STATUS_CONFIG[member.status]
          return (
            <div key={member.id} className="rounded-2xl p-4 transition-all"
              style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="flex items-start gap-3">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                    style={{ backgroundColor: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)', color: '#C084FC' }}>
                    {member.avatar}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2"
                    style={{ backgroundColor: sc.dot, borderColor: '#111318' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm truncate" style={{ color: '#E5E7EB' }}>{member.name}</span>
                    {member.alerts > 0 && (
                      <span className="flex-shrink-0 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold"
                        style={{ backgroundColor: '#DC2626' }}>{member.alerts}</span>
                    )}
                  </div>
                  <p className="text-xs truncate" style={{ color: '#6B7280' }}>{member.role} · {member.department}</p>
                  <span className="text-xs font-medium" style={{ color: sc.color }}>{sc.label}</span>
                  {member.todayFocus && (
                    <p className="text-xs mt-1.5 leading-relaxed" style={{ color: '#6B7280' }}>
                      <span style={{ color: '#374151' }}>Today: </span>{member.todayFocus}
                    </p>
                  )}
                  {member.recentActivity && (
                    <p className="text-xs mt-1" style={{ color: 'rgba(192,132,252,0.6)' }}>⚡ {member.recentActivity}</p>
                  )}
                </div>
                {member.openTasks > 0 && (
                  <div className="flex-shrink-0 text-center">
                    <div className="text-lg font-black" style={{ color: '#9CA3AF' }}>{member.openTasks}</div>
                    <div className="text-xs" style={{ color: '#374151' }}>tasks</div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
