'use client'

import { useState, useCallback, useRef } from 'react'

export function useSpeech() {
  const [isPlaying, setIsPlaying] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const stop = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    setIsPlaying(false)
  }, [])

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return

    // If already playing, stop
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel()
      setIsPlaying(false)
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utteranceRef.current = utterance

    // Pick a natural English voice if available
    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices()
      const preferred = [
        'Google UK English Female',
        'Google UK English Male',
        'Google US English',
        'Microsoft Aria Online (Natural) - English (United States)',
        'Microsoft Ryan Online (Natural) - English (United Kingdom)',
        'Samantha',
        'Daniel',
      ]
      for (const name of preferred) {
        const v = voices.find(v => v.name === name)
        if (v) return v
      }
      return voices.find(v => v.lang.startsWith('en')) ?? null
    }

    const voice = pickVoice()
    if (voice) utterance.voice = voice
    utterance.rate  = 0.95
    utterance.pitch = 1.0
    utterance.lang  = 'en-GB'

    utterance.onstart = () => setIsPlaying(true)
    utterance.onend   = () => setIsPlaying(false)
    utterance.onerror = () => setIsPlaying(false)

    window.speechSynthesis.speak(utterance)

    // Chrome bug: voices may not be loaded yet on first call
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        const v = pickVoice()
        if (v) utterance.voice = v
        window.speechSynthesis.onvoiceschanged = null
      }
    }
  }, [])

  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

  return { speak, stop, isPlaying, supported }
}
