'use client'

// School Insights — the governor/funder-facing dashboard a school can screen-
// share or export. Built to win Sports Premium renewal conversations.

import React from 'react'
import { TrendingUp, Award, HeartHandshake, Download, Share2, GraduationCap, Sparkles, Quote, BarChart2, ArrowUpRight } from 'lucide-react'
import { Card, SectionTitle, Pill } from './ui'
import { TP_RED, TP_DARK, SCHOOL_INSIGHTS } from '@/data/tenproject/demo-data'
import { openFunderDoc } from '../_lib/funder-docs'

const RED_SOFT = '#F0524F'
const RED_TINT = '#E8B4B3'

export default function SchoolInsights() {
  const S = SCHOOL_INSIGHTS
  const maxWeek = Math.max(...S.weeklyAttendance)

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Hero */}
      <Card style={{ background: TP_DARK, border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: TP_RED }}>{S.school.toUpperCase()} · IMPACT DASHBOARD</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginTop: 6 }}>Your Ten Project results — {S.term}</div>
            <div style={{ fontSize: 12.5, color: '#C9C4BE', marginTop: 4, maxWidth: 560 }}>
              Everything you need for governors, sponsors and your Sports Premium return — evidenced from digital registers, not estimates.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => openFunderDoc('governor-pack')} style={{ background: TP_RED, color: '#fff', border: 'none', borderRadius: 9, padding: '10px 14px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <Download size={14} /> Governor pack (PDF)
            </button>
            <button onClick={() => openFunderDoc('newsletter-snippet')} style={{ background: '#fff', color: TP_DARK, border: 'none', borderRadius: 9, padding: '10px 14px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <Share2 size={14} /> Newsletter snippet
            </button>
          </div>
        </div>
      </Card>

      {/* Headline tiles with sub-lines */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
        {S.headline.map(h => (
          <Card key={h.label} style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: TP_RED }}>{h.value}</div>
            <div style={{ fontSize: 11.5, color: TP_DARK, marginTop: 2, fontWeight: 700 }}>{h.label}</div>
            <div style={{ fontSize: 10.5, color: '#8A847E', marginTop: 2 }}>{h.sub}</div>
          </Card>
        ))}
      </div>

      {/* Attendance + skill growth */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 16 }}>
        <Card>
          <SectionTitle sub="% attendance by week — held above 90% all term">
            <TrendingUp size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Weekly attendance
          </SectionTitle>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
            {S.weeklyAttendance.map((v, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ height: (v / maxWeek) * 96, background: i === 9 ? TP_RED : RED_TINT, borderRadius: '4px 4px 0 0' }} title={`${v}%`} />
                <div style={{ fontSize: 9, color: '#8A847E', marginTop: 3, fontWeight: 700 }}>W{i + 1}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: '#6B6560', marginTop: 8 }}>Week 10 (the Festival) was the best-attended session of the year.</div>
        </Card>
        <Card>
          <SectionTitle sub="% of children ‘secure’ in each skill — start of term vs end. This is the learning, measured.">
            <Award size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Skill growth over 10 weeks
          </SectionTitle>
          <div style={{ display: 'grid', gap: 9 }}>
            {S.skillGrowth.map(s => (
              <div key={s.skill}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                  <span style={{ fontWeight: 700, color: TP_DARK }}>{s.skill}</span>
                  <span style={{ fontWeight: 800, color: TP_RED }}>{s.start}% → {s.end}%</span>
                </div>
                <div style={{ background: '#EFEBE6', borderRadius: 999, height: 10, position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 0, width: `${s.start}%`, height: '100%', background: RED_TINT, borderRadius: 999 }} />
                  <div style={{ position: 'absolute', left: 0, width: `${s.end}%`, height: '100%', background: 'transparent', borderRight: `2px solid ${TP_RED}`, borderRadius: 999 }} />
                  <div style={{ position: 'absolute', left: `${s.start}%`, width: `${s.end - s.start}%`, height: '100%', background: TP_RED, opacity: 0.85, borderRadius: 999 }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Year groups + wellbeing */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 16 }}>
        <Card>
          <SectionTitle sub="Participation, attendance and average stickers by year group">Year groups</SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead><tr style={{ textAlign: 'left', color: '#8A847E', fontSize: 10.5 }}>
              <th style={{ padding: '5px 4px' }}>Year</th><th>Children</th><th>Attendance</th><th>Avg stickers</th>
            </tr></thead>
            <tbody>
              {S.yearGroups.map(y => (
                <tr key={y.year} style={{ borderTop: '1px solid #F0EBE5' }}>
                  <td style={{ padding: '9px 4px', fontWeight: 800, color: TP_DARK }}>{y.year}</td>
                  <td style={{ color: TP_RED, fontWeight: 900 }}>{y.children}</td>
                  <td style={{ fontWeight: 700 }}>{y.attendance}%</td>
                  <td style={{ fontWeight: 700 }}>{y.stickers} / 6</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card>
          <SectionTitle sub="Teacher-rated — % of children showing improvement. The whole-child case for the programme.">
            <HeartHandshake size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Wellbeing & behaviour
          </SectionTitle>
          <div style={{ display: 'grid', gap: 7 }}>
            {S.wellbeing.map(w => (
              <div key={w.area} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 168, fontSize: 11, fontWeight: 700, color: TP_DARK, flexShrink: 0 }}>{w.area}</div>
                <div style={{ flex: 1, background: '#EFEBE6', borderRadius: 999, height: 9 }}>
                  <div style={{ width: `${w.pct}%`, height: '100%', background: RED_SOFT, borderRadius: 999 }} />
                </div>
                <div style={{ width: 32, fontSize: 11, fontWeight: 800, color: '#6B6560', textAlign: 'right' }}>{w.pct}%</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* How you compare — benchmark panel (distinct from the operational page) */}
      <Card>
        <SectionTitle sub="Your school against the Ten Project average and the national baseline — context governors ask for">
          <BarChart2 size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />How your school compares
        </SectionTitle>
        <div style={{ display: 'grid', gap: 12 }}>
          {S.benchmarks.map(b => {
            const max = Math.max(b.you, b.programme, b.national, 1)
            const rows: [string, number, string][] = [
              ['Your school', b.you, TP_RED],
              ['Ten Project avg', b.programme, RED_SOFT],
              ['National', b.national, '#C9C4BE'],
            ]
            return (
              <div key={b.metric}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                  <span style={{ fontWeight: 800, color: TP_DARK }}>{b.metric}</span>
                  <span style={{ fontSize: 10.5, color: '#8A847E' }}>{b.note}</span>
                </div>
                <div style={{ display: 'grid', gap: 4 }}>
                  {rows.map(([lbl, val, col]) => (
                    <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 96, fontSize: 10.5, color: '#6B6560', fontWeight: 700, flexShrink: 0 }}>{lbl}</div>
                      <div style={{ flex: 1, background: '#EFEBE6', borderRadius: 999, height: 12 }}>
                        <div style={{ width: `${(val / max) * 100}%`, height: '100%', background: col, borderRadius: 999 }} />
                      </div>
                      <div style={{ width: 34, fontSize: 11, fontWeight: 800, color: TP_DARK, textAlign: 'right' }}>{val}{b.unit}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 14, background: '#FDE8E8', borderRadius: 12, padding: '14px 16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <ArrowUpRight size={26} style={{ color: TP_RED, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: TP_DARK }}>
              Distance travelled: {S.distanceTravelled.start}% → {S.distanceTravelled.end}%
            </div>
            <div style={{ fontSize: 12, color: '#5B554F', marginTop: 2 }}>
              {S.distanceTravelled.label} — doubled over the ten weeks, and now well above the national {S.distanceTravelled.start}%.
            </div>
          </div>
        </div>
      </Card>

      {/* Sports Premium value */}
      <Card>
        <SectionTitle sub="How this maps to your PE & Sport Premium return — copy straight into your published statement">
          <GraduationCap size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Sports Premium value
        </SectionTitle>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 14 }}>
          <div><div style={{ fontSize: 22, fontWeight: 900, color: TP_RED }}>£{S.premiumSpend.programmeCost.toLocaleString()}</div><div style={{ fontSize: 10.5, color: '#6B6560', fontWeight: 600 }}>programme cost</div></div>
          <div><div style={{ fontSize: 22, fontWeight: 900, color: TP_RED }}>£{S.premiumSpend.perChild}</div><div style={{ fontSize: 10.5, color: '#6B6560', fontWeight: 600 }}>per child, 10 weeks</div></div>
          <div><div style={{ fontSize: 22, fontWeight: 900, color: TP_RED }}>{S.premiumSpend.outcomesHit.length}/5</div><div style={{ fontSize: 10.5, color: '#6B6560', fontWeight: 600 }}>Premium key indicators hit</div></div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {S.premiumSpend.outcomesHit.map(o => <Pill key={o} tone="green">✓ {o}</Pill>)}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 10 }}>
          {S.curriculum.map(c => <Pill key={c} tone="grey">{c}</Pill>)}
        </div>
      </Card>

      {/* Quotes */}
      <Card>
        <SectionTitle sub="From your teachers and families — publish-consented"><Quote size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />In their words</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {S.quotes.map((q, i) => (
            <div key={i} style={{ background: i === 0 ? '#FDE8E8' : '#F7F5F2', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 12.5, fontStyle: 'italic', color: TP_DARK, lineHeight: 1.55 }}>“{q.q}”</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: TP_RED, marginTop: 7 }}>— {q.who}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: '#8A847E', marginTop: 12 }}>
          <Pill tone="grey">DEMO DATA</Pill>&nbsp; The live dashboard updates as the programme runs — governors can be given read-only access, and every panel exports to your branded governor pack.
        </div>
      </Card>
    </div>
  )
}
