'use client'

import { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, Cell } from 'recharts'
import { T, RAG_COLOR } from '../tokens'
import { Card, Badge, SegControl, TableShell, th, td } from '../ui'
import type { Payload, AssessmentYear, StudentRag } from '../types'

export function AssessmentsTab({ data }: { data: Payload }) {
  const [year, setYear] = useState<AssessmentYear>('2025-26')
  const [rag, setRag] = useState<'all' | StudentRag>('all')
  const [query, setQuery] = useState('')

  const scoped = useMemo(() => data.assessments.filter(a => a.year === year), [data.assessments, year])

  const hist = useMemo(() => {
    const buckets = Array.from({ length: 12 }, (_, i) => ({ band: 60 + i * 5, count: 0, sum: 0 }))
    for (const a of scoped) {
      const idx = Math.max(0, Math.min(11, Math.floor((a.total - 60) / 5)))
      buckets[idx].count++
      buckets[idx].sum += a.total
    }
    return buckets.map(b => ({ band: `${b.band}-${b.band + 4}`, count: b.count, avg: b.count ? Math.round(b.sum / b.count) : 0 }))
  }, [scoped])

  const radar = useMemo(() => {
    if (!scoped.length) return []
    const avg = (k: 'ev' | 'rv' | 'lc' | 'sr') => Math.round(scoped.reduce((s, a) => s + a[k], 0) / scoped.length)
    return [
      { axis: 'Expressive vocab',    portfolio: avg('ev'), benchmark: 100 },
      { axis: 'Receptive vocab',     portfolio: avg('rv'), benchmark: 100 },
      { axis: 'Listening comp.',     portfolio: avg('lc'), benchmark: 100 },
      { axis: 'Sentence repetition', portfolio: avg('sr'), benchmark: 100 },
    ]
  }, [scoped])

  const pupils = useMemo(() => {
    const q = query.trim().toLowerCase()
    return scoped
      .filter(a => rag === 'all' || a.rag === rag)
      .filter(a => !q || a.codename.toLowerCase().includes(q) || a.schoolName.toLowerCase().includes(q) || a.grade.toLowerCase().includes(q))
      .sort((a, b) => b.assessmentDate.localeCompare(a.assessmentDate))
      .slice(0, 500)
  }, [scoped, rag, query])

  const ragCounts = useMemo(() => {
    const c = { red: 0, amber: 0, green: 0 }
    for (const a of scoped) c[a.rag]++
    return c
  }, [scoped])

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <SegControl
            value={year}
            onChange={setYear}
            options={[
              { id: '2025-26', label: '2025-26' },
              { id: '2024-25', label: '2024-25' },
            ]}
          />
          <SegControl
            value={rag}
            onChange={setRag}
            options={[
              { id: 'all',   label: `All (${scoped.length})` },
              { id: 'red',   label: `Red (${ragCounts.red})` },
              { id: 'amber', label: `Amber (${ragCounts.amber})` },
              { id: 'green', label: `Green (${ragCounts.green})` },
            ]}
          />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Codename, school, grade"
            style={{
              flex: 1,
              minWidth: 200,
              padding: '8px 12px',
              backgroundColor: T.panel2,
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              color: T.ink,
              fontSize: 13,
              outline: 'none',
            }}
          />
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        <Card title={`Total score distribution — ${year}`}>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={hist} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis dataKey="band" tick={{ fontSize: 10, fill: T.inkMute }} stroke={T.border} />
                <YAxis tick={{ fontSize: 10, fill: T.inkMute }} stroke={T.border} />
                <Tooltip contentStyle={{ backgroundColor: T.panel, border: `1px solid ${T.border}`, fontSize: 12 }} labelStyle={{ color: T.ink }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {hist.map((h, i) => {
                    const low = parseInt(h.band.slice(0, h.band.indexOf('-')))
                    const fill = low < 85 ? T.red : low < 90 ? T.amber : T.green
                    return <Cell key={i} fill={fill} />
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Subskills vs benchmark">
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <RadarChart outerRadius={90} data={radar}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fill: T.inkDim }} />
                <PolarRadiusAxis tick={{ fontSize: 10, fill: T.inkMute }} domain={[70, 120]} />
                <Radar name="Benchmark" dataKey="benchmark" stroke={T.inkMute} fill={T.inkMute} fillOpacity={0.08} />
                <Radar name="Portfolio" dataKey="portfolio" stroke={T.teal}    fill={T.teal}    fillOpacity={0.25} />
                <Legend wrapperStyle={{ fontSize: 11, color: T.inkDim }} />
                <Tooltip contentStyle={{ backgroundColor: T.panel, border: `1px solid ${T.border}`, fontSize: 12 }} labelStyle={{ color: T.ink }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <TableShell>
        <thead>
          <tr>
            <th style={th}>Codename</th>
            <th style={th}>School</th>
            <th style={th}>Grade</th>
            <th style={th}>Date</th>
            <th style={th}>RAG</th>
            <th style={th}>Total</th>
            <th style={th}>EV</th>
            <th style={th}>RV</th>
            <th style={th}>LC</th>
            <th style={th}>SR</th>
          </tr>
        </thead>
        <tbody>
          {pupils.map((a, i) => (
            <tr key={`${a.studentId}-${i}`}>
              <td style={{ ...td, color: T.ink, fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>{a.codename}</td>
              <td style={{ ...td, color: T.inkDim }}>{a.schoolName}</td>
              <td style={{ ...td, color: T.inkDim }}>{a.grade}</td>
              <td style={{ ...td, color: T.inkDim }}>{a.assessmentDate}</td>
              <td style={td}><Badge tone={a.rag}>{a.rag.toUpperCase()}</Badge></td>
              <td style={{ ...td, fontWeight: 700, color: RAG_COLOR[a.rag] }}>{a.total}</td>
              <td style={{ ...td, color: T.inkDim }}>{a.ev}</td>
              <td style={{ ...td, color: T.inkDim }}>{a.rv}</td>
              <td style={{ ...td, color: T.inkDim }}>{a.lc}</td>
              <td style={{ ...td, color: T.inkDim }}>{a.sr}</td>
            </tr>
          ))}
          {pupils.length === 0 && (
            <tr><td colSpan={10} style={{ ...td, textAlign: 'center', color: T.inkMute }}>No assessments match these filters</td></tr>
          )}
        </tbody>
      </TableShell>
      {pupils.length >= 500 && (
        <div style={{ fontSize: 11, color: T.inkMute, textAlign: 'center' }}>Showing first 500 rows — narrow filters to see more.</div>
      )}
    </div>
  )
}
