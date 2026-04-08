import React from 'react'

interface Props {
  clubName: string
  fanData?: any
}

export default function PDFFanReport({ clubName, fanData }: Props) {
  const data = fanData ?? {}
  const attendance = Array.isArray(data.attendance) ? data.attendance : []
  const nps = Array.isArray(data.nps) ? data.nps : []
  const seasonTickets = Array.isArray(data.seasonTickets) ? data.seasonTickets : []
  const recommendations: string[] = Array.isArray(data.recommendations) ? data.recommendations : []

  return (
    <>
      <div className="pdf-section">
        <h2 className="pdf-section-title">Key Fan Metrics</h2>
        <div className="pdf-stat-grid">
          <div className="pdf-stat-card"><span className="pdf-stat-value">{data.avgAttendance ?? '—'}</span><span className="pdf-stat-label">Avg Attendance</span></div>
          <div className="pdf-stat-card"><span className="pdf-stat-value">{data.npsScore ?? '—'}</span><span className="pdf-stat-label">NPS Score</span></div>
          <div className="pdf-stat-card"><span className="pdf-stat-value">{data.seasonTicketsSold ?? '—'}</span><span className="pdf-stat-label">Season Tickets</span></div>
          <div className="pdf-stat-card"><span className="pdf-stat-value">{data.sentiment ?? '—'}</span><span className="pdf-stat-label">Sentiment</span></div>
        </div>
      </div>

      {attendance.length > 0 && (
        <div className="pdf-section pdf-no-break">
          <h2 className="pdf-section-title">Attendance (Last 10 home matches)</h2>
          <table className="pdf-table">
            <thead><tr><th>Date</th><th>Opponent</th><th>Attendance</th><th>vs Average</th></tr></thead>
            <tbody>
              {attendance.slice(0, 10).map((a: any, i: number) => (
                <tr key={i}><td>{a.date ?? '—'}</td><td>{a.opponent ?? '—'}</td><td>{a.attendance ?? '—'}</td><td>{a.vsAverage ?? '—'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {nps.length > 0 && (
        <div className="pdf-section pdf-no-break">
          <h2 className="pdf-section-title">NPS History</h2>
          <table className="pdf-table">
            <thead><tr><th>Date</th><th>Score</th><th>Responses</th><th>vs Previous</th><th>Trend</th></tr></thead>
            <tbody>
              {nps.map((n: any, i: number) => (
                <tr key={i}><td>{n.date ?? '—'}</td><td>{n.score ?? '—'}</td><td>{n.responses ?? '—'}</td><td>{n.vsPrevious ?? '—'}</td><td>{n.trend ?? '—'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {seasonTickets.length > 0 && (
        <div className="pdf-section pdf-no-break">
          <h2 className="pdf-section-title">Season Tickets</h2>
          <table className="pdf-table">
            <thead><tr><th>Season</th><th>Sold</th><th>Renewal Rate</th><th>Revenue</th><th>vs Previous</th></tr></thead>
            <tbody>
              {seasonTickets.map((s: any, i: number) => (
                <tr key={i}><td>{s.season ?? '—'}</td><td>{s.sold ?? '—'}</td><td>{s.renewalRate ?? '—'}</td><td>{s.revenue ?? '—'}</td><td>{s.vsPrevious ?? '—'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="pdf-section pdf-no-break">
          <h2 className="pdf-section-title">AI Recommendations</h2>
          <ol style={{ paddingLeft: '5mm' }}>
            {recommendations.map((r, i) => <li key={i} style={{ marginBottom: '1mm' }}>{r}</li>)}
          </ol>
        </div>
      )}
    </>
  )
}
