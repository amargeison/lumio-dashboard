'use client'

import { useState } from 'react'
import { X, Users, Heart, Eye, Briefcase, Calendar, UserPlus } from 'lucide-react'

const STAFF = [
  {name:'Marcus Reid',role:'Head Coach',dept:'Coaching',quals:'UEFA Pro',status:'in' as const,loc:'Training ground, 9am-6pm',rel:'Your manager',email:'reid@oakridgefc.com',phone:'07700 900001'},
  {name:'David Hughes',role:'Assistant Manager',dept:'Coaching',quals:'UEFA A',status:'in' as const,loc:'Training ground',rel:'Works closely with you',email:'hughes@oakridgefc.com',phone:'07700 900002'},
  {name:'Dr Sarah Phillips',role:'Club Doctor',dept:'Medical',quals:'MBBS, MRCGP',status:'in' as const,loc:'Medical centre, 8am-5pm',rel:'Medical dept',email:'phillips@oakridgefc.com',phone:'07700 900003'},
  {name:'Pete Morrison',role:'Head Physio',dept:'Medical',quals:'MSc Sports Med',status:'in' as const,loc:'Medical centre, 8am-6pm',rel:'Medical dept',email:'morrison@oakridgefc.com',phone:'07700 900004'},
  {name:'Dave Thompson',role:'Head of Recruitment',dept:'Scouting',quals:'UEFA B',status:'away' as const,loc:'Away scouting',rel:'Direct report',email:'thompson@oakridgefc.com',phone:'07700 900005'},
  {name:'Ian Brooks',role:'Academy Director',dept:'Academy',quals:'UEFA A, PGCE',status:'in' as const,loc:'Academy building',rel:'Direct report',email:'brooks@oakridgefc.com',phone:'07700 900006'},
  {name:'Steve Walsh',role:'Chief Scout',dept:'Scouting',quals:'UEFA B',status:'away' as const,loc:'Belgium trip',rel:'Scouting dept',email:'walsh@oakridgefc.com',phone:'07700 900007'},
  {name:'Lisa Chen',role:'Sports Scientist',dept:'Medical',quals:'PhD Biomechanics',status:'away' as const,loc:'Conference',rel:'Performance dept',email:'chen@oakridgefc.com',phone:'07700 900008'},
  {name:'Emma Clark',role:'Performance Analyst',dept:'Coaching',quals:'MSc Data Science',status:'in' as const,loc:'Analysis suite',rel:'Analytics dept',email:'clark@oakridgefc.com',phone:'07700 900009'},
  {name:'Mark Evans',role:'Scout',dept:'Scouting',quals:'UEFA B',status:'in' as const,loc:'Office — report writing',rel:'Scouting dept',email:'evans@oakridgefc.com',phone:'07700 900010'},
  {name:'Alan Cooper',role:'GK Coach',dept:'Coaching',quals:'UEFA Pro (in progress)',status:'away' as const,loc:'Course Mon-Wed',rel:'Coaching dept',email:'cooper@oakridgefc.com',phone:'07700 900011'},
  {name:'Tom Wallace',role:'Fitness Coach',dept:'Coaching',quals:'BSc S&C',status:'in' as const,loc:'Gym, 7am-4pm',rel:'Performance dept',email:'wallace@oakridgefc.com',phone:'07700 900012'},
]

type StaffMember = typeof STAFF[0]

const FILTERS = ['All', 'In Today', 'Away', 'Coaching', 'Medical', 'Scouting', 'Academy']

function statusColor(s: string) { return s === 'in' ? '#22C55E' : '#F59E0B' }
function statusLabel(s: string) { return s === 'in' ? '🟢 In today' : '🟡 Away' }
function deptColor(d: string) { return d === 'Coaching' ? '#C0392B' : d === 'Medical' ? '#3B82F6' : d === 'Scouting' ? '#F59E0B' : d === 'Academy' ? '#22C55E' : '#8B5CF6' }

export default function FootballStaffView() {
  const [staffTab, setStaffTab] = useState<'today' | 'orgchart' | 'clubinfo'>('today')
  const [staffFilter, setStaffFilter] = useState('All')
  const [selStaff, setSelStaff] = useState<StaffMember | null>(null)

  const filtered = STAFF.filter(s => {
    if (staffFilter === 'All') return true
    if (staffFilter === 'In Today') return s.status === 'in'
    if (staffFilter === 'Away') return s.status === 'away'
    return s.dept === staffFilter
  })

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>Staff Management</h2>
        <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Coaching staff, medical team, scouts, and administrative personnel.</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-2">
        {([['today', '👥 Staff Today'], ['orgchart', '🏢 Org Chart'], ['clubinfo', '🏟️ Club Info']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setStaffTab(id)} className="px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
            style={{ backgroundColor: staffTab === id ? '#922B21' : 'transparent', color: staffTab === id ? '#F9FAFB' : '#6B7280', border: staffTab === id ? '1px solid #C0392B' : '1px solid #1F2937' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ──── STAFF TODAY ──── */}
      {staffTab === 'today' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setStaffFilter(f)} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{ backgroundColor: staffFilter === f ? '#C0392B1f' : '#0A0B10', color: staffFilter === f ? '#C0392B' : '#6B7280', border: staffFilter === f ? '1px solid #C0392B33' : '1px solid #1F2937' }}>
                {f}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map(s => (
              <button key={s.name} onClick={() => setSelStaff(s)} className="rounded-xl p-4 text-left transition-all hover:ring-1 hover:ring-white/10"
                style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ backgroundColor: `${statusColor(s.status)}20`, color: statusColor(s.status) }}>
                    {s.name.split(' ').map(w => w[0]).join('')}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: '#F9FAFB' }}>{s.name}</p>
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>{s.role}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: statusColor(s.status) }}>{statusLabel(s.status)}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: `${deptColor(s.dept)}1a`, color: deptColor(s.dept) }}>{s.dept}</span>
                </div>
                <p className="text-[10px] mt-1.5" style={{ color: '#4B5563' }}>{s.rel}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ──── ORG CHART ──── */}
      {staffTab === 'orgchart' && (
        <div className="space-y-6">
          {/* Chairman */}
          <div className="flex justify-center">
            <div className="rounded-xl px-6 py-3 text-center" style={{ backgroundColor: '#111318', border: '2px solid #8B5CF6' }}>
              <p className="text-xs" style={{ color: '#8B5CF6' }}>Chairman</p>
              <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Robert Blackwell</p>
            </div>
          </div>
          <div className="flex justify-center"><div className="w-px h-6" style={{ backgroundColor: '#374151' }} /></div>

          {/* Level 2 */}
          <div className="flex justify-center gap-12">
            {[
              { name: 'Dave Thompson', role: 'Director of Football', color: '#F59E0B' },
              { name: 'Marcus Reid', role: 'Head Coach', color: '#C0392B' },
            ].map(p => (
              <div key={p.name} className="rounded-xl px-5 py-3 text-center" style={{ backgroundColor: '#111318', border: `2px solid ${p.color}` }}>
                <p className="text-xs" style={{ color: p.color }}>{p.role}</p>
                <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{p.name}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-12">
            <div className="w-px h-6" style={{ backgroundColor: '#374151' }} />
            <div className="w-px h-6" style={{ backgroundColor: '#374151' }} />
          </div>

          {/* Level 3 */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-center mb-3" style={{ color: '#F59E0B' }}>Reports to DoF</p>
              {[
                { name: 'Steve Walsh', role: 'Chief Scout', color: '#F59E0B' },
                { name: 'Ian Brooks', role: 'Academy Director', color: '#22C55E' },
                { name: 'Mark Evans', role: 'Scout', color: '#F59E0B' },
              ].map(p => (
                <div key={p.name} className="rounded-lg px-4 py-2.5 flex items-center gap-3" style={{ backgroundColor: '#0A0B10', border: `1px solid ${p.color}33` }}>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                  <div>
                    <p className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>{p.name}</p>
                    <p className="text-[10px]" style={{ color: '#6B7280' }}>{p.role}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-center mb-3" style={{ color: '#C0392B' }}>Reports to Head Coach</p>
              {[
                { name: 'David Hughes', role: 'Assistant Manager', color: '#C0392B' },
                { name: 'Alan Cooper', role: 'GK Coach', color: '#C0392B' },
                { name: 'Tom Wallace', role: 'Fitness Coach', color: '#C0392B' },
                { name: 'Lisa Chen', role: 'Sports Scientist', color: '#3B82F6' },
                { name: 'Emma Clark', role: 'Performance Analyst', color: '#C0392B' },
              ].map(p => (
                <div key={p.name} className="rounded-lg px-4 py-2.5 flex items-center gap-3" style={{ backgroundColor: '#0A0B10', border: `1px solid ${p.color}33` }}>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                  <div>
                    <p className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>{p.name}</p>
                    <p className="text-[10px]" style={{ color: '#6B7280' }}>{p.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Medical */}
          <div>
            <p className="text-xs font-semibold text-center mb-3" style={{ color: '#3B82F6' }}>Medical Department</p>
            <div className="flex justify-center gap-3">
              {[
                { name: 'Dr Sarah Phillips', role: 'Club Doctor' },
                { name: 'Pete Morrison', role: 'Head Physio' },
              ].map(p => (
                <div key={p.name} className="rounded-lg px-4 py-2.5 flex items-center gap-3" style={{ backgroundColor: '#0A0B10', border: '1px solid #3B82F633' }}>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#3B82F6' }} />
                  <div>
                    <p className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>{p.name}</p>
                    <p className="text-[10px]" style={{ color: '#6B7280' }}>{p.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 pt-2">
            {[{ label: 'Coaching', color: '#C0392B' }, { label: 'Medical', color: '#3B82F6' }, { label: 'Scouting', color: '#F59E0B' }, { label: 'Academy', color: '#22C55E' }, { label: 'Executive', color: '#8B5CF6' }].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                <span className="text-[10px]" style={{ color: '#6B7280' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ──── CLUB INFO ──── */}
      {staffTab === 'clubinfo' && (
        <div className="space-y-5">
          {/* Documents */}
          <div>
            <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Club Documents</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: '📋', title: 'Staff Code of Conduct', desc: 'Professional standards, conduct and disciplinary procedures' },
                { icon: '🏥', title: 'Medical & Welfare Policy', desc: 'Player medical confidentiality, treatment protocols, mental health' },
                { icon: '🔒', title: 'Data & GDPR Policy', desc: 'Player data handling, scouting database compliance, media consent' },
                { icon: '💰', title: 'Expenses & Travel Policy', desc: 'Away trips, scouting travel, meal allowances, booking process' },
                { icon: '🎓', title: 'Coaching & Development Policy', desc: 'UEFA licence requirements, CPD, staff development budget' },
                { icon: '🤝', title: 'Agent & Intermediary Policy', desc: 'FA regulations on agent contacts, disclosure requirements' },
                { icon: '📱', title: 'Media & Social Media Policy', desc: 'What staff can/cannot post, player privacy, media embargo' },
                { icon: '👶', title: 'Employment & Contracts', desc: 'Staff contracts, notice periods, garden leave, exit procedures' },
              ].map(d => (
                <div key={d.title} className="rounded-xl p-4 cursor-pointer transition-all hover:ring-1 hover:ring-white/10" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span>{d.icon}</span>
                    <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{d.title}</p>
                  </div>
                  <p className="text-xs" style={{ color: '#6B7280' }}>{d.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Club Details + Key Contacts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Club Details</p>
              {[
                { l: 'Club Name', v: 'Oakridge FC' }, { l: 'Founded', v: '1887' }, { l: 'Nickname', v: 'The Oaks' },
                { l: 'Colours', v: 'Red & Gold' }, { l: 'Stadium', v: 'Oakridge Park (24,000)' },
                { l: 'Training Ground', v: 'Oakridge Training Complex' }, { l: 'League', v: 'EFL Championship' },
                { l: 'EPPP Category', v: 'Category 2' },
              ].map(r => (
                <div key={r.l} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid #1F293733' }}>
                  <span className="text-xs" style={{ color: '#6B7280' }}>{r.l}</span>
                  <span className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>{r.v}</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Key Contacts</p>
              {[
                { name: 'Robert Blackwell', role: 'Chairman', email: 'chairman@oakridgefc.com' },
                { name: 'Dave Thompson', role: 'Director of Football', email: 'dof@oakridgefc.com' },
                { name: 'Marcus Reid', role: 'Head Coach', email: 'coach@oakridgefc.com' },
                { name: 'Dr Sarah Phillips', role: 'Club Doctor', email: 'medical@oakridgefc.com' },
                { name: 'James Morton', role: 'Club Secretary', email: 'secretary@oakridgefc.com' },
                { name: 'Claire Hughes', role: 'Media Manager', email: 'media@oakridgefc.com' },
              ].map(c => (
                <div key={c.name} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid #1F293733' }}>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>{c.name}</p>
                    <p className="text-[10px]" style={{ color: '#6B7280' }}>{c.role}</p>
                  </div>
                  <span className="text-[10px]" style={{ color: '#C0392B' }}>{c.email}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Useful Links */}
          <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Useful Links</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['🔗 FA Club Portal', '🔗 EFL Management System', '🔗 Wyscout', '🔗 Catapult GPS', '🔗 Club Payroll', '🔗 EPPP Portal', '🔗 TransferRoom', '🔗 Club Website'].map(l => (
                <span key={l} className="text-xs px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-white/5" style={{ color: '#9CA3AF', border: '1px solid #1F2937' }}>{l}</span>
              ))}
            </div>
          </div>

          {/* Birthdays */}
          <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Birthdays & Anniversaries This Month</p>
            {[
              { icon: '🎂', text: 'Pete Morrison — Birthday 3 Apr' },
              { icon: '🎉', text: 'David Hughes — 5 year anniversary at club 8 Apr' },
              { icon: '🎂', text: 'Emma Clark — Birthday 22 Apr' },
            ].map(e => (
              <p key={e.text} className="text-xs py-1.5" style={{ color: '#D1D5DB' }}>{e.icon} {e.text}</p>
            ))}
          </div>
        </div>
      )}

      {/* Staff detail modal */}
      {selStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="rounded-2xl p-6 w-full" style={{ maxWidth: 420, backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: `${statusColor(selStaff.status)}20`, color: statusColor(selStaff.status) }}>
                  {selStaff.name.split(' ').map(w => w[0]).join('')}
                </div>
                <div>
                  <p className="text-base font-bold" style={{ color: '#F9FAFB' }}>{selStaff.name}</p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>{selStaff.role} · {selStaff.dept}</p>
                </div>
              </div>
              <button onClick={() => setSelStaff(null)} style={{ color: '#6B7280' }}><X size={16} /></button>
            </div>
            <div className="space-y-2 mb-4">
              {[
                { l: 'Status', v: statusLabel(selStaff.status), c: statusColor(selStaff.status) },
                { l: 'Location', v: selStaff.loc, c: '#F9FAFB' },
                { l: 'Qualifications', v: selStaff.quals, c: '#F9FAFB' },
                { l: 'Relationship', v: selStaff.rel, c: '#F9FAFB' },
                { l: 'Email', v: selStaff.email, c: '#C0392B' },
                { l: 'Phone', v: selStaff.phone, c: '#F9FAFB' },
              ].map(r => (
                <div key={r.l} className="flex justify-between">
                  <span className="text-xs" style={{ color: '#6B7280' }}>{r.l}</span>
                  <span className="text-xs font-semibold" style={{ color: r.c }}>{r.v}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSelStaff(null)} className="flex-1 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#922B21', color: '#F9FAFB' }}>Message</button>
              <button onClick={() => setSelStaff(null)} className="flex-1 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#0A0B10', color: '#F9FAFB', border: '1px solid #374151' }}>Book Meeting</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
