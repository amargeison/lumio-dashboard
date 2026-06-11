'use client'

import { useEffect, useState } from 'react'
import { DEFAULT_SETTINGS, getSettings, subscribe, type CoachSettings } from './settings-store'

// Reactive view of coach settings. Starts from DEFAULT_SETTINGS so the first
// (server + client) render is deterministic — avoids a hydration mismatch —
// then reads the persisted values from localStorage after mount and on change.
export function useCoachSettings(): CoachSettings {
  const [s, setS] = useState<CoachSettings>(DEFAULT_SETTINGS)
  useEffect(() => {
    const refresh = () => setS(getSettings())
    refresh()
    return subscribe(refresh)
  }, [])
  return s
}
