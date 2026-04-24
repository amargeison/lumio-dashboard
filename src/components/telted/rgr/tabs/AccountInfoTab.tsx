'use client'

import { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { T } from '../tokens'
import { Card, Badge, SegControl, TableShell, th, td } from '../ui'
import type { Payload, Engagement } from '../types'

const PHASE_LABELS = ['0 — No activity', '1 — Assessment', '2 — PD', '3 — Whole Class', '4 — NELI Intervention']

export function AccountInfoTab({ data }: { data: Payload }) {
  const [ragFilter, setRagFilter] = useState<'all' | Engagement>('all')

  const phaseDist = useMemo(() => {
    const counts = [0, 0, 0, 0, 0]
    for (const s of data.schools) counts[s.phase]++
    return counts.map((n, i) => ({ phase: `P${i}`, label: PHASE_LABELS[i], schools: n }))
  }, [data.schools])

  const rows = useMemo(() => {
    return data.schools
      .filter(s => ragFilter === 'all' || s.engagement === ragFilter)
      .sort((a, b) => {
        const order = (e: Engagement) => (e === 'red' ? 0 : e === 'amber' ? 1 : 2)
        return order(a.engagement) - order(b.engagement) || a.phase - b.phase || a.name.localeCompare(b.name)
      })
  }, [data.schools, ragFilter])

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title="Programme phase distribution">
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <BarChart layout="vertical" data={phaseDist} margin={{ top: 4, right: 20, bottom: 0, left: 10 }}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: T.inkMute }} stroke={T.border} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: T.inkDim }} stroke={T.border} width={170} />
                <Tooltip contentStyle={{ backgroundColor: T.panel, border: `1px solid ${T.border}`, fontSize: 12 }} labelStyle={{ color: T.ink }} />
                <Bar dataKey="schools" radius={[0, 4, 4, 0]}>
                  {phaseDist.map((_, i) => (
                    <Cell key={i} fill={[T.neutral, T.blue, T.purple, T.teal, T.green][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="At a glance" right={
          <SegControl
            value={ragFilter}
            onChange={setRagFilter}
            options={[
              { id: 'all',   label: `All` },
              { id: 'red',   label: `Red` },
              { id: 'amber', label: `Amber` },
              { id: 'green', label: `Green` },
            ]}
          />
        }>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <Mini label="Total"            value={data.kpi.totalSchools} color={T.teal} />
            <Mini label="Teachers invited" value={data.kpi.teachersTotal} color={T.blue} />
            <Mini label="Teachers trained" value={data.kpi.teachersTrained} color={T.green} />
            <Mini label="With DRL"         value={data.kpi.drlSchools} color={T.purple} />
            <Mini label="Red engagement"   value={data.kpi.red} color={T.red} />
            <Mini label="Amber engagement" value={data.kpi.amber} color={T.amber} />
          </div>
        </Card>
      </div>

      <TableShell>
        <thead>
          <tr>
            <th style={th}>School</th>
            <th style={th}>State</th>
            <th style={th}>RAG</th>
            <th style={th}>Phase</th>
            <th style={th}>CY assessments</th>
            <th style={th}>Trained / invited</th>
            <th style={th}>Last portal</th>
            <th style={{ ...th, minWidth: 280 }}>Recommended next action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(s => (
            <tr key={s.id}>
              <td style={{ ...td, color: T.ink, fontWeight: 600 }}>{s.name}</td>
              <td style={{ ...td, color: T.inkDim }}>{s.state}</td>
              <td style={td}><Badge tone={s.engagement}>{s.engagement.toUpperCase()}</Badge></td>
              <td style={{ ...td, color: T.inkDim }}>{s.phase}</td>
              <td style={{ ...td, color: T.inkDim }}>{s.assessmentsCY}</td>
              <td style={{ ...td, color: T.inkDim }}>{s.teachersFullyTrained} / {s.teachersInvited}</td>
              <td style={{ ...td, color: T.inkDim }}>{s.daysSincePortal != null ? `${s.daysSincePortal}d` : '—'}</td>
              <td style={{ ...td, color: T.ink }}>{s.nextAction}</td>
            </tr>
          ))}
        </tbody>
      </TableShell>
    </div>
  )
}

function Mini({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ padding: 12, borderRadius: 8, border: `1px solid ${T.border}`, backgroundColor: T.panel2 }}>
      <div style={{ width: 10, height: 10, backgroundColor: color, borderRadius: 2, marginBottom: 6 }} />
      <div style={{ fontSize: 22, fontWeight: 700, color: T.ink }}>{value}</div>
      <div style={{ fontSize: 10, color: T.inkMute, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
    </div>
  )
}
