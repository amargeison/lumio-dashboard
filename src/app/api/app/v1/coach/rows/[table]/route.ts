import { NextRequest, NextResponse } from 'next/server'
import { coachContext, noStore } from '@/lib/app/coach-context'
import { READABLE, WRITABLE, UUID, REFERENCES, cleanRow, insertStamp, parseFilters, calendarEvent, referencesIn, saveMessage } from '@/lib/app/coach-rows'
import type { CoachCtx } from '@/lib/app/coach-context'
import { POST as confirmBooking } from '@/app/api/coach/bookings/confirm/route'
import { POST as pushCalendar, DELETE as dropCalendar } from '@/app/api/coach/calendar/event/route'
import { POST as pushCamp, DELETE as dropCamp } from '@/app/api/coach/camps/sync/route'

export const runtime = 'nodejs'

// The iPhone app's reads and saves for the coach portal's own tables — the same
// work the website's portal does from the browser (coach-db.ts), with the same
// rules and the same follow-ups. See lib/app/coach-rows.ts for what is allowed.
//
//   GET    /api/app/v1/coach/rows/coach_bookings?booking_date=gte.2026-11-01&order=booking_date.asc
//   POST   /api/app/v1/coach/rows/coach_bookings            { row }        → { row }
//   PATCH  /api/app/v1/coach/rows/coach_bookings?id=<uuid>  { row }        → { row }
//   DELETE /api/app/v1/coach/rows/coach_bookings?id=<uuid>                 → { ok }

type Params = { params: Promise<{ table: string }> }
type Row = Record<string, unknown>

async function open(p: Params, write: boolean) {
  const { table } = await p.params
  if (!(write ? WRITABLE : READABLE).has(table)) {
    return { res: NextResponse.json({ error: write ? 'That can’t be changed from the app.' : 'Unknown table.' }, { status: write ? 403 : 404 }) }
  }
  const c = await coachContext()
  if (!c.ok) return { res: c.res }
  return { table, ctx: c.ctx }
}

const saveError = (message: string) => NextResponse.json({ error: message || 'That was not saved. Please try again.' }, { status: 400 })

/** Every row a save points at (player, booking, group…) must be this academy's. */
async function foreignReference(ctx: CoachCtx, row: Row): Promise<string | null> {
  for (const [col, id] of referencesIn(row)) {
    const ref = REFERENCES[col]
    if (!UUID.test(id)) return ref.what
    const { data } = await ctx.db.from(ref.table).select('id').eq('id', id).eq('coach_id', ctx.seat.academyId).maybeSingle()
    if (!data) return ref.what
  }
  return null
}

export async function GET(req: NextRequest, p: Params) {
  const o = await open(p, false)
  if ('res' in o) return o.res
  const parsed = parseFilters(req.nextUrl.searchParams)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const id = req.nextUrl.searchParams.get('id')
  // Read AS the coach (row level security), and only this academy's rows: a
  // coach at two academies is allowed rows in both.
  let q = o.ctx.db.from(o.table).select('*').eq('coach_id', o.ctx.seat.academyId)
  if (id) {
    if (!UUID.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    q = q.eq('id', id)
  }
  for (const f of parsed.filters) {
    if (f.op === 'in') q = q.in(f.col, f.value as string[])
    else if (f.op === 'is') q = q.is(f.col, null)
    else q = q.filter(f.col, f.op, f.value as string)
  }
  const order = parsed.order ?? { col: 'created_at', asc: false }
  const { data, error } = await q.order(order.col, { ascending: order.asc }).limit(parsed.limit)
  if (error) {
    console.error('[app/rows] list', o.table, error.message)
    return NextResponse.json({ error: 'That could not be loaded. Please try again.' }, { status: 500 })
  }
  return NextResponse.json({ rows: data ?? [] }, noStore)
}

export async function POST(req: NextRequest, p: Params) {
  const o = await open(p, true)
  if ('res' in o) return o.res
  const b = (await req.json().catch(() => null)) as { row?: unknown } | null
  const row = cleanRow(b?.row)
  if (!row) return NextResponse.json({ error: 'Nothing to save.' }, { status: 400 })
  const foreign = await foreignReference(o.ctx, row)
  if (foreign) return NextResponse.json({ error: foreign }, { status: 400 })
  const { data, error } = await o.ctx.db.from(o.table)
    .insert({ ...row, ...insertStamp(o.table, row, o.ctx.seat) }).select().single()
  if (error) { console.error('[app/rows] insert', o.table, error.message); return saveError(saveMessage(o.table, error.message)) }
  await afterSave(req, o.table, data as Row)
  return NextResponse.json({ row: data }, noStore)
}

export async function PATCH(req: NextRequest, p: Params) {
  const o = await open(p, true)
  if ('res' in o) return o.res
  const id = req.nextUrl.searchParams.get('id') || ''
  if (!UUID.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const b = (await req.json().catch(() => null)) as { row?: unknown } | null
  const patch = cleanRow(b?.row)
  if (!patch || !Object.keys(patch).length) return NextResponse.json({ error: 'Nothing to save.' }, { status: 400 })
  const foreign = await foreignReference(o.ctx, patch)
  if (foreign) return NextResponse.json({ error: foreign }, { status: 400 })

  const run = (fields: Row) => o.ctx.db.from(o.table).update(fields)
    .eq('id', id).eq('coach_id', o.ctx.seat.academyId).select().maybeSingle()
  // Stamp updated_at like the portal, and save without it where a table has no
  // such column rather than refuse the whole edit.
  let { data, error } = await run({ ...patch, updated_at: new Date().toISOString() })
  if (error && /updated_at/i.test(error.message)) ({ data, error } = await run(patch))
  if (error) { console.error('[app/rows] update', o.table, error.message); return saveError(saveMessage(o.table, error.message)) }
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await afterSave(req, o.table, data as Row)
  return NextResponse.json({ row: data }, noStore)
}

export async function DELETE(req: NextRequest, p: Params) {
  const o = await open(p, true)
  if ('res' in o) return o.res
  const id = req.nextUrl.searchParams.get('id') || ''
  if (!UUID.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Deleting a booking the family knows about is, to them, a cancellation, and
  // once the row is gone nothing is left to say who to tell. So they are told
  // first; if that fails the delete still goes ahead, as on the website.
  if (o.table === 'coach_bookings') await quietly(confirmBooking(sub(req, '/api/coach/bookings/confirm', 'POST', { bookingId: id, removing: true })))

  const { data, error } = await o.ctx.db.from(o.table).delete()
    .eq('id', id).eq('coach_id', o.ctx.seat.academyId).select('id')
  if (error) { console.error('[app/rows] delete', o.table, error.message); return saveError(error.message) }
  if (!data?.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (o.table === 'coach_bookings') await quietly(dropCalendar(sub(req, `/api/coach/calendar/event?bookingId=${id}`, 'DELETE')))
  if (o.table === 'coach_camps') await quietly(dropCamp(sub(req, `/api/coach/camps/sync?campId=${id}`, 'DELETE')))
  return NextResponse.json({ ok: true }, noStore)
}

// ── After a save: the same follow-ups the portal runs ─────────────────────────
// They never fail the save — the row is already written — and the app is not
// kept waiting for a slow calendar for more than a few seconds.

async function afterSave(req: NextRequest, table: string, row: Row) {
  const jobs: Promise<unknown>[] = []
  if (table === 'coach_bookings' && row?.id) {
    // The server decides what the family is told: first confirmation, moved,
    // cancelled, or nothing for an edit that changes none of those.
    jobs.push(confirmBooking(sub(req, '/api/coach/bookings/confirm', 'POST', { bookingId: row.id })))
    if (row.status === 'cancelled') jobs.push(dropCalendar(sub(req, `/api/coach/calendar/event?bookingId=${row.id}`, 'DELETE')))
    else { const ev = calendarEvent(row); if (ev) jobs.push(pushCalendar(sub(req, '/api/coach/calendar/event', 'POST', ev))) }
  }
  if (table === 'coach_camps' && row?.id && row.start_date) {
    jobs.push(pushCamp(sub(req, '/api/coach/camps/sync', 'POST', { campId: row.id })))
  }
  if (!jobs.length) return
  await Promise.race([Promise.allSettled(jobs), new Promise(r => setTimeout(r, 8000))])
}

async function quietly(p: Promise<unknown>) {
  try { await Promise.race([p, new Promise(r => setTimeout(r, 8000))]) } catch (e) { console.warn('[app/rows] follow-up', e) }
}

/** A request to another of our routes, carrying this one's sign-in and academy. */
function sub(req: NextRequest, path: string, method: string, body?: unknown) {
  const headers = new Headers({ 'content-type': 'application/json' })
  for (const h of ['cookie', 'x-lumio-academy', 'x-forwarded-for', 'x-real-ip', 'user-agent']) {
    const v = req.headers.get(h)
    if (v) headers.set(h, v)
  }
  return new NextRequest(new URL(path, req.url), { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
}
