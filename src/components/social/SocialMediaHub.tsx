'use client'

import { useState } from 'react'
import { Plus, Calendar, BarChart3, Bell, MessageSquare } from 'lucide-react'

// Shared Social Media Hub — combines every section from the Men's and Women's
// portals (nothing lost): action bar + 6 KPIs + Dashboard (platform cards,
// follower-growth chart, best posts) + Content Calendar + Scheduled +
// Performance (breakdown + engagement trend) + Mentions & Sentiment.
// Accent-parameterized + data via SocialProfile. Demo only.

const G = {
  panel: '#0D1117', panelAlt: '#111318', border: '#1F2937',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280',
  good: '#22C55E', warn: '#F59E0B', bad: '#EF4444',
}

export type SocialPlatform = { name: string; emoji: string; followersNum: number; followersLabel: string; growthPct: number; engRate: number; bestReach: number; bestPost: string; weeklyGrowth: string; bestTime: string }
export type SocialProfile = {
  clubLine: string
  kpis: { label: string; value: string; sub: string; color: string }[]
  platforms: SocialPlatform[]
  growth: { labels: string[]; followers: number[]; engagement: number[]; min: number; max: number; engMin: number; engMax: number }
  growthCaption: string
  bestPosts: { platform: string; reach: string; eng: string; desc: string; date: string }[]
  pillars: { day: string; theme: string; icon: string; pl: string }[]
  scheduled: { date: string; time: string; platform: string; type: string; caption: string; status: string; reach: string }[]
  mentions: { user: string; time: string; content: string; likes: number; sentiment: 'positive' | 'neutral' | 'negative' }[]
  sentiment: { label: string; v: number; color: string }[]
}

const KpiCard = ({ k }: { k: SocialProfile['kpis'][0] }) => (
  <div className="rounded-xl p-4" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
    <div className="text-[10px] uppercase tracking-wider" style={{ color: G.text4 }}>{k.label}</div>
    <div className="text-xl font-black mt-1" style={{ color: k.color }}>{k.value}</div>
    <div className="text-[10px] mt-0.5" style={{ color: G.text4 }}>{k.sub}</div>
  </div>
)

const platBadge = (p: string, accent: string): { background: string; color: string } =>
  /insta/i.test(p) ? { background: 'rgba(236,72,153,0.18)', color: '#F472B6' } :
  /tiktok/i.test(p) ? { background: 'rgba(75,85,99,0.4)', color: '#D1D5DB' } :
  /(^x$|twitter)/i.test(p) ? { background: 'rgba(0,61,165,0.22)', color: '#60A5FA' } :
  /face/i.test(p) ? { background: 'rgba(37,99,235,0.18)', color: '#60A5FA' } :
  /you/i.test(p) ? { background: 'rgba(239,68,68,0.18)', color: '#F87171' } :
  { background: `${accent}22`, color: accent }
const statusColor = (s: string): string => s === 'Scheduled' ? G.good : s === 'Needs approval' ? G.bad : s === 'Draft' ? G.text4 : G.warn

type Tab = 'dashboard' | 'calendar' | 'scheduled' | 'performance' | 'mentions'

export default function SocialMediaHub({ accent, profile }: { accent: string; profile: SocialProfile }) {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [platform, setPlatform] = useState(0)
  const [sentimentFilter, setSentimentFilter] = useState<string>('all')
  const [toast, setToast] = useState<string | null>(null)
  const act = (l: string) => { setToast(`${l} — opening…`); setTimeout(() => setToast(null), 2200) }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' }, { id: 'calendar', label: 'Content Cal', icon: '📅' },
    { id: 'scheduled', label: 'Scheduled', icon: '📤' }, { id: 'performance', label: 'Performance', icon: '📈' },
    { id: 'mentions', label: 'Mentions & Sentiment', icon: '💬' },
  ]
  const g = profile.growth
  const sX = (W: number, pL: number, pR: number) => (W - pL - pR) / (g.labels.length - 1)
  const filtered = sentimentFilter === 'all' ? profile.mentions : profile.mentions.filter(m => m.sentiment === sentimentFilter)
  const p = profile.platforms[platform]

  return (
    <div className="space-y-5">
      <div><h2 className="text-xl font-bold" style={{ color: G.text }}>Social Media Hub</h2><p className="text-sm mt-1" style={{ color: G.text3 }}>{profile.clubLine}</p></div>

      <div className="flex items-center gap-2 flex-wrap">
        {[{ l: 'Create Post', i: Plus }, { l: 'Schedule Content', i: Calendar }, { l: 'Analytics Report', i: BarChart3 }, { l: 'Set Up Alerts', i: Bell }, { l: 'Reply to Mentions', i: MessageSquare }].map(a => (
          <button key={a.l} onClick={() => act(a.l)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap text-white transition-opacity hover:opacity-90" style={{ backgroundColor: accent }}><a.i size={12} />{a.l}</button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">{profile.kpis.map(k => <KpiCard key={k.label} k={k} />)}</div>

      <div className="flex gap-1 border-b overflow-x-auto" style={{ borderColor: G.border }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className="px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 -mb-px whitespace-nowrap transition-all"
            style={{ borderBottom: `2px solid ${tab === t.id ? accent : 'transparent'}`, color: tab === t.id ? accent : G.text4 }}><span>{t.icon}</span>{t.label}</button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{profile.platforms.slice(0, 4).map(pl => (
            <div key={pl.name} className="rounded-xl p-4" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
              <div className="flex items-center justify-between mb-3"><span className="text-lg">{pl.emoji}</span><span className="text-[10px] font-bold" style={{ color: G.good }}>+{pl.growthPct}%</span></div>
              <div className="text-xl font-bold mb-0.5" style={{ color: G.text }}>{pl.followersLabel}</div>
              <div className="text-[10px] mb-2" style={{ color: G.text4 }}>{pl.name}</div>
              <div className="w-full rounded-full h-1 mb-2" style={{ background: G.border }}><div className="h-1 rounded-full" style={{ width: `${Math.min((pl.followersNum / profile.platforms[0].followersNum) * 100, 100)}%`, background: accent }} /></div>
              <div className="text-[10px]" style={{ color: G.text4 }}>{pl.engRate}% eng</div>
            </div>
          ))}</div>
          {(() => { const W = 600, H = 160, pL = 48, pR = 16, pT = 16, iH = H - pT - 32, s = sX(W, pL, pR); const path = g.followers.map((f, i) => `${i === 0 ? 'M' : 'L'} ${pL + i * s} ${pT + iH - ((f - g.min) / (g.max - g.min)) * iH}`).join(' '); const area = `${path} L ${pL + (g.labels.length - 1) * s} ${pT + iH} L ${pL} ${pT + iH} Z`; return (
            <div className="rounded-xl p-5" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
              <h3 className="text-sm font-bold mb-1" style={{ color: G.text }}>Total Follower Growth</h3><p className="text-xs mb-4" style={{ color: G.text4 }}>{profile.growthCaption}</p>
              <svg viewBox={`0 0 ${W} ${H}`} width="100%"><path d={area} fill={accent} opacity="0.08" /><path d={path} fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />{g.followers.map((f, i) => <circle key={i} cx={pL + i * s} cy={pT + iH - ((f - g.min) / (g.max - g.min)) * iH} r="3" fill={accent} />)}{g.labels.map((l, i) => <text key={l} x={pL + i * s} y={H - 4} fontSize="9" fill="#6B7280" textAnchor="middle">{l}</text>)}</svg>
            </div>
          ) })()}
          <div className="rounded-xl p-5" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
            <h3 className="text-sm font-bold mb-4" style={{ color: G.text }}>Best Performing Posts</h3>
            <div className="space-y-3">{profile.bestPosts.map((post, i) => (
              <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${G.border}80` }}>
                <div className="flex items-center gap-3"><span className="text-[10px] px-2 py-0.5 rounded" style={platBadge(post.platform, accent)}>{post.platform}</span><span className="text-xs" style={{ color: G.text2 }}>{post.desc}</span></div>
                <div className="flex items-center gap-4 shrink-0"><span className="text-xs font-bold" style={{ color: accent }}>{post.reach}</span><span className="text-[10px]" style={{ color: G.good }}>{post.eng}</span><span className="text-[10px]" style={{ color: G.text4 }}>{post.date}</span></div>
              </div>
            ))}</div>
          </div>
        </div>
      )}

      {tab === 'calendar' && (
        <div className="space-y-4">
          <div className="rounded-xl p-5" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
            <h3 className="text-sm font-bold mb-4" style={{ color: G.text }}>Weekly Pillars</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{profile.pillars.map(c => (
              <div key={c.day} className="rounded-lg p-3" style={{ background: G.panelAlt, border: `1px solid ${G.border}` }}><div className="flex items-center gap-2 mb-1"><span className="text-xs font-bold" style={{ color: accent }}>{c.day}</span><span>{c.icon}</span></div><div className="text-xs font-semibold mb-1" style={{ color: G.text }}>{c.theme}</div><div className="text-[10px]" style={{ color: G.text4 }}>{c.pl}</div></div>
            ))}</div>
          </div>
          <div className="rounded-xl p-5" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
            <h3 className="text-sm font-bold mb-4" style={{ color: G.text }}>Upcoming</h3>
            <div className="space-y-2">{profile.scheduled.map((ps, i) => (
              <div key={i} className="flex items-center gap-3 py-2" style={{ borderBottom: `1px solid ${G.border}80` }}><div className="w-20 shrink-0"><div className="text-[10px]" style={{ color: G.text3 }}>{ps.date}</div><div className="text-[10px]" style={{ color: G.text4 }}>{ps.time}</div></div><span className="text-[10px] px-2 py-0.5 rounded shrink-0" style={platBadge(ps.platform, accent)}>{ps.platform}</span><span className="text-[10px] shrink-0" style={{ color: G.text4 }}>{ps.type}</span><span className="text-xs flex-1 truncate" style={{ color: G.text2 }}>{ps.caption}</span><span className="text-[10px] shrink-0 font-medium" style={{ color: statusColor(ps.status) }}>{ps.status}</span></div>
            ))}</div>
          </div>
        </div>
      )}

      {tab === 'scheduled' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2"><p className="text-xs" style={{ color: G.text4 }}>{profile.scheduled.length} posts</p><button onClick={() => act('Schedule')} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: accent }}>+ Schedule</button></div>
          {profile.scheduled.map((ps, i) => (
            <div key={i} className="rounded-xl p-4" style={{ backgroundColor: G.panel, border: `1px solid ${ps.status === 'Needs approval' ? 'rgba(239,68,68,0.4)' : ps.status === 'Scheduled' ? 'rgba(34,197,94,0.2)' : G.border}` }}>
              <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><span className="text-[10px] px-2 py-0.5 rounded" style={platBadge(ps.platform, accent)}>{ps.platform}</span><span className="text-[10px] px-2 py-0.5 rounded" style={{ background: G.border, color: G.text4 }}>{ps.type}</span><span className="text-[10px]" style={{ color: G.text4 }}>{ps.date} · {ps.time}</span></div><div className="flex items-center gap-2"><span className="text-[10px]" style={{ color: G.text4 }}>{ps.reach}</span><span className="text-[10px] font-bold" style={{ color: statusColor(ps.status) }}>{ps.status}</span></div></div>
              <p className="text-xs" style={{ color: G.text2 }}>{ps.caption}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'performance' && (
        <div className="space-y-6">
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
            <div className="p-4" style={{ borderBottom: `1px solid ${G.border}` }}><h3 className="text-sm font-bold" style={{ color: G.text }}>Platform Breakdown</h3></div>
            <table className="w-full text-sm"><thead><tr className="text-[10px] uppercase tracking-wider" style={{ color: G.text4, borderBottom: `1px solid ${G.border}`, background: 'rgba(17,24,39,0.3)' }}><th className="text-left p-3">Platform</th><th className="text-center p-3">Followers</th><th className="text-center p-3">Growth</th><th className="text-center p-3">Eng %</th><th className="text-center p-3">Best reach</th><th className="text-left p-3">Best post</th></tr></thead>
              <tbody>{profile.platforms.map((pl, i) => <tr key={i} style={{ borderBottom: `1px solid ${G.border}80` }}><td className="p-3"><div className="flex items-center gap-2"><span>{pl.emoji}</span><span className="text-xs font-medium" style={{ color: G.text2 }}>{pl.name}</span></div></td><td className="p-3 text-center text-xs font-bold" style={{ color: G.text }}>{pl.followersLabel}</td><td className="p-3 text-center text-xs font-bold" style={{ color: G.good }}>+{pl.growthPct}%</td><td className="p-3 text-center text-xs font-bold" style={{ color: accent }}>{pl.engRate}%</td><td className="p-3 text-center text-xs font-bold" style={{ color: '#A78BFA' }}>{(pl.bestReach / 1000).toFixed(0)}k</td><td className="p-3 text-xs" style={{ color: G.text4 }}>{pl.bestPost}</td></tr>)}</tbody>
            </table>
          </div>
          {(() => { const W = 600, H = 160, pL = 36, pR = 16, pT = 16, iH = H - pT - 32, s = sX(W, pL, pR); const path = g.engagement.map((e, i) => `${i === 0 ? 'M' : 'L'} ${pL + i * s} ${pT + iH - ((e - g.engMin) / (g.engMax - g.engMin)) * iH}`).join(' '); return (
            <div className="rounded-xl p-5" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
              <h3 className="text-sm font-bold mb-1" style={{ color: G.text }}>Engagement Rate — Season Trend</h3><p className="text-xs mb-4" style={{ color: G.text4 }}>Content engagement across the season.</p>
              <svg viewBox={`0 0 ${W} ${H}`} width="100%"><path d={path} fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />{g.engagement.map((e, i) => <circle key={i} cx={pL + i * s} cy={pT + iH - ((e - g.engMin) / (g.engMax - g.engMin)) * iH} r="3" fill="#8B5CF6" />)}{g.labels.map((l, i) => <text key={l} x={pL + i * s} y={H - 4} fontSize="9" fill="#6B7280" textAnchor="middle">{l}</text>)}</svg>
            </div>
          ) })()}
        </div>
      )}

      {tab === 'mentions' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">{profile.platforms.map((sp, i) => (
            <button key={sp.name} onClick={() => setPlatform(i)} className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: platform === i ? accent : G.panelAlt, color: platform === i ? '#fff' : G.text3, border: platform === i ? 'none' : `1px solid ${G.border}` }}>{sp.emoji} {sp.name}</button>
          ))}</div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-xl p-5" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
              <p className="text-sm font-bold mb-3" style={{ color: G.text }}>{p.emoji} {p.name}</p>
              {[{ l: 'Followers', v: p.followersLabel }, { l: 'Weekly Growth', v: p.weeklyGrowth }, { l: 'Engagement', v: `${p.engRate}%` }, { l: 'Best Post Time', v: p.bestTime }].map(s => (
                <div key={s.l} className="flex justify-between py-1.5"><span className="text-xs" style={{ color: G.text3 }}>{s.l}</span><span className="text-xs font-bold" style={{ color: G.text }}>{s.v}</span></div>
              ))}
            </div>
            <div className="lg:col-span-2 rounded-xl overflow-hidden" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${G.border}` }}><p className="text-sm font-bold" style={{ color: G.text }}>Mentions</p><div className="flex gap-1">{['all', 'positive', 'neutral', 'negative'].map(f => (<button key={f} onClick={() => setSentimentFilter(f)} className="px-2 py-1 rounded text-[10px] font-semibold capitalize" style={{ backgroundColor: sentimentFilter === f ? accent : G.border, color: G.text }}>{f}</button>))}</div></div>
              <div className="max-h-80 overflow-y-auto">{filtered.map((m, i) => (
                <div key={i} className="px-5 py-3 flex gap-3" style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${G.border}` : undefined }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold" style={{ backgroundColor: G.border, color: G.text3 }}>{m.user[1].toUpperCase()}</div>
                  <div className="flex-1 min-w-0"><p className="text-xs"><span className="font-bold" style={{ color: G.text }}>{m.user}</span> <span style={{ color: G.text4 }}>· {m.time}</span></p><p className="text-xs mt-1" style={{ color: G.text2 }}>{m.content}</p><div className="flex items-center gap-3 mt-1"><span className="text-[10px]" style={{ color: G.text4 }}>❤️ {m.likes}</span><span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: m.sentiment === 'positive' ? 'rgba(34,197,94,0.12)' : m.sentiment === 'negative' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)', color: m.sentiment === 'positive' ? G.good : m.sentiment === 'negative' ? G.bad : G.warn }}>{m.sentiment}</span></div></div>
                </div>
              ))}</div>
            </div>
          </div>
          <div className="rounded-xl p-5" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
            <p className="text-sm font-bold mb-3" style={{ color: G.text }}>Sentiment Analysis</p>
            {profile.sentiment.map(s => (<div key={s.label} className="mb-2"><div className="flex justify-between text-xs mb-1"><span style={{ color: G.text3 }}>{s.label}</span><span style={{ color: s.color }}>{s.v}%</span></div><div className="h-2 rounded-full" style={{ backgroundColor: G.border }}><div className="h-full rounded-full" style={{ width: `${s.v}%`, backgroundColor: s.color }} /></div></div>))}
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-6 right-6 z-[100] rounded-xl px-4 py-3 text-sm font-medium shadow-xl text-white" style={{ backgroundColor: accent }}>{toast}</div>}
    </div>
  )
}
