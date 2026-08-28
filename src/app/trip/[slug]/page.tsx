import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import TripView, { type TripPublic } from './TripView'
import { campAudience } from '@/lib/coach/camp-audience'
import { flagFor } from '@/lib/coach/country-flag'
import type { Trip } from '@/lib/coach/trip'

// ─── THE TRIP HUB ────────────────────────────────────────────────────────────
// URL: /trip/[slug] — the one link a coach shares with everybody on the camp.
//
// Server component reading with the service role, because coach_camps is
// owner-only under RLS. The discipline is the same as the sign-up page and it is
// the important part of this file: toPublic() hand-picks what a player may see.
//
// The camp row also carries the coach's run-sheet, per-player targets, coaching
// notes, pricing and the attendee list. NONE of that may ever reach this page.
// The itinerary is included but stripped down to the shape of each day — the
// coaching detail and the cues stay with the coach.

export const dynamic = 'force-dynamic'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
}

function toPublic(camp: any, profile: any): TripPublic {
  const trip = (camp.trip || {}) as Trip
  return {
    campName: camp.name,
    academy: profile?.brand_name || 'Your academy',
    logoUrl: profile?.brand_logo_url || null,
    coachName: profile?.display_name || null,
    startDate: camp.start_date || null,
    endDate: camp.end_date || null,
    location: [camp.location, camp.region].filter(Boolean).join(', ') || null,
    flag: flagFor(camp.region, camp.location),
    overseas: !!camp.overseas,
    adult: campAudience(camp) === 'adult',
    trip,
    // Day themes only. What each day is about is genuinely useful to somebody
    // packing; the coaching focus, the cues and the run-sheet are not theirs.
    days: Array.isArray(camp.itinerary)
      ? camp.itinerary.map((d: any) => ({
          day: Number(d?.day) || 0,
          theme: String(d?.theme || d?.focus || '').trim(),
          rest: !!d?.rest,
          sessions: Array.isArray(d?.sessions)
            ? d.sessions.map((s: any) => ({
                slot: String(s?.slot || '').toUpperCase(),
                time: String(s?.time || '').trim(),
                title: String(s?.title || '').trim(),
              })).filter((s: any) => s.title || s.time)
            : [],
        })).filter((d: any) => d.day)
      : [],
  }
}

async function load(slug: string): Promise<TripPublic | null> {
  try {
    const sb = db()
    const { data: camp } = await sb.from('coach_camps')
      .select('*').ilike('trip_slug', slug).maybeSingle()

    // Same answer whether the trip is missing or closed — a closed trip should
    // not be distinguishable from one that never existed.
    if (!camp || !camp.trip_open) return null

    const { data: profile } = await sb.from('sports_profiles')
      .select('brand_name, brand_logo_url, display_name').eq('id', camp.coach_id).maybeSingle()

    return toPublic(camp, profile)
  } catch { return null }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const t = await load(slug)
  if (!t) return { title: 'Trip' }
  return {
    title: `${t.campName} — everything you need`,
    description: t.location ? `Your trip to ${t.location}.` : 'Your trip details.',
    // Hotel addresses and a coach's mobile number. Not for search engines.
    robots: { index: false, follow: false },
  }
}

export default async function TripPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const trip = await load(slug)
  if (!trip) notFound()
  return <TripView trip={trip} />
}
