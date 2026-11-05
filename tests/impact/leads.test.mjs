import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
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
const { PIPELINES, stagesOf, isClosed, stagePoints, matchStage, guessColumn, readIncoming, cleanImportRow, amountPence, ukDate } = await import('../../src/lib/impact/leads.ts')
const { donationRow, fundedPlan, insertLeads, linkSchoolPatch, matchSchool, newSchoolRow, partnerWithNewSchool, partnerWithSchool, recordFunding } = await import('../../src/lib/impact/lead-actions.ts')
const { mapLiveRows, EMPTY_IMPACT_DATA } = await import('../../src/lib/impact/live-context.ts')
const { impactModules, moduleOn } = await import('../../src/lib/impact/org.ts')
const tpDemo = await import('../../src/data/tenproject/demo-data.ts')
const impactDemo = await import('../../src/data/impact/demo-data.ts')

test('the two pipelines, in order, with their closed stages', () => {
  assert.deepEqual(PIPELINES.schools.stages, ['Enquired', 'Contacted', 'Meeting booked', 'Visit / taster', 'Proposal sent', 'Keen for future', 'Not keen', 'Partnered'])
  assert.deepEqual(PIPELINES.funders.stages, ['Enquired', 'Contacted', 'Meeting booked', 'Proposal sent', 'Keen for future', 'Declined', 'Funded'])
  assert.ok(isClosed('schools', 'Partnered') && isClosed('schools', 'Not keen') && !isClosed('schools', 'Proposal sent'))
  assert.ok(isClosed('funders', 'Funded') && isClosed('funders', 'Declined') && !isClosed('funders', 'Keen for future'))
  assert.equal(stagesOf('anything else'), PIPELINES.schools.stages)
})
test('points: a win 5, a meeting or visit 2, closing 1, moving back 0', () => {
  assert.equal(stagePoints('schools', 'Proposal sent', 'Partnered'), 5)
  assert.equal(stagePoints('funders', 'Proposal sent', 'Funded'), 5)
  assert.equal(stagePoints('schools', 'Contacted', 'Meeting booked'), 2)
  assert.equal(stagePoints('schools', 'Meeting booked', 'Visit / taster'), 2)
  assert.equal(stagePoints('schools', 'Contacted', 'Not keen'), 1)
  assert.equal(stagePoints('funders', 'Contacted', 'Declined'), 1)
  assert.equal(stagePoints('schools', 'Enquired', 'Contacted'), 1)
  assert.equal(stagePoints('schools', 'Proposal sent', 'Contacted'), 0)
  assert.equal(stagePoints('funders', 'Enquired', 'Partnered'), 0, 'a stage from the other pipeline')
})
test('points: coming back from Keen for future is 1, a win is still 5', () => {
  for (const to of ['Enquired', 'Contacted', 'Meeting booked', 'Visit / taster', 'Proposal sent']) assert.equal(stagePoints('schools', 'Keen for future', to), 1, to)
  assert.equal(stagePoints('funders', 'Keen for future', 'Meeting booked'), 1)
  assert.equal(stagePoints('schools', 'Keen for future', 'Partnered'), 5)
  assert.equal(stagePoints('funders', 'Keen for future', 'Funded'), 5)
  assert.equal(stagePoints('schools', 'Keen for future', 'Not keen'), 1)
  assert.equal(stagePoints('schools', 'Keen for future', 'Keen for future'), 0)
  assert.equal(stagePoints('funders', 'Declined', 'Contacted'), 0, 'a closed lead reopened is still moving back')
})
test('matchStage: schools', () => {
  for (const [text, stage] of [
    ['', 'Enquired'], ['Partnered', 'Partnered'], ['visit / taster', 'Visit / taster'], ['Taster booked', 'Visit / taster'],
    ['Meeting next Tuesday', 'Meeting booked'], ['Partner meeting booked', 'Meeting booked'], ['Quote sent', 'Proposal sent'],
    ['Signed', 'Partnered'], ['Not interested', 'Not keen'], ['No answer', 'Contacted'], ['Left voicemail', 'Contacted'],
    ['Not yet', 'Keen for future'], ['Next year', 'Keen for future'], ['Emailed head', 'Contacted'], ['???', 'Enquired'],
  ]) assert.equal(matchStage('schools', text), stage, text)
})
test('matchStage: funders', () => {
  for (const [text, stage] of [
    ['Funded', 'Funded'], ['Grant awarded', 'Funded'], ['Application successful', 'Funded'], ['Application unsuccessful', 'Declined'],
    ['Application submitted', 'Proposal sent'], ['Bid in', 'Proposal sent'], ['Declined', 'Declined'], ['Not now', 'Keen for future'],
    ['Meeting booked', 'Meeting booked'], ['No reply', 'Contacted'], ['Spoke to trustee', 'Contacted'],
  ]) assert.equal(matchStage('funders', text), stage, text)
})
test('guessColumn reads a school-shaped spreadsheet', () => {
  assert.deepEqual(['School', 'Contact', 'Role', 'Email', 'Stage', 'Notes'].map(guessColumn), ['org_name', 'name', 'for_name', 'email', 'stage', 'notes'])
  assert.deepEqual(['School name', 'Contact name', 'Contact email', 'Contact number', 'Contact method', 'Job title'].map(guessColumn), ['org_name', 'name', 'email', 'phone', 'contact_method', 'for_name'])
  assert.deepEqual(['Funder', 'Organisation', 'Grant amount', 'Number on roll'].map(guessColumn), ['org_name', 'org_name', 'amount', 'skip'])
})
test('an import row with only an organisation still makes a lead', () => {
  const r = cleanImportRow('schools', { org_name: 'Fernhill Primary' })
  assert.equal(r.name, 'Fernhill Primary')
  assert.equal(r.org_name, 'Fernhill Primary')
  assert.equal(r.stage, 'Enquired')
  assert.equal(cleanImportRow('schools', { notes: 'nobody' }), null)
})
test('amounts read as pence, and anything unclear is left blank', () => {
  assert.equal(amountPence('£5,000'), 500000)
  assert.equal(amountPence('2500.50'), 250050)
  assert.equal(amountPence('about 5k'), null)
  assert.equal(amountPence(''), null)
  assert.equal(cleanImportRow('funders', { name: 'A', amount: '£1,200' }).amount_pence, 120000)
})
test('leads from automations: organisation, role, pipeline', () => {
  const school = readIncoming({ full_name: 'Jo Hale', school_name: 'Fernhill Academy Trust', job_title: 'PE lead', campaign_name: 'Primary schools autumn' })
  assert.deepEqual([school.name, school.orgName, school.forName, school.pipeline], ['Jo Hale', 'Fernhill Academy Trust', 'PE lead', 'schools'])
  assert.equal(readIncoming({ name: 'A', campaign_name: 'Oakfield Academy Trust' }).pipeline, 'schools')
  assert.equal(readIncoming({ name: 'A', campaign_name: 'Community grants 2026' }).pipeline, 'funders')
  assert.equal(readIncoming({ name: 'A', pipeline: 'funders' }).pipeline, 'funders')
  assert.equal(readIncoming({ field_data: [{ name: 'company_name', values: ['Brightwell Foundation'] }] }).name, 'Brightwell Foundation')
  assert.equal(readIncoming({ foo: 'bar' }), null)
})
test('ukDate uses London time, not UTC', () => {
  assert.equal(ukDate('2026-07-01T23:30:00Z'), '2026-07-02')
  assert.equal(ukDate('2026-12-01T23:30:00Z'), '2026-12-01')
})
test('the library and migration stand alone from Coach', () => {
  const lib = readFileSync(new URL('../../src/lib/impact/leads.ts', import.meta.url), 'utf8')
  const sql = readFileSync(new URL('../../supabase/migrations/224_impact_leads.sql', import.meta.url), 'utf8')
  assert.doesNotMatch(lib, /^import .*coach/m)
  const code = sql.split('\n').filter(l => !l.startsWith('--')).join('\n')
  assert.doesNotMatch(code, /coach_/)
  assert.doesNotMatch(code, /google_review/)
})

test('guessColumn reads a follow-up column, and the importer keeps it as a date', () => {
  assert.equal(guessColumn('Follow-up'), 'next_action_at')
  assert.equal(guessColumn('Next contact'), 'next_action_at')
  assert.equal(cleanImportRow('schools', { name: 'A', next_action_at: '2026-11-01' }).next_action_at, '2026-11-01')
  assert.equal(cleanImportRow('schools', { name: 'A', next_action_at: 'soon' }).next_action_at, null)
})

// ── Partnered ───────────────────────────────────────────────────────────────
const schoolLead = { id: 'l', pipeline: 'schools', stage: 'Proposal sent', name: 'Ama Bell', org_name: 'Bramblewood Primary', for_name: 'Headteacher', email: 'a@b.example', phone: '0121 000', created_at: '2026-11-01T10:00:00Z' }

// Records what was written, and answers like Supabase does.
function fakeDb(tables = {}) {
  const writes = []
  const from = table => {
    let op = 'select', payload = null
    const q = {
      insert(row) { op = 'insert'; payload = row; writes.push({ table, op, row }); return q },
      update(row) { op = 'update'; payload = row; writes.push({ table, op, row }); return q },
      select() { return q }, eq() { return q },
      single() { return Promise.resolve({ data: op === 'select' ? tables[table] : { id: `new-${table}` }, error: null }) },
      then(done) { return Promise.resolve({ error: null }).then(done) },
    }
    return q
  }
  return { from, writes }
}

test('a new school is confirmed, with the contact copied over', () => {
  assert.deepEqual(newSchoolRow(schoolLead, 'hq'), { hq_id: 'hq', name: 'Bramblewood Primary', status: 'confirmed', head_name: 'Ama Bell', contact_email: 'a@b.example', contact_phone: '0121 000' })
})
test('a role containing "head" is the head, anything else is the PE lead', () => {
  assert.ok('head_name' in newSchoolRow({ ...schoolLead, for_name: 'Deputy Head' }, 'hq'))
  assert.ok('pe_lead_name' in newSchoolRow({ ...schoolLead, for_name: 'PE lead' }, 'hq'))
  assert.ok('pe_lead_name' in newSchoolRow({ ...schoolLead, for_name: null }, 'hq'))
})
test('a lead with no contact yet does not put the school’s name in a person’s field', () => {
  assert.equal(newSchoolRow({ ...schoolLead, name: 'Bramblewood Primary' }, 'hq').head_name, null)
})
test('a name match ignores "Primary", apostrophes and "C of E", and is an exact match otherwise', () => {
  const schools = [{ id: 's1', name: 'St Aldric’s C of E Primary' }, { id: 's2', name: 'Harborne Fields Primary' }]
  assert.equal(matchSchool('St Aldrics Primary School', schools)?.id, 's1')
  assert.equal(matchSchool('harborne fields', schools)?.id, 's2')
  assert.equal(matchSchool('Harborne Park', schools), null)
  assert.equal(matchSchool('Primary School', schools), null)
  assert.equal(matchSchool(null, schools), null)
})
test('linking fills blanks and moves status forward only', () => {
  assert.deepEqual(linkSchoolPatch(schoolLead, { status: 'enquiry' }), { status: 'confirmed', head_name: 'Ama Bell', contact_email: 'a@b.example', contact_phone: '0121 000' })
  assert.deepEqual(linkSchoolPatch(schoolLead, { status: 'running', head_name: 'Someone Else', contact_email: 'x@y.example', contact_phone: '1' }), {})
  for (const status of ['confirmed', 'running', 'complete', 'renewal']) assert.ok(!('status' in linkSchoolPatch(schoolLead, { status })), status)
  assert.equal(linkSchoolPatch(schoolLead, { status: 'fundraising' }).status, 'confirmed')
})
test('closing as Partnered creates a school, or updates the linked one', async () => {
  const db = fakeDb()
  assert.equal(await partnerWithNewSchool(db, 'hq', schoolLead), 'new-tp_schools')
  assert.equal(db.writes[0].row.status, 'confirmed')
  const linked = fakeDb({ tp_schools: { status: 'enquiry', head_name: 'Already Here' } })
  assert.equal(await partnerWithSchool(linked, 'hq', schoolLead, 's1'), 's1')
  assert.deepEqual(linked.writes[0].row, { status: 'confirmed', contact_email: 'a@b.example', contact_phone: '0121 000' })
  const running = fakeDb({ tp_schools: { status: 'running', head_name: 'A', contact_email: 'b', contact_phone: 'c' } })
  await partnerWithSchool(running, 'hq', schoolLead, 's1')
  assert.equal(running.writes.length, 0, 'nothing to change, nothing written')
})

// ── Funded ──────────────────────────────────────────────────────────────────
const funderLead = { id: 'f', pipeline: 'funders', stage: 'Proposal sent', name: 'Helen Cross', org_name: 'Wrenfield Fund', email: 'h@w.example', amount_pence: 500000, school_id: 's1', campaign_id: null, created_at: '2026-11-01T10:00:00Z' }
const campaign = (id, school_id, status) => ({ id, school_id, status })

test('Funded prefers the linked school’s campaign, live first', () => {
  assert.deepEqual(fundedPlan(funderLead, [campaign('other', 's2', 'live'), campaign('old', 's1', 'complete'), campaign('now', 's1', 'live')]), { kind: 'donate', campaignId: 'now' })
})
test('Funded offers a new campaign when the school has none', () => {
  assert.deepEqual(fundedPlan(funderLead, [campaign('other', 's2', 'live')]), { kind: 'offer-campaign', schoolId: 's1', targetPence: 500000 })
})
test('Funded just closes with no school, no amount, or a donation already recorded', () => {
  assert.deepEqual(fundedPlan({ ...funderLead, school_id: null }, []), { kind: 'close' })
  assert.deepEqual(fundedPlan({ ...funderLead, amount_pence: null }, []), { kind: 'close' })
  assert.deepEqual(fundedPlan({ ...funderLead, amount_pence: 0 }, []), { kind: 'close' })
  assert.deepEqual(fundedPlan({ ...funderLead, campaign_id: 'c' }, [campaign('c', 's1', 'live')]), { kind: 'close' })
})
test('the donation names the organisation, and is a bank payment', () => {
  assert.deepEqual(donationRow(funderLead, 'c', 'hq', '2026-11-05'), { hq_id: 'hq', campaign_id: 'c', amount_pence: 500000, method: 'bank', donor_name: 'Wrenfield Fund', donor_email: 'h@w.example', donated_on: '2026-11-05' })
})
test('recording funding: against a campaign, or a new one at target = amount', async () => {
  const db = fakeDb()
  assert.equal(await recordFunding(db, 'hq', funderLead, { kind: 'donate', campaignId: 'c' }, '2026-11-05'), 'c')
  assert.deepEqual(db.writes.map(w => w.table), ['tp_donations'])
  const fresh = fakeDb()
  assert.equal(await recordFunding(fresh, 'hq', funderLead, { kind: 'offer-campaign', schoolId: 's1', targetPence: 500000 }, '2026-11-05'), 'new-tp_fundraising_campaigns')
  assert.deepEqual(fresh.writes.map(w => w.table), ['tp_fundraising_campaigns', 'tp_donations'])
  assert.deepEqual(fresh.writes[0].row, { hq_id: 'hq', school_id: 's1', target_pence: 500000, status: 'complete' })
  assert.equal(fresh.writes[1].row.campaign_id, 'new-tp_fundraising_campaigns')
})

test('bulk insert keys every row to the org, and skips rows with nothing to go on', async () => {
  const seen = []
  const db = { from: () => ({ insert: async rows => { seen.push(...rows); return { error: null, count: rows.length } } }) }
  const r = await insertLeads(db, 'hq', 'funders', [{ org_name: 'Fund A', amount: '£100' }, { notes: 'nothing' }])
  assert.deepEqual([r.added, r.skipped, r.error], [1, 1, null])
  assert.deepEqual([seen[0].hq_id, seen[0].pipeline, seen[0].amount_pence], ['hq', 'funders', 10000])
})

// ── Registration and demo ───────────────────────────────────────────────────
test('Leads is a module, on by default and able to be switched off', () => {
  const m = impactModules({ volunteers: 'Volunteers', volunteer: 'Volunteer' }).find(x => x.id === 'leads')
  assert.equal(m.desc, 'Schools and funders pipeline — from first contact to partnered')
  assert.ok(!m.locked)
  assert.equal(moduleOn({}, 'leads'), true)
  assert.equal(moduleOn({ modules: { leads: false } }, 'leads'), false)
})
test('the demo board: 6 schools, 4 funders, valid stages, one overdue, one Keen on a list', () => {
  const b = impactDemo.DEMO_LEADS, today = ukDate(new Date())
  assert.equal(b.filter(l => l.pipeline === 'schools').length, 6)
  assert.equal(b.filter(l => l.pipeline === 'funders').length, 4)
  for (const l of b) assert.ok(stagesOf(l.pipeline).includes(l.stage), l.stage)
  assert.equal(b.filter(l => l.next_action_at && l.next_action_at < today).length, 1)
  assert.ok(b.some(l => l.stage === 'Keen for future' && l.list))
  assert.equal(new Set(b.map(l => l.id)).size, b.length)
  for (const id of b.map(l => l.school_id).filter(Boolean)) assert.ok(impactDemo.SCHOOLS.some(s => s.id === id), id)
  for (const l of b) if (l.email) assert.match(l.email, /\.example$/)
})
test('no demo lead reaches a live org or the Ten Project route', () => {
  assert.deepEqual(tpDemo.DEMO_LEADS, [])
  assert.deepEqual(EMPTY_IMPACT_DATA.DEMO_LEADS, [])
  assert.deepEqual(mapLiveRows({ schools: [], programmes: [], campaigns: [], events: [], donations: [], checkins: [] }).DEMO_LEADS, [])
})

// ── Coach and Impact stay separable ─────────────────────────────────────────
const filesIn = dir => readdirSync(dir).flatMap(f => { const p = `${dir}/${f}`; return statSync(p).isDirectory() ? filesIn(p) : /\.tsx?$/.test(f) ? [p] : [] })
test('no Impact file imports from a Coach path', () => {
  const dirs = ['app/tenproject', 'app/impact', 'lib/impact', 'app/api/impact'].map(d => src + d)
  const hits = dirs.flatMap(filesIn).filter(f => /from\s+['"][^'"]*\/coach(\/|['"])/.test(readFileSync(f, 'utf8')))
  assert.deepEqual(hits, [])
})
