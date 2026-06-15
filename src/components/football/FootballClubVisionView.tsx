'use client'

import { Map } from 'lucide-react'
import ClubPlannerTab from './ClubPlannerTab'

// Men's Pro — Club Vision. The multi-horizon strategy (1/3/5/10-year plan,
// ambitions, decade financial projection, legacy milestones) previously lived
// in the Board Suite "Strategy" tab; moved here to its own COMMERCIAL section.

export default function FootballClubVisionView() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: '#F9FAFB' }}>
          <Map size={18} style={{ color: '#003DA5' }} /> Club Vision
        </h2>
        <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Multi-horizon strategy — season objectives through to the 10-year ambition.</p>
      </div>
      <ClubPlannerTab />
    </div>
  )
}
