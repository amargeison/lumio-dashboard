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
