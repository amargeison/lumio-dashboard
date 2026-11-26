import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomUUID } from 'node:crypto'
import { impactHq } from '@/lib/impact/import-auth'
import { cleanForPlan, countRecords, planCounts, planImport, MAX_IMPORT_ROWS, MAX_IMPORT_BYTES } from '@/lib/impact/import-plan'
import { loadExisting, runImport, trace } from '@/lib/impact/import-run'
import type { Rec } from '@/lib/import-engine/records'

export const runtime = 'nodejs'
export const maxDuration = 300

// Lumio Impact import — "What will happen", then "Import N records".
//   mode "review": plans the file's records against the org's rows. Writes nothing.
//   mode "commit": plans again against fresh rows; if the answer is not the one the
//     user reviewed (someone changed something meanwhile), refuses and asks for a
//     fresh review. Otherwise writes it, stamped with a new import (see import-run).
// Records arrive already read from the file in the browser; they are cleaned and
// de-duplicated again here, never trusted as sent.

const keyOf = (counts: unknown) => createHash('sha1').update(JSON.stringify(counts)).digest('hex').slice(0, 16)

export async function POST(req: NextRequest) {
  const hq = await impactHq()
  if (hq instanceof NextResponse) return hq
  if (Number(req.headers.get('content-length') ?? 0) > MAX_IMPORT_BYTES * 2) {
    return NextResponse.json({ error: 'That’s more than one import can take. Split the file into smaller ones (up to 5,000 rows each).' }, { status: 413 })
  }
  const body = await req.json().catch(() => null) as { fileName?: string; records?: Record<string, Rec[]>; mode?: string; key?: string } | null
  if (!body || typeof body.records !== 'object' || !body.records) return NextResponse.json({ error: 'Nothing to import was sent. Choose the file again.' }, { status: 400 })
  const sent = countRecords(body.records)
  if (sent > MAX_IMPORT_ROWS) {
    return NextResponse.json({ error: `That file has ${sent.toLocaleString('en-GB')} records. One import takes up to ${MAX_IMPORT_ROWS.toLocaleString('en-GB')} — split it into smaller files.` }, { status: 413 })
  }
  const fileName = String(body.fileName ?? 'Import').slice(0, 300)
  const mode = body.mode === 'commit' ? 'commit' : 'review'
  trace(mode, { hqId: hq.hqId, records: sent })

  try {
    const records = cleanForPlan(body.records)
    const existing = await loadExisting(hq.db, hq.hqId)
    const now = new Date().toISOString()
    const plan = planImport(records, existing, { hqId: hq.hqId, userId: hq.user.id, newId: randomUUID, now, today: now.slice(0, 10) })
    const counts = planCounts(plan)
    const key = keyOf(counts)
    trace(`${mode} planned`, { hqId: hq.hqId, writes: plan.writes, ops: plan.ops.length, key })
    if (mode === 'review') return NextResponse.json({ tables: plan.tables, writes: plan.writes, records: plan.records, key })

    if (body.key !== key) {
      trace('commit refused: plan changed', { hqId: hq.hqId, reviewed: body.key, now: key })
      return NextResponse.json({ error: 'Something in Lumio changed since you reviewed this file, so what it would do is different now. Check “What will happen” again, then import.', changed: true, tables: plan.tables, writes: plan.writes, records: plan.records, key }, { status: 409 })
    }
    if (!plan.ops.length) return NextResponse.json({ error: 'There’s nothing new or changed to import from this file.' }, { status: 400 })
    const result = await runImport(hq.db, hq.hqId, fileName, plan, counts, randomUUID)
    if (!result.ok) return NextResponse.json({ error: result.error, importId: result.importId, rolledBack: result.rolledBack, partial: !!result.partial }, { status: 500 })
    return NextResponse.json({ ok: true, importId: result.importId, tables: plan.tables, writes: plan.writes })
  } catch (e) {
    const why = e instanceof Error ? e.message : String(e)
    trace(`${mode} failed`, { hqId: hq.hqId, error: why })
    return NextResponse.json({ error: `The import couldn’t be checked against your records (${why}). Nothing was saved — please try again.` }, { status: 500 })
  }
}
