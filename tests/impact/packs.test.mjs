import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const src = fileURLToPath(new URL('../../src/', import.meta.url))
registerHooks({
  resolve(spec, ctx, next) {
    const base = spec.startsWith('@/') ? src + spec.slice(2) : spec.startsWith('./') && ctx.parentURL?.includes('/src/') ? fileURLToPath(new URL(spec, ctx.parentURL)) : null
    if (base && !/\.tsx?$/.test(base) && existsSync(`${base}.ts`)) return next(pathToFileURL(`${base}.ts`).href, ctx)
    return base ? next(pathToFileURL(base).href, ctx) : next(spec, ctx)
  },
})
const { EMPTY_PACKS, bulkPlan, currentIssue, hasPack, issueLines, lineLabel, pounds, readPackColumns, restockList, schoolPacks, stockLines } = await import('../../src/lib/impact/packs.ts')
const { EXAMPLE_ITEMS, exampleBooklet } = await import('../../src/lib/impact/pack-example.ts')
const { adjustStock, itemProblem, receiveStock, saveItem, useExamplePack } = await import('../../src/lib/impact/pack-actions.ts')
const { IMPACT_IMPORT_FIELDS, IMPACT_IMPORT_SCHEMA } = await import('../../src/lib/impact/import-schema.ts')
const { templatePlan } = await import('../../src/lib/impact/import-template.ts')
const { cleanRecord } = await import('../../src/lib/import-engine/records.ts')
const { impactModules, moduleOn } = await import('../../src/lib/impact/org.ts')

const { buildCohorts, buildPeople } = await import('../../src/lib/impact/live-context.ts')

const item = (id, name, extra = {}) => ({ id, name, kind: 'included', price_pence: null, has_sizes: false, sizes: [], low_stock: 10, unit_cost_pence: null, sort: 0, active: true, ...extra })
const shirt = item('shirt', 'T-shirt', { has_sizes: true, sizes: ['7-8', '9-10'], sort: 0 })
const ball = item('ball', 'Ball', { sort: 1 })
const racket = item('racket', 'Racket', { kind: 'paid', price_pence: 1000, sort: 2 })
const issue = (child_id, item_id, issued_at = '2026-10-01T10:00:00Z', size = null) => ({ id: `${child_id}${item_id}${issued_at}`, child_id, item_id, size, issued_at, note: null })
const pack = extra => ({ ...EMPTY_PACKS, items: [shirt, ball, racket], ...extra })
const kids = ['a', 'b', 'c'].map(id => ({ id, name: id.toUpperCase() }))

test('labels and money', () => {
  assert.equal(lineLabel(shirt, '9-10'), 'T-shirt 9-10')
  assert.equal(lineLabel(ball, null), 'Ball')
  assert.deepEqual([pounds(1000), pounds(1050), pounds(500000)], ['£10', '£10.50', '£5,000'])
})
test('stock lines cover every size, including those never received', () => {
  const lines = stockLines(pack({ stock: [{ item_id: 'shirt', size: '9-10', qty: 3 }, { item_id: 'ball', size: null, qty: 40 }] }))
  assert.deepEqual(lines.map(l => [l.item.name, l.size, l.qty, l.low]), [['T-shirt', '7-8', 0, true], ['T-shirt', '9-10', 3, true], ['Ball', null, 40, false], ['Racket', null, 0, true]])
})
test('a retired item drops off', () => assert.equal(stockLines({ ...EMPTY_PACKS, items: [item('x', 'X', { active: false })] }).length, 0))
test('restock: at or below the threshold, short of twice the threshold', () => {
  const p = pack({ items: [ball], stock: [{ item_id: 'ball', size: null, qty: 10 }] })
  assert.deepEqual(restockList(p).map(l => [l.qty, l.short]), [[10, 10]])
  assert.deepEqual(restockList({ ...p, stock: [{ item_id: 'ball', size: null, qty: 11 }] }), [], 'above the threshold')
  assert.equal(restockList({ ...p, stock: [{ item_id: 'ball', size: null, qty: 3 }] })[0].short, 17)
})
test('a threshold of 0 never asks for a restock', () => assert.deepEqual(restockList({ ...EMPTY_PACKS, items: [item('x', 'X', { low_stock: 0 })] }), []))
test('a return takes an item back; a later issue gives it again', () => {
  const returned = { id: 'm', item_id: 'ball', size: null, delta: 1, reason: 'returned', child_id: 'a', note: null, created_at: '2026-10-02T10:00:00Z' }
  assert.ok(currentIssue(pack({ issues: [issue('a', 'ball')] }), 'a', 'ball'))
  assert.equal(currentIssue(pack({ issues: [issue('a', 'ball')], returns: [returned] }), 'a', 'ball'), null)
  assert.ok(currentIssue(pack({ issues: [issue('a', 'ball'), issue('a', 'ball', '2026-10-03T10:00:00Z')], returns: [returned] }), 'a', 'ball'))
})
test('has a pack: every active included item, and a paid item doesn’t count', () => {
  const full = [issue('a', 'shirt'), issue('a', 'ball')]
  assert.equal(hasPack(pack({ issues: full }), 'a'), true)
  assert.equal(hasPack(pack({ issues: [issue('a', 'shirt')] }), 'a'), false)
  assert.equal(hasPack(pack({ issues: [issue('a', 'racket')] }), 'a'), false)
  assert.equal(hasPack(EMPTY_PACKS, 'a'), false, 'an empty pack is nobody’s pack')
})
test('adding a new included item means existing children no longer have the whole pack', () => {
  const p = pack({ issues: [issue('a', 'shirt'), issue('a', 'ball')] })
  assert.equal(hasPack({ ...p, items: [...p.items, item('cap', 'Cap')] }, 'a'), false)
})
test('the dialog: included ticked, paid ticked only once paid, issued not offered', () => {
  const lines = id => Object.fromEntries(issueLines(pack({
    issues: [issue('a', 'ball')], sizes: [{ child_id: 'a', item_id: 'shirt', size: '9-10' }],
    payments: [{ id: 'p', child_id: 'b', item_id: 'racket', amount_pence: 1000, paid_at: '2026-10-01', method: 'cash', reference: null }],
  }), id).map(l => [l.item.id, l]))
  const a = lines('a'), b = lines('b')
  assert.deepEqual([a.shirt.ticked, a.shirt.size], [true, '9-10'])
  assert.deepEqual([a.ball.ticked, a.ball.canIssue, a.ball.why], [false, false, 'Already issued'])
  assert.deepEqual([a.racket.ticked, a.racket.canIssue, a.racket.why], [false, false, 'Not paid · £10'])
  assert.deepEqual([b.racket.ticked, b.racket.canIssue], [true, true])
})
test('bulk: ready, blocked by name, and done left out', () => {
  const p = pack({ sizes: [{ child_id: 'a', item_id: 'shirt', size: '7-8' }], issues: [issue('c', 'shirt'), issue('c', 'ball')] })
  const { ready, blocked } = bulkPlan(p, kids)
  assert.deepEqual(ready.map(r => [r.child.id, r.lines]), [['a', [{ item_id: 'shirt', size: '7-8' }, { item_id: 'ball', size: null }]]])
  assert.deepEqual(blocked, [{ child: kids[1], reason: 'No T-shirt size' }])
})
test('bulk: paid items are never in it', () => {
  const { ready } = bulkPlan({ ...pack(), items: [ball, racket] }, kids)
  assert.ok(ready.every(r => r.lines.every(l => l.item_id === 'ball')))
})
test('bulk: a child who only needs an unsized item isn’t blocked by a size', () => {
  const { ready, blocked } = bulkPlan(pack({ issues: [issue('a', 'shirt')] }), [kids[0]])
  assert.deepEqual([ready.length, blocked.length], [1, 0])
})
test('school numbers: packs of children, paid and issued per paid item', () => {
  const p = pack({
    issues: [issue('a', 'shirt'), issue('a', 'ball'), issue('a', 'racket'), issue('z', 'shirt'), issue('z', 'ball')],
    payments: [{ id: '1', child_id: 'a', item_id: 'racket', amount_pence: 1000 }, { id: '2', child_id: 'b', item_id: 'racket', amount_pence: 1000 }, { id: '3', child_id: 'z', item_id: 'racket', amount_pence: 1000 }],
  })
  const s = schoolPacks(p, kids)
  assert.deepEqual([s.total, s.done, s.waiting.map(c => c.id)], [3, 1, ['b', 'c']])
  assert.deepEqual(s.paid.map(x => [x.item.name, x.paid, x.issued]), [['Racket', 2, 1]])
})
test('an empty org: no items, no NaN, nobody waiting', () => {
  const s = schoolPacks(EMPTY_PACKS, kids)
  assert.deepEqual([s.done, s.waiting, s.paid], [0, [], []])
  assert.deepEqual([stockLines(EMPTY_PACKS), restockList(EMPTY_PACKS), issueLines(EMPTY_PACKS, 'a')], [[], [], []])
  assert.deepEqual(bulkPlan(EMPTY_PACKS, kids), { ready: [], blocked: [] })
})

test('the example is Rally Ten’s, four items and ten weeks', () => {
  assert.deepEqual(EXAMPLE_ITEMS.map(i => [i.name, i.kind, i.price_pence]), [['T-shirt', 'included', null], ['Ball', 'included', null], ['Activity Booklet', 'included', null], ['Racket', 'paid', 1000]])
  const b = exampleBooklet()
  assert.deepEqual(b.weeks.map(w => w.week), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  assert.equal(b.weeks[1].title, 'Forehand')
  assert.ok(b.stickers.length >= 3 && b.stickers.every(s => s.label && s.description))
  assert.doesNotMatch(JSON.stringify([EXAMPLE_ITEMS, b]), /Ten Project/)
})
test('Welcome packs is a module, on by default', () => {
  assert.ok(impactModules({ volunteers: 'V', volunteer: 'V' }).some(m => m.id === 'packs' && !m.locked))
  assert.equal(moduleOn({}, 'packs'), true)
  assert.equal(moduleOn({ modules: { packs: false } }, 'packs'), false)
})
test('an item needs a name, a price when paid, and sizes when sized', () => {
  const draft = extra => ({ name: 'Cap', kind: 'included', price_pence: null, has_sizes: false, sizes: [], low_stock: 10, unit_cost_pence: null, sort: 0, active: true, ...extra })
  assert.equal(itemProblem(draft()), null)
  assert.match(itemProblem(draft({ name: ' ' })), /name/)
  assert.match(itemProblem(draft({ kind: 'paid' })), /price/)
  assert.match(itemProblem(draft({ has_sizes: true })), /size/)
  assert.match(itemProblem(draft({ has_sizes: true, sizes: ['S', 'S'] })), /once/)
})
const never = { from() { throw new Error('should not reach the database') } }
test('stock writes check their input first', async () => {
  await assert.rejects(receiveStock(never, 'hq', 'i', null, 0, ''), /how many/)
  await assert.rejects(receiveStock(never, 'hq', 'i', null, 1.5, ''), /how many/)
  await assert.rejects(adjustStock(never, 'hq', 'i', null, -1, '  '), /why/)
  await assert.rejects(adjustStock(never, 'hq', 'i', null, 0, 'x'), /whole number/)
  await assert.rejects(saveItem(never, 'hq', null, { name: '', kind: 'included', has_sizes: false, sizes: [] }), /name/)
})
test('the example can’t be added on top of an existing pack', async () => {
  const db = { from: () => ({ select: async () => ({ count: 2 }) }) }
  await assert.rejects(useExamplePack(db, 'hq', [], exampleBooklet()), /already has items/)
})

const packCols = extra => readPackColumns(extra, [shirt, ball, racket])
test('import: a size matches the one sized item, ignoring case', () => {
  const r = readPackColumns({ pack_size: '9-10' }, [shirt, ball])
  assert.deepEqual([r.sizeItem?.id, r.size, r.issues], ['shirt', '9-10', []])
})
test('import: a size that isn’t on the list, or that can’t be placed, is a question', () => {
  assert.match(packCols({ pack_size: 'XL' }).issues[0], /isn’t one of the T-shirt sizes/)
  assert.match(readPackColumns({ pack_size: '9-10' }, [shirt, item('s2', 'Hoodie', { has_sizes: true, sizes: ['S'] })]).issues[0], /more than one item has sizes/)
  assert.match(readPackColumns({ pack_size: '9-10' }, [ball]).issues[0], /no item in your pack has sizes/)
})
test('import: Pack issued covers every included item, not paid ones', () => {
  const r = packCols({ pack_issued: '2026-09-10' })
  assert.deepEqual([r.issuedItems.map(i => i.id), r.issuedOn, r.issues], [['shirt', 'ball'], '2026-09-10', []])
  assert.match(readPackColumns({ pack_issued: '2026-09-10' }, [racket]).issues[0], /no included items/)
})
test('import: a payment needs one paid item and a date; the amount defaults to the price', () => {
  assert.deepEqual([packCols({ paid_item_date: '2026-09-10' }).paidPence, packCols({ paid_item_date: '2026-09-10', paid_item_amount: 7.5 }).paidPence], [1000, 750])
  assert.match(packCols({ paid_item_amount: 10 }).issues[0], /no date/)
  assert.match(readPackColumns({ paid_item_date: '2026-09-10' }, [racket, item('r2', 'Bag', { kind: 'paid', price_pence: 500 })]).issues[0], /more than one paid item/)
  assert.match(readPackColumns({ paid_item_date: '2026-09-10' }, [ball]).issues[0], /no paid items/)
})
test('import: blank means nothing recorded, and no questions', () => {
  const r = packCols({})
  assert.deepEqual([r.sizeItem, r.issuedItems, r.paidItem, r.issues], [null, [], null, []])
})
test('import: the four columns are on the sheet and read their types', () => {
  for (const f of ['pack_size', 'pack_issued', 'paid_item_date', 'paid_item_amount']) assert.ok(IMPACT_IMPORT_FIELDS.children.includes(f), f)
  const r = cleanRecord(IMPACT_IMPORT_SCHEMA, 'children', { name: 'Maya Reilly', year_group: 'Y3', photo_consent: 'Yes', pack_size: '9-10', pack_issued: '10/09/2026', paid_item_date: '12/09/2026', paid_item_amount: '£10' })
  assert.deepEqual([r.pack_size, r.pack_issued, r.paid_item_date, r.paid_item_amount, r._review], ['9-10', '2026-09-10', '2026-09-12', 10, undefined])
})
test('import: a date that can’t be read goes to review, not data', () => {
  const r = cleanRecord(IMPACT_IMPORT_SCHEMA, 'children', { name: 'Maya Reilly', year_group: 'Y3', photo_consent: 'Yes', pack_issued: 'last week' })
  assert.equal(r.pack_issued, undefined)
  assert.deepEqual(r._review, ['Couldn’t read Pack issued: last week'])
})
test('import: T-shirt and Racket are accepted as spellings', () => {
  const p = templatePlan({ name: 'Children', rows: [['Name', 'T-shirt size', 'Pack issued', 'Racket paid', 'Racket paid amount']], banners: [] })
  assert.deepEqual(p.columns, { name: 0, pack_size: 1, pack_issued: 2, paid_item_date: 3, paid_item_amount: 4 })
})
test('writes take the org from one helper, not a local lookup', () => {
  const read = f => readFileSync(new URL(`../../src/${f}`, import.meta.url), 'utf8')
  assert.doesNotMatch(read('app/tenproject/[slug]/_components/LeadsTab.tsx'), /auth\.getUser/)
  assert.match(read('lib/impact/org-scope.ts'), /export async function currentHq/)
})

test('cohorts: each programme with children, its latest register and lead coach', () => {
  const child = (id, programme_id) => ({ id, family_id: null, name: id, date_of_birth: null, year_group: 'Y3', school_id: 's', programme_id, medical_notes: null, photo_consent: null, fee_status: 'unknown', stickers: 2 })
  const rows = {
    schools: [{ id: 's', name: 'Harborne' }], campaigns: [], events: [], donations: [], checkins: [],
    programmes: [{ id: 'p1', school_id: 's', term_label: 'Autumn', status: 'running' }, { id: 'p2', school_id: 's', term_label: 'Spring', status: 'planned' }, { id: 'empty', school_id: 's', term_label: 'Summer', status: 'planned' }],
    programmeLinks: [{ id: 'p1', lead_staff_id: 'st', venue_id: null }],
    children: [child('a', 'p1'), child('b', 'p1'), child('c', 'p2')],
    sessions: [{ id: 'old', kind: 'school', programme_id: 'p1', session_date: '2026-09-01' }, { id: 'new', kind: 'school', programme_id: 'p1', session_date: '2026-09-08' }, { id: 'w', kind: 'weekend', programme_id: 'p1', session_date: '2026-09-12' }],
    attendance: [{ session_id: 'old', child_id: 'b', present: true }, { session_id: 'new', child_id: 'a', present: true }],
  }
  const c = buildCohorts(rows)
  assert.deepEqual(c.map(x => [x.id, x.label, x.sessionId, x.leadStaffId]), [['p1', 'Harborne — Autumn', 'new', 'st'], ['p2', 'Harborne — Spring', null, null]])
  assert.deepEqual(c[0].children.map(k => [k.id, k.present]), [['a', true], ['b', false]], 'present at the latest session')
  assert.equal(buildPeople(rows).unlinkedChildren[0].schoolId, 's')
})
test('an org with no programmes has no cohorts', () => assert.deepEqual(buildCohorts({ schools: [], programmes: [], campaigns: [], events: [], donations: [], checkins: [] }), []))
