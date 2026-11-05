// Leads: the pipelines, the points, and reading leads that arrive from outside.
// Pure: no database, no browser. A copy of Coach's library, not a share of it,
// so either product can be sold without the other. Never import from coach paths.
//
// Two pipelines:
//   Schools  Enquired › Contacted › Meeting booked › Visit / taster › Proposal sent › Keen for future › Not keen › Partnered
//   Funders  Enquired › Contacted › Meeting booked › Proposal sent › Keen for future › Declined › Funded
//
// The weekly score is deliberately light: a point for moving a lead on, more for
// a meeting or a visit, most for a win, and a point for doing a follow-up on the
// day you said you would. A week with five points or more keeps the streak going.

export type Pipeline = 'schools' | 'funders'

export const PIPELINES: Record<Pipeline, { label: string; stages: string[]; closed: string[] }> = {
  schools: { label: 'Schools', stages: ['Enquired', 'Contacted', 'Meeting booked', 'Visit / taster', 'Proposal sent', 'Keen for future', 'Not keen', 'Partnered'], closed: ['Not keen', 'Partnered'] },
  funders: { label: 'Funders', stages: ['Enquired', 'Contacted', 'Meeting booked', 'Proposal sent', 'Keen for future', 'Declined', 'Funded'], closed: ['Declined', 'Funded'] },
}

export type Lead = {
  id: string; pipeline: Pipeline; stage: string; name: string; org_name?: string | null; for_name?: string | null
  email?: string | null; phone?: string | null; source?: string | null; campaign?: string | null; message?: string | null
  notes?: string | null; contact_method?: string | null; list?: string | null; next_action_at?: string | null; next_action?: string | null
  amount_pence?: number | null; school_id?: string | null; campaign_id?: string | null; stage_changed_at?: string | null; created_at: string
}
export type LeadEvent = { id: string; lead_id: string; kind: string; from_stage?: string | null; to_stage?: string | null; text?: string | null; points?: number | null; created_at: string }

export const SOURCES = ['Meta ad', 'Website', 'Referral', 'Google', 'Event', 'Council / LA', 'Import', 'Other'] as const
export const CONTACT_METHODS = ['WhatsApp', 'Email', 'Phone', 'In person'] as const

const pipelineOf = (p: string): Pipeline => p === 'funders' ? 'funders' : 'schools'
export const stagesOf = (p: string) => PIPELINES[pipelineOf(p)].stages
export const isClosed = (p: string, stage: string) => PIPELINES[pipelineOf(p)].closed.includes(stage)

/** Points for moving a lead from one stage to another. Moving back scores nothing, except out of "Keen for future". */
export function stagePoints(pipeline: string, from: string | null, to: string): number {
  const st = stagesOf(pipeline)
  const a = from ? st.indexOf(from) : -1, b = st.indexOf(to)
  if (b < 0 || from === to) return 0
  // Coming back from "Keen for future" is re-engagement, not moving backwards.
  if (from === 'Keen for future' && !isClosed(pipeline, to)) return 1
  if (b <= a) return 0
  if (to === 'Partnered' || to === 'Funded') return 5
  if (to === 'Meeting booked' || to === 'Visit / taster') return 2
  return 1                               // closing a lead off is progress too
}

/**
 * Lead notes as they are shown. Each note is saved with the day it was written
 * in front, "[2026-11-03] Called back"; on screen that reads "3 Nov · Called
 * back", the same as the History list. The saved text is not changed.
 */
export function notesForDisplay(notes: string): string {
  return notes.replace(/^\[(\d{4})-(\d{2})-(\d{2})\]\s*/gm, (whole, y: string, m: string, d: string) => {
    const t = new Date(`${y}-${m}-${d}T12:00:00Z`)
    return isNaN(t.getTime()) ? whole : `${t.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })} · `
  })
}

export const FOLLOWUP_POINTS = 1
export const STREAK_POINTS = 5

/** The date in the UK at a moment, as YYYY-MM-DD. en-CA formats as year-month-day. */
export const ukDate = (at: string | Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(at))

/** Monday of the week (UK) a date falls in, as YYYY-MM-DD. */
export function weekOf(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`)
  const wd = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - wd)
  return d.toISOString().slice(0, 10)
}

/** This week's points and the streak of weeks (ending this week or last) with STREAK_POINTS or more. */
export function scoreOf(events: { created_at: string; points?: number | null }[], today: string): { week: number; streak: number } {
  const byWeek = new Map<string, number>()
  for (const e of events) {
    const w = weekOf(ukDate(e.created_at))
    byWeek.set(w, (byWeek.get(w) || 0) + (Number(e.points) || 0))
  }
  const thisWeek = weekOf(today)
  const week = byWeek.get(thisWeek) || 0
  let streak = 0
  const d = new Date(`${thisWeek}T12:00:00Z`)
  // This week only counts once it has reached the mark; otherwise start from last week.
  if (week < STREAK_POINTS) d.setUTCDate(d.getUTCDate() - 7)
  for (;;) {
    const w = d.toISOString().slice(0, 10)
    if ((byWeek.get(w) || 0) >= STREAK_POINTS) { streak++; d.setUTCDate(d.getUTCDate() - 7) } else break
  }
  return { week, streak }
}

// ── Leads sent in by an automation (Meta lead ads through Zapier, Make, …) ──
export type IncomingLead = { name: string; orgName: string | null; forName: string | null; email: string | null; phone: string | null; message: string | null; campaign: string | null; pipeline: Pipeline }

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const pick = (o: Record<string, unknown>, keys: string[]): string => {
  for (const k of keys) {
    const hit = Object.keys(o).find(x => x.toLowerCase().replace(/[\s-]+/g, '_') === k)
    const v = hit ? o[hit] : undefined
    if (v != null && String(v).trim()) return String(v).trim()
  }
  return ''
}
const ORG_KEYS = ['organisation', 'organization', 'organisation_name', 'organization_name', 'school', 'school_name', 'company', 'company_name', 'funder', 'trust']
const ROLE_KEYS = ['role', 'job_title', 'position']
const KNOWN = ['full_name', 'name', 'first_name', 'last_name', 'email', 'email_address', 'phone_number', 'phone', 'mobile', 'telephone', 'message', 'comments', 'notes', 'enquiry', 'campaign_name', 'campaign', 'form_name', 'ad_name', 'adset_name', 'pipeline', ...ORG_KEYS, ...ROLE_KEYS, 'created_time', 'id', 'lead_id', 'form_id', 'page_id', 'ad_id', 'platform', 'is_organic']

// "Trust" is left out on purpose: an academy trust is a school lead.
const FUNDER_CAMPAIGN = /\b(funders?|grants?|sponsors?|sponsorship|foundation)\b/i

/** Read one lead from whatever shape an automation sends. Null when there is no name, organisation, email or phone at all. */
export function readIncoming(raw: unknown): IncomingLead | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  // Some tools wrap the answers: { field_data: [{ name, values: [] }] } (Meta's own shape).
  let o = raw as Record<string, unknown>
  const fd = (o as { field_data?: { name?: string; values?: unknown[] }[] }).field_data
  if (Array.isArray(fd)) {
    o = { ...o }
    for (const f of fd) if (f?.name) o[f.name] = Array.isArray(f.values) ? f.values.join(', ') : ''
  }
  const first = pick(o, ['first_name']), last = pick(o, ['last_name'])
  const name = (pick(o, ['full_name', 'name']) || [first, last].filter(Boolean).join(' ')).slice(0, 120)
  const orgName = pick(o, ORG_KEYS).slice(0, 200) || null
  const emailRaw = pick(o, ['email', 'email_address']).toLowerCase()
  const email = EMAIL_RE.test(emailRaw) ? emailRaw.slice(0, 200) : null
  const phone = pick(o, ['phone_number', 'phone', 'mobile', 'telephone']).replace(/^p:/i, '').slice(0, 40) || null
  if (!name && !orgName && !email && !phone) return null
  const campaign = pick(o, ['campaign_name', 'campaign', 'form_name', 'ad_name', 'adset_name']).slice(0, 200) || null
  const pipeRaw = pick(o, ['pipeline']).toLowerCase()
  const pipeline: Pipeline = pipeRaw.startsWith('fund') || (!pipeRaw && FUNDER_CAMPAIGN.test(campaign || '')) ? 'funders' : 'schools'
  // Everything else they answered goes in the message, question by question.
  const extra = Object.entries(o)
    .filter(([k, v]) => !KNOWN.includes(k.toLowerCase().replace(/[\s-]+/g, '_')) && k !== 'field_data' && v != null && typeof v !== 'object' && String(v).trim())
    .slice(0, 20).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${String(v).trim().slice(0, 300)}`)
  const message = [pick(o, ['message', 'comments', 'notes', 'enquiry']), ...extra].filter(Boolean).join('\n').slice(0, 2000) || null
  const forName = pick(o, ROLE_KEYS).slice(0, 120) || null
  return { name: name || orgName?.slice(0, 120) || email || phone || 'New lead', orgName, forName, email, phone, message, campaign, pipeline }
}

// ── Importing a spreadsheet ────────────────────────────────────────────────
export type ImportColumn = 'name' | 'org_name' | 'for_name' | 'email' | 'phone' | 'stage' | 'notes' | 'source' | 'contact_method' | 'list' | 'created' | 'next_action_at' | 'amount' | 'skip'

/** A sensible guess at what each column of a spreadsheet holds, from its heading. */
export function guessColumn(header: string): ImportColumn {
  const h = header.toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim()
  if (/^(school|organi[sz]ation|org\b|company|funder|academy|trust)/.test(h)) return 'org_name'
  if (/\b(role|job title|position)\b/.test(h)) return 'for_name'
  if (/e ?mail/.test(h)) return 'email'
  if (/phone|mobile|\btel\b|contact number|whatsapp no/.test(h)) return 'phone'
  if (/status|stage|progress|outcome/.test(h)) return 'stage'
  if (/\b(amount|value|budget|grant)\b/.test(h)) return 'amount'
  if (/source|\bfrom\b|how did|channel|\bads?\b|campaign/.test(h)) return 'source'
  if (/contact method|contacted via|how contacted|method/.test(h)) return 'contact_method'
  if (/follow ?up|next (action|contact|step)/.test(h)) return 'next_action_at'
  if (/list|waiting|bucket/.test(h)) return 'list'
  if (/date|created|enquired on|added/.test(h)) return 'created'
  if (/note|comment|detail|message|info/.test(h)) return 'notes'
  if (/name|client|lead|contact|person/.test(h)) return 'name'
  return 'skip'
}

/** The pipeline stage a spreadsheet's status text means, or the first stage. */
export function matchStage(pipeline: string, text: string): string {
  const st = stagesOf(pipeline)
  const t = String(text || '').toLowerCase().trim()
  if (!t) return st[0]
  const exact = st.find(s => s.toLowerCase() === t)
  if (exact) return exact
  // Order matters: the first rule that matches wins. "No answer" is not a no, and
  // "not yet" is not a no either. A closed stage is the costliest wrong guess, so
  // the winning words are narrow and come after the stages they could be part of.
  const NO_REPLY = /\b(no answer|no reply|no response|left (a )?(message|voicemail)|tried|attempt)/
  const LATER = /\b(keen|future|maybe|later|next (term|year)|not now|not yet)/
  const NOT_KEEN = /\b(not keen|not interested|not proceeding|not partnered|not funded|no thanks|declined?|rejected|unsuccessful|turned down|lost|no)\b/
  const MEETING = /\b(meeting|meet|call booked)/
  const CONTACTED = /\b(contact|messag|emailed|called|spoke|spoken|whatsapp)/
  const rules: [RegExp, string][] = pipeline === 'funders'
    ? [[NO_REPLY, 'Contacted'], [NOT_KEEN, 'Declined'], [MEETING, 'Meeting booked'], [/\b(funded|awarded|granted|successful|secured|won)\b/, 'Funded'], [/\b(proposal|application|applied|bid|submitted)/, 'Proposal sent'], [LATER, 'Keen for future'], [CONTACTED, 'Contacted']]
    : [[NO_REPLY, 'Contacted'], [NOT_KEEN, 'Not keen'], [/\b(visit|taster|trial)/, 'Visit / taster'], [MEETING, 'Meeting booked'], [/\b(proposal|quote)/, 'Proposal sent'], [/\b(partnered|signed|confirmed|won)\b/, 'Partnered'], [LATER, 'Keen for future'], [CONTACTED, 'Contacted']]
  for (const [re, stage] of rules) if (re.test(t)) return stage
  return st[0]
}

const cut = (v: unknown, n: number) => { const t = String(v ?? '').trim(); return t ? t.slice(0, n) : null }

/** "£5,000" or "5000.50" as pence. Null when it isn't a plain amount. */
export function amountPence(v: unknown): number | null {
  const t = String(v ?? '').replace(/[£,\s]/g, '')
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null
  const pence = Math.round(Number(t) * 100)
  return pence <= 2147483647 ? pence : null
}

/** One spreadsheet row (already mapped to our columns) as a lead row, or null when it has no name, organisation, email or phone. */
export function cleanImportRow(pipeline: Pipeline, r: Record<string, unknown>) {
  const stages = stagesOf(pipeline)
  const name = cut(r.name, 120) || cut(r.org_name, 120) || cut(r.email, 120) || cut(r.phone, 40)
  if (!name) return null
  const created = cut(r.created, 30)
  const at = created && !Number.isNaN(Date.parse(created)) ? new Date(created).toISOString() : null
  const method = cut(r.contact_method, 30)
  const followUp = cut(r.next_action_at, 30)
  return {
    pipeline,
    stage: stages.includes(String(r.stage)) ? String(r.stage) : stages[0],
    name, org_name: cut(r.org_name, 200), for_name: cut(r.for_name, 120), email: cut(r.email, 200)?.toLowerCase() || null, phone: cut(r.phone, 40),
    notes: cut(r.notes, 5000), source: cut(r.source, 40) || 'Import', list: cut(r.list, 80), amount_pence: amountPence(r.amount),
    next_action_at: followUp && !Number.isNaN(Date.parse(followUp)) ? ukDate(followUp) : null,
    contact_method: (method && (CONTACT_METHODS as readonly string[]).find(m => m.toLowerCase() === method.toLowerCase())) || method,
    ...(at ? { created_at: at, stage_changed_at: at } : {}),
  }
}
export const IMPORT_MAX = 2000
