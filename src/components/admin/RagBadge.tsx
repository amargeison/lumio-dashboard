'use client'

import { useState } from 'react'
import { type RagBreakdown, ragColor, ragBg, ragEmoji } from '@/lib/rag-score'

export default function RagBadge({ rag }: { rag: RagBreakdown }) {
  const [hover, setHover] = useState(false)

  return (
    <div className="relative inline-block" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full cursor-default"
        style={{ backgroundColor: ragBg(rag.band), color: ragColor(rag.band) }}>
        {ragEmoji(rag.band)} {rag.total}%
      </span>

      {hover && (
        <div className="absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2 w-52 rounded-lg p-3 shadow-xl"
          style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <p className="text-xs font-bold mb-2" style={{ color: '#F9FAFB' }}>RAG Breakdown</p>
          {[
            { label: 'Engagement', value: rag.engagement, max: 40 },
            { label: 'Onboarding', value: rag.onboarding, max: 20 },
            { label: 'Integrations', value: rag.integrations, max: 20 },
            { label: 'Feature Adoption', value: rag.featureAdoption, max: 20 },
          ].map(item => (
            <div key={item.label} className="mb-1.5">
              <div className="flex items-center justify-between text-xs mb-0.5">
                <span style={{ color: '#9CA3AF' }}>{item.label}</span>
                <span style={{ color: '#F9FAFB' }}>{item.value}/{item.max}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1F2937' }}>
                <div className="h-full rounded-full" style={{ width: `${(item.value / item.max) * 100}%`, backgroundColor: ragColor(rag.band) }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
