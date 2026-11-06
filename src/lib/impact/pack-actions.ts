// Reading and writing welcome packs. Each takes a Supabase client, so the same code
// runs as the signed-in user in the browser and in the tests.

import type { SupabaseClient } from '@supabase/supabase-js'
import { EMPTY_PACKS, type Booklet, type PackData, type PackItem, type PackMove } from './packs'

const PAGE = 1000
async function everyRow<T>(db: SupabaseClient, table: string, order: string, hqId?: string): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; ; from += PAGE) {
    const all = db.from(table).select('*')
    const { data, error } = await (hqId ? all.eq('hq_id', hqId) : all).order(order).range(from, from + PAGE - 1)
    if (error) throw error
    out.push(...(data as T[]))
    if (!data || data.length < PAGE) return out
  }
}

/** Everything the views need, for one org. Tables that aren't there yet read as an empty pack. */
export async function loadPacks(db: SupabaseClient, hqId?: string): Promise<PackData> {
  try {
    const [items, sizes, stock, issues, payments] = await Promise.all([
      everyRow<PackData['items'][number]>(db, 'tp_pack_items', 'sort', hqId),
      everyRow<PackData['sizes'][number]>(db, 'tp_pack_sizes', 'child_id', hqId),
      everyRow<PackData['stock'][number]>(db, 'tp_pack_stock', 'item_id', hqId),
      everyRow<PackData['issues'][number]>(db, 'tp_pack_issues', 'issued_at', hqId),
      everyRow<PackData['payments'][number]>(db, 'tp_pack_payments', 'paid_at', hqId),
    ])
    const moved = () => { const q = db.from('tp_pack_stock_moves').select('*'); return hqId ? q.eq('hq_id', hqId) : q }
    const book = db.from('tp_booklet').select('title, intro, weeks, stickers, motto, values, website, hashtag, warm_up, completion, tenors, notes_prompt, videos, pdf_path, pdf_name, pdf_pages, pdf_bytes, pdf_uploaded_at')
    const [moves, returns, booklet] = await Promise.all([
      moved().order('created_at', { ascending: false }).limit(50),
      moved().eq('reason', 'returned'),
      (hqId ? book.eq('hq_id', hqId) : book).maybeSingle(),
    ])
    return { items, sizes, stock, issues, payments, moves: (moves.data ?? []) as PackMove[], returns: (returns.data ?? []) as PackMove[], booklet: (booklet.data as Booklet | null) ?? null }
  } catch {
    return EMPTY_PACKS
  }
}

const failed = (error: { message: string } | null, fallback: string) => { if (error) throw new Error(fallback) }

/** "5" or "4.50" typed as pounds, as pence. Blank or unreadable is null. */
export const amountOrNull = (v: string) => { const n = Number(v); return v.trim() && Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null }

export type ItemDraft = Pick<PackItem, 'name' | 'kind' | 'price_pence' | 'has_sizes' | 'sizes' | 'low_stock' | 'unit_cost_pence' | 'sort' | 'active'>

/** Null when the item can be saved; otherwise what's wrong. */
export function itemProblem(d: ItemDraft): string | null {
  if (!d.name.trim()) return 'Give the item a name.'
  if (d.kind === 'paid' && !(d.price_pence && d.price_pence > 0)) return 'A paid item needs a price.'
  if (d.has_sizes && !d.sizes.length) return 'Add at least one size, or turn sizes off.'
  if (new Set(d.sizes).size !== d.sizes.length) return 'Each size can only be listed once.'
  return null
}

export async function saveItem(db: SupabaseClient, hqId: string, id: string | null, d: ItemDraft) {
  const problem = itemProblem(d)
  if (problem) throw new Error(problem)
  const row = { ...d, name: d.name.trim(), price_pence: d.kind === 'paid' ? d.price_pence : null, sizes: d.has_sizes ? d.sizes : [], updated_at: new Date().toISOString() }
  const { error } = id ? await db.from('tp_pack_items').update(row).eq('id', id) : await db.from('tp_pack_items').insert({ ...row, hq_id: hqId })
  failed(error, 'The item could not be saved.')
}

/** Swaps an item with its neighbour. */
export async function reorderItems(db: SupabaseClient, items: Pick<PackItem, 'id'>[]) {
  const results = await Promise.all(items.map((it, sort) => db.from('tp_pack_items').update({ sort }).eq('id', it.id)))
  failed(results.find(r => r.error)?.error ?? null, 'The order could not be saved.')
}

export async function useExamplePack(db: SupabaseClient, hqId: string, items: Pick<PackItem, 'name' | 'kind' | 'price_pence' | 'has_sizes' | 'sizes' | 'sort'>[], booklet: Booklet) {
  const { count } = await db.from('tp_pack_items').select('id', { count: 'exact', head: true })
  if (count) throw new Error('Your pack already has items, so the example wasn’t added.')
  const { error } = await db.from('tp_pack_items').insert(items.map(i => ({ ...i, hq_id: hqId })))
  failed(error, 'The example pack could not be added.')
  await saveBooklet(db, hqId, booklet)
}

export async function saveBooklet(db: SupabaseClient, hqId: string, b: Booklet) {
  // Named fields, so a save can't overwrite the PDF's details with a stale copy.
  const { title, intro, weeks, stickers, motto, values, website, hashtag, warm_up, completion, tenors, notes_prompt, videos } = b
  const { error } = await db.from('tp_booklet').upsert({ hq_id: hqId, title, intro, weeks, stickers, motto, values, website, hashtag, warm_up, completion, tenors, notes_prompt, videos, updated_at: new Date().toISOString() })
  failed(error, 'The booklet could not be saved.')
}

export async function receiveStock(db: SupabaseClient, hqId: string, itemId: string, size: string | null, qty: number, note: string) {
  if (!Number.isInteger(qty) || qty < 1) throw new Error('Enter how many came in, as a whole number.')
  const { error } = await db.from('tp_pack_stock_moves').insert({ hq_id: hqId, item_id: itemId, size, delta: qty, reason: 'received', note: note.trim() || null })
  failed(error, 'The stock could not be saved.')
}

export async function adjustStock(db: SupabaseClient, hqId: string, itemId: string, size: string | null, delta: number, note: string) {
  if (!Number.isInteger(delta) || delta === 0) throw new Error('Enter the change as a whole number, like -2.')
  if (!note.trim()) throw new Error('Say why the stock is being adjusted.')
  const { error } = await db.from('tp_pack_stock_moves').insert({ hq_id: hqId, item_id: itemId, size, delta, reason: 'adjusted', note: note.trim() })
  if (error) throw new Error(/qty/.test(error.message) ? 'That would take the stock below zero.' : 'The adjustment could not be saved.')
}

export async function setChildSize(db: SupabaseClient, hqId: string, childId: string, itemId: string, size: string) {
  const { error } = await db.from('tp_pack_sizes').upsert({ hq_id: hqId, child_id: childId, item_id: itemId, size, updated_at: new Date().toISOString() })
  failed(error, 'The size could not be saved.')
}

/** All of a child's lines go together or none do. The database's own sentence is the one to show. */
export async function issuePack(db: SupabaseClient, childId: string, lines: { item_id: string; size: string | null }[], opts: { sessionId?: string | null; issuedBy?: string | null; note?: string } = {}) {
  const { data, error } = await db.rpc('impact_issue_pack', { p_child: childId, p_lines: lines, p_session: opts.sessionId ?? null, p_issued_by: opts.issuedBy ?? null, p_note: opts.note ?? null })
  if (error) throw new Error(error.message)
  return data as number
}

export async function recordPayment(db: SupabaseClient, hqId: string, p: { childId: string; itemId: string; amountPence: number; method: string; reference: string; paidAt: string }) {
  if (!Number.isInteger(p.amountPence) || p.amountPence <= 0) throw new Error('Enter the amount paid.')
  const { error } = await db.from('tp_pack_payments').insert({
    hq_id: hqId, child_id: p.childId, item_id: p.itemId, amount_pence: p.amountPence, method: p.method,
    reference: p.reference.trim() || null, paid_at: p.paidAt, recorded_by: hqId,
  })
  failed(error, 'The payment could not be saved.')
}

/** A return, and with reissue the replacement, in one transaction. No replacement means no return. */
export async function returnItem(db: SupabaseClient, r: { childId: string; itemId: string; reason: string; note: string; reissue: boolean; size: string | null; issuedBy?: string | null }) {
  const { data, error } = await db.rpc('impact_return_item', { p_child: r.childId, p_item: r.itemId, p_reason: r.reason, p_note: r.note.trim() || null, p_reissue: r.reissue, p_size: r.size, p_issued_by: r.issuedBy ?? null })
  if (error) throw new Error(error.message)
  return data as number
}
