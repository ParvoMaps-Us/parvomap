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

/**
 * Reverse-geocode coordinates → city/state using the free Photon API
 * (same provider the location autocomplete uses). Used when a reporter pins an
 * exact spot in a remote area and skips the ZIP. Returns null on failure;
 * callers should treat city/state as best-effort.
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<{ city?: string; state?: string; county?: string } | null> {
  try {
    const res = await fetch(
      `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&lang=en`,
      { next: { revalidate: 86400 } },
    )
    if (!res.ok) return null

    const data = await res.json()
    const p = data.features?.[0]?.properties as Record<string, string> | undefined
    if (!p) return null

    // US state names come back full ("Utah"); abbreviate to match ZIP geocoding.
    return {
      city:   p.city || p.town || p.village || p.county || undefined,
      state:  US_STATE_ABBR[p.state] ?? p.state ?? undefined,
      county: p.county || undefined,
    }
  } catch {
    return null
  }
}

const US_STATE_ABBR: Record<string, string> = {
  Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA',
  Colorado: 'CO', Connecticut: 'CT', Delaware: 'DE', Florida: 'FL', Georgia: 'GA',
  Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL', Indiana: 'IN', Iowa: 'IA',
  Kansas: 'KS', Kentucky: 'KY', Louisiana: 'LA', Maine: 'ME', Maryland: 'MD',
  Massachusetts: 'MA', Michigan: 'MI', Minnesota: 'MN', Mississippi: 'MS',
  Missouri: 'MO', Montana: 'MT', Nebraska: 'NE', Nevada: 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', Ohio: 'OH', Oklahoma: 'OK',
  Oregon: 'OR', Pennsylvania: 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', Tennessee: 'TN', Texas: 'TX', Utah: 'UT', Vermont: 'VT',
  Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV', Wisconsin: 'WI',
  Wyoming: 'WY', 'District of Columbia': 'DC',
}
