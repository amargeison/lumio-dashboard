// Shape of per-sport demo data consumed by the generic mobile Home (shared
// component at src/components/mobile/MobileSportHome.tsx). Each sport's
// config file in src/lib/mobile/configs/ populates one of these and the same
// component renders tennis / darts / golf / boxing without branching.
//
// Colours are passed as full CSS strings (rgb / hex) so they can vary per
// sport without needing a palette abstraction.

export type MobileStatTint = 'violet' | 'white' | 'yellow'

export type MobileHeroStatConfig = {
  label: string
  value: string
  tint?: MobileStatTint
  sub?: string
}

export type MobileHeroWeatherConfig = {
  icon: string
  temp: string
  city: string
}

export type MobileHeroClockConfig = {
  city: string
  /** IANA timezone, e.g. 'Europe/London'. */
  tz: string
}

export type MobileQuickActionConfig = {
  id: string
  icon: string
  label: string
  active?: boolean
  hot?: boolean
}

export type MobilePlayerBlobConfig = {
  name: string
  initials: string
  rank: string
  photoUrl?: string | null
}

export type MobileMatchConfig = {
  /** e.g. "Today 13:00", "Tonight 20:00", "Fight Night 48d". */
  timeLabel: string
  /**
   * Colour keyword controlling the time-pill tint. Green = today/live,
   * amber = future (e.g. fight camp counting down), red = urgent alert.
   */
  timeLabelTint: 'green' | 'amber' | 'red'
  /** e.g. "ATP MONTE-CARLO", "PDC EUROPEAN CH.", "DP WORLD TOUR", "MERIDIAN SPORTS PPV". */
  eventLabel: string
  /** e.g. "R16", "R1", "PPV". */
  roundLabel: string
  /** Small print under the VS glyph — e.g. "Clay · H2H 3–1". */
  metaLabel: string
  player: MobilePlayerBlobConfig
  opponent: MobilePlayerBlobConfig
  primaryButtonLabel: string
  secondaryButtonLabel: string
  /** Section ID to navigate to when the primary button is pressed. */
  primaryButtonTarget: string
  /** Section ID for the secondary button. */
  secondaryButtonTarget: string
}

export type MobileScheduleItem = {
  id: string
  time: string
  label: string
  highlight?: boolean
}

export type MobileVenueConfig = {
  /** Eyebrow — e.g. "TODAY'S VENUE", "FIGHT NIGHT VENUE", "TONIGHT'S VENUE". */
  eyebrow: string
  name: string
  /** e.g. "18°C · Sunny · Court 4 open 10:00". */
  conditionsLine: string
  rows: { label: string; value: string; tint?: 'green' | 'amber' | 'red' | 'default' }[]
}

export type MobileAISummaryItem = {
  icon: string
  text: string
}

export type MobileAISummaryConfig = {
  items: MobileAISummaryItem[]
  /**
   * Text read aloud by the speaker icon (`useAudioBriefing`). Plain prose.
   */
  briefingText: string
}

export type MobilePerformanceIntelConfig = {
  timestampLabel: string
  /** JSX-safe string — rendered verbatim. */
  body: string
  /** Trailing green fragment highlighted in the card (e.g. "84%"). */
  highlight?: string
  /** Section ID to navigate to on tap. */
  target: string
}

export type MobileSponsorAlertConfig = {
  dueLabel: string
  message: string
  target: string
}

export type MobileRoundupMessageConfig = {
  sender: string
  timestamp: string
  body: string
}

export type MobileRoundupChannelConfig = {
  id: string
  label: string
  icon: string
  count: number
  color: string
  urgent?: number
  demoMessages?: MobileRoundupMessageConfig[]
}

// ── Training hub ────────────────────────────────────────────────────────────

export type MobileTrainingRecovery = {
  score: string
  hrv: string
  restingHr: string
  sleep: string
}

export type MobileTrainingPerformance = {
  /** 3 stats displayed as a row. */
  stats: { label: string; value: string }[]
  subtitle: string
}

export type MobileTrainingPractice = {
  subtitle: string
  rows: { label: string; value: string }[]
}

export type MobileTrainingGps = {
  subtitle: string
  rows: { label: string; value: string }[]
} | null  // null → skip the card entirely (e.g. darts)

export type MobileTrainingVideo = {
  subtitle: string
  rows: { label: string; value: string }[]
}

export type MobileTrainingNutrition = {
  subtitle: string
  rows: { label: string; value: string }[]
}

export type MobileTrainingMental = {
  subtitle: string
  rows: { label: string; value: string }[]
}

export type MobileTrainingEquipment = {
  subtitle: string
  rows: { label: string; value: string }[]
}

export type MobileTrainingConfig = {
  headerSubtitle: string        // "Last practice: Yesterday 16:00 · 78% intensity"
  recovery: MobileTrainingRecovery
  performance: MobileTrainingPerformance
  practice: MobileTrainingPractice
  gps: MobileTrainingGps
  video: MobileTrainingVideo
  nutrition: MobileTrainingNutrition
  mental: MobileTrainingMental
  equipment: MobileTrainingEquipment
}

// ── Top-level config ────────────────────────────────────────────────────────

export type SportId = 'tennis' | 'darts' | 'golf' | 'boxing'

export type SportMobileConfig = {
  sport: SportId
  /** Lumio sport emoji in the greeting. */
  sportEmoji: string
  personaName: string
  personaInitials: string
  /**
   * Persona photo for the top-bar avatar. Omit (or set to empty string) to
   * fall back to initials — used by boxing while a real Marcus Cole headshot
   * is sourced.
   */
  personaPhotoUrl?: string
  teamLogoUrl: string
  headerSubtitle: string        // "TENNIS · MONTE-CARLO"
  /** Suffix appended to the date pill — e.g. "R16", "R1", "DAY 22/70". */
  dateLabelSuffix: string
  quote: { text: string; author: string }
  heroStats: MobileHeroStatConfig[]
  weather: MobileHeroWeatherConfig
  clocks: MobileHeroClockConfig[]
  quickActions: MobileQuickActionConfig[]
  allActionsCount: number
  match: MobileMatchConfig
  schedule: MobileScheduleItem[]
  venue: MobileVenueConfig
  aiSummary: MobileAISummaryConfig
  performanceIntel: MobilePerformanceIntelConfig
  sponsorAlert: MobileSponsorAlertConfig
  roundupChannels: MobileRoundupChannelConfig[]
  training: MobileTrainingConfig
}
