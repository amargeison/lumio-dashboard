// Automations (brief 4): who gets which automated email today. Pure — the scheduler
// (/api/cron/impact-comms) and the "who would receive it today" preview load the rows and
// call selectAutomations, so both answer the same way.
//
//   welcome           a new family: instant, day 1, day 7 (only families who joined after
//                     it was switched on, so switching it on doesn't mail everyone)
//   session_reminder  the day before a session: weekend sessions → that venue's families,
//                     school sessions → families with a child in that programme;
//                     optionally only some venues / schools
//   missed_you        a child's last two recorded sessions were both absences
//   pack_issued       a welcome pack item was issued in the last two days
//   booklet_nudge     Mondays while school sessions are running: this week's booklet task
//
// Each step goes once per family (impact_automation_sends is unique on automation +
// family + step), and a family gets at most ONE automated message a UK day (a unique
// index in the database; here, the first by PRIORITY wins and the rest wait). Families
// who can't be reached by email are recorded as skipped, which doesn't use up their day.
// Templates never carry a child's name: there's no placeholder for one.

import { skipReason, type AudienceFamily } from './audiences'
import { addDays, daysBetween } from './comms-settings'

export const AUTOMATION_KINDS = ['welcome', 'pack_issued', 'session_reminder', 'missed_you', 'booklet_nudge'] as const
export type AutomationKind = typeof AUTOMATION_KINDS[number]
/** Order of preference when a family is due more than one on the same day. */
export const PRIORITY: AutomationKind[] = [...AUTOMATION_KINDS]

export interface Template { subject: string; body: string }
export interface AutomationConfig {
  /** welcome: one per step. Others: `main`. */
  templates?: Partial<Record<string, Template>>
  /** When it was switched on (welcome only counts families who joined after this). */
  since?: string
  venues?: string[]
  schools?: string[]
}

export const AUTOMATION_META: Record<AutomationKind, { title: string; when: string; steps: { id: string; label: string }[]; placeholders: string[] }> = {
  welcome: { title: 'New-family welcome', when: 'When a family joins, then the next day and a week later', steps: [{ id: 'instant', label: 'Straight away' }, { id: 'day1', label: 'Day 1' }, { id: 'day7', label: 'Day 7' }], placeholders: ['first_name', 'org'] },
  pack_issued: { title: 'Welcome pack issued', when: 'When a coach issues an item from the welcome pack', steps: [{ id: 'main', label: 'Email' }], placeholders: ['first_name', 'org'] },
  session_reminder: { title: 'Session reminder', when: 'The day before a session, per venue or school', steps: [{ id: 'main', label: 'Email' }], placeholders: ['first_name', 'org', 'venue', 'date', 'time'] },
  missed_you: { title: '“We missed you”', when: 'After two absences in a row', steps: [{ id: 'main', label: 'Email' }], placeholders: ['first_name', 'org'] },
  booklet_nudge: { title: 'Booklet-week nudge', when: 'Each Monday in term', steps: [{ id: 'main', label: 'Email' }], placeholders: ['first_name', 'org', 'week', 'booklet_title', 'home_task'] },
}

export const DEFAULT_TEMPLATES: Record<AutomationKind, Record<string, Template>> = {
  welcome: {
    instant: { subject: 'Welcome to {org}', body: 'Hi {first_name},\n\nWelcome to {org} — we’re really glad you’ve joined us.\n\nIf you have any questions, just reply to this email.' },
    day1: { subject: 'Getting started with {org}', body: 'Hi {first_name},\n\nA quick hello from the team. Your family app has your session times and your check-in code — have a look before your first visit.' },
    day7: { subject: 'How’s it going?', body: 'Hi {first_name},\n\nYou’ve been with {org} for a week now. We’d love to hear how it’s going — just reply to this email.' },
  },
  pack_issued: { main: { subject: 'Your welcome pack', body: 'Hi {first_name},\n\nJust to let you know, a welcome pack item has been handed out to your family today. Any questions, just reply.' } },
  session_reminder: { main: { subject: 'See you tomorrow at {venue}', body: 'Hi {first_name},\n\nA reminder that there’s a session tomorrow, {date}{time} at {venue}. See you there!' } },
  missed_you: { main: { subject: 'We missed you', body: 'Hi {first_name},\n\nWe’ve missed you at the last couple of sessions. Everything OK? You’re always welcome back — just reply if there’s anything we can help with.' } },
  booklet_nudge: { main: { subject: 'This week’s booklet: {booklet_title}', body: 'Hi {first_name},\n\nIt’s week {week} — {booklet_title}. Your task to try at home this week: {home_task}\n\nHave fun!' } },
}

export const templateFor = (kind: AutomationKind, step: string, config: AutomationConfig | undefined): Template => {
  const key = kind === 'welcome' ? step : 'main'
  const own = config?.templates?.[key]
  const base = DEFAULT_TEMPLATES[kind][key] ?? DEFAULT_TEMPLATES[kind].main
  return { subject: own?.subject?.trim() || base.subject, body: own?.body?.trim() || base.body }
}

export const fill = (t: string, vars: Record<string, string>) => t.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? vars[k] : m))

export interface AutomationRow { id: string; kind: AutomationKind; enabled: boolean; config: AutomationConfig }

export interface AutomationWorld {
  today: string
  /** 1 = Monday … 7 = Sunday, UK. */
  weekday: number
  org: string
  families: (AudienceFamily & { created_at?: string | null })[]
  children: { id: string; family_id: string | null; programme_id: string | null; school_id: string | null }[]
  programmes: { id: string; school_id: string | null; current_week: number | null }[]
  sessions: { id: string; kind: 'school' | 'weekend'; programme_id: string | null; venue_id: string | null; session_date: string }[]
  attendance: { session_id: string; child_id: string; present: boolean }[]
  packIssues: { id: string; child_id: string; issued_at: string }[]
  venues: { id: string; name: string; session_time: string | null }[]
  bookletWeeks: { week: number; title?: string; focus?: string; home_task?: string }[]
  /** `${automationId}|${familyId}|${step}` already claimed or sent. */
  done: Set<string>
  /** Families who already have a (non-skipped) automated message today. */
  usedToday: Set<string>
}

export interface Candidate { automationId: string; kind: AutomationKind; familyId: string; guardian: string; step: string; subject: string; body: string }
export interface Selection { send: Candidate[]; skipped: (Candidate & { reason: string })[]; waiting: Candidate[] }

const fmtDate = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
const firstName = (g: string) => g.trim().split(/\s+/)[0] || 'there'

function due(a: AutomationRow, w: AutomationWorld): { familyId: string; step: string; vars: Record<string, string> }[] {
  const out: { familyId: string; step: string; vars: Record<string, string> }[] = []
  const famById = new Map(w.families.map(f => [f.id, f]))
  const childFamily = new Map(w.children.map(c => [c.id, c.family_id]))
  const active = (f: AudienceFamily | undefined) => !!f && !f.lapsed_at && !f.waitlisted_at

  if (a.kind === 'welcome') {
    const since = a.config.since ? a.config.since.slice(0, 10) : null
    if (!since) return out
    for (const f of w.families) {
      const joined = (f.signed_up_at ?? f.created_at ?? '').slice(0, 10)
      if (!joined || joined < since || f.waitlisted_at) continue
      const age = daysBetween(joined, w.today)
      const steps = [['instant', 0, 2], ['day1', 1, 3], ['day7', 7, 9]] as const
      const next = steps.find(([id, lo, hi]) => age >= lo && age <= hi && !w.done.has(`${a.id}|${f.id}|${id}`))
      if (next) out.push({ familyId: f.id, step: next[0], vars: {} })
    }
  }

  if (a.kind === 'session_reminder') {
    const tomorrow = addDays(w.today, 1)
    const venues = a.config.venues ?? [], schools = a.config.schools ?? []
    for (const s of w.sessions.filter(x => x.session_date === tomorrow)) {
      const venue = w.venues.find(v => v.id === s.venue_id)
      let fams: string[] = []
      if (s.kind === 'weekend') {
        if (!s.venue_id || (venues.length && !venues.includes(s.venue_id))) continue
        fams = w.families.filter(f => f.community_venue_id === s.venue_id && active(f)).map(f => f.id)
      } else {
        const p = w.programmes.find(x => x.id === s.programme_id)
        if (!p || (schools.length && !schools.includes(p.school_id ?? ''))) continue
        fams = [...new Set(w.children.filter(c => c.programme_id === p.id && c.family_id).map(c => c.family_id!))].filter(id => active(famById.get(id)))
      }
      const time = s.kind === 'weekend' && venue?.session_time ? ` at ${venue.session_time}` : ''
      for (const id of fams) out.push({ familyId: id, step: `session:${s.id}`, vars: { venue: venue?.name ?? 'your session', date: fmtDate(s.session_date), time } })
    }
  }

  if (a.kind === 'missed_you') {
    const dateOf = new Map(w.sessions.map(s => [s.id, s.session_date]))
    const byChild = new Map<string, { date: string; present: boolean; session: string }[]>()
    for (const r of w.attendance) {
      const date = dateOf.get(r.session_id)
      if (!date || date > w.today) continue
      if (!byChild.has(r.child_id)) byChild.set(r.child_id, [])
      byChild.get(r.child_id)!.push({ date, present: r.present, session: r.session_id })
    }
    const seen = new Set<string>()
    for (const [child, rows] of byChild) {
      rows.sort((x, y) => y.date.localeCompare(x.date))
      const [last, before] = rows
      if (!last || !before || last.present || before.present || daysBetween(last.date, w.today) > 14) continue
      const fam = childFamily.get(child)
      if (!fam || seen.has(fam) || !active(famById.get(fam))) continue
      seen.add(fam)
      out.push({ familyId: fam, step: `missed:${last.session}`, vars: {} })
    }
  }

  if (a.kind === 'pack_issued') {
    const from = addDays(w.today, -2)
    for (const i of w.packIssues) {
      const d = i.issued_at.slice(0, 10)
      const fam = childFamily.get(i.child_id)
      if (d < from || d > w.today || !fam || !famById.get(fam)) continue
      out.push({ familyId: fam, step: `pack:${i.id}`, vars: {} })
    }
  }

  if (a.kind === 'booklet_nudge' && w.weekday === 1) {
    const end = addDays(w.today, 6)
    const running = new Set(w.sessions.filter(s => s.kind === 'school' && s.session_date >= w.today && s.session_date <= end && s.programme_id).map(s => s.programme_id!))
    const seen = new Set<string>()
    for (const c of w.children) {
      if (!c.programme_id || !running.has(c.programme_id) || !c.family_id || seen.has(c.family_id) || !active(famById.get(c.family_id))) continue
      const week = w.programmes.find(p => p.id === c.programme_id)?.current_week ?? null
      const b = week != null ? w.bookletWeeks.find(x => x.week === week) : undefined
      if (!b || !(b.home_task ?? '').trim()) continue
      seen.add(c.family_id)
      out.push({ familyId: c.family_id, step: `week:${w.today}`, vars: { week: String(week), booklet_title: (b.title ?? '').trim() || `Week ${week}`, home_task: (b.home_task ?? '').trim() } })
    }
  }
  return out
}

export function selectAutomations(automations: AutomationRow[], w: AutomationWorld): Selection {
  const famById = new Map(w.families.map(f => [f.id, f]))
  const used = new Set(w.usedToday)
  const sel: Selection = { send: [], skipped: [], waiting: [] }
  const ordered = [...automations].filter(a => a.enabled).sort((x, y) => PRIORITY.indexOf(x.kind) - PRIORITY.indexOf(y.kind))
  for (const a of ordered) {
    for (const d of due(a, w)) {
      if (w.done.has(`${a.id}|${d.familyId}|${d.step}`)) continue
      const f = famById.get(d.familyId)
      if (!f) continue
      const t = templateFor(a.kind, d.step, a.config)
      const vars = { first_name: firstName(f.guardian_name), org: w.org, ...d.vars }
      const c: Candidate = { automationId: a.id, kind: a.kind, familyId: f.id, guardian: f.guardian_name, step: d.step, subject: fill(t.subject, vars).slice(0, 150), body: fill(t.body, vars) }
      const why = skipReason(f, 'email')
      if (why) { sel.skipped.push({ ...c, reason: why }); continue }
      if (used.has(f.id)) { sel.waiting.push(c); continue }
      used.add(f.id)
      sel.send.push(c)
    }
  }
  return sel
}
