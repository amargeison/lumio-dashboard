'use client'

import { useState, useEffect } from 'react'

interface QuickWin {
  id: string
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  effort: '2min' | '5min' | '10min'
  category: string
  action: string
  actionUrl?: string
  source: string
}

const MOCK_WINS: QuickWin[] = [
  { id: 'qw-1', title: 'Chase Bramble Hill Trust invoice', description: 'Invoice #1047 is 30 days overdue. One click fires the AC-03 chase sequence automatically.', impact: 'high', effort: '2min', category: 'Finance', action: 'Run AC-03 chase', source: 'Xero' },
  { id: 'qw-2', title: 'Whitestone College is RAG Red', description: 'Health score dropped to 34 — below your 40-point alert threshold. Send check-in now.', impact: 'high', effort: '2min', category: 'Customer Success', action: 'Send check-in email', source: 'CS-01' },
  { id: 'qw-3', title: '3 LinkedIn messages unanswered', description: 'Two from potential customers who viewed your pricing page. One from a supplier.', impact: 'medium', effort: '5min', category: 'Sales', action: 'Open LinkedIn', actionUrl: 'https://linkedin.com/messaging', source: 'LinkedIn' },
  { id: 'qw-4', title: 'Campaign email not sent this week', description: 'Weekly nurture sequence missed — 340 contacts waiting.', impact: 'medium', effort: '5min', category: 'Marketing', action: 'Send now', source: 'HubSpot' },
  { id: 'qw-5', title: 'Team expenses pending approval', description: '4 staff expense claims submitted over 5 days ago.', impact: 'medium', effort: '10min', category: 'Operations', action: 'Review claims', source: 'Xero' },
]

const IMPACT_BADGE = {
  high:   'rgba(239,68,68,0.12):#F87171',
  medium: 'rgba(251,191,36,0.12):#FBBF24',
  low:    'rgba(34,197,94,0.12):#4ADE80',
}

interface QuickWinsProps {
  dismissedWins?: Set<string>
  onDismiss?: (id: string) => void
}

export default function QuickWins({ dismissedWins = new Set(), onDismiss }: QuickWinsProps) {
  const [wins, setWins] = useState<QuickWin[]>(() => {
    try {
      const cached = typeof window !== 'undefined' ? localStorage.getItem('qw_wins_cache') : null
      if (cached) return JSON.parse(cached) as QuickWin[]
    } catch {}
    return MOCK_WINS
  })

  useEffect(() => {
    const token = localStorage.getItem('workspace_session_token')
    fetch('/api/home/quick-wins', {
      headers: token ? { 'x-workspace-token': token } : {},
    })
      .then(r => r.json())
      .then(d => {
        const loaded = (d.wins as QuickWin[]) || MOCK_WINS
        setWins(loaded)
        try { localStorage.setItem('qw_wins_cache', JSON.stringify(loaded)) } catch {}
      })
      .catch(() => setWins(MOCK_WINS))
  }, [])

  const active = wins.filter(w => !dismissedWins.has(w.id))
  const doneCount = wins.filter(w => dismissedWins.has(w.id)).length

  const markDone = (id: string) => { onDismiss?.(id) }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2" style={{ color: '#F9FAFB' }}>&#x26A1; Quick Wins</h2>
          <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>High impact, low effort — sorted by priority. Do these first.</p>
        </div>
        <div className="text-sm" style={{ color: '#6B7280' }}>{doneCount}/{wins.length} done today</div>
      </div>

      <div className="space-y-3">
        {active.map(win => {
          const [bg, color] = IMPACT_BADGE[win.impact].split(':')
          return (
            <div key={win.id} className="rounded-2xl p-5 transition-all"
              style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: bg, color }}>{win.impact.toUpperCase()} IMPACT</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: 'rgba(124,58,237,0.12)', color: '#A78BFA' }}>&#x23F1; {win.effort}</span>
                    <span className="text-xs" style={{ color: '#6B7280' }}>{win.category}</span>
                  </div>
                  <h3 className="font-bold mb-1" style={{ color: '#F9FAFB' }}>{win.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{win.description}</p>
                  <p className="text-xs mt-2" style={{ color: '#374151' }}>Source: {win.source}</p>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {win.actionUrl ? (
                    <a href={win.actionUrl} target="_blank" rel="noopener noreferrer"
                      className="px-4 py-2 text-white text-sm font-bold rounded-xl whitespace-nowrap text-center"
                      style={{ backgroundColor: '#7C3AED' }}>
                      {win.action} &rarr;
                    </a>
                  ) : (
                    <button onClick={() => markDone(win.id)}
                      className="px-4 py-2 text-white text-sm font-bold rounded-xl whitespace-nowrap"
                      style={{ backgroundColor: '#7C3AED' }}>
                      {win.action} &rarr;
                    </button>
                  )}
                  <button onClick={() => markDone(win.id)}
                    className="px-4 py-2 text-xs rounded-xl transition-colors"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#6B7280' }}>
                    Mark done
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {doneCount > 0 && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid #1F2937' }}>
            <p className="text-xs mb-2" style={{ color: '#374151' }}>{doneCount} completed today</p>
            {wins.filter(w => dismissedWins.has(w.id)).map(win => (
              <div key={win.id} className="flex items-center gap-3 py-2 opacity-40">
                <span className="text-green-500">&#x2713;</span>
                <span className="text-sm line-through" style={{ color: '#6B7280' }}>{win.title}</span>
              </div>
            ))}
          </div>
        )}

        {active.length === 0 && doneCount > 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">{'\u{1F3C6}'}</div>
            <p className="text-lg font-bold" style={{ color: '#F9FAFB' }}>All quick wins done!</p>
            <p className="text-sm" style={{ color: '#6B7280' }}>You&apos;re ahead of the game today.</p>
          </div>
        )}
      </div>
    </div>
  )
}
