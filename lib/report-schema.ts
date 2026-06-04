import { z } from 'zod'

export const SOURCE_VALUES = [
  'vet-diagnosed',
  'positive-test',
  'owner-observed',
  'neighbor-report',
  'social-media',
  'other',
] as const

// Who is submitting. Drives follow-up questions, confidence, and lead routing.
export const REPORTER_TYPES = ['individual', 'vet', 'facility', 'news'] as const

// Place-based environmental hazards: tied to a specific lake/canyon/trail, not a
// sick dog. These get an optional "specific location" field on the form.
export const LOCATION_DETAIL_DISEASES = ['cyano', 'tickspot'] as const

export const ReportSchema = z.object({
  disease: z.string().min(1, 'Disease is required'),
  zip: z.string().regex(/^\d{5}$/, 'ZIP must be 5 digits'),
  reporterType: z.enum(REPORTER_TYPES),
  // For individuals only: true = "just reporting a sighting" (not their own dog).
  // Absent/false for an affected owner, vet, or facility.
  sighting: z.boolean().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  source: z.enum(SOURCE_VALUES).optional(),
  breed: z.string().max(50).optional(),
  notes: z.string().max(280).optional(),
  // Specific spot for place-based hazards (lake/canyon/trail name or coordinates).
  locationDetail: z.string().max(120).optional(),
  // Exact coordinates captured when the reporter picks a place from autocomplete.
  locationLat: z.number().min(-90).max(90).optional(),
  locationLng: z.number().min(-180).max(180).optional(),
  // Source article link for news/media reports. http(s) only (popup renders it).
  sourceUrl: z
    .string()
    .max(500)
    .optional()
    .refine(u => !u || /^https?:\/\/.+/i.test(u), 'Link must be a valid http(s) URL'),
})

export type ReportInput = z.infer<typeof ReportSchema>
