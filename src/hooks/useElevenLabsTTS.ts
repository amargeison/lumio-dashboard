'use client'

import { useState, useCallback, useRef, useSyncExternalStore } from 'react'

const DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL' // Rachel

function getVoiceId(): string {
  if (typeof window === 'undefined') return DEFAULT_VOICE_ID
  return localStorage.getItem('lumio_tts_voice') || DEFAULT_VOICE_ID
}

// Subscribe to localStorage changes (cross-tab + same-tab)
const voiceListeners = new Set<() => void>()
let voiceSnapshot = typeof window !== 'undefined' ? getVoiceId() : DEFAULT_VOICE_ID

function subscribeVoice(cb: () => void) {
  voiceListeners.add(cb)
  return () => { voiceListeners.delete(cb) }
}
function getVoiceSnapshot() { return voiceSnapshot }
function getServerVoiceSnapshot() { return DEFAULT_VOICE_ID }

if (typeof window !== 'undefined') {
  // Listen for storage events (other tabs)
  window.addEventListener('storage', (e) => {
    if (e.key === 'lumio_tts_voice') {
      voiceSnapshot = getVoiceId()
      voiceListeners.forEach(cb => cb())
    }
  })

  // Patch localStorage.setItem to detect same-tab changes
  const origSetItem = localStorage.setItem.bind(localStorage)
  localStorage.setItem = (key: string, value: string) => {
    origSetItem(key, value)
    if (key === 'lumio_tts_voice') {
      voiceSnapshot = value || DEFAULT_VOICE_ID
      voiceListeners.forEach(cb => cb())
    }
  }
}

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

// Web Speech API fallback — accepts optional onEnd callback to reset isPlaying
function fallbackSpeak(text: string, onEnd?: () => void) {
  if (typeof window === 'undefined' || !window.speechSynthesis) { onEnd?.(); return }
  window.speechSynthesis.cancel() // ensure no overlap
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
  utterance.onend = () => onEnd?.()
  utterance.onerror = () => onEnd?.()
  window.speechSynthesis.speak(utterance)
}

export function useElevenLabsTTS() {
  const voiceId = useSyncExternalStore(subscribeVoice, getVoiceSnapshot, getServerVoiceSnapshot)
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

    // Always cancel any lingering browser TTS before starting
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }

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

      // Send session tokens so the API can check trial vs paid
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (typeof window !== 'undefined') {
        const demoToken = localStorage.getItem('demo_session_token')
        const wsToken = localStorage.getItem('workspace_session_token')
        if (wsToken) headers['x-workspace-token'] = wsToken
        else if (demoToken) headers['x-demo-token'] = demoToken
      }

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers,
        body: JSON.stringify({ text, voice: voiceId }),
        signal: controller.signal,
      })

      if (res.status === 429) {
        // Daily limit reached — fall back to browser TTS (not both)
        console.warn('[Lumio TTS] Daily limit reached, falling back to browser TTS')
        fallbackSpeak(text, () => setIsPlaying(false))
        return
      }

      if (!res.ok) throw new Error('TTS API failed')

      const buf = await res.arrayBuffer()
      cacheSet(key, buf)

      // Cancel browser TTS again before playing ElevenLabs audio (belt and suspenders)
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }

      const blob = new Blob([buf], { type: 'audio/mpeg' })
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => { setIsPlaying(false); URL.revokeObjectURL(url) }
      audio.onerror = () => { setIsPlaying(false); URL.revokeObjectURL(url) }
      await audio.play()
    } catch (err) {
      if ((err as Error).name === 'AbortError') { setIsPlaying(false); return }
      // Fallback to Web Speech API — only if ElevenLabs truly failed
      console.warn('[Lumio TTS] ElevenLabs failed, falling back to browser TTS:', err)
      // Stop any ElevenLabs audio that might be buffering
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
      fallbackSpeak(text, () => setIsPlaying(false))
    }
  }, [isPlaying, stop])

  const supported = true // Always "supported" — falls back to Web Speech

  return { speak, stop, isPlaying, supported }
}
