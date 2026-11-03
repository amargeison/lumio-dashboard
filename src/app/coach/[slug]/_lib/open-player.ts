'use client'

// Open a player's card in Player Roster from anywhere in the portal, optionally
// straight onto one part of its Setup tab (scrolled into view).
//
//   openPlayerCard(p.id, 'welcome')   // e.g. "Send them their welcome link"
//
// The roster reads the request when it opens (the same one-shot sessionStorage
// pattern the dashboard already used), or straight away through the event if
// it is already on screen.

export type SetupSection = 'access' | 'card' | 'welcome' | 'record' | 'plan'

export const OPEN_PLAYER = 'lumio:open-player'
const KEY = 'lumio_open_player'
const SECTION_KEY = 'lumio_open_player_section'

export function openPlayerCard(playerId: string, section?: SetupSection) {
  try {
    sessionStorage.setItem(KEY, playerId)
    if (section) sessionStorage.setItem(SECTION_KEY, section)
    else sessionStorage.removeItem(SECTION_KEY)
  } catch { /* storage unavailable — the roster still opens */ }
  window.dispatchEvent(new CustomEvent(OPEN_PLAYER))
  if (window.location.hash.replace(/^#\/?/, '') !== 'roster') window.location.hash = 'roster'
}

/** The waiting request, if any, taken so it is acted on once. */
export function takeOpenPlayer(): { id: string; section: SetupSection | null } | null {
  try {
    const id = sessionStorage.getItem(KEY)
    if (!id) return null
    const section = sessionStorage.getItem(SECTION_KEY) as SetupSection | null
    sessionStorage.removeItem(KEY); sessionStorage.removeItem(SECTION_KEY)
    return { id, section }
  } catch { return null }
}
