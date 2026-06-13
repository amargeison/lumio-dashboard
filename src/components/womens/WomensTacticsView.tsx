'use client'

// Women's Tactics — formation board with drag-and-drop, GPS-aware squad list
// and canned AI suggestions. Demo only: GPS values + AI notes are derived/
// pre-written (no live API). Squad comes from the canonical WOMENS_SQUAD.

import { useMemo, useState } from 'react'
import { Sparkles, RotateCcw, Wand2, Zap } from 'lucide-react'
import { WOMENS_SQUAD } from '@/app/womens/[slug]/_lib/womens-dashboard-data'

const C = {
  panel: '#111318', panel2: '#0D0F14', border: '#1F2937', borderHi: '#374151',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280',
  good: '#22C55E', warn: '#F59E0B', bad: '#EF4444', accent: '#BE185D', pink: '#EC4899',
}

type Slot = { id: string; role: string; x: number; y: number }
type Group = 'gk' | 'def' | 'mid' | 'fwd'

const groupOf = (role: string): Group =>
  role === 'GK' ? 'gk'
  : ['LB','RB','CB','LWB','RWB'].includes(role) ? 'def'
  : ['CDM','CM','CAM','LM','RM','DM'].includes(role) ? 'mid'
  : 'fwd'

const FORMATIONS: Record<string, Slot[]> = {
  '4-3-3': [
    { id: 'gk', role: 'GK', x: 50, y: 88 },
    { id: 'lb', role: 'LB', x: 15, y: 67 }, { id: 'cbl', role: 'CB', x: 38, y: 71 }, { id: 'cbr', role: 'CB', x: 62, y: 71 }, { id: 'rb', role: 'RB', x: 85, y: 67 },
    { id: 'cdm', role: 'CDM', x: 50, y: 50 }, { id: 'cml', role: 'CM', x: 30, y: 44 }, { id: 'cmr', role: 'CM', x: 70, y: 44 },
    { id: 'lw', role: 'LW', x: 20, y: 20 }, { id: 'st', role: 'ST', x: 50, y: 15 }, { id: 'rw', role: 'RW', x: 80, y: 20 },
  ],
  '4-4-2': [
    { id: 'gk', role: 'GK', x: 50, y: 88 },
    { id: 'lb', role: 'LB', x: 15, y: 67 }, { id: 'cbl', role: 'CB', x: 38, y: 71 }, { id: 'cbr', role: 'CB', x: 62, y: 71 }, { id: 'rb', role: 'RB', x: 85, y: 67 },
    { id: 'lm', role: 'LM', x: 16, y: 44 }, { id: 'cml', role: 'CM', x: 40, y: 47 }, { id: 'cmr', role: 'CM', x: 60, y: 47 }, { id: 'rm', role: 'RM', x: 84, y: 44 },
    { id: 'stl', role: 'ST', x: 38, y: 17 }, { id: 'str', role: 'ST', x: 62, y: 17 },
  ],
  '4-2-3-1': [
    { id: 'gk', role: 'GK', x: 50, y: 88 },
    { id: 'lb', role: 'LB', x: 15, y: 67 }, { id: 'cbl', role: 'CB', x: 38, y: 71 }, { id: 'cbr', role: 'CB', x: 62, y: 71 }, { id: 'rb', role: 'RB', x: 85, y: 67 },
    { id: 'dml', role: 'CDM', x: 38, y: 54 }, { id: 'dmr', role: 'CDM', x: 62, y: 54 },
    { id: 'lw', role: 'LW', x: 20, y: 33 }, { id: 'cam', role: 'CAM', x: 50, y: 33 }, { id: 'rw', role: 'RW', x: 80, y: 33 },
    { id: 'st', role: 'ST', x: 50, y: 14 },
  ],
  '3-5-2': [
    { id: 'gk', role: 'GK', x: 50, y: 88 },
    { id: 'cbl', role: 'CB', x: 28, y: 70 }, { id: 'cbc', role: 'CB', x: 50, y: 72 }, { id: 'cbr', role: 'CB', x: 72, y: 70 },
    { id: 'lm', role: 'LM', x: 12, y: 46 }, { id: 'cml', role: 'CM', x: 35, y: 48 }, { id: 'cdm', role: 'CDM', x: 50, y: 54 }, { id: 'cmr', role: 'CM', x: 65, y: 48 }, { id: 'rm', role: 'RM', x: 88, y: 46 },
    { id: 'stl', role: 'ST', x: 38, y: 17 }, { id: 'str', role: 'ST', x: 62, y: 17 },
  ],
  '4-5-1': [
    { id: 'gk', role: 'GK', x: 50, y: 88 },
    { id: 'lb', role: 'LB', x: 15, y: 67 }, { id: 'cbl', role: 'CB', x: 38, y: 71 }, { id: 'cbr', role: 'CB', x: 62, y: 71 }, { id: 'rb', role: 'RB', x: 85, y: 67 },
    { id: 'lm', role: 'LM', x: 14, y: 44 }, { id: 'cml', role: 'CM', x: 35, y: 46 }, { id: 'cdm', role: 'CDM', x: 50, y: 50 }, { id: 'cmr', role: 'CM', x: 65, y: 46 }, { id: 'rm', role: 'RM', x: 86, y: 44 },
    { id: 'st', role: 'ST', x: 50, y: 16 },
  ],
  '3-4-3': [
    { id: 'gk', role: 'GK', x: 50, y: 88 },
    { id: 'cbl', role: 'CB', x: 28, y: 70 }, { id: 'cbc', role: 'CB', x: 50, y: 72 }, { id: 'cbr', role: 'CB', x: 72, y: 70 },
    { id: 'lm', role: 'LM', x: 16, y: 46 }, { id: 'cml', role: 'CM', x: 40, y: 48 }, { id: 'cmr', role: 'CM', x: 60, y: 48 }, { id: 'rm', role: 'RM', x: 84, y: 46 },
    { id: 'lw', role: 'LW', x: 22, y: 20 }, { id: 'st', role: 'ST', x: 50, y: 15 }, { id: 'rw', role: 'RW', x: 78, y: 20 },
  ],
}

const GROUP_COLOR: Record<Group, string> = { gk: '#22C55E', def: '#3B82F6', mid: '#8B5CF6', fwd: '#BE185D' }

// Canned GPS load per player (deterministic; demo only).
function gpsLoad(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return 62 + (h % 32) // 62–93
}
const loadColor = (l: number) => l >= 90 ? C.bad : l >= 84 ? C.warn : C.good

const AI_BY_FORMATION: Record<string, string[]> = {
  '4-3-3': ['Press from the front three — wingers pin the full-backs, striker screens the pivot.', 'Single pivot stays central; the two 8s shuttle to overload the half-spaces.', 'Full-backs provide the width so wingers can come inside between the lines.'],
  '4-4-2': ['Compact two banks of four; strikers split the centre-backs on the press trigger.', 'Wide midfielders tuck in out of possession to protect the 8-yard channels.', 'Direct route to the front two early, then support runners off second balls.'],
  '4-2-3-1': ['Double pivot gives a secure rest-defence — fullbacks can fly forward.', 'The 10 occupies the opposition pivot; wingers isolate 1v1 on the touchline.', 'Lone striker pins both centre-backs to free the 10 between the lines.'],
  '3-5-2': ['Wing-backs are the width — they must recover quickly into a back five.', 'Central overload: 3 in midfield outnumbers most 4-3-3 midfields.', 'Strike partnership splits to receive between the lines, then combine.'],
  '4-5-1': ['Numbers in midfield to control tempo — patient build, spring the wingers.', 'Mid-block, force play wide, then collapse the ball-side channel.', 'Lone striker holds; the wide mids break beyond on transition.'],
  '3-4-3': ['High wing-backs + front three create a 5-man attack — commit numbers forward.', 'Back three steps up to compress; midfield two must screen the gaps.', 'Front three rotate to disorganise the back line on the press.'],
}

const OPPOSITION_NOTES = [
  'High line vulnerable to in-behind balls — isolate the right winger on their LB (struggles in 1v1).',
  'Set-piece threat: A. Reece, 14 goals — back-post runs from corners (routines in Set Pieces).',
  'Their LW dribbles direct — double up with the LB + ball-side 8 when shifting across.',
  'Keeper distribution short under pressure — the high-press triggers should produce turnovers.',
]

type Squad = typeof WOMENS_SQUAD[number]

export default function WomensTacticsView() {
  const [formation, setFormation] = useState('4-3-3')
  const slots = FORMATIONS[formation]
  const [assign, setAssign] = useState<Record<string, string>>({})
  const [picked, setPicked] = useState<string | null>(null)
  const [aiIdx, setAiIdx] = useState(0)

  const byName = useMemo(() => Object.fromEntries(WOMENS_SQUAD.map(p => [p.name, p] as const)), [])
  const assignedNames = useMemo(() => new Set(Object.values(assign)), [assign])

  function placeBestXI(target = formation) {
    const sl = FORMATIONS[target]
    const next: Record<string, string> = {}
    const used = new Set<string>()
    const pickFor = (role: string) => {
      const g = groupOf(role)
      // exact position first, then same group, then anyone.
      let cand = WOMENS_SQUAD.find(p => !used.has(p.name) && p.pos === role)
      if (!cand) cand = WOMENS_SQUAD.find(p => !used.has(p.name) && p.group === g)
      if (!cand) cand = WOMENS_SQUAD.find(p => !used.has(p.name))
      return cand
    }
    for (const s of sl) {
      const c = pickFor(s.role)
      if (c) { next[s.id] = c.name; used.add(c.name) }
    }
    setAssign(next)
  }

  function changeFormation(f: string) {
    // keep the chosen XI; re-distribute to new slots by role.
    const xi = Object.values(assign)
    setFormation(f)
    if (xi.length === 0) { setAssign({}); return }
    const sl = FORMATIONS[f]
    const next: Record<string, string> = {}
    const used = new Set<string>()
    const pickFrom = (role: string) => {
      const g = groupOf(role)
      let n = xi.find(nm => !used.has(nm) && byName[nm]?.pos === role)
      if (!n) n = xi.find(nm => !used.has(nm) && byName[nm]?.group === g)
      if (!n) n = xi.find(nm => !used.has(nm))
      return n
    }
    for (const s of sl) { const n = pickFrom(s.role); if (n) { next[s.id] = n; used.add(n) } }
    setAssign(next)
  }

  function dropOnSlot(slotId: string, name: string) {
    setAssign(prev => {
      const next = { ...prev }
      // remove the player from any slot they already occupy
      for (const k of Object.keys(next)) if (next[k] === name) delete next[k]
      next[slotId] = name
      return next
    })
    setPicked(null)
  }
  function clickSlot(slotId: string) {
    if (assign[slotId] && !picked) { setAssign(prev => { const n = { ...prev }; delete n[slotId]; return n }); return }
    if (picked) dropOnSlot(slotId, picked)
  }

  const stats = [
    { v: formation, l: 'Formation', s: 'Primary system', tone: C.accent },
    { v: '58%', l: 'Possession %', s: 'Season average', tone: C.good },
    { v: '8.4', l: 'PPDA', s: '2nd in division', tone: '#8B5CF6' },
    { v: '+0.6', l: 'xG Diff / match', s: 'Best in division', tone: '#3B82F6' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <Zap size={20} style={{ color: C.accent }} className="mt-0.5" />
        <div>
          <h1 className="text-xl font-black" style={{ color: C.text }}>Tactics</h1>
          <p className="text-sm mt-0.5" style={{ color: C.text4 }}>Formation board · drag-and-drop XI · GPS-aware · AI suggestions · opposition notes</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.l} className="rounded-xl p-4" style={{ background: `linear-gradient(135deg, ${s.tone}1f, ${C.panel})`, border: `1px solid ${s.tone}40` }}>
            <div className="text-2xl font-black" style={{ color: C.text }}>{s.v}</div>
            <div className="text-sm" style={{ color: C.text3 }}>{s.l}</div>
            <div className="text-[10px] mt-0.5" style={{ color: C.text4 }}>{s.s}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap rounded-xl p-3" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
        <span className="text-xs font-semibold mr-1" style={{ color: C.text4 }}>Formation</span>
        {Object.keys(FORMATIONS).map(f => (
          <button key={f} onClick={() => changeFormation(f)} className="px-2.5 py-1.5 rounded-lg text-xs font-bold"
            style={{ background: formation === f ? C.accent : 'transparent', color: formation === f ? '#fff' : C.text3, border: `1px solid ${formation === f ? C.accent : C.border}` }}>{f}</button>
        ))}
        <div className="flex-1" />
        <button onClick={() => placeBestXI()} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: C.accent }}><Wand2 size={14} /> Auto-fill best XI</button>
        <button onClick={() => setAssign({})} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ border: `1px solid ${C.border}`, color: C.text3 }}><RotateCcw size={14} /> Clear</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        {/* Pitch */}
        <div className="rounded-xl p-3" style={{ background: 'linear-gradient(#0c2a16,#0a1f12)', border: `1px solid ${C.border}` }}>
          <div className="relative w-full" style={{ paddingBottom: '128%' }}>
            <div className="absolute inset-0">
              <PitchLines />
              {slots.map(s => {
                const name = assign[s.id]
                const p = name ? byName[name] : undefined
                const col = GROUP_COLOR[groupOf(s.role)]
                return (
                  <div key={s.id} className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center" style={{ left: `${s.x}%`, top: `${s.y}%`, width: 64 }}
                    onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const n = e.dataTransfer.getData('text/plain'); if (n) dropOnSlot(s.id, n) }} onClick={() => clickSlot(s.id)}>
                    <div className="rounded-full flex items-center justify-center font-black cursor-pointer" title={p ? `${p.name} · load ${gpsLoad(p.name)}` : s.role}
                      style={{ width: 40, height: 40, background: p ? col : 'rgba(0,0,0,0.35)', color: '#fff', border: `2px solid ${p ? '#fff' : col}`, fontSize: p ? 12 : 11, boxShadow: picked && !p ? `0 0 0 3px ${C.pink}` : 'none' }}>
                      {p ? p.num : s.role}
                    </div>
                    <div className="mt-1 text-[10px] font-semibold text-center leading-tight" style={{ color: '#E5E7EB' }}>{p ? p.name.split(' ').slice(-1)[0] : s.role}</div>
                    {p && (
                      <div className="mt-0.5 h-1 w-9 rounded-full" style={{ background: 'rgba(255,255,255,0.18)' }}>
                        <div className="h-1 rounded-full" style={{ width: `${gpsLoad(p.name)}%`, background: loadColor(gpsLoad(p.name)) }} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          <p className="text-[10px] mt-2 text-center" style={{ color: 'rgba(255,255,255,0.5)' }}>Drag a player from the squad list onto a position — or tap a player then tap a slot. Tap a filled slot to clear. Bars = GPS weekly load.</p>
        </div>

        {/* Squad list */}
        <div className="rounded-xl p-3 space-y-1.5 max-h-[640px] overflow-y-auto" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold" style={{ color: C.text }}>Squad</span>
            <span className="text-[10px]" style={{ color: C.text4 }}>{assignedNames.size}/11 placed</span>
          </div>
          {WOMENS_SQUAD.map((p: Squad) => {
            const used = assignedNames.has(p.name)
            const col = GROUP_COLOR[p.group]
            const l = gpsLoad(p.name)
            return (
              <div key={p.name} draggable={!used} onDragStart={e => e.dataTransfer.setData('text/plain', p.name)} onClick={() => !used && setPicked(picked === p.name ? null : p.name)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 select-none" style={{
                  background: picked === p.name ? `${C.accent}22` : C.panel2, border: `1px solid ${picked === p.name ? C.accent : C.border}`,
                  opacity: used ? 0.4 : 1, cursor: used ? 'default' : 'grab' }}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: `${col}26`, color: col }}>{p.num}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold truncate" style={{ color: C.text }}>{p.name}</div>
                  <div className="text-[9px]" style={{ color: C.text4 }}>{p.pos}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] font-mono font-bold" style={{ color: loadColor(l) }}>{l}</div>
                  <div className="text-[8px]" style={{ color: C.text4 }}>load</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* AI suggestions + opposition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-4" style={{ background: C.panel, border: `1px solid ${C.accent}55` }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2"><Sparkles size={15} style={{ color: C.accent }} /><span className="text-sm font-bold" style={{ color: C.text }}>AI Tactical Suggestions</span></div>
            <button onClick={() => setAiIdx(i => i + 1)} className="text-[11px] font-semibold px-2 py-1 rounded-lg" style={{ background: `${C.accent}22`, color: C.pink }}>↻ Refresh</button>
          </div>
          <div className="space-y-2">
            {AI_BY_FORMATION[formation].map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-xs rounded-lg p-2" style={{ background: C.panel2, color: C.text2 }}>
                <span style={{ color: C.accent }}>▸</span><span>{s}</span>
              </div>
            ))}
            <div className="flex items-start gap-2 text-xs rounded-lg p-2" style={{ background: `${C.accent}14`, color: C.pink }}>
              <Sparkles size={13} className="mt-0.5 shrink-0" /><span>{OPPOSITION_NOTES[aiIdx % OPPOSITION_NOTES.length]}</span>
            </div>
          </div>
          <p className="text-[10px] mt-2" style={{ color: C.text4 }}>Demo — suggestions are pre-written for this formation. A signed client would generate these live from match + GPS data.</p>
        </div>

        <div className="rounded-xl p-4" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
          <h3 className="text-sm font-bold mb-2" style={{ color: C.text }}>Opposition Notes — Next: Hartwell Women (away)</h3>
          <div className="space-y-1.5">
            {OPPOSITION_NOTES.map((n, i) => (
              <div key={i} className="flex items-start gap-2 text-xs" style={{ color: C.text2 }}><span style={{ color: C.accent }}>•</span><span>{n}</span></div>
            ))}
          </div>
        </div>
      </div>

      {/* Last match + team talk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-4" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
          <h3 className="text-sm font-bold mb-2" style={{ color: C.text }}>Last Match — Oakridge Women 1-1 Hartwell Women</h3>
          {[['Possession 58%', 'Hartwell pressed high in 25-minute spells but couldn\'t sustain it.'], ['Shots 14 (5 on target)', 'Williams missed two presentable chances pre-equaliser.'], ['PPDA 7.9', 'Counter-pressing won 11 high-zone turnovers; one led to the goal.'], ['Pattern', 'Morris equaliser at 58\' from Tilley cutback — third route-one chance from that pattern this month.']].map(([k, v]) => (
            <div key={k} className="text-xs mb-1.5" style={{ color: C.text2 }}><span style={{ color: C.accent, fontWeight: 700 }}>{k}</span> · {v}</div>
          ))}
        </div>
        <div className="rounded-xl p-4" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
          <h3 className="text-sm font-bold mb-2" style={{ color: C.text }}>Team Talk — Coach Notes</h3>
          <p className="text-sm italic leading-relaxed" style={{ color: C.text2 }}>&ldquo;We press high from the front three. Carter dictates tempo. Full-backs push up — we want width. Trust the system, trust each other. Set pieces are our edge — drills in the Set Pieces module this week.&rdquo;</p>
          <p className="text-xs mt-2" style={{ color: C.text4 }}>— Sarah Frost, Head Coach</p>
        </div>
      </div>
    </div>
  )
}

function PitchLines() {
  return (
    <svg viewBox="0 0 100 128" className="absolute inset-0 w-full h-full" preserveAspectRatio="none" style={{ opacity: 0.5 }}>
      <rect x="1" y="1" width="98" height="126" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.4" />
      <line x1="1" y1="64" x2="99" y2="64" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4" />
      <circle cx="50" cy="64" r="11" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4" />
      <rect x="28" y="1" width="44" height="18" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4" />
      <rect x="28" y="109" width="44" height="18" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4" />
      <rect x="40" y="1" width="20" height="7" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.4" />
      <rect x="40" y="120" width="20" height="7" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.4" />
    </svg>
  )
}
