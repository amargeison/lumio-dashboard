'use client'

// HQ Insights — the headline "show this to a school / partner / funder" view.
// Dependency-free charts (divs + inline SVG) so nothing new to bundle.

import React from 'react'
import { TrendingUp, Users, Download, Sparkles, HeartHandshake, MapPin, ShieldCheck, PieChart, Repeat, Coins, Quote } from 'lucide-react'
import { Card, SectionTitle, Pill } from './ui'
import { TP_RED, TP_DARK, INSIGHTS, FUNNEL } from '@/data/tenproject/demo-data'
import { openFunderDoc } from '../_lib/funder-docs'

const RED_SOFT = '#F0524F'
const RED_TINT = '#E8B4B3'

function Donut({ value, label, color = TP_RED }: { value: number; label: string; color?: string }) {
  const r = 26, c = 2 * Math.PI * r, off = c * (1 - value / 100)
  return (
    <div style={{ textAlign: 'center' }}>
      <svg viewBox="0 0 64 64" style={{ width: 64, height: 64 }}>
        <circle cx="32" cy="32" r={r} fill="none" stroke="#EFEBE6" strokeWidth="8" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 32 32)" />
        <text x="32" y="37" textAnchor="middle" fontSize="15" fontWeight="900" fill={TP_DARK}>{value}%</text>
      </svg>
      <div style={{ fontSize: 10, color: '#6B6560', fontWeight: 700, marginTop: 2 }}>{label}</div>
    </div>
  )
}

function BarRow({ label, pct, width = 118, color = RED_SOFT, suffix = '%' }: { label: string; pct: number; width?: number; color?: string; suffix?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width, fontSize: 11, fontWeight: 700, color: TP_DARK, flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, background: '#EFEBE6', borderRadius: 999, height: 9 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999 }} />
      </div>
      <div style={{ width: 34, fontSize: 11, fontWeight: 800, color: '#6B6560', textAlign: 'right' }}>{pct}{suffix}</div>
    </div>
  )
}

export default function Insights() {
  const I = INSIGHTS
  const maxTerm = Math.max(...I.termGrowth.map(t => t.children))
  const trend = I.weekendTrend
  const maxTrend = Math.max(...trend)
  const points = trend.map((v, i) => `${(i / (trend.length - 1)) * 300},${80 - (v / maxTrend) * 70}`).join(' ')
  const maxMonth = Math.max(...I.monthlyReach.map(m => m.n))
  const monthPts = I.monthlyReach.map((m, i) => `${(i / (I.monthlyReach.length - 1)) * 300},${70 - (m.n / maxMonth) * 60}`).join(' ')

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Hero banner */}
      <Card style={{ background: TP_DARK, border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: TP_RED }}>PROGRAMME INSIGHTS · 2025/26</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginTop: 6 }}>Every number, evidenced from named-child registers</div>
            <div style={{ fontSize: 12.5, color: '#C9C4BE', marginTop: 4, maxWidth: 560 }}>
              Participation, conversion, demographics, wellbeing, compliance and social value — the complete picture for schools, boroughs and funders.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => openFunderDoc('funder-pack')} style={{ background: '#fff', color: TP_DARK, border: 'none', borderRadius: 9, padding: '10px 14px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <Download size={14} /> Export funder pack
            </button>
            <button onClick={() => openFunderDoc('bid-narrative')} style={{ background: TP_RED, color: '#fff', border: 'none', borderRadius: 9, padding: '10px 14px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <Sparkles size={14} /> AI bid narrative
            </button>
          </div>
        </div>
      </Card>

      {/* Headline tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        {I.headline.map(h => (
          <Card key={h.label} style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 25, fontWeight: 900, color: TP_RED }}>{h.value}</div>
            <div style={{ fontSize: 11, color: '#6B6560', marginTop: 2, fontWeight: 600 }}>{h.label}</div>
          </Card>
        ))}
      </div>

      {/* Reach over the year + term growth */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16 }}>
        <Card>
          <SectionTitle sub="Children reached per month across the academic year — from registers, not estimates">
            <TrendingUp size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Reach across the year
          </SectionTitle>
          <svg viewBox="0 0 300 78" style={{ width: '100%', height: 150 }} preserveAspectRatio="none">
            <polyline points={`0,70 ${monthPts} 300,70`} fill="#FDE8E8" stroke="none" />
            <polyline points={monthPts} fill="none" stroke={TP_RED} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {I.monthlyReach.map((m, i) => (
              <circle key={m.m} cx={(i / (I.monthlyReach.length - 1)) * 300} cy={70 - (m.n / maxMonth) * 60} r="2.6" fill={TP_RED} />
            ))}
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: '#8A847E', fontWeight: 700, marginTop: 2 }}>
            {I.monthlyReach.map(m => <span key={m.m}>{m.m}</span>)}
          </div>
          <div style={{ fontSize: 11.5, color: '#6B6560', marginTop: 8 }}>Peak 2,140/week in July — the December dip is the school holidays, not attrition.</div>
        </Card>
        <Card>
          <SectionTitle sub="Per week in curriculum time, by term">Participation growth</SectionTitle>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 130, padding: '0 4px' }}>
            {I.termGrowth.map((t, i) => (
              <div key={t.term} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: TP_DARK, marginBottom: 3 }}>{t.children.toLocaleString()}</div>
                <div style={{ height: (t.children / maxTerm) * 92, background: i === I.termGrowth.length - 1 ? TP_RED : RED_TINT, borderRadius: '5px 5px 0 0' }} />
                <div style={{ fontSize: 10, color: '#8A847E', marginTop: 4, fontWeight: 700 }}>{t.term}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: '#6B6560', marginTop: 8 }}>3.3× in five terms.</div>
        </Card>
      </div>

      {/* Weekend trend + conversion funnel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <SectionTitle sub="Family visits to weekend sessions, week by week this term">
            <Users size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Weekend attendance trend
          </SectionTitle>
          <svg viewBox="0 0 300 90" style={{ width: '100%', height: 140 }} preserveAspectRatio="none">
            <polyline points={`0,80 ${points} 300,80`} fill="#FDE8E8" stroke="none" />
            <polyline points={points} fill="none" stroke={TP_RED} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {trend.map((v, i) => <circle key={i} cx={(i / (trend.length - 1)) * 300} cy={80 - (v / maxTrend) * 70} r="3" fill={TP_RED} />)}
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: '#8A847E', fontWeight: 700 }}>
            <span>Week 1 · {trend[0]} visits</span><span>Week 10 · {trend[trend.length - 1]} visits</span>
          </div>
        </Card>
        <Card>
          <SectionTitle sub="School → weekend — the metric that matters. Where families are lost, and kept.">Conversion funnel</SectionTitle>
          <div style={{ display: 'grid', gap: 7 }}>
            {FUNNEL.map((f, i) => {
              const w = 100 - i * 17
              return (
                <div key={f.stage} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 128, fontSize: 11, fontWeight: 700, color: TP_DARK, flexShrink: 0 }}>{f.stage}</div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: `${w}%`, background: i === 0 ? TP_DARK : TP_RED, borderRadius: 6, height: 22, display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 900, color: '#fff' }}>{f.n}</span>
                    </div>
                    <span style={{ fontSize: 10.5, color: '#8A847E', fontWeight: 700 }}>{f.pct}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Retention cohorts + conversion by school */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <SectionTitle sub="% of converted families still attending, by weeks after first visit — retention is improving term on term">
            <Repeat size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Retention cohorts
          </SectionTitle>
          <svg viewBox="0 0 300 110" style={{ width: '100%', height: 150 }}>
            {[0, 25, 50, 75, 100].map(g => <line key={g} x1="0" x2="300" y1={100 - g} y2={100 - g} stroke="#F0EBE5" strokeWidth="1" />)}
            {I.retentionCohorts.map((c, ci) => {
              const xs = [0, 100, 220, 300]
              const ys = [c.w1, c.w4, c.w8, c.w10]
              const col = ci === 2 ? TP_RED : ci === 1 ? RED_SOFT : RED_TINT
              const pts = ys.map((y, i) => `${xs[i]},${100 - y}`).join(' ')
              return <polyline key={c.term} points={pts} fill="none" stroke={col} strokeWidth={ci === 2 ? 2.6 : 1.8} />
            })}
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: '#8A847E', fontWeight: 700 }}>
            <span>Wk 1</span><span>Wk 4</span><span>Wk 8</span><span>Wk 10</span>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
            {I.retentionCohorts.map((c, ci) => (
              <span key={c.term} style={{ fontSize: 10.5, fontWeight: 700, color: '#6B6560' }}>
                <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: ci === 2 ? TP_RED : ci === 1 ? RED_SOFT : RED_TINT, marginRight: 5, verticalAlign: '-1px' }} />{c.term} ({c.w10}% at wk10)
              </span>
            ))}
          </div>
        </Card>
        <Card>
          <SectionTitle sub="Of the children reached at each school, the share whose families now attend weekends">School → weekend conversion</SectionTitle>
          <div style={{ display: 'grid', gap: 12 }}>
            {I.conversionBySchool.map(s => (
              <div key={s.school}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                  <span style={{ fontWeight: 700, color: TP_DARK }}>{s.school}</span>
                  <span style={{ color: '#6B6560', fontWeight: 700 }}>{s.pct > 0 ? `${s.pct}%` : 'starts Sept'}</span>
                </div>
                <div style={{ background: '#EFEBE6', borderRadius: 999, height: 11 }}>
                  <div style={{ width: `${s.pct}%`, height: '100%', background: TP_RED, borderRadius: 999 }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: '#6B6560', marginTop: 12, background: '#F7F5F2', borderRadius: 9, padding: '9px 11px' }}>
            Willowbrook’s 26% is the benchmark — its recipe (early activation, one linked venue) is being rolled out.
          </div>
        </Card>
      </div>

      {/* Demographics + reach/inclusion */}
      <Card>
        <SectionTitle sub="Who the programme reaches — the equity story funders ask for">
          <PieChart size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Demographic reach
        </SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: '#8A847E', letterSpacing: 0.5, marginBottom: 8 }}>AGE SPLIT</div>
            <div style={{ display: 'grid', gap: 7 }}>{I.demographics.age.map(a => <BarRow key={a.label} label={a.label} pct={a.pct} width={44} />)}</div>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: '#8A847E', letterSpacing: 0.5, margin: '12px 0 8px' }}>GENDER</div>
            <div style={{ display: 'grid', gap: 7 }}>{I.demographics.gender.map(a => <BarRow key={a.label} label={a.label} pct={a.pct} width={110} color={TP_RED} />)}</div>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'center' }}>
            <Donut value={I.demographics.fsm} label="Free school meals" />
            <Donut value={I.demographics.sen} label="SEND" color={RED_SOFT} />
            <Donut value={I.demographics.ethnicMinority} label="Ethnic minority" />
            <Donut value={I.demographics.firstSport} label="First organised sport" color={RED_SOFT} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 14, borderTop: '1px solid #F0EBE5', paddingTop: 12 }}>
          {[[I.inclusion.freeSessions, 'sessions free to families'], [I.inclusion.girls, 'participants are girls'], [`${I.inclusion.inclusiveVenuePct}%`, 'venues run inclusive sessions'], [`${I.inclusion.boroughs}`, 'boroughs and growing']].map(([v, l]) => (
            <div key={l as string}><div style={{ fontSize: 19, fontWeight: 900, color: TP_DARK }}>{v}</div><div style={{ fontSize: 10.5, color: '#6B6560', fontWeight: 600 }}>{l}</div></div>
          ))}
        </div>
      </Card>

      {/* Wellbeing survey + boroughs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <SectionTitle sub="% of surveyed families citing each area — Ten Project’s own impact taxonomy">
            <HeartHandshake size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />What families say it improves
          </SectionTitle>
          <div style={{ display: 'grid', gap: 6 }}>{I.impactSurvey.map(a => <BarRow key={a.area} label={a.area} pct={a.pct} />)}</div>
        </Card>
        <Card>
          <SectionTitle sub="Where the programme runs — schools, children and community venues by borough">
            <MapPin size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Borough breakdown
          </SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead><tr style={{ textAlign: 'left', color: '#8A847E', fontSize: 10.5 }}>
              <th style={{ padding: '5px 4px' }}>Borough</th><th>Schools</th><th>Children</th><th>Venues</th>
            </tr></thead>
            <tbody>
              {I.boroughs.map(b => (
                <tr key={b.name} style={{ borderTop: '1px solid #F0EBE5' }}>
                  <td style={{ padding: '9px 4px', fontWeight: 800, color: TP_DARK }}>{b.name}</td>
                  <td style={{ fontWeight: 700 }}>{b.schools}</td>
                  <td style={{ color: TP_RED, fontWeight: 900 }}>{b.children.toLocaleString()}</td>
                  <td style={{ fontWeight: 700 }}>{b.venues}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize: 11.5, color: '#6B6560', marginTop: 10, background: '#F7F5F2', borderRadius: 9, padding: '9px 11px' }}>
            3 boroughs, 6 schools, 3 community venues — with a Brookhaven expansion enquiry in the pipeline.
          </div>
        </Card>
      </div>

      {/* Compliance + social value */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 16 }}>
        <Card>
          <SectionTitle sub="Safeguarding you can prove — every coach and TENOR tracked">
            <ShieldCheck size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Compliance & safeguarding
          </SectionTitle>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'space-around' }}>
            <Donut value={I.compliance.dbsValid} label="DBS valid" />
            <Donut value={I.compliance.safeguardingCurrent} label="Safeguarding current" color={RED_SOFT} />
            <Donut value={I.compliance.firstAidCurrent} label="First Aid current" />
            <Donut value={I.compliance.insured} label="Insured £5m" color={RED_SOFT} />
          </div>
        </Card>
        <Card>
          <SectionTitle sub="What the investment returns — the number that wins bids">
            <Coins size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Social value
          </SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
            {([
              [`£${I.socialValue.perChild}`, 'cost per child, per programme'],
              [`£${I.socialValue.svRatio}`, 'social value per £1 spent'],
              [I.socialValue.volunteerHours.toLocaleString(), 'TENOR volunteer hours / year'],
              [`${I.socialValue.clubReferrals}`, 'children referred to local clubs'],
            ] as [string, string][]).map(([v, l]) => (
              <div key={l} style={{ background: '#F7F5F2', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: TP_RED }}>{v}</div>
                <div style={{ fontSize: 10.5, color: '#6B6560', fontWeight: 600, marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: '#6B6560', marginTop: 12 }}>
            £4.70 back for every £1 — through raised activity, reduced inactivity risk, family wellbeing and volunteer contribution.
          </div>
        </Card>
      </div>

      {/* Quotes reel */}
      <Card>
        <SectionTitle sub="Straight from schools and families — publish-consented"><Quote size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />In their words</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {I.quotesReel.map((q, i) => (
            <div key={i} style={{ background: i === 0 ? '#FDE8E8' : '#F7F5F2', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 12.5, fontStyle: 'italic', color: TP_DARK, lineHeight: 1.55 }}>“{q.q}”</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: TP_RED, marginTop: 7 }}>— {q.who}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: '#8A847E', marginTop: 12 }}>
          <Pill tone="grey">DEMO DATA</Pill>&nbsp; Every figure on this page draws from registers, QR check-ins and surveys — one click to a branded PDF for any school, borough or trust.
        </div>
      </Card>
    </div>
  )
}
