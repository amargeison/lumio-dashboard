'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { MobileBottomNav, type MobileNavKey } from './tennis/MobileBottomNav'
import { MobileMoreSheet, type MoreSheetItem } from './tennis/MobileMoreSheet'
import { MobileLayoutContext } from './MobileLayoutContext'

export type MobileSportLayoutProps = {
  sport: 'tennis' | 'darts' | 'golf' | 'boxing'
  activeSection: string
  onNavigate: (section: string) => void
  sidebarItems: MoreSheetItem[]
  /** Sections already surfaced via the bottom nav — hidden from the More sheet. */
  hiddenNavIds?: Set<string>
  groupOrder?: string[]
  /** Inbox badge count for the bottom nav. */
  inboxBadge?: number
  /** Navigation key → section id. Override per sport if needed. */
  navMap?: Partial<Record<MobileNavKey, string>>
  children: React.ReactNode
}

// Sport palette (follows the prototype defaults; swaps per sport in follow-up passes).
const SPORT_TOKENS: Record<MobileSportLayoutProps['sport'], Record<string, string>> = {
  tennis: {
    '--bg-base':      'rgb(13, 8, 32)',
    '--bg-card':      'rgb(22, 16, 43)',
    '--bg-card-alt':  'rgb(30, 23, 57)',
    '--text-primary': 'rgb(245, 243, 255)',
    '--text-accent':  'rgb(196, 181, 253)',
    '--text-muted':   'rgb(139, 127, 184)',
    '--text-meta':    'rgb(94, 79, 133)',
    '--violet':       'rgb(168, 85, 247)',
    '--fuchsia':      'rgb(217, 70, 239)',
    '--yellow':       'rgb(252, 211, 77)',
    '--green':        'rgb(16, 185, 129)',
    '--amber':        'rgb(245, 158, 11)',
    '--blue':         'rgb(96, 165, 250)',
    '--red':          'rgb(239, 68, 68)',
    '--cyan':         'rgb(34, 211, 238)',
    '--pink':         'rgb(236, 72, 153)',
    '--border':       'rgba(168, 85, 247, 0.18)',
  },
  darts:  { '--bg-base': 'rgb(13, 8, 32)', '--bg-card': 'rgb(22, 16, 43)', '--bg-card-alt': 'rgb(30, 23, 57)', '--text-primary': 'rgb(245, 243, 255)', '--text-accent': 'rgb(196, 181, 253)', '--text-muted': 'rgb(139, 127, 184)', '--text-meta': 'rgb(94, 79, 133)', '--violet': 'rgb(168, 85, 247)', '--fuchsia': 'rgb(217, 70, 239)', '--yellow': 'rgb(252, 211, 77)', '--green': 'rgb(16, 185, 129)', '--amber': 'rgb(245, 158, 11)', '--blue': 'rgb(96, 165, 250)', '--red': 'rgb(239, 68, 68)', '--cyan': 'rgb(34, 211, 238)', '--pink': 'rgb(236, 72, 153)', '--border': 'rgba(168, 85, 247, 0.18)' },
  golf:   { '--bg-base': 'rgb(13, 8, 32)', '--bg-card': 'rgb(22, 16, 43)', '--bg-card-alt': 'rgb(30, 23, 57)', '--text-primary': 'rgb(245, 243, 255)', '--text-accent': 'rgb(196, 181, 253)', '--text-muted': 'rgb(139, 127, 184)', '--text-meta': 'rgb(94, 79, 133)', '--violet': 'rgb(168, 85, 247)', '--fuchsia': 'rgb(217, 70, 239)', '--yellow': 'rgb(252, 211, 77)', '--green': 'rgb(16, 185, 129)', '--amber': 'rgb(245, 158, 11)', '--blue': 'rgb(96, 165, 250)', '--red': 'rgb(239, 68, 68)', '--cyan': 'rgb(34, 211, 238)', '--pink': 'rgb(236, 72, 153)', '--border': 'rgba(168, 85, 247, 0.18)' },
  boxing: { '--bg-base': 'rgb(13, 8, 32)', '--bg-card': 'rgb(22, 16, 43)', '--bg-card-alt': 'rgb(30, 23, 57)', '--text-primary': 'rgb(245, 243, 255)', '--text-accent': 'rgb(196, 181, 253)', '--text-muted': 'rgb(139, 127, 184)', '--text-meta': 'rgb(94, 79, 133)', '--violet': 'rgb(168, 85, 247)', '--fuchsia': 'rgb(217, 70, 239)', '--yellow': 'rgb(252, 211, 77)', '--green': 'rgb(16, 185, 129)', '--amber': 'rgb(245, 158, 11)', '--blue': 'rgb(96, 165, 250)', '--red': 'rgb(239, 68, 68)', '--cyan': 'rgb(34, 211, 238)', '--pink': 'rgb(236, 72, 153)', '--border': 'rgba(168, 85, 247, 0.18)' },
}

const DEFAULT_NAV_MAP: Record<MobileNavKey, string> = {
  home:  'dashboard',
  today: 'today',
  inbox: 'morning',
  match: 'matchprep',
  // `more` is handled as a sheet open, not a navigation target
  more:  '',
}

const DEFAULT_HIDDEN_IDS = new Set(['dashboard', 'morning', 'matchprep'])

function resolveActiveNavKey(activeSection: string, navMap: Record<MobileNavKey, string>): MobileNavKey {
  const entry = (Object.entries(navMap) as [MobileNavKey, string][]).find(([, id]) => id && id === activeSection)
  return entry ? entry[0] : 'home'
}

export function MobileSportLayout({
  sport,
  activeSection,
  onNavigate,
  sidebarItems,
  hiddenNavIds,
  groupOrder,
  inboxBadge,
  navMap,
  children,
}: MobileSportLayoutProps) {
  const [moreOpen, setMoreOpen] = useState(false)

  // Update browser chrome theme-color to match the mobile accent while the shell is mounted.
  useEffect(() => {
    if (typeof document === 'undefined') return
    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null
    const prev = meta?.content
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'theme-color'
      document.head.appendChild(meta)
    }
    meta.content = '#A855F7'
    return () => { if (meta) meta.content = prev ?? '#07080F' }
  }, [])

  const mergedNavMap: Record<MobileNavKey, string> = { ...DEFAULT_NAV_MAP, ...(navMap ?? {}) }
  const activeKey = resolveActiveNavKey(activeSection, mergedNavMap)

  const handleNavSelect = (key: MobileNavKey) => {
    if (key === 'more') { setMoreOpen(true); return }
    const target = mergedNavMap[key]
    if (target) onNavigate(target)
  }

  const ctxValue = useMemo(() => ({
    openMore:  () => setMoreOpen(true),
    closeMore: () => setMoreOpen(false),
    activeSection,
    onNavigate,
  }), [activeSection, onNavigate])

  const tokens = SPORT_TOKENS[sport]
  const hiddenIds = hiddenNavIds ?? DEFAULT_HIDDEN_IDS

  return (
    <MobileLayoutContext.Provider value={ctxValue}>
      <div
        className="mobile-shell w-screen min-h-screen flex flex-col"
        style={{
          background: 'var(--bg-base)',
          color: 'var(--text-primary)',
          paddingTop: 'env(safe-area-inset-top)',
          ...tokens,
        }}
      >
        {/* Shared keyframes + scrollbar-hide helpers */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes mobileCardIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes mobileMatchGlow {
            0%, 100% { box-shadow: 0 0 20px 0 rgba(168, 85, 247, 0.55); }
            50%      { box-shadow: 0 0 40px 4px rgba(217, 70, 239, 0.55); }
          }
          @keyframes mobileGreenPulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.6); opacity: 0.55; } }
          @keyframes mobileRedPulse   { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.55; } }
          @keyframes mobileWave       { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(18deg); } 75% { transform: rotate(-12deg); } }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { scrollbar-width: none; }
        ` }} />

        <main
          className="flex-1 min-w-0"
          style={{
            // 64px bottom nav + 22px iOS indicator + safe-area inset — leave room
            // so content never scrolls under the fixed nav.
            paddingBottom: 'calc(64px + 22px + env(safe-area-inset-bottom))',
          }}
        >
          {children}
        </main>

        <MobileBottomNav
          active={activeKey}
          onSelect={handleNavSelect}
          inboxBadge={inboxBadge}
        />

        <MobileMoreSheet
          open={moreOpen}
          onClose={() => setMoreOpen(false)}
          items={sidebarItems}
          hiddenIds={hiddenIds}
          onNavigate={(id) => { onNavigate(id); setMoreOpen(false) }}
          groupOrder={groupOrder}
        />
      </div>
    </MobileLayoutContext.Provider>
  )
}
