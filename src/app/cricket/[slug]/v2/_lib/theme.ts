// Cricket portal redesign — token system. Mirrors the design handoff
// (proto/theme.jsx) 1:1. Two themes (dark / light), six accents, three
// density tiers. Prototype's `useTweaks` debug panel is dropped — the
// shipping app reads from user prefs (Settings) instead, with these
// constants as defaults.

export type ThemeTokens = {
  name:       string
  bg:         string
  panel:      string
  panel2:     string
  border:     string
  borderHi:   string
  text:       string
  text2:      string
  text3:      string
  text4:      string
  good:       string
  bad:        string
  warn:       string
  hover:      string
  cardShadow: string
  btnText:    string
  isDark:     boolean
}

export const THEMES: Record<'dark' | 'light', ThemeTokens> = {
  dark: {
    name: 'Club Dark',
    bg:        '#0B0E14',
    panel:     '#11151D',
    panel2:    '#161B25',
    border:    'rgba(255,255,255,0.06)',
    borderHi:  'rgba(255,255,255,0.12)',
    text:      '#E8EAEE',
    text2:     'rgba(232,234,238,0.64)',
    text3:     'rgba(232,234,238,0.42)',
    text4:     'rgba(232,234,238,0.20)',
    good:      '#6FA88A',
    bad:       '#C77878',
    warn:      '#C9A06B',
    hover:     'rgba(255,255,255,0.035)',
    cardShadow:'none',
    btnText:   '#0B0E14',
    isDark:    true,
  },
  light: {
    name: 'Club Light',
    bg:        '#F1EEE8',
    panel:     '#FFFFFF',
    panel2:    '#F8F5EF',
    border:    'rgba(20,24,33,0.08)',
    borderHi:  'rgba(20,24,33,0.18)',
    text:      '#141821',
    text2:     'rgba(20,24,33,0.64)',
    text3:     'rgba(20,24,33,0.42)',
    text4:     'rgba(20,24,33,0.20)',
    good:      '#3A8E6E',
    bad:       '#B85454',
    warn:      '#B27A2E',
    hover:     'rgba(20,24,33,0.035)',
    cardShadow:'0 1px 0 rgba(255,255,255,0.5) inset, 0 4px 14px -10px rgba(20,24,33,0.10)',
    btnText:   '#FFFFFF',
    isDark:    false,
  },
}

export type AccentTokens = { hex: string; dim: string; border: string }

export const ACCENTS: Record<'oxford' | 'forest' | 'claret' | 'bronze' | 'graphite' | 'ink', AccentTokens> = {
  oxford:   { hex: '#3A6CA8', dim: 'rgba(58,108,168,0.14)',   border: 'rgba(58,108,168,0.4)' },
  forest:   { hex: '#3D7A5E', dim: 'rgba(61,122,94,0.14)',    border: 'rgba(61,122,94,0.4)' },
  claret:   { hex: '#9C3E3E', dim: 'rgba(156,62,62,0.14)',    border: 'rgba(156,62,62,0.4)' },
  bronze:   { hex: '#A57842', dim: 'rgba(165,120,66,0.14)',   border: 'rgba(165,120,66,0.4)' },
  graphite: { hex: '#6B7280', dim: 'rgba(107,114,128,0.14)',  border: 'rgba(107,114,128,0.4)' },
  ink:      { hex: '#2A3142', dim: 'rgba(42,49,66,0.14)',     border: 'rgba(42,49,66,0.4)' },
}

export type Density = { gap: number; pad: number; radius: number; font: number; h1: number; hero: number }

export const DENSITY: Record<'compact' | 'regular' | 'spacious', Density> = {
  compact:  { gap: 10, pad: 12, radius: 9,  font: 11.5, h1: 28, hero: 36 },
  regular:  { gap: 14, pad: 16, radius: 12, font: 12.5, h1: 32, hero: 44 },
  spacious: { gap: 18, pad: 20, radius: 14, font: 13.5, h1: 36, hero: 52 },
}

export const FONT      = '"Geist", "Inter", system-ui, -apple-system, sans-serif'
export const FONT_MONO = '"Geist Mono", "JetBrains Mono", ui-monospace, monospace'

export type GreetingState = 'auto' | 'morning' | 'afternoon' | 'evening' | 'matchday'
export function getGreeting(state: GreetingState): string {
  if (state === 'auto') return new Date().getHours() < 18 ? 'Match Day' : 'Day In Review'
  if (state === 'evening') return 'Day In Review'
  return 'Match Day'
}

export type ThemeKey   = keyof typeof THEMES
export type AccentKey  = keyof typeof ACCENTS
export type DensityKey = keyof typeof DENSITY
export type SidebarKey = 'full' | 'rail' | 'hybrid'
