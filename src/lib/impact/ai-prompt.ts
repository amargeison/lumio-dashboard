// What the newsletter AI is told. Pure: the route loads the org's facts
// (comms-server.ts → newsletterFacts) and this turns them, the brand voice and the
// chosen angle into the system prompt and the user message. Only the facts passed in
// reach the model, so it can't be given a child's name or anyone's contact details,
// and the rules forbid it inventing anything else (tests/impact/comms.test.mjs holds a
// snapshot of the whole prompt).

import type { BrandVoice } from './comms-settings'
import type { NewsletterSection } from './newsletter'

export interface FactSession { date: string; venue: string | null; kind: 'school' | 'weekend'; school?: string | null }

export interface NewsletterFacts {
  org: string
  today: string
  /** The last 14 days. */
  ran: FactSession[]
  /** The next 21 days. */
  coming: FactSession[]
  /** Weekend venues with their regular day and time. */
  venues: { name: string; when: string | null; where: string | null }[]
  booklet: { week: number; title: string; focus: string; homeTask: string } | null
  /** What's in the welcome pack. */
  pack: string[]
  /** Key dates from the Sport Network record. */
  keyDates: { when: string; label: string }[]
}

export const ANGLES = [
  { id: 'this_week', label: 'What’s on this week', ask: 'Tell families what is on in the coming days: which sessions, where and when, and the booklet task to try at home.' },
  { id: 'we_did', label: 'What we did', ask: 'Look back warmly at the sessions that ran recently (where and when), and what children were working on in the booklet.' },
  { id: 'date_push', label: 'A push for a date', ask: 'Encourage families to come to one particular upcoming date. Make it the focus of the newsletter; mention other things only briefly.' },
] as const
export type AngleId = typeof ANGLES[number]['id']

const fmt = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
const sessionLine = (s: FactSession) => `- ${fmt(s.date)}: ${s.kind === 'weekend' ? 'weekend family session' : 'school session'}${s.venue ? ` at ${s.venue}` : ''}${s.school ? ` (${s.school})` : ''}`

/** The facts as the model sees them. Sections with nothing in them say so, so the model isn't tempted to fill them. */
export function factsBlock(f: NewsletterFacts): string {
  const out: string[] = [`Organisation: ${f.org}`, `Today: ${fmt(f.today)}`]
  out.push('', 'Sessions that ran in the last two weeks:', ...(f.ran.length ? f.ran.map(sessionLine) : ['- none recorded']))
  out.push('', 'Sessions coming up in the next three weeks:', ...(f.coming.length ? f.coming.map(sessionLine) : ['- none scheduled']))
  out.push('', 'Weekend venues:', ...(f.venues.length ? f.venues.map(v => `- ${v.name}${v.when ? `, ${v.when}` : ''}${v.where ? `, ${v.where}` : ''}`) : ['- none']))
  out.push('', 'Booklet this week:', f.booklet ? `- Week ${f.booklet.week}: ${f.booklet.title}${f.booklet.focus ? ` (focus: ${f.booklet.focus})` : ''}${f.booklet.homeTask ? `. Home task: ${f.booklet.homeTask}` : ''}` : '- not set')
  out.push('', 'In the welcome pack:', f.pack.length ? `- ${f.pack.join(', ')}` : '- not set')
  out.push('', 'Key dates:', ...(f.keyDates.length ? f.keyDates.map(k => `- ${k.when}: ${k.label}`) : ['- none']))
  return out.join('\n')
}

export function systemPrompt(org: string, voice: BrandVoice): string {
  return [
    `You write short email newsletters for parents on behalf of ${org}, a sports programme for children and families.`,
    '',
    'Rules — follow every one:',
    '1. UK English spelling and dates (e.g. "Saturday 5 December", "colour", "programme").',
    '2. Warm and short. A parent should be able to read the whole newsletter in 60 seconds: at most 3 sections, each body under 70 words.',
    '3. Use only the facts supplied in the FACTS block. Do not invent sessions, dates, times, venues, prizes, people or quotes.',
    '4. Make no claims about reach, numbers or outcomes (how many children, how much they improved, what research shows) unless that exact number or outcome is in the FACTS.',
    '5. Never name a child. Never include anyone’s email address or phone number.',
    `6. Plain language for a reading age of about ${voice.readingAge}: short sentences, everyday words, no jargon.`,
    `7. Tone: ${voice.tone}.`,
    voice.signOff ? `8. End the last section with the sign-off: "${voice.signOff}".` : '8. End the last section with a short, friendly sign-off from the team.',
    voice.use.length ? `9. Where it fits naturally, use these words or phrases: ${voice.use.map(w => `"${w}"`).join(', ')}.` : '9. No required phrases.',
    voice.avoid.length ? `10. Never use these words or phrases: ${voice.avoid.map(w => `"${w}"`).join(', ')}.` : '10. No banned phrases beyond the rules above.',
    '11. If the facts are thin, write less. Never pad with made-up detail.',
    '',
    'Reply with JSON only, no other text.',
  ].join('\n')
}

export type DraftTarget = { kind: 'all' } | { kind: 'section'; index: number; current: NewsletterSection; others: string[] }

export function buildNewsletterPrompt(facts: NewsletterFacts, voice: BrandVoice, angle: AngleId, target: DraftTarget = { kind: 'all' }, focusDate?: string | null): { system: string; user: string } {
  const a = ANGLES.find(x => x.id === angle) ?? ANGLES[0]
  const focus = angle === 'date_push' ? (focusDate ? ` The date to push is ${fmt(focusDate)}.` : ' Choose the next upcoming session in the FACTS as the date to push.') : ''
  const ask = target.kind === 'all'
    ? `Write a newsletter. Angle: ${a.label}. ${a.ask}${focus}\n\nJSON shape: {"subject": string (under 60 characters), "preheader": string (under 90 characters), "sections": [{"headline": string, "body": string}]}`
    : `Rewrite section ${target.index + 1} of a newsletter, keeping its topic. Angle: ${a.label}. ${a.ask}${focus}\n\nThe section now reads:\nHeadline: ${target.current.headline}\nBody: ${target.current.body}\n\n${target.others.length ? `The other sections' headlines (don't repeat them): ${target.others.join(' | ')}\n\n` : ''}JSON shape: {"headline": string, "body": string}`
  return { system: systemPrompt(facts.org, voice), user: `FACTS\n${factsBlock(facts)}\nEND OF FACTS\n\n${ask}` }
}

/** The model's reply, read defensively: the first {...} in it, with only the fields we asked for. */
export function parseDraft(text: string): { subject?: string; preheader?: string; sections?: { headline: string; body: string }[]; headline?: string; body?: string } | null {
  const m = text.match(/\{[\s\S]*\}/)
  if (!m) return null
  try {
    const j = JSON.parse(m[0]) as Record<string, unknown>
    const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : undefined)
    const sections = Array.isArray(j.sections)
      ? (j.sections as Record<string, unknown>[]).slice(0, 3).map(s => ({ headline: str(s?.headline, 120) ?? '', body: str(s?.body, 2500) ?? '' })).filter(s => s.headline || s.body)
      : undefined
    return { subject: str(j.subject, 150), preheader: str(j.preheader, 150), sections, headline: str(j.headline, 120), body: str(j.body, 2500) }
  } catch { return null }
}
