import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import CampSignupView, { type CampPublic } from './CampSignupView'

// ─── PUBLIC CAMP SIGN-UP PAGE ───────────────────────────────────────────────
// URL: /camp/[slug] — a link a coach shares with parents.
//
// Server component reading with the service role, because coach_camps is
// owner-only under RLS. The critical discipline is in `toPublic()` below: this
// page hand-picks the handful of fields a parent needs and nothing else. The
// camp row also carries the coach's internal run-sheet, per-player targets and
// coaching notes, and none of that may ever reach a public page.

export const dynamic = 'force-dynamic'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
}

// The allow-list. Anything not named here does not leave the server.
function toPublic(camp: any, profile: any, taken: number): CampPublic {
  const b = camp.parent_brief || {}
  return {
    slug: camp.signup_slug,
    name: camp.name,
    academy: profile?.brand_name || 'Tennis camp',
    logoUrl: profile?.brand_logo_url || null,
    startDate: camp.start_date || null,
    endDate: camp.end_date || null,
    location: [camp.location, camp.region].filter(Boolean).join(', ') || null,
    surface: camp.surface || null,
    ages: camp.ages || null,
    price: camp.price ?? null,
    paymentMode: camp.payment_mode || 'none',
    depositAmount: camp.deposit_amount ?? null,
    note: camp.signup_note || camp.description || null,
    spacesLeft: camp.capacity ? Math.max(0, camp.capacity - taken) : null,
    // Boris's parent brief is the sales copy — written for a parent, no jargon.
    intro: b.intro || null,
    whatTheyWorkOn: b.whatTheyWorkOn || [],
    whatToBring: b.whatToBring || [],
    dailyShape: b.dailyShape || null,
    whatTheyLeaveWith: b.whatTheyLeaveWith || [],
    // Day themes only — never the coach-facing session detail or cues.
    days: (camp.itinerary || []).map((d: any) => ({ day: d.day, theme: d.theme || d.focus || '' })),
  }
}

async function load(slug: string) {
  try {
    const sb = db()
    const { data: camp } = await sb.from('coach_camps').select('*').ilike('signup_slug', slug).maybeSingle()
    if (!camp || !camp.signup_open) return null
    const [{ data: profile }, { count }] = await Promise.all([
      sb.from('sports_profiles').select('brand_name, brand_logo_url').eq('id', camp.coach_id).maybeSingle(),
      sb.from('coach_camp_attendees').select('id', { count: 'exact', head: true }).eq('camp_id', camp.id).neq('status', 'cancelled'),
    ])
    return toPublic(camp, profile, count ?? 0)
  } catch { return null }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const c = await load(slug)
  if (!c) return { title: 'Camp sign-up' }
  return {
    title: `${c.name} — ${c.academy}`,
    description: c.intro || `Sign up for ${c.name}.`,
    openGraph: { title: `${c.name} — ${c.academy}`, description: c.intro || undefined },
  }
}

export default async function CampSignupPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const camp = await load(slug)

  if (!camp) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#eef0f5', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif", padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 14, padding: '32px 28px', maxWidth: 420, textAlign: 'center', boxShadow: '0 2px 12px rgba(20,25,40,.08)' }}>
          <div style={{ fontSize: 19, fontWeight: 700, color: '#1a1d29' }}>Sign-ups aren&apos;t open</div>
          <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, marginTop: 8 }}>
            This camp isn&apos;t taking sign-ups at the moment. If you were sent this link, check with your coach — it may have filled up or closed.
          </p>
        </div>
      </div>
    )
  }
  return <CampSignupView camp={camp} />
}
