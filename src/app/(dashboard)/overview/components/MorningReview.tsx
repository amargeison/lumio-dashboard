'use client'

import { useState, useEffect } from 'react'

interface ReviewItem {
  source: 'email' | 'linkedin' | 'news' | 'slack' | 'twitter' | 'notion'
  count: number
  preview: string[]
  urgent: boolean
  url?: string
}

const SOURCE_CONFIG = {
  email:    { icon: '📧', label: 'Emails',        color: '#60A5FA', bg: 'rgba(96,165,250,0.08)',   border: 'rgba(96,165,250,0.2)'  },
  linkedin: { icon: '💼', label: 'LinkedIn',      color: '#2DD4BF', bg: 'rgba(45,212,191,0.08)',   border: 'rgba(45,212,191,0.2)'  },
  news:     { icon: '📰', label: 'Industry News', color: '#FBBF24', bg: 'rgba(251,191,36,0.08)',   border: 'rgba(251,191,36,0.2)'  },
  slack:    { icon: '💬', label: 'Slack',         color: '#C084FC', bg: 'rgba(192,132,252,0.08)',  border: 'rgba(192,132,252,0.2)' },
  twitter:  { icon: '𝕏',  label: 'X / Twitter',  color: '#9CA3AF', bg: 'rgba(156,163,175,0.08)', border: 'rgba(156,163,175,0.2)' },
  notion:   { icon: '📋', label: 'Notion',        color: '#FB923C', bg: 'rgba(251,146,60,0.08)',   border: 'rgba(251,146,60,0.2)'  },
}

const MOCK_REVIEW: ReviewItem[] = [
  { source: 'email',    count: 12, urgent: true,  preview: ['Invoice overdue from Bramble Hill', 'New trial signup — Just wow Inc', 'Stripe payment confirmed — Oakridge'] },
  { source: 'slack',    count: 7,  urgent: false, preview: ['Charlotte: lead scored 87 in SA-02', 'HR-01 completed for new joiner'] },
  { source: 'linkedin', count: 4,  urgent: false, preview: ['2 connection requests', 'Post got 47 reactions', 'Message from potential customer'] },
  { source: 'news',     count: 3,  urgent: false, preview: ['Zendesk confirms Aug 2027 Sell retirement', 'UK SMB automation market up 34% YoY'] },
  { source: 'notion',   count: 2,  urgent: false, preview: ['Testing guide updated — 2 items resolved', 'Competitor pricing change detected'] },
]

export default function MorningReview() {
  const [items, setItems] = useState<ReviewItem[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/home/morning-review')
      .then(r => r.json())
      .then(d => setItems(d.items || MOCK_REVIEW))
      .catch(() => setItems(MOCK_REVIEW))
  }, [])

  return (
    <div className="rounded-2xl p-5 h-full" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: '#F9FAFB' }}>
          🌅 Morning Roundup
        </h3>
        <span className="text-xs" style={{ color: '#6B7280' }}>Since you were last here</span>
      </div>

      <div className="space-y-2">
        {items.map(item => {
          const cfg = SOURCE_CONFIG[item.source]
          const isOpen = expanded === item.source
          return (
            <div key={item.source} className="rounded-xl overflow-hidden"
              style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}>
              <button
                onClick={() => setExpanded(isOpen ? null : item.source)}
                className="w-full flex items-center justify-between p-3 text-left"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{cfg.icon}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
                    {item.urgent && (
                      <span className="text-xs px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#F87171' }}>
                        Urgent
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black" style={{ color: cfg.color }}>{item.count}</span>
                  <span className="text-xs" style={{ color: '#6B7280' }}>{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>
              {isOpen && (
                <div className="px-3 pb-3 space-y-1.5">
                  {item.preview.map((p, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs" style={{ color: '#9CA3AF' }}>
                      <span className="flex-shrink-0 mt-0.5" style={{ color: '#4B5563' }}>→</span>
                      {p}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
