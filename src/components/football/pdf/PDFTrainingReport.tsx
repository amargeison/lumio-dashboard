import React from 'react'

interface Props {
  clubName: string
  sessions?: any[]
  playerPlans?: any[]
  acwrScores?: any[]
  weekStart?: string
}

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

export default function PDFTrainingReport({ clubName, sessions = [], playerPlans = [], acwrScores = [], weekStart }: Props) {
  const safeSessions = Array.isArray(sessions) ? sessions : []
  const safePlans = Array.isArray(playerPlans) ? playerPlans : []
  const safeAcwr = Array.isArray(acwrScores) ? acwrScores : []

  const restDays = safeSessions.filter((s: any) => s.is_rest_day).length
  const intensityRank: Record<string, number> = { 'Very Low': 1, 'Low': 2, 'Medium': 3, 'High': 4, 'Very High': 5 }
  const labels = ['Very Low','Low','Medium','High','Very High']
  const avg = safeSessions.length > 0 ? safeSessions.reduce((a: number, s: any) => a + (intensityRank[s.planned_intensity] ?? 3), 0) / safeSessions.length : 0
  const avgIntensity = safeSessions.length > 0 ? labels[Math.round(avg) - 1] ?? 'Medium' : '—'

  const flagged = safePlans.filter((p: any) => p.risk_flag && p.risk_flag !== 'None')
  const flaggedNames = new Set(flagged.map((p: any) => p.football_players?.name).filter(Boolean))

  // Map sessions by date
  const sessionsByDate: Record<string, any> = {}
  for (const s of safeSessions) sessionsByDate[s.session_date] = s

  // Player availability by name
  const playerNames = Array.from(new Set(safePlans.map((p: any) => p.football_players?.name).filter(Boolean)))

  return (
    <>
      <div className="pdf-section">
        <h2 className="pdf-section-title">Week Summary</h2>
        <div className="pdf-stat-grid">
          <div className="pdf-stat-card"><span className="pdf-stat-value">{safeSessions.length}</span><span className="pdf-stat-label">Sessions Planned</span></div>
          <div className="pdf-stat-card"><span className="pdf-stat-value">{restDays}</span><span className="pdf-stat-label">Rest Days</span></div>
          <div className="pdf-stat-card"><span className="pdf-stat-value">{flaggedNames.size}</span><span className="pdf-stat-label">Players at Risk</span></div>
          <div className="pdf-stat-card"><span className="pdf-stat-value">{avgIntensity}</span><span className="pdf-stat-label">Avg Intensity</span></div>
        </div>
      </div>

      {safeSessions.length > 0 && (
        <div className="pdf-section pdf-no-break">
          <h2 className="pdf-section-title">Session Schedule</h2>
          <table className="pdf-table">
            <thead><tr><th>Date</th><th>Type</th><th>Name</th><th>Duration</th><th>Intensity</th></tr></thead>
            <tbody>
              {safeSessions.map((s: any, i: number) => (
                <tr key={i}>
                  <td>{s.session_date}</td>
                  <td>{s.session_type}</td>
                  <td>{s.session_name}</td>
                  <td>{s.planned_duration_mins} mins</td>
                  <td>{s.planned_intensity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {flagged.length > 0 && (
        <div className="pdf-section pdf-no-break">
          <h2 className="pdf-section-title">Risk Flags</h2>
          <table className="pdf-table">
            <thead><tr><th>Player</th><th>Risk Level</th><th>ACWR</th><th>Reason</th></tr></thead>
            <tbody>
              {flagged.map((p: any, i: number) => {
                const acwr = safeAcwr.find((a: any) => a.player_name === p.football_players?.name)?.acwr_ratio
                return (
                  <tr key={i}>
                    <td>{p.football_players?.name ?? '—'}</td>
                    <td>{p.risk_flag}</td>
                    <td>{acwr ?? '—'}</td>
                    <td>{p.flag_reason ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {playerNames.length > 0 && safeSessions.length > 0 && (
        <div className="pdf-section pdf-no-break">
          <h2 className="pdf-section-title">Player Availability</h2>
          <table className="pdf-table">
            <thead><tr><th>Player</th>{safeSessions.map((s: any, i: number) => <th key={i}>{DAYS[(new Date(s.session_date).getDay() + 6) % 7]}</th>)}</tr></thead>
            <tbody>
              {playerNames.map((name, i) => (
                <tr key={i}>
                  <td>{name}</td>
                  {safeSessions.map((s: any, j: number) => {
                    const plan = safePlans.find((p: any) => p.session_id === s.id && p.football_players?.name === name)
                    return <td key={j}>{plan?.participation ?? '—'}</td>
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
