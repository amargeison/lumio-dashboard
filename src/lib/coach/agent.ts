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

export const COACH_AGENT_SYSTEM = `${COACH_AGENT_PERSONA}\n\n${COACH_METHODOLOGY}`

export type CoachAgentResult = { text: string }

// Run a single agent turn. `task` is the instruction block (typically built by
// the *Task helpers in agent-persona.ts). Persona is always the system prompt.
export async function runCoachAgent(opts: {
  apiKey: string
  task: string
  maxTokens?: number
  model?: string
  system?: string
}): Promise<CoachAgentResult> {
  const client = new Anthropic({ apiKey: opts.apiKey })
  const res = await client.messages.create({
    model: opts.model || 'claude-sonnet-4-6',
    max_tokens: opts.maxTokens ?? 900,
    system: opts.system || COACH_AGENT_SYSTEM,
    messages: [{ role: 'user', content: opts.task }],
  })
  let text = ''
  for (const b of res.content) if (b.type === 'text') text += b.text
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
  review_json: { nextFocus?: string; takeaways?: string[]; drills?: string[] } | null
}
type SkillRow = { skill?: string | null; score?: number | null; mastery?: string | null }

// Build a compact "what we know about this player" block from their real
// history. Scoped by the coach's own Supabase session (RLS = coach_id = uid),
// so it only ever sees this coach's data. Returns '' when there's nothing.
export async function buildPlayerContext(
  supabase: SupabaseClient,
  playerName?: string,
): Promise<string> {
  const name = (playerName || '').trim()
  if (!name) return ''
  const parts: string[] = []

  try {
    // The player record (stage, standard, goal, age) if present.
    const { data: players } = await supabase
      .from('coach_players')
      .select('*')
      .ilike('name', name)
      .limit(1)
    const p = players?.[0] as Record<string, unknown> | undefined
    if (p) {
      const bits = [
        p.age ? `age ${p.age}` : '',
        p.racket_stage ? `stage ${p.racket_stage}` : '',
        p.standard ? `standard ${p.standard}` : '',
      ].filter(Boolean).join(', ')
      parts.push(`Player: ${name}${bits ? ` (${bits})` : ''}.`)
      if (p.goal) parts.push(`Current development goal: ${p.goal}.`)
      if (p.notes) parts.push(`Coach notes on file: ${p.notes}.`)
    } else {
      parts.push(`Player: ${name}.`)
    }
  } catch { /* table/columns may vary — skip silently */ }

  try {
    // Recent sessions = the running memory of what's been worked on.
    const { data: sessions } = await supabase
      .from('coach_sessions')
      .select('player_name, session_date, focus, rating, summary, ai_review, review_json')
      .ilike('player_name', name)
      .order('session_date', { ascending: false })
      .limit(5)
    const rows = (sessions || []) as SessionRow[]
    if (rows.length) {
      const lines = rows.map(s => {
        const next = s.review_json?.nextFocus
        const note = (s.ai_review || s.summary || '').replace(/\s+/g, ' ').trim().slice(0, 180)
        return `- ${s.session_date || 'recent'}: focus "${s.focus || 'general'}"${s.rating ? `, rated ${s.rating}/5` : ''}${next ? `, next focus was "${next}"` : ''}${note ? `. ${note}` : ''}`
      })
      parts.push(`Recent session history (most recent first):\n${lines.join('\n')}`)
    }
  } catch { /* skip silently */ }

  try {
    // Skill scores give a snapshot of technical strengths/gaps.
    const { data: skills } = await supabase
      .from('coach_player_skills')
      .select('*')
      .ilike('player_name', name)
      .limit(40)
    const rows = (skills || []) as SkillRow[]
    if (rows.length) {
      const scored = rows.filter(s => s.skill).map(s => `${s.skill} ${s.mastery || (s.score != null ? `${s.score}` : '')}`.trim())
      if (scored.length) parts.push(`Skill snapshot: ${scored.slice(0, 16).join(', ')}.`)
    }
  } catch { /* skip silently */ }

  if (parts.length <= 1) return parts.join('\n')
  return `What you know about this player from their Lumio record:\n${parts.join('\n')}`
}
