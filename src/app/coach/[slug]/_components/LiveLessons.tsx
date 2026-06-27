'use client'

// Live (founder portal) Lesson Summaries — the coach_sessions module, styled to
// match the demo: "Add audio/video" beside "Add lesson summary" on one row, and
// the This week / Last week / This month / All tabs. A recording is transcribed +
// summarised server-side (which inserts the coach_sessions row); we then remount
// the module so the new summary appears.

import { useState } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { LiveModule, LESSONS_CONFIG } from './LiveModules'
import { MediaCaptureModal } from './MediaCaptureModal'

export function LiveLessons({ T, accent }: { T: ThemeTokens; accent: AccentTokens }) {
  const [mediaKind, setMediaKind] = useState<false | 'audio' | 'video'>(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [range, setRange] = useState<'week' | 'lastweek' | 'month' | 'all'>('all')

  const audioBtn = (
    <button onClick={() => setMediaKind('audio')} title="Record or upload a session — the AI writes the summary"
      style={{ appearance: 'none', border: `1px solid ${accent.border}`, padding: '9px 15px', borderRadius: 10, background: accent.dim, color: accent.hex, fontSize: 13, fontWeight: 700, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
      🎙️ Add audio/video → AI summary
    </button>
  )

  const RANGE_TABS: { id: typeof range; label: string }[] = [
    { id: 'week', label: 'This week' }, { id: 'lastweek', label: 'Last week' },
    { id: 'month', label: 'This month' }, { id: 'all', label: 'All' },
  ]
  const tabs = (
    <div style={{ display: 'flex', gap: 0, padding: 2, background: T.hover, borderRadius: 8, marginBottom: 16, width: 'fit-content' }}>
      {RANGE_TABS.map(rt => (
        <button key={rt.id} onClick={() => setRange(rt.id)}
          style={{ appearance: 'none', border: 0, padding: '5px 12px', borderRadius: 6, fontSize: 11.5, cursor: 'pointer', fontFamily: FONT, background: range === rt.id ? T.panel : 'transparent', color: range === rt.id ? T.text : T.text2, fontWeight: range === rt.id ? 600 : 400, boxShadow: range === rt.id ? `0 0 0 1px ${T.border}` : 'none' }}>{rt.label}</button>
      ))}
    </div>
  )

  return (
    <div>
      <LiveModule key={refreshKey} config={LESSONS_CONFIG} T={T} accent={accent} headerExtra={audioBtn} tabs={tabs} />
      {mediaKind && (
        <MediaCaptureModal T={T} accent={accent} defaultKind={mediaKind}
          onClose={() => setMediaKind(false)}
          onSummary={() => { setMediaKind(false); setRefreshKey(k => k + 1) }} />
      )}
    </div>
  )
}
