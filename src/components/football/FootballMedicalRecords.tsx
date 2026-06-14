'use client'

import React from 'react'
import { HeartPulse, Activity, ShieldCheck, FileText } from 'lucide-react'

// Men's Pro — Medical Records (Operations). Squad medical summary, current
// injury list, screening & clearance status. Role-gated in copy.

const C = {
  panel: '#0D1117', panel2: '#0a0c14', border: '#1F2937',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280',
  green: '#22C55E', amber: '#F59E0B', red: '#EF4444', accent: '#003DA5',
}

const SUMMARY = [
  { player: 'Jordan Hayes', inj: 0, status: 'Fit', notes: 'No current issues' },
  { player: 'Connor Walsh', inj: 1, status: 'Fit', notes: 'Minor ankle — resolved' },
  { player: 'Marcus Cole', inj: 0, status: 'Fit', notes: 'No current issues' },
  { player: 'Liam Hart', inj: 0, status: 'Fit', notes: 'Load managed — high ACWR this week' },
  { player: 'Reece Barker', inj: 1, status: 'RTP — knee', notes: 'Meniscus rehab — non-load phase' },
  { player: 'Tom Adams', inj: 0, status: 'Fit', notes: 'No current issues' },
  { player: 'Sam Porter', inj: 0, status: 'Fit', notes: 'No current issues' },
  { player: 'Dean Morris', inj: 0, status: 'Fit', notes: 'No current issues' },
  { player: 'Daniel Webb', inj: 1, status: 'Out — hamstring', notes: 'Grade 2 hamstring — return May' },
  { player: 'Kyle Osei', inj: 1, status: 'Concussion protocol', notes: 'Graduated return-to-play — Day 6' },
  { player: 'Myles Okafor', inj: 0, status: 'Fit', notes: 'ITC cleared medically' },
  { player: 'Chris Nwosu', inj: 0, status: 'Fit', notes: 'No current issues' },
]
const injuryList = [
  { player: 'Daniel Webb', injury: 'Hamstring (Grade 2)', sustained: '22 Mar', expected: 'Early May', stage: 'Strength phase', tone: C.red },
  { player: 'Reece Barker', injury: 'Knee — meniscus', sustained: '04 Mar', expected: 'Late Apr', stage: 'Non-load rehab', tone: C.amber },
  { player: 'Kyle Osei', injury: 'Concussion', sustained: '23 Mar', expected: 'Day 6 RTP', stage: 'Graduated return', tone: C.amber },
]
const statusCol = (s: string) => s === 'Fit' ? C.green : s.includes('Out') ? C.red : C.amber

const Kpi = ({ label, value, sub, icon: Icon, color }: { label: string; value: string; sub: string; icon: React.ElementType; color: string }) => (
  <div className="rounded-xl p-3.5" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
    <div className="flex items-center justify-between"><span className="text-[10px] uppercase tracking-wider" style={{ color: C.text4 }}>{label}</span><Icon size={14} style={{ color }} /></div>
    <div className="text-xl font-bold mt-1" style={{ color: C.text }}>{value}</div>
    <div className="text-[10.5px] mt-0.5" style={{ color: C.text3 }}>{sub}</div>
  </div>
)

export default function FootballMedicalRecords() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: C.text }}><HeartPulse size={18} style={{ color: C.accent }} /> Medical Records</h2>
        <p className="text-sm mt-1" style={{ color: C.text3 }}>Role-gated access — Head of Medical and Club Doctor only.</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <Kpi label="Squad fit" value="9 / 12" sub="3 in rehab / protocol" icon={Activity} color={C.green} />
        <Kpi label="Current injuries" value="3" sub="1 out · 2 RTP" icon={HeartPulse} color={C.amber} />
        <Kpi label="Screenings" value="Up to date" sub="Cardiac + MSK · pre-season" icon={ShieldCheck} color={C.green} />
        <Kpi label="Insurance / ITC" value="All cleared" sub="Squad registration medicals" icon={FileText} color={C.accent} />
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
        <div className="px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}><p className="text-sm font-semibold" style={{ color: C.text }}>Squad medical summary</p></div>
        <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>{['Player', 'Injuries (season)', 'Status', 'Physio notes'].map(h => <th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead><tbody>
          {SUMMARY.map((r, i) => (<tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
            <td className="px-4 py-2.5 font-medium" style={{ color: C.text }}>{r.player}</td>
            <td className="px-4 py-2.5" style={{ color: C.text3 }}>{r.inj}</td>
            <td className="px-4 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${statusCol(r.status)}1a`, color: statusCol(r.status) }}>{r.status}</span></td>
            <td className="px-4 py-2.5" style={{ color: C.text4 }}>{r.notes}</td>
          </tr>))}
        </tbody></table></div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}><p className="text-sm font-semibold" style={{ color: C.text }}>Current injury list</p><span className="text-[10px]" style={{ color: C.text4 }}>{injuryList.length} active</span></div>
        <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>{['Player', 'Injury', 'Sustained', 'Expected return', 'Stage'].map(h => <th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead><tbody>
          {injuryList.map((r, i) => (<tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
            <td className="px-4 py-2.5 font-medium" style={{ color: C.text }}>{r.player}</td>
            <td className="px-4 py-2.5" style={{ color: r.tone }}>{r.injury}</td>
            <td className="px-4 py-2.5" style={{ color: C.text3 }}>{r.sustained}</td>
            <td className="px-4 py-2.5" style={{ color: C.text3 }}>{r.expected}</td>
            <td className="px-4 py-2.5" style={{ color: C.text4 }}>{r.stage}</td>
          </tr>))}
        </tbody></table></div>
      </div>

      <div className="px-3 py-2.5 text-[11px] rounded-lg" style={{ background: `${C.accent}10`, borderLeft: `3px solid ${C.accent}`, color: C.text3 }}>
        Records are confidential and role-gated. Concussion cases follow the graduated return-to-play protocol; RTP sign-off requires Head of Medical clearance.
      </div>
    </div>
  )
}
