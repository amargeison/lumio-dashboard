'use client'

import { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell } from 'recharts'
import { T } from '../tokens'
import { Card, Badge, TableShell, th, td } from '../ui'
import type { Payload, Teacher, TrainingStatus } from '../types'

const COURSES: { key: 'c1' | 'c2' | 'c3' | 'c4'; label: string }[] = [
  { key: 'c1', label: 'C1 Language Fundamentals' },
  { key: 'c2', label: 'C2 NELI Intervention' },
  { key: 'c3', label: 'C3 NELI Intervention Pt 2' },
  { key: 'c4', label: 'C4 Whole Class' },
]

const STATUS_COLOR: Record<TrainingStatus, string> = {
  'Completed':   T.green,
  'In progress': T.amber,
  'Enrolled':    T.blue,
  'Not started': T.neutral,
  '':            T.neutral,
}

export function TrainingTab({ data }: { data: Payload }) {
  const [query, setQuery] = useState('')

  const topSchools = useMemo(() => {
    return [...data.schools]
      .filter(s => s.teachersInvited > 0)
      .map(s => ({
        name: s.name,
        pct: Math.round(100 * s.teachersFullyTrained / s.teachersInvited),
        trained: s.teachersFullyTrained,
        invited: s.teachersInvited,
      }))
      .sort((a, b) => b.pct - a.pct || b.invited - a.invited)
      .slice(0, 10)
  }, [data.schools])

  const courseBreakdown = useMemo(() => {
    return COURSES.map(c => {
      const row: Record<string, string | number> = { course: c.label.replace(/^(C\d)\s.*$/, '$1') }
      for (const s of ['Completed', 'In progress', 'Enrolled', 'Not started'] as TrainingStatus[]) {
        row[s] = data.teachers.filter(t => (t[c.key] || 'Not started') === s).length
      }
      return row
    })
  }, [data.teachers])

  const teacherRows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return data.teachers
      .filter(t => !q || t.name.toLowerCase().includes(q) || t.school.toLowerCase().includes(q) || t.email.toLowerCase().includes(q))
      .sort((a, b) => a.school.localeCompare(b.school) || a.name.localeCompare(b.name))
      .slice(0, 600)
  }, [data.teachers, query])

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title="Top schools — training completion %">
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <BarChart layout="vertical" data={topSchools} margin={{ top: 4, right: 20, bottom: 0, left: 10 }}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: T.inkMute }} stroke={T.border} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: T.inkDim }} stroke={T.border} width={170} />
                <Tooltip
                  contentStyle={{ backgroundColor: T.panel, border: `1px solid ${T.border}`, fontSize: 12 }}
                  labelStyle={{ color: T.ink }}
                  formatter={(_v, _n, item) => {
                    const p = item.payload as { trained: number; invited: number; pct: number }
                    return [`${p.pct}% (${p.trained}/${p.invited})`, 'Fully trained']
                  }}
                />
                <Bar dataKey="pct" fill={T.green} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Course completion by status">
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={courseBreakdown} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis dataKey="course" tick={{ fontSize: 10, fill: T.inkMute }} stroke={T.border} />
                <YAxis tick={{ fontSize: 10, fill: T.inkMute }} stroke={T.border} />
                <Tooltip contentStyle={{ backgroundColor: T.panel, border: `1px solid ${T.border}`, fontSize: 12 }} labelStyle={{ color: T.ink }} />
                <Legend wrapperStyle={{ fontSize: 11, color: T.inkDim }} />
                <Bar dataKey="Completed"   stackId="a" fill={T.green}  />
                <Bar dataKey="In progress" stackId="a" fill={T.amber}  />
                <Bar dataKey="Enrolled"    stackId="a" fill={T.blue}   />
                <Bar dataKey="Not started" stackId="a" fill={T.neutral}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card title="Teachers × courses" right={
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search teacher / school / email"
          style={{
            padding: '6px 10px',
            backgroundColor: T.panel2,
            border: `1px solid ${T.border}`,
            borderRadius: 8,
            color: T.ink,
            fontSize: 13,
            outline: 'none',
            minWidth: 240,
          }}
        />
      }>
        <TableShell>
          <thead>
            <tr>
              <th style={th}>Teacher</th>
              <th style={th}>School</th>
              <th style={th}>Email</th>
              <th style={th}>Trained</th>
              <th style={th}>C1</th>
              <th style={th}>C2</th>
              <th style={th}>C3</th>
              <th style={th}>C4</th>
              <th style={th}>Support hub</th>
              <th style={th}>Last visit</th>
            </tr>
          </thead>
          <tbody>
            {teacherRows.map((t, i) => (
              <tr key={i}>
                <td style={{ ...td, color: T.ink, fontWeight: 600 }}>{t.name}</td>
                <td style={{ ...td, color: T.inkDim }}>{t.school}</td>
                <td style={{ ...td, color: T.inkDim, fontSize: 12 }}>{t.email}</td>
                <td style={td}>{t.fullyTrained ? <Badge tone="green">Yes</Badge> : <Badge tone="neutral">No</Badge>}</td>
                <td style={td}><StatusDot status={t.c1} /></td>
                <td style={td}><StatusDot status={t.c2} /></td>
                <td style={td}><StatusDot status={t.c3} /></td>
                <td style={td}><StatusDot status={t.c4} /></td>
                <td style={td}><StatusDot status={t.supportHub} /></td>
                <td style={{ ...td, color: T.inkMute, fontSize: 12 }}>{t.lastVisit || '—'}</td>
              </tr>
            ))}
            {teacherRows.length === 0 && (
              <tr><td colSpan={10} style={{ ...td, textAlign: 'center', color: T.inkMute }}>No teachers match this search</td></tr>
            )}
          </tbody>
        </TableShell>
      </Card>
    </div>
  )
}

function StatusDot({ status }: { status: TrainingStatus }) {
  const label = status || 'Not started'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.inkDim }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: STATUS_COLOR[status] }} />
      {label}
    </span>
  )
}

// silence unused Cell
export { Cell }
