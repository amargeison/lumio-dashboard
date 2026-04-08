'use client'

import React, { useEffect } from 'react'
import { buildTheme, DEFAULT_THEME, type ClubTheme } from '@/lib/club-theme'

interface DBFootballClub {
  slug?: string
  primary_colour?: string | null
  secondary_colour?: string | null
  accent_colour?: string | null
  text_on_primary?: string | null
  text_on_secondary?: string | null
}

interface Props {
  dbClub: DBFootballClub | null
  children: React.ReactNode
}

const VAR_MAP: Record<keyof ClubTheme, string> = {
  primary: '--club-primary',
  secondary: '--club-secondary',
  accent: '--club-accent',
  textOnPrimary: '--club-text-on-primary',
  textOnSecondary: '--club-text-on-secondary',
  primaryLight: '--club-primary-light',
  primaryMid: '--club-primary-mid',
  primaryDark: '--club-primary-dark',
  bg: '--club-bg',
  bgCard: '--club-bg-card',
  bgHover: '--club-bg-hover',
  border: '--club-border',
  text: '--club-text',
  textMuted: '--club-text-muted',
  success: '--club-success',
  warning: '--club-warning',
  danger: '--club-danger',
  info: '--club-info',
}

function applyTheme(theme: ClubTheme, slug: string | null) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  for (const key of Object.keys(VAR_MAP) as (keyof ClubTheme)[]) {
    root.style.setProperty(VAR_MAP[key], theme[key])
  }
  if (slug) root.setAttribute('data-club-slug', slug)
}

export default function ClubThemeProvider({ dbClub, children }: Props) {
  useEffect(() => {
    const theme = buildTheme(dbClub)
    applyTheme(theme, dbClub?.slug ?? 'lumio-dev')
    return () => {
      // Reset to default when unmounting (e.g. leaving football area)
      if (typeof document !== 'undefined') {
        document.documentElement.removeAttribute('data-club-slug')
      }
    }
  }, [dbClub])

  return <>{children}</>
}

export function useClubTheme(): ClubTheme {
  if (typeof document === 'undefined') return DEFAULT_THEME
  const cs = getComputedStyle(document.documentElement)
  const v = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback
  return {
    primary: v('--club-primary', DEFAULT_THEME.primary),
    secondary: v('--club-secondary', DEFAULT_THEME.secondary),
    accent: v('--club-accent', DEFAULT_THEME.accent),
    textOnPrimary: v('--club-text-on-primary', DEFAULT_THEME.textOnPrimary),
    textOnSecondary: v('--club-text-on-secondary', DEFAULT_THEME.textOnSecondary),
    primaryLight: v('--club-primary-light', DEFAULT_THEME.primaryLight),
    primaryMid: v('--club-primary-mid', DEFAULT_THEME.primaryMid),
    primaryDark: v('--club-primary-dark', DEFAULT_THEME.primaryDark),
    bg: v('--club-bg', DEFAULT_THEME.bg),
    bgCard: v('--club-bg-card', DEFAULT_THEME.bgCard),
    bgHover: v('--club-bg-hover', DEFAULT_THEME.bgHover),
    border: v('--club-border', DEFAULT_THEME.border),
    text: v('--club-text', DEFAULT_THEME.text),
    textMuted: v('--club-text-muted', DEFAULT_THEME.textMuted),
    success: v('--club-success', DEFAULT_THEME.success),
    warning: v('--club-warning', DEFAULT_THEME.warning),
    danger: v('--club-danger', DEFAULT_THEME.danger),
    info: v('--club-info', DEFAULT_THEME.info),
  }
}
