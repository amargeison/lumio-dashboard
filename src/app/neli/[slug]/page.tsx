'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { PUPILS, type Pupil } from '@/components/neli/data'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ComposedChart, Cell } from 'recharts'
import { CheckCircle2, Target, TrendingUp, AlertCircle, BookOpen, Award, ChevronRight, X } from 'lucide-react'

const LanguageScreenApp = dynamic(() => import('@/components/neli/LanguageScreenApp'), { ssr: false })

const T = {
  navy: '#1B3060', gold: '#C8960C', green: '#15803D', greenBg: '#DCFCE7',
  amber: '#B45309', amberBg: '#FFFBEB', red: '#B91C1C', redBg: '#FEF2F2',
  blue: '#1D4ED8', blueBg: '#EFF6FF', purple: '#7C3AED', purpleBg: '#F5F3FF',
  text: '#111827', muted: '#6B7280', border: '#E2DDD4', bg: '#F0EDE5',
  card: '#FFFFFF', light: '#F9FAFB',
}

type SubTab = 'dashboard' | 'languagescreen' | 'tracker'

const neliPupils = PUPILS.filter(p => p.neli)
const neliAvgGain = Math.round(neliPupils.reduce((s, p) => s + (p.es - p.is), 0) / neliPupils.length)
const redCount = PUPILS.filter(p => p.is < 85).length

function bandColor(score: number) { return score >= 100 ? T.green : score >= 85 ? T.amber : T.red }
function bandLabel(score: number) { return score >= 100 ? 'On Track' : score >= 85 ? 'Monitor' : 'At Risk' }

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color?: string }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
      <p className="text-xs font-semibold mb-1" style={{ color: T.muted }}>{label}</p>
      <p className="text-2xl font-black" style={{ color: color || T.navy, fontFamily: 'Georgia, serif' }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: T.muted }}>{sub}</p>
    </div>
  )
}

export default function NELIPortalPage() {
  const [subTab, setSubTab] = useState<SubTab>('dashboard')
  const [assessPupil, setAssessPupil] = useState<Pupil | null>(null)

  const TABS: { id: SubTab; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'languagescreen', label: 'LanguageScreen' },
    { id: 'tracker', label: 'NELI Tracker' },
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: T.bg }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: T.navy }}>NELI Portal</h1>
          <p className="text-sm mt-0.5" style={{ color: T.muted }}>Parkside Primary · Reception 2024–25</p>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-2 mb-6">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setSubTab(t.id)} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{
              backgroundColor: subTab === t.id ? T.navy : T.card,
              color: subTab === t.id ? '#fff' : T.muted,
              border: subTab === t.id ? 'none' : `1px solid ${T.border}`,
            }}>{t.label}</button>
          ))}
        </div>

        {subTab === 'dashboard' && <DashboardView onAssess={setAssessPupil} />}
        {subTab === 'languagescreen' && (
          <div className="rounded-xl p-8 text-center" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
            <BookOpen size={40} style={{ color: T.navy, margin: '0 auto 12px' }} />
            <h3 className="text-lg font-bold mb-2" style={{ color: T.text }}>LanguageScreen Assessor</h3>
            <p className="text-sm mb-4" style={{ color: T.muted }}>Select a pupil from the Dashboard tab and click &quot;Assess Now&quot; to begin a LanguageScreen assessment.</p>
            <button onClick={() => setSubTab('dashboard')} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: T.navy, color: '#fff' }}>Go to Dashboard</button>
          </div>
        )}
        {subTab === 'tracker' && <TrackerView />}
      </div>

      {/* LanguageScreen Overlay */}
      {assessPupil && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <button onClick={() => setAssessPupil(null)} style={{ position: 'absolute', top: 16, right: 16, zIndex: 10000, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
            <X size={20} />
          </button>
          <LanguageScreenApp
            studentName={assessPupil.name}
            studentDob={assessPupil.dob}
            schoolName="Parkside Primary"
            assessorName="Sarah Mitchell"
            onClose={() => setAssessPupil(null)}
            onComplete={() => setAssessPupil(null)}
          />
        </div>
      )}
    </div>
  )
}

// ─── Dashboard View ─────────────────────────────────────────────────────────

function DashboardView({ onAssess }: { onAssess: (p: Pupil) => void }) {
  const [sortCol, setSortCol] = useState<'name' | 'is' | 'es' | 'sessions'>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const distribData = [
    { range: '<75', count: PUPILS.filter(p => p.is < 75).length, fill: '#EF4444' },
    { range: '75–84', count: PUPILS.filter(p => p.is >= 75 && p.is < 85).length, fill: '#F97316' },
    { range: '85–89', count: PUPILS.filter(p => p.is >= 85 && p.is < 90).length, fill: '#F59E0B' },
    { range: '90–94', count: PUPILS.filter(p => p.is >= 90 && p.is < 95).length, fill: '#84CC16' },
    { range: '95–99', count: PUPILS.filter(p => p.is >= 95 && p.is < 100).length, fill: '#22C55E' },
    { range: '100+', count: PUPILS.filter(p => p.is >= 100).length, fill: '#10B981' },
  ]
  const months = [{ month: 'Sep', score: 91 }, { month: 'Oct', score: 91.8 }, { month: 'Nov', score: 92.4 }, { month: 'Dec', score: 93.1 }, { month: 'Jan', score: 94.2 }, { month: 'Feb', score: 95.3 }, { month: 'Mar', score: 96.8 }]
  const neliCompare = neliPupils.map(p => ({ name: p.name.split(' ')[0], initial: p.is, end: p.es }))

  const sorted = [...PUPILS].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    if (sortCol === 'name') return a.name.localeCompare(b.name) * dir
    if (sortCol === 'is') return (a.is - b.is) * dir
    if (sortCol === 'es') return (a.es - b.es) * dir
    if (sortCol === 'sessions') return ((a.neliSessions || 0) - (b.neliSessions || 0)) * dir
    return 0
  })

  function toggleSort(col: typeof sortCol) { setSortDir(sortCol === col && sortDir === 'asc' ? 'desc' : 'asc'); setSortCol(col) }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Pupils Assessed" value={String(PUPILS.length)} sub="100% of cohort" color={T.green} />
        <StatCard label="NELI Pupils" value={String(neliPupils.length)} sub="On programme, week 17" color={T.navy} />
        <StatCard label="NELI Avg. Gain" value={`+${neliAvgGain}`} sub="Standard score points" color={T.green} />
        <StatCard label="Needs Attention" value={String(redCount)} sub="Below standard threshold" color={T.red} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl p-4" style={{ backgroundColor: T.card, border: `1px solid ${T.border}`, borderTop: `3px solid ${T.navy}` }}>
          <p className="text-sm font-bold mb-3" style={{ color: T.text }}>Class Score Distribution</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={distribData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="range" tick={{ fontSize: 10, fill: T.muted }} />
              <YAxis tick={{ fontSize: 10, fill: T.muted }} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>{distribData.map((d, i) => <Cell key={i} fill={d.fill} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: T.card, border: `1px solid ${T.border}`, borderTop: `3px solid ${T.gold}` }}>
          <p className="text-sm font-bold mb-3" style={{ color: T.text }}>NELI Intervention Impact</p>
          <ResponsiveContainer width="100%" height={180}>
            <ComposedChart data={neliCompare}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.muted }} />
              <YAxis domain={[55, 100]} tick={{ fontSize: 10, fill: T.muted }} />
              <Tooltip />
              <Bar dataKey="initial" fill="#FBBF24" radius={[3, 3, 0, 0]} name="Initial" />
              <Bar dataKey="end" fill={T.green} radius={[3, 3, 0, 0]} name="End" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Progress chart */}
      <div className="rounded-xl p-4" style={{ backgroundColor: T.card, border: `1px solid ${T.border}`, borderTop: `3px solid ${T.navy}` }}>
        <p className="text-sm font-bold mb-3" style={{ color: T.text }}>Class Progress Over Year</p>
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={months}>
            <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.navy} stopOpacity={0.15} /><stop offset="95%" stopColor={T.navy} stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: T.muted }} />
            <YAxis domain={[89, 98]} tick={{ fontSize: 10, fill: T.muted }} />
            <Tooltip />
            <Area type="monotone" dataKey="score" stroke={T.navy} fill="url(#pg)" strokeWidth={2} name="Avg. Score" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Pupil table */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
        <div className="px-5 py-3" style={{ borderBottom: `1px solid ${T.border}` }}>
          <p className="text-sm font-bold" style={{ color: T.text }}>All Pupils</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}`, backgroundColor: T.light }}>
                {[{ key: 'name' as const, label: 'Name' }, { key: 'is' as const, label: 'Initial' }, { key: 'es' as const, label: 'Current' }].map(h => (
                  <th key={h.key} onClick={() => toggleSort(h.key)} className="px-4 py-2.5 text-left font-semibold cursor-pointer" style={{ color: T.muted, fontSize: 12 }}>{h.label} {sortCol === h.key ? (sortDir === 'asc' ? '↑' : '↓') : ''}</th>
                ))}
                <th className="px-4 py-2.5 text-left font-semibold" style={{ color: T.muted, fontSize: 12 }}>Band</th>
                <th className="px-4 py-2.5 text-left font-semibold" style={{ color: T.muted, fontSize: 12 }}>NELI</th>
                <th className="px-4 py-2.5 text-left font-semibold" style={{ color: T.muted, fontSize: 12 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(p => (
                <tr key={p.id} style={{ borderBottom: `1px solid ${T.border}` }} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium" style={{ color: T.text }}>{p.name}</td>
                  <td className="px-4 py-2.5" style={{ color: bandColor(p.is), fontWeight: 700 }}>{p.is}</td>
                  <td className="px-4 py-2.5" style={{ color: bandColor(p.es), fontWeight: 700 }}>{p.es}</td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: p.es >= 100 ? T.greenBg : p.es >= 85 ? T.amberBg : T.redBg, color: bandColor(p.es) }}>{bandLabel(p.es)}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs" style={{ color: T.muted }}>{p.neli ? `Week ${p.neliWeek}` : '—'}</td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => onAssess(p)} className="text-xs font-semibold px-3 py-1 rounded-lg" style={{ backgroundColor: T.navy, color: '#fff' }}>Assess Now</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Tracker View ───────────────────────────────────────────────────────────

function TrackerView() {
  const [selected, setSelected] = useState<number | null>(null)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Programme Week" value="17 / 20" sub="3 weeks remaining" />
        <StatCard label="Avg. Sessions/Week" value="4.8" sub="Target: 5" color={T.green} />
        <StatCard label="Avg. Score Gain" value={`+${neliAvgGain}`} sub="Standard score points" color={T.green} />
        <StatCard label="Midpoint Review" value="Done" sub="Week 10 complete" color={T.green} />
      </div>

      <div className="space-y-3">
        {neliPupils.map(p => {
          const gain = p.es - p.is
          const isOpen = selected === p.id
          return (
            <div key={p.id} className="rounded-xl overflow-hidden" style={{ backgroundColor: T.card, border: `1px solid ${T.border}` }}>
              <div onClick={() => setSelected(isOpen ? null : p.id)} className="flex items-center gap-4 px-5 py-4 cursor-pointer" style={{ backgroundColor: isOpen ? T.light : T.card }}>
                <div className="flex items-center justify-center rounded-full text-xs font-bold shrink-0" style={{ width: 36, height: 36, backgroundColor: T.navy, color: '#fff' }}>
                  {p.name.split(' ').map(w => w[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-sm" style={{ color: T.text }}>{p.name}</span>
                    {p.eal && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: T.blueBg, color: T.blue }}>EAL</span>}
                    {p.fsm && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: T.purpleBg, color: T.purple }}>FSM</span>}
                  </div>
                  <div className="flex gap-4 text-xs" style={{ color: T.muted }}>
                    <span>Initial: <strong style={{ color: bandColor(p.is) }}>{p.is}</strong></span>
                    <span>Current: <strong style={{ color: bandColor(p.es) }}>{p.es}</strong></span>
                    <span>Gain: <strong style={{ color: T.green }}>+{gain} pts</strong></span>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: T.greenBg, color: T.green }}>+{gain} pts</span>
                <ChevronRight size={16} style={{ color: T.muted, transform: isOpen ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />
              </div>
              {isOpen && (
                <div className="px-5 py-4" style={{ borderTop: `1px solid ${T.border}` }}>
                  <div className="grid grid-cols-10 gap-1 mb-4">
                    {Array.from({ length: 20 }, (_, i) => (
                      <div key={i} className="text-center rounded" style={{
                        backgroundColor: i < 16 ? T.navy : i === 16 ? '#FFFDF5' : T.border,
                        border: i === 16 ? `2px solid ${T.gold}` : 'none',
                        padding: '4px 2px',
                      }}>
                        <span className="text-[8px] font-bold" style={{ color: i < 16 ? '#fff' : i === 16 ? T.gold : T.muted }}>WK {i + 1}</span>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[['Sessions Done', `${p.neliSessions}/${p.neliExpected}`, 'of target'], ['Group Sessions', '48/60', 'complete'], ['Attendance', '96%', 'session rate']].map(([l, v, s]) => (
                      <div key={l} className="rounded-lg p-3" style={{ backgroundColor: T.light }}>
                        <p className="text-[10px] font-bold uppercase" style={{ color: T.muted }}>{l}</p>
                        <p className="text-lg font-black" style={{ color: T.navy, fontFamily: 'Georgia, serif' }}>{v}</p>
                        <p className="text-xs" style={{ color: T.muted }}>{s}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
