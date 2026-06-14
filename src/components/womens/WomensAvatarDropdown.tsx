'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, X } from 'lucide-react'

// Demo-safe Women's-portal avatar dropdown + notification bell.
//
// IMPORTANT: this component is intentionally a separate, demo-safe
// variant of the shared dashboard AvatarDropdown. It does NOT call
// any /api/workspace/* mutation endpoints. The shared AvatarDropdown
// is live in Pro / Schools / CRM / demo-workspace / generic slug
// portals and edits a real Supabase-backed Lumio account when an
// authenticated workspace token is present; we keep that behaviour
// out of the Women's portal demo so a logged-in user poking around
// here cannot accidentally mutate their live account state.
//
// Visible menu items (My Profile / Upload Photo / Change Email /
// Reset Password) still appear so the product reads as complete in
// the demo. Clicking any of the four opens a small "Available in
// your live Lumio account" notice instead of an edit panel.
//
// Settings is real navigation. Log out is local-only (clears
// lumio_* / demo_* / workspace_* keys then redirects).

const C = {
  panel:       '#111318',
  panelAlt:    '#0A0B10',
  border:      '#1F2937',
  borderHi:    '#374151',
  text:        '#F9FAFB',
  text2:       '#D1D5DB',
  muted:       '#9CA3AF',
  muted2:      '#6B7280',
  accent:      '#EC4899',
  accentDeep:  '#BE185D',
  accentDim:   'rgba(236,72,153,0.12)',
  danger:      '#EF4444',
} as const

const DEMO_NOTE = 'Available in your live Lumio account — disabled in demo mode.'

interface AvatarProps {
  initials: string
  /** Demo-signup photo (data URL). When absent we show a DiceBear notionists
   *  avatar (same style as staff cards) seeded by the user's name. */
  photoUrl?: string | null
  seedName?: string
  /** Demo-signup name — overrides any stored name; shows in the menu header. */
  userName?: string
  /** Settings is a sidebar section in this portal, not a separate route — parent passes a callback that nav-switches to it. */
  onSettings?: () => void
  logoutRedirect?: string
}

// Same fake-avatar style the staff cards use (CC0 notionists).
const fakeAvatar = (seed: string) => `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=transparent`

export default function WomensAvatarDropdown({ initials, photoUrl, seedName, userName, onSettings, logoutRedirect = '/' }: AvatarProps) {
  const [open, setOpen] = useState(false)
  const [demoPanel, setDemoPanel] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    try {
      setName(localStorage.getItem('lumio_user_name') || localStorage.getItem('workspace_user_name') || localStorage.getItem('lumio_company_name') || '')
      setEmail(localStorage.getItem('lumio_user_email') || '')
    } catch { /* SSR / locked-down browsers */ }
  }, [])

  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false); setDemoPanel(null)
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') { setOpen(false); setDemoPanel(null) }
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [open])

  function handleLogout() {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith('lumio_') || k.startsWith('demo_') || k.startsWith('workspace_'))
        .forEach(k => localStorage.removeItem(k))
    } catch { /* best-effort */ }
    router.push(logoutRedirect)
  }

  const effectiveName = (userName && userName.trim()) || name
  const avatarInner = photoUrl
    ? <img src={photoUrl} alt="" className="w-full h-full object-cover" />
    : <img src={fakeAvatar(seedName || effectiveName || initials || 'Director')} alt="" className="w-full h-full object-cover" />
  const menuItemStyle = { color: C.muted }
  const menuItemHover = (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.backgroundColor = 'rgba(31,41,55,0.5)'; e.currentTarget.style.color = C.text }
  const menuItemLeave = (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = C.muted }

  return (
    <div ref={ref} className="relative z-[100]">
      <button
        onClick={() => { setOpen(v => !v); setDemoPanel(null) }}
        className="flex items-center justify-center rounded-full text-xs font-bold transition-opacity hover:opacity-80 overflow-hidden"
        style={{ width: 36, height: 36, backgroundColor: C.accentDeep, color: C.text, padding: 0, border: 'none', cursor: 'pointer' }}
        aria-label="Account menu"
      >
        {avatarInner}
      </button>

      {open && (
        <div
          className="absolute right-0 rounded-xl shadow-xl"
          style={{ top: '100%', marginTop: 8, minWidth: 240, backgroundColor: C.panel, border: `1px solid ${C.border}`, zIndex: 100 }}
        >
          {/* Demo-safe sub-panel — fires when any of the 4 mutation items is clicked */}
          {demoPanel && (
            <div className="p-4 space-y-3">
              <p className="text-sm font-semibold" style={{ color: C.text }}>{demoPanel}</p>
              <div className="rounded-lg p-3 text-xs leading-relaxed" style={{ backgroundColor: C.accentDim, border: `1px solid ${C.accent}55`, color: '#FBCFE8' }}>
                {DEMO_NOTE}
              </div>
              <button
                onClick={() => setDemoPanel(null)}
                className="w-full text-xs py-1.5 rounded-lg font-semibold"
                style={{ backgroundColor: C.accentDim, color: '#F9A8D4', border: `1px solid ${C.accent}55` }}
              >
                Back to menu
              </button>
            </div>
          )}

          {/* Main menu */}
          {!demoPanel && (
            <>
              {/* User info header */}
              <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
                <div
                  className="flex items-center justify-center rounded-full text-xs font-bold shrink-0 overflow-hidden"
                  style={{ width: 48, height: 48, backgroundColor: C.accentDeep, color: C.text }}
                >
                  {avatarInner}
                </div>
                <div className="min-w-0">
                  {effectiveName && <p className="text-sm font-semibold truncate" style={{ color: C.text }}>{effectiveName}</p>}
                  {email && <p className="text-xs truncate" style={{ color: C.muted2 }}>{email}</p>}
                  {!effectiveName && !email && <p className="text-xs" style={{ color: C.muted2 }}>Demo session</p>}
                </div>
              </div>

              <div className="py-1">
                <button onClick={() => setDemoPanel('Edit Profile')}     className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm" style={menuItemStyle} onMouseEnter={menuItemHover} onMouseLeave={menuItemLeave}>
                  <span>👤</span><span>My Profile</span>
                </button>
                <button onClick={() => setDemoPanel('Upload Photo')}     className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm" style={menuItemStyle} onMouseEnter={menuItemHover} onMouseLeave={menuItemLeave}>
                  <span>📷</span><span>Upload Photo</span>
                </button>
                <button onClick={() => setDemoPanel('Change Email')}     className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm" style={menuItemStyle} onMouseEnter={menuItemHover} onMouseLeave={menuItemLeave}>
                  <span>✉️</span><span>Change Email</span>
                </button>
                <button onClick={() => setDemoPanel('Reset Password')}   className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm" style={menuItemStyle} onMouseEnter={menuItemHover} onMouseLeave={menuItemLeave}>
                  <span>🔒</span><span>Reset Password</span>
                </button>
                {onSettings && (
                  <button onClick={() => { setOpen(false); onSettings() }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm" style={menuItemStyle} onMouseEnter={menuItemHover} onMouseLeave={menuItemLeave}>
                    <span>⚙️</span><span>Settings</span>
                  </button>
                )}
              </div>

              <div className="mx-3 h-px" style={{ backgroundColor: C.border }} />

              <div className="py-1">
                <button onClick={handleLogout} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm" style={{ color: C.muted }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = C.danger }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = C.muted }}
                >
                  <span>🚪</span><span>Log out</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Notifications ──────────────────────────────────────────────────────────
// Demo-only. Hardcoded Women's-portal-themed notifications keyed to the
// features that exist elsewhere in this portal (ACL Prevention, Cycle
// Tracking, Pregnancy & RTP, Club Licensing, FSR, matchday). No API.

interface DemoNotification {
  id: string
  read: boolean
  icon: string
  cat: string
  title: string
  time: string
}

const WOMENS_NOTIFICATIONS: DemoNotification[] = [
  { id: '1', read: false, icon: '🔴', cat: 'ACL',       title: 'Emily Zhang composite risk 98 — load reduction required today',                time: '5 min ago' },
  { id: '2', read: false, icon: '🟡', cat: 'Welfare',   title: 'Sophie Lawson — Stage 9 RTP medical clearance window opens 28 May',           time: '32 min ago' },
  { id: '3', read: false, icon: '🔵', cat: 'Matchday',  title: 'Hartwell Women (H) — team sheet deadline in 2 hours',                          time: '1 hour ago' },
  { id: '4', read: true,  icon: '🌸', cat: 'Cycle',     title: 'Bea Chen opted in to Lumio Cycle — squad coverage now 14/22',                  time: '4 hours ago' },
  { id: '5', read: true,  icon: '🏛️', cat: 'Licensing', title: 'Annual licence review outcome — PROVISIONAL (4 of 6 categories green)',       time: 'Yesterday' },
  { id: '6', read: true,  icon: '✅', cat: 'FSR',       title: 'Q2 FSR submission acknowledged — within headroom (£380k available)',           time: 'Yesterday' },
]

export function WomensNotifications() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<DemoNotification[]>(WOMENS_NOTIFICATIONS)
  const unread = items.filter(n => !n.read).length

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        title="Notifications"
        aria-label="Notifications"
        style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: C.panel, border: `1px solid ${C.border}`, color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}
      >
        <Bell size={16} strokeWidth={1.75} />
        {unread > 0 && (
          <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', backgroundColor: C.danger }} />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[79]" onClick={() => setOpen(false)} />
          <div
            className="fixed top-0 right-0 h-full z-[80] flex flex-col"
            style={{ width: 380, backgroundColor: C.panel, borderLeft: `1px solid ${C.border}`, boxShadow: '-8px 0 32px rgba(0,0,0,0.4)' }}
          >
            <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold" style={{ color: C.text }}>Notifications</h2>
                {unread > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: C.danger }}>{unread}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {unread > 0 && (
                  <button
                    onClick={() => setItems(p => p.map(n => ({ ...n, read: true })))}
                    className="text-xs font-medium"
                    style={{ color: C.accent }}
                  >
                    Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} style={{ color: C.muted2 }} aria-label="Close notifications">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {items.map(n => (
                <div
                  key={n.id}
                  onClick={() => setItems(p => p.map(x => x.id === n.id ? { ...x, read: true } : x))}
                  className="px-5 py-4 cursor-pointer"
                  style={{
                    borderBottom: `1px solid ${C.border}`,
                    borderLeft: n.read ? 'none' : `3px solid ${C.accentDeep}`,
                    backgroundColor: n.read ? 'transparent' : 'rgba(190,24,93,0.04)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-base"
                      style={{ backgroundColor: C.border }}
                    >
                      {n.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: C.accentDim, color: '#F9A8D4' }}
                        >
                          {n.cat}
                        </span>
                        {!n.read && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: C.accentDeep }} />}
                      </div>
                      <p className="text-sm font-medium" style={{ color: n.read ? C.muted2 : C.text }}>{n.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: C.muted2 }}>{n.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  )
}
