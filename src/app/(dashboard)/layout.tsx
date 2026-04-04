'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const isCRM = pathname?.includes('/crm')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [demoActive, setDemoActive] = useState(() => typeof window !== 'undefined' && localStorage.getItem('lumio_demo_active') === 'true')
  const [demoDismissed, setDemoDismissed] = useState(false)

  useEffect(() => {
    setPinned(localStorage.getItem('lumio_sidebar_pinned') === 'true')
    // Read slug from middleware cookie as fallback
    const cookieSlug = document.cookie.split('; ').find(r => r.startsWith('lumio_tenant_slug='))?.split('=')[1]
    if (cookieSlug) localStorage.setItem('lumio_workspace_slug', cookieSlug)
    function onStorage(e: StorageEvent) {
      if (e.key === 'lumio_sidebar_pinned') setPinned(e.newValue === 'true')
    }
    window.addEventListener('storage', onStorage)
    return () => { window.removeEventListener('storage', onStorage) }
  }, [])

  // CRM has its own self-contained layout (sidebar, header, avatar, bell).
  // Skip the parent dashboard chrome to avoid duplicates.
  if (isCRM) {
    return (
      <main className="min-h-screen" style={{ backgroundColor: '#07080F' }}>
        {children}
      </main>
    )
  }

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Bell + avatar now live inside PersonalBanner */}

      <main
        className="min-h-screen transition-[padding] duration-250"
        style={{ backgroundColor: '#07080F', paddingLeft: pinned ? 200 : 48 }}
      >
        {/* Demo banner — first element, zero gap */}
        {demoActive && !demoDismissed && (
          <div style={{ height: 40, minHeight: 40, flexShrink: 0, background: '#0D9488', display: 'flex', alignItems: 'center', padding: '0 140px 0 16px', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, fontSize: 13, color: 'white' }}>
              <span style={{ fontWeight: 600 }}>Demo workspace — exploring with sample data</span>
              <span style={{ opacity: 0.8 }}>· Connect your real tools to see live insights</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => { localStorage.setItem('lumio_demo_active', 'false'); setDemoActive(false); const slug = pathname?.split('/').filter(Boolean)[0]; router.push(slug ? `/${slug}` : '/') }} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.15)', color: 'white', cursor: 'pointer', fontWeight: 600 }}>Clear Demo Data</button>
              <button onClick={() => setDemoDismissed(true)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px' }}>✕</button>
            </div>
          </div>
        )}
        <div className="pt-0 mt-0 px-4 pb-4 md:px-6 md:pb-6">
          {children}
        </div>
      </main>
    </>
  )
}
