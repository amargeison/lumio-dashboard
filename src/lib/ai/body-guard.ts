// ─── Request sanitising for the /api/ai/* passthrough routes ────────────────
//
// These routes forward a browser-supplied body to Anthropic using OUR api key.
// That is fine for a public demo page — it is how the demo gets live copy — but
// only if the body is bounded. Unbounded, the route is a free general-purpose
// LLM for anyone who finds the URL, billed to us.
//
// What matters most is `system`. A caller who controls the system prompt
// controls what the model IS.
//
// An earlier version of this comment claimed no call site sent one. That was
// checked for tennis and then wrongly generalised to every sport: golf and
// cricket send five between them, and rejecting `system` outright would have
// returned 400 to five working features. Hence `presets` — the prompts move to
// the server and the client names one, which keeps the property that the server
// decides what the model is without breaking anything.
//
// Being straight about the limit: user content is still free-form, so this is
// not a wall. What actually bounds abuse is the pinned model, the token ceiling,
// single-turn, no tools by default, the per-IP window and the daily spend cap.
//
// The remaining caps bound the damage rather than prevent use: a pinned model,
// a token ceiling, a message-size ceiling, and web search only when explicitly
// allowed. Together with the per-IP window and the daily spend cap in this
// module, an abuser gets a capped tennis-flavoured completion endpoint instead
// of an uncapped assistant.

export const ALLOWED_MODELS = new Set(['claude-sonnet-4-6'])
export const MAX_OUTPUT_TOKENS = 1500
export const MAX_PROMPT_CHARS = 12000

export type SanitisedBody = {
  model: string
  max_tokens: number
  messages: { role: string; content: string }[]
  system?: string
  tools?: { type: string; name: string; max_uses?: number }[]
}

export class AiBodyError extends Error {
  status: number
  constructor(message: string, status = 400) { super(message); this.status = status }
}

export function sanitizeAiBody(
  raw: unknown,
  opts: { allowWebSearch?: boolean; presets?: Record<string, string> } = {},
): SanitisedBody {
  const b = (raw ?? {}) as Record<string, unknown>

  // The server decides what the model is. Non-negotiable.
  if (b.system != null) {
    throw new AiBodyError('This endpoint does not accept a system prompt. Use a preset.', 400)
  }

  // A named preset resolves to a prompt the SERVER holds.
  let system: string | undefined
  if (b.preset != null) {
    const key = String(b.preset)
    const found = opts.presets?.[key]
    if (!found) throw new AiBodyError('Unknown preset.', 400)
    system = found
  }

  const model = typeof b.model === 'string' && ALLOWED_MODELS.has(b.model)
    ? b.model
    : [...ALLOWED_MODELS][0]

  // Deliberately an error, not a clamp. Clamping would silently hand back a
  // truncated answer with no failure signal — the caller would think it worked.
  const asked = Math.round(Number(b.max_tokens) || 800)
  if (asked > MAX_OUTPUT_TOKENS) {
    throw new AiBodyError(`max_tokens above the ${MAX_OUTPUT_TOKENS} ceiling for this endpoint.`, 400)
  }
  const max_tokens = Math.max(1, asked)

  if (!Array.isArray(b.messages) || b.messages.length === 0) {
    throw new AiBodyError('messages is required.', 400)
  }
  // Single-turn only: the demo never sends a conversation, and allowing one lets
  // a caller smuggle an assistant turn in to steer the model like a system prompt.
  if (b.messages.length > 1) {
    throw new AiBodyError('This endpoint takes a single message.', 400)
  }

  const m = b.messages[0] as Record<string, unknown>
  const content = typeof m?.content === 'string' ? m.content : ''
  if (!content.trim()) throw new AiBodyError('messages[0].content is required.', 400)
  if (content.length > MAX_PROMPT_CHARS) {
    throw new AiBodyError('That request is too long.', 413)
  }
  if (m?.role != null && m.role !== 'user') {
    throw new AiBodyError('Only a user message is accepted.', 400)
  }

  const out: SanitisedBody = { model, max_tokens, messages: [{ role: 'user', content }] }
  if (system) out.system = system

  // Web search is opt-in per route, and only the real search tool. It is the
  // most abusable thing here — it turns the endpoint into a general web agent.
  if (opts.allowWebSearch && Array.isArray(b.tools)) {
    const wanted = (b.tools as Record<string, unknown>[])
      .filter(t => typeof t?.type === 'string' && (t.type as string).startsWith('web_search'))
      .slice(0, 1)
      // max_uses is preserved but bounded — it is the knob that decides how many
      // searches one request can trigger, so it is also the cost knob.
      .map(t => ({
        type: String(t.type), name: 'web_search',
        ...(Number(t.max_uses) > 0 ? { max_uses: Math.min(5, Math.round(Number(t.max_uses))) } : {}),
      }))
    if (wanted.length) out.tools = wanted
  }

  return out
}
