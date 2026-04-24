'use client'

import { useMemo, useState } from 'react'
import { T } from '../tokens'
import { Badge, SegControl, TableShell, th, td, Card } from '../ui'
import { SchoolDrawer } from '../SchoolDrawer'
import type { Payload, School, Engagement } from '../types'

type SortKey = 'name' | 'state' | 'students' | 'assessmentsCY' | 'teachersFullyTrained' | 'daysSincePortal' | 'engagement' | 'phase'

export function SchoolsTab({ data }: { data: Payload }) {
  const [query, setQuery] = useState('')
  const [stateFilter, setStateFilter] = useState<'all' | string>('all')
  const [ragFilter, setRagFilter] = useState<'all' | Engagement>('all')
  const [sortKey, setSortKey] = useState<SortKey>('engagement')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [openId, setOpenId] = useState<string | null>(null)

  const states = useMemo(() => {
    const set = new Set(data.schools.map(s => s.state))
    return ['all', ...[...set].sort()] as const
  }, [data.schools])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return data.schools
      .filter(s => stateFilter === 'all' || s.state === stateFilter)
      .filter(s => ragFilter === 'all' || s.engagement === ragFilter)
      .filter(s => !q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.state.toLowerCase().includes(q))
  }, [data.schools, query, stateFilter, ragFilter])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    const engRank = (e: Engagement) => (e === 'red' ? 0 : e === 'amber' ? 1 : 2)
    arr.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'engagement': cmp = engRank(a.engagement) - engRank(b.engagement); break
        case 'phase':      cmp = a.phase - b.phase; break
        case 'name':       cmp = a.name.localeCompare(b.name); break
        case 'state':      cmp = a.state.localeCompare(b.state); break
        case 'students':   cmp = a.students - b.students; break
        case 'assessmentsCY':       cmp = a.assessmentsCY - b.assessmentsCY; break
        case 'teachersFullyTrained': cmp = a.teachersFullyTrained - b.teachersFullyTrained; break
        case 'daysSincePortal':     cmp = (a.daysSincePortal ?? -1) - (b.daysSincePortal ?? -1); break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [filtered, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const openSchool = openId ? data.schools.find(s => s.id === openId) ?? null : null

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Card>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search schools, codes, states"
            style={{
              flex: 1,
              minWidth: 220,
              padding: '8px 12px',
              backgroundColor: T.panel2,
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              color: T.ink,
              fontSize: 13,
              outline: 'none',
            }}
          />

          <select
            value={stateFilter}
            onChange={e => setStateFilter(e.target.value as 'all' | string)}
            style={{
              padding: '8px 12px',
              backgroundColor: T.panel2,
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              color: T.ink,
              fontSize: 13,
            }}
          >
            {states.map(s => <option key={s} value={s}>{s === 'all' ? 'All states' : s}</option>)}
          </select>

          <SegControl
            value={ragFilter}
            onChange={setRagFilter}
            options={[
              { id: 'all',   label: `All (${data.schools.length})` },
              { id: 'red',   label: `Red (${data.kpi.red})` },
              { id: 'amber', label: `Amber (${data.kpi.amber})` },
              { id: 'green', label: `Green (${data.kpi.green})` },
            ]}
          />

          <span style={{ marginLeft: 'auto', fontSize: 12, color: T.inkMute }}>
            {sorted.length} / {data.schools.length}
          </span>
        </div>
      </Card>

      <TableShell>
        <thead>
          <tr>
            <SortTh label="Name"               k="name"                current={sortKey} dir={sortDir} onClick={toggleSort} />
            <SortTh label="State"              k="state"               current={sortKey} dir={sortDir} onClick={toggleSort} />
            <SortTh label="RAG"                k="engagement"          current={sortKey} dir={sortDir} onClick={toggleSort} />
            <SortTh label="Phase"              k="phase"               current={sortKey} dir={sortDir} onClick={toggleSort} />
            <SortTh label="Students"           k="students"            current={sortKey} dir={sortDir} onClick={toggleSort} />
            <SortTh label="CY assessments"     k="assessmentsCY"       current={sortKey} dir={sortDir} onClick={toggleSort} />
            <SortTh label="Trained teachers"   k="teachersFullyTrained" current={sortKey} dir={sortDir} onClick={toggleSort} />
            <SortTh label="Last portal"        k="daysSincePortal"     current={sortKey} dir={sortDir} onClick={toggleSort} />
          </tr>
        </thead>
        <tbody>
          {sorted.map(s => (
            <tr
              key={s.id}
              onClick={() => setOpenId(s.id)}
              style={{ cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = T.panel2)}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <td style={{ ...td, color: T.ink, fontWeight: 600 }}>{s.name}</td>
              <td style={{ ...td, color: T.inkDim }}>{s.state}</td>
              <td style={td}><Badge tone={s.engagement}>{s.engagement.toUpperCase()}</Badge></td>
              <td style={{ ...td, color: T.inkDim }}>{s.phase}</td>
              <td style={{ ...td, color: T.inkDim }}>{s.students}</td>
              <td style={{ ...td, color: T.inkDim }}>{s.assessmentsCY}</td>
              <td style={{ ...td, color: T.inkDim }}>{s.teachersFullyTrained} / {s.teachersInvited}</td>
              <td style={{ ...td, color: T.inkDim }}>{s.daysSincePortal != null ? `${s.daysSincePortal}d` : '—'}</td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr><td colSpan={8} style={{ ...td, textAlign: 'center', color: T.inkMute }}>No schools match these filters</td></tr>
          )}
        </tbody>
      </TableShell>

      {openSchool && <SchoolDrawer school={openSchool} teachers={data.teachers} onClose={() => setOpenId(null)} />}
    </div>
  )
}

function SortTh({ label, k, current, dir, onClick }: { label: string; k: SortKey; current: SortKey; dir: 'asc' | 'desc'; onClick: (k: SortKey) => void }) {
  const active = k === current
  return (
    <th style={{ ...th, cursor: 'pointer', userSelect: 'none' }} onClick={() => onClick(k)}>
      {label}{active ? (dir === 'asc' ? ' ↑' : ' ↓') : ''}
    </th>
  )
}
