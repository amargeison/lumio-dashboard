'use client'

import { useState } from 'react'
import {
  PitchSVG,
  PlayerDot,
  MovementArrow,
  BallFlight,
  ZoneHighlight,
  PitchLabel,
  MarkingLine,
  DefensiveWall,
  CornerFlag,
  ThrowInMarker,
} from '@/components/football/PitchDiagram'

/* ── Theme tokens ─────────────────────────────────────── */
const C = {
  primary: '#C0392B',
  gold: '#F1C40F',
  cardBg: '#1E293B',
  border: '#334155',
  text: '#F8FAFC',
  textSec: '#94A3B8',
  bg: '#0F172A',
} as const

type Tab = 'CORNERS' | 'FREE KICKS' | 'THROW-INS' | 'PENALTIES' | 'GOAL KICKS' | 'KICK-OFFS' | 'STATS' | 'SET PIECE COACH'
type CornerSub = 'Attacking' | 'Defending'
type FKSub = 'Attacking' | 'Defending'
type FKAtkZone = 'Zone A' | 'Zone B' | 'Zone C' | 'Zone D' | 'Indirect'
type ThrowZone = 'Attacking Third' | 'Middle Third' | 'Defensive Third'
type KOSub = 'Attacking' | 'Defending'

/* ── Shared tiny components ───────────────────────────── */

function SectionCard({
  title,
  children,
  onEdit,
}: {
  title: string
  children: React.ReactNode
  onEdit?: () => void
}) {
  return (
    <div
      style={{
        background: C.cardBg,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
        }}
      >
        <h3 style={{ color: C.text, fontSize: 16, fontWeight: 600, margin: 0 }}>
          {title}
        </h3>
        {onEdit && (
          <button
            onClick={onEdit}
            style={{
              background: 'transparent',
              border: `1px solid ${C.border}`,
              color: C.primary,
              borderRadius: 6,
              padding: '4px 12px',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Edit
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

function SubTabBar<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: T[]
  active: T
  onChange: (t: T) => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        marginBottom: 18,
        flexWrap: 'wrap',
      }}
    >
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          style={{
            padding: '5px 14px',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            border: active === t ? 'none' : `1px solid ${C.border}`,
            background: active === t ? C.primary : 'transparent',
            color: active === t ? '#fff' : C.textSec,
          }}
        >
          {t}
        </button>
      ))}
    </div>
  )
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 0',
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <span style={{ color: C.textSec, fontSize: 14 }}>{label}</span>
      <span style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>{value}</span>
    </div>
  )
}

function Badge({ text, color = C.gold }: { text: string; color?: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 600,
        background: color,
        color: '#000',
        marginLeft: 8,
      }}
    >
      {text}
    </span>
  )
}

function CoachAttribution() {
  return (
    <div style={{ marginTop: 12, textAlign: 'right' }}>
      <span style={{ color: C.textSec, fontSize: 11, fontStyle: 'italic' }}>
        Set Piece Coach: Marcus Webb
      </span>
    </div>
  )
}

function StatGrid({ items }: { items: [string, string][] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {items.map(([l, v]) => (
        <div
          key={l}
          style={{
            background: C.bg,
            borderRadius: 8,
            padding: 12,
            textAlign: 'center',
          }}
        >
          <div style={{ color: C.textSec, fontSize: 12, marginBottom: 4 }}>{l}</div>
          <div style={{ color: C.gold, fontSize: 20, fontWeight: 700 }}>{v}</div>
        </div>
      ))}
    </div>
  )
}

/* ============================================================
   TAB 1: CORNERS
   ============================================================ */

function CornersTab() {
  const [sub, setSub] = useState<CornerSub>('Attacking')

  return (
    <>
      <SubTabBar tabs={['Attacking', 'Defending'] as CornerSub[]} active={sub} onChange={setSub} />

      {sub === 'Attacking' && <CornersAttacking />}
      {sub === 'Defending' && <CornersDefending />}
    </>
  )
}

function CornersAttacking() {
  return (
    <>
      {/* Routine 1 — Near Post Flick-On */}
      <SectionCard title='Routine 1: "Near Post Flick-On"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 4px' }}>
          Inswinger from right corner to the near post area for a flick-on.
        </p>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 4px' }}>
          Delivery: <Badge text="Inswinger" /> &nbsp; Taker: <strong style={{ color: C.text }}>Martinez</strong> (left foot)
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <CornerFlag side="right" />

            {/* Ball flight — inswinger from right corner to near post */}
            <BallFlight x1={315} y1={15} x2={230} y2={55} cx={280} cy={15} color={C.gold} />

            {/* Taker */}
            <PlayerDot x={318} y={18} label="T" type="attack" size={9} />

            {/* Zone highlight near post */}
            <ZoneHighlight x={210} y={35} width={50} height={45} color="rgba(241,196,15,0.15)" />

            {/* Attacking players */}
            <PlayerDot x={230} y={55} label={1} type="attack" size={10} />
            <PitchLabel x={230} y={43} text="Near Post Runner" color={C.textSec} size={7} />

            <PlayerDot x={120} y={75} label={2} type="attack" size={10} />
            <PitchLabel x={120} y={63} text="Far Post Target" color={C.textSec} size={7} />

            <PlayerDot x={170} y={90} label={3} type="attack" size={10} />
            <PitchLabel x={170} y={103} text="Pen Spot Lurker" color={C.textSec} size={7} />

            <PlayerDot x={145} y={65} label={4} type="attack" size={10} />
            <PitchLabel x={145} y={53} text="Blocker" color={C.textSec} size={7} />

            <PlayerDot x={200} y={140} label={5} type="attack" size={10} />
            <PitchLabel x={200} y={153} text="Edge of Box" color={C.textSec} size={7} />

            <PlayerDot x={80} y={160} label={6} type="attack" size={10} />
            <PitchLabel x={80} y={173} text="Back Post Cover" color={C.textSec} size={7} />

            {/* Movement arrows */}
            <MovementArrow x1={240} y1={80} x2={230} y2={59} dashed color={C.gold} />
            <MovementArrow x1={130} y1={100} x2={120} y2={79} dashed color={C.gold} />
            <MovementArrow x1={180} y1={115} x2={170} y2={94} dashed color={C.gold} />
            <MovementArrow x1={155} y1={90} x2={145} y2={69} dashed color={C.gold} />

            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
          </PitchSVG>
        </div>
        <div style={{ background: C.bg, borderRadius: 8, padding: 12, marginTop: 8 }}>
          <div style={{ color: C.textSec, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Notes</div>
          <div style={{ color: C.text, fontSize: 13 }}>Use when leading or drawing — avoid if chasing.</div>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Routine 2 — Far Post Overload */}
      <SectionCard title='Routine 2: "Far Post Overload"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 4px' }}>
          Outswinger from left corner — overload the far post with 3 runners.
        </p>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 4px' }}>
          Delivery: <Badge text="Outswinger" /> &nbsp; Taker: <strong style={{ color: C.text }}>O&apos;Brien</strong> (right foot)
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <CornerFlag side="left" />

            {/* Ball flight — outswinger from left corner to far post */}
            <BallFlight x1={25} y1={15} x2={260} y2={70} cx={140} cy={10} color={C.gold} />

            {/* Taker */}
            <PlayerDot x={22} y={18} label="T" type="attack" size={9} />

            {/* Zone highlight far post */}
            <ZoneHighlight x={235} y={45} width={55} height={50} color="rgba(241,196,15,0.15)" />

            {/* Far post attackers */}
            <PlayerDot x={260} y={70} label={1} type="attack" size={10} />
            <PlayerDot x={245} y={55} label={2} type="attack" size={10} />
            <PlayerDot x={250} y={85} label={3} type="attack" size={10} />

            {/* Penalty spot */}
            <PlayerDot x={170} y={90} label={4} type="attack" size={10} />

            {/* Decoy near post */}
            <PlayerDot x={120} y={50} label={5} type="attack" size={10} />
            <PitchLabel x={120} y={40} text="Decoy" color={C.textSec} size={7} />

            {/* Movement arrows */}
            <MovementArrow x1={250} y1={100} x2={260} y2={74} dashed color={C.gold} />
            <MovementArrow x1={235} y1={80} x2={245} y2={59} dashed color={C.gold} />
            <MovementArrow x1={240} y1={110} x2={250} y2={89} dashed color={C.gold} />

            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Routine 3 — Short Corner Pull-Out */}
      <SectionCard title='Routine 3: "Short Corner Pull-Out"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 4px' }}>
          Short pass to overlapping player, then second-phase delivery from byline.
        </p>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 4px' }}>
          Taker: <strong style={{ color: C.text }}>Santos</strong>
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <CornerFlag side="right" />

            {/* Taker at corner */}
            <PlayerDot x={318} y={18} label="T" type="attack" size={9} />

            {/* Short pass receiver */}
            <PlayerDot x={290} y={40} label={1} type="attack" size={10} />

            {/* Short pass */}
            <MovementArrow x1={316} y1={22} x2={295} y2={40} dashed={false} color={C.text} />

            {/* Receiver carries to byline */}
            <MovementArrow x1={290} y1={40} x2={280} y2={22} dashed color={C.gold} />

            {/* Second phase cross from byline */}
            <BallFlight x1={280} y1={22} x2={180} y2={70} cx={240} cy={20} color={C.gold} />

            {/* Attackers in box */}
            <PlayerDot x={180} y={70} label={2} type="attack" size={10} />
            <PlayerDot x={160} y={55} label={3} type="attack" size={10} />
            <PlayerDot x={200} y={90} label={4} type="attack" size={10} />

            <MovementArrow x1={190} y1={100} x2={180} y2={74} dashed color={C.gold} />
            <MovementArrow x1={170} y1={80} x2={160} y2={59} dashed color={C.gold} />

            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Routine 4 — The Dummy Decoy Overload */}
      <SectionCard title='Routine 4: "The Dummy Decoy Overload"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 4px' }}>
          Left foot inswinger from right corner. 3 decoy sprints converge near post — primary target peels off late to back post unmarked.
        </p>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 4px' }}>
          Delivery: <Badge text="Inswinger" /> &nbsp; Taker: <strong style={{ color: C.text }}>Martinez</strong> (left foot)
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <CornerFlag side="right" />

            {/* Ball flight — inswinger from right corner to back post */}
            <BallFlight x1={315} y1={15} x2={120} y2={65} cx={240} cy={10} color={C.gold} />

            {/* Taker */}
            <PlayerDot x={318} y={18} label="T" type="attack" size={9} />

            {/* 3 decoy runners converging near post */}
            <PlayerDot x={240} y={110} label={1} type="attack" size={9} />
            <MovementArrow x1={240} y1={108} x2={225} y2={55} dashed color={C.textSec} />
            <PitchLabel x={248} y={80} text="Decoy" color={C.textSec} size={7} />

            <PlayerDot x={210} y={120} label={2} type="attack" size={9} />
            <MovementArrow x1={210} y1={118} x2={220} y2={50} dashed color={C.textSec} />
            <PitchLabel x={200} y={95} text="Decoy" color={C.textSec} size={7} />

            <PlayerDot x={260} y={100} label={3} type="attack" size={9} />
            <MovementArrow x1={260} y1={98} x2={230} y2={48} dashed color={C.textSec} />
            <PitchLabel x={270} y={80} text="Decoy" color={C.textSec} size={7} />

            {/* Near post zone */}
            <ZoneHighlight x={210} y={35} width={40} height={35} color="rgba(148,163,184,0.15)" />

            {/* Primary target — peels off late to back post */}
            <PlayerDot x={180} y={120} label={4} type="attack" size={10} />
            <MovementArrow x1={180} y1={118} x2={120} y2={68} dashed color={C.gold} />
            <PitchLabel x={120} y={55} text="Back Post" color={C.gold} size={7} />

            {/* Zone highlight back post */}
            <ZoneHighlight x={100} y={50} width={45} height={35} color="rgba(241,196,15,0.15)" />

            {/* Penalty spot holder */}
            <PlayerDot x={170} y={90} label={5} type="attack" size={9} />
            <PitchLabel x={170} y={103} text="2nd Ball" color={C.textSec} size={7} />

            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
          </PitchSVG>
        </div>
        <div style={{ background: C.bg, borderRadius: 8, padding: 12, marginTop: 8 }}>
          <div style={{ color: C.textSec, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Notes</div>
          <div style={{ color: C.text, fontSize: 13 }}>Decoys must sell their runs convincingly. Primary target delays run by half a second.</div>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Routine 5 — Flick-On Chain */}
      <SectionCard title='Routine 5: "Flick-On Chain"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 4px' }}>
          Outswinger to near post flick-on specialist (shortest player). Flick directed to penalty spot runner. Back post safety option.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <CornerFlag side="right" />

            {/* Ball flight — outswinger to near post */}
            <BallFlight x1={315} y1={15} x2={230} y2={50} cx={290} cy={10} color={C.gold} />

            {/* Taker */}
            <PlayerDot x={318} y={18} label="T" type="attack" size={9} />

            {/* Near post flick-on specialist */}
            <PlayerDot x={230} y={50} label={1} type="attack" size={9} />
            <PitchLabel x={230} y={38} text="Flick" color={C.gold} size={7} />

            {/* Flick arrow to penalty spot */}
            <MovementArrow x1={228} y1={52} x2={170} y2={85} dashed={false} color={C.gold} />

            {/* Penalty spot runner arriving at pace */}
            <PlayerDot x={170} y={130} label={2} type="attack" size={10} />
            <MovementArrow x1={170} y1={128} x2={170} y2={89} dashed color={C.gold} />
            <PitchLabel x={170} y={143} text="Runner" color={C.gold} size={7} />

            {/* Back post safety */}
            <PlayerDot x={110} y={65} label={3} type="attack" size={9} />
            <PitchLabel x={110} y={53} text="Back Post" color={C.textSec} size={7} />
            <MovementArrow x1={228} y1={54} x2={115} y2={65} dashed color={C.textSec} />

            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Routine 6 — Blockers + Back Post Bullet */}
      <SectionCard title='Routine 6: "Blockers + Back Post Bullet"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 4px' }}>
          2 blockers screen opposition&apos;s best headers. Flat, driven delivery to back post at pace. One attacker sprints to back post, one holds 6 yards.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <CornerFlag side="right" />

            {/* Ball flight — flat driven to back post */}
            <BallFlight x1={315} y1={15} x2={110} y2={55} cx={220} cy={5} color={C.gold} />

            {/* Taker */}
            <PlayerDot x={318} y={18} label="T" type="attack" size={9} />

            {/* Blockers screening opposition */}
            <PlayerDot x={190} y={70} label="B1" type="attack" size={9} />
            <PlayerDot x={200} y={55} label="X" type="defend" size={8} />
            <MarkingLine x1={190} y1={70} x2={200} y2={55} color={C.primary} />

            <PlayerDot x={220} y={80} label="B2" type="attack" size={9} />
            <PlayerDot x={230} y={65} label="X" type="defend" size={8} />
            <MarkingLine x1={220} y1={80} x2={230} y2={65} color={C.primary} />

            <PitchLabel x={235} y={90} text="Blockers" color={C.primary} size={7} />

            {/* Back post attacker at full sprint */}
            <PlayerDot x={130} y={120} label={1} type="attack" size={10} />
            <MovementArrow x1={130} y1={118} x2={112} y2={59} dashed color={C.gold} />
            <PitchLabel x={110} y={43} text="Back Post" color={C.gold} size={7} />

            {/* 6-yard holder */}
            <PlayerDot x={170} y={45} label={2} type="attack" size={9} />
            <PitchLabel x={170} y={33} text="6yd" color={C.textSec} size={7} />

            {/* Back post zone */}
            <ZoneHighlight x={90} y={40} width={45} height={35} color="rgba(241,196,15,0.15)" />

            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Routine 7 — The Pull-Back Cross */}
      <SectionCard title='Routine 7: "The Pull-Back Cross"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 4px' }}>
          Short corner — taker passes to overlapping full back. Full back drives to byline and pulls back low.
          2 shooters arriving from outside the box.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <CornerFlag side="right" />

            {/* Taker at corner */}
            <PlayerDot x={318} y={18} label="T" type="attack" size={9} />

            {/* Phase 1: Short pass to full back */}
            <PlayerDot x={295} y={50} label="FB" type="attack" size={10} />
            <MovementArrow x1={316} y1={22} x2={298} y2={48} dashed={false} color={C.text} />
            <PitchLabel x={305} y={65} text="Phase 1" color={C.textSec} size={7} />

            {/* Phase 2: Full back drives to byline */}
            <MovementArrow x1={295} y1={48} x2={290} y2={18} dashed color={C.gold} />

            {/* Pull-back low cross */}
            <MovementArrow x1={290} y1={20} x2={200} y2={100} dashed={false} color={C.gold} />
            <PitchLabel x={260} y={55} text="Cutback" color={C.gold} size={7} />

            {/* Shooter 1 — 12 yards */}
            <PlayerDot x={200} y={140} label={1} type="attack" size={10} />
            <MovementArrow x1={200} y1={138} x2={200} y2={104} dashed color={C.gold} />
            <PitchLabel x={200} y={153} text="12yds" color={C.gold} size={7} />

            {/* Shooter 2 — edge of box */}
            <PlayerDot x={160} y={155} label={2} type="attack" size={10} />
            <MovementArrow x1={160} y1={153} x2={170} y2={120} dashed color={C.gold} />
            <PitchLabel x={145} y={165} text="Edge" color={C.gold} size={7} />

            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Routine 8 — Second Phase Press-On */}
      <SectionCard title='Routine 8: "Second Phase Press-On"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 4px' }}>
          Delivery to edge of box intentionally. 6 players positioned around the box edge to win second ball and shoot. No aerial threat — purely a second-ball routine.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <CornerFlag side="right" />

            {/* Ball flight — to edge of box */}
            <BallFlight x1={315} y1={15} x2={200} y2={130} cx={280} cy={60} color={C.gold} />

            {/* Taker */}
            <PlayerDot x={318} y={18} label="T" type="attack" size={9} />

            {/* Edge of box delivery zone */}
            <ZoneHighlight x={170} y={115} width={65} height={40} color="rgba(241,196,15,0.15)" />
            <PitchLabel x={200} y={112} text="Delivery" color={C.gold} size={7} />

            {/* 6 players in arc around box edge */}
            <PlayerDot x={100} y={140} label={1} type="attack" size={9} />
            <PlayerDot x={140} y={150} label={2} type="attack" size={9} />
            <PlayerDot x={180} y={155} label={3} type="attack" size={9} />
            <PlayerDot x={220} y={150} label={4} type="attack" size={9} />
            <PlayerDot x={255} y={140} label={5} type="attack" size={9} />
            <PlayerDot x={170} y={170} label={6} type="attack" size={9} />

            {/* Shooting zones */}
            <ZoneHighlight x={80} y={40} width={180} height={80} color="rgba(192,57,43,0.08)" />
            <PitchLabel x={170} y={185} text="Shoot Zone" color={C.primary} size={7} />

            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Corner Stats */}
      <SectionCard title="Attacking Corner Statistics">
        <StatGrid
          items={[
            ['Corners Taken', '47'],
            ['Goals Scored', '4 (8.5%)'],
            ['Shots Generated', '11'],
            ['Headed Clearances', '23'],
          ]}
        />
      </SectionCard>
    </>
  )
}

function CornersDefending() {
  return (
    <>
      {/* Setup 1 — Zonal Marking */}
      <SectionCard title='Setup 1: "Zonal Marking"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          4 defenders in a zonal line across the 6-yard box. 2 post players, 3 man-markers, 1 edge runner.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* Zonal rectangles across 6-yard box */}
            <ZoneHighlight x={120} y={30} width={50} height={25} color="rgba(192,57,43,0.2)" />
            <ZoneHighlight x={170} y={30} width={50} height={25} color="rgba(192,57,43,0.15)" />
            <ZoneHighlight x={220} y={30} width={50} height={25} color="rgba(192,57,43,0.2)" />
            <ZoneHighlight x={120} y={55} width={150} height={2} color="rgba(192,57,43,0.4)" />

            {/* Zonal line — 4 defenders */}
            <PlayerDot x={135} y={48} label="D1" type="defend" size={9} />
            <PlayerDot x={170} y={48} label="D2" type="defend" size={9} />
            <PlayerDot x={205} y={48} label="D3" type="defend" size={9} />
            <PlayerDot x={240} y={48} label="D4" type="defend" size={9} />

            {/* Post players */}
            <PlayerDot x={148} y={22} label="P1" type="defend" size={8} />
            <PitchLabel x={148} y={14} text="Near" color={C.textSec} size={7} />
            <PlayerDot x={192} y={22} label="P2" type="defend" size={8} />
            <PitchLabel x={192} y={14} text="Far" color={C.textSec} size={7} />

            {/* Man-markers */}
            <PlayerDot x={100} y={75} label="M1" type="defend" size={9} />
            <PlayerDot x={260} y={70} label="M2" type="defend" size={9} />
            <PlayerDot x={180} y={85} label="M3" type="defend" size={9} />

            {/* Edge runner */}
            <PlayerDot x={220} y={130} label="E" type="defend" size={9} />
            <PitchLabel x={220} y={143} text="Edge" color={C.textSec} size={7} />

            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Setup 2 — Man-to-Man */}
      <SectionCard title='Setup 2: "Man-to-Man"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Each defender paired with an opposing attacker. Marking lines show assignments.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* Attackers */}
            <PlayerDot x={150} y={60} label="A1" type="attack" size={8} />
            <PlayerDot x={190} y={75} label="A2" type="attack" size={8} />
            <PlayerDot x={230} y={55} label="A3" type="attack" size={8} />
            <PlayerDot x={130} y={90} label="A4" type="attack" size={8} />
            <PlayerDot x={210} y={95} label="A5" type="attack" size={8} />

            {/* Defenders marking */}
            <PlayerDot x={155} y={68} label="D1" type="defend" size={8} />
            <PlayerDot x={195} y={83} label="D2" type="defend" size={8} />
            <PlayerDot x={235} y={63} label="D3" type="defend" size={8} />
            <PlayerDot x={135} y={98} label="D4" type="defend" size={8} />
            <PlayerDot x={215} y={103} label="D5" type="defend" size={8} />

            {/* Marking lines */}
            <MarkingLine x1={155} y1={68} x2={150} y2={60} color={C.primary} />
            <MarkingLine x1={195} y1={83} x2={190} y2={75} color={C.primary} />
            <MarkingLine x1={235} y1={63} x2={230} y2={55} color={C.primary} />
            <MarkingLine x1={135} y1={98} x2={130} y2={90} color={C.primary} />
            <MarkingLine x1={215} y1={103} x2={210} y2={95} color={C.primary} />

            {/* Post players */}
            <PlayerDot x={148} y={22} label="P1" type="defend" size={8} />
            <PlayerDot x={192} y={22} label="P2" type="defend" size={8} />

            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Setup 3 — Hybrid (Recommended) */}
      <SectionCard title='Setup 3: "Hybrid"' onEdit={() => {}}>
        <div style={{ marginBottom: 8 }}>
          <Badge text="Recommended" color="#27AE60" />
        </div>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Zonal line in 6-yard box + man-markers on specific threats. Best of both systems.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* Zonal zone */}
            <ZoneHighlight x={130} y={30} width={100} height={25} color="rgba(192,57,43,0.15)" />

            {/* Zonal defenders (red) — in 6-yard box */}
            <PlayerDot x={145} y={45} label="Z1" type="defend" size={9} />
            <PlayerDot x={170} y={45} label="Z2" type="defend" size={9} />
            <PlayerDot x={195} y={45} label="Z3" type="defend" size={9} />

            {/* Man-markers (shown with gold outline for distinction) */}
            <PlayerDot x={120} y={75} label="M1" type="defend" size={9} />
            <PlayerDot x={240} y={65} label="M2" type="defend" size={9} />

            {/* Their attacker targets */}
            <PlayerDot x={115} y={68} label="A1" type="attack" size={7} />
            <PlayerDot x={245} y={58} label="A2" type="attack" size={7} />
            <MarkingLine x1={120} y1={75} x2={115} y2={68} color={C.gold} />
            <MarkingLine x1={240} y1={65} x2={245} y2={58} color={C.gold} />

            {/* Post players */}
            <PlayerDot x={148} y={22} label="P1" type="defend" size={8} />
            <PlayerDot x={192} y={22} label="P2" type="defend" size={8} />

            {/* Back 3 sweeper outside box */}
            <PlayerDot x={100} y={130} label="S1" type="defend" size={9} />
            <PlayerDot x={170} y={135} label="S2" type="defend" size={9} />
            <PlayerDot x={240} y={130} label="S3" type="defend" size={9} />
            <PitchLabel x={170} y={150} text="Sweeper line" color={C.textSec} size={7} />

            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
          </PitchSVG>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
          <div style={{ background: C.bg, borderRadius: 8, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: C.primary, display: 'inline-block' }} />
            <span style={{ color: C.textSec, fontSize: 12 }}>Zonal defenders</span>
          </div>
          <div style={{ background: C.bg, borderRadius: 8, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: C.gold, display: 'inline-block' }} />
            <span style={{ color: C.textSec, fontSize: 12 }}>Man-marking assignments</span>
          </div>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Setup 4 — Aggressive Front 2 Press */}
      <SectionCard title='Setup 4: "Aggressive Front 2 Press"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          2 players press the corner taker immediately on delivery. Remaining 9 set up zonal in the box.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <CornerFlag side="right" />

            {/* Corner taker (opposition) */}
            <PlayerDot x={318} y={18} label="A" type="attack" size={8} />

            {/* 2 press players rushing corner */}
            <PlayerDot x={280} y={60} label="P1" type="defend" size={9} />
            <MovementArrow x1={280} y1={58} x2={314} y2={22} dashed color={C.primary} />
            <PlayerDot x={295} y={45} label="P2" type="defend" size={9} />
            <MovementArrow x1={295} y1={43} x2={316} y2={20} dashed color={C.primary} />

            {/* 9 zonal in box */}
            <ZoneHighlight x={100} y={30} width={160} height={80} color="rgba(192,57,43,0.1)" />

            <PlayerDot x={120} y={45} label="D1" type="defend" size={8} />
            <PlayerDot x={150} y={45} label="D2" type="defend" size={8} />
            <PlayerDot x={180} y={45} label="D3" type="defend" size={8} />
            <PlayerDot x={210} y={45} label="D4" type="defend" size={8} />
            <PlayerDot x={240} y={45} label="D5" type="defend" size={8} />
            <PlayerDot x={135} y={75} label="D6" type="defend" size={8} />
            <PlayerDot x={170} y={75} label="D7" type="defend" size={8} />
            <PlayerDot x={205} y={75} label="D8" type="defend" size={8} />
            <PlayerDot x={170} y={105} label="D9" type="defend" size={8} />

            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Setup 5 — Back 5 Zonal Wall */}
      <SectionCard title='Setup 5: "Back 5 Zonal Wall"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          5 players in rigid zonal line across 6-yard box. 3 man-markers on identified aerial threats. 1 sweeper outside box. GK front post.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* 6-yard box zonal wall highlight */}
            <ZoneHighlight x={110} y={28} width={140} height={28} color="rgba(192,57,43,0.2)" />

            {/* 5-player zonal wall */}
            <PlayerDot x={125} y={42} label="Z1" type="defend" size={9} />
            <PlayerDot x={150} y={42} label="Z2" type="defend" size={9} />
            <PlayerDot x={175} y={42} label="Z3" type="defend" size={9} />
            <PlayerDot x={200} y={42} label="Z4" type="defend" size={9} />
            <PlayerDot x={225} y={42} label="Z5" type="defend" size={9} />

            {/* 3 man-markers on aerial threats */}
            <PlayerDot x={110} y={80} label="M1" type="defend" size={9} />
            <PlayerDot x={110} y={72} label="A1" type="attack" size={7} />
            <MarkingLine x1={110} y1={80} x2={110} y2={72} color={C.gold} />

            <PlayerDot x={240} y={70} label="M2" type="defend" size={9} />
            <PlayerDot x={245} y={62} label="A2" type="attack" size={7} />
            <MarkingLine x1={240} y1={70} x2={245} y2={62} color={C.gold} />

            <PlayerDot x={170} y={90} label="M3" type="defend" size={9} />
            <PlayerDot x={175} y={82} label="A3" type="attack" size={7} />
            <MarkingLine x1={170} y1={90} x2={175} y2={82} color={C.gold} />

            {/* Sweeper outside box */}
            <PlayerDot x={170} y={135} label="S" type="defend" size={9} />
            <PitchLabel x={170} y={148} text="Sweeper" color={C.textSec} size={7} />

            {/* GK front post */}
            <PlayerDot x={155} y={15} label="GK" type="gk" size={9} />
            <PitchLabel x={155} y={28} text="Front Post" color={C.textSec} size={7} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Setup 6 — Counter-Attack Corner Defence */}
      <SectionCard title='Setup 6: "Counter-Attack Corner Defence"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Pack box defensively but designate 2 fast forwards to stay high on halfway. On clearance: immediate long ball to 2 runners.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* Defensive shape in box */}
            <ZoneHighlight x={110} y={30} width={140} height={70} color="rgba(192,57,43,0.1)" />

            <PlayerDot x={130} y={45} label="D1" type="defend" size={8} />
            <PlayerDot x={160} y={45} label="D2" type="defend" size={8} />
            <PlayerDot x={190} y={45} label="D3" type="defend" size={8} />
            <PlayerDot x={220} y={45} label="D4" type="defend" size={8} />
            <PlayerDot x={145} y={70} label="D5" type="defend" size={8} />
            <PlayerDot x={175} y={70} label="D6" type="defend" size={8} />
            <PlayerDot x={205} y={70} label="D7" type="defend" size={8} />
            <PlayerDot x={170} y={100} label="D8" type="defend" size={8} />

            {/* 2 fast forwards staying high — near halfway line */}
            <PlayerDot x={100} y={240} label="F1" type="defend" size={10} />
            <PitchLabel x={100} y={228} text="Stay High" color={C.gold} size={7} />
            <MovementArrow x1={100} y1={238} x2={100} y2={200} dashed color={C.gold} />

            <PlayerDot x={240} y={240} label="F2" type="defend" size={10} />
            <PitchLabel x={240} y={228} text="Stay High" color={C.gold} size={7} />
            <MovementArrow x1={240} y1={238} x2={240} y2={200} dashed color={C.gold} />

            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Setup 7 — Near Post Trap */}
      <SectionCard title='Setup 7: "Near Post Trap"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Intentionally leave near post slightly open as a trap. Strongest header positioned just behind the near post zone to intercept.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <CornerFlag side="right" />

            {/* Deliberate gap at near post */}
            <ZoneHighlight x={215} y={25} width={40} height={35} color="rgba(241,196,15,0.2)" />
            <PitchLabel x={235} y={22} text="Trap Gap" color={C.gold} size={7} />

            {/* Interceptor positioned behind the gap */}
            <PlayerDot x={225} y={65} label="H" type="defend" size={10} />
            <PitchLabel x={225} y={78} text="Interceptor" color={C.primary} size={7} />
            <MovementArrow x1={225} y1={63} x2={230} y2={40} dashed color={C.primary} />

            {/* Other defenders in box */}
            <PlayerDot x={140} y={45} label="D1" type="defend" size={8} />
            <PlayerDot x={165} y={45} label="D2" type="defend" size={8} />
            <PlayerDot x={190} y={45} label="D3" type="defend" size={8} />
            <PlayerDot x={150} y={75} label="D4" type="defend" size={8} />
            <PlayerDot x={180} y={75} label="D5" type="defend" size={8} />
            <PlayerDot x={210} y={90} label="D6" type="defend" size={8} />
            <PlayerDot x={140} y={100} label="D7" type="defend" size={8} />
            <PlayerDot x={170} y={130} label="D8" type="defend" size={8} />

            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Setup 8 — Full Man-Mark Press */}
      <SectionCard title='Setup 8: "Full Man-Mark Press"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Every opposition player in the box is man-marked. No zonal element — GK takes full responsibility for crosses. 2 post players regardless.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* Opposition attackers + our man-markers paired */}
            <PlayerDot x={130} y={55} label="A1" type="attack" size={7} />
            <PlayerDot x={135} y={63} label="D1" type="defend" size={8} />
            <MarkingLine x1={135} y1={63} x2={130} y2={55} color={C.primary} />

            <PlayerDot x={170} y={60} label="A2" type="attack" size={7} />
            <PlayerDot x={175} y={68} label="D2" type="defend" size={8} />
            <MarkingLine x1={175} y1={68} x2={170} y2={60} color={C.primary} />

            <PlayerDot x={210} y={50} label="A3" type="attack" size={7} />
            <PlayerDot x={215} y={58} label="D3" type="defend" size={8} />
            <MarkingLine x1={215} y1={58} x2={210} y2={50} color={C.primary} />

            <PlayerDot x={240} y={70} label="A4" type="attack" size={7} />
            <PlayerDot x={245} y={78} label="D4" type="defend" size={8} />
            <MarkingLine x1={245} y1={78} x2={240} y2={70} color={C.primary} />

            <PlayerDot x={150} y={85} label="A5" type="attack" size={7} />
            <PlayerDot x={155} y={93} label="D5" type="defend" size={8} />
            <MarkingLine x1={155} y1={93} x2={150} y2={85} color={C.primary} />

            <PlayerDot x={200} y={90} label="A6" type="attack" size={7} />
            <PlayerDot x={205} y={98} label="D6" type="defend" size={8} />
            <MarkingLine x1={205} y1={98} x2={200} y2={90} color={C.primary} />

            <PlayerDot x={120} y={110} label="A7" type="attack" size={7} />
            <PlayerDot x={125} y={118} label="D7" type="defend" size={8} />
            <MarkingLine x1={125} y1={118} x2={120} y2={110} color={C.primary} />

            <PlayerDot x={250} y={105} label="A8" type="attack" size={7} />
            <PlayerDot x={255} y={113} label="D8" type="defend" size={8} />
            <MarkingLine x1={255} y1={113} x2={250} y2={105} color={C.primary} />

            {/* 2 post players */}
            <PlayerDot x={148} y={22} label="P1" type="defend" size={8} />
            <PlayerDot x={192} y={22} label="P2" type="defend" size={8} />

            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
          </PitchSVG>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
          <div style={{ background: C.bg, borderRadius: 8, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: C.primary, display: 'inline-block' }} />
            <span style={{ color: C.textSec, fontSize: 12 }}>Man-marking lines</span>
          </div>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Defensive Corner Stats */}
      <SectionCard title="Defensive Corner Statistics">
        <StatGrid
          items={[
            ['Corners Faced', '41'],
            ['Goals Conceded', '3 (7.3%)'],
            ['Clearances', '28'],
            ['Keeper Claims', '6'],
          ]}
        />
      </SectionCard>
    </>
  )
}

/* ============================================================
   TAB 2: FREE KICKS
   ============================================================ */

function FreeKicksTab() {
  const [sub, setSub] = useState<FKSub>('Attacking')

  return (
    <>
      <SubTabBar tabs={['Attacking', 'Defending'] as FKSub[]} active={sub} onChange={setSub} />

      {sub === 'Attacking' && <FKAttacking />}
      {sub === 'Defending' && <FKDefending />}
    </>
  )
}

function FKAttacking() {
  const [zone, setZone] = useState<FKAtkZone>('Zone A')

  return (
    <>
      <SubTabBar
        tabs={['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Indirect'] as FKAtkZone[]}
        active={zone}
        onChange={setZone}
      />

      {zone === 'Zone A' && <FKZoneA />}
      {zone === 'Zone B' && <FKZoneB />}
      {zone === 'Zone C' && <FKZoneC />}
      {zone === 'Zone D' && <FKZoneD />}
      {zone === 'Indirect' && <FKIndirect />}
    </>
  )
}

function FKZoneA() {
  return (
    <>
      <div style={{ color: C.textSec, fontSize: 12, marginBottom: 12, fontStyle: 'italic' }}>
        Zone A — Shooting Range (18-25 yards, central)
      </div>

      {/* Routine 1: Direct Shot — Top Corner */}
      <SectionCard title='Routine 1: "Direct Shot — Top Corner"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 4px' }}>
          Taker: <strong style={{ color: C.text }}>Davies</strong> (right foot). Direct strike curling over the wall.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />

            {/* Defensive wall */}
            <DefensiveWall x={170} y={100} count={4} />

            {/* Shooter */}
            <PlayerDot x={170} y={150} label="D" type="attack" size={10} />
            <PitchLabel x={170} y={165} text="Davies" color={C.gold} size={8} />

            {/* Dummy runners */}
            <PlayerDot x={140} y={148} label={1} type="attack" size={8} />
            <PitchLabel x={125} y={148} text="Dummy" color={C.textSec} size={7} />
            <PlayerDot x={200} y={148} label={2} type="attack" size={8} />
            <PitchLabel x={215} y={148} text="Dummy" color={C.textSec} size={7} />

            {/* Ball flight over wall curling */}
            <BallFlight x1={170} y1={148} x2={185} y2={18} cx={120} cy={65} color={C.gold} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Routine 2: Dummy + Drive Low */}
      <SectionCard title='Routine 2: "Dummy + Drive Low"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Player 1 dummies over the ball, Player 2 drives low under the wall jump.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
            <DefensiveWall x={170} y={100} count={4} />

            {/* Ball position */}
            <PlayerDot x={170} y={155} label="" type="ball" size={6} />

            {/* Dummy runner goes over ball */}
            <PlayerDot x={160} y={162} label={1} type="attack" size={9} />
            <MovementArrow x1={160} y1={160} x2={160} y2={130} dashed color={C.textSec} />
            <PitchLabel x={140} y={142} text="Dummy" color={C.textSec} size={7} />

            {/* Arriving shooter */}
            <PlayerDot x={195} y={170} label={2} type="attack" size={10} />
            <MovementArrow x1={195} y1={168} x2={174} y2={157} dashed color={C.gold} />
            <PitchLabel x={210} y={178} text="Drive low" color={C.gold} size={7} />

            {/* Shot — low under wall */}
            <BallFlight x1={174} y1={155} x2={160} y2={18} cx={165} cy={85} color={C.gold} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Routine 3: Layoff to Edge */}
      <SectionCard title='Routine 3: "Layoff to Edge"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Touch to side for arriving midfielder who strikes first time from edge of box.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
            <DefensiveWall x={170} y={100} count={4} />

            {/* Ball */}
            <PlayerDot x={170} y={155} label="" type="ball" size={6} />

            {/* Touch player */}
            <PlayerDot x={165} y={160} label={1} type="attack" size={9} />

            {/* Layoff pass to side */}
            <MovementArrow x1={170} y1={155} x2={230} y2={140} dashed={false} color={C.text} />

            {/* Arriving midfielder */}
            <PlayerDot x={250} y={160} label={2} type="attack" size={10} />
            <MovementArrow x1={250} y1={158} x2={232} y2={142} dashed color={C.gold} />
            <PitchLabel x={260} y={170} text="Strike" color={C.gold} size={7} />

            {/* Shot from edge */}
            <BallFlight x1={232} y1={140} x2={175} y2={18} cx={210} cy={70} color={C.gold} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Routine 4: The One-Two Wall Beater */}
      <SectionCard title='Routine 4: "The One-Two Wall Beater"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Player 1 taps sideways 3 yards to Player 2, who shoots first time as the wall is still jumping.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
            <DefensiveWall x={170} y={100} count={4} />

            {/* Ball */}
            <PlayerDot x={170} y={155} label="" type="ball" size={6} />

            {/* Player 1 taps sideways */}
            <PlayerDot x={165} y={160} label={1} type="attack" size={9} />
            <MovementArrow x1={170} y1={155} x2={200} y2={153} dashed={false} color={C.text} />

            {/* Player 2 shoots from new angle */}
            <PlayerDot x={205} y={160} label={2} type="attack" size={10} />
            <PitchLabel x={220} y={168} text="Shoot" color={C.gold} size={7} />

            {/* Shot past wall */}
            <BallFlight x1={202} y1={153} x2={160} y2={18} cx={170} cy={80} color={C.gold} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Routine 5: Triple Dummy — Real Shooter Arrives Late */}
      <SectionCard title='Routine 5: "Triple Dummy — Real Shooter Arrives Late"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          3 players stand over the ball and all dummy. 4th player runs in from 10 yards behind and strikes.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
            <DefensiveWall x={170} y={100} count={4} />

            {/* Ball */}
            <PlayerDot x={170} y={155} label="" type="ball" size={6} />

            {/* 3 dummies standing over ball */}
            <PlayerDot x={155} y={162} label={1} type="attack" size={8} />
            <PitchLabel x={135} y={162} text="Dummy" color={C.textSec} size={7} />
            <PlayerDot x={170} y={165} label={2} type="attack" size={8} />
            <PitchLabel x={170} y={178} text="Dummy" color={C.textSec} size={7} />
            <PlayerDot x={185} y={162} label={3} type="attack" size={8} />
            <PitchLabel x={205} y={162} text="Dummy" color={C.textSec} size={7} />

            {/* Late runner arriving from deep */}
            <PlayerDot x={170} y={220} label={4} type="attack" size={10} />
            <MovementArrow x1={170} y1={218} x2={170} y2={160} dashed color={C.gold} />
            <PitchLabel x={190} y={210} text="Late Runner" color={C.gold} size={7} />

            {/* Shot */}
            <BallFlight x1={170} y1={155} x2={180} y2={18} cx={130} cy={75} color={C.gold} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Routine 6: Low Driven Under the Wall */}
      <SectionCard title='Routine 6: "Low Driven Under the Wall"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Wall instructed to jump — ball driven hard and low beneath jumping feet.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />

            {/* Wall — shown jumping (higher position) */}
            <DefensiveWall x={170} y={95} count={4} />
            <PitchLabel x={170} y={85} text="Wall jumps" color={C.textSec} size={7} />

            {/* Shooter */}
            <PlayerDot x={170} y={155} label="S" type="attack" size={10} />

            {/* Low driven shot under wall */}
            <MovementArrow x1={170} y1={153} x2={170} y2={105} dashed={false} color={C.gold} />
            <MovementArrow x1={170} y1={100} x2={168} y2={20} dashed={false} color={C.gold} />
            <PitchLabel x={145} y={115} text="Under" color={C.gold} size={8} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Routine 7: Far Post Swerve */}
      <SectionCard title='Routine 7: "Far Post Swerve"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Right-footer from left side — natural outswinger swerves away from keeper towards far post. Tall player at far post to head in if needed.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
            <DefensiveWall x={150} y={100} count={4} />

            {/* Shooter — left of centre */}
            <PlayerDot x={130} y={155} label="S" type="attack" size={10} />
            <PitchLabel x={130} y={168} text="Right foot" color={C.gold} size={7} />

            {/* Swerve trajectory — curving to far post */}
            <BallFlight x1={130} y1={153} x2={200} y2={18} cx={90} cy={60} color={C.gold} />

            {/* Far post zone */}
            <ZoneHighlight x={185} y={10} width={40} height={25} color="rgba(241,196,15,0.15)" />
            <PitchLabel x={205} y={38} text="Far Post" color={C.gold} size={7} />

            {/* Tall player at far post */}
            <PlayerDot x={210} y={40} label="H" type="attack" size={9} />
            <PitchLabel x={225} y={48} text="Header" color={C.textSec} size={7} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Routine 8: Quick Free Kick — Catch Them Cold */}
      <SectionCard title='Routine 8: "Quick Free Kick — Catch Them Cold"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          No routine — just take it immediately before opposition set up. Condition: only when taker signals thumbs up. Pass into space behind disorganised defence.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />

            {/* No wall formed yet */}
            <PitchLabel x={170} y={105} text="No wall yet" color={C.textSec} size={8} />

            {/* Taker with ball */}
            <PlayerDot x={170} y={155} label="T" type="attack" size={10} />
            <PitchLabel x={190} y={160} text="Quick!" color={C.gold} size={8} />

            {/* Space behind defence */}
            <ZoneHighlight x={130} y={50} width={80} height={40} color="rgba(241,196,15,0.15)" />
            <PitchLabel x={170} y={48} text="Space" color={C.gold} size={8} />

            {/* Pass into space */}
            <MovementArrow x1={170} y1={153} x2={170} y2={65} dashed={false} color={C.gold} />

            {/* Runner */}
            <PlayerDot x={200} y={100} label={1} type="attack" size={9} />
            <MovementArrow x1={200} y1={98} x2={180} y2={65} dashed color={C.gold} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>
    </>
  )
}

function FKZoneB() {
  return (
    <>
      <div style={{ color: C.textSec, fontSize: 12, marginBottom: 12, fontStyle: 'italic' }}>
        Zone B — Wide Free Kick
      </div>

      {/* Inswinging */}
      <SectionCard title='Routine 1: "Inswinging Delivery"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Inswinging cross from wide free kick to near-post zone.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />

            {/* FK taker wide right */}
            <PlayerDot x={290} y={110} label="T" type="attack" size={9} />

            <BallFlight x1={288} y1={108} x2={180} y2={60} cx={250} cy={40} color={C.gold} />

            <PlayerDot x={180} y={58} label={1} type="attack" size={9} />
            <PlayerDot x={160} y={72} label={2} type="attack" size={9} />
            <PlayerDot x={200} y={80} label={3} type="attack" size={9} />
            <MovementArrow x1={190} y1={90} x2={180} y2={62} dashed color={C.gold} />
            <MovementArrow x1={170} y1={100} x2={160} y2={76} dashed color={C.gold} />

            <ZoneHighlight x={155} y={45} width={60} height={45} color="rgba(241,196,15,0.10)" />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Outswinging */}
      <SectionCard title='Routine 2: "Outswinging Delivery"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Outswinging cross from wide free kick to far-post zone.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />

            <PlayerDot x={50} y={110} label="T" type="attack" size={9} />

            <BallFlight x1={52} y1={108} x2={240} y2={60} cx={140} cy={30} color={C.gold} />

            <PlayerDot x={240} y={58} label={1} type="attack" size={9} />
            <PlayerDot x={220} y={72} label={2} type="attack" size={9} />
            <PlayerDot x={200} y={85} label={3} type="attack" size={9} />
            <MovementArrow x1={230} y1={90} x2={240} y2={62} dashed color={C.gold} />
            <MovementArrow x1={210} y1={100} x2={220} y2={76} dashed color={C.gold} />

            <ZoneHighlight x={210} y={45} width={55} height={45} color="rgba(241,196,15,0.10)" />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Low Driven Cutback */}
      <SectionCard title='Routine 3: "Low Driven Cutback"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Low driven ball cut back to edge of box for a first-time strike.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />

            <PlayerDot x={280} y={90} label="T" type="attack" size={9} />

            {/* Low driven ball */}
            <MovementArrow x1={278} y1={88} x2={200} y2={115} dashed={false} color={C.gold} />

            {/* Edge of box striker */}
            <PlayerDot x={200} y={120} label={1} type="attack" size={10} />
            <PitchLabel x={200} y={133} text="Strike" color={C.gold} size={7} />
            <MovementArrow x1={220} y1={140} x2={202} y2={124} dashed color={C.gold} />

            <BallFlight x1={200} y1={118} x2={170} y2={18} cx={180} cy={60} color={C.gold} />

            <PlayerDot x={170} y={70} label={2} type="attack" size={9} />
            <PlayerDot x={150} y={85} label={3} type="attack" size={9} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>
    </>
  )
}

function FKZoneC() {
  return (
    <>
      <div style={{ color: C.textSec, fontSize: 12, marginBottom: 12, fontStyle: 'italic' }}>
        Zone C — Deep Free Kick (30-35 yards)
      </div>

      {/* Chip to Back Post */}
      <SectionCard title='Routine 1: "Chip to Back Post"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Lofted delivery over the wall to the back post area for a header.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
            <DefensiveWall x={170} y={90} count={4} />

            <PlayerDot x={170} y={180} label="T" type="attack" size={9} />

            <BallFlight x1={170} y1={178} x2={120} y2={55} cx={80} cy={100} color={C.gold} />

            <PlayerDot x={120} y={55} label={1} type="attack" size={10} />
            <PitchLabel x={120} y={43} text="Back post" color={C.textSec} size={7} />
            <MovementArrow x1={135} y1={80} x2={122} y2={59} dashed color={C.gold} />

            <PlayerDot x={170} y={70} label={2} type="attack" size={9} />
            <ZoneHighlight x={100} y={40} width={45} height={35} color="rgba(241,196,15,0.12)" />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Driven Low */}
      <SectionCard title='Routine 2: "Driven Low"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Low driven ball into the box — aimed at runners attacking the near post area.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
            <DefensiveWall x={170} y={90} count={3} />

            <PlayerDot x={170} y={185} label="T" type="attack" size={9} />

            <MovementArrow x1={170} y1={183} x2={200} y2={65} dashed={false} color={C.gold} />

            <PlayerDot x={200} y={65} label={1} type="attack" size={10} />
            <PlayerDot x={180} y={80} label={2} type="attack" size={9} />
            <MovementArrow x1={210} y1={90} x2={202} y2={69} dashed color={C.gold} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>
    </>
  )
}

function FKZoneD() {
  return (
    <>
      <div style={{ color: C.textSec, fontSize: 12, marginBottom: 12, fontStyle: 'italic' }}>
        Zone D — Very Deep / Own Half
      </div>

      {/* Long ball to target man — full pitch */}
      <SectionCard title='Routine 1: "Long Ball to Target Man"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Long delivery from own half to target man in opposition box.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={500} halfPitch={false}>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />

            {/* FK taker in own half */}
            <PlayerDot x={170} y={340} label="T" type="attack" size={9} />
            <PitchLabel x={170} y={355} text="Taker" color={C.gold} size={8} />

            {/* Long ball flight */}
            <BallFlight x1={170} y1={338} x2={155} y2={70} cx={80} cy={180} color={C.gold} />

            {/* Target man */}
            <PlayerDot x={155} y={68} label={1} type="attack" size={10} />
            <PitchLabel x={155} y={55} text="Target" color={C.gold} size={8} />

            {/* Supporting runner */}
            <PlayerDot x={200} y={100} label={2} type="attack" size={9} />
            <MovementArrow x1={210} y1={130} x2={200} y2={104} dashed color={C.gold} />

            <ZoneHighlight x={130} y={50} width={60} height={50} color="rgba(241,196,15,0.10)" />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Short Build Up */}
      <SectionCard title='Routine 2: "Short Build Up"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Short pass from deep free kick to build out from the back.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={500} halfPitch={false}>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />

            {/* FK taker */}
            <PlayerDot x={170} y={360} label="T" type="attack" size={9} />

            {/* Short pass to CM */}
            <MovementArrow x1={170} y1={358} x2={220} y2={330} dashed={false} color={C.text} />
            <PlayerDot x={220} y={330} label={1} type="attack" size={9} />

            {/* CM passes forward */}
            <MovementArrow x1={220} y1={328} x2={250} y2={280} dashed color={C.gold} />
            <PlayerDot x={250} y={280} label={2} type="attack" size={9} />

            {/* Winger option wide */}
            <PlayerDot x={300} y={250} label={3} type="attack" size={9} />
            <MovementArrow x1={252} y1={278} x2={295} y2={252} dashed color={C.gold} />

            {/* CBs holding */}
            <PlayerDot x={120} y={380} label="CB" type="attack" size={8} />
            <PlayerDot x={220} y={380} label="CB" type="attack" size={8} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>
    </>
  )
}

function FKIndirect() {
  return (
    <>
      <div style={{ color: C.textSec, fontSize: 12, marginBottom: 12, fontStyle: 'italic' }}>
        Indirect Free Kicks
      </div>

      {/* Rolling Square — Shoot */}
      <SectionCard title='Routine 1: "Rolling Square — Shoot"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Short square pass then immediate shot. Requires two touches for indirect FK.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
            <DefensiveWall x={170} y={85} count={5} />

            {/* Ball */}
            <PlayerDot x={170} y={135} label="" type="ball" size={6} />

            {/* Player 1 rolls square */}
            <PlayerDot x={165} y={140} label={1} type="attack" size={9} />
            <MovementArrow x1={170} y1={135} x2={210} y2={133} dashed={false} color={C.text} />

            {/* Player 2 shoots */}
            <PlayerDot x={215} y={140} label={2} type="attack" size={10} />
            <MovementArrow x1={215} y1={138} x2={212} y2={135} dashed color={C.gold} />
            <BallFlight x1={212} y1={133} x2={175} y2={18} cx={200} cy={70} color={C.gold} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Dummy Run — Through Ball */}
      <SectionCard title='Routine 2: "Dummy Run — Through Ball"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Dummy runner over ball draws defenders; second player plays through ball.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />

            {/* Ball */}
            <PlayerDot x={170} y={140} label="" type="ball" size={6} />

            {/* Dummy runner */}
            <PlayerDot x={160} y={148} label={1} type="attack" size={9} />
            <MovementArrow x1={160} y1={146} x2={150} y2={100} dashed color={C.textSec} />
            <PitchLabel x={135} y={115} text="Dummy" color={C.textSec} size={7} />

            {/* Touch player */}
            <PlayerDot x={185} y={148} label={2} type="attack" size={9} />
            <MovementArrow x1={185} y1={146} x2={174} y2={142} dashed color={C.gold} />

            {/* Through ball */}
            <MovementArrow x1={174} y1={140} x2={200} y2={60} dashed={false} color={C.gold} />

            {/* Runner */}
            <PlayerDot x={200} y={95} label={3} type="attack" size={10} />
            <MovementArrow x1={210} y1={110} x2={202} y2={65} dashed color={C.gold} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>
    </>
  )
}

function FKDefending() {
  return (
    <>
      {/* Central 20-22yds: 4-man wall */}
      <SectionCard title="Central Free Kick (20-22 yds) — 4-Man Wall" onEdit={() => {}}>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={175} y={15} label="GK" type="gk" size={10} />

            <DefensiveWall x={170} y={100} count={4} />
            <PitchLabel x={170} y={118} text="Wall (4)" color={C.textSec} />

            <PlayerDot x={170} y={155} label="" type="ball" size={7} />

            {/* Cover player behind wall */}
            <PlayerDot x={240} y={95} label="6" type="defend" size={9} />
            <PitchLabel x={240} y={83} text="Cover" color={C.textSec} size={7} />

            <PlayerDot x={100} y={80} label="4" type="defend" size={9} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Wide 18-25yds: 3-man wall */}
      <SectionCard title="Wide Free Kick (18-25 yds) — 3-Man Wall" onEdit={() => {}}>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={175} y={15} label="GK" type="gk" size={10} />

            <DefensiveWall x={220} y={95} count={3} />
            <PitchLabel x={220} y={113} text="Wall (3)" color={C.textSec} />

            <PlayerDot x={270} y={130} label="" type="ball" size={7} />

            <PlayerDot x={150} y={75} label="4" type="defend" size={9} />
            <PlayerDot x={120} y={90} label="5" type="defend" size={9} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Wall instructions checklist */}
      <SectionCard title="Wall Instructions" onEdit={() => {}}>
        {[
          { text: 'Jump on shot', checked: true },
          { text: 'No wall split unless indirect', checked: true },
          { text: 'Tallest player on GK side of wall', checked: true },
          { text: 'Designated wall leader calls organization', checked: true },
          { text: 'Cover runner stationed behind wall', checked: true },
          { text: 'Edge players collapse inward on whistle', checked: false },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 0',
              borderBottom: i < 5 ? `1px solid ${C.border}` : 'none',
            }}
          >
            <span style={{ color: item.checked ? '#27AE60' : C.textSec, fontSize: 16 }}>
              {item.checked ? '\u2713' : '\u2610'}
            </span>
            <span style={{ color: C.text, fontSize: 13 }}>{item.text}</span>
          </div>
        ))}
        <CoachAttribution />
      </SectionCard>

      {/* Setup 4: Floating Wall + Zonal Box */}
      <SectionCard title='Setup 4: "Floating Wall + Zonal Box"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Wall is set slightly off-line to cover near post curl. Box behind wall set up zonally. GK covers far post.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={185} y={15} label="GK" type="gk" size={10} />
            <PitchLabel x={200} y={25} text="Far Post" color={C.textSec} size={7} />

            {/* Wall offset from direct line */}
            <DefensiveWall x={155} y={100} count={4} />
            <PitchLabel x={155} y={118} text="Offset Wall" color={C.textSec} size={7} />

            {/* Ball */}
            <PlayerDot x={170} y={155} label="" type="ball" size={7} />

            {/* Zonal coverage behind wall */}
            <ZoneHighlight x={100} y={55} width={150} height={40} color="rgba(192,57,43,0.12)" />
            <PlayerDot x={120} y={72} label="Z1" type="defend" size={8} />
            <PlayerDot x={160} y={72} label="Z2" type="defend" size={8} />
            <PlayerDot x={200} y={72} label="Z3" type="defend" size={8} />
            <PlayerDot x={230} y={72} label="Z4" type="defend" size={8} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Setup 5: 5-Man Wall for Power Shooters */}
      <SectionCard title='Setup 5: "5-Man Wall for Power Shooters"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Against known power free kick specialists use 5-man wall. Remaining 6 pack box tightly.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={175} y={15} label="GK" type="gk" size={10} />

            {/* 5-man wall */}
            <DefensiveWall x={170} y={100} count={5} />
            <PitchLabel x={170} y={118} text="Wall (5)" color={C.textSec} />

            {/* Ball */}
            <PlayerDot x={170} y={155} label="" type="ball" size={7} />

            {/* 6 defenders packed in box */}
            <ZoneHighlight x={100} y={40} width={150} height={50} color="rgba(192,57,43,0.1)" />
            <PlayerDot x={115} y={55} label="D1" type="defend" size={8} />
            <PlayerDot x={145} y={55} label="D2" type="defend" size={8} />
            <PlayerDot x={195} y={55} label="D3" type="defend" size={8} />
            <PlayerDot x={225} y={55} label="D4" type="defend" size={8} />
            <PlayerDot x={155} y={75} label="D5" type="defend" size={8} />
            <PlayerDot x={195} y={75} label="D6" type="defend" size={8} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Setup 6: Wall Runner — Block Layoff */}
      <SectionCard title='Setup 6: "Wall Runner — Block Layoff"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          1 player positioned at wall end sprints towards anticipated layoff target on delivery.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={175} y={15} label="GK" type="gk" size={10} />

            <DefensiveWall x={170} y={100} count={4} />

            {/* Ball */}
            <PlayerDot x={170} y={155} label="" type="ball" size={7} />

            {/* Wall runner at end of wall */}
            <PlayerDot x={210} y={100} label="WR" type="defend" size={9} />
            <MovementArrow x1={212} y1={100} x2={250} y2={140} dashed color={C.primary} />
            <PitchLabel x={255} y={148} text="Block Layoff" color={C.primary} size={7} />

            {/* Layoff zone */}
            <ZoneHighlight x={230} y={125} width={50} height={35} color="rgba(192,57,43,0.15)" />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Setup 7: GK Near Post Positioning */}
      <SectionCard title='Setup 7: "GK Near Post Positioning"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          GK positioned very narrow — near post covered by GK. Wall covers far post channel instead (reverses traditional setup).
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* GK positioned near post */}
            <PlayerDot x={155} y={15} label="GK" type="gk" size={10} />
            <PitchLabel x={155} y={28} text="Near Post" color={C.gold} size={7} />

            {/* Wall angled to far post */}
            <DefensiveWall x={195} y={100} count={4} />
            <PitchLabel x={195} y={118} text="Far Post Wall" color={C.textSec} />

            {/* Ball */}
            <PlayerDot x={170} y={155} label="" type="ball" size={7} />

            {/* Cover defenders */}
            <PlayerDot x={120} y={75} label="D1" type="defend" size={8} />
            <PlayerDot x={250} y={80} label="D2" type="defend" size={8} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Setup 8: Drop Deep + Sprint Line */}
      <SectionCard title='Setup 8: "Drop Deep + Sprint Line"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          All defenders drop 2 yards deeper than normal. Sprint line to ball on delivery — more aggressive press forward.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={175} y={15} label="GK" type="gk" size={10} />

            <DefensiveWall x={170} y={100} count={4} />

            {/* Ball */}
            <PlayerDot x={170} y={155} label="" type="ball" size={7} />

            {/* Defenders in deeper starting positions */}
            <PlayerDot x={110} y={85} label="D1" type="defend" size={8} />
            <PlayerDot x={150} y={80} label="D2" type="defend" size={8} />
            <PlayerDot x={200} y={80} label="D3" type="defend" size={8} />
            <PlayerDot x={240} y={85} label="D4" type="defend" size={8} />

            <PitchLabel x={100} y={95} text="Deep start" color={C.textSec} size={7} />

            {/* Sprint arrows forward */}
            <MovementArrow x1={110} y1={83} x2={110} y2={55} dashed color={C.primary} />
            <MovementArrow x1={150} y1={78} x2={150} y2={50} dashed color={C.primary} />
            <MovementArrow x1={200} y1={78} x2={200} y2={50} dashed color={C.primary} />
            <MovementArrow x1={240} y1={83} x2={240} y2={55} dashed color={C.primary} />

            <PitchLabel x={170} y={45} text="Sprint Line" color={C.primary} size={8} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>
    </>
  )
}

/* ============================================================
   TAB 3: THROW-INS
   ============================================================ */

function ThrowInsTab() {
  const [zone, setZone] = useState<ThrowZone>('Attacking Third')

  return (
    <>
      <SubTabBar
        tabs={['Attacking Third', 'Middle Third', 'Defensive Third'] as ThrowZone[]}
        active={zone}
        onChange={setZone}
      />

      {zone === 'Attacking Third' && <ThrowAttacking />}
      {zone === 'Middle Third' && <ThrowMiddle />}
      {zone === 'Defensive Third' && <ThrowDefensive />}

      {/* Long Throw Specialist Panel */}
      <SectionCard title="Long Throw Specialist" onEdit={() => {}}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          <div>
            <div style={{ color: C.text, fontSize: 15, fontWeight: 600 }}>Collins, Jamie</div>
            <div style={{ color: C.textSec, fontSize: 13 }}>Throw distance: 35m (estimated)</div>
            <Badge text="Long Throw Specialist" color={C.gold} />
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />

            {/* Thrower */}
            <PlayerDot x={20} y={100} label="C" type="attack" size={10} />
            <PitchLabel x={35} y={115} text="Collins" color={C.gold} size={7} />

            {/* Throw trajectory */}
            <BallFlight x1={25} y1={98} x2={180} y2={60} cx={100} cy={40} color={C.gold} />

            {/* Near post attacker */}
            <PlayerDot x={180} y={58} label={1} type="attack" size={9} />
            <PitchLabel x={180} y={46} text="Near" color={C.textSec} size={7} />
            <MovementArrow x1={185} y1={80} x2={181} y2={62} dashed color={C.gold} />

            {/* Far post attacker */}
            <PlayerDot x={140} y={70} label={2} type="attack" size={9} />
            <PitchLabel x={140} y={58} text="Far" color={C.textSec} size={7} />
            <MovementArrow x1={135} y1={95} x2={139} y2={74} dashed color={C.gold} />

            {/* Penalty spot lurker */}
            <PlayerDot x={170} y={85} label={3} type="attack" size={9} />

            <ZoneHighlight x={130} y={40} width={80} height={55} color="rgba(241,196,15,0.10)" />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>
    </>
  )
}

function ThrowAttacking() {
  return (
    <>
      {/* Routine 1: Lay-off + Turn */}
      <SectionCard title='Routine 1: "Lay-off + Turn"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Throw to feet, receiver lays off, third man turns into space.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />

            {/* Thrower on touchline */}
            <ThrowInMarker x={320} y={100} side="left" />

            {/* Short target */}
            <PlayerDot x={280} y={85} label={1} type="attack" size={9} />
            <MovementArrow x1={315} y1={98} x2={285} y2={87} dashed={false} color={C.text} />

            {/* Lay off */}
            <MovementArrow x1={278} y1={83} x2={255} y2={90} dashed color={C.gold} />

            {/* Third man turns */}
            <PlayerDot x={255} y={95} label={2} type="attack" size={10} />
            <MovementArrow x1={253} y1={93} x2={230} y2={65} dashed color={C.gold} />
            <PitchLabel x={225} y={58} text="Turn" color={C.gold} size={7} />

            <PlayerDot x={200} y={70} label={3} type="attack" size={9} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Routine 2: Long Throw to Back Post */}
      <SectionCard title='Routine 2: "Long Throw to Back Post"' onEdit={() => {}}>
        <div style={{ marginBottom: 8 }}>
          <Badge text="Long Throw Specialist" color={C.gold} />
        </div>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Long throw directly into the box, targeting back post.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />

            {/* Thrower */}
            <PlayerDot x={320} y={70} label="C" type="attack" size={10} />
            <PitchLabel x={308} y={85} text="Collins" color={C.gold} size={7} />

            <BallFlight x1={315} y1={68} x2={140} y2={60} cx={230} cy={25} color={C.gold} />

            <PlayerDot x={140} y={58} label={1} type="attack" size={9} />
            <PlayerDot x={170} y={70} label={2} type="attack" size={9} />
            <PlayerDot x={200} y={55} label={3} type="attack" size={9} />

            <MovementArrow x1={150} y1={85} x2={142} y2={62} dashed color={C.gold} />
            <MovementArrow x1={180} y1={95} x2={172} y2={74} dashed color={C.gold} />

            <ZoneHighlight x={120} y={40} width={50} height={40} color="rgba(241,196,15,0.12)" />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Routine 3: Third Man Run */}
      <SectionCard title='Routine 3: "Third Man Run"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Quick throw to a decoy, who flicks on for a third man running in behind.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />

            <ThrowInMarker x={320} y={90} side="left" />

            {/* Decoy receives */}
            <PlayerDot x={280} y={80} label={1} type="attack" size={9} />

            {/* Flick on */}
            <MovementArrow x1={278} y1={78} x2={260} y2={55} dashed={false} color={C.text} />

            {/* Third man running */}
            <PlayerDot x={270} y={110} label={2} type="attack" size={10} />
            <MovementArrow x1={268} y1={108} x2={258} y2={58} dashed color={C.gold} />
            <PitchLabel x={248} y={50} text="3rd man" color={C.gold} size={7} />

            <PlayerDot x={200} y={75} label={3} type="attack" size={9} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Routine 4: Flick-On Header Into Box */}
      <SectionCard title='Routine 4: "Flick-On Header Into Box"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Throw to tall player at edge of box, headed flick-on over defenders into 6-yard box. Runner anticipates and attacks the flick.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />

            {/* Thrower on touchline */}
            <ThrowInMarker x={320} y={90} side="left" />

            {/* Throw to tall player */}
            <MovementArrow x1={315} y1={88} x2={260} y2={75} dashed={false} color={C.text} />

            {/* Tall player — flick header */}
            <PlayerDot x={260} y={75} label={1} type="attack" size={10} />
            <PitchLabel x={260} y={63} text="Flick" color={C.gold} size={7} />

            {/* Header flick arc into 6-yard box */}
            <BallFlight x1={258} y1={73} x2={195} y2={45} cx={230} cy={40} color={C.gold} />

            {/* Runner attacking the flick */}
            <PlayerDot x={220} y={100} label={2} type="attack" size={10} />
            <MovementArrow x1={220} y1={98} x2={197} y2={49} dashed color={C.gold} />
            <PitchLabel x={197} y={35} text="6-yd box" color={C.gold} size={7} />

            <ZoneHighlight x={175} y={30} width={45} height={30} color="rgba(241,196,15,0.12)" />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Routine 5: Dummy Run — Peel Off */}
      <SectionCard title='Routine 5: "Dummy Run — Peel Off"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          First player makes run and shouts for ball as decoy. Second player peels off in opposite direction and receives in space.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />

            {/* Thrower */}
            <ThrowInMarker x={320} y={100} side="left" />

            {/* Decoy run — towards thrower */}
            <PlayerDot x={270} y={90} label={1} type="attack" size={9} />
            <MovementArrow x1={270} y1={88} x2={300} y2={80} dashed color={C.textSec} />
            <PitchLabel x={285} y={72} text="Decoy" color={C.textSec} size={7} />

            {/* Real receiver peeling away */}
            <PlayerDot x={260} y={110} label={2} type="attack" size={10} />
            <MovementArrow x1={258} y1={108} x2={220} y2={75} dashed color={C.gold} />
            <PitchLabel x={215} y={65} text="Peel Off" color={C.gold} size={7} />

            {/* Throw goes to second player */}
            <MovementArrow x1={315} y1={98} x2={225} y2={78} dashed={false} color={C.gold} />

            <PlayerDot x={200} y={80} label={3} type="attack" size={9} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Routine 6: Third Man — Overlap */}
      <SectionCard title='Routine 6: "Third Man — Overlap"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Short throw to feet, immediate lay-off, third player overlaps wide and receives for cross.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />

            {/* Thrower */}
            <ThrowInMarker x={320} y={100} side="left" />

            {/* Short throw to feet */}
            <PlayerDot x={280} y={90} label={1} type="attack" size={9} />
            <MovementArrow x1={315} y1={98} x2={285} y2={92} dashed={false} color={C.text} />

            {/* Lay-off to second player */}
            <PlayerDot x={260} y={115} label={2} type="attack" size={9} />
            <MovementArrow x1={278} y1={92} x2={264} y2={113} dashed color={C.gold} />

            {/* Third player overlaps wide */}
            <PlayerDot x={300} y={120} label={3} type="attack" size={10} />
            <MovementArrow x1={300} y1={118} x2={295} y2={55} dashed color={C.gold} />
            <PitchLabel x={305} y={50} text="Overlap" color={C.gold} size={7} />

            {/* Pass to overlapping runner */}
            <MovementArrow x1={262} y1={113} x2={293} y2={60} dashed={false} color={C.gold} />

            {/* Cross from wide */}
            <BallFlight x1={293} y1={58} x2={180} y2={55} cx={240} cy={30} color={C.gold} />

            <PlayerDot x={180} y={60} label={4} type="attack" size={9} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Routine 7: Reverse Throw */}
      <SectionCard title='Routine 7: "Reverse Throw"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Player shapes to throw up the line, reverses and throws inside to playmaker.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />

            {/* Thrower — body shape facing up the line */}
            <ThrowInMarker x={320} y={100} side="left" />

            {/* Fake direction arrow (up the line) */}
            <MovementArrow x1={315} y1={98} x2={305} y2={55} dashed color={C.textSec} />
            <PitchLabel x={298} y={48} text="Fake" color={C.textSec} size={7} />

            {/* Real throw — opposite direction, inside */}
            <MovementArrow x1={315} y1={100} x2={240} y2={115} dashed={false} color={C.gold} />
            <PitchLabel x={250} y={128} text="Reverse!" color={C.gold} size={7} />

            {/* Playmaker receiving */}
            <PlayerDot x={240} y={115} label="PM" type="attack" size={10} />

            <PlayerDot x={200} y={80} label={1} type="attack" size={9} />
            <PlayerDot x={260} y={70} label={2} type="attack" size={9} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Routine 8: Long Throw — Second Phase */}
      <SectionCard title='Routine 8: "Long Throw — Second Phase"' onEdit={() => {}}>
        <div style={{ marginBottom: 8 }}>
          <Badge text="Long Throw Specialist" color={C.gold} />
        </div>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Long throw into box headed clear, 3 players immediately press the clearance zone.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />

            {/* Thrower — long throw */}
            <PlayerDot x={320} y={70} label="C" type="attack" size={10} />
            <PitchLabel x={308} y={85} text="Collins" color={C.gold} size={7} />

            {/* Long throw arc into box */}
            <BallFlight x1={315} y1={68} x2={190} y2={55} cx={260} cy={25} color={C.gold} />

            {/* Clearance zone */}
            <ZoneHighlight x={150} y={100} width={80} height={50} color="rgba(192,57,43,0.15)" />
            <PitchLabel x={190} y={98} text="Clearance Zone" color={C.primary} size={7} />

            {/* 3 pressing players */}
            <PlayerDot x={140} y={160} label={1} type="attack" size={9} />
            <MovementArrow x1={140} y1={158} x2={160} y2={125} dashed color={C.gold} />

            <PlayerDot x={190} y={165} label={2} type="attack" size={9} />
            <MovementArrow x1={190} y1={163} x2={190} y2={130} dashed color={C.gold} />

            <PlayerDot x={240} y={160} label={3} type="attack" size={9} />
            <MovementArrow x1={240} y1={158} x2={220} y2={125} dashed color={C.gold} />

            <PitchLabel x={190} y={155} text="Press" color={C.gold} size={8} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>
    </>
  )
}

function ThrowMiddle() {
  return (
    <>
      {/* Routine 1 */}
      <SectionCard title='Routine 1: "Back to Feet — Switch"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Throw to midfielder who switches play to far side.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />

            <ThrowInMarker x={20} y={150} side="right" />

            <PlayerDot x={80} y={140} label={1} type="attack" size={9} />
            <MovementArrow x1={30} y1={148} x2={75} y2={142} dashed={false} color={C.text} />

            {/* Switch pass */}
            <MovementArrow x1={82} y1={138} x2={270} y2={120} dashed color={C.gold} />
            <PitchLabel x={170} y={118} text="Switch" color={C.gold} size={8} />

            <PlayerDot x={270} y={120} label={2} type="attack" size={9} />
            <PlayerDot x={200} y={100} label={3} type="attack" size={9} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Routine 2 */}
      <SectionCard title='Routine 2: "Forward Diagonal"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Quick throw forward along the line, diagonal run into channel.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />

            <ThrowInMarker x={20} y={140} side="right" />

            {/* Short throw forward */}
            <PlayerDot x={60} y={120} label={1} type="attack" size={9} />
            <MovementArrow x1={25} y1={138} x2={55} y2={122} dashed={false} color={C.text} />

            {/* Diagonal runner */}
            <PlayerDot x={100} y={130} label={2} type="attack" size={10} />
            <MovementArrow x1={100} y1={128} x2={130} y2={80} dashed color={C.gold} />
            <PitchLabel x={140} y={78} text="Channel" color={C.gold} size={7} />

            {/* Pass into channel */}
            <MovementArrow x1={62} y1={118} x2={125} y2={82} dashed={false} color={C.gold} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>
    </>
  )
}

function ThrowDefensive() {
  return (
    <>
      {/* Routine 1 */}
      <SectionCard title='Routine 1: "Safe Retention — CB Switch"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Short throw to centre-back who switches play to the far side.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={500} halfPitch={false}>
            <PlayerDot x={170} y={480} label="GK" type="gk" size={9} />

            {/* Thrower */}
            <PlayerDot x={20} y={370} label="T" type="attack" size={9} />
            <PitchLabel x={35} y={385} text="Thrower" color={C.gold} size={7} />

            {/* CB receives */}
            <PlayerDot x={100} y={380} label="CB" type="attack" size={9} />
            <MovementArrow x1={25} y1={370} x2={95} y2={378} dashed={false} color={C.text} />

            {/* Switch pass */}
            <PlayerDot x={270} y={360} label="RB" type="attack" size={9} />
            <MovementArrow x1={105} y1={378} x2={265} y2={362} dashed color={C.gold} />
            <PitchLabel x={180} y={355} text="Switch" color={C.gold} size={8} />

            <PlayerDot x={140} y={340} label="CM" type="attack" size={9} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Routine 2 */}
      <SectionCard title='Routine 2: "GK Reset"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Under pressure, throw back to GK to reset and build again.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={500} halfPitch={false}>
            <PlayerDot x={170} y={480} label="GK" type="gk" size={9} />

            {/* Thrower */}
            <PlayerDot x={20} y={400} label="T" type="attack" size={9} />

            {/* Back to CB */}
            <PlayerDot x={100} y={420} label="CB" type="attack" size={9} />
            <MovementArrow x1={25} y1={400} x2={95} y2={418} dashed={false} color={C.text} />

            {/* CB to GK */}
            <MovementArrow x1={100} y1={422} x2={168} y2={478} dashed color={C.gold} />
            <PitchLabel x={140} y={460} text="Reset" color={C.gold} size={8} />

            {/* GK distribution options */}
            <PlayerDot x={260} y={400} label="RB" type="attack" size={9} />
            <MovementArrow x1={172} y1={478} x2={255} y2={402} dashed color={C.textSec} />

            <PlayerDot x={170} y={350} label="CM" type="attack" size={9} />
            <MovementArrow x1={170} y1={478} x2={170} y2={355} dashed color={C.textSec} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Routine 4: Triangle Escape */}
      <SectionCard title='Routine 4: "Triangle Escape"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          3-man triangle — throw to nearest man, immediate third-man pass out wide.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={500} halfPitch={false}>
            <PlayerDot x={170} y={480} label="GK" type="gk" size={9} />

            {/* Thrower */}
            <PlayerDot x={20} y={380} label="T" type="attack" size={9} />
            <PitchLabel x={35} y={395} text="Thrower" color={C.gold} size={7} />

            {/* Triangle player 1 — nearest */}
            <PlayerDot x={80} y={370} label={1} type="attack" size={9} />
            <MovementArrow x1={25} y1={380} x2={75} y2={372} dashed={false} color={C.text} />

            {/* Triangle player 2 — third man */}
            <PlayerDot x={120} y={400} label={2} type="attack" size={9} />
            <MovementArrow x1={82} y1={372} x2={118} y2={398} dashed color={C.gold} />

            {/* Pass out wide */}
            <PlayerDot x={40} y={340} label={3} type="attack" size={9} />
            <MovementArrow x1={118} y1={398} x2={45} y2={342} dashed color={C.gold} />
            <PitchLabel x={55} y={332} text="Wide" color={C.gold} size={7} />

            {/* Triangle zone */}
            <ZoneHighlight x={30} y={355} width={110} height={55} color="rgba(241,196,15,0.08)" />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Routine 5: Switch Under Pressure */}
      <SectionCard title='Routine 5: "Switch Under Pressure"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          If pressed on nearside — throw long to opposite full back to switch play.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={500} halfPitch={false}>
            <PlayerDot x={170} y={480} label="GK" type="gk" size={9} />

            {/* Thrower on left */}
            <PlayerDot x={20} y={380} label="T" type="attack" size={9} />

            {/* Long switch arrow across pitch */}
            <MovementArrow x1={25} y1={378} x2={300} y2={365} dashed={false} color={C.gold} />
            <PitchLabel x={170} y={358} text="Long Switch" color={C.gold} size={8} />

            {/* Opposite full back */}
            <PlayerDot x={305} y={365} label="RB" type="attack" size={10} />
            <PitchLabel x={290} y={355} text="Receives" color={C.gold} size={7} />

            {/* Press indicators on nearside */}
            <PlayerDot x={60} y={375} label="X" type="defend" size={7} />
            <PlayerDot x={80} y={390} label="X" type="defend" size={7} />
            <PitchLabel x={70} y={405} text="Press" color={C.primary} size={7} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Routine 6: GK Short — Reset */}
      <SectionCard title='Routine 6: "GK Short — Reset"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Throw back to GK to reset and play out from back calmly.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={500} halfPitch={false}>
            <PlayerDot x={170} y={480} label="GK" type="gk" size={9} />

            {/* Thrower */}
            <PlayerDot x={20} y={400} label="T" type="attack" size={9} />

            {/* Back pass to GK */}
            <MovementArrow x1={25} y1={402} x2={165} y2={478} dashed={false} color={C.text} />
            <PitchLabel x={95} y={445} text="Back to GK" color={C.gold} size={7} />

            {/* Build out arrows from GK */}
            <PlayerDot x={80} y={430} label="CB" type="attack" size={9} />
            <MovementArrow x1={168} y1={478} x2={85} y2={432} dashed color={C.gold} />

            <PlayerDot x={260} y={430} label="CB" type="attack" size={9} />
            <MovementArrow x1={172} y1={478} x2={255} y2={432} dashed color={C.gold} />

            <PlayerDot x={170} y={380} label="CM" type="attack" size={9} />
            <MovementArrow x1={170} y1={478} x2={170} y2={385} dashed color={C.gold} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Routine 7: Lay-Off — Keeper to Feet */}
      <SectionCard title='Routine 7: "Lay-Off — Keeper to Feet"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Short throw to CB, CB lays back to keeper&apos;s feet, keeper distributes long.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={500} halfPitch={false}>
            <PlayerDot x={170} y={480} label="GK" type="gk" size={9} />

            {/* Thrower */}
            <PlayerDot x={20} y={410} label="T" type="attack" size={9} />

            {/* Short throw to CB */}
            <PlayerDot x={100} y={420} label="CB" type="attack" size={9} />
            <MovementArrow x1={25} y1={410} x2={95} y2={418} dashed={false} color={C.text} />

            {/* CB lays back to GK */}
            <MovementArrow x1={100} y1={422} x2={168} y2={478} dashed color={C.gold} />
            <PitchLabel x={135} y={455} text="Lay-off" color={C.gold} size={7} />

            {/* GK distributes long */}
            <BallFlight x1={172} y1={478} x2={170} y2={250} cx={100} cy={360} color={C.gold} />
            <PitchLabel x={120} y={340} text="Long Ball" color={C.gold} size={8} />

            <PlayerDot x={170} y={250} label="ST" type="attack" size={9} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Routine 8: Drive Into Space — Bypass Press */}
      <SectionCard title='Routine 8: "Drive Into Space — Bypass Press"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Thrower plays into space ahead of running player rather than to feet.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={500} halfPitch={false}>
            <PlayerDot x={170} y={480} label="GK" type="gk" size={9} />

            {/* Thrower */}
            <PlayerDot x={20} y={390} label="T" type="attack" size={9} />

            {/* Running player */}
            <PlayerDot x={100} y={385} label={1} type="attack" size={10} />
            <MovementArrow x1={100} y1={383} x2={100} y2={340} dashed color={C.gold} />

            {/* Space ahead of player highlighted */}
            <ZoneHighlight x={75} y={330} width={55} height={40} color="rgba(241,196,15,0.18)" />
            <PitchLabel x={100} y={325} text="Space" color={C.gold} size={8} />

            {/* Throw into space, not to feet */}
            <MovementArrow x1={25} y1={388} x2={95} y2={345} dashed={false} color={C.gold} />
            <PitchLabel x={55} y={360} text="Into Space" color={C.gold} size={7} />

            {/* Press being bypassed */}
            <PlayerDot x={70} y={380} label="X" type="defend" size={7} />
            <PlayerDot x={130} y={375} label="X" type="defend" size={7} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>
    </>
  )
}

/* ============================================================
   TAB 4: PENALTIES
   ============================================================ */

function PenaltiesTab() {
  const takers = [
    { order: 1, name: 'Davies', side: 'Left', style: 'Placement' },
    { order: 2, name: "O'Brien", side: 'Right', style: 'Power' },
    { order: 3, name: 'Santos', side: 'Centre', style: 'Placement' },
    { order: 4, name: 'Martinez', side: 'Left', style: 'Power' },
    { order: 5, name: 'Collins', side: 'Right', style: 'Power' },
    { order: 6, name: 'Marcus Webb', side: 'Right', style: 'Placed — low right', note: 'Hesitates under pressure — consider moving down', composure: '7/10' },
    { order: 7, name: 'Lee Nakamura', side: 'Left', style: 'Power — driven', note: 'Ice cold. Should be higher in the order', composure: '9/10' },
    { order: 8, name: 'Jamie Collins', side: 'Centre (Panenka)', style: 'Chip', note: "Only use if 3-0 up. Don't let him Panenka in a final", composure: '6/10' },
    { order: 9, name: 'Dion Fletcher', side: 'Right', style: 'Placed — top right', note: 'Strong record in training — not tested in a real shootout', composure: '8/10' },
    { order: 10, name: 'Ryan Santos (injured)', side: 'Left', style: 'Power — low driven', note: 'First choice when fit — currently injured', composure: '9/10' },
  ]

  return (
    <>
      {/* Penalty Taker Order */}
      <SectionCard title="Penalty Taker Order" onEdit={() => {}}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {takers.map((t) => (
            <div
              key={t.order}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: C.bg,
                borderRadius: 8,
                padding: '10px 14px',
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: C.gold,
                  color: '#000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                {t.order}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                <div style={{ color: C.textSec, fontSize: 12 }}>
                  {t.side} &middot; {t.style}
                  {(t as any).composure && <> &middot; Composure: <strong style={{ color: C.gold }}>{(t as any).composure}</strong></>}
                </div>
                {(t as any).note && (
                  <div style={{ color: C.textSec, fontSize: 11, fontStyle: 'italic', marginTop: 2 }}>
                    {(t as any).note}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* GK Instructions */}
      <SectionCard title="Goalkeeper Instructions" onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 10px' }}>
          GK should study opposing taker&apos;s history before each match. Key guidelines:
        </p>
        <div style={{ background: C.bg, borderRadius: 8, padding: 14 }}>
          <div style={{ color: C.text, fontSize: 13, lineHeight: 1.8 }}>
            &bull; Stand slightly off-centre to invite shot to weaker side<br />
            &bull; Watch hips, not eyes — hips indicate direction<br />
            &bull; Stay big and delay dive as long as possible<br />
            &bull; Against power takers: pick a side early and commit<br />
            &bull; Against placement takers: wait and react
          </div>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Shootout Preparation */}
      <SectionCard title="Shootout Preparation" onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 10px' }}>
          5-player shootout order (same as penalty taker order above).
        </p>
        <div style={{ background: C.bg, borderRadius: 8, padding: 14, marginBottom: 14 }}>
          <div style={{ color: C.textSec, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Opposition Intel</div>
          <div style={{ color: C.text, fontSize: 13 }}>
            <strong>Riverside United</strong> — last 5 penalties: 4/5 scored, 3 to GK&apos;s right
          </div>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Opposition Penalty Tendencies Log */}
      <SectionCard title="Opposition Penalty Tendencies Log" onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 10px' }}>
          Last 5 opponents faced — their designated taker, preferred side, how Oakridge GK set up, and outcome.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Opponent', 'Taker', 'Preferred Side', 'GK Setup', 'Outcome'].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left',
                      padding: '8px 10px',
                      color: C.gold,
                      fontSize: 12,
                      fontWeight: 600,
                      borderBottom: `2px solid ${C.border}`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { opp: 'Riverside United', taker: 'J. Kane', side: 'Right', gk: 'Stayed central', outcome: 'Saved' },
                { opp: 'Northgate City', taker: 'R. Alvarez', side: 'Left', gk: 'Dived left', outcome: 'Goal (right)' },
                { opp: 'Borough Town', taker: 'M. Hussain', side: 'Centre', gk: 'Dived right', outcome: 'Goal (centre)' },
                { opp: 'Hartfield Rovers', taker: 'P. Dixon', side: 'Right', gk: 'Stayed central', outcome: 'Hit post' },
                { opp: 'Crestwood AFC', taker: 'S. Oduya', side: 'Left', gk: 'Dived left', outcome: 'Saved' },
              ].map((row, i) => (
                <tr key={i}>
                  <td style={{ padding: '8px 10px', color: C.text, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>{row.opp}</td>
                  <td style={{ padding: '8px 10px', color: C.text, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>{row.taker}</td>
                  <td style={{ padding: '8px 10px', color: C.textSec, borderBottom: `1px solid ${C.border}` }}>{row.side}</td>
                  <td style={{ padding: '8px 10px', color: C.textSec, borderBottom: `1px solid ${C.border}` }}>{row.gk}</td>
                  <td style={{ padding: '8px 10px', color: row.outcome.startsWith('Goal') ? C.primary : '#27AE60', fontWeight: 600, borderBottom: `1px solid ${C.border}` }}>{row.outcome}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Penalty Stats */}
      <SectionCard title="Penalty Statistics">
        <StatRow label="Awarded" value={4} />
        <StatRow label="Scored" value={3} />
        <StatRow label="Missed" value="1 (Davies — hit post)" />
        <StatRow label="Conceded" value={2} />
        <StatRow label="Saved" value={1} />
        <StatRow label="Conceded (scored)" value={1} />
      </SectionCard>
    </>
  )
}

/* ============================================================
   TAB 5: GOAL KICKS
   ============================================================ */

function GoalKicksTab() {
  return (
    <>
      {/* Short Goal Kick */}
      <SectionCard title='Short Goal Kick (Pep-style Build Up)' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          GK plays short to centre-backs split wide, CMs drop deep, striker stays high.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={500} halfPitch={false}>
            {/* Opposition GK area at top */}
            <PlayerDot x={170} y={15} label="GK" type="defend" size={8} />

            {/* Our GK with ball */}
            <PlayerDot x={170} y={460} label="GK" type="gk" size={10} />

            {/* 2 CBs split wide */}
            <PlayerDot x={80} y={420} label="CB" type="attack" size={9} />
            <PlayerDot x={260} y={420} label="CB" type="attack" size={9} />

            {/* Short pass options */}
            <MovementArrow x1={168} y1={458} x2={85} y2={422} dashed color={C.gold} />
            <MovementArrow x1={172} y1={458} x2={255} y2={422} dashed color={C.gold} />

            {/* Full backs wider */}
            <PlayerDot x={30} y={370} label="LB" type="attack" size={9} />
            <PlayerDot x={310} y={370} label="RB" type="attack" size={9} />

            {/* 2 CMs drop deep */}
            <PlayerDot x={130} y={380} label="CM" type="attack" size={9} />
            <MovementArrow x1={130} y1={350} x2={130} y2={376} dashed color={C.gold} />
            <PlayerDot x={210} y={380} label="CM" type="attack" size={9} />
            <MovementArrow x1={210} y1={350} x2={210} y2={376} dashed color={C.gold} />

            {/* Wingers */}
            <PlayerDot x={60} y={280} label="LW" type="attack" size={9} />
            <PlayerDot x={280} y={280} label="RW" type="attack" size={9} />

            {/* Striker stays high */}
            <PlayerDot x={170} y={200} label="ST" type="attack" size={10} />
            <PitchLabel x={170} y={188} text="Stay high" color={C.gold} size={8} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Long Goal Kick */}
      <SectionCard title='Long Goal Kick — Target Zones' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Long delivery to target zones: wide channels, target man, or channel runs.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={500} halfPitch={false}>
            <PlayerDot x={170} y={15} label="GK" type="defend" size={8} />

            {/* Our GK */}
            <PlayerDot x={170} y={460} label="GK" type="gk" size={10} />

            {/* Target zones */}
            <ZoneHighlight x={20} y={200} width={60} height={80} color="rgba(241,196,15,0.12)" />
            <PitchLabel x={50} y={195} text="Wide L" color={C.gold} size={8} />

            <ZoneHighlight x={260} y={200} width={60} height={80} color="rgba(241,196,15,0.12)" />
            <PitchLabel x={290} y={195} text="Wide R" color={C.gold} size={8} />

            <ZoneHighlight x={140} y={170} width={60} height={60} color="rgba(241,196,15,0.15)" />
            <PitchLabel x={170} y={165} text="Target" color={C.gold} size={8} />

            {/* Target man */}
            <PlayerDot x={170} y={200} label="ST" type="attack" size={10} />

            {/* Channel runners */}
            <PlayerDot x={100} y={230} label="LW" type="attack" size={9} />
            <MovementArrow x1={100} y1={260} x2={100} y2={234} dashed color={C.gold} />

            <PlayerDot x={240} y={230} label="RW" type="attack" size={9} />
            <MovementArrow x1={240} y1={260} x2={240} y2={234} dashed color={C.gold} />

            {/* Long ball trajectory */}
            <BallFlight x1={170} y1={458} x2={170} y2={205} cx={100} cy={330} color={C.gold} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Routine 3: Diagonal Switch — Bypass Midfield */}
      <SectionCard title='Routine 3: "Diagonal Switch — Bypass Midfield"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          GK diagonal ball from left to right winger (or vice versa) — bypasses congested midfield press.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={500} halfPitch={false}>
            <PlayerDot x={170} y={15} label="GK" type="defend" size={8} />

            {/* Our GK */}
            <PlayerDot x={170} y={460} label="GK" type="gk" size={10} />

            {/* Diagonal ball flight across pitch */}
            <BallFlight x1={170} y1={458} x2={290} y2={260} cx={100} cy={350} color={C.gold} />

            {/* Right winger receiving */}
            <PlayerDot x={290} y={258} label="RW" type="attack" size={10} />
            <PitchLabel x={290} y={248} text="Receives" color={C.gold} size={8} />

            {/* Congested midfield */}
            <ZoneHighlight x={110} y={310} width={120} height={60} color="rgba(148,163,184,0.1)" />
            <PitchLabel x={170} y={340} text="Congested" color={C.textSec} size={7} />

            {/* Other players */}
            <PlayerDot x={80} y={420} label="CB" type="attack" size={9} />
            <PlayerDot x={260} y={420} label="CB" type="attack" size={9} />
            <PlayerDot x={50} y={280} label="LW" type="attack" size={9} />
            <PlayerDot x={170} y={200} label="ST" type="attack" size={9} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Routine 4: Target Man — Flick to Feet */}
      <SectionCard title='Routine 4: "Target Man — Flick to Feet"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Driven ball to target man who flicks into path of runner.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={500} halfPitch={false}>
            <PlayerDot x={170} y={15} label="GK" type="defend" size={8} />

            {/* Our GK */}
            <PlayerDot x={170} y={460} label="GK" type="gk" size={10} />

            {/* Ball to target man */}
            <BallFlight x1={170} y1={458} x2={170} y2={220} cx={120} cy={340} color={C.gold} />

            {/* Target man */}
            <PlayerDot x={170} y={218} label="TM" type="attack" size={10} />
            <PitchLabel x={170} y={206} text="Target Man" color={C.gold} size={8} />

            {/* Flick arrow */}
            <MovementArrow x1={172} y1={216} x2={210} y2={190} dashed={false} color={C.gold} />

            {/* Runner */}
            <PlayerDot x={220} y={240} label="R" type="attack" size={10} />
            <MovementArrow x1={220} y1={238} x2={212} y2={194} dashed color={C.gold} />
            <PitchLabel x={230} y={195} text="Runner" color={C.gold} size={7} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Routine 5: GK Roll to CB — Quick Play */}
      <SectionCard title='Routine 5: "GK Roll to CB — Quick Play"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          GK rolls ball short to CB before opposition press organises.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={500} halfPitch={false}>
            <PlayerDot x={170} y={15} label="GK" type="defend" size={8} />

            {/* Our GK */}
            <PlayerDot x={170} y={460} label="GK" type="gk" size={10} />

            {/* Short roll to CB */}
            <MovementArrow x1={168} y1={458} x2={100} y2={425} dashed={false} color={C.text} />
            <PitchLabel x={125} y={445} text="Roll" color={C.gold} size={7} />

            {/* CB receiving */}
            <PlayerDot x={100} y={423} label="CB" type="attack" size={9} />

            {/* Immediate passing options */}
            <PlayerDot x={170} y={380} label="CM" type="attack" size={9} />
            <MovementArrow x1={102} y1={421} x2={165} y2={382} dashed color={C.gold} />

            <PlayerDot x={40} y={370} label="LB" type="attack" size={9} />
            <MovementArrow x1={98} y1={423} x2={45} y2={372} dashed color={C.gold} />

            <PlayerDot x={260} y={420} label="CB" type="attack" size={9} />
            <MovementArrow x1={105} y1={423} x2={255} y2={422} dashed color={C.gold} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Routine 6: Lofted to Channel — Wide Pressure */}
      <SectionCard title='Routine 6: "Lofted to Channel — Wide Pressure"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          High lofted ball into wide channel for winger to chase.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={500} halfPitch={false}>
            <PlayerDot x={170} y={15} label="GK" type="defend" size={8} />

            {/* Our GK */}
            <PlayerDot x={170} y={460} label="GK" type="gk" size={10} />

            {/* Ball arc into wide channel */}
            <BallFlight x1={170} y1={458} x2={300} y2={230} cx={170} cy={320} color={C.gold} />

            {/* Wide channel zone */}
            <ZoneHighlight x={275} y={210} width={55} height={60} color="rgba(241,196,15,0.12)" />
            <PitchLabel x={300} y={205} text="Channel" color={C.gold} size={8} />

            {/* Winger sprinting */}
            <PlayerDot x={290} y={290} label="RW" type="attack" size={10} />
            <MovementArrow x1={290} y1={288} x2={298} y2={240} dashed color={C.gold} />
            <PitchLabel x={280} y={275} text="Sprint" color={C.gold} size={7} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Routine 7: Over Pressing Line — Long Ball */}
      <SectionCard title='Routine 7: "Over Pressing Line — Long Ball"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Opposition presses high — GK lifts ball over the press line to striker running in behind.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={500} halfPitch={false}>
            <PlayerDot x={170} y={15} label="GK" type="defend" size={8} />

            {/* Our GK */}
            <PlayerDot x={170} y={460} label="GK" type="gk" size={10} />

            {/* Pressing line shown */}
            <ZoneHighlight x={40} y={360} width={260} height={8} color="rgba(192,57,43,0.4)" />
            <PitchLabel x={170} y={355} text="Press Line" color={C.primary} size={8} />

            {/* Opposition press players */}
            <PlayerDot x={100} y={370} label="X" type="defend" size={7} />
            <PlayerDot x={170} y={368} label="X" type="defend" size={7} />
            <PlayerDot x={240} y={370} label="X" type="defend" size={7} />

            {/* Ball over the top */}
            <BallFlight x1={170} y1={458} x2={170} y2={200} cx={90} cy={320} color={C.gold} />
            <PitchLabel x={100} y={310} text="Over the top" color={C.gold} size={8} />

            {/* Striker run in behind */}
            <PlayerDot x={170} y={280} label="ST" type="attack" size={10} />
            <MovementArrow x1={170} y1={278} x2={170} y2={210} dashed color={C.gold} />
            <PitchLabel x={190} y={240} text="In behind" color={C.gold} size={7} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Press Trigger Instructions */}
      <SectionCard title="Press Trigger Instructions" onEdit={() => {}}>
        <div style={{ background: C.bg, borderRadius: 8, padding: 14 }}>
          <div style={{ color: C.text, fontSize: 13, lineHeight: 1.8 }}>
            <strong style={{ color: C.gold }}>If opposition presses high:</strong><br />
            &bull; GK plays long to target man or wide channels<br />
            &bull; Midfielders push up to win second ball<br /><br />
            <strong style={{ color: C.gold }}>If opposition drops off:</strong><br />
            &bull; Play short to CBs and build from back<br />
            &bull; CMs drop into pockets between press lines<br /><br />
            <strong style={{ color: C.gold }}>If unsure:</strong><br />
            &bull; Default to short — possession is priority
          </div>
        </div>
        <CoachAttribution />
      </SectionCard>
    </>
  )
}

/* ============================================================
   TAB 6: KICK-OFFS
   ============================================================ */

function KickOffsTab() {
  const [sub, setSub] = useState<KOSub>('Attacking')

  return (
    <>
      <SubTabBar tabs={['Attacking', 'Defending'] as KOSub[]} active={sub} onChange={setSub} />

      {sub === 'Attacking' && <KOAttacking />}
      {sub === 'Defending' && <KODefending />}
    </>
  )
}

function KOAttacking() {
  return (
    <>
      {/* Routine 1: Knock Back — Wide */}
      <SectionCard title='Routine 1: "Knock Back — Wide"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Knock back to CM who plays wide immediately — stretch opposition before they settle.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* Centre spot (bottom of half pitch) */}
            <PlayerDot x={170} y={238} label="" type="ball" size={6} />

            {/* Striker kicks off */}
            <PlayerDot x={165} y={235} label="ST" type="attack" size={9} />

            {/* Knock back to CM */}
            <MovementArrow x1={170} y1={236} x2={170} y2={210} dashed={false} color={C.text} />
            <PlayerDot x={170} y={205} label="CM" type="attack" size={9} />

            {/* Wide pass */}
            <MovementArrow x1={172} y1={203} x2={290} y2={180} dashed color={C.gold} />

            {/* Winger */}
            <PlayerDot x={290} y={178} label="RW" type="attack" size={9} />
            <PitchLabel x={290} y={168} text="Wide" color={C.gold} size={7} />

            {/* Other players */}
            <PlayerDot x={50} y={180} label="LW" type="attack" size={9} />
            <PlayerDot x={130} y={200} label="CM" type="attack" size={9} />
            <PlayerDot x={170} y={160} label="AM" type="attack" size={9} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Routine 2: Direct Press */}
      <SectionCard title='Routine 2: "Direct Press — Win Ball High"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Knock back then immediately press high to win the ball in opposition half.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={238} label="" type="ball" size={6} />

            {/* Striker kicks off */}
            <PlayerDot x={165} y={235} label="ST" type="attack" size={9} />

            {/* Knock back */}
            <MovementArrow x1={170} y1={236} x2={170} y2={210} dashed={false} color={C.text} />
            <PlayerDot x={170} y={205} label="CM" type="attack" size={9} />

            {/* Long ball forward */}
            <BallFlight x1={170} y1={203} x2={170} y2={100} cx={130} cy={150} color={C.gold} />

            {/* Press runners */}
            <PlayerDot x={130} y={180} label="LW" type="attack" size={9} />
            <MovementArrow x1={130} y1={178} x2={120} y2={110} dashed color={C.gold} />

            <PlayerDot x={210} y={180} label="RW" type="attack" size={9} />
            <MovementArrow x1={210} y1={178} x2={220} y2={110} dashed color={C.gold} />

            <PlayerDot x={170} y={150} label="ST" type="attack" size={9} />
            <MovementArrow x1={170} y1={148} x2={170} y2={90} dashed color={C.gold} />

            <ZoneHighlight x={100} y={80} width={140} height={50} color="rgba(241,196,15,0.10)" />
            <PitchLabel x={170} y={78} text="Press zone" color={C.gold} size={8} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Routine 3: Press Immediately — Win Ball High */}
      <SectionCard title='Routine 3: "Press Immediately — Win Ball High"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Knock forward instantly, entire team presses opposition.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={238} label="" type="ball" size={6} />

            {/* Striker kicks forward */}
            <PlayerDot x={165} y={235} label="ST" type="attack" size={9} />
            <MovementArrow x1={170} y1={236} x2={170} y2={180} dashed={false} color={C.text} />

            {/* Press arrows from all positions */}
            <PlayerDot x={80} y={200} label="LW" type="attack" size={9} />
            <MovementArrow x1={80} y1={198} x2={90} y2={130} dashed color={C.gold} />

            <PlayerDot x={260} y={200} label="RW" type="attack" size={9} />
            <MovementArrow x1={260} y1={198} x2={250} y2={130} dashed color={C.gold} />

            <PlayerDot x={130} y={210} label="CM" type="attack" size={9} />
            <MovementArrow x1={130} y1={208} x2={130} y2={140} dashed color={C.gold} />

            <PlayerDot x={210} y={210} label="CM" type="attack" size={9} />
            <MovementArrow x1={210} y1={208} x2={210} y2={140} dashed color={C.gold} />

            <PlayerDot x={170} y={195} label="AM" type="attack" size={9} />
            <MovementArrow x1={170} y1={193} x2={170} y2={120} dashed color={C.gold} />

            <ZoneHighlight x={70} y={100} width={200} height={50} color="rgba(241,196,15,0.10)" />
            <PitchLabel x={170} y={98} text="Press zone" color={C.gold} size={8} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Routine 4: Wide Quick Release */}
      <SectionCard title='Routine 4: "Wide Quick Release"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Knock back, immediate switch to wide player on half-turn — drives forward.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={238} label="" type="ball" size={6} />

            {/* Striker kicks off */}
            <PlayerDot x={165} y={235} label="ST" type="attack" size={9} />

            {/* Knock back */}
            <MovementArrow x1={170} y1={236} x2={170} y2={210} dashed={false} color={C.text} />
            <PlayerDot x={170} y={205} label="CM" type="attack" size={9} />

            {/* Wide switch arrow */}
            <MovementArrow x1={172} y1={203} x2={50} y2={180} dashed color={C.gold} />
            <PitchLabel x={110} y={180} text="Switch" color={C.gold} size={8} />

            {/* Wide player */}
            <PlayerDot x={50} y={178} label="LW" type="attack" size={10} />

            {/* Drive forward */}
            <MovementArrow x1={50} y1={176} x2={60} y2={100} dashed color={C.gold} />
            <PitchLabel x={40} y={130} text="Drive" color={C.gold} size={7} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Routine 5: Through the Lines */}
      <SectionCard title='Routine 5: "Through the Lines"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Ball played back, midfielder turns and plays first time through the lines to striker.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={238} label="" type="ball" size={6} />

            {/* Striker kicks off */}
            <PlayerDot x={165} y={235} label="ST" type="attack" size={9} />

            {/* Knock back to CM */}
            <MovementArrow x1={170} y1={236} x2={170} y2={210} dashed={false} color={C.text} />
            <PlayerDot x={170} y={205} label="CM" type="attack" size={9} />

            {/* Through ball to striker */}
            <MovementArrow x1={170} y1={203} x2={170} y2={100} dashed={false} color={C.gold} />
            <PitchLabel x={185} y={150} text="Through Ball" color={C.gold} size={7} />

            {/* Striker running in behind */}
            <PlayerDot x={170} y={140} label="ST2" type="attack" size={10} />
            <MovementArrow x1={170} y1={138} x2={170} y2={80} dashed color={C.gold} />
            <PitchLabel x={190} y={105} text="In behind" color={C.gold} size={7} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>
    </>
  )
}

function KODefending() {
  return (
    <>
      {/* Defensive Kick-Off */}
      <SectionCard title="Defending Opposition Kick-Off" onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Default to mid-block shape. Press trigger only if ball goes backwards.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* Opposition kicking off */}
            <PlayerDot x={170} y={238} label="" type="ball" size={6} />
            <PlayerDot x={165} y={235} label="A" type="defend" size={8} />
            <PlayerDot x={175} y={235} label="A" type="defend" size={8} />

            {/* Our mid-block shape */}
            {/* Front 2 */}
            <PlayerDot x={140} y={190} label="ST" type="attack" size={9} />
            <PlayerDot x={200} y={190} label="AM" type="attack" size={9} />

            {/* Midfield 3 */}
            <PlayerDot x={80} y={155} label="LM" type="attack" size={9} />
            <PlayerDot x={170} y={155} label="CM" type="attack" size={9} />
            <PlayerDot x={260} y={155} label="RM" type="attack" size={9} />

            {/* Back 4 */}
            <PlayerDot x={60} y={110} label="LB" type="attack" size={9} />
            <PlayerDot x={140} y={105} label="CB" type="attack" size={9} />
            <PlayerDot x={200} y={105} label="CB" type="attack" size={9} />
            <PlayerDot x={280} y={110} label="RB" type="attack" size={9} />

            <PitchLabel x={170} y={130} text="Mid-block" color={C.gold} size={8} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Routine 3: Mid-Block Instant Shape */}
      <SectionCard title='Routine 3: "Mid-Block Instant Shape"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Drop into organised mid-block immediately on opposition kick-off.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* Opposition kicking off */}
            <PlayerDot x={170} y={238} label="" type="ball" size={6} />
            <PlayerDot x={165} y={235} label="A" type="defend" size={8} />

            {/* Mid-block shape — compact */}
            <PlayerDot x={140} y={180} label="ST" type="attack" size={9} />
            <PlayerDot x={200} y={180} label="AM" type="attack" size={9} />

            {/* Midfield line */}
            <PlayerDot x={70} y={145} label="LM" type="attack" size={9} />
            <PlayerDot x={140} y={145} label="CM" type="attack" size={9} />
            <PlayerDot x={200} y={145} label="CM" type="attack" size={9} />
            <PlayerDot x={270} y={145} label="RM" type="attack" size={9} />

            {/* Defensive line */}
            <PlayerDot x={60} y={100} label="LB" type="attack" size={9} />
            <PlayerDot x={140} y={95} label="CB" type="attack" size={9} />
            <PlayerDot x={200} y={95} label="CB" type="attack" size={9} />
            <PlayerDot x={280} y={100} label="RB" type="attack" size={9} />

            {/* Compact zone */}
            <ZoneHighlight x={50} y={85} width={240} height={110} color="rgba(192,57,43,0.06)" />
            <PitchLabel x={170} y={120} text="Mid-block" color={C.gold} size={8} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Routine 4: High Press Trigger */}
      <SectionCard title='Routine 4: "High Press Trigger"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          If opposition play short kick-off — press immediately.
        </p>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* Opposition short kick-off */}
            <PlayerDot x={170} y={238} label="" type="ball" size={6} />
            <PlayerDot x={165} y={235} label="A1" type="defend" size={8} />
            <PlayerDot x={180} y={220} label="A2" type="defend" size={8} />
            <MovementArrow x1={170} y1={236} x2={178} y2={222} dashed={false} color={C.textSec} />
            <PitchLabel x={195} y={228} text="Short" color={C.textSec} size={7} />

            {/* Immediate press arrows */}
            <PlayerDot x={140} y={195} label="ST" type="attack" size={9} />
            <MovementArrow x1={140} y1={193} x2={165} y2={225} dashed color={C.primary} />

            <PlayerDot x={200} y={195} label="AM" type="attack" size={9} />
            <MovementArrow x1={200} y1={193} x2={185} y2={220} dashed color={C.primary} />

            <PlayerDot x={80} y={190} label="LW" type="attack" size={9} />
            <MovementArrow x1={80} y1={188} x2={120} y2={210} dashed color={C.primary} />

            <PlayerDot x={260} y={190} label="RW" type="attack" size={9} />
            <MovementArrow x1={260} y1={188} x2={220} y2={210} dashed color={C.primary} />

            <PitchLabel x={170} y={175} text="Press!" color={C.primary} size={9} />
          </PitchSVG>
        </div>
        <CoachAttribution />
      </SectionCard>

      {/* Press Trigger Panel */}
      <SectionCard title="Press Trigger Conditions" onEdit={() => {}}>
        <div style={{ background: C.bg, borderRadius: 8, padding: 14 }}>
          <div style={{ color: C.text, fontSize: 13, lineHeight: 1.8 }}>
            <strong style={{ color: C.gold }}>Press if:</strong><br />
            &bull; Ball is played backwards from kick-off<br />
            &bull; Opponent takes a heavy touch<br />
            &bull; Ball goes to their weaker side (scouted pre-match)<br /><br />
            <strong style={{ color: C.primary }}>Hold shape if:</strong><br />
            &bull; Ball is played forward or wide — stay compact<br />
            &bull; Default: mid-block, protect centre
          </div>
        </div>
        <CoachAttribution />
      </SectionCard>
    </>
  )
}

/* ============================================================
   TAB 7: STATS
   ============================================================ */

function StatsTab() {
  return (
    <>
      {/* Season Overview */}
      <SectionCard title="Season Overview — Set Piece Goals">
        <StatRow label="Total Goals" value={28} />
        <StatRow label="Goals from Set Pieces" value="6 (21.4%)" />
        <StatRow label="Corners — Goals" value="4 (of 47 taken)" />
        <StatRow label="Free Kicks — Goals" value="1" />
        <StatRow label="Penalties — Scored" value="3 of 4" />
        <StatRow label="Long Throws — Goals" value="1" />
        <StatRow label="Set Piece Goals Conceded" value={5} />
      </SectionCard>

      {/* Bar Chart Comparison */}
      <SectionCard title="Set Piece Goal % — League Comparison">
        <div style={{ overflowX: 'auto' }}>
          <svg width="100%" viewBox="0 0 340 200" style={{ maxWidth: 400 }}>
            {/* Background */}
            <rect x="0" y="0" width="340" height="200" fill={C.bg} rx="4" />

            {/* Y axis labels */}
            <text x="10" y="30" fill={C.textSec} fontSize="10" fontFamily="system-ui">30%</text>
            <text x="10" y="70" fill={C.textSec} fontSize="10" fontFamily="system-ui">20%</text>
            <text x="10" y="110" fill={C.textSec} fontSize="10" fontFamily="system-ui">10%</text>
            <text x="10" y="150" fill={C.textSec} fontSize="10" fontFamily="system-ui">0%</text>

            {/* Grid lines */}
            <line x1="40" y1="30" x2="330" y2="30" stroke={C.border} strokeWidth="0.5" />
            <line x1="40" y1="70" x2="330" y2="70" stroke={C.border} strokeWidth="0.5" />
            <line x1="40" y1="110" x2="330" y2="110" stroke={C.border} strokeWidth="0.5" />
            <line x1="40" y1="150" x2="330" y2="150" stroke={C.border} strokeWidth="0.5" />

            {/* Bar 1: Oakridge FC 21.4% */}
            <rect x="70" y={150 - (21.4 / 30) * 120} width="60" height={(21.4 / 30) * 120} fill={C.primary} rx="3" />
            <text x="100" y={150 - (21.4 / 30) * 120 - 5} textAnchor="middle" fill={C.text} fontSize="11" fontWeight="bold" fontFamily="system-ui">21.4%</text>
            <text x="100" y="170" textAnchor="middle" fill={C.text} fontSize="10" fontFamily="system-ui">Oakridge FC</text>

            {/* Bar 2: Championship avg 23% */}
            <rect x="155" y={150 - (23 / 30) * 120} width="60" height={(23 / 30) * 120} fill={C.gold} rx="3" />
            <text x="185" y={150 - (23 / 30) * 120 - 5} textAnchor="middle" fill={C.text} fontSize="11" fontWeight="bold" fontFamily="system-ui">23%</text>
            <text x="185" y="170" textAnchor="middle" fill={C.text} fontSize="10" fontFamily="system-ui">Champ. Avg</text>

            {/* Bar 3: PL avg 21% */}
            <rect x="240" y={150 - (21 / 30) * 120} width="60" height={(21 / 30) * 120} fill={C.textSec} rx="3" />
            <text x="270" y={150 - (21 / 30) * 120 - 5} textAnchor="middle" fill={C.text} fontSize="11" fontWeight="bold" fontFamily="system-ui">21%</text>
            <text x="270" y="170" textAnchor="middle" fill={C.text} fontSize="10" fontFamily="system-ui">PL Avg</text>
          </svg>
        </div>
      </SectionCard>

      {/* Goal Location Map */}
      <SectionCard title="Goal Location Map — Set Pieces">
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Where the 6 set piece goals were scored from this season.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* Goal dots — 6 positions in/around the box */}
            <PlayerDot x={180} y={55} label="" type="ball" size={8} />
            <PlayerDot x={150} y={70} label="" type="ball" size={8} />
            <PlayerDot x={210} y={45} label="" type="ball" size={8} />
            <PlayerDot x={170} y={82} label="" type="ball" size={8} />
            <PlayerDot x={130} y={50} label="" type="ball" size={8} />
            <PlayerDot x={195} y={90} label="" type="ball" size={8} />

            {/* Labels for each */}
            <PitchLabel x={180} y={45} text="Corner" color={C.gold} size={7} />
            <PitchLabel x={150} y={60} text="Corner" color={C.gold} size={7} />
            <PitchLabel x={210} y={35} text="Corner" color={C.gold} size={7} />
            <PitchLabel x={170} y={72} text="FK" color={C.gold} size={7} />
            <PitchLabel x={130} y={40} text="Corner" color={C.gold} size={7} />
            <PitchLabel x={195} y={80} text="Pen" color={C.gold} size={7} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Best Performing Routine */}
      <SectionCard title="Best Performing Routine">
        <div
          style={{
            background: C.bg,
            borderRadius: 8,
            padding: 16,
            borderLeft: `4px solid ${C.gold}`,
          }}
        >
          <div style={{ color: C.gold, fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
            &ldquo;Far Post Overload&rdquo;
          </div>
          <div style={{ color: C.text, fontSize: 14 }}>
            3 goals scored from this routine this season
          </div>
          <div style={{ color: C.textSec, fontSize: 12, marginTop: 4 }}>
            Corner — Outswinger from left side
          </div>
        </div>
      </SectionCard>
    </>
  )
}

/* ============================================================
   TAB 8: SET PIECE COACH
   ============================================================ */

function SetPieceCoachTab() {
  return (
    <>
      {/* Staff Profile Card */}
      <SectionCard title="Set Piece Coach Profile">
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* Avatar placeholder */}
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: C.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 24,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            MW
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ color: C.text, fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
              Marcus Webb
            </div>
            <div style={{ color: C.textSec, fontSize: 13, marginBottom: 12 }}>
              Set Piece Specialist Coach
            </div>

            <StatRow label="Speciality" value="Delivery analysis, Zonal defending" />
            <StatRow label="Preferred Delivery" value="Outswinging corners, Low driven FKs" />
            <StatRow label="Defensive Preference" value="Hybrid zonal/man-marking" />
          </div>
        </div>
      </SectionCard>

      {/* This Week's Focus */}
      <SectionCard title="This Week's Focus">
        <div
          style={{
            background: C.bg,
            borderRadius: 8,
            padding: 16,
            borderLeft: `4px solid ${C.primary}`,
          }}
        >
          <div style={{ color: C.text, fontSize: 14, lineHeight: 1.8 }}>
            <strong style={{ color: C.gold }}>Pre-match preparation vs Riverside United:</strong><br />
            &bull; Practise &ldquo;Far Post Overload&rdquo; corner routine — 3 goals this season<br />
            &bull; Review opposition corner defending — they are weak at the near post<br />
            &bull; Penalty prep: study Riverside&apos;s GK (dives right 65% of the time)<br />
            &bull; Introduce new short corner variation for right side
          </div>
        </div>
      </SectionCard>

      {/* Season Stats */}
      <SectionCard title="Coach Season Summary">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {[
            ['Training Sessions', '8'],
            ['Routines Developed', '12'],
            ['Goals Contributed', '6'],
          ].map(([l, v]) => (
            <div
              key={l}
              style={{
                background: C.bg,
                borderRadius: 8,
                padding: 14,
                textAlign: 'center',
              }}
            >
              <div style={{ color: C.textSec, fontSize: 12, marginBottom: 4 }}>{l}</div>
              <div style={{ color: C.gold, fontSize: 24, fontWeight: 700 }}>{v}</div>
            </div>
          ))}
        </div>
      </SectionCard>
    </>
  )
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export default function ProSetPiecesView() {
  const [activeTab, setActiveTab] = useState<Tab>('CORNERS')

  const tabs: Tab[] = [
    'CORNERS',
    'FREE KICKS',
    'THROW-INS',
    'PENALTIES',
    'GOAL KICKS',
    'KICK-OFFS',
    'STATS',
    'SET PIECE COACH',
  ]

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ marginBottom: 4 }}>
          <span
            style={{
              color: C.primary,
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Oakridge FC &middot; Championship
          </span>
        </div>
        <h1 style={{ color: C.text, fontSize: 24, fontWeight: 700, margin: '0 0 20px' }}>
          Set Pieces
        </h1>

        {/* Tab bar — horizontally scrollable on mobile */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            marginBottom: 24,
            overflowX: 'auto',
            paddingBottom: 4,
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                padding: '8px 18px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                border: activeTab === t ? 'none' : `1px solid ${C.border}`,
                background: activeTab === t ? C.primary : 'transparent',
                color: activeTab === t ? '#fff' : C.textSec,
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'CORNERS' && <CornersTab />}
        {activeTab === 'FREE KICKS' && <FreeKicksTab />}
        {activeTab === 'THROW-INS' && <ThrowInsTab />}
        {activeTab === 'PENALTIES' && <PenaltiesTab />}
        {activeTab === 'GOAL KICKS' && <GoalKicksTab />}
        {activeTab === 'KICK-OFFS' && <KickOffsTab />}
        {activeTab === 'STATS' && <StatsTab />}
        {activeTab === 'SET PIECE COACH' && <SetPieceCoachTab />}
      </div>
    </div>
  )
}
