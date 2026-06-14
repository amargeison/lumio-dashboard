// src/app/(football)/football/[slug]/_lib/football-staff-data.ts
//
// Canonical CLUB STAFF roster for Oakridge FC (men's Pro demo). Single source
// of truth shared by the Staff dashboard tabs (StaffView: Today / Org Chart /
// Directory). Mirrors the Women's portal roster architecture. Demo data only.
//
// reportsTo holds the manager's NAME, or 'Board' for the people who report to
// the board. The org chart derives its hierarchy + connector lines from these
// edges — change a reportsTo value and the rendered tree updates automatically.

export type FBStaffDept =
  | 'Executive' | 'Operations' | 'Football' | 'Coaching'
  | 'Performance' | 'Medical' | 'Recruitment' | 'Academy' | 'Commercial'

// Department colour palette (shared with the dashboard Staff tabs + org chart).
export const FB_DEPT_COLOR: Record<FBStaffDept, string> = {
  Executive:   '#8B5CF6', // violet
  Operations:  '#F97316', // orange
  Football:    '#0EA5E9', // sky (Director of Football line)
  Coaching:    '#003DA5', // portal blue (accent)
  Performance: '#22C55E', // green
  Medical:     '#DC2626', // red
  Recruitment: '#F59E0B', // amber
  Academy:     '#10B981', // emerald
  Commercial:  '#06B6D4', // cyan
}

export type FBStaffMember = {
  name: string
  initials: string
  role: string
  dept: FBStaffDept
  quals: string
  email: string
  phone: string
  start: string
  location: string
  status: 'In today' | 'Away'
  available: boolean
  /** Manager's name, or 'Board' for board-reporting leadership. */
  reportsTo: string | 'Board'
  rating: number
  ref: string
  speciality: string
  bio: string
  stats: Record<string, number>
}

export const FOOTBALL_STAFF: FBStaffMember[] = [
  // ── Executive / board ──────────────────────────────────────────────────────
  { name: 'Robert Blackwell', initials: 'RB', role: 'Chairman', dept: 'Executive',
    quals: 'FCA', email: 'chairman@oakridgefc.com', phone: '07700 900001', start: 'Jun 2016', location: 'Boardroom · matchdays',
    status: 'In today', available: true, reportsTo: 'Board', rating: 94, ref: 'OFC-001',
    speciality: 'Ownership · board governance · long-term strategy', bio: 'Owner-chairman since 2016; oversees the board and the club’s long-term strategic direction.',
    stats: { LEAD: 95, STR: 94, FIN: 92, GOV: 93, COM: 88, VIS: 92 } },
  { name: 'Margaret Foss', initials: 'MF', role: 'Chief Executive Officer', dept: 'Executive',
    quals: 'MBA', email: 'ceo@oakridgefc.com', phone: '07700 900002', start: 'Jan 2019', location: 'Oakridge HQ, 9am-6pm',
    status: 'In today', available: true, reportsTo: 'Board', rating: 92, ref: 'OFC-002',
    speciality: 'Club operations · commercial growth · PSR oversight', bio: 'Runs the business side of the club — operations, commercial, finance and PSR compliance.',
    stats: { LEAD: 92, STR: 91, FIN: 90, GOV: 90, COM: 91, VIS: 89 } },
  { name: 'James Morton', initials: 'JM', role: 'Club Secretary', dept: 'Operations',
    quals: 'EFL Cert.', email: 'secretary@oakridgefc.com', phone: '07700 900003', start: 'Aug 2018', location: 'Oakridge HQ, 9am-5pm',
    status: 'In today', available: true, reportsTo: 'Margaret Foss', rating: 87, ref: 'OFC-003',
    speciality: 'Registrations · EFL compliance · matchday operations', bio: 'Owns player registrations, EFL/FA compliance, fixtures and matchday operations.',
    stats: { ADM: 91, COM: 88, ORG: 92, DET: 93, REG: 90, PRE: 88 } },

  // ── Football (Director of Football line) ───────────────────────────────────
  { name: 'Dave Thompson', initials: 'DT', role: 'Director of Football', dept: 'Football',
    quals: 'UEFA B', email: 'dof@oakridgefc.com', phone: '07700 900004', start: 'Jul 2021', location: 'Scouting day — away Thu',
    status: 'Away', available: false, reportsTo: 'Board', rating: 90, ref: 'OFC-004',
    speciality: 'Recruitment strategy · squad model · contract negotiation', bio: 'Owns football operations and the recruitment, performance, medical and academy reporting lines.',
    stats: { STR: 91, NEG: 90, NET: 89, VIS: 90, DEC: 88, COM: 87 } },

  // ── Coaching ───────────────────────────────────────────────────────────────
  { name: 'Marcus Reid', initials: 'MR', role: 'Head Coach', dept: 'Coaching',
    quals: 'UEFA Pro', email: 'reid@oakridgefc.com', phone: '07700 900005', start: 'May 2023', location: 'Training ground, 9am-6pm',
    status: 'In today', available: true, reportsTo: 'Dave Thompson', rating: 91, ref: 'OFC-005',
    speciality: 'Tactical structure · matchday management', bio: 'Leads first-team coaching and selection. UEFA Pro Licence; third season in charge.',
    stats: { TAC: 91, MOT: 93, STR: 88, DEV: 87, COM: 89, PRE: 90 } },
  { name: 'David Hughes', initials: 'DH', role: 'Assistant Manager', dept: 'Coaching',
    quals: 'UEFA A', email: 'hughes@oakridgefc.com', phone: '07700 900006', start: 'May 2023', location: 'Training ground, 9am-6pm',
    status: 'In today', available: true, reportsTo: 'Marcus Reid', rating: 88, ref: 'OFC-006',
    speciality: 'Training plan · opposition analysis', bio: 'Right hand to the Head Coach; runs the weekly training plan and opposition prep.',
    stats: { TAC: 89, MOT: 87, STR: 87, DEV: 86, COM: 88, PRE: 89 } },
  { name: 'Alan Cooper', initials: 'AC', role: 'Goalkeeping Coach', dept: 'Coaching',
    quals: 'UEFA GK A', email: 'cooper@oakridgefc.com', phone: '07700 900007', start: 'Jul 2023', location: 'Training ground, 8am-4pm',
    status: 'Away', available: false, reportsTo: 'Marcus Reid', rating: 86, ref: 'OFC-007',
    speciality: 'Shot-stopping · distribution · set positioning', bio: 'Develops the senior and academy keepers. UEFA GK A; on a CPD course Mon–Wed.',
    stats: { TAC: 85, MOT: 84, STR: 88, DEV: 89, COM: 85, PRE: 88 } },
  { name: 'Tom Wallace', initials: 'TW', role: 'First-Team Coach', dept: 'Coaching',
    quals: 'UEFA A', email: 'wallace@oakridgefc.com', phone: '07700 900008', start: 'Aug 2023', location: 'Training ground, 9am-5pm',
    status: 'In today', available: true, reportsTo: 'Marcus Reid', rating: 85, ref: 'OFC-008',
    speciality: 'Pressing structure · transition moments', bio: 'Sessions lead for out-of-possession work and unit coaching.',
    stats: { TAC: 86, MOT: 85, STR: 86, DEV: 85, COM: 86, PRE: 86 } },
  { name: 'Gary Spencer', initials: 'GS', role: 'Set-Piece Coach', dept: 'Coaching',
    quals: 'UEFA B', email: 'spencer@oakridgefc.com', phone: '07700 900009', start: 'Jul 2024', location: 'Training ground, 9am-5pm',
    status: 'In today', available: true, reportsTo: 'Marcus Reid', rating: 83, ref: 'OFC-009',
    speciality: 'Set-piece delivery · dead-ball routines', bio: 'Specialist set-piece coach; owns attacking and defensive dead-ball routines.',
    stats: { TAC: 84, MOT: 82, STR: 83, DEV: 84, COM: 83, PRE: 85 } },

  // ── Performance ────────────────────────────────────────────────────────────
  { name: 'Liam Forbes', initials: 'LF', role: 'Head of Sports Science', dept: 'Performance',
    quals: 'MSc, PhD', email: 'forbes@oakridgefc.com', phone: '07700 900010', start: 'Jul 2022', location: 'Performance suite, 7am-4pm',
    status: 'In today', available: true, reportsTo: 'Dave Thompson', rating: 88, ref: 'OFC-010',
    speciality: 'Load management · GPS · return-to-play', bio: 'Owns the performance department — physical prep, monitoring and the data pipeline.',
    stats: { SCI: 91, LOA: 90, DAT: 89, COM: 86, REH: 87, PRE: 88 } },
  { name: 'Sophie Bennett', initials: 'SB', role: 'Strength & Conditioning Coach', dept: 'Performance',
    quals: 'MSc S&C', email: 'bennett@oakridgefc.com', phone: '07700 900011', start: 'Aug 2023', location: 'Gym, 7am-3pm',
    status: 'In today', available: true, reportsTo: 'Liam Forbes', rating: 85, ref: 'OFC-011',
    speciality: 'Gym programming · power & speed development', bio: 'Designs and delivers the squad’s strength and conditioning programme.',
    stats: { SCI: 86, LOA: 87, DAT: 83, COM: 85, REH: 84, PRE: 86 } },
  { name: 'Ryan Mills', initials: 'RM', role: 'Fitness Coach', dept: 'Performance',
    quals: 'BSc S&C', email: 'mills@oakridgefc.com', phone: '07700 900012', start: 'Jul 2024', location: 'Training ground, 7am-4pm',
    status: 'In today', available: true, reportsTo: 'Liam Forbes', rating: 82, ref: 'OFC-012',
    speciality: 'Pitch-based conditioning · warm-ups', bio: 'Delivers on-pitch conditioning and individual fitness work.',
    stats: { SCI: 82, LOA: 84, DAT: 80, COM: 83, REH: 81, PRE: 84 } },
  { name: 'Emma Clark', initials: 'EC', role: 'Lead Performance Analyst', dept: 'Performance',
    quals: 'MSc Data Science', email: 'clark@oakridgefc.com', phone: '07700 900013', start: 'Aug 2022', location: 'Analysis suite, 9am-6pm',
    status: 'In today', available: true, reportsTo: 'Liam Forbes', rating: 86, ref: 'OFC-013',
    speciality: 'Opposition analysis · matchday data · coding', bio: 'Heads the analysis unit — opposition reports, live coding and player feedback clips.',
    stats: { SCI: 88, LOA: 82, DAT: 92, COM: 86, REH: 78, PRE: 89 } },

  // ── Medical ────────────────────────────────────────────────────────────────
  { name: 'Dr Sarah Phillips', initials: 'SP', role: 'Club Doctor', dept: 'Medical',
    quals: 'MBBS, MRCGP', email: 'phillips@oakridgefc.com', phone: '07700 900014', start: 'Jul 2021', location: 'Medical centre, 8am-5pm',
    status: 'In today', available: true, reportsTo: 'Dave Thompson', rating: 89, ref: 'OFC-014',
    speciality: 'Clinical lead · concussion protocol · screening', bio: 'Club doctor and medical lead; owns clinical governance and return-to-play sign-off.',
    stats: { MED: 92, REH: 86, SCR: 90, COM: 88, CAR: 91, PRE: 87 } },
  { name: 'Pete Morrison', initials: 'PM', role: 'Head Physiotherapist', dept: 'Medical',
    quals: 'MSc Sports Med', email: 'morrison@oakridgefc.com', phone: '07700 900015', start: 'Aug 2020', location: 'Medical centre, 8am-6pm',
    status: 'In today', available: true, reportsTo: 'Dr Sarah Phillips', rating: 87, ref: 'OFC-015',
    speciality: 'Injury rehab · pitch-side trauma · prehab', bio: 'Leads the physiotherapy team and the day-to-day treatment room.',
    stats: { MED: 86, REH: 91, SCR: 85, COM: 86, CAR: 88, PRE: 88 } },
  { name: 'Hannah Reid', initials: 'HR', role: 'Sports Therapist', dept: 'Medical',
    quals: 'BSc Sports Therapy', email: 'h.reid@oakridgefc.com', phone: '07700 900016', start: 'Jul 2023', location: 'Medical centre, 8am-5pm',
    status: 'In today', available: true, reportsTo: 'Pete Morrison', rating: 83, ref: 'OFC-016',
    speciality: 'Rehab progression · gym-based reconditioning', bio: 'Runs the reconditioning gym and late-stage return-to-play work.',
    stats: { MED: 82, REH: 88, SCR: 83, COM: 84, CAR: 85, PRE: 84 } },
  { name: 'James Doyle', initials: 'JD', role: 'Soft-Tissue Therapist', dept: 'Medical',
    quals: 'L5 Sports Massage', email: 'doyle@oakridgefc.com', phone: '07700 900017', start: 'Aug 2024', location: 'Medical centre, 9am-5pm',
    status: 'Away', available: false, reportsTo: 'Pete Morrison', rating: 80, ref: 'OFC-017',
    speciality: 'Soft-tissue therapy · recovery · matchday prep', bio: 'Soft-tissue and recovery specialist; supports pre- and post-match prep.',
    stats: { MED: 79, REH: 84, SCR: 78, COM: 82, CAR: 84, PRE: 83 } },

  // ── Recruitment ────────────────────────────────────────────────────────────
  { name: 'Steve Walsh', initials: 'SW', role: 'Chief Scout', dept: 'Recruitment',
    quals: 'UEFA B', email: 'walsh@oakridgefc.com', phone: '07700 900018', start: 'Jul 2021', location: 'Away — scouting (Belgium)',
    status: 'Away', available: false, reportsTo: 'Dave Thompson', rating: 86, ref: 'OFC-018',
    speciality: 'Talent ID · transfer targets · scouting network', bio: 'Heads the scouting network and the first-team recruitment shortlist.',
    stats: { TID: 90, NET: 89, DAT: 84, COM: 85, JUD: 91, PRE: 86 } },
  { name: 'Mark Evans', initials: 'ME', role: 'First-Team Scout', dept: 'Recruitment',
    quals: 'UEFA B', email: 'evans@oakridgefc.com', phone: '07700 900019', start: 'Aug 2022', location: 'Office — report writing',
    status: 'In today', available: true, reportsTo: 'Steve Walsh', rating: 83, ref: 'OFC-019',
    speciality: 'Live scouting · opposition reports', bio: 'First-team scout; covers live games and writes the target reports.',
    stats: { TID: 85, NET: 83, DAT: 82, COM: 83, JUD: 86, PRE: 84 } },
  { name: 'Paul Davies', initials: 'PD', role: 'Recruitment Analyst', dept: 'Recruitment',
    quals: 'MSc Performance Analysis', email: 'davies@oakridgefc.com', phone: '07700 900020', start: 'Jul 2024', location: 'Analysis suite, 9am-6pm',
    status: 'In today', available: true, reportsTo: 'Steve Walsh', rating: 82, ref: 'OFC-020',
    speciality: 'Data-led recruitment · model screening', bio: 'Data scout; screens the database and builds the analytics shortlist.',
    stats: { TID: 83, NET: 79, DAT: 91, COM: 81, JUD: 82, PRE: 85 } },

  // ── Academy ────────────────────────────────────────────────────────────────
  { name: 'Ian Brooks', initials: 'IB', role: 'Academy Director', dept: 'Academy',
    quals: 'UEFA A, PGCE', email: 'brooks@oakridgefc.com', phone: '07700 900021', start: 'Jul 2020', location: 'Academy building, 9am-6pm',
    status: 'In today', available: true, reportsTo: 'Dave Thompson', rating: 85, ref: 'OFC-021',
    speciality: 'EPPP · pathway · category status', bio: 'Owns the academy, the EPPP audit and the youth-to-first-team pathway.',
    stats: { DEV: 90, ORG: 88, EDU: 89, COM: 86, JUD: 87, PRE: 85 } },
  { name: 'Neil Sutton', initials: 'NS', role: 'Academy Lead Coach (U18)', dept: 'Academy',
    quals: 'UEFA A', email: 'sutton@oakridgefc.com', phone: '07700 900022', start: 'Aug 2022', location: 'Academy building, 12pm-8pm',
    status: 'In today', available: true, reportsTo: 'Ian Brooks', rating: 83, ref: 'OFC-022',
    speciality: 'U18 technical development · scholar programme', bio: 'U18 lead coach; runs the scholarship technical programme.',
    stats: { DEV: 88, ORG: 84, EDU: 85, COM: 84, JUD: 83, PRE: 84 } },
  { name: 'Chris Bell', initials: 'CB', role: 'Head of Academy Recruitment', dept: 'Academy',
    quals: 'FA Talent ID', email: 'bell@oakridgefc.com', phone: '07700 900023', start: 'Jul 2023', location: 'Regional — grassroots fixtures',
    status: 'Away', available: false, reportsTo: 'Ian Brooks', rating: 81, ref: 'OFC-023',
    speciality: 'Youth talent ID · grassroots network', bio: 'Heads academy recruitment across the regional grassroots network.',
    stats: { DEV: 82, ORG: 83, EDU: 80, COM: 83, JUD: 86, PRE: 82 } },

  // ── Commercial ─────────────────────────────────────────────────────────────
  { name: 'Claire Hughes', initials: 'CH', role: 'Head of Media & Communications', dept: 'Commercial',
    quals: 'BA Journalism', email: 'media@oakridgefc.com', phone: '07700 900024', start: 'Jan 2021', location: 'Oakridge HQ, 9am-6pm',
    status: 'In today', available: true, reportsTo: 'Margaret Foss', rating: 84, ref: 'OFC-024',
    speciality: 'Media · brand · matchday content', bio: 'Leads media, communications and matchday content for the club.',
    stats: { COM: 90, BRD: 88, SOC: 89, ORG: 85, CRE: 87, PRE: 86 } },
]
