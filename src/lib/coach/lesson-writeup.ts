// The lesson summary for a session nobody recorded.
//
// Recording a lesson produces the best write-up Lumio does: a transcript, and a
// diagnosis built from what was actually said. But most sessions are not
// recorded — a coach with a bag of balls and four minutes between lessons ticks
// "done" and moves on — and those sessions were producing an empty stub with a
// date on it. The plan already knows what the hour was FOR; the coach knows what
// they actually got through. That is enough to write something a parent will
// read, as long as the model is told exactly what it has and what it has not.
//
// Which is the whole discipline here. The input is a coach's account, not a
// transcript, so the prompt below forbids the two things that would otherwise
// make it worthless: inventing detail that was never claimed (a score, a
// success rate, a drill nobody ran) and dressing up the plan as if it were an
// observation. A summary that says more than the coach said is not a summary.

import Anthropic from '@anthropic-ai/sdk'
import { COACH_AGENT_PERSONA, COACH_DIAGNOSTIC_STANDARD } from './agent-persona'

export type WriteUp = {
  focus?: string; assessment?: string; covered?: string[]; technique?: string[]
  takeaways?: string[]; drills?: string[]; homework?: string; nextFocus?: string
  recap?: string; coachNote?: string; rating?: number
}

export type WriteUpInput = {
  playerName: string
  /** The plan's headline focus. */
  focus?: string | null
  sessionType?: string | null
  durationMin?: number | null
  /** What the plan said they would work on. */
  planned?: string[]
  /** What the coach ticked as actually covered. The load-bearing input. */
  covered?: string[]
  /** Drills from the plan that were ticked. */
  drills?: string[]
  /** Anything the coach typed at the end of the session. */
  note?: string | null
  /** 1–5, the coach's own read of how it went. */
  rating?: number | null
  /** The previous lesson, so the write-up can say what has moved. */
  last?: { date?: string | null; focus?: string | null; summary?: string | null; nextFocus?: string | null } | null
}

const SYSTEM = `${COACH_AGENT_PERSONA}

${COACH_DIAGNOSTIC_STANDARD}

For THIS task you are writing up a session you have just finished coaching. You were NOT recorded. What you have is the plan you went on court with, the items you ticked off as actually covered, and any note you added.

THE RULES THAT MATTER:
1. Write only from what you are given. Never invent a score, a repetition count, a success rate, a drill, a shot or a moment that is not in the input. If you do not know how something went, do not say.
2. A plan is an intention. Say what was worked on, not how well it went, unless the coach's note says how it went.
3. Anything the coach planned but did NOT tick was not covered. Do not write about it as though it happened — at most, carry it into "nextFocus".
4. The coach's own note is the strongest evidence in the input. Lead the assessment from it where there is one.
5. British English, plain prose, warm and specific. No headers, no bullet characters inside a field. Gloss any jargon a parent would not know.
6. Shorter and true beats longer and padded. A thin session gets a short summary; that is the honest output, not a failure.

Return ONLY valid JSON (no markdown, no commentary) in EXACTLY this shape:
{
  "focus": "the main theme of the session, one short line",
  "assessment": "2-3 sentences: where this player is now and the one thing worth working on next, grounded in what was covered and the coach's note. If the input does not support a judgement, describe the work rather than inventing a diagnosis.",
  "covered": ["3-5 points, each naming what was worked on and why it matters. Where the input gives a cue or a drill, include it. Never add detail the input does not contain."],
  "technique": ["how it was coached, ONLY where the input shows it. Omit entirely otherwise."],
  "takeaways": ["2-3 things for the player to remember"],
  "drills": ["drills actually used, from the input only (omit if none)"],
  "homework": "what to practise before next time (or 'Not set')",
  "nextFocus": "what to work on next session — this is where anything planned but not covered belongs",
  "recap": "2-3 plain sentences for a parent reading in ten seconds: what we worked on, and what happens next.",
  "coachNote": "2-3 sentence warm, specific note to the player",
  "rating": 4
}
"rating" is an integer 1-5 — use the coach's own rating when given, otherwise 3.`

function textOf(res: { content: Array<{ type: string; text?: string }> }): string {
  let t = ''
  for (const b of res.content) if (b.type === 'text' && b.text) t += b.text
  return t
}

function extractJson(txt: string): WriteUp | null {
  const cleaned = txt.replace(/```json\s*/gi, '').replace(/```/g, '').trim()
  const m = cleaned.match(/\{[\s\S]*\}/)
  if (!m) return null
  try { return JSON.parse(m[0]) as WriteUp } catch { return null }
}

/** The coach's account of the session, as the model will read it. */
export function accountOf(i: WriteUpInput): string {
  const lines: string[] = []
  lines.push(`Player: ${i.playerName}`)
  lines.push(`Session: ${[i.sessionType || 'Private', i.durationMin ? `${i.durationMin} minutes` : ''].filter(Boolean).join(' · ')}`)
  if (i.focus) lines.push(`The plan's focus: ${i.focus}`)
  if (i.planned?.length) lines.push(`Planned:\n${i.planned.map(x => `- ${x}`).join('\n')}`)
  lines.push(i.covered?.length
    ? `The coach ticked these as ACTUALLY covered:\n${i.covered.map(x => `- ${x}`).join('\n')}`
    : 'The coach did not tick any individual items — treat the session as having covered the focus above and nothing more specific.')
  if (i.drills?.length) lines.push(`Drills run:\n${i.drills.map(x => `- ${x}`).join('\n')}`)
  if (i.note) lines.push(`The coach's note at the end of the session:\n"${i.note}"`)
  if (typeof i.rating === 'number') lines.push(`The coach rated the session ${i.rating} out of 5.`)
  if (i.last) {
    lines.push(`Last lesson${i.last.date ? ` (${i.last.date})` : ''}: ${[i.last.focus, i.last.summary].filter(Boolean).join(' — ').slice(0, 600) || 'no detail recorded'}${i.last.nextFocus ? `\nWhat was set as the next focus then: ${i.last.nextFocus}` : ''}`)
  }
  return lines.join('\n\n')
}

/**
 * Write up a completed session. Throws when the AI is not configured or cannot
 * produce JSON — the caller still saves the lesson, it just saves it plain,
 * because losing the record of a session that happened is the worse failure.
 */
export async function buildSessionWriteUp(input: WriteUpInput): Promise<WriteUp> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('AI not configured (ANTHROPIC_API_KEY missing).')
  const client = new Anthropic({ apiKey })

  const res = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    temperature: 0.2,
    system: SYSTEM,
    messages: [{ role: 'user', content: `Write up this session.\n\n${accountOf(input)}` }],
  })
  const out = extractJson(textOf(res))
  if (!out) throw new Error('The AI could not write that session up.')
  return out
}

/** The plain-text version stored alongside the structured review. */
export function formatWriteUp(r: WriteUp): string {
  const parts: string[] = []
  if (r.assessment) parts.push(r.assessment)
  if (r.covered?.length) parts.push(`What we covered:\n${r.covered.map(c => `• ${c}`).join('\n')}`)
  if (r.takeaways?.length) parts.push(`Key takeaways:\n${r.takeaways.map(c => `• ${c}`).join('\n')}`)
  if (r.drills?.length) parts.push(`Drills:\n${r.drills.map(c => `• ${c}`).join('\n')}`)
  if (r.homework) parts.push(`Homework: ${r.homework}`)
  if (r.nextFocus) parts.push(`Next session: ${r.nextFocus}`)
  return parts.join('\n\n')
}
