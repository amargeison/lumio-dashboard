import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { lessonView, confirmLesson, cancelLesson } from '@/lib/student/lesson-actions'

export const runtime = 'nodejs'

// The link in the day-before reminder: /lesson/<token>. No sign-in — the token
// opens exactly one lesson, and can only confirm or cancel that one.
//
//   GET                      the lesson, and what cancelling means now
//   POST { action: 'confirm' | 'cancel' }

const TOKEN_RE = /^[A-Za-z0-9_-]{16,64}$/
const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })

async function load(token: string) {
  if (!TOKEN_RE.test(token)) return null
  const sb = db()
  const { data: b } = await sb.from('coach_bookings').select('id, coach_id, player_id').eq('client_token', token).maybeSingle()
  if (!b?.player_id) return null
  const { data: p } = await sb.from('coach_players').select('name, parent_name, parent_email').eq('id', b.player_id).eq('coach_id', b.coach_id).maybeSingle()
  const by = String(p?.parent_email ? p?.parent_name || '' : p?.name || '').trim() || 'them'
  return { sb, academyId: b.coach_id as string, playerId: b.player_id as string, bookingId: b.id as string, by: `${by} (from the reminder email)` }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const g = await load(token)
  const v = g ? await lessonView(g.sb, g.academyId, g.playerId, g.bookingId) : null
  return v ? NextResponse.json(v) : NextResponse.json({ error: 'This link is not valid. Reply to your coach’s email instead.' }, { status: 404 })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const limit = rateLimit(`lesson-link:${clientIp(req.headers)}`, 20, 10 * 60_000)
  if (!limit.ok) return NextResponse.json({ error: 'Too many tries. Please wait a few minutes.' }, { status: 429 })
  const g = await load(token)
  if (!g) return NextResponse.json({ error: 'This link is not valid.' }, { status: 404 })
  const { action } = (await req.json().catch(() => ({}))) as { action?: string }
  const r = action === 'confirm' ? await confirmLesson(g.sb, g.academyId, g.playerId, g.bookingId, g.by)
    : action === 'cancel' ? await cancelLesson(g.sb, g.academyId, g.playerId, g.bookingId, g.by)
    : { ok: false, error: 'Unknown action.' }
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 })
  const v = await lessonView(g.sb, g.academyId, g.playerId, g.bookingId)
  return NextResponse.json({ ...v, notice: action === 'confirm' ? 'Thanks, your coach can see you will be there.' : ('words' in r ? r.words : 'Cancelled.') })
}
