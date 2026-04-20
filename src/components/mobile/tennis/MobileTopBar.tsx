'use client'
import React from 'react'
import { Search, Bell } from 'lucide-react'

export type MobileTopBarProps = {
  subtitle?: string
  photoUrl?: string | null
  initials: string
  onSearch?: () => void
  onBell?: () => void
  onAvatar?: () => void
  /**
   * @deprecated Retained for compatibility with the first-pass signature.
   * The prototype shows the date in the hero block instead.
   */
  datePill?: string
}

export function MobileTopBar({
  subtitle = 'TENNIS · MONTE-CARLO',
  photoUrl,
  initials,
  onSearch,
  onBell,
  onAvatar,
}: MobileTopBarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-2.5">
        <div
          className="w-[26px] h-[26px] rounded-lg flex items-center justify-center text-[13px] font-extrabold text-white"
          style={{
            background: 'linear-gradient(135deg, var(--violet), var(--fuchsia))',
            boxShadow: '0 4px 14px -4px rgba(168, 85, 247, 0.6)',
          }}
        >
          L
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
          aria-label="Notifications"
          className="w-8 h-8 rounded-full flex items-center justify-center relative"
          style={{ color: 'var(--text-muted)' }}
        >
          <Bell size={16} />
          <span
            className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--fuchsia)' }}
          />
        </button>
        <button
          onClick={onAvatar}
          aria-label="Profile"
          className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-[10px] font-bold text-white"
          style={{
            background: 'linear-gradient(135deg, var(--violet), var(--fuchsia))',
            boxShadow: '0 0 0 2px rgb(13, 8, 32), 0 0 0 4px rgb(168, 85, 247)',
          }}
        >
          {photoUrl
            /* eslint-disable-next-line @next/next/no-img-element */
            ? <img src={photoUrl} alt="" className="w-full h-full object-cover" />
            : initials}
        </button>
      </div>
    </div>
  )
}
