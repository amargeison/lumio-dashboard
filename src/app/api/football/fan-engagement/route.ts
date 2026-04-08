import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const clubId = sp.get('clubId')
    const period = sp.get('period') ?? 'season'
    if (!clubId) return NextResponse.json(null)

    const supabase = getSupabase()
    if (!supabase) return NextResponse.json(null)

    const days = period === '30d' ? 30 : period === '90d' ? 90 : 240
    const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)
    const previousCutoff = new Date(Date.now() - days * 2 * 86400000).toISOString().slice(0, 10)

    const [
      { data: metricsData },
      { data: npsData },
      { data: socialData },
      { data: ticketsData },
      { data: journeyData },
      { data: competitorData },
    ] = await Promise.all([
      supabase.from('football_fan_metrics').select('*').eq('club_id', clubId).gte('metric_date', previousCutoff).order('metric_date', { ascending: false }),
      supabase.from('football_nps_surveys').select('*').eq('club_id', clubId).order('survey_date', { ascending: false }),
      supabase.from('football_social_mentions').select('*').eq('club_id', clubId).gte('mention_date', previousCutoff).order('mention_date', { ascending: false }),
      supabase.from('football_season_tickets').select('*').eq('club_id', clubId).order('season', { ascending: false }),
      supabase.from('football_fan_journey').select('*').eq('club_id', clubId).order('recorded_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('football_competitor_metrics').select('*').eq('club_id', clubId).order('created_at', { ascending: false }),
    ])

    const metrics = metricsData ?? []
    const nps = npsData ?? []
    const social = socialData ?? []
    const tickets = ticketsData ?? []

    // Attendance
    const attendanceRows = metrics.filter((m) => m.metric_type === 'attendance' && m.metric_date >= cutoff)
    const prevAttendanceRows = metrics.filter((m) => m.metric_type === 'attendance' && m.metric_date < cutoff)
    const avgAtt = attendanceRows.length > 0 ? attendanceRows.reduce((a, m) => a + Number(m.value), 0) / attendanceRows.length : 0
    const prevAvgAtt = prevAttendanceRows.length > 0 ? prevAttendanceRows.reduce((a, m) => a + Number(m.value), 0) / prevAttendanceRows.length : 0
    const attTrend = prevAvgAtt > 0 ? ((avgAtt - prevAvgAtt) / prevAvgAtt) * 100 : 0
    const high = attendanceRows.length > 0 ? Math.max(...attendanceRows.map((m) => Number(m.value))) : 0
    const low = attendanceRows.length > 0 ? Math.min(...attendanceRows.map((m) => Number(m.value))) : 0

    // NPS
    const currentNps = nps[0]?.nps_score ?? 0
    const prevNps = nps[1]?.nps_score ?? 0
    const npsTrend = Number(currentNps) - Number(prevNps)

    // Social (within current period)
    const socialCurrent = social.filter((s) => s.mention_date >= cutoff)
    const socialPrev = social.filter((s) => s.mention_date < cutoff)
    const overallScore = socialCurrent.length > 0 ? socialCurrent.reduce((a, s) => a + Number(s.sentiment_score), 0) / socialCurrent.length : 0
    const prevOverall = socialPrev.length > 0 ? socialPrev.reduce((a, s) => a + Number(s.sentiment_score), 0) / socialPrev.length : 0
    const sentimentTrend = overallScore - prevOverall

    const platforms = ['Twitter', 'Instagram', 'Facebook', 'TikTok', 'Reddit'] as const
    const byPlatform = platforms.map((p) => {
      const rows = socialCurrent.filter((s) => s.platform === p)
      const score = rows.length > 0 ? rows.reduce((a, r) => a + Number(r.sentiment_score), 0) / rows.length : 0
      const mentions = rows.reduce((a, r) => a + Number(r.mention_count), 0)
      return { platform: p, score, mentions }
    })

    // Season tickets
    const currentTicket = tickets[0] ?? null
    const previousTicket = tickets[1] ?? null
    const renewalTrend = currentTicket && previousTicket ? Number(currentTicket.renewal_rate) - Number(previousTicket.renewal_rate) : 0

    return NextResponse.json({
      attendanceSummary: {
        average: Math.round(avgAtt),
        highest: high,
        lowest: low,
        trend: Math.round(attTrend * 10) / 10,
        history: attendanceRows.map((m) => ({ date: m.metric_date, value: Number(m.value), opponent: m.notes })),
      },
      npsSummary: {
        current: Number(currentNps),
        trend: Math.round(npsTrend * 10) / 10,
        history: nps,
      },
      seasonTickets: {
        current: currentTicket,
        previous: previousTicket,
        renewalTrend: Math.round(renewalTrend * 10) / 10,
        all: tickets,
      },
      socialSentiment: {
        overallScore: Math.round(overallScore * 10) / 10,
        trend: Math.round(sentimentTrend * 10) / 10,
        byPlatform,
        history: socialCurrent.map((s) => ({ date: s.mention_date, score: Number(s.sentiment_score), platform: s.platform, keywords: s.top_keywords })),
      },
      fanMetrics: metrics.filter((m) => m.metric_date >= cutoff),
      fanJourney: journeyData ?? null,
      competitors: competitorData ?? [],
    })
  } catch (err) {
    console.error('[fan-engagement GET]', err)
    return NextResponse.json(null)
  }
}
