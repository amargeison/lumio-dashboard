import { NextRequest, NextResponse } from 'next/server'
import { impactHq } from '@/lib/impact/import-auth'
import { blockedLine, editedSince, fingerprints, trace, words, type Blocked } from '@/lib/impact/import-run'

export const runtime = 'nodejs'

// Lumio Impact import history (Settings → Data).
//   GET                         this org's imports, newest first
//   POST { id, action:'check' } what undo would delete, how many of those rows were
//                               edited since, and anything blocking it — no change
//   POST { id, action:'undo' }  deletes the rows that import created, all or nothing
// Undo itself is impact_undo_import (migration 236): it checks the org, locks the
// rows, refuses while anything outside the import points at them, and leaves rows
// the import only updated alone.

type Undo = { ok: boolean; deleted: Record<string, number>; blocked: Blocked[] }

export async function GET() {
  const hq = await impactHq('see the import history')
  if (hq instanceof NextResponse) return hq
  const { data, error } = await hq.db.from('impact_imports')
    .select('id, file_name, created_at, finished_at, undone_at, created_by, summary:counts->summary')
    .eq('hq_id', hq.hqId).order('created_at', { ascending: false }).limit(50)
  if (error) return NextResponse.json({ error: 'The import history couldn’t be loaded. Please refresh.' }, { status: 500 })
  return NextResponse.json({ imports: (data ?? []).map(r => ({ ...r, mine: r.created_by === hq.user.id })) })
}

export async function POST(req: NextRequest) {
  const hq = await impactHq('undo an import')
  if (hq instanceof NextResponse) return hq
  const body = await req.json().catch(() => ({})) as { id?: string; action?: string }
  const id = String(body.id ?? '')
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'That import couldn’t be found.' }, { status: 400 })
  const { data: imp } = await hq.db.from('impact_imports').select('id, undone_at, counts').eq('id', id).eq('hq_id', hq.hqId).maybeSingle()
  if (!imp) return NextResponse.json({ error: 'That import couldn’t be found.' }, { status: 404 })
  if (imp.undone_at) return NextResponse.json({ error: 'That import has already been undone.' }, { status: 409 })

  const check = body.action !== 'undo'
  const { data, error } = await hq.db.rpc('impact_undo_import', { p_import: id, p_check: check })
  if (error) {
    trace(check ? 'undo check failed' : 'undo failed', { hqId: hq.hqId, importId: id, error: error.message })
    return NextResponse.json({ error: `${check ? 'Undo couldn’t be checked' : 'Undo failed — nothing was deleted'}: ${error.message}` }, { status: 500 })
  }
  const undo = data as Undo
  const deleted = Object.entries(undo.deleted ?? {}).map(([table, n]) => ({ table, n, label: words(table, n) }))
  const total = deleted.reduce((s, d) => s + d.n, 0)
  const blocked = (undo.blocked ?? []).map(b => ({ ...b, line: blockedLine(b) }))
  if (!check) {
    trace(undo.ok ? 'undone' : 'undo blocked', { hqId: hq.hqId, importId: id, total, blocked: blocked.length })
    if (!undo.ok) return NextResponse.json({ error: 'Undo is blocked — nothing was deleted.', blocked, deleted, total }, { status: 409 })
    return NextResponse.json({ ok: true, deleted, total })
  }
  // Edited since: each row's fingerprint now against the one taken when it was imported.
  const then = ((imp.counts as { fp?: Record<string, Record<string, string>> } | null)?.fp) ?? {}
  const edited = Object.entries(editedSince(then, await fingerprints(hq.db, hq.hqId, id))).map(([table, n]) => ({ table, n, label: words(table, n) }))
  return NextResponse.json({ ok: undo.ok, deleted, total, edited, editedTotal: edited.reduce((s, d) => s + d.n, 0), blocked })
}
