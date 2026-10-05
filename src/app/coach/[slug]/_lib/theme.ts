// Colours for the coach portal that stay readable whatever a coach picks.
//
// The portal is drawn from two choices in Settings → Appearance: a theme (dark,
// light or white) and an accent colour. Every pair was offered, but not every
// pair could be read. Each theme carried ONE colour for the words on an accent
// button — dark ink on the dark theme, white on the light ones — so navy on dark
// gave dark words on a dark blue button, and amber on white gave white words on
// yellow. The accent is also used as a text colour (links, dates, initials),
// where navy on the near-black panel and amber on white all but disappeared.
//
// Two rules now, worked out from the colours themselves rather than listed pair
// by pair, so a new accent or theme is covered without anyone remembering to:
//
//   1. Words on the accent colour are dark ink or white, whichever is easier to
//      read against it. Every accent on offer then reaches 4.5:1 or better.
//   2. An accent too close to the panel behind it is nudged — lighter on the
//      dark theme, darker on the light ones — just far enough to reach 3:1.
//      Most accents are not touched; the picker still shows the colour as named.
//   3. Words WRITTEN in the accent (a link, the small-caps greeting) need more
//      than a button's outline does: 4.5:1. They get a shade of their own,
//      `accent.text` — the accent nudged further, until it reads on the page,
//      on a panel and on the accent-tinted card. Buttons and tints keep the
//      colour from rule 2, so amber stays amber where it is a block of colour.

import { THEMES, type ThemeTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { ACCENT_PRESETS, type AccentKey } from './settings-store'

type Rgb = [number, number, number]

const rgbOf = (hex: string): Rgb => {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const hexOf = (c: Rgb) => '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('')

// Relative luminance and contrast ratio, as the accessibility guidelines (WCAG
// 2) define them: 1 is no contrast at all, 21 is black on white.
function luminance(hex: string): number {
  const [r, g, b] = rgbOf(hex).map(v => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
export function contrast(a: string, b: string): number {
  const x = luminance(a), y = luminance(b)
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

const INK = '#0B0E14'
const WHITE = '#FFFFFF'

/** Dark ink or white — whichever reads better on this background. */
export function readableOn(background: string): string {
  return contrast(INK, background) >= contrast(WHITE, background) ? INK : WHITE
}

// The least an accent used as text or as an outline may stand out from the
// panel it sits on.
const MIN_ACCENT_ON_PANEL = 3

function accentFor(hex: string, T: ThemeTokens): string {
  if (contrast(hex, T.panel) >= MIN_ACCENT_ON_PANEL) return hex
  const from = rgbOf(hex), to = rgbOf(T.isDark ? WHITE : '#000000')
  for (let t = 0.02; t <= 1; t += 0.02) {
    const c = hexOf(from.map((v, i) => v + (to[i] - v) * t) as Rgb)
    if (contrast(c, T.panel) >= MIN_ACCENT_ON_PANEL) return c
  }
  return T.isDark ? WHITE : INK
}

// What small text needs against its background: 4.5:1. Aimed a little higher
// so that rounding a colour to whole numbers cannot leave it a hair under.
const MIN_TEXT = 4.6
// `over` painted at `alpha` on top of `under` — the accent-tinted hero card.
const tintOn = (over: string, under: string, alpha: number) => {
  const o = rgbOf(over), u = rgbOf(under)
  return hexOf(o.map((v, i) => v * alpha + u[i] * (1 - alpha)) as Rgb)
}
function accentTextFor(hex: string, T: ThemeTokens): string {
  const behind = [T.panel, T.panel2, T.bg, tintOn(hex, T.panel, 0.16)]
  const reads = (c: string) => behind.every(b => contrast(c, b) >= MIN_TEXT)
  if (reads(hex)) return hex
  const from = rgbOf(hex), to = rgbOf(T.isDark ? WHITE : '#000000')
  for (let t = 0.02; t <= 1; t += 0.02) {
    const c = hexOf(from.map((v, i) => v + (to[i] - v) * t) as Rgb)
    if (reads(c)) return c
  }
  return T.isDark ? WHITE : INK
}

export type CoachAccent = { hex: string; dim: string; border: string; label: string; text: string }

/** The colour for words written in the accent. Falls back to the accent itself
    where a screen was handed a plain accent (the demo, the other portals). */
export const accentText = (accent: { hex: string; text?: string }): string => accent.text || accent.hex

// One object per pair, handed back every time, so a component that compares
// the theme it was given with the one it had does not see a change on every
// render.
const made = new Map<string, { T: ThemeTokens; accent: CoachAccent }>()

/** The theme and accent to draw the portal with, for a coach's two choices. */
export function coachTheme(themeKey: keyof typeof THEMES, accentKey: AccentKey): { T: ThemeTokens; accent: CoachAccent } {
  const key = `${themeKey}|${accentKey}`
  const hit = made.get(key)
  if (hit) return hit
  const base = THEMES[themeKey] ?? THEMES.dark
  const preset = ACCENT_PRESETS[accentKey] ?? ACCENT_PRESETS.blue
  const hex = accentFor(preset.hex, base)
  const [r, g, b] = rgbOf(hex)
  const out = {
    T: { ...base, btnText: readableOn(hex) },
    // The tints follow the colour actually drawn, at the same strengths the
    // presets use (16% and 45%).
    accent: { ...(hex === preset.hex ? preset : { hex, dim: `rgba(${r},${g},${b},0.16)`, border: `rgba(${r},${g},${b},0.45)`, label: preset.label }), text: accentTextFor(hex, base) },
  }
  made.set(key, out)
  return out
}
