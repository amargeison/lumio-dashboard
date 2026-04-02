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

type Tab = 'CORNERS' | 'FREE KICKS' | 'THROW-INS' | 'PENALTIES' | 'STATS'
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
    </>
  )
}

/* ============================================================
   PENALTIES TAB
   ============================================================ */

function PenaltiesTab() {
  const takers = [
    { order: 1, name: 'Liam Grady', note: 'Prefers bottom-left' },
    { order: 2, name: 'Josh Whitmore', note: 'Power down the middle' },
    { order: 3, name: 'Marcus Webb', note: 'Placement, top corners' },
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
                  background: C.primary,
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
              <div>
                <div style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                <div style={{ color: C.textSec, fontSize: 12 }}>{t.note}</div>
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
   MAIN COMPONENT
   ============================================================ */

export default function NLSetPiecesView() {
  const [activeTab, setActiveTab] = useState<Tab>('CORNERS')

  const tabs: Tab[] = ['CORNERS', 'FREE KICKS', 'THROW-INS', 'PENALTIES', 'STATS']

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
        {activeTab === 'STATS' && <StatsTab />}
      </div>
    </div>
  )
}
