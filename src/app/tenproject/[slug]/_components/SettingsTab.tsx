'use client'

// HQ Settings — organisation, branding, integrations, comms, roles, data.
// Toggles are live in-session (demo state); production persists per-org.

import React, { useEffect, useState } from 'react'
import { Building2, Palette, Plug, Bell, Users, ShieldCheck, Moon, MessageSquare } from 'lucide-react'
import { Card, SectionTitle, Pill } from './ui'
import { TP_RED, TP_DARK } from '@/data/tenproject/demo-data'

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} aria-pressed={on} style={{ width: 42, height: 24, borderRadius: 999, border: 'none', cursor: 'pointer', background: on ? TP_RED : '#D9D3CC', position: 'relative', transition: 'background .15s', flexShrink: 0 }}>
      <span style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .15s' }} />
    </button>
  )
}

function Row({ label, desc, on, onChange }: { label: string; desc: string; on: boolean; onChange: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #F0EBE5' }}>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: TP_DARK }}>{label}</div>
        <div style={{ fontSize: 11, color: '#8A847E', marginTop: 2 }}>{desc}</div>
      </div>
      <Toggle on={on} onChange={onChange} />
    </div>
  )
}

export default function SettingsTab() {
  const [t, setT] = useState<Record<string, boolean>>({
    weeklyComms: true, sessionAlerts: true, dbsAlerts: true, fundingAlerts: true, digest: false,
    stripe: false, mailchimp: true, gcal: true, ms365: false, clubspark: true,
    photoDefault: false, retention: true, autoMaster: true, quietHours: true,
  })
  const flip = (k: string) => () => setT(prev => ({ ...prev, [k]: !prev[k] }))

  // Paper is the default; Dark mode is the per-device opt-in.
  // Key 'tp_dark' is only ever set when dark is explicitly chosen.
  const [darkMode, setDarkMode] = useState(false)
  useEffect(() => {
    if (typeof window !== 'undefined') setDarkMode(localStorage.getItem('tp_dark') === '1')
  }, [])
  function toggleDarkMode() {
    const next = !darkMode
    setDarkMode(next)
    if (next) localStorage.setItem('tp_dark', '1')
    else localStorage.removeItem('tp_dark')
    window.dispatchEvent(new Event('tp-theme'))
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Appearance */}
      <Card>
        <SectionTitle><Moon size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Appearance</SectionTitle>
        <Row label="Dark mode" desc="Darkens the whole portal on this device — logos, photos and documents stay true-colour" on={darkMode} onChange={toggleDarkMode} />
      </Card>

      {/* Communications */}
      <Card>
        <SectionTitle sub="Sender identity, channels and automation rules for the Communications centre">
          <MessageSquare size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Communications
        </SectionTitle>
        <div style={{ display: 'grid', gap: 10, fontSize: 12.5, marginBottom: 6 }}>
          {([
            ['Sender name', 'Ten Project'],
            ['Reply-to', 'info@tenproject.org.uk'],
            ['Newsletter footer', 'Charity details · unsubscribe · preference centre (auto-added)'],
          ] as [string, string][]).map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid #F0EBE5', paddingBottom: 8 }}>
              <span style={{ color: '#8A847E', fontWeight: 700 }}>{l}</span>
              <span style={{ fontWeight: 800, color: TP_DARK, textAlign: 'right' }}>{v}</span>
            </div>
          ))}
        </div>
        <Row label="Automations enabled" desc="Master switch for all comms automations (weekly sends, sticker notifications, register chasing)" on={t.autoMaster} onChange={flip('autoMaster')} />
        <Row label="Quiet hours (8pm–8am)" desc="Non-urgent messages queue overnight; session cancellations always send" on={t.quietHours} onChange={flip('quietHours')} />
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Organisation */}
        <Card>
          <SectionTitle><Building2 size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Organisation</SectionTitle>
          <div style={{ display: 'grid', gap: 10, fontSize: 12.5 }}>
            {([
              ['Organisation', 'Ten Project Ltd'],
              ['Registered address', '7 Cranmer Close, Morden, London, SM4 4SU'],
              ['Programme admin', 'Harry Lloyd — harry@tenproject.org.uk'],
              ['Safeguarding lead', 'HQ safeguarding lead · 07700 900789'],
              ['Demo PIN', '••••••'],
            ] as [string, string][]).map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid #F0EBE5', paddingBottom: 8 }}>
                <span style={{ color: '#8A847E', fontWeight: 700 }}>{l}</span>
                <span style={{ fontWeight: 800, color: TP_DARK, textAlign: 'right' }}>{v}</span>
              </div>
            ))}
          </div>
          <button style={{ marginTop: 12, background: '#fff', color: TP_DARK, border: '1px solid #E7E2DC', borderRadius: 8, padding: '8px 14px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer' }}>Edit details</button>
        </Card>

        {/* Branding */}
        <Card>
          <SectionTitle><Palette size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Branding</SectionTitle>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', background: '#F7F5F2', borderRadius: 12, padding: '14px 16px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/tenproject_logo.png" alt="Ten Project" style={{ height: 40, width: 'auto' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              {['#D7262C', '#111114', '#F7F5F2'].map(c => (
                <div key={c} style={{ width: 26, height: 26, borderRadius: 7, background: c, border: '1px solid #E7E2DC' }} title={c} />
              ))}
            </div>
          </div>
          <div style={{ fontSize: 11.5, color: '#6B6560', marginTop: 10, lineHeight: 1.55 }}>
            Logo and colours flow through the portal, parent app, public fundraising pages and every
            generated document (funder packs, governor packs, event resources). Schools add their own
            crest during onboarding for co-branded fundraising pages.
          </div>
          <button style={{ marginTop: 10, background: '#fff', color: TP_DARK, border: '1px solid #E7E2DC', borderRadius: 8, padding: '8px 14px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer' }}>Upload new logo</button>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Integrations */}
        <Card>
          <SectionTitle sub="Connected services — the same integration layer as the Lumio coach platform">
            <Plug size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Integrations
          </SectionTitle>
          <Row label="Stripe (donations & pledges)" desc="Powers online fundraising — pending the receiving-entity decision" on={t.stripe} onChange={flip('stripe')} />
          <Row label="Mailchimp import" desc="One-off import of the existing family mailing list" on={t.mailchimp} onChange={flip('mailchimp')} />
          <Row label="Google Calendar sync" desc="Coach / TENOR / school calendars stay in sync automatically" on={t.gcal} onChange={flip('gcal')} />
          <Row label="Microsoft 365 sync" desc="Calendar + email for schools on Outlook" on={t.ms365} onChange={flip('ms365')} />
          <Row label="Partner booking platform (linked venues)" desc="External-booking hand-off for partner-run park sessions" on={t.clubspark} onChange={flip('clubspark')} />
        </Card>

        {/* Notifications */}
        <Card>
          <SectionTitle sub="What HQ gets told about, and when">
            <Bell size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Notifications
          </SectionTitle>
          <Row label="Weekly parent comms" desc="Scoped session confirmations every Mon + Thu in term time" on={t.weeklyComms} onChange={flip('weeklyComms')} />
          <Row label="Missing register alerts" desc="Flag any session without a submitted register by 6pm" on={t.sessionAlerts} onChange={flip('sessionAlerts')} />
          <Row label="DBS & certificate expiry alerts" desc="60 / 30 / 7 days before any coach or TENOR document lapses" on={t.dbsAlerts} onChange={flip('dbsAlerts')} />
          <Row label="Fundraising triggers" desc="Match-funding thresholds and campaign completions" on={t.fundingAlerts} onChange={flip('fundingAlerts')} />
          <Row label="Weekly HQ digest" desc="Monday-morning programme-health email" on={t.digest} onChange={flip('digest')} />
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Roles */}
        <Card>
          <SectionTitle sub="Who sees what — enforced across portal, app and public pages">
            <Users size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Roles & access
          </SectionTitle>
          <div style={{ display: 'grid', gap: 7 }}>
            {([
              ['HQ / Programme admin', 'Everything', 'red'],
              ['Coach', 'Their schools, registers, resources, own compliance', 'grey'],
              ['TENOR', 'Their venue, register, resources', 'grey'],
              ['School', 'Their cohorts, results, fundraising dashboard', 'grey'],
              ['Parent', 'Their children only — booklet, sessions, messages', 'grey'],
            ] as [string, string, 'red' | 'grey'][]).map(([role, scope, tone]) => (
              <div key={role} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, background: '#F7F5F2', borderRadius: 9, padding: '9px 12px' }}>
                <Pill tone={tone}>{role.toUpperCase()}</Pill>
                <span style={{ fontSize: 11.5, color: '#5B554F', textAlign: 'right' }}>{scope}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Data & consent */}
        <Card>
          <SectionTitle sub="ICO Children’s Code defaults — consent and audit built in">
            <ShieldCheck size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Data & consent
          </SectionTitle>
          <Row label="Photography default: OFF" desc="Photos only where a family has explicitly consented — flag shown at every register" on={!t.photoDefault} onChange={flip('photoDefault')} />
          <Row label="Auto-retention policy" desc="Child records anonymised 2 years after last participation" on={t.retention} onChange={flip('retention')} />
          <div style={{ fontSize: 11.5, color: '#6B6560', marginTop: 10, background: '#F7F5F2', borderRadius: 9, padding: '9px 12px' }}>
            Consent records carry a full audit trail. Data processing agreement: Lumio (processor) · Ten Project Ltd (controller).
          </div>
        </Card>
      </div>
    </div>
  )
}
