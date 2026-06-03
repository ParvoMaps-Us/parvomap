import { getReports } from '@/lib/redis'

export async function GET() {
  try {
    const reports = await getReports({ limit: 200 })

    // Strip private fields — never expose email, breed, source, notes publicly
    const public_reports = reports.map(({ id, disease, zip, state, city, lat, lng, timestamp, verified }) => ({
      id,
      disease,
      zip,
      state,
      city,
      lat,
      lng,
      timestamp,
      verified,
    }))

    return Response.json({ reports: public_reports })
  } catch (e) {
    console.error('Reports GET error:', e)
    return Response.json({ reports: [] })
  }
}
