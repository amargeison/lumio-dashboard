'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { hasFeature, type ClubTier } from '@/lib/feature-gates'
import { UpgradePrompt } from './FeatureGate'

interface UpcomingFixture {
  opponent: string
  date?: string
  time?: string
  venue?: string
  competition?: string
  result?: string
}

interface KeyThreat {
  playerName: string
  position: string
  threat: string
  howToStop: string
}

interface TacticalSuggestion {
  phase: 'In Possession' | 'Out of Possession' | 'Set Pieces'
  suggestion: string
}

interface OppositionReport {
  opponentOverview: string
  likelyFormation: string
  keyThreats: KeyThreat[]
  teamStrengths: string[]
  teamWeaknesses: string[]
  tacticalSuggestions: TacticalSuggestion[]
  setPieceWarnings: string[]
  predictedLineup: string[]
  confidenceLevel: 'High' | 'Medium' | 'Low'
  analystNote: string
}

interface OppositionReportModalProps {
  isOpen: boolean
  onClose: () => void
  clubName: string
  league: string
  upcomingFixtures: UpcomingFixture[]
  clubId: string
  isDemo?: boolean
  clubTier?: ClubTier
  onUpgradeClick?: (featureKey?: string) => void
}

const FORMATIONS = ['4-4-2', '4-3-3', '4-2-3-1', '3-5-2', '3-4-3', '5-3-2', '4-1-4-1']

const LOADING_STEPS = [
  '🔍 Scouting',
  '📹 Analysing recent matches...',
  '⚠️ Identifying threats...',
  '✅ Report complete',
]

function normaliseVenue(v?: string | null): 'Home' | 'Away' {
  if (!v) return 'Home'
  const s = v.toLowerCase()
  if (s === 'a' || s.startsWith('away')) return 'Away'
  return 'Home'
}

function parseFormationLines(formation: string, lineup: string[]): string[][] {
  const parts = formation.split('-').map((n) => parseInt(n, 10)).filter((n) => !isNaN(n))
  if (parts.length === 0 || lineup.length < 11) return [lineup]
  const lines: string[][] = []
  // GK first
  lines.push([lineup[0]])
  let idx = 1
  for (const count of parts) {
    lines.push(lineup.slice(idx, idx + count))
    idx += count
  }
  return lines
}

export default function OppositionReportModal({
  isOpen,
  onClose,
  clubName,
  league,
  upcomingFixtures,
  clubId,
  isDemo = false,
  clubTier = 'starter',
  onUpgradeClick,
}: OppositionReportModalProps) {
  const nextFixture = useMemo(
    () => upcomingFixtures.find((f) => !f.result) ?? upcomingFixtures[0] ?? null,
    [upcomingFixtures]
  )

  const [opponentName, setOpponentName] = useState('')
  const [competition, setCompetition] = useState('')
  const [venue, setVenue] = useState<'Home' | 'Away'>('Home')
  const [matchDate, setMatchDate] = useState('')
  const [ourFormation, setOurFormation] = useState('4-3-3')
  const [ourPlayingStyle, setOurPlayingStyle] = useState('')

  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [report, setReport] = useState<OppositionReport | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Pre-fill from next fixture / demo
  useEffect(() => {
    if (!isOpen) return
    if (isDemo) {
      setOpponentName(nextFixture?.opponent ?? 'Wrexham')
      setCompetition('League One')
      setVenue(normaliseVenue(nextFixture?.venue))
      setMatchDate(nextFixture?.date ?? '')
      setOurFormation('4-3-3')
      setOurPlayingStyle('High press, quick transitions')
    } else {
      setOpponentName(nextFixture?.opponent ?? '')
      setCompetition(nextFixture?.competition ?? league)
      setVenue(normaliseVenue(nextFixture?.venue))
      setMatchDate(nextFixture?.date ?? '')
    }
  }, [isOpen, isDemo, nextFixture, league])

  // Loading step animation
  useEffect(() => {
    if (!loading) return
    setLoadingStep(0)
    const t1 = setTimeout(() => setLoadingStep(1), 700)
    const t2 = setTimeout(() => setLoadingStep(2), 1400)
    const t3 = setTimeout(() => setLoadingStep(3), 2100)
    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3)
    }
  }, [loading])

  if (!isOpen) return null

  async function handleGenerate() {
    setError(null)
    setReport(null)
    setLoading(true)
    try {
      const res = await fetch('/api/ai/opposition-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clubName,
          league,
          opponentName,
          matchDate: matchDate || null,
          venue,
          competition: competition || null,
          ourFormation,
          ourPlayingStyle: ourPlayingStyle || null,
          clubId,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.report) {
        setError(data?.error ?? 'Failed to generate report')
        setLoading(false)
        return
      }
      setReport(data.report as OppositionReport)
    } catch (e: any) {
      setError(e?.message ?? 'Network error')
    } finally {
      setLoading(false)
    }
  }

  const confidenceColor =
    report?.confidenceLevel === 'High' ? '#10B981'
    : report?.confidenceLevel === 'Medium' ? '#F59E0B'
    : '#EF4444'

  const lineupLines = report ? parseFormationLines(report.likelyFormation, report.predictedLineup) : []

  return (
    <div className="fixed inset-0 z-[100] flex items-stretch justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
      <div className="w-full h-full overflow-y-auto" style={{ backgroundColor: '#07080F', color: '#F9FAFB' }}>
        {/* HEADER */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4" style={{ backgroundColor: '#0B0D14', borderBottom: '1px solid #1F2937' }}>
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">🕵️ Opposition Report</h2>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
              vs {opponentName || '—'} · {competition || league} · {venue}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:opacity-80" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <X size={16} />
          </button>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-6">
          {/* CONFIGURATION PANEL */}
          {!report && !loading && (
            <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>Opponent</label>
                  <input value={opponentName} onChange={(e) => setOpponentName(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937', color: '#F9FAFB' }} />
                </div>
                <div>
                  <label className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>Competition</label>
                  <input value={competition} onChange={(e) => setCompetition(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937', color: '#F9FAFB' }} />
                </div>
                <div>
                  <label className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>Venue</label>
                  <div className="mt-1 flex gap-2">
                    {(['Home', 'Away'] as const).map((v) => (
                      <button key={v} onClick={() => setVenue(v)} className="px-4 py-2 rounded-lg text-xs font-semibold flex-1"
                        style={{
                          backgroundColor: venue === v ? '#7C3AED' : '#07080F',
                          border: '1px solid #1F2937',
                          color: venue === v ? '#fff' : '#9CA3AF',
                        }}>{v}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>Match date</label>
                  <input type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937', color: '#F9FAFB' }} />
                </div>
                <div>
                  <label className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>Our Formation</label>
                  <select value={ourFormation} onChange={(e) => setOurFormation(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937', color: '#F9FAFB' }}>
                    {FORMATIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>Our Playing Style</label>
                  <input value={ourPlayingStyle} onChange={(e) => setOurPlayingStyle(e.target.value)} placeholder="e.g. High press, quick transitions" className="mt-1 w-full px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937', color: '#F9FAFB' }} />
                </div>
              </div>

              {hasFeature(clubTier, 'ai_opposition_report') ? (
                <button onClick={handleGenerate} disabled={!opponentName} className="w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-50"
                  style={{ backgroundColor: '#7C3AED', color: '#fff' }}>
                  Generate Report
                </button>
              ) : (
                <UpgradePrompt featureKey="ai_opposition_report" featureName="AI Opposition Report" requiredTier="professional" compact onUpgradeClick={onUpgradeClick} />
              )}
              {error && <p className="text-xs" style={{ color: '#EF4444' }}>{error}</p>}
            </div>
          )}

          {/* LOADING */}
          {loading && (
            <div className="rounded-xl p-8 text-center space-y-3" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              {LOADING_STEPS.map((step, i) => (
                <p key={i} className="text-sm transition-opacity"
                  style={{
                    opacity: i <= loadingStep ? 1 : 0.25,
                    color: i === 0 ? '#F9FAFB' : i === loadingStep ? '#A78BFA' : '#9CA3AF',
                  }}>
                  {i === 0 ? `${step} ${opponentName}...` : step}
                </p>
              ))}
            </div>
          )}

          {/* RESULTS */}
          {report && !loading && (
            <div className="space-y-5">
              {/* SECTION 1 — OVERVIEW */}
              <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold">Overview</h3>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: '#1F2937', color: '#F9FAFB' }}>{report.likelyFormation}</span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: confidenceColor, color: '#fff' }}>{report.confidenceLevel} confidence</span>
                  </div>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#D1D5DB' }}>{report.opponentOverview}</p>
                <p className="text-xs italic mt-3" style={{ color: '#6B7280' }}>{report.analystNote}</p>
              </div>

              {/* SECTION 2 — KEY THREATS */}
              <div>
                <h3 className="text-sm font-bold mb-3">Key Threats</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {report.keyThreats.map((t, i) => (
                    <div key={i} className="rounded-xl p-4" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold">{t.playerName}</p>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>{t.position}</span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: '#FCA5A5' }}>{t.threat}</p>
                      <p className="text-xs leading-relaxed mt-2"><span className="font-semibold" style={{ color: '#10B981' }}>How to stop: </span><span style={{ color: '#D1D5DB' }}>{t.howToStop}</span></p>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 3 — STRENGTHS vs WEAKNESSES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <h4 className="text-xs font-bold mb-3" style={{ color: '#EF4444' }}>Team Strengths</h4>
                  <ul className="space-y-2">
                    {report.teamStrengths.map((s, i) => (
                      <li key={i} className="text-xs flex gap-2"><span style={{ color: '#EF4444' }}>⚠️</span><span style={{ color: '#D1D5DB' }}>{s}</span></li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <h4 className="text-xs font-bold mb-3" style={{ color: '#10B981' }}>Team Weaknesses</h4>
                  <ul className="space-y-2">
                    {report.teamWeaknesses.map((w, i) => (
                      <li key={i} className="text-xs flex gap-2"><span style={{ color: '#10B981' }}>✅</span><span style={{ color: '#D1D5DB' }}>{w}</span></li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* SECTION 4 — TACTICAL SUGGESTIONS */}
              <div>
                <h3 className="text-sm font-bold mb-3">Tactical Suggestions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {report.tacticalSuggestions.map((sg, i) => {
                    const color = sg.phase === 'In Possession' ? '#3B82F6' : sg.phase === 'Out of Possession' ? '#EF4444' : '#F59E0B'
                    return (
                      <div key={i} className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: `1px solid ${color}40` }}>
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color }}>{sg.phase}</p>
                        <p className="text-xs leading-relaxed" style={{ color: '#D1D5DB' }}>{sg.suggestion}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* SECTION 5 — SET PIECE WARNINGS */}
              <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.4)' }}>
                <h4 className="text-xs font-bold mb-2" style={{ color: '#F59E0B' }}>⚠️ Set Piece Warnings</h4>
                <ul className="space-y-1">
                  {report.setPieceWarnings.map((w, i) => (
                    <li key={i} className="text-xs" style={{ color: '#FCD34D' }}>• {w}</li>
                  ))}
                </ul>
              </div>

              {/* SECTION 6 — PREDICTED LINEUP */}
              <div className="rounded-xl p-5" style={{ backgroundColor: '#0A1F0A', border: '1px solid #14532D' }}>
                <h3 className="text-sm font-bold mb-4">Predicted Lineup ({report.likelyFormation})</h3>
                <div className="space-y-4">
                  {lineupLines.slice().reverse().map((line, idx) => (
                    <div key={idx} className="flex items-center justify-center gap-3 flex-wrap">
                      {line.map((player, pi) => (
                        <span key={pi} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#F9FAFB' }}>
                          {player}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* FOOTER */}
              <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: '#1F2937' }}>
                <div className="flex gap-2">
                  <button onClick={() => { setReport(null); handleGenerate() }} className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#7C3AED', color: '#fff' }}>Regenerate</button>
                  <button onClick={() => window.print()} className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#F9FAFB' }}>Print Report</button>
                  <button onClick={() => { /* already saved server-side */ }} className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#F9FAFB' }}>Save Report</button>
                </div>
                <p className="text-[10px] italic" style={{ color: '#6B7280' }}>AI-generated scouting report — verify with live footage</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
