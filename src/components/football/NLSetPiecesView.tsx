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
} from '@/components/football/PitchDiagram'

/* ── Theme tokens ─────────────────────────────────────── */
const C = {
  primary: '#D97706',
  cardBg: '#1E293B',
  border: '#334155',
  text: '#F8FAFC',
  textSec: '#94A3B8',
  bg: '#0F172A',
} as const

type Tab = 'CORNERS' | 'FREE KICKS' | 'THROW-INS' | 'PENALTIES' | 'GOAL KICKS' | 'KICK-OFFS' | 'STATS'
type CornerSub = 'Attacking' | 'Defending'
type FKSub = 'Shooting' | 'Wide' | 'Deep' | 'Defending'

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
            color: active === t ? '#000' : C.textSec,
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

/* ============================================================
   CORNERS TAB
   ============================================================ */

function CornersTab() {
  const [sub, setSub] = useState<CornerSub>('Attacking')

  return (
    <>
      <SubTabBar tabs={['Attacking', 'Defending'] as CornerSub[]} active={sub} onChange={setSub} />

      {sub === 'Attacking' && <CornersAttacking />}
      {sub === 'Defending' && <CornersDefending />}

      {/* Corner stats */}
      <SectionCard title="Corner Statistics">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            ['Corners Taken', '32'],
            ['Goals Scored', '3 (9.4%)'],
            ['Corners Conceded', '28'],
            ['Goals Conceded', '2'],
          ].map(([l, v]) => (
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
              <div style={{ color: C.primary, fontSize: 20, fontWeight: 700 }}>{v}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Long throw specialist */}
      <SectionCard title="Long Throw Specialist" onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 10px' }}>
          Does your team have a long throw specialist?
        </p>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div style={{ color: C.text, fontSize: 15, fontWeight: 600 }}>Tom Brennan</div>
            <div style={{ color: C.textSec, fontSize: 13 }}>Distance: ~30 m</div>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <PitchSVG width={320} height={180} halfPitch>
              <PlayerDot x={20} y={130} label="TB" type="attack" size={10} />
              <MovementArrow x1={30} y1={130} x2={170} y2={80} dashed color={C.primary} />
              <PlayerDot x={170} y={80} label="" type="ball" size={6} />
              <ZoneHighlight x={130} y={50} width={80} height={70} color="rgba(217,119,6,0.12)" />
              <PlayerDot x={155} y={65} label="9" type="attack" size={8} />
              <PlayerDot x={175} y={90} label="10" type="attack" size={8} />
            </PitchSVG>
          </div>
        </div>
      </SectionCard>
    </>
  )
}

function CornersAttacking() {
  return (
    <>
      {/* Routine 1 — Direct Inswinger to Back Post */}
      <SectionCard title='Routine 1: "Direct Inswinger to Back Post"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Taker: <strong style={{ color: C.text }}>Marcus Webb</strong> (left foot, from right
          corner)
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* Corner flag */}
            <CornerFlag side="right" />

            {/* Ball flight — arc from right corner to back post area */}
            <BallFlight x1={315} y1={15} x2={155} y2={70} cx={260} cy={20} color={C.primary} />

            {/* Taker */}
            <PlayerDot x={318} y={18} label="MW" type="attack" size={9} />

            {/* Attacking runners */}
            <PlayerDot x={155} y={68} label="9" type="attack" size={9} />
            <PitchLabel x={155} y={55} text="Back post" color={C.textSec} />

            <PlayerDot x={180} y={55} label="5" type="attack" size={9} />
            <PitchLabel x={180} y={43} text="Near post" color={C.textSec} />

            <PlayerDot x={200} y={100} label="10" type="attack" size={9} />
            <PitchLabel x={200} y={113} text="Pen spot" color={C.textSec} />

            {/* Blocker */}
            <PlayerDot x={220} y={70} label="8" type="attack" size={9} />
            <PitchLabel x={220} y={58} text="Blocker" color={C.textSec} />

            {/* Edge runner */}
            <PlayerDot x={250} y={140} label="11" type="attack" size={9} />
            <PitchLabel x={250} y={153} text="Edge" color={C.textSec} />

            {/* Movement arrows */}
            <MovementArrow x1={165} y1={100} x2={155} y2={72} dashed color={C.primary} />
            <MovementArrow x1={195} y1={85} x2={180} y2={59} dashed color={C.primary} />
            <MovementArrow x1={210} y1={125} x2={200} y2={104} dashed color={C.primary} />

            {/* Danger zone */}
            <ZoneHighlight x={140} y={40} width={80} height={80} color="rgba(217,119,6,0.08)" />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 2 — Short Corner */}
      <SectionCard title='Routine 2: "Short Corner"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          2-man short routine — short pass then cross from byline.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <CornerFlag side="right" />

            {/* Taker at corner */}
            <PlayerDot x={318} y={18} label="MW" type="attack" size={9} />

            {/* Short pass receiver */}
            <PlayerDot x={290} y={35} label="7" type="attack" size={9} />

            {/* Short pass */}
            <MovementArrow x1={316} y1={22} x2={295} y2={35} dashed={false} color={C.text} />

            {/* Receiver carries to byline */}
            <MovementArrow x1={290} y1={35} x2={280} y2={22} dashed color={C.primary} />

            {/* Cross from byline */}
            <BallFlight x1={280} y1={22} x2={190} y2={75} cx={240} cy={25} color={C.primary} />

            {/* Attackers in box */}
            <PlayerDot x={190} y={75} label="9" type="attack" size={9} />
            <PlayerDot x={170} y={60} label="5" type="attack" size={9} />
            <PlayerDot x={210} y={95} label="10" type="attack" size={9} />

            <MovementArrow x1={200} y1={105} x2={190} y2={79} dashed color={C.primary} />
            <MovementArrow x1={180} y1={90} x2={170} y2={64} dashed color={C.primary} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 3 — Inswinger — Near Post Flick */}
      <SectionCard title='Routine 3: "Inswinger — Near Post Flick"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Inswinger from right corner to near post for flick-on towards back post.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <CornerFlag side="right" />
            <PlayerDot x={318} y={18} label="MW" type="attack" size={9} />
            {/* Ball arc to near post */}
            <BallFlight x1={315} y1={15} x2={195} y2={50} cx={270} cy={10} color={C.primary} />
            {/* Near post flicker */}
            <PlayerDot x={195} y={48} label="9" type="attack" size={9} />
            <PitchLabel x={195} y={36} text="Flick" color={C.primary} />
            {/* Flick-on arrow to back post */}
            <MovementArrow x1={195} y1={50} x2={150} y2={68} dashed={false} color={C.primary} />
            {/* Runner attacking the flick at back post */}
            <PlayerDot x={150} y={66} label="5" type="attack" size={9} />
            <PitchLabel x={150} y={55} text="Back post" color={C.textSec} />
            <MovementArrow x1={160} y1={95} x2={152} y2={70} dashed color={C.primary} />
            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
            <ZoneHighlight x={140} y={40} width={70} height={50} color="rgba(217,119,6,0.08)" />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 4 — Blockers + Back Post */}
      <SectionCard title='Routine 4: "Blockers + Back Post"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          2 blockers screen opposition best headers; flat driven delivery to back post.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <CornerFlag side="right" />
            <PlayerDot x={318} y={18} label="MW" type="attack" size={9} />
            {/* Flat delivery to back post */}
            <BallFlight x1={315} y1={15} x2={145} y2={65} cx={240} cy={15} color={C.primary} />
            {/* Blocker 1 */}
            <PlayerDot x={210} y={60} label="8" type="attack" size={9} />
            <PitchLabel x={210} y={48} text="Block" color={C.textSec} />
            {/* Blocker 2 */}
            <PlayerDot x={220} y={80} label="11" type="attack" size={9} />
            <PitchLabel x={220} y={68} text="Block" color={C.textSec} />
            {/* Back post target */}
            <PlayerDot x={145} y={63} label="5" type="attack" size={9} />
            <PitchLabel x={145} y={52} text="Back post" color={C.primary} />
            <MovementArrow x1={155} y1={90} x2={147} y2={67} dashed color={C.primary} />
            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 5 — Short — Cutback */}
      <SectionCard title='Routine 5: "Short — Cutback"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Short corner, receiver drives to byline and cuts back for shooter at edge of box.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <CornerFlag side="right" />
            <PlayerDot x={318} y={18} label="MW" type="attack" size={9} />
            {/* Short pass to receiver */}
            <PlayerDot x={290} y={40} label="7" type="attack" size={9} />
            <MovementArrow x1={316} y1={22} x2={295} y2={40} dashed={false} color={C.text} />
            {/* Byline run */}
            <MovementArrow x1={290} y1={40} x2={275} y2={15} dashed color={C.primary} />
            <PitchLabel x={280} y={10} text="Byline" color={C.textSec} />
            {/* Cutback arrow */}
            <MovementArrow x1={275} y1={18} x2={220} y2={110} dashed={false} color={C.primary} />
            <PitchLabel x={240} y={70} text="Cutback" color={C.primary} />
            {/* Shooter at edge */}
            <PlayerDot x={220} y={112} label="10" type="attack" size={9} />
            <PitchLabel x={220} y={125} text="Shoot" color={C.primary} />
            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 6 — Driven Penalty Spot */}
      <SectionCard title='Routine 6: "Driven Penalty Spot"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Flat driven delivery direct to penalty spot area; 3 runners attack the zone.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <CornerFlag side="right" />
            <PlayerDot x={318} y={18} label="MW" type="attack" size={9} />
            {/* Flat delivery to penalty spot */}
            <BallFlight x1={315} y1={15} x2={195} y2={95} cx={270} cy={40} color={C.primary} />
            {/* Penalty spot zone */}
            <ZoneHighlight x={175} y={80} width={40} height={30} color="rgba(217,119,6,0.15)" />
            <PitchLabel x={195} y={78} text="Pen spot" color={C.primary} />
            {/* 3 runners converging */}
            <PlayerDot x={160} y={130} label="5" type="attack" size={9} />
            <MovementArrow x1={162} y1={128} x2={185} y2={100} dashed color={C.primary} />
            <PlayerDot x={195} y={140} label="9" type="attack" size={9} />
            <MovementArrow x1={195} y1={138} x2={195} y2={100} dashed color={C.primary} />
            <PlayerDot x={230} y={130} label="10" type="attack" size={9} />
            <MovementArrow x1={228} y1={128} x2={205} y2={100} dashed color={C.primary} />
            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 7 — Decoy Overload — Peel Off */}
      <SectionCard title='Routine 7: "Decoy Overload — Peel Off"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          3 decoy runners to near post; real target peels off late to back post.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <CornerFlag side="right" />
            <PlayerDot x={318} y={18} label="MW" type="attack" size={9} />
            {/* 3 decoy runs to near post */}
            <PlayerDot x={230} y={120} label="8" type="attack" size={9} />
            <MovementArrow x1={230} y1={118} x2={200} y2={55} dashed color={C.textSec} />
            <PlayerDot x={240} y={130} label="11" type="attack" size={9} />
            <MovementArrow x1={240} y1={128} x2={210} y2={60} dashed color={C.textSec} />
            <PlayerDot x={250} y={115} label="10" type="attack" size={9} />
            <MovementArrow x1={250} y1={113} x2={215} y2={50} dashed color={C.textSec} />
            <PitchLabel x={210} y={43} text="Decoys" color={C.textSec} />
            {/* Real target peels to back post */}
            <PlayerDot x={200} y={130} label="5" type="attack" size={9} />
            <MovementArrow x1={200} y1={128} x2={150} y2={65} dashed color={C.primary} />
            <PitchLabel x={140} y={55} text="Peel off" color={C.primary} />
            {/* Ball flight to back post */}
            <BallFlight x1={315} y1={15} x2={150} y2={68} cx={250} cy={15} color={C.primary} />
            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 8 — Double-Touch Short */}
      <SectionCard title='Routine 8: "Double-Touch Short"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Short corner with a return pass back to the taker. Defence gets pulled out, taker delivers a second-phase cross into the box.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <CornerFlag side="right" />
            {/* Taker */}
            <PlayerDot x={318} y={18} label="MW" type="attack" size={9} />
            {/* Short pass to receiver */}
            <PlayerDot x={290} y={40} label="7" type="attack" size={9} />
            <MovementArrow x1={316} y1={22} x2={295} y2={40} dashed={false} color={C.text} />
            <PitchLabel x={300} y={30} text="Short" color={C.textSec} />
            {/* Return pass back to taker */}
            <MovementArrow x1={290} y1={42} x2={310} y2={55} dashed={false} color={C.primary} />
            <PitchLabel x={305} y={65} text="Return" color={C.primary} />
            {/* Taker moves to new position */}
            <MovementArrow x1={318} y1={22} x2={310} y2={52} dashed color={C.primary} />
            {/* Second-phase cross into box */}
            <BallFlight x1={310} y1={55} x2={185} y2={65} cx={260} cy={30} color={C.primary} />
            <PitchLabel x={260} y={25} text="2nd phase" color={C.primary} />
            {/* Attackers in box */}
            <PlayerDot x={185} y={63} label="9" type="attack" size={9} />
            <PlayerDot x={200} y={80} label="5" type="attack" size={9} />
            <MovementArrow x1={200} y1={105} x2={200} y2={84} dashed color={C.primary} />
            <MovementArrow x1={195} y1={90} x2={185} y2={67} dashed color={C.primary} />
            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 9 — GK Screen — Front Post Attack */}
      <SectionCard title='Routine 9: "GK Screen — Front Post Attack"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Blocker screens the goalkeeper's path to the ball. Tallest attacker attacks the front post delivery.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <CornerFlag side="right" />
            {/* Taker */}
            <PlayerDot x={318} y={18} label="MW" type="attack" size={9} />
            {/* Ball flight to front post */}
            <BallFlight x1={315} y1={15} x2={195} y2={42} cx={270} cy={8} color={C.primary} />
            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
            {/* Blocker screening GK */}
            <PlayerDot x={180} y={30} label="8" type="attack" size={9} />
            <PitchLabel x={180} y={20} text="Screen" color={C.primary} />
            <MarkingLine x1={180} y1={30} x2={172} y2={18} color={C.primary} />
            {/* Tallest attacker running to front post */}
            <PlayerDot x={220} y={80} label="5" type="attack" size={10} />
            <MovementArrow x1={220} y1={78} x2={197} y2={46} dashed color={C.primary} />
            <PitchLabel x={195} y={55} text="Front post" color={C.primary} />
            {/* Support runners */}
            <PlayerDot x={170} y={75} label="9" type="attack" size={9} />
            <PlayerDot x={200} y={100} label="10" type="attack" size={9} />
            <ZoneHighlight x={180} y={30} width={40} height={30} color="rgba(217,119,6,0.10)" />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 10 — Split Run — Inside Channel */}
      <SectionCard title='Routine 10: "Split Run — Inside Channel"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Two runners split from centre — one drags wide to create space, one cuts inside to the 6-yard box. Inswinger delivered to the inside runner.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <CornerFlag side="right" />
            {/* Taker */}
            <PlayerDot x={318} y={18} label="MW" type="attack" size={9} />
            {/* Starting positions — 2 runners central */}
            <PlayerDot x={210} y={100} label="9" type="attack" size={9} />
            <PlayerDot x={220} y={105} label="5" type="attack" size={9} />
            <PitchLabel x={225} y={115} text="Start" color={C.textSec} />
            {/* Runner 1 drags wide */}
            <MovementArrow x1={210} y1={98} x2={260} y2={60} dashed color={C.textSec} />
            <PitchLabel x={265} y={55} text="Drag wide" color={C.textSec} />
            {/* Runner 2 cuts inside to 6-yard box */}
            <MovementArrow x1={220} y1={103} x2={175} y2={50} dashed color={C.primary} />
            <PitchLabel x={165} y={42} text="Inside cut" color={C.primary} />
            {/* Inswinger delivery to inside runner */}
            <BallFlight x1={315} y1={15} x2={178} y2={52} cx={260} cy={10} color={C.primary} />
            {/* 6-yard zone */}
            <ZoneHighlight x={155} y={35} width={50} height={35} color="rgba(217,119,6,0.10)" />
            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 11 — Late Surge — Back Post */}
      <SectionCard title='Routine 11: "Late Surge — Back Post"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          All attackers start clustered centrally near the near post. At the last moment, three surge towards the back post to meet the delivery.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <CornerFlag side="right" />
            {/* Taker */}
            <PlayerDot x={318} y={18} label="MW" type="attack" size={9} />
            {/* Clustered starting positions — near post / central */}
            <PlayerDot x={210} y={70} label="5" type="attack" size={9} />
            <PlayerDot x={220} y={80} label="9" type="attack" size={9} />
            <PlayerDot x={205} y={85} label="10" type="attack" size={9} />
            <PlayerDot x={215} y={95} label="8" type="attack" size={9} />
            <PlayerDot x={225} y={90} label="11" type="attack" size={9} />
            <PitchLabel x={230} y={105} text="Cluster" color={C.textSec} />
            {/* Late surge arrows to back post */}
            <MovementArrow x1={210} y1={68} x2={150} y2={55} dashed color={C.primary} />
            <MovementArrow x1={220} y1={78} x2={155} y2={65} dashed color={C.primary} />
            <MovementArrow x1={205} y1={83} x2={145} y2={72} dashed color={C.primary} />
            <PitchLabel x={135} y={48} text="Late surge" color={C.primary} />
            {/* Ball flight to back post */}
            <BallFlight x1={315} y1={15} x2={150} y2={60} cx={250} cy={10} color={C.primary} />
            {/* Back post zone */}
            <ZoneHighlight x={130} y={45} width={40} height={40} color="rgba(217,119,6,0.12)" />
            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 12 — Second Ball Trap */}
      <SectionCard title='Routine 12: "Second Ball Trap"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Deliver to the area where the opposition will likely head clear. Four players ring the clearance zone to win the second ball.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <CornerFlag side="right" />
            {/* Taker */}
            <PlayerDot x={318} y={18} label="MW" type="attack" size={9} />
            {/* Delivery into contested zone */}
            <BallFlight x1={315} y1={15} x2={200} y2={75} cx={270} cy={20} color={C.primary} />
            {/* Defenders heading clear */}
            <PlayerDot x={200} y={73} label="D" type="defend" size={8} />
            <PitchLabel x={200} y={63} text="Header" color={C.textSec} />
            {/* Clearance zone highlighted */}
            <ZoneHighlight x={195} y={110} width={70} height={50} color="rgba(217,119,6,0.15)" />
            <PitchLabel x={230} y={130} text="Clearance zone" color={C.primary} />
            {/* 4 players ringing the clearance zone */}
            <PlayerDot x={190} y={105} label="8" type="attack" size={9} />
            <PlayerDot x={270} y={115} label="10" type="attack" size={9} />
            <PlayerDot x={190} y={155} label="6" type="attack" size={9} />
            <PlayerDot x={270} y={150} label="11" type="attack" size={9} />
            {/* Arrows converging on clearance zone */}
            <MovementArrow x1={190} y1={107} x2={205} y2={118} dashed color={C.primary} />
            <MovementArrow x1={270} y1={117} x2={255} y2={125} dashed color={C.primary} />
            <MovementArrow x1={190} y1={153} x2={205} y2={145} dashed color={C.primary} />
            <MovementArrow x1={270} y1={148} x2={255} y2={140} dashed color={C.primary} />
            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 13 — Delayed Delivery */}
      <SectionCard title='Routine 13: "Delayed Delivery"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          All attackers make decoy runs before the ball is delivered, dragging defenders with them. The taker holds the ball for 3–4 seconds, then delivers into the vacated space as one attacker peels back.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <CornerFlag side="right" />
            {/* Taker holding */}
            <PlayerDot x={318} y={18} label="MW" type="attack" size={9} />
            <PitchLabel x={290} y={35} text="Hold 3-4s" color={C.primary} />
            {/* 5 decoy run arrows — attackers dragging defenders away */}
            <PlayerDot x={200} y={80} label="9" type="attack" size={9} />
            <MovementArrow x1={200} y1={78} x2={250} y2={50} dashed color={C.textSec} />
            <PlayerDot x={180} y={90} label="5" type="attack" size={9} />
            <MovementArrow x1={180} y1={88} x2={140} y2={55} dashed color={C.textSec} />
            <PlayerDot x={220} y={100} label="10" type="attack" size={9} />
            <MovementArrow x1={220} y1={98} x2={270} y2={65} dashed color={C.textSec} />
            <PlayerDot x={160} y={100} label="8" type="attack" size={9} />
            <MovementArrow x1={160} y1={98} x2={120} y2={70} dashed color={C.textSec} />
            <PlayerDot x={210} y={115} label="11" type="attack" size={9} />
            <MovementArrow x1={210} y1={113} x2={260} y2={85} dashed color={C.textSec} />
            <PitchLabel x={265} y={48} text="Decoy runs" color={C.textSec} />
            {/* Vacated zone */}
            <ZoneHighlight x={175} y={60} width={60} height={40} color="rgba(217,119,6,0.15)" />
            <PitchLabel x={205} y={75} text="Vacated" color={C.primary} />
            {/* Attacker peeling back into vacated zone */}
            <MovementArrow x1={250} y1={50} x2={200} y2={72} dashed={false} color={C.primary} />
            <PitchLabel x={240} y={60} text="Peel back" color={C.primary} />
            {/* Ball flight into vacated zone */}
            <BallFlight x1={315} y1={15} x2={195} y2={70} cx={270} cy={10} color={C.primary} />
            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 14 — Driven Low — Penalty Crash */}
      <SectionCard title='Routine 14: "Driven Low — Penalty Crash"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Low, flat delivery driven along the ground to the penalty spot. Three runners crash in from different angles to attack the ball first.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <CornerFlag side="right" />
            {/* Taker */}
            <PlayerDot x={318} y={18} label="MW" type="attack" size={9} />
            {/* Driven ground-level delivery to penalty spot */}
            <MovementArrow x1={315} y1={17} x2={170} y2={105} dashed={false} color={C.primary} />
            <PitchLabel x={240} y={55} text="Driven low" color={C.primary} />
            {/* Penalty spot zone */}
            <ZoneHighlight x={150} y={90} width={45} height={30} color="rgba(217,119,6,0.18)" />
            <PitchLabel x={172} y={125} text="Pen. spot" color={C.primary} />
            {/* 3 crash runners from different angles */}
            <PlayerDot x={120} y={130} label="5" type="attack" size={9} />
            <MovementArrow x1={120} y1={128} x2={160} y2={100} dashed color={C.primary} />
            <PlayerDot x={230} y={120} label="9" type="attack" size={9} />
            <MovementArrow x1={230} y1={118} x2={185} y2={100} dashed color={C.primary} />
            <PlayerDot x={170} y={155} label="10" type="attack" size={9} />
            <MovementArrow x1={170} y1={153} x2={172} y2={118} dashed color={C.primary} />
            <PitchLabel x={120} y={145} text="Crash" color={C.primary} />
            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 15 — Overhit — Winger Collects */}
      <SectionCard title='Routine 15: "Overhit — Winger Collects"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Deliberately overhit the corner beyond the far post. The winger collects wide and either shoots from the angle or recycles possession back into the box.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <CornerFlag side="right" />
            {/* Taker */}
            <PlayerDot x={318} y={18} label="MW" type="attack" size={9} />
            {/* Overhit ball arc past the box */}
            <BallFlight x1={315} y1={15} x2={80} y2={75} cx={200} cy={-10} color={C.primary} />
            <PitchLabel x={120} y={55} text="Overhit" color={C.primary} />
            {/* Winger collecting wide */}
            <PlayerDot x={75} y={78} label="7" type="attack" size={9} />
            <PitchLabel x={55} y={95} text="Winger" color={C.primary} />
            {/* Option 1: shot from angle */}
            <MovementArrow x1={78} y1={76} x2={150} y2={25} dashed={false} color={C.primary} />
            <PitchLabel x={100} y={40} text="Shot" color={C.primary} />
            {/* Option 2: recycle pass back */}
            <MovementArrow x1={78} y1={80} x2={140} y2={110} dashed color={C.textSec} />
            <PitchLabel x={115} y={118} text="Recycle" color={C.textSec} />
            {/* Attackers in box */}
            <PlayerDot x={170} y={70} label="9" type="attack" size={8} />
            <PlayerDot x={200} y={85} label="5" type="attack" size={8} />
            <PlayerDot x={155} y={105} label="10" type="attack" size={8} />
            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 16 — CB Arriving from Deep */}
      <SectionCard title='Routine 16: "CB Arriving from Deep"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Centre-back stays near the halfway line while all other attackers crowd the box. The CB sprints in late, arriving unmarked at the edge of the box to meet a timed delivery.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <CornerFlag side="right" />
            {/* Taker */}
            <PlayerDot x={318} y={18} label="MW" type="attack" size={9} />
            {/* CB starting deep near halfway */}
            <PlayerDot x={170} y={245} label="4" type="attack" size={10} />
            <PitchLabel x={185} y={248} text="CB waits" color={C.textSec} />
            {/* Sprint arrow from halfway to edge of box */}
            <MovementArrow x1={170} y1={243} x2={170} y2={130} dashed={false} color={C.primary} />
            <PitchLabel x={145} y={185} text="Sprint late" color={C.primary} />
            {/* Edge of box arrival zone */}
            <ZoneHighlight x={150} y={120} width={45} height={25} color="rgba(217,119,6,0.15)" />
            {/* Timed ball delivery to meet arrival */}
            <BallFlight x1={315} y1={15} x2={172} y2={130} cx={260} cy={40} color={C.primary} />
            <PitchLabel x={250} y={80} text="Timed" color={C.primary} />
            {/* Other attackers in the box as decoys */}
            <PlayerDot x={190} y={70} label="9" type="attack" size={8} />
            <PlayerDot x={210} y={85} label="5" type="attack" size={8} />
            <PlayerDot x={155} y={80} label="10" type="attack" size={8} />
            <PlayerDot x={230} y={70} label="8" type="attack" size={8} />
            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 17 — Mirror Switch */}
      <SectionCard title='Routine 17: "Mirror Switch"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Set up identically to Routine 1 (near-post runs), but at the last moment the delivery switches to an outswinger. All runners redirect to the far post, catching the defence off-guard.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <CornerFlag side="right" />
            {/* Taker */}
            <PlayerDot x={318} y={18} label="MW" type="attack" size={9} />
            {/* Initial near-post positions (faded) */}
            <PlayerDot x={220} y={60} label="9" type="attack" size={8} />
            <PlayerDot x={230} y={75} label="5" type="attack" size={8} />
            <PlayerDot x={215} y={80} label="10" type="attack" size={8} />
            <PitchLabel x={240} y={55} text="Setup" color={C.textSec} />
            {/* Redirect arrows — all switching to far post */}
            <MovementArrow x1={220} y1={62} x2={140} y2={55} dashed={false} color={C.primary} />
            <MovementArrow x1={230} y1={77} x2={145} y2={65} dashed={false} color={C.primary} />
            <MovementArrow x1={215} y1={82} x2={135} y2={75} dashed={false} color={C.primary} />
            <PitchLabel x={115} y={50} text="Far post" color={C.primary} />
            {/* Outswinger arc delivery */}
            <BallFlight x1={315} y1={15} x2={140} y2={60} cx={240} cy={-5} color={C.primary} />
            <PitchLabel x={260} y={10} text="Outswinger" color={C.primary} />
            {/* Far post zone */}
            <ZoneHighlight x={120} y={45} width={40} height={40} color="rgba(217,119,6,0.15)" />
            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
          </PitchSVG>
        </div>
      </SectionCard>
    </>
  )
}

function CornersDefending() {
  return (
    <>
      {/* Zonal */}
      <SectionCard title="Zonal Defending Setup" onEdit={() => {}}>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* Zonal line */}
            <ZoneHighlight x={150} y={55} width={100} height={12} color="rgba(239,68,68,0.15)" />
            <PlayerDot x={160} y={60} label="D1" type="defend" size={9} />
            <PlayerDot x={185} y={60} label="D2" type="defend" size={9} />
            <PlayerDot x={210} y={60} label="D3" type="defend" size={9} />
            <PlayerDot x={235} y={60} label="D4" type="defend" size={9} />

            {/* Post players */}
            <PlayerDot x={155} y={22} label="P1" type="defend" size={8} />
            <PitchLabel x={155} y={35} text="Near post" color={C.textSec} />
            <PlayerDot x={195} y={22} label="P2" type="defend" size={8} />
            <PitchLabel x={195} y={35} text="Far post" color={C.textSec} />

            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Man-to-man */}
      <SectionCard title="Man-to-Man Marking Setup" onEdit={() => {}}>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* Attackers */}
            <PlayerDot x={175} y={70} label="A1" type="attack" size={8} />
            <PlayerDot x={200} y={85} label="A2" type="attack" size={8} />
            <PlayerDot x={155} y={55} label="A3" type="attack" size={8} />
            <PlayerDot x={230} y={65} label="A4" type="attack" size={8} />

            {/* Defenders marking */}
            <PlayerDot x={180} y={78} label="D1" type="defend" size={8} />
            <PlayerDot x={205} y={93} label="D2" type="defend" size={8} />
            <PlayerDot x={160} y={63} label="D3" type="defend" size={8} />
            <PlayerDot x={235} y={73} label="D4" type="defend" size={8} />

            {/* Marking lines */}
            <MarkingLine x1={180} y1={78} x2={175} y2={70} color="#EF4444" />
            <MarkingLine x1={205} y1={93} x2={200} y2={85} color="#EF4444" />
            <MarkingLine x1={160} y1={63} x2={155} y2={55} color="#EF4444" />
            <MarkingLine x1={235} y1={73} x2={230} y2={65} color="#EF4444" />

            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Setup 3 — Aggressive Near Post Press */}
      <SectionCard title='Setup 3: "Aggressive Near Post Press"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          2 players press the corner taker aggressively; rest set up zonally in the box.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* 2 press arrows to corner */}
            <PlayerDot x={280} y={40} label="D1" type="defend" size={9} />
            <MovementArrow x1={280} y1={38} x2={310} y2={20} dashed color="#EF4444" />
            <PlayerDot x={290} y={55} label="D2" type="defend" size={9} />
            <MovementArrow x1={290} y1={53} x2={312} y2={25} dashed color="#EF4444" />
            <PitchLabel x={300} y={15} text="Press" color="#EF4444" />
            {/* Zonal line in box */}
            <ZoneHighlight x={150} y={55} width={100} height={12} color="rgba(239,68,68,0.15)" />
            <PlayerDot x={160} y={60} label="D3" type="defend" size={9} />
            <PlayerDot x={185} y={60} label="D4" type="defend" size={9} />
            <PlayerDot x={210} y={60} label="D5" type="defend" size={9} />
            <PlayerDot x={235} y={60} label="D6" type="defend" size={9} />
            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Setup 4 — Back 4 Zonal + 2 Man-Markers */}
      <SectionCard title='Setup 4: "Back 4 Zonal + 2 Man-Markers"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          4-man zonal wall across 6-yard box, 2 man-markers on aerial threats, GK front post.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* 4 zonal defenders in line */}
            <ZoneHighlight x={155} y={42} width={90} height={12} color="rgba(239,68,68,0.15)" />
            <PlayerDot x={165} y={47} label="D1" type="defend" size={9} />
            <PlayerDot x={185} y={47} label="D2" type="defend" size={9} />
            <PlayerDot x={205} y={47} label="D3" type="defend" size={9} />
            <PlayerDot x={225} y={47} label="D4" type="defend" size={9} />
            {/* 2 man-markers with marking lines to attackers */}
            <PlayerDot x={175} y={80} label="A1" type="attack" size={8} />
            <PlayerDot x={180} y={88} label="D5" type="defend" size={9} />
            <MarkingLine x1={180} y1={88} x2={175} y2={80} color="#EF4444" />
            <PlayerDot x={220} y={75} label="A2" type="attack" size={8} />
            <PlayerDot x={225} y={83} label="D6" type="defend" size={9} />
            <MarkingLine x1={225} y1={83} x2={220} y2={75} color="#EF4444" />
            {/* GK front post */}
            <PlayerDot x={185} y={18} label="GK" type="gk" size={9} />
            <PitchLabel x={185} y={30} text="Front post" color={C.textSec} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Setup 5 — Counter-Attack Leave 2 High */}
      <SectionCard title='Setup 5: "Counter-Attack Leave 2 High"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Defend the box with 8 players; leave 2 forwards on the halfway line ready to counter.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* Defensive shape in box — 8 players */}
            <ZoneHighlight x={140} y={40} width={110} height={80} color="rgba(239,68,68,0.06)" />
            <PlayerDot x={160} y={55} label="D1" type="defend" size={8} />
            <PlayerDot x={185} y={55} label="D2" type="defend" size={8} />
            <PlayerDot x={210} y={55} label="D3" type="defend" size={8} />
            <PlayerDot x={235} y={55} label="D4" type="defend" size={8} />
            <PlayerDot x={170} y={80} label="D5" type="defend" size={8} />
            <PlayerDot x={195} y={80} label="D6" type="defend" size={8} />
            <PlayerDot x={220} y={80} label="D7" type="defend" size={8} />
            <PlayerDot x={155} y={100} label="D8" type="defend" size={8} />
            {/* 2 forwards left high */}
            <PlayerDot x={120} y={240} label="9" type="defend" size={9} />
            <PlayerDot x={220} y={240} label="11" type="defend" size={9} />
            <MovementArrow x1={120} y1={238} x2={120} y2={200} dashed color={C.primary} />
            <MovementArrow x1={220} y1={238} x2={220} y2={200} dashed color={C.primary} />
            <PitchLabel x={170} y={235} text="Counter" color={C.primary} />
            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Setup 6 — Full Man-Mark */}
      <SectionCard title='Setup 6: "Full Man-Mark"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Every attacker in the box man-marked. No zonal element. GK claims crosses.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* Paired markers with connecting lines */}
            <PlayerDot x={165} y={60} label="A1" type="attack" size={8} />
            <PlayerDot x={170} y={68} label="D1" type="defend" size={8} />
            <MarkingLine x1={170} y1={68} x2={165} y2={60} color="#EF4444" />
            <PlayerDot x={195} y={55} label="A2" type="attack" size={8} />
            <PlayerDot x={200} y={63} label="D2" type="defend" size={8} />
            <MarkingLine x1={200} y1={63} x2={195} y2={55} color="#EF4444" />
            <PlayerDot x={225} y={65} label="A3" type="attack" size={8} />
            <PlayerDot x={230} y={73} label="D3" type="defend" size={8} />
            <MarkingLine x1={230} y1={73} x2={225} y2={65} color="#EF4444" />
            <PlayerDot x={180} y={90} label="A4" type="attack" size={8} />
            <PlayerDot x={185} y={98} label="D4" type="defend" size={8} />
            <MarkingLine x1={185} y1={98} x2={180} y2={90} color="#EF4444" />
            <PlayerDot x={210} y={85} label="A5" type="attack" size={8} />
            <PlayerDot x={215} y={93} label="D5" type="defend" size={8} />
            <MarkingLine x1={215} y1={93} x2={210} y2={85} color="#EF4444" />
            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Setup 7 — GK Dominates — Claim Everything */}
      <SectionCard title='Setup 7: "GK Dominates — Claim Everything"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          GK comes aggressively for every cross. Defenders screen and block runners.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* GK movement zone */}
            <ZoneHighlight x={150} y={20} width={60} height={60} color="rgba(34,197,94,0.12)" />
            <PlayerDot x={170} y={25} label="GK" type="gk" size={10} />
            <MovementArrow x1={170} y1={28} x2={190} y2={55} dashed color="#22C55E" />
            <MovementArrow x1={170} y1={28} x2={155} y2={55} dashed color="#22C55E" />
            <PitchLabel x={170} y={15} text="Claims" color="#22C55E" />
            {/* Screening defenders */}
            <PlayerDot x={200} y={70} label="D1" type="defend" size={9} />
            <PlayerDot x={220} y={75} label="D2" type="defend" size={9} />
            <PlayerDot x={155} y={70} label="D3" type="defend" size={9} />
            <PlayerDot x={240} y={65} label="D4" type="defend" size={9} />
            <PitchLabel x={200} y={85} text="Screen" color={C.textSec} />
          </PitchSVG>
        </div>
      </SectionCard>
    </>
  )
}

/* ============================================================
   FREE KICKS TAB
   ============================================================ */

function FreeKicksTab() {
  const [sub, setSub] = useState<FKSub>('Shooting')

  return (
    <>
      <SubTabBar
        tabs={['Shooting', 'Wide', 'Deep', 'Defending'] as FKSub[]}
        active={sub}
        onChange={setSub}
      />

      {sub === 'Shooting' && <FKShooting />}
      {sub === 'Wide' && <FKWide />}
      {sub === 'Deep' && <FKDeep />}
      {sub === 'Defending' && <FKDefending />}
    </>
  )
}

function FKShooting() {
  return (
    <>
      {/* Direct Shot */}
      <SectionCard title='Routine 1: "Direct Shot"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Shooter lines up centrally, strikes over or around the wall.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />

            {/* Defensive wall */}
            <DefensiveWall x={160} y={100} count={4} color="#EF4444" />

            {/* Shooter */}
            <PlayerDot x={170} y={150} label="MW" type="attack" size={10} />
            <PitchLabel x={170} y={165} text="Shooter" color={C.primary} />

            {/* Ball flight over wall */}
            <BallFlight x1={170} y1={148} x2={170} y2={18} cx={130} cy={70} color={C.primary} />

            {/* Dummy runners */}
            <PlayerDot x={140} y={145} label="8" type="attack" size={8} />
            <PlayerDot x={200} y={145} label="10" type="attack" size={8} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Dummy Layoff */}
      <SectionCard title='Routine 2: "Dummy Layoff"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Runner dummies over the ball; second player arrives to strike.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
            <DefensiveWall x={160} y={100} count={4} color="#EF4444" />

            {/* Ball position */}
            <PlayerDot x={170} y={150} label="" type="ball" size={6} />

            {/* Dummy runner goes over ball */}
            <PlayerDot x={155} y={160} label="8" type="attack" size={9} />
            <MovementArrow x1={155} y1={158} x2={155} y2={130} dashed color={C.textSec} />
            <PitchLabel x={135} y={140} text="Dummy" color={C.textSec} />

            {/* Arriving shooter */}
            <PlayerDot x={200} y={170} label="LG" type="attack" size={10} />
            <MovementArrow x1={200} y1={168} x2={174} y2={152} dashed color={C.primary} />
            <PitchLabel x={215} y={178} text="Strike" color={C.primary} />

            {/* Shot */}
            <BallFlight x1={174} y1={150} x2={175} y2={18} cx={210} cy={75} color={C.primary} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 3 — One-Two — Shoot */}
      <SectionCard title='Routine 3: "One-Two — Shoot"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Player 1 taps sideways to Player 2 who shoots first time past the wall.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
            <DefensiveWall x={160} y={100} count={4} color="#EF4444" />
            {/* Player 1 taps sideways */}
            <PlayerDot x={170} y={150} label="8" type="attack" size={9} />
            <MovementArrow x1={170} y1={148} x2={210} y2={148} dashed={false} color={C.text} />
            <PitchLabel x={190} y={160} text="Tap" color={C.textSec} />
            {/* Player 2 shoots */}
            <PlayerDot x={215} y={148} label="LG" type="attack" size={10} />
            <BallFlight x1={215} y1={146} x2={165} y2={18} cx={220} cy={70} color={C.primary} />
            <PitchLabel x={230} y={145} text="Shoot" color={C.primary} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 4 — Triple Dummy */}
      <SectionCard title='Routine 4: "Triple Dummy"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          3 players stand over ball and dummy; 4th runs in from deep and strikes.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
            <DefensiveWall x={160} y={100} count={4} color="#EF4444" />
            {/* Ball */}
            <PlayerDot x={170} y={155} label="" type="ball" size={6} />
            {/* 3 dummies standing over ball */}
            <PlayerDot x={155} y={155} label="8" type="attack" size={8} />
            <PlayerDot x={170} y={165} label="10" type="attack" size={8} />
            <PlayerDot x={185} y={155} label="11" type="attack" size={8} />
            <PitchLabel x={170} y={178} text="Dummies" color={C.textSec} />
            {/* Late runner from deep */}
            <PlayerDot x={170} y={220} label="MW" type="attack" size={10} />
            <MovementArrow x1={170} y1={218} x2={170} y2={158} dashed color={C.primary} />
            <PitchLabel x={185} y={210} text="Late run" color={C.primary} />
            {/* Shot */}
            <BallFlight x1={170} y1={155} x2={170} y2={18} cx={130} cy={80} color={C.primary} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 5 — Driven Low Under Wall */}
      <SectionCard title='Routine 5: "Driven Low Under Wall"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Ball driven hard and low beneath the jumping wall.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
            {/* Wall jumping — slightly higher position to indicate jump */}
            <DefensiveWall x={160} y={95} count={4} color="#EF4444" />
            <PitchLabel x={175} y={90} text="Jumping" color={C.textSec} />
            {/* Shooter */}
            <PlayerDot x={170} y={150} label="LG" type="attack" size={10} />
            <PitchLabel x={170} y={165} text="Low drive" color={C.primary} />
            {/* Ball going under wall — straight low line */}
            <MovementArrow x1={170} y1={148} x2={170} y2={18} dashed={false} color={C.primary} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 6 — Far Post Swerve */}
      <SectionCard title='Routine 6: "Far Post Swerve"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Right-footer from left side; ball swerves around the wall to far post. Tall player stationed there.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
            <DefensiveWall x={140} y={100} count={4} color="#EF4444" />
            {/* Shooter from left side */}
            <PlayerDot x={120} y={150} label="MW" type="attack" size={10} />
            <PitchLabel x={120} y={165} text="Swerve" color={C.primary} />
            {/* Curved swerve to far post */}
            <BallFlight x1={120} y1={148} x2={195} y2={20} cx={220} cy={80} color={C.primary} />
            {/* Tall player at far post */}
            <PlayerDot x={195} y={22} label="5" type="attack" size={9} />
            <PitchLabel x={195} y={35} text="Far post" color={C.textSec} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 7 — Quick Tap — Into Space */}
      <SectionCard title='Routine 7: "Quick Tap — Into Space"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Take it immediately before opposition sets up. Pass into space behind the defence.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
            {/* No wall formed yet — opponents scattered */}
            <PlayerDot x={160} y={110} label="D" type="defend" size={7} />
            <PlayerDot x={200} y={105} label="D" type="defend" size={7} />
            <PitchLabel x={180} y={120} text="No wall yet" color={C.textSec} />
            {/* Quick taker */}
            <PlayerDot x={170} y={155} label="8" type="attack" size={10} />
            <PitchLabel x={170} y={168} text="Quick!" color={C.primary} />
            {/* Arrow into space behind defence */}
            <MovementArrow x1={170} y1={153} x2={220} y2={60} dashed={false} color={C.primary} />
            <ZoneHighlight x={200} y={40} width={50} height={40} color="rgba(217,119,6,0.12)" />
            <PitchLabel x={225} y={55} text="Space" color={C.primary} />
            {/* Runner into space */}
            <PlayerDot x={230} y={120} label="9" type="attack" size={9} />
            <MovementArrow x1={230} y1={118} x2={225} y2={65} dashed color={C.primary} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 8 — Double Bluff — Same Taker */}
      <SectionCard title='Routine 8: "Double Bluff — Same Taker"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Taker shapes to shoot, runs over the ball, circles back and strikes on the second approach. Wall and GK commit early on the first movement.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
            <DefensiveWall x={160} y={100} count={4} color="#EF4444" />
            {/* Ball position */}
            <PlayerDot x={170} y={155} label="" type="ball" size={6} />
            {/* Taker initial position */}
            <PlayerDot x={170} y={180} label="MW" type="attack" size={10} />
            {/* Run-over — circular path */}
            <MovementArrow x1={170} y1={178} x2={170} y2={158} dashed color={C.textSec} />
            <PitchLabel x={150} y={165} text="Shape" color={C.textSec} />
            {/* Circle back arrow */}
            <MovementArrow x1={170} y1={158} x2={200} y2={170} dashed color={C.primary} />
            <MovementArrow x1={200} y1={170} x2={175} y2={185} dashed color={C.primary} />
            <PitchLabel x={210} y={178} text="Circle back" color={C.primary} />
            {/* Second strike */}
            <BallFlight x1={170} y1={153} x2={170} y2={18} cx={130} cy={75} color={C.primary} />
            <PitchLabel x={125} y={80} text="Strike" color={C.primary} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 9 — Wall Split */}
      <SectionCard title='Routine 9: "Wall Split"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Two attackers legally positioned inside the defensive wall. On the whistle they split apart, creating a gap. Shooter fires through the opening.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
            {/* Defensive wall */}
            <DefensiveWall x={155} y={100} count={4} color="#EF4444" />
            {/* 2 amber attackers in the wall splitting */}
            <PlayerDot x={172} y={100} label="8" type="attack" size={9} />
            <MovementArrow x1={172} y1={100} x2={150} y2={85} dashed color={C.primary} />
            <PlayerDot x={180} y={100} label="10" type="attack" size={9} />
            <MovementArrow x1={180} y1={100} x2={202} y2={85} dashed color={C.primary} />
            <PitchLabel x={176} y={82} text="Split!" color={C.primary} />
            {/* Gap zone */}
            <ZoneHighlight x={170} y={92} width={14} height={20} color="rgba(217,119,6,0.18)" />
            {/* Shooter */}
            <PlayerDot x={177} y={155} label="LG" type="attack" size={10} />
            <PitchLabel x={177} y={168} text="Shoot" color={C.primary} />
            {/* Shot through gap */}
            <MovementArrow x1={177} y1={153} x2={177} y2={18} dashed={false} color={C.primary} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 10 — Chip Over to Runner */}
      <SectionCard title='Routine 10: "Chip Over to Runner"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Chip the ball over the wall to a runner arriving from the blind side for a header or volley on goal.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
            <DefensiveWall x={160} y={100} count={4} color="#EF4444" />
            {/* Taker */}
            <PlayerDot x={170} y={155} label="8" type="attack" size={10} />
            <PitchLabel x={170} y={168} text="Chip" color={C.primary} />
            {/* Chip arc over wall */}
            <BallFlight x1={170} y1={153} x2={200} y2={70} cx={170} cy={80} color={C.primary} />
            {/* Runner arriving from blind side */}
            <PlayerDot x={250} y={110} label="10" type="attack" size={9} />
            <MovementArrow x1={250} y1={108} x2={202} y2={74} dashed color={C.primary} />
            <PitchLabel x={255} y={100} text="Blind side" color={C.primary} />
            {/* Runner meets ball for header/volley */}
            <ZoneHighlight x={185} y={55} width={35} height={30} color="rgba(217,119,6,0.10)" />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 11 — Blocked Rebound */}
      <SectionCard title='Routine 11: "Blocked Rebound"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Deliberately shoot into the wall. Two players positioned either side to pounce on the rebound and strike at goal.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
            <DefensiveWall x={160} y={100} count={4} color="#EF4444" />
            {/* Shooter */}
            <PlayerDot x={170} y={155} label="LG" type="attack" size={10} />
            <PitchLabel x={170} y={168} text="Into wall" color={C.textSec} />
            {/* Shot into wall */}
            <MovementArrow x1={170} y1={153} x2={170} y2={108} dashed={false} color={C.textSec} />
            <PitchLabel x={175} y={115} text="Block" color={C.textSec} />
            {/* Rebound zone */}
            <ZoneHighlight x={145} y={110} width={50} height={30} color="rgba(217,119,6,0.12)" />
            {/* Positioned player left */}
            <PlayerDot x={130} y={120} label="8" type="attack" size={9} />
            <MovementArrow x1={130} y1={118} x2={155} y2={108} dashed color={C.primary} />
            {/* Positioned player right */}
            <PlayerDot x={215} y={115} label="10" type="attack" size={9} />
            <MovementArrow x1={215} y1={113} x2={192} y2={108} dashed color={C.primary} />
            <PitchLabel x={170} y={145} text="Rebound" color={C.primary} />
            {/* Second shot from rebound */}
            <BallFlight x1={155} y1={108} x2={170} y2={18} cx={130} cy={55} color={C.primary} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 12 — Knuckleball */}
      <SectionCard title='Routine 12: "Knuckleball"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          No-spin strike with an unpredictable, dipping trajectory. Only assigned to the specialist — the ball moves laterally in flight, making it nearly impossible to read.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
            <DefensiveWall x={160} y={100} count={4} color="#EF4444" />
            {/* Specialist shooter */}
            <PlayerDot x={170} y={155} label="MW" type="attack" size={10} />
            <PitchLabel x={170} y={168} text="Specialist" color={C.primary} />
            {/* Wobbly/unpredictable ball flight — zigzag segments */}
            <MovementArrow x1={170} y1={153} x2={165} y2={130} dashed={false} color={C.primary} />
            <MovementArrow x1={165} y1={130} x2={178} y2={110} dashed={false} color={C.primary} />
            <MovementArrow x1={178} y1={110} x2={160} y2={85} dashed={false} color={C.primary} />
            <MovementArrow x1={160} y1={85} x2={175} y2={60} dashed={false} color={C.primary} />
            <MovementArrow x1={175} y1={60} x2={165} y2={35} dashed={false} color={C.primary} />
            <MovementArrow x1={165} y1={35} x2={172} y2={18} dashed={false} color={C.primary} />
            <PitchLabel x={130} y={90} text="Knuckle" color={C.primary} />
            {/* No-spin indicator */}
            <PitchLabel x={195} y={60} text="No spin" color={C.textSec} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 13 — Curved Run — Blind Side */}
      <SectionCard title='Routine 13: "Curved Run — Blind Side"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          The shooter approaches from a wide angle with a curved run, disguising the intended shot direction. The arc of the approach allows a natural curl to the opposite corner.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
            {/* Ball position */}
            <PlayerDot x={170} y={140} label="" type="ball" size={6} />
            {/* Defensive wall */}
            <DefensiveWall x={170} y={120} count={4} />
            {/* Shooter starting wide */}
            <PlayerDot x={100} y={175} label="LG" type="attack" size={9} />
            <PitchLabel x={80} y={190} text="Start wide" color={C.textSec} />
            {/* Curved approach run */}
            <BallFlight x1={100} y1={173} x2={168} y2={142} cx={130} cy={130} color={C.primary} />
            <PitchLabel x={115} y={145} text="Curved run" color={C.primary} />
            {/* Shot curling to opposite corner */}
            <BallFlight x1={170} y1={138} x2={200} y2={18} cx={210} cy={75} color={C.primary} />
            <PitchLabel x={210} y={55} text="Curl shot" color={C.primary} />
            {/* Target zone — far corner */}
            <ZoneHighlight x={190} y={8} width={25} height={18} color="rgba(217,119,6,0.18)" />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 14 — Two-Wall Chaos */}
      <SectionCard title='Routine 14: "Two-Wall Chaos"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Two attackers form a second wall directly in front of the defensive wall. On the whistle they split apart, creating momentary confusion and a gap for the shot to pass through.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
            {/* Ball position */}
            <PlayerDot x={170} y={150} label="" type="ball" size={6} />
            {/* Defensive wall (red) */}
            <DefensiveWall x={170} y={120} count={4} />
            <PitchLabel x={210} y={118} text="Def. wall" color="#EF4444" />
            {/* Attacking wall in front (amber) */}
            <PlayerDot x={160} y={130} label="A1" type="attack" size={9} />
            <PlayerDot x={180} y={130} label="A2" type="attack" size={9} />
            <PitchLabel x={145} y={140} text="Att. wall" color={C.primary} />
            {/* Split arrows on whistle */}
            <MovementArrow x1={158} y1={130} x2={120} y2={125} dashed={false} color={C.primary} />
            <MovementArrow x1={182} y1={130} x2={220} y2={125} dashed={false} color={C.primary} />
            <PitchLabel x={105} y={122} text="Split" color={C.primary} />
            {/* Shot through the gap */}
            <MovementArrow x1={170} y1={148} x2={170} y2={22} dashed={false} color={C.primary} />
            <PitchLabel x={180} y={80} text="Shot through" color={C.primary} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 15 — Delayed Strike */}
      <SectionCard title='Routine 15: "Delayed Strike"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          The designated taker walks away from the ball as if confused. A second taker arrives quickly and strikes before the wall can reset or focus.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
            {/* Ball position */}
            <PlayerDot x={170} y={150} label="" type="ball" size={6} />
            {/* Defensive wall */}
            <DefensiveWall x={170} y={120} count={4} />
            {/* First taker walking away (dashed) */}
            <PlayerDot x={155} y={160} label="LG" type="attack" size={9} />
            <MovementArrow x1={155} y1={162} x2={120} y2={185} dashed color={C.textSec} />
            <PitchLabel x={95} y={190} text="Walks away" color={C.textSec} />
            {/* Second taker arriving */}
            <PlayerDot x={210} y={180} label="JW" type="attack" size={9} />
            <MovementArrow x1={210} y1={178} x2={175} y2={152} dashed={false} color={C.primary} />
            <PitchLabel x={215} y={170} text="Arrives" color={C.primary} />
            {/* Strike */}
            <MovementArrow x1={170} y1={148} x2={155} y2={20} dashed={false} color={C.primary} />
            <PitchLabel x={145} y={80} text="Strike" color={C.primary} />
            {/* Target zone */}
            <ZoneHighlight x={140} y={8} width={30} height={18} color="rgba(217,119,6,0.18)" />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 16 — Cross Instead of Shot */}
      <SectionCard title='Routine 16: "Cross Instead of Shot"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          From shooting range, deliver a cross to the far post instead. The defence expects a shot, drops to block, and an unmarked attacker heads in at the back post.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
            {/* Ball position */}
            <PlayerDot x={170} y={145} label="" type="ball" size={6} />
            {/* Defensive wall */}
            <DefensiveWall x={170} y={118} count={4} />
            {/* Taker */}
            <PlayerDot x={175} y={155} label="LG" type="attack" size={9} />
            {/* Cross arc to far post */}
            <BallFlight x1={170} y1={143} x2={245} y2={40} cx={240} cy={90} color={C.primary} />
            <PitchLabel x={240} y={75} text="Cross" color={C.primary} />
            {/* Unmarked attacker at far post */}
            <PlayerDot x={245} y={38} label="9" type="attack" size={9} />
            <PitchLabel x={255} y={35} text="Header" color={C.primary} />
            {/* Far post zone */}
            <ZoneHighlight x={230} y={25} width={35} height={30} color="rgba(217,119,6,0.15)" />
            {/* Header arrow to goal */}
            <MovementArrow x1={245} y1={36} x2={195} y2={15} dashed={false} color={C.primary} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 17 — Pass Into Box */}
      <SectionCard title='Routine 17: "Pass Into Box"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Played like an indirect free kick — a short pass into the feet of an attacker inside the box who turns and shoots immediately.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
            {/* Ball position */}
            <PlayerDot x={170} y={145} label="" type="ball" size={6} />
            {/* Defensive wall */}
            <DefensiveWall x={170} y={118} count={4} />
            {/* Taker */}
            <PlayerDot x={175} y={155} label="LG" type="attack" size={9} />
            {/* Pass arrow into box to attacker's feet */}
            <MovementArrow x1={170} y1={143} x2={210} y2={95} dashed={false} color={C.primary} />
            <PitchLabel x={195} y={120} text="Pass" color={C.primary} />
            {/* Attacker receiving in box */}
            <PlayerDot x={212} y={93} label="10" type="attack" size={9} />
            <PitchLabel x={225} y={90} text="Receive" color={C.textSec} />
            {/* Turn indicator */}
            <BallFlight x1={212} y1={91} x2={208} y2={85} cx={220} cy={85} color={C.primary} />
            <PitchLabel x={225} y={78} text="Turn" color={C.primary} />
            {/* Shot to goal */}
            <MovementArrow x1={208} y1={83} x2={175} y2={20} dashed={false} color={C.primary} />
            <PitchLabel x={180} y={50} text="Shot" color={C.primary} />
            {/* Target zone */}
            <ZoneHighlight x={160} y={8} width={30} height={18} color="rgba(217,119,6,0.18)" />
          </PitchSVG>
        </div>
      </SectionCard>
    </>
  )
}

function FKWide() {
  return (
    <SectionCard title='Routine: "Inswinger Cross"' onEdit={() => {}}>
      <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
        Wide free kick — inswinging delivery to the near-post zone.
      </p>
      <div style={{ overflowX: 'auto' }}>
        <PitchSVG width={340} height={260} halfPitch>
          <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />

          {/* FK taker wide right */}
          <PlayerDot x={290} y={110} label="MW" type="attack" size={9} />
          <PitchLabel x={290} y={125} text="Taker" color={C.primary} />

          {/* Inswinger ball flight */}
          <BallFlight x1={288} y1={108} x2={180} y2={60} cx={250} cy={40} color={C.primary} />

          {/* Runners in box */}
          <PlayerDot x={180} y={58} label="9" type="attack" size={9} />
          <PlayerDot x={165} y={72} label="5" type="attack" size={9} />
          <PlayerDot x={200} y={80} label="10" type="attack" size={9} />
          <MovementArrow x1={190} y1={90} x2={180} y2={62} dashed color={C.primary} />
          <MovementArrow x1={175} y1={100} x2={165} y2={76} dashed color={C.primary} />

          <ZoneHighlight x={155} y={45} width={60} height={50} color="rgba(217,119,6,0.10)" />
        </PitchSVG>
      </div>
    </SectionCard>
  )
}

function FKDeep() {
  return (
    <SectionCard title='Routine: "Long Ball to Target"' onEdit={() => {}}>
      <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
        Deep free kick — long delivery to target man attacking the back post.
      </p>
      <div style={{ overflowX: 'auto' }}>
        <PitchSVG width={340} height={500} halfPitch={false}>
          <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />

          {/* FK taker in own half */}
          <PlayerDot x={170} y={340} label="6" type="attack" size={9} />
          <PitchLabel x={170} y={355} text="Taker" color={C.primary} />

          {/* Long ball flight */}
          <BallFlight x1={170} y1={338} x2={155} y2={70} cx={80} cy={180} color={C.primary} />

          {/* Target man */}
          <PlayerDot x={155} y={68} label="9" type="attack" size={10} />
          <PitchLabel x={155} y={55} text="Target" color={C.primary} />

          {/* Supporting runner */}
          <PlayerDot x={200} y={100} label="10" type="attack" size={9} />
          <MovementArrow x1={210} y1={130} x2={200} y2={104} dashed color={C.primary} />
        </PitchSVG>
      </div>
    </SectionCard>
  )
}

function FKDefending() {
  return (
    <>
    <SectionCard title="Defensive Wall Setup" onEdit={() => {}}>
      <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
        Standard 4-man wall with GK positioning to cover far post.
      </p>
      <div style={{ overflowX: 'auto' }}>
        <PitchSVG width={340} height={260} halfPitch>
          <PlayerDot x={175} y={15} label="GK" type="gk" size={10} />

          {/* Defensive wall */}
          <DefensiveWall x={155} y={100} count={4} color="#EF4444" />
          <PitchLabel x={170} y={118} text="Wall (4)" color={C.textSec} />

          {/* Ball */}
          <PlayerDot x={170} y={155} label="" type="ball" size={7} />

          {/* Cover player behind wall */}
          <PlayerDot x={230} y={95} label="6" type="defend" size={9} />
          <PitchLabel x={230} y={83} text="Cover" color={C.textSec} />

          {/* Second cover */}
          <PlayerDot x={120} y={80} label="4" type="defend" size={9} />
        </PitchSVG>
      </div>
    </SectionCard>

    {/* Setup 3 — 5-Man Wall — Power Shooter */}
    <SectionCard title='Setup 3: "5-Man Wall — Power Shooter"' onEdit={() => {}}>
      <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
        5-man wall to reduce angles against power specialists. Remaining 6 outfield players pack the box.
      </p>
      <div style={{ overflowX: 'auto' }}>
        <PitchSVG width={340} height={260} halfPitch>
          <PlayerDot x={175} y={15} label="GK" type="gk" size={10} />
          {/* 5-man wall */}
          <DefensiveWall x={150} y={100} count={5} color="#EF4444" />
          <PitchLabel x={170} y={118} text="Wall (5)" color={C.textSec} />
          {/* Ball */}
          <PlayerDot x={170} y={155} label="" type="ball" size={7} />
          {/* Box defenders */}
          <PlayerDot x={130} y={70} label="D1" type="defend" size={8} />
          <PlayerDot x={210} y={70} label="D2" type="defend" size={8} />
          <PlayerDot x={160} y={55} label="D3" type="defend" size={8} />
          <PlayerDot x={195} y={55} label="D4" type="defend" size={8} />
          <PlayerDot x={240} y={90} label="D5" type="defend" size={8} />
          <PlayerDot x={115} y={90} label="D6" type="defend" size={8} />
        </PitchSVG>
      </div>
    </SectionCard>

    {/* Setup 4 — Wall Runner — Block Layoff */}
    <SectionCard title='Setup 4: "Wall Runner — Block Layoff"' onEdit={() => {}}>
      <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
        1 player sprints from the end of the wall towards the anticipated layoff target.
      </p>
      <div style={{ overflowX: 'auto' }}>
        <PitchSVG width={340} height={260} halfPitch>
          <PlayerDot x={175} y={15} label="GK" type="gk" size={10} />
          {/* Wall */}
          <DefensiveWall x={155} y={100} count={4} color="#EF4444" />
          {/* Wall runner breaking out */}
          <PlayerDot x={195} y={100} label="6" type="defend" size={9} />
          <MovementArrow x1={197} y1={100} x2={230} y2={140} dashed color="#EF4444" />
          <PitchLabel x={235} y={145} text="Block layoff" color="#EF4444" />
          {/* Ball */}
          <PlayerDot x={170} y={155} label="" type="ball" size={7} />
          {/* Anticipated layoff zone */}
          <ZoneHighlight x={210} y={130} width={50} height={30} color="rgba(239,68,68,0.10)" />
        </PitchSVG>
      </div>
    </SectionCard>

    {/* Setup 5 — Drop Deep + Sprint */}
    <SectionCard title='Setup 5: "Drop Deep + Sprint"' onEdit={() => {}}>
      <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
        All defenders drop 2 yards deeper, then sprint to ball on delivery.
      </p>
      <div style={{ overflowX: 'auto' }}>
        <PitchSVG width={340} height={260} halfPitch>
          <PlayerDot x={175} y={15} label="GK" type="gk" size={10} />
          <DefensiveWall x={155} y={100} count={4} color="#EF4444" />
          {/* Defenders starting deeper */}
          <PlayerDot x={140} y={80} label="D1" type="defend" size={8} />
          <PlayerDot x={210} y={80} label="D2" type="defend" size={8} />
          <PlayerDot x={160} y={65} label="D3" type="defend" size={8} />
          <PlayerDot x={195} y={65} label="D4" type="defend" size={8} />
          {/* Sprint arrows forward */}
          <MovementArrow x1={140} y1={78} x2={140} y2={55} dashed color="#EF4444" />
          <MovementArrow x1={210} y1={78} x2={210} y2={55} dashed color="#EF4444" />
          <MovementArrow x1={160} y1={63} x2={160} y2={42} dashed color="#EF4444" />
          <MovementArrow x1={195} y1={63} x2={195} y2={42} dashed color="#EF4444" />
          <PitchLabel x={170} y={40} text="Sprint" color="#EF4444" />
        </PitchSVG>
      </div>
    </SectionCard>

    {/* Setup 6 — GK Near Post Swap */}
    <SectionCard title='Setup 6: "GK Near Post Swap"' onEdit={() => {}}>
      <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
        GK covers near post; wall angled to cover far post. Reverse of traditional positioning.
      </p>
      <div style={{ overflowX: 'auto' }}>
        <PitchSVG width={340} height={260} halfPitch>
          {/* GK near post */}
          <PlayerDot x={155} y={18} label="GK" type="gk" size={10} />
          <PitchLabel x={155} y={30} text="Near post" color="#22C55E" />
          {/* Wall angled to cover far post */}
          <PlayerDot x={180} y={95} label="W1" type="defend" size={8} />
          <PlayerDot x={190} y={100} label="W2" type="defend" size={8} />
          <PlayerDot x={200} y={105} label="W3" type="defend" size={8} />
          <PlayerDot x={210} y={110} label="W4" type="defend" size={8} />
          <PitchLabel x={195} y={120} text="Angled wall" color={C.textSec} />
          {/* Ball */}
          <PlayerDot x={170} y={155} label="" type="ball" size={7} />
          {/* Cover */}
          <PlayerDot x={230} y={80} label="6" type="defend" size={9} />
        </PitchSVG>
      </div>
    </SectionCard>

    {/* Setup 7 — Floating Wall + Zonal Box */}
    <SectionCard title='Setup 7: "Floating Wall + Zonal Box"' onEdit={() => {}}>
      <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
        Wall slightly off-line to invite shot; box behind set up zonally. GK covers far post.
      </p>
      <div style={{ overflowX: 'auto' }}>
        <PitchSVG width={340} height={260} halfPitch>
          {/* GK far post */}
          <PlayerDot x={195} y={15} label="GK" type="gk" size={10} />
          <PitchLabel x={195} y={28} text="Far post" color="#22C55E" />
          {/* Wall slightly offset */}
          <DefensiveWall x={145} y={100} count={3} color="#EF4444" />
          <PitchLabel x={155} y={118} text="Offset wall" color={C.textSec} />
          {/* Zonal coverage zones */}
          <ZoneHighlight x={140} y={45} width={90} height={40} color="rgba(239,68,68,0.08)" />
          <PlayerDot x={155} y={60} label="D1" type="defend" size={8} />
          <PlayerDot x={180} y={60} label="D2" type="defend" size={8} />
          <PlayerDot x={205} y={60} label="D3" type="defend" size={8} />
          <PlayerDot x={230} y={70} label="D4" type="defend" size={8} />
          {/* Ball */}
          <PlayerDot x={170} y={155} label="" type="ball" size={7} />
        </PitchSVG>
      </div>
    </SectionCard>
    </>
  )
}

/* ============================================================
   THROW-INS TAB
   ============================================================ */

function ThrowInsTab() {
  return (
    <>
      {/* Attacking third */}
      <SectionCard title="Attacking Third Throw-In" onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Quick throw to feet with overlapping runner down the line.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />

            {/* Thrower on touchline */}
            <PlayerDot x={320} y={100} label="TB" type="attack" size={9} />
            <PitchLabel x={310} y={115} text="Thrower" color={C.primary} />

            {/* Short target */}
            <PlayerDot x={280} y={90} label="7" type="attack" size={9} />
            <MovementArrow x1={318} y1={98} x2={285} y2={90} dashed={false} color={C.text} />

            {/* Overlap runner */}
            <PlayerDot x={300} y={120} label="3" type="attack" size={9} />
            <MovementArrow x1={300} y1={118} x2={300} y2={60} dashed color={C.primary} curved curveOffset={{ dx: 20, dy: 0 }} />
            <PitchLabel x={310} y={65} text="Overlap" color={C.primary} />

            {/* Lay off and cross */}
            <MovementArrow x1={280} y1={88} x2={295} y2={65} dashed color={C.primary} />

            {/* Runners in box */}
            <PlayerDot x={190} y={70} label="9" type="attack" size={9} />
            <PlayerDot x={210} y={90} label="10" type="attack" size={9} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Defensive third */}
      <SectionCard title="Defensive Third Throw-In" onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Safe retention pattern — short throw to centre-back who switches play.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={500} halfPitch={false}>
            {/* Own GK */}
            <PlayerDot x={170} y={480} label="GK" type="gk" size={9} />

            {/* Thrower on left touchline, defensive third */}
            <PlayerDot x={20} y={370} label="3" type="attack" size={9} />
            <PitchLabel x={35} y={385} text="Thrower" color={C.primary} />

            {/* CB receives */}
            <PlayerDot x={100} y={380} label="5" type="attack" size={9} />
            <MovementArrow x1={25} y1={370} x2={95} y2={378} dashed={false} color={C.text} />

            {/* Switch pass to far side */}
            <PlayerDot x={270} y={360} label="2" type="attack" size={9} />
            <MovementArrow x1={105} y1={378} x2={265} y2={362} dashed color={C.primary} />
            <PitchLabel x={180} y={355} text="Switch" color={C.primary} />

            {/* Midfielder option */}
            <PlayerDot x={140} y={340} label="6" type="attack" size={9} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 3 — Flick-On Header */}
      <SectionCard title='Routine 3: "Flick-On Header"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Throw to tall player at edge of box. Headed flick-on into 6-yard box for runner.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
            {/* Thrower */}
            <PlayerDot x={320} y={80} label="TB" type="attack" size={9} />
            <PitchLabel x={310} y={95} text="Thrower" color={C.primary} />
            {/* Throw to tall player */}
            <MovementArrow x1={318} y1={78} x2={240} y2={65} dashed={false} color={C.text} />
            {/* Tall player at edge of box */}
            <PlayerDot x={238} y={63} label="9" type="attack" size={10} />
            <PitchLabel x={238} y={52} text="Header" color={C.primary} />
            {/* Flick-on arc into 6-yard box */}
            <BallFlight x1={238} y1={61} x2={190} y2={40} cx={215} cy={35} color={C.primary} />
            {/* Runner attacking flick */}
            <PlayerDot x={190} y={38} label="10" type="attack" size={9} />
            <MovementArrow x1={210} y1={70} x2={192} y2={42} dashed color={C.primary} />
            <PitchLabel x={190} y={28} text="Attack" color={C.primary} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 4 — Dummy Peel */}
      <SectionCard title='Routine 4: "Dummy Peel"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          First player makes a run as a decoy; second player peels off opposite direction and receives.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
            {/* Thrower */}
            <PlayerDot x={320} y={100} label="3" type="attack" size={9} />
            <PitchLabel x={310} y={115} text="Thrower" color={C.primary} />
            {/* Decoy runner */}
            <PlayerDot x={270} y={85} label="7" type="attack" size={9} />
            <MovementArrow x1={270} y1={83} x2={250} y2={55} dashed color={C.textSec} />
            <PitchLabel x={245} y={50} text="Decoy" color={C.textSec} />
            {/* Real receiver peeling opposite */}
            <PlayerDot x={275} y={100} label="11" type="attack" size={9} />
            <MovementArrow x1={275} y1={102} x2={280} y2={130} dashed color={C.primary} />
            <PitchLabel x={285} y={135} text="Peel" color={C.primary} />
            {/* Throw goes to peeling player */}
            <MovementArrow x1={318} y1={102} x2={282} y2={125} dashed={false} color={C.text} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 5 — Third Man Overlap */}
      <SectionCard title='Routine 5: "Third Man Overlap"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Short throw to feet, immediate lay-off, third player overlaps wide for cross.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
            {/* Thrower */}
            <PlayerDot x={320} y={100} label="3" type="attack" size={9} />
            {/* Short throw to feet */}
            <MovementArrow x1={318} y1={98} x2={285} y2={95} dashed={false} color={C.text} />
            <PlayerDot x={280} y={95} label="7" type="attack" size={9} />
            {/* Lay-off inside */}
            <MovementArrow x1={278} y1={95} x2={255} y2={110} dashed={false} color={C.text} />
            <PlayerDot x={250} y={112} label="8" type="attack" size={9} />
            <PitchLabel x={250} y={125} text="Lay-off" color={C.textSec} />
            {/* Third man overlaps wide */}
            <PlayerDot x={300} y={120} label="TB" type="attack" size={9} />
            <MovementArrow x1={300} y1={118} x2={295} y2={55} dashed color={C.primary} curved curveOffset={{ dx: 20, dy: 0 }} />
            <PitchLabel x={310} y={60} text="Overlap" color={C.primary} />
            {/* Cross into box */}
            <BallFlight x1={295} y1={58} x2={200} y2={60} cx={250} cy={35} color={C.primary} />
            <PlayerDot x={200} y={58} label="9" type="attack" size={9} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 6 — Long Throw Second Phase */}
      <SectionCard title='Routine 6: "Long Throw Second Phase"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Long throw into box gets cleared; 3 players immediately press the clearance zone.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
            {/* Thrower */}
            <PlayerDot x={320} y={80} label="TB" type="attack" size={9} />
            {/* Long throw arc */}
            <BallFlight x1={318} y1={78} x2={200} y2={60} cx={270} cy={30} color={C.textSec} />
            <PitchLabel x={200} y={50} text="Cleared" color={C.textSec} />
            {/* Clearance zone */}
            <ZoneHighlight x={210} y={110} width={60} height={40} color="rgba(217,119,6,0.12)" />
            <PitchLabel x={240} y={125} text="Clearance zone" color={C.primary} />
            {/* Pressing players */}
            <PlayerDot x={200} y={150} label="8" type="attack" size={9} />
            <MovementArrow x1={200} y1={148} x2={220} y2={130} dashed color={C.primary} />
            <PlayerDot x={240} y={160} label="10" type="attack" size={9} />
            <MovementArrow x1={240} y1={158} x2={240} y2={135} dashed color={C.primary} />
            <PlayerDot x={270} y={145} label="11" type="attack" size={9} />
            <MovementArrow x1={268} y1={143} x2={255} y2={130} dashed color={C.primary} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 7 — Reverse Throw */}
      <SectionCard title='Routine 7: "Reverse Throw"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Player shapes to throw one direction, reverses and throws inside to playmaker.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
            {/* Thrower facing up the line */}
            <PlayerDot x={320} y={100} label="3" type="attack" size={9} />
            <PitchLabel x={310} y={115} text="Thrower" color={C.primary} />
            {/* Fake direction arrow (dashed, dim) */}
            <MovementArrow x1={318} y1={98} x2={300} y2={60} dashed color={C.textSec} />
            <PitchLabel x={295} y={55} text="Fake" color={C.textSec} />
            {/* Real throw goes opposite — inside */}
            <MovementArrow x1={318} y1={102} x2={260} y2={115} dashed={false} color={C.primary} />
            {/* Playmaker receiving */}
            <PlayerDot x={255} y={115} label="10" type="attack" size={10} />
            <PitchLabel x={240} y={128} text="Playmaker" color={C.primary} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 8 — Double Overlap */}
      <SectionCard title='Routine 8: "Double Overlap"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Short throw to a receiver who holds the ball. The thrower overlaps first, then a second player overlaps again, creating a 2v1 on the flank.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
            {/* Thrower */}
            <PlayerDot x={320} y={100} label="3" type="attack" size={9} />
            <PitchLabel x={310} y={115} text="Thrower" color={C.primary} />
            {/* Short throw to receiver */}
            <MovementArrow x1={318} y1={98} x2={285} y2={90} dashed={false} color={C.text} />
            <PlayerDot x={280} y={90} label="7" type="attack" size={9} />
            <PitchLabel x={270} y={80} text="Hold" color={C.textSec} />
            {/* First overlap — thrower */}
            <MovementArrow x1={320} y1={98} x2={310} y2={55} dashed color={C.primary} />
            <PitchLabel x={315} y={50} text="Overlap 1" color={C.primary} />
            {/* Second overlap — extra player */}
            <PlayerDot x={295} y={120} label="8" type="attack" size={9} />
            <MovementArrow x1={295} y1={118} x2={305} y2={45} dashed color={C.primary} />
            <PitchLabel x={300} y={38} text="Overlap 2" color={C.primary} />
            {/* Defender outnumbered */}
            <PlayerDot x={290} y={70} label="D" type="defend" size={7} />
            <PitchLabel x={275} y={65} text="2v1" color={C.primary} />
            {/* Runners in box */}
            <PlayerDot x={200} y={60} label="9" type="attack" size={9} />
            <PlayerDot x={220} y={80} label="10" type="attack" size={9} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 9 — Back Door Cut */}
      <SectionCard title='Routine 9: "Back Door Cut"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Throw to the nearest player who lays the ball off. Far-side attacker times a run behind the defenders and cuts into the box unmarked.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
            {/* Thrower */}
            <PlayerDot x={320} y={90} label="3" type="attack" size={9} />
            <PitchLabel x={310} y={105} text="Thrower" color={C.primary} />
            {/* Throw to near player */}
            <MovementArrow x1={318} y1={88} x2={280} y2={80} dashed={false} color={C.text} />
            <PlayerDot x={275} y={80} label="7" type="attack" size={9} />
            {/* Lay-off */}
            <MovementArrow x1={273} y1={80} x2={250} y2={95} dashed={false} color={C.text} />
            <PlayerDot x={245} y={97} label="8" type="attack" size={9} />
            <PitchLabel x={245} y={110} text="Lay-off" color={C.textSec} />
            {/* Far-side attacker cutting behind defenders */}
            <PlayerDot x={180} y={110} label="11" type="attack" size={9} />
            <MovementArrow x1={180} y1={108} x2={195} y2={55} dashed color={C.primary} />
            <PitchLabel x={200} y={50} text="Back door" color={C.primary} />
            {/* Defenders being beaten */}
            <PlayerDot x={210} y={75} label="D" type="defend" size={7} />
            <PlayerDot x={230} y={70} label="D" type="defend" size={7} />
            {/* Ball into box */}
            <MovementArrow x1={247} y1={95} x2={198} y2={60} dashed color={C.primary} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 10 — Screen and Spin */}
      <SectionCard title='Routine 10: "Screen and Spin"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Receiver uses a defender as a screen, then spins sharply into space on the opposite side to collect the throw.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
            {/* Thrower */}
            <PlayerDot x={320} y={100} label="3" type="attack" size={9} />
            <PitchLabel x={310} y={115} text="Thrower" color={C.primary} />
            {/* Defender being used as screen */}
            <PlayerDot x={275} y={85} label="D" type="defend" size={8} />
            <PitchLabel x={275} y={75} text="Screen" color={C.textSec} />
            {/* Receiver starting behind defender */}
            <PlayerDot x={268} y={92} label="7" type="attack" size={9} />
            {/* Curved spin arrow away from defender */}
            <MovementArrow x1={268} y1={94} x2={255} y2={115} dashed color={C.primary} curved curveOffset={{ dx: -15, dy: 0 }} />
            <PitchLabel x={240} y={120} text="Spin" color={C.primary} />
            {/* Throw to space where receiver arrives */}
            <MovementArrow x1={318} y1={102} x2={258} y2={112} dashed={false} color={C.primary} />
            {/* Support runners */}
            <PlayerDot x={240} y={80} label="8" type="attack" size={9} />
            <PlayerDot x={210} y={95} label="10" type="attack" size={9} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 11 — Quick Counter Throw */}
      <SectionCard title='Routine 11: "Quick Counter Throw"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Instant long throw down the line before the opposition can reorganise. The winger sprints to meet it in behind.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
            {/* Thrower — quick */}
            <PlayerDot x={320} y={140} label="3" type="attack" size={9} />
            <PitchLabel x={310} y={155} text="Quick!" color={C.primary} />
            {/* Long throw arrow down line */}
            <MovementArrow x1={318} y1={138} x2={310} y2={45} dashed={false} color={C.primary} />
            <PitchLabel x={315} y={35} text="Long throw" color={C.primary} />
            {/* Winger sprinting */}
            <PlayerDot x={290} y={120} label="7" type="attack" size={9} />
            <MovementArrow x1={290} y1={118} x2={305} y2={50} dashed color={C.primary} />
            <PitchLabel x={280} y={80} text="Sprint" color={C.primary} />
            {/* Opposition not set */}
            <PlayerDot x={260} y={90} label="D" type="defend" size={7} />
            <PlayerDot x={250} y={110} label="D" type="defend" size={7} />
            <PitchLabel x={240} y={100} text="Not set" color={C.textSec} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 12 — Box Overload Throw */}
      <SectionCard title='Routine 12: "Box Overload Throw"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Long throw to the touchline area near the box. Four runners flood into the box from different angles to overwhelm the defence.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
            {/* Thrower — long throw */}
            <PlayerDot x={320} y={80} label="TB" type="attack" size={9} />
            <PitchLabel x={310} y={95} text="Long throw" color={C.primary} />
            {/* Long throw arc */}
            <BallFlight x1={318} y1={78} x2={240} y2={55} cx={290} cy={35} color={C.primary} />
            {/* Box zone */}
            <ZoneHighlight x={155} y={35} width={80} height={70} color="rgba(217,119,6,0.08)" />
            {/* 4 runners flooding box from different angles */}
            <PlayerDot x={250} y={130} label="9" type="attack" size={9} />
            <MovementArrow x1={250} y1={128} x2={215} y2={65} dashed color={C.primary} />
            <PlayerDot x={200} y={130} label="10" type="attack" size={9} />
            <MovementArrow x1={200} y1={128} x2={195} y2={70} dashed color={C.primary} />
            <PlayerDot x={170} y={140} label="8" type="attack" size={9} />
            <MovementArrow x1={170} y1={138} x2={175} y2={75} dashed color={C.primary} />
            <PlayerDot x={140} y={120} label="11" type="attack" size={9} />
            <MovementArrow x1={140} y1={118} x2={165} y2={65} dashed color={C.primary} />
            <PitchLabel x={195} y={100} text="Flood" color={C.primary} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 13 — Decoy Long — Actual Short */}
      <SectionCard title='Routine 13: "Decoy Long — Actual Short"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          The thrower shapes as if delivering a long throw deep into the box. Instead, a short throw is played to an unmarked player nearby who drives inside with the ball.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* Thrower on touchline */}
            <PlayerDot x={20} y={140} label="TB" type="attack" size={10} />
            <PitchLabel x={5} y={155} text="Thrower" color={C.textSec} />
            {/* Decoy long shape (dashed) */}
            <MovementArrow x1={25} y1={138} x2={170} y2={60} dashed color={C.textSec} />
            <PitchLabel x={100} y={85} text="Shape long" color={C.textSec} />
            {/* Actual short throw */}
            <MovementArrow x1={25} y1={142} x2={65} y2={135} dashed={false} color={C.primary} />
            <PitchLabel x={40} y={125} text="Short" color={C.primary} />
            {/* Receiver near touchline */}
            <PlayerDot x={68} y={133} label="7" type="attack" size={9} />
            {/* Drive inside */}
            <MovementArrow x1={70} y1={131} x2={140} y2={100} dashed={false} color={C.primary} />
            <PitchLabel x={110} y={108} text="Drive inside" color={C.primary} />
            {/* Defenders drawn deep by shape */}
            <PlayerDot x={160} y={65} label="D" type="defend" size={8} />
            <PlayerDot x={190} y={70} label="D" type="defend" size={8} />
            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 14 — Stacked Players — Peel Off */}
      <SectionCard title='Routine 14: "Stacked Players — Peel Off"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Three players stack tightly near the touchline. On the throw, each peels off in a different direction, making it impossible for defenders to track all three. The throw goes to the best option.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* Thrower */}
            <PlayerDot x={20} y={140} label="TB" type="attack" size={10} />
            {/* 3 stacked players near touchline */}
            <PlayerDot x={60} y={130} label="8" type="attack" size={9} />
            <PlayerDot x={60} y={140} label="10" type="attack" size={9} />
            <PlayerDot x={60} y={150} label="11" type="attack" size={9} />
            <PitchLabel x={72} y={142} text="Stack" color={C.textSec} />
            {/* Peel 1 — deep towards goal */}
            <MovementArrow x1={62} y1={128} x2={120} y2={70} dashed={false} color={C.primary} />
            <PitchLabel x={125} y={65} text="Deep" color={C.primary} />
            {/* Peel 2 — inside towards centre */}
            <MovementArrow x1={62} y1={140} x2={140} y2={130} dashed={false} color={C.primary} />
            <PitchLabel x={145} y={128} text="Inside" color={C.primary} />
            {/* Peel 3 — short back along line */}
            <MovementArrow x1={62} y1={152} x2={80} y2={185} dashed={false} color={C.primary} />
            <PitchLabel x={85} y={190} text="Short" color={C.primary} />
            {/* Throw to best option */}
            <MovementArrow x1={25} y1={138} x2={118} y2={72} dashed color={C.primary} />
            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 15 — Immediate First-Time Cross */}
      <SectionCard title='Routine 15: "Immediate First-Time Cross"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          The receiver takes the throw-in and crosses first time into the box without controlling the ball. Three runners attack the delivery at pace.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* Thrower */}
            <PlayerDot x={20} y={110} label="TB" type="attack" size={10} />
            {/* Throw to receiver */}
            <MovementArrow x1={25} y1={108} x2={65} y2={95} dashed={false} color={C.primary} />
            {/* Receiver */}
            <PlayerDot x={68} y={93} label="7" type="attack" size={9} />
            {/* Immediate first-time cross arc into box */}
            <BallFlight x1={70} y1={91} x2={185} y2={50} cx={130} cy={40} color={C.primary} />
            <PitchLabel x={120} y={55} text="1st-time cross" color={C.primary} />
            {/* 3 runners attacking */}
            <PlayerDot x={160} y={100} label="9" type="attack" size={9} />
            <MovementArrow x1={160} y1={98} x2={170} y2={55} dashed color={C.primary} />
            <PlayerDot x={200} y={95} label="10" type="attack" size={9} />
            <MovementArrow x1={200} y1={93} x2={190} y2={52} dashed color={C.primary} />
            <PlayerDot x={230} y={105} label="5" type="attack" size={9} />
            <MovementArrow x1={230} y1={103} x2={200} y2={55} dashed color={C.primary} />
            {/* Box zone */}
            <ZoneHighlight x={155} y={40} width={60} height={25} color="rgba(217,119,6,0.12)" />
            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 16 — Throw to Chest — Volley */}
      <SectionCard title='Routine 16: "Throw to Chest — Volley"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          A throw aimed at chest height to a player at the edge of the box. The receiver lets it drop off the chest and volleys immediately towards goal.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* Thrower */}
            <PlayerDot x={20} y={120} label="TB" type="attack" size={10} />
            {/* Throw arc to receiver's chest */}
            <BallFlight x1={25} y1={118} x2={140} y2={110} cx={80} cy={85} color={C.primary} />
            <PitchLabel x={75} y={95} text="Chest throw" color={C.primary} />
            {/* Receiver at edge of box */}
            <PlayerDot x={143} y={108} label="9" type="attack" size={9} />
            <PitchLabel x={150} y={120} text="Chest" color={C.textSec} />
            {/* Volley trajectory to goal */}
            <MovementArrow x1={143} y1={106} x2={170} y2={20} dashed={false} color={C.primary} />
            <PitchLabel x={162} y={60} text="Volley" color={C.primary} />
            {/* Target zone */}
            <ZoneHighlight x={155} y={8} width={30} height={18} color="rgba(217,119,6,0.18)" />
            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 17 — Set Piece from Throw */}
      <SectionCard title='Routine 17: "Set Piece from Throw"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          The throw-in is treated like a corner kick — players take specific positions, the ball is thrown into the near-post zone for a flick-on, and a runner attacks the back post.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* Thrower */}
            <PlayerDot x={20} y={90} label="TB" type="attack" size={10} />
            {/* Throw into near-post zone */}
            <MovementArrow x1={25} y1={88} x2={130} y2={50} dashed={false} color={C.primary} />
            <PitchLabel x={70} y={60} text="Throw" color={C.primary} />
            {/* Near-post zone */}
            <ZoneHighlight x={115} y={38} width={35} height={25} color="rgba(217,119,6,0.12)" />
            {/* Flick-on attacker at near post */}
            <PlayerDot x={132} y={48} label="9" type="attack" size={9} />
            <PitchLabel x={140} y={42} text="Flick" color={C.primary} />
            {/* Flick arrow to back post */}
            <MovementArrow x1={134} y1={50} x2={210} y2={42} dashed={false} color={C.primary} />
            {/* Back-post runner */}
            <PlayerDot x={220} y={80} label="5" type="attack" size={9} />
            <MovementArrow x1={220} y1={78} x2={212} y2={44} dashed color={C.primary} />
            <PitchLabel x={225} y={65} text="Back post" color={C.primary} />
            {/* Back-post zone */}
            <ZoneHighlight x={198} y={30} width={30} height={25} color="rgba(217,119,6,0.15)" />
            {/* Header to goal */}
            <MovementArrow x1={212} y1={40} x2={185} y2={18} dashed={false} color={C.primary} />
            {/* GK */}
            <PlayerDot x={170} y={15} label="GK" type="gk" size={9} />
          </PitchSVG>
        </div>
      </SectionCard>
    </>
  )
}

/* ============================================================
   PENALTIES TAB
   ============================================================ */

function PenaltiesTab() {
  const takers = [
    { order: 1, name: 'Liam Grady', side: 'Left', technique: 'Placed — bottom left', composure: 7, note: 'Prefers bottom-left. Reliable but can be read' },
    { order: 2, name: 'Josh Whitmore', side: 'Centre', technique: 'Power — down the middle', composure: 8, note: 'Power down the middle. Brave technique' },
    { order: 3, name: 'Marcus Webb', side: 'Right', technique: 'Placed — top corners', composure: 8, note: 'Placement, top corners. Cool head' },
    { order: 4, name: 'Jake Morrison', side: 'Right', technique: 'Placed — low right', composure: 7, note: 'Decent in training, untested in matches' },
    { order: 5, name: 'Sam Leigh', side: 'Left', technique: 'Power — driven', composure: 9, note: 'Cool under pressure. Should be higher in the order' },
    { order: 6, name: 'Chris Nolan', side: 'Centre (Panenka)', technique: 'Chip', composure: 6, note: "Only if comfortable lead. Don't trust in big moments" },
    { order: 7, name: 'Dan Rhodes', side: 'Right', technique: 'Placed — top right', composure: 8, note: 'Strong record, not tested in a real shootout yet' },
    { order: 8, name: 'Tom Brennan (injured)', side: 'Left', technique: 'Power — low driven', composure: 9, note: 'First choice when fit — currently injured' },
  ]

  return (
    <>
      <SectionCard title="Penalty Taker Order" onEdit={() => {}}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {takers.map((t) => (
            <div
              key={t.order}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
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
                  background: C.primary,
                  color: '#000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 14,
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                {t.order}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
                  <span style={{ color: C.textSec, fontSize: 12 }}>
                    Side: <strong style={{ color: C.text }}>{t.side}</strong>
                  </span>
                  <span style={{ color: C.textSec, fontSize: 12 }}>
                    Technique: <strong style={{ color: C.text }}>{t.technique}</strong>
                  </span>
                  <span style={{ color: C.textSec, fontSize: 12 }}>
                    Composure: <strong style={{ color: C.primary }}>{t.composure}/10</strong>
                  </span>
                </div>
                <div style={{ color: C.textSec, fontSize: 12, marginTop: 2, fontStyle: 'italic' }}>{t.note}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Goalkeeper Notes" onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: 0 }}>
          GK <strong style={{ color: C.text }}>Danny Collins</strong> — preference to dive right
          (his strong side). Study opposing taker history before the match. Stand slightly off-centre
          to invite the shot to the weaker side.
        </p>
      </SectionCard>

      <SectionCard title="Season Statistics">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {[
            ['Awarded', '3'],
            ['Scored', '2'],
            ['Missed', '1'],
          ].map(([l, v]) => (
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
              <div style={{ color: C.primary, fontSize: 22, fontWeight: 700 }}>{v}</div>
            </div>
          ))}
        </div>
      </SectionCard>
    </>
  )
}

/* ============================================================
   STATS TAB
   ============================================================ */

function StatsTab() {
  const rows: [string, string, string][] = [
    ['Corners taken', '32', '28'],
    ['Goals from corners', '3 (9.4%)', '2.5 (8.9%)'],
    ['Free kicks taken', '18', '16'],
    ['Goals from free kicks', '2 (11.1%)', '1.2 (7.5%)'],
    ['Penalties awarded', '3', '2.8'],
    ['Penalties scored', '2 (66.7%)', '2.1 (75%)'],
    ['Set pieces conceded', '28', '26'],
    ['Goals conceded from set pieces', '4', '3.8'],
  ]

  return (
    <SectionCard title="Set Piece Summary — 2025/26 Season">
      <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 14px' }}>
        Harfield FC vs Northern Premier League averages
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 13,
            minWidth: 420,
          }}
        >
          <thead>
            <tr>
              {['Metric', 'Harfield FC', 'NPL Avg'].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: h === 'Metric' ? 'left' : 'center',
                    padding: '8px 10px',
                    borderBottom: `2px solid ${C.border}`,
                    color: C.primary,
                    fontWeight: 600,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([metric, hfc, avg], i) => (
              <tr key={i}>
                <td
                  style={{
                    padding: '8px 10px',
                    borderBottom: `1px solid ${C.border}`,
                    color: C.text,
                  }}
                >
                  {metric}
                </td>
                <td
                  style={{
                    padding: '8px 10px',
                    borderBottom: `1px solid ${C.border}`,
                    color: C.text,
                    textAlign: 'center',
                    fontWeight: 600,
                  }}
                >
                  {hfc}
                </td>
                <td
                  style={{
                    padding: '8px 10px',
                    borderBottom: `1px solid ${C.border}`,
                    color: C.textSec,
                    textAlign: 'center',
                  }}
                >
                  {avg}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  )
}

/* ============================================================
   GOAL KICKS TAB
   ============================================================ */

function GoalKicksTab() {
  return (
    <>
      {/* Routine 1 — Short Build Up */}
      <SectionCard title='Routine 1: "Short Build Up"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          GK plays short to split centre-backs. Build from the back patiently.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* GK with ball */}
            <PlayerDot x={170} y={20} label="GK" type="gk" size={10} />
            {/* Split CBs */}
            <PlayerDot x={120} y={60} label="5" type="attack" size={9} />
            <PlayerDot x={220} y={60} label="4" type="attack" size={9} />
            {/* Short pass options */}
            <MovementArrow x1={168} y1={24} x2={125} y2={58} dashed={false} color={C.text} />
            <MovementArrow x1={172} y1={24} x2={215} y2={58} dashed={false} color={C.text} />
            {/* Build up passes */}
            <PlayerDot x={170} y={110} label="6" type="attack" size={9} />
            <MovementArrow x1={122} y1={62} x2={165} y2={108} dashed color={C.primary} />
            <MovementArrow x1={218} y1={62} x2={175} y2={108} dashed color={C.primary} />
            <PitchLabel x={170} y={125} text="Build" color={C.primary} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 2 — Long to Target */}
      <SectionCard title='Routine 2: "Long to Target"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Long delivery to target man. Runners support around the drop zone.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={20} label="GK" type="gk" size={10} />
            {/* Long ball flight */}
            <BallFlight x1={170} y1={22} x2={170} y2={180} cx={100} cy={100} color={C.primary} />
            {/* Target man */}
            <PlayerDot x={170} y={182} label="9" type="attack" size={10} />
            <PitchLabel x={170} y={195} text="Target" color={C.primary} />
            {/* Supporting runners */}
            <PlayerDot x={130} y={210} label="10" type="attack" size={9} />
            <MovementArrow x1={130} y1={208} x2={155} y2={190} dashed color={C.primary} />
            <PlayerDot x={210} y={210} label="11" type="attack" size={9} />
            <MovementArrow x1={210} y1={208} x2={185} y2={190} dashed color={C.primary} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 3 — Diagonal Switch — Bypass Midfield */}
      <SectionCard title='Routine 3: "Diagonal Switch — Bypass Midfield"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          GK hits a diagonal ball to the opposite winger, bypassing the midfield press entirely.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={20} label="GK" type="gk" size={10} />
            {/* Diagonal flight to far winger */}
            <BallFlight x1={170} y1={22} x2={40} y2={180} cx={60} cy={80} color={C.primary} />
            {/* Winger receiving */}
            <PlayerDot x={38} y={182} label="11" type="attack" size={9} />
            <PitchLabel x={50} y={195} text="Winger" color={C.primary} />
            {/* Midfield bypassed — show opponents in centre */}
            <PlayerDot x={150} y={120} label="D" type="defend" size={7} />
            <PlayerDot x={190} y={130} label="D" type="defend" size={7} />
            <PitchLabel x={170} y={145} text="Bypassed" color={C.textSec} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 4 — Target Man — Flick to Feet */}
      <SectionCard title='Routine 4: "Target Man — Flick to Feet"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Driven to target man who flicks on for a runner making a forward burst.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={20} label="GK" type="gk" size={10} />
            {/* Driven to target */}
            <BallFlight x1={170} y1={22} x2={170} y2={160} cx={120} cy={90} color={C.primary} />
            <PlayerDot x={170} y={162} label="9" type="attack" size={10} />
            <PitchLabel x={170} y={150} text="Target" color={C.primary} />
            {/* Flick arrow */}
            <MovementArrow x1={172} y1={164} x2={200} y2={190} dashed={false} color={C.primary} />
            {/* Runner */}
            <PlayerDot x={200} y={200} label="10" type="attack" size={9} />
            <MovementArrow x1={200} y1={198} x2={200} y2={230} dashed color={C.primary} />
            <PitchLabel x={215} y={225} text="Run" color={C.primary} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 5 — GK Roll to CB — Quick Play */}
      <SectionCard title='Routine 5: "GK Roll to CB — Quick Play"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Quick roll to centre-back before the opposition press can organise.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={20} label="GK" type="gk" size={10} />
            <PitchLabel x={170} y={10} text="Quick!" color={C.primary} />
            {/* Quick roll to CB */}
            <MovementArrow x1={168} y1={24} x2={130} y2={55} dashed={false} color={C.text} />
            <PlayerDot x={128} y={57} label="5" type="attack" size={9} />
            {/* CB plays forward quickly */}
            <MovementArrow x1={130} y1={59} x2={160} y2={120} dashed color={C.primary} />
            <PlayerDot x={162} y={122} label="8" type="attack" size={9} />
            {/* Opposition not yet set */}
            <PlayerDot x={200} y={140} label="D" type="defend" size={7} />
            <PitchLabel x={215} y={140} text="Not set" color={C.textSec} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 6 — Lofted to Channel */}
      <SectionCard title='Routine 6: "Lofted to Channel"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          High lofted ball into the wide channel for the winger to chase.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={20} label="GK" type="gk" size={10} />
            {/* Lofted ball to wide channel */}
            <BallFlight x1={170} y1={22} x2={300} y2={170} cx={280} cy={60} color={C.primary} />
            {/* Channel zone */}
            <ZoneHighlight x={280} y={150} width={50} height={50} color="rgba(217,119,6,0.10)" />
            <PitchLabel x={305} y={195} text="Channel" color={C.primary} />
            {/* Winger chasing */}
            <PlayerDot x={290} y={130} label="7" type="attack" size={9} />
            <MovementArrow x1={290} y1={132} x2={300} y2={170} dashed color={C.primary} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 7 — Over Pressing Line */}
      <SectionCard title='Routine 7: "Over Pressing Line"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          GK lifts the ball over the opposition press line to the striker in behind.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            <PlayerDot x={170} y={20} label="GK" type="gk" size={10} />
            {/* Pressing line */}
            <PlayerDot x={120} y={80} label="D" type="defend" size={7} />
            <PlayerDot x={170} y={75} label="D" type="defend" size={7} />
            <PlayerDot x={220} y={80} label="D" type="defend" size={7} />
            <ZoneHighlight x={100} y={70} width={150} height={15} color="rgba(239,68,68,0.10)" />
            <PitchLabel x={170} y={65} text="Press line" color="#EF4444" />
            {/* Ball over press to striker */}
            <BallFlight x1={170} y1={22} x2={180} y2={160} cx={120} cy={80} color={C.primary} />
            {/* Striker in behind */}
            <PlayerDot x={180} y={162} label="9" type="attack" size={10} />
            <PitchLabel x={180} y={175} text="In behind" color={C.primary} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 8 — Decoy Long — Play Short */}
      <SectionCard title='Routine 8: "Decoy Long — Play Short"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          GK shapes as if delivering long but rolls the ball short to an unmarked centre-back. Opponents push up expecting the aerial duel, leaving space in behind.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={500} halfPitch={false}>
            {/* GK */}
            <PlayerDot x={170} y={465} label="GK" type="gk" size={10} />
            {/* Dashed fake long trajectory */}
            <MovementArrow x1={170} y1={460} x2={170} y2={200} dashed color={C.textSec} />
            <PitchLabel x={185} y={300} text="Fake long" color={C.textSec} />
            {/* Short roll to CB */}
            <MovementArrow x1={168} y1={462} x2={120} y2={430} dashed={false} color={C.primary} />
            <PlayerDot x={118} y={430} label="5" type="attack" size={9} />
            <PitchLabel x={100} y={420} text="Short roll" color={C.primary} />
            {/* Other CB wide */}
            <PlayerDot x={220} y={435} label="4" type="attack" size={9} />
            {/* Opponents pushing up expecting long ball */}
            <PlayerDot x={140} y={260} label="D" type="defend" size={7} />
            <PlayerDot x={200} y={255} label="D" type="defend" size={7} />
            <MovementArrow x1={140} y1={262} x2={140} y2={240} dashed color="#EF4444" />
            <MovementArrow x1={200} y1={257} x2={200} y2={235} dashed color="#EF4444" />
            <PitchLabel x={170} y={230} text="Push up" color={C.textSec} />
            {/* Space in behind */}
            <ZoneHighlight x={100} y={340} width={140} height={50} color="rgba(217,119,6,0.08)" />
            <PitchLabel x={170} y={360} text="Space" color={C.primary} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 9 — Triple CB Split */}
      <SectionCard title='Routine 9: "Triple CB Split"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Three centre-backs split wide to create maximum width. GK identifies the least-pressed option and plays to feet. Full-backs push into midfield positions.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={500} halfPitch={false}>
            {/* GK */}
            <PlayerDot x={170} y={465} label="GK" type="gk" size={10} />
            {/* 3 CBs split wide */}
            <PlayerDot x={50} y={420} label="5" type="attack" size={9} />
            <PlayerDot x={170} y={425} label="4" type="attack" size={9} />
            <PlayerDot x={290} y={420} label="6" type="attack" size={9} />
            {/* Pass options */}
            <MovementArrow x1={168} y1={462} x2={55} y2={422} dashed color={C.primary} />
            <MovementArrow x1={170} y1={462} x2={170} y2={430} dashed color={C.primary} />
            <MovementArrow x1={172} y1={462} x2={285} y2={422} dashed color={C.primary} />
            {/* Full-backs pushed into midfield */}
            <PlayerDot x={60} y={350} label="3" type="attack" size={9} />
            <PlayerDot x={280} y={350} label="2" type="attack" size={9} />
            <MovementArrow x1={60} y1={390} x2={60} y2={355} dashed color={C.primary} />
            <MovementArrow x1={280} y1={390} x2={280} y2={355} dashed color={C.primary} />
            <PitchLabel x={60} y={340} text="FB high" color={C.primary} />
            <PitchLabel x={280} y={340} text="FB high" color={C.primary} />
            {/* Midfielders */}
            <PlayerDot x={130} y={320} label="8" type="attack" size={8} />
            <PlayerDot x={210} y={320} label="10" type="attack" size={8} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 10 — Flat Driven to Winger */}
      <SectionCard title='Routine 10: "Flat Driven to Winger"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          GK drives the ball flat and fast to the winger hugging the touchline, bypassing the midfield entirely. Winger has space to run into.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={500} halfPitch={false}>
            {/* GK */}
            <PlayerDot x={170} y={465} label="GK" type="gk" size={10} />
            {/* Flat driven arrow to winger on touchline */}
            <MovementArrow x1={172} y1={460} x2={30} y2={280} dashed={false} color={C.primary} />
            <PitchLabel x={80} y={360} text="Flat drive" color={C.primary} />
            {/* Winger on touchline */}
            <PlayerDot x={25} y={278} label="11" type="attack" size={9} />
            <PitchLabel x={40} y={268} text="Winger" color={C.primary} />
            {/* Midfield bypassed */}
            <PlayerDot x={150} y={330} label="D" type="defend" size={7} />
            <PlayerDot x={200} y={340} label="D" type="defend" size={7} />
            <PitchLabel x={175} y={355} text="Bypassed" color={C.textSec} />
            {/* CBs */}
            <PlayerDot x={120} y={430} label="5" type="attack" size={8} />
            <PlayerDot x={220} y={430} label="4" type="attack" size={8} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 11 — Half-Volley to Channel */}
      <SectionCard title='Routine 11: "Half-Volley to Channel"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          GK strikes a half-volley into the space between the opposition full-back and centre-back. Striker runs diagonally to meet the ball in the channel.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={500} halfPitch={false}>
            {/* GK */}
            <PlayerDot x={170} y={465} label="GK" type="gk" size={10} />
            {/* Half-volley trajectory into channel */}
            <BallFlight x1={170} y1={460} x2={80} y2={220} cx={80} cy={340} color={C.primary} />
            <PitchLabel x={65} y={275} text="Channel" color={C.primary} />
            {/* Channel zone */}
            <ZoneHighlight x={55} y={195} width={55} height={55} color="rgba(217,119,6,0.10)" />
            {/* Opposition FB and CB with gap */}
            <PlayerDot x={40} y={240} label="D" type="defend" size={7} />
            <PitchLabel x={25} y={230} text="FB" color={C.textSec} />
            <PlayerDot x={120} y={230} label="D" type="defend" size={7} />
            <PitchLabel x={135} y={225} text="CB" color={C.textSec} />
            {/* Striker diagonal run */}
            <PlayerDot x={150} y={290} label="9" type="attack" size={10} />
            <MovementArrow x1={148} y1={288} x2={85} y2={225} dashed color={C.primary} />
            <PitchLabel x={130} y={255} text="Diagonal" color={C.primary} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 12 — Centre-Circle Drop */}
      <SectionCard title='Routine 12: "Centre-Circle Drop"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          GK delivers to the centre circle area. Three midfielders position around the expected drop zone to compete for and win the second ball.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={500} halfPitch={false}>
            {/* GK */}
            <PlayerDot x={170} y={465} label="GK" type="gk" size={10} />
            {/* Ball flight to centre circle */}
            <BallFlight x1={170} y1={460} x2={170} y2={255} cx={110} cy={350} color={C.primary} />
            {/* Drop zone around centre */}
            <ZoneHighlight x={140} y={230} width={60} height={50} color="rgba(217,119,6,0.12)" />
            <PitchLabel x={170} y={225} text="Drop zone" color={C.primary} />
            {/* 3 midfielders around drop zone */}
            <PlayerDot x={130} y={270} label="8" type="attack" size={9} />
            <MovementArrow x1={130} y1={268} x2={150} y2={255} dashed color={C.primary} />
            <PlayerDot x={210} y={270} label="6" type="attack" size={9} />
            <MovementArrow x1={210} y1={268} x2={190} y2={255} dashed color={C.primary} />
            <PlayerDot x={170} y={290} label="10" type="attack" size={9} />
            <MovementArrow x1={170} y1={288} x2={170} y2={270} dashed color={C.primary} />
            {/* Target man contesting */}
            <PlayerDot x={170} y={240} label="9" type="attack" size={10} />
            <PitchLabel x={170} y={210} text="Contest" color={C.primary} />
            {/* CBs */}
            <PlayerDot x={120} y={430} label="5" type="attack" size={8} />
            <PlayerDot x={220} y={430} label="4" type="attack" size={8} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 13 — Overload Left — Switch Right */}
      <SectionCard title='Routine 13: "Overload Left — Switch Right"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Players load up on the left side, drawing the opposition press. The GK switches a long diagonal to the isolated right-back on the opposite flank.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={500} halfPitch={false}>
            {/* GK */}
            <PlayerDot x={170} y={465} label="GK" type="gk" size={10} />
            {/* Overloaded left side — 4 players */}
            <PlayerDot x={50} y={400} label="3" type="attack" size={9} />
            <PlayerDot x={60} y={360} label="8" type="attack" size={9} />
            <PlayerDot x={55} y={320} label="11" type="attack" size={9} />
            <PlayerDot x={70} y={340} label="6" type="attack" size={9} />
            <ZoneHighlight x={35} y={305} width={55} height={110} color="rgba(217,119,6,0.08)" />
            <PitchLabel x={40} y={295} text="Overload L" color={C.textSec} />
            {/* Isolated RB on right */}
            <PlayerDot x={290} y={380} label="2" type="attack" size={9} />
            <PitchLabel x={295} y={395} text="Isolated RB" color={C.primary} />
            {/* Long diagonal switch from GK */}
            <BallFlight x1={170} y1={463} x2={288} y2={378} cx={260} cy={430} color={C.primary} />
            <PitchLabel x={230} y={425} text="Switch" color={C.primary} />
            {/* CBs */}
            <PlayerDot x={130} y={430} label="5" type="attack" size={8} />
            <PlayerDot x={210} y={430} label="4" type="attack" size={8} />
            {/* Striker */}
            <PlayerDot x={170} y={250} label="9" type="attack" size={8} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 14 — CM Drops into Back Line */}
      <SectionCard title='Routine 14: "CM Drops into Back Line"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          The central midfielder drops between the two centre-backs, forming a temporary back three. The GK plays short to the CM, who then distributes forward.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={500} halfPitch={false}>
            {/* GK */}
            <PlayerDot x={170} y={465} label="GK" type="gk" size={10} />
            {/* CBs split wide */}
            <PlayerDot x={100} y={420} label="5" type="attack" size={9} />
            <PlayerDot x={240} y={420} label="4" type="attack" size={9} />
            {/* CM dropping between CBs */}
            <PlayerDot x={170} y={370} label="6" type="attack" size={9} />
            <MovementArrow x1={170} y1={345} x2={170} y2={415} dashed color={C.textSec} />
            <PitchLabel x={185} y={395} text="CM drops" color={C.primary} />
            {/* GK pass to CM */}
            <MovementArrow x1={170} y1={463} x2={170} y2={420} dashed={false} color={C.primary} />
            <PitchLabel x={180} y={445} text="Short" color={C.primary} />
            {/* CM distribution arrows forward */}
            <MovementArrow x1={170} y1={413} x2={100} y2={330} dashed={false} color={C.primary} />
            <MovementArrow x1={170} y1={413} x2={240} y2={330} dashed={false} color={C.primary} />
            <MovementArrow x1={170} y1={413} x2={170} y2={310} dashed={false} color={C.primary} />
            <PitchLabel x={175} y={300} text="Distribute" color={C.primary} />
            {/* Full-backs */}
            <PlayerDot x={40} y={370} label="3" type="attack" size={8} />
            <PlayerDot x={300} y={370} label="2" type="attack" size={8} />
            {/* Midfielders & attackers */}
            <PlayerDot x={100} y={300} label="8" type="attack" size={8} />
            <PlayerDot x={240} y={300} label="10" type="attack" size={8} />
            <PlayerDot x={170} y={230} label="9" type="attack" size={8} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 15 — Direct to Striker — Contest */}
      <SectionCard title='Routine 15: "Direct to Striker — Contest"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          The GK kicks long directly to the target striker for a contested aerial duel. Two midfielders position underneath to win the second ball.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={500} halfPitch={false}>
            {/* GK */}
            <PlayerDot x={170} y={465} label="GK" type="gk" size={10} />
            {/* Long ball flight to striker */}
            <BallFlight x1={170} y1={463} x2={170} y2={200} cx={120} cy={330} color={C.primary} />
            <PitchLabel x={115} y={320} text="Long kick" color={C.primary} />
            {/* Target striker contesting */}
            <PlayerDot x={170} y={198} label="9" type="attack" size={10} />
            <PlayerDot x={175} y={195} label="D" type="defend" size={8} />
            <PitchLabel x={185} y={188} text="Aerial duel" color={C.primary} />
            {/* Second ball zone */}
            <ZoneHighlight x={140} y={215} width={65} height={40} color="rgba(217,119,6,0.12)" />
            <PitchLabel x={172} y={245} text="2nd ball zone" color={C.primary} />
            {/* 2 midfielders underneath */}
            <PlayerDot x={140} y={260} label="8" type="attack" size={9} />
            <PlayerDot x={200} y={260} label="10" type="attack" size={9} />
            <MovementArrow x1={140} y1={258} x2={155} y2={240} dashed color={C.primary} />
            <MovementArrow x1={200} y1={258} x2={185} y2={240} dashed color={C.primary} />
            {/* CBs */}
            <PlayerDot x={120} y={420} label="5" type="attack" size={8} />
            <PlayerDot x={220} y={420} label="4" type="attack" size={8} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 16 — GK Carries to Edge */}
      <SectionCard title='Routine 16: "GK Carries to Edge"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Instead of kicking, the GK carries the ball to the edge of the box, drawing the opposition press. Once the press commits, the GK distributes short to an open centre-back.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={500} halfPitch={false}>
            {/* GK starting position */}
            <PlayerDot x={170} y={465} label="GK" type="gk" size={10} />
            {/* GK carry arrow to edge of box */}
            <MovementArrow x1={170} y1={463} x2={170} y2={400} dashed={false} color={C.primary} />
            <PitchLabel x={180} y={430} text="Carry" color={C.primary} />
            {/* GK at edge of box */}
            <PlayerDot x={170} y={398} label="GK" type="gk" size={9} />
            {/* Press coming — opposition */}
            <PlayerDot x={170} y={340} label="O9" type="defend" size={8} />
            <MovementArrow x1={170} y1={342} x2={170} y2={380} dashed color="#EF4444" />
            <PlayerDot x={120} y={350} label="O10" type="defend" size={8} />
            <MovementArrow x1={122} y1={352} x2={145} y2={385} dashed color="#EF4444" />
            <PitchLabel x={130} y={365} text="Press" color="#EF4444" />
            {/* Open CB receiving pass */}
            <PlayerDot x={250} y={410} label="4" type="attack" size={9} />
            <MovementArrow x1={172} y1={396} x2={248} y2={408} dashed={false} color={C.primary} />
            <PitchLabel x={215} y={395} text="Pass" color={C.primary} />
            {/* Other CB */}
            <PlayerDot x={90} y={410} label="5" type="attack" size={8} />
            {/* Full-backs */}
            <PlayerDot x={40} y={370} label="3" type="attack" size={8} />
            <PlayerDot x={300} y={370} label="2" type="attack" size={8} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 17 — Shadow Striker Run */}
      <SectionCard title='Routine 17: "Shadow Striker Run"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          The ball is played long to the target man who dummies or flicks it on. The shadow striker times a run behind the defence to latch onto the knock-down.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={500} halfPitch={false}>
            {/* GK */}
            <PlayerDot x={170} y={465} label="GK" type="gk" size={10} />
            {/* Ball flight to target man */}
            <BallFlight x1={170} y1={463} x2={170} y2={220} cx={130} cy={340} color={C.primary} />
            <PitchLabel x={125} y={340} text="Long kick" color={C.primary} />
            {/* Target man */}
            <PlayerDot x={170} y={218} label="9" type="attack" size={10} />
            <PitchLabel x={185} y={215} text="Target" color={C.textSec} />
            {/* Flick-on arrow */}
            <MovementArrow x1={170} y1={216} x2={200} y2={180} dashed={false} color={C.primary} />
            <PitchLabel x={210} y={178} text="Flick" color={C.primary} />
            {/* Defensive line */}
            <MarkingLine x1={80} y1={200} x2={260} y2={200} color="#EF4444" />
            <PitchLabel x={265} y={198} text="Def. line" color="#EF4444" />
            {/* Shadow striker running behind */}
            <PlayerDot x={130} y={260} label="10" type="attack" size={9} />
            <MovementArrow x1={130} y1={258} x2={200} y2={175} dashed color={C.primary} />
            <PitchLabel x={140} y={240} text="Shadow run" color={C.primary} />
            {/* CBs */}
            <PlayerDot x={120} y={420} label="5" type="attack" size={8} />
            <PlayerDot x={220} y={420} label="4" type="attack" size={8} />
            {/* Midfielder */}
            <PlayerDot x={170} y={320} label="8" type="attack" size={8} />
          </PitchSVG>
        </div>
      </SectionCard>
    </>
  )
}

/* ============================================================
   KICK-OFFS TAB
   ============================================================ */

type KOSub = 'Attacking' | 'Defending'

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
      {/* Routine 1 — Knock Back — Wide */}
      <SectionCard title='Routine 1: "Knock Back — Wide"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Knock back to CM who immediately switches the ball wide.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* Centre circle area — kick-off */}
            <PlayerDot x={170} y={250} label="9" type="attack" size={9} />
            <PlayerDot x={180} y={250} label="10" type="attack" size={9} />
            {/* Knock back */}
            <MovementArrow x1={172} y1={248} x2={170} y2={220} dashed={false} color={C.text} />
            {/* CM receives */}
            <PlayerDot x={170} y={218} label="8" type="attack" size={9} />
            <PitchLabel x={170} y={208} text="CM" color={C.textSec} />
            {/* Immediate switch wide */}
            <MovementArrow x1={172} y1={216} x2={40} y2={200} dashed={false} color={C.primary} />
            <PitchLabel x={80} y={195} text="Switch" color={C.primary} />
            {/* Winger wide */}
            <PlayerDot x={35} y={200} label="11" type="attack" size={9} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 2 — Direct Press */}
      <SectionCard title='Routine 2: "Direct Press"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Knock forward and entire team presses high immediately.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* Kick-off position */}
            <PlayerDot x={170} y={250} label="9" type="attack" size={9} />
            <PlayerDot x={180} y={250} label="10" type="attack" size={9} />
            {/* Forward knock */}
            <MovementArrow x1={175} y1={248} x2={175} y2={200} dashed={false} color={C.text} />
            {/* Team pressing high */}
            <PlayerDot x={120} y={220} label="8" type="attack" size={8} />
            <MovementArrow x1={120} y1={218} x2={120} y2={180} dashed color={C.primary} />
            <PlayerDot x={220} y={220} label="11" type="attack" size={8} />
            <MovementArrow x1={220} y1={218} x2={220} y2={180} dashed color={C.primary} />
            <PlayerDot x={170} y={230} label="7" type="attack" size={8} />
            <MovementArrow x1={170} y1={228} x2={170} y2={190} dashed color={C.primary} />
            <PitchLabel x={170} y={175} text="High press" color={C.primary} />
            {/* Defence pushing up */}
            <PlayerDot x={100} y={250} label="3" type="attack" size={8} />
            <MovementArrow x1={100} y1={248} x2={100} y2={225} dashed color={C.primary} />
            <PlayerDot x={240} y={250} label="2" type="attack" size={8} />
            <MovementArrow x1={240} y1={248} x2={240} y2={225} dashed color={C.primary} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 3 — Press Immediately — Win Ball High */}
      <SectionCard title='Routine 3: "Press Immediately — Win Ball High"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Full team press from kick-off. Aim to win the ball in the opposition half.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* Kick-off */}
            <PlayerDot x={170} y={250} label="9" type="attack" size={9} />
            <PlayerDot x={180} y={250} label="10" type="attack" size={9} />
            {/* Short knock */}
            <MovementArrow x1={175} y1={248} x2={175} y2={230} dashed={false} color={C.text} />
            {/* Full team press arrows converging */}
            <PlayerDot x={80} y={230} label="11" type="attack" size={8} />
            <MovementArrow x1={80} y1={228} x2={120} y2={170} dashed color={C.primary} />
            <PlayerDot x={260} y={230} label="7" type="attack" size={8} />
            <MovementArrow x1={260} y1={228} x2={220} y2={170} dashed color={C.primary} />
            <PlayerDot x={130} y={240} label="8" type="attack" size={8} />
            <MovementArrow x1={130} y1={238} x2={150} y2={180} dashed color={C.primary} />
            <PlayerDot x={210} y={240} label="6" type="attack" size={8} />
            <MovementArrow x1={210} y1={238} x2={190} y2={180} dashed color={C.primary} />
            {/* Target zone to win ball */}
            <ZoneHighlight x={120} y={150} width={100} height={40} color="rgba(217,119,6,0.12)" />
            <PitchLabel x={170} y={165} text="Win ball here" color={C.primary} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 4 — False 9 Drop */}
      <SectionCard title='Routine 4: "False 9 Drop"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Kick back, then the striker drops deep between the lines to receive. Both wingers push high and wide to stretch the opposition.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* Kick-off position */}
            <PlayerDot x={170} y={250} label="9" type="attack" size={9} />
            <PlayerDot x={180} y={250} label="10" type="attack" size={9} />
            {/* Back pass */}
            <MovementArrow x1={172} y1={248} x2={170} y2={220} dashed={false} color={C.text} />
            <PlayerDot x={170} y={218} label="8" type="attack" size={9} />
            {/* Striker drops deep */}
            <MovementArrow x1={175} y1={248} x2={175} y2={200} dashed color={C.primary} />
            <PitchLabel x={185} y={195} text="False 9 drop" color={C.primary} />
            {/* Winger left pushes high */}
            <PlayerDot x={50} y={230} label="11" type="attack" size={9} />
            <MovementArrow x1={50} y1={228} x2={40} y2={180} dashed color={C.primary} />
            <PitchLabel x={25} y={175} text="Wide" color={C.primary} />
            {/* Winger right pushes high */}
            <PlayerDot x={290} y={230} label="7" type="attack" size={9} />
            <MovementArrow x1={290} y1={228} x2={300} y2={180} dashed color={C.primary} />
            <PitchLabel x={305} y={175} text="Wide" color={C.primary} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 5 — Long Diagonal — Test CB */}
      <SectionCard title='Routine 5: "Long Diagonal — Test CB"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          From kick-off, play back and immediately launch a long diagonal ball to test the opposition centre-back in a 1v1 aerial duel.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* Kick-off */}
            <PlayerDot x={170} y={250} label="9" type="attack" size={9} />
            <PlayerDot x={180} y={250} label="10" type="attack" size={9} />
            {/* Back pass */}
            <MovementArrow x1={172} y1={248} x2={170} y2={225} dashed={false} color={C.text} />
            <PlayerDot x={170} y={223} label="6" type="attack" size={9} />
            {/* Long diagonal */}
            <MovementArrow x1={172} y1={221} x2={80} y2={155} dashed={false} color={C.primary} />
            <PitchLabel x={110} y={180} text="Long diagonal" color={C.primary} />
            {/* 2 players contesting */}
            <PlayerDot x={75} y={155} label="9" type="attack" size={9} />
            <PlayerDot x={85} y={160} label="D" type="defend" size={8} />
            <PitchLabel x={70} y={145} text="Contest" color={C.primary} />
            {/* Ball landing zone */}
            <ZoneHighlight x={55} y={140} width={50} height={35} color="rgba(217,119,6,0.10)" />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 6 — Sideline Switch */}
      <SectionCard title='Routine 6: "Sideline Switch"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Back pass from kick-off, then an immediate long switch to the opposite touchline to exploit the space before the opposition shifts across.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* Kick-off */}
            <PlayerDot x={170} y={250} label="9" type="attack" size={9} />
            <PlayerDot x={180} y={250} label="10" type="attack" size={9} />
            {/* Back pass */}
            <MovementArrow x1={172} y1={248} x2={170} y2={225} dashed={false} color={C.text} />
            <PlayerDot x={170} y={223} label="8" type="attack" size={9} />
            {/* Long switch to opposite touchline */}
            <MovementArrow x1={172} y1={221} x2={30} y2={200} dashed={false} color={C.primary} />
            <PitchLabel x={90} y={205} text="Switch" color={C.primary} />
            {/* Target on opposite side */}
            <PlayerDot x={25} y={200} label="11" type="attack" size={9} />
            <PitchLabel x={25} y={188} text="Space" color={C.primary} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 7 — Central Overload */}
      <SectionCard title='Routine 7: "Central Overload"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Three midfielders stay tight in the centre of the pitch. Quick short combinations through the middle to break through the opposition shape.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* Kick-off */}
            <PlayerDot x={170} y={250} label="9" type="attack" size={9} />
            <PlayerDot x={180} y={250} label="10" type="attack" size={9} />
            {/* Back pass */}
            <MovementArrow x1={172} y1={248} x2={170} y2={225} dashed={false} color={C.text} />
            {/* 3 tight central midfielders */}
            <PlayerDot x={150} y={215} label="8" type="attack" size={9} />
            <PlayerDot x={170} y={223} label="6" type="attack" size={9} />
            <PlayerDot x={190} y={215} label="10" type="attack" size={9} />
            <PitchLabel x={170} y={205} text="Tight 3" color={C.primary} />
            {/* Short combination arrows */}
            <MovementArrow x1={170} y1={221} x2={152} y2={215} dashed={false} color={C.primary} />
            <MovementArrow x1={152} y1={213} x2={188} y2={213} dashed={false} color={C.primary} />
            <MovementArrow x1={190} y1={213} x2={180} y2={195} dashed color={C.primary} />
            <PitchLabel x={185} y={190} text="Combine" color={C.primary} />
            {/* Central overload zone */}
            <ZoneHighlight x={140} y={200} width={60} height={35} color="rgba(217,119,6,0.08)" />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 8 — GK Involvement */}
      <SectionCard title='Routine 8: "GK Involvement"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Kick back through the midfield to the goalkeeper, who then distributes long to bypass the opposition midfield press entirely.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* Kick-off */}
            <PlayerDot x={170} y={250} label="9" type="attack" size={9} />
            <PlayerDot x={180} y={250} label="10" type="attack" size={9} />
            {/* Back pass chain */}
            <MovementArrow x1={172} y1={248} x2={170} y2={225} dashed={false} color={C.text} />
            <PlayerDot x={170} y={223} label="8" type="attack" size={9} />
            <MovementArrow x1={170} y1={221} x2={170} y2={180} dashed={false} color={C.text} />
            <PlayerDot x={170} y={178} label="6" type="attack" size={9} />
            <MovementArrow x1={170} y1={176} x2={170} y2={130} dashed={false} color={C.text} />
            <PlayerDot x={170} y={128} label="5" type="attack" size={9} />
            <MovementArrow x1={170} y1={126} x2={170} y2={65} dashed={false} color={C.text} />
            {/* GK receives */}
            <PlayerDot x={170} y={60} label="GK" type="gk" size={10} />
            <PitchLabel x={170} y={50} text="GK" color={C.primary} />
            {/* Long distribution from GK */}
            <BallFlight x1={170} y1={62} x2={60} y2={180} cx={60} cy={100} color={C.primary} />
            <PitchLabel x={45} y={175} text="Long dist." color={C.primary} />
            {/* Winger target */}
            <PlayerDot x={55} y={182} label="11" type="attack" size={9} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 9 — Immediate Long Ball */}
      <SectionCard title='Routine 9: "Immediate Long Ball"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          From kick-off, immediately launch a long ball into the opposition half. Three players press aggressively around the landing zone to win the second ball.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* Centre circle kick-off */}
            <PlayerDot x={170} y={250} label="9" type="attack" size={9} />
            <PlayerDot x={180} y={250} label="10" type="attack" size={9} />
            {/* Long ball arc forward */}
            <BallFlight x1={175} y1={248} x2={170} y2={100} cx={130} cy={170} color={C.primary} />
            <PitchLabel x={125} y={170} text="Long ball" color={C.primary} />
            {/* Landing zone */}
            <ZoneHighlight x={140} y={80} width={65} height={45} color="rgba(217,119,6,0.12)" />
            <PitchLabel x={172} y={75} text="Landing" color={C.primary} />
            {/* 3 pressing players around landing zone */}
            <PlayerDot x={130} y={140} label="7" type="attack" size={9} />
            <MovementArrow x1={130} y1={138} x2={148} y2={110} dashed color={C.primary} />
            <PlayerDot x={210} y={140} label="11" type="attack" size={9} />
            <MovementArrow x1={210} y1={138} x2={195} y2={110} dashed color={C.primary} />
            <PlayerDot x={170} y={160} label="8" type="attack" size={9} />
            <MovementArrow x1={170} y1={158} x2={170} y2={123} dashed color={C.primary} />
            <PitchLabel x={215} y={125} text="Press" color={C.primary} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 10 — Rehearsed 5-Pass Combo */}
      <SectionCard title='Routine 10: "Rehearsed 5-Pass Combo"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          A rehearsed five-pass sequence completed in under 8 seconds: back to CM, to dropping striker, back to CM, then a through ball to the winger breaking wide.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* Kick-off position */}
            <PlayerDot x={170} y={250} label="9" type="attack" size={9} />
            <PlayerDot x={180} y={250} label="10" type="attack" size={9} />
            {/* Pass 1: back to CM */}
            <MovementArrow x1={175} y1={248} x2={170} y2={210} dashed={false} color={C.primary} />
            <PitchLabel x={178} y={228} text="1" color={C.primary} />
            <PlayerDot x={170} y={208} label="6" type="attack" size={9} />
            {/* Pass 2: to dropping striker */}
            <MovementArrow x1={170} y1={206} x2={130} y2={185} dashed={false} color={C.primary} />
            <PitchLabel x={145} y={192} text="2" color={C.primary} />
            <PlayerDot x={128} y={183} label="9" type="attack" size={8} />
            {/* Pass 3: back to CM */}
            <MovementArrow x1={128} y1={181} x2={155} y2={170} dashed={false} color={C.primary} />
            <PitchLabel x={138} y={168} text="3" color={C.primary} />
            <PlayerDot x={157} y={168} label="8" type="attack" size={9} />
            {/* Pass 4: through ball to winger */}
            <MovementArrow x1={157} y1={166} x2={80} y2={110} dashed={false} color={C.primary} />
            <PitchLabel x={110} y={132} text="4" color={C.primary} />
            {/* Pass 5: winger receives */}
            <PlayerDot x={55} y={140} label="7" type="attack" size={9} />
            <MovementArrow x1={55} y1={138} x2={78} y2={108} dashed color={C.primary} />
            <PitchLabel x={65} y={105} text="5" color={C.primary} />
            <PlayerDot x={80} y={106} label="7" type="attack" size={8} />
            <PitchLabel x={60} y={95} text="Winger receives" color={C.primary} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 11 — Striker Presses Alone */}
      <SectionCard title='Routine 11: "Striker Presses Alone"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          The team holds a compact mid-block shape. Only the striker presses the opposition centre-back alone, forcing a hurried clearance that the team can recover.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* Mid-block shape */}
            <ZoneHighlight x={80} y={150} width={180} height={80} color="rgba(217,119,6,0.06)" />
            <PitchLabel x={170} y={240} text="Mid-block" color={C.textSec} />
            {/* Defensive line */}
            <PlayerDot x={80} y={210} label="3" type="attack" size={8} />
            <PlayerDot x={140} y={215} label="5" type="attack" size={8} />
            <PlayerDot x={200} y={215} label="4" type="attack" size={8} />
            <PlayerDot x={260} y={210} label="2" type="attack" size={8} />
            {/* Midfield line */}
            <PlayerDot x={100} y={175} label="8" type="attack" size={8} />
            <PlayerDot x={170} y={180} label="6" type="attack" size={8} />
            <PlayerDot x={240} y={175} label="10" type="attack" size={8} />
            {/* Wingers */}
            <PlayerDot x={70} y={150} label="7" type="attack" size={8} />
            <PlayerDot x={270} y={150} label="11" type="attack" size={8} />
            {/* Lone striker pressing high */}
            <PlayerDot x={170} y={80} label="9" type="attack" size={10} />
            <MovementArrow x1={170} y1={78} x2={170} y2={40} dashed={false} color={C.primary} />
            <PitchLabel x={185} y={55} text="Press alone" color={C.primary} />
            {/* Opposition CB being pressed */}
            <PlayerDot x={170} y={35} label="D" type="defend" size={8} />
            <PitchLabel x={185} y={30} text="Hurried" color="#EF4444" />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 12 — Wing Flood */}
      <SectionCard title='Routine 12: "Wing Flood"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Within 10 seconds of kick-off, overload one wing with four players creating a 4v2 situation. The ball is played quickly into the overloaded side.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* Kick-off */}
            <PlayerDot x={170} y={250} label="9" type="attack" size={9} />
            <PlayerDot x={180} y={250} label="10" type="attack" size={9} />
            {/* Ball played to wing */}
            <MovementArrow x1={175} y1={248} x2={70} y2={160} dashed={false} color={C.primary} />
            <PitchLabel x={110} y={200} text="Quick ball" color={C.primary} />
            {/* 4 players flooding left wing */}
            <PlayerDot x={50} y={150} label="7" type="attack" size={9} />
            <PlayerDot x={70} y={170} label="3" type="attack" size={9} />
            <PlayerDot x={80} y={140} label="8" type="attack" size={9} />
            <PlayerDot x={60} y={125} label="11" type="attack" size={9} />
            <ZoneHighlight x={35} y={115} width={65} height={70} color="rgba(217,119,6,0.10)" />
            <PitchLabel x={40} y={110} text="4v2 Flood" color={C.primary} />
            {/* 2 defenders on that side */}
            <PlayerDot x={55} y={100} label="D" type="defend" size={7} />
            <PlayerDot x={85} y={105} label="D" type="defend" size={7} />
            {/* Rest of team in shape */}
            <PlayerDot x={200} y={200} label="6" type="attack" size={8} />
            <PlayerDot x={260} y={180} label="2" type="attack" size={8} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 13 — Patience Build */}
      <SectionCard title='Routine 13: "Patience Build"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Play 10+ passes in your own half before progressing, drawing the opposition press out of shape. Once a gap appears, play a decisive forward pass.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* Own half passing pattern */}
            <PlayerDot x={140} y={230} label="5" type="attack" size={8} />
            <PlayerDot x={200} y={230} label="4" type="attack" size={8} />
            <PlayerDot x={170} y={200} label="6" type="attack" size={8} />
            <PlayerDot x={80} y={210} label="3" type="attack" size={8} />
            <PlayerDot x={260} y={210} label="2" type="attack" size={8} />
            {/* Short pass arrows — circulation pattern */}
            <MovementArrow x1={140} y1={228} x2={168} y2={202} dashed={false} color={C.primary} />
            <MovementArrow x1={172} y1={198} x2={200} y2={228} dashed={false} color={C.primary} />
            <MovementArrow x1={200} y1={228} x2={258} y2={210} dashed={false} color={C.primary} />
            <MovementArrow x1={258} y1={208} x2={200} y2={228} dashed={false} color={C.primary} />
            <MovementArrow x1={140} y1={228} x2={82} y2={210} dashed={false} color={C.primary} />
            <MovementArrow x1={82} y1={208} x2={140} y2={228} dashed={false} color={C.primary} />
            <PitchLabel x={170} y={245} text="10+ passes" color={C.textSec} />
            {/* Own half zone */}
            <ZoneHighlight x={65} y={190} width={210} height={55} color="rgba(217,119,6,0.06)" />
            {/* Decisive forward pass into gap */}
            <MovementArrow x1={170} y1={198} x2={170} y2={110} dashed={false} color={C.primary} />
            <PitchLabel x={180} y={150} text="Forward" color={C.primary} />
            {/* Gap in opposition */}
            <ZoneHighlight x={145} y={95} width={55} height={25} color="rgba(217,119,6,0.15)" />
            <PitchLabel x={172} y={90} text="Gap" color={C.primary} />
            {/* Striker receiving */}
            <PlayerDot x={170} y={105} label="9" type="attack" size={9} />
          </PitchSVG>
        </div>
      </SectionCard>
    </>
  )
}

function KODefending() {
  return (
    <>
      {/* Routine 1 — Mid-Block Shape */}
      <SectionCard title='Routine 1: "Mid-Block Shape"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          Drop into a compact mid-block on the opposition kick-off. Stay disciplined.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* Opposition kick-off */}
            <PlayerDot x={170} y={250} label="O" type="defend" size={7} />
            <PlayerDot x={180} y={250} label="O" type="defend" size={7} />
            {/* Mid-block shape */}
            <ZoneHighlight x={80} y={140} width={180} height={80} color="rgba(217,119,6,0.06)" />
            {/* Defensive line */}
            <PlayerDot x={100} y={200} label="3" type="attack" size={8} />
            <PlayerDot x={150} y={195} label="5" type="attack" size={8} />
            <PlayerDot x={190} y={195} label="4" type="attack" size={8} />
            <PlayerDot x={240} y={200} label="2" type="attack" size={8} />
            {/* Midfield line */}
            <PlayerDot x={110} y={170} label="11" type="attack" size={8} />
            <PlayerDot x={150} y={165} label="8" type="attack" size={8} />
            <PlayerDot x={190} y={165} label="6" type="attack" size={8} />
            <PlayerDot x={230} y={170} label="7" type="attack" size={8} />
            {/* Forwards stay central */}
            <PlayerDot x={155} y={145} label="10" type="attack" size={8} />
            <PlayerDot x={185} y={145} label="9" type="attack" size={8} />
            <PitchLabel x={170} y={135} text="Mid-block" color={C.primary} />
          </PitchSVG>
        </div>
      </SectionCard>

      {/* Routine 2 — High Press Trigger */}
      <SectionCard title='Routine 2: "High Press Trigger"' onEdit={() => {}}>
        <p style={{ color: C.textSec, fontSize: 13, margin: '0 0 6px' }}>
          If opposition plays short from kick-off, trigger a high press immediately.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <PitchSVG width={340} height={260} halfPitch>
            {/* Opposition kick-off */}
            <PlayerDot x={170} y={250} label="O" type="defend" size={7} />
            <PlayerDot x={180} y={250} label="O" type="defend" size={7} />
            {/* Short pass trigger */}
            <MovementArrow x1={172} y1={248} x2={150} y2={235} dashed={false} color={C.textSec} />
            <PlayerDot x={148} y={235} label="O" type="defend" size={7} />
            <PitchLabel x={135} y={228} text="Short = trigger" color="#EF4444" />
            {/* Press activation */}
            <PlayerDot x={155} y={210} label="9" type="attack" size={9} />
            <MovementArrow x1={155} y1={212} x2={150} y2={232} dashed color={C.primary} />
            <PlayerDot x={185} y={210} label="10" type="attack" size={9} />
            <MovementArrow x1={185} y1={212} x2={175} y2={235} dashed color={C.primary} />
            {/* Support press */}
            <PlayerDot x={110} y={220} label="11" type="attack" size={8} />
            <MovementArrow x1={112} y1={220} x2={130} y2={230} dashed color={C.primary} />
            <PlayerDot x={230} y={220} label="7" type="attack" size={8} />
            <MovementArrow x1={228} y1={220} x2={200} y2={235} dashed color={C.primary} />
            <PitchLabel x={170} y={200} text="Press!" color={C.primary} />
          </PitchSVG>
        </div>
      </SectionCard>
    </>
  )
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export default function NLSetPiecesView() {
  const [activeTab, setActiveTab] = useState<Tab>('CORNERS')

  const tabs: Tab[] = ['CORNERS', 'FREE KICKS', 'THROW-INS', 'PENALTIES', 'GOAL KICKS', 'KICK-OFFS', 'STATS']

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
            Harfield FC &middot; Northern Premier League
          </span>
        </div>
        <h1 style={{ color: C.text, fontSize: 24, fontWeight: 700, margin: '0 0 20px' }}>
          Set Pieces
        </h1>

        {/* Tab bar */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            marginBottom: 24,
            overflowX: 'auto',
            paddingBottom: 4,
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
                color: activeTab === t ? '#000' : C.textSec,
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
      </div>
    </div>
  )
}
