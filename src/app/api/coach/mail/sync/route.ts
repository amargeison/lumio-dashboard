import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { fetchInboundGmail } from '@/lib/coach/mail'

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

  // Existing external ids (dedupe) + players (to thread inbound under the right conversation).
  const [{ data: existing }, { data: players }] = await Promise.all([
    admin.from('coach_messages').select('external_id').eq('coach_id', user.id).not('external_id', 'is', null),
    admin.from('coach_players').select('name, email, contact_email, parent_email').eq('coach_id', user.id),
  ])
  const seen = new Set((existing ?? []).map((r: any) => r.external_id))
  const matchName = (email: string): string | null => {
    const e = email.toLowerCase()
    const p = (players ?? []).find((p: any) => [p.email, p.contact_email, p.parent_email].filter(Boolean).some((x: string) => x.toLowerCase() === e))
    return p?.name || null
  }

  const rows = inbound.filter(m => m.externalId && !seen.has(m.externalId)).map(m => {
    const conv = matchName(m.fromEmail) || m.fromName || m.fromEmail
    return {
      coach_id: user.id, direction: 'in', from_name: m.fromName || m.fromEmail,
      recipients: conv, thread_key: conv, subject: m.subject || null, body: m.body,
      channels: 'email', status: 'received', external_id: m.externalId, read: false,
      created_at: m.date,
    }
  })
  if (!rows.length) return NextResponse.json({ added: 0 })

  const { error } = await admin.from('coach_messages').insert(rows)
  if (error) return NextResponse.json({ added: 0, error: error.message }, { status: 200 })
  return NextResponse.json({ added: rows.length })
}
