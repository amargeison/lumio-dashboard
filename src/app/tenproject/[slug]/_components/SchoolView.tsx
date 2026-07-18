'use client'

import React, { useState } from 'react'
import { Sparkles, Calendar, PoundSterling, Share2, CheckCircle, X, BarChart3, Download, Award, Users } from 'lucide-react'
import { Card, SectionTitle, Pill, Thermometer } from './ui'
import UpcomingCalendar from './UpcomingCalendar'
import { TP_RED, TP_DARK, CAMPAIGN, FUND_EVENTS, AI_EVENT_PACK, SCHOOL_STATS } from '@/data/tenproject/demo-data'

const EVENT_TONE: Record<string, 'green' | 'red' | 'grey'> = {
  complete: 'green',
  live: 'red',
  planned: 'grey',
}

export default function SchoolView() {
  const [showPack, setShowPack] = useState(false)
  const [tab, setTab] = useState<'fundraising' | 'programme'>('programme')
  const maxWeekly = Math.max(...SCHOOL_STATS.weeklyAttendance)
  const maxYear = Math.max(...SCHOOL_STATS.yearGroups.map(y => y.children))

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8 }}>
        {([
          { id: 'programme' as const, label: 'Our programme', icon: BarChart3 },
          { id: 'fundraising' as const, label: 'Fundraising', icon: PoundSterling },
        ]).map(t => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: active ? TP_DARK : '#fff', color: active ? '#fff' : TP_DARK, border: '1px solid #E7E2DC', borderRadius: 10, padding: '9px 16px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>
              <Icon size={14} /> {t.label}
            </button>
          )
        })}
      </div>

      {/* ── OUR PROGRAMME (results to share with governors / sponsors / parents) ── */}
      {tab === 'programme' && (<>
        <Card style={{ background: TP_DARK, border: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>Your Ten Project results — {SCHOOL_STATS.term}</div>
              <div style={{ color: '#C9C4BE', fontSize: 12.5, marginTop: 4 }}>
                Evidence for governors, sponsors and parents — and the case for funding 2026/27.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button style={{ background: TP_RED, color: '#fff', border: 'none', borderRadius: 9, padding: '9px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <Download size={13} /> Governor pack (PDF)
              </button>
              <button style={{ background: '#fff', color: TP_DARK, border: 'none', borderRadius: 9, padding: '9px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <Share2 size={13} /> Parent newsletter snippet
              </button>
            </div>
          </div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
          {SCHOOL_STATS.headline.map(h => (
            <Card key={h.label} style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: TP_RED }}>{h.value}</div>
              <div style={{ fontSize: 11, color: '#6B6560', marginTop: 2, fontWeight: 600 }}>{h.label}</div>
            </Card>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card>
            <SectionTitle sub="% attendance by week — from the digital registers, not estimates">Weekly attendance</SectionTitle>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 110 }}>
              {SCHOOL_STATS.weeklyAttendance.map((v, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ height: (v / maxWeekly) * 88, background: i === 9 ? TP_RED : '#E8B4B3', borderRadius: '4px 4px 0 0' }} title={`${v}%`} />
                  <div style={{ fontSize: 9, color: '#8A847E', marginTop: 3, fontWeight: 700 }}>W{i + 1}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11.5, color: '#6B6560', marginTop: 8 }}>
              Attendance held above 90% all term — week 10 (the Festival) was the best-attended session of the year.
            </div>
          </Card>
          <Card>
            <SectionTitle sub="Participation by year group + skills earned across the six booklet areas">Who took part & what they learnt</SectionTitle>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              {SCHOOL_STATS.yearGroups.map(y => (
                <div key={y.year} style={{ flex: 1, textAlign: 'center', background: '#F7F5F2', borderRadius: 10, padding: '10px 6px' }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: TP_RED }}>{y.children}</div>
                  <div style={{ fontSize: 10.5, color: '#6B6560', fontWeight: 700 }}>{y.year}</div>
                  <div style={{ background: '#EFEBE6', borderRadius: 999, height: 5, marginTop: 6 }}>
                    <div style={{ width: `${(y.children / maxYear) * 100}%`, height: '100%', background: TP_RED, borderRadius: 999 }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gap: 5 }}>
              {SCHOOL_STATS.stickerAreas.map(a => (
                <div key={a.area} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 150, fontSize: 10.5, fontWeight: 700, color: TP_DARK, flexShrink: 0 }}>{a.area}</div>
                  <div style={{ flex: 1, background: '#EFEBE6', borderRadius: 999, height: 8 }}>
                    <div style={{ width: `${a.pct}%`, height: '100%', background: '#F0524F', borderRadius: 999 }} />
                  </div>
                  <div style={{ width: 34, fontSize: 10.5, fontWeight: 800, color: '#6B6560', textAlign: 'right' }}>{a.pct}%</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card>
            <SectionTitle sub="What the programme delivered against the PE National Curriculum">
              <Award size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Curriculum outcomes
            </SectionTitle>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {SCHOOL_STATS.outcomes.map(o => <Pill key={o} tone="grey">{o}</Pill>)}
            </div>
            <div style={{ fontSize: 12, color: '#5B554F', marginTop: 12, background: '#F7F5F2', borderRadius: 10, padding: '10px 12px' }}>
              <Users size={13} style={{ verticalAlign: '-2px', marginRight: 6 }} />
              11 families continued to free weekend community sessions — the school-community link in action.
            </div>
          </Card>
          <Card>
            <SectionTitle sub="Collected through the parent app, publish-consented">What families said</SectionTitle>
            <div style={{ display: 'grid', gap: 9 }}>
              {SCHOOL_STATS.quotes.map((q, i) => (
                <div key={i} style={{ background: '#FDE8E8', borderRadius: 10, padding: '11px 13px' }}>
                  <div style={{ fontSize: 12.5, fontStyle: 'italic', color: TP_DARK, lineHeight: 1.5 }}>“{q.q}”</div>
                  <div style={{ fontSize: 11, color: TP_RED, fontWeight: 800, marginTop: 5 }}>— {q.who}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <UpcomingCalendar role="school" />
      </>)}

      {/* ── FUNDRAISING ── */}
      {tab === 'fundraising' && (<>
      {/* Campaign hero */}
      <Card style={{ background: TP_DARK, border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 900 }}>{CAMPAIGN.school} — Fundraising campaign</div>
            <div style={{ color: '#C9C4BE', fontSize: 12.5, marginTop: 4 }}>
              Raising the cost of your 10-week Ten Project programme for 2026/27. {CAMPAIGN.supporters} supporters so far.
            </div>
          </div>
          <a href="/fundraise/st-clements-demo" target="_blank" rel="noreferrer" style={{ background: TP_RED, color: '#fff', border: 'none', borderRadius: 9, padding: '9px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, textDecoration: 'none' }}>
            <Share2 size={14} /> View your public page
          </a>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginTop: 14 }}>
          <Thermometer raised={CAMPAIGN.raised} target={CAMPAIGN.target} />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, fontSize: 12, color: '#6B6560' }}>
            <Sparkles size={14} style={{ color: TP_RED }} />
            {CAMPAIGN.matchNote}
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16 }}>
        {/* Events */}
        <Card>
          <SectionTitle sub="Your fundraising calendar across the academic year — every event feeds the thermometer">
            <Calendar size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Events
          </SectionTitle>
          <div style={{ display: 'grid', gap: 8 }}>
            {FUND_EVENTS.map(ev => (
              <div key={ev.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F7F5F2', borderRadius: 10, padding: '10px 12px' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: TP_DARK }}>{ev.name} <Pill tone={EVENT_TONE[ev.status]}>{ev.status.toUpperCase()}</Pill></div>
                  <div style={{ fontSize: 11.5, color: '#6B6560' }}>{ev.type} · {ev.date}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: ev.raised > 0 ? TP_RED : '#8A847E' }}>£{ev.raised.toLocaleString()}</div>
                  <div style={{ fontSize: 10.5, color: '#8A847E' }}>of £{ev.target.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowPack(true)}
            style={{ marginTop: 12, background: TP_RED, color: '#fff', border: 'none', borderRadius: 9, padding: '10px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}
          >
            <Sparkles size={14} /> Plan a new event with AI
          </button>
        </Card>

        {/* Donations + pledges */}
        <Card>
          <SectionTitle sub="Online donations, sponsored-ball-hit pledges and logged cash">
            <PoundSterling size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Money in
          </SectionTitle>
          <div style={{ display: 'grid', gap: 8, fontSize: 12.5 }}>
            {[
              ['Online donations (public page)', '£512'],
              ['Sponsored Ball Hit pledges (collected)', '£1,455 of £1,780 pledged'],
              ['Cash logged (fair stall + cake sale)', '£183'],
              ['Gift Aid eligible (est.)', '£96'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F0EBE5', paddingBottom: 7 }}>
                <span style={{ color: '#6B6560' }}>{k}</span>
                <span style={{ fontWeight: 800, color: TP_DARK }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 11.5, color: '#6B6560', background: '#F7F5F2', borderRadius: 10, padding: '10px 12px' }}>
            <CheckCircle size={13} style={{ verticalAlign: '-2px', marginRight: 6, color: '#187A3C' }} />
            When the thermometer reaches £{CAMPAIGN.target.toLocaleString()}, your programme flips to CONFIRMED and week 1 is scheduled.
          </div>
        </Card>
      </div>
      </>)}

      {/* AI event pack modal */}
      {showPack && (
        <div style={{ position: 'fixed', inset: 0, background: '#00000066', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }} onClick={() => setShowPack(false)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 22, maxWidth: 560, width: '92%', maxHeight: '82vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: TP_DARK }}>
                <Sparkles size={15} style={{ color: TP_RED, verticalAlign: '-2px', marginRight: 6 }} />
                AI event pack — {AI_EVENT_PACK.event}
              </div>
              <button onClick={() => setShowPack(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B6560' }}><X size={18} /></button>
            </div>
            <div style={{ fontSize: 12, color: '#6B6560', marginBottom: 12 }}>
              Suggested for your calendar (autumn half-term run-up). The pack generates everything the school office needs:
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {AI_EVENT_PACK.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 9, background: '#F7F5F2', borderRadius: 10, padding: '10px 12px', fontSize: 12.5, color: TP_DARK }}>
                  <span style={{ fontWeight: 900, color: TP_RED }}>{i + 1}.</span> {item}
                </div>
              ))}
            </div>
            <button onClick={() => setShowPack(false)} style={{ marginTop: 14, background: TP_DARK, color: '#fff', border: 'none', borderRadius: 9, padding: '10px 16px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
              Add to my events (demo)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
