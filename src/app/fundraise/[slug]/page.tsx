import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import FundraiseView, { type CampaignData } from './FundraiseView'

// ─── TEN PROJECT — PUBLIC SCHOOL FUNDRAISING PAGE ───────────────────────────
// URL: /fundraise/[slug]  (Phase 1.5 fast-track, Scoping v2.0 §5.9 + §11)
// Server component: reads tp_fundraising_campaigns by public_slug with the
// service role (RLS keeps tables HQ-only; this route exposes only what the
// public page needs). Falls back to the demo campaign for slug 'demo' /
// 'st-clements-demo' — and whenever the tables don't exist yet (migrations
// 148–151 not applied), so the page is shippable today.
// Online donations (Stripe) are stubbed pending the receiving-entity
// decision with Harry — the UI shows a "launching soon" state.

export const dynamic = 'force-dynamic'

const DEMO_SLUGS = new Set(['demo', 'st-clements-demo'])

const DEMO_CAMPAIGN: CampaignData = {
  school: 'St Clement’s Primary',
  slug: 'st-clements-demo',
  targetPence: 320000,
  raisedPence: 215000,
  supporters: 84,
  status: 'live',
  matchNote: 'Apex Tennis Trust will top up the final 20% (£640) once the campaign passes £2,560.',
  events: [
    { name: 'Summer Fair stall', date: '21 Jun', status: 'complete', raisedPence: 48000 },
    { name: 'Y4 Cake Sale', date: '4 Jul', status: 'complete', raisedPence: 21500 },
    { name: 'Sponsored Ball Hit', date: '10 Oct', status: 'live', raisedPence: 145500 },
    { name: 'Autumn Quiz Night', date: '14 Nov', status: 'planned', raisedPence: 0 },
  ],
  isDemo: true,
}

async function loadCampaign(slug: string): Promise<CampaignData | null> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const { data: camp, error } = await supabase
      .from('tp_fundraising_campaigns')
      .select('id, public_slug, target_pence, status, match_note, tp_schools(name)')
      .eq('public_slug', slug)
      .in('status', ['live', 'complete', 'unlocked'])
      .maybeSingle()
    if (error || !camp) return null

    const [{ data: events }, { data: donations }] = await Promise.all([
      supabase.from('tp_fundraising_events')
        .select('name, event_date, status, target_pence')
        .eq('campaign_id', camp.id)
        .neq('status', 'cancelled')
        .order('event_date', { ascending: true }),
      supabase.from('tp_donations')
        .select('amount_pence')
        .eq('campaign_id', camp.id),
    ])

    const raisedPence = (donations ?? []).reduce((n, d) => n + (d.amount_pence ?? 0), 0)
    const schoolRel = camp.tp_schools as { name?: string } | { name?: string }[] | null
    const schoolName = Array.isArray(schoolRel) ? schoolRel[0]?.name : schoolRel?.name

    return {
      school: schoolName ?? 'A Ten Project school',
      slug,
      targetPence: camp.target_pence,
      raisedPence,
      supporters: (donations ?? []).length,
      status: camp.status,
      matchNote: camp.match_note,
      events: (events ?? []).map(e => ({
        name: e.name,
        date: e.event_date ?? 'TBC',
        status: e.status as 'planned' | 'live' | 'complete',
        raisedPence: 0, // per-event totals arrive with event-scoped donations in the full module
      })),
      isDemo: false,
    }
  } catch {
    return null // tables not applied yet, or env missing — demo fallback below
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const campaign = (await loadCampaign(slug)) ?? (DEMO_SLUGS.has(slug) ? DEMO_CAMPAIGN : null)
  const school = campaign?.school ?? 'Ten Project'
  return {
    title: `Support ${school} — Ten Project fundraising`,
    description: `Help bring 10 weeks of free tennis to ${school}. Every pound goes to the programme — LEARN. PLAY. TOGETHER.`,
    icons: {
      icon: [
        { url: '/tenproject-favicon-32.png', sizes: '32x32', type: 'image/png' },
        { url: '/tenproject-favicon-64.png', sizes: '64x64', type: 'image/png' },
      ],
      apple: '/tenproject_logo.png',
    },
  }
}

export default async function FundraisePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const campaign = (await loadCampaign(slug)) ?? (DEMO_SLUGS.has(slug) ? DEMO_CAMPAIGN : null)

  if (!campaign) {
    return (
      <div style={{ minHeight: '100vh', background: '#F7F5F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', padding: 20 }}>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#1B1B21' }}>Campaign not found</div>
          <div style={{ fontSize: 14, color: '#6B6560', marginTop: 8 }}>
            This fundraising page isn’t live yet — check the link with the school, or visit tenproject.org.uk.
          </div>
        </div>
      </div>
    )
  }

  return <FundraiseView campaign={campaign} />
}
