'use client'

import { ArrowLeftRight } from 'lucide-react'

// Men's Pro — Dual Registration. EFL / FA dual-registration & youth-loan
// tracker — young players gaining minutes at National League / lower-tier
// clubs. Blue-themed, standalone (inline styles). Demo only.

const C = {
  card: '#0D1117', cardAlt: '#0a0c14', border: '#1F2937',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', muted: '#6B7280',
  primary: '#003DA5', accent: '#60A5FA', good: '#22C55E', amber: '#F59E0B', red: '#EF4444', blue: '#3B82F6', purple: '#8B5CF6',
}

const Stat = ({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) => (
  <div className="rounded-xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
    <div className="text-[10px] uppercase tracking-wider" style={{ color: C.muted }}>{label}</div>
    <div className="text-xl font-black mt-1" style={{ color }}>{value}</div>
    <div className="text-[10px] mt-0.5" style={{ color: C.muted }}>{sub}</div>
  </div>
)

const REGISTRATIONS: Array<{ player: string; pos: string; parentClub: string; loanClub: string; type: 'Temporary' | 'Permanent'; start: string; end: string; window: string; daysLeft: number }> = [
  { player: 'Brodi Chen', pos: 'CB', parentClub: 'Oakridge FC', loanClub: 'Harfield Town (Nat. League)', type: 'Temporary', start: '15 Jan 2026', end: '30 May 2026', window: 'Winter', daysLeft: 4 },
  { player: 'Delano Ashton', pos: 'CM', parentClub: 'Oakridge FC', loanClub: 'Marlow Bridge FC (Nat. League N)', type: 'Temporary', start: '12 Aug 2025', end: '31 May 2026', window: 'Summer 2025', daysLeft: 5 },
  { player: 'Zack Bright', pos: 'CM', parentClub: 'Oakridge FC', loanClub: 'Brindleford Town (League Two)', type: 'Temporary', start: '01 Sep 2025', end: '04 Jan 2026', window: 'Summer 2025', daysLeft: 115 },
]

export default function FootballDualRegistrationView() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold" style={{ color: C.text }}>Loan Manager</h2>
        <p className="text-sm mt-1" style={{ color: C.text3 }}>EFL / FA dual-registration and development-loan tracker — young players gaining competitive minutes.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Active loans / dual-regs" value="3" sub="players out on loan" color={C.accent} />
        <Stat label="Expiring soon" value="2" sub="Chen · Ashton (≤ 7 days)" color={C.red} />
        <Stat label="Window status" value="Open" sub="closes 30 Apr 2026" color={C.good} />
        <Stat label="EFL loan limit" value="6 / 8" sub="domestic loans used" color={C.blue} />
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
        <table className="w-full text-sm">
          <thead><tr style={{ color: C.muted, borderBottom: `1px solid ${C.border}`, background: 'rgba(17,24,39,0.3)' }}>
            {['Player', 'Home Club', 'Host Club', 'Type', 'Start', 'End', 'Window', 'Status'].map(h => <th key={h} className="text-left p-3 text-xs font-semibold">{h}</th>)}
          </tr></thead>
          <tbody>{REGISTRATIONS.map(r => { const expiringSoon = r.daysLeft <= 7; return (
            <tr key={r.player} style={{ borderBottom: `1px solid ${C.border}80` }}>
              <td className="p-3 font-medium" style={{ color: C.text2 }}>{r.player} <span className="text-[10px]" style={{ color: C.muted }}>({r.pos})</span></td>
              <td className="p-3 text-xs" style={{ color: C.text3 }}>{r.parentClub}</td>
              <td className="p-3 text-xs" style={{ color: C.text3 }}>{r.loanClub}</td>
              <td className="p-3"><span className="text-xs px-2 py-0.5 rounded" style={{ background: r.type === 'Permanent' ? `${C.blue}22` : `${C.purple}22`, color: r.type === 'Permanent' ? C.blue : C.purple }}>{r.type}</span></td>
              <td className="p-3 text-xs" style={{ color: C.text3 }}>{r.start}</td>
              <td className="p-3 text-xs" style={{ color: C.text3 }}>{r.end}</td>
              <td className="p-3 text-xs" style={{ color: C.text3 }}>{r.window}</td>
              <td className="p-3">{expiringSoon ? <span className="text-xs px-2 py-0.5 rounded font-semibold" style={{ background: `${C.red}22`, color: C.red }}>EXPIRES SOON</span> : <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${C.good}22`, color: C.good }}>Active</span>}</td>
            </tr>
          ) })}</tbody>
        </table>
      </div>

      <div className="rounded-xl p-3 text-xs font-medium" style={{ background: `${C.red}10`, border: `1px solid ${C.red}30`, color: C.red }}>⚠ Brodi Chen&apos;s development loan expires in 4 days — decide extend, recall, or let lapse before the registration deadline.</div>

      <div className="rounded-xl p-5" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
        <h3 className="text-sm font-bold mb-1" style={{ color: C.text }}>Loan player progress</h3>
        <p className="text-[11px] mb-4" style={{ color: C.muted }}>Minutes and development tracked at the host club; feeds the recall decision and the academy-to-first-team pathway.</p>
        <div className="space-y-3">{[
          { player: 'Brodi Chen', club: 'Harfield Town', apps: 18, mins: 1530, rating: 7.1, note: 'Ever-present at CB; ready for a Championship bench role.' },
          { player: 'Delano Ashton', club: 'Marlow Bridge FC', apps: 22, mins: 1840, rating: 7.4, note: 'Standout season; recall under consideration.' },
          { player: 'Zack Bright', club: 'Brindleford Town', apps: 14, mins: 980, rating: 6.6, note: 'Loan ended Jan; reintegrated with U21s.' },
        ].map(p => (
          <div key={p.player} className="rounded-lg p-3" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
            <div className="flex items-center justify-between mb-1">
              <div><span className="text-xs font-semibold" style={{ color: C.text2 }}>{p.player}</span><span className="text-[10px] ml-2" style={{ color: C.muted }}>{p.club}</span></div>
              <span className="text-xs font-bold" style={{ color: p.rating >= 7 ? C.good : C.amber }}>{p.rating} avg</span>
            </div>
            <div className="text-[11px]" style={{ color: C.text3 }}>{p.apps} apps · {p.mins} mins · {p.note}</div>
          </div>
        ))}</div>
      </div>

      <div className="rounded-xl p-5" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
        <h3 className="text-sm font-bold mb-3" style={{ color: C.text }}>Registration Window Calendar</h3>
        <div className="space-y-2">{[
          { event: 'Winter loan window opened', date: '1 Jan 2026', status: 'past' },
          { event: 'Brodi Chen loan expires', date: '8 Apr 2026', status: 'urgent' },
          { event: 'Delano Ashton loan expires', date: '12 Apr 2026', status: 'urgent' },
          { event: 'Registration window closes', date: '30 Apr 2026', status: 'upcoming' },
          { event: 'Summer window opens', date: '1 Jun 2026', status: 'future' },
        ].map(e => (
          <div key={e.event} className="flex items-center justify-between py-1.5" style={{ borderBottom: `1px solid ${C.border}` }}>
            <span className="text-xs" style={{ color: e.status === 'urgent' ? C.red : e.status === 'past' ? C.muted : C.text3, fontWeight: e.status === 'urgent' ? 600 : 400 }}>{e.event}</span>
            <span className="text-xs" style={{ color: e.status === 'urgent' ? C.red : C.muted }}>{e.date}</span>
          </div>
        ))}</div>
      </div>

      <div className="rounded-xl p-3 text-[11px]" style={{ background: `${C.primary}12`, borderLeft: `3px solid ${C.primary}`, color: C.text2 }}>
        Demo — illustrative only. Loan players, clubs and dates are invented demo values.
      </div>
    </div>
  )
}
