import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    wins: [
      { id: '1', title: 'Chase Bramble Hill Trust invoice', description: 'Invoice #1047 is 30 days overdue. One click fires the AC-03 chase sequence.', impact: 'high', effort: '2min', category: 'Finance', action: 'Run AC-03 chase', source: 'Xero', done: false },
      { id: '2', title: 'Whitestone College health score is 34', description: 'Below 40-point threshold. Send account manager check-in now.', impact: 'high', effort: '2min', category: 'Customer Success', action: 'Send check-in', source: 'CS-01', done: false },
      { id: '3', title: '3 LinkedIn messages unanswered', description: 'Two from potential customers who visited pricing page.', impact: 'medium', effort: '5min', category: 'Sales', action: 'Open LinkedIn', actionUrl: 'https://linkedin.com/messaging', source: 'LinkedIn', done: false },
      { id: '4', title: 'Approve 2 pending leave requests', description: 'Emma Clarke (2 days) and Noah Thomas (1 day) waiting for approval.', impact: 'medium', effort: '2min', category: 'HR', action: 'Review requests', source: 'HR workflows', done: false },
    ],
  })
}
