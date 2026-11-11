// Canned responses for paid AI / text-to-speech routes, served by
// DemoFetchGuard on every page except the live products (Tennis Coach, Lumio
// Impact) so locked portals never spend on Claude or ElevenLabs. Each entry returns JSON in the shape its
// callers read (see the route handlers under src/app/api for the live shapes).
// Fictional names only.

import { getDemoInsights, getDemoSummary } from './demo-ai-content'
import { PAID_API_PATHS, PAID_API_PREFIXES } from './paid-routes.generated'

export interface CannedResponse { status: number; json: unknown }

// Only Tennis Coach and Lumio Impact are live. The guard is active on every
// page EXCEPT these (plus the admin consoles). Matching is on whole path
// segments: '/camp' matches /camp and /camp/x, never /campaign.
export const LIVE_PAGE_PREFIXES: readonly string[] = [
  // Tennis Coach (and the client links coaches send)
  '/coach', '/tennis/coach', '/book', '/lesson', '/slot', '/card', '/group', '/welcome', '/portal',
  '/camp', '/trip', '/pay-balance',
  // Lumio Impact (Ten Project is built on the Impact code)
  '/impact', '/tenproject', '/fundraise',
  // Admin consoles
  '/admin', '/sports-admin',
]

function underSegment(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(prefix + '/')
}

export function isLivePage(pagePath: string): boolean {
  return LIVE_PAGE_PREFIXES.some(p => underSegment(pagePath, p))
}

export function isPaidRoute(apiPath: string): boolean {
  return PAID_API_PREFIXES.some(p => underSegment(apiPath, p)) || PAID_API_PATHS.some(p => underSegment(apiPath, p))
}

// Exemptions first, then the paid-route rule.
export function shouldIntercept(pagePath: string, apiPath: string): boolean {
  if (isLivePage(pagePath)) return false
  return isPaidRoute(apiPath)
}

// ── helpers ─────────────────────────────────────────────────────────────────

type Body = Record<string, unknown>

const DISABLED: CannedResponse = { status: 503, json: { error: 'demo_canned' } }
const ok = (json: unknown): CannedResponse => ({ status: 200, json })
const str = (v: unknown): string => (typeof v === 'string' ? v : '')
const anthropicText = (text: string) => ok({ content: [{ type: 'text', text }] })

// Text of an Anthropic-style { messages: [{ content }] } body, or { prompt }.
function promptText(b: Body): string {
  const msgs = Array.isArray(b.messages) ? b.messages : []
  const fromMsgs = msgs.map(m => {
    const c = (m as Body)?.content
    if (typeof c === 'string') return c
    if (Array.isArray(c)) return c.map(p => str((p as Body)?.text)).join(' ')
    return ''
  }).join('\n')
  return [str(b.prompt), fromMsgs].filter(Boolean).join('\n')
}

// ── /api/ai/football-search ─────────────────────────────────────────────────

function businessDaySlots(minutes: number) {
  const slots: Record<string, string>[] = []
  const pad = (n: number) => String(n).padStart(2, '0')
  const starts = ['10:00', '14:30']
  const d = new Date()
  while (slots.length < 6) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() === 0 || d.getDay() === 6) continue
    for (const start of starts) {
      if (slots.length >= 6) break
      const [h, m] = start.split(':').map(Number)
      const endTotal = h * 60 + m + minutes
      const end = `${pad(Math.floor(endTotal / 60))}:${pad(endTotal % 60)}`
      const iso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
      slots.push({
        date: d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }),
        day: d.toLocaleDateString('en-GB', { weekday: 'short' }),
        dateNum: String(d.getDate()),
        month: d.toLocaleDateString('en-GB', { month: 'short' }),
        startTime: start,
        endTime: end,
        startISO: `${iso}T${start}:00`,
        endISO: `${iso}T${end}:00`,
      })
    }
  }
  return slots
}

function emailBody(q: string): string {
  const subject = q.match(/Subject: "([^"]*)"/)?.[1] || 'your enquiry'
  return `I hope you're well.\n\nI'm getting in touch about ${subject}. I've pulled together the key points and I'm happy to talk them through whenever suits you.\n\nCould you let me know a good time this week for a quick call?\n\nThanks`
}

function rfpIntelligence(q: string) {
  const company = q.match(/opportunity for (.+?) \(/)?.[1] || 'the prospect'
  return {
    companySnapshot: `${company} is mid-evaluation with a defined deadline and several stakeholders involved. The requirements line up well with Lumio's core modules.`,
    buyingSignals: ['Deadline set and shared with shortlisted vendors', 'Asked for a detailed pricing breakdown', 'Operations and finance leads both engaged'],
    risks: ['An incumbent tool may already be embedded', 'Budget sign-off still pending'],
    competitorWatch: 'Likely comparing two or three platforms. Lumio leads on integration depth, built-in AI and speed to go live.',
    pricingGuidance: 'Lead with an annual plan and a clear ROI story; offer a pilot to reduce perceived risk.',
    keyMessages: ['One platform instead of several stitched-together tools', 'Live in weeks, not months', 'AI insights from day one'],
    winProbability: '68%',
    recommendedApproach: `Run a discovery call with ${company} to confirm their pain points, then present a tailored demo and a short pilot proposal.`,
  }
}

function rfpDocument(q: string) {
  const company = q.match(/RFP response for (.+?)\. /)?.[1] || 'your organisation'
  return {
    subject: `Proposal: Lumio Platform for ${company}`,
    executiveSummary: `Thank you for the opportunity to respond. This proposal sets out how Lumio brings your teams onto one AI-powered platform, with clear reporting and fast deployment.\n\nWe have shaped it around the requirements you shared and included a phased plan so value arrives early.`,
    ourUnderstanding: `${company} wants to simplify operations, improve visibility across departments and make faster, data-led decisions without adding headcount.`,
    proposedSolution: 'Deploy the core Lumio modules with tailored onboarding, AI insights enabled from day one and a named success manager.\n\nDelivery runs in three phases: discovery and setup, migration and training, then go-live.',
    whyLumio: ['All-in-one platform with no integration headaches', 'AI built in, not bolted on', 'Live in weeks, not months', 'UK-based support with a named account manager'],
    pricing: 'Professional tier on an annual commitment, including all modules, unlimited users and priority support.',
    timeline: 'Phase 1: Discovery & Setup (2 weeks) → Phase 2: Migration & Training (2 weeks) → Phase 3: Go-Live (1 week).',
    nextSteps: 'We would welcome a 30-minute call to walk through this proposal and answer any questions.',
    closingLine: `We are excited about partnering with ${company} and confident Lumio will deliver measurable value from the first month.`,
  }
}

function tennisReport(q: string): string {
  const won = /who won against/.test(q)
  const opp = q.match(/against (.+?) \(/)?.[1] || 'the opponent'
  const event = q.match(/\) at (?:the )?(.+?), score/)?.[1] || 'the tournament'
  const score = q.match(/score (.+?) on/)?.[1] || ''
  const surface = q.match(/ on (\w+)\./)?.[1]?.toLowerCase() || 'clay'
  return won
    ? `Alex Rivera beat ${opp} ${score} at ${event}, a composed performance that showed growing confidence on ${surface}.\n\nThe match turned on three moments: an early break built on deep returns, a hold from 0-30 late in the second set, and a calm finish when the pressure peaked. First-serve placement and patient backhand exchanges did most of the damage.\n\nThe area to tighten is second-serve depth, which gave ${opp} chances to attack. Next up, keep the same patterns and trust the forehand to finish points earlier.`
    : `Alex Rivera lost ${score} to ${opp} at ${event}, with the opponent's consistency on ${surface} proving decisive.\n\nThree moments shaped it: a dropped serve after a long rally, missed break points mid-second set, and a dip in first-serve percentage when the score was level. The return game was solid and the forehand created openings.\n\nThe priority is converting break points and protecting the second serve. Looking ahead, the level is close and the next clay event is a good chance to turn these margins around.`
}

const DEMO_CLUB = {
  name: 'Oakridge FC (demo profile)', league: 'Demo League', country: 'England', founded: '1898',
  stadium: 'Oakridge Park', capacity: '12,400', manager: 'Demo manager', ownerType: 'Private ownership',
  revenue: '£14.2m', wageBill: '£8.6m', transferBudget: '£4.2m', recentForm: 'W-W-D-L-W', leaguePos: '6th',
  avgAttendance: '8,200', keyPlayers: ['R. Martinez (ST)', 'T. Santos (CM)', 'D. O\'Brien (CB)'],
  academyRating: 'Category 2', psr: 'Compliant with headroom', strengthsWeaknesses: 'Strong pressing side; thin squad depth in midfield.',
  lumioFit: 'Strong fit for performance and operations modules.', contactRoute: 'Via the club secretary',
  summary: 'Live club search is turned off in the demo. This sample profile shows the fields a live search returns.',
}

const DEMO_PLAYER = {
  name: 'Sample player (demo profile)', age: '24', nationality: 'England', position: 'Central Midfielder',
  currentClub: 'Riverside United', league: 'Demo League', contractUntil: 'June 2027', marketValue: '£1.8m',
  agent: 'Not disclosed', agencyName: 'Not disclosed', goals: '6', assists: '9', apps: '38', rating: '7.1',
  strengths: ['Press resistance', 'Progressive passing', 'Work rate'], weaknesses: ['Aerial duels', 'Long-range finishing'],
  previousClubs: ['Northgate City', 'Crestwood Athletic', 'Harfield FC'], internationalCaps: '0',
  transferStatus: 'Open to offers', askingPrice: '£2m', fitForWimbledon: 'Good tactical fit for a pressing 4-2-3-1.',
  approachRoute: 'Club-to-club', psrImpact: 'Low', summary: 'Live player search is turned off in the demo. This sample profile shows the fields a live search returns.',
}

function demoSquad(q: string) {
  const [club, league] = q.split('|')
  const names: [string, string][] = [
    ['A. Hale', 'GK'], ['J. Mercer', 'RB'], ['D. O\'Brien', 'CB'], ['K. Doyle', 'CB'], ['L. Grant', 'LB'],
    ['T. Santos', 'CDM'], ['M. Silva', 'CM'], ['R. Thompson', 'CM'], ['C. Ward', 'CAM'],
    ['E. Collins', 'RW'], ['S. Price', 'LW'], ['R. Martinez', 'ST'], ['B. Nash', 'ST'],
  ]
  return {
    club: club || 'Oakridge FC', league: league || 'Demo League', manager: 'Demo manager', stadium: 'Oakridge Park',
    leaguePos: '6th', avgRating: '6.9', topScorer: 'R. Martinez', recentForm: 'W-W-D-L-W', season: '2025-26',
    players: names.map(([name, pos], i) => ({
      name: `${name} (demo)`, number: String(i + 1), pos, age: String(20 + (i * 3) % 13), nationality: 'England',
      goals: String(pos === 'ST' ? 8 + i % 4 : i % 3), assists: String(i % 5), apps: String(18 + i % 9),
      rating: (6.5 + (i % 6) / 10).toFixed(1), contract: '2027', value: `£${(0.4 + (i % 5) * 0.3).toFixed(1)}m`, status: 'fit',
    })),
  }
}

function actionConfirmation(q: string): string {
  const quoted = q.match(/"([^"]+)"/)?.[1]
  if (/calendar event/i.test(q)) return `Demo workspace: calendar event "${quoted || 'Meeting'}" prepared. In a live workspace Lumio adds it to the connected calendar and invites attendees.`
  if (/draft|email/i.test(q)) return `Demo workspace: email draft${quoted ? ` "${quoted}"` : ''} prepared. In a live workspace Lumio saves it to your connected mailbox for review before sending.`
  return 'Demo workspace: action completed with sample data. In a live workspace Lumio runs this against your connected tools.'
}

function footballSearch(b: Body): CannedResponse {
  const q = str(b.query)
  if (q.startsWith('SALES INTELLIGENCE:')) return ok({ result: rfpIntelligence(q) })
  if (q.startsWith('RFP DOCUMENT:')) return ok({ result: rfpDocument(q) })
  if (q.startsWith('CALENDAR:')) return ok({ result: businessDaySlots(Number(q.match(/Find (\d+) minute/)?.[1]) || 30) })
  if (q.startsWith('WRITE EMAIL BODY')) return ok({ result: emailBody(q) })
  if (q.includes('post-match analysis report for Alex Rivera')) return ok({ result: tennisReport(q) })
  if (b.type === 'club') return ok({ result: DEMO_CLUB })
  if (b.type === 'squad') return ok({ result: demoSquad(q) })
  if (q.length <= 60 && !q.includes('\n')) return ok({ result: DEMO_PLAYER })
  return ok({ result: actionConfirmation(q) })
}

// ── /api/ai/overview ────────────────────────────────────────────────────────

const OVERVIEW: Record<string, unknown[]> = {
  'quick-wins': [
    { id: 'qw1', title: 'Approve 3 pending leave requests', description: 'All within policy and cover is in place.', impact: 'HIGH', timeEstimate: '2 min', department: 'HR', actionLabel: 'Review', source: 'HR' },
    { id: 'qw2', title: 'Chase the overdue Meridian invoice', description: '£4,800, 12 days overdue. A friendly reminder usually clears it.', impact: 'HIGH', timeEstimate: '3 min', department: 'Finance', actionLabel: 'Send reminder', source: 'Accounts' },
    { id: 'qw3', title: 'Reply to Apex Logistics demo request', description: 'Warm inbound lead from yesterday\'s webinar.', impact: 'MEDIUM', timeEstimate: '4 min', department: 'Sales', actionLabel: 'Reply', source: 'CRM' },
    { id: 'qw4', title: 'Confirm Thursday team stand-up agenda', description: 'Two agenda items still need owners.', impact: 'MEDIUM', timeEstimate: '2 min', department: 'Operations', actionLabel: 'Open agenda', source: 'Calendar' },
  ],
  'daily-tasks': [
    { id: 'dt1', title: 'Review Q4 pipeline with sales', description: 'Focus on the six deals in negotiation.', priority: 'urgent', category: 'Sales', dueTime: '10:00', estimatedMinutes: 30 },
    { id: 'dt2', title: 'Sign off November payroll', description: 'Payroll file is ready for approval.', priority: 'urgent', category: 'Finance', dueTime: '12:00', estimatedMinutes: 15 },
    { id: 'dt3', title: 'Onboarding check-in with new starters', description: 'Two starters in their first week.', priority: 'high', category: 'HR', dueTime: '14:00', estimatedMinutes: 20 },
    { id: 'dt4', title: 'Approve marketing webinar copy', description: 'Crown Events webinar goes out Friday.', priority: 'high', category: 'Marketing', dueTime: null, estimatedMinutes: 15 },
    { id: 'dt5', title: 'Review support escalations', description: 'Two P1 tickets open since this morning.', priority: 'normal', category: 'Support', dueTime: '16:00', estimatedMinutes: 20 },
    { id: 'dt6', title: 'Plan next week\'s priorities', description: 'Block 20 minutes before close.', priority: 'normal', category: 'Planning', dueTime: '17:00', estimatedMinutes: 20 },
  ],
  'insights': [
    { id: 'in1', title: 'MRR up 12% month on month', summary: 'Growth is driven by upgrades from existing customers.', trend: 'up', metric: '+12%', recommendation: 'Target the next ten accounts on the starter tier for an upgrade conversation.', category: 'Revenue' },
    { id: 'in2', title: 'Support response time slipping', summary: 'Average first response rose to 4 hours this week.', trend: 'down', metric: '4h', recommendation: 'Add an afternoon triage slot until volume settles.', category: 'Support' },
    { id: 'in3', title: 'Three accounts flagged at churn risk', summary: 'Usage dropped more than 40% in the last 30 days.', trend: 'alert', metric: '3 accounts', recommendation: 'Book QBRs with all three this week.', category: 'Customer Success' },
    { id: 'in4', title: 'Workflow success rate steady', summary: '94% of automated runs completed without intervention.', trend: 'neutral', metric: '94%', recommendation: 'Fix the three intermittently failing workflows to push past 97%.', category: 'Operations' },
  ],
  'dont-miss': [
    { id: 'dm1', title: 'Apex Logistics proposal due today', description: 'Final pricing still needs sign-off.', urgency: 'critical', deadline: 'Today 17:00', actionLabel: 'Open proposal', category: 'Sales' },
    { id: 'dm2', title: 'VAT return deadline approaching', description: 'Return due in 5 days; figures are ready to review.', urgency: 'high', deadline: 'In 5 days', actionLabel: 'Review', category: 'Finance' },
    { id: 'dm3', title: 'Three performance reviews overdue', description: 'Managers have been reminded once already.', urgency: 'medium', deadline: null, actionLabel: 'Nudge managers', category: 'HR' },
  ],
  'team': [
    { id: 'tm1', name: 'Sarah Mitchell', role: 'Head of Sales', department: 'Sales', status: 'in-meeting', currentFocus: 'Q4 pipeline review', needsAttention: false, attentionNote: null },
    { id: 'tm2', name: 'James Carter', role: 'Operations Manager', department: 'Operations', status: 'busy', currentFocus: 'Supplier renewals', needsAttention: true, attentionNote: 'Waiting on approval for two purchase orders' },
    { id: 'tm3', name: 'Priya Shah', role: 'HR Lead', department: 'HR', status: 'available', currentFocus: 'Onboarding new starters', needsAttention: false, attentionNote: null },
    { id: 'tm4', name: 'Tom Walsh', role: 'Support Lead', department: 'Support', status: 'busy', currentFocus: 'P1 escalations', needsAttention: true, attentionNote: 'Two P1 tickets over SLA' },
    { id: 'tm5', name: 'Emma Hughes', role: 'Marketing Manager', department: 'Marketing', status: 'away', currentFocus: 'Webinar launch', needsAttention: false, attentionNote: null },
  ],
}

// ── /api/ai/recruit-research ────────────────────────────────────────────────

function recruit(b: Body): CannedResponse {
  const role = str(b.jobTitle) || 'this role'
  const where = str(b.location) || 'the UK'
  const min = str(b.salaryMin) || '45,000'
  const max = str(b.salaryMax) || '55,000'
  switch (b.action) {
    case 'market-research':
      return ok({
        marketSalary: `£${min}–£${max}`,
        salaryInsight: `Your range is competitive for ${role} roles in ${where}.`,
        candidatePool: `Moderate pool in ${where}, with the strongest candidates currently employed and open to the right move.`,
        timeToHire: '6–10 weeks',
        topSkills: ['Stakeholder management', 'Data-led decision making', 'Process improvement', 'Clear written communication', 'Team leadership'],
        redFlags: ['Frequent short tenures without explanation', 'No measurable outcomes in previous roles'],
        competitorActivity: `Several growing companies in ${where} are hiring similar roles and moving quickly at offer stage.`,
        sourcingTip: 'Combine targeted outreach with referrals; passive candidates respond best to a specific, personal note.',
        interviewProcess: 'Screening call → competency interview → practical task → final with leadership',
        hiringRisk: 'Medium — good supply, but competition for the best candidates is strong',
      })
    case 'job-description':
      return ok({
        headline: `${role}: help shape how a fast-growing team works`,
        aboutRole: `We're looking for a ${role} to join us in ${where}. You'll own key outcomes from day one and work closely with leadership.\n\nThis is a hands-on role with real influence, in a team that values clear thinking and getting things done.`,
        whatYoullDo: ['Own the roadmap for your area', 'Work with teams across the business', 'Turn data into clear recommendations', 'Improve processes as we scale', 'Coach and support colleagues'],
        whatWeNeed: ['Proven experience in a similar role', 'Confident communicator at all levels', 'Comfortable with data and reporting', 'Calm under pressure'],
        whatWeOffer: [`£${min}–£${max} salary`, 'Flexible hybrid working', '25 days holiday plus bank holidays', 'Learning budget and clear progression'],
        closingLine: 'If you want your work to make a visible difference, we would love to hear from you.',
      })
    case 'candidate-personas':
      return ok([
        { name: 'A. Sharma', currentRole: `Senior ${role}`, currentCompany: 'Series B SaaS start-up', yearsExp: '7', keySkills: ['Leadership', 'Analytics', 'Process design'], standout: 'Scaled a team from 3 to 12', salaryExpectation: `£${max}`, availability: '1 month', fitScore: 9, linkedinNote: 'Active poster on industry topics' },
        { name: 'J. Okoro', currentRole: role, currentCompany: 'Mid-size agency', yearsExp: '5', keySkills: ['Client delivery', 'Reporting', 'Stakeholders'], standout: 'Strong client retention record', salaryExpectation: `£${min}`, availability: '3 months', fitScore: 8, linkedinNote: 'Recommendations from senior clients' },
        { name: 'L. Byrne', currentRole: `${role} Lead`, currentCompany: 'Enterprise software firm', yearsExp: '9', keySkills: ['Strategy', 'Budgeting', 'Hiring'], standout: 'Led a major systems migration', salaryExpectation: `£${max}+`, availability: '3 months', fitScore: 7, linkedinNote: 'Quiet profile, strong endorsements' },
        { name: 'M. Chen', currentRole: `Junior ${role}`, currentCompany: 'Scale-up fintech', yearsExp: '3', keySkills: ['Automation', 'SQL', 'Documentation'], standout: 'Fast learner, promoted within a year', salaryExpectation: `£${min}`, availability: '1 month', fitScore: 7, linkedinNote: 'Open to work badge' },
        { name: 'R. Patel', currentRole: role, currentCompany: 'Public sector body', yearsExp: '6', keySkills: ['Governance', 'Compliance', 'Change'], standout: 'Delivered a large change programme', salaryExpectation: `£${min}–£${max}`, availability: '2 months', fitScore: 8, linkedinNote: 'Detailed project history' },
      ])
    case 'interview-questions':
      return ok([
        `What drew you to this ${role} role?`,
        'Tell us about a project you led from start to finish. What was the outcome?',
        'Describe a time you changed a process. How did you bring people with you?',
        'How do you decide what to prioritise when everything feels urgent?',
        'Walk us through how you would use data to make a decision in your first month.',
        'Tell us about a time you disagreed with a senior colleague. What happened?',
        'What would you aim to achieve in your first 90 days?',
        'How do you keep stakeholders informed without overloading them?',
        'Describe a mistake you made and what you changed afterwards.',
        'What kind of team culture helps you do your best work?',
      ])
    case 'outreach':
      return ok({
        linkedinConnect: `Hi — I'm hiring a ${role} in ${where} and your background stood out. Open to a quick chat?`,
        linkedinInmail: `Hi,\n\nI'm building out our team and hiring a ${role} in ${where} (£${min}–£${max}). Your experience looks like a strong match for what we need.\n\nWould you be open to a 15-minute call this week?\n\nThanks`,
        emailSubject: `${role} opportunity: quick chat?`,
        emailBody: `Hi,\n\nI came across your profile and thought you'd be a great fit for a ${role} role we're hiring for in ${where}. It's a hands-on position with real influence and a salary of £${min}–£${max}.\n\nIf you're open to hearing more, I'd love to set up a short call.\n\nBest wishes`,
      })
    default:
      return { status: 400, json: { error: 'Unknown action' } }
  }
}

// ── football portals ────────────────────────────────────────────────────────

const NL_TEXT: Record<string, string> = {
  matchreport: 'Harfield FC secured a comfortable 2-0 home victory against Redbourne Town at Harfield Community Stadium. Liam Grady opened the scoring midway through the first half with a poacher\'s finish, before Harry Simcox doubled the advantage with a well-taken volley after the break. The result keeps the Stags firmly in the promotion picture.',
  scout: 'Redbourne Town (12th, 34pts). Formation: 4-5-1 low block. Key player: Jordan Ellis (10 goals, quick). Weaknesses: set pieces, right-back position, goalkeeper poor on crosses. Recommendation: exploit set pieces via Prescott/Dunne, play wide and deliver crosses, press their centre-backs who panic under pressure.',
  sponsor: 'Massive thank you to @HarfieldBrewery for their continued support as our main shirt sponsor! A proper local business backing a proper local football club. If you haven\'t tried their Amber Ale yet, get yourself down there! #HarfieldFC #CommunityClub #NonLeague',
}

function gpsAnalysis(p: string) {
  const list = (label: RegExp) => (p.match(label)?.[1] || '').split(/,\s*/).filter(s => s && s !== 'None')
  const high = list(/High ACWR risk \(>1\.3\): ([^\n]*?)\.\n/)
  const low = list(/Undertraining \(<0\.8 ACWR\): ([^\n]*?)\.\n/)
  return {
    session_rating: '7.5/10 — Good',
    load_summary: 'Squad load sits in a sensible range four days out from a match. Most players are in the optimal ACWR band, with a small group needing management.',
    rest_today: high.length ? high.map(h => `${h} — ACWR above 1.3, reduce volume today`) : ['No players in the high-risk zone'],
    push_harder: low.length ? low.map(l => `${l} — ACWR under 0.8, add conditioning volume`) : ['No players under-training'],
    injury_watch: high.length ? [`${high[0]} — monitor hamstring tightness after high-speed running`] : ['Monitor anyone returning from injury'],
    tomorrow_recommendation: 'Keep tomorrow at moderate intensity with a tactical focus. Limit high-speed running for the flagged players and add top-up work for the under-loaded group.',
  }
}

function socialPost(p: string) {
  const about = p.match(/Post is about: (.+?)\. Return JSON/)?.[1] || 'matchday'
  return { caption: `Big week ahead. ${about.charAt(0).toUpperCase() + about.slice(1)} — we're ready. Thanks for the incredible support, see you there.`, hashtags: ['Matchday', 'OneClub', 'TogetherStronger'] }
}

function anthropicProxy(b: Body, portal: 'football' | 'womens'): CannedResponse {
  const p = promptText(b)
  if (portal === 'football' && typeof b.type === 'string' && NL_TEXT[b.type]) return ok({ result: NL_TEXT[b.type] })
  if (portal === 'womens' && /morning summary/i.test(p)) {
    const club = p.match(/summary for (.+?) director/)?.[1] || 'Oakridge Women FC'
    const text = `Good morning. ${club} is in a safe FSR position at a 68% salary ratio. Two welfare flags need a check-in today. Next match is Saturday 12 April against Hartwell Women — confirm the travel plan and finalise the squad by Thursday.`
    return ok({ response: text, text })
  }
  if (/Analyse this training session GPS data/.test(p)) return anthropicText(JSON.stringify(gpsAnalysis(p)))
  if (/Write a social post for/.test(p)) return anthropicText(JSON.stringify(socialPost(p)))
  return DISABLED
}

const CLUB_STAFF = {
  coaching: [
    { name: 'Demo Head Coach', role: 'Head Coach', nationality: 'England', since: '2023', photo: '' },
    { name: 'Demo Assistant', role: 'Assistant Manager', nationality: 'Scotland', since: '2023', photo: '' },
    { name: 'Demo GK Coach', role: 'Goalkeeping Coach', nationality: 'Wales', since: '2021', photo: '' },
  ],
  medical: [
    { name: 'Demo Physio', role: 'Head Physio', nationality: 'England', since: '2020' },
    { name: 'Demo Sports Scientist', role: 'Sports Scientist', nationality: 'Ireland', since: '2022' },
  ],
  management: [
    { name: 'Demo Director', role: 'Director of Football', nationality: 'England', since: '2022' },
    { name: 'Demo Chief Scout', role: 'Chief Scout', nationality: 'England', since: '2019' },
  ],
  board: [
    { name: 'Demo Chair', role: 'Chairman', nationality: 'England', since: '2018', background: 'Sample board profile — live staff lookup is turned off in the demo.' },
  ],
  commercial: [
    { name: 'Demo Commercial Lead', role: 'Commercial Director', nationality: 'England', since: '2021' },
  ],
}

function comparison(b: Body) {
  const ours = str(b.ourClub) || 'Your club'
  const theirs = str(b.comparedClub) || 'the comparison club'
  return {
    summary: `${ours} and ${theirs} are closely matched on the headline numbers. ${ours} creates slightly more from open play, while ${theirs} is stronger at set pieces. This is a sample analysis: live AI analysis is turned off in the demo.`,
    keyAdvantages: ['Higher pressing intensity', 'Better chance quality from open play', 'Deeper squad rotation'],
    keyThreats: ['Set-piece delivery', 'Pace on the counter', 'Aerial strength at both ends'],
    tacticalRecommendation: 'Keep the press high to deny their build-up and defend the near post at set pieces. Attack the wide areas early before their full-backs settle.',
    predictionNextMeeting: 'A tight game, with a narrow edge to the side that wins the set-piece battle.',
  }
}

function lessonPlan(b: Body) {
  const subject = str(b.subject) || 'the subject'
  const topic = str(b.topic) || 'the topic'
  const duration = str(b.duration) || '60 minutes'
  const objective = str(b.objective) || 'meet the learning objective'
  const resources = Array.isArray(b.resources) ? b.resources.map(str).filter(Boolean) : []
  return {
    starter: `Starter (5 mins): Quick-fire recall quiz on previous ${subject} learning. Pupils discuss with talk partners what they already know about ${topic}.`,
    main: `Main Activity (${duration}):\n• Introduction (10 mins): Teacher models key concept — ${objective}\n• Independent Practice (15 mins): Pupils work through guided examples\n• Group Task (10 mins): Collaborative problem-solving activity\n• Mini-Plenary: Quick check — thumbs up/down understanding`,
    plenary: `Plenary (5 mins): Exit ticket — 3 key things learned today. Share one thing that surprised you about ${topic}.`,
    differentiation: `Support: Pre-prepared scaffolds, visual aids, adult support for key vocabulary\nCore: Independent application of ${topic} concepts\nExtension: Challenge cards requiring deeper reasoning and application to unfamiliar contexts`,
    assessment: '• Formative: Questioning during main activity, mini-plenary responses\n• Exit ticket analysis to inform next lesson\n• Peer assessment during group task',
    resources: `${resources.join(', ') || 'Whiteboard, worksheets'}, lesson slides, timer display`,
  }
}

const SAMPLE_PUPILS = [
  { name: 'Olivia Henderson', attainment: 'High', effort: 'Outstanding' },
  { name: 'Jack Thompson', attainment: 'Expected', effort: 'Good' },
  { name: 'Amara Okafor', attainment: 'Expected+', effort: 'Very Good' },
  { name: 'Ethan Morris', attainment: 'Below Expected', effort: 'Improving' },
  { name: 'Sophie Williams', attainment: 'SEND Support', effort: 'Excellent (with support)' },
]

function reportWriter(b: Body) {
  const subject = str(b.subject) || 'this subject'
  return {
    reports: SAMPLE_PUPILS.map(p => ({
      pupil: p.name, attainment: p.attainment, effort: p.effort,
      comment: `${p.name} has made ${p.attainment === 'High' ? 'excellent' : p.attainment === 'Below Expected' ? 'steady' : 'good'} progress in ${subject} this term. ${p.effort === 'Outstanding' ? 'Their enthusiasm and dedication are exemplary.' : p.effort === 'Improving' ? 'They are showing increased effort and engagement.' : 'They consistently work hard and participate well.'} Target for next term: ${p.attainment === 'High' ? 'continue to challenge themselves with extension work' : p.attainment === 'Below Expected' ? 'focus on core skills and seek support when needed' : 'build confidence in applying their learning independently'}.`,
    })),
  }
}

// ── entry point ─────────────────────────────────────────────────────────────

export function cannedFor(pathname: string, body: unknown): CannedResponse | null {
  const b: Body = body && typeof body === 'object' ? (body as Body) : {}
  switch (pathname) {
    case '/api/ai/dept-summary': {
      const dept = str(b.dept)
      const portal = str(b.portal)
      return ok(b.mode === 'insights' ? getDemoInsights(dept, portal) : getDemoSummary(dept, portal))
    }
    case '/api/ai/football-search': return footballSearch(b)
    case '/api/ai/overview': {
      const tab = str(b.tab)
      return OVERVIEW[tab] ? ok({ items: OVERVIEW[tab], tab }) : { status: 400, json: { error: 'Invalid tab' } }
    }
    case '/api/ai/recruit-research': return recruit(b)
    case '/api/ai/marketing': return anthropicText(actionConfirmation(promptText(b)))
    case '/api/ai/notifications': return anthropicText('[]')
    case '/api/ai/football':
    case '/api/ai/nonleague': return anthropicProxy(b, 'football')
    case '/api/ai/womens': return anthropicProxy(b, 'womens')
    case '/api/ai/club-staff': return ok(CLUB_STAFF)
    case '/api/football/comparison/ai-analysis': return ok(comparison(b))
    case '/api/lesson-plan': return ok(lessonPlan(b))
    case '/api/report-writer': return ok(reportWriter(b))
    // /api/tts, /api/roundup/voice-script, faq/wiki builders and everything
    // else: 503 so callers take their local / browser-speech fallback.
    default: return DISABLED
  }
}
