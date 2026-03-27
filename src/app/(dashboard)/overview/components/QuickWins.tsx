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
  done: boolean
}

const MOCK_WINS: QuickWin[] = [
  { id: '1', title: 'Chase Bramble Hill Trust invoice', description: 'Invoice #1047 is 30 days overdue. One click fires the AC-03 chase sequence automatically.', impact: 'high', effort: '2min', category: 'Finance', action: 'Run AC-03 chase', source: 'Xero', done: false },
  { id: '2', title: 'Whitestone College is RAG Red', description: 'Health score dropped to 34 — below your 40-point alert threshold. Send check-in now.', impact: 'high', effort: '2min', category: 'Customer Success', action: 'Send check-in email', source: 'CS-01', done: false },
  { id: '3', title: '3 LinkedIn messages unanswered', description: 'Two from potential customers who viewed your pricing page. One from a supplier.', impact: 'medium', effort: '5min', category: 'Sales', action: 'Open LinkedIn', actionUrl: 'https://linkedin.com/messaging', source: 'LinkedIn', done: false },
  { id: '4', title: 'Approve 2 pending leave requests', description: 'Emma Clarke (2 days) and Noah Thomas (1 day) are waiting for approval.', impact: 'medium', effort: '2min', category: 'HR', action: 'Review requests', source: 'HR workflows', done: false },
  { id: '5', title: 'New trial signup needs follow-up', description: 'Signed up 18 hours ago — no activity yet. Send personal check-in.', impact: 'high', effort: '2min', category: 'Sales', action: 'Send check-in', source: 'Demo system', done: false },
]

const IMPACT_BADGE = {
  high:   'rgba(239,68,68,0.12):#F87171',
  medium: 'rgba(251,191,36,0.12):#FBBF24',
  low:    'rgba(34,197,94,0.12):#4ADE80',
}

export default function QuickWins() {
  const [wins, setWins] = useState<QuickWin[]>([])

  useEffect(() => {
    const token = localStorage.getItem('workspace_session_token')
    fetch('/api/home/quick-wins', {
      headers: token ? { 'x-workspace-token': token } : {},
    })
      .then(r => r.json())
      .then(d => setWins(d.wins || MOCK_WINS))
      .catch(() => setWins(MOCK_WINS))
  }, [])

  const markDone = (id: string) => setWins(prev => prev.map(w => w.id === id ? { ...w, done: true } : w))
  const active = wins.filter(w => !w.done)
  const done   = wins.filter(w => w.done)

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2" style={{ color: '#F9FAFB' }}>⚡ Quick Wins</h2>
          <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>High impact, low effort — sorted by priority. Do these first.</p>
        </div>
        <div className="text-sm" style={{ color: '#6B7280' }}>{done.length}/{wins.length} done today</div>
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
                      style={{ backgroundColor: 'rgba(124,58,237,0.12)', color: '#A78BFA' }}>⏱ {win.effort}</span>
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
                      {win.action} →
                    </a>
                  ) : (
                    <button onClick={() => markDone(win.id)}
                      className="px-4 py-2 text-white text-sm font-bold rounded-xl whitespace-nowrap"
                      style={{ backgroundColor: '#7C3AED' }}>
                      {win.action} →
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

        {done.length > 0 && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid #1F2937' }}>
            <p className="text-xs mb-2" style={{ color: '#374151' }}>{done.length} completed today</p>
            {done.map(win => (
              <div key={win.id} className="flex items-center gap-3 py-2 opacity-40">
                <span className="text-green-500">✓</span>
                <span className="text-sm line-through" style={{ color: '#6B7280' }}>{win.title}</span>
              </div>
            ))}
          </div>
        )}

        {active.length === 0 && done.length > 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🏆</div>
            <p className="text-lg font-bold" style={{ color: '#F9FAFB' }}>All quick wins done!</p>
            <p className="text-sm" style={{ color: '#6B7280' }}>You&apos;re ahead of the game today.</p>
          </div>
        )}
      </div>
    </div>
  )
}
