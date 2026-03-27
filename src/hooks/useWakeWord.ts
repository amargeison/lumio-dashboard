'use client'

import { useEffect, useRef, useCallback } from 'react'

const WAKE_PHRASES = ['hi lumio', 'hey lumio']

export function useWakeWord(onWake: () => void, enabled = true) {
  const recognitionRef = useRef<any>(null)
  const onWakeRef = useRef(onWake)
  onWakeRef.current = onWake

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch {}
      recognitionRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    if (typeof window === 'undefined') return
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return

    stop()

    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-GB'

    recognition.onresult = (e: any) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript.toLowerCase().trim()
        if (WAKE_PHRASES.some(p => text.includes(p))) {
          stop()
          onWakeRef.current()
          return
        }
      }
    }

    recognition.onerror = (e: any) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        stop()
        return
      }
      // For transient errors (no-speech, network), restart after a brief pause
      setTimeout(() => {
        if (recognitionRef.current === recognition) start()
      }, 1000)
    }

    recognition.onend = () => {
      // Auto-restart if still supposed to be running
      if (recognitionRef.current === recognition) {
        setTimeout(() => {
          if (recognitionRef.current === recognition) start()
        }, 300)
      }
    }

    recognitionRef.current = recognition
    try { recognition.start() } catch {}
  }, [stop])

  useEffect(() => {
    if (enabled) {
      start()
    } else {
      stop()
    }
    return stop
  }, [enabled, start, stop])

  return { stop, start }
}
