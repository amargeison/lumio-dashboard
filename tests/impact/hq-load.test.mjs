// The live HQ load (src/lib/impact/hq-load.ts) on Lumio Test's real rows, as
// recorded from the live database on 11 Nov 2026 (lumio-test-hq-rows.json; the
// one real email address replaced). The fake client below answers each query
// the way PostgREST would: filters, order, range, limit, maybeSingle, columns.
// Regression for 11 Nov: the Lumio Test HQ signed in to an empty portal.
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
const { loadHqData, loadErrorLine } = await import('../../src/lib/impact/hq-load.ts')

const HQ = '0daaebe5-dc75-45b0-9ea9-60403acf0e87'
const TODAY = '2026-11-11'
const FIXTURE = JSON.parse(readFileSync(new URL('./lumio-test-hq-rows.json', import.meta.url), 'utf8'))

/** A read-only stand-in for supabase-js over fixed tables. `fail` makes a table answer with an error. */
function fakeDb(tables, fail = {}) {
  const queried = []
  const from = table => {
    const q = { cols: '*', filters: [], orders: [], range: null, limit: null, single: false }
    const b = {
      select(cols) { q.cols = cols; return b },
      eq(c, v) { q.filters.push(r => r[c] === v); return b },
      not(c, op, v) { assert.equal(op, 'is'); q.filters.push(r => r[c] !== v); return b },
      order(c, o = {}) { q.orders.push([c, o.ascending !== false]); return b },
      range(a, z) { q.range = [a, z]; return b },
      limit(n) { q.limit = n; return b },
      maybeSingle() { q.single = true; return b },
      then(ok, ko) {
        queried.push(table)
        let res
        if (fail[table]) res = { data: null, error: fail[table] }
        else {
          let rows = (tables[table] ?? []).filter(r => q.filters.every(f => f(r)))
          for (const [c, asc] of [...q.orders].reverse()) rows = [...rows].sort((x, y) => (x[c] === y[c] ? 0 : x[c] == null ? 1 : y[c] == null ? -1 : x[c] < y[c] ? -1 : 1) * (asc ? 1 : -1))
          if (q.range) rows = rows.slice(q.range[0], q.range[1] + 1)
          if (q.limit != null) rows = rows.slice(0, q.limit)
          if (q.cols.trim() !== '*') {
            const cols = q.cols.split(',').map(c => c.trim())
            rows = rows.map(r => Object.fromEntries(cols.map(c => [c, r[c] ?? null])))
          }
          res = { data: q.single ? rows[0] ?? null : rows, error: null }
        }
        return Promise.resolve(res).then(ok, ko)
      },
    }
    return b
  }
  return { from, queried }
}

const quiet = async f => { const e = console.error; console.error = () => {}; try { return await f() } finally { console.error = e } }

test('the fixture is Lumio Test as it was: 7 schools, 13 children, the seeded booklet', () => {
  assert.equal(FIXTURE.tp_schools.length, 7)
  assert.equal(FIXTURE.tp_children.length, 13)
  assert.equal(FIXTURE.tp_booklet.length, 1)
  assert.ok(FIXTURE.tp_schools.every(s => s.hq_id === HQ))
  assert.doesNotMatch(JSON.stringify(FIXTURE), /gmail/)
})

test('full HQ load on Lumio Test: 7 schools come through, nothing fails', async () => {
  const db = fakeDb(FIXTURE)
  const stages = []
  const load = await loadHqData(db, HQ, TODAY, s => stages.push(s))
  assert.deepEqual(load.errors, [])
  assert.deepEqual(stages, ['fetches done', 'mapped'])
  assert.equal(load.rows.schools.length, 7)
  assert.equal(load.data.SCHOOLS.length, 7)
  assert.equal(load.data.HQ_STATS.schoolsTotal, 7)
  assert.equal(load.rows.children.length, 13)
  assert.ok(load.people, 'people mapped')
  assert.ok(load.insights, 'insights mapped')
  assert.ok(load.cohorts, 'cohorts mapped')
  assert.ok(load.familySessions, 'family sessions mapped')
  assert.equal(load.packs.items.length, 4)
  assert.equal(load.packs.booklet?.title, 'Activity Booklet', 'the seeded booklet reaches the view')
  assert.equal(load.packs.booklet.weeks.length, 10)
  assert.equal(loadErrorLine(load.errors), null)
  for (const t of ['tp_schools', 'tp_children', 'tp_booklet', 'impact_messages']) assert.ok(db.queried.includes(t), t)
})

test('a failing read is reported by step, and everything else still maps', async () => {
  const db = fakeDb(FIXTURE, { tp_children: { code: '57014', message: 'canceling statement due to statement timeout' } })
  const load = await quiet(() => loadHqData(db, HQ, TODAY))
  assert.deepEqual(load.errors, [{ step: 'children', message: 'canceling statement due to statement timeout' }])
  assert.equal(load.data.SCHOOLS.length, 7, 'schools still show')
  assert.equal(load.rows.children.length, 0)
  assert.equal(loadErrorLine(load.errors), 'canceling statement due to statement timeout (children)')
})

test('a table from an unapplied draft reads as empty without a banner', async () => {
  const load = await loadHqData(fakeDb(FIXTURE, { tp_cpd: { code: 'PGRST205', message: 'Could not find the table' } }), HQ, TODAY)
  assert.deepEqual(load.errors, [])
  assert.equal(load.data.SCHOOLS.length, 7)
})

test('several failures: the banner names the first and counts the rest', async () => {
  const boom = { code: '500', message: 'boom' }
  const load = await quiet(() => loadHqData(fakeDb(FIXTURE, { tp_schools: boom, tp_staff: boom }), HQ, TODAY))
  assert.equal(load.errors.length, 2)
  assert.equal(loadErrorLine(load.errors), 'boom (schools) and 1 more')
  assert.equal(load.rows.children.length, 13)
})
