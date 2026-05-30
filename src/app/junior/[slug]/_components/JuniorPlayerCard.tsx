'use client'

// JuniorPlayerCard — FIFA-style flip card for a Junior player. Front
// face shows rating + position + kit number + avatar + name + 6 stats
// (TEC/TAC/PHY/SOC/EFF/POT) with source icons. Back face shows About
// Me free-text fields. Click anywhere on the card → flip.
//
// Standalone — renders without modal context so the card can be
// embedded elsewhere later (e.g. a parent's child profile page).
// The modal wrapper (JuniorPlayerCardModal) handles open/close.
//
// Visual spec ported from src/components/sports-demo/SportsDemoGate.tsx
// FIFA card (lines 188–225), rethemed Junior green and scaled up to
// 320×480 desktop dimensions for the focused modal context.
//
// CSS 3D flip via inline styles — perspective + rotateY +
// backface-visibility. No animation library dependency. GPU-accelerated.
//
// Stub mode: when detail.stub === true, stat rows render as "—" and
// back face shows "Profile not added yet" per field. Only the rating,
// position, kit number, avatar, and name display normally.

import { useState, type ReactNode } from 'react'
import { Video, Satellite, User } from 'lucide-react'
import type { SquadPlayer } from './JuniorSquadManagement'
import type {
  JuniorPlayerDetail,
  JuniorPlayerStats,
  JuniorPlayerAboutMe,
} from '../_lib/junior-squad-data'

const C = {
  accent:     '#16A34A',
  accentDim:  'rgba(22,163,74,0.16)',
  accent55:   'rgba(22,163,74,0.55)',
  accent20:   'rgba(22,163,74,0.20)',
  accent60:   'rgba(22,163,74,0.60)',
  accent30:   'rgba(22,163,74,0.30)',
  text:       '#FFFFFF',
  text2:      'rgba(255,255,255,0.7)',
  text3:      'rgba(255,255,255,0.45)',
  bg:         '#0D1117',
  border:     'rgba(255,255,255,0.08)',
} as const

interface Props {
  player: SquadPlayer
  detail?: JuniorPlayerDetail  // undefined for demo-added players
  teamName: string             // e.g. "Lions" — passed through for future use
}

export default function JuniorPlayerCard({ player, detail, teamName: _teamName }: Props) {
  const [flipped, setFlipped] = useState(false)
  const isStub = !detail || detail.stub === true
  const stats = detail?.stats
  const aboutMe = detail?.aboutMe

  const firstName = player.name.split(' ')[0]
  const initials = player.name
    .split(' ')
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div style={{ perspective: '1200px', width: 'min(320px, 80vw)', aspectRatio: '320 / 480', margin: '0 auto' }}>
      <div
        onClick={() => setFlipped(f => !f)}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.6s ease',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          cursor: 'pointer',
        }}
        aria-label={`${player.name} card — click to flip`}
        role="button"
      >
        {/* FRONT */}
        <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden' }}>
          <CardFront
            player={player}
            initials={initials}
            stats={stats}
            isStub={isStub}
          />
        </div>

        {/* BACK */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <CardBack
            firstName={firstName}
            aboutMe={aboutMe}
            isStub={isStub}
          />
        </div>
      </div>
    </div>
  )
}

// ─── CardFront ──────────────────────────────────────────────────────────

function CardFront({ player, initials, stats, isStub }: {
  player: SquadPlayer
  initials: string
  stats?: JuniorPlayerStats
  isStub: boolean
}) {
  const rating: number | string = stats?.rating ?? '—'
  const kitNumber: number | string = player.shirt ?? '—'

  const parts = player.name.split(' ')
  const first = parts[0]
  const rest = parts.slice(1).join(' ')

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: `linear-gradient(135deg, ${C.accent60}, ${C.accent20})`,
        border: `1px solid ${C.accent55}`,
        borderRadius: 18,
        boxShadow: `0 0 40px ${C.accent30}`,
        padding: '20px 18px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Club crest watermark — top-right, faint, slight rotation */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/badges/oakridge_fc_crest.svg"
        alt=""
        aria-hidden
        style={{
          position: 'absolute',
          top: 14,
          right: 14,
          width: 60,
          height: 60,
          opacity: 0.08,
          transform: 'rotate(-6deg)',
          pointerEvents: 'none',
        }}
      />

      {/* Top row — rating + position (left) + kit number (right) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{
            fontSize: 44,
            fontWeight: 900,
            lineHeight: 1,
            color: C.text,
            letterSpacing: '-0.02em',
          }}>
            {rating}
          </div>
          <div style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            color: C.text,
            marginTop: 4,
          }}>
            {player.position}
          </div>
        </div>
        <div style={{
          fontSize: 11,
          fontWeight: 700,
          color: C.text,
          background: 'rgba(0,0,0,0.25)',
          padding: '4px 10px',
          borderRadius: 999,
        }}>
          #{kitNumber}
        </div>
      </div>

      {/* Avatar */}
      <div style={{
        width: 110,
        height: 110,
        borderRadius: '50%',
        background: C.accentDim,
        border: `2px solid ${C.accent55}`,
        margin: '18px auto 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{
          fontSize: 36,
          fontWeight: 900,
          color: C.text,
          letterSpacing: '-0.02em',
        }}>
          {initials}
        </span>
      </div>

      {/* Name — two-line uppercase split */}
      <div style={{ textAlign: 'center', marginBottom: 16, lineHeight: 1.15 }}>
        <div style={{
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: '0.06em',
          color: C.text,
          textTransform: 'uppercase',
        }}>{first}</div>
        {rest && (
          <div style={{
            fontSize: 15,
            fontWeight: 800,
            letterSpacing: '0.06em',
            color: C.text,
            textTransform: 'uppercase',
          }}>{rest}</div>
        )}
      </div>

      {/* Stats grid — 2 cols x 3 rows */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        columnGap: 18,
        rowGap: 4,
        marginTop: 'auto',
      }}>
        <StatRow label="TEC" value={isStub ? '—' : stats?.tec} icon={<Video size={11} />} />
        <StatRow label="TAC" value={isStub ? '—' : stats?.tac} icon={<User size={11} />} />
        <StatRow label="PHY" value={isStub ? '—' : stats?.phy} icon={<Satellite size={11} />} />
        <StatRow label="SOC" value={isStub ? '—' : stats?.soc} icon={<User size={11} />} />
        <StatRow label="EFF" value={isStub ? '—' : stats?.eff} icon={<User size={11} />} />
        <StatRow label="POT" value={isStub ? '—' : stats?.pot} icon={<User size={11} />} />
      </div>
    </div>
  )
}

// ─── StatRow atom ───────────────────────────────────────────────────────

function StatRow({ label, value, icon }: {
  label: string
  value: number | string | undefined
  icon: ReactNode
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '4px 0',
      borderBottom: `1px solid ${C.accent20}`,
    }}>
      <span style={{
        fontSize: 13,
        fontWeight: 900,
        color: C.text,
      }}>
        {value ?? '—'}
      </span>
      <span style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 10,
        fontWeight: 700,
        color: C.text,
        letterSpacing: '0.04em',
      }}>
        <span style={{ color: C.text3, display: 'inline-flex', alignItems: 'center' }}>
          {icon}
        </span>
        {label}
      </span>
    </div>
  )
}

// ─── CardBack ───────────────────────────────────────────────────────────

function CardBack({ firstName, aboutMe, isStub }: {
  firstName: string
  aboutMe?: JuniorPlayerAboutMe
  isStub: boolean
}) {
  const fields: { label: string; value?: string }[] = [
    { label: 'Favourite player',    value: aboutMe?.favouritePlayer },
    { label: 'Favourite club',      value: aboutMe?.favouriteClub },
    { label: 'Favourite film',      value: aboutMe?.favouriteFilm },
    { label: 'Goal celebration',    value: aboutMe?.goalCelebration },
    { label: 'Pre-match meal',      value: aboutMe?.preMatchMeal },
    { label: 'Dream position',      value: aboutMe?.dreamPosition },
  ]

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: `linear-gradient(135deg, ${C.accent60}, ${C.accent20})`,
      border: `1px solid ${C.accent55}`,
      borderRadius: 18,
      boxShadow: `0 0 40px ${C.accent30}`,
      padding: '22px 20px',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      overflowY: 'auto',
    }}>
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.18em',
        color: C.text,
        marginBottom: 4,
      }}>
        About me
      </div>

      {fields.map(f => (
        <div key={f.label}>
          <div style={{
            fontSize: 9.5,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: C.text3,
            marginBottom: 2,
          }}>
            {f.label}
          </div>
          <div style={{
            fontSize: 13,
            fontWeight: 600,
            color: f.value ? C.text : C.text3,
            fontStyle: f.value ? 'normal' : 'italic',
          }}>
            {f.value ?? (isStub ? 'Profile not added yet' : `${firstName} hasn't added this yet`)}
          </div>
        </div>
      ))}

      <div style={{
        marginTop: 'auto',
        fontSize: 9,
        color: C.text3,
        textAlign: 'center',
        fontStyle: 'italic',
      }}>
        Tap card to flip back
      </div>
    </div>
  )
}
