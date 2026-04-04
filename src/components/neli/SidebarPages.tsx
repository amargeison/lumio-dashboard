'use client'

import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  Users, Shield, Clock, ClipboardList, Calendar, Database, GitBranch, FileText,
  Download, Loader2, AlertTriangle, CheckCircle2, Plus, Edit3, Trash2, Eye,
  Phone, Mail, MapPin, UserCheck, RefreshCw, Settings, ChevronRight,
} from 'lucide-react'
import {
  T, PUPILS, STAFF, CLASSES, FL_COURSES, TRUST,
  getLight, lc, lb, ll, neliPupils, classAvgI, classAvgE, neliAvgGain,
} from './neliData'

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED
// ═══════════════════════════════════════════════════════════════════════════════

const cardStyle: React.CSSProperties = { backgroundColor: '#111318', border: '1px solid #1F2937', borderRadius: 16, padding: 20 }
const darkBg: React.CSSProperties = { backgroundColor: '#0A0B10', border: '1px solid #1F2937', borderRadius: 12 }
const tblHead: React.CSSProperties = { backgroundColor: '#0D0E14' }
const thStyle: React.CSSProperties = { padding: '10px 12px', textAlign: 'left' as const, fontWeight: 600, color: '#6B7280', fontSize: 12 }
const tdStyle: React.CSSProperties = { padding: '10px 12px', fontSize: 12, borderBottom: '1px solid #1F293740' }

function TabBar({ tabs, active, onChange }: { tabs: { id: string; label: string; icon?: string }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap"
          style={{ backgroundColor: active === t.id ? '#0D9488' : '#111318', color: active === t.id ? '#fff' : '#6B7280', border: active === t.id ? '1px solid #0D9488' : '1px solid #1F2937' }}>
          {t.icon && <span>{t.icon}</span>}{t.label}
        </button>
      ))}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-xl p-3 text-center" style={{ ...darkBg }}>
      <p className="text-xl font-black" style={{ color }}>{value}</p>
      <p className="text-[10px] font-medium mt-1" style={{ color: '#6B7280' }}>{label}</p>
    </div>
  )
}

function PageHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(13,148,136,0.15)' }}>{icon}</div>
      <div>
        <h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>{title}</h2>
        <p className="text-xs" style={{ color: '#6B7280' }}>{subtitle}</p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. STAFF MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

export function StaffManagementPage() {
  const [tab, setTab] = useState('directory')
  const tabs = [
    { id: 'directory', label: 'Staff Directory', icon: '👥' },
    { id: 'roles', label: 'Roles & Access', icon: '🔑' },
    { id: 'training', label: 'Training Status', icon: '🎓' },
    { id: 'attendance', label: 'Attendance', icon: '✅' },
  ]

  const staffData = [
    { ...STAFF[0], email: 'sarah@parkside.edu', phone: '(555) 123-4567', classes: ['Reception A'], trained: true },
    { ...STAFF[1], email: 'james@parkside.edu', phone: '(555) 234-5678', classes: ['Reception A'], trained: false },
    { ...STAFF[2], email: 'hannah@parkside.edu', phone: '(555) 345-6789', classes: ['Reception A', 'Reception B'], trained: false },
    { ...STAFF[3], email: 'david@parkside.edu', phone: '(555) 456-7890', classes: ['All'], trained: true },
  ]

  const accessLevels = [
    { role: 'Admin', desc: 'Full access to all features, settings, and data', color: '#EF4444' },
    { role: 'Teacher', desc: 'Class management, assessments, reports for assigned classes', color: '#3B82F6' },
    { role: 'Paraprofessional', desc: 'Session delivery, student progress tracking, training modules', color: '#0D9488' },
    { role: 'SENCO', desc: 'SEND register, support plans, referrals, all student data', color: '#8B5CF6' },
  ]

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  const attendanceData = staffData.map(s => ({
    name: s.name,
    days: weekDays.map(() => Math.random() > 0.1 ? 'present' : 'absent'),
  }))

  return (
    <div className="space-y-4 p-4">
      <PageHeader icon={<Users size={20} style={{ color: '#0D9488' }} />} title="Staff Management" subtitle="Manage staff directory, roles, training, and attendance" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Staff" value={staffData.length} color="#0D9488" />
        <StatCard label="TEL TED Trained" value={staffData.filter(s => s.trained).length} color="#22C55E" />
        <StatCard label="Training Pending" value={staffData.filter(s => !s.trained).length} color="#F59E0B" />
        <StatCard label="Present Today" value={staffData.length} color="#3B82F6" />
      </div>
      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'directory' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5" style={{ backgroundColor: '#0D9488', color: '#fff' }}><Plus size={12} /> Add Staff Member</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {staffData.map((s, i) => (
              <div key={i} className="rounded-xl p-4" style={{ ...darkBg }}>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488' }}>
                    {s.name.split(' ').map(w => w[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{s.name}</p>
                      {s.trained && <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22C55E' }}>TEL TED Certified</span>}
                    </div>
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>{s.role}</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-[10px] flex items-center gap-1" style={{ color: '#6B7280' }}><Mail size={10} /> {s.email}</p>
                      <p className="text-[10px] flex items-center gap-1" style={{ color: '#6B7280' }}><Phone size={10} /> {s.phone}</p>
                      <p className="text-[10px]" style={{ color: '#6B7280' }}>Classes: {s.classes.join(', ')}</p>
                    </div>
                    <div className="flex gap-1 mt-2">
                      <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: s.c1 ? 'rgba(34,197,94,0.1)' : 'rgba(107,114,128,0.1)', color: s.c1 ? '#22C55E' : '#6B7280' }}>C1 {s.c1 ? '✓' : '✗'}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: s.c2 ? 'rgba(34,197,94,0.1)' : 'rgba(107,114,128,0.1)', color: s.c2 ? '#22C55E' : '#6B7280' }}>C2 {s.c2 ? '✓' : '✗'}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: s.c3 ? 'rgba(34,197,94,0.1)' : 'rgba(107,114,128,0.1)', color: s.c3 ? '#22C55E' : '#6B7280' }}>C3 {s.c3 ? '✓' : '✗'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'roles' && (
        <div className="rounded-xl overflow-hidden" style={{ ...darkBg }}>
          <table className="w-full text-xs">
            <thead><tr style={tblHead}>
              {['Name', 'Role', 'Access Level', 'Permissions', 'Action'].map(h => <th key={h} style={thStyle}>{h}</th>)}
            </tr></thead>
            <tbody>
              {staffData.map((s, i) => {
                const level = i === 0 ? 'Admin' : i === 3 ? 'SENCO' : i === 2 ? 'Teacher' : 'Paraprofessional'
                const al = accessLevels.find(a => a.role === level)!
                return (
                  <tr key={i}>
                    <td style={{ ...tdStyle, color: '#F9FAFB', fontWeight: 600 }}>{s.name}</td>
                    <td style={{ ...tdStyle, color: '#D1D5DB' }}>{s.role}</td>
                    <td style={tdStyle}><span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: al.color + '20', color: al.color }}>{level}</span></td>
                    <td style={{ ...tdStyle, color: '#9CA3AF', maxWidth: 200 }}>{al.desc}</td>
                    <td style={tdStyle}><button className="text-[10px] px-2 py-1 rounded" style={{ backgroundColor: 'rgba(13,148,136,0.1)', color: '#0D9488' }}>Edit Role</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="p-4 space-y-2">
            <h4 className="text-xs font-bold" style={{ color: '#F9FAFB' }}>Role Descriptions</h4>
            {accessLevels.map(a => (
              <div key={a.role} className="flex items-center gap-2 py-1">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: a.color + '20', color: a.color }}>{a.role}</span>
                <span className="text-[10px]" style={{ color: '#9CA3AF' }}>{a.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'training' && (
        <div className="space-y-4">
          <div className="rounded-xl overflow-hidden" style={{ ...darkBg }}>
            <table className="w-full text-xs">
              <thead><tr style={tblHead}>
                {['Staff Member', 'Course 1', 'Course 2', 'Course 3', 'CPD Hours', 'Status'].map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr></thead>
              <tbody>
                {staffData.map((s, i) => {
                  const hrs = (s.c1 ? 5 : 0) + (s.c2 ? 5 : 0) + (s.c3 ? 3 : 0)
                  const complete = s.c1 && s.c2 && s.c3
                  return (
                    <tr key={i}>
                      <td style={{ ...tdStyle, color: '#F9FAFB', fontWeight: 600 }}>{s.name}</td>
                      <td style={tdStyle}>{s.c1 ? <span style={{ color: '#22C55E' }}>&#10003;</span> : <span style={{ color: '#EF4444' }}>&#10007;</span>}</td>
                      <td style={tdStyle}>{s.c2 ? <span style={{ color: '#22C55E' }}>&#10003;</span> : <span style={{ color: '#EF4444' }}>&#10007;</span>}</td>
                      <td style={tdStyle}>{s.c3 ? <span style={{ color: '#22C55E' }}>&#10003;</span> : <span style={{ color: '#EF4444' }}>&#10007;</span>}</td>
                      <td style={{ ...tdStyle, color: '#D1D5DB' }}>{hrs}/48</td>
                      <td style={tdStyle}><span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: complete ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)', color: complete ? '#22C55E' : '#F59E0B' }}>{complete ? 'Fully Trained' : 'In Progress'}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {staffData.filter(s => !s.c1 || !s.c2 || !s.c3).length > 0 && (
            <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <h4 className="text-xs font-bold mb-2" style={{ color: '#F59E0B' }}>Outstanding Training Alerts</h4>
              {staffData.filter(s => !s.c1 || !s.c2 || !s.c3).map((s, i) => {
                const missing = [!s.c1 && 'Course 1', !s.c2 && 'Course 2', !s.c3 && 'Course 3'].filter(Boolean).join(', ')
                return <p key={i} className="text-xs" style={{ color: '#FBBF24' }}>{s.name} — {missing} outstanding</p>
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'attendance' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5" style={{ backgroundColor: '#EF4444', color: '#fff' }}><Plus size={12} /> Log Absence</button>
          </div>
          <div className="rounded-xl overflow-hidden" style={{ ...darkBg }}>
            <table className="w-full text-xs">
              <thead><tr style={tblHead}>
                <th style={thStyle}>Name</th>
                {weekDays.map(d => <th key={d} style={{ ...thStyle, textAlign: 'center' }}>{d}</th>)}
                <th style={{ ...thStyle, textAlign: 'center' }}>%</th>
              </tr></thead>
              <tbody>
                {attendanceData.map((s, i) => {
                  const pct = Math.round((s.days.filter(d => d === 'present').length / 5) * 100)
                  return (
                    <tr key={i}>
                      <td style={{ ...tdStyle, color: '#F9FAFB', fontWeight: 600 }}>{s.name}</td>
                      {s.days.map((d, di) => (
                        <td key={di} style={{ ...tdStyle, textAlign: 'center' }}>
                          <span className="inline-block w-5 h-5 rounded-full text-[10px] leading-5 text-center" style={{ backgroundColor: d === 'present' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: d === 'present' ? '#22C55E' : '#EF4444' }}>
                            {d === 'present' ? '✓' : '✗'}
                          </span>
                        </td>
                      ))}
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: pct === 100 ? '#22C55E' : '#F59E0B' }}>{pct}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. SEND & DSL
// ═══════════════════════════════════════════════════════════════════════════════

export function SendDslPage() {
  const [tab, setTab] = useState('register')
  const tabs = [
    { id: 'register', label: 'SEND Register', icon: '📋' },
    { id: 'ell', label: 'ELL Students', icon: '🌍' },
    { id: 'plans', label: 'Support Plans', icon: '📝' },
    { id: 'referrals', label: 'Referrals', icon: '📩' },
  ]

  const senPupils = PUPILS.filter((p: any) => p.sen?.status && p.sen.status !== 'None')
  const ealPupils = PUPILS.filter((p: any) => p.eal)
  const ehcpCount = PUPILS.filter((p: any) => p.sen?.ehcp).length

  const langDist = ealPupils.reduce((acc: Record<string, number>, p: any) => {
    const lang = (p as any).homeLanguage || 'Unknown'
    acc[lang] = (acc[lang] || 0) + 1
    return acc
  }, {})
  const langData = Object.entries(langDist).map(([name, value]) => ({ name, value }))
  const COLORS = ['#0D9488', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#22C55E']

  return (
    <div className="space-y-4 p-4">
      <PageHeader icon={<UserCheck size={20} style={{ color: '#0D9488' }} />} title="SEND & DSL" subtitle="Special Educational Needs, Disabilities, and Designated Safeguarding Lead" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total SEN" value={senPupils.length} color="#F59E0B" />
        <StatCard label="ELL Students" value={ealPupils.length} color="#3B82F6" />
        <StatCard label="EHCP" value={ehcpCount} color="#8B5CF6" />
        <StatCard label="Active Referrals" value={1} color="#EF4444" />
      </div>
      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'register' && (
        <div className="rounded-xl overflow-hidden" style={{ ...darkBg }}>
          <table className="w-full text-xs">
            <thead><tr style={tblHead}>
              {['Name', 'SEN Category', 'Support Level', 'EHCP', 'Review Date', 'Adjustments', 'Action'].map(h => <th key={h} style={thStyle}>{h}</th>)}
            </tr></thead>
            <tbody>
              {senPupils.map((p: any) => (
                <tr key={p.id}>
                  <td style={{ ...tdStyle, color: '#F9FAFB', fontWeight: 600 }}>{p.name}</td>
                  <td style={{ ...tdStyle, color: '#D1D5DB' }}>{p.sen.category}</td>
                  <td style={tdStyle}><span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>{p.sen.status}</span></td>
                  <td style={{ ...tdStyle, color: p.sen.ehcp ? '#22C55E' : '#6B7280' }}>{p.sen.ehcp ? 'Yes' : 'No'}</td>
                  <td style={{ ...tdStyle, color: '#D1D5DB' }}>{p.senDetail?.nextReview || '—'}</td>
                  <td style={{ ...tdStyle, color: '#9CA3AF', maxWidth: 160 }}>{(p.sen.adjustments || []).join(', ') || '—'}</td>
                  <td style={tdStyle}><button className="text-[10px] px-2 py-1 rounded" style={{ backgroundColor: 'rgba(13,148,136,0.1)', color: '#0D9488' }}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'ell' && (
        <div className="space-y-4">
          <div className="rounded-xl overflow-hidden" style={{ ...darkBg }}>
            <table className="w-full text-xs">
              <thead><tr style={tblHead}>
                {['Name', 'Home Language', 'ELL Stage', 'Initial Score', 'Current Score', 'Progress'].map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr></thead>
              <tbody>
                {ealPupils.map((p: any) => {
                  const gain = p.es ? p.es - p.is : null
                  return (
                    <tr key={p.id}>
                      <td style={{ ...tdStyle, color: '#F9FAFB', fontWeight: 600 }}>{p.name}</td>
                      <td style={{ ...tdStyle, color: '#D1D5DB' }}>{(p as any).homeLanguage || 'Unknown'}</td>
                      <td style={tdStyle}><span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: '#60A5FA' }}>{(p as any).ealStage || 'Developing'}</span></td>
                      <td style={{ ...tdStyle, color: '#D1D5DB' }}>{p.is}</td>
                      <td style={{ ...tdStyle, color: p.es ? '#22C55E' : '#6B7280', fontWeight: 600 }}>{p.es ?? '—'}</td>
                      <td style={{ ...tdStyle, color: gain && gain > 0 ? '#22C55E' : '#6B7280', fontWeight: 600 }}>{gain != null ? (gain > 0 ? `+${gain}` : gain) : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {langData.length > 0 && (
            <div style={cardStyle}>
              <h4 className="text-sm font-bold mb-2" style={{ color: '#F9FAFB' }}>Language Distribution</h4>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={langData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }: any) => `${name} (${value})`}>
                    {langData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: 8, color: '#F9FAFB', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {tab === 'plans' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button className="text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5" style={{ backgroundColor: '#0D9488', color: '#fff' }}><Plus size={12} /> Create Support Plan</button>
          </div>
          {senPupils.map((p: any) => (
            <div key={p.id} className="rounded-xl p-4" style={{ ...darkBg }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{p.name}</p>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>{p.sen.status}</span>
                </div>
                <span className="text-[10px]" style={{ color: '#6B7280' }}>Review: {p.senDetail?.nextReview || '—'}</span>
              </div>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>Plan: {p.sen.plan || 'No plan documented'}</p>
              <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Interventionist: {p.interventionist || '—'}</p>
              <div className="mt-2 flex gap-1 flex-wrap">
                {(p.senDetail?.strategies || []).map((s: string, i: number) => (
                  <span key={i} className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'referrals' && (
        <div className="space-y-4">
          <div className="rounded-xl p-4" style={{ ...darkBg, borderLeft: '3px solid #F59E0B' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Amara Johnson — Speech & Language Referral</p>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>Submitted: October 2024 · Status: Pending</p>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>Pending</span>
            </div>
            <div className="mt-3 flex gap-2">
              <div className="flex-1 rounded-lg p-2" style={{ backgroundColor: '#0D0E14' }}>
                <p className="text-[10px] font-semibold" style={{ color: '#6B7280' }}>Referred To</p>
                <p className="text-xs" style={{ color: '#F9FAFB' }}>SALT Team</p>
              </div>
              <div className="flex-1 rounded-lg p-2" style={{ backgroundColor: '#0D0E14' }}>
                <p className="text-[10px] font-semibold" style={{ color: '#6B7280' }}>Referred By</p>
                <p className="text-xs" style={{ color: '#F9FAFB' }}>Sarah Mitchell</p>
              </div>
              <div className="flex-1 rounded-lg p-2" style={{ backgroundColor: '#0D0E14' }}>
                <p className="text-[10px] font-semibold" style={{ color: '#6B7280' }}>Priority</p>
                <p className="text-xs" style={{ color: '#F59E0B' }}>High</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl p-4" style={{ ...darkBg }}>
            <h4 className="text-xs font-bold mb-3" style={{ color: '#F9FAFB' }}>Referral Timeline</h4>
            <div className="space-y-3">
              {[
                { date: 'Oct 15, 2024', event: 'SALT referral submitted by Sarah Mitchell', status: 'done' },
                { date: 'Oct 22, 2024', event: 'Referral acknowledged by SALT team', status: 'done' },
                { date: 'Nov 5, 2024', event: 'Initial assessment scheduled', status: 'done' },
                { date: 'Pending', event: 'Awaiting SALT assessment appointment', status: 'pending' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: item.status === 'done' ? '#22C55E' : '#F59E0B' }} />
                  <div>
                    <p className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>{item.date}</p>
                    <p className="text-[10px]" style={{ color: '#9CA3AF' }}>{item.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. SAFEGUARDING
// ═══════════════════════════════════════════════════════════════════════════════

export function SafeguardingPage() {
  const [tab, setTab] = useState('overview')
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '🛡️' },
    { id: 'concerns', label: 'Concerns Log', icon: '📝' },
    { id: 'checks', label: 'Staff Checks', icon: '🔍' },
    { id: 'training', label: 'Training', icon: '🎓' },
  ]

  const dbsData = [
    { name: 'Sarah Mitchell', number: 'DBS-001-2023', issued: 'Jan 15, 2023', expiry: 'Jan 15, 2026', status: 'current' },
    { name: 'James Okafor', number: 'DBS-002-2023', issued: 'Mar 10, 2023', expiry: 'Mar 10, 2026', status: 'current' },
    { name: 'Hannah Brooks', number: 'DBS-003-2022', issued: 'Sep 1, 2022', expiry: 'Sep 1, 2025', status: 'current' },
    { name: 'David Chen', number: 'DBS-004-2021', issued: 'Jun 20, 2021', expiry: 'Jun 20, 2024', status: 'expired' },
  ]

  return (
    <div className="space-y-4 p-4">
      <PageHeader icon={<Shield size={20} style={{ color: '#0D9488' }} />} title="Safeguarding" subtitle="Safeguarding policies, concerns, and compliance" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Open Concerns" value={0} color="#22C55E" />
        <StatCard label="DBS Checks Current" value="3/4" color="#F59E0B" />
        <StatCard label="Training Up-to-Date" value="3/4" color="#3B82F6" />
        <StatCard label="Policy Version" value="v3.1" color="#8B5CF6" />
      </div>
      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} style={{ color: '#22C55E' }} />
              <p className="text-sm font-semibold" style={{ color: '#22C55E' }}>No open safeguarding concerns</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Designated Safeguarding Lead (DSL)', value: 'David Chen', role: 'SENCO', icon: '🛡️' },
              { label: 'Deputy DSL', value: 'Hannah Brooks', role: 'Kindergarten Teacher', icon: '🔰' },
              { label: 'Principal', value: 'Dr. Rebecca Lawson', role: 'Head of School', icon: '👤' },
              { label: 'Last Safeguarding Review', value: 'January 2026', role: 'Next due: July 2026', icon: '📅' },
            ].map((c, i) => (
              <div key={i} className="rounded-xl p-4" style={{ ...darkBg }}>
                <div className="flex items-center gap-2 mb-2">
                  <span>{c.icon}</span>
                  <p className="text-[10px] font-semibold uppercase" style={{ color: '#6B7280' }}>{c.label}</p>
                </div>
                <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{c.value}</p>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>{c.role}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'concerns' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5" style={{ backgroundColor: '#EF4444', color: '#fff' }}><Plus size={12} /> Log a Concern</button>
          </div>
          <div className="flex flex-col items-center justify-center py-12" style={{ ...darkBg, borderRadius: 16 }}>
            <CheckCircle2 size={48} style={{ color: '#22C55E', marginBottom: 12 }} />
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>No concerns logged this term</p>
            <p className="text-xs" style={{ color: '#6B7280' }}>Use the button above to log a safeguarding concern</p>
          </div>
        </div>
      )}

      {tab === 'checks' && (
        <div className="space-y-4">
          <div className="rounded-xl overflow-hidden" style={{ ...darkBg }}>
            <table className="w-full text-xs">
              <thead><tr style={tblHead}>
                {['Name', 'DBS Number', 'Issue Date', 'Expiry Date', 'Status', 'Action'].map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr></thead>
              <tbody>
                {dbsData.map((d, i) => (
                  <tr key={i}>
                    <td style={{ ...tdStyle, color: '#F9FAFB', fontWeight: 600 }}>{d.name}</td>
                    <td style={{ ...tdStyle, color: '#D1D5DB' }}>{d.number}</td>
                    <td style={{ ...tdStyle, color: '#D1D5DB' }}>{d.issued}</td>
                    <td style={{ ...tdStyle, color: d.status === 'expired' ? '#EF4444' : '#D1D5DB', fontWeight: d.status === 'expired' ? 700 : 400 }}>{d.expiry}</td>
                    <td style={tdStyle}>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: d.status === 'current' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: d.status === 'current' ? '#22C55E' : '#EF4444' }}>
                        {d.status === 'current' ? 'Current' : 'Expired'}
                      </span>
                    </td>
                    <td style={tdStyle}><button className="text-[10px] px-2 py-1 rounded" style={{ backgroundColor: 'rgba(13,148,136,0.1)', color: '#0D9488' }}>Request Renewal</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-xl p-3" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <p className="text-xs font-semibold" style={{ color: '#EF4444' }}>⚠ David Chen&apos;s DBS check expired Jun 2024 — renewal required</p>
          </div>
        </div>
      )}

      {tab === 'training' && (
        <div className="rounded-xl overflow-hidden" style={{ ...darkBg }}>
          <table className="w-full text-xs">
            <thead><tr style={tblHead}>
              {['Staff Member', 'Safeguarding Training', 'Completion Date', 'Annual Refresh Due', 'Status'].map(h => <th key={h} style={thStyle}>{h}</th>)}
            </tr></thead>
            <tbody>
              {[
                { name: 'Sarah Mitchell', completed: 'Sep 2025', refresh: 'Sep 2026', status: 'current' },
                { name: 'James Okafor', completed: 'Sep 2025', refresh: 'Sep 2026', status: 'current' },
                { name: 'Hannah Brooks', completed: 'Sep 2025', refresh: 'Sep 2026', status: 'current' },
                { name: 'David Chen', completed: 'Sep 2024', refresh: 'Sep 2025', status: 'overdue' },
              ].map((s, i) => (
                <tr key={i}>
                  <td style={{ ...tdStyle, color: '#F9FAFB', fontWeight: 600 }}>{s.name}</td>
                  <td style={{ ...tdStyle, color: '#D1D5DB' }}>Level 2 Safeguarding</td>
                  <td style={{ ...tdStyle, color: '#D1D5DB' }}>{s.completed}</td>
                  <td style={{ ...tdStyle, color: s.status === 'overdue' ? '#EF4444' : '#D1D5DB', fontWeight: s.status === 'overdue' ? 700 : 400 }}>{s.refresh}</td>
                  <td style={tdStyle}>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: s.status === 'current' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: s.status === 'current' ? '#22C55E' : '#EF4444' }}>
                      {s.status === 'current' ? 'Current' : 'Overdue'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. PRE & AFTER SCHOOL
// ═══════════════════════════════════════════════════════════════════════════════

export function WraparoundPage() {
  const [tab, setTab] = useState('register')
  const tabs = [
    { id: 'register', label: "Today's Register", icon: '📋' },
    { id: 'schedule', label: 'Weekly Schedule', icon: '📅' },
    { id: 'enrolled', label: 'Students Enrolled', icon: '👥' },
    { id: 'billing', label: 'Billing', icon: '💰' },
  ]

  const enrolled = PUPILS.slice(0, 8).map((p: any, i: number) => ({
    ...p,
    programme: i < 3 ? 'Both' : i < 5 ? 'Before School' : 'After School',
    parentContact: `(555) ${100 + i}-${1000 + i * 111}`,
    checkedIn: i < 4,
    checkInTime: i < 4 ? `07:${30 + i * 5}` : null,
    checkedOut: i < 2,
    checkOutTime: i < 2 ? `17:${15 + i * 10}` : null,
  }))

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

  return (
    <div className="space-y-4 p-4">
      <PageHeader icon={<Clock size={20} style={{ color: '#0D9488' }} />} title="Pre & After School" subtitle="Manage before and after school care programmes" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Enrolled Students" value={enrolled.length} color="#0D9488" />
        <StatCard label="Morning Session" value={enrolled.filter(e => e.programme !== 'After School').length} color="#F59E0B" />
        <StatCard label="Afternoon Session" value={enrolled.filter(e => e.programme !== 'Before School').length} color="#3B82F6" />
        <StatCard label="Checked In Today" value={enrolled.filter(e => e.checkedIn).length} color="#22C55E" />
      </div>
      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'register' && (
        <div className="space-y-4">
          {['Morning Session (7:30 AM)', 'Afternoon Session (3:30 PM)'].map((session, si) => {
            const students = si === 0 ? enrolled.filter(e => e.programme !== 'After School') : enrolled.filter(e => e.programme !== 'Before School')
            return (
              <div key={si} style={cardStyle}>
                <h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>{session}</h4>
                <div className="space-y-2">
                  {students.map((s: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ backgroundColor: '#0D0E14' }}>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488' }}>
                          {s.name.split(' ').map((w: string) => w[0]).join('')}
                        </div>
                        <div>
                          <p className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>{s.name}</p>
                          <p className="text-[10px]" style={{ color: '#6B7280' }}>{si === 0 && s.checkInTime ? `Arrived ${s.checkInTime}` : si === 1 && s.checkOutTime ? `Collected ${s.checkOutTime}` : 'Expected'}</p>
                        </div>
                      </div>
                      <button className="text-[10px] font-semibold px-2 py-1 rounded-lg" style={{ backgroundColor: (si === 0 ? s.checkedIn : s.checkedOut) ? 'rgba(34,197,94,0.15)' : 'rgba(200,150,12,0.15)', color: (si === 0 ? s.checkedIn : s.checkedOut) ? '#22C55E' : '#C8960C' }}>
                        {si === 0 ? (s.checkedIn ? 'Arrived ✓' : 'Mark Arrived') : (s.checkedOut ? 'Collected ✓' : 'Mark Collected')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'schedule' && (
        <div style={cardStyle}>
          <div className="grid grid-cols-5 gap-2">
            {weekDays.map(day => (
              <div key={day} className="text-center">
                <p className="text-xs font-bold mb-2" style={{ color: '#F9FAFB' }}>{day}</p>
                <div className="space-y-2">
                  <div className="rounded-lg p-2" style={{ backgroundColor: 'rgba(245,158,11,0.1)' }}>
                    <p className="text-[10px] font-semibold" style={{ color: '#F59E0B' }}>AM 7:30-8:30</p>
                    <p className="text-[10px]" style={{ color: '#6B7280' }}>5 students</p>
                    <p className="text-[10px]" style={{ color: '#9CA3AF' }}>Sarah M.</p>
                  </div>
                  <div className="rounded-lg p-2" style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}>
                    <p className="text-[10px] font-semibold" style={{ color: '#3B82F6' }}>PM 3:30-5:30</p>
                    <p className="text-[10px]" style={{ color: '#6B7280' }}>6 students</p>
                    <p className="text-[10px]" style={{ color: '#9CA3AF' }}>James O.</p>
                  </div>
                </div>
                <p className="text-[10px] mt-1" style={{ color: '#4B5563' }}>Cap: 8/10</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'enrolled' && (
        <div className="rounded-xl overflow-hidden" style={{ ...darkBg }}>
          <table className="w-full text-xs">
            <thead><tr style={tblHead}>
              {['Student', 'Programme', 'Parent Contact', 'Notes'].map(h => <th key={h} style={thStyle}>{h}</th>)}
            </tr></thead>
            <tbody>
              {enrolled.map((s: any, i: number) => (
                <tr key={i}>
                  <td style={{ ...tdStyle, color: '#F9FAFB', fontWeight: 600 }}>{s.name}</td>
                  <td style={tdStyle}><span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488' }}>{s.programme}</span></td>
                  <td style={{ ...tdStyle, color: '#D1D5DB' }}>{s.parentContact}</td>
                  <td style={{ ...tdStyle, color: '#6B7280' }}>—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'billing' && (
        <div className="space-y-4">
          <div style={cardStyle}>
            <h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Hours This Month</h4>
            <div className="space-y-2">
              {enrolled.slice(0, 5).map((s: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #1F293740' }}>
                  <span className="text-xs" style={{ color: '#F9FAFB' }}>{s.name}</span>
                  <span className="text-xs font-bold" style={{ color: '#0D9488' }}>{12 + i * 3} hrs</span>
                </div>
              ))}
            </div>
            <button className="mt-4 text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5" style={{ backgroundColor: '#C8960C', color: '#fff' }}><Download size={12} /> Export Invoice</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. INSPECTION MODE
// ═══════════════════════════════════════════════════════════════════════════════

export function InspectionModePage() {
  const [tab, setTab] = useState('evidence')
  const [generating, setGenerating] = useState<string | null>(null)
  const tabs = [
    { id: 'evidence', label: 'Evidence Packs', icon: '📦' },
    { id: 'self', label: 'Self Assessment', icon: '📊' },
    { id: 'compliance', label: 'Compliance', icon: '✅' },
    { id: 'mock', label: 'Mock Inspection', icon: '🔍' },
  ]

  const [ratings, setRatings] = useState<Record<string, string>>({
    'Teaching Quality': 'green', 'Student Progress': 'green', 'SEND Support': 'amber',
    'Staff Training': 'amber', 'Data Management': 'green', 'Parent Engagement': 'amber', 'Safeguarding': 'green',
  })

  function handleGenerate(id: string) { setGenerating(id); setTimeout(() => setGenerating(null), 2000) }

  return (
    <div className="space-y-4 p-4">
      <PageHeader icon={<ClipboardList size={20} style={{ color: '#0D9488' }} />} title="Inspection Mode" subtitle="Prepare evidence for district or state inspection" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Evidence Packs" value={4} color="#0D9488" />
        <StatCard label="Self Assessment" value="5/7 Green" color="#22C55E" />
        <StatCard label="Compliance Items" value="6/7" color="#F59E0B" />
        <StatCard label="Mock Score" value="Good" color="#3B82F6" />
      </div>
      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'evidence' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { id: 'lang', title: 'Language & Literacy Evidence Pack', desc: 'TEL TED impact data, assessment scores, intervention records', icon: '📖' },
            { id: 'progress', title: 'Student Progress Pack', desc: 'Individual profiles, score trajectories, support plans', icon: '📈' },
            { id: 'staff', title: 'Staff Training Records', desc: 'CPD logs, TEL TED certification, safeguarding training', icon: '🎓' },
            { id: 'summary', title: 'State Inspection Summary', desc: 'Complete programme overview for district/state inspection', icon: '🛡️' },
          ].map(pack => (
            <div key={pack.id} className="rounded-xl p-5" style={{ ...darkBg }}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{pack.icon}</span>
                <div>
                  <h4 className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{pack.title}</h4>
                  <p className="text-xs" style={{ color: '#6B7280' }}>{pack.desc}</p>
                </div>
              </div>
              <button onClick={() => handleGenerate(pack.id)} disabled={generating === pack.id}
                className="w-full text-xs font-semibold py-2.5 rounded-lg flex items-center justify-center gap-1.5"
                style={{ backgroundColor: generating === pack.id ? '#1F2937' : '#0D9488', color: '#F9FAFB' }}>
                {generating === pack.id ? <><Loader2 size={12} className="animate-spin" /> Generating...</> : <><Download size={12} /> Generate PDF</>}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'self' && (
        <div style={cardStyle}>
          <h4 className="text-sm font-bold mb-4" style={{ color: '#F9FAFB' }}>RAG Self-Assessment</h4>
          <div className="space-y-3">
            {Object.entries(ratings).map(([cat, rating]) => (
              <div key={cat} className="flex items-center gap-3 py-2" style={{ borderBottom: '1px solid #1F293740' }}>
                <span className="text-xs font-semibold w-40" style={{ color: '#F9FAFB' }}>{cat}</span>
                <div className="flex gap-1.5">
                  {['red', 'amber', 'green'].map(r => (
                    <button key={r} onClick={() => setRatings(prev => ({ ...prev, [cat]: r }))}
                      className="w-6 h-6 rounded-full"
                      style={{
                        backgroundColor: r === 'red' ? '#EF4444' : r === 'amber' ? '#F59E0B' : '#22C55E',
                        opacity: rating === r ? 1 : 0.25,
                        border: rating === r ? '2px solid #fff' : '2px solid transparent',
                      }} />
                  ))}
                </div>
                <span className="text-[10px] ml-2" style={{ color: '#6B7280' }}>
                  {rating === 'green' ? 'Strong evidence available' : rating === 'amber' ? 'Some evidence, needs strengthening' : 'Immediate action required'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'compliance' && (
        <div style={cardStyle}>
          <h4 className="text-sm font-bold mb-4" style={{ color: '#F9FAFB' }}>Compliance Checklist</h4>
          <div className="space-y-2">
            {[
              { item: 'FERPA compliant', status: true },
              { item: 'COPPA compliant', status: true },
              { item: 'Student data encrypted', status: true },
              { item: 'Staff DBS checks (3/4 current — 1 warning)', status: 'warn' },
              { item: 'Safeguarding policy current', status: true },
              { item: 'Annual safeguarding training refresh due', status: 'warn' },
              { item: 'TEL TED programme documentation complete', status: true },
            ].map((c, i) => (
              <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg" style={{ backgroundColor: '#0D0E14' }}>
                <span style={{ color: c.status === true ? '#22C55E' : '#F59E0B', fontSize: 14 }}>{c.status === true ? '✅' : '⚠️'}</span>
                <span className="text-xs" style={{ color: '#F9FAFB' }}>{c.item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'mock' && (
        <div className="space-y-4">
          <div style={cardStyle}>
            <h4 className="text-sm font-bold mb-4" style={{ color: '#F9FAFB' }}>Mock Inspection Questions</h4>
            <div className="space-y-4">
              {[
                { q: 'How do you identify students with language difficulties?', evidence: 'LanguageScreen assessment data, SEND register, teacher referrals', rating: 'Good' },
                { q: 'What impact has the TEL TED programme had on student outcomes?', evidence: `Average gain of +${neliAvgGain} points for TEL TED students, class average improved from ${classAvgI} to ${classAvgE}`, rating: 'Outstanding' },
                { q: 'How do you ensure interventions are delivered consistently?', evidence: 'Session tracking, staff timetable, weekly monitoring by coordinator', rating: 'Good' },
                { q: 'How are parents informed about their child\'s progress?', evidence: 'Termly progress reports, parent meetings, home-school link resources', rating: 'Requires Improvement' },
                { q: 'What training have staff received to deliver the programme?', evidence: 'FutureLearn course completion records, CPD hours logs', rating: 'Good' },
              ].map((item, i) => (
                <div key={i} className="rounded-lg p-4" style={{ backgroundColor: '#0D0E14' }}>
                  <p className="text-xs font-bold mb-2" style={{ color: '#F9FAFB' }}>Q{i + 1}: {item.q}</p>
                  <p className="text-[10px] mb-2" style={{ color: '#9CA3AF' }}>Evidence: {item.evidence}</p>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{
                    backgroundColor: item.rating === 'Outstanding' ? 'rgba(34,197,94,0.15)' : item.rating === 'Good' ? 'rgba(59,130,246,0.15)' : 'rgba(245,158,11,0.15)',
                    color: item.rating === 'Outstanding' ? '#22C55E' : item.rating === 'Good' ? '#60A5FA' : '#F59E0B',
                  }}>{item.rating}</span>
                </div>
              ))}
            </div>
          </div>
          <button className="text-xs font-semibold px-4 py-2.5 rounded-lg" style={{ backgroundColor: '#C8960C', color: '#fff' }}>Generate Mock Inspection Report</button>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. ROSTERING
// ═══════════════════════════════════════════════════════════════════════════════

export function RosteringPage() {
  const [tab, setTab] = useState('groups')
  const [syncing, setSyncing] = useState(false)
  const [synced, setSynced] = useState(false)
  const tabs = [
    { id: 'groups', label: 'Student Groups', icon: '👥' },
    { id: 'schedule', label: 'Session Schedule', icon: '📅' },
    { id: 'assignments', label: 'Staff Assignments', icon: '🔗' },
    { id: 'sync', label: 'Sync Status', icon: '🔄' },
  ]

  const groupA = PUPILS.filter((p: any) => p.class === 'A' && p.neli)
  const groupB = PUPILS.filter((p: any) => p.neli && p.class !== 'A')

  return (
    <div className="space-y-4 p-4">
      <PageHeader icon={<Calendar size={20} style={{ color: '#0D9488' }} />} title="Rostering" subtitle="Manage student groups, session schedules, and staff assignments" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="TEL TED Groups" value={2} color="#0D9488" />
        <StatCard label="Students Rostered" value={neliPupils.length} color="#C8960C" />
        <StatCard label="Sessions/Week" value={8} color="#3B82F6" />
        <StatCard label="Staff Assigned" value={2} color="#8B5CF6" />
      </div>
      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'groups' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5" style={{ backgroundColor: '#0D9488', color: '#fff' }}><Plus size={12} /> Create New Group</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'Group A', lead: 'Mrs Mitchell', students: groupA, color: '#0D9488' },
              { name: 'Group B', lead: 'Mr Okafor', students: groupB.length > 0 ? groupB : PUPILS.filter((p: any) => p.neli).slice(0, 2), color: '#C8960C' },
            ].map((group, gi) => (
              <div key={gi} className="rounded-xl p-4" style={{ ...darkBg }}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold" style={{ color: group.color }}>{group.name}</h4>
                  <span className="text-[10px]" style={{ color: '#6B7280' }}>Lead: {group.lead}</span>
                </div>
                <div className="space-y-2">
                  {group.students.map((p: any) => (
                    <div key={p.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg" style={{ backgroundColor: '#0D0E14' }}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ backgroundColor: group.color + '20', color: group.color }}>
                        {p.name.split(' ').map((w: string) => w[0]).join('')}
                      </div>
                      <span className="text-xs" style={{ color: '#F9FAFB' }}>{p.name}</span>
                      <span className="text-[9px] ml-auto" style={{ color: '#6B7280' }}>Score: {p.es ?? p.is}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'schedule' && (
        <div style={cardStyle}>
          <h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Weekly Session Grid</h4>
          <div className="rounded-xl overflow-hidden" style={{ ...darkBg }}>
            <table className="w-full text-xs">
              <thead><tr style={tblHead}>
                <th style={thStyle}>Time</th>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(d => <th key={d} style={{ ...thStyle, textAlign: 'center' }}>{d}</th>)}
              </tr></thead>
              <tbody>
                {[
                  { time: '8:30 AM', slots: ['Group A', 'Group A', 'Group A', '—', '—'] },
                  { time: '9:15 AM', slots: ['Individual', 'Individual', '—', 'Individual', '—'] },
                  { time: '10:00 AM', slots: ['—', 'Individual', '—', 'Individual', '—'] },
                  { time: '11:30 AM', slots: ['—', '—', 'Group B', '—', 'Group B'] },
                  { time: '2:00 PM', slots: ['—', '—', '—', 'Assessment', '—'] },
                ].map((row, i) => (
                  <tr key={i}>
                    <td style={{ ...tdStyle, color: '#F9FAFB', fontWeight: 600 }}>{row.time}</td>
                    {row.slots.map((slot, si) => (
                      <td key={si} style={{ ...tdStyle, textAlign: 'center' }}>
                        {slot !== '—' ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{
                            backgroundColor: slot.includes('Group A') ? 'rgba(13,148,136,0.15)' : slot.includes('Group B') ? 'rgba(200,150,12,0.15)' : slot === 'Individual' ? 'rgba(59,130,246,0.15)' : 'rgba(139,92,246,0.15)',
                            color: slot.includes('Group A') ? '#0D9488' : slot.includes('Group B') ? '#C8960C' : slot === 'Individual' ? '#60A5FA' : '#A78BFA',
                          }}>{slot}</span>
                        ) : <span style={{ color: '#374151' }}>—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'assignments' && (
        <div className="space-y-4">
          {[
            { staff: 'Sarah Mitchell', role: 'Group A TEL TED Lead', students: groupA.map((p: any) => p.name), sessions: 'Group + Individual', color: '#0D9488' },
            { staff: 'James Okafor', role: 'Group A Individual Sessions', students: groupA.slice(0, 2).map((p: any) => p.name), sessions: 'Individual only', color: '#3B82F6' },
          ].map((a, i) => (
            <div key={i} className="rounded-xl p-4" style={{ ...darkBg }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: a.color + '20', color: a.color }}>
                  {a.staff.split(' ').map(w => w[0]).join('')}
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{a.staff}</p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>{a.role} · {a.sessions}</p>
                </div>
              </div>
              <div className="flex gap-1 flex-wrap">
                {a.students.map((name: string, ni: number) => (
                  <span key={ni} className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: '#1F2937', color: '#D1D5DB' }}>{name}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'sync' && (
        <div className="space-y-4">
          {[
            { name: 'OneRoster', desc: 'Open standard for student/staff rostering', connected: false },
            { name: 'Clever', desc: "Sync via Clever's rostering platform", connected: false },
          ].map((sys, i) => (
            <div key={i} className="rounded-xl p-4" style={{ ...darkBg }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{sys.name}</p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>{sys.desc}</p>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(107,114,128,0.15)', color: '#6B7280' }}>Not Connected</span>
              </div>
              <button className="mt-3 text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#0D9488', color: '#fff' }}>Connect</button>
            </div>
          ))}
          <div className="rounded-xl p-4" style={{ ...darkBg }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Manual Sync</p>
                <p className="text-xs" style={{ color: '#6B7280' }}>Students: {PUPILS.length} · Staff: {STAFF.length}</p>
              </div>
              <button onClick={() => { setSyncing(true); setTimeout(() => { setSyncing(false); setSynced(true) }, 2000) }}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5" style={{ backgroundColor: syncing ? '#1F2937' : '#C8960C', color: '#fff' }}>
                {syncing ? <><Loader2 size={12} className="animate-spin" /> Syncing...</> : <><RefreshCw size={12} /> Sync Now</>}
              </button>
            </div>
            {synced && <p className="text-xs" style={{ color: '#22C55E' }}>✓ Sync complete: {PUPILS.length} students, {STAFF.length} staff updated</p>}
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 7. MIS SYNC
// ═══════════════════════════════════════════════════════════════════════════════

export function MisSyncPage() {
  const [tab, setTab] = useState('systems')
  const [connecting, setConnecting] = useState<string | null>(null)
  const [connected, setConnected] = useState<Record<string, boolean>>({})
  const [syncFreq, setSyncFreq] = useState('Manual')
  const [syncDirection, setSyncDirection] = useState('Import only')
  const [emailNotif, setEmailNotif] = useState(true)
  const tabs = [
    { id: 'systems', label: 'Connected Systems', icon: '🔗' },
    { id: 'history', label: 'Sync History', icon: '📜' },
    { id: 'mapping', label: 'Data Mapping', icon: '🗺️' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ]

  const systems = [
    { id: 'infinite', name: 'Infinite Campus', desc: 'Student information system', popular: 'Texas' },
    { id: 'powerschool', name: 'PowerSchool', desc: 'K-12 education technology', popular: 'California' },
    { id: 'skyward', name: 'Skyward', desc: 'School management software', popular: 'Washington' },
    { id: 'clever', name: 'Clever', desc: 'SSO and rostering platform', popular: 'Nationwide' },
    { id: 'oneroster', name: 'OneRoster API', desc: 'Open standard for education data', popular: 'Nationwide' },
  ]

  function handleConnect(id: string) {
    setConnecting(id)
    setTimeout(() => { setConnecting(null); setConnected(prev => ({ ...prev, [id]: true })) }, 2000)
  }

  const mappings = [
    { external: 'Student ID', lumio: 'Lumio Student ID' },
    { external: 'First Name', lumio: 'First Name' },
    { external: 'Last Name', lumio: 'Last Name' },
    { external: 'Grade Level', lumio: 'Grade' },
    { external: 'Teacher', lumio: 'Assigned Staff' },
    { external: 'Enrollment Status', lumio: 'Active Status' },
  ]

  return (
    <div className="space-y-4 p-4">
      <PageHeader icon={<Database size={20} style={{ color: '#0D9488' }} />} title="MIS Sync" subtitle="Connect and sync with your school management information system" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Systems Connected" value={Object.values(connected).filter(Boolean).length} color="#0D9488" />
        <StatCard label="Last Sync" value="Never" color="#6B7280" />
        <StatCard label="Students" value={PUPILS.length} color="#3B82F6" />
        <StatCard label="Staff" value={STAFF.length} color="#8B5CF6" />
      </div>
      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'systems' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {systems.map(sys => (
            <div key={sys.id} className="rounded-xl p-4" style={{ ...darkBg }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{sys.name}</p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>{sys.desc}</p>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: '#A78BFA' }}>Popular in {sys.popular}</span>
              </div>
              {connected[sys.id] ? (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22C55E' }}>Connected</span>
                  <button className="text-[10px] px-2 py-1 rounded" style={{ color: '#EF4444' }}>Disconnect</button>
                </div>
              ) : (
                <button onClick={() => handleConnect(sys.id)} disabled={connecting === sys.id}
                  className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: connecting === sys.id ? '#1F2937' : '#0D9488', color: '#fff' }}>
                  {connecting === sys.id ? 'Connecting...' : 'Connect'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'history' && (
        <div className="flex flex-col items-center justify-center py-12" style={{ ...darkBg, borderRadius: 16 }}>
          <Database size={48} style={{ color: '#1F2937', marginBottom: 12 }} />
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>No syncs completed yet</p>
          <p className="text-xs" style={{ color: '#6B7280' }}>Connect a system above to begin syncing</p>
          <button className="mt-4 text-xs font-semibold px-3 py-2 rounded-lg" style={{ backgroundColor: '#C8960C', color: '#fff' }}>Run Manual Sync</button>
        </div>
      )}

      {tab === 'mapping' && (
        <div className="rounded-xl overflow-hidden" style={{ ...darkBg }}>
          <table className="w-full text-xs">
            <thead><tr style={tblHead}>
              {['External Field', '', 'Lumio Field', 'Action'].map(h => <th key={h} style={thStyle}>{h}</th>)}
            </tr></thead>
            <tbody>
              {mappings.map((m, i) => (
                <tr key={i}>
                  <td style={{ ...tdStyle, color: '#D1D5DB' }}>{m.external}</td>
                  <td style={{ ...tdStyle, color: '#4B5563', textAlign: 'center' }}>→</td>
                  <td style={{ ...tdStyle, color: '#0D9488', fontWeight: 600 }}>{m.lumio}</td>
                  <td style={tdStyle}><button className="text-[10px] px-2 py-1 rounded" style={{ backgroundColor: 'rgba(13,148,136,0.1)', color: '#0D9488' }}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'settings' && (
        <div style={cardStyle}>
          <div className="space-y-4">
            {[
              { label: 'Sync Frequency', value: syncFreq, options: ['Manual', 'Daily', 'Weekly'], onChange: setSyncFreq },
              { label: 'Sync Direction', value: syncDirection, options: ['Import only', 'Bidirectional'], onChange: setSyncDirection },
            ].map((field, i) => (
              <div key={i}>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: '#9CA3AF' }}>{field.label}</label>
                <div className="flex gap-2">
                  {field.options.map(opt => (
                    <button key={opt} onClick={() => field.onChange(opt)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                      style={{ backgroundColor: field.value === opt ? '#0D9488' : '#1F2937', color: field.value === opt ? '#fff' : '#6B7280' }}>{opt}</button>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex items-center gap-3">
              <div onClick={() => setEmailNotif(!emailNotif)} style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: emailNotif ? '#0D9488' : '#374151', position: 'relative', cursor: 'pointer' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: '#fff', position: 'absolute', top: 3, left: emailNotif ? 23 : 3, transition: 'left 0.2s' }} />
              </div>
              <span className="text-xs" style={{ color: '#D1D5DB' }}>Email notification on sync</span>
            </div>
            <button className="text-xs font-semibold px-4 py-2 rounded-lg" style={{ backgroundColor: '#C8960C', color: '#fff' }}>Save Settings</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 8. WORKFLOWS
// ═══════════════════════════════════════════════════════════════════════════════

export function WorkflowsPage() {
  const [tab, setTab] = useState('active')
  const [workflowStates, setWorkflowStates] = useState<Record<string, boolean>>({ alert: true, reminder: true, digest: true })
  const tabs = [
    { id: 'active', label: 'Active Workflows', icon: '⚡' },
    { id: 'templates', label: 'Templates', icon: '📑' },
    { id: 'history', label: 'History', icon: '📜' },
    { id: 'create', label: 'Create New', icon: '➕' },
  ]

  const [trigger, setTrigger] = useState('')
  const [action, setAction] = useState('')
  const [wfName, setWfName] = useState('')

  const activeWorkflows = [
    { id: 'alert', name: 'At-Risk Student Alert', trigger: 'Student scores below 85', action: 'Email TEL TED coordinator', runs: 12 },
    { id: 'reminder', name: 'Session Reminder', trigger: '30 min before scheduled session', action: 'Push notification to staff', runs: 48 },
    { id: 'digest', name: 'Weekly Progress Digest', trigger: 'Every Friday at 4pm', action: 'Email district summary report', runs: 16 },
  ]

  const templates = [
    'Parent Communication Trigger', 'Assessment Due Reminder', 'New Student Onboarding',
    'End of Term Report Generation', 'Staff Training Reminder', 'Attendance Alert',
  ]

  const historyData = Array.from({ length: 15 }, (_, i) => ({
    date: `Mar ${28 - i}, 2026 ${9 + (i % 8)}:${String((i * 17) % 60).padStart(2, '0')}`,
    workflow: activeWorkflows[i % 3].name,
    trigger: activeWorkflows[i % 3].trigger,
    action: activeWorkflows[i % 3].action,
    result: i === 5 ? 'Failed' : 'Success',
  }))

  return (
    <div className="space-y-4 p-4">
      <PageHeader icon={<GitBranch size={20} style={{ color: '#0D9488' }} />} title="Workflows" subtitle="Automate tasks with triggers, conditions, and actions" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Active Workflows" value={Object.values(workflowStates).filter(Boolean).length} color="#0D9488" />
        <StatCard label="Total Runs" value={76} color="#3B82F6" />
        <StatCard label="Templates" value={6} color="#8B5CF6" />
        <StatCard label="Success Rate" value="98%" color="#22C55E" />
      </div>
      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'active' && (
        <div className="space-y-3">
          {activeWorkflows.map(wf => (
            <div key={wf.id} className="rounded-xl p-4" style={{ ...darkBg }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{wf.name}</h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: workflowStates[wf.id] ? 'rgba(34,197,94,0.15)' : 'rgba(107,114,128,0.15)', color: workflowStates[wf.id] ? '#22C55E' : '#6B7280' }}>
                    {workflowStates[wf.id] ? 'Active' : 'Paused'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div onClick={() => setWorkflowStates(prev => ({ ...prev, [wf.id]: !prev[wf.id] }))}
                    style={{ width: 36, height: 20, borderRadius: 10, backgroundColor: workflowStates[wf.id] ? '#0D9488' : '#374151', position: 'relative', cursor: 'pointer' }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: '#fff', position: 'absolute', top: 3, left: workflowStates[wf.id] ? 19 : 3, transition: 'left 0.2s' }} />
                  </div>
                  <button className="text-[10px] px-2 py-1 rounded" style={{ color: '#EF4444' }}><Trash2 size={10} /></button>
                </div>
              </div>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>Trigger: {wf.trigger}</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>Action: {wf.action}</p>
              <p className="text-[10px] mt-1" style={{ color: '#4B5563' }}>{wf.runs} executions</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {templates.map((t, i) => (
            <div key={i} className="rounded-xl p-4" style={{ ...darkBg }}>
              <p className="text-sm font-bold mb-2" style={{ color: '#F9FAFB' }}>{t}</p>
              <button className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#0D9488', color: '#fff' }}>Use Template</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'history' && (
        <div className="rounded-xl overflow-hidden" style={{ ...darkBg }}>
          <table className="w-full text-xs">
            <thead><tr style={tblHead}>
              {['Date/Time', 'Workflow', 'Trigger', 'Action', 'Result'].map(h => <th key={h} style={thStyle}>{h}</th>)}
            </tr></thead>
            <tbody>
              {historyData.map((h, i) => (
                <tr key={i}>
                  <td style={{ ...tdStyle, color: '#D1D5DB' }}>{h.date}</td>
                  <td style={{ ...tdStyle, color: '#F9FAFB', fontWeight: 600 }}>{h.workflow}</td>
                  <td style={{ ...tdStyle, color: '#9CA3AF' }}>{h.trigger}</td>
                  <td style={{ ...tdStyle, color: '#9CA3AF' }}>{h.action}</td>
                  <td style={tdStyle}>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: h.result === 'Success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: h.result === 'Success' ? '#22C55E' : '#EF4444' }}>{h.result}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'create' && (
        <div style={cardStyle}>
          <h4 className="text-sm font-bold mb-4" style={{ color: '#F9FAFB' }}>Create New Workflow</h4>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: '#9CA3AF' }}>Step 1: Choose Trigger</label>
              <select value={trigger} onChange={e => setTrigger(e.target.value)} className="w-full p-2.5 rounded-lg text-xs" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937', color: '#F9FAFB' }}>
                <option value="">Select trigger...</option>
                {['Student score change', 'Session scheduled', 'Assessment due', 'Weekly digest', 'Manual'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: '#9CA3AF' }}>Step 2: Add Condition (optional)</label>
              <input type="text" placeholder="e.g. Score < 85" className="w-full p-2.5 rounded-lg text-xs" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937', color: '#F9FAFB' }} />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: '#9CA3AF' }}>Step 3: Choose Action</label>
              <select value={action} onChange={e => setAction(e.target.value)} className="w-full p-2.5 rounded-lg text-xs" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937', color: '#F9FAFB' }}>
                <option value="">Select action...</option>
                {['Send email', 'Send notification', 'Generate report', 'Update record'].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: '#9CA3AF' }}>Step 4: Name & Save</label>
              <input type="text" value={wfName} onChange={e => setWfName(e.target.value)} placeholder="Workflow name..." className="w-full p-2.5 rounded-lg text-xs" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937', color: '#F9FAFB' }} />
            </div>
            <button className="text-xs font-semibold px-4 py-2.5 rounded-lg" style={{ backgroundColor: trigger && action && wfName ? '#0D9488' : '#1F2937', color: '#fff' }}>Save Workflow</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 9. REPORTS (TOOLS SECTION)
// ═══════════════════════════════════════════════════════════════════════════════

export function ReportsToolPage() {
  const [tab, setTab] = useState('all')
  const [filter, setFilter] = useState('all')
  const [generating, setGenerating] = useState<string | null>(null)
  const tabs = [
    { id: 'all', label: 'All Reports', icon: '📋' },
    { id: 'scheduled', label: 'Scheduled', icon: '⏰' },
    { id: 'shared', label: 'Shared', icon: '👥' },
    { id: 'archive', label: 'Archive', icon: '📁' },
  ]

  const reports = [
    { id: 'term-summary', name: 'End of Term TEL TED Summary', desc: 'Full cohort overview with band distribution and progress.', lastGen: 'Mar 18, 2026', cat: 'Progress', schedule: null },
    { id: 'pupil-progress', name: 'Student Progress Report', desc: 'Individual student language journey with score trajectory.', lastGen: 'Mar 14, 2026', cat: 'Progress', schedule: null },
    { id: 'at-risk', name: 'Cohort At-Risk Report', desc: 'Students below threshold with recommended actions.', lastGen: 'Mar 20, 2026', cat: 'Assessment', schedule: null },
    { id: 'subtest', name: 'Subtest Analysis Report', desc: 'School-wide breakdown across 4 LanguageScreen subtests.', lastGen: 'Mar 12, 2026', cat: 'Assessment', schedule: null },
    { id: 'inspection', name: 'State Inspection Evidence Pack', desc: 'Structured evidence for inspection readiness.', lastGen: 'Mar 10, 2026', cat: 'Compliance', schedule: null },
    { id: 'parent', name: 'Parent Communication Report', desc: 'Plain-English progress summaries for parents.', lastGen: 'Mar 22, 2026', cat: 'Communication', schedule: null },
    { id: 'svor', name: 'Simple View of Reading', desc: 'Language comprehension vs word decoding analysis.', lastGen: '—', cat: 'Assessment', schedule: null },
    { id: 'class-dashboard', name: 'Class Dashboard', desc: 'All students showing first and last assessment scores.', lastGen: '—', cat: 'Progress', schedule: null },
  ]

  const filters = ['all', 'Assessment', 'Progress', 'Compliance', 'Communication']
  const filtered = filter === 'all' ? reports : reports.filter(r => r.cat === filter)

  function handleGenerate(id: string) { setGenerating(id); setTimeout(() => setGenerating(null), 2000) }

  return (
    <div className="space-y-4 p-4">
      <PageHeader icon={<FileText size={20} style={{ color: '#0D9488' }} />} title="Reports" subtitle="Generate, schedule, share, and archive professional reports" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Report Types" value={reports.length} color="#0D9488" />
        <StatCard label="Generated This Month" value={6} color="#3B82F6" />
        <StatCard label="Scheduled" value={2} color="#C8960C" />
        <StatCard label="Shared" value={3} color="#8B5CF6" />
      </div>
      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'all' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {filters.map(f => (
              <button key={f} onClick={() => setFilter(f)} className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{ backgroundColor: filter === f ? '#C8960C' : '#111318', color: filter === f ? '#fff' : '#6B7280', border: filter === f ? '1px solid #C8960C' : '1px solid #1F2937' }}>
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map(r => (
              <div key={r.id} className="rounded-xl p-4" style={{ ...darkBg }}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{r.name}</h4>
                    <p className="text-[10px]" style={{ color: '#6B7280' }}>{r.desc}</p>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded flex-shrink-0" style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: '#A78BFA' }}>{r.cat}</span>
                </div>
                <p className="text-[10px] mb-3" style={{ color: '#4B5563' }}>Last generated: {r.lastGen}</p>
                <div className="flex gap-2">
                  <button onClick={() => handleGenerate(r.id)} className="text-[10px] font-semibold px-3 py-1.5 rounded-lg"
                    style={{ backgroundColor: generating === r.id ? '#1F2937' : '#0D9488', color: '#fff' }}>
                    {generating === r.id ? 'Generating...' : 'Generate'}
                  </button>
                  <button className="text-[10px] font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#1F2937', color: '#D1D5DB' }}><Download size={10} /> Download</button>
                  <button className="text-[10px] font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#1F2937', color: '#D1D5DB' }}>Schedule</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'scheduled' && (
        <div className="space-y-3">
          {[
            { name: 'Weekly Progress Digest', schedule: 'Every Friday at 4:00 PM', next: 'Apr 4, 2026' },
            { name: 'Monthly District Summary', schedule: '1st of each month at 9:00 AM', next: 'May 1, 2026' },
          ].map((s, i) => (
            <div key={i} className="rounded-xl p-4" style={{ ...darkBg }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{s.name}</p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>{s.schedule}</p>
                  <p className="text-[10px]" style={{ color: '#6B7280' }}>Next run: {s.next}</p>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22C55E' }}>Active</span>
              </div>
            </div>
          ))}
          <button className="text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5" style={{ backgroundColor: '#0D9488', color: '#fff' }}><Plus size={12} /> Add Schedule</button>
        </div>
      )}

      {tab === 'shared' && (
        <div className="space-y-3">
          {[
            { name: 'End of Term Summary', sharedWith: ['Dr. Rebecca Lawson', 'District Admin'], date: 'Mar 18, 2026' },
            { name: 'At-Risk Report', sharedWith: ['David Chen', 'District SEND Lead'], date: 'Mar 20, 2026' },
            { name: 'Inspection Evidence Pack', sharedWith: ['District Admin'], date: 'Mar 10, 2026' },
          ].map((s, i) => (
            <div key={i} className="rounded-xl p-4" style={{ ...darkBg }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{s.name}</p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>Shared with: {s.sharedWith.join(', ')}</p>
                  <p className="text-[10px]" style={{ color: '#6B7280' }}>Shared on: {s.date}</p>
                </div>
                <button className="text-[10px] px-2 py-1 rounded" style={{ color: '#EF4444' }}>Revoke Access</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'archive' && (
        <div className="space-y-4">
          <div className="rounded-xl p-3" style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <p className="text-xs" style={{ color: '#FBBF24' }}>Reports are retained for 30 days. Download important reports before they expire.</p>
          </div>
          <div className="rounded-xl overflow-hidden" style={{ ...darkBg }}>
            <table className="w-full text-xs">
              <thead><tr style={tblHead}>
                {['Date', 'Report Name', 'Generated By', 'Download'].map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr></thead>
              <tbody>
                {[
                  { date: 'Mar 22, 2026', name: 'Parent Communication Report', by: 'Sarah Mitchell' },
                  { date: 'Mar 20, 2026', name: 'At-Risk Report', by: 'Sarah Mitchell' },
                  { date: 'Mar 18, 2026', name: 'End of Term Summary', by: 'Sarah Mitchell' },
                  { date: 'Mar 14, 2026', name: 'Student Progress Report', by: 'David Chen' },
                  { date: 'Mar 12, 2026', name: 'Subtest Analysis', by: 'Sarah Mitchell' },
                  { date: 'Mar 10, 2026', name: 'Inspection Evidence Pack', by: 'Sarah Mitchell' },
                ].map((r, i) => (
                  <tr key={i}>
                    <td style={{ ...tdStyle, color: '#D1D5DB' }}>{r.date}</td>
                    <td style={{ ...tdStyle, color: '#F9FAFB', fontWeight: 600 }}>{r.name}</td>
                    <td style={{ ...tdStyle, color: '#9CA3AF' }}>{r.by}</td>
                    <td style={tdStyle}><button className="text-[10px] px-2 py-1 rounded flex items-center gap-1" style={{ backgroundColor: 'rgba(13,148,136,0.1)', color: '#0D9488' }}><Download size={10} /> PDF</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
