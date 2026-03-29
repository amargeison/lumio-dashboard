'use client'

import { useState, useEffect, useRef } from 'react'
import { Volume2, Mic, Check, Zap } from 'lucide-react'

const VOICES = [
  { id: 'alFofuDn3cOwyoz1i44T', name: 'Dallin', desc: 'Positive & clear', sample: 'Good morning.' },
  { id: 'Qe9WSybioZxssVEwlBSo', name: 'Vincent', desc: 'Calm British male', sample: 'Good morning.' },
  { id: 'flHkNRp1BlvT73UL6gyz', name: 'Jessica', desc: 'The Villain', sample: 'Good morning.' },
]

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className="relative flex-shrink-0" style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: on ? '#0D9488' : '#374151', transition: 'background 0.2s', border: 'none', cursor: 'pointer' }}>
      <span style={{ position: 'absolute', top: 3, left: on ? 22 : 3, width: 18, height: 18, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s' }} />
    </button>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
        <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{title}</p>
      </div>
      {children}
    </div>
  )
}

export default function DemoSchoolSettingsPage() {
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [activeVoice, setActiveVoice] = useState(VOICES[0].id)
  const [previewing, setPreviewing] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (localStorage.getItem('lumio_tts_enabled') === 'false') setTtsEnabled(false)
    if (localStorage.getItem('lumio_voice_commands_enabled') === 'true') setVoiceEnabled(true)
    const v = localStorage.getItem('lumio_tts_voice')
    if (v) setActiveVoice(v)
  }, [])

  function selectVoice(id: string) {
    setActiveVoice(id)
    localStorage.setItem('lumio_tts_voice', id)
  }

  function toggleTts() {
    const next = !ttsEnabled
    setTtsEnabled(next)
    localStorage.setItem('lumio_tts_enabled', String(next))
  }

  function toggleVoice() {
    const next = !voiceEnabled
    setVoiceEnabled(next)
    localStorage.setItem('lumio_voice_commands_enabled', String(next))
  }

  async function preview(voice: typeof VOICES[0]) {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    if (previewing === voice.id) { setPreviewing(null); return }
    setPreviewing(voice.id)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      const t = localStorage.getItem('workspace_session_token') || localStorage.getItem('demo_session_token')
      if (t) { headers['x-workspace-token'] = t; headers['x-demo-token'] = t }
      const res = await fetch('/api/tts', { method: 'POST', headers, body: JSON.stringify({ text: voice.sample, voice_id: voice.id }) })
      if (!res.ok) throw new Error()
      const buf = await res.arrayBuffer()
      const url = URL.createObjectURL(new Blob([buf], { type: 'audio/mpeg' }))
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => { setPreviewing(null); URL.revokeObjectURL(url) }
      audio.onerror = () => { setPreviewing(null); URL.revokeObjectURL(url) }
      await audio.play()
    } catch { setPreviewing(null) }
  }

  return (
    <div className="max-w-2xl space-y-6">

      {/* Demo mode notice */}
      <div className="flex items-center gap-3 rounded-xl px-5 py-3" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.3)' }}>
        <Zap size={14} style={{ color: '#0D9488', flexShrink: 0 }} />
        <p className="text-sm" style={{ color: '#D1D5DB' }}>
          You're in demo mode — upgrade to Lumio to save settings permanently
        </p>
      </div>

      <div>
        <h1 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Settings</h1>
        <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Demo workspace settings</p>
      </div>

      {/* Voice Assistant */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Voice Assistant</p>
          <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Choose the voice for your AI morning briefing</p>
        </div>
        <div className="px-5 pt-4 space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
            <div>
              <div className="flex items-center gap-2 font-semibold text-sm" style={{ color: '#F9FAFB' }}>
                <Volume2 size={14} /> Text to Speech
              </div>
              <div className="text-xs mt-0.5" style={{ color: '#6B7280' }}>AI voice reads your morning briefing</div>
            </div>
            <Toggle on={ttsEnabled} onChange={toggleTts} />
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
            <div>
              <div className="flex items-center gap-2 font-semibold text-sm" style={{ color: '#F9FAFB' }}>
                <Mic size={14} /> Voice Commands
              </div>
              <div className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Say "Hi Lumio" to activate voice control</div>
            </div>
            <Toggle on={voiceEnabled} onChange={toggleVoice} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-5">
          {VOICES.map(voice => {
            const isActive = activeVoice === voice.id
            const isPreviewing = previewing === voice.id
            return (
              <div key={voice.id} className="rounded-xl p-4" style={{ backgroundColor: '#0A0B10', border: isActive ? '1px solid #0D9488' : '1px solid #1F2937' }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{voice.name}</p>
                  {isActive && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488' }}>Active</span>}
                </div>
                <p className="text-xs mb-4 leading-relaxed" style={{ color: '#6B7280' }}>{voice.desc}</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => preview(voice)} className="flex-1 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: isPreviewing ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.05)', color: isPreviewing ? '#A78BFA' : '#9CA3AF', border: isPreviewing ? '1px solid rgba(124,58,237,0.3)' : '1px solid #1F2937' }}>
                    {isPreviewing ? 'Stop' : 'Preview'}
                  </button>
                  {!isActive && <button onClick={() => selectVoice(voice.id)} className="flex-1 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: 'rgba(13,148,136,0.1)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.3)' }}>Select</button>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* School Details (read-only in demo) */}
      <Section title="School Details">
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: '#9CA3AF' }}>School name</span>
            <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>Oakridge Primary School</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: '#9CA3AF' }}>School type</span>
            <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>Primary</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: '#9CA3AF' }}>Ofsted rating</span>
            <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>Good</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: '#9CA3AF' }}>Status</span>
            <span className="text-sm font-medium" style={{ color: '#22C55E' }}>Active</span>
          </div>
        </div>
      </Section>

      {/* Team */}
      <Section title="Team">
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: '#9CA3AF' }}>Staff members</span>
            <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>1 (you)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: '#9CA3AF' }}>Pending invites</span>
            <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>0</span>
          </div>
        </div>
      </Section>
    </div>
  )
}
