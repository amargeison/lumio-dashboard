// ─────────────────────────────────────────────────────────────────────────────
// Lumio Coach — server-side agent runner.
//
// One entry point (runCoachAgent) that every server AI route calls, so the
// persona/system prompt is identical across the product. buildPlayerContext
// turns the player's real history (past sessions, skills, effort) into a compact
// context block — this is how the agent "learns": it is given the player's
// accumulated record on every call (retrieval), rather than being retrained.
//
// Pairs with the client-safe persona in src/lib/coach/agent-persona.ts.
// ─────────────────────────────────────────────────────────────────────────────

import Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'
import { COACH_AGENT_PERSONA, COACH_METHODOLOGY } from './agent-persona'
import { sharedLessonText } from './lesson-recap'

export const COACH_AGENT_SYSTEM = `${COACH_AGENT_PERSONA}\n\n${COACH_METHODOLOGY}`

export type CoachAgentResult = { text: string }

// Exactly one of these, never both.
//
// `task` is the ordinary case: an instruction block built by one of the *Task
// helpers in agent-persona.ts. `content` is for when a coach has uploaded a
// file — a PDF, a spreadsheet, a screenshot — and the model has to read it
// rather than a string. A union rather than two optional fields, so passing
// neither, or both, is a compile error instead of a confusing runtime one.
type AgentInput =
  | { task: string; content?: never }
  | { content: unknown[]; task?: never }

// Run a single agent turn. `task` is the instruction block (typically built by
// the *Task helpers in agent-persona.ts). Persona is always the system prompt.
export async function runCoachAgent(opts: {
  apiKey: string
  maxTokens?: number
  model?: string
  temperature?: number
  // Appended AFTER the persona and methodology — the way to add a task-specific
  // standard (how to design a camp, how to write an announcement) without being
  // able to drop the base. Prefer this to `system`.
  extraSystem?: string
  // Full override. Only for a caller that genuinely is not Lumio Coach; using it
  // to add a standard is how the voice drifted in the first place.
  system?: string
} & AgentInput): Promise<CoachAgentResult> {
  const client = new Anthropic({ apiKey: opts.apiKey })
  const system = buildSystem(opts)
  const res = await client.messages.create({
    model: opts.model || 'claude-sonnet-4-6',
    max_tokens: opts.maxTokens ?? 900,
    ...(opts.temperature != null ? { temperature: opts.temperature } : {}),
    system,
    messages: [{ role: 'user', content: (opts.content ?? opts.task) as never }],
  })
  let text = ''
  for (const b of res.content) if (b.type === 'text') text += b.text
  return { text: text.trim() }
}

// The persona is assembled in exactly one place. Both runners call this, so a
// streaming route cannot quietly end up with a different Boris to a blocking one.
function buildSystem(opts: { system?: string; extraSystem?: string }): string {
  return opts.system
    || (opts.extraSystem ? `${COACH_AGENT_SYSTEM}\n\n${opts.extraSystem}` : COACH_AGENT_SYSTEM)
}

/**
 * The same agent, streamed.
 *
 * Needed for the long jobs — designing an eight-day camp is six or seven
 * thousand output tokens, which is well over a minute of silence on a blocking
 * request. nginx gives up on an idle upstream at sixty seconds and Cloudflare at
 * a hundred, so the camp designer was reliably dying on longer camps while
 * shorter ones squeaked through. Streaming keeps bytes moving, which defeats
 * both, and it lets the coach watch the days appear instead of a spinner.
 *
 * `onText` receives the full text so far, not the delta — callers want to look
 * at what has been produced, not reassemble it.
 */
export async function runCoachAgentStream(opts: {
  apiKey: string
  task: string
  maxTokens?: number
  model?: string
  temperature?: number
  extraSystem?: string
  system?: string
  onText?: (fullTextSoFar: string) => void
}): Promise<CoachAgentResult> {
  const client = new Anthropic({ apiKey: opts.apiKey })
  let text = ''
  const stream = client.messages.stream({
    model: opts.model || 'claude-sonnet-4-6',
    max_tokens: opts.maxTokens ?? 900,
    ...(opts.temperature != null ? { temperature: opts.temperature } : {}),
    system: buildSystem(opts),
    messages: [{ role: 'user', content: opts.task }],
  })
  stream.on('text', t => { text += t; opts.onText?.(text) })
  await stream.finalMessage()
  return { text: text.trim() }
}

// Pull the first JSON object out of a model response (drills/focus payloads).
export function extractJson<T = unknown>(text: string, fallback: T): T {
  const m = text.match(/\{[\s\S]*\}/)
  if (!m) return fallback
  try { return JSON.parse(m[0]) as T } catch { return fallback }
}

type SessionRow = {
  player_name: string | null; session_date: string | null; focus: string | null
  rating: number | null; summary: string | null; ai_review: string | null
  review_json: { nextFocus?: string; takeaways?: string[]; drills?: string[]; coachNote?: string } | null
}
type SkillRow = { skill?: string | null; score?: number | null; mastery?: string | null }

// Build a compact "what we know about this player" block from their real
// history. Scoped by the coach's own Supabase session (RLS = coach_id = uid),
// so it only ever sees this coach's data. Returns '' when there's nothing.
//
// Pass `playerId` whenever the caller has it. A name is not an identity: with
// three players called "Sven Tester17" the first row back used to be taken, so
// the model was briefed on a twelve-year-old's record while writing targets for
// a forty-four-year-old. With only a name, the record is used when exactly ONE
// player has that name; otherwise the model is told the name and nothing else —
// no history is better than somebody else's.
export async function buildPlayerContext(
  supabase: SupabaseClient,
  playerName?: string,
  playerId?: string | null,
): Promise<string> {
  const name = (playerName || '').trim()
  if (!name && !playerId) return ''
  const parts: string[] = []
  let id: string | null = null
  // Does this name belong to one player only? Decides whether rows that carry a
  // name and no id (written before ids existed) may be read as theirs.
  let nameIsUnique = false

  try {
    // The player record (stage, standard, goal, age) if present.
    const { data: named } = name
      ? await supabase.from('coach_players').select('*').ilike('name', name.replace(/[\\%_]/g, m => `\\${m}`)).limit(20)
      : { data: null }
    const namesakes = ((named || []) as Record<string, unknown>[])
      .filter(r => String(r.name || '').trim().toLowerCase() === name.toLowerCase())
    nameIsUnique = namesakes.length === 1
    let p: Record<string, unknown> | undefined
    if (playerId) {
      p = namesakes.find(r => r.id === playerId)
      if (!p) {
        const { data: byId } = await supabase.from('coach_players').select('*').eq('id', playerId).limit(1)
        p = byId?.[0] as Record<string, unknown> | undefined
      }
    } else if (nameIsUnique) {
      p = namesakes[0]
    }
    if (p) {
      id = String(p.id)
      const bits = [
        p.age ? `age ${p.age}` : '',
        p.racket_stage ? `stage ${p.racket_stage}` : '',
        p.standard ? `standard ${p.standard}` : '',
      ].filter(Boolean).join(', ')
      parts.push(`Player: ${name || p.name}${bits ? ` (${bits})` : ''}.`)
      if (p.goal) parts.push(`Current development goal: ${p.goal}.`)
      // NOT the roster note (coach_players.notes). It is the coach's own, and
      // everything this context feeds — a session plan, a lesson write-up,
      // targets, a welcome pack — is read by the family. It used to go in with
      // an instruction not to repeat it; an instruction is not a guarantee, so
      // the note is no longer sent at all.
    } else {
      parts.push(`Player: ${name}.`)
    }
  } catch { /* table/columns may vary — skip silently */ }

  try {
    // Recent sessions = the running memory of what's been worked on. Theirs by
    // id; plus name-only rows, but only when the name is nobody else's.
    const cols = 'id, player_name, session_date, focus, rating, summary, ai_review, review_json'
    const [{ data: mine }, { data: old }] = await Promise.all([
      id
        ? supabase.from('coach_sessions').select(cols).eq('player_id', id).order('session_date', { ascending: false }).limit(5)
        : Promise.resolve({ data: null }),
      name && nameIsUnique
        ? supabase.from('coach_sessions').select(cols).is('player_id', null).ilike('player_name', name.replace(/[\\%_]/g, m => `\\${m}`)).order('session_date', { ascending: false }).limit(5)
        : Promise.resolve({ data: null }),
    ])
    const rows = ([...(mine || []), ...(old || [])] as (SessionRow & { id?: string })[])
      .sort((a, b) => String(b.session_date || '').localeCompare(String(a.session_date || '')))
      .slice(0, 5)
    if (rows.length) {
      const lines = rows.map(s => {
        const next = s.review_json?.nextFocus
        // What this context feeds is often read by the family (a review, targets,
        // a welcome pack), so a lesson's text goes in without the coach's private
        // note — older rows carry it inside these two columns.
        const shared = sharedLessonText(s)
        const note = (shared.aiReview || shared.summary).replace(/\s+/g, ' ').trim().slice(0, 180)
        return `- ${s.session_date || 'recent'}: focus "${s.focus || 'general'}"${s.rating ? `, rated ${s.rating}/5` : ''}${next ? `, next focus was "${next}"` : ''}${note ? `. ${note}` : ''}`
      })
      parts.push(`Recent session history (most recent first):\n${lines.join('\n')}`)
    }
  } catch { /* skip silently */ }

  try {
    // Skill scores give a snapshot of technical strengths/gaps. They hang off
    // the player's id — there is no name on a skill row to match.
    const { data: skills } = id
      ? await supabase.from('coach_player_skills').select('*').eq('player_id', id).limit(40)
      : { data: null }
    const rows = (skills || []) as SkillRow[]
    if (rows.length) {
      const scored = rows.filter(s => s.skill).map(s => `${s.skill} ${s.mastery || (s.score != null ? `${s.score}` : '')}`.trim())
      if (scored.length) parts.push(`Skill snapshot: ${scored.slice(0, 16).join(', ')}.`)
    }
  } catch { /* skip silently */ }

  if (parts.length <= 1) return parts.join('\n')
  return `What you know about this player from their Lumio record:\n${parts.join('\n')}`
}
