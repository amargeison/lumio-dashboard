'use client'

import { useState, useEffect } from 'react'
import { Users, Calendar, UserPlus, Thermometer, AlertCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface HRData { provider: string; headcount: number; pendingLeave: number; newStarters: number; leavers: number; offSick: number; connected: boolean }

const HR_PROVIDERS = [
  { key: 'bamboohr', label: 'BambooHR', color: '#73C41D', route: '/api/integrations/bamboohr/snapshot' },
  { key: 'sage_hr', label: 'Sage HR', color: '#00DC82', route: '/api/integrations/sagehr/snapshot' },
  { key: 'breathe', label: 'Breathe HR', color: '#7C3AED', route: '/api/integrations/breathehr/snapshot' },
  { key: 'worksmarter', label: 'WorkSmarter', color: '#3B82F6', route: null },
]

export default function HRSnapshot() {
  const [data, setData] = useState<HRData[]>([])
  const [loading, setLoading] = useState(true)
  const [connectedProviders, setConnectedProviders] = useState<string[]>([])

  useEffect(() => {
    const connected = HR_PROVIDERS.filter(p => typeof window !== 'undefined' && localStorage.getItem(`lumio_integration_${p.key}`) === 'true')
    setConnectedProviders(connected.map(p => p.key))

    if (!connected.length || !connected.some(p => p.route)) { setLoading(false); return }

    const token = localStorage.getItem('workspace_session_token') || ''
    Promise.all(
      connected.filter(p => p.route).map(p =>
        fetch(p.route!, { headers: { 'x-workspace-token': token } })
          .then(r => r.ok ? r.json() : null)
          .catch(() => null)
      )
    ).then(results => {
      setData(results.filter(Boolean) as HRData[])
      setLoading(false)
    })
  }, [])

  if (!connectedProviders.length) {
    return (
      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center gap-2 mb-3">
          <Users size={16} style={{ color: '#3B82F6' }} />
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>HR Snapshot</p>
        </div>
        <p className="text-xs" style={{ color: '#6B7280' }}>Connect BambooHR, Sage HR, Breathe or WorkSmarter in Settings to see your HR snapshot.</p>
      </div>
    )
  }

  const totals = data.reduce((acc, d) => ({
    headcount: acc.headcount + d.headcount,
    pendingLeave: acc.pendingLeave + d.pendingLeave,
    newStarters: acc.newStarters + d.newStarters,
    offSick: acc.offSick + d.offSick,
  }), { headcount: 0, pendingLeave: 0, newStarters: 0, offSick: 0 })

  const sources = data.map(d => HR_PROVIDERS.find(p => p.key === d.provider || p.label.toLowerCase().replace(/\s/g, '') === d.provider)).filter(Boolean)

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
        <div className="flex items-center gap-2">
          <Users size={16} style={{ color: '#3B82F6' }} />
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>HR Snapshot</p>
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
            <StatTile icon={<Users size={14} />} label="Headcount" value={String(totals.headcount)} color="#3B82F6" />
            <StatTile icon={<Calendar size={14} />} label="Pending Leave" value={String(totals.pendingLeave)} color={totals.pendingLeave > 0 ? '#F59E0B' : '#6B7280'} highlight={totals.pendingLeave > 0} />
            <StatTile icon={<UserPlus size={14} />} label="New This Month" value={String(totals.newStarters)} color="#22C55E" />
            <StatTile icon={<Thermometer size={14} />} label="Off Sick" value={String(totals.offSick)} color={totals.offSick > 0 ? '#EF4444' : '#6B7280'} highlight={totals.offSick > 0} />
          </div>
          <div className="flex gap-2 px-4 pb-4">
            <Link href="/hr" className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(59,130,246,0.12)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.25)', textDecoration: 'none' }}>
              View Employees <ArrowRight size={10} />
            </Link>
            <Link href="/hr" className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(245,158,11,0.12)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.25)', textDecoration: 'none' }}>
              View Leave Requests <ArrowRight size={10} />
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
