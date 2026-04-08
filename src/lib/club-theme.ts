// Club theme engine — derives a full ClubTheme from a club's stored colours.
// Zero dependencies. Never throws — returns DEFAULT_THEME on any failure.

export interface ClubTheme {
  primary: string
  secondary: string
  accent: string
  textOnPrimary: string
  textOnSecondary: string
  primaryLight: string
  primaryMid: string
  primaryDark: string
  bg: string
  bgCard: string
  bgHover: string
  border: string
  text: string
  textMuted: string
  success: string
  warning: string
  danger: string
  info: string
}

interface DBFootballClub {
  primary_colour?: string | null
  secondary_colour?: string | null
  accent_colour?: string | null
  text_on_primary?: string | null
  text_on_secondary?: string | null
  slug?: string
}

export function isValidHex(value: string | null | undefined): boolean {
  if (!value || typeof value !== 'string') return false
  return /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(value.trim())
}

function expandHex(hex: string): string {
  const h = hex.trim().replace(/^#/, '')
  if (h.length === 3) return '#' + h.split('').map((c) => c + c).join('')
  return '#' + h
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  if (!isValidHex(hex)) return null
  const h = expandHex(hex).slice(1)
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  if ([r, g, b].some((n) => isNaN(n))) return null
  return { r, g, b }
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)))
  return '#' + [clamp(r), clamp(g), clamp(b)].map((n) => n.toString(16).padStart(2, '0')).join('').toUpperCase()
}

export function hexToRgba(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return `rgba(108, 99, 255, ${alpha})`
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
}

export function darkenHex(hex: string, amount: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const factor = 1 - Math.max(0, Math.min(1, amount))
  return rgbToHex(rgb.r * factor, rgb.g * factor, rgb.b * factor)
}

export function lightenHex(hex: string, amount: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const a = Math.max(0, Math.min(1, amount))
  return rgbToHex(rgb.r + (255 - rgb.r) * a, rgb.g + (255 - rgb.g) * a, rgb.b + (255 - rgb.b) * a)
}

export function getContrastColour(hex: string): '#ffffff' | '#000000' {
  const rgb = hexToRgb(hex)
  if (!rgb) return '#ffffff'
  // Relative luminance per WCAG
  const lum = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255
  return lum > 0.55 ? '#000000' : '#ffffff'
}

export const DEFAULT_THEME: ClubTheme = {
  primary: '#6C63FF',
  secondary: '#FFFFFF',
  accent: '#F59E0B',
  textOnPrimary: '#FFFFFF',
  textOnSecondary: '#1a1a2e',
  primaryLight: 'rgba(108, 99, 255, 0.15)',
  primaryMid: 'rgba(108, 99, 255, 0.5)',
  primaryDark: '#5C54D9',
  bg: '#0f0f1a',
  bgCard: '#1a1a2e',
  bgHover: 'rgba(108, 99, 255, 0.08)',
  border: 'rgba(108, 99, 255, 0.2)',
  text: '#ffffff',
  textMuted: '#9ca3af',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
}

export function buildTheme(dbClub: DBFootballClub | null | undefined): ClubTheme {
  try {
    if (!dbClub) return DEFAULT_THEME
    const primary = isValidHex(dbClub.primary_colour ?? null) ? (dbClub.primary_colour as string) : DEFAULT_THEME.primary
    const secondary = isValidHex(dbClub.secondary_colour ?? null) ? (dbClub.secondary_colour as string) : DEFAULT_THEME.secondary
    const accent = isValidHex(dbClub.accent_colour ?? null) ? (dbClub.accent_colour as string) : DEFAULT_THEME.accent
    const textOnPrimary = isValidHex(dbClub.text_on_primary ?? null) ? (dbClub.text_on_primary as string) : getContrastColour(primary)
    const textOnSecondary = isValidHex(dbClub.text_on_secondary ?? null) ? (dbClub.text_on_secondary as string) : getContrastColour(secondary)

    return {
      primary,
      secondary,
      accent,
      textOnPrimary,
      textOnSecondary,
      primaryLight: hexToRgba(primary, 0.15),
      primaryMid: hexToRgba(primary, 0.5),
      primaryDark: darkenHex(primary, 0.15),
      bg: '#0f0f1a',
      bgCard: '#1a1a2e',
      bgHover: hexToRgba(primary, 0.08),
      border: hexToRgba(primary, 0.2),
      text: '#ffffff',
      textMuted: '#9ca3af',
      success: '#22c55e',
      warning: '#f59e0b',
      danger: '#ef4444',
      info: '#3b82f6',
    }
  } catch (e) {
    console.error('[club-theme] buildTheme failed', e)
    return DEFAULT_THEME
  }
}
