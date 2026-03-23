import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const lat      = process.env.USER_LAT      || '52.04'
    const lon      = process.env.USER_LON      || '-0.76'
    const location = process.env.USER_LOCATION || 'Milton Keynes'

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&temperature_unit=celsius&timezone=Europe/London`
    const res  = await fetch(url, { next: { revalidate: 1800 } })
    const data = await res.json()

    const temp = Math.round(data.current.temperature_2m)
    const code = data.current.weather_code

    const condition =
      code === 0  ? 'Sunny' :
      code <= 3   ? 'Partly cloudy' :
      code <= 49  ? 'Foggy' :
      code <= 57  ? 'Drizzle' :
      code <= 67  ? 'Rain' :
      code <= 77  ? 'Snow' :
      code <= 82  ? 'Rain showers' :
      code <= 99  ? 'Storm' : 'Cloudy'

    return NextResponse.json({ temp: `${temp}°C`, condition, location })
  } catch {
    return NextResponse.json({
      temp: '--', condition: 'Unavailable',
      location: process.env.USER_LOCATION || 'Milton Keynes',
    })
  }
}
