'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Headphones,
  FlaskConical,
  Activity,
  Building2,
  Megaphone,
  Server,
  Package,
  GitBranch,
  Sparkles,
  Settings,
  Handshake,
  Target,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const navItems: {
  label: string
  href: string
  icon: LucideIcon
  badge: number | null
  accent?: string
}[] = [
  { label: 'Overview',          href: '/',            icon: LayoutDashboard, badge: null },
  { label: 'Insights',          href: '/insights',    icon: Sparkles,        badge: null, accent: '#6C3FC5' },
  { label: 'Partners',          href: '/partners',    icon: Handshake,       badge: null },
  { label: 'HR & People',       href: '/hr',          icon: Users,           badge: 3    },
  { label: 'Accounts',          href: '/accounts',    icon: Building2,       badge: null },
  { label: 'Sales & CRM',       href: '/sales',       icon: TrendingUp,      badge: 12   },
  { label: 'Marketing',         href: '/marketing',   icon: Megaphone,       badge: null },
  { label: 'Trials',            href: '/trials',      icon: FlaskConical,    badge: null },
  { label: 'Operations',        href: '/operations',  icon: Package,         badge: null },
  { label: 'Support',           href: '/support',     icon: Headphones,      badge: 5    },
  { label: 'Success',           href: '/success',     icon: Activity,        badge: 2    },
  { label: 'Strategy',          href: '/strategy',    icon: Target,          badge: null },
  { label: 'IT & Systems',      href: '/it',          icon: Server,          badge: 1    },
  { label: 'Workflows Library', href: '/workflows',   icon: GitBranch,       badge: null },
  { label: 'Settings',          href: '/settings',    icon: Settings,        badge: null },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex flex-col transition-transform duration-300',
          // Mobile: slide in/out; Desktop: always visible
          'md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        ].join(' ')}
        style={{ width: '200px', backgroundColor: '#07080F', borderRight: '1px solid #1F2937' }}
      >
        {/* Logo */}
        <div
          className="flex shrink-0 items-center justify-between px-5 py-5"
          style={{ borderBottom: '1px solid #1F2937' }}
        >
          <Image
            src="/lumio-transparent-new.png"
            alt="Lumio"
            width={360}
            height={180}
            style={{ width: '180px', height: 'auto', objectFit: 'contain' }}
            className="block"
            priority
          />
          {/* Close button — mobile only */}
          <button
            className="flex items-center justify-center rounded-lg p-1 md:hidden"
            style={{ color: '#9CA3AF' }}
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-3">
          {navItems.map(({ label, href, icon: Icon, badge, accent }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
            const activeColor = accent ?? '#0D9488'
            const hoverBg = accent ? `${accent}1a` : '#111318'

            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: isActive ? activeColor : 'transparent',
                  color: isActive ? '#F9FAFB' : accent ?? '#9CA3AF',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = hoverBg
                    e.currentTarget.style.color = accent ?? '#F9FAFB'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = accent ?? '#9CA3AF'
                  }
                }}
              >
                <Icon size={17} strokeWidth={1.75} className="shrink-0" />
                <span className="flex-1 truncate">{label}</span>
                {badge !== null && (
                  <span
                    className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold"
                    style={{
                      backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : '#1F2937',
                      color: isActive ? '#F9FAFB' : '#9CA3AF',
                    }}
                  >
                    {badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div
          className="shrink-0 px-6 py-3 text-xs"
          style={{ borderTop: '1px solid #1F2937', color: '#9CA3AF' }}
        >
          Lumio v0.1
        </div>
      </aside>
    </>
  )
}
