'use client'

import { useState, useEffect } from 'react'
import { X, Mail, Calendar, ExternalLink, Search } from 'lucide-react'

interface TeamMember {
  id: string; name: string; role: string; department: string; avatar: string
  status: 'active' | 'away' | 'holiday' | 'wfh' | 'sick'
  todayFocus?: string; openTasks: number; alerts: number; recentActivity?: string
  relationship: string; email: string; managerId?: string; level: number
}

const SC = {
  active:  { dot: '#22C55E', label: 'Active',  color: '#4ADE80' },
  away:    { dot: '#F59E0B', label: 'Away',    color: '#FBBF24' },
  holiday: { dot: '#3B82F6', label: 'Holiday', color: '#60A5FA' },
  wfh:     { dot: '#A855F7', label: 'WFH',     color: '#C084FC' },
  sick:    { dot: '#EF4444', label: 'Sick',    color: '#F87171' },
}

const DEPT_COLORS: Record<string, string> = { Executive: '#0D9488', Sales: '#8B5CF6', Marketing: '#F59E0B', Finance: '#3B82F6', HR: '#22C55E', IT: '#EF4444' }

const TEAM: TeamMember[] = [
  { id: '0', name: 'James Hartley', role: 'CEO & Founder', department: 'Executive', avatar: 'JH', status: 'active', todayFocus: 'Board prep, investor call at 2pm', openTasks: 4, alerts: 0, recentActivity: 'Reviewed Q1 financials', relationship: 'You', email: 'james@lumiodemo.com', level: 1 },
  { id: '1', name: 'Sarah Mitchell', role: 'Head of HR', department: 'HR', avatar: 'SM', status: 'active', todayFocus: 'New joiner onboarding × 2', openTasks: 3, alerts: 0, recentActivity: 'HR-01 ran 9 min ago', relationship: 'Direct report', email: 'sarah@lumiocms.com', managerId: '0', level: 2 },
  { id: '2', name: 'Oliver Bennett', role: 'Head of Sales', department: 'Sales', avatar: 'OB', status: 'active', todayFocus: 'Demo calls × 2', openTasks: 5, alerts: 1, recentActivity: 'SA-02 scored 4 leads', relationship: 'Direct report', email: 'oliver@lumiocms.com', managerId: '0', level: 2 },
  { id: '3', name: 'George Harrison', role: 'Head of Finance', department: 'Finance', avatar: 'GH', status: 'active', todayFocus: 'Invoice review + payroll', openTasks: 6, alerts: 2, recentActivity: 'AC-03 chased 3 invoices', relationship: 'Direct report', email: 'george@lumiocms.com', managerId: '0', level: 2 },
  { id: '4', name: 'Alexander Jones', role: 'Head of IT', department: 'IT', avatar: 'AJ', status: 'active', todayFocus: 'IT provisioning backlog', openTasks: 2, alerts: 0, recentActivity: 'IT-01 complete', relationship: 'Direct report', email: 'alex@lumiocms.com', managerId: '0', level: 2 },
  { id: '5', name: 'Charlotte Davies', role: 'Senior AE', department: 'Sales', avatar: 'CD', status: 'wfh', todayFocus: 'Oakridge Schools demo', openTasks: 4, alerts: 0, recentActivity: 'Proposal sent', relationship: 'Same department', email: 'charlotte@lumiocms.com', managerId: '2', level: 3 },
  { id: '6', name: 'James Okafor', role: 'Sales Dev Rep', department: 'Sales', avatar: 'JO', status: 'active', todayFocus: 'Cold outreach sequence', openTasks: 3, alerts: 0, recentActivity: '8 calls made', relationship: 'Same department', email: 'james@lumiocms.com', managerId: '2', level: 3 },
  { id: '7', name: 'Sophia Brown', role: 'Head of Marketing', department: 'Marketing', avatar: 'SB', status: 'holiday', openTasks: 0, alerts: 0, recentActivity: 'Back Thursday', relationship: 'Other department', email: 'sophia@lumiocms.com', managerId: '0', level: 2 },
  { id: '8', name: 'Tom Ashworth', role: 'Content Lead', department: 'Marketing', avatar: 'TA', status: 'active', todayFocus: 'Blog post + social calendar', openTasks: 2, alerts: 0, recentActivity: 'Published blog post', relationship: 'Other department', email: 'tom@lumiocms.com', managerId: '7', level: 3 },
  { id: '9', name: 'Priya Kapoor', role: 'HR Coordinator', department: 'HR', avatar: 'PK', status: 'active', todayFocus: 'Contract templates', openTasks: 1, alerts: 0, recentActivity: 'Updated handbook', relationship: 'Same department', email: 'priya@lumiocms.com', managerId: '1', level: 3 },
]

const POLICIES = [
  { icon: '📋', title: 'Staff Handbook', desc: 'Employment policies, conduct, benefits', content: 'This Staff Handbook sets out the policies and procedures for all employees. It covers employment terms, code of conduct, disciplinary procedures, grievance processes and employee benefits. All staff are expected to familiarise themselves with this document within their first week.\n\nKey points:\n• Standard working hours: 9am-5:30pm, flexible start between 8-10am\n• Annual leave: 25 days + bank holidays\n• Probation period: 3 months for all new starters\n• Notice period: 1 month (3 months for senior roles)\n\nLast updated: January 2026' },
  { icon: '🏖️', title: 'Leave & Holiday Policy', desc: 'Annual leave, booking, blackout dates', content: 'Annual leave allowance is 25 days per year plus 8 bank holidays. Leave must be booked at least 2 weeks in advance for periods over 3 days. Maximum 2 consecutive weeks. December 20-31 is a blackout period — no leave unless pre-approved by CEO.\n\nCarry over: up to 5 days may be carried to the next year.\nBuy/sell: you may buy up to 3 additional days or sell up to 3 days.\n\nLast updated: March 2026' },
  { icon: '🏥', title: 'Health & Wellbeing', desc: 'Mental health, EAP, sick leave', content: 'We provide an Employee Assistance Programme (EAP) through Health Assured, available 24/7. All employees have access to 6 free counselling sessions per year. Mental health first aiders: Sarah Mitchell, Priya Kapoor.\n\nSick leave: statutory sick pay from day 4. Enhanced: full pay for first 10 days, half pay for days 11-20.\n\nLast updated: February 2026' },
  { icon: '🔒', title: 'Data & Security', desc: 'GDPR, data handling, passwords', content: 'All company data must be handled in accordance with UK GDPR. Personal data is stored in UK data centres only. Passwords must be minimum 12 characters. Two-factor authentication is mandatory for all systems.\n\nData breach reporting: notify IT immediately, then DPO within 2 hours.\nDPO: Alexander Jones (alex@lumiocms.com)\n\nLast updated: January 2026' },
  { icon: '💰', title: 'Expenses Policy', desc: 'Claims, limits, deadlines', content: 'Expenses must be submitted within 30 days of being incurred. Receipts required for all claims over £10. Approval: line manager for claims under £200, Finance for £200+.\n\nLimits: meals £25pp, hotels £150/night (London £200), mileage 45p/mile.\nPayment: processed in next payroll cycle after approval.\n\nLast updated: March 2026' },
  { icon: '🎓', title: 'Learning & Development', desc: 'Training budget, study leave', content: 'Each employee has a £1,000 annual L&D budget. This can be used for courses, conferences, books or certifications. Study leave: up to 5 days per year for approved qualifications.\n\nRequest process: discuss with manager → submit L&D form → Finance approval.\n\nLast updated: January 2026' },
]

const BIRTHDAYS = [
  { name: 'James Okafor', event: 'Birthday', date: '4 Apr', emoji: '🎂' },
  { name: 'Charlotte Davies', event: '2 year anniversary', date: '7 Apr', emoji: '🎉' },
  { name: 'Tom Ashworth', event: 'Birthday', date: '18 Apr', emoji: '🎂' },
]

const EMPLOYEE_CARDS = [
  { name: 'James Hartley', role: 'CEO', overall: 97, color: '#7C3AED', avatar: 'JH', stats: { PAC: 86, SHO: 96, PAS: 62, DRI: 99, DEF: 99, PHY: 61 } },
  { name: 'Sophie Brennan', role: 'Marketing Director', overall: 94, color: '#EC4899', avatar: 'SB', stats: { PAC: 66, SHO: 92, PAS: 90, DRI: 71, DEF: 95, PHY: 65 } },
  { name: 'Marcus Webb', role: 'Sales Director', overall: 98, color: '#0D9488', avatar: 'MW', stats: { PAC: 95, SHO: 99, PAS: 88, DRI: 94, DEF: 72, PHY: 78 } },
  { name: 'Rachel Osei', role: 'Operations Manager', overall: 79, color: '#F59E0B', avatar: 'RO', stats: { PAC: 71, SHO: 68, PAS: 74, DRI: 65, DEF: 88, PHY: 82 } },
  { name: 'Tom Fielding', role: 'Support Lead', overall: 85, color: '#6D28D9', avatar: 'TF', stats: { PAC: 78, SHO: 72, PAS: 91, DRI: 69, DEF: 83, PHY: 77 } },
  { name: 'Claire Donovan', role: 'IT Director', overall: 93, color: '#0EA5E9', avatar: 'CD', stats: { PAC: 60, SHO: 70, PAS: 76, DRI: 71, DEF: 95, PHY: 65 } },
]

type SubTab = 'today' | 'orgchart' | 'company' | 'cards'

export default function TeamPanel({ selectedDepts }: { selectedDepts?: string[] } = {}) {
  const [team, setTeam] = useState<TeamMember[]>(TEAM)
  const [filter, setFilter] = useState<string>('all')
  const [subTab, setSubTab] = useState<SubTab>('today')
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [selectedPolicy, setSelectedPolicy] = useState<typeof POLICIES[0] | null>(null)
  const [lastSynced, setLastSynced] = useState<string>('')

  // Auto-sync directory on load + tab focus + 4hr interval
  useEffect(() => {
    function syncDirectory() {
      // In production this would call /api/directory/sync
      setLastSynced(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))
    }
    syncDirectory()
    const interval = setInterval(syncDirectory, 4 * 60 * 60 * 1000)
    function onVisibility() { if (!document.hidden) syncDirectory() }
    document.addEventListener('visibilitychange', onVisibility)
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', onVisibility) }
  }, [])

  // Map selected department IDs to display names for filtering
  const deptNameMap: Record<string, string[]> = {
    hr: ['HR'], sales: ['Sales'], marketing: ['Marketing'], accounts: ['Finance'],
    it: ['IT'], operations: ['Operations'], support: ['Support'], success: ['Success'],
    crm: ['Sales', 'CRM'], overview: ['Executive'], insights: ['Data'],
  }
  const activeDeptNames = selectedDepts?.length
    ? [...new Set(selectedDepts.flatMap(d => deptNameMap[d] || [])), 'Executive']
    : null

  const filtered = team.filter(m => {
    // First apply department filter from onboarding
    if (activeDeptNames && !activeDeptNames.includes(m.department)) return false
    if (filter === 'all') return true
    if (filter === 'alerts') return m.alerts > 0
    if (filter === 'away') return m.status !== 'active' && m.status !== 'wfh'
    if (filter === 'myteam') return m.relationship === 'Direct report' || m.relationship === 'You'
    if (filter === 'executive') return m.department === 'Executive' || m.level <= 2
    return m.department === filter
  })

  return (
    <div className="max-w-5xl space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-2">
        {[{ id: 'today' as SubTab, label: '👥 Team Today' }, { id: 'orgchart' as SubTab, label: '🏢 Org Chart' }, { id: 'cards' as SubTab, label: '🃏 Team Info' }, { id: 'company' as SubTab, label: '📋 Company Info' }].map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)} className="px-4 py-2 rounded-xl text-xs font-semibold" style={{ backgroundColor: subTab === t.id ? '#7C3AED' : '#111318', color: subTab === t.id ? '#F9FAFB' : '#6B7280', border: subTab === t.id ? 'none' : '1px solid #1F2937' }}>{t.label}</button>
        ))}
      </div>

      {/* ═══ TEAM TODAY ═══ */}
      {subTab === 'today' && <>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div><h2 className="text-xl font-black" style={{ color: '#F9FAFB' }}>Team Today</h2><p className="text-xs" style={{ color: '#6B7280' }}>{filtered.length} people{activeDeptNames ? ` (filtered by ${selectedDepts?.length} departments)` : ''} · {team.filter(m => m.status === 'holiday' || m.status === 'sick').length} out · {team.filter(m => m.alerts > 0).length} with alerts</p></div>
          <div className="flex gap-1 flex-wrap items-center">
            {lastSynced && <span className="text-[10px] mr-2" style={{ color: '#374151' }}>Last synced {lastSynced}</span>}
            {['all', 'alerts', 'away', 'myteam', 'executive'].map(f => (
              <button key={f} onClick={() => setFilter(f)} className="px-3 py-1.5 text-xs font-bold rounded-xl" style={{ backgroundColor: filter === f ? '#7C3AED' : 'rgba(255,255,255,0.05)', color: filter === f ? '#fff' : '#6B7280' }}>
                {f === 'all' ? 'All' : f === 'alerts' ? 'Alerts' : f === 'away' ? 'Out' : f === 'myteam' ? 'My Team' : 'Executive'}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map(m => {
            const sc = SC[m.status]
            return (
              <div key={m.id} onClick={() => setSelectedMember(m)} className="rounded-2xl p-4 cursor-pointer transition-all hover:border-[#374151]" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ backgroundColor: `${DEPT_COLORS[m.department] || '#6B7280'}20`, color: DEPT_COLORS[m.department] || '#6B7280' }}>{m.avatar}</div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2" style={{ backgroundColor: sc.dot, borderColor: '#111318' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><span className="font-bold text-sm truncate" style={{ color: '#E5E7EB' }}>{m.name}</span>{m.alerts > 0 && <span className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ backgroundColor: '#DC2626' }}>{m.alerts}</span>}</div>
                    <p className="text-xs truncate" style={{ color: '#6B7280' }}>{m.role} · {m.department}</p>
                    <div className="flex gap-1 mt-1"><span className="text-xs font-medium" style={{ color: sc.color }}>{sc.label}</span><span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#1F2937', color: '#6B7280' }}>{m.relationship}</span></div>
                    {m.todayFocus && <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Today: {m.todayFocus}</p>}
                  </div>
                  {m.openTasks > 0 && <div className="text-center shrink-0"><div className="text-lg font-black" style={{ color: '#9CA3AF' }}>{m.openTasks}</div><div className="text-[10px]" style={{ color: '#374151' }}>tasks</div></div>}
                </div>
              </div>
            )
          })}
        </div>
      </>}

      {/* ═══ ORG CHART ═══ */}
      {subTab === 'orgchart' && (
        <div>
          <h2 className="text-xl font-black mb-6" style={{ color: '#F9FAFB' }}>Organisation Chart</h2>
          {/* CEO */}
          <div className="flex justify-center mb-8">
            <div onClick={() => setSelectedMember(TEAM[0])} className="rounded-xl p-4 text-center cursor-pointer w-48" style={{ backgroundColor: '#111318', border: '2px solid #0D9488' }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm mx-auto mb-2" style={{ backgroundColor: 'rgba(13,148,136,0.2)', color: '#0D9488' }}>AM</div>
              <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>James Hartley</p>
              <p className="text-[10px]" style={{ color: '#0D9488' }}>CEO & Founder</p>
            </div>
          </div>
          {/* Connecting line */}
          <div className="flex justify-center mb-2"><div className="w-px h-8" style={{ backgroundColor: '#374151' }} /></div>
          <div className="flex justify-center mb-2"><div className="h-px" style={{ backgroundColor: '#374151', width: '80%' }} /></div>
          {/* Level 2 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            {TEAM.filter(m => m.level === 2).map(m => (
              <div key={m.id} className="flex flex-col items-center">
                <div className="w-px h-6 mb-2" style={{ backgroundColor: '#374151' }} />
                <div onClick={() => setSelectedMember(m)} className="rounded-xl p-3 text-center cursor-pointer w-full" style={{ backgroundColor: '#111318', border: `1px solid ${DEPT_COLORS[m.department] || '#1F2937'}` }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs mx-auto mb-1" style={{ backgroundColor: `${DEPT_COLORS[m.department] || '#6B7280'}20`, color: DEPT_COLORS[m.department] || '#6B7280' }}>{m.avatar}</div>
                  <p className="text-xs font-bold truncate" style={{ color: '#F9FAFB' }}>{m.name}</p>
                  <p className="text-[10px] truncate" style={{ color: '#6B7280' }}>{m.role}</p>
                  <span className="text-[10px]" style={{ color: SC[m.status].color }}>{SC[m.status].label}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Level 3 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pl-8">
            {TEAM.filter(m => m.level === 3).map(m => {
              const manager = TEAM.find(t => t.id === m.managerId)
              return (
                <div key={m.id} onClick={() => setSelectedMember(m)} className="rounded-xl p-3 text-center cursor-pointer" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] mx-auto mb-1" style={{ backgroundColor: `${DEPT_COLORS[m.department] || '#6B7280'}15`, color: DEPT_COLORS[m.department] || '#6B7280' }}>{m.avatar}</div>
                  <p className="text-xs font-medium truncate" style={{ color: '#D1D5DB' }}>{m.name}</p>
                  <p className="text-[10px] truncate" style={{ color: '#6B7280' }}>{m.role}</p>
                  {manager && <p className="text-[10px]" style={{ color: '#374151' }}>→ {manager.name.split(' ')[0]}</p>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ═══ TEAM INFO (FIFA CARDS) ═══ */}
      {subTab === 'cards' && (
        <div className="space-y-4">
          <h2 className="text-xl font-black" style={{ color: '#F9FAFB' }}>Team Info</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {EMPLOYEE_CARDS.map(card => (
              <div key={card.name} className="rounded-2xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${card.color}20 0%, #111318 60%)`, border: `1px solid ${card.color}40` }}>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-3xl font-black" style={{ color: card.color }}>{card.overall}</p>
                      <p className="text-[10px] font-semibold uppercase" style={{ color: '#6B7280' }}>Overall</p>
                    </div>
                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold" style={{ backgroundColor: card.color + '25', color: card.color, border: `2px solid ${card.color}50` }}>{card.avatar}</div>
                  </div>
                  <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{card.name}</p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>{card.role}</p>
                </div>
                <div className="grid grid-cols-6 gap-px mx-4 mb-3" style={{ backgroundColor: '#1F2937', borderRadius: 8, overflow: 'hidden' }}>
                  {Object.entries(card.stats).map(([key, val]) => (
                    <div key={key} className="flex flex-col items-center py-2" style={{ backgroundColor: '#0A0B10' }}>
                      <span className="text-[10px] font-bold" style={{ color: val >= 90 ? '#22C55E' : val >= 75 ? '#F59E0B' : '#9CA3AF' }}>{val}</span>
                      <span className="text-[8px] font-semibold" style={{ color: '#4B5563' }}>{key}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 px-4 pb-4">
                  <button className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-center" style={{ backgroundColor: card.color + '20', color: card.color, border: `1px solid ${card.color}40` }}>Message</button>
                  <button className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-center" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>Profile</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ COMPANY INFO ═══ */}
      {subTab === 'company' && (
        <div className="space-y-6">
          <h2 className="text-xl font-black" style={{ color: '#F9FAFB' }}>Company Info</h2>

          {/* Policies */}
          <div>
            <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Company Documents</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {POLICIES.map(p => (
                <div key={p.title} onClick={() => setSelectedPolicy(p)} className="rounded-xl p-4 cursor-pointer transition-all hover:border-[#374151]" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <span className="text-2xl block mb-2">{p.icon}</span>
                  <p className="text-xs font-bold" style={{ color: '#F9FAFB' }}>{p.title}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: '#6B7280' }}>{p.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Company Details + Key Contacts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Company Details</p>
              {[['Founded', '2021'], ['Industry', 'SaaS / Technology'], ['Size', '10-50 employees'], ['HQ', 'London, UK'], ['Website', 'lumiocms.com']].map(([l, v]) => (
                <div key={l} className="flex justify-between py-1"><span className="text-xs" style={{ color: '#6B7280' }}>{l}</span><span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{v}</span></div>
              ))}
            </div>
            <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Key Contacts</p>
              {[['CEO', 'James Hartley'], ['HR', 'Sarah Mitchell'], ['IT Support', 'Alexander Jones'], ['Finance', 'George Harrison']].map(([r, n]) => (
                <div key={r} className="flex justify-between py-1"><span className="text-xs" style={{ color: '#6B7280' }}>{r}</span><span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{n}</span></div>
              ))}
            </div>
          </div>

          {/* Useful Links */}
          <div>
            <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Useful Links</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {['Slack workspace', 'Google Drive', 'HR system', 'Payroll portal', 'Benefits portal', 'IT helpdesk', 'Company calendar', 'Training platform'].map(l => (
                <div key={l} className="flex items-center gap-2 rounded-lg p-3 cursor-pointer" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <ExternalLink size={12} style={{ color: '#6B7280' }} />
                  <span className="text-xs" style={{ color: '#9CA3AF' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Birthdays */}
          <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Birthdays & Anniversaries This Month</p>
            {BIRTHDAYS.map(b => <p key={b.name} className="text-xs py-1" style={{ color: '#D1D5DB' }}>{b.emoji} {b.name} — {b.event} {b.date}</p>)}
          </div>
        </div>
      )}

      {/* ═══ Member Profile Modal ═══ */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedMember(null)}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: `${DEPT_COLORS[selectedMember.department] || '#6B7280'}20`, color: DEPT_COLORS[selectedMember.department] || '#6B7280' }}>{selectedMember.avatar}</div>
                <div><p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{selectedMember.name}</p><p className="text-xs" style={{ color: '#6B7280' }}>{selectedMember.role} · {selectedMember.department}</p></div>
              </div>
              <button onClick={() => setSelectedMember(null)} style={{ color: '#6B7280' }}><X size={18} /></button>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2"><span className="text-xs" style={{ color: SC[selectedMember.status].color }}>{SC[selectedMember.status].label}</span><span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#1F2937', color: '#6B7280' }}>{selectedMember.relationship}</span></div>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>📧 {selectedMember.email}</p>
              {selectedMember.todayFocus && <p className="text-xs" style={{ color: '#9CA3AF' }}>📌 {selectedMember.todayFocus}</p>}
              {selectedMember.recentActivity && <p className="text-xs" style={{ color: '#A78BFA' }}>⚡ {selectedMember.recentActivity}</p>}
            </div>
            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}><Mail size={12} /> Message</button>
              <button className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}><Calendar size={12} /> Book meeting</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Policy Modal ═══ */}
      {selectedPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedPolicy(null)}>
          <div className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl p-6" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><span className="text-2xl">{selectedPolicy.icon}</span><p className="text-lg font-bold" style={{ color: '#F9FAFB' }}>{selectedPolicy.title}</p></div>
              <button onClick={() => setSelectedPolicy(null)} style={{ color: '#6B7280' }}><X size={18} /></button>
            </div>
            <div className="text-sm whitespace-pre-line" style={{ color: '#D1D5DB', lineHeight: 1.8 }}>{selectedPolicy.content}</div>
          </div>
        </div>
      )}
    </div>
  )
}
