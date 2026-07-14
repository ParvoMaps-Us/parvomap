import { sendMorningBrief, type MorningBrief } from '@/lib/notifications'

/**
 * Cron job — builds a daily "morning brief" (weather + top headlines) and emails
 * it via the existing Resend sender. Runs entirely on Vercel's infrastructure, so
 * it fires on schedule regardless of whether any laptop is on.
 *
 * Config (env vars, all optional — sensible fallbacks below):
 *   BRIEF_EMAIL     recipient (defaults to the owner's Gmail)
 *   BRIEF_LAT       latitude for weather
 *   BRIEF_LON       longitude for weather
 *   BRIEF_PLACE     display name of the city, e.g. "Salt Lake City"
 *   BRIEF_TIMEZONE  IANA tz for date formatting, e.g. "America/Denver"
 *
 * Scheduled in vercel.json. NOTE: Vercel cron times are UTC.
 */

const RECIPIENT = process.env.BRIEF_EMAIL || '10.4dookie@gmail.com'
const LAT = process.env.BRIEF_LAT || '40.2969'   // Orem, UT
const LON = process.env.BRIEF_LON || '-111.6946'
const PLACE = process.env.BRIEF_PLACE || 'Orem'
const TIMEZONE = process.env.BRIEF_TIMEZONE || 'America/Denver'

// Open-Meteo WMO weather codes → short human labels.
const WMO: Record<number, string> = {
  0: 'clear', 1: 'mostly clear', 2: 'partly cloudy', 3: 'overcast',
  45: 'fog', 48: 'rime fog', 51: 'light drizzle', 53: 'drizzle', 55: 'heavy drizzle',
  61: 'light rain', 63: 'rain', 65: 'heavy rain', 66: 'freezing rain', 67: 'freezing rain',
  71: 'light snow', 73: 'snow', 75: 'heavy snow', 77: 'snow grains',
  80: 'rain showers', 81: 'rain showers', 82: 'violent rain showers',
  85: 'snow showers', 86: 'snow showers',
  95: 'thunderstorms', 96: 'thunderstorms w/ hail', 99: 'thunderstorms w/ hail',
}

async function getWeather(): Promise<string | null> {
  if (!LAT || !LON) return null
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
      `&current=temperature_2m,weather_code` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
      `&temperature_unit=fahrenheit&timezone=auto&forecast_days=1`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    const d = await res.json()
    const now = Math.round(d?.current?.temperature_2m)
    const code = d?.current?.weather_code
    const hi = Math.round(d?.daily?.temperature_2m_max?.[0])
    const lo = Math.round(d?.daily?.temperature_2m_min?.[0])
    const pop = d?.daily?.precipitation_probability_max?.[0]
    const cond = WMO[code] ?? 'mixed conditions'
    const parts = [`${now}°F, ${cond}`]
    if (Number.isFinite(hi) && Number.isFinite(lo)) parts.push(`high ${hi}° / low ${lo}°`)
    if (Number.isFinite(pop)) parts.push(`${pop}% chance of precipitation`)
    return parts.join(' · ')
  } catch {
    return null
  }
}

async function getHeadlines(): Promise<string[]> {
  try {
    const res = await fetch(
      'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en',
      { cache: 'no-store', headers: { 'User-Agent': 'Mozilla/5.0 (morning-brief cron)' } }
    )
    if (!res.ok) return []
    const xml = await res.text()
    const titles: string[] = []
    const re = /<item>[\s\S]*?<title>([\s\S]*?)<\/title>/g
    let m: RegExpExecArray | null
    while ((m = re.exec(xml)) && titles.length < 5) {
      const t = m[1]
        .replace(/<!\[CDATA\[|\]\]>/g, '')
        .replace(/&amp;/g, '&')
        .trim()
      if (t) titles.push(t)
    }
    return titles
  } catch {
    return []
  }
}

export async function GET(req: Request) {
  // Bearer-token guard — same pattern as the other crons.
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const dateLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', timeZone: TIMEZONE,
  }).format(new Date())

  const [weather, headlines] = await Promise.all([getWeather(), getHeadlines()])

  const brief: MorningBrief = { dateLabel, weather, headlines, place: PLACE }

  try {
    await sendMorningBrief(RECIPIENT, brief)
  } catch (e) {
    console.error('Morning brief send failed:', e)
    return Response.json({ ok: false, error: String(e) }, { status: 500 })
  }

  return Response.json({ ok: true, weather: Boolean(weather), headlines: headlines.length })
}
