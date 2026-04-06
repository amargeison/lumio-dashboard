'use client'

import { useState, useEffect } from 'react'
import { X, Mail, Calendar, ExternalLink, Search } from 'lucide-react'
import { EmployeeProfileCard, getGridCols, type StaffRecord } from '@/components/team/EmployeeProfileCard'
import { getDemoAvatar } from '@/components/team/avatars'

// Renders an illustrated SVG for known demo staff names, or falls back to
// the original initials circle. Used for the small list / org-chart avatars.
// The "You" card (id '0') always falls back to the initials version so we
// don't override the real user's identity.
function MemberAvatar({ member, size, fontSize, deptColor }: {
  member: TeamMember
  size: number
  fontSize: string
  deptColor: string
}) {
  const SvgComp = member.id === '0' ? null : getDemoAvatar(member.name)
  if (SvgComp) {
    return (
      <div className="rounded-full overflow-hidden" style={{ width: size, height: size }}>
        <SvgComp size={size} />
      </div>
    )
  }
  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold ${fontSize}`}
      style={{ width: size, height: size, backgroundColor: `${deptColor}20`, color: deptColor }}
    >
      {member.avatar}
    </div>
  )
}

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
  { id: '1', name: 'Sophie Brennan', role: 'Head of HR', department: 'HR', avatar: 'SB', status: 'active', todayFocus: 'New joiner onboarding × 2', openTasks: 3, alerts: 0, recentActivity: 'HR-01 ran 9 min ago', relationship: 'Direct report', email: 'sophie@company.com', managerId: '0', level: 2 },
  { id: '2', name: 'Marcus Webb', role: 'Head of Sales', department: 'Sales', avatar: 'MW', status: 'active', todayFocus: 'Demo calls × 2', openTasks: 5, alerts: 1, recentActivity: 'SA-02 scored 4 leads', relationship: 'Direct report', email: 'marcus@company.com', managerId: '0', level: 2 },
  { id: '3', name: 'Tom Fielding', role: 'Head of Finance', department: 'Finance', avatar: 'TF', status: 'active', todayFocus: 'Invoice review + payroll', openTasks: 6, alerts: 2, recentActivity: 'AC-03 chased 3 invoices', relationship: 'Direct report', email: 'tom@company.com', managerId: '0', level: 2 },
  { id: '4', name: 'Claire Donovan', role: 'Head of IT', department: 'IT', avatar: 'CD', status: 'active', todayFocus: 'IT provisioning backlog', openTasks: 2, alerts: 0, recentActivity: 'IT-01 complete', relationship: 'Direct report', email: 'claire@company.com', managerId: '0', level: 2 },
  { id: '5', name: 'Rachel Osei', role: 'Senior AE', department: 'Sales', avatar: 'RO', status: 'wfh', todayFocus: 'Client demo prep', openTasks: 4, alerts: 0, recentActivity: 'Proposal sent', relationship: 'Same department', email: 'rachel@company.com', managerId: '2', level: 3 },
  { id: '6', name: 'Ben Holloway', role: 'Sales Dev Rep', department: 'Sales', avatar: 'BH', status: 'active', todayFocus: 'Cold outreach sequence', openTasks: 3, alerts: 0, recentActivity: '8 calls made', relationship: 'Same department', email: 'ben@company.com', managerId: '2', level: 3 },
  { id: '7', name: 'Leah Thornton', role: 'Head of Marketing', department: 'Marketing', avatar: 'LT', status: 'holiday', openTasks: 0, alerts: 0, recentActivity: 'Back Thursday', relationship: 'Other department', email: 'leah@company.com', managerId: '0', level: 2 },
  { id: '8', name: 'Nate Crawford', role: 'Content Lead', department: 'Marketing', avatar: 'NC', status: 'active', todayFocus: 'Blog post + social calendar', openTasks: 2, alerts: 0, recentActivity: 'Published blog post', relationship: 'Other department', email: 'nate@company.com', managerId: '7', level: 3 },
  { id: '9', name: 'Anya Kapoor', role: 'HR Coordinator', department: 'HR', avatar: 'AK', status: 'active', todayFocus: 'Contract templates', openTasks: 1, alerts: 0, recentActivity: 'Updated handbook', relationship: 'Same department', email: 'anya@company.com', managerId: '1', level: 3 },
]

const POLICIES = [
  { icon: '📋', title: 'Staff Handbook', desc: 'Employment policies, conduct, benefits', content: 'This Staff Handbook sets out the policies and procedures for all employees. It covers employment terms, code of conduct, disciplinary procedures, grievance processes and employee benefits. All staff are expected to familiarise themselves with this document within their first week.\n\nKey points:\n• Standard working hours: 9am-5:30pm, flexible start between 8-10am\n• Annual leave: 25 days + bank holidays\n• Probation period: 3 months for all new starters\n• Notice period: 1 month (3 months for senior roles)\n\nLast updated: January 2026' },
  { icon: '🏖️', title: 'Leave & Holiday Policy', desc: 'Annual leave, booking, blackout dates', content: 'Annual leave allowance is 25 days per year plus 8 bank holidays. Leave must be booked at least 2 weeks in advance for periods over 3 days. Maximum 2 consecutive weeks. December 20-31 is a blackout period — no leave unless pre-approved by CEO.\n\nCarry over: up to 5 days may be carried to the next year.\nBuy/sell: you may buy up to 3 additional days or sell up to 3 days.\n\nLast updated: March 2026' },
  { icon: '🏥', title: 'Health & Wellbeing', desc: 'Mental health, EAP, sick leave', content: 'We provide an Employee Assistance Programme (EAP) through Health Assured, available 24/7. All employees have access to 6 free counselling sessions per year. Mental health first aiders: Sophie Brennan, Anya Kapoor.\n\nSick leave: statutory sick pay from day 4. Enhanced: full pay for first 10 days, half pay for days 11-20.\n\nLast updated: February 2026' },
  { icon: '🔒', title: 'Data & Security', desc: 'GDPR, data handling, passwords', content: 'All company data must be handled in accordance with UK GDPR. Personal data is stored in UK data centres only. Passwords must be minimum 12 characters. Two-factor authentication is mandatory for all systems.\n\nData breach reporting: notify IT immediately, then DPO within 2 hours.\nDPO: Claire Donovan (claire@company.com)\n\nLast updated: January 2026' },
  { icon: '💰', title: 'Expenses Policy', desc: 'Claims, limits, deadlines', content: 'Expenses must be submitted within 30 days of being incurred. Receipts required for all claims over £10. Approval: line manager for claims under £200, Finance for £200+.\n\nLimits: meals £25pp, hotels £150/night (London £200), mileage 45p/mile.\nPayment: processed in next payroll cycle after approval.\n\nLast updated: March 2026' },
  { icon: '🎓', title: 'Learning & Development', desc: 'Training budget, study leave', content: 'Each employee has a £1,000 annual L&D budget. This can be used for courses, conferences, books or certifications. Study leave: up to 5 days per year for approved qualifications.\n\nRequest process: discuss with manager → submit L&D form → Finance approval.\n\nLast updated: January 2026' },
]

const BIRTHDAYS = [
  { name: 'Ben Holloway', event: 'Birthday', date: '4 Apr', emoji: '🎂' },
  { name: 'Rachel Osei', event: '2 year anniversary', date: '7 Apr', emoji: '🎉' },
  { name: 'Nate Crawford', event: 'Birthday', date: '18 Apr', emoji: '🎂' },
]

const DEMO_STAFF: StaffRecord[] = [
  { first_name: 'James', last_name: 'Hartley', job_title: 'CEO & Founder', department: 'Executive', email: 'james@lumiodemo.com' },
  { first_name: 'Sophie', last_name: 'Brennan', job_title: 'Marketing Director', department: 'Marketing', email: 'sophie@lumiodemo.com' },
  { first_name: 'Marcus', last_name: 'Webb', job_title: 'Sales Director', department: 'Sales', email: 'marcus@lumiodemo.com' },
  { first_name: 'Rachel', last_name: 'Osei', job_title: 'Operations Manager', department: 'Operations', email: 'rachel@lumiodemo.com' },
  { first_name: 'Tom', last_name: 'Fielding', job_title: 'Support Lead', department: 'Support', email: 'tom@lumiodemo.com' },
  { first_name: 'Claire', last_name: 'Donovan', job_title: 'IT Director', department: 'IT', email: 'claire@lumiodemo.com' },
]

type SubTab = 'today' | 'orgchart' | 'company' | 'cards'

export default function TeamPanel({ selectedDepts }: { selectedDepts?: string[] } = {}) {
  const isDemo = typeof window !== 'undefined' && localStorage.getItem('lumio_demo_active') === 'true'
  const [team, setTeam] = useState<TeamMember[]>(isDemo ? TEAM : [])
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

      {/* ═══ PREVIEW OVERLAY — shown when no real team data AND not in demo ═══ */}
      {team.length === 0 && !isDemo && subTab !== 'company' && (
        <div className="relative">
          {/* Ghost preview at reduced opacity */}
          <div style={{ opacity: 0.35, filter: 'blur(1px)', pointerEvents: 'none', userSelect: 'none' }}>
            {subTab === 'today' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {TEAM.slice(0, 6).map(m => {
                  const sc = SC[m.status]
                  return (
                    <div key={m.id} className="rounded-2xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                      <div className="flex items-start gap-3">
                        <div className="relative shrink-0">
                          <MemberAvatar member={m} size={40} fontSize="text-sm" deptColor={DEPT_COLORS[m.department] || '#6B7280'} />
                          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2" style={{ backgroundColor: sc.dot, borderColor: '#111318' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-sm" style={{ color: '#E5E7EB' }}>{m.name}</span>
                          <p className="text-xs" style={{ color: '#6B7280' }}>{m.role} · {m.department}</p>
                          <span className="text-xs" style={{ color: sc.color }}>{sc.label}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {subTab === 'orgchart' && (
              <div className="space-y-4">
                <div className="flex justify-center"><div className="rounded-xl p-4 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', width: 180 }}><div className="w-12 h-12 rounded-full flex items-center justify-center font-bold mx-auto mb-2" style={{ backgroundColor: '#0D948815', color: '#0D9488' }}>JH</div><p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>James Hartley</p><p className="text-xs" style={{ color: '#6B7280' }}>CEO & Founder</p></div></div>
                <div className="flex justify-center gap-3">{TEAM.filter(m => m.level === 2).slice(0, 4).map(m => <div key={m.id} className="rounded-xl p-3 text-center" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937', width: 140 }}><div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] mx-auto mb-1" style={{ backgroundColor: `${DEPT_COLORS[m.department] || '#6B7280'}15`, color: DEPT_COLORS[m.department] || '#6B7280' }}>{m.avatar}</div><p className="text-xs font-medium" style={{ color: '#D1D5DB' }}>{m.name}</p><p className="text-[10px]" style={{ color: '#6B7280' }}>{m.role}</p></div>)}</div>
              </div>
            )}
            {subTab === 'cards' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {DEMO_STAFF.map((s, i) => (
                  <div key={i} className="rounded-2xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                    <div className="flex items-start justify-between mb-3"><div><p className="text-2xl font-black" style={{ color: '#6B7280' }}>93</p><p className="text-[10px]" style={{ color: '#4B5563' }}>CEO</p></div><div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: '#1F2937', color: '#6B7280' }}>{s.first_name?.[0]}{s.last_name?.[0]}</div></div>
                    <p className="text-sm font-bold" style={{ color: '#9CA3AF' }}>{s.first_name} {s.last_name}</p>
                    <p className="text-xs" style={{ color: '#6B7280' }}>{s.job_title}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Overlay banner */}
          <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 10 }}>
            <div className="rounded-xl p-6 text-center" style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', maxWidth: 400, border: '1px solid #1F2937' }}>
              <p className="text-2xl mb-2">👀</p>
              <h3 className="text-base font-bold mb-2" style={{ color: '#F9FAFB' }}>This is how your team will look</h3>
              <p className="text-xs mb-4" style={{ color: '#9CA3AF', lineHeight: 1.6 }}>Import your team to unlock your org chart, staff cards and team intelligence</p>
              <a href="/settings" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#0D9488', color: '#F9FAFB', textDecoration: 'none' }}>Import Team →</a>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TEAM TODAY ═══ */}
      {subTab === 'today' && (team.length > 0 || isDemo) && <>
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
                    <MemberAvatar member={m} size={40} fontSize="text-sm" deptColor={DEPT_COLORS[m.department] || '#6B7280'} />
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
      {subTab === 'orgchart' && (team.length > 0 || isDemo) && (
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
                  <div className="mx-auto mb-1" style={{ width: 40, height: 40 }}>
                    <MemberAvatar member={m} size={40} fontSize="text-xs" deptColor={DEPT_COLORS[m.department] || '#6B7280'} />
                  </div>
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
                  <div className="mx-auto mb-1" style={{ width: 32, height: 32 }}>
                    <MemberAvatar member={m} size={32} fontSize="text-[10px]" deptColor={DEPT_COLORS[m.department] || '#6B7280'} />
                  </div>
                  <p className="text-xs font-medium truncate" style={{ color: '#D1D5DB' }}>{m.name}</p>
                  <p className="text-[10px] truncate" style={{ color: '#6B7280' }}>{m.role}</p>
                  {manager && <p className="text-[10px]" style={{ color: '#374151' }}>→ {manager.name.split(' ')[0]}</p>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ═══ TEAM INFO (FIFA CARDS — same component as live) ═══ */}
      {subTab === 'cards' && (
        <div className="space-y-4">
          <h2 className="text-xl font-black" style={{ color: '#F9FAFB' }}>Team Info</h2>
          <div className={`grid gap-4 justify-items-center ${getGridCols(DEMO_STAFF.length)}`}>
            {DEMO_STAFF.map((s, i) => (
              <EmployeeProfileCard key={i} staff={s} index={i} isCurrentUser={i === 0} onViewProfile={() => setSelectedMember(team.find(t => t.name.includes(s.last_name || '')) || null)} teamSize={DEMO_STAFF.length} />
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
              {[['CEO', 'James Hartley'], ['HR', 'Sophie Brennan'], ['IT Support', 'Claire Donovan'], ['Finance', 'Marcus Webb']].map(([r, n]) => (
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
                <MemberAvatar member={selectedMember} size={48} fontSize="text-base" deptColor={DEPT_COLORS[selectedMember.department] || '#6B7280'} />
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
