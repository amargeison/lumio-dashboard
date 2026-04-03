'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Bell, Settings as SettingsIcon, LayoutDashboard, Sparkles,
  Users, TrendingUp, Database, Megaphone, Package, Headphones, Activity,
  Server, GitBranch, Crown, Target, Building2, Layers, Handshake, FlaskConical,
  ChevronLeft,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import CRMSidebar from '@/components/crm/CRMSidebar'
import NotificationsPanel from '@/components/dashboard/NotificationsPanel'
import AvatarDropdown from '@/components/dashboard/AvatarDropdown'

const MAIN_NAV = [
  { label: 'Overview',          path: '',             icon: LayoutDashboard },
  { label: 'Insights',          path: '/insights',    icon: Sparkles },
  { label: 'Partners',          path: '/partners',    icon: Handshake },
  { label: 'HR & People',       path: '/hr',          icon: Users },
  { label: 'Accounts',          path: '/accounts',    icon: Building2 },
  { label: 'Strategy',          path: '/strategy',    icon: Target },
  { label: 'Sales',             path: '/sales',       icon: TrendingUp },
  { label: 'CRM',               path: '/crm',         icon: Database },
  { label: 'Marketing',         path: '/marketing',   icon: Megaphone },
  { label: 'Projects',          path: '/projects',    icon: Layers },
  { label: 'Operations',        path: '/operations',  icon: Package },
  { label: 'Support',           path: '/support',     icon: Headphones },
  { label: 'Success',           path: '/success',     icon: Activity },
  { label: 'IT & Systems',      path: '/it',          icon: Server },
  { label: 'Workflows Library', path: '/workflows',   icon: GitBranch },
  { label: 'Directors Suite',   path: '/directors',   icon: Crown },
  { label: 'Settings',          path: '/settings',    icon: SettingsIcon },
]

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [initials, setInitials] = useState('AM')

  useEffect(() => {
    const storedInitials = localStorage.getItem('lumio_company_initials')
    if (storedInitials) setInitials(storedInitials)
  }, [])

  const [demoActive, setDemoActive] = useState(() => typeof window !== 'undefined' && localStorage.getItem('lumio_demo_active') === 'true')
  const [mainSidebarOpen, setMainSidebarOpen] = useState(false)
  const sidebarTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const slug = typeof window !== 'undefined' ? (localStorage.getItem('lumio_workspace_slug') || localStorage.getItem('lumio_slug') || '') : ''
  const companyName = typeof window !== 'undefined' ? (localStorage.getItem('lumio_company_name') || 'Lumio') : 'Lumio'

  function openMainSidebar() { if (sidebarTimer.current) clearTimeout(sidebarTimer.current); setMainSidebarOpen(true) }
  function closeMainSidebar() { sidebarTimer.current = setTimeout(() => setMainSidebarOpen(false), 200) }

  return (
    <div className="flex" style={{ minHeight: '100vh' }}>
      {/* Hover trigger zone — thin strip on left edge */}
      <div onMouseEnter={openMainSidebar} style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 8, zIndex: 60 }} />

      {/* Sliding main Lumio sidebar */}
      <div
        onMouseEnter={openMainSidebar}
        onMouseLeave={closeMainSidebar}
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, width: 220, zIndex: 55,
          backgroundColor: '#07080F', borderRight: '1px solid #1F2937',
          transform: mainSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div className="px-4 py-3 shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-2 mb-1">
            <ChevronLeft size={12} style={{ color: '#6B7280' }} />
            <span className="text-[10px] font-semibold" style={{ color: '#6B7280' }}>Main Menu</span>
          </div>
          <p className="text-sm font-bold truncate" style={{ color: '#F9FAFB' }}>{companyName}</p>
          <p className="text-[10px]" style={{ color: '#4B5563' }}>Live workspace</p>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {MAIN_NAV.map(item => {
            const Icon = item.icon
            const href = slug ? `/${slug}${item.path}` : item.path || '/'
            const isCRM = item.path === '/crm'
            return (
              <Link key={item.label} href={href}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
                style={{ backgroundColor: isCRM ? '#0D9488' : 'transparent', color: isCRM ? '#F9FAFB' : '#9CA3AF' }}
                onMouseEnter={e => { if (!isCRM) { e.currentTarget.style.backgroundColor = '#111318'; e.currentTarget.style.color = '#F9FAFB' } }}
                onMouseLeave={e => { if (!isCRM) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9CA3AF' } }}
              >
                <Icon size={15} strokeWidth={1.75} className="shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Lumio branding */}
        <div className="px-4 py-3 shrink-0" style={{ borderTop: '1px solid #1F2937' }}>
          <img src="/lumio-transparent-new.png" alt="Lumio" style={{ width: 80, height: 'auto', objectFit: 'contain', opacity: 0.4 }} />
        </div>
      </div>

      <CRMSidebar />
      <main className="flex-1 overflow-x-hidden min-w-0" style={{ backgroundColor: '#0F1019' }}>
        {/* Demo banner */}
        {demoActive && (
          <div className="flex items-center justify-between px-4 shrink-0" style={{ height: 40, minHeight: 40, background: '#0D9488', color: '#F9FAFB' }}>
            <div className="flex items-center gap-2 text-xs font-medium"><span>Demo workspace — exploring with sample data</span><span style={{ opacity: 0.7 }}>· Connect your real tools to see live insights</span></div>
            <button onClick={() => { Object.keys(localStorage).filter(k => k.startsWith('lumio_demo_') || k.startsWith('lumio_dashboard_')).forEach(k => localStorage.removeItem(k)); localStorage.setItem('lumio_demo_active', 'false'); localStorage.removeItem('lumio-photo-frame'); setDemoActive(false); window.location.reload() }} className="text-xs font-semibold px-3 py-1 rounded-lg" style={{ border: '1px solid rgba(255,255,255,0.3)', background: 'transparent', color: '#fff' }}>Clear Demo Data</button>
          </div>
        )}
        {/* Avatar + bell row — top-right of CRM content */}
        <div className="flex items-center justify-end gap-3 px-6 pt-4 pb-2">
          <AvatarDropdown initials={initials} logoutRedirect="/login" settingsHref="/settings" />
          <button onClick={() => setNotificationsOpen(o => !o)} className="relative flex items-center justify-center rounded-full transition-colors" style={{ width: 36, height: 36, backgroundColor: '#111318', border: '1px solid #1F2937', color: '#9CA3AF' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#F9FAFB'; e.currentTarget.style.borderColor = '#374151' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.borderColor = '#1F2937' }}
            aria-label="Notifications">
            <Bell size={16} strokeWidth={1.75} />
            <span className="absolute rounded-full flex items-center justify-center" style={{ top: 4, right: 4, width: 10, height: 10, backgroundColor: '#EF4444', fontSize: 6, color: '#fff', fontWeight: 700 }}>3</span>
          </button>
        </div>
        {notificationsOpen && <NotificationsPanel onClose={() => setNotificationsOpen(false)} />}
        <div className="px-6 pb-6">
          {children}
        </div>
      </main>
    </div>
  )
}
