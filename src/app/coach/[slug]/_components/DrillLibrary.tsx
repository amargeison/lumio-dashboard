'use client'

// The flagship Drill Library: every session focus as a printable, court-
// diagrammed drill sheet, grouped by skill category with a belt filter and
// search. Lives in the Resource Centre "Drills" tab.

import { useMemo, useState, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { DRILL_LIBRARY, BELTS, drillLevel, type Drill } from '../_lib/coach-data'
import { openDrill } from './DrillDocs'

const beltOf = (id: string) => BELTS.find(b => b.id === id)
function levelColour(T: ThemeTokens, l: string) {
  return l === 'Beginner' ? T.good : l === 'Intermediate' ? '#3A8EE0' : l === 'Advanced' ? '#C75A5A' : T.text2
}

export function DrillLibrary({ T, accent, density }: { T: ThemeTokens; accent: AccentTokens; density: Density }) {
  const [q, setQ] = useState('')
  const [beltFilter, setBeltFilter] = useState<string>('all')

  // Category order as authored in the library.
  const categories = useMemo(() => {
    const seen: string[] = []
    for (const d of DRILL_LIBRARY) if (!seen.includes(d.category)) seen.push(d.category)
    return seen
  }, [])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return DRILL_LIBRARY.filter(d => {
      if (beltFilter !== 'all' && d.belt !== beltFilter) return false
      if (!needle) return true
      return (d.focus + ' ' + d.category + ' ' + d.tags.join(' ') + ' ' + (beltOf(d.belt)?.name ?? '')).toLowerCase().includes(needle)
    })
  }, [q, beltFilter])

  const input: CSSProperties = { appearance: 'none', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 9, color: T.text, fontSize: 13, padding: '9px 12px 9px 34px', fontFamily: FONT, outline: 'none', width: '100%' }

  const Chip = ({ id, label, colour }: { id: string; label: string; colour?: string }) => {
    const on = beltFilter === id
    return (
      <button onClick={() => setBeltFilter(id)} style={{ appearance: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${on ? accent.border : T.border}`, background: on ? accent.dim : 'transparent', color: on ? accent.hex : T.text2, borderRadius: 999, padding: '5px 11px', fontSize: 11.5, fontWeight: on ? 600 : 400, cursor: 'pointer' }}>
        {colour && <span style={{ width: 11, height: 8, borderRadius: 2, background: colour, border: '1px solid rgba(128,128,128,0.4)' }} />}
        {label}
      </button>
    )
  }

  return (
    <div>
      {/* controls */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 360 }}>
          <Icon name="search" size={15} stroke={1.7} style={{ position: 'absolute', left: 11, top: 10, color: T.text3 }} />
          <input style={input} value={q} onChange={e => setQ(e.target.value)} placeholder="Search drills — focus, tag or belt…" />
        </div>
        <div style={{ fontSize: 11.5, color: T.text3 }}>{filtered.length} of {DRILL_LIBRARY.length} drills</div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: density.gap }}>
        <Chip id="all" label="All belts" />
        {BELTS.map(b => <Chip key={b.id} id={b.id} label={b.name} colour={b.colour} />)}
      </div>

      {filtered.length === 0 && <div style={{ fontSize: 13, color: T.text3, padding: '24px 0' }}>No drills match that search.</div>}

      {/* grouped library */}
      {categories.map(catName => {
        const drills = filtered.filter(d => d.category === catName)
        if (!drills.length) return null
        return (
          <div key={catName} style={{ marginBottom: density.gap + 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 10px' }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: T.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{catName}</span>
              <span style={{ fontSize: 10.5, color: T.text3 }}>{drills.length}</span>
              <span style={{ flex: 1, height: 1, background: T.border }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 12 }}>
              {drills.map(d => <DrillCard key={d.id} T={T} accent={accent} density={density} d={d} />)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DrillCard({ T, accent, density, d }: { T: ThemeTokens; accent: AccentTokens; density: Density; d: Drill }) {
  const b = beltOf(d.belt)
  const lvl = drillLevel(d.belt)
  const lc = levelColour(T, lvl)
  return (
    <button onClick={() => openDrill(d)} style={{ appearance: 'none', textAlign: 'left', cursor: 'pointer', background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: density.pad, fontFamily: FONT, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, display: 'grid', placeItems: 'center', background: accent.dim, flexShrink: 0 }}>
          <Icon name="flag" size={15} stroke={1.7} style={{ color: accent.hex }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, lineHeight: 1.3 }}>{d.focus}</div>
          <div style={{ fontSize: 10.5, color: T.text3, marginTop: 2 }}>4 progressive levels · court diagram</div>
        </div>
      </div>
      <div style={{ fontSize: 11.5, color: T.text2, lineHeight: 1.45 }}>{d.setup}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: lc, background: `${lc}1f`, borderRadius: 6, padding: '2px 7px' }}>{lvl}</span>
        {b && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: T.text3 }}><span style={{ width: 12, height: 8, borderRadius: 2, background: b.colour, border: '1px solid rgba(128,128,128,0.4)' }} />{b.name}</span>}
        {d.tags.map(t => <span key={t} style={{ fontSize: 10, color: T.text3 }}>#{t}</span>)}
      </div>
      <div style={{ marginTop: 4, paddingTop: 8, borderTop: `1px solid ${T.border}`, fontSize: 11.5, fontWeight: 600, color: accent.hex }}>Open drill sheet →</div>
    </button>
  )
}
