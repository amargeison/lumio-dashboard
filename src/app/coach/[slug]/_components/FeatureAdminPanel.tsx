'use client'

// Admin / dev control surface for the coach product plan & feature flags.
// Pick a tier preset (Essential / Pro Lite / Pro / Elite) or flip individual
// features. Turning a feature off removes its whole module and linked data
// across the portal AND the student/parent app.

import { useEffect, useState } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import {
  TIERS, FEATURE_LABELS, getFlags, setFlag, applyTier, tierForFlags,
  subscribe, type FeatureFlags, type FeatureKey,
} from '../_lib/feature-flags'

type Common = { T: ThemeTokens; accent: AccentTokens; density: Density }
const FEATURE_ORDER: FeatureKey[] = ['effort', 'video', 'audio', 'racket']

export function FeatureAdminPanel({ T, accent, density }: Common) {
  const [flags, setFlags] = useState<FeatureFlags>({ effort: true, video: true, audio: true, racket: true })
  useEffect(() => { const r = () => setFlags(getFlags()); r(); return subscribe(r) }, [])
  const activeTier = tierForFlags(flags)

  return (
    <div style={{ background: T.panel, border: `1px solid ${accent.border}`, borderRadius: 14, padding: density.pad + 2, marginBottom: density.gap }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', background: accent.dim }}><Icon name="settings" size={15} stroke={1.7} style={{ color: accent.hex }} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Plan &amp; features <span style={{ fontSize: 9.5, fontWeight: 700, color: accent.hex, background: accent.dim, padding: '2px 6px', borderRadius: 5, textTransform: 'uppercase', letterSpacing: '0.06em', marginLeft: 4 }}>Admin</span></div>
          <div style={{ fontSize: 11.5, color: T.text3, marginTop: 2 }}>Choose which features are live. Turning one off removes its module and linked data — including the student app.</div>
        </div>
      </div>

      {/* Tier presets */}
      <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, margin: '14px 0 8px' }}>Tier</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
        {TIERS.map(t => {
          const on = activeTier === t.key
          return (
            <button key={t.key} onClick={() => applyTier(t.key)}
              style={{ appearance: 'none', textAlign: 'left', cursor: 'pointer', borderRadius: 11, padding: '11px 13px', border: `1.5px solid ${on ? accent.hex : T.border}`, background: on ? accent.dim : T.panel2 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: on ? accent.hex : T.text }}>{t.name}</span>
                <span className="tnum" style={{ fontSize: 12, fontWeight: 700, color: T.text2 }}>£{t.price}<span style={{ fontSize: 9, color: T.text3 }}>/mo</span></span>
              </div>
              <div style={{ fontSize: 10.5, color: T.text3, marginTop: 4, lineHeight: 1.4 }}>{t.tagline}</div>
            </button>
          )
        })}
      </div>
      {activeTier === null && <div style={{ fontSize: 10.5, color: T.warn, marginTop: 8 }}>Custom mix — doesn&apos;t match a standard tier.</div>}

      {/* Individual feature toggles */}
      <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, margin: '16px 0 8px' }}>Features</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {FEATURE_ORDER.map(key => {
          const on = flags[key]
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, border: `1px solid ${T.border}`, background: T.panel2 }}>
              <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: T.text }}>{FEATURE_LABELS[key]}</span>
              <button onClick={() => setFlag(key, !on)} role="switch" aria-checked={on}
                style={{ appearance: 'none', cursor: 'pointer', border: 0, width: 42, height: 24, borderRadius: 999, background: on ? accent.hex : T.hover, position: 'relative', transition: 'background .15s' }}>
                <span style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .15s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
              </button>
              <span style={{ fontSize: 10, fontFamily: FONT, fontWeight: 700, width: 26, color: on ? T.good : T.text3, textTransform: 'uppercase' }}>{on ? 'On' : 'Off'}</span>
            </div>
          )
        })}
      </div>
      <div style={{ fontSize: 10.5, color: T.text3, marginTop: 10, lineHeight: 1.5 }}>
        Off-features disappear from the sidebar, the dashboard and the student app, and their kit drops out of the restock and reward flows. Demo — saved on this device.
      </div>
    </div>
  )
}
