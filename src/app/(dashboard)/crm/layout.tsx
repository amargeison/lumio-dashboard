'use client'

import CRMSidebar from '@/components/crm/CRMSidebar'

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ marginLeft: '-16px', marginTop: '-16px', marginBottom: '-16px', marginRight: '-16px' }}>
      <CRMSidebar />
      <main className="flex-1 md:ml-[240px] overflow-x-hidden">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
