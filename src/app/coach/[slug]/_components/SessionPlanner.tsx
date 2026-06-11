'use client'

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT, FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { getPlans, removePlan, toggleDone, subscribe, type PlannedSession } from '../_lib/session-plan'

type Common = { T: ThemeTokens; accent: AccentTokens; density: Density }

function Card({ T, density, children, style }: { T: ThemeTokens; density: Density; children: ReactNode; style?: CSSProperties }) {
  return <div style={{ position: 'relative', background: T.panel, border: `1px solid ${T.border}`, borderRadius: density.radius, padding: density.pad, boxShadow: T.cardShadow, ...style }}>{children}</div>
}

export function SessionPlannerView({ T, accent, density }: Common) {
  const [plans, setPlans] = useState<PlannedSession[]>([])
  useEffect(() => {
    const refresh = () => setPlans(getPlans())
    refresh()
    return subscribe(refresh)
  }, [])

  const active = plans.filter(p => !p.done)
  const done = plans.filter(p => p.done)

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontFamily: FONT, fontSize: 24, fontWeight: 600, color: T.text, letterSpacing: '-0.02em' }}>Session Planner</h1>
        <p style={{ margin: '4px 0 0', fontSize: 12.5, color: T.text3 }}>Plans you’ve saved from lesson AI briefs land here, ready to run on court.</p>
      </div>

      {plans.length === 0 && (
        <Card T={T} density={density} style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: accent.dim, display: 'grid', placeItems: 'center', margin: '0 auto 12px' }}>
            <Icon name="flag" size={22} stroke={1.6} style={{ color: accent.hex }} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>No planned sessions yet</div>
          <div style={{ fontSize: 12.5, color: T.text3, marginTop: 4, maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>
            Open a lesson summary, scroll to the <strong style={{ color: T.text2 }}>Coach AI brief</strong> and hit “Add to next session plan”. It’ll appear here.
          </div>
        </Card>
      )}

      {active.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: density.gap }}>
          {active.map(p => <PlanCard key={p.id} T={T} accent={accent} density={density} p={p} />)}
        </div>
      )}

      {done.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '20px 0 8px' }}>Completed</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: density.gap }}>
            {done.map(p => <PlanCard key={p.id} T={T} accent={accent} density={density} p={p} />)}
          </div>
        </>
      )}
    </div>
  )
}

function PlanCard({ T, accent, density, p }: Common & { p: PlannedSession }) {
  const total = p.plan.reduce((s, x) => s + x.mins, 0)
  return (
    <Card T={T} density={density} style={{ opacity: p.done ? 0.6 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: T.text, textDecoration: p.done ? 'line-through' : 'none' }}>{p.player}</span>
            <span style={{ fontSize: 9.5, fontFamily: FONT_MONO, padding: '2px 6px', borderRadius: 4, background: accent.dim, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{total} min</span>
            <span style={{ fontSize: 10.5, color: T.text3 }}>{p.source}</span>
          </div>
          <div style={{ fontSize: 12.5, color: T.text2, marginTop: 3 }}>Focus: {p.focus}</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => toggleDone(p.id)} style={{ appearance: 'none', border: `1px solid ${p.done ? T.border : accent.border}`, background: p.done ? 'transparent' : accent.dim, color: p.done ? T.text3 : accent.hex, borderRadius: 8, padding: '6px 11px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="check" size={12} stroke={2.2} /> {p.done ? 'Done' : 'Mark done'}
          </button>
          <button onClick={() => removePlan(p.id)} title="Remove" style={{ appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text3, borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 15 }}>×</button>
        </div>
      </div>

      <div className="cm-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Focus points</div>
          {p.workOn.map((w, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '4px 0', fontSize: 12, color: T.text, lineHeight: 1.45 }}>
              <span style={{ color: accent.hex, fontWeight: 700 }}>{i + 1}</span>{w}
            </div>
          ))}
          {p.drills.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {p.drills.map((d, i) => <span key={i} style={{ fontSize: 10.5, color: T.text2, padding: '3px 7px', borderRadius: 6, background: T.panel2, border: `1px solid ${T.border}` }}>{d}</span>)}
            </div>
          )}
        </div>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Plan</div>
          {p.plan.map((ph, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '5px 0', borderTop: i ? `1px solid ${T.border}` : 'none' }}>
              <span className="tnum" style={{ fontSize: 10.5, color: accent.hex, fontFamily: FONT_MONO, fontWeight: 700, width: 32, flexShrink: 0, paddingTop: 1 }}>{ph.mins}m</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11.5, color: T.text, fontWeight: 600 }}>{ph.phase}</div>
                <div style={{ fontSize: 10.5, color: T.text3, lineHeight: 1.4 }}>{ph.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
