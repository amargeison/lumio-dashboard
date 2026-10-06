import { NextRequest, NextResponse } from 'next/server'
import { isAcademyUser, notAnAcademy } from '@/lib/coach/academy-guard'
import { campAudience, audienceBrief } from '@/lib/coach/camp-audience'

import { serviceClient } from '@/lib/coach/oauth'
import { coachGate } from '@/lib/coach/membership'
import { COACH_METHODOLOGY, COACH_DIAGNOSTIC_STANDARD } from '@/lib/coach/agent-persona'
import { runCoachAgent } from '@/lib/coach/agent'

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
{ "players": [ { "ref": "the player's REF exactly as given, e.g. P1", "player_name": "...", "stage": "...", "goals": ["2-3 targets specific to THIS player at THIS stage"], "measure": "one observable thing that proves they got there" } ] }
- Goals must differ meaningfully between players of different stages. If two players are at the same stage, differentiate on their recent work.
- No goal may be generic enough to apply to any player at any camp.`

const reportShape = (adultCamp: boolean) => `Return ONLY valid JSON (no markdown):
{ "headline": "one sentence — the single most useful thing this player takes away",
  "assessment": "2-3 sentences: how the week went, leading with your judgement not the chronology",
  "progress": ["2-4 things that measurably moved"],
  "nextSteps": ["2-3 specific things to work on next"],
  "homework": "one concrete thing to do before the next session",
  "coachNote": "one warm, personal line to the player" }
- ${adultCamp ? 'The player reads this themselves — write to them as "you".' : 'A parent will read this.'} Warm, specific, honest — never flattery.`

export async function POST(req: NextRequest) {
  // The academy in the portal's address, and only its head coach (see coachGate):
  // a coach who also helps at another academy must not act on their own club
  // from inside the other one's portal.
  const seat = await coachGate({ headOnly: true })
  if (!seat.ok) return NextResponse.json({ error: seat.error }, { status: seat.status })
  const coachId = seat.seat.academyId
  // A demo account is signed in too. Only a real academy may use this.
  if (!await isAcademyUser(coachId)) return notAnAcademy()

  const b = (await req.json().catch(() => ({}))) as { campId?: string; mode?: 'targets' | 'report'; playerName?: string }
  const mode = b.mode === 'report' ? 'report' : 'targets'
  if (!b.campId) return NextResponse.json({ error: 'campId is required' }, { status: 400 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'AI not configured (ANTHROPIC_API_KEY missing).' }, { status: 500 })

  try {
    const db = serviceClient()
    const { data: camp } = await db.from('coach_camps').select('*').eq('id', b.campId).eq('coach_id', coachId).maybeSingle()
    if (!camp) return NextResponse.json({ error: 'Camp not found' }, { status: 404 })

    const { data: attendees } = await db.from('coach_camp_attendees').select('id, player_name, player_id, status, source').eq('camp_id', b.campId).order('created_at', { ascending: true })
    let roster = ((attendees ?? []) as { id: string; player_name: string; player_id?: string | null; status?: string | null; source?: string | null }[])
      .filter(a => (a.status || '') !== 'cancelled')
    if (mode === 'report') roster = roster.filter(a => a.player_name === b.playerName)
    if (!roster.length) return NextResponse.json({ error: mode === 'report' ? 'Player not on this camp' : 'No attendees on this camp yet' }, { status: 400 })

    // Everything the coach already knows about these players.
    const names = roster.map(r => r.player_name)
    const [{ data: players }, { data: sessions }] = await Promise.all([
      db.from('coach_players').select('id, name, age, racket_stage, goal, category').eq('coach_id', coachId).in('name', names),
      db.from('coach_sessions').select('player_name, session_date, focus, summary, review_json')
        .eq('coach_id', coachId).in('player_name', names).order('session_date', { ascending: false }).limit(40),
    ]) as any

    // Each player is handed to Lumio Coach with a short REF and asked for it
    // back, because a name does not say WHICH player: two children on one camp
    // can share one. The targets are then stored against the attendee and the
    // roster player, not against the name.
    const ctx = roster.map((r, i) => {
      // The roster record this place is tied to, where there is one; a name is
      // only trusted when it is the only player of that name.
      // A place made on the public sign-up page and not yet matched to a player
      // is NOT the roster player of the same name (the email did not match), so
      // it gets none of that player's record or lesson history.
      const stranger = !r.player_id && r.source === 'signup'
      const sameName = (players ?? []).filter((x: any) => x.name === r.player_name)
      const p = stranger ? undefined : (players ?? []).find((x: any) => r.player_id && x.id === r.player_id) || (sameName.length === 1 ? sameName[0] : undefined)
      const recent = stranger ? [] : (sessions ?? []).filter((s: any) => s.player_name === r.player_name).slice(0, 3)
      return [
        `PLAYER: ${r.player_name}`,
        `  REF: P${i + 1}`,
        p?.racket_stage ? `  Racket stage: ${p.racket_stage}` : '  Racket stage: unknown',
        p?.age ? `  Age: ${p.age}` : '',
        p?.goal ? `  Their stated goal: ${p.goal}` : '',
        recent.length ? `  Recent sessions:\n${recent.map((s: any) => `    - ${s.session_date || ''}: ${s.focus || ''}${s.review_json?.nextFocus ? ` (next focus was: ${s.review_json.nextFocus})` : ''}`).join('\n')}` : '  No session history yet.',
      ].filter(Boolean).join('\n')
    }).join('\n\n')

    const campCtx = [
      `Camp: ${camp.name}`,
      `Length: ${(camp.itinerary || []).length || '?'} days`,
      audienceBrief(camp),
      camp.intent ? `What the coach wants them to leave with: ${camp.intent}` : '',
      camp.daily_rhythm ? `Daily rhythm: ${camp.daily_rhythm}` : '',
      (camp.objectives || []).length ? `Camp objectives:\n${(camp.objectives || []).map((o: string) => `  - ${o}`).join('\n')}` : '',
      (camp.itinerary || []).length ? `Itinerary themes: ${(camp.itinerary || []).map((d: any) => `D${d.day} ${d.theme || d.focus || ''}`).join(' · ')}` : '',
    ].filter(Boolean).join('\n')

    // Shared agent: persona + methodology come from one place.
    const { text: txt } = await runCoachAgent({
      apiKey,
      extraSystem: `${COACH_METHODOLOGY}\n\n${COACH_DIAGNOSTIC_STANDARD}\n\n${mode === 'report' ? reportShape(campAudience(camp) === 'adult') : TARGETS_SHAPE}`,
      maxTokens: mode === 'report' ? 1600 : 4000,
      temperature: 0.4,
      task: mode === 'report'
        ? `Write the end-of-camp report for ${b.playerName}.\n\n${campCtx}\n\n${ctx}`
        : `Set individual camp targets for each player below.\n\n${campCtx}\n\n${ctx}\n\nReturn one entry per player, ${roster.length} in total.`,
    })

    const m = txt.replace(/```json\s*/gi, '').replace(/```/g, '').trim().match(/\{[\s\S]*\}/)
    // A reply that is not the shape asked for is a failed attempt, never a
    // result: nothing is saved over the targets already there, and nothing
    // half-empty is handed to the printer.
    const failed = mode === 'report'
      ? 'Lumio Coach could not write that report. Try again.'
      : 'Lumio Coach could not set the targets. Nothing has been changed — try again.'
    if (!m) return NextResponse.json({ error: failed }, { status: 502 })
    let out: any
    try { out = JSON.parse(m[0]) } catch { return NextResponse.json({ error: failed }, { status: 502 }) }

    if (mode === 'report') {
      const said = [out?.headline, out?.assessment, out?.coachNote].some(x => typeof x === 'string' && x.trim())
        || [out?.progress, out?.nextSteps].some(x => Array.isArray(x) && x.length)
      if (!said) return NextResponse.json({ error: failed }, { status: 502 })
      return NextResponse.json(out)
    }

    // Targets are persisted (they are camp-wide and reused); reports are returned
    // for printing without being stored, because a coach may regenerate one until
    // it reads right and we do not want half-drafts saved against a player.
    const rows = (Array.isArray(out?.players) ? out.players : [])
      .filter((t: any) => t && typeof t === 'object' && Array.isArray(t.goals) && t.goals.some((g: unknown) => String(g ?? '').trim()))
    if (!rows.length) return NextResponse.json({ error: failed }, { status: 502 })

    const named = (n: unknown) => roster.filter(r => r.player_name.trim().toLowerCase() === String(n ?? '').trim().toLowerCase())
    const players_out = rows.map((t: any) => {
      // By REF first; by name only when exactly one attendee has that name.
      const i = /^P(\d+)$/i.exec(String(t.ref ?? '').trim())
      const who = (i && roster[Number(i[1]) - 1]) || (named(t.player_name).length === 1 ? named(t.player_name)[0] : null)
      const rest = { ...t }
      delete rest.ref
      return who
        ? { ...rest, player_name: who.player_name, attendee_id: who.id, player_id: who.player_id || null }
        : rest
    })
    await db.from('coach_camps').update({ player_targets: players_out }).eq('id', b.campId).eq('coach_id', coachId)
    return NextResponse.json({ players: players_out })
  } catch (e) {
    console.error('[coach/camp-player]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}
