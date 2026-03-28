'use client'
import { useState, useCallback } from 'react'

export function useToast() {
  const [message, setMessage] = useState<string | null>(null)

  const showToast = useCallback((msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(null), 3000)
  }, [])

  function Toast() {
    if (!message) return null
    return (
      <div className="fixed bottom-6 right-6 z-[100] rounded-xl px-4 py-3 text-sm font-medium shadow-xl animate-in slide-in-from-bottom-2"
        style={{ backgroundColor: '#0D9488', color: '#F9FAFB', border: '1px solid rgba(255,255,255,0.1)' }}>
        {message}
      </div>
    )
  }

  return { showToast, Toast }
}
