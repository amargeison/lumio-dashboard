'use client'

import { T, RAG_COLOR } from './tokens'
import { Badge } from './ui'
import type { Payload, School } from './types'

export function SchoolDrawer({ school, teachers, onClose }: { school: School; teachers: Payload['teachers']; onClose: () => void }) {
  const schoolTeachers = teachers.filter(t => t.schoolFull === `${school.name} (${school.code})` || t.school === school.name)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'grid', gridTemplateColumns: '1fr 520px', color: T.ink }}>
      <button
        aria-label="Close"
        onClick={onClose}
        style={{ background: 'rgba(0,0,0,0.55)', border: 'none', cursor: 'pointer' }}
      />
      <aside style={{ backgroundColor: T.bg, borderLeft: `1px solid ${T.border}`, overflowY: 'auto' }}>
        <header style={{ padding: 20, borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: T.inkMute, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{school.state}</div>
            <h2 style={{ margin: '4px 0 0', fontSize: 18, color: T.ink }}>{school.name}</h2>
            <div style={{ fontSize: 12, color: T.inkDim, marginTop: 2 }}>Code {school.code}</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: `1px solid ${T.border}`, color: T.inkDim, padding: '4px 10px', borderRadius: 6, cursor: 'pointer' }}
          >×</button>
        </header>

        <div style={{ padding: 20, display: 'grid', gap: 16 }}>
          {/* Engagement + phase */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <Badge tone={school.engagement}>{school.engagement.toUpperCase()}</Badge>
            <Badge tone="teal">Phase {school.phase}</Badge>
            {school.phaseLabels.map((label, i) => <Badge key={i} tone="blue">{label}</Badge>)}
          </div>

          {/* Next action */}
          <section>
            <div style={{ fontSize: 11, color: T.inkMute, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Recommended next action</div>
            <div style={{ fontSize: 14, color: T.ink, lineHeight: 1.5 }}>{school.nextAction}</div>
          </section>

          {/* Counts */}
          <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <Stat label="Students"        value={school.students} />
            <Stat label="Classes"         value={school.classes} />
            <Stat label="Assessments CY"  value={school.assessmentsCY} />
            <Stat label="Assessments all" value={school.totalAssessments} />
            <Stat label="Teachers invited"        value={school.teachersInvited} />
            <Stat label="Teachers fully trained"  value={school.teachersFullyTrained} />
          </section>

          {/* RAG mix */}
          <section>
            <div style={{ fontSize: 11, color: T.inkMute, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Student RAG mix</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <Mini color={RAG_COLOR.green} label="Green ≥90" value={school.green} />
              <Mini color={RAG_COLOR.amber} label="Amber 85-89" value={school.amber} />
              <Mini color={RAG_COLOR.red} label="Red <85" value={school.red} />
            </div>
          </section>

          {/* Portal access */}
          <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Stat label="Last portal"     value={school.portalAccess || '—'} sub={school.daysSincePortal != null ? `${school.daysSincePortal}d ago` : ''} />
            <Stat label="Last assessment" value={school.lastAssessmentDate || '—'} sub={school.daysSinceAssessment != null ? `${school.daysSinceAssessment}d ago` : ''} />
          </section>

          {/* DRL */}
          <section>
            <div style={{ fontSize: 11, color: T.inkMute, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Digital Resource Library</div>
            {school.hasDRL ? (
              <div style={{ fontSize: 13, color: T.ink }}>
                Active · last visit {school.lastDRL}
                {school.wcMilestone && <div style={{ fontSize: 12, color: T.inkDim }}>WC: {school.wcMilestone}</div>}
                {school.psMilestone && <div style={{ fontSize: 12, color: T.inkDim }}>PS: {school.psMilestone}</div>}
              </div>
            ) : <div style={{ fontSize: 13, color: T.inkMute }}>Not activated</div>}
          </section>

          {/* Teachers list */}
          <section>
            <div style={{ fontSize: 11, color: T.inkMute, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Teachers ({schoolTeachers.length})</div>
            <div style={{ display: 'grid', gap: 6 }}>
              {schoolTeachers.map((t, i) => (
                <div key={i} style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${T.border}`, backgroundColor: T.panel2 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, color: T.ink, fontWeight: 600 }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: T.inkDim }}>{t.email}</div>
                    </div>
                    {t.fullyTrained ? <Badge tone="green">Trained</Badge> : <Badge tone="neutral">In flight</Badge>}
                  </div>
                  <div style={{ fontSize: 11, color: T.inkMute, marginTop: 4 }}>
                    C1 {t.c1 || '—'} · C2 {t.c2 || '—'} · C3 {t.c3 || '—'} · C4 {t.c4 || '—'}
                  </div>
                </div>
              ))}
              {schoolTeachers.length === 0 && <div style={{ fontSize: 13, color: T.inkMute }}>No teachers invited yet.</div>}
            </div>
          </section>
        </div>
      </aside>
    </div>
  )
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ padding: 12, borderRadius: 8, border: `1px solid ${T.border}`, backgroundColor: T.panel2 }}>
      <div style={{ fontSize: 10, color: T.inkMute, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: T.ink, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.inkMute, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function Mini({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div style={{ padding: 10, borderRadius: 8, border: `1px solid ${T.border}`, backgroundColor: T.panel2 }}>
      <div style={{ width: 10, height: 10, backgroundColor: color, borderRadius: 2, marginBottom: 6 }} />
      <div style={{ fontSize: 18, fontWeight: 700, color: T.ink }}>{value}</div>
      <div style={{ fontSize: 10, color: T.inkMute }}>{label}</div>
    </div>
  )
}
