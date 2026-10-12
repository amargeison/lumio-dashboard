'use client'

// HQ Families — every household and its children in one place: who the
// guardian is, how to reach them, consents, medical flags, fees and whether
// they've opted out of comms. Live portals read tp_families + tp_children
// (via ctx.people); the demo derives its households from the demo dataset.
// Read-only here — households are created and updated by the importer and
// registration.

import React, { useMemo, useState } from 'react'
import { Users, Search, HeartPulse, Camera, CameraOff, MailX, Phone, Mail } from 'lucide-react'
import { Card, SectionTitle, Pill, EmptyState } from './ui'
import { TP_RED, TP_DARK } from '@/data/tenproject/demo-data'
import { useImpact, type ImpactFamily } from './ImpactDataContext'

const FEE_TONE: Record<string, 'green' | 'amber' | 'red' | 'grey'> = { paid: 'green', deposit: 'amber', due: 'red', waived: 'grey', unknown: 'grey' }

export default function FamiliesTab() {
  const { people, data } = useImpact()
  const [q, setQ] = useState('')

  // Demo: households from the demo's weekend register (no live tables there).
  const families: ImpactFamily[] = useMemo(() => people?.families ?? data.WEEKEND_FAMILIES.map(f => ({
    id: f.id, guardian: `${f.family} family`, email: null, phone: null, consentData: true, consentPhoto: true, unsubscribed: false,
    children: f.children.split('+').map((n, i) => ({ id: `${f.id}-${i}`, name: `${n.trim()} ${f.family}`, age: null, yearGroup: null, school: null, medical: null, photoConsent: true, feeStatus: 'unknown', stickers: 0 })),
  })), [people, data.WEEKEND_FAMILIES])
  const unlinked = people?.unlinkedChildren ?? []

  const shown = families.filter(f => !q || `${f.guardian} ${f.email ?? ''} ${f.children.map(c => c.name).join(' ')}`.toLowerCase().includes(q.toLowerCase()))
  const kids = families.flatMap(f => f.children).concat(unlinked)
  const stats: [string, number][] = [
    ['FAMILIES', families.length],
    ['CHILDREN', kids.length],
    ['MEDICAL FLAGS', kids.filter(c => c.medical && !/^(none|no|n\/?a|na|-|ok)$/i.test(c.medical.trim())).length],
    ['NO PHOTO CONSENT', kids.filter(c => c.photoConsent !== true).length],
    ['OPTED OUT OF COMMS', families.filter(f => f.unsubscribed).length],
  ]

  if (!families.length && !unlinked.length) {
    return <Card><EmptyState icon={Users} title="No families yet" sub="Households and their children appear here once families register or you import them (Settings → Import data)." /></Card>
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {stats.map(([l, v]) => (
          <Card key={l} style={{ padding: '13px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#8A847E', letterSpacing: 0.8 }}>{l}</div>
            <div style={{ fontSize: 23, fontWeight: 900, color: TP_DARK, marginTop: 3 }}>{v}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #E7E2DC', borderRadius: 10, padding: '8px 12px' }}>
        <Search size={14} style={{ color: '#8A847E' }} />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search guardians, children or emails" style={{ flex: 1, border: 'none', outline: 'none', fontSize: 12.5, background: 'transparent', color: TP_DARK }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {shown.map(f => (
          <Card key={f.id} style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ fontSize: 13.5, fontWeight: 900, color: TP_DARK }}>{f.guardian}</div>
              {f.unsubscribed && <Pill tone="grey"><MailX size={10} style={{ verticalAlign: '-1px', marginRight: 3 }} />OPTED OUT</Pill>}
            </div>
            <div style={{ fontSize: 11, color: '#6B6560', marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {f.email && <span><Mail size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />{f.email}</span>}
              {f.phone && <span><Phone size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />{f.phone}</span>}
              {!f.email && !f.phone && <span>No contact details yet</span>}
            </div>
            <div style={{ display: 'grid', gap: 6, marginTop: 10, borderTop: '1px solid #F0EBE5', paddingTop: 10 }}>
              {f.children.length === 0 && <div style={{ fontSize: 11.5, color: '#8A847E' }}>No children linked</div>}
              {f.children.map(c => (
                <div key={c.id} style={{ background: '#F7F5F2', borderRadius: 9, padding: '8px 10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: TP_DARK }}>{c.name}</span>
                    <Pill tone={FEE_TONE[c.feeStatus] ?? 'grey'}>{c.feeStatus.toUpperCase()}</Pill>
                  </div>
                  <div style={{ fontSize: 10.5, color: '#6B6560', marginTop: 3, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {[c.age !== null ? `${c.age} yrs` : null, c.yearGroup, c.school].filter(Boolean).join(' · ') || 'Details not recorded'}
                    <span style={{ color: c.photoConsent === true ? '#187A3C' : TP_RED, fontWeight: 700 }}>
                      {c.photoConsent === true ? <><Camera size={10} style={{ verticalAlign: '-1px', marginRight: 3 }} />Photos OK</> : <><CameraOff size={10} style={{ verticalAlign: '-1px', marginRight: 3 }} />No photos</>}
                    </span>
                  </div>
                  {c.medical && !/^(none|no|n\/?a|na|-|ok)$/i.test(c.medical.trim()) && (
                    <div style={{ fontSize: 10.5, color: '#9A6A0B', marginTop: 3, fontWeight: 700 }}><HeartPulse size={10} style={{ verticalAlign: '-1px', marginRight: 3 }} />{c.medical}</div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {unlinked.length > 0 && (
        <Card>
          <SectionTitle sub="Children imported without a guardian we could match — link them when the family registers">Children without a family</SectionTitle>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{unlinked.map(c => <Pill key={c.id} tone="grey">{c.name}</Pill>)}</div>
        </Card>
      )}
      <div style={{ fontSize: 11, color: '#8A847E' }}>No photo consent recorded is treated as <strong style={{ color: TP_RED }}>no photos</strong> until a guardian confirms.</div>
    </div>
  )
}
