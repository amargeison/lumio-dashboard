// Contact forms on hosted static sites: the config decides the inbox, sender and name; the
// visitor's input is checked and escaped; bots are spotted.
import test from 'node:test'
import assert from 'node:assert/strict'
import './brackenmoor.mjs'   // registers the @/ import hooks

const F = await import('../../src/lib/impact/site-form.ts')

const RAW = JSON.stringify({
  charity: { to: 'contact@charity.example', from: 'impact@lumiosports.com', name: 'Example Charity', origins: ['https://www.charity.example', 'http://insecure.example', 'javascript:x'] },
  broken: { to: 'not-an-email', from: 'impact@lumiosports.com', name: 'X' },
  injected: { to: 'a@b.example', from: 'impact@lumiosports.com', name: 'Evil <x@y.z>\r\nBcc: z@z.z' },
})

test('site form config: only configured sites, with valid addresses', () => {
  assert.deepEqual(F.siteFormConfig('charity', RAW), { to: 'contact@charity.example', from: 'impact@lumiosports.com', name: 'Example Charity', origins: ['https://www.charity.example'] })
  assert.equal(F.siteFormConfig('nope', RAW), null)
  assert.equal(F.siteFormConfig('broken', RAW), null)
  assert.equal(F.siteFormConfig('../etc', RAW), null)
  assert.equal(F.siteFormConfig('charity', '{bad json'), null)
  assert.equal(F.siteFormConfig('charity', undefined), null)
  assert.equal(F.siteFormConfig('injected', RAW).name, 'Evil x@y.zBcc: z@z.z', 'no quotes, angle brackets or line breaks in the display name')
})

test('site form: a bot fills the hidden field or is too quick', () => {
  const now = 1_000_000
  assert.equal(F.siteFormBot({ startedAt: now - 10_000 }, now), false)
  assert.equal(F.siteFormBot({ startedAt: now - 10_000, website: 'http://spam' }, now), true)
  assert.equal(F.siteFormBot({ startedAt: now - 500 }, now), true)
  assert.equal(F.siteFormBot({}, now), true)
})

test('site form: fields are checked and trimmed', () => {
  assert.deepEqual(F.parseSiteForm({ name: '  Sam\nSmith ', email: ' Sam@Example.org ', org: '', message: ' Hello\r\nthere ' }),
    { ok: true, value: { name: 'Sam Smith', email: 'sam@example.org', org: '', message: 'Hello\nthere' } })
  assert.equal(F.parseSiteForm({ name: '', email: 'a@b.co', message: 'hi there' }).field, 'name')
  assert.equal(F.parseSiteForm({ name: 'A', email: 'a@b', message: 'hi there' }).field, 'email')
  assert.equal(F.parseSiteForm({ name: 'A', email: 'x@y.co\r\nBcc: z@z.z', message: 'hi' }).field, 'email')
  assert.equal(F.parseSiteForm({ name: 'A', email: 'a@b.co', message: ' ' }).field, 'message')
  assert.equal(F.parseSiteForm({ name: 'A', email: 'a@b.co', message: 'x'.repeat(9000) }).value.message.length, 5000)
})

test('site form email: escaped, names the site, says reply goes to the sender', () => {
  const site = F.siteFormConfig('charity', RAW)
  const m = F.siteFormEmail(site, { name: 'Sam <b>', email: 'sam@example.org', org: 'Club & Co', message: '<script>x()</script>' }, 'https://lumiosports.com/tenprojectfoundation/contact')
  assert.equal(m.subject, 'Website message from Sam <b>')
  assert.ok(!m.html.includes('<script>') && m.html.includes('&lt;script&gt;') && m.html.includes('Club &amp; Co') && m.html.includes('Sam &lt;b&gt;'))
  assert.match(m.text, /Organisation: Club & Co/)
  assert.match(m.text, /Example Charity website \(https:\/\/lumiosports\.com\/tenprojectfoundation\/contact\)/)
  assert.ok(!F.siteFormEmail(site, { name: 'A', email: 'a@b.co', org: '', message: 'hi' }).text.includes('Organisation'))
})
