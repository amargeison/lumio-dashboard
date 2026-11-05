// School readiness for the PE & School Sport Partnerships Network. One engine for
// every portal: live orgs reach it through evidenceFromRows(), the demo through
// fictional evidence (src/data/impact/readiness-demo.ts). The scores are an
// indicative framework, not DfE criteria.
//
// Each criterion is in one of three states:
//   met       evidenced and on track     full weight
//   progress  evidenced but weak         half weight
//   gap       no evidence recorded       nothing, labelled as missing, not as bad
//
// A school with evidence in fewer than 3 areas gets no band at all: it reads "Not
// enough evidence yet", so a new org doesn't open to a page of schools at risk.
//
// The demo's scores were hand-written, with no stated weights or bands. These are
// set so the engine reproduces its verdicts. Partnership and continuity counts
// most, and an unfunded school can't be On track however good its delivery.

export type PesspnStatus = 'met' | 'progress' | 'gap'
export type PesspnVerdict = 'on-track' | 'nearly' | 'at-risk' | 'needs-evidence'
export type ReadinessFunding = 'funded' | 'fundraising' | 'unfunded' | 'unknown'

export const READINESS_WEIGHTS: Record<string, number> = {
  data: 15, regular: 15, priority: 10, cpd: 10, broader: 10, wholeschool: 10, impact: 10, partner: 20,
}
export const READINESS_BANDS = { onTrack: 80, nearly: 50 }
const NOT_FUNDED_CAP = 79
const MIN_EVIDENCED = 3
export const CAP_NOTE = 'Capped at Nearly there — no secure funding recorded.'
// The demo's own targets where it states one, plain thresholds where it doesn't.
const ATTENDANCE_TARGET = 85
const WEEKS_FOR_CONTINUITY = 4
const REGISTER_COVERAGE = 90
const FAMILY_TARGET = 80
const RESPONSES_NEEDED = 5
const POSITIVE_TARGET = 80

export interface SchoolEvidence {
  id: string
  name: string
  status: string                        // tp_schools.status
  stage: 'none' | 'planned' | 'confirmed' | 'running' | 'complete'
  children: number                      // children linked to the school
  registeredChildren: number            // of those, on at least one register
  sessions: number
  weeks: number                         // distinct weeks with a session
  attendancePct: number | null
  yearGroups: number
  sendRecordedPct: number | null        // children with SEND status recorded
  familyContactPct: number | null       // children whose family has contact consent
  weekendSessions: number
  venueLinked: boolean
  events: number
  cpdRecords: number
  cpdPeople: number
  responses: number
  positivePct: number | null
  funding: ReadinessFunding
  fundedPct: number | null              // campaign progress
  safeguardingLead: boolean
}

export interface ReadinessItem { status: PesspnStatus; note: string; action: string }
export interface SchoolReadiness {
  verdict: PesspnVerdict
  score: number
  summary: string
  items: Record<string, ReadinessItem>
  biggestGap: string | null             // criterion id
}

const met = (note: string, action = 'Keep this up to date.'): ReadinessItem => ({ status: 'met', note, action })
const weak = (note: string, action: string): ReadinessItem => ({ status: 'progress', note, action })
const none = (add: string, action: string): ReadinessItem => ({ status: 'gap', note: `No evidence recorded yet — add ${add}`, action })
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
const childCount = (n: number) => n === 1 ? '1 child' : `${n} children`

function assess(e: SchoolEvidence): Record<string, ReadinessItem> {
  const coverage = e.children ? Math.round(e.registeredChildren / e.children * 100) : null
  const data = e.sessions === 0 ? none('registers', 'Take a register at each session, or import past registers.')
    : coverage === null ? weak(`${plural(e.sessions, 'session')} on register, but no children linked to this school`, 'Link children to this school so the registers count.')
    : coverage >= REGISTER_COVERAGE ? met(`Named registers for ${coverage}% of children across ${plural(e.sessions, 'session')}`)
    : weak(`Registers cover ${coverage}% of children`, `Get every child on a register, aiming for ${REGISTER_COVERAGE}%.`)

  const regular = e.attendancePct === null ? none('attendance', 'Attendance comes from registers, so take one at each session.')
    : e.attendancePct < ATTENDANCE_TARGET ? weak(`${e.attendancePct}% attendance`, `Follow up absences to reach ${ATTENDANCE_TARGET}%.`)
    : e.weeks < WEEKS_FOR_CONTINUITY ? weak(`${e.attendancePct}% attendance across ${plural(e.weeks, 'week')}`, `Good so far: keep it going to ${WEEKS_FOR_CONTINUITY} weeks to show it’s sustained.`)
    : met(`${e.attendancePct}% attendance across ${e.weeks} weeks`)

  const send = e.sendRecordedPct ?? 0
  const priority = e.children === 0 ? none('children', 'Add the children taking part, with year group and SEND status.')
    : e.yearGroups >= 3 && send >= 80 ? met(`${childCount(e.children)} across ${e.yearGroups} year groups, SEND recorded for ${send}%`)
    : weak(`${childCount(e.children)} across ${plural(e.yearGroups, 'year group')}, SEND recorded for ${send}%`,
      send < 80 ? 'Record SEND status for each child so priority-group reach can be shown.' : 'Extend the programme to more year groups.')

  const cpd = e.cpdRecords === 0 ? none('staff CPD', 'Record any training school staff have done with you.')
    : e.cpdPeople >= 2 ? met(`${e.cpdPeople} staff with CPD on record`)
    : weak('1 member of staff with CPD on record', 'Train a second member of staff so delivery outlasts one person.')

  const offers = [e.weekendSessions > 0 && plural(e.weekendSessions, 'weekend session'), e.venueLinked && 'linked venue', e.events > 0 && plural(e.events, 'event')].filter((x): x is string => !!x)
  const broader = offers.length === 0 ? none('a weekend venue, session or event', 'Link a weekend venue or add an event for this school.')
    : offers.length >= 2 ? met(offers.join(', '))
    : weak(offers[0], 'Add a second route beyond the core sessions, such as a weekend session or event.')

  const wholeschool = e.familyContactPct === null ? none('families', 'Link each child to their family, with contact consent.')
    : e.familyContactPct >= FAMILY_TARGET ? met(`${e.familyContactPct}% of children’s families have contact consent`)
    : weak(`${e.familyContactPct}% of children’s families have contact consent`, `Collect consent to reach ${FAMILY_TARGET}%.`)

  const impact = e.responses === 0 ? none('feedback responses', 'Collect or import feedback from families and staff.')
    : e.responses < RESPONSES_NEEDED ? weak(`${plural(e.responses, 'feedback response')} so far`, `Collect at least ${RESPONSES_NEEDED} to show a pattern.`)
    : (e.positivePct ?? 0) >= POSITIVE_TARGET ? met(`${e.responses} feedback responses, ${e.positivePct}% positive`)
    : weak(`${e.responses} feedback responses, ${e.positivePct ?? 0}% positive`, 'Follow up on what families and staff said.')

  return { data, regular, priority, cpd, broader, wholeschool, impact, partner: partnership(e) }
}

function partnership(e: SchoolEvidence): ReadinessItem {
  const progress = e.fundedPct === null ? '' : `, ${e.fundedPct}% of the target raised`
  if (e.funding === 'fundraising') return weak(`Fundraising for this school${progress}`, 'Reach the target to secure the programme.')
  if (e.funding === 'unfunded') return weak('Continuity at risk: no funding recorded for what comes next', 'Agree funding or start a fundraising campaign.')
  if (e.funding === 'unknown') return { status: 'gap', note: 'No evidence recorded yet — record this school’s funding status', action: 'Add how this school’s programme is funded.' }
  if (e.stage === 'none') return weak(`School is at ${e.status} stage, with no programme yet`, 'Add a programme once it’s agreed.')
  if (e.stage === 'planned') return weak('Programme planned, not yet confirmed', 'Confirm the programme with the school.')
  if (!e.safeguardingLead) return weak(`Programme ${e.stage}, but no safeguarding lead recorded`, 'Add the school’s safeguarding lead.')
  return met(`Programme ${e.stage}, safeguarding lead recorded`)
}

const verdictFor = (score: number): PesspnVerdict =>
  score >= READINESS_BANDS.onTrack ? 'on-track' : score >= READINESS_BANDS.nearly ? 'nearly' : 'at-risk'

export function scoreSchool(e: SchoolEvidence): SchoolReadiness {
  const items = assess(e)
  const earned = (id: string) => READINESS_WEIGHTS[id] * (items[id].status === 'met' ? 1 : items[id].status === 'progress' ? 0.5 : 0)
  const notFunded = e.funding === 'fundraising' || e.funding === 'unfunded'
  const raw = Math.round(Object.keys(READINESS_WEIGHTS).reduce((n, id) => n + earned(id), 0))
  const score = notFunded ? Math.min(raw, NOT_FUNDED_CAP) : raw
  // The most points still to win; on a tie, the earlier criterion.
  const open = Object.keys(READINESS_WEIGHTS).filter(id => items[id].status !== 'met')
  const biggestGap = open.reduce<string | null>((best, id) =>
    best === null || READINESS_WEIGHTS[id] - earned(id) > READINESS_WEIGHTS[best] - earned(best) ? id : best, null)
  const evidenced = Object.values(items).filter(i => i.status !== 'gap').length
  const on = Object.values(items).filter(i => i.status === 'met').length
  return {
    score, items, biggestGap,
    verdict: evidenced < MIN_EVIDENCED ? 'needs-evidence' : verdictFor(score),
    summary: `${evidenced} of 8 areas have evidence, ${on} on track.${notFunded && raw > NOT_FUNDED_CAP ? ` ${CAP_NOTE}` : ''}`,
  }
}

export const scoreSchools = (all: SchoolEvidence[]): Record<string, SchoolReadiness> =>
  Object.fromEntries(all.map(e => [e.id, scoreSchool(e)]))

// ─── Live rows → evidence ────────────────────────────────────────────────────
export interface ReadinessRows {
  schools: { id: string; name: string; status: string; funding_source: string | null; safeguarding_lead: string | null }[]
  programmes: { id: string; school_id: string; status: string }[]
  programmeLinks?: { id: string; venue_id: string | null }[]
  campaigns: { id: string; school_id: string | null; target_pence: number; status: string }[]
  events: { campaign_id: string }[]
  donations: { campaign_id: string; amount_pence: number }[]
  children?: { id: string; family_id: string | null; school_id: string | null; year_group: string | null; send?: boolean | null }[]
  families?: { id: string; consent_data: boolean | null }[]
  sessions?: { id: string; kind: string; programme_id: string | null; session_date: string }[]
  attendance?: { session_id: string; child_id: string; present: boolean }[]
  responses?: { school_id: string | null; would_recommend: boolean | null; satisfaction: number | null }[]
  cpd?: { school_id: string; staff_name: string }[]
}

const pct = (part: number, whole: number) => whole ? Math.round(part / whole * 100) : null
// Monday of the date's week, so two sessions in one week count once.
const weekOf = (date: string) => {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7)
  return d.toISOString().slice(0, 10)
}
const STAGES = ['none', 'planned', 'confirmed', 'complete', 'running'] as const
const stageOf = (status: string): SchoolEvidence['stage'] =>
  status === 'running' || status === 'complete' || status === 'confirmed' ? status : 'planned'

// A register belongs to the programme's school, or else to the child's.
function registerOwner(rows: Pick<ReadinessRows, 'programmes' | 'children' | 'sessions'>) {
  const childSchool = new Map((rows.children ?? []).map(c => [c.id, c.school_id]))
  const programmeSchool = new Map(rows.programmes.map(p => [p.id, p.school_id]))
  const sessionById = new Map((rows.sessions ?? []).map(s => [s.id, s]))
  return (a: { session_id: string; child_id: string }) => {
    const s = sessionById.get(a.session_id)
    const owner = s?.programme_id ? programmeSchool.get(s.programme_id) : undefined
    return owner ?? childSchool.get(a.child_id)
  }
}

/** Attendance % per session, oldest first. A session with no register has no rate, so it's left out rather than read as 0%. */
export function attendanceBySession(rows: ReadinessRows, schoolId: string): { date: string; pct: number }[] {
  const ownerOf = registerOwner(rows)
  const marks = (rows.attendance ?? []).filter(a => ownerOf(a) === schoolId)
  return (rows.sessions ?? [])
    .filter(s => marks.some(a => a.session_id === s.id))
    .sort((a, b) => a.session_date.localeCompare(b.session_date))
    .map(s => {
      const mine = marks.filter(a => a.session_id === s.id)
      return { date: s.session_date, pct: pct(mine.filter(a => a.present).length, mine.length) as number }
    })
}

export function evidenceFromRows(rows: ReadinessRows): SchoolEvidence[] {
  const children = rows.children ?? [], sessions = rows.sessions ?? [], attendance = rows.attendance ?? []
  const families = new Map((rows.families ?? []).map(f => [f.id, f]))
  const childSchool = new Map(children.map(c => [c.id, c.school_id]))
  const sessionById = new Map(sessions.map(s => [s.id, s]))
  const ownerOf = registerOwner(rows)

  return rows.schools.map(school => {
    const progs = rows.programmes.filter(p => p.school_id === school.id)
    const kids = children.filter(c => c.school_id === school.id)
    const marks = attendance.filter(a => ownerOf(a) === school.id)
    const held = Array.from(new Set(marks.map(a => a.session_id))).map(id => sessionById.get(id)).filter((s): s is NonNullable<typeof s> => !!s)
    const campaigns = rows.campaigns.filter(c => c.school_id === school.id)
    const raised = rows.donations.filter(d => campaigns.some(c => c.id === d.campaign_id)).reduce((n, d) => n + d.amount_pence, 0)
    const target = campaigns.reduce((n, c) => n + c.target_pence, 0)
    const fundedPct = target ? Math.min(100, Math.round(raised / target * 100)) : null
    const stage = progs.reduce<SchoolEvidence['stage']>((best, p) => {
      const s = stageOf(p.status)
      return STAGES.indexOf(s) > STAGES.indexOf(best) ? s : best
    }, 'none')
    // Unfunded has to be recorded: a blank means unknown, whatever stage the school is at.
    const source = (school.funding_source ?? '').trim()
    const funding: ReadinessFunding = /^(none|nil|unfunded|no funding)\b/i.test(source) ? 'unfunded'
      : source || (target > 0 && raised >= target) ? 'funded'
      : target > 0 || school.status === 'fundraising' ? 'fundraising'
      : 'unknown'
    const feedback = (rows.responses ?? []).filter(r => r.school_id === school.id)
    const rated = feedback.filter(r => r.would_recommend !== null || r.satisfaction !== null)
    const cpd = (rows.cpd ?? []).filter(c => c.school_id === school.id)
    const linked = kids.filter(c => c.family_id)
    return {
      id: school.id, name: school.name, status: school.status, stage,
      children: kids.length,
      registeredChildren: new Set(marks.map(a => a.child_id).filter(id => childSchool.get(id) === school.id)).size,
      sessions: held.length,
      weeks: new Set(held.map(s => weekOf(s.session_date))).size,
      attendancePct: pct(marks.filter(a => a.present).length, marks.length),
      yearGroups: new Set(kids.map(c => c.year_group).filter(Boolean)).size,
      sendRecordedPct: pct(kids.filter(c => c.send === true || c.send === false).length, kids.length),
      familyContactPct: linked.length ? pct(linked.filter(c => families.get(c.family_id as string)?.consent_data === true).length, kids.length) : null,
      weekendSessions: held.filter(s => s.kind === 'weekend').length,
      venueLinked: (rows.programmeLinks ?? []).some(l => !!l.venue_id && progs.some(p => p.id === l.id)),
      events: rows.events.filter(ev => campaigns.some(c => c.id === ev.campaign_id)).length,
      cpdRecords: cpd.length,
      cpdPeople: new Set(cpd.map(c => c.staff_name.trim().toLowerCase())).size,
      responses: feedback.length,
      positivePct: pct(rated.filter(r => r.would_recommend === true || (r.satisfaction ?? 0) >= 4).length, rated.length),
      funding, fundedPct,
      safeguardingLead: !!(school.safeguarding_lead ?? '').trim(),
    }
  })
}
