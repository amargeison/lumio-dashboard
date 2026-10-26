// The weather for a lesson, in the words a coach (and a parent) would use.
//
// Forecasts come from the Met Office's Global Spot service (hourly, two days
// ahead), fetched on the server — see weather-server.ts. This file is pure: it
// reads that forecast, works out what the hours of one lesson look like, and
// says whether it crosses the coach's own limits for rain and wind.
//
// The Met Office licence asks for "Powered by Met Office data" wherever the
// forecast is shown; WEATHER_CREDIT is that line.

export const WEATHER_CREDIT = 'Powered by Met Office data'

/** One forecast hour. Temperatures in °C, wind in mph, rain chance in %. */
export type Hour = { t: number; tempC: number | null; windMph: number | null; gustMph: number | null; rainPct: number | null; rainMm: number | null; code: number | null }

const MS_TO_MPH = 2.236936
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)

/** Read the Met Office hourly point forecast (GeoJSON). Anything unreadable is skipped, never guessed. */
export function parseMetOffice(json: unknown): Hour[] {
  const f = (json as { features?: { properties?: { timeSeries?: unknown[] } }[] } | null)?.features?.[0]
  const rows = Array.isArray(f?.properties?.timeSeries) ? f!.properties!.timeSeries! : []
  const out: Hour[] = []
  for (const r of rows as Record<string, unknown>[]) {
    // "2026-10-25T20:00Z" — no seconds, which Date reads fine once they are added.
    const raw = String(r?.time ?? '')
    const t = Date.parse(/T\d{2}:\d{2}Z$/.test(raw) ? raw.replace('Z', ':00Z') : raw)
    if (!Number.isFinite(t)) continue
    const wind = num(r.windSpeed10m), gust = num(r.windGustSpeed10m) ?? num(r.max10mWindGust)
    out.push({
      t,
      tempC: num(r.screenTemperature),
      windMph: wind == null ? null : Math.round(wind * MS_TO_MPH),
      gustMph: gust == null ? null : Math.round(gust * MS_TO_MPH),
      rainPct: num(r.probOfPrecipitation),
      rainMm: num(r.totalPrecipAmount) ?? num(r.precipitationRate),
      code: num(r.significantWeatherCode),
    })
  }
  return out.sort((a, b) => a.t - b.t)
}

export type LessonWeather = {
  tempC: number | null; windMph: number | null; gustMph: number | null; rainPct: number | null
  /** e.g. "dry and mild, 14°C" or "showers likely (70%), 9°C, breezy" */
  words: string
  /** True when it crosses the coach's limits. */
  bad: boolean
  why: string[]
}

export type Limits = { rainPct: number; windMph: number }
export const DEFAULT_LIMITS: Limits = { rainPct: 60, windMph: 25 }

const WET = new Set([9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30])
const SNOW = new Set([16, 17, 18, 22, 23, 24, 25, 26, 27])
const THUNDER = new Set([28, 29, 30])

/** The hours a lesson covers: from the hour it starts to the hour it ends (at least one). */
export function hoursFor(series: Hour[], startMs: number, durMin: number): Hour[] {
  const from = Math.floor(startMs / 3_600_000) * 3_600_000
  const to = startMs + Math.max(15, durMin) * 60_000
  const hit = series.filter(h => h.t >= from && h.t < to)
  if (hit.length) return hit
  // A lesson between two forecast points: the nearest one.
  const near = series.reduce<Hour | null>((best, h) => (!best || Math.abs(h.t - startMs) < Math.abs(best.t - startMs) ? h : best), null)
  return near && Math.abs(near.t - startMs) <= 3 * 3_600_000 ? [near] : []
}

const maxOf = (xs: (number | null)[]) => { const v = xs.filter((x): x is number => x != null); return v.length ? Math.max(...v) : null }
const avgOf = (xs: (number | null)[]) => { const v = xs.filter((x): x is number => x != null); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null }

/** What the weather looks like for one lesson, or null with no forecast for that time. */
export function lessonWeather(series: Hour[], startMs: number, durMin: number, limits: Limits = DEFAULT_LIMITS): LessonWeather | null {
  const hrs = hoursFor(series, startMs, durMin)
  if (!hrs.length) return null
  const tempC = avgOf(hrs.map(h => h.tempC))
  const windMph = maxOf(hrs.map(h => h.windMph))
  const gustMph = maxOf(hrs.map(h => h.gustMph))
  const rainPct = maxOf(hrs.map(h => h.rainPct))
  const codes = hrs.map(h => h.code).filter((c): c is number => c != null)

  const why: string[] = []
  if (rainPct != null && rainPct >= limits.rainPct) why.push(`${rainPct}% chance of rain`)
  if (windMph != null && windMph >= limits.windMph) why.push(`wind ${windMph}mph`)
  else if (gustMph != null && gustMph >= limits.windMph + 15) why.push(`gusts ${gustMph}mph`)
  if (codes.some(c => THUNDER.has(c))) why.push('thunder')
  if (codes.some(c => SNOW.has(c))) why.push('snow or sleet')

  const parts: string[] = []
  const wetCode = codes.some(c => WET.has(c))
  if (rainPct == null) parts.push(wetCode ? 'some rain about' : 'dry')
  else if (rainPct < 20 && !wetCode) parts.push('dry')
  else if (rainPct < 40) parts.push('mostly dry')
  else if (rainPct < 60) parts.push(`a chance of showers (${rainPct}%)`)
  else parts.push(`rain likely (${rainPct}%)`)
  const feel = tempC == null ? '' : tempC <= 5 ? 'cold' : tempC <= 11 ? 'cool' : tempC <= 19 ? 'mild' : tempC <= 25 ? 'warm' : 'hot'
  if (feel) parts[0] = `${parts[0]} and ${feel}`
  if (tempC != null) parts.push(`${tempC}°C`)
  if (windMph != null && windMph >= 15) parts.push(windMph >= 25 ? `windy (${windMph}mph)` : 'breezy')
  if (codes.some(c => THUNDER.has(c))) parts.push('thunder possible')
  return { tempC, windMph, gustMph, rainPct, words: parts.join(', '), bad: why.length > 0, why }
}

/** "the weather is looking dry and mild, 14°C" — for the start of a sentence's second half. */
export const weatherSentence = (w: LessonWeather | null) => (w ? `the forecast is ${w.words}` : '')

/** A UK postcode found anywhere in an address, normalised ("SW19 5AE"), or null. */
export function postcodeIn(address?: string | null): string | null {
  const m = String(address || '').toUpperCase().match(/\b([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})\b/)
  return m ? `${m[1]} ${m[2]}` : null
}
