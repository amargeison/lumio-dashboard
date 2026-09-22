import { NextRequest, NextResponse } from 'next/server'
import { sessionCoachId, serviceClient } from '@/lib/coach/oauth'
import { buildSessionWriteUp, formatWriteUp } from '@/lib/coach/lesson-writeup'

export const maxDuration = 120

// "Session done" → a real lesson summary.
//
// Ticking a session off used to insert a row with a date, the plan's focus and
// nothing else. The coach then had a Lesson Summaries page full of stubs, the
// family had a page that said a lesson happened and not what was in it, and the
// only way to get a proper write-up was to have remembered to record the hour.
//
// Now the plan and the ticks go to Lumio Coach and come back as the same
// structured summary a recording produces — assessment, what was covered,
// takeaways, homework, next focus — so the write-up exists for every session,
// not just the recorded ones. If the AI is unavailable the lesson is STILL
// saved, plainly: losing the record of a session that happened is worse than
// losing the prose about it.

export async function POST(req: NextRequest) {
  const coachId = await sessionCoachId()
  if (!coachId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const b = (await req.json().catch(() => ({}))) as {
    planId?: string; covered?: string[]; drills?: string[]; note?: string; rating?: number; writeUp?: boolean
  }
  if (!b.planId) return NextResponse.json({ error: 'planId is required' }, { status: 400 })

  const db = serviceClient()
  const { data: plan } = await db.from('coach_session_plans').select('*')
    .eq('id', b.planId).eq('coach_id', coachId).maybeSingle()
  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

  const playerName = String(plan.group_name || plan.title || '').trim()
  const when = String(plan.session_date || '').slice(0, 10) || new Date().toISOString().slice(0, 10)

  // The player, by id where we can — a name is not an identity, and a summary
  // filed against the wrong duplicate profile is invisible to the family.
  let playerId: string | null = null
  if (playerName) {
    const { data: p } = await db.from('coach_players')
      .select('id').eq('coach_id', coachId).ilike('name', playerName).limit(1)
    playerId = (p as any)?.[0]?.id ?? null
  }

  // The previous lesson, so the write-up can say what has moved rather than
  // describing this hour in isolation.
  const { data: prev } = await db.from('coach_sessions')
    .select('session_date, focus, summary, review_json')
    .eq('coach_id', coachId).ilike('player_name', playerName || '%')
    .order('session_date', { ascending: false }).limit(1)
  const last = (prev as any)?.[0] || null

  const covered = (b.covered || []).map(s => String(s).trim()).filter(Boolean).slice(0, 12)
  const drills = (b.drills || []).map(s => String(s).trim()).filter(Boolean).slice(0, 12)
  const note = String(b.note || '').trim().slice(0, 2000)
  const rating = typeof b.rating === 'number' && b.rating >= 1 && b.rating <= 5 ? Math.round(b.rating) : null

  let review: Record<string, unknown> | null = null
  let aiReview = ''
  let aiError: string | null = null
  if (b.writeUp !== false) {
    try {
      const out = await buildSessionWriteUp({
        playerName: playerName || 'this player',
        focus: plan.focus,
        sessionType: plan.session_type,
        durationMin: plan.duration_min,
        planned: String(plan.focus_points || '').split('\n').filter(Boolean),
        covered,
        drills,
        note,
        rating,
        last: last ? {
          date: last.session_date, focus: last.focus, summary: last.summary,
          nextFocus: last.review_json?.nextFocus ?? null,
        } : null,
      })
      review = { ...out, source: 'session-complete' }
      aiReview = formatWriteUp(out)
    } catch (e) {
      // Not fatal. The lesson is still recorded; the coach is told why it is bare.
      aiError = e instanceof Error ? e.message : 'Lumio Coach could not write that up'
      console.error('[coach/session-complete] write-up failed', e)
    }
  }

  const { data: session, error } = await db.from('coach_sessions').insert({
    coach_id: coachId,
    player_id: playerId,
    player_name: playerName || 'Session',
    session_date: when,
    focus: (review?.focus as string) || plan.focus || plan.title || 'Session',
    rating: rating ?? (typeof review?.rating === 'number' ? review.rating : null),
    summary: note || String(plan.notes || ''),
    ai_review: aiReview,
    review_json: review,
  }).select('id').single()
  if (error) {
    console.error('[coach/session-complete] insert', error.message)
    return NextResponse.json({ error: 'Could not save that lesson.' }, { status: 500 })
  }

  // They were there — attendance is the same fact as the session happening.
  if (playerId) {
    try {
      const { data: ex } = await db.from('coach_attendance')
        .select('id').eq('coach_id', coachId).eq('player_id', playerId).eq('session_date', when).limit(1)
      if (!(ex as any)?.length) {
        await db.from('coach_attendance').insert({ coach_id: coachId, player_id: playerId, session_date: when, present: true })
      }
    } catch (e) { console.warn('[coach/session-complete] attendance', e) }
  }

  // The plan has been run. Marked rather than deleted, so the run-sheet is still
  // there to look back at — and so it stops appearing as an upcoming session.
  try {
    await db.from('coach_session_plans').update({ completed_at: new Date().toISOString() }).eq('id', plan.id)
  } catch { /* the column may not exist on an older database */ }

  return NextResponse.json({ ok: true, sessionId: session.id, written: !!review, aiError })
}
