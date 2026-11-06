// The live Insights page and funder documents, computed from the same rows as
// the readiness engine and the school cards. Pure, so the page, the documents
// and the tests share one source.
//
// Each section carries `need`: null when it can be shown, otherwise the input
// that's missing, which the page shows as a note. Retention, wellbeing and
// social value aren't computed at all until their data exists (TIER_2).

import { complianceItems, compliancePeople, isoToday, longDate, type ComplianceItem } from './compliance'
import { evidenceFromRows, pct, registerOwner, scoreSchool, sessionRates, VERDICT_LABEL, type PesspnVerdict } from './readiness'
import type { LiveRows } from './live-context'

export type InsightRows = LiveRows

export interface Tile { label: string; value: string }
export interface ReachMonth { month: string; label: string; children: number | null }   // null: no register that month
export interface SessionPoint { date: string; pct: number; tip: string }
export interface SchoolRow { id: string; school: string; children: number; sessions: number; attendancePct: number | null; score: number; verdict: PesspnVerdict; band: string }
export interface Share { label: string; n: number; pct: number }
export interface Flag { label: string; need: string; recorded: number; shares: Share[] }
export interface ConversionRow { school: string; reached: number; converted: number; pct: number }
export interface CpdRow { school: string; records: number; people: number }

export interface LiveInsights {
  year: string
  headline: Tile[]
  reach: { need: string | null; months: ReachMonth[]; total: number }
  attendance: { need: string | null; sessions: SessionPoint[]; overallPct: number | null }
  schools: { need: string | null; rows: SchoolRow[] }
  demographics: { need: string | null; children: number; yearGroups: Share[]; flags: Flag[] }
  conversion: { need: string | null; rows: ConversionRow[] }
  compliance: {
    need: string | null; coaches: number; volunteers: number
    valid: number; expiring: number; expired: number; notRecorded: number
    items: ComplianceItem[]
    cpdNeed: string | null; cpd: CpdRow[]
  }
}

export const needNote = (need: string) => `Builds as data does — needs: ${need}`
export const TIER_2 = {
  retention: needNote('at least 6 weeks of weekend data'),
  wellbeing: needNote('family surveys, which aren’t running yet'),
  socialValue: needNote('family surveys, which aren’t running yet'),
}
export const WHAT_TO_RECORD = 'Add your schools and children, then take a register at each session. This document fills in from those records.'

const MONTHS = ['Sept', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
const firstYear = (today: string) => Number(today.slice(0, 4)) - (Number(today.slice(5, 7)) < 9 ? 1 : 0)
/** "2026/27": the academic year runs September to August. */
export const academicYear = (today: string) => { const y = firstYear(today); return `${y}/${String(y + 1).slice(2)}` }

export function headlineTiles(rows: InsightRows, today = isoToday()): Tile[] {
  const marks = rows.attendance ?? [], sessions = rows.sessions ?? []
  // Sessions with no register have no rate, which isn't the same as 0%.
  const attendance = marks.length ? `${pct(marks.filter(a => a.present).length, marks.length)}%` : sessions.length ? '—' : '0%'
  return [
    { label: 'Children registered', value: String(rows.children?.length ?? 0) },
    { label: 'Families', value: String(rows.families?.length ?? 0) },
    { label: 'Sessions delivered', value: String(sessions.filter(s => s.session_date <= today).length) },
    { label: 'Attendance rate', value: attendance },
    { label: 'Schools', value: String(rows.schools.length) },
    { label: 'Volunteers', value: String(rows.volunteers?.length ?? 0) },
  ]
}

export function monthlyReach(rows: InsightRows, today: string): LiveInsights['reach'] {
  const start = firstYear(today)
  const dateOf = new Map((rows.sessions ?? []).map(s => [s.id, s.session_date]))
  const marks = (rows.attendance ?? []).filter(a => dateOf.has(a.session_id))
  const months = MONTHS.map((label, i): ReachMonth & { kids: Set<string> } => {
    const month = `${start + (i > 3 ? 1 : 0)}-${String((i + 8) % 12 + 1).padStart(2, '0')}`
    const mine = marks.filter(a => dateOf.get(a.session_id)?.startsWith(month))
    const kids = new Set(mine.filter(a => a.present).map(a => a.child_id))
    return { month, label, children: mine.length ? kids.size : null, kids }
  })
  const total = new Set(months.flatMap(m => [...m.kids])).size
  return { need: total ? null : 'registers', total, months: months.map(({ kids: _, ...m }) => m) }
}

export function attendanceOverTime(rows: InsightRows): LiveInsights['attendance'] {
  const known = new Set((rows.sessions ?? []).map(s => s.id))
  const marks = (rows.attendance ?? []).filter(a => known.has(a.session_id))
  const sessions = sessionRates(rows.sessions ?? [], marks).map(s => ({ ...s, tip: `${longDate(s.date)} · ${s.pct}%` }))
  return { need: sessions.length ? null : 'registers', sessions, overallPct: pct(marks.filter(a => a.present).length, marks.length) }
}

/** Banded schools first, best score first. A school with too little evidence has no band to rank by. */
export function schoolsTable(rows: InsightRows): LiveInsights['schools'] {
  const ranked = (r: SchoolRow) => r.verdict === 'needs-evidence' ? 0 : 1
  const out = evidenceFromRows(rows).map((e): SchoolRow => {
    const { score, verdict } = scoreSchool(e)
    return { id: e.id, school: e.name, children: e.children, sessions: e.sessions, attendancePct: e.attendancePct, score, verdict, band: VERDICT_LABEL[verdict] }
  }).sort((a, b) => ranked(b) - ranked(a) || b.score - a.score || a.school.localeCompare(b.school))
  return { need: out.length ? null : 'schools', rows: out }
}

const GENDER_LABEL: Record<string, string> = { female: 'Female', male: 'Male', other: 'Other', prefer_not_to_say: 'Prefer not to say' }

// Below this, a percentage in a document could point to one child.
export const MIN_RECORDED_IN_DOCUMENTS = 10
const fewerThan = `recorded for fewer than ${MIN_RECORDED_IN_DOCUMENTS} children — not shown`

/** A flag as a document may state it. The signed-in page shows every figure, with its recorded count. */
export function documentFlagLines(flag: Flag): string[] {
  if (!flag.recorded) return []
  if (flag.recorded < MIN_RECORDED_IN_DOCUMENTS) return [`${flag.label}: ${fewerThan}`]
  return flag.shares.map(s => `${s.label}: ${s.pct}% of the ${flag.recorded} children with this recorded.`)
}

const yearOrder = (y: string) => y === 'N' ? -1 : y === 'R' ? 0 : Number(y.slice(1))

export function demographics(rows: InsightRows): LiveInsights['demographics'] {
  const kids = rows.children ?? []
  const counts = new Map<string, number>()
  for (const k of kids) if (k.year_group) counts.set(k.year_group, (counts.get(k.year_group) ?? 0) + 1)
  const blank = kids.filter(k => !k.year_group).length
  const yearGroups = [...counts].sort(([a], [b]) => yearOrder(a) - yearOrder(b)).map(([label, n]) => ({ label, n, pct: pct(n, kids.length) as number }))
  if (blank) yearGroups.push({ label: 'Not recorded', n: blank, pct: pct(blank, kids.length) as number })

  // Always a share of the children with the flag recorded, never of all children.
  const yesNo = (label: string, need: string, read: (k: typeof kids[number]) => boolean | null | undefined): Flag => {
    const known = kids.filter(k => typeof read(k) === 'boolean')
    const n = known.filter(k => read(k)).length
    return { label, need, recorded: known.length, shares: known.length ? [{ label, n, pct: pct(n, known.length) as number }] : [] }
  }
  const genders = new Map<string, number>()
  for (const k of kids) if (k.gender) genders.set(GENDER_LABEL[k.gender] ?? k.gender, (genders.get(GENDER_LABEL[k.gender] ?? k.gender) ?? 0) + 1)
  const genderTotal = [...genders.values()].reduce((a, b) => a + b, 0)
  return {
    need: kids.length ? null : 'children',
    children: kids.length,
    yearGroups,
    flags: [
      { label: 'Gender', need: 'gender flags', recorded: genderTotal, shares: [...genders].map(([label, n]) => ({ label, n, pct: pct(n, genderTotal) as number })) },
      yesNo('SEND', 'SEND flags', k => k.send),
      yesNo('Free school meals', 'FSM flags', k => k.fsm),
      yesNo('Pupil premium', 'pupil premium flags', k => k.pupil_premium),
    ],
  }
}

/** Per school: children present in curriculum time whose family was present at a weekend session. */
export function weekendConversion(rows: InsightRows): LiveInsights['conversion'] {
  const sessions = rows.sessions ?? [], marks = (rows.attendance ?? []).filter(a => a.present)
  if (!sessions.some(s => s.kind === 'weekend')) return { need: 'weekend sessions', rows: [] }
  const kindOf = new Map(sessions.map(s => [s.id, s.kind]))
  const familyOf = new Map((rows.children ?? []).map(c => [c.id, c.family_id ?? c.id]))
  const family = (childId: string) => familyOf.get(childId) ?? childId
  const weekendFamilies = new Set(marks.filter(a => kindOf.get(a.session_id) === 'weekend').map(a => family(a.child_id)))
  const ownerOf = registerOwner(rows)
  const curriculum = marks.filter(a => kindOf.get(a.session_id) === 'school')
  const out = rows.schools.map((s): ConversionRow => {
    const reached = [...new Set(curriculum.filter(a => ownerOf(a) === s.id).map(a => a.child_id))]
    const converted = reached.filter(id => weekendFamilies.has(family(id))).length
    return { school: s.name, reached: reached.length, converted, pct: pct(converted, reached.length) ?? 0 }
  }).filter(r => r.reached > 0).sort((a, b) => b.pct - a.pct || a.school.localeCompare(b.school))
  return { need: null, rows: out }
}

export function complianceSummary(rows: InsightRows, today: string): LiveInsights['compliance'] {
  const people = compliancePeople(rows, today)
  const certs = people.flatMap(p => p.certificates)
  const count = (state: string) => certs.filter(c => c.state === state).length
  const cpd = evidenceFromRows(rows).filter(e => e.cpdRecords > 0).map(e => ({ school: e.name, records: e.cpdRecords, people: e.cpdPeople }))
  return {
    need: people.length ? null : 'coaches or volunteers',
    coaches: people.filter(p => p.kind === 'coach').length,
    volunteers: people.filter(p => p.kind === 'volunteer').length,
    valid: count('ok'), expiring: count('expiring'), expired: count('expired'), notRecorded: count('not recorded'),
    items: complianceItems(people),
    cpdNeed: cpd.length ? null : 'CPD records',
    cpd,
  }
}

export function buildInsights(rows: InsightRows, today = isoToday()): LiveInsights {
  return {
    year: academicYear(today),
    headline: headlineTiles(rows, today),
    reach: monthlyReach(rows, today),
    attendance: attendanceOverTime(rows),
    schools: schoolsTable(rows),
    demographics: demographics(rows),
    conversion: weekendConversion(rows),
    compliance: complianceSummary(rows, today),
  }
}

export const emptyInsights = (today = isoToday()) =>
  buildInsights({ schools: [], programmes: [], campaigns: [], events: [], donations: [], checkins: [] }, today)
