// Settings (brief 5): term dates feeding term.ts, the AI and text switches, the charity
// line in the newsletter footer, the privacy-policy gate and the logo check. The routes and
// the audit log are exercised in scripts/impact-settings-test.mjs.
import test from 'node:test'
import assert from 'node:assert/strict'
import './brackenmoor.mjs'   // registers the @/ import hooks

const T = await import('../../src/lib/impact/term.ts')
const O = await import('../../src/lib/impact/org.ts')
const N = await import('../../src/lib/impact/newsletter.ts')
const L = await import('../../src/lib/impact/logo.ts')
const J = await import('../../src/lib/impact/join-page.ts')

const TERMS = [
  { name: 'Autumn', start: '2026-09-03', end: '2026-12-18' },
  { name: 'Spring', start: '2027-01-05', end: '2027-03-26' },
  { name: 'Summer', start: '2027-04-12', end: '2027-07-21' },
]

test('term dates: no dates → the fixed terms, as before', () => {
  assert.deepEqual(T.termOf('2026-11-27'), { name: 'Autumn', start: '2026-09-01', end: '2026-12-31' })
  assert.deepEqual(T.termOf('2027-02-01', []), { name: 'Spring', start: '2027-01-01', end: '2027-03-31' })
  assert.deepEqual(T.termOf('2027-05-01', undefined), { name: 'Summer', start: '2027-04-01', end: '2027-08-31' })
})

test('term dates: a date in the org’s term is that term; a holiday counts with the term just finished', () => {
  assert.deepEqual(T.termOf('2026-10-01', TERMS), { name: 'Autumn', start: '2026-09-03', end: '2027-01-04' })
  assert.deepEqual(T.termOf('2026-12-28', TERMS), { name: 'Autumn', start: '2026-09-03', end: '2027-01-04' }, 'Christmas holiday')
  assert.deepEqual(T.termOf('2027-04-02', TERMS), { name: 'Spring', start: '2027-01-05', end: '2027-04-11' }, 'Easter holiday')
  assert.deepEqual(T.termOf('2027-07-21', TERMS), { name: 'Summer', start: '2027-04-12', end: '2027-07-21' }, 'last day of the last term')
  assert.deepEqual(T.termOf('2027-08-10', TERMS), { name: 'Summer', start: '2027-04-01', end: '2027-08-31' }, 'after the last entered term: fixed')
  assert.deepEqual(T.termOf('2026-09-02', TERMS), { name: 'Autumn', start: '2026-09-01', end: '2026-12-31' }, 'before the first: fixed')
  assert.equal(T.inTerm('2027-01-04', T.termOf('2026-10-01', TERMS)), true)
  assert.equal(T.inTerm('2027-01-05', T.termOf('2026-10-01', TERMS)), false)
})

test('term dates: bad entries are ignored when read, and refused when saved', () => {
  const messy = [{ name: 'Autumn', start: '2026-09-03', end: '2026-12-18' }, { name: 'Winter', start: '2027-01-01', end: '2027-02-01' },
    { name: 'Spring', start: '2027-02-30', end: '2027-03-01' }, { name: 'Spring', start: '2027-03-01', end: '2027-01-01' }, 'x', null]
  assert.deepEqual(T.termDatesOf(messy), [{ name: 'Autumn', start: '2026-09-03', end: '2026-12-18' }])
  assert.equal(T.termDatesOf('nope').length, 0)
  assert.equal(T.termDatesProblem(TERMS), null)
  assert.match(T.termDatesProblem([{ name: 'Winter', start: '2026-09-01', end: '2026-12-01' }]), /Autumn, Spring or Summer/)
  assert.match(T.termDatesProblem([{ name: 'Autumn', start: '2026-09-01', end: '' }]), /start and an end/)
  assert.match(T.termDatesProblem([{ name: 'Autumn', start: '2026-12-01', end: '2026-09-01' }]), /before the start/)
  assert.match(T.termDatesProblem([{ name: 'Autumn', start: '2026-09-01', end: '2026-12-20' }, { name: 'Spring', start: '2026-12-15', end: '2027-03-01' }]), /overlap/)
})

test('AI and texts: on unless switched off', () => {
  assert.equal(O.aiFeatureOn({}, 'newsletter'), true)
  assert.equal(O.aiFeatureOn(null, 'import'), true)
  assert.equal(O.aiFeatureOn({ ai: { off: { newsletter: true } } }, 'newsletter'), false)
  assert.equal(O.aiFeatureOn({ ai: { off: { newsletter: true } } }, 'message'), true)
  assert.equal(O.smsOn({}), true)
  assert.equal(O.smsOn({ messaging: { sms: false } }), false)
  assert.equal(O.smsOn({ messaging: { sms: true } }), true)
})

test('newsletter footer: address, then the charity number once there is one', () => {
  assert.equal(N.footerAddress({ address: '1 High St', town: 'Leeds' }), '1 High St, Leeds')
  assert.equal(N.footerAddress({ address: '1 High St', charityNumber: ' 1234567 ' }), '1 High St · Registered charity no. 1234567')
  assert.equal(N.footerAddress({ charityNumber: '1234567' }), 'Registered charity no. 1234567')
  assert.equal(N.footerAddress({}), null)
})

test('privacy policy gate: /join is closed until there is an https link', () => {
  assert.equal(O.privacyUrlOf({}), null)
  assert.equal(O.privacyUrlOf({ privacyUrl: 'http://x.org/p' }), null)
  assert.equal(O.privacyUrlOf({ privacyUrl: 'javascript:alert(1)' }), null)
  assert.equal(O.privacyUrlOf({ privacyUrl: ' https://www.lumiosports.com/privacy ' }), 'https://www.lumiosports.com/privacy')
  assert.equal(J.privacyUrlOf, O.privacyUrlOf)
})

test('logo: PNG, JPEG and WebP by their bytes; anything else refused', () => {
  assert.deepEqual(L.logoKind(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0])), { type: 'image/png', ext: 'png' })
  assert.deepEqual(L.logoKind(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0])), { type: 'image/jpeg', ext: 'jpg' })
  assert.deepEqual(L.logoKind(new TextEncoder().encode('RIFF\0\0\0\0WEBPVP8 ')), { type: 'image/webp', ext: 'webp' })
  assert.equal(L.logoKind(new TextEncoder().encode('<svg onload="x()">')), null)
  assert.equal(L.logoKind(new TextEncoder().encode('GIF89a')), null)
  assert.equal(L.logoKind(new Uint8Array()), null)
})
