'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { GraduationCap, LogOut } from 'lucide-react'

export default function ParentPortalLayout({ children, params }: { children: React.ReactNode; params: Promise<{ schoolSlug: string }> }) {
  const pathname = usePathname()
  const [schoolName, setSchoolName] = useState('School')
  const [parentName, setParentName] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    const name = localStorage.getItem('lumio_parent_school_name')
    if (name) setSchoolName(name)
    const parent = localStorage.getItem('lumio_parent_name')
    if (parent) { setParentName(parent); setLoggedIn(true) }
  }, [])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #E2E8F0', padding: '12px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#0D9488', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={18} color="white" />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>{schoolName}</p>
              <p style={{ fontSize: 11, color: '#64748B' }}>Parent Portal</p>
            </div>
          </div>
          {loggedIn && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 13, color: '#64748B' }}>{parentName}</span>
              <button onClick={() => { localStorage.removeItem('lumio_parent_name'); localStorage.removeItem('lumio_parent_token'); window.location.reload() }}
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer' }}>
                <LogOut size={13} /> Sign out
              </button>
            </div>
          )}
        </div>
      </header>
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 24px 48px' }}>
        {children}
      </main>
      {/* Footer */}
      <footer style={{ backgroundColor: '#ffffff', borderTop: '1px solid #E2E8F0', padding: '16px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 11, color: '#94A3B8' }}>Powered by Lumio for Schools · {schoolName} · <a href="https://lumiocms.com" style={{ color: '#0D9488' }}>lumiocms.com</a></p>
      </footer>
    </div>
  )
}
