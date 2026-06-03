export interface GeoResult {
  lat: number
  lng: number
  city: string
  state: string
  county?: string
}

/**
 * Geocode a US ZIP code using the free zippopotam.us API.
 * No API key required. Returns null if the ZIP is invalid or lookup fails.
 */
export async function geocodeZip(zip: string): Promise<GeoResult | null> {
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`, {
      next: { revalidate: 86400 }, // cache 24h — ZIP→geo never changes
    })
    if (!res.ok) return null

    const data = await res.json()
    const place = data.places?.[0]
    if (!place) return null

    return {
      lat:    parseFloat(place.latitude),
      lng:    parseFloat(place.longitude),
      city:   place['place name'],
      state:  place['state abbreviation'],
      county: undefined, // zippopotam doesn't return county
    }
  } catch {
    return null
  }
}
