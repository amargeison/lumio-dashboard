import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { coachSeat } from '@/lib/coach/membership'

// Platform Stripe client (Lumio's account). Connected-account calls pass { stripeAccount }.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, ({ apiVersion: '2024-06-20' }) as any)

// The signed-in coach (their Supabase session cookie); user.id === coach_id.
export async function getCoach() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Service-role client for privileged writes (coach_id always taken from the verified session).
export function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
}

/**
 * Whose bank a payment goes into. The head coach is the academy; an assistant
 * coach takes payments into the ACADEMY's connected account — only for their own
 * players (see assertOwnPlayer). staffId is null for the head coach.
 *
 * WHICH academy, for a coach at more than one: the one whose portal the request
 * came from (see coachSeat). Money must never go to the academy the coach was
 * not looking at.
 */
export async function getAcademy(userId: string): Promise<{ academyId: string; staffId: string | null } | null> {
  const seat = await coachSeat(userId)
  return seat ? { academyId: seat.academyId, staffId: seat.staffId } : null
}

/** An assistant coach may only charge for a player assigned to them. */
export async function assertOwnPlayer(academyId: string, staffId: string, playerName: string | null): Promise<boolean> {
  if (!playerName) return false
  const { data } = await admin().from('coach_players').select('id, name')
    .eq('coach_id', academyId).eq('staff_id', staffId)
  return (data || []).some((p: { name?: string | null }) => (p.name || '').trim().toLowerCase() === playerName.trim().toLowerCase())
}
