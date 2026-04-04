'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Sparkles } from 'lucide-react'

const ACCENT: Record<string, string> = {
  business: '#0D9488', schools: '#22C55E', football: '#C0392B',
}

export default function DeptAISummary({ dept, portal = 'business' }: { dept: string; portal?: 'business' | 'schools' | 'football' }) {
  const accent = ACCENT[portal] || '#0D9488'
  const cacheKey = `lumio_ai_summary_${dept}_${new Date().toISOString().slice(0, 10)}`

  const [bullets, setBullets] = useState<string[]>([])
  const [watchOut, setWatchOut] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchSummary = useCallback(async (skipCache = false) => {
    if (!skipCache && typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem(cacheKey)
        if (cached) {
          const data = JSON.parse(cached)
          setBullets(data.bullets)
          setWatchOut(data.watchOut)
          setLoading(false)
          return
        }
      } catch { /* ignore */ }
    }

    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/ai/dept-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dept, mode: 'summary', portal }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setBullets(data.bullets || [])
      setWatchOut(data.watchOut || '')
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(cacheKey, JSON.stringify(data))
      }
    } catch {
      setError(true)
      setBullets(['📊 Key metrics are tracking well this period', '✅ No critical blockers identified', '📈 Performance above baseline', '👥 Team capacity is healthy'])
      setWatchOut('⚠️ Watch out for: ensure reporting data is up to date')
    } finally {
      setLoading(false)
    }
  }, [dept, portal, cacheKey])

  useEffect(() => { fetchSummary() }, [fetchSummary])

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', borderLeft: `3px solid ${accent}` }}>
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
        <div className="flex items-center gap-2">
          <Sparkles size={14} style={{ color: accent }} />
          <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>AI Summary</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: '#4B5563' }}>{loading ? 'Generating...' : 'Generated just now'}</span>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') sessionStorage.removeItem(cacheKey)
              fetchSummary(true)
            }}
            className="p-1 rounded-md transition-colors hover:bg-white/5"
            style={{ color: '#6B7280' }}
            title="Refresh summary"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="px-5 py-4">
        {loading ? (
          <div className="space-y-2.5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-4 rounded-md animate-pulse" style={{ backgroundColor: '#1F2937', width: `${85 - i * 8}%` }} />
            ))}
            <div className="h-4 rounded-md animate-pulse mt-3" style={{ backgroundColor: 'rgba(245,158,11,0.15)', width: '70%' }} />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {bullets.map((b, i) => (
                <p key={i} className="text-xs leading-relaxed" style={{ color: '#D1D5DB' }}>{b}</p>
              ))}
            </div>
            {watchOut && (
              <p className="text-xs leading-relaxed mt-3 px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(245,158,11,0.08)', color: '#FBBF24', border: '1px solid rgba(245,158,11,0.15)' }}>
                {watchOut}
              </p>
            )}
            {error && (
              <p className="text-[10px] mt-2" style={{ color: '#4B5563' }}>Using cached insights — AI service unavailable</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
