// ─── GOLF PROS — INVENTED DEMO ROSTERS ──────────────────────────────────────
// Static demo data for the Find a Pro view (caddies / courses / driving
// ranges). Replaces a live /api/ai/golf web-search call that was slow,
// unreliable, and burned credits. All names/brands are invented and
// brand-universe consistent.

export type Caddy = {
  id: string;
  name: string;
  homeBase: string;
  tourLevel: string;
  yearsExperience: number;
  dayRate: string;
  speciality: 'Links' | 'Heathland' | 'Parkland' | 'Desert';
  notablePlayer?: string;
  availability: string;
  contactEmail: string;
};

export const CADDIES_ROSTER: Caddy[] = [
  { id: 'c-01', name: 'Mick Sullivan',      homeBase: 'St Andrews, Scotland', tourLevel: 'DP World Tour', yearsExperience: 22, dayRate: '£450/round + bonus', speciality: 'Links',     notablePlayer: 'Worked with 3 top-30 OWGR players', availability: 'Available from May 2026',     contactEmail: 'mick.sullivan@loopcaddies.co.uk' },
  { id: 'c-02', name: 'Thomas Nyberg',      homeBase: 'Stockholm, Sweden',    tourLevel: 'DP World Tour', yearsExperience: 16, dayRate: '£400/round',          speciality: 'Parkland',                                                availability: 'Open Championship run only',    contactEmail: 'thomas@nordiccaddies.se' },
  { id: 'c-03', name: 'Callum Redfern',     homeBase: 'Sunningdale, England', tourLevel: 'DP World Tour', yearsExperience: 11, dayRate: '£325/round',          speciality: 'Heathland', notablePlayer: 'European Challenge Tour winner (2022)', availability: 'Full schedule',                 contactEmail: 'callum@redferncaddies.com' },
  { id: 'c-04', name: 'Luis Ferreira',      homeBase: 'Lisbon, Portugal',      tourLevel: 'DP World / Challenge', yearsExperience: 9,  dayRate: '£280/round',          speciality: 'Parkland',                                                availability: 'Continental European swing',     contactEmail: 'luis.ferreira@iberiancaddies.pt' },
  { id: 'c-05', name: 'Aoife Breen',        homeBase: 'Dublin, Ireland',       tourLevel: 'LET / DP World', yearsExperience: 14, dayRate: '£360/round',          speciality: 'Links',     notablePlayer: 'Solheim Cup veteran caddie (2021)',    availability: 'UK & Ireland events',           contactEmail: 'aoife@emeraldcaddies.ie' },
  { id: 'c-06', name: 'Rhett van Graan',    homeBase: 'Cape Town, South Africa', tourLevel: 'DP World / Sunshine', yearsExperience: 19, dayRate: '£395/round',          speciality: 'Parkland',                                                availability: 'Middle East + Africa swings',    contactEmail: 'rhett@capecaddieagency.co.za' },
  { id: 'c-07', name: 'Kenji Arakaki',      homeBase: 'Tokyo, Japan',          tourLevel: 'Asian / DP World', yearsExperience: 13, dayRate: '£420/round',          speciality: 'Parkland', notablePlayer: 'JGTO Player of the Year\'s bag (2023)', availability: 'Asian swing',                    contactEmail: 'kenji@nipponcaddies.jp' },
  { id: 'c-08', name: 'Darragh Quinlan',    homeBase: 'Belfast, Northern Ireland', tourLevel: 'DP World Tour', yearsExperience: 7,  dayRate: '£260/round',          speciality: 'Links',                                                   availability: 'Open-run specialist',            contactEmail: 'darragh@quinlancaddying.com' },
  { id: 'c-09', name: 'Sienna Marlow',      homeBase: 'Dubai, UAE',             tourLevel: 'DP World Tour', yearsExperience: 10, dayRate: '£350/round',          speciality: 'Desert',   notablePlayer: 'Dubai Desert Classic winner (2024)',   availability: 'Middle East winter swing',       contactEmail: 'sienna@mirageloopcaddies.ae' },
  { id: 'c-10', name: 'Beau Fitzroy',       homeBase: 'Melbourne, Australia',   tourLevel: 'DP World / PGA Tour of Aus', yearsExperience: 18, dayRate: '£380/round',          speciality: 'Links',                                                   availability: 'Australian swing + Open run',    contactEmail: 'beau@southerncrossloops.com.au' },
];

export type Course = {
  id: string;
  name: string;
  location: string;
  design: 'Championship' | 'Resort' | 'Members';
  greenFee: string;
  access: string;
  amenities: string[];
  courseRating: number;
  slopeRating: number;
  description: string;
};

export const COURSES_ROSTER: Course[] = [
  { id: 'gc-01', name: 'Ashbourne National',     location: 'Surrey, England',       design: 'Championship', greenFee: '£340 (pro rate on request)', access: 'Tour-pro rate via DP World Tour letter', amenities: ['Lumio Range bays','Short-game area','Fitness centre','Accommodation'], courseRating: 76.2, slopeRating: 142, description: 'Pro rota venue. 7,312 yards off the championship tees, aggressive Bermuda greens, full tour practice facility.' },
  { id: 'gc-02', name: 'Halden Motors Park GC',  location: 'Munich, Germany',        design: 'Championship', greenFee: '£290',                   access: 'Open to visiting pros',                  amenities: ['Putting lab','Short-game','Range','Hotel on-site'], courseRating: 74.8, slopeRating: 138, description: 'Halden Motors International Open host. Tree-lined parkland layout, subtle Bavarian terrain, long par-5s reward shaping.' },
  { id: 'gc-03', name: 'Crestwood Dunes',        location: 'East Lothian, Scotland', design: 'Championship', greenFee: '£260',                   access: 'Tee-time letter from tour office',        amenities: ['Links practice ground','Putting green','Clubhouse dining'], courseRating: 75.4, slopeRating: 140, description: 'Classic links with gorse-lined fairways. Firm-and-fast conditions, pot bunkers, true Open-prep course.' },
  { id: 'gc-04', name: 'Crown Park Estate',       location: 'Kent, England',          design: 'Championship', greenFee: '£310',                   access: 'Members + tour pros',                     amenities: ['Lumio Range indoor','Outdoor range','Fitness','Overnight lodges'], courseRating: 75.9, slopeRating: 141, description: 'Purpose-built pro venue. 2,700-yard practice circuit with every club tested, two full championship 18s.' },
  { id: 'gc-05', name: 'Meridian Sands Club',     location: 'Algarve, Portugal',      design: 'Resort',       greenFee: '£180',                   access: 'Open booking',                             amenities: ['Range','Short-game','Pool','Spa'],                     courseRating: 73.6, slopeRating: 134, description: 'Winter-base destination. Coastal parkland, forgiving off the tee, ideal for rhythm and tempo work between events.' },
  { id: 'gc-06', name: 'Northbridge Pines',       location: 'Palm Beach, Florida',    design: 'Championship', greenFee: '£410 (tour rate on request)', access: 'Pro rate via invitation',                  amenities: ['Bermuda practice tees','Full fitness','Short course','Caddyshack dining'], courseRating: 76.8, slopeRating: 144, description: 'Florida pro winter-base. Warm-weather off-season training ground — firm greens, wind exposure, tight Bermuda rough.' },
  { id: 'gc-07', name: 'Havenbrook Park GC',      location: 'Perthshire, Scotland',    design: 'Members',      greenFee: '£140',                   access: 'Letter of intro from DP World Tour',      amenities: ['Range','Putting green','Clubhouse'],                   courseRating: 72.4, slopeRating: 132, description: 'Underrated Perthshire parkland. Quiet practice venue, warm welcome for touring pros, lunch included on visit.' },
  { id: 'gc-08', name: 'Valmora Links',            location: 'Algarve, Portugal',       design: 'Championship', greenFee: '£225',                   access: 'Open booking',                             amenities: ['Range','Short-game','Performance lab','Nutritionist on-site'], courseRating: 74.1, slopeRating: 136, description: 'Purpose-built performance venue. Full swing lab, launch monitors in every range bay, on-site physio and nutrition.' },
  { id: 'gc-09', name: 'Kinrossie Grange',         location: 'Fife, Scotland',          design: 'Championship', greenFee: '£280',                   access: 'Tour-pro priority',                        amenities: ['Range','Putting complex','Hotel','Pro-shop'],          courseRating: 75.2, slopeRating: 139, description: 'Next-door to St Andrews. Pro-tested links with firm fairways; popular warm-up venue for The Open week.' },
  { id: 'gc-10', name: 'Suncrest Valley',          location: 'Arizona, USA',            design: 'Resort',       greenFee: '£220',                   access: 'Open booking',                             amenities: ['Range','Short-game','Spa','Fitness'],                  courseRating: 73.9, slopeRating: 133, description: 'Desert resort course — crushed-granite bunkers, fast greens. Winter off-season base for European pros.' },
  { id: 'gc-11', name: 'Redcliff Hollow',          location: 'County Down, N. Ireland', design: 'Championship', greenFee: '£200',                   access: 'Tour-pro rate',                            amenities: ['Range','Putting green','Open-prep short game area'],   courseRating: 75.6, slopeRating: 141, description: 'Seaside championship links. Exposed to Irish Sea winds — ideal pre-Open acclimatisation.' },
  { id: 'gc-12', name: 'Weybrook Hall Club',       location: 'Hertfordshire, England',  design: 'Members',      greenFee: '£175',                   access: 'Members + guests',                         amenities: ['Range','Putting green','Dining','Accommodation'],      courseRating: 73.1, slopeRating: 131, description: 'Parkland members course 40 min from London. Low-key, reliable practice base — quiet on weekdays.' },
];

export type Range = {
  id: string;
  name: string;
  location: string;
  facilities: string[];
  trackmanBays: number;
  coachOnSite: boolean;
  hourlyRate: string;
  access: string;
  description: string;
};

export const DRIVING_RANGES_ROSTER: Range[] = [
  { id: 'r-01', name: 'Crown Park Range',           location: 'Kent, England',          facilities: ['Covered bays','Outdoor turf','Short-game area','Putting lab'], trackmanBays: 12, coachOnSite: true,  hourlyRate: '£45/hr',  access: 'Tour-pro rate with letter', description: '12 Trackman IV bays, covered and heated. On-site putting lab with Capto/Quintic. PGA master coach (Pete Mitchum) available by appointment.' },
  { id: 'r-02', name: 'Ashbourne Performance Lab',  location: 'Surrey, England',        facilities: ['Indoor bays','Outdoor turf','Short-game','3D motion'],         trackmanBays: 8,  coachOnSite: true,  hourlyRate: '£60/hr',  access: 'By appointment',            description: 'Elite pro training facility. GEARS 3D motion capture, force plates, pressure mats. Popular with Ryder Cup pathway players.' },
  { id: 'r-03', name: 'Meridian Range — Algarve',   location: 'Albufeira, Portugal',     facilities: ['Covered bays','Grass tee','Short-game','Pool'],                trackmanBays: 6,  coachOnSite: false, hourlyRate: '€35/hr',  access: 'Open booking',              description: 'Winter-base staple. Grass teeing surface year-round, on-site short-game complex with multiple bunker types.' },
  { id: 'r-04', name: 'Havenbrook Practice Ground', location: 'Perthshire, Scotland',    facilities: ['Grass tee','Sheltered bays','Putting green'],                  trackmanBays: 4,  coachOnSite: false, hourlyRate: '£25/hr',  access: 'Open booking',              description: 'Quiet parkland range. Grass teeing 9 months a year, sheltered winter bays. No frills, good tempo-work venue.' },
  { id: 'r-05', name: 'Suncrest Sports Park',       location: 'Phoenix, Arizona',        facilities: ['Outdoor bays','Short-game','Fitness','Putting complex'],       trackmanBays: 10, coachOnSite: true,  hourlyRate: '$55/hr',  access: 'Open booking',              description: 'Winter off-season destination. Warm-weather outdoor range, elite short-game area replicating US major venues.' },
  { id: 'r-06', name: 'Northbridge Performance',    location: 'Orlando, Florida',        facilities: ['Indoor + outdoor','3D capture','Putting lab','Nutritionist'], trackmanBays: 14, coachOnSite: true,  hourlyRate: '$75/hr',  access: 'Pro-only by referral',      description: 'Full-service pro performance centre. Swing coaches, nutritionists, physios all in-house. Used by 30+ tour players.' },
  { id: 'r-07', name: 'Weybrook Hall Range',        location: 'Hertfordshire, England',  facilities: ['Covered bays','Grass tee','Short-game'],                       trackmanBays: 5,  coachOnSite: false, hourlyRate: '£30/hr',  access: 'Members + guests',           description: '40 min from London. Reliable mid-budget range, grass teeing half the year, good putting green.' },
  { id: 'r-08', name: 'Kinrossie Grange Range',     location: 'Fife, Scotland',          facilities: ['Covered bays','Grass tee','Chipping area','Bunker complex'],   trackmanBays: 6,  coachOnSite: false, hourlyRate: '£28/hr',  access: 'Open booking',              description: 'Adjacent to Kinrossie GC. Links-style practice conditions, firm ground year-round, open most of the year.' },
  { id: 'r-09', name: 'Valmora Swing Lab',          location: 'Algarve, Portugal',       facilities: ['Indoor bays','3D motion','Launch monitor','Coach'],            trackmanBays: 10, coachOnSite: true,  hourlyRate: '€55/hr',  access: 'Open booking',              description: 'Performance-first indoor facility. Full launch-monitor data, GEARS motion capture, resident swing coach Pedro Silva.' },
  { id: 'r-10', name: 'Redcliff Links Range',       location: 'County Down, N. Ireland', facilities: ['Grass tee','Sheltered bays','Short-game','Bunker complex'],    trackmanBays: 3,  coachOnSite: false, hourlyRate: '£22/hr',  access: 'Open booking',              description: 'Seaside links range. Exposed to Irish Sea winds — ideal for ball-flight control and trajectory work.' },
];
