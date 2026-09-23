'use client'

// What a coach calls the thing a player is working through.
//
// The ladder is the same either way — nine stages, each with a colour. What
// changes is whether the coach bought into the physical reward system: a coach
// on Racket Progression hands out a coloured racket keyring at each stage and
// says "Sven is on Purple racket". A coach without that module has the colours
// and nothing to hand over, so "racket" is a word for a product they do not
// own — it reads as a bug, or as an upsell nobody asked for.
//
// One helper, read from the feature flag, so a camp pack, a squad matrix and a
// certificate can never disagree about what to call it.

import { getFlags } from './feature-flags'

export type StageWords = {
  /** "Racket" / "Colour" — for a label or a table heading. */
  Noun: string
  /** "racket" / "colour" — for mid-sentence. */
  noun: string
  /** "Purple racket" / "Purple" — how a stage is named in prose. */
  stage: (name?: string | null) => string
  /** True when the coach is on the racket reward system. */
  racket: boolean
}

export function stageWords(fallbackTier: 'prolite' | 'elite' = 'prolite'): StageWords {
  const racket = getFlags(fallbackTier).racket
  return {
    racket,
    Noun: racket ? 'Racket' : 'Colour',
    noun: racket ? 'racket' : 'colour',
    // "Purple racket" reads right; "Purple colour" does not — so the colour
    // version is just the stage name.
    stage: (name?: string | null) => name ? (racket ? `${name} racket` : name) : '',
  }
}
