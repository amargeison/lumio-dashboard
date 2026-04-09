'use client'

import { useState, useEffect, useCallback } from 'react'
import SportsOnboarding from './SportsOnboarding'

export type SportKey =
  | 'rugby' | 'football' | 'womens' | 'nonleague' | 'grassroots'
  | 'golf' | 'tennis' | 'darts' | 'cricket'

export interface SportsDemoSession {
  email: string
  clubName: string
  logoUrl: string | null
  userName: string
  userPhoto: string | null
  role: string
  sport: SportKey
  createdAt: number
}

interface SportsDemoGateProps {
  sport: SportKey
  accentColor: string
  sportLabel: string
  defaultClubName: string
  roles: Array<{ id: string; label: string; icon: string }>
  children: (session: SportsDemoSession) => React.ReactNode
}

function sessionKey(sport: SportKey) {
  return `lumio_${sport}_demo_session`
}

function getSession(sport: SportKey): SportsDemoSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(sessionKey(sport))
    if (!raw) return null
    const parsed = JSON.parse(raw) as SportsDemoSession
    if (Date.now() - parsed.createdAt > 30 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(sessionKey(sport))
      return null
    }
    return parsed
  } catch { return null }
}

function saveSession(sport: SportKey, session: SportsDemoSession) {
  if (typeof window === 'undefined') return
  localStorage.setItem(sessionKey(sport), JSON.stringify(session))
}

export default function SportsDemoGate({
  sport, accentColor, sportLabel, defaultClubName, roles, children
}: SportsDemoGateProps) {
  const [session, setSession] = useState<SportsDemoSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    const existing = getSession(sport)
    if (existing) {
      setSession(existing)
    } else {
      setShowOnboarding(true)
    }
    setLoading(false)
  }, [sport])

  const handleComplete = useCallback((newSession: SportsDemoSession) => {
    saveSession(sport, newSession)
    setSession(newSession)
    setShowOnboarding(false)
  }, [sport])

  const handleRoleChange = useCallback((role: string) => {
    setSession(prev => {
      if (!prev) return prev
      const updated = { ...prev, role }
      saveSession(sport, updated)
      return updated
    })
  }, [sport])

  const handleReset = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(sessionKey(sport))
    }
    setSession(null)
    setShowOnboarding(true)
  }, [sport])

  // Suppress unused variable warnings — these are exported for portal use
  void handleRoleChange
  void handleReset

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: '#07080F' }}>
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: accentColor, borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <>
      {showOnboarding && (
        <SportsOnboarding
          sport={sport}
          accentColor={accentColor}
          sportLabel={sportLabel}
          defaultClubName={defaultClubName}
          roles={roles}
          onComplete={handleComplete}
        />
      )}
      {session && !showOnboarding && children(session)}
    </>
  )
}

export { getSession, saveSession, sessionKey }
export type { SportsDemoGateProps }
