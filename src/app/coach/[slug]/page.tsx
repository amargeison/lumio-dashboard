'use client'

// ─── Lumio Tennis — COACH PORTAL ────────────────────────────────────────────
// New portal for tennis coaches. Mirrors the tennis (player) portal:
//   • Same dark theme, collapsible grouped sidebar, purple accent, right rail.
//   • Same auth pattern: SportsDemoGate (email-gate demo) + a Supabase check
//     so a signed-in coach gets their own session. sport key = 'coach'.
//   • Responsive: desktop chrome on wide screens, a mobile shell (drawer nav,
//     stacked content, no right rail) below 768px.
// Coach modules: Dashboard, Lesson Summaries, Player Development, Belt
// Progression, Booking Calendar, Training Camps, Roster, Messages, Resource
// Centre, Payments.

import { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback, use } from 'react'
import { createPortal } from 'react-dom'
import { visibleEmail } from '@/lib/demo-visitor-client'
import dynamic from 'next/dynamic'
import { createBrowserClient } from '@supabase/ssr'
import { SportsDemoGate, type SportsDemoSession } from '@/components/sports-demo'
import { ModuleGate } from './_components/ModuleSkeleton'
import { prefetchCoachTables, type CoachTable } from './_lib/coach-db'
import { useIsMobile } from '@/hooks/useIsMobile'
import { avatarSrc } from '@/lib/avatar'
import { THEMES, DENSITY } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import {
  COACH_ORG, COACH_SIDEBAR, COACH_GROUPS, demoAvatarUrl,
} from './_lib/coach-data'
import { useCoachSettings } from './_lib/use-settings'
import { coachTheme } from './_lib/theme'
import { startSettingsSync, rememberOnAccount } from './_lib/settings-sync'
import { claimCoachStorage, clearCoachStorage, stillOwner, tabIsLost, TAB_LOST } from './_lib/storage-scope'
import { clearPrivateCaches } from '@/components/PwaInstaller'
import { slugify } from '@/lib/sports-admin/portal-url'
import { getHidden, subscribe as subscribeMenu, ALWAYS_VISIBLE } from './_lib/menu-visibility'
import { getSession as getDemoSession, saveSession as saveDemoSession } from '@/components/sports-demo/SportsDemoGate'
import {
  normalizeRole, viewFromRole, coachIdForRole, roleAllowsNav, setScopeCoachId, type CoachViewRole, type CoachView,
} from './_lib/role-scope'
import { currentIdentity, identityProblem, identityMessage, IDENTITY_CHANGED, saveCoachProfile, tabStillMine, TAB_LOST_MESSAGE, type CoachIdentity } from './_lib/coach-db'
import { CoachMobileShell } from './_components/CoachMobileShell'
import { CoachProfileMenu } from './_components/CoachProfileMenu'
import { CoachPwaInstaller } from './_components/CoachPwaInstaller'
import { EmptyModule } from './_components/EmptyCoachDashboard'
import { clearDemoSession, wipeDemoSurvivors, markDemoSignedOut } from '@/lib/demo-session/clear'
import { formatPounds } from '@/lib/coach/money'
import { MessagesUnreadBadge } from './_components/MessagesUnreadBadge'
import { useCoachStats, RACKET_STAGES, dbList, setPreviewStaff, failedTables, cachedRows, invalidateCoachTable, LOAD_FAILED } from './_lib/coach-db'
import { getFlags as getFeatureFlags, subscribe as subscribeFeatures, DEMO_FLAGS, NEW_ACCOUNT_TIER, type FeatureFlags } from './_lib/feature-flags'
import { ModuleHelpButton } from './_components/ModuleHelpButton'

// ── Lazy-loaded modules ─────────────────────────────────────────────────────
// Each module is code-split so only the one you're viewing is downloaded — the
// portal no longer ships every module's JS up front. Re-visits are instant
// (the chunk is cached). A light placeholder shows on first open of each.
const ModuleLoading = () => <div style={{ padding: 48, textAlign: 'center', color: 'rgba(160,170,190,0.7)', fontSize: 13 }}>Loading…</div>

// Every module's loader, so the installed app can fetch them all once it is up
// (see the warm-up in CoachPortalInner). Offline, a module that had never been
// opened could not be downloaded, and the whole app was replaced by "This page
// couldn't load".
const MODULE_LOADERS: (() => Promise<unknown>)[] = []

function lazyNamed<M, K extends keyof M>(loader: () => Promise<M>, key: K): M[K] {
  MODULE_LOADERS.push(loader)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return dynamic(() => loader().then(m => ({ default: (m as any)[key] })), { ssr: false, loading: ModuleLoading }) as unknown as M[K]
}

// The page a real family actually gets.
const LiveStudentPreview = lazyNamed(() => import('./_components/LiveStudentPreview'), 'LiveStudentPreview')
const SettingsView = lazyNamed(() => import('./_components/CoachModules'), 'SettingsView')
// Live (real-coach) views
const LiveCoachDashboard = lazyNamed(() => import('./_components/LiveCoachDashboard'), 'LiveCoachDashboard')
const CoachMyProfile = lazyNamed(() => import('./_components/CoachMyProfile'), 'CoachMyProfile')
const CoachSettings = lazyNamed(() => import('./_components/CoachSettings'), 'CoachSettings')
const LiveMessages = lazyNamed(() => import('./_components/LiveMessages'), 'LiveMessages')
const LiveRoster = lazyNamed(() => import('./_components/LiveRoster'), 'LiveRoster')
const LiveSessionPlanner = lazyNamed(() => import('./_components/LiveSessionPlanner'), 'LiveSessionPlanner')
const LiveLessons = lazyNamed(() => import('./_components/LiveLessons'), 'LiveLessons')
const LiveBookingCalendar = lazyNamed(() => import('./_components/LiveBookingCalendar'), 'LiveBookingCalendar')
const LiveRacketProgression = lazyNamed(() => import('./_components/LiveRacketProgression'), 'LiveRacketProgression')
const LiveDevelopment = lazyNamed(() => import('./_components/LiveDevelopment'), 'LiveDevelopment')
const LiveCourtPlanner = lazyNamed(() => import('./_components/LiveCourtPlanner'), 'LiveCourtPlanner')
const LiveCamps = lazyNamed(() => import('./_components/LiveCamps'), 'LiveCamps')
const LivePayments = lazyNamed(() => import('./_components/LivePayments'), 'LivePayments')
const LiveEquipment = lazyNamed(() => import('./_components/LiveEquipment'), 'LiveEquipment')
const LiveResources = lazyNamed(() => import('./_components/LiveResources'), 'LiveResources')
const LiveVideoAudio = lazyNamed(() => import('./_components/LiveVideoAudio'), 'LiveVideoAudio')
const LiveEffortRewards = lazyNamed(() => import('./_components/LiveEffortRewards'), 'LiveEffortRewards')
const LiveStaff = lazyNamed(() => import('./_components/LiveStaff'), 'LiveStaff')
// Settings sub-panels + wizard (heavy, conditionally shown)
const CoachOnboardingWizard = lazyNamed(() => import('./_components/CoachOnboardingWizard'), 'CoachOnboardingWizard')

// The three view roles for the role switcher. Head + Coach are the same portal
// filtered by permission; Student is a purpose-built player/parent view (a
// placeholder this phase — built in Phase 2).
const COACH_ROLES = [
  { id: 'head',    label: 'Head Coach', icon: '🎾',   description: 'Head Coach — full academy access' },
  { id: 'coach',   label: 'Coach',      icon: '🧑‍🏫', description: 'Coach — your players & sessions' },
  { id: 'student', label: 'Player',     icon: '🎾',   description: 'Player — the player & parent view' },
]

// Known demo slug(s) keep the full sample-data portal. Any other slug is a
// brand-new academy → render the EMPTY onboarding portal (mirrors Women's FC).
const DEMO_SLUGS = new Set(['demo'])

function clubNameFromSlug(slug: string): string {
  return slug.split('-').filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Your Academy'
}

// ─── Sign out ───────────────────────────────────────────────────────────────
// One implementation for both portals, because a real academy slug can be
// reached two ways — a pre-existing Supabase session (the auth path above) or a
// fresh OTP through the gate — and both must end the real session.
//
// LIVE: end the Supabase session FIRST, then clear every local key. Order
// matters: if the local session blob survived, returning to the portal URL would
// let the gate restore it and walk straight back in — a logout that doesn't log
// you out. Wiping the survivors (name, photo, brand) costs nothing for a real
// coach: their identity and data live in Supabase (sports_profiles + the coach
// tables) and are re-read on sign-in.
//
// DEMO: there is no real session to end. Drop the local demo session — keeping
// the survivors, so signing back in resumes the same persona — and return to the
// demo gate. Same contract as the tennis/golf portals' Sign out.
//
// markDemoSignedOut is what makes "Exit demo" actually exit. Clearing the
// session alone isn't enough: the gate rebuilds one from the survivors on its
// very next mount (dev-host rebuild) and from the Supabase demo cookie (every
// host), so the user was bounced straight back into the demo. The marker parks
// the gate on "Explore the demo" until they choose to enter again — the next
// verified OTP clears it and resumes this same persona.
async function signOutCoach(live: boolean) {
  if (typeof window === 'undefined') return
  if (!live) {
    clearDemoSession('coach')
    markDemoSignedOut('coach')
    window.location.href = '/tennis/coach/demo'
    return
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  try {
    if (url && key) await createBrowserClient(url, key).auth.signOut()
  } catch { /* still clear locally and leave */ }
  wipeDemoSurvivors('coach')
  // …and everything this account cached in the browser: settings, the hidden
  // menu, the modules that are switched on, the dashboard briefing. Left
  // behind, they were shown to — and then saved into the account of — the next
  // coach to sign in on a shared computer.
  clearCoachStorage()
  // …and anything the installed app's service worker kept (see clearPrivateCaches).
  await clearPrivateCaches()
  // Back to the real login, which sends them straight here again after OTP.
  const back = window.location.pathname
  window.location.href = back ? `/sports-login?redirectTo=${encodeURIComponent(back)}` : '/sports-login'
}

// ─── Page entry: auth check → demo gate → portal ────────────────────────────
export default function CoachPortalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const isEmpty = !DEMO_SLUGS.has(slug)
  const slugClubName = clubNameFromSlug(slug)
  const [authChecked, setAuthChecked] = useState(false)
  const [authSession, setAuthSession] = useState<SportsDemoSession | null>(null)
  // The setup-pending screen is a status update, NOT a lock. Skipping onboarding
  // has always dropped a founder straight into the working portal, so completing
  // it must never leave them with less access — they can always continue through.
  const [enterAnyway, setEnterAnyway] = useState(false)
  // Signed in, but whoami will not place them here. Held separately from
  // authSession so the gate can be skipped entirely rather than re-prompting.
  // `exists` — is there an academy at this address at all (null: could not
  // check). `ownPath` — their own portal, when they have one somewhere else.
  const [signedInDenied, setSignedInDenied] = useState<{ email: string; reason: string; exists: boolean | null; ownPath: string | null } | null>(null)
  // Nobody signed in, and no academy lives at this address.
  const [noAcademy, setNoAcademy] = useState(false)
  // The sign-in check could not reach the server. That is not "nobody is
  // signed in": a coach on a patchy signal was shown the sign-in box (and asked
  // for a new code they did not need) and it never recovered by itself.
  const [authTrouble, setAuthTrouble] = useState(false)
  const [authAttempt, setAuthAttempt] = useState(0)
  const [authRetrying, setAuthRetrying] = useState(false)

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) { setAuthChecked(true); return }
    const supabase = createBrowserClient(url, key)
    const here = slug.toLowerCase()
    // Is there an academy at this address? null when the check itself failed.
    const academyHere = async (): Promise<boolean | null> => {
      try {
        const r = await fetch(`/api/coach/slug-check?exists=${encodeURIComponent(slug)}`)
        const j = await r.json()
        return r.ok && typeof j?.exists === 'boolean' ? j.exists : null
      } catch { return null }
    }
    // Where this signed-in person's OWN portal is, if they have one that is not
    // this page. Asked of the server as themselves (see identify-user).
    const ownPortal = async (email: string | undefined): Promise<string | null> => {
      if (!email) return null
      try {
        const r = await fetch('/api/sports-auth/identify-user', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
        const j = await r.json()
        if (!r.ok) return null
        let path: string | null = null
        if (j.type === 'founder' || j.type === 'both') {
          const sport = j.founderSport || j.sport
          path = sport === 'coach' || sport === 'womens'
            ? portalUrlForOwn(sport, j.founderSlug, j.founderBrand, j.founderDisplayName)
            : sport ? `/${sport}/app` : null
        } else if (j.type === 'member') path = j.memberDest || '/portal'
        return path && path.toLowerCase() !== window.location.pathname.toLowerCase() ? path : null
      } catch { return null }
    }
    // A later attempt has taken over (see the retry below): this one's verdict
    // on the connection no longer counts.
    let superseded = false
    ;(async () => {
      let trouble = false
      try {
        // Before the first request of any kind: a phone can still be running an
        // OLDER service worker that stored the last person's answers and hands
        // them to the next one. Emptied here, it has nothing to hand over.
        await clearPrivateCaches()
        const { data: { user }, error: userErr } = await supabase.auth.getUser()
        // The question never reached the sign-in service (see authTrouble).
        if (!user && userErr && (userErr.name === 'AuthRetryableFetchError' || userErr.status === 0)) { trouble = true; return }
        if (user) {
          const { data: profile, error: profileErr } = await supabase
            .from('sports_profiles')
            .select('sport, display_name, nickname, avatar_url, brand_name, brand_logo_url, enabled_features, onboarding_complete, setup_type, setup_complete, portal_slug')
            .eq('id', user.id)
            .maybeSingle()
          // Signed in, but their account could not be read. Carrying on would
          // treat a head coach as somebody with no academy.
          if (profileErr) { trouble = true; return }
          // Only adopt the signed-in session for a coach profile, so we never
          // hijack a player's tennis session. Anyone else falls through to the
          // public demo gate below.
          const ownAddress = profile && profile.sport === 'coach'
            ? (profile.portal_slug || slugify(profile.brand_name) || slugify(profile.display_name) || '').toLowerCase()
            : ''
          // A head coach at an address that is not their own academy's. They may
          // still belong here: somebody who runs one club can be an assistant
          // coach at another, and whoami answers for THIS address.
          const elsewhere = !!(isEmpty && ownAddress && ownAddress !== here)
          const guest = elsewhere ? await currentIdentity() : null
          if (elsewhere && !guest && identityProblem() === 'error') { trouble = true; return }
          // Whatever this browser cached for a coach portal now has to be THIS
          // person's, at THIS academy. Done here, before the portal mounts and
          // reads any of it: a cache left by somebody else — or by this person's
          // other academy — is thrown away, never shown. In their own academy
          // the cache is theirs under their own id, as it always was.
          const claim = (me: CoachIdentity | null) => {
            if (!isEmpty) return
            const other = me && me.academyId !== user.id && (me.academies?.length ?? 0) > 1
            claimCoachStorage(other ? `${user.id}:${me.academyId}` : user.id)
          }
          if (elsewhere && !(guest && !guest.isHead)) {
            // A head coach, and this is not their academy's address nor one they
            // assist at. Their own portal used to open here anyway, under
            // somebody else's address and browser-tab title. Say whose address
            // it is not, and offer the way to theirs.
            claim(null)
            setSignedInDenied({
              email: visibleEmail(user),
              reason: '',
              exists: await academyHere(),
              ownPath: `/tennis/coach/${ownAddress}`,
            })
          } else if (profile && profile.sport === 'coach' && !elsewhere) {
            claim(null)
            // First-run choices kept on the account, read only while they can
            // still matter: "Skip for now" on the wizard, and "Go to my portal
            // now" on the we-are-setting-you-up screen.
            let setupSkipped = false
            if (isEmpty && (!profile.onboarding_complete || (profile.setup_type === 'lumio' && !profile.setup_complete))) {
              const { data: cfg } = await supabase.from('coach_settings')
                .select('skipped:data->setupSkipped, seen:data->setupPendingSeen').eq('coach_id', user.id).maybeSingle()
              const flags = cfg as { skipped?: unknown; seen?: unknown } | null
              setupSkipped = flags?.skipped === true
              if (flags?.seen === true) setEnterAnyway(true)
            }
            setAuthSession({
              email: visibleEmail(user),
              userName: profile.display_name ?? '',
              clubName: profile.brand_name ?? '',
              role: 'head',
              photoDataUrl: profile.avatar_url ?? null,
              logoDataUrl: profile.brand_logo_url ?? null,
              sport: 'coach',
              verifiedAt: new Date().toISOString(),
              isDemoShell: false,
              enabledFeatures: profile.enabled_features || [],
              nickname: profile.nickname ?? null,
              onboardingComplete: !!profile.onboarding_complete,
              setupType: profile.setup_type ?? null,
              setupComplete: !!profile.setup_complete,
              setupSkipped,
            })
          } else {
            // An INVITED COACH. They own no academy, so they have no
            // sports_profiles row at all — and this branch used to end here,
            // dropping them through to the public demo gate. That gate asked for
            // their email a second time and then let them in wearing a demo
            // persona, which is why a signed-in coach was greeted as the demo
            // coach and handed the demo view-switcher.
            //
            // whoami is the same question asked of the right table — and it is
            // asked about this address, so a coach at two academies is placed
            // in the one they opened.
            const me = await currentIdentity()
            if (!me && identityProblem() === 'error') { trouble = true; return }
            claim(me)
            if (!me) {
              // Signed in, but we cannot place them in this academy. DO NOT fall
              // through to the gate: the gate asks for their email, signs them
              // in again, lands them back here, and denies them again — a loop
              // with no exit, which is what a coach hit after following the
              // invite. Better to stop and say why.
              const said = identityMessage()
              if (isEmpty) setSignedInDenied({
                email: visibleEmail(user),
                // The server's own explanation when it has a specific one (an
                // invite that was never finished); otherwise nothing extra.
                reason: said && said !== 'No coach access' ? said : '',
                exists: await academyHere(),
                ownPath: await ownPortal(user.email),
              })
            } else if (!me.isHead && isEmpty && me.slug && me.slug.toLowerCase() !== here) {
              // An invited coach, at an address that is not their academy's.
              setSignedInDenied({
                email: visibleEmail(user), reason: '',
                exists: await academyHere(),
                ownPath: `/tennis/coach/${me.slug.toLowerCase()}`,
              })
            } else if (!me.isHead) {
              setAuthSession({
                email: visibleEmail(user),
                userName: me.displayName ?? '',
                clubName: me.brandName ?? '',
                role: 'coach',
                photoDataUrl: me.avatarUrl ?? null,
                logoDataUrl: me.brandLogoUrl ?? null,
                sport: 'coach',
                verifiedAt: new Date().toISOString(),
                isDemoShell: false,
                enabledFeatures: [],
                nickname: null,
                // A coach never owns the academy's setup, so these must not put
                // them behind the head coach's setup-pending lock.
                onboardingComplete: true,
                setupType: null,
                setupComplete: true,
              })
            }
          }
        } else if (isEmpty) {
          // Nobody signed in. Only offer a sign-in box for an academy that
          // exists; a mistyped address should say so. If the check cannot be
          // made, offer the sign-in as before.
          if ((await academyHere()) === false) setNoAcademy(true)
        }
      } catch { /* fall through to demo gate */ } finally {
        if (!superseded) {
          setAuthTrouble(trouble)
          setAuthRetrying(false)
          setAuthChecked(true)
        }
      }
    })()
    return () => { superseded = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authAttempt])

  // Try again by itself when the connection comes back, when the app is
  // looked at again, and every few seconds meanwhile.
  useEffect(() => {
    if (!authTrouble) return
    const again = () => setAuthAttempt(n => n + 1)
    const onShow = () => { if (document.visibilityState === 'visible') again() }
    window.addEventListener('online', again)
    document.addEventListener('visibilitychange', onShow)
    const t = setInterval(again, 8000)
    return () => { window.removeEventListener('online', again); document.removeEventListener('visibilitychange', onShow); clearInterval(t) }
  }, [authTrouble])

  if (!authChecked) return (
    <div style={{ minHeight: '100vh', background: '#07080F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 11, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Loading…</div>
    </div>
  )

  if (authTrouble) return (
    <div style={{ minHeight: '100vh', background: '#07080F', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-geist-sans, system-ui)' }}>
      <div role="alert" style={{ maxWidth: 460, width: '100%', background: '#0d1117', border: '1px solid #1F2937', borderRadius: 18, padding: 30, textAlign: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/tennis_coach_logo.png" alt="Lumio Tennis Coach" style={{ height: 44, objectFit: 'contain', margin: '0 auto 20px', display: 'block' }} />
        <h1 style={{ color: '#fff', fontSize: 19, fontWeight: 800, margin: '0 0 10px' }}>We couldn&rsquo;t load your portal</h1>
        <p style={{ color: '#9CA3AF', fontSize: 13.5, lineHeight: 1.7, margin: '0 0 22px' }}>
          This device couldn&rsquo;t reach Lumio. Check your connection, then try again. You don&rsquo;t need to sign in again.
        </p>
        <button onClick={() => { setAuthRetrying(true); setAuthAttempt(n => n + 1) }} disabled={authRetrying}
          style={{ appearance: 'none', border: 0, background: '#3A8EE0', color: '#fff', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: authRetrying ? 'default' : 'pointer', opacity: authRetrying ? 0.6 : 1 }}>
          {authRetrying ? 'Trying again…' : 'Try again'}
        </button>
      </div>
    </div>
  )

  // The auth-based portal + setup-pending lock apply ONLY to a real academy slug
  // (isEmpty). The DEMO slug must ALWAYS fall through to the public demo gate
  // below, so a signed-in coach — even one still on the setup-pending lock — can
  // still view the live demo. "Set it up for me" accounts stay locked on the
  // setup-pending screen until the Lumio team marks the portal live (setup_complete).
  if (isEmpty && authSession && authSession.onboardingComplete && authSession.setupType === 'lumio' && !authSession.setupComplete && !enterAnyway) {
    // Remembered on the account, so having chosen to go in they stay in —
    // this screen used to come back on every page load.
    return <SetupPendingScreen name={authSession.userName} clubName={authSession.clubName} email={authSession.email} onEnter={() => { setEnterAnyway(true); void rememberOnAccount({ setupPendingSeen: true }) }} />
  }

  if (isEmpty && authSession) return <CoachPortalInner session={authSession} isEmpty={isEmpty} slugClubName={slugClubName} />

  // Dead end rather than a loop. Signing in again cannot fix this, so do not
  // offer it as though it could — name the problem and who resolves it.
  if (isEmpty && signedInDenied) {
    const missing = signedInDenied.exists === false
    return (
      <div style={{ minHeight: '100vh', background: '#07080F', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-geist-sans, system-ui)' }}>
        <div style={{ maxWidth: 460, width: '100%', background: '#0d1117', border: '1px solid #1F2937', borderRadius: 18, padding: 30, textAlign: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/tennis_coach_logo.png" alt="Lumio Tennis Coach" style={{ height: 44, objectFit: 'contain', margin: '0 auto 20px', display: 'block' }} />
          <h1 style={{ color: '#fff', fontSize: 19, fontWeight: 800, margin: '0 0 10px' }}>
            {missing ? 'There is no academy at this address' : <>This account doesn&rsquo;t have access to {slugClubName}</>}
          </h1>
          <p style={{ color: '#9CA3AF', fontSize: 13.5, lineHeight: 1.7, margin: '0 0 6px' }}>
            {missing
              ? 'Check the address for typos, or use the link in your invite email.'
              : (signedInDenied.reason || 'If you should have access, ask the academy’s head coach to invite this email address.')}
          </p>
          <p style={{ color: '#6B7280', fontSize: 12.5, lineHeight: 1.7, margin: '0 0 22px' }}>
            You are signed in as <strong style={{ color: '#D1D5DB' }}>{signedInDenied.email}</strong>.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {signedInDenied.ownPath && (
              <a href={signedInDenied.ownPath}
                style={{ background: '#3A8EE0', color: '#fff', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                Go to my portal
              </a>
            )}
            <button onClick={() => { void signOutCoach(true) }}
              style={{ appearance: 'none', border: '1px solid #1F2937', background: 'transparent', color: '#9CA3AF', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Sign out
            </button>
          </div>
        </div>
      </div>
    )
  }

  // A real address that no academy uses, and nobody signed in. A sign-in box
  // here would take an email and a code and then have nowhere to go.
  if (isEmpty && noAcademy) return (
    <div style={{ minHeight: '100vh', background: '#07080F', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-geist-sans, system-ui)' }}>
      <div style={{ maxWidth: 460, width: '100%', background: '#0d1117', border: '1px solid #1F2937', borderRadius: 18, padding: 30, textAlign: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/tennis_coach_logo.png" alt="Lumio Tennis Coach" style={{ height: 44, objectFit: 'contain', margin: '0 auto 20px', display: 'block' }} />
        <h1 style={{ color: '#fff', fontSize: 19, fontWeight: 800, margin: '0 0 10px' }}>There is no academy at this address</h1>
        <p style={{ color: '#9CA3AF', fontSize: 13.5, lineHeight: 1.7, margin: '0 0 22px' }}>
          Check the address for typos, or use the link in your invite email. If you have an account, signing in will take you to your own portal.
        </p>
        <button onClick={() => { window.location.href = '/sports-login' }}
          style={{ appearance: 'none', border: 0, background: '#3A8EE0', color: '#fff', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          Sign in
        </button>
      </div>
    </div>
  )

  return (
    <SportsDemoGate
      sport="coach"
      defaultClubName="Lumio Tennis Coach"
      accentColor="#3A8EE0"
      accentColorLight="#7db3ea"
      sportEmoji="🎾"
      sportLabel="Lumio Tennis Coach"
      roles={COACH_ROLES}
      skipWizard
      // Real academy slug → the gate is a LIVE sign-in, not a demo invitation.
      liveSignIn={isEmpty}
      // The gate has no navigation, so after "Exit demo" the logo is the only
      // way back out — point it at the Tennis Coach marketing page.
      logoHref="/tennis-coach"
    >
      {(session) => <CoachPortalInner session={session} isEmpty={isEmpty} slugClubName={slugClubName} />}
    </SportsDemoGate>
  )
}

// A head coach's or women's club's own portal path, the same way every other
// link to a portal works it out (portal_slug, else the name).
function portalUrlForOwn(sport: string, slug?: string | null, brand?: string | null, name?: string | null): string | null {
  const s = slug || slugify(brand) || slugify(name)
  if (!s) return null
  return sport === 'coach' ? `/tennis/coach/${s}` : `/womens/${s}`
}

// ─── Setup-pending lock screen ───────────────────────────────────────────────
// Shown to "Set it up for me" founders after onboarding, until the Lumio team
// finishes importing their data and marks the portal live (setup_complete).
function SetupPendingScreen({ name, clubName, email, onEnter }: { name?: string; clubName?: string; email?: string; onEnter?: () => void }) {
  const first = (name || '').split(/\s+/)[0] || 'Coach'
  return (
    <div style={{ minHeight: '100vh', background: '#07080F', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', fontFamily: 'var(--font-geist-sans, system-ui)' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/tennis_coach_logo.png" alt="Lumio Tennis Coach" style={{ height: 52, objectFit: 'contain', marginBottom: 28 }} />
      <div style={{ width: '100%', maxWidth: 520, background: '#0d1117', border: '1px solid #1F2937', borderRadius: 20, padding: '40px 36px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 14 }}>🎾</div>
        <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 800, margin: '0 0 10px' }}>We&rsquo;re setting up {clubName || 'your portal'}</h1>
        <p style={{ color: '#9CA3AF', fontSize: 14.5, lineHeight: 1.65, margin: '0 0 22px' }}>
          Thanks {first} — our team is importing your data and configuring everything for you.
          Your portal will be ready within <strong style={{ color: '#fff' }}>2–3 working days</strong>, and we&rsquo;ll email you the moment it&rsquo;s live.
        </p>
        <div style={{ background: '#111318', border: '1px solid #1F2937', borderRadius: 12, padding: '16px 18px', textAlign: 'left', marginBottom: 22 }}>
          <div style={{ color: '#fff', fontSize: 13.5, fontWeight: 700, marginBottom: 5 }}>📋 Speed things up</div>
          <div style={{ color: '#9CA3AF', fontSize: 12.5, lineHeight: 1.6 }}>
            We&rsquo;ve emailed you our data template{email ? <> at <strong style={{ color: '#D1D5DB' }}>{email}</strong></> : null}. Fill in your players, coaches, courts, camps, equipment and payments — or send us whatever records you already have — and just reply to that email.{' '}
            <a href="/templates/lumio-coach-import-template.xlsx" download style={{ color: '#3A8EE0', fontWeight: 600, textDecoration: 'none' }}>Download the template ⤓</a>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {onEnter && (
            <button onClick={onEnter}
              style={{ appearance: 'none', border: 'none', background: '#3A8EE0', color: '#fff', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Go to my portal now →
            </button>
          )}
          <button onClick={() => { if (typeof window !== 'undefined') window.location.reload() }}
            style={{ appearance: 'none', border: '1px solid #374151', background: 'transparent', color: '#9CA3AF', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            ↻ Check if it&rsquo;s ready
          </button>
        </div>
        {onEnter && <p style={{ color: '#4B5563', fontSize: 12, margin: '14px 0 0' }}>Your portal already works — it&rsquo;s just empty until we load your data. Have a look around any time.</p>}
        <p style={{ color: '#4B5563', fontSize: 12, margin: '20px 0 0' }}>Questions? Email <a href="mailto:support@lumiosports.com" style={{ color: '#6B7280' }}>support@lumiosports.com</a> — a real person reads every one.</p>
      </div>
    </div>
  )
}

// The tables each live page reads. The page is held back (skeleton showing)
// until these are loaded, so it never flashes its empty state at a coach whose
// data is simply still on the way. Kept beside the switch that renders them.
const LIVE_MODULE_TABLES: Record<string, CoachTable[]> = {
  roster: ['coach_players', 'coach_staff', 'coach_attendance', 'coach_player_skills'],
  staff: ['coach_staff', 'coach_players', 'coach_bookings', 'coach_venues'],
  calendar: ['coach_bookings', 'coach_camps', 'coach_players', 'coach_staff', 'coach_venues'],
  belts: ['coach_players', 'coach_player_skills'],
  lessons: ['coach_sessions', 'coach_bookings', 'coach_players', 'coach_session_plans'],
  camps: ['coach_camps', 'coach_camp_attendees', 'coach_camp_channels', 'coach_players', 'coach_staff', 'coach_attendance', 'coach_player_skills'],
  payments: ['coach_payments', 'coach_packages', 'coach_players', 'coach_sessions'],
  gpsheatmaps: ['coach_players', 'coach_watch_sessions'],
  videoaudio: ['coach_media', 'coach_players'],
  planner: ['coach_bookings', 'coach_sessions', 'coach_session_plans', 'coach_players', 'coach_camps', 'coach_player_skills'],
  venues: ['coach_venues', 'coach_courts', 'coach_bookings', 'coach_staff'],
  development: ['coach_players', 'coach_player_skills', 'coach_attendance', 'coach_sessions', 'coach_gps_sessions'],
  equipment: ['coach_equipment', 'coach_kit_items'],
  resources: ['coach_resources'],
  messages: ['coach_messages', 'coach_players', 'coach_staff', 'coach_venues', 'coach_camp_channels'],
}
const ALL_LIVE_TABLES = Array.from(new Set(Object.values(LIVE_MODULE_TABLES).flat()))
// What the dashboard is built from — used only to tell "could not load" apart
// from "nothing here yet" (it has no ModuleGate of its own).
const DASHBOARD_TABLES: CoachTable[] = ['coach_players', 'coach_bookings', 'coach_sessions']

// Where the open page is shown inside whichever layout is on screen. See
// moduleHost in CoachPortalInner.
function ModuleSlot({ host }: { host: HTMLElement }) {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => { ref.current?.appendChild(host) }, [host])
  return <div ref={ref} style={{ display: 'contents' }} />
}

// ─── Portal shell ───────────────────────────────────────────────────────────
function CoachPortalInner({ session, isEmpty: realAccount = false, slugClubName }: { session?: SportsDemoSession; isEmpty?: boolean; slugClubName?: string }) {
  // The demo is the LIVE portal on an in-memory academy (see _lib/demo). Every
  // module, the rail, the switcher and the stats below are the real ones in both
  // cases — so the demo can never fall behind the product again. What still
  // differs is only what belongs to a real account: who is signed in, how they
  // sign out, first-run setup, and the "this is a demo" banner.
  const isDemo = !realAccount
  const settings = useCoachSettings()
  // The theme and accent as chosen, made readable together: the words on an
  // accent button and the accent itself against the page (see _lib/theme).
  const { T, accent } = coachTheme(settings.theme, settings.accentKey)
  const density = DENSITY[settings.density]
  const sideBg = T.isDark ? '#0a0c14' : T.panel2
  const line = T.border
  const isMobile = useIsMobile()
  // Warm every page's data in the background once the portal is up, so moving
  // between pages is instant rather than a fresh load each time. Deferred a
  // moment so the dashboard's own reads go first.
  useEffect(() => {
    const t = setTimeout(() => { void prefetchCoachTables(ALL_LIVE_TABLES) }, 1200)
    return () => clearTimeout(t)
  }, [])
  // …and, for the installed app, every page's code. Each module is its own
  // download, fetched the first time it is opened — so with no signal, tapping
  // one that had not been opened yet replaced the whole app with an error page.
  // Once the service worker is in place (it is what keeps the files on the
  // phone), the rest are fetched quietly, one at a time, after the first page
  // has settled. Not where there is no worker (nothing would keep them), and
  // not for somebody who has asked their phone to save data.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
    if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return
    let stop = false
    navigator.serviceWorker.ready.then(async () => {
      await new Promise(r => setTimeout(r, 2500))
      for (const load of MODULE_LOADERS) {
        if (stop) return
        await load().catch(() => { /* offline or mid-deploy — it is fetched when opened instead */ })
      }
    }).catch(() => {})
    return () => { stop = true }
  }, [])

  // ─── This tab is no longer the coach it was opened for ────────────────────
  // Somebody else signed in (or this coach signed out) in another tab of the
  // same browser. The data layer has already stopped writing (see stillOwner
  // and tabStillMine); this says so, instead of leaving a page that looks live
  // and saves nothing — or, as it used to, saves into the other account.
  const [tabLost, setTabLost] = useState(false)
  useEffect(() => {
    if (isDemo) return
    const lost = () => setTabLost(true)
    const check = () => { if (document.visibilityState === 'visible') { stillOwner(); void tabStillMine() } }
    if (tabIsLost()) lost()
    void tabStillMine()   // remembers who this tab was opened for
    window.addEventListener(TAB_LOST, lost)
    window.addEventListener('focus', check)
    document.addEventListener('visibilitychange', check)
    return () => {
      window.removeEventListener(TAB_LOST, lost)
      window.removeEventListener('focus', check)
      document.removeEventListener('visibilitychange', check)
    }
  }, [isDemo])

  // Empty (brand-new) portals must show NO demo data — no demo coach photo,
  // name or credential. Only the account's own real values (or blanks) appear
  // until they connect their data.
  // Head coach name: once the coach has set their name in Settings → Head coach
  // profile (i.e. it's no longer the demo default), that name wins everywhere —
  // sidebar, rail and the Coaches module all agree. Sub-coach logins keep their
  // own session name.
  // The DEMO is a fixed showcase: Vincent Jones, head coach of Lumio Tennis Club,
  // whoever is looking at it. It used to take the visitor's sign-in name and any
  // renamed academy on this browser, so a coach who also ran a real portal saw
  // their own name and club dressed up as the demo.
  // Trimmed: a name box holding only spaces is not a name, and used to be saved
  // to the account as one.
  const customHeadName = realAccount && session?.role === 'head' && settings.coach?.trim() && settings.coach !== COACH_ORG.coach ? settings.coach.trim() : ''
  const coachName = isDemo ? COACH_ORG.coach : (customHeadName || session?.userName || slugClubName || '')
  const coachInitials = coachName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  // Live: the head coach's uploaded photo (settings). Demo: a name-seeded avatar
  // so the top-right rail matches the coach cards in the grid.
  // Settings first, session second. session.photoDataUrl is a snapshot taken at
  // sign-in, so while it won the head coach could change their photo on the
  // Coaches page and watch the rail keep the old one until they signed in again.
  // The settings copy is written the moment the upload succeeds and repaints
  // straight away; the session value stays as the fallback for a coach who has
  // only ever set a photo during onboarding.
  const coachPhoto = isDemo ? demoAvatarUrl(coachName) : (settings.head?.avatarUrl || session?.photoDataUrl || null)
  // The name the head coach typed in Settings wins over the one captured when
  // they signed in. session.clubName is a snapshot from sign-in, so while it
  // came first, renaming the academy to "PG Tennis" changed nothing on screen —
  // the sidebar and the dashboard banner kept "Penrith Tennis Club" until the
  // next login. Same rule the coach's own name already follows just above.
  const customClubName = realAccount && session?.role === 'head' && settings.academy?.trim() && settings.academy !== COACH_ORG.academy ? settings.academy.trim() : ''
  const clubName = isDemo ? COACH_ORG.academy : (customClubName || session?.clubName || slugClubName || '')

  // …and carry a rename through to the account itself. The sidebar reads the
  // setting, but certificates, camp packs, emails and the player app read the
  // profile row — so a name changed only in Settings looked fixed here and was
  // still wrong on every piece of paper that left the building. Written once
  // per change, when the two disagree; never for the demo, never for staff.
  const syncedNames = useRef('')
  useEffect(() => {
    if (!realAccount || session?.role !== 'head') return
    const patch: Record<string, string> = {}
    if (customClubName && customClubName !== session?.clubName) patch.brand_name = customClubName
    if (customHeadName && customHeadName !== session?.userName) patch.display_name = customHeadName
    const key = JSON.stringify(patch)
    if (key === '{}' || key === syncedNames.current) return
    syncedNames.current = key
    saveCoachProfile(patch).catch(() => { syncedNames.current = '' })
  }, [realAccount, session?.role, session?.clubName, session?.userName, customClubName, customHeadName])
  const showDemoBanner = isDemo && session?.isDemoShell !== false

  // The avatar takes an override so the sidebar can show whoever is being
  // VIEWED. Without it the switcher changed the banner and the right-hand rail
  // while the profile block in the corner still showed the head coach — the one
  // control you just used to switch, insisting nothing had happened.
  const CoachAvatar = ({ size, src, name }: { size: number; src?: string | null; name?: string }) => {
    const photo = src !== undefined ? src : coachPhoto
    const label = name ?? coachName
    const initials = (label || '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || coachInitials
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: accent.dim, color: accent.hex, display: 'grid', placeItems: 'center', fontSize: size * 0.36, fontWeight: 700 }}>
        {photo
          ? <img src={avatarSrc(photo)} alt={label} width={size} height={size} style={{ width: size, height: size, objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none' }} />
          : initials}
      </div>
    )
  }

  // ─── Which page is open — kept in the address (#payments) ─────────────────
  // It used to live only in memory: a refresh always went back to the
  // Dashboard, a link could not open a page, and the phone's Back button left
  // the app altogether because the browser had nowhere else to go back to.
  // Each move now adds a step to the browser's history, so Back returns to the
  // page before and a refresh stays put.
  const [active, setActiveState] = useState('dashboard')
  const activeRef = useRef('dashboard')
  const goTo = useCallback((id: string, replace = false) => {
    if (id === activeRef.current) return
    activeRef.current = id
    setActiveState(id)
    try {
      const url = id === 'dashboard' ? window.location.pathname + window.location.search : `#${id}`
      if (replace) window.history.replaceState(window.history.state, '', url)
      else window.history.pushState(null, '', url)
    } catch { /* history unavailable — the page still changes */ }
  }, [])
  const setActive = useCallback((id: string) => goTo(id), [goTo])
  useEffect(() => {
    const fromAddress = () => {
      const id = window.location.hash.replace(/^#\/?/, '')
      const next = COACH_SIDEBAR.some(i => i.id === id) ? id : 'dashboard'
      activeRef.current = next
      setActiveState(next)
    }
    fromAddress()
    window.addEventListener('popstate', fromAddress)
    window.addEventListener('hashchange', fromAddress)
    return () => { window.removeEventListener('popstate', fromAddress); window.removeEventListener('hashchange', fromAddress) }
  }, [])
  const [pinned, setPinned] = useState(false)
  const [hovered, setHovered] = useState(false)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const expanded = pinned || hovered

  // ─── Active VIEW ROLE (role switcher) ──────────────────────────────────────
  // Initialised from the demo session (legacy/unknown roles normalise to head);
  // changeRole (below) persists the choice back into the session blob so it
  // survives reload. The active role drives (a) which coachId the data views
  // scope to and (b) which nav items are available.
  // ONE piece of state for "whose portal am I looking at".
  //
  // This was two — `role` and `viewStaffId` — and every bug in the switcher came
  // from something setting one and not the other: Exit left the staff id behind,
  // the demo guard set the role while the id stayed, the nav and the profile card
  // disagreed with the banner above them. Two variables that must always agree
  // are one variable with extra steps.
  //
  // `role` and `viewStaffId` still exist below, derived — so every read in this
  // file keeps working — but nothing can write one without the other.
  // The demo always opens as the head coach: a role remembered from an earlier
  // visit ("coach") names nobody now that the switcher lists real staff.
  const [view, setView] = useState<CoachView>(() => viewFromRole(isDemo ? 'head' : normalizeRole(session?.role)))
  const role: CoachViewRole = view.kind
  const setRole = (r: CoachViewRole) => setView(viewFromRole(r))
  // Is the signed-in user actually the academy owner? Until this resolves we
  // assume they are NOT, so an assistant never sees the head coach's nav flash
  // up before being corrected.
  const [isHeadUser, setIsHeadUser] = useState<boolean | null>(null)
  // Set when somebody is signed in but whoami could not place them.
  const [accessProblem, setAccessProblem] = useState<string | null>(null)
  // The signed-in coach's own record — name, photo, accreditation. The rail used
  // to read these from the head coach's Settings, which is why a coach saw the
  // academy's name and the head's qualification on their own profile card.
  const [myIdentity, setMyIdentity] = useState<CoachIdentity | null>(null)
  const [profileDone, setProfileDone] = useState<boolean | null>(null)
  // The academy's REAL coaches, for the head coach's "Switch view". The switcher
  // used to offer one generic "Coach" that resolved to the demo's Rachel Adeyemi
  // — on a live portal that is a person who does not exist, with a headshot and
  // statistics belonging to nobody.
  const [liveStaff, setLiveStaff] = useState<{ id: string; name: string; qualifications?: string | null; avatar_url?: string | null }[]>([])
  // Derived, never set on its own. Null unless a specific coach is being viewed.
  const viewStaffId = view.kind === 'coach' ? view.staffId : null
  useEffect(() => {
    let alive = true
    dbList('coach_staff').then(rows => {
      if (!alive) return
      setLiveStaff((rows as Record<string, unknown>[])
        .filter(r => !r.is_head)
        .map(r => ({ id: String(r.id), name: String(r.name ?? ''), qualifications: (r.qualifications as string) ?? null, avatar_url: (r.avatar_url as string) ?? null })))
    }).catch(() => {})
    return () => { alive = false }
  }, [])
  const viewStaff = viewStaffId ? liveStaff.find(c => c.id === viewStaffId) ?? null : null

  // That coach's own numbers. Without this the card carried their face and the
  // ACADEMY's totals underneath — a coach with two players appearing to have
  // forty, which is worse than showing nothing.
  const [viewStats, setViewStats] = useState<{ players: number; week: number } | null>(null)
  useEffect(() => {
    if (!viewStaffId) { setViewStats(null); return }
    let alive = true
    ;(async () => {
      const [players, bookings] = await Promise.all([dbList('coach_players'), dbList('coach_bookings')])
      if (!alive) return
      const weekAgo = Date.now() - 7 * 86400000
      setViewStats({
        players: (players as Record<string, unknown>[]).filter(p => p.staff_id === viewStaffId).length,
        week: (bookings as Record<string, unknown>[]).filter(b =>
          b.staff_id === viewStaffId && b.status !== 'cancelled' &&
          b.booking_date && new Date(String(b.booking_date)).getTime() > weekAgo).length,
      })
    })()
    return () => { alive = false }
  }, [viewStaffId])
  useEffect(() => {
    let alive = true
    currentIdentity().then(me => {
      if (!alive) return
      // Only ANONYMOUS falls back to head. "Signed in but we could not work out
      // your access" must never be read as "you own this academy" — that is what
      // showed an invited coach the full admin nav over somebody else's club
      // when their invite had not bound. Row level security meant they could not
      // actually read anything, so every door opened onto an empty room, which
      // is a worse experience than being told plainly.
      const head = me ? me.isHead : identityProblem() === 'anon'
      setIsHeadUser(head)
      setMyIdentity(me)
      // Has this coach been through their own first-run setup? Asked of the
      // server rather than guessed from whether a photo exists, so a coach who
      // deliberately skipped it is not asked again at every sign-in.
      if (me && !me.isHead) {
        fetch('/api/coach/my-profile')
          .then(r => r.ok ? r.json() : null)
          .then(j => { if (alive) setProfileDone(j?.staff ? !!j.staff.profile_complete : true) })
          .catch(() => { if (alive) setProfileDone(true) })
      }
      if (!me) setAccessProblem(identityProblem() === 'anon' ? null : (identityMessage() || 'We could not work out your access to this academy.'))
      // An assistant coach is locked to the coach view. This is presentation
      // only — row level security is what actually stops them reading anything
      // — but a nav full of doors that all open onto empty rooms is its own
      // kind of broken.
      if (!head) setRole('coach')
    })
    return () => { alive = false }
  }, [])
  // Repaint when the coach changes their own photo or details.
  useEffect(() => {
    const onChange = () => { currentIdentity().then(me => { if (me) setMyIdentity(me) }) }
    window.addEventListener(IDENTITY_CHANGED, onChange)
    return () => window.removeEventListener(IDENTITY_CHANGED, onChange)
  }, [])
  // Mirror the previewed coach into the data layer, so "view as Freya" shows
  // Freya's players rather than the whole academy's. Cleared on exit and on
  // unmount — leaving it set would silently hide rows from the head coach.
  useEffect(() => { setPreviewStaff(viewStaffId); return () => setPreviewStaff(null) }, [viewStaffId])
  // Mirror the role's coachId into the module-level scope the data views read.
  useEffect(() => { setScopeCoachId(coachIdForRole(role)); return () => setScopeCoachId(null) }, [role])

  // Cross-device settings. Settings were localStorage-only, so a coach who set the
  // portal up on a desktop saw none of it on the phone they carry onto court. This
  // pulls coach_settings into the local cache on mount (and whenever the tab
  // regains focus) and mirrors every later change back. No-op on the demo portal
  // and when signed out. See _lib/settings-sync.
  useEffect(() => {
    let stop: (() => void) | null = null
    let cancelled = false
    startSettingsSync().then(fn => { if (cancelled) fn(); else stop = fn })
    return () => { cancelled = true; stop?.() }
  }, [])

  // Live menu-visibility: items the coach hid in Settings are filtered out of
  // the sidebar; if the active view gets hidden, fall back to the dashboard.
  const [hiddenMenu, setHiddenMenu] = useState<string[]>([])
  useEffect(() => { setHiddenMenu(getHidden()); return subscribeMenu(() => setHiddenMenu(getHidden())) }, [])
  // Live data stats for the rail (real coach portal only; skipped on demo).
  const liveStats = useCoachStats(true, viewStaffId)
  // Onboarding wizard overlay (real coach portal).
  const [showWizard, setShowWizard] = useState(false)
  // Auto-open the wizard on a real coach's first visit (before onboarding is
  // complete). "Skip for now" is remembered on the account, so it does not come
  // back on every page load; the dashboard's "Set up your academy" button
  // reopens it whenever they are ready. Never fires on the demo portal.
  useEffect(() => {
    if (realAccount && session?.isDemoShell === false && session?.onboardingComplete === false && !session?.setupSkipped) {
      setShowWizard(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // Feature flags (admin/plan) — a disabled feature removes its whole module.
  // New founder (live) portals default to Pro Lite (Racket Progression only);
  // the demo defaults to Elite so it keeps showing Video/Audio + Effort & Rewards.
  // The demo is pinned to Elite with everything on and ignores stored flags
  // entirely — see DEMO_FLAGS. A live portal reads the coach's own plan.
  const featFallback = realAccount ? NEW_ACCOUNT_TIER : 'elite'
  const [feat, setFeat] = useState<FeatureFlags>(realAccount ? getFeatureFlags(featFallback) : DEMO_FLAGS)
  useEffect(() => {
    if (isDemo) { setFeat(DEMO_FLAGS); return }
    const r = () => setFeat(getFeatureFlags(featFallback)); r(); return subscribeFeatures(r)
  }, [featFallback, isDemo])
  const featureHidden = (id: string) =>
    (id === 'gpsheatmaps' && !feat.effort) ||
    (id === 'belts' && !feat.racket) ||
    (id === 'videoaudio' && !feat.video && !feat.audio)
  // Video & Audio module is renamed when only one medium is on (and hidden
  // entirely when both are off, via featureHidden above).
  const navLabel = (item: { id: string; label: string }) => {
    if (item.id !== 'videoaudio') return item.label
    if (feat.video && !feat.audio) return 'Video'
    if (feat.audio && !feat.video) return 'Audio'
    return item.label
  }
  // Fall back to the dashboard if the active view is hidden by the coach OR is
  // unavailable for the current role (e.g. switching to Coach while on Payments).
  useEffect(() => {
    if (active === 'dashboard') return
    // Replaces the step rather than adding one, or Back would land on the page
    // that is not available and be bounced forward again.
    if ((hiddenMenu.includes(active) && !ALWAYS_VISIBLE.includes(active)) || !roleAllowsNav(role, active) || featureHidden(active)) goTo('dashboard', true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hiddenMenu, active, role, feat])
  // Three-pass filter: the role decides availability, feature flags remove whole
  // modules, and the coach's own menu-hiding stays as a layer on top.
  const visibleSidebar = COACH_SIDEBAR.filter(i => roleAllowsNav(role, i.id) && !hiddenMenu.includes(i.id) && !featureHidden(i.id))
  // Nav items the role or feature flags remove — folded into the mobile shell's
  // hidden set so its tabs + More sheet honour them too.
  const roleHiddenIds = COACH_SIDEBAR.filter(i => !roleAllowsNav(role, i.id) || featureHidden(i.id)).map(i => i.id)

  // impersonatedCoach names the coach the Coach role is viewing as, for the
  // "viewing as" banner.
  const impersonatedCoach = role !== 'coach' ? null
    // Whichever real coach was picked in the switcher.
    : (viewStaff?.name ?? null)
  // ─── Right-rail profile follows the ACTIVE role ───────────────────────────
  // The rail used to be hardwired to the head coach, so impersonating Rachel
  // left the page saying "Viewing as Rachel Adeyemi" while the rail still
  // showed Vincent Jones and his headshot. It now resolves through the SAME
  // coachId the data views scope to (role-scope's coachIdForRole), with the
  // per-coach numbers the Staff page already computes (coachStats).
  //
  // DEMO ONLY: COACHES/coachStats are demo data, so a real academy keeps its own
  // head-coach card — a live portal must never render Rachel.
  // Live portal equivalent: the card follows the coach being viewed rather than
  // staying on the head coach, which made "Viewing as Freya" sit above Arron's
  // photo, qualification and numbers.
  const roleLabel = COACH_ROLES.find(r => r.id === role)?.label ?? 'Head Coach'
  // Real coach portal: Head Coach is the only view until data unlocks the others —
  // adding a staff member unlocks Coach; adding a player unlocks Student. The demo
  // keeps all three. Student is additionally opt-in (Settings → Parent & player
  // app, off by default) on both, so it never appears unless the coach asks for it.
  const availableRoles = (COACH_ROLES.filter(r => r.id === 'head' || (r.id === 'coach' && liveStats.staff > 0) || (r.id === 'student' && liveStats.players > 0))
    // The parent & player app is opt-in for a REAL academy (Settings → Parent &
    // player app). The DEMO is not an academy — it exists to show the whole
    // product, and settings live in one localStorage bucket per browser, so
    // opening a live portal first was quietly switching Student off in the demo
    // too. The demo always offers all three.
  ).filter(r => r.id !== 'student' || isDemo || settings.studentApp)
  // If the active role is no longer available (data removed), drop back to Head.
  useEffect(() => {
    if (liveStats.loading) return
    if (role === 'coach' && liveStats.staff === 0) { if (isHeadUser !== false) setRole('head') }
    if (role === 'student' && liveStats.players === 0) { if (isHeadUser !== false) setRole('head') }
  }, [role, liveStats.loading, liveStats.staff, liveStats.players])
  // Turning the player app off while viewing it must not strand the coach there.
  //
  // LIVE PORTALS ONLY. On the demo this fired the instant Student was selected —
  // settings.studentApp is false there, inherited from a live portal through the
  // shared localStorage bucket — so the role was set and snapped straight back to
  // head. From the outside: clicking Student did nothing at all. The demo offers
  // all three views unconditionally (see availableRoles), so the guard that can
  // withdraw one has to be scoped the same way.
  useEffect(() => {
    if (isDemo) return
    if (role === 'student' && !settings.studentApp) { if (isHeadUser !== false) setRole('head') }
  }, [isDemo, role, settings.studentApp])
  // Switching view persists back into the demo session blob — the same key the
  // gate restores from — so the choice survives a reload. (This is what the shared
  // RoleSwitcher used to do before the switcher moved into the profile menu.)
  const changeRole = (roleId: string) => {
    if (isHeadUser === false) return   // an assistant cannot switch out of their own view
    // "coach:<staff id>" — a live portal's switcher names real people, so the id
    // carries WHICH coach as well as which role. normalizeRole only understands
    // the bare role, so split it here rather than teaching it about staff ids.
    const [base, staffId] = roleId.split(':')
    const next = normalizeRole(base)
    setView(next === 'coach' ? { kind: 'coach', staffId: staffId ?? null } : viewFromRole(next))
    const s = getDemoSession('coach')
    if (s) { try { saveDemoSession('coach', { ...s, role: base }) } catch { /* ignore */ } }
  }
  // THE profile control: identity + Switch view + Log out, in one bottom-left
  // block (see CoachProfileMenu). Switch view is offered only to a head coach
  // with somewhere to switch to; while impersonating, the "Viewing as" banner
  // owns the way back. Log out is always there — it's the only way out of a
  // session on a shared club device. isEmpty — a real academy slug — is the
  // live/demo switch for signOutCoach, so it holds whether the coach arrived on
  // a pre-existing Supabase session or by signing in through the gate.
  // isHeadUser === false means a real signed-in assistant coach. They are not
  // impersonating anybody, so there is nothing to switch to and nothing to exit
  // back to — offering "Exit to Head Coach" to someone who is not the head coach
  // is both confusing and a lie about what they can do.
  // On a live portal the "Coach" entry becomes one entry PER REAL COACH, named.
  // "Switch to Coach" is meaningless in an academy with four of them, and it was
  // the reason the generic entry had to resolve to a hardcoded demo person.
  const switchableRoles = isHeadUser === false ? undefined
    : (() => {
          const head = availableRoles.find(r => r.id === 'head')
          const student = availableRoles.find(r => r.id === 'student')
          const coaches = liveStaff.map(c => ({ id: `coach:${c.id}`, label: c.name, icon: '🧑‍🏫', description: [c.qualifications, 'their players & sessions'].filter(Boolean).join(' — ') }))
          const list = [...(head ? [head] : []), ...coaches, ...(student ? [student] : [])]
          return list.length > 1 ? list : undefined
        })()
  // Who the profile block is showing RIGHT NOW. Follows the switcher on a live
  // portal (viewStaff), the impersonated demo coach otherwise, and falls back to
  // the signed-in person.
  const shownName = viewStaff?.name || coachName
  const shownRole = viewStaff ? (viewStaff.qualifications || 'Coach') : roleLabel
  const shownPhoto = viewStaff ? (viewStaff.avatar_url ?? null) : coachPhoto

  // A coach who belongs to more than one academy: each academy is its own
  // portal at its own address, so switching is a link to the other address.
  // Before this there was no way across at all — the portal opened on whichever
  // academy they had joined last, whatever address they typed.
  const otherAcademies = (myIdentity?.academies ?? []).length > 1
    ? (myIdentity?.academies ?? []).map(a => ({ label: a.name || a.slug, note: a.isHead ? 'Head coach' : 'Coach', href: `/tennis/coach/${a.slug}`, current: a.current }))
    : undefined

  const profileMenu = (variant: 'sidebar' | 'compact', avatarSize: number) => (
    <CoachProfileMenu
      T={T} accent={accent} variant={variant} expanded={expanded}
      academies={otherAcademies}
      avatar={<CoachAvatar size={avatarSize} src={shownPhoto} name={shownName} />}
      coachName={shownName} roleLabel={shownRole}
      roles={switchableRoles}
      activeRole={role === 'coach' && viewStaffId ? `coach:${viewStaffId}` : role}
      onSelectRole={changeRole}
      onLogout={() => { void signOutCoach(realAccount) }}
      logoutLabel={realAccount ? 'Log out' : 'Exit demo'}
    />
  )
  // Shown only when the ACADEMY OWNER is looking through somebody else's eyes.
  // isHeadUser starts null while whoami resolves, and null is not true, so the
  // banner stays hidden until we know — no orange flash for a real coach.
  const ViewingAsBanner = (isHeadUser !== true || role === 'head') ? null : (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 24px', fontSize: 12, fontWeight: 600, background: 'rgba(245,158,11,0.14)', color: '#B45309', borderBottom: '1px solid rgba(245,158,11,0.3)', flexShrink: 0 }}>
      <span style={{ fontSize: 13 }}>👁</span>
      <span>Viewing as {roleLabel}{impersonatedCoach ? ` — ${impersonatedCoach}` : ''}</span>
      {/* changeRole, not setRole. setRole changed the ROLE and left viewStaffId
          pointing at the coach — so the nav, the data scope and the profile block
          all stayed on them while the banner claimed you were back. Exit has to be
          the exact inverse of the switch that got you here. */}
      <button onClick={() => changeRole('head')} style={{ marginLeft: 'auto', appearance: 'none', border: '1px solid rgba(245,158,11,0.5)', background: 'transparent', color: '#B45309', borderRadius: 7, padding: '3px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Exit to Head Coach</button>
    </div>
  )

  useEffect(() => {
    try { setPinned(localStorage.getItem('lumio_coach_sidebar_pinned') === 'true') } catch {}
  }, [])
  const togglePin = () => setPinned(p => { const n = !p; try { localStorage.setItem('lumio_coach_sidebar_pinned', String(n)) } catch {} ; return n })
  const onEnter = () => { if (leaveTimer.current) { clearTimeout(leaveTimer.current); leaveTimer.current = null } ; setHovered(true) }
  const onLeave = () => { leaveTimer.current = setTimeout(() => setHovered(false), 350) }

  // ─── Data that could not be loaded ────────────────────────────────────────
  // A failed read used to look exactly like an empty account: "No players yet"
  // for a coach with forty, "Welcome to Lumio" on the dashboard. The data layer
  // now says which reads failed; the page says so and offers to try again.
  const [failed, setFailed] = useState<CoachTable[]>([])
  const [retrying, setRetrying] = useState(false)
  useEffect(() => {
    const sync = () => setFailed(failedTables())
    sync()
    window.addEventListener(LOAD_FAILED, sync)
    return () => window.removeEventListener(LOAD_FAILED, sync)
  }, [])
  const retryLoad = async () => {
    if (retrying) return
    setRetrying(true)
    const again = failedTables()
    for (const t of again) invalidateCoachTable(t)
    try { await prefetchCoachTables(again) } finally { setRetrying(false); setFailed(failedTables()) }
  }
  const renderView = () => {
    const tables = LIVE_MODULE_TABLES[active] ?? (active === 'dashboard' ? DASHBOARD_TABLES : [])
    const down = tables.filter(t => failed.includes(t))
    // Nothing of this page's data has ever arrived: show that, not an empty page.
    if (down.some(t => cachedRows(t) === undefined)) {
      return (
        <div role="alert" style={{ maxWidth: 460, margin: '64px auto', textAlign: 'center', background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 28 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>We couldn&rsquo;t load this page</div>
          <p style={{ fontSize: 13, color: T.text2, lineHeight: 1.6, margin: '8px 0 18px' }}>Your data is safe — it just didn&rsquo;t reach this device. Check your connection, then try again.</p>
          <button onClick={() => { void retryLoad() }} disabled={retrying}
            style={{ appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: retrying ? 'default' : 'pointer', opacity: retrying ? 0.6 : 1 }}>
            {retrying ? 'Trying again…' : 'Try again'}
          </button>
        </div>
      )
    }
    const view = renderLiveModule()
    return (
      <>
        {/* Loaded earlier, but the latest refresh failed: keep the page (and
            anything half-typed in it) and say it may be out of date. */}
        {down.length > 0 && (
          <div role="status" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12, padding: '9px 12px', borderRadius: 10, fontSize: 12.5, background: 'rgba(245,158,11,0.14)', color: T.text, border: '1px solid rgba(245,158,11,0.35)' }}>
            <span style={{ flex: 1, minWidth: 180 }}>We couldn&rsquo;t refresh this page, so it may be out of date. Check your connection.</span>
            <button onClick={() => { void retryLoad() }} disabled={retrying} style={{ appearance: 'none', border: '1px solid rgba(245,158,11,0.5)', background: 'transparent', color: T.text, borderRadius: 7, padding: '4px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{retrying ? 'Trying again…' : 'Try again'}</button>
          </div>
        )}
        {LIVE_MODULE_TABLES[active] ? <ModuleGate key={active} T={T} tables={LIVE_MODULE_TABLES[active]}>{view}</ModuleGate> : view}
      </>
    )
  }
  const renderLiveModule = () => {
    {
      // Live, persisted data modules for a real coach's portal (Supabase-backed).
      switch (active) {
        case 'roster':   return <LiveRoster T={T} accent={accent} density={density} />
        case 'staff':    return <LiveStaff T={T} accent={accent} density={density} />
        case 'calendar': return <LiveBookingCalendar T={T} accent={accent} onNavigate={setActive} />
        case 'belts':       return <LiveRacketProgression T={T} accent={accent} />
        case 'lessons':     return <LiveLessons T={T} accent={accent} />
        case 'camps':       return <LiveCamps T={T} accent={accent} />
        case 'payments':    return <LivePayments T={T} accent={accent} />
        case 'gpsheatmaps': return <LiveEffortRewards T={T} accent={accent} density={density} />
        case 'videoaudio':  return <LiveVideoAudio T={T} accent={accent} videoOn={feat.video} audioOn={feat.audio} />
        case 'planner':     return <LiveSessionPlanner T={T} accent={accent} density={density} onNavigate={setActive} />
        case 'venues':      return <LiveCourtPlanner T={T} accent={accent} onNavigate={setActive} />
        case 'development': return <LiveDevelopment T={T} accent={accent} />
        case 'equipment':   return <LiveEquipment T={T} accent={accent} />
        case 'resources':   return <LiveResources T={T} accent={accent} density={density} asCoach={isHeadUser === false || !!viewStaffId} />
        case 'messages':    return <LiveMessages T={T} accent={accent} onConfigure={() => setActive('settings')} />
        // viewStaffId as well as isHeadUser: the head coach previewing a coach must
        // see the COACH's settings, not their own academy page with a coach's name
        // on the banner above it.
        case 'settings':    if (isHeadUser === false || viewStaffId) return <CoachSettings T={T} accent={accent} onNavigate={setActive} />
                            return (
          <>
            <SettingsView T={T} accent={accent} density={density} demo={isDemo} />
          </>
        )
        case 'dashboard':   return <LiveCoachDashboard T={T} accent={accent} density={density} clubName={clubName} onNavigate={setActive} onStartWizard={() => { if (realAccount) setShowWizard(true) }}
          canNavigate={id => visibleSidebar.some(i => i.id === id)}
          asCoach={viewStaff ? { name: viewStaff.name, profileDone: true, staffId: viewStaff.id }
            : isHeadUser === false ? { name: myIdentity?.displayName || coachName, profileDone: profileDone !== false, staffId: myIdentity?.staffId ?? null }
            : null} />
      }
      const activeItem = COACH_SIDEBAR.find(i => i.id === active)
      const title = (activeItem ? navLabel(activeItem) : null) ?? 'This section'
      return <EmptyModule T={T} accent={accent} density={density} title={title} onNavigate={setActive} />
    }
  }
  const responsiveStyle = `.tnum{font-variant-numeric:tabular-nums}
    @media (max-width: 1100px){ .coach-rail{ display:none !important } }
    @media (max-width: 768px){
      .cm-12{ grid-template-columns:minmax(0,1fr) !important }
      .cm-md{ grid-template-columns:minmax(0,1fr) !important }
      .cm-2{ grid-template-columns:minmax(0,1fr) !important }
      .cm-3{ grid-template-columns:minmax(0,1fr) !important }
      .cm-12 > *, .cm-md > *, .cm-2 > *, .cm-3 > *{ grid-column:auto !important }
    }`

  // ─── One page, whichever layout is showing ────────────────────────────────
  // The phone layout and the desktop layout are different trees, so crossing
  // the breakpoint — rotating a tablet, dragging a window narrower — rebuilt
  // the open page from scratch: a half-filled booking form vanished and the
  // calendar jumped back to this week. The page is now drawn once into its own
  // box, and each layout just says where that box goes.
  const moduleHost = useMemo(() => {
    if (typeof document === 'undefined') return null
    const el = document.createElement('div')
    el.style.display = 'contents'   // adds nothing to the layout around the page
    return el
  }, [])
  const modulePortal = moduleHost ? createPortal(renderView(), moduleHost) : null
  const moduleSlot = moduleHost ? <ModuleSlot host={moduleHost} /> : renderView()

  // ─── Student role — the player/parent view (Phase 2) ──────────────────────
  // Swaps the whole dashboard for the purpose-built StudentView (defaults to
  // Mia Chen; its own picker switches child). The Phase-1 "viewing as" banner
  // stays so a head coach can exit back to their own portal.
  // Onboarding wizard overlay — rendered above whichever shell is active.
  // It sits at the SAME place in the phone and the desktop layout below (second
  // in the list, straight after the page). When it sat in two different places,
  // crossing 768px — turning a phone on its side — rebuilt it from scratch and
  // everything typed so far was gone.
  const wizard = showWizard ? (
    <CoachOnboardingWizard
      key="wizard"
      defaultName={session?.userName || ''}
      defaultAcademy={session?.clubName || slugClubName || ''}
      defaultEmail={session?.email || ''}
      onClose={() => setShowWizard(false)}
      onDone={() => { if (typeof window !== 'undefined') window.location.reload() }}
    />
  ) : null

  // Over everything, the wizard included: nothing on this page will save.
  const tabLostNotice = tabLost ? (
    <div key="tab-lost" role="alertdialog" aria-modal="true" aria-label="Signed out in this tab"
      style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(4,6,12,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-geist-sans, system-ui)' }}>
      <div style={{ maxWidth: 420, width: '100%', background: T.panel, border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, textAlign: 'center' }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: T.text, lineHeight: 1.5, margin: '0 0 18px' }}>{TAB_LOST_MESSAGE}</p>
        <button onClick={() => window.location.reload()}
          style={{ appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 10, padding: '11px 22px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          Reload
        </button>
      </div>
    </div>
  ) : null

  if (role === 'student') {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: 'var(--font-geist-sans, system-ui)', display: 'flex', flexDirection: 'column' }}>
        {tabLostNotice}
        {ViewingAsBanner}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ maxWidth: 1080, margin: '0 auto', padding: isMobile ? '14px 12px 36px' : '24px 24px 44px' }}>
            {/* The page a real family gets, read from this academy's own data. */}
            <LiveStudentPreview T={T} accent={accent} density={density} onNavigate={id => { setRole('head'); setActive(id) }} />
          </div>
        </div>
      </div>
    )
  }

  // ─── Mobile shell ─────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        {modulePortal}
        {wizard}
        {tabLostNotice}
        <CoachMobileShell
          T={T} accent={accent} active={active} onNavigate={setActive} navLabel={navLabel}
          showDemoBanner={showDemoBanner} hiddenMenu={[...hiddenMenu, ...roleHiddenIds]}
          avatar={profileMenu('compact', 30)}
          roleBanner={ViewingAsBanner}
          barCovered={showWizard}
        >
          {moduleSlot}
        </CoachMobileShell>
      </>
    )
  }

  // ─── Desktop shell ────────────────────────────────────────────────────────
  return (
    <>
    {modulePortal}
    {wizard}
    {tabLostNotice}
    <div style={{ minHeight: '100vh', display: 'flex', background: T.bg, color: T.text, fontFamily: 'var(--font-geist-sans, system-ui)' }}>
      <style>{responsiveStyle}</style>
      {/* The installed-app plumbing (offline page, update prompt, install card)
          for tablets and a phone held sideways, which get this wide layout. The
          phone layout renders its own inside CoachMobileShell. */}
      <CoachPwaInstaller T={T} accent={accent} />

      {/* sidebar */}
      <aside
        onMouseEnter={onEnter} onMouseLeave={onLeave}
        style={{
          width: expanded ? 'fit-content' : 72, minWidth: expanded ? 200 : 72, maxWidth: 230,
          background: sideBg, borderRight: `1px solid ${line}`,
          transition: 'min-width 250ms ease, width 250ms ease',
          position: 'sticky', top: 0, height: '100vh', flexShrink: 0, zIndex: 40,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', borderBottom: `1px solid ${line}`, minHeight: 56, padding: expanded ? '12px 12px' : '12px 4px', gap: expanded ? 8 : 0, justifyContent: expanded ? 'flex-start' : 'center' }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, display: 'grid', placeItems: 'center', background: accent.dim, border: `1px solid ${accent.border}`, flexShrink: 0, overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={isDemo ? '/tennis_coach_logo.png' : (settings.brandLogo || session?.logoDataUrl || '/tennis_transparent_logo.png')} alt={clubName || 'Lumio'} style={{ width: 26, height: 26, objectFit: 'contain' }} />
          </div>
          {expanded && (
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: T.text, whiteSpace: 'nowrap' }}>{clubName || 'Lumio Coach'}</div>
              <div style={{ fontSize: 9.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>Tennis</div>
            </div>
          )}
          {expanded && (
            <button onClick={togglePin} title={pinned ? 'Unpin' : 'Pin open'} style={{ marginLeft: 'auto', background: 'transparent', border: 0, cursor: 'pointer', color: pinned ? accent.hex : '#4B5563', padding: 2, transform: pinned ? 'none' : 'rotate(45deg)', transition: 'transform .2s, color .2s' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 17v5" /><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1z" /></svg>
            </button>
          )}
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', padding: '4px 6px' }}>
          {COACH_GROUPS.map(group => {
            const items = visibleSidebar.filter(i => i.group === group)
            if (!items.length) return null
            return (
              <div key={group} style={{ marginBottom: 2 }}>
                {expanded && <div style={{ fontSize: 9, fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.12em', padding: '0 8px', marginTop: 10, marginBottom: 3 }}>{group}</div>}
                {items.map(item => {
                  const on = active === item.id
                  return (
                    <button key={item.id} onClick={() => { setActive(item.id); if (!pinned) setHovered(false) }} title={expanded ? undefined : navLabel(item)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 9, textAlign: 'left',
                        background: on ? accent.dim : 'transparent',
                        color: on ? accent.hex : T.text3,
                        border: 0, borderLeftWidth: 2, borderLeftStyle: 'solid', borderLeftColor: on ? accent.hex : 'transparent',
                        borderRadius: 7, padding: expanded ? '6px 10px' : '6px 0', justifyContent: expanded ? 'flex-start' : 'center',
                        fontSize: 12, cursor: 'pointer', marginBottom: 1,
                      }}>
                      <Icon name={item.icon} size={16} stroke={1.7} />
                      {expanded && <span style={{ fontWeight: on ? 600 : 500, whiteSpace: 'nowrap', flex: 1 }}>{navLabel(item)}</span>}
                      {expanded && item.badge && <span style={{ fontSize: 8.5, fontWeight: 700, color: accent.hex, background: accent.dim, padding: '1px 5px', borderRadius: 4, letterSpacing: '0.05em' }}>{item.badge}</span>}
                      {realAccount && item.id === 'messages' && <MessagesUnreadBadge accent={accent} expanded={expanded} btnText={T.btnText} />}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </nav>

        {/* THE profile block — one control carrying Switch view AND Log out.
            There used to be a second one below it (the shared RoleSwitcher),
            which read as two people signed in at once. Overflow must stay
            visible on this row or the pop-up menu is clipped by the sidebar. */}
        <div style={{ borderTop: `1px solid ${line}`, padding: expanded ? '10px 12px' : '10px 4px', display: 'flex', alignItems: 'center', justifyContent: expanded ? 'flex-start' : 'center', overflow: 'visible' }}>
          {profileMenu('sidebar', 30)}
        </div>
      </aside>

      {/* main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: '100vh' }}>
        {ViewingAsBanner}
        {/* First sign-in: a coach sets up their own photo, accreditation and DBS.
            Shown once — profile_complete records that they have seen it, so a
            coach with no DBS yet is not asked again every time they sign in. */}
        {isHeadUser === false && profileDone === false && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,6,12,0.86)', zIndex: 9998, overflowY: 'auto', display: 'flex', justifyContent: 'center', padding: '6vh 16px 40px' }}>
            <div style={{ width: '100%', maxWidth: 680, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 18, padding: 30, height: 'fit-content' }}>
              <CoachMyProfile T={T} accent={accent} mode="wizard" onDone={() => setProfileDone(true)} />
            </div>
          </div>
        )}
        {accessProblem && (
          // Said plainly, and it names the person who can fix it. The alternative
          // was an apparently-working portal with nothing in it, which reads as
          // "the product is broken" rather than "your invite needs finishing".
          <div style={{ padding: '10px 24px', fontSize: 12.5, fontWeight: 500, background: '#7C2D12', color: '#FED7AA', flexShrink: 0, lineHeight: 1.6 }}>
            <strong>We couldn&rsquo;t work out your access.</strong> {accessProblem} Ask your head coach to re-send your invite, then sign in again.
          </div>
        )}
        {showDemoBanner && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 24px', fontSize: 12, fontWeight: 500, background: accent.hex, color: '#fff', flexShrink: 0 }}>
            <span>This is a demo · sample data</span>
            <span style={{ opacity: 0.85 }}>Lumio Coach — Tennis</span>
          </div>
        )}

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: 24, position: 'relative' }}>
            {/* ── How this page works ─────────────────────────────────────────
                One mount rather than seventeen: every module gets the same ⓘ and
                a page added later gets it for free. It finds the page's own
                heading and sits beside the last word of it — retro-fitting a
                button into seventeen different headers is how you end up with it
                in seventeen different places, and behind "Add booking" on three
                of them. */}
            {settings.helpHints !== false && (
              <ModuleHelpButton key={active} T={T} accent={accent} moduleId={active}
                label={(() => { const it = COACH_SIDEBAR.find(i => i.id === active); return it ? navLabel(it) : 'This page' })()} />
            )}
            {moduleSlot}
          </div>

          {/* right rail */}
          <div className="coach-rail" style={{ width: 264, flexShrink: 0, borderLeft: `1px solid ${line}`, padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Profile card — the impersonated coach when a role is being viewed,
                otherwise the account's own head coach (see railCoach above). */}
            <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, textAlign: 'center' }}>
              <div style={{ width: 72, margin: '0 auto' }}>
                {viewStaff
                  ? (viewStaff.avatar_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={avatarSrc(viewStaff.avatar_url)} alt={viewStaff.name} width={72} height={72} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }} />
                      : <div style={{ width: 72, height: 72, borderRadius: '50%', background: accent.dim, color: accent.hex, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700 }}>
                          {viewStaff.name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('')}
                        </div>)
                  : myIdentity && !myIdentity.isHead && myIdentity.avatarUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={avatarSrc(myIdentity.avatarUrl)} alt={myIdentity.displayName || ''} width={72} height={72} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }} />
                  : <CoachAvatar size={72} />}
              </div>
              {(() => {
                // A signed-in coach is neither the demo's impersonated coach nor
                // the head coach whose name and cert live in Settings — they are
                // a third case, and without it their own card showed the club's
                // name and the head coach's qualification.
                const asCoach = myIdentity && !myIdentity.isHead ? myIdentity : null
                // viewStaff wins: the head coach has explicitly asked to look
                // through this person's eyes, so the card must be theirs.
                const name = viewStaff ? viewStaff.name : asCoach ? (asCoach.displayName || coachName) : coachName
                const cert = viewStaff ? viewStaff.qualifications : asCoach ? asCoach.accreditation : settings.cert
                return (
                  <>
                    <div style={{ fontSize: 16, fontWeight: 600, color: T.text, marginTop: 10 }}>{name}</div>
                    {cert && <div style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>{cert}</div>}
                    {asCoach && myIdentity?.brandName && <div style={{ fontSize: 10.5, color: T.text3, marginTop: 4, opacity: 0.8 }}>{myIdentity.brandName}</div>}
                  </>
                )
              })()}
              <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
                {viewStats ? (
                  <>
                    <RailStat T={T} label="Players" value={viewStats.players} />
                    <RailStat T={T} label="Lessons/wk" value={viewStats.week} />
                    {/* No "Retention" tile: nothing works it out, so it only
                        ever showed a dash. */}
                  </>
                ) : (
                  <>
                    <RailStat T={T} label="Players" value={liveStats.players} />
                    <RailStat T={T} label="Lessons/wk" value={liveStats.lessonsThisWeek} />
                  </>
                )}
              </div>
            </div>

            {/* Racket distribution — live counts for the real portal, demo counts otherwise */}
            {feat.racket && (() => {
              const dist = RACKET_STAGES.map((st, i) => ({ id: st.id, name: st.name, colour: st.colour, count: liveStats.racketCounts[i] || 0 }))
              const shown = dist.filter(r => r.count > 0)
              if (!shown.length) return null
              return (
                <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16 }}>
                  <div style={{ fontSize: 10.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 10 }}>Racket distribution</div>
                  {shown.map(r => (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                      <span style={{ width: 16, height: 10, borderRadius: 2, background: r.colour, border: '1px solid rgba(128,128,128,0.4)' }} />
                      <span style={{ fontSize: 11, color: T.text2, flex: 1 }}>{r.name}</span>
                      <span className="tnum" style={{ fontSize: 11, color: T.text, fontWeight: 600 }}>{r.count}</span>
                    </div>
                  ))}
                </div>
              )
            })()}

            {/* This week — combines the demo's totals with the dashboard's summary items */}
            <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 10.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 8 }}>This week · Mon–Sun</div>
              {([['Sessions today', String(liveStats.sessionsToday)], ['Lessons this week', String(liveStats.lessonsThisWeek)],
                   feat.racket ? ['Rackets ready', String(liveStats.racketsReady)] : ['Needs a summary', String(liveStats.summariesDue)],
                   ['New players', `+${liveStats.newPlayers}`], ['Outstanding', formatPounds(liveStats.outstandingPayments)]] as [string, string][]
              ).map(([k, v], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, padding: '3px 0' }}>
                  <span style={{ color: T.text3 }}>{k}</span><span style={{ color: T.text, fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

function RailStat({ T, label, value }: { T: typeof THEMES.dark; label: string; value: string | number }) {
  return (
    <div>
      <div className="tnum" style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{value}</div>
      <div style={{ fontSize: 8.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
    </div>
  )
}
