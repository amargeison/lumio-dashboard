'use client'

// Live Impact portal loader for /impact/<slug> — mirrors the Tennis Coach
// address model: the slug picks the org, the signed-in login decides access.
//   the org's HQ, or an admin of it → load its rows, allow editing settings
//   an accepted member              → their role's view (impact_members), never the HQ's
//   anyone else, signed in or not   → nothing at all: the page shows a sign-in card
// The decision is resolvePortal (portal-access.ts). Every read is limited to this org's
// hq_id: RLS alone would merge the rows of a login that belongs to two orgs.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { CoachContext, ImpactCpd, ImpactDataset, ImpactPortalContext, ParentContext } from '@/app/tenproject/[slug]/_components/ImpactDataContext'
import { EMPTY_IMPACT_COPY, EMPTY_IMPACT_DATA, mapLiveRows, buildCohorts } from './live-context'
import { loadPacks } from './pack-actions'
import { isoToday, staffCertificates } from './compliance'
import { ageFrom, coachPayments, coachRows, loadCoachHome, loadFamilyBooklet, loadParentHome, markAttendance, saveBookletNote, saveFamilyScorecard, saveParentDetails, type ParentDetails } from './member-actions'
import type { MemberRole } from './members'
import { resolvePortal } from './portal-access'
import { setActingHq } from './org-scope'
import type { PackData } from './packs'
import type { ImpactPeople } from '@/app/tenproject/[slug]/_components/ImpactDataContext'
import { brandFor, type ImpactOrgSettings } from './org'
import type { LiveInsights } from './insights'
import { loadHqData, loadErrorLine } from './hq-load'

export interface LiveImpactState {
  ready: boolean
  ctx: ImpactPortalContext
  /** Signed-in HQ of THIS org, or an admin acting as it. */
  hq: { userId: string; email: string; name: string; admin: boolean } | null
  /** Signed in as this address, but with no access here. */
  signedInAs: string | null
  /** Signed-in coach, parent or school of THIS org. */
  member: { role: MemberRole; email: string; error: string | null; otherRole: MemberRole | null } | null
}

const sb = () => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export function useLiveImpact(slug: string, enabled: boolean): LiveImpactState {
  const [ready, setReady] = useState(!enabled)
  const [settings, setSettings] = useState<ImpactOrgSettings | null>(null)
  const [rowExists, setRowExists] = useState(false)
  const [data, setData] = useState<ImpactDataset>(EMPTY_IMPACT_DATA)
  const [people, setPeople] = useState<ImpactPeople | undefined>(undefined)
  const [hq, setHq] = useState<LiveImpactState['hq']>(null)
  const [signedInAs, setSignedInAs] = useState<string | null>(null)
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
      let at = 'sign-in'
      trace('start', { reloads })
      try {
        const access = await resolvePortal(supabase, slug, new URLSearchParams(window.location.search).get('view'))
        trace('access decided', { kind: access.kind })
        if (stale()) return
        setLoadError(null)
        if (access.kind === 'private') { setHq(null); setMember(null); setActingHq(null); setSignedInAs(access.email); return }
        userId = access.user.id
        setSettings(access.org.settings); setRowExists(true)
        setActingHq(access.org.hqId)
        if (access.kind === 'member') {
          const m = access.member, hqId = m.hq_id, email = access.user.email
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
                supabase.from('impact_messages').select('id, subject, body, created_at, direction, channel').eq('hq_id', hqId).eq('family_id', familyId).order('created_at', { ascending: false }).limit(80),
                loadPacks(supabase, hqId),
                loadFamilyBooklet(supabase, familyId),
              ])
              if (stale()) return
              if (home) {
                const orgName = brandFor(slug, access.org.settings).org
                setData({
                  ...EMPTY_IMPACT_DATA,
                  PARENT: {
                    name: home.guardian_name,
                    children: home.children.map(c => ({ id: c.id, name: c.name.split(' ')[0], age: ageFrom(c.date_of_birth), school: c.school ?? '', stickers: c.stickers })),
                    venue: { id: '', name: '', day: '', time: '', tenors: 0 },
                    consents: { data: home.consent_data ?? false, photo: home.consent_photo ?? false, emergency: home.emergency_contact ?? '—' },
                  },
                  // Their own replies show as theirs; the org's emails and app messages as the org's.
                  PARENT_MESSAGES: (messages.data ?? []).map(x => ({ id: x.id as string, from: x.direction === 'in' ? 'You' : orgName, mine: x.direction === 'in', when: new Date(x.created_at as string).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), text: (x.body as string) || (x.subject as string) || '' })),
                } as ImpactDataset)
                setPacks(packData)
                setFamilySessions(Object.fromEntries(home.children.map(c => [c.id, c.sessions])))
                setParent({
                  home, attendance: (attendance.data ?? []) as ParentContext['attendance'],
                  save: async (d: ParentDetails) => { await saveParentDetails(supabase, familyId, d); reload() },
                  ...familyBooklet,
                  saveNote: (childId, week, text) => saveBookletNote(supabase, hqId, familyId, childId, week, text),
                  saveScorecard: s => saveFamilyScorecard(supabase, hqId, familyId, s),
                  reply: async (body: string) => {
                    const { error } = await supabase.rpc('impact_parent_reply', { p_family: familyId, p_body: body })
                    if (error) throw new Error(error.message)
                    reload()
                  },
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
        const { data: profile } = await supabase.from('sports_profiles').select('display_name').eq('id', access.user.id).maybeSingle()
        const load = await loadHqData(supabase, access.org.hqId, undefined, stage => trace(stage), access.org.settings?.termDates)
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
        setHq({ userId: access.user.id, email: access.user.email, admin: access.admin, name: access.admin ? access.user.email : profile?.display_name ?? '' })
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
      actingAsAdmin: hq?.admin,
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

  return { ready, ctx, hq, signedInAs, member }
}
