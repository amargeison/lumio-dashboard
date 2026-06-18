'use client'

// ─── Coach portal — app-like mobile shell ────────────────────────────────────
// Replaces the old hamburger-drawer mobile view with an app-style chrome: a
// top app-bar, the existing desktop views rendered single-column in a scrollable
// main, and a fixed BOTTOM TAB BAR (Dashboard · Planner · Roster · Calendar ·
// More). "More" opens the shared, sport-agnostic MobileMoreSheet with the rest
// of the nav. Menu-visibility (lumio_coach_menu_hidden) is honoured in BOTH the
// tabs and the sheet. Coach accent/theme via T/accent tokens. Demo only.
//
// Reuses ONLY the shared, sport-agnostic MobileMoreSheet — NOT the player
// MobileSportLayout/MobileBottomNav (those are athlete-coupled).

import { useState, useEffect, type ReactNode } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { COACH_SIDEBAR, COACH_GROUPS } from '../_lib/coach-data'
import { MobileMoreSheet, type MoreSheetItem } from '@/components/mobile/sport/MobileMoreSheet'
import { CoachPwaInstaller } from './CoachPwaInstaller'

// Primary bottom-nav tabs (a subset of COACH_SIDEBAR). Everything else lives in
// the More sheet. Dashboard is non-hideable, so it's a safe anchor tab.
const PRIMARY_TABS = ['dashboard', 'planner', 'roster', 'calendar'] as const
const TAB_LABEL: Record<string, string> = {
  dashboard: 'Dashboard', planner: 'Planner', roster: 'Roster', calendar: 'Calendar',
}

// Emoji glyphs for the More sheet (it renders item.icon as text; coach nav
// otherwise uses Lucide icon-name strings, which would show as literal words).
const NAV_EMOJI: Record<string, string> = {
  dashboard: '🏠', planner: '🗓️', lessons: '📝', development: '📈', belts: '🎾',
  staff: '🧑‍🏫', calendar: '📅', venues: '📍', camps: '☀️', roster: '👥',
  messages: '💬', videoaudio: '🎥', gpsheatmaps: '🔥', resources: '📚',
  equipment: '🎒', payments: '💷', settings: '⚙️',
}

function MoreGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
    </svg>
  )
}

export function CoachMobileShell({
  T, accent, active, onNavigate, showDemoBanner, hiddenMenu, avatar, children, roleSwitcher, roleBanner,
}: {
  T: ThemeTokens
  accent: AccentTokens
  active: string
  onNavigate: (id: string) => void
  showDemoBanner: boolean
  hiddenMenu: string[]
  avatar: ReactNode
  children: ReactNode
  // Role switcher (Switch view) + "viewing as" banner — passed from the portal
  // shell so the mobile shell stays role-agnostic.
  roleSwitcher?: ReactNode
  roleBanner?: ReactNode
}) {
  const [moreOpen, setMoreOpen] = useState(false)

  // Match the browser/status-bar chrome to the coach accent while the mobile
  // shell is mounted (so a standalone PWA's status bar reads as coach purple).
  // Mirrors how the player MobileSportLayout swaps theme-color at runtime.
  useEffect(() => {
    if (typeof document === 'undefined') return
    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null
    const prev = meta?.content
    if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.appendChild(meta) }
    meta.content = accent.hex
    return () => { if (meta) meta.content = prev ?? '#07080F' }
  }, [accent.hex])

  const barBg = T.panel2
  const activeItem = COACH_SIDEBAR.find(i => i.id === active)

  // Tabs: drop a primary tab whose nav item is hidden in Settings (Dashboard
  // can't be hidden, so the bar always has at least Dashboard + More).
  const tabItems = PRIMARY_TABS
    .filter(id => id === 'dashboard' || !hiddenMenu.includes(id))
    .map(id => COACH_SIDEBAR.find(i => i.id === id))
    .filter((i): i is NonNullable<typeof i> => !!i)

  const onPrimary = tabItems.some(t => t.id === active)

  // More = everything not already on a primary tab and not hidden in Settings.
  const moreItems: MoreSheetItem[] = COACH_SIDEBAR.map(i => ({
    id: i.id, label: i.label, group: i.group, icon: NAV_EMOJI[i.id] ?? '•',
  }))
  const moreHidden = new Set<string>([...hiddenMenu, ...PRIMARY_TABS])

  // CSS vars consumed by the shared MobileMoreSheet. Its sheet background is a
  // fixed dark surface, so text vars are light-on-dark regardless of the coach
  // theme; the accent comes from the coach token.
  const sheetVars: Record<string, string> = {
    '--mobile-accent': accent.hex,
    '--mobile-text': 'rgba(245, 243, 255, 0.96)',
    '--mobile-text-muted': 'rgba(245, 243, 255, 0.55)',
    '--mobile-bg-card': 'rgba(255, 255, 255, 0.06)',
  }

  const tabBtn = (key: string, label: string, glyph: ReactNode, isActive: boolean, onClick: () => void) => (
    <button key={key} onClick={onClick}
      style={{
        flex: 1, appearance: 'none', border: 0, background: 'transparent', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
        padding: '7px 2px', borderRadius: 12, color: isActive ? accent.hex : T.text3,
      }}>
      <span style={{ display: 'grid', placeItems: 'center', width: 38, height: 26, borderRadius: 9, background: isActive ? accent.dim : 'transparent' }}>{glyph}</span>
      <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500 }}>{label}</span>
    </button>
  )

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      background: T.bg, color: T.text, fontFamily: 'var(--font-geist-sans, system-ui)',
      paddingTop: 'env(safe-area-inset-top)', ...sheetVars,
    }}>
      <style>{`.tnum{font-variant-numeric:tabular-nums}
        .no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{scrollbar-width:none}
        @media (max-width: 768px){
          .cm-12{ grid-template-columns:1fr !important }
          .cm-md{ grid-template-columns:1fr !important }
          .cm-2{ grid-template-columns:1fr !important }
          .cm-3{ grid-template-columns:1fr !important }
          /* collapsed to one column → stop children spanning multiple tracks,
             which would otherwise spawn implicit auto columns and overflow */
          .cm-12 > *, .cm-md > *, .cm-2 > *, .cm-3 > *{ grid-column:auto !important }
        }`}</style>

      {/* Top app bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 30, display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: barBg, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, display: 'grid', placeItems: 'center', background: accent.dim, border: `1px solid ${accent.border}`, fontSize: 16, flexShrink: 0 }}>🎾</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, lineHeight: 1.1 }}>Lumio Coach</div>
          <div style={{ fontSize: 10, color: T.text3 }}>{activeItem?.label ?? 'Dashboard'}</div>
        </div>
        {avatar}
      </div>

      {showDemoBanner && (
        <div style={{ padding: '6px 14px', fontSize: 11.5, fontWeight: 500, background: accent.hex, color: '#fff', textAlign: 'center' }}>Demo · sample data</div>
      )}

      {roleBanner}

      {/* Role switcher strip (Switch view) */}
      {roleSwitcher && (
        <div style={{ padding: '8px 14px', borderBottom: `1px solid ${T.border}`, background: barBg }}>{roleSwitcher}</div>
      )}

      {/* Scrollable main — desktop views render single-column in here, unchanged */}
      <main style={{ flex: 1, minWidth: 0, padding: 14, paddingBottom: 'calc(64px + 22px + env(safe-area-inset-bottom))' }}>
        {children}
      </main>

      {/* Fixed bottom tab bar */}
      <nav style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 40,
        background: barBg, borderTop: `1px solid ${T.border}`,
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -8px 24px -16px rgba(0,0,0,0.6)',
      }}>
        <div style={{ display: 'flex', alignItems: 'stretch', height: 64, padding: '0 6px', gap: 2 }}>
          {tabItems.map(item =>
            tabBtn(item.id, TAB_LABEL[item.id] ?? item.label,
              <Icon name={item.icon} size={21} stroke={active === item.id ? 2.3 : 1.8} />,
              active === item.id, () => onNavigate(item.id)),
          )}
          {tabBtn('more', 'More', <MoreGlyph />, !onPrimary, () => setMoreOpen(true))}
        </div>
        {/* iOS home-indicator safe area */}
        <div style={{ height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ width: 110, height: 4, borderRadius: 2, background: T.text4 }} />
        </div>
      </nav>

      <MobileMoreSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        items={moreItems}
        hiddenIds={moreHidden}
        onNavigate={(id) => onNavigate(id)}
        groupOrder={COACH_GROUPS}
      />

      <CoachPwaInstaller T={T} accent={accent} />
    </div>
  )
}
