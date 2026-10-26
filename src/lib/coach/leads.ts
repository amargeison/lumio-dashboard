// Leads: the pipelines, the points, and reading leads that arrive from outside.
// Pure — no database, no browser.
//
// Two pipelines, with the coach's own stage names:
//   UK coaching  Enquired › Contacted › Communicated with › Trial › Keen for future / Not keen / Joined
//   Holidays     Enquired › Contact attempted › Spoken to › Keen for future › Not keen › Already been
//
// The weekly score is deliberately light: a point for moving a lead on, more
// for a trial or a new client, and for doing a follow-up on the day you said
// you would. A week with five points or more keeps the streak going.

export type Pipeline = 'coaching' | 'holiday'

export const PIPELINES: Record<Pipeline, { label: string; stages: string[]; closed: string[] }> = {
  coaching: { label: 'UK coaching', stages: ['Enquired', 'Contacted', 'Communicated with', 'Trial', 'Keen for future', 'Not keen', 'Joined'], closed: ['Not keen', 'Joined'] },
  holiday:  { label: 'Holidays',    stages: ['Enquired', 'Contact attempted', 'Spoken to', 'Keen for future', 'Not keen', 'Already been'], closed: ['Not keen', 'Already been'] },
}

export const SOURCES = ['Meta ad', 'Website', 'Referral', 'Google', 'Walk-in', 'Import', 'Other'] as const
export const CONTACT_METHODS = ['WhatsApp', 'Email', 'Phone', 'In person'] as const

export const stagesOf = (p: string) => PIPELINES[(p === 'holiday' ? 'holiday' : 'coaching') as Pipeline].stages
export const isClosed = (p: string, stage: string) => PIPELINES[(p === 'holiday' ? 'holiday' : 'coaching') as Pipeline].closed.includes(stage)

/** Points for moving a lead from one stage to another. Moving back scores nothing. */
export function stagePoints(pipeline: string, from: string | null, to: string): number {
  const st = stagesOf(pipeline)
  const a = from ? st.indexOf(from) : -1, b = st.indexOf(to)
  if (b < 0 || b <= a) return 0
  if (to === 'Joined') return 5
  if (to === 'Trial' || to === 'Spoken to') return 2
  if (to === 'Not keen') return 1        // closing a lead off is progress too
  return 1
}
export const FOLLOWUP_POINTS = 1
export const STREAK_POINTS = 5

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
    const w = weekOf(new Date(e.created_at).toISOString())
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
export type IncomingLead = { name: string; email: string | null; phone: string | null; message: string | null; campaign: string | null; pipeline: Pipeline; forName: string | null }

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const pick = (o: Record<string, unknown>, keys: string[]): string => {
  for (const k of keys) {
    const hit = Object.keys(o).find(x => x.toLowerCase().replace(/[\s-]+/g, '_') === k)
    const v = hit ? o[hit] : undefined
    if (v != null && String(v).trim()) return String(v).trim()
  }
  return ''
}
const KNOWN = ['full_name', 'name', 'first_name', 'last_name', 'email', 'email_address', 'phone_number', 'phone', 'mobile', 'telephone', 'message', 'comments', 'notes', 'enquiry', 'campaign_name', 'campaign', 'form_name', 'ad_name', 'adset_name', 'pipeline', 'child_name', 'player_name', 'childs_name', 'created_time', 'id', 'lead_id', 'form_id', 'page_id', 'ad_id', 'platform', 'is_organic']

/** Read one lead from whatever shape an automation sends. Null when there is no name, email or phone at all. */
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
  const emailRaw = pick(o, ['email', 'email_address']).toLowerCase()
  const email = EMAIL_RE.test(emailRaw) ? emailRaw.slice(0, 200) : null
  const phone = pick(o, ['phone_number', 'phone', 'mobile', 'telephone']).replace(/^p:/i, '').slice(0, 40) || null
  if (!name && !email && !phone) return null
  const campaign = pick(o, ['campaign_name', 'campaign', 'form_name', 'ad_name', 'adset_name']).slice(0, 200) || null
  const pipeRaw = pick(o, ['pipeline']).toLowerCase()
  const pipeline: Pipeline = pipeRaw.startsWith('hol') || (!pipeRaw && /holiday|trip|camp|abroad|portugal|spain/i.test(campaign || '')) ? 'holiday' : 'coaching'
  // Everything else they answered goes in the message, question by question.
  const extra = Object.entries(o)
    .filter(([k, v]) => !KNOWN.includes(k.toLowerCase().replace(/[\s-]+/g, '_')) && k !== 'field_data' && v != null && typeof v !== 'object' && String(v).trim())
    .slice(0, 20).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${String(v).trim().slice(0, 300)}`)
  const message = [pick(o, ['message', 'comments', 'notes', 'enquiry']), ...extra].filter(Boolean).join('\n').slice(0, 2000) || null
  const forName = pick(o, ['child_name', 'player_name', 'childs_name']).slice(0, 120) || null
  return { name: name || email || phone || 'New lead', email, phone, message, campaign, pipeline, forName }
}

// ── Importing a spreadsheet ────────────────────────────────────────────────
export type ImportColumn = 'name' | 'for_name' | 'email' | 'phone' | 'stage' | 'notes' | 'source' | 'contact_method' | 'list' | 'created' | 'skip'

/** A sensible guess at what each column of a spreadsheet holds, from its heading. */
export function guessColumn(header: string): ImportColumn {
  const h = header.toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim()
  if (/^(child|player|kid|son|daughter)/.test(h) || /child s name|player name/.test(h)) return 'for_name'
  if (/e ?mail/.test(h)) return 'email'
  if (/phone|mobile|tel|number|whatsapp no/.test(h)) return 'phone'
  if (/status|stage|progress|outcome/.test(h)) return 'stage'
  if (/source|\bfrom\b|how did|channel|\bads?\b|campaign/.test(h)) return 'source'
  if (/contact method|contacted via|how contacted|method/.test(h)) return 'contact_method'
  if (/list|waiting|bucket|group/.test(h)) return 'list'
  if (/date|created|enquired on|added/.test(h)) return 'created'
  if (/note|comment|detail|message|info/.test(h)) return 'notes'
  if (/name|client|lead|contact|parent/.test(h)) return 'name'
  return 'skip'
}

/** The pipeline stage a spreadsheet's status text means, or the first stage. */
export function matchStage(pipeline: string, text: string): string {
  const st = stagesOf(pipeline)
  const t = String(text || '').toLowerCase().trim()
  if (!t) return st[0]
  const exact = st.find(s => s.toLowerCase() === t)
  if (exact) return exact
  // Order matters: the first rule that matches wins. "No answer" is not a no.
  const NO_REPLY = /\b(no answer|no reply|no response|left (a )?(message|voicemail)|tried|attempt)/
  const NOT_KEEN = /\b(not keen|not interested|no thanks|declined?|lost|no)\b/
  const rules: [RegExp, string][] = pipeline === 'holiday'
    ? [[NO_REPLY, 'Contact attempted'], [NOT_KEEN, 'Not keen'], [/\b(already been|been before|went|previous)/, 'Already been'], [/\b(keen|future|maybe|next year)/, 'Keen for future'], [/\b(spoke|spoken|call(ed)?|chat)/, 'Spoken to'], [/\bcontact/, 'Contact attempted']]
    : [[/\btrial|\btaster/, 'Trial'], [NO_REPLY, 'Contacted'], [NOT_KEEN, 'Not keen'], [/\b(join|signed|client|member)/, 'Joined'], [/\b(keen|future|maybe|later|next term)/, 'Keen for future'], [/\b(communicat|spoke|spoken|chat)/, 'Communicated with'], [/\b(contact|messag|emailed|called|whatsapp)/, 'Contacted']]
  for (const [re, stage] of rules) if (re.test(t)) return stage
  return st[0]
}

const cut = (v: unknown, n: number) => { const t = String(v ?? '').trim(); return t ? t.slice(0, n) : null }

/** One spreadsheet row (already mapped to our columns) as a lead row, or null when it has no name, email or phone. */
export function cleanImportRow(pipeline: Pipeline, r: Record<string, unknown>) {
  const stages = stagesOf(pipeline)
  const name = cut(r.name, 120) || cut(r.email, 120) || cut(r.phone, 40)
  if (!name) return null
  const created = cut(r.created, 30)
  const at = created && !Number.isNaN(Date.parse(created)) ? new Date(created).toISOString() : null
  const method = cut(r.contact_method, 30)
  return {
    pipeline,
    stage: stages.includes(String(r.stage)) ? String(r.stage) : stages[0],
    name, for_name: cut(r.for_name, 120), email: cut(r.email, 200)?.toLowerCase() || null, phone: cut(r.phone, 40),
    notes: cut(r.notes, 5000), source: cut(r.source, 40) || 'Import', list: cut(r.list, 80),
    contact_method: (method && (CONTACT_METHODS as readonly string[]).find(m => m.toLowerCase() === method.toLowerCase())) || method,
    ...(at ? { created_at: at, stage_changed_at: at } : {}),
  }
}
export const IMPORT_MAX = 2000
