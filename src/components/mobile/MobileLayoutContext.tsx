'use client'
import React, { createContext, useContext } from 'react'

export type MobileLayoutContextValue = {
  openMore: () => void
  closeMore: () => void
  activeSection: string
  onNavigate: (section: string) => void
}

export const MobileLayoutContext = createContext<MobileLayoutContextValue | null>(null)

export function useMobileLayout(): MobileLayoutContextValue {
  const ctx = useContext(MobileLayoutContext)
  return ctx ?? {
    openMore: () => {},
    closeMore: () => {},
    activeSection: 'dashboard',
    onNavigate: () => {},
  }
}
