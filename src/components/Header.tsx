'use client'

import { usePathname } from 'next/navigation'
import { Bell, Menu } from 'lucide-react'

const pageTitles: Record<string, string> = {
  '/':          'Overview',
  '/hr':        'HR & People',
  '/sales':     'Sales & CRM',
  '/support':   'Support',
  '/trials':    'Trials',
  '/success':   'Success',
  '/accounts':  'Accounts',
  '/marketing': 'Marketing',
  '/it':        'IT & Systems',
  '/workflows': 'Workflows Library',
  '/settings':  'Settings',
}

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname()
  const title = pageTitles[pathname] ?? 'Lumio'

  return (
    <header
      className="fixed top-0 right-0 z-30 flex h-16 items-center justify-between px-4 md:px-6"
      style={{
        left: 0,
        backgroundColor: '#07080F',
        borderBottom: '1px solid #1F2937',
      }}
    >
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          className="flex items-center justify-center rounded-lg p-2 transition-colors md:hidden"
          style={{ color: '#9CA3AF' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#111318'
            e.currentTarget.style.color = '#F9FAFB'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = '#9CA3AF'
          }}
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu size={20} strokeWidth={1.75} />
        </button>

        {/* On desktop offset for sidebar width */}
        <h1
          className="text-base font-semibold md:pl-[200px]"
          style={{ color: '#F9FAFB' }}
        >
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <button
          className="relative flex items-center justify-center rounded-lg p-2 transition-colors"
          style={{ color: '#9CA3AF' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#111318'
            e.currentTarget.style.color = '#F9FAFB'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = '#9CA3AF'
          }}
          aria-label="Notifications"
        >
          <Bell size={18} strokeWidth={1.75} />
          <span
            className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
            style={{ backgroundColor: '#0D9488' }}
          />
        </button>

        {/* User avatar */}
        <button
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors"
          style={{ color: '#9CA3AF' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#111318'
            e.currentTarget.style.color = '#F9FAFB'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = '#9CA3AF'
          }}
        >
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold"
            style={{ backgroundColor: '#6C3FC5', color: '#F9FAFB' }}
          >
            A
          </div>
          <span className="hidden sm:block">Arron</span>
        </button>
      </div>
    </header>
  )
}
