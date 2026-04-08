'use client'

import { useState, useEffect } from 'react'

interface FixtureLike {
  opponent: string
  homeScore?: number | null
  awayScore?: number | null
  venue: 'Home' | 'Away'
  competition: string
}

interface PressQuestion {
  question: string
  suggestedResponse: string
  topic: 'result' | 'injury' | 'opponent' | 'form' | 'transfer' | 'general'
  sensitivity: 'low' | 'medium' | 'high'
}

interface Props {
  isOpen: boolean
  onClose: () => void
  clubName: string
  lastResult: FixtureLike | null
  upcomingOpponent: string | null
  injuredPlayers: string[]
  suspendedPlayers: string[]
  league: string
  leaguePosition: number | null
}

const C = {
  bg: '#07080F',
  card: '#111318',
  border: '#1F2937',
  text: '#F9FAFB',
  muted: '#9CA3AF',
  yellow: '#F1C40F',
  green: '#22C55E',
  amber: '#F59E0B',
  red: '#EF4444',
  blue: '#3B82F6',
  purple: '#8B5CF6',
}

function topicColor(t: PressQuestion['topic']): string {
  switch (t) {
    case 'result': return C.blue
    case 'injury': return C.red
    case 'opponent': return C.amber
    case 'form': return C.green
    case 'transfer': return C.purple
    default: return '#6B7280'
  }
}
function sensColor(s: PressQuestion['sensitivity']): string {
  return s === 'high' ? C.red : s === 'medium' ? C.amber : C.green
}

export default function PressBriefingModal({
  isOpen,
  onClose,
  clubName,
  lastResult,
  upcomingOpponent,
  injuredPlayers,
  suspendedPlayers,
  league,
  leaguePosition,
}: Props) {
  const [stage, setStage] = useState<'idle' | 'loading' | 'results'>('idle')
  const [questions, setQuestions] = useState<PressQuestion[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loadingStep, setLoadingStep] = useState(0)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})

  useEffect(() => {
    if (!isOpen) {
      setStage('idle')
      setQuestions([])
      setError(null)
      setExpanded({})
    }
  }, [isOpen])

  if (!isOpen) return null

  async function generate() {
    setError(null)
    setStage('loading')
    setLoadingStep(0)
    const t = setInterval(() => setLoadingStep((s) => Math.min(s + 1, 3)), 600)
    try {
      const res = await fetch('/api/ai/press-conference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clubName,
          league,
          leaguePosition,
          lastResult: lastResult
            ? {
                opponent: lastResult.opponent,
                homeScore: lastResult.homeScore ?? null,
                awayScore: lastResult.awayScore ?? null,
                venue: lastResult.venue,
                competition: lastResult.competition,
              }
            : null,
          upcomingOpponent,
          injuredPlayers,
          suspendedPlayers,
        }),
      })
      const json = await res.json()
      clearInterval(t)
      setLoadingStep(3)
      if (!res.ok || !json.questions) {
        setError(json.error || 'Failed to generate briefing')
        setStage('idle')
        return
      }
      setQuestions(json.questions)
      setStage('results')
    } catch {
      clearInterval(t)
      setError('Failed to generate briefing')
      setStage('idle')
    }
  }

  function copyResponse(text: string) {
    if (navigator?.clipboard) navigator.clipboard.writeText(text).catch(() => {})
  }

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', padding: '40px 20px' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl"
        style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="p-5 flex items-start justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎙️</span>
              <h2 className="text-lg font-bold" style={{ color: C.text }}>Press Conference Briefing</h2>
            </div>
            <p className="text-xs mt-1" style={{ color: C.muted }}>{clubName} · {today}</p>
          </div>
          <button onClick={onClose} className="text-xl font-bold" style={{ color: C.muted }}>×</button>
        </div>

        {/* CONTEXT STRIP */}
        <div className="px-5 py-3 flex flex-wrap gap-2" style={{ borderBottom: `1px solid ${C.border}` }}>
          <span className="text-[10px] px-2 py-1 rounded-full" style={{ backgroundColor: '#1F2937', color: C.muted }}>
            Last: {lastResult ? `${lastResult.venue[0]} vs ${lastResult.opponent} ${lastResult.homeScore ?? '–'}-${lastResult.awayScore ?? '–'}` : 'None'}
          </span>
          <span className="text-[10px] px-2 py-1 rounded-full" style={{ backgroundColor: '#1F2937', color: C.muted }}>
            Next: {upcomingOpponent ?? 'TBC'}
          </span>
          <span className="text-[10px] px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.10)', color: C.red }}>
            🤕 {injuredPlayers.length} injured
          </span>
          <span className="text-[10px] px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(245,158,11,0.10)', color: C.amber }}>
            🟥 {suspendedPlayers.length} suspended
          </span>
          {leaguePosition != null && (
            <span className="text-[10px] px-2 py-1 rounded-full" style={{ backgroundColor: '#1F2937', color: C.muted }}>
              {league} · {leaguePosition}{leaguePosition === 1 ? 'st' : leaguePosition === 2 ? 'nd' : leaguePosition === 3 ? 'rd' : 'th'}
            </span>
          )}
        </div>

        {/* BODY */}
        <div className="p-5">
          {stage === 'idle' && (
            <div className="flex flex-col items-center py-8 gap-4">
              <button
                onClick={generate}
                className="px-6 py-3 rounded-xl text-sm font-bold"
                style={{ backgroundColor: C.purple, color: '#fff' }}
              >
                Generate Briefing
              </button>
              <p className="text-xs" style={{ color: C.muted }}>AI will generate 5 likely questions + responses</p>
              {error && <div className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: C.red, border: `1px solid ${C.red}55` }}>{error}</div>}
            </div>
          )}

          {stage === 'loading' && (
            <div className="flex flex-col items-center py-8 gap-3">
              <div className="w-10 h-10 border-2 rounded-full animate-spin" style={{ borderColor: C.border, borderTopColor: C.purple }} />
              {['📰 Reviewing match report...', '🧠 Anticipating media angles...', '✍️ Drafting responses...', '✅ Briefing ready'].map((msg, i) => (
                <span key={i} className="text-xs" style={{ color: i <= loadingStep ? C.text : C.muted, fontWeight: i === loadingStep ? 600 : 400 }}>
                  {msg}
                </span>
              ))}
            </div>
          )}

          {stage === 'results' && (
            <div className="space-y-3">
              {questions.map((q, i) => {
                const open = !!expanded[i]
                const tcol = topicColor(q.topic)
                const scol = sensColor(q.sensitivity)
                return (
                  <div key={i} className="rounded-xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="text-sm font-semibold flex-1" style={{ color: C.text }}>{q.question}</p>
                      <div className="flex gap-1.5 shrink-0">
                        <span className="text-[10px] px-2 py-0.5 rounded font-semibold uppercase" style={{ backgroundColor: `${tcol}22`, color: tcol, border: `1px solid ${tcol}55` }}>{q.topic}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-semibold uppercase" style={{ backgroundColor: `${scol}22`, color: scol, border: `1px solid ${scol}55` }}>{q.sensitivity}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setExpanded((s) => ({ ...s, [i]: !s[i] }))}
                      className="text-[11px] mb-2"
                      style={{ color: C.muted }}
                    >
                      {open ? '▼ Hide response' : '▶ Show response'}
                    </button>
                    {open && (
                      <div className="space-y-2">
                        <p className="text-xs leading-relaxed" style={{ color: '#D1D5DB' }}>{q.suggestedResponse}</p>
                        <button
                          onClick={() => copyResponse(q.suggestedResponse)}
                          className="text-[10px] px-2 py-1 rounded"
                          style={{ backgroundColor: '#1F2937', color: C.text, border: `1px solid ${C.border}` }}
                        >
                          Copy Response
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* FOOTER */}
        {stage === 'results' && (
          <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: `1px solid ${C.border}` }}>
            <p className="text-[10px]" style={{ color: C.muted }}>AI-generated — review before use</p>
            <div className="flex gap-2">
              <button onClick={generate} className="text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#1F2937', color: C.text, border: `1px solid ${C.border}` }}>Regenerate</button>
              <button onClick={() => window.print()} className="text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: C.purple, color: '#fff' }}>Print Briefing</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
