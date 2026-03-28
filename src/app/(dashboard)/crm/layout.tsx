'use client'

import CRMSidebar from '@/components/crm/CRMSidebar'

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen -mx-4 -my-4">
      <CRMSidebar />
      <main className="flex-1 overflow-x-hidden min-w-0">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
