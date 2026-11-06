// The /impact/demo welcome pack: the fictional Rally Ten pack and booklet, with
// Hollinsmere at 4 of 6 issued, two rackets paid for and one size running low.
// Child ids are the demo Families ids, so every view tells the same story. Dates
// are relative to today, so the demo always reads as this term.

import { EXAMPLE_ITEMS, exampleBooklet } from '@/lib/impact/pack-example'
import type { PackData, PackIssue, PackItem, PackPayment, PackStock } from '@/lib/impact/packs'

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()

const items: PackItem[] = EXAMPLE_ITEMS.map((item, i) => ({ ...item, id: `pack-${i}`, low_stock: 10, unit_cost_pence: [450, 300, 120, 1400][i], active: true }))
const [shirt, ball, booklet, racket] = items

export const DEMO_PACK_CHILDREN = [
  { id: 'w1-0', name: 'Ella Ashby' }, { id: 'w1-1', name: 'Sam Ashby' }, { id: 'w2-0', name: 'Zara Mensah' },
  { id: 'w3-0', name: 'Maisie Dalby' }, { id: 'w3-1', name: 'Rosa Dalby' }, { id: 'w4-0', name: 'Ruby Calloway' },
].map(c => ({ ...c, schoolId: 'hollinsmere' }))

const SIZES: Record<string, string> = { 'w1-0': '7-8', 'w1-1': '5-6', 'w2-0': '9-10', 'w3-0': '7-8', 'w3-1': '9-10', 'w4-0': '7-8' }
const issuedChildren = ['w1-0', 'w1-1', 'w2-0', 'w3-0']
const issues: PackIssue[] = issuedChildren.flatMap((child_id, n) => [shirt, ball, booklet].map(item => ({
  id: `${child_id}-${item.id}`, child_id, item_id: item.id, size: item.has_sizes ? SIZES[child_id] : null, issued_at: daysAgo(12 - n), note: null,
})))
issues.push({ id: 'w1-0-racket', child_id: 'w1-0', item_id: racket.id, size: null, issued_at: daysAgo(9), note: null })

const payments: PackPayment[] = [
  { id: 'pay-1', child_id: 'w1-0', item_id: racket.id, amount_pence: 1000, paid_at: daysAgo(10).slice(0, 10), method: 'cash', reference: null },
  { id: 'pay-2', child_id: 'w3-0', item_id: racket.id, amount_pence: 1000, paid_at: daysAgo(6).slice(0, 10), method: 'school', reference: 'Class 3' },
]

const stock: PackStock[] = [
  { item_id: shirt.id, size: '5-6', qty: 24 }, { item_id: shirt.id, size: '7-8', qty: 31 }, { item_id: shirt.id, size: '9-10', qty: 3 }, { item_id: shirt.id, size: '11-12', qty: 18 },
  { item_id: ball.id, size: null, qty: 46 }, { item_id: booklet.id, size: null, qty: 52 }, { item_id: racket.id, size: null, qty: 14 },
]

export const DEMO_PACKS: PackData = {
  items, stock, issues, payments, returns: [],
  sizes: Object.entries(SIZES).map(([child_id, size]) => ({ child_id, item_id: shirt.id, size })),
  moves: [
    { id: 'm1', item_id: racket.id, size: null, delta: -1, reason: 'issued', child_id: 'w1-0', note: null, created_at: daysAgo(9) },
    { id: 'm2', item_id: shirt.id, size: '9-10', delta: -1, reason: 'issued', child_id: 'w2-0', note: null, created_at: daysAgo(11) },
    { id: 'm3', item_id: shirt.id, size: '9-10', delta: 40, reason: 'received', child_id: null, note: 'Autumn delivery', created_at: daysAgo(30) },
  ],
  booklet: exampleBooklet(),
}
