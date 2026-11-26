// Communications (brief 4, migration 238): audiences and consent counts, the AI prompt
// (snapshot: only the supplied facts and the no-claims rules), send chunking and
// per-recipient statuses, inbound threading, automation selection and the daily cap,
// the AI cost cap, newsletter rendering and quiet hours. The routes, webhooks and RLS
// on the new tables are in scripts/impact-comms-test.mjs.
import test from 'node:test'
import assert from 'node:assert/strict'
import './brackenmoor.mjs'   // registers the @/ import hooks

const A = await import('../../src/lib/impact/audiences.ts')
const P = await import('../../src/lib/impact/ai-prompt.ts')
const S = await import('../../src/lib/impact/campaign-send.ts')
const I = await import('../../src/lib/impact/inbound.ts')
const M = await import('../../src/lib/impact/automations.ts')
const C = await import('../../src/lib/impact/ai-cost.ts')
const N = await import('../../src/lib/impact/newsletter.ts')
const Q = await import('../../src/lib/impact/comms-settings.ts')

const TODAY = '2026-11-26'
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const fam = (n, x = {}) => ({ id: id(n), guardian_name: `Parent ${String(n).padStart(2, '0')}`, email: `p${n}@example.com`, phone: '07700 900301', consent_data: true, opt_in_email: true, opt_in_sms: true, opt_in_app: true, unsubscribed_at: null, email_bounced_at: null, source: 'school', community_venue_id: null, created_at: '2026-01-10T10:00:00Z', signed_up_at: null, lapsed_at: null, waitlisted_at: null, ...x })
const SCHOOL = id(900), VENUE = id(901), OTHER_SCHOOL = id(902)

const families = [
  fam(1),
  fam(2, { consent_data: null }),
  fam(3, { unsubscribed_at: '2026-10-01T00:00:00Z' }),
  fam(4, { email: null }),
  fam(5, { email_bounced_at: '2026-11-01T00:00:00Z' }),
  fam(6, { opt_in_email: false }),
  fam(7, { source: 'community', community_venue_id: VENUE, signed_up_at: '2026-10-05T09:00:00Z' }),
  fam(8, { source: 'both', community_venue_id: VENUE, lapsed_at: '2026-11-01T00:00:00Z' }),
  fam(9, { source: 'community', community_venue_id: VENUE, waitlisted_at: '2026-11-20T00:00:00Z', created_at: '2026-11-20T00:00:00Z' }),
]
const data = {
  families,
  children: [{ family_id: id(1), school_id: SCHOOL }, { family_id: id(2), school_id: SCHOOL }, { family_id: id(3), school_id: OTHER_SCHOOL }, { family_id: id(8), school_id: SCHOOL }, { family_id: id(7), school_id: null }],
  loggedIn: new Set([id(1), id(7)]),
  openedLast: new Set([id(1), id(5)]),
  schools: [{ id: SCHOOL, name: 'Brackenmoor Primary' }], venues: [{ id: VENUE, name: 'Kingsmead Rec' }],
}
const ids = xs => xs.map(f => Number(f.id.slice(-12)))

test('audiences: each one picks the right families from the org’s data', () => {
  const m = a => ids(A.audienceMembers(a, data, TODAY))
  assert.deepEqual(m({ kind: 'all' }), [1, 2, 3, 4, 5, 6, 7, 8, 9])
  assert.deepEqual(m({ kind: 'school', id: SCHOOL }), [1, 2, 8])
  assert.deepEqual(m({ kind: 'venue', id: VENUE }), [7, 8], 'the waiting list is not at the venue yet')
  assert.deepEqual(m({ kind: 'community' }), [7, 8])
  assert.deepEqual(m({ kind: 'school_families' }), [1, 2, 3, 8])
  assert.deepEqual(m({ kind: 'new_this_term' }), [7, 9], 'joined since 1 September')
  assert.deepEqual(m({ kind: 'lapsed' }), [8])
  assert.deepEqual(m({ kind: 'no_login' }), [2, 3, 4, 5, 6, 8, 9])
  assert.deepEqual(m({ kind: 'opened_last' }), [1, 5])
})

test('audiences: parsing refuses anything unknown, and school/venue need an id', () => {
  assert.equal(A.parseAudience({ kind: 'everyone' }), null)
  assert.equal(A.parseAudience({ kind: 'school' }), null)
  assert.deepEqual(A.parseAudience({ kind: 'school', id: SCHOOL }), { kind: 'school', id: SCHOOL })
  assert.deepEqual(A.parseAudience({ kind: 'all', id: SCHOOL }), { kind: 'all', id: null })
  assert.equal(A.audienceName({ kind: 'venue', id: VENUE }, data), 'Families at Kingsmead Rec')
})

test('consent counts: each family once, under the first reason, and the line the wizard shows', () => {
  const r = A.reachability(A.audienceMembers({ kind: 'all' }, data, TODAY), 'email')
  assert.deepEqual({ ...r, reachableIds: ids(r.reachableIds.map(x => ({ id: x }))) }, { total: 9, reachable: 4, noConsent: 1, unsubscribed: 1, optedOut: 1, noAddress: 1, bounced: 1, reachableIds: [1, 7, 8, 9] })
  assert.equal(A.reachLine(r), '4 of 9 reachable — 1 has no consent, 1 unsubscribed, 1 opted out of email, 1 no email, 1 needs a new email')
  assert.equal(A.reachLine(A.reachability([fam(1), fam(2, { consent_data: null })], 'email')), '1 of 2 reachable — 1 has no consent')
  assert.equal(A.reachLine(A.reachability([fam(1)], 'email')), '1 of 1 reachable')
  // Unsubscribed beats no consent; unknown consent is never yes.
  assert.equal(A.skipReason(fam(1, { consent_data: null, unsubscribed_at: 'x' }), 'email'), 'unsubscribed')
  assert.equal(A.skipReason(fam(1, { consent_data: false }), 'email'), 'no consent')
  assert.equal(A.skipReason(fam(1, { phone: '020 7946 0000' }), 'sms'), 'no mobile')
  assert.equal(A.skipReason(fam(1, { email_bounced_at: 'x' }), 'sms'), null, 'a bounce only stops email')
})

const FACTS = {
  org: 'Brackenmoor Tennis', today: TODAY,
  ran: [{ date: '2026-11-21', kind: 'weekend', venue: 'Kingsmead Rec', school: null }, { date: '2026-11-24', kind: 'school', venue: null, school: 'Brackenmoor Primary' }],
  coming: [{ date: '2026-11-28', kind: 'weekend', venue: 'Kingsmead Rec', school: null }],
  venues: [{ name: 'Kingsmead Rec', when: 'Saturday 10:00', where: '1 Park Lane, BR1 2AB' }],
  booklet: { week: 4, title: 'Rally and return', focus: 'Forehand', homeTask: 'Ten bounces on the racket' },
  pack: ['Racket', 'Ball tube'],
  keyDates: [{ when: 'January 2027', label: 'National Delivery Partner mobilises' }],
}
const VOICE = { tone: 'warm and encouraging', signOff: 'The Brackenmoor team', use: ['have a go'], avoid: ['elite'], readingAge: 9 }

test('AI prompt: the whole prompt, as sent (snapshot)', () => {
  const p = P.buildNewsletterPrompt(FACTS, VOICE, 'this_week')
  assert.equal(p.system, `You write short email newsletters for parents on behalf of Brackenmoor Tennis, a sports programme for children and families.

Rules — follow every one:
1. UK English spelling and dates (e.g. "Saturday 5 December", "colour", "programme").
2. Warm and short. A parent should be able to read the whole newsletter in 60 seconds: at most 3 sections, each body under 70 words.
3. Use only the facts supplied in the FACTS block. Do not invent sessions, dates, times, venues, prizes, people or quotes.
4. Make no claims about reach, numbers or outcomes (how many children, how much they improved, what research shows) unless that exact number or outcome is in the FACTS.
5. Never name a child. Never include anyone’s email address or phone number.
6. Plain language for a reading age of about 9: short sentences, everyday words, no jargon.
7. Tone: warm and encouraging.
8. End the last section with the sign-off: "The Brackenmoor team".
9. Where it fits naturally, use these words or phrases: "have a go".
10. Never use these words or phrases: "elite".
11. If the facts are thin, write less. Never pad with made-up detail.

Reply with JSON only, no other text.`)
  assert.equal(p.user, `FACTS
Organisation: Brackenmoor Tennis
Today: Thursday 26 November

Sessions that ran in the last two weeks:
- Saturday 21 November: weekend family session at Kingsmead Rec
- Tuesday 24 November: school session (Brackenmoor Primary)

Sessions coming up in the next three weeks:
- Saturday 28 November: weekend family session at Kingsmead Rec

Weekend venues:
- Kingsmead Rec, Saturday 10:00, 1 Park Lane, BR1 2AB

Booklet this week:
- Week 4: Rally and return (focus: Forehand). Home task: Ten bounces on the racket

In the welcome pack:
- Racket, Ball tube

Key dates:
- January 2027: National Delivery Partner mobilises
END OF FACTS

Write a newsletter. Angle: What’s on this week. Tell families what is on in the coming days: which sessions, where and when, and the booklet task to try at home.

JSON shape: {"subject": string (under 60 characters), "preheader": string (under 90 characters), "sections": [{"headline": string, "body": string}]}`)
})

test('AI prompt: only the facts supplied — nothing else reaches the model', () => {
  const empty = { ...FACTS, ran: [], coming: [], venues: [], booklet: null, pack: [], keyDates: [] }
  const p = P.buildNewsletterPrompt(empty, { ...VOICE, signOff: '', use: [], avoid: [] }, 'we_did')
  for (const gone of ['Kingsmead', 'Brackenmoor Primary', 'Rally', 'Racket', 'Delivery Partner']) assert.ok(!p.user.includes(gone), gone)
  assert.match(p.user, /- none recorded/)
  assert.match(p.user, /- none scheduled/)
  assert.match(p.system, /Make no claims about reach, numbers or outcomes/)
  assert.match(p.system, /Never name a child/)
  assert.match(p.system, /60 seconds/)
  assert.match(p.system, /UK English/)
  assert.match(p.system, /short, friendly sign-off from the team/)
  // The facts block never has a slot for a person.
  assert.ok(!/guardian|email address:|phone:/i.test(P.factsBlock(FACTS)))
})

test('AI prompt: three angles, a date push, and regenerating one section', () => {
  assert.deepEqual(P.ANGLES.map(a => a.label), ['What’s on this week', 'What we did', 'A push for a date'])
  assert.match(P.buildNewsletterPrompt(FACTS, VOICE, 'date_push', { kind: 'all' }, '2026-11-28').user, /The date to push is Saturday 28 November\./)
  assert.match(P.buildNewsletterPrompt(FACTS, VOICE, 'date_push').user, /Choose the next upcoming session/)
  const one = P.buildNewsletterPrompt(FACTS, VOICE, 'we_did', { kind: 'section', index: 1, current: { headline: 'Old', body: 'Old body' }, others: ['First'] })
  assert.match(one.user, /Rewrite section 2/)
  assert.match(one.user, /Headline: Old\nBody: Old body/)
  assert.match(one.user, /don't repeat them\): First/)
  assert.match(one.user, /\{"headline": string, "body": string\}$/)
})

test('AI reply: read defensively', () => {
  assert.deepEqual(P.parseDraft('Here you go: {"subject":"Hi","preheader":"P","sections":[{"headline":"H","body":"B"},{"headline":"","body":""}]} thanks'), { subject: 'Hi', preheader: 'P', sections: [{ headline: 'H', body: 'B' }], headline: undefined, body: undefined })
  assert.equal(P.parseDraft('no json here'), null)
  assert.equal(P.parseDraft('{broken'), null)
  assert.equal(P.parseDraft(`{"sections":[${'{"headline":"x","body":"y"},'.repeat(6)}{"headline":"x","body":"y"}]}`).sections.length, 3)
})

test('send: the plan skips who can’t be reached, with the reason, once per family', () => {
  const plan = S.planRecipients([...families, families[0]])
  assert.equal(plan.length, 9)
  assert.deepEqual(plan.filter(p => p.status === 'skipped').map(p => p.skip_reason), ['no consent', 'unsubscribed', 'no email', 'email bounced', 'opted out'])
  assert.equal(plan.filter(p => p.status === 'queued').length, 4)
})

test('send: chunks of 100, per-recipient statuses, a failed batch fails only its rows', async () => {
  const many = Array.from({ length: 250 }, (_, n) => fam(1000 + n))
  const fmap = new Map(many.map(f => [f.id, f]))
  const queued = many.map((f, n) => ({ id: `r${n}`, family_id: f.id }))
  const sizes = []
  let call = 0
  const out = await S.runBatches({
    queued, families: fmap, chunkSize: 100, max: 1000, now: () => 'T',
    render: f => ({ to: f.email, subject: 'S', html: `<a href="unsub-${f.id}">`, text: '', headers: {} }),
    send: async batch => { sizes.push(batch.length); call++; if (call === 2) return { error: 'Resend is down' }; return { ids: batch.map((m, i) => (call === 3 && i === 0 ? null : `re_${m.to}`)) } },
  })
  assert.deepEqual(sizes, [100, 100, 50])
  assert.equal(out.batches, 3)
  assert.equal(out.updates.filter(u => u.status === 'sent').length, 149)
  assert.equal(out.updates.filter(u => u.status === 'failed').length, 101)
  assert.deepEqual(out.updates.find(u => u.id === 'r150'), { id: 'r150', status: 'failed', error: 'Resend is down' })
  assert.deepEqual(out.updates.find(u => u.id === 'r0'), { id: 'r0', status: 'sent', provider_id: 're_p1000@example.com', sent_at: 'T' })
  assert.equal(out.updates.find(u => u.id === 'r200').error, 'No id came back for this email')
})

test('send: each email is rendered for its own family; at most `max` a run; consent re-checked at send time', async () => {
  const fs = [fam(1), fam(2), fam(3)]
  const fmap = new Map(fs.map(f => [f.id, f]))
  fmap.set(id(2), { ...fmap.get(id(2)), unsubscribed_at: 'just now' })
  const seen = []
  const out = await S.runBatches({ queued: fs.map((f, n) => ({ id: `r${n}`, family_id: f.id })).concat([{ id: 'gone', family_id: id(77) }]), families: fmap, max: 3,
    render: f => ({ to: f.email, subject: 'S', html: f.id, text: '', headers: {} }), send: async b => { seen.push(...b.map(m => m.html)); return { ids: b.map(() => 'x') } } })
  assert.deepEqual(seen, [id(1), id(3)])
  assert.deepEqual(out.updates.find(u => u.id === 'r1'), { id: 'r1', status: 'skipped', skip_reason: 'unsubscribed' })
  assert.equal(out.left, 1, 'the fourth waits for the next run')
})

test('send: results counts, and webhooks only move a recipient forward', () => {
  const c = S.countStatuses([{ status: 'sent' }, { status: 'delivered' }, { status: 'opened' }, { status: 'bounced' }, { status: 'unsubscribed' }, { status: 'skipped' }, { status: 'failed' }])
  assert.deepEqual(c, { recipients: 7, queued: 0, sent: 5, delivered: 3, opened: 1, bounced: 1, complained: 0, unsubscribed: 1, failed: 1, skipped: 1 })
  assert.equal(S.advances('opened', 'delivered'), false)
  assert.equal(S.advances('sent', 'opened'), true)
  assert.equal(S.advances('delivered', 'bounced'), true)
  assert.equal(S.chunk([1, 2, 3], 2).length, 2)
})

test('inbound: the org from the reply address, the family by exact email only', () => {
  assert.equal(I.impactReplyTo('ten-project'), 'reply+ten-project@inbound.lumiosports.com')
  assert.equal(I.impactReplyTo('Bad Slug'), null)
  assert.equal(I.slugFromRecipients(['Someone <other@x.com>', { address: 'Reply+Ten-Project@Inbound.LumioSports.com' }]), 'ten-project')
  assert.equal(I.slugFromRecipients('reply+AbCd123.sigsig@inbound.lumiosports.com'), null, 'a Coach token never matches')
  assert.equal(I.slugFromRecipients('reply+ten-project@evil.example'), null)
  assert.equal(I.senderAddress('"Pat Doyle" <Pat.Doyle@Example.com>'), 'pat.doyle@example.com')
  const fs = [fam(1), fam(2, { email: 'shared@example.com' }), fam(3, { email: 'Shared@example.com ' })]
  assert.equal(I.familyForSender('p1@example.com', fs)?.id, id(1))
  assert.equal(I.familyForSender('shared@example.com', fs), null, 'two families share it: filed as unknown, never guessed')
  assert.equal(I.familyForSender('nobody@example.com', fs), null)
  assert.equal(I.threadKeyFor(id(1), 'p1@example.com'), `family:${id(1)}`)
  assert.equal(I.threadKeyFor(null, 'nobody@example.com'), 'email:nobody@example.com')
  assert.equal(I.replyText('Yes we’ll be there!\n\nOn Thu, 26 Nov 2026 at 10:00, Ten Project <hello@x> wrote:\n> Are you coming?'), 'Yes we’ll be there!')
  assert.equal(I.replyText('Thanks\n> quoted\nBye'), 'Thanks\nBye')
})

// ── Automations ───────────────────────────────────────────────────────────────
const PROG = id(950), S_TOMORROW = id(960), W_TOMORROW = id(961), PAST1 = id(962), PAST2 = id(963), THIS_WEEK = id(964)
const CHILD = n => id(500 + n)
const world = (x = {}) => ({
  today: TODAY, weekday: 4, org: 'Brackenmoor Tennis',
  families: [
    fam(1, { created_at: '2026-11-26T08:00:00Z' }),                      // joined today
    fam(2, { created_at: '2026-11-25T08:00:00Z' }),                      // yesterday
    fam(3, { created_at: '2026-11-19T08:00:00Z' }),                      // a week ago
    fam(4, { created_at: '2026-01-01T08:00:00Z', source: 'community', community_venue_id: VENUE }),
    fam(5, { created_at: '2026-11-26T08:00:00Z', email: null }),         // new, no email
    fam(6, { created_at: '2026-01-01T08:00:00Z', source: 'community', community_venue_id: VENUE, waitlisted_at: '2026-11-01' }),
  ],
  children: [
    { id: CHILD(1), family_id: id(1), programme_id: PROG, school_id: SCHOOL },
    { id: CHILD(3), family_id: id(3), programme_id: PROG, school_id: SCHOOL },
    { id: CHILD(4), family_id: id(4), programme_id: null, school_id: null },
  ],
  programmes: [{ id: PROG, school_id: SCHOOL, current_week: 4 }],
  sessions: [
    { id: S_TOMORROW, kind: 'school', programme_id: PROG, venue_id: null, session_date: '2026-11-27' },
    { id: W_TOMORROW, kind: 'weekend', programme_id: null, venue_id: VENUE, session_date: '2026-11-27' },
    { id: PAST1, kind: 'weekend', programme_id: null, venue_id: VENUE, session_date: '2026-11-14' },
    { id: PAST2, kind: 'weekend', programme_id: null, venue_id: VENUE, session_date: '2026-11-21' },
    { id: THIS_WEEK, kind: 'school', programme_id: PROG, venue_id: null, session_date: '2026-11-25' },
  ],
  attendance: [{ session_id: PAST1, child_id: CHILD(4), present: false }, { session_id: PAST2, child_id: CHILD(4), present: false }, { session_id: PAST1, child_id: CHILD(3), present: true }, { session_id: PAST2, child_id: CHILD(3), present: false }],
  packIssues: [{ id: id(970), child_id: CHILD(3), issued_at: '2026-11-25T15:00:00Z' }, { id: id(971), child_id: CHILD(1), issued_at: '2026-11-01T15:00:00Z' }],
  venues: [{ id: VENUE, name: 'Kingsmead Rec', session_time: '10:00' }],
  bookletWeeks: [{ week: 4, title: 'Rally and return', home_task: 'Ten bounces on the racket' }],
  done: new Set(), usedToday: new Set(),
  ...x,
})
const auto = (kind, config = {}) => ({ id: `a-${kind}`, kind, enabled: true, config })
const who = sel => sel.send.map(c => `${c.kind}:${Number(c.familyId.slice(-12))}:${c.step.split(':')[0]}`)

test('automations: welcome — instant, day 1, day 7; only families who joined after it was switched on', () => {
  const sel = M.selectAutomations([auto('welcome', { since: '2026-11-01T00:00:00Z' })], world())
  assert.deepEqual(who(sel), ['welcome:1:instant', 'welcome:2:instant', 'welcome:3:day7'])
  assert.deepEqual(sel.skipped.map(s => [Number(s.familyId.slice(-12)), s.reason]), [[5, 'no email']])
  assert.equal(sel.send[0].subject, 'Welcome to Brackenmoor Tennis')
  assert.match(sel.send[0].body, /^Hi Parent,/)
  const after = M.selectAutomations([auto('welcome', { since: '2026-11-01T00:00:00Z' })], world({ done: new Set([`a-welcome|${id(2)}|instant`]) }))
  assert.ok(who(after).includes('welcome:2:day1'), 'instant done → day 1 next')
  assert.deepEqual(who(M.selectAutomations([auto('welcome')], world())), [], 'never switched on → nobody')
  assert.deepEqual(who(M.selectAutomations([auto('welcome', { since: '2026-11-26T00:00:00Z' })], world())), ['welcome:1:instant'])
  assert.deepEqual(who(M.selectAutomations([auto('welcome', { since: '2026-11-26T09:00:00Z' })], world())), [], 'switched on after they joined that morning → not them')
})

test('automations: session reminder the day before, per venue / school; waiting list left out', () => {
  const sel = M.selectAutomations([auto('session_reminder')], world())
  assert.deepEqual(who(sel), ['session_reminder:1:session', 'session_reminder:3:session', 'session_reminder:4:session'])
  assert.equal(sel.send[2].subject, 'See you tomorrow at Kingsmead Rec')
  assert.match(sel.send[2].body, /tomorrow, Friday 27 November at 10:00 at Kingsmead Rec/)
  assert.deepEqual(who(M.selectAutomations([auto('session_reminder', { venues: [VENUE], schools: [OTHER_SCHOOL] })], world())), ['session_reminder:4:session'])
})

test('automations: “we missed you” after two absences in a row; pack issued; booklet nudge only on Mondays', () => {
  assert.deepEqual(who(M.selectAutomations([auto('missed_you')], world())), ['missed_you:4:missed'])
  assert.deepEqual(who(M.selectAutomations([auto('pack_issued')], world())), ['pack_issued:3:pack'])
  assert.deepEqual(who(M.selectAutomations([auto('booklet_nudge')], world())), [], 'Thursday')
  const mon = M.selectAutomations([auto('booklet_nudge')], world({ today: '2026-11-23', weekday: 1 }))
  assert.deepEqual(who(mon), ['booklet_nudge:1:week', 'booklet_nudge:3:week'])
  assert.equal(mon.send[0].subject, 'This week’s booklet: Rally and return')
  assert.match(mon.send[0].body, /Ten bounces on the racket/)
})

test('automations: one automated message per family per day, by priority; a step goes once; off means off', () => {
  const all = [auto('welcome', { since: '2026-11-01T00:00:00Z' }), auto('session_reminder'), auto('pack_issued'), auto('missed_you')]
  const sel = M.selectAutomations(all, world())
  assert.deepEqual(who(sel), ['welcome:1:instant', 'welcome:2:instant', 'welcome:3:day7', 'session_reminder:4:session'])
  assert.deepEqual(sel.waiting.map(c => `${c.kind}:${Number(c.familyId.slice(-12))}`), ['pack_issued:3', 'session_reminder:1', 'session_reminder:3', 'missed_you:4'])
  assert.equal(new Set(sel.send.map(c => c.familyId)).size, sel.send.length)
  const used = M.selectAutomations(all, world({ usedToday: new Set([id(4)]) }))
  assert.ok(!used.send.some(c => c.familyId === id(4)), 'already had one today')
  const done = M.selectAutomations([auto('session_reminder')], world({ done: new Set([`a-session_reminder|${id(4)}|session:${W_TOMORROW}`]) }))
  assert.ok(!done.send.some(c => c.familyId === id(4)))
  assert.deepEqual(who(M.selectAutomations([{ ...auto('session_reminder'), enabled: false }], world())), [])
})

test('automations: edited templates, and no child-name placeholder', () => {
  const t = M.templateFor('welcome', 'day7', { templates: { day7: { subject: 'Week one done, {first_name}!', body: '' } } })
  assert.deepEqual(t, { subject: 'Week one done, {first_name}!', body: M.DEFAULT_TEMPLATES.welcome.day7.body })
  assert.equal(M.fill('{first_name} {child} {org}', { first_name: 'Pat', org: 'X' }), 'Pat {child} X')
  for (const k of M.AUTOMATION_KINDS) assert.ok(!M.AUTOMATION_META[k].placeholders.some(p => /child/.test(p)))
})

test('AI cost: pence from tokens, £2 a day, Lumio Test override only', () => {
  assert.equal(C.costPence('claude-sonnet-4-6', 1_000_000, 0), 240)
  assert.equal(C.costPence('claude-sonnet-4-6', 2000, 500), 1.08)
  assert.equal(C.dailyCapPence('ten-project', { IMPACT_AI_DAILY_PENCE_LUMIO_TEST: '50' }), 200)
  assert.equal(C.dailyCapPence('lumio-test', { IMPACT_AI_DAILY_PENCE_LUMIO_TEST: '50' }), 50)
  assert.equal(C.dailyCapPence('lumio-test', { IMPACT_AI_DAILY_PENCE_LUMIO_TEST: 'lots' }), 200)
  assert.equal(C.featureOf('newsletter'), 'newsletter')
  assert.equal(C.featureOf('anything'), 'other')
  assert.equal(C.ukDayStart(new Date('2026-11-26T15:00:00Z')), '2026-11-26T00:00:00.000Z')
  assert.equal(C.ukDayStart(new Date('2026-07-01T15:00:00Z')), '2026-06-30T23:00:00.000Z', 'BST')
})

test('newsletter: sections cleaned (https only), problems in plain words, footer always there', () => {
  const s = N.cleanSections([{ headline: ' Hi ', body: 'Para one\n\nPara two', image: { url: 'http://x.com/a.png', alt: 'a' }, button: { label: 'Book', url: 'https://x.com/book' } }, { headline: '', body: '' }, 'junk'])
  assert.deepEqual(s, [{ headline: 'Hi', body: 'Para one\n\nPara two', image: null, button: { label: 'Book', url: 'https://x.com/book' } }])
  assert.equal(N.draftProblem({ subject: '', sections: s }), 'Add a subject line.')
  assert.equal(N.draftProblem({ subject: 'S', sections: [] }), 'Add at least one section.')
  assert.equal(N.draftProblem({ subject: 'S', sections: s }), null)
  const { html, text } = N.renderNewsletter({ subject: 'News <b>', preheader: 'Pre', sections: s }, { org: 'Brackenmoor Tennis', address: '1 Park Lane, Brackenmoor', sender: 'hello@brackenmoor.example' }, 'https://www.lumiosports.com/api/impact/unsubscribe?t=abc')
  assert.match(html, /News &lt;b&gt;/)
  assert.match(html, /<p style="margin:0 0 12px;">Para one<\/p><p style="margin:0 0 12px;">Para two<\/p>/)
  assert.match(html, /1 Park Lane, Brackenmoor/)
  assert.match(html, /Sent by Brackenmoor Tennis from hello@brackenmoor\.example/)
  assert.match(html, /href="https:\/\/www\.lumiosports\.com\/api\/impact\/unsubscribe\?t=abc"/)
  assert.match(text, /Unsubscribe: https:\/\/www\.lumiosports\.com/)
  assert.match(N.renderNewsletter({ subject: 'S', preheader: '', sections: s }, { org: 'O', address: null, sender: null }, null).html, /each family gets its own link/)
})

test('quiet hours: across midnight, in UK time; brand voice defaults', () => {
  const q = Q.quietHours({})
  assert.deepEqual(q, { start: '20:00', end: '08:00' })
  assert.equal(Q.inQuietHours(new Date('2026-11-26T21:00:00Z'), q), true)
  assert.equal(Q.inQuietHours(new Date('2026-11-26T07:59:00Z'), q), true)
  assert.equal(Q.inQuietHours(new Date('2026-11-26T08:00:00Z'), q), false)
  assert.equal(Q.inQuietHours(new Date('2026-07-01T07:30:00Z'), q), false, '08:30 BST')
  assert.equal(Q.inQuietHours(new Date('2026-11-26T13:00:00Z'), { start: '12:00', end: '14:00' }), true)
  assert.deepEqual(Q.quietHours({ quietStart: '25:00', quietEnd: '07:30' }), { start: '20:00', end: '07:30' })
  assert.deepEqual(Q.brandVoice({ voice: { readingAge: 40, use: 'have a go, well done' } }, 'Team'), { tone: 'warm, friendly and encouraging', signOff: 'Team', use: ['have a go', 'well done'], avoid: [], readingAge: 9 })
  assert.deepEqual(Q.ukClock(new Date('2026-11-23T10:00:00Z')), { date: '2026-11-23', time: '10:00', weekday: 1 })
})
