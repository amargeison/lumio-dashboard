'use client'

import { useState, useEffect } from 'react'

interface ProfileData {
  player: any | null
  contract: any | null
  statsHistory: StatsRow[]
  injuries: InjuryRow[]
  acwrScore: any | null
  gpsHistory: GpsRow[]
}

interface StatsRow {
  id: string
  season: string
  competition: string | null
  appearances: number
  goals: number
  assists: number
  yellow_cards: number
  red_cards: number
  avg_rating: number | null
  minutes_played: number
}

interface InjuryRow {
  id: string
  injury_type: string
  body_part: string
  occurred_date: string
  return_date: string | null
  matches_missed: number
  severity: 'Minor' | 'Moderate' | 'Severe'
  notes: string | null
}

interface GpsRow {
  total_distance: number | null
  high_speed_distance: number | null
  sprint_distance: number | null
  max_speed: number | null
  training_load: number | null
  gps_sessions: { session_date: string; session_type: string | null } | null
}

interface Props {
  isOpen: boolean
  onClose: () => void
  playerId: string | null
  playerName?: string | null
  clubId?: string | null
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

type Tab = 'overview' | 'stats' | 'gps' | 'injuries' | 'contract'

function ratingColor(r: number) {
  if (r >= 10) return C.gold
  if (r >= 8) return C.green
  if (r >= 6) return C.amber
  return C.red
}
function statusColor(s: string | null) {
  if (s === 'fit') return C.green
  if (s === 'injured') return C.red
  if (s === 'suspended') return C.amber
  return C.muted
}
function severityColor(s: 'Minor' | 'Moderate' | 'Severe') {
  return s === 'Severe' ? C.red : s === 'Moderate' ? C.amber : C.green
}
function riskColor(r: string | null) {
  if (r === 'High' || r === 'Very High') return C.red
  if (r === 'Moderate') return C.amber
  if (r === 'Undertraining') return C.blue
  return C.green
}

function computeAge(dob: string | null | undefined): number | null {
  if (!dob) return null
  const d = new Date(dob)
  if (isNaN(d.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age
}

export default function PlayerProfileDrawer({ isOpen, onClose, playerId, playerName, clubId, isDemo = false }: Props) {
  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<Tab>('overview')
  const [selectedSeason, setSelectedSeason] = useState<string>('')

  useEffect(() => {
    if (!isOpen || !playerId) {
      setData(null)
      setTab('overview')
      return
    }
    let cancelled = false
    setLoading(true)
    const idParam = encodeURIComponent(playerId)
    const url = `/api/football/player/${idParam}${clubId ? `?clubId=${clubId}` : ''}`
    fetch(url)
      .then((r) => r.ok ? r.json() : null)
      .then((j) => {
        if (cancelled) return
        setData(j)
        if (j?.statsHistory?.length > 0) setSelectedSeason(j.statsHistory[0].season)
        setLoading(false)
      })
      .catch(() => { if (!cancelled) { setData(null); setLoading(false) } })
    return () => { cancelled = true }
  }, [isOpen, playerId, clubId])

  if (!isOpen || !playerId) return null

  const player = data?.player
  const displayName = player?.name ?? playerName ?? 'Player'
  const age = computeAge(player?.date_of_birth)
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  const currentSeason = data?.statsHistory?.[0]
  const seasonStats = data?.statsHistory?.find((s) => s.season === selectedSeason) ?? currentSeason

  // Career chart data — last 3 seasons goals
  const chartSeasons = (data?.statsHistory ?? []).slice(0, 3).reverse()
  const maxGoals = Math.max(1, ...chartSeasons.map((s) => s.goals))

  // GPS chart data
  const gpsForChart = (data?.gpsHistory ?? []).slice().reverse()
  const maxLoad = Math.max(1, ...gpsForChart.map((g) => Number(g.training_load) || 0))

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="h-full overflow-y-auto"
        style={{ width: '480px', maxWidth: '100vw', backgroundColor: C.bg, borderLeft: `1px solid ${C.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="p-4" style={{ borderBottom: `1px solid ${C.border}` }}>
          <button onClick={onClose} className="text-xs mb-3" style={{ color: C.muted }}>← Close</button>
          {isDemo && (
            <div className="text-[10px] mb-3 px-2 py-1 rounded" style={{ backgroundColor: 'rgba(245,158,11,0.10)', color: C.amber, border: `1px solid ${C.amber}33` }}>
              Demo player — connect real squad data to see live profile
            </div>
          )}
          <div className="flex items-start gap-3">
            {player?.photo_url ? (
              <img src={player.photo_url} alt="" className="rounded-full object-cover" style={{ width: 80, height: 80 }} />
            ) : (
              <div className="rounded-full flex items-center justify-center text-2xl font-black" style={{ width: 80, height: 80, backgroundColor: '#003DA5', color: C.yellow }}>
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-lg font-bold" style={{ color: C.text }}>{displayName}</div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {player?.position && (
                  <span className="text-[10px] px-2 py-0.5 rounded font-semibold" style={{ backgroundColor: 'rgba(0,61,165,0.15)', color: C.yellow, border: '1px solid rgba(0,61,165,0.3)' }}>{player.position}</span>
                )}
                {player?.squad_number != null && (
                  <span className="text-[10px] px-2 py-0.5 rounded font-semibold" style={{ backgroundColor: '#1F2937', color: C.text }}>#{player.squad_number}</span>
                )}
                {player?.status && (
                  <span className="text-[10px] px-2 py-0.5 rounded font-semibold uppercase" style={{ backgroundColor: `${statusColor(player.status)}22`, color: statusColor(player.status), border: `1px solid ${statusColor(player.status)}55` }}>{player.status}</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick stats row */}
          <div className="grid grid-cols-4 gap-2 mt-3">
            {[
              { label: 'Apps', value: currentSeason?.appearances ?? '—' },
              { label: 'Goals', value: currentSeason?.goals ?? '—' },
              { label: 'Assists', value: currentSeason?.assists ?? '—' },
              { label: 'Rating', value: currentSeason?.avg_rating ?? '—' },
            ].map((s) => (
              <div key={s.label} className="text-center rounded-lg p-2" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
                <div className="text-sm font-bold" style={{ color: C.text }}>{s.value}</div>
                <div className="text-[9px]" style={{ color: C.muted }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-1 px-3 py-2" style={{ borderBottom: `1px solid ${C.border}` }}>
          {(['overview', 'stats', 'gps', 'injuries', 'contract'] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} className="text-[10px] px-2.5 py-1 rounded font-semibold uppercase" style={{
              backgroundColor: tab === t ? 'rgba(0,61,165,0.15)' : 'transparent',
              color: tab === t ? C.yellow : C.muted,
              border: `1px solid ${tab === t ? 'rgba(0,61,165,0.3)' : 'transparent'}`,
            }}>{t === 'gps' ? 'GPS & Load' : t}</button>
          ))}
        </div>

        {/* BODY */}
        <div className="p-4 space-y-4">
          {loading && <div className="text-xs" style={{ color: C.muted }}>Loading profile...</div>}
          {!loading && !player && (
            <div className="rounded-lg p-4 text-xs" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, color: C.muted }}>
              No profile data available for this player.
            </div>
          )}

          {!loading && player && tab === 'overview' && (
            <>
              <div className="rounded-lg p-3" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
                <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: C.muted }}>Personal Info</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span style={{ color: C.muted }}>Age: </span><span style={{ color: C.text }}>{age ?? '—'}</span></div>
                  <div><span style={{ color: C.muted }}>Nationality: </span><span style={{ color: C.text }}>{player.nationality ?? '—'}</span></div>
                  <div><span style={{ color: C.muted }}>Height: </span><span style={{ color: C.text }}>{player.height_cm ? `${player.height_cm} cm` : '—'}</span></div>
                  <div><span style={{ color: C.muted }}>Weight: </span><span style={{ color: C.text }}>{player.weight_kg ? `${player.weight_kg} kg` : '—'}</span></div>
                  <div><span style={{ color: C.muted }}>Foot: </span><span style={{ color: C.text }}>{player.preferred_foot ?? '—'}</span></div>
                  <div><span style={{ color: C.muted }}>Caps: </span><span style={{ color: C.text }}>{player.international_caps ?? 0}{player.international_team ? ` (${player.international_team})` : ''}</span></div>
                </div>
              </div>

              <div className="rounded-lg p-3" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
                <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: C.muted }}>Current Form</div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div><div style={{ color: C.muted }}>Apps</div><div style={{ color: C.text, fontWeight: 700 }}>{currentSeason?.appearances ?? '—'}</div></div>
                  <div><div style={{ color: C.muted }}>Goals</div><div style={{ color: C.text, fontWeight: 700 }}>{currentSeason?.goals ?? '—'}</div></div>
                  <div><div style={{ color: C.muted }}>Assists</div><div style={{ color: C.text, fontWeight: 700 }}>{currentSeason?.assists ?? '—'}</div></div>
                  <div><div style={{ color: C.muted }}>Rating</div><div style={{ color: C.text, fontWeight: 700 }}>{currentSeason?.avg_rating ?? '—'}</div></div>
                </div>
              </div>

              {Array.isArray(player.previous_clubs) && player.previous_clubs.length > 0 && (
                <div className="rounded-lg p-3" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: C.muted }}>Previous Clubs</div>
                  <div className="text-xs" style={{ color: C.text }}>{player.previous_clubs.join(' · ')}</div>
                </div>
              )}

              {(player.social_instagram || player.social_twitter) && (
                <div className="flex gap-2 text-xs">
                  {player.social_instagram && <span className="px-2 py-1 rounded" style={{ backgroundColor: C.card, color: C.muted, border: `1px solid ${C.border}` }}>📷 {player.social_instagram}</span>}
                  {player.social_twitter && <span className="px-2 py-1 rounded" style={{ backgroundColor: C.card, color: C.muted, border: `1px solid ${C.border}` }}>𝕏 {player.social_twitter}</span>}
                </div>
              )}
            </>
          )}

          {!loading && player && tab === 'stats' && (
            <>
              {(data?.statsHistory ?? []).length === 0 ? (
                <div className="rounded-lg p-4 text-xs" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, color: C.muted }}>No stats history yet.</div>
              ) : (
                <>
                  <select value={selectedSeason} onChange={(e) => setSelectedSeason(e.target.value)} className="text-xs rounded-lg px-2 py-1" style={{ backgroundColor: '#0A0B10', border: `1px solid ${C.border}`, color: C.text }}>
                    {(data?.statsHistory ?? []).map((s) => <option key={s.id} value={s.season}>{s.season}</option>)}
                  </select>
                  {seasonStats && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { l: 'Appearances', v: seasonStats.appearances },
                        { l: 'Minutes', v: seasonStats.minutes_played },
                        { l: 'Goals', v: seasonStats.goals },
                        { l: 'Assists', v: seasonStats.assists },
                        { l: 'Yellow Cards', v: seasonStats.yellow_cards },
                        { l: 'Red Cards', v: seasonStats.red_cards },
                        { l: 'Avg Rating', v: seasonStats.avg_rating ?? '—' },
                      ].map((s) => (
                        <div key={s.l} className="rounded-lg p-2" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
                          <div style={{ color: C.muted }}>{s.l}</div>
                          <div className="font-bold" style={{ color: C.text }}>{s.v}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {chartSeasons.length > 0 && (
                    <div className="rounded-lg p-3" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
                      <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: C.muted }}>Goals per season</div>
                      <svg viewBox="0 0 300 100" className="w-full">
                        {chartSeasons.map((s, i) => {
                          const w = 60
                          const gap = 20
                          const x = i * (w + gap) + 20
                          const h = (s.goals / maxGoals) * 70
                          const y = 90 - h
                          return (
                            <g key={s.id}>
                              <rect x={x} y={y} width={w} height={h} fill={C.purple} rx={2} />
                              <text x={x + w / 2} y={y - 4} fill={C.text} fontSize="10" textAnchor="middle">{s.goals}</text>
                              <text x={x + w / 2} y={98} fill={C.muted} fontSize="8" textAnchor="middle">{s.season}</text>
                            </g>
                          )
                        })}
                      </svg>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {!loading && player && tab === 'gps' && (
            <>
              {data?.acwrScore ? (
                <div className="rounded-lg p-4" style={{ backgroundColor: C.card, border: `2px solid ${riskColor(data.acwrScore.risk_level)}55` }}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.muted }}>ACWR</div>
                    <span className="text-[10px] px-2 py-0.5 rounded font-semibold uppercase" style={{ backgroundColor: `${riskColor(data.acwrScore.risk_level)}22`, color: riskColor(data.acwrScore.risk_level), border: `1px solid ${riskColor(data.acwrScore.risk_level)}55` }}>{data.acwrScore.risk_level}</span>
                  </div>
                  <div className="text-2xl font-black" style={{ color: C.text }}>{Number(data.acwrScore.acwr_ratio).toFixed(2)}</div>
                  <div className="text-xs mt-1" style={{ color: C.muted }}>Acute {data.acwrScore.acute_load} · Chronic {data.acwrScore.chronic_load}</div>
                </div>
              ) : (
                <div className="rounded-lg p-3 text-xs" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, color: C.muted }}>No ACWR score yet.</div>
              )}

              {gpsForChart.length > 0 ? (
                <div className="rounded-lg p-3" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: C.muted }}>Load trend (last {gpsForChart.length})</div>
                  <svg viewBox="0 0 300 100" className="w-full">
                    <line x1={0} y1={45} x2={300} y2={45} stroke={C.red} strokeWidth={0.5} strokeDasharray="3,3" />
                    <polyline
                      fill="none"
                      stroke={C.purple}
                      strokeWidth={2}
                      points={gpsForChart.map((g, i) => {
                        const x = (i / Math.max(1, gpsForChart.length - 1)) * 290 + 5
                        const y = 90 - ((Number(g.training_load) || 0) / maxLoad) * 80
                        return `${x},${y}`
                      }).join(' ')}
                    />
                  </svg>
                </div>
              ) : (
                <div className="rounded-lg p-3 text-xs" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, color: C.muted }}>No GPS sessions uploaded yet.</div>
              )}

              {gpsForChart.length > 0 && (() => {
                const last = data?.gpsHistory?.[0]
                if (!last) return null
                return (
                  <div className="rounded-lg p-3" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
                    <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: C.muted }}>Last Session</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span style={{ color: C.muted }}>Distance: </span><span style={{ color: C.text }}>{last.total_distance ?? '—'} m</span></div>
                      <div><span style={{ color: C.muted }}>HSD: </span><span style={{ color: C.text }}>{last.high_speed_distance ?? '—'} m</span></div>
                      <div><span style={{ color: C.muted }}>Sprint: </span><span style={{ color: C.text }}>{last.sprint_distance ?? '—'} m</span></div>
                      <div><span style={{ color: C.muted }}>Max Speed: </span><span style={{ color: C.text }}>{last.max_speed ?? '—'} m/s</span></div>
                    </div>
                    {last.gps_sessions && (
                      <div className="text-[10px] mt-2" style={{ color: C.muted }}>{last.gps_sessions.session_type ?? 'Session'} · {last.gps_sessions.session_date}</div>
                    )}
                  </div>
                )
              })()}
            </>
          )}

          {!loading && player && tab === 'injuries' && (
            <>
              {(data?.injuries ?? []).length === 0 ? (
                <div className="rounded-lg p-3 text-xs" style={{ backgroundColor: 'rgba(34,197,94,0.10)', color: C.green, border: `1px solid ${C.green}55` }}>No injury records ✓</div>
              ) : (
                <>
                  {(data?.injuries ?? []).map((inj) => (
                    <div key={inj.id} className="rounded-lg p-3" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm font-bold" style={{ color: C.text }}>{inj.injury_type} · {inj.body_part}</div>
                        <span className="text-[10px] px-2 py-0.5 rounded font-semibold uppercase" style={{ backgroundColor: `${severityColor(inj.severity)}22`, color: severityColor(inj.severity), border: `1px solid ${severityColor(inj.severity)}55` }}>{inj.severity}</span>
                      </div>
                      <div className="text-xs" style={{ color: C.muted }}>{inj.occurred_date} → {inj.return_date ?? 'Ongoing'}</div>
                      <div className="text-xs" style={{ color: C.muted }}>Matches missed: {inj.matches_missed}</div>
                      {inj.notes && <div className="text-[10px] mt-1" style={{ color: C.muted }}>{inj.notes}</div>}
                    </div>
                  ))}
                  <div className="rounded-lg p-3 text-xs" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, color: C.muted }}>
                    Total: {data?.injuries.length} · Matches missed: {data?.injuries.reduce((a, i) => a + i.matches_missed, 0)}
                  </div>
                </>
              )}
            </>
          )}

          {!loading && player && tab === 'contract' && (
            <>
              {data?.contract ? (
                <div className="rounded-lg p-3" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: C.muted }}>Contract</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span style={{ color: C.muted }}>Start: </span><span style={{ color: C.text }}>{data.contract.start_date ?? '—'}</span></div>
                    <div><span style={{ color: C.muted }}>End: </span><span style={{ color: C.text }}>{data.contract.end_date ?? '—'}</span></div>
                    <div><span style={{ color: C.muted }}>Wage: </span><span style={{ color: C.text }}>{data.contract.weekly_wage ? `£${data.contract.weekly_wage}/wk` : '—'}</span></div>
                    <div><span style={{ color: C.muted }}>Release: </span><span style={{ color: C.text }}>{data.contract.release_clause ? `£${data.contract.release_clause}` : '—'}</span></div>
                    <div><span style={{ color: C.muted }}>Option: </span><span style={{ color: C.text }}>{data.contract.option_to_extend ? 'Yes' : 'No'}</span></div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg p-3 text-xs" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, color: C.muted }}>No contract on file.</div>
              )}

              {(player.agent_name || player.agent_email) && (
                <div className="rounded-lg p-3" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: C.muted }}>Agent</div>
                  <div className="text-sm font-medium" style={{ color: C.text }}>{player.agent_name ?? '—'}</div>
                  {player.agent_email && <div className="text-xs mt-0.5" style={{ color: C.muted }}>{player.agent_email}</div>}
                  {player.agent_phone && <div className="text-xs" style={{ color: C.muted }}>{player.agent_phone}</div>}
                  {player.agent_email && (
                    <a href={`mailto:${player.agent_email}`} className="inline-block mt-2 text-[10px] px-2 py-1 rounded" style={{ backgroundColor: '#003DA5', color: C.yellow }}>Contact Agent</a>
                  )}
                </div>
              )}

              {player.market_value && (
                <div className="rounded-lg p-3 text-xs" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
                  <div style={{ color: C.muted }}>Market value</div>
                  <div className="text-base font-bold" style={{ color: C.green }}>{player.market_value}</div>
                </div>
              )}
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 flex flex-col gap-2" style={{ borderTop: `1px solid ${C.border}` }}>
          <button disabled title="Coming soon" className="text-xs px-3 py-2 rounded-lg cursor-not-allowed" style={{ backgroundColor: '#1F2937', color: C.muted, border: `1px solid ${C.border}`, opacity: 0.5 }}>Edit Profile</button>
          <button disabled title="Coming soon — AI player assessment" className="text-xs px-3 py-2 rounded-lg cursor-not-allowed" style={{ backgroundColor: C.purple, color: '#fff', opacity: 0.5 }}>Generate AI Report</button>
        </div>
      </div>
    </div>
  )
}
