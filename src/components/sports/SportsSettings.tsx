'use client'

import React, { useState, useEffect } from 'react'
import type { ReactNode } from 'react'

// ─── TYPES ─────────────────────────────────────────────────────────────────
export type SportKey =
  | 'tennis' | 'golf' | 'darts' | 'boxing' | 'cricket'
  | 'rugby'  | 'football' | 'womens' | 'grassroots' | 'nonleague'

export type PortalEntity = 'player' | 'club'

export interface ProfileLabels {
  name: string
  tour?: string
  tourValue?: string
  ranking?: string
  rankingValue?: string
  coach?: string
  coachValue?: string
  agent?: string
  agentValue?: string
  homeVenue?: string
  homeVenueValue?: string
  playerIdLabel?: string
  staffInviteRoles?: string[]
}

export interface SportConfigField {
  id: string
  label: string
  description?: string
  kind: 'text' | 'number' | 'select' | 'color' | 'checkboxGroup' | 'readonly'
  placeholder?: string
  options?: string[]
  defaultValue?: string | string[]
  storageKey?: string
}

export interface IntegrationGroup {
  title: string
  items: { name: string; desc: string; connected?: boolean }[]
}

export interface VoiceOption {
  id: string
  name: string
  desc: string
}

export interface SportsSettingsProps {
  sport: SportKey
  slug: string
  sportLabel: string
  entity: PortalEntity
  accentColour: string
  accentLight?: string
  session: { userName?: string; photoDataUrl?: string | null }
  profile: ProfileLabels
  configFields: SportConfigField[]
  integrationGroups?: IntegrationGroup[]
  voiceOptions?: VoiceOption[]
  voiceCommands?: { phrase: string; description: string }[]
  showWorldClock?: boolean
  showAppearance?: boolean
  defaultBrandPrimary?: string
  defaultBrandSecondary?: string
  teamInvite?: {
    enabled: boolean
    staffCount?: number
    pendingInvites?: number
    roleOptions: string[]
    members?: { name: string; role: string; access: string }[]
  }
  notificationPreferences?: string[]
  showDeveloperTools?: boolean
  devApiRouteOptions?: string[]
  extraSections?: ReactNode
  topExtraSections?: ReactNode
  storagePrefix?: string
  onPhotoChange?: (dataUrl: string) => void
  photoDataUrl?: string | null
  onLogoUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onLogoRemove?: () => void
}

// ─── DATA ──────────────────────────────────────────────────────────────────
const ALL_TZ: { label: string; tz: string }[] = [
  { label: 'London', tz: 'Europe/London' },
  { label: 'New York', tz: 'America/New_York' },
  { label: 'Melbourne', tz: 'Australia/Melbourne' },
  { label: 'Dubai', tz: 'Asia/Dubai' },
  { label: 'Paris', tz: 'Europe/Paris' },
  { label: 'Tokyo', tz: 'Asia/Tokyo' },
  { label: 'Los Angeles', tz: 'America/Los_Angeles' },
  { label: 'Shanghai', tz: 'Asia/Shanghai' },
  { label: 'Madrid', tz: 'Europe/Madrid' },
  { label: 'Rome', tz: 'Europe/Rome' },
  { label: 'Miami', tz: 'America/New_York' },
  { label: 'Indian Wells', tz: 'America/Los_Angeles' },
  { label: 'Sydney', tz: 'Australia/Sydney' },
  { label: 'Las Vegas', tz: 'America/Los_Angeles' },
]

const DEFAULT_ZONES: { label: string; tz: string }[] = [
  { label: 'London', tz: 'Europe/London' },
  { label: 'New York', tz: 'America/New_York' },
  { label: 'Melbourne', tz: 'Australia/Melbourne' },
  { label: 'Dubai', tz: 'Asia/Dubai' },
]

// ─── COMPONENT ─────────────────────────────────────────────────────────────
export default function SportsSettings(props: SportsSettingsProps) {
  const {
    sport,
    slug,
    sportLabel,
    accentColour,
    accentLight,
    session,
    profile,
    configFields,
    integrationGroups,
    voiceOptions,
    showWorldClock = true,
    showAppearance = true,
    defaultBrandPrimary = '#7C3AED',
    defaultBrandSecondary = '#FFFFFF',
    teamInvite,
    showDeveloperTools = true,
    devApiRouteOptions,
    extraSections,
    topExtraSections,
    storagePrefix: storagePrefixProp,
  } = props

  const ACCENT = accentColour
  const ACCENT_LIGHT = accentLight || accentColour
  const storagePrefix = storagePrefixProp ?? `lumio_${sport}_`

  const profilePhotoKey = `${storagePrefix}profile_photo`
  const nameKey = `${storagePrefix}name`
  const nicknameKey = `${storagePrefix}nickname`
  const brandPrimaryKey = `${storagePrefix}brand_primary`
  const brandSecondaryKey = `${storagePrefix}brand_secondary`
  const demoActiveKey = `${storagePrefix}demo_active`

  // ─── State (all hooks at top, no conditionals) ──────────────────────────
  const [currentPhoto, setCurrentPhoto] = useState<string>(() =>
    typeof window !== 'undefined' ? localStorage.getItem(profilePhotoKey) || '' : ''
  )
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState<string>(() => {
    if (typeof window === 'undefined') return session?.userName || profile.name || ''
    return localStorage.getItem(nameKey) || session?.userName || profile.name || ''
  })
  const [editingNickname, setEditingNickname] = useState(false)
  const [nicknameValue, setNicknameValue] = useState<string>(() =>
    typeof window !== 'undefined' ? localStorage.getItem(nicknameKey) || '' : ''
  )
  const [ttsOn, setTtsOn] = useState<boolean>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('lumio_tts_enabled') !== 'false' : true
  )
  const [activeVoice, setActiveVoice] = useState<string>(() =>
    typeof window !== 'undefined'
      ? localStorage.getItem('lumio_tts_voice') || (voiceOptions?.[0]?.id ?? 'EXAVITQu4vr4xnSDxMaL')
      : (voiceOptions?.[0]?.id ?? 'EXAVITQu4vr4xnSDxMaL')
  )
  const [zones, setZones] = useState<{ label: string; tz: string }[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_ZONES
    try {
      const s = localStorage.getItem('lumio_world_zones')
      return s ? JSON.parse(s) : DEFAULT_ZONES
    } catch {
      return DEFAULT_ZONES
    }
  })
  const [devApiRoute, setDevApiRoute] = useState<string>(
    devApiRouteOptions?.[0] ?? `/api/ai/${sport}`
  )
  const [devPrompt, setDevPrompt] = useState('')
  const [devResponse, setDevResponse] = useState('')
  const [lsKeys, setLsKeys] = useState<{ key: string; value: string }[]>([])
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null)
  const [brandPrimary, setBrandPrimary] = useState<string>(() =>
    typeof window !== 'undefined'
      ? localStorage.getItem(brandPrimaryKey) || defaultBrandPrimary
      : defaultBrandPrimary
  )
  const [brandSecondary, setBrandSecondary] = useState<string>(() =>
    typeof window !== 'undefined'
      ? localStorage.getItem(brandSecondaryKey) || defaultBrandSecondary
      : defaultBrandSecondary
  )

  // ─── checkboxGroup state: one boolean map per checkboxGroup field ───────
  const [checkboxGroupState, setCheckboxGroupState] = useState<Record<string, Record<string, boolean>>>(() => {
    const init: Record<string, Record<string, boolean>> = {}
    for (const f of configFields) {
      if (f.kind === 'checkboxGroup') {
        const opts = f.options || []
        const selectedDefault = Array.isArray(f.defaultValue) ? f.defaultValue : opts
        const map: Record<string, boolean> = {}
        for (const o of opts) map[o] = selectedDefault.includes(o)
        init[f.id] = map
      }
    }
    return init
  })

  // ─── simple state for text/number/select/color config fields ────────────
  const [configValues, setConfigValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const f of configFields) {
      if (f.kind === 'text' || f.kind === 'number' || f.kind === 'select' || f.kind === 'color') {
        const fallback = typeof f.defaultValue === 'string' ? f.defaultValue : ''
        if (typeof window !== 'undefined' && f.storageKey) {
          init[f.id] = localStorage.getItem(f.storageKey) || fallback
        } else {
          init[f.id] = fallback
        }
      }
    }
    return init
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = (e: StorageEvent) => {
      if (e.key === 'lumio_world_zones' && e.newValue) {
        try { setZones(JSON.parse(e.newValue)) } catch {}
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  // ─── Helpers ────────────────────────────────────────────────────────────
  const getVoicesReadySettings = (): Promise<SpeechSynthesisVoice[]> =>
    new Promise(resolve => {
      if (typeof window === 'undefined') return resolve([])
      const v = window.speechSynthesis.getVoices()
      if (v.length > 0) return resolve(v)
      window.speechSynthesis.onvoiceschanged = () =>
        resolve(window.speechSynthesis.getVoices())
    })

  const previewVoice = async (voiceName: string) => {
    if (typeof window === 'undefined') return
    if (previewingVoice === voiceName) {
      window.speechSynthesis.cancel()
      setPreviewingVoice(null)
      return
    }
    window.speechSynthesis.cancel()
    const allVoices = await getVoicesReadySettings()
    const vm: Record<string, string[]> = {
      'Sarah': ['Google UK English Female', 'Microsoft Libby', 'Karen', 'Veena'],
      'Charlotte': ['Microsoft Hazel', 'Fiona', 'Samantha', 'Google UK English Female'],
      'George': ['Google UK English Male', 'Microsoft George', 'Daniel', 'Alex'],
    }
    const match =
      allVoices.find(v => (vm[voiceName] || []).some(p => v.name.includes(p))) ||
      allVoices.find(v =>
        voiceName === 'George'
          ? v.lang.startsWith('en') && v.name.toLowerCase().includes('male')
          : v.lang.startsWith('en') && !v.name.toLowerCase().includes('male')
      )
    const utterance = new SpeechSynthesisUtterance(
      `Good morning. Here's your daily ${sportLabel.toLowerCase()} briefing.`
    )
    if (match) utterance.voice = match
    utterance.pitch = voiceName === 'George' ? 0.75 : voiceName === 'Charlotte' ? 1.25 : 1.1
    utterance.rate = voiceName === 'George' ? 0.92 : 0.95
    utterance.onend = () => setPreviewingVoice(null)
    utterance.onerror = () => setPreviewingVoice(null)
    setPreviewingVoice(voiceName)
    window.speechSynthesis.speak(utterance)
  }

  function toggleZone(zone: { label: string; tz: string }) {
    const exists = zones.some(z => z.tz === zone.tz && z.label === zone.label)
    let next: { label: string; tz: string }[]
    if (exists) {
      next = zones.filter(z => !(z.tz === zone.tz && z.label === zone.label))
    } else {
      if (zones.length >= 4) return
      next = [...zones, zone]
    }
    setZones(next)
    localStorage.setItem('lumio_world_zones', JSON.stringify(next))
    window.dispatchEvent(
      new StorageEvent('storage', { key: 'lumio_world_zones', newValue: JSON.stringify(next) })
    )
  }

  const isDev =
    typeof window !== 'undefined' &&
    (window.location.hostname.includes('dev.') ||
      localStorage.getItem('lumio_dev_mode') === 'true')

  function refreshLsKeys() {
    if (typeof window === 'undefined') return
    const keys: { key: string; value: string }[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith('lumio_')) {
        keys.push({ key: k, value: localStorage.getItem(k) || '' })
      }
    }
    setLsKeys(keys)
  }

  function ToggleBtn({ on, onToggle }: { on: boolean; onToggle: () => void }) {
    return (
      <button
        onClick={onToggle}
        className="flex-shrink-0"
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          backgroundColor: on ? ACCENT : '#374151',
          transition: 'background 0.2s',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 3,
            left: on ? 22 : 3,
            width: 18,
            height: 18,
            borderRadius: '50%',
            backgroundColor: '#fff',
            transition: 'left 0.2s',
          }}
        />
      </button>
    )
  }

  const updateConfigValue = (id: string, value: string, storageKey?: string) => {
    setConfigValues(prev => ({ ...prev, [id]: value }))
    if (storageKey && typeof window !== 'undefined') {
      try { localStorage.setItem(storageKey, value) } catch {}
    }
  }

  // ─── RENDER ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>Settings</h2>
        <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>
          Configure your {sportLabel.toLowerCase()} portal preferences.
        </p>
      </div>

      {/* ── Profile ──────────────────────────────────────────────── */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Profile</p>
        </div>
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-sm" style={{ color: '#9CA3AF' }}>Profile Photo</span>
            <div className="flex items-center gap-3">
              {currentPhoto || session.photoDataUrl ? (
                <img
                  src={currentPhoto || session.photoDataUrl || ''}
                  alt="Profile"
                  className="w-11 h-11 rounded-full object-cover"
                  style={{ border: `2px solid ${ACCENT}` }}
                />
              ) : (
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center"
                  style={{
                    background: `${ACCENT}20`,
                    border: `2px solid ${ACCENT}`,
                    color: ACCENT,
                    fontWeight: 700,
                    fontSize: 16,
                  }}
                >
                  {(session.userName || 'U')[0]}
                </div>
              )}
              <input
                type="file"
                id={`${sport}-settings-photo-upload`}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = ev => {
                    const img = new window.Image()
                    img.onload = () => {
                      const canvas = document.createElement('canvas')
                      canvas.width = 400
                      canvas.height = 400
                      const ctx = canvas.getContext('2d')
                      if (!ctx) return
                      ctx.drawImage(img, 0, 0, 400, 400)
                      const compressed = canvas.toDataURL('image/jpeg', 0.7)
                      try { localStorage.setItem(profilePhotoKey, compressed) } catch {}
                      setCurrentPhoto(compressed)
                      props.onPhotoChange?.(compressed)
                    }
                    img.src = ev.target?.result as string
                  }
                  reader.readAsDataURL(file)
                  e.target.value = ''
                }}
              />
              <button
                onClick={() => document.getElementById(`${sport}-settings-photo-upload`)?.click()}
                className="text-xs font-semibold px-4 py-2 rounded-lg"
                style={{ background: `${ACCENT}20`, border: `1px solid ${ACCENT}`, color: ACCENT }}
              >
                Change Photo
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-sm" style={{ color: '#9CA3AF' }}>Name</span>
            {editingName ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  value={nameValue}
                  onChange={e => setNameValue(e.target.value)}
                  autoFocus
                  style={{
                    background: '#ffffff10',
                    border: `1px solid ${ACCENT}`,
                    borderRadius: 8,
                    padding: '6px 12px',
                    color: '#fff',
                    fontSize: 14,
                    width: 160,
                  }}
                />
                <button
                  onClick={() => {
                    localStorage.setItem(nameKey, nameValue)
                    setEditingName(false)
                  }}
                  style={{
                    background: ACCENT,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '6px 14px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingName(false)}
                  style={{
                    background: 'transparent',
                    color: '#94a3b8',
                    border: '1px solid #ffffff20',
                    borderRadius: 8,
                    padding: '6px 12px',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{nameValue}</span>
                <button
                  onClick={() => setEditingName(true)}
                  style={{
                    background: 'transparent',
                    color: ACCENT,
                    border: `1px solid ${ACCENT}30`,
                    borderRadius: 8,
                    padding: '4px 10px',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-sm" style={{ color: '#9CA3AF' }}>Nickname</span>
            {editingNickname ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  value={nicknameValue}
                  onChange={e => setNicknameValue(e.target.value)}
                  placeholder={'"The Hammer"'}
                  autoFocus
                  style={{
                    background: '#ffffff10',
                    border: `1px solid ${ACCENT}`,
                    borderRadius: 8,
                    padding: '6px 12px',
                    color: '#fff',
                    fontSize: 14,
                    width: 160,
                  }}
                />
                <button
                  onClick={() => {
                    localStorage.setItem(nicknameKey, nicknameValue)
                    setEditingNickname(false)
                  }}
                  style={{
                    background: ACCENT,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '6px 14px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingNickname(false)}
                  style={{
                    background: 'transparent',
                    color: '#94a3b8',
                    border: '1px solid #ffffff20',
                    borderRadius: 8,
                    padding: '6px 12px',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  className="text-sm"
                  style={{
                    color: nicknameValue ? '#F9FAFB' : '#475569',
                    fontStyle: nicknameValue ? 'normal' : 'italic',
                  }}
                >
                  {nicknameValue || 'Not set'}
                </span>
                <button
                  onClick={() => setEditingNickname(true)}
                  style={{
                    background: 'transparent',
                    color: ACCENT,
                    border: `1px solid ${ACCENT}30`,
                    borderRadius: 8,
                    padding: '4px 10px',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          {profile.tour && (
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-sm" style={{ color: '#9CA3AF' }}>{profile.tour}</span>
              <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{profile.tourValue ?? '—'}</span>
            </div>
          )}
          {profile.ranking && (
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-sm" style={{ color: '#9CA3AF' }}>{profile.ranking}</span>
              <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{profile.rankingValue ?? '—'}</span>
            </div>
          )}
          {profile.coach && (
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-sm" style={{ color: '#9CA3AF' }}>{profile.coach}</span>
              <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{profile.coachValue ?? '—'}</span>
            </div>
          )}
          {profile.agent && (
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-sm" style={{ color: '#9CA3AF' }}>{profile.agent}</span>
              <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{profile.agentValue ?? '—'}</span>
            </div>
          )}
          {profile.homeVenue && (
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-sm" style={{ color: '#9CA3AF' }}>{profile.homeVenue}</span>
              <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{profile.homeVenueValue ?? '—'}</span>
            </div>
          )}
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm" style={{ color: '#9CA3AF' }}>Season</span>
            <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>2025-26</span>
          </div>
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm" style={{ color: '#9CA3AF' }}>Plan</span>
            <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>Lumio {sportLabel} Pro</span>
          </div>
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm" style={{ color: '#9CA3AF' }}>Status</span>
            <span
              className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
              style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22C55E' }}
            >
              Active
            </span>
          </div>
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm" style={{ color: '#9CA3AF' }}>Billing</span>
            <button
              className="text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{
                backgroundColor: `${ACCENT}1a`,
                color: ACCENT_LIGHT,
                border: `1px solid ${ACCENT}4d`,
              }}
            >
              Manage billing
            </button>
          </div>
        </div>
      </div>

      {topExtraSections}

      {/* ── Sport Configuration ───────────────────────────────────── */}
      {configFields.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{sportLabel} Configuration</p>
          </div>
          <div className="divide-y" style={{ borderColor: '#1F2937' }}>
            {configFields.map(field => {
              if (field.kind === 'readonly') {
                const fallback = typeof field.defaultValue === 'string' ? field.defaultValue : '—'
                return (
                  <div key={field.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm" style={{ color: '#F9FAFB' }}>{field.label}</p>
                      {field.description && (
                        <p className="text-xs" style={{ color: '#6B7280' }}>{field.description}</p>
                      )}
                    </div>
                    <span className="text-sm font-medium font-mono" style={{ color: '#F9FAFB' }}>{fallback}</span>
                  </div>
                )
              }
              if (field.kind === 'text' || field.kind === 'number') {
                return (
                  <div key={field.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm" style={{ color: '#F9FAFB' }}>{field.label}</p>
                      {field.description && (
                        <p className="text-xs" style={{ color: '#6B7280' }}>{field.description}</p>
                      )}
                    </div>
                    <input
                      type={field.kind === 'number' ? 'number' : 'text'}
                      placeholder={field.placeholder}
                      value={configValues[field.id] ?? ''}
                      onChange={e => updateConfigValue(field.id, e.target.value, field.storageKey)}
                      className="text-sm rounded-lg px-3 py-1.5 outline-none w-40 text-right"
                      style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937', color: '#F9FAFB' }}
                    />
                  </div>
                )
              }
              if (field.kind === 'select') {
                return (
                  <div key={field.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm" style={{ color: '#F9FAFB' }}>{field.label}</p>
                      {field.description && (
                        <p className="text-xs" style={{ color: '#6B7280' }}>{field.description}</p>
                      )}
                    </div>
                    <select
                      value={configValues[field.id] ?? ''}
                      onChange={e => updateConfigValue(field.id, e.target.value, field.storageKey)}
                      className="text-sm rounded-lg px-3 py-1.5 outline-none"
                      style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937', color: '#F9FAFB' }}
                    >
                      {(field.options || []).map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                )
              }
              if (field.kind === 'color') {
                return (
                  <div key={field.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm" style={{ color: '#F9FAFB' }}>{field.label}</p>
                      {field.description && (
                        <p className="text-xs" style={{ color: '#6B7280' }}>{field.description}</p>
                      )}
                    </div>
                    <input
                      type="color"
                      value={configValues[field.id] || (typeof field.defaultValue === 'string' ? field.defaultValue : '#000000')}
                      onChange={e => updateConfigValue(field.id, e.target.value, field.storageKey)}
                      className="w-10 h-8 rounded cursor-pointer"
                      style={{ border: '1px solid #374151' }}
                    />
                  </div>
                )
              }
              if (field.kind === 'checkboxGroup') {
                const current = checkboxGroupState[field.id] || {}
                return (
                  <div key={field.id} className="px-5 py-3">
                    <p className="text-sm mb-2" style={{ color: '#F9FAFB' }}>{field.label}</p>
                    {field.description && (
                      <p className="text-xs mb-2" style={{ color: '#6B7280' }}>{field.description}</p>
                    )}
                    <div className="flex gap-3 flex-wrap">
                      {(field.options || []).map(opt => (
                        <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!current[opt]}
                            onChange={() =>
                              setCheckboxGroupState(prev => ({
                                ...prev,
                                [field.id]: { ...prev[field.id], [opt]: !prev[field.id]?.[opt] },
                              }))
                            }
                            className="rounded border-gray-600"
                            style={{ accentColor: ACCENT }}
                          />
                          <span className="text-xs" style={{ color: '#D1D5DB' }}>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              }
              return null
            })}
          </div>
        </div>
      )}

      {/* ── Integrations ──────────────────────────────────────────── */}
      {integrationGroups && integrationGroups.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Integrations</p>
          </div>
          <div className="p-5 space-y-5">
            {integrationGroups.map(group => (
              <div key={group.title}>
                <p className="text-xs font-semibold mb-2" style={{ color: '#6B7280', letterSpacing: '0.05em' }}>
                  {group.title}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {group.items.map(integ => (
                    <div
                      key={integ.name}
                      className="flex items-center justify-between rounded-lg px-4 py-3"
                      style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: '#F9FAFB' }}>{integ.name}</p>
                        <p className="text-xs truncate" style={{ color: '#6B7280' }}>{integ.desc}</p>
                      </div>
                      <button
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 ml-3"
                        style={{
                          backgroundColor: integ.connected ? 'rgba(16,185,129,0.15)' : `${ACCENT}1a`,
                          color: integ.connected ? '#10b981' : ACCENT_LIGHT,
                          border: integ.connected ? '1px solid rgba(16,185,129,0.3)' : `1px solid ${ACCENT}4d`,
                        }}
                      >
                        {integ.connected ? 'Connected' : 'Connect'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Team & Staff ──────────────────────────────────────────── */}
      {teamInvite && teamInvite.enabled && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Team & Staff</p>
          </div>
          <div className="divide-y" style={{ borderColor: '#1F2937' }}>
            {teamInvite.members && teamInvite.members.length > 0 ? (
              teamInvite.members.map((m, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <div className="text-sm" style={{ color: '#F9FAFB' }}>{m.name}</div>
                    <div className="text-xs" style={{ color: '#6B7280' }}>{m.role}</div>
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      backgroundColor:
                        m.access === 'Full'
                          ? 'rgba(20,184,166,0.15)'
                          : m.access === 'Commercial'
                          ? 'rgba(234,179,8,0.15)'
                          : 'rgba(59,130,246,0.15)',
                      color:
                        m.access === 'Full'
                          ? '#2dd4bf'
                          : m.access === 'Commercial'
                          ? '#facc15'
                          : '#60a5fa',
                    }}
                  >
                    {m.access}
                  </span>
                </div>
              ))
            ) : (
              <>
                <div className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm" style={{ color: '#9CA3AF' }}>Staff members</span>
                  <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>
                    {teamInvite.staffCount ?? 1} (you)
                  </span>
                </div>
                <div className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm" style={{ color: '#9CA3AF' }}>Pending invites</span>
                  <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>
                    {teamInvite.pendingInvites ?? 0}
                  </span>
                </div>
              </>
            )}
            <div className="px-5 py-4">
              <p className="text-xs font-semibold mb-3" style={{ color: '#6B7280', letterSpacing: '0.05em' }}>
                INVITE STAFF MEMBER
              </p>
              <div className="flex gap-2">
                <input
                  placeholder="colleague@team.com"
                  className="flex-1 text-sm rounded-lg px-3 py-2.5 outline-none"
                  style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937', color: '#F9FAFB' }}
                />
                <select
                  className="text-sm rounded-lg px-3 py-2.5 outline-none"
                  style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937', color: '#F9FAFB' }}
                >
                  {teamInvite.roleOptions.map(r => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
                <button
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap"
                  style={{ backgroundColor: ACCENT, color: '#fff' }}
                >
                  Send Invite
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Voice Assistant ────────────────────────────────────────── */}
      {voiceOptions && voiceOptions.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
            <div className="flex items-center gap-2">
              <span className="text-base">🎙</span>
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Voice Assistant</p>
            </div>
          </div>
          <div className="px-5 py-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Text to Speech</p>
                <p className="text-xs" style={{ color: '#6B7280' }}>AI voice reads your morning briefing</p>
              </div>
              <ToggleBtn
                on={ttsOn}
                onToggle={() => {
                  const v = !ttsOn
                  setTtsOn(v)
                  localStorage.setItem('lumio_tts_enabled', String(v))
                }}
              />
            </div>
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: '#6B7280' }}>Voice Selection</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {voiceOptions.map(voice => {
                  const isActive = activeVoice === voice.id
                  return (
                    <div
                      key={voice.id}
                      onClick={() => {
                        setActiveVoice(voice.id)
                        localStorage.setItem('lumio_tts_voice', voice.id)
                        localStorage.setItem('lumio_tts_voice_name', voice.name)
                      }}
                      className="rounded-xl p-4 text-left transition-colors cursor-pointer"
                      style={{
                        backgroundColor: '#0A0B10',
                        border: isActive ? `1px solid ${ACCENT}` : '1px solid #1F2937',
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{voice.name}</p>
                        {isActive && (
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${ACCENT}1a`, color: ACCENT }}
                          >
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: '#6B7280' }}>{voice.desc}</p>
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          previewVoice(voice.name)
                        }}
                        className="w-full mt-2.5 rounded-md py-1 text-xs font-semibold transition-colors"
                        style={{
                          background: 'transparent',
                          border: '1px solid rgba(6,182,212,0.2)',
                          color: previewingVoice === voice.name ? '#ef4444' : '#06b6d4',
                        }}
                      >
                        {previewingVoice === voice.name ? '⏹ Stop' : '▶ Preview'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── World Clock Timezones ──────────────────────────────────── */}
      {showWorldClock && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
            <div className="flex items-center gap-2">
              <span className="text-base">🕐</span>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>World Clock Timezones</p>
                <p className="text-xs" style={{ color: '#6B7280' }}>Choose up to 4 timezones for your dashboard</p>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-3">
            <div className="grid grid-cols-2 gap-2 max-h-[240px] overflow-y-auto">
              {ALL_TZ.map(zone => {
                const isSelected = zones.some(z => z.tz === zone.tz && z.label === zone.label)
                return (
                  <button
                    key={zone.label}
                    onClick={() => toggleZone(zone)}
                    disabled={!isSelected && zones.length >= 4}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors"
                    style={{
                      backgroundColor: isSelected ? `${ACCENT}14` : '#0A0B10',
                      border: isSelected ? `1px solid ${ACCENT}4d` : '1px solid #1F2937',
                      opacity: !isSelected && zones.length >= 4 ? 0.4 : 1,
                      cursor: !isSelected && zones.length >= 4 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <span className="text-sm" style={{ color: isSelected ? ACCENT : '#9CA3AF' }}>
                      {zone.label}
                    </span>
                    {isSelected && <span style={{ color: ACCENT }}>✓</span>}
                  </button>
                )
              })}
            </div>
            <p className="text-xs" style={{ color: '#6B7280' }}>{zones.length}/4 selected</p>
          </div>
        </div>
      )}

      {/* ── Appearance ─────────────────────────────────────────────── */}
      {showAppearance && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Appearance</p>
          </div>
          <div className="divide-y" style={{ borderColor: '#1F2937' }}>
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-sm" style={{ color: '#9CA3AF' }}>Theme</span>
              <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>Dark</span>
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-sm" style={{ color: '#9CA3AF' }}>Accent colour</span>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full" style={{ backgroundColor: ACCENT }} />
                <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{ACCENT}</span>
              </div>
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm" style={{ color: '#F9FAFB' }}>Primary brand colour</p>
                <p className="text-xs" style={{ color: '#6B7280' }}>Fills AI buttons and accents</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={brandPrimary}
                  onChange={e => {
                    setBrandPrimary(e.target.value)
                    localStorage.setItem(brandPrimaryKey, e.target.value)
                  }}
                  className="w-10 h-8 rounded cursor-pointer"
                  style={{ border: '1px solid #374151' }}
                />
                <button
                  onClick={() => {
                    setBrandPrimary(defaultBrandPrimary)
                    setBrandSecondary(defaultBrandSecondary)
                    localStorage.setItem(brandPrimaryKey, defaultBrandPrimary)
                    localStorage.setItem(brandSecondaryKey, defaultBrandSecondary)
                  }}
                  className="text-xs px-2 py-1 rounded"
                  style={{ backgroundColor: '#1F2937', color: '#6B7280' }}
                >
                  Reset
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm" style={{ color: '#F9FAFB' }}>Secondary brand colour</p>
                <p className="text-xs" style={{ color: '#6B7280' }}>Text colour on filled buttons</p>
              </div>
              <input
                type="color"
                value={brandSecondary}
                onChange={e => {
                  setBrandSecondary(e.target.value)
                  localStorage.setItem(brandSecondaryKey, e.target.value)
                }}
                className="w-10 h-8 rounded cursor-pointer"
                style={{ border: '1px solid #374151' }}
              />
            </div>
          </div>
        </div>
      )}

      {extraSections}

      {/* ── DEV SECTION ────────────────────────────────────────────── */}
      {showDeveloperTools && isDev && (
        <>
          <div className="pt-4">
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#EF4444' }}>
              Developer Tools
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Demo Data */}
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="px-4 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
                <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Demo Data</p>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: '#9CA3AF' }}>Demo active</span>
                  <span className="text-xs" style={{ color: '#22C55E' }}>✓</span>
                </div>
                <button
                  onClick={() => {
                    localStorage.removeItem(demoActiveKey)
                    window.location.reload()
                  }}
                  className="w-full rounded-lg py-2 text-xs font-semibold"
                  style={{
                    backgroundColor: 'rgba(239,68,68,0.1)',
                    color: '#EF4444',
                    border: '1px solid rgba(239,68,68,0.3)',
                  }}
                >
                  Reset demo
                </button>
              </div>
            </div>

            {/* 2. API Route Tester */}
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="px-4 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
                <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>API Route Tester</p>
              </div>
              <div className="p-4 space-y-2">
                <select
                  value={devApiRoute}
                  onChange={e => setDevApiRoute(e.target.value)}
                  className="w-full text-xs rounded-lg px-2 py-1.5 outline-none"
                  style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937', color: '#F9FAFB' }}
                >
                  {(devApiRouteOptions ?? [`/api/ai/${sport}`]).map(r => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
                <textarea
                  value={devPrompt}
                  onChange={e => setDevPrompt(e.target.value)}
                  placeholder="Enter prompt..."
                  rows={2}
                  className="w-full text-xs rounded-lg px-2 py-1.5 outline-none resize-none"
                  style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937', color: '#F9FAFB' }}
                />
                <button
                  onClick={async () => {
                    try {
                      const r = await fetch(devApiRoute, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ prompt: devPrompt }),
                      })
                      setDevResponse(await r.text())
                    } catch (e: unknown) {
                      setDevResponse(String(e))
                    }
                  }}
                  className="w-full rounded-lg py-1.5 text-xs font-semibold"
                  style={{
                    backgroundColor: `${ACCENT}1a`,
                    color: ACCENT_LIGHT,
                    border: `1px solid ${ACCENT}4d`,
                  }}
                >
                  Test
                </button>
                {devResponse && (
                  <pre
                    className="text-[10px] p-2 rounded-lg overflow-auto max-h-32"
                    style={{ backgroundColor: '#0A0B10', color: '#9CA3AF' }}
                  >
                    {devResponse}
                  </pre>
                )}
              </div>
            </div>

            {/* 3. LocalStorage Inspector */}
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #1F2937' }}>
                <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>LocalStorage Inspector</p>
                <button onClick={refreshLsKeys} className="text-[10px] font-semibold" style={{ color: ACCENT }}>
                  Refresh
                </button>
              </div>
              <div className="p-4 space-y-1 max-h-48 overflow-y-auto">
                {lsKeys.length === 0 && (
                  <p className="text-xs" style={{ color: '#6B7280' }}>Click Refresh to load keys</p>
                )}
                {lsKeys.map(kv => (
                  <div key={kv.key} className="flex items-center justify-between gap-2">
                    <span className="text-[10px] truncate" style={{ color: '#9CA3AF' }}>{kv.key}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] truncate max-w-[100px]" style={{ color: '#F9FAFB' }}>
                        {kv.value}
                      </span>
                      <button
                        onClick={() => {
                          localStorage.removeItem(kv.key)
                          refreshLsKeys()
                        }}
                        className="text-[10px]"
                        style={{ color: '#EF4444' }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
                {lsKeys.length > 0 && (
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        lsKeys.forEach(kv => localStorage.removeItem(kv.key))
                        refreshLsKeys()
                      }}
                      className="text-[10px] font-semibold"
                      style={{ color: '#EF4444' }}
                    >
                      Clear All
                    </button>
                    <button
                      onClick={() => {
                        const blob = new Blob(
                          [JSON.stringify(Object.fromEntries(lsKeys.map(kv => [kv.key, kv.value])), null, 2)],
                          { type: 'application/json' }
                        )
                        const a = document.createElement('a')
                        a.href = URL.createObjectURL(blob)
                        a.download = 'lumio-ls-export.json'
                        a.click()
                      }}
                      className="text-[10px] font-semibold"
                      style={{ color: ACCENT }}
                    >
                      Export JSON
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Environment */}
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="px-4 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
                <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Environment</p>
              </div>
              <div className="p-4 space-y-1">
                {[
                  { label: 'NODE_ENV', value: process.env.NODE_ENV || 'unknown' },
                  {
                    label: 'Branch',
                    value:
                      typeof window !== 'undefined'
                        ? localStorage.getItem('lumio_branch') || 'dev'
                        : 'dev',
                  },
                  { label: 'Deploy timestamp', value: new Date().toISOString().slice(0, 10) },
                  { label: 'Next.js version', value: '16.x' },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-[10px]" style={{ color: '#9CA3AF' }}>{row.label}</span>
                    <span className="text-[10px] font-medium" style={{ color: '#F9FAFB' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. TypeScript Check */}
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="px-4 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
                <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>TypeScript Check</p>
              </div>
              <div className="p-4 space-y-2">
                <p className="text-[10px]" style={{ color: '#6B7280' }}>
                  Run <code className="text-[10px]" style={{ color: ACCENT }}>npx tsc --noEmit</code> in terminal
                </p>
                <textarea
                  placeholder="Paste tsc output here..."
                  rows={3}
                  className="w-full text-[10px] rounded-lg px-2 py-1.5 outline-none resize-none"
                  style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937', color: '#F9FAFB' }}
                />
              </div>
            </div>

            {/* 6. Portal Info */}
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="px-4 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
                <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Portal Info</p>
              </div>
              <div className="p-4 space-y-1">
                {[
                  { label: 'Sport', value: sport },
                  { label: 'Slug', value: slug },
                  { label: 'File', value: `src/app/${sport}/[slug]/page.tsx` },
                  {
                    label: 'LS keys used',
                    value: 'lumio_tts_enabled, lumio_tts_voice, lumio_world_zones, lumio_dev_mode, lumio_branch',
                  },
                ].map(row => (
                  <div key={row.label} className="flex items-start justify-between gap-2">
                    <span className="text-[10px] shrink-0" style={{ color: '#9CA3AF' }}>{row.label}</span>
                    <span className="text-[10px] font-medium text-right" style={{ color: '#F9FAFB' }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
