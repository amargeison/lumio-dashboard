// src/app/womens/[slug]/_lib/womens-staff-data.ts
//
// Canonical CLUB STAFF roster for Oakridge Women FC (demo). Single source of
// truth shared by the Staff Directory (page.tsx) and the dashboard Staff tabs
// (WomensStaffTabs: Today / Org Chart / Team Info). Demo data only.
//
// reportsTo holds the manager's NAME, or 'Board' for the three people who
// report to the board (Director, Head Coach, Director of Football). The org
// chart derives its hierarchy + connector lines from these edges.

export type StaffDept =
  | 'Executive' | 'Coaching' | 'DoF' | 'Performance'
  | 'Medical' | 'Welfare' | 'Operations' | 'Commercial' | 'Community'

// Department colour palette (shared with the dashboard Staff tabs).
export const DEPT_COLOR: Record<StaffDept, string> = {
  Executive:   '#8B5CF6', // violet
  Coaching:    '#BE185D', // pink-deep (portal accent)
  DoF:         '#0EA5E9', // sky
  Performance: '#22C55E', // green
  Medical:     '#DC2626', // red
  Welfare:     '#EF4444', // red-light
  Operations:  '#F97316', // orange
  Commercial:  '#F59E0B', // amber
  Community:   '#10B981', // emerald
}

export type StaffMember = {
  name: string
  initials: string
  role: string
  dept: StaffDept
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

export const WOMENS_STAFF: StaffMember[] = [
  { name: 'Kate Brennan', initials: 'KB', role: 'Club Director', dept: 'Executive',
    email: 'k.brennan@oakridge.com', phone: '01632 960001', start: 'Jan 2020', location: 'Oakridge HQ, 9am-6pm',
    status: 'In today', available: true, reportsTo: 'Board', rating: 93, ref: 'WOM-001',
    speciality: 'Club strategy · board governance · FSR oversight', bio: 'Founder-era director; oversees the business side of the club and chairs the senior leadership group.',
    stats: { LEAD: 94, STR: 93, FIN: 90, GOV: 92, COM: 89, VIS: 91 } },
  { name: 'Sarah Frost', initials: 'SF', role: 'Head Coach', dept: 'Coaching',
    email: 's.frost@oakridge.com', phone: '01632 960002', start: 'Aug 2022', location: 'Oakridge Training Centre, 9am-6pm',
    status: 'In today', available: true, reportsTo: 'Board', rating: 92, ref: 'WOM-002',
    speciality: 'Tactical structure · matchday motivation', bio: 'Leads first-team coaching and selection. UEFA Pro Licence; third season in charge.',
    stats: { TAC: 92, MOT: 95, STR: 88, DEV: 87, COM: 90, PRE: 89 } },
  { name: 'Helen Voss', initials: 'HV', role: 'Director of Football', dept: 'DoF',
    email: 'h.voss@oakridge.com', phone: '01632 960003', start: 'Jul 2023', location: 'Scouting day — away Thu',
    status: 'Away', available: false, reportsTo: 'Board', rating: 89, ref: 'WOM-003',
    speciality: 'Recruitment strategy · WSL 2 squad model', bio: 'Owns football operations, recruitment and the performance/medical/welfare reporting lines.',
    stats: { STR: 91, NEG: 88, NET: 90, VIS: 89, DEC: 86, COM: 87 } },
  { name: 'Lauren Page', initials: 'LP', role: 'Assistant Head Coach', dept: 'Coaching',
    email: 'l.page@oakridge.com', phone: '01632 960004', start: 'Jun 2023', location: 'Oakridge Training Centre, 9am-6pm',
    status: 'In today', available: true, reportsTo: 'Sarah Frost', rating: 88, ref: 'WOM-004',
    speciality: 'Set-piece delivery · opposition analysis', bio: 'Right hand to the Head Coach; runs the weekly training plan and the academy coaching bridge.',
    stats: { TAC: 89, MOT: 86, STR: 87, DEV: 88, COM: 88, PRE: 90 } },
  { name: 'Ben Carter', initials: 'BC', role: 'Goalkeeping Coach', dept: 'Coaching',
    email: 'b.carter@oakridge.com', phone: '01632 960005', start: 'Aug 2023', location: 'Oakridge Training Centre, 8am-4pm',
    status: 'In today', available: true, reportsTo: 'Sarah Frost', rating: 87, ref: 'WOM-005',
    speciality: 'GK distribution · shot-stopping · set positioning', bio: 'Develops the senior and academy keepers. UEFA GK B.',
    stats: { TAC: 85, MOT: 84, STR: 88, DEV: 89, COM: 85, PRE: 88 } },
  { name: 'Ruth Ellison', initials: 'RE', role: 'First-Team Coach', dept: 'Coaching',
    email: 'r.ellison@oakridge.com', phone: '01632 960006', start: 'Jul 2024', location: 'Oakridge Training Centre, 9am-5pm',
    status: 'In today', available: true, reportsTo: 'Sarah Frost', rating: 86, ref: 'WOM-006',
    speciality: 'Pressing structure · transition moments', bio: 'Sessions lead for out-of-possession work and individual unit coaching.',
    stats: { TAC: 87, MOT: 85, STR: 86, DEV: 85, COM: 86, PRE: 86 } },
  { name: 'Holly Dean', initials: 'HD', role: 'Academy Coach (U21)', dept: 'Coaching',
    email: 'h.dean@oakridge.com', phone: '01632 960007', start: 'Aug 2024', location: 'Oakridge Training Centre, 12pm-8pm',
    status: 'In today', available: true, reportsTo: 'Lauren Page', rating: 84, ref: 'WOM-007',
    speciality: 'Pathway development · U21 to first-team bridge', bio: 'Leads the U21 development squad and manages dual-registration loans.',
    stats: { TAC: 84, MOT: 86, STR: 83, DEV: 89, COM: 85, PRE: 84 } },
  { name: 'Maya Osborne', initials: 'MO', role: 'Academy Coach (U18)', dept: 'Coaching',
    email: 'm.osborne@oakridge.com', phone: '01632 960008', start: 'Aug 2024', location: 'Oakridge Training Centre, 12pm-8pm',
    status: 'In today', available: true, reportsTo: 'Lauren Page', rating: 83, ref: 'WOM-008',
    speciality: 'Youth technical development · scholar programme', bio: "U18 lead coach; runs the FA Girls' CoE technical programme.",
    stats: { TAC: 83, MOT: 85, STR: 82, DEV: 88, COM: 84, PRE: 83 } },
  { name: 'Marcus Chen', initials: 'MC', role: 'Head of Performance', dept: 'Performance',
    email: 'm.chen@oakridge.com', phone: '01632 960009', start: 'Jul 2022', location: 'Oakridge Gym, 7am-4pm',
    status: 'In today', available: true, reportsTo: 'Helen Voss', rating: 90, ref: 'WOM-009',
    speciality: 'Cycle-aware load · ACL prehab integration', bio: 'Heads strength & conditioning and the wider performance department.',
    stats: { STR: 89, COND: 92, REC: 88, GPS: 91, PRE: 87, SPT: 90 } },
  { name: 'James Kerr', initials: 'JK', role: 'Performance Analyst', dept: 'Performance',
    email: 'j.kerr@oakridge.com', phone: '01632 960010', start: 'Sep 2023', location: 'Oakridge Analysis Suite, 9am-6pm',
    status: 'In today', available: true, reportsTo: 'Marcus Chen', rating: 88, ref: 'WOM-010',
    speciality: 'GPS load + cycle-aware modelling', bio: 'Owns GPS/ACWR reporting and the daily ACL composite. Bridges performance and medical data.',
    stats: { LOA: 90, GPS: 92, ACL: 87, CYC: 86, CON: 88, COM: 85 } },
  { name: 'Priya Shah', initials: 'PS', role: 'Sports Scientist (GPS Lead)', dept: 'Performance',
    email: 'p.shah@oakridge.com', phone: '01632 960011', start: 'Aug 2024', location: 'Oakridge Gym, 8am-5pm',
    status: 'In today', available: true, reportsTo: 'Marcus Chen', rating: 87, ref: 'WOM-011',
    speciality: 'GPS device management · readiness monitoring', bio: 'Runs the JOHAN GPS programme and morning readiness screening.',
    stats: { STR: 85, COND: 88, REC: 87, GPS: 92, PRE: 86, SPT: 87 } },
  { name: 'Tom Reed', initials: 'TR', role: 'Video Analyst', dept: 'Performance',
    email: 't.reed@oakridge.com', phone: '01632 960012', start: 'Jan 2024', location: 'Away — opposition scouting',
    status: 'Away', available: false, reportsTo: 'Marcus Chen', rating: 85, ref: 'WOM-012',
    speciality: 'Opposition video · clip packages', bio: 'Builds matchday opposition packs and individual player clip reviews.',
    stats: { LOA: 82, GPS: 84, ACL: 80, CYC: 80, CON: 86, COM: 85 } },
  { name: 'Dr Anna Reid', initials: 'AR', role: 'Club Doctor', dept: 'Medical',
    email: 'a.reid@oakridge.com', phone: '01632 960013', start: 'Sep 2021', location: 'Oakridge Medical Centre, 8am-5pm',
    status: 'In today', available: true, reportsTo: 'Helen Voss', rating: 94, ref: 'WOM-013',
    speciality: "Women's clinical care · postpartum RTP", bio: 'Senior clinician; owns medical governance, cycle/medical data stewardship and RTP sign-off.',
    stats: { DIA: 94, TRT: 93, REC: 90, WMN: 95, CON: 92, SPT: 88 } },
  { name: 'Mel Hooper', initials: 'MH', role: 'Head Physio', dept: 'Medical',
    email: 'm.hooper@oakridge.com', phone: '01632 960014', start: 'Mar 2021', location: 'Oakridge Medical Centre, 8am-6pm',
    status: 'In today', available: true, reportsTo: 'Dr Anna Reid', rating: 91, ref: 'WOM-014',
    speciality: 'Rehab programming · ACL return-to-play', bio: 'Leads the physiotherapy team and the injured-player rehab caseload.',
    stats: { DIA: 90, TRT: 92, REC: 93, WMN: 89, CON: 90, SPT: 89 } },
  { name: 'Sofia Marsh', initials: 'SM', role: 'Physiotherapist', dept: 'Medical',
    email: 's.marsh@oakridge.com', phone: '01632 960015', start: 'Aug 2023', location: 'Oakridge Medical Centre, 8am-5pm',
    status: 'In today', available: true, reportsTo: 'Mel Hooper', rating: 86, ref: 'WOM-015',
    speciality: 'Soft-tissue · matchday pitchside', bio: 'Day-to-day treatment and matchday pitchside cover.',
    stats: { DIA: 85, TRT: 88, REC: 87, WMN: 85, CON: 86, SPT: 87 } },
  { name: 'Grace Owusu', initials: 'GO', role: 'Sports Therapist', dept: 'Medical',
    email: 'g.owusu@oakridge.com', phone: '01632 960016', start: 'Jul 2024', location: 'Oakridge Medical Centre, 9am-5pm',
    status: 'In today', available: true, reportsTo: 'Mel Hooper', rating: 85, ref: 'WOM-016',
    speciality: 'Massage · recovery · prehab support', bio: 'Recovery and prehab support; assists the ACL prevention programme.',
    stats: { DIA: 83, TRT: 86, REC: 89, WMN: 84, CON: 85, SPT: 88 } },
  { name: 'Nina Walsh', initials: 'NW', role: 'Welfare Lead', dept: 'Welfare',
    email: 'n.walsh@oakridge.com', phone: '01632 960017', start: 'Jan 2024', location: 'Oakridge HQ, 9am-5pm',
    status: 'In today', available: true, reportsTo: 'Helen Voss', rating: 91, ref: 'WOM-017',
    speciality: 'Carney-standards safeguarding · player-led support', bio: 'Independent welfare lead; owns safeguarding, cycle/welfare consent and the Carney return.',
    stats: { SAF: 93, PSY: 88, CYC: 92, RTP: 90, COM: 91, CON: 89 } },
  { name: 'Dr Alison Carey', initials: 'AC', role: 'Performance Psychologist', dept: 'Welfare',
    email: 'a.carey@oakridge.com', phone: '01632 960018', start: 'Sep 2024', location: 'Oakridge HQ, by appointment',
    status: 'In today', available: true, reportsTo: 'Nina Walsh', rating: 90, ref: 'WOM-018',
    speciality: 'Performance psychology · pre-match anxiety support', bio: 'Confidential 1:1 psychology support and the mental-health pathway.',
    stats: { SAF: 88, PSY: 94, CYC: 84, RTP: 86, COM: 90, CON: 92 } },
  { name: 'Megan Doyle', initials: 'MD', role: 'Player Care & Safeguarding Officer', dept: 'Welfare',
    email: 'm.doyle@oakridge.com', phone: '01632 960019', start: 'Aug 2023', location: 'Oakridge HQ, 9am-5pm',
    status: 'In today', available: true, reportsTo: 'Nina Walsh', rating: 86, ref: 'WOM-019',
    speciality: 'Player care · education · transition support', bio: 'Day-to-day player care, education liaison and the DBS/safeguarding register.',
    stats: { SAF: 90, PSY: 85, CYC: 83, RTP: 85, COM: 88, CON: 87 } },
  { name: 'Mark Walker', initials: 'MW', role: 'Head of Operations', dept: 'Operations',
    email: 'm.walker@oakridge.com', phone: '01632 960020', start: 'Jun 2020', location: 'Oakridge HQ, 8am-6pm',
    status: 'In today', available: true, reportsTo: 'Kate Brennan', rating: 88, ref: 'WOM-020',
    speciality: 'Matchday ops · facilities · travel logistics', bio: 'Runs matchday operations, facilities, travel and the club licensing evidence vault.',
    stats: { ORG: 91, LOG: 90, BUD: 86, COM: 88, REL: 87, PRE: 89 } },
  { name: 'Greg Pollard', initials: 'GP', role: 'Kit Manager', dept: 'Operations',
    email: 'g.pollard@oakridge.com', phone: '01632 960021', start: 'May 2019', location: 'Oakridge Training Centre, 7am-5pm',
    status: 'In today', available: true, reportsTo: 'Mark Walker', rating: 84, ref: 'WOM-021',
    speciality: 'Kit operations · period-proofing policy', bio: 'Owns home/away kit, laundry and the period-proofed shorts policy.',
    stats: { ORG: 88, LOG: 89, BUD: 83, COM: 82, REL: 85, PRE: 86 } },
  { name: 'Jordan Clarke', initials: 'JC', role: 'Commercial Director', dept: 'Commercial',
    email: 'j.clarke@oakridge.com', phone: '01632 960022', start: 'Jun 2023', location: 'Away — sponsor meetings London',
    status: 'Away', available: false, reportsTo: 'Kate Brennan', rating: 89, ref: 'WOM-022',
    speciality: 'Sponsorship · partnerships · matchday revenue', bio: 'Leads sponsorship, partnerships and commercial revenue against the FSR model.',
    stats: { NEG: 91, NET: 90, BRD: 88, REV: 90, REL: 89, VIS: 87 } },
  { name: 'Sasha Lin', initials: 'SL', role: 'Head of Community', dept: 'Community',
    email: 's.lin@oakridge.com', phone: '01632 960023', start: 'Sep 2022', location: 'Oakridge HQ + community sites',
    status: 'In today', available: true, reportsTo: 'Kate Brennan', rating: 86, ref: 'WOM-023',
    speciality: 'Fan engagement · grassroots · CoE outreach', bio: 'Runs community programmes, the fan hub and academy/grassroots outreach.',
    stats: { ENG: 90, OUT: 89, NET: 87, COM: 88, REL: 89, VIS: 86 } },
]
