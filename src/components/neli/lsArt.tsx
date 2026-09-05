'use client'

/**
 * LanguageScreen illustration library.
 * One consistent picture-book style: soft gradient skies, chunky rounded shapes,
 * 2–3 tone shading, gentle drop shadows and a small "sparkle" of life in every card.
 * All vector — crisp at any size, no external assets.
 */

import React from 'react'

// ─── Palette ─────────────────────────────────────────────────────────────────
const P = {
  skyTop: '#BFE3FF', skyBot: '#EAF6FF', nightTop: '#1B2A5B', nightBot: '#3E4C8A',
  sunsetTop: '#FFD3A5', sunsetBot: '#FFF1E0', grass: '#7CC96B', grassDk: '#5FB253', grassLt: '#A8E08E',
  sand: '#F5DEB0', sandDk: '#E4C58F', waterTop: '#5EC2F0', waterBot: '#2B8FD6', floor: '#F3E4CF', floorDk: '#E1CDB0', wall: '#FFF6E8',
  ink: '#1F2A44', line: '#2B3A5A', shadow: 'rgba(31,42,68,0.18)', white: '#FFFFFF',
  red: '#F25F5C', redDk: '#C6403E', orange: '#FF9F43', orangeDk: '#E0801F', yellow: '#FFD65C', yellowDk: '#E8B830',
  green: '#4CC48A', greenDk: '#2F9E68', blue: '#4F9DE8', blueDk: '#2E6FBF', purple: '#9C7BF0', purpleDk: '#7052C7',
  pink: '#FF8FB1', pinkDk: '#E0608A', brown: '#A9713F', brownDk: '#7A4D26', tan: '#E8B98A', grey: '#B9C2D0', greyDk: '#8B95A7', teal: '#3CC8C0', tealDk: '#22A19A',
  skin: '#F6C9A6', skinDk: '#E0A882', hair: '#4A2F1C',
}

// ─── Scene backgrounds ───────────────────────────────────────────────────────
type Bg = 'sky' | 'night' | 'indoor' | 'water' | 'sunset' | 'meadow' | 'plain' | 'lab' | 'beach'

function Defs({ k }: { k: string }) {
  return (
    <defs>
      <linearGradient id={`${k}-sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={P.skyTop} /><stop offset="1" stopColor={P.skyBot} /></linearGradient>
      <linearGradient id={`${k}-night`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={P.nightTop} /><stop offset="1" stopColor={P.nightBot} /></linearGradient>
      <linearGradient id={`${k}-sunset`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={P.sunsetTop} /><stop offset="1" stopColor={P.sunsetBot} /></linearGradient>
      <linearGradient id={`${k}-grass`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={P.grassLt} /><stop offset="1" stopColor={P.grass} /></linearGradient>
      <linearGradient id={`${k}-water`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={P.waterTop} /><stop offset="1" stopColor={P.waterBot} /></linearGradient>
      <linearGradient id={`${k}-floor`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={P.floor} /><stop offset="1" stopColor={P.floorDk} /></linearGradient>
      <linearGradient id={`${k}-wall`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFBF4" /><stop offset="1" stopColor={P.wall} /></linearGradient>
      <linearGradient id={`${k}-lab`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E9F1FB" /><stop offset="1" stopColor="#D6E4F5" /></linearGradient>
      <radialGradient id={`${k}-glow`} cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#FFF4C2" stopOpacity="0.9" /><stop offset="1" stopColor="#FFF4C2" stopOpacity="0" /></radialGradient>
      <radialGradient id={`${k}-vig`} cx="0.5" cy="0.45" r="0.75"><stop offset="0.6" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.08" /></radialGradient>
      <filter id={`${k}-soft`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" /></filter>
    </defs>
  )
}

function Cloud({ x, y, s = 1, o = 0.9 }: { x: number; y: number; s?: number; o?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      <ellipse cx="0" cy="0" rx="22" ry="11" fill="#fff" />
      <ellipse cx="-12" cy="-4" rx="12" ry="9" fill="#fff" />
      <ellipse cx="10" cy="-5" rx="14" ry="10" fill="#fff" />
    </g>
  )
}
function Sun({ x, y, r = 16, k }: { x: number; y: number; r?: number; k: string }) {
  return (<g><circle cx={x} cy={y} r={r * 2.4} fill={`url(#${k}-glow)`} /><circle cx={x} cy={y} r={r} fill={P.yellow} /><circle cx={x - r * 0.25} cy={y - r * 0.25} r={r * 0.45} fill="#FFE68A" /></g>)
}
function Star({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 -5 L1.4 -1.6 L5 -1.4 L2.2 1 L3 4.8 L0 2.8 L-3 4.8 L-2.2 1 L-5 -1.4 L-1.4 -1.6 Z" fill="#FFF3B0" />
}
function Shadow({ x, y, rx = 46, ry = 9 }: { x: number; y: number; rx?: number; ry?: number }) {
  return <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={P.shadow} />
}

function Scene({ k, bg, children }: { k: string; bg: Bg; children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 240 240" width="100%" height="100%" style={{ display: 'block' }}>
      <Defs k={k} />
      {bg === 'sky' && (<><rect width="240" height="240" fill={`url(#${k}-sky)`} /><Sun x={196} y={44} k={k} /><Cloud x={52} y={40} /><Cloud x={150} y={70} s={0.7} o={0.8} /><rect y="176" width="240" height="64" fill={`url(#${k}-grass)`} /><path d="M0 178 Q60 168 120 178 T240 178 V240 H0Z" fill={P.grass} /></>)}
      {bg === 'meadow' && (<><rect width="240" height="240" fill={`url(#${k}-sky)`} /><Sun x={44} y={40} r={14} k={k} /><Cloud x={160} y={44} s={0.8} /><path d="M0 150 Q70 120 140 150 T240 140 V240 H0Z" fill={P.grassLt} /><path d="M0 172 Q80 150 160 172 T240 165 V240 H0Z" fill={`url(#${k}-grass)`} /></>)}
      {bg === 'night' && (<><rect width="240" height="240" fill={`url(#${k}-night)`} /><Star x={30} y={30} /><Star x={80} y={20} s={0.7} /><Star x={200} y={28} s={0.9} /><Star x={150} y={50} s={0.6} /><Star x={215} y={90} s={0.7} /><circle cx="190" cy="60" r="20" fill="#FFF3B0" /><circle cx="198" cy="54" r="18" fill={`url(#${k}-night)`} opacity="0.9" /><path d="M0 190 Q60 176 120 190 T240 186 V240 H0Z" fill="#26356B" /></>)}
      {bg === 'sunset' && (<><rect width="240" height="240" fill={`url(#${k}-sunset)`} /><Sun x={120} y={120} r={26} k={k} /><path d="M0 160 Q60 150 120 162 T240 158 V240 H0Z" fill="#E7A56B" /><path d="M0 186 Q80 176 160 188 T240 184 V240 H0Z" fill="#C97B45" /></>)}
      {bg === 'water' && (<><rect width="240" height="240" fill={`url(#${k}-sky)`} /><Sun x={44} y={40} r={14} k={k} /><Cloud x={170} y={40} s={0.8} /><rect y="120" width="240" height="120" fill={`url(#${k}-water)`} /><path d="M0 126 Q30 118 60 126 T120 126 T180 126 T240 126 V134 H0Z" fill="#8ED8F8" opacity="0.8" /><path d="M0 170 Q30 164 60 170 T120 170 T180 170 T240 170" fill="none" stroke="#A9E3FB" strokeWidth="3" opacity="0.6" /></>)}
      {bg === 'beach' && (<><rect width="240" height="240" fill={`url(#${k}-sky)`} /><Sun x={200} y={40} r={16} k={k} /><Cloud x={60} y={44} /><rect y="120" width="240" height="60" fill={`url(#${k}-water)`} /><path d="M0 172 Q60 160 120 174 T240 168 V240 H0Z" fill={P.sand} /><path d="M0 200 Q80 194 160 202 T240 198 V240 H0Z" fill={P.sandDk} /></>)}
      {bg === 'indoor' && (<><rect width="240" height="240" fill={`url(#${k}-wall)`} /><rect y="164" width="240" height="76" fill={`url(#${k}-floor)`} /><rect x="0" y="160" width="240" height="6" fill="#D8C2A2" /><rect x="150" y="34" width="66" height="76" rx="6" fill="#BFE3FF" stroke="#E8D8C2" strokeWidth="6" /><line x1="183" y1="34" x2="183" y2="110" stroke="#E8D8C2" strokeWidth="4" /><line x1="150" y1="72" x2="216" y2="72" stroke="#E8D8C2" strokeWidth="4" /></>)}
      {bg === 'lab' && (<><rect width="240" height="240" fill={`url(#${k}-lab)`} /><rect y="170" width="240" height="70" fill="#C8D6E8" /><rect y="166" width="240" height="8" fill="#B4C4DA" /><rect x="20" y="40" width="200" height="14" rx="4" fill="#B4C4DA" opacity="0.6" /><rect x="40" y="30" width="18" height="24" rx="3" fill={P.blue} opacity="0.7" /><rect x="64" y="34" width="14" height="20" rx="3" fill={P.green} opacity="0.7" /><rect x="84" y="28" width="16" height="26" rx="3" fill={P.pink} opacity="0.7" /></>)}
      {bg === 'plain' && (<><rect width="240" height="240" fill="#F7F9FC" /><circle cx="120" cy="120" r="88" fill="#EEF3FA" /></>)}
      {children}
      <rect width="240" height="240" fill={`url(#${k}-vig)`} />
    </svg>
  )
}

// ─── Faces (used by the emotion words) ───────────────────────────────────────
function Face({ mood, k }: { mood: 'happy' | 'grumpy' | 'sad' | 'neutral' | 'confused' | 'sleeping'; k: string }) {
  const mouth = {
    happy: <path d="M92 150 Q120 178 148 150" fill="#8B3A3A" stroke={P.ink} strokeWidth="4" strokeLinecap="round" />,
    grumpy: <path d="M96 166 Q120 148 144 166" fill="none" stroke={P.ink} strokeWidth="4.5" strokeLinecap="round" />,
    sad: <path d="M98 168 Q120 152 142 168" fill="none" stroke={P.ink} strokeWidth="4" strokeLinecap="round" />,
    neutral: <path d="M98 160 L142 160" fill="none" stroke={P.ink} strokeWidth="4" strokeLinecap="round" />,
    confused: <path d="M98 164 Q112 154 126 162 Q136 168 144 158" fill="none" stroke={P.ink} strokeWidth="4" strokeLinecap="round" />,
    sleeping: <ellipse cx="120" cy="164" rx="8" ry="5" fill="#8B3A3A" />,
  }[mood]
  const eyes = mood === 'sleeping'
    ? (<><path d="M86 122 Q98 132 110 122" fill="none" stroke={P.ink} strokeWidth="4" strokeLinecap="round" /><path d="M130 122 Q142 132 154 122" fill="none" stroke={P.ink} strokeWidth="4" strokeLinecap="round" /></>)
    : (<><ellipse cx="98" cy="122" rx="9" ry="11" fill={P.ink} /><ellipse cx="142" cy="122" rx="9" ry="11" fill={P.ink} /><circle cx="101" cy="118" r="3.5" fill="#fff" /><circle cx="145" cy="118" r="3.5" fill="#fff" /></>)
  const brows = {
    happy: <><path d="M84 104 Q98 96 112 104" fill="none" stroke={P.hair} strokeWidth="5" strokeLinecap="round" /><path d="M128 104 Q142 96 156 104" fill="none" stroke={P.hair} strokeWidth="5" strokeLinecap="round" /></>,
    grumpy: <><path d="M84 98 Q98 106 112 110" fill="none" stroke={P.hair} strokeWidth="6" strokeLinecap="round" /><path d="M156 98 Q142 106 128 110" fill="none" stroke={P.hair} strokeWidth="6" strokeLinecap="round" /></>,
    sad: <><path d="M86 108 Q98 100 112 104" fill="none" stroke={P.hair} strokeWidth="5" strokeLinecap="round" /><path d="M154 108 Q142 100 128 104" fill="none" stroke={P.hair} strokeWidth="5" strokeLinecap="round" /></>,
    neutral: <><path d="M86 104 L112 104" stroke={P.hair} strokeWidth="5" strokeLinecap="round" /><path d="M128 104 L154 104" stroke={P.hair} strokeWidth="5" strokeLinecap="round" /></>,
    confused: <><path d="M86 106 Q98 102 112 106" fill="none" stroke={P.hair} strokeWidth="5" strokeLinecap="round" /><path d="M128 98 Q142 90 156 100" fill="none" stroke={P.hair} strokeWidth="5" strokeLinecap="round" /></>,
    sleeping: <><path d="M86 106 Q98 102 112 106" fill="none" stroke={P.hair} strokeWidth="5" strokeLinecap="round" /><path d="M128 106 Q142 102 154 106" fill="none" stroke={P.hair} strokeWidth="5" strokeLinecap="round" /></>,
  }[mood]
  const bgColor = { happy: '#FFF1B8', grumpy: '#FFD6D6', sad: '#D6E6FF', neutral: '#E8ECF2', confused: '#EADFFF', sleeping: '#D9E2F7' }[mood]
  return (
    <>
      <circle cx="120" cy="120" r="96" fill={bgColor} />
      <Shadow x={120} y={214} rx={52} ry={8} />
      <circle cx="120" cy="130" r="64" fill={P.skin} />
      <circle cx="120" cy="130" r="64" fill="none" stroke={P.skinDk} strokeWidth="3" />
      <path d="M60 118 Q64 66 120 64 Q176 66 180 118 Q160 96 120 100 Q80 96 60 118Z" fill={P.hair} />
      <circle cx="58" cy="132" r="9" fill={P.skin} stroke={P.skinDk} strokeWidth="3" /><circle cx="182" cy="132" r="9" fill={P.skin} stroke={P.skinDk} strokeWidth="3" />
      {mood !== 'grumpy' && mood !== 'sad' && <><circle cx="86" cy="148" r="8" fill="#FFB1B1" opacity="0.7" /><circle cx="154" cy="148" r="8" fill="#FFB1B1" opacity="0.7" /></>}
      {mood === 'grumpy' && <><circle cx="86" cy="148" r="9" fill="#FF8A8A" opacity="0.6" /><circle cx="154" cy="148" r="9" fill="#FF8A8A" opacity="0.6" /></>}
      {mood === 'sad' && <><path d="M100 140 Q98 156 102 164" fill="none" stroke="#6FB3FF" strokeWidth="5" strokeLinecap="round" /></>}
      {brows}{eyes}{mouth}
      {mood === 'sleeping' && <text x="176" y="76" fontSize="30" fontWeight="800" fill={P.blueDk} fontFamily="Georgia, serif">z</text>}
      {mood === 'sleeping' && <text x="196" y="52" fontSize="22" fontWeight="800" fill={P.blueDk} fontFamily="Georgia, serif">z</text>}
      {mood === 'confused' && <text x="176" y="80" fontSize="44" fontWeight="800" fill={P.purpleDk} fontFamily="Georgia, serif">?</text>}
    </>
  )
}

// ─── Little people (running / climbing / swimming / dancing / eating) ───────
function Kid({ x, y, s = 1, pose, shirt = P.blue, k }: { x: number; y: number; s?: number; pose: 'run' | 'climb' | 'dance' | 'eat' | 'ride'; shirt?: string; k: string }) {
  const head = <><circle cx="0" cy="-58" r="17" fill={P.skin} /><path d="M-17 -62 Q-14 -84 0 -82 Q16 -84 17 -62 Q8 -70 0 -68 Q-8 -70 -17 -62Z" fill={P.hair} /><circle cx="-6" cy="-58" r="2.2" fill={P.ink} /><circle cx="6" cy="-58" r="2.2" fill={P.ink} /><path d="M-5 -50 Q0 -46 5 -50" fill="none" stroke={P.ink} strokeWidth="2" strokeLinecap="round" /></>
  const body = (rot: number) => <rect x="-14" y="-42" width="28" height="40" rx="10" fill={shirt} transform={`rotate(${rot} 0 -22)`} />
  const limb = (x1: number, y1: number, x2: number, y2: number, c: string, w = 9) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round" />
  const pants = '#3F5F9E'
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {pose === 'run' && (<>{limb(-8, -6, -30, 14, pants, 11)}{limb(8, -6, 26, -2, pants, 11)}{limb(-30, 14, -34, 22, P.red, 8)}{limb(26, -2, 34, 4, P.red, 8)}{body(-8)}{limb(-10, -36, -34, -20, P.skin)}{limb(10, -36, 32, -48, P.skin)}{head}</>)}
      {pose === 'climb' && (<>{limb(-8, -6, -22, 18, pants, 11)}{limb(8, -6, 14, 22, pants, 11)}{body(0)}{limb(-10, -38, -30, -66, P.skin)}{limb(10, -38, 26, -60, P.skin)}{head}</>)}
      {pose === 'dance' && (<>{limb(-8, -6, -22, 20, pants, 11)}{limb(8, -6, 20, 22, pants, 11)}{body(6)}{limb(-10, -38, -36, -62, P.skin)}{limb(10, -38, 36, -60, P.skin)}{head}</>)}
      {pose === 'eat' && (<>{body(0)}{limb(-10, -34, -24, -8, P.skin)}{limb(10, -34, 14, -50, P.skin)}{head}</>)}
      {pose === 'ride' && (<>{limb(-6, -6, -18, 18, pants, 11)}{limb(6, -6, 18, 18, pants, 11)}{body(-16)}{limb(-6, -38, 20, -30, P.skin)}{head}</>)}
    </g>
  )
}

// ─── Subject drawings ───────────────────────────────────────────────────────
type Draw = (k: string) => React.ReactNode
const ART: Record<string, { bg: Bg; draw: Draw }> = {
  // Expressive vocabulary
  ball: { bg: 'meadow', draw: k => (<><Shadow x={120} y={196} /><circle cx="120" cy="150" r="52" fill={P.red} /><path d="M120 98 A52 52 0 0 1 172 150 L120 150Z" fill={P.white} opacity="0.95" /><path d="M120 202 A52 52 0 0 1 68 150 L120 150Z" fill={P.white} opacity="0.95" /><circle cx="120" cy="150" r="52" fill="none" stroke={P.redDk} strokeWidth="4" /><path d="M120 98 V202 M68 150 H172" stroke={P.redDk} strokeWidth="3" /><circle cx="100" cy="126" r="10" fill="#fff" opacity="0.6" /></>) },
  umbrella: { bg: 'sky', draw: k => (<><g fill="none" stroke="#7FB9F0" strokeWidth="3" strokeLinecap="round" opacity="0.8">{[24, 60, 96, 150, 190, 222].map((x, i) => <line key={i} x1={x} y1={20 + i * 12} x2={x - 6} y2={38 + i * 12} />)}{[40, 80, 130, 176, 210].map((x, i) => <line key={i} x1={x} y1={88 + i * 10} x2={x - 6} y2={106 + i * 10} />)}</g><Shadow x={120} y={198} rx={30} ry={6} /><path d="M40 122 Q120 30 200 122 Z" fill={P.red} /><path d="M40 122 Q60 106 80 122 Q100 106 120 122 Q140 106 160 122 Q180 106 200 122" fill={P.redDk} opacity="0.9" /><path d="M120 44 Q80 60 60 118 L120 118Z" fill="#FF8C89" opacity="0.6" /><path d="M120 122 V190 Q120 206 106 206 Q94 206 94 194" fill="none" stroke={P.brownDk} strokeWidth="6" strokeLinecap="round" /><circle cx="120" cy="40" r="5" fill={P.redDk} /></>) },
  bicycle: { bg: 'meadow', draw: k => (<><Shadow x={120} y={200} rx={80} ry={8} /><circle cx="70" cy="160" r="38" fill="none" stroke={P.ink} strokeWidth="8" /><circle cx="170" cy="160" r="38" fill="none" stroke={P.ink} strokeWidth="8" /><g stroke="#8B95A7" strokeWidth="2">{[0, 45, 90, 135].map(a => <line key={a} x1="70" y1="160" x2={70 + 36 * Math.cos(a * Math.PI / 180)} y2={160 + 36 * Math.sin(a * Math.PI / 180)} />)}{[0, 45, 90, 135].map(a => <line key={a} x1="170" y1="160" x2={170 + 36 * Math.cos(a * Math.PI / 180)} y2={160 + 36 * Math.sin(a * Math.PI / 180)} />)}</g><path d="M70 160 L112 100 L156 100 L170 160 M112 100 L120 160 L70 160 M120 160 L156 100" fill="none" stroke={P.orange} strokeWidth="8" strokeLinejoin="round" strokeLinecap="round" /><path d="M156 100 L150 78 M138 78 L162 78" stroke={P.ink} strokeWidth="7" strokeLinecap="round" /><rect x="100" y="90" width="30" height="10" rx="5" fill={P.ink} /><circle cx="120" cy="160" r="8" fill={P.ink} /><line x1="120" y1="160" x2="132" y2="176" stroke={P.ink} strokeWidth="5" strokeLinecap="round" /></>) },
  telescope: { bg: 'night', draw: k => (<><Shadow x={130} y={214} rx={56} ry={8} /><g transform="rotate(-32 120 120)"><rect x="40" y="108" width="90" height="26" rx="8" fill={P.brown} /><rect x="120" y="102" width="70" height="38" rx="10" fill={P.brownDk} /><rect x="184" y="98" width="20" height="46" rx="6" fill="#4C556B" /><rect x="34" y="112" width="12" height="18" rx="4" fill="#4C556B" /><rect x="128" y="108" width="6" height="26" fill="#C9A06B" /><rect x="176" y="106" width="6" height="30" fill="#C9A06B" /></g><path d="M118 148 L92 214 M118 148 L142 214 M118 148 V212" stroke="#5A4634" strokeWidth="7" strokeLinecap="round" /><circle cx="118" cy="146" r="9" fill="#C9A06B" /></>) },
  compass: { bg: 'plain', draw: k => (<><Shadow x={120} y={210} rx={60} ry={8} /><circle cx="120" cy="124" r="82" fill="#C9A06B" /><circle cx="120" cy="124" r="82" fill="none" stroke="#9E7A47" strokeWidth="5" /><circle cx="120" cy="124" r="66" fill="#FFF8EA" /><circle cx="120" cy="124" r="66" fill="none" stroke="#E4D2B0" strokeWidth="2" /><g fill="#9E7A47" fontFamily="Georgia, serif" fontWeight="700" fontSize="18" textAnchor="middle"><text x="120" y="80">N</text><text x="120" y="182">S</text><text x="172" y="130">E</text><text x="68" y="130">W</text></g><g stroke="#C9B48D" strokeWidth="2">{[45, 135, 225, 315].map(a => <line key={a} x1={120 + 52 * Math.cos(a * Math.PI / 180)} y1={124 + 52 * Math.sin(a * Math.PI / 180)} x2={120 + 60 * Math.cos(a * Math.PI / 180)} y2={124 + 60 * Math.sin(a * Math.PI / 180)} />)}</g><path d="M120 72 L132 124 L120 136 L108 124Z" fill={P.red} /><path d="M120 176 L132 124 L120 112 L108 124Z" fill="#4C556B" /><circle cx="120" cy="124" r="7" fill="#FFD65C" stroke="#9E7A47" strokeWidth="2" /><rect x="112" y="30" width="16" height="16" rx="4" fill="#9E7A47" /></>) },
  thermometer: { bg: 'indoor', draw: k => (<><Shadow x={120} y={212} rx={30} ry={6} /><rect x="96" y="30" width="48" height="160" rx="24" fill="#fff" stroke="#C7D0DD" strokeWidth="4" /><rect x="114" y="52" width="12" height="110" rx="6" fill="#FFD6D6" /><rect x="114" y="104" width="12" height="58" rx="6" fill={P.red} /><circle cx="120" cy="170" r="20" fill={P.red} /><circle cx="114" cy="164" r="6" fill="#FF9A98" /><g stroke="#8B95A7" strokeWidth="3" strokeLinecap="round">{[60, 76, 92, 108, 124, 140].map((y, i) => <line key={y} x1="130" y1={y} x2={i % 2 ? 138 : 144} y2={y} />)}</g><text x="152" y="66" fontSize="12" fill="#8B95A7" fontFamily="sans-serif" fontWeight="700">100°</text><text x="152" y="130" fontSize="12" fill="#8B95A7" fontFamily="sans-serif" fontWeight="700">50°</text></>) },
  microscope: { bg: 'lab', draw: k => (<><Shadow x={120} y={212} rx={62} ry={8} /><rect x="56" y="186" width="128" height="20" rx="8" fill="#3B4763" /><rect x="132" y="70" width="18" height="120" rx="6" fill="#4C556B" /><path d="M141 80 Q100 60 90 96" fill="none" stroke="#4C556B" strokeWidth="16" strokeLinecap="round" /><g transform="rotate(20 96 110)"><rect x="82" y="40" width="28" height="80" rx="8" fill="#5D6A88" /><rect x="86" y="24" width="20" height="22" rx="6" fill="#2F3A55" /><rect x="80" y="118" width="32" height="18" rx="6" fill="#2F3A55" /></g><rect x="64" y="150" width="80" height="14" rx="5" fill="#6B7A99" /><rect x="86" y="146" width="36" height="8" rx="3" fill="#BFE3FF" stroke="#7FB9F0" strokeWidth="2" /><circle cx="104" cy="176" r="12" fill="#2F3A55" /><circle cx="104" cy="176" r="6" fill="#7FB9F0" /><circle cx="168" cy="120" r="9" fill="#2F3A55" /><circle cx="168" cy="120" r="4" fill="#8B95A7" /></>) },
  trumpet: { bg: 'sunset', draw: k => (<><Shadow x={124} y={196} rx={84} ry={7} /><g transform="rotate(-12 120 130)"><path d="M150 112 Q196 96 222 70 Q230 130 222 190 Q196 164 150 148Z" fill={P.yellowDk} /><path d="M152 116 Q194 102 216 84 Q222 130 216 176 Q194 158 152 144Z" fill={P.yellow} /><ellipse cx="222" cy="130" rx="7" ry="58" fill="#FFF0A8" /><rect x="40" y="122" width="116" height="16" rx="8" fill={P.yellow} /><rect x="40" y="122" width="116" height="5" rx="2.5" fill="#FFF0A8" /><rect x="60" y="146" width="80" height="12" rx="6" fill={P.yellowDk} /><path d="M66 138 V150 M134 138 V150" stroke={P.yellowDk} strokeWidth="8" strokeLinecap="round" /><g><rect x="78" y="96" width="12" height="30" rx="4" fill={P.yellowDk} /><rect x="98" y="96" width="12" height="30" rx="4" fill={P.yellowDk} /><rect x="118" y="96" width="12" height="30" rx="4" fill={P.yellowDk} /><circle cx="84" cy="92" r="7" fill="#FFF8D6" stroke={P.yellowDk} strokeWidth="2.5" /><circle cx="104" cy="92" r="7" fill="#FFF8D6" stroke={P.yellowDk} strokeWidth="2.5" /><circle cx="124" cy="92" r="7" fill="#FFF8D6" stroke={P.yellowDk} strokeWidth="2.5" /></g><rect x="18" y="120" width="26" height="20" rx="7" fill={P.yellowDk} /><rect x="12" y="124" width="10" height="12" rx="4" fill="#C9A028" /></g><g fill={P.orangeDk} opacity="0.55" fontFamily="Georgia, serif" fontWeight="800"><text x="36" y="70" fontSize="26">♪</text><text x="62" y="46" fontSize="20">♫</text></g></>) },
  anchor: { bg: 'water', draw: k => (<><Shadow x={120} y={214} rx={62} ry={8} /><circle cx="120" cy="44" r="14" fill="none" stroke="#3B4763" strokeWidth="9" /><rect x="112" y="56" width="16" height="118" rx="6" fill="#4C556B" /><rect x="74" y="78" width="92" height="14" rx="7" fill="#4C556B" /><path d="M120 176 Q60 176 44 120 L64 122 Q72 156 120 156 Q168 156 176 122 L196 120 Q180 176 120 176Z" fill="#4C556B" /><path d="M44 120 L38 104 L62 112Z" fill="#4C556B" /><path d="M196 120 L202 104 L178 112Z" fill="#4C556B" /><rect x="116" y="56" width="4" height="118" fill="#8B95A7" opacity="0.5" /></>) },
  amphora: { bg: 'indoor', draw: k => (<><Shadow x={120} y={212} rx={40} ry={7} /><path d="M96 46 H144 L140 62 Q178 84 166 140 Q160 180 140 194 H100 Q80 180 74 140 Q62 84 100 62Z" fill="#D08A4E" /><path d="M100 62 Q92 100 96 150 Q98 176 108 190 L100 194 Q80 180 74 140 Q62 84 100 62Z" fill="#B76F35" /><rect x="90" y="36" width="60" height="16" rx="6" fill="#B76F35" /><path d="M102 78 Q62 92 76 130" fill="none" stroke="#B76F35" strokeWidth="10" strokeLinecap="round" /><path d="M138 78 Q178 92 164 130" fill="none" stroke="#B76F35" strokeWidth="10" strokeLinecap="round" /><path d="M86 118 Q120 108 154 118 M84 132 Q120 122 156 132" fill="none" stroke="#8B4E22" strokeWidth="3" /><g fill="#F3D6B0"><circle cx="106" cy="125" r="3" /><circle cx="120" cy="122" r="3" /><circle cx="134" cy="125" r="3" /></g><rect x="92" y="194" width="56" height="12" rx="4" fill="#8B4E22" /></>) },
  flask: { bg: 'lab', draw: k => (<><Shadow x={120} y={212} rx={54} ry={7} /><path d="M100 40 H140 V96 L184 176 Q192 194 172 196 H68 Q48 194 56 176 L100 96Z" fill="#EAF6FF" stroke="#7FB9F0" strokeWidth="5" strokeLinejoin="round" /><path d="M86 130 H154 L178 176 Q184 190 168 190 H72 Q56 190 62 176Z" fill={P.green} opacity="0.85" /><path d="M86 130 H154" stroke="#A7F0CE" strokeWidth="5" /><circle cx="100" cy="160" r="6" fill="#C8FFE4" /><circle cx="128" cy="172" r="4" fill="#C8FFE4" /><circle cx="150" cy="156" r="5" fill="#C8FFE4" /><circle cx="120" cy="112" r="6" fill="#B5E6FF" opacity="0.8" /><circle cx="132" cy="90" r="4" fill="#B5E6FF" opacity="0.8" /><rect x="96" y="32" width="48" height="12" rx="4" fill="#7FB9F0" /></>) },
  accordion: { bg: 'indoor', draw: k => (<><Shadow x={120} y={210} rx={80} ry={8} /><rect x="30" y="70" width="48" height="110" rx="10" fill={P.red} /><rect x="162" y="70" width="48" height="110" rx="10" fill={P.red} /><g fill="#fff"><rect x="40" y="86" width="10" height="16" rx="2" /><rect x="40" y="108" width="10" height="16" rx="2" /><rect x="40" y="130" width="10" height="16" rx="2" /><rect x="40" y="152" width="10" height="16" rx="2" /></g><g fill={P.ink}><rect x="52" y="90" width="8" height="10" rx="2" /><rect x="52" y="134" width="8" height="10" rx="2" /></g><g fill="#fff"><circle cx="176" cy="92" r="5" /><circle cx="192" cy="92" r="5" /><circle cx="176" cy="112" r="5" /><circle cx="192" cy="112" r="5" /><circle cx="176" cy="132" r="5" /><circle cx="192" cy="132" r="5" /><circle cx="176" cy="152" r="5" /><circle cx="192" cy="152" r="5" /></g><path d="M78 80 L92 74 L106 82 L120 74 L134 82 L148 74 L162 80 V172 L148 178 L134 170 L120 178 L106 170 L92 178 L78 172Z" fill="#2F3A55" /><g stroke="#4C556B" strokeWidth="3"><path d="M92 74 V178 M106 82 V170 M120 74 V178 M134 82 V170 M148 74 V178" /></g><path d="M78 80 L92 74 L106 82 L120 74 L134 82 L148 74 L162 80" fill="none" stroke={P.yellow} strokeWidth="3" /><rect x="40" y="58" width="28" height="12" rx="4" fill={P.redDk} /><path d="M48 58 Q54 30 100 30" fill="none" stroke={P.brownDk} strokeWidth="5" strokeLinecap="round" /></>) },

  // Receptive vocabulary — people & emotions
  sleeping: { bg: 'night', draw: k => (<><rect x="24" y="130" width="192" height="70" rx="14" fill="#5B7AC7" /><rect x="24" y="118" width="192" height="30" rx="12" fill="#EEF3FF" /><rect x="34" y="96" width="60" height="34" rx="12" fill="#fff" /><circle cx="118" cy="112" r="24" fill={P.skin} /><path d="M94 108 Q98 84 118 86 Q138 84 142 108 Q130 100 118 102 Q106 100 94 108Z" fill={P.hair} /><path d="M108 112 Q113 117 118 112" fill="none" stroke={P.ink} strokeWidth="2.5" strokeLinecap="round" /><path d="M120 112 Q125 117 130 112" fill="none" stroke={P.ink} strokeWidth="2.5" strokeLinecap="round" /><path d="M114 124 Q119 127 124 124" fill="none" stroke={P.ink} strokeWidth="2" strokeLinecap="round" /><path d="M30 148 Q120 132 216 148 V196 H30Z" fill="#7FA0E8" /><path d="M60 156 Q100 146 140 160 Q180 172 216 156" fill="none" stroke="#9DB7F0" strokeWidth="4" /><text x="150" y="86" fontSize="26" fontWeight="800" fill="#FFF3B0" fontFamily="Georgia, serif">z</text><text x="168" y="64" fontSize="20" fontWeight="800" fill="#FFF3B0" fontFamily="Georgia, serif">z</text><text x="182" y="46" fontSize="14" fontWeight="800" fill="#FFF3B0" fontFamily="Georgia, serif">z</text></>) },
  running: { bg: 'meadow', draw: k => (<><Shadow x={112} y={198} rx={40} ry={7} /><Kid x={110} y={176} s={1.35} pose="run" shirt={P.green} k={k} /><g stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.8"><line x1="30" y1="120" x2="56" y2="120" /><line x1="22" y1="136" x2="50" y2="136" /><line x1="34" y1="152" x2="54" y2="152" /></g></>) },
  eating: { bg: 'indoor', draw: k => (<><rect x="30" y="150" width="180" height="14" rx="4" fill="#C9A06B" /><rect x="40" y="164" width="14" height="40" fill="#A97F4C" /><rect x="186" y="164" width="14" height="40" fill="#A97F4C" /><Kid x={120} y={150} s={1.25} pose="eat" shirt={P.red} k={k} /><ellipse cx="120" cy="150" rx="46" ry="10" fill="#fff" stroke="#C7D0DD" strokeWidth="2" /><circle cx="108" cy="146" r="7" fill={P.green} /><circle cx="124" cy="144" r="8" fill={P.orange} /><circle cx="136" cy="148" r="6" fill={P.red} /><circle cx="134" cy="86" r="8" fill={P.red} /><path d="M132 78 Q134 72 138 72" fill="none" stroke={P.greenDk} strokeWidth="2" /></>) },
  theatre: { bg: 'indoor', draw: k => (<><rect x="0" y="0" width="240" height="240" fill="#6A2E52" /><path d="M0 0 H240 V40 Q120 70 0 40Z" fill="#8E3D6E" /><g fill="#FFD65C"><Star x={30} y={70} s={1.2} /><Star x={210} y={64} s={1} /><Star x={120} y={30} s={0.8} /></g><g transform="translate(76 110)"><path d="M-38 -40 Q0 -60 38 -40 Q44 20 0 44 Q-44 20 -38 -40Z" fill="#FFF3B0" stroke="#E8B830" strokeWidth="3" /><path d="M-24 -18 Q-14 -28 -4 -18" fill="none" stroke={P.ink} strokeWidth="4" strokeLinecap="round" /><path d="M4 -18 Q14 -28 24 -18" fill="none" stroke={P.ink} strokeWidth="4" strokeLinecap="round" /><path d="M-20 8 Q0 30 20 8" fill="#8B3A3A" stroke={P.ink} strokeWidth="3" /></g><g transform="translate(164 130)"><path d="M-38 -40 Q0 -60 38 -40 Q44 20 0 44 Q-44 20 -38 -40Z" fill="#BFD7FF" stroke="#4F9DE8" strokeWidth="3" /><path d="M-24 -14 Q-14 -6 -4 -14" fill="none" stroke={P.ink} strokeWidth="4" strokeLinecap="round" /><path d="M4 -14 Q14 -6 24 -14" fill="none" stroke={P.ink} strokeWidth="4" strokeLinecap="round" /><path d="M-20 22 Q0 4 20 22" fill="none" stroke={P.ink} strokeWidth="4" strokeLinecap="round" /><path d="M-10 -4 Q-12 6 -8 12" fill="none" stroke="#6FB3FF" strokeWidth="3" strokeLinecap="round" /></g></>) },
  happy: { bg: 'plain', draw: k => <Face mood="happy" k={k} /> },
  grumpy: { bg: 'plain', draw: k => <Face mood="grumpy" k={k} /> },
  sad: { bg: 'plain', draw: k => <Face mood="sad" k={k} /> },
  neutral: { bg: 'plain', draw: k => <Face mood="neutral" k={k} /> },
  confused: { bg: 'plain', draw: k => <Face mood="confused" k={k} /> },
  tiredface: { bg: 'plain', draw: k => <Face mood="sleeping" k={k} /> },
  climbing: { bg: 'sky', draw: k => (<><path d="M40 240 L100 60 Q120 40 140 60 L200 240Z" fill="#8B95A7" /><path d="M60 240 L104 90 Q120 74 136 90 L180 240Z" fill="#A9B3C4" /><g fill="#7C8798"><circle cx="90" cy="150" r="6" /><circle cx="150" cy="120" r="6" /><circle cx="112" cy="196" r="7" /><circle cx="140" cy="176" r="5" /></g><Kid x={122} y={160} s={1.1} pose="climb" shirt={P.orange} k={k} /><path d="M100 120 Q110 90 120 100" fill="none" stroke="#FFD65C" strokeWidth="4" strokeLinecap="round" /><circle cx="128" cy="62" r="6" fill={P.red} /><path d="M128 62 V44 L146 50 L128 56" fill={P.red} /></>) },
  swimming: { bg: 'water', draw: k => (<><ellipse cx="120" cy="160" rx="70" ry="10" fill="#8ED8F8" opacity="0.7" /><circle cx="150" cy="140" r="17" fill={P.skin} /><path d="M133 136 Q136 116 150 118 Q164 116 167 136 Q160 130 150 132 Q140 130 133 136Z" fill={P.hair} /><circle cx="145" cy="140" r="2.2" fill={P.ink} /><circle cx="156" cy="140" r="2.2" fill={P.ink} /><path d="M146 148 Q150 152 155 148" fill="none" stroke={P.ink} strokeWidth="2" strokeLinecap="round" /><path d="M132 154 Q100 146 70 158" fill="none" stroke={P.blue} strokeWidth="18" strokeLinecap="round" /><path d="M120 150 Q108 122 84 120" fill="none" stroke={P.skin} strokeWidth="9" strokeLinecap="round" /><path d="M168 150 Q186 136 196 116" fill="none" stroke={P.skin} strokeWidth="9" strokeLinecap="round" /><g fill="none" stroke="#fff" strokeWidth="3" opacity="0.8" strokeLinecap="round"><path d="M40 168 Q52 160 64 168" /><path d="M180 172 Q194 164 208 172" /><path d="M96 180 Q108 172 120 180" /></g><circle cx="200" cy="100" r="5" fill="#fff" opacity="0.6" /></>) },
  cycling: { bg: 'meadow', draw: k => (<><Shadow x={120} y={200} rx={80} ry={8} /><circle cx="72" cy="168" r="30" fill="none" stroke={P.ink} strokeWidth="7" /><circle cx="168" cy="168" r="30" fill="none" stroke={P.ink} strokeWidth="7" /><path d="M72 168 L106 118 L150 118 L168 168 M106 118 L118 168 L72 168 M118 168 L150 118" fill="none" stroke={P.red} strokeWidth="7" strokeLinejoin="round" /><path d="M150 118 L146 100 M134 100 H158" stroke={P.ink} strokeWidth="6" strokeLinecap="round" /><rect x="94" y="110" width="26" height="9" rx="4" fill={P.ink} /><Kid x={112} y={112} s={1.05} pose="ride" shirt={P.purple} k={k} /><circle cx="112" cy="46" r="0" /><path d="M100 36 Q112 24 126 36 Q128 50 112 50 Q96 50 100 36Z" fill={P.yellow} /></>) },
  dancing: { bg: 'indoor', draw: k => (<><g fill={P.yellow} opacity="0.9"><Star x={40} y={60} s={1.4} /><Star x={200} y={50} s={1.1} /><Star x={60} y={120} s={0.8} /><Star x={196} y={128} s={0.9} /></g><g fill={P.purpleDk} fontFamily="Georgia, serif" fontWeight="800"><text x="28" y="100" fontSize="26">♪</text><text x="180" y="90" fontSize="30">♫</text><text x="150" y="60" fontSize="20">♪</text></g><Shadow x={120} y={200} rx={40} ry={7} /><Kid x={120} y={178} s={1.35} pose="dance" shirt={P.pink} k={k} /></>) },
  // Animals & things
  elephant: { bg: 'meadow', draw: k => (<><Shadow x={124} y={204} rx={80} ry={9} /><ellipse cx="140" cy="140" rx="70" ry="52" fill={P.grey} /><rect x="92" y="160" width="22" height="42" rx="8" fill={P.grey} /><rect x="130" y="162" width="22" height="42" rx="8" fill={P.grey} /><rect x="168" y="160" width="22" height="42" rx="8" fill={P.greyDk} /><rect x="112" y="162" width="22" height="42" rx="8" fill={P.greyDk} /><circle cx="76" cy="118" r="42" fill={P.grey} /><ellipse cx="48" cy="112" rx="26" ry="32" fill={P.greyDk} /><ellipse cx="52" cy="112" rx="18" ry="24" fill="#D5DBE6" /><path d="M64 148 Q40 170 46 206 Q58 214 68 200 Q60 180 76 160" fill={P.grey} /><circle cx="86" cy="110" r="4" fill={P.ink} /><path d="M92 126 Q98 138 110 132" fill="none" stroke={P.greyDk} strokeWidth="3" strokeLinecap="round" /><path d="M96 138 L100 156" stroke="#fff" strokeWidth="6" strokeLinecap="round" /><path d="M204 128 Q222 140 200 166" fill="none" stroke={P.grey} strokeWidth="8" strokeLinecap="round" /></>) },
  ant: { bg: 'meadow', draw: k => (<><rect x="0" y="196" width="240" height="44" fill="#8B5E3C" /><ellipse cx="120" cy="200" rx="120" ry="12" fill={P.grass} /><g stroke={P.ink} strokeWidth="5" strokeLinecap="round" fill="none"><path d="M100 150 L74 176 L70 192" /><path d="M116 150 L110 178 L104 194" /><path d="M136 150 L140 178 L146 194" /><path d="M96 138 L60 130" /><path d="M150 140 L184 130" /></g><ellipse cx="150" cy="140" rx="30" ry="22" fill="#5A2E12" /><ellipse cx="112" cy="138" rx="20" ry="16" fill="#7A3E1E" /><circle cx="82" cy="130" r="18" fill="#5A2E12" /><circle cx="74" cy="126" r="4" fill="#fff" /><circle cx="73" cy="126" r="2" fill={P.ink} /><path d="M72 114 Q60 100 52 104 M84 114 Q84 96 96 94" fill="none" stroke="#5A2E12" strokeWidth="4" strokeLinecap="round" /><circle cx="160" cy="130" r="8" fill="#9A5A32" opacity="0.6" /></>) },
  bird: { bg: 'sky', draw: k => (<><path d="M20 210 Q60 160 140 190 Q180 200 226 170" fill="none" stroke={P.brownDk} strokeWidth="9" strokeLinecap="round" /><g fill={P.green}><ellipse cx="60" cy="182" rx="10" ry="5" transform="rotate(-30 60 182)" /><ellipse cx="190" cy="180" rx="10" ry="5" transform="rotate(30 190 180)" /></g><ellipse cx="118" cy="140" rx="40" ry="32" fill={P.blue} /><path d="M100 128 Q60 118 70 148 Q90 156 110 146Z" fill={P.blueDk} /><path d="M150 152 Q184 160 186 176 Q170 174 148 164Z" fill={P.blueDk} /><circle cx="140" cy="116" r="24" fill={P.blue} /><circle cx="148" cy="112" r="4.5" fill={P.ink} /><circle cx="150" cy="110" r="1.6" fill="#fff" /><path d="M162 118 L184 122 L162 128Z" fill={P.orange} /><ellipse cx="116" cy="150" rx="18" ry="12" fill="#8FC4FF" /><path d="M110 172 L106 184 M120 172 L124 184" stroke={P.orange} strokeWidth="4" strokeLinecap="round" /><g fill="none" stroke={P.ink} strokeWidth="2.5" strokeLinecap="round" opacity="0.6"><path d="M40 70 q8 -10 16 0" /><path d="M64 56 q8 -10 16 0" /></g></>) },
  flower: { bg: 'meadow', draw: k => (<><path d="M120 200 V120" stroke={P.greenDk} strokeWidth="8" strokeLinecap="round" /><path d="M120 168 Q92 160 86 138 Q112 140 120 168Z" fill={P.green} /><path d="M120 182 Q150 176 156 152 Q128 154 120 182Z" fill={P.green} />{[0, 60, 120, 180, 240, 300].map(a => <ellipse key={a} cx="120" cy="82" rx="18" ry="30" fill={P.pink} transform={`rotate(${a} 120 110)`} />)}{[30, 90, 150, 210, 270, 330].map(a => <ellipse key={a} cx="120" cy="86" rx="14" ry="26" fill="#FFB3CB" transform={`rotate(${a} 120 110)`} />)}<circle cx="120" cy="110" r="22" fill={P.yellow} /><circle cx="120" cy="110" r="22" fill="none" stroke={P.yellowDk} strokeWidth="3" /><g fill={P.yellowDk}><circle cx="112" cy="104" r="2.5" /><circle cx="126" cy="106" r="2.5" /><circle cx="118" cy="116" r="2.5" /></g><g fill="#fff" opacity="0.85"><circle cx="46" cy="190" r="5" /><circle cx="196" cy="186" r="5" /><circle cx="70" cy="204" r="4" /></g></>) },
  window: { bg: 'indoor', draw: k => (<><rect x="40" y="30" width="160" height="160" rx="10" fill="#8B5E3C" /><rect x="52" y="42" width="136" height="136" rx="4" fill={`url(#${k}-sky)`} /><Sun x={160} y={72} r={12} k={k} /><Cloud x={96} y={80} s={0.7} /><path d="M52 150 Q100 132 140 150 T188 146 V178 H52Z" fill={P.grass} /><rect x="116" y="42" width="8" height="136" fill="#8B5E3C" /><rect x="52" y="106" width="136" height="8" fill="#8B5E3C" /><rect x="30" y="188" width="180" height="12" rx="4" fill="#A97F4C" /><rect x="60" y="130" width="10" height="20" rx="3" fill={P.red} /><circle cx="70" cy="126" r="8" fill={P.red} /><path d="M56 60 L62 54 M180 60 L174 54" stroke="#fff" strokeWidth="4" opacity="0.8" strokeLinecap="round" /></>) },
  brickwall: { bg: 'meadow', draw: k => (<><rect x="0" y="60" width="240" height="140" fill="#D9694F" />{[0, 1, 2, 3, 4, 5].map(r => <g key={r}>{[0, 1, 2, 3, 4, 5].map(c => <rect key={c} x={(r % 2 ? -22 : 0) + c * 44} y={62 + r * 23} width="40" height="19" rx="2" fill={c % 3 === r % 3 ? '#C85A42' : '#E07358'} />)}</g>)}<rect x="0" y="56" width="240" height="8" fill="#B54B36" /><path d="M0 200 H240" stroke="#B54B36" strokeWidth="4" /><g fill={P.green}><path d="M14 200 q6 -18 12 0" /><path d="M200 200 q6 -18 12 0" /><path d="M214 200 q6 -22 12 0" /></g></>) },
  tree: { bg: 'meadow', draw: k => (<><Shadow x={120} y={198} rx={52} ry={8} /><rect x="108" y="130" width="24" height="70" rx="8" fill={P.brown} /><path d="M108 160 Q92 150 84 136 M132 150 Q148 142 154 128" fill="none" stroke={P.brown} strokeWidth="7" strokeLinecap="round" /><circle cx="120" cy="96" r="52" fill={P.greenDk} /><circle cx="86" cy="112" r="34" fill={P.green} /><circle cx="154" cy="112" r="34" fill={P.green} /><circle cx="120" cy="76" r="36" fill={P.green} /><circle cx="100" cy="84" r="24" fill={P.grassLt} opacity="0.8" /><g fill={P.red}><circle cx="98" cy="112" r="5" /><circle cx="140" cy="100" r="5" /><circle cx="124" cy="126" r="5" /><circle cx="150" cy="128" r="5" /></g></>) },
  box: { bg: 'indoor', draw: k => (<><Shadow x={120} y={206} rx={70} ry={8} /><path d="M56 110 L120 84 L184 110 L120 136Z" fill="#E9C08B" /><path d="M56 110 L120 136 V200 L56 174Z" fill="#C99A5F" /><path d="M184 110 L120 136 V200 L184 174Z" fill="#D9AA6E" /><path d="M56 110 L120 84 L100 74 L36 100Z" fill="#F1CD9C" /><path d="M184 110 L120 84 L140 74 L204 100Z" fill="#E3BB84" /><path d="M120 136 V200" stroke="#B4854B" strokeWidth="3" /><path d="M70 150 L106 164" stroke="#8B5E3C" strokeWidth="5" strokeLinecap="round" opacity="0.5" /><path d="M170 150 L134 164" stroke="#8B5E3C" strokeWidth="5" strokeLinecap="round" opacity="0.5" /></>) },
  egg: { bg: 'indoor', draw: k => (<><rect x="20" y="150" width="200" height="60" rx="16" fill="#D8B48A" /><path d="M40 150 Q120 110 200 150 Q200 170 120 176 Q40 170 40 150Z" fill="#E9C9A2" /><g fill="#C9A06B"><path d="M60 160 q8 -12 16 -2" /><path d="M170 158 q8 -12 16 -2" /><path d="M96 168 q8 -12 16 -2" /></g><path d="M120 60 Q164 64 164 130 Q164 168 120 168 Q76 168 76 130 Q76 64 120 60Z" fill="#FFF8EA" /><path d="M120 60 Q164 64 164 130 Q164 168 120 168 Q76 168 76 130 Q76 64 120 60Z" fill="none" stroke="#E4D2B0" strokeWidth="3" /><ellipse cx="104" cy="96" rx="10" ry="16" fill="#fff" opacity="0.8" /><path d="M136 110 L142 122 L134 132 L144 146" fill="none" stroke="#C9B48D" strokeWidth="2.5" strokeLinecap="round" /></>) },
  rock: { bg: 'meadow', draw: k => (<><Shadow x={120} y={196} rx={82} ry={9} /><path d="M44 178 Q40 130 80 112 Q120 90 168 110 Q204 128 196 178Z" fill="#7C8798" /><path d="M56 178 Q56 138 92 122 L120 104 L150 116 L176 146 L178 178Z" fill="#A9B3C4" /><path d="M92 122 L120 104 L150 116 L128 140Z" fill="#C6CFDA" /><path d="M56 178 Q56 138 92 122 L128 140 L112 178Z" fill="#B7C0CF" /><path d="M128 140 L150 116 L176 146 L178 178 L112 178Z" fill="#98A3B5" /><path d="M100 132 L112 126 M140 150 L150 138" stroke="#E4E9F0" strokeWidth="3" strokeLinecap="round" /><circle cx="60" cy="184" r="10" fill="#A9B3C4" /><circle cx="186" cy="186" r="8" fill="#7C8798" /><g fill={P.green}><path d="M30 178 q6 -18 12 0" /><path d="M204 180 q6 -18 12 0" /></g></>) },
  shield: { bg: 'plain', draw: k => (<><Shadow x={120} y={212} rx={50} ry={7} /><path d="M120 34 L190 60 Q190 150 120 200 Q50 150 50 60Z" fill="#4C556B" /><path d="M120 46 L178 68 Q178 144 120 186 Q62 144 62 68Z" fill={P.blue} /><path d="M120 46 L178 68 Q178 144 120 186Z" fill={P.blueDk} /><path d="M120 46 V186" stroke="#FFD65C" strokeWidth="6" /><path d="M64 110 H176" stroke="#FFD65C" strokeWidth="6" /><circle cx="120" cy="110" r="16" fill={P.yellow} /><Star x={120} y={110} s={1.8} /></>) },
  owl: { bg: 'night', draw: k => (<><path d="M20 206 Q80 190 160 200 Q200 206 230 196" fill="none" stroke={P.brownDk} strokeWidth="10" strokeLinecap="round" /><ellipse cx="120" cy="140" rx="54" ry="60" fill="#8B5E3C" /><ellipse cx="120" cy="156" rx="36" ry="40" fill="#D9A877" /><g fill="#C58C58"><ellipse cx="108" cy="150" rx="8" ry="10" /><ellipse cx="132" cy="150" rx="8" ry="10" /><ellipse cx="120" cy="170" rx="8" ry="10" /></g><path d="M70 96 L84 70 L100 96Z" fill="#8B5E3C" /><path d="M170 96 L156 70 L140 96Z" fill="#8B5E3C" /><circle cx="98" cy="112" r="22" fill="#FFF8EA" /><circle cx="142" cy="112" r="22" fill="#FFF8EA" /><circle cx="98" cy="112" r="12" fill={P.yellow} /><circle cx="142" cy="112" r="12" fill={P.yellow} /><circle cx="98" cy="112" r="6" fill={P.ink} /><circle cx="142" cy="112" r="6" fill={P.ink} /><circle cx="101" cy="109" r="2" fill="#fff" /><circle cx="145" cy="109" r="2" fill="#fff" /><path d="M112 128 L120 142 L128 128Z" fill={P.orange} /><path d="M66 150 Q54 170 70 190" fill="none" stroke="#7A4D26" strokeWidth="10" strokeLinecap="round" /><path d="M174 150 Q186 170 170 190" fill="none" stroke="#7A4D26" strokeWidth="10" strokeLinecap="round" /><path d="M104 196 L98 206 M108 196 L108 208 M136 196 L142 206 M132 196 L132 208" stroke={P.orange} strokeWidth="4" strokeLinecap="round" /></>) },
  chicken: { bg: 'meadow', draw: k => (<><Shadow x={120} y={198} rx={50} ry={8} /><ellipse cx="124" cy="140" rx="52" ry="42" fill="#FFF8EA" /><ellipse cx="150" cy="150" rx="26" ry="18" fill="#F1E4CC" /><path d="M74 130 Q46 110 60 92 Q70 116 84 120Z" fill="#F1E4CC" /><circle cx="94" cy="100" r="28" fill="#FFF8EA" /><path d="M84 74 Q90 60 98 74 Q102 58 110 74 Q112 62 118 76Z" fill={P.red} /><circle cx="86" cy="98" r="4" fill={P.ink} /><path d="M66 104 L48 110 L66 116Z" fill={P.orange} /><path d="M70 118 Q66 130 76 128" fill={P.red} /><path d="M108 178 L104 196 M100 196 H110 M136 178 L140 196 M132 196 H144" stroke={P.orange} strokeWidth="4" strokeLinecap="round" /><g fill="#FFD65C"><circle cx="196" cy="188" r="5" /><circle cx="206" cy="180" r="4" /></g></>) },
  lion: { bg: 'sunset', draw: k => (<><Shadow x={120} y={206} rx={72} ry={8} /><circle cx="120" cy="120" r="72" fill={P.orangeDk} />{[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(a => <path key={a} d="M120 40 L132 60 L108 60Z" fill={P.orangeDk} transform={`rotate(${a} 120 120)`} />)}<circle cx="120" cy="124" r="52" fill={P.orange} /><ellipse cx="120" cy="146" rx="30" ry="22" fill="#FFD8A8" /><circle cx="82" cy="80" r="12" fill={P.orange} /><circle cx="158" cy="80" r="12" fill={P.orange} /><circle cx="82" cy="80" r="6" fill="#FFD8A8" /><circle cx="158" cy="80" r="6" fill="#FFD8A8" /><circle cx="102" cy="116" r="6" fill={P.ink} /><circle cx="138" cy="116" r="6" fill={P.ink} /><circle cx="104" cy="114" r="2" fill="#fff" /><circle cx="140" cy="114" r="2" fill="#fff" /><path d="M112 134 L128 134 L120 144Z" fill="#7A4D26" /><path d="M120 144 V152 M112 154 Q120 160 128 154" fill="none" stroke="#7A4D26" strokeWidth="3" strokeLinecap="round" /><g stroke="#7A4D26" strokeWidth="2" strokeLinecap="round"><path d="M92 146 L70 142 M92 152 L72 156 M148 146 L170 142 M148 152 L168 156" /></g></>) },
  dolphin: { bg: 'water', draw: k => (<><path d="M50 150 Q90 96 150 104 Q200 112 206 132 Q198 150 184 146 Q160 176 108 172 Q70 168 50 150Z" fill="#6FA9E8" /><path d="M64 150 Q100 122 150 120 Q184 124 194 136 Q170 160 110 160 Q80 158 64 150Z" fill="#A9D2FF" /><path d="M120 106 L106 74 L140 100Z" fill="#4F86C6" /><path d="M96 158 L82 182 L116 168Z" fill="#4F86C6" /><path d="M50 150 Q34 140 26 156 Q36 168 52 158Z" fill="#4F86C6" /><path d="M184 146 Q210 146 216 136 Q206 130 196 132" fill="#6FA9E8" /><circle cx="184" cy="126" r="4" fill={P.ink} /><path d="M196 138 Q204 138 208 134" fill="none" stroke="#2E5F96" strokeWidth="2.5" strokeLinecap="round" /><g fill="#fff" opacity="0.7"><circle cx="70" cy="110" r="4" /><circle cx="60" cy="98" r="3" /><circle cx="78" cy="94" r="2.5" /></g></>) },
  chameleon: { bg: 'meadow', draw: k => (<><path d="M20 176 Q80 150 150 168 Q200 180 230 160" fill="none" stroke={P.brownDk} strokeWidth="10" strokeLinecap="round" /><path d="M60 150 Q90 96 150 108 Q186 116 190 138 Q178 156 150 152 Q110 148 84 158Z" fill={P.green} /><path d="M84 158 Q100 136 150 138 Q170 140 176 146" fill="none" stroke={P.grassLt} strokeWidth="6" strokeLinecap="round" /><g fill={P.greenDk}><circle cx="110" cy="128" r="6" /><circle cx="140" cy="124" r="5" /><circle cx="160" cy="136" r="4" /></g><path d="M60 150 Q34 150 36 172 Q46 184 62 172 Q52 166 60 160Z" fill={P.green} /><circle cx="166" cy="124" r="12" fill="#fff" /><circle cx="168" cy="124" r="6" fill={P.ink} /><circle cx="170" cy="122" r="2" fill="#fff" /><path d="M190 138 Q214 128 226 136" fill="none" stroke={P.pink} strokeWidth="4" strokeLinecap="round" /><circle cx="228" cy="136" r="4" fill={P.pink} /><path d="M100 152 L96 172 M130 150 L134 172" stroke={P.greenDk} strokeWidth="6" strokeLinecap="round" /><path d="M120 104 Q126 90 138 96" fill="none" stroke={P.green} strokeWidth="6" strokeLinecap="round" /></>) },
  penguin: { bg: 'water', draw: k => (<><path d="M0 160 Q60 140 120 156 T240 150 V240 H0Z" fill="#EAF6FF" /><path d="M0 200 Q80 186 160 200 T240 196 V240 H0Z" fill="#D9ECFA" /><Shadow x={120} y={204} rx={44} ry={7} /><ellipse cx="120" cy="140" rx="46" ry="60" fill={P.ink} /><ellipse cx="120" cy="150" rx="30" ry="44" fill="#fff" /><circle cx="120" cy="96" r="34" fill={P.ink} /><ellipse cx="108" cy="98" rx="10" ry="12" fill="#fff" /><ellipse cx="132" cy="98" rx="10" ry="12" fill="#fff" /><circle cx="110" cy="100" r="4" fill={P.ink} /><circle cx="130" cy="100" r="4" fill={P.ink} /><path d="M112 112 L128 112 L120 122Z" fill={P.orange} /><path d="M78 130 Q60 150 74 176" fill="none" stroke={P.ink} strokeWidth="12" strokeLinecap="round" /><path d="M162 130 Q180 150 166 176" fill="none" stroke={P.ink} strokeWidth="12" strokeLinecap="round" /><ellipse cx="104" cy="200" rx="14" ry="6" fill={P.orange} /><ellipse cx="136" cy="200" rx="14" ry="6" fill={P.orange} /><path d="M100 80 Q120 70 140 80" fill="none" stroke={P.red} strokeWidth="8" strokeLinecap="round" /></>) },
  fish: { bg: 'water', draw: k => (<><rect width="240" height="240" fill={`url(#${k}-water)`} /><path d="M40 200 Q50 170 44 150 M60 210 Q70 180 62 156 M190 206 Q198 176 192 160" fill="none" stroke={P.greenDk} strokeWidth="6" strokeLinecap="round" /><path d="M170 130 L212 100 V160Z" fill={P.orangeDk} /><ellipse cx="116" cy="130" rx="60" ry="40" fill={P.orange} /><path d="M100 96 Q116 70 134 96Z" fill={P.orangeDk} /><path d="M104 164 Q120 186 136 164Z" fill={P.orangeDk} /><g fill="#FFD3A0" opacity="0.9"><circle cx="100" cy="130" r="8" /><circle cx="124" cy="120" r="7" /><circle cx="122" cy="146" r="7" /><circle cx="144" cy="132" r="6" /></g><circle cx="76" cy="122" r="9" fill="#fff" /><circle cx="74" cy="122" r="5" fill={P.ink} /><path d="M60 138 Q66 142 72 138" fill="none" stroke={P.orangeDk} strokeWidth="2.5" strokeLinecap="round" /><g fill="#fff" opacity="0.7"><circle cx="50" cy="90" r="4" /><circle cx="40" cy="74" r="3" /><circle cx="56" cy="64" r="2.5" /></g></>) },
  parrot: { bg: 'meadow', draw: k => (<><path d="M20 190 Q120 170 220 190" fill="none" stroke={P.brownDk} strokeWidth="10" strokeLinecap="round" /><path d="M96 92 Q60 140 90 176 Q120 196 150 172 Q176 146 154 96Z" fill={P.red} /><path d="M104 108 Q84 150 106 172 Q124 184 140 168 Q152 148 138 106Z" fill={P.yellow} /><path d="M86 120 Q56 150 78 178 Q60 150 86 120Z" fill={P.blue} /><path d="M150 118 Q184 140 166 178 Q184 146 150 118Z" fill={P.blue} /><circle cx="126" cy="80" r="32" fill={P.red} /><circle cx="116" cy="78" r="11" fill="#fff" /><circle cx="114" cy="78" r="5" fill={P.ink} /><path d="M94 84 Q76 90 82 108 Q98 106 104 96Z" fill="#4C556B" /><path d="M98 96 Q90 108 100 112" fill="#8B95A7" /><path d="M118 176 L112 190 M126 176 L128 190" stroke="#4C556B" strokeWidth="4" strokeLinecap="round" /><path d="M136 168 Q150 200 176 208" fill="none" stroke={P.blue} strokeWidth="10" strokeLinecap="round" /><path d="M136 168 Q148 196 168 204" fill="none" stroke={P.green} strokeWidth="5" strokeLinecap="round" /></>) },
  butterfly: { bg: 'meadow', draw: k => (<><g transform="translate(120 130)"><path d="M0 -10 Q-40 -80 -80 -40 Q-90 0 -40 8Z" fill={P.purple} /><path d="M0 -10 Q40 -80 80 -40 Q90 0 40 8Z" fill={P.purple} /><path d="M0 10 Q-50 20 -60 50 Q-40 70 -6 40Z" fill={P.pink} /><path d="M0 10 Q50 20 60 50 Q40 70 6 40Z" fill={P.pink} /><path d="M-8 -8 Q-36 -52 -60 -34 Q-64 -8 -30 2Z" fill="#C5B2FF" /><path d="M8 -8 Q36 -52 60 -34 Q64 -8 30 2Z" fill="#C5B2FF" /><g fill="#FFD65C"><circle cx="-50" cy="-30" r="7" /><circle cx="50" cy="-30" r="7" /><circle cx="-34" cy="40" r="5" /><circle cx="34" cy="40" r="5" /></g><rect x="-7" y="-30" width="14" height="70" rx="7" fill={P.ink} /><circle cx="0" cy="-36" r="10" fill={P.ink} /><path d="M-4 -44 Q-14 -60 -22 -58 M4 -44 Q14 -60 22 -58" fill="none" stroke={P.ink} strokeWidth="3" strokeLinecap="round" /><circle cx="-22" cy="-58" r="3" fill={P.ink} /><circle cx="22" cy="-58" r="3" fill={P.ink} /></g></>) },
  cactus: { bg: 'sunset', draw: k => (<><Shadow x={120} y={198} rx={60} ry={8} /><rect x="98" y="60" width="44" height="140" rx="22" fill={P.green} /><rect x="52" y="100" width="30" height="60" rx="15" fill={P.green} /><rect x="52" y="140" width="56" height="26" rx="13" fill={P.green} /><rect x="158" y="80" width="30" height="70" rx="15" fill={P.green} /><rect x="132" y="130" width="56" height="26" rx="13" fill={P.green} /><g stroke={P.greenDk} strokeWidth="3" strokeLinecap="round"><path d="M110 80 V180 M130 80 V180 M64 110 V150 M176 90 V140" /></g><g fill="#fff"><circle cx="110" cy="90" r="2" /><circle cx="130" cy="110" r="2" /><circle cx="110" cy="130" r="2" /><circle cx="130" cy="150" r="2" /><circle cx="64" cy="120" r="2" /><circle cx="176" cy="100" r="2" /></g><circle cx="120" cy="58" r="10" fill={P.pink} /><circle cx="120" cy="58" r="5" fill={P.yellow} /><path d="M80 196 H160" stroke="#C97B45" strokeWidth="6" strokeLinecap="round" /></>) },
  mushroom: { bg: 'meadow', draw: k => (<><Shadow x={120} y={200} rx={50} ry={8} /><rect x="100" y="120" width="40" height="76" rx="14" fill="#FFF3E0" /><rect x="100" y="120" width="40" height="76" rx="14" fill="none" stroke="#E7D2B4" strokeWidth="3" /><path d="M40 122 Q120 20 200 122 Z" fill={P.red} /><path d="M40 122 Q120 100 200 122" fill="none" stroke={P.redDk} strokeWidth="6" /><g fill="#fff"><circle cx="84" cy="98" r="10" /><circle cx="130" cy="70" r="12" /><circle cx="164" cy="104" r="8" /><circle cx="112" cy="108" r="6" /></g><g fill={P.green}><path d="M60 196 q8 -20 16 0" /><path d="M170 196 q8 -20 16 0" /><path d="M186 196 q8 -26 16 0" /></g></>) },
  wave: { bg: 'beach', draw: k => (<><path d="M0 130 Q60 100 110 120 Q140 60 190 90 Q220 110 240 100 V180 H0Z" fill={P.waterBot} /><path d="M0 138 Q60 112 110 130 Q150 84 196 104 Q224 118 240 112 V180 H0Z" fill={P.waterTop} /><path d="M112 128 Q150 80 194 100 Q176 96 160 108 Q140 120 140 132" fill="#fff" /><g fill="#fff" opacity="0.9"><circle cx="196" cy="94" r="7" /><circle cx="208" cy="102" r="5" /><circle cx="186" cy="82" r="4" /><circle cx="100" cy="140" r="6" /><circle cx="60" cy="150" r="5" /></g><path d="M0 170 Q40 160 80 170 T160 170 T240 170" fill="none" stroke="#fff" strokeWidth="3" opacity="0.7" /></>) },
}

/** Map every emoji used in the old item data to an illustration key. */
export const EMOJI_TO_ART: Record<string, string> = {
  '⚽': 'ball', '🌂': 'umbrella', '🚲': 'bicycle', '🔭': 'telescope', '🧭': 'compass', '🌡️': 'thermometer', '🔬': 'microscope', '🎺': 'trumpet', '⚓': 'anchor', '🏺': 'amphora', '⚗️': 'flask', '🪗': 'accordion',
  '😴': 'sleeping', '🏃': 'running', '🍽️': 'eating', '🎭': 'theatre', '🐘': 'elephant', '🐜': 'ant', '🐦': 'bird', '🌸': 'flower', '😠': 'grumpy', '😄': 'happy', '😢': 'sad', '😐': 'neutral',
  '🪟': 'window', '🧱': 'brickwall', '🌲': 'tree', '📦': 'box', '😡': 'grumpy', '😕': 'confused', '🧗': 'climbing', '🏊': 'swimming', '🚴': 'cycling', '💃': 'dancing', '🥚': 'egg', '🪨': 'rock', '🛡️': 'shield',
  '🦉': 'owl', '🐔': 'chicken', '🦁': 'lion', '🐬': 'dolphin', '🦎': 'chameleon', '🐧': 'penguin', '🐟': 'fish', '🦜': 'parrot', '🦋': 'butterfly', '🌵': 'cactus', '🍄': 'mushroom', '🌊': 'wave',
}
export const ART_KEYS = Object.keys(ART)

/** A picture card illustration. `id` is an ART key, a word, or an emoji. */
export function Pic({ id, style }: { id: string; style?: React.CSSProperties }) {
  const key = ART[id] ? id : EMOJI_TO_ART[id] || id.toLowerCase()
  const entry = ART[key]
  if (!entry) return <div style={{ fontSize: 96, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', ...style }}>{id}</div>
  const k = `art-${key}`
  return <div style={{ width: '100%', height: '100%', ...style }}><Scene k={k} bg={entry.bg}>{entry.draw(k)}</Scene></div>
}
/** For the "exhausted" item, the first option should read as tired rather than asleep-in-bed. */
export function picIdFor(emoji: string, word?: string) {
  if (word === 'exhausted' && emoji === '😴') return 'tiredface'
  return EMOJI_TO_ART[emoji] || emoji
}

// ─── Ted the Bear v2 ─────────────────────────────────────────────────────────
export function TedBear({ size = 200, mood = 'happy', className = '' }: { size?: number; mood?: 'happy' | 'encouraging' | 'wave' | 'think'; className?: string }) {
  const k = 'ted'
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 200 230" className={className} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`${k}-fur`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#B97A48" /><stop offset="1" stopColor="#8F5A30" /></linearGradient>
        <linearGradient id={`${k}-belly`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F0CFA6" /><stop offset="1" stopColor="#DDB07F" /></linearGradient>
        <linearGradient id={`${k}-scarf`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FF7A45" /><stop offset="1" stopColor="#E85A20" /></linearGradient>
      </defs>
      <ellipse cx="100" cy="222" rx="62" ry="8" fill="rgba(31,42,68,0.16)" />
      {/* arms */}
      <g fill={`url(#${k}-fur)`}>
        {mood === 'wave' ? <ellipse cx="42" cy="118" rx="16" ry="34" transform="rotate(-40 42 118)" /> : <ellipse cx="46" cy="150" rx="16" ry="34" transform="rotate(-18 46 150)" />}
        <ellipse cx="154" cy="150" rx="16" ry="34" transform="rotate(18 154 150)" />
      </g>
      <circle cx={mood === 'wave' ? 30 : 36} cy={mood === 'wave' ? 90 : 176} r="13" fill="#B97A48" /><circle cx="164" cy="176" r="13" fill="#B97A48" />
      {/* body */}
      <ellipse cx="100" cy="160" rx="56" ry="54" fill={`url(#${k}-fur)`} />
      <ellipse cx="100" cy="166" rx="38" ry="38" fill={`url(#${k}-belly)`} />
      {/* feet */}
      <ellipse cx="74" cy="208" rx="20" ry="12" fill="#8F5A30" /><ellipse cx="126" cy="208" rx="20" ry="12" fill="#8F5A30" />
      <ellipse cx="74" cy="206" rx="11" ry="6" fill="#DDB07F" /><ellipse cx="126" cy="206" rx="11" ry="6" fill="#DDB07F" />
      {/* scarf */}
      <path d="M56 118 Q100 140 144 118 L146 132 Q100 156 54 132Z" fill={`url(#${k}-scarf)`} />
      <path d="M126 130 L140 170 L120 166 L118 134Z" fill={`url(#${k}-scarf)`} />
      {/* head */}
      <circle cx="60" cy="52" r="20" fill="#B97A48" /><circle cx="140" cy="52" r="20" fill="#B97A48" />
      <circle cx="60" cy="52" r="10" fill="#DDB07F" /><circle cx="140" cy="52" r="10" fill="#DDB07F" />
      <circle cx="100" cy="76" r="50" fill={`url(#${k}-fur)`} />
      <ellipse cx="100" cy="92" rx="30" ry="24" fill={`url(#${k}-belly)`} />
      {/* eyes */}
      <ellipse cx="80" cy="70" rx="9" ry="10" fill="#1F2A44" /><ellipse cx="120" cy="70" rx="9" ry="10" fill="#1F2A44" />
      <circle cx="83" cy="66" r="3.5" fill="#fff" /><circle cx="123" cy="66" r="3.5" fill="#fff" />
      <circle cx="70" cy="86" r="7" fill="#FFB1B1" opacity="0.6" /><circle cx="130" cy="86" r="7" fill="#FFB1B1" opacity="0.6" />
      {/* brows */}
      {mood === 'think' ? <><path d="M70 56 Q80 52 90 58" fill="none" stroke="#5A3A1A" strokeWidth="3" strokeLinecap="round" /><path d="M110 60 Q120 50 130 54" fill="none" stroke="#5A3A1A" strokeWidth="3" strokeLinecap="round" /></>
        : <><path d="M70 58 Q80 52 90 58" fill="none" stroke="#5A3A1A" strokeWidth="3" strokeLinecap="round" /><path d="M110 58 Q120 52 130 58" fill="none" stroke="#5A3A1A" strokeWidth="3" strokeLinecap="round" /></>}
      {/* nose + mouth */}
      <ellipse cx="100" cy="88" rx="9" ry="7" fill="#1F2A44" /><ellipse cx="97" cy="86" rx="3" ry="2" fill="#fff" opacity="0.5" />
      {mood === 'encouraging' ? <path d="M90 100 Q100 106 110 100" fill="none" stroke="#1F2A44" strokeWidth="3" strokeLinecap="round" />
        : mood === 'think' ? <path d="M92 102 Q100 98 108 102" fill="none" stroke="#1F2A44" strokeWidth="3" strokeLinecap="round" />
        : <path d="M86 98 Q100 114 114 98" fill="#8B3A3A" stroke="#1F2A44" strokeWidth="3" strokeLinecap="round" />}
    </svg>
  )
}

// ─── Story scenes (Ember the fox) ─────────────────────────────────────────────
function Fox({ x, y, s = 1, run = false }: { x: number; y: number; s?: number; run?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="30" rx="34" ry="6" fill="rgba(31,42,68,0.16)" />
      <path d="M-40 6 Q-60 -10 -46 -30 Q-30 -30 -30 -4Z" fill="#F08A3A" /><path d="M-46 -30 Q-40 -26 -38 -16" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
      <ellipse cx="0" cy="0" rx="34" ry="20" fill="#F08A3A" />
      <ellipse cx="-4" cy="6" rx="20" ry="10" fill="#FFF0D6" />
      {run ? <><path d="M-20 12 L-32 30 M-8 14 L-2 32 M12 14 L26 30 M22 10 L34 24" stroke="#F08A3A" strokeWidth="7" strokeLinecap="round" /></> : <><path d="M-18 14 V30 M-6 16 V32 M8 16 V32 M20 14 V30" stroke="#F08A3A" strokeWidth="7" strokeLinecap="round" /></>}
      <path d="M-18 14 V30 M-6 16 V32 M8 16 V32 M20 14 V30" stroke="#1F2A44" strokeWidth="0" />
      <circle cx="30" cy="-14" r="18" fill="#F08A3A" />
      <path d="M18 -26 L14 -46 L30 -30Z" fill="#F08A3A" /><path d="M40 -26 L48 -46 L32 -30Z" fill="#F08A3A" />
      <path d="M30 -8 Q46 -4 50 -10 Q46 4 32 2Z" fill="#FFF0D6" />
      <circle cx="34" cy="-16" r="3" fill="#1F2A44" /><circle cx="48" cy="-8" r="3" fill="#1F2A44" />
      <circle cx="35" cy="-17" r="1" fill="#fff" />
    </g>
  )
}
function Leaf({ x, y, s = 1, r = 0 }: { x: number; y: number; s?: number; r?: number }) {
  return <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}><path d="M0 -22 Q22 -8 14 16 Q4 26 0 22 Q-4 26 -14 16 Q-22 -8 0 -22Z" fill="#FFC53D" stroke="#E8A317" strokeWidth="2" /><path d="M0 -14 V20" stroke="#E8A317" strokeWidth="2" /><path d="M0 -2 L8 -8 M0 6 L-8 0" stroke="#E8A317" strokeWidth="1.5" /></g>
}
function Trees({ k, dark = false }: { k: string; dark?: boolean }) {
  const c1 = dark ? '#2F7A56' : '#4CC48A', c2 = dark ? '#245F44' : '#2F9E68'
  return (<g>{[20, 80, 150, 230, 300, 370].map((x, i) => <g key={x}><rect x={x - 5} y={110 - (i % 2) * 20} width="10" height="70" fill="#7A4D26" /><path d={`M${x} ${40 - (i % 2) * 20} L${x + 34} ${120 - (i % 2) * 20} H${x - 34}Z`} fill={i % 2 ? c1 : c2} /><path d={`M${x} ${20 - (i % 2) * 20} L${x + 24} ${76 - (i % 2) * 20} H${x - 24}Z`} fill={i % 2 ? c2 : c1} /></g>)}</g>)
}
const STORY_SCENES: ((k: string) => React.ReactNode)[] = [
  k => (<><rect width="400" height="240" fill={`url(#${k}-sky)`} /><Sun x={340} y={40} k={k} /><Trees k={k} /><rect y="170" width="400" height="70" fill={`url(#${k}-grass)`} /><Fox x={200} y={190} s={1.1} /><g fill="#FFC53D"><Leaf x={60} y={200} s={0.5} r={30} /><Leaf x={330} y={210} s={0.5} r={-20} /></g></>),
  k => (<><rect width="400" height="240" fill={`url(#${k}-sky)`} /><Trees k={k} /><rect y="170" width="400" height="70" fill={`url(#${k}-grass)`} /><path d="M0 200 Q100 180 200 200 T400 200 V240 H0Z" fill={`url(#${k}-water)`} /><path d="M40 214 Q80 208 120 214 M240 218 Q280 212 320 218" fill="none" stroke="#fff" strokeWidth="3" opacity="0.7" /><Fox x={130} y={178} s={1} /><Leaf x={236} y={176} s={1.1} r={20} /><Star x={236} y={150} s={1.2} /><Star x={258} y={164} s={0.8} /></>),
  k => (<><rect width="400" height="240" fill="#CFE2EF" /><Trees k={k} dark /><rect y="170" width="400" height="70" fill="#6FB25F" /><g fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.9"><path d="M40 90 Q100 70 140 96 Q170 116 220 90" /><path d="M80 130 Q140 110 190 134 Q230 152 290 124" /><path d="M200 60 Q250 40 300 66" /></g><Fox x={150} y={190} s={1.05} run /><Leaf x={300} y={100} s={1.2} r={60} /><Leaf x={250} y={80} s={0.7} r={120} /><Leaf x={340} y={140} s={0.6} r={200} /></>),
  k => (<><rect width="400" height="240" fill={`url(#${k}-sunset)`} /><Sun x={70} y={70} r={22} k={k} /><rect y="170" width="400" height="70" fill="#8FC27A" /><rect x="286" y="90" width="28" height="100" rx="6" fill="#7A4D26" /><circle cx="300" cy="80" r="62" fill="#3E8E5A" /><circle cx="262" cy="100" r="40" fill="#4CA96A" /><circle cx="340" cy="104" r="40" fill="#4CA96A" /><Fox x={200} y={190} s={1.1} run /><Leaf x={262} y={186} s={1} r={-10} /><Star x={262} y={160} s={1.1} /></>),
  k => (<><rect width="400" height="240" fill={`url(#${k}-night)`} /><Star x={40} y={40} /><Star x={120} y={30} s={0.7} /><Star x={330} y={36} s={0.9} /><rect y="180" width="400" height="60" fill="#26356B" /><rect x="110" y="70" width="180" height="120" rx="10" fill="#8B5E3C" /><path d="M100 76 L200 20 L300 76Z" fill="#6B3D1E" /><rect x="172" y="110" width="56" height="80" rx="6" fill="#5A3116" /><circle cx="220" cy="152" r="4" fill="#FFD65C" /><rect x="130" y="100" width="30" height="30" rx="4" fill="#FFF3B0" /><rect x="240" y="100" width="30" height="30" rx="4" fill="#FFF3B0" /><Leaf x={200} y={134} s={0.9} /><circle cx="200" cy="134" r="30" fill="#FFD65C" opacity="0.18" /><Fox x={80} y={190} s={0.9} /><Fox x={320} y={190} s={1.1} /></>),
]
export function StoryScene({ index }: { index: number }) {
  const k = `story-${index}`
  const draw = STORY_SCENES[Math.max(0, Math.min(STORY_SCENES.length - 1, index))]
  return (
    <svg viewBox="0 0 400 240" width="100%" height="100%" style={{ display: 'block' }}>
      <Defs k={k} />
      {draw(k)}
      <rect width="400" height="240" fill={`url(#${k}-vig)`} />
    </svg>
  )
}

// ─── Backdrop — faded, out of the way ────────────────────────────────────────
export function Backdrop({ tone = 'warm' }: { tone?: 'warm' | 'cool' | 'violet' | 'teal' | 'rose' }) {
  const tones = {
    warm: ['#FFF7EC', '#FFEFD9', '#FFD9A8'], cool: ['#EEF6FF', '#E3F0FF', '#BFDDFF'], violet: ['#F5F1FF', '#ECE4FF', '#D4C4FF'], teal: ['#EDFBFA', '#DDF6F4', '#B8ECE8'], rose: ['#FFF1F4', '#FFE4EA', '#FFC4D2'],
  }[tone]
  const k = `bd-${tone}`
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: -1 }}>
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${tones[0]} 0%, ${tones[1]} 100%)` }} />
      <div style={{ position: 'absolute', width: 520, height: 520, borderRadius: '50%', left: -160, top: -200, background: tones[2], opacity: 0.35, filter: 'blur(80px)' }} />
      <div style={{ position: 'absolute', width: 460, height: 460, borderRadius: '50%', right: -140, bottom: -180, background: tones[2], opacity: 0.32, filter: 'blur(80px)' }} />
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.11 }} viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
        <defs><pattern id={k} width="240" height="240" patternUnits="userSpaceOnUse">
          <Star x={30} y={40} s={1.6} /><Star x={200} y={120} s={1.2} /><Star x={110} y={210} s={1} />
          <g opacity="0.9"><Cloud x={150} y={40} s={0.9} o={1} /></g>
          <path d="M40 150 q10 -24 22 0 q-10 20 -22 0" fill="#7CC96B" /><path d="M210 210 q10 -24 22 0 q-10 20 -22 0" fill="#7CC96B" />
          <circle cx="70" cy="110" r="8" fill="#FF8FB1" /><circle cx="70" cy="110" r="3" fill="#FFD65C" />
          <text x="150" y="190" fontSize="26" fontWeight="800" fill="#4F9DE8" fontFamily="Georgia, serif" opacity="0.8">A</text>
          <text x="20" y="235" fontSize="22" fontWeight="800" fill="#9C7BF0" fontFamily="Georgia, serif" opacity="0.8">b</text>
          <text x="180" y="80" fontSize="20" fontWeight="800" fill="#F25F5C" fontFamily="Georgia, serif" opacity="0.8">c</text>
        </pattern></defs>
        <rect width="1200" height="800" fill={`url(#${k})`} />
      </svg>
    </div>
  )
}
