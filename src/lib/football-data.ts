// ═══════════════════════════════════════════════════════════════════════════════
// Football live-data fetch layer
// All functions return null on failure — never throw.
// ═══════════════════════════════════════════════════════════════════════════════

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { ApiFixture, ApiPlayer } from './api-football'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FootballClub {
  id: string
  slug: string
  name: string
  short_name: string | null
  logo_url: string | null
  primary_colour: string | null
  secondary_colour: string | null
  league: string | null
  team_id_api_football: number | null
  api_league_id: number | null
  api_season: number | null
  tier?: 'starter' | 'professional' | 'elite' | 'enterprise' | null
  tier_expires_at?: string | null
  trial_ends_at?: string | null
  avg_ticket_price?: number | null
  ground_capacity?: number | null
  created_at: string
}

export interface FootballPlayer {
  id: string
  club_id: string
  name: string
  position: 'GK' | 'DEF' | 'MID' | 'FWD'
  squad_number: number | null
  nationality: string | null
  date_of_birth: string | null
  photo_url: string | null
  status: 'fit' | 'injured' | 'suspended' | 'doubt'
  injury_details: string | null
  return_date: string | null
  created_at: string
}

export interface FootballContract {
  id: string
  player_id: string
  club_id: string
  start_date: string | null
  end_date: string | null
  weekly_wage: number | null
  release_clause: number | null
  option_to_extend: boolean
  created_at: string
}

export interface FootballFixture {
  id: string
  club_id: string
  opponent: string
  venue: 'Home' | 'Away' | null
  competition: string | null
  kickoff_time: string | null
  result_home: number | null
  result_away: number | null
  created_at: string
}

export interface FootballFinance {
  id: string
  wage_budget_total: number
  wage_budget_used: number
  transfer_budget: number
  transfer_budget_used: number
  updated_at: string
}

// ─── Client helper ───────────────────────────────────────────────────────────

function getClient(): SupabaseClient | null {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return null
    return createClient(url, key)
  } catch {
    return null
  }
}

// ─── Fetch functions ─────────────────────────────────────────────────────────

export async function getFootballClub(slug: string): Promise<FootballClub | null> {
  const supabase = getClient()
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('football_clubs')
      .select('*')
      .eq('slug', slug)
      .single()
    if (error || !data) return null
    return data as FootballClub
  } catch {
    return null
  }
}

export async function getFootballSquad(clubId: string): Promise<FootballPlayer[] | null> {
  const supabase = getClient()
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('football_players')
      .select('*')
      .eq('club_id', clubId)
      .order('squad_number', { ascending: true })
    if (error || !data) return null
    return data as FootballPlayer[]
  } catch {
    return null
  }
}

export async function getFootballContracts(clubId: string): Promise<FootballContract[] | null> {
  const supabase = getClient()
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('football_contracts')
      .select('*')
      .eq('club_id', clubId)
      .order('end_date', { ascending: true })
    if (error || !data) return null
    return data as FootballContract[]
  } catch {
    return null
  }
}

export async function getFootballFixtures(clubId: string): Promise<FootballFixture[] | null> {
  const supabase = getClient()
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('football_fixtures')
      .select('*')
      .eq('club_id', clubId)
      .order('kickoff_time', { ascending: true })
    if (error || !data) return null
    return data as FootballFixture[]
  } catch {
    return null
  }
}

export async function getFootballFinance(clubId: string): Promise<FootballFinance | null> {
  const supabase = getClient()
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('football_finance')
      .select('*')
      .eq('id', clubId)
      .single()
    if (error || !data) return null
    return data as FootballFinance
  } catch {
    return null
  }
}

// ─── Mock-shape types (shared with page.tsx in-file render layer) ────────────

export type MockFitnessStatus = 'fit' | 'injured' | 'suspended' | 'modified' | 'doubt'

export interface MockPlayer {
  id?: string
  name: string
  number: number
  position: string
  nationality: string
  age: number
  contractExpiry: string
  marketValue: string
  fitness: MockFitnessStatus
  lastRating: number
  goals: number
  assists: number
  stats?: { PAC: number; SHO: number; PAS: number; DRI: number; DEF: number; PHY: number }
}

export interface MockFixture {
  opponent: string
  date: string
  time: string
  venue: string
  competition: string
  result?: string
}

export interface MockContract {
  player: string
  position: string
  weeklyWage: string
  end: string
  status: 'Offered' | 'Negotiating' | 'Signed' | 'No Action'
  agent: string
}

export interface MockFinance {
  transferBudget: string
  wageBill: string
  revenueYTD: string
  wageRevRatio: string
}

// ─── Adapters: DB rows → in-file mock shapes ─────────────────────────────────

function hash(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

function computeAge(dob: string | null): number {
  if (!dob) return 0
  const d = new Date(dob)
  if (isNaN(d.getTime())) return 0
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age
}

function formatGBP(n: number): string {
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(1)}m`
  if (n >= 1_000) return `£${Math.round(n / 1_000)}k`
  return `£${n}`
}

export function adaptDBSquad(rows: FootballPlayer[]): MockPlayer[] {
  return rows.map((r) => {
    // fitness rating derived but MockPlayer only stores categorical fitness
    void hash(r.id)
    const fitness: MockFitnessStatus =
      r.status === 'fit' ? 'fit'
      : r.status === 'injured' ? 'injured'
      : r.status === 'suspended' ? 'suspended'
      : 'doubt'
    return {
      id: r.id,
      name: r.name,
      number: r.squad_number ?? 0,
      position: r.position,
      nationality: r.nationality ?? '',
      age: computeAge(r.date_of_birth),
      contractExpiry: '—',
      marketValue: '—',
      fitness,
      lastRating: 0,
      goals: 0,
      assists: 0,
    }
  })
}

export function adaptDBFixtures(rows: FootballFixture[]): MockFixture[] {
  return rows.map((r) => {
    let date = '—'
    let time = '—'
    if (r.kickoff_time) {
      const d = new Date(r.kickoff_time)
      if (!isNaN(d.getTime())) {
        date = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
        time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
      }
    }
    const result =
      r.result_home != null && r.result_away != null
        ? `${r.result_home}-${r.result_away}`
        : undefined
    return {
      opponent: r.opponent,
      date,
      time,
      venue: r.venue ?? 'Home',
      competition: r.competition ?? '',
      result,
    }
  })
}

export function adaptDBContracts(
  rows: FootballContract[],
  squad: FootballPlayer[]
): MockContract[] {
  return rows.map((r) => {
    const matched = squad.find((p) => p.id === r.player_id)
    const name = matched?.name ?? `Player ${r.player_id.slice(0, 6)}`
    const position = matched?.position ?? '—'
    let end = '—'
    if (r.end_date) {
      const d = new Date(r.end_date)
      if (!isNaN(d.getTime())) {
        end = d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
      }
    }
    return {
      player: name,
      position,
      weeklyWage: r.weekly_wage != null ? `${formatGBP(r.weekly_wage)}/wk` : '—',
      end,
      status: 'Offered',
      agent: 'N/A',
    }
  })
}

// ─── API-Football → mock-shape adapters ──────────────────────────────────────

export function adaptAPIFixtures(fixtures: ApiFixture[]): MockFixture[] {
  return fixtures.map((f) => {
    const result =
      f.homeScore != null && f.awayScore != null
        ? `${f.homeScore}-${f.awayScore}`
        : undefined
    return {
      opponent: `${f.homeTeam} vs ${f.awayTeam}`,
      date: f.date,
      time: f.time,
      venue: f.venue || 'Home',
      competition: f.competition,
      result,
    }
  })
}

export function mergePlayerStats(squad: MockPlayer[], apiPlayers: ApiPlayer[]): MockPlayer[] {
  if (!apiPlayers || apiPlayers.length === 0) return squad
  return squad.map((p) => {
    const target = p.name.toLowerCase()
    const match = apiPlayers.find((ap) => {
      const an = ap.name.toLowerCase()
      return an === target || an.includes(target) || target.includes(an)
    })
    if (!match) return p
    return {
      ...p,
      goals: match.goals ?? p.goals,
      assists: match.assists ?? p.assists,
      lastRating: match.rating ?? p.lastRating,
    }
  })
}

export function adaptDBFinance(row: FootballFinance): MockFinance {
  const transferRemaining = row.transfer_budget - row.transfer_budget_used
  const ratio =
    row.wage_budget_total > 0
      ? Math.round((row.wage_budget_used / row.wage_budget_total) * 100)
      : 0
  return {
    transferBudget: formatGBP(transferRemaining),
    wageBill: `${formatGBP(row.wage_budget_used)}/wk`,
    revenueYTD: '£3.4m',
    wageRevRatio: `${ratio}%`,
  }
}
