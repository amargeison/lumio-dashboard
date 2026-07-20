'use client'

import React, { useEffect, useState } from 'react'
import { AlertCircle, Info, TrendingUp, Users, School, ClipboardList, ShieldCheck, PoundSterling, BarChart3, LayoutDashboard, MapPin, Settings, Send, Share2, Package } from 'lucide-react'
import { Card, SectionTitle, Stat, Pill, Thermometer } from './ui'
import Insights from './Insights'
import { CoachesTab, TenorsTab } from './PeopleViews'
import SchoolsTab from './SchoolsTab'
import VenuesTab from './VenuesTab'
import SettingsTab from './SettingsTab'
import CommsTab from './CommsTab'
import SocialTab from './SocialTab'
import EquipmentTab from './EquipmentTab'
import { openFunderDoc } from '../_lib/funder-docs'
import {
  TP_RED, TP_DARK, SCHOOLS, VENUES, HQ_STATS, FUNNEL, IMPACT_AREAS, NEEDS_ATTENTION, CAMPAIGN,
} from '@/data/tenproject/demo-data'

const STATUS_TONE: Record<string, 'red' | 'green' | 'amber' | 'grey' | 'dark'> = {
  running: 'green',
  fundraising: 'red',
  confirmed: 'dark',
  enquiry: 'grey',
  complete: 'amber',
}

export type HqTab = 'overview' | 'insights' | 'schools' | 'venues' | 'coaches' | 'tenors' | 'comms' | 'social' | 'equipment' | 'settings'

export const HQ_SECTIONS: { id: HqTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'insights', label: 'Insights' },
  { id: 'schools', label: 'Schools' },
  { id: 'venues', label: 'Venues' },
  { id: 'coaches', label: 'Coaches' },
  { id: 'tenors', label: 'TENORs' },
  { id: 'comms', label: 'Comms' },
  { id: 'social', label: 'Social' },
  { id: 'equipment', label: 'Equipment & Kit' },
  { id: 'settings', label: 'Settings' },
]

export default function HQView({ section, onSectionChange }: {
  /** Controlled mode — the portal sidebar drives the section and the internal tab bar is hidden. */
  section?: HqTab
  onSectionChange?: (s: HqTab) => void
}) {
  const [tab, setTabState] = useState<HqTab>(section ?? 'overview')
  const [openId, setOpenId] = useState<string | undefined>(undefined)
  const controlled = section !== undefined

  useEffect(() => {
    if (section !== undefined) { setTabState(section); setOpenId(undefined) }
  }, [section])

  function setTab(t: HqTab) {
    setTabState(t)
    onSectionChange?.(t)
  }

  // Overview sections deep-link into tabs (click a school → that school's page)
  function goTo(target: HqTab, id?: string) {
    setOpenId(id)
    setTabState(target)
    onSectionChange?.(target)
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* HQ tabs (hidden when the sidebar drives sections) */}
      {!controlled && (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {([
          { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
          { id: 'insights' as const, label: 'Insights', icon: BarChart3 },
          { id: 'schools' as const, label: 'Schools', icon: School },
          { id: 'venues' as const, label: 'Venues', icon: MapPin },
          { id: 'coaches' as const, label: 'Coaches', icon: ShieldCheck },
          { id: 'tenors' as const, label: 'TENORs', icon: Users },
          { id: 'comms' as const, label: 'Communications', icon: Send },
          { id: 'social' as const, label: 'Social', icon: Share2 },
          { id: 'equipment' as const, label: 'Equipment', icon: Package },
          { id: 'settings' as const, label: 'Settings', icon: Settings },
        ]).map(t => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => { setOpenId(undefined); setTab(t.id) }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: active ? TP_DARK : '#fff', color: active ? '#fff' : TP_DARK, border: '1px solid #E7E2DC', borderRadius: 10, padding: '9px 16px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}
            >
              <Icon size={14} /> {t.label}
            </button>
          )
        })}
      </div>
      )}

      {tab === 'insights' && <Insights />}
      {tab === 'schools' && <SchoolsTab initialId={openId} />}
      {tab === 'coaches' && <CoachesTab />}
      {tab === 'tenors' && <TenorsTab />}
      {tab === 'venues' && <VenuesTab initialId={openId} />}
      {tab === 'comms' && <CommsTab />}
      {tab === 'social' && <SocialTab />}
      {tab === 'equipment' && <EquipmentTab />}
      {tab === 'settings' && <SettingsTab />}

      {tab === 'overview' && (<>
      {/* Programme health stats */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Stat label="Children reached this week" value={HQ_STATS.childrenThisWeek} accent />
        <Stat label="Programmes running" value={HQ_STATS.schoolsRunning} />
        <Stat label="Schools in pipeline" value={HQ_STATS.schoolsPipeline} />
        <Stat label="Weekend visits this term" value={HQ_STATS.weekendVisitsThisTerm} />
        <Stat label="Registers outstanding" value={HQ_STATS.registersOutstanding} accent />
        <Stat label="DBS/certs expiring soon" value={HQ_STATS.dbsExpiring} />
      </div>

      {/* Needs attention */}
      <Card>
        <SectionTitle sub="The programme-health briefing — registers, renewals, compliance and fundraising triggers in one list">
          Needs attention
        </SectionTitle>
        <div style={{ display: 'grid', gap: 8 }}>
          {NEEDS_ATTENTION.map(item => (
            <button key={item.id} onClick={() => goTo(item.target.tab as HqTab, item.target.id)} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: item.kind === 'warn' ? '#FDF3F3' : '#F7F5F2', border: 'none', borderRadius: 10, padding: '10px 12px', cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'inherit' }}>
              {item.kind === 'warn'
                ? <AlertCircle size={16} style={{ color: TP_RED, flexShrink: 0, marginTop: 1 }} />
                : <Info size={16} style={{ color: '#6B6560', flexShrink: 0, marginTop: 1 }} />}
              <div style={{ flex: 1, fontSize: 13, color: TP_DARK }}>{item.text}</div>
              <span style={{ fontSize: 11, fontWeight: 900, color: TP_RED, flexShrink: 0 }}>Open →</span>
            </button>
          ))}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        {/* Schools & programmes */}
        <Card>
          <SectionTitle sub="Enquiry → fundraising → confirmed → running → complete → renewal">
            <School size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Schools & programmes
          </SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#6B6560', fontSize: 11 }}>
                <th style={{ padding: '6px 4px' }}>School</th>
                <th style={{ padding: '6px 4px' }}>Status</th>
                <th style={{ padding: '6px 4px' }}>Children</th>
                <th style={{ padding: '6px 4px' }}>Activation</th>
                <th style={{ padding: '6px 4px' }}>Note</th>
              </tr>
            </thead>
            <tbody>
              {SCHOOLS.map(s => (
                <tr key={s.id} onClick={() => goTo('schools', s.id)} style={{ borderTop: '1px solid #F0EBE5', cursor: 'pointer' }}>
                  <td style={{ padding: '8px 4px', fontWeight: 700, color: TP_DARK }}>{s.name} <span style={{ color: TP_RED, fontWeight: 900, fontSize: 11 }}>→</span><div style={{ fontWeight: 400, fontSize: 11, color: '#8A847E' }}>{s.borough} · {s.headTeacher}</div></td>
                  <td style={{ padding: '8px 4px' }}><Pill tone={STATUS_TONE[s.status]}>{s.status.toUpperCase()}</Pill></td>
                  <td style={{ padding: '8px 4px' }}>{s.children ?? '—'}</td>
                  <td style={{ padding: '8px 4px' }}>{s.activation ? `${s.activation}%` : '—'}</td>
                  <td style={{ padding: '8px 4px', color: '#6B6560' }}>{s.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
          {/* Conversion funnel */}
          <Card>
            <SectionTitle sub="School → weekend — the metric that matters (per school in the full build)">
              <TrendingUp size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Conversion funnel
            </SectionTitle>
            <div style={{ display: 'grid', gap: 7 }}>
              {FUNNEL.map(f => (
                <div key={f.stage}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 3 }}>
                    <span style={{ fontWeight: 600, color: TP_DARK }}>{f.stage}</span>
                    <span style={{ color: '#6B6560' }}>{f.n} · {f.pct}%</span>
                  </div>
                  <div style={{ background: '#EFEBE6', borderRadius: 999, height: 8 }}>
                    <div style={{ width: `${f.pct}%`, height: '100%', background: TP_RED, borderRadius: 999 }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Fundraising oversight */}
          <Card>
            <SectionTitle sub="Campaigns across unfunded schools, with match-funding triggers">
              <PoundSterling size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Fundraising oversight
            </SectionTitle>
            <button onClick={() => goTo('schools', 'stclements')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 12.5, fontWeight: 700, color: TP_DARK, marginBottom: 8, fontFamily: 'inherit' }}>{CAMPAIGN.school} <span style={{ color: TP_RED, fontWeight: 900, fontSize: 11 }}>→</span></button>
            <Thermometer raised={CAMPAIGN.raised} target={CAMPAIGN.target} height={16} />
            <div style={{ fontSize: 11.5, color: '#6B6560', marginTop: 8 }}>{CAMPAIGN.matchNote}</div>
          </Card>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Weekend venues */}
        <Card>
          <SectionTitle sub="Community sessions, TENOR cover and last register counts">
            <Users size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Weekend venues
          </SectionTitle>
          <div style={{ display: 'grid', gap: 8 }}>
            {VENUES.map(v => (
              <button key={v.id} onClick={() => goTo('venues', v.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F7F5F2', border: 'none', borderRadius: 10, padding: '10px 12px', cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'inherit' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: TP_DARK }}>{v.name} {v.external && <Pill tone="grey">LINKED VENUE</Pill>} <span style={{ color: TP_RED, fontWeight: 900, fontSize: 11 }}>→</span></div>
                  <div style={{ fontSize: 11.5, color: '#6B6560' }}>{v.day} {v.time} · {v.tenors} TENORs</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 17, fontWeight: 900, color: TP_RED }}>{v.lastCount}</div>
                  <div style={{ fontSize: 10.5, color: '#8A847E' }}>last register</div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Impact snapshot */}
        <Card>
          <SectionTitle sub="AI-drafted, funder-ready reports built from registers and family feedback">
            <ShieldCheck size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Impact & funder reporting
          </SectionTitle>
          <div style={{ fontSize: 12.5, color: TP_DARK, marginBottom: 10 }}>
            Family-reported impact areas this term:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {IMPACT_AREAS.map(a => <Pill key={a} tone="grey">{a}</Pill>)}
          </div>
          <button onClick={() => openFunderDoc('term-report')} style={{ marginTop: 14, background: TP_DARK, color: '#fff', border: 'none', borderRadius: 9, padding: '9px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            <ClipboardList size={14} /> Draft term report for funders (AI)
          </button>
        </Card>
      </div>
      </>)}
    </div>
  )
}
