import React from 'react'

interface Player {
  id?: string
  name: string
  position: string
  age?: number
  nationality?: string
  fitness?: string
  status?: string
  rating?: number
  goals?: number
  assists?: number
  injuryDetails?: string
  returnDate?: string
}

interface Props {
  squad: Player[]
  clubName: string
  date?: string
}

const POSITION_GROUPS: { id: string; label: string; match: (p: string) => boolean }[] = [
  { id: 'GK',  label: 'Goalkeepers', match: (p) => p === 'GK' },
  { id: 'DEF', label: 'Defenders',   match: (p) => /^(DEF|CB|LB|RB|LWB|RWB)$/i.test(p) || p === 'DEF' },
  { id: 'MID', label: 'Midfielders', match: (p) => /^(MID|CM|DM|AM|CDM|CAM|LM|RM)$/i.test(p) || p === 'MID' },
  { id: 'FWD', label: 'Forwards',    match: (p) => /^(FWD|ST|CF|LW|RW|LF|RF)$/i.test(p) || p === 'FWD' },
]

function statusBadge(status?: string) {
  const s = (status ?? 'fit').toLowerCase()
  if (s === 'injured') return <span className="pdf-badge pdf-badge-red">Injured</span>
  if (s === 'suspended') return <span className="pdf-badge pdf-badge-amber">Suspended</span>
  if (s === 'doubt') return <span className="pdf-badge pdf-badge-amber">Doubt</span>
  return <span className="pdf-badge pdf-badge-green">Fit</span>
}

export default function PDFSquadReport({ squad = [], clubName, date }: Props) {
  const safe = Array.isArray(squad) ? squad : []
  const total = safe.length
  const fit = safe.filter((p) => (p.fitness ?? p.status ?? 'fit') === 'fit').length
  const injured = safe.filter((p) => (p.fitness ?? p.status) === 'injured').length
  const suspended = safe.filter((p) => (p.fitness ?? p.status) === 'suspended').length

  return (
    <>
      <div className="pdf-section">
        <h2 className="pdf-section-title">Squad Summary</h2>
        <div className="pdf-stat-grid">
          <div className="pdf-stat-card"><span className="pdf-stat-value">{total}</span><span className="pdf-stat-label">Total Players</span></div>
          <div className="pdf-stat-card"><span className="pdf-stat-value">{fit}</span><span className="pdf-stat-label">Fit</span></div>
          <div className="pdf-stat-card"><span className="pdf-stat-value">{injured}</span><span className="pdf-stat-label">Injured</span></div>
          <div className="pdf-stat-card"><span className="pdf-stat-value">{suspended}</span><span className="pdf-stat-label">Suspended</span></div>
        </div>
      </div>

      <div className="pdf-section">
        <h2 className="pdf-section-title">Full Squad</h2>
        {POSITION_GROUPS.map((group) => {
          const players = safe.filter((p) => group.match(p.position))
          if (players.length === 0) return null
          return (
            <div key={group.id} className="pdf-no-break" style={{ marginBottom: '4mm' }}>
              <p style={{ fontWeight: 700, fontSize: '10pt', margin: '2mm 0' }}>{group.label} ({players.length})</p>
              <table className="pdf-table">
                <thead>
                  <tr>
                    <th>Name</th><th>Pos</th><th>Age</th><th>Nation</th><th>Status</th><th>Rating</th><th>G</th><th>A</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((p, i) => (
                    <tr key={i}>
                      <td>{p.name}</td>
                      <td>{p.position}</td>
                      <td>{p.age ?? '—'}</td>
                      <td>{p.nationality ?? '—'}</td>
                      <td>{statusBadge(p.fitness ?? p.status)}</td>
                      <td>{p.rating ?? '—'}</td>
                      <td>{p.goals ?? 0}</td>
                      <td>{p.assists ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })}
      </div>

      {injured > 0 && (
        <div className="pdf-section pdf-no-break">
          <h2 className="pdf-section-title">Injury Report</h2>
          <table className="pdf-table">
            <thead><tr><th>Player</th><th>Injury</th><th>Expected Return</th></tr></thead>
            <tbody>
              {safe.filter((p) => (p.fitness ?? p.status) === 'injured').map((p, i) => (
                <tr key={i}>
                  <td>{p.name}</td>
                  <td>{p.injuryDetails ?? '—'}</td>
                  <td>{p.returnDate ?? 'TBC'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
