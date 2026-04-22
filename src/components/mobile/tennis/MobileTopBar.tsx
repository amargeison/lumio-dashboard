'use client'
import React from 'react'
import { Search, Bell } from 'lucide-react'

export type MobileTopBarProps = {
  subtitle?: string
  /**
   * Player photo URL. Falls back to initials on missing asset or image load
   * error.
   */
  photoUrl?: string | null
  initials: string
  /**
   * Team / brand logo URL (e.g., the Lumio Tennis Club crest). Renders in
   * place of the generic violet "L" badge when supplied.
   */
  logoUrl?: string | null
  /**
   * Unread count rendered as a red pill top-right of the bell icon. No pill
   * when 0 or undefined.
   */
  unreadCount?: number
  onSearch?: () => void
  onBell?: () => void
  onAvatar?: () => void
}

export function MobileTopBar({
  subtitle = 'TENNIS · MONTE-CARLO',
  photoUrl,
  initials,
  logoUrl,
  unreadCount,
  onSearch,
  onBell,
  onAvatar,
}: MobileTopBarProps) {
  const [photoOk, setPhotoOk] = React.useState(true)
  const [logoOk, setLogoOk] = React.useState(true)
  const unreadPill =
    typeof unreadCount === 'number' && unreadCount > 0
      ? unreadCount > 99 ? '99+' : String(unreadCount)
      : null
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-2.5">
        <div
          className="w-[26px] h-[26px] rounded-lg flex items-center justify-center overflow-hidden text-[13px] font-extrabold text-white"
          style={{
            background: logoUrl && logoOk
              ? 'rgba(255, 255, 255, 0.06)'
              : 'linear-gradient(135deg, var(--violet), var(--fuchsia))',
            border: logoUrl && logoOk
              ? '1px solid rgba(168, 85, 247, 0.28)'
              : undefined,
            boxShadow: '0 4px 14px -4px rgba(168, 85, 247, 0.6)',
          }}
        >
          {logoUrl && logoOk ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={logoUrl}
              alt=""
              onError={() => setLogoOk(false)}
              className="w-full h-full object-contain p-[2px]"
            />
          ) : 'L'}
        </div>
        <div className="leading-none">
          <div
            className="text-[14px] font-bold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Lumio
          </div>
          <div
            className="text-[9.5px] font-semibold uppercase mt-[3px]"
            style={{
              fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
              color: 'var(--text-meta)',
              letterSpacing: '0.5px',
            }}
          >
            {subtitle}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onSearch}
          aria-label="Search"
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ color: 'var(--text-muted)' }}
        >
          <Search size={16} />
        </button>
        <button
          onClick={onBell}
          aria-label={unreadPill ? `Notifications — ${unreadPill} unread` : 'Notifications'}
          className="w-8 h-8 rounded-full flex items-center justify-center relative"
          style={{ color: 'var(--text-muted)' }}
        >
          <Bell size={16} />
          {unreadPill ? (
            <span
              className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-[4px] rounded-lg flex items-center justify-center font-extrabold text-white"
              style={{
                background: 'rgb(239, 68, 68)',
                fontSize: 9,
                lineHeight: 1,
                border: '1.5px solid rgb(13, 8, 32)',
              }}
            >
              {unreadPill}
            </span>
          ) : (
            <span
              className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--fuchsia)' }}
            />
          )}
        </button>
        <button
          onClick={onAvatar}
          aria-label="Profile"
          className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-[10px] font-bold text-white"
          style={{
            background: photoUrl && photoOk
              ? 'rgb(22, 16, 43)'
              : 'linear-gradient(135deg, var(--violet), var(--fuchsia))',
            boxShadow: '0 0 0 2px rgb(13, 8, 32), 0 0 0 4px rgb(168, 85, 247)',
          }}
        >
          {photoUrl && photoOk ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={photoUrl}
              alt=""
              onError={() => setPhotoOk(false)}
              className="w-full h-full object-cover"
            />
          ) : initials}
        </button>
      </div>
    </div>
  )
}
