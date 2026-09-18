'use client'

// A coach's Settings. Short, because almost nothing in the head coach's Settings
// belongs to a coach.
//
// What was here before was the ACADEMY's settings page: subscription tier, plan
// features, academy profile, booking calendar, availability & courts, pricing &
// packages. A coach owns none of that — the plan is the head coach's bill, the
// courts are the club's, the price list is the business's. Showing it invites
// them to change things that either fail silently against row level security or,
// worse, would change the whole academy for everybody.
//
// What IS theirs: who they are, how they're contacted, and what's in their boot.

import { useState } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { getSettings, setSettings } from '../_lib/settings-store'
import { CoachMyProfile } from './CoachMyProfile'
import { IntegrationsPanel } from './IntegrationsPanel'

export function CoachSettings({ T, accent, onNavigate }: {
  T: ThemeTokens; accent: AccentTokens; onNavigate?: (id: string) => void
}) {
  const [ui, setUi] = useState(() => getSettings())
  const apply = (patch: Record<string, unknown>) => { setSettings(patch); setUi(getSettings()) }

  const card: React.CSSProperties = { background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, marginBottom: 16 }
  const head: React.CSSProperties = { fontSize: 10.5, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }
  const select: React.CSSProperties = { padding: '8px 11px', borderRadius: 9, background: T.panel2, border: `1px solid ${T.border}`, color: T.text, fontSize: 13, fontFamily: FONT, cursor: 'pointer' }

  return (
    <div style={{ fontFamily: FONT, maxWidth: 680 }}>
      <h1 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: 0 }}>Settings</h1>
      <p style={{ color: T.text3, fontSize: 13, margin: '4px 0 22px' }}>
        Your profile and your kit. Your academy&rsquo;s plan, courts and pricing are set by your head coach.
      </p>

      <div style={card}>
        <div style={head}>You</div>
        <CoachMyProfile T={T} accent={accent} mode="settings" />
      </div>

      <div style={card}>
        <div style={head}>Connected accounts</div>
        <p style={{ color: T.text3, fontSize: 13, margin: '0 0 14px', lineHeight: 1.6 }}>
          Connect your own mailbox and calendar. Your bookings are written out to your calendar, and email can go out from your address rather than a generic one. This is yours alone — your head coach connects theirs separately, and neither of you sees the other’s inbox.
        </p>
        <IntegrationsPanel T={T} accent={accent} />
      </div>

      <div style={card}>
        <div style={head}>Your kit</div>
        <p style={{ color: T.text3, fontSize: 13, margin: '0 0 12px', lineHeight: 1.6 }}>
          Start from the club&rsquo;s equipment list or build your own — whatever is actually in your car boot. Yours to add to and edit; the club&rsquo;s list is left alone either way.
        </p>
        <button onClick={() => onNavigate?.('equipment')}
          style={{ appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: accent.hex, borderRadius: 9, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
          Open Equipment &amp; Kit →
        </button>
      </div>

      <div style={card}>
        <div style={head}>Appearance</div>
        <p style={{ color: T.text3, fontSize: 12, margin: '0 0 12px' }}>Saved on this device, so your phone and your laptop can differ.</p>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <label style={{ fontSize: 12.5, color: T.text2 }}>
            <div style={{ marginBottom: 5 }}>Theme</div>
            <select value={ui.theme} onChange={e => apply({ theme: e.target.value })} style={select}>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </label>
          <label style={{ fontSize: 12.5, color: T.text2 }}>
            <div style={{ marginBottom: 5 }}>Density</div>
            <select value={ui.density} onChange={e => apply({ density: e.target.value })} style={select}>
              <option value="compact">Compact</option>
              <option value="regular">Regular</option>
              <option value="spacious">Spacious</option>
            </select>
          </label>
        </div>
      </div>

      <p style={{ color: T.text3, fontSize: 11.5, lineHeight: 1.6, margin: 0 }}>
        Need your name, role or venues changed, or want access to something you can&rsquo;t see? That&rsquo;s your head coach — they set it from the Coaches page.
      </p>
    </div>
  )
}
