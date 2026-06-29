'use client'

// Settings → Player Development + Racket Progression System.
// The racket ladder and its skills are Lumio's standard framework: shown here
// read-only and centrally managed (a deliberate product decision — it keeps the
// pathway consistent and is the hook for a paid "custom academy pathway" upsell).
// Coaches see exactly what's tracked; bespoke ladders/skills/branding are
// available on request rather than self-serve editing.

import { useState, useEffect } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { RACKET_STAGES, RACKET_SKILLS } from '../_lib/coach-db'
import { seedLumioResources } from '../_lib/lumio-resources'
import { seedLumioPackages } from '../_lib/lumio-packages'
import { getSettings, setSettings } from '../_lib/settings-store'

export function CoachDevelopmentSettings({ T, accent }: { T: ThemeTokens; accent: AccentTokens }) {
  const card: React.CSSProperties = { background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18, marginBottom: 16, fontFamily: FONT }
  const lock = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 700, color: T.text3, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 999, padding: '2px 9px' }}>🔒 Lumio-managed</span>
  )

  return (
    <div>
      {/* Player Development */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.text }}>Player Development</h3>
          <span style={{ marginLeft: 'auto' }}>{lock}</span>
        </div>
        <p style={{ margin: '0 0 12px', fontSize: 12.5, color: T.text3, lineHeight: 1.5 }}>
          Player Development tracks each player against the racket framework and the data you already capture elsewhere in the portal. Nothing is fabricated — tiles show only what’s measurable.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
          {[
            ['Current racket & progress', 'From each player’s racket stage + skill grades'],
            ['Attendance', 'From the Roster attendance log'],
            ['Skills earned', 'Skills graded “Consistent” across all rackets'],
            ['Lessons', 'From Lesson Summaries'],
            ['Distance · Effort · Top speed', 'From GPS-watch sessions (— until data syncs)'],
          ].map(([t, d]) => (
            <div key={t} style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 11px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{t}</div>
              <div style={{ fontSize: 10.5, color: T.text3, marginTop: 3, lineHeight: 1.4 }}>{d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Racket Progression System */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.text }}>Racket Progression System</h3>
          <span style={{ marginLeft: 'auto' }}>{lock}</span>
        </div>
        <p style={{ margin: '0 0 12px', fontSize: 12.5, color: T.text3, lineHeight: 1.5 }}>
          The 9-racket ladder and the skills under each are Lumio’s standard, LTA-mapped framework — the same across every academy, so progress means the same thing everywhere. It’s read-only here by design.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {RACKET_STAGES.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 11px' }}>
              <span style={{ width: 20, height: 13, borderRadius: 3, background: s.colour, border: '1px solid rgba(128,128,128,0.4)', flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: T.text, width: 72, flexShrink: 0 }}>{i + 1}. {s.name}</span>
              <span style={{ fontSize: 11, color: T.text3, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(RACKET_SKILLS[s.id] || []).map(sk => sk.name).join(' · ')}</span>
            </div>
          ))}
        </div>

        {/* Reward kit */}
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 4 }}>Reward kit</div>
          <div style={{ fontSize: 11.5, color: T.text2, lineHeight: 1.5 }}>Each racket awards a coloured <strong style={{ color: T.text }}>keyring + matching dampener</strong> and a printable <strong style={{ color: T.text }}>certificate</strong>, with a full trophy at Black. Certificates print from Player Development and the Squad racket matrix.</div>
        </div>

        {/* Upsell */}
        <div style={{ marginTop: 14, background: accent.dim, border: `1px solid ${accent.border}`, borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: T.text }}>Want a bespoke pathway?</div>
            <div style={{ fontSize: 11.5, color: T.text2, marginTop: 2, lineHeight: 1.45 }}>Custom racket names, your own skills, age bands or academy branding — available as an add-on. We set it up for you so the framework stays clean.</div>
          </div>
          <a href="mailto:hello@lumiosports.com?subject=Custom%20racket%20pathway" style={{ appearance: 'none', textDecoration: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 9, padding: '9px 15px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>Request customisation</a>
        </div>
      </div>

      {/* Session Planner */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.text }}>Session Planner</h3>
          <span style={{ marginLeft: 'auto' }}>{lock}</span>
        </div>
        <p style={{ margin: '0 0 12px', fontSize: 12.5, color: T.text3, lineHeight: 1.5 }}>
          New sessions auto-build a timed run-sheet and kit list from the session type, and the planner mirrors your Booking Calendar for the week. The run-sheet templates and kit lists are Lumio’s standard set.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {['Private', 'Group', 'Cardio', 'Match play', 'Mini / red ball'].map(t => (
            <span key={t} style={{ fontSize: 11.5, color: T.text2, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 999, padding: '4px 11px' }}>{t} · timed run-sheet + kit</span>
          ))}
        </div>
        <div style={{ marginTop: 14, background: accent.dim, border: `1px solid ${accent.border}`, borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: T.text }}>Custom run-sheets &amp; kit?</div>
            <div style={{ fontSize: 11.5, color: T.text2, marginTop: 2, lineHeight: 1.45 }}>Your own session structures, phase timings or academy kit lists — set up for you as an add-on.</div>
          </div>
          <a href="mailto:hello@lumiosports.com?subject=Custom%20run-sheets" style={{ appearance: 'none', textDecoration: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 9, padding: '9px 15px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>Request customisation</a>
        </div>
      </div>

      {/* Training Camps */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.text }}>Training Camps</h3>
          <span style={{ marginLeft: 'auto' }}>{lock}</span>
        </div>
        <p style={{ margin: '0 0 6px', fontSize: 12.5, color: T.text3, lineHeight: 1.5 }}>
          Camps run end-to-end — bookings, itinerary, kit, targets and finance. The <strong style={{ color: T.text }}>Lumio Master Coach AI</strong> designs the day-by-day itinerary, equipment list and objectives from your camp setup; attendees link to the Player Roster so each camp pack pulls their real racket, attendance and skills. Create and manage camps in the <strong style={{ color: T.text }}>Training Camps</strong> module.
        </p>
        <div style={{ marginTop: 12, background: accent.dim, border: `1px solid ${accent.border}`, borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: T.text }}>Branded camp packs &amp; certificates?</div>
            <div style={{ fontSize: 11.5, color: T.text2, marginTop: 2, lineHeight: 1.45 }}>Your academy branding on player packs, certificates and itineraries — available as an add-on.</div>
          </div>
          <a href="mailto:hello@lumiosports.com?subject=Custom%20camp%20packs" style={{ appearance: 'none', textDecoration: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 9, padding: '9px 15px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>Request customisation</a>
        </div>
      </div>

      {/* Resource Centre */}
      <div style={card}>
        <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: T.text }}>Resource Centre</h3>
        <p style={{ margin: '0 0 12px', fontSize: 12.5, color: T.text3, lineHeight: 1.5 }}>
          Load Lumio’s starter library — curated drills, technique videos, training plans and worksheets, all tagged to the racket system. You can add, edit or remove resources any time; this just gives you a head start.
        </p>
        <LoadLibraryButton T={T} accent={accent} />
      </div>

      {/* Coaches */}
      <div style={card}>
        <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: T.text }}>Coaches</h3>
        <p style={{ margin: '0 0 4px', fontSize: 12.5, color: T.text3, lineHeight: 1.5 }}>
          Your coaching team is managed in the <strong style={{ color: T.text }}>Coaches</strong> module — add coaches, record their role, accreditations, home venue and DBS / safeguarding status. A solo coach simply sees themselves. DBS and safeguarding expiry is flagged automatically on the Coaches page and the dashboard.
        </p>
        <p style={{ margin: '6px 0 0', fontSize: 11.5, color: T.text3 }}>Edit your own (head coach) name and contact details under <strong style={{ color: T.text2 }}>Head coach profile</strong> above.</p>
      </div>

      {/* Messages */}
      <div style={card}>
        <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: T.text }}>Messages</h3>
        <p style={{ margin: '0 0 10px', fontSize: 12.5, color: T.text3, lineHeight: 1.5 }}>
          Message parents and players from one inbox. Three channels:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
          {[['Lumio message', 'In-app · always on'], ['Email', 'Sends from your contact email — set it under Head coach profile / Connected accounts'], ['Text (SMS)', 'Live once Twilio is configured for your account'], ['WhatsApp', 'Coming soon']].map(([t, d]) => (
            <div key={t} style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 11px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{t}</div>
              <div style={{ fontSize: 10.5, color: T.text3, marginTop: 2 }}>{d}</div>
            </div>
          ))}
        </div>
        <p style={{ margin: 0, fontSize: 11, color: T.text3, lineHeight: 1.5 }}>Replies come back to your own email / phone for now; in-portal two-way threads are on the roadmap.</p>
      </div>

      {/* Payments & Packages */}
      <PaymentsSettingsCard T={T} accent={accent} card={card} />
    </div>
  )
}

function PaymentsSettingsCard({ T, accent, card }: { T: ThemeTokens; accent: AccentTokens; card: React.CSSProperties }) {
  const [rate, setRate] = useState<string>(String(getSettings().privateRate || ''))
  const [pkgState, setPkgState] = useState<'idle' | 'loading' | { added: number } | 'error'>('idle')
  const loadPkgs = async () => { if (pkgState === 'loading') return; setPkgState('loading'); try { const added = await seedLumioPackages(); setPkgState({ added }) } catch { setPkgState('error') } }
  // Stripe Connect — take card / Apple Pay / Google Pay payments straight to your bank.
  const [conn, setConn] = useState<'unknown' | 'no' | 'yes'>('unknown')
  const [connecting, setConnecting] = useState(false)
  useEffect(() => { fetch('/api/coach/pay/status').then(r => r.json()).then(d => setConn(d.chargesEnabled ? 'yes' : 'no')).catch(() => setConn('no')) }, [])
  const connectPayouts = async () => {
    if (connecting) return
    setConnecting(true)
    try {
      const r = await fetch('/api/coach/pay/connect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ returnPath: window.location.pathname }) })
      const d = await r.json()
      if (d.url) window.location.href = d.url; else { setConnecting(false); alert(d.error || 'Could not start onboarding') }
    } catch { setConnecting(false); alert('Could not start onboarding') }
  }
  const field: React.CSSProperties = { background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 9, padding: '9px 11px', fontSize: 13, fontFamily: FONT, width: 120, boxSizing: 'border-box', outline: 'none' }
  return (
    <div style={card}>
      <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: T.text }}>Payments &amp; Packages</h3>
      <p style={{ margin: '0 0 12px', fontSize: 12.5, color: T.text3, lineHeight: 1.5 }}>
        Your price list lives on the Payments &amp; Packages page — add, edit, price and remove packages there (price, sessions, billing, what’s included, equipment). This just sets the headline private rate and loads the Lumio starter list.
      </p>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: T.text3, marginBottom: 5 }}>Private lesson rate (£/hr)</label>
          <input type="number" value={rate} onChange={e => { setRate(e.target.value); setSettings({ privateRate: Number(e.target.value) || 0 }) }} placeholder="e.g. 38" style={field} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={loadPkgs} disabled={pkgState === 'loading'} style={{ appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 9, padding: '9px 15px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>{pkgState === 'loading' ? 'Loading…' : '📦 Load default packages'}</button>
          {typeof pkgState === 'object' && <span style={{ fontSize: 12, color: T.good }}>✓ Added {pkgState.added} {pkgState.added === 0 ? '(already loaded)' : pkgState.added === 1 ? 'package' : 'packages'}</span>}
          {pkgState === 'error' && <span style={{ fontSize: 12, color: T.bad }}>Couldn’t load — try again.</span>}
        </div>
      </div>

      {/* Take payments — Stripe Connect */}
      <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: T.text, marginBottom: 4 }}>Take payments</div>
        <p style={{ margin: '0 0 10px', fontSize: 12, color: T.text3, lineHeight: 1.5 }}>
          Connect your bank to take card, Apple Pay &amp; Google Pay payments — money goes straight to your account. Powered by Stripe; no card details ever touch Lumio.
        </p>
        {conn === 'yes' ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `${T.good}1a`, border: `1px solid ${T.good}55`, color: T.good, borderRadius: 9, padding: '8px 13px', fontSize: 12.5, fontWeight: 700 }}>✓ Payouts connected — paid to your bank</div>
        ) : (
          <button onClick={connectPayouts} disabled={connecting || conn === 'unknown'} style={{ appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 9, padding: '9px 15px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, opacity: connecting || conn === 'unknown' ? 0.6 : 1 }}>{connecting ? 'Opening Stripe…' : '🔗 Connect your bank to take payments'}</button>
        )}
      </div>
    </div>
  )
}

function LoadLibraryButton({ T, accent }: { T: ThemeTokens; accent: AccentTokens }) {
  const [state, setState] = useState<'idle' | 'loading' | { added: number } | 'error'>('idle')
  const load = async () => {
    if (state === 'loading') return
    setState('loading')
    try { const added = await seedLumioResources(); setState({ added }) } catch { setState('error') }
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <button onClick={load} disabled={state === 'loading'} style={{ appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 9, padding: '9px 15px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
        {state === 'loading' ? 'Loading…' : '📚 Load Lumio resource library'}
      </button>
      {typeof state === 'object' && <span style={{ fontSize: 12, color: T.good }}>✓ Added {state.added} resource{state.added === 1 ? '' : 's'} {state.added === 0 ? '(already loaded)' : ''}</span>}
      {state === 'error' && <span style={{ fontSize: 12, color: T.bad }}>Couldn’t load — try again.</span>}
    </div>
  )
}
