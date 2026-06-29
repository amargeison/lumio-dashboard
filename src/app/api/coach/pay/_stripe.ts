import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

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
