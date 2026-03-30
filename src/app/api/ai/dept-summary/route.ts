import { NextRequest, NextResponse } from 'next/server'

const DEPT_PROMPTS: Record<string, string> = {
  // Business
  'hr': 'You are an AI assistant for an HR manager. Summarise the 4 most important things they need to know today about their people, onboarding, leave requests and team. Be specific and actionable. Format as 4 bullet points starting with relevant emoji. Then one line starting with "⚠️ Watch out for:" as a risk item. Keep each bullet under 20 words. Be direct — no preamble.',
  'sales': 'You are an AI assistant for a sales director. Summarise the 4 most important things about pipeline, leads, deals closing and targets. Format as 4 bullet points starting with relevant emoji. Then one "⚠️ Watch out for:" risk. Keep each bullet under 20 words. Be direct.',
  'marketing': 'You are an AI assistant for a marketing manager. Summarise the 4 most important things about campaigns, content, leads and performance. Format as 4 bullet points starting with relevant emoji. Then one "⚠️ Watch out for:" risk. Keep each bullet under 20 words. Be direct.',
  'accounts': 'You are an AI assistant for a finance manager. Summarise the 4 most important things about invoices, cash flow, budget and financial performance. Format as 4 bullet points starting with relevant emoji. Then one "⚠️ Watch out for:" risk. Keep each bullet under 20 words. Be direct.',
  'operations': 'You are an AI assistant for an operations manager. Summarise the 4 most important things about workflows, processes, purchase orders and efficiency. Format as 4 bullet points starting with relevant emoji. Then one "⚠️ Watch out for:" risk. Keep each bullet under 20 words. Be direct.',
  'success': 'You are an AI assistant for a customer success leader. Summarise the 4 most important things about customer health, churn risk, NPS and renewals. Format as 4 bullet points starting with relevant emoji. Then one "⚠️ Watch out for:" risk. Keep each bullet under 20 words. Be direct.',
  'support': 'You are an AI assistant for a support manager. Summarise the 4 most important things about open tickets, response times, escalations and satisfaction. Format as 4 bullet points starting with relevant emoji. Then one "⚠️ Watch out for:" risk. Keep each bullet under 20 words. Be direct.',
  'it': 'You are an AI assistant for an IT manager. Summarise the 4 most important things about systems, security, IT requests and infrastructure. Format as 4 bullet points starting with relevant emoji. Then one "⚠️ Watch out for:" risk. Keep each bullet under 20 words. Be direct.',
  'crm': 'You are an AI assistant for a CRM manager. Summarise the 4 most important things about pipeline, contacts, deals and relationship health. Format as 4 bullet points starting with relevant emoji. Then one "⚠️ Watch out for:" risk. Keep each bullet under 20 words. Be direct.',
  'strategy': 'You are an AI assistant for a strategy director. Summarise the 4 most important things about competitive position, OKRs, market changes and strategic risks. Format as 4 bullet points starting with relevant emoji. Then one "⚠️ Watch out for:" risk. Keep each bullet under 20 words. Be direct.',
  'trials': 'You are an AI assistant for a growth manager. Summarise the 4 most important things about trial conversions, at-risk trials, onboarding progress and signup funnel. Format as 4 bullet points starting with relevant emoji. Then one "⚠️ Watch out for:" risk. Keep each bullet under 20 words. Be direct.',
  'insights': 'You are an AI assistant for a CEO. Summarise the 4 most important things about business performance, KPIs, trends and anomalies. Format as 4 bullet points starting with relevant emoji. Then one "⚠️ Watch out for:" risk. Keep each bullet under 20 words. Be direct.',
  'workflows': 'You are an AI assistant for an automation manager. Summarise the 4 most important things about workflow performance, failure rates, automation coverage and efficiency gains. Format as 4 bullet points starting with relevant emoji. Then one "⚠️ Watch out for:" risk. Keep each bullet under 20 words. Be direct.',
  'partners': 'You are an AI assistant for a partnerships manager. Summarise the 4 most important things about partner pipeline, referral revenue, relationship health and expansion. Format as 4 bullet points starting with relevant emoji. Then one "⚠️ Watch out for:" risk. Keep each bullet under 20 words. Be direct.',
  // Schools
  'school-office': 'You are an AI assistant for a school office manager. Summarise the 4 most important things about attendance, admin tasks, communications and compliance. Format as 4 bullet points starting with relevant emoji. Then one "⚠️ Watch out for:" risk. Keep each bullet under 20 words. Be direct.',
  'hr-staff': 'You are an AI assistant for a school HR lead. Summarise the 4 most important things about staff wellbeing, leave, training compliance and recruitment. Format as 4 bullet points starting with relevant emoji. Then one "⚠️ Watch out for:" risk. Keep each bullet under 20 words. Be direct.',
  'curriculum': 'You are an AI assistant for a curriculum lead. Summarise the 4 most important things about teaching quality, pupil progress, planning and resources. Format as 4 bullet points starting with relevant emoji. Then one "⚠️ Watch out for:" risk. Keep each bullet under 20 words. Be direct.',
  'safeguarding': 'You are an AI assistant for a designated safeguarding lead. Summarise the 4 most important things about concerns, referrals, DSL actions and compliance. Format as 4 bullet points starting with relevant emoji. Then one "⚠️ Watch out for:" risk. Keep each bullet under 20 words. Be direct.',
  'send-dsl': 'You are an AI assistant for a SENCO. Summarise the 4 most important things about pupil needs, EHCPs, interventions and outcomes. Format as 4 bullet points starting with relevant emoji. Then one "⚠️ Watch out for:" risk. Keep each bullet under 20 words. Be direct.',
  'finance-school': 'You are an AI assistant for a school business manager. Summarise the 4 most important things about budget, spending, forecasts and financial risks. Format as 4 bullet points starting with relevant emoji. Then one "⚠️ Watch out for:" risk. Keep each bullet under 20 words. Be direct.',
  'admissions': 'You are an AI assistant for an admissions officer. Summarise the 4 most important things about applications, enquiries, pupil numbers and conversion. Format as 4 bullet points starting with relevant emoji. Then one "⚠️ Watch out for:" risk. Keep each bullet under 20 words. Be direct.',
  'ofsted': 'You are an AI assistant for a headteacher preparing for Ofsted. Summarise the 4 most important things about inspection readiness, evidence gaps, strengths and improvement areas. Format as 4 bullet points starting with relevant emoji. Then one "⚠️ Watch out for:" risk. Keep each bullet under 20 words. Be direct.',
  'trust': 'You are an AI assistant for a MAT CEO. Summarise the 4 most important things about trust performance, school comparisons, governance and strategic priorities. Format as 4 bullet points starting with relevant emoji. Then one "⚠️ Watch out for:" risk. Keep each bullet under 20 words. Be direct.',
  'students': 'You are an AI assistant for a head of year. Summarise the 4 most important things about pupil welfare, behaviour, attendance and achievement. Format as 4 bullet points starting with relevant emoji. Then one "⚠️ Watch out for:" risk. Keep each bullet under 20 words. Be direct.',
  'wraparound': 'You are an AI assistant for a wraparound care manager. Summarise the 4 most important things about before/after school club capacity, bookings, staffing and safeguarding. Format as 4 bullet points starting with relevant emoji. Then one "⚠️ Watch out for:" risk. Keep each bullet under 20 words. Be direct.',
  'facilities-school': 'You are an AI assistant for a school site manager. Summarise the 4 most important things about building condition, maintenance tasks, health & safety and upcoming projects. Format as 4 bullet points starting with relevant emoji. Then one "⚠️ Watch out for:" risk. Keep each bullet under 20 words. Be direct.',
  'timetable': 'You are an AI assistant for a timetable manager. Summarise the 4 most important things about cover needs, room availability, clashes and teacher workload. Format as 4 bullet points starting with relevant emoji. Then one "⚠️ Watch out for:" risk. Keep each bullet under 20 words. Be direct.',
  'reports': 'You are an AI assistant for a data manager. Summarise the 4 most important things about report deadlines, data quality, assessment tracking and compliance. Format as 4 bullet points starting with relevant emoji. Then one "⚠️ Watch out for:" risk. Keep each bullet under 20 words. Be direct.',
  'classes': 'You are an AI assistant for a school administrator. Summarise the 4 most important things about class sizes, teacher allocation, room usage and pupil movement. Format as 4 bullet points starting with relevant emoji. Then one "⚠️ Watch out for:" risk. Keep each bullet under 20 words. Be direct.',
  // Football
  'squad': 'You are an AI assistant for a football manager. Summarise the 4 most important things about squad fitness, form, upcoming fixture and selection. Format as 4 bullet points starting with relevant emoji. Then one "⚠️ Watch out for:" risk. Keep each bullet under 20 words. Be direct.',
  'tactics': 'You are an AI assistant for a football tactician. Summarise the 4 most important things about formation performance, set pieces, pressing stats and opposition analysis. Format as 4 bullet points starting with relevant emoji. Then one "⚠️ Watch out for:" risk. Keep each bullet under 20 words. Be direct.',
  'medical': 'You are an AI assistant for a head of sports medicine. Summarise the 4 most important things about injuries, GPS load, return dates and wellness risks. Format as 4 bullet points starting with relevant emoji. Then one "⚠️ Watch out for:" risk. Keep each bullet under 20 words. Be direct.',
  'scouting': 'You are an AI assistant for a chief scout. Summarise the 4 most important things about targets, scout activity, market intelligence and deadlines. Format as 4 bullet points starting with relevant emoji. Then one "⚠️ Watch out for:" risk. Keep each bullet under 20 words. Be direct.',
  'academy': 'You are an AI assistant for an academy director. Summarise the 4 most important things about development progress, EPPP compliance, pathway players and youth results. Format as 4 bullet points starting with relevant emoji. Then one "⚠️ Watch out for:" risk. Keep each bullet under 20 words. Be direct.',
  'transfers': 'You are an AI assistant for a director of football. Summarise the 4 most important things about transfer pipeline status, window countdown, budget and negotiations. Format as 4 bullet points starting with relevant emoji. Then one "⚠️ Watch out for:" risk. Keep each bullet under 20 words. Be direct.',
  'analytics': 'You are an AI assistant for a performance analyst. Summarise the 4 most important things about xG, pressing intensity, formation effectiveness and next opposition. Format as 4 bullet points starting with relevant emoji. Then one "⚠️ Watch out for:" risk. Keep each bullet under 20 words. Be direct.',
  'media': 'You are an AI assistant for a media officer. Summarise the 4 most important things about press schedule, media requests, social media and communications. Format as 4 bullet points starting with relevant emoji. Then one "⚠️ Watch out for:" risk. Keep each bullet under 20 words. Be direct.',
  'matchday': 'You are an AI assistant for a matchday operations manager. Summarise the 4 most important things about next fixture preparations, ticketing, hospitality and logistics. Format as 4 bullet points starting with relevant emoji. Then one "⚠️ Watch out for:" risk. Keep each bullet under 20 words. Be direct.',
  'training': 'You are an AI assistant for a first team coach. Summarise the 4 most important things about session plans, player load, recovery schedules and focus areas. Format as 4 bullet points starting with relevant emoji. Then one "⚠️ Watch out for:" risk. Keep each bullet under 20 words. Be direct.',
  'finance-football': 'You are an AI assistant for a football club CFO. Summarise the 4 most important things about PSR position, wage bill, transfer budget and revenue vs budget. Format as 4 bullet points starting with relevant emoji. Then one "⚠️ Watch out for:" risk. Keep each bullet under 20 words. Be direct.',
  'staff-football': 'You are an AI assistant for a football club HR manager. Summarise the 4 most important things about coaching staff availability, medical team cover, scout assignments and admin. Format as 4 bullet points starting with relevant emoji. Then one "⚠️ Watch out for:" risk. Keep each bullet under 20 words. Be direct.',
  'facilities-football': 'You are an AI assistant for a football club facilities manager. Summarise the 4 most important things about pitch condition, training ground status, stadium maintenance and upcoming works. Format as 4 bullet points starting with relevant emoji. Then one "⚠️ Watch out for:" risk. Keep each bullet under 20 words. Be direct.',
}

const DEPT_CONTEXT: Record<string, string> = {
  'hr': 'Current HR data: 192 employees, 8 active onboardings, 14 pending leave requests, 3 overdue performance reviews, 2 staff on sick leave this week.',
  'sales': 'Current sales data: 34 active leads (8 hot), £128k pipeline value, 28% win rate, 6 deals in negotiation, 2 closing this week.',
  'marketing': 'Current marketing data: 42% email open rate, 124 leads from marketing this month, 8% conversion rate, 3 active campaigns, webinar next week with 89 registrations.',
  'accounts': 'Current finance data: 7 overdue invoices totalling £18,400, £42,800 collected this month, 18-day average payment time, 3 invoices due today.',
  'operations': 'Current ops data: 14 open purchase orders, 6 low-stock items (2 critical), 4 pending deliveries, £28,400 supplier invoices due.',
  'success': 'Current CS data: 181 customers total, 65% green RAG, 22% amber, 13% red, 14 renewals this month, 3 at-risk accounts need urgent QBR.',
  'support': 'Current support data: 18 open tickets (2 P1), 4-hour average response time, 91% CSAT score, 6 resolved today, 2 live chats active.',
  'it': 'Current IT data: 12 open requests, 3 pending provisioning for new starters, 184 managed devices, 4 software licences due for renewal.',
  'crm': 'Current CRM data: 171 customers, £28,400 MRR, NPS 67, 3 churn risk accounts, 3 renewals upcoming.',
  'strategy': 'Current strategy data: 3rd in market position, 2 OKRs on track, 1 behind, competitor launched new product last week.',
  'trials': 'Current trial data: 23 active trials, 8 converting soon, 34% trial conversion rate, 6 trials expiring within 3 days.',
  'insights': 'Current business data: £504k ARR, 47 active workflows, 94% workflow success rate, MRR up 12% month-on-month.',
  'workflows': 'Current workflow data: 47 active workflows, 1,840 runs this month, 94% success rate, 3 workflows failing intermittently.',
  'partners': 'Current partner data: 12 active partners, £18k referral revenue this quarter, 3 new partner applications pending.',
  'school-office': 'Current school data: 94.2% attendance rate, 12 absence notes pending, 3 communications to send, safeguarding training due for 4 staff.',
  'hr-staff': 'Current school HR data: 42 staff total, 2 on sick leave, 4 training courses overdue, 1 recruitment vacancy open.',
  'curriculum': 'Current curriculum data: 85% of lessons rated good or outstanding, 3 subject reviews due this term, new EYFS framework being implemented.',
  'safeguarding': 'Current safeguarding data: 6 open concerns, 2 LADO referrals this term, all DBS checks current, next Section 175 audit in 3 weeks.',
  'send-dsl': 'Current SEND data: 14 pupils on SEND register, 6 EHCPs, 3 annual reviews due this month, 2 new referrals pending assessment.',
  'finance-school': 'Current school finance data: £1.2M budget, 68% spent YTD, £42k underspend vs forecast, 2 grant claims outstanding.',
  'admissions': 'Current admissions data: 34 applications for reception, 89% conversion from open day, 3 appeals pending, PAN at 90% capacity.',
  'ofsted': 'Current Ofsted data: Last inspection 18 months ago (Good), 2 areas for improvement outstanding, evidence folder 78% complete.',
  'trust': 'Current trust data: 8 schools in MAT, 6 rated Good, 1 Outstanding, 1 Requires Improvement, next governance meeting in 2 weeks.',
  'students': 'Current student data: 420 pupils on roll, 3 fixed-term exclusions this term, 12 behaviour incidents this week, 94% attendance.',
  'wraparound': 'Current wraparound data: 45 breakfast club places (38 booked), 60 after-school places (52 booked), 2 staff absences to cover.',
  'facilities-school': 'Current facilities data: 3 maintenance jobs open, fire drill due this month, boiler service scheduled next week, playground resurfacing approved.',
  'timetable': 'Current timetable data: 4 cover lessons needed today, 2 room clashes resolved, 1 teacher over allocation limit.',
  'reports': 'Current reports data: End of term reports due in 3 weeks, 45% submitted, data drop next Friday, 2 assessment moderation sessions planned.',
  'classes': 'Current class data: 14 classes, average size 28.5, 2 classes over 30, 1 new pupil arriving next week.',
  'squad': 'Current squad data: 25 players, 22 fit, 3 injured (Martinez hamstring, O\'Brien ankle, Santos knee), Thompson suspended, next match Saturday vs Riverside.',
  'tactics': 'Current tactics data: 4-2-3-1 formation (68% win rate), set piece conversion 14%, opposition Riverside weak to high press (34% turnover rate).',
  'medical': 'Current medical data: 3 injured players, Santos closest to return (7 Apr), Martinez target 14 Apr, O\'Brien earliest 21 Apr, Silva on modified training.',
  'scouting': 'Current scouting data: 2 active targets (Diallo bid submitted £1.8m, Ferreira watching), 12 scout reports this month, 4 scouts active across 6 leagues.',
  'academy': 'Current academy data: 42 academy players, U21s won 3-0 (Collins hat-trick), 3 first-team ready, 4 scholarship offers out, EPPP audit next month.',
  'transfers': 'Current transfer data: £4.2m budget remaining, 1 bid submitted (Diallo — Genk countered at £2.1m), window closes in 11 days.',
  'analytics': 'Current analytics data: xG 42.6 (overperforming +5.4), xGA 28.3, 58% possession avg, 84% pass accuracy, right-side attacks 43% of chances.',
  'media': 'Current media data: press conference at 2pm today, 4 media requests pending (BBC, Sky, local gazette), social followers 124k (+18% engagement).',
  'matchday': 'Current matchday data: Riverside United at home Saturday 3pm, expected attendance 8,200, corporate hospitality 94% full, 14/22 ops checklist items done.',
  'training': 'Current training data: tactical session at 10am (pressing triggers), set pieces at 11:30, recovery group (3 players) in gym from 9am, avg load 72%.',
  'finance-football': 'Current club finance data: £4.2m transfer budget, £2.1m/yr wage bill (62% of revenue, target 60%), £3.4m revenue YTD, matchday revenue up 8%.',
  'staff-football': 'Current staff data: 8 coaching staff, 4 medical team, 4 scouts, 32 total staff, GK coach on UEFA Pro course Mon-Wed, head physio holiday 14-18 Apr.',
  'facilities-football': 'Current facilities data: main pitch excellent (re-seeded Tue), training pitch 2 waterlogged, CCTV upgrade next week, floodlight inspection passed.',
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.dept) return NextResponse.json({ error: 'Missing dept' }, { status: 400 })

  const { dept, mode } = body as { dept: string; mode?: 'summary' | 'insights'; period?: string; portal?: string }
  const systemPrompt = DEPT_PROMPTS[dept]
  const context = DEPT_CONTEXT[dept]

  if (!systemPrompt) return NextResponse.json({ error: `Unknown department: ${dept}` }, { status: 400 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    // Fallback when no API key — return template response
    return NextResponse.json({
      bullets: [
        '📊 Key metrics are trending in the right direction this week',
        '✅ No critical issues requiring immediate attention',
        '📈 Performance is above target across core KPIs',
        '👥 Team capacity is healthy with no resource gaps',
      ],
      watchOut: '⚠️ Watch out for: end-of-month reporting deadline approaching — ensure all data is current',
    })
  }

  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const client = new Anthropic({ apiKey })

    if (mode === 'insights') {
      const { period = 'This Month' } = body
      const insightsPrompt = `You are an AI business analyst generating a department insights report. Generate a JSON object with these fields:
- "executiveSummary": 2-3 sentence overview of department performance for ${period}
- "achievements": array of 3 strings (what went well, start with ✅)
- "improvements": array of 3 strings (what needs attention, start with 🔶)
- "risks": array of 1-2 strings (flagged risks, start with 🔴)
- "actions": array of 4 strings (recommended actions, start with ➡️, prioritised by impact)
Return ONLY valid JSON, no markdown.`

      const message = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: insightsPrompt,
        messages: [{ role: 'user', content: `Department: ${dept}. Period: ${period}. Context: ${context || 'General department data.'}. Generate the insights report.` }],
      })

      const text = message.content.find(b => b.type === 'text')
      if (!text || text.type !== 'text') return NextResponse.json({ error: 'No response' }, { status: 500 })

      try {
        const parsed = JSON.parse(text.text)
        return NextResponse.json(parsed)
      } catch {
        return NextResponse.json({
          executiveSummary: text.text.slice(0, 300),
          achievements: ['✅ Department performing within expected parameters'],
          improvements: ['🔶 Review data quality for more specific insights'],
          risks: ['🔴 No critical risks identified'],
          actions: ['➡️ Schedule department review meeting'],
        })
      }
    }

    // Default: summary mode
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: 'user', content: context || 'Generate the summary based on typical department data.' }],
    })

    const text = message.content.find(b => b.type === 'text')
    if (!text || text.type !== 'text') return NextResponse.json({ error: 'No response' }, { status: 500 })

    const lines = text.text.split('\n').filter(l => l.trim())
    const watchOutLine = lines.find(l => l.includes('Watch out') || l.includes('⚠️'))
    const bullets = lines.filter(l => l !== watchOutLine && l.trim().length > 0).slice(0, 4)

    return NextResponse.json({
      bullets,
      watchOut: watchOutLine || '⚠️ Watch out for: no specific risks flagged at this time',
    })
  } catch (error: unknown) {
    console.error('[ai/dept-summary]', error)
    const msg = error instanceof Error ? error.message : 'AI generation failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
