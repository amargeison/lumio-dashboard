'use client'
import { useRef, useState, useCallback } from 'react'

export type VoiceCommandResult = {
  command: string
  action: string
  response: string
  payload?: Record<string, any>
  data?: Record<string, any>
}

const TEAM_MEMBERS = [
  { name: 'Sarah', fullName: 'Sarah Chen', phone: '+447700900001', email: 'sarah@company.com' },
  { name: 'Marcus', fullName: 'Marcus Webb', phone: '+447700900002', email: 'marcus@company.com' },
  { name: 'Dan', fullName: 'Dan Marsh', phone: '+447700900003', email: 'dan@company.com' },
  { name: 'Sophie', fullName: 'Sophie Bell', phone: '+447700900004', email: 'sophie@company.com' },
  { name: 'James', fullName: 'James Harlow', phone: '+447700900005', email: 'james@company.com' },
  { name: 'Tom', fullName: 'Tom Rashid', phone: '+447700900007', email: 'tom@company.com' },
]

function findMember(text: string) {
  return TEAM_MEMBERS.find(m => text.toLowerCase().includes(m.name.toLowerCase()))
}

function extractName(text: string, prefixes: string[]): string | null {
  const lower = text.toLowerCase()
  for (const p of prefixes) {
    const idx = lower.indexOf(p)
    if (idx >= 0) { const w = text.slice(idx + p.length).trim().split(/[\s,.!?]/)[0]; if (w.length > 1) return w.charAt(0).toUpperCase() + w.slice(1) }
  }
  return findMember(text)?.name || null
}

const COMMANDS: { patterns: RegExp[]; action: string; response: (m: RegExpMatchArray, t: string) => string; data?: (m: RegExpMatchArray, t: string) => Record<string, any> }[] = [
  // ─── EXISTING CORE COMMANDS ────────────────────────────────────────────────
  { patterns: [/play.*brief/i, /morning brief/i, /start brief/i], action: 'PLAY_BRIEFING', response: () => 'Starting your briefing now.' },
  { patterns: [/^stop$/i, /^pause$/i, /^quiet$/i], action: 'STOP_AUDIO', response: () => 'Stopping.' },
  { patterns: [/go to (\w+)/i, /open (\w+)/i], action: 'NAVIGATE', response: (m) => `Navigating to ${m[1]}.`, data: (m) => ({ dept: m[1].toLowerCase() }) },
  { patterns: [/send slack/i, /slack message/i, /message.*slack/i, /slack to (\w+)/i], action: 'SEND_SLACK', response: (_m, t) => { const n = extractName(t, ['to ']); return n ? `Opening Slack message to ${n}.` : 'Who would you like to Slack?' }, data: (_m, t) => ({ recipient: extractName(t, ['to ']) }) },
  { patterns: [/phone call/i, /call (\w+)/i, /ring (\w+)/i, /dial/i], action: 'PHONE_CALL', response: (_m, t) => { const m = findMember(t); return m ? `Calling ${m.fullName} now.` : 'What number would you like to call?' }, data: (_m, t) => { const m = findMember(t); return m ? { name: m.fullName, phone: m.phone } : {} } },
  { patterns: [/i'?m ill/i, /i'?m sick/i, /i feel sick/i, /i'?m not well/i, /report sick/i, /i can'?t come in/i, /i won'?t be in/i], action: 'REPORT_SICK', response: () => "Sorry to hear that. I'll log your absence and let your manager know. Should I also notify the team on Slack?" },
  { patterns: [/book holiday/i, /request leave/i, /book time off/i, /annual leave/i], action: 'BOOK_HOLIDAY', response: () => "Opening the leave request form for you now." },
  { patterns: [/claim expense/i, /log expense/i, /submit expense/i, /expense report/i], action: 'CLAIM_EXPENSE', response: () => "Opening the expense form now." },
  { patterns: [/new joiner/i, /new starter/i, /onboard someone/i, /new team member/i, /new hire/i], action: 'NEW_JOINER', response: (_m, t) => { const n = extractName(t, ['for ', 'named ']); return n ? `Adding ${n} to onboarding.` : 'Opening the new joiner form.' }, data: (_m, t) => ({ name: extractName(t, ['for ', 'named ']) }) },
  { patterns: [/book.*meeting/i, /schedule.*meeting/i, /arrange.*meeting/i], action: 'BOOK_MEETING', response: (_m, t) => { const n = extractName(t, ['with ']); return n ? `Booking a meeting with ${n}.` : 'Opening the meeting scheduler.' }, data: (_m, t) => ({ attendee: extractName(t, ['with ']) }) },
  { patterns: [/send.*email/i, /email (\w+)/i, /email my team/i], action: 'SEND_EMAIL', response: (_m, t) => { const n = extractName(t, ['email ']); return n ? `Opening email to ${n}.` : t.match(/my team/i) ? 'Opening email to your team.' : 'Who would you like to email?' }, data: (_m, t) => ({ recipient: t.match(/my team/i) ? 'team' : extractName(t, ['email ']) }) },
  { patterns: [/new (invoice|lead|deal|ticket|client|campaign|project)/i, /create (invoice|lead|deal|ticket|client|campaign|project)/i], action: 'OPEN_MODAL', response: (m) => `Opening new ${m[1]} form.`, data: (m) => ({ modal: m[1].toLowerCase() }) },
  { patterns: [/chase invoice/i, /chase payment/i, /payment reminder/i], action: 'CHASE_INVOICE', response: () => 'Opening the chase payment form.' },
  { patterns: [/competitor/i], action: 'COMPETITOR_WATCH', response: () => 'Opening competitor intelligence.' },
  { patterns: [/team event/i, /team outing/i, /team lunch/i, /team drinks/i], action: 'TEAM_EVENT', response: () => 'Opening the team events researcher.' },
  { patterns: [/what.*time/i], action: 'TELL_TIME', response: () => `It's ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}.` },
  { patterns: [/how many email/i, /check.*email/i], action: 'EMAIL_COUNT', response: () => 'You have 12 emails, 3 marked urgent.' },
  { patterns: [/add task (.+)/i, /add (.+) to (?:my )?tasks/i], action: 'ADD_TASK', response: (m) => `Got it — I've added "${m[1]}" to your daily tasks.`, data: (m) => ({ taskName: m[1] }) },
  { patterns: [/read (?:my )?tasks/i, /what.*(?:my )?tasks/i, /list (?:my )?tasks/i], action: 'READ_TASKS', response: () => 'Reading your tasks now.' },
  { patterns: [/read (?:my )?quick wins/i, /what.*quick wins/i, /list (?:my )?quick wins/i], action: 'READ_QUICK_WINS', response: () => 'Reading your quick wins now.' },
  { patterns: [/what (?:do i|have i) (?:got )?on today/i, /what.*on today/i, /today'?s schedule/i, /what'?s on/i], action: 'READ_TODAY', response: () => 'Here\'s your day at a glance.' },

  // ─── SALES & PIPELINE ──────────────────────────────────────────────────────
  { patterns: [/show me the pipeline/i, /show the pipeline/i, /open the pipeline/i], action: 'NAVIGATE', response: () => 'Opening the sales pipeline.', data: () => ({ dept: 'sales' }) },
  { patterns: [/what'?s in the pipeline/i, /whats in the pipeline/i, /pipeline status/i], action: 'PIPELINE_INFO', response: () => 'Your pipeline has 23 deals worth £184,000 total.' },
  { patterns: [/how many open deals/i, /how many deals are open/i, /open deals/i], action: 'PIPELINE_INFO', response: () => 'You have 23 open deals with a combined value of £184,000.' },
  { patterns: [/show hot leads/i, /hot leads/i, /show me hot leads/i], action: 'PIPELINE_FILTER', response: () => 'Filtering to hot leads.', data: () => ({ filter: 'hot' }) },
  { patterns: [/what'?s our win rate/i, /whats our win rate/i, /win rate/i], action: 'SALES_INFO', response: () => 'Your current win rate is 34 percent.' },
  { patterns: [/show deals closing this week/i, /deals closing this week/i, /closing this week/i], action: 'PIPELINE_FILTER', response: () => 'Showing deals closing this week.', data: () => ({ filter: 'closing_this_week' }) },
  { patterns: [/add a new deal/i, /create a deal/i, /new deal form/i], action: 'OPEN_MODAL', response: () => 'Opening new deal form.', data: () => ({ modal: 'deal' }) },
  { patterns: [/log a call/i, /log call/i, /record a call/i], action: 'OPEN_MODAL', response: () => 'Opening call log form.', data: () => ({ modal: 'call' }) },
  { patterns: [/send a proposal/i, /create a proposal/i, /build a proposal/i], action: 'OPEN_MODAL', response: () => 'Opening proposal builder.', data: () => ({ modal: 'proposal' }) },
  { patterns: [/book a demo/i, /schedule a demo/i, /arrange a demo/i], action: 'OPEN_MODAL', response: () => 'Opening demo booking.', data: () => ({ modal: 'demo' }) },
  { patterns: [/show the sales forecast/i, /sales forecast/i, /show me the forecast/i], action: 'NAVIGATE', response: () => 'Opening sales forecast.', data: () => ({ dept: 'sales' }) },
  { patterns: [/what'?s our monthly recurring revenue/i, /whats our monthly recurring revenue/i, /show mrr/i, /what'?s our mrr/i], action: 'SALES_INFO', response: () => 'Monthly recurring revenue is £42,000.' },
  { patterns: [/show me lost deals/i, /show lost deals/i, /lost deals/i], action: 'PIPELINE_FILTER', response: () => 'Showing lost deals.', data: () => ({ filter: 'lost' }) },
  { patterns: [/who are our top prospects/i, /top prospects/i, /best prospects/i], action: 'SALES_INFO', response: () => 'Top 5 prospects by value listed.' },
  { patterns: [/show deals by stage/i, /deals by stage/i, /group deals by stage/i], action: 'PIPELINE_FILTER', response: () => 'Grouping deals by stage.', data: () => ({ filter: 'by_stage' }) },
  { patterns: [/how many demos this week/i, /demos this week/i, /upcoming demos/i], action: 'SALES_INFO', response: () => 'You have 4 demos scheduled this week.' },
  { patterns: [/show stale deals/i, /stale deals/i, /inactive deals/i], action: 'PIPELINE_FILTER', response: () => 'Showing deals with no activity in 14 days or more.', data: () => ({ filter: 'stale' }) },
  { patterns: [/what'?s the average deal size/i, /whats the average deal size/i, /average deal size/i], action: 'SALES_INFO', response: () => 'Average deal size is £8,000.' },
  { patterns: [/show me the sales leaderboard/i, /sales leaderboard/i, /team performance/i], action: 'NAVIGATE', response: () => 'Opening team performance.', data: () => ({ dept: 'sales' }) },
  { patterns: [/open the crm/i, /show the crm/i, /launch crm/i], action: 'NAVIGATE', response: () => 'Opening the CRM.', data: () => ({ dept: 'sales' }) },
  { patterns: [/find a contact/i, /search contacts/i, /contact search/i], action: 'NAVIGATE', response: () => 'Opening contact search.', data: () => ({ dept: 'sales' }) },
  { patterns: [/add a new contact/i, /create a contact/i, /new contact form/i], action: 'OPEN_MODAL', response: () => 'Opening new contact form.', data: () => ({ modal: 'client' }) },
  { patterns: [/show recent activity/i, /recent activity/i, /activity feed/i], action: 'NAVIGATE', response: () => 'Opening activity feed.', data: () => ({ dept: 'overview' }) },
  { patterns: [/what'?s due today in sales/i, /whats due today in sales/i, /sales tasks due today/i], action: 'SALES_INFO', response: () => 'You have 3 sales tasks due today.' },
  { patterns: [/show me referral leads/i, /referral leads/i, /leads from referrals/i], action: 'PIPELINE_FILTER', response: () => 'Filtering leads by source: referral.', data: () => ({ filter: 'referral' }) },
  { patterns: [/how many trials are active/i, /active trials/i, /trial accounts/i], action: 'SALES_INFO', response: () => '8 trial accounts currently active.' },
  { patterns: [/show expiring trials/i, /expiring trials/i, /trials expiring soon/i], action: 'PIPELINE_FILTER', response: () => 'Showing trials expiring in the next 7 days.', data: () => ({ filter: 'expiring_trials' }) },
  { patterns: [/show the rfp builder/i, /rfp builder/i, /open rfp/i], action: 'NAVIGATE', response: () => 'Opening RFP builder.', data: () => ({ dept: 'sales' }) },
  { patterns: [/who hasn'?t been contacted this week/i, /who hasnt been contacted this week/i, /uncontacted this week/i], action: 'SALES_INFO', response: () => '5 contacts have had no activity this week.' },

  // ─── FINANCE & ACCOUNTS ────────────────────────────────────────────────────
  { patterns: [/show me the accounts/i, /show the accounts/i, /open accounts/i], action: 'NAVIGATE', response: () => 'Opening accounts.', data: () => ({ dept: 'accounts' }) },
  { patterns: [/what'?s our revenue this month/i, /whats our revenue this month/i, /revenue this month/i, /monthly revenue/i], action: 'FINANCE_INFO', response: () => 'Month-to-date revenue is £38,000.' },
  { patterns: [/show outstanding invoices/i, /outstanding invoices/i, /unpaid invoices/i], action: 'NAVIGATE', response: () => 'Opening outstanding invoices.', data: () => ({ dept: 'accounts' }) },
  { patterns: [/how much do we have in the bank/i, /bank balance/i, /cash position/i, /how much in the bank/i], action: 'FINANCE_INFO', response: () => 'Current cash position is £124,000.' },
  { patterns: [/what'?s our burn rate/i, /whats our burn rate/i, /burn rate/i], action: 'FINANCE_INFO', response: () => 'Monthly burn rate is £31,000.' },
  { patterns: [/show me the p and l/i, /show the p and l/i, /profit and loss/i, /p and l/i, /p&l/i], action: 'NAVIGATE', response: () => 'Opening profit and loss.', data: () => ({ dept: 'accounts' }) },
  { patterns: [/are we profitable/i, /are we making money/i, /profitability/i], action: 'FINANCE_INFO', response: () => 'Yes. Operating profit this quarter is £22,000.' },
  { patterns: [/show overdue invoices/i, /overdue invoices/i, /late invoices/i], action: 'NAVIGATE', response: () => 'Filtering to overdue invoices.', data: () => ({ dept: 'accounts' }) },
  { patterns: [/how much are we owed/i, /total receivables/i, /outstanding receivables/i], action: 'FINANCE_INFO', response: () => 'Total outstanding receivables: £67,000.' },
  { patterns: [/what'?s our runway/i, /whats our runway/i, /cash runway/i], action: 'FINANCE_INFO', response: () => 'At current burn rate, you have 4 months of runway.' },
  { patterns: [/show the q two report/i, /q2 report/i, /quarterly report/i], action: 'NAVIGATE', response: () => 'Opening Q2 report.', data: () => ({ dept: 'accounts' }) },
  { patterns: [/open the board report/i, /board report/i, /board report builder/i], action: 'NAVIGATE', response: () => 'Opening board report builder.', data: () => ({ dept: 'accounts' }) },
  { patterns: [/show operating costs/i, /operating costs/i, /cost breakdown/i], action: 'NAVIGATE', response: () => 'Opening cost breakdown.', data: () => ({ dept: 'accounts' }) },
  { patterns: [/what'?s our gross margin/i, /whats our gross margin/i, /gross margin/i], action: 'FINANCE_INFO', response: () => 'Gross margin is 68 percent.' },
  { patterns: [/show payroll this month/i, /payroll this month/i, /payroll view/i], action: 'NAVIGATE', response: () => 'Opening payroll view.', data: () => ({ dept: 'accounts' }) },
  { patterns: [/when is the next invoice due/i, /next invoice due/i, /next invoice/i], action: 'FINANCE_INFO', response: () => 'Next invoice due is £4,200 on Friday.' },
  { patterns: [/show me the budget/i, /show the budget/i, /open budget/i, /budget view/i], action: 'NAVIGATE', response: () => 'Opening budget view.', data: () => ({ dept: 'accounts' }) },
  { patterns: [/are we on track for the quarter/i, /on track this quarter/i, /quarterly target/i], action: 'FINANCE_INFO', response: () => 'Revenue is 92 percent of quarterly target.' },
  { patterns: [/show expense claims/i, /expense claims/i, /open expenses/i], action: 'NAVIGATE', response: () => 'Opening expenses.', data: () => ({ dept: 'accounts' }) },
  { patterns: [/approve the payroll/i, /payroll approval/i, /approve payroll/i], action: 'NAVIGATE', response: () => 'Opening payroll approval.', data: () => ({ dept: 'accounts' }) },

  // ─── HR & PEOPLE ───────────────────────────────────────────────────────────
  { patterns: [/show me the team/i, /show the team/i, /team view/i], action: 'NAVIGATE', response: () => 'Opening the team view.', data: () => ({ dept: 'hr' }) },
  { patterns: [/how many staff do we have/i, /how many employees/i, /headcount/i, /staff count/i], action: 'HR_INFO', response: () => 'Current headcount is 24 full-time staff.' },
  { patterns: [/show open roles/i, /open roles/i, /current vacancies/i, /open vacancies/i], action: 'NAVIGATE', response: () => 'Opening current vacancies.', data: () => ({ dept: 'hr' }) },
  { patterns: [/who is on leave today/i, /who'?s on leave/i, /whos on leave/i, /who is off today/i], action: 'HR_INFO', response: () => 'Sarah Chen and Dan Marsh are on leave today.' },
  { patterns: [/show the org chart/i, /org chart/i, /organisation chart/i, /organization chart/i], action: 'NAVIGATE', response: () => 'Opening org chart.', data: () => ({ dept: 'hr' }) },
  { patterns: [/run a recruitment search/i, /recruitment search/i, /recruitment researcher/i], action: 'NAVIGATE', response: () => 'Opening recruitment researcher.', data: () => ({ dept: 'hr' }) },
  { patterns: [/who has a birthday this week/i, /birthdays this week/i, /any birthdays/i], action: 'HR_INFO', response: () => 'Sophie Bell has a birthday this Thursday.' },
  { patterns: [/show probation reviews due/i, /probation reviews/i, /probation review/i], action: 'NAVIGATE', response: () => 'Showing probation reviews.', data: () => ({ dept: 'hr' }) },
  { patterns: [/who started recently/i, /new starters/i, /recent joiners/i], action: 'HR_INFO', response: () => '2 new starters in the last 30 days.' },
  { patterns: [/show the team calendar/i, /team calendar/i, /open team calendar/i], action: 'NAVIGATE', response: () => 'Opening team calendar.', data: () => ({ dept: 'hr' }) },
  { patterns: [/open the staff directory/i, /staff directory/i, /employee directory/i], action: 'NAVIGATE', response: () => 'Opening staff directory.', data: () => ({ dept: 'hr' }) },
  { patterns: [/show performance reviews/i, /performance reviews/i, /appraisals/i], action: 'NAVIGATE', response: () => 'Opening performance reviews.', data: () => ({ dept: 'hr' }) },
  { patterns: [/add a team member/i, /add team member/i, /add new staff/i], action: 'NEW_JOINER', response: () => 'Opening new joiner form.' },
  { patterns: [/show training records/i, /training records/i, /training tracker/i], action: 'NAVIGATE', response: () => 'Opening training tracker.', data: () => ({ dept: 'hr' }) },
  { patterns: [/who has outstanding onboarding/i, /outstanding onboarding/i, /incomplete onboarding/i], action: 'HR_INFO', response: () => '1 team member has incomplete onboarding tasks.' },
  { patterns: [/show the payroll summary/i, /payroll summary/i, /payroll overview/i], action: 'NAVIGATE', response: () => 'Opening payroll overview.', data: () => ({ dept: 'accounts' }) },
  { patterns: [/open the hr dashboard/i, /hr dashboard/i, /show hr/i], action: 'NAVIGATE', response: () => 'Opening HR dashboard.', data: () => ({ dept: 'hr' }) },
  { patterns: [/show holiday allowances/i, /holiday allowances/i, /leave allowances/i], action: 'NAVIGATE', response: () => 'Showing holiday allowances.', data: () => ({ dept: 'hr' }) },
  { patterns: [/who is working remotely today/i, /who'?s remote today/i, /whos remote/i, /working from home/i], action: 'HR_INFO', response: () => '3 team members working remotely today.' },
  { patterns: [/show headcount by department/i, /headcount by department/i, /staff by department/i], action: 'NAVIGATE', response: () => 'Showing headcount by department.', data: () => ({ dept: 'hr' }) },

  // ─── OPERATIONS & PROJECTS ─────────────────────────────────────────────────
  { patterns: [/show me operations/i, /show operations/i, /open operations/i], action: 'NAVIGATE', response: () => 'Opening operations.', data: () => ({ dept: 'operations' }) },
  { patterns: [/what projects are active/i, /active projects/i, /how many projects/i], action: 'OPS_INFO', response: () => 'You have 6 active projects.' },
  { patterns: [/what'?s overdue/i, /whats overdue/i, /overdue tasks/i, /show overdue/i], action: 'OPS_INFO', response: () => '3 tasks are overdue across departments.' },
  { patterns: [/show the weekly priorities/i, /weekly priorities/i, /this week'?s priorities/i], action: 'NAVIGATE', response: () => 'Opening weekly priorities.', data: () => ({ dept: 'overview' }) },
  { patterns: [/open the workflow library/i, /workflow library/i, /show workflows/i], action: 'NAVIGATE', response: () => 'Opening workflow library.', data: () => ({ dept: 'workflows' }) },
  { patterns: [/show system status/i, /system status/i, /systems status/i], action: 'OPS_INFO', response: () => 'All systems operational. 4 integrations connected.' },
  { patterns: [/what workflows are running/i, /running workflows/i, /active workflows/i], action: 'OPS_INFO', response: () => '12 automated workflows currently active.' },
  { patterns: [/show me the roadmap/i, /show the roadmap/i, /open roadmap/i], action: 'NAVIGATE', response: () => 'Opening the roadmap.', data: () => ({ dept: 'operations' }) },
  { patterns: [/open the company wiki/i, /company wiki/i, /open wiki/i], action: 'NAVIGATE', response: () => 'Opening company wiki.', data: () => ({ dept: 'operations' }) },
  { patterns: [/show the meeting schedule/i, /meeting schedule/i, /upcoming meetings/i], action: 'NAVIGATE', response: () => 'Opening meetings.', data: () => ({ dept: 'overview' }) },
  { patterns: [/book a meeting room/i, /reserve a room/i, /room booking/i], action: 'BOOK_MEETING', response: () => 'Opening room booking.' },
  { patterns: [/set a reminder/i, /remind me/i, /create a reminder/i], action: 'ADD_TASK', response: () => 'Opening reminder form.' },
  { patterns: [/show pending approvals/i, /pending approvals/i, /awaiting approval/i], action: 'OPS_INFO', response: () => '2 items waiting for sign-off.' },
  { patterns: [/what'?s the team working on/i, /whats the team working on/i, /team workload/i], action: 'OPS_INFO', response: () => 'Opening current task distribution.' },
  { patterns: [/open the project tracker/i, /project tracker/i, /show project tracker/i], action: 'NAVIGATE', response: () => 'Opening project tracker.', data: () => ({ dept: 'operations' }) },
  { patterns: [/show blockers/i, /any blockers/i, /blocked items/i], action: 'OPS_INFO', response: () => '1 item currently flagged as blocked.' },
  { patterns: [/add a task/i, /create a task/i, /new task/i], action: 'ADD_TASK', response: () => 'Opening task form.' },
  { patterns: [/mark as complete/i, /mark done/i, /task complete/i, /mark it done/i], action: 'TASK_COMPLETE', response: () => 'Marking the most recent task as done.' },
  { patterns: [/show me this week'?s tasks/i, /show me this weeks tasks/i, /tasks this week/i], action: 'NAVIGATE', response: () => 'Showing this week\'s tasks.', data: () => ({ dept: 'overview' }) },
  { patterns: [/open the daily standup/i, /daily standup/i, /standup view/i], action: 'NAVIGATE', response: () => 'Opening standup view.', data: () => ({ dept: 'overview' }) },

  // ─── MARKETING ─────────────────────────────────────────────────────────────
  { patterns: [/show me marketing/i, /show marketing/i, /open marketing/i], action: 'NAVIGATE', response: () => 'Opening marketing.', data: () => ({ dept: 'marketing' }) },
  { patterns: [/how is the website performing/i, /website performance/i, /website stats/i], action: 'MARKETING_INFO', response: () => 'Website had 12,400 visitors this month, up 8 percent.' },
  { patterns: [/show our social media/i, /social media/i, /social media tracker/i], action: 'NAVIGATE', response: () => 'Opening social media tracker.', data: () => ({ dept: 'marketing' }) },
  { patterns: [/what'?s our conversion rate/i, /whats our conversion rate/i, /conversion rate/i], action: 'MARKETING_INFO', response: () => 'Lead to customer conversion rate is 12 percent.' },
  { patterns: [/show email campaigns/i, /email campaigns/i, /open email campaigns/i], action: 'NAVIGATE', response: () => 'Opening email campaigns.', data: () => ({ dept: 'marketing' }) },
  { patterns: [/how many leads this month/i, /leads this month/i, /new leads this month/i], action: 'MARKETING_INFO', response: () => '34 new leads this month.' },
  { patterns: [/show me the content calendar/i, /content calendar/i, /open content calendar/i], action: 'NAVIGATE', response: () => 'Opening content calendar.', data: () => ({ dept: 'marketing' }) },
  { patterns: [/what'?s our best performing channel/i, /whats our best performing channel/i, /best channel/i, /top channel/i], action: 'MARKETING_INFO', response: () => 'Organic search is your top lead source at 42 percent.' },
  { patterns: [/show google analytics/i, /google analytics/i, /open analytics/i], action: 'NAVIGATE', response: () => 'Opening analytics integration.', data: () => ({ dept: 'marketing' }) },
  { patterns: [/how many subscribers do we have/i, /email subscribers/i, /subscriber count/i], action: 'MARKETING_INFO', response: () => 'Email list has 2,400 subscribers.' },
  { patterns: [/show the seo dashboard/i, /seo dashboard/i, /open seo/i], action: 'NAVIGATE', response: () => 'Opening SEO dashboard.', data: () => ({ dept: 'marketing' }) },
  { patterns: [/open the brand guidelines/i, /brand guidelines/i, /brand assets/i], action: 'NAVIGATE', response: () => 'Opening brand assets.', data: () => ({ dept: 'marketing' }) },
  { patterns: [/show campaign performance/i, /campaign performance/i, /campaign metrics/i], action: 'NAVIGATE', response: () => 'Opening campaign metrics.', data: () => ({ dept: 'marketing' }) },
  { patterns: [/how much are we spending on ads/i, /ad spend/i, /advertising spend/i], action: 'MARKETING_INFO', response: () => 'Paid advertising spend this month is £3,200.' },
  { patterns: [/show the press coverage/i, /press coverage/i, /pr tracker/i], action: 'NAVIGATE', response: () => 'Opening PR tracker.', data: () => ({ dept: 'marketing' }) },
  { patterns: [/what'?s our cac/i, /whats our cac/i, /customer acquisition cost/i], action: 'MARKETING_INFO', response: () => 'Customer acquisition cost is £340.' },
  { patterns: [/show testimonials and reviews/i, /testimonials/i, /reviews and testimonials/i, /social proof/i], action: 'NAVIGATE', response: () => 'Opening social proof.', data: () => ({ dept: 'marketing' }) },
  { patterns: [/schedule a post/i, /social scheduling/i, /schedule social post/i], action: 'NAVIGATE', response: () => 'Opening social scheduling.', data: () => ({ dept: 'marketing' }) },
  { patterns: [/show the marketing budget/i, /marketing budget/i, /marketing spend/i], action: 'NAVIGATE', response: () => 'Opening marketing spend.', data: () => ({ dept: 'marketing' }) },
  { patterns: [/open the case studies/i, /case studies/i, /case study library/i], action: 'NAVIGATE', response: () => 'Opening case study library.', data: () => ({ dept: 'marketing' }) },

  // ─── CUSTOMER SUCCESS ──────────────────────────────────────────────────────
  { patterns: [/show me customer success/i, /show customer success/i, /open customer success/i], action: 'NAVIGATE', response: () => 'Opening customer success.', data: () => ({ dept: 'success' }) },
  { patterns: [/how many customers do we have/i, /customer count/i, /active customers/i], action: 'CS_INFO', response: () => 'You have 142 active customers.' },
  { patterns: [/show at risk accounts/i, /at risk accounts/i, /at-risk accounts/i, /risky accounts/i], action: 'NAVIGATE', response: () => 'Filtering to at-risk accounts.', data: () => ({ dept: 'success' }) },
  { patterns: [/what'?s our churn rate/i, /whats our churn rate/i, /churn rate/i], action: 'CS_INFO', response: () => 'Monthly churn rate is 2.1 percent.' },
  { patterns: [/show nps scores/i, /nps scores/i, /nps dashboard/i, /net promoter/i], action: 'NAVIGATE', response: () => 'Opening NPS dashboard.', data: () => ({ dept: 'success' }) },
  { patterns: [/who needs a check in/i, /who needs a checkin/i, /customers needing contact/i, /overdue check-?ins/i], action: 'CS_INFO', response: () => '8 customers haven\'t been contacted in over 30 days.' },
  { patterns: [/show the support queue/i, /support queue/i, /open support/i], action: 'NAVIGATE', response: () => 'Opening support queue.', data: () => ({ dept: 'support' }) },
  { patterns: [/how many tickets are open/i, /open tickets/i, /support tickets/i], action: 'CS_INFO', response: () => '14 open support tickets.' },
  { patterns: [/show me renewals this quarter/i, /renewals this quarter/i, /upcoming renewals/i], action: 'NAVIGATE', response: () => 'Showing renewals this quarter.', data: () => ({ dept: 'success' }) },
  { patterns: [/what'?s our csat/i, /whats our csat/i, /csat score/i, /customer satisfaction/i], action: 'CS_INFO', response: () => 'Customer satisfaction score is 4.6 out of 5.' },
  { patterns: [/show onboarding progress/i, /onboarding progress/i, /onboarding tracker/i], action: 'NAVIGATE', response: () => 'Opening onboarding tracker.', data: () => ({ dept: 'success' }) },
  { patterns: [/who is our biggest customer/i, /largest customer/i, /biggest customer/i, /top customer/i], action: 'CS_INFO', response: () => 'Your largest customer by ARR is Meridian Group at £18,000 per year.' },
  { patterns: [/show customer health scores/i, /customer health scores/i, /health score dashboard/i, /health scores/i], action: 'NAVIGATE', response: () => 'Opening health score dashboard.', data: () => ({ dept: 'success' }) },
  { patterns: [/log a customer call/i, /customer call log/i, /log customer call/i], action: 'OPEN_MODAL', response: () => 'Opening call log.', data: () => ({ modal: 'call' }) },
  { patterns: [/show usage data/i, /usage data/i, /usage analytics/i], action: 'NAVIGATE', response: () => 'Opening usage analytics.', data: () => ({ dept: 'success' }) },
  { patterns: [/who hasn'?t logged in recently/i, /who hasnt logged in/i, /inactive users/i, /users not logged in/i], action: 'CS_INFO', response: () => '6 customers haven\'t logged in for 14 or more days.' },
  { patterns: [/show upsell opportunities/i, /upsell opportunities/i, /expansion opportunities/i], action: 'NAVIGATE', response: () => 'Filtering expansion opportunities.', data: () => ({ dept: 'success' }) },
  { patterns: [/open the playbook/i, /cs playbook/i, /customer success playbook/i], action: 'NAVIGATE', response: () => 'Opening CS playbook.', data: () => ({ dept: 'success' }) },
  { patterns: [/schedule a qbr/i, /book a qbr/i, /qbr scheduler/i], action: 'BOOK_MEETING', response: () => 'Opening QBR scheduler.' },
  { patterns: [/show me the partner dashboard/i, /partner dashboard/i, /open partner dashboard/i], action: 'NAVIGATE', response: () => 'Opening partner dashboard.', data: () => ({ dept: 'success' }) },

  // ─── COMPANY OVERVIEW ──────────────────────────────────────────────────────
  { patterns: [/^good morning$/i, /good morning/i, /morning/i], action: 'PLAY_BRIEFING', response: () => 'Good morning. Starting your briefing now.' },
  { patterns: [/show me today'?s priorities/i, /show me todays priorities/i, /today'?s priorities/i], action: 'NAVIGATE', response: () => 'Opening today\'s priorities.', data: () => ({ dept: 'overview' }) },
  { patterns: [/what'?s happening today/i, /whats happening today/i, /what is happening today/i], action: 'READ_TODAY', response: () => 'Here\'s what\'s happening today.' },
  { patterns: [/show the dashboard/i, /show me the dashboard/i, /open the dashboard/i, /open dashboard/i], action: 'NAVIGATE', response: () => 'Opening the dashboard.', data: () => ({ dept: 'overview' }) },
  { patterns: [/give me a summary/i, /executive summary/i, /summarise everything/i, /summarize everything/i], action: 'PLAY_BRIEFING', response: () => 'Starting your executive briefing now.' },
  { patterns: [/show me insights/i, /show insights/i, /open insights/i], action: 'NAVIGATE', response: () => 'Opening insights.', data: () => ({ dept: 'overview' }) },
  { patterns: [/what'?s our company health/i, /whats our company health/i, /company health/i, /company health score/i], action: 'OVERVIEW_INFO', response: () => 'Company health score is 82 out of 100.' },
  { patterns: [/show key metrics/i, /key metrics/i, /kpi dashboard/i, /show kpis/i], action: 'NAVIGATE', response: () => 'Opening KPI dashboard.', data: () => ({ dept: 'overview' }) },
  { patterns: [/any urgent items/i, /urgent items/i, /anything urgent/i, /what'?s urgent/i], action: 'OVERVIEW_INFO', response: () => '2 urgent items flagged today.' },
  { patterns: [/show me what i missed/i, /what did i miss/i, /catch me up/i, /what i missed/i], action: 'NAVIGATE', response: () => 'Showing activity since your last login.', data: () => ({ dept: 'overview' }) },
  { patterns: [/read my messages/i, /show my messages/i, /open messages/i], action: 'NAVIGATE', response: () => 'Opening messages.', data: () => ({ dept: 'overview' }) },
  { patterns: [/show board messages/i, /board messages/i, /board communications/i], action: 'NAVIGATE', response: () => 'Opening board communications.', data: () => ({ dept: 'overview' }) },
  { patterns: [/any media alerts/i, /media alerts/i, /press alerts/i], action: 'OVERVIEW_INFO', response: () => 'No media alerts today.' },
  { patterns: [/show staff updates/i, /staff updates/i, /people updates/i], action: 'NAVIGATE', response: () => 'Opening staff updates.', data: () => ({ dept: 'hr' }) },
  { patterns: [/what'?s on this week/i, /whats on this week/i, /this week'?s schedule/i], action: 'READ_TODAY', response: () => 'Here\'s your week at a glance.' },
  { patterns: [/remind me of my goals/i, /my goals/i, /my okrs/i, /quarterly goals/i], action: 'OVERVIEW_INFO', response: () => 'Opening your OKRs and quarterly goals.' },
  { patterns: [/show company announcements/i, /company announcements/i, /announcements/i], action: 'NAVIGATE', response: () => 'Opening announcements.', data: () => ({ dept: 'overview' }) },
  { patterns: [/connect my tools/i, /open integrations/i, /show integrations/i], action: 'NAVIGATE', response: () => 'Opening integrations.', data: () => ({ dept: 'settings' }) },
  { patterns: [/show the settings/i, /open settings/i, /show settings/i], action: 'NAVIGATE', response: () => 'Opening settings.', data: () => ({ dept: 'settings' }) },
  { patterns: [/log out/i, /sign out/i, /log me out/i], action: 'LOGOUT', response: () => 'Are you sure you want to log out?' },

  // ─── HELP (updated) ────────────────────────────────────────────────────────
  { patterns: [/help/i, /what can you do/i, /commands/i], action: 'HELP', response: () => "You can say things like: show me the pipeline, what's our revenue, how many staff, show marketing, show customer success, show the support queue, book a meeting, add a task, log a call, or navigate to any department. Say 'good morning' for your briefing." },
]

export function useVoiceCommands() {
  const recognitionRef = useRef<any>(null)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [lastCommand, setLastCommand] = useState<VoiceCommandResult | null>(null)
  const [pendingAction, setPendingAction] = useState<{ type: string; data?: any } | null>(null)

  const processCommand = useCallback((text: string): VoiceCommandResult => {
    for (const cmd of COMMANDS) {
      for (const pattern of cmd.patterns) {
        const match = text.match(pattern)
        if (match) return { command: text, action: cmd.action, response: cmd.response(match, text), data: cmd.data?.(match, text) }
      }
    }
    return { command: text, action: 'UNKNOWN', response: `I heard "${text}" but I'm not sure what to do. Say "help" for a list of commands.` }
  }, [])

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    const recognition = new SR()
    recognition.lang = 'en-GB'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.continuous = false
    recognition.onresult = (e: any) => { const text = e.results[0][0].transcript; setTranscript(text); setLastCommand(processCommand(text)) }
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }, [processCommand])

  const stopListening = useCallback(() => { recognitionRef.current?.stop(); setIsListening(false) }, [])

  return { isListening, transcript, lastCommand, startListening, stopListening, pendingAction, setPendingAction }
}
