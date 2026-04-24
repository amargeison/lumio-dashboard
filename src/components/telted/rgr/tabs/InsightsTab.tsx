'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, ScatterChart, Scatter, Legend, ZAxis } from 'recharts'
import { T, RAG_COLOR } from '../tokens'
import { Card } from '../ui'
import type { Payload } from '../types'

export function InsightsTab({ data }: { data: Payload }) {
  // RAG mix per state (schools)
  const ragByState = useMemo(() => {
    const m = new Map<string, { state: string; red: number; amber: number; green: number }>()
    for (const s of data.schools) {
      const row = m.get(s.state) ?? { state: s.state, red: 0, amber: 0, green: 0 }
      row[s.engagement]++
      m.set(s.state, row)
    }
    return [...m.values()].sort((a, b) => (b.red + b.amber + b.green) - (a.red + a.amber + a.green))
  }, [data.schools])

  // CY completion % per state = schools with assessmentsCY > 0 / total schools in state
  const completionByState = useMemo(() => {
    const m = new Map<string, { state: string; have: number; total: number }>()
    for (const s of data.schools) {
      const row = m.get(s.state) ?? { state: s.state, have: 0, total: 0 }
      row.total++
      if (s.assessmentsCY > 0) row.have++
      m.set(s.state, row)
    }
    return [...m.values()]
      .map(r => ({ state: r.state, pct: Math.round(100 * r.have / r.total), have: r.have, total: r.total }))
      .sort((a, b) => b.pct - a.pct)
  }, [data.schools])

  // Avg total by grade (CY)
  const avgByGrade = useMemo(() => {
    const cy = data.assessments.filter(a => a.year === '2025-26')
    return Object.entries(data.yearMap).map(([key, label]) => {
      const rows = cy.filter(a => a.yearGroup === key)
      const avg = rows.length ? Math.round(rows.reduce((s, a) => s + a.total, 0) / rows.length) : 0
      return { grade: label, avg, n: rows.length }
    })
  }, [data.assessments, data.yearMap])

  // Paired scatter — first vs last
  const paired = useMemo(
    () => data.pairedAssessments.map(p => ({
      x: p.first,
      y: p.last,
      delta: p.delta,
      codename: p.codename,
      school: p.schoolName,
    })),
    [data.pairedAssessments],
  )

  // Subskill distributions (CY) — bucket by 10-point bands
  const subskillDist = useMemo(() => {
    const cy = data.assessments.filter(a => a.year === '2025-26')
    const buckets = ['<70', '70-79', '80-89', '90-99', '100-109', '110+']
    const bucket = (v: number) => {
      if (v < 70) return '<70'
      if (v < 80) return '70-79'
      if (v < 90) return '80-89'
      if (v < 100) return '90-99'
      if (v < 110) return '100-109'
      return '110+'
    }
    return buckets.map(b => {
      const row: Record<string, string | number> = { bucket: b }
      for (const k of ['ev', 'rv', 'lc', 'sr'] as const) {
        row[k] = cy.filter(a => bucket(a[k]) === b).length
      }
      return row
    })
  }, [data.assessments])

  // Courses breakdown — stacked by status
  const coursesBreakdown = useMemo(() => {
    const statuses = ['Completed', 'In progress', 'Enrolled', 'Not started'] as const
    return (['c1', 'c2', 'c3', 'c4'] as const).map(k => {
      const label = { c1: 'C1 Language', c2: 'C2 NELI', c3: 'C3 NELI Pt 2', c4: 'C4 Whole Class' }[k]
      const row: Record<string, string | number> = { course: label }
      for (const s of statuses) {
        row[s] = data.teachers.filter(t => (t[k] || '') === s).length
      }
      row['Not started'] = data.teachers.filter(t => !t[k] || t[k] === 'Not started').length
      return row
    })
  }, [data.teachers])

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title="RAG mix per state">
          <div style={{ width: '100%', height: 360 }}>
            <ResponsiveContainer>
              <BarChart layout="vertical" data={ragByState} margin={{ top: 4, right: 10, bottom: 0, left: 10 }}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: T.inkMute }} stroke={T.border} />
                <YAxis type="category" dataKey="state" tick={{ fontSize: 10, fill: T.inkDim }} stroke={T.border} width={110} />
                <Tooltip contentStyle={{ backgroundColor: T.panel, border: `1px solid ${T.border}`, fontSize: 12 }} labelStyle={{ color: T.ink }} />
                <Bar dataKey="red"   stackId="a" fill={RAG_COLOR.red}   />
                <Bar dataKey="amber" stackId="a" fill={RAG_COLOR.amber} />
                <Bar dataKey="green" stackId="a" fill={RAG_COLOR.green} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="CY completion % per state">
          <div style={{ width: '100%', height: 360 }}>
            <ResponsiveContainer>
              <BarChart layout="vertical" data={completionByState} margin={{ top: 4, right: 10, bottom: 0, left: 10 }}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: T.inkMute }} stroke={T.border} />
                <YAxis type="category" dataKey="state" tick={{ fontSize: 10, fill: T.inkDim }} stroke={T.border} width={110} />
                <Tooltip
                  contentStyle={{ backgroundColor: T.panel, border: `1px solid ${T.border}`, fontSize: 12 }}
                  labelStyle={{ color: T.ink }}
                  formatter={(v, _n, item) => {
                    const p = item.payload as { have: number; total: number; pct: number }
                    return [`${v}% (${p.have}/${p.total})`, 'Schools with CY assessments']
                  }}
                />
                <Bar dataKey="pct" fill={T.teal} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title="Average total score by grade (CY)">
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={avgByGrade} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis dataKey="grade" tick={{ fontSize: 10, fill: T.inkMute }} stroke={T.border} />
                <YAxis tick={{ fontSize: 10, fill: T.inkMute }} stroke={T.border} domain={[70, 120]} />
                <Tooltip
                  contentStyle={{ backgroundColor: T.panel, border: `1px solid ${T.border}`, fontSize: 12 }}
                  labelStyle={{ color: T.ink }}
                  formatter={(v, _n, item) => {
                    const p = item.payload as { avg: number; n: number }
                    return [`avg ${p.avg} · n=${p.n}`, 'score']
                  }}
                />
                <Bar dataKey="avg" fill={T.blue} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="First vs last total (paired students)" right={<span style={{ fontSize: 11, color: T.inkMute }}>{paired.length} paired</span>}>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <ScatterChart margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis type="number" dataKey="x" name="First" domain={[60, 140]} tick={{ fontSize: 10, fill: T.inkMute }} stroke={T.border} />
                <YAxis type="number" dataKey="y" name="Last"  domain={[60, 140]} tick={{ fontSize: 10, fill: T.inkMute }} stroke={T.border} />
                <ZAxis range={[25, 25]} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: T.panel, border: `1px solid ${T.border}`, fontSize: 12 }}
                  labelStyle={{ color: T.ink }}
                  formatter={(v, n) => [v, n]}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const p = payload[0].payload as { codename: string; school: string; x: number; y: number; delta: number }
                    return (
                      <div style={{ backgroundColor: T.panel, border: `1px solid ${T.border}`, padding: 8, fontSize: 12 }}>
                        <div style={{ color: T.ink, fontWeight: 600 }}>{p.codename}</div>
                        <div style={{ color: T.inkDim }}>{p.school}</div>
                        <div style={{ color: T.inkMute }}>first {p.x} → last {p.y} ({p.delta >= 0 ? '+' : ''}{p.delta})</div>
                      </div>
                    )
                  }}
                />
                <Scatter data={paired} fill={T.purple} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title="Subskill distribution (CY)">
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={subskillDist} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis dataKey="bucket" tick={{ fontSize: 10, fill: T.inkMute }} stroke={T.border} />
                <YAxis tick={{ fontSize: 10, fill: T.inkMute }} stroke={T.border} />
                <Tooltip contentStyle={{ backgroundColor: T.panel, border: `1px solid ${T.border}`, fontSize: 12 }} labelStyle={{ color: T.ink }} />
                <Legend wrapperStyle={{ fontSize: 11, color: T.inkDim }} />
                <Bar dataKey="ev" name="Expressive"  fill={T.teal}   />
                <Bar dataKey="rv" name="Receptive"   fill={T.blue}   />
                <Bar dataKey="lc" name="Listening"   fill={T.purple} />
                <Bar dataKey="sr" name="Sentence"    fill={T.amber}  />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Course status breakdown">
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={coursesBreakdown} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis dataKey="course" tick={{ fontSize: 10, fill: T.inkMute }} stroke={T.border} />
                <YAxis tick={{ fontSize: 10, fill: T.inkMute }} stroke={T.border} />
                <Tooltip contentStyle={{ backgroundColor: T.panel, border: `1px solid ${T.border}`, fontSize: 12 }} labelStyle={{ color: T.ink }} />
                <Legend wrapperStyle={{ fontSize: 11, color: T.inkDim }} />
                <Bar dataKey="Completed"    stackId="a" fill={T.green}  />
                <Bar dataKey="In progress"  stackId="a" fill={T.amber}  />
                <Bar dataKey="Enrolled"     stackId="a" fill={T.blue}   />
                <Bar dataKey="Not started"  stackId="a" fill={T.neutral}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}

// Cell re-export unused removal — keep Cell import for future highlighting if needed
export { Cell }
