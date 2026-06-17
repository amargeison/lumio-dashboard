'use client'

// Live roster = the demo squad + any players added via "Add player".
// Used by the Roster, Player Development and Belt Progression so added
// players show everywhere, and updates propagate instantly.

import { useEffect, useState } from 'react'
import { PLAYERS, type Player } from './coach-data'
import { ALL_PLAYERS } from './coaches-data'
import { getAddedPlayers, subscribe } from './roster-store'
import { useScopeCoachId } from './role-scope'

export function useAllPlayers(): Player[] {
  const scope = useScopeCoachId()
  const [added, setAdded] = useState<Player[]>([])
  useEffect(() => {
    const refresh = () => setAdded(getAddedPlayers())
    refresh()
    return subscribe(refresh)
  }, [])
  // Coach role: only that coach's players (from the whole-club roster). Head:
  // the head's own squad + any locally-added players, exactly as before.
  if (scope) return ALL_PLAYERS.filter(p => p.coachId === scope)
  return [...PLAYERS, ...added]
}
