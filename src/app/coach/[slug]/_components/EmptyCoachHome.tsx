'use client'

// What an assistant coach sees before anything has been assigned to them.
//
// NOT EmptyCoachDashboard, which is the head coach's "Set up your academy" grid:
// Coaches & staff, Training camps, Payments, Booking calendar. A coach controls
// none of those. Showing them that grid invites them to build an academy they do
// not own, and every card either does nothing or edits somebody else's club.
//
// This says the true thing instead — who to ask, what will appear, and the one
// job that genuinely is theirs right now.

import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'

export function EmptyCoachHome({ T, accent, coachName, clubName, onNavigate, profileDone }: {
  T: ThemeTokens; accent: AccentTokens
  coachName: string; clubName: string
  onNavigate: (id: string) => void
  profileDone: boolean
}) {
  const first = (coachName || '').split(/\s+/)[0] || 'there'
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const card: React.CSSProperties = { background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18 }

  const waiting = [
    ['Your players', 'The players your head coach assigns to you, with their goals, skills and lesson history.'],
    ['Your sessions', 'Lessons from the academy calendar that are yours to run, with a timed plan for each.'],
    ['Your courts', 'The courts at the venues you work at — contacts, access notes and today&rsquo;s bookings.'],
  ]

  return (
    <div style={{ fontFamily: FONT }}>
      <div style={{ background: `linear-gradient(135deg, ${accent.dim}, transparent)`, border: `1px solid ${T.border}`, borderRadius: 16, padding: 26, marginBottom: 18 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{clubName || 'Your academy'}</div>
        <h1 style={{ color: T.text, fontSize: 26, fontWeight: 800, margin: '8px 0 6px' }}>{greet}, {first}.</h1>
        <p style={{ color: T.text3, fontSize: 14, margin: 0, lineHeight: 1.65, maxWidth: 560 }}>
          This is your portal. It fills up as your head coach assigns you players and sessions &mdash; nothing for you to set up, and nothing to refresh. It appears as they add it.
        </p>
        {!profileDone && (
          <button onClick={() => onNavigate('settings')}
            style={{ marginTop: 16, appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 10, padding: '10px 18px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
            Finish your profile →
          </button>
        )}
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: T.text2, marginBottom: 10 }}>What&rsquo;ll show up here</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 18 }}>
        {waiting.map(([title, body]) => (
          <div key={title} style={card}>
            <div style={{ color: T.text, fontSize: 14, fontWeight: 700, marginBottom: 5 }}>{title}</div>
            <div style={{ color: T.text3, fontSize: 12.5, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: body }} />
          </div>
        ))}
      </div>

      {/* The things a coach genuinely can do on day one, without waiting. */}
      <div style={{ fontSize: 13, fontWeight: 700, color: T.text2, marginBottom: 10 }}>Meanwhile, yours to get on with</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
        {[
          ['settings', 'Your details', 'Photo, accreditation, DBS and safeguarding.'],
          ['equipment', 'Your kit', 'Start from the club&rsquo;s list or build your own.'],
          ['resources', 'Resource Centre', 'The academy&rsquo;s drills, plans and worksheets.'],
          ['planner', 'Session Planner', 'Draft a session before anything is booked in.'],
        ].map(([id, title, body]) => (
          <button key={id} onClick={() => onNavigate(id)}
            style={{ ...card, textAlign: 'left', cursor: 'pointer', fontFamily: FONT }}>
            <div style={{ color: T.text, fontSize: 14, fontWeight: 700, marginBottom: 5 }}>{title}</div>
            <div style={{ color: T.text3, fontSize: 12.5, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: body }} />
            <div style={{ color: accent.hex, fontSize: 12.5, fontWeight: 600, marginTop: 8 }}>Open →</div>
          </button>
        ))}
      </div>
    </div>
  )
}
