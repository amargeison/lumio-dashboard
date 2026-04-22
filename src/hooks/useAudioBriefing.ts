'use client'
import { useEffect, useState } from 'react'

export type UseAudioBriefingOptions = {
  /** Fired when SpeechSynthesis is unavailable or `.speak()` throws. */
  onError?: (reason: 'unsupported' | 'failed') => void
}

export type UseAudioBriefingResult = {
  isSpeaking: boolean
  isSupported: boolean
  /**
   * Tap handler. First call reads out the briefing text; second call stops.
   * `getText` is resolved lazily so the caller can build the briefing from
   * data that changes at click time (current schedule, roundup, etc.) without
   * paying the cost on every render.
   */
  toggle: () => Promise<void>
}

/**
 * Client-side text-to-speech for the AI briefing speaker icon. Extracted from
 * the inline `speakBriefing` on `src/app/tennis/[slug]/page.tsx` so the desktop
 * portal and mobile Hero + AI Morning Summary speakers share identical voice
 * selection, pitch, rate, and state-machine behaviour.
 *
 * The hook owns:
 *   - speak / stop mechanics (Web Speech API)
 *   - `lumio_tts_voice_name` localStorage lookup
 *   - voice match + fallback (Sarah / Charlotte / George)
 *   - per-voice pitch + rate
 *   - `isSpeaking` state for icon styling
 *   - unmount cleanup
 *   - graceful failure reporting via `onError`
 */
export function useAudioBriefing(
  getText: () => string | Promise<string>,
  options: UseAudioBriefingOptions = {},
): UseAudioBriefingResult {
  const { onError } = options
  const [isSpeaking, setIsSpeaking] = useState(false)
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

  const getVoicesReady = (): Promise<SpeechSynthesisVoice[]> => new Promise(resolve => {
    const v = window.speechSynthesis.getVoices()
    if (v.length > 0) return resolve(v)
    window.speechSynthesis.onvoiceschanged = () => resolve(window.speechSynthesis.getVoices())
  })

  const toggle = async (): Promise<void> => {
    if (typeof window === 'undefined') return
    if (!('speechSynthesis' in window)) { onError?.('unsupported'); return }

    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }
    window.speechSynthesis.cancel()

    let briefingText: string
    try {
      briefingText = await Promise.resolve(getText())
    } catch {
      onError?.('failed')
      return
    }
    if (!briefingText) { onError?.('failed'); return }

    const allVoices = await getVoicesReady()
    const savedVoiceName = localStorage.getItem('lumio_tts_voice_name') || 'Sarah'
    const voiceMap: Record<string, string[]> = {
      'Sarah':     ['Google UK English Female', 'Microsoft Libby', 'Karen', 'Veena'],
      'Charlotte': ['Microsoft Hazel', 'Fiona', 'Samantha', 'Google UK English Female'],
      'George':    ['Google UK English Male', 'Microsoft George', 'Daniel', 'Alex'],
    }
    const preferred = voiceMap[savedVoiceName] || voiceMap['Sarah']
    const match = allVoices.find(v => preferred.some(p => v.name.includes(p)))
      || allVoices.find(v => savedVoiceName === 'George'
        ? v.lang.startsWith('en') && v.name.toLowerCase().includes('male')
        : v.lang.startsWith('en') && !v.name.toLowerCase().includes('male'))

    const utterance = new SpeechSynthesisUtterance(briefingText)
    if (match) utterance.voice = match
    utterance.pitch  = savedVoiceName === 'George' ? 0.75 : savedVoiceName === 'Charlotte' ? 1.25 : 1.1
    utterance.rate   = savedVoiceName === 'George' ? 0.92 : 0.95
    utterance.volume = 1.0
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend   = () => setIsSpeaking(false)
    utterance.onerror = () => { setIsSpeaking(false); onError?.('failed') }

    try {
      window.speechSynthesis.speak(utterance)
    } catch {
      setIsSpeaking(false)
      onError?.('failed')
    }
  }

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  return { isSpeaking, isSupported, toggle }
}
