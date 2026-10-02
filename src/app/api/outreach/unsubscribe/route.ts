import { NextRequest, NextResponse } from 'next/server'
import { unsubscribe } from '@/lib/outreach/core'
import { rateLimit, clientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'

// The unsubscribe link in every outreach email.
//
// GET shows a page with one button; it does NOT unsubscribe by itself. Mail
// scanners and link previewers open every link in a message, and an
// unsubscribe that fires on GET would opt people out before they had read a
// word. The button POSTs. Mail apps' own "Unsubscribe" control POSTs directly
// (List-Unsubscribe-Post), which lands on the same handler.
//
// The page never says whether a token was valid: "you're unsubscribed" either
// way, so the link cannot be used to test which addresses are on the list.

const page = (title: string, inner: string) => new NextResponse(
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>${title}</title></head>
<body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827">
<div style="max-width:440px;margin:12vh auto;padding:28px;background:#fff;border-radius:14px;border:1px solid #e5e7eb">
<div style="font-size:13px;font-weight:700;color:#3A8EE0;letter-spacing:.04em;margin-bottom:10px">LUMIO</div>${inner}</div></body></html>`,
  { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } })

const limited = (req: NextRequest) => !rateLimit(`outreach-unsub:${clientIp(req.headers)}`, 30, 10 * 60 * 1000).ok

export async function GET(req: NextRequest) {
  const t = (new URL(req.url).searchParams.get('t') || '').replace(/[^0-9a-f-]/gi, '').slice(0, 36)
  return page('Unsubscribe', `<h1 style="font-size:20px;margin:0 0 10px">Stop emails from Lumio?</h1>
<p style="font-size:14.5px;line-height:1.55;color:#4b5563;margin:0 0 18px">Press the button and this address will not be emailed again.</p>
<form method="post" action="/api/outreach/unsubscribe?t=${t}">
<button type="submit" style="appearance:none;border:0;border-radius:10px;background:#111827;color:#fff;font-size:15px;font-weight:700;padding:12px 20px;cursor:pointer">Unsubscribe</button></form>`)
}

export async function POST(req: NextRequest) {
  if (limited(req)) return page('Try again shortly', '<p style="font-size:14.5px;line-height:1.55;margin:0">Too many requests from this connection — please try again in a few minutes, or just reply to the email and say stop.</p>')
  const t = new URL(req.url).searchParams.get('t') || ''
  try { await unsubscribe(t) } catch (e) { console.error('[outreach/unsubscribe]', e) }
  return page('Unsubscribed', `<h1 style="font-size:20px;margin:0 0 10px">You’re unsubscribed</h1>
<p style="font-size:14.5px;line-height:1.55;color:#4b5563;margin:0">This address will not be emailed again. Sorry for the interruption.</p>`)
}
