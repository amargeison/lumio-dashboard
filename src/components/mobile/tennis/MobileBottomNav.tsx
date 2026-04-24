'use client'
import React from 'react'
import { Home, Activity, Users, MoreHorizontal } from 'lucide-react'

export type MobileNavKey = 'home' | 'match' | 'training' | 'team' | 'more'

export type MobileBottomNavProps = {
  active: MobileNavKey
  onSelect: (key: MobileNavKey) => void
}

function TennisBallIcon({ size = 22, strokeWidth = 1.8 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M5 7 Q 12 12 19 7" />
      <path d="M5 17 Q 12 12 19 17" />
    </svg>
  )
}

type NavItem = {
  key: MobileNavKey
  label: string
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
}

const ITEMS: NavItem[] = [
  { key: 'home',     label: 'Home',     Icon: Home },
  { key: 'match',    label: 'Match',    Icon: TennisBallIcon },
  { key: 'training', label: 'Training', Icon: Activity },
  { key: 'team',     label: 'Team',     Icon: Users },
  { key: 'more',     label: 'More',     Icon: MoreHorizontal },
]

export function MobileBottomNav({ active, onSelect }: MobileBottomNavProps) {
  return (
    <nav
      className="fixed left-0 right-0 bottom-0 z-40 mobile-bottom-nav"
      style={{
        background: 'rgba(13, 8, 32, 0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(168, 85, 247, 0.22)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-stretch h-16 px-2 gap-1">
        {ITEMS.map(({ key, label, Icon }) => {
          const isActive = active === key
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 rounded-[14px] transition-transform active:scale-[0.92] relative"
              style={{
                background: isActive ? 'rgba(168, 85, 247, 0.19)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              <div
                className="relative flex items-center justify-center"
                style={{
                  color: isActive ? 'var(--fuchsia)' : 'var(--text-muted)',
                  filter: isActive && key === 'home' ? 'drop-shadow(0 0 6px color-mix(in srgb, var(--fuchsia) 45%, transparent))' : undefined,
                }}
              >
                <Icon size={22} strokeWidth={isActive ? 2.4 : 1.8} />
              </div>
              <span
                className="font-semibold"
                style={{ fontSize: 10 }}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>

      {/* iOS home indicator bar */}
      <div className="h-[22px] flex items-center justify-center">
        <span
          className="block"
          style={{
            width: 110,
            height: 4,
            borderRadius: 2,
            background: 'rgba(255, 255, 255, 0.5)',
          }}
        />
      </div>
    </nav>
  )
}
