'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { T, RAG_COLOR } from '../tokens'
import { Card, Kpi, Donut, Badge } from '../ui'
import { UsStateMap } from '../UsStateMap'
import type { Payload, School } from '../types'

export function OverviewTab({ data }: { data: Payload }) {
  const schoolsNeedingAttention = useMemo(
    () => data.schools
      .filter(s => s.engagement !== 'green')
      .sort((a, b) => {
        // red first, then amber; within each, least-recent portal access first
        const order = (e: School['engagement']) => (e === 'red' ? 0 : e === 'amber' ? 1 : 2)
        const byRag = order(a.engagement) - order(b.engagement)
        if (byRag !== 0) return byRag
        return (b.daysSincePortal ?? 0) - (a.daysSincePortal ?? 0)
      })
      .slice(0, 5),
    [data.schools],
  )

  const byGrade = useMemo(() => {
    const cy = data.assessments.filter(a => a.year === '2025-26')
    const order = Object.entries(data.yearMap)
    return order.map(([key, label]) => ({
      grade: label,
      students: cy.filter(a => a.yearGroup === key).length,
    }))
  }, [data.assessments, data.yearMap])

  const subskillAvg = useMemo(() => {
    const cy = data.assessments.filter(a => a.year === '2025-26')
    const avg = (k: 'ev' | 'rv' | 'lc' | 'sr') =>
      cy.length ? Math.round(cy.reduce((s, a) => s + a[k], 0) / cy.length) : 0
    return [
      { skill: 'Expressive vocab',    value: avg('ev'), color: T.teal },
      { skill: 'Receptive vocab',     value: avg('rv'), color: T.blue },
      { skill: 'Listening comp.',     value: avg('lc'), color: T.purple },
      { skill: 'Sentence repetition', value: avg('sr'), color: T.amber },
    ]
  }, [data.assessments])

  const avgTotal = useMemo(() => {
    const cy = data.assessments.filter(a => a.year === '2025-26')
    if (!cy.length) return 0
    return Math.round(cy.reduce((s, a) => s + a.total, 0) / cy.length)
  }, [data.assessments])

  const activity = useMemo(() => {
    const items: { when: string; text: string; tone: 'red' | 'amber' | 'green' | 'teal' }[] = []
    // Portal access (most recent 12)
    const recent = [...data.schools]
      .filter(s => s.portalAccess)
      .sort((a, b) => (b.portalAccess || '').localeCompare(a.portalAccess || ''))
      .slice(0, 8)
    for (const s of recent) {
      items.push({ when: s.portalAccess, text: `${s.name} visited the portal`, tone: 'teal' })
    }
    // Assessment activity
    const lastAssess = [...data.schools]
      .filter(s => s.lastAssessmentDate)
      .sort((a, b) => (b.lastAssessmentDate || '').localeCompare(a.lastAssessmentDate || ''))
      .slice(0, 4)
    for (const s of lastAssess) {
      items.push({ when: s.lastAssessmentDate, text: `${s.name} ran assessments`, tone: 'green' })
    }
    return items
      .sort((a, b) => b.when.localeCompare(a.when))
      .slice(0, 12)
  }, [data.schools])

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0,1fr))', gap: 12 }}>
        <Kpi label="Schools"             value={data.kpi.totalSchools} sub={`${data.partner.schoolsUnderManagement} under management`} />
        <Kpi label="Students"            value={data.kpi.studentsTotal.toLocaleString()} sub={`${data.kpi.classesTotal} classes`} />
        <Kpi label="Assessments (CY)"    value={data.kpi.assessmentsCY.toLocaleString()} sub={`${data.kpi.assessmentsTotal.toLocaleString()} all time`} />
        <Kpi label="Avg total score"     value={avgTotal || '—'} sub="2025-26 year" />
        <Kpi label="Teachers trained"    value={`${data.kpi.teachersTrained} / ${data.kpi.teachersTotal}`} sub={`${Math.round(100 * data.kpi.teachersTrained / (data.kpi.teachersTotal || 1))}%`} />
        <Kpi label="Needs attention"     value={data.kpi.red + data.kpi.amber} sub={`${data.kpi.red} red · ${data.kpi.amber} amber`} />
      </div>

      {/* Row 1 — donuts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title="School engagement">
          <Donut
            center={`${data.kpi.totalSchools}`}
            segments={[
              { value: data.kpi.green, color: RAG_COLOR.green, label: `Green — active`    },
              { value: data.kpi.amber, color: RAG_COLOR.amber, label: `Amber — partial`   },
              { value: data.kpi.red,   color: RAG_COLOR.red,   label: `Red — not in use`  },
            ]}
          />
        </Card>

        <Card title="Student RAG (all assessments)">
          <Donut
            center={`${(data.kpi.ragR + data.kpi.ragA + data.kpi.ragG).toLocaleString()}`}
            segments={[
              { value: data.kpi.ragG, color: RAG_COLOR.green, label: `Green ≥ 90`      },
              { value: data.kpi.ragA, color: RAG_COLOR.amber, label: `Amber 85–89`     },
              { value: data.kpi.ragR, color: RAG_COLOR.red,   label: `Red < 85`        },
            ]}
          />
        </Card>
      </div>

      {/* Row 2 — US map */}
      <Card title="Portfolio — US engagement map" right={<span style={{ fontSize: 11, color: T.inkMute }}>Dominant RAG per state · saturation ~ school count</span>}>
        <UsStateMap schools={data.schools} />
      </Card>

      {/* Row 3 — assessments by grade + subskill bar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title="Assessments by grade (CY)">
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={byGrade} margin={{ top: 6, right: 6, bottom: 0, left: -12 }}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis dataKey="grade" tick={{ fontSize: 10, fill: T.inkMute }} stroke={T.border} />
                <YAxis tick={{ fontSize: 10, fill: T.inkMute }} stroke={T.border} />
                <Tooltip contentStyle={{ backgroundColor: T.panel, border: `1px solid ${T.border}`, fontSize: 12 }} labelStyle={{ color: T.ink }} />
                <Bar dataKey="students" fill={T.teal} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Average subskill score (CY)">
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <BarChart layout="vertical" data={subskillAvg} margin={{ top: 6, right: 20, bottom: 0, left: 10 }}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[70, 120]} tick={{ fontSize: 10, fill: T.inkMute }} stroke={T.border} />
                <YAxis type="category" dataKey="skill" tick={{ fontSize: 11, fill: T.inkDim }} stroke={T.border} width={130} />
                <Tooltip contentStyle={{ backgroundColor: T.panel, border: `1px solid ${T.border}`, fontSize: 12 }} labelStyle={{ color: T.ink }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {subskillAvg.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Row 4 — needs attention + activity feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        <Card title="Top 5 — schools needing attention">
          <div style={{ display: 'grid', gap: 8 }}>
            {schoolsNeedingAttention.map(s => (
              <div key={s.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 12, alignItems: 'center', padding: '8px 10px', borderRadius: 8, border: `1px solid ${T.border}`, backgroundColor: T.panel2 }}>
                <Badge tone={s.engagement === 'red' ? 'red' : 'amber'}>{s.engagement.toUpperCase()}</Badge>
                <div>
                  <div style={{ fontWeight: 600, color: T.ink }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: T.inkDim }}>{s.state} · {s.nextAction}</div>
                </div>
                <div style={{ fontSize: 12, color: T.inkMute, textAlign: 'right' }}>
                  {s.daysSincePortal != null ? `Portal ${s.daysSincePortal}d ago` : 'No portal visit'}
                </div>
              </div>
            ))}
            {schoolsNeedingAttention.length === 0 && (
              <div style={{ fontSize: 13, color: T.inkDim }}>All schools green.</div>
            )}
          </div>
        </Card>

        <Card title="Recent activity">
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 6 }}>
            {activity.map((a, i) => (
              <li key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 10, padding: '6px 0', borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 11, color: T.inkMute }}>{a.when.slice(5)}</span>
                <span style={{ fontSize: 12, color: T.ink }}>{a.text}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
