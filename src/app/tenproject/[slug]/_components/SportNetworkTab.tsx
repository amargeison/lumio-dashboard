'use client'

// PE & School Sport Partnerships Network (PESSPN) — HQ one-stop shop, plus the
// per-school readiness card reused inside the Schools detail view.
// Policy facts come from src/data/impact/sport-network.ts (verified baseline)
// or the stored copy the Update button refreshes from gov.uk / DfE / YST.
// Readiness scores are an indicative framework, not DfE criteria.

import React from 'react'
import { Landmark, CheckCircle, CircleDashed, Circle, CalendarClock, FileText, ExternalLink, ArrowUpRight, School, Info, RefreshCw, PoundSterling } from 'lucide-react'
import { Card, SectionTitle, Pill, EmptyState } from './ui'
import { TP_RED, TP_DARK, type PesspnVerdict, type PesspnStatus } from '@/data/tenproject/demo-data'
import { useImpact } from './ImpactDataContext'
import { useSportNetwork } from '@/lib/impact/use-sport-network'

const VERDICT: Record<PesspnVerdict, { label: string; color: string; tone: 'green' | 'amber' | 'red' }> = {
  'on-track': { label: 'On track to qualify', color: '#187A3C', tone: 'green' },
  'nearly': { label: 'Nearly there', color: '#9A6A0B', tone: 'amber' },
  'at-risk': { label: 'At risk', color: TP_RED, tone: 'red' },
}
const STATUS: Record<PesspnStatus, { icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; color: string }> = {
  met: { icon: CheckCircle, color: '#187A3C' },
  progress: { icon: CircleDashed, color: '#9A6A0B' },
  gap: { icon: Circle, color: TP_RED },
}

function ScoreRing({ score, verdict, size = 76 }: { score: number; verdict: PesspnVerdict; size?: number }) {
  const r = size / 2 - 7, c = 2 * Math.PI * r, off = c * (1 - score / 100)
  const col = VERDICT[verdict].color
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size, flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EFEBE6" strokeWidth="7" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth="7" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x={size / 2} y={size / 2 + 1} textAnchor="middle" fontSize={size * 0.26} fontWeight="900" fill={TP_DARK}>{score}</text>
      <text x={size / 2} y={size / 2 + size * 0.2} textAnchor="middle" fontSize={size * 0.12} fontWeight="700" fill="#8A847E">/ 100</text>
    </svg>
  )
}

// ─── Per-school readiness card (reused in Schools detail) ────────────────────
export function SchoolReadinessCard({ schoolId }: { schoolId: string }) {
  const { SCHOOL_READINESS, PESSPN_CRITERIA } = useImpact().data
  const rd = SCHOOL_READINESS[schoolId]
  if (!rd) return null
  const v = VERDICT[rd.verdict]
  return (
    <Card>
      <SectionTitle sub="Indicative readiness for the Partnerships Network (operational from January 2027)">
        <Landmark size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />PE &amp; School Sport Partnerships Network — readiness
      </SectionTitle>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', background: '#F7F5F2', borderRadius: 12, padding: '14px 16px', marginBottom: 12, flexWrap: 'wrap' }}>
        <ScoreRing score={rd.score} verdict={rd.verdict} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <Pill tone={v.tone}>{v.label.toUpperCase()}</Pill>
          <div style={{ fontSize: 12.5, color: '#5B554F', marginTop: 8, lineHeight: 1.55 }}>{rd.summary}</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
        {PESSPN_CRITERIA.map(cr => {
          const it = rd.items[cr.id]
          const S = STATUS[it.status]
          const Icon = S.icon
          return (
            <div key={cr.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: '#F7F5F2', borderRadius: 10, padding: '10px 12px' }}>
              <Icon size={16} style={{ color: S.color, flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: TP_DARK }}>{cr.label}</div>
                <div style={{ fontSize: 11, color: '#6B6560', marginTop: 2, lineHeight: 1.4 }}>{it.note}</div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ─── HQ Sport Network tab ────────────────────────────────────────────────────
export default function SportNetworkTab() {
  const { brand, data } = useImpact()
  const { SCHOOLS, SCHOOL_READINESS, PESSPN_CRITERIA } = data
  const { content: N, updating, message, update } = useSportNetwork()
  const updatedLabel = new Date(N.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const scored = SCHOOLS.map(s => ({ s, rd: SCHOOL_READINESS[s.id] })).filter(x => x.rd)
  const counts = { 'on-track': 0, nearly: 0, 'at-risk': 0 } as Record<PesspnVerdict, number>
  scored.forEach(x => { counts[x.rd.verdict]++ })
  const avg = scored.length ? Math.round(scored.reduce((n, x) => n + x.rd.score, 0) / scored.length) : 0

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Hero */}
      <Card style={{ background: TP_DARK, border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: TP_RED }}>{N.hero.kicker}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: '#C9C4BE', fontWeight: 700 }}>Last updated: {updatedLabel} · source: GOV.UK</span>
            <button onClick={update} disabled={updating} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', color: TP_DARK, border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 11.5, fontWeight: 800, cursor: updating ? 'wait' : 'pointer' }}>
              <RefreshCw size={12} /> {updating ? 'Checking GOV.UK…' : 'Update'}
            </button>
          </div>
        </div>
        <div style={{ fontSize: 19, fontWeight: 900, color: '#fff', marginTop: 6 }}>{N.hero.title}</div>
        <div style={{ fontSize: 12.5, color: '#C9C4BE', marginTop: 5, maxWidth: 640 }}>
          {N.hero.body} {brand.org}’s registers, CPD and impact data are the evidence schools will need.
        </div>
        {message && <div style={{ fontSize: 11.5, color: '#fff', marginTop: 8, fontWeight: 700 }}>{message}</div>}
      </Card>

      {/* Verdict tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        {([
          [`${counts['on-track']}`, 'ON TRACK TO QUALIFY', '#187A3C'],
          [`${counts.nearly}`, 'NEARLY THERE', '#9A6A0B'],
          [`${counts['at-risk']}`, 'AT RISK', TP_RED],
          [`${avg}`, 'AVG READINESS SCORE', TP_DARK],
          [`${scored.length}`, 'SCHOOLS TRACKED', TP_DARK],
        ] as [string, string, string][]).map(([v, l, c]) => (
          <Card key={l} style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 25, fontWeight: 900, color: c }}>{v}</div>
            <div style={{ fontSize: 10.5, color: '#6B6560', marginTop: 2, fontWeight: 700 }}>{l}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        {/* Schools readiness table */}
        <Card>
          <SectionTitle sub="Every school’s indicative readiness — and the single biggest gap to close">School readiness</SectionTitle>
          {scored.length === 0 && <EmptyState compact icon={School} title="No schools tracked yet" sub="Each partner school's readiness for the new funding model is scored here from its registers, CPD, reach and impact evidence." />}
          <div style={{ display: 'grid', gap: 8 }}>
            {scored.map(({ s, rd }) => {
              const v = VERDICT[rd.verdict]
              const gap = PESSPN_CRITERIA.find(cr => rd.items[cr.id]?.status === 'gap')
              return (
                <div key={s.id} style={{ background: '#F7F5F2', borderRadius: 10, padding: '11px 13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: TP_DARK }}>
                      <School size={13} style={{ verticalAlign: '-2px', marginRight: 6, color: TP_RED }} />{s.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 80, background: '#EFEBE6', borderRadius: 999, height: 8 }}>
                        <div style={{ width: `${rd.score}%`, height: '100%', background: v.color, borderRadius: 999 }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 900, color: v.color, width: 26, textAlign: 'right' }}>{rd.score}</span>
                      <Pill tone={v.tone}>{v.label.toUpperCase()}</Pill>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#6B6560', marginTop: 5 }}>
                    {gap ? <>Next gap: <strong style={{ color: TP_DARK }}>{gap.label}</strong> — {rd.items[gap.id].note}</> : 'All criteria met or in progress — maintain momentum'}
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ fontSize: 11, color: '#8A847E', marginTop: 10, background: '#FDE8E8', borderRadius: 9, padding: '9px 11px' }}>
            <Info size={12} style={{ verticalAlign: '-2px', marginRight: 6, color: TP_RED }} />
            The common thread: unfunded schools score low on continuity. The fundraising module is the lever that moves them to “on track”.
          </div>
        </Card>

        {/* Timeline */}
        <Card>
          <SectionTitle sub="What happens when — the transition dates that matter">
            <CalendarClock size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Key dates
          </SectionTitle>
          <div style={{ display: 'grid', gap: 0 }}>
            {N.timeline.map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 11 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: t.done ? '#187A3C' : TP_RED, flexShrink: 0, marginTop: 3 }} />
                  {i < N.timeline.length - 1 && <div style={{ width: 2, flex: 1, background: '#E7E2DC', minHeight: 16 }} />}
                </div>
                <div style={{ paddingBottom: 12 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 900, color: t.done ? '#8A847E' : TP_DARK }}>{t.when}</div>
                  <div style={{ fontSize: 11.5, color: '#5B554F', marginTop: 1, lineHeight: 1.4 }}>{t.label}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Guidance hub + what's changing */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <SectionTitle sub="The latest official documents — kept in one place">
            <FileText size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Guidance & documents
          </SectionTitle>
          <div style={{ display: 'grid', gap: 8 }}>
            {N.guidance.map(g => (
              <a key={g.title} href={g.url} target="_blank" rel="noreferrer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, background: '#F7F5F2', borderRadius: 10, padding: '11px 13px', textDecoration: 'none' }}>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: TP_DARK }}>{g.title}</div>
                  <div style={{ fontSize: 10.5, color: '#8A847E', marginTop: 2 }}>{g.source} · {g.date}</div>
                </div>
                <ExternalLink size={14} style={{ color: TP_RED, flexShrink: 0 }} />
              </a>
            ))}
          </div>
        </Card>
        <Card>
          <SectionTitle sub="The change in plain English — for your school conversations">
            <ArrowUpRight size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />What’s changing
          </SectionTitle>
          <div style={{ display: 'grid', gap: 8 }}>
            {[
              ...N.keyFacts.map(f => [f.title, f.body]),
              [`The ${brand.org} angle`, 'Registers, CPD, priority-group reach and impact reporting are the evidence schools will need for the Network. Fundraising keeps unfunded schools in the game.'],
            ].map(([h, b]) => (
              <div key={h} style={{ background: '#F7F5F2', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: TP_DARK }}>{h}</div>
                <div style={{ fontSize: 11.5, color: '#5B554F', marginTop: 2, lineHeight: 1.5 }}>{b}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* PE & Sport Premium 2026/27 */}
      <Card>
        <SectionTitle sub="Allocations, payment dates and the spending return — from the 2026/27 conditions of grant">
          <PoundSterling size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />{N.premium.title}
        </SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8 }}>
          {N.premium.rows.map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, background: '#F7F5F2', borderRadius: 10, padding: '10px 12px', fontSize: 12 }}>
              <span style={{ color: '#6B6560', fontWeight: 700 }}>{k}</span>
              <span style={{ color: TP_DARK, fontWeight: 900, textAlign: 'right' }}>{v}</span>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ fontSize: 11, color: '#8A847E', lineHeight: 1.6 }}>
        <Pill tone="grey">INDICATIVE</Pill>&nbsp; {N.footnote}
        <div style={{ marginTop: 6 }}>
          Last updated {updatedLabel}. Source:{' '}
          {N.sources.map((s, i) => (
            <span key={s.url}>{i > 0 && ' · '}<a href={s.url} target="_blank" rel="noreferrer" style={{ color: TP_RED, fontWeight: 700 }}>{s.title}</a></span>
          ))}
        </div>
      </div>
    </div>
  )
}
