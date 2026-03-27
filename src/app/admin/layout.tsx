'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Building2, GraduationCap, Activity, Settings, LogOut, Search, Bell,
} from 'lucide-react'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/businesses', label: 'Businesses', icon: Building2 },
  { href: '/admin/schools', label: 'Schools', icon: GraduationCap },
  { href: '/admin/activity-log', label: 'Activity Log', icon: Activity },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [admin, setAdmin] = useState<{ name: string; role: string; email: string } | null>(null)
  const [search, setSearch] = useState('')

  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    if (isLoginPage) return
    const token = localStorage.getItem('admin_session_token')
    if (!token) { router.replace('/admin/login'); return }

    // Validate session
    fetch('/api/admin/session', { headers: { 'x-admin-token': token } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) { localStorage.removeItem('admin_session_token'); router.replace('/admin/login'); return }
        setAdmin({ name: data.name, role: data.role, email: data.email })
      })
      .catch(() => { router.replace('/admin/login') })
  }, [isLoginPage, router])

  if (isLoginPage) return <>{children}</>

  function handleLogout() {
    localStorage.removeItem('admin_session_token')
    localStorage.removeItem('admin_name')
    localStorage.removeItem('admin_role')
    localStorage.removeItem('admin_email')
    router.replace('/admin/login')
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#07080F', color: '#F9FAFB' }}>
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0" style={{ backgroundColor: '#0A0B10', borderRight: '1px solid #1F2937' }}>
        <div className="px-5 py-4 shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-2">
            <Image src="/lumio-logo-primary.png" alt="Lumio" width={200} height={100} style={{ width: 90, height: 'auto' }} />
            <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(245,166,35,0.15)', color: '#F5A623' }}>Admin</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(item => {
            const active = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: active ? 'rgba(245,166,35,0.1)' : 'transparent', color: active ? '#F5A623' : '#9CA3AF' }}>
                <item.icon size={16} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="shrink-0 px-4 py-3" style={{ borderTop: '1px solid #1F2937' }}>
          {admin && (
            <div className="mb-2">
              <p className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>{admin.name}</p>
              <p className="text-xs" style={{ color: '#F5A623' }}>{admin.role.replace('_', ' ')}</p>
            </div>
          )}
          <button onClick={handleLogout} className="flex items-center gap-2 text-xs" style={{ color: '#6B7280' }}>
            <LogOut size={12} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-3 shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <Search size={16} style={{ color: '#6B7280' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search accounts..."
              className="flex-1 text-sm bg-transparent outline-none" style={{ color: '#F9FAFB' }} />
          </div>
          <button className="relative" style={{ color: '#6B7280' }}>
            <Bell size={18} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
