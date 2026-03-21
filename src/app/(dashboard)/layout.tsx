'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <main
        className="min-h-screen pt-16 md:pl-[200px]"
        style={{ backgroundColor: '#07080F' }}
      >
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </>
  )
}
