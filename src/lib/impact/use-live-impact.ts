'use client'

// Live Impact portal loader for /impact/<slug> — mirrors the Tennis Coach
// address model: the slug picks the org, the signed-in login decides access.
//   1. impact_orgs[slug] → that org's saved settings (brand, modules) and its
//      HQ login (hq_id). Read publicly, so the portal looks right for anyone.
//   2. Signed-in user:
//        hq_id === user     → this org's HQ: load its rows, allow editing settings
//        member of this org → their role's view (impact_members), never the HQ's
//        any other Impact login, or a revoked member → refused
//   3. Anyone else (incl. every anonymous visitor) → read-only empty view.
// Every read is limited to this org's hq_id: RLS alone would merge the rows of a
// login that belongs to two orgs.
// If impact_orgs isn't there yet (draft 211 not applied) the brand falls back
// per slug (FOUNDER_FALLBACK) and HQ matching uses sports_profiles.portal_slug.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { CoachContext, ImpactCpd, ImpactDataset, ImpactPortalContext, ParentContext } from '@/app/tenproject/[slug]/_components/ImpactDataContext'
import { EMPTY_IMPACT_COPY, EMPTY_IMPACT_DATA, mapLiveRows, buildCohorts } from './live-context'
import { loadPacks } from './pack-actions'
import { isoToday, staffCertificates } from './compliance'
import { ageFrom, coachPayments, coachRows, loadCoachHome, loadFamilyBooklet, loadParentHome, markAttendance, saveBookletNote, saveFamilyScorecard, saveParentDetails, type ParentDetails } from './member-actions'
import { portalAccess, type MemberRole, type MemberRow } from './members'
import type { PackData } from './packs'
import type { ImpactPeople } from '@/app/tenproject/[slug]/_components/ImpactDataContext'
import { brandFor, type ImpactOrgSettings } from './org'
import type { LiveInsights } from './insights'
import { loadHqData, loadErrorLine } from './hq-load'

export interface LiveImpactState {
  ready: boolean
  ctx: ImpactPortalContext
  /** Signed-in HQ of THIS org. */
  hq: { userId: string; email: string; name: string } | null
  /** Signed in, but with no access at this address. */
  denied: { ownSlug: string | null } | null
  /** Signed-in coach, parent or school of THIS org. */
  member: { role: MemberRole; email: string; error: string | null; otherRole: MemberRole | null } | null
}

const sb = () => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const settingsOf = (row: { settings?: unknown } | null | undefined) => (row?.settings as ImpactOrgSettings | undefined) ?? null

export function useLiveImpact(slug: string, enabled: boolean): LiveImpactState {
  const [ready, setReady] = useState(!enabled)
  const [settings, setSettings] = useState<ImpactOrgSettings | null>(null)
  const [rowExists, setRowExists] = useState(false)
  const [data, setData] = useState<ImpactDataset>(EMPTY_IMPACT_DATA)
  const [people, setPeople] = useState<ImpactPeople | undefined>(undefined)
  const [hq, setHq] = useState<LiveImpactState['hq']>(null)
  const [denied, setDenied] = useState<LiveImpactState['denied']>(null)
  const [member, setMember] = useState<LiveImpactState['member']>(null)
  const [coach, setCoach] = useState<CoachContext | undefined>(undefined)
  const [parent, setParent] = useState<ParentContext | undefined>(undefined)
  const [familySessions, setFamilySessions] = useState<ImpactPortalContext['sessionsByChild']>(undefined)
  const [cpd, setCpd] = useState<ImpactCpd[]>([])
  const [insights, setInsights] = useState<LiveInsights | undefined>(undefined)
  const [cohorts, setCohorts] = useState<ImpactPortalContext['cohorts']>(undefined)
  const [packs, setPacks] = useState<PackData | undefined>(undefined)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloads, setReloads] = useState(0)
  const reload = useCallback(() => setReloads(n => n + 1), [])

  // A run applies its results unless the address has changed since it started.
  // An effect clean-up alone (a remount, a reload) never throws away a load that
  // has already fetched. Suspected cause of the empty Lumio Test HQ (11 Nov):
  // every request 200, yet nothing applied; the [impact-load] trace confirms it.
  const slugNow = useRef(slug)
  useEffect(() => { slugNow.current = slug }, [slug])

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    let userId: string | null = null
    const stale = () => slugNow.current !== slug
    const trace = (stage: string, extra?: Record<string, unknown>) =>
      console.info('[impact-load]', stage, { slug, userId, cancelled, ...extra })
    const supabase = sb()
    ;(async () => {
      let at = 'organisation'
      trace('start', { reloads })
      try {
        // 1. The org behind this address (public branding + its HQ).
        let orgHq: string | null = null
        let orgKnown = false
        const org = await supabase.from('impact_orgs').select('settings, hq_id').eq('slug', slug).maybeSingle()
        if (!org.error) {
          orgKnown = true
          if (org.data) {
            if (!stale()) { setSettings((org.data.settings as ImpactOrgSettings) ?? {}); setRowExists(true) }
            orgHq = (org.data.hq_id as string | null) ?? null
          }
        }
        if (!stale()) setLoadError(null)
        trace('org read', { found: !!org.data, error: org.error?.message ?? null, orgHq })

        // 2. Who's signed in.
        at = 'sign-in'
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { trace('no user'); return }
        userId = user.id
        const { data: profile } = await supabase
          .from('sports_profiles')
          .select('sport, display_name, portal_slug')
          .eq('id', user.id)
          .maybeSingle()
        trace('profile read', { sport: profile?.sport ?? null, portalSlug: profile?.portal_slug ?? null })
        const impactProfile = profile?.sport === 'impact' ? profile : null
        const isHq = !!impactProfile && (orgKnown ? orgHq === user.id : (!impactProfile.portal_slug || impactProfile.portal_slug === slug))
        trace('isHq decided', { isHq })
        if (!isHq) {
          const { data: mine } = await supabase.from('impact_members').select('*').eq('user_id', user.id)
          const wanted = new URLSearchParams(window.location.search).get('view')
          const access = portalAccess((mine ?? []) as MemberRow[], orgHq, !!impactProfile, wanted)
          if (access.kind === 'public') return
          if (access.kind === 'denied') {
            let ownSlug: string | null = impactProfile?.portal_slug ?? null
            if (orgKnown) {
              const own = await supabase.from('impact_orgs').select('slug').eq('hq_id', user.id).maybeSingle()
              ownSlug = (own.data?.slug as string | undefined) ?? ownSlug
            }
            if (!stale()) setDenied({ ownSlug: ownSlug && ownSlug !== slug ? ownSlug : null })
            return
          }
          const m = access.member, hqId = m.hq_id, email = user.email ?? ''
          try {
            if (m.role === 'coach' && m.staff_id) {
              const [home, packData] = await Promise.all([loadCoachHome(supabase, hqId), loadPacks(supabase, hqId)])
              const rows = coachRows(home)
              if (stale()) return
              setData(mapLiveRows(rows))
              setCohorts(buildCohorts(rows))
              setPacks({ ...packData, payments: coachPayments(home) })
              setCoach({
                staffId: m.staff_id, hqId,
                children: Object.fromEntries(home.children.map(c => [c.id, c])),
                families: Object.fromEntries(home.families.map(f => [f.id, f])),
                certificates: home.me ? staffCertificates(home.me, isoToday()) : [],
                practised: Object.fromEntries((home.practised ?? []).map(p => [`${p.child_id}:${p.week}`, true])),
                mark: (sessionId, childId, present) => markAttendance(supabase, hqId, sessionId, childId, present),
              })
            } else if (m.role === 'parent' && m.family_id) {
              const familyId = m.family_id
              const [home, attendance, messages, packData, familyBooklet] = await Promise.all([
                loadParentHome(supabase, familyId),
                supabase.from('tp_attendance').select('session_id, child_id, present').eq('hq_id', hqId),
                supabase.from('impact_messages').select('id, subject, body, created_at').eq('hq_id', hqId).eq('family_id', familyId).eq('direction', 'out').order('created_at', { ascending: false }).limit(50),
                loadPacks(supabase, hqId),
                loadFamilyBooklet(supabase, familyId),
              ])
              if (stale()) return
              if (home) {
                const orgName = brandFor(slug, settingsOf(org.data)).org
                setData({
                  ...EMPTY_IMPACT_DATA,
                  PARENT: {
                    name: home.guardian_name,
                    children: home.children.map(c => ({ id: c.id, name: c.name.split(' ')[0], age: ageFrom(c.date_of_birth), school: c.school ?? '', stickers: c.stickers })),
                    venue: { id: '', name: '', day: '', time: '', tenors: 0 },
                    consents: { data: home.consent_data ?? false, photo: home.consent_photo ?? false, emergency: home.emergency_contact ?? '—' },
                  },
                  PARENT_MESSAGES: (messages.data ?? []).map(x => ({ id: x.id as string, from: orgName, when: new Date(x.created_at as string).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), text: (x.body as string) || (x.subject as string) || '' })),
                } as ImpactDataset)
                setPacks(packData)
                setFamilySessions(Object.fromEntries(home.children.map(c => [c.id, c.sessions])))
                setParent({
                  home, attendance: (attendance.data ?? []) as ParentContext['attendance'],
                  save: async (d: ParentDetails) => { await saveParentDetails(supabase, familyId, d); reload() },
                  ...familyBooklet,
                  saveNote: (childId, week, text) => saveBookletNote(supabase, hqId, familyId, childId, week, text),
                  saveScorecard: s => saveFamilyScorecard(supabase, hqId, familyId, s),
                })
              }
            }
            if (!stale()) setMember({ role: m.role, email, error: null, otherRole: access.otherRole })
          } catch (e) {
            if (!stale()) setMember({ role: m.role, email, error: e instanceof Error ? e.message : 'Your portal could not be loaded.', otherRole: access.otherRole })
          }
          return
        }

        at = 'your data'
        const load = await loadHqData(supabase, user.id, undefined, stage => trace(stage))
        if (cancelled) console.warn('[impact-load] CANCELLED AFTER FETCHES — the effect was cleaned up mid-load; applying the results anyway', { slug, userId, stale: stale() })
        if (stale()) { trace('cancelled return', { reason: 'address changed' }); return }
        setData(load.data)
        setPeople(load.people)
        setInsights(load.insights)
        setCohorts(load.cohorts)
        setFamilySessions(load.familySessions)
        if (load.packs) setPacks(load.packs)
        setCpd(load.cpd)
        setLoadError(loadErrorLine(load.errors))
        setHq({ userId: user.id, email: user.email ?? '', name: impactProfile?.display_name ?? '' })
        trace('done', { schools: load.rows.schools.length, errors: load.errors })
      } catch (e) {
        // Never silent: log the step and say so on the page, keeping whatever loaded.
        console.error('[impact-load] catch', at, { slug, userId, cancelled }, e)
        if (!stale()) setLoadError(`${e instanceof Error ? e.message : String(e)} (${at})`)
      } finally {
        if (!stale()) setReady(true)
      }
    })()
    return () => { cancelled = true }
  }, [slug, enabled, reloads])

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
      loadError: loadError ?? undefined,
      brand: brandFor(slug, rowExists ? settings : null),
      copy: EMPTY_IMPACT_COPY,
      data,
      people,
      cpd,
      insights,
      packs,
      cohorts,
      reload,
      coach,
      parent,
      sessionsByChild: familySessions,
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
  }, [slug, settings, rowExists, data, people, cpd, insights, packs, cohorts, reload, hq, save, coach, parent, familySessions, loadError])

  return { ready, ctx, hq, denied, member }
}
