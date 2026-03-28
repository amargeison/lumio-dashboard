'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PortalLiveShortcut() {
  const router = useRouter()

  useEffect(() => {
    // Seed mock paid workspace data into localStorage
    localStorage.setItem('workspace_session_token', 'dev-preview-mock-token')
    localStorage.setItem('workspace_slug', 'lumiodemo')
    localStorage.setItem('workspace_company_name', 'Lumio Demo Co')
    localStorage.setItem('lumio_company_name', 'Lumio Demo Co')
    localStorage.setItem('workspace_user_name', 'Demo User')
    localStorage.setItem('lumio_user_name', 'Demo User')
    localStorage.setItem('workspace_company_logo', '')
    localStorage.setItem('lumio_company_logo', '')
    router.replace('/lumiodemo')
  }, [router])

  return (
    <div style={{ backgroundColor: '#07080F', color: '#F9FAFB', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-4 mx-auto w-fit" style={{ backgroundColor: '#f97316', color: '#fff' }}>DEV PREVIEW — not a real account</div>
        <p className="text-sm" style={{ color: '#6B7280' }}>Loading live business portal...</p>
      </div>
    </div>
  )
}
