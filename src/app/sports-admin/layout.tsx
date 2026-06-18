'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { LayoutDashboard, Users2, Building2, Rocket, Activity, Settings, LogOut, Search, Bell } from 'lucide-react'

const ADMIN_TOKEN = 'lumio-sports-admin-2026'

const NAV = [
  { href: '/sports-admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/sports-admin/users', label: 'Athletes', icon: Users2 },
  { href: '/sports-admin/clubs', label: 'Clubs', icon: Building2 },
  { href: '/sports-admin/onboarding', label: 'Onboarding', icon: Rocket },
  { href: '/sports-admin/events', label: 'Activity', icon: Activity },
  { href: '/sports-admin/settings', label: 'Settings', icon: Settings },
]

export default function SportsAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [authed, setAuthed] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('sports_admin_token')
    if (saved === ADMIN_TOKEN) setAuthed(true)
  }, [])

  const handleLogin = () => {
    if (pin === ADMIN_TOKEN || pin === '071711') {
      localStorage.setItem('sports_admin_token', ADMIN_TOKEN)
      setAuthed(true)
    } else {
      setError('Incorrect password')
    }
  }

  if (!authed) return (
    <div style={{ minHeight: '100vh', background: '#07080F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#111318', border: '1px solid #1F2937', borderRadius: 16, padding: 40, width: 320 }}>
        <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 8 }}>🏆</div>
        <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 700, textAlign: 'center', marginBottom: 4 }}>Sports Admin</h1>
        <p style={{ color: '#6B7280', fontSize: 13, textAlign: 'center', marginBottom: 24 }}>Lumio Sports internal</p>
        <input type="password" placeholder="Admin password" value={pin}
          onChange={e => setPin(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleLogin() }}
          style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14, marginBottom: 12, boxSizing: 'border-box' }} />
        {error && <p style={{ color: '#ef4444', fontSize: 12, marginBottom: 12 }}>{error}</p>}
        <button onClick={handleLogin}
          style={{ width: '100%', background: '#F5A623', color: '#0A0B10', border: 'none', borderRadius: 8, padding: 10, fontWeight: 700, cursor: 'pointer' }}>
          Sign in
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#07080F', color: '#F9FAFB' }}>
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0" style={{ backgroundColor: '#0A0B10', borderRight: '1px solid #1F2937' }}>
        <div className="px-5 py-4 shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-2">
            <Image src="/lumio_logo_ultra_clean.png" alt="Lumio Sports" width={200} height={100} style={{ width: 90, height: 'auto' }} />
            <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(245,166,35,0.15)', color: '#F5A623' }}>Admin</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(item => {
            const active = item.href === '/sports-admin' ? pathname === '/sports-admin' : pathname.startsWith(item.href)
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
          <div className="mb-2">
            <p className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>Sports Admin</p>
            <p className="text-xs" style={{ color: '#F5A623' }}>superadmin</p>
          </div>
          <button onClick={() => { localStorage.removeItem('sports_admin_token'); setAuthed(false) }} className="flex items-center gap-2 text-xs" style={{ color: '#6B7280' }}>
            <LogOut size={12} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
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
