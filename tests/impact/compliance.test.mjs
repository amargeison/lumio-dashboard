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
const { certText, complianceItems, dbsCertificate, EXPIRY_WINDOW_DAYS, expiryState, staffCertificates, volunteerCertificates } = await import('../../src/lib/impact/compliance.ts')
const demo = await import('../../src/data/tenproject/demo-data.ts')

const today = '2026-11-05'
const noRows = { schools: [], programmes: [], campaigns: [], events: [], donations: [], checkins: [] }
const staff = (id, name, role, dbs_expiry, first_aid_expiry, safeguarding_date, dbs_status = 'valid') => ({ id, name, role, qualification: null, email: null, phone: null, availability: null, specialisms: [], dbs_status, dbs_number: null, dbs_expiry, safeguarding_date, first_aid_expiry, insurance: null, notes: null })
const volunteer = (id, name, extra = {}) => ({ id, name, email: null, phone: null, venue_id: null, inducted: false, induction_date: null, dbs_status: 'valid', dbs_expiry: null, since: null, notes: null, ...extra })

// Same dates as the Lumio Test org.
const lumioTest = {
  ...noRows,
  staff: [
    staff('nb', 'Natalie Brooks', 'lead', '2027-06-30', '2027-03-15', '2026-02-10'),
    staff('so', 'Sam Okafor', 'coach', '2027-09-12', '2027-08-01', '2026-05-22'),
    staff('pm', 'Priya Mehta', 'coach', '2026-12-01', '2027-01-20', '2025-11-30'),
    staff('ds', 'Dominic Shaw', 'assistant', '2027-02-14', '2026-09-30', '2026-01-18'),
  ],
  volunteers: [volunteer('do', 'David Okafor'), volunteer('lf', 'Leah Ferraro')],
}
const mapped = mapLiveRows(lumioTest, today)
const cert = (name, person) => mapped.TP_COACHES.find(c => c.name === person).certificates.find(c => c.name === name)

test('Dominic Shaw: first aid expired', () => {
  assert.equal(cert('First aid', 'Dominic Shaw').state, 'expired')
  assert.equal(certText(cert('First aid', 'Dominic Shaw')), 'First aid expired 30 Sept 2026')
})
test('Priya Mehta: DBS expiring', () => {
  assert.equal(cert('DBS', 'Priya Mehta').state, 'expiring')
  assert.equal(certText(cert('DBS', 'Priya Mehta')), 'DBS expires 1 Dec 2026')
})
test('a person with no dates is not recorded and not counted', () => {
  const d = mapLiveRows({ ...noRows, staff: [staff('x', 'No Dates', 'coach', null, null, null, 'missing')] }, today)
  assert.deepEqual(d.TP_COACHES[0].certificates.map(c => c.state), ['not recorded', 'not recorded', 'not recorded'])
  assert.equal(d.HQ_STATS.dbsExpiring, 0)
  assert.deepEqual(d.NEEDS_ATTENTION, [])
})
test('the Overview counter equals the Needs attention list', () => {
  assert.equal(mapped.HQ_STATS.dbsExpiring, mapped.NEEDS_ATTENTION.length)
  assert.equal(mapped.NEEDS_ATTENTION.length, 2)
})
test('expired sorts above expiring, and each row has person, role, certificate, date and state', () => {
  assert.deepEqual(mapped.NEEDS_ATTENTION.map(i => i.text), ['Dominic Shaw · Assistant · First aid expired 30 Sept 2026', 'Priya Mehta · Coach · DBS expires 1 Dec 2026'])
  assert.deepEqual(mapped.NEEDS_ATTENTION.map(i => i.kind), ['warn', 'info'])
  assert.ok(mapped.NEEDS_ATTENTION.every(i => i.target.tab === 'coaches'))
})
test('an empty org gives 0 and an empty list', () => {
  const d = mapLiveRows(noRows, today)
  assert.equal(d.HQ_STATS.dbsExpiring, 0)
  assert.deepEqual(d.NEEDS_ATTENTION, [])
  assert.equal(d.TP_COACH_ATTENTION, '')
  assert.ok(!JSON.stringify([d.HQ_STATS, d.NEEDS_ATTENTION]).includes('NaN'))
})
test('the window boundaries', () => {
  assert.equal(EXPIRY_WINDOW_DAYS, 60)
  assert.equal(expiryState('2026-11-04', today), 'expired')
  assert.equal(expiryState(today, today), 'expiring')
  assert.equal(expiryState('2027-01-03', today), 'expiring')
  assert.equal(expiryState('2027-01-04', today), 'ok')
})
test('a safeguarding date is a completion date, so an old one never reads as expired', () => {
  assert.equal(cert('Safeguarding', 'Priya Mehta').state, 'ok')
  assert.equal(staffCertificates({ dbs_status: 'valid', safeguarding_date: null }, today)[2].state, 'not recorded')
  assert.ok(!mapped.NEEDS_ATTENTION.some(i => i.text.includes('Safeguarding')))
})
test('a volunteer’s expired DBS counts, goes to the volunteers tab and replaces the valid pill', () => {
  const d = mapLiveRows({ ...noRows, volunteers: [volunteer('v', 'Vic', { dbs_expiry: '2026-10-01' })] }, today)
  assert.deepEqual(d.NEEDS_ATTENTION.map(i => i.text), ['Vic · Volunteer · DBS expired 1 Oct 2026'])
  assert.equal(d.NEEDS_ATTENTION[0].target.tab, 'tenors')
  assert.equal(d.TP_TENORS[0].dbs, 'expired')
  assert.equal(d.HQ_STATS.dbsExpiring, 1)
})
test('volunteers: no first aid column, induction is safeguarding, DBS n/a is left out', () => {
  assert.deepEqual(volunteerCertificates({ dbs_status: 'valid', induction_date: '2026-01-01' }, today).map(c => [c.name, c.state]), [['DBS', 'not recorded'], ['First aid', 'not recorded'], ['Safeguarding', 'ok']])
  assert.deepEqual(volunteerCertificates({ dbs_status: 'n/a' }, today).map(c => c.name), ['First aid', 'Safeguarding'])
})
test('a DBS marked expired with no date still counts', () => {
  assert.equal(dbsCertificate('expired', null, today).state, 'expired')
  assert.equal(certText(dbsCertificate('expired', null, today)), 'DBS expired')
})
test('the Coaches page reads the same rule, and still names a coach with no DBS', () => {
  assert.equal(mapped.TP_COACH_STATS_ROW.find(s => s.label === 'NEED ATTENTION').value, '2')
  assert.match(mapped.TP_COACH_ATTENTION, /First aid expired 30 Sept 2026/)
  const d = mapLiveRows({ ...noRows, staff: [staff('x', 'No Dbs', 'coach', null, null, null, 'missing')] }, today)
  assert.equal(d.TP_COACH_ATTENTION, 'No Dbs · no DBS on file')
})
test('items sort oldest expired first', () => {
  const p = (id, date) => ({ id, name: id, role: 'Coach', kind: 'coach', certificates: [{ name: 'DBS', date, state: 'expired' }] })
  assert.deepEqual(complianceItems([p('b', '2026-10-01'), p('a', '2026-01-01')]).map(i => i.id), ['a-DBS', 'b-DBS'])
})
test('demo data is untouched: no certificates, hand-written attention list', () => {
  for (const c of demo.TP_COACHES) assert.equal(c.certificates, undefined)
  for (const t of demo.TP_TENORS) assert.equal(t.certificates, undefined)
  assert.ok(demo.NEEDS_ATTENTION.length > 0)
  assert.equal(demo.HQ_STATS.dbsExpiring, 1)
})
