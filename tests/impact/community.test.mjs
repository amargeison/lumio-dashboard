// Community (brief 3, migration 237): the /join checks, statuses, tiles, the lapse
// preview, the sign-up emails, the privacy gate, and the weekend-visit evidence used by
// Overview, Insights and readiness. The routes and RLS are in scripts/impact-community-test.mjs.
import test from 'node:test'
import assert from 'node:assert/strict'
import './brackenmoor.mjs'   // registers the @/ import hooks

const C = await import('../../src/lib/impact/community.ts')
const E = await import('../../src/lib/impact/community-email.ts')
const { privacyUrlOf, moduleOn, impactModules } = await import('../../src/lib/impact/org.ts')
const { nextDateFor, joinUrl } = await import('../../src/lib/impact/community-actions.ts')
const { weekendVisits, buildPeople } = await import('../../src/lib/impact/live-context.ts')

const TODAY = '2026-11-26'
const V = '11111111-1111-4111-8111-111111111111'
const form = extra => ({ guardian: 'Chris Doyle', email: 'Chris.Doyle@Example.com', phone: '07700 900350', children: [{ name: 'Ben Doyle', dob: '2017-05-02' }], venueId: V, consentData: true, consentPhoto: false, optInEmail: true, optInSms: true, ...extra })

test('/join: a good sign-up is read and tidied', () => {
  const r = C.parseJoin(form(), [V], TODAY)
  assert.equal(r.ok, true)
  assert.deepEqual(r.value, { guardian: 'Chris Doyle', email: 'chris.doyle@example.com', phone: '07700 900350', children: [{ name: 'Ben Doyle', dob: '2017-05-02', notes: null }], venueId: V, consentData: true, consentPhoto: false, optInEmail: true, optInSms: true, consentHealth: false })
})
test('/join: "anything the coach should know" is optional; when filled, its own tick is required', () => {
  const kid = notes => [{ name: 'Ben Doyle', dob: '2017-05-02', notes }]
  assert.equal(C.parseJoin(form({ children: kid('   ') }), [V], TODAY).value.children[0].notes, null, 'blank → nothing saved, no tick needed')
  const refused = C.parseJoin(form({ children: kid('Asthma — inhaler in bag') }), [V], TODAY)
  assert.deepEqual(refused, { ok: false, field: 'consentHealth', error: 'Please tick the box to let us hold what you’ve told us the coach should know — or clear it.' })
  assert.equal(C.parseJoin(form({ children: kid('Asthma'), consentHealth: 'true' }), [V], TODAY).ok, false, 'only a real true counts')
  const ok = C.parseJoin(form({ children: kid('Asthma — inhaler in bag\nSEN(D): autism'), consentHealth: true }), [V], TODAY)
  assert.equal(ok.ok, true)
  assert.equal(ok.value.children[0].notes, 'Asthma — inhaler in bag\nSEN(D): autism', 'line breaks kept')
  assert.equal(ok.value.consentHealth, true)
  assert.equal(C.parseJoin(form({ consentHealth: true }), [V], TODAY).value.consentHealth, false, 'a tick with nothing written records nothing')
  assert.equal(C.parseJoin(form({ children: kid('x'.repeat(501)), consentHealth: true }), [V], TODAY).field, 'children', 'too long')
})
test('/join: the consent version is bumped, and +health records the second tick', () => {
  assert.equal(C.JOIN_CONSENT_VERSION, 'join-2026-12')
  assert.equal(C.consentVersionFor({ consentHealth: false }), 'join-2026-12')
  assert.equal(C.consentVersionFor({ consentHealth: true }), 'join-2026-12+health')
  assert.match(C.joinConsentText('Ten Project'), /^I agree to Ten Project keeping my family’s details \(names, contact details and children’s dates of birth\)/, 'main wording unchanged')
  assert.equal(C.joinHealthConsentText('Ten Project'), 'I agree to Ten Project holding any health, medical or additional-needs information I give here, so the coach can keep my child safe.')
})
test('/join: data consent is required', () => {
  for (const consentData of [false, undefined, 'true', 1]) assert.deepEqual(C.parseJoin(form({ consentData }), [V], TODAY), { ok: false, field: 'consentData', error: 'We need your agreement to keep your details before you can join.' })
})
test('/join: the first thing to fix, in plain words', () => {
  const err = x => C.parseJoin(form(x), [V], TODAY)
  assert.equal(err({ guardian: 'C' }).field, 'guardian')
  assert.equal(err({ email: 'not an email' }).field, 'email')
  assert.equal(err({ phone: 'call me' }).field, 'phone')
  assert.equal(err({ children: [] }).error, 'Please add at least one child.')
  assert.equal(err({ children: [{ name: 'Ben Doyle', dob: '' }] }).error, 'Please give Ben Doyle’s date of birth.')
  assert.match(err({ children: [{ name: 'Ben Doyle', dob: '1990-01-01' }] }).error, /doesn’t look right/)
  assert.equal(err({ children: new Array(7).fill({ name: 'Ben Doyle', dob: '2017-05-02' }) }).field, 'children')
  assert.equal(err({ children: [{ name: '<script>', dob: '2017-05-02' }] }).field, 'children')
})
test('/join: only this org’s venues can be chosen', () => {
  assert.equal(C.parseJoin(form({ venueId: '22222222-2222-4222-8222-222222222222' }), [V], TODAY).field, 'venueId')
  assert.equal(C.parseJoin(form({ venueId: 'northvale' }), [V], TODAY).field, 'venueId')
})
test('/join: texts only with a mobile, a blank phone is fine', () => {
  const r = C.parseJoin(form({ phone: '', optInSms: true }), [V], TODAY)
  assert.deepEqual([r.value.phone, r.value.optInSms], [null, false])
})
test('/join: bots — the hidden field, or faster than a person', () => {
  const now = 1_000_000
  assert.equal(C.looksLikeABot({ website: 'http://spam', startedAt: now - 60_000 }, now), true)
  assert.equal(C.looksLikeABot({ startedAt: now - 1000 }, now), true)
  assert.equal(C.looksLikeABot({}, now), true)
  assert.equal(C.looksLikeABot({ website: '', startedAt: now - 20_000 }, now), false)
})
test('waiting list: a venue is full at its capacity; no capacity, never full', () => {
  assert.equal(C.venueFull(10, 9), false); assert.equal(C.venueFull(10, 10), true); assert.equal(C.venueFull(null, 500), false)
})
test('the privacy gate: only a real https link opens /join', () => {
  assert.equal(privacyUrlOf({}), null)
  assert.equal(privacyUrlOf({ privacyUrl: '  ' }), null)
  assert.equal(privacyUrlOf({ privacyUrl: 'http://example.org/privacy' }), null)
  assert.equal(privacyUrlOf({ privacyUrl: 'javascript:alert(1)' }), null)
  assert.equal(privacyUrlOf({ privacyUrl: 'https://localhost/privacy' }), null)
  assert.equal(privacyUrlOf({ privacyUrl: 'https://brackenmoor.example/privacy' }), 'https://brackenmoor.example/privacy')
})
test('Community is a module: on by default, can be switched off, sits after Schools', () => {
  assert.equal(moduleOn({}, 'community'), true)
  assert.equal(moduleOn({ modules: { community: false } }, 'community'), false)
  const ids = impactModules({ volunteers: 'Volunteers', volunteer: 'Volunteer' }).map(m => m.id)
  assert.equal(ids.indexOf('community'), ids.indexOf('schools') + 1)
})

const fam = (id, extra = {}) => ({ id, source: 'community', community_venue_id: 'v1', signed_up_at: null, lapsed_at: null, waitlisted_at: null, created_at: null, hasSchoolChild: false, ...extra })
test('status: new, active, lapsed', () => {
  assert.equal(C.statusOf(fam('a', { signed_up_at: '2026-11-20' }), [], TODAY), 'new')
  assert.equal(C.statusOf(fam('a', { signed_up_at: '2026-01-01' }), [], TODAY), 'new', 'never been yet')
  assert.equal(C.statusOf(fam('a', { signed_up_at: '2026-09-01' }), ['2026-09-05', '2026-11-21'], TODAY), 'active')
  assert.equal(C.statusOf(fam('a', { signed_up_at: '2026-09-01' }), ['2026-09-05', '2026-10-10'], TODAY), 'lapsed', '47 days since the last visit')
  assert.equal(C.statusOf(fam('a', { signed_up_at: '2026-09-01' }), ['2026-10-15'], TODAY), 'active', '42 days is not yet lapsed')
  assert.equal(C.statusOf(fam('a', { lapsed_at: '2026-11-01' }), ['2026-11-21'], TODAY), 'lapsed', 'marked by HQ')
})
test('source: direct, school only, school → weekend', () => {
  assert.equal(C.sourceOf(fam('a'), []), 'community')
  assert.equal(C.sourceOf(fam('a', { source: 'school', community_venue_id: null, hasSchoolChild: true }), []), 'school')
  assert.equal(C.sourceOf(fam('a', { source: 'school', community_venue_id: null, hasSchoolChild: true }), ['2026-11-21']), 'both')
  assert.equal(C.sourceOf(fam('a', { source: null, community_venue_id: null, hasSchoolChild: true }), ['2026-11-21']), 'both')
})
test('tiles', () => {
  const families = [
    fam('direct-new', { signed_up_at: '2026-11-20' }),
    fam('direct-active', { signed_up_at: '2026-09-02' }),
    fam('school-converted', { source: 'school', community_venue_id: null, hasSchoolChild: true }),
    fam('school-only', { source: 'school', community_venue_id: null, hasSchoolChild: true }),
    fam('lapsed', { signed_up_at: '2026-03-01' }),
    fam('waiting', { signed_up_at: '2026-11-25', waitlisted_at: '2026-11-25' }),
  ]
  const visits = [
    { familyId: 'direct-active', date: '2026-09-05', venueId: 'v1' }, { familyId: 'direct-active', date: '2026-11-21', venueId: 'v1' },
    { familyId: 'school-converted', date: '2026-11-14', venueId: 'v1' },
    { familyId: 'lapsed', date: '2026-04-04', venueId: 'v1' },
  ]
  const t = C.communityTiles(families, visits, { start: '2026-09-01', end: '2026-12-31' }, TODAY)
  assert.deepEqual(t, { signedUp: 4, activeThisTerm: 2, newThisMonth: 2, visitsThisTerm: 3, lapsed: 1, conversionsThisTerm: 1, saidWeekends: 0, saidAndCame: 0 })
  // School → weekend intent: school families who said they'll come; only school families count.
  const said = families.map(f => (['school-converted', 'school-only', 'direct-new'].includes(f.id) ? { ...f, weekend_too: true } : f))
  const t2 = C.communityTiles(said, visits, { start: '2026-09-01', end: '2026-12-31' }, TODAY)
  assert.deepEqual([t2.saidWeekends, t2.saidAndCame, t2.signedUp], [2, 1, 4], 'a direct family’s flag doesn’t count; the tiles above don’t change')
  assert.equal(C.saidWeekends(said.find(f => f.id === 'school-only')), true)
  assert.equal(C.inCommunity(said.find(f => f.id === 'school-only'), undefined), false, 'saying so isn’t signing up')
})
test('mark lapsed: only families who came, then stopped, and aren’t marked yet', () => {
  const families = [fam('a'), fam('b'), fam('c', { lapsed_at: '2026-11-01' }), fam('d')]
  const by = C.visitsBy([{ familyId: 'a', date: '2026-09-05' }, { familyId: 'b', date: '2026-11-21' }, { familyId: 'c', date: '2026-09-05' }])
  assert.deepEqual(C.lapsePreview(families, by, TODAY).map(f => f.id), ['a'])
})

test('welcome email: QR inline, venue and time, app link; escaped', () => {
  const m = E.welcomeEmail({ org: 'Brackenmoor <Sport>', guardian: 'Chris Doyle', children: ['Ben', 'Amy'], venue: { name: 'Kingsmead Rec Ground', session_day: 'Saturday', session_time: '10:00', address: 'Kingsmead Avenue', postcode: 'BK4 6LP' }, waitlisted: false, appLink: 'https://www.lumiosports.com/sports-login?invite=x', qrCid: 'family-qr' })
  assert.equal(m.subject, 'Welcome to Brackenmoor <Sport>’s weekend sessions')
  assert.match(m.html, /src="cid:family-qr"/)
  assert.match(m.html, /Ben and Amy at <b>Kingsmead Rec Ground<\/b>, <b>Saturday 10:00<\/b>/)
  assert.match(m.html, /Open the family app/)
  assert.ok(!m.html.includes('<Sport>'), 'org name is escaped')
})
test('welcome email: no QR when QR check-in is off', () => {
  const m = E.welcomeEmail({ org: 'X', guardian: 'Chris', children: ['Ben'], venue: { name: 'Kingsmead' }, waitlisted: false, appLink: 'https://x.example/app', qrCid: null })
  assert.ok(!m.html.includes('cid:') && !/QR/.test(m.html), 'no image, no QR words')
  assert.match(m.html, /Tell us if you’re coming each week in the family app/)
})
test('welcome email: on the waiting list, it says so and promises no date', () => {
  const m = E.welcomeEmail({ org: 'X', guardian: 'Chris', children: ['Ben'], venue: { name: 'Kingsmead' }, waitlisted: true, appLink: null, qrCid: 'q' })
  assert.match(m.subject, /waiting list/)
  assert.match(m.html, /Kingsmead is full at the moment/)
  assert.ok(!m.html.includes('Open the family app'))
})
test('already-with-us email: a link, and nothing about the family', () => {
  const m = E.alreadyEmail({ org: 'X', link: 'https://www.lumiosports.com/sports-login?email=a', isInvite: false })
  assert.match(m.html, /already with us/)
  assert.match(m.html, /Sign in/)
})

test('next session date from the venue’s day', () => {
  assert.equal(nextDateFor('Saturday', TODAY), '2026-11-28')
  assert.equal(nextDateFor('Thursday', TODAY), '2026-11-26', 'today counts')
  assert.equal(nextDateFor('Sun 10:30', TODAY), '2026-11-29')
  assert.equal(nextDateFor('weekends', TODAY), null)
  assert.equal(joinUrl('https://www.lumiosports.com', 'ten-project', 'v 1'), 'https://www.lumiosports.com/impact/ten-project/join?venue=v%201&src=qr')
})

test('weekend visits: one per family per session, present only, weekend only', () => {
  const rows = {
    sessions: [{ id: 's1', kind: 'weekend', session_date: '2026-11-21', venue_id: 'v1' }, { id: 's2', kind: 'school', session_date: '2026-11-24', venue_id: null }],
    children: [{ id: 'k1', family_id: 'f1' }, { id: 'k2', family_id: 'f1' }, { id: 'k3', family_id: 'f2' }, { id: 'k4', family_id: null }],
    attendance: [{ session_id: 's1', child_id: 'k1', present: true }, { session_id: 's1', child_id: 'k2', present: true }, { session_id: 's1', child_id: 'k3', present: false }, { session_id: 's2', child_id: 'k3', present: true }, { session_id: 's1', child_id: 'k4', present: true }],
  }
  assert.deepEqual(weekendVisits(rows), [{ familyId: 'f1', date: '2026-11-21', venueId: 'v1' }])
})
test('families carry their Community details and login', () => {
  const p = buildPeople({ schools: [], programmes: [], campaigns: [], events: [], donations: [], checkins: [],
    families: [{ id: 'f1', guardian_name: 'Chris', email: null, phone: null, emergency_contact: null, consent_data: true, consent_photo: null, unsubscribed_at: null, source: 'community', community_venue_id: 'v1', signed_up_at: '2026-11-20', lapsed_at: null, waitlisted_at: null, checkin_code: 'KZGRJJQ48HHT', created_at: '2026-11-20' }],
    children: [], venues: [{ id: 'v1', name: 'Kingsmead', capacity: 40, session_day: 'Saturday', session_time: '10:00', address: null, postcode: null }],
    members: [{ role: 'parent', family_id: 'f1', accepted_at: '2026-11-21', revoked_at: null }] })
  assert.equal(p.families[0].hasLogin, true)
  assert.deepEqual([p.families[0].community.venueId, p.families[0].community.checkinCode], ['v1', 'KZGRJJQ48HHT'])
  assert.equal(p.community.venues[0].capacity, 40)
})
