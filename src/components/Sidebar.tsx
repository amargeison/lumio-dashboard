// updated: March 28 2026
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { X, Pin, LogOut, Settings as SettingsIcon, User, Crown } from 'lucide-react'
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
import { getDeptStaff } from '@/lib/staff/deptMatch'
import { getClientRole } from '@/lib/check-role'
import { canAccessDept } from '@/lib/permissions'

const BASE_NAV_ITEMS: {
  label: string
  path: string
  icon: LucideIcon
  badge: number | null
  accent?: string
}[] = [
  { label: 'Overview',          path: '',             icon: LayoutDashboard, badge: null },
  { label: 'Insights',          path: '/insights',    icon: Sparkles,        badge: null, accent: '#6C3FC5' },
  { label: 'Partners',          path: '/partners',    icon: Handshake,       badge: null },
  { label: 'HR & People',       path: '/hr',          icon: Users,           badge: null },
  { label: 'Accounts',          path: '/accounts',    icon: Building2,       badge: null },
  { label: 'Strategy',          path: '/strategy',    icon: Target,          badge: null },
  { label: 'Trials',            path: '/trials',      icon: FlaskConical,    badge: null },
  { label: 'Sales',             path: '/sales',       icon: TrendingUp,      badge: null },
  { label: 'CRM',               path: '/crm',         icon: Database,        badge: null },
  { label: 'Marketing',         path: '/marketing',   icon: Megaphone,       badge: null },
  { label: 'Projects',          path: '/projects',    icon: Layers,          badge: null },
  { label: 'Operations',        path: '/operations',  icon: Package,         badge: null },
  { label: 'Support',           path: '/support',     icon: Headphones,      badge: null },
  { label: 'Success',           path: '/success',     icon: Activity,        badge: null },
  { label: 'IT & Systems',      path: '/it',          icon: Server,          badge: null },
  { label: 'Workflows Library', path: '/workflows',   icon: GitBranch,       badge: null },
  { label: 'Directors Suite',  path: '/directors',   icon: Crown,           badge: null, accent: '#F1C40F' },
  { label: 'Settings',          path: '/settings',    icon: Settings,        badge: null },
]

function resolveSlug(): string {
  if (typeof window === 'undefined') return ''
  // 1. URL is source of truth
  const urlParts = window.location.pathname.split('/').filter(Boolean)
  if (urlParts.length >= 1 && !DASHBOARD_ROUTE_SET.has(urlParts[0])) return urlParts[0]
  // 2. Cookie set by middleware
  const cookie = document.cookie.split('; ').find(r => r.startsWith('lumio_tenant_slug='))?.split('=')[1]
  if (cookie) return cookie
  // 3. localStorage fallback
  return localStorage.getItem('lumio_workspace_slug') || ''
}

const DASHBOARD_ROUTE_SET = new Set([
  'hr', 'accounts', 'sales', 'crm', 'marketing', 'operations', 'it',
  'insights', 'workflows', 'strategy', 'trials', 'partners', 'support',
  'success', 'settings', 'projects', 'onboarding', 'overview',
])

const COLLAPSED_W = 72
const EXPANDED_W = 200

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [tenantSlug, setTenantSlug] = useState('')
  const [mounted, setMounted] = useState(false)

  // Resolve slug on mount and pathname changes (client-side only)
  useEffect(() => {
    setTenantSlug(resolveSlug())
    setMounted(true)
  }, [pathname])

  // Re-render when role changes via the demo switcher
  const [, forceRender] = useState(0)
  useEffect(() => {
    const handler = () => forceRender(n => n + 1)
    window.addEventListener('lumio-role-changed', handler)
    window.addEventListener('lumio-settings-changed', handler)
    return () => { window.removeEventListener('lumio-role-changed', handler); window.removeEventListener('lumio-settings-changed', handler) }
  }, [])

  const userRole = typeof window !== 'undefined' ? getClientRole() : { role: 'user' as const, role_level: 4 as const, isOwner: false }
  const effectiveLevel = userRole.isOwner ? 1 : userRole.role_level
  const navItems = BASE_NAV_ITEMS
    .filter(item => {
      const dept = item.path.replace('/', '') || 'overview'
      return canAccessDept(dept, effectiveLevel)
    })
    .map(item => ({
      ...item,
      href: tenantSlug ? `/${tenantSlug}${item.path}` : (item.path || '/overview'),
      path: item.path,
    }))
  const [companyName, setCompanyName] = useState('Lumio')
  const [initials, setInitials] = useState('AM')
  const [planLabel, setPlanLabel] = useState('Live workspace')
  const [pinned, setPinned] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [companyLogo, setCompanyLogo] = useState<string | null>(null)
  const [companyLogoKey, setCompanyLogoKey] = useState(Date.now())
  const [activeDepts, setActiveDepts] = useState<Set<string>>(new Set())
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const avatarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem('lumio_company_name')
    if (stored) setCompanyName(stored)
    const storedInitials = localStorage.getItem('lumio_company_initials')
    if (storedInitials) setInitials(storedInitials)
    const storedPlan = localStorage.getItem('lumio_company_plan')
    if (storedPlan) setPlanLabel(`${storedPlan.charAt(0).toUpperCase() + storedPlan.slice(1)} plan`)
    const storedPinned = localStorage.getItem('lumio_sidebar_pinned')
    if (storedPinned === 'true') setPinned(true)
    // Instant cache: show logo from localStorage immediately (no flash)
    const storedLogo = localStorage.getItem('lumio_company_logo') || localStorage.getItem('workspace_company_logo') || null
    if (storedLogo && (storedLogo.startsWith('http') || storedLogo.startsWith('blob') || storedLogo.startsWith('/'))) {
      setCompanyLogo(storedLogo)
    }
    // Always fetch from Supabase in background to confirm/update
    const token = localStorage.getItem('workspace_session_token')
    if (token) {
      fetch('/api/workspace/status', { headers: { 'x-workspace-token': token } })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.logo_url) {
            setCompanyLogo(data.logo_url)
            localStorage.setItem('lumio_company_logo', data.logo_url)
            localStorage.setItem('workspace_company_logo', data.logo_url)
          }
        })
        .catch(() => {})
    }
    const storedName = localStorage.getItem('lumio_user_name')
    if (storedName) setUserName(storedName)
    const storedEmail = localStorage.getItem('lumio_user_email')
    if (storedEmail) setUserEmail(storedEmail)
    // Listen for logo/name updates from other pages (cross-tab)
    function onStorage(e: StorageEvent) {
      if (e.key === 'lumio_company_logo' || e.key === 'workspace_company_logo') {
        const logo = localStorage.getItem('lumio_company_logo') || localStorage.getItem('workspace_company_logo') || null
        setCompanyLogo(logo)
      }
      if (e.key === 'lumio_company_name') setCompanyName(e.newValue || 'Lumio')
    }
    // Listen for same-tab logo updates (e.g. from Settings page upload or remove)
    function onLogoUpdated(e: Event) {
      const d = (e as CustomEvent).detail
      const url = typeof d === 'object' && d !== null ? d.logo : d
      setCompanyLogo(url || null)
      setCompanyLogoKey(Date.now())
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('lumio-logo-updated', onLogoUpdated)
    // Detect active departments from imported staff — only when real data exists (not demo)
    const isDemoActive = localStorage.getItem('lumio_demo_active') === 'true'
    if (!isDemoActive) {
      // Only show dept indicators if user has genuinely imported staff (not stale demo data)
      const hasAnyRealData = localStorage.getItem('lumio_staff_imported_source') === 'supabase'
      if (hasAnyRealData) {
        const deptKeys = ['sales', 'hr', 'marketing', 'accounts', 'operations', 'it', 'support', 'success', 'partners', 'strategy', 'trials', 'projects', 'insights']
        const active = new Set<string>()
        deptKeys.forEach(d => { if (getDeptStaff(d).length > 0) active.add(d) })
        setActiveDepts(active)
      }
    }
    return () => { window.removeEventListener('storage', onStorage); window.removeEventListener('lumio-logo-updated', onLogoUpdated) }
  }, [])

  const togglePin = useCallback(() => {
    setPinned(p => {
      const next = !p
      localStorage.setItem('lumio_sidebar_pinned', String(next))
      return next
    })
  }, [])

  const handleSignOut = useCallback(() => {
    localStorage.clear()
    router.push('/login')
  }, [router])

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
        {/* Workspace identity — top (display only — upload in Settings) */}
        <div className="flex shrink-0 items-center justify-center" style={{ borderBottom: '1px solid #1F2937', minHeight: 72, padding: expanded ? '12px 10px' : '12px 4px', gap: expanded ? 10 : 0 }}>
          <div
            className="relative flex h-16 w-16 items-center justify-center rounded-xl shrink-0 overflow-hidden"
            style={{ backgroundColor: companyLogo ? 'transparent' : '#6C3FC5', color: '#F9FAFB', border: '1px solid #1F2937', fontSize: 26, fontWeight: 700 }}
          >
            {companyLogo ? (
              <img key={companyLogoKey} src={companyLogo} alt="Company logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} onError={() => setCompanyLogo(null)} />
            ) : (
              companyName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
            )}
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
          {navItems.map(({ label, href, icon: Icon, badge, accent, path }) => {
            const isActive = pathname.startsWith(href)
            const activeColor = accent ?? '#0D9488'
            const hoverBg = accent ? `${accent}1a` : '#111318'
            const deptKey = (path || '').replace('/', '')
            const hasDeptStaff = activeDepts.size > 0 && activeDepts.has(deptKey)

            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg py-2 text-sm transition-colors"
                style={{
                  backgroundColor: isActive ? activeColor : 'transparent',
                  color: isActive ? '#F9FAFB' : hasDeptStaff ? '#F9FAFB' : '#9CA3AF',
                  fontWeight: isActive || hasDeptStaff ? 600 : 400,
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
                {hasDeptStaff && !isActive && <span className="shrink-0 rounded-full" style={{ width: 6, height: 6, backgroundColor: '#22C55E' }} />}
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

        {/* Bottom logo — only show when expanded */}
        {expanded && (
          <div className="mt-auto shrink-0 flex items-center justify-center py-4 px-3">
            <a href="https://lumiocms.com" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-full">
              <img src="/lumio-transparent-new.png" alt="Lumio" style={{ width: '80%', maxWidth: 140, height: 'auto', opacity: 0.5, display: 'block' }} />
            </a>
          </div>
        )}
      </aside>

      {/* Mobile sidebar — full overlay */}
      {isOpen && (
        <aside
          className="fixed inset-y-0 left-0 z-50 flex flex-col md:hidden"
          style={{ width: EXPANDED_W, backgroundColor: '#07080F', borderRight: '1px solid #1F2937' }}
        >
          <div className="flex shrink-0 items-center justify-center" style={{ borderBottom: '1px solid #1F2937', minHeight: 72, padding: '12px 10px', gap: 10 }}>
            <div
              className="relative flex h-16 w-16 items-center justify-center rounded-xl shrink-0 overflow-hidden"
              style={{ backgroundColor: companyLogo ? 'transparent' : '#6C3FC5', color: '#F9FAFB', border: '1px solid #1F2937', fontSize: 26, fontWeight: 700 }}
            >
              {companyLogo ? (
                <img key={companyLogoKey} src={companyLogo} alt="Company logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} onError={() => setCompanyLogo(null)} />
              ) : (
                companyName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: '#F9FAFB' }}>{companyName}</p>
              <p className="text-[10px] truncate" style={{ color: '#6B7280' }}>{planLabel}</p>
            </div>
            <button onClick={onClose} style={{ color: '#9CA3AF' }}><X size={18} strokeWidth={1.75} /></button>
          </div>
          <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-3">
            {navItems.map(({ label, href, icon: Icon, badge, accent, path }) => {
              const isActive = pathname.startsWith(href)
              const deptKey = (path || '').replace('/', '')
              const hasDeptStaff = activeDepts.size > 0 && activeDepts.has(deptKey)
              return (
                <Link key={href} href={href} onClick={onClose}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm"
                  style={{ backgroundColor: isActive ? (accent ?? '#0D9488') : 'transparent', color: isActive ? '#F9FAFB' : hasDeptStaff ? '#F9FAFB' : '#9CA3AF', fontWeight: isActive || hasDeptStaff ? 600 : 400 }}>
                  {hasDeptStaff && !isActive && <span className="shrink-0 rounded-full" style={{ width: 6, height: 6, backgroundColor: '#22C55E' }} />}
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
          <div className="mt-auto shrink-0 flex items-center justify-center py-4 px-3">
            <a href="https://lumiocms.com" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-full">
              <img src="/lumio-transparent-new.png" alt="Lumio" style={{ width: '80%', maxWidth: 140, height: 'auto', opacity: 0.5, display: 'block' }} />
            </a>
          </div>
        </aside>
      )}
    </>
  )
}
// force Mon Mar 30 19:41:44 GMTST 2026

