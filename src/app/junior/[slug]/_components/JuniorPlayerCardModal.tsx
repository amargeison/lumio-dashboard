'use client'

// JuniorPlayerCardModal — JuniorModal wrapper around JuniorPlayerCard.
// Does the JUNIOR_PLAYER_DETAIL lookup at this layer and passes the
// resolved detail (or undefined) down to the card.
//
// Header uses 🪪 icon + player name + "{teamName} · #{shirt}" subtitle.
// If shirt is null (FA pending players), subtitle reads "{teamName} ·
// No squad number".
//
// Width 420 — wide enough to give the 320 card 50px breathing room
// each side on desktop. On mobile, JuniorModal's `min(420px, 92vw)`
// + JuniorPlayerCard's `min(320px, 80vw)` both scale gracefully.

import JuniorModal from './JuniorModal'
import JuniorPlayerCard from './JuniorPlayerCard'
import type { SquadPlayer } from './JuniorSquadManagement'
import { JUNIOR_PLAYER_DETAIL } from '../_lib/junior-squad-data'

interface Props {
  player: SquadPlayer
  teamName: string
  onClose: () => void
}

export default function JuniorPlayerCardModal({ player, teamName, onClose }: Props) {
  const detail = JUNIOR_PLAYER_DETAIL[player.id]
  const shirtLabel = player.shirt !== null ? `#${player.shirt}` : 'No squad number'

  return (
    <JuniorModal
      icon="🪪"
      title={player.name}
      subtitle={`${teamName} · ${shirtLabel}`}
      widthPx={420}
      onClose={onClose}
    >
      <div style={{ padding: '24px 16px 32px' }}>
        <JuniorPlayerCard
          player={player}
          detail={detail}
          teamName={teamName}
        />
      </div>
    </JuniorModal>
  )
}
