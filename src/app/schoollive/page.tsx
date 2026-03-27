'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SchoolLiveShortcut() {
  const router = useRouter()

  useEffect(() => {
    // Seed mock paid school data into localStorage
    localStorage.setItem('lumio_school_oakridge-primary_name', 'Oakridge Primary')
    localStorage.setItem('lumio_school_oakridge-primary_owner', 'Sarah Henderson')
    localStorage.setItem('lumio_school_oakridge-primary_plan', 'school')
    localStorage.setItem('lumio_school_oakridge-primary_active', 'true')
    router.replace('/schools/oakridge-primary')
  }, [router])

  return (
    <div style={{ backgroundColor: '#07080F', color: '#F9FAFB', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-4 mx-auto w-fit" style={{ backgroundColor: '#f97316', color: '#fff' }}>DEV PREVIEW — not a real account</div>
        <p className="text-sm" style={{ color: '#6B7280' }}>Loading live schools portal...</p>
      </div>
    </div>
  )
}
