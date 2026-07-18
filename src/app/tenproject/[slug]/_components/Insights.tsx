'use client'

// HQ Insights — the "show this to a school / partner / funder" tab.
// Dependency-free charts (divs + one inline SVG) so nothing new to bundle.

import React from 'react'
import { TrendingUp, Users, Download, Sparkles, HeartHandshake } from 'lucide-react'
import { Card, SectionTitle, Pill } from './ui'
import { TP_RED, TP_DARK, INSIGHTS, FUNNEL } from '@/data/tenproject/demo-data'
import { openFunderDoc } from '../_lib/funder-docs'

const RED_SOFT = '#F0524F'

export default function Insights() {
  const maxTerm = Math.max(...INSIGHTS.termGrowth.map(t => t.children))
  const trend = INSIGHTS.weekendTrend
  const maxTrend = Math.max(...trend)
  const points = trend
    .map((v, i) => `${(i / (trend.length - 1)) * 300},${80 - (v / maxTrend) * 70}`)
    .join(' ')

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Headline tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        {INSIGHTS.headline.map(h => (
          <Card key={h.label} style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 25, fontWeight: 900, color: TP_RED }}>{h.value}</div>
            <div style={{ fontSize: 11, color: '#6B6560', marginTop: 2, fontWeight: 600 }}>{h.label}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Term growth */}
        <Card>
          <SectionTitle sub="Children reached per week in curriculum time, by term">
            <TrendingUp size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Participation growth
          </SectionTitle>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 150, padding: '0 6px' }}>
            {INSIGHTS.termGrowth.map((t, i) => (
              <div key={t.term} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: TP_DARK, marginBottom: 4 }}>{t.children.toLocaleString()}</div>
                <div style={{ height: (t.children / maxTerm) * 105, background: i === INSIGHTS.termGrowth.length - 1 ? TP_RED : '#E8B4B3', borderRadius: '6px 6px 0 0' }} />
                <div style={{ fontSize: 10.5, color: '#8A847E', marginTop: 5, fontWeight: 700 }}>{t.term}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: '#6B6560', marginTop: 10 }}>
            3.3× growth in five terms — every figure backed by named-child registers, not estimates.
          </div>
        </Card>

        {/* Weekend trend */}
        <Card>
          <SectionTitle sub="Family visits to weekend sessions, week by week this term">
            <Users size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Weekend attendance trend
          </SectionTitle>
          <svg viewBox="0 0 300 90" style={{ width: '100%', height: 150 }} preserveAspectRatio="none">
            <polyline points={`0,80 ${points} 300,80`} fill="#FDE8E8" stroke="none" />
            <polyline points={points} fill="none" stroke={TP_RED} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {trend.map((v, i) => (
              <circle key={i} cx={(i / (trend.length - 1)) * 300} cy={80 - (v / maxTrend) * 70} r="3" fill={TP_RED} />
            ))}
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: '#8A847E', fontWeight: 700 }}>
            <span>Week 1 · {trend[0]} visits</span>
            <span>Week 10 · {trend[trend.length - 1]} visits</span>
          </div>
          <div style={{ fontSize: 11.5, color: '#6B6560', marginTop: 8 }}>
            Attendance climbs through the term as school families convert — the QR gate register captures it automatically.
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Conversion by school + funnel */}
        <Card>
          <SectionTitle sub="Of the children reached at each school, the share whose families now attend weekends">
            School → weekend conversion
          </SectionTitle>
          <div style={{ display: 'grid', gap: 10 }}>
            {INSIGHTS.conversionBySchool.map(s => (
              <div key={s.school}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                  <span style={{ fontWeight: 700, color: TP_DARK }}>{s.school}</span>
                  <span style={{ color: '#6B6560', fontWeight: 700 }}>{s.pct > 0 ? `${s.pct}%` : 'starts Sept'}</span>
                </div>
                <div style={{ background: '#EFEBE6', borderRadius: 999, height: 10 }}>
                  <div style={{ width: `${s.pct}%`, height: '100%', background: TP_RED, borderRadius: 999 }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #F0EBE5', marginTop: 14, paddingTop: 12 }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, color: TP_DARK, marginBottom: 8 }}>Whole-programme funnel</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {FUNNEL.map(f => (
                <div key={f.stage} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ background: '#FDE8E8', borderRadius: 8, padding: '8px 2px' }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: TP_RED }}>{f.n}</div>
                    <div style={{ fontSize: 8.5, color: '#6B6560', fontWeight: 700, lineHeight: 1.25, marginTop: 2 }}>{f.stage}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Impact survey */}
        <Card>
          <SectionTitle sub="% of surveyed families citing each area — Ten Project’s own impact taxonomy">
            <HeartHandshake size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />What families say it improves
          </SectionTitle>
          <div style={{ display: 'grid', gap: 6 }}>
            {INSIGHTS.impactSurvey.map(a => (
              <div key={a.area} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 118, fontSize: 11, fontWeight: 700, color: TP_DARK, flexShrink: 0 }}>{a.area}</div>
                <div style={{ flex: 1, background: '#EFEBE6', borderRadius: 999, height: 9 }}>
                  <div style={{ width: `${a.pct}%`, height: '100%', background: RED_SOFT, borderRadius: 999 }} />
                </div>
                <div style={{ width: 32, fontSize: 11, fontWeight: 800, color: '#6B6560', textAlign: 'right' }}>{a.pct}%</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Reach & inclusion + export */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap' }}>
            {[
              [INSIGHTS.inclusion.freeSessions, 'of sessions free to families'],
              [INSIGHTS.inclusion.girls, 'participants are girls'],
              [`${INSIGHTS.inclusion.inclusiveVenuePct}%`, 'venues run inclusive sessions'],
              [`${INSIGHTS.inclusion.boroughs}`, 'boroughs and growing'],
            ].map(([v, l]) => (
              <div key={l as string}>
                <div style={{ fontSize: 19, fontWeight: 900, color: TP_DARK }}>{v}</div>
                <div style={{ fontSize: 11, color: '#6B6560', fontWeight: 600 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => openFunderDoc('funder-pack')} style={{ background: TP_DARK, color: '#fff', border: 'none', borderRadius: 9, padding: '10px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <Download size={14} /> Export funder pack (PDF)
            </button>
            <button onClick={() => openFunderDoc('bid-narrative')} style={{ background: TP_RED, color: '#fff', border: 'none', borderRadius: 9, padding: '10px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <Sparkles size={14} /> AI narrative for a bid
            </button>
          </div>
        </div>
        <div style={{ fontSize: 11, color: '#8A847E', marginTop: 10 }}>
          <Pill tone="grey">DEMO DATA</Pill>&nbsp; Live version draws every number from registers, QR check-ins and surveys — one click from here to a branded PDF for any school, borough or trust.
        </div>
      </Card>
    </div>
  )
}
