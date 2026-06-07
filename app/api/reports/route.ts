import { getReports } from '@/lib/redis'

export async function GET() {
  try {
    const reports = await getReports({ limit: 200 })

    // Strip private fields — never expose email, breed, source, notes publicly.
    // locationDetail is public (a hazard/exposure spot shown on the map).
    const public_reports = reports.map(
      ({ id, disease, zip, state, city, lat, lng, timestamp, verified, locationDetail, sourceUrl, reporterType, verifiedClinic }) => ({
        id,
        disease,
        zip,
        state,
        city,
        lat,
        lng,
        timestamp,
        verified,
        locationDetail,
        sourceUrl,
        reporterType,
        verifiedClinic,
      })
    )

    return Response.json({ reports: public_reports })
  } catch (e) {
    console.error('Reports GET error:', e)
    return Response.json({ reports: [] })
  }
}
