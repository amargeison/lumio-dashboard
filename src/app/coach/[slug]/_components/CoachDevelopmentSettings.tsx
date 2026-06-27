'use client'

// Settings → Player Development + Racket Progression System.
// The racket ladder and its skills are Lumio's standard framework: shown here
// read-only and centrally managed (a deliberate product decision — it keeps the
// pathway consistent and is the hook for a paid "custom academy pathway" upsell).
// Coaches see exactly what's tracked; bespoke ladders/skills/branding are
// available on request rather than self-serve editing.

import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { RACKET_STAGES, RACKET_SKILLS } from '../_lib/coach-db'

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
    </div>
  )
}
