'use client'

import React, { useState } from 'react'
import { QrCode, WifiOff, CheckCircle, Users, ClipboardList, Sparkles } from 'lucide-react'
import { Card, SectionTitle, Pill } from './ui'
import { TP_RED, TP_DARK, COHORT_CHILDREN, WEEKEND_FAMILIES, VENUES, CURRICULUM } from '@/data/tenproject/demo-data'

// ─── COACH: in-school session + one-tap register ────────────────────────────
export function CoachView() {
  const [children, setChildren] = useState(COHORT_CHILDREN)
  const [skillTapped, setSkillTapped] = useState<Record<string, boolean>>({})
  const present = children.filter(c => c.present).length
  const block = CURRICULUM[1]

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card style={{ background: TP_DARK, border: 'none' }}>
        <div style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>Oakridge Primary — Y3 Falcons · Week 4 of 10</div>
        <div style={{ color: '#C9C4BE', fontSize: 12.5, marginTop: 4 }}>
          Today 1.15–2.15pm · {block.skill} block · Run-sheet: warm-up ABCs (10m) → grip & swing (15m) → rally games (25m) → together time (10m)
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <Pill tone="red">{present} / {children.length} PRESENT</Pill>
          <Pill tone="grey">KIT: 24 rackets · red balls · cones</Pill>
        </div>
      </Card>

      <Card>
        <SectionTitle sub="One tap = attendance. Second tap = this week’s skill recorded — the parent sees the sticker mirrored tonight.">
          <ClipboardList size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Register — tap to mark
        </SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 8 }}>
          {children.map(c => (
            <div key={c.id} style={{ border: '1px solid #F0EBE5', borderRadius: 10, padding: '10px 12px', background: c.present ? '#fff' : '#F7F5F2' }}>
              <button
                onClick={() => setChildren(prev => prev.map(x => x.id === c.id ? { ...x, present: !x.present } : x))}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', width: '100%' }}
              >
                <div style={{ fontSize: 12.5, fontWeight: 800, color: c.present ? TP_DARK : '#9A948E' }}>
                  {c.present ? '✓ ' : ''}{c.name}
                </div>
                <div style={{ fontSize: 10.5, color: '#8A847E' }}>{c.year} · {c.stickers}/6 stickers</div>
              </button>
              {c.present && (
                <button
                  onClick={() => setSkillTapped(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                  style={{ marginTop: 6, width: '100%', background: skillTapped[c.id] ? '#187A3C' : '#FDE8E8', color: skillTapped[c.id] ? '#fff' : TP_RED, border: 'none', borderRadius: 7, padding: '5px 8px', fontSize: 10.5, fontWeight: 800, cursor: 'pointer' }}
                >
                  {skillTapped[c.id] ? '★ BACKHAND recorded' : '+ record BACKHAND'}
                </button>
              )}
            </div>
          ))}
        </div>
        <button style={{ marginTop: 12, background: TP_DARK, color: '#fff', border: 'none', borderRadius: 9, padding: '10px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <Sparkles size={14} /> AI cohort summary for the school (demo)
        </button>
      </Card>
    </div>
  )
}

// ─── TENOR: weekend venue + QR scan-in feed ─────────────────────────────────
export function TenorView() {
  const [families, setFamilies] = useState(WEEKEND_FAMILIES)
  const venue = VENUES[0]
  const checkedIn = families.filter(f => f.checkedIn)
  const childCount = checkedIn.reduce((n, f) => n + f.children.split('+').length, 0)

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card style={{ background: TP_DARK, border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>{venue.name} — Family Session</div>
            <div style={{ color: '#C9C4BE', fontSize: 12.5, marginTop: 4 }}>{venue.day} {venue.time} · you + 2 TENORs on duty · equipment in the green store box</div>
          </div>
          <div style={{ textAlign: 'center', background: '#fff', borderRadius: 12, padding: '10px 16px' }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: TP_RED }}>{childCount}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#6B6560' }}>children on court</div>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16 }}>
        <Card>
          <SectionTitle sub="Families scan the gate QR themselves — you just sanity-check the live count and tap in anyone without a phone">
            <Users size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Today’s register
          </SectionTitle>
          <div style={{ display: 'grid', gap: 7 }}>
            {families.map(f => (
              <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: f.checkedIn ? '#F7F5F2' : '#fff', border: '1px solid #F0EBE5', borderRadius: 10, padding: '9px 12px' }}>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: TP_DARK }}>{f.family} family</div>
                  <div style={{ fontSize: 11, color: '#6B6560' }}>{f.children}</div>
                </div>
                {f.checkedIn ? (
                  <Pill tone={f.via === 'QR' ? 'green' : 'dark'}>{f.via === 'QR' ? '✓ QR SCAN' : '✓ TENOR TAP'}</Pill>
                ) : (
                  <button
                    onClick={() => setFamilies(prev => prev.map(x => x.id === f.id ? { ...x, checkedIn: true, via: 'TENOR' } : x))}
                    style={{ background: TP_RED, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 11px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                  >
                    Tap in
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>

        <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
          <Card style={{ textAlign: 'center' }}>
            <SectionTitle sub="Printed on the gate sign — venue- and date-aware">The gate QR</SectionTitle>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 130, height: 130, background: '#F7F5F2', borderRadius: 12, border: '1px solid #E7E2DC' }}>
              <QrCode size={92} style={{ color: TP_DARK }} />
            </div>
            <div style={{ fontSize: 11.5, color: '#6B6560', marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
              <WifiOff size={13} /> Works offline — check-ins sync when signal returns
            </div>
          </Card>
          <Card>
            <SectionTitle>Session card — Week 4</SectionTitle>
            <div style={{ fontSize: 12.5, color: TP_DARK }}>
              BACKHAND week: two-handed grips, balloon rallies, “beat the parent” games. Videos are in your Resources tab.
            </div>
            <div style={{ marginTop: 10, fontSize: 11.5, color: '#6B6560', background: '#F7F5F2', borderRadius: 10, padding: '9px 11px' }}>
              <CheckCircle size={13} style={{ verticalAlign: '-2px', marginRight: 6, color: '#187A3C' }} />
              Register auto-submits at 3pm — no paperwork, no chasing.
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
