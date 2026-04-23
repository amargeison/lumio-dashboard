'use client'

import { useCallback, useEffect, useState } from 'react'
import { Sparkles, ChevronDown, RefreshCw } from 'lucide-react'

// ──────────────────────────────────────────────────────────────────────────
// AI Spend tile — admin dashboard.
//
// Reads /api/admin/ai-spend every 30s using the admin session token from
// localStorage. Renders: big $X.XX / $5.00, progress bar with threshold
// colour, call count + last-call time, and an expandable per-sport list.
//
// Colour thresholds match the spec: <50% green, 50–80% amber, >80% red.
// ──────────────────────────────────────────────────────────────────────────

type SpendBySport = Record<string, { spendUsd: number; calls: number }>

type AiSpendResponse = {
  date: string
  spendUsd: number
  capUsd: number
  calls: number
  lastCallAt: string | null
  utilisation: number
  remainingUsd: number
  bySport: SpendBySport
  modelRates: { input: number; output: number }
  storage: string
}

function barColor(util: number): string {
  if (util > 0.8) return '#EF4444'
  if (util > 0.5) return '#F59E0B'
  return '#22C55E'
}

function formatLastCall(iso: string | null): string {
  if (!iso) return 'no calls yet'
  const d = new Date(iso)
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export default function AiSpendTile() {
  const [data, setData]     = useState<AiSpendResponse | null>(null)
  const [error, setError]   = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [updatedAt, setUpdatedAt]   = useState<number | null>(null)

  const load = useCallback(async () => {
    try {
      setRefreshing(true)
      const token = typeof window !== 'undefined' ? localStorage.getItem('admin_session_token') || '' : ''
      const res = await fetch('/api/admin/ai-spend', { headers: { 'x-admin-token': token }, cache: 'no-store' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || `HTTP ${res.status}`)
      }
      const json = (await res.json()) as AiSpendResponse
      setData(json)
      setError(null)
      setUpdatedAt(Date.now())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, 30_000)
    return () => clearInterval(id)
  }, [load])

  const util   = data?.utilisation ?? 0
  const color  = barColor(util)
  const spent  = data?.spendUsd ?? 0
  const cap    = data?.capUsd ?? 5
  const calls  = data?.calls ?? 0
  const sports = data ? Object.entries(data.bySport).sort((a, b) => b[1].spendUsd - a[1].spendUsd) : []

  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: `1px solid ${data ? `${color}33` : '#1F2937'}` }}>
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="flex items-center gap-2">
          <Sparkles size={14} style={{ color }} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>AI Spend Today</span>
        </div>
        <button onClick={load} disabled={refreshing}
          className="flex items-center gap-1 text-[10px]"
          style={{ color: '#6B7280', background: 'transparent', border: 'none', cursor: refreshing ? 'wait' : 'pointer' }}
          aria-label="Refresh">
          <RefreshCw size={10} className={refreshing ? 'animate-spin' : ''} />
          {updatedAt ? new Date(updatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
        </button>
      </div>

      {error ? (
        <div className="text-xs rounded-lg p-2" style={{ color: '#EF4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          Failed to load: {error}
        </div>
      ) : !data ? (
        <div className="text-sm" style={{ color: '#6B7280' }}>Loading…</div>
      ) : (
        <>
          {/* Big number + utilisation */}
          <div className="flex items-baseline justify-between mb-2">
            <div>
              <span className="text-3xl font-bold" style={{ color: '#F9FAFB' }}>${spent.toFixed(2)}</span>
              <span className="text-sm ml-1" style={{ color: '#6B7280' }}>/ ${cap.toFixed(2)}</span>
            </div>
            <span className="text-sm font-bold" style={{ color }}>{Math.round(util * 100)}%</span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full overflow-hidden mb-3" style={{ background: '#1F2937' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, util * 100)}%`, backgroundColor: color }} />
          </div>

          {/* Sub line */}
          <div className="flex items-center justify-between text-xs mb-3" style={{ color: '#6B7280' }}>
            <span>{calls} {calls === 1 ? 'call' : 'calls'} today</span>
            <span>last at {formatLastCall(data.lastCallAt)}</span>
          </div>

          {/* Expandable by-sport list */}
          <button onClick={() => setExpanded(e => !e)}
            className="w-full flex items-center justify-between text-[11px] py-1.5 px-2 rounded-lg transition-all"
            style={{ color: '#9CA3AF', background: expanded ? '#1F2937' : 'transparent', border: '1px solid transparent', cursor: 'pointer' }}>
            <span className="font-semibold">By sport {sports.length > 0 ? `(${sports.length})` : ''}</span>
            <ChevronDown size={12} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
          </button>
          {expanded && (
            <div className="mt-2 space-y-1">
              {sports.length === 0 ? (
                <div className="text-xs px-2 py-2 text-center" style={{ color: '#6B7280' }}>No AI calls logged today</div>
              ) : sports.map(([sport, row]) => {
                const pct = data.spendUsd > 0 ? (row.spendUsd / data.spendUsd) * 100 : 0
                return (
                  <div key={sport} className="relative px-2 py-1.5 flex items-center justify-between text-xs">
                    <div className="absolute inset-0 mx-2 rounded" style={{ width: `${pct}%`, background: `${color}12` }} />
                    <span className="relative capitalize" style={{ color: '#F9FAFB' }}>{sport}</span>
                    <span className="relative font-mono" style={{ color: '#9CA3AF' }}>
                      ${row.spendUsd.toFixed(2)} <span style={{ color: '#4B5563' }}>({row.calls})</span>
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Footer — storage note + reset time */}
          <div className="mt-3 pt-3 text-[10px] flex items-center justify-between" style={{ color: '#4B5563', borderTop: '1px solid #1F2937' }}>
            <span>Resets 00:00 UTC</span>
            <span>{data.storage}</span>
          </div>
        </>
      )}
    </div>
  )
}
