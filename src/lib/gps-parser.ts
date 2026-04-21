// ═══════════════════════════════════════════════════════════════════════════════
// GPS CSV parser supporting Lumio GPS exports and common legacy vendor formats.
// Two-stage matching: exact column names from spec first, then fuzzy substring
// fallback for real-world export variance. Never throws.
// ═══════════════════════════════════════════════════════════════════════════════

export interface ParsedPlayerLoad {
  playerName: string
  totalDistanceM: number
  highSpeedDistanceM: number | null
  sprintDistanceM: number | null
  maxSpeedMs: number | null
  accelDecelCount: number | null
  sessionRpe: number | null
  trainingLoad: number
}

export interface ParsedGPSSession {
  source: 'Catapult' | 'STATSports' | 'Unknown'
  sessionDate: string
  sessionType: string
  rows: ParsedPlayerLoad[]
}

export const CATAPULT_COLUMNS = {
  playerName: ['Name', 'Player Name', 'Athlete'],
  totalDistance: ['Total Distance', 'Distance (m)', 'Total Dist'],
  highSpeedDistance: ['HSR Distance', 'High Speed Running', 'HSR'],
  sprintDistance: ['Sprint Distance', 'Sprinting', 'Sprint Dist'],
  maxSpeed: ['Max Speed', 'Top Speed', 'Maximum Speed'],
  accelDecel: ['Accel/Decel', 'Accelerations', 'Acc/Dec Count'],
  rpe: ['RPE', 'Session RPE', 'Perceived Exertion'],
  sessionDate: ['Date', 'Session Date'],
  sessionType: ['Session Type', 'Type', 'Activity Type'],
} as const

export const STATSPORTS_COLUMNS = {
  playerName: ['Player', 'Name', 'Athlete Name'],
  totalDistance: ['Total Distance', 'Dist (m)', 'Distance'],
  highSpeedDistance: ['High Speed Distance', 'HSD', 'High Intensity'],
  sprintDistance: ['Max Speed Zone Distance', 'Sprint', 'Speed Zone 6'],
  maxSpeed: ['Max Speed', 'Peak Speed', 'Top Speed (m/s)'],
  accelDecel: ['Total IMA Accel', 'Accelerations + Decelerations'],
  rpe: ['RPE', 'Session RPE'],
  sessionDate: ['Date', 'Session Date', 'Start Date'],
  sessionType: ['Session Type', 'Activity'],
} as const

type ColMap = { [k: string]: readonly string[] }

function scoreFormat(headers: string[], cols: ColMap): number {
  const lc = headers.map((h) => h.toLowerCase().trim())
  let score = 0
  for (const candidates of Object.values(cols)) {
    for (const c of candidates) {
      if (lc.includes(c.toLowerCase())) { score += 2; break }
      if (lc.some((h) => h.includes(c.toLowerCase()) || c.toLowerCase().includes(h))) { score += 1; break }
    }
  }
  return score
}

export function detectFormat(headers: string[]): 'Catapult' | 'STATSports' | 'Unknown' {
  if (!headers || headers.length === 0) return 'Unknown'
  const cat = scoreFormat(headers, CATAPULT_COLUMNS)
  const sts = scoreFormat(headers, STATSPORTS_COLUMNS)
  if (cat === 0 && sts === 0) return 'Unknown'
  return cat >= sts ? 'Catapult' : 'STATSports'
}

function findHeaderKey(headers: string[], candidates: readonly string[]): string | null {
  // Stage 1: exact (case-insensitive) match against spec column names
  for (const c of candidates) {
    const exact = headers.find((h) => h.toLowerCase().trim() === c.toLowerCase())
    if (exact) return exact
  }
  // Stage 2: fuzzy substring fallback
  for (const c of candidates) {
    const fuzzy = headers.find((h) => {
      const hl = h.toLowerCase().trim()
      const cl = c.toLowerCase()
      return hl.includes(cl) || cl.includes(hl)
    })
    if (fuzzy) return fuzzy
  }
  return null
}

function num(val: string | undefined | null): number | null {
  if (val == null || val === '') return null
  const cleaned = String(val).replace(/[^0-9.\-]/g, '')
  const n = parseFloat(cleaned)
  return Number.isFinite(n) ? n : null
}

function int(val: string | undefined | null): number | null {
  const n = num(val)
  return n == null ? null : Math.round(n)
}

function splitCSVLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') { inQ = !inQ; continue }
    if (ch === ',' && !inQ) { out.push(cur); cur = ''; continue }
    cur += ch
  }
  out.push(cur)
  return out.map((s) => s.trim())
}

export function parseCSV(csvText: string): ParsedGPSSession | null {
  try {
    if (!csvText || typeof csvText !== 'string') return null
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0)
    if (lines.length < 2) {
      console.error('[gps-parser] CSV has no data rows')
      return null
    }

    const headers = splitCSVLine(lines[0])
    const source = detectFormat(headers)
    const cols = source === 'STATSports' ? STATSPORTS_COLUMNS : CATAPULT_COLUMNS

    const playerCol = findHeaderKey(headers, cols.playerName)
    const totalCol = findHeaderKey(headers, cols.totalDistance)
    const hsdCol = findHeaderKey(headers, cols.highSpeedDistance)
    const sprintCol = findHeaderKey(headers, cols.sprintDistance)
    const maxSpdCol = findHeaderKey(headers, cols.maxSpeed)
    const accelCol = findHeaderKey(headers, cols.accelDecel)
    const rpeCol = findHeaderKey(headers, cols.rpe)
    const dateCol = findHeaderKey(headers, cols.sessionDate)
    const typeCol = findHeaderKey(headers, cols.sessionType)

    if (!playerCol || !totalCol) {
      console.error('[gps-parser] required columns missing (playerName/totalDistance)')
      return null
    }

    const idxOf = (h: string | null) => (h ? headers.indexOf(h) : -1)
    const iPlayer = idxOf(playerCol)
    const iTotal = idxOf(totalCol)
    const iHsd = idxOf(hsdCol)
    const iSprint = idxOf(sprintCol)
    const iMax = idxOf(maxSpdCol)
    const iAccel = idxOf(accelCol)
    const iRpe = idxOf(rpeCol)
    const iDate = idxOf(dateCol)
    const iType = idxOf(typeCol)

    let sessionDate = new Date().toISOString().slice(0, 10)
    let sessionType = 'Training'
    const rows: ParsedPlayerLoad[] = []

    for (let r = 1; r < lines.length; r++) {
      const cells = splitCSVLine(lines[r])
      const playerName = cells[iPlayer]?.trim()
      if (!playerName) continue

      const totalDistanceM = num(cells[iTotal]) ?? 0
      const sessionRpe = iRpe >= 0 ? int(cells[iRpe]) : null
      const trainingLoad =
        sessionRpe != null
          ? (totalDistanceM * sessionRpe) / 1000
          : totalDistanceM / 1000

      rows.push({
        playerName,
        totalDistanceM,
        highSpeedDistanceM: iHsd >= 0 ? num(cells[iHsd]) : null,
        sprintDistanceM: iSprint >= 0 ? num(cells[iSprint]) : null,
        maxSpeedMs: iMax >= 0 ? num(cells[iMax]) : null,
        accelDecelCount: iAccel >= 0 ? int(cells[iAccel]) : null,
        sessionRpe,
        trainingLoad,
      })

      if (iDate >= 0 && cells[iDate]) {
        const d = new Date(cells[iDate])
        if (!isNaN(d.getTime())) sessionDate = d.toISOString().slice(0, 10)
      }
      if (iType >= 0 && cells[iType]) sessionType = cells[iType]
    }

    if (rows.length === 0) {
      console.error('[gps-parser] no valid player rows')
      return null
    }

    return { source, sessionDate, sessionType, rows }
  } catch (err) {
    console.error('[gps-parser] parseCSV failed:', err)
    return null
  }
}
