'use client'

import React, { useState } from 'react'
import { Sparkles, Calendar, PoundSterling, Share2, CheckCircle, X } from 'lucide-react'
import { Card, SectionTitle, Pill, Thermometer } from './ui'
import { TP_RED, TP_DARK, CAMPAIGN, FUND_EVENTS, AI_EVENT_PACK } from '@/data/tenproject/demo-data'

const EVENT_TONE: Record<string, 'green' | 'red' | 'grey'> = {
  complete: 'green',
  live: 'red',
  planned: 'grey',
}

export default function SchoolView() {
  const [showPack, setShowPack] = useState(false)

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Campaign hero */}
      <Card style={{ background: TP_DARK, border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 900 }}>{CAMPAIGN.school} — Fundraising campaign</div>
            <div style={{ color: '#C9C4BE', fontSize: 12.5, marginTop: 4 }}>
              Raising the cost of your 10-week Ten Project programme for 2026/27. {CAMPAIGN.supporters} supporters so far.
            </div>
          </div>
          <button style={{ background: TP_RED, color: '#fff', border: 'none', borderRadius: 9, padding: '9px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            <Share2 size={14} /> Share your public page
          </button>
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
