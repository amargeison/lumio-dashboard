'use client'

import { useState, useEffect } from 'react'
import type { MockPlayer, MockFixture } from '@/lib/football-data'

interface KeyMoment {
  minute: number
  type: 'Goal' | 'Red Card' | 'Yellow Card' | 'Injury' | 'Substitution' | 'Save' | 'Chance'
  description: string
  player: string
}

interface PlayerRating {
  name: string
  position: string
  rating: number
  comment: string
}

interface MatchReport {
  headline: string
  result: 'Win' | 'Draw' | 'Loss'
  matchSummary: string
  firstHalfSummary: string
  secondHalfSummary: string
  keyMoments: KeyMoment[]
  playerRatings: PlayerRating[]
  manOfTheMatch: { name: string; rating: number; reason: string }
  tacticalAnalysis: string
  managerQuote: string
  lookingAhead: string
  performanceRating: number
}

interface Props {
  isOpen: boolean
  onClose: () => void
  clubName: string
  league: string
  lastResult: MockFixture | null
  squad: MockPlayer[]
  leaguePosition: number | null
  clubId: string
  isDemo?: boolean
}

const C = {
  bg: '#07080F',
  card: '#111318',
  border: '#1F2937',
  text: '#F9FAFB',
  muted: '#9CA3AF',
  yellow: '#F1C40F',
  gold: '#FFD700',
  green: '#22C55E',
  amber: '#F59E0B',
  red: '#EF4444',
  blue: '#3B82F6',
  purple: '#8B5CF6',
}

const FORMATIONS = ['4-4-2', '4-3-3', '4-2-3-1', '3-5-2', '3-4-3', '5-3-2', '4-1-4-1']

function ratingColor(r: number) {
  if (r >= 10) return C.gold
  if (r >= 8) return C.green
  if (r >= 6) return C.amber
  return C.red
}
function resultColor(r: 'Win' | 'Draw' | 'Loss') {
  return r === 'Win' ? C.green : r === 'Draw' ? C.amber : C.red
}
function momentIcon(t: KeyMoment['type']) {
  switch (t) {
    case 'Goal': return '⚽'
    case 'Red Card': return '🟥'
    case 'Yellow Card': return '🟨'
    case 'Injury': return '🤕'
    case 'Substitution': return '🔁'
    case 'Save': return '🧤'
    case 'Chance': return '🎯'
  }
}

function csvToList(s: string): string[] {
  return s.split(',').map((x) => x.trim()).filter(Boolean)
}

export default function PostMatchAnalysisModal({
  isOpen, onClose, clubName, league, lastResult, squad, leaguePosition, clubId, isDemo = false,
}: Props) {
  const [stage, setStage] = useState<'form' | 'loading' | 'results'>('form')
  const [report, setReport] = useState<MatchReport | null>(null)
  const [reportId, setReportId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadingStep, setLoadingStep] = useState(0)
  const [approved, setApproved] = useState(false)

  // Form state
  const [opponent, setOpponent] = useState<string>('')
  const [ourScore, setOurScore] = useState<number>(0)
  const [opponentScore, setOpponentScore] = useState<number>(0)
  const [venue, setVenue] = useState<'Home' | 'Away'>('Home')
  const [competition, setCompetition] = useState<string>('League One')
  const [matchDate, setMatchDate] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [ourFormation, setOurFormation] = useState<string>('4-3-3')
  const [opponentFormation, setOpponentFormation] = useState<string>('Unknown')
  const [scorers, setScorers] = useState<string>('')
  const [assists, setAssists] = useState<string>('')
  const [motm, setMotm] = useState<string>('')
  const [attendance, setAttendance] = useState<string>('')
  const [yellows, setYellows] = useState<string>('')
  const [reds, setReds] = useState<string>('')
  const [matchInjuries, setMatchInjuries] = useState<string>('')

  // Reset + pre-fill on open
  useEffect(() => {
    if (!isOpen) {
      setStage('form')
      setReport(null)
      setReportId(null)
      setError(null)
      setApproved(false)
      return
    }
    if (isDemo) {
      setOpponent('Stockport County')
      setOurScore(1)
      setOpponentScore(2)
      setVenue('Away')
      setCompetition('League One')
      setOurFormation('4-3-3')
      setOpponentFormation('4-4-2')
      setScorers('Palmer')
      setMotm('Palmer')
      setAttendance('8420')
      return
    }
    if (lastResult) {
      setOpponent(lastResult.opponent)
      setVenue(lastResult.venue === 'Away' ? 'Away' : 'Home')
      setCompetition(lastResult.competition || 'League One')
      if (lastResult.result) {
        const parts = lastResult.result.split('-').map((n) => Number(n))
        if (Number.isFinite(parts[0])) setOurScore(parts[0])
        if (Number.isFinite(parts[1])) setOpponentScore(parts[1])
      }
    }
  }, [isOpen, isDemo, lastResult])

  if (!isOpen) return null

  async function generate() {
    setError(null)
    setStage('loading')
    setLoadingStep(0)
    const t = setInterval(() => setLoadingStep((s) => Math.min(s + 1, 3)), 700)
    try {
      const res = await fetch('/api/ai/post-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clubName,
          clubId,
          league,
          opponent,
          venue,
          competition,
          matchDate,
          ourScore: Number(ourScore) || 0,
          opponentScore: Number(opponentScore) || 0,
          ourFormation,
          opponentFormation: opponentFormation === 'Unknown' ? null : opponentFormation,
          scorers: csvToList(scorers),
          assisters: csvToList(assists),
          yellowCards: csvToList(yellows),
          redCards: csvToList(reds),
          injuriesDuringMatch: csvToList(matchInjuries),
          manOfTheMatch: motm || null,
          attendanceNumber: attendance ? Number(attendance) : null,
          leaguePosition,
        }),
      })
      const json = await res.json()
      clearInterval(t)
      setLoadingStep(3)
      if (!res.ok || !json.report) {
        setError(json.error || 'Failed to generate report')
        setStage('form')
        return
      }
      setReport(json.report as MatchReport)
      setReportId(json.reportId ?? null)
      setStage('results')
    } catch {
      clearInterval(t)
      setError('Failed to generate report')
      setStage('form')
    }
  }

  async function approve() {
    if (!reportId || approved) return
    try {
      const res = await fetch(`/api/ai/post-match/${reportId}/approve`, { method: 'PATCH' })
      if (res.ok) setApproved(true)
    } catch { /* swallow */ }
  }

  void squad // available for future player matching

  const headerScore = `${clubName} ${ourScore} - ${opponentScore} ${opponent || '—'}`
  const resBadgeText: 'Win' | 'Draw' | 'Loss' = report?.result ?? (ourScore > opponentScore ? 'Win' : ourScore < opponentScore ? 'Loss' : 'Draw')

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto" style={{ backgroundColor: 'rgba(0,0,0,0.78)', padding: '40px 20px' }} onClick={onClose}>
      <div className="w-full max-w-4xl rounded-2xl" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }} onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="p-5 flex items-start justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📋</span>
              <h2 className="text-lg font-bold" style={{ color: C.text }}>Post-Match Report</h2>
              <span className="text-[10px] px-2 py-0.5 rounded font-semibold uppercase" style={{ backgroundColor: `${resultColor(resBadgeText)}22`, color: resultColor(resBadgeText), border: `1px solid ${resultColor(resBadgeText)}55` }}>{resBadgeText}</span>
            </div>
            <p className="text-sm font-semibold mt-1" style={{ color: C.text }}>{headerScore}</p>
            <p className="text-xs mt-0.5" style={{ color: C.muted }}>{competition} · {venue} · {matchDate}</p>
          </div>
          <button onClick={onClose} className="text-2xl leading-none" style={{ color: C.muted }}>×</button>
        </div>

        {/* BODY */}
        <div className="p-5">
          {stage === 'form' && (
            <div className="space-y-4">
              {/* ROW 1 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <label className="text-[11px] font-semibold block mb-1" style={{ color: C.muted }}>Opponent</label>
                  <input value={opponent} onChange={(e) => setOpponent(e.target.value)} className="w-full text-sm rounded-lg px-3 py-2" style={{ backgroundColor: '#0A0B10', border: `1px solid #374151`, color: C.text }} />
                </div>
                <div>
                  <label className="text-[11px] font-semibold block mb-1" style={{ color: C.muted }}>Our Score</label>
                  <input type="number" min={0} value={ourScore} onChange={(e) => setOurScore(Number(e.target.value))} className="w-full text-sm rounded-lg px-3 py-2" style={{ backgroundColor: '#0A0B10', border: `1px solid #374151`, color: C.text }} />
                </div>
                <div>
                  <label className="text-[11px] font-semibold block mb-1" style={{ color: C.muted }}>Opponent Score</label>
                  <input type="number" min={0} value={opponentScore} onChange={(e) => setOpponentScore(Number(e.target.value))} className="w-full text-sm rounded-lg px-3 py-2" style={{ backgroundColor: '#0A0B10', border: `1px solid #374151`, color: C.text }} />
                </div>
              </div>
              <div className="flex gap-2">
                {(['Home', 'Away'] as const).map((v) => (
                  <button key={v} onClick={() => setVenue(v)} className="text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: venue === v ? 'rgba(0,61,165,0.15)' : '#1F2937', color: venue === v ? C.yellow : C.muted, border: `1px solid ${venue === v ? 'rgba(0,61,165,0.4)' : C.border}` }}>{v}</button>
                ))}
              </div>

              {/* ROW 2 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-semibold block mb-1" style={{ color: C.muted }}>Competition</label>
                  <input value={competition} onChange={(e) => setCompetition(e.target.value)} className="w-full text-sm rounded-lg px-3 py-2" style={{ backgroundColor: '#0A0B10', border: `1px solid #374151`, color: C.text }} />
                </div>
                <div>
                  <label className="text-[11px] font-semibold block mb-1" style={{ color: C.muted }}>Match Date</label>
                  <input type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} className="w-full text-sm rounded-lg px-3 py-2" style={{ backgroundColor: '#0A0B10', border: `1px solid #374151`, color: C.text }} />
                </div>
                <div>
                  <label className="text-[11px] font-semibold block mb-1" style={{ color: C.muted }}>Our Formation</label>
                  <select value={ourFormation} onChange={(e) => setOurFormation(e.target.value)} className="w-full text-sm rounded-lg px-3 py-2" style={{ backgroundColor: '#0A0B10', border: `1px solid #374151`, color: C.text }}>
                    {FORMATIONS.map((f) => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold block mb-1" style={{ color: C.muted }}>Opponent Formation</label>
                  <select value={opponentFormation} onChange={(e) => setOpponentFormation(e.target.value)} className="w-full text-sm rounded-lg px-3 py-2" style={{ backgroundColor: '#0A0B10', border: `1px solid #374151`, color: C.text }}>
                    <option>Unknown</option>
                    {FORMATIONS.map((f) => <option key={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              {/* ROW 3 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-semibold block mb-1" style={{ color: C.muted }}>Scorers</label>
                  <input value={scorers} onChange={(e) => setScorers(e.target.value)} placeholder="Palmer, Smith" className="w-full text-sm rounded-lg px-3 py-2" style={{ backgroundColor: '#0A0B10', border: `1px solid #374151`, color: C.text }} />
                </div>
                <div>
                  <label className="text-[11px] font-semibold block mb-1" style={{ color: C.muted }}>Assists</label>
                  <input value={assists} onChange={(e) => setAssists(e.target.value)} className="w-full text-sm rounded-lg px-3 py-2" style={{ backgroundColor: '#0A0B10', border: `1px solid #374151`, color: C.text }} />
                </div>
                <div>
                  <label className="text-[11px] font-semibold block mb-1" style={{ color: C.muted }}>Man of the Match</label>
                  <input value={motm} onChange={(e) => setMotm(e.target.value)} className="w-full text-sm rounded-lg px-3 py-2" style={{ backgroundColor: '#0A0B10', border: `1px solid #374151`, color: C.text }} />
                </div>
                <div>
                  <label className="text-[11px] font-semibold block mb-1" style={{ color: C.muted }}>Attendance</label>
                  <input type="number" value={attendance} onChange={(e) => setAttendance(e.target.value)} className="w-full text-sm rounded-lg px-3 py-2" style={{ backgroundColor: '#0A0B10', border: `1px solid #374151`, color: C.text }} />
                </div>
              </div>

              {/* ROW 4 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold block mb-1" style={{ color: C.muted }}>Yellow Cards</label>
                  <input value={yellows} onChange={(e) => setYellows(e.target.value)} className="w-full text-sm rounded-lg px-3 py-2" style={{ backgroundColor: '#0A0B10', border: `1px solid #374151`, color: C.text }} />
                </div>
                <div>
                  <label className="text-[11px] font-semibold block mb-1" style={{ color: C.muted }}>Red Cards</label>
                  <input value={reds} onChange={(e) => setReds(e.target.value)} className="w-full text-sm rounded-lg px-3 py-2" style={{ backgroundColor: '#0A0B10', border: `1px solid #374151`, color: C.text }} />
                </div>
                <div>
                  <label className="text-[11px] font-semibold block mb-1" style={{ color: C.muted }}>In-Match Injuries</label>
                  <input value={matchInjuries} onChange={(e) => setMatchInjuries(e.target.value)} className="w-full text-sm rounded-lg px-3 py-2" style={{ backgroundColor: '#0A0B10', border: `1px solid #374151`, color: C.text }} />
                </div>
              </div>

              {error && <div className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: C.red, border: `1px solid ${C.red}55` }}>{error}</div>}

              <button onClick={generate} className="w-full px-4 py-3 rounded-xl text-sm font-bold" style={{ backgroundColor: C.purple, color: '#fff' }}>Generate Report</button>
              <p className="text-[10px] text-center" style={{ color: C.muted }}>Optional details improve report quality</p>
            </div>
          )}

          {stage === 'loading' && (
            <div className="flex flex-col items-center py-10 gap-3">
              <div className="w-10 h-10 border-2 rounded-full animate-spin" style={{ borderColor: C.border, borderTopColor: C.purple }} />
              {['📊 Processing match data...', '🧠 Analysing performance...', '✍️ Writing report...', '✅ Report generated'].map((msg, i) => (
                <span key={i} className="text-xs" style={{ color: i <= loadingStep ? C.text : C.muted, fontWeight: i === loadingStep ? 600 : 400 }}>{msg}</span>
              ))}
            </div>
          )}

          {stage === 'results' && report && (
            <div className="space-y-5">
              {/* HEADER CARD */}
              <div className="rounded-xl p-5" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-xl font-black leading-tight" style={{ color: C.text }}>{report.headline}</h3>
                  <span className="text-[10px] px-2 py-1 rounded font-semibold uppercase shrink-0" style={{ backgroundColor: `${resultColor(report.result)}22`, color: resultColor(report.result), border: `1px solid ${resultColor(report.result)}55` }}>{report.result}</span>
                </div>
                <p className="text-sm font-bold mb-2" style={{ color: C.text }}>{headerScore}</p>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs" style={{ color: C.muted }}>Performance:</span>
                  <span className="text-sm font-bold" style={{ color: ratingColor(report.performanceRating) }}>{report.performanceRating}/10</span>
                  <div className="flex">{Array.from({ length: 10 }).map((_, i) => (
                    <span key={i} style={{ color: i < report.performanceRating ? ratingColor(report.performanceRating) : '#374151' }}>★</span>
                  ))}</div>
                </div>
                <blockquote className="text-xs italic pl-3" style={{ color: '#D1D5DB', borderLeft: `3px solid ${C.purple}` }}>{report.managerQuote}</blockquote>
              </div>

              {/* SECTION 1 */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: C.muted }}>Match Summary</h4>
                <p className="text-sm leading-relaxed mb-3" style={{ color: '#D1D5DB' }}>{report.matchSummary}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-lg p-3" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
                    <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: C.muted }}>First Half</div>
                    <p className="text-xs" style={{ color: '#D1D5DB' }}>{report.firstHalfSummary}</p>
                  </div>
                  <div className="rounded-lg p-3" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
                    <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: C.muted }}>Second Half</div>
                    <p className="text-xs" style={{ color: '#D1D5DB' }}>{report.secondHalfSummary}</p>
                  </div>
                </div>
              </div>

              {/* SECTION 2 */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: C.muted }}>Key Moments</h4>
                <div className="space-y-2">
                  {(report.keyMoments ?? []).map((m, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg p-3" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
                      <div className="text-xs font-bold w-10 shrink-0" style={{ color: C.yellow }}>{m.minute}'</div>
                      <div className="text-base shrink-0">{momentIcon(m.type)}</div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold" style={{ color: C.text }}>{m.player}</div>
                        <div className="text-xs" style={{ color: C.muted }}>{m.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 3 */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: C.muted }}>Player Ratings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(report.playerRatings ?? []).map((p, i) => (
                    <div key={i} className="rounded-lg p-3" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm font-bold" style={{ color: C.text }}>{p.name}</div>
                        <span className="text-sm font-bold" style={{ color: ratingColor(p.rating) }}>{p.rating}/10</span>
                      </div>
                      <div className="text-[10px] inline-block px-1.5 py-0.5 rounded mb-1" style={{ backgroundColor: 'rgba(0,61,165,0.15)', color: C.yellow }}>{p.position}</div>
                      <p className="text-xs mt-1" style={{ color: C.muted }}>{p.comment}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 4 — MOTM */}
              {report.manOfTheMatch && (
                <div className="rounded-xl p-4" style={{ backgroundColor: C.card, border: `2px solid ${C.gold}` }}>
                  <div className="text-[10px] uppercase tracking-wider font-bold mb-1" style={{ color: C.gold }}>⭐ Man of the Match</div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-base font-bold" style={{ color: C.text }}>{report.manOfTheMatch.name}</div>
                    <div className="text-base font-bold" style={{ color: C.gold }}>{report.manOfTheMatch.rating}/10</div>
                  </div>
                  <p className="text-xs" style={{ color: '#D1D5DB' }}>{report.manOfTheMatch.reason}</p>
                </div>
              )}

              {/* SECTION 5 */}
              <div className="rounded-lg p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
                <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: C.muted }}>Tactical Analysis</h4>
                <p className="text-sm leading-relaxed" style={{ color: '#D1D5DB' }}>{report.tacticalAnalysis}</p>
              </div>

              {/* SECTION 6 */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: C.muted }}>Looking Ahead</h4>
                <p className="text-sm leading-relaxed" style={{ color: '#D1D5DB' }}>{report.lookingAhead}</p>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        {stage === 'results' && (
          <div className="px-5 py-3 flex items-center justify-between flex-wrap gap-2" style={{ borderTop: `1px solid ${C.border}` }}>
            <p className="text-[10px]" style={{ color: C.muted }}>AI-generated — review before publishing</p>
            <div className="flex gap-2">
              <button onClick={approve} disabled={approved || !reportId} className="text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: approved ? C.green : 'rgba(34,197,94,0.15)', color: approved ? '#fff' : C.green, border: `1px solid ${C.green}55`, opacity: !reportId ? 0.5 : 1 }}>{approved ? '✓ Approved' : 'Approve Report'}</button>
              <button onClick={generate} className="text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#1F2937', color: C.text, border: `1px solid ${C.border}` }}>Regenerate</button>
              <button onClick={() => window.print()} className="text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: C.purple, color: '#fff' }}>Print Report</button>
              <button disabled title="Coming soon" className="text-xs px-3 py-1.5 rounded-lg cursor-not-allowed" style={{ backgroundColor: '#1F2937', color: C.muted, border: `1px solid ${C.border}`, opacity: 0.5 }}>Download PDF</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
