'use client'

// The coach's preview of the player app.
//
// Same page the family gets — the view is shared — with a picker on top so the
// coach can look through any of their players' eyes before inviting anyone. The
// bundle comes from /api/coach/student-preview rather than from client queries,
// because clips live in a private bucket and need signing, and because an
// assistant coach previewing should hit exactly the same scoping rule the parent
// portal applies rather than a looser one that happens to work.
//
// What the coach sees here is the truth, not a mock-up: sections with no data
// are missing here too. That is the point of previewing.

import { useEffect, useState } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT, FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'
import { useCoachTable } from '../_lib/coach-db'
import { getSettings } from '../_lib/settings-store'
import { LiveStudentView, type StudentTheme } from '@/components/student/LiveStudentView'
import type { StudentBundle } from '@/lib/student/bundle'
import { getFlags } from '../_lib/feature-flags'

type PlayerRow = { id: string; name: string }

export function studentThemeFrom(T: ThemeTokens, accent: AccentTokens, density: Density): StudentTheme {
  return {
    text: T.text, text2: T.text2, text3: T.text3, text4: T.text4,
    panel: T.panel, panel2: T.panel2, border: T.border,
    good: T.good, warn: T.warn, bad: T.bad, hover: T.hover,
    accent: accent.hex, accentDim: accent.dim, accentBorder: accent.border,
    btnText: T.btnText,
    gap: density.gap, pad: density.pad, radius: density.radius,
  }
}

export function LiveStudentPreview({ T, accent, density, onNavigate }: {
  T: ThemeTokens; accent: AccentTokens; density: Density; onNavigate?: (id: string) => void
}) {
  const { rows: players, loading: playersLoading } = useCoachTable<PlayerRow>('coach_players')
  const [selId, setSelId] = useState('')
  const [bundle, setBundle] = useState<StudentBundle | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  // Which player is being previewed: whoever the coach picked, or the first on
  // the roster. DERIVED rather than stored, so the roster arriving after the
  // first render does not need an effect to reach back and correct the state.
  const activeId = selId || players[0]?.id || ''

  useEffect(() => {
    if (!activeId) return
    let alive = true
    const run = async () => {
      setLoading(true); setErr('')
      try {
        const r = await fetch(`/api/coach/student-preview?playerId=${encodeURIComponent(activeId)}`)
        const d = await r.json().catch(() => ({}))
        if (!alive) return
        if (!r.ok) { setErr(d.error || 'Could not load this player'); setBundle(null); return }
        const s = getSettings()
        setBundle({
          player: d.player,
          skills: d.skills || [],
          lessons: d.lessons || [],
          clips: d.clips || [],
          voiceNotes: d.voiceNotes || [],
          watch: d.watch || [],
          resources: d.resources || [],
          camps: d.camps || [],
          nextSession: d.nextSession || null,
          // The preview is the coach's own browser, so the live flags are right
          // here — and the preview must hide exactly what the family's copy hides.
          features: getFlags('prolite'),
          books: d.books || [],
          messages: d.messages || [],
          sectionsOff: s.sectionsOff?.student || [],
          awardThreshold: s.awardThreshold || 3,
        })
      } catch {
        if (alive) setErr('Could not load this player')
      } finally {
        if (alive) setLoading(false)
      }
    }
    run()
    return () => { alive = false }
  }, [activeId])

  const ST = studentThemeFrom(T, accent, density)

  if (!playersLoading && players.length === 0) {
    return (
      <div style={{ fontFamily: FONT, maxWidth: 560, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24 }}>
        <h1 style={{ color: T.text, fontSize: 20, fontWeight: 700, margin: 0 }}>The player app</h1>
        <p style={{ color: T.text3, fontSize: 13.5, lineHeight: 1.6, margin: '8px 0 16px' }}>
          This is the page a player or parent sees when you invite them. It fills itself from the work you
          already do — lesson summaries, racket progress, clips you save — so there is nothing to write twice.
          Add a player and it has someone to be about.
        </p>
        <button onClick={() => onNavigate?.('roster')}
          style={{ appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
          Go to Player Roster →
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: density.gap }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: FONT_MONO }}>Parent &amp; player view</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11.5, color: T.text3 }}>Viewing</span>
          <select value={activeId} onChange={e => setSelId(e.target.value)}
            style={{ appearance: 'none', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, fontSize: 13, fontWeight: 600, padding: '8px 30px 8px 12px', fontFamily: FONT, cursor: 'pointer',
              backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(T.text3)}' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>")`,
              backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}>
            {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      {err && <div style={{ fontFamily: FONT, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18, color: T.bad, fontSize: 13 }}>{err}</div>}

      {!err && !bundle && (
        <div style={{ fontFamily: FONT, color: T.text3, fontSize: 13, padding: 24, textAlign: 'center' }}>
          {loading ? 'Loading…' : ' '}
        </div>
      )}

      {!err && bundle && (
        <LiveStudentView T={ST} bundle={bundle} footnote="Lumio · player &amp; parent view · this is exactly what they see" />
      )}
    </div>
  )
}
