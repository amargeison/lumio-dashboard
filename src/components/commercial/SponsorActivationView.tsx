'use client'

import { Megaphone } from 'lucide-react'

// Shared Sponsor Activation & ROI — Commercial. Accent + profile driven.
// Fulfilment by sponsor, activation calendar, delivered media value by channel,
// ROI (media value vs fee). Demo only.

const G = {
  panel: '#0D1117', panelAlt: '#111318', border: '#1F2937',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280',
  good: '#22C55E', warn: '#F59E0B', bad: '#EF4444', info: '#60A5FA',
}

export type SponsorRoiProfile = {
  kpis: { label: string; value: string; sub: string; color: string }[]
  fulfilment: { sponsor: string; obligations: number; delivered: number; pct: number; mediaValue: string }[]
  calendar: { date: string; sponsor: string; activity: string; channel: string; status?: string }[]
  channels: { channel: string; value: string; pct: number }[]
  roi: { sponsor: string; fee: string; mediaValue: string; ratio: number }[]
}
const pctCol = (p: number) => p >= 90 ? G.good : p >= 75 ? G.warn : G.bad

export default function SponsorActivationView({ accent, profile }: { accent: string; profile: SponsorRoiProfile }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: G.text }}><Megaphone size={18} style={{ color: accent }} /> Sponsor Activation &amp; ROI</h2>
        <p className="text-sm mt-1" style={{ color: G.text3 }}>Contracted obligations delivered, activation calendar and media-value return per sponsor.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {profile.kpis.map(k => (<div key={k.label} className="rounded-xl p-3.5" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}><div className="text-[10px] uppercase tracking-wider" style={{ color: G.text4 }}>{k.label}</div><div className="text-xl font-black mt-1" style={{ color: k.color }}>{k.value}</div><div className="text-[10px] mt-0.5" style={{ color: G.text4 }}>{k.sub}</div></div>))}
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
        <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${G.border}` }}><h3 className="text-sm font-bold" style={{ color: G.text }}>Obligation fulfilment by sponsor</h3></div>
        <table className="w-full text-xs"><thead><tr style={{ color: G.text4, borderBottom: `1px solid ${G.border}` }}><th className="text-left px-4 py-2.5 font-semibold">Sponsor</th><th className="text-left px-4 py-2.5 font-semibold">Delivered</th><th className="text-left px-4 py-2.5 font-semibold">Fulfilment</th><th className="text-right px-4 py-2.5 font-semibold">Media value</th></tr></thead>
          <tbody>{profile.fulfilment.map((f, i) => (<tr key={i} style={{ borderBottom: `1px solid ${G.border}80` }}><td className="px-4 py-2.5 font-medium" style={{ color: G.text2 }}>{f.sponsor}</td><td className="px-4 py-2.5" style={{ color: G.text3 }}>{f.delivered} / {f.obligations}</td><td className="px-4 py-2.5"><div className="flex items-center gap-2"><div className="rounded-full h-1.5 w-20" style={{ background: G.border }}><div className="h-1.5 rounded-full" style={{ width: `${f.pct}%`, background: pctCol(f.pct) }} /></div><span style={{ color: pctCol(f.pct) }}>{f.pct}%</span></div></td><td className="px-4 py-2.5 text-right font-semibold" style={{ color: accent }}>{f.mediaValue}</td></tr>))}</tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
          <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${G.border}` }}><h3 className="text-sm font-bold" style={{ color: G.text }}>Activation calendar</h3></div>
          <div>{profile.calendar.map((c, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-2.5" style={{ borderBottom: i < profile.calendar.length - 1 ? `1px solid ${G.border}80` : undefined }}>
              <span className="text-[11px] font-bold w-14 shrink-0" style={{ color: accent }}>{c.date}</span>
              <div className="flex-1 min-w-0"><div className="text-xs font-semibold truncate" style={{ color: G.text2 }}>{c.sponsor}</div><div className="text-[10px]" style={{ color: G.text4 }}>{c.activity}</div></div>
              <span className="text-[10px] px-2 py-0.5 rounded-full shrink-0" style={{ background: G.border, color: G.text3 }}>{c.channel}</span>
            </div>
          ))}</div>
        </div>
        <div className="rounded-xl p-5" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: G.text }}>Delivered media value by channel</h3>
          <div className="space-y-2.5">{profile.channels.map(ch => (<div key={ch.channel}><div className="flex justify-between text-xs mb-1"><span style={{ color: G.text3 }}>{ch.channel}</span><span className="font-bold" style={{ color: G.text }}>{ch.value}</span></div><div className="w-full rounded-full h-1.5" style={{ background: G.border }}><div className="h-1.5 rounded-full" style={{ width: `${ch.pct}%`, background: accent }} /></div></div>))}</div>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
        <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${G.border}` }}><h3 className="text-sm font-bold" style={{ color: G.text }}>Return on investment</h3></div>
        <table className="w-full text-xs"><thead><tr style={{ color: G.text4, borderBottom: `1px solid ${G.border}` }}><th className="text-left px-4 py-2.5 font-semibold">Sponsor</th><th className="text-right px-4 py-2.5 font-semibold">Annual fee</th><th className="text-right px-4 py-2.5 font-semibold">Media value delivered</th><th className="text-right px-4 py-2.5 font-semibold">Return</th></tr></thead>
          <tbody>{profile.roi.map((r, i) => (<tr key={i} style={{ borderBottom: `1px solid ${G.border}80` }}><td className="px-4 py-2.5 font-medium" style={{ color: G.text2 }}>{r.sponsor}</td><td className="px-4 py-2.5 text-right" style={{ color: G.text3 }}>{r.fee}</td><td className="px-4 py-2.5 text-right" style={{ color: G.text3 }}>{r.mediaValue}</td><td className="px-4 py-2.5 text-right font-bold" style={{ color: r.ratio >= 1.5 ? G.good : r.ratio >= 1 ? G.warn : G.bad }}>{r.ratio.toFixed(1)}×</td></tr>))}</tbody>
        </table>
      </div>
    </div>
  )
}
