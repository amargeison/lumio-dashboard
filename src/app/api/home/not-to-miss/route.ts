import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    items: [
      { id: '1', urgency: 'critical', title: 'Payment terms not yet set on client contracts', body: 'Three new client contracts have been signed without payment terms defined. Finance team need sign-off before first invoices are raised.', deadline: 'Before first invoice', consequence: 'Invoicing disputes risk', action: 'Review Contracts', category: 'Finance', dismissed: false },
      { id: '2', urgency: 'critical', title: 'NDA outstanding — Bramble Hill partnership', body: 'Bramble Hill have requested an NDA before sharing their technical requirements. Legal have drafted it but it has not been sent for signature.', deadline: 'Before next client call', consequence: 'Partnership stalls', action: 'Send NDA', category: 'Legal', dismissed: false },
      { id: '3', urgency: 'today', title: 'Proposal due — Greenfield Group', body: 'Proposal requested by Greenfield Group CEO after last week\'s demo. Deadline is end of business today. Three slides still need revenue projections added.', deadline: 'Today', consequence: 'Lose the deal', action: 'Open Proposal', category: 'Sales', dismissed: false },
      { id: '4', urgency: 'today', title: 'Q2 board report — data not yet pulled', body: 'Board meeting is Thursday. The Q2 report template is ready but revenue, churn, and NPS data has not been pulled from the integrations.', deadline: 'This week', consequence: 'Unprepared for board', action: 'Open Board Report', category: 'Operations', dismissed: false },
      { id: '5', urgency: 'soon', title: 'Three team members — probation reviews overdue', body: 'Probation reviews for Sarah (Marketing), Tom (Engineering), and Priya (Success) were due last week. HR have flagged this twice.', deadline: 'Before end of month', consequence: 'HR compliance risk', action: 'Open HR Dashboard', category: 'HR', dismissed: false },
      { id: '6', urgency: 'soon', title: 'Website case study — approval pending', body: 'Bramble Hill case study is written and designed. Awaiting sign-off from their marketing director before publishing.', deadline: 'Next week', consequence: 'Delay lead generation content', action: 'Chase Approval', category: 'Marketing', dismissed: false },
    ],
  })
}
