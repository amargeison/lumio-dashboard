import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { fetchInboundGmail } from '@/lib/coach/mail'
import { coachSeat } from '@/lib/coach/membership'

export const runtime = 'nodejs'

// Poll the coach's connected Gmail for recent replies and store new ones as
// inbound rows in coach_messages (direction='in'), threaded to the matching
// conversation. Called on the Messages/dashboard page (~every 2 min) and can
// also be hit by a scheduled job. Deduped on external_id; never throws.
export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const inbound = await fetchInboundGmail(user.id)
  if (!inbound.length) return NextResponse.json({ added: 0 })

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })

  // The inbox belongs to the academy, so that is where the rows are filed — also
  // when it is an assistant coach's own mailbox being read. The head coach IS
  // the academy; an assistant is an active, linked coach in somebody else's.
  // A coach at more than one academy: the one whose portal asked (see coachSeat).
  const seat = await coachSeat(user.id, user.email)
  const academyId: string | null = seat?.academyId ?? null
  const staffId: string | null = seat?.staffId ?? null
  if (!academyId) return NextResponse.json({ added: 0 })

  // Existing external ids (dedupe) + players (to thread inbound under the right conversation).
  let roster = admin.from('coach_players').select('id, name, email, contact_email, parent_email').eq('coach_id', academyId)
  if (staffId) roster = roster.eq('staff_id', staffId)
  const [{ data: existing }, { data: players }] = await Promise.all([
    admin.from('coach_messages').select('external_id').eq('coach_id', academyId).not('external_id', 'is', null),
    roster,
  ])
  const seen = new Set((existing ?? []).map((r: any) => r.external_id))
  // The player this address belongs to — only when it belongs to exactly one.
  // A parent with two children at the academy has one address on two players,
  // and there is no telling from an email which child it is about.
  const matchPlayer = (email: string): { id: string; name: string } | null => {
    const e = email.toLowerCase()
    const hits = (players ?? []).filter((p: any) => [p.email, p.contact_email, p.parent_email].filter(Boolean).some((x: string) => x.toLowerCase() === e))
    return hits.length === 1 ? { id: hits[0].id, name: hits[0].name } : null
  }

  const rows = inbound.filter(m => m.externalId && !seen.has(m.externalId)).map(m => {
    const p = matchPlayer(m.fromEmail)
    const conv = p?.name || m.fromName || m.fromEmail
    return {
      coach_id: academyId, player_id: p?.id ?? null, direction: 'in', from_name: m.fromName || m.fromEmail,
      // A player's thread is named after them. Anybody else gets a key that can
      // never equal a player's name, so it cannot surface in a family's app.
      recipients: conv, thread_key: p ? conv : `contact:${m.fromEmail.toLowerCase()}`, subject: m.subject || null, body: m.body,
      channels: 'email', status: 'received', external_id: m.externalId, read: false,
      created_at: m.date,
    }
  })
  if (!rows.length) return NextResponse.json({ added: 0 })

  const { error } = await admin.from('coach_messages').insert(rows)
  if (error) return NextResponse.json({ added: 0, error: error.message }, { status: 200 })
  return NextResponse.json({ added: rows.length })
}
