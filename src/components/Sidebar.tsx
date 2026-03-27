// updated: March 27 2026
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X, Bell } from 'lucide-react'
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
  Database,
  Layers,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const navItems: {
  label: string
  href: string
  icon: LucideIcon
  badge: number | null
  accent?: string
}[] = [
  { label: 'Overview',          href: '/overview',    icon: LayoutDashboard, badge: null },
  { label: 'Insights',          href: '/insights',    icon: Sparkles,        badge: null, accent: '#6C3FC5' },
  { label: 'Partners',          href: '/partners',    icon: Handshake,       badge: null },
  { label: 'HR & People',       href: '/hr',          icon: Users,           badge: 3    },
  { label: 'Accounts',          href: '/accounts',    icon: Building2,       badge: null },
  { label: 'Sales',             href: '/sales',       icon: TrendingUp,      badge: 12   },
  { label: 'CRM',               href: '/crm',         icon: Database,        badge: null },
  { label: 'Marketing',         href: '/marketing',   icon: Megaphone,       badge: null },
  { label: 'Trials',            href: '/trials',      icon: FlaskConical,    badge: null },
  { label: 'Operations',        href: '/operations',  icon: Package,         badge: null },
  { label: 'Support',           href: '/support',     icon: Headphones,      badge: 5    },
  { label: 'Success',           href: '/success',     icon: Activity,        badge: 2    },
  { label: 'Strategy',          href: '/strategy',    icon: Target,          badge: null },
  { label: 'IT & Systems',      href: '/it',          icon: Server,          badge: 1    },
  { label: 'Projects',          href: '/projects',    icon: Layers,          badge: null },
  { label: 'Workflows Library', href: '/workflows',   icon: GitBranch,       badge: null },
  { label: 'Settings',          href: '/settings',    icon: Settings,        badge: null },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [companyName, setCompanyName] = useState('Lumio')
  const [initials, setInitials] = useState('AM')
  const [planLabel, setPlanLabel] = useState('Live workspace')
  useEffect(() => {
    const stored = localStorage.getItem('lumio_company_name')
    if (stored) setCompanyName(stored)
    const storedInitials = localStorage.getItem('lumio_company_initials')
    if (storedInitials) setInitials(storedInitials)
    const storedPlan = localStorage.getItem('lumio_company_plan')
    if (storedPlan) setPlanLabel(`${storedPlan.charAt(0).toUpperCase() + storedPlan.slice(1)} plan`)
  }, [])

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
          'md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        ].join(' ')}
        style={{ width: '200px', backgroundColor: '#07080F', borderRight: '1px solid #1F2937' }}
      >
        {/* Workspace identity — top */}
        <div
          className="flex shrink-0 items-center gap-2.5 px-4 py-4"
          style={{ borderBottom: '1px solid #1F2937' }}
        >
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold shrink-0"
            style={{ backgroundColor: '#6C3FC5', color: '#F9FAFB' }}
          >
            {companyName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: '#F9FAFB' }}>{companyName}</p>
            <p className="text-[10px] truncate" style={{ color: '#6B7280' }}>{planLabel}</p>
          </div>
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
            const isActive = pathname.startsWith(href)
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
                  color: isActive ? '#F9FAFB' : '#9CA3AF',
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

        {/* Bottom section: avatar + bell + logo */}
        <div className="mt-auto" style={{ borderTop: '1px solid #1F2937' }}>
          <div className="flex items-center gap-2 px-4 py-3">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold shrink-0"
              style={{ backgroundColor: '#6C3FC5', color: '#F9FAFB' }}
            >
              {initials}
            </div>
            <span className="flex-1 text-xs font-medium truncate" style={{ color: '#9CA3AF' }}>{initials}</span>
            <button
              className="relative flex items-center justify-center rounded-lg p-1.5 transition-colors"
              style={{ color: '#9CA3AF' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#F9FAFB' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#9CA3AF' }}
              aria-label="Notifications"
            >
              <Bell size={16} strokeWidth={1.75} />
              <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#0D9488' }} />
            </button>
          </div>
          <div className="px-4 pb-3">
            <a href="https://lumiocms.com" target="_blank" rel="noreferrer" className="block opacity-40 hover:opacity-70 transition-opacity">
              <Image
                src="/lumio-transparent-new.png"
                alt="Lumio"
                width={180}
                height={90}
                style={{ width: '80px', height: 'auto', objectFit: 'contain' }}
              />
            </a>
          </div>
        </div>
      </aside>
    </>
  )
}
