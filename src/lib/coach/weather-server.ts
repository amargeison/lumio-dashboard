// Fetching the forecast for a venue (server only).
//
//   1. Where is it? Worked out once from the postcode in the venue's address,
//      using postcodes.io (free, open data, no key) and kept on the venue.
//   2. What will the weather do? The Met Office's Global Spot hourly forecast.
//      The free plan allows 360 requests a day, so each venue's forecast is kept
//      for three hours (coach_weather) and shared by everything that asks.
//
// No key (MET_OFFICE_API_KEY unset), no postcode, or the service down: the
// answer is "no forecast", and every message simply leaves the weather out.

import type { SupabaseClient } from '@supabase/supabase-js'
import { parseMetOffice, postcodeIn, type Hour } from './weather'

const KEEP_MS = 3 * 3_600_000
const RETRY_GEOCODE_MS = 24 * 3_600_000
const MET_URL = 'https://data.hub.api.metoffice.gov.uk/sitespecific/v0/point/hourly'

type Venue = { id: string; coach_id?: string | null; address?: string | null; lat?: number | null; lng?: number | null; geocoded_at?: string | null }

export const weatherOn = () => !!process.env.MET_OFFICE_API_KEY

async function getJson(url: string, init?: RequestInit, ms = 8000): Promise<unknown | null> {
  const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), ms)
  try {
    const r = await fetch(url, { ...init, signal: ctl.signal, cache: 'no-store' })
    if (!r.ok) return null
    return await r.json()
  } catch { return null } finally { clearTimeout(timer) }
}

/** The venue's position, looked up from its postcode the first time it is needed. */
export async function venuePoint(db: SupabaseClient, v: Venue): Promise<{ lat: number; lng: number } | null> {
  if (typeof v.lat === 'number' && typeof v.lng === 'number') return { lat: v.lat, lng: v.lng }
  if (v.geocoded_at && Date.now() - Date.parse(v.geocoded_at) < RETRY_GEOCODE_MS) return null
  const pc = postcodeIn(v.address)
  let point: { lat: number; lng: number } | null = null
  if (pc) {
    const d = await getJson(`https://api.postcodes.io/postcodes/${encodeURIComponent(pc)}`) as { result?: { latitude?: number; longitude?: number } } | null
    const lat = d?.result?.latitude, lng = d?.result?.longitude
    if (typeof lat === 'number' && typeof lng === 'number') point = { lat, lng }
  }
  await db.from('coach_venues').update({ lat: point?.lat ?? null, lng: point?.lng ?? null, geocoded_at: new Date().toISOString() }).eq('id', v.id)
  return point
}

/** The next two days, hour by hour, for one venue — or [] when there is no forecast to be had. */
export async function venueForecast(db: SupabaseClient, v: Venue): Promise<Hour[]> {
  const key = process.env.MET_OFFICE_API_KEY
  if (!key || !v.coach_id) return []
  const { data: kept } = await db.from('coach_weather').select('fetched_at, series').eq('venue_id', v.id).maybeSingle()
  if (kept && Date.now() - Date.parse(kept.fetched_at as string) < KEEP_MS) return (kept.series as Hour[]) || []
  const point = await venuePoint(db, v)
  if (!point) return []
  const q = new URLSearchParams({ latitude: point.lat.toFixed(4), longitude: point.lng.toFixed(4), dataSource: 'BD1', excludeParameterMetadata: 'true', includeLocationName: 'false' })
  const json = await getJson(`${MET_URL}?${q}`, { headers: { apikey: key, accept: 'application/json' } })
  const series = json ? parseMetOffice(json) : []
  if (series.length) {
    await db.from('coach_weather').upsert({ venue_id: v.id, coach_id: v.coach_id, fetched_at: new Date().toISOString(), series })
  }
  // A failed fetch falls back to an older forecast if there is one: better a
  // forecast from this morning than none.
  return series.length ? series : ((kept?.series as Hour[]) || [])
}
