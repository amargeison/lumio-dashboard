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
const { mapLiveRows, EMPTY_IMPACT_DATA } = await import('../../src/lib/impact/live-context.ts')
const { evidenceFromRows, attendanceBySession } = await import('../../src/lib/impact/readiness.ts')
const demo = await import('../../src/data/tenproject/demo-data.ts')
const { sessionBar, withCoach } = await import('../../src/lib/impact/school-card.ts')

const school = (id, name, status, extra = {}) => ({ id, name, status, borough: null, address: null, head_name: null, pe_lead_name: null, safeguarding_lead: null, contact_email: null, contact_phone: null, funding_source: null, notes: null, ...extra })
const programme = (id, school_id, status, current_week = 0) => ({ id, school_id, term_label: 'Autumn 2026', year_groups: null, current_week, status, cost_pence: null })
const child = (id, school_id, programme_id) => ({ id, family_id: null, name: id, date_of_birth: null, year_group: 'Y4', school_id, programme_id, medical_notes: null, photo_consent: null, fee_status: 'free', stickers: 0, send: null })
const session = (id, programme_id, session_date, kind = 'school') => ({ id, kind, programme_id, venue_id: null, session_date, lead_staff_id: null })
const mark = (session_id, child_id, present = true) => ({ session_id, child_id, present, via: 'register' })
const noRows = { schools: [], programmes: [], campaigns: [], events: [], donations: [], checkins: [] }

// Same shape as the Lumio Test org: running at week 0, no lead coach set.
const kids = [1, 2, 3, 4, 5, 6].map(n => child(`c${n}`, 'harborne', 'autumn'))
const lumioTest = {
  ...noRows,
  schools: [school('harborne', 'Harborne Fields Primary', 'running'), school('kingsmead', 'Kingsmead Junior School', 'renewal'), school('netherby', 'Netherby Green Primary', 'enquiry')],
  programmes: [programme('autumn', 'harborne', 'running')],
  programmeLinks: [{ id: 'autumn', lead_staff_id: null, venue_id: null }],
  children: kids,
  sessions: [session('s2', 'autumn', '2026-09-22'), session('s1', 'autumn', '2026-09-15')],
  attendance: ['s1', 's2'].flatMap(s => kids.map(k => mark(s, k.id))),
}
const harborne = mapLiveRows(lumioTest)
const listCard = harborne.SCHOOLS.find(s => s.id === 'harborne')
const detail = harborne.SCHOOL_DETAILS.harborne

test('Harborne Fields maps to 6 children, 2 sessions, 100% attendance', () => {
  assert.equal(listCard.children, 6)
  assert.equal(detail.cohorts[0].children, 6)
  assert.deepEqual(detail.attendanceTrend, [100, 100])
})
test('the cards and the readiness engine read the same figures', () => {
  const e = evidenceFromRows(lumioTest).find(x => x.id === 'harborne')
  assert.equal(listCard.children, e.children)
  assert.equal(detail.attendanceTrend.length, e.sessions)
  assert.equal(e.attendancePct, 100)
  assert.match(harborne.SCHOOL_READINESS.harborne.items.regular.note, /^100% attendance/)
})
test('a running programme at week 0 reads In progress, never Not started', () => {
  assert.equal(detail.cohorts[0].label, 'In progress')
  assert.equal(listCard.progress, 'In progress')
})
test('the list and the detail page agree', () => {
  assert.equal(listCard.progress, detail.cohorts[0].label)
  assert.equal(listCard.coach, detail.cohorts[0].coach)
})
test('status labels follow programme status, with Week N only above week 0', () => {
  const label = (status, week) => mapLiveRows({ ...noRows, schools: [school('a', 'A', 'running')], programmes: [programme('p', 'a', status, week)] }).SCHOOLS[0].progress
  for (const s of ['planned', 'fundraising', 'confirmed']) assert.equal(label(s, 0), 'Not started')
  assert.equal(label('running', 4), 'In progress · Week 4')
  assert.equal(label('complete', 10), 'Complete')
  assert.equal(label('complete', 0), 'Complete')
})
test('a school with no programme falls back to its own status', () => {
  const by = id => harborne.SCHOOLS.find(s => s.id === id).progress
  assert.equal(by('netherby'), 'Not started')
  assert.equal(by('kingsmead'), 'Complete')
})
test('coach is the programme lead when one is set, otherwise a dash', () => {
  assert.equal(listCard.coach, '—')
  const led = mapLiveRows({ ...lumioTest, staff: [{ id: 'st', name: 'Pat Lead', role: 'lead', dbs_status: 'valid' }], programmeLinks: [{ id: 'autumn', lead_staff_id: 'st', venue_id: null }] })
  assert.equal(led.SCHOOLS[0].coach, 'Pat Lead')
  assert.equal(led.SCHOOL_DETAILS.harborne.cohorts[0].coach, 'Pat Lead')
})
test('no coach means no trailing separator, on the list and the cohort card', () => {
  assert.equal(withCoach(listCard.progress, listCard.coach), 'In progress')
  assert.equal(withCoach(`${detail.cohorts[0].children} children`, detail.cohorts[0].coach), '6 children')
})
test('a set coach keeps the separator', () => {
  assert.equal(withCoach('In progress', 'Sam Test'), 'In progress · Sam Test')
  assert.equal(withCoach('6 children', 'Sam Test'), '6 children · Sam Test')
})
test('the session chart uses a fixed 0–100 scale', () => {
  assert.deepEqual(detail.attendanceTrend.map(v => sessionBar(v).height), ['100%', '100%'])
  assert.deepEqual([50, 83].map(v => sessionBar(v).height), ['50%', '83%'])
})
test('a 0% session is still a visible bar', () => {
  const [bar] = [0].map(sessionBar)
  assert.equal(bar.height, '0%')
  assert.equal(bar.minHeight, 2)
})
test('the trend is ordered by date, per session, with partial attendance', () => {
  const rows = { ...lumioTest, attendance: [...kids.map(k => mark('s1', k.id, k.id !== 'c6')), ...kids.map(k => mark('s2', k.id))] }
  assert.deepEqual(attendanceBySession(rows, 'harborne'), [{ date: '2026-09-15', pct: 83 }, { date: '2026-09-22', pct: 100 }])
})
test('the live chart carries one dated tooltip per session', () => {
  const rows = { ...lumioTest, sessions: [session('s1', 'autumn', '2026-10-05'), session('s2', 'autumn', '2026-10-12')], attendance: [...kids.map(k => mark('s1', k.id, k.id !== 'c6')), ...kids.map(k => mark('s2', k.id))] }
  const d = mapLiveRows(rows).SCHOOL_DETAILS.harborne
  assert.deepEqual(d.sessionTips, ['5 Oct · 83%', '12 Oct · 100%'])
  assert.equal(d.sessionTips.length, d.attendanceTrend.length)
})
test('a school with no registers has no chart tooltips', () => assert.deepEqual(harborne.SCHOOL_DETAILS.netherby.sessionTips, []))
test('a session with no register is left out of the trend, not read as 0%', () => {
  const rows = { ...lumioTest, sessions: [...lumioTest.sessions, session('s3', 'autumn', '2026-09-29')] }
  assert.deepEqual(mapLiveRows(rows).SCHOOL_DETAILS.harborne.attendanceTrend, [100, 100])
})
test('a weekend register counts for the child’s school, as it does in readiness', () => {
  const rows = { ...lumioTest, sessions: [...lumioTest.sessions, session('w', null, '2026-09-26', 'weekend')], attendance: [...lumioTest.attendance, mark('w', 'c1')] }
  assert.equal(attendanceBySession(rows, 'harborne').length, evidenceFromRows(rows).find(e => e.id === 'harborne').sessions)
})
test('parent activation and weekend conversion stay blank, whatever consent says', () => {
  const rows = { ...lumioTest, families: [{ id: 'f', guardian_name: 'G', email: null, phone: null, emergency_contact: null, consent_data: true, consent_photo: true, unsubscribed_at: null }], children: kids.map(k => ({ ...k, family_id: 'f' })) }
  const d = mapLiveRows(rows)
  assert.equal(d.SCHOOL_DETAILS.harborne.activationPct, 0)
  assert.equal(d.SCHOOL_DETAILS.harborne.conversionPct, 0)
  assert.equal(d.SCHOOLS[0].activation, undefined)
})
test('an empty org maps to the blank state', () => {
  const d = mapLiveRows(noRows)
  assert.deepEqual(d.SCHOOLS, [])
  assert.deepEqual(d.SCHOOL_DETAILS, {})
  assert.deepEqual(d.COACH_STATS.attendanceTrend, EMPTY_IMPACT_DATA.COACH_STATS.attendanceTrend)
})
test('a school with no data maps to 0 children, a dash, Not started and an empty trend', () => {
  const d = mapLiveRows({ ...noRows, schools: [school('new', 'New', 'enquiry')] })
  const [s] = d.SCHOOLS
  assert.equal(s.children, 0); assert.equal(s.coach, '—'); assert.equal(s.progress, 'Not started')
  assert.deepEqual(d.SCHOOL_DETAILS.new.attendanceTrend, [])
  assert.ok(!JSON.stringify([s, d.SCHOOL_DETAILS.new]).includes('NaN'))
})
test('demo data is untouched: no live-only fields', () => {
  for (const s of demo.SCHOOLS) assert.equal(s.progress, undefined)
  for (const d of Object.values(demo.SCHOOL_DETAILS)) {
    assert.equal(d.sessionTips, undefined)
    for (const c of d.cohorts) assert.equal(c.label, undefined)
  }
})
