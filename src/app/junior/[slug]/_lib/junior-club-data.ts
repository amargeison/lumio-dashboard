// junior-club-data.ts
//
// Club-identity demo data — coaches roster. Separated from
// junior-dashboard-data.ts because club roster is Club-Profile-scoped
// data, not dashboard data. Future expansion: any other Club-Profile
// data that doesn't belong in dashboard-data lives here.
//
// Multi-team coaches (Mark Hutchings does U11 + U16) appear once with
// ageBands: ['U11', 'U16']. The Coaches tab's per-band grouping renders
// them under each section.
//
// Greta Yardley appears twice — once as U11 Team Manager (c7) and once
// as U13 Head Coach (c9) — because she holds two distinct roles. Each
// row is a {coach, team, role} attestation, not a unique person.

export type JuniorCoach = {
  id: string
  name: string
  /** Optional asset path. Falls back to initials avatar when absent —
   *  no coach headshots exist in /public/ today. Reserved for future
   *  asset wiring. */
  photo?: string
  role: 'Head Coach' | 'Assistant Coach' | 'Team Manager'
  /** One or more age bands. Multi-team coaches list every band they
   *  cover; the Coaches tab renders them under each. */
  ageBands: string[]
  /** Team name (without the age-band prefix). Combined with each ageBand
   *  at render time as e.g. "U11 Lions". Multi-team coaches use the
   *  primary team name; the section header still uses the canonical
   *  per-band team name from JUNIOR_AGE_BANDS. */
  teamName: string
  faQualification: 'Level 1' | 'Level 2' | 'FA Youth Award' | 'In progress' | 'Volunteer'
  dbsStatus: { current: boolean; renewalDate: string }
  firstAid: { certified: boolean; renewalDate?: string }
  yearsAtClub: number
  contact: { phone?: string; email?: string }
}

export const JUNIOR_COACHES: JuniorCoach[] = [
  // ──── U7 Cubs ────
  {
    id: 'c1', name: 'J. Lawford', role: 'Head Coach',
    ageBands: ['U7'], teamName: 'Cubs',
    faQualification: 'Level 1',
    dbsStatus: { current: true, renewalDate: '12 Mar 2027' },
    firstAid: { certified: true, renewalDate: '08 Apr 2027' },
    yearsAtClub: 3,
    contact: { phone: '07712 445 109', email: 'j.lawford@oakridge-juniors.club' },
  },
  {
    id: 'c2', name: 'Holly Vance', role: 'Assistant Coach',
    ageBands: ['U7'], teamName: 'Cubs',
    faQualification: 'Volunteer',
    dbsStatus: { current: true, renewalDate: '21 Jun 2027' },
    firstAid: { certified: false },
    yearsAtClub: 1,
    contact: { phone: '07803 117 462' },
  },
  // ──── U8 Bears ────
  {
    id: 'c3', name: 'Theo Latham', role: 'Head Coach',
    ageBands: ['U8'], teamName: 'Bears',
    faQualification: 'Level 1',
    dbsStatus: { current: true, renewalDate: '04 Sep 2026' },
    firstAid: { certified: true, renewalDate: '15 Oct 2026' },
    yearsAtClub: 2,
    contact: { phone: '07729 884 015', email: 't.latham@oakridge-juniors.club' },
  },
  // ──── U9 Tigers ────
  {
    id: 'c4', name: 'Anna Pereira', role: 'Head Coach',
    ageBands: ['U9'], teamName: 'Tigers',
    faQualification: 'Level 2',
    dbsStatus: { current: true, renewalDate: '17 Nov 2027' },
    firstAid: { certified: true, renewalDate: '02 Feb 2027' },
    yearsAtClub: 4,
    contact: { phone: '07788 246 819', email: 'a.pereira@oakridge-juniors.club' },
  },
  // ──── U10 Hawks ────
  {
    id: 'c5', name: 'Olu Adesina', role: 'Head Coach',
    ageBands: ['U10'], teamName: 'Hawks',
    faQualification: 'Level 1',
    dbsStatus: { current: true, renewalDate: '29 Jul 2026' },
    firstAid: { certified: true, renewalDate: '11 Dec 2026' },
    yearsAtClub: 2,
    contact: { phone: '07712 305 884', email: 'o.adesina@oakridge-juniors.club' },
  },
  // ──── U11 Lions ────
  {
    id: 'c6', name: 'Mark Hutchings', role: 'Head Coach',
    ageBands: ['U11', 'U16'], teamName: 'Lions',  // primary team
    faQualification: 'Level 2',
    dbsStatus: { current: true, renewalDate: '14 Jun 2026' },  // matches AI Brief
    firstAid: { certified: true, renewalDate: '09 Sep 2027' },
    yearsAtClub: 9,
    contact: { phone: '07712 884 015', email: 'm.hutchings@oakridge-juniors.club' },
  },
  {
    id: 'c7', name: 'Greta Yardley', role: 'Team Manager',
    ageBands: ['U11'], teamName: 'Lions',
    faQualification: 'Volunteer',
    dbsStatus: { current: true, renewalDate: '03 Apr 2027' },
    firstAid: { certified: true, renewalDate: '22 May 2027' },
    yearsAtClub: 5,
    contact: { phone: '07749 226 410', email: 'g.yardley@oakridge-juniors.club' },
  },
  // ──── U12 Sharks ────
  {
    id: 'c8', name: 'Will Chen', role: 'Head Coach',
    ageBands: ['U12'], teamName: 'Sharks',
    faQualification: 'Level 1',
    dbsStatus: { current: true, renewalDate: '18 Jan 2027' },
    firstAid: { certified: false },
    yearsAtClub: 2,
    contact: { phone: '07788 442 901' },
  },
  // ──── U13 Falcons ────
  {
    id: 'c9', name: 'Greta Yardley', role: 'Head Coach',
    ageBands: ['U13'], teamName: 'Falcons',
    faQualification: 'Volunteer',
    dbsStatus: { current: true, renewalDate: '03 Apr 2027' },
    firstAid: { certified: true, renewalDate: '22 May 2027' },
    yearsAtClub: 5,
    contact: { phone: '07749 226 410', email: 'g.yardley@oakridge-juniors.club' },
  },
  {
    id: 'c10', name: 'Saoirse Lynch', role: 'Assistant Coach',
    ageBands: ['U13'], teamName: 'Falcons',
    faQualification: 'In progress',
    dbsStatus: { current: true, renewalDate: '07 Aug 2027' },
    firstAid: { certified: false },
    yearsAtClub: 3,
    contact: { phone: '07795 410 663', email: 's.lynch@oakridge-juniors.club' },
  },
  // ──── U14 Eagles ────
  {
    id: 'c11', name: 'Dev Patel', role: 'Head Coach',
    ageBands: ['U14'], teamName: 'Eagles',
    faQualification: 'FA Youth Award',
    dbsStatus: { current: true, renewalDate: '25 Oct 2026' },
    firstAid: { certified: true, renewalDate: '04 Nov 2026' },
    yearsAtClub: 6,
    contact: { phone: '07712 005 884', email: 'd.patel@oakridge-juniors.club' },
  },
  {
    id: 'c12', name: 'Kim Atherton', role: 'Team Manager',
    ageBands: ['U14'], teamName: 'Eagles',
    faQualification: 'Volunteer',
    dbsStatus: { current: true, renewalDate: '11 Jan 2027' },
    firstAid: { certified: true, renewalDate: '28 Mar 2027' },
    yearsAtClub: 4,
    contact: { phone: '07788 005 226' },
  },
  // ──── U16 Wolves ────
  // Mark Hutchings already attested (c6 with ageBands: ['U11','U16']) —
  // renders under U16 Wolves section automatically via ageBands match.
  {
    id: 'c13', name: 'Liam Penrose', role: 'Assistant Coach',
    ageBands: ['U16'], teamName: 'Wolves',
    faQualification: 'Level 1',
    dbsStatus: { current: true, renewalDate: '19 May 2027' },
    firstAid: { certified: true, renewalDate: '06 Jul 2027' },
    yearsAtClub: 2,
    contact: { phone: '07803 410 226' },
  },
]

// ─── Age bands for the Coaches tab grouping ──────────────────────────────

export type JuniorAgeBand = 'U7' | 'U8' | 'U9' | 'U10' | 'U11' | 'U12' | 'U13' | 'U14' | 'U16'

export const JUNIOR_AGE_BANDS: { band: JuniorAgeBand; teamName: string }[] = [
  { band: 'U7',  teamName: 'Cubs'    },
  { band: 'U8',  teamName: 'Bears'   },
  { band: 'U9',  teamName: 'Tigers'  },
  { band: 'U10', teamName: 'Hawks'   },
  { band: 'U11', teamName: 'Lions'   },
  { band: 'U12', teamName: 'Sharks'  },
  { band: 'U13', teamName: 'Falcons' },
  { band: 'U14', teamName: 'Eagles'  },
  { band: 'U16', teamName: 'Wolves'  },
]
