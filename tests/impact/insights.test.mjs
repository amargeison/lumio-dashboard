import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { registerHooks } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

// The modules use the @/ alias and extensionless imports, which node --test can't resolve alone.
const src = fileURLToPath(new URL('../../src/', import.meta.url))
registerHooks({
  resolve(spec, ctx, next) {
    const base = spec.startsWith('@/') ? src + spec.slice(2) : spec.startsWith('./') && ctx.parentURL?.includes('/src/') ? fileURLToPath(new URL(spec, ctx.parentURL)) : null
    if (base && !/\.tsx?$/.test(base) && existsSync(`${base}.ts`)) return next(pathToFileURL(`${base}.ts`).href, ctx)
    return base ? next(pathToFileURL(base).href, ctx) : next(spec, ctx)
  },
})
const { mapLiveRows, EMPTY_IMPACT_COPY } = await import('../../src/lib/impact/live-context.ts')
const { academicYear, buildInsights, emptyInsights, headlineTiles, needNote, TIER_2 } = await import('../../src/lib/impact/insights.ts')
const { assertCleanDoc, funderDocHtml } = await import('../../src/app/tenproject/[slug]/_lib/funder-docs.ts')
const { GENERIC_BRAND } = await import('../../src/lib/impact/org.ts')
const { evidenceFromRows, scoreSchool } = await import('../../src/lib/impact/readiness.ts')
const tp = await import('../../src/data/tenproject/demo-data.ts')
const { TEN_PROJECT_BRAND, TEN_PROJECT_COPY } = await import('../../src/data/tenproject/portal-copy.ts')
const { IMPACT_DEMO_CONTEXT } = await import('../../src/data/impact/demo-context.ts')

const today = '2026-11-05'
const noRows = { schools: [], programmes: [], campaigns: [], events: [], donations: [], checkins: [] }
const school = (id, name, status) => ({ id, name, status, borough: null, address: null, head_name: null, pe_lead_name: null, safeguarding_lead: null, contact_email: null, contact_phone: null, funding_source: null, notes: null })
const programme = (id, school_id, status = 'running') => ({ id, school_id, term_label: 'Autumn 2026', year_groups: null, current_week: 0, status, cost_pence: null })
const child = (id, school_id, programme_id, year_group, extra = {}) => ({ id, family_id: `f-${id}`, name: id, date_of_birth: null, year_group, school_id, programme_id, medical_notes: null, photo_consent: null, fee_status: 'unknown', stickers: 0, send: null, ...extra })
const family = id => ({ id, guardian_name: id, email: null, phone: null, emergency_contact: null, consent_data: true, consent_photo: null, unsubscribed_at: null })
const session = (id, programme_id, session_date, kind = 'school') => ({ id, kind, programme_id, venue_id: null, session_date, lead_staff_id: null })
const mark = (session_id, child_id, present = true) => ({ session_id, child_id, present, via: 'register' })
const staff = (id, name, role, dbs_expiry, first_aid_expiry, safeguarding_date) => ({ id, name, role, qualification: null, email: null, phone: null, availability: null, specialisms: null, dbs_status: 'valid', dbs_number: null, dbs_expiry, safeguarding_date, first_aid_expiry, insurance: null, notes: null })
const volunteer = id => ({ id, name: id, email: null, phone: null, venue_id: null, inducted: false, induction_date: null, dbs_status: 'valid', dbs_expiry: null, since: null, notes: null })

// Same shape as the Lumio Test org: two running schools of six, one child with no school or year group.
const yearOf = n => ['Y2', 'Y3', 'Y4'][n % 3]
const harborne = [0, 1, 2, 3, 4, 5].map(n => child(`h${n}`, 'harborne', 'hp', yearOf(n)))
const willowbank = [0, 1, 2, 3, 4, 5].map(n => child(`w${n}`, 'willowbank', 'wp', yearOf(n)))
const kids = [...harborne, ...willowbank, child('loose', null, null, null)]
const lumioTest = {
  ...noRows,
  schools: [school('hollinsmere', 'Hollinsmere Academy', 'confirmed'), school('netherby', 'Netherby Green Primary', 'enquiry'), school('aldric', 'St Aldric’s C of E Primary', 'fundraising'), school('kingsmead', 'Kingsmead Junior School', 'renewal'), school('harborne', 'Harborne Fields Primary', 'running'), school('willowbank', 'Willowbank Primary', 'running')],
  programmes: [programme('hp', 'harborne'), programme('wp', 'willowbank'), programme('cp', 'hollinsmere', 'confirmed')],
  programmeLinks: [],
  children: kids,
  families: kids.map(k => family(k.family_id)),
  sessions: [session('s4', 'wp', '2026-09-24'), session('s1', 'hp', '2026-09-15'), session('s3', 'hp', '2026-09-22'), session('s2', 'wp', '2026-09-17')],
  attendance: [...['s1', 's3'].flatMap(s => harborne.map(k => mark(s, k.id))), ...['s2', 's4'].flatMap(s => willowbank.map(k => mark(s, k.id)))],
  staff: [
    staff('nb', 'Natalie Brooks', 'lead', '2027-06-30', '2027-03-15', '2026-02-10'),
    staff('so', 'Sam Okafor', 'coach', '2027-09-12', '2027-08-01', '2026-05-22'),
    staff('pm', 'Priya Mehta', 'coach', '2026-12-01', '2027-01-20', '2025-11-30'),
    staff('ds', 'Dominic Shaw', 'assistant', '2027-02-14', '2026-09-30', '2026-01-18'),
  ],
  volunteers: ['v1', 'v2', 'v3', 'v4', 'v5', 'v6'].map(volunteer),
}
const with_ = extra => ({ ...lumioTest, ...extra })
const I = buildInsights(lumioTest, today)
const E = emptyInsights(today)
const live = rows => ({ mode: 'live', brand: { ...GENERIC_BRAND, org: 'Lumio Test' }, copy: EMPTY_IMPACT_COPY, data: mapLiveRows(rows, today), insights: buildInsights(rows, today) })
const docs = ctx => ['funder-pack', 'bid-narrative', 'term-report'].map(k => funderDocHtml(k, ctx))

test('the academic year turns over on 1 September', () => {
  assert.equal(academicYear('2026-08-31'), '2025/26')
  assert.equal(academicYear('2026-09-01'), '2026/27')
  assert.equal(academicYear('2027-01-10'), '2026/27')
})

test('reach: 12 children in Sept 2026, and months with no register are empty, not zero', () => {
  assert.equal(I.reach.need, null)
  assert.equal(I.reach.total, 12)
  assert.deepEqual(I.reach.months.map(m => m.label), ['Sept', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'])
  assert.deepEqual([I.reach.months[0].month, I.reach.months[4].month, I.reach.months[11].month], ['2026-09', '2027-01', '2027-08'])
  assert.equal(I.reach.months[0].children, 12)
  assert.ok(I.reach.months.slice(1).every(m => m.children === null))
})
test('reach: a child counts once a month, a register of absences is a real 0, last year is left out', () => {
  const r = buildInsights(with_({
    sessions: [session('a', 'hp', '2026-10-01'), session('b', 'hp', '2026-10-08'), session('c', 'hp', '2026-11-02'), session('old', 'hp', '2026-06-01')],
    attendance: [mark('a', 'h0'), mark('b', 'h0'), mark('b', 'h1'), mark('c', 'h0', false), mark('old', 'h5')],
  }), today).reach
  assert.deepEqual(r.months.slice(0, 3).map(m => m.children), [null, 2, 0])
  assert.equal(r.total, 2)
})

test('attendance: four 100% sessions, in date order', () => {
  assert.equal(I.attendance.need, null)
  assert.deepEqual(I.attendance.sessions.map(s => [s.date, s.pct]), [['2026-09-15', 100], ['2026-09-17', 100], ['2026-09-22', 100], ['2026-09-24', 100]])
  assert.equal(I.attendance.sessions[0].tip, '15 Sept 2026 · 100%')
  assert.equal(I.attendance.overallPct, 100)
})
test('attendance: real rates, and a session with no register has no bar', () => {
  const a = buildInsights(with_({ sessions: [session('a', 'hp', '2026-10-01'), session('none', 'hp', '2026-10-02')], attendance: [mark('a', 'h0'), mark('a', 'h1', false), mark('a', 'h2', false), mark('a', 'h3', false)] }), today).attendance
  assert.deepEqual(a.sessions.map(s => s.pct), [25])
  assert.equal(a.overallPct, 25)
})

test('schools table: Harborne and Willowbank at 38 At risk, the rest not enough evidence', () => {
  assert.equal(I.schools.need, null)
  assert.deepEqual(I.schools.rows.slice(0, 2).map(r => [r.school, r.children, r.sessions, r.attendancePct, r.score, r.band]), [
    ['Harborne Fields Primary', 6, 2, 100, 38, 'At risk'],
    ['Willowbank Primary', 6, 2, 100, 38, 'At risk'],
  ])
  assert.ok(I.schools.rows.slice(2).every(r => r.band === 'Not enough evidence yet' && r.attendancePct === null))
  assert.equal(I.schools.rows.length, 6)
})
test('schools table: a banded school ranks above one with no band, whatever the raw score', () => {
  const scores = I.schools.rows.map(r => r.score)
  assert.deepEqual(scores, [...scores].sort((a, b) => b - a))
  assert.equal(I.schools.rows[2].school, 'St Aldric’s C of E Primary')
})

test('demographics: year groups, with the child who has none shown as not recorded', () => {
  assert.equal(I.demographics.need, null)
  assert.deepEqual(I.demographics.yearGroups.map(y => [y.label, y.n, y.pct]), [['Y2', 4, 31], ['Y3', 4, 31], ['Y4', 4, 31], ['Not recorded', 1, 8]])
})
test('demographics: year groups run in school order', () => {
  const d = buildInsights(with_({ children: ['Y10', 'Y2', 'R', 'N'].map((y, n) => child(`c${n}`, null, null, y)) }), today).demographics
  assert.deepEqual(d.yearGroups.map(y => y.label), ['N', 'R', 'Y2', 'Y10'])
})
test('demographics: no flags recorded means each flag asks for itself', () => {
  assert.deepEqual(I.demographics.flags.map(f => [f.label, f.recorded, f.need]), [['Gender', 0, 'gender flags'], ['SEND', 0, 'SEND flags'], ['Free school meals', 0, 'FSM flags'], ['Pupil premium', 0, 'pupil premium flags']])
})
test('demographics: a flag is a share of children with it recorded, never of all children', () => {
  const children = [child('a', null, null, 'Y2', { send: true }), child('b', null, null, 'Y2', { send: false }), child('c', null, null, 'Y2', { send: false }), child('d', null, null, 'Y2', { send: false }), child('e', null, null, 'Y2', { gender: 'female', fsm: true }), child('f', null, null, 'Y2', { gender: 'male' })]
  const { flags } = buildInsights(with_({ children }), today).demographics
  const flag = label => flags.find(f => f.label === label)
  assert.equal(flag('SEND').recorded, 4)
  assert.equal(flag('SEND').shares[0].pct, 25, 'one of four recorded, not one of six children')
  assert.equal(flag('Free school meals').shares[0].pct, 100)
  assert.deepEqual(flag('Gender').shares.map(s => [s.label, s.pct]), [['Female', 50], ['Male', 50]])
  assert.equal(flag('Pupil premium').recorded, 0)
})

test('gender reads in words, including prefer not to say', () => {
  const children = [child('a', null, null, 'Y2', { gender: 'prefer_not_to_say' }), child('b', null, null, 'Y2', { gender: 'other' })]
  assert.deepEqual(buildInsights(with_({ children }), today).demographics.flags[0].shares.map(s => s.label), ['Prefer not to say', 'Other'])
})

test('conversion: no weekend session means the section asks for one', () => {
  assert.equal(I.conversion.need, 'weekend sessions')
  assert.deepEqual(I.conversion.rows, [])
})
test('conversion: a family counts through any of its children; absent or curriculum-only does not', () => {
  const sibling = child('sib', null, null, 'Y1', { family_id: 'f-h1' })
  const r = buildInsights(with_({
    children: [...kids, sibling],
    sessions: [...lumioTest.sessions, session('wk', null, '2026-10-03', 'weekend')],
    attendance: [...lumioTest.attendance, mark('wk', 'h0'), mark('wk', 'sib'), mark('wk', 'h2', false), mark('wk', 'w0')],
  }), today).conversion
  assert.equal(r.need, null)
  assert.deepEqual(r.rows, [
    { school: 'Harborne Fields Primary', reached: 6, converted: 2, pct: 33 },
    { school: 'Willowbank Primary', reached: 6, converted: 1, pct: 17 },
  ])
})

test('compliance: counts, and Dominic Shaw expired above Priya Mehta expiring', () => {
  const c = I.compliance
  assert.equal(c.need, null)
  assert.deepEqual([c.coaches, c.volunteers, c.valid, c.expiring, c.expired, c.notRecorded], [4, 6, 10, 1, 1, 18])
  assert.deepEqual(c.items.map(i => i.text), ['Dominic Shaw · Assistant · First aid expired 30 Sept 2026', 'Priya Mehta · Coach · DBS expires 1 Dec 2026'])
})
test('compliance: the rows match the Overview tile', () => {
  assert.equal(I.compliance.items.length, mapLiveRows(lumioTest, today).HQ_STATS.dbsExpiring)
})
test('compliance: CPD by school, or a note when there is none', () => {
  assert.equal(I.compliance.cpdNeed, 'CPD records')
  const c = buildInsights(with_({ cpd: [{ id: '1', school_id: 'harborne', staff_name: 'A Teacher', course: 'x', cpd_date: null, provider: null, notes: null }, { id: '2', school_id: 'harborne', staff_name: 'a teacher ', course: 'y', cpd_date: null, provider: null, notes: null }] }), today).compliance
  assert.equal(c.cpdNeed, null)
  assert.deepEqual(c.cpd, [{ school: 'Harborne Fields Primary', records: 2, people: 1 }])
})

test('an empty org: tiles of zeros, and every section names what it needs', () => {
  assert.deepEqual(E.headline.map(h => h.value), ['0', '0', '0', '0%', '0', '0'])
  assert.deepEqual([E.reach.need, E.attendance.need, E.schools.need, E.demographics.need, E.conversion.need, E.compliance.need, E.compliance.cpdNeed], ['registers', 'registers', 'schools', 'children', 'weekend sessions', 'coaches or volunteers', 'CPD records'])
  assert.doesNotMatch(JSON.stringify(E), /NaN|undefined/)
})
test('sessions with no register show no rate, rather than 0%', () => {
  assert.equal(headlineTiles({ ...noRows, sessions: [session('a', null, '2026-10-01')] })[3].value, '—')
})
test('the headline tiles are the same on the page and in the dataset, even on an empty org', () => {
  assert.deepEqual(mapLiveRows(lumioTest, today).INSIGHTS.headline, I.headline)
  assert.deepEqual(mapLiveRows(noRows, today).INSIGHTS.headline, E.headline)
})
test('notes name the missing input; tier 2 says what it is waiting for, and invents nothing', () => {
  assert.equal(needNote('weekend sessions'), 'Builds as data does — needs: weekend sessions')
  assert.match(TIER_2.retention, /6 weeks of weekend data/)
  assert.match(TIER_2.wellbeing, /family surveys/)
  assert.match(TIER_2.socialValue, /family surveys/)
  assert.doesNotMatch(JSON.stringify(TIER_2), /£|\d+:\d/)
})

test('live documents carry no missing figures', () => {
  for (const html of docs(live(lumioTest))) assert.doesNotThrow(() => assertCleanDoc(html))
})
test('the guard catches a missing figure, and ignores page code', () => {
  assert.throws(() => assertCleanDoc('<p>reached undefined children</p>'), /undefined/)
  assert.throws(() => assertCleanDoc('<p>NaN%</p>'), /NaN/)
  assert.doesNotThrow(() => assertCleanDoc('<script>if (x === undefined) {}</script><p>12 children</p>'))
})
test('the funder pack has what exists and omits what does not', () => {
  const html = funderDocHtml('funder-pack', live(lumioTest))
  for (const h of ['HEADLINES', 'REACH ACROSS THE YEAR', 'ATTENDANCE', 'SCHOOLS', 'WHO TAKES PART', 'SAFEGUARDING']) assert.ok(html.includes(h), h)
  assert.ok(!html.includes('CONVERSION'), 'no weekend sessions yet')
  assert.ok(!html.includes('SEND'), 'no flags recorded')
  assert.match(html, /Lumio Test/)
})
test('the claims the demo makes are not made on live', () => {
  for (const html of docs(live(lumioTest))) {
    assert.doesNotMatch(html, /All delivering coaches|term on term|social value|retention|per £1|hold current DBS/i)
  }
})
test('the compliance sentence reads from the counts, and names nobody', () => {
  for (const html of docs(live(lumioTest))) {
    assert.match(html, /4 coaches and 6 volunteers, 10 of 30 DBS, first aid and safeguarding records are valid; 1 is expiring within 60 days, 1 has expired and 18 are not recorded/)
    assert.doesNotMatch(html, /Dominic|Priya/)
  }
})
test('documents name schools with children or sessions, not ones at enquiry stage', () => {
  const html = funderDocHtml('funder-pack', live(lumioTest))
  assert.ok(html.includes('Harborne Fields Primary'))
  assert.ok(!html.includes('Netherby Green Primary'))
})
test('readiness stays on the page and out of the documents', () => {
  for (const kind of ['funder-pack', 'term-report']) {
    const html = funderDocHtml(kind, live(lumioTest))
    assert.doesNotMatch(html, /Readiness|readiness|At risk|Not enough evidence|Nearly there|On track|\b38\b|DfE/, kind)
    assert.match(html, /<th>School<\/th><th>Children<\/th><th>Sessions<\/th><th>Attendance<\/th><\/tr>/, kind)
    assert.match(html, /<td><b>Harborne Fields Primary<\/b><\/td><td>6<\/td><td>2<\/td><td>100%<\/td><\/tr>/, kind)
  }
  assert.doesNotMatch(funderDocHtml('bid-narrative', live(lumioTest)), /Readiness|At risk/)
  assert.equal(I.schools.rows[0].band, 'At risk', 'the page still has it')
})
test('conversion appears in the documents once weekend sessions exist', () => {
  const ctx = live(with_({ sessions: [...lumioTest.sessions, session('wk', null, '2026-10-03', 'weekend')], attendance: [...lumioTest.attendance, mark('wk', 'h0')] }))
  for (const html of docs(ctx)) { assertCleanDoc(html); assert.match(html, /1 of 6 children|<td>6<\/td><td>1<\/td><td>17%<\/td>/) }
})
const recorded = n => kids.map((k, i) => i < n ? { ...k, send: i === 0, fsm: i < 2, pupil_premium: false, gender: i % 2 ? 'male' : 'female' } : k)
const [funderPack, termReport, bid] = ['funder-pack', 'term-report', 'bid-narrative']
test('9 recorded: suppressed in the funder pack and term report, shown on the page', () => {
  const ctx = live(with_({ children: recorded(9) }))
  for (const kind of [funderPack, termReport]) {
    const html = funderDocHtml(kind, ctx)
    assertCleanDoc(html)
    for (const label of ['Gender', 'SEND', 'Free school meals', 'Pupil premium']) assert.ok(html.includes(`${label}: recorded for fewer than 10 children — not shown`), `${kind} ${label}`)
    assert.doesNotMatch(html, /% of the 9 children/)
  }
  const send = ctx.insights.demographics.flags.find(f => f.label === 'SEND')
  assert.deepEqual([send.recorded, send.shares[0].n, send.shares[0].pct], [9, 1, 11], 'the page keeps the figure and the count')
})
test('10 recorded: shown in both', () => {
  const ctx = live(with_({ children: recorded(10) }))
  for (const kind of [funderPack, termReport]) {
    const html = funderDocHtml(kind, ctx)
    assertCleanDoc(html)
    assert.ok(html.includes('SEND: 10% of the 10 children with this recorded.'), kind)
    assert.ok(html.includes('Free school meals: 20% of the 10 children with this recorded.'), kind)
    assert.ok(html.includes('Female: 50% of the 10 children with this recorded.'), kind)
    assert.doesNotMatch(html, /fewer than 10/)
  }
  assert.equal(ctx.insights.demographics.flags.find(f => f.label === 'SEND').shares[0].pct, 10)
})
test('the bid narrative leaves a small group out rather than stating it', () => {
  const small = funderDocHtml(bid, live(with_({ children: recorded(9) })))
  assert.doesNotMatch(small, /SEND|Free school meals|Pupil premium|Gender|Female/)
  assert.match(funderDocHtml(bid, live(with_({ children: recorded(10) }))), /SEND: 10% of the 10 children/)
})
test('a flag nobody has recorded doesn’t appear in a document at all', () => {
  assert.doesNotMatch(funderDocHtml(funderPack, live(lumioTest)), /fewer than 10|SEND|Gender/)
})
test('an empty org gets a short document: its name, zeros, and what to record', () => {
  const ctx = { mode: 'live', brand: { ...GENERIC_BRAND, org: 'Ten Project' }, copy: EMPTY_IMPACT_COPY, data: mapLiveRows(noRows, today), insights: E }
  for (const kind of ['funder-pack', 'term-report']) {
    const html = funderDocHtml(kind, ctx)
    assertCleanDoc(html)
    assert.match(html, /Ten Project/)
    assert.match(html, /<b>0<\/b><span>Children registered<\/span>/)
    assert.match(html, /take a register at each session/)
    assert.doesNotMatch(html, /<h2>(REACH|SCHOOLS|ATTENDANCE|WHO|SAFEGUARDING)/)
  }
  const bid = funderDocHtml('bid-narrative', ctx)
  assertCleanDoc(bid)
  assert.match(bid, /take a register at each session/)
  assert.doesNotMatch(bid, /copyDoc/, 'nothing to copy')
})
test('a live org before its rows load still gets a clean document', () => {
  for (const html of docs({ mode: 'live', brand: GENERIC_BRAND, copy: EMPTY_IMPACT_COPY, data: mapLiveRows(noRows, today) })) assertCleanDoc(html)
})
test('the footer has no empty segments when the org has no town or domain', () => {
  assert.doesNotMatch(funderDocHtml('funder-pack', live(lumioTest)), / · {1,2}· /)
})

// Hashes taken from the code before live Insights existed: `git show f41aac30`.
const golden = JSON.parse(readFileSync(new URL('./insights-demo-golden.json', import.meta.url), 'utf8'))
const sha = s => createHash('sha256').update(s).digest('hex')
const demos = { tenproject: { mode: 'demo', brand: TEN_PROJECT_BRAND, copy: TEN_PROJECT_COPY, data: tp }, impactDemo: IMPACT_DEMO_CONTEXT }
for (const [name, ctx] of Object.entries(demos)) {
  test(`demo INSIGHTS byte-identical: ${name}`, () => assert.equal(sha(JSON.stringify(ctx.data.INSIGHTS)), golden[name].INSIGHTS))
  for (const kind of ['term-report', 'funder-pack', 'bid-narrative', 'governor-pack', 'newsletter-snippet']) {
    test(`demo ${kind} byte-identical: ${name}`, () => {
      assert.equal(sha(funderDocHtml(kind, ctx).replace(/<br>\d{1,2} \w+ \d{4}<\/div>/, '<br>DATE</div>')), golden[name][kind])
    })
  }
}

// Taken from the code before migration 225, on the same fixture. With every flag
// null, nothing may move except the wording of the Priority Reach gap line.
const snapshot = JSON.parse(readFileSync(new URL('./lumio-test-snapshot.json', import.meta.url), 'utf8'))
const withoutPriorityText = items => ({ ...items, priority: { status: items.priority.status } })
test('regression: readiness is identical apart from the Priority Reach line', () => {
  const now = Object.fromEntries(evidenceFromRows(lumioTest).map(e => [e.id, scoreSchool(e)]))
  assert.deepEqual(Object.keys(now), Object.keys(snapshot.readiness))
  for (const [id, was] of Object.entries(snapshot.readiness)) {
    const { score, verdict, summary, biggestGap, items } = now[id]
    assert.deepEqual({ score, verdict, summary, biggestGap, items: withoutPriorityText(items) }, { ...was, items: withoutPriorityText(was.items) }, id)
  }
})
test('regression: every Insights section is identical', () => assert.deepEqual(I, snapshot.insights))
test('regression: tiles and Needs attention are identical', () => {
  const d = mapLiveRows(lumioTest, today)
  for (const [k, v] of Object.entries(snapshot.tiles)) assert.deepEqual(d.HQ_STATS[k], v, k)
  assert.deepEqual(d.NEEDS_ATTENTION, snapshot.attention)
})
test('regression: the not recorded count stays at 18', () => assert.equal(I.compliance.notRecorded, 18))
