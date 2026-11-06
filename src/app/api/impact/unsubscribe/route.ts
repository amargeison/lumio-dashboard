import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { familyFromUnsubscribeToken } from '@/lib/impact/comms-rules'

export const runtime = 'nodejs'

// The unsubscribe link in every Impact email. Nobody is signed in here: the
// signed token is the only authority, and it reaches exactly one family.
//
// GET only asks. Mail scanners open every link in a message, so a GET that
// unsubscribed would silently remove families who never clicked anything.
// POST does it, which is also what a mail app's one-click unsubscribe sends
// (RFC 8058). unsubscribed_at is set once and never moved here: only the family can
// clear it, by opting back in from their own login.

const page = (title: string, text: string, status: number, form = '') => new Response(
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title></head>`
  + `<body style="margin:0;background:#F7F5F2;font-family:Arial,sans-serif;color:#111;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;">`
  + `<main style="background:#fff;border:1px solid #E7E2DC;border-radius:14px;padding:24px;max-width:420px;text-align:center;">`
  + `<h1 style="font-size:18px;margin:0 0 8px;">${title}</h1><p style="font-size:14px;line-height:1.5;color:#555;margin:0;">${text}</p>${form}</main></body></html>`,
  { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } },
)

const invalid = () => page('This link isn’t valid', 'Please use the unsubscribe link from your most recent email.', 400)
const familyFor = (req: NextRequest) =>
  familyFromUnsubscribeToken(req.nextUrl.searchParams.get('t') ?? '', process.env.SUPABASE_SERVICE_ROLE_KEY ?? '')

export async function GET(req: NextRequest) {
  if (!familyFor(req)) return invalid()
  // The token has been verified, so it is safe to put back into the page.
  const token = encodeURIComponent(req.nextUrl.searchParams.get('t') ?? '')
  return page('Unsubscribe from these emails?', 'You’ll stop getting messages from this programme.', 200,
    `<form method="post" action="/api/impact/unsubscribe?t=${token}" style="margin-top:16px;"><button type="submit" style="background:#111;color:#fff;border:0;border-radius:9px;padding:11px 18px;font-size:14px;font-weight:700;cursor:pointer;">Unsubscribe</button></form>`)
}

export async function POST(req: NextRequest) {
  const familyId = familyFor(req)
  if (!familyId) return invalid()
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
  const { error } = await admin.from('tp_families').update({ unsubscribed_at: new Date().toISOString() }).eq('id', familyId).is('unsubscribed_at', null)
  if (error) {
    console.error('[impact/unsubscribe] failed', error.message)
    return page('That didn’t work', 'We couldn’t unsubscribe you just now. Please try the link again.', 500)
  }
  console.log('[impact/unsubscribe]', JSON.stringify({ family: familyId }))
  return page('You’re unsubscribed', 'You won’t get any more messages from this programme.', 200)
}
