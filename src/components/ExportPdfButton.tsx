'use client'

import { Printer } from 'lucide-react'

export default function ExportPdfButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors print:hidden"
      style={{ color: '#9CA3AF', border: '1px solid #1F2937', backgroundColor: 'transparent' }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.color = '#F9FAFB'
        el.style.borderColor = '#374151'
        el.style.backgroundColor = '#111318'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.color = '#9CA3AF'
        el.style.borderColor = '#1F2937'
        el.style.backgroundColor = 'transparent'
      }}
    >
      <Printer size={14} strokeWidth={1.75} />
      Export PDF
    </button>
  )
}
