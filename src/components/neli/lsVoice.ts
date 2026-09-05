'use client'

/**
 * LanguageScreen voice layer
 *  - speak(): ElevenLabs (via /api/tts) with a warm "teacher" voice, in-memory cache,
 *    prefetching and automatic fallback to the browser's speech synthesis.
 *  - useSpeechCommands(): a far more forgiving voice-command listener.
 *  - Assessor-guidance on/off is a persisted preference shared by every screen.
 */

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'

// ─── Voice presets (ElevenLabs premade voices — free on every plan) ────────────
export type VoiceGender = 'female' | 'male'
export const VOICE_PRESETS: Record<VoiceGender, { id: string; name: string; label: string; desc: string }> = {
  female: { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda', label: 'Ms. Matilda', desc: 'Warm, friendly kindergarten-teacher voice' },
  male:   { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian',   label: 'Mr. Brian',   desc: 'Calm, reassuring storyteller voice' },
}
// Override from env if the school has its own cloned voices
const ENV_FEMALE = process.env.NEXT_PUBLIC_LS_VOICE_FEMALE
const ENV_MALE = process.env.NEXT_PUBLIC_LS_VOICE_MALE
if (ENV_FEMALE) VOICE_PRESETS.female.id = ENV_FEMALE
if (ENV_MALE) VOICE_PRESETS.male.id = ENV_MALE

// ─── Tiny persisted settings store ───────────────────────────────────────────
type Settings = { gender: VoiceGender; assessorVoice: boolean; engine: 'eleven' | 'browser' }
const KEY = 'nls-voice-settings'
const DEFAULTS: Settings = { gender: 'female', assessorVoice: true, engine: 'eleven' }
let settings: Settings = DEFAULTS
if (typeof window !== 'undefined') {
  try { settings = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') } } catch {}
}
const listeners = new Set<() => void>()
function emit() { listeners.forEach(l => l()) }
export function getVoiceSettings() { return settings }
export function setVoiceSettings(patch: Partial<Settings>) {
  settings = { ...settings, ...patch }
  try { localStorage.setItem(KEY, JSON.stringify(settings)) } catch {}
  emit()
}
export function useVoiceSettings() {
  return useSyncExternalStore(cb => { listeners.add(cb); return () => { listeners.delete(cb) } }, () => settings, () => DEFAULTS)
}

// ─── Speaking state (so the listener can pause while we talk) ─────────────────
let speakingNow = false
const speakListeners = new Set<() => void>()
function setSpeaking(v: boolean) { if (speakingNow !== v) { speakingNow = v; speakListeners.forEach(l => l()) } }
export function isSpeaking() { return speakingNow }
export function useIsSpeaking() {
  return useSyncExternalStore(cb => { speakListeners.add(cb); return () => { speakListeners.delete(cb) } }, () => speakingNow, () => false)
}

// ─── ElevenLabs playback with cache + fallback ────────────────────────────────
const cache = new Map<string, Promise<string | null>>() // key → object URL (null = failed)
let currentAudio: HTMLAudioElement | null = null
let currentToken = 0
let elevenHealthy = true // flips false after a hard failure so we stop hammering the API

function cacheKey(text: string, voiceId: string) { return `${voiceId}::${text.trim()}` }

async function fetchClip(text: string, voiceId: string): Promise<string | null> {
  const key = cacheKey(text, voiceId)
  if (cache.has(key)) return cache.get(key)!
  const p = (async () => {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.slice(0, 500), voice_id: voiceId }),
      })
      if (!res.ok) { if (res.status >= 500) elevenHealthy = false; return null }
      const blob = await res.blob()
      if (!blob.size) return null
      return URL.createObjectURL(blob)
    } catch { return null }
  })()
  cache.set(key, p)
  return p
}

/** Warm the cache for lines that are about to be spoken (next item, feedback lines…). */
export function prefetch(texts: string[]) {
  if (typeof window === 'undefined' || settings.engine !== 'eleven' || !elevenHealthy) return
  const voiceId = VOICE_PRESETS[settings.gender].id
  for (const t of texts) if (t) fetchClip(t, voiceId)
}

function browserSpeak(text: string, rate: number, onEnd: () => void) {
  const sy = typeof window !== 'undefined' ? window.speechSynthesis : null
  if (!sy) { onEnd(); return }
  sy.cancel()
  const u = new SpeechSynthesisUtterance(text)
  const voices = sy.getVoices()
  const lang = navigator.language?.startsWith('en') ? navigator.language : 'en-US'
  const wantFemale = settings.gender === 'female'
  const pick = voices.find(v => v.lang === lang && /natural|neural|premium|enhanced/i.test(v.name) && (wantFemale ? /female|aria|jenny|samantha|sonia|libby|karen|moira|zira/i.test(v.name) : /male|guy|davis|daniel|alex|ryan|george|thomas/i.test(v.name)))
    || voices.find(v => v.lang === lang && /natural|neural|premium|enhanced/i.test(v.name))
    || voices.find(v => v.lang === lang)
    || voices.find(v => v.lang.startsWith('en'))
  if (pick) u.voice = pick
  u.lang = lang; u.rate = rate; u.pitch = wantFemale ? 1.05 : 0.95
  u.onend = onEnd; u.onerror = onEnd
  sy.speak(u)
}

export type SpeakOpts = { rate?: number; onEnd?: () => void; kind?: 'child' | 'assessor' }

/**
 * Speak a line. Resolves when playback ENDS (or immediately if skipped).
 * kind 'assessor' respects the assessor-guidance toggle; 'child' lines always play.
 */
export function speak(text: string, opts: SpeakOpts = {}): Promise<void> {
  const { rate = 0.92, onEnd, kind = 'child' } = opts
  if (typeof window === 'undefined' || !text) { onEnd?.(); return Promise.resolve() }
  if (kind === 'assessor' && !settings.assessorVoice) { onEnd?.(); return Promise.resolve() }
  cancel()
  const token = ++currentToken
  setSpeaking(true)
  return new Promise<void>(resolve => {
    const finish = () => { if (token === currentToken) setSpeaking(false); onEnd?.(); resolve() }
    const fallback = () => browserSpeak(text, rate, finish)
    if (settings.engine !== 'eleven' || !elevenHealthy) { fallback(); return }
    const voiceId = VOICE_PRESETS[settings.gender].id
    fetchClip(text, voiceId).then(url => {
      if (token !== currentToken) { resolve(); return } // superseded while loading
      if (!url) { fallback(); return }
      const a = new Audio(url)
      a.playbackRate = rate >= 1 ? 1 : Math.max(0.85, rate + 0.06) // ElevenLabs is already natural-paced
      currentAudio = a
      a.onended = finish
      a.onerror = () => { currentAudio = null; fallback() }
      a.play().catch(() => fallback())
    })
  })
}

/** Stop anything currently playing (both engines). */
export function cancel() {
  currentToken++
  if (currentAudio) { try { currentAudio.pause(); currentAudio.src = '' } catch {} currentAudio = null }
  if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel()
  setSpeaking(false)
}

/** Quick voice preview for the settings UI. */
export function previewVoice(gender: VoiceGender) {
  const prev = settings.gender
  settings = { ...settings, gender }
  const line = gender === 'female'
    ? "Hi there! I'm Ms. Matilda. Let's look at some pictures together — you're doing brilliantly."
    : "Hi there! I'm Mr. Brian. Let's look at some pictures together — you're doing brilliantly."
  return speak(line, { kind: 'child' }).finally(() => { settings = { ...settings, gender: prev }; emit() })
}

// ─── Voice commands: a forgiving listener ────────────────────────────────────
export type VoiceCommand = 'correct' | 'incorrect' | 'repeat' | 'skip' | 'next' | 'one' | 'two' | 'three' | 'four'

const PHRASES: Record<VoiceCommand, string[]> = {
  correct:   ['correct', 'right', "that's right", 'yes', 'yeah', 'yep', 'yup', 'good', 'good job', 'well done', 'got it', 'tick', 'check', 'mark it correct', 'mark correct', 'score correct', 'true', 'okay', 'ok', 'yes she did', 'yes he did', 'affirmative'],
  incorrect: ['incorrect', 'wrong', 'no', 'nope', 'not quite', 'not right', 'cross', 'error', 'miss', 'missed', 'mark it wrong', 'mark wrong', 'score wrong', 'false', 'negative', 'no answer', 'didn\'t get it', 'did not get it', 'unsure'],
  repeat:    ['repeat', 'again', 'say again', 'say it again', 'play again', 'once more', 'one more time', 'replay', 'read again', 'read it again', 'play'],
  skip:      ['skip', 'pass', 'skip it', 'skip this', 'move on', 'leave it'],
  next:      ['next', 'next one', 'next question', 'continue', 'go on', 'carry on'],
  one: ['one', 'number one', 'first', 'picture one', 'top left', '1'],
  two: ['two', 'number two', 'second', 'picture two', 'top right', 'to', 'too', '2'],
  three: ['three', 'number three', 'third', 'picture three', 'bottom left', '3'],
  four: ['four', 'number four', 'fourth', 'picture four', 'bottom right', 'for', '4'],
}
// Order matters: longer / more specific phrases first so "not right" beats "right"
const MATCHERS: { cmd: VoiceCommand; re: RegExp }[] = (Object.keys(PHRASES) as VoiceCommand[])
  .flatMap(cmd => PHRASES[cmd].map(p => ({ cmd, p })))
  .sort((a, b) => b.p.length - a.p.length)
  .map(({ cmd, p }) => ({ cmd, re: new RegExp(`(^|\\b)${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\b|$)`) }))

function normalise(s: string) { return s.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim() }

export function matchCommand(transcript: string, allowed?: VoiceCommand[]): VoiceCommand | null {
  const t = normalise(transcript)
  if (!t) return null
  for (const m of MATCHERS) {
    if (allowed && !allowed.includes(m.cmd)) continue
    if (m.re.test(t)) return m.cmd
  }
  return null
}

export function useSpeechCommands({ enabled, onCommand, allowed }: { enabled: boolean; onCommand: (c: VoiceCommand) => void; allowed?: VoiceCommand[] }) {
  const recRef = useRef<any>(null)
  const cbRef = useRef(onCommand); cbRef.current = onCommand
  const allowedRef = useRef(allowed); allowedRef.current = allowed
  const lastRef = useRef<{ cmd: string; at: number }>({ cmd: '', at: 0 })
  const [listening, setListening] = useState(false)
  const [lastHeard, setLastHeard] = useState('')
  const [error, setError] = useState<string | null>(null)
  const speaking = useIsSpeaking()
  const speakingRef = useRef(speaking); speakingRef.current = speaking

  useEffect(() => {
    if (!enabled) { try { recRef.current?.abort() } catch {} setListening(false); return }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { setError('Voice commands need Chrome or Edge'); return }
    let alive = true, backoff = 300
    const boot = () => {
      if (!alive) return
      const r = new SR()
      r.continuous = true; r.interimResults = true; r.maxAlternatives = 5
      r.lang = navigator.language?.startsWith('en') ? navigator.language : 'en-US'
      r.onstart = () => { setListening(true); setError(null); backoff = 300 }
      r.onend = () => { setListening(false); if (alive) setTimeout(boot, backoff); backoff = Math.min(backoff * 2, 4000) }
      r.onerror = (e: any) => {
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { setError('Microphone blocked — allow it in the address bar'); alive = false }
        else if (e.error === 'audio-capture') setError('No microphone found')
      }
      r.onresult = (e: any) => {
        if (speakingRef.current) return // don't score our own voice
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const res = e.results[i]
          const alts: string[] = []
          for (let k = 0; k < res.length; k++) alts.push(res[k].transcript)
          const heard = alts[0] || ''
          setLastHeard(heard.trim())
          // Act on final results, or on confident interim results (fast reaction)
          const confident = res.isFinal || (res[0].confidence ?? 0) > 0.75
          if (!confident) continue
          let cmd: VoiceCommand | null = null
          for (const a of alts) { cmd = matchCommand(a, allowedRef.current); if (cmd) break }
          if (!cmd) continue
          const now = Date.now()
          if (lastRef.current.cmd === cmd && now - lastRef.current.at < 1500) continue // de-bounce echoes
          lastRef.current = { cmd, at: now }
          cbRef.current(cmd)
        }
      }
      try { r.start(); recRef.current = r } catch {}
    }
    boot()
    return () => { alive = false; try { recRef.current?.abort() } catch {}; setListening(false) }
  }, [enabled])

  return { listening, lastHeard, error, paused: speaking }
}

/** Convenience for components: current preset + toggles. */
export function useVoicePrefs() {
  const s = useVoiceSettings()
  const setGender = useCallback((g: VoiceGender) => setVoiceSettings({ gender: g }), [])
  const setAssessorVoice = useCallback((v: boolean) => { setVoiceSettings({ assessorVoice: v }); if (!v) cancel() }, [])
  return { ...s, preset: VOICE_PRESETS[s.gender], setGender, setAssessorVoice }
}
