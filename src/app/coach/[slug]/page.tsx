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

import { useState, useRef, useEffect, use } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { SportsDemoGate, type SportsDemoSession } from '@/components/sports-demo'
import { useIsMobile } from '@/hooks/useIsMobile'
import { THEMES, DENSITY } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import {
  COACH_ORG, COACH_SIDEBAR, COACH_GROUPS, PLAYERS, BELTS, COACH_PHOTO,
} from './_lib/coach-data'
import { useCoachSettings } from './_lib/use-settings'
import { ACCENT_PRESETS } from './_lib/settings-store'
import { getHidden, subscribe as subscribeMenu, ALWAYS_VISIBLE } from './_lib/menu-visibility'
import RoleSwitcher from '@/components/sports-demo/RoleSwitcher'
import {
  normalizeRole, coachIdForRole, roleAllowsNav, setScopeCoachId, type CoachViewRole,
} from './_lib/role-scope'
import { coachById } from './_lib/coaches-data'
import { StudentView } from './_components/StudentView'
import {
  DashboardView, LessonsView, DevelopmentView, BeltsView, CalendarView,
  RosterView, MessagesView, ResourcesView, PaymentsView, SettingsView, CampsView,
} from './_components/CoachModules'
import { SessionPlannerView } from './_components/SessionPlanner'
import { CourtPlannerView } from './_components/CourtPlanner'
import { EquipmentView } from './_components/Equipment'
import { VideoAudioView } from './_components/CoachVideoAudio'
import { HeatmapsView } from './_components/CoachHeatmaps'
import { StaffView } from './_components/StaffView'
import { CoachMobileShell } from './_components/CoachMobileShell'
import { EmptyModule } from './_components/EmptyCoachDashboard'
import { LiveCoachDashboard } from './_components/LiveCoachDashboard'
import { LiveMessages } from './_components/LiveMessages'
import { CoachOnboardingWizard } from './_components/CoachOnboardingWizard'
import { CoachContactSettings } from './_components/CoachContactSettings'
import { CoachImport } from './_components/CoachImport'
import { CoachCompliance } from './_components/CoachCompliance'
import { LiveRoster } from './_components/LiveRoster'
import { LiveSessionPlanner } from './_components/LiveSessionPlanner'
import { LiveLessons } from './_components/LiveLessons'
import { LiveBookingCalendar } from './_components/LiveBookingCalendar'
import { LiveRacketProgression } from './_components/LiveRacketProgression'
import { LiveDevelopment } from './_components/LiveDevelopment'
import { CoachDevelopmentSettings } from './_components/CoachDevelopmentSettings'
import { CoachGpsVideo } from './_components/CoachGpsVideo'
import { LiveEffortRewards } from './_components/LiveEffortRewards'
import { LiveStaff } from './_components/LiveStaff'
import {
  LiveModule,
  CAMPS_CONFIG, PAYMENTS_CONFIG,
  COURTS_CONFIG, EQUIPMENT_CONFIG, RESOURCES_CONFIG,
} from './_components/LiveModules'
import { useCoachStats } from './_lib/coach-db'
import { getFlags as getFeatureFlags, subscribe as subscribeFeatures, tierForFlags, TIERS, type FeatureFlags } from './_lib/feature-flags'

// The three view roles for the role switcher. Head + Coach are the same portal
// filtered by permission; Student is a purpose-built player/parent view (a
// placeholder this phase — built in Phase 2).
const COACH_ROLES = [
  { id: 'head',    label: 'Head Coach', icon: '🎾',   description: 'Head Coach — full academy access' },
  { id: 'coach',   label: 'Coach',      icon: '🧑‍🏫', description: 'Coach — your players & sessions' },
  { id: 'student', label: 'Student',    icon: '🎓',   description: 'Student — player & parent view' },
]

// Known demo slug(s) keep the full sample-data portal. Any other slug is a
// brand-new academy → render the EMPTY onboarding portal (mirrors Women's FC).
const DEMO_SLUGS = new Set(['demo'])

function clubNameFromSlug(slug: string): string {
  return slug.split('-').filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Your Academy'
}

// ─── Page entry: auth check → demo gate → portal ────────────────────────────
export default function CoachPortalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const isEmpty = !DEMO_SLUGS.has(slug)
  const slugClubName = clubNameFromSlug(slug)
  const [authChecked, setAuthChecked] = useState(false)
  const [authSession, setAuthSession] = useState<SportsDemoSession | null>(null)

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) { setAuthChecked(true); return }
    const supabase = createBrowserClient(url, key)
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('sports_profiles')
            .select('sport, display_name, nickname, avatar_url, brand_name, brand_logo_url, enabled_features, onboarding_complete')
            .eq('id', user.id)
            .maybeSingle()
          // Only adopt the signed-in session for a coach profile, so we never
          // hijack a player's tennis session. Anyone else falls through to the
          // public demo gate below.
          if (profile && profile.sport === 'coach') {
            setAuthSession({
              email: user.email ?? '',
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
            })
          }
        }
      } catch { /* fall through to demo gate */ } finally {
        setAuthChecked(true)
      }
    })()
  }, [])

  if (!authChecked) return (
    <div style={{ minHeight: '100vh', background: '#07080F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 11, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Loading…</div>
    </div>
  )

  if (authSession) return <CoachPortalInner session={authSession} isEmpty={isEmpty} slugClubName={slugClubName} />

  return (
    <SportsDemoGate
      sport="coach"
      defaultClubName="Lumio Tennis Coach"
      accentColor="#3A8EE0"
      accentColorLight="#7db3ea"
      sportEmoji="🎾"
      sportLabel="Lumio Tennis Coach"
      roles={COACH_ROLES}
    >
      {(session) => <CoachPortalInner session={session} isEmpty={isEmpty} slugClubName={slugClubName} />}
    </SportsDemoGate>
  )
}

// ─── Portal shell ───────────────────────────────────────────────────────────
function CoachPortalInner({ session, isEmpty = false, slugClubName }: { session?: SportsDemoSession; isEmpty?: boolean; slugClubName?: string }) {
  const settings = useCoachSettings()
  const T = THEMES[settings.theme]
  const accent = ACCENT_PRESETS[settings.accentKey]
  const density = DENSITY[settings.density]
  const sideBg = T.isDark ? '#0a0c14' : T.panel2
  const line = T.border
  const isMobile = useIsMobile()

  // Empty (brand-new) portals must show NO demo data — no demo coach photo,
  // name or credential. Only the account's own real values (or blanks) appear
  // until they connect their data.
  const coachName = session?.userName || (isEmpty ? (slugClubName || '') : settings.coach)
  const coachInitials = coachName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const coachPhoto = session?.photoDataUrl || (isEmpty ? null : COACH_PHOTO)
  const clubName = session?.clubName || slugClubName || (isEmpty ? '' : settings.academy)
  const showDemoBanner = !isEmpty && session?.isDemoShell !== false

  const CoachAvatar = ({ size }: { size: number }) => (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: accent.dim, color: accent.hex, display: 'grid', placeItems: 'center', fontSize: size * 0.36, fontWeight: 700 }}>
      {coachPhoto
        ? <img src={coachPhoto} alt={coachName} width={size} height={size} style={{ width: size, height: size, objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none' }} />
        : coachInitials}
    </div>
  )

  const [active, setActive] = useState('dashboard')
  const [pinned, setPinned] = useState(false)
  const [hovered, setHovered] = useState(false)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const expanded = pinned || hovered

  // ─── Active VIEW ROLE (role switcher) ──────────────────────────────────────
  // Initialised from the demo session (legacy/unknown roles normalise to head);
  // RoleSwitcher persists the choice back into the session blob so it survives
  // reload. The active role drives (a) which coachId the data views scope to and
  // (b) which nav items are available.
  const [role, setRole] = useState<CoachViewRole>(normalizeRole(session?.role))
  // Mirror the role's coachId into the module-level scope the data views read.
  useEffect(() => { setScopeCoachId(coachIdForRole(role)); return () => setScopeCoachId(null) }, [role])

  // Live menu-visibility: items the coach hid in Settings are filtered out of
  // the sidebar; if the active view gets hidden, fall back to the dashboard.
  const [hiddenMenu, setHiddenMenu] = useState<string[]>([])
  useEffect(() => { setHiddenMenu(getHidden()); return subscribeMenu(() => setHiddenMenu(getHidden())) }, [])
  // Live data stats for the rail (real coach portal only; skipped on demo).
  const liveStats = useCoachStats(isEmpty)
  // Onboarding wizard overlay (real coach portal).
  const [showWizard, setShowWizard] = useState(false)
  // Auto-open the wizard on a real coach's first visit (before onboarding is
  // complete). Skipping it just closes for now; it reopens next visit until
  // finished. Never fires on the demo portal.
  useEffect(() => {
    if (isEmpty && session?.isDemoShell === false && session?.onboardingComplete === false) {
      setShowWizard(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // Feature flags (admin/plan) — a disabled feature removes its whole module.
  // New founder (live) portals default to Pro Lite (Racket Progression only);
  // the demo defaults to Elite so it keeps showing Video/Audio + Effort & Rewards.
  const featFallback = isEmpty ? 'prolite' : 'elite'
  const [feat, setFeat] = useState<FeatureFlags>(getFeatureFlags(featFallback))
  useEffect(() => { const r = () => setFeat(getFeatureFlags(featFallback)); r(); return subscribeFeatures(r) }, [featFallback])
  const featureHidden = (id: string) =>
    (id === 'gpsheatmaps' && !feat.effort) ||
    (id === 'belts' && !feat.racket) ||
    (id === 'videoaudio' && !feat.video && !feat.audio)
  const planTier = TIERS.find(t => t.key === tierForFlags(feat))
  // Fall back to the dashboard if the active view is hidden by the coach OR is
  // unavailable for the current role (e.g. switching to Coach while on Payments).
  useEffect(() => {
    if (active === 'dashboard') return
    if ((hiddenMenu.includes(active) && !ALWAYS_VISIBLE.includes(active)) || !roleAllowsNav(role, active) || featureHidden(active)) setActive('dashboard')
  }, [hiddenMenu, active, role, feat])
  // Three-pass filter: the role decides availability, feature flags remove whole
  // modules, and the coach's own menu-hiding stays as a layer on top.
  const visibleSidebar = COACH_SIDEBAR.filter(i => roleAllowsNav(role, i.id) && !hiddenMenu.includes(i.id) && !featureHidden(i.id))
  // Nav items the role or feature flags remove — folded into the mobile shell's
  // hidden set so its tabs + More sheet honour them too.
  const roleHiddenIds = COACH_SIDEBAR.filter(i => !roleAllowsNav(role, i.id) || featureHidden(i.id)).map(i => i.id)

  // Banner / switcher context. The role switcher reuses the shared component;
  // we hand it a session whose role mirrors live state so its "current view"
  // marker tracks the switch. impersonatedCoach names the coach the Coach role
  // is viewing as, for the "viewing as" banner.
  const switcherSession = session ? { ...session, role } : null
  const impersonatedCoach = role === 'coach' ? (coachById(coachIdForRole(role) ?? '')?.name ?? null) : null
  const roleLabel = COACH_ROLES.find(r => r.id === role)?.label ?? 'Head Coach'
  // Real coach portal: Head Coach is the only view until data unlocks the others —
  // adding a staff member unlocks Coach; adding a player unlocks Student. The demo
  // keeps all three.
  const availableRoles = isEmpty
    ? COACH_ROLES.filter(r => r.id === 'head' || (r.id === 'coach' && liveStats.staff > 0) || (r.id === 'student' && liveStats.players > 0))
    : COACH_ROLES
  // If the active role is no longer available (data removed), drop back to Head.
  useEffect(() => {
    if (!isEmpty || liveStats.loading) return
    if (role === 'coach' && liveStats.staff === 0) setRole('head')
    if (role === 'student' && liveStats.players === 0) setRole('head')
  }, [isEmpty, role, liveStats.loading, liveStats.staff, liveStats.players])
  const roleSwitcher = switcherSession ? (
    <RoleSwitcher session={switcherSession} roles={availableRoles} accentColor={accent.hex} onRoleChange={r => setRole(normalizeRole(r))} />
  ) : null
  const ViewingAsBanner = role === 'head' ? null : (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 24px', fontSize: 12, fontWeight: 600, background: 'rgba(245,158,11,0.14)', color: '#B45309', borderBottom: '1px solid rgba(245,158,11,0.3)', flexShrink: 0 }}>
      <span style={{ fontSize: 13 }}>👁</span>
      <span>Viewing as {roleLabel}{impersonatedCoach ? ` — ${impersonatedCoach}` : ''}</span>
      <button onClick={() => setRole('head')} style={{ marginLeft: 'auto', appearance: 'none', border: '1px solid rgba(245,158,11,0.5)', background: 'transparent', color: '#B45309', borderRadius: 7, padding: '3px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Exit to Head Coach</button>
    </div>
  )

  useEffect(() => {
    try { setPinned(localStorage.getItem('lumio_coach_sidebar_pinned') === 'true') } catch {}
  }, [])
  const togglePin = () => setPinned(p => { const n = !p; try { localStorage.setItem('lumio_coach_sidebar_pinned', String(n)) } catch {} ; return n })
  const onEnter = () => { if (leaveTimer.current) { clearTimeout(leaveTimer.current); leaveTimer.current = null } ; setHovered(true) }
  const onLeave = () => { leaveTimer.current = setTimeout(() => setHovered(false), 350) }

  const renderView = () => {
    if (isEmpty) {
      // Live, persisted data modules for a real coach's portal (Supabase-backed).
      switch (active) {
        case 'roster':   return <LiveRoster T={T} accent={accent} density={density} />
        case 'staff':    return <LiveStaff T={T} accent={accent} density={density} />
        case 'calendar': return <LiveBookingCalendar T={T} accent={accent} onNavigate={setActive} />
        case 'belts':       return <LiveRacketProgression T={T} accent={accent} />
        case 'lessons':     return <LiveLessons T={T} accent={accent} />
        case 'camps':       return <LiveModule config={CAMPS_CONFIG} T={T} accent={accent} />
        case 'payments':    return <LiveModule config={PAYMENTS_CONFIG} T={T} accent={accent} />
        case 'gpsheatmaps': return <LiveEffortRewards T={T} accent={accent} density={density} />
        case 'videoaudio':  return <CoachGpsVideo T={T} accent={accent} />
        case 'planner':     return <LiveSessionPlanner T={T} accent={accent} density={density} />
        case 'venues':      return <LiveModule config={COURTS_CONFIG} T={T} accent={accent} />
        case 'development': return <LiveDevelopment T={T} accent={accent} />
        case 'equipment':   return <LiveModule config={EQUIPMENT_CONFIG} T={T} accent={accent} />
        case 'resources':   return <LiveModule config={RESOURCES_CONFIG} T={T} accent={accent} />
        case 'messages':    return <LiveMessages T={T} accent={accent} onConfigure={() => setActive('settings')} />
        case 'settings':    return <><CoachContactSettings T={T} accent={accent} /><CoachDevelopmentSettings T={T} accent={accent} /><CoachCompliance T={T} accent={accent} /><div style={{ marginBottom: 16 }}><CoachImport T={T} accent={accent} /></div><SettingsView T={T} accent={accent} density={density} /></>
        case 'dashboard':   return <LiveCoachDashboard T={T} accent={accent} density={density} clubName={clubName} onNavigate={setActive} onStartWizard={() => setShowWizard(true)} />
      }
      const title = COACH_SIDEBAR.find(i => i.id === active)?.label ?? 'This section'
      return <EmptyModule T={T} accent={accent} density={density} title={title} onNavigate={setActive} />
    }
    switch (active) {
      case 'dashboard':   return <DashboardView T={T} accent={accent} density={density} onNavigate={setActive} />
      case 'lessons':     return <LessonsView T={T} accent={accent} density={density} />
      case 'planner':     return <SessionPlannerView T={T} accent={accent} density={density} onNavigate={setActive} />
      case 'staff':       return <StaffView T={T} accent={accent} density={density} onNavigate={setActive} />
      case 'development': return <DevelopmentView T={T} accent={accent} density={density} />
      case 'belts':       return <BeltsView T={T} accent={accent} density={density} />
      case 'calendar':    return <CalendarView T={T} accent={accent} density={density} />
      case 'venues':      return <CourtPlannerView T={T} accent={accent} density={density} />
      case 'camps':       return <CampsView T={T} accent={accent} density={density} />
      case 'roster':      return <RosterView T={T} accent={accent} density={density} onNavigate={setActive} />
      case 'videoaudio':  return <VideoAudioView T={T} accent={accent} density={density} />
      case 'gpsheatmaps': return <HeatmapsView T={T} accent={accent} density={density} />
      case 'messages':    return <MessagesView T={T} accent={accent} density={density} />
      case 'resources':   return <ResourcesView T={T} accent={accent} density={density} />
      case 'equipment':   return <EquipmentView T={T} accent={accent} density={density} />
      case 'payments':    return <PaymentsView T={T} accent={accent} density={density} />
      case 'settings':    return <><CoachCompliance T={T} accent={accent} demo /><SettingsView T={T} accent={accent} density={density} /></>
      default:            return <DashboardView T={T} accent={accent} density={density} onNavigate={setActive} />
    }
  }

  const beltCounts = BELTS.map((_b, bi) => PLAYERS.filter(p => p.beltIndex === bi).length)

  const responsiveStyle = `.tnum{font-variant-numeric:tabular-nums}
    @media (max-width: 1100px){ .coach-rail{ display:none !important } }
    @media (max-width: 768px){
      .cm-12{ grid-template-columns:1fr !important }
      .cm-md{ grid-template-columns:1fr !important }
      .cm-2{ grid-template-columns:1fr !important }
      .cm-3{ grid-template-columns:1fr !important }
      .cm-12 > *, .cm-md > *, .cm-2 > *, .cm-3 > *{ grid-column:auto !important }
    }`

  // ─── Student role — the player/parent view (Phase 2) ──────────────────────
  // Swaps the whole dashboard for the purpose-built StudentView (defaults to
  // Mia Chen; its own picker switches child). The Phase-1 "viewing as" banner
  // stays so a head coach can exit back to their own portal.
  // Onboarding wizard overlay — rendered above whichever shell is active.
  const wizard = showWizard ? (
    <CoachOnboardingWizard
      defaultName={session?.userName || ''}
      defaultAcademy={session?.clubName || slugClubName || ''}
      onClose={() => setShowWizard(false)}
      onDone={() => { if (typeof window !== 'undefined') window.location.reload() }}
    />
  ) : null

  if (role === 'student') {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: 'var(--font-geist-sans, system-ui)', display: 'flex', flexDirection: 'column' }}>
        {ViewingAsBanner}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ maxWidth: 1080, margin: '0 auto', padding: isMobile ? '14px 12px 36px' : '24px 24px 44px' }}>
            {isEmpty ? (
              // Real portal — never show demo student data. The live player/parent
              // view ships with the Player Roster module.
              <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
                <div style={{ textAlign: 'center', maxWidth: 440, background: T.panel, border: `1px dashed ${T.border}`, borderRadius: 16, padding: '36px 28px' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Student view</div>
                  <p style={{ fontSize: 13, color: T.text3, lineHeight: 1.6, marginTop: 8 }}>
                    This is the player &amp; parent view of your academy. Add players in the Player Roster, then open a player to preview their portal. The full live student view is on the way.
                  </p>
                  <button onClick={() => { setRole('head'); setActive('roster') }} style={{ marginTop: 16, padding: '10px 16px', borderRadius: 10, border: 'none', background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Go to Player Roster</button>
                </div>
              </div>
            ) : (
              <StudentView T={T} accent={accent} density={density} playerId="p1" />
            )}
          </div>
        </div>
      </div>
    )
  }

  // ─── Mobile shell ─────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        {wizard}
        <CoachMobileShell
          T={T} accent={accent} active={active} onNavigate={setActive}
          showDemoBanner={showDemoBanner} hiddenMenu={[...hiddenMenu, ...roleHiddenIds]}
          avatar={<CoachAvatar size={30} />}
          roleSwitcher={roleSwitcher} roleBanner={ViewingAsBanner}
        >
          {renderView()}
        </CoachMobileShell>
      </>
    )
  }

  // ─── Desktop shell ────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: T.bg, color: T.text, fontFamily: 'var(--font-geist-sans, system-ui)' }}>
      <style>{responsiveStyle}</style>
      {wizard}

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
            <img src="/tennis_transparent_logo.png" alt="Lumio Tennis" style={{ width: 26, height: 26, objectFit: 'contain' }} />
          </div>
          {expanded && (
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: T.text, whiteSpace: 'nowrap' }}>Lumio Coach</div>
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
                    <button key={item.id} onClick={() => { setActive(item.id); if (!pinned) setHovered(false) }} title={expanded ? undefined : item.label}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 9, textAlign: 'left',
                        background: on ? accent.dim : 'transparent',
                        color: on ? accent.hex : T.text3,
                        border: 0, borderLeftWidth: 2, borderLeftStyle: 'solid', borderLeftColor: on ? accent.hex : 'transparent',
                        borderRadius: 7, padding: expanded ? '6px 10px' : '6px 0', justifyContent: expanded ? 'flex-start' : 'center',
                        fontSize: 12, cursor: 'pointer', marginBottom: 1,
                      }}>
                      <Icon name={item.icon} size={16} stroke={1.7} />
                      {expanded && <span style={{ fontWeight: on ? 600 : 500, whiteSpace: 'nowrap', flex: 1 }}>{item.label}</span>}
                      {expanded && item.badge && <span style={{ fontSize: 8.5, fontWeight: 700, color: accent.hex, background: accent.dim, padding: '1px 5px', borderRadius: 4, letterSpacing: '0.05em' }}>{item.badge}</span>}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </nav>

        <div style={{ borderTop: `1px solid ${line}`, padding: expanded ? '10px 12px' : '10px 4px', display: 'flex', alignItems: 'center', gap: 9, justifyContent: expanded ? 'flex-start' : 'center' }}>
          <CoachAvatar size={30} />
          {expanded && (
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, whiteSpace: 'nowrap' }}>{coachName}</div>
              <div style={{ fontSize: 9.5, color: T.text3, whiteSpace: 'nowrap' }}>{roleLabel}</div>
            </div>
          )}
        </div>
        {/* Role switcher (Switch view) — reuses the shared RoleSwitcher; its
            popover opens upward from this footer. Only when the rail is open. */}
        {expanded && roleSwitcher && (
          <div style={{ padding: '8px 12px', borderTop: `1px solid ${line}` }}>{roleSwitcher}</div>
        )}
        {expanded && (
          <div style={{ padding: '8px 12px', borderTop: `1px solid ${line}` }}>
            <div style={{ fontSize: 9, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Plan</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 9px', borderRadius: 999, background: accent.dim, border: `1px solid ${accent.border}` }}>
              <span style={{ fontSize: 10.5, color: accent.hex, fontWeight: 700 }}>{planTier ? `Lumio ${planTier.name}` : 'Custom plan'}</span>
              {planTier && <span style={{ fontSize: 9.5, color: T.text3 }}>£{planTier.price}/mo</span>}
            </div>
          </div>
        )}
      </aside>

      {/* main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: '100vh' }}>
        {ViewingAsBanner}
        {showDemoBanner && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 24px', fontSize: 12, fontWeight: 500, background: accent.hex, color: '#fff', flexShrink: 0 }}>
            <span>This is a demo · sample data</span>
            <span style={{ opacity: 0.85 }}>Lumio Coach — Tennis</span>
          </div>
        )}

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            {renderView()}
          </div>

          {/* right rail */}
          <div className="coach-rail" style={{ width: 264, flexShrink: 0, borderLeft: `1px solid ${line}`, padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, textAlign: 'center' }}>
              <div style={{ width: 72, margin: '0 auto' }}><CoachAvatar size={72} /></div>
              <div style={{ fontSize: 16, fontWeight: 600, color: T.text, marginTop: 10 }}>{coachName}</div>
              {!isEmpty && <div style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>{settings.cert}</div>}
              <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
                <RailStat T={T} label="Players" value={isEmpty ? liveStats.players : COACH_ORG.season.activePlayers} />
                <RailStat T={T} label="Lessons/wk" value={isEmpty ? liveStats.lessonsThisWeek : COACH_ORG.season.lessonsThisWeek} />
                <RailStat T={T} label="Retention" value={isEmpty ? '—' : `${COACH_ORG.season.retention}%`} />
              </div>
            </div>

            {isEmpty ? (
              <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16 }}>
                <div style={{ fontSize: 10.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 8 }}>Set up your academy</div>
                <p style={{ fontSize: 11.5, color: T.text3, lineHeight: 1.5, margin: 0 }}>Add players, coaches and bookings from the dashboard and these stats fill in automatically.</p>
                <button onClick={() => setShowWizard(true)} style={{ appearance: 'none', border: 0, cursor: 'pointer', marginTop: 10, width: '100%', padding: '9px 12px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 12, fontWeight: 700 }}>Set up your academy</button>
              </div>
            ) : (
              <>
                {feat.racket && (
                <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16 }}>
                  <div style={{ fontSize: 10.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 10 }}>Racket distribution</div>
                  {BELTS.map((b, bi) => beltCounts[bi] > 0 && (
                    <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                      <span style={{ width: 16, height: 10, borderRadius: 2, background: b.colour, border: '1px solid rgba(128,128,128,0.4)' }} />
                      <span style={{ fontSize: 11, color: T.text2, flex: 1 }}>{b.name}</span>
                      <span className="tnum" style={{ fontSize: 11, color: T.text, fontWeight: 600 }}>{beltCounts[bi]}</span>
                    </div>
                  ))}
                </div>
                )}

                <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16 }}>
                  <div style={{ fontSize: 10.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 8 }}>This week</div>
                  {[['Rackets awarded', COACH_ORG.season.beltsAwarded], ['Sessions', COACH_ORG.season.lessonsThisWeek], ['New players', '+3']].map(([k, v], i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, padding: '3px 0' }}>
                      <span style={{ color: T.text3 }}>{k}</span><span style={{ color: T.text, fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
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
