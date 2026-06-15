'use client'

import { useState } from 'react'
import { Newspaper } from 'lucide-react'

// Men's Pro — Media & PR. Mirrors the women's MediaPRView (requests, PR
// calendar, coverage log, guidelines + templates) with men's data + blue.

const C = {
  panel: '#0D1117', panel2: '#0a0c14', border: '#1F2937',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280',
  blue: '#003DA5', blueLt: '#60A5FA',
}
const Stat = ({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) => (
  <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}><div className="text-[10px] uppercase tracking-wider" style={{ color: C.text4 }}>{label}</div><div className="text-xl font-black mt-1" style={{ color }}>{value}</div><div className="text-[10px] mt-0.5" style={{ color: C.text4 }}>{sub}</div></div>
)

type Req = { id: number; outlet: string; type: string; contact: string; subject: string; deadline: string; urgency: 'urgent' | 'high' | 'medium' | 'low'; status: string; notes: string; recommended: string }
const REQUESTS: Req[] = [
  { id: 1, outlet: 'Crown Broadcasting', type: 'Matchday Access', contact: 'Emma Holt (Production)', subject: 'Broadcast access — Northgate City (Sat 12 Apr)', deadline: 'Thu 10 Apr', urgency: 'urgent', status: 'Confirm by Thu', notes: 'Pre-match tunnel access, post-match mixed zone, manager interview. Live EFL broadcast.', recommended: 'Accept immediately — live broadcast reaches 600k+ viewers.' },
  { id: 2, outlet: 'EFL Films', type: 'Feature', contact: 'Sarah Davies', subject: 'Inside Oakridge — promotion-push documentary access', deadline: '15 Apr 2026', urgency: 'high', status: 'Pending approval', notes: 'Behind-the-scenes access across a matchweek. Strong brand-building opportunity for the run-in.', recommended: 'Accept — high-profile feature, manager + CEO sign-off needed.' },
  { id: 3, outlet: 'The Chronicle', type: 'Interview', contact: 'James Pearce', subject: 'Marcus Reid — promotion run-in interview', deadline: '18 Apr 2026', urgency: 'medium', status: 'Pending approval', notes: 'Subscriber-only profile ahead of the final third of the season.', recommended: 'Accept — strong readership among the Championship audience.' },
  { id: 4, outlet: 'Football Weekly (Podcast)', type: 'Podcast', contact: 'Chloe Grant', subject: 'Player guest — Dean Morris', deadline: '25 Apr 2026', urgency: 'low', status: 'Under review', notes: '45-minute episode. Dean Morris proposed — good platform for player brand-building.', recommended: 'Accept — low commitment, good profile value.' },
  { id: 5, outlet: 'The Dispatch Sport', type: 'Comment piece', contact: 'Anya Singh', subject: 'PSR impact on Championship clubs — CEO comment requested', deadline: '20 Apr 2026', urgency: 'medium', status: 'Declined — refer to EFL', notes: 'Sensitive regulatory topic. Referred to EFL communications.', recommended: 'Already declined — correct decision.' },
]
const COVERAGE = [
  { date: '5 Apr', outlet: 'Crown Broadcasting', headline: 'Oakridge climb to 6th with Morris double', reach: '1.4M', sentiment: 'positive' },
  { date: '2 Apr', outlet: 'The Chronicle', headline: 'How Oakridge built a promotion push on a budget', reach: '95k', sentiment: 'positive' },
  { date: '29 Mar', outlet: 'Northbridge Sport', headline: 'Oakridge 4-0 Eastcliff: Match Report', reach: '620k', sentiment: 'neutral' },
  { date: '22 Mar', outlet: 'Football Weekly', headline: "Player profile: Dean Morris — the Championship's in-form winger", reach: '48k', sentiment: 'positive' },
  { date: '15 Mar', outlet: 'The Dispatch', headline: 'Oakridge tracking a League One winger', reach: '2.4M', sentiment: 'neutral' },
  { date: '8 Mar', outlet: 'The Chronicle Sport', headline: 'Oakridge academy graduate signs first pro deal', reach: '110k', sentiment: 'positive' },
]
const GUIDELINES = [
  { topic: 'Transfer speculation', rule: '"We do not comment on speculation regarding player movements."', restricted: true },
  { topic: 'Financial & PSR matters', rule: 'Refer all financial / regulatory questions to the EFL communications team.', restricted: true },
  { topic: 'Match results & tactics', rule: 'Manager or assistant manager only. No tactical detail beyond what was visible publicly.', restricted: false },
  { topic: 'Player personal life', rule: 'No comment without explicit player consent. Privacy policy applies.', restricted: true },
  { topic: 'Sponsorship deals', rule: 'Commercial Director approval required. No figures disclosed without board sign-off.', restricted: true },
  { topic: 'Academy & young players', rule: 'Safeguarding-led. No naming of under-18s without parental and Academy Director consent.', restricted: true },
  { topic: 'Injuries & availability', rule: 'General fitness updates only (fit / doubtful / ruled out). No diagnosis or timeline.', restricted: false },
  { topic: 'Discipline / FA charges', rule: 'No comment while proceedings are live. Refer to club statement template.', restricted: true },
]
const CALENDAR = [
  { date: 'Thu 10 Apr', items: [{ time: '10:00', type: 'Press conf', label: 'Pre-match presser — Northgate City' }, { time: '14:00', type: 'Deadline', label: 'Crown Broadcasting access confirmation' }] },
  { date: 'Fri 11 Apr', items: [{ time: '11:00', type: 'Content', label: 'Player spotlight: Dean Morris — TikTok' }] },
  { date: 'Sat 12 Apr', items: [{ time: '12:00', type: 'Matchday', label: 'Crown Broadcasting tunnel access' }, { time: '15:00', type: 'Matchday', label: 'KO vs Northgate City' }, { time: '17:00', type: 'Post-match', label: 'Mixed zone + manager interview' }] },
  { date: 'Mon 14 Apr', items: [{ time: '09:00', type: 'Internal', label: 'Weekly comms meeting' }, { time: '15:00', type: 'Interview', label: 'EFL Films — documentary filming' }] },
  { date: 'Fri 18 Apr', items: [{ time: '13:00', type: 'Interview', label: 'The Chronicle — Marcus Reid' }] },
  { date: '25 Apr', items: [{ time: '10:00', type: 'Podcast', label: 'Football Weekly — Dean Morris' }] },
]
const TEMPLATES = [
  { s: 'Transfer speculation', r: 'Oakridge FC does not comment on speculation regarding player movements.' },
  { s: 'Player injury details', r: '[Player name] is currently being assessed by our medical team.' },
  { s: 'Financial / PSR queries', r: 'All financial matters are handled in conjunction with the EFL.' },
  { s: 'Match result', r: 'A great team effort today. The focus now turns to the next fixture.' },
]
const urg = (u: string) => u === 'urgent' ? 'background:rgba(239,68,68,0.2);color:#F87171' : u === 'high' ? 'background:rgba(245,158,11,0.2);color:#FBBF24' : u === 'medium' ? 'background:rgba(0,61,165,0.22);color:#60A5FA' : 'background:rgba(75,85,99,0.3);color:#9CA3AF'
const toStyle = (css: string): React.CSSProperties => { const o: Record<string, string> = {}; css.split(';').forEach(p => { const [k, v] = p.split(':'); if (k && v) o[k.trim()] = v.trim() }); return o as React.CSSProperties }

export default function FootballMediaPRView() {
  const [tab, setTab] = useState<'requests' | 'calendar' | 'coverage' | 'guidelines'>('requests')
  const tabs = [['requests', 'Media Requests', '📬'], ['calendar', 'PR Calendar', '📅'], ['coverage', 'Coverage Log', '📰'], ['guidelines', 'PR Guidelines', '📋']] as const
  const sent = (s: string) => s === 'positive' ? '#4ADE80' : s === 'negative' ? '#F87171' : '#9CA3AF'
  return (
    <div>
      <div className="mb-5"><h2 className="text-xl font-bold flex items-center gap-2" style={{ color: C.text }}><Newspaper size={18} style={{ color: C.blue }} /> Media &amp; PR</h2><p className="text-sm mt-1" style={{ color: C.text3 }}>Requests · Calendar · Coverage log · PR guidelines</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat label="Open Requests" value="3" sub="1 urgent · 2 pending" color="#F59E0B" />
        <Stat label="Coverage (month)" value="6" sub="4 positive · 2 neutral" color="#22C55E" />
        <Stat label="Total Reach" value="4.9M" sub="cumulative this month" color={C.blueLt} />
        <Stat label="Next Press Day" value="Sat" sub="Crown Broadcasting — Northgate (H)" color="#60A5FA" />
      </div>

      <div className="flex gap-1 mb-6 border-b overflow-x-auto" style={{ borderColor: C.border }}>
        {tabs.map(([id, label, icon]) => (
          <button key={id} onClick={() => setTab(id)} className="px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 -mb-px whitespace-nowrap" style={{ borderBottom: `2px solid ${tab === id ? C.blue : 'transparent'}`, color: tab === id ? C.blueLt : C.text4 }}><span>{icon}</span>{label}{id === 'requests' && <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.2)', color: '#F87171' }}>{REQUESTS.filter(r => r.urgency === 'urgent' || r.urgency === 'high').length}</span>}</button>
        ))}
      </div>

      {tab === 'requests' && <div className="space-y-4">{REQUESTS.map(r => (
        <div key={r.id} className="rounded-xl p-5" style={{ backgroundColor: C.panel, border: `1px solid ${r.urgency === 'urgent' ? 'rgba(239,68,68,0.4)' : r.urgency === 'high' ? 'rgba(245,158,11,0.3)' : C.border}` }}>
          <div className="flex items-start justify-between mb-3"><div><div className="flex items-center gap-2 mb-1"><span className="text-sm font-bold" style={{ color: C.text }}>{r.outlet}</span><span className="text-[10px] px-2 py-0.5 rounded" style={toStyle(urg(r.urgency))}>{r.urgency === 'urgent' ? '🔴 URGENT' : r.urgency === 'high' ? '🟡 High' : r.urgency === 'medium' ? 'Medium' : 'Low'}</span><span className="text-[10px] px-2 py-0.5 rounded" style={{ background: C.border, color: C.text4 }}>{r.type}</span></div><p className="text-xs font-medium" style={{ color: C.text2 }}>{r.subject}</p><p className="text-[10px]" style={{ color: C.text4 }}>Contact: {r.contact} · Deadline: {r.deadline}</p></div><span className="text-[10px] px-2 py-1 rounded font-medium shrink-0 ml-4" style={{ background: r.status.includes('Declined') ? C.border : r.status === 'Confirm by Thu' ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)', color: r.status.includes('Declined') ? C.text4 : r.status === 'Confirm by Thu' ? '#4ADE80' : '#FBBF24' }}>{r.status}</span></div>
          <p className="text-xs mb-2" style={{ color: C.text4 }}>{r.notes}</p>
          <div className="flex items-center justify-between pt-2" style={{ borderTop: `1px solid ${C.border}` }}><p className="text-[10px]" style={{ color: C.blueLt }}>💡 {r.recommended}</p>{!r.status.includes('Declined') && <div className="flex gap-2"><button className="px-3 py-1 rounded-lg text-[10px]" style={{ background: C.border, color: C.text3 }}>Decline</button><button className="px-3 py-1 rounded-lg text-[10px] font-bold text-white" style={{ background: C.blue }}>Accept →</button></div>}</div>
        </div>
      ))}</div>}

      {tab === 'calendar' && <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}><div className="p-4" style={{ borderBottom: `1px solid ${C.border}` }}><h3 className="text-sm font-bold" style={{ color: C.text }}>PR &amp; Media Calendar — April 2026</h3></div><div>{CALENDAR.map((day, i) => (
        <div key={i} className="flex gap-4 p-4" style={{ borderBottom: i < CALENDAR.length - 1 ? `1px solid ${C.border}` : undefined }}><div className="w-20 shrink-0"><div className="text-xs font-bold" style={{ color: C.text }}>{day.date.split(' ').slice(-2).join(' ')}</div><div className="text-[10px]" style={{ color: C.text4 }}>{day.date.split(' ')[0]}</div></div><div className="flex-1 space-y-2">{day.items.map((it, j) => (<div key={j} className="flex items-center gap-3 py-1.5 px-3 rounded-lg" style={{ background: C.panel2, border: `1px solid ${C.border}` }}><span className="text-[10px] w-10 shrink-0" style={{ color: C.text4 }}>{it.time}</span><span className="text-[10px] px-1.5 py-0.5 rounded shrink-0" style={{ background: it.type === 'Matchday' ? 'rgba(0,61,165,0.22)' : it.type === 'Interview' ? 'rgba(96,165,250,0.18)' : it.type === 'Deadline' ? 'rgba(239,68,68,0.2)' : it.type === 'Podcast' ? 'rgba(13,148,136,0.2)' : it.type === 'Content' ? 'rgba(34,197,94,0.18)' : C.border, color: it.type === 'Deadline' ? '#F87171' : C.text3 }}>{it.type}</span><span className="text-xs" style={{ color: C.text2 }}>{it.label}</span></div>))}</div></div>
      ))}</div></div>}

      {tab === 'coverage' && <div className="space-y-4"><div className="grid grid-cols-3 gap-4"><Stat label="Positive" value="4/6" sub="this month" color="#22C55E" /><Stat label="Total reach" value="4.9M" sub="cumulative" color={C.blueLt} /><Stat label="Top outlet" value="The Dispatch" sub="2.4M reach" color="#60A5FA" /></div><div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}><table className="w-full text-sm"><thead><tr className="text-[10px] uppercase tracking-wider" style={{ color: C.text4, borderBottom: `1px solid ${C.border}`, background: 'rgba(17,24,39,0.3)' }}><th className="text-left p-3">Date</th><th className="text-left p-3">Outlet</th><th className="text-left p-3">Headline</th><th className="text-center p-3">Reach</th><th className="text-center p-3">Sentiment</th></tr></thead><tbody>{COVERAGE.map((c, i) => (<tr key={i} style={{ borderBottom: `1px solid ${C.border}80` }}><td className="p-3 text-xs" style={{ color: C.text4 }}>{c.date}</td><td className="p-3 text-xs font-medium" style={{ color: C.text2 }}>{c.outlet}</td><td className="p-3 text-xs" style={{ color: C.text4 }}>{c.headline}</td><td className="p-3 text-center text-xs font-medium" style={{ color: C.blueLt }}>{c.reach}</td><td className="p-3 text-center"><span className="text-xs font-medium" style={{ color: sent(c.sentiment) }}>{c.sentiment === 'positive' ? '↑ Positive' : '→ Neutral'}</span></td></tr>))}</tbody></table></div></div>}

      {tab === 'guidelines' && <div className="space-y-4"><div className="rounded-xl p-4" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}><p className="text-xs" style={{ color: '#FCD34D' }}><strong>Policy:</strong> All media requests must be approved by the Head of Media. Restricted topics require additional sign-off.</p></div><div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}><div className="p-4" style={{ borderBottom: `1px solid ${C.border}` }}><h3 className="text-sm font-bold" style={{ color: C.text }}>Media Response Guidelines — Oakridge FC</h3></div><div>{GUIDELINES.map((g, i) => (<div key={i} className="p-4" style={{ background: g.restricted ? 'rgba(239,68,68,0.05)' : undefined, borderBottom: i < GUIDELINES.length - 1 ? `1px solid ${C.border}` : undefined }}><div className="flex items-center gap-2 mb-1.5"><span className="text-xs font-bold" style={{ color: C.text }}>{g.topic}</span>{g.restricted && <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.2)', color: '#F87171' }}>🔒 Restricted</span>}</div><p className="text-xs" style={{ color: C.text4 }}>{g.rule}</p></div>))}</div></div>
        <div className="rounded-xl p-5" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}><h3 className="text-sm font-bold mb-3" style={{ color: C.text }}>Standard Response Templates</h3><div className="space-y-3">{TEMPLATES.map((t, i) => (<div key={i} className="rounded-lg p-3" style={{ background: C.panel2, border: `1px solid ${C.border}` }}><div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: C.text4 }}>{t.s}</div><p className="text-xs italic" style={{ color: C.text2 }}>&ldquo;{t.r}&rdquo;</p></div>))}</div></div>
      </div>}
    </div>
  )
}
