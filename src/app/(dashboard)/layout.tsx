'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import ClearDemoBar from '@/components/dashboard/ClearDemoBar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main
        className="min-h-screen md:pl-[200px]"
        style={{ backgroundColor: '#07080F' }}
      >
        <ClearDemoBar />
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </>
  )
}
