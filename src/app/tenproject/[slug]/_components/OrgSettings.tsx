'use client'

// Per-org Settings cards for /impact portals — the Impact counterpart of the
// Tennis Coach Settings (SettingsPanel "Modules" grid + academy details).
//   OrgDetailsCard — the org's own name, contact email, logo etc. Blank on a
//                    fresh org; saved to impact_orgs.settings by its HQ.
//   ModulesCard    — every module on/off; off removes it from the sidebar
//                    (and its role view). Overview + Settings always on.
// Read-only unless the signed-in user is this org's HQ (demo always read-only).

import React, { useEffect, useState } from 'react'
import { Building2, LayoutGrid, Lock, CheckCircle } from 'lucide-react'
import { Card, SectionTitle, Pill } from './ui'
import { TP_RED, TP_DARK } from '@/data/tenproject/demo-data'
import { useImpact } from './ImpactDataContext'
import { impactModules, moduleOn, type ImpactOrgSettings } from '@/lib/impact/org'

const FIELDS: { key: keyof ImpactOrgSettings; label: string; placeholder: string }[] = [
  { key: 'org', label: 'Organisation name', placeholder: 'e.g. Northvale Sport Foundation' },
  { key: 'legal', label: 'Legal name', placeholder: 'As registered — e.g. … Ltd / CIO' },
  { key: 'email', label: 'Contact email', placeholder: 'info@yourorg.org.uk' },
  { key: 'address', label: 'Registered address', placeholder: 'Street, town, postcode' },
  { key: 'domain', label: 'Website', placeholder: 'yourorg.org.uk' },
  { key: 'logo', label: 'Logo (image URL)', placeholder: 'https://… or /path.png' },
  { key: 'volunteer', label: 'Volunteer role name', placeholder: 'e.g. Volunteer, Court Captain' },
  { key: 'tagline', label: 'Tagline', placeholder: 'Optional' },
]

function Notice({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start', fontSize: 11.5, color: '#6B6560', background: '#F7F5F2', borderRadius: 9, padding: '9px 11px', marginBottom: 10 }}>
      <Lock size={13} style={{ flexShrink: 0, marginTop: 1 }} /> {text}
    </div>
  )
}

export function OrgDetailsCard() {
  const { org, brand } = useImpact()
  const [draft, setDraft] = useState<ImpactOrgSettings>(org?.settings ?? {})
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  useEffect(() => { setDraft(org?.settings ?? {}) }, [org?.settings])
  if (!org) return null
  const editable = org.canEdit
  // Demo shows its fictional details; live shows exactly what's saved.
  const value = (k: keyof ImpactOrgSettings) => {
    const v = draft[k]
    if (typeof v === 'string') return v
    if (org.slug === 'demo') return k === 'org' ? brand.org : k === 'legal' ? brand.legal : k === 'domain' ? brand.domain : k === 'address' ? brand.address : k === 'volunteer' ? brand.volunteer : k === 'tagline' ? brand.tagline : ''
    return ''
  }
  async function save() {
    if (!org) return
    setState('saving')
    const r = await org.save({ ...org.settings, ...draft, modules: org.settings.modules ?? {} })
    setState(r.ok ? 'saved' : 'error')
  }
  const field = { width: '100%', border: '1px solid #E7E2DC', borderRadius: 8, padding: '8px 10px', fontSize: 12.5, outline: 'none', background: editable ? '#fff' : '#F7F5F2', color: TP_DARK, fontFamily: 'inherit' } as const

  return (
    <Card>
      <SectionTitle sub="Your organisation’s own details — used across the portal, parent app and generated documents">
        <Building2 size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Organisation
      </SectionTitle>
      {!editable && org.readOnlyReason && <Notice text={org.readOnlyReason} />}
      <div style={{ display: 'grid', gap: 9 }}>
        {FIELDS.map(f => (
          <label key={f.key} style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 10.5, fontWeight: 800, color: '#8A847E', letterSpacing: 0.4 }}>{f.label.toUpperCase()}</span>
            <input value={value(f.key)} placeholder={f.placeholder} readOnly={!editable}
              onChange={e => { setState('idle'); setDraft(d => ({ ...d, [f.key]: e.target.value })) }} style={field} />
          </label>
        ))}
      </div>
      {editable && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 12 }}>
          <button onClick={save} disabled={state === 'saving'} style={{ background: TP_RED, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 15px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
            {state === 'saving' ? 'Saving…' : 'Save details'}
          </button>
          {state === 'saved' && <span style={{ fontSize: 11.5, color: '#187A3C', fontWeight: 800 }}><CheckCircle size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} />Saved</span>}
          {state === 'error' && <span style={{ fontSize: 11.5, color: TP_RED, fontWeight: 800 }}>Couldn’t save — try again</span>}
        </div>
      )}
    </Card>
  )
}

export function ModulesCard() {
  const { org, brand } = useImpact()
  const [busy, setBusy] = useState<string | null>(null)
  if (!org) return null
  const modules = impactModules(brand)
  const shown = modules.filter(m => moduleOn(org.settings, m.id)).length
  async function toggle(id: string, next: boolean) {
    if (!org || !org.canEdit) return
    setBusy(id)
    await org.save({ ...org.settings, modules: { ...(org.settings.modules ?? {}), [id]: next } })
    setBusy(null)
  }
  async function showAll() {
    if (!org || !org.canEdit) return
    setBusy('all')
    await org.save({ ...org.settings, modules: {} })
    setBusy(null)
  }

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
        <SectionTitle sub="Pick the modules your organisation uses — switched-off modules disappear from the sidebar for everyone in this portal">
          <LayoutGrid size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Modules
        </SectionTitle>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Pill tone="grey">{shown} OF {modules.length} SHOWN</Pill>
          {org.canEdit && shown < modules.length && (
            <button onClick={showAll} disabled={busy !== null} style={{ background: '#fff', color: TP_DARK, border: '1px solid #E7E2DC', borderRadius: 8, padding: '6px 11px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Show all</button>
          )}
        </div>
      </div>
      {!org.canEdit && org.readOnlyReason && <Notice text={org.readOnlyReason} />}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 9 }}>
        {modules.map(m => {
          const isOn = moduleOn(org.settings, m.id)
          const canToggle = org.canEdit && !m.locked && busy === null
          return (
            <div key={m.id} style={{ background: isOn ? '#fff' : '#F7F5F2', border: `1px solid ${isOn ? '#E7E2DC' : '#EFEBE6'}`, borderRadius: 11, padding: '11px 12px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 900, color: isOn ? TP_DARK : '#8A847E' }}>{m.label}</div>
                <div style={{ fontSize: 10.5, color: '#8A847E', marginTop: 2, lineHeight: 1.4 }}>{m.locked ? 'Always shown' : isOn ? 'Shown in the sidebar' : 'Hidden from the sidebar'} · {m.desc}</div>
              </div>
              <button
                onClick={() => toggle(m.id, !isOn)}
                disabled={!canToggle}
                aria-pressed={isOn}
                aria-label={`${isOn ? 'Hide' : 'Show'} ${m.label}`}
                style={{ width: 38, height: 22, borderRadius: 999, border: 'none', cursor: canToggle ? 'pointer' : 'default', background: isOn ? TP_RED : '#D9D3CC', opacity: m.locked ? 0.5 : 1, position: 'relative', flexShrink: 0 }}>
                <span style={{ position: 'absolute', top: 3, left: isOn ? 19 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .15s' }} />
              </button>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
