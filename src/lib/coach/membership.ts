// Server-only access-control core for student/coach portals. Every scoped portal
// route resolves the caller's membership HERE and filters strictly to its scope.
// This is the single audit point — if a row isn't allowed by the membership, it
// must never be returned.

import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export type Membership = {
  id: string
  academyId: string            // the head coach whose data this member may see (a slice of)
  role: 'coach' | 'parent' | 'student'
  scopePlayerId: string | null // parent/student: the ONE player
  scopeCoachName: string | null// coach: assigned_coach filter
  email: string
  status: string
}

function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
}

// The signed-in auth user (their own session cookie).
export async function sessionUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Resolve the caller's membership. Binds member_user_id on first sign-in (matching
// the invited email), so an invite becomes active when the right person logs in.
// Returns null if the caller is not a member (→ routes must 403).
export async function getMembership(): Promise<Membership | null> {
  const user = await sessionUser()
  if (!user) return null
  const db = admin()

  // Already bound to this auth user? A user can legitimately belong to more than
  // one academy (a parent with children at two clubs), so `.maybeSingle()` would
  // ERROR on >1 row and lock them out. Take the most recent membership
  // deterministically instead. (Multi-academy switching is a future enhancement.)
  const { data: boundRows } = await db.from('coach_members').select('*')
    .eq('member_user_id', user.id).neq('status', 'revoked')
    .order('created_at', { ascending: false }).limit(1)
  let row: any = boundRows?.[0] ?? null

  // Otherwise bind by the invited email (first sign-in) — only if not revoked.
  if (!row && user.email) {
    const { data: pendingRows } = await db.from('coach_members').select('*')
      .ilike('email', user.email).neq('status', 'revoked')
      .order('created_at', { ascending: false }).limit(1)
    const pending = pendingRows?.[0]
    if (pending) {
      await db.from('coach_members').update({ member_user_id: user.id, status: 'active', updated_at: new Date().toISOString() }).eq('id', pending.id)
      row = { ...pending, member_user_id: user.id, status: 'active' }
    }
  }
  if (!row) return null
  return {
    id: row.id, academyId: row.academy_id, role: row.role,
    scopePlayerId: row.scope_player_id, scopeCoachName: row.scope_coach_name,
    email: row.email, status: row.status,
  }
}

// Service-role DB handle for scoped reads — callers MUST apply the membership
// scope to every query (academy_id = m.academyId, plus player/coach scope).
export function scopedDb() { return admin() }

// Sign a value from the PRIVATE `avatars` bucket for external viewers (parents /
// sub-coaches), who can't use the coach-side signing proxy. Accepts a bare storage
// path or a legacy full public URL; passes data/already-signed/external URLs through.
export async function signAvatar(db: ReturnType<typeof admin>, value?: string | null): Promise<string | null> {
  if (!value) return null
  if (value.startsWith('data:') || value.includes('/object/sign/')) return value
  const path = value.match(/\/avatars\/(.+?)(?:\?|$)/)?.[1] || (value.startsWith('http') ? null : value)
  if (!path) return value
  try { const { data } = await db.storage.from('avatars').createSignedUrl(path, 3600); return data?.signedUrl ?? null } catch { return null }
}
