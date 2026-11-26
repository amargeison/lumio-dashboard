// ─── LUMIO IMPACT — RUNNING AN IMPORT (server only) ─────────────────────────
// Loads the org's rows for the planner, writes a plan, and backs the import
// history (supabase/migrations/236_impact_imports.sql).
//
// Every write is made AS the signed-in HQ or admin, so RLS checks each one, and
// every query also matches hq_id (an admin's session can read several orgs).
//
// Writing a plan:
//   1. an impact_imports row (finished_at empty until the end)
//   2. every new row, stamped with that import, in link order
//   3. then the updates to existing rows (never stamped — undo leaves them alone)
//   4. a fingerprint of each row the import created, kept with the import, so the
//      undo dialog can say how many have been edited since
// If creating rows fails, the import undoes itself and nothing it made is left.
// If an update fails, the new rows stay, the import is left unfinished, and the
// history offers Undo.

import { createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { PackItem } from './packs'
import { INSERT_ORDER, type Existing, type ImportPlan, type Op, type Row } from './import-plan'

const CHUNK = 500
const PARALLEL = 8

/** Every table an import stamps (the 17 in 236). */
export const STAMPED = [...INSERT_ORDER.filter(t => t !== 'tp_pack_payments' && t !== 'tp_pack_sizes'), 'tp_pack_sizes', 'tp_pack_issues', 'tp_pack_payments'] as const

export const trace = (stage: string, extra: Record<string, unknown> = {}) => console.info('[impact-import]', stage, extra)

async function all<T>(db: SupabaseClient, hqId: string, table: string, cols: string, importId?: string): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; ; from += 1000) {
    let q = db.from(table).select(cols).eq('hq_id', hqId)
    if (importId) q = q.eq('import_batch_id', importId)
    const { data, error } = await q.order(table === 'tp_pack_sizes' ? 'child_id' : 'id').range(from, from + 999)
    if (error) throw new Error(`${table}: ${error.message}`)
    out.push(...((data ?? []) as T[]))
    if ((data ?? []).length < 1000) return out
  }
}

export async function loadExisting(db: SupabaseClient, hqId: string): Promise<Existing> {
  const [schools, programmes, venues, staff, families, volunteers, children, events, donations, sessions, attendance, responses, cpd, packItems, packSizes, packIssues, packPayments, campaigns] = await Promise.all([
    all<Row>(db, hqId, 'tp_schools', '*'), all<Row>(db, hqId, 'tp_programmes', '*'), all<Row>(db, hqId, 'tp_venues', '*'), all<Row>(db, hqId, 'tp_staff', '*'),
    all<Row>(db, hqId, 'tp_families', '*'), all<Row>(db, hqId, 'tp_volunteers', '*'), all<Row>(db, hqId, 'tp_children', '*'), all<Row>(db, hqId, 'tp_fundraising_events', '*'),
    all<Row>(db, hqId, 'tp_donations', 'id, donor_name, amount_pence, donated_on'), all<Row>(db, hqId, 'tp_sessions', 'id, kind, session_date, programme_id, venue_id'),
    all<Row>(db, hqId, 'tp_attendance', 'id, session_id, child_id'), all<Row>(db, hqId, 'tp_impact_responses', 'id, child_id, comment'),
    all<Row>(db, hqId, 'tp_cpd', 'id, school_id, staff_name, course, cpd_date'), all<PackItem & Row>(db, hqId, 'tp_pack_items', '*'),
    all<Row>(db, hqId, 'tp_pack_sizes', 'child_id, item_id, size'), all<Row>(db, hqId, 'tp_pack_issues', 'id, child_id, item_id'),
    all<Row>(db, hqId, 'tp_pack_payments', 'id, child_id, item_id'),
    db.from('tp_fundraising_campaigns').select('id').eq('hq_id', hqId).is('school_id', null).order('created_at', { ascending: false }).limit(1),
  ])
  if (campaigns.error) throw new Error(`tp_fundraising_campaigns: ${campaigns.error.message}`)
  return { schools, programmes, venues, staff, families, volunteers, children, events, donations, sessions, attendance, responses, cpd,
    packItems, packSizes, packIssues, packPayments, campaignId: (campaigns.data?.[0]?.id as string | undefined) ?? null }
}

async function inParallel<T>(items: T[], fn: (x: T) => Promise<void>) {
  for (let i = 0; i < items.length; i += PARALLEL) await Promise.all(items.slice(i, i + PARALLEL).map(fn))
}

// ── Fingerprints ────────────────────────────────────────────────────────────
const stable = (v: unknown): string => Array.isArray(v) ? `[${v.map(stable).join(',')}]`
  : v && typeof v === 'object' ? `{${Object.keys(v).sort().map(k => `${JSON.stringify(k)}:${stable((v as Record<string, unknown>)[k])}`).join(',')}}`
  : JSON.stringify(v ?? null)
/** A row as it is now, minus the columns that change by themselves. */
export const fingerprint = (row: Record<string, unknown>) => {
  const { updated_at: _u, ...rest } = row
  void _u
  return createHash('sha1').update(stable(rest)).digest('hex').slice(0, 12)
}
const keyOf = (table: string, row: Record<string, unknown>) => (table === 'tp_pack_sizes' ? `${row.child_id}|${row.item_id}` : String(row.id))

/** Each row an import created, by table, as a fingerprint. */
export async function fingerprints(db: SupabaseClient, hqId: string, importId: string): Promise<Record<string, Record<string, string>>> {
  const out: Record<string, Record<string, string>> = {}
  for (const t of STAMPED) {
    const rows = await all<Record<string, unknown>>(db, hqId, t, '*', importId)
    if (rows.length) out[t] = Object.fromEntries(rows.map(r => [keyOf(t, r), fingerprint(r)]))
  }
  return out
}

/** How many of the rows an import created have changed since it finished. */
export function editedSince(then: Record<string, Record<string, string>>, now: Record<string, Record<string, string>>): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [t, rows] of Object.entries(now)) {
    const n = Object.entries(rows).filter(([k, fp]) => then[t]?.[k] !== undefined && then[t][k] !== fp).length
    if (n) out[t] = n
  }
  return out
}

// ── Writing ────────────────────────────────────────────────────────────────
export type RunResult = { importId: string; ok: true } | { importId: string | null; ok: false; error: string; rolledBack: boolean; partial?: boolean }

export async function runImport(db: SupabaseClient, hqId: string, fileName: string, plan: ImportPlan, counts: Record<string, unknown>, newId: () => string): Promise<RunResult> {
  const importId = newId()
  const made = await db.from('impact_imports').insert({ id: importId, hq_id: hqId, file_name: fileName.slice(0, 300) || 'Import', counts: { summary: counts } })
  if (made.error) { trace('history row refused', { hqId, error: made.error.message }); return { importId: null, ok: false, error: 'The import couldn’t be started. Please sign in again and retry.', rolledBack: false } }
  trace('started', { hqId, importId, ops: plan.ops.length })

  const inserts = new Map<string, Record<string, unknown>[]>()
  const updates: Op[] = [], issues: Extract<Op, { kind: 'issue' }>[] = []
  for (const op of plan.ops) {
    if (op.kind === 'insert') (inserts.get(op.table) ?? inserts.set(op.table, []).get(op.table)!).push({ ...op.row, import_batch_id: importId })
    else if (op.kind === 'issue') issues.push(op)
    else updates.push(op)
  }

  let stage = ''
  try {
    for (const t of INSERT_ORDER) {
      const rows = inserts.get(t) ?? []
      for (let i = 0; i < rows.length; i += CHUNK) {
        stage = t
        const { error } = await db.from(t).insert(rows.slice(i, i + CHUNK))
        if (error) throw new Error(error.message)
      }
      // Past pack issues go through their own function, right after the children's sizes.
      if (t === 'tp_pack_sizes' && issues.length) {
        stage = 'tp_pack_issues'
        await inParallel(issues, async op => {
          const { error } = await db.rpc('impact_record_past_issue', { p_child: op.childId, p_item: op.itemId, p_size: op.size, p_issued_at: op.issuedAt, p_import: importId })
          if (error) throw new Error(error.message)
        })
      }
    }
  } catch (e) {
    const why = e instanceof Error ? e.message : String(e)
    trace('create failed — undoing', { hqId, importId, stage, error: why })
    const undo = await db.rpc('impact_undo_import', { p_import: importId, p_check: false })
    const rolledBack = !undo.error && (undo.data as { ok?: boolean } | null)?.ok === true
    trace(rolledBack ? 'undone after failure' : 'undo after failure refused', { hqId, importId, error: undo.error?.message })
    return { importId, ok: false, rolledBack, error: `Saving ${friendlyTable(stage)} failed (${why}). ${rolledBack ? 'Nothing from this file was kept.' : 'Some rows were saved: undo this import from the import history.'}` }
  }

  let failed = 0, firstError = ''
  await inParallel(updates, async op => {
    const q = op.kind === 'size'
      ? db.from('tp_pack_sizes').update({ size: op.size, updated_at: new Date().toISOString() }).eq('hq_id', hqId).eq('child_id', op.childId).eq('item_id', op.itemId)
      : op.kind === 'update' ? db.from(op.table).update(op.patch).eq('hq_id', hqId).eq('id', op.id) : null
    if (!q) return
    const { error } = await q
    if (error) { failed++; firstError ||= `${friendlyTable(op.kind === 'update' ? op.table : 'tp_pack_sizes')}: ${error.message}` }
  })

  const fp = await fingerprints(db, hqId, importId).catch(e => { trace('fingerprints failed', { hqId, importId, error: String(e) }); return {} })
  const done = await db.from('impact_imports').update({ counts: { summary: counts, fp }, ...(failed ? {} : { finished_at: new Date().toISOString() }) }).eq('id', importId).eq('hq_id', hqId)
  if (done.error) trace('finish not recorded', { hqId, importId, error: done.error.message })
  if (failed) {
    trace('updates failed', { hqId, importId, failed, of: updates.length, error: firstError })
    return { importId, ok: false, rolledBack: false, partial: true, error: `The new records were saved, but ${failed} of ${updates.length} updates to existing records failed (${firstError}). You can undo this import from the import history.` }
  }
  trace('finished', { hqId, importId, created: [...inserts.values()].reduce((n, r) => n + r.length, 0) + issues.length, updated: updates.length })
  return { importId, ok: true }
}

const TABLE_WORDS: Record<string, [string, string]> = {
  tp_schools: ['school', 'schools'], tp_programmes: ['programme', 'programmes'], tp_venues: ['venue', 'venues'], tp_staff: ['coach', 'coaches'],
  tp_families: ['family', 'families'], tp_volunteers: ['volunteer', 'volunteers'], tp_children: ['child', 'children'],
  tp_fundraising_campaigns: ['fundraising campaign', 'fundraising campaigns'], tp_fundraising_events: ['fundraising event', 'fundraising events'],
  tp_fundraising_pledges: ['pledge', 'pledges'], tp_donations: ['donation', 'donations'], tp_sessions: ['session', 'sessions'],
  tp_attendance: ['register entry', 'register entries'], tp_impact_responses: ['feedback response', 'feedback responses'], tp_cpd: ['CPD record', 'CPD records'],
  tp_pack_sizes: ['pack size', 'pack sizes'], tp_pack_issues: ['pack issue', 'pack issues'], tp_pack_payments: ['payment', 'payments'],
  tp_pack_stock_moves: ['stock movement', 'stock movements'], tp_booklet_notes: ['booklet note', 'booklet notes'], tp_booklet_scorecards: ['booklet scorecard', 'booklet scorecards'],
  impact_members: ['login', 'logins'], impact_invites: ['invite', 'invites'], impact_messages: ['message', 'messages'], impact_leads: ['lead', 'leads'],
  tp_pathway_referrals: ['pathway referral', 'pathway referrals'],
}
/** "tp_attendance", 3 → "3 register entries". */
export const words = (table: string, n?: number) => {
  const [one, many] = TABLE_WORDS[table] ?? [table.replace(/^(tp|impact)_/, '').replace(/_/g, ' '), table.replace(/^(tp|impact)_/, '').replace(/_/g, ' ')]
  return n === undefined ? many : `${n} ${n === 1 ? one : many}`
}
const friendlyTable = (t: string) => (t ? words(t) : 'the import')

export type Blocked = { table: string; on: string; count: number; names: string[] }
/** "3 register entries not from this import point at children it added (Maya Reilly, Finn Okafor)". */
export const blockedLine = (b: Blocked) =>
  `${words(b.table, b.count)} not from this import ${b.count === 1 ? 'points' : 'point'} at ${words(b.on)} it added${b.names.length ? ` (${b.names.join(', ')}${b.count > b.names.length ? '…' : ''})` : ''}`
