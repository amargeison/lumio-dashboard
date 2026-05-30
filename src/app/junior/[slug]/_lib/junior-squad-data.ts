// junior-squad-data.ts
//
// Player deep-profile data — FIFA-style stats + About Me free-text
// fields keyed by player id. Separated from JuniorSquadManagement's
// SEED_TEAMS because (a) the roster table doesn't need the deep data,
// (b) demo-added players naturally yield `undefined` lookups (renders
// as "Profile not added yet"), and (c) keeps the same _lib data-file
// convention Phase 3a established with junior-club-data.ts.
//
// Stats are rooted in FA Four Corners pedagogy:
//   TEC — Technique (video-derived)
//   TAC — Tactical (coach-observed)
//   PHY — Physical (GPS-derived)
//   SOC — Social (coach-observed)
//   EFF — Effort (coach-observed)
//   POT — Potential (coach-observed, forward-looking)
//
// Partial profiles: aboutMe is shaped so any/all fields may be
// undefined. The card surface renders a "{firstName} hasn't added
// this yet" placeholder per-field.
//
// U13 Falcons + U14 Eagles ship with stub data — rating + position
// visible on the card front, stat rows render "—", back face shows
// "Profile not added yet" per field. Full data lands in a follow-up.

export type JuniorPlayerStats = {
  rating: number   // hand-set overall 60-86
  tec: number      // Technique — video-derived
  tac: number      // Tactical — coach-observed
  phy: number      // Physical — GPS-derived
  soc: number      // Social — coach-observed
  eff: number      // Effort — coach-observed
  pot: number      // Potential — coach-observed (forward-looking)
}

export type JuniorPlayerAboutMe = {
  favouritePlayer?: string
  favouriteClub?: string
  favouriteFilm?: string
  goalCelebration?: string
  preMatchMeal?: string
  dreamPosition?: string
}

export type JuniorPlayerDetail = {
  stats: JuniorPlayerStats
  aboutMe: JuniorPlayerAboutMe
  /** When true, the card renders the stub state — front shows rating
   *  + position + avatar + name only; 6 stat rows render as "—"; back
   *  face shows "Profile not added yet" for every field. */
  stub?: boolean
}

export const JUNIOR_PLAYER_DETAIL: Record<string, JuniorPlayerDetail> = {
  // ──── U11 Lions — full profiles ────

  'u11-theo-renshaw': {
    stats: { rating: 78, tec: 76, tac: 74, phy: 80, soc: 82, eff: 84, pot: 81 },
    aboutMe: {
      favouritePlayer: 'Sol Henrikson — Crown City',
      favouriteClub: 'Crown City',
      favouriteFilm: 'an action film with talking animals',
      goalCelebration: 'Jumps on the back four',
      preMatchMeal: 'Beans on toast',
      dreamPosition: 'Goalkeeper',
    },
  },

  'u11-oscar-mbeki': {
    stats: { rating: 75, tec: 70, tac: 78, phy: 80, soc: 76, eff: 82, pot: 79 },
    aboutMe: {
      favouritePlayer: 'Theo Marsh — Meridian Athletic',
      favouriteClub: 'Meridian Athletic',
      favouriteFilm: 'a space adventure film',
      goalCelebration: 'Knee slide + roar',
      preMatchMeal: 'Pasta + cheese',
      dreamPosition: 'Defender like Theo Marsh',
    },
  },

  'u11-reuben-hart': {
    stats: { rating: 70, tec: 68, tac: 72, phy: 74, soc: 70, eff: 76, pot: 74 },
    aboutMe: {
      favouritePlayer: 'Sol Henrikson — Crown City',
      favouriteClub: 'Crown City',
    },
  },

  'u11-sami-iqbal': {
    stats: { rating: 73, tec: 72, tac: 72, phy: 75, soc: 70, eff: 80, pot: 76 },
    aboutMe: {
      favouritePlayer: 'Theo Marsh — Meridian Athletic',
      favouriteClub: 'Meridian Athletic',
      favouriteFilm: 'a sci-fi adventure film',
      goalCelebration: 'Slide on knees',
      preMatchMeal: 'Chicken + rice',
      dreamPosition: 'Right-back',
    },
  },

  'u11-felix-yarrow': {
    stats: { rating: 77, tec: 80, tac: 75, phy: 70, soc: 78, eff: 80, pot: 80 },
    aboutMe: {
      favouritePlayer: 'Niko Vargas — Apex United',
      favouriteClub: 'Apex United',
      favouriteFilm: 'a football documentary',
      goalCelebration: 'Point to my mum',
      preMatchMeal: 'Toast + honey',
      dreamPosition: 'Number 10',
    },
  },

  'u11-jack-carter': {
    stats: { rating: 84, tec: 84, tac: 86, phy: 78, soc: 88, eff: 90, pot: 88 },
    aboutMe: {
      favouritePlayer: 'Niko Vargas — Apex United',
      favouriteClub: 'Apex United',
      favouriteFilm: 'a football documentary',
      goalCelebration: 'The robot',
      preMatchMeal: 'Pasta + chicken',
      dreamPosition: 'Number 10 like Niko Vargas',
    },
  },

  'u11-marco-pereira': {
    stats: { rating: 73, tec: 76, tac: 70, phy: 70, soc: 76, eff: 78, pot: 76 },
    aboutMe: {
      goalCelebration: 'The robot',
      dreamPosition: 'Winger',
    },
  },

  'u11-daniel-ohara': {
    stats: { rating: 72, tec: 72, tac: 72, phy: 72, soc: 72, eff: 78, pot: 75 },
    aboutMe: {
      favouriteFilm: 'a space adventure film',
      preMatchMeal: 'Beans on toast',
    },
  },

  'u11-kai-linton': {
    stats: { rating: 71, tec: 74, tac: 68, phy: 76, soc: 72, eff: 70, pot: 74 },
    aboutMe: {
      goalCelebration: 'Slide on knees',
    },
  },

  'u11-adam-sefer': {
    stats: { rating: 79, tec: 80, tac: 74, phy: 78, soc: 78, eff: 84, pot: 82 },
    aboutMe: {
      favouritePlayer: 'Mateo Brennan — Ashbourne FC',
      favouriteClub: 'Ashbourne FC',
      favouriteFilm: 'an action film with talking animals',
      goalCelebration: 'Knee slide + finger guns',
      preMatchMeal: 'Pasta + cheese',
      dreamPosition: 'Striker',
    },
  },

  'u11-henry-brindle': {
    stats: { rating: 73, tec: 75, tac: 70, phy: 78, soc: 70, eff: 78, pot: 76 },
    aboutMe: {
      favouriteFilm: 'a football documentary',
    },
  },

  'u11-joel-tate': {
    stats: { rating: 65, tec: 64, tac: 62, phy: 66, soc: 60, eff: 75, pot: 80 },
    aboutMe: {
      dreamPosition: 'Striker, like my older brother',
    },
  },

  // ──── U13 Falcons — stub profiles ────
  // Front shows rating + position + name + avatar. Stat rows render "—".
  // Back shows "Profile not added yet" per field. Ratings hand-set in
  // the 68–80 range, loosely tracking attendancePct (high attendance →
  // higher rating), not as a strict mapping.

  'u13-amira-wells':       { stats: { rating: 78, tec: 0, tac: 0, phy: 0, soc: 0, eff: 0, pot: 0 }, aboutMe: {}, stub: true },
  'u13-imogen-holt':       { stats: { rating: 73, tec: 0, tac: 0, phy: 0, soc: 0, eff: 0, pot: 0 }, aboutMe: {}, stub: true },
  'u13-bea-aldridge':      { stats: { rating: 72, tec: 0, tac: 0, phy: 0, soc: 0, eff: 0, pot: 0 }, aboutMe: {}, stub: true },
  'u13-phoebe-carrick':    { stats: { rating: 73, tec: 0, tac: 0, phy: 0, soc: 0, eff: 0, pot: 0 }, aboutMe: {}, stub: true },
  'u13-sophie-mahan':      { stats: { rating: 75, tec: 0, tac: 0, phy: 0, soc: 0, eff: 0, pot: 0 }, aboutMe: {}, stub: true },
  'u13-mia-carter':        { stats: { rating: 77, tec: 0, tac: 0, phy: 0, soc: 0, eff: 0, pot: 0 }, aboutMe: {}, stub: true },
  'u13-esme-penrose':      { stats: { rating: 71, tec: 0, tac: 0, phy: 0, soc: 0, eff: 0, pot: 0 }, aboutMe: {}, stub: true },
  'u13-layla-quintero':    { stats: { rating: 74, tec: 0, tac: 0, phy: 0, soc: 0, eff: 0, pot: 0 }, aboutMe: {}, stub: true },
  'u13-ruby-sanderson':    { stats: { rating: 76, tec: 0, tac: 0, phy: 0, soc: 0, eff: 0, pot: 0 }, aboutMe: {}, stub: true },
  'u13-tilly-brackenhall': { stats: { rating: 78, tec: 0, tac: 0, phy: 0, soc: 0, eff: 0, pot: 0 }, aboutMe: {}, stub: true },
  'u13-nia-okonkwo':       { stats: { rating: 69, tec: 0, tac: 0, phy: 0, soc: 0, eff: 0, pot: 0 }, aboutMe: {}, stub: true },

  // ──── U14 Eagles — stub profiles ────
  // Noah Baxter (u14-noah-baxter) is restricted — DELIBERATELY OMITTED.
  // His row is not clickable in Squad Management per the restricted-
  // player guard. Defensive: not having a detail entry means even if
  // a future surface bypasses the guard, no card opens for him.

  'u14-caleb-frazier':   { stats: { rating: 74, tec: 0, tac: 0, phy: 0, soc: 0, eff: 0, pot: 0 }, aboutMe: {}, stub: true },
  'u14-idris-khan':      { stats: { rating: 71, tec: 0, tac: 0, phy: 0, soc: 0, eff: 0, pot: 0 }, aboutMe: {}, stub: true },
  'u14-sebastian-cole':  { stats: { rating: 75, tec: 0, tac: 0, phy: 0, soc: 0, eff: 0, pot: 0 }, aboutMe: {}, stub: true },
  'u14-ben-morley':      { stats: { rating: 70, tec: 0, tac: 0, phy: 0, soc: 0, eff: 0, pot: 0 }, aboutMe: {}, stub: true },
  'u14-toby-lockhart':   { stats: { rating: 73, tec: 0, tac: 0, phy: 0, soc: 0, eff: 0, pot: 0 }, aboutMe: {}, stub: true },
  'u14-arjun-mehta':     { stats: { rating: 76, tec: 0, tac: 0, phy: 0, soc: 0, eff: 0, pot: 0 }, aboutMe: {}, stub: true },
  'u14-riley-vasilakis': { stats: { rating: 71, tec: 0, tac: 0, phy: 0, soc: 0, eff: 0, pot: 0 }, aboutMe: {}, stub: true },
}
