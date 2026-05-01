'use client'

import { useState } from 'react'
import {
  Shield, BookOpen, Scale, Heart, TrendingUp, FileText,
  ExternalLink, Upload, ChevronDown, ChevronRight,
  Users, MapPin, Stethoscope, Activity, Briefcase,
  GraduationCap, Baby, Brain, Flower2, Crown, Calendar,
} from 'lucide-react'

const C = {
  bg: '#07080F', panel: '#111318', panel2: '#0D0F14',
  border: '#1F2937', borderHi: '#374151',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280',
  good: '#22C55E', warn: '#F59E0B', bad: '#EF4444', accent: '#BE185D',
  goodDim: 'rgba(34,197,94,0.15)', warnDim: 'rgba(245,158,11,0.15)', badDim: 'rgba(239,68,68,0.15)',
  accentDim: 'rgba(190,24,93,0.15)',
}

type Rag = 'green' | 'amber' | 'red' | 'unassessed'
type Tab = 'carney' | 'wpll' | 'equal' | 'welfare' | 'investment' | 'resources'
type EqualAxis = 'gender' | 'tier'

const ragColor = (r: Rag) => r === 'red' ? C.bad : r === 'amber' ? C.warn : r === 'unassessed' ? C.text4 : C.good
const ragLabel = (r: Rag) => r === 'green' ? 'COMPLIANT' : r === 'amber' ? 'PARTIAL' : r === 'red' ? 'BELOW STANDARD' : 'NOT YET ASSESSED'

// ─── Carney Review (10 recommendations, verbatim titles + paraphrased explainers) ─

interface SubRec {
  id: string          // e.g. "3.1"
  text: string        // verbatim sub-recommendation
  status: Rag
  demo: string        // club's current position
  metrics?: string[]  // optional inline metrics for traceability
}

interface CarneyRec {
  n: number
  title: string                    // verbatim
  explainer: string                // paraphrased
  status: Rag                      // visual aggregate badge
  onTrack: boolean                 // headline classification (green-equivalent)
  position: string
  reviewed: string
  evidence: string[]
  actions: { txt: string; done: boolean }[]
  subRecommendations?: SubRec[]
  talkingPoint?: string
  govActionNote?: string
}

const CARNEY: CarneyRec[] = [
  {
    n: 1,
    title: 'The new entity tasked with running elite women\'s football should not settle for anything less than world-leading standards for players, fans, staff, and everybody involved in the women\'s game.',
    explainer: 'Women\'s Professional Leagues Limited (WPLL — the entity that took over running the WSL and Championship from the FA in the 2024-25 season) must build the women\'s game on five foundational principles spanning financial sustainability, regulation, infrastructure, investment, and governance.',
    status: 'amber',
    onTrack: true,
    position: 'WPLL launched 2024-25 with Oakridge as a constituent member. Four of five foundational principles in place; infrastructure principle phasing in licence-criteria uplifts.',
    reviewed: '12 Mar 2026',
    evidence: ['WPLL membership confirmation (Aug 2024)', 'WPLL constituency vote record', 'WPLL operating standards subscription', 'Strategic partner commitment letter'],
    actions: [
      { txt: 'Annual WPLL constituency review attendance', done: true },
      { txt: 'Track strategic partner Year 1 review outputs', done: false },
    ],
    subRecommendations: [
      { id: 'P1', text: 'The ultimate objective of women\'s professional football should be a financially sustainable, competitively compelling game.', status: 'green',
        demo: 'WPLL launched 2024-25; financial regulation framework agreed at first PWG review.' },
      { id: 'P2', text: 'Financial regulation should be stringently deployed by NewCo in order to ensure the financial issues present within other elite sports are not mirrored.', status: 'green',
        demo: 'Self-regulation framework adopted; debt, liquidity, cost controls all monitored.' },
      { id: 'P3', text: 'NewCo and clubs must provide the necessary professional infrastructure for staff and players to compete.', status: 'amber',
        demo: 'Phased licence-criteria uplifts in progress; not all 2027-28 targets yet met.' },
      { id: 'P4', text: 'In order to provide the necessary infrastructure and product, clubs, the FA and NewCo must unlock additional investment and funding streams.', status: 'green',
        demo: 'FA Cup prize fund increased to £6m total; strategic partner discussions ongoing.' },
      { id: 'P5', text: 'The FA should develop governance structures that allow NewCo to embrace independent decision making.', status: 'green',
        demo: 'FA golden share structure in place; one-board principle adopted.' },
    ],
  },
  {
    n: 2,
    title: 'The FA needs to fix the talent pathway in order to create generation after generation of world-beating Lionesses.',
    explainer: 'The girls\' and women\'s domestic talent pathway is under-resourced relative to the boys\' equivalent. The Carney Review calls for a strategic partner to invest in the pipeline, plus short-term flexibility on international recruitment via lowered GBE thresholds while the domestic pathway catches up.',
    status: 'amber',
    onTrack: false,
    position: 'Interim partner agreed for academy compensation. Strategic partner decision and full pathway funding pending WPLL Year 1 review.',
    reviewed: '04 Apr 2026',
    evidence: ['Academy compensation interim agreement', 'FA Technical Consultation Group GBE paper', 'Pathway partnerships register Q1 2026'],
    actions: [
      { txt: 'Engage on FA strategic partner consultation', done: true },
      { txt: 'Submit pathway funding business case Y2', done: false },
    ],
    subRecommendations: [
      { id: '2.1', text: 'The FA should choose a strategic partner willing to invest in building a sustainable pipeline of domestic talent.', status: 'amber',
        demo: 'Interim partner agreed for academy compensation structure; full strategic partner decision pending WPLL Year 1 review.' },
      { id: '2.2', text: 'Clubs should be allowed access to an increased pool of international talent while the domestic pathway is fixed.', status: 'green',
        demo: 'FA Technical Consultation Group for GBE established; lowered threshold under 3-year trial.' },
    ],
  },
  {
    n: 3,
    title: 'Both the Women\'s Super League and Women\'s Championship should become fully professional environments designed to attract, develop and sustain the best playing talent in the world.',
    explainer: 'This is the operational heart of the Carney Review. Seven sub-recommendations cover the gulf between WSL and Championship standards, medical and mental health provision, training facilities, parental package, union representation, duty of care, and career transition. Each is treated separately because each has its own implementation timeline and measurement criteria.',
    status: 'amber',
    onTrack: false,
    position: 'Three sub-recs compliant (3.3 facilities, 3.5 union, 3.6 duty of care). Four in active remediation (3.1 contact-time gulf, 3.2 medical/mental, 3.4 parental, 3.7 career transition).',
    reviewed: '10 Apr 2026',
    evidence: ['2023-24 FA training facility licence self-assessment', 'PFA partnership agreement', 'Independent welfare officer appointment letter', 'Career transition scoping doc Q1 2026'],
    actions: [
      { txt: 'Reach 20 hrs/week contact time by 2027-28', done: false },
      { txt: 'Confirm 6-month post-retirement medical access policy', done: false },
      { txt: 'Mandate formal career transition programme', done: false },
    ],
    subRecommendations: [
      { id: '3.1', text: 'Addressing the gulf in minimum operating standards between tiers 1 and 2.', status: 'amber',
        demo: 'Championship contact time progressing toward 20 hrs/week target by 2027-28 (currently 14 hrs at this club; up from FA baseline 8 hrs). WSL salary floor active from 2025-26.',
        metrics: ['Contact time current: 14 hrs/wk', 'Contact time target: 20 hrs/wk by 2027-28', 'WSL salary floor: active 2025-26'] },
      { id: '3.2', text: 'Providing gold standard physical and mental health provision.', status: 'amber',
        demo: 'Sport/exercise psychologist in place; ACL research participation active via Nottingham Trent University study; 6-month post-retirement medical access being scoped; centrally funded research unit pending WPLL announcement.',
        metrics: ['ACL programme active: YES', 'Psychologist mandatory: YES', 'Post-retirement medical (6mo): NO (in scoping)'] },
      { id: '3.3', text: 'Mandating elite training facilities for elite players.', status: 'green',
        demo: '2023-24 FA licence criteria met across all eight published minimum standards. (See WPLL Minimum Standards tab for detail.)' },
      { id: '3.4', text: 'Mandating a world-leading parental package.', status: 'amber',
        demo: '14 weeks full maternity pay (FA standard) in place; in-depth review of parental package with current/former players + incoming union underway.',
        metrics: ['Maternity weeks at full pay: 14 (FA standard)', 'Cycle awareness training adaptation policy: in place'] },
      { id: '3.5', text: 'Funding full union representation to both tiers.', status: 'green',
        demo: 'PFA representation active for WSL + Championship; ring-fenced funding negotiations concluded; PFNCC for women\'s game established.' },
      { id: '3.6', text: 'Uplifting duty of care provision for players.', status: 'green',
        demo: 'Independent welfare officer in post; independent reporting line operational since 2023-24; player welfare and safeguarding strategy adopted.' },
      { id: '3.7', text: 'Offering best-in-class career transition support for players leaving the professional game.', status: 'amber',
        demo: 'Career transition programme being scoped with PFA; education/development opportunities offered ad-hoc; formalised mandated programme target Year 2.' },
    ],
  },
  {
    n: 4,
    title: 'The FA should urgently address the lack of diversity across the women\'s game — in both on and off-pitch roles.',
    explainer: 'The women\'s game suffers from significant under-representation of ethnically diverse individuals both on the pitch and in coaching, medical, support, and leadership roles. The Carney Review calls for transparency on existing EDI interventions, baseline workforce data collection, and a strategy designed from that data.',
    status: 'amber',
    onTrack: true,
    position: 'Workforce data reporting active. EDI strategy in design phase using first data set; intervention programmes being shaped.',
    reviewed: '01 Apr 2026',
    evidence: ['Football Leadership Diversity Code submission', 'Workforce data return 2024-25', 'EDI intervention programme drafts'],
    actions: [
      { txt: 'Adopt FA workforce strategy on publication', done: false },
      { txt: 'Report Y2 workforce data return', done: false },
    ],
    subRecommendations: [
      { id: '4.1', text: 'The FA should publish data on the success or failure of its existing equality, diversity and inclusion interventions.', status: 'green',
        demo: 'Football Leadership Diversity Code data published; Discover My Talent referral scheme outcomes shared.' },
      { id: '4.2', text: 'The FA should establish workforce data to give an understanding of the demographics of the current football workforce in all roles and at all levels.', status: 'green',
        demo: 'Mandatory workforce data reporting from 2024-25 season for all professional clubs in English leagues.' },
      { id: '4.3', text: 'The FA should use workforce data to design and implement a workforce strategy for the entire women\'s game.', status: 'amber',
        demo: 'Strategy in development; first data set collected, intervention programmes being designed.' },
    ],
  },
  {
    n: 5,
    title: 'The FA, Premier League, EFL and broadcasters should work together to carve out a new dedicated broadcast slot for women\'s football.',
    explainer: 'Women\'s matches are currently scheduled predominantly Sunday evenings, suppressing matchday attendance. The Carney Review wants a dedicated broadcast window — and discusses revoking Article 48 (UEFA\'s Saturday 14:45-17:15 broadcast blackout) for women\'s football specifically, which the government called "one viable option."',
    status: 'amber',
    onTrack: true,
    position: 'BBC/Sky deal in force. Article 48 dialogue ongoing among FA, Premier League, EFL, broadcasters; bespoke slot not yet finalised. Club\'s scheduling under WPLL kick-off windows.',
    reviewed: '20 Feb 2026',
    evidence: ['WPLL broadcast schedule 2025-26', 'BBC + Sky rights agreement excerpt'],
    actions: [
      { txt: 'Track WPLL broadcast slot consultation outcomes', done: false },
    ],
    subRecommendations: [
      { id: '5.1', text: 'Establish a dedicated, sustained broadcast slot for women\'s football — including evaluation of UEFA Article 48 derogation.', status: 'amber',
        demo: 'BBC/Sky deal in place; Article 48 debate continuing among FA, Premier League, EFL, broadcasters; bespoke broadcast slot not yet finalised.' },
    ],
    talkingPoint: 'Article 48 of the UEFA Statutes prohibits live broadcasts on Saturday 14:45-17:15. Revoking it for women\'s football specifically would unlock significant broadcast and commercial revenue. Government\'s view: one viable option.',
  },
  {
    n: 6,
    title: 'Clubs must better value and support their fans — the FA should raise minimum standards to enforce this.',
    explainer: 'Six sub-recommendations covering marketing resource, ticketing policies, stadium strategy, ground safety licensing, fan engagement, and supporter liaison officers. The operationally significant one is 6.4 — extending the Sports Grounds Safety Authority licensing to all WSL grounds, which is a stadium capex question, not a fan-experience one.',
    status: 'green',
    onTrack: true,
    position: 'Four of six sub-recs compliant. Stadium strategy (6.3) phasing more main-stadium fixtures across 2025-26 and 2026-27.',
    reviewed: '28 Mar 2026',
    evidence: ['Annual ticketing policy + fan survey 2025-26', 'SGSA licensing certificate (WSL ground)', 'Supporter liaison officer ToR', 'Stadium strategy draft v2'],
    actions: [
      { txt: 'Schedule additional main-stadium fixtures 2026-27', done: false },
      { txt: 'Refresh women\'s commercial + marketing plan', done: true },
    ],
    subRecommendations: [
      { id: '6.1', text: 'The FA should amend its licence requirements to require all clubs to have dedicated women\'s football marketing resource.', status: 'green',
        demo: 'Dedicated women\'s commercial + marketing resource in place since 2023-24.' },
      { id: '6.2', text: 'Following the introduction of FA licensing requirements for clubs to have ticketing policies, the FA should review these annually, and clubs should actively seek feedback from their fans on how these should be adapted.', status: 'green',
        demo: 'Annual ticketing policy review with fan feedback survey active.' },
      { id: '6.3', text: 'The FA should introduce a licence requirement for clubs to produce a stadium strategy focused on growing their matchday attendance, with a particular focus on increasing the number of matches played in the main stadia for affiliated teams.', status: 'amber',
        demo: 'Main stadium hosting plan in development; increased main stadium fixtures scheduled 2025-26.' },
      { id: '6.4', text: 'The Sports Grounds Safety Authority (SGSA) should extend its licensing scheme to all grounds used in the Women\'s Super League to ensure high standards of safety, while the Women\'s Championship should implement a self-regulation model with guidance, support and assurance provided by SGSA.', status: 'green',
        demo: 'SGSA licensing extended to WSL grounds (secondary legislation passed); self-regulation model active for Championship.' },
      { id: '6.5', text: 'All clubs should ensure that the recommendations in the Football Governance White Paper with regards to fan engagement should be delivered on with meaningful representation for fans of the women\'s team.', status: 'green',
        demo: 'Fan engagement framework in place; women\'s team fans formally represented.' },
      { id: '6.6', text: 'Women\'s Super League and Women\'s Championship clubs should each implement a supporter liaison officer.', status: 'green',
        demo: 'Supporter liaison officer in post since 2023-24.' },
    ],
    talkingPoint: 'Of the 24 primary and secondary grounds used by the 12 WSL clubs at the time of the Carney Review, only 17 were SGSA-licensed. Extension closed that gap.',
  },
  {
    n: 7,
    title: 'Government must deliver on recent commitments around equal access to school sports for girls.',
    explainer: 'This is a government action recommendation, not a club one. Three sub-recommendations focused on School Games Mark transparency, PE and Sport Premium funding clarity, and deployment-of-funds visibility via the new digital tool.',
    status: 'green',
    onTrack: true,
    position: 'National progress on all three lines. Club\'s contribution flows via Foundation activity and schools partnerships (cross-reference Community module).',
    reviewed: '15 Mar 2026',
    evidence: ['Schools partnership register Q1 2026', 'Foundation Activity quarterly report'],
    actions: [
      { txt: 'Continue local schools engagement (8 → 12 by Sept 2026)', done: false },
    ],
    subRecommendations: [
      { id: '7.1', text: 'Youth Sport Trust School Games Mark transparency.', status: 'green',
        demo: 'Compliant nationally.' },
      { id: '7.2', text: 'PE and Sport Premium funding figure made transparent and confirmed.', status: 'green',
        demo: '£600m+ across 2 academic years committed.' },
      { id: '7.3', text: 'Digital tool transparency for deployment of funds.', status: 'green',
        demo: 'Digital tool mandatory for schools 2024-25.' },
    ],
    govActionNote: 'This is a government-action recommendation. The card shows national progress; clubs are encouraged to engage with local schools through community programmes (cross-reference Foundation Activity in Community module).',
  },
  {
    n: 8,
    title: 'Everyone involved in funding grassroots facilities must come together to increase investment in order to accommodate meaningful access for women and girls.',
    explainer: 'National infrastructure recommendation. £302m already committed UK-wide; further £25m + £5m FA = Lionesses Futures Fund delivering 30 artificial grass pitches with gold-standard provision for women and girls.',
    status: 'amber',
    onTrack: false,
    position: 'Club facilities investment ongoing. Lionesses Futures Fund pitches benefit local pathway. Local Football Facility Plans (Football Foundation) under refresh.',
    reviewed: '02 Apr 2026',
    evidence: ['Facility investment forecast 2026-29', 'Lionesses Futures Fund mapping', 'Local Football Facility Plan refresh draft'],
    actions: [
      { txt: 'Submit Local Facility Plan inputs', done: true },
      { txt: 'Track Lionesses Futures Fund local pitch allocations', done: false },
    ],
    subRecommendations: [
      { id: '8.1', text: 'Increase combined investment in grassroots facilities to deliver meaningful access for women and girls.', status: 'amber',
        demo: 'Club facilities investment ongoing; Lionesses Futures Fund pitches benefit local pathway; Local Football Facility Plans (Football Foundation) under refresh.' },
    ],
    talkingPoint: 'Lionesses Futures Fund: £30m total (£25m government + £5m FA), 30 new pitches with gold-standard provision.',
    govActionNote: 'National infrastructure recommendation. Card shows national context; club\'s contribution noted alongside.',
  },
  {
    n: 9,
    title: 'The FA, Premier League and Football Foundation should work together to make sure that women and girls are benefitting from funding flowing into facilities across the pyramid.',
    explainer: 'Specifically about ensuring that existing facility funding mechanisms — Premier League Stadium Fund (tiers 1-4) and Premier League Women\'s Infrastructure Fund (tiers 3-4) — actually flow to women\'s-game-relevant projects with adequate accountability.',
    status: 'amber',
    onTrack: true,
    position: 'Premier League Stadium Fund engaged for stadium upgrade. Women\'s Infrastructure Fund application progressing. Football Foundation accountability framework being enhanced post-award.',
    reviewed: '06 Apr 2026',
    evidence: ['Premier League Stadium Fund application', 'Women\'s Infrastructure Fund draft application', 'Football Foundation accountability framework note'],
    actions: [
      { txt: 'Submit Women\'s Infrastructure Fund application Q3 2026', done: false },
    ],
    subRecommendations: [
      { id: '9.1', text: 'Ensure existing facility funding mechanisms flow to women\'s-game-relevant projects with adequate accountability.', status: 'amber',
        demo: 'Premier League Stadium Fund engaged for stadium upgrade project; Women\'s Infrastructure Fund application in progress; Football Foundation accountability framework being enhanced post-award.' },
    ],
  },
  {
    n: 10,
    title: 'The FA should leverage the handover of administration of the top 2 tiers of women\'s football to even more acutely focus on grassroots clubs and the Women\'s National League.',
    explainer: 'With WPLL now running tiers 1-2, the FA\'s attention should shift more sharply to the women\'s pyramid below — the Women\'s National League and grassroots. Following the entire volunteer-led management committee resigning in August 2023, the National League is now FA-managed with a structured support programme.',
    status: 'amber',
    onTrack: true,
    position: 'Women\'s National League FA-managed structure operational. Pathway partnerships with National League clubs active; reserve / dual-registration relationships in place.',
    reviewed: '22 Mar 2026',
    evidence: ['Pathway partnerships register', 'Dual-registration agreements (3 partner clubs)', 'WNL liaison correspondence Q1 2026'],
    actions: [
      { txt: 'Refresh dual-reg agreements 2026-27', done: false },
    ],
    subRecommendations: [
      { id: '10.1', text: 'Refocus FA attention on grassroots and Women\'s National League following WPLL handover of tiers 1-2.', status: 'amber',
        demo: 'Women\'s National League FA-managed structure operational; club\'s pathway partnerships with National League clubs active; reserve team / dual-registration relationships in place.' },
    ],
    govActionNote: 'National context recommendation. Card shows FA-managed structure; club\'s contribution via pathway partnerships noted.',
  },
]

// ─── WPLL Minimum Standards (6 categories, mapped to Carney sub-recs + 2023-24 licence criteria) ─

interface WpllMetric { label: string; value: string; status: Rag; sub?: string }
interface WpllCategory {
  title: string
  carneyLink: string
  icon: React.ElementType
  metrics: WpllMetric[]
  status: Rag
}

const WPLL_CATEGORIES: WpllCategory[] = [
  { title: 'Training Facilities', carneyLink: 'Carney 3.3', icon: MapPin, status: 'amber', metrics: [
    { label: 'Full-size grass pitch ≥100m × 64m, OR 3G artificial pitch', value: 'Compliant', status: 'green', sub: 'Full-size grass + 3G facility available' },
    { label: 'Separate goalkeeper training area',                         value: 'Compliant', status: 'green' },
    { label: 'Adequate pitch lighting',                                   value: 'Compliant', status: 'green' },
    { label: 'High-quality performance gym (cardio, free weights, plyo)', value: 'Compliant', status: 'green', sub: 'Full equipment list inventoried' },
    { label: 'Changing rooms for players AND staff',                      value: 'Compliant', status: 'green' },
    { label: 'Adequate medical facilities (defibs, rehab) per medical lead', value: 'Compliant', status: 'green' },
    { label: 'Meeting room for players',                                  value: 'Compliant', status: 'green' },
    { label: 'Adequate office space, parking, storage for staff',         value: 'Partial',   status: 'amber', sub: 'Office space tight; expansion planned 2025-26' },
  ] },
  { title: 'Salary & Contact Time', carneyLink: 'Carney 3.1', icon: Briefcase, status: 'amber', metrics: [
    { label: 'WSL minimum salary floor compliance (effective 2025-26)',   value: 'N/A',       status: 'unassessed', sub: 'Championship club — WSL floor does not apply' },
    { label: 'Championship contact time (target 20 hrs/wk by 2027-28)',   value: '14 hrs/wk', status: 'amber', sub: 'On track for 20 hrs by 2027-28; FA baseline was 8 hrs' },
    { label: 'Contact time recorded weekly (audit compliance)',            value: 'Compliant', status: 'green', sub: 'Weekly logs maintained' },
  ] },
  { title: 'Medical & S&C', carneyLink: 'Carney 3.2', icon: Stethoscope, status: 'amber', metrics: [
    { label: 'Sport / exercise psychologist available to first team',      value: 'Compliant', status: 'green' },
    { label: '6-month post-retirement medical access',                     value: 'In scoping', status: 'amber', sub: 'Policy being scoped with medical lead' },
    { label: 'Doctor coverage hours (matchday + training)',                value: 'Compliant', status: 'green', sub: 'Tier 1 standard met' },
    { label: 'Physio coverage hours (training + match days)',              value: 'Compliant', status: 'green' },
    { label: 'ACL research / risk programme participation',                value: 'Compliant', status: 'green', sub: 'Nottingham Trent University study active' },
  ] },
  { title: 'Maternity & Parental', carneyLink: 'Carney 3.4', icon: Baby, status: 'amber', metrics: [
    { label: 'Maternity pay weeks at full salary (FA minimum: 14 weeks)',  value: '14 weeks',  status: 'green', sub: 'In-depth review with PFA underway' },
    { label: 'Return-to-play protocol documented post-pregnancy',          value: 'Compliant', status: 'green' },
    { label: 'Training adaptation policy (incl. cycle awareness w/ consent)', value: 'Compliant', status: 'green' },
    { label: 'Childcare support framework',                                value: 'Informal',  status: 'amber', sub: 'Formalised policy in development' },
  ] },
  { title: 'Union Rep & Duty of Care', carneyLink: 'Carney 3.5 + 3.6', icon: Users, status: 'green', metrics: [
    { label: 'PFA representation in place',                                value: 'Compliant', status: 'green' },
    { label: 'Independent reporting line operational',                     value: 'Compliant', status: 'green', sub: 'FA independent reporting line accessible' },
    { label: 'Welfare lead in post (named role)',                          value: 'Compliant', status: 'green', sub: 'Sarah Martinez, since Mar 2025' },
    { label: 'Player welfare and safeguarding strategy adopted',           value: 'Compliant', status: 'green' },
    { label: 'PFNCC representation (Professional Football Negotiating + Consultative Committee — women\'s game)', value: 'Compliant', status: 'green', sub: 'Established 2024-25' },
  ] },
  { title: 'Stadium Safety', carneyLink: 'Carney 6.4', icon: Shield, status: 'green', metrics: [
    { label: 'SGSA licensing (WSL clubs only — Championship uses self-regulation)', value: 'N/A',       status: 'unassessed', sub: 'Championship club — self-regulation model applies' },
    { label: 'Self-regulation model documented (Championship clubs)',       value: 'Compliant', status: 'green' },
    { label: 'Annual safety review conducted',                              value: 'Compliant', status: 'green' },
    { label: 'Spectator safety risk assessment current',                    value: 'Compliant', status: 'green' },
  ] },
]

// ─── Equal Access Audit ───────────────────────────────────────────────────

interface EqualRow { cat: string; w: string; m: string; gap: string; status: Rag }
const EQUAL_GENDER_ROWS: EqualRow[] = [
  { cat: 'Training facilities — pitch access',     w: '28 hrs/wk',         m: '35 hrs/wk',        gap: '−7 hrs',     status: 'amber' },
  { cat: 'Medical staff hours (Dr + Physio)',      w: '42 hrs/wk',         m: '78 hrs/wk',        gap: '−36 hrs',    status: 'red' },
  { cat: 'S&C provision — coaches + facility',     w: '24 hrs/wk',         m: '40 hrs/wk',        gap: '−16 hrs',    status: 'amber' },
  { cat: 'Kit allocation — annual budget / player',w: '£1,800',            m: '£2,100',           gap: '−£300 (14%)', status: 'green' },
  { cat: 'Match-day operations — staff + budget',  w: '£18k / fixture',    m: '£85k / fixture',   gap: '−£67k',      status: 'red' },
  { cat: 'Travel standards — coach + hotel',       w: 'Standard + 3-star', m: 'Charter + 4-star', gap: 'Tier diff.', status: 'amber' },
  { cat: 'Hospitality access',                      w: 'Family lounge',     m: 'Lounge + boxes',   gap: 'Boxes absent', status: 'amber' },
  { cat: 'Recovery facilities',                     w: 'Shared, scheduled', m: 'Dedicated access', gap: 'Scheduling',  status: 'amber' },
  { cat: 'Video analysis — analyst hours / fixture',w: '8 hrs',             m: '18 hrs',           gap: '−10 hrs',    status: 'amber' },
  { cat: 'Scouting resource — scouts + travel',    w: '1 scout · £8k',     m: '6 scouts · £45k',  gap: 'Significant', status: 'red' },
]

interface TierRow { cat: string; wsl: string; champ: string; gap: string; status: Rag }
const EQUAL_TIER_ROWS: TierRow[] = [
  { cat: 'Player contact time',                     wsl: '20 hrs/wk',                          champ: '14 hrs/wk (this club; on track for 20 by 2027-28)', gap: '−6 hrs',     status: 'amber' },
  { cat: 'Salary floor compliance',                 wsl: 'Active from 2025-26',                champ: 'Pending (post-revenue threshold)',                  gap: 'Structural', status: 'amber' },
  { cat: 'Sport / exercise psychologist',           wsl: 'Mandatory',                          champ: 'Mandatory',                                         gap: '0',           status: 'green' },
  { cat: 'Medical staff hours',                     wsl: 'Tier 1 standard',                    champ: 'Tier 1 standard',                                   gap: '0',           status: 'green' },
  { cat: 'Training facilities (vs 2023-24 licence)',wsl: 'All 8 standards required',           champ: 'All 8 standards required',                          gap: '0',           status: 'green' },
  { cat: 'Maternity package',                       wsl: '14 weeks full pay',                  champ: '14 weeks full pay',                                 gap: '0',           status: 'green' },
  { cat: 'PFA representation',                      wsl: 'Ring-fenced funding active',         champ: 'Active (post-Carney funding extension)',            gap: '0',           status: 'green' },
  { cat: 'SGSA licensing',                          wsl: 'Required (post-2024 secondary leg.)', champ: 'Self-regulation with SGSA support',                 gap: 'Structural', status: 'unassessed' },
]

// ─── Welfare cards (8 cards — 6 existing + 2 added Sprint 3.5 for Carney 3.x coverage) ─

interface WelfareCard {
  title: string
  carneyLink: string
  icon: React.ElementType
  metrics: [string, string][]
  status: Rag
}

const WELFARE_CARDS: WelfareCard[] = [
  { title: 'Maternity Policy Compliance', carneyLink: 'Carney 3.4', icon: Baby, status: 'green', metrics: [
    ['Policy version', 'v3.2 (adopted Sept 2025)'],
    ['Players currently on maternity', '1 (Ava Mitchell, Phase 2 RTP)'],
    ['Return-to-play protocols', 'Documented · UEFA-aligned'],
    ['Training adaptation policy', 'In place · cycle-aware'],
  ] },
  { title: 'ACL Prevention Programme', carneyLink: 'Carney 3.2', icon: Activity, status: 'green', metrics: [
    ['Programme status', 'Active (Nordic + landing mechanics, weekly)'],
    ['Players in elevated risk band', '2 (Emily Zhang, Niamh Gallagher)'],
    ['Last cohort assessment', 'Mar 2026 — full squad screened'],
    ['Cross-link', 'Performance > ACL Risk Monitor'],
  ] },
  { title: 'Mental Health Provision', carneyLink: 'Carney 3.2', icon: Brain, status: 'green', metrics: [
    ['Provider partnership', 'Mind — partnership active since Mar 2025'],
    ['24/7 access', 'Available · player-controlled visibility'],
    ['Player utilisation rate', '15% (anonymous · last 12 months)'],
    ['Welfare check-in completion', '87% squad coverage'],
  ] },
  { title: 'Cycle Awareness Programme', carneyLink: 'Carney 3.2', icon: Flower2, status: 'green', metrics: [
    ['Training adaptation policy', 'In place (with consent)'],
    ['Players engaged with programme', '18 of 25 (anonymous count)'],
    ['Educational sessions to staff', '6 delivered (Sept 2025 — Mar 2026)'],
    ['Cross-link', 'Performance > Cycle Tracker'],
  ] },
  { title: 'Independent Welfare Officer', carneyLink: 'Carney 3.6', icon: Shield, status: 'green', metrics: [
    ['Officer', 'Sarah Martinez (Welfare Lead)'],
    ['Reports to', 'MD direct (independent of football operations)'],
    ['Annual welfare report', 'Sept 2025 published · Sept 2026 due'],
    ['Confidential disclosure pathway', 'Documented · two routes'],
  ] },
  { title: 'Player Voice in Welfare Decisions', carneyLink: 'Carney 3.5', icon: Users, status: 'green', metrics: [
    ['Player rep elected', 'Yes — Lucy Whitmore (Captain)'],
    ['Quarterly welfare consultation', 'Active · 4 sessions Apr 2025 → present'],
    ['Concerns raised / resolved (12 mo)', '4 raised · 4 resolved'],
    ['Player satisfaction with welfare', '92% (anonymous survey · Sept 2025)'],
  ] },
  { title: 'Career Transition Support', carneyLink: 'Carney 3.7', icon: GraduationCap, status: 'amber', metrics: [
    ['Career transition programme', 'In scoping (with PFA)'],
    ['PFA partnership for transition', 'Active'],
    ['Education / development opportunities', 'Offered ad-hoc; formal target Y2'],
    ['Mentoring scheme for retiring players', 'In design'],
  ] },
  { title: 'Post-Retirement Medical Access', carneyLink: 'Carney 3.2', icon: Stethoscope, status: 'amber', metrics: [
    ['6-month post-retirement medical access', 'Policy in scoping'],
    ['Departing players using provision (12 mo)', '0 (policy not yet in force)'],
    ['Cross-link', 'Club medical lead policy'],
    ['Target implementation', '2026-27 season'],
  ] },
]

// ─── Strategic Investment Plan — Carney-tagged remediation lines ──────────

interface InvestmentLine { gap: string; carneyLink: string; year: string; cost: string; outcome: string }
const INVESTMENT_PLAN: InvestmentLine[] = [
  // Year 1 (2026-27) — £0.4m
  { year: '2026-27', gap: 'Childcare support framework formalisation', carneyLink: 'Carney 3.4', cost: '£0.10m', outcome: 'Formal childcare policy operational by start of 2026-27 season' },
  { year: '2026-27', gap: 'Career transition programme launch with PFA', carneyLink: 'Carney 3.7', cost: '£0.15m', outcome: 'Mandated transition programme + first cohort enrolled' },
  { year: '2026-27', gap: 'Post-retirement medical access policy',     carneyLink: 'Carney 3.2', cost: '£0.15m', outcome: '6-month post-retirement medical access live' },
  // Year 2 (2027-28) — £0.8m
  { year: '2027-28', gap: 'Training ground office expansion',          carneyLink: 'Carney 3.3', cost: '£0.40m', outcome: 'Office space, parking and storage at parity with men\'s first team' },
  { year: '2027-28', gap: 'Championship contact time → 20 hrs/week',   carneyLink: 'Carney 3.1', cost: '£0.40m', outcome: 'Hit 2027-28 contact-time target; close gulf to WSL' },
  // Year 3 (2028-29) — £1.2m
  { year: '2028-29', gap: 'Main stadium hosting expansion',             carneyLink: 'Carney 6.3', cost: '£0.60m', outcome: '+6 main-stadium fixtures per season; matchday attendance growth' },
  { year: '2028-29', gap: 'Premier League Stadium Fund-supported upgrade', carneyLink: 'Carney 9', cost: '£0.60m', outcome: 'Co-funded facility upgrade with women\'s-game accountability' },
]

// ─── Resources & Documents ────────────────────────────────────────────────

interface ExternalResource { name: string; source: string; summary: string; url: string }
const EXTERNAL_RESOURCES: ExternalResource[] = [
  { name: 'Raising the Bar: Reframing the Opportunity in Women\'s Football',
    source: 'Karen Carney MBE · July 2023 · 128 pages',
    summary: '10 strategic recommendations for the women\'s professional game (the Carney Review).',
    url: 'https://www.gov.uk/government/publications/raising-the-bar-reframing-the-opportunity-in-womens-football' },
  { name: 'Government Response to Independent Review',
    source: 'DCMS · December 2023 · Command Paper CP 965 · ISBN 978-1-5286-4530-0',
    summary: 'Government\'s formal response with implementation actions across the 10 Carney recommendations.',
    url: 'https://www.gov.uk/government/publications/reframing-the-opportunity-in-womens-football-government-response/government-response-to-independent-review-reframing-the-opportunity-in-womens-football' },
  { name: 'Women\'s Professional Leagues Limited (WPLL)',
    source: 'WPLL · operating standards',
    summary: 'Operating body for WSL + Championship since 2024-25.',
    url: '#' },
  { name: 'FA Women\'s Football Strategy 2024-2028',
    source: 'thefa.com',
    summary: 'Strategic plan for women\'s football across all levels.',
    url: '#' },
  { name: 'Football Governance White Paper',
    source: 'gov.uk · referenced in Carney 6.5',
    summary: 'Sustainable Future: Reforming Club Football Governance.',
    url: 'https://www.gov.uk/government/publications/a-sustainable-future-reforming-club-football-governance' },
  { name: '2023-24 FA training facility licence criteria',
    source: 'thefa.com · licence page',
    summary: 'Eight published minimum standards mapped to Carney 3.3 in the WPLL Minimum Standards tab.',
    url: '#' },
  { name: 'SGSA Women\'s Game guidance',
    source: 'sgsa.org.uk',
    summary: 'Sports Grounds Safety Authority guidance for WSL licensing + Championship self-regulation.',
    url: '#' },
  { name: 'Get Active: a strategy for the future of sport and physical activity',
    source: 'gov.uk · referenced for Recommendations 7 + 8',
    summary: 'National sport strategy underpinning school-sport and grassroots-facility recommendations.',
    url: 'https://www.gov.uk/government/publications/get-active-a-strategy-for-the-future-of-sport-and-physical-activity' },
]

const INTERNAL_EVIDENCE = [
  { name: 'Welfare policy v3.2',                  type: 'Policy',    updated: 'Sept 2025', owner: 'Welfare Lead', status: 'current' as const },
  { name: 'Maternity policy',                     type: 'Policy',    updated: 'Aug 2024',  owner: 'HR',           status: 'current' as const },
  { name: 'Equal Access Audit — Q3 2025',         type: 'Audit',     updated: 'Oct 2025',  owner: 'MD',            status: 'current' as const },
  { name: 'Equal Access Audit — Q1 2026',         type: 'Audit',     updated: 'Apr 2026',  owner: 'MD',            status: 'current' as const },
  { name: 'ACL prevention programme',             type: 'Programme', updated: 'Jan 2026',  owner: 'Performance',   status: 'current' as const },
  { name: 'Mental health partnership SLA (Mind)', type: 'Contract',  updated: 'Mar 2025',  owner: 'MD',            status: 'review' as const },
]

// ─── Scoring ──────────────────────────────────────────────────────────────

function aggregateScore() {
  const carneyOnTrack = CARNEY.filter(c => c.onTrack).length // target: 7 / 10
  const wpllOnTrack   = WPLL_CATEGORIES.filter(c => c.status === 'green').length
  const equalGood     = EQUAL_GENDER_ROWS.filter(r => r.status === 'green').length
  const equalTotal    = EQUAL_GENDER_ROWS.length
  const equalPct      = Math.round((equalGood / equalTotal) * 100)
  const welfareOnTrack = WELFARE_CARDS.filter(w => w.status === 'green').length

  // Headline tracks Carney recommendations on track (7/10 in current state)
  return { headline: carneyOnTrack, carneyOnTrack, wpllOnTrack, equalPct, welfareOnTrack, welfareTotal: WELFARE_CARDS.length }
}

// ─── Component ────────────────────────────────────────────────────────────

interface Props {
  club?: { name?: string } | null
  onNavigate?: (deptId: string) => void
}

export default function GameStandardsView({ club, onNavigate }: Props) {
  void club
  const [tab, setTab] = useState<Tab>('carney')
  const [openCarney, setOpenCarney] = useState<number | null>(null)
  const [openWpll, setOpenWpll] = useState<string | null>(null)
  const [equalAxis, setEqualAxis] = useState<EqualAxis>('gender')

  const score = aggregateScore()

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'carney',     label: 'Carney Review Tracker',  icon: BookOpen },
    { id: 'wpll',       label: 'WPLL Minimum Standards', icon: Scale },
    { id: 'equal',      label: 'Equal Access Audit',     icon: Users },
    { id: 'welfare',    label: 'Welfare & Player Standards', icon: Heart },
    { id: 'investment', label: 'Strategic Investment',  icon: TrendingUp },
    { id: 'resources',  label: 'Resources & Documents', icon: FileText },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <Shield size={20} style={{ color: C.accent }} className="mt-0.5" />
          <div>
            <h1 className="text-xl font-black" style={{ color: C.text }}>Game Standards</h1>
            <p className="text-sm mt-0.5" style={{ color: C.text4 }}>Operating framework for the professional women&apos;s game · Carney Review · WPLL · Equal Access</p>
          </div>
        </div>
        <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <Crown size={16} style={{ color: C.accent }} />
          <div>
            <div className="text-[10px] uppercase tracking-wider" style={{ color: C.text4 }}>Aggregate</div>
            <div className="text-lg font-black" style={{ color: C.text }}>{score.headline} <span className="text-sm" style={{ color: C.text3 }}>/ 10 strategic recommendations on track</span></div>
            <div className="text-[10px]" style={{ color: C.text4 }}>Carney {score.carneyOnTrack}/10 · WPLL {score.wpllOnTrack}/6 · Equal {score.equalPct}% · Welfare {score.welfareOnTrack}/{score.welfareTotal}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, borderBottom: `1px solid ${C.border}`, overflowX: 'auto' }}>
        {TABS.map(t => {
          const active = tab === t.id
          const TabIcon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                appearance: 'none', border: 0, background: 'transparent',
                padding: '10px 14px', fontSize: 12.5, fontWeight: active ? 600 : 500,
                color: active ? '#fff' : C.text3,
                borderBottom: `2px solid ${active ? C.accent : 'transparent'}`,
                marginBottom: -1, cursor: 'pointer', whiteSpace: 'nowrap',
                display: 'inline-flex', alignItems: 'center', gap: 7,
                transition: 'color .12s, border-color .12s',
              }}>
              <TabIcon size={13} strokeWidth={1.75} />
              {t.label}
            </button>
          )
        })}
      </div>

      <div className="pt-2">
        {tab === 'carney' && (
          <div className="space-y-4">
            <div className="rounded-xl p-4 flex items-center justify-between" style={{ backgroundColor: C.panel2, border: `1px solid ${C.border}` }}>
              <div>
                <div className="text-sm font-bold" style={{ color: C.text }}>Raising the Bar — Independent Review of Women&apos;s Football</div>
                <div className="text-[11px]" style={{ color: C.text4 }}>Karen Carney MBE · July 2023 · 10 strategic recommendations · Government response: DCMS Command Paper CP 965 (Dec 2023)</div>
              </div>
              <div className="text-sm font-black" style={{ color: C.accent }}>{score.carneyOnTrack} / 10 on track</div>
            </div>
            <div className="space-y-2">
              {CARNEY.map(rec => {
                const open = openCarney === rec.n
                return (
                  <div key={rec.n} className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
                    <button onClick={() => setOpenCarney(open ? null : rec.n)} className="w-full flex items-start gap-3 px-4 py-3 text-left">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5" style={{ backgroundColor: ragColor(rec.status) + '26', color: ragColor(rec.status) }}>{rec.n}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold leading-snug" style={{ color: C.text }}>&ldquo;{rec.title}&rdquo;</div>
                        <div className="text-[11px] mt-1" style={{ color: C.text4 }}>Last reviewed {rec.reviewed}{rec.subRecommendations && rec.subRecommendations.length > 1 ? ` · ${rec.subRecommendations.length} sub-recommendations` : ''}</div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-1" style={{ background: ragColor(rec.status) + '26', color: ragColor(rec.status) }}>{ragLabel(rec.status)}</span>
                      {open
                        ? <ChevronDown size={14} style={{ color: C.text3 }} className="flex-shrink-0 mt-2" />
                        : <ChevronRight size={14} style={{ color: C.text3 }} className="flex-shrink-0 mt-2" />}
                    </button>
                    {open && (
                      <div className="px-4 pb-4 pt-2 space-y-3" style={{ borderTop: `1px solid ${C.border}`, backgroundColor: C.panel2 }}>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: C.text4 }}>What the Carney Review means</div>
                          <p className="text-xs leading-relaxed" style={{ color: C.text2 }}>{rec.explainer}</p>
                        </div>

                        {rec.govActionNote && (
                          <div className="rounded-lg p-2 text-[11px]" style={{ background: C.accentDim, border: `1px solid ${C.accent}30`, color: C.text2 }}>
                            <strong style={{ color: C.accent }}>Note: </strong>{rec.govActionNote}
                          </div>
                        )}

                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: C.text4 }}>Club&apos;s current position</div>
                          <p className="text-xs" style={{ color: C.text2 }}>{rec.position}</p>
                        </div>

                        {rec.subRecommendations && rec.subRecommendations.length > 0 && (
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: C.text4 }}>
                              Sub-recommendations ({rec.subRecommendations.length})
                            </div>
                            <div className="space-y-2">
                              {rec.subRecommendations.map(sr => (
                                <div key={sr.id} className="rounded-lg p-3" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
                                  <div className="flex items-start justify-between gap-3 mb-1.5">
                                    <div className="flex items-start gap-2 flex-1 min-w-0">
                                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: C.accentDim, color: C.accent }}>{sr.id}</span>
                                      <p className="text-[11px] italic leading-snug" style={{ color: C.text2 }}>&ldquo;{sr.text}&rdquo;</p>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: ragColor(sr.status) + '26', color: ragColor(sr.status) }}>{ragLabel(sr.status)}</span>
                                  </div>
                                  <p className="text-[11px] mt-1" style={{ color: C.text3 }}>{sr.demo}</p>
                                  {sr.metrics && sr.metrics.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                      {sr.metrics.map((m, i) => (
                                        <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.text3 }}>{m}</span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {rec.talkingPoint && (
                          <div className="rounded-lg p-3 text-[11px]" style={{ background: C.warnDim, border: `1px solid ${C.warn}30` }}>
                            <strong style={{ color: C.warn }}>Demo talking point: </strong>
                            <span style={{ color: C.text2 }}>{rec.talkingPoint}</span>
                          </div>
                        )}

                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: C.text4 }}>Evidence on file</div>
                          <ul className="space-y-1">
                            {rec.evidence.map((e, i) => <li key={i} className="text-xs flex items-center gap-2" style={{ color: C.text2 }}><FileText size={10} style={{ color: C.text4 }} />{e}</li>)}
                          </ul>
                        </div>
                        {rec.actions.length > 0 && (
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: C.text4 }}>Action items</div>
                            <ul className="space-y-1">
                              {rec.actions.map((a, i) => (
                                <li key={i} className="text-xs flex items-center gap-2" style={{ color: a.done ? C.text3 : C.text2 }}>
                                  <span className="w-3 h-3 rounded border flex items-center justify-center" style={{ borderColor: a.done ? C.good : C.borderHi, background: a.done ? C.goodDim : 'transparent' }}>
                                    {a.done && <span style={{ color: C.good, fontSize: 8 }}>✓</span>}
                                  </span>
                                  <span style={{ textDecoration: a.done ? 'line-through' : 'none' }}>{a.txt}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <button className="text-[11px] font-semibold px-3 py-1.5 rounded-lg" style={{ background: C.accentDim, color: C.accent, border: `1px solid ${C.accent}40` }}>Update Status</button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="rounded-xl p-4 text-[11px]" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}`, color: C.text3 }}>
              <ExternalLink size={12} className="inline mr-1.5" style={{ color: C.text4 }} />
              Reference: <a href="https://www.gov.uk/government/publications/raising-the-bar-reframing-the-opportunity-in-womens-football" className="underline" style={{ color: C.accent }} target="_blank" rel="noopener noreferrer">Raising the Bar — Independent Review of Women&apos;s Football (Carney, 2023)</a>
              <span className="mx-2" style={{ color: C.text4 }}>·</span>
              <a href="https://www.gov.uk/government/publications/reframing-the-opportunity-in-womens-football-government-response" className="underline" style={{ color: C.accent }} target="_blank" rel="noopener noreferrer">Government Response (DCMS, CP 965, Dec 2023)</a>
            </div>
          </div>
        )}

        {tab === 'wpll' && (
          <div className="space-y-4">
            <div className="rounded-xl p-4 flex items-center justify-between" style={{ backgroundColor: C.panel2, border: `1px solid ${C.border}` }}>
              <div>
                <div className="text-sm font-bold" style={{ color: C.text }}>Women&apos;s Professional Leagues Limited (WPLL)</div>
                <div className="text-[11px]" style={{ color: C.text4 }}>Minimum standards mapped to Carney sub-recommendations + 2023-24 FA licence criteria · 6 categories</div>
              </div>
              <div className="text-sm font-black" style={{ color: C.accent }}>{score.wpllOnTrack} / 6 categories fully compliant</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {WPLL_CATEGORIES.map(cat => {
                const open = openWpll === cat.title
                const CatIcon = cat.icon
                return (
                  <div key={cat.title} className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
                    <button onClick={() => setOpenWpll(open ? null : cat.title)} className="w-full flex items-center gap-3 px-4 py-3 text-left">
                      <CatIcon size={16} style={{ color: ragColor(cat.status) }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold" style={{ color: C.text }}>{cat.title}</div>
                        <div className="text-[11px] mt-0.5" style={{ color: C.text4 }}>
                          {cat.metrics.length} metrics · <span style={{ color: C.accent }}>{cat.carneyLink}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: ragColor(cat.status) + '26', color: ragColor(cat.status) }}>{ragLabel(cat.status)}</span>
                    </button>
                    {open && (
                      <div className="px-4 pb-4 pt-2 space-y-2" style={{ borderTop: `1px solid ${C.border}`, backgroundColor: C.panel2 }}>
                        {cat.metrics.map((m, i) => (
                          <div key={i} className="flex items-start justify-between gap-3 text-xs">
                            <div className="flex-1">
                              <div style={{ color: C.text2 }}>{m.label}</div>
                              {m.sub && <div className="text-[10px] mt-0.5" style={{ color: C.text4 }}>{m.sub}</div>}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="font-bold font-mono" style={{ color: ragColor(m.status) }}>{m.value}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <button className="text-[11px] font-semibold px-4 py-2 rounded-lg" style={{ background: C.accentDim, color: C.accent, border: `1px solid ${C.accent}40` }}>
              Generate WPLL Compliance Report (PDF — coming next sprint)
            </button>
          </div>
        )}

        {tab === 'equal' && (
          <div className="space-y-4">
            <div className="rounded-xl p-4" style={{ backgroundColor: C.panel2, border: `1px solid ${C.border}` }}>
              <div className="flex items-start justify-between mb-3 flex-wrap gap-3">
                <div>
                  <div className="text-sm font-bold" style={{ color: C.text }}>Equal Access Audit</div>
                  <div className="text-[11px]" style={{ color: C.text4 }}>The Carney Review repeatedly flags two parity gaps: women&apos;s vs men&apos;s first team, and WSL vs Championship. Switch axis below.</div>
                </div>
                <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
                  {([
                    { id: 'gender' as const, label: 'Women\'s vs Men\'s First Team', sub: 'Carney Rec #4' },
                    { id: 'tier'   as const, label: 'WSL vs Championship',          sub: 'Carney 3.1 gulf' },
                  ]).map(opt => {
                    const active = equalAxis === opt.id
                    return (
                      <button key={opt.id} onClick={() => setEqualAxis(opt.id)}
                        className="px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all"
                        style={{
                          background: active ? C.accent : 'transparent',
                          color: active ? '#fff' : C.text3,
                        }}>
                        {opt.label}
                        <span className="ml-1.5 text-[9px] opacity-70">{opt.sub}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {equalAxis === 'gender' && (
                <div className="text-[11px] p-2 rounded-lg" style={{ backgroundColor: C.warnDim, color: C.warn }}>
                  Parity score: <strong>{score.equalPct}%</strong> · Forecast: target 85% by 2027/28 (Strategic Investment Plan ratified by board).
                </div>
              )}
              {equalAxis === 'tier' && (
                <div className="text-[11px] p-2 rounded-lg" style={{ backgroundColor: C.accentDim, color: C.accent }}>
                  WSL/Championship gulf is the Carney 3.1 priority. Most cells already at parity due to universal FA standards; primary gap is contact time + salary floor.
                </div>
              )}
            </div>

            {equalAxis === 'gender' && (
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
                <table className="w-full text-xs">
                  <thead><tr style={{ background: C.panel2 }}>
                    {['Category','Women\'s first team','Men\'s first team','Gap','Status'].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {EQUAL_GENDER_ROWS.map((r, i) => {
                      const rc = ragColor(r.status)
                      return (
                        <tr key={i} style={{ borderTop: `1px solid ${C.border}`, background: r.status === 'red' ? `${C.bad}08` : 'transparent' }}>
                          <td className="px-3 py-2.5 font-semibold" style={{ color: C.text }}>{r.cat}</td>
                          <td className="px-3 py-2.5 font-mono" style={{ color: C.text2 }}>{r.w}</td>
                          <td className="px-3 py-2.5 font-mono" style={{ color: C.text3 }}>{r.m}</td>
                          <td className="px-3 py-2.5 font-mono font-bold" style={{ color: rc }}>{r.gap}</td>
                          <td className="px-3 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: rc + '26', color: rc }}>{ragLabel(r.status)}</span></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {equalAxis === 'tier' && (
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
                <table className="w-full text-xs">
                  <thead><tr style={{ background: C.panel2 }}>
                    {['Category','WSL','Championship','Gap','Status'].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {EQUAL_TIER_ROWS.map((r, i) => {
                      const rc = ragColor(r.status)
                      return (
                        <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}>
                          <td className="px-3 py-2.5 font-semibold" style={{ color: C.text }}>{r.cat}</td>
                          <td className="px-3 py-2.5 font-mono" style={{ color: C.text2 }}>{r.wsl}</td>
                          <td className="px-3 py-2.5 font-mono" style={{ color: C.text3 }}>{r.champ}</td>
                          <td className="px-3 py-2.5 font-mono font-bold" style={{ color: rc }}>{r.gap}</td>
                          <td className="px-3 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: rc + '26', color: rc }}>{r.status === 'unassessed' ? 'STRUCTURAL' : ragLabel(r.status)}</span></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="rounded-xl p-3 text-[11px]" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}`, color: C.text3 }}>
              <strong style={{ color: C.text2 }}>Note:</strong> men&apos;s match-day cost reflects primary-stadium overhead (full safety + commercial capacity). Women&apos;s currently plays at the training-ground stadium for most fixtures. The financial gap is contextual — the parity question is provision quality, not absolute spend. Reviewed quarterly with women&apos;s MD.
            </div>
          </div>
        )}

        {tab === 'welfare' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {WELFARE_CARDS.map(w => {
              const WIcon = w.icon
              return (
                <div key={w.title} className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <WIcon size={16} style={{ color: C.accent }} />
                      <h3 className="text-sm font-bold" style={{ color: C.text }}>{w.title}</h3>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: ragColor(w.status) + '26', color: ragColor(w.status) }}>{ragLabel(w.status)}</span>
                  </div>
                  <div className="text-[10px] mb-2" style={{ color: C.accent }}>{w.carneyLink}</div>
                  <div className="space-y-1.5">
                    {w.metrics.map(([k, v], i) => (
                      <div key={i} className="flex justify-between text-[11px]">
                        <span style={{ color: C.text4 }}>{k}</span>
                        <span style={{ color: C.text2 }} className="font-medium text-right ml-3">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {tab === 'investment' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Kpi label="Year 1 (2026-27)"   value="£0.4m" sub="3 lines · welfare + transition" accent={C.accent} />
              <Kpi label="Year 2 (2027-28)"   value="£0.8m" sub="2 lines · facilities + contact time" accent={C.warn} />
              <Kpi label="Year 3 (2028-29)"   value="£1.2m" sub="2 lines · stadium + Stadium Fund" accent={C.warn} />
              <Kpi label="3-year total"       value="£2.4m" sub="all lines tagged to Carney" accent={C.good} />
            </div>
            <div>
              <h3 className="text-sm font-bold mb-2" style={{ color: C.text }}>Multi-year remediation plan — every line tagged to a Carney sub-recommendation</h3>
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
                <table className="w-full text-xs">
                  <thead><tr style={{ background: C.panel2 }}>
                    {['Year','Investment','Carney link','Cost','Expected outcome'].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {INVESTMENT_PLAN.map((p, i) => (
                      <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}>
                        <td className="px-3 py-2.5 font-mono font-bold" style={{ color: C.text }}>{p.year}</td>
                        <td className="px-3 py-2.5 font-semibold" style={{ color: C.text }}>{p.gap}</td>
                        <td className="px-3 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: C.accentDim, color: C.accent }}>{p.carneyLink}</span></td>
                        <td className="px-3 py-2.5 font-mono" style={{ color: C.text2 }}>{p.cost}</td>
                        <td className="px-3 py-2.5" style={{ color: C.text3 }}>{p.outcome}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="rounded-xl p-4 flex items-center justify-between" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
              <div>
                <div className="text-sm font-bold" style={{ color: C.text }}>Cross-link to Club Vision</div>
                <div className="text-[11px] mt-0.5" style={{ color: C.text4 }}>All investment plans here are reflected in the women&apos;s Club Vision multi-year planner.</div>
              </div>
              <button onClick={() => onNavigate?.('club-vision')} className="text-xs font-semibold px-4 py-2 rounded-lg" style={{ background: C.accentDim, color: C.accent, border: `1px solid ${C.accent}40` }}>
                View Full Multi-Year Vision →
              </button>
            </div>
          </div>
        )}

        {tab === 'resources' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold mb-2" style={{ color: C.text }}>External Standards & Research</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {EXTERNAL_RESOURCES.map(r => (
                  <a key={r.name} href={r.url} target="_blank" rel="noopener noreferrer" className="rounded-xl p-4 block" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="text-sm font-bold" style={{ color: C.text }}>{r.name}</div>
                      <ExternalLink size={12} style={{ color: C.text4 }} className="flex-shrink-0 mt-1" />
                    </div>
                    <div className="text-[11px] mb-1" style={{ color: C.text4 }}>{r.source}</div>
                    <div className="text-[11px]" style={{ color: C.text3 }}>{r.summary}</div>
                  </a>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold" style={{ color: C.text }}>Internal Club Evidence</h3>
                <button className="text-[11px] font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5" style={{ background: C.accentDim, color: C.accent, border: `1px solid ${C.accent}40` }}>
                  <Upload size={12} />Upload New Document
                </button>
              </div>
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
                <table className="w-full text-xs">
                  <thead><tr style={{ background: C.panel2 }}>
                    {['Document','Type','Last updated','Owner','Status'].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {INTERNAL_EVIDENCE.map(d => (
                      <tr key={d.name} style={{ borderTop: `1px solid ${C.border}` }}>
                        <td className="px-3 py-2.5 font-semibold" style={{ color: C.text }}>{d.name}</td>
                        <td className="px-3 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: C.accentDim, color: C.accent }}>{d.type}</span></td>
                        <td className="px-3 py-2.5 font-mono" style={{ color: C.text3 }}>{d.updated}</td>
                        <td className="px-3 py-2.5" style={{ color: C.text3 }}>{d.owner}</td>
                        <td className="px-3 py-2.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: d.status === 'current' ? C.goodDim : C.warnDim, color: d.status === 'current' ? C.good : C.warn }}>
                            {d.status === 'current' ? 'CURRENT' : 'NEEDS REVIEW'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Kpi({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
      <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: C.text4 }}>{label}</div>
      <div className="text-2xl font-black" style={{ color: C.text }}>{value}</div>
      <div className="text-[11px] mt-1" style={{ color: accent }}>{sub}</div>
    </div>
  )
}

// Suppress unused-import warnings for icons retained for future tab additions
void Calendar
void TrendingUp
