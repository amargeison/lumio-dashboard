import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

// Head coach invites a sub-coach or a parent/student to the portal. Creates a
// scoped coach_members row (academy_id = the head's own id) and emails the
// invitee how to sign in. They get NO data access until they sign in and the
// membership binds — and then only their scoped slice via the portal routes.
export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const { email, role, scopePlayerId = null, scopeCoachName = null, staffId = null, name = '' } =
    (await req.json().catch(() => ({}))) as { email?: string; role?: string; scopePlayerId?: string | null; scopeCoachName?: string | null; staffId?: string | null; name?: string }

  if (!email || !/.+@.+\..+/.test(email)) return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })
  if (!['coach', 'parent', 'student'].includes(role || '')) return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  if ((role === 'parent' || role === 'student') && !scopePlayerId) return NextResponse.json({ error: 'A player must be chosen for a parent/student invite' }, { status: 400 })

  const emailLc = email.trim().toLowerCase()
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })

  // Upsert the membership (one per academy+email).
  //
  // staff_id is the real link and scope_coach_name is the legacy name string.
  // Both are sent: a database trigger keeps whichever one is missing in step, so
  // this works whether or not the caller knows the staff id yet. scope_coach_name
  // is dropped once every caller sends staffId.
  const { error } = await admin.from('coach_members').upsert({
    academy_id: user.id, email: emailLc, role,
    scope_player_id: scopePlayerId,
    scope_coach_name: scopeCoachName,
    // '__head__' is the client-side fiction for the head coach, not a real row.
    staff_id: staffId && staffId !== '__head__' ? staffId : null,
    status: 'invited', updated_at: new Date().toISOString(),
  }, { onConflict: 'academy_id,email' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Email the invite (Resend). The portal sign-in (email code) lands in Phase 2;
  // for now the invite explains they'll get a code to sign in.
  try {
    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      // Everybody signs in at the same place. /portal is where a member ENDS UP,
      // not where they sign in — sending them straight there used Supabase's own
      // magic-link email, which is why the invite arrived as a link when the page
      // was asking for a code.
      const portal = `https://www.lumiosports.com/sports-login`
      const who = role === 'coach' ? 'as a coach' : 'to follow your player’s progress'
      await resend.emails.send({
        from: 'Lumio Sports <hello@lumiocms.com>',
        to: email,
        subject: 'You’ve been given access to your Lumio portal',
        html: `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#111">Hi${name ? ' ' + name : ''},<br><br>You’ve been invited ${who} on Lumio. Open <a href="${portal}">${portal}</a> and sign in with this email address (${email}) — you’ll get a one-time code to enter.<br><br>See you on court,<br>Lumio</div>`,
      })
    }
  } catch (e) { console.warn('[portal/invite] email', e) }

  return NextResponse.json({ ok: true })
}
