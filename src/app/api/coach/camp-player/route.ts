import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

import { sessionCoachId, serviceClient } from '@/lib/coach/oauth'
import { COACH_AGENT_PERSONA, COACH_METHODOLOGY, COACH_DIAGNOSTIC_STANDARD } from '@/lib/coach/agent-persona'

export const maxDuration = 120

// Per-player camp work, by Lumio Coach. Two modes on one route because both need
// exactly the same context — the camp plan plus everything we already know about
// the player — and splitting them would mean gathering it twice.
//
//   mode 'targets' — before the camp: what should THIS player, at THIS racket
//                    stage, get out of it. Sixteen players on one plan is a
//                    timetable; sixteen players with their own targets is coaching.
//   mode 'report'  — after the camp: what moved, what is next. Written to the
//                    diagnostic standard, so it reads like the lesson summaries
//                    the parent already receives rather than a certificate.
//
// The player context is real data the coach already holds — racket stage, mastered
// skills, recent session focus. That is the part no rival can copy.

const TARGETS_SHAPE = `Return ONLY valid JSON (no markdown):
{ "players": [ { "player_name": "...", "stage": "...", "goals": ["2-3 targets specific to THIS player at THIS stage"], "measure": "one observable thing that proves they got there" } ] }
- Goals must differ meaningfully between players of different stages. If two players are at the same stage, differentiate on their recent work.
- No goal may be generic enough to apply to any player at any camp.`

const REPORT_SHAPE = `Return ONLY valid JSON (no markdown):
{ "headline": "one sentence — the single most useful thing this player takes away",
  "assessment": "2-3 sentences: how the week went, leading with your judgement not the chronology",
  "progress": ["2-4 things that measurably moved"],
  "nextSteps": ["2-3 specific things to work on next"],
  "homework": "one concrete thing to do before the next session",
  "coachNote": "one warm, personal line to the player" }
- A parent will read this. Warm, specific, honest — never flattery.`

export async function POST(req: NextRequest) {
  const coachId = await sessionCoachId()
  if (!coachId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const b = (await req.json().catch(() => ({}))) as { campId?: string; mode?: 'targets' | 'report'; playerName?: string }
  const mode = b.mode === 'report' ? 'report' : 'targets'
  if (!b.campId) return NextResponse.json({ error: 'campId is required' }, { status: 400 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'AI not configured (ANTHROPIC_API_KEY missing).' }, { status: 500 })

  try {
    const db = serviceClient()
    const { data: camp } = await db.from('coach_camps').select('*').eq('id', b.campId).eq('coach_id', coachId).maybeSingle()
    if (!camp) return NextResponse.json({ error: 'Camp not found' }, { status: 404 })

    const { data: attendees } = await db.from('coach_camp_attendees').select('player_name, player_id').eq('camp_id', b.campId)
    let roster = (attendees ?? []) as { player_name: string; player_id?: string | null }[]
    if (mode === 'report') roster = roster.filter(a => a.player_name === b.playerName)
    if (!roster.length) return NextResponse.json({ error: mode === 'report' ? 'Player not on this camp' : 'No attendees on this camp yet' }, { status: 400 })

    // Everything the coach already knows about these players.
    const names = roster.map(r => r.player_name)
    const [{ data: players }, { data: sessions }] = await Promise.all([
      db.from('coach_players').select('name, age, racket_stage, goal, category').eq('coach_id', coachId).in('name', names),
      db.from('coach_sessions').select('player_name, session_date, focus, summary, review_json')
        .eq('coach_id', coachId).in('player_name', names).order('session_date', { ascending: false }).limit(40),
    ]) as any

    const ctx = roster.map(r => {
      const p = (players ?? []).find((x: any) => x.name === r.player_name)
      const recent = (sessions ?? []).filter((s: any) => s.player_name === r.player_name).slice(0, 3)
      return [
        `PLAYER: ${r.player_name}`,
        p?.racket_stage ? `  Racket stage: ${p.racket_stage}` : '  Racket stage: unknown',
        p?.age ? `  Age: ${p.age}` : '',
        p?.goal ? `  Their stated goal: ${p.goal}` : '',
        recent.length ? `  Recent sessions:\n${recent.map((s: any) => `    - ${s.session_date || ''}: ${s.focus || ''}${s.review_json?.nextFocus ? ` (next focus was: ${s.review_json.nextFocus})` : ''}`).join('\n')}` : '  No session history yet.',
      ].filter(Boolean).join('\n')
    }).join('\n\n')

    const campCtx = [
      `Camp: ${camp.name}`,
      `Length: ${(camp.itinerary || []).length || '?'} days`,
      camp.ages ? `Ages: ${camp.ages}` : '',
      camp.intent ? `What the coach wants them to leave with: ${camp.intent}` : '',
      camp.daily_rhythm ? `Daily rhythm: ${camp.daily_rhythm}` : '',
      (camp.objectives || []).length ? `Camp objectives:\n${(camp.objectives || []).map((o: string) => `  - ${o}`).join('\n')}` : '',
      (camp.itinerary || []).length ? `Itinerary themes: ${(camp.itinerary || []).map((d: any) => `D${d.day} ${d.theme || d.focus || ''}`).join(' · ')}` : '',
    ].filter(Boolean).join('\n')

    const client = new Anthropic({ apiKey })
    const res = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: mode === 'report' ? 1600 : 4000,
      temperature: 0.4,
      system: `${COACH_AGENT_PERSONA}\n\n${COACH_METHODOLOGY}\n\n${COACH_DIAGNOSTIC_STANDARD}\n\n${mode === 'report' ? REPORT_SHAPE : TARGETS_SHAPE}`,
      messages: [{
        role: 'user',
        content: mode === 'report'
          ? `Write the end-of-camp report for ${b.playerName}.\n\n${campCtx}\n\n${ctx}`
          : `Set individual camp targets for each player below.\n\n${campCtx}\n\n${ctx}\n\nReturn one entry per player, ${roster.length} in total.`,
      }],
    })

    let txt = ''
    for (const c of res.content) if (c.type === 'text') txt += c.text
    const m = txt.replace(/```json\s*/gi, '').replace(/```/g, '').trim().match(/\{[\s\S]*\}/)
    if (!m) return NextResponse.json({ error: 'The AI could not produce that.' }, { status: 502 })
    const out = JSON.parse(m[0])

    // Targets are persisted (they are camp-wide and reused); reports are returned
    // for printing without being stored, because a coach may regenerate one until
    // it reads right and we do not want half-drafts saved against a player.
    if (mode === 'targets' && Array.isArray(out.players)) {
      await db.from('coach_camps').update({ player_targets: out.players }).eq('id', b.campId).eq('coach_id', coachId)
    }
    return NextResponse.json(out)
  } catch (e) {
    console.error('[coach/camp-player]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}
