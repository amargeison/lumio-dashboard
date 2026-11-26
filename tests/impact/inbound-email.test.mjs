// Inbound email via Cloudflare (Email Worker → /api/inbound/email): the signature, which
// handler an address belongs to, the SPF/DKIM verdict, text-only bodies with attachments
// listed, and MIME parsing. The route itself is exercised in scripts/impact-comms-test.mjs.
import test from 'node:test'
import assert from 'node:assert/strict'
import './brackenmoor.mjs'   // registers the @/ import hooks

const M = await import('../../src/lib/inbound/message.ts')
const S = await import('../../src/lib/inbound/signature.ts')
const { parseMime } = await import('../../src/lib/inbound/parse.ts')

const D = 'inbound.lumiosports.com'
test('dispatch: Impact org address, Coach signed token, or nobody', () => {
  assert.equal(M.inboundKind('reply+ten-project@inbound.lumiosports.com', D), 'impact')
  assert.equal(M.inboundKind('Reply+Lumio-Test@Inbound.LumioSports.com', D), 'impact')
  assert.equal(M.inboundKind('reply+AQIDBAUGBwgJCgsMDQ4PEA.abc_DEF-123@inbound.lumiosports.com', D), 'coach')
  assert.equal(M.inboundKind('hello@inbound.lumiosports.com', D), null)
  assert.equal(M.inboundKind('reply+ten-project@lumiosports.com', D), null, 'only the inbound subdomain')
  assert.equal(M.inboundKind('reply+ten-project@inbound.lumiosports.com.evil.example', D), null)
  assert.equal(M.inboundKind('reply+@inbound.lumiosports.com', D), null)
})

test('SPF/DKIM: verified only when it passed; a DMARC fail or no header is flagged', () => {
  assert.equal(M.authVerdict('mx.cloudflare.net; dkim=pass header.d=gmail.com; spf=pass smtp.mailfrom=a@gmail.com; dmarc=pass'), true)
  assert.equal(M.authVerdict('mx.cloudflare.net; dkim=none; spf=pass smtp.mailfrom=x'), true)
  assert.equal(M.authVerdict('mx.cloudflare.net; dkim=fail; spf=softfail; dmarc=fail'), false)
  assert.equal(M.authVerdict('mx.cloudflare.net; dkim=pass; spf=pass; dmarc=fail'), false, 'DMARC fail wins')
  assert.equal(M.authVerdict('mx.cloudflare.net; dkim=fail; spf=fail'), false)
  assert.equal(M.authVerdict('evil.example; dkim=pass; spf=pass; dmarc=pass'), false, 'not Cloudflare’s header: not trusted')
  assert.equal(M.authVerdict(''), false)
  assert.equal(M.authVerdict(null), false)
})

test('body: text only, each attachment listed as not shown', () => {
  assert.equal(M.withAttachmentNotes(' Hi there \n', ['photo.jpg', 'form\n.pdf']), 'Hi there\n\n[Attachment not shown: photo.jpg]\n[Attachment not shown: form .pdf]')
  assert.equal(M.withAttachmentNotes('Just text', []), 'Just text')
  assert.equal(M.withAttachmentNotes('', ['a.png']), '[Attachment not shown: a.png]')
  assert.equal(M.extractAddress('"Pat" <Reply+AbC.dEf@Inbound.X>'), 'Reply+AbC.dEf@Inbound.X', 'case kept: Coach tokens are case-sensitive')
  assert.equal(M.lowerAddress('"Pat" <Pat@Example.COM>'), 'pat@example.com')
})

const raw = new TextEncoder().encode('From: a@b.c\r\n\r\nhello')
const H = (o = {}) => { const ts = String(Math.floor(Date.now() / 1000)); const h = new Headers({ 'x-lumio-timestamp': ts, 'x-lumio-envelope-to': 'reply+x@inbound.lumiosports.com', 'x-lumio-envelope-from': 'a@b.c', 'x-lumio-auth-results': 'spf=pass', ...o }); h.set('x-lumio-signature', S.signInbound('s3cret', h.get('x-lumio-timestamp'), h.get('x-lumio-envelope-to'), h.get('x-lumio-envelope-from'), h.get('x-lumio-auth-results'), raw)); return h }

test('signature: required, and covers the body, the envelope and the auth verdict', () => {
  assert.equal(S.verifyInbound('s3cret', H(), raw), true)
  assert.equal(S.verifyInbound(undefined, H(), raw), false, 'no secret on the server → refused')
  assert.equal(S.verifyInbound('other', H(), raw), false)
  assert.equal(S.verifyInbound('s3cret', H(), new TextEncoder().encode('From: a@b.c\r\n\r\nHELLO')), false, 'body changed')
  for (const k of ['x-lumio-envelope-to', 'x-lumio-envelope-from', 'x-lumio-auth-results']) {
    const h = H(); h.set(k, h.get(k) + 'x'); assert.equal(S.verifyInbound('s3cret', h, raw), false, k)
  }
  const old = H({ 'x-lumio-timestamp': String(Math.floor(Date.now() / 1000) - 600) })
  assert.equal(S.verifyInbound('s3cret', old, raw), false, 'older than five minutes')
  const none = H(); none.delete('x-lumio-signature'); assert.equal(S.verifyInbound('s3cret', none, raw), false)
})

const mime = (extra = '') => new TextEncoder().encode([
  'From: "Pat Doyle" <Pat.Doyle@Example.com>', 'To: reply+lumio-test@inbound.lumiosports.com', 'Subject: Re: Weekend news', 'Message-ID: <abc123@example.com>',
  'MIME-Version: 1.0', 'Content-Type: multipart/mixed; boundary="XX"', '', '--XX', 'Content-Type: text/plain; charset=utf-8', '',
  'Yes, we’ll be there!', '', 'On Thu, 26 Nov 2026, Lumio Test wrote:', '> Come and play.', '--XX',
  'Content-Type: application/pdf; name="form.pdf"', 'Content-Disposition: attachment; filename="form.pdf"', 'Content-Transfer-Encoding: base64', '', 'JVBERi0xLjQK', '--XX--', extra,
].join('\r\n'))

test('MIME: sender, envelope recipient first, subject, id, text, attachments by name, verdict', async () => {
  const m = await parseMime(mime(), { to: 'reply+lumio-test@inbound.lumiosports.com', from: 'bounce@example.com', authResults: 'mx.cloudflare.net; dkim=pass; spf=pass; dmarc=pass' })
  assert.equal(m.from, 'pat.doyle@example.com')
  assert.equal(m.fromName, 'Pat Doyle')
  assert.equal(m.recipients[0], 'reply+lumio-test@inbound.lumiosports.com')
  assert.equal(m.subject, 'Re: Weekend news')
  assert.equal(m.messageId, '<abc123@example.com>')
  assert.match(m.text, /^Yes, we’ll be there!/)
  assert.deepEqual(m.attachments, ['form.pdf'])
  assert.equal(m.verified, true)
  assert.equal((await parseMime(mime(), { to: 'x', from: '', authResults: 'mx.cloudflare.net; spf=fail; dkim=fail' })).verified, false)
  assert.equal((await parseMime(new TextEncoder().encode('Authentication-Results: mx.cloudflare.net; dkim=pass; spf=pass; dmarc=pass\r\n' + new TextDecoder().decode(mime())), { to: 'x', from: '', authResults: '' })).verified, false, 'a header inside the message is ignored')
  const html = new TextEncoder().encode('From: a@b.c\r\nTo: x@y.z\r\nSubject: s\r\nContent-Type: text/html\r\n\r\n<p>Hello <b>there</b></p><p>Bye</p>')
  assert.equal((await parseMime(html, { to: 'x@y.z', from: '', authResults: '' })).text, 'Hello there\nBye', 'HTML-only becomes text')
})
