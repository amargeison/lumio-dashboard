'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'

// Men's Pro — Fan Hub. Community · Forum · Events · Memberships. Mirrors the
// Women's FanHubView, blue-themed with men's (Championship-scale) data.

const C = {
  panel: '#0D1117', border: '#1F2937',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280',
  blue: '#003DA5', blueLt: '#60A5FA',
}

const StatCard = ({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) => (
  <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
    <div className="text-[10px] uppercase tracking-wider" style={{ color: C.text4 }}>{label}</div>
    <div className="text-xl font-black mt-1" style={{ color }}>{value}</div>
    {sub && <div className="text-[10px] mt-0.5" style={{ color: C.text4 }}>{sub}</div>}
  </div>
)

type Topic = { id: number; category: string; title: string; posts: number; views: number; lastActive: string; hot: boolean }
const FORUM: Topic[] = [
  { id: 1, category: 'Match Discussion', title: 'Eastcliff Town (A) — Post-match thread 🔵', posts: 184, views: 4240, lastActive: '2h ago', hot: true },
  { id: 2, category: 'Transfers',        title: 'Summer window wishlist — who should we sign?', posts: 312, views: 8100, lastActive: '1h ago', hot: true },
  { id: 3, category: 'Commercial',       title: 'New home kit launch reaction — love it or leave it?', posts: 195, views: 5680, lastActive: '3h ago', hot: true },
  { id: 4, category: 'Match Discussion', title: 'Barford Town (A) — Cup tie preview', posts: 91, views: 1540, lastActive: '6h ago', hot: false },
  { id: 5, category: 'General',          title: 'Season tickets 2026/27 — thoughts on pricing?', posts: 148, views: 3110, lastActive: '12h ago', hot: false },
  { id: 6, category: 'Academy',          title: 'U18 talent watch — who to look out for?', posts: 79, views: 1480, lastActive: '1d ago', hot: false },
  { id: 7, category: 'Match Discussion', title: 'Promotion run-in — can we make the play-offs?', posts: 265, views: 7200, lastActive: '30m ago', hot: true },
  { id: 8, category: 'General',          title: 'East Stand redevelopment — latest renders', posts: 122, views: 2640, lastActive: '2d ago', hot: false },
]
const catColor = (c: string): { background: string; color: string } =>
  c === 'Match Discussion' ? { background: 'rgba(34,197,94,0.2)', color: '#4ADE80' } :
  c === 'Transfers'        ? { background: 'rgba(0,61,165,0.22)', color: '#60A5FA' } :
  c === 'Academy'          ? { background: 'rgba(139,92,246,0.2)', color: '#C4B5FD' } :
  c === 'Commercial'       ? { background: 'rgba(245,158,11,0.2)', color: '#FBBF24' } :
                             { background: 'rgba(75,85,99,0.3)',  color: '#9CA3AF' }

type Tier = { name: string; price: string; border: string; members: number; revenue: number; barColor: string; features: string[] }
const TIERS: Tier[] = [
  { name: 'Fan Hub Free', price: '£0/yr', border: '#374151', members: 4200, revenue: 0, barColor: '#6B7280', features: ['Access to Fan Hub forum', 'Monthly club newsletter', 'Match result notifications', 'Public match highlights'] },
  { name: 'Supporter', price: '£35/yr', border: 'rgba(0,61,165,0.5)', members: 1850, revenue: 64750, barColor: '#003DA5', features: ['Everything in Free', 'Early ticket access (24hr)', 'Monthly player Q&A', 'Exclusive behind-the-scenes content', 'Digital matchday programme'] },
  { name: 'Club Member', price: '£75/yr', border: 'rgba(96,165,250,0.5)', members: 540, revenue: 40500, barColor: '#60A5FA', features: ['Everything in Supporter', 'Training session guest pass', 'Annual meet-the-manager event', 'Priority season ticket', 'Member kit discount (15%)', 'Stadium tour'] },
]
const TOTAL = TIERS.reduce((s, t) => s + t.members, 0)
const TOTAL_REV = TIERS.reduce((s, t) => s + t.revenue, 0)

type Ev = { date: string; event: string; location: string; type: string; tickets: string }
const EVENTS: Ev[] = [
  { date: 'Sat 12 Apr', event: 'Fan Zone — Northgate City (H)', location: 'Oakridge Park', type: 'Matchday', tickets: 'Free entry' },
  { date: 'Sun 20 Apr', event: 'Player Q&A — Supporter exclusive', location: 'Club Lounge', type: 'Supporter', tickets: 'Members only' },
  { date: 'Sat 3 May', event: 'End of Season Fan Day', location: 'Oakridge Park', type: 'All fans', tickets: 'RSVP required' },
  { date: 'Sun 11 May', event: 'Player of the Year Awards Night', location: 'Oakridge Conference', type: 'Club Mbr', tickets: 'Club members only' },
  { date: 'Sat 7 Jun', event: 'Meet the Manager — 2026/27 Preview', location: 'Oakridge Park', type: 'Club Mbr', tickets: 'Club members only' },
  { date: 'Sat 28 Jun', event: 'New Kit Launch — Fan Hub first', location: 'Oakridge Park', type: 'All fans', tickets: 'Free entry' },
]
const evColor = (t: string): { background: string; color: string } =>
  t === 'Matchday' ? { background: 'rgba(34,197,94,0.2)', color: '#4ADE80' } :
  t === 'Supporter' ? { background: 'rgba(0,61,165,0.22)', color: '#60A5FA' } :
  t === 'Club Mbr' ? { background: 'rgba(139,92,246,0.2)', color: '#C4B5FD' } :
                     { background: 'rgba(96,165,250,0.15)', color: '#93C5FD' }

type FanTab = 'overview' | 'forum' | 'events' | 'memberships'

export default function FootballFanHub() {
  const [tab, setTab] = useState<FanTab>('overview')
  const tabs: { id: FanTab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' }, { id: 'forum', label: 'Forum', icon: '💬' },
    { id: 'events', label: 'Events', icon: '🎟️' }, { id: 'memberships', label: 'Memberships', icon: '🏅' },
  ]
  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: C.text }}><Heart size={18} style={{ color: C.blue }} /> Fan Hub</h2>
        <p className="text-sm mt-1" style={{ color: C.text3 }}>Community · Forum · Events · Memberships</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Hub Members" value={TOTAL.toLocaleString()} sub="4,200 free · 2,390 paid" color={C.blueLt} />
        <StatCard label="Forum Posts" value="1,496" sub="This month" color="#C4B5FD" />
        <StatCard label="Match overlap" value="74%" sub="Members who attend" color="#0D9488" />
        <StatCard label="Events" value="2" sub="1 matchday · 1 members" color="#60A5FA" />
      </div>

      <div className="flex gap-1 mb-6 border-b overflow-x-auto" style={{ borderColor: C.border }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className="px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 transition-all -mb-px whitespace-nowrap"
            style={{ borderBottom: `2px solid ${tab === t.id ? C.blue : 'transparent'}`, color: tab === t.id ? C.blueLt : C.text4 }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          {(() => {
            const W = 600, H = 160, pL = 40, pR = 16, pT = 16, iH = H - pT - 32, ms = ['Jan', 'Feb', 'Mar', 'Apr'], mv = [4800, 5600, 6200, 6590], mn = 4000, mx = 7000, sX = (W - pL - pR) / (ms.length - 1)
            const path = mv.map((m, i) => `${i === 0 ? 'M' : 'L'} ${pL + i * sX} ${pT + iH - ((m - mn) / (mx - mn)) * iH}`).join(' ')
            const area = `${path} L ${pL + (ms.length - 1) * sX} ${pT + iH} L ${pL} ${pT + iH} Z`
            return (
              <div className="rounded-xl p-5" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
                <h3 className="text-sm font-bold mb-1" style={{ color: C.text }}>Fan Hub Member Growth</h3>
                <p className="text-xs mb-4" style={{ color: C.text4 }}>Launched Jan 2026 — 6,590 members in 4 months.</p>
                <svg viewBox={`0 0 ${W} ${H}`} width="100%">
                  <path d={area} fill={C.blue} opacity="0.1" />
                  <path d={path} fill="none" stroke={C.blueLt} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  {mv.map((m, i) => <g key={i}><circle cx={pL + i * sX} cy={pT + iH - ((m - mn) / (mx - mn)) * iH} r="4" fill={C.blueLt} /><text x={pL + i * sX} y={pT + iH - ((m - mn) / (mx - mn)) * iH - 8} fontSize="9" fill={C.blueLt} textAnchor="middle" fontWeight="bold">{m.toLocaleString()}</text></g>)}
                  {ms.map((l, i) => <text key={l} x={pL + i * sX} y={H - 4} fontSize="9" fill="#6B7280" textAnchor="middle">{l}</text>)}
                </svg>
              </div>
            )
          })()}
          <div className="rounded-xl p-5" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
            <h3 className="text-sm font-bold mb-4" style={{ color: C.text }}>Trending Topics</h3>
            <div className="space-y-2">
              {FORUM.filter(t => t.hot).map((t, i) => (
                <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${C.border}80` }}>
                  <div className="flex items-center gap-3"><span className="text-[10px]">🔥</span><div><div className="text-xs" style={{ color: C.text2 }}>{t.title}</div><div className="flex items-center gap-2 mt-0.5"><span className="text-[9px] px-1.5 py-0.5 rounded" style={catColor(t.category)}>{t.category}</span><span className="text-[10px]" style={{ color: C.text4 }}>{t.lastActive}</span></div></div></div>
                  <div className="text-right shrink-0 ml-4"><div className="text-xs font-bold" style={{ color: C.blueLt }}>{t.posts} posts</div><div className="text-[10px]" style={{ color: C.text4 }}>{t.views.toLocaleString()} views</div></div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Top topic" value="Transfers" sub="312 posts" color="#60A5FA" />
            <StatCard label="New members" value="+390" sub="This month" color="#4ADE80" />
            <StatCard label="Paid conversions" value="36%" sub="Free → paid" color={C.blueLt} />
            <StatCard label="Fan revenue" value="£105k" sub="Memberships YTD" color="#0D9488" />
          </div>
        </div>
      )}

      {tab === 'forum' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2"><p className="text-xs" style={{ color: C.text4 }}>{FORUM.length} topics · {FORUM.reduce((s, t) => s + t.posts, 0)} posts</p><button className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: 'rgba(0,61,165,0.22)', color: C.blueLt, border: '1px solid rgba(0,61,165,0.3)' }}>+ New topic</button></div>
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
            <table className="w-full text-sm"><thead><tr className="text-[10px] uppercase tracking-wider" style={{ color: C.text4, borderBottom: `1px solid ${C.border}`, background: 'rgba(17,24,39,0.3)' }}><th className="text-left p-3">Topic</th><th className="text-left p-3">Category</th><th className="text-center p-3">Posts</th><th className="text-center p-3">Views</th><th className="text-center p-3">Active</th></tr></thead>
              <tbody>{FORUM.map((t, i) => <tr key={i} style={{ borderBottom: `1px solid ${C.border}80` }}><td className="p-3"><div className="flex items-center gap-2">{t.hot && <span className="text-xs">🔥</span>}<span className="text-xs" style={{ color: C.text2 }}>{t.title}</span></div></td><td className="p-3"><span className="text-[10px] px-2 py-0.5 rounded" style={catColor(t.category)}>{t.category}</span></td><td className="p-3 text-center text-xs font-bold" style={{ color: C.blueLt }}>{t.posts}</td><td className="p-3 text-center text-xs" style={{ color: C.text4 }}>{t.views.toLocaleString()}</td><td className="p-3 text-center text-[10px]" style={{ color: C.text4 }}>{t.lastActive}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'events' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2"><p className="text-xs" style={{ color: C.text4 }}>{EVENTS.length} events · Apr–Jun 2026</p><button className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: 'rgba(0,61,165,0.22)', color: C.blueLt, border: '1px solid rgba(0,61,165,0.3)' }}>+ Add event</button></div>
          {EVENTS.map((e, i) => (
            <div key={i} className="rounded-xl p-5" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
              <div className="flex items-start justify-between">
                <div><div className="flex items-center gap-2 mb-1"><span className="text-sm font-bold" style={{ color: C.text }}>{e.event}</span><span className="text-[10px] px-2 py-0.5 rounded" style={evColor(e.type)}>{e.type}</span></div><div className="flex items-center gap-3 text-[10px]" style={{ color: C.text4 }}><span>📅 {e.date}</span><span>📍 {e.location}</span><span>🎟️ {e.tickets}</span></div></div>
                <button className="px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 ml-4" style={{ background: 'rgba(0,61,165,0.22)', color: C.blueLt, border: '1px solid rgba(0,61,165,0.3)' }}>Manage →</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'memberships' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TIERS.map((tier, i) => (
              <div key={i} className="rounded-xl p-5" style={{ backgroundColor: C.panel, border: `2px solid ${tier.border}` }}>
                <div className="flex items-center justify-between mb-3"><div><span className="text-[10px] px-2 py-0.5 rounded font-bold" style={{ background: `${tier.barColor}22`, color: tier.barColor === '#6B7280' ? '#9CA3AF' : C.blueLt }}>{tier.name}</span><div className="text-xl font-bold mt-2" style={{ color: C.text }}>{tier.price}</div></div><div className="text-right"><div className="text-lg font-bold" style={{ color: C.blueLt }}>{tier.members.toLocaleString()}</div><div className="text-[10px]" style={{ color: C.text4 }}>members</div></div></div>
                <div className="space-y-1.5">{tier.features.map((f, j) => <div key={j} className="flex items-start gap-1.5 text-xs" style={{ color: C.text2 }}><span className="mt-0.5 shrink-0" style={{ color: '#4ADE80' }}>✓</span>{f}</div>)}</div>
                <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${C.border}` }}><div className="w-full rounded-full h-1.5 mb-1" style={{ background: C.border }}><div className="h-1.5 rounded-full" style={{ width: `${(tier.members / TOTAL) * 100}%`, background: tier.barColor }} /></div><div className="text-[10px]" style={{ color: C.text4 }}>{((tier.members / TOTAL) * 100).toFixed(0)}% of total</div></div>
              </div>
            ))}
          </div>
          <div className="rounded-xl p-5" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
            <h3 className="text-sm font-bold mb-4" style={{ color: C.text }}>Membership Revenue — YTD</h3>
            <div className="space-y-3">
              {TIERS.map(r => (
                <div key={r.name}><div className="flex justify-between text-xs mb-1"><span style={{ color: C.text4 }}>{r.name} ({r.members.toLocaleString()})</span><span className="font-bold" style={{ color: C.text }}>{r.revenue === 0 ? 'Free' : `£${r.revenue.toLocaleString()}`}</span></div><div className="w-full rounded-full h-1.5" style={{ background: C.border }}><div className="h-1.5 rounded-full" style={{ width: `${(r.revenue / TOTAL_REV) * 100}%`, background: r.barColor }} /></div></div>
              ))}
              <div className="pt-3 flex justify-between text-sm" style={{ borderTop: `1px solid ${C.border}` }}><span style={{ color: C.text4 }}>Total YTD</span><span className="font-bold" style={{ color: C.blueLt }}>£{TOTAL_REV.toLocaleString()}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
