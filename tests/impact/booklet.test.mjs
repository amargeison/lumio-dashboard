import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
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
const { httpsUrl, readBookletJson } = await import('../../src/lib/impact/booklet-import.ts')
const { MAX_BOOKLET_PDF_BYTES, bookletPath, isUuid, pdfProblem, pdfSize, printKitLine } = await import('../../src/lib/impact/booklet-pdf.ts')
const { scorecardOn, scorecardTotal, videoLink } = await import('../../src/lib/impact/parent-view.ts')
const { exampleBooklet } = await import('../../src/lib/impact/pack-example.ts')
const { headlineTiles } = await import('../../src/lib/impact/insights.ts')
const { EMPTY_PACKS } = await import('../../src/lib/impact/packs.ts')

const good = (o = {}) => JSON.stringify({
  title: 'A Booklet', intro: 'Hello', motto: 'Play.', values: 'Fair.', website: 'www.example.org', hashtag: '#x',
  warm_up: { title: 'Warm', text: 'Move', did_you_know: ['Fact'] },
  weeks: [{ week: 2, title: 'Two', focus: 'f', top_tip: 't', did_you_know: 'd', home_task: 'h', video: 'forehand' }, { week: 1, title: 'One' }, { week: 10, title: 'Ten', scorecard: true }],
  stickers: [{ id: 'a', label: 'A', description: 'd' }], completion: 'Done', tenors: 'Join', notes_prompt: 'List', source: 'somewhere', ...o,
})

test('import: a good file comes through, in week order, with unknown keys left out', () => {
  const { booklet, problems } = readBookletJson(good())
  assert.deepEqual(problems, [])
  assert.deepEqual(booklet.weeks.map(w => w.week), [1, 2, 10])
  assert.equal(booklet.weeks[1].top_tip, 't')
  assert.equal(booklet.weeks[2].scorecard, true)
  assert.equal('source' in booklet, false)
  assert.equal('videos' in booklet, false)
  assert.deepEqual(booklet.warm_up.did_you_know, ['Fact'])
})

const realFile = `${homedir()}/Documents/Lumio Impact/Ten Project/booklet/ten-project-booklet.json`
test('import: accepts the real booklet file', { skip: !existsSync(realFile) }, () => {
  const { booklet, problems } = readBookletJson(readFileSync(realFile, 'utf8'))
  assert.deepEqual(problems, [])
  assert.equal(booklet.weeks.length, 10)
  assert.equal(booklet.stickers.length, 6)
  assert.equal(scorecardOn(booklet), true)
})

test('import: says what is wrong and saves nothing', () => {
  const bad = (raw, re) => { const r = readBookletJson(raw); assert.equal(r.booklet, null); assert.match(r.problems.join(' '), re) }
  bad('not json', /valid JSON/)
  bad('[1]', /isn’t a booklet/)
  bad(good({ title: '' }), /needs a title/)
  bad(good({ weeks: [] }), /list of weeks/)
  bad(good({ weeks: Array.from({ length: 11 }, (_, i) => ({ week: i + 1 })) }), /more than ten/)
  bad(good({ weeks: [{ week: 11 }] }), /from 1 to 10/)
  bad(good({ weeks: [{ week: 1 }, { week: 1 }] }), /twice/)
  bad(good({ weeks: [{ week: 1, video: 'Not A Key!' }] }), /short key/)
  bad(good({ weeks: [{ week: 1, scorecard: 'yes' }] }), /true or false/)
  bad(good({ weeks: [{ week: 1, title: 5 }] }), /should be text/)
  bad(good({ stickers: 'x' }), /list of stickers/)
  bad(good({ stickers: [{ id: 'a' }] }), /id and a label/)
  bad(good({ stickers: [{ id: 'a', label: 'A' }, { id: 'a', label: 'B' }] }), /twice/)
  bad(good({ warm_up: [] }), /should be an object/)
  bad(good({ intro: 'x'.repeat(4001) }), /too long/)
  bad(good({ videos: { forehand: 'http://insecure.example' } }), /https/)
  bad(good({ videos: { forehand: 'javascript:alert(1)' } }), /https/)
})

test('video link: https only, and only for a key the org has', () => {
  const b = { videos: { forehand: 'https://example.org/v', backhand: 'javascript:alert(1)', serve: '#' } }
  assert.equal(videoLink(b, 'forehand'), 'https://example.org/v')
  assert.equal(videoLink(b, 'backhand'), null)
  assert.equal(videoLink(b, 'serve'), null)
  assert.equal(videoLink(b, 'volley'), null)
  assert.equal(videoLink(b, undefined), null)
  assert.equal(videoLink(null, 'forehand'), null)
  assert.equal(httpsUrl('https://a.b'), true)
})

const PDF = new TextEncoder().encode('%PDF-1.7')
test('PDF rules: the bytes and the size decide', () => {
  assert.equal(pdfProblem(100, 'application/pdf', PDF), null)
  assert.equal(pdfProblem(MAX_BOOKLET_PDF_BYTES, 'application/pdf', PDF), null)
  assert.match(pdfProblem(MAX_BOOKLET_PDF_BYTES + 1, 'application/pdf', PDF), /10 MB/)
  assert.match(pdfProblem(0, 'application/pdf', PDF), /empty/)
  assert.match(pdfProblem(100, 'application/pdf', new TextEncoder().encode('<html>')), /isn’t a PDF/)
  assert.match(pdfProblem(100, 'text/html', PDF), /isn’t a PDF/)
})

test('PDF path comes from the org', () => {
  assert.equal(bookletPath('abc'), 'abc/booklet.pdf')
  assert.equal(isUuid('00000000-0000-0000-0000-000000000001'), true)
  assert.equal(isUuid('../../etc'), false)
  assert.equal(isUuid(null), false)
  assert.equal(pdfSize(3413656), '3.3 MB')
})

const item = (o = {}) => ({ id: 'b', name: 'Activity Booklet', kind: 'included', price_pence: null, has_sizes: false, sizes: [], low_stock: 10, unit_cost_pence: null, sort: 0, active: true, ...o })
test('print kit line: booklet stock from the pack items', () => {
  assert.match(printKitLine(EMPTY_PACKS).text, /no booklet/)
  assert.deepEqual(printKitLine({ ...EMPTY_PACKS, items: [item()], stock: [{ item_id: 'b', size: null, qty: 40 }] }), { text: 'Print kit: 40 booklets in stock', low: false })
  assert.deepEqual(printKitLine({ ...EMPTY_PACKS, items: [item()], stock: [{ item_id: 'b', size: null, qty: 1 }] }), { text: 'Print kit: 1 booklet in stock', low: true })
  assert.match(printKitLine({ ...EMPTY_PACKS, items: [item({ name: 'Ball' })] }).text, /no booklet/)
})

test('scorecard: on only with week 10 set, and totals skip blanks', () => {
  assert.equal(scorecardOn({ weeks: [{ week: 10, scorecard: true }] }), true)
  assert.equal(scorecardOn({ weeks: [{ week: 10 }] }), false)
  assert.equal(scorecardOn({ weeks: [{ week: 9, scorecard: true }] }), false)
  assert.equal(scorecardOn(null), false)
  assert.equal(scorecardTotal([{ a: 11, b: 7 }, { a: null, b: 4 }], 'a'), 11)
  assert.equal(scorecardTotal([{ a: 11, b: 7 }, { a: null, b: 4 }], 'b'), 11)
})

test('demo booklet: Rally Ten, with the new fields', () => {
  const b = exampleBooklet()
  assert.ok(b.weeks.every(w => w.top_tip && w.did_you_know && w.video))
  assert.equal(scorecardOn(b), true)
  assert.doesNotMatch(JSON.stringify(b), /Ten Project/)
})

test('HQ Sessions delivered leaves out sessions still to come', () => {
  const s = d => ({ session_date: d })
  const rows = { schools: [], children: [], families: [], attendance: [], sessions: [s('2026-10-01'), s('2026-11-06'), s('2026-12-01')] }
  assert.equal(headlineTiles(rows, '2026-11-06').find(t => t.label === 'Sessions delivered').value, '2')
})
