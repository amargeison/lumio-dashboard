// CSV parsers for the Club Import wizard.
// All functions are total — they return null on unrecoverable errors and never throw.

export interface ParsedSquadRow {
  name: string
  position: 'GK' | 'DEF' | 'MID' | 'FWD' | null
  squadNumber: number | null
  dateOfBirth: string | null
  nationality: string | null
  status: 'fit' | 'injured' | 'suspended'
  photoUrl: string | null
  rowIndex: number
  errors: string[]
}

export interface ParsedContractRow {
  playerName: string
  startDate: string | null
  endDate: string | null
  weeklyWage: number | null
  releaseClause: number | null
  optionToExtend: boolean
  rowIndex: number
  errors: string[]
}

export interface ParsedFixtureRow {
  opponent: string
  kickoffTime: string | null
  venue: 'Home' | 'Away' | null
  competition: string | null
  resultHome: number | null
  resultAway: number | null
  rowIndex: number
  errors: string[]
}

// ─── CSV core ──────────────────────────────────────────────────────────────

function splitCSVLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      out.push(cur); cur = ''
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out.map((s) => s.trim())
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } | null {
  if (!text || typeof text !== 'string') return null
  const cleaned = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim()
  if (!cleaned) return null
  const lines = cleaned.split('\n').filter((l) => l.trim().length > 0)
  if (lines.length === 0) return null
  const headers = splitCSVLine(lines[0]).map((h) => h.toLowerCase().trim())
  const rows = lines.slice(1).map(splitCSVLine)
  return { headers, rows }
}

function findCol(headers: string[], variants: string[]): number {
  const lower = variants.map((v) => v.toLowerCase())
  for (let i = 0; i < headers.length; i++) {
    if (lower.includes(headers[i])) return i
  }
  return -1
}

function get(row: string[], idx: number): string {
  if (idx < 0 || idx >= row.length) return ''
  return (row[idx] ?? '').trim()
}

// ─── Position normalisation ────────────────────────────────────────────────

const POSITION_MAP: Record<string, 'GK' | 'DEF' | 'MID' | 'FWD'> = {}
const _addPos = (group: 'GK' | 'DEF' | 'MID' | 'FWD', terms: string[]) => {
  for (const t of terms) POSITION_MAP[t.toLowerCase()] = group
}
_addPos('GK',  ['GK','Goalkeeper','Keeper','G'])
_addPos('DEF', ['DEF','CB','LB','RB','LWB','RWB','Defender','Centre-Back','Centre Back','Center Back','Full Back','Full-Back','Wing Back','Wing-Back','D'])
_addPos('MID', ['MID','CM','DM','AM','CDM','CAM','LM','RM','Midfielder','Central Mid','Central Midfielder','Defensive Mid','Defensive Midfielder','Attacking Mid','Attacking Midfielder','M'])
_addPos('FWD', ['FWD','ST','CF','LW','RW','LF','RF','Forward','Striker','Winger','Attacker','F'])

function normalisePosition(raw: string): 'GK' | 'DEF' | 'MID' | 'FWD' | null {
  if (!raw) return null
  const key = raw.toLowerCase().trim()
  return POSITION_MAP[key] ?? null
}

// ─── Date / number helpers ─────────────────────────────────────────────────

function parseDateLoose(raw: string): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  // ISO already
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10)
  // dd/mm/yyyy or dd-mm-yyyy
  const m = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
  if (m) {
    let [_, d, mo, y] = m
    void _
    if (y.length === 2) y = '20' + y
    return `${y.padStart(4, '0')}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  const dt = new Date(trimmed)
  if (!isNaN(dt.getTime())) return dt.toISOString().slice(0, 10)
  return null
}

function parseDateTimeLoose(date: string, time: string): string | null {
  const d = parseDateLoose(date)
  if (!d) return null
  const t = (time ?? '').trim()
  if (!t) return new Date(`${d}T15:00:00Z`).toISOString()
  const tm = t.match(/^(\d{1,2}):(\d{2})/)
  if (tm) return new Date(`${d}T${tm[1].padStart(2, '0')}:${tm[2]}:00Z`).toISOString()
  const iso = new Date(`${d}T${t}`)
  if (!isNaN(iso.getTime())) return iso.toISOString()
  return new Date(`${d}T15:00:00Z`).toISOString()
}

function parseMoney(raw: string): number | null {
  if (!raw) return null
  const cleaned = raw.replace(/[£$€,\s]/g, '')
  if (!cleaned) return null
  const m = cleaned.match(/^(\d+(?:\.\d+)?)(k|m)?$/i)
  if (m) {
    let v = parseFloat(m[1])
    if (m[2]?.toLowerCase() === 'k') v *= 1000
    if (m[2]?.toLowerCase() === 'm') v *= 1000000
    return Math.round(v)
  }
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : Math.round(n)
}

function parseInt0(raw: string): number | null {
  if (!raw) return null
  const n = parseInt(raw.trim(), 10)
  return isNaN(n) ? null : n
}

function parseBool(raw: string): boolean {
  if (!raw) return false
  const v = raw.trim().toLowerCase()
  return ['yes','true','1','y','t'].includes(v)
}

function normaliseStatus(raw: string): 'fit' | 'injured' | 'suspended' {
  const v = (raw ?? '').toLowerCase().trim()
  if (v.includes('inj')) return 'injured'
  if (v.includes('susp')) return 'suspended'
  return 'fit'
}

function normaliseVenue(raw: string): 'Home' | 'Away' | null {
  if (!raw) return null
  const v = raw.toLowerCase().trim()
  if (v === 'h' || v.startsWith('home')) return 'Home'
  if (v === 'a' || v.startsWith('away')) return 'Away'
  return null
}

// ─── Squad parser ──────────────────────────────────────────────────────────

export function parseSquadCSV(csvText: string): ParsedSquadRow[] | null {
  const parsed = parseCSV(csvText)
  if (!parsed) return null
  const { headers, rows } = parsed

  const colName     = findCol(headers, ['Name','Player','Full Name','Player Name'])
  const colPos      = findCol(headers, ['Position','Pos','Role'])
  const colNumber   = findCol(headers, ['Number','Squad No','Shirt No','#','Squad Number','Shirt Number'])
  const colDOB      = findCol(headers, ['DOB','Date of Birth','Birthday','Born'])
  const colNation   = findCol(headers, ['Nationality','Country','Nation'])
  const colStatus   = findCol(headers, ['Status','Fitness','Availability'])
  const colPhoto    = findCol(headers, ['Photo','Photo URL','Image'])

  if (colName < 0) return null

  return rows.map((row, i): ParsedSquadRow => {
    const errors: string[] = []
    const name = get(row, colName)
    if (!name) errors.push('Name is required')
    const posRaw = get(row, colPos)
    const position = normalisePosition(posRaw)
    if (posRaw && !position) errors.push(`Unknown position "${posRaw}"`)
    const dob = parseDateLoose(get(row, colDOB))
    if (get(row, colDOB) && !dob) errors.push('Invalid date of birth')
    return {
      name,
      position,
      squadNumber: parseInt0(get(row, colNumber)),
      dateOfBirth: dob,
      nationality: get(row, colNation) || null,
      status: normaliseStatus(get(row, colStatus)),
      photoUrl: get(row, colPhoto) || null,
      rowIndex: i + 2, // +1 for header, +1 for 1-indexed
      errors,
    }
  })
}

// ─── Contracts parser ──────────────────────────────────────────────────────

export function parseContractsCSV(csvText: string): ParsedContractRow[] | null {
  const parsed = parseCSV(csvText)
  if (!parsed) return null
  const { headers, rows } = parsed

  const colName    = findCol(headers, ['Name','Player','Player Name'])
  const colStart   = findCol(headers, ['Start Date','Contract Start','From'])
  const colEnd     = findCol(headers, ['End Date','Expiry','Contract End','Until','To'])
  const colWage    = findCol(headers, ['Weekly Wage','Wage','Salary (pw)','Weekly Salary','Pay (pw)'])
  const colRelease = findCol(headers, ['Release Clause','Release','Buy Out'])
  const colOption  = findCol(headers, ['Option','Extension Option','Option to Extend'])

  if (colName < 0) return null

  return rows.map((row, i): ParsedContractRow => {
    const errors: string[] = []
    const playerName = get(row, colName)
    if (!playerName) errors.push('Player name required')
    const startDate = parseDateLoose(get(row, colStart))
    const endDate = parseDateLoose(get(row, colEnd))
    if (get(row, colStart) && !startDate) errors.push('Invalid start date')
    if (get(row, colEnd) && !endDate) errors.push('Invalid end date')
    return {
      playerName,
      startDate,
      endDate,
      weeklyWage: parseMoney(get(row, colWage)),
      releaseClause: parseMoney(get(row, colRelease)),
      optionToExtend: parseBool(get(row, colOption)),
      rowIndex: i + 2,
      errors,
    }
  })
}

// ─── Fixtures parser ───────────────────────────────────────────────────────

export function parseFixturesCSV(csvText: string): ParsedFixtureRow[] | null {
  const parsed = parseCSV(csvText)
  if (!parsed) return null
  const { headers, rows } = parsed

  const colOpp     = findCol(headers, ['Opponent','Team','Against','Opposition'])
  const colDate    = findCol(headers, ['Date','Match Date','Fixture Date','Kickoff Date'])
  const colTime    = findCol(headers, ['Time','KO','Kickoff','Kickoff Time'])
  const colVenue   = findCol(headers, ['Venue','Home/Away','H/A','Location'])
  const colComp    = findCol(headers, ['Competition','Cup','League','Tournament'])
  const colHome    = findCol(headers, ['Home Score','Home Goals','HG','GF'])
  const colAway    = findCol(headers, ['Away Score','Away Goals','AG','GA'])

  if (colOpp < 0) return null

  return rows.map((row, i): ParsedFixtureRow => {
    const errors: string[] = []
    const opponent = get(row, colOpp)
    if (!opponent) errors.push('Opponent required')
    const dateRaw = get(row, colDate)
    const kickoffTime = dateRaw ? parseDateTimeLoose(dateRaw, get(row, colTime)) : null
    if (dateRaw && !kickoffTime) errors.push('Invalid date/time')
    const venue = normaliseVenue(get(row, colVenue))
    if (get(row, colVenue) && !venue) errors.push('Invalid venue (use Home/Away)')
    return {
      opponent,
      kickoffTime,
      venue,
      competition: get(row, colComp) || null,
      resultHome: parseInt0(get(row, colHome)),
      resultAway: parseInt0(get(row, colAway)),
      rowIndex: i + 2,
      errors,
    }
  })
}
