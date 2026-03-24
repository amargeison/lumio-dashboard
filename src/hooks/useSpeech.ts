'use client'

import { useState, useCallback, useRef } from 'react'

// Preferred voice names in priority order
const VOICE_PRIORITY = [
  'Google UK English Female',
  'Google UK English Male',
  'Microsoft Sonia Online (Natural) - en-GB',
  'Microsoft Libby Online (Natural) - en-GB',
]

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  // 1. Exact match on preferred list
  for (const name of VOICE_PRIORITY) {
    const v = voices.find(v => v.name === name)
    if (v) return v
  }
  // 2. Any voice with "Natural" in the name
  const natural = voices.find(v => v.name.toLowerCase().includes('natural'))
  if (natural) return natural
  // 3. Any en-GB voice
  const enGB = voices.find(v => v.lang === 'en-GB')
  if (enGB) return enGB
  // 4. Any en-US voice
  const enUS = voices.find(v => v.lang.startsWith('en-US'))
  if (enUS) return enUS
  // 5. Any English voice
  return voices.find(v => v.lang.startsWith('en')) ?? null
}

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

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel()
      setIsPlaying(false)
      return
    }

    function startSpeech(voices: SpeechSynthesisVoice[]) {
      const utterance = new SpeechSynthesisUtterance(text)
      utteranceRef.current = utterance

      const voice = pickVoice(voices)
      console.log(
        '[Lumio TTS] Selected voice:',
        voice?.name ?? 'browser default',
        '| lang:', voice?.lang ?? 'default',
      )

      if (voice) utterance.voice = voice
      utterance.rate   = 0.9
      utterance.pitch  = 1.0
      utterance.volume = 1.0
      utterance.lang   = 'en-GB'

      utterance.onstart = () => setIsPlaying(true)
      utterance.onend   = () => setIsPlaying(false)
      utterance.onerror = () => setIsPlaying(false)

      // 300ms delay so it doesn't feel abrupt
      setTimeout(() => {
        if (window.speechSynthesis) window.speechSynthesis.speak(utterance)
      }, 300)
    }

    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) {
      startSpeech(voices)
    } else {
      // Chrome: voices load async — wait before speaking so voice selection works
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null
        startSpeech(window.speechSynthesis.getVoices())
      }
    }
  }, [])

  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

  return { speak, stop, isPlaying, supported }
}
