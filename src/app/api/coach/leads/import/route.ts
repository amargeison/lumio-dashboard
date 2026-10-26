import { NextRequest, NextResponse } from 'next/server'
import { isAcademyUser, notAnAcademy } from '@/lib/coach/academy-guard'
import { coachGate } from '@/lib/coach/membership'
import { serviceClient } from '@/lib/coach/oauth'
import { cleanImportRow, IMPORT_MAX } from '@/lib/coach/leads'

export const runtime = 'nodejs'

// Bringing a spreadsheet of leads in, in one go. The browser reads the file and
// matches its columns (the coach checks the match); this writes the rows.
// POST { pipeline, rows: [{ name, for_name?, email?, phone?, stage?, notes?, source?, contact_method?, list?, created? }] }


export async function POST(req: NextRequest) {
  const who = await coachGate()
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: who.status })
  if (!await isAcademyUser(who.userId)) return notAnAcademy()
  const b = (await req.json().catch(() => ({}))) as { pipeline?: string; rows?: Record<string, unknown>[] }
  const pipeline = b.pipeline === 'holiday' ? 'holiday' : 'coaching'
  const rows = Array.isArray(b.rows) ? b.rows.slice(0, IMPORT_MAX) : []
  if (!rows.length) return NextResponse.json({ error: 'There are no rows to bring in.' }, { status: 400 })
  const staffId = who.seat.isHead ? null : who.seat.staffId
  const clean = rows.map(r => cleanImportRow(pipeline, r)).filter(Boolean).map(r => ({ ...r, coach_id: who.seat.academyId, staff_id: staffId }))
  if (!clean.length) return NextResponse.json({ error: 'None of the rows had a name, email or phone.' }, { status: 400 })
  const db = serviceClient()
  let added = 0
  for (let i = 0; i < clean.length; i += 200) {
    const { error, count } = await db.from('coach_leads').insert(clean.slice(i, i + 200), { count: 'exact' })
    if (error) return NextResponse.json({ error: `Stopped after ${added} rows: ${error.message}`, added }, { status: 400 })
    added += count ?? 0
  }
  return NextResponse.json({ ok: true, added, skipped: rows.length - clean.length })
}
