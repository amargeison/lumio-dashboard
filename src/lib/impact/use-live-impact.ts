'use client'

// Live Impact portal loader — mirrors the Tennis portal's auth check
// (src/app/tennis/[slug]/page.tsx): a signed-in user whose sports_profiles row
// is sport 'impact' is the portal's HQ, and their tp_* rows (RLS-scoped to
// hq_id = auth.uid()) feed the views. Anyone else — including every anonymous
// visitor on day one — gets the empty founder view.
//
// NOTE: sports_profiles_sport_check does not allow 'impact' yet, so no profile
// can match until the drafted migration (supabase/drafts/) is reviewed and
// applied. Until then this resolves to the empty context for everyone.

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { ImpactPortalContext } from '@/app/tenproject/[slug]/_components/ImpactDataContext'
import { IMPACT_LIVE_EMPTY_CONTEXT, mapLiveRows, type LiveRows } from './live-context'

export interface LiveImpactState {
  ready: boolean
  ctx: ImpactPortalContext
  /** Signed-in Impact HQ, when there is one. */
  hq: { userId: string; email: string; name: string; orgName: string } | null
}

export function useLiveImpact(enabled: boolean): LiveImpactState {
  const [state, setState] = useState<LiveImpactState>({ ready: !enabled, ctx: IMPACT_LIVE_EMPTY_CONTEXT, hq: null })

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: profile } = await supabase
          .from('sports_profiles')
          .select('sport, display_name, brand_name')
          .eq('id', user.id)
          .maybeSingle()
        if (!profile || profile.sport !== 'impact') return

        const [schools, programmes, campaigns, events, donations, checkins] = await Promise.all([
          supabase.from('tp_schools').select('id, name, borough, address, head_name, pe_lead_name, safeguarding_lead, contact_email, contact_phone, funding_source, status, notes').order('name'),
          supabase.from('tp_programmes').select('id, school_id, term_label, year_groups, current_week, status, cost_pence'),
          supabase.from('tp_fundraising_campaigns').select('id, school_id, target_pence, status, match_partner, match_note, public_slug'),
          supabase.from('tp_fundraising_events').select('id, campaign_id, name, event_type, event_date, status, target_pence').order('event_date'),
          supabase.from('tp_donations').select('campaign_id, event_id, amount_pence'),
          supabase.from('tp_qr_checkins').select('children_count'),
        ])
        const rows: LiveRows = {
          schools: schools.data ?? [],
          programmes: programmes.data ?? [],
          campaigns: campaigns.data ?? [],
          events: events.data ?? [],
          donations: donations.data ?? [],
          checkins: checkins.data ?? [],
        }
        if (cancelled) return
        setState(s => ({
          ...s,
          ctx: { ...IMPACT_LIVE_EMPTY_CONTEXT, data: mapLiveRows(rows) },
          hq: { userId: user.id, email: user.email ?? '', name: profile.display_name ?? '', orgName: profile.brand_name ?? '' },
        }))
      } catch {
        // Tables not migrated / network down → stay on the empty founder view.
      } finally {
        if (!cancelled) setState(s => ({ ...s, ready: true }))
      }
    })()
    return () => { cancelled = true }
  }, [enabled])

  return state
}
