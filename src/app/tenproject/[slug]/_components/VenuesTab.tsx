'use client'

// HQ Weekend Venues tab — everything about each community venue in one place:
// access, storage, sessions, TENOR team, attendance, feeder schools, actions.

import React, { useState } from 'react'
import { ArrowLeft, MapPin, Users, Package, TrendingUp, ClipboardList, ExternalLink, KeyRound } from 'lucide-react'
import { Card, SectionTitle, Pill } from './ui'
import { TP_RED, TP_DARK, VENUES, VENUE_DETAILS, type DemoVenue } from '@/data/tenproject/demo-data'

export default function VenuesTab({ initialId }: { initialId?: string }) {
  const [selected, setSelected] = useState<DemoVenue | null>(
    initialId ? VENUES.find(v => v.id === initialId) ?? null : null,
  )

  if (selected) {
    const d = VENUE_DETAILS[selected.id]
    const maxAtt = Math.max(...(d?.attendanceTrend.length ? d.attendanceTrend : [1]))
    return (
      <div style={{ display: 'grid', gap: 16 }}>
        <button onClick={() => setSelected(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#fff', color: TP_DARK, border: '1px solid #E7E2DC', borderRadius: 9, padding: '8px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer', width: 'fit-content' }}>
          <ArrowLeft size={14} /> All venues
        </button>

        {/* Header */}
        <Card style={{ background: TP_DARK, border: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: '#fff', fontSize: 19, fontWeight: 900 }}>
                <MapPin size={17} style={{ verticalAlign: '-2px', marginRight: 8, color: TP_RED }} />{selected.name}
                {d?.inclusive && <span style={{ marginLeft: 8 }}><Pill tone="green">INCLUSIVE SESSIONS</Pill></span>}
                {selected.external && <span style={{ marginLeft: 8 }}><Pill tone="grey">LINKED VENUE</Pill></span>}
              </div>
              <div style={{ color: '#C9C4BE', fontSize: 12.5, marginTop: 5 }}>{d?.address} · {d?.postcode}</div>
              <div style={{ color: '#C9C4BE', fontSize: 12, marginTop: 4 }}>{d?.courts} · {d?.surface}</div>
            </div>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              {([
                [selected.lastCount ?? '—', 'LAST REGISTER'],
                [d?.familiesRegistered ?? '—', 'FAMILIES REGISTERED'],
                [d?.tenorTeam.length ?? '—', 'TENORS'],
              ] as [string | number, string][]).map(([v, l]) => (
                <div key={l} style={{ background: '#22222A', borderRadius: 10, padding: '10px 15px', textAlign: 'center' }}>
                  <div style={{ fontSize: 19, fontWeight: 900, color: TP_RED }}>{v}</div>
                  <div style={{ fontSize: 8.5, color: '#8A847E', fontWeight: 800, letterSpacing: 0.5 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Sessions + team */}
          <Card>
            <SectionTitle>Sessions & team</SectionTitle>
            <div style={{ display: 'grid', gap: 8 }}>
              {d?.sessions.map(s => (
                <div key={s.time} style={{ background: '#FDE8E8', borderRadius: 10, padding: '11px 13px' }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: TP_RED }}>{s.day} {s.time}</div>
                  <div style={{ fontSize: 11.5, color: '#5B554F', marginTop: 2 }}>{s.type}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, fontSize: 12.5, color: '#5B554F' }}>
              <strong>Lead coach:</strong> {d?.leadCoach}
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: TP_DARK, letterSpacing: 0.5, marginBottom: 6 }}>
                <Users size={12} style={{ verticalAlign: '-2px', marginRight: 5 }} />TENOR TEAM
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {d?.tenorTeam.map(t => <Pill key={t} tone="grey">{t}</Pill>)}
              </div>
            </div>
            {selected.external && d?.external && (
              <a href={d.external.url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 12, fontWeight: 800, color: TP_DARK, border: '1.5px solid #D9D3CC', borderRadius: 8, padding: '8px 13px', textDecoration: 'none' }}>
                <ExternalLink size={13} /> Bookings via {d.external.partner}
              </a>
            )}
          </Card>

          {/* Access + kit + attendance */}
          <Card>
            <SectionTitle>Access, kit & attendance</SectionTitle>
            <div style={{ display: 'grid', gap: 8, fontSize: 12.5, color: '#5B554F' }}>
              <div style={{ background: '#F7F5F2', borderRadius: 9, padding: '9px 12px' }}>
                <KeyRound size={13} style={{ verticalAlign: '-2px', marginRight: 6 }} /><strong>Access:</strong> {d?.access}
              </div>
              <div style={{ background: '#F7F5F2', borderRadius: 9, padding: '9px 12px' }}>
                <Package size={13} style={{ verticalAlign: '-2px', marginRight: 6 }} /><strong>Storage:</strong> {d?.storage}
              </div>
              <div style={{ background: '#F7F5F2', borderRadius: 9, padding: '9px 12px' }}>
                <Package size={13} style={{ verticalAlign: '-2px', marginRight: 6 }} /><strong>Kit:</strong> {d?.kit}
              </div>
            </div>
            {d && d.attendanceTrend.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: TP_DARK, letterSpacing: 0.5, marginBottom: 7 }}>
                  <TrendingUp size={12} style={{ verticalAlign: '-2px', marginRight: 5 }} />CHILDREN PER SESSION (RECENT WEEKS)
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 60 }}>
                  {d.attendanceTrend.map((v, i) => (
                    <div key={i} style={{ flex: 1, height: `${(v / maxAtt) * 100}%`, background: i === d.attendanceTrend.length - 1 ? TP_RED : '#E8B4B3', borderRadius: '3px 3px 0 0' }} title={`${v} children`} />
                  ))}
                </div>
              </div>
            )}
            <div style={{ marginTop: 12, fontSize: 12, color: '#5B554F' }}>
              <strong>Feeder schools:</strong> {d?.feederSchools.join(' · ') || '—'}
            </div>
          </Card>
        </div>

        {/* Notes + actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card>
            <SectionTitle>Notes</SectionTitle>
            <div style={{ display: 'grid', gap: 6 }}>
              {d?.notes.map(n => <div key={n} style={{ fontSize: 12.5, color: '#5B554F', background: '#F7F5F2', borderRadius: 9, padding: '9px 12px' }}>{n}</div>)}
            </div>
          </Card>
          <Card>
            <SectionTitle>
              <ClipboardList size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Next actions
            </SectionTitle>
            <div style={{ display: 'grid', gap: 6 }}>
              {d?.nextActions.map(n => <div key={n} style={{ fontSize: 12.5, color: TP_DARK, background: '#FDE8E8', borderRadius: 9, padding: '9px 12px', fontWeight: 600 }}>→ {n}</div>)}
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -50, marginBottom: 4, position: 'relative', zIndex: 1 }}>
        <button style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: TP_RED, color: '#fff', border: 'none', borderRadius: 9, padding: '9px 14px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>
          <MapPin size={14} /> Add venue
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {VENUES.map(v => {
          const d = VENUE_DETAILS[v.id]
          return (
            <Card key={v.id} style={{ padding: 16, cursor: 'pointer' }}>
              <div onClick={() => setSelected(v)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: TP_DARK }}>
                    <MapPin size={14} style={{ verticalAlign: '-2px', marginRight: 6, color: TP_RED }} />{v.name}
                  </div>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {d?.inclusive && <Pill tone="green">INCLUSIVE</Pill>}
                    {v.external && <Pill tone="grey">LINKED</Pill>}
                  </div>
                </div>
                <div style={{ fontSize: 11.5, color: '#6B6560', marginTop: 4 }}>{v.day} {v.time} · {d?.postcode} · lead: {d?.leadCoach}</div>
                <div style={{ fontSize: 12, color: '#5B554F', marginTop: 8, background: '#F7F5F2', borderRadius: 9, padding: '8px 11px' }}>
                  {d?.courts} · {v.tenors} TENORs · {d?.familiesRegistered} families registered
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 10, borderTop: '1px solid #F0EBE5', paddingTop: 10, alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: TP_RED }}>{v.lastCount}</div>
                    <div style={{ fontSize: 8, color: '#8A847E', fontWeight: 800, letterSpacing: 0.5 }}>LAST REGISTER</div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 900, color: TP_RED, marginLeft: 'auto' }}>View →</div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
