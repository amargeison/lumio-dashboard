import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
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
const { IMPACT_IMPORT_SCHEMA, IMPACT_IMPORT_FIELDS, IMPACT_ENUMS, readFlag, readGender } = await import('../../src/lib/impact/import-schema.ts')
const { cleanRecord } = await import('../../src/lib/import-engine/records.ts')
const { headingFor, templatePlan } = await import('../../src/lib/impact/import-template.ts')

// A complete child, so the only review items are the ones under test.
const child = extra => cleanRecord(IMPACT_IMPORT_SCHEMA, 'children', { name: 'Maya Reilly', year_group: 'Y3', photo_consent: 'Yes', ...extra })

test('the four fields are on their sheets', () => {
  for (const f of ['gender', 'fsm', 'pupil_premium']) assert.ok(IMPACT_IMPORT_FIELDS.children.includes(f), f)
  assert.ok(IMPACT_IMPORT_FIELDS.volunteers.includes('first_aid_expiry'))
  assert.deepEqual(IMPACT_ENUMS['children.gender'], ['female', 'male', 'other', 'prefer_not_to_say'])
})
test('flags: Y/Yes/True/1 and N/No/False/0, in any case', () => {
  for (const v of ['Y', 'y', 'Yes', 'YES', 'True', 'TRUE', '1', 1, true]) assert.equal(readFlag(v), true, String(v))
  for (const v of ['N', 'n', 'No', 'NO', 'False', 'FALSE', '0', 0, false]) assert.equal(readFlag(v), false, String(v))
})
test('flags: anything else is never guessed', () => {
  for (const v of ['maybe', 'x', '✓', 'ok', 'n/a', 'tbc', 'unknown', '2', 'Yes?']) assert.equal(readFlag(v), null, v)
})
test('a blank flag is left unset, not false, and raises nothing', () => {
  for (const blank of ['', '   ', null, undefined]) {
    const r = child({ fsm: blank, pupil_premium: blank, gender: blank })
    assert.deepEqual([r.fsm, r.pupil_premium, r.gender, r._review], [undefined, undefined, undefined, undefined])
  }
})
test('a flag that can’t be read goes to Needs review, and into notes, not data', () => {
  const r = child({ fsm: 'maybe', pupil_premium: 'tbc' })
  assert.deepEqual([r.fsm, r.pupil_premium], [undefined, undefined])
  assert.deepEqual(r._review, ['Couldn’t read FSM: maybe', 'Couldn’t read Pupil premium: tbc'])
  assert.match(r.notes, /FSM: maybe/)
})
test('the looser consent words are not accepted for a flag', () => {
  for (const v of ['x', 'ok', '✓', 'given']) {
    const r = child({ fsm: v })
    assert.equal(r.fsm, undefined, v)
    assert.deepEqual(r._review, [`Couldn’t read FSM: ${v}`])
  }
})
test('a readable flag is saved', () => assert.deepEqual([child({ fsm: 'Y' }).fsm, child({ pupil_premium: '0' }).pupil_premium], [true, false]))
test('gender: M/F, Male/Female, Boy/Girl and the two other values', () => {
  for (const [v, want] of [['F', 'female'], ['f', 'female'], ['Female', 'female'], ['girl', 'female'], ['M', 'male'], ['MALE', 'male'], ['Boy', 'male'], ['Other', 'other'], ['Prefer not to say', 'prefer_not_to_say'], ['prefer_not_to_say', 'prefer_not_to_say']]) assert.equal(readGender(v), want, v)
})
test('gender: anything else goes to review', () => {
  assert.equal(readGender('X'), null)
  const r = child({ gender: 'unsure' })
  assert.equal(r.gender, undefined)
  assert.deepEqual(r._review, ['Couldn’t read Gender: unsure'])
})
test('volunteer first aid reads as a date, like a coach’s', () => {
  const v = extra => cleanRecord(IMPACT_IMPORT_SCHEMA, 'volunteers', { name: 'Leah Ferraro', ...extra })
  assert.equal(v({ first_aid_expiry: '31/03/2027' }).first_aid_expiry, '2027-03-31')
  assert.deepEqual(v({ first_aid_expiry: 'soon' })._review, ['Couldn’t read First aid: soon'])
})
const plan = (name, ...headers) => templatePlan({ name, rows: [headers], banners: [] })
test('common spellings map without AI', () => {
  const p = plan('Children', 'Name', 'Sex', 'Free school meals', 'Pupil Premium')
  assert.deepEqual(p.columns, { name: 0, gender: 1, fsm: 2, pupil_premium: 3 })
  assert.deepEqual(plan('Children', 'Name', 'M/F', 'FSM', 'PP').columns, { name: 0, gender: 1, fsm: 2, pupil_premium: 3 })
  assert.equal(plan('Volunteers', 'Name', 'First aid').columns.first_aid_expiry, 1)
})
test('a spelling only counts on its own sheet', () => assert.equal(plan('Coaches', 'Name', 'PP'), null))
test('the template’s own headings round-trip', () => {
  assert.equal(headingFor('fsm'), 'FSM')
  assert.equal(headingFor('pupil_premium'), 'Pupil premium')
  assert.ok(plan('Children', ...IMPACT_IMPORT_FIELDS.children.map(headingFor)))
  assert.ok(plan('Volunteers', ...IMPACT_IMPORT_FIELDS.volunteers.map(headingFor)))
})
