'use client'

import React, { useState } from 'react'
import { Shirt, CheckCircle2, Circle } from 'lucide-react'

// Men's Pro — Kit Manager. Kit sets, squad-number allocation, matchday kit
// prep checklist, boot room & equipment stock, laundry turnaround.

const C = {
  panel: '#111318', panel2: '#0a0c14', border: '#1F2937', borderHi: '#374151',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280',
  green: '#22C55E', amber: '#F59E0B', red: '#EF4444', accent: '#003DA5',
}

type Kit = { label: string; shirt: string; shorts: string; socks: string; sponsor: string }
const KITS: Kit[] = [
  { label: 'Home', shirt: '#003DA5', shorts: '#FFFFFF', socks: '#003DA5', sponsor: 'Meridian Group (front) · Northbridge Sport (sleeve)' },
  { label: 'Away', shirt: '#F1C40F', shorts: '#111827', socks: '#F1C40F', sponsor: 'Meridian Group (front)' },
  { label: 'Third', shirt: '#0F172A', shorts: '#0F172A', socks: '#0F172A', sponsor: 'Meridian Group (front)' },
]
const colourName = (c: string) => ({ '#003DA5': 'Blue', '#FFFFFF': 'White', '#F1C40F': 'Yellow', '#111827': 'Black', '#0F172A': 'Navy' } as Record<string, string>)[c.toUpperCase()] ?? c

const NUMBERS = [
  { n: 1, p: 'Jordan Hayes', s: 'GK · home + GK kit ready' },
  { n: 2, p: 'Kyle Osei', s: 'RB' },
  { n: 3, p: 'Tom Fletcher', s: 'LB' },
  { n: 4, p: 'Connor Walsh', s: 'CM' },
  { n: 5, p: 'Paul Granger', s: 'CDM' },
  { n: 6, p: 'Daniel Webb (C)', s: 'CB · captain’s armband' },
  { n: 8, p: 'Liam Barker', s: 'CM' },
  { n: 9, p: 'Chris Nwosu', s: 'ST' },
  { n: 10, p: 'Sam Porter', s: 'ST' },
  { n: 11, p: 'Dean Morris', s: 'LW' },
  { n: 12, p: 'Ryan Cole', s: 'CM' },
  { n: 15, p: 'Marcus Reid', s: 'CB' },
  { n: 16, p: 'Delano Ashton', s: 'CM' },
  { n: 17, p: 'Brodi Chen', s: 'CB' },
  { n: 18, p: 'Antwoine Rowe', s: 'CF' },
  { n: 19, p: 'James Tilley', s: 'RW' },
  { n: 20, p: 'Joe McDonnell', s: 'GK (sub)' },
  { n: 21, p: 'Myles Okafor', s: 'LW' },
  { n: 31, p: 'Joe Lewis', s: 'CB' },
  { n: 33, p: 'Isaac Kemp', s: 'CB' },
  { n: 37, p: 'Zack Bright', s: 'CM' },
]

const PREP = [
  { id: 'k1', label: 'Home shirts pressed & hung (18 + spares)', done: true },
  { id: 'k2', label: 'Numbers & names checked vs team sheet', done: true },
  { id: 'k3', label: 'Captain’s armband + GK kits (×2 colours)', done: true },
  { id: 'k4', label: 'Match balls — 6 checked & inflated', done: false },
  { id: 'k5', label: 'Training/warm-up kit bagged', done: true },
  { id: 'k6', label: 'Boots, shin pads, gloves — per player', done: false },
  { id: 'k7', label: 'Away travel kit (tracksuits) loaded', done: false },
  { id: 'k8', label: 'Substitute bibs, towels, water bottles', done: true },
]

const STOCK = [
  { item: 'Match shirts (home)', qty: '22 + 6 spare', status: 'Stocked' },
  { item: 'Match shorts / socks', qty: 'Full sets ×3 kits', status: 'Stocked' },
  { item: 'Boots / studs', qty: 'Per player + spares', status: 'Stocked' },
  { item: 'GK gloves', qty: '8 pairs', status: 'Low' },
  { item: 'Training kit', qty: 'Daily rotation ×2', status: 'Stocked' },
  { item: 'Match balls', qty: '12 (EFL spec)', status: 'Restock due' },
]
const stCls = (s: string) => s === 'Stocked' ? C.green : s === 'Low' ? C.amber : C.red

function PrepChecklist() {
  const [done, setDone] = useState<Record<string, boolean>>(() => Object.fromEntries(PREP.map(i => [i.id, i.done])))
  const complete = PREP.filter(i => done[i.id]).length
  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
      <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-bold" style={{ color: C.text }}>Matchday kit prep</h3><span className="text-[11px] font-semibold" style={{ color: complete === PREP.length ? C.green : C.text3 }}>{complete}/{PREP.length}</span></div>
      <div className="flex flex-col gap-0.5">
        {PREP.map(it => { const d = done[it.id]; return (
          <button key={it.id} onClick={() => setDone(s => ({ ...s, [it.id]: !s[it.id] }))} className="flex items-center gap-2.5 text-left rounded-lg px-2 py-1.5 hover:bg-white/[0.03]">
            {d ? <CheckCircle2 size={15} style={{ color: C.green }} className="flex-shrink-0" /> : <Circle size={15} style={{ color: C.text4 }} className="flex-shrink-0" />}
            <span className="text-[12.5px]" style={{ color: d ? C.text4 : C.text, textDecoration: d ? 'line-through' : 'none' }}>{it.label}</span>
          </button>
        ) })}
      </div>
    </div>
  )
}

export default function FootballKitManager() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: C.text }}><Shirt size={18} style={{ color: C.accent }} /> Kit Manager</h2>
        <p className="text-sm mt-1" style={{ color: C.text3 }}>Kit sets, squad numbers, matchday kit prep, boot room &amp; laundry.</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[['Kit sets', '3', 'Home · Away · Third'], ['Squad numbers', '1–30', 'Allocated for the season'], ['Matchday kit', '5/8', 'Prep checklist'], ['Supplier', 'Vanta', 'Vanta Sports · 2024–28']].map(([l, v, s]) => (
          <div key={l} className="rounded-xl p-3.5" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
            <div className="text-[10px] uppercase tracking-wider" style={{ color: C.text4 }}>{l}</div>
            <div className="text-xl font-bold mt-1" style={{ color: C.text }}>{v}</div>
            <div className="text-[10.5px] mt-0.5" style={{ color: C.text3 }}>{s}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {KITS.map(k => (
          <div key={k.label} className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
            <div className="flex items-center justify-between mb-3"><span className="text-sm font-bold" style={{ color: C.text }}>{k.label} kit</span><span className="text-[10px]" style={{ color: C.text4 }}>2025/26</span></div>
            <div className="flex items-center gap-2 mb-3">
              {[['Shirt', k.shirt], ['Shorts', k.shorts], ['Socks', k.socks]].map(([lbl, col]) => (
                <div key={lbl} className="flex-1 text-center">
                  <div className="w-full h-10 rounded-lg mb-1" style={{ backgroundColor: col, border: `1px solid ${C.borderHi}` }} />
                  <div className="text-[9px]" style={{ color: C.text4 }}>{lbl}</div>
                  <div className="text-[10px] font-medium" style={{ color: C.text3 }}>{colourName(col)}</div>
                </div>
              ))}
            </div>
            <div className="text-[10.5px]" style={{ color: C.text4 }}>{k.sponsor}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <div className="px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}><p className="text-sm font-semibold" style={{ color: C.text }}>Squad number allocation</p></div>
          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
          <table className="w-full text-xs"><thead><tr style={{ borderBottom: `1px solid ${C.border}` }}><th className="text-left px-4 py-3 font-semibold" style={{ color: C.text4 }}>No.</th><th className="text-left px-4 py-3 font-semibold" style={{ color: C.text4 }}>Player</th><th className="text-left px-4 py-3 font-semibold" style={{ color: C.text4 }}>Notes</th></tr></thead><tbody>
            {NUMBERS.map(r => (<tr key={r.n} style={{ borderBottom: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-bold" style={{ color: C.accent }}>{r.n}</td><td className="px-4 py-2.5 font-medium" style={{ color: C.text }}>{r.p}</td><td className="px-4 py-2.5" style={{ color: C.text4 }}>{r.s}</td></tr>))}
          </tbody></table>
          </div>
        </div>
        <PrepChecklist />
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}><p className="text-sm font-semibold" style={{ color: C.text }}>Boot room &amp; equipment stock</p><span className="text-[10px]" style={{ color: C.text4 }}>Laundry turnaround · 24h on-site</span></div>
        <table className="w-full text-xs"><thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>{['Item', 'Quantity', 'Status'].map(h => <th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead><tbody>
          {STOCK.map((r, i) => (<tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-medium" style={{ color: C.text }}>{r.item}</td><td className="px-4 py-2.5" style={{ color: C.text3 }}>{r.qty}</td><td className="px-4 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${stCls(r.status)}1a`, color: stCls(r.status) }}>{r.status}</span></td></tr>))}
        </tbody></table>
      </div>
    </div>
  )
}
