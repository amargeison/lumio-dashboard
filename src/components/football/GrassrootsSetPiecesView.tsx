'use client'

import React, { useState } from 'react'
import {
  PitchSVG,
  PlayerDot,
  MovementArrow,
  BallFlight,
  ZoneHighlight,
  PitchLabel,
  DefensiveWall,
  CornerFlag,
} from '@/components/football/PitchDiagram'

const PRIMARY = '#16A34A'
const CARD_BG = '#1E293B'
const BORDER = '#334155'
const TEXT = '#F8FAFC'
const TEXT_SEC = '#94A3B8'
const BG = '#0F172A'

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: '1.25rem',
        fontWeight: 700,
        color: PRIMARY,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '1rem',
        marginTop: '2.5rem',
        borderBottom: `2px solid ${PRIMARY}`,
        paddingBottom: '0.5rem',
      }}
    >
      {children}
    </h2>
  )
}

function Card({
  children,
  style,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div
      style={{
        background: CARD_BG,
        border: `1px solid ${BORDER}`,
        borderRadius: '0.75rem',
        padding: '1.25rem',
        marginBottom: '1rem',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function EditButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent',
        border: `1px solid ${BORDER}`,
        color: TEXT_SEC,
        borderRadius: '0.375rem',
        padding: '0.25rem 0.75rem',
        fontSize: '0.8rem',
        cursor: 'pointer',
        marginTop: '0.75rem',
      }}
    >
      Edit
    </button>
  )
}

function OptionButton({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: selected ? PRIMARY : 'transparent',
        color: selected ? '#fff' : TEXT_SEC,
        border: `1px solid ${selected ? PRIMARY : BORDER}`,
        borderRadius: '0.5rem',
        padding: '0.5rem 1rem',
        fontSize: '0.875rem',
        fontWeight: selected ? 600 : 400,
        cursor: 'pointer',
        marginRight: '0.5rem',
        marginBottom: '0.5rem',
        transition: 'all 0.15s ease',
      }}
    >
      {label}
    </button>
  )
}

/* ──────────────────────────────────────────────
   Corner Routine A — Big Lad Back Post
   ────────────────────────────────────────────── */
function CornerRoutineA() {
  return (
    <Card>
      <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
        Routine A — &quot;Big Lad Back Post&quot;
      </h3>
      <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
        Swing it to the back post for Dave. Two runners near post to pull
        defenders. Robbo on the edge for any knockdowns.
      </p>

      <div style={{ overflowX: 'auto' }}>
        <PitchSVG width={340} height={260} halfPitch className="set-piece-svg">
          <CornerFlag side="right" />

          {/* Delivery arc from corner to back post */}
          <BallFlight x1={320} y1={20} x2={100} y2={80} cx={250} cy={10} color="#F1C40F" />

          {/* Dave — back post target */}
          <PlayerDot x={100} y={80} label="Dave" type="attack" />

          {/* Gaz — near post runner */}
          <PlayerDot x={220} y={100} label="Gaz" type="attack" />
          <MovementArrow x1={220} y1={100} x2={240} y2={60} dashed color="#F1C40F" />

          {/* Jonesy — second near-post runner */}
          <PlayerDot x={200} y={130} label="Jonesy" type="attack" />
          <MovementArrow x1={200} y1={130} x2={230} y2={80} dashed color="#F1C40F" />

          {/* Robbo — edge of the box */}
          <PlayerDot x={170} y={200} label="Robbo" type="attack" />

          {/* GK */}
          <PlayerDot x={170} y={35} label="GK" type="gk" />

          {/* Defenders */}
          <PlayerDot x={150} y={80} label="D1" type="defend" />
          <PlayerDot x={190} y={70} label="D2" type="defend" />
          <PlayerDot x={230} y={90} label="D3" type="defend" />

          <PitchLabel x={100} y={250} text="Back Post" />
          <PitchLabel x={260} y={250} text="Near Post" />
        </PitchSVG>
      </div>

      <EditButton />
    </Card>
  )
}

/* ──────────────────────────────────────────────
   Corner Routine B — Short Corner
   ────────────────────────────────────────────── */
function CornerRoutineB() {
  return (
    <Card>
      <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
        Routine B — &quot;Short Corner&quot;
      </h3>
      <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
        Short to Jonesy, he cuts it back, someone arrive late from midfield.
      </p>

      <div style={{ overflowX: 'auto' }}>
        <PitchSVG width={340} height={260} halfPitch className="set-piece-svg">
          <CornerFlag side="right" />

          {/* Ball carrier at corner */}
          <PlayerDot x={310} y={30} label="Ball" type="ball" />

          {/* Jonesy receives short */}
          <PlayerDot x={280} y={60} label="Jonesy" type="attack" />
          <MovementArrow x1={310} y1={30} x2={280} y2={60} dashed={false} color="#F1C40F" />

          {/* Cut-back into the box */}
          <MovementArrow x1={280} y1={60} x2={220} y2={110} dashed color="#F1C40F" />

          {/* Late runner from midfield */}
          <PlayerDot x={200} y={200} label="Macca" type="attack" />
          <MovementArrow x1={200} y1={200} x2={220} y2={130} dashed color="#16A34A" />

          {/* Target in box */}
          <PlayerDot x={170} y={100} label="Dave" type="attack" />

          {/* GK */}
          <PlayerDot x={170} y={35} label="GK" type="gk" />

          {/* Defenders */}
          <PlayerDot x={200} y={80} label="D1" type="defend" />
          <PlayerDot x={240} y={70} label="D2" type="defend" />
        </PitchSVG>
      </div>

      <EditButton />
    </Card>
  )
}

/* ──────────────────────────────────────────────
   Defending Corners — Zonal / Man / Mix
   ────────────────────────────────────────────── */
function DefendingCorners() {
  const [mode, setMode] = useState<'zonal' | 'man' | 'mix'>('zonal')

  return (
    <>
      <SectionHeader>Defending Corners</SectionHeader>
      <p style={{ color: TEXT_SEC, marginBottom: '1rem', fontSize: '0.9rem' }}>
        How do you defend corners? Pick your style:
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <OptionButton label="A) Zonal" selected={mode === 'zonal'} onClick={() => setMode('zonal')} />
        <OptionButton label="B) Man-for-Man" selected={mode === 'man'} onClick={() => setMode('man')} />
        <OptionButton label="C) Mix" selected={mode === 'mix'} onClick={() => setMode('mix')} />
      </div>

      <Card>
        {mode === 'zonal' && (
          <>
            <p style={{ color: TEXT, marginBottom: '1rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Stand your ground in zones, attack the ball when it arrives. Nobody
              ball-watches &mdash; you own your area.
            </p>
            <div style={{ overflowX: 'auto' }}>
              <PitchSVG width={340} height={260} halfPitch className="set-piece-svg">
                <CornerFlag side="right" />
                {/* Zone blocks */}
                <ZoneHighlight x={120} y={40} width={60} height={50} />
                <ZoneHighlight x={180} y={40} width={60} height={50} />
                <ZoneHighlight x={240} y={40} width={60} height={50} />
                <ZoneHighlight x={150} y={90} width={60} height={50} />
                <ZoneHighlight x={210} y={90} width={60} height={50} />

                <PlayerDot x={150} y={65} label="Daz" type="attack" />
                <PlayerDot x={210} y={65} label="Chris" type="attack" />
                <PlayerDot x={270} y={65} label="Tommo" type="attack" />
                <PlayerDot x={180} y={115} label="Kev" type="attack" />
                <PlayerDot x={240} y={115} label="Ryan" type="attack" />
                <PlayerDot x={170} y={35} label="GK" type="gk" />
                <PlayerDot x={80} y={180} label="Gaz" type="attack" />

                <PitchLabel x={170} y={250} text="Zonal Marking" />
              </PitchSVG>
            </div>
          </>
        )}

        {mode === 'man' && (
          <>
            <p style={{ color: TEXT, marginBottom: '1rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Pick someone up and don&apos;t let them breathe. You go where they
              go. Simple.
            </p>
            <div style={{ overflowX: 'auto' }}>
              <PitchSVG width={340} height={260} halfPitch className="set-piece-svg">
                <CornerFlag side="right" />

                {/* Paired markers connected by lines */}
                <PlayerDot x={140} y={70} label="Daz" type="attack" />
                <PlayerDot x={155} y={80} label="9" type="defend" />
                <MovementArrow x1={140} y1={70} x2={155} y2={80} dashed={false} color="#EF4444" />

                <PlayerDot x={210} y={60} label="Chris" type="attack" />
                <PlayerDot x={225} y={70} label="7" type="defend" />
                <MovementArrow x1={210} y1={60} x2={225} y2={70} dashed={false} color="#EF4444" />

                <PlayerDot x={260} y={90} label="Tommo" type="attack" />
                <PlayerDot x={275} y={100} label="5" type="defend" />
                <MovementArrow x1={260} y1={90} x2={275} y2={100} dashed={false} color="#EF4444" />

                <PlayerDot x={180} y={120} label="Kev" type="attack" />
                <PlayerDot x={195} y={130} label="11" type="defend" />
                <MovementArrow x1={180} y1={120} x2={195} y2={130} dashed={false} color="#EF4444" />

                <PlayerDot x={170} y={35} label="GK" type="gk" />
                <PlayerDot x={80} y={180} label="Gaz" type="attack" />

                <PitchLabel x={170} y={250} text="Man-for-Man" />
              </PitchSVG>
            </div>
          </>
        )}

        {mode === 'mix' && (
          <>
            <p style={{ color: TEXT, marginBottom: '1rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Zonal in the 6-yard box &mdash; nobody crosses that line
              unchallenged. Man-mark their best header of the ball outside it.
            </p>
            <div style={{ overflowX: 'auto' }}>
              <PitchSVG width={340} height={260} halfPitch className="set-piece-svg">
                <CornerFlag side="right" />

                {/* 6-yard zone */}
                <ZoneHighlight x={140} y={30} width={120} height={45} />

                {/* Zonal players */}
                <PlayerDot x={170} y={55} label="Daz" type="attack" />
                <PlayerDot x={220} y={55} label="Tommo" type="attack" />

                {/* Man-marked attacker */}
                <PlayerDot x={200} y={120} label="Chris" type="attack" />
                <PlayerDot x={215} y={130} label="9" type="defend" />
                <MovementArrow x1={200} y1={120} x2={215} y2={130} dashed={false} color="#EF4444" />

                <PlayerDot x={260} y={100} label="Kev" type="attack" />
                <PlayerDot x={275} y={110} label="5" type="defend" />
                <MovementArrow x1={260} y1={100} x2={275} y2={110} dashed={false} color="#EF4444" />

                <PlayerDot x={170} y={35} label="GK" type="gk" />
                <PlayerDot x={80} y={180} label="Gaz" type="attack" />

                <PitchLabel x={170} y={250} text="Mix: Zonal + Man-Mark" />
              </PitchSVG>
            </div>
          </>
        )}

        <EditButton />
      </Card>
    </>
  )
}

/* ──────────────────────────────────────────────
   Free Kicks
   ────────────────────────────────────────────── */
function FreeKicksSection() {
  return (
    <>
      <SectionHeader>Free Kicks</SectionHeader>

      {/* Shooting range */}
      <Card>
        <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
          Shooting Range (20&ndash;25 yards)
        </h3>
        <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          Direct shot &mdash; if someone fancies it. Otherwise square it and
          have a go from the edge.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch className="set-piece-svg">
            {/* Wall */}
            <DefensiveWall x={200} y={130} count={4} />

            {/* Shooter */}
            <PlayerDot x={200} y={195} label="Gaz" type="attack" />

            {/* Trajectory over the wall */}
            <BallFlight x1={200} y1={195} x2={170} y2={40} cx={140} cy={100} color="#F1C40F" />

            {/* GK */}
            <PlayerDot x={170} y={35} label="GK" type="gk" />

            <PitchLabel x={170} y={250} text="Direct Free Kick" />
          </PitchSVG>
        </div>

        <EditButton />
      </Card>

      {/* Wide free kick */}
      <Card>
        <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
          Wide Free Kick
        </h3>
        <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          Whip it in to the back post or play it short. Keep it simple.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch className="set-piece-svg">
            {/* Taker out wide */}
            <PlayerDot x={300} y={170} label="Jonesy" type="attack" />

            {/* Delivery to back post */}
            <BallFlight x1={300} y1={170} x2={110} y2={70} cx={220} cy={50} color="#F1C40F" />

            {/* Target */}
            <PlayerDot x={110} y={70} label="Dave" type="attack" />
            <PlayerDot x={200} y={90} label="Macca" type="attack" />

            {/* GK */}
            <PlayerDot x={170} y={35} label="GK" type="gk" />

            {/* Defenders */}
            <PlayerDot x={150} y={80} label="D1" type="defend" />
            <PlayerDot x={220} y={75} label="D2" type="defend" />

            <PitchLabel x={170} y={250} text="Wide Free Kick" />
          </PitchSVG>
        </div>

        <EditButton />
      </Card>
    </>
  )
}

/* ──────────────────────────────────────────────
   Long Throws
   ────────────────────────────────────────────── */
function LongThrowsSection() {
  const [hasLongThrower, setHasLongThrower] = useState(false)
  const [throwerName, setThrowerName] = useState('')

  return (
    <>
      <SectionHeader>Long Throws</SectionHeader>
      <Card>
        <p style={{ color: TEXT, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          Do you have a Dave Bassett? A player who can launch it into the box?
        </p>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <OptionButton
            label="Yes"
            selected={hasLongThrower}
            onClick={() => setHasLongThrower(true)}
          />
          <OptionButton
            label="No"
            selected={!hasLongThrower}
            onClick={() => setHasLongThrower(false)}
          />
        </div>

        {hasLongThrower && (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  color: TEXT_SEC,
                  fontSize: '0.8rem',
                  marginBottom: '0.25rem',
                }}
              >
                Who&apos;s your long throw specialist?
              </label>
              <input
                type="text"
                value={throwerName}
                onChange={(e) => setThrowerName(e.target.value)}
                placeholder="e.g. Daz"
                style={{
                  background: BG,
                  border: `1px solid ${BORDER}`,
                  borderRadius: '0.375rem',
                  padding: '0.5rem 0.75rem',
                  color: TEXT,
                  fontSize: '0.9rem',
                  width: '100%',
                  maxWidth: '240px',
                  outline: 'none',
                }}
              />
            </div>

            <p
              style={{
                color: TEXT_SEC,
                fontSize: '0.9rem',
                lineHeight: 1.6,
                marginBottom: '1rem',
              }}
            >
              Get it in the mixer &mdash; near post flick-on. Everyone else
              attack the second ball.
            </p>

            <div style={{ overflowX: 'auto' }}>
              <PitchSVG width={340} height={260} halfPitch className="set-piece-svg">
                {/* Thrower on touchline */}
                <PlayerDot x={320} y={130} label={throwerName || 'Daz'} type="attack" />

                {/* Throw trajectory */}
                <BallFlight
                  x1={320}
                  y1={130}
                  x2={230}
                  y2={70}
                  cx={290}
                  cy={60}
                  color="#F1C40F"
                />

                {/* Near post flicker */}
                <PlayerDot x={230} y={70} label="Dave" type="attack" />

                {/* Flick-on arrow */}
                <MovementArrow x1={230} y1={70} x2={180} y2={55} dashed color="#F1C40F" />

                {/* Runners on second ball */}
                <PlayerDot x={170} y={100} label="Macca" type="attack" />
                <MovementArrow x1={170} y1={100} x2={175} y2={65} dashed color="#16A34A" />

                <PlayerDot x={140} y={110} label="Gaz" type="attack" />
                <MovementArrow x1={140} y1={110} x2={160} y2={70} dashed color="#16A34A" />

                {/* GK */}
                <PlayerDot x={170} y={35} label="GK" type="gk" />

                {/* Defenders */}
                <PlayerDot x={200} y={65} label="D1" type="defend" />
                <PlayerDot x={250} y={80} label="D2" type="defend" />

                <PitchLabel x={170} y={250} text="Long Throw — Near Post Flick" />
              </PitchSVG>
            </div>
          </>
        )}

        <EditButton />
      </Card>
    </>
  )
}

/* ──────────────────────────────────────────────
   Throw-ins
   ────────────────────────────────────────────── */
function ThrowInsSection() {
  return (
    <>
      <SectionHeader>Throw-Ins</SectionHeader>
      <Card>
        <p style={{ color: TEXT, fontWeight: 600, marginBottom: '0.75rem' }}>
          Two rules for throw-ins:
        </p>
        <ol
          style={{
            color: TEXT_SEC,
            fontSize: '0.9rem',
            lineHeight: 1.8,
            paddingLeft: '1.25rem',
            margin: 0,
          }}
        >
          <li>
            Don&apos;t throw it back to your own centre-back under pressure.
            That&apos;s how you concede scrappy goals.
          </li>
          <li>
            Use the long throw in the final third &mdash; it&apos;s basically a
            free cross.
          </li>
        </ol>
        <EditButton />
      </Card>
    </>
  )
}

/* ──────────────────────────────────────────────
   Penalties
   ────────────────────────────────────────────── */
function PenaltiesSection() {
  return (
    <>
      <SectionHeader>Penalties</SectionHeader>
      <Card>
        <div style={{ marginBottom: '0.75rem' }}>
          <span style={{ color: TEXT_SEC, fontSize: '0.8rem' }}>Taker 1</span>
          <p style={{ color: TEXT, fontWeight: 600, margin: 0 }}>Gaz Whitfield</p>
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <span style={{ color: TEXT_SEC, fontSize: '0.8rem' }}>Taker 2</span>
          <p style={{ color: TEXT, fontWeight: 600, margin: 0 }}>Liam Fry</p>
        </div>
        <p
          style={{
            color: TEXT_SEC,
            fontSize: '0.9rem',
            lineHeight: 1.6,
            marginTop: '0.5rem',
            fontStyle: 'italic',
          }}
        >
          Pick a side and commit. Don&apos;t change your mind halfway through
          your run-up.
        </p>
        <EditButton />
      </Card>
    </>
  )
}

/* ──────────────────────────────────────────────
   Set Piece Stats
   ────────────────────────────────────────────── */
function SetPieceStatsSection() {
  return (
    <>
      <SectionHeader>Set Piece Stats</SectionHeader>
      <Card>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            marginBottom: '1rem',
          }}
        >
          <div>
            <p style={{ color: TEXT_SEC, fontSize: '0.8rem', margin: 0 }}>
              Goals FROM set pieces
            </p>
            <p
              style={{
                color: PRIMARY,
                fontSize: '2rem',
                fontWeight: 700,
                margin: 0,
              }}
            >
              4
            </p>
          </div>
          <div>
            <p style={{ color: TEXT_SEC, fontSize: '0.8rem', margin: 0 }}>
              Goals CONCEDED from set pieces
            </p>
            <p
              style={{
                color: '#EF4444',
                fontSize: '2rem',
                fontWeight: 700,
                margin: 0,
              }}
            >
              5
            </p>
          </div>
        </div>
        <p
          style={{
            color: TEXT_SEC,
            fontSize: '0.9rem',
            lineHeight: 1.6,
            background: BG,
            borderRadius: '0.5rem',
            padding: '0.75rem',
          }}
        >
          Set pieces are worth working on &mdash; about 1 in 4 goals in Sunday
          football come from dead balls. Five minutes on the training pitch can
          make all the difference.
        </p>
      </Card>
    </>
  )
}

/* ══════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════ */
export default function GrassrootsSetPiecesView() {
  return (
    <div
      style={{
        background: BG,
        minHeight: '100vh',
        padding: '1.5rem',
        color: TEXT,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        maxWidth: '720px',
        margin: '0 auto',
      }}
    >
      {/* Page Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: TEXT,
            margin: 0,
          }}
        >
          Set Pieces
        </h1>
        <p style={{ color: TEXT_SEC, margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
          Sunday Rovers FC &mdash; dead-ball routines and tips
        </p>
      </div>

      {/* ── YOUR CORNER ROUTINES ── */}
      <SectionHeader>Your Corner Routines</SectionHeader>
      <CornerRoutineA />
      <CornerRoutineB />

      {/* ── DEFENDING CORNERS ── */}
      <DefendingCorners />

      {/* ── FREE KICKS ── */}
      <FreeKicksSection />

      {/* ── LONG THROWS ── */}
      <LongThrowsSection />

      {/* ── THROW-INS ── */}
      <ThrowInsSection />

      {/* ── PENALTIES ── */}
      <PenaltiesSection />

      {/* ── SET PIECE STATS ── */}
      <SetPieceStatsSection />

      {/* Bottom spacer */}
      <div style={{ height: '3rem' }} />
    </div>
  )
}
