'use client'

import React, { useEffect, useState } from 'react'
import { hasFeature, type ClubTier } from '@/lib/feature-gates'
import { UpgradePrompt } from './FeatureGate'
import { buildTheme, getContrastColour, isValidHex, DEFAULT_THEME } from '@/lib/club-theme'

interface DBFootballClub {
  id?: string
  slug?: string
  name?: string
  primary_colour?: string | null
  secondary_colour?: string | null
  accent_colour?: string | null
  text_on_primary?: string | null
  text_on_secondary?: string | null
  kit_home_colour?: string | null
  kit_away_colour?: string | null
  font_preference?: string | null
  badge_shape?: string | null
}

interface Props {
  clubId: string | null
  dbClub: DBFootballClub | null
  clubTier: ClubTier
  onBrandingUpdate: (updatedClub: DBFootballClub) => void
}

const FONTS = ['Inter','Roboto','Poppins','Montserrat','Lato']
const SHAPES: { id: string; emoji: string; label: string }[] = [
  { id: 'shield', emoji: '🛡️', label: 'Shield' },
  { id: 'circle', emoji: '⭕', label: 'Circle' },
  { id: 'crest',  emoji: '👑', label: 'Crest' },
  { id: 'square', emoji: '⬛', label: 'Square' },
  { id: 'hexagon', emoji: '⬡', label: 'Hexagon' },
]

export default function ClubBrandingSettings({ clubId, dbClub, clubTier, onBrandingUpdate }: Props) {
  const [primary, setPrimary] = useState(dbClub?.primary_colour ?? DEFAULT_THEME.primary)
  const [secondary, setSecondary] = useState(dbClub?.secondary_colour ?? DEFAULT_THEME.secondary)
  const [accent, setAccent] = useState(dbClub?.accent_colour ?? DEFAULT_THEME.accent)
  const [textOnPrimary, setTextOnPrimary] = useState(dbClub?.text_on_primary ?? '#FFFFFF')
  const [overrideText, setOverrideText] = useState(false)
  const [kitHome, setKitHome] = useState(dbClub?.kit_home_colour ?? primary)
  const [kitAway, setKitAway] = useState(dbClub?.kit_away_colour ?? secondary)
  const [font, setFont] = useState(dbClub?.font_preference ?? 'Inter')
  const [badge, setBadge] = useState(dbClub?.badge_shape ?? 'shield')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewing, setPreviewing] = useState(false)

  useEffect(() => {
    if (!overrideText) setTextOnPrimary(getContrastColour(primary))
  }, [primary, overrideText])

  const previewTheme = buildTheme({ primary_colour: primary, secondary_colour: secondary, accent_colour: accent, text_on_primary: textOnPrimary })

  if (!hasFeature(clubTier, 'white_label')) {
    return (
      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <h3 className="text-sm font-bold mb-2">🎨 Club Branding</h3>
        <p className="text-xs mb-3" style={{ color: '#9CA3AF' }}>Customise your portal to match your club identity.</p>
        <UpgradePrompt featureKey="white_label" featureName="White-Label Branding" requiredTier="professional" />
      </div>
    )
  }

  function applyPreview() {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    root.style.setProperty('--club-primary', primary)
    root.style.setProperty('--club-secondary', secondary)
    root.style.setProperty('--club-accent', accent)
    root.style.setProperty('--club-text-on-primary', textOnPrimary)
    setPreviewing(true)
  }

  function resetToDefault() {
    setPrimary(DEFAULT_THEME.primary)
    setSecondary(DEFAULT_THEME.secondary)
    setAccent(DEFAULT_THEME.accent)
    setTextOnPrimary('#FFFFFF')
    setKitHome(DEFAULT_THEME.primary)
    setKitAway(DEFAULT_THEME.secondary)
    setOverrideText(false)
  }

  async function save() {
    if (!clubId) { setError('No club id'); return }
    if (!isValidHex(primary) || !isValidHex(secondary) || !isValidHex(accent)) {
      setError('Invalid hex colour')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/football/branding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clubId,
          primaryColour: primary,
          secondaryColour: secondary,
          accentColour: accent,
          textOnPrimary,
          kitHomeColour: kitHome,
          kitAwayColour: kitAway,
          fontPreference: font,
          badgeShape: badge,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.updatedClub) {
        setError(json.error ?? 'Save failed')
      } else {
        onBrandingUpdate(json.updatedClub)
        setPreviewing(false)
      }
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  function ColourField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
      <div>
        <label className="text-[10px] font-semibold" style={{ color: '#9CA3AF' }}>{label}</label>
        <div className="flex items-center gap-2 mt-1">
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-10 h-9 rounded cursor-pointer" style={{ border: '1px solid #1F2937' }} />
          <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 px-2 py-1.5 rounded text-xs font-mono" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937', color: '#F9FAFB' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold flex items-center gap-2">🎨 Club Branding</h3>
          <p className="text-[10px] mt-0.5" style={{ color: '#6B7280' }}>Customise your portal to match your club identity</p>
        </div>
        {dbClub?.slug === 'lumio-dev' && (
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>Changes apply to demo only</span>
        )}
      </div>

      {previewing && (
        <div className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(245,158,11,0.12)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.4)' }}>
          ⚠️ You're previewing unsaved changes
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Form */}
        <div className="space-y-4">
          <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <p className="text-[10px] font-bold uppercase" style={{ color: '#6B7280' }}>Colours</p>
            <ColourField label="Primary" value={primary} onChange={setPrimary} />
            <ColourField label="Secondary" value={secondary} onChange={setSecondary} />
            <ColourField label="Accent" value={accent} onChange={setAccent} />
            <div>
              <label className="text-[10px] font-semibold flex items-center gap-2" style={{ color: '#9CA3AF' }}>
                Text on Primary
                <input type="checkbox" checked={overrideText} onChange={(e) => setOverrideText(e.target.checked)} />
                <span className="text-[9px]" style={{ color: '#6B7280' }}>{overrideText ? 'Override' : 'Auto'}</span>
              </label>
              {overrideText && <ColourField label="" value={textOnPrimary} onChange={setTextOnPrimary} />}
              {!overrideText && <p className="text-[10px] mt-1 font-mono" style={{ color: textOnPrimary === '#ffffff' ? '#fff' : '#1a1a2e', backgroundColor: primary, padding: '4px 8px', borderRadius: 4 }}>Auto: {textOnPrimary}</p>}
            </div>
            <ColourField label="Kit Home Colour" value={kitHome} onChange={setKitHome} />
            <ColourField label="Kit Away Colour" value={kitAway} onChange={setKitAway} />
          </div>

          <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <p className="text-[10px] font-bold uppercase mb-2" style={{ color: '#6B7280' }}>Typography</p>
            <select value={font} onChange={(e) => setFont(e.target.value)} className="w-full px-2 py-1.5 rounded text-xs" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937', color: '#F9FAFB', fontFamily: font }}>
              {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            <p className="text-sm mt-2" style={{ fontFamily: font, color: '#F9FAFB' }}>The quick brown fox jumps over the lazy dog</p>
          </div>

          <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <p className="text-[10px] font-bold uppercase mb-2" style={{ color: '#6B7280' }}>Badge Shape</p>
            <div className="flex gap-2 flex-wrap">
              {SHAPES.map((s) => (
                <button key={s.id} onClick={() => setBadge(s.id)} className="text-xs px-3 py-2 rounded-lg flex flex-col items-center gap-1"
                  style={{ backgroundColor: badge === s.id ? primary + '22' : '#07080F', border: `1px solid ${badge === s.id ? primary : '#1F2937'}`, color: badge === s.id ? primary : '#9CA3AF' }}>
                  <span className="text-base">{s.emoji}</span>
                  <span className="text-[9px]">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <p className="text-[10px] font-bold uppercase" style={{ color: '#6B7280' }}>Live Preview</p>
          <div className="rounded-xl p-4 text-white" style={{ background: `linear-gradient(135deg, ${primary}, ${previewTheme.primaryDark})` }}>
            <p className="text-xs opacity-80" style={{ color: textOnPrimary }}>Welcome back</p>
            <p className="text-lg font-bold" style={{ color: textOnPrimary }}>{dbClub?.name ?? 'Your Club'}</p>
          </div>
          <div className="space-y-1">
            {['Overview','Squad','Tactics'].map((item, i) => (
              <div key={item} className="px-3 py-2 rounded-lg text-xs"
                style={{ backgroundColor: i === 0 ? primary + '22' : 'transparent', border: `1px solid ${i === 0 ? primary : '#1F2937'}`, color: i === 0 ? primary : '#9CA3AF' }}>
                {item}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg p-3" style={{ backgroundColor: '#0A0B10', border: `1px solid ${primary}33` }}>
              <p className="text-[10px]" style={{ color: '#6B7280' }}>League Pos</p>
              <p className="text-lg font-bold" style={{ color: accent }}>14th</p>
            </div>
            <div className="rounded-lg p-3" style={{ backgroundColor: '#0A0B10', border: `1px solid ${primary}33` }}>
              <p className="text-[10px]" style={{ color: '#6B7280' }}>Form</p>
              <p className="text-lg font-bold" style={{ color: primary }}>WWDLW</p>
            </div>
          </div>
        </div>
      </div>

      {error && <p className="text-xs" style={{ color: '#EF4444' }}>{error}</p>}

      <div className="flex gap-2 flex-wrap">
        <button onClick={save} disabled={saving || !clubId} className="text-xs px-4 py-2 rounded-lg font-semibold disabled:opacity-50" style={{ backgroundColor: primary, color: textOnPrimary }}>
          {saving ? 'Saving...' : 'Save Branding'}
        </button>
        <button onClick={applyPreview} className="text-xs px-4 py-2 rounded-lg font-semibold" style={{ backgroundColor: '#1F2937', color: '#F9FAFB' }}>
          Preview Changes
        </button>
        <button onClick={resetToDefault} className="text-xs px-4 py-2 rounded-lg" style={{ backgroundColor: 'transparent', border: '1px solid #1F2937', color: '#9CA3AF' }}>
          Reset to Lumio Default
        </button>
      </div>
    </div>
  )
}
