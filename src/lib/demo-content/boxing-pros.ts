// ─── BOXING PROS — INVENTED DEMO ROSTERS ────────────────────────────────────
// Static demo data for the Find a Pro view (trainers / gyms / sparring).
// Replaces a live /api/ai/boxing web-search call that was slow, unreliable,
// and burned credits. All names/brands are invented and brand-universe
// consistent.

export type Trainer = {
  id: string;
  name: string;
  nickname?: string;
  homeGym: string;
  style: 'Technical' | 'Pressure' | 'Footwork' | 'Defensive' | 'Power';
  yearsExperience: number;
  weekRate: string;
  notableFighter?: string;
  styles: string[];
  availability: string;
  location: string;
  contact: string;
};

export const TRAINERS_ROSTER: Trainer[] = [
  { id: 't-01', name: 'Jim Bevan',          nickname: 'Iron Jim',     homeGym: 'Sheffield Amateur BC',    style: 'Technical', yearsExperience: 28, weekRate: '£1,800/wk',   notableFighter: 'Marcus Cole (Heavyweight)', styles: ['Technical','Footwork'],      availability: 'Current camps booked — waitlist Q3 2026', location: 'Sheffield, England',    contact: 'jim@ironbevanboxing.co.uk' },
  { id: 't-02', name: 'Darnell Hughes',     nickname: 'Tank',         homeGym: 'Iron Works Gym',           style: 'Pressure',  yearsExperience: 18, weekRate: '£1,400/wk',   notableFighter: '3× British champion stable',  styles: ['Pressure','Power'],          availability: 'Open to new fighters from May', location: 'Birmingham, England',  contact: 'darnell@ironworksbham.com' },
  { id: 't-03', name: 'Tyrone Baker',       nickname: 'The Architect',homeGym: 'Baker Academy',            style: 'Defensive', yearsExperience: 22, weekRate: '£1,600/wk',   notableFighter: 'WBO Super-Middleweight contender', styles: ['Defensive','Counter-punching'], availability: 'Waitlist',                           location: 'London, England',      contact: 'ty@bakeracademyboxing.com' },
  { id: 't-04', name: 'Rafael Ortega',      nickname: 'El Profesor',  homeGym: 'Casa Ortega',               style: 'Technical', yearsExperience: 25, weekRate: '€1,500/wk',   notableFighter: 'WBA Featherweight champ (2022)', styles: ['Technical','Cuban-school'], availability: 'Open booking',                        location: 'Havana, Cuba',         contact: 'rafael@casa-ortega.cu' },
  { id: 't-05', name: 'Stephen Forrest',    nickname: 'Forrest',      homeGym: 'Forrest Boxing Academy',    style: 'Footwork',  yearsExperience: 16, weekRate: '£1,300/wk',                                           styles: ['Footwork','Ring IQ'],      availability: 'Open — taking 2 new fighters',        location: 'Manchester, England',  contact: 'stephen@forrestboxing.uk' },
  { id: 't-06', name: 'Kelani Ofori',                                  homeGym: 'Lion Boxing Club',          style: 'Pressure',  yearsExperience: 14, weekRate: '£1,100/wk',   notableFighter: 'Commonwealth Lightweight champion', styles: ['Pressure','Body-work'],     availability: 'Part-time — camps only',              location: 'Accra, Ghana',         contact: 'kelani@lionbxaccra.gh' },
  { id: 't-07', name: 'Mikhail Volkov',     nickname: 'The Bear',     homeGym: 'Volkov Gym',                 style: 'Technical', yearsExperience: 30, weekRate: '£2,200/wk',   notableFighter: 'Former Olympic coach',              styles: ['Technical','Olympic-style'], availability: 'Waitlist — priority to fighters with Olympic pedigree', location: 'Riga, Latvia',          contact: 'mikhail@volkovgym.lv' },
  { id: 't-08', name: 'Darnell Dupree',     nickname: 'Double-D',     homeGym: 'Dupree Boxing',              style: 'Power',      yearsExperience: 20, weekRate: '$2,000/wk',   notableFighter: 'WBC Cruiserweight (2023)',          styles: ['Power','Inside-fighting'],  availability: 'Selective — takes one fighter per camp', location: 'Las Vegas, USA',       contact: 'dd@dupreeboxing.com' },
  { id: 't-09', name: 'Yoshi Tanaka',                                  homeGym: 'Tanaka Boxing Dojo',         style: 'Defensive', yearsExperience: 24, weekRate: '£1,700/wk',                                            styles: ['Defensive','Counter-punching','Japanese school'], availability: 'Open booking',                        location: 'Osaka, Japan',          contact: 'yoshi@tanakadojo.jp' },
  { id: 't-10', name: 'Enzo Marchetti',                                homeGym: 'Marchetti Fight Club',       style: 'Footwork',  yearsExperience: 19, weekRate: '€1,400/wk',   notableFighter: 'European Welterweight champion',     styles: ['Footwork','Italian-school','Fluidity'], availability: 'Open — Rome base',                    location: 'Rome, Italy',           contact: 'enzo@marchettifc.it' },
];

export type Gym = {
  id: string;
  name: string;
  location: string;
  facilities: string[];
  trainersInHouse: number;
  weeklyRate: string;
  access: 'Open' | 'Invite-only' | 'Members';
  description: string;
  notableFighters: string[];
};

export const GYMS_ROSTER: Gym[] = [
  { id: 'g-01', name: 'Sheffield Amateur BC',  location: 'Sheffield, England',    facilities: ['4 full rings','Heavy bag room (18)','Strength room','Altitude chamber'],       trainersInHouse: 6, weeklyRate: '£400/wk',  access: 'Members',      description: 'Home gym of Jim Bevan. Full Olympic-size altitude chamber, on-site physio. Pro camp rates negotiable.', notableFighters: ['Marcus Cole', 'Yusuf Çelik'] },
  { id: 'g-02', name: 'Iron Works Birmingham', location: 'Birmingham, England',   facilities: ['3 rings','Heavy bags','Cardio suite','Recovery room'],                         trainersInHouse: 4, weeklyRate: '£280/wk',  access: 'Open',         description: 'Walk-in access for visiting pros. Full sparring rotation Tuesday/Thursday/Saturday. Cutman and cornerman network on hand.', notableFighters: ['Callum Brennan', 'Kallum Wright'] },
  { id: 'g-03', name: 'Baker Academy London',  location: 'London, England',        facilities: ['2 rings','Heavy bags','Plyometric pit','Ring doctor on-site'],                trainersInHouse: 5, weeklyRate: '£520/wk',  access: 'Invite-only',  description: 'Elite London pro stable. Invitation only. Resident doctor, nutritionist, sports psychologist. Camps booked 12 months out.', notableFighters: ['Trevon Walsh', 'Darnell "Tank" Hughes (sparring)'] },
  { id: 'g-04', name: 'Casa Ortega',            location: 'Havana, Cuba',           facilities: ['2 rings','Outdoor roadwork loop','Beach sand pit','Old-school heavy bags'],    trainersInHouse: 3, weeklyRate: '$600/wk',  access: 'Open',         description: 'Traditional Cuban boxing academy. Rafael Ortega\'s life\'s work — stripped-back training, emphasis on fundamentals. Boxing heritage experience.', notableFighters: ['Miguel Varela', 'Domingo Aguilar'] },
  { id: 'g-05', name: 'Volkov Gym Riga',        location: 'Riga, Latvia',           facilities: ['3 rings','Full weightroom','Sauna','Roadwork circuit'],                         trainersInHouse: 4, weeklyRate: '€700/wk',  access: 'Invite-only',  description: 'Eastern European pro base. Mikhail Volkov runs old-school camps — 6am roadwork, two sessions a day, no shortcuts.', notableFighters: ['Jurgis Balodis', 'Hone Tahere (camp-only)'] },
  { id: 'g-06', name: 'Dupree Boxing Vegas',    location: 'Las Vegas, USA',         facilities: ['4 rings','Recovery centre','Altitude chamber','In-house sparring'],             trainersInHouse: 7, weeklyRate: '$1,200/wk', access: 'Open',         description: 'Vegas pro hub — 50+ fighters in camp at peak. On-site sparring rotation, recovery, cutman network. Walk-in welcome with referral.', notableFighters: ['Darnell Dupree fighters', 'Regional US pros'] },
  { id: 'g-07', name: 'Lion Boxing Club',        location: 'Accra, Ghana',           facilities: ['2 rings','Heavy bags','Outdoor track','Ice bath'],                              trainersInHouse: 3, weeklyRate: '£180/wk',  access: 'Open',         description: 'West African boxing heritage — generations of Commonwealth champions trained here. Low-budget, high-work-rate environment.', notableFighters: ['Kelani Ofori stable', 'Commonwealth-level pros'] },
  { id: 'g-08', name: 'Marchetti Fight Club',   location: 'Rome, Italy',             facilities: ['2 rings','Modern weights','Recovery pool','Nutritionist on-site'],             trainersInHouse: 4, weeklyRate: '€550/wk',  access: 'Open',         description: 'Italian-school boxing — fluidity, footwork, tactical emphasis. Mediterranean base popular with European pros for winter camps.', notableFighters: ['Enzo Marchetti stable', 'European champions'] },
  { id: 'g-09', name: 'Tanaka Boxing Dojo',      location: 'Osaka, Japan',            facilities: ['2 rings','Traditional weights','Japanese-style roadwork','Sauna'],            trainersInHouse: 2, weeklyRate: '£340/wk',  access: 'Members',      description: 'Strict, disciplined, traditional Japanese boxing environment. Fighters who train here describe it as "camp for the mind as much as the body."', notableFighters: ['Japanese domestic champions', 'Asian Games medallists'] },
  { id: 'g-10', name: 'Forrest Boxing Academy', location: 'Manchester, England',     facilities: ['3 rings','Heavy bag hall','Sparring roster','Recovery'],                        trainersInHouse: 5, weeklyRate: '£320/wk',  access: 'Open',         description: 'Manchester pro base. Active sparring roster Monday/Wednesday/Friday, strong cornerman network, affordable pro rates.', notableFighters: ['British + European domestic pros', 'Stephen Forrest stable'] },
];

export type SparringPartner = {
  id: string;
  name: string;
  weightClass: string;
  record: string;
  style: string;
  sessionRate: string;
  location: string;
  availability: string[];
  bestShot: string;
  contact: string;
};

export const SPARRING_ROSTER: SparringPartner[] = [
  { id: 's-01', name: 'Darnell "Tank" Hughes',   weightClass: 'Heavyweight',         record: '14-2 (11 KO)',  style: 'Pressure fighter',                 sessionRate: '£350/session', location: 'London, England',       availability: ['Tue','Thu','Sat'],          bestShot: 'Overhand right',                 contact: 'darnell.hughes@tanksparring.com' },
  { id: 's-02', name: 'Wesley Dunne',             weightClass: 'Heavyweight / Cruiser', record: '5-7 (2 KO)',  style: 'Journeyman — tough, rangy',        sessionRate: '£180/session', location: 'Liverpool, England',    availability: ['Mon','Wed','Fri','Sat'],   bestShot: 'Jab and move',                   contact: 'wes@dunnesparring.co.uk' },
  { id: 's-03', name: 'Maxim Brodski',            weightClass: 'Super-Middleweight',   record: '8-1-1 (5 KO)',  style: 'Counter-puncher — Russian style', sessionRate: '€240/session', location: 'Gdańsk, Poland',        availability: ['Tue','Wed','Thu'],          bestShot: 'Right cross off the check hook', contact: 'maxim@brodskibox.pl' },
  { id: 's-04', name: 'Terence Ayebale',          weightClass: 'Light-Heavyweight',     record: '11-0 (7 KO)',   style: 'Technical southpaw',              sessionRate: '£280/session', location: 'London, England',       availability: ['Mon','Wed','Fri'],          bestShot: 'Straight left to the body',      contact: 'terence@ayebaleboxing.com' },
  { id: 's-05', name: 'Kenji Iwakami',             weightClass: 'Middleweight',           record: '17-3 (10 KO)',  style: 'Volume / pressure',               sessionRate: '£220/session', location: 'Osaka, Japan',           availability: ['Mon','Wed','Fri'],          bestShot: 'Left hook to the body',          contact: 'kenji@iwakamibox.jp' },
  { id: 's-06', name: 'Rico Aguilar',              weightClass: 'Super-Lightweight',      record: '19-2 (12 KO)',  style: 'Cuban counter-puncher',          sessionRate: '$320/session', location: 'Miami, Florida',         availability: ['Tue','Thu','Fri','Sat'],   bestShot: 'Left-hand lead',                 contact: 'rico@aguilarsparring.com' },
  { id: 's-07', name: 'Fintan Harrigan',           weightClass: 'Welterweight',           record: '12-0 (6 KO)',  style: 'Irish orthodox — jab-heavy',      sessionRate: '€200/session', location: 'Dublin, Ireland',        availability: ['Wed','Thu','Sat'],          bestShot: 'Doubled jab into straight right', contact: 'fintan@emeraldsparring.ie' },
  { id: 's-08', name: 'Malik Osei',                weightClass: 'Featherweight',           record: '9-1 (3 KO)',   style: 'Slick, movement-based',           sessionRate: '£180/session', location: 'Accra, Ghana',           availability: ['Tue','Wed','Thu','Fri'],   bestShot: 'Lead uppercut',                  contact: 'malik@oseibx.gh' },
  { id: 's-09', name: 'Bradley Lenehan',           weightClass: 'Heavyweight',             record: '22-4 (14 KO)', style: 'Veteran — physical, spoiling',    sessionRate: '£400/session', location: 'Sheffield, England',     availability: ['Mon','Thu','Sat'],          bestShot: 'Clinch, roughhouse, pressure',   contact: 'bradley@lenehanbox.co.uk' },
  { id: 's-10', name: 'Dieter Vogel',              weightClass: 'Cruiserweight',            record: '14-2-1 (9 KO)',style: 'European orthodox',               sessionRate: '€260/session', location: 'Hamburg, Germany',      availability: ['Mon','Tue','Wed','Thu'],   bestShot: '1-2-hook combination',           contact: 'dieter@vogelsparring.de' },
];
