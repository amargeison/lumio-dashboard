'use client'

// PE & School Sport Partnerships Network (PESSPN) — HQ one-stop shop, plus the
// per-school readiness card reused inside the Schools detail view.
// Policy facts come from src/data/impact/sport-network.ts (verified baseline)
// or the stored copy the Update button refreshes from gov.uk / DfE / YST.
// Readiness scores are an indicative framework, not DfE criteria.

import React from 'react'
import { Landmark, CheckCircle, CircleDashed, Circle, CalendarClock, FileText, ExternalLink, ArrowUpRight, School, RefreshCw, PoundSterling } from 'lucide-react'
import { Card, SectionTitle, Pill, EmptyState } from './ui'
import { TP_RED, TP_DARK, type PesspnVerdict, type PesspnStatus } from '@/data/tenproject/demo-data'
import { useImpact } from './ImpactDataContext'
import { useSportNetwork } from '@/lib/impact/use-sport-network'
import { CpdPanel } from './CpdPanel'
import { SPORT_NETWORK_DISCLAIMER, SPORT_NETWORK_SOURCE_NOTE } from '@/data/impact/sport-network'

// The page an item was checked against, so anyone can read it for themselves.
function SourceLink({ url, light }: { url?: string; light?: boolean }) {
  if (!url) return null
  return <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: 10.5, fontWeight: 700, color: light ? '#fff' : TP_RED, marginLeft: 6, whiteSpace: 'nowrap' }}>Source</a>
}

const VERDICT: Record<PesspnVerdict, { label: string; color: string; tone: 'green' | 'amber' | 'red' | 'grey' }> = {
  'on-track': { label: 'On track to qualify', color: '#187A3C', tone: 'green' },
  'nearly': { label: 'Nearly there', color: '#9A6A0B', tone: 'amber' },
  'at-risk': { label: 'At risk', color: TP_RED, tone: 'red' },
  'needs-evidence': { label: 'Not enough evidence yet', color: '#8A847E', tone: 'grey' },
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
      <SectionTitle sub="Indicative readiness for the Partnerships Network">
        <Landmark size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />PE &amp; School Sport Partnerships Network — readiness
      </SectionTitle>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', background: '#F7F5F2', borderRadius: 12, padding: '14px 16px', marginBottom: 12, flexWrap: 'wrap' }}>
        {rd.verdict !== 'needs-evidence' && <ScoreRing score={rd.score} verdict={rd.verdict} />}
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
                {it.status !== 'met' && <div style={{ fontSize: 11, color: TP_DARK, marginTop: 3, lineHeight: 1.4, fontWeight: 700 }}>{it.action}</div>}
              </div>
            </div>
          )
        })}
      </div>
      <CpdPanel schoolId={schoolId} />
    </Card>
  )
}

// ─── HQ Sport Network tab ────────────────────────────────────────────────────
export default function SportNetworkTab() {
  const { brand, data, org } = useImpact()
  const { SCHOOLS, SCHOOL_READINESS, PESSPN_CRITERIA } = data
  const { content: N, updating, message, update } = useSportNetwork()
  const updatedLabel = new Date(N.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const scored = SCHOOLS.map(s => ({ s, rd: SCHOOL_READINESS[s.id] })).filter(x => x.rd)
  const counts = { 'on-track': 0, nearly: 0, 'at-risk': 0, 'needs-evidence': 0 } as Record<PesspnVerdict, number>
  scored.forEach(x => { counts[x.rd.verdict]++ })
  const banded = scored.filter(x => x.rd.verdict !== 'needs-evidence')
  const avg = banded.length ? Math.round(banded.reduce((n, x) => n + x.rd.score, 0) / banded.length) : 0

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Hero */}
      <Card style={{ background: TP_DARK, border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: TP_RED }}>{N.hero.kicker}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: '#C9C4BE', fontWeight: 700 }}>Last updated: {updatedLabel} · source: GOV.UK</span>
            {org?.canEdit && <button onClick={() => update()} disabled={updating} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', color: TP_DARK, border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 11.5, fontWeight: 800, cursor: updating ? 'wait' : 'pointer' }}>
              <RefreshCw size={12} /> {updating ? 'Checking GOV.UK…' : 'Update'}
            </button>}
          </div>
        </div>
        <div style={{ fontSize: 19, fontWeight: 900, color: '#fff', marginTop: 6 }}>{N.hero.title}</div>
        <div style={{ fontSize: 12.5, color: '#C9C4BE', marginTop: 5, maxWidth: 640 }}>
          {N.hero.body}<SourceLink url={N.hero.url} light /> {brand.org}’s registers, CPD and impact data are the evidence schools will need.
        </div>
        {message && <div style={{ fontSize: 11.5, color: '#fff', marginTop: 8, fontWeight: 700 }}>{message}</div>}
      </Card>

      {/* Verdict tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        {([
          [`${counts['on-track']}`, 'ON TRACK TO QUALIFY', '#187A3C'],
          [`${counts.nearly}`, 'NEARLY THERE', '#9A6A0B'],
          [`${counts['at-risk']}`, 'AT RISK', TP_RED],
          [`${counts['needs-evidence']}`, 'NEEDS EVIDENCE', '#8A847E'],
          [banded.length ? `${avg}` : '—', 'AVG READINESS SCORE', TP_DARK],
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
          {scored.length === 0 && <EmptyState compact icon={School} title="No schools added yet" sub="Add your schools and each one is scored automatically from what you record: registers and attendance, children reached, programme status and funding, family contact, feedback and staff CPD. Anything not recorded yet shows what to add." />}
          <div style={{ display: 'grid', gap: 8 }}>
            {scored.map(({ s, rd }) => {
              const v = VERDICT[rd.verdict]
              const gap = PESSPN_CRITERIA.find(cr => cr.id === rd.biggestGap)
              return (
                <div key={s.id} style={{ background: '#F7F5F2', borderRadius: 10, padding: '11px 13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: TP_DARK }}>
                      <School size={13} style={{ verticalAlign: '-2px', marginRight: 6, color: TP_RED }} />{s.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {rd.verdict !== 'needs-evidence' && <>
                        <div style={{ width: 80, background: '#EFEBE6', borderRadius: 999, height: 8 }}>
                          <div style={{ width: `${rd.score}%`, height: '100%', background: v.color, borderRadius: 999 }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 900, color: v.color, width: 26, textAlign: 'right' }}>{rd.score}</span>
                      </>}
                      <Pill tone={v.tone}>{v.label.toUpperCase()}</Pill>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#6B6560', marginTop: 5 }}>
                    {gap ? <>Biggest gap: <strong style={{ color: TP_DARK }}>{gap.label}</strong> — {rd.items[gap.id].note}. {rd.items[gap.id].action}</> : 'All eight areas evidenced and on track — keep it up to date'}
                  </div>
                </div>
              )
            })}
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
                  <div style={{ fontSize: 11.5, fontWeight: 900, color: t.done ? '#8A847E' : TP_DARK }}>
                    {t.when}{t.status === 'expected' && <>&nbsp;<Pill tone="amber">EXPECTED</Pill></>}{t.status === 'not_announced' && <>&nbsp;<Pill tone="grey">NOT YET ANNOUNCED</Pill></>}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#5B554F', marginTop: 1, lineHeight: 1.4 }}>{t.label}{t.saidBy && ` (${t.saidBy})`}<SourceLink url={t.url} /></div>
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
              ...N.keyFacts.map(f => ({ h: f.title, b: f.saidBy ? `${f.body} (${f.saidBy})` : f.body, urls: f.urls ?? (f.url ? [f.url] : []), expected: f.status === 'expected' })),
              { h: `The ${brand.org} angle`, b: 'Registers, CPD, priority-group reach and impact reporting are the evidence schools will need for the Network. Fundraising keeps unfunded schools in the game.', urls: [] as string[], expected: false },
            ].map(({ h, b, urls, expected }) => (
              <div key={h} style={{ background: '#F7F5F2', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: TP_DARK }}>{h}{expected && <>&nbsp;<Pill tone="amber">EXPECTED</Pill></>}</div>
                <div style={{ fontSize: 11.5, color: '#5B554F', marginTop: 2, lineHeight: 1.5 }}>{b}{urls.map(u => <SourceLink key={u} url={u} />)}</div>
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
          {N.premium.rows.map(([k, v], i) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, background: '#F7F5F2', borderRadius: 10, padding: '10px 12px', fontSize: 12 }}>
              <span style={{ color: '#6B6560', fontWeight: 700 }}>{k}</span>
              <span style={{ color: TP_DARK, fontWeight: 900, textAlign: 'right' }}>{v}<SourceLink url={N.premium.urls?.[i]} /></span>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ fontSize: 11, color: '#8A847E', lineHeight: 1.6 }}>
        <Pill tone="grey">INDICATIVE</Pill>&nbsp; {SPORT_NETWORK_DISCLAIMER}
        <div style={{ marginTop: 6 }}>{SPORT_NETWORK_SOURCE_NOTE}</div>
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
