'use client'

import React, { useState } from 'react'
import { PitchSVG, PlayerDot } from '@/components/football/PitchDiagram'

const PRIMARY = '#16A34A'
const CARD_BG = '#1E293B'
const BORDER = '#334155'
const TEXT = '#F8FAFC'
const TEXT_SEC = '#94A3B8'
const BG = '#0F172A'

/* ──────────────────────────────────────────────
   Shared UI pieces
   ────────────────────────────────────────────── */
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
   Formation data
   ────────────────────────────────────────────── */
type Formation = '4-4-2' | '4-3-3' | '3-5-2' | '4-2-3-1'

const SQUAD = [
  'Smithy',  // GK
  'Daz',
  'Tommo',
  'Chris',
  'Kev',
  'Ryan',
  'Macca',
  'Jonny',
  'Gaz',
  'Liam',
  'Dave',
]

// Positions on a 340x500 viewBox (full pitch). x centre ≈ 170, y 20=goal, y 480=far goal
interface Pos {
  x: number
  y: number
}

const FORMATIONS: Record<Formation, Pos[]> = {
  '4-4-2': [
    { x: 170, y: 40 },   // GK — Smithy
    { x: 60, y: 130 },   // LB — Daz
    { x: 130, y: 110 },  // CB — Tommo
    { x: 210, y: 110 },  // CB — Chris
    { x: 280, y: 130 },  // RB — Kev
    { x: 60, y: 250 },   // LM — Ryan
    { x: 140, y: 230 },  // CM — Macca
    { x: 200, y: 230 },  // CM — Jonny
    { x: 280, y: 250 },  // RM — Gaz
    { x: 130, y: 370 },  // ST — Liam
    { x: 210, y: 370 },  // ST — Dave
  ],
  '4-3-3': [
    { x: 170, y: 40 },   // GK
    { x: 60, y: 130 },   // LB
    { x: 130, y: 110 },  // CB
    { x: 210, y: 110 },  // CB
    { x: 280, y: 130 },  // RB
    { x: 110, y: 240 },  // CM
    { x: 170, y: 220 },  // CM
    { x: 230, y: 240 },  // CM
    { x: 70, y: 360 },   // LW
    { x: 170, y: 380 },  // ST
    { x: 270, y: 360 },  // RW
  ],
  '3-5-2': [
    { x: 170, y: 40 },   // GK
    { x: 100, y: 120 },  // CB
    { x: 170, y: 105 },  // CB
    { x: 240, y: 120 },  // CB
    { x: 50, y: 230 },   // LWB
    { x: 130, y: 220 },  // CM
    { x: 170, y: 200 },  // CM
    { x: 210, y: 220 },  // CM
    { x: 290, y: 230 },  // RWB
    { x: 140, y: 370 },  // ST
    { x: 200, y: 370 },  // ST
  ],
  '4-2-3-1': [
    { x: 170, y: 40 },   // GK
    { x: 60, y: 130 },   // LB
    { x: 130, y: 110 },  // CB
    { x: 210, y: 110 },  // CB
    { x: 280, y: 130 },  // RB
    { x: 140, y: 210 },  // CDM
    { x: 200, y: 210 },  // CDM
    { x: 80, y: 310 },   // LAM
    { x: 170, y: 290 },  // CAM
    { x: 260, y: 310 },  // RAM
    { x: 170, y: 400 },  // ST
  ],
}

/* ──────────────────────────────────────────────
   Formation Section
   ────────────────────────────────────────────── */
function FormationSection() {
  const [formation, setFormation] = useState<Formation>('4-4-2')
  const positions = FORMATIONS[formation]

  return (
    <>
      <SectionHeader>Formation</SectionHeader>

      <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {(['4-4-2', '4-3-3', '3-5-2', '4-2-3-1'] as Formation[]).map((f) => (
          <OptionButton
            key={f}
            label={f}
            selected={formation === f}
            onClick={() => setFormation(f)}
          />
        ))}
      </div>

      <Card>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={500} halfPitch={false} className="formation-svg">
            {positions.map((pos, i) => (
              <PlayerDot
                key={`${formation}-${i}`}
                x={pos.x}
                y={pos.y}
                label={SQUAD[i]}
                type={i === 0 ? 'gk' : 'attack'}
              />
            ))}
          </PitchSVG>
        </div>
      </Card>
    </>
  )
}

/* ──────────────────────────────────────────────
   Playing Style
   ────────────────────────────────────────────── */
type PlayStyle = 'longball' | 'counter' | 'possession' | 'press'

const STYLE_INFO: Record<PlayStyle, { title: string; desc: string }> = {
  longball: {
    title: 'Long Ball',
    desc: 'Get it forward early. Target man holds it up, runners get in behind. Keep it direct — no messing about at the back.',
  },
  counter: {
    title: 'Counter',
    desc: "Defend deep, hit them on the break. Pace on the wings is key. Stay disciplined, don't get dragged out of shape.",
  },
  possession: {
    title: 'Possession',
    desc: "Keep the ball. Short passes, work it into the box. Be patient — they'll switch off eventually.",
  },
  press: {
    title: 'Press',
    desc: "Win it high. Close them down, force mistakes. It's hard work but Sunday league teams panic under pressure.",
  },
}

function PlayingStyleSection() {
  const [style, setStyle] = useState<PlayStyle>('counter')

  return (
    <>
      <SectionHeader>Playing Style</SectionHeader>

      <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {(
          [
            { key: 'longball', label: 'Long Ball' },
            { key: 'counter', label: 'Counter' },
            { key: 'possession', label: 'Possession' },
            { key: 'press', label: 'Press' },
          ] as { key: PlayStyle; label: string }[]
        ).map((s) => (
          <OptionButton
            key={s.key}
            label={s.label}
            selected={style === s.key}
            onClick={() => setStyle(s.key)}
          />
        ))}
      </div>

      <Card>
        <h3 style={{ color: TEXT, fontWeight: 600, marginBottom: '0.5rem' }}>
          {STYLE_INFO[style].title}
        </h3>
        <p style={{ color: TEXT_SEC, fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
          {STYLE_INFO[style].desc}
        </p>
      </Card>
    </>
  )
}

/* ──────────────────────────────────────────────
   Team Talk Planner
   ────────────────────────────────────────────── */
type Mood = 'calm' | 'fired-up' | 'focused' | 'relaxed'

function TeamTalkSection() {
  const [mood, setMood] = useState<Mood>('focused')
  const [notes, setNotes] = useState('')

  return (
    <>
      <SectionHeader>Team Talk Planner</SectionHeader>

      <Card>
        <p style={{ color: TEXT_SEC, fontSize: '0.85rem', marginBottom: '0.75rem' }}>
          Pre-match mood:
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {(
            [
              { key: 'calm', label: 'Calm' },
              { key: 'fired-up', label: 'Fired Up' },
              { key: 'focused', label: 'Focused' },
              { key: 'relaxed', label: 'Relaxed' },
            ] as { key: Mood; label: string }[]
          ).map((m) => (
            <OptionButton
              key={m.key}
              label={m.label}
              selected={mood === m.key}
              onClick={() => setMood(m.key)}
            />
          ))}
        </div>

        <label
          style={{
            display: 'block',
            color: TEXT_SEC,
            fontSize: '0.85rem',
            marginBottom: '0.35rem',
          }}
        >
          What do you want to say before kick-off?
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Keep it tight for the first 15, don't give away silly free kicks..."
          rows={4}
          style={{
            width: '100%',
            background: BG,
            border: `1px solid ${BORDER}`,
            borderRadius: '0.5rem',
            padding: '0.75rem',
            color: TEXT,
            fontSize: '0.9rem',
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
      </Card>
    </>
  )
}

/* ──────────────────────────────────────────────
   Opposition Notes
   ────────────────────────────────────────────── */
function OppositionNotesSection() {
  const [oppoNotes, setOppoNotes] = useState(
    'Crown FC — decent keeper, weak at the back from crosses. Number 9 is quick.'
  )

  return (
    <>
      <SectionHeader>Opposition Notes</SectionHeader>

      <Card>
        <label
          style={{
            display: 'block',
            color: TEXT_SEC,
            fontSize: '0.85rem',
            marginBottom: '0.35rem',
          }}
        >
          What we know about them
        </label>
        <textarea
          value={oppoNotes}
          onChange={(e) => setOppoNotes(e.target.value)}
          rows={5}
          style={{
            width: '100%',
            background: BG,
            border: `1px solid ${BORDER}`,
            borderRadius: '0.5rem',
            padding: '0.75rem',
            color: TEXT,
            fontSize: '0.9rem',
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
      </Card>
    </>
  )
}

/* ──────────────────────────────────────────────
   Last Match
   ────────────────────────────────────────────── */
function LastMatchSection() {
  return (
    <>
      <SectionHeader>Last Match</SectionHeader>

      <Card>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem',
          }}
        >
          <div>
            <p style={{ color: TEXT_SEC, fontSize: '0.8rem', margin: 0 }}>Formation</p>
            <p style={{ color: TEXT, fontWeight: 600, margin: 0 }}>4-4-2</p>
          </div>
          <div>
            <p style={{ color: TEXT_SEC, fontSize: '0.8rem', margin: 0 }}>Result</p>
            <p style={{ color: PRIMARY, fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>
              W 3-0
            </p>
          </div>
          <div>
            <p style={{ color: TEXT_SEC, fontSize: '0.8rem', margin: 0 }}>Opponent</p>
            <p style={{ color: TEXT, fontWeight: 600, margin: 0 }}>White Hart FC</p>
          </div>
          <div>
            <p style={{ color: TEXT_SEC, fontSize: '0.8rem', margin: 0 }}>Scorers</p>
            <p style={{ color: TEXT, fontWeight: 600, margin: 0 }}>Whitfield 2, Clarke</p>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <p style={{ color: TEXT_SEC, fontSize: '0.8rem', margin: 0 }}>Man of the Match</p>
            <p
              style={{
                color: '#F1C40F',
                fontWeight: 700,
                margin: 0,
                fontSize: '1rem',
              }}
            >
              Liam Fry
            </p>
          </div>
        </div>
      </Card>
    </>
  )
}

/* ══════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════ */
export default function GrassrootsTacticsView() {
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
          Tactics Board
        </h1>
        <p style={{ color: TEXT_SEC, margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
          Sunday Rovers FC &mdash; how we play
        </p>
      </div>

      {/* Sections */}
      <FormationSection />
      <PlayingStyleSection />
      <TeamTalkSection />
      <OppositionNotesSection />
      <LastMatchSection />

      {/* Bottom spacer */}
      <div style={{ height: '3rem' }} />
    </div>
  )
}
