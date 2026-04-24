'use client'

import { useMemo } from 'react'
import { T } from '../tokens'
import { Card, Badge, TableShell, th, td } from '../ui'
import type { Payload } from '../types'

export function DRLAccessTab({ data }: { data: Payload }) {
  const active = useMemo(() => data.schools.filter(s => s.hasDRL), [data.schools])
  // Eligibility = engagement !== 'red' (at least running assessments) AND no DRL yet
  const eligible = useMemo(
    () => data.schools
      .filter(s => !s.hasDRL && s.engagement !== 'red')
      .sort((a, b) => {
        const order = (e: typeof a.engagement) => (e === 'green' ? 0 : 1)
        return order(a.engagement) - order(b.engagement) || b.assessmentsCY - a.assessmentsCY
      }),
    [data.schools],
  )

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ width: 10, height: 10, backgroundColor: T.amber, borderRadius: 999 }} />
          <div style={{ fontSize: 14, color: T.ink, lineHeight: 1.5 }}>
            <strong style={{ color: T.amber }}>{data.kpi.drlSchools} of {data.kpi.totalSchools}</strong> schools have touched the Digital Resource Library.
            This is the biggest adoption gap in the portfolio — every school with at least one assessment this year is ready for DRL onboarding.
          </div>
        </div>
      </Card>

      <Card title={`DRL-active schools (${active.length})`}>
        {active.length === 0 ? (
          <div style={{ fontSize: 13, color: T.inkMute }}>No schools have DRL activity yet.</div>
        ) : (
          <TableShell scroll={false}>
            <thead>
              <tr>
                <th style={th}>School</th>
                <th style={th}>State</th>
                <th style={th}>Last DRL visit</th>
                <th style={th}>Whole-class milestone</th>
                <th style={th}>Phonics milestone</th>
              </tr>
            </thead>
            <tbody>
              {active.map(s => (
                <tr key={s.id}>
                  <td style={{ ...td, color: T.ink, fontWeight: 600 }}>{s.name}</td>
                  <td style={{ ...td, color: T.inkDim }}>{s.state}</td>
                  <td style={{ ...td, color: T.inkDim }}>{s.lastDRL || '—'}</td>
                  <td style={{ ...td, color: T.inkDim }}>{s.wcMilestone || '—'}</td>
                  <td style={{ ...td, color: T.inkDim }}>{s.psMilestone || '—'}</td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </Card>

      <Card title={`Kick-off eligibility (${eligible.length}) — schools with CY assessments but no DRL`}>
        <TableShell>
          <thead>
            <tr>
              <th style={th}>School</th>
              <th style={th}>State</th>
              <th style={th}>RAG</th>
              <th style={th}>CY assessments</th>
              <th style={th}>Trained teachers</th>
              <th style={th}>Last portal</th>
            </tr>
          </thead>
          <tbody>
            {eligible.map(s => (
              <tr key={s.id}>
                <td style={{ ...td, color: T.ink, fontWeight: 600 }}>{s.name}</td>
                <td style={{ ...td, color: T.inkDim }}>{s.state}</td>
                <td style={td}><Badge tone={s.engagement}>{s.engagement.toUpperCase()}</Badge></td>
                <td style={{ ...td, color: T.inkDim }}>{s.assessmentsCY}</td>
                <td style={{ ...td, color: T.inkDim }}>{s.teachersFullyTrained} / {s.teachersInvited}</td>
                <td style={{ ...td, color: T.inkDim }}>{s.daysSincePortal != null ? `${s.daysSincePortal}d` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </Card>
    </div>
  )
}
