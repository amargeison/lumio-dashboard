'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { X, Plus, ChevronLeft, ChevronRight, Printer } from 'lucide-react'
import { usePDFExport } from '@/lib/pdf-export'
import PDFHeader from '@/components/football/pdf/PDFHeader'
import PDFTrainingReport from '@/components/football/pdf/PDFTrainingReport'

type Intensity = 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High'
type SessionType = 'Match' | 'Tactical' | 'Technical' | 'Physical' | 'Recovery' | 'Rest' | 'Matchday Minus 1' | 'Matchday Minus 2' | 'Gym'
type Participation = 'Full' | 'Modified' | 'Individual' | 'Rest' | 'Unavailable'
type RiskFlag = 'None' | 'Monitor' | 'Caution' | 'High Risk'

interface Session {
  id: string
  session_date: string
  session_name: string
  session_type: SessionType
  planned_duration_mins: number
  planned_intensity: Intensity
  planned_load_au: number | null
  is_rest_day: boolean
  notes: string | null
}

interface PlayerPlan {
  id: string
  session_id: string
  player_id: string | null
  participation: Participation
  load_cap_au: number | null
  acwr_at_planning: number | null
  risk_flag: RiskFlag
  flag_reason: string | null
  football_players?: { name: string; position: string; status: string } | null
}

interface ACWRScore {
  id: string
  player_id: string | null
  player_name: string
  acwr_ratio: number
  chronic_load: number
  risk_level: string
}

interface SquadPlayer {
  id?: string
  name: string
  position: string
  fitness?: string
}

interface Props {
  clubId: string | null
  squad: SquadPlayer[]
  acwrScores?: ACWRScore[]
  upcomingFixtures?: any[]
  isDemo?: boolean
}

const INTENSITY_COLORS: Record<Intensity, string> = {
  'Very Low': '#6B7280',
  'Low': '#3B82F6',
  'Medium': '#F59E0B',
  'High': '#EF4444',
  'Very High': '#EF4444',
}

const TYPE_COLORS: Record<string, string> = {
  Match: '#F1C40F',
  Tactical: '#A855F7',
  Technical: '#3B82F6',
  Physical: '#EF4444',
  Recovery: '#22C55E',
  Rest: '#6B7280',
  'Matchday Minus 1': '#F59E0B',
  'Matchday Minus 2': '#F59E0B',
  Gym: '#EC4899',
}

const PARTICIPATION_DOT: Record<Participation, string> = {
  Full: '#22C55E',
  Modified: '#F59E0B',
  Individual: '#3B82F6',
  Rest: '#6B7280',
  Unavailable: '#EF4444',
}

const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

function mondayOf(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay() // 0=Sun
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function addDays(d: Date, n: number): Date {
  const c = new Date(d); c.setDate(c.getDate() + n); return c
}

function acwrColor(ratio: number): string {
  if (ratio < 0.8) return '#3B82F6'
  if (ratio <= 1.3) return '#22C55E'
  if (ratio <= 1.5) return '#F59E0B'
  return '#EF4444'
}

function acwrPulses(ratio: number): boolean {
  return ratio > 2.0
}

export default function TrainingPlannerView({ clubId, squad, isDemo = false }: Props) {
  const { exportPDF, isExporting: pdfExporting } = usePDFExport()
  const [weekStart, setWeekStart] = useState<Date>(() => mondayOf(new Date()))
  const [sessions, setSessions] = useState<Session[]>([])
  const [playerPlans, setPlayerPlans] = useState<PlayerPlan[]>([])
  const [acwrScores, setAcwrScores] = useState<ACWRScore[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showRiskPanel, setShowRiskPanel] = useState(true)

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])
  const weekStartIso = isoDate(weekStart)
  const weekEndIso = isoDate(addDays(weekStart, 6))

  async function loadWeek() {
    if (!clubId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/football/training-planner?clubId=${clubId}&weekStart=${weekStartIso}`)
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Failed to load')
      } else {
        setSessions(json.sessions ?? [])
        setPlayerPlans(json.playerPlans ?? [])
        setAcwrScores(json.acwrScores ?? [])
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadWeek() }, [clubId, weekStartIso])

  const sessionsByDate = useMemo(() => {
    const map: Record<string, Session> = {}
    for (const s of sessions) map[s.session_date] = s
    return map
  }, [sessions])

  const plansBySessionAndName = useMemo(() => {
    const map: Record<string, Record<string, PlayerPlan>> = {}
    for (const p of playerPlans) {
      if (!map[p.session_id]) map[p.session_id] = {}
      const name = p.football_players?.name
      if (name) map[p.session_id][name] = p
    }
    return map
  }, [playerPlans])

  const acwrByName = useMemo(() => {
    const m = new Map<string, ACWRScore>()
    for (const a of acwrScores) m.set(a.player_name, a)
    return m
  }, [acwrScores])

  const flaggedPlayers = useMemo(() => {
    const flagged: { name: string; ratio: number; risk: string; sessionsFlagged: number; recommendation: string }[] = []
    const counts: Record<string, { count: number; risk: string; ratio: number }> = {}
    for (const p of playerPlans) {
      if (p.risk_flag === 'None') continue
      const name = p.football_players?.name ?? '—'
      const score = acwrByName.get(name)
      if (!counts[name]) counts[name] = { count: 0, risk: p.risk_flag, ratio: score?.acwr_ratio ?? 0 }
      counts[name].count++
      if (p.risk_flag === 'High Risk') counts[name].risk = 'High Risk'
    }
    for (const [name, info] of Object.entries(counts)) {
      const recommendation = info.risk === 'High Risk'
        ? 'Reduce load by 30% — consider rest day'
        : info.risk === 'Caution'
        ? 'Monitor closely — cap at 85% chronic load'
        : 'Undertraining detected — consider load increase'
      flagged.push({ name, ratio: info.ratio, risk: info.risk, sessionsFlagged: info.count, recommendation })
    }
    return flagged.sort((a, b) => b.sessionsFlagged - a.sessionsFlagged)
  }, [playerPlans, acwrByName])

  const summary = useMemo(() => {
    const total = sessions.length
    const restDays = sessions.filter((s) => s.is_rest_day).length
    const intensityRank: Record<Intensity, number> = { 'Very Low': 1, 'Low': 2, 'Medium': 3, 'High': 4, 'Very High': 5 }
    const labels: Intensity[] = ['Very Low','Low','Medium','High','Very High']
    const avg = total > 0 ? sessions.reduce((a, s) => a + intensityRank[s.planned_intensity], 0) / total : 0
    return {
      total,
      restDays,
      avgIntensity: total > 0 ? labels[Math.round(avg) - 1] ?? 'Medium' : '—',
      atRisk: flaggedPlayers.length,
    }
  }, [sessions, flaggedPlayers])

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">📅 Training Planner</h2>
          <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
            Week of {weekStart.toLocaleDateString()} — {addDays(weekStart, 6).toLocaleDateString()}
            {isDemo && <span className="ml-2 px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>⚡ Live demo</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="p-2 rounded-lg" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}><ChevronLeft size={14} /></button>
          <button onClick={() => setWeekStart(mondayOf(new Date()))} className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>Today</button>
          <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="p-2 rounded-lg" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}><ChevronRight size={14} /></button>
          <button onClick={() => setShowAdd(true)} className="text-xs px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5" style={{ backgroundColor: '#7C3AED', color: '#fff' }}>
            <Plus size={12} /> Add Session
          </button>
          <button onClick={() => exportPDF('training', `Training Plan ${weekStartIso}.pdf`)} disabled={pdfExporting} className="text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 disabled:opacity-50" style={{ backgroundColor: '#7C3AED', color: '#fff' }}>
            <Printer size={12} /> {pdfExporting ? 'Preparing...' : '📄 Export PDF'}
          </button>
        </div>
      </div>

      {/* Risk banner */}
      {flaggedPlayers.length > 0 && (
        <div className="rounded-lg px-4 py-3 text-xs font-semibold" style={{ backgroundColor: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.4)', color: '#F59E0B' }}>
          ⚠️ {flaggedPlayers.length} players at elevated injury risk this week
        </div>
      )}

      {error && <p className="text-xs" style={{ color: '#EF4444' }}>{error}</p>}
      {loading && <p className="text-xs" style={{ color: '#9CA3AF' }}>Loading week...</p>}

      {/* Empty state */}
      {!loading && sessions.length === 0 && (
        <div className="rounded-xl p-10 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <p className="text-sm" style={{ color: '#9CA3AF' }}>No sessions planned — click <span className="font-semibold" style={{ color: '#A78BFA' }}>Add Session</span> to get started.</p>
        </div>
      )}

      {/* CALENDAR GRID */}
      {sessions.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ minWidth: 900 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1F2937' }}>
                  <th className="text-left px-3 py-3 sticky left-0 z-10" style={{ backgroundColor: '#0A0B10', color: '#6B7280', minWidth: 180 }}>Player</th>
                  {days.map((d, i) => {
                    const iso = isoDate(d)
                    const s = sessionsByDate[iso]
                    const isMatch = s?.session_type === 'Match'
                    const isRest = s?.is_rest_day
                    const bg = isMatch ? 'rgba(241,196,15,0.08)' : isRest ? 'rgba(107,114,128,0.08)' : 'transparent'
                    return (
                      <th key={i} className="px-2 py-3 text-left align-top" style={{ backgroundColor: bg, minWidth: 130, borderLeft: '1px solid #1F2937' }}>
                        <p className="text-[10px]" style={{ color: '#6B7280' }}>{DAY_NAMES[i]} {d.getDate()}/{d.getMonth() + 1}</p>
                        {s ? (
                          <>
                            {isMatch ? (
                              <p className="text-sm font-bold mt-1" style={{ color: '#F1C40F' }}>⚽ Match</p>
                            ) : isRest ? (
                              <p className="text-sm font-bold mt-1" style={{ color: '#9CA3AF' }}>😴 Rest</p>
                            ) : (
                              <>
                                <p className="text-xs font-bold mt-1" style={{ color: '#F9FAFB' }}>{s.session_name}</p>
                                <div className="flex items-center gap-1 mt-1 flex-wrap">
                                  <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${TYPE_COLORS[s.session_type] ?? '#1F2937'}33`, color: TYPE_COLORS[s.session_type] ?? '#9CA3AF' }}>{s.session_type}</span>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${s.planned_intensity === 'Very High' ? 'animate-pulse' : ''}`} style={{ backgroundColor: `${INTENSITY_COLORS[s.planned_intensity]}33`, color: INTENSITY_COLORS[s.planned_intensity] }}>{s.planned_intensity}</span>
                                </div>
                                <p className="text-[9px] mt-1" style={{ color: '#6B7280' }}>{s.planned_duration_mins} mins</p>
                              </>
                            )}
                          </>
                        ) : (
                          <p className="text-[10px] mt-1" style={{ color: '#4B5563' }}>—</p>
                        )}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {squad.map((player, ri) => {
                  const acwr = acwrByName.get(player.name)
                  const ratio = acwr?.acwr_ratio ?? 0
                  return (
                    <tr key={ri} style={{ borderBottom: '1px solid #1F2937' }}>
                      <td className="px-3 py-2 sticky left-0 z-10" style={{ backgroundColor: '#0A0B10' }}>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>{player.position}</span>
                          <span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{player.name}</span>
                          {ratio > 0 && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${acwrPulses(ratio) ? 'animate-pulse' : ''}`} style={{ backgroundColor: `${acwrColor(ratio)}33`, color: acwrColor(ratio) }}>
                              {ratio.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </td>
                      {days.map((d, di) => {
                        const iso = isoDate(d)
                        const s = sessionsByDate[iso]
                        if (!s) return <td key={di} className="px-2 py-2" style={{ borderLeft: '1px solid #1F2937' }} />
                        const plan = plansBySessionAndName[s.id]?.[player.name]
                        const bg =
                          plan?.risk_flag === 'High Risk' ? 'rgba(239,68,68,0.12)'
                          : plan?.risk_flag === 'Caution' ? 'rgba(245,158,11,0.10)'
                          : plan?.risk_flag === 'Monitor' ? 'rgba(59,130,246,0.10)'
                          : 'transparent'
                        return (
                          <td key={di} className="px-2 py-2 align-top" style={{ borderLeft: '1px solid #1F2937', backgroundColor: bg }}>
                            {plan ? (
                              <div>
                                <div className="flex items-center gap-1">
                                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: PARTICIPATION_DOT[plan.participation], display: 'inline-block' }} />
                                  <span className="text-[10px]" style={{ color: '#D1D5DB' }}>{plan.participation}</span>
                                </div>
                                {plan.load_cap_au && (
                                  <p className="text-[9px] mt-0.5" style={{ color: '#F59E0B' }}>⚡ Max {Math.round(plan.load_cap_au)} AU</p>
                                )}
                                {plan.participation === 'Unavailable' && plan.flag_reason && (
                                  <p className="text-[9px] mt-0.5" style={{ color: '#EF4444' }}>{plan.flag_reason}</p>
                                )}
                              </div>
                            ) : s.is_rest_day ? (
                              <span className="text-[10px]" style={{ color: '#6B7280' }}>—</span>
                            ) : player.fitness === 'injured' ? (
                              <div className="flex items-center gap-1"><span style={{ color: '#EF4444' }}>✕</span><span className="text-[9px]" style={{ color: '#EF4444' }}>Injured</span></div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#22C55E', display: 'inline-block' }} />
                                <span className="text-[10px]" style={{ color: '#9CA3AF' }}>Full</span>
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* WEEK SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Sessions Planned', value: String(summary.total), color: '#3B82F6' },
          { label: 'Avg Intensity', value: String(summary.avgIntensity), color: '#F59E0B' },
          { label: 'Players at Risk', value: String(summary.atRisk), color: '#EF4444' },
          { label: 'Rest Days', value: String(summary.restDays), color: '#22C55E' },
        ].map((c) => (
          <div key={c.label} className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: '#6B7280' }}>{c.label}</p>
            <p className="text-xl font-bold mt-1" style={{ color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* RISK PANEL */}
      {flaggedPlayers.length > 0 && (
        <div className="rounded-xl" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <button onClick={() => setShowRiskPanel((v) => !v)} className="w-full px-5 py-3 flex items-center justify-between" style={{ borderBottom: showRiskPanel ? '1px solid #1F2937' : 'none' }}>
            <span className="text-sm font-bold">🚨 Risk Flags This Week ({flaggedPlayers.length})</span>
            <span className="text-xs" style={{ color: '#6B7280' }}>{showRiskPanel ? '−' : '+'}</span>
          </button>
          {showRiskPanel && (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {flaggedPlayers.map((f) => {
                const color = f.risk === 'High Risk' ? '#EF4444' : f.risk === 'Caution' ? '#F59E0B' : '#3B82F6'
                return (
                  <div key={f.name} className="rounded-lg p-3" style={{ backgroundColor: '#0A0B10', border: `1px solid ${color}40` }}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold">{f.name}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold" style={{ backgroundColor: `${color}33`, color }}>{f.risk}</span>
                    </div>
                    <p className="text-[10px]" style={{ color: '#9CA3AF' }}>ACWR {f.ratio.toFixed(2)} · {f.sessionsFlagged} session{f.sessionsFlagged !== 1 ? 's' : ''} flagged</p>
                    <p className="text-xs mt-2" style={{ color: '#D1D5DB' }}>{f.recommendation}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      <div className="pdf-content" id="pdf-training-content" aria-hidden="true">
        <PDFHeader clubName="Training Plan" reportTitle="Weekly Training Plan" reportSubtitle={`Week of ${weekStartIso}`} />
        <PDFTrainingReport clubName="" sessions={sessions as any} playerPlans={playerPlans as any} acwrScores={acwrScores as any} weekStart={weekStartIso} />
        <div className="pdf-footer"><span>Powered by Lumio · lumiosports.com</span><span>Confidential — internal use</span><span>{new Date().toLocaleDateString('en-GB')}</span></div>
      </div>

      {/* ADD SESSION MODAL */}
      {showAdd && (
        <AddSessionModal
          clubId={clubId}
          defaultDate={weekStartIso}
          onClose={() => setShowAdd(false)}
          onCreated={() => { setShowAdd(false); loadWeek() }}
        />
      )}
    </div>
  )
}

function AddSessionModal({ clubId, defaultDate, onClose, onCreated }: { clubId: string | null; defaultDate: string; onClose: () => void; onCreated: () => void }) {
  const [sessionDate, setSessionDate] = useState(defaultDate)
  const [sessionName, setSessionName] = useState('')
  const [sessionType, setSessionType] = useState<SessionType>('Tactical')
  const [duration, setDuration] = useState('90')
  const [intensity, setIntensity] = useState<Intensity>('Medium')
  const [loadAu, setLoadAu] = useState('')
  const [notes, setNotes] = useState('')
  const [isRest, setIsRest] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submit() {
    if (!clubId || !sessionName) { setErr('Name required'); return }
    setSaving(true)
    setErr(null)
    try {
      const res = await fetch('/api/football/training-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clubId,
          sessionDate,
          sessionName,
          sessionType,
          plannedDurationMins: parseInt(duration, 10) || 90,
          plannedIntensity: intensity,
          plannedLoadAu: loadAu ? parseFloat(loadAu) : null,
          notes: notes || null,
          isRestDay: isRest,
        }),
      })
      const json = await res.json()
      if (!res.ok) setErr(json.error ?? 'Failed')
      else onCreated()
    } catch {
      setErr('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="rounded-xl w-full max-w-lg p-5" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold">Add Training Session</h3>
          <button onClick={onClose} className="p-1.5 rounded" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}><X size={14} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-[10px] font-semibold" style={{ color: '#9CA3AF' }}>Session Name</label>
            <input value={sessionName} onChange={(e) => setSessionName(e.target.value)} className="mt-1 w-full px-2 py-1.5 rounded text-xs" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937', color: '#F9FAFB' }} />
          </div>
          <div>
            <label className="text-[10px] font-semibold" style={{ color: '#9CA3AF' }}>Date</label>
            <input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} className="mt-1 w-full px-2 py-1.5 rounded text-xs" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937', color: '#F9FAFB' }} />
          </div>
          <div>
            <label className="text-[10px] font-semibold" style={{ color: '#9CA3AF' }}>Type</label>
            <select value={sessionType} onChange={(e) => setSessionType(e.target.value as SessionType)} className="mt-1 w-full px-2 py-1.5 rounded text-xs" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937', color: '#F9FAFB' }}>
              {(['Match','Tactical','Technical','Physical','Recovery','Rest','Matchday Minus 1','Matchday Minus 2','Gym'] as SessionType[]).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold" style={{ color: '#9CA3AF' }}>Duration (mins)</label>
            <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="mt-1 w-full px-2 py-1.5 rounded text-xs" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937', color: '#F9FAFB' }} />
          </div>
          <div>
            <label className="text-[10px] font-semibold" style={{ color: '#9CA3AF' }}>Intensity</label>
            <select value={intensity} onChange={(e) => setIntensity(e.target.value as Intensity)} className="mt-1 w-full px-2 py-1.5 rounded text-xs" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937', color: '#F9FAFB' }}>
              {(['Very Low','Low','Medium','High','Very High'] as Intensity[]).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-[10px] font-semibold" style={{ color: '#9CA3AF' }}>Estimated Load (AU, optional)</label>
            <input type="number" value={loadAu} onChange={(e) => setLoadAu(e.target.value)} className="mt-1 w-full px-2 py-1.5 rounded text-xs" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937', color: '#F9FAFB' }} />
          </div>
          <div className="col-span-2">
            <label className="text-[10px] font-semibold" style={{ color: '#9CA3AF' }}>Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1 w-full px-2 py-1.5 rounded text-xs" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937', color: '#F9FAFB' }} />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <input type="checkbox" checked={isRest} onChange={(e) => setIsRest(e.target.checked)} id="rest" />
            <label htmlFor="rest" className="text-xs" style={{ color: '#9CA3AF' }}>Rest day</label>
          </div>
        </div>
        {err && <p className="text-xs mt-2" style={{ color: '#EF4444' }}>{err}</p>}
        <button onClick={submit} disabled={saving} className="mt-4 w-full py-2 rounded-lg text-xs font-semibold disabled:opacity-50" style={{ backgroundColor: '#7C3AED', color: '#fff' }}>
          {saving ? 'Creating...' : 'Create Session'}
        </button>
      </div>
    </div>
  )
}
