import React from 'react'

interface Props {
  clubName: string
  squad?: any[]
  fixtures?: any[]
  finance?: any
  leaguePosition?: number | null
  apiStandings?: any[] | null
}

function resultBadge(home: number, away: number, isHome: boolean) {
  const ours = isHome ? home : away
  const theirs = isHome ? away : home
  if (ours > theirs) return <span className="pdf-badge pdf-badge-green">W</span>
  if (ours < theirs) return <span className="pdf-badge pdf-badge-red">L</span>
  return <span className="pdf-badge pdf-badge-amber">D</span>
}

export default function PDFInsightsReport({ clubName, squad = [], fixtures = [], finance, leaguePosition }: Props) {
  const safeSquad = Array.isArray(squad) ? squad : []
  const safeFix = Array.isArray(fixtures) ? fixtures : []
  const fit = safeSquad.filter((p) => (p.fitness ?? p.status ?? 'fit') === 'fit').length
  const injured = safeSquad.filter((p) => (p.fitness ?? p.status) === 'injured').length
  const suspended = safeSquad.filter((p) => (p.fitness ?? p.status) === 'suspended').length
  const availability = safeSquad.length > 0 ? Math.round((fit / safeSquad.length) * 100) : 0

  const played = safeFix.filter((f: any) => f.result || (f.result_home != null && f.result_away != null))
  const upcoming = safeFix.filter((f: any) => !f.result && f.result_home == null).slice(0, 5)
  const lastFive = played.slice(-5)

  let goalsFor = 0, goalsAgainst = 0
  for (const f of played) {
    const fr = f.result?.match(/(\d+)\s*[-–]\s*(\d+)/)
    if (fr) {
      const isHome = (f.venue ?? '').toLowerCase().startsWith('h')
      goalsFor += isHome ? parseInt(fr[1], 10) : parseInt(fr[2], 10)
      goalsAgainst += isHome ? parseInt(fr[2], 10) : parseInt(fr[1], 10)
    }
  }

  return (
    <>
      <div className="pdf-section">
        <h2 className="pdf-section-title">Season Overview</h2>
        <div className="pdf-stat-grid">
          <div className="pdf-stat-card"><span className="pdf-stat-value">{leaguePosition ?? '—'}</span><span className="pdf-stat-label">League Position</span></div>
          <div className="pdf-stat-card"><span className="pdf-stat-value">{played.length}</span><span className="pdf-stat-label">Games Played</span></div>
          <div className="pdf-stat-card"><span className="pdf-stat-value">{goalsFor}</span><span className="pdf-stat-label">Goals For</span></div>
          <div className="pdf-stat-card"><span className="pdf-stat-value">{goalsAgainst}</span><span className="pdf-stat-label">Goals Against</span></div>
        </div>
      </div>

      <div className="pdf-section">
        <h2 className="pdf-section-title">Squad Health</h2>
        <div className="pdf-stat-grid">
          <div className="pdf-stat-card"><span className="pdf-stat-value">{availability}%</span><span className="pdf-stat-label">Availability</span></div>
          <div className="pdf-stat-card"><span className="pdf-stat-value">{fit}</span><span className="pdf-stat-label">Fit</span></div>
          <div className="pdf-stat-card"><span className="pdf-stat-value">{injured}</span><span className="pdf-stat-label">Injured</span></div>
          <div className="pdf-stat-card"><span className="pdf-stat-value">{suspended}</span><span className="pdf-stat-label">Suspended</span></div>
        </div>
      </div>

      {lastFive.length > 0 && (
        <div className="pdf-section pdf-no-break">
          <h2 className="pdf-section-title">Recent Results</h2>
          <table className="pdf-table">
            <thead><tr><th>Date</th><th>Opponent</th><th>Venue</th><th>Score</th><th>Result</th></tr></thead>
            <tbody>
              {lastFive.map((f: any, i: number) => {
                const m = f.result?.match(/(\d+)\s*[-–]\s*(\d+)/)
                const home = m ? parseInt(m[1], 10) : 0
                const away = m ? parseInt(m[2], 10) : 0
                const isHome = (f.venue ?? '').toLowerCase().startsWith('h')
                return (
                  <tr key={i}>
                    <td>{f.date ?? '—'}</td>
                    <td>{f.opponent}</td>
                    <td>{f.venue}</td>
                    <td>{f.result ?? '—'}</td>
                    <td>{m ? resultBadge(home, away, isHome) : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="pdf-section pdf-no-break">
          <h2 className="pdf-section-title">Upcoming Fixtures</h2>
          <table className="pdf-table">
            <thead><tr><th>Date</th><th>Opponent</th><th>Venue</th><th>Competition</th></tr></thead>
            <tbody>
              {upcoming.map((f: any, i: number) => (
                <tr key={i}>
                  <td>{f.date ?? '—'}</td>
                  <td>{f.opponent}</td>
                  <td>{f.venue ?? '—'}</td>
                  <td>{f.competition ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {finance && (
        <div className="pdf-section pdf-no-break">
          <h2 className="pdf-section-title">Financial Snapshot</h2>
          <div className="pdf-stat-grid pdf-stat-grid-2">
            <div className="pdf-stat-card"><span className="pdf-stat-value">{finance.wageRevRatio ?? '—'}</span><span className="pdf-stat-label">Wage/Revenue Ratio</span></div>
            <div className="pdf-stat-card"><span className="pdf-stat-value">{finance.transferBudget ?? '—'}</span><span className="pdf-stat-label">Transfer Budget</span></div>
          </div>
        </div>
      )}
    </>
  )
}
