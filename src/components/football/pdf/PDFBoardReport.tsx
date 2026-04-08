import React from 'react'

interface Props {
  clubName: string
  squad?: any[]
  fixtures?: any[]
  finance?: any
  leaguePosition?: number | null
  apiStandings?: any[] | null
  fanMetrics?: any
  league?: string
}

export default function PDFBoardReport({ clubName, squad = [], fixtures = [], finance, leaguePosition, apiStandings, fanMetrics, league = 'EFL League One' }: Props) {
  const safeSquad = Array.isArray(squad) ? squad : []
  const safeFix = Array.isArray(fixtures) ? fixtures : []
  const fit = safeSquad.filter((p) => (p.fitness ?? p.status ?? 'fit') === 'fit').length
  const injured = safeSquad.filter((p) => (p.fitness ?? p.status) === 'injured').length
  const suspended = safeSquad.filter((p) => (p.fitness ?? p.status) === 'suspended').length
  const availability = safeSquad.length > 0 ? Math.round((fit / safeSquad.length) * 100) : 0

  const played = safeFix.filter((f: any) => f.result)
  const upcoming = safeFix.filter((f: any) => !f.result).slice(0, 5)
  const lastFive = played.slice(-5)
  let points = 0
  for (const f of played) {
    const m = f.result?.match(/(\d+)\s*[-–]\s*(\d+)/)
    if (!m) continue
    const isHome = (f.venue ?? '').toLowerCase().startsWith('h')
    const ours = isHome ? parseInt(m[1], 10) : parseInt(m[2], 10)
    const theirs = isHome ? parseInt(m[2], 10) : parseInt(m[1], 10)
    if (ours > theirs) points += 3
    else if (ours === theirs) points += 1
  }
  const next = upcoming[0]

  const summary = `${clubName} currently sits ${leaguePosition ?? '—'} in ${league} with ${points} points from ${played.length} games. Squad availability is ${availability}% with ${injured + suspended} players currently unavailable. The next fixture is ${next?.opponent ?? 'TBC'}${next?.date ? ` on ${next.date}` : ''}.`

  const actions: string[] = []
  if (availability < 80) actions.push('Squad availability below 80% — review training load and rotation')
  if (injured >= 3) actions.push(`${injured} players injured — medical staff to provide return-to-play timelines`)
  if (next) actions.push(`Next fixture: ${next.opponent} (${next.venue ?? '—'}) — match prep underway`)
  if (finance?.wageRevRatio && parseFloat(String(finance.wageRevRatio)) > 0.7) {
    actions.push('Wage/revenue ratio above 70% — review wage budget')
  }
  if (actions.length === 0) actions.push('No critical actions flagged — club operating within normal parameters')

  return (
    <>
      <div className="pdf-section">
        <h2 className="pdf-section-title">Executive Summary</h2>
        <p style={{ fontSize: '9pt', color: '#666' }}>
          Period: This Week · Prepared by Lumio AI · {new Date().toLocaleDateString('en-GB')}
        </p>
        <p>{summary}</p>
      </div>

      {Array.isArray(apiStandings) && apiStandings.length > 0 && (
        <div className="pdf-section pdf-no-break">
          <h2 className="pdf-section-title">League Standings (Top 10)</h2>
          <table className="pdf-table">
            <thead><tr><th>#</th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>Pts</th></tr></thead>
            <tbody>
              {apiStandings.slice(0, 10).map((t: any, i: number) => (
                <tr key={i} className={t.teamName === clubName ? 'pdf-row-highlight' : ''}>
                  <td>{t.rank}</td>
                  <td>{t.teamName}</td>
                  <td>{t.played ?? '—'}</td>
                  <td>{t.wins ?? '—'}</td>
                  <td>{t.draws ?? '—'}</td>
                  <td>{t.losses ?? '—'}</td>
                  <td>{t.points ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {lastFive.length > 0 && (
        <div className="pdf-section pdf-no-break">
          <h2 className="pdf-section-title">Recent Results</h2>
          <table className="pdf-table">
            <thead><tr><th>Date</th><th>Opponent</th><th>Venue</th><th>Result</th></tr></thead>
            <tbody>
              {lastFive.map((f: any, i: number) => (
                <tr key={i}><td>{f.date ?? '—'}</td><td>{f.opponent}</td><td>{f.venue}</td><td>{f.result}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="pdf-page-break" />

      <div className="pdf-section">
        <h2 className="pdf-section-title">Squad Status</h2>
        <div className="pdf-stat-grid">
          <div className="pdf-stat-card"><span className="pdf-stat-value">{safeSquad.length}</span><span className="pdf-stat-label">Total</span></div>
          <div className="pdf-stat-card"><span className="pdf-stat-value">{fit}</span><span className="pdf-stat-label">Fit</span></div>
          <div className="pdf-stat-card"><span className="pdf-stat-value">{injured}</span><span className="pdf-stat-label">Injured</span></div>
          <div className="pdf-stat-card"><span className="pdf-stat-value">{suspended}</span><span className="pdf-stat-label">Suspended</span></div>
        </div>
      </div>

      {finance && (
        <div className="pdf-section pdf-no-break">
          <h2 className="pdf-section-title">Financial Overview</h2>
          <table className="pdf-table">
            <tbody>
              {finance.transferBudget && <tr><td><b>Transfer Budget</b></td><td>{finance.transferBudget}</td></tr>}
              {finance.wageBill && <tr><td><b>Wage Bill</b></td><td>{finance.wageBill}</td></tr>}
              {finance.revenueYTD && <tr><td><b>Revenue YTD</b></td><td>{finance.revenueYTD}</td></tr>}
              {finance.wageRevRatio && <tr><td><b>Wage/Revenue Ratio</b></td><td>{finance.wageRevRatio}</td></tr>}
              {fanMetrics?.avgAttendance && <tr><td><b>Avg Attendance</b></td><td>{fanMetrics.avgAttendance}</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <div className="pdf-section pdf-no-break">
        <h2 className="pdf-section-title">Key Actions Required</h2>
        <ul style={{ paddingLeft: '5mm' }}>
          {actions.map((a, i) => <li key={i} style={{ marginBottom: '1mm' }}>{a}</li>)}
        </ul>
      </div>
    </>
  )
}
