'use client'

// Live (founder portal) Lesson Summaries = the generic coach_sessions module, with
// an "Add audio/video" button on top. A recording is transcribed + summarised
// server-side (which also inserts the coach_sessions row), then we remount the
// module so the new summary appears.

import { useState } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { LiveModule, LESSONS_CONFIG } from './LiveModules'
import { MediaCaptureModal } from './MediaCaptureModal'

export function LiveLessons({ T, accent }: { T: ThemeTokens; accent: AccentTokens }) {
  const [mediaKind, setMediaKind] = useState<false | 'audio' | 'video'>(false)
  const [refreshKey, setRefreshKey] = useState(0)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button onClick={() => setMediaKind('audio')} title="Record or upload a session — the AI writes the summary"
          style={{ appearance: 'none', border: `1px solid ${accent.border}`, padding: '9px 15px', borderRadius: 9, background: accent.dim, color: accent.hex, fontSize: 13, fontWeight: 700, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
          🎙️ Add audio/video → AI summary
        </button>
      </div>
      <LiveModule key={refreshKey} config={LESSONS_CONFIG} T={T} accent={accent} />
      {mediaKind && (
        <MediaCaptureModal T={T} accent={accent} defaultKind={mediaKind}
          onClose={() => setMediaKind(false)}
          onSummary={() => { setMediaKind(false); setRefreshKey(k => k + 1) }} />
      )}
    </div>
  )
}
