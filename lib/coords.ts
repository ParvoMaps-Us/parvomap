/**
 * Pull a "lat, lng" pair out of free text (the location-detail field), so a
 * report tied to a specific spot can drop its pin exactly there instead of at
 * the ZIP centroid. Returns null for plain place names ("Utah Lake").
 *
 * Requires a comma/slash separator (not a bare space, which is too common in
 * place names) and validates the pair falls within North America.
 */
export function parseCoordinates(text?: string | null): { lat: number; lng: number } | null {
  if (!text) return null
  const m = text.match(/(-?\d{1,2}(?:\.\d+)?)\s*[,/]\s*(-?\d{1,3}(?:\.\d+)?)/)
  if (!m) return null

  const lat = parseFloat(m[1])
  const lng = parseFloat(m[2])
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null

  // Roughly North America — rejects noise and out-of-region numbers.
  if (lat < 15 || lat > 72 || lng < -170 || lng > -50) return null

  return { lat, lng }
}

/**
 * Great-circle distance in miles between two points. Used by the ZIP search to
 * answer "how many cases are near me" without a spatial index — at a few
 * hundred pins a linear scan is far cheaper than anything cleverer.
 */
export function milesBetween(
  aLat: number, aLng: number,
  bLat: number, bLng: number,
): number {
  const R = 3958.8
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(bLat - aLat)
  const dLng = rad(bLng - aLng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
