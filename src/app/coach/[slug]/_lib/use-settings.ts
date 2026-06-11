'use client'

import { useEffect, useState } from 'react'
import { getSettings, subscribe, type CoachSettings } from './settings-store'

// Reactive view of coach settings — re-renders whenever settings change.
export function useCoachSettings(): CoachSettings {
  const [s, setS] = useState<CoachSettings>(getSettings())
  useEffect(() => {
    const refresh = () => setS(getSettings())
    refresh()
    return subscribe(refresh)
  }, [])
  return s
}
