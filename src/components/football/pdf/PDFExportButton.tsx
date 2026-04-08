'use client'

import React from 'react'
import { Printer } from 'lucide-react'
import { usePDFExport } from '@/lib/pdf-export'

interface Props {
  viewId: string
  filename: string
  label?: string
  className?: string
}

export default function PDFExportButton({ viewId, filename, label = 'Export PDF', className }: Props) {
  const { exportPDF, isExporting } = usePDFExport()
  return (
    <button
      onClick={() => exportPDF(viewId, filename)}
      disabled={isExporting}
      className={className ?? 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50'}
      style={{ backgroundColor: 'transparent', border: '1px solid #7C3AED', color: '#A78BFA' }}
    >
      <Printer size={12} />
      {isExporting ? 'Preparing...' : `📄 ${label}`}
    </button>
  )
}
