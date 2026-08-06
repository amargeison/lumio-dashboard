'use client'

// ─── Coach portal — THE profile control ──────────────────────────────────────
// The single bottom-left identity block (avatar + name + role). Clicking it opens
// one menu carrying everything an account control owns:
//   • Switch view — the role/profile switcher (Head Coach / Coach / Student),
//     shown only when the caller passes roles worth switching between.
//   • Log out / Exit demo.
//
// It used to be two separate blocks stacked on top of each other — this menu and
// the shared RoleSwitcher — which read as two different people signed in at once
// (they even sourced the name differently: settings vs session). One control, one
// name, both actions.
//
// Two variants so desktop and mobile share one menu:
//   • 'sidebar' — the bottom-left block of the desktop sidebar. Collapses to the
//     avatar alone when the sidebar is collapsed; the menu opens ABOVE it.
//   • 'compact' — the avatar in the mobile top app bar; the menu drops BELOW,
//     right-aligned.
//
// Logging out is handled by the caller (page.tsx) so the LIVE portal can do a
// real Supabase sign-out while the demo just clears its local session — see
// `onLogout` there. Role selection is likewise the caller's: it owns the active
// role and persists it back to the demo session blob.

import { useState, useEffect, useRef, type ReactNode } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'

export type ProfileMenuRole = { id: string; label: string; icon: string; description?: string }

function LogOutGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

export function CoachProfileMenu({
  T, accent, avatar, coachName, roleLabel, variant, expanded = true, onLogout, logoutLabel = 'Log out',
  roles, activeRole, onSelectRole,
}: {
  T: ThemeTokens
  accent: AccentTokens
  /** The rendered <CoachAvatar>, so the menu stays agnostic about avatar sizing. */
  avatar: ReactNode
  coachName: string
  roleLabel: string
  variant: 'sidebar' | 'compact'
  /** Sidebar only — collapsed sidebars show the avatar with no name/role text. */
  expanded?: boolean
  onLogout: () => void
  /** Demo portals say "Exit demo"; the live portal says "Log out". */
  logoutLabel?: string
  /**
   * Views this account can switch between. Omit (or pass fewer than two) and the
   * menu is Log out only — which is what a coach impersonating another view, or a
   * brand-new academy with nothing to switch to, should see.
   */
  roles?: ProfileMenuRole[]
  activeRole?: string
  onSelectRole?: (roleId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const [anchor, setAnchor] = useState<{ top: number; bottom: number; left: number; right: number } | null>(null)

  const isSidebar = variant === 'sidebar'

  // The desktop sidebar is `overflow: hidden` (it clips the nav during the
  // width transition), so an absolutely-positioned menu would be cut off — and
  // the menu is wider than the collapsed 72px rail. Measuring the trigger and
  // positioning the menu `fixed` escapes the clip in both states.
  const openMenu = () => {
    const r = btnRef.current?.getBoundingClientRect()
    if (r) setAnchor({ top: r.top, bottom: r.bottom, left: r.left, right: r.right })
    setOpen(true)
  }

  // Close on outside click / Escape. Without this the menu survives a click into
  // a module and floats over the content. Resize/scroll close it too rather than
  // leaving it stranded at a stale position.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    const close = () => setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', close)
    window.addEventListener('scroll', close, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [open])

  // Only worth offering when there's somewhere else to go.
  const switchRoles = roles && roles.length > 1 && onSelectRole ? roles : null

  const menu = anchor && (
    <div
      role="menu"
      style={{
        position: 'fixed',
        ...(isSidebar
          ? { bottom: Math.max(8, window.innerHeight - anchor.top + 6), left: Math.max(8, anchor.left) }
          : { top: anchor.bottom + 8, right: Math.max(8, window.innerWidth - anchor.right) }),
        minWidth: 196, zIndex: 120,
        background: T.panel, border: `1px solid ${T.border}`, borderRadius: 11,
        boxShadow: '0 12px 32px -12px rgba(0,0,0,0.65)', overflow: 'hidden',
      }}>
      <div style={{ padding: '9px 12px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{coachName || 'Coach'}</div>
        <div style={{ fontSize: 10, color: T.text3, marginTop: 1 }}>{roleLabel}</div>
      </div>
      {switchRoles && (
        <div style={{ padding: '6px 6px 4px', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '2px 6px 5px' }}>Switch view</div>
          {switchRoles.map(r => {
            const on = r.id === activeRole
            return (
              <button
                key={r.id}
                role="menuitem"
                onClick={() => { setOpen(false); if (!on) onSelectRole?.(r.id) }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  appearance: 'none', border: 0, cursor: 'pointer', borderRadius: 7,
                  background: on ? accent.dim : 'transparent',
                  padding: '7px 8px', fontSize: 12, textAlign: 'left',
                  color: on ? accent.hex : T.text2, fontWeight: on ? 600 : 500,
                }}>
                <span style={{ fontSize: 13, flexShrink: 0 }}>{r.icon}</span>
                <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{r.label}</span>
                {on && <span style={{ fontSize: 10, fontWeight: 700, color: accent.hex }}>✓</span>}
              </button>
            )
          })}
        </div>
      )}
      <button
        role="menuitem"
        onClick={() => { setOpen(false); onLogout() }}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          appearance: 'none', border: 0, background: 'transparent', cursor: 'pointer',
          padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#EF4444', textAlign: 'left',
        }}>
        <LogOutGlyph />
        <span>{logoutLabel}</span>
      </button>
    </div>
  )

  return (
    <div ref={wrapRef} style={{ position: 'relative', ...(isSidebar ? { width: '100%' } : { flexShrink: 0, lineHeight: 0 }) }}>
      <button
        ref={btnRef}
        onClick={() => { if (open) setOpen(false); else openMenu() }}
        aria-haspopup="menu"
        aria-expanded={open}
        title={switchRoles ? `${coachName || 'Coach'} — switch view or ${logoutLabel.toLowerCase()}` : logoutLabel}
        style={{
          appearance: 'none', border: 0, background: open ? accent.dim : 'transparent', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: isSidebar ? 9 : 0,
          width: isSidebar ? '100%' : 'auto',
          justifyContent: isSidebar && expanded ? 'flex-start' : 'center',
          padding: isSidebar ? (expanded ? '4px 6px' : '4px 0') : 0,
          borderRadius: isSidebar ? 8 : '50%',
          textAlign: 'left', color: T.text,
        }}>
        {avatar}
        {isSidebar && expanded && (
          <>
            <span style={{ minWidth: 0, display: 'block', flex: 1 }}>
              <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.text, whiteSpace: 'nowrap' }}>{coachName}</span>
              <span style={{ display: 'block', fontSize: 9.5, color: T.text3, whiteSpace: 'nowrap' }}>{roleLabel}</span>
            </span>
            {/* Caret — this is the only account control now, so it has to read as
                a menu rather than a static identity block. */}
            <span style={{ fontSize: 9, color: T.text3, flexShrink: 0 }}>{open ? '▲' : '▼'}</span>
          </>
        )}
      </button>
      {open && menu}
    </div>
  )
}
