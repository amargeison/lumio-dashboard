'use client'

// Public fundraising page view — Phase 1.5 fast-track (Scoping v2.0 §5.9).
// Donations UI is present but Stripe is stubbed until the receiving-entity
// decision (school/PTA vs Ten Project Ltd) is made with Harry.

import React, { useState } from 'react'
import { Heart, Share2, Trophy, Calendar, X, CheckCircle } from 'lucide-react'

const RED = '#D7262C'
const DARK = '#1B1B21'
const PAPER = '#F7F5F2'

export interface CampaignData {
  school: string
  slug: string
  targetPence: number
  raisedPence: number
  supporters: number
  status: string
  matchNote?: string | null
  events: { name: string; date: string; status: 'planned' | 'live' | 'complete'; raisedPence: number }[]
  isDemo: boolean
}

const gbp = (pence: number) => `£${Math.round(pence / 100).toLocaleString()}`

export default function FundraiseView({ campaign }: { campaign: CampaignData }) {
  const [donateOpen, setDonateOpen] = useState(false)
  const [amount, setAmount] = useState<number | null>(1000)
  const [shared, setShared] = useState(false)
  const pct = Math.min(100, Math.round((campaign.raisedPence / campaign.targetPence) * 100))
  const unlocked = campaign.status === 'unlocked' || pct >= 100

  async function share() {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const text = `Help bring 10 weeks of free tennis to ${campaign.school} — every pound counts!`
    try {
      if (navigator.share) await navigator.share({ title: text, url })
      else { await navigator.clipboard.writeText(url); setShared(true); setTimeout(() => setShared(false), 2000) }
    } catch { /* user cancelled */ }
  }

  return (
    <div style={{ minHeight: '100vh', background: PAPER, fontFamily: 'system-ui, -apple-system, sans-serif', color: DARK }}>
      {campaign.isDemo && (
        <div style={{ background: '#22222A', color: '#C9C4BE', fontSize: 11.5, textAlign: 'center', padding: '7px 12px', fontWeight: 600 }}>
          DEMO CAMPAIGN — sample data
        </div>
      )}

      {/* Header */}
      <header style={{ background: DARK, padding: '38px 20px 30px', textAlign: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/tenproject_logo_dark.png" alt="Ten Project" style={{ height: 46, width: 'auto', display: 'inline-block' }} />
        <div style={{ color: '#C9C4BE', fontSize: 12.5, marginTop: 10, letterSpacing: 1, fontWeight: 700 }}>SCHOOL FUNDRAISING</div>
        <h1 style={{ color: '#fff', fontSize: 30, fontWeight: 900, margin: '10px 0 6px' }}>{campaign.school}</h1>
        <div style={{ color: '#C9C4BE', fontSize: 14.5, maxWidth: 520, margin: '0 auto', lineHeight: 1.55 }}>
          We’re raising the cost of a full Ten Project programme — 10 weeks of free tennis for every child,
          plus free weekend family sessions. LEARN. PLAY. TOGETHER.
        </div>
      </header>

      <main style={{ maxWidth: 660, margin: '0 auto', padding: '26px 18px 60px' }}>
        {/* Thermometer card */}
        <div style={{ background: '#fff', borderRadius: 18, padding: 24, border: '1px solid #E7E2DC', marginTop: -46, boxShadow: '0 14px 34px #00000012' }}>
          {unlocked ? (
            <div style={{ textAlign: 'center', padding: '6px 0 12px' }}>
              <Trophy size={34} style={{ color: RED }} />
              <div style={{ fontSize: 21, fontWeight: 900, marginTop: 6 }}>WE DID IT!</div>
              <div style={{ fontSize: 13.5, color: '#6B6560', marginTop: 4 }}>
                The programme is confirmed — 10 weeks of tennis are coming to {campaign.school}.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
              <div>
                <span style={{ fontSize: 30, fontWeight: 900, color: RED }}>{gbp(campaign.raisedPence)}</span>
                <span style={{ fontSize: 14, color: '#6B6560', fontWeight: 700 }}> raised of {gbp(campaign.targetPence)}</span>
              </div>
              <div style={{ fontSize: 12.5, color: '#6B6560', fontWeight: 700 }}>{campaign.supporters} supporters</div>
            </div>
          )}
          <div style={{ background: '#EFEBE6', borderRadius: 999, height: 22, overflow: 'hidden', position: 'relative' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${RED}, #F0524F)`, borderRadius: 999, transition: 'width .8s ease' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: pct > 55 ? '#fff' : DARK }}>
              {pct}%
            </div>
          </div>
          {campaign.matchNote && !unlocked && (
            <div style={{ fontSize: 12.5, color: '#6B6560', marginTop: 12, background: PAPER, borderRadius: 10, padding: '10px 12px' }}>
              🎯 {campaign.matchNote}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button
              onClick={() => setDonateOpen(true)}
              style={{ flex: 1, background: RED, color: '#fff', border: 'none', borderRadius: 12, padding: '14px 18px', fontSize: 15, fontWeight: 900, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Heart size={17} /> Donate
            </button>
            <button
              onClick={share}
              style={{ background: '#fff', color: DARK, border: '1.5px solid #E7E2DC', borderRadius: 12, padding: '14px 18px', fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <Share2 size={16} /> {shared ? 'Link copied!' : 'Share'}
            </button>
          </div>
        </div>

        {/* What the money funds */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #E7E2DC', marginTop: 16 }}>
          <div style={{ fontSize: 14.5, fontWeight: 900, marginBottom: 10 }}>Where every pound goes</div>
          <div style={{ display: 'grid', gap: 8, fontSize: 13, color: '#5B554F' }}>
            {[
              'Ten one-hour coaching sessions in school, for every class taking part',
              'A welcome pack for every child — T-shirt, tennis ball and Activity Booklet',
              'All equipment: rackets, balls, nets and cones (kept by the school)',
              'Ten free weekend family sessions on local community courts',
              'The Week-10 Festival and a certificate for every child',
            ].map(t => (
              <div key={t} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                <CheckCircle size={15} style={{ color: RED, flexShrink: 0, marginTop: 2 }} /> {t}
              </div>
            ))}
          </div>
        </div>

        {/* Events */}
        {campaign.events.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #E7E2DC', marginTop: 16 }}>
            <div style={{ fontSize: 14.5, fontWeight: 900, marginBottom: 10 }}>
              <Calendar size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Fundraising events
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {campaign.events.map(ev => (
                <div key={ev.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: PAPER, borderRadius: 10, padding: '11px 13px' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800 }}>{ev.name}</div>
                    <div style={{ fontSize: 11.5, color: '#8A847E' }}>{ev.date}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {ev.status === 'complete' && <span style={{ fontSize: 12.5, fontWeight: 900, color: '#187A3C' }}>✓ {ev.raisedPence > 0 ? gbp(ev.raisedPence) : 'done'}</span>}
                    {ev.status === 'live' && <span style={{ fontSize: 12.5, fontWeight: 900, color: RED }}>{ev.raisedPence > 0 ? `${gbp(ev.raisedPence)} so far` : 'LIVE'}</span>}
                    {ev.status === 'planned' && <span style={{ fontSize: 12, fontWeight: 800, color: '#8A847E' }}>coming up</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', fontSize: 11.5, color: '#8A847E', marginTop: 22, lineHeight: 1.6 }}>
          Run with the school and Ten Project Ltd · every donation is visible to the school and Ten Project HQ<br />
          <a href="/tenproject" style={{ color: RED, fontWeight: 800, textDecoration: 'none' }}>What is Ten Project? →</a>
        </div>
      </main>

      {/* Donate modal — Stripe stubbed pending receiving-entity decision */}
      {donateOpen && (
        <div style={{ position: 'fixed', inset: 0, background: '#00000066', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 16 }} onClick={() => setDonateOpen(false)}>
          <div style={{ background: '#fff', borderRadius: 18, padding: 22, maxWidth: 420, width: '100%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 900 }}>Support {campaign.school}</div>
              <button onClick={() => setDonateOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B6560' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {[500, 1000, 2500, 5000].map(p => (
                <button key={p} onClick={() => setAmount(p)}
                  style={{ flex: 1, background: amount === p ? RED : PAPER, color: amount === p ? '#fff' : DARK, border: 'none', borderRadius: 10, padding: '12px 0', fontSize: 14, fontWeight: 900, cursor: 'pointer' }}>
                  £{p / 100}
                </button>
              ))}
            </div>
            <button
              disabled
              style={{ width: '100%', background: '#C9C4BE', color: '#fff', border: 'none', borderRadius: 12, padding: '13px 16px', fontSize: 14, fontWeight: 900, cursor: 'not-allowed' }}
            >
              Online donations launching soon
            </button>
            <div style={{ fontSize: 11.5, color: '#6B6560', marginTop: 10, lineHeight: 1.55, textAlign: 'center' }}>
              We’re finalising the payment setup with the school. Until then you can donate in person
              at any fundraising event — every pound is logged to the thermometer.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
