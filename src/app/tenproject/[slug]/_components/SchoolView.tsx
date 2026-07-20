'use client'

import React, { useEffect, useState } from 'react'
import { Sparkles, Calendar, PoundSterling, Share2, CheckCircle, X, BarChart3, Download, LineChart } from 'lucide-react'
import { Card, SectionTitle, Pill, Thermometer } from './ui'
import UpcomingCalendar from './UpcomingCalendar'
import SchoolInsights from './SchoolInsights'
import { openFunderDoc } from '../_lib/funder-docs'
import { eventResources, openEventDoc } from '../_lib/event-docs'
import { TP_RED, TP_DARK, CAMPAIGN, FUND_EVENTS, AI_EVENT_PACK, SCHOOL_STATS, type FundraisingEvent } from '@/data/tenproject/demo-data'

// AI-pack modal rows map onto the ball-hit resource docs, in order
const AI_PACK_RESOURCE_IDS = ['checklist', 'poster', 'parent-letter', 'risk', 'sponsor-ask', 'run-sheet']

const EVENT_TONE: Record<string, 'green' | 'red' | 'grey'> = {
  complete: 'green',
  live: 'red',
  planned: 'grey',
}

export type SchoolSection = 'programme' | 'insights' | 'fundraising'
export const SCHOOL_SECTIONS: { id: SchoolSection; label: string }[] = [
  { id: 'programme', label: 'Our programme' },
  { id: 'insights', label: 'Insights' },
  { id: 'fundraising', label: 'Fundraising' },
]

export default function SchoolView({ section }: { section?: SchoolSection }) {
  const [showPack, setShowPack] = useState(false)
  const [events, setEvents] = useState<FundraisingEvent[]>(FUND_EVENTS)
  const [selectedEvent, setSelectedEvent] = useState<FundraisingEvent | null>(null)
  const [tab, setTab] = useState<SchoolSection>(section ?? 'programme')
  const controlled = section !== undefined
  useEffect(() => { if (section !== undefined) setTab(section) }, [section])
  const ballHitEvent = events.find(e => e.type === 'Sponsored ball hit') ?? events[0]

  function addAiEvent() {
    if (!events.some(e => e.id === 'f5')) {
      setEvents(prev => [...prev, { id: 'f5', name: 'Spring Sponsored Ball Hit', type: 'Sponsored ball hit', date: '20 Mar', status: 'planned', raised: 0, target: 900 }])
    }
    setShowPack(false)
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Tabs (hidden when the sidebar drives sections) */}
      {!controlled && <div style={{ display: 'flex', gap: 8 }}>
        {([
          { id: 'programme' as const, label: 'Our programme', icon: BarChart3 },
          { id: 'insights' as const, label: 'Insights', icon: LineChart },
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
      </div>}

      {/* ── INSIGHTS (governor-grade impact dashboard) ── */}
      {tab === 'insights' && <SchoolInsights />}

      {/* ── OUR PROGRAMME (operational status — what's happening & what's next) ── */}
      {tab === 'programme' && (<>
        {/* Status banner */}
        <Card style={{ background: TP_DARK, border: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: TP_RED, fontSize: 11, fontWeight: 800, letterSpacing: 1.5 }}>PROGRAMME STATUS</div>
              <div style={{ color: '#fff', fontSize: 18, fontWeight: 900, marginTop: 5 }}>Completed 2025/26 · fundraising to return for 2026/27</div>
              <div style={{ color: '#C9C4BE', fontSize: 12.5, marginTop: 5, maxWidth: 560 }}>
                Your ten weeks ran last summer and finished with the Festival. Because direct PE &amp; Sport Premium funding has ended, your 2026/27 programme is now being fundraised — you’re {Math.round((CAMPAIGN.raised / CAMPAIGN.target) * 100)}% of the way there.
              </div>
            </div>
            <button onClick={() => setTab('fundraising')} style={{ background: TP_RED, color: '#fff', border: 'none', borderRadius: 9, padding: '10px 16px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <PoundSterling size={14} /> Go to fundraising
            </button>
          </div>
          <div style={{ background: '#fff', borderRadius: 10, padding: '12px 14px', marginTop: 14 }}>
            <Thermometer raised={CAMPAIGN.raised} target={CAMPAIGN.target} height={14} />
          </div>
        </Card>

        {/* Where you are — the operational snapshot */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16 }}>
          <Card>
            <SectionTitle sub="Your programme at a glance — the operational picture">Your programme</SectionTitle>
            <div style={{ display: 'grid', gap: 8 }}>
              {([
                ['Term delivered', SCHOOL_STATS.term.replace(' (completed)', ''), 'green'],
                ['Cohorts', 'Y2, Y3 and Y4 — 62 children across 3 classes', 'grey'],
                ['Coach', 'Lucy Tran (LTA Level 2)', 'grey'],
                ['Linked weekend venue', 'Kingsmead Rec Ground · Sat 1.30pm — 11 families continued', 'red'],
                ['Equipment', 'Full set retained by the school (good condition, checked 30 Jun)', 'grey'],
                ['Next step', 'Reach the fundraising target → programme flips to CONFIRMED and week 1 is scheduled', 'red'],
              ] as [string, string, 'green' | 'grey' | 'red'][]).map(([k, v, tone]) => (
                <div key={k} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: '#F7F5F2', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ width: 150, flexShrink: 0, fontSize: 11.5, fontWeight: 800, color: '#8A847E' }}>{k}</div>
                  <div style={{ flex: 1, fontSize: 12.5, color: TP_DARK }}>{v}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <SectionTitle sub="Share your results — one click">Quick actions</SectionTitle>
            <div style={{ display: 'grid', gap: 8 }}>
              <button onClick={() => setTab('insights')} style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#FDE8E8', color: TP_DARK, border: 'none', borderRadius: 10, padding: '12px 13px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', textAlign: 'left' }}>
                <LineChart size={15} style={{ color: TP_RED }} /> Open the full impact dashboard →
              </button>
              <button onClick={() => openFunderDoc('governor-pack')} style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#F7F5F2', color: TP_DARK, border: 'none', borderRadius: 10, padding: '12px 13px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', textAlign: 'left' }}>
                <Download size={15} style={{ color: TP_RED }} /> Governor pack (PDF)
              </button>
              <button onClick={() => openFunderDoc('newsletter-snippet')} style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#F7F5F2', color: TP_DARK, border: 'none', borderRadius: 10, padding: '12px 13px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', textAlign: 'left' }}>
                <Share2 size={15} style={{ color: TP_RED }} /> Parent newsletter snippet
              </button>
            </div>
            <div style={{ fontSize: 11, color: '#8A847E', marginTop: 10 }}>
              The numbers, charts and wellbeing evidence live in <strong>Insights</strong> — this page is your live status and next steps.
            </div>
          </Card>
        </div>

        <UpcomingCalendar role="school" title="Key dates" sub="Fundraising events and — once confirmed — your programme sessions land here automatically" />
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
            {events.map(ev => (
              <button key={ev.id} onClick={() => setSelectedEvent(ev)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F7F5F2', border: '1px solid transparent', borderRadius: 10, padding: '10px 12px', cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'inherit' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: TP_DARK }}>{ev.name} <Pill tone={EVENT_TONE[ev.status]}>{ev.status.toUpperCase()}</Pill></div>
                  <div style={{ fontSize: 11.5, color: '#6B6560' }}>{ev.type} · {ev.date} · <span style={{ color: TP_RED, fontWeight: 800 }}>{eventResources(ev).length} resources ▸</span></div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: ev.raised > 0 ? TP_RED : '#8A847E' }}>£{ev.raised.toLocaleString()}</div>
                  <div style={{ fontSize: 10.5, color: '#8A847E' }}>of £{ev.target.toLocaleString()}</div>
                </div>
              </button>
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
                <button key={i} onClick={() => openEventDoc(ballHitEvent, AI_PACK_RESOURCE_IDS[i] ?? 'run-sheet')} style={{ display: 'flex', gap: 9, background: '#F7F5F2', border: '1px solid transparent', borderRadius: 10, padding: '10px 12px', fontSize: 12.5, color: TP_DARK, cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'inherit' }}>
                  <span style={{ fontWeight: 900, color: TP_RED }}>{i + 1}.</span>
                  <span style={{ flex: 1 }}>{item}</span>
                  <span style={{ color: TP_RED, fontWeight: 900, flexShrink: 0 }}>open ▸</span>
                </button>
              ))}
            </div>
            <button onClick={addAiEvent} style={{ marginTop: 14, background: TP_DARK, color: '#fff', border: 'none', borderRadius: 9, padding: '10px 16px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
              Add “Spring Sponsored Ball Hit” to my events
            </button>
          </div>
        </div>
      )}

      {/* Event detail + resources modal */}
      {selectedEvent && (
        <div style={{ position: 'fixed', inset: 0, background: '#00000066', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 16 }} onClick={() => setSelectedEvent(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 22, maxWidth: 540, width: '100%', maxHeight: '84vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: TP_DARK }}>{selectedEvent.name} <Pill tone={EVENT_TONE[selectedEvent.status]}>{selectedEvent.status.toUpperCase()}</Pill></div>
                <div style={{ fontSize: 12, color: '#6B6560', marginTop: 3 }}>{selectedEvent.type} · {selectedEvent.date} · £{selectedEvent.raised.toLocaleString()} raised of £{selectedEvent.target.toLocaleString()}</div>
              </div>
              <button onClick={() => setSelectedEvent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B6560' }}><X size={18} /></button>
            </div>
            <div style={{ background: '#EFEBE6', borderRadius: 999, height: 10, margin: '10px 0 14px' }}>
              <div style={{ width: `${Math.min(100, Math.round((selectedEvent.raised / selectedEvent.target) * 100))}%`, height: '100%', background: TP_RED, borderRadius: 999 }} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 900, color: TP_DARK, letterSpacing: 0.5, marginBottom: 8 }}>EVENT RESOURCES — tap to open, print or copy</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {eventResources(selectedEvent).map(r => (
                <button key={r.id} onClick={() => openEventDoc(selectedEvent, r.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, background: '#F7F5F2', border: '1px solid transparent', borderRadius: 10, padding: '11px 13px', cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'inherit' }}>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: TP_DARK }}>{r.title}</div>
                    <div style={{ fontSize: 11, color: '#6B6560', marginTop: 2 }}>{r.desc}</div>
                  </div>
                  <span style={{ color: TP_RED, fontWeight: 900, fontSize: 12, flexShrink: 0 }}>open ▸</span>
                </button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: '#8A847E', marginTop: 12 }}>
              Money logged against this event feeds the campaign thermometer automatically.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
