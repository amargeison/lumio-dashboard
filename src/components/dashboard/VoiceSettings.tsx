'use client'

import { useState } from 'react'

interface VoiceCommand {
  phrase: string
  description: string
}

interface VoiceSettingsProps {
  commands: VoiceCommand[]
}

const CARD = { backgroundColor: '#111318', border: '1px solid #1F2937', borderRadius: 12, padding: 20 } as const
const LABEL = { color: '#9CA3AF', fontSize: 12, display: 'block', marginBottom: 4 } as const

export default function VoiceSettings({ commands }: VoiceSettingsProps) {
  const [speakRate, setSpeakRate] = useState(1.0)
  const [speakPitch, setSpeakPitch] = useState(1.0)
  const [speakVolume, setSpeakVolume] = useState(0.8)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [audioResponses, setAudioResponses] = useState(true)
  const [showTextCard, setShowTextCard] = useState(true)
  const [autoListen, setAutoListen] = useState(false)

  function testCurrentSettings() {
    const u = new SpeechSynthesisUtterance('This is a test of your current voice settings.')
    u.rate = speakRate
    u.pitch = speakPitch
    u.volume = speakVolume
    speechSynthesis.speak(u)
  }

  function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
    return (
      <div className="flex items-center justify-between py-1.5">
        <span className="text-xs" style={{ color: '#D1D5DB' }}>{label}</span>
        <button onClick={onToggle} style={{ width: 36, height: 20, borderRadius: 10, backgroundColor: on ? '#0D9488' : '#374151', position: 'relative', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}>
          <span style={{ position: 'absolute', top: 2, left: on ? 18 : 2, width: 16, height: 16, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s' }} />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Speech Settings */}
      <div style={CARD}>
        <h3 className="text-sm font-bold mb-4" style={{ color: '#F9FAFB' }}>Speech Settings</h3>
        <div className="space-y-4">
          <div><label style={LABEL}>Speaking Rate: {speakRate.toFixed(1)}</label><input type="range" min="0.7" max="1.3" step="0.1" value={speakRate} onChange={e => setSpeakRate(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#0D9488' }} /></div>
          <div><label style={LABEL}>Pitch: {speakPitch.toFixed(1)}</label><input type="range" min="0.8" max="1.2" step="0.1" value={speakPitch} onChange={e => setSpeakPitch(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#0D9488' }} /></div>
          <div><label style={LABEL}>Volume: {speakVolume.toFixed(1)}</label><input type="range" min="0" max="1" step="0.1" value={speakVolume} onChange={e => setSpeakVolume(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#0D9488' }} /></div>
          <button onClick={testCurrentSettings} className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#0D9488', color: '#F9FAFB', border: 'none', cursor: 'pointer' }}>Test Current Settings</button>
        </div>
      </div>

      {/* Voice Commands */}
      <div style={CARD}>
        <h3 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Voice Commands</h3>
        <div className="space-y-1">
          <Toggle on={voiceEnabled} onToggle={() => setVoiceEnabled(!voiceEnabled)} label="Voice commands enabled" />
          <Toggle on={audioResponses} onToggle={() => setAudioResponses(!audioResponses)} label="Play audio responses" />
          <Toggle on={showTextCard} onToggle={() => setShowTextCard(!showTextCard)} label="Show text response card alongside audio" />
          <Toggle on={autoListen} onToggle={() => setAutoListen(!autoListen)} label="Auto-listen after wake word detected" />
        </div>
        <div className="mt-4">
          <p className="text-xs font-semibold mb-2" style={{ color: '#6B7280' }}>RECOGNISED COMMANDS</p>
          <div className="space-y-1">
            {commands.map(c => (
              <div key={c.phrase} className="flex items-center gap-2 py-1.5 px-3 rounded-lg" style={{ backgroundColor: '#0A0B10' }}>
                <code className="text-xs" style={{ color: '#2DD4BF' }}>&ldquo;{c.phrase}&rdquo;</code>
                <span className="text-xs" style={{ color: '#4B5563' }}>— {c.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
