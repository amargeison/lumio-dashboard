'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import type { ThemeTokens, AccentTokens } from '../_lib/theme'
import { FONT, FONT_MONO } from '../_lib/theme'
import { Icon } from './Icon'

// Slide-over match-day intelligence brief. Dense, document-style content —
// the demo pitch is "this is what your coaching staff would actually use."
// All copy is hardcoded for the Sat 26 Apr Loxwood fixture, matching the
// HeroToday card so the user sees a continuation of the same fixture.

type Props = {
  T: ThemeTokens
  accent: AccentTokens
  open: boolean
  onClose: () => void
}

export function MatchBriefPanel({ T, accent, open, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      {/* Scrim */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(2px)', zIndex: 60,
          animation: 'cricketV2FadeUp .15s',
        }}
      />
      {/* Panel */}
      <div
        ref={panelRef}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 'min(640px, 100vw)',
          background: T.bg, color: T.text, fontFamily: FONT,
          borderLeft: `1px solid ${T.borderHi}`,
          zIndex: 61, overflowY: 'auto',
          animation: 'cricketV2SlideLeft .22s',
          boxShadow: '-12px 0 40px rgba(0,0,0,0.35)',
        }}
        role="dialog"
        aria-label="Match Brief"
      >
        <Header T={T} accent={accent} onClose={onClose} />

        <div style={{ padding: '0 28px 28px' }}>
          <Section T={T} accent={accent} num={1} title="Conditions">
            <Row T={T} k="Weather"        v="9°C, cloudy · light SW wind 11 mph · 34% rain chance after 16:00" />
            <Row T={T} k="Pitch"          v="Day 1 of a 4-day wicket. Expect pace and bounce early. Spin from Day 2 afternoon as the surface dries." />
            <Row T={T} k="Toss strategy"  v="Bat first if winning the toss. Overhead conditions suit swing early but the pitch will deteriorate — runs on the board are gold." accent={accent} />
            <Row T={T} k="Light"          v="Sunrise 05:48 · Sunset 20:12 — full day available, no DLS concerns expected before 16:00." />
          </Section>

          <Section T={T} accent={accent} num={2} title="Opposition Analysis — Loxwood CC">
            <Row T={T} k="Position"   v="5th in County Championship Div 1" />
            <Row T={T} k="Last 5"     v="W W L D W" />
            <SubHead T={T}>Key threats</SubHead>
            <Bullet T={T} accent={accent}
              title="J. Archer (opening bowler)"
              body="Left-arm seam · 8.4 economy · top-3 strike rate in division. First-ball danger especially on a tinged wicket. Plan to see him off — he tires after 6 overs."
            />
            <Bullet T={T} accent={accent}
              title="R. Patel (captain)"
              body="Scores 68% of his runs on the off side — vulnerable to inswingers targeting pad. Drop short ball into ribs early to test hook."
            />
            <Bullet T={T} accent={accent}
              title="K. Bates (spin option)"
              body="Part-time off-spin · 2 wickets in last 3 matches. Not a major threat — soak up the overs and rotate strike."
            />
            <SubHead T={T}>Weakness to exploit</SubHead>
            <p style={{ margin: 0, fontSize: 12.5, color: T.text2, lineHeight: 1.55 }}>
              Middle order averages <strong style={{ color: accent.hex }}>24.3</strong> across the last 6 innings — collapses under pressure.
              Target the 4-5-6 batting positions; one good spell from Patel or Okonkwo and the tail is reachable.
            </p>
          </Section>

          <Section T={T} accent={accent} num={3} title="Our Team News">
            <Bullet T={T} tone="warn"
              title="Hartley — flagged 6/10 fitness"
              body="Likely 12th man. Decision needed by 09:30 from medical. If he plays, manage his fielding — keep him at slip, no boundary work."
            />
            <Bullet T={T} tone="good"
              title="Cooper — fully fit, returns"
              body="Returns to starting XI after a week off. Expect him at 4."
            />
            <Bullet T={T} tone="good"
              title="Harrison — RTP phase 3, fully fit"
              body="Available for selection. First fit week — bowling load capped at 12 overs Day 1, 8 overs Day 2."
            />
            <SubHead T={T}>Bowling plan</SubHead>
            <p style={{ margin: 0, fontSize: 12.5, color: T.text2, lineHeight: 1.55 }}>
              Open with <strong style={{ color: T.text }}>Patel</strong> (right-arm) and newcomer{' '}
              <strong style={{ color: T.text }}>Okonkwo</strong> (left-arm) to exploit Loxwood&apos;s known weakness vs left-arm seam.
              Switch to <strong style={{ color: T.text }}>Dawson</strong> (off-spin) from the Pavilion End after lunch if the surface is turning.
            </p>
          </Section>

          <Section T={T} accent={accent} num={4} title="Tactical Priorities">
            <ol style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                'Win the toss, bat first.',
                'Target Loxwood\'s middle order (positions 4-5-6).',
                'Open with Patel/Okonkwo seam pairing.',
                'Set aggressive field for the first 20 overs — slip cordon stacked.',
                'Spinner Dawson on from the Pavilion End after lunch if pitch is turning.',
              ].map((line, i) => (
                <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'baseline', fontSize: 12.5, color: T.text, lineHeight: 1.5 }}>
                  <span className="tnum" style={{
                    fontFamily: FONT_MONO, fontSize: 11, color: accent.hex, fontWeight: 700,
                    minWidth: 18,
                  }}>{i + 1}.</span>
                  <span>{line}</span>
                </li>
              ))}
            </ol>
          </Section>

          <Section T={T} accent={accent} num={5} title="Logistics" last>
            <Row T={T} k="Kit van"   v="Confirmed 06:30 · driver confirmed (T. Bell)" />
            <Row T={T} k="Lunch"     v="Pavilion · 13:00–13:40 (40 mins)" />
            <Row T={T} k="Press"     v="14:00 press conference · Fairweather + Caldwell on the Q-list" />
            <Row T={T} k="Broadcast" v="Northbridge Sport · cameras from 10:30" />
          </Section>

          <Footer T={T} />
        </div>
      </div>
    </>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────

function Header({ T, accent, onClose }: { T: ThemeTokens; accent: AccentTokens; onClose: () => void }) {
  return (
    <div style={{
      position: 'sticky', top: 0, background: T.bg, zIndex: 1,
      padding: '20px 28px 18px',
      borderBottom: `1px solid ${T.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 10, color: accent.hex, letterSpacing: '0.18em',
            fontWeight: 700, textTransform: 'uppercase', fontFamily: FONT_MONO,
            marginBottom: 6,
          }}>
            Match Brief
          </div>
          <h2 style={{
            margin: 0, fontSize: 22, fontWeight: 600, color: T.text,
            letterSpacing: '-0.01em', lineHeight: 1.2,
          }}>
            Oakridge CC <span style={{ color: T.text3, fontWeight: 400 }}>vs</span> Loxwood CC
          </h2>
          <div style={{ fontSize: 11.5, color: T.text2, marginTop: 6, fontFamily: FONT_MONO }}>
            County Championship · Round 4 · Day 1 of 4
          </div>
          <div style={{ fontSize: 11, color: T.text3, marginTop: 2, fontFamily: FONT_MONO }}>
            Sat 26 Apr 2026 · Oakridge Park · First ball 11:00
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent',
            color: T.text2, padding: '6px 8px', borderRadius: 6, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, fontFamily: FONT, fontSize: 12,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHi; e.currentTarget.style.color = T.text }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border;    e.currentTarget.style.color = T.text2 }}
        >
          <Icon name="check" size={11} stroke={2} />
          esc
        </button>
      </div>
    </div>
  )
}

function Section({
  T, accent, num, title, children, last,
}: {
  T: ThemeTokens; accent: AccentTokens; num: number; title: string; children: ReactNode; last?: boolean
}) {
  return (
    <section style={{
      padding: '22px 0',
      borderBottom: last ? 'none' : `1px solid ${T.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
        <span className="tnum" style={{
          fontFamily: FONT_MONO, fontSize: 10.5, color: accent.hex,
          letterSpacing: '0.06em', fontWeight: 700,
        }}>
          §{num}
        </span>
        <h3 style={{
          margin: 0, fontSize: 14, fontWeight: 600, color: T.text,
          letterSpacing: '-0.005em',
        }}>{title}</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </section>
  )
}

function Row({
  T, k, v, accent,
}: { T: ThemeTokens; k: string; v: string; accent?: AccentTokens }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 14, alignItems: 'baseline' }}>
      <div style={{
        fontSize: 10.5, color: T.text3, textTransform: 'uppercase',
        letterSpacing: '0.06em', fontFamily: FONT_MONO,
      }}>{k}</div>
      <div style={{
        fontSize: 12.5, color: accent ? T.text : T.text2, lineHeight: 1.5,
        fontWeight: accent ? 500 : 400,
        borderLeft: accent ? `2px solid ${accent.hex}` : 'none',
        paddingLeft: accent ? 10 : 0,
      }}>
        {v}
      </div>
    </div>
  )
}

function SubHead({ T, children }: { T: ThemeTokens; children: ReactNode }) {
  return (
    <div style={{
      fontSize: 10, color: T.text3, textTransform: 'uppercase',
      letterSpacing: '0.08em', fontFamily: FONT_MONO,
      marginTop: 4, marginBottom: 2,
    }}>
      {children}
    </div>
  )
}

function Bullet({
  T, accent, tone, title, body,
}: {
  T: ThemeTokens
  accent?: AccentTokens
  tone?: 'good' | 'warn' | 'bad'
  title: string
  body: string
}) {
  const tint = tone === 'good' ? T.good : tone === 'warn' ? T.warn : tone === 'bad' ? T.bad : (accent?.hex ?? T.text)
  return (
    <div style={{
      borderLeft: `2px solid ${tint}`,
      paddingLeft: 12,
    }}>
      <div style={{ fontSize: 12.5, color: T.text, fontWeight: 600, marginBottom: 3 }}>{title}</div>
      <div style={{ fontSize: 12, color: T.text2, lineHeight: 1.5 }}>{body}</div>
    </div>
  )
}

function Footer({ T }: { T: ThemeTokens }) {
  return (
    <div style={{
      marginTop: 8, paddingTop: 16,
      borderTop: `1px solid ${T.border}`,
      fontSize: 10.5, color: T.text3, textAlign: 'center',
      fontFamily: FONT_MONO, letterSpacing: '0.04em',
    }}>
      Generated by Lumio · Match intelligence · Confidential — Team only
    </div>
  )
}
