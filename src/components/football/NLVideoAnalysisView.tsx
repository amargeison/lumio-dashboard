'use client'

import { Video } from 'lucide-react'

// Phase 1 stub — sub-tab content (Match Library, Match Detail, Training,
// Player Performance, Set-Piece Studio, Live Match, Opposition Analysis)
// lands in the next commit. Identical structure across all four portal
// V&A views (Grassroots, Pro, Women, NL) for ease of review.
//
// Convention break: this view is in its own file rather than inline in
// nl-content.tsx (where NLTacticsView, NLMedicalView etc. live as inline
// functions). Reason: nl-content.tsx is already ~4000 lines and a
// ~1000-line V&A view inline would push it past 5000. Convention isn't
// worth keeping at that file size.

const C = { card: '#0D1017', border: '#1F2937', text: '#F9FAFB', muted: '#6B7280', accent: '#F59E0B' } as const

export default function NLVideoAnalysisView() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl p-6" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: `${C.accent}1A` }}>
            <Video size={20} style={{ color: C.accent }} />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: C.text }}>Video & Analysis</h2>
            <p className="text-xs" style={{ color: C.muted }}>Lumio-native match video, tactical clips, player performance, set-piece studio</p>
          </div>
        </div>
        <p className="text-sm" style={{ color: C.muted }}>
          Phase 1 content next commit — sub-tabs: Match Library, Match Detail, Training, Player Performance, Set-Piece Studio, Live Match, Opposition Analysis.
        </p>
      </div>
    </div>
  )
}
