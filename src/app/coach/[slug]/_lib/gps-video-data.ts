// ─── Coach portal — GPS & Video demo data ───────────────────────────────────
// Ported from the tennis PLAYER portal's GPS & Video page, reshaped from a
// single-subject model into a PER-PLAYER one so a coach can pick a player and a
// session. Demo only — canned data, no devices, no API. The data shapes mirror
// the source (GpsSession / CourtZone / CourtZoneMetric / VideoClip /
// SessionHistoryRow / HrZone / SpeedZone) so the copied renderers map cleanly.
//
// What changes when the coach switches PLAYER:  the whole bundle (sessions,
// movement/HR profile, coverage history).
// What changes when the coach switches SESSION: the headline KPIs, the court
// heatmap, the 6-zone coverage, the per-set charts, the clips and the AI brief.
//
// Keyed by the coach portal's PLAYERS ids (coach-data.ts). Players with no entry
// here render the "no session logged" empty state, not a device-connect gate.

// ─── Source-faithful shapes ──────────────────────────────────────────────────

// Heat blobs drawn over the court SVG (the movement heatmap).
export type CourtZone = { x: number; y: number; r: number; o: number }

// One cell of the 6-zone court-coverage grid (3 cols × 2 rows).
export type CourtZoneMetric = { x: number; y: number; w: number; h: number; label: string; pct: number }

// A Lumio Vision highlight clip. `tint` is a single hex used to build an
// inline gradient in the renderer (the source used Tailwind gradient classes).
export type VideoClip = { ctx: string; label: string; time: string; tint: string }

// A row in the player's session-history table.
export type SessionHistoryRow = { date: string; surface: string; coverage: string; load: number; speed: string; outcome: string; win: boolean | null }

// Heart-rate time-in-zone.
export type HrZone = { zone: string; pct: number; color: string }

// Speed time-in-zone (with time spent in the band).
export type SpeedZone = { zone: string; pct: number; time: string; c: string }

// A single tracked session for a player. Top-line metrics + per-set breakdowns
// + the court visuals + clips + a coach-voiced brief all live here so switching
// session updates everything the page shows.
export type GpsSession = {
  id: string
  date: string                 // 'YYYY-MM-DD'
  label: string                // e.g. 'Match vs C. Vega' / 'Practice — serve block'
  type: 'Practice' | 'Match'
  surface: 'Clay' | 'Hard' | 'Grass'
  duration: number             // minutes
  distance: number             // km
  load: number                 // 0–100 load score
  topSpeed: number             // km/h
  sprintCount: number
  recovery: 'Good' | 'Moderate' | 'Watch'
  coverage: number             // % of own half
  acwr: number                 // acute:chronic workload ratio
  court: CourtZone[]           // movement heat blobs
  courtZones: CourtZoneMetric[]// 6-zone coverage grid
  distanceBySet: { set: string; km: number; load: number }[]
  hrBySet: { set: string; avg: number; peak: number }[]
  sprintsPerSet: { set: string; n: number }[]
  topSpeedPerSet: { set: string; kmh: number }[]
  clips: VideoClip[]
  brief: string                // THIRD-PERSON, coach-voiced
}

// Per-player bundle. Movement / HR profile and history are player-level traits;
// the dated sessions carry the per-session detail.
export type PlayerGpsData = {
  distanceByPhase: { phase: string; km: number; c: string }[]
  speedZones: SpeedZone[]
  hrZones: HrZone[]
  history: SessionHistoryRow[]
  sessions: GpsSession[]       // newest first
}

// Non-cyan semantic palette reused across clips/charts (page chrome uses the
// coach accent token instead).
const GREEN = '#22C55E', AMBER = '#F59E0B', RED = '#EF4444', PURPLE = '#A855F7', SKY = '#0EA5E9'

// ─── Mia Chen (p1) · Junior · clay ───────────────────────────────────────────
const MIA: PlayerGpsData = {
  distanceByPhase: [
    { phase: 'Baseline rallies', km: 2.2, c: SKY },
    { phase: 'Net approaches',   km: 0.3, c: GREEN },
    { phase: 'Serving',          km: 0.5, c: AMBER },
    { phase: 'Returning',        km: 0.4, c: PURPLE },
  ],
  speedZones: [
    { zone: 'Standing 0-2 km/h', pct: 16, time: '07:12', c: '#0E7C3A' },
    { zone: 'Walking 2-7 km/h',  pct: 38, time: '17:06', c: GREEN },
    { zone: 'Jogging 7-14 km/h', pct: 29, time: '13:03', c: '#FACC15' },
    { zone: 'Running 14-20 km/h',pct: 14, time: '06:18', c: AMBER },
    { zone: 'Sprinting 20+ km/h',pct: 3,  time: '01:21', c: RED },
  ],
  hrZones: [
    { zone: 'Z1 Recovery', pct: 24, color: '#22C55E' },
    { zone: 'Z2 Aerobic',  pct: 38, color: '#84CC16' },
    { zone: 'Z3 Tempo',    pct: 24, color: '#FACC15' },
    { zone: 'Z4 Threshold',pct: 11, color: '#F59E0B' },
    { zone: 'Z5 VO2',      pct: 3,  color: '#EF4444' },
  ],
  history: [
    { date: '11 Jun', surface: 'Clay', coverage: '3.4km', load: 58, speed: '21.4km/h', outcome: 'Practice', win: null },
    { date: '07 Jun', surface: 'Clay', coverage: '3.1km', load: 52, speed: '20.8km/h', outcome: 'Practice', win: null },
    { date: '04 Jun', surface: 'Clay', coverage: '3.6km', load: 61, speed: '22.0km/h', outcome: 'W vs Ortega', win: true },
  ],
  sessions: [
    {
      id: 'p1-s2', date: '2026-06-11', label: 'Private — first serve block', type: 'Practice', surface: 'Clay',
      duration: 45, distance: 3.4, load: 58, topSpeed: 21.4, sprintCount: 19, recovery: 'Good', coverage: 74, acwr: 0.98,
      court: [{x:200,y:320,r:38,o:0.66},{x:200,y:300,r:30,o:0.54},{x:165,y:312,r:22,o:0.42},{x:235,y:314,r:20,o:0.38},{x:200,y:175,r:16,o:0.26}],
      courtZones: [
        { x: 0.10, y: 0.78, w: 0.27, h: 0.18, label: 'Deuce baseline',  pct: 30 },
        { x: 0.37, y: 0.78, w: 0.26, h: 0.18, label: 'Centre baseline', pct: 34 },
        { x: 0.63, y: 0.78, w: 0.27, h: 0.18, label: 'Ad baseline',     pct: 22 },
        { x: 0.10, y: 0.52, w: 0.27, h: 0.16, label: 'Deuce net',       pct: 5  },
        { x: 0.37, y: 0.52, w: 0.26, h: 0.16, label: 'Centre net',      pct: 6  },
        { x: 0.63, y: 0.52, w: 0.27, h: 0.16, label: 'Ad net',          pct: 3  },
      ],
      distanceBySet: [{ set: 'Block 1', km: 1.4, load: 26 }, { set: 'Block 2', km: 1.2, load: 21 }, { set: 'Games', km: 0.8, load: 11 }],
      hrBySet: [{ set: 'Block 1', avg: 138, peak: 166 }, { set: 'Block 2', avg: 144, peak: 172 }, { set: 'Games', avg: 149, peak: 178 }],
      sprintsPerSet: [{ set: 'Block 1', n: 8 }, { set: 'Block 2', n: 7 }, { set: 'Games', n: 4 }],
      topSpeedPerSet: [{ set: 'Block 1', kmh: 21.4 }, { set: 'Block 2', kmh: 20.6 }, { set: 'Games', kmh: 19.8 }],
      clips: [
        { ctx: 'Block 2 · serve rep 14', label: 'First serve in', time: '0:18', tint: GREEN },
        { ctx: 'Games · point 6', label: 'Forehand rally win', time: '0:41', tint: SKY },
        { ctx: 'Block 1 · serve rep 5', label: 'Toss & contact', time: '0:27', tint: AMBER },
      ],
      brief: "Mia covered 3.4km over the 45-minute block — recovery is good and her load (58) sits in a comfortable range for a Junior. First-serve contact point is steadier than last week: 6 of 10 landing in from the baseline by the games block. Court coverage stayed almost entirely at the baseline (centre 34%), which is right for her stage. Next session: nudge her a step inside the baseline on second-ball forehands to build the serve+1 habit early.",
    },
    {
      id: 'p1-s1', date: '2026-06-07', label: 'Private — rally & movement', type: 'Practice', surface: 'Clay',
      duration: 45, distance: 3.1, load: 52, topSpeed: 20.8, sprintCount: 16, recovery: 'Good', coverage: 71, acwr: 0.94,
      court: [{x:200,y:322,r:36,o:0.62},{x:200,y:302,r:28,o:0.5},{x:168,y:314,r:20,o:0.4},{x:232,y:316,r:18,o:0.36}],
      courtZones: [
        { x: 0.10, y: 0.78, w: 0.27, h: 0.18, label: 'Deuce baseline',  pct: 28 },
        { x: 0.37, y: 0.78, w: 0.26, h: 0.18, label: 'Centre baseline', pct: 36 },
        { x: 0.63, y: 0.78, w: 0.27, h: 0.18, label: 'Ad baseline',     pct: 24 },
        { x: 0.10, y: 0.52, w: 0.27, h: 0.16, label: 'Deuce net',       pct: 4  },
        { x: 0.37, y: 0.52, w: 0.26, h: 0.16, label: 'Centre net',      pct: 5  },
        { x: 0.63, y: 0.52, w: 0.27, h: 0.16, label: 'Ad net',          pct: 3  },
      ],
      distanceBySet: [{ set: 'Block 1', km: 1.3, load: 24 }, { set: 'Block 2', km: 1.1, load: 19 }, { set: 'Games', km: 0.7, load: 9 }],
      hrBySet: [{ set: 'Block 1', avg: 135, peak: 162 }, { set: 'Block 2', avg: 141, peak: 169 }, { set: 'Games', avg: 146, peak: 174 }],
      sprintsPerSet: [{ set: 'Block 1', n: 7 }, { set: 'Block 2', n: 6 }, { set: 'Games', n: 3 }],
      topSpeedPerSet: [{ set: 'Block 1', kmh: 20.8 }, { set: 'Block 2', kmh: 20.1 }, { set: 'Games', kmh: 19.2 }],
      clips: [
        { ctx: 'Games · point 3', label: 'Cross-court rally', time: '0:36', tint: SKY },
        { ctx: 'Block 2 · drill', label: 'Recovery step', time: '0:22', tint: GREEN },
      ],
      brief: "A lighter movement day for Mia (3.1km, load 52). Her cross-court rally tolerance is the headline — she held a 10-ball exchange twice in the games block, which is a first. HR stayed mostly aerobic (Z2 38%), so there's room to raise tempo. Recovery between points is good. Keep building rally length before adding pace.",
    },
  ],
}

// ─── Tom Okafor (p2) · Performance · clay ────────────────────────────────────
const TOM: PlayerGpsData = {
  distanceByPhase: [
    { phase: 'Baseline rallies', km: 3.1, c: SKY },
    { phase: 'Net approaches',   km: 0.6, c: GREEN },
    { phase: 'Serving',          km: 0.8, c: AMBER },
    { phase: 'Returning',        km: 0.6, c: PURPLE },
  ],
  speedZones: [
    { zone: 'Standing 0-2 km/h', pct: 11, time: '06:36', c: '#0E7C3A' },
    { zone: 'Walking 2-7 km/h',  pct: 31, time: '18:36', c: GREEN },
    { zone: 'Jogging 7-14 km/h', pct: 30, time: '18:00', c: '#FACC15' },
    { zone: 'Running 14-20 km/h',pct: 20, time: '12:00', c: AMBER },
    { zone: 'Sprinting 20+ km/h',pct: 8,  time: '04:48', c: RED },
  ],
  hrZones: [
    { zone: 'Z1 Recovery', pct: 16, color: '#22C55E' },
    { zone: 'Z2 Aerobic',  pct: 33, color: '#84CC16' },
    { zone: 'Z3 Tempo',    pct: 29, color: '#FACC15' },
    { zone: 'Z4 Threshold',pct: 16, color: '#F59E0B' },
    { zone: 'Z5 VO2',      pct: 6,  color: '#EF4444' },
  ],
  history: [
    { date: '11 Jun', surface: 'Clay', coverage: '4.8km', load: 71, speed: '27.6km/h', outcome: 'Practice', win: null },
    { date: '06 Jun', surface: 'Clay', coverage: '5.2km', load: 83, speed: '28.9km/h', outcome: 'W vs Adeyemi', win: true },
    { date: '02 Jun', surface: 'Hard', coverage: '4.5km', load: 69, speed: '28.1km/h', outcome: 'L vs Novak', win: false },
  ],
  sessions: [
    {
      id: 'p2-s2', date: '2026-06-11', label: 'Private — serve+1 patterns', type: 'Practice', surface: 'Clay',
      duration: 60, distance: 4.8, load: 71, topSpeed: 27.6, sprintCount: 38, recovery: 'Good', coverage: 80, acwr: 1.04,
      court: [{x:200,y:316,r:44,o:0.7},{x:200,y:296,r:36,o:0.6},{x:158,y:310,r:26,o:0.46},{x:242,y:312,r:24,o:0.43},{x:200,y:172,r:20,o:0.34},{x:165,y:178,r:15,o:0.26}],
      courtZones: [
        { x: 0.10, y: 0.78, w: 0.27, h: 0.18, label: 'Deuce baseline',  pct: 31 },
        { x: 0.37, y: 0.78, w: 0.26, h: 0.18, label: 'Centre baseline', pct: 27 },
        { x: 0.63, y: 0.78, w: 0.27, h: 0.18, label: 'Ad baseline',     pct: 19 },
        { x: 0.10, y: 0.52, w: 0.27, h: 0.16, label: 'Deuce net',       pct: 10 },
        { x: 0.37, y: 0.52, w: 0.26, h: 0.16, label: 'Centre net',      pct: 8  },
        { x: 0.63, y: 0.52, w: 0.27, h: 0.16, label: 'Ad net',          pct: 5  },
      ],
      distanceBySet: [{ set: 'Set 1', km: 1.9, load: 30 }, { set: 'Set 2', km: 1.6, load: 25 }, { set: 'Games', km: 1.3, load: 16 }],
      hrBySet: [{ set: 'Set 1', avg: 150, peak: 180 }, { set: 'Set 2', avg: 156, peak: 186 }, { set: 'Games', avg: 161, peak: 190 }],
      sprintsPerSet: [{ set: 'Set 1', n: 16 }, { set: 'Set 2', n: 13 }, { set: 'Games', n: 9 }],
      topSpeedPerSet: [{ set: 'Set 1', kmh: 27.6 }, { set: 'Set 2', kmh: 26.8 }, { set: 'Games', kmh: 25.9 }],
      clips: [
        { ctx: 'Set 2 · serve+1 rep 9', label: 'Serve + forehand', time: '0:32', tint: SKY },
        { ctx: 'Games · point 4', label: 'Kick second serve', time: '0:28', tint: AMBER },
        { ctx: 'Set 1 · point 7', label: 'Inside-out forehand', time: '0:39', tint: GREEN },
        { ctx: 'Games · point 11', label: 'Net put-away', time: '0:21', tint: PURPLE },
      ],
      brief: "Tom covered 4.8km with a healthy load of 71 and good recovery — his serve+1 patterning is the clear gain today. 10% of his court time was at the deuce net, up from his usual baseline-only profile, showing he's finishing serve+1 points forward. Second-serve kick is landing with more shape. Top speed held within 1.7 km/h across the session, so no fatigue flag. Next: tighten the +1 forehand target to the open court.",
    },
    {
      id: 'p2-s1', date: '2026-06-06', label: 'Match vs Adeyemi', type: 'Match', surface: 'Clay',
      duration: 96, distance: 5.2, load: 83, topSpeed: 28.9, sprintCount: 47, recovery: 'Moderate', coverage: 82, acwr: 1.12,
      court: [{x:200,y:318,r:46,o:0.74},{x:200,y:296,r:38,o:0.64},{x:152,y:310,r:30,o:0.5},{x:248,y:312,r:28,o:0.46},{x:200,y:168,r:22,o:0.36},{x:160,y:176,r:16,o:0.28},{x:240,y:174,r:14,o:0.25}],
      courtZones: [
        { x: 0.10, y: 0.78, w: 0.27, h: 0.18, label: 'Deuce baseline',  pct: 29 },
        { x: 0.37, y: 0.78, w: 0.26, h: 0.18, label: 'Centre baseline', pct: 30 },
        { x: 0.63, y: 0.78, w: 0.27, h: 0.18, label: 'Ad baseline',     pct: 22 },
        { x: 0.10, y: 0.52, w: 0.27, h: 0.16, label: 'Deuce net',       pct: 8  },
        { x: 0.37, y: 0.52, w: 0.26, h: 0.16, label: 'Centre net',      pct: 7  },
        { x: 0.63, y: 0.52, w: 0.27, h: 0.16, label: 'Ad net',          pct: 4  },
      ],
      distanceBySet: [{ set: 'Set 1', km: 2.4, load: 38 }, { set: 'Set 2', km: 1.8, load: 30 }, { set: 'Set 3', km: 1.0, load: 15 }],
      hrBySet: [{ set: 'Set 1', avg: 154, peak: 186 }, { set: 'Set 2', avg: 160, peak: 189 }, { set: 'Set 3', avg: 167, peak: 193 }],
      sprintsPerSet: [{ set: 'Set 1', n: 20 }, { set: 'Set 2', n: 16 }, { set: 'Set 3', n: 11 }],
      topSpeedPerSet: [{ set: 'Set 1', kmh: 28.9 }, { set: 'Set 2', kmh: 27.7 }, { set: 'Set 3', kmh: 26.1 }],
      clips: [
        { ctx: 'Set 1 · Game 6', label: 'Forehand winner', time: '0:24', tint: GREEN },
        { ctx: 'Set 2 · Game 4', label: 'Serve ace', time: '0:18', tint: SKY },
        { ctx: 'Set 3 · Game 2', label: 'Backhand DTL', time: '0:31', tint: PURPLE },
      ],
      brief: "Tom's match win over Adeyemi was a real workout: 5.2km, load 83, recovery only moderate. Top speed dropped 2.8 km/h from Set 1 to Set 3 and HR climbed each set — a stamina flag for the next training block. Tactically excellent: he won the long rallies in Set 1. Build a stamina-focused S&C session before the next county fixture so the late-match speed holds.",
    },
  ],
}

// ─── Ava Romero (p3) · Junior · clay ─────────────────────────────────────────
const AVA: PlayerGpsData = {
  distanceByPhase: [
    { phase: 'Baseline rallies', km: 2.0, c: SKY },
    { phase: 'Net approaches',   km: 0.2, c: GREEN },
    { phase: 'Serving',          km: 0.4, c: AMBER },
    { phase: 'Returning',        km: 0.3, c: PURPLE },
  ],
  speedZones: [
    { zone: 'Standing 0-2 km/h', pct: 18, time: '08:06', c: '#0E7C3A' },
    { zone: 'Walking 2-7 km/h',  pct: 41, time: '18:27', c: GREEN },
    { zone: 'Jogging 7-14 km/h', pct: 27, time: '12:09', c: '#FACC15' },
    { zone: 'Running 14-20 km/h',pct: 12, time: '05:24', c: AMBER },
    { zone: 'Sprinting 20+ km/h',pct: 2,  time: '00:54', c: RED },
  ],
  hrZones: [
    { zone: 'Z1 Recovery', pct: 27, color: '#22C55E' },
    { zone: 'Z2 Aerobic',  pct: 40, color: '#84CC16' },
    { zone: 'Z3 Tempo',    pct: 22, color: '#FACC15' },
    { zone: 'Z4 Threshold',pct: 9,  color: '#F59E0B' },
    { zone: 'Z5 VO2',      pct: 2,  color: '#EF4444' },
  ],
  history: [
    { date: '11 Jun', surface: 'Clay', coverage: '2.9km', load: 47, speed: '19.6km/h', outcome: 'Practice', win: null },
    { date: '05 Jun', surface: 'Clay', coverage: '3.2km', load: 53, speed: '20.2km/h', outcome: 'Practice', win: null },
  ],
  sessions: [
    {
      id: 'p3-s2', date: '2026-06-11', label: 'Private — rally control', type: 'Practice', surface: 'Clay',
      duration: 45, distance: 2.9, load: 47, topSpeed: 19.6, sprintCount: 12, recovery: 'Good', coverage: 69, acwr: 0.91,
      court: [{x:200,y:324,r:34,o:0.6},{x:200,y:304,r:26,o:0.48},{x:170,y:316,r:18,o:0.36},{x:230,y:318,r:16,o:0.32}],
      courtZones: [
        { x: 0.10, y: 0.78, w: 0.27, h: 0.18, label: 'Deuce baseline',  pct: 27 },
        { x: 0.37, y: 0.78, w: 0.26, h: 0.18, label: 'Centre baseline', pct: 38 },
        { x: 0.63, y: 0.78, w: 0.27, h: 0.18, label: 'Ad baseline',     pct: 25 },
        { x: 0.10, y: 0.52, w: 0.27, h: 0.16, label: 'Deuce net',       pct: 4  },
        { x: 0.37, y: 0.52, w: 0.26, h: 0.16, label: 'Centre net',      pct: 4  },
        { x: 0.63, y: 0.52, w: 0.27, h: 0.16, label: 'Ad net',          pct: 2  },
      ],
      distanceBySet: [{ set: 'Block 1', km: 1.2, load: 21 }, { set: 'Block 2', km: 1.0, load: 17 }, { set: 'Games', km: 0.7, load: 9 }],
      hrBySet: [{ set: 'Block 1', avg: 132, peak: 158 }, { set: 'Block 2', avg: 137, peak: 164 }, { set: 'Games', avg: 142, peak: 170 }],
      sprintsPerSet: [{ set: 'Block 1', n: 5 }, { set: 'Block 2', n: 4 }, { set: 'Games', n: 3 }],
      topSpeedPerSet: [{ set: 'Block 1', kmh: 19.6 }, { set: 'Block 2', kmh: 18.9 }, { set: 'Games', kmh: 18.1 }],
      clips: [
        { ctx: 'Games · point 5', label: '10-ball rally', time: '0:44', tint: SKY },
        { ctx: 'Block 1 · drill', label: 'Centre recovery', time: '0:19', tint: GREEN },
      ],
      brief: "Ava covered 2.9km at a light load (47) — appropriate for her age and stage, recovery good. The win today is rally control: she reached a 10-ball cross-court exchange in the games block for the first time, helped by holding the centre baseline (38% coverage). Movement is still mostly walking/jogging (Z2 40%). Keep the target at consistency over pace; add one wide cone to start stretching her recovery step.",
    },
    {
      id: 'p3-s1', date: '2026-06-05', label: 'Private — footwork & rally', type: 'Practice', surface: 'Clay',
      duration: 45, distance: 3.2, load: 53, topSpeed: 20.2, sprintCount: 14, recovery: 'Moderate', coverage: 72, acwr: 1.02,
      court: [{x:200,y:322,r:36,o:0.62},{x:200,y:302,r:28,o:0.5},{x:166,y:314,r:20,o:0.4},{x:234,y:316,r:18,o:0.36},{x:200,y:178,r:14,o:0.24}],
      courtZones: [
        { x: 0.10, y: 0.78, w: 0.27, h: 0.18, label: 'Deuce baseline',  pct: 26 },
        { x: 0.37, y: 0.78, w: 0.26, h: 0.18, label: 'Centre baseline', pct: 35 },
        { x: 0.63, y: 0.78, w: 0.27, h: 0.18, label: 'Ad baseline',     pct: 28 },
        { x: 0.10, y: 0.52, w: 0.27, h: 0.16, label: 'Deuce net',       pct: 5  },
        { x: 0.37, y: 0.52, w: 0.26, h: 0.16, label: 'Centre net',      pct: 4  },
        { x: 0.63, y: 0.52, w: 0.27, h: 0.16, label: 'Ad net',          pct: 2  },
      ],
      distanceBySet: [{ set: 'Block 1', km: 1.3, load: 23 }, { set: 'Block 2', km: 1.1, load: 19 }, { set: 'Games', km: 0.8, load: 11 }],
      hrBySet: [{ set: 'Block 1', avg: 134, peak: 161 }, { set: 'Block 2', avg: 140, peak: 167 }, { set: 'Games', avg: 145, peak: 172 }],
      sprintsPerSet: [{ set: 'Block 1', n: 6 }, { set: 'Block 2', n: 5 }, { set: 'Games', n: 3 }],
      topSpeedPerSet: [{ set: 'Block 1', kmh: 20.2 }, { set: 'Block 2', kmh: 19.4 }, { set: 'Games', kmh: 18.6 }],
      clips: [
        { ctx: 'Block 2 · ladder', label: 'Split-step timing', time: '0:23', tint: AMBER },
        { ctx: 'Games · point 2', label: 'Cross-court rally', time: '0:37', tint: SKY },
      ],
      brief: "A slightly busier footwork day for Ava (3.2km, load 53, recovery moderate — she tired in the last block). Split-step timing improved on the ladder drill. Coverage spread a little wider to the ad side (28%). Watch the load creep across consecutive sessions; keep one of her two weekly sessions light.",
    },
  ],
}

// ─── Daniel Cruz (p6) · Performance · match play ─────────────────────────────
const DANIEL: PlayerGpsData = {
  distanceByPhase: [
    { phase: 'Baseline rallies', km: 3.6, c: SKY },
    { phase: 'Net approaches',   km: 0.8, c: GREEN },
    { phase: 'Serving',          km: 0.9, c: AMBER },
    { phase: 'Returning',        km: 0.7, c: PURPLE },
  ],
  speedZones: [
    { zone: 'Standing 0-2 km/h', pct: 10, time: '07:30', c: '#0E7C3A' },
    { zone: 'Walking 2-7 km/h',  pct: 29, time: '21:45', c: GREEN },
    { zone: 'Jogging 7-14 km/h', pct: 28, time: '21:00', c: '#FACC15' },
    { zone: 'Running 14-20 km/h',pct: 22, time: '16:30', c: AMBER },
    { zone: 'Sprinting 20+ km/h',pct: 11, time: '08:15', c: RED },
  ],
  hrZones: [
    { zone: 'Z1 Recovery', pct: 14, color: '#22C55E' },
    { zone: 'Z2 Aerobic',  pct: 30, color: '#84CC16' },
    { zone: 'Z3 Tempo',    pct: 30, color: '#FACC15' },
    { zone: 'Z4 Threshold',pct: 18, color: '#F59E0B' },
    { zone: 'Z5 VO2',      pct: 8,  color: '#EF4444' },
  ],
  history: [
    { date: '11 Jun', surface: 'Clay', coverage: '5.9km', load: 88, speed: '30.4km/h', outcome: 'Match play', win: null },
    { date: '08 Jun', surface: 'Hard', coverage: '5.4km', load: 79, speed: '31.0km/h', outcome: 'W vs Brenner', win: true },
    { date: '04 Jun', surface: 'Clay', coverage: '5.7km', load: 85, speed: '29.8km/h', outcome: 'L vs Holm', win: false },
  ],
  sessions: [
    {
      id: 'p6-s2', date: '2026-06-11', label: 'Match play — competitive sets', type: 'Match', surface: 'Clay',
      duration: 75, distance: 5.9, load: 88, topSpeed: 30.4, sprintCount: 54, recovery: 'Watch', coverage: 85, acwr: 1.17,
      court: [{x:200,y:320,r:48,o:0.76},{x:200,y:295,r:40,o:0.66},{x:150,y:310,r:30,o:0.52},{x:250,y:312,r:28,o:0.48},{x:200,y:168,r:24,o:0.4},{x:155,y:175,r:18,o:0.32},{x:245,y:172,r:16,o:0.28},{x:200,y:350,r:14,o:0.24}],
      courtZones: [
        { x: 0.10, y: 0.78, w: 0.27, h: 0.18, label: 'Deuce baseline',  pct: 26 },
        { x: 0.37, y: 0.78, w: 0.26, h: 0.18, label: 'Centre baseline', pct: 28 },
        { x: 0.63, y: 0.78, w: 0.27, h: 0.18, label: 'Ad baseline',     pct: 21 },
        { x: 0.10, y: 0.52, w: 0.27, h: 0.16, label: 'Deuce net',       pct: 12 },
        { x: 0.37, y: 0.52, w: 0.26, h: 0.16, label: 'Centre net',      pct: 8  },
        { x: 0.63, y: 0.52, w: 0.27, h: 0.16, label: 'Ad net',          pct: 5  },
      ],
      distanceBySet: [{ set: 'Set 1', km: 2.5, load: 39 }, { set: 'Set 2', km: 2.0, load: 32 }, { set: 'Set 3', km: 1.4, load: 17 }],
      hrBySet: [{ set: 'Set 1', avg: 156, peak: 188 }, { set: 'Set 2', avg: 163, peak: 191 }, { set: 'Set 3', avg: 170, peak: 196 }],
      sprintsPerSet: [{ set: 'Set 1', n: 23 }, { set: 'Set 2', n: 18 }, { set: 'Set 3', n: 13 }],
      topSpeedPerSet: [{ set: 'Set 1', kmh: 30.4 }, { set: 'Set 2', kmh: 29.1 }, { set: 'Set 3', kmh: 27.4 }],
      clips: [
        { ctx: 'Set 2 · Game 4', label: 'Forehand winner', time: '0:26', tint: GREEN },
        { ctx: 'Set 1 · Game 8', label: 'Serve ace', time: '0:17', tint: SKY },
        { ctx: 'Set 2 · Game 6', label: 'Backhand DTL', time: '0:33', tint: PURPLE },
        { ctx: 'Set 3 · Game 2', label: 'Net approach', time: '0:29', tint: AMBER },
        { ctx: 'Set 1 · Game 3', label: 'Drop shot winner', time: '0:21', tint: RED },
      ],
      brief: "Heavy session for Daniel: 5.9km, load 88, ACWR up to 1.17 — recovery is a watch flag. He competed hard and his net approaches (12% deuce-net coverage) won him points, but top speed fell 3.0 km/h by Set 3 and HR hit Z5 in the closing games. The output is excellent; the load management isn't. Schedule a recovery/light day before the next match and avoid back-to-back high-load sessions this week.",
    },
    {
      id: 'p6-s1', date: '2026-06-08', label: 'Match vs Brenner', type: 'Match', surface: 'Hard',
      duration: 88, distance: 5.4, load: 79, topSpeed: 31.0, sprintCount: 49, recovery: 'Moderate', coverage: 84, acwr: 1.09,
      court: [{x:200,y:318,r:46,o:0.72},{x:200,y:296,r:38,o:0.62},{x:154,y:310,r:28,o:0.48},{x:246,y:312,r:26,o:0.44},{x:200,y:170,r:22,o:0.36},{x:160,y:178,r:16,o:0.26}],
      courtZones: [
        { x: 0.10, y: 0.78, w: 0.27, h: 0.18, label: 'Deuce baseline',  pct: 28 },
        { x: 0.37, y: 0.78, w: 0.26, h: 0.18, label: 'Centre baseline', pct: 27 },
        { x: 0.63, y: 0.78, w: 0.27, h: 0.18, label: 'Ad baseline',     pct: 23 },
        { x: 0.10, y: 0.52, w: 0.27, h: 0.16, label: 'Deuce net',       pct: 10 },
        { x: 0.37, y: 0.52, w: 0.26, h: 0.16, label: 'Centre net',      pct: 7  },
        { x: 0.63, y: 0.52, w: 0.27, h: 0.16, label: 'Ad net',          pct: 5  },
      ],
      distanceBySet: [{ set: 'Set 1', km: 2.2, load: 34 }, { set: 'Set 2', km: 1.9, load: 29 }, { set: 'Set 3', km: 1.3, load: 16 }],
      hrBySet: [{ set: 'Set 1', avg: 153, peak: 185 }, { set: 'Set 2', avg: 159, peak: 189 }, { set: 'Set 3', avg: 166, peak: 192 }],
      sprintsPerSet: [{ set: 'Set 1', n: 20 }, { set: 'Set 2', n: 17 }, { set: 'Set 3', n: 12 }],
      topSpeedPerSet: [{ set: 'Set 1', kmh: 31.0 }, { set: 'Set 2', kmh: 29.6 }, { set: 'Set 3', kmh: 28.0 }],
      clips: [
        { ctx: 'Set 1 · Game 5', label: 'Serve ace', time: '0:16', tint: SKY },
        { ctx: 'Set 3 · Game 9', label: 'Forehand winner', time: '0:24', tint: GREEN },
        { ctx: 'Set 2 · Game 3', label: 'Return winner', time: '0:22', tint: PURPLE },
      ],
      brief: "Daniel's win over Brenner on hard court: 5.4km, load 79, recovery moderate. His peak serve speed (31.0 km/h) was a season best. Late-match speed still tailed off but less than on clay. A strong, well-managed match — this is the load profile to repeat. Reinforce the first-serve target accuracy that set up his serve+1 winners.",
    },
  ],
}

// Keyed by PLAYERS id. Players absent here (Leo, Hannah, Priya, James) show the
// "no GPS session logged" empty state in the coach view.
export const GPS_VIDEO_DATA: Record<string, PlayerGpsData> = {
  p1: MIA,
  p2: TOM,
  p3: AVA,
  p6: DANIEL,
}
