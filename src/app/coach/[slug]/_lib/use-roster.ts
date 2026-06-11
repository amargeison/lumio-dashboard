'use client'

// Live roster = the demo squad + any players added via "Add player".
// Used by the Roster, Player Development and Belt Progression so added
// players show everywhere, and updates propagate instantly.

import { useEffect, useState } from 'react'
import { PLAYERS, type Player } from './coach-data'
import { getAddedPlayers, subscribe } from './roster-store'

export function useAllPlayers(): Player[] {
  const [added, setAdded] = useState<Player[]>([])
  useEffect(() => {
    const refresh = () => setAdded(getAddedPlayers())
    refresh()
    return subscribe(refresh)
  }, [])
  return [...PLAYERS, ...added]
}
