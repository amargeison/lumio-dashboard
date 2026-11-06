import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
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
const { hashInviteToken, inviteEmail, inviteLink, invitesLeft, newInviteToken, INVITE_HOURLY_LIMIT } = await import('../../src/lib/impact/invites.ts')
const { familiesMessagedNoLogin, activationPct, familiesToInvite, memberLines, portalAccess } = await import('../../src/lib/impact/members.ts')
const { ageFrom, coachPayments, coachRows } = await import('../../src/lib/impact/member-actions.ts')
const { EMPTY_PACKS, issueLines } = await import('../../src/lib/impact/packs.ts')
const { familyWeek, weekRange } = await import('../../src/lib/impact/family-week.ts')
const { pickRegisterSession, sessionDay, sessionShort } = await import('../../src/lib/impact/register-session.ts')
const { buildCohorts, mapLiveRows } = await import('../../src/lib/impact/live-context.ts')

const member = (o = {}) => ({ id: 'm1', user_id: 'u', hq_id: 'org-a', role: 'parent', staff_id: null, family_id: 'f1', school_id: null, invited_email: 'p@a.test', invited_at: '2026-11-01', accepted_at: '2026-11-02', revoked_at: null, ...o })
const invite = (o = {}) => ({ id: 'i1', hq_id: 'org-a', role: 'parent', staff_id: null, family_id: 'f1', school_id: null, email: 'p@a.test', expires_at: '2026-11-10T00:00:00Z', accepted_at: null, revoked_at: null, created_at: '2026-11-03T00:00:00Z', ...o })
const NOW = new Date('2026-11-06T00:00:00Z')

test('tokens are long, unique, and only the hash is comparable', () => {
  const a = newInviteToken(), b = newInviteToken()
  assert.notEqual(a, b)
  assert.ok(a.length >= 43)
  assert.match(hashInviteToken(a), /^[0-9a-f]{64}$/)
  assert.notEqual(hashInviteToken(a), a)
  assert.equal(hashInviteToken(a), hashInviteToken(a))
})
test('the link goes to sign-in with the address filled in', () => {
  const u = new URL(inviteLink('https://www.lumiosports.com', 'a+b@c.test', 'tok'))
  assert.equal(u.pathname, '/sports-login')
  assert.equal(u.searchParams.get('email'), 'a+b@c.test')
  assert.equal(u.searchParams.get('invite'), 'tok')
})
test('the email has one link, says 7 days, and escapes the org name', () => {
  const m = inviteEmail({ org: 'A <b> Club', role: 'parent', link: 'https://x.test/?a=1&b=2' })
  assert.equal(m.html.match(/<a /g).length, 1)
  assert.match(m.html, /7 days/)
  assert.ok(!m.html.includes('<b>'))
  assert.ok(m.html.includes('a=1&amp;b=2'))
})
test('invites stop at 50 an hour', () => {
  assert.equal(INVITE_HOURLY_LIMIT, 50)
  assert.equal(invitesLeft(0), 50)
  assert.equal(invitesLeft(49), 1)
  assert.equal(invitesLeft(50), 0)
  assert.equal(invitesLeft(70), 0)
})

test('routing: a member of this org gets their role', () => {
  const a = portalAccess([member()], 'org-a', false)
  assert.equal(a.kind, 'member'); assert.equal(a.member.role, 'parent')
})
test('routing: a parent on another org’s address is refused', () => assert.equal(portalAccess([member()], 'org-b', false).kind, 'denied'))
test('routing: a revoked member is refused, not treated as a visitor', () => assert.equal(portalAccess([member({ revoked_at: '2026-11-03' })], 'org-a', false).kind, 'denied'))
test('routing: an invited-only member has no access yet', () => assert.equal(portalAccess([member({ accepted_at: null })], 'org-a', false).kind, 'denied'))
test('routing: another org’s HQ is refused', () => assert.equal(portalAccess([], 'org-a', true).kind, 'denied'))
test('routing: someone with no link to Impact stays a visitor', () => assert.equal(portalAccess([], 'org-a', false).kind, 'public'))
test('routing: the coach view comes first for someone holding two roles', () => {
  const both = [member(), member({ id: 'm2', role: 'coach', staff_id: 's1', family_id: null })]
  const a = portalAccess(both, 'org-a', false)
  assert.equal(a.member.role, 'coach'); assert.equal(a.otherRole, 'parent')
  const b = portalAccess(both, 'org-a', false, 'parent')
  assert.equal(b.member.role, 'parent'); assert.equal(b.otherRole, 'coach')
})
test('routing: ?view= can’t reach a role the person doesn’t hold', () => {
  const a = portalAccess([member()], 'org-a', false, 'coach')
  assert.equal(a.member.role, 'parent'); assert.equal(a.otherRole, null)
  assert.equal(portalAccess([member()], 'org-a', false, 'hq').member.role, 'parent')
})
test('routing: a real member can never be given the HQ role', () => {
  const page = readFileSync(new URL('../../src/app/impact/[slug]/page.tsx', import.meta.url), 'utf8')
  assert.match(page, /typeof window === 'undefined' \|\| lockTo/)
  assert.match(page, /!roleOn\(role\) && !lockTo/)
})

test('members list: an accepted member is active', () => assert.equal(memberLines([member()], [], NOW)[0].status, 'active'))
test('members list: a waiting invite is invited, a lapsed one expired', () => {
  assert.equal(memberLines([], [invite()], NOW)[0].status, 'invited')
  assert.equal(memberLines([], [invite({ expires_at: '2026-11-01T00:00:00Z' })], NOW)[0].status, 'expired')
})
test('members list: a used invite doesn’t add a second line', () => {
  const lines = memberLines([member()], [invite({ accepted_at: '2026-11-02' })], NOW)
  assert.equal(lines.length, 1); assert.equal(lines[0].status, 'active')
})
test('members list: only the latest invite counts', () => {
  const lines = memberLines([], [invite({ id: 'old', revoked_at: '2026-11-02', created_at: '2026-11-01' }), invite({ id: 'new', created_at: '2026-11-04' })], NOW)
  assert.equal(lines.length, 1); assert.equal(lines[0].inviteId, 'new')
})
test('members list: a revoked member with a fresh invite shows as invited', () => {
  const lines = memberLines([member({ revoked_at: '2026-11-03' })], [invite({ created_at: '2026-11-04' })], NOW)
  assert.equal(lines[0].status, 'invited'); assert.equal(lines[0].memberId, 'm1')
})

test('bulk: skips logins, waiting invites, no email and unsubscribed', () => {
  const fams = [
    { id: 'f1', email: 'a@a.test', unsubscribed: false }, { id: 'f2', email: 'b@a.test', unsubscribed: false },
    { id: 'f3', email: '  ', unsubscribed: false }, { id: 'f4', email: 'd@a.test', unsubscribed: true }, { id: 'f5', email: 'e@a.test', unsubscribed: false },
  ]
  const lines = memberLines([member()], [invite({ id: 'i2', family_id: 'f2' })], NOW)
  assert.deepEqual(familiesToInvite(fams, lines).map(f => f.id), ['f5'])
})
test('bulk: a revoked or expired family can be invited again', () => {
  const fams = [{ id: 'f1', email: 'a@a.test', unsubscribed: false }]
  assert.equal(familiesToInvite(fams, memberLines([member({ revoked_at: '2026-11-03' })], [], NOW)).length, 1)
  assert.equal(familiesToInvite(fams, memberLines([], [invite({ expires_at: '2026-11-01T00:00:00Z' })], NOW)).length, 1)
})

test('activation: families with an accepted parent login, per school', () => {
  const kids = [{ family_id: 'f1', school_id: 's' }, { family_id: 'f1', school_id: 's' }, { family_id: 'f2', school_id: 's' }, { family_id: 'f3', school_id: 'other' }]
  assert.equal(activationPct(kids, [member()], 's'), 50)
  assert.equal(activationPct(kids, [], 's'), 0)
  assert.equal(activationPct(kids, [member({ accepted_at: null })], 's'), 0)
  assert.equal(activationPct(kids, [member({ revoked_at: '2026-11-03' })], 's'), 0)
  assert.equal(activationPct(kids, [member({ role: 'coach' })], 's'), 0)
})
test('activation: a school with no families reads as no figure', () => assert.equal(activationPct([], [], 's'), null))

test('a coach sees paid or not, never an amount', () => {
  const p = { ...EMPTY_PACKS, items: [{ id: 'r', name: 'Racket', kind: 'paid', price_pence: 1000, has_sizes: false, sizes: [], active: true, sort: 0 }] }
  assert.match(issueLines(p, 'c')[0].why, /Not paid/)
  const line = issueLines(p, 'c', true)[0]
  assert.equal(line.why, 'Not paid yet · HQ records payment'); assert.equal(line.canIssue, false)
  assert.ok(!/£/.test(line.why))
  const paid = coachPayments({ paid: [{ child_id: 'c', item_id: 'r' }] })
  assert.equal(paid[0].amount_pence, 0)
  const ok = issueLines({ ...p, payments: paid }, 'c', true)[0]
  assert.equal(ok.canIssue, true); assert.equal(ok.why, null)
})

test('coach rows: a register builds from the coach’s home, carrying no HQ fields', () => {
  const home = {
    hq_id: 'org-a', families: [], paid: [], venues: [], schools: [{ id: 's', name: 'A', borough: null, address: null, status: 'running' }],
    programmes: [{ id: 'p', school_id: 's', term_label: 'Autumn', year_groups: null, current_week: 1, status: 'running', lead_staff_id: 'st', venue_id: null }],
    children: [{ id: 'k', family_id: 'f', programme_id: 'p', school_id: 's', name: 'Kid One', year_group: 'Y3', school: 'A', medical_notes: 'Asthma', send: true, consent_photo: false, stickers: 2 }],
    sessions: [{ id: 'x', kind: 'school', programme_id: 'p', session_date: '2026-10-01', week_number: 1, lead_staff_id: 'st', venue_id: null, venue: null }],
    attendance: [{ session_id: 'x', child_id: 'k', present: true, via: 'register' }],
  }
  const rows = coachRows(home)
  const [c] = buildCohorts(rows)
  assert.equal(c.leadStaffId, 'st'); assert.equal(c.sessionId, 'x'); assert.equal(c.children[0].present, true); assert.equal(c.label, 'A — Autumn')
  assert.equal(rows.children[0].date_of_birth, null)
  assert.ok(!('fsm' in rows.children[0]) && !('pupil_premium' in rows.children[0]) && !('gender' in rows.children[0]))
})
const ses = (id, date, o = {}) => ({ id, kind: 'school', session_date: date, week_number: null, venue: 'Rec', ...o })
const booklet = { title: 'B', intro: '', stickers: [], weeks: [{ week: 2, title: 'Rallies', focus: 'Keep it going', home_task: 'Ten in a row' }, { week: 3, title: '', focus: '', home_task: '' }] }
test('this week: the next session and its place in the term', () => {
  const w = familyWeek([[ses('a', '2026-10-01'), ses('b', '2026-11-10'), ses('c', '2026-11-17')]], booklet, '2026-11-06')
  assert.equal(w.next.id, 'b'); assert.equal(w.week, 2); assert.equal(w.booklet.title, 'Rallies')
})
test('this week: a session’s own week number wins', () => assert.equal(familyWeek([[ses('a', '2026-11-10', { week_number: 7 })]], booklet, '2026-11-06').week, 7))
test('this week: after the last session it says so, and never shows the past week', () => {
  const w = familyWeek([[ses('a', '2026-09-01'), ses('b', '2026-09-08')]], booklet, '2026-11-06')
  assert.deepEqual(w, { next: null, week: null, booklet: null, sessionThisWeek: false })
})
test('this week: no session this week shows the next one, not the last one', () => {
  const w = familyWeek([[ses('a', '2026-10-27'), ses('b', '2026-11-17')]], booklet, '2026-11-06')
  assert.equal(w.sessionThisWeek, false); assert.equal(w.next.id, 'b'); assert.equal(w.week, 2)
})
test('this week: a session earlier this week still counts, and next stays the next', () => {
  const w = familyWeek([[ses('a', '2026-11-03'), ses('b', '2026-11-17')]], booklet, '2026-11-06')
  assert.equal(w.sessionThisWeek, true); assert.equal(w.next.id, 'b'); assert.equal(w.week, 1)
})
test('this week: a session later this week counts', () => assert.equal(familyWeek([[ses('a', '2026-11-08')]], booklet, '2026-11-06').sessionThisWeek, true))
test('this week: another child’s session counts for the family', () => {
  const w = familyWeek([[ses('a', '2026-11-20')], [ses('b', '2026-11-03')]], booklet, '2026-11-06')
  assert.equal(w.sessionThisWeek, true); assert.equal(w.next.id, 'a'); assert.equal(w.week, 1)
})
test('this week: Monday to Sunday, across a year end', () => {
  assert.deepEqual(weekRange('2026-11-06'), ['2026-11-02', '2026-11-08'])
  assert.deepEqual(weekRange('2026-11-02'), ['2026-11-02', '2026-11-08'])
  assert.deepEqual(weekRange('2026-11-08'), ['2026-11-02', '2026-11-08'])
  assert.deepEqual(weekRange('2026-12-30'), ['2026-12-28', '2027-01-03'])
})
test('this week: a blank booklet week is treated as not written', () => assert.equal(familyWeek([[ses('a', '2026-09-01'), ses('b', '2026-09-08'), ses('c', '2026-11-10')]], booklet, '2026-11-06').booklet, null))
test('this week: with two children, the sooner session decides', () => {
  const w = familyWeek([[ses('a', '2026-11-20')], [ses('b', '2026-11-01'), ses('c', '2026-11-08')]], booklet, '2026-11-06')
  assert.equal(w.next.id, 'c'); assert.equal(w.week, 2)
})
test('this week: a weekend session sits in the school week before it', () => {
  const w = familyWeek([[ses('a', '2026-11-02'), ses('b', '2026-11-05'), ses('w', '2026-11-07', { kind: 'weekend' })]], booklet, '2026-11-06')
  assert.equal(w.next.id, 'w'); assert.equal(w.week, 2)
})
test('this week: no sessions, no booklet, no crash', () => assert.deepEqual(familyWeek([[], []], null, '2026-11-06'), { next: null, week: null, booklet: null, sessionThisWeek: false }))
test('this week: no demo wording reaches live', () => {
  const app = readFileSync(new URL('../../src/app/tenproject/[slug]/_components/ParentApp.tsx', import.meta.url), 'utf8')
  assert.match(app, /live \? <>Hi /)
  assert.match(app, /\{live \? <>\n\s+<div style=\{\{ background: TP_RED/)
})

test('age from a date of birth, and none without one', () => {
  assert.equal(ageFrom('2018-11-07', NOW), 7)
  assert.equal(ageFrom('2018-11-05', NOW), 8)
  assert.equal(ageFrom(null, NOW), 0)
})

test('the register a coach taps is the latest session that has happened', () => {
  const rows = {
    schools: [{ id: 's', name: 'School' }], programmes: [{ id: 'p', school_id: 's', term_label: 'Autumn' }], campaigns: [], events: [], donations: [], checkins: [],
    children: [{ id: 'k', name: 'Kid', year_group: 'Y3', programme_id: 'p', stickers: 0 }], attendance: [],
    sessions: ['2026-10-01', '2026-11-06', '2026-12-01'].map(d => ({ id: d, kind: 'school', programme_id: 'p', session_date: d })),
  }
  assert.equal(buildCohorts(rows, '2026-11-06')[0].sessionId, '2026-11-06', 'today counts')
  assert.equal(buildCohorts(rows, '2026-11-05')[0].sessionId, '2026-10-01', 'never one still to come')
  assert.equal(buildCohorts(rows, '2026-09-01')[0].sessionId, '2026-10-01', 'before the first session, the first session')
  assert.equal(buildCohorts(rows, '2027-01-01')[0].sessionId, '2026-12-01', 'after the last, the last')
})

test('session dates read the way the register shows them', () => {
  assert.equal(sessionDay('2026-09-22'), 'Tue 22 Sept')
  assert.equal(sessionDay('2026-12-03'), 'Thu 3 Dec')
  assert.equal(sessionShort('2026-12-03'), '3 Dec')
})
test('the register opens on today, else the latest past, else the first to come', () => {
  const list = ['2026-12-01', '2026-10-01', '2026-11-06'].map(d => ({ session_date: d }))
  assert.equal(pickRegisterSession(list, '2026-11-06').session_date, '2026-11-06')
  assert.equal(pickRegisterSession(list, '2026-11-20').session_date, '2026-11-06')
  assert.equal(pickRegisterSession(list, '2026-09-01').session_date, '2026-10-01')
  assert.equal(pickRegisterSession([], '2026-09-01'), undefined)
})
test('a cohort carries every session and who was present at each', () => {
  const rows = {
    schools: [{ id: 's', name: 'School' }], programmes: [{ id: 'p', school_id: 's', term_label: 'Autumn' }], campaigns: [], events: [], donations: [], checkins: [],
    children: [{ id: 'k', name: 'Kid', programme_id: 'p', stickers: 0 }, { id: 'j', name: 'Jo', programme_id: 'p', stickers: 0 }],
    sessions: [{ id: 'b', kind: 'school', programme_id: 'p', session_date: '2026-12-01', week_number: 9 }, { id: 'a', kind: 'school', programme_id: 'p', session_date: '2026-10-01' }, { id: 'w', kind: 'weekend', programme_id: 'p', session_date: '2026-10-03' }],
    attendance: [{ session_id: 'a', child_id: 'k', present: true }, { session_id: 'a', child_id: 'j', present: false }],
  }
  const [c] = buildCohorts(rows, '2026-11-06')
  assert.deepEqual(c.sessions, [{ id: 'a', date: '2026-10-01', week: null }, { id: 'b', date: '2026-12-01', week: 9 }])
  assert.deepEqual(c.presentBySession, { a: ['k'], b: [] })
})
test('the register asks before a future session, once, and the date is the session’s', () => {
  const src = readFileSync(new URL('../../src/app/tenproject/[slug]/_components/RegisterViews.tsx', import.meta.url), 'utf8')
  assert.match(src, /This session is on \{sessionShort\(chosen\.date\)\} — mark it now\?/)
  assert.match(src, /chosen\.date > today && !futureOk\[sessionId\] && !sure/)
})
test('families messaged with no login: distinct, and an accepted login takes them off', () => {
  const m = (o = {}) => ({ role: 'parent', family_id: 'f1', accepted_at: '2026-11-01', revoked_at: null, ...o })
  assert.equal(familiesMessagedNoLogin(['f1', 'f2', 'f2'], [m()]), 1)
  assert.equal(familiesMessagedNoLogin(['f1'], [m({ accepted_at: null })]), 1, 'an invite isn’t a login')
  assert.equal(familiesMessagedNoLogin(['f1'], [m({ revoked_at: '2026-11-02' })]), 1, 'nor is a revoked one')
  assert.equal(familiesMessagedNoLogin(['f1'], [m({ role: 'coach' })]), 1, 'nor a coach login')
  assert.equal(familiesMessagedNoLogin(undefined, undefined), 0)
})
test('Needs attention counts them, and says nothing at zero', () => {
  const base = { schools: [], programmes: [], campaigns: [], events: [], donations: [], checkins: [] }
  const items = rows => mapLiveRows({ ...base, ...rows }, '2026-11-06').NEEDS_ATTENTION.filter(i => i.id === 'app-no-login')
  assert.deepEqual(items({ appMessaged: ['a', 'b'] }).map(i => [i.text, i.target.tab]), [['2 families have app messages but no login', 'families']])
  assert.equal(items({ appMessaged: ['a'] })[0].text, '1 family has app messages but no login')
  assert.equal(items({ appMessaged: [] }).length, 0)
})
