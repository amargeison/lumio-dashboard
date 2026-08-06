'use client'

// ─── Coach portal — profile block + account menu ─────────────────────────────
// The signed-in coach's identity block (avatar + name + role). Clicking it opens
// a small menu whose only item today is Log out — the coach portal previously had
// no way out of a session at all, which is wrong for shared club devices.
//
// Two variants so desktop and mobile share one menu:
//   • 'sidebar' — the bottom-left block of the desktop sidebar. Collapses to the
//     avatar alone when the sidebar is collapsed; the menu opens ABOVE it.
//   • 'compact' — the avatar in the mobile top app bar; the menu drops BELOW,
//     right-aligned.
//
// Logging out is handled by the caller (page.tsx) so the LIVE portal can do a
// real Supabase sign-out while the demo just clears its local session — see
// `onLogout` there.

import { useState, useEffect, useRef, type ReactNode } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'

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

  const menu = anchor && (
    <div
      role="menu"
      style={{
        position: 'fixed',
        ...(isSidebar
          ? { bottom: Math.max(8, window.innerHeight - anchor.top + 6), left: Math.max(8, anchor.left) }
          : { top: anchor.bottom + 8, right: Math.max(8, window.innerWidth - anchor.right) }),
        minWidth: 178, zIndex: 120,
        background: T.panel, border: `1px solid ${T.border}`, borderRadius: 11,
        boxShadow: '0 12px 32px -12px rgba(0,0,0,0.65)', overflow: 'hidden',
      }}>
      <div style={{ padding: '9px 12px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{coachName || 'Coach'}</div>
        <div style={{ fontSize: 10, color: T.text3, marginTop: 1 }}>{roleLabel}</div>
      </div>
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
        title={logoutLabel}
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
          <span style={{ minWidth: 0, display: 'block' }}>
            <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.text, whiteSpace: 'nowrap' }}>{coachName}</span>
            <span style={{ display: 'block', fontSize: 9.5, color: T.text3, whiteSpace: 'nowrap' }}>{roleLabel}</span>
          </span>
        )}
      </button>
      {open && menu}
    </div>
  )
}
