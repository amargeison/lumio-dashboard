import React from 'react'

// ─── Demo Staff Illustrated Avatars ─────────────────────────────────────────
// Inline SVG, flat-illustration style. 126×126 viewBox — scales to any size.
// Each face is matched to a specific demo team member by last name.

type AvatarProps = { size?: number }

// Shared shapes — eyes / nose / mouth with default colours
function Eyes({ y = 64, color = '#1A1411' }: { y?: number; color?: string }) {
  return (
    <>
      <ellipse cx="52" cy={y} rx="2.6" ry="3.4" fill={color} />
      <ellipse cx="74" cy={y} rx="2.6" ry="3.4" fill={color} />
    </>
  )
}
function Nose({ from = 68, to = 78 }: { from?: number; to?: number }) {
  return (
    <path d={`M 63 ${from} Q 60 ${to} 63 ${to + 2}`} stroke="rgba(0,0,0,0.35)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
  )
}
function Smile({ y = 86, color = '#1A1411' }: { y?: number; color?: string }) {
  return (
    <path d={`M 54 ${y} Q 63 ${y + 6} 72 ${y}`} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
  )
}

// ── AVATAR 1 — Sophie Brennan (Marketing) — Woman, dark skin, natural hair, teal
export function Avatar1({ size = 126 }: AvatarProps) {
  return (
    <svg viewBox="0 0 126 126" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <circle cx="63" cy="63" r="63" fill="rgba(13,148,136,0.4)" />
      {/* Natural / afro hair */}
      <ellipse cx="63" cy="36" rx="42" ry="24" fill="#1A0F08" />
      <circle cx="34" cy="42" r="14" fill="#1A0F08" />
      <circle cx="92" cy="42" r="14" fill="#1A0F08" />
      <circle cx="63" cy="22" r="16" fill="#1A0F08" />
      {/* Head */}
      <ellipse cx="63" cy="64" rx="30" ry="36" fill="#5C3B22" />
      {/* Neck + collar */}
      <rect x="54" y="94" width="18" height="14" fill="#5C3B22" />
      <path d="M 30 110 Q 63 96 96 110 L 96 126 L 30 126 Z" fill="#0D9488" />
      <Eyes color="#FFFFFF" />
      <Nose />
      <Smile />
      {/* Earrings */}
      <circle cx="33" cy="74" r="2.2" fill="#F5C84B" />
      <circle cx="93" cy="74" r="2.2" fill="#F5C84B" />
    </svg>
  )
}

// ── AVATAR 2 — Marcus Webb (Sales) — Man, medium skin, short dark hair, green
export function Avatar2({ size = 126 }: AvatarProps) {
  return (
    <svg viewBox="0 0 126 126" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <circle cx="63" cy="63" r="63" fill="rgba(34,197,94,0.4)" />
      {/* Head */}
      <ellipse cx="63" cy="64" rx="30" ry="36" fill="#C68863" />
      {/* Short dark hair */}
      <path d="M 33 50 Q 33 28 63 26 Q 93 28 93 50 L 93 56 Q 80 42 63 42 Q 46 42 33 56 Z" fill="#1F1B16" />
      {/* Neck + shirt */}
      <rect x="54" y="94" width="18" height="14" fill="#C68863" />
      <path d="M 30 110 Q 63 98 96 110 L 96 126 L 30 126 Z" fill="#16A34A" />
      <Eyes />
      <Nose />
      <Smile />
    </svg>
  )
}

// ── AVATAR 3 — Rachel Osei (Operations) — Woman, light skin, blonde bob, orange
export function Avatar3({ size = 126 }: AvatarProps) {
  return (
    <svg viewBox="0 0 126 126" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <circle cx="63" cy="63" r="63" fill="rgba(245,158,11,0.4)" />
      {/* Head */}
      <ellipse cx="63" cy="64" rx="30" ry="36" fill="#F1C9A5" />
      {/* Blonde bob — frames the face */}
      <path d="M 28 64 Q 26 32 63 24 Q 100 32 98 64 L 98 80 L 90 80 L 90 56 Q 78 44 63 44 Q 48 44 36 56 L 36 80 L 28 80 Z" fill="#E8C77A" />
      {/* Neck + collar */}
      <rect x="54" y="94" width="18" height="14" fill="#F1C9A5" />
      <path d="M 30 110 Q 63 98 96 110 L 96 126 L 30 126 Z" fill="#F59E0B" />
      <Eyes />
      <Nose />
      <Smile />
      {/* Earrings */}
      <circle cx="33" cy="74" r="2" fill="#C0C0C0" />
      <circle cx="93" cy="74" r="2" fill="#C0C0C0" />
    </svg>
  )
}

// ── AVATAR 4 — Tom Fielding (Finance/Support) — Man, dark skin, bald, blue
export function Avatar4({ size = 126 }: AvatarProps) {
  return (
    <svg viewBox="0 0 126 126" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <circle cx="63" cy="63" r="63" fill="rgba(59,130,246,0.4)" />
      {/* Bald head — no hair on top, just slight shadow */}
      <ellipse cx="63" cy="62" rx="30" ry="36" fill="#4A2E1A" />
      {/* Subtle scalp highlight */}
      <ellipse cx="63" cy="38" rx="16" ry="6" fill="rgba(255,255,255,0.08)" />
      {/* Neck + collar */}
      <rect x="54" y="92" width="18" height="14" fill="#4A2E1A" />
      <path d="M 30 110 Q 63 96 96 110 L 96 126 L 30 126 Z" fill="#3B82F6" />
      <Eyes color="#FFFFFF" />
      <Nose />
      <Smile />
    </svg>
  )
}

// ── AVATAR 5 — Claire Donovan (IT) — Woman, medium skin, long dark hair, purple
export function Avatar5({ size = 126 }: AvatarProps) {
  return (
    <svg viewBox="0 0 126 126" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <circle cx="63" cy="63" r="63" fill="rgba(139,92,246,0.4)" />
      {/* Long hair behind head */}
      <path d="M 24 60 Q 22 30 63 22 Q 104 30 102 60 L 102 116 L 86 116 L 86 60 L 40 60 L 40 116 L 24 116 Z" fill="#1A1411" />
      {/* Head */}
      <ellipse cx="63" cy="64" rx="30" ry="36" fill="#C68863" />
      {/* Front hair fringe */}
      <path d="M 34 50 Q 50 38 63 40 Q 76 38 92 50 L 92 56 Q 78 46 63 46 Q 48 46 34 56 Z" fill="#1A1411" />
      {/* Neck + collar */}
      <rect x="54" y="94" width="18" height="14" fill="#C68863" />
      <path d="M 30 110 Q 63 98 96 110 L 96 126 L 30 126 Z" fill="#7C3AED" />
      <Eyes />
      <Nose />
      <Smile />
    </svg>
  )
}

// ── AVATAR 6 — Ben Holloway (Sales) — Man, light skin, glasses, grey
export function Avatar6({ size = 126 }: AvatarProps) {
  return (
    <svg viewBox="0 0 126 126" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <circle cx="63" cy="63" r="63" fill="rgba(107,114,128,0.4)" />
      {/* Head */}
      <ellipse cx="63" cy="64" rx="30" ry="36" fill="#F1C9A5" />
      {/* Brown side-parted hair */}
      <path d="M 33 52 Q 35 32 63 28 Q 88 30 92 50 L 92 58 Q 78 44 60 46 Q 46 50 38 60 L 33 58 Z" fill="#5C3B22" />
      {/* Neck + collar */}
      <rect x="54" y="94" width="18" height="14" fill="#F1C9A5" />
      <path d="M 30 110 Q 63 98 96 110 L 96 126 L 30 126 Z" fill="#4B5563" />
      <Eyes />
      <Nose />
      <Smile />
      {/* Glasses */}
      <circle cx="52" cy="64" r="7" fill="none" stroke="#1A1411" strokeWidth="1.6" />
      <circle cx="74" cy="64" r="7" fill="none" stroke="#1A1411" strokeWidth="1.6" />
      <line x1="59" y1="64" x2="67" y2="64" stroke="#1A1411" strokeWidth="1.6" />
    </svg>
  )
}

// ── AVATAR 7 — Leah Thornton (Marketing) — Woman, dark skin, short curly hair, pink
export function Avatar7({ size = 126 }: AvatarProps) {
  return (
    <svg viewBox="0 0 126 126" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <circle cx="63" cy="63" r="63" fill="rgba(236,72,153,0.4)" />
      {/* Short curly hair — clusters of small circles */}
      <circle cx="40" cy="42" r="9" fill="#1A0F08" />
      <circle cx="50" cy="32" r="9" fill="#1A0F08" />
      <circle cx="63" cy="26" r="10" fill="#1A0F08" />
      <circle cx="76" cy="32" r="9" fill="#1A0F08" />
      <circle cx="86" cy="42" r="9" fill="#1A0F08" />
      <circle cx="34" cy="54" r="8" fill="#1A0F08" />
      <circle cx="92" cy="54" r="8" fill="#1A0F08" />
      {/* Head */}
      <ellipse cx="63" cy="66" rx="29" ry="34" fill="#5C3B22" />
      {/* Neck + collar */}
      <rect x="54" y="94" width="18" height="14" fill="#5C3B22" />
      <path d="M 30 110 Q 63 98 96 110 L 96 126 L 30 126 Z" fill="#EC4899" />
      <Eyes color="#FFFFFF" />
      <Nose />
      <Smile />
      {/* Earrings */}
      <circle cx="33" cy="76" r="2.2" fill="#F5C84B" />
      <circle cx="93" cy="76" r="2.2" fill="#F5C84B" />
    </svg>
  )
}

// ── AVATAR 8 — Nate Crawford (Marketing) — Man, medium skin, beard, amber
export function Avatar8({ size = 126 }: AvatarProps) {
  return (
    <svg viewBox="0 0 126 126" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <circle cx="63" cy="63" r="63" fill="rgba(245,158,11,0.4)" />
      {/* Head */}
      <ellipse cx="63" cy="62" rx="30" ry="36" fill="#C68863" />
      {/* Tousled hair */}
      <path d="M 32 50 Q 28 24 63 22 Q 98 24 94 52 L 94 58 Q 90 38 63 40 Q 36 38 32 58 Z" fill="#2A1810" />
      {/* Beard — covers lower jaw */}
      <path d="M 36 76 Q 36 96 50 102 Q 63 108 76 102 Q 90 96 90 76 Q 80 90 63 90 Q 46 90 36 76 Z" fill="#2A1810" />
      {/* Neck + collar */}
      <rect x="54" y="98" width="18" height="10" fill="#C68863" />
      <path d="M 30 110 Q 63 100 96 110 L 96 126 L 30 126 Z" fill="#D97706" />
      <Eyes y={62} />
      <Nose from={66} to={76} />
      {/* Mouth visible inside beard */}
      <path d="M 55 84 Q 63 88 71 84" stroke="#1A1411" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  )
}

// ── Lookup by demo staff name ────────────────────────────────────────────────
// Keyed by lowercase last name. James Hartley is excluded — that card always
// uses the real owner photo / initials fallback.
const AVATAR_BY_LAST_NAME: Record<string, React.ComponentType<AvatarProps>> = {
  brennan:  Avatar1,
  webb:     Avatar2,
  osei:     Avatar3,
  fielding: Avatar4,
  donovan:  Avatar5,
  holloway: Avatar6,
  thornton: Avatar7,
  crawford: Avatar8,
}

export function getDemoAvatar(name: string | undefined | null): React.ComponentType<AvatarProps> | null {
  if (!name) return null
  const last = name.trim().split(/\s+/).pop()?.toLowerCase()
  if (!last) return null
  return AVATAR_BY_LAST_NAME[last] ?? null
}

// Convenience component — renders the matching SVG if known, else null.
export function DemoAvatar({ name, size = 126 }: { name: string; size?: number }) {
  const Comp = getDemoAvatar(name)
  if (!Comp) return null
  return <Comp size={size} />
}
