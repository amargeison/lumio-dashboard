'use client'

import { useState } from 'react'
import { CalendarClock, FileText } from 'lucide-react'

// Compliance Calendar — master regulatory-deadline tracker. Every submission,
// renewal, return and window with owner, due date, RAG status, recurrence and
// evidence link. Filterable by status. Shared component; men's (PSR/EFL/EPPP)
// vs women's (FSR/WPLL) selected by variant. Demo only — illustrative.

type Variant = 'mens' | 'womens'
type Status = 'upcoming' | 'due-soon' | 'overdue' | 'filed'
type Cat = 'Financial' | 'Licensing' | 'Registration' | 'Governance' | 'Safeguarding' | 'Welfare'

interface Item { item: string; cat: Cat; due: string; owner: string; status: Status; recur: string; evidence: string }
interface Profile { accent: string; accentLt: string; accentDim: string; clubName: string; regime: string; items: Item[] }

const MENS: Profile = {
  accent: '#003DA5', accentLt: '#60A5FA', accentDim: 'rgba(37,99,235,0.14)',
  clubName: 'Oakridge FC', regime: 'PSR · EFL / Premier League · EPPP',
  items: [
    { item: 'Summer transfer window — registrations close', cat: 'Registration', due: '01 Sep 2026', owner: 'Football Secretary', status: 'due-soon', recur: 'Per window', evidence: 'EFL registration portal' },
    { item: '25-man squad list submission', cat: 'Registration', due: '03 Sep 2026', owner: 'Football Secretary', status: 'due-soon', recur: 'Per window', evidence: 'Squad list return' },
    { item: 'EFL club licence — annual self-assessment', cat: 'Licensing', due: '14 Sep 2026', owner: 'Club Secretary', status: 'due-soon', recur: 'Annual', evidence: 'Licensing self-assessment' },
    { item: 'Carney/EDI Standard — Advanced submission', cat: 'Governance', due: '30 Nov 2026', owner: 'Head of EDI', status: 'upcoming', recur: 'One-off', evidence: 'EDI Standard assessment' },
    { item: 'PSR annual P&S submission', cat: 'Financial', due: '31 Dec 2026', owner: 'Finance Director', status: 'upcoming', recur: 'Annual', evidence: 'P&S working papers' },
    { item: 'Interim PSR / SCR monitoring return', cat: 'Financial', due: '31 Jan 2027', owner: 'Finance Director', status: 'upcoming', recur: 'Annual', evidence: 'Interim accounts pack' },
    { item: 'January transfer window — registrations close', cat: 'Registration', due: '02 Feb 2027', owner: 'Football Secretary', status: 'upcoming', recur: 'Per window', evidence: 'EFL registration portal' },
    { item: 'EPPP academy audit', cat: 'Licensing', due: '12 Feb 2027', owner: 'Academy Director', status: 'upcoming', recur: 'Annual', evidence: 'EPPP audit report' },
    { item: 'Owners’ & Directors’ Test — annual confirmation', cat: 'Governance', due: '28 Feb 2027', owner: 'Club Secretary', status: 'upcoming', recur: 'Annual', evidence: 'ODT declarations' },
    { item: 'Audited accounts — Companies House filing', cat: 'Financial', due: '31 Mar 2027', owner: 'Finance Director', status: 'upcoming', recur: 'Annual', evidence: 'Statutory accounts' },
    { item: 'Safeguarding annual return + DBS audit', cat: 'Safeguarding', due: '30 Apr 2027', owner: 'DSO', status: 'upcoming', recur: 'Annual', evidence: 'Safeguarding return' },
    { item: 'Ground safety certificate renewal review', cat: 'Licensing', due: '31 May 2027', owner: 'Head of Operations', status: 'upcoming', recur: 'Annual', evidence: 'SAG certificate' },
    { item: 'Intermediary transactions — half-year disclosure', cat: 'Registration', due: '31 Jul 2026', owner: 'Club Secretary', status: 'filed', recur: 'Half-yearly', evidence: 'Intermediary returns' },
    { item: 'Anti-corruption & betting education (pre-season)', cat: 'Governance', due: '01 Aug 2026', owner: 'Club Secretary', status: 'filed', recur: 'Annual', evidence: 'Education log' },
  ],
}

const WOMENS: Profile = {
  accent: '#BE185D', accentLt: '#EC4899', accentDim: 'rgba(236,72,153,0.12)',
  clubName: 'Oakridge Women FC', regime: 'FSR · WSL / Championship · WPLL · Carney',
  items: [
    { item: 'WPLL squad registration deadline', cat: 'Registration', due: '01 Sep 2026', owner: 'Football Secretary', status: 'due-soon', recur: 'Per window', evidence: 'WPLL registration portal' },
    { item: 'WSL/Championship licence — self-assessment', cat: 'Licensing', due: '14 Sep 2026', owner: 'Club Secretary', status: 'due-soon', recur: 'Annual', evidence: 'Licensing self-assessment' },
    { item: 'Carney action plan — annual review', cat: 'Governance', due: '30 Sep 2026', owner: 'Managing Director', status: 'upcoming', recur: 'Annual', evidence: 'Carney tracker export' },
    { item: 'Maternity / parental policy review', cat: 'Welfare', due: '31 Oct 2026', owner: 'Welfare Lead', status: 'upcoming', recur: 'Annual', evidence: 'Maternity policy v3.2' },
    { item: 'WPLL minimum-standards return', cat: 'Licensing', due: '30 Nov 2026', owner: 'Club Secretary', status: 'upcoming', recur: 'Annual', evidence: 'WPLL standards return' },
    { item: 'Audited accounts — Companies House filing', cat: 'Financial', due: '31 Dec 2026', owner: 'Head of Finance', status: 'upcoming', recur: 'Annual', evidence: 'Statutory accounts' },
    { item: 'January registration window — close', cat: 'Registration', due: '02 Feb 2027', owner: 'Football Secretary', status: 'upcoming', recur: 'Per window', evidence: 'WPLL registration portal' },
    { item: 'ACL prevention programme — annual review', cat: 'Welfare', due: '28 Feb 2027', owner: 'Head of Performance', status: 'upcoming', recur: 'Annual', evidence: 'ACL programme report' },
    { item: 'FSR annual submission', cat: 'Financial', due: '31 Mar 2027', owner: 'Head of Finance', status: 'upcoming', recur: 'Annual', evidence: 'FSR working papers' },
    { item: 'Workforce diversity (EDI) data return', cat: 'Governance', due: '30 Apr 2027', owner: 'Managing Director', status: 'upcoming', recur: 'Annual', evidence: 'Workforce data return' },
    { item: 'Safeguarding annual return + DBS audit', cat: 'Safeguarding', due: '30 Apr 2027', owner: 'DSO', status: 'upcoming', recur: 'Annual', evidence: 'Safeguarding return' },
    { item: 'SGSA self-regulation annual safety review', cat: 'Licensing', due: '31 May 2027', owner: 'Head of Operations', status: 'upcoming', recur: 'Annual', evidence: 'Safety review' },
    { item: 'Welfare officer annual report', cat: 'Welfare', due: '30 Sep 2026', owner: 'Welfare Lead', status: 'upcoming', recur: 'Annual', evidence: 'Welfare report' },
    { item: 'Pre-season safeguarding training', cat: 'Safeguarding', due: '01 Aug 2026', owner: 'DSO', status: 'filed', recur: 'Annual', evidence: 'Training log' },
  ],
}

const C = {
  panel: '#0D1117', panel2: '#111318', border: '#1F2937', borderSoft: '#1A2030',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280',
  good: '#22C55E', amber: '#F59E0B', red: '#EF4444', blue: '#60A5FA',
  goodDim: 'rgba(34,197,94,0.15)', warnDim: 'rgba(245,158,11,0.15)', badDim: 'rgba(239,68,68,0.15)',
}
const stCol = (s: Status) => s === 'overdue' ? C.red : s === 'due-soon' ? C.amber : s === 'filed' ? C.good : C.blue
const stLabel = (s: Status) => s === 'overdue' ? 'OVERDUE' : s === 'due-soon' ? 'DUE SOON' : s === 'filed' ? 'FILED' : 'UPCOMING'
const CATS: Cat[] = ['Financial', 'Licensing', 'Registration', 'Governance', 'Safeguarding', 'Welfare']

export default function ComplianceCalendar({ variant, club }: { variant: Variant; club?: { name?: string } | null }) {
  const p = variant === 'mens' ? MENS : WOMENS
  const name = club?.name || p.clubName
  const [filter, setFilter] = useState<'all' | Status | Cat>('all')

  const open = p.items.filter(i => i.status !== 'filed')
  const dueSoon = p.items.filter(i => i.status === 'due-soon').length
  const overdue = p.items.filter(i => i.status === 'overdue').length
  const filed = p.items.filter(i => i.status === 'filed').length
  const shown = filter === 'all' ? p.items
    : (['upcoming', 'due-soon', 'overdue', 'filed'] as const).includes(filter as Status)
      ? p.items.filter(i => i.status === filter)
      : p.items.filter(i => i.cat === filter)
  const sorted = [...shown].sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime())

  const Stat = ({ label, value, col }: { label: string; value: number | string; col: string }) => (
    <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}><div className="text-[10px] uppercase tracking-wider" style={{ color: C.text4 }}>{label}</div><div className="text-xl font-black mt-1" style={{ color: col }}>{value}</div></div>
  )

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: C.text }}><CalendarClock size={18} style={{ color: p.accent }} /> Compliance Calendar</h2>
        <p className="text-sm mt-1 max-w-2xl" style={{ color: C.text3 }}>{name} — every regulatory deadline, return and window with owner, status and evidence. Regime: {p.regime}.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Open items" value={open.length} col={C.text} />
        <Stat label="Due soon (90 days)" value={dueSoon} col={C.amber} />
        <Stat label="Overdue" value={overdue} col={overdue ? C.red : C.good} />
        <Stat label="Filed this season" value={filed} col={C.good} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(['all', 'due-soon', 'upcoming', 'overdue', 'filed', ...CATS] as const).map(f => {
          const active = filter === f
          const lbl = f === 'all' ? 'All' : (['upcoming', 'due-soon', 'overdue', 'filed'] as string[]).includes(f) ? stLabel(f as Status) : f
          return (
            <button key={f} onClick={() => setFilter(f as typeof filter)} className="text-[11px] font-semibold px-3 py-1.5 rounded-lg" style={{ background: active ? p.accentDim : C.panel, color: active ? p.accentLt : C.text4, border: `1px solid ${active ? p.accent + '55' : C.border}` }}>{lbl}</button>
          )
        })}
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
        <table className="w-full text-xs">
          <thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>
            {['Deadline', 'Category', 'Due', 'Owner', 'Recurrence', 'Evidence', 'Status'].map(h => (
              <th key={h} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>{sorted.map((it, i) => (
            <tr key={i} style={{ borderTop: `1px solid ${C.border}`, background: it.status === 'overdue' ? `${C.red}08` : undefined }}>
              <td className="px-3 py-2.5 font-semibold" style={{ color: C.text }}>{it.item}</td>
              <td className="px-3 py-2.5"><span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: p.accentDim, color: p.accentLt }}>{it.cat}</span></td>
              <td className="px-3 py-2.5 font-mono font-semibold" style={{ color: C.text2 }}>{it.due}</td>
              <td className="px-3 py-2.5" style={{ color: C.text3 }}>{it.owner}</td>
              <td className="px-3 py-2.5" style={{ color: C.text4 }}>{it.recur}</td>
              <td className="px-3 py-2.5"><span className="flex items-center gap-1" style={{ color: C.text3 }}><FileText size={11} style={{ color: C.text4 }} />{it.evidence}</span></td>
              <td className="px-3 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${stCol(it.status)}1f`, color: stCol(it.status) }}>{stLabel(it.status)}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      <div className="rounded-xl p-3 text-[11px]" style={{ background: `${p.accent}12`, borderLeft: `3px solid ${p.accent}`, color: C.text2 }}>
        Demo — illustrative only. Dates, owners and recurrence are invented demo values. In production, each item drives an automated reminder to its owner and links to its evidence in the vault.
      </div>
    </div>
  )
}
