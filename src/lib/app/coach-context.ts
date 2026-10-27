// The door every native-app coach route comes through (server only): who is
// signed in, which academy (the app sends its address in x-lumio-academy, the
// same header the web portal sends), and a database client that reads as THEM,
// so row level security applies exactly as it does on the website.

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { coachGate, type CoachSeat } from '@/lib/coach/membership'

export type CoachCtx = { userId: string; seat: CoachSeat; db: SupabaseClient; service: SupabaseClient }

export async function coachContext(): Promise<{ ok: true; ctx: CoachCtx } | { ok: false; res: NextResponse }> {
  const gate = await coachGate()
  if (!gate.ok) return { ok: false, res: NextResponse.json({ error: gate.error }, { status: gate.status }) }
  const jar = await cookies()
  const db = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => jar.getAll(), setAll: () => {} },
  }) as unknown as SupabaseClient
  const service = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
  return { ok: true, ctx: { userId: gate.userId, seat: gate.seat, db, service } }
}

export const noStore = { headers: { 'Cache-Control': 'no-store' } }
