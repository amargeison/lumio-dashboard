'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function WebsiteShortcut() {
  const router = useRouter()
  useEffect(() => { router.replace('/home') }, [router])
  return (
    <div style={{ backgroundColor: '#07080F', color: '#F9FAFB', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p className="text-sm" style={{ color: '#6B7280' }}>Redirecting to marketing site...</p>
    </div>
  )
}
