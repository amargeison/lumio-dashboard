import test from 'node:test'
import assert from 'node:assert/strict'
import { CAP_NOTE, evidenceFromRows, READINESS_WEIGHTS, scoreSchool, scoreSchools } from '../../src/lib/impact/readiness.ts'
import { demoReadinessEvidence } from '../../src/data/impact/readiness-demo.ts'

const base = { id: 's', name: 'S', status: 'running', stage: 'running', children: 30, registeredChildren: 30, sessions: 8, weeks: 4, attendancePct: 90, yearGroups: 3, sendRecordedPct: 100, familyContactPct: 90, weekendSessions: 1, venueLinked: true, events: 0, cpdRecords: 2, cpdPeople: 2, responses: 6, positivePct: 90, funding: 'funded', fundedPct: null, safeguardingLead: true }
const empty = { ...base, status: 'enquiry', stage: 'none', children: 0, registeredChildren: 0, sessions: 0, weeks: 0, attendancePct: null, yearGroups: 0, sendRecordedPct: null, familyContactPct: null, weekendSessions: 0, venueLinked: false, cpdRecords: 0, cpdPeople: 0, responses: 0, positivePct: null, funding: 'unknown', safeguardingLead: false }

test('weights total 100', () => assert.equal(Object.values(READINESS_WEIGHTS).reduce((a, b) => a + b, 0), 100))
test('everything evidenced scores 100 and On track', () => { const r = scoreSchool(base); assert.equal(r.score, 100); assert.equal(r.verdict, 'on-track'); assert.equal(r.biggestGap, null) })
test('bands: 80 On track, 50 Nearly there, below At risk', () => {
  assert.equal(scoreSchool({ ...base, responses: 0, cpdRecords: 0, cpdPeople: 0 }).verdict, 'on-track')
  assert.equal(scoreSchool({ ...base, responses: 0, cpdRecords: 0, cpdPeople: 0, familyContactPct: null }).verdict, 'nearly')
  assert.equal(scoreSchool({ ...empty, sessions: 2, attendancePct: 60, children: 5, registeredChildren: 2, yearGroups: 1 }).verdict, 'at-risk')
})
test('fewer than 3 areas evidenced gets no band', () => {
  assert.equal(scoreSchool(empty).verdict, 'needs-evidence')
  assert.equal(scoreSchool({ ...empty, sessions: 2, registeredChildren: 0 , attendancePct: 90, weeks: 4 }).verdict, 'needs-evidence')
})
test('exactly 3 areas evidenced gets a band', () => assert.equal(scoreSchool({ ...empty, sessions: 2, attendancePct: 90, weeks: 4, children: 5, yearGroups: 1 }).verdict, 'at-risk'))
test('no evidence is a gap, labelled as missing and never as a poor result', () => {
  const r = scoreSchool(empty)
  for (const id of ['data', 'regular', 'priority', 'cpd', 'broader', 'wholeschool', 'impact', 'partner']) {
    assert.equal(r.items[id].status, 'gap'); assert.match(r.items[id].note, /^No evidence recorded yet — /); assert.ok(r.items[id].action)
  }
})
test('weak evidence earns half', () => assert.equal(scoreSchool({ ...base, cpdPeople: 1, cpdRecords: 1 }).score, 95))
test('every state explains itself', () => { for (const e of [base, empty, { ...base, attendancePct: 60 }]) for (const i of Object.values(scoreSchool(e).items)) { assert.ok(i.note); assert.ok(i.action) } })
test('attendance needs both the target and sustained weeks', () => {
  assert.equal(scoreSchool({ ...base, attendancePct: 84 }).items.regular.status, 'progress')
  assert.equal(scoreSchool({ ...base, attendancePct: 100, weeks: 2 }).items.regular.status, 'progress')
  assert.equal(scoreSchool({ ...base, attendancePct: 85, weeks: 4 }).items.regular.status, 'met')
})
test('an unfunded school cannot be On track', () => { const r = scoreSchool({ ...base, funding: 'unfunded' }); assert.equal(r.score, 79); assert.equal(r.verdict, 'nearly'); assert.ok(r.summary.includes(CAP_NOTE)); assert.equal(CAP_NOTE, 'Capped at Nearly there — no secure funding recorded.') })
test('unknown funding is missing evidence, not a cap', () => {
  const r = scoreSchool({ ...base, funding: 'unknown' })
  assert.equal(r.items.partner.status, 'gap'); assert.equal(r.items.partner.note, 'No evidence recorded yet — record this school’s funding status')
  assert.equal(r.score, 80); assert.equal(r.verdict, 'on-track'); assert.ok(!r.summary.includes(CAP_NOTE))
})
test('the cap note shows only when the cap bites', () => assert.ok(!scoreSchool({ ...empty, funding: 'unfunded', sessions: 2, attendancePct: 60, children: 5, yearGroups: 1 }).summary.includes(CAP_NOTE)))
test('a safeguarding lead is needed for a met partnership', () => assert.equal(scoreSchool({ ...base, safeguardingLead: false }).items.partner.status, 'progress'))
test('biggest gap is the most points still to win', () => assert.equal(scoreSchool({ ...base, cpdRecords: 0, cpdPeople: 0, attendancePct: null }).biggestGap, 'regular'))
const rows = {
  schools: [{ id: 'a', name: 'A', status: 'running', funding_source: null, safeguarding_lead: 'Ms L' }, { id: 'b', name: 'B', status: 'fundraising', funding_source: null, safeguarding_lead: null }, { id: 'c', name: 'C', status: 'complete', funding_source: null, safeguarding_lead: null }, { id: 'd', name: 'D', status: 'complete', funding_source: 'school budget', safeguarding_lead: null }],
  programmes: [{ id: 'p', school_id: 'a', status: 'running' }, { id: 'p2', school_id: 'a', status: 'complete' }],
  programmeLinks: [{ id: 'p', venue_id: 'v' }],
  campaigns: [{ id: 'k', school_id: 'b', target_pence: 1000, status: 'live' }, { id: 'org', school_id: null, target_pence: 9000, status: 'live' }],
  events: [{ campaign_id: 'k' }], donations: [{ campaign_id: 'k', amount_pence: 250 }, { campaign_id: 'org', amount_pence: 9000 }],
  children: [{ id: 'x', family_id: 'f', school_id: 'a', year_group: 'Y3', send: false }, { id: 'y', family_id: 'g', school_id: 'a', year_group: 'Y4', send: null }, { id: 'z', family_id: null, school_id: null, year_group: 'Y1', send: null }],
  families: [{ id: 'f', consent_data: true }, { id: 'g', consent_data: null }],
  sessions: [{ id: '1', kind: 'school', programme_id: 'p', session_date: '2026-09-15' }, { id: '2', kind: 'school', programme_id: 'p', session_date: '2026-09-17' }, { id: '3', kind: 'weekend', programme_id: null, session_date: '2026-09-26' }],
  attendance: [{ session_id: '1', child_id: 'x', present: true }, { session_id: '2', child_id: 'x', present: false }, { session_id: '3', child_id: 'y', present: true }, { session_id: '3', child_id: 'z', present: true }],
  responses: [{ school_id: 'a', would_recommend: true, satisfaction: null }, { school_id: 'a', would_recommend: false, satisfaction: 2 }],
  cpd: [{ school_id: 'a', staff_name: 'Ms L' }, { school_id: 'a', staff_name: 'ms l ' }],
}
const [a, b, c, d] = evidenceFromRows(rows)
test('rows: registers count per school, two sessions in a week as one week', () => { assert.equal(a.sessions, 3); assert.equal(a.weeks, 2); assert.equal(a.attendancePct, 67); assert.equal(a.registeredChildren, 2) })
test('rows: a child with no school belongs to no school', () => { assert.equal(a.children, 2); assert.equal(b.children, 0) })
test('rows: consent counts only an explicit yes', () => assert.equal(a.familyContactPct, 50))
test('rows: SEND counts when recorded either way', () => assert.equal(a.sendRecordedPct, 50))
test('rows: running beats complete for a school with both', () => assert.equal(a.stage, 'running'))
test('rows: weekend sessions, venues and the same person twice', () => { assert.equal(a.weekendSessions, 1); assert.equal(a.venueLinked, true); assert.equal(a.cpdRecords, 2); assert.equal(a.cpdPeople, 1) })
test('rows: feedback is positive only if recommended or rated 4+', () => assert.equal(a.positivePct, 50))
test('rows: funding from a campaign, never from the org-wide one', () => { assert.equal(b.funding, 'fundraising'); assert.equal(b.fundedPct, 25); assert.equal(b.events, 1); assert.equal(a.funding, 'unknown') })
test('rows: a blank is unknown at any stage, unfunded has to be recorded', () => {
  assert.equal(c.funding, 'unknown'); assert.equal(d.funding, 'funded')
  const [x] = evidenceFromRows({ ...rows, schools: [{ id: 'e', name: 'E', status: 'complete', funding_source: 'Unfunded for 2026/27', safeguarding_lead: null }] })
  assert.equal(x.funding, 'unfunded')
})
test('rows: nothing recorded for an org scores nothing', () => assert.deepEqual(evidenceFromRows({ schools: [], programmes: [], campaigns: [], events: [], donations: [] }), []))

test('demo: the engine reproduces the hand-written verdicts', () => {
  const r = scoreSchools(demoReadinessEvidence({ flagship: 'a', complete: 'b', fundraising: 'c', confirmed: 'd', enquiry: 'e' }))
  assert.deepEqual(Object.values(r).map(x => x.verdict), ['on-track', 'nearly', 'nearly', 'at-risk', 'needs-evidence'])
  const hand = [86, 78, 72, 34]
  hand.forEach((h, i) => { const s = Object.values(r)[i].score; assert.ok(Math.abs(s - h) <= 8, `${s} vs ${h}`) })
})

// Priority reach, from real rows.
const kid = (id, flags = {}, year_group = 'Y3') => ({ id, family_id: null, school_id: 's', year_group, send: null, fsm: null, pupil_premium: null, ...flags })
const flagRows = children => ({ schools: [{ id: 's', name: 'S', status: 'running', funding_source: null, safeguarding_lead: null }], programmes: [], campaigns: [], events: [], donations: [], children })
const priority = children => scoreSchool(evidenceFromRows(flagRows(children))[0]).items.priority
const spread = flags => ['Y2', 'Y3', 'Y4'].flatMap((y, i) => [kid(`a${i}`, flags, y), kid(`b${i}`, flags, y)])

test('priority: nothing recorded asks for all three flags and counts nobody', () => {
  const p = priority(spread({}))
  assert.equal(p.status, 'progress')
  assert.match(p.note, /no priority flags recorded yet/)
  assert.equal(p.action, 'Record SEND, FSM and pupil premium status so priority reach can be shown.')
})
test('priority: the gap names only the flags that are missing', () => {
  assert.equal(priority(spread({ send: false })).action, 'Record FSM and pupil premium status so priority reach can be shown.')
  assert.equal(priority(spread({ send: false, fsm: true })).action, 'Record pupil premium status so priority reach can be shown.')
})
test('priority: any flag true counts once, and the share is of children recorded', () => {
  const p = priority([kid('a', { send: true, fsm: true }), kid('b', { pupil_premium: true }), kid('c', { fsm: false }), kid('d', { send: false }), kid('e')])
  assert.match(p.note, /2 of 4 with a flag recorded in a priority group \(50%\)/)
})
test('priority: a blank is never counted as false', () => {
  const e = evidenceFromRows(flagRows([kid('a', { fsm: true }), kid('b')]))[0]
  assert.deepEqual([e.priorityChildren, e.priorityRecorded], [1, 1])
})
test('priority: met with all three recorded across three year groups', () => {
  assert.equal(priority(spread({ send: false, fsm: true, pupil_premium: false })).status, 'met')
})
test('priority: all recorded but too few year groups stays in progress', () => {
  const p = priority([kid('a', { send: false, fsm: false, pupil_premium: false })])
  assert.deepEqual([p.status, p.action], ['progress', 'Extend the programme to more year groups.'])
})
test('priority: the demo’s evidence still reads the way it did', () => {
  const p = scoreSchool(base).items.priority
  assert.equal(p.status, 'met')
  assert.match(p.note, /SEND recorded for 100%/)
})
