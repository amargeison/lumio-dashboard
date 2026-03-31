'use client'

import CRMSidebar from '@/components/crm/CRMSidebar'

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex -mx-4 -mt-4 md:-mx-6 md:-mt-6" style={{ minHeight: 'calc(100vh - 52px)' }}>
      <CRMSidebar />
      <main className="flex-1 overflow-x-hidden min-w-0" style={{ backgroundColor: '#0F1019' }}>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
