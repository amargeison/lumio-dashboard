'use client'

import { useState, useCallback, useRef } from 'react'

// Simple hash for cache keys
function hashText(text: string): string {
  let h = 0
  for (let i = 0; i < text.length; i++) {
    h = ((h << 5) - h + text.charCodeAt(i)) | 0
  }
  return String(h)
}

// In-memory cache (last 10 responses)
const audioCache = new Map<string, ArrayBuffer>()
const CACHE_MAX = 10

function cacheSet(key: string, buf: ArrayBuffer) {
  if (audioCache.size >= CACHE_MAX) {
    const oldest = audioCache.keys().next().value
    if (oldest) audioCache.delete(oldest)
  }
  audioCache.set(key, buf)
}

// Web Speech API fallback (same settings as the old useSpeech hook)
function fallbackSpeak(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  const utterance = new SpeechSynthesisUtterance(text)
  const voices = window.speechSynthesis.getVoices()
  const preferred = ['Google UK English Female', 'Microsoft Sonia Online (Natural) - en-GB']
  const voice = preferred.reduce<SpeechSynthesisVoice | null>((found, name) => found || voices.find(v => v.name === name) || null, null)
    || voices.find(v => v.lang === 'en-GB')
    || voices.find(v => v.lang.startsWith('en'))
    || null
  if (voice) utterance.voice = voice
  utterance.rate = 0.88
  utterance.pitch = 1.08
  utterance.lang = 'en-GB'
  window.speechSynthesis.speak(utterance)
}

export function useElevenLabsTTS() {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
    // Also stop any Web Speech API fallback
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setIsPlaying(false)
  }, [])

  const speak = useCallback(async (text: string) => {
    if (isPlaying) { stop(); return }

    const key = hashText(text)

    // Check cache first
    const cached = audioCache.get(key)
    if (cached) {
      try {
        const blob = new Blob([cached], { type: 'audio/mpeg' })
        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)
        audioRef.current = audio
        audio.onended = () => { setIsPlaying(false); URL.revokeObjectURL(url) }
        audio.onerror = () => { setIsPlaying(false); URL.revokeObjectURL(url) }
        setIsPlaying(true)
        await audio.play()
        return
      } catch { /* fall through */ }
    }

    // Call the TTS API
    const controller = new AbortController()
    abortRef.current = controller

    try {
      setIsPlaying(true)
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      })

      if (!res.ok) throw new Error('TTS API failed')

      const buf = await res.arrayBuffer()
      cacheSet(key, buf)

      const blob = new Blob([buf], { type: 'audio/mpeg' })
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => { setIsPlaying(false); URL.revokeObjectURL(url) }
      audio.onerror = () => { setIsPlaying(false); URL.revokeObjectURL(url) }
      await audio.play()
    } catch (err) {
      if ((err as Error).name === 'AbortError') { setIsPlaying(false); return }
      // Fallback to Web Speech API
      console.warn('[Lumio TTS] ElevenLabs failed, falling back to browser TTS:', err)
      fallbackSpeak(text)
      setIsPlaying(false)
    }
  }, [isPlaying, stop])

  const supported = true // Always "supported" — falls back to Web Speech

  return { speak, stop, isPlaying, supported }
}
