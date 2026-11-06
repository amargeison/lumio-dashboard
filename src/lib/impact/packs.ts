// Welcome packs: the rules every view shares. Pure: no database, no browser.
// The database enforces issuing itself (impact_issue_pack, migration 226); these
// decide what to offer and how to describe it.

export type PackKind = 'included' | 'paid'
export interface PackItem { id: string; name: string; kind: PackKind; price_pence: number | null; has_sizes: boolean; sizes: string[]; low_stock: number; unit_cost_pence: number | null; sort: number; active: boolean }
export interface PackSize { child_id: string; item_id: string; size: string }
export interface PackStock { item_id: string; size: string | null; qty: number }
export interface PackMove { id: string; item_id: string; size: string | null; delta: number; reason: string; child_id: string | null; note: string | null; created_at: string }
export interface PackIssue { id: string; child_id: string; item_id: string; size: string | null; issued_at: string; note: string | null }
export interface PackPayment { id: string; child_id: string | null; item_id: string; amount_pence: number; paid_at: string; method: string; reference: string | null }
export interface BookletWeek { week: number; title: string; focus: string; home_task: string }
export interface BookletSticker { id: string; label: string; description: string }
export interface Booklet { title: string; intro: string; weeks: BookletWeek[]; stickers: BookletSticker[] }
export interface PackData {
  items: PackItem[]; sizes: PackSize[]; stock: PackStock[]
  moves: PackMove[]                     // the latest, for the log
  returns: PackMove[]                   // every return: they decide who still has what
  issues: PackIssue[]; payments: PackPayment[]; booklet: Booklet | null
}

export const EMPTY_PACKS: PackData = { items: [], sizes: [], stock: [], moves: [], returns: [], issues: [], payments: [], booklet: null }
export const PAYMENT_METHODS = ['cash', 'bank', 'school', 'other'] as const

export const pounds = (pence: number) => `£${(pence / 100).toLocaleString('en-GB', { minimumFractionDigits: pence % 100 ? 2 : 0, maximumFractionDigits: 2 })}`
export const lineLabel = (item: Pick<PackItem, 'name'>, size: string | null) => size ? `${item.name} ${size}` : item.name
const activeItems = (p: PackData) => p.items.filter(i => i.active).sort((a, b) => a.sort - b.sort)
export const includedItems = (p: PackData) => activeItems(p).filter(i => i.kind === 'included')
export const paidItems = (p: PackData) => activeItems(p).filter(i => i.kind === 'paid')

// ── Stock ───────────────────────────────────────────────────────────────────
export interface StockLine { item: PackItem; size: string | null; qty: number; low: boolean }

/** Every active item and size, including those with nothing received yet. */
export function stockLines(p: PackData): StockLine[] {
  return activeItems(p).flatMap(item => (item.has_sizes ? item.sizes : [null]).map(size => {
    const qty = p.stock.find(s => s.item_id === item.id && (s.size ?? null) === size)?.qty ?? 0
    return { item, size, qty, low: item.low_stock > 0 && qty <= item.low_stock }
  }))
}

/** At or below the threshold, with how many it takes to get back to twice the threshold. */
export const restockList = (p: PackData) => stockLines(p).filter(l => l.low).map(l => ({ ...l, short: l.item.low_stock * 2 - l.qty }))

// ── Who has what ────────────────────────────────────────────────────────────
/** The child's current issue of an item, unless it has since been returned. */
export function currentIssue(p: PackData, childId: string, itemId: string): PackIssue | null {
  const last = p.issues.filter(i => i.child_id === childId && i.item_id === itemId).sort((a, b) => b.issued_at.localeCompare(a.issued_at))[0]
  if (!last) return null
  return p.returns.some(m => m.child_id === childId && m.item_id === itemId && m.created_at > last.issued_at) ? null : last
}
export const paymentFor = (p: PackData, childId: string, itemId: string) => p.payments.find(x => x.child_id === childId && x.item_id === itemId) ?? null
export const sizeFor = (p: PackData, childId: string, itemId: string) => p.sizes.find(s => s.child_id === childId && s.item_id === itemId)?.size ?? null

/** A child has a pack when every active included item has been issued. An empty pack is nobody's pack. */
export function hasPack(p: PackData, childId: string) {
  const items = includedItems(p)
  return items.length > 0 && items.every(i => currentIssue(p, childId, i.id))
}

export interface IssueLine { item: PackItem; size: string | null; issued: PackIssue | null; paid: PackPayment | null; canIssue: boolean; ticked: boolean; why: string | null }

/** What the issue dialog offers for one child. Included items start ticked; paid ones only if paid for. */
export function issueLines(p: PackData, childId: string): IssueLine[] {
  return activeItems(p).map(item => {
    const issued = currentIssue(p, childId, item.id), paid = paymentFor(p, childId, item.id)
    const unpaid = item.kind === 'paid' && !paid
    const canIssue = !issued && !unpaid
    return { item, size: sizeFor(p, childId, item.id), issued, paid, canIssue, ticked: canIssue, why: issued ? 'Already issued' : unpaid ? `Not paid · ${pounds(item.price_pence ?? 0)}` : null }
  })
}

export interface ChildRef { id: string; name: string }
/** The whole included pack for everyone who still needs it. A child with no size is listed, never skipped quietly. */
export function bulkPlan(p: PackData, children: ChildRef[]) {
  const ready: { child: ChildRef; lines: { item_id: string; size: string | null }[] }[] = []
  const blocked: { child: ChildRef; reason: string }[] = []
  for (const child of children) {
    const missing = includedItems(p).filter(i => !currentIssue(p, child.id, i.id))
    if (!missing.length) continue
    const noSize = missing.filter(i => i.has_sizes && !sizeFor(p, child.id, i.id))
    if (noSize.length) blocked.push({ child, reason: `No ${noSize.map(i => i.name).join(' or ')} size` })
    else ready.push({ child, lines: missing.map(i => ({ item_id: i.id, size: i.has_sizes ? sizeFor(p, child.id, i.id) : null })) })
  }
  return { ready, blocked }
}

/** A school's numbers: packs out of children, and each paid item's paid and issued counts. */
export function schoolPacks(p: PackData, children: ChildRef[]) {
  const ids = new Set(children.map(c => c.id))
  return {
    total: children.length,
    done: children.filter(c => hasPack(p, c.id)).length,
    waiting: includedItems(p).length ? children.filter(c => !hasPack(p, c.id)) : [],
    paid: paidItems(p).map(item => ({
      item,
      paid: new Set(p.payments.filter(x => x.item_id === item.id && x.child_id && ids.has(x.child_id)).map(x => x.child_id)).size,
      issued: children.filter(c => currentIssue(p, c.id, item.id)).length,
    })),
  }
}

// ── Importing ───────────────────────────────────────────────────────────────
// The children sheet's pack columns are generic, so they only mean something when
// the org has exactly one sized item and one paid item. Anything else is a
// question for a person, not a guess.
export interface PackImport { sizeItem: PackItem | null; size: string | null; issuedItems: PackItem[]; issuedOn: string | null; paidItem: PackItem | null; paidOn: string | null; paidPence: number | null; issues: string[] }

export function readPackColumns(r: Record<string, unknown>, items: PackItem[]): PackImport {
  const live = items.filter(i => i.active)
  const out: PackImport = { sizeItem: null, size: null, issuedItems: [], issuedOn: null, paidItem: null, paidOn: null, paidPence: null, issues: [] }
  if (r.pack_size) {
    const sized = live.filter(i => i.has_sizes), size = String(r.pack_size).trim()
    if (sized.length !== 1) out.issues.push(`Pack size “${size}” not saved: ${sized.length ? 'more than one item has sizes' : 'no item in your pack has sizes'}`)
    else if (!sized[0].sizes.some(s => s.toLowerCase() === size.toLowerCase())) out.issues.push(`Pack size “${size}” isn’t one of the ${sized[0].name} sizes (${sized[0].sizes.join(', ')})`)
    else { out.sizeItem = sized[0]; out.size = sized[0].sizes.find(s => s.toLowerCase() === size.toLowerCase()) ?? size }
  }
  if (r.pack_issued) {
    const included = live.filter(i => i.kind === 'included')
    if (!included.length) out.issues.push('Pack issued not saved: your pack has no included items yet')
    else { out.issuedItems = included; out.issuedOn = String(r.pack_issued) }
  }
  if (r.paid_item_date || r.paid_item_amount) {
    const paid = live.filter(i => i.kind === 'paid')
    if (paid.length !== 1) out.issues.push(`Paid item not saved: ${paid.length ? 'your pack has more than one paid item' : 'your pack has no paid items'}`)
    else if (!r.paid_item_date) out.issues.push('Paid item amount has no date, so it wasn’t saved')
    else {
      out.paidItem = paid[0]; out.paidOn = String(r.paid_item_date)
      out.paidPence = typeof r.paid_item_amount === 'number' ? Math.round(r.paid_item_amount * 100) : paid[0].price_pence
    }
  }
  return out
}
