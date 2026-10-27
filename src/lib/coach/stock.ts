// How much of a piece of kit there is, said one way everywhere: the Equipment
// page, the portal's dashboard and the iPhone app's dashboard.

// The status used to be whatever the coach last picked, with no link to the
// count beside it — so an item with 0 left sat under a green "In stock" and the
// dashboard said "All stocked up". The count now decides wherever it can:
//
//   0 left                          → out of stock
//   at or below the item's "low at" → running low
//   otherwise                       → what the coach chose
//
// "To order" and "Repair" are things the coach has said, not things a number
// can know, so they always stand. An item with no count keeps the status it was
// given (a ball machine nobody counts); one with no count AND no status has
// never been looked at — the starter list arrives like that — and says so
// rather than claiming to be in stock. The Equipment page and the dashboard both
// read this one function, so they cannot disagree.
export type StockState = 'in_stock' | 'low' | 'order' | 'repair' | 'out' | 'uncounted'
export type StockItem = { quantity?: number | null; status?: string | null; low_at?: number | null }

export function stockState(i: StockItem): StockState {
  if (i.status === 'order' || i.status === 'repair') return i.status
  const q = i.quantity
  if (q == null) return i.status === 'low' ? 'low' : i.status ? 'in_stock' : 'uncounted'
  if (q <= 0) return 'out'
  if (i.low_at != null && q <= i.low_at) return 'low'
  return i.status === 'low' ? 'low' : 'in_stock'
}
export const STOCK_LABEL: Record<StockState, string> = { in_stock: 'In stock', low: 'Running low', order: 'To order', repair: 'Repair', out: 'Out of stock', uncounted: 'Not counted' }
/** Out, low, to order or in for repair. Not "not counted": that is a list nobody has filled in, not a shortage. */
export const stockNeedsAttention = (i: StockItem) => { const s = stockState(i); return s !== 'in_stock' && s !== 'uncounted' }
