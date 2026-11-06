import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

// live-context.ts uses the @/ alias and extensionless imports, which node --test can't resolve alone.
const src = fileURLToPath(new URL('../../src/', import.meta.url))
registerHooks({
  resolve(spec, ctx, next) {
    const base = spec.startsWith('@/') ? src + spec.slice(2) : spec.startsWith('./') && ctx.parentURL?.includes('/src/') ? fileURLToPath(new URL(spec, ctx.parentURL)) : null
    if (base && !/\.tsx?$/.test(base) && existsSync(`${base}.ts`)) return next(pathToFileURL(`${base}.ts`).href, ctx)
    return base ? next(pathToFileURL(base).href, ctx) : next(spec, ctx)
  },
})
const { mapLiveRows } = await import('../../src/lib/impact/live-context.ts')
const { inTerm, termOf } = await import('../../src/lib/impact/term.ts')
const { dayLabel, outstandingRegisters } = await import('../../src/lib/impact/registers.ts')
const tp = await import('../../src/data/tenproject/demo-data.ts')
const impactDemo = await import('../../src/data/impact/demo-data.ts')

const today = '2026-11-05'
const noRows = { schools: [], programmes: [], campaigns: [], events: [], donations: [], checkins: [] }
const school = (id, status) => ({ id, name: id, status, borough: null, address: null, head_name: null, pe_lead_name: null, safeguarding_lead: null, contact_email: null, contact_phone: null, funding_source: null, notes: null })
const programme = (id, school_id) => ({ id, school_id, term_label: 'Autumn 2026', year_groups: null, current_week: 0, status: 'running', cost_pence: null })
const child = (id, school_id, programme_id) => ({ id, family_id: null, name: id, date_of_birth: null, year_group: 'Y3', school_id, programme_id, medical_notes: null, photo_consent: null, fee_status: 'unknown', stickers: 0, send: null })
const session = (id, programme_id, session_date) => ({ id, kind: 'school', programme_id, venue_id: null, session_date, lead_staff_id: null })
const mark = (session_id, child_id, present = true) => ({ session_id, child_id, present, via: 'register' })

// Same shape as the Lumio Test org: six schools, two running with six children, two Sept sessions each.
const harborne = [1, 2, 3, 4, 5, 6].map(n => child(`h${n}`, 'harborne', 'hp'))
const willowbank = [1, 2, 3, 4, 5, 6].map(n => child(`w${n}`, 'willowbank', 'wp'))
const lumioTest = {
  ...noRows,
  schools: [school('hollinsmere', 'confirmed'), school('netherby', 'enquiry'), school('aldric', 'fundraising'), school('kingsmead', 'renewal'), school('harborne', 'running'), school('willowbank', 'running')],
  programmes: [programme('hp', 'harborne'), programme('wp', 'willowbank')],
  children: [...harborne, ...willowbank, child('loose', null, null)],
  sessions: [session('s1', 'hp', '2026-09-15'), session('s2', 'wp', '2026-09-17'), session('s3', 'hp', '2026-09-22'), session('s4', 'wp', '2026-09-24')],
  attendance: [...['s1', 's3'].flatMap(s => harborne.map(k => mark(s, k.id))), ...['s2', 's4'].flatMap(s => willowbank.map(k => mark(s, k.id)))],
}
const stats = (rows, on = today) => mapLiveRows(rows, on).HQ_STATS
const funnelSum = s => s.schoolsActive + s.schoolsPipeline + s.schoolsComplete

test('Lumio Test: 2 active, 3 pipeline, 1 complete, of 6', () => {
  const s = stats(lumioTest)
  assert.deepEqual([s.schoolsActive, s.schoolsPipeline, s.schoolsComplete, s.schoolsTotal], [2, 3, 1, 6])
})
test('Lumio Test: 12 children reached this term, each counted once', () => {
  assert.equal(stats(lumioTest).childrenThisTerm, 12)
})
test('an empty org: 0 of 0, nobody reached, no NaN', () => {
  const s = stats(noRows)
  assert.deepEqual([s.schoolsActive, s.schoolsPipeline, s.schoolsComplete, s.schoolsTotal, s.childrenThisTerm], [0, 0, 0, 0, 0])
  assert.doesNotMatch(JSON.stringify(s), /NaN|null/)
  assert.deepEqual([s.registersOutstanding, s.weekendVisitsThisTerm, s.outstandingRegisters], [0, 0, []])
})
test('the funnel adds up to the school count', () => {
  for (const rows of [lumioTest, noRows]) {
    const s = stats(rows)
    assert.equal(funnelSum(s), rows.schools.length)
  }
})
test('every school status lands in exactly one tile', () => {
  const all = ['enquiry', 'fundraising', 'confirmed', 'running', 'complete', 'renewal']
  const s = stats({ ...noRows, schools: all.map((st, i) => school(`s${i}`, st)) })
  assert.deepEqual([s.schoolsActive, s.schoolsPipeline, s.schoolsComplete], [1, 3, 2])
  assert.equal(funnelSum(s), all.length)
})
test('reach leaves out absences and other terms', () => {
  const rows = { ...lumioTest, sessions: [session('a', 'hp', '2026-07-10'), session('b', 'hp', '2026-09-08'), session('c', 'hp', '2027-01-12')], attendance: [mark('a', 'h1'), mark('b', 'h2'), mark('b', 'h3', false), mark('c', 'h4')] }
  assert.equal(stats(rows).childrenThisTerm, 1)
  assert.equal(stats(rows, '2027-02-01').childrenThisTerm, 1)
  assert.equal(stats(rows, '2026-08-01').childrenThisTerm, 1)
})
const weekend = (id, date) => ({ ...session(id, null, date), kind: 'weekend' })
test('weekend visits: this term only, one session this term and one last term → 1', () => {
  const rows = { ...noRows, sessions: [weekend('now', '2026-10-03'), weekend('then', '2026-06-13')], attendance: [mark('now', 'c1'), mark('then', 'c1')] }
  assert.equal(stats(rows).weekendVisitsThisTerm, 1)
})
test('weekend visits count child × session, not distinct children, and skip absences and school sessions', () => {
  const rows = { ...noRows,
    sessions: [weekend('a', '2026-10-03'), weekend('b', '2026-10-10'), session('s', null, '2026-10-05')],
    attendance: [mark('a', 'c1'), mark('b', 'c1'), mark('b', 'c2'), mark('b', 'c3', false), mark('s', 'c1')] }
  assert.equal(stats(rows).weekendVisitsThisTerm, 3)
})
test('weekend visits include this term’s QR check-ins by children_count, and not last term’s', () => {
  const rows = { ...noRows, checkins: [{ children_count: 3, session_date: '2026-10-03' }, { children_count: null, session_date: '2026-10-10' }, { children_count: 5, session_date: '2026-06-13' }] }
  assert.equal(stats(rows).weekendVisitsThisTerm, 4)
})

const staffRow = (id, name) => ({ id, name, role: 'coach', qualification: null, email: null, phone: null, availability: null, specialisms: null, dbs_status: 'valid', dbs_number: null, dbs_expiry: '2028-01-01', safeguarding_date: '2026-01-01', first_aid_expiry: '2028-01-01', insurance: null, notes: null })
const withSession = (date, marks = []) => ({ ...noRows, schools: [school('harborne', 'running')], programmes: [programme('hp', 'harborne')], staff: [staffRow('st', 'Sam Okafor')], sessions: [{ ...session('s', 'hp', date), lead_staff_id: 'st' }], attendance: marks })
const on = '2026-11-06'
test('registers: a session 3 days ago with no marks → 1', () => {
  const s = stats(withSession('2026-11-03'), on)
  assert.equal(s.registersOutstanding, 1)
  assert.deepEqual(s.outstandingRegisters.map(r => [r.school, r.dateLabel, r.coach]), [['harborne', 'Tue 3 Nov', 'Sam Okafor']])
})
test('registers: the same session with one mark → 0', () => assert.equal(stats(withSession('2026-11-03', [mark('s', 'c1', false)]), on).registersOutstanding, 0))
test('registers: a session 20 days ago → 0', () => assert.equal(stats(withSession('2026-10-17'), on).registersOutstanding, 0))
test('registers: the window is 14 days back to today, and a future session isn’t missing', () => {
  assert.equal(stats(withSession('2026-10-23'), on).registersOutstanding, 1, '14 days ago')
  assert.equal(stats(withSession('2026-10-22'), on).registersOutstanding, 0, '15 days ago')
  assert.equal(stats(withSession(on), on).registersOutstanding, 1, 'today')
  assert.equal(stats(withSession('2026-11-07'), on).registersOutstanding, 0, 'tomorrow')
})
test('registers: one Needs attention line each, which doesn’t change the certificates tile', () => {
  const d = mapLiveRows(withSession('2026-11-03'), on)
  assert.deepEqual(d.NEEDS_ATTENTION.map(i => [i.text, i.kind, i.target]), [['Register missing — harborne, Tue 3 Nov', 'warn', { tab: 'overview', id: 'registers' }]])
  assert.equal(d.HQ_STATS.dbsExpiring, 0)
})
test('registers: a weekend session shows its venue, and a missing coach shows a dash', () => {
  const rows = { ...noRows, venues: [{ id: 'v', name: 'Rec Ground' }], sessions: [{ ...weekend('w', '2026-11-01'), venue_id: 'v' }] }
  assert.deepEqual(outstandingRegisters(rows, on).map(r => [r.school, r.coach]), [['Rec Ground', '—']])
})
test('registers: newest first', () => {
  const rows = { ...noRows, sessions: [session('a', null, '2026-10-30'), session('b', null, '2026-11-04')] }
  assert.deepEqual(outstandingRegisters(rows, on).map(r => r.id), ['b', 'a'])
})
test('dayLabel', () => assert.equal(dayLabel('2026-09-30'), 'Wed 30 Sept'))

test('term boundaries', () => {
  for (const [date, name] of [['2026-09-01', 'Autumn'], ['2026-12-31', 'Autumn'], ['2027-01-01', 'Spring'], ['2027-03-31', 'Spring'], ['2027-04-01', 'Summer'], ['2027-07-20', 'Summer'], ['2027-08-31', 'Summer']]) {
    assert.equal(termOf(date).name, name, date)
    assert.ok(inTerm(date, termOf(date)))
  }
  assert.ok(!inTerm('2026-08-31', termOf('2026-09-01')))
})
test('the demo keeps its hand-written tiles', () => {
  for (const d of [tp, impactDemo]) {
    assert.deepEqual(Object.keys(d.HQ_STATS), ['childrenThisWeek', 'schoolsRunning', 'schoolsPipeline', 'weekendVisitsThisTerm', 'registersOutstanding', 'dbsExpiring'])
  }
  assert.equal(tp.HQ_STATS.childrenThisWeek, 214)
})
