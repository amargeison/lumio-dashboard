import React from 'react'

interface MatchReportData {
  headline?: string
  result?: string
  matchSummary?: string
  firstHalfSummary?: string
  secondHalfSummary?: string
  keyMoments?: { minute: number; type: string; description: string; player: string }[]
  playerRatings?: { name: string; position: string; rating: number; comment: string }[]
  manOfTheMatch?: { name: string; rating: number; reason: string }
  tacticalAnalysis?: string
  managerQuote?: string
  lookingAhead?: string
}

interface Props {
  report: MatchReportData | null
  clubName: string
  opponent?: string
  ourScore?: number
  opponentScore?: number
  competition?: string
  venue?: string
  date?: string
  attendance?: number | null
}

export default function PDFMatchReport({ report, clubName, opponent, ourScore, opponentScore, competition, venue, date, attendance }: Props) {
  if (!report) {
    return <p>No match report data.</p>
  }

  return (
    <>
      <div className="pdf-section">
        <h1 className="pdf-headline">{report.headline ?? `${clubName} vs ${opponent ?? '—'}`}</h1>
        <p style={{ fontSize: '14pt', fontWeight: 700 }}>
          {clubName} {ourScore ?? '—'} - {opponentScore ?? '—'} {opponent ?? '—'}
        </p>
        <p style={{ fontSize: '9pt', color: '#666' }}>
          {[competition, venue, date, attendance ? `${attendance} attendance` : null].filter(Boolean).join(' · ')}
        </p>
      </div>

      {report.matchSummary && (
        <div className="pdf-section">
          <h2 className="pdf-section-title">Match Summary</h2>
          <p>{report.matchSummary}</p>
          {report.firstHalfSummary && <p><b>First half:</b> {report.firstHalfSummary}</p>}
          {report.secondHalfSummary && <p><b>Second half:</b> {report.secondHalfSummary}</p>}
        </div>
      )}

      {Array.isArray(report.keyMoments) && report.keyMoments.length > 0 && (
        <div className="pdf-section pdf-no-break">
          <h2 className="pdf-section-title">Key Moments</h2>
          <table className="pdf-table">
            <thead><tr><th>Min</th><th>Event</th><th>Description</th><th>Player</th></tr></thead>
            <tbody>
              {report.keyMoments.map((m, i) => (
                <tr key={i}><td>{m.minute}'</td><td>{m.type}</td><td>{m.description}</td><td>{m.player}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {Array.isArray(report.playerRatings) && report.playerRatings.length > 0 && (
        <div className="pdf-section pdf-no-break">
          <h2 className="pdf-section-title">Player Ratings</h2>
          <table className="pdf-table">
            <thead><tr><th>Name</th><th>Position</th><th>Rating</th><th>Comment</th></tr></thead>
            <tbody>
              {report.playerRatings.map((p, i) => (
                <tr key={i}><td>{p.name}</td><td>{p.position}</td><td>{p.rating}/10</td><td>{p.comment}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {report.manOfTheMatch && (
        <div className="pdf-section pdf-no-break" style={{ background: '#ede9fe', padding: '4mm', borderRadius: '2mm' }}>
          <h2 className="pdf-section-title" style={{ borderBottom: 'none', margin: 0 }}>⭐ Man of the Match</h2>
          <p style={{ fontSize: '12pt', fontWeight: 700 }}>{report.manOfTheMatch.name} — {report.manOfTheMatch.rating}/10</p>
          <p>{report.manOfTheMatch.reason}</p>
        </div>
      )}

      {report.tacticalAnalysis && (
        <div className="pdf-section">
          <h2 className="pdf-section-title">Tactical Analysis</h2>
          <p>{report.tacticalAnalysis}</p>
        </div>
      )}

      {report.managerQuote && (
        <div className="pdf-section pdf-no-break">
          <blockquote className="pdf-quote">"{report.managerQuote}"</blockquote>
        </div>
      )}

      {report.lookingAhead && (
        <div className="pdf-section">
          <h2 className="pdf-section-title">Looking Ahead</h2>
          <p>{report.lookingAhead}</p>
        </div>
      )}
    </>
  )
}
