'use client'

// HQ Schools tab — every school in one place: profile, contacts, programme,
// cohorts, stats, kit, fundraising and next actions. Card list → deep-dive.

import React, { useState } from 'react'
import { ArrowLeft, School, Phone, Mail, ShieldCheck, Package, PoundSterling, MapPin, TrendingUp, ClipboardList } from 'lucide-react'
import { Card, SectionTitle, Pill, Thermometer } from './ui'
import { TP_RED, TP_DARK, SCHOOLS, SCHOOL_DETAILS, type DemoSchool } from '@/data/tenproject/demo-data'

const STATUS_TONE: Record<string, 'red' | 'green' | 'amber' | 'grey' | 'dark'> = {
  running: 'green', fundraising: 'red', confirmed: 'dark', enquiry: 'grey', complete: 'amber',
}

export default function SchoolsTab() {
  const [selected, setSelected] = useState<DemoSchool | null>(null)

  if (selected) {
    const d = SCHOOL_DETAILS[selected.id]
    const maxAtt = Math.max(...(d?.attendanceTrend.length ? d.attendanceTrend : [1]))
    return (
      <div style={{ display: 'grid', gap: 16 }}>
        <button onClick={() => setSelected(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#fff', color: TP_DARK, border: '1px solid #E7E2DC', borderRadius: 9, padding: '8px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer', width: 'fit-content' }}>
          <ArrowLeft size={14} /> All schools
        </button>

        {/* Header */}
        <Card style={{ background: TP_DARK, border: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: '#fff', fontSize: 19, fontWeight: 900 }}>
                <School size={17} style={{ verticalAlign: '-2px', marginRight: 8, color: TP_RED }} />{selected.name} <Pill tone={STATUS_TONE[selected.status]}>{selected.status.toUpperCase()}</Pill>
              </div>
              <div style={{ color: '#C9C4BE', fontSize: 12.5, marginTop: 5 }}>
                {d?.address} · {selected.borough} · {selected.note}
              </div>
              <div style={{ color: '#C9C4BE', fontSize: 12, marginTop: 6 }}>
                <ShieldCheck size={12} style={{ verticalAlign: '-1px', marginRight: 5, color: TP_RED }} />Safeguarding lead: {d?.safeguardingLead} · Funding: {d?.funding}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              {([
                [selected.children ?? '—', 'CHILDREN'],
                [d?.activationPct ? `${d.activationPct}%` : '—', 'PARENT ACTIVATION'],
                [d?.conversionPct ? `${d.conversionPct}%` : '—', 'WEEKEND CONVERSION'],
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
          {/* Contacts */}
          <Card>
            <SectionTitle>Contacts</SectionTitle>
            <div style={{ display: 'grid', gap: 9 }}>
              {d?.contacts.map(c => (
                <div key={c.name} style={{ background: '#F7F5F2', borderRadius: 10, padding: '11px 13px' }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: TP_DARK }}>{c.name} <span style={{ fontWeight: 600, color: '#8A847E', fontSize: 11.5 }}>— {c.role}</span></div>
                  <div style={{ fontSize: 11.5, color: '#6B6560', marginTop: 4, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    <a href={`mailto:${c.email}`} style={{ color: TP_RED, fontWeight: 700, textDecoration: 'none' }}><Mail size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />{c.email}</a>
                    <a href={`tel:${c.phone.replace(/\s/g, '')}`} style={{ color: TP_DARK, fontWeight: 700, textDecoration: 'none' }}><Phone size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />{c.phone}</a>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: '#5B554F', background: '#F7F5F2', borderRadius: 10, padding: '10px 12px' }}>
              <Package size={13} style={{ verticalAlign: '-2px', marginRight: 6 }} /><strong>Kit:</strong> {d?.kit}
            </div>
            {d?.weekendVenue && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#5B554F', background: '#FDE8E8', borderRadius: 10, padding: '10px 12px' }}>
                <MapPin size={13} style={{ verticalAlign: '-2px', marginRight: 6, color: TP_RED }} /><strong>Linked weekend venue:</strong> {d.weekendVenue}
              </div>
            )}
          </Card>

          {/* Cohorts + attendance */}
          <Card>
            <SectionTitle>Cohorts & attendance</SectionTitle>
            {d && d.cohorts.length > 0 ? (
              <div style={{ display: 'grid', gap: 8 }}>
                {d.cohorts.map(c => (
                  <div key={c.name} style={{ background: '#F7F5F2', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 800, color: TP_DARK }}>
                      <span>{c.name}</span>
                      <span style={{ color: c.week === 10 ? '#187A3C' : c.week === 0 ? '#8A847E' : TP_RED }}>{c.week === 10 ? 'COMPLETE' : c.week === 0 ? 'NOT STARTED' : `Week ${c.week}`}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: '#6B6560', marginTop: 3 }}>{c.children} children · {c.coach}</div>
                    <div style={{ background: '#EFEBE6', borderRadius: 999, height: 6, marginTop: 7 }}>
                      <div style={{ width: `${(c.week / 10) * 100}%`, height: '100%', background: c.week === 10 ? '#187A3C' : TP_RED, borderRadius: 999 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 12.5, color: '#8A847E' }}>No cohorts yet — {selected.status === 'enquiry' ? 'enquiry stage' : 'awaiting programme start'}.</div>
            )}
            {d && d.attendanceTrend.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: TP_DARK, letterSpacing: 0.5, marginBottom: 7 }}>
                  <TrendingUp size={12} style={{ verticalAlign: '-2px', marginRight: 5 }} />ATTENDANCE BY WEEK (%)
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 64 }}>
                  {d.attendanceTrend.map((v, i) => (
                    <div key={i} style={{ flex: 1, height: `${(v / maxAtt) * 100}%`, background: i === d.attendanceTrend.length - 1 ? TP_RED : '#E8B4B3', borderRadius: '3px 3px 0 0' }} title={`W${i + 1}: ${v}%`} />
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Fundraising (when applicable) */}
        {d?.fundraising && (
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
              <SectionTitle sub={`${d.fundraising.supporters} supporters — feeds the public page and match-funding triggers`}>
                <PoundSterling size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Fundraising campaign
              </SectionTitle>
              <a href="/fundraise/st-clements-demo" target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 800, color: '#fff', background: TP_RED, borderRadius: 8, padding: '8px 13px', textDecoration: 'none' }}>View public page</a>
            </div>
            <Thermometer raised={d.fundraising.raised} target={d.fundraising.target} height={16} />
          </Card>
        )}

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
        <SectionTitle sub="Every partner school — profile, programme, stats and actions in one place">Schools</SectionTitle>
        <button style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: TP_RED, color: '#fff', border: 'none', borderRadius: 9, padding: '9px 14px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>
          <School size={14} /> Add school
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {SCHOOLS.map(s => {
          const d = SCHOOL_DETAILS[s.id]
          return (
            <Card key={s.id} style={{ padding: 16, cursor: 'pointer' }}>
              <div onClick={() => setSelected(s)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: TP_DARK }}>
                    <School size={14} style={{ verticalAlign: '-2px', marginRight: 6, color: TP_RED }} />{s.name}
                  </div>
                  <Pill tone={STATUS_TONE[s.status]}>{s.status.toUpperCase()}</Pill>
                </div>
                <div style={{ fontSize: 11.5, color: '#6B6560', marginTop: 4 }}>{s.borough} · {s.headTeacher} · {d?.funding.split('—')[0]}</div>
                <div style={{ fontSize: 12, color: '#5B554F', marginTop: 8, background: '#F7F5F2', borderRadius: 9, padding: '8px 11px' }}>{s.note}</div>
                <div style={{ display: 'flex', gap: 16, marginTop: 10, borderTop: '1px solid #F0EBE5', paddingTop: 10, alignItems: 'center' }}>
                  {([
                    [s.children ?? '—', 'CHILDREN'],
                    [d?.activationPct ? `${d.activationPct}%` : '—', 'ACTIVATED'],
                    [d?.conversionPct ? `${d.conversionPct}%` : '—', 'CONVERTED'],
                  ] as [string | number, string][]).map(([v, l]) => (
                    <div key={l}>
                      <div style={{ fontSize: 15, fontWeight: 900, color: TP_RED }}>{v}</div>
                      <div style={{ fontSize: 8, color: '#8A847E', fontWeight: 800, letterSpacing: 0.5 }}>{l}</div>
                    </div>
                  ))}
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
