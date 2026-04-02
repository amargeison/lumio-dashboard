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
   Corner Routine C — Pile In — Everyone Attack
   ────────────────────────────────────────────── */
function CornerRoutineC() {
  return (
    <Card>
      <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
        Routine C — &quot;Pile In — Everyone Attack&quot;
      </h3>
      <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
        Everyone just runs into the box. No structure, no plan. Chaos.
        Sometimes you just need bodies in the box. Get in there.
      </p>

      <div style={{ overflowX: 'auto' }}>
        <PitchSVG width={340} height={260} halfPitch className="set-piece-svg">
          <CornerFlag side="right" />

          {/* Delivery arc from corner */}
          <BallFlight x1={320} y1={20} x2={190} y2={70} cx={270} cy={10} color="#F1C40F" />

          {/* Attackers converging on 6-yard box from different angles */}
          <PlayerDot x={100} y={180} label="Daz" type="attack" />
          <MovementArrow x1={100} y1={180} x2={160} y2={80} dashed color="#16A34A" />

          <PlayerDot x={170} y={200} label="Macca" type="attack" />
          <MovementArrow x1={170} y1={200} x2={180} y2={90} dashed color="#16A34A" />

          <PlayerDot x={240} y={190} label="Kev" type="attack" />
          <MovementArrow x1={240} y1={190} x2={210} y2={80} dashed color="#16A34A" />

          <PlayerDot x={80} y={130} label="Dave" type="attack" />
          <MovementArrow x1={80} y1={130} x2={150} y2={70} dashed color="#16A34A" />

          <PlayerDot x={280} y={150} label="Gaz" type="attack" />
          <MovementArrow x1={280} y1={150} x2={230} y2={70} dashed color="#16A34A" />

          <PlayerDot x={200} y={160} label="Robbo" type="attack" />
          <MovementArrow x1={200} y1={160} x2={200} y2={75} dashed color="#16A34A" />

          <PlayerDot x={140} y={170} label="Tommo" type="attack" />
          <MovementArrow x1={140} y1={170} x2={170} y2={75} dashed color="#16A34A" />

          {/* GK */}
          <PlayerDot x={170} y={35} label="GK" type="gk" />

          <PitchLabel x={170} y={250} text="Pile In — Everyone Attack" />
        </PitchSVG>
      </div>

      <EditButton />
    </Card>
  )
}

/* ──────────────────────────────────────────────
   Corner Routine D — Dave at the Back Post Again
   ────────────────────────────────────────────── */
function CornerRoutineD() {
  return (
    <Card>
      <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
        Routine D — &quot;Dave at the Back Post Again&quot;
      </h3>
      <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
        Swing it to the back post for Big Dave. Again. Because it works.
        Dave wins headers. Just keep putting it on his head.
      </p>

      <div style={{ overflowX: 'auto' }}>
        <PitchSVG width={340} height={260} halfPitch className="set-piece-svg">
          <CornerFlag side="right" />

          {/* Ball arc to back post */}
          <BallFlight x1={320} y1={20} x2={90} y2={75} cx={240} cy={5} color="#F1C40F" />

          {/* Dave — back post target */}
          <PlayerDot x={90} y={75} label="Dave" type="attack" />

          {/* Decoy 1 — near post */}
          <PlayerDot x={240} y={90} label="Gaz" type="attack" />
          <MovementArrow x1={240} y1={90} x2={250} y2={55} dashed color="#F1C40F" />

          {/* Decoy 2 — near post */}
          <PlayerDot x={220} y={110} label="Jonesy" type="attack" />
          <MovementArrow x1={220} y1={110} x2={240} y2={70} dashed color="#F1C40F" />

          {/* GK */}
          <PlayerDot x={170} y={35} label="GK" type="gk" />

          {/* Defenders */}
          <PlayerDot x={130} y={80} label="D1" type="defend" />
          <PlayerDot x={200} y={75} label="D2" type="defend" />

          <PitchLabel x={90} y={250} text="Back Post" />
          <PitchLabel x={250} y={250} text="Near Post (Decoys)" />
        </PitchSVG>
      </div>

      <EditButton />
    </Card>
  )
}

/* ──────────────────────────────────────────────
   Corner Routine E — Short — Work a Better Angle
   ────────────────────────────────────────────── */
function CornerRoutineE() {
  return (
    <Card>
      <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
        Routine E — &quot;Short — Work a Better Angle&quot;
      </h3>
      <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
        Play it short, work a better angle, whip it in from closer.
        If the keeper is dominating the box, go short and make him think.
      </p>

      <div style={{ overflowX: 'auto' }}>
        <PitchSVG width={340} height={260} halfPitch className="set-piece-svg">
          <CornerFlag side="right" />

          {/* Ball carrier at corner */}
          <PlayerDot x={310} y={30} label="Jonesy" type="attack" />

          {/* Short pass to receiver */}
          <MovementArrow x1={310} y1={30} x2={280} y2={80} dashed={false} color="#F1C40F" />
          <PlayerDot x={280} y={80} label="Macca" type="attack" />

          {/* Receiver drives closer to goal */}
          <MovementArrow x1={280} y1={80} x2={250} y2={110} dashed color="#16A34A" />

          {/* Cross from better angle into the box */}
          <BallFlight x1={250} y1={110} x2={170} y2={70} cx={220} cy={60} color="#F1C40F" />

          {/* Targets in the box */}
          <PlayerDot x={170} y={100} label="Dave" type="attack" />
          <MovementArrow x1={170} y1={100} x2={170} y2={70} dashed color="#16A34A" />
          <PlayerDot x={140} y={110} label="Gaz" type="attack" />

          {/* GK */}
          <PlayerDot x={170} y={35} label="GK" type="gk" />

          {/* Defenders */}
          <PlayerDot x={200} y={80} label="D1" type="defend" />

          <PitchLabel x={170} y={250} text="Short Corner — Better Angle" />
        </PitchSVG>
      </div>

      <EditButton />
    </Card>
  )
}

/* ──────────────────────────────────────────────
   Corner Routine F — Flick-On for the Penalty Spot
   ────────────────────────────────────────────── */
function CornerRoutineF() {
  return (
    <Card>
      <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
        Routine F — &quot;Flick-On for the Penalty Spot&quot;
      </h3>
      <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
        Near post flick-on to penalty spot runner arriving late.
        Gaz flicks it on, someone smash it in at the pen spot.
      </p>

      <div style={{ overflowX: 'auto' }}>
        <PitchSVG width={340} height={260} halfPitch className="set-piece-svg">
          <CornerFlag side="right" />

          {/* Delivery to near post */}
          <BallFlight x1={320} y1={20} x2={240} y2={60} cx={290} cy={15} color="#F1C40F" />

          {/* Gaz at near post — flick */}
          <PlayerDot x={240} y={60} label="Gaz" type="attack" />

          {/* Flick arrow to penalty spot */}
          <MovementArrow x1={240} y1={60} x2={170} y2={100} dashed={false} color="#F1C40F" />

          {/* Late runner arriving at penalty spot */}
          <PlayerDot x={170} y={180} label="Robbo" type="attack" />
          <MovementArrow x1={170} y1={180} x2={170} y2={110} dashed color="#16A34A" />

          {/* Dave lurking */}
          <PlayerDot x={120} y={90} label="Dave" type="attack" />

          {/* GK */}
          <PlayerDot x={170} y={35} label="GK" type="gk" />

          {/* Defenders */}
          <PlayerDot x={200} y={80} label="D1" type="defend" />
          <PlayerDot x={160} y={70} label="D2" type="defend" />

          <PitchLabel x={170} y={250} text="Flick-On — Pen Spot" />
        </PitchSVG>
      </div>

      <EditButton />
    </Card>
  )
}

/* ──────────────────────────────────────────────
   Corner Routine G — Mixed Up — Keep Them Guessing
   ────────────────────────────────────────────── */
function CornerRoutineG() {
  return (
    <Card>
      <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
        Routine G — &quot;Mixed Up — Keep Them Guessing&quot;
      </h3>
      <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
        Vary between short and long every other corner to keep opposition guessing.
        Don&apos;t be predictable. Mix it up. Keep the other team on their toes.
      </p>

      <div style={{ overflowX: 'auto' }}>
        <PitchSVG width={340} height={260} halfPitch className="set-piece-svg">
          <CornerFlag side="right" />

          {/* Ball carrier at corner */}
          <PlayerDot x={310} y={30} label="Jonesy" type="attack" />

          {/* Option 1: Short pass arrow */}
          <MovementArrow x1={310} y1={30} x2={275} y2={70} dashed={false} color="#16A34A" />
          <PlayerDot x={275} y={70} label="Macca" type="attack" />
          <PitchLabel x={280} y={90} text="Option A: Short" />

          {/* Option 2: Long delivery arc */}
          <BallFlight x1={310} y1={30} x2={120} y2={75} cx={250} cy={5} color="#F1C40F" />
          <PlayerDot x={120} y={75} label="Dave" type="attack" />
          <PitchLabel x={100} y={95} text="Option B: Long" />

          {/* Runners in box */}
          <PlayerDot x={200} y={100} label="Gaz" type="attack" />
          <PlayerDot x={170} y={130} label="Robbo" type="attack" />

          {/* GK */}
          <PlayerDot x={170} y={35} label="GK" type="gk" />

          {/* Defenders */}
          <PlayerDot x={180} y={70} label="D1" type="defend" />
          <PlayerDot x={220} y={80} label="D2" type="defend" />

          <PitchLabel x={170} y={250} text="Mix It Up — Short or Long" />
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

      {/* Setup 3 — Pack the Box */}
      <Card>
        <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
          Setup 3 — &quot;Pack the Box — Head Everything&quot;
        </h3>
        <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          Everyone gets in the box. Head everything that comes in. Don&apos;t let anything drop.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch className="set-piece-svg">
            <CornerFlag side="right" />

            {/* 8 players packed in the box, all facing corner */}
            <PlayerDot x={120} y={70} label="Daz" type="attack" />
            <PlayerDot x={150} y={60} label="Dave" type="attack" />
            <PlayerDot x={180} y={70} label="Chris" type="attack" />
            <PlayerDot x={210} y={60} label="Tommo" type="attack" />
            <PlayerDot x={240} y={70} label="Kev" type="attack" />
            <PlayerDot x={160} y={100} label="Robbo" type="attack" />
            <PlayerDot x={200} y={100} label="Ryan" type="attack" />
            <PlayerDot x={230} y={100} label="Macca" type="attack" />

            {/* GK */}
            <PlayerDot x={170} y={35} label="GK" type="gk" />

            <PitchLabel x={170} y={250} text="Pack the Box" />
          </PitchSVG>
        </div>

        <EditButton />
      </Card>

      {/* Setup 4 — Pick Someone Up */}
      <Card>
        <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
          Setup 4 — &quot;Pick Someone Up and Don&apos;t Lose Them&quot;
        </h3>
        <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          Pure man-marking. Everyone picks a man and sticks to them. You go where they go.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch className="set-piece-svg">
            <CornerFlag side="right" />

            {/* Paired players with connecting lines */}
            <PlayerDot x={130} y={70} label="Daz" type="attack" />
            <PlayerDot x={140} y={80} label="9" type="defend" />
            <MovementArrow x1={130} y1={70} x2={140} y2={80} dashed={false} color="#EF4444" />

            <PlayerDot x={180} y={65} label="Dave" type="attack" />
            <PlayerDot x={190} y={75} label="10" type="defend" />
            <MovementArrow x1={180} y1={65} x2={190} y2={75} dashed={false} color="#EF4444" />

            <PlayerDot x={230} y={80} label="Chris" type="attack" />
            <PlayerDot x={240} y={90} label="7" type="defend" />
            <MovementArrow x1={230} y1={80} x2={240} y2={90} dashed={false} color="#EF4444" />

            <PlayerDot x={160} y={120} label="Kev" type="attack" />
            <PlayerDot x={170} y={130} label="11" type="defend" />
            <MovementArrow x1={160} y1={120} x2={170} y2={130} dashed={false} color="#EF4444" />

            <PlayerDot x={220} y={120} label="Tommo" type="attack" />
            <PlayerDot x={230} y={130} label="5" type="defend" />
            <MovementArrow x1={220} y1={120} x2={230} y2={130} dashed={false} color="#EF4444" />

            {/* GK */}
            <PlayerDot x={170} y={35} label="GK" type="gk" />

            <PitchLabel x={170} y={250} text="Man-Mark Everyone" />
          </PitchSVG>
        </div>

        <EditButton />
      </Card>

      {/* Setup 5 — Leave Two Up */}
      <Card>
        <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
          Setup 5 — &quot;Leave Two Up — Hit on the Counter&quot;
        </h3>
        <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          Leave Gaz and Connor up front, everyone else defends. Clear it and hit them on the break.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch className="set-piece-svg">
            <CornerFlag side="right" />

            {/* 8 defenders in the box */}
            <PlayerDot x={120} y={70} label="Daz" type="attack" />
            <PlayerDot x={150} y={60} label="Dave" type="attack" />
            <PlayerDot x={180} y={70} label="Chris" type="attack" />
            <PlayerDot x={210} y={60} label="Tommo" type="attack" />
            <PlayerDot x={240} y={70} label="Kev" type="attack" />
            <PlayerDot x={160} y={100} label="Robbo" type="attack" />
            <PlayerDot x={200} y={100} label="Ryan" type="attack" />
            <PlayerDot x={240} y={100} label="Macca" type="attack" />

            {/* GK */}
            <PlayerDot x={170} y={35} label="GK" type="gk" />

            {/* Two players high on halfway with forward arrows */}
            <PlayerDot x={100} y={240} label="Gaz" type="attack" />
            <MovementArrow x1={100} y1={240} x2={80} y2={260} dashed color="#16A34A" />
            <PlayerDot x={250} y={240} label="Connor" type="attack" />
            <MovementArrow x1={250} y1={240} x2={270} y2={260} dashed color="#16A34A" />

            <PitchLabel x={170} y={250} text="Counter — Two Stay Up" />
          </PitchSVG>
        </div>

        <EditButton />
      </Card>

      {/* Setup 6 — GK Come and Claim It */}
      <Card>
        <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
          Setup 6 — &quot;GK — Come and Claim It&quot;
        </h3>
        <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          Keeper comes and punches or catches everything. Everyone else just gets out of the way.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch className="set-piece-svg">
            <CornerFlag side="right" />

            {/* GK zone highlighted — large area */}
            <ZoneHighlight x={130} y={30} width={100} height={80} />

            {/* GK */}
            <PlayerDot x={170} y={45} label="GK" type="gk" />

            {/* Players screening but clearing space */}
            <PlayerDot x={120} y={100} label="Daz" type="attack" />
            <PlayerDot x={150} y={120} label="Dave" type="attack" />
            <PlayerDot x={200} y={120} label="Tommo" type="attack" />
            <PlayerDot x={240} y={100} label="Chris" type="attack" />
            <PlayerDot x={260} y={80} label="Kev" type="attack" />
            <PlayerDot x={180} y={140} label="Robbo" type="attack" />

            <PitchLabel x={170} y={250} text="GK Claims Everything" />
          </PitchSVG>
        </div>

        <EditButton />
      </Card>

      {/* Setup 7 — Near Post Trap */}
      <Card>
        <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
          Setup 7 — &quot;Near Post Trap&quot;
        </h3>
        <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          Leave near post looking open. Actually have your best header hiding just behind the zone to intercept.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch className="set-piece-svg">
            <CornerFlag side="right" />

            {/* Gap at near post — no one visibly there */}
            <PitchLabel x={260} y={50} text="(Gap)" />

            {/* Interceptor positioned just behind the gap */}
            <PlayerDot x={240} y={80} label="Dave" type="attack" />
            <MovementArrow x1={240} y1={80} x2={260} y2={55} dashed color="#16A34A" />

            {/* Other defenders */}
            <PlayerDot x={150} y={70} label="Daz" type="attack" />
            <PlayerDot x={180} y={70} label="Tommo" type="attack" />
            <PlayerDot x={200} y={100} label="Chris" type="attack" />
            <PlayerDot x={160} y={110} label="Kev" type="attack" />

            {/* GK */}
            <PlayerDot x={170} y={35} label="GK" type="gk" />

            <PitchLabel x={170} y={250} text="Near Post Trap" />
          </PitchSVG>
        </div>

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

      {/* Routine 3 — Tap It — Shoot From Edge */}
      <Card>
        <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
          Routine 3 — &quot;Tap It — Shoot From Edge&quot;
        </h3>
        <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          Tap it sideways, someone smashes it from the edge of the box.
          Don&apos;t overcomplicate it. Tap and shoot.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch className="set-piece-svg">
            {/* Wall */}
            <DefensiveWall x={200} y={130} count={4} />

            {/* Taker */}
            <PlayerDot x={200} y={195} label="Gaz" type="attack" />

            {/* Sideways tap */}
            <MovementArrow x1={200} y1={195} x2={250} y2={195} dashed={false} color="#F1C40F" />

            {/* Shooter at edge of box */}
            <PlayerDot x={250} y={195} label="Macca" type="attack" />

            {/* Shot from edge */}
            <BallFlight x1={250} y1={195} x2={170} y2={40} cx={190} cy={100} color="#F1C40F" />

            {/* GK */}
            <PlayerDot x={170} y={35} label="GK" type="gk" />

            <PitchLabel x={170} y={250} text="Tap and Shoot" />
          </PitchSVG>
        </div>

        <EditButton />
      </Card>

      {/* Routine 4 — Three Dummies — Late Runner */}
      <Card>
        <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
          Routine 4 — &quot;Three Dummies — Late Runner&quot;
        </h3>
        <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          Three lads stand over it, none of them shoot, fourth lad runs up from behind and belts it.
          The other team will be watching the three of you. That&apos;s the point.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch className="set-piece-svg">
            {/* Wall */}
            <DefensiveWall x={200} y={130} count={4} />

            {/* Three dummies standing over the ball */}
            <PlayerDot x={185} y={190} label="Gaz" type="attack" />
            <PlayerDot x={200} y={195} label="Jonesy" type="attack" />
            <PlayerDot x={215} y={190} label="Robbo" type="attack" />

            {/* Late runner from deep */}
            <PlayerDot x={200} y={240} label="Macca" type="attack" />
            <MovementArrow x1={200} y1={240} x2={200} y2={200} dashed color="#16A34A" />

            {/* Shot */}
            <BallFlight x1={200} y1={200} x2={170} y2={40} cx={150} cy={100} color="#F1C40F" />

            {/* GK */}
            <PlayerDot x={170} y={35} label="GK" type="gk" />

            <PitchLabel x={170} y={250} text="Three Dummies — Late Runner" />
          </PitchSVG>
        </div>

        <EditButton />
      </Card>

      {/* Routine 5 — Drive It Low */}
      <Card>
        <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
          Routine 5 — &quot;Drive It Low&quot;
        </h3>
        <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          Just smash it low and hard under the wall when they jump.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch className="set-piece-svg">
            {/* Wall — jumping */}
            <DefensiveWall x={200} y={130} count={4} />
            <MovementArrow x1={190} y1={130} x2={190} y2={115} dashed color="#EF4444" />
            <MovementArrow x1={210} y1={130} x2={210} y2={115} dashed color="#EF4444" />

            {/* Shooter */}
            <PlayerDot x={200} y={195} label="Gaz" type="attack" />

            {/* Low drive under the wall */}
            <MovementArrow x1={200} y1={195} x2={170} y2={40} dashed={false} color="#F1C40F" />

            {/* GK */}
            <PlayerDot x={170} y={35} label="GK" type="gk" />

            <PitchLabel x={170} y={250} text="Drive It Low — Under the Wall" />
          </PitchSVG>
        </div>

        <EditButton />
      </Card>

      {/* Routine 6 — Curl It Far Post */}
      <Card>
        <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
          Routine 6 — &quot;Curl It Far Post&quot;
        </h3>
        <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          Right foot from left side, curl it around the wall to the far post.
          Bend it like... well, just get it on target.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch className="set-piece-svg">
            {/* Wall */}
            <DefensiveWall x={200} y={130} count={4} />

            {/* Shooter — left side */}
            <PlayerDot x={160} y={195} label="Jonesy" type="attack" />

            {/* Curved ball flight around wall to far post */}
            <BallFlight x1={160} y1={195} x2={100} y2={40} cx={80} cy={120} color="#F1C40F" />

            {/* GK */}
            <PlayerDot x={170} y={35} label="GK" type="gk" />

            <PitchLabel x={100} y={55} text="Far Post" />
            <PitchLabel x={170} y={250} text="Curl It Far Post" />
          </PitchSVG>
        </div>

        <EditButton />
      </Card>

      {/* Routine 7 — Take It Quick */}
      <Card>
        <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
          Routine 7 — &quot;Take It Quick&quot;
        </h3>
        <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          Just take it fast before they organise. Pass it into space.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch className="set-piece-svg">
            {/* No wall — disorganised defence */}
            <PlayerDot x={180} y={140} label="D1" type="defend" />
            <PlayerDot x={220} y={150} label="D2" type="defend" />
            <PlayerDot x={150} y={130} label="D3" type="defend" />

            {/* Taker */}
            <PlayerDot x={200} y={195} label="Gaz" type="attack" />

            {/* Quick pass into space behind defence */}
            <MovementArrow x1={200} y1={195} x2={250} y2={100} dashed={false} color="#F1C40F" />

            {/* Runner into space */}
            <PlayerDot x={270} y={160} label="Connor" type="attack" />
            <MovementArrow x1={270} y1={160} x2={255} y2={105} dashed color="#16A34A" />

            {/* GK */}
            <PlayerDot x={170} y={35} label="GK" type="gk" />

            <PitchLabel x={170} y={250} text="Take It Quick" />
          </PitchSVG>
        </div>

        <EditButton />
      </Card>
    </>
  )
}

/* ──────────────────────────────────────────────
   Free Kicks — Defending
   ────────────────────────────────────────────── */
function FKDefendingSection() {
  return (
    <>
      <SectionHeader>Free Kicks — Defending</SectionHeader>

      {/* Setup 3 — Five in the Wall */}
      <Card>
        <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
          Setup 3 — &quot;Five in the Wall&quot;
        </h3>
        <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          Put five in the wall. Block everything. Keeper sorts the rest.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch className="set-piece-svg">
            {/* 5-man wall */}
            <DefensiveWall x={200} y={130} count={5} />

            {/* GK behind the wall */}
            <PlayerDot x={170} y={35} label="GK" type="gk" />

            {/* Opponent with ball */}
            <PlayerDot x={200} y={200} label="Opp" type="defend" />

            <PitchLabel x={170} y={250} text="Five in the Wall" />
          </PitchSVG>
        </div>

        <EditButton />
      </Card>

      {/* Setup 4 — Drop Deep */}
      <Card>
        <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
          Setup 4 — &quot;Drop Deep&quot;
        </h3>
        <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          Everyone drops a couple of yards deeper. Win the header. Clear it.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch className="set-piece-svg">
            {/* Wall */}
            <DefensiveWall x={200} y={120} count={4} />

            {/* Deeper defensive positions */}
            <PlayerDot x={120} y={80} label="Daz" type="attack" />
            <PlayerDot x={160} y={70} label="Dave" type="attack" />
            <PlayerDot x={220} y={70} label="Tommo" type="attack" />
            <PlayerDot x={260} y={80} label="Chris" type="attack" />
            <PlayerDot x={180} y={95} label="Kev" type="attack" />

            {/* GK */}
            <PlayerDot x={170} y={35} label="GK" type="gk" />

            {/* Opponent */}
            <PlayerDot x={200} y={200} label="Opp" type="defend" />

            <PitchLabel x={170} y={250} text="Drop Deep — Win the Header" />
          </PitchSVG>
        </div>

        <EditButton />
      </Card>

      {/* Setup 5 — Wall Then Sprint */}
      <Card>
        <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
          Setup 5 — &quot;Wall Then Sprint&quot;
        </h3>
        <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          Wall stands still then sprint to close down when they take it.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch className="set-piece-svg">
            {/* Wall */}
            <DefensiveWall x={200} y={130} count={4} />

            {/* Sprint arrows forward from wall */}
            <MovementArrow x1={185} y1={130} x2={185} y2={170} dashed color="#16A34A" />
            <MovementArrow x1={195} y1={130} x2={195} y2={170} dashed color="#16A34A" />
            <MovementArrow x1={205} y1={130} x2={205} y2={170} dashed color="#16A34A" />
            <MovementArrow x1={215} y1={130} x2={215} y2={170} dashed color="#16A34A" />

            {/* GK */}
            <PlayerDot x={170} y={35} label="GK" type="gk" />

            {/* Opponent */}
            <PlayerDot x={200} y={200} label="Opp" type="defend" />

            <PitchLabel x={170} y={250} text="Wall Then Sprint" />
          </PitchSVG>
        </div>

        <EditButton />
      </Card>

      {/* Setup 6 — Block the Layoff */}
      <Card>
        <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
          Setup 6 — &quot;Block the Layoff&quot;
        </h3>
        <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          One player from the wall sprints to block the tap-and-shoot.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch className="set-piece-svg">
            {/* Wall */}
            <DefensiveWall x={200} y={130} count={4} />

            {/* Wall runner breaking towards layoff zone */}
            <PlayerDot x={220} y={140} label="Robbo" type="attack" />
            <MovementArrow x1={220} y1={140} x2={250} y2={185} dashed color="#16A34A" />

            {/* Layoff zone */}
            <ZoneHighlight x={230} y={175} width={50} height={40} />
            <PitchLabel x={255} y={200} text="Layoff" />

            {/* GK */}
            <PlayerDot x={170} y={35} label="GK" type="gk" />

            {/* Opponents */}
            <PlayerDot x={200} y={200} label="Opp" type="defend" />
            <PlayerDot x={250} y={200} label="Opp" type="defend" />

            <PitchLabel x={170} y={250} text="Block the Layoff" />
          </PitchSVG>
        </div>

        <EditButton />
      </Card>

      {/* Setup 7 — GK Covers Near Post */}
      <Card>
        <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
          Setup 7 — &quot;GK Covers Near Post&quot;
        </h3>
        <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          Keeper stands near post. Wall covers far post side.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch className="set-piece-svg">
            {/* Wall angled to cover far side */}
            <DefensiveWall x={160} y={130} count={4} />

            {/* GK near post */}
            <PlayerDot x={230} y={35} label="GK" type="gk" />
            <PitchLabel x={230} y={20} text="Near Post" />

            {/* Far post label */}
            <PitchLabel x={100} y={20} text="Far Post" />

            {/* Opponent */}
            <PlayerDot x={200} y={200} label="Opp" type="defend" />

            <PitchLabel x={170} y={250} text="GK Near Post — Wall Far" />
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

      {/* Routine 3 — Head It Into the Box */}
      <Card>
        <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
          Routine 3 — &quot;Head It Into the Box&quot;
        </h3>
        <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          Throw to tall player, they head it into the box for runners.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch className="set-piece-svg">
            {/* Thrower on touchline */}
            <PlayerDot x={320} y={140} label="Daz" type="attack" />

            {/* Throw to tall player */}
            <BallFlight x1={320} y1={140} x2={270} y2={110} cx={300} cy={110} color="#F1C40F" />
            <PlayerDot x={270} y={110} label="Dave" type="attack" />

            {/* Header flick into box */}
            <MovementArrow x1={270} y1={110} x2={210} y2={80} dashed={false} color="#F1C40F" />

            {/* Runner into box */}
            <PlayerDot x={230} y={150} label="Gaz" type="attack" />
            <MovementArrow x1={230} y1={150} x2={210} y2={90} dashed color="#16A34A" />

            {/* GK */}
            <PlayerDot x={170} y={35} label="GK" type="gk" />

            {/* Defenders */}
            <PlayerDot x={240} y={90} label="D1" type="defend" />

            <PitchLabel x={170} y={250} text="Head It Into the Box" />
          </PitchSVG>
        </div>

        <EditButton />
      </Card>

      {/* Routine 4 — Dummy — Other Bloke Gets It */}
      <Card>
        <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
          Routine 4 — &quot;Dummy — Other Bloke Gets It&quot;
        </h3>
        <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          First player shouts for it and runs, actual receiver peels off quietly.
          Classic Sunday league dummy. Works every time.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch className="set-piece-svg">
            {/* Thrower */}
            <PlayerDot x={320} y={140} label="Daz" type="attack" />

            {/* Decoy run — shouts and runs away */}
            <PlayerDot x={280} y={130} label="Jonesy" type="attack" />
            <MovementArrow x1={280} y1={130} x2={260} y2={170} dashed color="#EF4444" />
            <PitchLabel x={260} y={185} text="Decoy" />

            {/* Real receiver peels off opposite */}
            <PlayerDot x={280} y={160} label="Macca" type="attack" />
            <MovementArrow x1={280} y1={160} x2={290} y2={120} dashed color="#16A34A" />

            {/* Ball goes to real receiver */}
            <BallFlight x1={320} y1={140} x2={290} y2={120} cx={310} cy={125} color="#F1C40F" />

            {/* GK */}
            <PlayerDot x={170} y={35} label="GK" type="gk" />

            <PitchLabel x={170} y={250} text="Dummy Throw-In" />
          </PitchSVG>
        </div>

        <EditButton />
      </Card>

      {/* Routine 5 — Third Man Run */}
      <Card>
        <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
          Routine 5 — &quot;Third Man Run&quot;
        </h3>
        <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          Short throw, lay-off, third player runs into space.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch className="set-piece-svg">
            {/* Thrower */}
            <PlayerDot x={320} y={140} label="Daz" type="attack" />

            {/* Short throw to first player */}
            <MovementArrow x1={320} y1={140} x2={280} y2={140} dashed={false} color="#F1C40F" />
            <PlayerDot x={280} y={140} label="Kev" type="attack" />

            {/* Lay-off to second player */}
            <MovementArrow x1={280} y1={140} x2={260} y2={170} dashed={false} color="#F1C40F" />
            <PlayerDot x={260} y={170} label="Ryan" type="attack" />

            {/* Third man runs into space */}
            <PlayerDot x={240} y={200} label="Gaz" type="attack" />
            <MovementArrow x1={240} y1={200} x2={230} y2={130} dashed color="#16A34A" />

            {/* Pass to third man */}
            <MovementArrow x1={260} y1={170} x2={230} y2={135} dashed={false} color="#F1C40F" />

            {/* GK */}
            <PlayerDot x={170} y={35} label="GK" type="gk" />

            <PitchLabel x={170} y={250} text="Third Man Run" />
          </PitchSVG>
        </div>

        <EditButton />
      </Card>

      {/* Routine 6 — Reverse It — Fool the Winger */}
      <Card>
        <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
          Routine 6 — &quot;Reverse It — Fool the Winger&quot;
        </h3>
        <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          Shape to throw one way, throw the other. Their winger falls for it every time.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch className="set-piece-svg">
            {/* Thrower facing one direction */}
            <PlayerDot x={320} y={140} label="Daz" type="attack" />

            {/* Fake direction — up the line */}
            <MovementArrow x1={320} y1={140} x2={310} y2={90} dashed color="#EF4444" />
            <PitchLabel x={300} y={80} text="Fake" />

            {/* Actual throw — back down the line */}
            <BallFlight x1={320} y1={140} x2={280} y2={180} cx={310} cy={165} color="#F1C40F" />
            <PlayerDot x={280} y={180} label="Robbo" type="attack" />

            {/* Their winger wrong-footed */}
            <PlayerDot x={300} y={110} label="Opp" type="defend" />

            {/* GK */}
            <PlayerDot x={170} y={35} label="GK" type="gk" />

            <PitchLabel x={170} y={250} text="Reverse Throw" />
          </PitchSVG>
        </div>

        <EditButton />
      </Card>

      {/* Routine 7 — Long Chuck — Second Ball */}
      <Card>
        <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
          Routine 7 — &quot;Long Chuck — Second Ball&quot;
        </h3>
        <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          Long throw into the box, if it gets cleared, three players press the clearance.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch className="set-piece-svg">
            {/* Thrower */}
            <PlayerDot x={320} y={130} label="Daz" type="attack" />

            {/* Long throw arc into box */}
            <BallFlight x1={320} y1={130} x2={220} y2={70} cx={280} cy={60} color="#F1C40F" />

            {/* Clearance going out */}
            <MovementArrow x1={220} y1={70} x2={200} y2={150} dashed color="#EF4444" />

            {/* Three players pressing the clearance */}
            <PlayerDot x={160} y={180} label="Gaz" type="attack" />
            <MovementArrow x1={160} y1={180} x2={195} y2={155} dashed color="#16A34A" />

            <PlayerDot x={220} y={190} label="Macca" type="attack" />
            <MovementArrow x1={220} y1={190} x2={205} y2={155} dashed color="#16A34A" />

            <PlayerDot x={180} y={200} label="Kev" type="attack" />
            <MovementArrow x1={180} y1={200} x2={200} y2={160} dashed color="#16A34A" />

            {/* GK */}
            <PlayerDot x={170} y={35} label="GK" type="gk" />

            <PitchLabel x={170} y={250} text="Long Chuck — Press Second Ball" />
          </PitchSVG>
        </div>

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

      {/* Taker 3 — Gaz */}
      <Card>
        <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
          Taker 3 — Gaz
        </h3>
        <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '0.25rem' }}>
          Always goes right, never misses (so far).
        </p>
        <p style={{ color: TEXT_SEC, fontSize: '0.85rem', margin: '0.25rem 0' }}>
          <strong style={{ color: TEXT }}>Composure:</strong> Rock solid
        </p>
        <p style={{ color: TEXT_SEC, fontSize: '0.85rem', margin: '0.25rem 0' }}>
          <strong style={{ color: TEXT }}>Technique:</strong> Side-foot, low right, every single time
        </p>
        <EditButton />
      </Card>

      {/* Taker 4 — Big Dave */}
      <Card>
        <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
          Taker 4 — Big Dave
        </h3>
        <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '0.25rem' }}>
          Power, low left, composure: solid.
        </p>
        <p style={{ color: TEXT_SEC, fontSize: '0.85rem', margin: '0.25rem 0' }}>
          <strong style={{ color: TEXT }}>Composure:</strong> Doesn&apos;t even look nervous
        </p>
        <p style={{ color: TEXT_SEC, fontSize: '0.85rem', margin: '0.25rem 0' }}>
          <strong style={{ color: TEXT }}>Technique:</strong> Just wallops it low left
        </p>
        <EditButton />
      </Card>

      {/* Taker 5 — Jonesy */}
      <Card>
        <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
          Taker 5 — Jonesy
        </h3>
        <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '0.25rem' }}>
          Likes a Panenka (don&apos;t let him).
        </p>
        <p style={{ color: TEXT_SEC, fontSize: '0.85rem', margin: '0.25rem 0' }}>
          <strong style={{ color: TEXT }}>Composure:</strong> 50/50 &mdash; brilliant or disaster
        </p>
        <p style={{ color: TEXT_SEC, fontSize: '0.85rem', margin: '0.25rem 0' }}>
          <strong style={{ color: TEXT }}>Technique:</strong> Chips it if you let him
        </p>
        <EditButton />
      </Card>

      {/* Taker 6 — Macca */}
      <Card>
        <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
          Taker 6 — Macca
        </h3>
        <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '0.25rem' }}>
          Ice cold.
        </p>
        <p style={{ color: TEXT_SEC, fontSize: '0.85rem', margin: '0.25rem 0' }}>
          <strong style={{ color: TEXT }}>Composure:</strong> Hasn&apos;t missed in 3 years
        </p>
        <p style={{ color: TEXT_SEC, fontSize: '0.85rem', margin: '0.25rem 0' }}>
          <strong style={{ color: TEXT }}>Technique:</strong> Placement, top corner
        </p>
        <EditButton />
      </Card>

      {/* Taker 7 — Connor */}
      <Card>
        <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
          Taker 7 — Connor
        </h3>
        <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '0.25rem' }}>
          Only if desperate.
        </p>
        <p style={{ color: TEXT_SEC, fontSize: '0.85rem', margin: '0.25rem 0' }}>
          <strong style={{ color: TEXT }}>Composure:</strong> Gets nervous
        </p>
        <p style={{ color: TEXT_SEC, fontSize: '0.85rem', margin: '0.25rem 0' }}>
          <strong style={{ color: TEXT }}>Technique:</strong> Power but accuracy is iffy
        </p>
        <p
          style={{
            color: TEXT_SEC,
            fontSize: '0.85rem',
            fontStyle: 'italic',
            marginTop: '0.5rem',
            background: BG,
            borderRadius: '0.375rem',
            padding: '0.5rem 0.75rem',
          }}
        >
          Backup option only. Once skied one over the bar and into someone&apos;s windshield.
        </p>
        <EditButton />
      </Card>
    </>
  )
}

/* ──────────────────────────────────────────────
   Goal Kicks
   ────────────────────────────────────────────── */
function GoalKicksSection() {
  return (
    <>
      <SectionHeader>Goal Kicks</SectionHeader>

      {/* Routine 1 — Kick It Diagonal */}
      <Card>
        <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
          Routine 1 — &quot;Kick It Diagonal to Switch Sides&quot;
        </h3>
        <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          GK kicks diagonal to the opposite winger. Bypass midfield.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch className="set-piece-svg">
            {/* GK taking goal kick */}
            <PlayerDot x={170} y={30} label="GK" type="gk" />

            {/* Diagonal ball flight across pitch */}
            <BallFlight x1={170} y1={30} x2={60} y2={200} cx={80} cy={80} color="#F1C40F" />

            {/* Winger receiving */}
            <PlayerDot x={60} y={200} label="Connor" type="attack" />

            {/* Other players */}
            <PlayerDot x={170} y={150} label="Macca" type="attack" />
            <PlayerDot x={250} y={130} label="Ryan" type="attack" />

            <PitchLabel x={170} y={250} text="Diagonal Switch" />
          </PitchSVG>
        </div>

        <EditButton />
      </Card>

      {/* Routine 2 — Boot It Long to Connor */}
      <Card>
        <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
          Routine 2 — &quot;Boot It Long to Connor, He&apos;ll Flick It On&quot;
        </h3>
        <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          Long ball to Connor up front, he flicks it on for a runner.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch className="set-piece-svg">
            {/* GK */}
            <PlayerDot x={170} y={30} label="GK" type="gk" />

            {/* Long ball */}
            <BallFlight x1={170} y1={30} x2={170} y2={190} cx={130} cy={100} color="#F1C40F" />

            {/* Connor — target */}
            <PlayerDot x={170} y={190} label="Connor" type="attack" />

            {/* Flick-on arrow */}
            <MovementArrow x1={170} y1={190} x2={200} y2={220} dashed={false} color="#F1C40F" />

            {/* Runner */}
            <PlayerDot x={220} y={170} label="Gaz" type="attack" />
            <MovementArrow x1={220} y1={170} x2={205} y2={225} dashed color="#16A34A" />

            <PitchLabel x={170} y={250} text="Long to Connor — Flick On" />
          </PitchSVG>
        </div>

        <EditButton />
      </Card>

      {/* Routine 3 — Play It Short */}
      <Card>
        <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
          Routine 3 — &quot;Play It Short If They&apos;re Not Pressing&quot;
        </h3>
        <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          GK rolls it to a centre-back if nobody&apos;s pressing.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch className="set-piece-svg">
            {/* GK */}
            <PlayerDot x={170} y={30} label="GK" type="gk" />

            {/* Short roll to CB */}
            <MovementArrow x1={170} y1={30} x2={130} y2={70} dashed={false} color="#F1C40F" />
            <PlayerDot x={130} y={70} label="Daz" type="attack" />

            {/* CB options */}
            <PlayerDot x={210} y={70} label="Tommo" type="attack" />
            <MovementArrow x1={130} y1={70} x2={210} y2={70} dashed color="#16A34A" />

            <PlayerDot x={170} y={120} label="Kev" type="attack" />
            <MovementArrow x1={130} y1={70} x2={170} y2={120} dashed color="#16A34A" />

            <PitchLabel x={170} y={250} text="Short Goal Kick" />
          </PitchSVG>
        </div>

        <EditButton />
      </Card>

      {/* Routine 4 — Loft It Wide */}
      <Card>
        <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
          Routine 4 — &quot;Loft It Wide — Chase It Down&quot;
        </h3>
        <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          High ball into the wide channel, winger chases it.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch className="set-piece-svg">
            {/* GK */}
            <PlayerDot x={170} y={30} label="GK" type="gk" />

            {/* Lofted ball to wide channel */}
            <BallFlight x1={170} y1={30} x2={300} y2={180} cx={280} cy={60} color="#F1C40F" />

            {/* Winger sprinting to chase */}
            <PlayerDot x={290} y={130} label="Ryan" type="attack" />
            <MovementArrow x1={290} y1={130} x2={300} y2={175} dashed color="#16A34A" />

            <PitchLabel x={170} y={250} text="Loft It Wide" />
          </PitchSVG>
        </div>

        <EditButton />
      </Card>

      {/* Routine 5 — Just Hoof It */}
      <Card>
        <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
          Routine 5 — &quot;Just Hoof It If We&apos;re Under the Cosh&quot;
        </h3>
        <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          If under pressure just kick it as far as possible.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch className="set-piece-svg">
            {/* GK */}
            <PlayerDot x={170} y={30} label="GK" type="gk" />

            {/* Massive long ball arc to halfway line */}
            <BallFlight x1={170} y1={30} x2={170} y2={250} cx={100} cy={120} color="#F1C40F" />

            {/* Players up field */}
            <PlayerDot x={140} y={220} label="Connor" type="attack" />
            <PlayerDot x={200} y={230} label="Gaz" type="attack" />

            <PitchLabel x={170} y={250} text="Just Hoof It" />
          </PitchSVG>
        </div>

        <EditButton />
      </Card>
    </>
  )
}

/* ──────────────────────────────────────────────
   Kick-Offs
   ────────────────────────────────────────────── */
function KickOffsSection() {
  return (
    <>
      <SectionHeader>Kick-Offs</SectionHeader>

      {/* Routine 1 — Knock It Back and Go Wide */}
      <Card>
        <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
          Routine 1 — &quot;Knock It Back and Go Wide Straight Away&quot;
        </h3>
        <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          Back to midfield, quick switch wide.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch className="set-piece-svg">
            {/* Centre spot — kick off */}
            <PlayerDot x={170} y={250} label="Connor" type="attack" />
            <PlayerDot x={185} y={250} label="Gaz" type="attack" />

            {/* Back pass */}
            <MovementArrow x1={170} y1={250} x2={170} y2={200} dashed={false} color="#F1C40F" />
            <PlayerDot x={170} y={200} label="Macca" type="attack" />

            {/* Wide switch */}
            <MovementArrow x1={170} y1={200} x2={60} y2={180} dashed={false} color="#16A34A" />
            <PlayerDot x={60} y={180} label="Ryan" type="attack" />

            <PitchLabel x={170} y={130} text="Knock Back — Go Wide" />
          </PitchSVG>
        </div>

        <EditButton />
      </Card>

      {/* Routine 2 — Press Them Immediately */}
      <Card>
        <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
          Routine 2 — &quot;Press Them Immediately — Win It Back Fast&quot;
        </h3>
        <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          Kick off forward and press as a team.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch className="set-piece-svg">
            {/* Kick off forward */}
            <PlayerDot x={170} y={250} label="Connor" type="attack" />
            <MovementArrow x1={170} y1={250} x2={170} y2={200} dashed={false} color="#F1C40F" />

            {/* Press arrows from all players */}
            <PlayerDot x={100} y={220} label="Ryan" type="attack" />
            <MovementArrow x1={100} y1={220} x2={120} y2={180} dashed color="#16A34A" />

            <PlayerDot x={240} y={220} label="Jonesy" type="attack" />
            <MovementArrow x1={240} y1={220} x2={220} y2={180} dashed color="#16A34A" />

            <PlayerDot x={140} y={230} label="Gaz" type="attack" />
            <MovementArrow x1={140} y1={230} x2={150} y2={190} dashed color="#16A34A" />

            <PlayerDot x={200} y={230} label="Macca" type="attack" />
            <MovementArrow x1={200} y1={230} x2={190} y2={190} dashed color="#16A34A" />

            <PlayerDot x={170} y={200} label="Kev" type="attack" />
            <MovementArrow x1={170} y1={200} x2={170} y2={160} dashed color="#16A34A" />

            <PitchLabel x={170} y={130} text="Press Immediately" />
          </PitchSVG>
        </div>

        <EditButton />
      </Card>

      {/* Routine 3 — Keep Possession */}
      <Card>
        <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
          Routine 3 — &quot;Keep Possession — Don&apos;t Give It Away&quot;
        </h3>
        <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          Play it back, keep it simple, retain possession.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch className="set-piece-svg">
            {/* Kick off */}
            <PlayerDot x={170} y={250} label="Connor" type="attack" />

            {/* Back pass */}
            <MovementArrow x1={170} y1={250} x2={170} y2={210} dashed={false} color="#F1C40F" />
            <PlayerDot x={170} y={210} label="Macca" type="attack" />

            {/* Short passes between midfielders */}
            <MovementArrow x1={170} y1={210} x2={120} y2={200} dashed color="#16A34A" />
            <PlayerDot x={120} y={200} label="Kev" type="attack" />

            <MovementArrow x1={120} y1={200} x2={170} y2={190} dashed color="#16A34A" />
            <PlayerDot x={170} y={190} label="Gaz" type="attack" />

            <MovementArrow x1={170} y1={190} x2={220} y2={200} dashed color="#16A34A" />
            <PlayerDot x={220} y={200} label="Robbo" type="attack" />

            <PitchLabel x={170} y={130} text="Keep Possession" />
          </PitchSVG>
        </div>

        <EditButton />
      </Card>

      {/* Routine 4 — Long Ball */}
      <Card>
        <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
          Routine 4 — &quot;Long Ball — Test Their Defence Early&quot;
        </h3>
        <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          Kick off and immediately play it long to test the opposition CB.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch className="set-piece-svg">
            {/* Kick off */}
            <PlayerDot x={170} y={250} label="Connor" type="attack" />

            {/* Long ball forward over midfield */}
            <BallFlight x1={170} y1={250} x2={170} y2={100} cx={120} cy={160} color="#F1C40F" />

            {/* Target striker */}
            <PlayerDot x={170} y={120} label="Gaz" type="attack" />
            <MovementArrow x1={170} y1={120} x2={170} y2={100} dashed color="#16A34A" />

            {/* Opposition CB */}
            <PlayerDot x={180} y={90} label="D1" type="defend" />

            <PitchLabel x={170} y={60} text="Long Ball — Test Them" />
          </PitchSVG>
        </div>

        <EditButton />
      </Card>

      {/* Routine 5 — Drop Into Shape */}
      <Card>
        <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
          Routine 5 — &quot;Drop Into Shape — Let Them Have It&quot;
        </h3>
        <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          On opposition kick-off, drop into a compact shape and let them make mistakes.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch className="set-piece-svg">
            {/* Compact defensive formation */}
            {/* Back four */}
            <PlayerDot x={80} y={120} label="Chris" type="attack" />
            <PlayerDot x={140} y={110} label="Daz" type="attack" />
            <PlayerDot x={200} y={110} label="Tommo" type="attack" />
            <PlayerDot x={260} y={120} label="Ryan" type="attack" />

            {/* Midfield four */}
            <PlayerDot x={100} y={170} label="Robbo" type="attack" />
            <PlayerDot x={155} y={165} label="Kev" type="attack" />
            <PlayerDot x={210} y={165} label="Macca" type="attack" />
            <PlayerDot x={260} y={170} label="Jonesy" type="attack" />

            {/* Two up front */}
            <PlayerDot x={150} y={220} label="Gaz" type="attack" />
            <PlayerDot x={200} y={220} label="Connor" type="attack" />

            {/* GK */}
            <PlayerDot x={170} y={50} label="GK" type="gk" />

            <PitchLabel x={170} y={250} text="Compact Shape — Let Them Come" />
          </PitchSVG>
        </div>

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
      <CornerRoutineC />
      <CornerRoutineD />
      <CornerRoutineE />
      <CornerRoutineF />
      <CornerRoutineG />

      {/* ── DEFENDING CORNERS ── */}
      <DefendingCorners />

      {/* ── FREE KICKS ── */}
      <FreeKicksSection />

      {/* ── FREE KICKS DEFENDING ── */}
      <FKDefendingSection />

      {/* ── LONG THROWS ── */}
      <LongThrowsSection />

      {/* ── THROW-INS ── */}
      <ThrowInsSection />

      {/* ── GOAL KICKS ── */}
      <GoalKicksSection />

      {/* ── KICK-OFFS ── */}
      <KickOffsSection />

      {/* ── PENALTIES ── */}
      <PenaltiesSection />

      {/* ── SET PIECE STATS ── */}
      <SetPieceStatsSection />

      {/* Bottom spacer */}
      <div style={{ height: '3rem' }} />
    </div>
  )
}
