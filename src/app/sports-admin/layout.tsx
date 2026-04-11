'use client'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const ADMIN_TOKEN = 'lumio-sports-admin-2026'

const NAV = [
  { href: '/sports-admin', label: 'Dashboard', emoji: '📊' },
  { href: '/sports-admin/users', label: 'Athletes', emoji: '👥' },
  { href: '/sports-admin/events', label: 'Activity', emoji: '⚡' },
  { href: '/sports-admin/settings', label: 'Settings', emoji: '⚙️' },
]

export default function SportsAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [authed, setAuthed] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('sports_admin_token')
    if (saved === ADMIN_TOKEN) setAuthed(true)
  }, [])

  const handleLogin = () => {
    if (pin === ADMIN_TOKEN || pin === 'lumiosports2026') {
      localStorage.setItem('sports_admin_token', ADMIN_TOKEN)
      setAuthed(true)
    } else {
      setError('Incorrect password')
    }
  }

  if (!authed) return (
    <div style={{ minHeight: '100vh', background: '#07080F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#0d1117', border: '1px solid #1F2937', borderRadius: 16, padding: 40, width: 320 }}>
        <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 8 }}>🏆</div>
        <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 700, textAlign: 'center', marginBottom: 4 }}>Sports Admin</h1>
        <p style={{ color: '#475569', fontSize: 13, textAlign: 'center', marginBottom: 24 }}>Lumio Sports internal</p>
        <input type="password" placeholder="Admin password" value={pin}
          onChange={e => setPin(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleLogin() }}
          style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14, marginBottom: 12, boxSizing: 'border-box' }} />
        {error && <p style={{ color: '#ef4444', fontSize: 12, marginBottom: 12 }}>{error}</p>}
        <button onClick={handleLogin}
          style={{ width: '100%', background: '#6C3FC5', color: '#fff', border: 'none', borderRadius: 8, padding: 10, fontWeight: 600, cursor: 'pointer' }}>
          Sign in
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#07080F', display: 'flex' }}>
      <div style={{ width: 220, background: '#0d1117', borderRight: '1px solid #1F2937', padding: '24px 16px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, padding: '0 8px' }}>
          <span style={{ fontSize: 24 }}>🏆</span>
          <div><div style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>Sports Admin</div><div style={{ color: '#475569', fontSize: 11 }}>Lumio Sports</div></div>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV.map(item => (
            <Link key={item.href} href={item.href}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, textDecoration: 'none',
                background: pathname === item.href ? 'rgba(108,63,197,0.12)' : 'transparent',
                color: pathname === item.href ? '#a78bfa' : '#94a3b8', fontSize: 14, fontWeight: pathname === item.href ? 600 : 400 }}>
              <span>{item.emoji}</span>{item.label}
            </Link>
          ))}
        </nav>
        <div style={{ marginTop: 'auto', paddingTop: 32 }}>
          <button onClick={() => { localStorage.removeItem('sports_admin_token'); setAuthed(false) }}
            style={{ color: '#475569', fontSize: 12, background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px 12px' }}>
            Sign out
          </button>
        </div>
      </div>
      <div style={{ flex: 1, padding: 32, overflowY: 'auto' }}>{children}</div>
    </div>
  )
}
