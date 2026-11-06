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
const { bookletWritten, childLine, emailTicked, optsBackIn, stickerAreas, ukDay } = await import('../../src/lib/impact/parent-view.ts')
const { ageFrom } = await import('../../src/lib/impact/member-actions.ts')
const { PARENT, STICKER_AREAS } = await import('../../src/data/impact/demo-data.ts')
const { cohortLabel, cohortStage, nextSevenDays } = await import('../../src/lib/impact/register-session.ts')
const { certNote, staffCertificates } = await import('../../src/lib/impact/compliance.ts')

test('child line: age and school only when there is one', () => {
  assert.equal(childLine({ name: 'Sam', age: ageFrom(null), school: '' }), 'Sam')
  assert.equal(childLine({ name: 'Sam', age: 8, school: '' }), 'Sam, 8')
  assert.equal(childLine({ name: 'Sam', age: 0, school: 'Hollinsmere Primary' }), 'Sam — Hollinsmere Primary')
  assert.equal(childLine({ name: 'Sam', age: 8, school: 'Hollinsmere Primary' }), 'Sam, 8 — Hollinsmere Primary')
  assert.equal(childLine({ name: 'Sam', age: null, school: null }), 'Sam')
})

const STAMP = '2026-11-05T00:14:21.571+00:00'

test('email: an unsubscribe beats the stored flag', () => {
  assert.equal(emailTicked({ opt_in_email: true, unsubscribed_at: STAMP }), false)
  assert.equal(emailTicked({ opt_in_email: true, unsubscribed_at: null }), true)
  assert.equal(emailTicked({ opt_in_email: false, unsubscribed_at: null }), false)
})

test('email: only a tick on an unsubscribed family opts back in', () => {
  assert.equal(optsBackIn({ opt_in_email: true, unsubscribed_at: STAMP }, true), true)
  assert.equal(optsBackIn({ opt_in_email: true, unsubscribed_at: STAMP }, false), false)
  assert.equal(optsBackIn({ opt_in_email: true, unsubscribed_at: null }, true), false)
})

test('unsubscribed date reads as the UK day', () => {
  assert.equal(ukDay(STAMP), '5 Nov')
  assert.equal(ukDay('2026-07-05T23:30:00+00:00'), '6 Jul')
})

const demo = [{ id: 'a', label: 'A', desc: '' }, { id: 'b', label: 'B', desc: '' }]
const booklet = (o = {}) => ({ title: '', intro: '', weeks: [], stickers: [], ...o })

test('stickers: the count is the org booklet, never a constant', () => {
  assert.deepEqual(stickerAreas(null, true, demo), [])
  assert.deepEqual(stickerAreas(booklet(), true, demo), [])
  assert.equal(stickerAreas(booklet({ stickers: [{ id: '1', label: 'One', description: 'd' }] }), true, demo).length, 1)
  assert.equal(stickerAreas(booklet({ stickers: Array.from({ length: 9 }, (_, i) => ({ id: `${i}`, label: 'x', description: '' })) }), true, demo).length, 9)
  assert.equal(stickerAreas(null, false, demo).length, 2)
})

test('the demo keeps its six stickers and its child lines', () => {
  assert.equal(stickerAreas(null, false, STICKER_AREAS).length, 6)
  assert.deepEqual(PARENT.children.map(childLine), ['Ella, 7 — Hollinsmere Primary', 'Sam, 5 — Hollinsmere Primary'])
})

test('booklet counts as written once it has anything in it', () => {
  assert.equal(bookletWritten(null), false)
  assert.equal(bookletWritten(booklet({ weeks: [{ week: 1, title: '', focus: '', home_task: '' }] })), false)
  assert.equal(bookletWritten(booklet({ title: 'Ours' })), true)
  assert.equal(bookletWritten(booklet({ weeks: [{ week: 2, title: '', focus: 'Rallies', home_task: '' }] })), true)
})

test('no hard-coded sticker total in the parent app or the register', () => {
  for (const f of ['ParentApp', 'RegisterViews']) {
    const src = readFileSync(new URL(`../../src/app/tenproject/[slug]/_components/${f}.tsx`, import.meta.url), 'utf8')
    assert.doesNotMatch(src, /\/6\b|\/ 6\b|\|\| 6\b/, f)
  }
})

test('cohort label: the school is never printed twice', () => {
  assert.equal(cohortLabel('Harborne Fields Primary', 'Autumn 2026 — Harborne Fields'), 'Harborne Fields Primary — Autumn 2026')
  assert.equal(cohortLabel('Hollinsmere Academy', 'Spring 2027 — Hollinsmere'), 'Hollinsmere Academy — Spring 2027')
  assert.equal(cohortLabel('Harborne Fields Primary', 'Harborne Fields Primary — Autumn 2026'), 'Harborne Fields Primary — Autumn 2026')
  assert.equal(cohortLabel('Oak Primary', 'Autumn 2026'), 'Oak Primary — Autumn 2026')
  assert.equal(cohortLabel('Oak Primary', 'Autumn 2026 — Y3 Otters'), 'Oak Primary — Autumn 2026 — Y3 Otters')
  assert.equal(cohortLabel('Oak Primary', 'Oak'), 'Oak Primary')
  // A word shared with the school isn't the school.
  assert.equal(cohortLabel('Oak Primary', 'Autumn 2026 — Oakwood'), 'Oak Primary — Autumn 2026 — Oakwood')
})

test('cohort stage: never Week 0', () => {
  assert.equal(cohortStage(0, 0), 'Not started')
  assert.equal(cohortStage(0, 1), '1 session so far')
  assert.equal(cohortStage(0, 2, true), '2 sessions so far')
  assert.equal(cohortStage(4, 7), 'Week 4')
  assert.equal(cohortStage(4, 7, true), 'Week 4 of 10')
})

test('next seven days: today to six days on, soonest first', () => {
  const at = d => ({ session_date: d })
  const got = nextSevenDays([at('2026-11-12'), at('2026-11-05'), at('2026-11-06'), at('2026-11-13')], '2026-11-06')
  assert.deepEqual(got.map(s => s.session_date), ['2026-11-06', '2026-11-12'])
  assert.deepEqual(nextSevenDays([at('2026-12-31'), at('2027-01-01')], '2026-12-30').length, 2)
})

test('certificates: the coach gets the states HQ gets', () => {
  const certs = staffCertificates({ dbs_status: 'valid', dbs_expiry: '2026-12-01', first_aid_expiry: '2026-09-30', safeguarding_date: null }, '2026-11-06')
  assert.deepEqual(certs.map(c => [c.name, c.state]), [['DBS', 'expiring'], ['First aid', 'expired'], ['Safeguarding', 'not recorded']])
  assert.deepEqual(certs.map(certNote), ['expires 1 Dec 2026', 'expired 30 Sept 2026', 'not recorded'])
  assert.equal(certNote({ name: 'DBS', date: '2027-06-01', state: 'ok' }), '1 Jun 2027')
  assert.equal(certNote({ name: 'DBS', date: null, state: 'ok' }), 'Recorded')
})
