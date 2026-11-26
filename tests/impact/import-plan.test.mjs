// The importer on the small Brackenmoor fixture: the template path, the AI path (with
// the plans a real AI call returned for this file, recorded by
// scripts/impact-import-test.mjs RECORD_AI=1), duplicates and re-imports, Community
// rows, limits, and the undo fingerprints. The database side of undo (and cross-org)
// is in scripts/impact-import-test.mjs, against a running app.
import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import * as B from './brackenmoor.mjs'

const { planImport, cleanForPlan, emptyExisting, countRecords, MAX_IMPORT_ROWS, MAX_IMPORT_BYTES } = B.plan
const { fingerprint, editedSince } = await import('../../src/lib/impact/import-run.ts')
const { readTemplateSheet, templateSheets } = await import('../../src/lib/impact/import-template.ts')

const sheets = await B.fixtureSheets()
const viaTemplate = async () => B.readRecords(await B.readWorkbook(await B.workbookFile(B.asTemplate(sheets), 'Brackenmoor template.xlsx')))
const run = (found, existing = emptyExisting(), ctx = B.ctx()) => planImport(cleanForPlan(B.payload(found)), existing, ctx)
const counts = p => Object.fromEntries(p.tables.map(t => [t.key, t.counts]))
const fresh = n => ({ new: n, updated: 0, skipped: 0, review: 0 })
const kept = n => ({ new: 0, updated: 0, skipped: n, review: 0 })

const EXPECTED = { schools: 6, programmes: 3, venues: 3, coaches: 4, families: 12, volunteers: 6, children: 12, donations: 8, registers: 24 }

test('fixture: the copy in tests/fixtures is the small one, and fictional', () => {
  const byName = Object.fromEntries(sheets.map(s => [s.name, s.rows.length - 1]))
  assert.deepEqual([byName.Schools, byName.Children, byName.Families, byName.Registers], [6, 12, 12, 24])
  const text = JSON.stringify(sheets)
  // Every mobile in Ofcom's drama range (07700 900000–900999); every landline in 01632 960xxx.
  assert.deepEqual((text.match(/07\d{3} \d{6}/g) ?? []).filter(p => !/^07700 900\d{3}$/.test(p)), [])
  assert.deepEqual((text.match(/0\d{4} \d{6}/g) ?? []).filter(p => !/^(07700 900|01632 960)\d{3}$/.test(p)), [])
  assert.deepEqual((text.match(/@[\w.-]+/g) ?? []).filter(d => !/\.example$|example\.(com|org)$/.test(d)), [])
})

test('template path: every tab is read with no AI, and the Notes and example rows are ignored', async () => {
  const read = await viaTemplate()
  assert.equal(read.forAi.length, 0)
  assert.equal(read.templateTabs, templateSheets().length)
  assert.equal(read.rows, 78)
  for (const [c, n] of Object.entries(EXPECTED)) assert.equal(read.found[c].length, n, c)
  assert.ok(!JSON.stringify(read.found).includes('Example'), 'no example row was read')
})

test('template path: what will happen on an empty org — all new, and linked', async () => {
  const p = run((await viaTemplate()).found)
  const c = counts(p)
  for (const [k, n] of Object.entries(EXPECTED)) assert.deepEqual(c[k], fresh(n), k)
  assert.deepEqual(c.sessions, fresh(4))
  assert.deepEqual(c.campaign, fresh(1))
  assert.equal(p.writes, 83)
  const rows = t => p.ops.filter(o => o.kind === 'insert' && o.table === t).map(o => o.row)
  const fams = rows('tp_families'), kids = rows('tp_children'), schools = rows('tp_schools'), progs = rows('tp_programmes')
  for (const k of kids) {
    assert.ok(fams.some(f => f.id === k.family_id), `${k.name} has a family`)
    assert.ok(schools.some(s => s.id === k.school_id), `${k.name} has a school`)
    assert.ok(progs.some(x => x.id === k.programme_id), `${k.name} has a programme`)
  }
  const maya = kids.find(k => k.name === 'Maya Reilly')
  assert.equal(fams.find(f => f.id === maya.family_id).email, 'sarah.reilly@example.com')
  assert.equal(schools.find(s => s.name === 'Harborne Fields Primary').postcode, 'BK3 2QT')
  // Absent is recorded as absent.
  const caleb = kids.find(k => k.name === 'Caleb Bennett')
  assert.equal(rows('tp_attendance').filter(a => a.child_id === caleb.id && a.present === false).length, 1)
  // First five rows of each, and nothing more.
  assert.equal(p.tables.find(t => t.key === 'registers').rows.new.length, 5)
  // Nothing is stamped by the planner: the import id is added when it is written.
  assert.ok(p.ops.every(o => o.kind !== 'insert' || !('import_batch_id' in o.row)))
})

test('an untouched template imports nothing', async () => {
  const read = B.readRecords(await B.readWorkbook(await B.workbookFile(templateSheets())))
  assert.equal(countRecords(read.found), 0)
  assert.equal(read.forAi.length, 0)
  assert.equal(read.leftover.length, 0, 'empty template tabs are not sent to the AI')
})

test('the Notes and example rows are recognised in any column order, and only as written', () => {
  const t = templateSheets().find(s => s.name === 'Children')
  const flip = r => [...r].reverse()
  const sheet = { name: 'Children', rows: [flip(t.rows[0]), flip(t.rows[1]), flip(t.rows[2]), flip(t.rows[2].map((v, i) => (i === 0 ? 'Amy Changed' : v)))] }
  const got = readTemplateSheet(sheet)
  assert.equal(got.ignored, 2)
  assert.equal(got.sheet.rows.length, 2)
})

const AI = existsSync(B.AI_PLANS) ? JSON.parse(readFileSync(B.AI_PLANS, 'utf8')) : null
test('AI path: the fixture’s own headings are not template-shaped, so they go to the AI', () => {
  const read = B.readRecords(sheets)
  assert.equal(read.templateTabs, 0)
  assert.equal(read.forAi.length, sheets.length)
})
test('AI path: with the plans the AI gave for this file, the same records as the template', { skip: !AI && 'no recorded AI plans yet' }, () => {
  const read = B.readRecords(sheets, AI.plans)
  for (const [c, n] of Object.entries(EXPECTED)) assert.equal(read.found[c].length, n, c)
  const c = counts(run(read.found))
  for (const [k, n] of Object.entries(EXPECTED)) assert.equal(c[k].new + c[k].review, n, k)
  assert.equal(read.leftover.length, 0, 'no tab needed a second, row-by-row AI read')
})

test('duplicates: importing the same file again adds nothing and changes nothing', async () => {
  const { found } = await viaTemplate()
  const first = run(found)
  const again = run(found, B.existingAfter(first))
  for (const [k, n] of Object.entries(EXPECTED)) assert.deepEqual(counts(again)[k], kept(n), k)
  assert.equal(again.ops.length, 0)
  assert.equal(again.writes, 0)
  const row = again.tables.find(t => t.key === 'children').rows.skipped[0]
  assert.equal(row.match, 'Matches an existing record (name and date of birth)')
  assert.equal(again.tables.find(t => t.key === 'families').rows.skipped[0].match, 'Matches an existing record (email)')
  assert.equal(again.tables.find(t => t.key === 'schools').rows.skipped[0].match, 'Matches an existing record (name and postcode)')
})

test('duplicates: a re-import with changes updates the matched records, and only the changed columns', async () => {
  const { found } = await viaTemplate()
  const existing = B.existingAfter(run(found))
  const edited = structuredClone(found)
  edited.families.find(f => f.email === 'sarah.reilly@example.com').phone = '07700 900999'
  edited.children.find(k => k.name === 'Ezra Mbeki').year_group = 'Y5'
  const p = run(edited, existing)
  const c = counts(p)
  assert.deepEqual(c.families, { new: 0, updated: 1, skipped: 11, review: 0 })
  assert.deepEqual(c.children, { new: 0, updated: 1, skipped: 11, review: 0 })
  assert.deepEqual(p.tables.find(t => t.key === 'families').rows.updated[0].changes, ['phone'])
  assert.deepEqual(p.tables.find(t => t.key === 'children').rows.updated[0].changes, ['year group'])
  assert.ok(p.ops.every(o => o.kind === 'update'))
  const fam = p.ops.find(o => o.table === 'tp_families')
  assert.deepEqual(fam.patch, { phone: '07700 900999' })
  assert.equal(fam.id, existing.families.find(f => f.email === 'sarah.reilly@example.com').id)
})

test('duplicates: family by email even with a different name; never re-opts in; a blank never clears', () => {
  const existing = emptyExisting()
  existing.families.push({ id: 'f1', guardian_name: 'S Reilly', email: 'sarah.reilly@example.com', phone: '07700 900305', opt_in_email: false, unsubscribed_at: '2026-01-01', consent_photo: false })
  const p = planImport(cleanForPlan({ families: [{ guardian_name: 'Sarah Reilly', email: 'Sarah.Reilly@example.com', consent_photo: 'yes' }] }), existing, B.ctx())
  const op = p.ops[0]
  assert.equal(op.id, 'f1')
  assert.deepEqual(Object.keys(op.patch).sort(), ['consent_at', 'consent_photo'])
  assert.ok(!('opt_in_email' in op.patch) && !('phone' in op.patch) && !('guardian_name' in op.patch))
})

test('duplicates: children by name and date of birth', () => {
  const existing = emptyExisting()
  existing.children.push({ id: 'k1', name: 'Maya Reilly', date_of_birth: '2017-10-05', school_id: 's1', family_id: null })
  existing.children.push({ id: 'k2', name: 'Sam Lee', date_of_birth: null, school_id: null, family_id: null })
  const p = planImport(cleanForPlan({ children: [
    { name: 'Maya Reilly', date_of_birth: '2017-10-05', photo_consent: 'yes' },   // same child
    { name: 'Maya Reilly', date_of_birth: '2019-02-02', photo_consent: 'yes' },   // a different Maya
    { name: 'Sam Lee', date_of_birth: '2018-01-01', photo_consent: 'yes' },       // no date on file to compare: not guessed
  ] }), existing, B.ctx())
  const t = p.tables.find(x => x.key === 'children')
  assert.deepEqual(t.counts, { new: 1, updated: 1, skipped: 0, review: 1 })
  assert.equal(t.rows.updated[0].match, 'Matches an existing record (name and date of birth)')
  assert.equal(t.rows.review[0].writes, false)
  assert.match(t.rows.review[0].notes[0], /no date of birth to tell/)
  assert.ok(!p.ops.some(o => o.kind === 'insert' && o.row.name === 'Sam Lee'))
})

test('duplicates: schools by name and postcode', () => {
  const existing = emptyExisting()
  existing.schools.push({ id: 's1', name: 'Willowbank Primary', postcode: 'BK1 4PL' }, { id: 's2', name: 'Harborne Fields Primary', postcode: null })
  const p = planImport(cleanForPlan({ schools: [
    { name: 'Willowbank Primary', postcode: 'bk14pl', status: 'running' },       // same school (postcode spacing and case don't matter)
    { name: 'Harborne Fields Primary', postcode: 'BK3 2QT' },                   // no postcode yet: matched, and the postcode added
    { name: 'Willowbank Primary', postcode: 'ZZ9 9ZZ' },                         // same name elsewhere: added, but flagged
  ] }), existing, B.ctx())
  const t = p.tables.find(x => x.key === 'schools')
  assert.deepEqual(t.counts, { new: 0, updated: 2, skipped: 0, review: 1 })
  assert.deepEqual(p.ops.find(o => o.id === 's2').patch, { postcode: 'BK3 2QT' })
  assert.equal(t.rows.review[0].writes, true)
  assert.match(t.rows.review[0].notes.join(' '), /already in Lumio at BK1 4PL/)
})

test('duplicates: a register entry already recorded is left as it is', () => {
  const existing = emptyExisting()
  existing.children.push({ id: 'k1', name: 'Maya Reilly', date_of_birth: null, programme_id: 'p1' })
  existing.sessions.push({ id: 'sess1', kind: 'school', session_date: '2026-09-15', programme_id: 'p1', venue_id: null })
  existing.attendance.push({ session_id: 'sess1', child_id: 'k1', present: false })
  const p = planImport(cleanForPlan({ registers: [{ child_name: 'Maya Reilly', session_date: '2026-09-15', present: 'Y' }, { child_name: 'Maya Reilly', session_date: '2026-09-22', present: 'Y' }] }), existing, B.ctx())
  assert.deepEqual(counts(p).registers, { new: 1, updated: 0, skipped: 1, review: 0 })
  assert.ok(!p.ops.some(o => o.kind === 'update'))
})

test('Community: a family at its weekend venue, a child with no school, and the first visit as a weekend register entry', () => {
  const found = B.emptyFound()
  found.venues.push({ name: 'Kingsmead Rec Ground' })
  found.community.push(
    { guardian_name: 'Chris Doyle', email: 'chris.doyle@example.com', phone: '07700 900350', child_name: 'Ben Doyle', date_of_birth: '2017-05-02', venue_name: 'Kingsmead Rec Ground', first_visit: '2026-10-03', consent_data: true, consent_photo: false },
    { guardian_name: 'Amira Shah', email: 'amira.shah@example.com', child_name: 'Zara Shah', date_of_birth: '2016-08-20', venue_name: 'Kingsmead Rec Ground', consent_data: true },
  )
  const p = run(B.finalise(found))
  const ins = t => p.ops.filter(o => o.kind === 'insert' && o.table === t).map(o => o.row)
  const [ben, zara] = ['Ben Doyle', 'Zara Shah'].map(n => ins('tp_children').find(k => k.name === n))
  assert.equal(ben.school_id, undefined)
  assert.equal(ben.photo_consent, false)
  const fam = ins('tp_families').find(f => f.id === ben.family_id)
  const venue = ins('tp_venues')[0]
  assert.deepEqual([fam.guardian_name, fam.consent_data, fam.consent_photo, fam.community_venue_id, fam.source, fam.signed_up_at], ['Chris Doyle', true, false, venue.id, 'community', '2026-11-26T10:00:00.000Z'])
  // The same audit row /join makes, marked as an import (stamped with the import when written, so undo covers it).
  assert.deepEqual(ins('tp_community_signups').map(x => [x.family_id, x.venue_id, x.channel]).sort(), [[ben.family_id, venue.id, 'import'], [zara.family_id, venue.id, 'import']].sort())
  const session = ins('tp_sessions')[0]
  assert.deepEqual([session.kind, session.session_date, session.venue_id], ['weekend', '2026-10-03', venue.id])
  assert.deepEqual(ins('tp_attendance').map(a => [a.child_id, a.present]), [[ben.id, true]])
  // No visit date: no register entry, but the venue is still the family's.
  assert.equal(ins('tp_families').find(f => f.id === zara.family_id).community_venue_id, venue.id)
})

test('Community: the template has the tab, and its rows are read with no AI', async () => {
  const tabs = templateSheets()
  const community = tabs.find(t => t.name === 'Community')
  assert.deepEqual(community.rows[0], ['Guardian name', 'Email', 'Phone', 'Child name', 'Date of birth', 'Venue name', 'First visit', 'Consent data', 'Consent photo', 'Notes'])
  assert.ok(tabs.find(t => t.name === 'Families').rows[0].includes('Weekend venue'))
  community.rows.push(['Chris Doyle', 'chris.doyle@example.com', '07700 900350', 'Ben Doyle', '02/05/2017', 'Kingsmead Rec Ground', '03/10/2026', 'Yes', 'No', ''])
  const read = B.readRecords(await B.readWorkbook(await B.workbookFile(tabs)))
  assert.equal(read.forAi.length, 0)
  assert.deepEqual([read.found.children.length, read.found.families.length, read.found.registers.length], [1, 1, 1])
  assert.equal(read.found.children[0].date_of_birth, '2017-05-02')
})

test('every template tab has a Notes row explaining each column, and one example row', () => {
  for (const t of templateSheets()) {
    assert.equal(t.rows.length, 3, t.name)
    assert.ok(t.rows[1].every(c => c.startsWith('Notes: ') && c.length > 8), t.name)
    assert.ok(t.rows[2].some(Boolean), `${t.name} has an example`)
  }
})

test('pack columns: sizes, past issues and paid items, once each', () => {
  const existing = emptyExisting()
  existing.packItems.push({ id: 'shirt', name: 'T-shirt', active: true, has_sizes: true, sizes: ['S', 'M'], kind: 'included' }, { id: 'racket', name: 'Racket', active: true, has_sizes: false, sizes: [], kind: 'paid', price_pence: 1000 })
  const child = { name: 'Maya Reilly', date_of_birth: '2017-10-05', photo_consent: 'yes', pack_size: 'm', pack_issued: '2026-09-15', paid_item_date: '2026-09-15', paid_item_amount: '10' }
  const p = planImport(cleanForPlan({ children: [child] }), existing, B.ctx())
  assert.deepEqual(counts(p).pack, fresh(3))
  assert.ok(p.ops.some(o => o.kind === 'issue' && o.size === 'M'))
  const again = planImport(cleanForPlan({ children: [child] }), B.existingAfter(p, existing), B.ctx())
  assert.equal(again.ops.length, 0)
  const future = planImport(cleanForPlan({ children: [{ ...child, pack_issued: '2027-01-01' }] }), existing, B.ctx())
  assert.ok(!future.ops.some(o => o.kind === 'issue'))
})

test('limits: 5,000 rows and 10 MB', () => {
  assert.equal(MAX_IMPORT_ROWS, 5000)
  assert.equal(MAX_IMPORT_BYTES, 10 * 1024 * 1024)
  assert.equal(countRecords({ children: new Array(4000).fill({}), families: new Array(1001).fill({}) }), 5001)
})

test('undo: rows edited since the import are counted from their fingerprints', () => {
  const row = { id: 'k1', name: 'Maya Reilly', year_group: 'Y3', updated_at: '2026-11-26T10:00:00Z' }
  const then = { tp_children: { k1: fingerprint(row), k2: fingerprint({ id: 'k2', name: 'Finn' }) } }
  assert.equal(fingerprint({ ...row, updated_at: '2027-01-01T00:00:00Z' }), then.tp_children.k1, 'updated_at alone is not an edit')
  assert.equal(fingerprint({ year_group: 'Y3', id: 'k1', name: 'Maya Reilly' }), then.tp_children.k1, 'column order is not an edit')
  const now = { tp_children: { k1: fingerprint({ ...row, year_group: 'Y4' }), k2: fingerprint({ id: 'k2', name: 'Finn' }) } }
  assert.deepEqual(editedSince(then, now), { tp_children: 1 })
  assert.deepEqual(editedSince(then, then), {})
})
