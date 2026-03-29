'use client'

import { useState, useEffect, useRef } from 'react'
import { Volume2, Mic, Check, Loader2 } from 'lucide-react'

const VOICES = [
  { id: 'alFofuDn3cOwyoz1i44T', name: 'Dallin', desc: 'Positive, inspiring & clear — your daily motivator', sample: 'Good morning. Let\'s make today count.' },
  { id: 'Qe9WSybioZxssVEwlBSo', name: 'Vincent', desc: 'Calm British male — deep, relaxed and reassuring', sample: 'Good morning. Everything is under control.' },
  { id: 'flHkNRp1BlvT73UL6gyz', name: 'Jessica', desc: 'The Villain — for those who like their briefings dramatic', sample: 'Good morning. Your enemies won\'t know what\'s coming.' },
]

export default function SchoolSettingsPage() {
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [activeVoice, setActiveVoice] = useState(VOICES[0].id)
  const [previewing, setPreviewing] = useState<string | null>(null)
  const [schoolName, setSchoolName] = useState('')
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('lumio_tts_enabled')
    if (stored === 'false') setTtsEnabled(false)
    const voice = localStorage.getItem('lumio_active_voice')
    if (voice) setActiveVoice(voice)
    const vc = localStorage.getItem('lumio_voice_commands')
    if (vc === 'true') setVoiceEnabled(true)
    const name = localStorage.getItem('lumio_school_name') || ''
    setSchoolName(name)
  }, [])

  function toggleTts() {
    const next = !ttsEnabled
    setTtsEnabled(next)
    localStorage.setItem('lumio_tts_enabled', String(next))
  }

  function toggleVoice() {
    const next = !voiceEnabled
    setVoiceEnabled(next)
    localStorage.setItem('lumio_voice_commands', String(next))
  }

  function selectVoice(id: string) {
    setActiveVoice(id)
    localStorage.setItem('lumio_active_voice', id)
  }

  async function preview(voice: typeof VOICES[0]) {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    if (previewing === voice.id) { setPreviewing(null); return }
    setPreviewing(voice.id)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      const wsToken = localStorage.getItem('workspace_session_token')
      const demoToken = localStorage.getItem('demo_session_token')
      if (wsToken) headers['x-workspace-token'] = wsToken
      else if (demoToken) headers['x-demo-token'] = demoToken
      const res = await fetch('/api/tts', { method: 'POST', headers, body: JSON.stringify({ text: voice.sample, voice_id: voice.id }) })
      if (!res.ok) throw new Error('TTS failed')
      const buf = await res.arrayBuffer()
      const blob = new Blob([buf], { type: 'audio/mpeg' })
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => { setPreviewing(null); URL.revokeObjectURL(url) }
      audio.onerror = () => { setPreviewing(null); URL.revokeObjectURL(url) }
      await audio.play()
    } catch { setPreviewing(null) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Settings</h1>
        <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{schoolName || 'School'} workspace settings</p>
      </div>

      {/* TTS Toggle */}
      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(13,148,136,0.15)' }}>
              <Volume2 size={15} style={{ color: '#0D9488' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>AI Morning Briefing</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>Text-to-speech daily summary using ElevenLabs</p>
            </div>
          </div>
          <button onClick={toggleTts} className="relative w-11 h-6 rounded-full transition-colors" style={{ backgroundColor: ttsEnabled ? '#0D9488' : '#374151' }}>
            <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{ left: ttsEnabled ? 22 : 2 }} />
          </button>
        </div>
      </div>

      {/* Voice Commands Toggle */}
      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(108,63,197,0.15)' }}>
              <Mic size={15} style={{ color: '#A78BFA' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Voice Commands</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>Say &quot;Hi Lumio&quot; to control your dashboard by voice</p>
            </div>
          </div>
          <button onClick={toggleVoice} className="relative w-11 h-6 rounded-full transition-colors" style={{ backgroundColor: voiceEnabled ? '#0D9488' : '#374151' }}>
            <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{ left: voiceEnabled ? 22 : 2 }} />
          </button>
        </div>
      </div>

      {/* Voice Selector */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <span className="text-base">🎙️</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Voice Assistant</p>
            <p className="text-xs" style={{ color: '#6B7280' }}>Choose the voice for your AI morning briefing</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-5">
          {VOICES.map(voice => {
            const isActive = activeVoice === voice.id
            const isPreviewing = previewing === voice.id
            return (
              <div key={voice.id} className="rounded-xl p-4 transition-colors"
                style={{ backgroundColor: '#0A0B10', border: isActive ? '1px solid #0D9488' : '1px solid #1F2937' }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{voice.name}</p>
                  {isActive && <div className="flex h-5 w-5 items-center justify-center rounded-full" style={{ backgroundColor: '#0D9488' }}><Check size={10} color="white" /></div>}
                </div>
                <p className="text-xs mb-3" style={{ color: '#6B7280', lineHeight: 1.5 }}>{voice.desc}</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => preview(voice)} className="flex-1 py-2 rounded-lg text-xs font-semibold transition-colors"
                    style={{ backgroundColor: isPreviewing ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.05)', color: isPreviewing ? '#A78BFA' : '#9CA3AF', border: isPreviewing ? '1px solid rgba(124,58,237,0.3)' : '1px solid #1F2937' }}>
                    {isPreviewing ? '■ Stop' : '▶ Preview'}
                  </button>
                  {!isActive && (
                    <button onClick={() => selectVoice(voice.id)} className="flex-1 py-2 rounded-lg text-xs font-semibold transition-colors"
                      style={{ backgroundColor: 'rgba(13,148,136,0.1)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.3)' }}>
                      Select
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
