# Lumio Coach agent — architecture spec

## The problem you raised

> "Have we built an agent? Or does it just run a query every time?"

Before this change: **it ran a query every time.** Each AI feature
(`session-draft`, `ai-review`, recording summary, message draft) fired its own
one-shot LLM call with its own ad-hoc prompt and no shared identity. Result:
inconsistent voice, and no memory of the player from one call to the next.

## What "an agent that learns" actually means here

There are two ways to make an AI "get better over time":

1. **Fine-tuning / retraining** the model weights. Expensive, slow, needs a large
   labelled dataset, and you'd retrain on a schedule — not practical or necessary
   for a solo-built product, and it can't react to *today's* lesson.
2. **Retrieval / context** — give the same model the player's accumulated record
   on every call. The model "knows" the player because you hand it their history
   each time. This is how modern production agents "remember", and it's what we've
   built.

We use **(2)**. The agent improves as the player's record grows, with zero
retraining, and it's per-player and per-tenant safe (RLS).

## The architecture

```
                ┌─────────────────────────────┐
                │  agent-persona.ts (strings)  │  ← one persona, client + server safe
                │  COACH_AGENT_PERSONA         │
                │  COACH_METHODOLOGY           │
                │  sessionPlanTask / review…   │
                └──────────────┬───────────────┘
                               │ imported by
        ┌──────────────────────┼───────────────────────────┐
        │ server                                            │ client
        ▼                                                   ▼
  agent.ts (server)                              LiveCoachSendMessage.tsx
  ├─ runCoachAgent()  ── persona = system        SendMessage.tsx
  ├─ buildPlayerContext() ── reads the player's    └─ pass `system: COACH_AGENT_PERSONA`
  │     real history from coach_* tables               to /api/ai/tennis (proxy forwards it)
  └─ extractJson()
        ▲
        │ used by
   session-draft/route.ts, ai-review/route.ts
   (media/process prepends the persona to its Master-Coach + QA passes)
```

### The single entry point — `runCoachAgent()`

Every server AI route calls this. It always sends `COACH_AGENT_SYSTEM`
(persona + methodology) as the `system` prompt, so the coach is identical
everywhere. Callers only supply the task block.

### The "memory" — `buildPlayerContext()`

Given a player name (scoped to the coach by Supabase RLS), it assembles a compact
block from the player's real record:

- **`coach_players`** — stage, standard, age, current goal, notes.
- **`coach_sessions`** — the last ~5 sessions: focus, rating, the AI review, and
  the `nextFocus` that was set. *This is the running memory of what's been worked
  on.*
- **`coach_player_skills`** — a skill snapshot (strengths / gaps).

That block is prepended to the task, so a session plan or review explicitly builds
on the previous session's "next focus". The more the coach uses Lumio with a
player, the more context the agent has.

### About `.md` files (your question)

`.md` is the right home for the **static methodology/persona** (version-controlled,
human-editable → `docs/coach-agent.md`), but it is **not** the right home for
**per-player memory**. Per-player history must live in the database because it's
queryable, per-tenant secured by RLS, and updated continuously. So: methodology in
`.md`, the shipped persona mirrored as a TS constant (bundling reliability), and
learning/memory in the `coach_*` tables. No per-player `.md` files needed.

## Do other areas need this?

Yes — the same persona is now wired into session-draft, ai-review, the recording
summary, and both message wizards. Any **new** AI feature should call
`runCoachAgent` (server) or pass `system: COACH_AGENT_PERSONA` (client → proxy).
That's the rule that keeps "everything, always" consistent.

## Optional next step — explicit per-player memory table

Today the "memory" is derived live from `coach_sessions`. If you want the agent to
accumulate distilled, durable notes (e.g. "tends to rush the toss when nervous",
"responds well to target games"), add a small `coach_player_memory` table and have
the recording-summary pass append a one-line insight after each session. The
context builder would then read those notes too. This is a clean follow-up, not
required for consistency — flagged here so it's on the roadmap.
