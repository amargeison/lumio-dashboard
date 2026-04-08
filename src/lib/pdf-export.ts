'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// usePDFExport — print-stylesheet driven PDF export.
// Adds class hooks to <body>, calls window.print(), then cleans up.
// Never throws.

export function usePDFExport() {
  const [isExporting, setIsExporting] = useState(false)
  const previousTitleRef = useRef<string | null>(null)
  const activeViewIdRef = useRef<string | null>(null)

  const cleanup = useCallback(() => {
    if (typeof document === 'undefined') return
    document.body.classList.remove('pdf-export-mode')
    if (activeViewIdRef.current) {
      document.body.classList.remove(`pdf-target-${activeViewIdRef.current}`)
      activeViewIdRef.current = null
    }
    if (previousTitleRef.current !== null) {
      document.title = previousTitleRef.current
      previousTitleRef.current = null
    }
    setIsExporting(false)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onAfter = () => cleanup()
    window.addEventListener('afterprint', onAfter)
    return () => window.removeEventListener('afterprint', onAfter)
  }, [cleanup])

  const exportPDF = useCallback((viewId: string, filename: string) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return
    try {
      previousTitleRef.current = document.title
      const cleanName = filename.replace(/\.pdf$/i, '')
      document.title = cleanName
      activeViewIdRef.current = viewId
      document.body.classList.add('pdf-export-mode')
      document.body.classList.add(`pdf-target-${viewId}`)
      setIsExporting(true)
      // Defer to next tick so styles apply before print
      setTimeout(() => {
        try { window.print() } catch (e) { console.error('[pdf-export] print failed', e); cleanup() }
      }, 50)
    } catch (e) {
      console.error('[pdf-export] exportPDF failed', e)
      cleanup()
    }
  }, [cleanup])

  return { exportPDF, isExporting }
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null || isNaN(value as number)) return '—'
  return '£' + Math.round(value).toLocaleString('en-GB')
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatPercentage(value: number | null | undefined): string {
  if (value == null || isNaN(value as number)) return '—'
  return `${Math.round(value)}%`
}
