import { NextRequest, NextResponse } from 'next/server'
import { demoAttendeeByFormToken } from '@/lib/coach/demo-public'
import { createClient } from '@supabase/supabase-js'
import { askedForm, attendeePatch, cleanAnswers, formEnabled } from '@/lib/coach/camp-form'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { tidyRooms, findRoom, roomPatch, roomLocked } from '@/lib/coach/camp-rooms'
import { duePennies, owedPennies } from '@/lib/coach/camp-money'

export const runtime = 'nodejs'

// Saves one attendee's player-information form.
//
// No login: the token in the link is the key, and it opens exactly one row. The
// questions are read from the camp here, on the server — the browser sends
// answers, never the form — so nothing can be written against a question the
// coach is not asking, and a required question cannot be skipped by editing the
// page. Answers that Lumio understands (emergency contact, medical note, photo
// consent, room, arrival, goal) are copied onto the attendee as well.

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers)
  const burst = rateLimit(`camp-form:${ip}`, 20, 10 * 60_000)
  if (!burst.ok) return NextResponse.json({ error: 'Too many attempts — please try again in a few minutes.' }, { status: 429 })

  const body = await req.json().catch(() => ({})) as { token?: unknown; answers?: unknown }
  const token = String(body.token ?? '')
  if (!/^[a-f0-9]{32,80}$/i.test(token)) return NextResponse.json({ error: 'This link does not work.' }, { status: 404 })

  try {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
    const { data: a } = await sb.from('coach_camp_attendees')
      .select('id, camp_id, status, parent_phone, camp_goal, medical_notes, form_answers, paid, paid_pennies, amount_pennies, extra_pennies, extra_label, balance_status').eq('form_token', token).maybeSingle()
    if (!a || a.status === 'cancelled') {
      // A form filled in on one of the DEMO academy's links: thanked, and thrown away.
      if (!a && demoAttendeeByFormToken(token)) return NextResponse.json({ ok: true, demo: true })
      return NextResponse.json({ error: 'This link does not work.' }, { status: 404 })
    }
    const { data: camp } = await sb.from('coach_camps').select('audience, overseas, info_form, start_date, end_date, price, room_options').eq('id', a.camp_id).maybeSingle()
    if (!camp) return NextResponse.json({ error: 'This link does not work.' }, { status: 404 })
    const ended = camp.end_date || camp.start_date
    if (!formEnabled(camp) || (ended && Date.now() > new Date(`${ended}T23:59:59`).getTime() + 14 * 86400000)) {
      return NextResponse.json({ error: 'This form is closed.' }, { status: 410 })
    }

    const form = askedForm(camp)
    const { answers, missing } = cleanAnswers(form, body.answers)
    if (missing.length) return NextResponse.json({ error: 'Some questions still need an answer.', missing }, { status: 400 })

    // Answers already given to questions that are NOT being asked at the moment
    // are kept as they are. The coach may have switched a section off for now
    // ("this camp is abroad" unticked, a question removed and put back); saving
    // the form used to delete those answers, and the family was asked for their
    // flight details all over again. Only questions on today's form are replaced.
    const asked = new Set(form.sections.flatMap(sec => sec.questions.map(q => q.id)))
    const before = (a.form_answers && typeof a.form_answers === 'object' && !Array.isArray(a.form_answers) ? a.form_answers : {}) as Record<string, unknown>
    const kept = Object.fromEntries(Object.entries(before).filter(([id]) => !asked.has(id)))

    // The room, when the coach has priced them: its supplement goes on the place.
    // A place already paid in full, or with its balance being taken right now,
    // keeps its price — the family asks the coach instead.
    let room: Record<string, unknown> = {}
    const roomQ = form.sections.flatMap(sec => sec.questions).find(q => q.key === 'room')
    const rooms = tidyRooms(camp.room_options)
    const picked = roomQ && rooms.length ? findRoom(rooms, answers[roomQ.id]) : null
    if (picked) {
      const share = form.sections.flatMap(sec => sec.questions).find(q => q.key === 'room_share')
      const roomText = [picked.label, share && answers[share.id] ? `with ${answers[share.id]}` : ''].filter(Boolean).join(' · ').slice(0, 160)
      const changes = picked.pennies !== (Number(a.extra_pennies) || 0)
      if (changes && (roomLocked(a) || a.paid || (duePennies(camp, a) > 0 && owedPennies(camp, a) === 0))) {
        return NextResponse.json({ error: 'Your place is already paid, so the room cannot be changed here. Reply to your coach’s email and they will sort it out.', missing: [roomQ!.id] }, { status: 400 })
      }
      room = { ...(picked.label !== a.extra_label || changes ? roomPatch(camp, a, picked) : {}), room: roomText }
    }

    const now = new Date().toISOString()
    const { error } = await sb.from('coach_camp_attendees').update({
      ...attendeePatch(form, answers, a),
      ...room,
      form_answers: { ...kept, ...answers }, form_submitted_at: now, updated_at: now,
    }).eq('id', a.id)
    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[camp/form]', e)
    return NextResponse.json({ error: 'Could not save your answers — please try again.' }, { status: 500 })
  }
}
