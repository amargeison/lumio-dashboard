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
const { activationPct, familiesToInvite, memberLines, portalAccess } = await import('../../src/lib/impact/members.ts')
const { ageFrom, coachPayments, coachRows } = await import('../../src/lib/impact/member-actions.ts')
const { EMPTY_PACKS, issueLines } = await import('../../src/lib/impact/packs.ts')
const { familyWeek } = await import('../../src/lib/impact/family-week.ts')
const { buildCohorts } = await import('../../src/lib/impact/live-context.ts')

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
test('this week: after the last session it stays on that week, with nothing next', () => {
  const w = familyWeek([[ses('a', '2026-09-01'), ses('b', '2026-09-08')]], booklet, '2026-11-06')
  assert.equal(w.next, null); assert.equal(w.week, 2)
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
test('this week: no sessions, no booklet, no crash', () => assert.deepEqual(familyWeek([[], []], null, '2026-11-06'), { next: null, week: null, booklet: null }))
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
