import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const FALLBACK_INSIGHTS = [
  { id: '1', type: 'alert', title: '7 customers below health score threshold', body: 'CS-01 detected 7 accounts below 40 points. At-risk customers are 3× more likely to churn.', metric: '7 at risk', metricChange: '+2 since last week', positive: false, action: 'View at-risk', source: 'CS-01 Health Engine', generated: '07:00' },
  { id: '2', type: 'opportunity', title: '4 hot Zendesk Sell migration leads scored 80+', body: 'SA-02 has scored 4 Zendesk Sell users at 80+ this week. Two have visited pricing twice.', metric: '4 leads', metricChange: 'Score: 80–92', positive: true, action: 'View leads', source: 'SA-02 Lead Scoring', generated: '07:00' },
  { id: '3', type: 'trend', title: 'Trial-to-paid conversion is 12% this month', body: '3 of the last 25 demo signups converted to paid plans. Industry benchmark is 5–8%.', metric: '12%', metricChange: '+4% vs last month', positive: true, source: 'Demo analytics', generated: '06:00' },
  { id: '4', type: 'achievement', title: 'HR-01 saved 47 hours of admin this month', body: 'New joiner onboarding ran 12 times. Average 3.9 hours saved per activation. £1,128 in staff time.', metric: '47h saved', metricChange: '£1,128 value', positive: true, source: 'HR-01 execution logs', generated: '06:00' },
]

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('home_insights')
      .select('insights')
      .eq('date', today)
      .maybeSingle()

    return NextResponse.json({ insights: data?.insights || FALLBACK_INSIGHTS })
  } catch {
    return NextResponse.json({ insights: FALLBACK_INSIGHTS })
  }
}
