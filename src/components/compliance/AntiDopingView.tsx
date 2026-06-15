'use client'

import { useState } from 'react'
import { TestTube } from 'lucide-react'

// Anti-Doping — UKAD / WADA compliance. Registered testing pool & whereabouts,
// test log, TUEs, supplement batch-testing (Informed Sport) and education.
// Shared; men's (blue) vs women's (pink). Demo only — illustrative.

type Variant = 'mens' | 'womens'
type RAG = 'green' | 'amber' | 'red'
type Tab = 'whereabouts' | 'tests' | 'tues' | 'supplements' | 'education'

interface Where { player: string; pool: string; status: RAG; note: string }
interface Test { date: string; type: string; player: string; result: string }
interface Tue { player: string; substance: string; status: RAG; expiry: string }
interface Supp { product: string; batch: string; status: RAG }
interface Edu { group: string; pct: number; last: string }
interface Profile { accent: string; accentLt: string; clubName: string; stats: { label: string; value: string; col?: string }[]
  where: Where[]; tests: Test[]; tues: Tue[]; supplements: Supp[]; education: Edu[] }

const MENS: Profile = {
  accent: '#003DA5', accentLt: '#60A5FA', clubName: 'Oakridge FC',
  stats: [{ label: 'Testing pool', value: '6 players', col: 'text' }, { label: 'Whereabouts', value: 'Compliant', col: 'good' }, { label: 'Active TUEs', value: '2', col: 'text' }, { label: 'Education', value: '100%', col: 'good' }],
  where: [
    { player: 'Dean Morris', pool: 'National RTP', status: 'green', note: 'Filings current — Q3 submitted' },
    { player: 'Sam Porter', pool: 'National RTP', status: 'green', note: 'Filings current' },
    { player: 'Kwame Boateng', pool: 'National RTP', status: 'amber', note: '1 late update — reminder issued' },
    { player: 'Squad (testing pool)', pool: 'Domestic pool', status: 'green', note: 'Team whereabouts maintained' },
  ],
  tests: [
    { date: '02 May 2026', type: 'In-competition (urine)', player: 'Dean Morris', result: 'Negative' },
    { date: '14 Apr 2026', type: 'Out-of-competition (blood)', player: 'Kwame Boateng', result: 'Negative' },
    { date: '28 Mar 2026', type: 'In-competition (urine)', player: 'Sam Porter', result: 'Negative' },
  ],
  tues: [
    { player: 'Player A (anonymised)', substance: 'Glucocorticoid (asthma)', status: 'green', expiry: 'Dec 2026' },
    { player: 'Player B (anonymised)', substance: 'Methylphenidate (ADHD)', status: 'green', expiry: 'Sep 2026' },
  ],
  supplements: [
    { product: 'Recovery protein blend', batch: 'IS-44821', status: 'green' },
    { product: 'Electrolyte / hydration', batch: 'IS-44910', status: 'green' },
    { product: 'Pre-training energy gel', batch: 'IS-45002', status: 'amber' },
  ],
  education: [
    { group: 'First-team squad', pct: 100, last: 'Aug 2025 (pre-season)' },
    { group: 'Academy U18 / scholars', pct: 100, last: 'Sep 2025' },
    { group: 'Medical & S&C staff', pct: 100, last: 'Aug 2025' },
  ],
}

const WOMENS: Profile = {
  accent: '#BE185D', accentLt: '#EC4899', clubName: 'Oakridge Women FC',
  stats: [{ label: 'Testing pool', value: '4 players', col: 'text' }, { label: 'Whereabouts', value: 'Compliant', col: 'good' }, { label: 'Active TUEs', value: '1', col: 'text' }, { label: 'Education', value: '100%', col: 'good' }],
  where: [
    { player: 'Jade Osei', pool: 'National RTP', status: 'green', note: 'Filings current — Q3 submitted' },
    { player: 'Lucy Whitmore', pool: 'National RTP', status: 'green', note: 'Filings current' },
    { player: 'Aisha Diallo', pool: 'National RTP', status: 'green', note: 'Filings current' },
    { player: 'Squad (testing pool)', pool: 'Domestic pool', status: 'green', note: 'Team whereabouts maintained' },
  ],
  tests: [
    { date: '04 May 2026', type: 'In-competition (urine)', player: 'Jade Osei', result: 'Negative' },
    { date: '20 Apr 2026', type: 'Out-of-competition (blood)', player: 'Lucy Whitmore', result: 'Negative' },
    { date: '30 Mar 2026', type: 'In-competition (urine)', player: 'Aisha Diallo', result: 'Negative' },
  ],
  tues: [
    { player: 'Player A (anonymised)', substance: 'Glucocorticoid (asthma)', status: 'green', expiry: 'Nov 2026' },
  ],
  supplements: [
    { product: 'Recovery protein blend', batch: 'IS-44821', status: 'green' },
    { product: 'Iron / vitamin support', batch: 'IS-44877', status: 'green' },
    { product: 'Electrolyte / hydration', batch: 'IS-44910', status: 'green' },
  ],
  education: [
    { group: 'First-team squad', pct: 100, last: 'Aug 2025 (pre-season)' },
    { group: 'RTC / youth pathway', pct: 100, last: 'Sep 2025' },
    { group: 'Medical & S&C staff', pct: 100, last: 'Aug 2025' },
  ],
}

const C = { panel: '#0D1117', panelAlt: '#111318', border: '#1F2937', text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280', good: '#22C55E', amber: '#F59E0B', red: '#EF4444' }
const ragCol = (r: RAG) => r === 'green' ? C.good : r === 'amber' ? C.amber : C.red
const colOf = (c?: string) => c === 'good' ? C.good : c === 'amber' ? C.amber : C.text
const TABS: [Tab, string][] = [['whereabouts', 'Testing Pool & Whereabouts'], ['tests', 'Test Log'], ['tues', 'TUEs'], ['supplements', 'Supplement Batch-Testing'], ['education', 'Education']]

export default function AntiDopingView({ variant, club }: { variant: Variant; club?: { name?: string } | null }) {
  const p = variant === 'mens' ? MENS : WOMENS
  const name = club?.name || p.clubName
  const [tab, setTab] = useState<Tab>('whereabouts')

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: C.text }}><TestTube size={18} style={{ color: p.accent }} /> Anti-Doping</h2>
        <p className="text-sm mt-1 max-w-2xl" style={{ color: C.text3 }}>{name} — UKAD / WADA compliance: testing pool & whereabouts, test results, TUEs, supplement assurance and education.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {p.stats.map((s, i) => (<div key={i} className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}><div className="text-[10px] uppercase tracking-wider" style={{ color: C.text4 }}>{s.label}</div><div className="text-xl font-black mt-1" style={{ color: colOf(s.col) }}>{s.value}</div></div>))}
      </div>

      <div className="flex gap-1 border-b overflow-x-auto" style={{ borderColor: C.border }}>
        {TABS.map(([id, label]) => (<button key={id} onClick={() => setTab(id)} className="px-4 py-2 text-xs font-semibold -mb-px whitespace-nowrap" style={{ borderBottom: `2px solid ${tab === id ? p.accent : 'transparent'}`, color: tab === id ? p.accentLt : C.text4 }}>{label}</button>))}
      </div>

      {tab === 'whereabouts' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Player', 'Pool', 'Filing status', 'Status'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
            <tbody>{p.where.map((w, i) => (<tr key={i} style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{w.player}</td><td className="px-4 py-2.5" style={{ color: C.text4 }}>{w.pool}</td><td className="px-4 py-2.5" style={{ color: C.text3 }}>{w.note}</td><td className="px-4 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${ragCol(w.status)}1f`, color: ragCol(w.status) }}>{w.status === 'green' ? 'Compliant' : 'Reminder'}</span></td></tr>))}</tbody>
          </table>
          <div className="px-4 py-2.5 text-[10px]" style={{ borderTop: `1px solid ${C.border}`, color: C.text4 }}>Whereabouts via ADAMS. Three filing failures / missed tests in 12 months constitutes an Anti-Doping Rule Violation.</div>
        </div>
      )}

      {tab === 'tests' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Date', 'Test type', 'Player', 'Result'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
            <tbody>{p.tests.map((t, i) => (<tr key={i} style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-mono" style={{ color: C.text3 }}>{t.date}</td><td className="px-4 py-2.5" style={{ color: C.text2 }}>{t.type}</td><td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{t.player}</td><td className="px-4 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${C.good}1f`, color: C.good }}>{t.result}</span></td></tr>))}</tbody>
          </table>
        </div>
      )}

      {tab === 'tues' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Player', 'Substance / reason', 'Valid to', 'Status'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
            <tbody>{p.tues.map((t, i) => (<tr key={i} style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{t.player}</td><td className="px-4 py-2.5" style={{ color: C.text3 }}>{t.substance}</td><td className="px-4 py-2.5 font-mono" style={{ color: C.text4 }}>{t.expiry}</td><td className="px-4 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${ragCol(t.status)}1f`, color: ragCol(t.status) }}>Granted</span></td></tr>))}</tbody>
          </table>
          <div className="px-4 py-2.5 text-[10px]" style={{ borderTop: `1px solid ${C.border}`, color: C.text4 }}>Therapeutic Use Exemptions held confidentially by the club doctor; players anonymised in this view.</div>
        </div>
      )}

      {tab === 'supplements' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Product', 'Batch (Informed Sport)', 'Status'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
            <tbody>{p.supplements.map((s, i) => (<tr key={i} style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{s.product}</td><td className="px-4 py-2.5 font-mono" style={{ color: C.text3 }}>{s.batch}</td><td className="px-4 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${ragCol(s.status)}1f`, color: ragCol(s.status) }}>{s.status === 'green' ? 'Batch-certified' : 'Re-cert due'}</span></td></tr>))}</tbody>
          </table>
          <div className="px-4 py-2.5 text-[10px]" style={{ borderTop: `1px solid ${C.border}`, color: C.text4 }}>All squad supplements batch-tested under Informed Sport to manage strict-liability risk.</div>
        </div>
      )}

      {tab === 'education' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          {p.education.map((e, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: i < p.education.length - 1 ? `1px solid ${C.border}80` : undefined }}>
              <div><div className="text-sm font-semibold" style={{ color: C.text }}>{e.group}</div><div className="text-[10px]" style={{ color: C.text4 }}>Last delivered {e.last}</div></div>
              <span className="text-sm font-bold" style={{ color: C.good }}>{e.pct}%</span>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl p-3 text-[11px]" style={{ background: `${p.accent}12`, borderLeft: `3px solid ${p.accent}`, color: C.text2 }}>
        Demo — illustrative only. Players, test dates, TUEs and batch numbers are invented demo values. Medical / TUE data is access-controlled.
      </div>
    </div>
  )
}
