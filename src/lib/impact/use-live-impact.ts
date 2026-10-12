'use client'

// Live Impact portal loader for /impact/<slug> — mirrors the Tennis Coach
// address model: the slug picks the org, the signed-in login decides access.
//   1. impact_orgs[slug] → that org's saved settings (brand, modules) and its
//      HQ login (hq_id). Read publicly, so the portal looks right for anyone.
//   2. Signed-in user with a sports_profiles row of sport 'impact':
//        hq_id === user  → they're this org's HQ: load their tp_* rows
//                          (RLS hq_id = auth.uid()) and allow editing settings
//        someone else's  → refused, pointed at their own portal (Coach idiom)
//   3. Anyone else (incl. every anonymous visitor) → read-only empty view.
// If impact_orgs isn't there yet (draft 211 not applied) the brand falls back
// per slug (FOUNDER_FALLBACK) and HQ matching uses sports_profiles.portal_slug.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { ImpactDataset, ImpactPortalContext } from '@/app/tenproject/[slug]/_components/ImpactDataContext'
import { EMPTY_IMPACT_COPY, EMPTY_IMPACT_DATA, mapLiveRows, buildPeople, type LiveRows } from './live-context'
import type { ImpactPeople } from '@/app/tenproject/[slug]/_components/ImpactDataContext'
import { brandFor, type ImpactOrgSettings } from './org'

export interface LiveImpactState {
  ready: boolean
  ctx: ImpactPortalContext
  /** Signed-in HQ of THIS org. */
  hq: { userId: string; email: string; name: string } | null
  /** Signed-in Impact HQ of a DIFFERENT org — refused at this address. */
  denied: { ownSlug: string | null } | null
}

const sb = () => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export function useLiveImpact(slug: string, enabled: boolean): LiveImpactState {
  const [ready, setReady] = useState(!enabled)
  const [settings, setSettings] = useState<ImpactOrgSettings | null>(null)
  const [rowExists, setRowExists] = useState(false)
  const [data, setData] = useState<ImpactDataset>(EMPTY_IMPACT_DATA)
  const [people, setPeople] = useState<ImpactPeople | undefined>(undefined)
  const [hq, setHq] = useState<LiveImpactState['hq']>(null)
  const [denied, setDenied] = useState<LiveImpactState['denied']>(null)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    const supabase = sb()
    ;(async () => {
      try {
        // 1. The org behind this address (public branding + its HQ).
        let orgHq: string | null = null
        let orgKnown = false
        const org = await supabase.from('impact_orgs').select('settings, hq_id').eq('slug', slug).maybeSingle()
        if (!org.error) {
          orgKnown = true
          if (org.data) {
            if (!cancelled) { setSettings((org.data.settings as ImpactOrgSettings) ?? {}); setRowExists(true) }
            orgHq = (org.data.hq_id as string | null) ?? null
          }
        }

        // 2. Who's signed in.
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: profile } = await supabase
          .from('sports_profiles')
          .select('sport, display_name, portal_slug')
          .eq('id', user.id)
          .maybeSingle()
        if (!profile || profile.sport !== 'impact') return

        const isHq = orgKnown ? orgHq === user.id : (!profile.portal_slug || profile.portal_slug === slug)
        if (!isHq) {
          let ownSlug: string | null = profile.portal_slug ?? null
          if (orgKnown) {
            const own = await supabase.from('impact_orgs').select('slug').eq('hq_id', user.id).maybeSingle()
            ownSlug = (own.data?.slug as string | undefined) ?? ownSlug
          }
          if (!cancelled) setDenied({ ownSlug: ownSlug && ownSlug !== slug ? ownSlug : null })
          return
        }

        const [schools, programmes, campaigns, events, donations, checkins] = await Promise.all([
          supabase.from('tp_schools').select('id, name, borough, address, head_name, pe_lead_name, safeguarding_lead, contact_email, contact_phone, funding_source, status, notes').order('name'),
          supabase.from('tp_programmes').select('id, school_id, term_label, year_groups, current_week, status, cost_pence'),
          supabase.from('tp_fundraising_campaigns').select('id, school_id, target_pence, status, match_partner, match_note, public_slug'),
          supabase.from('tp_fundraising_events').select('id, campaign_id, name, event_type, event_date, status, target_pence').order('event_date'),
          supabase.from('tp_donations').select('campaign_id, event_id, amount_pence'),
          supabase.from('tp_qr_checkins').select('children_count'),
        ])
        // Impact-owned people & places (drafts 213/214). A table that isn't
        // there yet just reads as empty — the portal keeps its empty states.
        const rowsOf = async <T,>(q: PromiseLike<{ data: T[] | null; error: unknown }>) => { const r = await q; return r.error ? [] : (r.data ?? []) }
        const [venues, staff, volunteers, families, children, sessions, attendance, programmeLinks] = await Promise.all([
          rowsOf(supabase.from('tp_venues').select('id, name, address, postcode, courts, surface, access_notes, storage_notes, session_day, session_time, inclusive, external_partner, external_url, notes').order('name')),
          rowsOf(supabase.from('tp_staff').select('id, name, role, qualification, email, phone, availability, specialisms, dbs_status, dbs_number, dbs_expiry, safeguarding_date, first_aid_expiry, insurance, notes').order('name')),
          rowsOf(supabase.from('tp_volunteers').select('id, name, email, phone, venue_id, inducted, induction_date, dbs_status, since, notes').order('name')),
          rowsOf(supabase.from('tp_families').select('id, guardian_name, email, phone, emergency_contact, consent_data, consent_photo, unsubscribed_at').order('guardian_name')),
          rowsOf(supabase.from('tp_children').select('id, family_id, name, date_of_birth, year_group, school_id, programme_id, medical_notes, photo_consent, fee_status, stickers').order('name')),
          rowsOf(supabase.from('tp_sessions').select('id, kind, programme_id, venue_id, session_date, lead_staff_id').order('session_date')),
          rowsOf(supabase.from('tp_attendance').select('session_id, child_id, present, via')),
          rowsOf(supabase.from('tp_programmes').select('id, lead_staff_id, venue_id')),
        ])
        const rows: LiveRows = {
          schools: schools.data ?? [],
          programmes: programmes.data ?? [],
          campaigns: campaigns.data ?? [],
          events: events.data ?? [],
          donations: donations.data ?? [],
          checkins: checkins.data ?? [],
          venues, staff, volunteers, families, children, sessions, attendance, programmeLinks,
        } as LiveRows
        if (cancelled) return
        setData(mapLiveRows(rows))
        setPeople(buildPeople(rows))
        setHq({ userId: user.id, email: user.email ?? '', name: profile.display_name ?? '' })
      } catch {
        // Tables not migrated / network down → stay on the empty read-only view.
      } finally {
        if (!cancelled) setReady(true)
      }
    })()
    return () => { cancelled = true }
  }, [slug, enabled])

  const save = useCallback(async (next: ImpactOrgSettings) => {
    const { error } = await sb().from('impact_orgs').update({ settings: next }).eq('slug', slug).select('slug').single()
    if (error) return { ok: false, error: 'Couldn’t save — please try again.' }
    setSettings(next)
    return { ok: true }
  }, [slug])

  const ctx = useMemo<ImpactPortalContext>(() => {
    const canEdit = !!hq && rowExists
    return {
      mode: 'live',
      brand: brandFor(slug, rowExists ? settings : null),
      copy: EMPTY_IMPACT_COPY,
      data,
      people,
      org: {
        slug,
        settings: settings ?? {},
        canEdit,
        readOnlyReason: canEdit ? undefined
          : hq ? 'This portal’s settings record hasn’t been set up yet — Lumio will enable it.'
          : 'Sign in as this organisation’s HQ to change settings.',
        save,
      },
    }
  }, [slug, settings, rowExists, data, people, hq, save])

  return { ready, ctx, hq, denied }
}
