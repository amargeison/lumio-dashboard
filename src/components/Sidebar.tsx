// updated: March 28 2026
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X, Bell, Pin } from 'lucide-react'
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

const COLLAPSED_W = 48
const EXPANDED_W = 200

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [companyName, setCompanyName] = useState('Lumio')
  const [initials, setInitials] = useState('AM')
  const [planLabel, setPlanLabel] = useState('Live workspace')
  const [pinned, setPinned] = useState(false)
  const [hovered, setHovered] = useState(false)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('lumio_company_name')
    if (stored) setCompanyName(stored)
    const storedInitials = localStorage.getItem('lumio_company_initials')
    if (storedInitials) setInitials(storedInitials)
    const storedPlan = localStorage.getItem('lumio_company_plan')
    if (storedPlan) setPlanLabel(`${storedPlan.charAt(0).toUpperCase() + storedPlan.slice(1)} plan`)
    const storedPinned = localStorage.getItem('lumio_sidebar_pinned')
    if (storedPinned === 'true') setPinned(true)
  }, [])

  const togglePin = useCallback(() => {
    setPinned(p => {
      const next = !p
      localStorage.setItem('lumio_sidebar_pinned', String(next))
      return next
    })
  }, [])

  const expanded = pinned || hovered

  function handleMouseEnter() {
    if (leaveTimer.current) { clearTimeout(leaveTimer.current); leaveTimer.current = null }
    setHovered(true)
  }
  function handleMouseLeave() {
    leaveTimer.current = setTimeout(() => setHovered(false), 400)
  }

  const sidebarWidth = expanded ? EXPANDED_W : COLLAPSED_W

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={onClose} />
      )}

      {/* Desktop sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-50 hidden md:flex flex-col overflow-hidden"
        style={{
          width: sidebarWidth,
          backgroundColor: '#07080F',
          borderRight: '1px solid #1F2937',
          transition: 'width 250ms ease',
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Workspace identity — top */}
        <div className="flex shrink-0 items-center gap-2.5 px-2.5 py-4" style={{ borderBottom: '1px solid #1F2937', minHeight: 56 }}>
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold shrink-0"
            style={{ backgroundColor: '#6C3FC5', color: '#F9FAFB' }}
          >
            {companyName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          {expanded && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: '#F9FAFB' }}>{companyName}</p>
                <p className="text-[10px] truncate" style={{ color: '#6B7280' }}>{planLabel}</p>
              </div>
              <button
                onClick={togglePin}
                className="flex items-center justify-center rounded p-1 transition-colors shrink-0"
                style={{ color: pinned ? '#0D9488' : '#4B5563', transform: pinned ? 'rotate(0deg)' : 'rotate(45deg)' }}
                title={pinned ? 'Unpin sidebar' : 'Pin sidebar open'}
              >
                <Pin size={14} strokeWidth={2} />
              </button>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-1.5 py-3">
          {navItems.map(({ label, href, icon: Icon, badge, accent }) => {
            const isActive = pathname.startsWith(href)
            const activeColor = accent ?? '#0D9488'
            const hoverBg = accent ? `${accent}1a` : '#111318'

            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: isActive ? activeColor : 'transparent',
                  color: isActive ? '#F9FAFB' : '#9CA3AF',
                  paddingLeft: expanded ? 12 : 0,
                  paddingRight: expanded ? 12 : 0,
                  justifyContent: expanded ? 'flex-start' : 'center',
                }}
                title={expanded ? undefined : label}
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
                {expanded && <span className="flex-1 truncate">{label}</span>}
                {expanded && badge !== null && (
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
        <div className="mt-auto shrink-0" style={{ borderTop: '1px solid #1F2937' }}>
          <div className="flex items-center gap-2 px-2.5 py-3" style={{ justifyContent: expanded ? 'flex-start' : 'center' }}>
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold shrink-0"
              style={{ backgroundColor: '#6C3FC5', color: '#F9FAFB' }}
            >
              {initials}
            </div>
            {expanded && (
              <>
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
              </>
            )}
          </div>
          {expanded && (
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
          )}
        </div>
      </aside>

      {/* Mobile sidebar — full overlay */}
      {isOpen && (
        <aside
          className="fixed inset-y-0 left-0 z-50 flex flex-col md:hidden"
          style={{ width: EXPANDED_W, backgroundColor: '#07080F', borderRight: '1px solid #1F2937' }}
        >
          <div className="flex shrink-0 items-center gap-2.5 px-4 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold shrink-0"
              style={{ backgroundColor: '#6C3FC5', color: '#F9FAFB' }}>
              {companyName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: '#F9FAFB' }}>{companyName}</p>
              <p className="text-[10px] truncate" style={{ color: '#6B7280' }}>{planLabel}</p>
            </div>
            <button onClick={onClose} style={{ color: '#9CA3AF' }}><X size={18} strokeWidth={1.75} /></button>
          </div>
          <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-3">
            {navItems.map(({ label, href, icon: Icon, badge, accent }) => {
              const isActive = pathname.startsWith(href)
              return (
                <Link key={href} href={href} onClick={onClose}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium"
                  style={{ backgroundColor: isActive ? (accent ?? '#0D9488') : 'transparent', color: isActive ? '#F9FAFB' : '#9CA3AF' }}>
                  <Icon size={17} strokeWidth={1.75} className="shrink-0" />
                  <span className="flex-1 truncate">{label}</span>
                  {badge !== null && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold"
                      style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : '#1F2937', color: isActive ? '#F9FAFB' : '#9CA3AF' }}>
                      {badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
          <div className="mt-auto px-4 pb-3" style={{ borderTop: '1px solid #1F2937' }}>
            <div className="flex items-center gap-2 py-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold shrink-0"
                style={{ backgroundColor: '#6C3FC5', color: '#F9FAFB' }}>{initials}</div>
              <span className="flex-1 text-xs font-medium truncate" style={{ color: '#9CA3AF' }}>{initials}</span>
            </div>
            <a href="https://lumiocms.com" target="_blank" rel="noreferrer" className="block opacity-40 hover:opacity-70 transition-opacity">
              <Image src="/lumio-transparent-new.png" alt="Lumio" width={180} height={90}
                style={{ width: '80px', height: 'auto', objectFit: 'contain' }} />
            </a>
          </div>
        </aside>
      )}
    </>
  )
}
